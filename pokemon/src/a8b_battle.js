
// =====================================================================
//  BATTLE DIRECTOR — battle text, Poké Ball send-outs, move effects by type, camera, HUD
// =====================================================================
const VU = uid => BT.vus.get(uid);
const avg = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
BT.slashes = []; BT.balls = [];

// ---------- camera shots ----------
const aspect = () => Math.min(1.7, BT.W / BT.H);
const fitDist = (extent, minD, fov = .62) => Math.max(minD, extent / (2 * Math.tan(fov / 2) * aspect()));
function focusShot(vu) {
  // from the side, so the other team never stands between the camera and the Pokémon
  return { tx: vu.pos.x + vu.dir * 8, ty: 52 * vu.bs, tz: vu.pos.z, yaw: -.25 + vu.dir * .25, pitch: .18, dist: fitDist(240, 620 * vu.bs), fov: .62, roll: -vu.dir * .02 };
}
function impactShot(a, t) {
  const d = Math.hypot(a.pos.x - t.pos.x, a.pos.z - t.pos.z);
  return { tx: (a.pos.x + t.pos.x) / 2, ty: 50, tz: (a.pos.z + t.pos.z) / 2, yaw: lerp(BT.home.yaw, -.2, .5) - a.dir * .2, pitch: .2, dist: fitDist(d + 260, 460), fov: .62, roll: 0 };
}
function aoeShot(ts, a) {
  return { tx: avg(ts.map(t => t.pos.x)), ty: 46, tz: avg(ts.map(t => t.pos.z)), yaw: BT.home.yaw - a.dir * .22, pitch: .24, dist: fitDist(520, 600, .66), fov: .66, roll: 0 };
}
function nudgeShot(px, pz, k, zoom) {
  const h = BT.home, land = BT.W / BT.H > 1.05;
  return { ...h, tx: lerp(h.tx, px, k), tz: lerp(h.tz, pz, k), dist: h.dist * (land ? zoom : 1 - (1 - zoom) * .4) };
}
function twoShot(a, t) {
  if (!t || t === a) return nudgeShot(a.pos.x, a.pos.z, .12, .95);
  return { ...nudgeShot((a.pos.x + t.pos.x) / 2, (a.pos.z + t.pos.z) / 2, .22, .9), yaw: BT.home.yaw + a.dir * .05 };
}

// ---------- movement ----------
async function moveTo(vu, x, z, speedMul = 1) {
  const sx = vu.pos.x, sz = vu.pos.z, d = Math.hypot(x - sx, z - sz);
  if (d < 4) return;
  setPose(vu, "run", 0, false);
  await btween(clamp(d * .9, 150, 420) / speedMul, k => { vu.pos.x = lerp(sx, x, k); vu.pos.z = lerp(sz, z, k); vu.y = Math.sin(k * Math.PI) * 14; });
  vu.y = 0; setPose(vu, "idle");
}
async function engage(a, t) {
  const x = t.pos.x - a.dir * 75 * t.bs, z = t.pos.z + (a.pos.z > t.pos.z ? 6 : -6);
  if (Math.hypot(a.pos.x - x, a.pos.z - z) < 12) return;
  await moveTo(a, x, z, 1.2);
}
async function returnHome() {
  const list = [...BT.vus.values()].filter(vu => !vu.dead && (Math.hypot(vu.pos.x - vu.home.x, vu.pos.z - vu.home.z) > 3 || vu.y > 1));
  await Promise.all(list.map(async vu => {
    if (vu.y > 1) { const y0 = vu.y; await btween(160, k => { vu.y = y0 * (1 - k); }); }
    await moveTo(vu, vu.home.x, vu.home.z, 1.3);
  }));
}

// ---------- fx helpers ----------
const tcol = t => TC[t] || "#ffffff";
function sparks(vu, col, n = 14) { addParts(chestW(vu), n, { col, speed: 220, life: 380, size: 2.6, g: 380, spread: 10 }); }
function slashAt(vu, col, big) { BT.slashes.push({ p: chestW(vu), t0: BT.clock, dur: 260, col, rot: R() * Math.PI, big }); }
function drawSlashes(K) {
  const g = BT.g;
  BT.slashes = BT.slashes.filter(s => BT.clock - s.t0 < s.dur);
  for (const s of BT.slashes) {
    const p = proj(K, ...s.p); if (!p) continue;
    const k = (BT.clock - s.t0) / s.dur, r = (s.big ? 66 : 44) * p[2] * (.7 + k * .5);
    g.save(); g.translate(p[0], p[1]); g.rotate(s.rot + k * .6); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - k;
    if (s.star) { g.fillStyle = s.col; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r * .35 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); }
    else {
      g.lineCap = "round";
      g.strokeStyle = s.col; g.lineWidth = 10 * p[2] + 2; g.beginPath(); g.arc(0, 0, r, -1.1, 1.1); g.stroke();
      g.strokeStyle = "#fff"; g.lineWidth = 3 * p[2] + 1; g.beginPath(); g.arc(0, 0, r, -.9, .9); g.stroke();
    }
    g.restore();
  }
  drawBalls(K);
}
// Poké Balls in flight (send-outs and catches)
function drawBalls(K) {
  const g = BT.g;
  BT.balls = BT.balls.filter(b => BT.clock - b.t0 < b.dur + (b.hold || 0));
  for (const b of BT.balls) {
    const k = clamp((BT.clock - b.t0) / b.dur, 0, 1), p = v3.lerp(b.from, b.to, k); p[1] += Math.sin(k * Math.PI) * b.h;
    const s = proj(K, ...p); if (!s) continue;
    drawBall(g, s[0], s[1], 7 * s[2] + 3, b.kind, k * 14, k >= 1 ? 1 : 0);
  }
}
async function throwBall(vu, kind = "poke") {
  const to = [vu.home.x, 30, vu.home.z], from = vu.team === "A" ? [vu.home.x - 260, 120, vu.home.z - 160] : [vu.home.x + 300, 160, vu.home.z + 220];
  BT.balls.push({ from, to, t0: BT.clock, dur: 420, h: 90, kind, hold: 120 });
  await bwait(440);
  BT.rings.push({ x: vu.home.x, z: vu.home.z, r0: 6, r1: 70, t0: BT.clock, dur: 420, col: "#ffffff", w: 4 });
  addParts([vu.home.x, 30, vu.home.z], 18, { col: "#ffffff", speed: 160, life: 420, size: 2.6, g: 60 });
  vu.spawnT = BT.clock; sfx("warp");
}
// a projectile in the move's type colour, with a type-flavoured burst on impact
async function fireBolt(a, t, type, opts = {}) {
  const from = opts.from || tipW(a), col = tcol(type);
  const to = chestW(t); to[0] += (R() - .5) * 10; to[1] += (R() - .5) * 14;
  const d = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]), dur = clamp(d / (opts.speed || 2.4), 90, 340);
  if (type === "Electric") { BT.arcs.push({ from: () => tipW(a), to: () => chestW(t), t0: BT.clock, dur: dur + 160, col }); sfx("zap"); }
  else if (type === "Rock" || type === "Poison") BT.nades.push({ from, to, t0: BT.clock, dur, h: 60, col });
  else BT.bolts.push({ from, to, t0: BT.clock, dur, col, len: opts.len || (type === "Psychic" ? .5 : .32), w: opts.w || (type === "Water" || type === "Ice" ? 1.4 : 1) });
  if (type !== "Electric" && opts.sound !== "none") sfx(type === "Fire" ? "flame" : "arts");
  await bwait(dur);
  impactFx(t, type, opts.big);
}
function impactFx(t, type, big) {
  const p = chestW(t), col = tcol(type), n = big ? 22 : 12;
  if (type === "Fire") addParts(p, n, { col: "#ffb03a", speed: 90, vy: 110, life: 520, size: 3.2, g: -60, spread: 14 });
  else if (type === "Water") addParts(p, n, { col: "#9ad8ff", speed: 200, vy: 80, life: 460, size: 2.6, g: 420, spread: 8, add: false });
  else if (type === "Grass") addParts(p, n, { col: "#5ac84a", speed: 140, vy: 50, life: 700, size: 3, g: 60, spread: 12, add: false });
  else if (type === "Ice") addParts(p, n, { col: "#e8fbff", speed: 180, life: 520, size: 2.4, g: 120, spread: 10 });
  else if (type === "Psychic") BT.rings.push({ x: t.pos.x, z: t.pos.z, r0: 10, r1: 70, t0: BT.clock, dur: 480, col, w: 4 });
  else if (type === "Ground") { addParts([t.pos.x, 4, t.pos.z], n, { col: "#c8a060", speed: 120, vy: 160, life: 600, size: 3.4, g: 380, spread: 20, add: false }); BT.shake = Math.max(BT.shake, 5); }
  else if (type === "Rock") addParts(p, n, { col: "#a88a5a", speed: 180, vy: 60, life: 520, size: 3.6, g: 520, spread: 10, add: false });
  else if (type === "Ghost") addParts(p, n, { col: "#7a4ab8", speed: 50, vy: 70, life: 800, size: 3.6, g: -40, spread: 18 });
  else if (type === "Poison") addParts(p, n, { col: "#c86ad8", speed: 70, vy: 60, life: 700, size: 3, g: -20, spread: 14 });
  else if (type === "Electric") addParts(p, n, { col: "#fff27a", speed: 260, life: 280, size: 2.2, g: 0, spread: 6 });
  else if (type === "Dragon") { addParts(p, n, { col: "#9a7aff", speed: 160, life: 520, size: 3.2, g: 0, spread: 12 }); BT.rings.push({ x: t.pos.x, z: t.pos.z, r0: 8, r1: 60, t0: BT.clock, dur: 420, col, w: 4 }); }
  else addParts(p, n, { col, speed: 180, life: 380, size: 2.6, g: 300, spread: 10 });
}
function auraBurst(vu, col, ring = true) {
  vu.aura = BT.clock + 900; vu.auraCol = col;
  if (ring) BT.rings.push({ x: vu.pos.x, z: vu.pos.z, r0: 10, r1: 70, t0: BT.clock, dur: 700, col, w: 3 });
  addParts([vu.pos.x, 10, vu.pos.z], 16, { col, speed: 40, vy: 110, life: 800, size: 2.4, g: -20, spread: 40 });
}
function cutIn(vu, skillName, type) {
  const wrap = $(".bwrap"); if (!wrap) return;
  const d = (950 / BT.speed / 1000).toFixed(2) + "s";
  const el = document.createElement("div");
  el.className = "cutin"; el.style.setProperty("--ec", tcol(type));
  el.innerHTML = `<div class="band" style="animation-duration:${d}"></div><div class="lines" style="animation-duration:${d}"></div>
    <img class="px" src="${sprFront(vu.u.spr || vu.u.key)}" alt="" style="animation-duration:${d};${vu.team === "E" ? "left:auto;right:-6%" : "transform:scaleX(-1)"}">
    <div class="sk" style="animation-duration:${d}"><small>${esc(vu.u.n)} · ${esc(type)}</small><b>${esc(skillName)}</b></div>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 1000 / BT.speed + 60);
}

// ---------- battle text ----------
function say(t, big) {
  const b = $("#bMsg"); if (!b) return;
  b.textContent = t; b.classList.toggle("big", !!big); b.classList.add("show");
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
}
const msgWait = t => clamp(t.length * 16, 320, 900);

// ---------- playback ----------
async function gate() { while (BT.paused && BT.on) await new Promise(r => setTimeout(r, 120)); }
async function play(evs) {
  for (let i = 0; i < evs.length; i++) { if (BT.quit || !BT.on) return; await gate(); await handle(evs[i]); }
}
function updateStrip() {
  const el = $("#bStrip"); if (!el || !BT.B) return;
  el.innerHTML = BT.B.predictOrder(7).map(uid => { const u = BT.B.byId(uid); return `<img class="px ${u.team === "E" ? "en" : ""}" src="${sprFront(u.spr || u.key)}" alt="">`; }).join("");
}
async function handle(e) {
  const vu = e.u != null ? VU(e.u) : null;
  switch (e.k) {
    case "msg": {
      say(e.t, e.big);
      if (!e.big) await bwait(msgWait(e.t)); else await bwait(260);
      break;
    }
    case "turn": {
      BT.active = vu;
      if (e.tms) for (const [uid, tm] of e.tms) { const v = VU(uid); if (v) v.tmT = tm; }
      if (vu) { vu.tmT = 0; camTo(twoShot(vu, null), 1.6); }
      updateStrip();
      await bwait(120);
      break;
    }
    case "wave": {
      for (const [uid, v] of BT.vus) if (v.team === "E" && v.dead) BT.vus.delete(uid);
      const list = e.units.map(uid => addVU(BT.B.byId(uid), true));
      for (const v of list) dexSee(v.u.key);
      BT.letterboxT = 1;
      camTo({ ...BT.home, tx: 180, yaw: BT.home.yaw - .35, dist: BT.home.dist * .78, pitch: .2 }, 2.2);
      await bwait(300);
      if (BT.B.trainer) { showTrainer(true); await bwait(250); }
      for (const [k, v] of list.entries()) { if (BT.B.trainer) bwait(k * 160).then(() => throwBall(v, BT.cfg.ball || "poke")); else { v.spawnT = BT.clock + k * 120; } }
      await bwait(BT.B.trainer ? 600 + list.length * 160 : 700);
      showTrainer(false);
      BT.letterboxT = 0; camHome(2.4);
      updateStrip();
      await bwait(250);
      break;
    }
    case "act": {
      BT.act = e; if (!vu) break;
      const tv = e.t != null ? VU(e.t) : null;
      if (e.quiet) break;
      if (e.s3) {
        BT.letterboxT = 1; sfx("special");
        cutIn(vu, e.name, e.type);
        camTo(focusShot(vu), 5.5);
        setPose(vu, "cast", 800);
        auraBurst(vu, tcol(e.type), false);
        await bwait(900);
      } else if (e.slot === 2) {
        camTo(tv && tv !== vu ? twoShot(vu, tv) : focusShot(vu), 3.2);
        await bwait(200);
      } else { camTo(twoShot(vu, tv), 2.4); await bwait(80); }
      if (e.anim === "buff" || e.anim === "heal") {
        const col = e.anim === "heal" ? "#5dfc9b" : tcol(e.type);
        setPose(vu, "buff", 700); sfx(e.anim === "heal" ? "heal" : "special");
        const group = e.tgt === "team" || e.tgt === "field" ? [...BT.vus.values()].filter(v => v.team === vu.team && !v.dead) : tv ? [tv] : [vu];
        if (group.length > 1) camTo({ ...BT.home, tx: avg(group.map(v => v.pos.x)), dist: fitDist(420, 460), yaw: BT.home.yaw + vu.dir * .2, pitch: .2 }, 3);
        if (e.tgt === "ally_single" && tv && tv !== vu) BT.bolts.push({ from: tipW(vu), to: chestW(tv), t0: BT.clock, dur: 260, col, len: .9, w: 1.4 });
        for (const v of group) auraBurst(v, col);
        await bwait(500);
      } else if (e.anim === "status") {
        setPose(vu, "cast", 520); sfx("arts");
        const ts = e.tgt === "aoe_enemies" ? [...BT.vus.values()].filter(v => v.team !== vu.team && !v.dead) : tv ? [tv] : [];
        await Promise.all(ts.map(async (t, k) => { await bwait(k * 60); BT.bolts.push({ from: tipW(vu), to: chestW(t), t0: BT.clock, dur: 300, col: tcol(e.type), len: .6, w: .8 }); await bwait(300); addParts(chestW(t), 12, { col: tcol(e.type), speed: 60, vy: 40, life: 700, size: 2.4, g: -30, spread: 16 }); }));
      }
      break;
    }
    case "atk": await doAttack(e); break;
    case "dmg": {
      if (!vu) break;
      vu.hp = e.hp; vu.sh = e.sh;
      if (e.sub) { floatText(e.u, "SUB", "prot"); await bwait(60); break; }
      floatText(e.u, fmtFull(e.n), e.crit ? "crit" : e.dot ? "dot" : e.eff > 1 ? "crit" : e.eff < 1 ? "prot" : "dmg");
      if (e.dot) { addParts(chestW(vu), 8, { col: "#c86ad8", speed: 50, vy: 40, life: 600, size: 2.6, g: -30 }); setPose(vu, "hit", 300); await bwait(220); break; }
      vu.flash = BT.clock + 160;
      if (vu.hp > 0) setPose(vu, "hit", 420);
      if (e.crit || e.eff > 1) { BT.shake = Math.max(BT.shake, e.eff > 1 ? 8 : 6); sfx("crit"); } else sfx("hit");
      await bwait(60);
      break;
    }
    case "heal": {
      if (!vu) break;
      vu.hp = e.hp; vu.sh = e.sh;
      floatText(e.u, "+" + fmtFull(e.n), "heal");
      addParts([vu.pos.x, 30, vu.pos.z], 8, { col: "#5dfc9b", speed: 30, vy: 90, life: 700, size: 2.2, g: -10, spread: 30 });
      await bwait(60);
      break;
    }
    case "txt": if (vu) { floatText(e.u, e.s, e.c); await bwait(50); } break;
    case "fx": if (vu) { vu.effs = e.list; vu.sh = e.sh; vu.st = e.st; vu.stages = e.stages; } break;
    case "status": if (vu) { const c = FX[e.s].c; auraBurst(vu, c, true); sfx("zap"); await bwait(200); } break;
    case "aura": if (vu) { const group = e.team ? [...BT.vus.values()].filter(v => v.team === vu.team && !v.dead) : [vu]; for (const v of group) auraBurst(v, "#f2d86a"); await bwait(300); } break;
    case "transform": if (vu) { vu.flash = BT.clock + 400; auraBurst(vu, "#ffffff"); sfx("warp"); vu.spawnT = BT.clock; await bwait(420); updateStrip(); } break;
    case "tm": if (vu) { vu.tmT = e.tm; } updateStrip(); break;
    case "death": {
      if (!vu) break;
      vu.dead = true; vu.deathT = BT.clock; vu.hp = 0; vu.sh = 0; vu.effs = []; vu.st = null; vu.stages = {};
      sfx("lose");
      BT.shake = Math.max(BT.shake, 4);
      if (BT.target === vu) BT.target = null;
      updateStrip();
      await bwait(260);
      break;
    }
    case "revive": {
      if (!vu) break;
      vu.dead = false; vu.gone = false; vu.hp = e.hp; vu.lag = e.hp; vu.sh = 0; vu.effs = [];
      vu.pos.x = vu.home.x; vu.pos.z = vu.home.z; vu.spawnT = BT.clock;
      auraBurst(vu, "#ffd76b"); floatText(e.u, "REVIVED", "buff");
      updateStrip(); await bwait(500);
      break;
    }
    case "end": {
      await returnHome();
      if (BT.letterboxT) { BT.letterboxT = 0; }
      camHome(2.4); BT.act = null;
      await bwait(110);
      break;
    }
  }
}
async function doAttack(e) {
  const a = VU(e.a), ts = e.t.map(VU).filter(v => v && !v.dead);
  if (!a || a.dead || !ts.length) return;
  const main = ts[0], sp = e.sp, first = !e.h, type = e.type || "Normal", col = tcol(type);
  switch (e.anim) {
    case "melee": {
      await engage(a, main);
      if (sp && first) camTo(impactShot(a, main), 5);
      setPose(a, "swing", e.n > 2 ? 280 : 400); sfx(type === "Fighting" || type === "Normal" ? "hit" : "saber");
      await bwait(e.n > 2 ? 120 : 180);
      if (!e.miss) { BT.slashes.push({ p: chestW(main), t0: BT.clock, dur: 260, col, rot: R() * Math.PI, big: sp, star: type === "Fighting" || type === "Normal" }); impactFx(main, type, sp); }
      if (sp) BT.shake = Math.max(BT.shake, 5);
      break;
    }
    case "spin": {
      if (first) { await moveTo(a, avg(ts.map(t => t.home.x)) - a.dir * 100, 0, 1.2); if (sp) camTo(aoeShot(ts, a), 4); }
      setPose(a, "swing", 500); sfx("saber");
      await bwait(240);
      for (const t of ts) { slashAt(t, col, true); impactFx(t, type); }
      BT.shake = Math.max(BT.shake, 6);
      break;
    }
    case "shoot": {
      if (sp && first) camTo(impactShot(a, main), 4);
      setPose(a, "shoot", 300);
      await bwait(40);
      await fireBolt(a, main, type, { big: sp });
      break;
    }
    case "volley": {
      if (first && sp) camTo(aoeShot(ts, a), 4);
      setPose(a, "shoot", 320);
      await Promise.all(ts.map(async (t, k) => { await bwait(k * 70); await fireBolt(a, t, type, { sound: k ? "none" : "" }); }));
      break;
    }
    case "nova": {
      if (first) { setPose(a, "cast", 800); if (sp) camTo(aoeShot(ts, a), 4); await bwait(160); }
      const cx = avg(ts.map(t => t.pos.x)), cz = avg(ts.map(t => t.pos.z));
      if (first) { BT.rings.push({ x: cx, z: cz, r0: 30, r1: 260, t0: BT.clock, dur: 520, col, w: 5 }); sfx(type === "Ground" ? "boom" : type === "Electric" ? "zap" : "special"); }
      await bwait(first ? 240 : 110);
      for (const t of ts) { addParts([t.pos.x, 4, t.pos.z], 16, { col, speed: 60, vy: 240, life: 560, size: 3.2, g: 80, spread: 20 }); impactFx(t, type); }
      if (first) { BT.flash = .25; BT.flashCol = col; BT.shake = Math.max(BT.shake, type === "Ground" ? 14 : 8); }
      break;
    }
    case "boom": {
      if (first) {
        camTo(aoeShot(ts.concat([a]), a), 4); setPose(a, "buff", 600); await bwait(300);
        BT.flash = .8; BT.flashCol = "#ffffff"; BT.shake = 18; sfx("boom");
        BT.rings.push({ x: a.pos.x, z: a.pos.z, r0: 20, r1: 340, t0: BT.clock, dur: 600, col: "#ffb03a", w: 7 });
        addParts(chestW(a), 40, { col: "#ffb03a", speed: 320, life: 700, size: 4, g: 120, spread: 20 });
        await bwait(200);
      }
      for (const t of ts) sparks(t, "#ffb03a", 10);
      break;
    }
    default: { setPose(a, "shoot", 300); await fireBolt(a, main, type); }
  }
}

// ---------- HUD ----------
function moveBtn(u, sk, tgt) {
  const B = BT.B, ok = B.usable(u, sk.slot), cd = u.cool[sk.slot] || 0;
  let tag = "";
  if (tgt && sk.target === "enemy" && sk.cat !== "X") {
    const e = B.effOn(u, tgt, sk);
    tag = e === 0 ? '<span class="eff no">No effect</span>' : e > 1 ? `<span class="eff se">Super effective</span>` : e < 1 ? `<span class="eff nve">Not very effective</span>` : "";
  }
  const hl = BT.gbUsed && u.skills.indexOf(sk) === Math.min(GB.hl, u.skills.length - 1);
  return `<button class="mvbtn ${ok ? "" : "off"} ${sk.slot === 3 && ok ? "ready" : ""} ${hl ? "hl" : ""}" data-s="${sk.slot}" style="--tc:${tcol(sk.type)}" aria-label="${esc(sk.name)}">
    <b>${esc(sk.name)}</b><span class="mvmeta"><span class="ty" style="--tc:${tcol(sk.type)}">${sk.type}</span>${tag}</span>
    ${!ok ? `<span class="cdv">${cd ? cd + " turn" + (cd > 1 ? "s" : "") : "Disabled"}</span>` : ""}</button>`;
}
function hideControls(txt = "") { BT.picking = false; BT.allyPick = null; const c = $("#bCtl"); if (c) { c.innerHTML = txt ? `<div class="bwait">${txt}</div>` : ""; c.classList.remove("on"); } }
function showControls(u) {
  const B = BT.B;
  BT.picking = true; BT.allyPick = null;
  const valid = B.targetable(u);
  if (!BT.target || BT.target.dead || !valid.includes(BT.target.u)) {
    const best = valid.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
    BT.target = best ? VU(best.uid) : null;
  }
  const c = $("#bCtl"); c.classList.add("on");
  const choose = slot => {
    const sk = u.skills.find(s => s.slot === slot), btn = $(`.mvbtn[data-s="${slot}"]`, c);
    if (!sk) return;
    if (!B.usable(u, slot)) { sfx("tap"); popup(skillPop(u, sk)); return; }
    if (!BT.inputRes) return;
    sfx("tap");
    if (sk.target === "ally_single") {
      BT.allyPick = slot; $$(".mvbtn", c).forEach(b => b.classList.toggle("picking", b === btn));
      const h = $("#bHint"); if (h) h.textContent = "Tap one of your Pokémon to use " + sk.name;
      return;
    }
    const r = BT.inputRes; BT.inputRes = null; hideControls();
    r({ slot, t: sk.target === "enemy" && BT.target ? BT.target.u : null });
  };
  BT.chooseMove = choose;
  const draw = () => {
    c.innerHTML = `<div class="bwho"><img class="bpt px" src="${sprFront(u.spr || u.key)}" alt=""><div class="bwn"><b>What will ${esc(u.n)} do?</b><small id="bHint">Tap an opponent to aim${BT.target ? ` · aiming at ${esc(BT.target.u.n)}` : ""} · hold a move for details</small></div></div>
      <div class="mvgrid">${u.skills.map(sk => moveBtn(u, sk, BT.target && BT.target.u)).join("")}</div>`;
    for (const btn of $$(".mvbtn", c)) {
      const slot = +btn.dataset.s, sk = u.skills.find(s => s.slot === slot);
      press(btn, () => choose(slot), () => popup(skillPop(u, sk)));
    }
  };
  BT.redrawControls = draw;
  draw();
}
function skillPop(u, sk) {
  const cd = u.cool[sk.slot] || 0, rank = u.sk[sk.slot - 1] || 1;
  return `<div class="eyebrow">S${sk.slot} · Mastery ${RANK[rank]}${sk.cd ? ` · Cooldown ${sk.cd}` : ""}</div><h3 style="margin:4px 0 6px">${esc(sk.name)}</h3>
    <div class="row" style="gap:6px;margin-bottom:6px">${typeChip(sk.type)}<span class="tag">${CAT_N[sk.cat]}</span>${sk.pow ? `<span class="tag">Power ${sk.weight ? "varies" : sk.pow}</span>` : ""}<span class="tag">Accuracy ${sk.acc ? sk.acc + "%" : "—"}</span></div>
    <p class="small">${esc(sk.desc)}</p>${cd ? `<p class="small" style="margin-top:6px;color:var(--bad)">Ready in ${cd} turn${cd > 1 ? "s" : ""}.</p>` : ""}`;
}
function unitPop(u) {
  const B = BT.B, e = B.effStat, ab = u.passives[0];
  const stg = s => u.stages[s] ? ` <span class="${u.stages[s] > 0 ? "good" : "bad"}">(${u.stages[s] > 0 ? "+" : ""}${u.stages[s]})</span>` : "";
  return `<div class="row"><img class="bpt px" src="${sprFront(u.spr || u.key)}" alt=""><div><div class="eyebrow">${u.team === "A" ? "Your Pokémon" : B.wild ? "Wild Pokémon" : "Opposing Pokémon"}${u.boss ? " · Boss" : ""}</div><h3>${esc(u.n)} <span class="small dim">Lv ${u.lvl}</span></h3>
    <div class="row" style="gap:4px;margin-top:3px">${typeChips(u.types)}</div></div></div>
    <div class="statgrid" style="margin-top:10px">
      <div><span>HP</span><b>${fmtFull(u.hp)} / ${fmtFull(u.max.hp)}</b></div><div><span>Status</span><b>${u.status ? FX[u.status].n : "Healthy"}</b></div>
      <div><span>Attack</span><b>${fmtFull(e.atk(u))}${stg("atk")}</b></div><div><span>Defense</span><b>${fmtFull(e.def(u))}${stg("def")}</b></div>
      <div><span>Sp. Atk</span><b>${fmtFull(e.spa(u))}${stg("spa")}</b></div><div><span>Sp. Def</span><b>${fmtFull(e.sdf(u))}${stg("sdf")}</b></div>
      <div><span>Speed</span><b>${fmtFull(e.spe(u))}${stg("spe")}</b></div><div><span>Acc / Eva</span><b>${u.stages.acc || 0} / ${u.stages.eva || 0}</b></div>
    </div>
    ${u.eff.length ? `<div class="stack" style="gap:4px;margin-top:10px">${u.eff.map(x => `<div class="small"><span class="tag" style="background:${FX[x.id].c};color:#fff">${FX[x.id].n}</span> <span class="dim">${FX[x.id].d}${x.turns < 90 ? " · " + x.turns + " turns" : ""}</span></div>`).join("")}</div>` : ""}
    ${ab ? `<p class="small" style="margin-top:8px"><b>Ability · ${esc(ab.name)}:</b> <span class="dim">${esc(ab.text)}</span></p>` : ""}
    ${u.held ? `<p class="small" style="margin-top:4px"><b>Held item · ${esc(HELD[u.held].n)}:</b> <span class="dim">${esc(HELD[u.held].d)}</span></p>` : ""}
    <p class="small" style="margin-top:4px"><b>Weak to:</b> <span class="dim">${defWeak(u.types).join(", ") || "nothing"}</span></p>`;
}
function popup(html) {
  const p = $("#bPop"); if (!p) return;
  p.innerHTML = `<div class="bpopbox">${html}<button class="btn ghost sm wide" style="margin-top:12px" id="bPopX">Close</button></div>`;
  p.hidden = false;
  $("#bPopX").onclick = () => { p.hidden = true; };
  p.onclick = ev => { if (ev.target === p) p.hidden = true; };
}
function press(el, onTap, onHold) {
  let timer = 0, held = false, sx = 0, sy = 0;
  el.addEventListener("pointerdown", ev => { held = false; sx = ev.clientX; sy = ev.clientY; clearTimeout(timer); timer = setTimeout(() => { held = true; onHold && onHold(ev); }, 430); });
  el.addEventListener("pointermove", ev => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 12) clearTimeout(timer); });
  el.addEventListener("pointerup", ev => { clearTimeout(timer); if (!held) onTap(ev); });
  el.addEventListener("pointercancel", () => clearTimeout(timer));
  el.addEventListener("contextmenu", ev => ev.preventDefault());
}
function unitAt(x, y) {
  let best = null, bd = 1e9;
  for (const vu of BT.vus.values()) {
    if (!vu.scr || vu.dead || vu.gone) continue;
    const s = vu.scr.s, h = ((vu.out && vu.out.h) || 80) * s, half = Math.max(26, ((vu.out && vu.out.w) || 60) * .5) * s;
    if (x > vu.scr.x - half - 6 && x < vu.scr.x + half + 6 && y > vu.scr.y - h - 16 && y < vu.scr.y + 10) {
      const d = Math.abs(x - vu.scr.x) + Math.abs(y - (vu.scr.y - h / 2)) * .5;
      if (d < bd) { bd = d; best = vu; }
    }
  }
  return best;
}
// trainer sprite that slides in for trainer battles
function showTrainer(on, line) {
  const el = $("#bTrainer"); if (!el || !BT.cfg.trainerSpr) return;
  el.classList.toggle("in", on);
  if (line != null) { const q = el.querySelector("q"); if (q) { q.textContent = line; q.hidden = !line; } }
}

// ---------- lifecycle ----------
function addVU(u, hidden) {
  const slot = SLOTS[u.slot % SLOTS.length], dir = u.team === "A" ? 1 : -1;
  const vu = { uid: u.uid, u, team: u.team, dir, face: dir, home: { x: -dir * slot[0], z: slot[1] }, pos: { x: -dir * slot[0], z: slot[1] }, y: 0,
    bs: u.boss ? 1.25 : 1, pose: { name: "idle", t0: 0, dur: 0 }, ph: R() * 6, hp: u.hp, lag: u.hp, sh: u.shield, tm: u.atb, tmT: u.atb,
    effs: [], st: u.status, stages: {}, dead: false, gone: false, trail: [], spawnT: hidden ? 1e15 : null, out: null, back: u.team === "A", want: dir };
  BT.vus.set(u.uid, vu);
  return vu;
}
function sizeCanvas() {
  const cv = BT.cv; if (!cv) return;
  const r = cv.parentElement.getBoundingClientRect();
  BT.dpr = Math.min(2, window.devicePixelRatio || 1);
  BT.W = Math.max(200, r.width); BT.H = Math.max(200, r.height);
  cv.width = Math.round(BT.W * BT.dpr); cv.height = Math.round(BT.H * BT.dpr);
  cv.style.width = BT.W + "px"; cv.style.height = BT.H + "px";
  const old = BT.home;
  BT.home = fitHome();
  if (!old) { BT.cam = { ...BT.home }; BT.camT = { ...BT.home }; }
  else if (!BT.act) Object.assign(BT.camT, BT.home);
}
function startBattle(cfg) {
  const B = makeBattle({ allies: cfg.allies, waves: cfg.waves, auto: S.settings.auto, aiStyle: S.settings.ai, weather: cfg.weather, trainer: cfg.trainer, wild: cfg.wild });
  Object.assign(BT, { B, cfg, quit: false, paused: false, speed: S.settings.speed, clock: 0, last: 0, parts: [], bolts: [], floats: [], arcs: [], rings: [], nades: [], slashes: [], balls: [],
    waits: [], tweens: [], target: null, active: null, picking: false, allyPick: null, orbit: false, act: null, inputRes: null, home: null, shake: 0, shx: 0, shy: 0, flash: 0, letterbox: 1, letterboxT: 1 });
  BT.vus = new Map();
  BT.env = buildEnv(cfg.env || "route");
  const root = $("#battle");
  root.innerHTML = `<div class="bwrap">
    <canvas id="bcv"></canvas>
    <div class="btop">
      <div class="bt-title"><small>${esc(cfg.sub || "")}</small><b>${esc(cfg.title || "Battle")}</b></div>
      ${cfg.weather ? `<span class="wx" title="${WEATHER[cfg.weather].n}">${WEATHER[cfg.weather].ic}</span>` : ""}
      <button class="tog ${B.auto ? "on" : ""}" id="bAuto" aria-label="Auto battle">AUTO</button>
      <button class="tog" id="bSpd" aria-label="Battle speed">${BT.speed}×</button>
      <button class="tog" id="bPause" aria-label="Pause">II</button>
    </div>
    <div class="turnstrip" id="bStrip"></div>
    ${cfg.trainerSpr ? `<div class="btrainer" id="bTrainer"><img class="px" src="${trainerURL(cfg.trainerSpr)}" alt=""><q hidden></q></div>` : ""}
    <div class="bplayer" id="bPlayer"><img class="px" src="${trainerURL(avatar())}" alt=""></div>
    <div class="bmsg" id="bMsg"></div>
    <div class="bctl" id="bCtl"></div>
    <div class="bpop" id="bPop" hidden></div>
  </div>`;
  root.hidden = false;
  BT.cv = $("#bcv"); BT.g = BT.cv.getContext("2d");
  sizeCanvas();
  for (const u of B.units) addVU(u, true);
  BT.on = true; BT.raf = requestAnimationFrame(frame);
  $("#bAuto").onclick = () => {
    B.auto = !B.auto; S.settings.auto = B.auto; save(); $("#bAuto").classList.toggle("on", B.auto); sfx("tap");
    if (B.auto && BT.inputRes) { const r = BT.inputRes; BT.inputRes = null; hideControls(); r("auto"); }
  };
  $("#bSpd").onclick = () => { BT.speed = BT.speed >= 3 ? 1 : BT.speed + 1; S.settings.speed = BT.speed; save(); $("#bSpd").textContent = BT.speed + "×"; sfx("tap"); };
  $("#bPause").onclick = () => {
    BT.paused = true; sfx("tap");
    popup(`<h2>Paused</h2><p class="small dim" style="margin:6px 0 12px">${esc(cfg.title || "")}</p>
      <div class="stack" style="gap:8px"><button class="btn wide" id="bRes">Resume</button>
      <button class="btn ghost wide" id="bAi">Auto tactics: ${{ balanced: "Balanced", aggressive: "Aggressive", safe: "Careful" }[S.settings.ai]}</button>
      <button class="btn ghost wide" id="bSnd">Sound: ${S.settings.sound ? "On" : "Off"}</button>
      <button class="btn red wide" id="bQuit">${cfg.wild ? "Run away" : "Forfeit"}</button></div>`);
    $("#bPopX").remove();
    const close = () => { $("#bPop").hidden = true; BT.paused = false; };
    $("#bPop").onclick = ev => { if (ev.target === $("#bPop")) close(); };
    $("#bRes").onclick = close;
    $("#bAi").onclick = () => { const order = ["balanced", "aggressive", "safe"]; S.settings.ai = order[(order.indexOf(S.settings.ai) + 1) % 3]; B.aiStyle = S.settings.ai; save(); $("#bAi").textContent = "Auto tactics: " + { balanced: "Balanced", aggressive: "Aggressive", safe: "Careful" }[S.settings.ai]; };
    $("#bSnd").onclick = () => { S.settings.sound = !S.settings.sound; save(); $("#bSnd").textContent = "Sound: " + (S.settings.sound ? "On" : "Off"); };
    $("#bQuit").onclick = () => { BT.quit = true; BT.paused = false; if (BT.inputRes) { BT.inputRes("quit"); BT.inputRes = null; } closeBattle(); cfg.onQuit && cfg.onQuit(); };
  };
  press(BT.cv, ev => {
    const r = BT.cv.getBoundingClientRect(), vu = unitAt(ev.clientX - r.left, ev.clientY - r.top);
    if (!vu) return;
    if (!BT.picking || !BT.B.waiting) { popup(unitPop(vu.u)); return; }
    if (BT.allyPick && vu.team === "A" && BT.inputRes) {
      const r2 = BT.inputRes; BT.inputRes = null; const slot = BT.allyPick; hideControls(); sfx("tap"); r2({ slot, t: vu.u }); return;
    }
    if (vu.team === "E" && BT.B.targetable(BT.B.waiting).includes(vu.u)) { BT.target = vu; sfx("tap"); BT.redrawControls && BT.redrawControls(); }
    else popup(unitPop(vu.u));
  }, ev => {
    const r = BT.cv.getBoundingClientRect(), vu = unitAt(ev.clientX - r.left, ev.clientY - r.top);
    if (vu) popup(unitPop(vu.u));
  });
  window.addEventListener("resize", sizeCanvas);
  runBattle();
}
function closeBattle() {
  BT.on = false; cancelAnimationFrame(BT.raf);
  window.removeEventListener("resize", sizeCanvas);
  const root = $("#battle"); root.hidden = true; root.innerHTML = "";
  BT.cv = null; BT.home = null;
  renderTop(); route(UI.view, UI.arg, true);
}
async function intro() {
  const h = BT.home, B = BT.B, cfg = BT.cfg;
  camTo({ ...h, tx: 220, ty: 60, yaw: h.yaw - .8, pitch: .4, dist: h.dist * 1.05 }, 1, true);
  const foes = [...BT.vus.values()].filter(v => v.team === "E"), mine = [...BT.vus.values()].filter(v => v.team === "A");
  for (const v of foes) dexSee(v.u.key);
  camTo({ ...h, tx: 170, yaw: h.yaw - .4, pitch: .26, dist: h.dist * .78 }, 1.25);
  if (B.trainer) {
    showTrainer(true, cfg.intro || "");
    say(`${B.trainer} would like to battle!`, true); sfx("special");
    await bwait(1100);
    say(`${B.trainer} sent out ${foes.map(v => v.u.n).join(", ")}!`);
    foes.forEach((v, k) => bwait(k * 170).then(() => throwBall(v, cfg.ball || "poke")));
    await bwait(700 + foes.length * 170);
    showTrainer(false);
  } else {
    foes.forEach((v, k) => { v.spawnT = BT.clock + 150 + k * 140; });
    addParts([200, 10, 0], 30, { col: "#7ac25a", speed: 140, vy: 120, life: 700, size: 3, g: 300, spread: 160, add: false });
    sfx("warp");
    say(foes.length === 1 ? `${foes[0].u.boss ? "" : "A wild "}${foes[0].u.n} appeared!` : `Wild ${foes.map(v => v.u.n).join(", ")} appeared!`, true);
    await bwait(1100);
  }
  camTo({ ...h, tx: -150, yaw: h.yaw + .35, pitch: .2, dist: h.dist * .72 }, 1.6);
  const pl = $("#bPlayer"); if (pl) pl.classList.add("in");
  await bwait(260);
  say(`Go! ${mine.map(v => v.u.n).join(", ")}!`, true);
  if (pl) pl.classList.add("throw");
  mine.forEach((v, k) => bwait(k * 150).then(() => throwBall(v, "poke")));
  await bwait(700 + mine.length * 150);
  if (pl) pl.classList.remove("in", "throw");
  BT.letterboxT = 0;
  camHome(1.8);
  updateStrip();
  await bwait(300);
}
async function runBattle() {
  const B = BT.B;
  await intro();
  hideControls();
  await play(B.ev.splice(0));
  while (!B.over && !BT.quit && BT.on) {
    const r = B.step();
    if (r === "input") {
      await play(B.ev.splice(0));
      if (BT.quit || !BT.on) return;
      if (B.auto) B.autoAct();
      else {
        camHome(3);
        const ch = await new Promise(res => { BT.inputRes = res; showControls(B.waiting); });
        if (ch === "quit" || BT.quit) return;
        if (ch === "auto") B.autoAct(); else B.playerAct(ch.slot, ch.t);
      }
      hideControls();
    }
    await play(B.ev.splice(0));
  }
  if (BT.quit || !BT.on) return;
  await outro();
}
async function outro() {
  const B = BT.B, res = B.result, h = BT.home, cfg = BT.cfg;
  hideControls(); BT.active = null;
  await bwait(250);
  const mine = [...BT.vus.values()].filter(v => v.team === "A" && !v.dead);
  if (res.win) {
    for (const v of mine) setPose(v, "victory", 0, false);
    const pl = $("#bPlayer"); if (pl) pl.classList.add("in", "win");
    camTo({ tx: avg(mine.map(v => v.pos.x)), ty: 50, tz: avg(mine.map(v => v.pos.z)), yaw: h.yaw + .5, pitch: .12, dist: fitDist(320, 360), fov: .62, roll: 0 }, 1.8);
    BT.orbit = true; sfx("win");
    if (B.trainer) { showTrainer(true, cfg.lose || ""); say(`You defeated ${B.trainer}!`, true); }
    else say(B.units.some(u => u.team === "E" && u.boss) ? "You won the battle!" : "You defeated the wild Pokémon!", true);
  } else {
    const foes = [...BT.vus.values()].filter(v => v.team === "E" && !v.dead);
    for (const v of foes) setPose(v, "victory", 0, false);
    camTo({ tx: avg(foes.map(v => v.pos.x)), ty: 50, tz: 0, yaw: h.yaw - .45, pitch: .16, dist: fitDist(320, 380), fov: .62, roll: 0 }, 1.4);
    sfx("lose"); say("You are out of usable Pokémon! You blacked out!", true);
  }
  BT.letterboxT = 1;
  await bwait(1700);
  recordBattle(res, B);
  const out = res.win ? cfg.onWin(res, B) : (cfg.onLose ? cfg.onLose(res, B) : { rewards: [] });
  save();
  const el = document.createElement("div");
  el.className = "result " + (res.win ? "win" : "lose");
  const missions = out.missions || null;
  el.innerHTML = `<div class="eyebrow">${esc(cfg.sub || "")}</div>
    <h1>${res.win ? "You won!" : "You blacked out!"}</h1>
    ${missions ? `<div class="bigstars">${[0, 1, 2].map(k => `<span class="${missions[k].ok ? "on" : ""}">${missions[k].ok ? IC.star : IC.starOff}</span>`).join("")}</div>
      <div class="stack" style="gap:4px;text-align:left">${missions.map(m => `<div class="mission">${m.ok ? IC.check : IC.cross}<span>${esc(m.n)}</span></div>`).join("")}</div>` : ""}
    ${out.levels && out.levels.length ? `<div class="lvups">${out.levels.map(l => `<div class="lvup"><img class="px" src="${sprFront(l.k)}" alt=""><span><b>${esc(OPS[l.k].n)}</b> ${l.to > l.from ? `grew to <b>Lv ${l.to}</b>!` : l.cap ? "is at the level cap" : `+${fmtFull(l.xp)} Exp.`}${l.evo ? ' <span class="good">Ready to evolve!</span>' : ""}</span></div>`).join("")}</div>` : ""}
    ${!res.win ? `<p class="small dim" style="max-width:36ch;text-align:center">Level up your Pokémon, bring types that hit the opponents super effectively, evolve them, or give them held items.</p>` : ""}
    ${out.rewards && out.rewards.length ? `<div class="rewards">${rewardsHTML(out.rewards)}</div>` : ""}
    <div class="row" style="gap:10px;margin-top:6px">
      ${cfg.retry ? `<button class="btn ghost" id="rRetry">Retry</button>` : ""}
      <button class="btn" id="rDone">Continue</button>
    </div>`;
  $(".bwrap").appendChild(el);
  $("#rDone").onclick = () => { closeBattle(); cfg.onClose && cfg.onClose(res); };
  if ($("#rRetry")) $("#rRetry").onclick = () => { const r = cfg.retry; closeBattle(); r(); };
}
