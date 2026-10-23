import { createClient } from "./vendor/supabase.js";
import { projectSnapshot, secretToken } from "./sync-core.js";

const STORE = "tm_cloud_v1";
export class CloudSync {
  constructor(config, callbacks) {
    this.callbacks = callbacks;
    this.configured = Boolean(config.url && config.key);
    this.client = this.configured ? createClient(config.url, config.key) : null;
    this.state = this.read();
    this.photoUrls = new Map();
    this.status = this.configured
      ? "Bereit zum Verbinden"
      : "Online-Abgleich wird eingerichtet";
    this.error = "";
    this.busy = false;
    this.connected = false;
    this.refreshing = null;
    this.active = false;
  }
  read() {
    try {
      return (
        JSON.parse(localStorage.getItem(STORE)) || { queue: [], imported: [] }
      );
    } catch {
      return { queue: [], imported: [] };
    }
  }
  persist() {
    localStorage.setItem(STORE, JSON.stringify(this.state));
  }
  notify() {
    const snapshot =
      this.connected && projectSnapshot(this.state.snapshot, this.state.queue);
    if (snapshot) this.callbacks.snapshot(snapshot, this.photoUrls);
    this.callbacks.changed();
  }
  get view() {
    return projectSnapshot(this.state.snapshot, this.state.queue);
  }
  async rpc(name, args = {}) {
    const { data, error } = await this.client.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
  async authenticate() {
    if (!this.client)
      throw new Error("Der Online-Abgleich ist noch nicht eingerichtet.");
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session.user.id;
    const result = await this.client.auth.signInAnonymously();
    if (result.error)
      throw new Error(
        "Die Geräte-Anmeldung ist gerade nicht möglich. Bitte erneut versuchen.",
      );
    return result.data.user.id;
  }
  async start() {
    if (!this.client) {
      this.notify();
      return;
    }
    const { data } = await this.client.auth.getSession();
    if (data.session) {
      this.active = true;
      if (this.state.user === data.session.user.id && this.state.snapshot) {
        this.connected = true;
        this.notify();
      }
      await this.retry();
    }
    window.addEventListener("online", () => this.retry());
    window.addEventListener("offline", () => {
      this.status = "Offline – Änderungen vorgemerkt";
      this.notify();
    });
    window.addEventListener("storage", (event) => {
      if (event.key === STORE) {
        this.state = this.read();
        this.notify();
      }
    });
    this.timer = setInterval(() => {
      if (this.active && document.visibilityState === "visible") this.retry();
    }, 15000);
    document.addEventListener("visibilitychange", () => {
      if (this.active && document.visibilityState === "visible") this.retry();
    });
    this.notify();
  }
  async create(slot, legacy) {
    this.state.user = await this.authenticate();
    this.state.recovery ||= secretToken();
    this.persist();
    await this.rpc("tm_create", {
      p_slot: slot,
      p_names: legacy.names,
      p_exclusions: legacy.excl,
      p_recovery: this.state.recovery,
    });
    await this.finishConnection(legacy);
  }
  async join(token, legacy) {
    this.state.user = await this.authenticate();
    this.state.recovery ||= secretToken();
    this.persist();
    await this.rpc("tm_join", {
      p_token: token,
      p_recovery: this.state.recovery,
    });
    history.replaceState(null, "", location.pathname + location.search);
    await this.finishConnection(legacy);
  }
  async restore(code) {
    const token = code
      .trim()
      .replace(/^TM-R-/i, "")
      .toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new Error(
        "Bitte den vollständigen Wiederherstellungscode eingeben.",
      );
    this.state.user = await this.authenticate();
    const recovery = secretToken();
    await this.rpc("tm_restore", { p_token: token, p_recovery: recovery });
    this.state.queue = [];
    this.state.snapshot = null;
    this.state.recovery = recovery;
    this.persist();
    await this.finishConnection(null);
  }
  async finishConnection(legacy) {
    this.active = true;
    await this.refresh();
    if (legacy) await this.importLegacy(legacy);
    await this.flush();
  }
  async invite() {
    const token = secretToken();
    await this.rpc("tm_invite", { p_token: token });
    this.state.invite = location.origin + "/#einladung=" + token;
    this.state.inviteExpires = Date.now() + 24 * 3600000;
    this.persist();
    this.notify();
    return this.state.invite;
  }
  async recovery() {
    const token = secretToken();
    await this.rpc("tm_recovery", { p_token: token });
    this.state.recovery = token;
    this.persist();
    this.notify();
    return "TM-R-" + token;
  }
  async importLegacy(legacy) {
    const member = this.view.me.id;
    if (this.state.imported.includes(member)) return;
    if (legacy.me === this.view.me.slot) {
      for (const d of legacy.custom.filter((d) => d.by === legacy.me)) {
        await this.enqueue(
          "dish",
          { dish: d },
          d.photo?.startsWith("local:") ? d.photo : null,
          false,
        );
      }
      for (const [dish, liked] of Object.entries(
        legacy.swipes[legacy.me] || {},
      )) {
        await this.enqueue("import_vote", { dish, liked }, null, false);
      }
    } else if (legacy.me) {
      this.callbacks.message(
        "Der bisher gewählte Name passt nicht zum freien Platz. Deine alten Daten bleiben lokal gesichert und wurden nicht der anderen Person zugeordnet.",
      );
    }
    this.state.imported.push(member);
    this.persist();
    this.notify();
  }
  async enqueue(kind, payload, photoLocal = null, flush = true) {
    if (!this.connected) throw new Error("Bitte zuerst eure Handys verbinden.");
    const add = () => {
      // Re-read immediately before appending so another tab's pending changes survive.
      this.state = this.read();
      const view = this.view;
      const task = {
        operation: crypto.randomUUID(),
        member: view.me.id,
        kind,
        epoch: view.me.epoch,
        payload,
        photoLocal,
      };
      if (kind === "settings") task.payload.revision = view.room.revision;
      this.state.queue.push(task);
      this.persist();
    };
    if (navigator.locks) await navigator.locks.request("tm-outbox", add);
    else add();
    this.status = navigator.onLine
      ? "Wird synchronisiert"
      : "Offline – Änderungen vorgemerkt";
    this.notify();
    if (flush) this.flush();
  }
  async refresh() {
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.pull().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }
  async pull() {
    const snapshot = await this.rpc("tm_snapshot");
    if (snapshot) snapshot.planning = await this.rpc("mp_snapshot");
    if (!snapshot) {
      if (this.state.snapshot) {
        this.connected = false;
        this.active = false;
        this.error =
          "Dieser Gerätezugriff ist nicht mehr gültig. Bitte mit deinem Wiederherstellungscode erneut verbinden.";
        this.status = "Gerät nicht verbunden";
        this.notify();
        throw new Error(this.error);
      }
      this.connected = false;
      this.status = "Bereit zum Verbinden";
      this.notify();
      return;
    }
    this.state = this.read();
    this.state.snapshot = snapshot;
    this.connected = true;
    this.persist();
    await this.hydratePhotos(snapshot);
    this.notify();
    if (this.roomChannel !== snapshot.room.id) this.subscribe(snapshot.room.id);
  }
  async hydratePhotos(snapshot) {
    const paths = snapshot.dishes.map((d) => d.photo_path).filter(Boolean);
    await Promise.all(
      paths.map(async (path) => {
        if ((this.photoUrls.get(path)?.expires || 0) > Date.now() + 60000)
          return;
        const { data, error } = await this.client.storage
          .from("tm-photos")
          .createSignedUrl(path, 300);
        if (!error)
          this.photoUrls.set(path, {
            url: data.signedUrl,
            expires: Date.now() + 300000,
          });
      }),
    );
  }
  subscribe(room) {
    if (this.channel) this.client.removeChannel(this.channel);
    this.roomChannel = room;
    this.channel = this.client.channel("tm-" + room);
    for (const table of [
      "tm_rooms",
      "tm_members",
      "tm_votes",
      "tm_dishes",
      "mp_records",
    ]) {
      this.channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `${table === "tm_rooms" ? "id" : "room_id"}=eq.${room}`,
        },
        () => this.retry(),
      );
    }
    this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") this.retry();
      else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        this.status = "Verbindung unterbrochen – erneuter Versuch";
        this.notify();
      }
    });
  }
  async flush() {
    if (this.busy || !this.connected) return;
    this.busy = true;
    const run = async () => {
      try {
        if (!navigator.onLine) throw new Error("Offline");
        this.state = this.read();
        if (this.state.queue.length) this.status = "Wird synchronisiert";
        this.error = "";
        this.notify();
        while (this.state.queue.length) {
          const task = this.state.queue[0];
          if (task.member !== this.state.snapshot.me.id)
            throw new Error(
              "Vorgemerkte Änderungen gehören zu einem anderen Gerät.",
            );
          const payload = structuredClone(task.payload);
          if (task.kind === "dish" && task.photoLocal) {
            const blob = await this.callbacks.photo(task.photoLocal);
            if (!blob)
              throw new Error(
                "Ein vorgemerktes Foto ist auf diesem Gerät nicht mehr verfügbar. Bitte den lokalen Fotospeicher nicht löschen.",
              );
            const path = `${this.state.snapshot.room.id}/${task.member}/${payload.dish.id}.jpg`;
            const { error } = await this.client.storage
              .from("tm-photos")
              .upload(path, blob, { contentType: "image/jpeg", upsert: true });
            if (error)
              throw new Error(
                "Foto konnte nicht übertragen werden. Bitte später erneut versuchen.",
              );
            payload.photo_path = path;
          }
          const result = task.kind.startsWith("plan:")
            ? await this.rpc("mp_apply", {
                p_operation: task.operation,
                p_kind: task.kind.slice(5),
                p_id: payload.id,
                p_expected: payload.expected,
                p_data: payload.data,
                p_deleted: !!payload.deleted,
              })
            : await this.rpc("tm_apply", {
                p_operation: task.operation,
                p_kind: task.kind,
                p_epoch: task.epoch,
                p_payload: payload,
              });
          if (result.stale)
            this.callbacks.message(
              "Eine veraltete Bewertung wurde nach dem Zurücksetzen verworfen.",
            );
          if (result.conflict)
            this.callbacks.message(
              "Diese Daten wurden inzwischen geändert. Die neuere Fassung bleibt erhalten. Bitte prüfe deine Änderung und versuche es erneut.",
            );
          const remove = () => {
            this.state = this.read();
            this.state.queue = this.state.queue.filter(
              (t) => t.operation !== task.operation && !(result.conflict && task.kind.startsWith("plan:") && t.kind === task.kind && t.payload.id === task.payload.id),
            );
            this.persist();
          };
          if (navigator.locks)
            await navigator.locks.request("tm-outbox", remove);
          else remove();
        }
        await this.refresh();
        this.status = "Verbunden";
      } catch (error) {
        this.status = navigator.onLine
          ? "Übertragung ausstehend – erneut versuchen"
          : "Offline – Änderungen vorgemerkt";
        this.error = navigator.onLine ? error.message : "";
      } finally {
        this.notify();
      }
    };
    try {
      if (navigator.locks) await navigator.locks.request("tm-transfer", run);
      else await run();
    } finally {
      this.busy = false;
    }
  }
  async retry() {
    if (!this.active) return;
    try {
      await this.refresh();
      await this.flush();
    } catch (error) {
      this.error = error.message;
      this.status = navigator.onLine
        ? "Verbindung unterbrochen – erneut versuchen"
        : "Offline – Änderungen vorgemerkt";
      this.notify();
    }
  }
}
