export function projectSnapshot(snapshot, queue) {
  if (!snapshot) return null;
  const view = structuredClone(snapshot);
  for (const task of queue) {
    if (task.member !== view.me.id) continue;
    const p = task.payload;
    if (
      ["vote", "import_vote", "reset"].includes(task.kind) &&
      task.epoch !== view.me.epoch
    )
      continue;
    if (task.kind === "reset") {
      view.votes = view.votes.filter((v) => v.member_id !== view.me.id);
      view.me.epoch++;
    } else if (task.kind === "vote" || task.kind === "import_vote") {
      const index = view.votes.findIndex(
        (v) => v.member_id === view.me.id && v.dish_id === p.dish,
      );
      if (task.kind === "import_vote" && index >= 0) continue;
      const vote = { member_id: view.me.id, dish_id: p.dish, liked: p.liked };
      if (index < 0) view.votes.push(vote);
      else view.votes[index] = vote;
    } else if (task.kind === "settings") {
      if (p.revision < view.room.revision) continue;
      if (p.names) view.room.names = p.names;
      if (p.exclusions) view.room.exclusions = p.exclusions;
      view.room.revision++;
    } else if (task.kind.startsWith("plan:")) {
      view.planning ||= [];
      const kind = task.kind.slice(5);
      const index = view.planning.findIndex(
        (r) => r.kind === kind && r.id === p.id,
      );
      const old = index < 0 ? null : view.planning[index];
      if ((old?.revision || 0) !== p.expected || old?.deleted) continue;
      const row = {
        room_id: view.room.id,
        kind,
        id: p.id,
        owner_id: view.me.id,
        data: p.data,
        revision: p.expected + 1,
        deleted: !!p.deleted,
      };
      if (index < 0) view.planning.push(row);
      else view.planning[index] = row;
    } else if (
      task.kind === "dish" &&
      !view.dishes.some((d) => d.id === p.dish.id)
    ) {
      view.dishes.push({
        id: p.dish.id,
        member_id: view.me.id,
        data: p.dish,
        photo_local: task.photoLocal,
      });
    }
  }
  return view;
}

export function secretToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function invitationToken(hash) {
  const token = new URLSearchParams(hash.replace(/^#/, "")).get("einladung");
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
