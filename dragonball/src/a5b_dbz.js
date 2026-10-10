// =====================================================================
//  MENU ART — fighter cards (the fighter in a stance with an aura, on its style's colour), head icons, dialogue
//  portraits, the Dragon Balls and Shenron (the Summon screen and the title).
// =====================================================================
const ICON_BG = { Striker: ["#c8502a", "#5a1a0c", "#1a0604"], Blaster: ["#2a6ad8", "#0e2a5a", "#040a18"], Defender: ["#2a9a4a", "#0e3a1c", "#041208"],
  Tactician: ["#7a4ad8", "#2a1458", "#0c0618"], enemy: ["#5a5a6a", "#24242e", "#0c0c12"] };
const BART = {};
function artCanvas(W, H, bg) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  if (bg) { const gr = g.createRadialGradient(W * .55, H * .35, 4, W / 2, H / 2, W * .8); gr.addColorStop(0, bg[0]); gr.addColorStop(.6, bg[1]); gr.addColorStop(1, bg[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  return { cv, g };
}
// a static aura for menu art (the battle renderer animates its own)
function cardAura(g, x, y, h, col) {
  g.save(); g.globalCompositeOperation = "lighter";
  const gr = g.createRadialGradient(x, y - h * .5, h * .08, x, y - h * .45, h * .8); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = .55; g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - h * .45, h * .55, h * .75, 0, 0, Math.PI * 2); g.fill();
  g.globalAlpha = .35; g.fillStyle = col;
  for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i - 5) * .26, len = h * (.5 + (i * 37 % 10) / 30), bx = x + Math.cos(a) * h * .28, by = y - h * .38 + Math.sin(a) * h * .28;
    g.beginPath(); g.moveTo(bx - h * .07, by); g.quadraticCurveTo(bx + Math.cos(a) * len * .5, by + Math.sin(a) * len * .5, bx + Math.cos(a) * len, by + Math.sin(a) * len); g.quadraticCurveTo(bx + Math.cos(a) * len * .4 + h * .05, by + Math.sin(a) * len * .4, bx + h * .07, by); g.fill(); }
  g.restore();
}
// the card: speed lines, the aura, the fighter large
function fighterCard(id, d) {
  const k = id + "|card";
  if (!BART[k]) {
    const { cv, g } = artCanvas(360, 540), f = d.fig, tall = figTall(f), sc = Math.min(3.6, 430 / tall);
    g.save(); g.globalAlpha = .18; g.strokeStyle = d.aura || "#ffffff"; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; g.beginPath(); g.moveTo(180 + Math.cos(a) * 60, 270 + Math.sin(a) * 60); g.lineTo(180 + Math.cos(a) * 400, 270 + Math.sin(a) * 400); g.stroke(); }
    g.restore();
    cardAura(g, 170, 515, tall * sc, d.aura || "#f2f2ff");
    g.save(); g.translate(170, 515); g.scale(sc, sc); drawFigure(g, f, { name: f.villain || /Frieza|Ginyu|Force/.test(d.squad || "") ? "cross" : "idle", time: .6 }); g.restore();
    BART[k] = toURL(cv);
  }
  return BART[k];
}
function headIcon(id, d, bg) { return figHead(id + "|" + bg[0], d.fig, bg); }
function bladerArt(id, fig) { return figFull("b:" + id, fig).url; }
const enemyArt = key => { const d = ENEMY[key], id = "e:" + (d.op || key); return { get full() { return fighterCard(id, d); }, get head() { return headIcon(id, d, d.boss ? ICON_BG[d.el] : ICON_BG.enemy); }, get blader() { return bladerArt(id, d.fig); } }; };
const opArt = key => { const d = OPS[key], id = "o:" + key; return { get full() { return fighterCard(id, d); }, get head() { return headIcon(id, d, ICON_BG[d.el]); }, get blader() { return bladerArt(key, d.fig); } }; };

// ---------- Dragon Balls and Shenron ----------
function drawDragonBall(g, x, y, r, n, glow = 0) {
  if (glow) { g.save(); g.globalCompositeOperation = "lighter"; const gl = g.createRadialGradient(x, y, r * .5, x, y, r * 2.4); gl.addColorStop(0, `rgba(255,190,60,${.5 * glow})`); gl.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 2.4, 0, 7); g.fill(); g.restore(); }
  const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); gr.addColorStop(0, "#fff2c0"); gr.addColorStop(.3, "#ffb02a"); gr.addColorStop(1, "#c85a08");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  const pts = { 1: [[0, 0]], 2: [[-.22, -.18], [.22, .18]], 3: [[0, -.28], [-.26, .18], [.26, .18]], 4: [[-.22, -.22], [.22, -.22], [-.22, .22], [.22, .22]], 5: [[0, -.32], [-.3, -.04], [.3, -.04], [-.2, .3], [.2, .3]],
    6: [[0, -.36], [-.28, -.14], [.28, -.14], [-.28, .18], [.28, .18], [0, .38]], 7: [[0, 0], [0, -.38], [-.32, -.2], [.32, -.2], [-.32, .2], [.32, .2], [0, .38]] }[n] || [[0, 0]];
  g.fillStyle = "#d8202a";
  for (const [px, py] of pts) { const sx = x + px * r, sy = y + py * r, rr = r * (n > 4 ? .13 : .17); g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? rr * .45 : rr; k ? g.lineTo(sx + Math.cos(a) * q, sy + Math.sin(a) * q) : g.moveTo(sx + Math.cos(a) * q, sy + Math.sin(a) * q); } g.fill(); }
  g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.ellipse(x - r * .35, y - r * .45, r * .28, r * .16, -.5, 0, Math.PI * 2); g.fill();
}
// Shenron, the Eternal Dragon: a long green body coiling up through the sky, the head at the top
function drawShenron(g, cx, cy, s, T = 0, alpha = 1) {
  g.save(); g.globalAlpha = alpha; g.translate(cx, cy); g.scale(s, s);
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 3.2 + T * .4; pts.push([Math.sin(a) * (120 - t * 70) + Math.sin(T + t * 6) * 6, 230 - t * 420]); }
  const body = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
  body(40, "#0e3a14"); body(34, "#2aa83a"); body(14, "#e8d870");
  // belly scales
  g.strokeStyle = "#a89a3a"; g.lineWidth = 1.5;
  for (let i = 2; i < 58; i += 2) { const p = pts[i], q = pts[i + 1]; const a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2; g.beginPath(); g.moveTo(p[0] - Math.cos(a) * 6, p[1] - Math.sin(a) * 6); g.lineTo(p[0] + Math.cos(a) * 6, p[1] + Math.sin(a) * 6); g.stroke(); }
  // head
  const h = pts[60];
  g.save(); g.translate(h[0], h[1] - 10);
  g.fillStyle = "#2aa83a"; g.strokeStyle = "#0e3a14"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-34, 10); g.quadraticCurveTo(-30, -28, 6, -30); g.quadraticCurveTo(44, -26, 60, -6); g.quadraticCurveTo(64, 8, 50, 16); g.quadraticCurveTo(10, 30, -34, 10); g.closePath(); g.stroke(); g.fill();
  g.fillStyle = "#e8d870"; g.beginPath(); g.moveTo(-10, 16); g.quadraticCurveTo(26, 30, 56, 14); g.quadraticCurveTo(30, 22, -6, 10); g.fill();
  // horns, whiskers, red eyes
  g.strokeStyle = "#e8dcc0"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-14, -22); g.quadraticCurveTo(-40, -60, -70, -62); g.moveTo(0, -26); g.quadraticCurveTo(-20, -66, -48, -76); g.stroke();
  g.strokeStyle = "#2a8a3a"; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(54, 6); g.quadraticCurveTo(90, -10 + Math.sin(T * 2) * 8, 120, 20); g.moveTo(50, 12); g.quadraticCurveTo(84, 30, 110, 54 + Math.sin(T * 2 + 1) * 8); g.stroke();
  g.fillStyle = "#ff2a2a"; g.beginPath(); g.ellipse(22, -12, 7, 5, -.2, 0, 7); g.fill(); g.fillStyle = "#ffe0a0"; g.beginPath(); g.arc(23, -13, 2, 0, 7); g.fill();
  g.restore();
  g.restore();
}
