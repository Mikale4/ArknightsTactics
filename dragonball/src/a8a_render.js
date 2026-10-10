// =====================================================================
//  BATTLE RENDERER — a 2D side view on canvas: parallax backdrops from the show's places, the two fighters (drawn by
//  drawFigure), auras, ki blasts, beams and their struggles, giant energy balls, impacts and floating numbers.
//  World x comes from the engine (units); the camera follows the pair and zooms with their distance.
// =====================================================================
const BT = { on: false, cv: null, g: null, W: 0, H: 0, dpr: 1, clock: 0, speed: 1, paused: false, vus: new Map(), parts: [], floats: [], shots: [], rings: [],
  cam: { x: 0, z: 1 }, shake: 0, flash: 0, flashCol: "#ffffff", waits: [], tweens: [], env: null, acc: 0, last: 0, mTop: 96, mBot: 150 };
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

// ---------- camera ----------
// the ground sits low in the space between the HUD and the controls (eased, so the planner opening doesn't jolt it)
const groundY = () => BT.mTop + (BT.H - BT.mTop - (BT.mBotS || BT.mBot)) * .86;
// in landscape the planner sits on the right, so the fight centres in the space to its left
const toSX = x => (BT.W - (BT.mRightS || 0)) / 2 + (x - BT.cam.x) * BT.cam.z;
function fitCam(dt, cut) {
  const vs = [...BT.vus.values()].filter(v => v.shown && !v.gone);
  if (!vs.length) return;
  const xs = vs.map(v => v.x), lo = Math.min(...xs), hi = Math.max(...xs);
  const span = hi - lo + 220, room = BT.H - BT.mTop - (BT.mBotS || BT.mBot);
  const tz = clamp(Math.min((BT.W - (BT.mRightS || 0) - 30) / span, room / 230), .4, 1.05), tx = (lo + hi) / 2;
  const k = cut ? 1 : 1 - Math.exp(-dt * 4);
  BT.cam.x += (tx - BT.cam.x) * k; BT.cam.z += (tz - BT.cam.z) * k;
}

// ---------- drawing ----------
function drawSky(g) {
  const E2 = BT.env, W = BT.W, H = BT.H, gy = groundY();
  const gr = g.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, E2.sky[0]); gr.addColorStop(.6, E2.sky[1]); gr.addColorStop(1, E2.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E2.fx === "stars" || E2.key === "space") for (const [x, y, s] of E2.stars) { g.globalAlpha = .4 + .4 * Math.sin(BT.clock / 600 + x * 30); g.fillStyle = "#fff"; g.fillRect(x * W, y * gy, s, s); }
  g.globalAlpha = 1;
  // Namek has three suns
  if (E2.key === "namek" || E2.key === "frieza") for (const [x, y, s] of [[.2, .16, 16], [.72, .1, 11], [.88, .22, 8]]) { const sx = x * W - BT.cam.x * .02; g.fillStyle = "rgba(255,255,230,.35)"; g.beginPath(); g.arc(sx, y * gy, s * 2, 0, 7); g.fill(); g.fillStyle = "#fffbe0"; g.beginPath(); g.arc(sx, y * gy, s, 0, 7); g.fill(); }
  const layer = (cv, par, y0, h) => { if (!cv) return; const off = ((BT.cam.x * par) % BG_W + BG_W) % BG_W; for (let x = -off; x < W; x += BG_W) g.drawImage(cv, x, y0, BG_W, h); };
  layer(E2.farCv, .15, gy - 320 * .9, 320 * .9);
  layer(E2.nearCv, .4, gy - 240 * .75, 240 * .75);
  if (E2.ground) {
    const g2 = g.createLinearGradient(0, gy, 0, H); g2.addColorStop(0, E2.ground[0]); g2.addColorStop(1, E2.ground[1]);
    g.fillStyle = g2; g.fillRect(0, gy, W, H - gy);
    g.strokeStyle = shade(E2.ground[1], -.2); g.globalAlpha = .35; g.lineWidth = 2;
    const off = (BT.cam.x * BT.cam.z) % 90;
    for (let x = -off - 90; x < W + 90; x += 90) { g.beginPath(); g.moveTo(x, gy + 10); g.lineTo(x - 40, H); g.stroke(); }
    g.globalAlpha = 1;
  }
}
// an aura: flickering flame tongues around the figure
function drawAura(g, x, y, h, col, k) {
  if (k <= 0) return;
  const t = BT.clock / 1000;
  g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .55 * k;
  const gr = g.createRadialGradient(x, y - h * .5, h * .1, x, y - h * .45, h * .85); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - h * .45, h * .55, h * .78, 0, 0, Math.PI * 2); g.fill();
  g.globalAlpha = .45 * k; g.fillStyle = col;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * .28, fl = Math.sin(t * 13 + i * 2.1) * .5 + .5, len = h * (.45 + fl * .35);
    const bx = x + Math.cos(a) * h * .3, by = y - h * .35 + Math.sin(a) * h * .3;
    g.beginPath(); g.moveTo(bx - h * .08, by); g.quadraticCurveTo(bx + Math.cos(a) * len * .5, by + Math.sin(a) * len * .5, bx + Math.cos(a) * len, by + Math.sin(a) * len); g.quadraticCurveTo(bx + Math.cos(a) * len * .4 + h * .05, by + Math.sin(a) * len * .4, bx + h * .08, by); g.fill();
  }
  g.restore();
}
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
// the visual unit: smoothed position, pose bookkeeping and timers set by battle events
function addVU(u) {
  const vu = { uid: u.uid, u, team: u.team, x: u.x, alt: 0, shown: false, gone: false, face: u.team === "A" ? 1 : -1, alpha: 1, hitT: 0, guardT: 0, hitN: 0,
    aura: 0, auraCol: u.def.aura || "#f2f2ff", vanishT: 0, flash: 0, enterT: 0, koT: 0, ph: R() * 6, swing: 0, anchors: null };
  BT.vus.set(u.uid, vu);
  return vu;
}
const grounded = u => u.def.fig && (u.def.fig.body === "ape" || u.def.fig.body === "dino");
const figScale = () => BT.cam.z * (BT.H > BT.W * 1.3 ? 1.5 : 1.15);
function poseOf(vu) {
  const u = vu.u, a = u.act, T = BT.clock / 1000;
  if (u.status === "out") return { name: "ko", time: T, air: true };
  const air = !grounded(u);
  if (vu.hitT > 0) return { name: "hit", t: 1 - vu.hitT / 380, time: T, air };
  if (vu.guardT > 0) return { name: "guard", t: 1, time: T, air };
  if (u.stunT > 0) return { name: "hit", t: .3 + Math.sin(T * 6) * .1, time: T, air };
  if (!a) return { name: "idle", time: T, air, ph: vu.ph };
  const k = a.d ? clamp(a.t / a.d, 0, 1) : 0, kind = a.c.kind;
  if (a.ph === "move") return { name: a.c.to === "near" ? "dash" : "back", time: T, air: true };
  if (a.ph === "dash") return { name: "dash", time: T, air: true };
  if (a.ph === "charge") return { name: "charge", t: k, time: T, air };
  if (a.ph === "clash") return { name: "beam", t: 1, time: T, air };
  if (a.ph === "wind") {
    if (kind === "melee") return { name: a.c.kick ? "kick" : "punch", t: .15 * k, time: T, air, alt: 0 };
    if (kind === "ki") return { name: "blast", t: .05, time: T, air };
    if (kind === "beam" || kind === "swap") return { name: "beamWind", t: k, time: T, air };
    if (kind === "finger" || kind === "freeze") return { name: "fingerWind", t: k, time: T, air };
    if (kind === "bomb") return { name: "overhead", t: k, time: T, air };
    if (kind === "disc") return { name: "disc", t: k, time: T, air };
    if (kind === "flash") return { name: "flash", t: k, time: T, air };
    return { name: "charge", t: k, time: T, air };
  }
  // recovering: the follow-through of what was just fired
  if (kind === "melee") { const hits = a.c.hits || 1, per = a.d / Math.max(1, hits), i = Math.min(hits - 1, Math.floor(a.t / per)); return { name: a.c.kick || (i % 3 === 2 && hits > 2) ? "kick" : a.c.heavy && hits <= 2 ? "smash" : "punch", t: (a.t - i * per) / per, time: T, air, alt: i }; }
  if (kind === "ki") return { name: "blast", t: k, time: T, air, alt: Math.floor(a.t / .1) };
  if (kind === "beam" || kind === "swap") return { name: "beam", t: 1, time: T, air };
  if (kind === "finger" || kind === "freeze") return { name: "finger", t: 1, time: T, air };
  if (kind === "bomb") return { name: "overhead", t: k, throw: 1, time: T, air };
  if (kind === "disc") return { name: "disc", t: k, throw: 1, time: T, air };
  if (kind === "flash") return { name: "flash", t: 1, time: T, air };
  return { name: "victory", t: k, time: T, air };
}
function vuAnchor(vu) {
  const sc = figScale() * (vu.u.boss && !grounded(vu.u) ? 1.12 : 1) * (grounded(vu.u) ? .62 : 1), x = toSX(vu.x), y = groundY() - vu.alt * BT.cam.z;
  return { x, y, sc };
}
function drawVU(g, vu, dt) {
  if (!vu.shown || vu.gone) return;
  const u = vu.u, { x, y, sc } = vuAnchor(vu), f = u.def.fig, h = figTall(f) * sc;
  // shadow on the ground
  g.save(); g.globalAlpha = .25 * vu.alpha; g.fillStyle = "#000"; g.beginPath(); g.ellipse(x, groundY() + 2, 26 * sc * (f.bulk || 1), 6 * sc, 0, 0, Math.PI * 2); g.fill(); g.restore();
  const auraK = Math.max(vu.aura, u.act && (u.act.ph === "charge" || (u.act.ph === "wind" && !u.act.c.basic) || u.act.ph === "clash") ? 1 : 0, u.status === "field" && BT.B.has(u, "KAIOKEN") ? .8 : 0, f.hs === "ssj" ? .45 : 0);
  const auraCol = BT.B.has(u, "KAIOKEN") ? "#ff3a2a" : vu.auraCol;
  if (u.status !== "out") drawAura(g, x, y, h * 1.05, auraCol, auraK * vu.alpha);
  // afterimage when vanishing
  if (vu.vanishT > 0) { vu.alpha = clamp(Math.abs(vu.vanishT - 220) / 220, 0, 1); }
  else if (u.status !== "out") vu.alpha = Math.min(1, vu.alpha + dt / 200);
  const pose = poseOf(vu);
  g.save(); g.globalAlpha = vu.alpha; g.translate(x, y); g.scale(vu.face * sc, sc);
  if (vu.flash > 0) { g.filter = `brightness(${1 + vu.flash / 120})`; }
  vu.anchors = drawFigure(g, f, pose);
  g.restore();
  // the power gauge over the player's fighter while it winds up
  if (u.team === "A" && u.act && u.act.ph === "wind" && !u.act.noPow && !BT.B.auto) {
    const w = 46, bx = x - w / 2, by = y - h - 16;
    g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(bx - 2, by - 2, w + 4, 8);
    g.fillStyle = u.act.pow >= 1 ? "#ffd34d" : "#ff8a1a"; g.fillRect(bx, by, w * u.act.pow, 4);
  }
}
// incoming attacks on the player's fighter: a ring that closes at the moment of impact (tap GUARD as it closes)
function drawGuardRing(g) {
  const B = BT.B; if (!B || B.auto || B.phase !== "act") return;
  const inc = B.incoming(); if (!inc || UNGUARDABLE.has(inc.kind) && inc.kind !== "disc") return;
  const vu = BT.vus.get(inc.to.uid); if (!vu || !vu.shown) return;
  const left = inc.impactAt - B.t; if (left > GUARD_WIN + .5 || left < 0) return;
  const { x, y, sc } = vuAnchor(vu), cy = y - 50 * sc, r0 = 34 * sc, r = r0 + left * 120 * sc;
  const perfect = left <= PERFECT_WIN, ok = left <= GUARD_WIN;
  g.save(); g.lineWidth = 3;
  g.strokeStyle = inc.kind === "disc" ? "#ff5a5a" : perfect ? "#ffd34d" : ok ? "#7ad0ff" : "rgba(255,255,255,.6)";
  g.beginPath(); g.arc(x, cy, r, 0, Math.PI * 2); g.stroke();
  g.globalAlpha = .5; g.strokeStyle = "#ffffff"; g.setLineDash([4, 5]); g.beginPath(); g.arc(x, cy, r0, 0, Math.PI * 2); g.stroke();
  g.restore();
}
// ---------- shots: ki blasts, beams, discs, energy balls ----------
function handPos(vu, which = "handf") {
  const { x, y, sc } = vuAnchor(vu), A = vu.anchors;
  const p = A && (A.mouth || A[which] || A.hand) || [30, -60];
  return [x + p[0] * sc * vu.face, y + p[1] * sc];
}
function chestPos(vu) { const { x, y, sc } = vuAnchor(vu), A = vu.anchors, p = A && A.chest || [0, -55]; return [x + p[0] * sc * vu.face, y + p[1] * sc]; }
function addShot(s) { BT.shots.push({ t0: BT.clock, ...s }); }
function drawShots(g) {
  const B = BT.B;
  for (const s of BT.shots) {
    const from = BT.vus.get(s.from), to = BT.vus.get(s.to); if (!from || !to) { s.dead = 1; continue; }
    const atk = B.atks.find(a => a.id === s.atk), col = s.col;
    const p0 = handPos(from, s.kind === "bomb" || s.kind === "disc" ? "handf" : "handf"), p1 = chestPos(to);
    let k = atk ? clamp((B.t - atk.t0) / Math.max(.01, atk.impactAt - atk.t0), 0, 1) : 1;
    if (atk && atk.vanished) s.over = 1;
    const age = BT.clock - s.t0;
    if (s.kind === "ki" || s.kind === "freeze") {
      for (let i = 0; i < s.hits; i++) { const kk = clamp(k * 1.15 - i * .12, 0, 1); if (kk <= 0 || kk >= 1 && atk && atk.done) continue; const px = lerp(p0[0], p1[0], kk), py = lerp(p0[1], p1[1], kk) + Math.sin(i * 2) * 8 * BT.cam.z; glowBall(g, px, py, (s.kind === "freeze" ? 6 : 7 + s.pow * 4) * BT.cam.z, col); }
    } else if (s.kind === "beam" || s.kind === "swap") {
      const clash = B.struggle && (B.struggle.A.id === s.atk || B.struggle.E.id === s.atk);
      let end = k;
      if (clash) { const aV = BT.vus.get(B.struggle.A.from.uid), eV = BT.vus.get(B.struggle.E.from.uid); const pa = handPos(aV), pe = handPos(eV); const cx = lerp(pa[0], pe[0], B.struggle.pos), cy = lerp(pa[1], pe[1], B.struggle.pos);
        beamLine(g, p0[0], p0[1], cx, cy, (12 + s.pow * 6) * BT.cam.z, col); glowBall(g, cx, cy, (22 + Math.sin(BT.clock / 40) * 4) * BT.cam.z, "#ffffff"); s.clashed = 1; continue; }
      if (atk && atk.done) end = 1;
      const tail = atk && atk.done ? clamp((BT.clock - (s.doneAt || (s.doneAt = BT.clock))) / 300, 0, 1) : 0;
      const ex = lerp(p0[0], p1[0], end), ey = lerp(p0[1], p1[1], end), sx = lerp(p0[0], p1[0], tail), sy = lerp(p0[1], p1[1], tail);
      if (tail >= 1) { s.dead = 1; continue; }
      beamLine(g, sx, sy, ex, ey, (s.kind === "swap" ? 6 : 13 + s.pow * 7) * BT.cam.z * (1 - tail * .5), col);
      glowBall(g, ex, ey, (14 + s.pow * 6) * BT.cam.z, col);
    } else if (s.kind === "finger") {
      const tail = atk && atk.done ? clamp((BT.clock - (s.doneAt || (s.doneAt = BT.clock))) / 200, 0, 1) : 0;
      if (tail >= 1) { s.dead = 1; continue; }
      const ex = lerp(p0[0], p1[0], k), ey = lerp(p0[1], p1[1], k);
      beamLine(g, p0[0], p0[1], ex, ey, 4 * BT.cam.z, col);
      if (s.spiral) { g.save(); g.strokeStyle = col; g.lineWidth = 2; g.globalAlpha = .8; g.beginPath(); for (let t2 = 0; t2 <= 1; t2 += .02) { const px = lerp(p0[0], ex, t2), py = lerp(p0[1], ey, t2) + Math.sin(t2 * 40 + BT.clock / 30) * 7 * BT.cam.z; t2 ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore(); }
    } else if (s.kind === "disc") {
      for (let i = 0; i < s.hits; i++) { const kk = clamp(k - i * .15, 0, 1); const px = lerp(p0[0], p1[0], kk), py = lerp(p0[1], p1[1], kk) - Math.sin(kk * Math.PI) * 30 * BT.cam.z;
        g.save(); g.translate(px, py); g.rotate(BT.clock / 40); g.globalCompositeOperation = "lighter"; g.fillStyle = col; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, 22 * BT.cam.z, 6 * BT.cam.z, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, 0, 14 * BT.cam.z, 3 * BT.cam.z, 0, 0, 7); g.fill(); g.restore(); }
    } else if (s.kind === "bomb") {
      const r = (36 + s.pow * 20) * BT.cam.z, top = [handPos(from)[0], handPos(from)[1] - r * 1.1];
      const px = lerp(top[0], p1[0], k), py = lerp(top[1], p1[1], k);
      glowBall(g, px, py, r, col, shade(col, .6));
    }
    if (atk && atk.done && s.kind !== "beam" && s.kind !== "finger") s.dead = 1;
    if (age > 9000) s.dead = 1;
  }
  BT.shots = BT.shots.filter(s => !s.dead);
}
// the energy gathering over the head while a bomb winds up
function drawCharging(g) {
  for (const vu of BT.vus.values()) {
    const u = vu.u, a = u.act; if (!vu.shown || !a || a.ph !== "wind") continue;
    const k = clamp(a.t / a.d, 0, 1), col = u.def.kiCol || "#7ad0ff";
    if (a.c.kind === "bomb") { const p = handPos(vu); glowBall(g, p[0], p[1] - 40 * BT.cam.z * k, (8 + 40 * k) * BT.cam.z, col, shade(col, .6)); }
    else if (a.c.kind === "beam" || a.c.kind === "finger") { const p = handPos(vu); glowBall(g, p[0], p[1], (3 + 9 * k) * BT.cam.z, col); }
    else if (a.c.kind === "disc") { const p = handPos(vu); g.save(); g.translate(p[0], p[1] - 14 * BT.cam.z); g.fillStyle = col; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, 20 * BT.cam.z * k, 5 * BT.cam.z, 0, 0, 7); g.fill(); g.restore(); }
  }
}
// ---------- particles and floating text ----------
function sparks(x, y, col, n = 12, k = 1) {
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, v = (60 + R() * 260) * k; BT.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: 300 + R() * 300, col, s: 2 + R() * 3 }); }
}
function ringAt(x, y, col, max = 80, dur = 360) { BT.rings.push({ x, y, col, max, dur, t0: BT.clock }); }
function drawParts(g, dt) {
  const s = dt / 1000;
  for (const p of BT.parts) { p.t += dt; p.x += p.vx * s; p.y += p.vy * s; p.vy += 300 * s; g.globalAlpha = clamp(1 - p.t / p.life, 0, 1); g.fillStyle = p.col; g.fillRect(p.x, p.y, p.s, p.s); }
  g.globalAlpha = 1; BT.parts = BT.parts.filter(p => p.t < p.life);
  for (const r of BT.rings) { const k = (BT.clock - r.t0) / r.dur; if (k >= 1) { r.dead = 1; continue; } g.strokeStyle = r.col; g.globalAlpha = 1 - k; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(r.x, r.y, r.max * k * BT.cam.z, 0, Math.PI * 2); g.stroke(); }
  g.globalAlpha = 1; BT.rings = BT.rings.filter(r => !r.dead);
}
function floatText(uid, s, cls) {
  const vu = BT.vus.get(uid); if (!vu) return;
  const { x, y, sc } = vuAnchor(vu);
  const n = BT.floats.filter(f => BT.clock - f.t0 < 500 && f.uid === uid).length;
  const w = String(s).length * 7 + 20;
  BT.floats.push({ uid, s: String(s), cls, x: clamp(x + (R() - .5) * 20, w, BT.W - (BT.mRightS || 0) - w), y: Math.max(BT.mTop + 20, y - figTall(vu.u.def.fig) * sc - 10 - n * 18), t0: BT.clock });
}
const FLOAT_C = { dmg: "#ffffff", crit: "#ffd34d", heal: "#5dfc9b", buff: "#7ad0ff", debuff: "#ff7a7a", txt: "#e8edf7" };
function drawFloats(g) {
  for (const f of BT.floats) {
    const k = (BT.clock - f.t0) / 1100; if (k >= 1) { f.dead = 1; continue; }
    g.globalAlpha = k < .8 ? 1 : (1 - k) / .2;
    const big = f.cls === "crit" || f.cls === "dmg";
    g.font = `900 ${big ? 22 : 14}px "Russo One", Impact, sans-serif`; g.textAlign = "center";
    g.lineWidth = 4; g.strokeStyle = "rgba(0,0,0,.8)"; g.strokeText(f.s, f.x, f.y - k * 34); g.fillStyle = FLOAT_C[f.cls] || "#fff"; g.fillText(f.s, f.x, f.y - k * 34);
  }
  g.globalAlpha = 1; BT.floats = BT.floats.filter(f => !f.dead);
}
// weather of the place: dust, embers, lightning on a dying Namek
function weather(g) {
  const E2 = BT.env, t = BT.clock / 1000, W = BT.W, gy = groundY();
  if (E2.fx === "embers") { g.fillStyle = "#ffb04a"; for (let i = 0; i < 26; i++) { const x = ((i * 97 + t * 30 * (1 + i % 3)) % W), y = gy - ((i * 53 + t * 40) % gy); g.globalAlpha = .5; g.fillRect(x, y, 2, 2); } }
  if (E2.fx === "lightning" && Math.sin(t * 1.3) > .985) { g.fillStyle = "rgba(255,240,220,.25)"; g.fillRect(0, 0, W, BT.H); }
  if (E2.fx === "dust") { g.fillStyle = "#f2e2c8"; for (let i = 0; i < 14; i++) { const x = (i * 131 + t * 60) % W, y = gy - 10 - (i * 37) % 80; g.globalAlpha = .25; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }
  g.globalAlpha = 1;
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
  fitCam(dt / 1000);
  BT.shake = Math.max(0, BT.shake - dt * .03);
  const sx = (R() - .5) * BT.shake, sy = (R() - .5) * BT.shake;
  g.save(); g.translate(sx, sy);
  drawSky(g);
  weather(g);
  const list = [...BT.vus.values()].sort((a, b) => (a.u.status === "out") - (b.u.status === "out"));
  for (const vu of list) drawVU(g, vu, dt);
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
