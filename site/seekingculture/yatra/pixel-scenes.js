/*
  pixel-scenes.js — Oregon Trail–style pixel art, drawn in code on a 192×108 canvas.
  Usage: PIXEL.draw(canvas, "river")   (scale the canvas up with CSS image-rendering: pixelated)
*/
(function () {
  const W = 192, H = 108;
  let c;
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function sky(bands) {
    R(0, 0, W, H, bands[bands.length - 1][0]); // fill below the last band too
    let y = 0;
    bands.forEach(([col, h], i) => {
      R(0, y, W, h, col);
      if (i > 0) for (let x = i % 2; x < W; x += 2) R(x, y - 1, 1, 1, col); // dithered seam
      y += h;
    });
  }
  function sun(x, y, col) { R(x, y, 8, 8, col); R(x - 1, y + 2, 10, 4, col); R(x + 2, y - 1, 4, 10, col); }
  function cloud(x, y, col = "#e8eef2", shade = "#c8d6e0") { R(x, y, 14, 2, col); R(x + 3, y - 2, 8, 2, col); R(x + 2, y + 2, 10, 1, shade); }
  function ridge(points, col, bottom, snow) {
    for (let x = 0; x < W; x++) {
      let i = 0; while (points[i + 1][0] < x) i++;
      const [x1, y1] = points[i], [x2, y2] = points[i + 1];
      const y = Math.round(y1 + ((y2 - y1) * (x - x1)) / (x2 - x1));
      R(x, y, 1, bottom - y, col);
      if (snow && (x + y) % 7 === 0) R(x, y, 1, 2, snow);
    }
  }
  function hill(x0, x1, base, amp, col) {
    for (let x = x0; x < x1; x++) { const y = Math.round(base - amp * Math.sin(((x - x0) / (x1 - x0)) * Math.PI)); R(x, y, 1, H - y, col); }
  }
  function speckle(y0, y1, col, step = 3, seed = 1) {
    const r = rng(seed);
    for (let y = y0; y < y1; y += 2) for (let x = 0; x < W; x += step) if (r() < 0.5) R(x + (y % step), y, 1, 1, col);
  }
  function rock(x, y, w, h) {
    R(x + 2, y, w - 4, h, "#7a5a3a"); R(x, y + 3, w, h - 3, "#7a5a3a");
    R(x + 2, y, w - 6, 2, "#a07850"); R(x + 1, y + 3, 3, h - 6, "#a07850");
    R(x + w - 3, y + 4, 3, h - 4, "#4e3a26"); R(x, y + h - 2, w, 2, "#4e3a26");
    for (let i = 0; i < w; i += 5) R(x + i + 2, y + 6 + (i % 3), 2, 1, "#5e452c");
  }
  function pine(x, y, s = 1, col = "#2f6b3f", dark = "#1f4a2a") {
    const h = Math.round(22 * s);
    R(x - 1, y - 3, 2, 4, "#5b4a2e");
    for (let i = 0; i < h; i++) {
      const w = Math.max(1, Math.round(((i % Math.ceil(h / 3)) + 2 + i / 3) * s));
      R(x - w, y - 3 - h + i, w * 2, 1, i % 4 === 0 ? dark : col);
    }
  }
  function oak(x, y) {
    R(x - 2, y - 14, 4, 14, "#5b4a2e"); R(x - 4, y - 2, 8, 2, "#5b4a2e"); R(x + 2, y - 12, 5, 2, "#5b4a2e");
    [[0, -26, 12], [-9, -20, 9], [9, -20, 9], [-4, -32, 8], [6, -30, 8]].forEach(([dx, dy, r]) => {
      for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy)); R(x + dx - w, y + dy + yy, w * 2, 1, yy < -r / 3 ? "#4f8a44" : "#2f6b3f"); }
    });
  }
  function temple(tx, ty) {
    R(tx - 4, ty, 14, 3, "#e8dcc0"); R(tx - 2, ty - 3, 10, 3, "#d9c49a"); R(tx, ty - 6, 6, 3, "#cdb27f");
    R(tx + 1, ty - 8, 4, 2, "#c09d62"); R(tx + 2, ty - 10, 2, 2, "#e0a030");
    R(tx + 3, ty - 14, 1, 4, "#4e3a26"); R(tx + 4, ty - 14, 3, 2, "#c9552f"); R(tx + 2, ty + 1, 2, 2, "#7a5a2c");
  }
  function person(x, y, body, o = {}) {
    const skin = o.skin || "#b87a4a";
    R(x + 1, y, 3, 3, skin);
    if (o.hood) { R(x, y - 1, 5, 2, body); R(x, y, 1, 3, body); R(x + 4, y, 1, 3, body); R(x + 1, y + 2, 3, 1, "#3a2a1a"); }
    else R(x + 1, y - 1, 3, 1, o.hair || "#1a1410");
    R(x, y + 3, 5, 5, body);
    R(x + (o.faceLeft ? -1 : 5), y + 4, 1, 3, body);
    R(x, y + 8, 2, 3, o.legs || "#3a2e22"); R(x + 3, y + 8, 2, 3, o.legs || "#3a2e22");
    if (o.bundle) { R(x - 2, y + 2, 3, 3, o.bundle); R(x - 1, y + 1, 1, 1, "#6a4a2a"); }
    if (o.stick) R(x + (o.faceLeft ? -2 : 6), y - 2, 1, 12, "#8a6a3a");
    if (o.shadow !== false) R(x, y + 11, 6, 1, "rgba(40,30,20,.35)");
  }
  const PILGRIMS = [["#d98a2b", "#c0392b"], ["#e8e0d0", "#2f6b3f"], ["#2f6b3f", "#d9c07a"], ["#3a5a8a", "#e8e0d0"], ["#8a3a5a", "#d98a2b"]];
  function group(x, y, gap = 11, opts = {}) {
    PILGRIMS.forEach(([b, bun], i) => person(x + i * gap, y + (i % 2), b, { bundle: bun, stick: i === 2, ...opts }));
  }
  const DAY_SKY = [["#4a78a8", 14], ["#6a98c0", 12], ["#8cb4cf", 10], ["#b3cfd8", 8], ["#e0d6b0", 6]];
  const MOUNTAINS = [[0, 46], [14, 36], [26, 44], [40, 30], [56, 42], [70, 34], [86, 45], [100, 32], [118, 40], [132, 28], [150, 38], [166, 33], [180, 42], [192, 40]];

  const SCENES = {
    river() {
      sky(DAY_SKY); sun(150, 18, "#f6d67a"); cloud(40, 12); cloud(96, 20);
      ridge(MOUNTAINS, "#7486a0", 60, "#dfe6ee");
      hill(0, 192, 58, 4, "#6f9a60");
      R(0, 60, W, 8, "#5f8a54"); speckle(60, 68, "#6f9a60", 3, 2);
      pine(40, 62, 0.6); pine(52, 63, 0.5); pine(140, 62, 0.6); pine(170, 63, 0.55);
      // river
      R(0, 68, W, 18, "#3f7fb0");
      const r = rng(7);
      for (let i = 0; i < 70; i++) { const x = Math.floor(r() * W), y = 69 + Math.floor(r() * 16); R(x, y, 3 + Math.floor(r() * 4), 1, r() < 0.4 ? "#e8f2f6" : "#7fb8d8"); }
      R(0, 68, W, 1, "#e8f2f6"); R(0, 85, W, 1, "#2d5e86");
      // near bank
      R(0, 86, W, 22, "#4c7a3a"); speckle(86, 108, "#5d8c48", 3, 3);
      R(0, 86, W, 1, "#8a7a4c");
      oak(22, 104);
      group(56, 91);
    },

    bear() {
      sky([["#5d8fb8", 16], ["#86b0c8", 14], ["#b6d0cc", 12]]);
      R(0, 42, W, 66, "#2f5a36");
      // back row of pines
      for (let x = -4; x < W; x += 9) pine(x, 50 + ((x * 7) % 5), 0.7, "#2c5a36", "#1d3f26");
      // path
      for (let y = 52; y < H; y++) { const half = 6 + (y - 52) * 0.9; R(96 - half, y, half * 2, 1, "#b89a68"); }
      speckle(52, 108, "#1f4a2a", 4, 5);
      for (let y = 52; y < H; y += 3) for (let x = 0; x < W; x += 5) { const half = 6 + (y - 52) * 0.9; if (x > 96 - half && x < 96 + half) R(x + (y % 5), y, 1, 1, "#a08050"); }
      // berry bush
      [[112, 62, 7], [104, 64, 5]].forEach(([bx, by, r]) => { for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy)); R(bx - w, by + yy, w * 2, 1, "#3d7a3a"); } });
      [[108, 60], [113, 58], [116, 63], [103, 63], [110, 66]].forEach(([x, y]) => R(x, y, 2, 2, "#8e2a4a"));
      // bear (facing left, eating)
      const bx = 84, by = 58, fur = "#5a3a22", dark = "#3e2716", muz = "#b08a60";
      R(bx + 4, by, 16, 9, fur); R(bx + 6, by - 2, 10, 2, fur); R(bx + 18, by + 1, 3, 6, fur);
      R(bx - 2, by + 2, 8, 6, fur); R(bx - 1, by, 2, 2, fur); R(bx + 3, by, 2, 2, fur);
      R(bx - 4, by + 5, 3, 2, muz); R(bx - 5, by + 5, 1, 1, "#1a1410"); R(bx + 1, by + 3, 1, 1, "#1a1410");
      R(bx + 5, by + 9, 3, 3, dark); R(bx + 11, by + 9, 3, 3, dark); R(bx + 16, by + 9, 3, 3, dark);
      R(bx + 6, by + 1, 10, 1, "#6e4a2e");
      R(bx + 4, by + 12, 17, 1, "rgba(20,15,10,.35)");
      // foreground pines framing
      pine(10, 108, 1.6, "#24502e", "#173a20"); pine(182, 108, 1.7, "#24502e", "#173a20"); pine(30, 110, 1.1, "#2c5a36", "#1d3f26");
      group(60, 92, 10);
    },

    storm() {
      sky([["#2e3440", 16], ["#3b4252", 14], ["#4c566a", 12], ["#5e6a7e", 8]]);
      [[30, 10], [80, 6], [130, 12], [165, 8]].forEach(([x, y]) => { R(x, y, 26, 4, "#252a33"); R(x + 4, y - 3, 16, 3, "#252a33"); R(x + 2, y + 4, 22, 2, "#39404d"); });
      // lightning
      [[120, 16], [118, 20], [121, 24], [117, 30], [120, 34], [116, 42]].forEach(([x, y], i, a) => { if (i) { const [px, py] = a[i - 1]; for (let t = 0; t <= 4; t++) R(px + ((x - px) * t) / 4, py + ((y - py) * t) / 4, 1, 1, "#f6e27a"); } });
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 6]), "#4a5566", 70, null);
      R(0, 64, W, 44, "#3f6a38"); speckle(64, 108, "#335a2e", 3, 9);
      for (let y = 78; y < H; y++) R(0, y, W, 1, "#8a7050");
      speckle(78, 108, "#76603f", 4, 11);
      // bent tree
      R(160, 62, 3, 16, "#4e3a26"); R(162, 60, 3, 3, "#4e3a26");
      [[168, 56, 8], [174, 60, 6], [163, 54, 6]].forEach(([x, y, r]) => { for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy) * 1.3); R(x - w, y + yy, w * 2, 1, "#2b4f2c"); } });
      // huddled pilgrims leaning into wind
      PILGRIMS.forEach(([b, bun], i) => person(62 + i * 7, 84 + (i % 2), b, { bundle: bun }));
      // rain
      const r = rng(21);
      for (let i = 0; i < 260; i++) { const x = Math.floor(r() * (W + 30)) - 20, y = Math.floor(r() * H); for (let k = 0; k < 4; k++) R(x + k, y + k * 2, 1, 1, "rgba(200,215,235,.55)"); }
    },

    robbers() {
      sky(DAY_SKY); sun(30, 30, "#f6d67a"); cloud(60, 10); cloud(120, 16); cloud(150, 7);
      ridge(MOUNTAINS, "#7486a0", 60, "#dfe6ee");
      hill(120, 192, 52, 14, "#5f8a54"); hill(0, 130, 58, 5, "#6f9a60");
      temple(153, 38);
      R(0, 66, W, 42, "#4c7a3a"); speckle(66, 108, "#5d8c48", 3, 4);
      R(0, 78, W, 30, "#c8a878"); speckle(80, 108, "#b0905e", 4, 6); R(0, 77, W, 1, "#9a7a4c");
      rock(118, 48, 30, 34); rock(140, 56, 28, 26); rock(166, 44, 26, 38); rock(0, 60, 20, 22); rock(12, 68, 16, 14);
      group(34, 83);
      person(122, 78, "#2a2a2a", { hood: true, faceLeft: true, stick: true, legs: "#1a1a1a" });
      person(134, 80, "#3a3230", { hood: true, faceLeft: true, legs: "#1a1a1a" });
      person(146, 77, "#2a2a2a", { hood: true, faceLeft: true, stick: true, legs: "#1a1a1a" });
      [[90, 20], [98, 17]].forEach(([x, y]) => { R(x, y, 1, 1, "#2a2a3a"); R(x + 1, y - 1, 1, 1, "#2a2a3a"); R(x + 2, y, 1, 1, "#2a2a3a"); });
    },
  };

  /* ---------- more helpers ---------- */
  function blob(x, y, r, col, sx = 1) { for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy) * sx); R(x - w, y + yy, w * 2, 1, col); } }
  function hut(x, y, wall = "#d9c49a", roof = "#8a5a2c") {
    R(x, y, 18, 10, wall); R(x + 7, y + 4, 4, 6, "#5b4a2e"); R(x + 2, y + 3, 3, 3, "#5b4a2e");
    for (let i = 0; i < 7; i++) R(x - 2 + i, y - 7 + i, 22 - i * 2, 1, roof);
  }
  function stars(seed, yMax, n = 40) { const r = rng(seed); for (let i = 0; i < n; i++) R(Math.floor(r() * W), Math.floor(r() * yMax), 1, 1, r() < 0.3 ? "#fff6c8" : "#c8d0e8"); }
  function moon(x, y) { blob(x, y, 5, "#f2eccc"); blob(x + 3, y - 2, 4, "#1e2440"); }
  function fire(x, y) {
    blob(x, y - 2, 16, "rgba(246,180,90,.12)");
    R(x - 6, y + 2, 12, 2, "#5b4a2e"); R(x - 4, y, 8, 2, "#6e5234");
    R(x - 3, y - 4, 6, 4, "#e0622a"); R(x - 2, y - 7, 4, 3, "#f2a03a"); R(x - 1, y - 9, 2, 2, "#f6e27a");
  }
  function goat(x, y, col = "#e8e0d0") { R(x, y, 7, 4, col); R(x + 6, y - 2, 3, 3, col); R(x + 8, y - 3, 1, 1, "#5b4a2e"); R(x, y + 4, 1, 2, "#5b4a2e"); R(x + 5, y + 4, 1, 2, "#5b4a2e"); }
  function nightSky() { sky([["#141a33", 18], ["#1e2440", 16], ["#2c3358", 14], ["#3c4470", 10]]); stars(3, 56); }
  function dirtRoad(y0, col = "#c8a878", dots = "#b0905e") { R(0, y0, W, H - y0, col); speckle(y0 + 2, H, dots, 4, 6); R(0, y0 - 1, W, 1, "#9a7a4c"); }
  function grassy(y0, seed = 4) { R(0, y0, W, H - y0, "#4c7a3a"); speckle(y0, H, "#5d8c48", 3, seed); }
  function sitter(x, y, col) { R(x, y + 3, 6, 6, col); R(x + 1, y, 4, 3, "#b87a4a"); R(x + 1, y - 1, 4, 1, "#1a1410"); }

  Object.assign(SCENES, {
    village() {
      sky([["#f0b878", 12], ["#f4cc90", 12], ["#f6ddb0", 12], ["#e8e6c8", 12]]);
      sun(96, 36, "#fbe7a0");
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 6]), "#9a9ab4", 62, null);
      grassy(58, 2);
      dirtRoad(84);
      hut(16, 60); hut(46, 64, "#e4d2a8", "#7a4a26"); hut(140, 60); hut(166, 66, "#e4d2a8", "#7a4a26");
      R(96, 64, 10, 10, "#e8dcc0"); R(98, 60, 6, 4, "#d9c49a"); R(100, 57, 2, 3, "#e0a030"); R(99, 68, 4, 6, "#7a5a2c");
      R(90, 74, 22, 2, "#cdb27f");
      pine(8, 86, 0.8); oak(184, 88);
      R(116, 96, 30, 7, "#b07848"); R(118, 94, 26, 2, "#c98a58");
      [[120, 90, "#8a6a3a"], [127, 90, "#e0a030"], [133, 90, "#c9552f"], [139, 90, "#6f9a60"]].forEach(([x, y, col]) => R(x, y, 5, 4, col));
      group(40, 90);
    },
    gate() {
      sky([["#2c3358", 10], ["#6a6a98", 10], ["#c890a0", 10], ["#f0b878", 10], ["#f6ddb0", 8]]);
      R(150, 40, 10, 4, "#fbe7a0");
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 8]), "#6a6a88", 64, null);
      hill(120, 192, 62, 12, "#4e6e4a"); temple(168, 46);
      grassy(64, 7); dirtRoad(82);
      R(20, 50, 6, 34, "#b89a6a"); R(56, 50, 6, 34, "#b89a6a"); R(16, 44, 50, 6, "#9a7a4c"); R(20, 40, 42, 4, "#c98a58");
      R(36, 36, 10, 4, "#e0a030");
      [[28, 50], [34, 52], [40, 50], [46, 52], [52, 50]].forEach(([x, y]) => R(x, y, 2, 3, "#6f9a60"));
      person(38, 76, "#f0ece0", { hair: "#d8d8d8" });
      group(76, 80, 11);
    },
    shepherd() {
      sky(DAY_SKY); sun(40, 16, "#f6d67a"); cloud(120, 14);
      ridge(MOUNTAINS, "#7486a0", 60, "#dfe6ee");
      R(0, 58, W, 10, "#5f8a54");
      R(0, 68, W, 12, "#5a98c0");
      const r = rng(12);
      for (let i = 0; i < 40; i++) R(Math.floor(r() * W), 69 + Math.floor(r() * 10), 3, 1, "#a8d0e4");
      [[30, 72], [60, 74], [100, 71], [140, 73]].forEach(([x, y]) => R(x, y, 6, 3, "#8a8070"));
      grassy(80, 5);
      oak(172, 104);
      person(150, 86, "#e8e0d0", { stick: true, hair: "#d8d8d8", faceLeft: true });
      goat(14, 88); goat(40, 98, "#c8b8a0"); goat(120, 94); goat(94, 102, "#5b4a3a"); goat(168, 98);
      group(56, 84, 9);
    },
    traveler() {
      sky([["#7aa8c8", 16], ["#a8c8d8", 14], ["#e8dcb0", 12]]); sun(156, 20, "#f6e2a0");
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 10]), "#a09880", 64, null);
      R(0, 56, W, 52, "#c8b080"); speckle(58, 108, "#b09a68", 4, 13);
      for (let y = 66; y < H; y++) { const half = 12 + (y - 66) * 1.2; R(110 - half, y, half * 2, 1, "#dcc494"); }
      R(40, 54, 3, 24, "#5b4a2e"); blob(42, 50, 12, "#4f7a3a", 1.4);
      blob(34, 85, 10, "rgba(40,30,20,.2)", 1.5);
      R(24, 80, 14, 4, "#d9c49a"); R(36, 79, 4, 4, "#b87a4a"); R(36, 78, 4, 1, "#d8d8d8"); R(18, 83, 6, 2, "#8a6a3a");
      group(82, 84);
    },
    forest() {
      sky([["#3c3a68", 14], ["#8a5a78", 12], ["#d8845a", 10], ["#f0b46a", 8]]);
      R(0, 44, W, 64, "#1f3d2a");
      for (let x = -4; x < W; x += 8) pine(x, 52 + ((x * 5) % 6), 0.8, "#23452e", "#152a1c");
      for (let y = 60; y < H; y++) { const half = 5 + (y - 60) * 0.8; R(96 - half, y, half * 2, 1, "#6e5a40"); }
      pine(20, 110, 1.7, "#1a3322", "#0f2016"); pine(176, 110, 1.8, "#1a3322", "#0f2016"); pine(44, 108, 1.2, "#1d3a26", "#12281a"); pine(150, 108, 1.3, "#1d3a26", "#12281a");
      [[60, 70], [128, 66], [74, 58]].forEach(([x, y]) => { R(x, y, 1, 1, "#f6e27a"); R(x + 3, y, 1, 1, "#f6e27a"); });
      group(70, 90, 11);
    },
    lost() {
      nightSky(); moon(160, 14);
      R(0, 40, W, 68, "#12241a");
      const r = rng(31);
      for (let i = 0; i < 26; i++) pine(Math.floor(r() * W), 60 + Math.floor(r() * 50), 0.7 + r() * 1.1, "#1a3322", "#0e1c14");
      PILGRIMS.forEach(([b], i) => person(70 + i * 10 + (i % 2 ? 2 : 0), 86 + (i % 3), b, { faceLeft: i % 2 === 0 }));
      [[40, 70], [150, 76]].forEach(([x, y]) => { R(x, y, 1, 1, "#f6e27a"); R(x + 3, y, 1, 1, "#f6e27a"); });
    },
    bridge() {
      sky(DAY_SKY); sun(30, 18, "#f6d67a"); cloud(120, 12);
      ridge(MOUNTAINS, "#7486a0", 56, "#dfe6ee");
      R(0, 54, 70, 54, "#6f9a60"); R(122, 54, 70, 54, "#6f9a60");
      speckle(56, 108, "#5d8c48", 3, 14);
      for (let y = 56; y < H; y++) { const inset = (y - 56) * 0.35; R(70 + inset, y, 52 - inset * 2, 1, y < 70 ? "#5e4a36" : "#3e3024"); }
      R(70, 56, 3, 52, "#7a5a3a"); R(119, 56, 3, 52, "#7a5a3a");
      R(66, 48, 2, 10, "#5b4a2e"); R(124, 48, 2, 10, "#5b4a2e");
      for (let x = 68; x < 124; x++) { const sag = Math.round(6 * Math.sin(((x - 68) / 56) * Math.PI)); if (x < 86 || x > 104) R(x, 50 + sag, 1, 1, "#8a6a3a"); }
      [[70, 55], [74, 56], [78, 57], [108, 57], [112, 56], [116, 55]].forEach(([x, y]) => R(x, y, 3, 1, "#b08a58"));
      R(86, 56, 1, 10, "#8a6a3a"); R(104, 57, 1, 8, "#8a6a3a");
      group(8, 84, 10);
    },
    cave() {
      R(0, 0, W, H, "#2a241e");
      blob(96, 70, 60, "#3a322a", 1.5); blob(96, 76, 46, "#4a4036", 1.5);
      blob(156, 36, 22, "#4c566a", 0.9);
      const r = rng(8); for (let i = 0; i < 40; i++) R(138 + Math.floor(r() * 36), 16 + Math.floor(r() * 40), 1, 2, "rgba(200,215,235,.6)");
      R(0, 86, W, 22, "#3a322a"); speckle(86, 108, "#4a4036", 4, 15);
      blob(78, 76, 22, "rgba(246,200,120,.10)");
      R(72, 70, 12, 12, "#d9822b"); R(70, 78, 16, 5, "#d9822b"); R(75, 64, 6, 6, "#b87a4a"); R(75, 64, 6, 1, "#8a6a4a");
      [30, 46, 100, 116].forEach((x, i) => sitter(x, 76, PILGRIMS[i][0]));
    },
    signpost() {
      sky([["#4a4a78", 14], ["#9a6a80", 12], ["#e0906a", 10], ["#f0c080", 8]]);
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 6]), "#6a6a88", 64, null);
      grassy(58, 16);
      for (let y = 62; y < H; y++) { const t = (y - 62) / 46; R(96 - 8 - t * 30, y, 16 + t * 60, 1, "#b89a68"); }
      for (let i = 0; i < 40; i++) { R(86 - i * 2.2, 62 + i * 0.5, 6, 1, "#b89a68"); R(100 + i * 2.2, 62 + i * 0.5, 6, 1, "#b89a68"); }
      blob(112, 98, 14, "rgba(60,40,20,.25)", 1.6);
      R(112, 86, 3, 9, "#5b4a2e"); R(100, 95, 24, 3, "#8a6a3a"); R(96, 93, 6, 2, "#8a6a3a"); R(120, 98, 8, 2, "#8a6a3a");
      group(40, 84, 10);
    },
    quarry() {
      sky(DAY_SKY); sun(160, 16, "#f6d67a");
      R(0, 40, W, 68, "#a89a88");
      for (let i = 0; i < 7; i++) R(i * 30, 40 + (i % 2) * 6, 28, 22, i % 2 ? "#b8aa96" : "#9a8c7a");
      R(0, 76, W, 32, "#c8b8a0"); speckle(76, 108, "#b0a08a", 3, 17);
      [[30, 80], [60, 90], [140, 84], [166, 94]].forEach(([x, y]) => { R(x, y, 10, 6, "#9a8c7a"); R(x, y, 10, 1, "#c8baa6"); });
      person(126, 72, "#e8e0d0", { faceLeft: true, stick: true }); person(148, 74, "#c9552f", { faceLeft: true });
      group(40, 88, 10);
    },
    night() {
      nightSky(); moon(34, 16);
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 16]), "#2a3050", 70, "#e8ecf4");
      R(0, 70, W, 38, "#3a4458"); speckle(70, 108, "#4a5468", 3, 18);
      const r = rng(19); for (let i = 0; i < 30; i++) R(Math.floor(r() * W), 70 + Math.floor(r() * 38), 2, 1, "#e8ecf4");
      fire(96, 94);
      [[70, 84], [80, 79], [106, 79], [116, 84], [93, 76]].forEach(([x, y], i) => sitter(x, y, PILGRIMS[i][0]));
    },
    pass() {
      sky(DAY_SKY); cloud(60, 10); cloud(150, 7);
      ridge(MOUNTAINS, "#7486a0", 60, "#dfe6ee");
      hill(0, 192, 60, 6, "#6f9a60");
      R(0, 66, W, 42, "#4c7a3a"); speckle(66, 108, "#5d8c48", 3, 4);
      dirtRoad(80);
      rock(10, 50, 34, 32); rock(150, 48, 36, 34); rock(40, 64, 20, 18);
      PILGRIMS.forEach(([b, bun], i) => person(78 + i * 8, 84 + (i % 2), b, { bundle: bun, faceLeft: i > 2 }));
    },
    camp() {
      sky([["#5a7aa0", 16], ["#8aa8c0", 14], ["#c8d4c8", 12]]);
      ridge(MOUNTAINS.map(([x, y]) => [x, y + 8]), "#8494a8", 64, null);
      grassy(60, 20);
      oak(156, 96); pine(24, 90, 0.9);
      fire(96, 96);
      [66, 78, 108, 120, 92].forEach((x, i) => sitter(x, i === 4 ? 78 : 86, PILGRIMS[i][0]));
    },
    temple() {
      sky([["#3c3a68", 12], ["#8a5a78", 12], ["#e0906a", 12], ["#f6c880", 10]]);
      stars(5, 24, 18);
      hill(0, 192, 72, 28, "#4e6e4a");
      const tx = 96, ty = 58;
      R(tx - 40, ty, 80, 14, "#e8dcc0"); R(tx - 30, ty - 10, 60, 10, "#d9c49a"); R(tx - 22, ty - 20, 44, 10, "#cdb27f");
      R(tx - 14, ty - 28, 28, 8, "#c09d62"); R(tx - 8, ty - 34, 16, 6, "#b08a52"); R(tx - 2, ty - 39, 4, 5, "#e0a030");
      R(tx, ty - 50, 1, 11, "#4e3a26"); R(tx + 1, ty - 50, 8, 4, "#c9552f");
      R(tx - 6, ty + 4, 12, 10, "#5b3a1c");
      [[tx - 34, ty + 4], [tx + 30, ty + 4]].forEach(([x, y]) => { blob(x + 2, y + 2, 8, "rgba(246,226,122,.25)"); R(x, y, 4, 6, "#f6e27a"); });
      for (let i = 0; i < 8; i++) R(tx - 12 - i * 3, ty + 14 + i * 3, 24 + i * 6, 3, i % 2 ? "#cdb27f" : "#d9c49a");
      R(0, 96, W, 12, "#4c7a3a"); speckle(96, 108, "#5d8c48", 3, 21);
      PILGRIMS.forEach(([b], i) => person(44 + i * 24, 94 + (i % 2), b, { shadow: false }));
    },
  });

  window.PIXEL = {
    W, H,
    get scenes() { return Object.keys(SCENES); },
    draw(canvas, id) {
      if (!SCENES[id]) return false;
      canvas.width = W; canvas.height = H;
      c = canvas.getContext("2d");
      c.imageSmoothingEnabled = false;
      SCENES[id]();
      return true;
    },
  };
})();
