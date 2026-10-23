import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import {
  projectSnapshot,
  secretToken,
  invitationToken,
} from "../public/match/sync-core.js";
import { CloudSync } from "../public/match/sync.js";

test("offline projection respects resets, imports and member ownership", () => {
  const snapshot = {
    room: { revision: 0 },
    me: { id: "one", epoch: 0 },
    members: [],
    dishes: [],
    votes: [
      { member_id: "one", dish_id: "lasagne", liked: false },
      { member_id: "two", dish_id: "lasagne", liked: true },
    ],
  };
  const task = (kind, epoch, payload, member = "one") => ({
    kind,
    epoch,
    payload,
    member,
  });
  const v = projectSnapshot(snapshot, [
    task("import_vote", 0, { dish: "lasagne", liked: true }),
    task("reset", 0, {}),
    task("vote", 0, { dish: "old", liked: true }),
    task("vote", 1, { dish: "new", liked: true }),
    task("vote", 1, { dish: "foreign", liked: true }, "two"),
  ]);
  assert.equal(v.me.epoch, 1);
  assert.deepEqual(
    v.votes.map((v) => v.dish_id),
    ["lasagne", "new"],
  );
  assert.equal(snapshot.me.epoch, 0);
  assert.equal(secretToken().length, 64);
  assert.equal(invitationToken("#einladung=" + "a".repeat(64)), "a".repeat(64));
  assert.equal(invitationToken("#einladung=short"), null);
});

test("pending offline changes survive reload and are transferred on reconnection", async () => {
  const nav = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const memory = new Map();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: false },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, v),
    },
  });
  const callbacks = {
    snapshot: () => {},
    changed: () => {},
    message: () => {},
    photo: () => null,
  };
  const snapshot = {
    room: { id: "room", revision: 0 },
    me: { id: "member", slot: "a", epoch: 0 },
    members: [],
    votes: [],
    dishes: [],
  };
  try {
    const before = new CloudSync({}, callbacks);
    before.connected = true;
    before.state.snapshot = snapshot;
    before.persist();
    await before.enqueue("vote", { dish: "lasagne", liked: false });
    await new Promise(setImmediate);
    assert.match(before.status, /Offline/);
    assert.equal(before.state.queue.length, 1);
    const after = new CloudSync({}, callbacks);
    after.connected = true;
    after.roomChannel = "room";
    const sent = [];
    after.client = {
      rpc: async (name, args) => {
        if (name === "tm_apply") {
          sent.push(args);
          return { data: {}, error: null };
        }
        return {
          data: {
            ...snapshot,
            votes: [{ member_id: "member", dish_id: "lasagne", liked: false }],
          },
          error: null,
        };
      },
    };
    navigator.onLine = true;
    await after.flush();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].p_payload.liked, false);
    assert.equal(after.state.queue.length, 0);
    assert.equal(after.status, "Verbunden");
  } finally {
    if (nav) Object.defineProperty(globalThis, "navigator", nav);
    else delete globalThis.navigator;
    if (storage) Object.defineProperty(globalThis, "localStorage", storage);
    else delete globalThis.localStorage;
  }
});

test("database enforces private membership, one-use pairing, reset epochs and recovery", async () => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
    create function storage.extension(text) returns text language sql immutable as $$select substring($1 from '\\.([^.]+)$')$$;
    create publication supabase_realtime;`);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/202610220001_sync.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610230001_meal_planning.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const users = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ];
  for (const u of users)
    await db.query("insert into auth.users values($1)", [u]);
  const as = async (user) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      user,
    ]);
    await db.exec("set role authenticated");
  };
  const rpc = async (name, args = []) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) result`,
        args,
      )
    ).rows[0].result;
  const apply = (kind, epoch, payload = {}, operation = randomUUID()) =>
    rpc("tm_apply", [operation, kind, epoch, JSON.stringify(payload)]);
  await as(users[0]);
  const room = await rpc("tm_create", [
    "a",
    JSON.stringify({ a: "Daniel", b: "Stina" }),
    '["Zucchini"]',
    "1".repeat(64),
  ]);
  await rpc("tm_invite", ["2".repeat(64)]);
  await as(users[2]);
  assert.equal(await rpc("tm_snapshot"), null);
  assert.equal(
    (await db.query("select * from public.tm_rooms")).rows.length,
    0,
  );
  await assert.rejects(
    db.query(
      "insert into public.tm_votes(room_id,member_id,dish_id,liked) values($1,$2,$3,true)",
      [room, randomUUID(), "lasagne"],
    ),
    /permission denied/,
  );
  await assert.rejects(
    rpc("tm_join", ["f".repeat(64), "3".repeat(64)]),
    /ungültig/,
  );
  await as(users[1]);
  await rpc("tm_join", ["2".repeat(64), "3".repeat(64)]);
  await as(users[2]);
  await assert.rejects(
    rpc("tm_join", ["2".repeat(64), "4".repeat(64)]),
    /ungültig|belegt/,
  );
  await as(users[0]);
  let snapshot = await rpc("tm_snapshot");
  const member = snapshot.me.id;
  await apply("vote", 0, { dish: "lasagne", liked: true });
  await as(users[1]);
  snapshot = await rpc("tm_snapshot");
  assert.equal(snapshot.votes[0].liked, true);
  await apply("vote", 0, { dish: "lasagne", liked: false, member_id: member });
  snapshot = await rpc("tm_snapshot");
  assert.equal(snapshot.votes.length, 2);
  assert.equal(snapshot.votes.find((v) => v.member_id === member).liked, true);
  await as(users[0]);
  await apply("import_vote", 0, { dish: "lasagne", liked: false });
  snapshot = await rpc("tm_snapshot");
  assert.equal(snapshot.votes.find((v) => v.member_id === member).liked, true);
  const resetId = randomUUID();
  assert.equal((await apply("reset", 0, {}, resetId)).epoch, 1);
  assert.equal((await apply("reset", 0, {}, resetId)).epoch, 1);
  assert.equal(
    (await apply("vote", 0, { dish: "stale", liked: true })).stale,
    true,
  );
  await apply("vote", 1, { dish: "fresh", liked: true });
  await apply("vote", 1, { dish: "fresh", liked: null });
  snapshot = await rpc("tm_snapshot");
  assert.equal(
    snapshot.votes.find((v) => v.member_id === member && v.dish_id === "fresh")
      .liked,
    null,
  );
  assert.equal(snapshot.votes.find((v) => v.member_id !== member).liked, false);
  await apply("settings", 1, { revision: 0, exclusions: ["Soja"] });
  assert.equal(
    (await apply("settings", 1, { revision: 0, exclusions: [] })).conflict,
    true,
  );
  await db.query(
    "insert into storage.objects(bucket_id,name) values('tm-photos',$1)",
    [`${room}/${member}/ctest.jpg`],
  );
  await as(users[1]);
  assert.equal(
    (await db.query("select * from storage.objects")).rows.length,
    1,
  );
  await assert.rejects(
    db.query(
      "insert into storage.objects(bucket_id,name) values('tm-photos',$1)",
      [`${room}/${member}/ctest2.jpg`],
    ),
    /row-level security/,
  );
  await as(users[2]);
  assert.equal(
    (await db.query("select * from storage.objects")).rows.length,
    0,
  );
  await rpc("tm_restore", ["1".repeat(64), "4".repeat(64)]);
  assert.equal((await rpc("tm_snapshot")).me.id, member);
  await as(users[0]);
  assert.equal(await rpc("tm_snapshot"), null);
  await assert.rejects(
    apply("vote", 1, { dish: "fresh", liked: true }),
    /gültig/,
  );
  assert.equal(
    (await db.query("select * from storage.objects")).rows.length,
    0,
  );
  await as(users[3]);
  await rpc("tm_create", [
    "b",
    JSON.stringify({ a: "A", b: "B" }),
    "[]",
    "5".repeat(64),
  ]);
  await rpc("tm_invite", ["6".repeat(64)]);
  await db.exec("reset role");
  await db.exec(
    "update tm_private.tokens set expires_at=now()-interval '1 minute' where kind='invite'",
  );
  await as(users[4]);
  await assert.rejects(
    rpc("tm_join", ["6".repeat(64), "7".repeat(64)]),
    /abgelaufen/,
  );
  await as(users[2]);
  const a = (await rpc("tm_snapshot")).me.id;
  const mp = (
    kind,
    id,
    expected,
    data,
    deleted = false,
    operation = randomUUID(),
  ) =>
    rpc("mp_apply", [
      operation,
      kind,
      id,
      expected,
      JSON.stringify(data),
      deleted,
    ]);
  await mp("goal", a, 0, { kcal: 2400 });
  await mp("profile", a, 0, { weight: 90, pantry: ["Reis"] });
  await as(users[1]);
  const b = (await rpc("tm_snapshot")).me.id;
  let plan = await rpc("mp_snapshot");
  assert.equal(plan.filter((r) => r.kind === "profile").length, 0);
  assert.equal(plan.find((r) => r.kind === "goal").data.kcal, 2400);
  await assert.rejects(mp("goal", a, 1, { kcal: 1200 }), /eigene/);
  await assert.rejects(mp("profile", a, 1, { weight: 50 }), /eigene/);
  await mp("goal", b, 0, { kcal: 1800 });
  const meal = {
    name: "Pasta",
    day: "Montag",
    ingredients: [{ name: "Pasta", grams: 100, kcal: 360 }],
    portions: { a: 1.2, b: 0.8 },
  };
  const operation = randomUUID();
  await mp("meal", "dinner", 0, meal, false, operation);
  await mp("meal", "dinner", 0, meal, false, operation);
  await as(users[2]);
  plan = await rpc("mp_snapshot");
  assert.equal(plan.filter((r) => r.kind === "goal").length, 2);
  assert.equal(plan.filter((r) => r.kind === "meal").length, 1);
  assert.equal(plan.find((r) => r.kind === "profile").data.weight, 90);
  await mp("meal", "dinner", 1, meal, true);
  assert.equal((await mp("meal", "dinner", 1, meal)).conflict, true);
  assert.equal(
    (await rpc("mp_snapshot")).find((r) => r.id === "dinner").deleted,
    true,
  );
  assert.equal((await mp("meal", "dinner", 2, meal)).conflict, true);
  await assert.rejects(
    mp("meal", "invalid", 0, { name: "Invalid", ingredients: [] }),
    /Ungültige/,
  );
  await assert.rejects(
    db.query("update public.mp_records set data='{}'"),
    /permission denied/,
  );
  await as(users[4]);
  assert.equal((await rpc("mp_snapshot")).length, 0);
  await assert.rejects(mp("meal", "outsider", 0, meal), /gültig/);
  await db.close();
});
