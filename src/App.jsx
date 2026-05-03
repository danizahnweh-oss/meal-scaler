import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Calculator, Search, Wand2, Bot, Loader2, Target, ToggleLeft, ToggleRight, Settings, X, User, LogOut, Cloud, CloudOff, Check, Sparkles, Edit3, Zap, Flame } from 'lucide-react';

const WORKER_URL = 'https://meal-scale-proxy.sanktannagymnasium.workers.dev';

const INITIAL_DB = [
  // Original 10
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

  // Tierische Proteine
  { id: 100, name: 'Putenbrust', kcal: 110, p: 24, c: 0, f: 1.5, defaultGrams: 150 },
  { id: 101, name: 'Lachsfilet', kcal: 200, p: 20, c: 0, f: 13, defaultGrams: 130 },
  { id: 102, name: 'Thunfisch (Dose, Wasser)', kcal: 116, p: 26, c: 0, f: 1, defaultGrams: 80 },
  { id: 103, name: 'Garnelen', kcal: 99, p: 24, c: 0, f: 0.3, defaultGrams: 120 },
  { id: 104, name: 'Hüttenkäse (körnig)', kcal: 100, p: 12, c: 2.5, f: 4.5, defaultGrams: 200 },
  { id: 105, name: 'Skyr (natur)', kcal: 65, p: 11, c: 4, f: 0.2, defaultGrams: 200 },
  { id: 106, name: 'Mozzarella light', kcal: 220, p: 28, c: 1, f: 12, defaultGrams: 100 },
  { id: 107, name: 'Schweinefilet', kcal: 142, p: 22, c: 0, f: 5, defaultGrams: 150 },
  { id: 108, name: 'Putenhack', kcal: 130, p: 22, c: 0, f: 4.5, defaultGrams: 150 },
  { id: 109, name: 'Hähnchenschenkel', kcal: 215, p: 25, c: 0, f: 13, defaultGrams: 150 },

  // Pflanzliche Proteine
  { id: 110, name: 'Tofu (natur)', kcal: 76, p: 8, c: 1.9, f: 4.8, defaultGrams: 150 },
  { id: 111, name: 'Kichererbsen (gekocht)', kcal: 164, p: 9, c: 27, f: 2.6, defaultGrams: 150 },
  { id: 112, name: 'Linsen (rot, gekocht)', kcal: 116, p: 9, c: 20, f: 0.4, defaultGrams: 150 },

  // Carbs
  { id: 113, name: 'Vollkornnudeln (trocken)', kcal: 343, p: 13, c: 66, f: 2.5, defaultGrams: 80 },
  { id: 114, name: 'Pasta (trocken)', kcal: 360, p: 12, c: 72, f: 1.5, defaultGrams: 80 },
  { id: 115, name: 'Quinoa (trocken)', kcal: 368, p: 14, c: 64, f: 6, defaultGrams: 70 },
  { id: 116, name: 'Süßkartoffel', kcal: 86, p: 1.6, c: 20, f: 0.1, defaultGrams: 250 },
  { id: 117, name: 'Vollkornbrot', kcal: 245, p: 9, c: 42, f: 4, defaultGrams: 80 },
  { id: 118, name: 'Vollkornreis (trocken)', kcal: 357, p: 7.5, c: 76, f: 2.7, defaultGrams: 80 },
  { id: 119, name: 'Couscous (trocken)', kcal: 376, p: 13, c: 72, f: 1.9, defaultGrams: 70 },
  { id: 120, name: 'Wrap (Weizen)', kcal: 290, p: 9, c: 50, f: 6, defaultGrams: 60 },
  { id: 121, name: 'Brötchen (Weizen)', kcal: 274, p: 9, c: 53, f: 2, defaultGrams: 50 },

  // Gemüse
  { id: 122, name: 'Möhren', kcal: 41, p: 0.9, c: 9.6, f: 0.2, defaultGrams: 150 },
  { id: 123, name: 'Zucchini', kcal: 17, p: 1.2, c: 3.1, f: 0.3, defaultGrams: 200 },
  { id: 124, name: 'Paprika (rot)', kcal: 31, p: 1, c: 6, f: 0.3, defaultGrams: 150 },
  { id: 125, name: 'Spinat (frisch)', kcal: 23, p: 2.9, c: 3.6, f: 0.4, defaultGrams: 100 },
  { id: 126, name: 'Tomaten', kcal: 18, p: 0.9, c: 3.9, f: 0.2, defaultGrams: 150 },
  { id: 127, name: 'Gurke', kcal: 16, p: 0.7, c: 3.6, f: 0.1, defaultGrams: 100 },
  { id: 128, name: 'Champignons', kcal: 22, p: 3.1, c: 3.3, f: 0.3, defaultGrams: 150 },
  { id: 129, name: 'Zwiebel', kcal: 40, p: 1.1, c: 9.3, f: 0.1, defaultGrams: 50 },
  { id: 130, name: 'Blumenkohl', kcal: 25, p: 1.9, c: 5, f: 0.3, defaultGrams: 200 },
  { id: 131, name: 'Aubergine', kcal: 25, p: 1, c: 6, f: 0.2, defaultGrams: 200 },

  // Obst
  { id: 132, name: 'Banane', kcal: 89, p: 1.1, c: 23, f: 0.3, defaultGrams: 120 },
  { id: 133, name: 'Apfel', kcal: 52, p: 0.3, c: 14, f: 0.2, defaultGrams: 150 },
  { id: 134, name: 'Heidelbeeren', kcal: 57, p: 0.7, c: 14, f: 0.3, defaultGrams: 100 },
  { id: 135, name: 'Erdbeeren', kcal: 32, p: 0.7, c: 7.7, f: 0.3, defaultGrams: 150 },
  { id: 136, name: 'Orange', kcal: 47, p: 0.9, c: 12, f: 0.1, defaultGrams: 150 },

  // Milchprodukte
  { id: 137, name: 'Milch (1.5%)', kcal: 49, p: 3.4, c: 4.8, f: 1.6, defaultGrams: 200 },
  { id: 138, name: 'Joghurt natur (1.5%)', kcal: 50, p: 3.5, c: 4, f: 1.5, defaultGrams: 150 },
  { id: 139, name: 'Joghurt griechisch (10%)', kcal: 115, p: 9, c: 4, f: 7, defaultGrams: 150 },
  { id: 140, name: 'Gouda mittelalt', kcal: 356, p: 25, c: 0, f: 28, defaultGrams: 30 },
  { id: 141, name: 'Butter', kcal: 717, p: 0.9, c: 0.6, f: 81, defaultGrams: 10 },

  // Fette / Nüsse
  { id: 142, name: 'Erdnussbutter (natur)', kcal: 588, p: 25, c: 20, f: 50, defaultGrams: 20 },
  { id: 143, name: 'Walnüsse', kcal: 654, p: 15, c: 14, f: 65, defaultGrams: 25 },
  { id: 144, name: 'Mandeln', kcal: 579, p: 21, c: 22, f: 50, defaultGrams: 25 },
  { id: 145, name: 'Avocado', kcal: 160, p: 2, c: 9, f: 15, defaultGrams: 100 },
  { id: 146, name: 'Rapsöl', kcal: 884, p: 0, c: 0, f: 100, defaultGrams: 10 },

  // Sonstiges
  { id: 147, name: 'Honig', kcal: 304, p: 0.3, c: 82, f: 0, defaultGrams: 15 },
  { id: 148, name: 'Tomaten (passiert)', kcal: 35, p: 1.7, c: 7, f: 0.2, defaultGrams: 200 },
  { id: 149, name: 'Apfelmus (ungezuckert)', kcal: 41, p: 0.2, c: 10, f: 0.1, defaultGrams: 100 },
];

const STANDARD_IDS = new Set(INITIAL_DB.map(f => f.id));
const isStandardFood = (id) => STANDARD_IDS.has(id);

const ensureStandardFoods = (userFoodDb) => {
  if (!Array.isArray(userFoodDb) || userFoodDb.length === 0) return INITIAL_DB;
  const existing = new Set(userFoodDb.map(f => f.id));
  const missing = INITIAL_DB.filter(f => !existing.has(f.id));
  return missing.length === 0 ? userFoodDb : [...userFoodDb, ...missing];
};

const RECIPE_DB = [
  { id: 1, name: 'Hähnchen-Brokkoli-Pfanne', ingredients: [1, 2, 3, 4] },
  { id: 2, name: 'Protein-Porridge', ingredients: [6, 7, 5] },
  { id: 3, name: 'Bauerntopf (Hack & Kartoffeln)', ingredients: [10, 9, 3, 4] },
];

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DAYS_SHORT = { Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi', Donnerstag: 'Do', Freitag: 'Fr', Samstag: 'Sa', Sonntag: 'So' };

const STORAGE_KEY = 'meal_scaler_state_v1';
const SESSION_KEY = 'meal_scaler_session';

const loadSaved = () => {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
};
const loadSession = () => {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
};
const saved = loadSaved();
const emptyPlan = () => DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});

const getTodayKey = () => DAYS[((new Date().getDay() + 6) % 7)];

const calcMacroTargets = (kcalTarget, weight) => ({
  p: Math.round(weight * 2),
  f: Math.round((kcalTarget * 0.25) / 9),
  c: Math.max(0, Math.round((kcalTarget - weight * 2 * 4 - kcalTarget * 0.25) / 4)),
});

const dayStatus = (kcal, target) => {
  if (kcal === 0) return 'empty';
  if (kcal < target * 0.8) return 'under';
  if (kcal > target * 1.1) return 'over';
  return 'green';
};

// =================== SUB-COMPONENTS ===================

const MacroRing = ({ value, target, size = 140, stroke = 12 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circumference - progress * circumference;
  const status = dayStatus(value, target);
  const ringColor = status === 'empty' ? 'stroke-slate-300' : status === 'green' ? 'stroke-emerald-500' : status === 'over' ? 'stroke-rose-500' : 'stroke-amber-400';
  const textColor = status === 'over' ? 'text-rose-600' : 'text-slate-900';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" className="stroke-slate-200" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" strokeLinecap="round"
          className={`${ringColor} transition-all duration-700 ease-out`}
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold tabular-nums ${textColor}`}>{Math.round(value)}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">kcal</span>
        <span className="text-xs text-slate-500 tabular-nums mt-0.5">/ {Math.round(target)}</span>
      </div>
    </div>
  );
};

const MacroBars = ({ totals, targets }) => {
  const items = [
    { key: 'p', label: 'Protein', val: totals.p, target: targets.p, dark: 'bg-emerald-500', light: 'bg-emerald-100' },
    { key: 'c', label: 'Kohlenhydrate', val: totals.c, target: targets.c, dark: 'bg-blue-500', light: 'bg-blue-100' },
    { key: 'f', label: 'Fett', val: totals.f, target: targets.f, dark: 'bg-amber-500', light: 'bg-amber-100' },
  ];
  return (
    <div className="space-y-2.5 w-full">
      {items.map(it => {
        const pct = it.target > 0 ? Math.min(100, (it.val / it.target) * 100) : 0;
        return (
          <div key={it.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">{it.label}</span>
              <span className="tabular-nums text-slate-700"><span className="font-semibold">{Math.round(it.val)}</span><span className="text-slate-400">/{Math.round(it.target)}g</span></span>
            </div>
            <div className={`h-2 ${it.light} rounded-full overflow-hidden`}>
              <div className={`h-full ${it.dark} transition-all duration-700 ease-out rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DayProgressBar = ({ value, target }) => {
  const pct = target > 0 ? Math.min(110, (value / target) * 100) : 0;
  const status = dayStatus(value, target);
  const color = status === 'empty' ? 'bg-slate-200' : status === 'green' ? 'bg-emerald-500' : status === 'over' ? 'bg-rose-500' : 'bg-amber-400';
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500 rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
};

const MacroChips = ({ totals, compact = false }) => (
  <div className={`flex gap-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium tabular-nums">P {Math.round(totals.p)}g</span>
    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium tabular-nums">K {Math.round(totals.c)}g</span>
    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium tabular-nums">F {Math.round(totals.f)}g</span>
  </div>
);

const StreakDots = ({ plan, dailyTarget, getDayTotals }) => {
  const todayKey = getTodayKey();
  return (
    <div className="flex gap-2">
      {DAYS.map(d => {
        const t = getDayTotals(plan[d]);
        const status = dayStatus(t.kcal, dailyTarget);
        const isToday = d === todayKey;
        const dotColor = status === 'green' ? 'bg-emerald-500' : status === 'over' ? 'bg-rose-500' : status === 'under' ? 'bg-amber-400' : 'bg-slate-200';
        return (
          <div key={d} className="flex flex-col items-center gap-1.5">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-blue-700' : 'text-slate-400'}`}>{DAYS_SHORT[d]}</span>
            <div className={`w-3 h-3 rounded-full ${dotColor} ${isToday ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white' : ''}`} />
          </div>
        );
      })}
    </div>
  );
};

const Toast = ({ message, visible }) => (
  <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
    <Check size={18} className="shrink-0" />
    <span className="font-medium text-sm">{message}</span>
  </div>
);

const SegmentedControl = ({ options, value, onChange }) => (
  <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1 w-full">
    {options.map(opt => (
      <button key={String(opt.value)} type="button" onClick={() => onChange(opt.value)}
        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          value === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        }`}>
        {opt.label}
      </button>
    ))}
  </div>
);

const PinBoxes = ({ value, length = 4, focused }) => (
  <div className="flex gap-3 justify-center">
    {Array.from({ length }).map((_, i) => (
      <div key={i} className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all ${
        i === value.length && focused ? 'border-white ring-2 ring-white/50 scale-105' :
        i < value.length ? 'border-white/80 bg-white/10 text-white' : 'border-white/40 bg-white/5'
      }`}>
        {i < value.length ? '•' : ''}
      </div>
    ))}
  </div>
);

// =================== MAIN APP ===================

export default function App() {
  // Data states
  const [dailyTarget, setDailyTarget] = useState(saved.dailyTarget ?? 2400);
  const [foodDb, setFoodDb] = useState(ensureStandardFoods(saved.foodDb ?? INITIAL_DB));
  const [plan, setPlan] = useState(saved.plan ?? emptyPlan());
  const [expandedDay, setExpandedDay] = useState(getTodayKey());

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);

  const [isCreativeMode, setIsCreativeMode] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiBusyDay, setAiBusyDay] = useState(null);
  const [aiRecipeResult, setAiRecipeResult] = useState(null);
  const [aiError, setAiError] = useState('');

  const [showMacroCalc, setShowMacroCalc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);

  const [userGender, setUserGender] = useState(saved.userGender ?? 'male');
  const [userAge, setUserAge] = useState(saved.userAge ?? 33);
  const [userHeight, setUserHeight] = useState(saved.userHeight ?? 181);
  const [userWeight, setUserWeight] = useState(saved.userWeight ?? 98.8);
  const [activityFactor, setActivityFactor] = useState(saved.activityFactor ?? 1.375);
  const [goalDeficit, setGoalDeficit] = useState(saved.goalDeficit ?? -500);

  const [excluded, setExcluded] = useState(saved.excluded ?? []);
  const [pantry, setPantry] = useState(saved.pantry ?? []);
  const [excludedInput, setExcludedInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');
  const [newFood, setNewFood] = useState({ name: '', kcal: '', p: '', c: '', f: '', defaultGrams: '100' });

  // Auth states
  const [currentUser, setCurrentUser] = useState(loadSession());
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginPinFocused, setLoginPinFocused] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 2800);
  };

  const bmr = userGender === 'male'
    ? (10 * userWeight) + (6.25 * userHeight) - (5 * userAge) + 5
    : (10 * userWeight) + (6.25 * userHeight) - (5 * userAge) - 161;
  const tdee = bmr * activityFactor;
  const calculatedTarget = Math.round(tdee + goalDeficit);

  const macroTargets = useMemo(() => calcMacroTargets(dailyTarget, userWeight), [dailyTarget, userWeight]);

  // Local cache
  useEffect(() => {
    const state = { dailyTarget, foodDb, plan, userGender, userAge, userHeight, userWeight, activityFactor, goalDeficit, excluded, pantry };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [dailyTarget, foodDb, plan, userGender, userAge, userHeight, userWeight, activityFactor, goalDeficit, excluded, pantry]);

  // Search suggestions
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestedRecipes([]); setAiRecipeResult(null); setAiError(''); return; }
    const q = searchQuery.toLowerCase();
    setSuggestedRecipes(RECIPE_DB.filter(r => r.name.toLowerCase().includes(q)));
  }, [searchQuery]);

  // Load from server on user change
  useEffect(() => {
    if (!currentUser) { setHasLoadedFromServer(false); return; }
    loadFromServer();
  }, [currentUser?.name, currentUser?.pin]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!currentUser || !hasLoadedFromServer) return;
    setSyncStatus('saving');
    const t = setTimeout(() => saveToServer(), 1500);
    return () => clearTimeout(t);
  }, [dailyTarget, foodDb, plan, userGender, userAge, userHeight, userWeight, activityFactor, goalDeficit, excluded, pantry, hasLoadedFromServer]);

  const loadFromServer = async () => {
    if (!currentUser) return;
    setAuthBusy(true);
    try {
      const r = await fetch(`${WORKER_URL}/load`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentUser.name, pin: currentUser.pin }),
      });
      if (r.status === 401) { handleLogout(); return; }
      if (!r.ok) { setSyncStatus('error'); return; }
      const { data } = await r.json();
      if (data) {
        if (data.dailyTarget != null) setDailyTarget(data.dailyTarget);
        if (data.foodDb) setFoodDb(ensureStandardFoods(data.foodDb));
        if (data.plan) setPlan(data.plan);
        if (data.userGender) setUserGender(data.userGender);
        if (data.userAge != null) setUserAge(data.userAge);
        if (data.userHeight != null) setUserHeight(data.userHeight);
        if (data.userWeight != null) setUserWeight(data.userWeight);
        if (data.activityFactor != null) setActivityFactor(data.activityFactor);
        if (data.goalDeficit != null) setGoalDeficit(data.goalDeficit);
        if (data.excluded) setExcluded(data.excluded);
        if (data.pantry) setPantry(data.pantry);
      }
      setHasLoadedFromServer(true);
      setSyncStatus('saved');
    } catch (err) { console.error(err); setSyncStatus('error'); }
    finally { setAuthBusy(false); }
  };

  const saveToServer = async () => {
    if (!currentUser) return;
    const data = { dailyTarget, foodDb, plan, userGender, userAge, userHeight, userWeight, activityFactor, goalDeficit, excluded, pantry };
    try {
      const r = await fetch(`${WORKER_URL}/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentUser.name, pin: currentUser.pin, data }),
      });
      setSyncStatus(r.ok ? 'saved' : 'error');
    } catch { setSyncStatus('error'); }
  };

  const handleLogin = async () => {
    if (!loginName.trim() || !/^\d{4}$/.test(loginPin)) { setLoginError('Name eingeben und 4-stelligen PIN.'); return; }
    setAuthBusy(true); setLoginError('');
    try {
      const r = await fetch(`${WORKER_URL}/load`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName.trim(), pin: loginPin }),
      });
      if (r.status === 401) { setLoginError('PIN ist falsch für diesen Namen.'); setAuthBusy(false); return; }
      if (!r.ok) { setLoginError('Anmeldung fehlgeschlagen. Prüfe Internet.'); setAuthBusy(false); return; }
      const session = { name: loginName.trim(), pin: loginPin };
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
      setCurrentUser(session);
      setLoginPin('');
    } catch { setLoginError('Verbindung fehlgeschlagen.'); setAuthBusy(false); }
  };

  const handleLogout = () => {
    try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(STORAGE_KEY); } catch {}
    setCurrentUser(null); setHasLoadedFromServer(false);
    setDailyTarget(2400); setFoodDb(INITIAL_DB); setPlan(emptyPlan());
    setUserGender('male'); setUserAge(33); setUserHeight(181); setUserWeight(98.8);
    setActivityFactor(1.375); setGoalDeficit(-500); setExcluded([]); setPantry([]);
    setSyncStatus('idle');
  };

  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const r = await fetch(url, options);
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return await r.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
      }
    }
  };

  const buildPromptHints = () => {
    const pantryHint = pantry.length > 0 ? ` Der User hat folgende Zutaten IMMER zu Hause — bevorzuge diese wenn sinnvoll: ${pantry.join(', ')}.` : '';
    const excludedHint = excluded.length > 0 ? ` UNVERTRÄGLICHKEITEN: Verwende NIEMALS diese Zutaten oder Bestandteile davon: ${excluded.join(', ')}.` : '';
    return { pantryHint, excludedHint };
  };

  const askAIForsuggestion = async () => {
    if (!searchQuery) return;
    setIsGeneratingAI(true); setAiError(''); setAiRecipeResult(null);

    try {
      const dbContext = foodDb.map(f => ({ id: f.id, name: f.name }));
      const { pantryHint, excludedHint } = buildPromptHints();
      const baseInstruction = `Erstelle ein echtes, sinnvoll kombiniertes Gericht (kein Zutat-Wirrwarr). Nutze möglichst viele passende Zutaten der Liste. Bevorzuge eine HIGH-PROTEIN Komposition.`;

      const promptText = isCreativeMode
        ? `Der User sucht nach einem Rezept für: "${searchQuery}". KREATIV-MODUS: Du darfst völlig NEUE Zutaten erfinden, die nicht in der Datenbank sind. Liefere für jede neue Zutat realistische Makronährwerte (kcal, p, c, f) pro 100g UND eine realistische Standard-Portionsgröße in Gramm (defaultGrams). Bekannte Zutaten dürfen ebenfalls genutzt werden. ${baseInstruction} Bekannte Zutaten: ${JSON.stringify(dbContext)}.${pantryHint}${excludedHint}`
        : `Der User sucht nach einem Rezept für: "${searchQuery}". STRUKTUR-MODUS: Du darfst AUSSCHLIESSLICH Zutaten aus der bereitgestellten Liste verwenden — KEINE neuen erfinden. ${baseInstruction} Liste: ${JSON.stringify(dbContext)}.${pantryHint}${excludedHint}`;

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" }, reasoning: { type: "STRING" },
              ingredients: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    isNew: { type: "BOOLEAN" }, id: { type: "INTEGER" }, name: { type: "STRING" },
                    kcal: { type: "NUMBER" }, p: { type: "NUMBER" }, c: { type: "NUMBER" }, f: { type: "NUMBER" },
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

      const data = await fetchWithRetry(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) setAiRecipeResult(JSON.parse(resultText));
      else throw new Error("Leere Antwort");
    } catch (err) { console.error(err); setAiError('KI Fehler. Bitte probiere es später erneut.'); }
    finally { setIsGeneratingAI(false); }
  };

  const askAIForDay = async (day) => {
    setAiBusyDay(day); setAiError('');
    try {
      const dbContext = foodDb.map(f => ({ id: f.id, name: f.name }));
      const { pantryHint, excludedHint } = buildPromptHints();

      const promptText = `Erstelle einen kompletten Tagesplan für ${day} (Frühstück, Mittagessen, Abendessen, optional ein Snack), der zusammen ${dailyTarget} kcal trifft (±5%). STRUKTUR-MODUS: NUR Zutaten aus der Liste, KEINE neuen erfinden. HIGH-PROTEIN Verteilung (mindestens ${macroTargets.p}g Protein über den Tag). Echte, kombinierbare Mahlzeiten — kein Zutat-Wirrwarr. Liste: ${JSON.stringify(dbContext)}.${pantryHint}${excludedHint}`;

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              meals: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    ingredients: {
                      type: "ARRAY",
                      items: { type: "OBJECT", properties: { id: { type: "INTEGER" }, grams: { type: "NUMBER" } }, required: ["id", "grams"] }
                    }
                  },
                  required: ["name", "ingredients"]
                }
              }
            },
            required: ["meals"]
          }
        }
      };

      const data = await fetchWithRetry(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("Leere Antwort");
      const parsed = JSON.parse(resultText);

      setPlan(prev => ({
        ...prev,
        [day]: parsed.meals.map((m, idx) => ({
          id: Date.now() + idx,
          name: `${m.name} 🤖`,
          ingredients: m.ingredients.filter(ing => foodDb.find(f => f.id === ing.id)).map((ing, j) => ({
            id: Date.now() + idx * 100 + j, foodId: ing.id, grams: Math.max(1, Math.round(ing.grams))
          }))
        }))
      }));
      setExpandedDay(day);
      showToast(`${day} mit ${parsed.meals.length} Mahlzeiten gefüllt 🎯`);
    } catch (err) { console.error(err); setAiError('KI Fehler beim Tagesplan. Versuche es nochmal.'); }
    finally { setAiBusyDay(null); }
  };

  const addAiRecipeToDay = (day) => {
    if (!aiRecipeResult) return;
    let currentDb = [...foodDb];
    let highestId = Math.max(...currentDb.map(f => f.id));

    const processedIds = aiRecipeResult.ingredients.map(ing => {
      if (ing.isNew) {
        highestId++;
        currentDb.push({ id: highestId, name: ing.name + ' (KI)', kcal: ing.kcal || 0, p: ing.p || 0, c: ing.c || 0, f: ing.f || 0, defaultGrams: ing.defaultGrams || 100 });
        return highestId;
      }
      return ing.id;
    });

    setFoodDb(currentDb);
    setPlan(prev => ({
      ...prev, [day]: [...prev[day], {
        id: Date.now(),
        name: aiRecipeResult.name + (isCreativeMode ? ' ✨' : ''),
        ingredients: processedIds.map((foodId, idx) => ({
          id: Date.now() + idx, foodId, grams: currentDb.find(f => f.id === foodId)?.defaultGrams || 100
        }))
      }]
    }));
    setSearchQuery(''); setAiRecipeResult(null); setIsCreativeMode(false); setExpandedDay(day);
    showToast(`${aiRecipeResult.name} zu ${day} hinzugefügt`);
  };

  const addStandardRecipeToDay = (day, recipeName, ingredientIds) => {
    setPlan(prev => ({
      ...prev, [day]: [...prev[day], {
        id: Date.now(), name: recipeName,
        ingredients: ingredientIds.map((foodId, idx) => ({
          id: Date.now() + idx, foodId, grams: foodDb.find(f => f.id === foodId)?.defaultGrams || 100
        }))
      }]
    }));
    setSearchQuery(''); setExpandedDay(day);
  };

  const calcNutrients = (foodId, grams) => {
    const food = foodDb.find(f => f.id === foodId);
    if (!food) return { kcal: 0, p: 0, c: 0, f: 0 };
    const factor = grams / 100;
    return { kcal: food.kcal * factor, p: food.p * factor, c: food.c * factor, f: food.f * factor };
  };

  const getMealTotals = (meal) => {
    let t = { kcal: 0, p: 0, c: 0, f: 0 };
    meal.ingredients.forEach(ing => {
      const n = calcNutrients(ing.foodId, ing.grams);
      t.kcal += n.kcal; t.p += n.p; t.c += n.c; t.f += n.f;
    });
    return t;
  };

  const getDayTotals = (dayMeals) => {
    let t = { kcal: 0, p: 0, c: 0, f: 0 };
    if (!dayMeals) return t;
    dayMeals.forEach(meal => { const m = getMealTotals(meal); t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f; });
    return t;
  };

  const updateIngredientGrams = (day, mealId, ingId, grams) => {
    setPlan(prev => ({ ...prev, [day]: prev[day].map(m => m.id === mealId ? { ...m, ingredients: m.ingredients.map(i => i.id === ingId ? { ...i, grams: Number(grams) } : i) } : m) }));
  };
  const updateMealName = (day, mealId, name) => {
    setPlan(prev => ({ ...prev, [day]: prev[day].map(m => m.id === mealId ? { ...m, name } : m) }));
  };
  const addIngredient = (day, mealId, foodId) => {
    setPlan(prev => ({ ...prev, [day]: prev[day].map(m => m.id === mealId ? { ...m, ingredients: [...m.ingredients, { id: Date.now(), foodId: parseInt(foodId), grams: foodDb.find(f => f.id === parseInt(foodId))?.defaultGrams || 100 }] } : m) }));
  };
  const removeIngredient = (day, mealId, ingId) => {
    setPlan(prev => ({ ...prev, [day]: prev[day].map(m => m.id === mealId ? { ...m, ingredients: m.ingredients.filter(i => i.id !== ingId) } : m) }));
  };
  const removeMeal = (day, mealId) => {
    setPlan(prev => ({ ...prev, [day]: prev[day].filter(m => m.id !== mealId) }));
  };
  const addMeal = (day) => {
    setPlan(prev => ({ ...prev, [day]: [...prev[day], { id: Date.now(), name: `Neue Mahlzeit`, ingredients: [] }] }));
  };

  const scaleToTarget = (day) => {
    const t = getDayTotals(plan[day]);
    if (t.kcal === 0) return;
    const ratio = dailyTarget / t.kcal;
    setPlan(prev => ({
      ...prev, [day]: prev[day].map(m => ({ ...m, ingredients: m.ingredients.map(i => ({ ...i, grams: Math.round(i.grams * ratio) })) }))
    }));
    showToast(`${day} auf ${dailyTarget} kcal skaliert ✓`);
  };

  const addExcluded = () => { const v = excludedInput.trim(); if (!v || excluded.includes(v)) return; setExcluded([...excluded, v]); setExcludedInput(''); };
  const addPantry = () => { const v = pantryInput.trim(); if (!v || pantry.includes(v)) return; setPantry([...pantry, v]); setPantryInput(''); };

  const addCustomFood = () => {
    const name = newFood.name.trim();
    if (!name) return;
    const newId = foodDb.length > 0 ? Math.max(...foodDb.map(f => f.id)) + 1 : 1;
    setFoodDb([...foodDb, {
      id: newId, name,
      kcal: Number(newFood.kcal) || 0,
      p: Number(newFood.p) || 0,
      c: Number(newFood.c) || 0,
      f: Number(newFood.f) || 0,
      defaultGrams: Number(newFood.defaultGrams) || 100,
    }]);
    setNewFood({ name: '', kcal: '', p: '', c: '', f: '', defaultGrams: '100' });
    showToast(`"${name}" zur Datenbank hinzugefügt`);
  };

  const removeFood = (id) => {
    if (isStandardFood(id)) return; // Standard-Zutaten sind geschützt
    setFoodDb(foodDb.filter(f => f.id !== id));
  };

  // Today's totals
  const todayKey = getTodayKey();
  const todayTotals = getDayTotals(plan[todayKey]);
  const todayRemainingKcal = Math.max(0, dailyTarget - todayTotals.kcal);
  const todayRemainingP = Math.max(0, macroTargets.p - todayTotals.p);

  // ============ LOGIN SCREEN ============
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.2)_0%,_transparent_50%)]" />

        <div className="relative max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Flame size={16} className="text-amber-300" />
              <span className="text-white text-xs font-semibold tracking-wider uppercase">Makro Scaler</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Disziplin schlägt Motivation.</h1>
            <p className="text-blue-100 text-base">Aber heute machst du beides.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6">
            <div>
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Dein Name</label>
              <input
                type="text" placeholder="z.B. Daniel" value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pin-input')?.focus()}
                className="w-full mt-2 px-4 py-3 bg-white/10 border border-white/30 rounded-xl outline-none focus:bg-white/20 focus:border-white/60 text-white placeholder-white/40 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3 block">PIN (4 Ziffern)</label>
              <div className="relative cursor-text" onClick={() => document.getElementById('pin-input')?.focus()}>
                <input
                  id="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onFocus={() => setLoginPinFocused(true)} onBlur={() => setLoginPinFocused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="sr-only"
                />
                <PinBoxes value={loginPin} length={4} focused={loginPinFocused} />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-500/20 backdrop-blur-sm text-rose-100 p-3 rounded-lg text-sm border border-rose-300/30">
                {loginError}
              </div>
            )}

            <button onClick={handleLogin} disabled={authBusy || !loginName.trim() || loginPin.length !== 4}
              className="w-full bg-white text-indigo-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg">
              {authBusy ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              Los geht's
            </button>

            <p className="text-xs text-white/60 text-center leading-relaxed">
              Erster Login? Dein Konto wird mit diesem PIN angelegt.<br/>
              Merk ihn dir gut — er ist dein einziger Schlüssel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN APP ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HERO CARD — Today */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-3xl shadow-xl shadow-blue-500/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />

          <div className="relative p-6 md:p-8">
            {/* Top row: greeting + user controls */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
                  <Flame size={14} /> Heute · {todayKey}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Hallo {currentUser.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {syncStatus === 'saving' && <span className="text-blue-100/70 text-xs flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Sync</span>}
                {syncStatus === 'saved' && <span className="text-emerald-300 text-xs flex items-center gap-1"><Cloud size={12} /> Synced</span>}
                {syncStatus === 'error' && <span className="text-rose-300 text-xs flex items-center gap-1"><CloudOff size={12} /> Fehler</span>}
                <button onClick={handleLogout} title="Abmelden" className="text-blue-100/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <LogOut size={14} />
                </button>
              </div>
            </div>

            {/* Main content: ring + macro bars */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-5 shadow-md">
                  <MacroRing value={todayTotals.kcal} target={dailyTarget} size={160} stroke={14} />
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-md">
                <MacroBars totals={todayTotals} targets={macroTargets} />
                {todayTotals.kcal > 0 && todayTotals.kcal < dailyTarget && (
                  <p className="text-xs text-slate-500 mt-3 italic">
                    Noch <span className="font-bold tabular-nums text-slate-700">{Math.round(todayRemainingKcal)} kcal</span> · <span className="font-bold tabular-nums text-emerald-600">{Math.round(todayRemainingP)}g</span> Protein offen
                  </p>
                )}
                {todayTotals.kcal === 0 && (
                  <p className="text-xs text-slate-500 mt-3 italic">Heute noch nichts geplant — leg los.</p>
                )}
                {todayTotals.kcal >= dailyTarget * 0.95 && todayTotals.kcal <= dailyTarget * 1.05 && (
                  <p className="text-xs text-emerald-600 font-semibold mt-3">🎯 Tagesziel im Sweet Spot.</p>
                )}
              </div>
            </div>

            {/* Streak dots */}
            <div className="mt-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wochen-Streak</span>
                <span className="text-xs text-slate-400">Grün = im Zielbereich</span>
              </div>
              <div className="flex justify-between items-end">
                <StreakDots plan={plan} dailyTarget={dailyTarget} getDayTotals={getDayTotals} />
              </div>
            </div>

            {/* Bottom row: tagesziel + buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {editingTarget ? (
                <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
                  <span className="text-xs text-slate-500 font-bold uppercase">Tagesziel</span>
                  <input
                    type="number" autoFocus value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    onBlur={() => setEditingTarget(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingTarget(false)}
                    className="w-20 px-2 py-1 rounded border border-slate-300 text-center font-bold tabular-nums focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs text-slate-500">kcal</span>
                </div>
              ) : (
                <button onClick={() => setEditingTarget(true)} className="bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 flex items-center gap-2 transition-colors">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">Tagesziel</span>
                  <span className="font-bold tabular-nums">{dailyTarget} kcal</span>
                  <Edit3 size={12} className="opacity-70" />
                </button>
              )}
              <button onClick={() => { setShowMacroCalc(!showMacroCalc); setShowSettings(false); }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors">
                <Target size={14} /> Bedarf
              </button>
              <button onClick={() => { setShowSettings(!showSettings); setShowMacroCalc(false); }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors">
                <Settings size={14} /> Einstellungen
              </button>
            </div>
          </div>
        </div>

        {/* SETTINGS PANEL */}
        {showSettings && (
          <div className="bg-white rounded-2xl border-l-4 border-amber-500 shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-amber-600" /> Einstellungen
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                🚫 Unverträglichkeiten
              </label>
              <p className="text-xs text-slate-500 mt-1 mb-3">Die KI vermeidet diese Zutaten in jedem Vorschlag.</p>
              <div className="flex gap-2">
                <input type="text" placeholder="z.B. Laktose, Erdnüsse" value={excludedInput}
                  onChange={(e) => setExcludedInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExcluded()}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50" />
                <button onClick={addExcluded} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <Plus size={14} className="inline" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {excluded.length === 0 && <span className="text-xs text-slate-400 italic">Noch nichts</span>}
                {excluded.map((item, i) => (
                  <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-3 py-1 text-sm flex items-center gap-2">
                    {item}
                    <button onClick={() => setExcluded(excluded.filter((_, idx) => idx !== i))} className="hover:text-rose-900"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                🥫 Immer zuhause
              </label>
              <p className="text-xs text-slate-500 mt-1 mb-3">Die KI bevorzugt diese Zutaten wenn sinnvoll.</p>
              <div className="flex gap-2">
                <input type="text" placeholder="z.B. Eier, Reis, Olivenöl" value={pantryInput}
                  onChange={(e) => setPantryInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPantry()}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
                <button onClick={addPantry} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <Plus size={14} className="inline" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {pantry.length === 0 && <span className="text-xs text-slate-400 italic">Noch nichts</span>}
                {pantry.map((item, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-sm flex items-center gap-2">
                    {item}
                    <button onClick={() => setPantry(pantry.filter((_, idx) => idx !== i))} className="hover:text-emerald-900"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                🍽️ Eigene Zutat hinzufügen
              </label>
              <p className="text-xs text-slate-500 mt-1 mb-3">Werte direkt von der Verpackung. Landet danach in der Zutat-Auswahl.</p>
              <div className="space-y-2">
                <input type="text" placeholder="Name (z.B. Skyr Vanille)" value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomFood()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50" />
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <input type="number" placeholder="kcal" value={newFood.kcal}
                      onChange={(e) => setNewFood({ ...newFood, kcal: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 tabular-nums text-sm" />
                    <span className="text-[10px] text-slate-400 block text-center mt-0.5">kcal/100g</span>
                  </div>
                  <div>
                    <input type="number" placeholder="P" value={newFood.p}
                      onChange={(e) => setNewFood({ ...newFood, p: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 tabular-nums text-sm" />
                    <span className="text-[10px] text-emerald-600 block text-center mt-0.5">Protein</span>
                  </div>
                  <div>
                    <input type="number" placeholder="K" value={newFood.c}
                      onChange={(e) => setNewFood({ ...newFood, c: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 tabular-nums text-sm" />
                    <span className="text-[10px] text-blue-600 block text-center mt-0.5">Carbs</span>
                  </div>
                  <div>
                    <input type="number" placeholder="F" value={newFood.f}
                      onChange={(e) => setNewFood({ ...newFood, f: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50 tabular-nums text-sm" />
                    <span className="text-[10px] text-amber-600 block text-center mt-0.5">Fett</span>
                  </div>
                  <div>
                    <input type="number" placeholder="100" value={newFood.defaultGrams}
                      onChange={(e) => setNewFood({ ...newFood, defaultGrams: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50 tabular-nums text-sm" />
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Portion(g)</span>
                  </div>
                </div>
                <button onClick={addCustomFood} disabled={!newFood.name.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <Plus size={14} /> Zutat speichern
                </button>
              </div>

              {foodDb.filter(f => !isStandardFood(f.id)).length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Eigene + KI-Zutaten</span>
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {foodDb.filter(f => !isStandardFood(f.id)).map(f => (
                      <div key={f.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700 truncate flex-1">{f.name}</span>
                        <span className="text-xs text-slate-500 tabular-nums shrink-0 ml-2">{Math.round(f.kcal)} kcal · P{Math.round(f.p)} K{Math.round(f.c)} F{Math.round(f.f)}</span>
                        <button onClick={() => removeFood(f.id)} className="ml-2 text-slate-400 hover:text-rose-500 shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MACRO CALC PANEL */}
        {showMacroCalc && (
          <div className="bg-white rounded-2xl border-l-4 border-blue-500 shadow-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Target size={18} className="text-blue-600" /> Echten Bedarf berechnen
              </h3>
              <button onClick={() => setShowMacroCalc(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Geschlecht</label>
                <SegmentedControl value={userGender} onChange={setUserGender} options={[
                  { value: 'male', label: 'Männlich' }, { value: 'female', label: 'Weiblich' },
                ]} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alter</label>
                  <input type="number" value={userAge} onChange={(e) => setUserAge(Number(e.target.value))} className="w-full mt-1.5 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 tabular-nums" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">cm</label>
                  <input type="number" value={userHeight} onChange={(e) => setUserHeight(Number(e.target.value))} className="w-full mt-1.5 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 tabular-nums" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">kg</label>
                  <input type="number" step="0.1" value={userWeight} onChange={(e) => setUserWeight(Number(e.target.value))} className="w-full mt-1.5 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 tabular-nums" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Tagesaktivität</label>
              <SegmentedControl value={activityFactor} onChange={setActivityFactor} options={[
                { value: 1.2, label: 'Wenig' }, { value: 1.375, label: 'Leicht' }, { value: 1.55, label: 'Aktiv' },
              ]} />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Ziel</label>
              <SegmentedControl value={goalDeficit} onChange={setGoalDeficit} options={[
                { value: -500, label: 'Fettabbau' }, { value: 0, label: 'Halten' }, { value: 300, label: 'Aufbau' },
              ]} />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-slate-200 gap-3">
              <div>
                <div className="text-xs text-slate-500">BMR {Math.round(bmr)} · TDEE {Math.round(tdee)} kcal</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{calculatedTarget} <span className="text-sm font-medium text-slate-500">kcal</span></div>
              </div>
              <button onClick={() => { setDailyTarget(calculatedTarget); setShowMacroCalc(false); showToast(`Tagesziel auf ${calculatedTarget} kcal gesetzt`); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors w-full md:w-auto">
                Übernehmen
              </button>
            </div>
          </div>
        )}

        {/* KI ASSISTANT */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <Wand2 size={18} />
              <h3>KI Rezept-Assistent</h3>
            </div>
            <button onClick={() => setIsCreativeMode(!isCreativeMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isCreativeMode ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white shadow-md' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
              {isCreativeMode ? <Sparkles size={14} /> : <ToggleLeft size={14} />}
              {isCreativeMode ? 'KREATIV-MODUS' : 'Struktur-Modus'}
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input type="text"
                placeholder={isCreativeMode ? "Worauf hast du Lust?" : "Tippe ein Gericht oder eine Zutat..."}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAIForsuggestion()}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all ${
                  isCreativeMode ? 'border-purple-300 focus:ring-purple-400' : 'border-slate-200 focus:ring-blue-400'
                }`}
              />
            </div>
            <button onClick={askAIForsuggestion} disabled={isGeneratingAI || searchQuery.length < 2}
              className={`${isCreativeMode ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-5 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 font-bold shadow-md`}>
              {isGeneratingAI ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
              Fragen
            </button>
          </div>

          {searchQuery.length >= 2 && suggestedRecipes.length > 0 && !aiRecipeResult && !isCreativeMode && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Standard-Gerichte</h4>
              <div className="space-y-2">
                {suggestedRecipes.map(recipe => (
                  <div key={recipe.id} className="flex justify-between items-center bg-white p-3 border rounded-lg">
                    <span className="font-semibold text-sm">{recipe.name}</span>
                    <select className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 outline-none"
                      onChange={(e) => { if (e.target.value) addStandardRecipeToDay(e.target.value, recipe.name, recipe.ingredients); }}
                      defaultValue="">
                      <option value="" disabled>Einfügen in...</option>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiError && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm border border-rose-200">{aiError}</div>
          )}

          {aiRecipeResult && (
            <div className={`p-4 border rounded-xl shadow-sm ${isCreativeMode ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className={`flex items-center gap-2 font-bold mb-1 ${isCreativeMode ? 'text-purple-700' : 'text-indigo-700'}`}>
                {isCreativeMode ? <Sparkles size={16} /> : <Bot size={16} />} {aiRecipeResult.name}
              </div>
              <p className={`text-sm mb-3 italic ${isCreativeMode ? 'text-purple-600' : 'text-indigo-600'}`}>"{aiRecipeResult.reasoning}"</p>
              <div className="text-sm text-slate-700 mb-3">
                <span className="font-bold">Zutaten:</span>
                <ul className="list-disc pl-5 mt-1">
                  {aiRecipeResult.ingredients.map((ing, i) => (
                    <li key={i} className={ing.isNew ? 'text-purple-700 font-medium' : ''}>
                      {ing.name} {ing.isNew && <span className="text-xs">(NEU)</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-medium text-slate-500">Übernehmen für:</span>
                <select className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white flex-1 focus:ring-2 outline-none"
                  onChange={(e) => { if (e.target.value) addAiRecipeToDay(e.target.value); }} defaultValue="">
                  <option value="" disabled>Tag wählen...</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* WEEKDAYS */}
        <div className="space-y-3">
          {DAYS.map((day) => {
            const isExpanded = expandedDay === day;
            const isToday = day === todayKey;
            const totals = getDayTotals(plan[day]);
            const status = dayStatus(totals.kcal, dailyTarget);
            const accentColor = status === 'green' ? 'border-l-emerald-500' : status === 'over' ? 'border-l-rose-500' : status === 'under' ? 'border-l-amber-400' : 'border-l-slate-200';
            const isAiBusy = aiBusyDay === day;

            return (
              <div key={day} className={`bg-white rounded-2xl shadow-md transition-all ${
                isExpanded ? 'border-l-4 ' + accentColor + ' shadow-lg' : 'border border-slate-200'
              }`}>
                <button onClick={() => setExpandedDay(isExpanded ? null : day)} className="w-full px-5 py-4 hover:bg-slate-50/70 rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? <ChevronDown size={18} className="text-slate-400 shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                      <div className="flex flex-col items-start min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>{day}</h2>
                          {isToday && <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Heute</span>}
                          {plan[day].length > 0 && <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{plan[day].length} {plan[day].length === 1 ? 'Mahlzeit' : 'Mahlzeiten'}</span>}
                          {status === 'green' && <Check size={14} className="text-emerald-500" />}
                        </div>
                        {plan[day].length > 0 && <div className="mt-1.5"><MacroChips totals={totals} compact /></div>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[120px]">
                      <span className={`font-bold tabular-nums ${status === 'over' ? 'text-rose-600' : status === 'green' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {totals.kcal.toFixed(0)} <span className="text-xs text-slate-400 font-normal">/ {dailyTarget}</span>
                      </span>
                      <div className="w-full">
                        <DayProgressBar value={totals.kcal} target={dailyTarget} />
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4">
                    {plan[day].length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                        <p className="text-sm text-slate-500 mb-4">Noch keine Mahlzeiten für {day}.</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button onClick={() => addMeal(day)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">
                            <Plus size={14} /> Leere Mahlzeit
                          </button>
                          <button onClick={() => askAIForDay(day)} disabled={isAiBusy}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50">
                            {isAiBusy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            KI füllt diesen Tag
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {plan[day].map((meal) => {
                          const mealTotals = getMealTotals(meal);
                          return (
                            <div key={meal.id} className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                              <div className="flex justify-between items-start gap-2 mb-3 pb-3 border-b border-slate-200/80">
                                <input type="text" value={meal.name} onChange={(e) => updateMealName(day, meal.id, e.target.value)}
                                  className="font-bold text-slate-800 bg-transparent outline-none focus:bg-white rounded px-1 -mx-1 w-full" />
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm font-bold tabular-nums text-slate-700">{Math.round(mealTotals.kcal)} kcal</span>
                                  <MacroChips totals={mealTotals} compact />
                                  <button onClick={() => removeMeal(day, meal.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {meal.ingredients.map((ing) => {
                                  const food = foodDb.find(f => f.id === ing.foodId);
                                  const nuts = calcNutrients(ing.foodId, ing.grams);
                                  return (
                                    <div key={ing.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 group">
                                      <span className={`font-medium flex-1 text-sm ${food ? 'text-slate-700' : 'text-rose-500 italic'}`}>{food?.name || '⚠️ Zutat gelöscht'}</span>
                                      <input type="number" value={ing.grams} onChange={(e) => updateIngredientGrams(day, meal.id, ing.id, e.target.value)}
                                        className="w-16 px-2 py-1 text-right border border-slate-200 rounded text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-400" />
                                      <span className="text-xs text-slate-400 w-3">g</span>
                                      <span className="w-14 text-right font-semibold text-slate-700 tabular-nums text-sm">{nuts.kcal.toFixed(0)}</span>
                                      <button onClick={() => removeIngredient(day, meal.id, ing.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                                    </div>
                                  );
                                })}
                              </div>
                              <select className="w-full mt-3 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onChange={(e) => { if (e.target.value) { addIngredient(day, meal.id, e.target.value); e.target.value = ""; } }} defaultValue="">
                                <option value="" disabled>+ Zutat hinzufügen...</option>
                                {foodDb.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}
                              </select>
                            </div>
                          );
                        })}

                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => addMeal(day)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                            <Plus size={14} /> Mahlzeit
                          </button>
                          <button onClick={() => askAIForDay(day)} disabled={isAiBusy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50">
                            {isAiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            KI-Tag
                          </button>
                          <button onClick={() => scaleToTarget(day)} disabled={totals.kcal === 0}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 ml-auto">
                            <Calculator size={14} /> Auf {dailyTarget} skalieren
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
