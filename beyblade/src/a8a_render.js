
// =====================================================================
//  BATTLE RENDERER — a small 3D scene on a 2D canvas.
//  World: ground plane y=0, the dish centred on the origin (DISH_R from the engine); your side enters at -x.
//  Camera: orbit (yaw/pitch/dist) around a target point, eased every frame.
// =====================================================================
const BT = { on: false, cv: null, g: null, W: 0, H: 0, dpr: 1, clock: 0, speed: 1, paused: false, vus: new Map(),
  parts: [], bolts: [], floats: [], arcs: [], rings: [], nades: [], waits: [], tweens: [], slashes: [], beasts: [],
  cam: null, camT: null, camK: 3, home: null, shake: 0, env: null, B: null, step: null, acc: 0, alpha: 0, mTop: 96, mBot: 130,
  raf: 0, last: 0, orbit: false, shx: 0, shy: 0, K: null, flash: 0, flashCol: "#fff", letterbox: 0, letterboxT: 0 };

const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
};
function camBasis(c) {
  const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  const pos = [c.tx + c.dist * Math.sin(c.yaw) * cp, c.ty + c.dist * sp, c.tz - c.dist * Math.cos(c.yaw) * cp];
  const f = v3.norm(v3.sub([c.tx, c.ty, c.tz], pos));
  const r = v3.norm(v3.cross([0, 1, 0], f));
  const u = v3.cross(f, r);
  return { pos, f, r, u, focal: (BT.H / 2) / Math.tan(c.fov / 2), c };
}
function proj(K, x, y, z) {
  const dx = x - K.pos[0], dy = y - K.pos[1], dz = z - K.pos[2];
  const zc = dx * K.f[0] + dy * K.f[1] + dz * K.f[2];
  if (zc < 8) return null;
  const s = K.focal / zc;
  return [BT.W / 2 + (dx * K.r[0] + dy * K.r[1] + dz * K.r[2]) * s, BT.H / 2 - (dx * K.u[0] + dy * K.u[1] + dz * K.u[2]) * s, s, zc];
}

// ---------- environments ----------
// Every battle happens in a Beystadium dish; the venue around it changes with the story.
//  dish: floor colours, rim colour, line colour.  crowd: stands of spectators.  lights: spotlights from above.
const ENVS = {
  bba:    { sky: ["#03050d", "#0c1430", "#1e2c5a"], ground: ["#141c30", "#070a14"], fog: "#1e2c5a", crowd: ["#ff5a4a", "#4aa8ff", "#f2c14e", "#ffffff", "#5fdc8c"], lights: "#9fd0ff",
            dish: { f0: "#c8d2e2", f1: "#6a7894", rim: "#ff7a1a", lip: "#f4f6fa", line: "#3a4a6a" }, ring: "#ff7a1a" },
  dojo:   { sky: ["#1a1438", "#a8486a", "#f3a65a"], ground: ["#8a6a48", "#3a2a1a"], fog: "#f3a65a", trees: 1, mount: ["#4a3048", "#2a1a2a"],
            bodies: [{ az: .5, el: .12, r: .05, c: "#ffe2a0" }], prop: "#6a4a2a", dish: { f0: "#e8e2d4", f1: "#8a8270", rim: "#c8302a", lip: "#f4efe2", line: "#6a5a40" }, ring: "#c8302a" },
  street: { sky: ["#2a6ad8", "#7ab8f2", "#d8f0ff"], ground: ["#8a8f9a", "#4a4e58"], fog: "#d8f0ff", city: "#5a6a8a", lit: "#ffe9a0",
            bodies: [{ az: -.5, el: .4, r: .03, c: "#fffbe8" }], prop: "#7a8090", dish: { f0: "#dfe6ef", f1: "#8a96aa", rim: "#2f6fd8", lip: "#f4f6fa", line: "#4a5a7a" }, ring: "#2f6fd8" },
  river:  { sky: ["#3a2a6a", "#e88a6a", "#ffd9a8"], ground: ["#5a7a3a", "#2a3a1a"], fog: "#ffd9a8", trees: 1, mount: ["#6a4a6a", "#4a3a5a"], clouds: 1,
            bodies: [{ az: .25, el: .08, r: .05, c: "#fff1d6" }], prop: "#3a2a1a", dish: { f0: "#e2e8f0", f1: "#7a8aa0", rim: "#3a9a4a", lip: "#f0f4f8", line: "#4a5a6a" }, ring: "#3a9a4a" },
  china:  { sky: ["#3a4a5a", "#9ab0b8", "#e8eee8"], ground: ["#7a8a6a", "#3a4a32"], fog: "#e8eee8", mount: ["#5a6a6a", "#3a4a4a"], spires: 1,
            bodies: [{ az: .4, el: .3, r: .03, c: "#fffbe8" }], prop: "#6a5a4a", dish: { f0: "#d8d2c4", f1: "#7a7262", rim: "#c8302a", lip: "#f2e8d0", line: "#6a5a40" }, ring: "#c8302a" },
  usa:    { sky: ["#02040e", "#0a1640", "#1a2a70"], ground: ["#1a1e3a", "#08081a"], fog: "#1a2a70", crowd: ["#ff3b3b", "#ffffff", "#3b6fd8", "#f2c14e"], lights: "#ffe7a0", stars: 1,
            dish: { f0: "#e8ecf4", f1: "#7a86a8", rim: "#d82a2a", lip: "#ffffff", line: "#2a3a8a" }, ring: "#d82a2a" },
  europe: { sky: ["#2a3a5a", "#7a96b8", "#d8e4ee"], ground: ["#6a7060", "#2a2e26"], fog: "#d8e4ee", spires: 1, mount: ["#4a5a6a", "#2a3a4a"],
            bodies: [{ az: -.3, el: .3, r: .03, c: "#fffbe8" }], prop: "#5a5a60", dish: { f0: "#d8dce4", f1: "#6a7080", rim: "#7a2a8a", lip: "#f0e8d0", line: "#4a3a5a" }, ring: "#7a2a8a" },
  russia: { sky: ["#0a0e1a", "#2a3a5a", "#7a90b0"], ground: ["#d8e0ea", "#8a98aa"], fog: "#7a90b0", snow: 1, spires: 1, mount: ["#3a4a62", "#2a3448"], stars: 1,
            bodies: [{ az: .5, el: .3, r: .04, c: "#eef2ff" }], prop: "#4a5466", dish: { f0: "#cfd8e6", f1: "#5a6a84", rim: "#8a1a2a", lip: "#e8eef6", line: "#2a3a5a" }, ring: "#8a1a2a" },
  ruins:  { sky: ["#2a1608", "#a8582a", "#f3c27a"], ground: ["#c0905a", "#6a4a2a"], fog: "#f3c27a", mount: ["#8a5a3a", "#5e3a24"], spires: 1,
            bodies: [{ az: -.4, el: .14, r: .06, c: "#fff3c4" }], prop: "#9a7a54", dish: { f0: "#e2d2b4", f1: "#8a7254", rim: "#2a8a8a", lip: "#f0e2c4", line: "#6a5234" }, ring: "#2a8a8a" },
  lab:    { sky: ["#020308", "#07101f", "#10233a"], ground: ["#16202e", "#070a10"], fog: "#10233a", grid: "#5fd4ff", gridA: .28, crowd: null, lights: "#5fd4ff",
            dish: { f0: "#2a3a52", f1: "#0e1624", rim: "#5fd4ff", lip: "#c8e8ff", line: "#5fd4ff" }, ring: "#5fd4ff" },
  bega:   { sky: ["#05020d", "#1a0a36", "#3a1060"], ground: ["#1a1030", "#08040e"], fog: "#3a1060", crowd: ["#b26bff", "#ff5ad8", "#ffffff", "#5fd4ff"], lights: "#d89cff", stars: 1,
            dish: { f0: "#3a2a5a", f1: "#140a24", rim: "#d84aff", lip: "#f0d8ff", line: "#b26bff" }, ring: "#d84aff" },
};
function buildEnv(name) {
  const E = { ...(ENVS[name] || ENVS.bba), name, bodies: (ENVS[name] || ENVS.bba).bodies || [] };
  const rng = seeded(hash(name + "env"));
  E.mtn = []; for (let k = 0; k <= 64; k++) E.mtn.push(.01 + rng() * .022 + Math.pow(Math.sin(k * .37 + rng()), 4) * .05);
  E.mtn2 = []; for (let k = 0; k <= 64; k++) E.mtn2.push(.004 + rng() * .012 + Math.pow(Math.sin(k * .21 + 2), 2) * .018);
  E.starsArr = []; for (let k = 0; k < 90; k++) E.starsArr.push([rng() * 3 - 1.5, rng() * .7, rng() * 1.2 + .3]);
  E.bld = []; for (let k = 0; k < 80; k++) E.bld.push({ w: .5 + rng() * .9, h: .03 + rng() * .1, win: rng() });
  E.props = [];
  if (!E.crowd && name !== "lab") for (let k = 0; k < 9; k++) {
    const a = rng() * Math.PI * 2, d = 760 + rng() * 420, w = 40 + rng() * 60;
    E.props.push({ x: Math.cos(a) * d, z: Math.sin(a) * d * .8 + 200, w, d: w * (.6 + rng() * .6), h: E.trees ? 80 + rng() * 120 : 20 + rng() * 60, tree: !!E.trees });
  }
  // spectators: three tiers of stands around the dish, each a ring of coloured dots
  E.fans = [];
  if (E.crowd) for (let tier = 0; tier < 3; tier++) for (let k = 0; k < 120; k++) {
    const a = k / 120 * Math.PI * 2 + rng() * .02, r = 780 + tier * 120;
    E.fans.push({ a, r, y: 60 + tier * 70 + rng() * 14, c: E.crowd[Math.floor(rng() * E.crowd.length)], ph: rng() * 7 });
  }
  return E;
}

// ---------- scene drawing ----------
function drawSky(K) {
  const { g, W, H } = BT, E = BT.env, c = K.c;
  const hy = H / 2 - Math.tan(c.pitch) * K.focal;
  const sg = g.createLinearGradient(0, Math.min(hy - H * .9, -10), 0, hy);
  sg.addColorStop(0, E.sky[0]); sg.addColorStop(.6, E.sky[1]); sg.addColorStop(1, E.sky[2]);
  g.fillStyle = sg; g.fillRect(-W, -H, W * 3, hy + H + 2);
  const az2x = az => { const a = az + c.yaw; return Math.abs(a) > 1.35 ? null : W / 2 + Math.tan(a) * K.focal; };
  const el2y = el => hy - Math.tan(el) * K.focal;
  if (E.stars) for (const [az, el, r] of E.starsArr) { const x = az2x(az); if (x == null) continue; g.fillStyle = `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(az * 99 + BT.clock / 900))})`; g.fillRect(x, el2y(el), r, r); }
  for (const b of E.bodies) {
    const x = az2x(b.az); if (x == null) continue;
    const y = el2y(b.el), r = b.r * K.focal;
    if (b.planet) {
      const pg = g.createRadialGradient(x - r * .4, y - r * .4, r * .1, x, y, r);
      pg.addColorStop(0, shade(b.c, .35)); pg.addColorStop(.7, b.c); pg.addColorStop(1, shade(b.c, -.6));
      g.fillStyle = pg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    } else {
      const gl = g.createRadialGradient(x, y, 0, x, y, r * 3.2);
      gl.addColorStop(0, b.c); gl.addColorStop(.3, b.c + "88"); gl.addColorStop(1, b.c + "00");
      g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3.2, 0, 7); g.fill();
      circ(g, x, y, r, "#fffdf4");
      if (b.ring) { g.strokeStyle = "#ffffff55"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, r * 1.9, r * .45, -.3, 0, 7); g.stroke(); }
    }
  }
  if (E.clouds) {
    g.fillStyle = "#ffffff55";
    for (let k = 0; k < 7; k++) { const x = az2x(-1.1 + k * .36 + Math.sin(BT.clock / 9000 + k) * .03); if (x == null) continue; const y = el2y(.06 + (k % 3) * .05); g.beginPath(); g.ellipse(x, y, K.focal * .12, K.focal * .025, 0, 0, 7); g.fill(); }
  }
  const ridge = (arr, col, scale) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(-W, hy + 2);
    for (let k = 0; k <= 64; k++) { const az = -1.6 + k * .05; const x = az2x(az); if (x == null) continue; g.lineTo(x, el2y(arr[k] * scale)); }
    g.lineTo(W * 2, hy + 2); g.closePath(); g.fill();
  };
  if (E.mount) { ridge(E.mtn, E.mount[0], 1); }
  if (E.city) {
    for (let k = 0; k < E.bld.length; k++) {
      const b = E.bld[k], x = az2x(-1.7 + k * .043); if (x == null) continue;
      const w = K.focal * .036 * b.w, h = K.focal * b.h, y = hy - h;
      g.fillStyle = E.city; g.fillRect(x, y, w, h + 2);
      if (b.win > .25) { g.fillStyle = E.lit; g.globalAlpha = .55; for (let wy = y + 4; wy < hy - 3; wy += 6) for (let wx = x + 2; wx < x + w - 2; wx += 5) if (((wx * 7 + wy * 13 + k) % 5) < 2) g.fillRect(wx, wy, 1.6, 2); g.globalAlpha = 1; }
    }
  }
  if (E.mount) ridge(E.mtn2, E.mount[1], 1);
  if (E.spires) {
    g.fillStyle = E.mount[1];
    for (let k = 0; k < 5; k++) { const x = az2x(-.8 + k * .4); if (x == null) continue; const w = K.focal * .025, h = K.focal * (.18 + (k % 2) * .08); g.beginPath(); g.moveTo(x - w, hy); g.lineTo(x - w * .6, hy - h); g.lineTo(x, hy - h - w * 2); g.lineTo(x + w * .6, hy - h); g.lineTo(x + w, hy); g.fill(); }
  }
  // ground base
  const gg = g.createLinearGradient(0, hy, 0, H);
  gg.addColorStop(0, E.fog); gg.addColorStop(.06, E.ground[0]); gg.addColorStop(1, E.ground[1]);
  g.fillStyle = gg; g.fillRect(-W, hy, W * 3, H * 2);
  return hy;
}
function seg3(K, a, b, col, w, alpha) {
  let pa = proj(K, ...a), pb = proj(K, ...b);
  if (!pa && !pb) return;
  if (!pa || !pb) {
    // clip to near plane by bisection
    let lo = 0, hi = 1, inA = !!pa;
    for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2, p = proj(K, ...v3.lerp(a, b, m)); if (!!p === inA) lo = m; else hi = m; }
    const m = inA ? lo : hi, p = proj(K, ...v3.lerp(a, b, m));
    if (!p) return;
    if (inA) pb = p; else pa = p;
  }
  const g = BT.g; g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = w;
  g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.stroke(); g.globalAlpha = 1;
}
// ---------- the Beystadium ----------
const DISH_LIP = 40, DISH_H = 34;
// a ring of projected points at radius r and height y (null where it's behind the camera)
const ringPts = (K, r, y, n = 72) => { const out = []; for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2; out.push(proj(K, Math.cos(a) * r, y, Math.sin(a) * r)); } return out; };
function polyFill(g, pts, style) { const ok = pts.filter(Boolean); if (ok.length < 3) return; g.fillStyle = style; g.beginPath(); ok.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); }
function drawGround(K) {
  const E = BT.env, g = BT.g, D = E.dish;
  if (E.gridA) { for (let x = -900; x <= 900; x += 90) seg3(K, [x, 0, -700], [x, 0, 900], E.grid, 1, E.gridA); for (let z = -700; z <= 900; z += 90) seg3(K, [-900, 0, z], [900, 0, z], E.grid, 1, E.gridA); }
  // spectator stands: stepped tiers behind the dish
  if (E.fans && E.fans.length) {
    for (let tier = 2; tier >= 0; tier--) {
      const r = 780 + tier * 120, y = 50 + tier * 70;
      const front = ringPts(K, r - 50, y - 50), back = ringPts(K, r + 60, y + 20);
      for (let k = 0; k < 72; k++) {
        const q = [front[k], front[k + 1], back[k + 1], back[k]]; if (q.some(p => !p)) continue;
        g.fillStyle = shade(E.ground[0], .08 + tier * .05); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
      }
    }
    for (const f of E.fans) {
      const p = proj(K, Math.cos(f.a) * f.r, f.y + Math.abs(Math.sin(BT.clock / 260 + f.ph)) * 6, Math.sin(f.a) * f.r); if (!p) continue;
      g.fillStyle = f.c; g.globalAlpha = .75; g.beginPath(); g.arc(p[0], p[1], Math.max(1, 9 * p[2]), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }
  // the dish: outer wall, lip, inner wall and the floor
  const outer0 = ringPts(K, DISH_R + DISH_LIP, 0), outerT = ringPts(K, DISH_R + DISH_LIP, DISH_H), innerT = ringPts(K, DISH_R, DISH_H), inner0 = ringPts(K, DISH_R, 0);
  for (let k = 0; k < 72; k++) {
    const q = [outer0[k], outer0[k + 1], outerT[k + 1], outerT[k]]; if (q.some(p => !p)) continue;
    g.fillStyle = shade(D.rim, -.35 - .25 * Math.abs(Math.sin(k / 72 * Math.PI * 2))); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  }
  // floor: a bowl, light at the rim and darker toward the centre, with the tournament markings
  const c = proj(K, 0, 0, 0), fl = inner0.filter(Boolean);
  if (c && fl.length > 3) {
    const rs = Math.max(...fl.map(p => Math.hypot(p[0] - c[0], p[1] - c[1])));
    const fg = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], rs); fg.addColorStop(0, D.f1); fg.addColorStop(.7, shade(D.f0, -.08)); fg.addColorStop(1, D.f0);
    polyFill(g, inner0, fg);
  }
  for (const [r, w, a] of [[DISH_R * .25, 2, .5], [DISH_R * .55, 1.5, .35], [DISH_R * .85, 2.5, .45]]) groundEllipseLine(K, 0, 0, r, D.line, w, a);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; seg3(K, [Math.cos(a) * DISH_R * .25, 0, Math.sin(a) * DISH_R * .25], [Math.cos(a) * DISH_R * .85, 0, Math.sin(a) * DISH_R * .85], D.line, 1.2, .3); }
  // inner wall (the far side faces the camera) and the lip on top
  for (let k = 0; k < 72; k++) {
    const q = [inner0[k], inner0[k + 1], innerT[k + 1], innerT[k]]; if (q.some(p => !p)) continue;
    g.fillStyle = shade(D.rim, -.1 - .2 * Math.abs(Math.cos(k / 72 * Math.PI * 2))); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  }
  for (let k = 0; k < 72; k++) {
    const q = [innerT[k], innerT[k + 1], outerT[k + 1], outerT[k]]; if (q.some(p => !p)) continue;
    // three pockets in the lip, where ring-outs fly out
    const pocket = [0, 24, 48].some(p => Math.abs(k - p - 6) <= 1);
    g.fillStyle = pocket ? "#0a0c12" : k % 2 ? D.lip : shade(D.lip, -.06); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  }
  g.strokeStyle = D.rim; g.lineWidth = 2; g.globalAlpha = .9; g.beginPath(); let on = false;
  for (const p of innerT) { if (!p) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; } g.stroke(); g.globalAlpha = 1;
}
function groundEllipseLine(K, x, z, r, col, w, a) {
  const g = BT.g; g.strokeStyle = col; g.lineWidth = w; g.globalAlpha = a; g.beginPath(); let on = false;
  for (let k = 0; k <= 64; k++) { const an = k / 64 * Math.PI * 2, p = proj(K, x + Math.cos(an) * r, 0, z + Math.sin(an) * r); if (!p) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
  g.stroke(); g.globalAlpha = 1;
}
// spotlights sweeping down onto the dish (screen space, additive)
function drawLights(K) {
  const E = BT.env; if (!E.lights) return;
  const g = BT.g, t = BT.clock / 1000;
  g.save(); g.globalCompositeOperation = "lighter";
  for (let k = 0; k < 4; k++) {
    const a = k / 4 * Math.PI * 2 + Math.sin(t * .4 + k) * .3, p = proj(K, Math.cos(a) * 200, 0, Math.sin(a) * 150), top = proj(K, Math.cos(a) * 900, 900, Math.sin(a) * 700);
    if (!p || !top) continue;
    const w = 90 * p[2] + 20, gr = g.createLinearGradient(top[0], top[1], p[0], p[1]); gr.addColorStop(0, E.lights + "00"); gr.addColorStop(1, E.lights + "33");
    g.fillStyle = gr; g.beginPath(); g.moveTo(top[0] - 6, top[1]); g.lineTo(top[0] + 6, top[1]); g.lineTo(p[0] + w, p[1]); g.lineTo(p[0] - w, p[1]); g.closePath(); g.fill();
  }
  g.restore();
}

function drawProp(K, p) {
  const E = BT.env, g = BT.g;
  if (p.tree) {
    const b = proj(K, p.x, 0, p.z), t = proj(K, p.x, p.h, p.z); if (!b || !t) return;
    const w = p.w * .25 * b[2];
    g.fillStyle = shade(E.prop, -.2); g.fillRect(b[0] - w / 2, t[1], w, b[1] - t[1]);
    g.fillStyle = shade(E.mount ? E.mount[0] : "#224422", .05);
    g.beginPath(); g.ellipse(t[0], t[1], p.w * .9 * t[2], p.w * .6 * t[2], 0, 0, 7); g.fill();
    return;
  }
  const { x, z, w, d, h } = p, x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  const faces = [
    { pts: [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], n: [0, 0, -1], s: 0 },
    { pts: [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], n: [1, 0, 0], s: -.2 },
    { pts: [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], n: [-1, 0, 0], s: -.3 },
    { pts: [[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]], n: [0, 0, 1], s: -.35 },
    { pts: [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], n: [0, 1, 0], s: .2 },
  ];
  for (const fc of faces) {
    const c = fc.pts[0], tc = v3.sub(K.pos, c);
    if (tc[0] * fc.n[0] + tc[1] * fc.n[1] + tc[2] * fc.n[2] <= 0) continue;
    const ps = fc.pts.map(q => proj(K, ...q)); if (ps.some(q => !q)) continue;
    g.fillStyle = shade(E.prop, fc.s); g.beginPath(); ps.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill();
    if (BT.env.name === "station" || BT.env.name === "arena") { g.strokeStyle = BT.env.grid + "55"; g.lineWidth = 1; g.stroke(); }
  }
}
function groundEllipse(K, x, z, r, style, fill, lw = 2, rot = 0, dash) {
  const g = BT.g;
  if (fill) {
    const c = proj(K, x, 0, z), a = proj(K, x + r, 0, z), b = proj(K, x, 0, z + r);
    if (!c || !a || !b) return;
    g.save(); g.transform(a[0] - c[0], a[1] - c[1], b[0] - c[0], b[1] - c[1], c[0], c[1]);
    g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fillStyle = style; g.fill(); g.restore();
    return;
  }
  g.save(); g.strokeStyle = style; g.lineWidth = lw;
  if (dash) { g.setLineDash(dash); g.lineDashOffset = -rot * 40; }
  g.beginPath(); let on = false;
  for (let k = 0; k <= 40; k++) {
    const an = k / 40 * Math.PI * 2 + rot, p = proj(K, x + Math.cos(an) * r, 0, z + Math.sin(an) * r);
    if (!p) { on = false; continue; }
    if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]);
    on = true;
  }
  g.stroke(); g.restore();
}
function applyCamXform() {
  const g = BT.g;
  g.translate(BT.W / 2 + BT.shx, BT.H / 2 + BT.shy);
  g.rotate(BT.cam.roll || 0);
  g.translate(-BT.W / 2, -BT.H / 2);
}

// ---------- units ----------
// world points on a Beyblade for effects: its Bit-Chip on top and its middle
const topOf = vu => [vu.pos.x, vu.y + 46 * vu.bs, vu.pos.z];
const chestW = vu => [vu.pos.x, vu.y + 22 * vu.bs, vu.pos.z];
const headW = topOf;

function drawUnitShadow(K, vu) {
  if (!vu.shown || vu.gone) return;
  let a = .42 * clamp(1 - vu.y / 260, 0, 1);
  if (vu.dead && !vu.ringOut) a *= 1 - clamp((BT.clock - vu.deathT - 2400) / 800, 0, 1);
  if (vu.leaveT != null) a *= 1 - clamp((BT.clock - vu.leaveT) / 520, 0, 1);
  groundEllipse(K, vu.pos.x, vu.pos.z, 34 * vu.bs, `rgba(0,0,0,${a})`, true);
}
// a Beyblade in the dish: it spins faster the more Spin it has left and starts to wobble (precess) as it runs low; it
// leans into its rushes, drops in when launched or tagged in, lifts out when tagged out, and on defeat either winds
// down and topples (Sleep Out) or flies over the lip of the dish (Ring Out)
function drawUnit(K, vu) {
  const g = BT.g, T = BT.clock / 1000, d = vu.u.def, u = vu.u;
  const dtS = Math.min(.05, Math.max(0, (BT.clock - (vu.lastT ?? BT.clock)) / 1000)); vu.lastT = BT.clock;
  vu.scr = null;
  if (!vu.shown || vu.gone) return;
  const q = proj(K, vu.pos.x, vu.y, vu.pos.z); if (!q) return;
  const [sx, sy, s] = q, sc = s * vu.bs;
  vu.scr = { x: sx, y: sy, s: sc };
  const hpF = clamp(vu.hp / u.max.hp, 0, 1);
  let w = 26 * (.22 + .78 * hpF), alpha = 1, glow = 0;
  let lean = (1 - hpF) ** 1.5 * .34 * Math.sin(T * 8 + vu.ph);
  if (vu.stall) lean += .24 * Math.sin(T * 13 + vu.ph);
  if (vu.rushing) { lean += clamp((vu.svx || 0) / 1100, -.32, .32); glow = .3; }
  if (vu.aura > BT.clock) glow = Math.max(glow, (vu.aura - BT.clock) / 900 * .8);
  if (vu.enterT != null) { const k = clamp((BT.clock - vu.enterT) / 420, 0, 1); alpha = Math.min(1, k * 3); }
  if (vu.leaveT != null) { const k = clamp((BT.clock - vu.leaveT) / 520, 0, 1); alpha = 1 - k; if (k >= 1) { vu.shown = false; vu.leaveT = null; } }
  if (vu.dead) {
    const k = (BT.clock - vu.deathT) / 1000;
    if (vu.ringOut) { lean = vu.tumble * k * 3.2; alpha = clamp(1.6 - k, 0, 1); if (k > 1.6) vu.gone = true; }
    else {
      w *= Math.max(0, 1 - k * 1.2);
      lean = (ease(clamp(k * 1.1 - .2, 0, 1)) * 1.3 + Math.sin(k * 26) * .14 * Math.max(0, 1 - k)) * vu.fallDir;
      alpha = clamp(3.2 - k, 0, 1); if (k > 3.2) vu.gone = true;
    }
  }
  vu.spinA = (vu.spinA || vu.ph) + w * dtS * vu.rot;
  if (vu.stealth) alpha *= .45;
  const e = clamp(-K.f[1] * 1.15 + .12, .2, .9);
  g.save(); g.globalAlpha = alpha; g.translate(sx, sy); g.scale(sc, sc);
  vu.out = drawBey(g, d.bey, { e, spin: vu.spinA, tilt: lean, blur: clamp(w / 20, 0, 1) * .9, glow });
  g.restore();
  if (vu.flash > BT.clock) {
    const k = (vu.flash - BT.clock) / 160, c = proj(K, ...chestW(vu));
    if (c) { g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], 46 * sc);
      gr.addColorStop(0, `rgba(255,255,255,${.75 * k})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(c[0] - 60 * sc, c[1] - 60 * sc, 120 * sc, 120 * sc); g.restore(); }
  }
  if (vu.aura > BT.clock) {
    const k = (vu.aura - BT.clock) / 900, c = proj(K, ...chestW(vu));
    if (c) { g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], 80 * sc);
      gr.addColorStop(0, vu.auraCol + "aa"); gr.addColorStop(1, vu.auraCol + "00"); g.globalAlpha = Math.min(1, k * 1.5); g.fillStyle = gr; g.fillRect(c[0] - 90 * sc, c[1] - 100 * sc, 180 * sc, 200 * sc); g.restore(); }
  }
}
// streaks along the floor behind a Beyblade moving fast
function drawTrails(K) {
  const g = BT.g;
  g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
  for (const vu of BT.vus.values()) {
    const tr = vu.trail; if (!tr || !vu.shown) continue;
    while (tr.length && BT.clock - tr[0][2] > 280) tr.shift();
    for (let i = 1; i < tr.length; i++) {
      const a = proj(K, tr[i - 1][0], 5, tr[i - 1][1]), b = proj(K, tr[i][0], 5, tr[i][1]); if (!a || !b) continue;
      const k = 1 - (BT.clock - tr[i][2]) / 280;
      g.strokeStyle = vu.col; g.globalAlpha = k * .5; g.lineWidth = (16 * b[2] + 1) * k;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
  }
  g.restore(); g.globalAlpha = 1;
}
// Bit-Beasts rising out of their Bit-Chips for a Bit-Beast attack
function drawBeasts(K) {
  const g = BT.g;
  BT.beasts = BT.beasts.filter(b => BT.clock - b.t0 < b.dur);
  for (const b of BT.beasts) {
    const vu = b.vu, k = (BT.clock - b.t0) / b.dur, p = proj(K, vu.pos.x, 50 * vu.bs + ease(Math.min(1, k * 2)) * 150, vu.pos.z); if (!p) continue;
    const a = k < .2 ? k / .2 : k > .8 ? (1 - k) / .2 : 1, sc = p[2] * 1.15 * (.7 + .3 * ease(Math.min(1, k * 2)));
    g.save(); g.translate(p[0], p[1]); g.scale(sc * (vu.team === "A" ? 1 : -1), sc);
    drawBeast(g, b.kind, b.col, BT.clock / 1000, a);
    g.restore();
  }
}
// a small Spin bar and the effect chips over each Beyblade in the dish
function drawOverhead(K, vu) {
  if (!vu.scr || vu.dead || vu.gone || !vu.shown || vu.enterT != null || vu.leaveT != null) return;
  const g = BT.g, hp = proj(K, vu.pos.x, vu.y + 70 * vu.bs, vu.pos.z); if (!hp) return;
  const w = clamp(58 * vu.scr.s * 1.4, 40, 66), x = hp[0] - w / 2, y = hp[1] - 6, m = vu.u.max;
  g.fillStyle = "rgba(0,0,0,.65)"; g.fillRect(x - 1.5, y - 1.5, w + 3, 7);
  g.fillStyle = "#3a1218"; g.fillRect(x, y, w, 4);
  g.fillStyle = "#ff9c9c"; g.fillRect(x, y, w * clamp(vu.lag / m.hp, 0, 1), 4);
  g.fillStyle = vu.team === "A" ? "#3ddc84" : "#ff5a5a"; g.fillRect(x, y, w * clamp(vu.hp / m.hp, 0, 1), 4);
  if (vu.sh > 0) { g.fillStyle = "#c8ffd6"; g.fillRect(x, y, w * clamp(vu.sh / m.hp, 0, 1), 1.5); }
  // a marker: blue over yours, red over the rival
  g.fillStyle = vu.team === "A" ? "#5fd4ff" : "#ff5a5a"; g.beginPath(); g.moveTo(hp[0] - 5, y - 9); g.lineTo(hp[0] + 5, y - 9); g.lineTo(hp[0], y - 3); g.closePath(); g.fill();
  const ef = vu.u.eff; if (!ef.length) return;
  const seen = new Set(), list = ef.filter(x => !seen.has(x.id) && seen.add(x.id));
  const sz = 11, per = Math.max(1, Math.floor((w + 6) / (sz + 1)));
  g.font = "800 7px Saira Condensed, Arial Narrow, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  list.slice(0, per * 2).forEach((x, i) => {
    const row = Math.floor(i / per), col = i % per, ex = x + col * (sz + 1), ey = y - 22 - row * (sz + 1);
    g.fillStyle = FX[x.id].b ? "#1d7a45" : "#a3242e"; g.fillRect(ex, ey, sz, sz - 1);
    g.fillStyle = "#fff"; g.fillText(FX[x.id].s, ex + sz / 2, ey + sz / 2);
  });
}
// ---------- fx ----------
function addParts(p, n, o) {
  for (let k = 0; k < n; k++) {
    const sp = o.speed || 120, a = R() * Math.PI * 2, b = (R() - .3) * Math.PI;
    BT.parts.push({ p: [p[0] + (R() - .5) * (o.spread || 0), p[1] + (R() - .5) * (o.spread || 0), p[2] + (R() - .5) * (o.spread || 0)],
      v: [Math.cos(a) * Math.cos(b) * sp * R() + (o.vx || 0), Math.sin(b) * sp * R() + (o.vy || 0), Math.sin(a) * Math.cos(b) * sp * R()],
      g: o.g ?? 260, t0: BT.clock, life: (o.life || 500) * (.6 + R() * .6), size: o.size || 3, col: o.col || "#fff", add: o.add !== false, drag: o.drag || 0 });
  }
}
function drawParts(K, dt) {
  const g = BT.g, sdt = dt / 1000;
  BT.parts = BT.parts.filter(q => BT.clock - q.t0 < q.life);
  for (const q of BT.parts) {
    q.v[1] -= q.g * sdt; if (q.drag) { q.v[0] *= 1 - q.drag * sdt; q.v[1] *= 1 - q.drag * sdt; q.v[2] *= 1 - q.drag * sdt; }
    q.p[0] += q.v[0] * sdt; q.p[1] += q.v[1] * sdt; q.p[2] += q.v[2] * sdt;
    if (q.p[1] < 0) { q.p[1] = 0; q.v[1] *= -.3; }
    const s = proj(K, ...q.p); if (!s) continue;
    const k = 1 - (BT.clock - q.t0) / q.life;
    g.globalCompositeOperation = q.add ? "lighter" : "source-over";
    g.globalAlpha = Math.min(1, k * 1.6); g.fillStyle = q.col;
    const r = Math.max(.6, q.size * s[2] * (q.add ? .9 + k * .4 : 1));
    g.beginPath(); g.arc(s[0], s[1], r, 0, 7); g.fill();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
}
function drawBolts(K) {
  const g = BT.g;
  for (const b of BT.bolts) {
    const k = clamp((BT.clock - b.t0) / b.dur, 0, 1);
    const head = v3.lerp(b.from, b.to, k), tail = v3.lerp(b.from, b.to, Math.max(0, k - b.len));
    const ph = proj(K, ...head), pt = proj(K, ...tail); if (!ph || !pt) continue;
    g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    const bw = b.w || 1;
    g.strokeStyle = b.col + "66"; g.lineWidth = (9 * ph[2] + 2) * bw; g.beginPath(); g.moveTo(pt[0], pt[1]); g.lineTo(ph[0], ph[1]); g.stroke();
    g.strokeStyle = b.col; g.lineWidth = (4 * ph[2] + 1) * bw; g.stroke();
    g.strokeStyle = "#fff"; g.lineWidth = (1.6 * ph[2] + .5) * bw; g.stroke();
    g.restore();
  }
  BT.bolts = BT.bolts.filter(b => BT.clock - b.t0 < b.dur);
  for (const n of BT.nades) {
    const k = clamp((BT.clock - n.t0) / n.dur, 0, 1), p = v3.lerp(n.from, n.to, k); p[1] += Math.sin(k * Math.PI) * n.h;
    const s = proj(K, ...p); if (!s) continue;
    circ(g, s[0], s[1], 4 * s[2] + 1, "#3a3f4a"); if (Math.floor(BT.clock / 80) % 2) circ(g, s[0], s[1] - 1, 1.6 * s[2] + .6, "#ff3b3b");
  }
  BT.nades = BT.nades.filter(n => BT.clock - n.t0 < n.dur);
}
function drawArcs(K) {
  const g = BT.g;
  BT.arcs = BT.arcs.filter(a => BT.clock - a.t0 < a.dur);
  for (const a of BT.arcs) {
    const p0 = proj(K, ...a.from()), p1 = proj(K, ...a.to()); if (!p0 || !p1) continue;
    g.save(); g.globalCompositeOperation = "lighter"; g.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      const pts = [p0]; const n = 9, dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
      for (let k = 1; k < n; k++) { const off = (R() - .5) * len * .18; pts.push([p0[0] + dx * k / n + nx * off, p0[1] + dy * k / n + ny * off]); }
      pts.push(p1);
      g.strokeStyle = a.col + "77"; g.lineWidth = 7; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
      g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke();
    }
    g.restore();
  }
}
function drawRings(K) {
  BT.rings = BT.rings.filter(r => BT.clock - r.t0 < r.dur);
  for (const r of BT.rings) {
    const k = clamp((BT.clock - r.t0) / r.dur, 0, 1);
    BT.g.globalAlpha = 1 - k;
    groundEllipse(K, r.x, r.z, lerp(r.r0, r.r1, ease(k)), r.col, false, r.w || 3);
    BT.g.globalAlpha = 1;
  }
}
function drawFloats(K) {
  const g = BT.g;
  BT.floats = BT.floats.filter(f => BT.clock - f.t0 < f.dur);
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const f of BT.floats) {
    const vu = BT.vus.get(f.uid); if (!vu) continue;
    const hp = proj(K, ...headW(vu)); if (!hp) continue;
    const k = (BT.clock - f.t0) / f.dur;
    const y = hp[1] - 34 - k * 46 - f.row * 15, x = hp[0] + f.dx;
    const big = f.cls === "crit" ? 27 : f.cls === "dmg" || f.cls === "heal" || f.cls === "dot" ? 21 : f.cls === "prot" ? 17 : f.cls === "chip" ? 14 : 13;
    const pop = k < .12 ? 1.35 - k * 2.9 : 1;
    g.globalAlpha = k > .75 ? (1 - k) / .25 : 1;
    g.font = `800 ${Math.round(big * pop)}px "Saira Condensed", "Arial Narrow", sans-serif`;
    g.lineWidth = 4; g.strokeStyle = "rgba(0,0,0,.85)"; g.strokeText(f.s, x, y);
    g.fillStyle = { crit: "#ffd34d", dmg: "#ff6b6b", prot: "#eef2fa", chip: "#ffd9b0", heal: "#5dfc9b", dot: "#d68bff", buff: "#57e08f", debuff: "#ff8a8a", txt: "#cfe3ff" }[f.cls] || "#fff";
    g.fillText(f.s, x, y);
  }
  g.globalAlpha = 1;
}
function floatText(uid, s, cls) {
  const recent = BT.floats.filter(f => f.uid === uid && BT.clock - f.t0 < 650).length;
  BT.floats.push({ uid, s, cls, t0: BT.clock, dur: cls === "crit" ? 1300 : 1100, row: recent * 1.25, dx: (recent % 2 ? 1 : -1) * Math.min(recent, 3) * 10 });
}

// ---------- frame ----------
function frame(now) {
  if (!BT.on) return;
  BT.raf = requestAnimationFrame(frame);
  const rdt = Math.min(50, now - (BT.last || now)); BT.last = now;
  const dt = BT.paused ? 0 : rdt * BT.speed;
  BT.clock += dt;
  // tweens + waits
  for (const tw of BT.tweens.slice()) { const k = clamp((BT.clock - tw.t0) / tw.dur, 0, 1); tw.fn(tw.ease ? ease(k) : k); if (k >= 1) { BT.tweens.splice(BT.tweens.indexOf(tw), 1); tw.res(); } }
  for (const w of BT.waits.slice()) if (BT.clock >= w.until) { BT.waits.splice(BT.waits.indexOf(w), 1); w.res(); }
  if (BT.step) BT.step(dt);
  // camera
  const c = BT.cam, t = BT.camT;
  if (BT.orbit) { t.yaw += dt * .00028; }
  const kk = 1 - Math.exp(-dt / 1000 * BT.camK);
  for (const key of ["tx", "ty", "tz", "dist", "fov", "roll", "pitch", "yaw"]) c[key] += (t[key] - c[key]) * kk;
  BT.shake *= Math.exp(-dt / 1000 * 7); if (BT.shake < .3) BT.shake = 0;
  BT.shx = (R() - .5) * BT.shake; BT.shy = (R() - .5) * BT.shake;
  // bars ease
  for (const vu of BT.vus.values()) vu.lag += (vu.hp - vu.lag) * (1 - Math.exp(-dt / 350));
  render(dt);
}
function render(dt) {
  const { g, W, H, dpr } = BT;
  const K = BT.K = camBasis(BT.cam);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.save(); applyCamXform();
  drawSky(K);
  drawLights(K);
  drawGround(K);
  // only the scenery behind the dish (the camera looks down on it from the near side)
  const props = BT.env.props.filter(p => p.z > 300).map(p => ({ p, d: proj(K, p.x, p.h / 2, p.z) })).filter(o => o.d).sort((a, b) => b.d[3] - a.d[3]);
  for (const o of props) drawProp(K, o.p);
  // haze over the far field
  const hy = H / 2 - Math.tan(BT.cam.pitch) * K.focal;
  const hz = g.createLinearGradient(0, hy - 2, 0, hy + H * .18); hz.addColorStop(0, BT.env.fog + "aa"); hz.addColorStop(1, BT.env.fog + "00");
  g.fillStyle = hz; g.fillRect(-W, hy - 2, W * 3, H * .18 + 2);
  // ground decals
  const vus = [...BT.vus.values()];
  for (const vu of vus) drawUnitShadow(K, vu);
  for (const vu of vus) if (vu.shown && !vu.dead && vu.y < 30) groundEllipse(K, vu.pos.x, vu.pos.z, 42 * vu.bs, vu.col + "88", false, 2);
  drawRings(K);
  drawTrails(K);
  // units, far to near
  const order = vus.filter(vu => vu.shown && !vu.gone).map(vu => ({ vu, d: proj(K, vu.pos.x, 40, vu.pos.z) })).filter(o => o.d).sort((a, b) => b.d[3] - a.d[3]);
  for (const o of order) drawUnit(K, o.vu);
  drawBeasts(K);
  drawBolts(K);
  drawArcs(K);
  drawSlashes(K);
  drawParts(K, dt);
  if (BT.env.snow || BT.env.embers) weather(K);
  g.restore();
  // screen-space overlays
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.save(); applyCamXform();
  if (BT.letterboxT < .5) for (const o of order) drawOverhead(K, o.vu);
  drawFloats(K);
  g.restore();
  if (BT.flash > 0) { g.fillStyle = BT.flashCol; g.globalAlpha = BT.flash; g.fillRect(0, 0, W, H); g.globalAlpha = 1; BT.flash = Math.max(0, BT.flash - dt / 260); }
  BT.letterbox += (BT.letterboxT - BT.letterbox) * (1 - Math.exp(-dt / 140));
  if (BT.letterbox > .01) { const h = H * .085 * BT.letterbox; g.fillStyle = "#000"; g.fillRect(0, 0, W, h); g.fillRect(0, H - h, W, h); }
}
function weather(K) {
  const g = BT.g, n = 60, t = BT.clock / 1000;
  g.fillStyle = BT.env.snow ? "rgba(255,255,255,.75)" : "rgba(255,140,60,.8)";
  for (let k = 0; k < n; k++) {
    const x = ((k * 137) % 1600) - 800 + Math.sin(t + k) * 20, z = ((k * 241) % 1200) - 400;
    const y = BT.env.snow ? 300 - ((t * 40 + k * 23) % 300) : ((t * 30 + k * 31) % 260);
    const p = proj(K, x, y, z); if (!p) continue;
    g.fillRect(p[0], p[1], 2.2 * p[2] + .5, 2.2 * p[2] + .5);
  }
}

// ---------- timing helpers (battle clock, honours pause + speed) ----------
const bwait = ms => new Promise(res => BT.waits.push({ until: BT.clock + ms, res }));
const btween = (dur, fn, easeOn = true) => new Promise(res => BT.tweens.push({ t0: BT.clock, dur: Math.max(1, dur), fn, res, ease: easeOn }));
function setPose(vu, name, dur = 0, back = true) { vu.pose = { name, t0: BT.clock, dur, back }; }
function camTo(p, k = 3, cut = false) { Object.assign(BT.camT, p); BT.camK = k; if (cut) Object.assign(BT.cam, BT.camT); }
function camHome(k = 2.6) { BT.orbit = false; camTo({ ...BT.home }, k); }
function fitHome() {
  const land = BT.W / BT.H > 1.05;
  const c = { tx: 0, ty: 0, tz: 0, yaw: 0, pitch: land ? .7 : 1.12, dist: 900, fov: land ? .6 : .66, roll: 0 };
  const pts = [], RR = DISH_R + DISH_LIP;
  for (let k = 0; k < 36; k++) {
    const a = k / 36 * Math.PI * 2, x = Math.cos(a), z = Math.sin(a);
    pts.push([x * RR, 0, z * RR], [x * RR, DISH_H, z * RR], [x * DISH_R * .8, 90, z * DISH_R * .8]);
  }
  const topM = BT.mTop, botM = BT.mBot, sideM = 4;
  const fit = () => {
    let lo = 150, hi = 8000;
    for (let k = 0; k < 26; k++) {
      const mid = (lo + hi) / 2; c.dist = mid; const K = camBasis(c); let ok = true;
      for (const p of pts) { const q = proj(K, ...p); if (!q || q[0] < sideM || q[0] > BT.W - sideM || q[1] < topM || q[1] > BT.H - botM) { ok = false; break; } }
      if (ok) hi = mid; else lo = mid;
    }
    c.dist = hi;
  };
  for (let it = 0; it < 5; it++) {
    fit();
    const K = camBasis(c); let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9;
    for (const p of pts) { const q = proj(K, ...p); if (!q) continue; y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); }
    const s = K.focal / c.dist;
    const dx = ((x0 + x1) / 2 - BT.W / 2) / s, dy = ((y0 + y1) / 2 - (topM + BT.H - botM) / 2) / s;
    c.tx += K.r[0] * dx - K.u[0] * dy; c.ty += K.r[1] * dx - K.u[1] * dy; c.tz += K.r[2] * dx - K.u[2] * dy;
  }
  fit();
  return c;
}
