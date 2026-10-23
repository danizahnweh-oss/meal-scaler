import { test } from "node:test";
import assert from "node:assert/strict";
import { DISHES } from "../src/data/dishes.js";
import { baseRecipe } from "../src/data/recipes.js";
import {
  sumNutrients,
  mealTotals,
  shoppingList,
  ingredientHits,
  legacyMeals,
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
test("legacy plans preserve ingredient grams and recipe steps", () => {
  const s = {
    plan: {
      Montag: [
        {
          id: 11,
          name: "Test",
          ingredients: [{ foodId: 1, grams: 180 }],
          instructions: ["Kochen"],
        },
      ],
    },
  };
  const result = legacyMeals(s, [{ id: 1, name: "Reis", kcal: 350 }]);
  assert.equal(result[0].data.ingredients[0].grams, 180);
  assert.deepEqual(result[0].data.instructions, ["Kochen"]);
  assert.equal(legacyMeals(s, [])[0].id, result[0].id);
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

test('migration only accepts the known storage keys and photo identifiers',async()=>{
 const {validateTransfer}=await import('../src/transfer.js');
 const pack={version:1,storage:{tm_who:'a',tm_local:'{}'},photos:[['local:test','data:image/jpeg;base64,AA==']]};
 assert.equal(validateTransfer(pack),pack);
 assert.throws(()=>validateTransfer({...pack,storage:{unexpected:'secret'}}),/unbekannte/);
 assert.throws(()=>validateTransfer({...pack,photos:[['remote:test','data']]}),/Fotosicherung/);
});

test('migration preserves votes, pending operations, session and photo bytes, and refuses a second overwrite',async()=>{
 const {IDBFactory}=await import('fake-indexeddb');
 const {adoptTransfer}=await import('../src/transfer.js');
 const previousStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const previousDB=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
 const memory=new Map();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}});
 Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:new IDBFactory()});
 try{
  const pack={version:1,storage:{tm_who:'a',tm_local:JSON.stringify({swipes:{a:{lasagne:true},b:{pomodoro:false}},custom:[{id:'cphoto',photo:'local:test'}]}),tm_cloud_v1:JSON.stringify({queue:[{operation:'retry-once',kind:'vote'}],imported:['member']}),'sb-zrblwvuhzhvljkmhtvgg-auth-token':'test-session-not-a-real-credential'},photos:[['local:test','data:image/jpeg;base64,/9j/2Q==']]};
  await adoptTransfer(pack);
  assert.equal(JSON.parse(memory.get('tm_local')).swipes.a.lasagne,true);
  assert.equal(JSON.parse(memory.get('tm_cloud_v1')).queue[0].operation,'retry-once');
  assert.equal(memory.get('sb-zrblwvuhzhvljkmhtvgg-auth-token'),pack.storage['sb-zrblwvuhzhvljkmhtvgg-auth-token']);
  assert.ok(memory.has('tm_transfer_backup_v1'));
  const db=await new Promise(resolve=>{const r=indexedDB.open('teller-match-photos',1);r.onsuccess=()=>resolve(r.result);});
  const blob=await new Promise(resolve=>{const r=db.transaction('photos').objectStore('photos').get('local:test');r.onsuccess=()=>resolve(r.result);});
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())],[255,216,255,217]);db.close();
  await assert.rejects(adoptTransfer({...pack,storage:{tm_who:'b'}}),/überschreibt/);
  assert.equal(memory.get('tm_who'),'a');
 }finally{
  if(previousStorage)Object.defineProperty(globalThis,'localStorage',previousStorage);else delete globalThis.localStorage;
  if(previousDB)Object.defineProperty(globalThis,'indexedDB',previousDB);else delete globalThis.indexedDB;
 }
});
