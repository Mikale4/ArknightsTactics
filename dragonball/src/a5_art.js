// =====================================================================
//  FIGHTER RENDERER — procedural Dragon Ball fighters on canvas, side view.
//  Local space: feet at (0,0), facing +x, y grows downward, an adult is ~100 units tall.
//  Angles (Dv) are measured from straight down: 0 = down, π/2 = forward, π = up, -π/2 = back.
// =====================================================================
const shadeCache = new Map();
function shade(hex, amt) {
  const key = hex + amt;
  let v = shadeCache.get(key);
  if (v) return v;
  let c = String(hex).replace("#", "");
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
const INK = "#120a10";

function circ(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, Math.PI * 2); g.fill(); }
// a limb: dark outline, colour, then a soft highlight
function limb(g, a, b, w, col, hi = true) {
  g.lineCap = "round";
  g.strokeStyle = INK; g.lineWidth = w + 2.2;
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  g.strokeStyle = col; g.lineWidth = w;
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  if (hi && w > 4) {
    g.strokeStyle = shade(col, .3); g.lineWidth = w * .28; g.globalAlpha = .7;
    const o = w * .22;
    g.beginPath(); g.moveTo(a[0] - o * .3, a[1] - o * .2); g.lineTo(b[0] - o * .3, b[1] - o * .2); g.stroke();
    g.globalAlpha = 1;
  }
}
function blob(g, pts, fill, outline = true, close = true) {
  g.beginPath();
  pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  if (close) g.closePath();
  if (outline) { g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); }
  g.fillStyle = fill; g.fill();
}
// a closed shape through points, smoothed with quadratic curves
function smooth(g, pts, fill, outline = true, lw = 2.2) {
  const n = pts.length; if (n < 3) return;
  g.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[n - 1], pts[0]); g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = mid(p, pts[(i + 1) % n]); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
  g.closePath();
  if (outline) { g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }
  g.fillStyle = fill; g.fill();
}
function ell(g, x, y, rx, ry, rot, fill, outline = true) {
  g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, Math.PI * 2);
  if (outline) { g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); }
  g.fillStyle = fill; g.fill();
}

// ---------- proportions ----------
function metrics(f) {
  const kid = f.kid || 0, B = f.bulk || 1, sl = f.slim ? .86 : 1;
  return {
    thigh: lerp(21, 13, kid), shin: lerp(21, 13, kid), torso: lerp(28, 20, kid), neck: lerp(3, 1.5, kid), headR: lerp(11.5, 13, kid),
    arm1: lerp(16, 11, kid), arm2: lerp(15, 10, kid),
    wT: lerp(25, 19, kid) * B * sl, wA1: lerp(9, 7, kid) * Math.sqrt(B) * sl, wA2: lerp(8, 6.6, kid) * Math.sqrt(B) * sl,
    wL1: lerp(11.5, 8.5, kid) * Math.sqrt(B) * sl, wL2: lerp(9.5, 7.5, kid) * Math.sqrt(B) * sl, fist: lerp(4.8, 4.2, kid) * Math.sqrt(B), B, kid,
  };
}

// ---------- poses ----------
// P: lean (torso tilt), bt/bs + ft/fs (back/front thigh and shin), bu/bf + fu/ff (back/front upper arm and forearm),
// rot (whole body, for flying and falling), crouch, air (feet off the ground), hand shapes, head tilt
const STANCE = { lean: .08, bt: -.36, bs: -.1, ft: .34, fs: .02, bu: .75, bf: 2.35, fu: 1.2, ff: 2.55, ht: 0, rot: 0, hb: "fist", hf: "fist" };
const HOVER = { lean: .12, bt: -.16, bs: -.5, ft: .14, fs: -.22, bu: .75, bf: 2.3, fu: 1.2, ff: 2.55, ht: 0, rot: 0, hb: "fist", hf: "fist" };
function figPose(f, pose) {
  const T = pose.time || 0, k = clamp(pose.t || 0, 0, 1), name = pose.name || "idle";
  const P = { ...(pose.air ? HOVER : STANCE), air: !!pose.air, crouch: 0, alt: pose.alt || 0 };
  const bob = Math.sin(T * 3 + (pose.ph || 0));
  const mix = (b, t) => { for (const key in b) if (typeof b[key] === "number") P[key] = lerp(P[key], b[key], t); else if (t > .5) P[key] = b[key]; };
  if (f.villain && name === "idle" && !pose.air) mix({ bu: -.25, bf: .1, fu: .2, ff: .35, lean: -.02, hb: "fist", hf: "fist" }, .6);
  if (name === "idle") { P.fu += bob * .04; P.bu += bob * .04; P.lean += bob * .015; if (pose.air) { P.bs += bob * .08; P.fs += bob * .06; } }
  else if (name === "stand") mix({ lean: .02, bt: -.08, bs: -.04, ft: .08, fs: .02, bu: -.12, bf: -.05, fu: .15, ff: .08, hb: "fist", hf: "fist" }, 1);
  else if (name === "cross") mix({ lean: -.04, bt: -.12, bs: -.05, ft: .12, fs: .03, bu: .95, bf: 2.6, fu: 1.1, ff: 2.75, hb: "fist", hf: "fist" }, 1);
  else if (name === "walk" || name === "run") {
    const sp = name === "run" ? 13 : 8, s = Math.sin(T * sp), amp = name === "run" ? .7 : .45;
    P.bt = -amp * s; P.ft = amp * s; P.bs = P.bt - .5 * (1 + s) / 2 * (name === "run" ? 1.4 : 1); P.fs = P.ft - .5 * (1 - s) / 2 * (name === "run" ? 1.4 : 1);
    P.lean = name === "run" ? .32 : .1; P.bu = .55 * s; P.bf = P.bu + (name === "run" ? 1.4 : .5); P.fu = -.55 * s; P.ff = P.fu + (name === "run" ? 1.4 : .5);
    P.air = false;
  } else if (name === "fly") {
    // flying forward: body nearly level, legs trailing, front fist leading
    Object.assign(P, { rot: 1.1, lean: 0, bt: -.15, bs: -.35, ft: .05, fs: -.2, bu: -.3, bf: -.15, fu: 2.6, ff: 2.9, air: true, hf: "fist" });
  } else if (name === "dash") {
    Object.assign(P, { rot: .75, lean: .1, bt: -.5, bs: -.85, ft: .1, fs: -.5, bu: -.6, bf: -.3, fu: 1.4, ff: 2.1, air: true });
  } else if (name === "back") {
    Object.assign(P, { rot: -.35, lean: -.1, bt: .2, bs: .5, ft: .45, fs: .8, bu: .9, bf: 2.2, fu: 1.2, ff: 2.5 });
  } else if (name === "punch") {
    // jab with alternating arms: wind back, snap forward, recover
    const out = k < .35 ? ease(k / .35) * .25 : k < .6 ? .25 + ease((k - .35) / .25) * .75 : 1 - ease((k - .6) / .4) * .7;
    const arm = P.alt % 2 ? "b" : "f";
    P.lean = lerp(.1, .3, out);
    if (arm === "f") { P.fu = lerp(.7, 1.55, out); P.ff = lerp(2.6, 1.57, out); P.bu = lerp(.5, -.1, out); P.bf = lerp(2.0, 1.2, out); }
    else { P.bu = lerp(.5, 1.55, out); P.bf = lerp(2.3, 1.57, out); P.fu = lerp(1.05, .5, out); P.ff = lerp(2.35, 2.6, out); }
  } else if (name === "kick") {
    const out = k < .3 ? ease(k / .3) * .3 : k < .55 ? .3 + ease((k - .3) / .25) * .7 : 1 - ease((k - .55) / .45) * .8;
    P.ft = lerp(.4, 1.75, out); P.fs = lerp(.1, 1.6, out); P.lean = lerp(.1, -.2, out); P.bt = lerp(-.4, -.1, out); P.bs = lerp(-.12, -.05, out);
    P.fu = lerp(1.05, .4, out); P.ff = lerp(2.35, 1.6, out); P.bu = lerp(.5, -.6, out); P.bf = lerp(2.0, -.3, out);
  } else if (name === "smash") {
    // a double-fisted hammer blow
    const up = k < .45 ? ease(k / .45) : 1 - ease((k - .45) / .25);
    P.fu = lerp(1.0, 3.0, up); P.ff = lerp(1.6, 3.1, up); P.bu = lerp(.9, 2.9, up); P.bf = lerp(1.6, 3.0, up); P.lean = lerp(.4, -.15, up);
    if (k > .45) { const d = ease(clamp((k - .45) / .2, 0, 1)); P.fu = lerp(3.0, 1.2, d); P.ff = lerp(3.1, 1.0, d); P.bu = lerp(2.9, 1.15, d); P.bf = lerp(3.0, 1.0, d); P.lean = lerp(-.15, .45, d); }
  } else if (name === "blast") {
    const rec = k > .15 && k < .45 ? Math.sin((k - .15) / .3 * Math.PI) * .25 : 0;
    const arm = P.alt % 2 ? "b" : "f";
    if (arm === "f") { P.fu = 1.55 - rec; P.ff = 1.57 - rec * .4; P.hf = "palm"; P.bu = .2; P.bf = 1.2; }
    else { P.bu = 1.55 - rec; P.bf = 1.57 - rec * .4; P.hb = "palm"; P.fu = .4; P.ff = 1.4; }
    P.lean = .12 - rec * .4; P.bt = -.5; P.ft = .45; P.fs = .1;
  } else if (name === "beamWind") {
    // the Kamehameha crouch: both cupped hands drawn back to the hip
    const s = ease(clamp(k * 2, 0, 1));
    mix({ lean: -.05, bt: -.6, bs: -.2, ft: .55, fs: .1, bu: -.65, bf: .55, fu: -.45, ff: .75, hb: "cup", hf: "cup", crouch: 5 }, s);
  } else if (name === "beam") {
    const s = ease(clamp(k * 4, 0, 1));
    mix({ lean: .22, bt: -.62, bs: -.2, ft: .5, fs: .1, bu: 1.5, bf: 1.56, fu: 1.6, ff: 1.57, hb: "palm", hf: "palm", crouch: 4 }, s);
  } else if (name === "fingerWind") {
    // two fingers to the forehead (Special Beam Cannon), or a finger raised (Death Beam)
    const s = ease(clamp(k * 2, 0, 1));
    mix({ lean: -.02, fu: 2.75, ff: -2.45, hf: "point", bu: .1, bf: .4, bt: -.45, ft: .4 }, s);
  } else if (name === "finger") {
    const s = ease(clamp(k * 5, 0, 1));
    mix({ lean: .15, fu: 1.57, ff: 1.57, hf: "point", bu: .2, bf: .5 }, s);
  } else if (name === "overhead") {
    // arms raised to gather energy (Spirit Bomb, Death Ball), then hurl it forward
    const throwK = pose.throw ? ease(clamp(k, 0, 1)) : 0;
    const up = { lean: -.08, fu: 3.05, ff: 3.1, bu: 2.95, bf: 3.05, hf: "palm", hb: "palm", bt: -.35, ft: .35 };
    mix(up, ease(clamp((pose.throw ? 1 : k) * 2, 0, 1)));
    if (throwK) mix({ lean: .35, fu: 1.7, ff: 1.6, bu: 1.6, bf: 1.5 }, throwK);
  } else if (name === "disc") {
    const throwK = pose.throw ? ease(clamp(k, 0, 1)) : 0;
    mix({ fu: 3.0, ff: 3.1, hf: "palm", bu: .3, bf: .8, lean: -.05 }, ease(clamp((pose.throw ? 1 : k) * 2, 0, 1)));
    if (throwK) mix({ fu: 1.4, ff: 1.3, lean: .3 }, throwK);
  } else if (name === "flash") {
    // Solar Flare: both hands spread at the face
    mix({ fu: 2.3, ff: 2.9, bu: 2.1, bf: 2.8, hf: "palm", hb: "palm", lean: -.1 }, ease(clamp(k * 3, 0, 1)));
  } else if (name === "charge") {
    // powering up: legs wide, fists clenched at the sides, head thrown back
    const sh = Math.sin(T * 40) * .03;
    mix({ lean: -.06 + sh, bt: -.62, bs: -.3, ft: .62, fs: .3, bu: -.35, bf: -.2, fu: .3, ff: .15, ht: -.25, crouch: 6 }, ease(clamp(k * 3, 0, 1)));
  } else if (name === "guard") {
    mix({ lean: -.08, bu: 1.25, bf: 2.75, fu: 1.35, ff: 2.6, crouch: 3, bt: -.45, ft: .4 }, ease(clamp(k * 4, 0, 1)));
  } else if (name === "hit") {
    const s = 1 - ease(k);
    P.lean = lerp(P.lean, -.55, s); P.rot = -.25 * s; P.fu += .7 * s; P.bu -= .5 * s; P.ht = -.35 * s; P.fs -= .3 * s;
  } else if (name === "ko") {
    Object.assign(P, { rot: -1.45, lean: 0, bt: -.05, bs: -.1, ft: .1, fs: .05, bu: .2, bf: .4, fu: -.4, ff: -.6, ht: -.2, hb: "palm", hf: "palm", air: true });
  } else if (name === "victory") {
    mix({ lean: -.05, bt: -.15, bs: -.05, ft: .15, fs: .05, fu: 2.95, ff: 3.05, bu: -.2, bf: .05, hf: "fist" }, ease(clamp(k * 2, 0, 1)));
  } else if (name === "swim") {
    const s = Math.sin(T * 7);
    Object.assign(P, { rot: 1.35, lean: 0, bt: -.2 + s * .3, bs: -.3, ft: -.2 - s * .3, fs: -.3, bu: 1.6 + s * 1.2, bf: 1.8 + s * 1.2, fu: 1.6 - s * 1.2, ff: 1.8 - s * 1.2, air: true, hb: "palm", hf: "palm" });
  }
  return P;
}

// ---------- hair ----------
// shapes in head units (radius 1, centre 0,0, facing +x; the forehead is at about x .7, y -.5).
// back: drawn behind the head; front: bangs over the forehead, drawn over the face.
const HAIR = {
  goku: { back: [[.55, -.8], [.42, -1.8], [.1, -1.0], [-.3, -2.0], [-.42, -1.05], [-1.15, -1.75], [-.9, -.75], [-1.95, -.95], [-1.05, -.2], [-1.85, .3], [-.98, .3], [-1.25, 1.0], [-.55, .5], [-.3, 0], [.4, -.4]],
    front: [[-.05, -.95], [.45, -1.0], [1.25, -.62], [.82, -.48], [1.1, -.12], [.62, -.32], [.66, .02], [.38, -.3], [.2, -.62]] },
  ssj: { back: [[.5, -.85], [.6, -2.15], [.12, -1.12], [-.15, -2.35], [-.4, -1.15], [-.95, -2.15], [-.85, -.95], [-1.75, -1.55], [-1.05, -.45], [-1.95, -.6], [-1.05, -.05], [-1.6, .4], [-.85, .35], [-.4, .05], [.3, -.45]],
    front: [[0, -.95], [.5, -1.05], [1.05, -1.25], [.85, -.68], [1.15, -.42], [.68, -.42], [.72, -.05], [.4, -.35], [.2, -.65]], glow: 1 },
  gohan: { back: [[.5, -.85], [.25, -1.55], [-.1, -1.05], [-.55, -1.6], [-.65, -.95], [-1.3, -1.25], [-1.0, -.55], [-1.6, -.4], [-1.05, .05], [-1.35, .55], [-.6, .35], [-.3, 0], [.4, -.45]],
    front: [[-.05, -.95], [.45, -1.0], [1.1, -.75], [.8, -.5], [1.0, -.18], [.58, -.38], [.4, -.3], [.2, -.62]] },
  vegeta: { back: [[.72, -.5], [.62, -1.2], [.48, -2.35], [.12, -1.35], [-.18, -2.4], [-.42, -1.3], [-.8, -2.15], [-.85, -1.05], [-1.3, -1.65], [-1.1, -.55], [-1.4, -.55], [-1.0, .05], [-.55, .2], [-.3, 0], [.25, -.55], [.42, -.62]] },
  raditz: { back: [[.55, -.8], [.42, -1.75], [.1, -1.0], [-.3, -1.9], [-.45, -1.0], [-1.15, -1.65], [-.95, -.7], [-1.85, -.6], [-1.6, .4], [-2.2, 1.6], [-1.9, 3.6], [-2.45, 5.4], [-1.55, 4.2], [-1.25, 6.4], [-.95, 3.9], [-.55, 5.2], [-.6, 2.4], [-.75, .9], [-.4, .2], [.4, -.4]],
    front: [[-.05, -.95], [.45, -1.0], [1.2, -.6], [.8, -.48], [1.05, -.15], [.6, -.32], [.38, -.3], [.2, -.62]] },
  bardock: { back: [[.55, -.8], [.45, -1.85], [.1, -1.0], [-.3, -2.05], [-.42, -1.05], [-1.2, -1.8], [-.9, -.75], [-2.0, -1.0], [-1.05, -.2], [-1.9, .3], [-.98, .3], [-1.3, 1.0], [-.55, .5], [-.3, 0], [.4, -.4]],
    front: [[-.05, -.95], [.45, -1.05], [1.3, -.7], [.85, -.52], [1.15, -.2], [.62, -.32], [.38, -.3], [.2, -.62]] },
  yamcha: { back: [[.5, -.85], [.3, -1.45], [-.15, -1.05], [-.6, -1.4], [-.75, -.85], [-1.35, -.95], [-1.05, -.35], [-1.6, .25], [-1.15, .5], [-1.3, 1.15], [-.7, .6], [-.35, .05], [.4, -.45]],
    front: [[-.05, -.95], [.45, -1.0], [1.15, -.68], [.8, -.48], [1.0, -.2], [.58, -.36], [.38, -.3], [.2, -.62]] },
  yajirobe: { back: [[.5, -.85], [.15, -1.35], [-.3, -1.05], [-.75, -1.3], [-.85, -.8], [-1.35, -.7], [-1.05, -.2], [-1.35, .3], [-.65, .3], [-.3, 0], [.4, -.45]],
    front: [[0, -.95], [.45, -1.0], [.95, -.7], [.65, -.55], [.75, -.3], [.4, -.45]] },
  recoome: { back: [[.55, -.82], [.5, -1.6], [.15, -1.15], [-.1, -1.75], [-.4, -1.1], [-.75, -1.6], [-.85, -.95], [-1.15, -1.15], [-1.0, -.45], [-.5, -.05], [.3, -.5]] },
  jeice: { back: [[.55, -.85], [0, -1.08], [-.65, -1.1], [-1.15, -.75], [-1.35, -.1], [-1.4, .75], [-.95, .85], [-.9, .3], [-.45, .1], [.3, -.5]],
    front: [[.0, -1.0], [.5, -1.02], [.95, -.72], [1.0, -.3], [.65, -.5], [.42, -.4], [.2, -.6]] },
  zarbon: { back: [[.55, -.85], [0, -1.08], [-.65, -1.08], [-1.1, -.72], [-1.15, -.1], [-1.05, .45], [-.75, .6], [-.5, .15], [.3, -.5]],
    front: [[0, -1.0], [.5, -1.02], [.95, -.68], [.8, -.42], [.42, -.6], [.2, -.55]], braid: 1 },
  short: { back: [[.55, -.85], [0, -1.08], [-.6, -1.08], [-1.05, -.65], [-1.1, -.15], [-.75, .15], [-.45, .1], [.3, -.5]],
    front: [[0, -1.0], [.5, -1.02], [.9, -.6], [.48, -.6], [.2, -.55]] },
  ogre: { back: [[.55, -.85], [0, -1.1], [-.55, -1.1], [-1.0, -.8], [-1.1, -.2], [-.75, .1], [-.45, .1], [.3, -.5]], front: [[0, -1.0], [.5, -1.02], [.78, -.72], [.35, -.65]] },
};
const HAIR_CAP = [[.66, -.6], [.45, -1.04], [-.35, -1.12], [-.95, -.66], [-1.02, .05], [-.8, .52], [-.62, .22], [-.6, -.15], [-.22, -.36], [.25, -.52]];
function hairPath(g, pts, ox, oy, r, fill, glow) {
  if (glow) { g.save(); g.shadowColor = "#fff2a0"; g.shadowBlur = r * 1.4; }
  blob(g, pts.map(p => [ox + p[0] * r, oy + p[1] * r]), fill);
  if (glow) g.restore();
  // a highlight streak along the top of the hair
  g.save(); g.globalAlpha = glow ? .6 : .28; g.strokeStyle = shade(fill, glow ? .7 : .55); g.lineWidth = r * .12; g.lineCap = "round";
  g.beginPath(); g.moveTo(ox - r * .1, oy - r * 1.05); g.quadraticCurveTo(ox + r * .25, oy - r * 1.2, ox + r * .5, oy - r * 1.0); g.stroke(); g.restore();
}

// ---------- heads ----------
// anime eyes: a white almond, a big iris with a glint, a heavy upper lash and a brow
function drawEye(g, x, y, s, f, near, T) {
  const angry = f.brow === "angry" || f.villain, iris = f.eyec || "#141418", w = s * (near ? 1 : .62);
  g.save();
  g.beginPath(); g.ellipse(x, y, w, s * 1.12, 0, 0, Math.PI * 2);
  g.fillStyle = "#fbfbff"; g.fill();
  g.clip();
  circ(g, x + w * .35, y + s * .15, s * .72, iris);
  circ(g, x + w * .42, y + s * .18, s * .36, INK);
  circ(g, x + w * .1, y - s * .25, s * .24, "#ffffff");
  g.restore();
  // upper lash and lower line
  g.strokeStyle = INK; g.lineCap = "round";
  g.lineWidth = Math.max(1.4, s * .42);
  g.beginPath(); g.ellipse(x, y, w * 1.05, s * 1.15, 0, Math.PI * (angry ? 1.12 : 1.08), Math.PI * 1.95); g.stroke();
  g.lineWidth = Math.max(.8, s * .16);
  g.beginPath(); g.ellipse(x, y, w, s * 1.1, 0, Math.PI * .2, Math.PI * .8); g.stroke();
  // brow
  g.lineWidth = Math.max(1.4, s * .42);
  g.beginPath();
  if (angry) { g.moveTo(x - w * 1.1, y - s * 1.75); g.lineTo(x + w * 1.15, y - s * 1.2); }
  else { g.moveTo(x - w * 1.0, y - s * 1.6); g.quadraticCurveTo(x, y - s * 1.95, x + w * 1.05, y - s * 1.55); }
  g.stroke();
}
function drawFace(g, f, cx, cy, r, T, P) {
  const kid = f.kid || 0, es = r * lerp(.17, .21, kid), ey = cy + r * .16;
  // ear (pointed for Namekians)
  if (f.ears === "point") blob(g, [[cx - r * .25, cy - r * .02], [cx - r * 1.3, cy - r * .62], [cx - r * .3, cy + r * .38]], f.skin);
  else if (!f.fins && !f.eggHead) { ell(g, cx - r * .38, cy + r * .12, r * .2, r * .27, 0, f.skin); g.strokeStyle = shade(f.skin, -.35); g.lineWidth = 1; g.beginPath(); g.arc(cx - r * .38, cy + r * .12, r * .1, -1.2, 1.2); g.stroke(); }
  // eyes
  if (f.bigEyes) { ell(g, cx + r * .4, ey - r * .05, r * .28, r * .36, -.2, f.eyec || "#c8202a"); ell(g, cx + r * .82, ey - r * .02, r * .16, r * .32, -.2, f.eyec || "#c8202a"); circ(g, cx + r * .45, ey - r * .14, r * .08, "#fff"); }
  else {
    drawEye(g, cx + r * .36, ey, es, f, true, T);
    drawEye(g, cx + r * .8, ey - r * .02, es, f, false, T);
    if (f.fourEyes) { drawEye(g, cx + r * .26, ey - r * .55, es * .85, f, true, T); drawEye(g, cx + r * .7, ey - r * .56, es * .85, f, false, T); }
  }
  if (f.thirdEye) { g.save(); g.translate(cx + r * .6, cy - r * .45); g.rotate(-.15); ell(g, 0, 0, r * .09, r * .18, 0, "#fbfbff"); circ(g, r * .02, r * .02, r * .065, INK); g.restore(); }
  if (f.dots) for (const [dx, dy] of [[.2, -.62], [.42, -.66], [.62, -.6], [.3, -.42], [.52, -.44]]) circ(g, cx + dx * r, cy + dy * r, r * .05, "#4a3030");
  // nose and mouth
  g.strokeStyle = shade(f.skin, -.45); g.lineWidth = 1.2; g.lineCap = "round";
  g.beginPath(); g.moveTo(cx + r * 1.0, cy + r * .32); g.lineTo(cx + r * 1.08, cy + r * .46); g.lineTo(cx + r * .98, cy + r * .5); g.stroke();
  const shout = P && P.mouth === "open";
  g.strokeStyle = INK; g.lineWidth = 1.4;
  if (shout) ell(g, cx + r * .72, cy + r * .72, r * .13, r * .1, 0, "#5a1a1a", true);
  else { g.beginPath(); g.moveTo(cx + r * .58, cy + r * .74); g.quadraticCurveTo(cx + r * .72, cy + r * (f.villain ? .7 : .78), cx + r * .86, cy + r * (f.villain ? .68 : .72)); g.stroke(); }
  if (f.mustache) blob(g, [[cx + r * .52, cy + r * .58], [cx + r * 1.02, cy + r * .54], [cx + r * 1.08, cy + r * .86], [cx + r * .92, cy + r * .68], [cx + r * .52, cy + r * .72]], f.mustache);
  if (f.cheek) { g.globalAlpha = .75; circ(g, cx + r * .35, cy + r * .5, r * .15, f.cheek); circ(g, cx + r * .85, cy + r * .48, r * .09, f.cheek); g.globalAlpha = 1; }
  if (f.scar) { g.strokeStyle = shade(f.skin, -.4); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + r * .18, cy - r * .35); g.lineTo(cx + r * .42, cy + r * .02); g.moveTo(cx + r * .55, cy + r * .45); g.lineTo(cx + r * .75, cy + r * .58); g.stroke(); }
  if (f.spots) for (const [dx, dy, s] of [[-.2, -.4, .14], [.1, -.75, .1], [-.5, -.1, .12], [.55, .3, .08]]) circ(g, cx + dx * r, cy + dy * r, r * s, f.spots);
}
function drawHeadBase(g, f, cx, cy, r) {
  const sk = f.skin;
  if (f.eggHead) { smooth(g, [[cx - r * 1.1, cy - r * 1.6], [cx + r * .4, cy - r * 1.4], [cx + r * 1.05, cy - r * .2], [cx + r * .9, cy + r * .9], [cx - r * .2, cy + r * .98], [cx - r * 1.05, cy + r * .2]], sk); return; }
  // cranium, then a jaw that narrows toward the chin at the front
  smooth(g, [[cx - r * .92, cy - r * .5], [cx - r * .55, cy - r * 1.0], [cx + r * .45, cy - r * 1.02], [cx + r * 1.0, cy - r * .4], [cx + r * 1.08, cy + r * .4],
    [cx + r * .85, cy + r * .86], [cx + r * .45, cy + r * 1.02], [cx - r * .2, cy + r * .82], [cx - r * .78, cy + r * .4]], sk);
  g.save(); g.globalAlpha = .16; circ(g, cx - r * .45, cy + r * .15, r * .5, shade(sk, -.6)); g.restore();
}
function drawHead(g, f, c, T, P) {
  const r = c.r, cx = c.x, cy = c.y, hs = f.hs && HAIR[f.hs];
  g.save(); g.translate(cx, cy); g.rotate(P.ht || 0); g.translate(-cx, -cy);
  if (f.body === "frieza1" || f.body === "frieza2" || f.body === "frieza3" || f.body === "frieza4") { drawFriezaHead(g, f, cx, cy, r, T, P); g.restore(); return; }
  if (f.body === "saiba") { drawSaibaHead(g, f, cx, cy, r, T); g.restore(); return; }
  if (f.body === "bug") { drawBugHead(g, f, cx, cy, r, T); g.restore(); return; }
  const hairC = f.hair || "#141418";
  // things behind the head
  if (hs && hs.braid) { limb(g, [cx - r * .9, cy - r * .1], [cx - r * 1.5, cy + r * 2.4], r * .4, hairC); circ(g, cx - r * 1.5, cy + r * 2.5, r * .28, f.earring || "#ffd34d"); }
  if (f.fins) blob(g, [[cx - r * .2, cy - r * .95], [cx - r * 1.2, cy - r * 1.6], [cx - r * 1.6, cy - r * .9], [cx - r * 1.0, cy - r * .3]], f.fins);
  if (f.horns === "ginyu") for (const s of [-1, 1]) { const bx = cx + r * (s < 0 ? -.35 : .35); blob(g, [[bx - r * .18, cy - r * .9], [bx - r * .4, cy - r * 1.7], [bx - r * .05, cy - r * 2.0], [bx + r * .18, cy - r * .95]], "#2a2a30"); }
  if (hs) hairPath(g, hs.back, cx, cy, r, hairC, hs.glow);
  drawHeadBase(g, f, cx, cy, r);
  // the hair covers the top and back of the skull
  if (hs) {
    const cp = (hs.cap || HAIR_CAP).map(p => [cx + p[0] * r, cy + p[1] * r]);
    blob(g, cp, hairC, false);
    g.strokeStyle = INK; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath(); cp.slice(5).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  }
  if (f.spikes) for (let k = 0; k < 6; k++) { const a = -2.6 + k * .45, bx = cx + Math.cos(a) * r * .85, by = cy + Math.sin(a) * r * .85; blob(g, [[bx - r * .18, by], [bx + Math.cos(a) * r * .6, by + Math.sin(a) * r * .6], [bx + r * .18, by]], f.spikes); }
  drawFace(g, f, cx, cy, r, T, P);
  if (f.headband) { g.strokeStyle = INK; g.lineWidth = r * .3 + 2; g.beginPath(); g.moveTo(cx - r * .95, cy - r * .4); g.lineTo(cx + r * .98, cy - r * .5); g.stroke(); g.strokeStyle = f.headband; g.lineWidth = r * .3; g.stroke(); limb(g, [cx - r * .9, cy - r * .4], [cx - r * 1.7, cy - r * .1 + Math.sin(T * 6) * r * .2], r * .2, f.headband); }
  if (hs && hs.front) hairPath(g, hs.front, cx, cy, r, hairC, hs.glow);
  if (f.antennae) for (const [dx, len] of [[.15, 1.0], [.5, .9]]) { const b = [cx + dx * r, cy - r * .9], e = [b[0] + r * .45, b[1] - r * len]; g.strokeStyle = INK; g.lineWidth = 3.2; g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo(b[0] + r * .05, e[1] + r * .3, e[0], e[1]); g.stroke(); g.strokeStyle = f.skin; g.lineWidth = 1.6; g.stroke(); circ(g, e[0], e[1], r * .12, f.skin); }
  if (f.turban) {
    smooth(g, [[cx - r * 1.0, cy - r * .25], [cx - r * 1.05, cy - r * 1.35], [cx - r * .2, cy - r * 1.75], [cx + r * .85, cy - r * 1.35], [cx + r * 1.05, cy - r * .45], [cx + r * .2, cy - r * .55]], f.turban);
    blob(g, [[cx - r * 1.02, cy - r * .3], [cx + r * 1.05, cy - r * .5], [cx + r * 1.05, cy - r * .82], [cx - r * 1.03, cy - r * .62]], f.turban2 || "#5a3ea8");
  }
  if (f.hat) smooth(g, [[cx - r * .7, cy - r * .7], [cx - r * .5, cy - r * 1.35], [cx + r * .3, cy - r * 1.45], [cx + r * .8, cy - r * .85]], f.hat);
  if (f.crown) blob(g, [[cx - r * .7, cy - r * .8], [cx - r * .8, cy - r * 1.6], [cx - r * .4, cy - r * 1.2], [cx, cy - r * 1.75], [cx + r * .4, cy - r * 1.2], [cx + r * .8, cy - r * 1.6], [cx + r * .7, cy - r * .8]], f.crown);
  if (f.horns === "ogre") for (const dx of [-.3, .35]) blob(g, [[cx + dx * r - r * .15, cy - r * .9], [cx + dx * r, cy - r * 1.55], [cx + dx * r + r * .15, cy - r * .9]], "#f2e6c8");
  if (f.scouter) {
    // ear piece and the coloured lens in front of the eye
    ell(g, cx - r * .45, cy + r * .05, r * .32, r * .38, 0, "#d8dce6");
    g.strokeStyle = INK; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx - r * .3, cy - r * .2); g.lineTo(cx + r * .55, cy - r * .3); g.stroke();
    g.strokeStyle = "#d8dce6"; g.lineWidth = 1.3; g.stroke();
    g.save(); g.globalAlpha = .7; blob(g, [[cx + r * .55, cy - r * .45], [cx + r * 1.15, cy - r * .35], [cx + r * 1.1, cy + r * .15], [cx + r * .55, cy + r * .1]], f.scouter); g.restore();
  }
  g.restore();
}
// Frieza's four forms: the purple dome, the horns, the long third-form skull
function drawFriezaHead(g, f, cx, cy, r, T, P) {
  const sk = f.skin, dome = f.dome || "#7a3ab8", b = f.body;
  if (b === "frieza1" || b === "frieza2") {
    const big = b === "frieza2" ? 1.5 : 1;
    for (const s of [-1, 1]) { const bx = cx + r * (s < 0 ? -.55 : .3); blob(g, [[bx - r * .2, cy - r * .45], [bx - r * .55 * big, cy - r * 1.3 * big], [bx - r * .1 * big, cy - r * 2.0 * big], [bx + r * .05, cy - r * 1.25 * big], [bx + r * .25, cy - r * .55]], "#2a2a30"); }
  }
  if (b === "frieza3") {
    // the long skull sweeping back, with ridges
    smooth(g, [[cx - r * .4, cy - r * .9], [cx - r * 2.6, cy - r * 1.9], [cx - r * 3.0, cy - r * 1.3], [cx - r * 1.1, cy + r * .2], [cx + r * .4, cy + r * .2]], sk);
    g.strokeStyle = shade(dome, -.2); g.lineWidth = 2;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(cx - r * (.8 + k * .5), cy - r * (1.0 + k * .22)); g.lineTo(cx - r * (.6 + k * .5), cy - r * (.4 + k * .15)); g.stroke(); }
  }
  drawHeadBase(g, f, cx, cy, r);
  // the dome on top
  g.save();
  g.beginPath(); g.ellipse(cx + r * .02, cy - r * .35, r * 1.02, r * .78, 0, Math.PI, Math.PI * 2); g.closePath();
  g.fillStyle = dome; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  g.globalAlpha = .45; circ(g, cx - r * .2, cy - r * .85, r * .25, "#ffffff"); g.restore();
  // face: purple-black lips, red eyes, cheek lines
  drawEye(g, cx + r * .34, cy + r * .1, r * .2, { ...f, villain: 1 }, true, T);
  drawEye(g, cx + r * .78, cy + r * .06, r * .17, { ...f, villain: 1 }, false, T);
  g.strokeStyle = "#3a1a4a"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx + r * .52, cy + r * .66); g.quadraticCurveTo(cx + r * .7, cy + r * .58, cx + r * .9, cy + r * .62); g.stroke();
  g.strokeStyle = shade(sk, -.3); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + r * .1, cy + r * .35); g.lineTo(cx + r * .25, cy + r * .7); g.stroke();
  if (f.kaioken) { /* never */ }
}
function drawSaibaHead(g, f, cx, cy, r, T) {
  const sk = f.skin;
  smooth(g, [[cx - r * 1.1, cy - r * .2], [cx - r * .9, cy - r * 1.25], [cx, cy - r * 1.55], [cx + r * .9, cy - r * 1.1], [cx + r * 1.15, cy - r * .1], [cx + r * .85, cy + r * .75], [cx - r * .1, cy + r * .9], [cx - r * .9, cy + r * .55]], sk);
  g.strokeStyle = shade(sk, -.35); g.lineWidth = 1.5;
  for (const [a, b2, c2, d] of [[-.7, -.9, -.2, -1.3], [.1, -1.4, .5, -.7], [-.9, -.2, -.5, .3], [.3, -.4, .8, -.6]]) { g.beginPath(); g.moveTo(cx + a * r, cy + b2 * r); g.quadraticCurveTo(cx + (a + c2) / 2 * r + r * .2, cy + (b2 + d) / 2 * r, cx + c2 * r, cy + d * r); g.stroke(); }
  // dark eye ridges and a slit mouth
  ell(g, cx + r * .55, cy - r * .05, r * .32, r * .16, -.3, "#1a2a10"); ell(g, cx + r * .95, cy - r * .08, r * .18, r * .13, -.3, "#1a2a10");
  circ(g, cx + r * .6, cy - r * .07, r * .06, f.eyec || "#ff3a3a");
  g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + r * .45, cy + r * .5); g.lineTo(cx + r * .95, cy + r * .42); g.stroke();
}
function drawBugHead(g, f, cx, cy, r, T) {
  const sk = f.skin;
  for (const dx of [.0, .35]) { g.strokeStyle = INK; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx + dx * r, cy - r * .9); g.quadraticCurveTo(cx + dx * r + r * .6, cy - r * 2.2, cx + dx * r + r * 1.2, cy - r * 1.8); g.stroke(); g.strokeStyle = sk; g.lineWidth = 1.2; g.stroke(); }
  smooth(g, [[cx - r * .9, cy - r * .3], [cx - r * .5, cy - r * 1.05], [cx + r * .55, cy - r * 1.0], [cx + r * 1.1, cy - r * .1], [cx + r * 1.2, cy + r * .55], [cx + r * .5, cy + r * .95], [cx - r * .5, cy + r * .7]], sk);
  ell(g, cx + r * .55, cy - r * .2, r * .38, r * .32, -.2, f.eyec || "#ff3a3a"); circ(g, cx + r * .45, cy - r * .3, r * .1, "#ffffff");
  blob(g, [[cx + r * 1.0, cy + r * .5], [cx + r * 1.5, cy + r * .75], [cx + r * 1.0, cy + r * .82]], shade(sk, -.3));
  if (f.crown) blob(g, [[cx - r * .6, cy - r * .9], [cx - r * .7, cy - r * 1.6], [cx - r * .3, cy - r * 1.2], [cx + r * .1, cy - r * 1.7], [cx + r * .45, cy - r * 1.15], [cx + r * .8, cy - r * 1.5], [cx + r * .6, cy - r * .85]], f.crown);
}

// ---------- hands and feet ----------
function drawHand(g, p, a, shape, col, s) {
  if (shape === "palm" || shape === "cup") {
    g.save(); g.translate(p[0], p[1]); g.rotate(-a + Math.PI / 2);
    ell(g, s * .3, 0, s * 1.1, s * .78, 0, col);
    g.strokeStyle = shade(col, -.35); g.lineWidth = 1; g.beginPath(); g.moveTo(s * .6, -s * .45); g.lineTo(s * 1.2, -s * .4); g.moveTo(s * .7, 0); g.lineTo(s * 1.3, 0); g.stroke();
    g.restore();
  } else if (shape === "point") {
    circ(g, p[0], p[1], s * 1.02 + 1.1, INK); circ(g, p[0], p[1], s * 1.02, col);
    const e = seg(p, a, s * 2.1); limb(g, p, e, s * .55, col, false);
  } else { circ(g, p[0], p[1], s + 1.1, INK); circ(g, p[0], p[1], s, col); g.save(); g.globalAlpha = .35; circ(g, p[0] - s * .25, p[1] - s * .3, s * .45, shade(col, .5)); g.restore(); }
}
function drawBoot(g, knee, ankle, a, f, M, col, trim) {
  const w = M.wL2 * 1.12, mid = [lerp(knee[0], ankle[0], .5), lerp(knee[1], ankle[1], .5)];
  limb(g, mid, ankle, w, col, true);
  if (trim) { g.strokeStyle = trim; g.lineWidth = w * .5; g.lineCap = "butt"; g.beginPath(); g.moveTo(mid[0], mid[1]); g.lineTo(lerp(mid[0], ankle[0], .2), lerp(mid[1], ankle[1], .2)); g.stroke(); g.lineCap = "round"; }
  // the foot points forward, at right angles to the shin
  const fwd = Dv(a + Math.PI / 2), len = M.wL2 * .95;
  const tip = [ankle[0] + fwd[0] * len, ankle[1] + fwd[1] * len];
  limb(g, ankle, tip, M.wL2 * .95, col, false);
}

// ---------- the figure ----------
function figBodyColors(f) {
  const sk = f.skin, bare = f.body === "frieza2" || f.body === "frieza3" || f.body === "frieza4" || f.body === "saiba";
  if (bare) return { sk, legs: sk, torso: sk, upper: sk, fore: sk, hand: sk, boots: sk, trim: null };
  const armored = !!f.armor;
  return {
    sk, legs: armored ? f.suit || "#2a2a3a" : f.pants || sk,
    torso: f.top || (armored ? f.suit || "#2a2a3a" : sk),
    upper: armored ? (f.sleeves === "none" ? sk : f.suit || "#2a2a3a") : (f.sleeves === "short" || f.sleeves === "long") ? (f.under || f.top || sk) : sk,
    fore: armored ? sk : f.sleeves === "long" ? (f.under || f.top || sk) : sk,
    hand: f.glove || sk, boots: f.boots || shade(f.pants || sk, -.4), trim: f.bootTrim,
  };
}
function drawFigure(g, f, pose) {
  if (f.body === "ape") return drawApe(g, f, pose);
  if (f.body === "dino") return drawDino(g, f, pose);
  if (f.kaioken) f = { ...f, skin: mixHex(f.skin, "#ff3a2a", .38), kaioken: 0 };
  const P = figPose(f, pose), M = metrics(f), H = f.h || 1, T = pose.time || 0, C = figBodyColors(f);
  const frz = /^frieza/.test(f.body);
  const out = {};
  g.save(); g.scale(H, H);
  // skeleton from the hip
  const legLen = M.thigh + M.shin;
  let hip = [0, -legLen - 2 + (P.crouch || 0)];
  const bk = seg(hip, P.bt, M.thigh), ba = seg(bk, P.bs, M.shin), fk = seg(hip, P.ft, M.thigh), fa = seg(fk, P.fs, M.shin);
  if (!P.air) { const low = Math.max(ba[1], fa[1]); const dy = -2 - low; for (const p of [hip, bk, ba, fk, fa]) p[1] += dy; }
  const sh = seg(hip, Math.PI - P.lean, M.torso);
  const headC = seg(sh, Math.PI - P.lean * .6, M.neck + M.headR * .85);
  // whole-body rotation (flying, falling) about the hip
  g.translate(hip[0], hip[1]); g.rotate(P.rot || 0); g.translate(-hip[0], -hip[1]);
  const shB = [sh[0] - 3 * M.B, sh[1] + 1], shF = [sh[0] + 2.5 * M.B, sh[1] + 1];
  const be = seg(shB, P.bu, M.arm1), bh = seg(be, P.bf, M.arm2), fe = seg(shF, P.fu, M.arm1), fh = seg(fe, P.ff, M.arm2);
  const sway = Math.sin(T * 2.2) * .12;
  // tail and cape behind everything
  if (f.tail && (f.tailOut || frz)) drawTail(g, f, hip, M, T, frz);
  if (f.cape) drawCape(g, f, sh, hip, M, T, P);
  // back arm, back leg
  drawArm(g, f, C, M, shB, be, bh, P.bu, P.bf, P.hb, false, out, "b");
  drawLeg(g, f, C, M, hip, bk, ba, P.bs, false);
  if (f.armor && f.padStyle !== "none" && !frz) drawPad(g, f, sh, M, false);
  if (f.cape && f.capePads) drawCapePad(g, f, sh, M, false);
  // torso
  drawTorso(g, f, C, M, hip, sh, P, T);
  drawLeg(g, f, C, M, hip, fk, fa, P.fs, true);
  // head
  drawHead(g, f, { x: headC[0], y: headC[1], r: M.headR }, T, P);
  out.head = [headC[0], headC[1]]; out.top = [headC[0], headC[1] - M.headR * 1.8];
  // front arm (and pads over the shoulder)
  drawArm(g, f, C, M, shF, fe, fh, P.fu, P.ff, P.hf, true, out, "f");
  if (f.cape && f.capePads) drawCapePad(g, f, sh, M, true);
  if (f.armor && f.padStyle !== "none" && !frz) drawPad(g, f, sh, M, true);
  if (f.sword && !out.hand2) { /* sword drawn on the back */ }
  out.chest = [lerp(hip[0], sh[0], .55), lerp(hip[1], sh[1], .55)];
  out.feet = [hip[0], 0];
  g.restore();
  // scale the anchor points back to figure space
  for (const k in out) if (Array.isArray(out[k])) out[k] = [out[k][0] * H, out[k][1] * H];
  // the anchors ignore body rotation except for the hands; good enough for effects
  return out;
}
function drawArm(g, f, C, M, s, e, h, ua, fa, shape, front, out, tag) {
  const frz = /^frieza/.test(f.body);
  limb(g, s, e, M.wA1, C.upper);
  limb(g, e, h, M.wA2, C.fore);
  if (frz && f.body !== "frieza1") { const m = [lerp(e[0], h[0], .5), lerp(e[1], h[1], .5)]; limb(g, m, [lerp(e[0], h[0], .85), lerp(e[1], h[1], .85)], M.wA2 * 1.05, f.dome || "#7a3ab8", false); }
  if (f.wrist && !f.armor) { const w = [lerp(e[0], h[0], .78), lerp(e[1], h[1], .78)]; limb(g, w, h, M.wA2 * 1.12, f.wrist, false); }
  if (f.glove) { const w = [lerp(e[0], h[0], .7), lerp(e[1], h[1], .7)]; limb(g, w, h, M.wA2 * 1.1, f.glove, false); }
  drawHand(g, h, fa, shape, C.hand, M.fist);
  out["hand" + (front ? "" : "2")] = [h[0], h[1]]; out["hand" + tag] = [h[0], h[1]];
}
function drawLeg(g, f, C, M, hip, k, a, sa, front) {
  const frz = /^frieza/.test(f.body);
  limb(g, hip, k, M.wL1, C.legs);
  limb(g, k, a, M.wL2, C.legs);
  if (frz) { const m = [lerp(k[0], a[0], .35), lerp(k[1], a[1], .35)]; limb(g, m, [lerp(k[0], a[0], .8), lerp(k[1], a[1], .8)], M.wL2 * 1.08, f.dome || "#7a3ab8", false); const fwd = Dv(sa + Math.PI / 2); limb(g, a, [a[0] + fwd[0] * M.wL2 * .9, a[1] + fwd[1] * M.wL2 * .9], M.wL2 * .9, C.sk, false); return; }
  if (f.body === "saiba" || f.body === "bug" && !f.boots) { const fwd = Dv(sa + Math.PI / 2); limb(g, a, [a[0] + fwd[0] * M.wL2, a[1] + fwd[1] * M.wL2], M.wL2 * .85, C.sk, false); return; }
  drawBoot(g, k, a, sa, f, M, C.boots, C.trim);
}
function drawTorso(g, f, C, M, hip, sh, P, T) {
  const w = M.wT, d = [sh[0] - hip[0], sh[1] - hip[1]], L = Math.hypot(d[0], d[1]), n = [-d[1] / L, d[0] / L];
  // n points to the front of the body (perpendicular to the spine)
  const at = (t, side) => [hip[0] + d[0] * t + n[0] * side, hip[1] + d[1] * t + n[1] * side];
  const frz = /^frieza/.test(f.body), wide = f.body === "saiba" ? .9 : 1;
  const pts = [at(-.06, -w * .36), at(.35, -w * .34 * wide), at(.78, -w * .44), at(1.0, -w * .42), at(1.1, 0), at(1.0, w * .4), at(.72, w * .5 * wide), at(.38, w * .34), at(.05, w * .34), at(-.08, w * .2)];
  smooth(g, pts, C.torso);
  if (f.top && f.under && !f.armor) {
    // the undershirt shows at the neck: a V on the chest
    blob(g, [at(1.04, -w * .02), at(.74, w * .3), at(1.0, w * .4)], f.under, false);
  }
  if (f.kanji && f.top && !f.armor) {
    const c = at(.66, w * .22); circ(g, c[0], c[1], w * .15 + 1, INK); circ(g, c[0], c[1], w * .15, "#f2f2f6");
    g.fillStyle = INK; g.font = `900 ${w * .2}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(f.kanji, c[0], c[1] + .5);
  }
  if (f.torn) { g.fillStyle = f.under || "#2f5fd8"; for (const [t, s] of [[.6, .3], [.82, -.2]]) { const c = at(t, w * s); ell(g, c[0], c[1], w * .14, w * .2, .4, C.sk, false); } }
  if (f.armor && !frz) {
    // battle armour: a chest plate, the belly guard and a belt line
    const plate = [at(.36, -w * .44), at(1.02, -w * .5), at(1.14, 0), at(1.02, w * .48), at(.68, w * .58), at(.36, w * .46)];
    smooth(g, plate, f.armor);
    g.strokeStyle = shade(f.armor, -.25); g.lineWidth = 1.4;
    const a1 = at(.6, -w * .45), a2 = at(.6, w * .55); g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.stroke();
    const b1 = at(.47, -w * .44), b2 = at(.47, w * .48); g.beginPath(); g.moveTo(b1[0], b1[1]); g.lineTo(b2[0], b2[1]); g.stroke();
  }
  if (frz) {
    // Frieza's purple domes: shoulders and chest (the first form wears armour instead)
    if (f.body === "frieza1") { smooth(g, [at(.35, -w * .58), at(1.02, -w * .6), at(1.12, 0), at(1.02, w * .6), at(.38, w * .58)], f.armor || "#f2ecd8"); drawPad(g, { ...f, padStyle: "frieza" }, sh, M, false); }
    else {
      const c = at(.78, w * .18); ell(g, c[0], c[1], w * .3, w * .24, 0, f.dome || "#7a3ab8"); circ(g, c[0] - w * .08, c[1] - w * .08, w * .08, "#e8c8ff");
      const s2 = at(1.0, -w * .1); ell(g, s2[0], s2[1], w * .42, w * .32, 0, f.dome || "#7a3ab8");
    }
    if (f.body === "frieza3") for (let k = 0; k < 3; k++) { const b = at(.6 + k * .18, -w * .55); blob(g, [[b[0], b[1]], [b[0] - w * .45, b[1] - w * .05], [b[0] - w * .05, b[1] - w * .25]], f.skin); }
    if (f.veins) { g.strokeStyle = "#ff8ad8"; g.lineWidth = 1; g.globalAlpha = .6; const v = at(.7, w * .1); g.beginPath(); g.moveTo(v[0], v[1]); g.lineTo(v[0] + 4, v[1] - 6); g.lineTo(v[0] + 1, v[1] - 10); g.stroke(); g.globalAlpha = 1; }
  }
  // belt or sash; a Saiyan's tail wraps the waist like a belt
  const beltC = f.belt || (f.tail && !f.tailOut && !frz ? f.tail : null) || (f.sash || null);
  if (beltC && f.body === "human") {
    const b1 = at(.06, -w * .38), b2 = at(.06, w * .36), b3 = at(.19, w * .36), b4 = at(.19, -w * .37);
    blob(g, [b1, b2, b3, b4], beltC);
    if (f.belt && !f.armor) { const k1 = at(.1, w * .5); limb(g, k1, [k1[0] + 2, k1[1] + 9], 3, beltC, false); }
  }
  if (f.tail && !f.tailOut && !frz && f.belt) { const t1 = at(.24, -w * .36), t2 = at(.24, w * .36); g.strokeStyle = f.tail; g.lineWidth = 3.4; g.beginPath(); g.moveTo(t1[0], t1[1]); g.lineTo(t2[0], t2[1]); g.stroke(); }
  if (f.sword) { const s0 = at(.95, -w * .7), s1 = [s0[0] - 18, s0[1] + 30]; limb(g, s0, s1, 3, "#5a3a2a", false); limb(g, s0, [s0[0] + 6, s0[1] - 10], 2.6, f.sword, false); }
}
function drawPad(g, f, sh, M, front) {
  const c = f.pad || "#c8a050", s = f.padStyle || "saiyan";
  if (s === "ginyu" && !front) return;
  const x = sh[0] + (front ? 1 : -3), y = sh[1] - 2;
  if (s === "saiyan") { smooth(g, [[x - M.wA1 * 1.2, y + M.wA1 * .2], [x - M.wA1 * .9, y - M.wA1 * .75], [x + M.wA1 * .5, y - M.wA1 * .85], [x + M.wA1 * 1.15, y - M.wA1 * .1], [x + M.wA1 * .8, y + M.wA1 * .55], [x - M.wA1 * .4, y + M.wA1 * .5]], c);
    g.strokeStyle = shade(c, -.3); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - M.wA1 * .8, y - M.wA1 * .1); g.quadraticCurveTo(x, y - M.wA1 * .5, x + M.wA1 * .8, y); g.stroke(); }
  else ell(g, x + 1, y + 2, M.wA1 * .62, M.wA1 * .42, -.25, c);
}
function drawTail(g, f, hip, M, T, frz) {
  const sw = Math.sin(T * 2.6) * .3, w = frz ? 6.5 : 4;
  const p0 = [hip[0] - 4, hip[1] + 2], p1 = [p0[0] - 18, p0[1] + 6 + sw * 8], p2 = [p0[0] - 30, p0[1] - 8 + sw * 10], p3 = [p0[0] - 26, p0[1] - 22 + sw * 6];
  g.lineCap = "round";
  for (const [lw, col] of [[w + 2.2, INK], [w, f.tail || f.skin]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(p0[0], p0[1]); g.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]); g.stroke(); }
}
function drawCape(g, f, sh, hip, M, T, P) {
  const sw = Math.sin(T * 2.2) * 4 - (P.air ? 8 : 0) - (P.rot || 0) * 10;
  const top1 = [sh[0] - M.wT * .45, sh[1] - 1], top2 = [sh[0] + 3, sh[1] - 2];
  const bot = hip[1] + 36;
  smooth(g, [top2, top1, [top1[0] - 14 + sw, hip[1] + 10], [top1[0] - 22 + sw, bot], [top1[0] - 6 + sw * .7, bot + 2], [sh[0] - 4, hip[1] + 6], [sh[0], sh[1] + 10]], f.capeIn || shade(f.cape, -.15));
  smooth(g, [top2, top1, [top1[0] - 10 + sw, hip[1] + 8], [top1[0] - 16 + sw, bot - 3], [top1[0] - 4 + sw * .6, bot - 1], [sh[0] - 6, hip[1]]], f.cape);
}
function drawCapePad(g, f, sh, M, front) {
  const x = sh[0] + (front ? 2 : -3), y = sh[1] + 1, w = M.wA1 * .78;
  smooth(g, [[x - w * 1.7, y + w * .4], [x - w * 1.5, y - w * 1.05], [x - w * .2, y - w * 1.25], [x + w * 1.25, y - w * .6], [x + w * 1.3, y + w * .45], [x - w * .1, y + w * .7]], front ? f.cape : shade(f.cape, -.2));
  if (front) { g.strokeStyle = shade(f.cape, -.25); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - w * 1.3, y - w * .2); g.quadraticCurveTo(x, y - w * .8, x + w * 1.0, y - w * .2); g.stroke(); }
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), m = sh2 => Math.round(lerp(pa >> sh2 & 255, pb >> sh2 & 255, t));
  return "#" + [16, 8, 0].map(sh2 => m(sh2).toString(16).padStart(2, "0")).join("");
}

// ---------- the Great Ape ----------
function drawApe(g, f, pose) {
  const T = pose.time || 0, k = clamp(pose.t || 0, 0, 1), name = pose.name || "idle", H = f.h || 2.4, fur = f.fur || "#7a4a2a";
  const out = {};
  g.save(); g.scale(H, H);
  const breathe = Math.sin(T * 2) * .8;
  let lean = .15, armF = .9, armB = .6, mouth = 0, stomp = 0;
  if (name === "beamWind" || name === "beam") { mouth = 1; lean = .25; }
  if (name === "punch" || name === "smash" || name === "kick") { const s = Math.sin(k * Math.PI); armF = lerp(.9, 2.6, s); stomp = s; }
  if (name === "charge") { armF = .3; armB = .2; lean = -.05; mouth = .6; }
  if (name === "hit") lean = -.2;
  if (name === "ko") { g.rotate(-1.35); }
  const hip = [0, -40], sh = [hip[0] + Math.sin(lean) * 34, hip[1] - 34 + breathe];
  // legs (short and thick)
  for (const [dx, col] of [[-7, shade(fur, -.2)], [7, fur]]) { limb(g, [hip[0] + dx * .5, hip[1]], [hip[0] + dx, -10], 17, col); limb(g, [hip[0] + dx, -10], [hip[0] + dx + 5, -2], 14, col); ell(g, hip[0] + dx + 7, -2, 9, 4, 0, shade(fur, -.35)); }
  // back arm
  const be = seg([sh[0] - 6, sh[1] + 4], armB, 22), bh = seg(be, armB + .4, 20);
  limb(g, [sh[0] - 6, sh[1] + 4], be, 14, shade(fur, -.2)); limb(g, be, bh, 12, shade(fur, -.2)); circ(g, bh[0], bh[1], 7, "#c89a7a");
  // body: a barrel of fur, with the stretched remains of the armour
  smooth(g, [[hip[0] - 18, hip[1] + 6], [hip[0] - 20, hip[1] - 20], [sh[0] - 16, sh[1] - 6], [sh[0] + 12, sh[1] - 8], [sh[0] + 20, sh[1] + 10], [hip[0] + 20, hip[1] - 6], [hip[0] + 14, hip[1] + 8]], fur);
  if (f.armor) { smooth(g, [[hip[0] - 14, hip[1] - 8], [sh[0] - 12, sh[1] + 4], [sh[0] + 14, sh[1] + 2], [hip[0] + 16, hip[1] - 6]], f.armor); ell(g, sh[0] - 10, sh[1] + 2, 9, 6, -.3, f.pad || "#c8a050"); }
  ell(g, hip[0] + 6, hip[1] - 14, 12, 15, 0, "#c89a7a", false);
  // head with a muzzle
  const hc = [sh[0] + 6, sh[1] - 16];
  smooth(g, [[hc[0] - 15, hc[1] + 2], [hc[0] - 12, hc[1] - 14], [hc[0] + 4, hc[1] - 17], [hc[0] + 15, hc[1] - 8], [hc[0] + 15, hc[1] + 8], [hc[0], hc[1] + 14], [hc[0] - 12, hc[1] + 12]], fur);
  for (const s of [-1, 1]) blob(g, [[hc[0] - 4 + s * 6, hc[1] - 14], [hc[0] - 2 + s * 8, hc[1] - 22], [hc[0] + 2 + s * 6, hc[1] - 13]], fur);
  smooth(g, [[hc[0] + 2, hc[1] + 1], [hc[0] + 18, hc[1] - 1], [hc[0] + 22, hc[1] + 7 + mouth * 4], [hc[0] + 12, hc[1] + 14 + mouth * 5], [hc[0] + 2, hc[1] + 11]], "#c89a7a");
  if (mouth) { ell(g, hc[0] + 16, hc[1] + 9 + mouth * 2, 5, 2 + mouth * 3, 0, "#5a1010"); }
  ell(g, hc[0] + 5, hc[1] - 5, 3.6, 2.6, -.2, "#ff2a2a"); circ(g, hc[0] + 6, hc[1] - 5, 1.2, "#ffd34d");
  g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.moveTo(hc[0] - 1, hc[1] - 10); g.lineTo(hc[0] + 10, hc[1] - 7); g.stroke();
  out.mouth = [hc[0] + 22, hc[1] + 8]; out.head = hc; out.top = [hc[0], hc[1] - 26];
  // front arm
  const fe = seg([sh[0] + 6, sh[1] + 4], armF, 24), fh = seg(fe, armF + .5 + stomp * .3, 22);
  limb(g, [sh[0] + 6, sh[1] + 4], fe, 15, fur); limb(g, fe, fh, 13, fur); circ(g, fh[0], fh[1], 8, "#c89a7a");
  out.hand = fh; out.hand2 = bh; out.handf = fh; out.handb = bh; out.chest = [hip[0], hip[1] - 18]; out.feet = [0, 0];
  g.restore();
  for (const kk in out) if (Array.isArray(out[kk])) out[kk] = [out[kk][0] * H, out[kk][1] * H];
  return out;
}
// ---------- a Tyrannosaurus (Gohan's survival training) ----------
function drawDino(g, f, pose) {
  const T = pose.time || 0, k = clamp(pose.t || 0, 0, 1), name = pose.name || "idle", H = f.h || 1.7, sk = f.skin;
  const out = {};
  g.save(); g.scale(H, H);
  if (name === "ko") g.rotate(-1.3);
  const step = name === "walk" || name === "run" || name === "dash" ? Math.sin(T * 9) : Math.sin(T * 2) * .2;
  const bite = name === "punch" || name === "smash" || name === "kick" ? Math.sin(k * Math.PI) : 0;
  // tail, legs, body, arms, head
  blob(g, [[-10, -38], [-58, -44 + step * 2], [-62, -40], [-10, -28]], shade(sk, -.1));
  for (const [dx, s, col] of [[-6, -step, shade(sk, -.25)], [8, step, sk]]) { limb(g, [dx, -34], [dx + 6 + s * 6, -16], 12, col); limb(g, [dx + 6 + s * 6, -16], [dx + 2 + s * 4, -2], 8, col); ell(g, dx + 8 + s * 4, -2, 8, 3, 0, shade(col, -.3)); }
  smooth(g, [[-16, -40], [0, -52], [20, -56], [26, -40], [14, -26], [-8, -24]], sk);
  ell(g, 10, -36, 9, 7, .3, shade(sk, .3), false);
  limb(g, [20, -42], [27, -34], 4, sk); limb(g, [27, -34], [31, -36], 3, sk, false);
  const hc = [30 + bite * 8, -64 + bite * 4];
  smooth(g, [[hc[0] - 12, hc[1] + 4], [hc[0] - 8, hc[1] - 10], [hc[0] + 18, hc[1] - 9], [hc[0] + 24, hc[1] - 2], [hc[0] + 18, hc[1] + 2], [hc[0] - 2, hc[1] + 6]], sk);
  smooth(g, [[hc[0] - 8, hc[1] + 5], [hc[0] + 18, hc[1] + 3 + bite * 7], [hc[0] + 14, hc[1] + 9 + bite * 9], [hc[0] - 6, hc[1] + 12]], shade(sk, -.1));
  g.fillStyle = "#fbfbff"; for (let t = 0; t < 4; t++) { g.beginPath(); g.moveTo(hc[0] + 2 + t * 5, hc[1] + 2); g.lineTo(hc[0] + 4 + t * 5, hc[1] + 6); g.lineTo(hc[0] + 6 + t * 5, hc[1] + 2); g.fill(); }
  circ(g, hc[0] + 4, hc[1] - 4, 3, "#fbfbff"); circ(g, hc[0] + 5, hc[1] - 4, 1.6, f.eyec || "#ffd34d"); circ(g, hc[0] + 5.3, hc[1] - 4, .8, INK);
  out.mouth = [hc[0] + 22, hc[1] + 2]; out.head = hc; out.top = [hc[0], hc[1] - 16]; out.hand = [hc[0] + 20, hc[1]]; out.hand2 = out.hand; out.handf = out.hand; out.handb = out.hand; out.chest = [6, -40]; out.feet = [0, 0];
  g.restore();
  for (const kk in out) if (Array.isArray(out[kk])) out[kk] = [out[kk][0] * H, out[kk][1] * H];
  return out;
}

// ---------- cached menu renders ----------
const EART = {}, EHEAD = {};
function figCanvas(f, W, H, sc, fx, fy, bg, pose) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (bg) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, bg[0]); gr.addColorStop(.6, bg[1]); gr.addColorStop(1, bg[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.translate(fx, fy); g.scale(sc, sc); drawFigure(g, f, pose || { name: "idle", time: .4 });
  return cv;
}
const toURL = cv => { try { return cv.toDataURL("image/png"); } catch (e) { return ""; } };
// how tall a figure stands, for framing (hair and horns add a little)
const figTall = f => (f.body === "ape" ? 108 : f.body === "dino" ? 82 : 100 - 34 * (f.kid || 0)) * (f.h || 1) + (f.hs === "vegeta" || f.hs === "ssj" ? 14 : f.body === "frieza2" ? 18 : 6);
function figFull(id, f) {
  if (!EART[id]) { const tall = figTall(f), sc = Math.min(2.2, 300 / tall); EART[id] = { url: toURL(figCanvas(f, 240, 340, sc, 112, 330, null, { name: f.villain ? "cross" : "idle", time: .4 })) }; }
  return EART[id];
}
function figHead(id, f, bg) {
  if (!EHEAD[id]) {
    const H = f.h || 1, M = metrics(f), big = f.body === "ape" ? 3.4 : f.body === "dino" ? 2.6 : 1;
    const top = f.body === "ape" ? 96 * H : f.body === "dino" ? 70 * H : (M.thigh + M.shin + M.torso + M.neck + M.headR * .85) * H;
    const sc = 64 / ((M.headR * 2.9) * H * big);
    EHEAD[id] = toURL(figCanvas(f, 128, 128, sc, 58 - (f.body === "dino" ? 30 * H * sc : 0), 66 + top * sc, bg, { name: "stand", time: .4 }));
  }
  return EHEAD[id];
}
