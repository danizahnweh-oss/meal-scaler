import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Calculator, Search, Wand2, Bot, Loader2, Target, ToggleLeft, ToggleRight } from 'lucide-react';

const WORKER_URL = 'https://meal-scale-proxy.sanktannagymnasium.workers.dev';

// Standard-Datenbank MIT realistischen Standard-Portionsgrößen (defaultGrams)
const INITIAL_DB = [
  { id: 1, name: 'Hähnchenbrust', kcal: 165, p: 31, c: 0, f: 3.6, defaultGrams: 150 },
  { id: 2, name: 'Reis (ungekocht)', kcal: 350, p: 7, c: 78, f: 1, defaultGrams: 80 },
  { id: 3, name: 'Brokkoli', kcal: 34, p: 2.8, c: 7, f: 0.2, defaultGrams: 150 },
  { id: 4, name: 'Olivenöl', kcal: 884, p: 0, c: 0, f: 100, defaultGrams: 10 },
  { id: 5, name: 'Magerquark', kcal: 68, p: 12, c: 4, f: 0.2, defaultGrams: 250 },
  { id: 6, name: 'Haferflocken', kcal: 370, p: 13, c: 58, f: 7, defaultGrams: 80 },
  { id: 7, name: 'Whey Protein', kcal: 380, p: 80, c: 5, f: 4, defaultGrams: 30 },
  { id: 8, name: 'Eier', kcal: 155, p: 13, c: 1, f: 11, defaultGrams: 110 },
  { id: 9, name: 'Kartoffeln', kcal: 77, p: 2, c: 17, f: 0.1, defaultGrams: 250 },
  { id: 10, name: 'Rinderhack (light)', kcal: 160, p: 21, c: 0, f: 8, defaultGrams: 150 },
];

const RECIPE_DB = [
  { id: 1, name: 'Hähnchen-Brokkoli-Pfanne', ingredients: [1, 2, 3, 4] },
  { id: 2, name: 'Protein-Porridge', ingredients: [6, 7, 5] },
  { id: 3, name: 'Bauerntopf (Hack & Kartoffeln)', ingredients: [10, 9, 3, 4] },
];

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function App() {
  const [dailyTarget, setDailyTarget] = useState(2400);
  const [foodDb, setFoodDb] = useState(INITIAL_DB);
  const [plan, setPlan] = useState(DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {}));
  const [expandedDay, setExpandedDay] = useState('Montag');

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);

  // KI States
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiRecipeResult, setAiRecipeResult] = useState(null);
  const [aiError, setAiError] = useState('');

  // Flexibler Makro-Rechner State (Ohne Profil-Dropdown)
  const [showMacroCalc, setShowMacroCalc] = useState(false);
  const [userGender, setUserGender] = useState('male');
  const [userAge, setUserAge] = useState(33);
  const [userHeight, setUserHeight] = useState(181);
  const [userWeight, setUserWeight] = useState(98.8);
  const [activityFactor, setActivityFactor] = useState(1.375);
  const [goalDeficit, setGoalDeficit] = useState(-500);

  // Kalorienberechnung (Mifflin-St Jeor Formel)
  const bmr = userGender === 'male'
    ? (10 * userWeight) + (6.25 * userHeight) - (5 * userAge) + 5
    : (10 * userWeight) + (6.25 * userHeight) - (5 * userAge) - 161;

  const tdee = bmr * activityFactor;
  const calculatedTarget = Math.round(tdee + goalDeficit);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestedRecipes([]);
      setAiRecipeResult(null);
      setAiError('');
      return;
    }
    const query = searchQuery.toLowerCase();
    setSuggestedRecipes(RECIPE_DB.filter(r => r.name.toLowerCase().includes(query)));
  }, [searchQuery]);

  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
      }
    }
  };

  const askAIForsuggestion = async () => {
    if (!searchQuery) return;

    setIsGeneratingAI(true);
    setAiError('');
    setAiRecipeResult(null);

    try {
      const dbContext = foodDb.map(f => ({ id: f.id, name: f.name }));
      const promptText = isEmergencyMode
        ? `Der User sucht nach einem Rezept für: "${searchQuery}". Dies ist ein NOTFALL-Modus. Du darfst völlig NEUE Zutaten erfinden, die nicht in der Datenbank sind. Liefere für jede neue Zutat realistische Makronährwerte (kcal, p, c, f) pro 100g UND eine realistische Standard-Portionsgröße in Gramm (defaultGrams) für eine Person mit. Bekannte Zutaten aus dieser Liste dürfen auch genutzt werden: ${JSON.stringify(dbContext)}`
        : `Der User sucht nach einem Rezept für: "${searchQuery}". WICHTIG: Du bist im STRUKTUR-MODUS. Du darfst AUSSCHLIESSLICH Zutaten aus dieser Liste verwenden: ${JSON.stringify(dbContext)}. Erfinde KEINE neuen Zutaten!`;

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              reasoning: { type: "STRING" },
              ingredients: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    isNew: { type: "BOOLEAN" },
                    id: { type: "INTEGER" },
                    name: { type: "STRING" },
                    kcal: { type: "NUMBER" },
                    p: { type: "NUMBER" },
                    c: { type: "NUMBER" },
                    f: { type: "NUMBER" },
                    defaultGrams: { type: "NUMBER" }
                  },
                  required: ["isNew", "name"]
                }
              }
            },
            required: ["name", "ingredients", "reasoning"]
          }
        }
      };

      const data = await fetchWithRetry(
        WORKER_URL,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );

      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        setAiRecipeResult(JSON.parse(resultText));
      } else {
        throw new Error("Leere Antwort");
      }
    } catch (err) {
      console.error(err);
      setAiError('KI Fehler. Bitte probiere es später erneut.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addAiRecipeToDay = (day) => {
    if(!aiRecipeResult) return;
    let currentDb = [...foodDb];
    let highestId = Math.max(...currentDb.map(f => f.id));

    const processedIngredientIds = aiRecipeResult.ingredients.map(ing => {
      if (ing.isNew) {
        highestId++;
        const newFood = {
          id: highestId,
          name: ing.name + ' (KI)',
          kcal: ing.kcal || 0,
          p: ing.p || 0,
          c: ing.c || 0,
          f: ing.f || 0,
          defaultGrams: ing.defaultGrams || 100
        };
        currentDb.push(newFood);
        return highestId;
      }
      return ing.id;
    });

    setFoodDb(currentDb);
    setPlan(prev => ({
      ...prev, [day]: [...prev[day], {
        id: Date.now(),
        name: aiRecipeResult.name + (isEmergencyMode ? ' ⚠️ (Notfall)' : ''),
        ingredients: processedIngredientIds.map((foodId, idx) => ({
          id: Date.now() + idx,
          foodId: foodId,
          grams: currentDb.find(f => f.id === foodId)?.defaultGrams || 100
        }))
      }]
    }));

    setSearchQuery('');
    setAiRecipeResult(null);
    setIsEmergencyMode(false);
    setExpandedDay(day);
  };

  const addStandardRecipeToDay = (day, recipeName, ingredientIds) => {
    setPlan(prev => ({
      ...prev, [day]: [...prev[day], {
        id: Date.now(),
        name: recipeName,
        ingredients: ingredientIds.map((foodId, idx) => ({
          id: Date.now() + idx,
          foodId: foodId,
          grams: foodDb.find(f => f.id === foodId)?.defaultGrams || 100
        }))
      }]
    }));
    setSearchQuery('');
    setExpandedDay(day);
  };

  const calcNutrients = (foodId, grams) => {
    const food = foodDb.find((f) => f.id === foodId);
    if (!food) return { kcal: 0, p: 0, c: 0, f: 0 };
    const factor = grams / 100;
    return { kcal: food.kcal * factor, p: food.p * factor, c: food.c * factor, f: food.f * factor };
  };

  const getDayTotals = (dayMeals) => {
    let totals = { kcal: 0, p: 0, c: 0, f: 0 };
    dayMeals.forEach((meal) => {
      meal.ingredients.forEach((ing) => {
        const n = calcNutrients(ing.foodId, ing.grams);
        totals.kcal += n.kcal; totals.p += n.p; totals.c += n.c; totals.f += n.f;
      });
    });
    return totals;
  };

  const updateIngredientGrams = (day, mealId, ingredientId, grams) => {
    setPlan((prev) => ({
      ...prev, [day]: prev[day].map((meal) => meal.id === mealId ? {
        ...meal, ingredients: meal.ingredients.map((ing) => ing.id === ingredientId ? { ...ing, grams: Number(grams) } : ing)
      } : meal)
    }));
  };

  const addIngredient = (day, mealId, foodId) => {
    setPlan((prev) => ({
      ...prev, [day]: prev[day].map((meal) => meal.id === mealId ? {
        ...meal, ingredients: [...meal.ingredients, {
          id: Date.now(), foodId: parseInt(foodId), grams: foodDb.find(f => f.id === parseInt(foodId))?.defaultGrams || 100
        }]
      } : meal)
    }));
  };

  const removeIngredient = (day, mealId, ingredientId) => {
    setPlan((prev) => ({ ...prev, [day]: prev[day].map((meal) => meal.id === mealId ? { ...meal, ingredients: meal.ingredients.filter((ing) => ing.id !== ingredientId) } : meal) }));
  };

  const removeMeal = (day, mealId) => {
    setPlan((prev) => ({ ...prev, [day]: prev[day].filter((meal) => meal.id !== mealId) }));
  };

  const addMeal = (day) => {
    setPlan((prev) => ({
      ...prev, [day]: [...prev[day], { id: Date.now(), name: `Neue Mahlzeit`, ingredients: [] }],
    }));
  };

  const scaleToTarget = (day) => {
    const currentTotals = getDayTotals(plan[day]);
    if (currentTotals.kcal === 0) return;
    const ratio = dailyTarget / currentTotals.kcal;

    if (ratio > 2 || ratio < 0.5) console.warn("Skalierungsfaktor extrem. Ist der Tag vollständig?");

    setPlan((prev) => ({
      ...prev, [day]: prev[day].map((meal) => ({
        ...meal, ingredients: meal.ingredients.map((ing) => ({ ...ing, grams: Math.round(ing.grams * ratio) })),
      }))
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header & Kalorienziel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Makro & Kalorien Scaler</h1>
            <p className="text-slate-500 text-sm">Struktur &gt; Motivation.</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700 text-sm">Tagesziel (kcal):</span>
              <input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-24 px-2 py-1 rounded border border-slate-300 text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowMacroCalc(!showMacroCalc)}
              className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              <Target size={14} /> Bedarf berechnen
            </button>
          </div>
        </div>

        {/* Kalorienbedarf-Rechner (Flexibel, ohne Profil-Dropdown) */}
        {showMacroCalc && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Target size={20} /> Deinen echten Bedarf berechnen
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase">Geschlecht</label>
                <select value={userGender} onChange={(e) => setUserGender(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase">Alter</label>
                <input type="number" value={userAge} onChange={(e) => setUserAge(Number(e.target.value))} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase">Größe (cm)</label>
                <input type="number" value={userHeight} onChange={(e) => setUserHeight(Number(e.target.value))} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase">Gewicht (kg)</label>
                <input type="number" step="0.1" value={userWeight} onChange={(e) => setUserWeight(Number(e.target.value))} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase">Tagesaktivität</label>
                <select value={activityFactor} onChange={(e) => setActivityFactor(Number(e.target.value))} className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={1.2}>Home-Office / Wenig Bewegung</option>
                  <option value={1.375}>Leichter Alltag (z.B. Lehrer)</option>
                  <option value={1.55}>Alltag + Hartes Krafttraining</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase">Ziel</label>
                <select value={goalDeficit} onChange={(e) => setGoalDeficit(Number(e.target.value))} className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={-500}>Fettabbau (~0,5kg / Woche)</option>
                  <option value={0}>Gewicht halten (Erhalt)</option>
                  <option value={300}>Muskelaufbau (leichter Überschuss)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-blue-200 gap-4">
              <div>
                <div className="text-sm text-blue-700">Grundumsatz: {Math.round(bmr)} kcal | Gesamtverbrauch: {Math.round(tdee)} kcal</div>
                <div className="text-xl font-bold text-blue-900">Empfohlenes Ziel: {calculatedTarget} kcal</div>
              </div>
              <button
                onClick={() => {
                  setDailyTarget(calculatedTarget);
                  setShowMacroCalc(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
              >
                Als Tagesziel übernehmen
              </button>
            </div>
          </div>
        )}

        {/* KI Assistent */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <Wand2 size={20} />
              <h3>Rezept & KI Assistent</h3>
            </div>

            <button
              onClick={() => setIsEmergencyMode(!isEmergencyMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${isEmergencyMode ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              {isEmergencyMode ? <ToggleRight className="text-orange-600" size={18}/> : <ToggleLeft size={18}/>}
              {isEmergencyMode ? 'Notfall-Modus aktiv' : 'Struktur-Modus'}
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder={isEmergencyMode ? "Notfall: Worauf hast du Lust?" : "Tippe ein Gericht oder eine Zutat..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAIForsuggestion()}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all ${isEmergencyMode ? 'border-orange-300 focus:ring-orange-500' : 'border-slate-300 focus:ring-blue-500'}`}
              />
            </div>
            <button
              onClick={askAIForsuggestion}
              disabled={isGeneratingAI || searchQuery.length < 2}
              className={`${isEmergencyMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 font-medium`}
            >
              {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Bot size={20} />}
              KI fragen
            </button>
          </div>

          {/* Lokale Suchergebnisse im Struktur-Modus */}
          {searchQuery.length >= 2 && suggestedRecipes.length > 0 && !aiRecipeResult && !isEmergencyMode && (
             <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-lg shadow-sm">
               <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Gefundene Standard-Gerichte</h4>
               <div className="space-y-2">
                  {suggestedRecipes.map(recipe => (
                    <div key={recipe.id} className="flex justify-between items-center bg-white p-3 border rounded-lg">
                       <span className="font-semibold">{recipe.name}</span>
                       <select
                        className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 outline-none"
                        onChange={(e) => { if(e.target.value) addStandardRecipeToDay(e.target.value, recipe.name, recipe.ingredients); }}
                        defaultValue=""
                      >
                        <option value="" disabled>Einfügen in...</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  ))}
               </div>
             </div>
          )}

          {/* Fehlermeldung */}
          {aiError && (
             <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
               {aiError}
             </div>
          )}

          {/* KI Ergebnis */}
          {aiRecipeResult && (
            <div className={`mt-4 p-4 border rounded-lg shadow-sm ${isEmergencyMode ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className={`flex items-center gap-2 font-bold mb-1 ${isEmergencyMode ? 'text-orange-700' : 'text-indigo-700'}`}>
                <Bot size={18} /> KI Vorschlag: {aiRecipeResult.name}
              </div>
              <p className={`text-sm mb-3 italic ${isEmergencyMode ? 'text-orange-600' : 'text-indigo-600'}`}>"{aiRecipeResult.reasoning}"</p>

              <div className="text-sm text-slate-600 mb-3 space-y-1">
                <span className="font-semibold">Benötigte Zutaten:</span>
                <ul className="list-disc pl-5">
                  {aiRecipeResult.ingredients.map((ing, i) => (
                    <li key={i} className={ing.isNew ? 'text-orange-700 font-medium' : ''}>
                      {ing.name} {ing.isNew && '(Neu!)'}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs font-medium text-slate-500">Übernehmen für:</span>
                <select
                  className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white flex-1 focus:ring-2 outline-none"
                  onChange={(e) => { if(e.target.value) addAiRecipeToDay(e.target.value); }}
                  defaultValue=""
                >
                  <option value="" disabled>Tag wählen...</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Wochentage iterieren */}
        <div className="space-y-4">
          {DAYS.map((day) => {
            const isExpanded = expandedDay === day;
            const totals = getDayTotals(plan[day]);
            const progress = Math.min((totals.kcal / dailyTarget) * 100, 100);

            return (
              <div key={day} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <button onClick={() => setExpandedDay(isExpanded ? null : day)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                    <h2 className="text-lg font-bold text-slate-800">{day}</h2>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`font-bold ${totals.kcal > dailyTarget ? 'text-red-500' : 'text-slate-800'}`}>
                      {totals.kcal.toFixed(0)} / {dailyTarget} kcal
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                    {plan[day].map((meal) => (
                        <div key={meal.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                            <input
                              type="text"
                              defaultValue={meal.name}
                              className="font-semibold text-slate-700 bg-transparent outline-none focus:border-b-2 focus:border-blue-500 w-full"
                            />
                            <button onClick={() => removeMeal(day, meal.id)} className="text-slate-400 hover:text-red-500 ml-4"><Trash2 size={16} /></button>
                          </div>
                          <div className="space-y-3">
                            {meal.ingredients.map((ing) => {
                              const food = foodDb.find(f => f.id === ing.foodId);
                              const nuts = calcNutrients(ing.foodId, ing.grams);
                              return (
                                <div key={ing.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-slate-100">
                                  <span className="font-medium text-slate-700 flex-1">{food?.name}</span>
                                  <input type="number" value={ing.grams} onChange={(e) => updateIngredientGrams(day, meal.id, ing.id, e.target.value)} className="w-20 px-2 py-1 text-right border rounded outline-none" />
                                  <span className="text-sm text-slate-500 w-4">g</span>
                                  <span className="w-16 text-right font-medium text-slate-700">{nuts.kcal.toFixed(0)} kcal</span>
                                  <button onClick={() => removeIngredient(day, meal.id, ing.id)} className="text-slate-400 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <select
                              className="flex-1 text-sm border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => {
                                if(e.target.value) {
                                  addIngredient(day, meal.id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>+ Zutat manuell hinzufügen...</option>
                              {foodDb.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}
                            </select>
                          </div>
                        </div>
                    ))}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => addMeal(day)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        <Plus size={16} /> Leere Mahlzeit
                      </button>
                      <button
                        onClick={() => scaleToTarget(day)}
                        disabled={plan[day].length === 0 || totals.kcal === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 ml-auto"
                      >
                        <Calculator size={16} /> Auf {dailyTarget} kcal skalieren
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
