
// =====================================================================
//  BATTLE DIRECTOR — runs a real-time battle: the launch, the HUD (Spin, Bit Power, partners on the bench), the
//  Attack / technique / Bit-Beast / tag buttons, and the effects for everything the engine reports in B.ev.
//  The engine moves the Beyblades; the player (or Auto) only decides when to attack, use moves and tag.
// =====================================================================
const VU = uid => BT.vus.get(uid);
const avg = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const SPEEDS = [1, 1.5, 2];
const aspect = () => Math.min(1.7, BT.W / BT.H);
const fitDist = (extent, minD, fov = .62) => Math.max(minD, extent / (2 * Math.tan(fov / 2) * aspect()));
const artOf = u => u.isOp ? opArt(u.key) : enemyArt(u.key);
const sideCls = vu => vu.team === "A" ? "ls" : "ds";

// ---------- camera shots ----------
function focusShot(vu) {
  return { tx: vu.pos.x, ty: 70, tz: vu.pos.z, yaw: BT.home.yaw + (vu.team === "A" ? .35 : -.35), pitch: .3, dist: fitDist(320, 560), fov: .62, roll: 0 };
}

// ---------- fx helpers ----------
const elc = vu => ELC[vu.u.el] || "#ffffff";
function sparks(p, col, n = 14, k = 1) {
  addParts(p, n, { col, speed: 240 * k, life: 380, size: 2.4, g: 380, spread: 10 });
  addParts(p, Math.ceil(n / 2), { col: "#ffe9a0", speed: 300 * k, life: 260, size: 1.8, g: 500 });
}
function slashAt(p, col, big) { BT.slashes.push({ p, t0: BT.clock, dur: 260, col, rot: R() * Math.PI, big }); }
function drawSlashes(K) {
  const g = BT.g;
  BT.slashes = BT.slashes.filter(s => BT.clock - s.t0 < s.dur);
  for (const s of BT.slashes) {
    const p = proj(K, ...s.p); if (!p) continue;
    const k = (BT.clock - s.t0) / s.dur, r = (s.big ? 70 : 46) * p[2] * (.7 + k * .5);
    g.save(); g.translate(p[0], p[1]); g.rotate(s.rot + k * .6); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - k;
    g.lineCap = "round";
    g.strokeStyle = s.col; g.lineWidth = 10 * p[2] + 2; g.beginPath(); g.arc(0, 0, r, -1.1, 1.1); g.stroke();
    g.strokeStyle = "#fff"; g.lineWidth = 3 * p[2] + 1; g.beginPath(); g.arc(0, 0, r, -.9, .9); g.stroke();
    g.restore();
  }
}
function auraBurst(vu, col, ring = true) {
  vu.aura = BT.clock + 900; vu.auraCol = col;
  if (ring) BT.rings.push({ x: vu.pos.x, z: vu.pos.z, r0: 10, r1: 80, t0: BT.clock, dur: 700, col, w: 3 });
  addParts([vu.pos.x, 10, vu.pos.z], 16, { col, speed: 40, vy: 110, life: 800, size: 2.4, g: -20, spread: 40 });
}
function cutIn(vu, skillName) {
  const wrap = $(".bwrap"); if (!wrap) return;
  const d = (950 / BT.speed / 1000).toFixed(2) + "s";
  const el = document.createElement("div");
  el.className = "cutin"; el.style.setProperty("--ec", elc(vu));
  el.innerHTML = `<div class="band" style="animation-duration:${d}"></div><div class="lines" style="animation-duration:${d}"></div>
    <img src="${artOf(vu.u).beast}" alt="" style="animation-duration:${d};${vu.team === "E" ? "left:auto;right:-10%;transform:scaleX(-1)" : ""}">
    <div class="sk" style="animation-duration:${d}"><small>${esc(vu.u.def.beast && vu.u.def.beast.n ? vu.u.def.beast.n : vu.u.n)} · Bit-Beast attack</small><b>${esc(skillName)}</b></div>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 1000 / BT.speed + 60);
}
function banner(name, sub, cls, ms) {
  const b = $("#bBan"); if (!b) return;
  b.className = "bban show " + (cls || ""); b.innerHTML = `<small>${esc(sub)}</small><b>${esc(name)}</b>`;
  BT.banT = ms ? BT.clock + ms : 0;
}
function hideBanner() { const b = $("#bBan"); if (b) b.className = "bban"; BT.banT = 0; }

// ---------- engine events → visuals ----------
function onEv(e) {
  const vu = e.u != null ? VU(e.u) : null;
  switch (e.k) {
    case "enter": {
      if (!vu) break;
      Object.assign(vu, { shown: true, gone: false, dead: false, ringOut: false, fly: null, enterT: BT.clock, leaveT: null, y: 200, hp: vu.u.hp, lag: vu.u.hp, trail: [] });
      vu.pos.x = vu.u.x; vu.pos.z = vu.u.z;
      BT.cur[vu.team] = vu.u; BT.hudDirty = true;
      bwait(380).then(() => {
        BT.rings.push({ x: vu.pos.x, z: vu.pos.z, r0: 10, r1: 90, t0: BT.clock, dur: 500, col: vu.col, w: 3 });
        addParts([vu.pos.x, 4, vu.pos.z], 16, { col: "#ffe2a0", speed: 220, life: 340, size: 2.2, g: 320 });
      });
      sfx("launch");
      if (e.how === "tag") { banner(vu.u.n, vu.team === "A" ? "Tag in!" : "The rival tags in", sideCls(vu), 1000); floatText(e.u, "TAG IN!", "buff"); }
      else if (e.how === "ko") banner(vu.u.n, vu.team === "A" ? "Your next Beyblade" : "The rival's next Beyblade", sideCls(vu), 1100);
      break;
    }
    case "tagout": if (vu) { vu.leaveT = BT.clock; vu.trail = []; sfx("warp"); BT.hudDirty = true; } break;
    case "rush": if (vu) sfx("saber"); break;
    case "use": {
      if (!vu) break;
      if (e.slot === 2) banner(e.name, vu.u.n, sideCls(vu), 900);
      if (e.anim === "buff" || e.anim === "heal") { auraBurst(vu, e.anim === "heal" ? "#5dfc9b" : "#f2c14e"); sfx(e.anim === "heal" ? "heal" : "special"); }
      break;
    }
    case "hit": {
      if (!vu) break;
      if (e.kind === "wall") { sparks([e.x, 14, e.z], "#ffe2a0", 6, .7); break; }
      const av = e.a != null ? VU(e.a) : null, col = av ? elc(av) : "#ffffff", big = e.crit || e.big;
      const show = () => {
        if (!vu.shown) return;
        // clashes and recoil only show their bigger hits, so the numbers don't pile up
        if (e.kind === "recoil" || e.kind === "clash") { if (e.n >= vu.u.max.hp * .025) floatText(e.u, fmtFull(e.n), "chip"); return; }
        floatText(e.u, fmtFull(e.n), e.crit ? "crit" : e.glance ? "prot" : "dmg");
        if (e.adv && BT.clock - (vu.advT || -1e9) > 3000) { vu.advT = BT.clock; floatText(e.u, "TYPE ADVANTAGE", "txt"); }
        if (e.glance) floatText(e.u, "GLANCING", "txt");
        vu.flash = BT.clock + 160; sparks(chestW(vu), col, big ? 26 : 14); slashAt(chestW(vu), col, big);
        BT.shake = Math.max(BT.shake, e.crit ? 10 : big ? 8 : 4); sfx(e.crit ? "crit" : "clash");
      };
      if (e.delay) bwait(e.delay * 1000).then(show); else show();
      break;
    }
    case "clash": {
      const k = clamp(e.p / 400, .3, 1.6);
      sparks([e.x, 22, e.z], e.opp ? "#ffd34d" : "#cfe3ff", Math.round(10 * k), k);
      BT.shake = Math.max(BT.shake, 2 + 4 * k);
      if (BT.clock - (BT.clashT || -1e9) > 120) { BT.clashT = BT.clock; sfx("clash"); }
      break;
    }
    case "wave": {
      const col = vu ? elc(vu) : "#ffffff";
      BT.rings.push({ x: e.x, z: e.z, r0: 30, r1: e.big ? 560 : 400, t0: BT.clock, dur: 560, col, w: 5 });
      BT.rings.push({ x: e.x, z: e.z, r0: 20, r1: e.big ? 380 : 280, t0: BT.clock, dur: 420, col: "#ffffff", w: 2 });
      sfx("boom"); BT.shake = Math.max(BT.shake, 8);
      if (e.big) { BT.flash = .3; BT.flashCol = col; }
      break;
    }
    case "miss": if (vu) floatText(e.u, "DODGED", "txt"); break;
    case "txt": if (vu) floatText(e.u, e.s, e.c); break;
    case "heal": {
      if (!vu || (!e.shield && e.n < vu.u.max.hp * .02)) break;
      floatText(e.u, "+" + fmtFull(e.n), e.shield ? "prot" : "heal");
      addParts([vu.pos.x, 30, vu.pos.z], 8, { col: e.shield ? "#c8ffd6" : "#5dfc9b", speed: 30, vy: 90, life: 700, size: 2.2, g: -10, spread: 30 });
      break;
    }
    case "arc": {
      // the Bit-Beast rises out of the Bit-Chip while everything pauses
      if (!vu) break;
      const bst = vu.u.def.beast;
      BT.letterboxT = 1; sfx("special"); cutIn(vu, e.name);
      camTo(focusShot(vu), 4.5);
      if (bst && bst.kind) BT.beasts.push({ vu, kind: bst.kind, col: bst.col, t0: BT.clock, dur: 1900 });
      auraBurst(vu, bst && bst.col || elc(vu), true);
      break;
    }
    case "arcgo": {
      if (!vu) break;
      BT.letterboxT = 0; camHome(2.6);
      BT.flash = .45; BT.flashCol = (vu.u.def.beast && vu.u.def.beast.col) || elc(vu); BT.shake = 12; sfx("boom");
      break;
    }
    case "ko": {
      if (!vu) break;
      Object.assign(vu, { dead: true, deathT: BT.clock, hp: 0, sh: 0, rushing: false, trail: [] });
      if (e.ring) {
        // Ring Out: knocked over the lip of the dish and out of the stadium
        vu.ringOut = true; floatText(e.u, "RING OUT!", "crit"); sfx("ringout");
        banner("RING OUT!", vu.u.n, vu.team === "A" ? "ds" : "ls", 1300);
        const u = vu.u, r = Math.hypot(u.x, u.z) || 1, sp = Math.max(480, Math.hypot(u.vx, u.vz));
        vu.fly = { vx: u.x / r * sp * .85 + u.vx * .15, vz: u.z / r * sp * .85 + u.vz * .15, vy: 420 }; vu.tumble = R() < .5 ? -1 : 1;
        sparks(chestW(vu), "#ffe2a0", 30, 1.2); BT.shake = Math.max(BT.shake, 10);
      } else {
        floatText(e.u, "SLEEP OUT", "debuff"); sfx("sleepout");
        banner("SLEEP OUT", vu.u.n, vu.team === "A" ? "ds" : "ls", 1300);
        vu.fallDir = R() < .5 ? -1 : 1;
        addParts(chestW(vu), 14, { col: "#cfd6e2", speed: 50, vy: 30, life: 900, size: 2, g: -20, spread: 20 });
      }
      BT.hudDirty = true;
      break;
    }
    case "revive": if (vu) { Object.assign(vu, { dead: false, gone: false, ringOut: false, fly: null }); auraBurst(vu, "#ffd76b"); } break;
    case "burst": if (vu) { auraBurst(vu, "#ff7a2a"); sfx("special"); } break;
    case "over": BT.live = false; if (BT.onOver) { const f = BT.onOver; BT.onOver = null; f(); } break;
  }
}

// ---------- the loop: step the engine on its fixed time step, then place the Beyblades ----------
function stepBattle(dt) {
  const B = BT.B; if (!B) return;
  if (BT.live && !BT.paused) {
    BT.acc += dt / 1000; let n = 0;
    while (BT.acc >= DT && n++ < 8) {
      B.tick(); BT.acc -= DT;
      for (const e of B.ev) onEv(e);
      B.ev.length = 0;
      if (B.over) break;
    }
    if (n >= 8) BT.acc = 0;
  }
  BT.alpha = clamp(BT.acc / DT, 0, 1);
  if (BT.meterTick) BT.meterTick();
  if (BT.banT && BT.clock > BT.banT) hideBanner();
  syncVUs(dt);
  // the camera leans a little toward the action
  if (BT.home && !BT.letterboxT && BT.live) {
    const a = B.activeOf("A"), e = B.activeOf("E");
    const pts = [a, e].filter(Boolean);
    if (pts.length) { const mx = avg(pts.map(u => u.x)), mz = avg(pts.map(u => u.z)); BT.camT.tx = BT.home.tx + mx * .08; BT.camT.tz = BT.home.tz + mz * .08; }
  }
  updHUD();
}
function syncVUs(dt) {
  const B = BT.B, a = BT.alpha, sdt = dt / 1000, K = BT.K;
  for (const vu of BT.vus.values()) {
    const u = vu.u;
    if (vu.fly) { vu.pos.x += vu.fly.vx * sdt; vu.pos.z += vu.fly.vz * sdt; vu.fly.vy -= 1100 * sdt; vu.y = Math.max(0, vu.y + vu.fly.vy * sdt); continue; }
    if (vu.leaveT != null) { vu.y += 460 * sdt; continue; }   // lifted out of the dish by its Blader
    if (vu.dead || u.status !== "field") continue;
    // after the battle the winner keeps spinning round the dish
    if (B.over) { u.vx -= u.x * 1.4 * sdt; u.vz -= u.z * 1.4 * sdt; const f = Math.exp(-sdt * .8); u.vx *= f; u.vz *= f; u.px = u.x += u.vx * sdt; u.pz = u.z += u.vz * sdt; }
    vu.pos.x = lerp(u.px, u.x, a); vu.pos.z = lerp(u.pz, u.z, a);
    if (vu.enterT != null) { const k = clamp((BT.clock - vu.enterT) / 420, 0, 1); vu.y = 200 * (1 - k) * (1 - k); if (k >= 1) vu.enterT = null; }
    else vu.y = 0;
    vu.hp = u.hp; vu.sh = u.shield; vu.rushing = !!u.rush; vu.stall = B.has(u, "STUN"); vu.stealth = B.has(u, "STEALTH");
    if (K) vu.svx = u.vx * K.r[0] + u.vz * K.r[2];
    if (BT.paused) continue;
    if (vu.rushing || Math.hypot(u.vx, u.vz) > 400) { vu.trail.push([vu.pos.x, vu.pos.z, BT.clock]); if (vu.trail.length > 24) vu.trail.shift(); }
    if (vu.rushing && R() < .5) addParts([vu.pos.x, 2, vu.pos.z], 1, { col: "#ffe2a0", speed: 120, life: 200, size: 1.6, g: 200 });
  }
}

// ---------- HUD ----------
function skillIcon(u, sk) {
  if (!sk) return IC.boost;
  const ef = sk.effects || [];
  if (sk.target === "ally_single" || ef.some(e => /heal|revive/.test(e.type))) return IC.heal;
  if (ef.some(e => e.what === "TAUNT" || e.type === "shieldCasterHP")) return IC.shield;
  if (sk.target === "self" || sk.target === "team" || sk.target === "aoe_allies") return IC.boost;
  if (sk.target === "aoe_enemies") return IC.orb;
  return IC.claw || IC.sword;
}
// one side's panel: the Beyblade in the dish (Spin, Bit Power, effects) and its partners on the bench
function panelHTML(side) {
  const B = BT.B, u = BT.cur[side]; if (!u) return "";
  const bench = B.side[side].units.filter(m => m !== u);
  return `<img class="pp" src="${artOf(u).head}" alt="">
    <div class="pm">
      <div class="pn"><span class="pel" style="--ec:${ELC[u.el]}" title="${u.el}">${u.el[0]}</span><b>${esc(u.n)}</b>${u.boss ? `<span class="pboss">BOSS</span>` : ""}</div>
      <div class="ph"><i class="lag"></i><i class="cur"></i><i class="sh"></i></div>
      <div class="pb"><span class="segs">${"<i><b></b></i>".repeat(3)}</span><em>0%</em></div>
      <div class="pe"></div>
    </div>
    <div class="pbench">${bench.map(m => `<span class="bm" data-uid="${m.uid}"><img src="${artOf(m).head}" alt=""><i></i></span>`).join("")}</div>`;
}
// your buttons: tag partners on the left; technique, Bit-Beast attack and the big Attack button on the right
function ctlHTML() {
  const B = BT.B, u = BT.cur.A;
  if (B.over) return "";
  if (!u) return `<div class="bwait">Next Beyblade…</div>`;
  const sk = s => u.skills.find(x => x.slot === s) || { name: "", slot: s };
  const partners = B.side.A.units.filter(m => m !== u);
  return `<div class="btags">${partners.map(m => `<button class="tagbtn" data-uid="${m.uid}" aria-label="Tag in ${esc(m.n)}"><img src="${artOf(m).head}" alt=""><span class="cdw"></span><span class="cdt"></span><span class="hpb"><i></i></span><span class="tl">TAG</span></button>`).join("")}</div>
    <div class="bacts">
      <button class="actb s2" data-a="s2" aria-label="${esc(sk(2).name)}">${skillIcon(u, sk(2))}<span class="cdw"></span><span class="cdt"></span><span class="alabel">${esc(sk(2).name)}</span></button>
      <button class="actb s3" data-a="s3" aria-label="${esc(sk(3).name)}"><img src="${artOf(u).beast}" alt=""><span class="cdw"></span><span class="cdt"></span><span class="alabel">Bit-Beast</span></button>
      <button class="actb s1" data-a="atk" aria-label="Attack">${IC.launcher || IC.sword}<span class="cdw"></span><span class="alabel">Attack</span></button>
    </div>`;
}
function buildHUD() {
  const B = BT.B;
  for (const side of ["A", "E"]) {
    const el = $("#p" + side); if (!el) continue;
    el.innerHTML = panelHTML(side);
    el.classList.toggle("down", !!(BT.cur[side] && BT.cur[side].status === "out"));
    BT.hud[side] = { cur: $(".ph .cur", el), lag: $(".ph .lag", el), sh: $(".ph .sh", el), segs: $$(".segs i", el), pct: $(".pb em", el), fx: $(".pe", el), bench: $$(".bm", el), fxKey: "" };
    el.onclick = () => { if (BT.cur[side]) popup(unitPop(BT.cur[side])); };
  }
  const c = $("#bCtl"); if (!c) return;
  c.innerHTML = ctlHTML();
  for (const btn of $$(".actb", c)) btn.addEventListener("pointerdown", ev => { ev.preventDefault(); act(btn.dataset.a, btn); });
  for (const btn of $$(".tagbtn", c)) btn.addEventListener("pointerdown", ev => { ev.preventDefault(); act("tag:" + btn.dataset.uid, btn); });
  BT.ctl = { acts: $$(".actb", c), tags: $$(".tagbtn", c) };
  measureHUD();
}
function act(a, btn) {
  const B = BT.B; if (!B || !BT.live || BT.paused) return;
  if (B.press(a)) { sfx("tap"); btn.classList.add("hit"); setTimeout(() => btn.classList.remove("hit"), 140); }
  else { btn.classList.remove("no"); void btn.offsetWidth; btn.classList.add("no"); }
}
const setW = (el, f) => { if (!el) return; const v = Math.round(clamp(f, 0, 1) * 1000) / 10 + "%"; if (el.style.width !== v) el.style.width = v; };
const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
const setCD = (el, f) => { if (!el) return; const v = String(Math.round(clamp(f, 0, 1) * 100) / 100); if (el.style.getPropertyValue("--cd") !== v) el.style.setProperty("--cd", v); };
function benchState(side, m) {
  const B = BT.B, S = B.side[side];
  if (m.status === "out") return ["out", 0, ""];
  if (m.status === "field") return ["", 0, ""];
  if (m.tagUsed) return ["used", 0, "USED"];
  if (m.benchCD > 0) return ["cd", m.benchCD / TAG_CD, Math.ceil(m.benchCD) + "s"];
  if (S.tagLock > 0) return ["cd", S.tagLock / TAG_LOCK, Math.ceil(S.tagLock) + "s"];
  return ["ready", 0, "TAG"];
}
function updHUD() {
  const B = BT.B; if (!B) return;
  if (BT.hudDirty) { BT.hudDirty = false; buildHUD(); }
  for (const side of ["A", "E"]) {
    const h = BT.hud[side], u = BT.cur[side]; if (!h || !u || !h.cur) continue;
    const m = u.max.hp, vu = VU(u.uid);
    setW(h.cur, u.hp / m); setW(h.lag, (vu ? vu.lag : u.hp) / m); setW(h.sh, u.shield / m);
    const mc = B.mc[side];
    h.segs.forEach((s, k) => { const f = clamp((mc - k * 100) / 100, 0, 1); setW(s.firstChild, f); s.classList.toggle("full", f >= 1); });
    setTxt(h.pct, Math.floor(mc) + "%");
    const seen = new Set(), list = u.eff.filter(x => !seen.has(x.id) && seen.add(x.id)), key = list.map(x => x.id).join();
    if (key !== h.fxKey) { h.fxKey = key; h.fx.innerHTML = list.map(x => `<span class="${FX[x.id].b ? "" : "d"}">${FX[x.id].s}</span>`).join(""); }
    for (const el of h.bench) {
      const mb = B.byId(+el.dataset.uid), [st, cd] = benchState(side, mb);
      el.className = "bm " + st; setCD(el.lastChild, cd);
    }
  }
  const left = Math.max(0, TIME_LIMIT - B.t);
  setTxt($("#bClock"), Math.floor(left / 60) + ":" + String(Math.floor(left % 60)).padStart(2, "0"));
  const u = BT.cur.A, C = BT.ctl; if (!u || !C || u.status !== "field") return;
  for (const btn of C.acts) {
    const slot = btn.dataset.a === "atk" ? 1 : btn.dataset.a === "s2" ? 2 : 3, ok = B.ready(u, slot);
    let cd = 0, t = "";
    if (slot === 3) { const need = (u.skills.find(s => s.slot === 3) || {}).arc || 100; cd = 1 - clamp(B.mc.A / need, 0, 1); if (!ok) t = Math.floor(Math.min(B.mc.A, need)) + "%"; }
    else { cd = (u.cool[slot] || 0) / B.cdFor(u, slot); if (slot === 2 && u.cool[2] > 0) t = Math.ceil(u.cool[2]) + ""; }
    if (!ok && slot > 1 && (B.has(u, "SILENCE") || B.has(u, "PROVOKE"))) t = "✕";
    if (B.has(u, "STUN")) t = slot === 1 ? "" : "✕";
    btn.classList.toggle("off", !ok); btn.classList.toggle("ready", ok && slot === 3);
    setCD($(".cdw", btn), cd); if (slot > 1) setTxt($(".cdt", btn), t);
  }
  for (const btn of C.tags) {
    const m = B.byId(+btn.dataset.uid), [st, cd, t] = benchState("A", m), ok = B.canTag("A", m);
    btn.className = "tagbtn " + (ok ? "ready" : st);
    setCD($(".cdw", btn), cd); setTxt($(".tl", btn), ok ? "TAG" : t || "TAG"); setTxt($(".cdt", btn), st === "cd" ? t : "");
    setW($(".hpb i", btn), m.hp / m.max.hp);
  }
}
function skillLine(u, sk) {
  return `<div class="small" style="margin-top:6px"><b>${sk.arc ? "Bit-Beast" : sk.slot === 1 ? "Attack" : "S2"} · ${esc(sk.name)}</b> <span class="dim">${esc(sk.desc)}</span></div>`;
}
function unitPop(u) {
  const B = BT.B, e = B.effStat, bl = u.def.blader, bst = u.def.beast;
  const parts = PART_SLOTS.map(s => { const b = u.build[s], p = b.part;
    return `<div class="small">${SLOT_NAME[s]}: <b>${esc(PART_MODELS[b.m].n)}</b> <span style="color:${PART_GC[p ? p.rar : 0]}">${p ? PART_GRADE[p.rar] + (p.lvl ? " +" + p.lvl : "") : "Stock"}</span></div>`; }).join("");
  const st = benchState(u.team, u);
  return `<div class="row"><img class="bpt" src="${artOf(u).head}" alt=""><div><div class="eyebrow">${u.team === "A" ? "Your team" : "Rival"}${u.boss ? " · Boss" : ""}${bl ? " · " + esc(bl) : ""}</div><h3>${esc(u.n)}</h3>
    <div class="row" style="gap:4px;margin-top:3px"><span class="el ${u.el}">${u.el}</span>${bst && bst.n ? `<span class="el sty">${esc(bst.n)} · ${esc(bst.el)}</span>` : ""}</div></div></div>
    ${u.status === "bench" ? `<p class="small" style="margin-top:8px;color:var(--holo)">On the bench${st[0] === "cd" ? ` · can tag in after ${st[2]}` : st[0] === "used" ? " · already tagged in once (comes in if your Beyblade is knocked out)" : ""}</p>` : u.status === "out" ? `<p class="small" style="margin-top:8px;color:var(--debuff)">Out of the battle.</p>` : ""}
    <div class="statgrid" style="margin-top:10px">
      <div><span>Spin</span><b>${fmtFull(Math.round(u.hp))} / ${fmtFull(u.max.hp)}</b></div><div><span>Barrier</span><b>${fmtFull(Math.round(u.shield))}</b></div>
      <div><span>ATK</span><b>${fmtFull(Math.round(e.atk(u)))}</b></div><div><span>DEF</span><b>${fmtFull(Math.round(e.def(u)))}</b></div>
      <div><span>SPD</span><b>${Math.round(e.spd(u))}</b></div><div><span>Crit Rate</span><b>${pct(e.cr(u))}</b></div>
      <div><span>Accuracy</span><b>${pct(u.max.acc)}</b></div><div><span>Resistance</span><b>${pct(u.max.res)}</b></div>
    </div>
    ${u.eff.length ? `<div class="stack" style="gap:4px;margin-top:10px">${u.eff.map(x => `<div class="small"><span class="tag ${FX[x.id].b ? "ls" : "ds"}">${FX[x.id].n}</span> <span class="dim">${FX[x.id].d} · ${Math.ceil(x.t)}s</span></div>`).join("")}</div>` : `<p class="tiny dim" style="margin-top:10px">No active effects.</p>`}
    <div class="stack" style="gap:2px;margin-top:10px"><b class="gold small">Parts</b>${parts}<div class="tiny dim">${esc(partTraitText(u.build.bb.m))}</div></div>
    ${u.passives.length ? `<p class="small" style="margin-top:8px"><b class="gold">Blader Ability:</b> <span class="dim">${u.passives.map(p => esc(p.text || p.id)).join(" ")}</span></p>` : ""}
    <p class="small" style="margin-top:6px"><b class="gold">${esc(TYPE_TRAIT[u.el].n)}:</b> <span class="dim">${esc(TYPE_TRAIT[u.el].d)}</span></p>
    ${u.skills.slice().sort((a, b) => a.slot - b.slot).map(sk => skillLine(u, sk)).join("")}`;
}
// pop-ups pause the battle while they're open
function popup(html, keepPaused) {
  const p = $("#bPop"); if (!p) return;
  const was = BT.paused; BT.paused = true;
  p.innerHTML = `<div class="bpopbox">${html}<button class="btn ghost sm wide" style="margin-top:12px" id="bPopX">Close</button></div>`;
  p.hidden = false;
  const close = () => { p.hidden = true; BT.paused = keepPaused ? was : false; };
  $("#bPopX").onclick = close;
  p.onclick = ev => { if (ev.target === p) close(); };
}
function unitAt(x, y) {
  let best = null, bd = 1e9;
  for (const vu of BT.vus.values()) {
    if (!vu.scr || vu.dead || vu.gone || !vu.shown) continue;
    const s = vu.scr.s, cx = vu.scr.x, cy = vu.scr.y - 26 * s, d = Math.hypot(x - cx, y - cy);
    if (d < 52 * s + 14 && d < bd) { bd = d; best = vu; }
  }
  return best;
}

// ---------- the launch ----------
// Pull the ripcord: a needle swings across the meter, and tapping while it's in the gold zone is a Perfect Launch
const LAUNCH_ZONE = [.8, .94];
function launchQ(p) {
  const c = (LAUNCH_ZONE[0] + LAUNCH_ZONE[1]) / 2, h = (LAUNCH_ZONE[1] - LAUNCH_ZONE[0]) / 2, d = Math.abs(p - c);
  return d <= h ? .9 + .1 * (1 - d / h) : clamp(.85 - (d - h) * 2.2, .15, .85);
}
function launchMeter() {
  return new Promise(res => {
    const wrap = $(".bwrap"), el = document.createElement("div");
    el.className = "launch";
    el.innerHTML = `<div class="lhint">Pull the ripcord! Tap when the needle hits the gold zone</div>
      <div class="lmeter"><i class="lz" style="left:${LAUNCH_ZONE[0] * 100}%;width:${(LAUNCH_ZONE[1] - LAUNCH_ZONE[0]) * 100}%"></i><i class="ln"></i></div>
      <button class="btn lgo">LET IT RIP!</button>`;
    wrap.appendChild(el);
    const t0 = BT.clock, ln = $(".ln", el);
    let done = false;
    const pos = () => { const f = ((BT.clock - t0) / 1100) % 2; return f < 1 ? f : 2 - f; };
    const fire = ev => {
      if (ev) ev.preventDefault();
      if (done || BT.paused) return; done = true; BT.meterTick = null;
      const q = launchQ(pos());
      el.innerHTML = `<div class="lres">${q >= .9 ? "PERFECT!" : q >= .6 ? "GOOD!" : q >= .3 ? "OK" : "WEAK…"}</div>`;
      setTimeout(() => el.remove(), 700);
      res(q);
    };
    BT.meterTick = () => { ln.style.left = pos() * 100 + "%"; if (BT.clock - t0 > 8000) fire(); };
    el.addEventListener("pointerdown", fire);
  });
}
async function launchPhase() {
  const h = BT.home;
  banner(BT.cfg.title || "Battle", BT.cfg.sub || "", "ls");
  camTo({ ...h, yaw: h.yaw - .7, pitch: h.pitch * .75, dist: h.dist * 1.15 }, 1, true);
  camTo({ ...h }, 1.3);
  await bwait(900);
  for (const n of ["3", "2", "1"]) { banner(n, "Get ready", "ds"); sfx("count"); await bwait(400); }
  hideBanner();
  const q = BT.B.auto && !DEMO.on ? .75 : await launchMeter();
  banner("LET IT RIP!", "", "ls", 900); sfx("go");
  BT.letterboxT = 0;
  return q;
}

// ---------- lifecycle ----------
function addVU(u) {
  const vu = { uid: u.uid, u, team: u.team, pos: { x: u.x, z: u.z }, y: 0, bs: u.r / 38, ph: R() * 6, rot: u.def.left ? -1 : 1,
    hp: u.hp, lag: u.hp, sh: 0, shown: false, dead: false, gone: false, trail: [], out: null, col: u.team === "A" ? "#5fd4ff" : "#ff6a5a" };
  BT.vus.set(u.uid, vu);
  return vu;
}
function measureHUD() {
  const w = $(".bwrap"); if (!w) return;
  const r = w.getBoundingClientRect(), hud = $(".bhud"), c1 = $(".bacts"), c2 = $(".btags");
  const top = hud ? hud.getBoundingClientRect().bottom - r.top + 4 : 96;
  const tops = [c1, c2].filter(Boolean).map(e => e.getBoundingClientRect().top - r.top).filter(v => v > 0);
  // in landscape the buttons sit in the bottom corners, so the dish can reach down between them
  const bot = r.width / r.height > 1.05 ? 20 : tops.length ? r.height - Math.min(...tops) + 4 : 130;
  if (Math.abs(top - BT.mTop) > 2 || Math.abs(bot - BT.mBot) > 2) { BT.mTop = top; BT.mBot = bot; if (BT.home) { BT.home = fitHome(); if (!BT.letterboxT) Object.assign(BT.camT, BT.home); } }
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
  else if (!BT.letterboxT) Object.assign(BT.camT, BT.home);
  measureHUD();
}
function startBattle(cfg) {
  if (DEMO.on) { cfg = demoWrap(cfg); if (DEMO.sim) { demoSim(cfg); return; } }
  const B = makeBattle({ allies: cfg.allies, foes: cfg.foes, auto: S.settings.auto, aiStyle: S.settings.ai });
  Object.assign(BT, { B, cfg, quit: false, paused: !!(DEMO.on && DEMO.paused), speed: DEMO.on ? (DEMO.mode === "watch" ? 2 : 3) : SPEEDS[clamp((S.settings.speed || 1) - 1, 0, 2)], clock: 0, last: 0, parts: [], bolts: [], floats: [], arcs: [], rings: [], nades: [], slashes: [], beasts: [],
    waits: [], tweens: [], orbit: false, home: null, shake: 0, shx: 0, shy: 0, flash: 0, letterbox: 1, letterboxT: 1, live: false, acc: 0, alpha: 0,
    cur: { A: null, E: null }, hud: {}, ctl: null, hudDirty: true, banT: 0, meterTick: null, onOver: null, step: stepBattle });
  BT.vus = new Map();
  if (DEMO.on) B.pilot = demoPilot;
  BT.env = buildEnv(cfg.env || "bba");
  const root = $("#battle");
  root.innerHTML = `<div class="bwrap">
    <canvas id="bcv"></canvas>
    <div class="btop">
      <div class="bt-title"><small>${esc(cfg.sub || "")}</small><b>${esc(cfg.title || "Battle")}</b></div>
      <button class="tog ${B.auto ? "on" : ""}" id="bAuto" aria-label="Auto battle">AUTO</button>
      <button class="tog" id="bSpd" aria-label="Battle speed">${BT.speed}×</button>
      <button class="tog" id="bPause" aria-label="Pause">II</button>
    </div>
    <div class="bhud"><div class="bpan A" id="pA"></div><div class="bclock" id="bClock">5:00</div><div class="bpan E" id="pE"></div></div>
    <div class="bban" id="bBan"></div>
    <div class="bctl" id="bCtl"></div>
    <div class="bpop" id="bPop" hidden></div>
  </div>`;
  root.hidden = false;
  BT.cv = $("#bcv"); BT.g = BT.cv.getContext("2d");
  for (const u of B.units) addVU(u);
  BT.cur = { A: B.side.A.units[0], E: B.side.E.units[0] };
  sizeCanvas();
  BT.on = true; BT.raf = requestAnimationFrame(frame);
  $("#bAuto").onclick = () => { B.auto = !B.auto; S.settings.auto = B.auto; save(); $("#bAuto").classList.toggle("on", B.auto); sfx("tap"); };
  $("#bSpd").onclick = () => {
    const k = (SPEEDS.indexOf(BT.speed) + 1) % SPEEDS.length; BT.speed = SPEEDS[k]; S.settings.speed = k + 1; save();
    $("#bSpd").textContent = BT.speed + "×"; sfx("tap");
  };
  $("#bPause").onclick = () => {
    sfx("tap");
    popup(`<h2>Paused</h2><p class="small dim" style="margin:6px 0 12px">${esc(cfg.title || "")}</p>
      <div class="stack" style="gap:8px"><button class="btn wide" id="bRes">Resume</button>
      <button class="btn ghost wide" id="bAi">Auto AI: ${S.settings.ai}</button>
      <button class="btn ghost wide" id="bSnd">Sound: ${S.settings.sound ? "On" : "Off"}</button>
      <button class="btn red wide" id="bQuit">Forfeit</button></div>`);
    $("#bPopX").remove();
    $("#bRes").onclick = () => { $("#bPop").hidden = true; BT.paused = false; };
    $("#bAi").onclick = () => { const order = ["balanced", "aggressive", "safe"]; S.settings.ai = order[(order.indexOf(S.settings.ai) + 1) % 3]; B.aiStyle = S.settings.ai; save(); $("#bAi").textContent = "Auto AI: " + S.settings.ai; };
    $("#bSnd").onclick = () => { S.settings.sound = !S.settings.sound; save(); $("#bSnd").textContent = "Sound: " + (S.settings.sound ? "On" : "Off"); };
    $("#bQuit").onclick = () => { BT.quit = true; BT.paused = false; BT.live = false; closeBattle(); cfg.onQuit && cfg.onQuit(); };
  };
  BT.cv.addEventListener("pointerdown", ev => {
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
  BT.cv = null; BT.home = null; BT.step = null; BT.meterTick = null; BT.onOver = null;
  renderTop(); route(UI.view, UI.arg, true);
}
async function runBattle() {
  const B = BT.B;
  const q = await launchPhase();
  if (BT.quit || !BT.on) return;
  const boss = B.side.E.units.some(u => u.boss);
  B.start(q, boss ? .85 + R() * .1 : .5 + R() * .35);
  for (const e of B.ev) onEv(e);
  B.ev.length = 0;
  const first = B.side.A.units[0];
  if (first && q >= .6 && q < .9) floatText(first.uid, "GOOD LAUNCH", "buff");
  BT.live = true;
  await new Promise(res => { BT.onOver = res; });
  if (BT.quit || !BT.on) return;
  await outro();
}
async function outro() {
  const B = BT.B, res = B.result, h = BT.home;
  BT.cur.A = null; BT.hudDirty = true;
  await bwait(700);
  const win = [...BT.vus.values()].find(v => v.team === (res.win ? "A" : "E") && v.shown && !v.dead);
  if (win) { camTo({ ...focusShot(win), pitch: .26, dist: fitDist(260, 460) }, 1.6); BT.orbit = true; }
  if (res.win) { sfx("win"); banner("VICTORY", "Your Beyblade is still spinning", "ls"); }
  else { sfx("lose"); banner("DEFEAT", "Your team is out", "ds"); }
  BT.letterboxT = 1;
  await bwait(1800);
  hideBanner();
  recordBattle(res, B);
  const out = res.win ? BT.cfg.onWin(res, B) : (BT.cfg.onLose ? BT.cfg.onLose(res, B) : { rewards: [] });
  save();
  const el = document.createElement("div");
  el.className = "result";
  const missions = out.missions || null;
  el.innerHTML = `<div class="eyebrow">${esc(BT.cfg.sub || "")}</div>
    <h1 class="${res.win ? "gold" : "ds"}">${res.win ? "Victory" : "Defeat"}</h1>
    <p class="small dim">Battle time ${Math.floor(res.time / 60)}:${String(Math.floor(res.time % 60)).padStart(2, "0")} · ${res.alive} of ${res.alive + res.lost} Beyblades still spinning</p>
    ${missions ? `<div class="bigstars">${[0, 1, 2].map(k => `<span class="${missions[k].ok ? "on" : ""}">${missions[k].ok ? IC.star : IC.starOff}</span>`).join("")}</div>
      <div class="stack" style="gap:4px;text-align:left">${missions.map(m => `<div class="mission">${m.ok ? IC.check : IC.cross}<span>${esc(m.n)}</span></div>`).join("")}</div>` : ""}
    ${!res.win ? `<p class="small dim" style="max-width:36ch">Level up and Upgrade your Beyblades, fit better Customize Parts, tag tired Beyblades out before they stop, or bring types that beat the rival team: Attack beats Endurance, Endurance beats Defense, Defense beats Attack.</p>` : ""}
    ${out.rewards && out.rewards.length ? `<div class="rewards">${rewardsHTML(out.rewards)}</div>` : ""}
    <div class="row" style="gap:10px;margin-top:6px">
      ${BT.cfg.retry ? `<button class="btn ghost" id="rRetry">Retry</button>` : ""}
      <button class="btn" id="rDone">Continue</button>
    </div>`;
  $(".bwrap").appendChild(el);
  $("#rDone").onclick = () => { closeBattle(); BT.cfg.onClose && BT.cfg.onClose(res); };
  if ($("#rRetry")) $("#rRetry").onclick = () => { const r = BT.cfg.retry; closeBattle(); r(); };
}
