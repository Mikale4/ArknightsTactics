// =====================================================================
//  BATTLE DIRECTOR — runs the engine, turns its events into animation, and owns the HUD: both fighters' HP, ki
//  and guard gauges, the turn planner (pick up to three commands, then GO), and the action buttons: hold POWER to
//  charge an attack, tap GUARD as the ring closes, VANISH to dodge, and mash POWER in a beam struggle.
// =====================================================================
const VU = uid => BT.vus.get(uid);
const SPEEDS = [1, 1.5, 2];
const PLAN_TIME = 15;
const artOf = u => u.isOp ? opArt(u.key) : enemyArt(u.key);
const KIND_IC = { melee: "👊", ki: "✦", beam: "≋", finger: "☝", disc: "◎", bomb: "●", flash: "☀", freeze: "❄", buff: "▲", heal: "✚", swap: "⇄", charge: "⚡", move: "⇆", tag: "⟳" };

function banner(name, sub, cls, ms) {
  const b = $("#bBan"); if (!b) return;
  b.className = "bban show " + (cls || "");
  b.innerHTML = `${sub ? `<small>${esc(sub)}</small>` : ""}<b>${esc(name)}</b>`;
  clearTimeout(BT.banT);
  if (ms) BT.banT = setTimeout(() => { if (b.isConnected) b.className = "bban"; }, ms / Math.max(1, BT.speed * .8));
}
function hideBanner() { const b = $("#bBan"); if (b) b.className = "bban"; }
// a technique's name across the screen, with the fighter's portrait
function cutIn(u, name) {
  const w = $(".bwrap"); if (!w) return;
  const col = u.def.kiCol || "#7ad0ff", el = document.createElement("div");
  el.className = "cutin" + (u.team === "E" ? " foe" : ""); el.style.setProperty("--ec", col);
  el.innerHTML = `<div class="band"></div><div class="lines"></div><img src="${artOf(u).full}" alt=""><div class="sk"><small>${esc(u.n)}</small><b>${esc(name)}</b></div>`;
  w.appendChild(el);
  setTimeout(() => el.remove(), 1000 / Math.max(1, BT.speed * .7));
}

// ---------- events → animation ----------
function onEv(e) {
  const B = BT.B, vu = e.u ? VU(e.u) : null;
  if (e.k === "enter") {
    const v = vu; v.shown = true; v.gone = false; v.x = v.u.x - v.face * 420; v.alt = 260; v.alpha = 1;
    BT.hudDirty = true;
    if (BT.live) { floatText(e.u, v.u.n.toUpperCase(), "buff"); sfx("vanish"); }
  } else if (e.k === "turn") { BT.hudDirty = true; BT.planOpen = false; }
  else if (e.k === "go") { BT.hudDirty = true; }
  else if (e.k === "special") { cutIn(vu.u, e.name); sfx(e.kind === "beam" || e.kind === "bomb" || e.kind === "finger" ? "charge" : "special"); }
  else if (e.k === "act") { if (e.ph === "charge") sfx("charge"); if (e.ph === "dash") sfx("vanish"); }
  else if (e.k === "fire") {
    const from = VU(e.u);
    if (e.kind === "melee") { sfx("punch"); return; }
    if (e.kind === "flash") { BT.flash = 520; BT.flashCol = "#ffffff"; sfx("zap"); return; }
    const sp = from.u.def.kiCol || "#7ad0ff";
    addShot({ atk: e.atk, from: e.u, to: e.t, kind: e.kind, hits: e.hits, pow: e.pow, col: sp, spiral: /Special Beam/.test(e.name) });
    sfx(e.kind === "ki" || e.kind === "freeze" ? "ki" : e.kind === "disc" ? "zap" : "beam");
  } else if (e.k === "hit") {
    const tv = VU(e.u); if (!tv) return;
    const p = chestPos(tv);
    if (e.resp === "perfect") { tv.guardT = 320; ringAt(p[0], p[1], "#ffd34d", 90); sparks(p[0], p[1], "#ffe08a", 14); sfx("perfect"); }
    else if (e.resp === "guard") { tv.guardT = 320; ringAt(p[0], p[1], "#7ad0ff", 70); sparks(p[0], p[1], "#bfe8ff", 10); sfx("guard"); BT.shake = Math.max(BT.shake, 4); }
    else { tv.hitT = 380; tv.flash = 120; sparks(p[0], p[1], e.kind === "melee" ? "#ffffff" : VU(e.from).u.def.kiCol || "#ffd34d", e.heavy ? 26 : 14, e.heavy ? 1.6 : 1); if (e.heavy || e.kind === "bomb") { ringAt(p[0], p[1], "#ffffff", 140, 500); BT.shake = Math.max(BT.shake, e.kind === "bomb" ? 18 : 10); }
      sfx(e.crit ? "crit" : e.kind === "melee" ? "punch" : e.kind === "bomb" ? "boom" : "hit"); BT.shake = Math.max(BT.shake, 5); }
    if (e.dmg > 0) floatText(e.u, fmtFull(e.dmg), e.crit ? "crit" : "dmg");
    BT.hudDirty = true;
  } else if (e.k === "vanish") { vu.vanishT = 440; const p = chestPos(vu); sparks(p[0], p[1], "#ffffff", 8, .6); sfx("vanish"); }
  else if (e.k === "ko") { banner("KO", vu.u.n, vu.team === "A" ? "ds" : "ls", 1100); sfx("ko"); BT.shake = 12; BT.hudDirty = true; }
  else if (e.k === "transform") {
    BT.flash = 700; BT.flashCol = "#ffffff"; vu.auraCol = vu.u.def.aura || vu.auraCol; vu.aura = 1;
    banner(vu.u.n, `${ENEMY[e.from] ? ENEMY[e.from].n : "It"} transforms!`, "ds", 2000); sfx("transform"); BT.shake = 16; BT.hudDirty = true;
    const p = chestPos(vu); ringAt(p[0], p[1], vu.auraCol, 220, 800);
  } else if (e.k === "zenkai") { BT.flash = 300; BT.flashCol = "#ffd34d"; vu.aura = 1; sfx("transform"); }
  else if (e.k === "clash") { banner("BEAM STRUGGLE", BT.B.auto ? "" : "Mash POWER!", "ls", 1600); sfx("beam"); BT.shake = 6; BT.hudDirty = true; }
  else if (e.k === "clashPos") { BT.shake = Math.max(BT.shake, 3); }
  else if (e.k === "clashEnd") { BT.shake = 14; sfx("boom"); BT.hudDirty = true; }
  else if (e.k === "heal") { floatText(e.u, "+" + fmtFull(e.n), "heal"); sfx("heal"); BT.hudDirty = true; }
  else if (e.k === "txt") floatText(e.u, e.s, e.c);
  else if (e.k === "stun") { if (e.s === "BLIND") { BT.flash = 420; BT.flashCol = "#ffffff"; } }
  else if (e.k === "guardBreak") { const p = chestPos(vu); sparks(p[0], p[1], "#7ad0ff", 20, 1.4); sfx("crit"); }
  else if (e.k === "swap") { BT.flash = 500; BT.flashCol = "#b07bff"; sfx("warp"); BT.hudDirty = true; }
  else if (e.k === "guardUp") { vu.guardT = Math.max(vu.guardT, 240); }
  else if (e.k === "aura") { vu.aura = 1; }
  else if (e.k === "over") { if (BT.onOver) BT.onOver(); }
}
function stepBattle(dt) {
  const B = BT.B;
  if (BT.live && B.phase === "act") {
    BT.acc += dt;
    let n = 0;
    while (BT.acc >= DT * 1000 && n++ < 8 && B.phase === "act") { BT.acc -= DT * 1000; B.tick(); for (const e of B.ev) onEv(e); B.ev.length = 0; }
  } else BT.acc = 0;
  for (const e of B.ev) onEv(e); B.ev.length = 0;
  syncVUs(dt);
  if (BT.live && B.phase === "plan" && !BT.planOpen) openPlan();
  if (BT.live && B.phase === "plan" && BT.planOpen && !B.auto && BT.planT != null && !BT.paused) {
    BT.planT -= dt / 1000 / BT.speed;
    const bar = $("#pTime"); if (bar) bar.style.width = clamp(BT.planT / PLAN_TIME, 0, 1) * 100 + "%";
    if (BT.planT <= 0) goPlan();
  }
  if (BT.hudDirty || (BT.hudT = (BT.hudT || 0) + dt) > 90) { BT.hudT = 0; updHUD(); }
}
function syncVUs(dt) {
  const s = dt / 1000;
  for (const vu of BT.vus.values()) {
    const u = vu.u;
    if (u.status === "bench" && vu.shown) { vu.alt += 900 * s; vu.x -= vu.face * 600 * s; if (vu.alt > 600) { vu.shown = false; } continue; }
    if (!vu.shown) continue;
    // fighters hover; giants and a fallen fighter stand on the ground
    const baseAlt = u.status === "out" ? 0 : grounded(u) ? 0 : 70 + Math.sin(BT.clock / 500 + vu.ph) * 8;
    vu.alt += (baseAlt - vu.alt) * (1 - Math.exp(-s * (u.status === "out" ? 3 : 6)));
    let tx = u.x;
    // a melee strike lunges in so the fists connect
    if (u.act && u.act.c.kind === "melee" && (u.act.ph === "rec" || u.act.ph === "wind")) tx += Math.sign(BT.B.foeOf(u) ? BT.B.foeOf(u).x - u.x : vu.face) * 55;
    vu.x += (tx - vu.x) * (1 - Math.exp(-s * 14));
    const foe = u.status === "field" && BT.B.foeOf(u); if (foe) vu.face = Math.sign(foe.x - u.x) || vu.face;
    for (const k of ["hitT", "guardT", "vanishT", "flash"]) if (vu[k] > 0) vu[k] = Math.max(0, vu[k] - dt);
    if (vu.aura > 0) vu.aura = Math.max(0, vu.aura - s * .8);
  }
}

// ---------- HUD ----------
function panelHTML(side) {
  const B = BT.B, u = B.curOf(side) || B.side[side].cur;
  if (!u) return "";
  const bench = B.side[side].units.filter(x => x !== u);
  return `<img class="pp" src="${artOf(u).head}" alt="">
    <div class="pm">
      <div class="pn"><span class="pel" style="--ec:${ELC[u.el]}">${u.el[0]}</span>${u.boss ? '<span class="pboss">BOSS</span>' : ""}<b>${esc(u.n)}</b></div>
      <div class="ph"><i class="lag"></i><i class="cur"></i></div>
      <div class="pk"><i class="neg"></i><i class="pos"></i><em></em></div>
      <div class="pg"><i></i></div>
      <div class="pe"></div>
    </div>
    <div class="pbench">${bench.map(b => `<div class="bm ${b.status === "out" ? "out" : ""}" data-uid="${b.uid}"><img src="${artOf(b).head}" alt=""><i style="--hp:${clamp(b.hp / b.max.hp, 0, 1)}"></i></div>`).join("")}</div>`;
}
const setW = (el, f) => { if (!el) return; const v = Math.round(clamp(f, 0, 1) * 1000) / 10 + "%"; if (el.style.width !== v) el.style.width = v; };
const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
function updHUD() {
  const B = BT.B; if (!B) return;
  for (const side of ["A", "E"]) {
    const el = $("#p" + side); if (!el) continue;
    const u = B.side[side].cur; if (!u) continue;
    if (BT.hudDirty || el.dataset.uid !== String(u.uid) || el.dataset.key !== u.key) { el.innerHTML = panelHTML(side); el.dataset.uid = u.uid; el.dataset.key = u.key; el.classList.toggle("down", u.status === "out"); }
    const vu = VU(u.uid), f = clamp(u.hp / u.max.hp, 0, 1);
    vu.lag = vu.lag == null ? f : Math.max(f, vu.lag - .01);
    setW(el.querySelector(".ph .cur"), f); setW(el.querySelector(".ph .lag"), vu.lag);
    setW(el.querySelector(".pk .pos"), Math.max(0, u.ki) / KI_MAX); setW(el.querySelector(".pk .neg"), Math.max(0, -u.ki) / -KI_MIN);
    setTxt(el.querySelector(".pk em"), `${Math.round(u.ki)}`);
    el.querySelector(".pk").classList.toggle("ex", u.ki < 0);
    setW(el.querySelector(".pg i"), u.guard / GUARD_MAX); el.querySelector(".pg").classList.toggle("broken", !!u.broken);
    const pe = el.querySelector(".pe"), fx = u.eff.map(x => `<span class="${FX[x.id].b ? "" : "d"}">${FX[x.id].s}${x.turns}</span>`).join("") + (u.stunT > 0 ? `<span class="d">${u.stunK === "BREAK" ? "BRK" : FX[u.stunK] ? FX[u.stunK].s : "ST"}</span>` : "");
    if (pe && pe.innerHTML !== fx) pe.innerHTML = fx;
    for (const bm of el.querySelectorAll(".bm")) { const b = B.units.find(x => String(x.uid) === bm.dataset.uid); if (b) { bm.classList.toggle("out", b.status === "out"); bm.querySelector("i").style.setProperty("--hp", clamp(b.hp / b.max.hp, 0, 1)); } }
  }
  const d = B.dist();
  setTxt($("#bTurn"), `TURN ${B.turn}`);
  setTxt($("#bRange"), d <= NEAR + 30 ? "Close range" : d >= FAR - 60 ? "Long range" : "Mid range");
  BT.hudDirty = false;
  updCtl();
}
// ---------- the planner ----------
function planCost(list) { return list.reduce((a, c) => a + (c.kind === "charge" ? -c.gain : BT.B.kiCost(BT.B.curOf("A"), c)), 0); }
function openPlan() {
  const B = BT.B, u = B.curOf("A");
  BT.planOpen = true; BT.pick = []; BT.planT = PLAN_TIME;
  if (!u) return;
  if (B.auto || DEMO.on) {
    const list = B.planFor(u);
    if (DEMO.on) { BT.pick = []; renderCtl(); demoPlanTap(B, list); return; }
    BT.pick = list; renderCtl();
    bwait(DEMO.on ? 250 : 420).then(() => { if (BT.B === B && B.phase === "plan") goPlan(); });
    return;
  }
  renderCtl();
}
function goPlan() {
  const B = BT.B; if (B.phase !== "plan") return;
  B.plan(BT.pick.length ? BT.pick : null); B.go(); BT.planT = null;
  renderCtl();
}
function renderCtl() {
  const c = $("#bCtl"); if (!c) return;
  const B = BT.B;
  c.innerHTML = B.phase === "plan" ? planHTML() : actHTML();
  c.className = "bctl " + (B.phase === "plan" ? "planning" : "acting");
  bindCtl();
  measureHUD();
}
function planHTML() {
  const B = BT.B, u = B.curOf("A"); if (!u) return "";
  const H = B.hand(u), spent = planCost(BT.pick), left = u.ki - spent;
  const slots = [0, 1, 2].map(i => { const c = BT.pick[i]; return `<button class="pq ${c ? "on" : ""}" data-i="${i}" ${c ? "" : "disabled"}>${c ? `<span>${KIND_IC[c.kind] || ""}</span>${esc(c.name)}` : `<small>${i + 1}</small>`}</button>`; }).join("");
  return `<div class="plan">
    <div class="ptop"><div class="pti"><b>Turn ${B.turn}</b><small>Pick up to ${PLAN_SLOTS} commands · ki after: <b class="${left < 0 ? "neg" : ""}">${Math.round(left)}</b></small></div>
      <button class="btn pgo" id="pGo">GO!</button></div>
    <div class="pqs">${slots}</div>
    <div class="ptime"><i id="pTime"></i></div>
    <div class="cmds">${H.map(h => { const c = h.c, cost = h.cost, full = BT.pick.length >= PLAN_SLOTS, once = c.once && BT.pick.includes(c), tagged = BT.pick.some(x => x.kind === "tag");
      const no = !h.ok || full || once || tagged || (cost > 0 && left - cost < KI_MIN);
      const cls = c.basic ? (c.kind === "move" ? "mv" : c.kind === "charge" ? "chg" : c.kind === "tag" ? "tg" : "bas") : "tech";
      return `<button class="cmd ${cls}" data-c="${esc(c.id || c.name)}" ${no ? "disabled" : ""} title="${esc(c.desc || "")}"><span class="ci">${KIND_IC[c.kind] || ""}</span><b class="${Math.max(...c.name.split(" ").map(w => w.length)) > 9 ? "sm" : ""}">${esc(c.name)}</b><small>${c.kind === "charge" ? `+${c.gain} ki` : cost ? `${cost} ki` : h.why || "free"}</small></button>`; }).join("")}</div>
  </div>`;
}
function actHTML() {
  const B = BT.B;
  return `<div class="bacts">
    <div class="dcol"><button class="actb van" id="bVan" aria-label="Vanish"><b>VANISH</b><small>${VANISH_KI} ki</small></button>
      <button class="actb grd" id="bGrd" aria-label="Guard"><b>GUARD</b></button></div>
    <div class="qline" id="bQ"></div>
    <button class="actb pow" id="bPow" aria-label="Power"><i class="pfill"></i><b id="bPowL">POWER</b><small>hold</small></button>
  </div>`;
}
function updCtl() {
  const B = BT.B, u = B.curOf("A");
  if (B.phase === "act" && !$("#bPow")) renderCtl();
  if (B.phase === "plan" && BT.planOpen && !$(".plan")) renderCtl();
  const pw = $("#bPow");
  if (pw && u) {
    const a = u.act, winding = a && a.ph === "wind" && !a.noPow;
    pw.classList.toggle("ready", !!winding && !B.auto); pw.classList.toggle("mash", !!B.struggle);
    pw.style.setProperty("--p", winding ? a.pow : 0);
    setTxt($("#bPowL"), B.struggle ? "MASH!" : winding ? (a.pow >= 1 ? "MAX!" : "HOLD") : "POWER");
    $("#bGrd").classList.toggle("off", !B.canGuard(u)); $("#bVan").classList.toggle("off", !B.canVanish(u) || !B.incoming());
    const q = $("#bQ");
    if (q) { const cur = a && a.c ? [a.c] : [], list = [...cur, ...B.side.A.q]; const html = list.map((c, i) => `<span class="${i === 0 && a ? "now" : ""}">${KIND_IC[c.kind] || ""} ${esc(c.name)}</span>`).join("") || `<span class="dim">${u.stunT > 0 ? "Can't move!" : "…"}</span>`; if (q.innerHTML !== html) q.innerHTML = html; }
  }
}
function bindCtl() {
  const B = BT.B;
  for (const b of $$(".cmd")) b.onclick = () => {
    const u = B.curOf("A"), h = B.hand(u).find(x => (x.c.id || x.c.name) === b.dataset.c);
    if (!h || BT.pick.length >= PLAN_SLOTS) return;
    BT.pick.push(h.c); sfx("tap"); renderCtl();
    if (BT.pick.length >= PLAN_SLOTS && S.settings.autoGo) goPlan();
  };
  for (const b of $$(".pq.on")) b.onclick = () => { BT.pick.splice(+b.dataset.i, 1); sfx("tap"); renderCtl(); };
  const go = $("#pGo"); if (go) go.onclick = () => { sfx("go"); goPlan(); };
  const pw = $("#bPow");
  if (pw) {
    const down = ev => { ev.preventDefault(); if (B.struggle) { B.mash(); pw.classList.add("hit"); setTimeout(() => pw.classList.remove("hit"), 80); return; } B.hold(true); pw.classList.add("held"); };
    const up = () => { B.hold(false); pw.classList.remove("held"); };
    pw.addEventListener("pointerdown", down); pw.addEventListener("pointerup", up); pw.addEventListener("pointerleave", up); pw.addEventListener("pointercancel", up);
  }
  const gd = $("#bGrd"); if (gd) gd.addEventListener("pointerdown", ev => { ev.preventDefault(); if (!B.auto && B.guard()) { gd.classList.add("hit"); setTimeout(() => gd.classList.remove("hit"), 120); } else if (!B.auto) gd.classList.add("no"), setTimeout(() => gd.classList.remove("no"), 250); });
  const vn = $("#bVan"); if (vn) vn.addEventListener("pointerdown", ev => { ev.preventDefault(); if (!B.auto && !B.vanish()) { vn.classList.add("no"); setTimeout(() => vn.classList.remove("no"), 250); } });
}
// keyboard: Space holds POWER, G or J guards, V or K vanishes, Enter plans
function battleKeys(ev) {
  const B = BT.B; if (!BT.on || !B || B.auto) return;
  if (ev.repeat) return;
  const down = ev.type === "keydown";
  if (ev.code === "Space") { ev.preventDefault(); if (B.struggle && down) B.mash(); else B.hold(down); }
  else if (down && (ev.key === "g" || ev.key === "j")) B.guard();
  else if (down && (ev.key === "v" || ev.key === "k")) B.vanish();
  else if (down && ev.key === "Enter" && B.phase === "plan") goPlan();
}
function unitPop(u) {
  const op = u.isOp ? OPS[u.key] : null, d = u.def;
  const techs = [BASIC.rush, BASIC.blast, ...(u.techs || [])];
  return `<div class="row" style="gap:10px;align-items:center"><img class="bpt" src="${artOf(u).head}" alt="">
    <div><b class="gold" style="font:800 18px var(--f-display);letter-spacing:.04em">${esc(u.n)}</b><div class="small dim">Lv ${u.LV} · ${esc(u.el)}${u.boss ? " · Boss" : ""}</div></div></div>
    <p class="small" style="margin-top:6px">HP <b>${fmtFull(Math.max(0, u.hp))}</b> / ${fmtFull(u.max.hp)} · Ki <b>${Math.round(u.ki)}</b> · ATK ${fmtFull(u.max.atk)} · DEF ${fmtFull(u.max.def)} · SPD ${u.max.spd}</p>
    <p class="small" style="margin-top:6px"><b class="gold">${esc(TYPE_TRAIT[u.el].n)}:</b> <span class="dim">${esc(TYPE_TRAIT[u.el].d)}</span></p>
    ${(u.passives || []).map(p => `<p class="small" style="margin-top:6px"><b>${esc(p.name)}</b> <span class="dim">${esc(passiveDesc(p))}.</span></p>`).join("")}
    <div class="stack" style="gap:6px;margin-top:8px">${techs.map(t => `<div class="small"><b>${esc(t.name)}</b> <span class="dim">${esc(t.desc || "")}</span></div>`).join("")}</div>
    ${op ? "" : d.next ? `<p class="tiny dim" style="margin-top:6px">Beat it and it transforms.</p>` : ""}`;
}
function popup(html, keepPaused) {
  const p = $("#bPop"); if (!p) return;
  const was = BT.paused; BT.paused = true;
  p.innerHTML = `<div class="bpopbox">${html}<button class="btn wide" id="bPopX" style="margin-top:12px">Close</button></div>`;
  p.hidden = false;
  $("#bPopX").onclick = () => { p.hidden = true; BT.paused = keepPaused ? was : false; };
}
function measureHUD() {
  const w = $(".bwrap"); if (!w) return;
  const r = w.getBoundingClientRect(), hud = $(".bhud"), ctl = $("#bCtl");
  BT.mTop = hud ? hud.getBoundingClientRect().bottom - r.top + 6 : 96;
  BT.mBot = ctl && ctl.offsetHeight ? Math.min(r.height * .55, ctl.offsetHeight + 6) : 150;
}
function sizeCanvas() {
  const cv = BT.cv; if (!cv) return;
  const r = cv.parentElement.getBoundingClientRect();
  BT.dpr = Math.min(2, window.devicePixelRatio || 1);
  BT.W = Math.max(200, r.width); BT.H = Math.max(200, r.height);
  cv.width = Math.round(BT.W * BT.dpr); cv.height = Math.round(BT.H * BT.dpr);
  cv.style.width = BT.W + "px"; cv.style.height = BT.H + "px";
  measureHUD();
}

// ---------- lifecycle ----------
function startBattle(cfg) {
  if (DEMO.on) { cfg = demoWrap(cfg); if (DEMO.sim) { demoSim(cfg); return; } }
  const B = makeBattle({ allies: cfg.allies, foes: cfg.foes, auto: S.settings.auto || DEMO.on, aiStyle: S.settings.ai });
  Object.assign(BT, { B, cfg, quit: false, paused: !!(DEMO.on && DEMO.paused), speed: DEMO.on ? (DEMO.mode === "watch" ? 1.5 : 2) : SPEEDS[clamp((S.settings.speed || 1) - 1, 0, 2)], clock: 0, last: 0,
    parts: [], floats: [], shots: [], rings: [], waits: [], tweens: [], shake: 0, flash: 0, live: false, acc: 0, hudDirty: true, banT: 0, onOver: null, step: stepBattle, planOpen: false, pick: [], planT: null,
    cam: { x: 0, z: 1 } });
  BT.vus = new Map();
  if (DEMO.on) B.pilot = demoPilot;
  BT.env = buildEnv(cfg.env || "wasteland");
  const root = $("#battle");
  root.innerHTML = `<div class="bwrap">
    <canvas id="bcv"></canvas>
    <div class="btop">
      <div class="bt-title"><small>${esc(cfg.sub || "")}</small><b>${esc(cfg.title || "Battle")}</b></div>
      <button class="tog ${B.auto ? "on" : ""}" id="bAuto" aria-label="Auto battle">AUTO</button>
      <button class="tog" id="bSpd" aria-label="Battle speed">${BT.speed}×</button>
      <button class="tog" id="bPause" aria-label="Pause">II</button>
    </div>
    <div class="bhud"><div class="bpan A" id="pA"></div><div class="bmid"><b id="bTurn">TURN 1</b><small id="bRange"></small></div><div class="bpan E" id="pE"></div></div>
    <div class="bban" id="bBan"></div>
    <div class="bctl" id="bCtl"></div>
    <div class="bpop" id="bPop" hidden></div>
  </div>`;
  root.hidden = false;
  BT.cv = $("#bcv"); BT.g = BT.cv.getContext("2d");
  for (const u of B.units) addVU(u);
  sizeCanvas();
  BT.on = true; BT.raf = requestAnimationFrame(frame);
  $("#bAuto").onclick = () => { if (DEMO.on) return; B.auto = !B.auto; S.settings.auto = B.auto; save(); $("#bAuto").classList.toggle("on", B.auto); sfx("tap"); if (B.phase === "plan") { BT.planOpen = false; } renderCtl(); };
  $("#bSpd").onclick = () => {
    const k = (SPEEDS.indexOf(BT.speed) + 1) % SPEEDS.length; BT.speed = SPEEDS[k]; S.settings.speed = k + 1; save();
    $("#bSpd").textContent = BT.speed + "×"; sfx("tap");
  };
  $("#bPause").onclick = () => {
    sfx("tap");
    popup(`<h2>Paused</h2><p class="small dim" style="margin:6px 0 12px">${esc(cfg.title || "")}</p>
      <div class="small dim" style="margin-bottom:10px;text-align:left">Plan up to three commands, then GO. While they play out: <b>hold POWER</b> as an attack winds up to hit harder,
        tap <b>GUARD</b> as the ring around your fighter closes (gold = perfect guard), and <b>VANISH</b> to dodge (20 ki). Two beams at once make a beam struggle: mash POWER.
        Keys: Space = POWER, G = GUARD, V = VANISH, Enter = GO.</div>
      <div class="stack" style="gap:8px"><button class="btn wide" id="bRes">Resume</button>
      <button class="btn ghost wide" id="bAi">Auto AI: ${S.settings.ai}</button>
      <button class="btn ghost wide" id="bSnd">Sound: ${S.settings.sound ? "On" : "Off"}</button>
      <button class="btn red wide" id="bQuit">Give Up</button></div>`);
    $("#bPopX").remove();
    $("#bRes").onclick = () => { $("#bPop").hidden = true; BT.paused = false; };
    $("#bAi").onclick = () => { const order = ["balanced", "aggressive", "safe"]; S.settings.ai = order[(order.indexOf(S.settings.ai) + 1) % 3]; B.aiStyle = S.settings.ai; save(); $("#bAi").textContent = "Auto AI: " + S.settings.ai; };
    $("#bSnd").onclick = () => { S.settings.sound = !S.settings.sound; save(); $("#bSnd").textContent = "Sound: " + (S.settings.sound ? "On" : "Off"); };
    $("#bQuit").onclick = () => { BT.quit = true; BT.paused = false; BT.live = false; closeBattle(); cfg.onQuit && cfg.onQuit(); };
  };
  $("#pA").onclick = () => { const u = B.curOf("A"); if (u) popup(unitPop(u)); };
  $("#pE").onclick = () => { const u = B.curOf("E"); if (u) popup(unitPop(u)); };
  window.addEventListener("resize", sizeCanvas);
  document.addEventListener("keydown", battleKeys); document.addEventListener("keyup", battleKeys);
  runBattle();
}
function closeBattle() {
  BT.on = false; cancelAnimationFrame(BT.raf);
  window.removeEventListener("resize", sizeCanvas);
  document.removeEventListener("keydown", battleKeys); document.removeEventListener("keyup", battleKeys);
  const root = $("#battle"); root.hidden = true; root.innerHTML = "";
  BT.cv = null; BT.step = null; BT.onOver = null;
  renderTop(); route(UI.view, UI.arg, true);
}
async function runBattle() {
  const B = BT.B;
  B.start();
  for (const e of B.ev) onEv(e); B.ev.length = 0;
  fitCam(0, true);
  updHUD();
  const boss = B.side.E.units.find(u => u.boss);
  banner(BT.cfg.title || "Battle", boss ? `${boss.n} is here` : "Battle start", "ds", 1400);
  await bwait(1300);
  if (BT.quit || !BT.on) return;
  banner("FIGHT!", "", "ls", 700); sfx("go");
  BT.live = true;
  await new Promise(res => { BT.onOver = res; });
  if (BT.quit || !BT.on) return;
  await outro();
}
async function outro() {
  const B = BT.B, res = B.result;
  BT.live = false; renderCtl();
  const c = $("#bCtl"); if (c) c.innerHTML = "";
  await bwait(700);
  for (const vu of BT.vus.values()) if (vu.team === (res.win ? "A" : "E") && vu.u.status === "field") vu.aura = 1;
  if (res.win) { sfx("win"); banner("VICTORY", "Your party stands", "ls"); }
  else { sfx("lose"); banner("DEFEAT", "Your party has fallen", "ds"); }
  await bwait(1600);
  hideBanner();
  recordBattle(res, B);
  const out = res.win ? BT.cfg.onWin(res, B) : (BT.cfg.onLose ? BT.cfg.onLose(res, B) : { rewards: [] });
  save();
  const el = document.createElement("div");
  el.className = "result";
  const missions = out.missions || null;
  el.innerHTML = `<div class="eyebrow">${esc(BT.cfg.sub || "")}</div>
    <h1 class="${res.win ? "gold" : "ds"}">${res.win ? "Victory" : "Defeat"}</h1>
    <p class="small dim">${res.turns} turn${res.turns === 1 ? "" : "s"} · ${res.alive} of ${res.alive + res.lost} fighters still standing</p>
    ${missions ? `<div class="bigstars">${[0, 1, 2].map(k => `<span class="${missions[k].ok ? "on" : ""}">${missions[k].ok ? IC.star : IC.starOff}</span>`).join("")}</div>
      <div class="stack" style="gap:4px;text-align:left">${missions.map(m => `<div class="mission">${m.ok ? IC.check : IC.cross}<span>${esc(m.n)}</span></div>`).join("")}</div>` : ""}
    ${!res.win ? `<p class="small dim" style="max-width:36ch">Train your fighters (level, Zenkai Awakening, techniques and Proficiency), bring styles that beat the enemy (Striker beats Blaster, Blaster beats Defender, Defender beats Striker), and guard as the ring closes: a perfect guard stops everything.</p>` : ""}
    ${B.profNote && B.profNote.length ? `<p class="small" style="max-width:36ch"><b class="gold">Proficiency up:</b> ${B.profNote.map(esc).join(", ")}</p>` : ""}
    ${out.rewards && out.rewards.length ? `<div class="rewards">${rewardsHTML(out.rewards)}</div>` : ""}
    <div class="row" style="gap:10px;margin-top:6px">
      ${BT.cfg.retry ? `<button class="btn ghost" id="rRetry">Retry</button>` : ""}
      <button class="btn" id="rDone">Continue</button>
    </div>`;
  $(".bwrap").appendChild(el);
  $("#rDone").onclick = () => { closeBattle(); BT.cfg.onClose && BT.cfg.onClose(res); };
  if ($("#rRetry")) $("#rRetry").onclick = () => { const r = BT.cfg.retry; closeBattle(); r(); };
}
