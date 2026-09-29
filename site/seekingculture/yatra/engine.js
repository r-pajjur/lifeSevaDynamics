/*
  engine.js — game rules. Pure functions: a state and a choice go in, a new state comes out.
  It never touches the page or the network, so every client computes the same result.
*/

(function () {
  const MAX_DECISIONS = 14; // no route asks for more decisions than this

  const S = () => window.STORY;
  const M = () => window.METERS;
  const scene = (id) => S().scenes[id];

  const clone = (x) => JSON.parse(JSON.stringify(x));

  // Fewest decisions from a scene to the temple (counting that scene; story pages count 0).
  const memo = {};
  function remaining(id) {
    if (!id || id === "end") return 0;
    if (id in memo) return memo[id];
    memo[id] = Infinity; // guard against loops
    const sc = scene(id);
    let best;
    if (sc.kind === "story") best = remaining(sc.next);
    else if (sc.kind === "pack") best = 1 + remaining(sc.next);
    else best = 1 + Math.min(...sc.options.map((o) => remaining(o.next || "end")));
    memo[id] = best;
    return best;
  }

  function newGame() {
    return {
      scene: S().start,
      phase: "choose", // "choose" | "result" | "story" | "done"
      step: 0, // decisions made so far
      day: 0,
      items: [], // items still in the bundle
      used: [], // items already used up
      meters: M().initial(),
      flags: {},
      log: [],
      pending: null, // the scene that follows the current result
      returnTo: null, // where a recovery stop goes back to
      endStage: 0, // 0 score, 1 reveal, 2 review and discussion
    };
  }

  // Options for the current scene, with lock state. Hidden options are left out.
  function options(state) {
    const sc = scene(state.scene);
    if (!sc || !sc.options) return [];
    const items = state.items || [];
    const used = state.used || [];
    return sc.options
      .map((o, index) => ({ ...o, index }))
      .filter((o) => !o.hideUnlessFlag || (state.flags || {})[o.hideUnlessFlag])
      .map((o) => {
        let locked = false,
          reason = "";
        if (o.needs && !items.includes(o.needs)) {
          locked = true;
          reason = used.includes(o.needs) ? S().items[o.needs].name + " already used" : "No " + S().items[o.needs].name.toLowerCase() + " packed";
        }
        return { ...o, locked, reason };
      });
  }

  function choose(prev, choice, playerName) {
    const state = clone(prev);
    if (state.phase !== "choose") return prev;
    state.items = state.items || [];
    state.used = state.used || [];
    state.flags = state.flags || {};
    const sc = scene(state.scene);
    let entry;

    if (sc.kind === "pack") {
      const picked = Array.isArray(choice) ? choice.filter((id) => S().items[id]) : [];
      if (picked.length !== S().packCount || new Set(picked).size !== picked.length) return prev;
      state.items = picked;
      state.pending = sc.next;
      entry = {
        scene: state.scene,
        title: sc.title,
        choice: "Packed " + picked.map((id) => S().items[id].name.toLowerCase()).join(", "),
        result: sc.result,
        grace: sc.grace,
        deltas: {},
        optimal: sc.optimalItems.every((id) => picked.includes(id)),
      };
    } else {
      const opt = options(state).find((o) => o.index === choice);
      if (!opt || opt.locked) return prev;
      const { meters, deltas } = M().apply(state.meters, opt.effects, opt.days);
      state.meters = meters;
      state.day += opt.days || 0;
      if (opt.setFlag) state.flags[opt.setFlag] = true;
      if (opt.needs) {
        state.items = state.items.filter((i) => i !== opt.needs);
        state.used.push(opt.needs);
      }

      let next = opt.next || state.returnTo || "end";
      // Skip a detour if taking it would push the route past the limit.
      const nsc = scene(next);
      if (nsc && nsc.kind === "detour" && state.step + 1 + remaining(next) > MAX_DECISIONS) next = nsc.after;
      if (sc.kind === "recovery") state.returnTo = null;
      state.pending = next;
      entry = {
        scene: state.scene,
        title: sc.title,
        choice: opt.label,
        result: opt.result,
        grace: opt.grace,
        deltas,
        optimal: !!opt.optimal,
      };
    }

    entry.player = playerName || "";
    entry.day = state.day;
    state.log.push(entry);
    state.step += 1;
    state.phase = "result";
    return state;
  }

  function goTo(state, id) {
    if (!id || id === "end") {
      state.scene = "end";
      state.phase = "done";
    } else {
      state.scene = id;
      state.phase = scene(id).kind === "story" ? "story" : "choose";
    }
  }

  // Move on from a result to the next scene (or a recovery stop, or the temple).
  function advance(prev) {
    const state = clone(prev);
    if (state.phase !== "result") return prev;
    const next = state.pending;
    const empty = M().empty(state.meters);
    if (empty && next !== "end" && state.step + 1 + remaining(next) <= MAX_DECISIONS) {
      state.returnTo = next;
      state.scene = "recover_" + empty;
      state.phase = "choose";
    } else {
      goTo(state, next);
    }
    state.pending = null;
    return state;
  }

  // Leave a story page (no decision).
  function continueStory(prev) {
    const state = clone(prev);
    if (state.phase !== "story") return prev;
    goTo(state, scene(state.scene).next);
    return state;
  }

  function score(state) {
    const b = S().benchmark || { days: 1, avg: 100 };
    const dayPart = 70 * Math.min(1, b.days / Math.max(1, state.day));
    const meterPart = 30 * Math.min(1, M().average(state.meters) / Math.max(1, b.avg));
    return Math.max(1, Math.min(100, Math.round(dayPart + meterPart)));
  }

  function turnIndex(state, playerCount) {
    return playerCount ? state.step % playerCount : 0;
  }

  // The same shuffled option order for every player, fixed per scene.
  function shuffled(sceneId, opts) {
    const h = (s) => {
      let x = 2166136261;
      for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
      return x >>> 0;
    };
    return opts.slice().sort((a, b) => h(sceneId + a.label) - h(sceneId + b.label));
  }

  window.ENGINE = { MAX_DECISIONS, newGame, options, choose, advance, continueStory, score, turnIndex, shuffled, remaining };
})();
