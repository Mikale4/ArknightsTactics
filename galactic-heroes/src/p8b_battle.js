
// =====================================================================
//  BATTLE DIRECTOR — plays engine events as animation + camera work,
//  drives the HUD and player input.
// =====================================================================
const VU = uid => BT.vus.get(uid);
const avg = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);

// ---------- sound (tiny WebAudio synth) ----------
const SFX = { ctx: null, noise: null };
function sfx(kind) {
  if (!S.settings.sound) return;
  try {
    const A = SFX.ctx || (SFX.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (A.state === "suspended") A.resume();
    const t = A.currentTime;
    const osc = (type, f0, f1, dur, vol, at = 0) => {
      const o = A.createOscillator(), g = A.createGain(); o.type = type; o.connect(g); g.connect(A.destination);
      o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + at + dur);
      g.gain.setValueAtTime(.0001, t + at); g.gain.exponentialRampToValueAtTime(vol, t + at + .015); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
      o.start(t + at); o.stop(t + at + dur + .02);
    };
    const noise = (dur, vol, freq = 1200) => {
      if (!SFX.noise) { const b = A.createBuffer(1, A.sampleRate * .6, A.sampleRate), d = b.getChannelData(0); for (let k = 0; k < d.length; k++) d[k] = R() * 2 - 1; SFX.noise = b; }
      const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(); s.buffer = SFX.noise; f.type = "lowpass"; f.frequency.value = freq;
      s.connect(f); f.connect(g); g.connect(A.destination);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.start(t); s.stop(t + dur);
    };
    if (kind === "blaster") osc("square", 1500 + R() * 300, 160, .17, .05);
    else if (kind === "saber") { osc("sawtooth", 95, 170, .14, .06); osc("sawtooth", 170, 70, .28, .045, .12); }
    else if (kind === "hit") noise(.12, .18, 900);
    else if (kind === "crit") { noise(.2, .28, 1600); osc("square", 300, 90, .2, .05); }
    else if (kind === "boom") { noise(.7, .45, 420); osc("sine", 120, 30, .6, .25); }
    else if (kind === "zap") { for (let k = 0; k < 4; k++) osc("square", 800 + R() * 900, 200 + R() * 300, .07, .03, k * .06); }
    else if (kind === "heal") { [523, 659, 784].forEach((f, k) => osc("sine", f, f * 1.01, .25, .05, k * .07)); }
    else if (kind === "special") { osc("sawtooth", 160, 640, .45, .045); osc("sine", 320, 1280, .45, .04); }
    else if (kind === "win") { [392, 523, 659, 784].forEach((f, k) => osc("triangle", f, f, .32, .07, k * .12)); }
    else if (kind === "lose") { [392, 330, 262].forEach((f, k) => osc("triangle", f, f * .98, .4, .06, k * .18)); }
    else if (kind === "flame") noise(.6, .2, 700);
    else if (kind === "tap") osc("sine", 880, 660, .05, .03);
    else if (kind === "warp") osc("sine", 200, 1400, .4, .04);
  } catch (e) { /* audio unavailable */ }
}

// ---------- camera shots ----------
const aspect = () => Math.min(1.7, BT.W / BT.H);
const fitDist = (extent, minD, fov = .62) => Math.max(minD, extent / (2 * Math.tan(fov / 2) * aspect()));
function focusShot(vu) {
  const h = (vu.u.def.fig.h || 1) * vu.bs;
  return { tx: vu.pos.x + vu.dir * 10, ty: 55 * h, tz: vu.pos.z, yaw: BT.home.yaw + vu.dir * .62, pitch: .07, dist: fitDist(90, 270 * Math.max(.75, h)), fov: .62, roll: -vu.dir * .035 };
}
function impactShot(a, t) {
  const d = Math.hypot(a.pos.x - t.pos.x, a.pos.z - t.pos.z);
  return { tx: (a.pos.x + t.pos.x) / 2, ty: 52, tz: (a.pos.z + t.pos.z) / 2, yaw: BT.home.yaw - a.dir * .4, pitch: .13, dist: fitDist(d + 150, 300), fov: .62, roll: 0 };
}
function aoeShot(ts, a) {
  return { tx: avg(ts.map(t => t.pos.x)), ty: 48, tz: avg(ts.map(t => t.pos.z)), yaw: BT.home.yaw - a.dir * .3, pitch: .2, dist: fitDist(380, 470, .66), fov: .66, roll: 0 };
}
function nudgeShot(px, pz, k, zoom) {
  const h = BT.home, land = BT.W / BT.H > 1.05;
  return { ...h, tx: lerp(h.tx, px, k), tz: lerp(h.tz, pz, k), dist: h.dist * (land ? zoom : 1 - (1 - zoom) * .4) };
}
function twoShot(a, t) {
  if (!t || t === a) return nudgeShot(a.pos.x, a.pos.z, .12, .95);
  return { ...nudgeShot((a.pos.x + t.pos.x) / 2, (a.pos.z + t.pos.z) / 2, .25, .88), yaw: BT.home.yaw + a.dir * .06 };
}

// ---------- movement ----------
async function moveTo(vu, x, z, speedMul = 1) {
  const sx = vu.pos.x, sz = vu.pos.z, d = Math.hypot(x - sx, z - sz);
  if (d < 4) return;
  vu.face = Math.sign(x - sx) || vu.dir;
  setPose(vu, "run", 0, false);
  await btween(clamp(d * 1.05, 180, 520) / speedMul, k => { vu.pos.x = lerp(sx, x, k); vu.pos.z = lerp(sz, z, k); vu.y = Math.sin(k * Math.PI) * 6; });
  vu.y = 0; vu.face = vu.dir; setPose(vu, "idle");
}
async function engage(a, t) {
  const x = t.pos.x - a.dir * 64 * t.bs, z = t.pos.z + (a.pos.z > t.pos.z ? 6 : -6);
  if (Math.hypot(a.pos.x - x, a.pos.z - z) < 12) return;
  await moveTo(a, x, z, 1.15);
}
async function returnHome() {
  const list = [...BT.vus.values()].filter(vu => !vu.dead && (Math.hypot(vu.pos.x - vu.home.x, vu.pos.z - vu.home.z) > 3 || vu.y > 1));
  await Promise.all(list.map(async vu => {
    if (vu.y > 1) { const y0 = vu.y; await btween(160, k => { vu.y = y0 * (1 - k); }); }
    await moveTo(vu, vu.home.x, vu.home.z, 1.25);
    vu.face = vu.dir;
  }));
}

// ---------- fx helpers ----------
function sparks(vu, col = "#ffd9a0", n = 14) { addParts(chestW(vu), n, { col, speed: 220, life: 380, size: 2.6, g: 380, spread: 10 }); }
function boltColor(vu) { return vu.u.def.fig.bolt || (vu.u.id === "rex" || vu.u.id === "jango" ? "#4aa3ff" : vu.u.id === "chewie" ? "#5dff7a" : "#ff4a3a"); }
async function fireBolt(a, t, k = 0) {
  const from = tipW(a, k % 2 && a.out && a.out.tip2 ? "tip2" : "tip");
  const to = chestW(t); to[0] += (R() - .5) * 10; to[1] += (R() - .5) * 14;
  const d = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]), dur = clamp(d / 2.4, 80, 240);
  BT.bolts.push({ from, to, t0: BT.clock, dur, col: boltColor(a), len: .32 });
  addParts(from, 5, { col: "#ffe2a0", speed: 60, life: 160, size: 3, g: 0 });
  sfx("blaster");
  await bwait(dur);
  addParts(to, 9, { col: boltColor(a), speed: 160, life: 300, size: 2.4, g: 200 });
}
function lightningArc(a, t, col, dur, key = "hand") {
  BT.arcs.push({ from: () => billboard(a, (a.out && a.out[key]) || [16, -60]), to: () => chestW(t), col, t0: BT.clock, dur });
}
function auraBurst(vu, col, ring = true) {
  vu.aura = BT.clock + 900; vu.auraCol = col;
  if (ring) BT.rings.push({ x: vu.pos.x, z: vu.pos.z, r0: 10, r1: 70, t0: BT.clock, dur: 700, col, w: 3 });
  addParts([vu.pos.x, 10, vu.pos.z], 16, { col, speed: 40, vy: 110, life: 800, size: 2.4, g: -20, spread: 40 });
}

// ---------- event playback ----------
async function gate() { while (BT.paused && BT.on) await new Promise(r => setTimeout(r, 120)); }
async function play(evs) {
  for (let i = 0; i < evs.length; i++) {
    if (BT.quit || !BT.on) return;
    await gate();
    await handle(evs[i]);
  }
}
async function handle(e) {
  const vu = e.u != null ? VU(e.u) : null;
  switch (e.k) {
    case "turn": {
      BT.active = vu;
      if (e.tms) for (const [uid, tm] of e.tms) { const v = VU(uid); if (v) v.tmT = tm; }
      if (vu) { vu.tmT = 0; camTo(twoShot(vu, null), 1.6); }
      await bwait(150);
      break;
    }
    case "wave": {
      for (const [uid, v] of BT.vus) if (v.team === "E" && v.dead) BT.vus.delete(uid);
      const list = e.units.map(uid => addVU(BT.B.byId(uid), true));
      banner(`Wave ${e.w + 1}`, "WAVE", "ds");
      BT.letterboxT = 1;
      camTo({ ...BT.home, tx: 200, yaw: BT.home.yaw - .45, dist: BT.home.dist * .75, pitch: .2 }, 2.2);
      await bwait(350);
      sfx("warp");
      list.forEach((v, k) => { v.spawnT = BT.clock + k * 110; setTimeout(() => warpFx(v), 0); });
      await bwait(1000);
      BT.letterboxT = 0; hideBanner(); camHome(2.4);
      await bwait(300);
      break;
    }
    case "act": {
      BT.act = e;
      if (!vu) break;
      const tv = e.t != null ? VU(e.t) : null;
      if (e.sp) {
        banner(e.name, vu.u.def.n, vu.team === "A" ? "ls" : "ds");
        BT.letterboxT = 1; sfx("special");
        camTo(focusShot(vu), 5.5);
        setPose(vu, e.anim === "buff" || e.anim === "heal" ? "buff" : e.anim === "lightning" || e.anim === "push" || e.anim === "choke" ? "cast" : "buff", 650);
        auraBurst(vu, vu.team === "A" ? "#5fd4ff" : "#ff4b4b", false);
        await bwait(720);
      } else {
        camTo(twoShot(vu, tv), 2.4);
        await bwait(100);
      }
      if (e.anim === "buff" || e.anim === "heal") {
        const col = e.anim === "heal" ? "#5dfc9b" : "#f2c14e";
        setPose(vu, "buff", 700);
        sfx(e.anim === "heal" ? "heal" : "special");
        const group = e.tgt === "allies" ? [...BT.vus.values()].filter(v => v.team === vu.team && !v.dead) : [vu];
        if (e.tgt === "allies") camTo({ ...BT.home, tx: avg(group.map(v => v.pos.x)), dist: fitDist(420, 460), yaw: BT.home.yaw + vu.dir * .25, pitch: .2 }, 3);
        for (const v of group) auraBurst(v, col);
        await bwait(600);
      }
      break;
    }
    case "atk": await doAttack(e); break;
    case "dmg": {
      if (!vu) break;
      const lostHp = e.hp < vu.hp;
      vu.hp = e.hp; vu.prot = e.prot;
      floatText(e.u, fmtFull(e.n), e.crit ? "crit" : e.dot ? "dot" : lostHp ? "dmg" : "prot");
      if (e.dot) { addParts(chestW(vu), 8, { col: "#c86bff", speed: 50, vy: 40, life: 600, size: 2.6, g: -30 }); await bwait(300); break; }
      vu.flash = BT.clock + 160;
      if (vu.hp > 0) setPose(vu, "hit", 360);
      if (e.crit) { BT.shake = Math.max(BT.shake, 9); sfx("crit"); } else sfx("hit");
      await bwait(50);
      break;
    }
    case "heal": {
      if (!vu) break;
      vu.hp = e.hp; vu.prot = e.prot;
      floatText(e.u, "+" + fmtFull(e.n), e.isProt ? "prot" : "heal");
      addParts([vu.pos.x, 30, vu.pos.z], 8, { col: e.isProt ? "#cfe3ff" : "#5dfc9b", speed: 30, vy: 90, life: 700, size: 2.2, g: -10, spread: 30 });
      await bwait(70);
      break;
    }
    case "txt": {
      if (!vu) break;
      floatText(e.u, e.s, e.c);
      if (e.evade) { const x0 = vu.pos.x; btween(260, k => { vu.pos.x = x0 - vu.dir * Math.sin(k * Math.PI) * 26; }); }
      await bwait(e.s === "STUNNED" ? 450 : 80);
      break;
    }
    case "fx": if (vu) { vu.effs = e.list; vu.stealth = e.list.some(x => x[0] === "stealth"); } break;
    case "tm": if (vu) { vu.tmT = e.tm; if (e.v >= 30) floatText(e.u, `+${Math.round(e.v)}% TURN METER`, "txt"); } break;
    case "death": {
      if (!vu) break;
      vu.dead = true; vu.deathT = BT.clock; vu.hp = 0; vu.prot = 0; vu.effs = [];
      addParts(chestW(vu), 26, { col: vu.team === "A" ? "#9fd8ff" : "#ffb0a0", speed: 90, vy: 60, life: 1100, size: 2.4, g: -40, spread: 26 });
      BT.shake = Math.max(BT.shake, 5);
      if (BT.target === vu) BT.target = null;
      await bwait(220);
      break;
    }
    case "end": {
      await returnHome();
      if (BT.letterboxT) { BT.letterboxT = 0; hideBanner(); }
      camHome(2.4); BT.act = null;
      await bwait(160);
      break;
    }
  }
}
function warpFx(v) {
  BT.rings.push({ x: v.home.x, z: v.home.z, r0: 50, r1: 8, t0: BT.clock, dur: 600, col: v.team === "A" ? "#5fd4ff" : "#ff6a5a", w: 3 });
  addParts([v.home.x, 0, v.home.z], 18, { col: v.team === "A" ? "#9fe0ff" : "#ffb0a0", speed: 30, vy: 200, life: 700, size: 2.2, g: 0, spread: 24 });
}

async function doAttack(e) {
  const a = VU(e.a), ts = e.t.map(VU).filter(v => v && !v.dead);
  if (!a || a.dead || !ts.length) return;
  const main = ts[0], sp = e.sp;
  switch (e.anim) {
    case "melee": case "zap": {
      await engage(a, main);
      if (sp) camTo(impactShot(a, main), 5);
      if (e.anim === "zap") {
        setPose(a, "cast", 420); await bwait(110);
        lightningArc(a, main, "#7fd4ff", 280); sfx("zap"); await bwait(170); sparks(main, "#9fe0ff");
      } else {
        setPose(a, "swing", 430); sfx("saber"); await bwait(205);
        sparks(main, (a.out && a.out.tipc) || "#ffe0a0");
        if (sp) { BT.shake = Math.max(BT.shake, 6); }
      }
      break;
    }
    case "spin": {
      const cx = avg(ts.map(t => t.home.x)) - a.dir * 90;
      await moveTo(a, cx, 0, 1.2);
      if (sp) camTo(aoeShot(ts, a), 4);
      a.spin = BT.clock; setPose(a, "swing", 600); sfx("saber");
      await bwait(300);
      for (const t of ts) sparks(t, (a.out && a.out.tipc) || "#ffe0a0", 8);
      BT.shake = Math.max(BT.shake, 7);
      bwait(300).then(() => { a.spin = null; });
      break;
    }
    case "shoot": case "volley": {
      if (sp) camTo(e.aoe ? aoeShot(ts, a) : impactShot(a, main), 4);
      const shots = e.anim === "volley" ? (e.aoe ? ts : [main, main, main]) : [main];
      setPose(a, "shoot", 260 + shots.length * 90);
      await bwait(50);
      await Promise.all(shots.map(async (t, k) => { await bwait(k * 85); await fireBolt(a, t, k); }));
      break;
    }
    case "lightning": {
      setPose(a, "cast", 760);
      if (sp) camTo(e.aoe ? aoeShot(ts, a) : impactShot(a, main), 4);
      await bwait(150);
      sfx("zap");
      for (const t of ts) { lightningArc(a, t, "#b9a6ff", 520); if (a.u.def.fig.type === "hood" || a.u.def.fig.w === "none") lightningArc(a, t, "#8fd0ff", 520, "tip"); }
      await bwait(260);
      for (const t of ts) { sparks(t, "#c9b8ff", 10); setPose(t, "hit", 400); }
      BT.shake = Math.max(BT.shake, 5);
      break;
    }
    case "push": {
      setPose(a, "cast", 600);
      if (sp) camTo(aoeShot(ts, a), 4);
      await bwait(160);
      sfx("special");
      BT.rings.push({ x: a.pos.x + a.dir * 40, z: a.pos.z, r0: 10, r1: 360, t0: BT.clock, dur: 520, col: "#9fe0ff", w: 5 });
      await bwait(220);
      for (const t of ts) { const x0 = t.pos.x; btween(380, k => { t.pos.x = x0 + a.dir * Math.sin(k * Math.PI) * 34; }); }
      BT.shake = Math.max(BT.shake, 6);
      break;
    }
    case "choke": {
      setPose(a, "choke", 1000);
      if (sp) camTo(impactShot(a, main), 4);
      await bwait(150);
      main.aura = BT.clock + 900; main.auraCol = "#7a3aff";
      await btween(320, k => { main.y = k * 28 + Math.sin(BT.clock / 30) * 1.5; });
      BT.shake = Math.max(BT.shake, 4);
      bwait(420).then(() => btween(160, k => { main.y = 28 * (1 - k); }));
      break;
    }
    case "grenade": {
      setPose(a, "throw", 620);
      if (sp) camTo(aoeShot(ts, a), 3.5);
      await bwait(260);
      const to = [avg(ts.map(t => t.pos.x)), 0, avg(ts.map(t => t.pos.z))];
      BT.nades.push({ from: tipW(a, "hand"), to, t0: BT.clock, dur: 520, h: 120 });
      await bwait(520);
      sfx("boom"); BT.flash = .55; BT.flashCol = "#ffd9a0"; BT.shake = 16;
      addParts([to[0], 10, to[2]], 50, { col: "#ff9a3a", speed: 260, vy: 160, life: 700, size: 4.5, g: 200, spread: 60 });
      addParts([to[0], 20, to[2]], 30, { col: "#5a4a40", speed: 80, vy: 90, life: 1200, size: 6, g: -20, spread: 80, add: false });
      BT.rings.push({ x: to[0], z: to[2], r0: 10, r1: 320, t0: BT.clock, dur: 520, col: "#ffcf8a", w: 6 });
      for (const t of ts) { const x0 = t.pos.x; btween(360, k => { t.pos.x = x0 + a.dir * Math.sin(k * Math.PI) * 30; t.y = Math.sin(k * Math.PI) * 18; }); }
      break;
    }
    case "flame": {
      setPose(a, "shoot", 900);
      if (sp) camTo(aoeShot(ts, a), 4);
      sfx("flame");
      await btween(560, k => {
        const t = ts[Math.min(ts.length - 1, Math.floor(k * ts.length))]; if (!t) return;
        const from = tipW(a), to = chestW(t);
        for (let n = 0; n < 3; n++) BT.parts.push({ p: [...from], v: [(to[0] - from[0]) * 2.4 + (R() - .5) * 60, (to[1] - from[1]) * 2.4 + R() * 40, (to[2] - from[2]) * 2.4 + (R() - .5) * 60],
          g: -40, t0: BT.clock, life: 420, size: 5 + R() * 4, col: R() < .5 ? "#ff8a2a" : "#ffd04a", add: true, drag: 1.2 });
      }, false);
      BT.shake = Math.max(BT.shake, 5);
      break;
    }
    default: {
      setPose(a, "shoot", 300); await fireBolt(a, main);
    }
  }
}

// ---------- DOM: HUD ----------
function abIcon(u, ab, i) {
  const an = defaultAnim(u, ab);
  if (ab.ai === "taunt") return IC.shield;
  if (an === "heal") return IC.heal;
  if (an === "buff") return IC.boost;
  if (an === "lightning" || an === "zap") return IC.lightning;
  if (an === "push" || an === "choke") return IC.force;
  if (an === "grenade") return IC.skull;
  if (an === "melee" || an === "spin") return IC.saber(u.def.fig.sc || "#c9d3e6");
  return IC.blaster;
}
function banner(name, sub, cls) {
  const b = $("#bBan"); if (!b) return;
  b.className = "bban show " + (cls || ""); b.innerHTML = `<small>${esc(sub)}</small><b>${esc(name)}</b>`;
}
function hideBanner() { const b = $("#bBan"); if (b) b.className = "bban"; }
function hideControls(txt = "") {
  BT.picking = false;
  const c = $("#bCtl"); if (c) c.innerHTML = txt ? `<div class="bwait">${txt}</div>` : "";
}
function showControls(u) {
  const B = BT.B, vu = VU(u.uid);
  BT.picking = true;
  const valid = B.targetable(u);
  if (!BT.target || BT.target.dead || !valid.includes(BT.target.u)) {
    const best = valid.slice().sort((a, b) => (a.hp + a.prot) / (a.max.hp + a.max.prot) - (b.hp + b.prot) / (b.max.hp + b.max.prot))[0];
    BT.target = best ? VU(best.uid) : null;
  }
  const c = $("#bCtl");
  c.innerHTML = `<div class="bwho"><img class="bpt" src="${portrait(u.id)}" alt=""><div class="bwn"><b>${esc(u.def.n)}</b><small>Tap an enemy to target · hold for details</small></div></div>
    <div class="babs">${u.def.ab.map((ab, i) => {
      const cd = u.cd[i], blocked = i > 0 && B.E.has(u, "abBlock"), ok = B.usable(u, i);
      return `<button class="abtn ${i ? "special" : ""} ${ok ? "" : "off"}" data-i="${i}" aria-label="${esc(ab.n)}">${abIcon(u, ab, i)}${!ok ? `<span class="cdv">${blocked && !cd ? "✕" : cd}</span>` : ""}<span class="alabel">${i ? "Special" : "Basic"}</span></button>`;
    }).join("")}</div>`;
  for (const btn of $$(".abtn", c)) {
    const i = +btn.dataset.i, ab = u.def.ab[i];
    press(btn, () => {
      if (!B.usable(u, i)) { sfx("tap"); popup(abilityPop(u, i)); return; }
      if (!BT.inputRes) return;
      sfx("tap");
      const r = BT.inputRes; BT.inputRes = null; hideControls();
      r({ i, t: ab.tgt === "enemy" && BT.target ? BT.target.u : null });
    }, () => popup(abilityPop(u, i)));
  }
  void vu;
}
function abilityPop(u, i) {
  const ab = u.def.ab[i], cd = u.cd[i];
  return `<div class="eyebrow">${i ? "Special ability" : "Basic ability"}${ab.cd ? ` · Cooldown ${ab.cd}` : ""}</div><h3 style="margin:4px 0 6px">${esc(ab.n)}</h3>
    <p class="small">${esc(ab.d)}</p>${cd ? `<p class="small" style="margin-top:6px;color:var(--debuff)">Ready in ${cd} turn${cd > 1 ? "s" : ""}.</p>` : ""}`;
}
function unitPop(u) {
  const st = k => BT.B.stat(u, k);
  return `<div class="row"><img class="bpt" src="${portrait(u.id)}" alt=""><div><div class="eyebrow">${u.team === "A" ? "Your squad" : "Enemy"}${u.boss ? " · Boss" : ""}</div><h3>${esc(u.def.n)}</h3>
    <div class="tiny dim">Lv ${u.prog.lvl} · ${u.prog.stars}★ · Gear ${roman(u.prog.gear)} · ${u.def.role}</div></div></div>
    <div class="statgrid" style="margin-top:10px">
      <div><span>Health</span><b>${fmtFull(u.hp)} / ${fmtFull(u.max.hp)}</b></div><div><span>Protection</span><b>${fmtFull(u.prot)} / ${fmtFull(u.max.prot)}</b></div>
      <div><span>Speed</span><b>${Math.round(st("spd"))}</b></div><div><span>Offense</span><b>${fmtFull(st("off"))}</b></div>
      <div><span>Armor</span><b>${Math.round(st("armor"))}%</b></div><div><span>Crit Chance</span><b>${pct(st("crit"))}</b></div>
      <div><span>Potency</span><b>${pct(u.max.pot)}</b></div><div><span>Tenacity</span><b>${pct(st("ten"))}</b></div>
    </div>
    ${u.eff.length ? `<div class="stack" style="gap:4px;margin-top:10px">${u.eff.map(e => `<div class="small"><span class="tag ${FX[e.id].b ? "ls" : "ds"}">${FX[e.id].n}${e.st > 1 ? " ×" + e.st : ""}</span> <span class="dim">${FX[e.id].d} · ${e.turns} turn${e.turns > 1 ? "s" : ""}</span></div>`).join("")}</div>` : `<p class="tiny dim" style="margin-top:10px">No active effects.</p>`}
    <p class="small" style="margin-top:10px"><b class="gold">${esc(u.def.uq.n)}</b> <span class="dim">${esc(u.def.uq.d)}</span></p>`;
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
    const s = vu.scr.s, top = vu.scr.y + ((vu.out && vu.out.head ? vu.out.head[1] : -92) - 16) * s;
    if (x > vu.scr.x - 32 * s - 6 && x < vu.scr.x + 32 * s + 6 && y > top - 10 && y < vu.scr.y + 10) {
      const d = Math.abs(x - vu.scr.x) + Math.abs(y - (top + vu.scr.y) / 2) * .5;
      if (d < bd) { bd = d; best = vu; }
    }
  }
  return best;
}

// ---------- battle lifecycle ----------
function addVU(u, hidden) {
  const slot = SLOTS[u.slot % 5], dir = u.team === "A" ? 1 : -1;
  const vu = { uid: u.uid, u, team: u.team, dir, face: dir, home: { x: -dir * slot[0], z: slot[1] }, pos: { x: -dir * slot[0], z: slot[1] }, y: 0,
    bs: u.boss ? 1.25 : 1, pose: { name: "idle", t0: 0, dur: 0 }, ph: R() * 6, hp: u.hp, prot: u.prot, lag: u.hp, tm: u.tm, tmT: u.tm,
    effs: u.eff.map(e => [e.id, e.st]), stealth: u.eff.some(e => e.id === "stealth"), dead: false, gone: false, trail: [], spawnT: hidden ? 1e15 : null, out: null };
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
  else if (!BT.act) { Object.assign(BT.camT, BT.home); }
}
function startBattle(cfg) {
  const B = makeBattle({ allies: cfg.allies, waves: cfg.waves });
  Object.assign(BT, { B, cfg, quit: false, paused: false, speed: S.settings.speed, clock: 0, last: 0, parts: [], bolts: [], floats: [], arcs: [], rings: [], nades: [],
    waits: [], tweens: [], target: null, active: null, picking: false, orbit: false, act: null, inputRes: null, home: null, shake: 0, shx: 0, shy: 0, flash: 0, letterbox: 1, letterboxT: 1 });
  B.auto = S.settings.auto;
  BT.vus = new Map();
  BT.env = buildEnv(cfg.env || "station");
  const root = $("#battle");
  root.innerHTML = `<div class="bwrap">
    <canvas id="bcv"></canvas>
    <div class="btop">
      <div class="bt-title"><small>${esc(cfg.sub || "")}</small><b>${esc(cfg.title || "Battle")}</b></div>
      <button class="tog ${B.auto ? "on" : ""}" id="bAuto" aria-label="Auto battle">AUTO</button>
      <button class="tog" id="bSpd" aria-label="Battle speed">${BT.speed}×</button>
      <button class="tog" id="bPause" aria-label="Pause">II</button>
    </div>
    <div class="bban" id="bBan"></div>
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
      <button class="btn ghost wide" id="bSnd">Sound: ${S.settings.sound ? "On" : "Off"}</button>
      <button class="btn red wide" id="bQuit">Retreat</button></div>`);
    $("#bPopX").remove();
    const close = () => { $("#bPop").hidden = true; BT.paused = false; };
    $("#bPop").onclick = ev => { if (ev.target === $("#bPop")) close(); };
    $("#bRes").onclick = close;
    $("#bSnd").onclick = () => { S.settings.sound = !S.settings.sound; save(); $("#bSnd").textContent = "Sound: " + (S.settings.sound ? "On" : "Off"); };
    $("#bQuit").onclick = () => { BT.quit = true; BT.paused = false; if (BT.inputRes) { BT.inputRes("quit"); BT.inputRes = null; } closeBattle(); cfg.onQuit && cfg.onQuit(); };
  };
  press(BT.cv, ev => {
    const r = BT.cv.getBoundingClientRect(), vu = unitAt(ev.clientX - r.left, ev.clientY - r.top);
    if (!vu || !BT.picking || !BT.B.waiting) return;
    if (vu.team === "E" && BT.B.targetable(BT.B.waiting).includes(vu.u)) { BT.target = vu; sfx("tap"); }
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
  const h = BT.home, B = BT.B;
  banner(BT.cfg.title || "Battle", BT.cfg.sub || "", BT.cfg.side === "dark" ? "ds" : "ls");
  camTo({ ...h, tx: 230, ty: 70, yaw: h.yaw - 1.05, pitch: .55, dist: h.dist * 1.15 }, 1, true);
  const foes = [...BT.vus.values()].filter(v => v.team === "E"), mine = [...BT.vus.values()].filter(v => v.team === "A");
  foes.forEach((v, k) => { v.spawnT = BT.clock + 200 + k * 120; bwait(200 + k * 120).then(() => warpFx(v)); });
  camTo({ ...h, tx: 160, yaw: h.yaw - .5, pitch: .3, dist: h.dist * .78 }, 1.25);
  sfx("warp");
  await bwait(1100);
  camTo({ ...h, tx: -170, yaw: h.yaw + .55, pitch: .16, dist: h.dist * .7 }, 1.6);
  mine.forEach((v, k) => { v.spawnT = BT.clock + k * 110; bwait(k * 110).then(() => warpFx(v)); });
  await bwait(1100);
  hideBanner(); BT.letterboxT = 0;
  camHome(1.8);
  await bwait(600);
  void B;
}
async function runBattle() {
  const B = BT.B;
  await intro();
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
        if (ch === "auto") B.autoAct(); else B.playerAct(ch.i, ch.t);
      }
      hideControls();
    }
    await play(B.ev.splice(0));
  }
  if (BT.quit || !BT.on) return;
  await outro();
}
async function outro() {
  const B = BT.B, res = B.result, h = BT.home;
  hideControls(); BT.active = null;
  await bwait(250);
  const mine = [...BT.vus.values()].filter(v => v.team === "A" && !v.dead);
  if (res.win) {
    for (const v of mine) setPose(v, "victory", 0, false);
    camTo({ tx: avg(mine.map(v => v.pos.x)), ty: 55, tz: avg(mine.map(v => v.pos.z)), yaw: h.yaw + .55, pitch: .1, dist: fitDist(320, 360), fov: .62, roll: 0 }, 1.8);
    BT.orbit = true; sfx("win"); banner("Victory", "", "ls");
  } else {
    const foes = [...BT.vus.values()].filter(v => v.team === "E" && !v.dead);
    for (const v of foes) setPose(v, "victory", 0, false);
    camTo({ tx: avg(foes.map(v => v.pos.x)), ty: 60, tz: 0, yaw: h.yaw - .5, pitch: .14, dist: fitDist(320, 380), fov: .62, roll: 0 }, 1.4);
    sfx("lose"); banner("Defeat", "", "ds");
  }
  BT.letterboxT = 1;
  await bwait(1700);
  hideBanner();
  const rewards = res.win ? BT.cfg.onWin(res, B) : (BT.cfg.onLose ? BT.cfg.onLose(res, B) : []);
  save();
  const el = document.createElement("div");
  el.className = "result";
  el.innerHTML = `<div class="eyebrow">${esc(BT.cfg.sub || "")}</div>
    <h1 class="${res.win ? "gold" : "ds"}">${res.win ? "Victory" : "Defeat"}</h1>
    ${res.win && BT.cfg.stars !== false ? `<div class="bigstars">${[1, 2, 3].map(k => `<span class="${k <= res.stars ? "on" : ""}">${k <= res.stars ? IC.star : IC.starOff}</span>`).join("")}</div>` : ""}
    ${!res.win ? `<p class="small dim" style="max-width:34ch">Upgrade your characters' gear, levels and stars, or try a different leader.</p>` : ""}
    ${rewards && rewards.length ? `<div class="rewards">${rewardsHTML(rewards)}</div>` : ""}
    <div class="row" style="gap:10px;margin-top:6px">
      ${BT.cfg.retry ? `<button class="btn ghost" id="rRetry">Retry</button>` : ""}
      <button class="btn" id="rDone">Continue</button>
    </div>`;
  $(".bwrap").appendChild(el);
  $("#rDone").onclick = () => { closeBattle(); BT.cfg.onClose && BT.cfg.onClose(res); };
  if ($("#rRetry")) $("#rRetry").onclick = () => { const r = BT.cfg.retry; closeBattle(); r(); };
}
