/*
  sync.js — shared rooms.
  Firebase Realtime Database when firebase-config.js is filled in,
  otherwise a local test mode that syncs tabs of one browser through localStorage.

  API (all return Promises except watch):
    SYNC.mode                       "firebase" | "local"
    SYNC.exists(code)               -> boolean
    SYNC.create(code, room)
    SYNC.update(code, fn)           fn(room) -> new room, or undefined to cancel. Safe against simultaneous clicks.
    SYNC.watch(code, cb)            cb(room) on every change; returns an unsubscribe function
    SYNC.online(code, pid)          mark this player online; returns a function that marks them offline
    SYNC.problem                    a message when Firebase is set up but can't be used, otherwise ""
*/

(function () {
  // Firebase drops empty arrays and objects; put them back.
  function normalize(room) {
    if (!room) return room;
    room.players = room.players || {};
    room.presence = room.presence || {};
    room.order = toArray(room.order);
    if (room.game) {
      const g = room.game;
      g.items = toArray(g.items);
      g.used = toArray(g.used);
      g.log = toArray(g.log).map((e) => ({ ...e, deltas: e.deltas || {} }));
      g.flags = g.flags || {};
      g.meters = g.meters || {};
    }
    return room;
  }
  function toArray(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x.filter((v) => v !== undefined && v !== null);
    return Object.keys(x)
      .sort((a, b) => a - b)
      .map((k) => x[k]);
  }

  // Firebase refuses any write that contains undefined; a JSON round trip drops those fields.
  const clean = (x) => JSON.parse(JSON.stringify(x));

  // A wrong databaseURL makes Firebase wait forever, so give up after a while with an error.
  const withTimeout = (promise, ms = 8000) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase timed out")), ms))]);

  const cfg = window.FIREBASE_CONFIG || {};
  let problem = "";
  let db = null;
  if (cfg.apiKey) {
    if (!cfg.databaseURL) problem = "The Firebase setup is missing databaseURL (in firebase-config.js).";
    else if (!window.firebase) problem = "Couldn't load Firebase. This network may be blocking it. Try another network, or turn off a VPN or content blocker.";
    else {
      try {
        firebase.initializeApp(cfg);
        db = firebase.database();
      } catch (e) {
        problem = "The Firebase setup in firebase-config.js doesn't work: " + e.message;
      }
    }
  }

  if (db) {
    const ref = (code) => db.ref("rooms/" + code);

    window.SYNC = {
      mode: "firebase",
      problem: "",
      async exists(code) {
        const snap = await withTimeout(ref(code).child("createdAt").once("value"));
        return snap.exists();
      },
      async create(code, room) {
        await withTimeout(ref(code).set(clean(room)));
      },
      async update(code, fn) {
        const res = await withTimeout(
          ref(code).transaction((cur) => {
            // Firebase may call this first with a cached null; returning null lets it retry with the real value.
            if (cur === null) return null;
            const next = fn(normalize(cur));
            return next === undefined ? undefined : clean(next);
          })
        );
        return res.committed;
      },
      watch(code, cb) {
        const r = ref(code);
        const handler = (snap) => cb(normalize(snap.val()));
        r.on("value", handler);
        return () => r.off("value", handler);
      },
      online(code, pid) {
        const p = ref(code).child("presence/" + pid);
        const conn = db.ref(".info/connected");
        const handler = conn.on("value", (snap) => {
          if (snap.val() === true) {
            p.onDisconnect().remove();
            p.set(true);
          }
        });
        return () => {
          conn.off("value", handler);
          p.onDisconnect().cancel();
          p.remove();
        };
      },
    };
  } else {
    const key = (code) => "yatra-room-" + code;
    const listeners = {};
    const read = (code) => {
      try {
        return normalize(JSON.parse(localStorage.getItem(key(code))));
      } catch (e) {
        return null;
      }
    };
    const write = (code, room) => {
      try {
        localStorage.setItem(key(code), JSON.stringify(room));
      } catch (e) {}
      (listeners[code] || []).forEach((cb) => cb(read(code)));
    };
    window.addEventListener("storage", (e) => {
      if (!e.key || !e.key.startsWith("yatra-room-")) return;
      const code = e.key.slice("yatra-room-".length);
      (listeners[code] || []).forEach((cb) => cb(read(code)));
    });

    window.SYNC = {
      mode: "local",
      problem,
      async exists(code) {
        return !!read(code);
      },
      async create(code, room) {
        write(code, room);
      },
      async update(code, fn) {
        const cur = read(code);
        if (!cur) return false;
        const next = fn(cur);
        if (next === undefined) return false;
        write(code, next);
        return true;
      },
      watch(code, cb) {
        (listeners[code] = listeners[code] || []).push(cb);
        setTimeout(() => cb(read(code)), 0);
        return () => (listeners[code] = listeners[code].filter((x) => x !== cb));
      },
      online(code, pid) {
        this.update(code, (r) => {
          r.presence[pid] = true;
          return r;
        });
        return () => {};
      },
    };
  }
})();
