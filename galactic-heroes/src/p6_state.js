
// =====================================================================
//  SAVE STATE + PROGRESSION
// =====================================================================
const SAVE_KEY = "galactic_heroes_save_v1";
let S = null;
const today = () => new Date().toISOString().slice(0, 10);

function newSave() {
  const s = {
    v: 1, name: "Commander", lvl: 1, xp: 0, seenIntro: false,
    energy: maxEnergy(1), eTime: Date.now(),
    credits: 3000, crystals: 600, tokens: 0,
    inv: { sal1: 24, sal2: 0, sal3: 0, mats: 12, droid1: 6, droid2: 1, droid3: 0 },
    roster: {}, shards: {},
    camp: { light: {}, dark: {} }, firstClear: {},
    squads: { light: [], dark: [], arena: [] },
    arena: { rank: 1250, attempts: 5, aTime: Date.now(), payTime: Date.now(), opps: null },
    bronzeTime: 0,
    daily: { day: today(), wins: 0, arena: 0, energy: 0, upgrades: 0, bronze: 0, claimed: {} },
    settings: { speed: 1, auto: false, sound: true },
    stats: { battles: 0, wins: 0 },
  };
  for (const id in START_ROSTER) s.roster[id] = mkProg(START_ROSTER[id].stars);
  s.squads.light = ["luke", "leia", "han", "chewie"];
  s.squads.dark = ["trooper", "b1", "jango"];
  s.squads.arena = ["luke", "leia", "han", "chewie", "trooper"];
  return s;
}
const mkProg = (stars = 1) => ({ lvl: 1, xp: 0, stars, gear: 1, ab: [1, 1, 1] });

function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return s; } } catch (e) { /* storage unavailable */ }
  return null;
}
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }, 120);
}

// ---------- timers ----------
function tickTimers() {
  const now = Date.now(), mx = maxEnergy(S.lvl);
  if (S.energy >= mx) S.eTime = now;
  else {
    const n = Math.floor((now - S.eTime) / ENERGY_MS);
    if (n > 0) { S.energy = Math.min(mx, S.energy + n); S.eTime += n * ENERGY_MS; if (S.energy >= mx) S.eTime = now; }
  }
  const A = S.arena;
  if (A.attempts >= 5) A.aTime = now;
  else { const n = Math.floor((now - A.aTime) / ARENA_MS); if (n > 0) { A.attempts = Math.min(5, A.attempts + n); A.aTime += n * ARENA_MS; } }
  if (S.daily.day !== today()) S.daily = { day: today(), wins: 0, arena: 0, energy: 0, upgrades: 0, bronze: 0, claimed: {} };
}

// ---------- stats ----------
function calcStats(id, p) {
  const def = CH[id], b = ROLE[def.role], m = def.mod || {};
  const L = 1 + .09 * (p.lvl - 1), St = STAR_MULT[p.stars], G = 1 + .12 * (p.gear - 1), f = L * St * G;
  return {
    hp: Math.round(b.hp * f * (1 + (m.hpPct || 0))),
    prot: Math.round(b.prot * f * (1 + (m.protPct || 0))),
    off: Math.round(b.off * f * (1 + (m.offPct || 0))),
    armor: Math.min(60, b.armor + (p.gear - 1) * 1.6 + (p.stars - 1) * .8),
    spd: Math.round(b.spd + (m.spd || 0) + (p.stars - 1) * 2 + (p.gear - 1) * 2.5),
    crit: Math.min(.75, b.crit + (p.gear - 1) * .01),
    critDmg: 1.5,
    pot: b.pot + (p.gear - 1) * .02,
    ten: b.ten + (p.gear - 1) * .02,
  };
}
function power(id, p) {
  if (!p) return 0;
  const s = calcStats(id, p);
  const abBonus = 1 + .04 * p.ab.reduce((a, v) => a + v - 1, 0);
  return Math.round(((s.hp + s.prot) / 4 + s.off * 3 + s.spd * 4) * abBonus);
}
const owned = id => !!S.roster[id];
const gp = () => Object.keys(S.roster).reduce((a, id) => a + power(id, S.roster[id]), 0);
const charCap = () => Math.min(MAX_LVL, S.lvl + 2);
const nAbilities = id => CH[id].ab.length;

// ---------- inventory ----------
function give(rw, mult = 1) {
  for (const k in rw) {
    const v = Math.round(rw[k] * mult);
    if (k === "credits" || k === "crystals" || k === "tokens") S[k] += v;
    else if (k === "energy") S.energy += v;
    else if (k.startsWith("shard:")) addShards(k.slice(6), v);
    else S.inv[k] = (S.inv[k] || 0) + v;
  }
}
function addShards(id, n) { S.shards[id] = (S.shards[id] || 0) + n; }
function canAfford(k, n) { return (k === "credits" || k === "crystals" || k === "tokens" ? S[k] : S.inv[k] || 0) >= n; }
function spend(k, n) { if (k === "credits" || k === "crystals" || k === "tokens") S[k] -= n; else S.inv[k] -= n; }

function playerXp(n) {
  S.xp += n;
  let ups = 0;
  while (S.lvl < MAX_LVL && S.xp >= pxpNeed(S.lvl)) { S.xp -= pxpNeed(S.lvl); S.lvl++; ups++; }
  if (ups) {
    S.energy = Math.max(S.energy, maxEnergy(S.lvl));
    S.crystals += 25 * ups;
    toast(`Player level ${S.lvl}! Energy refilled, +${25 * ups} crystals.`, "gold");
  }
}
function charXp(id, n) {
  const p = S.roster[id]; if (!p) return 0;
  p.xp += n; let ups = 0;
  while (p.lvl < charCap() && p.xp >= xpNeed(p.lvl)) { p.xp -= xpNeed(p.lvl); p.lvl++; ups++; }
  if (p.lvl >= charCap()) p.xp = Math.min(p.xp, xpNeed(p.lvl));
  return ups;
}
function spendEnergy(n) { S.energy -= n; S.daily.energy += n; playerXp(n * 10); }

// ---------- upgrades ----------
function activate(id) {
  if (owned(id) || (S.shards[id] || 0) < STAR_SHARDS[1]) return false;
  S.shards[id] -= STAR_SHARDS[1]; S.roster[id] = mkProg(1); S.daily.upgrades++; return true;
}
function promote(id) {
  const p = S.roster[id]; if (!p || p.stars >= 7) return false;
  const need = STAR_SHARDS[p.stars + 1], cr = STAR_CREDITS[p.stars + 1];
  if ((S.shards[id] || 0) < need || S.credits < cr) return false;
  S.shards[id] -= need; S.credits -= cr; p.stars++; S.daily.upgrades++; return true;
}
function gearUp(id) {
  const p = S.roster[id]; if (!p || p.gear >= MAX_GEAR) return false;
  const c = gearCost(p.gear);
  if (!canAfford(c.item, c.n) || S.credits < c.credits) return false;
  spend(c.item, c.n); S.credits -= c.credits; p.gear++; S.daily.upgrades++; return true;
}
function abUp(id, i) {
  const p = S.roster[id]; if (!p || p.ab[i] >= MAX_AB) return false;
  const c = abCost(p.ab[i]);
  if (S.inv.mats < c.mats || S.credits < c.credits) return false;
  S.inv.mats -= c.mats; S.credits -= c.credits; p.ab[i]++; S.daily.upgrades++; return true;
}
function train(id, item) {
  const p = S.roster[id]; if (!p || !(S.inv[item] > 0) || p.lvl >= charCap()) return false;
  S.inv[item]--; const ups = charXp(id, ITEMS[item].xp); if (ups) S.daily.upgrades++; return true;
}
function autoTrain(id) {
  let used = 0;
  for (const it of ["droid1", "droid2", "droid3"]) while (S.inv[it] > 0 && S.roster[id].lvl < charCap()) { train(id, it); used++; }
  return used;
}

// ---------- packs ----------
function weightedChar(rng = R) {
  const ids = CH_IDS.filter(id => !["vader", "palpatine", "yoda"].includes(id) || rng() < .35);
  return ids[Math.floor(rng() * ids.length)];
}
function openChromium() {
  const res = [];
  for (let k = 0; k < 3; k++) {
    const id = weightedChar();
    const n = !owned(id) && !(S.shards[id] >= 10) && k === 0 ? 10 : ri(5, 12);
    addShards(id, n); res.push({ k: "shard:" + id, n });
  }
  S.credits += 500; res.push({ k: "credits", n: 500 });
  return res;
}
function openBronzium() {
  const res = [], roll = R();
  if (roll < .55) { const n = ri(4, 12) * 100; S.credits += n; res.push({ k: "credits", n }); }
  else if (roll < .8) { const it = R() < .75 ? "droid1" : "droid2", n = it === "droid1" ? ri(2, 4) : 1; give({ [it]: n }); res.push({ k: it, n }); }
  else if (roll < .9) { const n = ri(4, 10); give({ sal1: n }); res.push({ k: "sal1", n }); }
  else { const id = weightedChar(), n = ri(1, 4); addShards(id, n); res.push({ k: "shard:" + id, n }); }
  S.daily.bronze++;
  return res;
}

// ---------- arena ----------
function topTeam(n = 5) {
  return Object.keys(S.roster).sort((a, b) => power(b, S.roster[b]) - power(a, S.roster[a])).slice(0, n);
}
function progForPower(id, target) {
  let lo = 0, hi = 1, best = null;
  for (let k = 0; k < 18; k++) {
    const t = (lo + hi) / 2;
    const p = { lvl: 1 + Math.round(49 * t), stars: 1 + Math.round(6 * Math.min(1, t * 1.25)), gear: 1 + Math.round(11 * t), xp: 0 };
    const al = 1 + Math.round(4 * t); p.ab = [al, al, al];
    best = p;
    if (power(id, p) < target) lo = t; else hi = t;
  }
  return best;
}
function genOpps() {
  const r = S.arena.rank, mine = topTeam(5);
  const avg = mine.length ? mine.reduce((a, id) => a + power(id, S.roster[id]), 0) / mine.length : 1500;
  const opps = [];
  for (const f of [.04, .1, .18]) {
    const rank = Math.max(1, r - Math.max(1, Math.ceil(r * f)) - ri(0, 3));
    const mult = .82 + .62 * (1 - rank / 1500) + (f - .1) * .5;
    const ids = [...CH_IDS].sort(() => R() - .5).slice(0, 5);
    const lead = ids.find(id => CH[id].lead); if (lead) { ids.splice(ids.indexOf(lead), 1); ids.unshift(lead); }
    const team = ids.map(id => ({ id, ...progForPower(id, avg * mult * (.9 + R() * .2)) }));
    opps.push({ rank, name: pick(ARENA_NAMES1) + " " + pick(ARENA_NAMES2) + " " + ri(2, 99), team, pw: team.reduce((a, u) => a + power(u.id, u), 0) });
  }
  S.arena.opps = opps;
}
const payout = rank => ({ crystals: Math.max(20, Math.round(320 / (1 + rank / 45))), tokens: Math.max(60, Math.round(1200 / (1 + rank / 90))) });
