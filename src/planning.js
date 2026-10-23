export const DAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
export const today = () => DAYS[(new Date().getDay() + 6) % 7];
export const sumNutrients = (ingredients) =>
  ingredients.reduce(
    (t, i) => {
      for (const k of ["kcal", "p", "c", "f"])
        t[k] += ((Number(i[k]) || 0) * i.grams) / 100;
      return t;
    },
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
export function portionIngredients(ingredients, factor) {
  return ingredients.map((i) => ({
    ...i,
    grams: Math.round(i.grams * factor * 10) / 10,
  }));
}
export function mealTotals(meal, slot) {
  return sumNutrients(
    portionIngredients(meal.ingredients, Number(meal.portions?.[slot] ?? 1)),
  );
}
export function shoppingList(meals) {
  const grouped = new Map();
  for (const meal of meals) {
    const count = Number(meal.portions?.a ?? 1) + Number(meal.portions?.b ?? 1);
    for (const ingredient of meal.ingredients) {
      const key = normalize(ingredient.name) + "|" + (ingredient.prep || "");
      if (!grouped.has(key)) grouped.set(key, { ...ingredient, grams: 0 });
      grouped.get(key).grams += ingredient.grams * count;
    }
  }
  return [...grouped.values()]
    .map((i) => ({ ...i, grams: Math.round(i.grams) }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}
export const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .trim();
const aliases = {
  fisch: [
    "fisch",
    "lachs",
    "thunfisch",
    "kabeljau",
    "sardine",
    "forelle",
    "sardelle",
    "anchovis",
    "fischsauce",
  ],
  soja: ["soja", "tofu", "tempeh", "edamame"],
  schwein: ["schwein", "speck", "bacon", "schinken", "salami"],
  walnuss: ["walnuss", "walnusse"],
  apfel: ["apfel", "apfelsaft"],
  apfelplural: ["apfel"],
  milch: [
    "milch",
    "joghurt",
    "quark",
    "sahne",
    "butter",
    "kase",
    "mozzarella",
    "ricotta",
    "feta",
    "mascarpone",
    "paneer",
    "skyr",
  ],
  gluten: [
    "weizen",
    "roggen",
    "gerste",
    "nudeln",
    "pasta",
    "brot",
    "couscous",
    "griess",
    "spatzle",
    "tortilla",
    "filo",
  ],
};
export function ingredientHits(ingredients, exclusions) {
  return exclusions.filter((exclusion) => {
    let needle = normalize(exclusion);
    const raw = /^roh(?:e|er|es)?\s+/.test(needle);
    needle = needle.replace(/^roh(?:e|er|es)?\s+/, "");
    if (needle === "zwiebeln") needle = "zwiebel";
    const needles =
      aliases[needle] || (needle === "apfel" ? ["apfel"] : [needle]);
    return ingredients.some((i) => {
      const name = normalize(i.name);
      if (raw && i.prep === "gegart") return false;
      return (
        needles.some((n) => name.includes(n)) ||
        (needle === "apfel" && name.includes("apfel"))
      );
    });
  });
}
export function legacyMeals(saved, foods) {
  const result = [];
  for (const day of DAYS)
    for (const [index, m] of (saved.plan?.[day] || []).entries()) {
      result.push({
        id: "legacy-" + day + "-" + (m.id ?? index),
        data: {
          name: m.name || "Mahlzeit",
          day,
          portions: { a: 1, b: 0 },
          ingredients: (m.ingredients || []).map((i) => {
            const f = foods.find((f) => f.id === i.foodId);
            return {
              ...f,
              name: f?.name || "Unbekannte Zutat",
              grams: Number(i.grams) || 0,
            };
          }),
          instructions: m.instructions || [],
        },
      });
    }
  return result;
}
