
// =====================================================================
//  SAVE STATE + PROGRESSION
//  Pokémon levels (1–100) are capped by Gym Badges. Catching a Pokémon you already have raises its IVs.
//  Pokémon evolve by level, by evolution stone, or with a Linking Cord (for the trade evolutions).
// =====================================================================
const SAVE_KEY = "pokemon_kanto_squad_v1";
let S = null;
// level cap by number of Gym Badges (just above each Gym Leader's ace); beating the Champion lifts it to 100
const LV_CAPS = [15, 22, 26, 32, 44, 47, 52, 56, 70];
const levelCap = () => S.champion ? 100 : LV_CAPS[Math.min(8, S.badges || 0)];
const maxSanity = l => 80 + Math.floor(l * 1.5);
const SAN_MS = 30000;
const pxpNeed = l => 100 + 50 * l;
// growth rates (PokeAPI ids): 1 slow, 2 medium, 3 fast, 4 medium slow, 5 erratic, 6 fluctuating
const GROWTH = { 1: 1.25, 2: 1, 3: .8, 4: 1.1, 5: 1.15, 6: 1.2 };
const xpNeed = (l, key) => Math.round((10 + l * l * .9) * (GROWTH[OPS[key] ? OPS[key].gr : 2] || 1));
const effLV = p => p.lvl;
const mkProg = (lvl = 5) => ({ lvl, xp: 0, pot: 1, sk: [1, 1, 1], held: null, t: Date.now() });
// IV rank 1–6 (raised by catching duplicates); shown as IVs on the summary screen
const ivOf = pot => 10 + pot * 3;
const IV_WORD = ["", "Decent", "Above average", "Good", "Very good", "Fantastic", "Perfect"];

// play statistics behind the Medals
const newStats = () => ({ battles: 0, wins: 0, crits: 0, kills: 0, flawless: 0, versus: 0, patrols: 0, fives: 0, evolutions: 0, loginDays: 0, superEff: 0 });
function newSave() {
  const s = {
    v: 1, name: "Red", named: false, lvl: 1, xp: 0, seenIntro: false, starter: null,
    playerId: String(10000 + Math.floor(R() * 89999)), created: Date.now(),
    inbox: [], mailSeq: 0, achv: {}, lastLogin: "", lastGift: Date.now(), lvlGift: 1,
    sanity: maxSanity(1), sTime: Date.now(),
    lmd: 3000, orundum: 1200, permit: 0, cert: 0, tokens: 0, prime: 3,
    inv: { rec1: 10, rec2: 2, rec3: 0, rec4: 0, rare: 2, summ: 3 }, held: { sitrusberry: 1, silkscarf: 1 },
    badges: 0, champion: false, chRw: {}, hunt: {},
    ops: {}, dex: { seen: {}, caught: {} },
    story: {}, team: { story: [], hunt: [], tower: [], arena: [] },
    assistant: null, tower: 0,
    arena: { rank: 1500, attempts: 5, aTime: Date.now(), payTime: Date.now(), opps: null },
    gacha: { pity: 0, firstTen: true, total: 0 },
    daily: { day: today(), clear: 0, sanity: 0, hh: 0, upgrade: 0, arena: 0, rune: 0, claimed: {} },
    settings: { speed: 1, auto: false, sound: true, ai: "balanced", text: "normal", shell: "classic" }, stats: newStats(),
  };
  welcomeMail(s);
  return s;
}
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return s; } } catch (e) { /* storage unavailable */ }
  return null;
}
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }, 150);
}
function tickTimers() {
  const now = Date.now(), mx = maxSanity(S.lvl);
  if (S.sanity >= mx) S.sTime = now;
  else { const n = Math.floor((now - S.sTime) / SAN_MS); if (n > 0) { S.sanity = Math.min(mx, S.sanity + n); S.sTime += n * SAN_MS; if (S.sanity >= mx) S.sTime = now; } }
  const A = S.arena;
  if (A.attempts >= 5) A.aTime = now;
  else { const n = Math.floor((now - A.aTime) / ARENA_MS); if (n > 0) { A.attempts = Math.min(5, A.attempts + n); A.aTime += n * ARENA_MS; } }
  if (S.daily.day !== today()) S.daily = { day: today(), clear: 0, sanity: 0, hh: 0, upgrade: 0, arena: 0, rune: 0, claimed: {} };
}

// ---------- inventory ----------
const WALLET = ["lmd", "orundum", "permit", "cert", "tokens", "prime"];
function have(k) { return WALLET.includes(k) ? S[k] : k === "sanity" ? S.sanity : HELD[k] ? (S.held[k] || 0) : (S.inv[k] || 0); }
function give(rw) {
  const out = [];
  for (const k in rw) {
    const v = rw[k];
    if (k === "op") { const r = grantOp(v); out.push({ k: "op:" + v, n: 1, isNew: r.isNew }); continue; }
    if (k === "held") { for (const h of [].concat(v)) { S.held[h] = (S.held[h] || 0) + 1; out.push({ k: "held:" + h, n: 1 }); } continue; }
    if (k === "sanityMax") { S.sanity = Math.max(S.sanity, maxSanity(S.lvl)); S.sTime = Date.now(); out.push({ k: "sanity", n: maxSanity(S.lvl) }); continue; }
    if (HELD[k]) { S.held[k] = (S.held[k] || 0) + v; out.push({ k: "held:" + k, n: v }); continue; }
    if (WALLET.includes(k)) S[k] += v; else if (k === "sanity") S.sanity += v; else S.inv[k] = (S.inv[k] || 0) + v;
    out.push({ k, n: v });
  }
  return out;
}
function spendSanity(n) {
  S.sanity -= n; S.daily.sanity += n; S.xp += n * 10;
  let ups = 0;
  while (S.lvl < 120 && S.xp >= pxpNeed(S.lvl)) { S.xp -= pxpNeed(S.lvl); S.lvl++; ups++; }
  if (ups) { S.sanity = Math.max(S.sanity, maxSanity(S.lvl)); S.orundum += 30 * ups; toast(`Trainer Level ${S.lvl}! PP restored, +${30 * ups} Gems.`, "gold"); }
}

// ---------- stats ----------
// The main-series stat formula (IVs from the IV rank, no EVs), plus Gym Badge boosts for your own Pokémon.
function calcStats(key, L, pot) {
  const b = OPS[key].b, iv = ivOf(pot);
  const f = B => Math.floor((2 * B + iv) * L / 100) + 5;
  return { hp: Math.floor((2 * b[0] + iv) * L / 100) + L + 10, atk: f(b[1]), def: f(b[2]), spa: f(b[3]), sdf: f(b[4]), spe: f(b[5]) };
}
const BADGE_BOOST = .05;
function opStats(key, p, mine = true) {
  const st = calcStats(key, p.lvl, p.pot);
  if (mine && S) for (let i = 0; i < Math.min(8, S.badges); i++) { const k = BADGES[i].stat; st[k] = Math.round(st[k] * (1 + BADGE_BOOST)); }
  return { st, held: p.held || null };
}
// Combat Power: one number for how strong a Pokémon is right now
function cpOf(st, sk) {
  const off = Math.max(st.atk, st.spa), df = (st.def + st.sdf) / 2;
  return Math.round((off + 15) * Math.sqrt(df + 15) * Math.sqrt(st.hp + 15) / 10 * (1 + st.spe / 400) * (1 + .03 * ((sk || [1, 1, 1]).reduce((a, b) => a + b, 0) - 3)));
}
const power = (key, p) => cpOf(opStats(key, p).st, p.sk);
const progForLV = (key, LV) => ({ lvl: LV, xp: 0, pot: 3, sk: [Math.min(MAX_SK, 1 + Math.floor(LV / 25)), Math.min(MAX_SK, 1 + Math.floor(LV / 25)), Math.min(MAX_SK, 1 + Math.floor(LV / 25))], held: null });
const owned = k => !!S.ops[k];
const topTeam = (n = 4) => Object.keys(S.ops).sort((a, b) => power(b, S.ops[b]) - power(a, S.ops[a])).slice(0, n);

// ---------- leveling ----------
function opXp(key, n) {
  const p = S.ops[key]; if (!p) return 0;
  const cap = levelCap();
  if (p.lvl >= cap) { p.xp = 0; return 0; }
  p.xp += n; let ups = 0;
  while (p.lvl < cap && p.xp >= xpNeed(p.lvl, key)) { p.xp -= xpNeed(p.lvl, key); p.lvl++; ups++; }
  if (p.lvl >= cap) p.xp = 0;
  return ups;
}
function useRecord(key, it) {
  const p = S.ops[key]; if (!p || !(S.inv[it] > 0) || p.lvl >= levelCap()) return false;
  S.inv[it]--;
  if (it === "rare") { p.lvl++; p.xp = 0; } else opXp(key, ITEMS[it].xp);
  return true;
}
function autoLevel(key) {
  let used = 0;
  for (const it of ["rec1", "rec2", "rec3", "rec4"]) while (S.inv[it] > 0 && S.ops[key].lvl < levelCap()) { useRecord(key, it); used++; }
  return used;
}
// Mastery: each rank makes the move 6% stronger (and healing 6% bigger); rank ★ also cuts its cooldown by 1
const skillCost = r => ({ summ: [0, 1, 2, 3, 5][r], lmd: 800 * r });
function skillUp(key, i) {
  const p = S.ops[key]; if (!p || p.sk[i] >= MAX_SK || !OPS[key].skills[i]) return false;
  const c = skillCost(p.sk[i]); if ((S.inv.summ || 0) < c.summ || S.lmd < c.lmd) return false;
  S.inv.summ -= c.summ; S.lmd -= c.lmd; p.sk[i]++; S.daily.upgrade++; return true;
}

// ---------- evolution ----------
// options: [{to, lv?, item?, ok, why}]
function evoOptions(key) {
  const p = S.ops[key]; if (!p) return [];
  return OPS[key].evo.map(e => {
    if (e.lv) return { ...e, ok: p.lvl >= e.lv, why: p.lvl >= e.lv ? "" : `Reaches Lv ${e.lv}` };
    const n = S.inv[e.item] || 0;
    return { ...e, ok: n > 0, why: n > 0 ? "" : `Needs a ${ITEMS[e.item].n}` };
  });
}
const canEvolveNow = key => evoOptions(key).some(o => o.ok);
function evolve(key, to) {
  const o = evoOptions(key).find(x => x.to === to);
  if (!o || !o.ok) return false;
  if (o.item) S.inv[o.item]--;
  const p = S.ops[key];
  delete S.ops[key];
  const ex = S.ops[to];
  if (ex) {
    // already owned: the two merge into the stronger one, and IVs go up
    ex.lvl = Math.max(ex.lvl, p.lvl); ex.xp = 0; ex.pot = Math.min(6, Math.max(ex.pot, p.pot) + 1);
    ex.sk = ex.sk.map((v, i) => Math.max(v, p.sk[i] || 1));
    if (p.held) { if (!ex.held) ex.held = p.held; else S.held[p.held] = (S.held[p.held] || 0) + 1; }
  } else S.ops[to] = p;
  for (const m in S.team) S.team[m] = [...new Set(S.team[m].map(k => k === key ? to : k))].filter(k => S.ops[k]);
  if (S.assistant === key) S.assistant = to;
  dexCatch(to); S.stats.evolutions++; S.daily.upgrade++;
  return true;
}

// ---------- held items ----------
const heldUsed = k => Object.values(S.ops).filter(p => p.held === k).length;
const heldFree = k => (S.held[k] || 0) - heldUsed(k);
function equipHeld(key, item) {
  const p = S.ops[key]; if (!p) return false;
  if (item && heldFree(item) <= 0) return false;
  p.held = item || null; return true;
}

// ---------- Pokédex ----------
function dexSee(k) { if (S && OPS[k] && !S.dex.seen[k]) S.dex.seen[k] = 1; }
function dexCatch(k) { if (!OPS[k]) return; S.dex.seen[k] = 1; S.dex.caught[k] = 1; }
const dexSeen = () => Object.keys(S.dex.seen).length;
const dexCaught = () => Object.keys(S.dex.caught).length;

// ---------- catching ----------
const certFor = r => [0, 0, 0, 5, 20, 60][r];
// level a newly caught Pokémon starts at: grows with your Badges
const catchLevel = () => Math.min(levelCap(), 5 + (S.badges || 0) * 5);
function grantOp(key, lvl) {
  dexCatch(key);
  if (!S.ops[key]) { S.ops[key] = mkProg(lvl || catchLevel()); if (!S.assistant) S.assistant = key; return { key, isNew: true }; }
  const p = S.ops[key];
  if (p.pot < 6) { p.pot++; return { key, isNew: false, iv: true }; }
  S.cert += certFor(OPS[key].rar);
  return { key, isNew: false, coins: certFor(OPS[key].rar) };
}
// Safari Zone: today's featured area (one featured 5★ and two featured 4★)
const SAFARI_POOL = r => OP_KEYS.filter(k => OPS[k].rar === r && !OPS[k].leg);
function bannerToday() {
  const rng = seeded(hash(today() + "safari"));
  const top = SAFARI_POOL(5), mid = SAFARI_POOL(4);
  const f6 = top[Math.floor(rng() * top.length)];
  const f5 = [mid[Math.floor(rng() * mid.length)], mid[Math.floor(rng() * mid.length)]];
  return { feat6: f6, feat5: [...new Set(f5)] };
}
// 5★ 3% (+3% per throw after 50 without one), 4★ 18%, 3★ 79%
const TOP_RATE = .03, MID_RATE = .18;
function rollRarity() {
  const top = TOP_RATE + Math.max(0, S.gacha.pity - 49) * .03, r = R();
  if (r < top) return 5; if (r < top + MID_RATE) return 4; return 3;
}
function pullOne(featured, forceMin) {
  let rar = rollRarity(); if (forceMin && rar < forceMin) rar = forceMin;
  if (rar === 5) { S.gacha.pity = 0; S.stats.fives++; } else S.gacha.pity++;
  S.gacha.total++;
  const B = featured ? bannerToday() : null;
  let key;
  if (B && rar === 5 && R() < .5) key = B.feat6;
  else if (B && rar === 4 && R() < .5) key = pick(B.feat5);
  else key = pick(SAFARI_POOL(rar));
  return grantOp(key);
}
function headhunt(n, featured) {
  const res = [];
  for (let i = 0; i < n; i++) {
    const last = i === n - 1 && n === 10 && S.gacha.firstTen && !res.some(r => OPS[r.key].rar >= 4);
    res.push(pullOne(featured, last ? 4 : 0));
  }
  if (n === 10) S.gacha.firstTen = false;
  S.daily.hh += n;
  return res;
}

// Pokémon a Trainer could plausibly have at a level (no Lv 10 Dragonite), excluding legendaries
const minLevelOf = k => { let lv = 1, x = k; while (OPS[x].from) { const e = OPS[OPS[x].from].evo.find(e => e.to === x); lv = Math.max(lv, e.lv || 25); x = OPS[x].from; } return lv; };
const fieldable = (lv, finalOnly) => OP_KEYS.filter(k => !OPS[k].leg && minLevelOf(k) <= lv + 3 && (!finalOnly || !OPS[k].evo.some(e => e.lv && e.lv <= lv)));

// ---------- Link Battles ----------
function genOpps() {
  const r = S.arena.rank, mine = topTeam(4);
  const avg = mine.length ? mine.reduce((a, k) => a + power(k, S.ops[k]), 0) / mine.length : 300;
  const avgL = mine.length ? mine.reduce((a, k) => a + S.ops[k].lvl, 0) / mine.length : 10;
  const pool = fieldable(avgL + 4, true);
  S.arena.opps = [.04, .1, .18].map(f => {
    const rank = Math.max(1, r - Math.max(1, Math.ceil(r * f)) - ri(0, 3));
    const mult = .82 + .5 * (1 - rank / 1600) + (f - .1) * .5;
    const team = [...pool].sort(() => R() - .5).slice(0, 4);
    const units = team.map(k => {
      let lo = 1, hi = 100, best = 1;
      for (let i = 0; i < 10; i++) { const m = (lo + hi) >> 1; if (cpOf(opStats(k, progForLV(k, m), false).st) < avg * mult) { lo = m + 1; best = m; } else hi = m - 1; }
      return { op: k, LV: Math.max(5, best) };
    });
    return { rank, name: pick(ARENA_N1), cls: pick(ARENA_CLS), team: units, pw: units.reduce((a, u) => a + cpOf(opStats(u.op, progForLV(u.op, u.LV), false).st), 0) };
  });
}
const payout = rank => ({ orundum: Math.max(20, Math.round(360 / (1 + rank / 45))), tokens: Math.max(40, Math.round(900 / (1 + rank / 90))) });

// ---------- Journey progress ----------
const nodeStars = id => S.story[id] || 0;
function nodeOpen(nd) {
  if (nd.idx === 0) { const chs = nd.ep.chapters, ci = chs.indexOf(nd.ch); return ci === 0 || chapterCleared(chs[ci - 1]); }
  let prev = nd.ch.nodes[nd.idx - 1];
  if (prev.type === "side") prev = nd.ch.nodes[nd.idx - 2] || prev;
  return nodeStars(prev.id) > 0;
}
const chapterCleared = ch => ch.nodes.every(n => n.type === "side" || nodeStars(n.id) > 0);
function nextNode() {
  for (const ep of STORY) for (const ch of ep.chapters) for (const nd of ch.nodes) if (nd.type !== "side" && nodeOpen(nd) && !nodeStars(nd.id)) return nd;
  return null;
}
