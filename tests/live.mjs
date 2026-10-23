// Explicit opt-in: creates a separate, private test pair in the configured Supabase project.
import { createClient } from "@supabase/supabase-js";
import { syncConfig } from "../public/match/sync-config.js";
import { secretToken } from "../public/match/sync-core.js";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

if (process.env.TM_RUN_LIVE !== "1")
  throw new Error("Set TM_RUN_LIVE=1 to create isolated test data.");
const clients = Array.from({ length: 3 }, () =>
  createClient(syncConfig.url, syncConfig.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const [a, b, outsider] = clients;
const rpc = async (c, name, args = {}) => {
  const { data, error } = await c.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
};
const apply = (c, kind, epoch, payload, operation = randomUUID()) =>
  rpc(c, "tm_apply", {
    p_operation: operation,
    p_kind: kind,
    p_epoch: epoch,
    p_payload: payload,
  });
try {
  for (const c of clients) {
    const { error } = await c.auth.signInAnonymously();
    if (error) throw error;
  }
  const recovery = secretToken();
  const room = await rpc(a, "tm_create", {
    p_slot: "a",
    p_names: { a: "Test Daniel", b: "Test Stina" },
    p_exclusions: ["Zucchini"],
    p_recovery: recovery,
  });
  assert.equal(await rpc(outsider, "tm_snapshot"), null);
  const token = secretToken();
  await rpc(a, "tm_invite", { p_token: token });
  await rpc(b, "tm_join", { p_token: token, p_recovery: secretToken() });
  await assert.rejects(
    rpc(outsider, "tm_join", { p_token: token, p_recovery: secretToken() }),
  );
  let snap = await rpc(a, "tm_snapshot");
  const member = snap.me.id;
  let resolveChange;
  const change = new Promise((resolve) => (resolveChange = resolve));
  const channel = b
    .channel("live-test-" + randomUUID())
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tm_votes",
        filter: "room_id=eq." + room,
      },
      (payload) => {
        if (payload.new?.dish_id === "lasagne") resolveChange();
      },
    );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Realtime subscription timed out")),
      15000,
    );
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (status === "CHANNEL_ERROR") {
        clearTimeout(timer);
        reject(new Error("Realtime channel error"));
      }
    });
  });
  await apply(a, "vote", 0, { dish: "lasagne", liked: true });
  await Promise.race([
    change,
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Realtime change timed out")),
        8000,
      );
      timer.unref();
    }),
  ]);
  assert.equal((await rpc(b, "tm_snapshot")).votes[0].liked, true);
  await apply(b, "vote", 0, { dish: "lasagne", liked: true });
  assert.equal(
    (await rpc(a, "tm_snapshot")).votes.filter((v) => v.liked).length,
    2,
  );
  const dish = {
    id: "ctest" + Date.now(),
    name: "Geteiltes Testgericht",
    desc: "Testgericht für den privaten Fotoabgleich.",
    cuisine: "Test",
    time: 30,
    veg: true,
    shape: "plate",
    base: "#C2502F",
    tops: ["#F7F1E3"],
    ing: ["kartoffeln"],
  };
  const path = `${room}/${member}/${dish.id}.jpg`;
  const photo = await readFile(
    new URL("../public/match/fotos/lasagne.jpg", import.meta.url),
  );
  const upload = await a.storage
    .from("tm-photos")
    .upload(path, photo, { contentType: "image/jpeg" });
  assert.equal(upload.error, null);
  await apply(a, "dish", 0, { dish, photo_path: path });
  snap = await rpc(b, "tm_snapshot");
  assert.equal(snap.dishes[0].photo_path, path);
  const signed = await b.storage.from("tm-photos").createSignedUrl(path, 300);
  assert.equal(signed.error, null);
  const response = await fetch(signed.data.signedUrl);
  assert.equal(response.status, 200);
  assert.equal((await response.arrayBuffer()).byteLength, photo.byteLength);
  assert(
    (await outsider.storage.from("tm-photos").createSignedUrl(path, 300)).error,
  );
  assert.equal((await outsider.from("tm_rooms").select("*")).data.length, 0);
  assert(
    (await b.from("tm_votes").update({ liked: false }).eq("member_id", member))
      .error,
  );
  const otherMember = (await rpc(b, "tm_snapshot")).me.id;
  const plan = (c, kind, id, expected, data, deleted = false) =>
    rpc(c, "mp_apply", {
      p_operation: randomUUID(),
      p_kind: kind,
      p_id: id,
      p_expected: expected,
      p_data: data,
      p_deleted: deleted,
    });
  await plan(a, "goal", member, 0, { kcal: 2400 });
  await plan(b, "goal", otherMember, 0, { kcal: 1800 });
  await plan(a, "profile", member, 0, { weight: 90 });
  assert.equal(
    (await rpc(b, "mp_snapshot")).filter((r) => r.kind === "goal").length,
    2,
  );
  assert.equal(
    (await rpc(b, "mp_snapshot")).some((r) => r.kind === "profile"),
    false,
  );
  await assert.rejects(plan(b, "goal", member, 1, { kcal: 1000 }));
  let resolvePlan;
  const changedPlan = new Promise((resolve) => (resolvePlan = resolve));
  const planningChannel = b
    .channel("planning-test-" + randomUUID())
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mp_records",
        filter: "room_id=eq." + room,
      },
      (p) => {
        if (p.new?.kind === "meal") resolvePlan();
      },
    );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Planning realtime timed out")),
      15000,
    );
    planningChannel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  const dinner = {
    name: "Test Lasagne",
    day: "Montag",
    ingredients: [{ name: "Pasta", grams: 100, kcal: 360 }],
    portions: { a: 1.2, b: 0.8 },
  };
  await plan(a, "meal", "dinner", 0, dinner);
  await Promise.race([
    changedPlan,
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Meal update timed out")),
        8000,
      );
      timer.unref();
    }),
  ]);
  assert.equal(
    (await rpc(b, "mp_snapshot")).find((r) => r.kind === "meal").data.portions
      .b,
    0.8,
  );
  await plan(b, "meal", "dinner", 1, dinner, true);
  assert.equal((await plan(a, "meal", "dinner", 1, dinner)).conflict, true);
  assert.equal(
    (await rpc(a, "mp_snapshot")).find((r) => r.kind === "meal").deleted,
    true,
  );
  assert.equal((await rpc(outsider, "mp_snapshot")).length, 0);
  const reset = randomUUID();
  await apply(a, "reset", 0, {}, reset);
  await apply(a, "reset", 0, {}, reset);
  assert.equal(
    (await apply(a, "vote", 0, { dish: "stale", liked: true })).stale,
    true,
  );
  snap = await rpc(a, "tm_snapshot");
  assert.equal(snap.me.epoch, 1);
  assert.equal(snap.votes.length, 1);
  await rpc(outsider, "tm_restore", {
    p_token: recovery,
    p_recovery: secretToken(),
  });
  assert.equal(await rpc(a, "tm_snapshot"), null);
  assert.equal((await rpc(outsider, "tm_snapshot")).me.id, member);
  assert((await a.storage.from("tm-photos").createSignedUrl(path, 300)).error);
  console.log(
    "PASS: personal calorie goals, profile isolation, shared meal realtime, stale deletion protection; live pairing, one-use invitation, realtime updates, shared private photo, access isolation, reset replay protection, recovery and old-device revocation.",
  );
} finally {
  await Promise.allSettled(
    clients.map(async (c) => {
      await c.removeAllChannels();
      await c.auth.signOut();
    }),
  );
}
