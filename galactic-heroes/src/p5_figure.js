
// =====================================================================
//  FIGURE RENDERER — procedural full-body characters on canvas.
//  Local space: feet at (0,0), facing +x, a human is ~100 units tall.
// =====================================================================
const shadeCache = new Map();
function shade(hex, amt) {
  const key = hex + amt;
  let v = shadeCache.get(key);
  if (v) return v;
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const n = parseInt(c, 16);
  let r = n >> 16 & 255, gg = n >> 8 & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; gg *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; gg += (255 - gg) * amt; b += (255 - b) * amt; }
  v = `rgb(${r | 0},${gg | 0},${b | 0})`;
  shadeCache.set(key, v);
  return v;
}
const Dv = a => [Math.sin(a), Math.cos(a)];
const seg = (p, a, len) => { const d = Dv(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function capsule(g, a, b, w, col, hi = true) {
  g.lineCap = "round";
  g.strokeStyle = col; g.lineWidth = w;
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  if (hi && w > 3) {
    g.strokeStyle = shade(col.startsWith("#") ? col : "#888888", .28); g.lineWidth = w * .32;
    const o = w * .2;
    g.beginPath(); g.moveTo(a[0] + o * .4, a[1] - o); g.lineTo(b[0] + o * .4, b[1] - o); g.stroke();
  }
}
function circ(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }

const KEY = {
  wind:   { fu: 2.7, ff: 3.05, wa: 3.7, lean: -.1 },
  strike: { fu: 1.15, ff: 1.3, wa: .85, lean: .32 },
};
function figPose(f, pose) {
  const w = f.w, T = pose.time || 0, k = clamp(pose.t || 0, 0, 1), name = pose.name || "idle";
  const P = { lean: .05, bt: -.18, bs: -.04, ft: .3, fs: .1, bu: -.15, bf: .25, fu: .55, ff: 1.45, wa: 2.35, bwa: -.5,
    bob: Math.sin(T * 2.4 + (pose.ph || 0)) * 1.1 };
  if (w === "pistol" || w === "pistols" || w === "rifle" || w === "bowcaster") {
    P.fu = .6; P.ff = 1.15; P.wa = 1.3;
    if (w === "rifle" || w === "bowcaster") { P.fu = .75; P.ff = 1.45; P.wa = 1.52; P.bu = .55; P.bf = 1.35; }
    if (w === "pistols") { P.bu = .35; P.bf = .95; P.bwa = 1.2; }
  }
  if (w === "none") { P.fu = .25; P.ff = .55; }
  if (w === "staff" || w === "staffsaber") { P.fu = .6; P.ff = 1.25; P.wa = 2.0; }
  if (w === "saber2") { P.bu = .2; P.bf = .7; P.bwa = -.55; }
  if (w === "saber4") { P.bu = .5; P.bf = 1.2; P.bwa = 2.6; }
  if (f.type === "grievous") P.lean = .22;
  if (f.type === "yoda") P.lean = .12;
  const base = { ...P };
  const mix = (a, b, t) => { for (const key in b) P[key] = lerp(a[key] ?? P[key], b[key], t); };
  if (name === "run") {
    const s = Math.sin(T * 15);
    P.bt = -.55 * s; P.ft = .55 * s; P.bs = P.bt - .45 * (1 + s) / 2 - .1; P.fs = P.ft - .45 * (1 - s) / 2 - .1;
    P.lean = .28; P.bu = .6 * s; P.bf = P.bu + .8;
  } else if (name === "swing") {
    if (k < .35) mix(base, KEY.wind, ease(k / .35));
    else if (k < .55) { mix(base, KEY.wind, 1); mix(KEY.wind, KEY.strike, ease((k - .35) / .2)); }
    else { mix(base, KEY.strike, 1); mix(KEY.strike, base, ease((k - .55) / .45)); }
    P.ft = lerp(base.ft, .55, Math.sin(k * Math.PI)); P.bt = lerp(base.bt, -.4, Math.sin(k * Math.PI));
  } else if (name === "shoot") {
    const rec = k > .08 && k < .3 ? Math.sin((k - .08) / .22 * Math.PI) * .18 : 0;
    P.fu = 1.5 - rec; P.ff = 1.56 - rec * .5; P.wa = 1.57 - rec;
    if (w === "rifle" || w === "bowcaster") { P.bu = 1.15; P.bf = 1.6; }
    if (w === "pistols") { P.bu = 1.35 - rec; P.bf = 1.5; P.bwa = 1.57; }
    P.lean = .02 - rec * .3;
  } else if (name === "cast") {
    const s = Math.sin(clamp(k * 1.4, 0, 1) * Math.PI / 2);
    P.fu = lerp(P.fu, 1.55, s); P.ff = lerp(P.ff, 1.65, s); P.bu = lerp(P.bu, 1.3, s); P.bf = lerp(P.bf, 1.62, s);
    P.lean = lerp(P.lean, .14, s);
  } else if (name === "choke") {
    const s = Math.sin(clamp(k * 1.6, 0, 1) * Math.PI / 2);
    P.fu = lerp(P.fu, 1.85, s); P.ff = lerp(P.ff, 2.15, s); P.lean = lerp(P.lean, -.04, s);
  } else if (name === "throw") {
    if (k < .4) mix(base, { fu: -2.5, ff: -2.8, lean: -.12 }, ease(k / .4));
    else { mix(base, { fu: -2.5, ff: -2.8, lean: -.12 }, 1); mix({ fu: -2.5, ff: -2.8, lean: -.12 }, { fu: 1.6, ff: 1.5, lean: .3 }, ease(clamp((k - .4) / .25, 0, 1))); }
  } else if (name === "hit") {
    const s = 1 - k;
    P.lean = -.38 * s + base.lean * (1 - s); P.fu += .5 * s; P.bu -= .4 * s;
  } else if (name === "buff") {
    const s = Math.sin(clamp(k * 1.5, 0, 1) * Math.PI / 2);
    P.fu = lerp(P.fu, 2.3, s); P.ff = lerp(P.ff, 2.7, s); P.bu = lerp(P.bu, -2.2, s); P.bf = lerp(P.bf, -2.6, s); P.lean = lerp(P.lean, -.12, s);
    if (w === "saber" || w === "staff") P.wa = lerp(P.wa, 3.1, s);
  } else if (name === "victory") {
    P.fu = 2.85; P.ff = 3.05; P.wa = 3.12; P.lean = -.05;
  }
  return P;
}

function drawFigure(g, f, pose) {
  const P = figPose(f, pose), H = f.h || 1, B = f.bulk || 1, T = pose.time || 0;
  const out = {};
  g.save(); g.scale(H, H);
  if (f.type === "r2") { drawR2(g, f, pose, out); g.restore(); return scaleOut(out, H); }
  const thin = f.type === "b1" ? .55 : f.type === "grievous" ? .72 : f.type === "wookiee" ? 1.25 : 1;
  const skin = f.skin || "#e8c4a0";
  const armored = ["trooper", "mando", "vader", "kylo", "grievous", "b1"].includes(f.type);
  const glove = f.type === "wookiee" ? f.skin : armored ? (f.type === "trooper" && !f.chrome ? "#1d2026" : shade(f.col, -.45)) : skin;
  const col = f.col || "#888888", col2 = f.col2 || col, boot = f.boot || shade(col2, -.45);
  // legs
  const hip0 = [0, -48];
  let bk = seg(hip0, P.bt, 24), bft = seg(bk, P.bs, 25), fk = seg(hip0, P.ft, 24), fft = seg(fk, P.fs, 25);
  const dy = -Math.max(bft[1], fft[1]);
  const sh = p => [p[0], p[1] + dy];
  const hip = sh(hip0); bk = sh(bk); bft = sh(bft); fk = sh(fk); fft = sh(fft);
  const S = [hip[0] + Math.sin(P.lean) * 32, hip[1] - Math.cos(P.lean) * 32 + P.bob];
  const HC = [S[0] + 3 + Math.sin(P.lean) * 4, S[1] - 13 * (f.hsz || 1) + 2];
  const shoulder = [S[0], S[1] + 3];
  // cape
  if (f.cape) {
    const wv = Math.sin(T * 3 + (pose.ph || 0)) * 3;
    g.fillStyle = f.cape;
    g.beginPath(); g.moveTo(S[0] - 6, S[1] - 2); g.quadraticCurveTo(S[0] - 20, hip[1] - 6, S[0] - 24 + wv, -10);
    g.lineTo(S[0] - 4 + wv * .5, -8); g.quadraticCurveTo(hip[0] - 2, hip[1], S[0] + 6, S[1]); g.closePath(); g.fill();
  }
  // jetpack
  if (f.type === "mando") {
    g.fillStyle = shade(f.helm || col, -.15); g.beginPath(); g.roundRect ? g.roundRect(S[0] - 17, S[1] - 2, 9, 24, 4) : g.rect(S[0] - 17, S[1] - 2, 9, 24); g.fill();
    circ(g, S[0] - 12.5, S[1] - 4, 3, f.acc || "#888");
  }
  // back arm
  const be = seg(shoulder, P.bu, 17), bh = seg(be, P.bf, 16);
  capsule(g, shoulder, be, 7 * thin, shade(col, -.35), false);
  capsule(g, be, bh, 6.5 * thin, shade(col, -.35), false);
  if (f.w === "saber2" || f.w === "saber4") drawSaber(g, bh, P.bwa, f.sc, out, "tip2");
  if (f.w === "pistols") drawGun(g, bh, P.bwa, 11, out, "tip2");
  circ(g, bh[0], bh[1], 3.3 * Math.max(thin, .8), shade(glove, -.25));
  // grievous extra arms
  if (f.w === "saber4") {
    const s2 = [S[0] - 2, S[1] + 8];
    const e2 = seg(s2, P.fu - .5, 15), h2 = seg(e2, P.ff - .3, 14);
    capsule(g, s2, e2, 5, shade(col2, -.3), false); capsule(g, e2, h2, 4.5, shade(col2, -.3), false);
    drawSaber(g, h2, P.wa - .6, "#5dfc6b", out, "tip3");
  }
  // back leg
  capsule(g, hip, bk, 9 * thin, shade(col2, -.3), false);
  capsule(g, bk, bft, 8 * thin, shade(col2, -.3), false);
  const bb = [lerp(bk[0], bft[0], .5), lerp(bk[1], bft[1], .5)];
  capsule(g, bb, bft, 8.5 * thin, shade(boot, -.25), false);
  g.fillStyle = shade(boot, -.3); g.beginPath(); g.ellipse(bft[0] + 3, bft[1] - 1.5, 6 * Math.max(thin, .7), 3, 0, 0, 7); g.fill();
  // torso
  const bw = (f.type === "b1" ? 5 : f.type === "grievous" ? 7 : 8) * B, sw = (f.type === "b1" ? 6 : 11) * B;
  const tg = g.createLinearGradient(S[0] - sw, 0, S[0] + sw, 0);
  tg.addColorStop(0, shade(col, -.35)); tg.addColorStop(.6, col); tg.addColorStop(1, shade(col, .18));
  g.fillStyle = tg;
  g.beginPath();
  g.moveTo(hip[0] - bw, hip[1] + 2); g.lineTo(hip[0] + bw, hip[1] + 2);
  g.quadraticCurveTo(S[0] + sw + 3, lerp(hip[1], S[1], .55), S[0] + sw * .8, S[1]);
  g.lineTo(S[0] - sw * .9, S[1] - 1);
  g.quadraticCurveTo(S[0] - sw - 1, lerp(hip[1], S[1], .5), hip[0] - bw, hip[1] + 2);
  g.fill();
  if (f.vest) {
    g.fillStyle = f.vest; g.beginPath(); g.moveTo(hip[0] - bw, hip[1]); g.lineTo(hip[0] - 1, hip[1]); g.lineTo(S[0] - 2, S[1] + 1); g.lineTo(S[0] - sw * .9, S[1]); g.closePath(); g.fill();
  }
  if (f.type === "trooper") {
    g.strokeStyle = f.chrome ? "#6b7280" : "#30343c"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(S[0] - 6, S[1] + 9); g.lineTo(S[0] + 8, S[1] + 9); g.moveTo(hip[0] - 5, hip[1] - 7); g.lineTo(hip[0] + 6, hip[1] - 7); g.stroke();
    if (f.acc && f.acc !== "#1b1d22") { g.fillStyle = f.acc; g.fillRect(S[0] - 6, S[1] + 1, 4, 6); }
  }
  if (f.type === "vader") {
    g.fillStyle = "#2b2e35"; g.fillRect(S[0] - 1, S[1] + 6, 9, 7);
    g.fillStyle = "#ff3b3b"; g.fillRect(S[0] + 1, S[1] + 8, 2, 2); g.fillStyle = "#3fa7ff"; g.fillRect(S[0] + 4, S[1] + 8, 2, 2); g.fillStyle = "#4fd17f"; g.fillRect(S[0] + 1, S[1] + 11, 5, 1.2);
  }
  if (f.type === "wookiee" || f.type === "mando") {
    g.strokeStyle = f.acc || "#3a2a1a"; g.lineWidth = 3.5; g.beginPath(); g.moveTo(S[0] - sw * .7, S[1]); g.lineTo(hip[0] + bw * .9, hip[1] - 2); g.stroke();
  }
  // belt
  g.strokeStyle = f.acc || shade(col, -.4); g.lineWidth = 3.2; g.lineCap = "butt";
  g.beginPath(); g.moveTo(hip[0] - bw - .5, hip[1] - 1); g.lineTo(hip[0] + bw + .5, hip[1] - 1); g.stroke();
  // front leg
  capsule(g, hip, fk, 9 * thin, col2);
  capsule(g, fk, fft, 8 * thin, col2);
  const fb = [lerp(fk[0], fft[0], .5), lerp(fk[1], fft[1], .5)];
  capsule(g, fb, fft, 8.5 * thin, boot);
  g.fillStyle = boot; g.beginPath(); g.ellipse(fft[0] + 3, fft[1] - 1.5, 6 * Math.max(thin, .7), 3, 0, 0, 7); g.fill();
  if (f.type === "trooper" && !f.chrome) { g.fillStyle = "#30343c"; g.fillRect(fk[0] - 3, fk[1] - 1, 6, 2); }
  // robe skirt
  if (f.robe) {
    const rg = g.createLinearGradient(-14, 0, 14, 0);
    rg.addColorStop(0, shade(col2, -.4)); rg.addColorStop(.65, col2); rg.addColorStop(1, shade(col2, .15));
    g.fillStyle = rg;
    const sway = Math.sin(T * 2.4 + (pose.ph || 0)) * 1.5;
    g.beginPath(); g.moveTo(hip[0] - bw - 1, hip[1] - 3); g.lineTo(hip[0] + bw + 1, hip[1] - 3);
    g.quadraticCurveTo(Math.max(fft[0], hip[0]) + 10, -14, Math.max(fft[0], bft[0]) + 9 + sway, -3);
    g.lineTo(Math.min(fft[0], bft[0]) - 10 + sway, -3);
    g.quadraticCurveTo(Math.min(bft[0], hip[0]) - 10, -16, hip[0] - bw - 1, hip[1] - 3); g.fill();
    g.strokeStyle = shade(col2, -.5); g.lineWidth = 1; g.beginPath(); g.moveTo(hip[0] + 2, hip[1]); g.lineTo(hip[0] + 4 + sway, -4); g.stroke();
  }
  // neck + head
  if (f.type !== "b1") capsule(g, [S[0] + 1, S[1] + 1], [HC[0] - 1, HC[1] + 4], 6, armored ? shade(col, -.4) : shade(skin, -.12), false);
  else capsule(g, [S[0], S[1]], [HC[0] - 3, HC[1] + 6], 3, col2, false);
  drawHead(g, f, HC, T, pose);
  out.head = HC; out.chest = [lerp(hip[0], S[0], .6), lerp(hip[1], S[1], .6)];
  // front arm + weapon
  const fe = seg(shoulder, P.fu, 17), fh = seg(fe, P.ff, 16);
  if (f.w === "rifle" || f.w === "bowcaster") drawGun(g, fh, P.wa, 24, out, "tip", f.w === "bowcaster");
  capsule(g, shoulder, fe, 7.2 * thin, col);
  capsule(g, fe, fh, 6.6 * thin, armored ? col : col);
  if (f.type === "trooper" || f.type === "vader" || f.type === "kylo") capsule(g, [lerp(fe[0], fh[0], .55), lerp(fe[1], fh[1], .55)], fh, 6.8, glove, false);
  circ(g, fh[0], fh[1], 3.4 * Math.max(thin, .8), glove);
  out.hand = fh;
  if (f.w === "saber" || f.w === "saber2" || f.w === "saber4") drawSaber(g, fh, P.wa, f.sc, out, "tip");
  else if (f.w === "staffsaber") drawStaff(g, fh, P.wa, f.sc, out);
  else if (f.w === "staff") drawStaff(g, fh, P.wa, null, out);
  else if (f.w === "pistol" || f.w === "pistols") drawGun(g, fh, P.wa, 11, out, "tip");
  if (!out.tip) out.tip = fh;
  g.restore();
  return scaleOut(out, H);
}
function scaleOut(out, H) { for (const k in out) out[k] = [out[k][0] * H, out[k][1] * H]; return out; }

function drawSaber(g, hand, a, color, out, key) {
  const d = Dv(a);
  const h0 = [hand[0] - d[0] * 3, hand[1] - d[1] * 3], h1 = [hand[0] + d[0] * 6, hand[1] + d[1] * 6];
  const tip = [hand[0] + d[0] * 50, hand[1] + d[1] * 50];
  bladeStroke(g, h1, tip, color);
  capsule(g, h0, h1, 3.6, "#c8ccd4", false);
  out[key] = tip; out[key + "c"] = color;
}
function bladeStroke(g, a, b, color) {
  g.save(); g.lineCap = "round";
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
  g.globalCompositeOperation = "lighter";
  g.strokeStyle = color + "33"; g.lineWidth = 13; g.stroke();
  g.globalCompositeOperation = "source-over";
  g.strokeStyle = color + "cc"; g.lineWidth = 6; g.stroke();
  g.strokeStyle = shade(color, .55); g.lineWidth = 3.4; g.stroke();
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.6; g.stroke();
  g.restore();
}
function drawStaff(g, hand, a, color, out) {
  const d = Dv(a);
  if (!color) {
    capsule(g, [hand[0] - d[0] * 30, hand[1] - d[1] * 30], [hand[0] + d[0] * 32, hand[1] + d[1] * 32], 3.2, "#8a6a44", false);
    out.tip = [hand[0] + d[0] * 32, hand[1] + d[1] * 32]; return;
  }
  for (const s of [-1, 1]) {
    const h1 = [hand[0] + d[0] * 7 * s, hand[1] + d[1] * 7 * s], tip = [hand[0] + d[0] * 46 * s, hand[1] + d[1] * 46 * s];
    bladeStroke(g, h1, tip, color);
    if (s > 0) { out.tip = tip; out.tipc = color; } else { out.tip2 = tip; out.tip2c = color; }
  }
  capsule(g, [hand[0] - d[0] * 7, hand[1] - d[1] * 7], [hand[0] + d[0] * 7, hand[1] + d[1] * 7], 3.6, "#9aa0aa", false);
}
function drawGun(g, hand, a, len, out, key, bow) {
  const d = Dv(a), back = len > 15 ? 9 : 2;
  const b0 = [hand[0] - d[0] * back, hand[1] - d[1] * back], b1 = [hand[0] + d[0] * len, hand[1] + d[1] * len];
  g.lineCap = "butt";
  g.strokeStyle = "#23262d"; g.lineWidth = len > 15 ? 5 : 4.5; g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.stroke();
  g.strokeStyle = "#4a505c"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(b0[0], b0[1] - 1.5); g.lineTo(b1[0], b1[1] - 1.5); g.stroke();
  if (len > 15) { g.fillStyle = "#3a3f4a"; g.fillRect(hand[0] + d[0] * 4 - 2, hand[1] + d[1] * 4 - 5, 6, 3); }
  if (bow) {
    const p = [-d[1], d[0]], c = [hand[0] + d[0] * (len - 4), hand[1] + d[1] * (len - 4)];
    g.strokeStyle = "#8a6a44"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(c[0] + p[0] * 9 - d[0] * 4, c[1] + p[1] * 9 - d[1] * 4); g.lineTo(c[0], c[1]); g.lineTo(c[0] - p[0] * 9 - d[0] * 4, c[1] - p[1] * 9 - d[1] * 4); g.stroke();
  }
  out[key] = [b1[0] + d[0] * 2, b1[1] + d[1] * 2];
}

function drawHead(g, f, c, T, pose) {
  const [x, y] = c, r = 10 * (f.hsz || 1), skin = f.skin || "#e8c4a0", t = f.type;
  const face = (col) => {
    const gr = g.createRadialGradient(x + 3, y - 3, 1, x, y, r * 1.1);
    gr.addColorStop(0, shade(col, .18)); gr.addColorStop(1, shade(col, -.22));
    circ(g, x, y, r, gr);
  };
  const eye = (col = "#1a1410", ex = 5.5, ey = -1) => { circ(g, x + ex, y + ey, 1.3, col); };
  if (t === "human" || t === "hood") {
    if (t === "hood") {
      g.fillStyle = f.cape || f.col; g.beginPath(); g.ellipse(x - 1, y - 1, r + 4, r + 5, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(x - r - 4, y); g.lineTo(x - r - 6, y + 16); g.lineTo(x + 4, y + 12); g.fill();
      face(shade(skin, -.04));
      g.fillStyle = f.cape || f.col; g.beginPath(); g.ellipse(x - 4, y - 4, r + 2, r + 1, -.3, Math.PI * .9, Math.PI * 2.05); g.fill();
      g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); g.fill();
      circ(g, x + 5.5, y + .5, 1.6, f.eyes || "#222");
      g.strokeStyle = shade(skin, -.45); g.lineWidth = .8; g.beginPath(); g.moveTo(x + 2, y + 5); g.lineTo(x + 7, y + 4); g.stroke();
      return;
    }
    face(skin);
    // nose + mouth
    g.fillStyle = shade(skin, -.12); g.beginPath(); g.moveTo(x + r - 1, y - 1); g.lineTo(x + r + 2, y + 3); g.lineTo(x + r - 1, y + 3.5); g.fill();
    eye(); g.strokeStyle = shade(skin, -.4); g.lineWidth = .9; g.beginPath(); g.moveTo(x + 4, y + 6); g.lineTo(x + 7.5, y + 5.5); g.stroke();
    const hc = f.hair || "#3a2a1a", hs = f.hs;
    g.fillStyle = hc;
    if (hs !== "bald") {
      g.beginPath();
      if (hs === "old") g.arc(x - 1, y, r + .5, Math.PI * .75, Math.PI * 1.45);
      else g.arc(x - .5, y - .5, r + 1, Math.PI * .72, Math.PI * 1.9);
      g.lineTo(x - 2, y - 2); g.fill();
    } else { g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.ellipse(x - 1, y - 7, 4, 2, -.3, 0, 7); g.fill(); g.fillStyle = hc; }
    if (hs === "swoop") { g.beginPath(); g.ellipse(x + 3, y - 8, 7, 3.5, -.25, 0, 7); g.fill(); }
    if (hs === "curly") for (let k = 0; k < 5; k++) circ(g, x - 7 + k * 3.2, y - 9 + Math.abs(k - 2) * .8, 3, hc);
    if (hs === "buns") { circ(g, x - 7, y + 1, 6.5, hc); g.strokeStyle = shade(hc, .2); g.lineWidth = .8; g.beginPath(); g.arc(x - 7, y + 1, 3.5, 0, 6); g.stroke(); }
    if (hs === "bun") { circ(g, x - 8, y - 6, 4, hc); g.strokeStyle = hc; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 9, y - 3); g.quadraticCurveTo(x - 12, y + 4, x - 10, y + 10); g.stroke(); }
    if (hs === "beard" || hs === "old") {
      g.fillStyle = hc; g.beginPath(); g.moveTo(x - 2, y + 2); g.quadraticCurveTo(x + 2, y + (hs === "old" ? 14 : 12), x + 9, y + 6); g.lineTo(x + 9, y + 3.5); g.quadraticCurveTo(x + 4, y + 5, x + 1, y + 1); g.fill();
    }
    return;
  }
  if (t === "trooper") {
    const base = f.chrome ? "#d9dee6" : "#f2f4f7";
    const gr = g.createRadialGradient(x + 2, y - 4, 1, x, y, r * 1.2);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, f.chrome ? "#7e8794" : "#b9c0cc");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y - 1, r + 1, Math.PI * .85, Math.PI * 2.2); g.lineTo(x + r + 2, y + 7); g.lineTo(x - 4, y + 9); g.closePath(); g.fill();
    g.fillStyle = "#121418"; g.beginPath(); g.moveTo(x + 2, y - 3); g.quadraticCurveTo(x + 8, y - 6, x + r + 1, y - 2); g.lineTo(x + r, y + 1); g.quadraticCurveTo(x + 6, y - 1, x + 3, y + 1); g.fill();
    g.fillStyle = "#30343c"; g.fillRect(x + 5, y + 4, 4, 3);
    if (f.acc && f.acc !== "#1b1d22") { g.strokeStyle = f.acc; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 1, r - 1, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }
    void base; return;
  }
  if (t === "mando") {
    const hcol = f.helm || "#6a7a5a";
    const gr = g.createRadialGradient(x + 2, y - 4, 1, x, y, r * 1.2); gr.addColorStop(0, shade(hcol, .3)); gr.addColorStop(1, shade(hcol, -.35));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y - 1, r + 1, Math.PI * .9, Math.PI * 2.15); g.lineTo(x + r + 1, y + 8); g.lineTo(x - 7, y + 9); g.closePath(); g.fill();
    g.fillStyle = "#0b0c10"; g.fillRect(x + 1, y - 4, r + 1, 3.2); g.fillRect(x + r - 3.5, y - 2, 3.2, 8);
    g.strokeStyle = "#555"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 3, y - 6); g.lineTo(x - 2, y - 17); g.stroke();
    if (f.acc === "#8c1e1e") { g.strokeStyle = "#8c1e1e"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 8, y - 7); g.lineTo(x - 4, y - 9); g.stroke(); }
    return;
  }
  if (t === "vader" || t === "kylo") {
    const gr = g.createRadialGradient(x + 2, y - 5, 1, x, y, r * 1.3); gr.addColorStop(0, "#5a5f6a"); gr.addColorStop(.5, "#15161a"); gr.addColorStop(1, "#050506");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y - 1, r + 1.5, Math.PI * .95, Math.PI * 2.1);
    if (t === "vader") { g.lineTo(x + r + 2, y + 8); g.lineTo(x - 4, y + 9); g.lineTo(x - r - 6, y + 11); g.lineTo(x - r - 2, y + 2); }
    else { g.lineTo(x + r + 1, y + 7); g.lineTo(x - r, y + 8); }
    g.closePath(); g.fill();
    if (t === "vader") {
      g.fillStyle = "#1d1f24"; g.beginPath(); g.moveTo(x + 3, y - 4); g.lineTo(x + r + 1, y - 4); g.lineTo(x + r + 2, y + 9); g.lineTo(x + 2, y + 9); g.fill();
      g.fillStyle = "#08080a"; g.beginPath(); g.ellipse(x + 7, y - 1.5, 3.2, 2.2, -.2, 0, 7); g.fill();
      g.fillStyle = "rgba(255,60,60,.35)"; circ(g, x + 7.8, y - 2, .9, "rgba(255,80,80,.55)");
      g.fillStyle = "#6a6f7a"; g.beginPath(); g.moveTo(x + 6, y + 3); g.lineTo(x + 11, y + 3); g.lineTo(x + 8.5, y + 8.5); g.fill();
    } else {
      g.strokeStyle = "#a8adb8"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 1, y - 3); g.lineTo(x + r + 1, y - 3); g.moveTo(x + r - 2, y - 3); g.lineTo(x + r - 2, y + 4); g.stroke();
    }
    return;
  }
  if (t === "wookiee") {
    const fur = f.skin;
    const gr = g.createRadialGradient(x + 3, y - 3, 1, x, y, r * 1.4); gr.addColorStop(0, shade(fur, .2)); gr.addColorStop(1, shade(fur, -.3));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x - 1, y, r + 2, r + 3, 0, 0, 7); g.fill();
    g.fillStyle = shade(fur, .15); g.beginPath(); g.ellipse(x + 8, y + 3, 5.5, 4.5, 0, 0, 7); g.fill();
    circ(g, x + 12.5, y + 1.5, 1.8, "#1a1008"); eye("#140c06", 5, -3);
    g.strokeStyle = shade(fur, -.4); g.lineWidth = 1;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 9 + k * 2, y - 8 + k); g.lineTo(x - 11 + k * 2, y - 2 + k); g.stroke(); }
    return;
  }
  if (t === "yoda") {
    const sk = f.skin;
    g.fillStyle = shade(sk, -.1);
    g.beginPath(); g.moveTo(x - 4, y - 2); g.quadraticCurveTo(x - r - 14, y - 9, x - r - 16, y - 2); g.quadraticCurveTo(x - r - 8, y + 3, x - 4, y + 4); g.fill();
    face(sk);
    g.fillStyle = shade(sk, -.25); g.beginPath(); g.moveTo(x - 6, y); g.quadraticCurveTo(x - r - 9, y - 4, x - r - 12, y - 1.5); g.quadraticCurveTo(x - r - 6, y + 1, x - 6, y + 2); g.fill();
    eye("#2a1a08", 6, -1.5); circ(g, x + 6.3, y - 1.9, .5, "#fff");
    g.strokeStyle = shade(sk, -.4); g.lineWidth = .7; g.beginPath(); g.moveTo(x + 2, y - 6); g.lineTo(x + 8, y - 5); g.moveTo(x + 4, y + 6); g.lineTo(x + 8, y + 5); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.moveTo(x - 3, y - r + 1); g.quadraticCurveTo(x - 6, y - r - 4, x - 9, y - r - 1); g.stroke();
    return;
  }
  if (t === "zabrak") {
    face(f.skin);
    g.fillStyle = "#121014";
    g.beginPath(); g.moveTo(x + 2, y - 6); g.lineTo(x + 9, y - 4); g.lineTo(x + 7, y - 1); g.lineTo(x + 2, y - 2); g.fill();
    g.beginPath(); g.moveTo(x + 4, y + 3); g.lineTo(x + 10, y + 4); g.lineTo(x + 5, y + 8); g.fill();
    g.beginPath(); g.moveTo(x - 7, y - 3); g.lineTo(x - 3, y - 8); g.lineTo(x - 1, y + 2); g.fill();
    eye("#ffcf33", 6, -2);
    g.fillStyle = "#e8d8a8";
    for (const [hx, hy] of [[-3, -10], [1, -10.5], [-6, -8], [4, -9]]) { g.beginPath(); g.moveTo(x + hx - 1.2, y + hy + 1.5); g.lineTo(x + hx, y + hy - 3); g.lineTo(x + hx + 1.2, y + hy + 1.5); g.fill(); }
    return;
  }
  if (t === "togruta") {
    g.fillStyle = "#f2f2f2"; g.beginPath(); g.moveTo(x - 6, y + 2); g.quadraticCurveTo(x - 14, y + 10, x - 11, y + 22); g.lineTo(x - 7, y + 20); g.quadraticCurveTo(x - 8, y + 10, x - 2, y + 4); g.fill();
    g.fillStyle = "#3b6fd1"; g.fillRect(x - 12, y + 12, 5, 2.5); g.fillRect(x - 11.5, y + 17, 4.5, 2);
    face(f.skin);
    g.fillStyle = "#f6f2ea"; g.beginPath(); g.ellipse(x + 6, y - 2, 4, 2.6, -.2, 0, 7); g.fill();
    g.beginPath(); g.moveTo(x + 3, y + 4); g.lineTo(x + 9, y + 5); g.lineTo(x + 6, y + 8); g.fill();
    eye("#1a2a5a", 6.5, -2);
    g.fillStyle = "#f2f2f2";
    g.beginPath(); g.moveTo(x - 6, y - 6); g.quadraticCurveTo(x - 5, y - 20, x + 3, y - 22); g.quadraticCurveTo(x + 1, y - 14, x + 1, y - 7); g.fill();
    g.fillStyle = "#3b6fd1"; g.beginPath(); g.moveTo(x - 4, y - 14); g.lineTo(x + 1, y - 15); g.lineTo(x + 1, y - 12); g.lineTo(x - 4.5, y - 11); g.fill();
    return;
  }
  if (t === "grievous") {
    g.fillStyle = "#e8e0c8"; g.beginPath(); g.moveTo(x - 7, y - 7); g.quadraticCurveTo(x + 4, y - 14, x + 13, y - 3); g.lineTo(x + 11, y + 8); g.lineTo(x - 2, y + 10); g.quadraticCurveTo(x - 9, y + 2, x - 7, y - 7); g.fill();
    g.fillStyle = "#c9c0a4"; g.beginPath(); g.moveTo(x + 2, y - 2); g.lineTo(x + 13, y - 3); g.lineTo(x + 11, y + 8); g.lineTo(x + 3, y + 6); g.fill();
    g.fillStyle = "#1a1408"; g.beginPath(); g.ellipse(x + 7, y - 3, 3.2, 2.3, -.2, 0, 7); g.fill();
    circ(g, x + 7.5, y - 3.2, 1.3, "#ffd34d");
    g.strokeStyle = "#5a5440"; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 5, y + 4); g.lineTo(x + 11, y + 4); g.stroke();
    return;
  }
  if (t === "b1") {
    g.fillStyle = f.col; g.beginPath(); g.moveTo(x - 6, y - 5); g.quadraticCurveTo(x, y - 9, x + 6, y - 3); g.lineTo(x + 17, y + 5); g.lineTo(x + 16, y + 8); g.lineTo(x + 2, y + 5); g.quadraticCurveTo(x - 6, y + 3, x - 6, y - 5); g.fill();
    g.fillStyle = shade(f.col, -.3); g.beginPath(); g.moveTo(x + 2, y + 5); g.lineTo(x + 16, y + 8); g.lineTo(x + 6, y + 8); g.fill();
    circ(g, x, y - 2, 2.4, "#3a2e1a"); circ(g, x, y - 2, 1.1, "#8a7450");
    return;
  }
  face(skin);
}

function drawR2(g, f, pose, out) {
  const T = pose.time || 0, k = pose.t || 0, wob = Math.sin(T * 3) * .03 + (pose.name === "hit" ? -.2 * (1 - k) : 0);
  g.save(); g.rotate(wob);
  // side legs
  g.fillStyle = "#c9d1de"; g.fillRect(-20, -54, 7, 44); g.fillStyle = "#9aa4b8"; g.fillRect(-23, -12, 13, 12);
  // body
  const gr = g.createLinearGradient(-15, 0, 17, 0); gr.addColorStop(0, "#9ea8ba"); gr.addColorStop(.55, "#f2f5fa"); gr.addColorStop(1, "#d6dce6");
  g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(-15, -66, 32, 58, 4) : g.rect(-15, -66, 32, 58); g.fill();
  g.fillStyle = f.acc; g.fillRect(-4, -58, 14, 8); g.fillRect(-4, -46, 5, 16); g.fillRect(4, -46, 6, 6); g.fillRect(4, -36, 6, 6);
  g.fillStyle = "#c9d1de"; g.fillRect(-2, -12, 16, 12);
  // dome
  const dg = g.createLinearGradient(-15, -82, 17, -66); dg.addColorStop(0, "#8f99ac"); dg.addColorStop(.5, "#eef2f8"); dg.addColorStop(1, "#b8c0ce");
  g.fillStyle = dg; g.beginPath(); g.ellipse(1, -66, 16.5, 17, 0, Math.PI, Math.PI * 2); g.fill();
  g.fillStyle = f.acc; g.fillRect(-12, -74, 6, 5); g.fillRect(9, -74, 6, 5);
  circ(g, 4, -76, 3.5, "#0c0f16"); circ(g, 4.8, -76.6, 1.3, pose.name === "hit" ? "#ff4b4b" : "#5fd4ff");
  out.head = [2, -74]; out.chest = [2, -40]; out.hand = [17, -40];
  out.tip = [20, -44];
  g.restore();
}

// ---------- portraits ----------
const PORTRAIT = {};
function portrait(id) {
  if (PORTRAIT[id]) return PORTRAIT[id];
  const def = CH[id], S = 160;
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const g = cv.getContext("2d");
  const probe = drawFigure(g, def.fig, { name: "idle", time: .6 });
  g.clearRect(0, 0, S, S);
  const bg = g.createRadialGradient(S * .55, S * .35, 4, S / 2, S / 2, S * .75);
  if (def.side === "light") { bg.addColorStop(0, "#3c78c8"); bg.addColorStop(.6, "#13305e"); bg.addColorStop(1, "#060f22"); }
  else { bg.addColorStop(0, "#c83c4a"); bg.addColorStop(.6, "#5a1220"); bg.addColorStop(1, "#1a0509"); }
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  g.globalAlpha = .15; g.strokeStyle = "#fff"; g.lineWidth = 1;
  for (let yy = 6; yy < S; yy += 6) { g.beginPath(); g.moveTo(0, yy); g.lineTo(S, yy); g.stroke(); }
  g.globalAlpha = 1;
  const hr = 10 * (def.fig.hsz || 1) * (def.fig.h || 1) * (def.fig.type === "r2" ? 1.5 : def.fig.type === "wookiee" ? 1.2 : 1);
  const sc = S * .19 / hr;
  const hx = probe.head[0], hy = probe.head[1];
  g.save(); g.translate(S * .5 - hx * sc - 2, S * .43 - hy * sc); g.scale(sc, sc);
  drawFigure(g, def.fig, { name: "idle", time: .6 });
  g.restore();
  const vg = g.createRadialGradient(S / 2, S / 2, S * .35, S / 2, S / 2, S * .72);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)");
  g.fillStyle = vg; g.fillRect(0, 0, S, S);
  try { PORTRAIT[id] = cv.toDataURL("image/png"); } catch (e) { PORTRAIT[id] = ""; }
  return PORTRAIT[id];
}
