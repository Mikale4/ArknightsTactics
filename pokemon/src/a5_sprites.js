
// =====================================================================
//  SPRITES — Pokémon Showdown's Black/White sprites (front and back) and FireRed/LeafGreen trainer sprites,
//  embedded by build.sh as base64 (SPR_DATA). Battle units are drawn as billboards: the back sprite when the
//  camera looks over their shoulder, the front sprite when it faces them, always turned towards the opponents.
// =====================================================================
const SPR = { img: {}, box: {}, icon: {}, ready: false, loaded: 0, total: 0 };
const sprSrc = (set, k) => SPR_DATA[set][k] ? "data:image/png;base64," + SPR_DATA[set][k] : "";
const sprFront = k => SPR.icon[k] || sprSrc("f", k);
const sprFull = k => sprSrc("f", k);
const trainerURL = k => sprSrc("t", k);
const PX = 2.1; // world units per sprite pixel
function sprImg(set, k) { return SPR.img[set + ":" + k]; }
// trim box of a sprite (the opaque pixels), measured once when it loads
function measure(im) {
  const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext("2d"); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = c.width - 1; y1 = c.height - 1; }
  return { x0, y0, x1, y1, w: c.width, h: c.height, c };
}
// square menu icon cropped to the Pokémon (so small Pokémon don't vanish in big empty frames)
function makeIcon(k, box) {
  const s = Math.max(box.x1 - box.x0 + 1, box.y1 - box.y0 + 1) + 4, c = document.createElement("canvas");
  c.width = s; c.height = s;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.drawImage(box.c, box.x0, box.y0, box.x1 - box.x0 + 1, box.y1 - box.y0 + 1, Math.round((s - (box.x1 - box.x0 + 1)) / 2), s - 2 - (box.y1 - box.y0 + 1), box.x1 - box.x0 + 1, box.y1 - box.y0 + 1);
  try { SPR.icon[k] = c.toDataURL(); } catch (e) { /* keep the full sprite */ }
}
function preloadSprites(onProgress) {
  const jobs = [];
  for (const set of ["f", "b", "t"]) for (const k in SPR_DATA[set]) jobs.push([set, k]);
  SPR.total = jobs.length; SPR.loaded = 0;
  return Promise.all(jobs.map(([set, k]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { const box = measure(im); SPR.box[set + ":" + k] = box; if (set === "f") makeIcon(k, box); delete box.c; SPR.loaded++; onProgress && onProgress(SPR.loaded / SPR.total); res(); };
    im.onerror = () => { SPR.loaded++; res(); };
    im.src = sprSrc(set, k); SPR.img[set + ":" + k] = im;
  }))).then(() => { SPR.ready = true; });
}

// ---------- battle drawing ----------
// pose names follow the battle director: idle · run · swing · shoot · cast · buff · hit · victory
function monMotion(pose, ph) {
  const T = pose.time || 0, k = clamp(pose.t || 0, 0, 1), nm = pose.name || "idle";
  const m = { dx: 0, dy: 0, sx: 1, sy: 1 + Math.sin(T * 2.4 + ph) * .022, rot: 0, alpha: 1, white: 0 };
  if (nm === "run") { m.dy = -Math.abs(Math.sin(T * 13)) * 9; m.sy = 1 + Math.sin(T * 26) * .04; }
  else if (nm === "swing") { const s = Math.sin(k * Math.PI); m.dx = s * 18; m.dy = -s * 6; m.sx = 1 + s * .08; m.sy = 1 - s * .06; m.rot = s * .1; }
  else if (nm === "shoot" || nm === "cast") { const s = Math.sin(k * Math.PI); m.dx = k < .3 ? -k * 18 : s * 6; m.sy = 1 + s * .06; m.white = s * .35; }
  else if (nm === "hit") { const s = 1 - k; m.dx = Math.sin(k * 40) * 7 * s; m.alpha = k < .6 && Math.floor(k * 14) % 2 ? .25 : 1; }
  else if (nm === "buff") { const s = Math.sin(k * Math.PI); m.dy = -s * 18; m.sy = 1 + s * .08; m.white = s * .25; }
  else if (nm === "victory") { m.dy = -Math.abs(Math.sin(T * 5 + ph)) * 12; }
  return m;
}
// draws the unit's sprite at the origin (feet on y = 0) in world units, turned towards screen direction `want`
// (+1 right, -1 left); returns anchors in local screen-aligned coordinates
function drawMonSprite(g, key, back, want, pose, ph, opts = {}) {
  const flip = want !== (back ? 1 : -1); // front sprites look left, back sprites look right
  const set = back ? "b" : "f", im = sprImg(set, key) || sprImg("f", key), box = SPR.box[(sprImg(set, key) ? set : "f") + ":" + key];
  if (!im || !box) return { head: [0, -60], chest: [0, -40], top: [0, -80], tip: [20, -40] };
  const m = monMotion(pose, ph), bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1;
  const W = bw * PX, H = bh * PX;
  g.save();
  g.translate(m.dx * want, m.dy);
  g.rotate(m.rot * want);
  g.scale((flip ? -1 : 1) * m.sx, m.sy);
  g.imageSmoothingEnabled = false;
  if (opts.sink) { g.beginPath(); g.rect(-W, -H * 2, W * 2, H * 2); g.clip(); g.translate(0, opts.sink * H); }
  g.globalAlpha *= m.alpha;
  g.drawImage(im, box.x0, box.y0, bw, bh, -W / 2, -H, W, H);
  if (m.white > .02 || opts.white) {
    // tint: redraw the sprite as a flat silhouette in additive white (evolution flashes, move charge-ups)
    g.globalCompositeOperation = "lighter"; g.globalAlpha *= Math.min(1, (opts.white || 0) + m.white);
    g.drawImage(whiteOf(set + ":" + key, im, box), -W / 2, -H, W, H);
  }
  g.restore();
  const ox = m.dx * want;
  return { head: [ox, -H * .78 + m.dy], chest: [ox, -H * .5 + m.dy], top: [ox, -H + m.dy], tip: [ox + want * W * .3, -H * .55 + m.dy], w: W, h: H };
}
const WHITE = {};
function whiteOf(id, im, box) {
  if (WHITE[id]) return WHITE[id];
  const c = document.createElement("canvas"), bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1;
  c.width = bw; c.height = bh;
  const g = c.getContext("2d"); g.drawImage(im, box.x0, box.y0, bw, bh, 0, 0, bw, bh);
  g.globalCompositeOperation = "source-in"; g.fillStyle = "#fff"; g.fillRect(0, 0, bw, bh);
  return (WHITE[id] = c);
}
// ---------- a Poké Ball drawn on canvas (send-outs, catching) ----------
function drawBall(g, x, y, r, kind = "poke", rot = 0, open = 0) {
  const top = { poke: "#e3350d", great: "#3b7dd8", ultra: "#2a2a30", master: "#7a3fb8", safari: "#5d8a3a" }[kind] || "#e3350d";
  g.save(); g.translate(x, y); g.rotate(rot);
  g.lineWidth = Math.max(1, r * .14); g.strokeStyle = "#1c1c22";
  g.fillStyle = "#f4f4f4"; g.beginPath(); g.arc(0, open * r * .3, r, 0, Math.PI); g.fill(); g.stroke();
  g.save(); g.translate(0, -open * r * .5); g.rotate(-open * .7);
  g.fillStyle = top; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
  if (kind === "ultra") { g.fillStyle = "#f2c14e"; g.fillRect(-r * .75, -r * .8, r * .3, r * .55); g.fillRect(r * .45, -r * .8, r * .3, r * .55); }
  if (kind === "great") { g.fillStyle = "#e3350d"; g.fillRect(-r * .8, -r * .6, r * .35, r * .25); g.fillRect(r * .45, -r * .6, r * .35, r * .25); }
  if (kind === "master") { g.fillStyle = "#e85aa8"; circ(g, -r * .45, -r * .55, r * .2, "#e85aa8"); circ(g, r * .45, -r * .55, r * .2, "#e85aa8"); }
  g.restore();
  g.fillStyle = "#1c1c22"; g.fillRect(-r, -r * .1 + open * r * .1, r * 2, r * .2);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(0, open * r * .1, r * .32, 0, Math.PI * 2); g.fill(); g.stroke();
  g.restore();
}
// rarity → ball for catches (3★ Poké Ball, 4★ Great Ball, 5★ Ultra Ball)
const BALL_OF = r => r >= 5 ? "ultra" : r === 4 ? "great" : "poke";
