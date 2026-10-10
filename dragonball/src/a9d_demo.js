
// =====================================================================
//  DEMO — a hands-free playthrough of the whole game, from a brand-new account to 100% completion:
//  the story with 3 stars on every battle, every Street Battle level, all 30 BBA Tower floors, Ranked #1, all 82
//  Beyblades and every BBA Record.
//  It plays in a sandbox: your own save is set aside (nothing is written while the demo runs) and comes back when the
//  demo ends. The demo uses the game's own screens and actions. The battles it shows play on screen on Auto; the rest
//  run through the same battle engine off screen (a few milliseconds each). Days pass between chapters (daily login,
//  Energy and Ranked attempts refill). If it runs short of Energy or materials it tops them up and counts them, so it
//  never stalls; the totals are on the last screen.
// =====================================================================
const DEMO_MODES = {
  highlights: { n: "Highlights", d: "The first battle of each chapter, every boss and the first battle of each mode play on screen. The rest are simulated.", pace: .8 },
  watch: { n: "Watch all", d: "Every story battle plays on screen. The longest way to watch.", pace: 1 },
  fast: { n: "Fast", d: "Battles are simulated and screens flash by. The quickest way to reach 100%.", pace: .3 },
};
const DEMO_STOP = { stop: 1 };
const rawWait = ms => new Promise(r => setTimeout(r, ms));
// waits that honour Pause, the demo's pace, and Exit (which unwinds the demo by throwing DEMO_STOP)
async function dwait(ms) {
  let left = ms * DEMO_MODES[DEMO.mode].pace;
  do { if (DEMO.stop) throw DEMO_STOP; await rawWait(40); if (!DEMO.paused) left -= 40; } while (left > 0);
  if (DEMO.stop) throw DEMO_STOP;
}
async function until(fn, max = 900000) {
  const t0 = Date.now();
  while (!fn()) { if (DEMO.stop) throw DEMO_STOP; if (Date.now() - t0 > max) throw new Error("a step took too long"); await rawWait(80); }
}
// let the page breathe during long simulated stretches
async function yieldUI() { await rawWait(0); if (DEMO.stop) throw DEMO_STOP; while (DEMO.paused) { await rawWait(100); if (DEMO.stop) throw DEMO_STOP; } }
const modalOpen = () => { const m = $("#modal"); return !!(m && !m.hidden); };
const busy = () => BT.on || !$("#dlg").hidden || !$("#gacha").hidden;
async function settle(ms = 700) { await until(() => !busy()); await dwait(ms); }

// ---------- completion (also shown on the Blader Card) ----------
function completionParts() {
  const nodes = Object.values(NODES), fights = nodes.filter(n => n.waves);
  return [
    { n: "Story stages cleared", v: nodes.filter(n => nodeStars(n.id) > 0).length, max: nodes.length },
    { n: "3 stars on every battle", v: fights.filter(n => nodeStars(n.id) >= 3).length, max: fights.length },
    { n: "Street Battle levels", v: HUNTS.reduce((a, h) => a + Math.min(6, S.hunt[h.id] || 0), 0), max: HUNTS.length * 6 },
    { n: "BBA Tower floors", v: Math.min(S.tower, TOWER_FLOORS), max: TOWER_FLOORS },
    { n: "World ranking #1", v: Math.max(0, 1500 - Math.max(1, S.arena.rank)), max: 1499, label: `#${fmtFull(S.arena.rank)}` },
    { n: "Beyblades collected", v: Object.keys(S.ops).filter(k => OPS[k]).length, max: OP_KEYS.length },
    { n: "BBA Records", v: achDone(), max: achTotal },
  ];
}
function completionPct() {
  const p = completionParts(), f = p.reduce((a, x) => a + Math.min(1, x.v / x.max), 0) / p.length;
  return f >= 1 ? 100 : Math.min(99, Math.floor(f * 100));
}

// ---------- the bar at the bottom, and a shield so stray taps can't derail the demo ----------
function demoBar() {
  let el = $("#demobar");
  if (!el) {
    el = document.createElement("div"); el.id = "demobar";
    el.innerHTML = `<b class="dtag">DEMO</b><div class="dcap"><small id="dbSub"></small><span id="dbCap"></span></div>
      <div class="dpct"><span id="dbPct">0%</span><i><b id="dbBar"></b></i></div>
      <button id="dbMode" aria-label="Demo speed"></button><button id="dbPause" aria-label="Pause demo">II</button><button id="dbExit" aria-label="Exit demo">✕</button>`;
    document.body.appendChild(el);
    const sh = document.createElement("div"); sh.id = "demoshield"; document.body.appendChild(sh);
    $("#dbMode").onclick = () => { const order = Object.keys(DEMO_MODES); DEMO.mode = order[(order.indexOf(DEMO.mode) + 1) % order.length]; toast(`Demo: ${DEMO_MODES[DEMO.mode].n}. ${DEMO_MODES[DEMO.mode].d}`); demoBar(); };
    $("#dbPause").onclick = () => { DEMO.paused = !DEMO.paused; if (BT.on) BT.paused = DEMO.paused; demoBar(); };
    $("#dbExit").onclick = () => demoEnd();
  }
  $("#dbCap").textContent = DEMO.cap || ""; $("#dbSub").textContent = DEMO.sub || "";
  const p = completionPct(); $("#dbPct").textContent = p + "%"; $("#dbBar").style.width = p + "%";
  $("#dbMode").textContent = DEMO_MODES[DEMO.mode].n; $("#dbPause").textContent = DEMO.paused ? "▶" : "II";
}
function demoCap(cap, sub) { DEMO.cap = cap; if (sub != null) DEMO.sub = sub; demoBar(); }
// the montage panel for the long simulated stretches
function montage(title, rows) {
  let el = $("#demomont");
  if (!rows) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "demomont"; document.body.appendChild(el); }
  el.innerHTML = `<div class="eyebrow">Fast-forward</div><h3>${esc(title)}</h3>${rows.map(([n, v, max]) => `<div class="mrow"><span>${esc(n)}</span><b class="num">${fmtFull(Math.min(v, max))} / ${fmtFull(max)}</b><i><b style="width:${Math.min(100, v / max * 100)}%"></b></i></div>`).join("")}`;
}

// ---------- the cursor: a pointer that glides to whatever the demo taps, so you can follow what it's doing ----------
function cursor() {
  let c = $("#democursor");
  if (!c) {
    c = document.createElement("div"); c.id = "democursor";
    c.innerHTML = `<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M2 2v24l6.5-6 4.5 10 4-2-4.5-9.5H21z" fill="#fff" stroke="#120818" stroke-width="2" stroke-linejoin="round"/></svg>`;
    document.body.appendChild(c);
    DEMO.cx = innerWidth / 2; DEMO.cy = innerHeight * .55;
    c.style.transform = `translate(${DEMO.cx}px,${DEMO.cy}px)`;
  }
  return c;
}
// glide to (x, y); `quick` for button presses in battle
async function glide(x, y, quick) {
  const c = cursor(), d = Math.hypot(x - DEMO.cx, y - DEMO.cy);
  const base = quick ? clamp(110 + d * .35, 120, 320) : clamp(240 + d * .8, 260, 720), ms = base * DEMO_MODES[DEMO.mode].pace;
  c.style.transition = `transform ${Math.round(ms)}ms cubic-bezier(.35,.1,.25,1)`;
  c.style.transform = `translate(${x}px,${y}px)`;
  DEMO.cx = x; DEMO.cy = y;
  await dwait(base + 30);
}
function ripple(x, y) {
  const r = document.createElement("div"); r.className = "demotap"; r.style.left = x + "px"; r.style.top = y + "px";
  document.body.appendChild(r); setTimeout(() => r.remove(), 600);
  const c = cursor(); c.classList.remove("press"); void c.offsetWidth; c.classList.add("press");
}
const visibleEl = el => { if (!el || el.disabled) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
const findEl = t => !t ? null : typeof t !== "string" ? (visibleEl(t) ? t : null) : [...document.querySelectorAll(t)].find(visibleEl) || null;
// scroll a button into view when it sits below the fold of a screen
async function reveal(el) {
  const r = el.getBoundingClientRect();
  if (r.top < 70 || r.bottom > innerHeight - 120) { el.scrollIntoView({ block: "center", behavior: "smooth" }); await dwait(550); }
}
// one cursor: taps from the playthrough, the autopilot and the battle pilot take turns
function cursorDo(fn) { const p = (DEMO.cq || Promise.resolve()).then(fn, fn); DEMO.cq = p.catch(() => {}); return p; }
// the cursor taps a button (an element or a selector): glide over, press, and fire it as a click, or as a pointerdown
// for the battle buttons. Returns false when there's nothing to tap.
function tap(t, how = "click", quick = false) {
  return cursorDo(async () => {
    let el = findEl(t); if (!el) return false;
    if (!quick) { await reveal(el); el = findEl(t) || el; }
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    await glide(x, y, quick);
    if (!el.isConnected || el.disabled) return false;
    ripple(x, y);
    if (how === "pointer") el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); else el.click();
    await dwait(quick ? 40 : 240);
    return true;
  });
}
// tap, or do it directly if the button isn't there
async function press(t, fallback) { if (!(await tap(t)) && fallback) fallback(); }
async function typeInto(t, text) {
  const el = findEl(t); if (!el) return;
  await tap(el);
  for (const ch of text) { el.value += ch; await dwait(75); }
}
// close a pop-up with its own button (Collect, Close, Continue)
async function closeM() {
  if (!modalOpen()) return;
  if (!(await tap(`#modal [data-act="closeModal"]`)) && !(await tap(`#modal [data-act="chapter"]`))) closeModal();
  await dwait(300);
}
// go to a screen the way a player would: tabs, the Home buttons, the tiles on the Story and Battle screens
async function nav(view, arg) {
  const on = () => UI.view === view && (arg == null || UI.arg === arg);
  const step = async sel => { if (!on()) { await tap(sel); await dwait(380); } };
  const via = async (hub, sel) => { if (UI.view !== hub) await step(`#tabs [data-v="${hub}"]`); await step(sel); };
  if (on()) return;
  if (["home", "story", "battle", "ops", "hh"].includes(view)) await step(`#tabs [data-v="${view}"]`);
  else if (view === "inbox") await via("home", `.stage [data-act="inbox"]`);
  else if (["ach", "shop", "depot"].includes(view)) await via("home", `.stage [data-act="go"][data-v="${view}"]`);
  else if (view === "settings") await step(`#topbar [data-act="settings"]`);
  else if (view === "chapter") await via("story", `[data-act="chapter"][data-c="${arg}"]`);
  else if (["hunt", "tower", "arena"].includes(view)) await via("battle", `[data-act="go"][data-v="${view}"]${arg ? `[data-a="${arg}"]` : ""}`);
  else if (view === "op") await via("ops", `[data-act="go"][data-v="op"][data-a="${arg}"]`);
  if (!on()) route(view, arg);
}
// in battles on screen the AI decides and the cursor presses the button (startBattle sets B.pilot)
function demoPilot(a) {
  const B = BT.B, sel = a.startsWith("tag:") ? `.tagbtn[data-uid="${a.slice(4)}"]` : `.actb[data-a="${a}"]`;
  tap(sel, "pointer", true).then(ok => { if (!ok && BT.B === B && !B.over) B.press(a); }, () => {}).finally(() => { B.pilotBusy = false; });
}
// the launch: hover over LET IT RIP! and tap when the needle reaches the gold zone (now and then only a good launch)
function launchTap() {
  return cursorDo(async () => {
    const btn = findEl(".launch .lgo"); if (!btn) return;
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    await glide(x, y);
    const [lo, hi] = R() < .8 ? [83, 91] : [68, 78];
    await new Promise(res => { const t0 = performance.now(); const f = () => { const ln = $(".launch .ln"), p = ln ? parseFloat(ln.style.left) : -1;
      if (!ln || DEMO.stop || (p >= lo && p <= hi) || performance.now() - t0 > 7000) res(); else requestAnimationFrame(f); }; f(); });
    const L = $(".launch"); if (!L) return;
    ripple(x, y); L.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await dwait(300);
  });
}

// ---------- autopilot: story scenes, Booster reveals, the launch and result screens, tapped by the cursor ----------
function autopilot() {
  if (!DEMO.on) return;
  demoBar();
  if (DEMO.paused || DEMO.apBusy || DEMO.done) return;
  const now = performance.now(), dlg = $("#dlg"), g = $("#gacha"), rd = $("#rDone"), lg = $(".launch .lgo");
  const run = job => { DEMO.apBusy = true; job().catch(() => {}).finally(() => { DEMO.apBusy = false; }); };
  if (!dlg.hidden) {
    DEMO.dlgT = DEMO.dlgT || now;
    const quick = DEMO.mode === "fast" || (DEMO.sim && DEMO.mode !== "watch");
    if (DEMO.mode === "watch" && !DEMO.sim) { const a = $("#dAuto"); if (a && !a.classList.contains("on")) run(() => tap(a)); }
    else if (now - DEMO.dlgT > (quick ? 700 : 2600)) { DEMO.dlgT = 0; run(() => tap("#dSkip")); }
    return;
  }
  DEMO.dlgT = 0;
  if (!g.hidden) {
    const done = $("#gDone");
    if (done && !done.hidden) { DEMO.gT = DEMO.gT || now; if (now - DEMO.gT > (DEMO.mode === "fast" ? 500 : 1600)) { DEMO.gT = 0; run(() => tap(done)); } }
    else if (now - (DEMO.gT2 = DEMO.gT2 || now) > 700) { DEMO.gT2 = 0; run(() => tap(g)); }
    return;
  }
  DEMO.gT = DEMO.gT2 = 0;
  if (lg) { if (!DEMO.launching) { DEMO.launching = true; run(launchTap); } return; }
  DEMO.launching = false;
  if (rd) { DEMO.rT = DEMO.rT || now; if (now - DEMO.rT > (DEMO.mode === "fast" ? 600 : 2200)) { DEMO.rT = 0; run(() => tap(rd)); } } else DEMO.rT = 0;
}

// ---------- battles: shown on screen, or simulated with the same rules ----------
// startBattle() hands every demo battle here first: the battle's own onClose is wrapped so the demo knows when it's
// over, and simulated battles never open the battle screen.
function demoWrap(cfg) {
  const oc = cfg.onClose;
  return { ...cfg, onClose: async r => { try { if (oc) await oc(r); } finally { DEMO.closed = true; } } };
}
function demoSim(cfg) { DEMO.simP = demoSimRun(cfg); }
async function demoSimRun(cfg) {
  const B = makeBattle({ allies: cfg.allies, foes: cfg.foes, auto: true, aiStyle: "balanced" });
  const boss = B.side.E.units.some(u => u.boss);
  B.start(.75, boss ? .85 + R() * .1 : .5 + R() * .35);
  let n = 0;
  while (!B.over && n++ < 12000) { B.tick(); B.ev.length = 0; }
  const res = B.result || { win: false, alive: 0, lost: B.side.A.units.length, time: B.t };
  recordBattle(res, B);
  if (res.win) cfg.onWin(res, B); else if (cfg.onLose) cfg.onLose(res, B);
  await cfg.onClose(res);
}
// run one battle; `visible` shows it on screen, reached by tapping through the screens (`taps`, which ends on the team
// screen's Let it rip!), otherwise `launch` starts it off screen. `quick` skips the pauses between simulated battles.
async function fight(launch, visible, taps, quick) {
  DEMO.sim = !visible; DEMO.result = null; DEMO.closed = false; DEMO.simP = null;
  const started = visible && taps ? await taps() : false;
  if (!started) launch();
  if (quick && !visible) {
    if (DEMO.simP) await DEMO.simP; else await until(() => DEMO.closed);
    if (DEMO.stop) throw DEMO_STOP;
    if (modalOpen()) closeModal();
  } else {
    await until(() => DEMO.closed && !BT.on);
    await settle(visible ? 600 : 150);
    if (modalOpen()) { await dwait(visible ? 1400 : 300); if (visible) await closeM(); else closeModal(); }
  }
  visible ? DEMO.shown++ : DEMO.simmed++;
  DEMO.sim = false;
  // a short log of recent battles, for the "stopped early" message and for tests
  const r = DEMO.result || {};
  DEMO.log = [...(DEMO.log || []).slice(-29), `${DEMO.cap}: ${r.win ? "win" : "loss"} in ${Math.round(r.time || 0)}s, ${r.lost || 0} lost`];
  return DEMO.result || { win: false };
}

// ---------- resources ----------
// top a currency or material up to n, counting what the demo had to add
function topUp(k, n) {
  const h = have(k); if (h >= n) return;
  const d = Math.ceil(n - h);
  if (k === "sanity") S.sanity += d; else give({ [k]: d });
  DEMO.topups[k] = (DEMO.topups[k] || 0) + d;
}
// a day passes: daily login, Energy refills, Ranked attempts and ranking rewards come back
function newDay() {
  DAY_SHIFT++; DEMO.days++;
  S.sanity = Math.max(S.sanity, maxSanity(S.lvl)); S.sTime = Date.now();
  S.arena.attempts = 5; S.arena.aTime = Date.now();
  tickTimers(); dailyLogin();
  give(payout(S.arena.rank)); S.arena.payTime = Date.now();
  S.lastGift = 0; castGift();
}
function claimAll() {
  metaTick();
  for (const m of unclaimedMail()) claimMail(m);
  for (const d of DAILIES) if (!S.daily.claimed[d.id] && (S.daily[d.id] || 0) >= d.goal) { S.daily.claimed[d.id] = 1; give(d.reward); }
  if (DAILIES.every(d => S.daily.claimed[d.id]) && !S.daily.claimed.all) { S.daily.claimed.all = 1; give(DAILY_ALL); }
  checkAchievements(true);
  for (const m of unclaimedMail()) claimMail(m);
}
// keep the parts box tidy: everything fitted, plus the best spares; sell the rest for Yen
function pruneParts(keep = 60) {
  const spare = S.parts.filter(p => !p.eq).sort((a, b) => b.rar - a.rar || b.lvl - a.lvl);
  for (const p of spare.slice(keep)) sellPart(p);
}

// ---------- training ----------
// the strongest three for this rival team, leaning on type matchups; `fast` favours the hardest hitters (for the
// "win within X seconds" star)
const SPEEDY = { Attack: 1.18, Balance: 1.06, Endurance: .94, Defense: .82 };
function demoTeam(foes, fast) {
  const els = foes.map(s => s.op ? OPS[s.op].el : ENEMY[s.en].el);
  const score = k => power(k, S.ops[k]) * (1 + .12 * els.filter(e => BEATS[OPS[k].el] === e).length - .08 * els.filter(e => BEATS[e] === OPS[k].el).length) * (fast ? SPEEDY[OPS[k].el] : 1);
  return Object.keys(S.ops).filter(k => OPS[k]).sort((a, b) => score(b) - score(a)).slice(0, TEAM_SIZE);
}
// parts that suit the Beyblade: same Spin Gear direction as its stock gear, and a Blade Base of the same kind
const BASE_KIND = { flat: "atk", grip: "atk", instant: "atk", semiflat: "bal", sharp: "sta", ball: "def", bearing: "sta" };
function partFits(k, slot, m) {
  const st = stockModels(OPS[k], k)[slot];
  if (slot === "sg") return (PART_MODELS[m].spin === "L") === (PART_MODELS[st].spin === "L") && (PART_MODELS[m].spin === "D") === (PART_MODELS[st].spin === "D");
  if (slot === "bb") return BASE_KIND[m] === BASE_KIND[st];
  return true;
}
function fitBest(k) {
  const p = S.ops[k];
  for (const slot of PART_SLOTS) {
    const cur = partById(p.parts[slot]), best = S.parts.filter(pt => partSlot(pt) === slot && !pt.eq && partFits(k, slot, pt.m)).sort((a, b) => partScale(b.rar, b.lvl) - partScale(a.rar, a.lvl))[0];
    if (best && (!cur || partScale(best.rar, best.lvl) > partScale(cur.rar, cur.lvl))) fitPart(k, best.id);
  }
}
// level, Upgrade, moves and parts until the Beyblade's effective level reaches `target`
function trainOp(k, target) {
  const p = S.ops[k], op = OPS[k];
  for (let guard = 0; effLV(p) < target && guard < 600; guard++) {
    if (p.lvl < LV_CAP[p.elite]) {
      if (!["rec1", "rec2", "rec3", "rec4"].some(it => S.inv[it] > 0)) topUp("rec4", 4);
      autoLevel(k);
    } else if (p.elite < op.maxElite) {
      const c = eliteCost(k, p.elite + 1); topUp("lmd", c.lmd); topUp("chip", c.chip); promote(k);
    } else break;
  }
  const want = Math.min(7, 1 + Math.floor(target / 14));
  for (const i of [0, 1, 2]) for (let g = 0; p.sk[i] < want && g < 8; g++) {
    if (p.sk[i] >= 4 && p.elite < 1) break;
    const c = skillCost(p.sk[i]); topUp("summ", c.summ); topUp("lmd", c.lmd); if (!skillUp(k, i)) break;
  }
  fitBest(k);
  const tuneTo = Math.min(15, Math.floor(target / 8));
  for (const slot of PART_SLOTS) { const pt = partById(p.parts[slot]); while (pt && pt.lvl < tuneTo) { topUp("lmd", partCost(pt)); if (!tunePart(pt)) break; } }
}
function prepTeam(mode, foes, target, fast) {
  const ids = demoTeam(foes, fast);
  for (const k of ids) trainOp(k, target);
  S.team[mode] = demoTeam(foes, fast);
  return S.team[mode];
}
const foeLv = foes => Math.max(...foes.map(s => s.LV || 1));
// size up a matchup off the record, the way a player reads the rival team: a quick simulated battle that changes
// nothing in the save
function scout(ids, foes) {
  const B = makeBattle({ allies: allySpecs(ids), foes, auto: true });
  B.start(.75, .7);
  let n = 0; while (!B.over && n++ < 12000) { B.tick(); B.ev.length = 0; }
  return B.result || { win: false, lost: TEAM_SIZE, time: TIME_LIMIT };
}
// on a retry: train a few candidate teams (by power, by hitting power, by matchups) and keep the one that does best
function pickTeam(mode, foes, target, ok) {
  const atk = k => opStats(k, S.ops[k]).st.atk;
  const hitters = Object.keys(S.ops).filter(k => OPS[k]).sort((a, b) => atk(b) - atk(a)).slice(0, TEAM_SIZE);
  let best = null, bestN = -1;
  for (const ids of [demoTeam(foes, true), hitters, demoTeam(foes, false)]) {
    for (const k of ids) trainOp(k, target);
    let n = 0; for (let i = 0; i < 3; i++) if (ok(scout(ids, foes))) n++;
    if (n > bestN) { bestN = n; best = ids; }
    if (n === 3) break;
  }
  S.team[mode] = best;
  return best;
}

// tap through to a battle: open it, then Let it rip! on the team screen
async function tapsTo(...sels) {
  for (const sel of sels) { if (!(await tap(sel))) return false; await dwait(1000); }
  return tap(`[data-act="deploy"]`);
}

// ---------- the playthrough ----------
async function runDemo() {
  // a new account, like a new player
  demoCap("Making a new account", "Title screen");
  nameModal(); await dwait(900);
  await press(`[data-act="pickLook"][data-v="rookie2"]`, () => ACT.pickLook({ v: "rookie2" }));
  await typeInto("#nname", "Demo Blader"); await dwait(400);
  await press(`[data-act="nameGo"]`, () => ACT.nameGo()); await dwait(2200);
  if (modalOpen()) { await press(`[data-act="introGo"]`, () => ACT.introGo()); await dwait(1500); }
  closeModal();
  await showMail("Mr. Dickenson's welcome gifts");
  demoCap("Opening the free Boosters", "Booster shop");
  await nav("hh"); await dwait(900);
  await press(`[data-act="pullFree10"]`, () => ACT.pullFree10()); await settle();
  if (S.inv.gold5 > 0) { await press(`[data-act="pullGold5"]`, () => ACT.pullGold5()); await settle(); }
  await tour();
  // the story, with the other modes in between chapters
  for (const ch of STORY[0].chapters) { await playChapter(ch); await interlude(ch); }
  // everything else, to 100%
  demoCap("The story is done. Now everything else", "Toward 100%");
  await dwait(1500);
  await streetBattles(1e9, false);
  await towerRun(1e9, false);
  await ranked(0, true, true);
  await collectAll();
  await growth();
  await grind();
  await finalSweep();
}
async function showMail(sub = "Mailbox") {
  metaTick();
  if (!unclaimedMail().length) return;
  demoCap("Claiming mail", sub); await nav("inbox"); await dwait(900);
  await press(`[data-act="claimAllMail"]`, () => ACT.claimAllMail()); await dwait(1300); await closeM();
}
// a quick look at the menus, once
async function tour() {
  const k = topTeam(1)[0];
  demoCap("Your Beyblades", "Beyblades"); await nav("ops"); await dwait(1100);
  demoCap(`${OPS[k].n}: status`, "Beyblades"); await nav("op", k); await dwait(1300);
  for (const [t, cap] of [["skills", "Moves"], ["upgrade", "Level Up with Battle Data"], ["runes", "Customize Parts: Attack Ring, Weight Disk, Spin Gear, Blade Base"]]) {
    demoCap(cap, "Beyblades"); await press(`[data-act="opTab"][data-t="${t}"]`, () => ACT.opTab({ t })); await dwait(1300);
  }
  await press(`[data-act="partSlotF"][data-s="bb"]`); await dwait(1100);
  demoCap("Max's dad's Hobby Shop", "Home"); await nav("shop"); await dwait(1400);
  demoCap("Daily Training", "Home"); await nav("home"); await press(`.stage [data-act="missions"]`, () => missionsModal()); await dwait(1400); await closeM();
  demoCap("BBA Records", "Home"); await nav("ach"); await dwait(1400);
  demoCap("Your Blader Card", "Home"); await nav("settings"); await dwait(1100);
  await press(`[data-act="setLook"][data-v="rookie2"]`); await dwait(900);
  await nav("home"); await dwait(1000);
}

async function playChapter(ch) {
  demoCap(`Chapter ${ch.no}: ${ch.title}`, ch.season);
  await nav("chapter", ch.id); await dwait(1200);
  let first = true;
  for (const nd of ch.nodes) {
    if (nd.type === "story" || nd.type === "chest") {
      if (nodeStars(nd.id)) continue;
      demoCap(`${nd.id} ${nd.name}`, `Chapter ${ch.no}: ${ch.title}`);
      await nav("chapter", ch.id);
      await press(`[data-act="openNode"][data-id="${nd.id}"]`, () => ACT.openNode({ id: nd.id })); await dwait(800);
      await press(`#modal [data-act="startNode"]`, () => ACT.startNode({ id: nd.id }));
      await settle(900); await closeM();
    } else {
      await storyBattle(nd, first || nd.type === "boss");
      first = false;
    }
  }
  await settle(300);
  if (modalOpen()) { await dwait(2000); await closeM(); }
}
async function storyBattle(nd, highlight) {
  for (let attempt = 0; nodeStars(nd.id) < 3; attempt++) {
    if (attempt > 24) throw new Error(`couldn't get 3 stars on ${nd.id}`);
    const foes = nodeFoes(nd), target = foeLv(foes) + 8 + attempt * 10, goal = nodeTimeGoal(nd);
    if (attempt) pickTeam("story", foes, target, r => r.win && !r.lost && r.time <= goal); else prepTeam("story", foes, target);
    topUp("sanity", nodeCost(nd));
    const visible = attempt === 0 && (DEMO.mode === "watch" || (DEMO.mode === "highlights" && highlight));
    demoCap(`${nd.id} ${nd.name}${attempt ? " · again, for 3 stars" : ""}`, `Chapter ${nd.ch.no}: ${nd.ch.title}`);
    await fight(() => launchNode(nd.id), visible, async () => { await nav("chapter", nd.ch.id); return tapsTo(`[data-act="openNode"][data-id="${nd.id}"]`, `#modal [data-act="startNode"]`); });
  }
}
// between chapters: a day passes, the mail is claimed, and the other modes catch up to the story
async function interlude(ch) {
  const lv = Math.max(...ch.nodes.map(n => n.lv || 0));
  newDay(); await showMail(`Day ${DEMO.days + 1}`);
  claimAll();
  await streetBattles(lv + 8, ch.no <= 2);
  await towerRun(lv + 8, ch.no === 2);
  if (ch.no >= 3) await ranked(3, ch.no === 3);
  await boosters(ch.no % 4 === 1);
  if (ch.no === 1 || ch.no === 6) {
    demoCap("Daily Training rewards", "Home"); await nav("home"); await press(`.stage [data-act="missions"]`, () => missionsModal()); await dwait(1000);
    for (let i = 0; i < 8 && findEl(`#modal [data-act="claimDaily"]`); i++) { await tap(`#modal [data-act="claimDaily"]`); await dwait(500); }
    await tap(`#modal [data-act="claimAllDaily"]`); await dwait(900); await closeM();
  }
  claimAll(); pruneParts();
  if (ch.no === 5) await showMail("A Mystery Gift");
}
async function streetBattles(maxLv, showFirst) {
  let shown = !showFirst;
  for (const h of HUNTS) for (let l = 1; l <= 6; l++) {
    if (HUNT_LV[l - 1] > maxLv || (S.hunt[h.id] || 0) >= l) continue;
    for (let attempt = 0; (S.hunt[h.id] || 0) < l; attempt++) {
      if (attempt > 14) throw new Error(`couldn't win ${h.code}-${l}`);
      const foes = huntTeam(h, l), visible = !shown && DEMO.mode !== "fast";
      if (attempt) pickTeam("hunt", foes, foeLv(foes) + 4 + attempt * 8, r => r.win); else prepTeam("hunt", foes, foeLv(foes) + 4);
      topUp("sanity", HUNT_COST[l - 1]);
      demoCap(`${h.code}-${l} ${h.n}`, "Street Battles");
      await fight(() => launchHunt(h.id, l), visible, async () => { await nav("hunt", h.id); return tapsTo(`[data-act="huntLv"][data-h="${h.id}"][data-l="${l}"]`, `[data-act="huntGo"]`); });
      shown = true;
    }
  }
}
async function towerRun(maxLv, showFirst) {
  let shown = !showFirst;
  while (S.tower < TOWER_FLOORS && towerFloor(S.tower + 1).lv <= maxLv) {
    const f = S.tower + 1, T = towerFloor(f);
    for (let attempt = 0; S.tower < f; attempt++) {
      if (attempt > 14) throw new Error(`couldn't clear Tower floor ${f}`);
      const foes = rivalTeam(T.waves, T.lv), visible = !shown && DEMO.mode !== "fast";
      if (attempt) pickTeam("tower", foes, foeLv(foes) + 4 + attempt * 8, r => r.win); else prepTeam("tower", foes, foeLv(foes) + 4);
      demoCap(`Floor ${f}${f % 5 === 0 ? " · Champion" : ""}`, "BBA Tower");
      await fight(() => launchTower(f), visible, async () => { await nav("tower"); return tapsTo(`[data-act="towerGo"][data-f="${f}"]`); });
      shown = true;
    }
  }
}
// Ranked Battles: win `wins` times, or with toTop climb all the way to #1
async function ranked(wins, showFirst, toTop) {
  let shown = !showFirst, won = 0;
  for (let tries = 0; toTop ? S.arena.rank > 1 : won < wins; tries++) {
    if (tries > 2000) throw new Error("couldn't climb the ranking");
    if (S.arena.attempts <= 0) newDay();
    if (!S.arena.opps) genOpps();
    // scout the three challengers and take the one the demo beats fastest; if it can't beat any, ask for new ones
    const opps = S.arena.opps, foesOf = o => o.team.slice(0, TEAM_SIZE).map(u => ({ op: u.op, LV: u.LV }));
    let k = -1, bestT = 1e9;
    opps.forEach((c, i) => { const r = scout(prepTeam("arena", foesOf(c), foeLv(c.team) + 6), foesOf(c)); if (r.win && r.time < bestT) { bestT = r.time; k = i; } });
    if (k < 0) { genOpps(); DEMO.refresh = (DEMO.refresh || 0) + 1; if (tries % 20 === 19) await yieldUI(); continue; }
    const o = opps[k];
    prepTeam("arena", foesOf(o), foeLv(o.team) + 6);
    const visible = !shown && DEMO.mode !== "fast";
    demoCap(`${o.cls || ""} ${o.name}`.trim(), `Ranked Battles · #${S.arena.rank}`);
    DEMO.quiet = !visible;
    const r = await fight(() => launchArena(k), visible, async () => { await nav("arena"); return tapsTo(`[data-act="arenaGo"][data-k="${k}"]`); }, !visible);
    DEMO.quiet = false;
    if (r.win) won++;
    shown = true;
    if (!visible && tries % 10 === 9) { montage("Climbing the world ranking", [["Rank", 1500 - S.arena.rank, 1499], ["Ranked Battles won", S.stats.versus, 100]]); await yieldUI(); }
  }
  montage();
  if (toTop) { await nav("arena"); demoCap("World ranking #1", "Ranked Battles"); await dwait(1800); }
}
// Random Boosters: spend tickets and BeyPoints, showing a reveal now and then
async function boosters(show) {
  const can = () => S.permit >= 10 || S.orundum >= 6000;
  if (!can()) return;
  if (show && DEMO.mode !== "fast") { demoCap("Random Boosters ×10", "Booster shop"); await nav("hh"); await dwait(900); await press(`[data-act="pull"][data-n="10"]`, () => ACT.pull({ n: 10 })); await settle(); }
  while (can()) { if (S.permit >= 10) S.permit -= 10; else S.orundum -= 6000; headhunt(10, true); }
  claimAll();
}

// ---------- after the story ----------
async function collectAll() {
  demoCap("Collecting every Beyblade", "Random Boosters");
  await nav("ops"); if (!UI.all) await press(`[data-act="toggleAll"]`, () => ACT.toggleAll()); await dwait(1100);
  let n = 0;
  while (OP_KEYS.some(k => !S.ops[k] && k !== MYSTERY_OP) && n++ < 400) {
    topUp("orundum", 6000); S.orundum -= 6000; headhunt(10, true);
    if (n % 5 === 0) { rerender(); montage("Opening Boosters", [["Beyblades collected", Object.keys(S.ops).length, OP_KEYS.length], ["Boosters opened", S.gacha.total, 1000]]); await yieldUI(); }
  }
  montage(); claimAll(); rerender(); await dwait(1500); UI.all = false;
}
// fully Upgrade, max moves and tune parts across the collection (the Growth records)
async function growth() {
  demoCap("Upgrading the collection", "Beyblades");
  const keys = Object.keys(S.ops).filter(k => OPS[k]).sort((a, b) => OPS[b].rar - OPS[a].rar || power(b, S.ops[b]) - power(a, S.ops[a])).slice(0, 24);
  for (const [i, k] of keys.entries()) {
    trainOp(k, 120);
    const p = S.ops[k];
    for (const s of [0, 1, 2]) while (p.sk[s] < 7 && p.elite >= 1) { const c = skillCost(p.sk[s]); topUp("summ", c.summ); topUp("lmd", c.lmd); if (!skillUp(k, s)) break; }
    if (i === 0) { await nav("op", k); await press(`[data-act="opTab"][data-t="upgrade"]`, () => ACT.opTab({ t: "upgrade" })); await dwait(1500); }
    if (i % 4 === 3) await yieldUI();
  }
  // tune parts to +15: the ones fitted first, then the best spares
  const order = S.parts.slice().sort((a, b) => !!b.eq - !!a.eq || b.rar - a.rar);
  for (const pt of order.slice(0, 40)) while (pt.lvl < 15) { topUp("lmd", partCost(pt)); if (!tunePart(pt)) break; }
  for (const k of keys) fitBest(k);
  await nav("op", keys[0]); await press(`[data-act="opTab"][data-t="runes"]`, () => ACT.opTab({ t: "runes" })); await dwait(1500);
  claimAll();
}
// the long tail: thousands of battles and a year of logins, fast-forwarded through the real engine
async function grind() {
  const goal = id => ACH.find(a => a.id === id).tiers.slice(-1)[0][0];
  const rows = () => [["Battles won", S.stats.wins, goal("wins")], ["Rival Beyblades knocked out", S.stats.kills, goal("kills")],
    ["Bit-Beast attacks", S.stats.arcs, goal("arcs")], ["Wins without losing a Beyblade", S.stats.flawless, goal("flawless")],
    ["Street Battles won", S.stats.patrols, goal("patrol")], ["Ranked Battles won", S.stats.versus, goal("versus")],
    ["Boosters opened", S.gacha.total, goal("pulls")], ["5★ from Boosters", S.stats.fives, goal("luck")],
    ["Days logged in", S.stats.loginDays, goal("login")], ["Blader Rank", S.lvl, goal("plv")]];
  demoCap("Fast-forwarding a year of Beyblading", "Street Battles, Ranked Battles, Boosters");
  const h = HUNTS[HUNTS.length - 1], l = 6;
  await nav("hunt", h.id);
  const need = () => S.stats.wins < goal("wins") || S.stats.kills < goal("kills") || S.stats.arcs < goal("arcs") || S.stats.flawless < goal("flawless") || S.stats.patrols < goal("patrol") || S.lvl < goal("plv");
  prepTeam("hunt", huntTeam(h, l), 120);
  let n = 0;
  DEMO.quiet = true;
  while (need()) {
    if (n++ > 40000) throw new Error("the fast-forward ran too long");
    if (S.sanity < HUNT_COST[l - 1]) { if (S.stats.loginDays < goal("login")) newDay(); else topUp("sanity", 200); }
    await fight(() => launchHunt(h.id, l), false, null, true);
    if (n % 25 === 0) { claimAll(); pruneParts(); montage("A year of Beyblading", rows()); await yieldUI(); }
  }
  DEMO.quiet = false;
  while (S.stats.versus < goal("versus")) { await ranked(goal("versus") - S.stats.versus, false); montage("A year of Beyblading", rows()); }
  while (S.gacha.total < goal("pulls") || S.stats.fives < goal("luck")) {
    topUp("orundum", 6000); S.orundum -= 6000; headhunt(10, true);
    if (S.gacha.total % 50 === 0) { montage("A year of Beyblading", rows()); await yieldUI(); }
  }
  while (S.stats.loginDays < goal("login")) { newDay(); claimAll(); if (S.stats.loginDays % 15 === 0) { montage("A year of Beyblading", rows()); await yieldUI(); } }
  claimAll(); montage("A year of Beyblading", rows()); await dwait(2000); montage();
}
// whatever is still short of 100% (Bit-Beast Sync, 5★ count, a missed Street Battle…), then the finale
async function finalSweep() {
  for (let pass = 0; completionPct() < 100 && pass < 40; pass++) {
    claimAll();
    const miss = completionParts().filter(x => x.v < x.max).map(x => x.n);
    if (miss.includes("Street Battle levels")) await streetBattles(1e9, false);
    if (miss.includes("BBA Tower floors")) await towerRun(1e9, false);
    if (miss.includes("World ranking #1")) await ranked(0, false, true);
    if (miss.includes("Beyblades collected")) await collectAll();
    if (miss.includes("BBA Records")) {
      const left = ACH.filter(a => (S.achv[a.id] || 0) < a.tiers.length).map(a => a.id);
      if (left.includes("origin") || left.includes("fives") || left.includes("luck") || left.includes("pulls")) for (let i = 0; i < 30; i++) { topUp("orundum", 6000); S.orundum -= 6000; headhunt(10, true); }
      if (left.some(id => ["asc1", "asc2", "rankex", "codes", "code15"].includes(id))) await growth();
      if (left.some(id => ["wins", "kills", "arcs", "flawless", "patrol", "versus", "plv", "login"].includes(id))) await grind();
    }
    await yieldUI();
  }
  claimAll();
  // the finale
  demoCap("Every BBA Record", "100%"); UI.achCat = "All"; await nav("ach"); await dwait(2200);
  demoCap("Every Beyblade", "100%"); await nav("ops"); if (!UI.all) await press(`[data-act="toggleAll"]`, () => ACT.toggleAll()); await dwait(2200);
  demoCap("The Blader Card", "100%"); await nav("settings"); await dwait(2600);
}
function demoFinish() {
  if (!DEMO.on) return;
  DEMO.done = true; DEMO.paused = false;
  for (const id of ["demoshield", "democursor"]) { const el = $("#" + id); if (el) el.remove(); }
  const mins = Math.round((Date.now() - DEMO.t0) / 60000), tops = Object.entries(DEMO.topups).filter(([, n]) => n > 0);
  demoCap(`Demo complete: ${completionPct()}%`, "Tap ✕ to go back to your own save");
  openModal(`<div class="stack" style="text-align:center;align-items:center"><div class="eyebrow">Demo complete</div><h2>${completionPct()}% complete</h2>
    <div class="stack" style="gap:4px;width:100%;text-align:left">${completionParts().map(x => `<div class="spread small"><span>${esc(x.n)}</span><b class="num">${x.label || `${fmtFull(x.v)} / ${fmtFull(x.max)}`}</b></div>`).join("")}</div>
    <p class="small dim">${fmtFull(DEMO.shown)} battles shown, ${fmtFull(DEMO.simmed)} simulated, ${fmtFull(DEMO.days)} days passed, about ${mins} minute${mins === 1 ? "" : "s"} to watch.</p>
    ${tops.length ? `<p class="tiny dim">Topped up along the way: ${tops.map(([k, n]) => `${fmtFull(n)} ${k === "sanity" ? "Energy" : (ITEMS[k] && ITEMS[k].n) || k}`).join(", ")}.</p>` : ""}
    <button class="btn wide" data-act="demoExit">Back to my own save</button>
    <button class="btn ghost wide" data-act="closeModal">Look around first</button></div>`);
}

// ---------- start / end ----------
function demoAsk() {
  openModal(`<div class="stack"><div class="eyebrow">Demo</div><h2>Watch the whole game</h2>
    <p class="small dim">A brand-new Blader plays everything to 100%: the whole story with 3 stars on every battle, all Street Battles, all 30 BBA Tower floors, Ranked #1, all ${OP_KEYS.length} Beyblades and every BBA Record.</p>
    <p class="small dim">Your own save is set aside while the demo runs and comes back when it ends. Pause or switch speed at any time from the bar at the bottom.</p>
    ${Object.entries(DEMO_MODES).map(([k, m]) => `<button class="btn ${k === "highlights" ? "" : "ghost"} wide" data-act="demoGo" data-m="${k}">${m.n}</button><p class="tiny dim" style="margin-top:-6px">${m.d}</p>`).join("")}
    <button class="btn ghost sm wide" data-act="closeModal">Not now</button></div>`);
}
function demoStart(mode) {
  if (DEMO.on) return;
  closeModal();
  clearTimeout(saveTimer);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
  const sound = S.settings.sound, title = $("#title"), fromTitle = !!(title && !title.hidden);
  Object.assign(DEMO, { on: true, saved: JSON.stringify(S), mode: DEMO_MODES[mode] ? mode : "highlights", paused: false, stop: false, done: false, topups: {},
    shown: 0, simmed: 0, days: 0, log: [], cq: null, apBusy: false, launching: false, t0: Date.now(), sim: false, quiet: false, result: null, closed: false, cap: "", sub: "" });
  DAY_SHIFT = 0;
  S = migrate(newSave()); S.settings.sound = sound; S.settings.auto = true; S.settings.speed = 3;
  UI.team = null; UI.opTab = "info"; UI.all = false;
  if (fromTitle) hideTitle();
  UI.inGame = true; route("home");
  document.body.classList.add("demo");
  demoBar(); DEMO.pilot = setInterval(autopilot, 150);
  runDemo().then(demoFinish).catch(e => {
    if (e === DEMO_STOP) return;
    console.error(e);
    if (DEMO.on) { demoCap("The demo stopped early", e.message || String(e)); toast(`The demo stopped: ${e.message || e}.${DEMO.log.length ? " Last battle: " + DEMO.log[DEMO.log.length - 1] : ""}`); }
  });
}
function demoEnd() {
  if (!DEMO.on) return;
  DEMO.stop = true; DEMO.paused = false; clearInterval(DEMO.pilot);
  if (BT.on) closeBattle();
  for (const id of ["dlg", "gacha"]) { const el = $("#" + id); el.hidden = true; el.innerHTML = ""; }
  closeModal(); montage();
  for (const id of ["demobar", "demoshield", "democursor"]) { const el = $("#" + id); if (el) el.remove(); }
  for (const el of $$(".demotap")) el.remove();
  document.body.classList.remove("demo");
  const real = JSON.parse(DEMO.saved);
  DEMO.on = false; DEMO.saved = null; DAY_SHIFT = 0;
  S = migrate(real); UI.team = null; UI.all = false;
  if (S.named) { UI.inGame = true; route("home"); toast("Demo over. Your own save is back."); }
  else showTitle();
}
const DEMO_ACT = {
  demoAsk: () => demoAsk(),
  demoGo: d => demoStart(d.m),
  demoExit: () => demoEnd(),
};
