import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Utensils,
  CalendarDays,
  Settings,
  ArrowLeft,
  Plus,
  X,
  ShoppingBasket,
  Search,
  Check,
  ChevronRight,
} from "lucide-react";
import { CREDITS } from './data/credits.js';
import { DISHES, DEFAULT_EXCL } from "./data/dishes.js";
import { FOODS } from "./data/foods.js";
import { baseRecipe, EXTRA_FOODS } from "./data/recipes.js";
import {
  DAYS,
  today,
  sumNutrients,
  mealTotals,
  shoppingList,
  ingredientHits,
  pendingLocalRecords,
  normalize,
} from "./planning.js";
import "./App.css";
const LOCAL = "meal_scaler_combined_v1";
const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const initialLocal = load(LOCAL, []);
const EMPTY = {};
const round = (n) => Math.round(n || 0);
const defaultNames = { a: "Daniel", b: "Stina" };
const allFoods = [...FOODS, ...EXTRA_FOODS];
function Nutrition({ totals }) {
  return (
    <div className="nutrition">
      <strong>
        {round(totals.kcal)} <span>kcal</span>
      </strong>
      <span>{round(totals.p)} g Eiweiß</span>
      <span>{round(totals.c)} g KH</span>
      <span>{round(totals.f)} g Fett</span>
    </div>
  );
}
export default function App() {
  const frame = useRef(null),
    requests = useRef(new Map());
  const [screen, setScreen] = useState(
    location.hash.startsWith("#einladung=") ? "more" : "swipe",
  );
  const [state, setState] = useState(null),
    [local, setLocal] = useState(initialLocal),
    [selection, setSelection] = useState(null),
    [notice, setNotice] = useState(""),
    [query, setQuery] = useState("");
  useEffect(()=>{document.querySelector('.app-main')?.scrollTo({top:0,behavior:'auto'});},[screen,selection]);
  const [frameUrl] = useState(
    () => "/match/index.html?embedded=1" + location.hash,
  );
  const me = state?.me || null,
    names = state?.names || defaultNames,
    connected = !!state?.connected;
  const member = state?.view?.me?.id || "local-" + (me || "a");
  const records = useMemo(
    () => (connected ? state.view?.planning || [] : local),
    [connected, state, local],
  );
  const row = (kind, id) => records.find((r) => r.kind === kind && r.id === id);
  const profile = row("profile", member)?.data || EMPTY;
  const goal = (slot) => {
    const id = connected
      ? state.view.members.find((m) => m.slot === slot)?.id
      : "local-" + slot;
    return records.find((r) => r.kind === "goal" && r.id === id && !r.deleted)
      ?.data.kcal;
  };
  const post = (m) =>
    frame.current?.contentWindow?.postMessage(m, location.origin);
  function message(text) {
    setNotice(text);
  }
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const synchronizedRooms=new Set();
    const receive = (e) => {
      if (
        e.origin === location.origin &&
        e.source === frame.current?.contentWindow
      ) {
        if (e.data.type === "tm:state") {
          setState(e.data.state);
          const view=e.data.state.connected&&e.data.state.view;
          if(view){
            const key=view.room.id+':'+view.me.id;
            if(!synchronizedRooms.has(key)){
              synchronizedRooms.add(key);
              for(const task of pendingLocalRecords(load(LOCAL,[]),view))frame.current.contentWindow.postMessage({type:'tm:enqueue',id:crypto.randomUUID(),kind:'plan:'+task.kind,payload:task.payload},location.origin);
            }
          }
          if (e.data.state.connected && location.hash.startsWith("#einladung="))
            history.replaceState(null, "", location.pathname);
        }
        if (e.data.type === "tm:tab-changed" && ['swipe','matches','more'].includes(e.data.tab)) setScreen(previous=>['swipe','matches','more'].includes(previous)?e.data.tab:previous);
        if (e.data.type === "tm:recipe") {
          setSelection(e.data.id);
          setScreen("recipe");
        }
        if (e.data.type === "tm:notice") message(e.data.message);
        if (e.data.type === "tm:reply") {
          const r = requests.current.get(e.data.id);
          if (r) {
            clearTimeout(r.timer);
            requests.current.delete(e.data.id);
            e.data.error ? r.reject(new Error(e.data.error)) : r.resolve();
          }else if(e.data.error)message(e.data.error);
        }
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (["swipe", "matches", "more"].includes(screen))
      post({ type: "tm:tab", tab: screen });
  }, [screen, state?.me]);
  const dishes =
    state?.dishes ||
    DISHES.map((d) => ({ ...d, image: "fotos/" + d.id + ".jpg" }));
  const recipes = useMemo(
    () =>
      Object.fromEntries(
        records
          .filter((r) => r.kind === "recipe" && !r.deleted)
          .map((r) => [r.id, r]),
      ),
    [records],
  );
  const exclusions = state?.excl || DEFAULT_EXCL;
  const blocked = useMemo(
    () =>
      Object.fromEntries(
        dishes
          .map((d) => [
            d.id,
            ingredientHits(
              (recipes[d.id]?.data || baseRecipe(d)).ingredients,
              exclusions,
            ),
          ])
          .filter(([, h]) => h.length),
      ),
    [dishes, recipes, exclusions],
  );
  useEffect(() => {
    post({ type: "tm:blocked", blocked });
  }, [blocked]);
  async function write(
    kind,
    id,
    data,
    deleted = false,
    expected = row(kind, id)?.revision || 0,
  ) {
    if (!me)
      throw new Error("Bitte zuerst unter „Wischen“ deinen Namen wählen.");
    if (connected) {
      const request = crypto.randomUUID();
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          requests.current.delete(request);
          reject(
            new Error(
              "Die Änderung konnte nicht vorgemerkt werden. Bitte erneut versuchen.",
            ),
          );
        }, 12000);
        requests.current.set(request, { resolve, reject, timer });
        post({
          type: "tm:enqueue",
          id: request,
          kind: "plan:" + kind,
          payload: { id, data, deleted, expected },
        });
      });
    } else {
      setLocal((previous) => {
        const old = previous.find((r) => r.kind === kind && r.id === id);
        if ((old?.revision || 0) !== expected) {
          message("Die Daten wurden inzwischen geändert. Bitte erneut öffnen.");
          return previous;
        }
        const next = [
          ...previous.filter((r) => !(r.kind === kind && r.id === id)),
          { kind, id, data, deleted, revision: expected + 1, owner_id: member },
        ];
        localStorage.setItem(LOCAL, JSON.stringify(next));
        return next;
      });
    }
  }
  const safe =
    (action) =>
    async (...args) => {
      try {
        await action(...args);
        return true;
      } catch (error) {
        message(error.message);
        return false;
      }
    };
  function openRecipe(id) {
    setSelection(id);
    setScreen("recipe");
  }
  const selectedDish = dishes.find((d) => d.id === selection);
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <a
            className="wordmark"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setScreen("swipe");
            }}
          >
            Teller<span> & </span>Plan
          </a>
          <p>Gemeinsam essen. Für jeden passend.</p>
        </div>
        <button className="identity" onClick={() => setScreen("more")}>
          {me ? names[me] : "Name wählen"}
          <Settings size={16} />
        </button>
      </header>
      <div className="connection" role="status">
        {state?.status || "App wird geladen …"}
        {!connected && state && " · Planung auf diesem Gerät"}
      </div>
      <main
        className={
          "app-main " +
          (["swipe", "matches", "more"].includes(screen) ? "with-frame" : "")
        }
      >
        <div
          className="teller-frame"
          hidden={!["swipe", "matches", "more"].includes(screen)}
        >
          <iframe
            ref={frame}
            src={frameUrl}
            title="Gemeinsame Gerichte und Handy-Verbindung"
            onLoad={() => {
              post({
                type: "tm:tab",
                tab: ["swipe", "matches", "more"].includes(screen)
                  ? screen
                  : "swipe",
              });
              post({ type: "tm:refresh" });
              post({ type: "tm:blocked", blocked });
            }}
          />
        </div>
        {screen === "recipe" && selectedDish && (
          <Recipe
            key={selection}
            dish={selectedDish}
            record={recipes[selection]}
            foods={[...allFoods, ...(profile.customFoods || [])]}
            names={names}
            me={me}
            exclusions={exclusions}
            onBack={() => setScreen("plan")}
            onSave={safe(async (data, expected) => {
              await write("recipe", selection, data, false, expected);
              message("Rezept gespeichert.");
            })}
            onPlan={safe(async (data) => {
              await write("meal", crypto.randomUUID(), data);
              message("Zum Wochenplan hinzugefügt.");
              setScreen("plan");
            })}
          />
        )}
        {screen === "plan" && (
          <div className="page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Euer Alltag</p>
                <h1>Was kommt auf den Tisch?</h1>
              </div>
              <CalendarDays size={30} />
            </div>
            {!connected && (
              <p className="hint">
                Die Planung bleibt zunächst auf diesem Gerät. Unter „Mehr“ könnt
                ihr eure Handys verbinden. Danach wird sie automatisch abgeglichen.
              </p>
            )}
            <Week
              records={records}
              names={names}
              me={me}
              goal={goal}
              exclusions={exclusions}
              onWrite={write}
              onRecipe={openRecipe}
              onMessage={message}
            />
            <section className="section">
              <h2>Gerichte entdecken</h2><p className="muted">Servierbeispiele · <a href="/BILDNACHWEISE.md" target="_blank" rel="noreferrer">Bildnachweise und Lizenzen</a></p>
              <label className="search">
                <Search size={20} />
                <input
                  aria-label="Gerichte suchen"
                  placeholder="Gericht suchen …"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="recipe-grid">
                {dishes
                  .filter(
                    (d) =>
                      !blocked[d.id] &&
                      normalize(d.name).includes(normalize(query)),
                  )
                  .map((d) => (
                    <button
                      key={d.id}
                      className="recipe-card"
                      onClick={() => openRecipe(d.id)}
                    >
                      {d.image && (
                        <img
                          src={
                            d.image.startsWith("fotos/")
                              ? "/match/" + d.image
                              : d.image
                          }
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <span>
                        <strong>{d.name}</strong>
                        <small>
                          {d.time} Min. · {d.cuisine}
                        </small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
              </div>
            </section>
            <AIAssistant
              foods={[...allFoods, ...(profile.customFoods || [])]}
              exclusions={exclusions}
              pantry={profile.pantry || []}
              onRecipe={safe(async (d) => {
                const id = "cai" + crypto.randomUUID().replaceAll("-", "");
                await write("recipe", id, d);
                await write("meal", crypto.randomUUID(), {
                  ...d,
                  day: today(),
                  portions: { a: me === "a" ? 1 : 0, b: me === "b" ? 1 : 0 },
                });
                message(
                  "KI-Vorschlag zum Plan hinzugefügt. Bitte Zutaten und Mengen prüfen.",
                );
              })}
            />
          </div>
        )}
        {screen === "profile" && (
          <div className="page">
            <Personal
              key={member}
              me={me}
              names={names}
              goal={goal(me)}
              profile={profile}
              onSave={safe(async (kcal, data) => {
                await write("goal", member, { kcal });
                await write("profile", member, data);
                message("Dein persönliches Ziel wurde gespeichert.");
              })}
            />

          </div>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {[
          ["swipe", "Wischen", Utensils],
          ["matches", "Matches", Heart],
          ["plan", "Plan", CalendarDays],
          ["profile", "Mein Ziel", Settings],
          ["more", "Mehr", Plus],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            aria-current={screen === id || (screen === "recipe" && id === "plan") ? "page" : undefined}
            className={screen === id || (screen === "recipe" && id === "plan") ? "active" : ""}
            onClick={() => setScreen(id)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {notice && (
        <div className="notification" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Hinweis schließen">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function IngredientEditor({ ingredients, onChange, foods }) {
  const [search, setSearch] = useState("");
  const update = (index, patch) =>
    onChange(ingredients.map((i, n) => (n === index ? { ...i, ...patch } : i)));
  return (
    <div className="ingredient-editor">
      <div className="ingredient-heading">
        <span>Zutat · Grundportion</span>
        <span>Gramm</span>
      </div>
      {ingredients.map((i, index) => (
        <div className="ingredient-row" key={index}>
          <div>
            <strong>{i.name}</strong>
            <select
              aria-label={"Zubereitung " + i.name}
              value={i.prep || "unbekannt"}
              onChange={(e) => update(index, { prep: e.target.value })}
            >
              <option value="gegart">gegart</option>
              <option value="roh">roh</option>
              <option value="unbekannt">Zubereitung unklar</option>
            </select>
          </div>
          <input
            type="number"
            aria-label={"Gramm " + i.name}
            min="0"
            max="100000"
            step="0.1"
            required
            value={i.grams}
            onChange={(e) =>
              update(index, {
                grams: Math.max(0, Math.min(100000, Number(e.target.value))),
              })
            }
          />
          <button
            type="button"
            className="icon-button"
            aria-label={i.name + " entfernen"}
            onClick={() => onChange(ingredients.filter((_, n) => n !== index))}
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <label>
        Zutat hinzufügen
        <input
          placeholder="Lebensmittel suchen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {search.length > 1 && (
        <div className="food-results">
          {foods
            .filter((f) => normalize(f.name).includes(normalize(search)))
            .slice(0, 12)
            .map((f, index) => (
              <button
                key={String(f.id) + "-" + index}
                type="button"
                className="secondary"
                onClick={() => {
                  onChange([
                    ...ingredients,
                    { ...f, grams: f.defaultGrams || 100, prep: "unbekannt" },
                  ]);
                  setSearch("");
                }}
              >
                <Plus size={16} />
                {f.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
function Recipe({
  dish,
  record,
  foods,
  names,
  me,
  exclusions,
  onBack,
  onSave,
  onPlan,
}) {
  const initial = record?.data || baseRecipe(dish);
  const [draft, setDraft] = useState(() => structuredClone(initial)),
    [day, setDay] = useState(today()),
    [expected, setExpected] = useState(record?.revision || 0),
    [dirty, setDirty] = useState(false),
    [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (dirty) return;
    const task = requestAnimationFrame(() => {
      setDraft(structuredClone(record?.data || baseRecipe(dish)));
      setExpected(record?.revision || 0);
    });
    return () => cancelAnimationFrame(task);
  }, [record, dish, dirty]);
  const change = (patch) => {
    setDirty(true);
    setDraft((d) => ({ ...d, ...patch }));
  };
  const hits = ingredientHits(draft.ingredients, exclusions);
  const portions = draft.portions || { a: 1, b: 1 };
  const total = Number(portions.a) + Number(portions.b);
  const valid =
    draft.ingredients.length > 0 &&
    draft.ingredients.every((i) => Number.isFinite(i.grams) && i.grams >= 0) &&
    total > 0 &&
    hits.length === 0;
  async function submit(action) {
    setSubmitting(true);
    try {
      await action();
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="page recipe-detail">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Zum Plan
      </button>
      {dish.image && (
        <img
          className="detail-photo"
          src={
            dish.image.startsWith("fotos/")
              ? "/match/" + dish.image
              : dish.image
          }
          alt={dish.name}
        />
      )}
      {CREDITS[dish.id] && <p className="photo-credit"><a href={'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(CREDITS[dish.id][2])} target="_blank" rel="noreferrer">Foto: {CREDITS[dish.id][0]} · {CREDITS[dish.id][1]}</a></p>}
      <p className="eyebrow">
        {dish.cuisine} · {dish.time} Minuten
      </p>
      <h1>{dish.name}</h1>
      <p>{dish.desc}</p>
      {expected !== (record?.revision || 0) && dirty && (
        <p role="alert" className="warning">
          Dieses Rezept wurde inzwischen geändert. Öffne es erneut, bevor du
          speicherst.
        </p>
      )}
      <section className="section">
        <h2>Eure Portionen</h2>
        <p className="muted">
          Eine Grundportion entspricht den unten angegebenen Mengen. Die
          Faktoren können für euch unterschiedlich sein.
        </p>
        <div className="two-columns">
          {["a", "b"].map((slot) => (
            <label key={slot}>
              {names[slot]}
              <input
                type="number"
                aria-label={"Portionsfaktor " + names[slot]}
                min="0"
                max="10"
                step="0.1"
                value={portions[slot]}
                onChange={(e) =>
                  change({
                    portions: {
                      ...portions,
                      [slot]: Math.max(0, Math.min(10, Number(e.target.value))),
                    },
                  })
                }
              />
              <small>
                {round(sumNutrients(draft.ingredients).kcal * portions[slot])}{" "}
                kcal
              </small>
            </label>
          ))}
        </div>
        <p className="total-line">
          Zusammen kochen:{" "}
          <strong>{Math.round(total * 10) / 10} Grundportionen</strong>
        </p>
        <Nutrition
          totals={sumNutrients(
            draft.ingredients.map((i) => ({ ...i, grams: i.grams * total })),
          )}
        />
      </section>
      <section className="section">
        <h2>Zutaten & Mengen</h2>
        <p className="muted">
          Reis, Nudeln, Mehl und trockene Linsen sind als Trockengewicht
          angegeben. Nährwerte sind Schätzwerte; Produktangaben können
          abweichen.
        </p>
        {hits.length > 0 && (
          <p role="alert" className="warning">
            Passt nicht zu eurer Ausschlussliste: {hits.join(", ")}. Bitte die
            Zutaten anpassen.
          </p>
        )}
        {!draft.ingredients.length && (
          <p className="hint">
            Für dieses eigene Gericht fehlen noch Mengen. Ergänze die Zutaten,
            bevor du es einplanst.
          </p>
        )}
        <IngredientEditor
          ingredients={draft.ingredients}
          foods={foods}
          onChange={(ingredients) => change({ ingredients })}
        />
        <details>
          <summary>Einkaufsmenge für dieses Gericht</summary>
          <ul className="amount-list">
            {draft.ingredients.map((i, n) => (
              <li key={n}>
                <span>{i.name}</span>
                <strong>{round(i.grams * total)} g</strong>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="section">
        <h2>So wird gekocht</h2>
        <ol className="steps">
          {(draft.instructions || []).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <details>
          <summary>Kochschritte bearbeiten</summary>
          <label>
            Ein Schritt pro Zeile
            <textarea
              rows="7"
              value={(draft.instructions || []).join("\n")}
              onChange={(e) =>
                change({ instructions: e.target.value.split("\n") })
              }
            />
          </label>
        </details>
        <p className="muted">
          Fotos zeigen Servierbeispiele. Maßgeblich sind die Zutaten und
          Kochschritte hier.
        </p>
      </section>
      <div className="sticky-actions">
        <button
          className="secondary"
          disabled={
            submitting || !valid || expected !== (record?.revision || 0)
          }
          onClick={() =>
            submit(async () => {
              if (await onSave(draft, expected)) setDirty(false);
            })
          }
        >
          Rezept speichern
        </button>
        <label>
          Tag
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={submitting || !valid || !me}
          onClick={() =>
            submit(() =>
              onPlan({ ...draft, dishId: dish.id, name: dish.name, day }),
            )
          }
        >
          <Plus size={18} />
          Einplanen
        </button>
      </div>
    </div>
  );
}
function Week({
  records,
  names,
  me,
  goal,
  exclusions,
  onWrite,
  onRecipe,
  onMessage,
}) {
  const [day, setDay] = useState(today()),
    [shopping, setShopping] = useState(false),
    [busy, setBusy] = useState(false);
  const meals = records.filter((r) => r.kind === "meal" && !r.deleted);
  const dayMeals = meals.filter((r) => r.data.day === day);
  const totals = (slot) =>
    dayMeals.reduce(
      (t, m) => {
        const n = mealTotals(m.data, slot);
        for (const k in t) t[k] += n[k];
        return t;
      },
      { kcal: 0, p: 0, c: 0, f: 0 },
    );
  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      onMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="section week">
      <div className="section-heading">
        <h2>Euer Wochenplan</h2>
        <button
          className="secondary"
          aria-expanded={shopping}
          onClick={() => setShopping(!shopping)}
        >
          <ShoppingBasket size={18} />
          Einkauf
        </button>
      </div>
      {shopping && (
        <div className="shopping">
          <h3>Einkauf für die ganze Woche</h3>
          {meals.length ? (
            <ul className="amount-list">
              {shoppingList(meals.map((r) => r.data)).map((i, n) => (
                <li key={n}>
                  <label>
                    <input type="checkbox" />
                    {i.name}
                  </label>
                  <strong>{round(i.grams)} g</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Noch keine Mahlzeiten eingeplant.</p>
          )}
        </div>
      )}
      <div className="day-tabs" role="group" aria-label="Wochentag">
        {DAYS.map((d) => (
          <button key={d} aria-pressed={day === d} onClick={() => setDay(d)}>
            {d.slice(0, 2)}
            <small>{meals.filter((r) => r.data.day === d).length || "–"}</small>
          </button>
        ))}
      </div>
      <h3>{day}</h3>
      <div className="two-columns daily-totals">
        {["a", "b"].map((slot) => (
          <div key={slot}>
            <strong>{names[slot]}</strong>
            <p>
              <b>{round(totals(slot).kcal)}</b> / {goal(slot) || "–"} kcal
            </p>
            <progress
              aria-label={"Kalorienbilanz " + names[slot]}
              max={goal(slot) || 1}
              value={Math.min(totals(slot).kcal, goal(slot) || 0)}
            />
            <small>
              {goal(slot)
                ? `${round(Math.abs(goal(slot) - totals(slot).kcal))} kcal ${totals(slot).kcal > goal(slot) ? "über dem Ziel" : "übrig"}`
                : "Persönliches Ziel noch offen"}
            </small>
          </div>
        ))}
      </div>
      {dayMeals.length === 0 ? (
        <div className="empty">
          <Utensils size={28} />
          <p>Noch Platz für etwas Gutes.</p>
          <span>
            Öffne unten ein Gericht oder wähle eines aus euren Matches.
          </span>
        </div>
      ) : (
        dayMeals.map((record) => {
          const m = record.data;
          return (
            <article className="planned-meal" key={record.id}>
              <div className="section-heading">
                <h3>{m.name}</h3>
                <button
                  className="icon-button"
                  aria-label={m.name + " aus dem Plan entfernen"}
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      onWrite("meal", record.id, m, true, record.revision),
                    )
                  }
                >
                  <X size={18} />
                </button>
              </div>
              <div>
                {ingredientHits(m.ingredients, exclusions).length > 0 && (
                  <p className="warning">
                    Ausschlussliste geändert:{" "}
                    {ingredientHits(m.ingredients, exclusions).join(", ")}.
                    Bitte diese Mahlzeit prüfen.
                  </p>
                )}
              </div>
              <div className="two-columns">
                {["a", "b"].map((slot) => (
                  <div key={slot}>
                    <p>
                      {names[slot]} · {m.portions?.[slot] ?? 1} Portion(en)
                    </p>
                    <Nutrition totals={mealTotals(m, slot)} />
                  </div>
                ))}
              </div>
              <div className="meal-actions">
                {m.dishId && (
                  <button
                    className="text-button"
                    onClick={() => onRecipe(m.dishId)}
                  >
                    Rezept öffnen
                    <ChevronRight size={16} />
                  </button>
                )}
                <label>
                  Verschieben
                  <select
                    value={m.day}
                    disabled={busy}
                    onChange={(e) =>
                      run(() =>
                        onWrite(
                          "meal",
                          record.id,
                          { ...m, day: e.target.value },
                          false,
                          record.revision,
                        ),
                      )
                    }
                  >
                    {DAYS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
              </div>
              <details>
                <summary>Zutaten und Kochschritte</summary>
                <ul className="amount-list">
                  {m.ingredients.map((i, n) => (
                    <li key={n}>
                      <span>{i.name}</span>
                      <strong>
                        {round(
                          i.grams *
                            ((m.portions?.a ?? 1) + (m.portions?.b ?? 1)),
                        )}{" "}
                        g
                      </strong>
                    </li>
                  ))}
                </ul>
                <ol>
                  {(m.instructions || []).map((s, n) => (
                    <li key={n}>{s}</li>
                  ))}
                </ol>
              </details>
            </article>
          );
        })
      )}
      {dayMeals.length > 0 && (
        <button
          className="secondary full"
          disabled={!me || !goal(me) || !totals(me).kcal || busy}
          onClick={() =>
            run(async () => {
              const ratio = goal(me) / totals(me).kcal;
              for (const r of dayMeals)
                await onWrite(
                  "meal",
                  r.id,
                  {
                    ...r.data,
                    portions: {
                      ...r.data.portions,
                      [me]:
                        Math.round(
                          (r.data.portions?.[me] ?? 1) * ratio * 1000,
                        ) / 1000,
                    },
                  },
                  false,
                  r.revision,
                );
              onMessage(
                "Deine Tagesmengen wurden auf dein Ziel angepasst. Die Portionen der anderen Person bleiben erhalten.",
              );
            })
          }
        >
          Meine Mengen auf {goal(me) || "mein Ziel"} kcal skalieren
        </button>
      )}
    </section>
  );
}
function Personal({ me, names, goal, profile, onSave }) {
  const [kcal, setKcal] = useState(goal || ""),
    [weight, setWeight] = useState(profile.weight || ""),
    [pantry, setPantry] = useState((profile.pantry || []).join(", ")),
    [customFoods, setCustomFoods] = useState(profile.customFoods || []),
    [food, setFood] = useState({
      name: "",
      kcal: "",
      p: "",
      c: "",
      f: "",
      defaultGrams: 100,
    }),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (dirty) return;
    const task = requestAnimationFrame(() => {
      setKcal(goal || "");
      setWeight(profile.weight || "");
      setPantry((profile.pantry || []).join(", "));
      setCustomFoods(profile.customFoods || []);
    });
    return () => cancelAnimationFrame(task);
  }, [goal, profile, dirty]);
  const edit = (setter) => (e) => {
    setDirty(true);
    setter(e.target.value);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Nur für dich</p>
          <h1>{me ? names[me] + "s Tagesziel" : "Dein Tagesziel"}</h1>
        </div>
      </div>
      {!me && (
        <p className="hint">Wähle zuerst deinen Namen unter „Wischen“.</p>
      )}
      <form
        className="section"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            if (
              await onSave(Number(kcal), {
                ...profile,
                weight: weight ? Number(weight) : null,
                pantry: pantry
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
                customFoods,
              })
            )
              setDirty(false);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Deine Einstellungen</h2>
        <p className="muted">
          Du änderst hier ausschließlich dein Ziel. Das Kalorienziel ist im
          gemeinsamen Plan sichtbar; Gewicht und Vorratsangaben bleiben deinem
          Platz zugeordnet.
        </p>
        <label>
          Kalorien pro Tag
          <input
            type="number"
            min="500"
            max="10000"
            required
            value={kcal}
            placeholder="Dein gewünschtes Tagesziel"
            onChange={edit(setKcal)}
          />
        </label>
        <label>
          Gewicht in kg · optional
          <input
            type="number"
            min="20"
            max="500"
            step="0.1"
            value={weight}
            onChange={edit(setWeight)}
          />
        </label>
        <label>
          Im Vorrat · durch Kommas getrennt
          <textarea rows="3" value={pantry} onChange={edit(setPantry)} />
        </label>
        <button className="primary" disabled={!me || busy}>
          <Check size={18} />
          Mein Ziel speichern
        </button>
      </form>
      <section className="section">
        <h2>Eigene Lebensmittel</h2>
        <p className="muted">
          Nährwerte je 100 g laut Verpackung. Speichere anschließend deine
          Einstellungen.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCustomFoods((f) => [
              ...f,
              {
                ...food,
                id: "user-" + crypto.randomUUID(),
                kcal: Number(food.kcal),
                p: Number(food.p),
                c: Number(food.c),
                f: Number(food.f),
                defaultGrams: Number(food.defaultGrams),
              },
            ]);
            setDirty(true);
            setFood({
              name: "",
              kcal: "",
              p: "",
              c: "",
              f: "",
              defaultGrams: 100,
            });
          }}
        >
          <label>
            Name
            <input
              required
              maxLength="80"
              value={food.name}
              onChange={(e) => setFood({ ...food, name: e.target.value })}
            />
          </label>
          <div className="two-columns">
            {[
              ["kcal", "Kalorien"],
              ["p", "Eiweiß (g)"],
              ["c", "Kohlenhydrate (g)"],
              ["f", "Fett (g)"],
              ["defaultGrams", "Standardportion (g)"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  type="number"
                  min="0"
                  max="10000"
                  step="0.1"
                  value={food[key]}
                  onChange={(e) => setFood({ ...food, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <button className="secondary">Lebensmittel ergänzen</button>
        </form>
        <ul className="amount-list">
          {customFoods.map((f) => (
            <li key={f.id}>
              <span>{f.name}</span>
              <button
                className="icon-button"
                aria-label={f.name + " entfernen"}
                onClick={() => {
                  setCustomFoods((fs) => fs.filter((i) => i.id !== f.id));
                  setDirty(true);
                }}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
function AIAssistant({ foods, exclusions, pantry, onRecipe }) {
  const [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  async function generate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(
        "https://meal-scale-proxy.sanktannagymnasium.workers.dev",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Erstelle ein kochbares Rezept für EINE Portion: ${prompt}. Verwende ausschließlich Lebensmittel-IDs aus dieser Liste: ${JSON.stringify(foods.map((f) => ({ id: String(f.id), name: f.name })))}. Vermeide diese Zutaten samt Bestandteilen: ${exclusions.join(", ")}. Vorrat bevorzugen: ${pantry.join(", ")}. Gib realistische Gramm-Mengen und genaue Kochschritte an. Zubereitung je Zutat: roh oder gegart. Keine weiteren, nicht aufgelisteten Zutaten.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  ingredients: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        id: { type: "STRING" },
                        grams: { type: "NUMBER" },
                        prep: { type: "STRING" },
                      },
                      required: ["id", "grams", "prep"],
                    },
                  },
                  instructions: { type: "ARRAY", items: { type: "STRING" } },
                },
                required: ["name", "ingredients", "instructions"],
              },
            },
          }),
        },
      );
      if (!response.ok)
        throw new Error(
          "Der Rezept-Assistent ist gerade nicht erreichbar. Die vorhandenen Rezepte funktionieren weiterhin.",
        );
      const data = await response.json();
      const recipe = JSON.parse(
        data.candidates?.[0]?.content?.parts?.[0]?.text || "null",
      );
      if (
        !recipe?.name ||
        !Array.isArray(recipe.ingredients) ||
        !recipe.ingredients.length ||
        !Array.isArray(recipe.instructions) ||
        recipe.ingredients.length > 40
      )
        throw new Error(
          "Der Vorschlag war unvollständig. Bitte erneut versuchen.",
        );
      const ingredients = recipe.ingredients.map((i) => {
        const food = foods.find((f) => String(f.id) === String(i.id));
        if (
          !food ||
          !Number.isFinite(i.grams) ||
          i.grams <= 0 ||
          i.grams > 5000 ||
          !["roh", "gegart"].includes(i.prep)
        )
          throw new Error(
            "Der Vorschlag enthält unklare Zutaten oder Mengen. Bitte erneut versuchen.",
          );
        return { ...food, grams: i.grams, prep: i.prep };
      });
      const hits = ingredientHits(ingredients, exclusions);
      if (hits.length)
        throw new Error(
          "Der Vorschlag wurde wegen eurer Ausschlussliste verworfen: " +
            hits.join(", "),
        );
      setResult({ ...recipe, ingredients });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <h2>Eine neue Idee?</h2>
      <p className="muted">
        Der bisherige KI-Rezept-Assistent bleibt dabei. Vorschläge werden gegen
        eure Ausschlussliste geprüft. Deine Anfrage und die Ausschlussliste
        werden dafür an den bestehenden Rezept-Dienst gesendet.
      </p>
      <form onSubmit={generate}>
        <label>
          Worauf hast du Lust?
          <input
            required
            minLength="3"
            maxLength="200"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Zum Beispiel ein schnelles Linsengericht"
          />
        </label>
        <button className="secondary" disabled={busy}>
          {busy ? "Rezept wird gesucht …" : "Rezept vorschlagen"}
        </button>
      </form>
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="ai-result">
          <h3>{result.name}</h3>
          <Nutrition totals={sumNutrients(result.ingredients)} />
          <ul className="amount-list">
            {result.ingredients.map((i, n) => (
              <li key={n}>
                <span>
                  {i.name} · {i.prep}
                </span>
                <strong>{round(i.grams)} g</strong>
              </li>
            ))}
          </ul>
          <ol>
            {result.instructions.map((s, n) => (
              <li key={n}>{s}</li>
            ))}
          </ol>
          <button className="primary" onClick={() => onRecipe(result)}>
            Für mich heute einplanen
          </button>
        </div>
      )}
    </section>
  );
}
