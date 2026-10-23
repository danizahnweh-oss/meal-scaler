import { test } from "node:test";
import assert from "node:assert/strict";
import { DISHES } from "../src/data/dishes.js";
import { baseRecipe } from "../src/data/recipes.js";
import {
  sumNutrients,
  mealTotals,
  shoppingList,
  ingredientHits,
  pendingLocalRecords,
} from "../src/planning.js";
import { projectSnapshot } from "../public/match/sync-core.js";
test("every existing dish has quantities, nutrition and specific cooking steps without changing ids", () => {
  assert.equal(DISHES.length, 72);
  assert.equal(new Set(DISHES.map((d) => d.id)).size, 72);
  for (const dish of DISHES) {
    const r = baseRecipe(dish);
    assert.equal(r.dishId, dish.id);
    assert.ok(r.ingredients.length >= 3, dish.id);
    assert.ok(r.instructions.length >= 3, dish.id);
    assert.ok(sumNutrients(r.ingredients).kcal > 0, dish.id);
    for (const i of r.ingredients) {
      assert.ok(i.grams > 0, dish.id);
      assert.ok(Number.isFinite(i.kcal), dish.id);
    }
  }
});
test("different personal portions produce correct calories and combined shopping amounts", () => {
  const meal = {
    ingredients: [
      { name: "Pasta", grams: 100, kcal: 360, p: 12, c: 72, f: 1.5 },
    ],
    portions: { a: 1.5, b: 0.75 },
  };
  assert.equal(mealTotals(meal, "a").kcal, 540);
  assert.equal(mealTotals(meal, "b").kcal, 270);
  assert.equal(shoppingList([meal])[0].grams, 225);
  assert.equal(meal.ingredients[0].grams, 100);
});
test("exclusions handle aliases, inflection and raw versus cooked ingredients", () => {
  assert.deepEqual(
    ingredientHits([{ name: "Tofu", prep: "gegart" }], ["Soja"]),
    ["Soja"],
  );
  assert.deepEqual(
    ingredientHits(
      [{ name: "Knoblauch", prep: "gegart" }],
      ["roher Knoblauch"],
    ),
    [],
  );
  assert.deepEqual(
    ingredientHits([{ name: "Knoblauch" }], ["roher Knoblauch"]),
    ["roher Knoblauch"],
  );
  assert.deepEqual(
    ingredientHits([{ name: "Paprika (rot)", prep: "roh" }], ["rohe Paprika"]),
    ["rohe Paprika"],
  );
  assert.deepEqual(ingredientHits([{ name: "Lachsfilet" }], ["Fisch"]), [
    "Fisch",
  ]);
  assert.deepEqual(
    ingredientHits([{ name: "Zwiebel", prep: "roh" }], ["rohe Zwiebeln"]),
    ["rohe Zwiebeln"],
  );
  assert.deepEqual(ingredientHits([{ name: "Apfelmus" }], ["Äpfel"]), [
    "Äpfel",
  ]);
});
test("offline planning rejects stale changes after deletion and cannot alter the other profile", () => {
  const snapshot = {
    room: { id: "r" },
    me: { id: "a", epoch: 0 },
    members: [],
    votes: [],
    dishes: [],
    planning: [
      {
        kind: "meal",
        id: "one",
        revision: 2,
        deleted: true,
        data: { name: "Removed" },
      },
    ],
  };
  const view = projectSnapshot(snapshot, [
    {
      member: "a",
      kind: "plan:meal",
      payload: { id: "one", expected: 1, data: { name: "Old" } },
    },
    {
      member: "b",
      kind: "plan:goal",
      payload: { id: "b", expected: 0, data: { kcal: 1200 } },
    },
  ]);
  assert.equal(view.planning.length, 1);
  assert.equal(view.planning[0].deleted, true);
});

test('new local planning syncs once without importing other profiles or reviving removed meals',()=>{
 const view={me:{id:'daniel',slot:'a'},planning:[{kind:'meal',id:'removed',deleted:true}]};
 const tasks=pendingLocalRecords([{kind:'goal',id:'local-a',data:{kcal:2400}},{kind:'goal',id:'local-b',data:{kcal:1800}},{kind:'meal',id:'new',data:{name:'Neu'}},{kind:'meal',id:'removed',data:{name:'Alt'}}],view);
 assert.deepEqual(tasks.map(t=>t.payload.id),['daniel','new']);
 assert.equal(tasks[0].payload.expected,0);
});
