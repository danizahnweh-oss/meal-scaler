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
// New entries created locally before pairing join the new shared area once connected.
export function pendingLocalRecords(local,view){
 return local.flatMap(record=>{
  if(record.deleted)return [];
  const personal=['goal','profile'].includes(record.kind);
  if(personal&&record.id!=='local-'+view.me.slot)return [];
  const id=personal?view.me.id:record.id;
  if((view.planning||[]).some(r=>r.kind===record.kind&&r.id===id))return [];
  return [{kind:record.kind,payload:{id,data:record.data,deleted:false,expected:0}}];
 });
}
