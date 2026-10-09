
// =====================================================================
//  BEYBLADES AND BIT-BEASTS — procedural drawing on canvas.
//  drawBey: a spinning top seen from the side and above (Attack Ring, Weight Disk, Blade Base, Bit-Chip),
//    local space: tip at (0,0), about 80 units across and 46 tall.
//  drawBeast: a glowing Bit-Beast spirit (dragon, phoenix, tiger, turtle, wolf…), local space centred,
//    about 220 units tall.
// =====================================================================

// A Beyblade's look: { ring, ring2, disk, base, tip, wings (attack ring points), shape, chip (Bit-Chip colour) }
//  shape: "wing" (swept blades), "spike" (sharp points), "round" (defence ring), "claw" (hooked), "flat" (balance)
const BEY_SHAPES = {
  wing:  { n: 3, depth: .34, sweep: .55, sharp: .5 },
  spike: { n: 4, depth: .3, sweep: .1, sharp: .9 },
  claw:  { n: 3, depth: .4, sweep: .8, sharp: .7 },
  round: { n: 6, depth: .12, sweep: .2, sharp: .1 },
  flat:  { n: 4, depth: .18, sweep: .3, sharp: .35 },
  saw:   { n: 8, depth: .14, sweep: .6, sharp: .8 },
};
// radius of the Attack Ring at angle a: a base circle with n swept protrusions
function ringRadius(sh, a, R) {
  const k = sh.n, ph = ((a * k / (Math.PI * 2)) % 1 + 1) % 1;
  // a sawtooth that rises slowly and drops sharply (swept blades), softened by `sharp`
  const rise = ph < 1 - sh.sweep * .5 ? ph / (1 - sh.sweep * .5) : (1 - ph) / (sh.sweep * .5 + .0001);
  const v = Math.pow(clamp(rise, 0, 1), 1 + sh.sharp * 2);
  return R * (1 - sh.depth + sh.depth * v);
}
// e: how flat the discs look (1 = straight down, ~0.2 = nearly side-on). spin: ring angle. tilt: lean (radians).
function drawBey(g, b, o = {}) {
  const e = clamp(o.e ?? .42, .16, 1), spin = o.spin || 0, tilt = o.tilt || 0, blur = o.blur ?? .8, glow = o.glow || 0;
  const sh = BEY_SHAPES[b.shape] || BEY_SHAPES.wing, R = b.r || 40;
  g.save();
  g.rotate(tilt);
  const out = { top: [0, -46], chest: [0, -24], head: [0, -30], tip: [0, -20], hand: [0, -24], w: R * 2 };
  // ---- tip + blade base (a cone flaring into a wide base) ----
  const tipC = b.tip || "#d8dce6", baseC = b.base || "#3a3f4a";
  const tg = g.createLinearGradient(-14, 0, 14, 0); tg.addColorStop(0, shade(tipC, -.45)); tg.addColorStop(.5, tipC); tg.addColorStop(1, shade(tipC, -.3));
  g.fillStyle = tg; g.beginPath(); g.moveTo(-2.5, 0); g.lineTo(2.5, 0); g.lineTo(9, -8); g.lineTo(-9, -8); g.closePath(); g.fill();
  const yB = -12, rB = R * .66;
  disc(g, 0, yB, rB, e, 7, baseC, shade(baseC, -.45));
  // ---- weight disk (metal) ----
  const yW = -20, rW = R * .84, dc = b.disk || "#9aa4b8";
  disc(g, 0, yW, rW, e, 4, dc, shade(dc, -.5), true);
  // ---- attack ring ----
  const yA = -25, ring = b.ring || "#3a7bd5", ring2 = b.ring2 || shade(ring, .35);
  const pts = [], N = 72;
  for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; const r = ringRadius(sh, a + spin, R); pts.push([Math.cos(a) * r, Math.sin(a) * r * e]); }
  // side band: the near half of the ring, pushed down by its thickness
  const thick = 6;
  g.fillStyle = shade(ring, -.45);
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, yA + y + thick) : g.moveTo(x, yA + y + thick)); g.closePath(); g.fill();
  for (let k = 0; k < N; k++) { const [x, y] = pts[k], [x2, y2] = pts[(k + 1) % N]; if (y < 0 && y2 < 0) continue;
    g.fillStyle = shade(ring, -.25 - .2 * Math.abs(x) / R); g.beginPath(); g.moveTo(x, yA + y); g.lineTo(x2, yA + y2); g.lineTo(x2, yA + y2 + thick); g.lineTo(x, yA + y + thick); g.closePath(); g.fill(); }
  // top face
  const rg = g.createRadialGradient(-R * .3, yA - R * e * .4, 2, 0, yA, R);
  rg.addColorStop(0, shade(ring, .45)); rg.addColorStop(.5, ring); rg.addColorStop(1, shade(ring, -.25));
  g.fillStyle = rg; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, yA + y) : g.moveTo(x, yA + y)); g.closePath(); g.fill();
  // blade ridges in the secondary colour
  g.strokeStyle = ring2; g.lineWidth = 2.2; g.lineCap = "round";
  for (let k = 0; k < sh.n; k++) {
    const a = spin * -1 + k / sh.n * Math.PI * 2 + .35, r0 = R * .42, r1 = R * (1 - sh.depth * .25);
    g.beginPath(); g.moveTo(Math.cos(a) * r0, yA + Math.sin(a) * r0 * e); g.lineTo(Math.cos(a + sh.sweep * .5) * r1, yA + Math.sin(a + sh.sweep * .5) * r1 * e); g.stroke();
  }
  // motion blur: a translucent halo of the ring's colour, stronger the faster it spins
  if (blur > .05) {
    g.save(); g.globalAlpha = blur * .55;
    const bg2 = g.createRadialGradient(0, yA, R * .55, 0, yA, R * 1.06);
    bg2.addColorStop(0, ring + "00"); bg2.addColorStop(.75, ring + "aa"); bg2.addColorStop(1, ring + "00");
    g.fillStyle = bg2; g.beginPath(); g.ellipse(0, yA, R * 1.06, R * 1.06 * e, 0, 0, 7); g.fill();
    g.globalAlpha = blur * .7; g.strokeStyle = "#ffffff"; g.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { const a0 = spin * 1.3 + k * 2.1; g.beginPath(); g.ellipse(0, yA, R * (.78 + k * .07), R * (.78 + k * .07) * e, 0, a0, a0 + .9); g.stroke(); }
    g.restore();
  }
  // ---- Bit-Chip: the Bit-Beast's seal in the centre ----
  const yC = yA - 3, rc = R * .3, cc = b.chip || "#5fd4ff";
  disc(g, 0, yC, rc, e, 3, "#20242c", "#101216");
  const cg = g.createRadialGradient(-rc * .3, yC - rc * e * .3, 1, 0, yC, rc * .82);
  cg.addColorStop(0, shade(cc, .55)); cg.addColorStop(.6, cc); cg.addColorStop(1, shade(cc, -.4));
  g.fillStyle = cg; g.beginPath(); g.ellipse(0, yC, rc * .82, rc * .82 * e, 0, 0, 7); g.fill();
  if (b.kind) { g.save(); g.translate(0, yC); g.scale(rc * .0052, rc * .0052 * Math.max(e, .35)); g.globalAlpha = .9; drawBeastGlyph(g, b.kind, "#ffffff"); g.restore(); }
  if (glow > 0) {
    g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = glow;
    const gl = g.createRadialGradient(0, yC, 1, 0, yC, R * 1.3); gl.addColorStop(0, cc); gl.addColorStop(1, cc + "00");
    g.fillStyle = gl; g.beginPath(); g.ellipse(0, yC, R * 1.3, R * 1.3 * Math.max(e, .5), 0, 0, 7); g.fill(); g.restore();
  }
  // specular glint
  g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(-R * .35, yA - R * e * .45, R * .18, R * .05, -.3, 0, 7); g.fill();
  g.restore();
  return out;
}
// a disc of radius r at height y, seen with flatness e, with a side band `h` tall
function disc(g, x, y, r, e, h, top, side, metal) {
  g.fillStyle = side; g.beginPath(); g.ellipse(x, y + h, r, r * e, 0, 0, Math.PI); g.lineTo(x - r, y); g.ellipse(x, y, r, r * e, 0, Math.PI, 0, true); g.closePath(); g.fill();
  if (metal) { const mg = g.createLinearGradient(x - r, 0, x + r, 0); mg.addColorStop(0, shade(top, -.35)); mg.addColorStop(.35, shade(top, .4)); mg.addColorStop(.6, top); mg.addColorStop(1, shade(top, -.3)); g.fillStyle = mg; }
  else g.fillStyle = top;
  g.beginPath(); g.ellipse(x, y, r, r * e, 0, 0, 7); g.fill();
}

// ---------- Bit-Beasts ----------
// Kinds: dragon, bird, cat, wolf, turtle, serpent, fish, horned, ape, horse, lizard, humanoid
// Drawn as glowing spirits: a body path filled with a vertical gradient, additive glow, bright eyes.
function beastPaint(g, col, fn, alpha = 1) {
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const [w, a] of [[16, .12], [8, .2]]) { g.globalAlpha = a * alpha; g.strokeStyle = col; g.lineWidth = w; g.lineJoin = "round"; g.lineCap = "round"; g.beginPath(); fn(); g.stroke(); }
  g.restore();
  g.save(); g.globalAlpha = .82 * alpha;
  const gr = g.createLinearGradient(0, -120, 0, 120); gr.addColorStop(0, shade(col, .55)); gr.addColorStop(.5, col); gr.addColorStop(1, shade(col, -.35));
  g.fillStyle = gr; g.beginPath(); fn(); g.fill();
  g.globalAlpha = .9 * alpha; g.strokeStyle = shade(col, .7); g.lineWidth = 1.6; g.stroke();
  g.restore();
}
const eyeGlow = (g, x, y, r = 4) => { g.save(); g.globalCompositeOperation = "lighter"; circ(g, x, y, r * 2.4, "rgba(255,255,255,.25)"); circ(g, x, y, r, "#ffffff"); g.restore(); };
function drawBeast(g, kind, col, T = 0, alpha = 1) {
  const sw = Math.sin(T * 2.2), sw2 = Math.sin(T * 3.1 + 1);
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  const P = (pts, close = true) => () => { g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) { const p = pts[k]; if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]); else g.lineTo(p[0], p[1]); } if (close) g.closePath(); };
  switch (kind) {
    case "dragon": {
      // a long serpentine body coiling up through the frame, mane down the back, horned head on top
      const body = [];
      for (let k = 0; k <= 40; k++) { const t = k / 40, y = 120 - t * 220, x = Math.sin(t * 6.2 + T * 1.6) * (60 - t * 30); body.push([x, y, 6 + 18 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (t < .9 ? 1 : 1 - (t - .9) * 6)]); }
      const left = body.map(([x, y, w]) => [x - w, y]), right = body.map(([x, y, w]) => [x + w, y]).reverse();
      beastPaint(g, col, P([...left, ...right]), alpha);
      // spines
      beastPaint(g, col, () => { for (let k = 4; k < 36; k += 3) { const [x, y, w] = body[k]; g.moveTo(x - w * .4, y); g.lineTo(x - w - 12, y - 6); g.lineTo(x - w * .2, y - 8); } }, alpha);
      // head
      const [hx, hy] = body[40];
      g.save(); g.translate(hx, hy - 6);
      beastPaint(g, col, P([[-22, 6], [-16, -14], [0, -20], [26, -12], [44, -4], [46, 4, 30, 8], [22, 10], [30, 18], [10, 20], [-14, 16]]), alpha);
      beastPaint(g, col, P([[-10, -16], [-28, -46], [-6, -22]]), alpha);
      beastPaint(g, col, P([[4, -18], [-4, -52], [14, -20]]), alpha);
      g.strokeStyle = shade(col, .6); g.lineWidth = 2; g.globalAlpha = .8 * alpha;
      g.beginPath(); g.moveTo(40, 2); g.quadraticCurveTo(70, 10 + sw * 8, 84, -6); g.moveTo(36, 8); g.quadraticCurveTo(60, 30 + sw2 * 8, 80, 26); g.stroke();
      g.globalAlpha = 1; eyeGlow(g, 14, -8, 3.5);
      g.restore();
      // claws reaching forward
      for (const k of [14, 26]) { const [x, y, w] = body[k]; beastPaint(g, col, P([[x + w, y], [x + w + 26, y - 10], [x + w + 34, y - 2], [x + w + 22, y + 6]]), alpha); }
      break;
    }
    case "bird": {
      // wings raised in a V, crested head, long flowing tail plumes
      const f = sw * 10;
      beastPaint(g, col, P([[0, -40], [-30, -60 - f], [-90, -120 - f], [-150, -110 - f], [-118, -90 - f, -160, -70 - f], [-120, -60], [-150, -36], [-100, -32], [-120, -10], [-60, -8], [-20, 10]]), alpha);
      beastPaint(g, col, P([[0, -40], [30, -60 - f], [90, -120 - f], [150, -110 - f], [118, -90 - f, 160, -70 - f], [120, -60], [150, -36], [100, -32], [120, -10], [60, -8], [20, 10]]), alpha);
      beastPaint(g, col, P([[0, -64], [-18, -34], [-14, 20], [0, 40], [14, 20], [18, -34]]), alpha);
      // tail plumes
      for (const [dx, k] of [[-30, -1], [0, 0], [30, 1]]) beastPaint(g, col, P([[-6, 30], [dx * .6 + sw2 * 8, 80], [dx + sw2 * 14, 128], [dx * 1.4 + 6, 110, 6, 30]]), alpha * .9);
      // head and crest
      g.save(); g.translate(0, -78);
      beastPaint(g, col, P([[-12, 6], [-10, -12], [4, -18], [16, -8], [34, -4], [16, 2], [10, 14]]), alpha);
      beastPaint(g, col, P([[-4, -16], [-24, -48], [-6, -30], [-2, -54], [4, -22]]), alpha);
      eyeGlow(g, 6, -8, 3); g.restore();
      break;
    }
    case "cat": case "wolf": case "horned": case "lizard": {
      // a quadruped in mid-leap: body, four legs, tail, head (ears, horns or a long snout by kind)
      const lizard = kind === "lizard", y0 = lizard ? 30 : 0, len = lizard ? 1.15 : 1;
      beastPaint(g, col, P([[-80 * len, -20 + y0], [-40, -50 + y0], [30, -54 + y0], [80, -34 + y0], [86, -2 + y0], [40, 10 + y0], [-40, 12 + y0], [-86 * len, 0 + y0]]), alpha);
      const legs = lizard ? [[-56, 8, -70, 52], [-20, 10, -10, 56], [30, 6, 46, 50], [64, 2, 90, 44]] : [[-60, 4, -100, 70], [-30, 10, -40, 92], [40, 4, 70, 86], [66, -4, 116, 54]];
      for (const [x0, yy, x1, y1] of legs) beastPaint(g, col, P([[x0 - 9, yy + y0], [x1 - 6 + sw * 4, y1 + y0], [x1 + 8 + sw * 4, y1 + y0 + 2], [x0 + 11, yy + y0]]), alpha);
      // tail
      if (kind === "wolf") beastPaint(g, col, P([[-80, -14], [-130, -40 + sw * 6], [-170, -28 + sw * 10], [-128, -8], [-82, 4]]), alpha);
      else if (lizard) beastPaint(g, col, P([[-90, 6 + y0], [-150, 20 + y0 + sw * 8], [-196, 4 + y0 + sw * 14], [-150, 32 + y0], [-86, 22 + y0]]), alpha);
      else beastPaint(g, col, P([[-80, -16], [-120, -60 + sw * 10], [-140, -110 + sw * 14], [-124, -104, -110, -54], [-78, -2]]), alpha);
      // head
      g.save(); g.translate(92, -46 + y0);
      if (kind === "wolf") {
        beastPaint(g, col, P([[-22, 14], [-20, -14], [-6, -24], [20, -16], [56, -2], [52, 8], [20, 12], [6, 26]]), alpha);
        beastPaint(g, col, P([[-14, -16], [-12, -50], [2, -22]]), alpha); beastPaint(g, col, P([[-2, -20], [8, -52], [14, -18]]), alpha);
        eyeGlow(g, 14, -8, 3);
      } else if (kind === "horned") {
        beastPaint(g, col, P([[-24, 16], [-22, -14], [0, -24], [30, -10], [40, 14], [10, 26]]), alpha);
        beastPaint(g, col, P([[-8, -20], [-30, -52], [-16, -64], [-2, -26]]), alpha); beastPaint(g, col, P([[10, -20], [20, -60], [34, -64], [22, -18]]), alpha);
        eyeGlow(g, 12, -4, 3);
      } else if (lizard) {
        beastPaint(g, col, P([[-20, 12], [-16, -10], [10, -16], [64, -6], [70, 6], [40, 10], [62, 18], [10, 20]]), alpha);
        eyeGlow(g, 10, -6, 3);
      } else {
        beastPaint(g, col, P([[-26, 16], [-24, -14], [-6, -28], [22, -22], [44, -4], [40, 14], [16, 26]]), alpha);
        beastPaint(g, col, P([[-16, -20], [-22, -48], [-2, -26]]), alpha); beastPaint(g, col, P([[4, -26], [12, -52], [20, -22]]), alpha);
        // fangs
        beastPaint(g, col, P([[24, 12], [28, 34], [32, 12]]), alpha);
        eyeGlow(g, 16, -10, 3.4);
      }
      g.restore();
      // tiger stripes / lion mane
      if (kind === "cat") { g.save(); g.globalAlpha = .55 * alpha; g.strokeStyle = shade(col, -.55); g.lineWidth = 6;
        for (let k = 0; k < 5; k++) { const x = -40 + k * 22; g.beginPath(); g.moveTo(x, -52); g.quadraticCurveTo(x + 8, -30, x - 2, -10); g.stroke(); } g.restore(); }
      break;
    }
    case "turtle": {
      // a great domed shell with a hex pattern, head and flippers
      beastPaint(g, col, P([[-120, 20], [-110, -40, -40, -76], [0, -84], [40, -76, 110, -40], [120, 20]]), alpha);
      for (const [x, y, a] of [[-100, 26, -.4], [90, 26, .4], [-70, 40, -.1], [64, 40, .1]]) beastPaint(g, col, P([[x - 14, y - 10], [x + Math.sin(a) * 50 - 10, y + 40 + sw * 6], [x + Math.sin(a) * 50 + 14, y + 42 + sw * 6], [x + 16, y - 6]]), alpha);
      g.save(); g.translate(132, -6); beastPaint(g, col, P([[-24, 12], [-18, -14], [10, -22], [38, -8], [34, 10], [8, 18]]), alpha); eyeGlow(g, 14, -6, 3.2); g.restore();
      g.save(); g.globalAlpha = .55 * alpha; g.strokeStyle = shade(col, .7); g.lineWidth = 2.2;
      for (let r = 0; r < 3; r++) for (let c = -2 + (r % 2) * .5; c <= 2; c++) { const x = c * 40, y = -56 + r * 26; g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2; g.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 10); } g.stroke(); }
      g.restore();
      break;
    }
    case "serpent": {
      // a coiled body with the head raised high, hood flared
      const pts = [];
      for (let k = 0; k <= 48; k++) { const t = k / 48, a = t * Math.PI * 3.2 + T, r = 90 * (1 - t * .55), y = 90 - t * 200; pts.push([Math.cos(a) * r * (t < .75 ? 1 : (1 - t) * 4), y, 10 + 14 * (1 - t * .6)]); }
      beastPaint(g, col, P([...pts.map(([x, y, w]) => [x - w, y]), ...pts.map(([x, y, w]) => [x + w, y]).reverse()]), alpha);
      const [hx, hy] = pts[48];
      g.save(); g.translate(hx, hy - 10);
      beastPaint(g, col, P([[-40, 20], [-30, -20], [0, -34], [30, -20], [40, 20], [12, 30], [0, 40], [-12, 30]]), alpha);
      beastPaint(g, col, P([[-6, 30], [-4, 52], [0, 34], [4, 52], [6, 30]]), alpha);
      eyeGlow(g, -10, -6, 3.2); eyeGlow(g, 10, -6, 3.2); g.restore();
      break;
    }
    case "fish": {
      // a shark or whale breaching: big body, fins, tail fluke
      beastPaint(g, col, P([[-150, 0], [-90, -50], [20, -64], [120, -30], [160, 4], [110, 30], [0, 44], [-110, 26]]), alpha);
      beastPaint(g, col, P([[-10, -60], [10, -120 + sw * 6], [50, -54]]), alpha);
      beastPaint(g, col, P([[-150, 0], [-196, -50 + sw * 10], [-180, 0], [-200, 46 + sw * 10]]), alpha);
      beastPaint(g, col, P([[30, 30], [10, 80 + sw2 * 8], [60, 34]]), alpha);
      g.save(); g.globalAlpha = .7 * alpha; g.strokeStyle = shade(col, .7); g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(84 - k * 10, -18); g.lineTo(78 - k * 10, 8); g.stroke(); } g.restore();
      eyeGlow(g, 120, -10, 3.4);
      break;
    }
    case "ape": {
      // a hulking biped, arms raised over its head
      beastPaint(g, col, P([[-60, -60], [-30, -90], [30, -90], [60, -60], [64, 20], [40, 40], [-40, 40], [-64, 20]]), alpha);
      for (const s of [-1, 1]) beastPaint(g, col, P([[s * 50, -70], [s * 110, -120 + sw * s * 6], [s * 130, -150 + sw * s * 6], [s * 140, -118], [s * 80, -50]]), alpha);
      for (const s of [-1, 1]) beastPaint(g, col, P([[s * 20, 30], [s * 40, 110], [s * 70, 112], [s * 50, 28]]), alpha);
      g.save(); g.translate(0, -112); beastPaint(g, col, P([[-30, 20], [-34, -12], [0, -30], [34, -12], [30, 20], [0, 30]]), alpha); eyeGlow(g, -11, -4, 3); eyeGlow(g, 11, -4, 3); g.restore();
      break;
    }
    case "horse": {
      // a rearing horse with a horn and wings (unicorn / pegasus)
      beastPaint(g, col, P([[-90, 0], [-40, -40], [40, -60], [70, -90], [96, -70], [70, -20], [40, 20], [-60, 24]]), alpha);
      for (const [x0, y0, x1, y1] of [[-70, 14, -90, 100], [-40, 18, -30, 104], [40, 10, 80, -10], [56, -4, 100, -30]]) beastPaint(g, col, P([[x0 - 8, y0], [x1 - 6, y1], [x1 + 8, y1], [x0 + 10, y0]]), alpha);
      beastPaint(g, col, P([[-20, -40], [-60, -120 - sw * 10], [-120, -150 - sw * 10], [-80, -100], [-110, -80], [-50, -50]]), alpha * .9);
      g.save(); g.translate(88, -96); beastPaint(g, col, P([[-16, 20], [-14, -10], [10, -20], [44, -2], [40, 12], [10, 16]]), alpha);
      beastPaint(g, col, P([[0, -16], [16, -64], [10, -14]]), alpha); eyeGlow(g, 12, -6, 3); g.restore();
      beastPaint(g, col, P([[-90, 0], [-150, 20 + sw * 10], [-170, 60 + sw * 10], [-120, 30], [-86, 18]]), alpha);
      break;
    }
    case "god": case "gargoyle": case "humanoid": default: {
      // god: a towering divine figure with a halo and spread wings (Zeus, Apollon, Venus…); gargoyle: wings and horns;
      // humanoid: a broad, wingless giant (Gigars, Sarcophalon, Metal Driger)
      const wings = kind === "god" || kind === "gargoyle", giant = kind === "humanoid";
      if (wings) {
        beastPaint(g, col, P([[-100, -40], [-170, -110 - sw * 8], [-140, -20], [-170, 20], [-60, 0]]), alpha * .8);
        beastPaint(g, col, P([[100, -40], [170, -110 - sw * 8], [140, -20], [170, 20], [60, 0]]), alpha * .8);
      }
      const W2 = giant ? 1.3 : 1;
      beastPaint(g, col, P([[-40 * W2, -70], [40 * W2, -70], [56 * W2, 0], [70, 120], [-70, 120], [-56 * W2, 0]]), alpha);
      for (const s of [-1, 1]) beastPaint(g, col, P([[s * 36 * W2, -66], [s * 80 * W2, -20 + sw * s * 4], [s * 90 * W2, 20 + (giant ? 30 : 0)], [s * 70 * W2, 24 + (giant ? 30 : 0)], [s * 52 * W2, -20]]), alpha);
      g.save(); g.translate(0, -100); beastPaint(g, col, P([[-20, 24], [-24, -6], [0, -26], [24, -6], [20, 24]]), alpha);
      if (kind === "god") { g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = shade(col, .7); g.lineWidth = 5; g.globalAlpha = .8 * alpha; g.beginPath(); g.ellipse(0, -18, 34, 10, 0, 0, 7); g.stroke(); g.restore(); }
      if (kind === "gargoyle") for (const s of [-1, 1]) beastPaint(g, col, P([[s * 10, -18], [s * 30, -50], [s * 20, -14]]), alpha);
      eyeGlow(g, -8, -2, 2.6); eyeGlow(g, 8, -2, 2.6); g.restore();
      break;
    }
  }
  g.restore();
}
// a tiny emblem of the Bit-Beast for the Bit-Chip (the same shapes, without the glow)
function drawBeastGlyph(g, kind, col) {
  g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 14; g.lineCap = "round"; g.lineJoin = "round";
  const path = pts => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
  switch (kind) {
    case "dragon": g.beginPath(); g.moveTo(-90, 70); g.bezierCurveTo(-120, -10, 40, 40, 20, -30); g.bezierCurveTo(10, -70, 60, -80, 80, -60); g.stroke(); path([[60, -84], [100, -60], [70, -40]]); break;
    case "bird": path([[0, -30], [-110, -90], [-60, -20], [-100, 20], [0, 0], [100, 20], [60, -20], [110, -90]]); path([[-10, 0], [0, 90], [10, 0]]); break;
    case "turtle": g.beginPath(); g.ellipse(0, 0, 90, 60, 0, Math.PI, 0); g.fill(); path([[80, -10], [120, -20], [110, 10]]); break;
    case "fish": path([[-100, 0], [0, -50], [90, 0], [0, 40]]); path([[-100, 0], [-140, -40], [-130, 40]]); break;
    case "serpent": g.beginPath(); g.moveTo(-80, 80); g.bezierCurveTo(-80, -20, 80, 60, 40, -40); g.stroke(); circ(g, 40, -50, 26, col); break;
    case "god": case "gargoyle": case "humanoid": circ(g, 0, -60, 26, col); path([[-40, -30], [40, -30], [50, 80], [-50, 80]]); path([[-40, -30], [-120, -70], [-70, 0]]); path([[40, -30], [120, -70], [70, 0]]); break;
    case "ape": circ(g, 0, -60, 30, col); path([[-50, -30], [50, -30], [60, 60], [-60, 60]]); break;
    case "horse": path([[-80, 40], [-20, -20], [40, -40], [70, -90], [90, -60], [50, 20], [-70, 60]]); path([[60, -84], [74, -130], [72, -80]]); break;
    default: path([[-90, 20], [-40, -40], [50, -50], [90, -20], [80, 20], [-60, 40]]); path([[50, -50], [70, -90], [80, -40]]); break;
  }
  g.restore();
}

// ---------- art for menus: cards, Beyblade icons, Blader portraits, Bit-Beast cut-ins ----------
// d is a unit or opponent definition: { fig (the Blader), bey (look), beast {kind, col} or null, el (type) }
const ICON_BG = { Attack: ["#8a2a22", "#3a100c", "#140504"], Defense: ["#1e4a8a", "#0e2244", "#040a16"], Endurance: ["#7a6a1a", "#3a320a", "#141004"],
  Balance: ["#4a2a7a", "#1e1238", "#0a0614"], enemy: ["#4a4a5a", "#22222c", "#0c0c12"] };
const BART = {};
function artCanvas(W, H, bg) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  if (bg) { const gr = g.createRadialGradient(W * .55, H * .35, 4, W / 2, H / 2, W * .8); gr.addColorStop(0, bg[0]); gr.addColorStop(.6, bg[1]); gr.addColorStop(1, bg[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  return { cv, g };
}
// the Beyblade close up, from slightly above, on its type's colour
function beyIcon(id, d, bg) {
  const k = id + "|icon|" + bg[0];
  if (!BART[k]) {
    const { cv, g } = artCanvas(128, 128, bg);
    g.save(); g.translate(64, 96); g.scale(1.25, 1.25); drawBey(g, d.bey, { e: .62, spin: hash(id) % 7, blur: .25 }); g.restore();
    BART[k] = toURL(cv);
  }
  return BART[k];
}
// the card: the Bit-Beast's glow behind, the Blader with a launcher, and the Beyblade large in front
function beyCard(id, d) {
  const k = id + "|card";
  if (!BART[k]) {
    const { cv, g } = artCanvas(360, 540);
    if (d.beast && d.beast.kind) { g.save(); g.translate(190, 210); g.scale(1.05, 1.05); drawBeast(g, d.beast.kind, d.beast.col, .4, .55); g.restore(); }
    g.save(); g.translate(150, 470); g.scale(3.1, 3.1); drawFigure(g, d.fig, { name: "idle", time: .6 }); g.restore();
    g.save(); g.translate(250, 520); g.scale(1.9, 1.9); drawBey(g, d.bey, { e: .5, spin: 1.3, blur: .5, glow: .25 }); g.restore();
    BART[k] = toURL(cv);
  }
  return BART[k];
}
function bladerArt(id, fig) { return figFull("b:" + id, fig).url; }
// the Bit-Beast cut-in: the beast towering over its Beyblade
function beastCard(id, d) {
  const k = id + "|beast";
  if (!BART[k]) {
    const { cv, g } = artCanvas(360, 540);
    if (d.beast && d.beast.kind) { g.save(); g.translate(180, 250); g.scale(1.25, 1.25); drawBeast(g, d.beast.kind, d.beast.col, .9, 1); g.restore(); }
    g.save(); g.translate(180, 520); g.scale(2.2, 2.2); drawBey(g, d.bey, { e: .45, spin: 2, blur: .9, glow: .6 }); g.restore();
    BART[k] = toURL(cv);
  }
  return BART[k];
}
const enemyArt = key => { const d = ENEMY[key], id = "e:" + (d.op || key); return { get full() { return beyCard(id, d); }, get head() { return beyIcon(id, d, d.boss ? ICON_BG[d.el] : ICON_BG.enemy); }, get blader() { return bladerArt(id, d.fig); }, get beast() { return beastCard(id, d); } }; };
const opArt = key => { const d = OPS[key], id = "o:" + key; return { get full() { return beyCard(id, d); }, get head() { return beyIcon(id, d, ICON_BG[d.el]); }, get blader() { return bladerArt(d.base, d.fig); }, get beast() { return beastCard(id, d); } }; };
