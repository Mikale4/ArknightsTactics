
// =====================================================================
//  SPRITES — Pokémon Showdown's animated Black/White sprites (gen5ani front and back) and FireRed/LeafGreen
//  trainer sprites, embedded by build.sh as base64 (SPR_DATA). tools/pack_sprites.py turned each animated GIF
//  into a strip of its unique frames plus a playback list (SPR_DATA.a: w, h, cols, then frame/centisecond pairs).
//  Battle units are drawn as billboards: the back sprite when the camera looks over their shoulder, the front
//  sprite when it faces them, always turned towards the opponents. Menus use <img>: small icons come from the
//  first frames (SPR_DATA.i), and big sprites are re-encoded as animated GIFs the first time they're shown.
//  The sheets are only decoded when something plays them.
// =====================================================================
const SPR = { img: {}, box: {}, ani: {}, icon: {}, still: {}, gif: {}, ready: false, loaded: 0, total: 0 };
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const sprSrc = (set, k) => SPR_DATA[set][k] ? "data:image/png;base64," + SPR_DATA[set][k] : "";
// square icon of the first frame, cropped to the Pokémon (lists, the battle HUD)
const sprFront = k => SPR.icon[k] || BLANK;
// the whole animated front sprite (summary, Pokédex, Safari Zone, evolution). GIFs are made in the background one
// at a time; until one is ready its first frame shows, and the <img>s showing that are switched over.
const GIFQ = [];
function sprFull(k) {
  if (SPR.gif[k]) return SPR.gif[k];
  if (!SPR.ani["f:" + k]) return BLANK;
  if (!GIFQ.includes(k)) { GIFQ.push(k); if (GIFQ.length === 1) setTimeout(gifNext, 30); }
  return stillOf(k);
}
function gifNext() {
  const k = GIFQ[0]; if (!k) return;
  if (!SPR.ani["f:" + k].im.complete) { setTimeout(gifNext, 100); return; }
  const still = stillOf(k), url = gifOf("f:" + k);
  SPR.gif[k] = url || still; GIFQ.shift();
  if (url && still !== BLANK) for (const im of document.querySelectorAll("img")) if (im.getAttribute("src") === still) im.src = url;
  if (GIFQ.length) setTimeout(gifNext, 16);
}
const trainerURL = k => sprSrc("t", k);
const PX = 2.1; // world units per sprite pixel
// which unique frame of animation `a` shows `ms` milliseconds into its loop
function aniFrame(a, ms) {
  let t = (ms % a.total + a.total) % a.total;
  for (let i = 0; i < a.seq.length; i += 2) { if (t < a.seq[i + 1]) return a.seq[i]; t -= a.seq[i + 1]; }
  return a.seq[0];
}
const frameXY = (a, f) => [(f % a.cols) * a.w, Math.floor(f / a.cols) * a.h];
function drawAniFrame(g, a, f, x, y, w, h) { const [fx, fy] = frameXY(a, f); g.drawImage(a.im, fx, fy, a.w, a.h, x, y, w, h); }
// big sprites sit on a square canvas at least as big as the old 96 px stills, so sizes compare like in the games
function squareOf(a) { const S = Math.max(96, a.w, a.h); return { S, ox: Math.round((S - a.w) / 2), oy: S - a.h - Math.round((S - a.h) * .3) }; }
// trim box of a sprite (the opaque pixels), measured once when it loads
function measure(im) {
  const c = document.createElement("canvas"); c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height;
  const g = c.getContext("2d"); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = c.width - 1; y1 = c.height - 1; }
  return { x0, y0, x1, y1, w: c.width, h: c.height, c };
}
// square menu icon from the cropped first frame, feet near the bottom (so small Pokémon don't vanish in big frames)
function makeIcon(k, im) {
  const w = im.naturalWidth, h = im.naturalHeight, s = Math.max(w, h) + 4, c = document.createElement("canvas");
  c.width = s; c.height = s;
  c.getContext("2d").drawImage(im, Math.round((s - w) / 2), s - 2 - h);
  try { SPR.icon[k] = c.toDataURL(); } catch (e) { SPR.icon[k] = im.src; }
}
// the first frame on the big sprites' square canvas: shown while the GIF is made, or if it can't be
function stillOf(k) {
  if (SPR.still[k]) return SPR.still[k];
  const a = SPR.ani["f:" + k]; if (!a || !a.im.complete) return BLANK;
  const { S, ox, oy } = squareOf(a), c = document.createElement("canvas");
  c.width = S; c.height = S;
  drawAniFrame(c.getContext("2d"), a, a.seq[0], ox, oy, a.w, a.h);
  try { return (SPR.still[k] = c.toDataURL()); } catch (e) { return SPR.icon[k] || BLANK; }
}
function preloadSprites(onProgress) {
  const jobs = [];
  for (const set of ["i", "f", "b", "t"]) for (const k in SPR_DATA[set]) jobs.push([set, k]);
  SPR.total = jobs.length; SPR.loaded = 0;
  return Promise.all(jobs.map(([set, k]) => new Promise(res => {
    const im = new Image(), done = () => { SPR.loaded++; onProgress && onProgress(SPR.loaded / SPR.total); res(); };
    im.onload = () => {
      const meta = SPR_DATA.a[set] && SPR_DATA.a[set][k];
      if (set === "i") makeIcon(k, im);
      else if (meta) {
        const [w, h, cols, ...q] = meta, seq = q.map((v, i) => i % 2 ? v * 10 : v);
        SPR.ani[set + ":" + k] = { im, w, h, cols, seq, total: seq.reduce((s, v, i) => s + (i % 2 ? v : 0), 0) };
      } else { const box = measure(im); delete box.c; SPR.box[set + ":" + k] = box; }
      done();
    };
    im.onerror = done;
    im.src = sprSrc(set, k); SPR.img[set + ":" + k] = im;
  }))).then(() => { SPR.ready = true; });
}

// ---------- animated GIFs for <img> ----------
// The sheet's colours become the palette (index 0 is transparent) and each playback step a frame on the square
// canvas, cleared between frames. Black/White sprites use about 16 colours, far under GIF's 256.
function gifOf(id) {
  const a = SPR.ani[id]; if (!a) return "";
  const sw = a.im.naturalWidth, sh = a.im.naturalHeight, c = document.createElement("canvas");
  c.width = sw; c.height = sh;
  const g = c.getContext("2d"); g.drawImage(a.im, 0, 0);
  let px; try { px = g.getImageData(0, 0, sw, sh).data; } catch (e) { return ""; }
  const pal = [0, 0, 0], map = new Map(), idx = new Uint8Array(sw * sh);
  let lastKey = -1, last = 0;
  for (let i = 0, j = 0; i < idx.length; i++, j += 4) {
    if (px[j + 3] < 128) continue;
    const key = px[j] << 16 | px[j + 1] << 8 | px[j + 2];
    if (key !== lastKey) {
      lastKey = key; last = map.get(key);
      if (last === undefined) { if (map.size >= 255) return ""; last = map.size + 1; map.set(key, last); pal.push(px[j], px[j + 1], px[j + 2]); }
    }
    idx[i] = last;
  }
  let bits = 2; while (1 << bits < pal.length / 3) bits++;
  const { S, ox, oy } = squareOf(a), fr = new Uint8Array(a.w * a.h), code = new Uint8Array(a.w * a.h * 2 + 16);
  let buf = new Uint8Array(1 << 16), n = 0;
  const room = k => { if (n + k > buf.length) { const b = new Uint8Array(Math.max(buf.length * 2, n + k)); b.set(buf); buf = b; } };
  const put = (...v) => { room(v.length); for (const x of v) buf[n++] = x; }, u16 = v => put(v & 255, v >> 8 & 255), str = s => put(...[...s].map(ch => ch.charCodeAt(0)));
  str("GIF89a"); u16(S); u16(S); put(0xf0 | bits - 1, 0, 0);
  room(3 << bits); for (let i = 0; i < 3 << bits; i++) buf[n++] = pal[i] || 0;
  put(0x21, 0xff, 11); str("NETSCAPE2.0"); put(3, 1, 0, 0, 0); // loop forever
  for (let s = 0; s < a.seq.length; s += 2) {
    const [fx, fy] = frameXY(a, a.seq[s]);
    for (let y = 0; y < a.h; y++) fr.set(idx.subarray((fy + y) * sw + fx, (fy + y) * sw + fx + a.w), y * a.w);
    put(0x21, 0xf9, 4, 0x09); u16(Math.round(a.seq[s + 1] / 10)); put(0, 0); // dispose to background, index 0 transparent
    put(0x2c); u16(ox); u16(oy); u16(a.w); u16(a.h); put(0, bits);
    const len = lzw(fr, bits, code);
    room(len + Math.ceil(len / 255) + 1);
    for (let i = 0; i < len; i += 255) { const k = Math.min(255, len - i); buf[n++] = k; buf.set(code.subarray(i, i + k), n); n += k; }
    buf[n++] = 0;
  }
  put(0x3b);
  let bin = ""; for (let i = 0; i < n; i += 8192) bin += String.fromCharCode.apply(null, buf.subarray(i, Math.min(n, i + 8192)));
  return "data:image/gif;base64," + btoa(bin);
}
// GIF's variable-width LZW: codes grow from min+1 bits up to 12, with a clear code once the table is full.
// The dictionary maps (prefix << 8 | byte) to generation << 12 | code, so starting a new generation empties it.
const LZW = { t: null, gen: 0 };
function lzwGen() { if (!LZW.t || ++LZW.gen >= 1 << 20) { LZW.t = LZW.t ? LZW.t.fill(0) : new Uint32Array(1 << 20); LZW.gen = 1; } return LZW.gen; }
function lzw(ix, min, out) {
  const T = LZW.t || (lzwGen(), LZW.t), clear = 1 << min, eoi = clear + 1;
  let size = min + 1, next = eoi + 1, gen = lzwGen(), acc = 0, nb = 0, n = 0;
  const emit = c => { acc |= c << nb; nb += size; while (nb >= 8) { out[n++] = acc & 255; acc >>>= 8; nb -= 8; } };
  emit(clear);
  let cur = ix[0];
  for (let i = 1; i < ix.length; i++) {
    const k = ix[i], key = cur << 8 | k, v = T[key];
    if (v >>> 12 === gen) { cur = v & 4095; continue; }
    emit(cur);
    if (next === 4096) { emit(clear); gen = lzwGen(); size = min + 1; next = eoi + 1; }
    else { if (next >= 1 << size) size++; T[key] = (gen << 12 | next++) >>> 0; }
    cur = k;
  }
  emit(cur); emit(eoi);
  if (nb > 0) out[n++] = acc & 255;
  return n;
}

// ---------- battle drawing ----------
// pose names follow the battle director: idle · run · swing · shoot · cast · buff · hit · victory
function monMotion(pose, ph) {
  const T = pose.time || 0, k = clamp(pose.t || 0, 0, 1), nm = pose.name || "idle";
  const m = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1, white: 0 }; // idle is the sprite's own animation
  if (nm === "run") { m.dy = -Math.abs(Math.sin(T * 13)) * 9; m.sy = 1 + Math.sin(T * 26) * .04; }
  else if (nm === "swing") { const s = Math.sin(k * Math.PI); m.dx = s * 18; m.dy = -s * 6; m.sx = 1 + s * .08; m.sy = 1 - s * .06; m.rot = s * .1; }
  else if (nm === "shoot" || nm === "cast") { const s = Math.sin(k * Math.PI); m.dx = k < .3 ? -k * 18 : s * 6; m.sy = 1 + s * .06; m.white = s * .35; }
  else if (nm === "hit") { const s = 1 - k; m.dx = Math.sin(k * 40) * 7 * s; m.alpha = k < .6 && Math.floor(k * 14) % 2 ? .25 : 1; }
  else if (nm === "buff") { const s = Math.sin(k * Math.PI); m.dy = -s * 18; m.sy = 1 + s * .08; m.white = s * .25; }
  else if (nm === "victory") { m.dy = -Math.abs(Math.sin(T * 5 + ph)) * 12; }
  return m;
}
// draws the unit's sprite at the origin (feet on y = 0) in world units, turned towards screen direction `want`
// (+1 right, -1 left); returns anchors in local screen-aligned coordinates. opts.at is the animation clock in ms.
function drawMonSprite(g, key, back, want, pose, ph, opts = {}) {
  const set = back && SPR.ani["b:" + key] ? "b" : "f", a = SPR.ani[set + ":" + key];
  if (!a) return { head: [0, -60], chest: [0, -40], top: [0, -80], tip: [20, -40] };
  const flip = want !== (set === "b" ? 1 : -1); // front sprites look left, back sprites look right
  const m = monMotion(pose, ph), W = a.w * PX, H = a.h * PX;
  const [fx, fy] = frameXY(a, aniFrame(a, opts.at != null ? opts.at : ((pose.time || 0) + ph) * 1000));
  g.save();
  g.translate(m.dx * want, m.dy);
  g.rotate(m.rot * want);
  g.scale((flip ? -1 : 1) * m.sx, m.sy);
  g.imageSmoothingEnabled = false;
  if (opts.sink) { g.beginPath(); g.rect(-W, -H * 2, W * 2, H * 2); g.clip(); g.translate(0, opts.sink * H); }
  g.globalAlpha *= m.alpha;
  g.drawImage(a.im, fx, fy, a.w, a.h, -W / 2, -H, W, H);
  if (m.white > .02 || opts.white) {
    // tint: redraw the sprite as a flat silhouette in additive white (send-outs, move charge-ups)
    g.globalCompositeOperation = "lighter"; g.globalAlpha *= Math.min(1, (opts.white || 0) + m.white);
    g.drawImage(whiteOf(set + ":" + key, a), fx, fy, a.w, a.h, -W / 2, -H, W, H);
  }
  g.restore();
  const ox = m.dx * want;
  return { head: [ox, -H * .78 + m.dy], chest: [ox, -H * .5 + m.dy], top: [ox, -H + m.dy], tip: [ox + want * W * .3, -H * .55 + m.dy], w: W, h: H };
}
const WHITE = {};
// the whole sheet as a white silhouette, so any frame can flash
function whiteOf(id, a) {
  if (WHITE[id]) return WHITE[id];
  const c = document.createElement("canvas"), w = a.im.naturalWidth, h = a.im.naturalHeight;
  c.width = w; c.height = h;
  const g = c.getContext("2d"); g.drawImage(a.im, 0, 0);
  g.globalCompositeOperation = "source-in"; g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
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
