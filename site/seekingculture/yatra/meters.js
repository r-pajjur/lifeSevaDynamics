/*
  meters.js — the four meters.
  To remove meters from the game entirely, set METERS_ENABLED to false.
  Nothing else needs to change: effects are ignored, recovery stops never trigger,
  and the meter bar is hidden.
*/

window.METERS_ENABLED = true;

window.METERS = {
  list: [
    { id: "food", name: "Food", kind: "Body", start: 100 },
    { id: "health", name: "Health", kind: "Body", start: 100 },
    { id: "calm", name: "Calm", kind: "Mind", start: 80 },
    { id: "faith", name: "Faith", kind: "Mind", start: 80 },
  ],
  max: 100,
  foodPerDay: 4, // every day on the road uses this much food

  initial() {
    const m = {};
    this.list.forEach((x) => (m[x.id] = x.start));
    return m;
  },

  // Returns { meters, deltas } after applying an option's effects and daily food use.
  apply(meters, effects, days) {
    const next = { ...meters };
    const deltas = {};
    if (!window.METERS_ENABLED) return { meters: next, deltas };
    const change = { ...(effects || {}) };
    change.food = (change.food || 0) - this.foodPerDay * (days || 0);
    for (const id of Object.keys(change)) {
      if (!(id in next) || !change[id]) continue;
      const before = next[id];
      next[id] = Math.max(0, Math.min(this.max, before + change[id]));
      if (next[id] !== before) deltas[id] = next[id] - before;
    }
    return { meters: next, deltas };
  },

  // The meter that has hit zero (lowest first), or null.
  empty(meters) {
    if (!window.METERS_ENABLED) return null;
    const hit = this.list.filter((x) => meters[x.id] <= 0);
    return hit.length ? hit[0].id : null;
  },

  average(meters) {
    if (!window.METERS_ENABLED) return 100;
    return this.list.reduce((s, x) => s + meters[x.id], 0) / this.list.length;
  },
};
