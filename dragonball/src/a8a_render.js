// =====================================================================
//  BATTLE RENDERER — Goku Gekitōden's battle screen: the fight seen from above on a small map of the place, with
//  the two fighters' heads moving around it. Auras, ki blasts, beams and their struggles, discs, giant energy balls,
//  impacts and floating numbers are drawn between the heads. World x/y come from the engine; on a tall screen the
//  map stands on its end, so your fighter starts at the bottom. The place art below (ENVS, bgLayer, buildEnv) also
//  backs the story scenes and the chapter fields.
// =====================================================================
const BT = { on: false, cv: null, g: null, W: 0, H: 0, dpr: 1, clock: 0, speed: 1, paused: false, vus: new Map(), parts: [], floats: [], shots: [], rings: [],
  shake: 0, flash: 0, flashCol: "#ffffff", waits: [], tweens: [], env: null, acc: 0, last: 0, mTop: 96, mBot: 150 };
const BG_W = 2400;

// ---------- places ----------
const ENVS = {
  wasteland: { n: "Wasteland", sky: ["#4a8ad8", "#8ac0f0", "#f2e2b8"], far: "mesa", farC: "#b0785a", near: "rocks", nearC: "#8a5a3a", ground: ["#c89a6a", "#8a6040"], fx: "dust" },
  kamehouse: { n: "Kame House", sky: ["#3a8ae8", "#7ac8f8", "#d8f4ff"], far: "sea", farC: "#2a7ad8", near: "island", nearC: "#e8d8a0", ground: ["#f2e2b0", "#c8b078"], fx: "gulls" },
  snakeway: { n: "Snake Way", sky: ["#f2a83a", "#f8d27a", "#fff2c8"], far: "clouds", farC: "#ffe8a8", near: "snake", nearC: "#e8c85a", ground: ["#ffe8a8", "#e8c87a"], fx: "clouds", sky0: 1 },
  hfil: { n: "HFIL", sky: ["#5a1a2a", "#c8402a", "#f2a05a"], far: "spires", farC: "#6a2a2a", near: "rocks", nearC: "#4a1a1a", ground: ["#8a3a2a", "#4a1a14"], fx: "embers" },
  kingkai: { n: "King Kai's Planet", sky: ["#3a2a8a", "#7a5ad8", "#f2c8f0"], far: "planet", farC: "#5ab84a", near: "kkhouse", nearC: "#e8e0c8", ground: ["#6ac85a", "#3a8a3a"], fx: "stars" },
  forest: { n: "The Wilderness", sky: ["#4a9ad8", "#a8d8f0", "#e8f4d8"], far: "pillars", farC: "#8a9a7a", near: "jungle", nearC: "#2a6a2a", ground: ["#5a8a3a", "#3a5a22"], fx: "leaves" },
  lookout: { n: "Kami's Lookout", sky: ["#2a6ad8", "#7ab8f8", "#e8f4ff"], far: "clouds", farC: "#f2f6ff", near: "palace", nearC: "#f2f2f6", ground: ["#f2f2f6", "#c8ccd8"], fx: "clouds" },
  space: { n: "Deep Space", sky: ["#02030a", "#0a0e24", "#1a1a3a"], far: "planets", farC: "#4a5ab8", near: "none", ground: null, fx: "stars" },
  arlia: { n: "Planet Arlia", sky: ["#2a1a3a", "#6a3a6a", "#c88a8a"], far: "spires", farC: "#4a2a4a", near: "rocks", nearC: "#3a2a3a", ground: ["#6a4a5a", "#3a2a32"], fx: "dust" },
  namek: { n: "Planet Namek", sky: ["#3ab87a", "#8ae0a8", "#d8f8d0"], far: "namek", farC: "#2a8a8a", near: "ajisa", nearC: "#2a6a6a", ground: ["#4ab8a8", "#2a7a6a"], fx: "none" },
  frieza: { n: "Frieza's Ship", sky: ["#2a9a7a", "#7ad8a8", "#c8f0d0"], far: "namek", farC: "#2a7a7a", near: "ship", nearC: "#c8ccd8", ground: ["#3a9a8a", "#2a6a5a"], fx: "none" },
  namekdie: { n: "Namek's Last Minutes", sky: ["#1a0a0a", "#7a1a14", "#f2602a"], far: "spires", farC: "#3a0e0a", near: "lava", nearC: "#2a0a08", ground: ["#4a2018", "#1a0a08"], fx: "lightning" },
  tournament: { n: "World Martial Arts Tournament", sky: ["#3a8ae8", "#8ac8f8", "#f2f8ff"], far: "crowd", farC: "#c88a5a", near: "temple", nearC: "#d8c8a8", ground: ["#d8d0c0", "#a8a090"], fx: "confetti" },
  gravity: { n: "Gravity Chamber", sky: ["#3a0a0a", "#8a1a1a", "#c83a2a"], far: "machine", farC: "#5a1a1a", near: "none", ground: ["#5a5a62", "#2a2a30"], fx: "none" },
  city: { n: "East City", sky: ["#3a7ad8", "#8ac0f0", "#f2e8d8"], far: "domes", farC: "#c8c8d8", near: "none", ground: ["#9aa0a8", "#6a6e78"], fx: "none" },
};
// a wide strip for a layer, drawn once per place and scrolled with parallax
function bgLayer(kind, col, h, seed) {
  const cv = document.createElement("canvas"); cv.width = BG_W; cv.height = h;
  const g = cv.getContext("2d"), r = seeded(seed), W = BG_W;
  g.fillStyle = col;
  const dark = shade(col, -.25), light = shade(col, .25);
  if (kind === "mesa") for (let x = -100; x < W; x += 140 + r() * 180) { const w = 90 + r() * 160, t = h * (.25 + r() * .45); g.fillStyle = col; g.fillRect(x, t, w, h); g.fillStyle = dark; g.fillRect(x + w * .7, t, w * .3, h); g.fillStyle = light; g.fillRect(x, t, w, 6); }
  else if (kind === "rocks") for (let x = -60; x < W; x += 60 + r() * 120) { const w = 50 + r() * 90, t = h * (.55 + r() * .35); g.fillStyle = r() < .5 ? col : dark; g.beginPath(); g.moveTo(x, h); g.lineTo(x + w * .2, t); g.lineTo(x + w * .7, t - 10 * r()); g.lineTo(x + w, h); g.fill(); }
  else if (kind === "spires") for (let x = -40; x < W; x += 50 + r() * 110) { const w = 30 + r() * 60, t = h * (.1 + r() * .5); g.fillStyle = r() < .5 ? col : dark; g.beginPath(); g.moveTo(x, h); g.lineTo(x + w * .45, t); g.lineTo(x + w * .55, t); g.lineTo(x + w, h); g.fill(); }
  else if (kind === "pillars") for (let x = -40; x < W; x += 120 + r() * 160) { const w = 40 + r() * 50, t = h * (.05 + r() * .4); g.fillStyle = col; g.fillRect(x, t, w, h); g.fillStyle = dark; g.fillRect(x + w * .6, t, w * .4, h); g.fillStyle = "#4a8a3a"; g.beginPath(); g.ellipse(x + w / 2, t, w * .7, 12, 0, 0, Math.PI * 2); g.fill(); }
  else if (kind === "clouds") for (let k = 0; k < 40; k++) { const x = r() * W, y = h * (.2 + r() * .7), s = 30 + r() * 70; g.globalAlpha = .55 + r() * .4; g.fillStyle = col; for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(x + j * s * .5, y - Math.sin(j) * s * .3, s * (.5 + r() * .3), 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }
  else if (kind === "sea") { g.fillStyle = col; g.fillRect(0, h * .55, W, h); g.fillStyle = light; for (let k = 0; k < 120; k++) g.fillRect(r() * W, h * .58 + r() * h * .4, 20 + r() * 40, 2); }
  else if (kind === "island") { for (let x = 200; x < W; x += 900 + r() * 400) { g.fillStyle = col; g.beginPath(); g.ellipse(x, h, 220, 60, 0, Math.PI, 0); g.fill();
      // Kame House: a pink house with a red roof and KAME HOUSE written on it
      g.fillStyle = "#f2a0b8"; g.fillRect(x - 60, h - 110, 120, 70); g.fillStyle = "#d8302a"; g.beginPath(); g.moveTo(x - 80, h - 108); g.lineTo(x, h - 160); g.lineTo(x + 80, h - 108); g.fill();
      g.fillStyle = "#fff"; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText("KAME HOUSE", x, h - 86); g.fillStyle = "#5a3a2a"; g.fillRect(x - 12, h - 70, 24, 30);
      g.strokeStyle = "#7a5a2a"; g.lineWidth = 7; g.beginPath(); g.moveTo(x + 120, h - 40); g.quadraticCurveTo(x + 130, h - 120, x + 112, h - 170); g.stroke();
      g.fillStyle = "#3a9a3a"; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(x + 112 + Math.cos(j * 1.3) * 30, h - 170 + Math.sin(j * 1.3) * 10, 34, 9, j * 1.3, 0, Math.PI * 2); g.fill(); } } }
  else if (kind === "snake") { g.fillStyle = col; g.beginPath(); g.moveTo(0, h * .7); for (let x = 0; x <= W; x += 40) g.lineTo(x, h * .7 + Math.sin(x / 140) * 18); g.lineTo(W, h * .7 + 26); for (let x = W; x >= 0; x -= 40) g.lineTo(x, h * .7 + 26 + Math.sin(x / 140) * 18); g.fill();
    g.fillStyle = dark; for (let x = 0; x < W; x += 34) { g.beginPath(); g.ellipse(x, h * .7 + 13 + Math.sin(x / 140) * 18, 9, 5, 0, 0, Math.PI * 2); g.fill(); } }
  else if (kind === "planet") { g.fillStyle = col; g.beginPath(); g.ellipse(W / 2, h + 900, 1600, 1000, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = light; g.beginPath(); g.ellipse(W / 2, h + 905, 1560, 980, 0, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 6; g.strokeStyle = light; g.stroke(); }
  else if (kind === "kkhouse") { for (let x = 300; x < W; x += 1100) { g.fillStyle = "#f2e6c8"; g.beginPath(); g.ellipse(x, h - 40, 70, 60, 0, Math.PI, 0); g.fill(); g.fillStyle = "#d8302a"; g.beginPath(); g.ellipse(x, h - 92, 30, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#3a3a3a"; g.fillRect(x - 10, h - 64, 20, 24);
      // the car
      g.fillStyle = "#d8302a"; g.fillRect(x + 150, h - 52, 90, 28); g.fillStyle = "#f2f2f6"; g.fillRect(x + 165, h - 70, 50, 20); g.fillStyle = "#2a2a30"; g.beginPath(); g.arc(x + 170, h - 22, 11, 0, 7); g.arc(x + 222, h - 22, 11, 0, 7); g.fill();
      g.strokeStyle = "#8a5a2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 220, h - 30); g.lineTo(x - 220, h - 150); g.stroke(); g.fillStyle = "#3a9a3a"; g.beginPath(); g.arc(x - 220, h - 160, 40, 0, 7); g.fill(); } }
  else if (kind === "jungle") for (let x = -30; x < W; x += 30 + r() * 50) { const t = h * (.25 + r() * .5); g.fillStyle = r() < .5 ? col : dark; g.beginPath(); g.arc(x, t, 30 + r() * 40, 0, Math.PI * 2); g.fill(); g.fillRect(x - 4, t, 8, h); }
  else if (kind === "palace") { for (let x = 100; x < W; x += 1200) { g.fillStyle = "#f2f2f6"; g.fillRect(x, h - 120, 300, 120); g.fillStyle = "#e8d8a0"; g.beginPath(); g.ellipse(x + 150, h - 120, 80, 70, 0, Math.PI, 0); g.fill(); for (let j = 0; j < 6; j++) { g.fillStyle = "#d8dce6"; g.fillRect(x + 20 + j * 50, h - 110, 14, 110); }
      g.fillStyle = "#2a7a2a"; for (let j = 0; j < 3; j++) { g.beginPath(); g.ellipse(x + 400 + j * 90, h - 50, 30, 50, 0, 0, Math.PI * 2); g.fill(); } } }
  else if (kind === "planets") { for (let k = 0; k < 6; k++) { const x = r() * W, y = h * (.15 + r() * .6), s = 14 + r() * 50; const gr = g.createRadialGradient(x - s * .3, y - s * .3, s * .1, x, y, s); gr.addColorStop(0, shade(pick(["#4a8ad8", "#d8803a", "#8ad8a8", "#c8a8f0"]), .3)); gr.addColorStop(1, "#0a0a14"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); } }
  else if (kind === "namek") { for (let x = -60; x < W; x += 260 + r() * 300) { const t = h * (.35 + r() * .35); g.fillStyle = col; g.beginPath(); g.moveTo(x - 60, h); g.lineTo(x - 20, t); g.quadraticCurveTo(x + 20, t - 30, x + 60, t); g.lineTo(x + 100, h); g.fill(); }
    g.fillStyle = shade(col, .35); g.globalAlpha = .6; g.fillRect(0, h * .85, W, h * .15); g.globalAlpha = 1; }
  else if (kind === "ajisa") for (let x = -30; x < W; x += 120 + r() * 220) {
    // Namek's ajisa trees: thin trunks with round blue-green tops, and a domed Namekian house now and then
    const t = h * (.3 + r() * .35); g.strokeStyle = "#3a6a5a"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, h); g.lineTo(x, t); g.stroke();
    g.fillStyle = "#3aa8a0"; g.beginPath(); g.arc(x, t, 22 + r() * 10, 0, Math.PI * 2); g.fill(); g.fillStyle = "#5ac8b8"; g.beginPath(); g.arc(x - 6, t - 6, 9, 0, Math.PI * 2); g.fill();
    if (r() < .3) { const hx = x + 60; g.fillStyle = "#f2f2f0"; g.beginPath(); g.ellipse(hx, h - 10, 45, 50, 0, Math.PI, 0); g.fill(); g.fillStyle = "#c8ccd0"; for (let j = 0; j < 3; j++) { g.beginPath(); g.ellipse(hx - 22 + j * 22, h - 34, 6, 5, 0, 0, 7); g.fill(); } } }
  else if (kind === "ship") { for (let x = 500; x < W; x += 1300) { g.fillStyle = "#d8dce6"; g.beginPath(); g.ellipse(x, h - 40, 260, 150, 0, Math.PI, 0); g.fill(); g.fillStyle = "#9aa0b0"; g.fillRect(x - 270, h - 50, 540, 20); for (let j = 0; j < 8; j++) { g.fillStyle = "#3a4a6a"; g.beginPath(); g.arc(x - 210 + j * 60, h - 70, 9, 0, 7); g.fill(); } } }
  else if (kind === "lava") { g.fillStyle = "#ff6a1a"; for (let k = 0; k < 18; k++) { const x = r() * W; g.beginPath(); g.ellipse(x, h - 6, 60 + r() * 120, 8, 0, 0, 7); g.fill(); } for (let x = -40; x < W; x += 60 + r() * 100) { const t = h * (.5 + r() * .4); g.fillStyle = col; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 30, t); g.lineTo(x + 60, h); g.fill(); } }
  else if (kind === "crowd") { for (let x = 0; x < W; x += 9) { g.fillStyle = pick(["#c8502a", "#2a6ad8", "#f2c14e", "#3a9a4a", "#f2f2f6", "#8a3a8a"]); g.beginPath(); g.arc(x, h * .55 + r() * 30, 5, 0, 7); g.fill(); } g.fillStyle = col; g.fillRect(0, h * .72, W, h); }
  else if (kind === "temple") { for (let x = 300; x < W; x += 1400) { g.fillStyle = "#e8d8b8"; g.fillRect(x, h - 150, 260, 150); g.fillStyle = "#c8302a"; g.beginPath(); g.moveTo(x - 30, h - 148); g.lineTo(x + 130, h - 210); g.lineTo(x + 290, h - 148); g.fill(); g.fillStyle = "#5a3a2a"; g.fillRect(x + 110, h - 80, 40, 80); } }
  else if (kind === "machine") { g.fillStyle = col; for (let x = 0; x < W; x += 180) { g.fillRect(x, h * .3, 120, h); g.fillStyle = "#ff3a2a"; g.fillRect(x + 20, h * .35, 80, 8); g.fillStyle = col; } }
  else if (kind === "domes") for (let x = 0; x < W; x += 140 + r() * 120) { const s = 40 + r() * 70; g.fillStyle = r() < .5 ? col : light; g.beginPath(); g.ellipse(x, h, s, s * 1.2, 0, Math.PI, 0); g.fill(); g.fillRect(x - s, h - s * .3, s * 2, s); }
  return cv;
}
function buildEnv(name) {
  const E2 = ENVS[name] || ENVS.wasteland, sd = hash(name);
  return { ...E2, key: name, farCv: E2.far && E2.far !== "none" ? bgLayer(E2.far, E2.farC, 320, sd) : null, nearCv: E2.near && E2.near !== "none" ? bgLayer(E2.near, E2.nearC, 240, sd + 7) : null,
    stars: Array.from({ length: 70 }, (_, i) => { const r = seeded(sd + i * 13); return [r(), r() * .7, .5 + r() * 1.5]; }) };
}

// ---------- the map, seen from above ----------
const MAP_PAD = 90;                                        // scenery around the edge of the arena, in world units
const MAP_W = 2 * (ARENA_X + MAP_PAD), MAP_H = 2 * (ARENA_Y + MAP_PAD), MAP_RES = .8;
const MP = { rot: false, s: .3, cx: 0, cy: 0, px: 0, py: 0 };
// fit the map in the space between the HUD and the controls; when that's too small (a wide, short screen) zoom in
// and follow the fighters
function mapFit(dt, cut) {
  const top = BT.mTop + 2, bot = BT.H - (BT.mBotS == null ? BT.mBot : BT.mBotS) - 2, w = Math.max(80, BT.W - (BT.mRightS || 0) - 12), h = Math.max(60, bot - top);
  MP.rot = BT.H > BT.W * 1.1;
  const sw = MP.rot ? MAP_H : MAP_W, sh = MP.rot ? MAP_W : MAP_H, s0 = Math.min(w / sw, h / sh);
  const s = Math.max(s0, Math.min(.27, w / sw, h / sh * 1.7));
  let tx = 0, ty = 0;
  const vs = [...BT.vus.values()].filter(v => v.shown && !v.gone && v.u.status === "field");
  if (vs.length && s > s0 + .002) {
    const mx = vs.reduce((a, v) => a + v.x, 0) / vs.length, my = vs.reduce((a, v) => a + v.y, 0) / vs.length;
    const vx = (MP.rot ? h : w) / s, vy = (MP.rot ? w : h) / s;            // how much of the map shows along world x and y
    tx = vx < MAP_W ? clamp(mx, -(MAP_W - vx) / 2, (MAP_W - vx) / 2) : 0;
    ty = vy < MAP_H ? clamp(my, -(MAP_H - vy) / 2, (MAP_H - vy) / 2) : 0;
  }
  const k = cut ? 1 : 1 - Math.exp(-dt * 3);
  MP.px += (tx - MP.px) * k; MP.py += (ty - MP.py) * k;
  MP.s = s; MP.cx = 6 + w / 2; MP.cy = top + h / 2; MP.view = [6, top, w, h];
}
const toScr = (x, y) => { x -= MP.px; y -= MP.py; return MP.rot ? [MP.cx + y * MP.s, MP.cy - x * MP.s] : [MP.cx + x * MP.s, MP.cy + y * MP.s]; };
const zf = () => MP.s / .32;                                  // effect sizes follow the map's scale
function mapRect() { const a = toScr(-MAP_W / 2, -MAP_H / 2), b = toScr(MAP_W / 2, MAP_H / 2); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; }

// the place, painted once from above (world units, origin at the centre of the arena)
const MAPART = {};
function blobAt(g, x, y, rx, ry, col, rot = 0) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); g.fill(); }
function speckle(g, r, cols, n, size, a = .3) { for (let i = 0; i < n; i++) { g.globalAlpha = a * (.5 + r()); blobAt(g, (r() - .5) * MAP_W, (r() - .5) * MAP_H, size * (.4 + r()), size * (.3 + r() * .6), cols[i % cols.length], r() * 3); } g.globalAlpha = 1; }
function lumpPath(g, x, y, s, r, sq = .85) { const n = 7 + Math.floor(r() * 4), pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = s * (.72 + r() * .38); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * sq]); } return pts; }
function polyFill(g, pts, col, dx = 0, dy = 0) { g.fillStyle = col; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px + dx, py + dy) : g.moveTo(px + dx, py + dy)); g.closePath(); g.fill(); }
// a rock or a mesa from above, lit from the top left
function rockTop(g, x, y, s, col, r) {
  const pts = lumpPath(g, x, y, s, r);
  polyFill(g, pts, "rgba(0,0,0,.3)", s * .22, s * .28);
  polyFill(g, pts, col);
  blobAt(g, x - s * .18, y - s * .2, s * .48, s * .34, shade(col, .2), -.4);
  g.strokeStyle = shade(col, -.4); g.lineWidth = 3; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.stroke();
}
function treeTop(g, x, y, s, col) {
  blobAt(g, x + s * .25, y + s * .3, s, s * .9, "rgba(0,0,0,.28)");
  blobAt(g, x, y, s, s * .95, shade(col, -.3));
  blobAt(g, x - s * .1, y - s * .1, s * .86, s * .8, col);
  blobAt(g, x - s * .3, y - s * .32, s * .38, s * .3, shade(col, .28));
}
function waterTop(g, x, y, rx, ry, col, r) {
  blobAt(g, x, y, rx + 14, ry + 12, shade(col, .45));
  blobAt(g, x, y, rx, ry, col);
  g.strokeStyle = shade(col, .5); g.globalAlpha = .55; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const wx = x + (r() - .5) * rx * 1.2, wy = y + (r() - .5) * ry * 1.1; g.beginPath(); g.arc(wx, wy, 18 + r() * 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  g.globalAlpha = 1;
}
function domeTop(g, x, y, s, col, cap) { blobAt(g, x + s * .2, y + s * .25, s, s, "rgba(0,0,0,.28)"); blobAt(g, x, y, s, s, col); blobAt(g, x - s * .25, y - s * .25, s * .45, s * .4, shade(col, .25)); if (cap) blobAt(g, x, y, s * .3, s * .3, cap); }
// spots near the edge of the arena (so the middle stays clear for the fight)
const edgeSpot = (r, inset = 0) => { const side = Math.floor(r() * 4), t = r() * 2 - 1, mx = ARENA_X + MAP_PAD * .4 - inset, my = ARENA_Y + MAP_PAD * .4 - inset; return side === 0 ? [t * mx, -my] : side === 1 ? [t * mx, my] : side === 2 ? [-mx, t * my] : [mx, t * my]; };
const anySpot = r => [(r() - .5) * MAP_W * .96, (r() - .5) * MAP_H * .96];
// a wandering line (a river, a crack, a lava flow), drawn as a smooth curve in layers from wide and dim to thin and bright
function flowLine(g, r, len, wander, layers) {
  let [x, y] = anySpot(r), a = r() * Math.PI * 2; const pts = [[x, y]];
  for (let k = 0; k < len; k++) { a += (r() - .5) * wander; x += Math.cos(a) * 70; y += Math.sin(a) * 70; pts.push([x, y]); }
  g.lineCap = "round"; g.lineJoin = "round";
  for (const [lw, col] of layers) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length - 1; k++) g.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2);
    g.stroke(); }
}
const MAP_PAINT = {
  wasteland(g, E2, r) {
    speckle(g, r, ["#d8aa78", "#b0845a", "#e8c89a"], 160, 40);
    g.strokeStyle = "rgba(90,50,30,.35)"; g.lineWidth = 3;
    for (let i = 0; i < 14; i++) { let [x, y] = anySpot(r); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .5) * 120; y += (r() - .5) * 80; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 9; i++) { const [x, y] = edgeSpot(r); rockTop(g, x, y, 60 + r() * 70, "#a8704a", r); }
    for (let i = 0; i < 12; i++) { const [x, y] = anySpot(r); rockTop(g, x, y, 12 + r() * 16, "#9a6a48", r); }
  },
  kamehouse(g, E2, r) {
    g.fillStyle = "#2a7ad8"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; for (let i = 0; i < 70; i++) { const [x, y] = anySpot(r); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 8, x + 40, y); g.stroke(); }
    blobAt(g, 0, 0, 640, 380, "#7ac8e8"); blobAt(g, 0, 0, 560, 320, "#f2e2b0"); speckle(g, r, ["#e8d090", "#fff2c8"], 60, 30, .25);
    // Kame House from above: the red roof with its ridge, the pink walls peeking out, and a palm
    const hx = -520, hy = -250;
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(hx - 60, hy - 40, 140, 110); g.fillStyle = "#f2a0b8"; g.fillRect(hx - 76, hy - 56, 152, 112);
    g.fillStyle = "#d8302a"; g.fillRect(hx - 70, hy - 50, 140, 100); g.fillStyle = "#a81a14"; g.fillRect(hx - 70, hy - 4, 140, 8);
    for (const [px, py] of [[480, 210], [560, -140], [-420, 230]]) { g.strokeStyle = "#2a8a3a"; g.lineWidth = 16; g.lineCap = "round"; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + Math.cos(a + .3) * 40, py + Math.sin(a + .3) * 40, px + Math.cos(a) * 70, py + Math.sin(a) * 70); g.stroke(); } blobAt(g, px, py, 12, 12, "#7a5a2a"); }
  },
  snakeway(g, E2, r) {
    speckle(g, r, ["#fff2c8", "#f2c85a", "#ffe8a8"], 120, 70, .45);
    // Snake Way winds across the clouds
    const road = x => Math.sin(x / 260) * 160;
    g.lineCap = "round"; g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 150; g.beginPath(); for (let x = -MAP_W / 2 - 40; x <= MAP_W / 2 + 40; x += 30) x === -MAP_W / 2 - 40 ? g.moveTo(x + 14, road(x) + 18) : g.lineTo(x + 14, road(x) + 18); g.stroke();
    g.strokeStyle = "#c89a2a"; g.lineWidth = 140; g.beginPath(); for (let x = -MAP_W / 2 - 40; x <= MAP_W / 2 + 40; x += 30) x === -MAP_W / 2 - 40 ? g.moveTo(x, road(x)) : g.lineTo(x, road(x)); g.stroke();
    g.strokeStyle = "#e8c85a"; g.lineWidth = 110; g.stroke();
    g.fillStyle = "#c89a3a"; for (let x = -MAP_W / 2; x < MAP_W / 2; x += 46) for (const o of [-28, 0, 28]) blobAt(g, x + (o ? 23 : 0), road(x) + o, 13, 9, "rgba(168,120,40,.55)");
  },
  hfil(g, E2, r) {
    speckle(g, r, ["#6a2a1e", "#a8442a", "#4a1a14"], 140, 50, .4);
    for (let i = 0; i < 9; i++) flowLine(g, r, 4 + Math.floor(r() * 4), 1.2, [[20, "rgba(255,90,20,.22)"], [7, "#ff7a1a"], [2.5, "#ffd27a"]]);
    for (let i = 0; i < 12; i++) { const [x, y] = edgeSpot(r); rockTop(g, x, y, 30 + r() * 50, "#5a1e18", r); }
  },
  kingkai(g, E2, r) {
    g.fillStyle = "#0a0a24"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H); g.fillStyle = "#fff"; for (let i = 0; i < 120; i++) { const [x, y] = anySpot(r); g.globalAlpha = .4 + r() * .6; g.fillRect(x, y, 3, 3); } g.globalAlpha = 1;
    // King Kai's tiny planet fills the map
    const gr = g.createRadialGradient(-120, -140, 100, 0, 0, 900); gr.addColorStop(0, "#7ad86a"); gr.addColorStop(.8, "#3a9a3a"); gr.addColorStop(1, "#1a5a22");
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 860, 600, 0, 0, Math.PI * 2); g.fill();
    speckle(g, r, ["#5ab84a", "#8ae07a"], 80, 30, .3);
    domeTop(g, -560, -300, 80, "#f2e6c8", "#d8302a");
    treeTop(g, 600, -300, 60, "#3a9a3a"); treeTop(g, -620, 320, 44, "#3a9a3a");
    g.fillStyle = "#d8302a"; g.fillRect(470, 250, 110, 56); g.fillStyle = "#f2f2f6"; g.fillRect(495, 258, 50, 40);
    g.strokeStyle = "#8a5a2a"; g.lineWidth = 4; g.beginPath(); g.ellipse(-300, 330, 60, 30, 0, 0, Math.PI * 2); g.stroke();       // Bubbles' running track
  },
  forest(g, E2, r) {
    speckle(g, r, ["#4a7a2a", "#6a9a3a", "#3a5a22"], 160, 50, .35);
    g.strokeStyle = "#7ac0e8"; g.lineWidth = 120; g.lineCap = "round"; g.beginPath(); g.moveTo(-MAP_W / 2 - 50, 420); g.bezierCurveTo(-300, 260, 200, 520, MAP_W / 2 + 50, 360); g.stroke();
    g.strokeStyle = "#4a8ad8"; g.lineWidth = 90; g.stroke();
    for (let i = 0; i < 22; i++) { const [x, y] = edgeSpot(r); treeTop(g, x, y, 40 + r() * 40, r() < .5 ? "#2a6a2a" : "#3a7a2a"); }
    for (let i = 0; i < 5; i++) { const [x, y] = anySpot(r); rockTop(g, x, y * .7, 28 + r() * 20, "#8a9a7a", r); }
  },
  lookout(g, E2, r) {
    g.fillStyle = "#7ab8f8"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H); speckle(g, r, ["#ffffff", "#e8f4ff"], 60, 90, .6);
    // the round white floor of the Lookout, tiled
    blobAt(g, 14, 20, 850, 560, "rgba(0,0,0,.25)"); blobAt(g, 0, 0, 840, 550, "#c8ccd8"); blobAt(g, 0, 0, 820, 532, "#f2f2f6");
    g.save(); g.beginPath(); g.ellipse(0, 0, 820, 532, 0, 0, Math.PI * 2); g.clip(); g.strokeStyle = "rgba(120,130,150,.25)"; g.lineWidth = 2;
    for (let x = -840; x <= 840; x += 80) { g.beginPath(); g.moveTo(x, -560); g.lineTo(x, 560); g.stroke(); } for (let y = -560; y <= 560; y += 80) { g.beginPath(); g.moveTo(-840, y); g.lineTo(840, y); g.stroke(); } g.restore();
    domeTop(g, -620, -330, 110, "#e8d8a0", "#f2f2f6");
    for (const [x, y] of [[560, -380], [640, 300], [-640, 340], [300, 440]]) { blobAt(g, x, y, 36, 36, "#8a5a2a"); treeTop(g, x, y, 30, "#2a7a2a"); }
  },
  space(g, E2, r) {
    g.fillStyle = "#04050e"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
    speckle(g, r, ["#2a1a5a", "#1a3a6a", "#4a1a4a"], 30, 220, .25);
    g.fillStyle = "#fff"; for (let i = 0; i < 220; i++) { const [x, y] = anySpot(r); g.globalAlpha = .3 + r() * .7; const z = 1 + r() * 3; g.fillRect(x, y, z, z); } g.globalAlpha = 1;
    const gr = g.createRadialGradient(560, -380, 20, 620, -320, 260); gr.addColorStop(0, "#8ac8f8"); gr.addColorStop(1, "#0a1a3a"); g.fillStyle = gr; g.beginPath(); g.arc(620, -320, 230, 0, Math.PI * 2); g.fill();
  },
  arlia(g, E2, r) {
    speckle(g, r, ["#7a5a6a", "#4a3a42", "#8a6a7a"], 160, 50, .35);
    blobAt(g, 300, 180, 160, 110, "rgba(30,20,26,.45)"); blobAt(g, 290, 170, 130, 86, "rgba(90,70,84,.5)");
    for (let i = 0; i < 16; i++) { const [x, y] = edgeSpot(r); rockTop(g, x, y, 24 + r() * 46, "#4a2a4a", r); }
  },
  namek(g, E2, r) {
    speckle(g, r, ["#5ac8a0", "#3a9a7a", "#7ad8b0"], 160, 50, .35);
    waterTop(g, -520, 300, 220, 120, "#2a8a9a", r); waterTop(g, 600, -330, 180, 100, "#2a8a9a", r);
    for (let i = 0; i < 14; i++) { const [x, y] = edgeSpot(r); treeTop(g, x, y, 26 + r() * 20, "#3aa8a0"); }
    domeTop(g, 520, 330, 60, "#f2f2f0"); domeTop(g, 610, 280, 40, "#f2f2f0");
  },
  frieza(g, E2, r) {
    MAP_PAINT.namek(g, E2, r);
    // Frieza's ship, parked at the edge
    const x = -560, y = -300;
    blobAt(g, x + 30, y + 36, 200, 200, "rgba(0,0,0,.3)"); blobAt(g, x, y, 200, 200, "#9aa0b0"); blobAt(g, x, y, 176, 176, "#d8dce6"); blobAt(g, x - 40, y - 50, 80, 60, "#f2f4f8");
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; blobAt(g, x + Math.cos(a) * 150, y + Math.sin(a) * 150, 12, 12, "#3a4a6a"); }
  },
  namekdie(g, E2, r) {
    speckle(g, r, ["#3a1810", "#5a2418", "#1a0a08"], 160, 50, .45);
    for (let i = 0; i < 4; i++) flowLine(g, r, 8 + Math.floor(r() * 6), .7, [[64, "rgba(255,90,20,.22)"], [34, "#c8401a"], [22, "#ff6a1a"], [8, "#ffd27a"]]);
    for (let i = 0; i < 8; i++) flowLine(g, r, 3 + Math.floor(r() * 3), 1.4, [[10, "rgba(255,90,20,.25)"], [3, "#ff8a2a"]]);
    for (let i = 0; i < 12; i++) { const [x, y] = edgeSpot(r); rockTop(g, x, y, 26 + r() * 40, "#2a0e0a", r); }
  },
  tournament(g, E2, r) {
    g.fillStyle = "#5aa84a"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
    for (let i = 0; i < 700; i++) { const t = r(), side = Math.floor(r() * 4), x = side < 2 ? (t - .5) * MAP_W : side === 2 ? -MAP_W / 2 + r() * 50 : MAP_W / 2 - r() * 50, y = side >= 2 ? (t - .5) * MAP_H : side === 0 ? -MAP_H / 2 + r() * 50 : MAP_H / 2 - r() * 50; blobAt(g, x, y, 7, 7, ["#c8502a", "#2a6ad8", "#f2c14e", "#3a9a4a", "#f2f2f6", "#8a3a8a"][Math.floor(r() * 6)]); }
    // the stone ring
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(-ARENA_X + 18, -ARENA_Y + 24, ARENA_X * 2, ARENA_Y * 2);
    g.fillStyle = "#d8d0c0"; g.fillRect(-ARENA_X, -ARENA_Y, ARENA_X * 2, ARENA_Y * 2);
    for (let x = -ARENA_X; x < ARENA_X; x += 120) for (let y = -ARENA_Y; y < ARENA_Y; y += 120) { g.fillStyle = r() < .5 ? "#cfc6b4" : "#e2dacb"; g.fillRect(x + 3, y + 3, 114, 114); }
  },
  gravity(g, E2, r) {
    g.fillStyle = "#4a4a52"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
    for (let x = -MAP_W / 2; x < MAP_W / 2; x += 160) for (let y = -MAP_H / 2; y < MAP_H / 2; y += 160) { g.fillStyle = r() < .5 ? "#5a5a62" : "#55555d"; g.fillRect(x + 4, y + 4, 152, 152); g.fillStyle = "#3a3a40"; for (const [a, b] of [[16, 16], [140, 16], [16, 140], [140, 140]]) blobAt(g, x + a, y + b, 5, 5, "#3a3a40"); }
    domeTop(g, 0, -ARENA_Y - 40, 70, "#6a6a72", "#ff3a2a");
  },
  city(g, E2, r) {
    g.fillStyle = "#8a9098"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
    g.fillStyle = "#5a5e66"; for (const x of [-420, 0, 420]) g.fillRect(x - 50, -MAP_H / 2, 100, MAP_H); for (const y of [-260, 260]) g.fillRect(-MAP_W / 2, y - 50, MAP_W, 100);
    g.strokeStyle = "#f2e2a0"; g.lineWidth = 4; g.setLineDash([30, 30]); for (const x of [-420, 0, 420]) { g.beginPath(); g.moveTo(x, -MAP_H / 2); g.lineTo(x, MAP_H / 2); g.stroke(); } g.setLineDash([]);
    for (let i = 0; i < 10; i++) { const [x, y] = edgeSpot(r); domeTop(g, x, y, 40 + r() * 40, r() < .5 ? "#f2f2f6" : "#c8c8d8"); }
  },
};
function mapArt(E2) {
  if (MAPART[E2.key]) return MAPART[E2.key];
  const cv = document.createElement("canvas"); cv.width = Math.round(MAP_W * MAP_RES); cv.height = Math.round(MAP_H * MAP_RES);
  const g = cv.getContext("2d"), r = seeded(hash(E2.key) + 3);
  g.scale(MAP_RES, MAP_RES); g.translate(MAP_W / 2, MAP_H / 2);
  const gr = g.createLinearGradient(0, -MAP_H / 2, 0, MAP_H / 2); gr.addColorStop(0, (E2.ground || ["#3a3a4a"])[0]); gr.addColorStop(1, (E2.ground || ["#3a3a4a", "#1a1a2a"])[1]);
  g.fillStyle = gr; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
  (MAP_PAINT[E2.key] || MAP_PAINT.wasteland)(g, E2, r);
  // the arena: a faint grid inside a frame, the scenery around it shaded a little
  g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(-MAP_W / 2, -MAP_H / 2, MAP_W, MAP_PAD); g.fillRect(-MAP_W / 2, MAP_H / 2 - MAP_PAD, MAP_W, MAP_PAD);
  g.fillRect(-MAP_W / 2, -ARENA_Y, MAP_PAD, ARENA_Y * 2); g.fillRect(MAP_W / 2 - MAP_PAD, -ARENA_Y, MAP_PAD, ARENA_Y * 2);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 2;
  for (let x = -ARENA_X + 120; x < ARENA_X; x += 120) { g.beginPath(); g.moveTo(x, -ARENA_Y); g.lineTo(x, ARENA_Y); g.stroke(); }
  for (let y = -ARENA_Y + 120; y < ARENA_Y; y += 120) { g.beginPath(); g.moveTo(-ARENA_X, y); g.lineTo(ARENA_X, y); g.stroke(); }
  g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 12; g.strokeRect(-ARENA_X, -ARENA_Y, ARENA_X * 2, ARENA_Y * 2);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 4; g.strokeRect(-ARENA_X, -ARENA_Y, ARENA_X * 2, ARENA_Y * 2);
  return MAPART[E2.key] = cv;
}
function drawMap(g) {
  const E2 = BT.env;
  const gr = g.createLinearGradient(0, 0, 0, BT.H); gr.addColorStop(0, shade(E2.sky[0], -.55)); gr.addColorStop(1, shade((E2.ground || E2.sky)[1], -.6));
  g.fillStyle = gr; g.fillRect(0, 0, BT.W, BT.H);
  const [ox, oy] = toScr(0, 0);
  // zoomed in on a short screen, the map shows through a window between the HUD and the controls
  g.save(); if (MP.view) { const [vx, vy, vw, vh] = MP.view; g.beginPath(); g.rect(vx - 6, vy - 2, vw + 12, vh + 4); g.clip(); }
  g.translate(ox, oy); if (MP.rot) g.rotate(-Math.PI / 2); g.scale(MP.s, MP.s);
  g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 18;
  g.drawImage(mapArt(E2), -MAP_W / 2, -MAP_H / 2, MAP_W, MAP_H);
  g.restore();
}

// ---------- the fighters: heads on the map ----------
const HEADS = {};
const headArt = u => HEADS[u.key] || (HEADS[u.key] = headCanvas(u.def.fig, null));
const TEAM_COL = { A: "#3ad0ff", E: "#ff4a3a" };
// the visual unit: smoothed map position, facing and timers set by battle events
function addVU(u) {
  const vu = { uid: u.uid, u, team: u.team, x: u.x, y: u.y, hov: 6, shown: false, gone: false, face: u.team === "A" ? 1 : -1, alpha: 1, hitT: 0, guardT: 0, perfect: false,
    aura: 0, auraCol: u.def.aura || "#f2f2ff", vanishT: 0, flash: 0, koT: 0, ph: R() * 6, trail: [] };
  BT.vus.set(u.uid, vu);
  return vu;
}
const grounded = u => u.def.fig && (u.def.fig.body === "ape" || u.def.fig.body === "dino");
const tokenR = u => clamp(MP.s * 64, 13, 32) * (grounded(u) ? 1.3 : u.boss ? 1.12 : 1);
// where a head is drawn on screen (it floats a little above its shadow)
function vuPos(vu) { const [x, y] = toScr(vu.x, vu.y); return { x, y: y - vu.hov, gx: x, gy: y, r: tokenR(vu.u) }; }
// an aura from above: flame tongues all around the head
function tokenAura(g, x, y, r, col, k) {
  if (k <= 0) return;
  const t = BT.clock / 1000;
  g.save(); g.globalCompositeOperation = "lighter";
  const gr = g.createRadialGradient(x, y, r * .6, x, y, r * 2.1); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = .5 * k; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.1, 0, Math.PI * 2); g.fill();
  g.globalAlpha = .55 * k; g.fillStyle = col;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + t * .7, fl = Math.sin(t * 14 + i * 2.3) * .5 + .5, len = r * (.4 + fl * .6), nx = Math.cos(a), ny = Math.sin(a), w = r * .3;
    const bx = x + nx * r * .9, by = y + ny * r * .9;
    g.beginPath(); g.moveTo(bx - ny * w, by + nx * w);
    g.quadraticCurveTo(bx + nx * len * .6 - ny * w * .3, by + ny * len * .6 + nx * w * .3, bx + nx * len, by + ny * len);
    g.quadraticCurveTo(bx + nx * len * .5 + ny * w * .3, by + ny * len * .5 - nx * w * .3, bx + ny * w, by - nx * w); g.fill();
  }
  g.restore();
}
function drawToken(g, vu, dt) {
  if (!vu.shown || vu.gone) return;
  const u = vu.u, B = BT.B, P = vuPos(vu), { x, y, r } = P, out = u.status === "out";
  if (vu.vanishT > 0) vu.alpha = clamp(Math.abs(vu.vanishT - 220) / 220, 0, 1);
  else if (!out && u.status !== "bench") vu.alpha = Math.min(1, vu.alpha + dt / 200);
  // shadow on the ground, and a streak behind a fast-moving head
  g.save(); g.globalAlpha = .32 * vu.alpha; g.fillStyle = "#000"; g.beginPath(); g.ellipse(P.gx + vu.hov * .5, P.gy + r * .35 + vu.hov * .3, r * .9, r * .45, 0, 0, Math.PI * 2); g.fill(); g.restore();
  vu.trail.push([vu.x, vu.y]); if (vu.trail.length > 6) vu.trail.shift();
  const [tx0, ty0] = vu.trail[0], fast = Math.hypot(vu.x - tx0, vu.y - ty0) * MP.s > r * .9;
  if (fast && !out) { g.save(); g.globalCompositeOperation = "lighter"; vu.trail.forEach(([wx, wy], i) => { const [px, py] = toScr(wx, wy); g.globalAlpha = .07 + i * .04; g.fillStyle = vu.auraCol; g.beginPath(); g.arc(px, py - vu.hov, r * (.6 + i * .06), 0, Math.PI * 2); g.fill(); }); g.restore(); }
  // aura: powering up, a special winding up, a beam struggle, Kaioken, Super Saiyan
  const kai = u.status === "field" && B.has(u, "KAIOKEN");
  const auraK = Math.max(vu.aura, u.act && (u.act.ph === "charge" || (u.act.ph === "wind" && !u.act.c.basic) || u.act.ph === "clash") ? 1 : 0, kai ? .8 : 0, u.def.fig.hs === "ssj" ? .45 : 0);
  if (!out) tokenAura(g, x, y, r, kai ? "#ff3a2a" : vu.auraCol, auraK * vu.alpha);
  // the head in its ring
  const shake = vu.hitT > 0 ? (R() - .5) * 7 * (vu.hitT / 380) : 0;
  g.save(); g.globalAlpha = vu.alpha; g.translate(x + shake, y);
  if (out) g.rotate(.45);
  g.fillStyle = out ? "#5a5a62" : TEAM_COL[u.team]; g.beginPath(); g.arc(0, 0, r + 3, 0, Math.PI * 2); g.fill();
  g.lineWidth = 1.5; g.strokeStyle = "rgba(0,0,0,.65)"; g.stroke();
  g.save(); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.clip();
  const bg = u.isOp || u.boss ? ICON_BG[u.el] : ICON_BG.enemy;
  const gr = g.createRadialGradient(-r * .25, -r * .3, 1, 0, 0, r * 1.2); gr.addColorStop(0, bg[0]); gr.addColorStop(.7, bg[1]); gr.addColorStop(1, bg[2]);
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  if (out) g.filter = "grayscale(1) brightness(.6)"; else if (vu.flash > 0) g.filter = `brightness(${1 + vu.flash / 90})`;
  const S = r * 2.25; g.scale(vu.face, 1); g.drawImage(headArt(u), -S / 2, -S * .47, S, S);
  g.restore();
  if (vu.hitT > 0 && !out) { g.globalCompositeOperation = "lighter"; g.globalAlpha = vu.alpha * vu.hitT / 380 * .45; g.fillStyle = "#ffffff"; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = "source-over"; }
  g.globalAlpha = vu.alpha * .35; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(-r * .35, -r * .5, r * .32, r * .16, -.6, 0, Math.PI * 2); g.fill();
  g.restore();
  if (out) return;
  // a guard: a shield on the side the blow came from
  if (vu.guardT > 0) {
    const foe = B.foeOf(u), fv = foe && BT.vus.get(foe.uid), a = fv ? Math.atan2(vuPos(fv).y - y, vuPos(fv).x - x) : 0;
    g.save(); g.globalAlpha = Math.min(1, vu.guardT / 200); g.lineCap = "round";
    g.strokeStyle = vu.perfect ? "#ffd34d" : "#7ad0ff"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r + 8, a - 1.05, a + 1.05); g.stroke();
    g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 8, a - .8, a + .8); g.stroke(); g.restore();
  }
  // stunned: stars (Solar Flare) or frost (Time Freeze, Telekinesis) circling the head
  if (u.stunT > 0) {
    const t = BT.clock / 300;
    for (let i = 0; i < 3; i++) { const a = t + i * 2.1, sx = x + Math.cos(a) * r * 1.1, sy = y - r * .2 + Math.sin(a) * r * .45;
      g.fillStyle = u.stunK === "FREEZE" ? "#bfe8ff" : u.stunK === "BREAK" ? "#7ad0ff" : "#ffe14a"; g.font = `900 ${Math.round(r * .7)}px sans-serif`; g.textAlign = "center"; g.fillText(u.stunK === "FREEZE" ? "❄" : "★", sx, sy); }
  }
  // the power gauge around your fighter's head while it winds up
  if (u.team === "A" && u.act && u.act.ph === "wind" && !u.act.noPow && !B.auto) {
    g.save(); g.lineWidth = 4; g.lineCap = "round";
    g.strokeStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.arc(x, y, r + 9, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = u.act.pow >= 1 ? "#ffd34d" : "#ff8a1a"; g.beginPath(); g.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u.act.pow); g.stroke(); g.restore();
  }
}
// the line of sight between the two fighters (it shows the range)
function drawRange(g) {
  const B = BT.B, a = B.curOf("A"), e = B.curOf("E"); if (!a || !e) return;
  const va = BT.vus.get(a.uid), ve = BT.vus.get(e.uid); if (!va || !ve || !va.shown || !ve.shown) return;
  const p = vuPos(va), q = vuPos(ve), d = B.dist();
  g.save(); g.setLineDash([3, 6]); g.lineWidth = 1.5; g.globalAlpha = .45;
  g.strokeStyle = d <= NEAR + 30 ? "#ffd34d" : d >= FAR - 60 ? "#7ad0ff" : "#ffffff";
  g.beginPath(); g.moveTo(p.gx, p.gy); g.lineTo(q.gx, q.gy); g.stroke(); g.restore();
}
// incoming attacks on the player's fighter: a ring that closes at the moment of impact (tap GUARD as it closes)
function drawGuardRing(g) {
  const B = BT.B; if (!B || B.auto || B.phase !== "act") return;
  const inc = B.incoming(); if (!inc || UNGUARDABLE.has(inc.kind) && inc.kind !== "disc") return;
  const vu = BT.vus.get(inc.to.uid); if (!vu || !vu.shown) return;
  const left = inc.impactAt - B.t; if (left > GUARD_WIN + .5 || left < 0) return;
  const { x, y, r: tr } = vuPos(vu), r0 = tr + 6, r = r0 + left * 110;
  const perfect = left <= PERFECT_WIN, ok = left <= GUARD_WIN;
  g.save(); g.lineWidth = 3;
  g.strokeStyle = inc.kind === "disc" ? "#ff5a5a" : perfect ? "#ffd34d" : ok ? "#7ad0ff" : "rgba(255,255,255,.6)";
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.globalAlpha = .5; g.strokeStyle = "#ffffff"; g.setLineDash([4, 5]); g.beginPath(); g.arc(x, y, r0, 0, Math.PI * 2); g.stroke();
  g.restore();
}
// ---------- shots: ki blasts, beams, discs, energy balls, flying between the heads ----------
function glowBall(g, x, y, r, col, core = "#ffffff") {
  g.save(); g.globalCompositeOperation = "lighter";
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.2); gr.addColorStop(0, core); gr.addColorStop(.3, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.2, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = core; g.beginPath(); g.arc(x, y, r * .6, 0, Math.PI * 2); g.fill();
}
function beamLine(g, x0, y0, x1, y1, w, col) {
  g.save(); g.lineCap = "round";
  g.globalCompositeOperation = "lighter";
  for (const [lw, a, c] of [[w * 2.4, .25, col], [w * 1.4, .5, col], [w * .6, 1, "#ffffff"]]) { g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
}
// from the front of one head to the other
function shotEnds(from, to) {
  const a = vuPos(from), b = vuPos(to), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  return { p0: [a.x + ux * a.r * .9, a.y + uy * a.r * .9], p1: [b.x, b.y], ux, uy, a, b };
}
const frontOf = vu => { const u = vu.u, foe = BT.B.foeOf(u), fv = foe && BT.vus.get(foe.uid), p = vuPos(vu); if (!fv) return [p.x, p.y]; const q = vuPos(fv), d = Math.hypot(q.x - p.x, q.y - p.y) || 1; return [p.x + (q.x - p.x) / d * p.r, p.y + (q.y - p.y) / d * p.r]; };
function addShot(s) { BT.shots.push({ t0: BT.clock, ...s }); }
function drawShots(g) {
  const B = BT.B, z = zf();
  for (const s of BT.shots) {
    const from = BT.vus.get(s.from), to = BT.vus.get(s.to); if (!from || !to) { s.dead = 1; continue; }
    const atk = B.atks.find(a => a.id === s.atk), col = s.col, E = shotEnds(from, to), { p0, p1, ux, uy } = E, nx = -uy, ny = ux;
    let k = atk ? clamp((B.t - atk.t0) / Math.max(.01, atk.impactAt - atk.t0), 0, 1) : 1;
    const age = BT.clock - s.t0;
    if (s.kind === "ki" || s.kind === "freeze") {
      for (let i = 0; i < s.hits; i++) { const kk = clamp(k * 1.15 - i * .12, 0, 1); if (kk <= 0 || kk >= 1 && atk && atk.done) continue; const w = Math.sin(i * 2.3) * 7 * z; glowBall(g, lerp(p0[0], p1[0], kk) + nx * w, lerp(p0[1], p1[1], kk) + ny * w, (s.kind === "freeze" ? 4 : 4.5 + s.pow * 2.5) * z, col); }
    } else if (s.kind === "beam" || s.kind === "swap") {
      const clash = B.struggle && (B.struggle.A.id === s.atk || B.struggle.E.id === s.atk);
      if (clash) {
        const pa = frontOf(BT.vus.get(B.struggle.A.from.uid)), pe = frontOf(BT.vus.get(B.struggle.E.from.uid)), cx = lerp(pa[0], pe[0], B.struggle.pos), cy = lerp(pa[1], pe[1], B.struggle.pos);
        beamLine(g, p0[0], p0[1], cx, cy, (7 + s.pow * 3) * z, col); glowBall(g, cx, cy, (12 + Math.sin(BT.clock / 40) * 2.5) * z, "#ffffff"); s.clashed = 1; continue;
      }
      const end = atk && !atk.done ? k : 1;
      const tail = atk && !atk.done ? 0 : clamp((BT.clock - (s.doneAt || (s.doneAt = BT.clock))) / 300, 0, 1);
      if (tail >= 1) { s.dead = 1; continue; }
      const ex = lerp(p0[0], p1[0], end), ey = lerp(p0[1], p1[1], end), sx = lerp(p0[0], p1[0], tail), sy = lerp(p0[1], p1[1], tail);
      beamLine(g, sx, sy, ex, ey, (s.kind === "swap" ? 3.5 : 7 + s.pow * 4) * z * (1 - tail * .5), col);
      glowBall(g, ex, ey, (8 + s.pow * 3) * z, col);
    } else if (s.kind === "finger") {
      const tail = atk && !atk.done ? 0 : clamp((BT.clock - (s.doneAt || (s.doneAt = BT.clock))) / 200, 0, 1);
      if (tail >= 1) { s.dead = 1; continue; }
      const ex = lerp(p0[0], p1[0], k), ey = lerp(p0[1], p1[1], k);
      beamLine(g, p0[0], p0[1], ex, ey, 2.5 * z, col);
      if (s.spiral) { g.save(); g.strokeStyle = col; g.lineWidth = 2; g.globalAlpha = .85; g.beginPath(); for (let t2 = 0; t2 <= 1; t2 += .02) { const w = Math.sin(t2 * 40 + BT.clock / 30) * 5 * z, px = lerp(p0[0], ex, t2) + nx * w, py = lerp(p0[1], ey, t2) + ny * w; t2 ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore(); }
    } else if (s.kind === "disc") {
      for (let i = 0; i < s.hits; i++) { const kk = clamp(k - i * .15, 0, 1), w = Math.sin(kk * Math.PI) * 26 * z * (i % 2 ? -1 : 1), px = lerp(p0[0], p1[0], kk) + nx * w, py = lerp(p0[1], p1[1], kk) + ny * w;
        g.save(); g.translate(px, py); g.rotate(BT.clock / 40); g.globalCompositeOperation = "lighter"; g.fillStyle = col; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, 12 * z, 12 * z, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, 0, 7 * z, 7 * z, 0, 0, 7); g.fill();
        g.strokeStyle = "#fff"; g.lineWidth = 1.5; for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(0, 0, 12 * z, q * 2.1, q * 2.1 + .7); g.stroke(); } g.restore(); }
    } else if (s.kind === "bomb") {
      const rr = (18 + s.pow * 10) * z, top = [E.a.x, E.a.y - E.a.r - rr * .9];
      glowBall(g, lerp(top[0], p1[0], k), lerp(top[1], p1[1], k), rr, col, shade(col, .6));
    }
    if (atk && atk.done && s.kind !== "beam" && s.kind !== "swap" && s.kind !== "finger") s.dead = 1;
    if (!atk && s.kind !== "beam" && s.kind !== "swap" && s.kind !== "finger") s.dead = 1;
    if (age > 9000) s.dead = 1;
  }
  BT.shots = BT.shots.filter(s => !s.dead);
}
// energy gathering while an attack winds up: a ball growing over the head for the big ones, a glow in front for beams
function drawCharging(g) {
  const z = zf();
  for (const vu of BT.vus.values()) {
    const u = vu.u, a = u.act; if (!vu.shown || !a || a.ph !== "wind" || u.status !== "field") continue;
    const k = clamp(a.t / a.d, 0, 1), col = u.def.kiCol || "#7ad0ff", p = vuPos(vu);
    if (a.c.kind === "bomb") { const rr = (4 + 24 * k) * z; glowBall(g, p.x, p.y - p.r - rr * .9, rr, col, shade(col, .6)); }
    else if (a.c.kind === "beam" || a.c.kind === "finger" || a.c.kind === "swap") { const f = frontOf(vu); glowBall(g, f[0], f[1], (2 + 6 * k) * z, col); }
    else if (a.c.kind === "disc") { g.save(); g.translate(p.x, p.y - p.r - 8 * z); g.rotate(BT.clock / 50); g.fillStyle = col; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, 12 * z * k + 1, 12 * z * k + 1, 0, 0, 7); g.fill(); g.restore(); }
  }
}
// ---------- particles and floating text ----------
// sparks fly out flat across the map and slow down
function sparks(x, y, col, n = 12, k = 1) {
  const z = zf();
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, v = (50 + R() * 200) * k * z; BT.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 260 + R() * 280, col, s: 2 + R() * 2.5 }); }
}
function ringAt(x, y, col, max = 80, dur = 360) { BT.rings.push({ x, y, col, max, dur, t0: BT.clock }); }
function drawParts(g, dt) {
  const s = dt / 1000, drag = Math.exp(-s * 3);
  for (const p of BT.parts) { p.t += dt; p.x += p.vx * s; p.y += p.vy * s; p.vx *= drag; p.vy *= drag; g.globalAlpha = clamp(1 - p.t / p.life, 0, 1); g.fillStyle = p.col; g.fillRect(p.x, p.y, p.s, p.s); }
  g.globalAlpha = 1; BT.parts = BT.parts.filter(p => p.t < p.life);
  const z = zf() * .62;
  for (const r of BT.rings) { const k = (BT.clock - r.t0) / r.dur; if (k >= 1) { r.dead = 1; continue; } g.strokeStyle = r.col; g.globalAlpha = 1 - k; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(r.x, r.y, r.max * k * z, 0, Math.PI * 2); g.stroke(); }
  g.globalAlpha = 1; BT.rings = BT.rings.filter(r => !r.dead);
}
function floatText(uid, s, cls) {
  const vu = BT.vus.get(uid); if (!vu) return;
  const { x, y, r } = vuPos(vu);
  const n = BT.floats.filter(f => BT.clock - f.t0 < 500 && f.uid === uid).length;
  const w = String(s).length * 7 + 20;
  BT.floats.push({ uid, s: String(s), cls, w, dx: (R() - .5) * 16, dy: -r - 12 - n * 18, x, y, t0: BT.clock });
}
const FLOAT_C = { dmg: "#ffffff", crit: "#ffd34d", heal: "#5dfc9b", buff: "#7ad0ff", debuff: "#ff7a7a", txt: "#e8edf7" };
function drawFloats(g) {
  for (const f of BT.floats) {
    const k = (BT.clock - f.t0) / 1100; if (k >= 1) { f.dead = 1; continue; }
    g.globalAlpha = k < .8 ? 1 : (1 - k) / .2;
    const big = f.cls === "crit" || f.cls === "dmg", vu = BT.vus.get(f.uid);
    // the text rides along with its fighter's head (and stays on screen)
    if (vu && vu.shown && !vu.gone) { const p = vuPos(vu); f.x = p.x; f.y = p.y; }
    const fx = clamp(f.x + f.dx, f.w, BT.W - (BT.mRightS || 0) - f.w), fy = Math.max(BT.mTop + 20, f.y + f.dy);
    g.font = `900 ${big ? 20 : 13}px "Russo One", Impact, sans-serif`; g.textAlign = "center";
    g.lineWidth = 4; g.strokeStyle = "rgba(0,0,0,.8)"; g.strokeText(f.s, fx, fy - k * 30); g.fillStyle = FLOAT_C[f.cls] || "#fff"; g.fillText(f.s, fx, fy - k * 30);
  }
  g.globalAlpha = 1; BT.floats = BT.floats.filter(f => !f.dead);
}
// weather over the map: embers in HFIL, dust in the wasteland, lightning on a dying Namek
function weather(g) {
  const E2 = BT.env, t = BT.clock / 1000, [mx, my, mw, mh] = mapRect();
  g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip(); if (MP.view) { const [vx, vy, vw, vh] = MP.view; g.beginPath(); g.rect(vx - 6, vy - 2, vw + 12, vh + 4); g.clip(); }
  if (E2.fx === "embers") { g.fillStyle = "#ffb04a"; for (let i = 0; i < 26; i++) { const x = mx + (i * 97 + t * 14 * (1 + i % 3)) % mw, y = my + mh - (i * 53 + t * 26) % mh; g.globalAlpha = .55; g.fillRect(x, y, 2, 2); } }
  if (E2.fx === "dust") { g.fillStyle = "#f2e2c8"; for (let i = 0; i < 16; i++) { const x = mx + (i * 131 + t * 40) % mw, y = my + (i * 71) % mh; g.globalAlpha = .22; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }
  if (E2.fx === "clouds" || E2.fx === "gulls") { g.fillStyle = "#ffffff"; for (let i = 0; i < 4; i++) { const x = mx + (i * 263 + t * 12) % (mw + 200) - 100, y = my + (i * 97) % mh; g.globalAlpha = .12; g.beginPath(); g.ellipse(x, y, 70, 30, 0, 0, 7); g.fill(); } }
  if (E2.fx === "lightning" && Math.sin(t * 1.3) > .985) { g.globalAlpha = 1; g.fillStyle = "rgba(255,240,220,.25)"; g.fillRect(mx, my, mw, mh); }
  g.restore();
}

// ---------- frame ----------
function frame(now) {
  if (!BT.on) return;
  BT.raf = requestAnimationFrame(frame);
  const real = BT.last ? Math.min(60, now - BT.last) : 16; BT.last = now;
  const dt = BT.paused ? 0 : real * (BT.live ? BT.speed : 1);
  BT.clock += dt;
  if (BT.step) BT.step(dt);
  for (const w of BT.waits) if (BT.clock >= w.until) { w.done = 1; w.res(); }
  BT.waits = BT.waits.filter(w => !w.done);
  for (const tw of BT.tweens) { const k = clamp((BT.clock - tw.t0) / tw.dur, 0, 1); tw.fn(tw.ease ? ease(k) : k); if (k >= 1) { tw.done = 1; tw.res(); } }
  BT.tweens = BT.tweens.filter(t => !t.done);
  render(dt);
}
function render(dt) {
  const g = BT.g; if (!g) return;
  g.setTransform(BT.dpr, 0, 0, BT.dpr, 0, 0);
  const kk = 1 - Math.exp(-dt / 1000 * 5);
  BT.mBotS = BT.mBotS == null ? BT.mBot : BT.mBotS + (BT.mBot - BT.mBotS) * kk;
  BT.mRightS = (BT.mRightS || 0) + ((BT.mRight || 0) - (BT.mRightS || 0)) * kk;
  mapFit(dt / 1000);
  BT.shake = Math.max(0, BT.shake - dt * .03);
  const sx = (R() - .5) * BT.shake * .6, sy = (R() - .5) * BT.shake * .6;
  g.save(); g.translate(sx, sy);
  drawMap(g);
  weather(g);
  drawRange(g);
  // fallen fighters underneath, then the one being hit, then the attacker on top
  const list = [...BT.vus.values()].sort((a, b) => (b.u.status === "out") - (a.u.status === "out") || (b.hitT > 0) - (a.hitT > 0));
  for (const vu of list) drawToken(g, vu, dt);
  drawCharging(g);
  drawShots(g);
  drawParts(g, dt);
  drawGuardRing(g);
  drawFloats(g);
  g.restore();
  if (BT.flash > 0) { g.fillStyle = BT.flashCol; g.globalAlpha = Math.min(1, BT.flash / 300); g.fillRect(0, 0, BT.W, BT.H); g.globalAlpha = 1; BT.flash = Math.max(0, BT.flash - dt); }
}
const bwait = ms => new Promise(res => BT.waits.push({ until: BT.clock + ms, res }));
const btween = (dur, fn, easeOn = true) => new Promise(res => BT.tweens.push({ t0: BT.clock, dur: Math.max(1, dur), fn, res, ease: easeOn }));
