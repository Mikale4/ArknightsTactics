
// =====================================================================
//  DEMO — a runner that plays the game from a new save to 100% through the real screens.
//  Every action is a visible tap on the real UI (a finger shows where it lands); decisions
//  come from quick hidden battle simulations. It plays on its own save (DEMO_KEY) and skips
//  time forward on that save only while it waits for Sanity, Contract attempts or a new day.
//  100% = every Main Theme stage (3 stars on battles), Supplies 1-6 everywhere, all SSS floors,
//  Contingency Contract rank #1 and every Main Line mission claimed.
// =====================================================================
const DEMO = { on: false, gen: 0, speed: 1, skew: 0, fast: false, log: [], fails: {}, fx: -1, fy: -1, errors: 0, guildTry: null };
const DEMO_SPEEDS = [1, 2, 4, 8, 16];
const RealDate = Date;
class DemoDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + DEMO.skew); }
  static now() { return RealDate.now() + DEMO.skew; }
}
class DemoStop extends Error {}

// ---------- progress ----------
function demoGoals(s) {
  s = s || S;
  const st = id => (s.story && s.story[id]) || 0, nodes = Object.values(NODES);
  const nodesDone = nodes.filter(nd => nd.waves ? st(nd.id) >= 3 : st(nd.id) > 0).length;
  const hunts = HUNTS.reduce((a, h) => a + Math.min(6, (s.hunt && s.hunt[h.id]) || 0), 0);
  const tower = Math.min(TOWER_FLOORS, s.tower || 0), LEG = TIERS[TIERS.length - 1].min;
  const cc = s.ladder ? s.ladder.best : LADDER_START, rt = s.rta ? s.rta.best : LADDER_START;
  const climb = b => clamp((b - LADDER_START) / (LEG - LADDER_START), 0, 1);
  const ach = ACHIEVEMENTS.filter(a => s.ach && s.ach[a.id]).length;
  const parts = [[nodesDone, nodes.length, 34], [hunts, 18, 12], [tower, TOWER_FLOORS, 16], [climb(cc), 1, 12], [climb(rt), 1, 12], [ach, ACHIEVEMENTS.length, 14]];
  return { pct: parts.reduce((a, [v, n, wt]) => a + wt * v / n, 0), nodesDone, hunts, tower, cc, rt, ach,
    done: nodesDone === nodes.length && hunts === 18 && tower === TOWER_FLOORS && cc >= LEG && rt >= LEG && ach === ACHIEVEMENTS.length };
}
const demoProgressText = s => Math.floor(demoGoals(s).pct) + "%";

// ---------- overlay: status bar, input shield, finger ----------
function demoHud() {
  let h = $("#demoHud");
  if (!h) {
    const blk = document.createElement("div"); blk.id = "demoBlock"; document.body.appendChild(blk);
    const f = document.createElement("div"); f.id = "demoFinger"; document.body.appendChild(f);
    h = document.createElement("div"); h.id = "demoHud"; document.body.appendChild(h);
  }
  h.innerHTML = `<span class="dtag">DEMO</span><div class="dst"><b id="dmSt">Starting…</b><small id="dmSub"></small></div><span class="dpct num" id="dmPct">0%</span>
    <button id="dmSpd" aria-label="Demo speed">${DEMO.speed}×</button><button class="stop" id="dmStop">Stop</button>`;
  $("#dmSpd").onclick = demoCycleSpeed;
  $("#dmStop").onclick = () => stopDemo("Demo stopped");
}
function demoCycleSpeed() {
  DEMO.speed = DEMO_SPEEDS[(DEMO_SPEEDS.indexOf(DEMO.speed) + 1) % DEMO_SPEEDS.length];
  const b = $("#dmSpd"); if (b) b.textContent = DEMO.speed + "×";
  if (BT.on) battleSpeed();
}
function demoKeys(e) {
  if (!DEMO.on) return;
  if (e.key === "`") { e.preventDefault(); demoCycleSpeed(); }
  else if (e.key === "Escape") { e.preventDefault(); stopDemo("Demo stopped"); }
}
function say(status, sub = "") {
  const a = $("#dmSt"), b = $("#dmSub"); if (a) a.textContent = status; if (b) b.textContent = sub;
  DEMO.log.push(`[${new RealDate().toLocaleTimeString()}] ${status}${sub ? " · " + sub : ""}`); if (DEMO.log.length > 300) DEMO.log.shift();
  if (S) { const p = $("#dmPct"); if (p) p.textContent = Math.floor(demoGoals().pct) + "%"; }
}

// ---------- pacing ----------
const chk = g => { if (!DEMO.on || g !== DEMO.gen) throw new DemoStop(); };
function w(ms) { const g = DEMO.gen; return new Promise(r => setTimeout(r, DEMO.fast ? 0 : ms / DEMO.speed)).then(() => chk(g)); }
async function until(fn, ms = 20000) {
  const g = DEMO.gen, t0 = performance.now();
  while (!fn()) { await new Promise(r => setTimeout(r, 40)); chk(g); if (performance.now() - t0 > ms) return false; }
  return true;
}

// ---------- taps ----------
async function fingerTo(x, y) {
  const f = $("#demoFinger"); if (!f || DEMO.fast) return;
  if (Math.hypot(x - DEMO.fx, y - DEMO.fy) < 4) return;
  f.style.transitionDuration = Math.max(.06, .3 / Math.sqrt(DEMO.speed)) + "s";
  f.style.left = x + "px"; f.style.top = y + "px"; DEMO.fx = x; DEMO.fy = y;
  await w(300);
}
async function fingerTap(x, y) {
  if (DEMO.fast) return;
  const f = $("#demoFinger"); if (f) f.classList.add("down");
  const r = document.createElement("div"); r.className = "dripple"; r.style.left = x + "px"; r.style.top = y + "px"; document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
  await w(90); if (f) f.classList.remove("down");
}
function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
async function tapEl(el, what = "button") {
  chk(DEMO.gen);
  if (!el) throw new Error("can't find " + what);
  if (el.disabled) throw new Error(what + " is disabled");
  el.scrollIntoView({ block: "center", inline: "nearest" });
  await w(120);
  const [x, y] = centerOf(el);
  await fingerTo(x, y); await fingerTap(x, y);
  el.click();
  await w(220);
}
async function pressEl(el, what = "button") {
  if (!el) throw new Error("can't find " + what);
  const [x, y] = centerOf(el);
  await fingerTo(x, y); await fingerTap(x, y);
  const o = { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, pointerType: "touch" };
  el.dispatchEvent(new PointerEvent("pointerdown", o)); el.dispatchEvent(new PointerEvent("pointerup", o));
  await w(180);
}
const actEl = (act, data = {}) => $$(`[data-act="${act}"]`).find(el => Object.entries(data).every(([k, v]) => el.dataset[k] === String(v)));
async function tapAct(act, data = {}, what) { await tapEl(actEl(act, data), what || `${act} ${JSON.stringify(data)}`); }

// ---------- screens ----------
async function closeAllModals() {
  for (let i = 0; i < 8 && !$("#modal").hidden; i++) {
    const m = $("#modal"), b = m.querySelector('[data-act="closeModal"]') || m.querySelector('[data-act="chapter"]');
    if (b) await tapEl(b, "close");
    else { await fingerTo(innerWidth / 2, 40); await fingerTap(innerWidth / 2, 40); m.click(); await w(150); }
  }
}
async function goTab(v) {
  await closeAllModals();
  if (UI.view === v) return;
  await tapEl($(`#tabs [data-act="go"][data-v="${v}"]`), v + " tab");
}
async function goHome() { await goTab("home"); }
// story scenes: let the scene open, then tap SKIP like a player who's seen it
async function skipDialogue() {
  await w(900);
  for (let i = 0; i < 5 && !$("#dlg").hidden && $("#dlg").innerHTML; i++) { await tapEl($("#dSkip"), "SKIP"); await w(120); }
}
async function gachaTaps() {
  if ($("#gT") && !$("#gT").hidden) await tapEl($("#gT"), "headhunt signal");
  await until(() => !$("#gDone") || !$("#gDone").hidden, 8000);
  await w(1100);
  if ($("#gDone")) await tapEl($("#gDone"), "Done");
}
async function settle() {
  for (let i = 0; i < 300; i++) {
    await new Promise(r => setTimeout(r, DEMO.fast ? 0 : 80)); chk(DEMO.gen);
    if (!$("#dlg").hidden && $("#dlg").innerHTML) { await skipDialogue(); continue; }
    if (!$("#gacha").hidden && $("#gacha").innerHTML) { await gachaTaps(); continue; }
    if (BT.on) { await fight(); continue; }
    return;
  }
}

// ---------- battle ----------
// battles play at 1× battle speed with AUTO on (the save's Auto AI, Expert for the Demo);
// the Demo's own speed setting multiplies that
function battleSpeed() { BT.speed = DEMO.fast ? 400 : (S.settings.speed || 1) * DEMO.speed; }
async function fight() {
  await until(() => !BT.on || $("#bAuto"), 5000);
  if (!BT.on) return;
  BT.speed = S.settings.speed || 1;
  for (let i = 0; i < 3 && S.settings.speed !== 1 && $("#bSpd"); i++) await tapEl($("#bSpd"), "battle speed");
  battleSpeed();
  if (!BT.B.auto) await tapEl($("#bAuto"), "AUTO");
  while (BT.on) {
    chk(DEMO.gen);
    if ($("#rDone")) { await w(1400); if ($("#rDone")) await tapEl($("#rDone"), "Continue"); await new Promise(r => setTimeout(r, 60)); break; }
    await new Promise(r => setTimeout(r, DEMO.fast ? 0 : 40));
  }
}
// ---------- planning (hidden simulations) ----------
function simRun(ids, waves, n, goal, enemyStyle = "balanced") {
  let win = 0, three = 0;
  for (let i = 0; i < n; i++) {
    const B = makeBattle({ allies: ids.map(k => typeof k === "string" ? { op: k, prog: S.ops[k] } : k), waves, auto: true, aiStyle: "aggressive", enemyStyle: enemyStyle === "expert" ? "aggressive" : enemyStyle });
    let g = 0; while (!B.over && g++ < 3000) { const r = B.step(); if (r === "input") B.autoAct(); B.ev.length = 0; }
    if (B.result && B.result.win) { win++; if (!B.result.lost && (!goal || B.result.turns <= goal)) three++; }
  }
  return { win: win / n, three: three / n };
}
const byPower = () => Object.keys(S.ops).sort((a, b) => power(b, S.ops[b]) - power(a, S.ops[a]));
const isHealer = k => OPS[k].cls === "Medic" || OPS[k].branch === "bard" || OPS[k].branch === "blessing";
function squadFor(waves, goal, enemyStyle) {
  const rank = byPower();
  if (rank.length <= 4) return withLeader(rank);
  const top = rank.slice(0, 10), healer = top.find(isHealer) || rank.find(isHealer);
  const base = (healer ? [healer] : []).concat(top.filter(k => k !== healer && !isHealer(k))).slice(0, 4);
  const cands = [base];
  for (const b of top.filter(k => !base.includes(k)).slice(0, 3)) for (let i = 0; i < base.length; i++) { const v = base.slice(); v[i] = b; cands.push(v); }
  let best = base, bs = -1;
  for (const c of cands) { const r = simRun(withLeader(c), waves, 3, goal, enemyStyle); const sc = r.win + r.three * .5; if (sc > bs + 1e-9) { bs = sc; best = c; } }
  return withLeader(best);
}
// operators worth investing in: the strongest, rarest few
function coreOps(n = 7) {
  const P = S.demoPush;
  if (P && P.on && P.roster) return P.roster.filter(owned);
  const score = k => OPS[k].rar * 3000 + power(k, S.ops[k]) / 4;
  const list = Object.keys(S.ops).sort((a, b) => score(b) - score(a));
  const heal = list.find(isHealer), out = list.slice(0, n);
  if (heal && !out.includes(heal)) out[n - 1] = heal;
  return out;
}
const nodeWaves = nd => nd.waves.map(wv => convWave(wv, nd.lv));
const towerWaves = f => { const T = towerFloor(f); return T.waves.map(wv => convWave(wv, T.lv)); };
// ---------- power push: what the Demo does when a Contract climb stalls ----------
// No Contract rating gain for two in-game days turns it on: pick a PvP roster of eight (tested fully
// built against Doctors a tier up), pour everything into maxing it, farm Supplies for its modules,
// headhunt on banners that help it and queue Real-Time Contract often. A maxed roster that stays
// stuck for 60 days ends the run with a "plateaued" report instead of looping forever.
const PUSH_STALL = 2 * 864e5, PUSH_GIVEUP = 60 * 864e5, LEGEND = () => TIERS[TIERS.length - 1].min;
const builtSpec = k => ({ op: k, prog: { ...progForLV(k, 120), pot: S.ops[k].pot }, boost: 1.42, sets: OPS[k].runes });
function pvpRoster() {
  const own = Object.keys(S.ops);
  if (own.length <= 8) return withLeader(own);
  const cands = buildSquad(own, Math.min(14, own.length), 1, () => .5);
  // the attack four: swap in the next best and keep what wins most often, fully built, a tier up
  const target = Math.min(LEGEND() + 150, Math.max(S.ladder.pts, S.rta.pts) + 300);
  const foes = [0, 1].map(i => npcDoctor("push" + S.lvl, i, ratingQ(target)));
  const rate = ids => foes.reduce((a, f) => a + simRun(withLeader(ids).map(builtSpec), [f.team.map(k => npcSpec(f, k))], DEMO.fast ? 1 : 2, 0, f.ai).win, 0);
  let atk = cands.slice(0, 4), best = rate(atk);
  for (const b of cands.slice(4, 8)) for (let i = 0; i < 4; i++) {
    const v = atk.slice(); v[i] = b; const r = rate(v);
    if (r > best + 1e-9) { best = r; atk = v; }
  }
  const out = withLeader(atk).concat(cands.filter(k => !atk.includes(k))).slice(0, 8);
  // two medics, so a ban or a defense loss doesn't leave the squad without healing
  if (out.filter(isHealer).length < 2) { const m = own.filter(k => isHealer(k) && !out.includes(k)).sort((a, b) => metaScore(b) - metaScore(a))[0]; if (m) out[7] = m; }
  return out;
}
function pushState() {
  const P = S.demoPush || (S.demoPush = { on: false, peak: 0, since: Date.now(), roster: null, rosterT: 0, rosterN: 0, maxedT: 0, rta: { day: "", n: 0 } });
  const peak = Math.min(S.ladder.best, LEGEND()) + Math.min(S.rta.best, LEGEND());
  if (peak > P.peak + 25) { P.peak = peak; P.since = Date.now(); }
  if (!P.on && Date.now() - P.since > PUSH_STALL && Object.keys(S.ops).length >= 8) {
    P.on = true; P.began = Date.now();
    say("Power push", `No Contract progress for ${Math.round((Date.now() - P.since) / 864e5)} days: building a PvP roster`);
  }
  if (P.on && (!P.roster || Date.now() - P.rosterT > 864e5 || P.rosterN !== Object.keys(S.ops).length)) {
    const old = (P.roster || []).join();
    P.roster = pvpRoster(); P.rosterT = Date.now(); P.rosterN = Object.keys(S.ops).length;
    if (P.roster.join() !== old) say("Power push · PvP roster", P.roster.map(k => OPS[k].n).join(", "));
  }
  return P;
}
const pushOn = () => !!(S.demoPush && S.demoPush.on && S.demoPush.roster);
const opMaxed = k => {
  const p = S.ops[k], op = OPS[k];
  return p.elite >= op.maxElite && p.lvl >= LV_CAP[p.elite] && op.skills.every((sk, j) => sk.passive || sk.elite > p.elite || p.sk[j] >= 7)
    && p.runes.every(id => { const r = runeById(id); return r && r.rar >= 5 && r.lvl >= 15; });
};
const rosterReady = () => pushOn() && S.demoPush.roster.every(k => S.ops[k].elite >= OPS[k].maxElite);
// module slots in the roster still waiting for a T5
const weakSlots = () => pushOn() ? S.demoPush.roster.flatMap(k => S.ops[k].runes.map(id => runeById(id)).map(r => (!r || r.rar < 5) ? k : null)).filter(Boolean) : [];
const failKey = (k, n) => { DEMO.fails[k] = (DEMO.fails[k] || 0) + (n == null ? 1 : n); if (n === 0) DEMO.fails[k] = 0; return DEMO.fails[k]; };

// ---------- time ----------
async function skipTime(ms, why) {
  ms = Math.max(1000, Math.round(ms));
  DEMO.skew += ms; S.demoSkew = DEMO.skew;
  tickTimers(); save();
  // redraw so timers, tickets and cooldown buttons on screen match the new time
  if ($("#modal").hidden && !BT.on) rerender(); else renderTop();
  const mins = Math.round(ms / 60000), h = Math.floor(mins / 60), m = mins % 60;
  say("Time skip: " + why, `+${h ? h + "h " : ""}${m}m on the Demo save`);
  if (DEMO.fast) return;
  const el = document.createElement("div"); el.id = "demoSkip"; el.innerHTML = `<b>⏩ +${h ? h + "h " : ""}${m}m</b><span>${esc(why)}</span>`;
  document.body.appendChild(el);
  await w(1400).finally(() => el.remove());
}
async function ensureSanity(n) {
  tickTimers();
  if (S.sanity >= n) return;
  if (S.prime >= 3) {
    say("Restoring Sanity", "1 Originite Prime");
    await closeAllModals();
    await tapEl($('#topbar [data-act="sanity"]'), "Sanity");
    await tapAct("buy", { t: "prime", id: "p_san" }, "Restore Sanity");
    await closeAllModals();
    return;
  }
  await skipTime((n - S.sanity) * SAN_MS + 500, `Waiting for Sanity (${S.sanity} → ${n})`);
}

// ---------- the Doctor's routine ----------
async function claimMissions() {
  if (!badge("home")) return false;
  say("Claiming mission rewards");
  await goHome();
  await tapAct("missions", {}, "Missions");
  for (let i = 0; i < 30; i++) {
    const b = $$('#modal [data-act="claimDaily"],#modal [data-act="claimAllDaily"],#modal [data-act="claimAch"]').find(x => !x.disabled);
    if (!b) break;
    await tapEl(b, "Claim");
  }
  await closeAllModals();
  return true;
}
function promoNeeds() {
  // chips and LMD the core still needs for its next promotions
  let chip = 0, lmd = 0;
  for (const k of coreOps()) { const p = S.ops[k]; if (p.elite < OPS[k].maxElite) { const c = eliteCost(k, p.elite + 1); chip += c.chip; lmd += c.lmd; } }
  return { chip, lmd };
}
async function buy(tab, id, label) {
  if (UI.view !== "shop") { await goHome(); await tapAct("go", { v: "shop" }, "Store"); }
  if (UI.shopTab !== tab) await tapAct("shopTab", { t: tab }, tab + " tab");
  say("Shopping", label);
  await tapAct("buy", { t: tab, id }, label); await closeAllModals();
}
async function shopping() {
  const need = promoNeeds(); let did = false;
  const want = (cur, cost) => S[cur] >= cost;
  for (let i = 0; i < 6 && want("tokens", 90) && need.chip > S.inv.chip; i++) { await buy("tokens", "t_chip", "Chip Pack ×3"); did = true; }
  for (let i = 0; i < 6 && want("cert", 12) && need.chip > S.inv.chip; i++) { await buy("cert", "c_chip", "Chip Pack ×2"); did = true; }
  for (let i = 0; i < 4 && want("credit", 300) && need.chip > S.inv.chip; i++) { await buy("credit", "r_chip", "Chip Pack"); did = true; }
  for (let i = 0; i < 6 && want("cert", 25); i++) { await buy("cert", "c_permit", "Headhunting Permit"); did = true; }
  for (let i = 0; i < 4 && weakSlots().length > S.runes.filter(r => r.rar >= 5 && !r.eq).length && want("tokens", 220); i++) { await buy("tokens", "t_rune", "T5 Module"); did = true; }
  if (pushOn() && want("tokens", 60) && S.inv.summ < 12) { await buy("tokens", "t_summ", "Skill Summary ×4"); did = true; }
  for (let i = 0; i < 3 && !weakSlots().length && want("tokens", 240 + (need.chip > S.inv.chip ? 90 : 0)); i++) { await buy("tokens", "t_permit", "Headhunting Permit"); did = true; }
  if (want("credit", 200) && S.lmd < need.lmd) { await buy("credit", "r_lmd", "LMD ×12,000"); did = true; }
  if (want("credit", 160) && S.inv.summ < 10) { await buy("credit", "r_summ", "Skill Summary ×3"); did = true; }
  if (want("credit", 240)) { await buy("credit", "r_rec", "Strategic Battle Record ×3"); did = true; }
  return did;
}
// the banner to pull on: the one whose featured 6★ helps most (during the push: improves the PvP roster)
function bannerValue(b) {
  return Math.max(...b.feat6.map(k => (S.ops[k] && S.ops[k].pot >= 6 ? 0 : metaScore(k) * (S.ops[k] ? .35 : 1))));
}
const bestBanner = () => bannersNow().slice().sort((a, b) => bannerValue(b) - bannerValue(a))[0];
function bannerWanted() {
  const b = bestBanner(), P = S.demoPush, weakest = Math.min(...P.roster.map(metaScore));
  return b.feat6.some(k => !(S.ops[k] && S.ops[k].pot >= 6) && (metaScore(k) > weakest || (!!S.ops[k] && P.roster.includes(k))));
}
async function demoHeadhunt() {
  if (pushOn() && S.prime > 6) {
    for (let i = 0; i < 12 && S.prime > 6; i++) await buy("prime", "p_oru", "Originite Prime → Orundum");
  }
  const stash = S.permit + Math.floor(S.orundum / 600);
  const free = (S.inv.hh10 || 0) > 0;
  let ten = free || S.permit >= 10 || S.orundum >= 6000;
  const one = !S.daily.hh && (S.permit >= 1 || S.orundum >= 600);
  // during the push: ×10 only on a banner whose featured 6★ would make the roster better (or when the stash is overflowing)
  if (ten && !free && pushOn() && !bannerWanted() && stash < 40) ten = false;
  if (!ten && !one) return false;
  const B = bestBanner();
  say("Headhunting", (ten ? (free ? "Free ten-roll" : "×10") : "×1 for the daily mission") + ` on ${B.n} (${B.feat6.map(k => OPS[k].n).join(" & ")})`);
  await goTab("hh");
  if (UI.hhB !== B.id) await tapAct("hhBanner", { b: B.id }, B.n);
  if (ten && free) await tapAct("pull", { n: 10, ten: 1 }, "Ten-roll Permit");
  else await tapAct("pull", { n: ten ? 10 : 1 }, "Headhunt");
  await settle();
  return true;
}
async function openOp(k, tab) {
  if (!(UI.view === "op" && UI.arg === k)) {
    await goTab("ops");
    if (UI.all) await tapAct("toggleAll", {}, "Owned");
    if (UI.cls !== "all") await tapAct("clsf", { c: "all" });
    if (UI.el !== "all") await tapAct("elf", { e: "all" });
    await tapAct("go", { v: "op", a: k }, OPS[k].n);
  }
  if (UI.opTab !== tab) await tapAct("opTab", { t: tab }, tab + " tab");
}
function moduleScore(r, k) {
  const op = OPS[k], dps = !(op.cls === "Defender" || isHealer(k));
  const pref = dps ? { atk: 1.2, cr: 1, cd: 1, spd: 1.1, acc: .5, hp: .6, def: .5, res: .4 } : { hp: 1.2, def: 1.1, spd: 1, res: .8, atk: .5, cr: .3, cd: .3, acc: .4 };
  return r.rar * 10 + r.lvl * .6 + (pref[r.main] || .5) * 6 + (op.runes.includes(r.set) ? 5 : 0);
}
async function upgradeOp(k) {
  const p = S.ops[k], op = OPS[k]; let did = false;
  const name = op.n;
  // level with Battle Records
  if (p.lvl < LV_CAP[p.elite] && ["rec1", "rec2", "rec3", "rec4"].some(i => S.inv[i] > 0)) {
    say("Leveling " + name, `Lv ${p.lvl} → up to ${LV_CAP[p.elite]} (Elite ${p.elite})`);
    await openOp(k, "upgrade"); await tapAct("autoLv", { k }, "Auto level"); did = true;
  }
  // promote
  const reserve = 0;
  if (canPromote(k) && S.lmd - eliteCost(k, p.elite + 1).lmd >= reserve) {
    say("Promoting " + name, `Elite ${p.elite} → Elite ${p.elite + 1}`);
    await openOp(k, "upgrade"); await tapAct("promote", { k }, "Promote"); did = true;
  }
  // skills: highest unlocked active skill first
  const need = promoNeeds();
  for (let n = 0; n < 4; n++) {
    const i = op.skills.map((s, j) => j).filter(j => { const s = op.skills[j]; return !s.passive && s.elite <= p.elite && p.sk[j] < 7 && !(p.sk[j] >= 4 && p.elite < 1); }).sort((a, b) => b - a || p.sk[a] - p.sk[b])[0];
    if (i == null) break;
    const c = skillCost(p.sk[i]);
    if (S.inv.summ < c.summ || S.lmd - c.lmd < need.lmd * .5) break;
    say("Raising skills · " + name, `S${i + 1} ${op.skills[i].name} → Skill Level ${p.sk[i] + 1}`);
    await openOp(k, "skills"); await tapAct("skUp", { k, i }, "Skill up"); did = true;
  }
  // modules: equip the two best
  for (const slot of [0, 1]) {
    const cur = runeById(p.runes[slot]), other = runeById(p.runes[1 - slot]);
    const best = S.runes.filter(r => (!r.eq || r.eq.k !== k) && r !== other && !(r.eq && coreOps().slice(0, 4).includes(r.eq.k) && r.eq.k !== k))
      .sort((a, b) => moduleScore(b, k) - moduleScore(a, k))[0];
    if (best && (!cur || moduleScore(best, k) > moduleScore(cur, k) + 2)) {
      await openOp(k, "runes");
      const btn = actEl("equip", { k, s: slot, id: best.id });
      if (!btn) continue;
      say("Equipping modules · " + name, `${runeSetName(best.set)} Module ${RUNE_RAR[best.rar]} in slot ${"XY"[slot]}`);
      await tapEl(btn, "equip"); did = true;
    }
  }
  return did;
}
async function upgradeModules() {
  // upgrade the squad's modules with spare LMD (keep enough for promotions)
  const need = promoNeeds(); let did = false;
  for (const k of coreOps().slice(0, pushOn() ? 8 : 4)) for (const rid of S.ops[k].runes) {
    const r = runeById(rid); if (!r || r.lvl >= 15 || (pushOn() && r.rar < 4)) continue;
    if (S.lmd - enhanceCost(r) < need.lmd + 5000) continue;
    say("Upgrading modules · " + OPS[k].n, `${runeSetName(r.set)} Module +${r.lvl}`);
    await openOp(k, "runes");
    await tapEl($(`.rslot.full[data-id="${r.id}"]`), "module");
    for (let n = 0; n < 15 && r.lvl < 15 && S.lmd - enhanceCost(r) >= need.lmd + 5000; n++) await tapAct("enhance", { id: r.id }, "Upgrade");
    await closeAllModals(); did = true;
  }
  return did;
}
async function tidyDepot() {
  if (S.runes.filter(r => !r.eq && r.rar <= 2).length < 12) return false;
  say("Tidying the Depot", "Disassembling spare T1 and T2 modules");
  await goHome(); await tapAct("go", { v: "depot" }, "Depot");
  if (UI.depotTab !== "runes") await tapAct("depotTab", { t: "runes" });
  await tapAct("sellJunk", {}, "Disassemble"); return true;
}
// ---------- Inbox, guild and chat ----------
async function claimInbox() {
  if (!(S.mail || []).some(m => !m.claimed)) return false;
  say("Checking the Inbox", `${S.mail.filter(m => !m.claimed).length} rewards waiting`);
  await goHome(); await tapAct("go", { v: "inbox" }, "Inbox");
  await tapAct("mailAll", {}, "Claim all"); await closeAllModals();
  return true;
}
async function openGuild(tab) {
  if (UI.view !== "guild") { await goHome(); await tapAct("go", { v: "guild" }, "Guild"); }
  if (tab && myGuild() && (UI.gTab || "members") !== tab) await tapAct("gTab", { t: tab }, tab);
}
// join a guild early on, donate every day and spend both boss attacks
async function guildRoutine() {
  if (S.lvl < 8) return false;
  if (!S.guild) {
    if ((S.gLeft && Date.now() - S.gLeft < 3600e3) || (S.gReq || []).length || DEMO.guildTry === today()) return false;
    DEMO.guildTry = today();
    await openGuild();
    const inv = actEl("ginvAccept");
    if (inv && !inv.disabled) { say("Guild", "Accepting an invitation"); await tapEl(inv, "Accept"); return true; }
    const btn = $$('[data-act="gjoin"]').find(b => !b.disabled);
    if (btn) { const g = guildById(btn.dataset.g); say(g.pol === "open" ? "Joining a guild" : "Asking to join a guild", `${g.name} [${g.tag}]`); await tapEl(btn, "Join"); return true; }
    return false;
  }
  const g = myGuild(); let did = false;
  if (!(g.don && g.don.day === today() && g.don.by[-1])) {
    const d = S.prime > 30 ? "prime" : S.orundum > 40000 ? "oru" : S.lmd > 150000 ? "lmd" : null;
    if (d) { say("Guild donation", g.name); await openGuild("donate"); await tapAct("gdonate", { id: d }, "Donate"); await closeAllModals(); did = true; }
  }
  for (let k = 0; k < 2 && gbTriesLeft() > 0; k++) {
    const b = gBoss(g), waves = [[{ en: b.key, LV: gbLV(b.stage) }]];
    say("Guild boss", `${ENEMY[b.key].n} · stage ${b.stage}`);
    await openGuild("boss");
    await tapAct("gbossGo", {}, "Attack");
    await pickSquad(squadFor(waves)); await settle(); await closeAllModals();
    did = true;
  }
  return did;
}
// a quick hello in World chat once a day, typed like a person would
const DEMO_HELLO = ["hi all", "morning doctors", "o/ hello everyone", "good luck on your pulls today", "anyone else farming supplies today?", "gl on the ladder everyone", "back for the dailies"];
async function chatHello() {
  if (S.demoChat === today()) return false;
  S.demoChat = today();
  say("World chat", "Saying hello");
  await goHome(); await tapAct("go", { v: "chat" }, "Chat");
  if (chatTabKey() !== "world") await tapAct("chatTab", { t: "world" }, "World");
  const inp = $("#cin"); if (!inp) return false;
  await tapEl(inp, "chat box");
  const msg = pick(DEMO_HELLO);
  for (const ch of msg) { inp.value += ch; if (!DEMO.fast) await w(45); }
  await tapAct("chatSend", {}, "Send");
  await w(3500);
  return true;
}
async function housekeeping() {
  await claimMissions();
  await claimInbox();
  await shopping();
  for (let i = 0; i < 4 && await demoHeadhunt(); i++) await claimMissions();
  for (const k of coreOps()) await upgradeOp(k);
  await upgradeModules();
  await tidyDepot();
  await guildRoutine();
  await chatHello();
  await claimMissions();
  await claimInbox();
}

// ---------- content ----------
async function openNodeSheet(nd) {
  await closeAllModals();
  if (!(UI.view === "chapter" && UI.arg === nd.ch.id)) { await goTab("story"); await tapAct("chapter", { c: nd.ch.id }, "Episode " + nd.ch.no); }
  await tapAct("openNode", { id: nd.id }, nd.id);
}
async function pickSquad(ids) {
  await until(() => UI.view === "team" && UI.team, 8000);
  if (UI.el !== "all") await tapAct("elf", { e: "all" });
  for (const k of UI.team.ids.slice()) if (!ids.includes(k)) await tapAct("pickTeam", { k }, OPS[k].n);
  for (const k of ids) if (!UI.team.ids.includes(k)) await tapAct("pickTeam", { k }, OPS[k].n);
  const li = UI.team.ids.indexOf(ids[0]); if (li > 0) await tapAct("slot", { k: li }, "leader");
  await tapAct("deploy", {}, "Mission Start");
}
async function playNode(nd, why) {
  say(why, `${nd.id} ${nd.name}`);
  if (!nd.waves) {
    await openNodeSheet(nd); await tapAct("startNode", { id: nd.id }, nd.type === "story" ? "Read story" : "Collect");
    await settle(); await closeAllModals(); return true;
  }
  await ensureSanity(nodeCost(nd));
  const squad = squadFor(nodeWaves(nd), nodeTurnGoal(nd)), before = nodeStars(nd.id);
  await openNodeSheet(nd);
  await tapAct("startNode", { id: nd.id }, "Start");
  await pickSquad(squad);
  await settle(); await closeAllModals();
  return nodeStars(nd.id) > before;
}
async function playHunt(h, l) {
  say(`Supplies ${h.code}-${l}`, h.n);
  await ensureSanity(HUNT_COST[l - 1]);
  const squad = squadFor(huntWaves(h, l));
  await goTab("battle"); await tapAct("go", { v: "hunt", a: h.id }, h.n);
  if (actEl("huntLv", { h: h.id, l }) && !actEl("huntLv", { h: h.id, l }).classList.contains("on")) await tapAct("huntLv", { h: h.id, l }, h.code + "-" + l);
  await tapAct("huntGo", { h: h.id, l }, "Start");
  const before = S.hunt[h.id] || 0;
  await pickSquad(squad); await settle(); await closeAllModals();
  return (S.hunt[h.id] || 0) > before;
}
async function playTower(f) {
  say(`Stationary Security Service · Floor ${f}`, f % 5 === 0 ? "Boss floor" : "");
  const squad = squadFor(towerWaves(f));
  await goTab("battle"); await tapAct("go", { v: "tower" }, "SSS");
  await tapAct("towerGo", { f }, "Floor " + f);
  await pickSquad(squad); await settle(); await closeAllModals();
  return S.tower >= f;
}
async function openContracts(tab) {
  if (UI.view === "arena" && $("#modal").hidden) rerender();
  if (UI.view !== "arena") { await goTab("battle"); await tapAct("go", { v: "arena" }, "Contingency Contract"); }
  if ((UI.arenaTab === "rta" ? "rta" : "ladder") !== tab) await tapAct("arenaTab", { t: tab }, tab === "rta" ? "Real-Time Contract" : "Contingency Contract");
}
// keep the strongest squad on defense
async function ensureDefense() {
  const best = squadFor([coreOps().slice(0, 4).map(k => ({ op: k, prog: S.ops[k] }))]);
  const cur = (S.team.defense || []).filter(owned), pw = ids => ids.reduce((a, k) => a + power(k, S.ops[k]), 0);
  if (cur.length === 4 && pw(cur) >= pw(best) * .93) return;
  say("Setting the defense squad", best.map(k => OPS[k].n).join(", "));
  await openContracts("ladder");
  await tapAct("defense", {}, "Defense squad");
  await pickSquad(best);
  await closeAllModals();
}
async function playLadder() {
  tickTimers();
  const L = S.ladder;
  if (L.tickets <= 0) await skipTime(TICKET_MS - (Date.now() - L.tTime) + 1000, "Waiting for a Contract Ticket");
  await ensureDefense();
  for (let tries = 0; tries < 3; tries++) {
    const opps = ladderOpps().map(i => ({ i, doc: ladderDoc(i), p: L.pop[i] }));
    let best = null, be = 0;
    for (const o of opps) {
      const waves = [o.doc.team.map(k => npcSpec(o.doc, k))], squad = squadFor(waves, 0, o.doc.ai);
      const win = simRun(squad, waves, DEMO.fast ? 4 : 5, 0, o.doc.ai).win;
      const ev = win * eloDelta(L.pts, o.p, true, eloK(L.pts)) + (1 - win) * eloDelta(L.pts, o.p, false, eloK(L.pts));
      if (win >= .5 && ev > be) { be = ev; best = { ...o, squad, win }; }
    }
    if (best) {
      say("Contingency Contract", `vs ${best.doc.name} · ${tierOf(best.p).n} ${best.p} · ${Math.round(best.win * 100)}% to win`);
      await openContracts("ladder");
      const before = L.pts;
      await tapAct("ladderGo", { i: best.i }, "Fight");
      await pickSquad(best.squad); await settle(); await closeAllModals();
      return L.pts > before;
    }
    if (Date.now() - L.oppT < REFRESH_MS) await skipTime(REFRESH_MS - (Date.now() - L.oppT) + 1000, "Waiting to refresh opponents");
    say("Contingency Contract", "Looking for a beatable opponent");
    await openContracts("ladder"); await tapAct("ladderRefresh", {}, "Refresh");
  }
  return false;
}
// Real-Time Contract: queue, draft (pick 5, ban 1), then fight on AUTO
async function playRta() {
  // check the odds against a typical opponent at this rating before queueing
  const sample = rtaOpponent(), mine = squadFor([sample.team.map(k => npcSpec(sample, k))], 0, sample.ai);
  const odds = simRun(mine, [sample.team.map(k => npcSpec(sample, k))], DEMO.fast ? 4 : 5, 0, sample.ai).win;
  const P = S.demoPush, ready = rosterReady();
  if (ready && P.rta.day !== today()) P.rta = { day: today(), n: 0 };
  if (ready ? P.rta.n >= 10 || odds < .3 : odds < .5 && S.rta.place === 0) return false;
  if (ready) P.rta.n++;
  const built = k => S.ops[k].elite >= Math.min(2, OPS[k].maxElite) && S.ops[k].lvl >= LV_CAP[S.ops[k].elite] - 10;
  const pool = ready ? Object.keys(S.ops).filter(k => P.roster.includes(k) || built(k)) : Object.keys(S.ops);
  say("Real-Time Contract", `Queueing at ${tierOf(S.rta.pts).n} ${S.rta.pts}`);
  await openContracts("rta");
  const before = S.rta.pts, games = S.rta.games;
  await tapAct("rtaFind", {}, "Find Match");
  await until(() => DRAFT || !$("#draft").hidden, 15000);
  while (DRAFT) {
    chk(DEMO.gen);
    const D = DRAFT;
    if (D.phase === "pick" && draftWho() === 0) {
      const k = draftPick(pool.filter(x => !D.picks[0].includes(x)), myProg, D.picks[0], D.picks[1], 1);
      say("Real-Time Contract · draft", `Pick ${D.picks[0].length + 1}/5: ${OPS[k].n}`);
      await tapAct("draftPick", { k }, OPS[k].n);
    } else if (D.phase === "ban" && D.ban[0] == null) {
      const k = draftBan(D.picks[1], x => D.opp.prog[x], 1);
      say("Real-Time Contract · draft", `Banning ${OPS[k].n}`);
      await tapAct("draftBan", { k }, "Ban " + OPS[k].n);
    } else await new Promise(r => setTimeout(r, DEMO.fast ? 0 : 120));
  }
  await settle(); await closeAllModals();
  return S.rta.games > games && S.rta.pts > before;
}
// try the next piece of content that the squad can win; true if something was gained
async function progress() {
  const sq = ids => ids;
  // Main Theme, in order
  const nd = nextNode();
  if (nd) {
    if (!nd.waves) return playNode(nd, nd.type === "story" ? "Reading the story" : "Collecting supplies");
    const r = simRun(squadFor(nodeWaves(nd), nodeTurnGoal(nd)), nodeWaves(nd), 6, nodeTurnGoal(nd));
    if (r.win >= .55 || failKey("node" + nd.id, 0) > 6 && r.win >= .3) {
      const ok = await playNode(nd, nd.type === "boss" ? "Boss operation" : nd.type === "side" ? "Side story" : "Main Theme");
      if (!ok) failKey("node" + nd.id);
      if (ok) return true;
    }
  }
  // 3-star clears
  for (const x of Object.values(NODES)) {
    if (!x.waves || !nodeStars(x.id) || nodeStars(x.id) >= 3 || !nodeOpen(x)) continue;
    const r = simRun(squadFor(nodeWaves(x), nodeTurnGoal(x)), nodeWaves(x), 6, nodeTurnGoal(x));
    if (r.three >= .5 && await playNode(x, "Going for 3 stars")) return true;
  }
  // side stories that are open but not yet cleared
  for (const x of Object.values(NODES)) {
    if (x.type !== "side" || nodeStars(x.id) || !nodeOpen(x)) continue;
    const r = simRun(squadFor(nodeWaves(x), nodeTurnGoal(x)), nodeWaves(x), 6);
    if (r.win >= .55 && await playNode(x, "Side story")) return true;
  }
  // Supplies
  for (const h of HUNTS) {
    const l = (S.hunt[h.id] || 0) + 1; if (l > 6) continue;
    const r = simRun(squadFor(huntWaves(h, l)), huntWaves(h, l), 6);
    if (r.win >= .6 && await playHunt(h, l)) return true;
  }
  // SSS
  if (S.tower < TOWER_FLOORS) {
    const f = S.tower + 1, r = simRun(squadFor(towerWaves(f)), towerWaves(f), 6);
    if (r.win >= .6 && await playTower(f)) return true;
  }
  // Contingency Contract
  const LEG = LEGEND();
  const cc = async () => (S.ladder.best < LEG || !S.daily.arena) && await playLadder();
  const rt = async () => S.rta.best < LEG && Object.keys(S.ops).length >= 5 && await playRta();
  if (S.rta.pts < S.ladder.pts) { if (await rt() || await cc()) return true; }
  else if (await cc() || await rt()) return true;
  return false;
}
// get stronger: farm records, LMD and modules with Auto Deploy
// push farming: Supplies whose module sets the roster wants (T5 odds are best at level 6), else Battle Records
async function pushFarm() {
  const weak = weakSlots(), lvNeed = S.demoPush.roster.some(k => S.ops[k].lvl < LV_CAP[S.ops[k].elite]);
  const hunts = HUNTS.map(h => [h, S.hunt[h.id] || 0]).filter(([, l]) => l > 0);
  const fit = ([h, l]) => l * 2 + weak.filter(k => OPS[k].runes.some(set => h.sets.includes(set))).length * 3;
  const pickH = hunts.sort((a, b) => fit(b) - fit(a))[0];
  if (!pickH || !weak.length || (lvNeed && R() >= .65)) return false;
  const [h, l] = pickH;
  await ensureSanity(HUNT_COST[l - 1] * 3);
  say("Power push · farming modules", `Auto Deploy ×3 · ${h.code}-${l} (${h.sets.slice(0, 3).join(", ")}…)`);
  await goTab("battle"); await tapAct("go", { v: "hunt", a: h.id }, h.n);
  if (!actEl("huntLv", { h: h.id, l }).classList.contains("on")) await tapAct("huntLv", { h: h.id, l });
  await tapAct("huntSweep", { h: h.id, l }, "Auto Deploy ×3"); await closeAllModals();
  return true;
}
async function improve() {
  if (pushOn() && await pushFarm()) return true;
  const best = Object.values(NODES).filter(x => x.waves && nodeStars(x.id) >= 3).sort((a, b) => b.lv - a.lv)[0];
  const huntBest = HUNTS.map(h => [h, S.hunt[h.id] || 0]).filter(([, l]) => l > 0).sort((a, b) => b[1] - a[1])[0];
  const modulesWeak = coreOps().slice(0, 4).some(k => S.ops[k].runes.filter(r => r != null).length < 2 || S.ops[k].runes.some(rid => { const r = runeById(rid); return r && r.rar < 4; }));
  const lmdShort = S.lmd < promoNeeds().lmd;
  if (huntBest && (modulesWeak || lmdShort || !best || R() < .25)) {
    const [h, l] = huntBest;
    await ensureSanity(HUNT_COST[l - 1] * 3);
    say("Farming Supplies", `Auto Deploy ×3 · ${h.code}-${l}`);
    await goTab("battle"); await tapAct("go", { v: "hunt", a: h.id }, h.n);
    if (!actEl("huntLv", { h: h.id, l }).classList.contains("on")) await tapAct("huntLv", { h: h.id, l });
    await tapAct("huntSweep", { h: h.id, l }, "Auto Deploy ×3"); await closeAllModals();
    return true;
  }
  if (best) {
    await ensureSanity(nodeCost(best) * 3);
    say("Farming Battle Records", `Auto Deploy ×3 · ${best.id} ${best.name}`);
    await openNodeSheet(best); await tapAct("sweep", { id: best.id, x: 3 }, "Auto Deploy ×3"); await closeAllModals();
    return true;
  }
  // nothing with 3 stars yet: replay the latest cleared operation for its drops and EXP
  const replay = Object.values(NODES).filter(x => x.waves && nodeStars(x.id)).sort((a, b) => b.lv - a.lv)[0];
  if (replay) { await playNode(replay, "Replaying for EXP"); return true; }
  return false;
}
function stuckFor() {
  tickTimers();
  const mx = maxSanity(S.lvl);
  if (S.sanity < mx * .5) return [(mx - S.sanity) * SAN_MS, "Resting until Sanity is full"];
  const now = new RealDate(Date.now()), next = RealDate.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 5);
  return [next - now.getTime(), "Waiting for tomorrow's missions and Credit"];
}
async function finale() {
  const G = demoGoals();
  say("100% complete!", "Every stage, Supplies, SSS floor, Legend in both Contracts and every Main Line mission");
  await goHome();
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">Demo complete</div><h1 class="gold">100%</h1>
    <p class="small dim">All ${Object.keys(NODES).length} Main Theme stages, Supplies 1–6, all ${TOWER_FLOORS} SSS floors, Legend in Contingency Contract and Real-Time Contract, and every Main Line mission.</p>
    <div class="statgrid small"><div><span>Doctor level</span><b>${S.lvl}</b></div><div><span>Operators</span><b>${Object.keys(S.ops).length}</b></div>
      <div><span>Battles won</span><b>${S.stats.wins}</b></div><div><span>Headhunts</span><b>${S.gacha.total}</b></div></div>
    <button class="btn wide" data-act="closeModal">Close</button></div>`);
  await w(8000);
  stopDemo("Demo complete: 100%");
}

async function plateaued() {
  const G = demoGoals(), cc = tierOf(S.ladder.best).n, rt = tierOf(S.rta.best).n;
  say("Plateaued", `Contingency Contract ${cc} ${S.ladder.best} · Real-Time Contract ${rt} ${S.rta.best}`);
  await goHome();
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">Demo stopped</div><h1 class="gold">${Math.floor(G.pct)}%</h1>
    <p class="small dim">The PvP roster has been fully built for ${Math.round(PUSH_GIVEUP / 864e5)} in-game days without climbing further. Best ratings: Contingency Contract <b>${cc} ${S.ladder.best}</b>, Real-Time Contract <b>${rt} ${S.rta.best}</b>.</p>
    <button class="btn wide" data-act="closeModal">Close</button></div>`);
  await w(8000);
  stopDemo(`Demo plateaued at ${cc} / ${rt}`);
}

// ---------- main loop ----------
async function demoMain() {
  const g = DEMO.gen;
  say("Booting the Demo save", S.seenIntro ? "Continuing" : "New Doctor");
  await w(900);
  if (!$("#modal").hidden && actEl("introGo")) { say("A new Doctor wakes up", "Begin Episode 1"); await tapAct("introGo", {}, "Begin Episode 1"); await closeAllModals(); }
  let idle = 0, lastPct = -1;
  while (DEMO.on && g === DEMO.gen) {
    try {
      const G = demoGoals();
      if (G.done) { await finale(); return; }
      if (G.pct > lastPct + .01) { lastPct = G.pct; idle = 0; }
      const P = pushState();
      if (P.on) {
        if (P.roster.every(opMaxed)) P.maxedT = P.maxedT || Date.now(); else P.maxedT = 0;
        if (P.maxedT && Date.now() - P.maxedT > PUSH_GIVEUP && Date.now() - P.since > 7 * 864e5) { await plateaued(); return; }
      }
      await housekeeping();
      if (await progress()) continue;
      if (idle++ < 12 && await improve()) continue;
      const [ms, why] = stuckFor(); idle = Math.max(0, idle - 4);
      await skipTime(ms, why);
    } catch (e) {
      if (e instanceof DemoStop) return;
      DEMO.errors++; console.warn("[demo]", e); say("Recovering", String(e.message || e).slice(0, 80));
      if (DEMO.errors > 40) { stopDemo("Demo stopped after repeated errors"); return; }
      await demoRecover();
    }
  }
}
async function demoRecover() {
  await w(400);
  if (BT.on) { try { await fight(); } catch (e) { if (e instanceof DemoStop) throw e; } }
  if (!$("#dlg").hidden) { const s = $("#dSkip"); if (s) s.click(); }
  if (!$("#gacha").hidden) { const d = $("#gDone"); if (d) d.click(); else { $("#gacha").hidden = true; $("#gacha").innerHTML = ""; } }
  closeModal(); route("home");
}

// ---------- start / stop ----------
function startDemo(fresh) {
  if (DEMO.on) return;
  if (fresh) { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* storage unavailable */ } }
  const ds = readSave(DEMO_KEY);
  DEMO.on = true; DEMO.gen++; DEMO.fails = {}; DEMO.errors = 0; DEMO.log = [];
  DEMO.skew = ds && ds.demoSkew || 0;
  window.Date = DemoDate;
  SESSION = { id: "demo", name: "Demo" };
  hideTitle();
  enterGame(DEMO_KEY, { name: "Demo" });
  S.settings.auto = false; S.settings.ai = "expert";
  demoHud();
  document.body.classList.add("demo");
  document.addEventListener("keydown", demoKeys);
  return demoMain().catch(e => { if (!(e instanceof DemoStop)) console.error(e); });
}
function stopDemo(msg) {
  if (!DEMO.on) return;
  DEMO.on = false; DEMO.gen++;
  document.removeEventListener("keydown", demoKeys);
  if (BT.on) {
    BT.quit = true;
    if (BT.inputRes) { const r = BT.inputRes; BT.inputRes = null; r("quit"); }
    const cfg = BT.cfg; closeBattle(); if (cfg && cfg.onQuit) cfg.onQuit();
  }
  if (S) { S.demoSkew = DEMO.skew; try { localStorage.setItem(DEMO_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  window.Date = RealDate;
  for (const id of ["demoHud", "demoBlock", "demoFinger", "demoSkip"]) { const el = $("#" + id); if (el) el.remove(); }
  document.body.classList.remove("demo");
  DEMO.fx = DEMO.fy = -1;
  S = null; SESSION = null; SAVE_SLOT = SAVE_KEY;
  showTitle(msg);
}
