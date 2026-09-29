/*
  app.js — draws the screen from the shared room state and sends player actions.
*/

(function () {
  const S = window.STORY;
  const E = window.ENGINE;
  const M = window.METERS;
  const app = document.getElementById("app");

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- who am I (survives a refresh of this tab) ----------
  const store = {
    get() {
      try { return JSON.parse(sessionStorage.getItem("yatra-me")) || null; } catch (e) { return null; }
    },
    set(v) {
      try { sessionStorage.setItem("yatra-me", JSON.stringify(v)); } catch (e) {}
    },
    clear() {
      try { sessionStorage.removeItem("yatra-me"); } catch (e) {}
    },
  };
  const newId = () => Math.random().toString(36).slice(2, 10);

  let me = store.get(); // { pid, name, code }
  let room = null;
  let unwatch = null;
  let goOffline = null;
  const ui = { error: "", packPick: [], override: false, busy: false, nameDraft: "", codeDraft: "" };

  // ---------- helpers on the room ----------
  const players = () => (room ? room.players : {});
  const nameOf = (pid) => (players()[pid] ? players()[pid].name : "Someone");
  const isHost = () => room && me && room.hostId === me.pid;
  const order = () => (room && room.order.length ? room.order : room ? [room.hostId] : []);
  const turnPid = () => {
    const o = order();
    return o[E.turnIndex(room.game, o.length)];
  };
  const nextPid = () => {
    const o = order();
    return o[(room.game.step) % o.length];
  };
  const myTurn = () => room && me && turnPid() === me.pid;
  const canAct = () => myTurn() || (isHost() && ui.override);

  // ---------- rooms ----------
  const WORDS = ["ASHRAM", "LOTUS", "GANGA", "DEEPA", "TULSI", "NANDI", "VEENA", "KAMAL", "SURYA", "SHANTI"];
  async function createRoom() {
    const name = ui.nameDraft.trim();
    if (!name) return fail("Enter your name first.");
    ui.busy = true; render();
    try {
      let code;
      for (let i = 0; i < 10; i++) {
        code = WORDS[Math.floor(Math.random() * WORDS.length)] + "-" + (10 + Math.floor(Math.random() * 90));
        if (!(await SYNC.exists(code))) break;
      }
      const pid = newId();
      await SYNC.create(code, {
        createdAt: Date.now(),
        hostId: pid,
        status: "lobby",
        players: { [pid]: { name, joinedAt: Date.now() } },
        presence: { [pid]: true },
      });
      enter({ pid, name, code });
    } catch (e) {
      fail("Couldn't create a room. Check the internet connection and the Firebase setup, then try again.");
    }
  }

  async function joinRoom() {
    const name = ui.nameDraft.trim();
    const code = ui.codeDraft.trim().toUpperCase();
    if (!name) return fail("Enter your name first.");
    if (!code) return fail("Enter the room code your host shared.");
    ui.busy = true; render();
    try {
      if (!(await SYNC.exists(code))) return fail("There's no room called " + code + ". Check the code with your host.");
      const fresh = newId();
      let pid = fresh;
      await SYNC.update(code, (r) => {
        // Someone who closed their tab and joins again with the same name gets their old place back.
        const same = (p) => r.players[p].name.trim().toLowerCase() === name.toLowerCase();
        const back = Object.keys(r.players).find((p) => same(p) && !r.presence[p]);
        pid = back || fresh;
        if (!back) r.players[pid] = { name, joinedAt: Date.now() };
        return r;
      });
      enter({ pid, name, code });
    } catch (e) {
      fail("Couldn't join the room. Check the internet connection and try again.");
    }
  }

  function enter(who) {
    me = who;
    store.set(me);
    ui.error = ""; ui.busy = false;
    if (goOffline) goOffline();
    goOffline = SYNC.online(me.code, me.pid);
    if (unwatch) unwatch();
    unwatch = SYNC.watch(me.code, (r) => {
      room = r;
      if (!room) {
        leave("That room no longer exists.");
        return;
      }
      checkHost();
      render();
    });
  }

  function leave(msg) {
    if (unwatch) unwatch();
    if (goOffline) goOffline();
    unwatch = null; goOffline = null; room = null; me = null;
    store.clear();
    ui.error = msg || "";
    render();
  }

  function fail(msg) {
    ui.error = msg; ui.busy = false; render();
  }

  // Leaving from the lobby takes you off the list, so you don't get a turn. The next person to join becomes host.
  function leaveLobby() {
    const pid = me.pid;
    SYNC.update(me.code, (r) => {
      if (r.status === "playing" || !r.players[pid]) return undefined;
      delete r.players[pid];
      delete r.presence[pid];
      if (r.hostId === pid) {
        const rest = Object.keys(r.players).sort((a, b) => r.players[a].joinedAt - r.players[b].joinedAt);
        if (rest.length) r.hostId = rest[0];
      }
      return r;
    });
    leave();
  }

  // If the host has been offline for a while, the first online player takes over.
  let hostGoneSince = 0;
  function checkHost() {
    if (!room || SYNC.mode !== "firebase" || room.presence[room.hostId]) { hostGoneSince = 0; return; }
    if (!hostGoneSince) { hostGoneSince = Date.now(); setTimeout(checkHost, 9000); return; }
    if (Date.now() - hostGoneSince < 8000) return;
    const candidates = Object.keys(room.players)
      .filter((p) => room.presence[p])
      .sort((a, b) => room.players[a].joinedAt - room.players[b].joinedAt);
    if (candidates[0] === me.pid) {
      SYNC.update(me.code, (r) => (r.presence[r.hostId] ? undefined : ((r.hostId = me.pid), r)));
    }
  }

  // ---------- game actions (each is guarded so a double click can't count twice) ----------
  function startGame() {
    SYNC.update(me.code, (r) => {
      if (r.status === "playing") return undefined;
      r.order = Object.keys(r.players)
        .sort((a, b) => r.players[a].joinedAt - r.players[b].joinedAt)
        .slice(0, 8);
      r.game = E.newGame();
      r.status = "playing";
      return r;
    });
  }

  function choose(choice) {
    const step = room.game.step;
    ui.override = false;
    SYNC.update(me.code, (r) => {
      if (!r.game || r.game.step !== step || r.game.phase !== "choose") return undefined;
      const o = r.order.length ? r.order : [r.hostId];
      const who = o[E.turnIndex(r.game, o.length)];
      const next = E.choose(r.game, choice, r.players[who] ? r.players[who].name : "");
      if (next === r.game) return undefined;
      r.game = next;
      return r;
    });
    ui.packPick = [];
  }

  function advance() {
    const step = room.game.step;
    SYNC.update(me.code, (r) => {
      if (!r.game || r.game.step !== step || r.game.phase !== "result") return undefined;
      r.game = E.advance(r.game);
      return r;
    });
  }

  function continueStory() {
    const step = room.game.step;
    const at = room.game.scene;
    SYNC.update(me.code, (r) => {
      if (!r.game || r.game.step !== step || r.game.scene !== at || r.game.phase !== "story") return undefined;
      r.game = E.continueStory(r.game);
      return r;
    });
  }

  function setEndStage(n) {
    SYNC.update(me.code, (r) => {
      if (!r.game || r.game.endStage >= n) return undefined;
      r.game.endStage = n;
      return r;
    });
  }

  function playAgain() {
    SYNC.update(me.code, (r) => {
      r.game = E.newGame();
      return r;
    });
  }

  // ---------- rendering ----------
  function render() {
    if (!me || !room) return renderHome();
    if (room.status !== "playing") return renderLobby();
    if (room.game.phase === "done") return renderEnd();
    return renderGame();
  }

  // Draw every pixel-art canvas on the page.
  function paintArt() {
    if (!window.PIXEL) return;
    app.querySelectorAll("canvas[data-art]").forEach((cv) => PIXEL.draw(cv, cv.dataset.art));
  }

  // The pixel picture with its dark text panel underneath.
  function sceneBox(art, place, title, bodyHtml) {
    return `<section class="scene-box">
      <canvas data-art="${esc(art)}" width="192" height="108" role="img" aria-label="${esc(title)}"></canvas>
      <div class="panel">
        ${place ? `<span class="place">${esc(place)}</span>` : ""}
        <h2>${esc(title)}</h2>
        ${bodyHtml}
      </div>
    </section>`;
  }

  function verseBlock() {
    return `<div class="verse">
      <span class="dev" lang="sa">${esc(S.verse.devanagari)}</span>
      <span class="rom">${esc(S.verse.roman)}</span>
      <span class="small">${esc(S.verse.meaning)}</span>
    </div>`;
  }

  // The intro drawing: a winding path up to a hilltop temple, with a small group walking it.
  function introArt() {
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trail = "M40 262 C150 250 190 214 290 208 S450 196 500 160 S575 112 604 96";
    const walkers = [0, 0.7, 1.4, 2.1, 2.8]
      .map((d, i) => {
        const fill = i % 2 ? "#a8741f" : "#1f3d2c";
        return still
          ? `<circle r="4.5" fill="${fill}" cx="${60 + i * 12}" cy="${258 - i * 1.5}"/>`
          : `<circle r="4.5" fill="${fill}"><animateMotion dur="18s" repeatCount="indefinite" begin="-${d}s" path="${trail}"/></circle>`;
      })
      .join("");
    const tree = (x, y, s, c) =>
      `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2" y="0" width="4" height="12" fill="#5b4a2e"/><path d="M0 -26 L13 2 L-13 2 Z" fill="${c}"/><path d="M0 -36 L10 -12 L-10 -12 Z" fill="${c}"/></g>`;
    return `
      <svg class="intro-art" viewBox="0 0 720 280" role="img" aria-label="A winding path climbs through green hills to a temple on the highest hill, with a small group of pilgrims walking it.">
        <circle cx="150" cy="70" r="30" fill="#f1d9a0"/>
        <path d="M0 170 C120 120 230 150 330 120 S520 60 600 72 S700 110 720 100 L720 280 L0 280 Z" fill="#b9cfa8"/>
        <path d="M0 215 C140 175 260 205 380 180 S560 150 720 170 L720 280 L0 280 Z" fill="#8fb07e"/>
        <path d="M0 250 C180 230 320 250 460 236 S640 226 720 240 L720 280 L0 280 Z" fill="#5f8a54"/>
        <path d="${trail}" fill="none" stroke="#efe6cc" stroke-width="7" stroke-linecap="round"/>
        <g transform="translate(604 96)">
          <rect x="-26" y="-6" width="52" height="10" fill="#e8dcc0"/>
          <path d="M-20 -6 L20 -6 L15 -26 L-15 -26 Z" fill="#d9c49a"/>
          <path d="M-14 -26 L14 -26 L10 -42 L-10 -42 Z" fill="#cdb27f"/>
          <path d="M-9 -42 L9 -42 L6 -54 L-6 -54 Z" fill="#c09d62"/>
          <circle cx="0" cy="-58" r="4" fill="#a8741f"/>
          <line x1="0" y1="-62" x2="0" y2="-76" stroke="#5b4a2e" stroke-width="1.5"/>
          <path d="M0 -76 L14 -72 L0 -68 Z" fill="#c9552f">${still ? "" : `<animateTransform attributeName="transform" type="scale" values="1 1;0.8 1;1 1" dur="2.4s" repeatCount="indefinite"/>`}</path>
          <rect x="-4" y="-4" width="8" height="8" fill="#7a5a2c"/>
        </g>
        ${tree(90, 222, 1.1, "#2f6b3f")}${tree(118, 230, 0.9, "#3b7a48")}${tree(250, 196, 0.9, "#2f6b3f")}
        ${tree(410, 184, 1, "#245531")}${tree(438, 190, 0.8, "#3b7a48")}${tree(680, 150, 1, "#2f6b3f")}
        ${walkers}
      </svg>`;
  }

  function renderHome() {
    const local = SYNC.mode === "local" && !SYNC.problem;
    const off = ui.busy || SYNC.problem ? "disabled" : "";
    app.innerHTML = `
      <header class="stack">
        <span class="eyebrow">Seeking Culture · Upadesha Sara 1</span>
        <h1>${esc(S.title)}</h1>
        ${introArt()}
        <p class="muted">${esc(S.tagline)}</p>
      </header>
      ${SYNC.problem ? `<p class="error" role="alert">${esc(SYNC.problem)}</p>` : ""}
      ${local ? `<p class="notice"><b>Local test mode.</b> Firebase isn't set up yet, so rooms only work between tabs of this browser. Open a second tab to play as another person.</p>` : ""}
      <section class="card stack-lg">
        <div class="stack">
          <label for="name">Your name</label>
          <input id="name" type="text" maxlength="20" autocomplete="off" placeholder="e.g. Priya" value="${esc(ui.nameDraft)}">
        </div>
        <div class="two-col">
          <div class="stack">
            <h3>Start a room</h3>
            <p class="small muted">One person per breakout group does this and shares the code.</p>
            <div><button class="btn" id="create" ${off}>Create room</button></div>
          </div>
          <div class="stack">
            <h3>Join a room</h3>
            <input id="code" class="code-input" type="text" maxlength="12" autocomplete="off" placeholder="LOTUS-42" value="${esc(ui.codeDraft)}" aria-label="Room code">
            <div><button class="btn secondary" id="join" ${off}>Join room</button></div>
          </div>
        </div>
        ${ui.error ? `<p class="error" role="alert">${esc(ui.error)}</p>` : ""}
      </section>
      ${verseBlock()}
    `;
    const name = document.getElementById("name");
    const code = document.getElementById("code");
    name.oninput = () => (ui.nameDraft = name.value);
    code.oninput = () => (ui.codeDraft = code.value);
    code.onkeydown = (e) => {
      if (e.key === "Enter") joinRoom();
    };
    document.getElementById("create").onclick = createRoom;
    document.getElementById("join").onclick = joinRoom;
  }

  function renderLobby() {
    const list = Object.keys(room.players).sort((a, b) => room.players[a].joinedAt - room.players[b].joinedAt);
    app.innerHTML = `
      <header class="stack">
        <span class="eyebrow">Room code</span>
        <div class="room-code">${esc(me.code)}</div>
        <p class="muted">Share this code with your breakout group. Everyone joins on their own device, then the host starts the journey.</p>
      </header>
      <section class="card stack">
        <h3>Pilgrims (${list.length})</h3>
        <ul class="players">
          ${list
            .map(
              (p, i) => `<li><span class="num">${i + 1}</span><span>${esc(room.players[p].name)}${p === me.pid ? " (you)" : ""}</span>
              ${p === room.hostId ? `<span class="tag teal">Host</span>` : ""}${i >= 8 ? `<span class="tag">Watching</span>` : ""}
              <span class="dot ${room.presence[p] || SYNC.mode === "local" ? "" : "off"}" title="${room.presence[p] ? "Online" : "Offline"}"></span></li>`
            )
            .join("")}
        </ul>
        <p class="small muted">Turns go in this order. Up to 8 people play, and anyone after that watches.</p>
      </section>
      <div class="row">
        ${isHost() ? `<button class="btn" id="start">Start the journey</button>` : `<p class="muted">Waiting for ${esc(nameOf(room.hostId))} to start…</p>`}
        <button class="btn link" id="leave">Leave room</button>
      </div>
    `;
    if (isHost()) document.getElementById("start").onclick = startGame;
    document.getElementById("leave").onclick = leaveLobby;
  }

  function header() {
    const g = room.game;
    const meters = window.METERS_ENABLED
      ? `<div class="meters">${M.list
          .map((m) => {
            const v = g.meters[m.id];
            return `<div class="meter ${m.kind === "Body" ? "body" : ""} ${v <= 20 ? "low" : ""}">
              <div class="head"><b>${esc(m.name)}</b><span>${v}</span></div>
              <div class="track"><div class="fill" style="width:${v}%"></div></div></div>`;
          })
          .join("")}</div>`
      : "";
    const items = g.items || [];
    const used = g.used || [];
    const pack =
      items.length || used.length
        ? `<div class="pack">Carrying ${items.map((i) => `<span class="tag">${esc(S.items[i].name)}</span>`).join("")}${used
            .map((i) => `<span class="tag used" title="Already used">${esc(S.items[i].name)}</span>`)
            .join("")}</div>`
        : "";
    return `
      <div class="topbar">
        <strong>${esc(S.title)}</strong>
        <div class="facts"><span>Room ${esc(me.code)}</span><span>Day ${g.day + 1}</span><span>Decision ${Math.min(g.step + (g.phase === "choose" ? 1 : 0), E.MAX_DECISIONS)}</span></div>
      </div>
      ${meters}
      ${pack}
    `;
  }

  function turnBanner(pid, verb) {
    const mine = me.pid === pid;
    return `<div class="turn ${mine ? "mine" : ""}">
      <div>
        <div class="who">${mine ? "Your call, " + esc(nameOf(pid)) : esc(nameOf(pid)) + "’s call"}</div>
        <div class="how">${mine ? "Talk it over with the group, then " + verb + "." : "Talk it over together. Only " + esc(nameOf(pid)) + " can " + verb + "."}</div>
      </div>
    </div>`;
  }

  function overrideToggle(pid) {
    if (!isHost() || me.pid === pid) return "";
    return `<label class="override"><input type="checkbox" id="override" ${ui.override ? "checked" : ""}> Choose for ${esc(nameOf(pid))} (if they've dropped off)</label>`;
  }

  function renderGame() {
    const g = room.game;
    const sc = S.scenes[g.scene];
    const pid = turnPid();
    let body = "";

    if (g.phase === "story") {
      body = `
        ${sceneBox(sc.art, sc.place, sc.title, `<p>${esc(sc.text)}</p>`)}
        <div class="row"><button class="btn" id="storygo">Set off →</button><span class="small muted">Anyone can continue.</span></div>`;
    } else if (g.phase === "choose" && sc.kind === "pack") {
      const pick = ui.packPick;
      const can = canAct();
      body = `
        ${sceneBox(sc.art, sc.place, sc.title, `<p>${esc(sc.text)}</p>`)}
        ${turnBanner(pid, "choose")}
        <div class="items">
          ${Object.keys(S.items)
            .map((id) => {
              const on = pick.includes(id);
              const full = pick.length >= S.packCount && !on;
              return `<button class="item ${on ? "on" : ""}" data-item="${id}" ${!can || full ? "disabled" : ""} aria-pressed="${on}">
                <b>${esc(S.items[id].name)}</b><span>${esc(S.items[id].note)}</span></button>`;
            })
            .join("")}
        </div>
        <div class="row">
          <button class="btn" id="packgo" ${can && pick.length === S.packCount ? "" : "disabled"}>Pack these ${S.packCount}</button>
          <span class="small muted">${pick.length} of ${S.packCount} chosen · each can be used once</span>
        </div>
        ${overrideToggle(pid)}`;
    } else if (g.phase === "choose") {
      const can = canAct();
      body = `
        ${sceneBox(sc.art, sc.place, sc.title, `<p>${esc(sc.text)}</p>`)}
        ${turnBanner(pid, "choose")}
        <div class="choices">
          ${E.shuffled(g.scene, E.options(g))
            .map(
              (o, i) => `<button class="choice ${o.locked ? "locked" : ""}" data-opt="${o.index}" ${!can || o.locked ? "disabled" : ""}>
                <span class="badge">${i + 1}</span><span class="label">${esc(o.label)}</span>${o.locked ? `<span class="why">${esc(o.reason)}</span>` : ""}</button>`
            )
            .join("")}
        </div>
        ${overrideToggle(pid)}`;
    } else {
      // result
      const last = g.log[g.log.length - 1];
      const chooserPid = order()[(g.step - 1) % order().length];
      const canGo = me.pid === chooserPid || isHost();
      const nextUp = nameOf(nextPid());
      const deltas = Object.keys(last.deltas || {})
        .map((k) => {
          const v = last.deltas[k];
          const m = M.list.find((x) => x.id === k);
          return `<span class="delta ${v > 0 ? "up" : "down"}">${esc(m ? m.name : k)} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`;
        })
        .join("");
      body = `
        ${sceneBox(sc.art, (last.player || nameOf(chooserPid)) + " chose", sc.title, `<p class="chosen">${esc(last.choice)}</p><p>${esc(last.result)}</p>`)}
        ${window.METERS_ENABLED && deltas ? `<div class="deltas">${deltas}</div>` : ""}
        <div class="row">
          ${canGo ? `<button class="btn" id="go">Continue →</button>` : `<p class="muted">Waiting for ${esc(nameOf(chooserPid))} to continue…</p>`}
          <span class="small muted">Next up: ${esc(nextUp)}</span>
        </div>`;
    }

    app.innerHTML = `${header()}${body}`;
    paintArt();

    app.querySelectorAll("[data-item]").forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.item;
        ui.packPick = ui.packPick.includes(id) ? ui.packPick.filter((x) => x !== id) : ui.packPick.concat(id).slice(0, S.packCount);
        render();
      };
    });
    const packgo = document.getElementById("packgo");
    if (packgo) packgo.onclick = () => choose(ui.packPick.slice());
    app.querySelectorAll("[data-opt]").forEach((b) => (b.onclick = () => choose(Number(b.dataset.opt))));
    const go = document.getElementById("go");
    if (go) go.onclick = advance;
    const storygo = document.getElementById("storygo");
    if (storygo) storygo.onclick = continueStory;
    const ov = document.getElementById("override");
    if (ov) ov.onchange = () => { ui.override = ov.checked; render(); };
  }

  function renderEnd() {
    const g = room.game;
    const score = E.score(g);
    const arrival = g.flags && g.flags.trail ? S.arrival.trail : S.arrival.default;
    const stats = `
      <div class="stats">
        <div class="stat"><div class="k">Days</div><div class="v">${g.day}</div></div>
        <div class="stat"><div class="k">Decisions</div><div class="v">${g.step}</div></div>
        ${window.METERS_ENABLED ? M.list.map((m) => `<div class="stat"><div class="k">${esc(m.name)}</div><div class="v">${g.meters[m.id]}</div></div>`).join("") : ""}
      </div>`;

    let lower = "";
    if (g.endStage === 0) {
      lower = `
        <section class="card stack">
          <span class="eyebrow">${esc(S.reveal.before)}</span>
          <div class="score">${score}%</div>
          <p class="muted">Compared with the fastest, healthiest route.</p>
        </section>
        <div><button class="btn" id="reveal">Reveal Bhagavan’s view</button></div>`;
    } else {
      lower = `
        <section class="card stack">
          <span class="eyebrow">${esc(S.reveal.before)}</span>
          <div class="score">100%</div>
          <p>${esc(S.reveal.after)}</p>
          ${verseBlock()}
        </section>
        ${
          g.endStage === 1
            ? `<div><button class="btn" id="review">Review the journey</button></div>`
            : `<div class="review-grid">
                <section class="stack review-list">
                  <h2>Your journey, seen from above</h2>
                  <ol class="replay">
                    ${g.log
                      .map(
                        (e) => `<li>
                          <div class="saw">
                            <span class="eyebrow">${esc(e.title)} · ${esc(e.player)}</span>
                            <b>${esc(e.choice)}</b>
                          </div>
                          <div class="grace"><span class="eyebrow">Bhagavan’s view</span>${esc(e.grace)}</div>
                        </li>`
                      )
                      .join("")}
                  </ol>
                </section>
                <aside class="card stack questions-card">
                  <h3>For your group to discuss</h3>
                  <p class="small muted">Skim the journey, then spend your time here.</p>
                  <ol class="questions">${S.discussion.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>
                </aside>
              </div>
              ${isHost() ? `<div><button class="btn secondary" id="again">Play again</button></div>` : ""}`
        }`;
    }

    app.innerHTML = `
      ${sceneBox(S.arrival.art, "Arrived · Room " + me.code, "The temple", `<p>${esc(arrival)}</p>`)}
      ${stats}
      ${lower}
    `;
    paintArt();
    const r = document.getElementById("reveal");
    if (r) r.onclick = () => setEndStage(1);
    const rv = document.getElementById("review");
    if (rv) rv.onclick = () => setEndStage(2);
    const again = document.getElementById("again");
    if (again) again.onclick = playAgain;
  }

  // ---------- boot ----------
  if (me && me.code && !SYNC.problem) enter(me);
  else render();
})();
