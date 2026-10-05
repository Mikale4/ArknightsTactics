
// =====================================================================
//  CONTRACT LADDERS
//  Contingency Contract: attack other Doctors' defense squads (played by the AI); your own
//  defense gets attacked while you're away. Real-Time Contract: matchmaking, a pick/ban draft
//  and a timed live battle. Both run against a simulated population of Doctors whose accounts,
//  teams and battle AI get stronger the higher they rank.
// =====================================================================
const TIERS = [
  { n: "Bronze", min: 0, c: "#c8875a" }, { n: "Silver", min: 1300, c: "#c9d1de" }, { n: "Gold", min: 1600, c: "#f2c14e" },
  { n: "Platinum", min: 1900, c: "#5fd4ff" }, { n: "Diamond", min: 2200, c: "#8fb4ff" }, { n: "Master", min: 2500, c: "#c08bff" },
  { n: "Grandmaster", min: 2800, c: "#ff6a8a" }, { n: "Legend", min: 3100, c: "#ff9a3c" },
];
const tierIdx = p => { let i = 0; while (i < TIERS.length - 1 && p >= TIERS[i + 1].min) i++; return i; };
const tierOf = p => TIERS[tierIdx(p)];
const TIER_REWARD = [
  { tokens: 100, orundum: 50 }, { tokens: 150, orundum: 100 }, { tokens: 220, orundum: 150 }, { tokens: 300, orundum: 220 },
  { tokens: 400, orundum: 300, permit: 1 }, { tokens: 500, orundum: 400, permit: 1 }, { tokens: 650, orundum: 500, permit: 2 }, { tokens: 800, orundum: 650, permit: 3 },
];
const LADDER_N = 1500, LADDER_START = 1000, TICKETS_MAX = 10, TICKET_MS = 30 * 60000, REFRESH_MS = 3 * 60000;
const WEEK_MS = 7 * 864e5, WEEK0 = Date.UTC(2024, 0, 1); // weeks start Monday 00:00 UTC
const weekId = () => Math.floor((Date.now() - WEEK0) / WEEK_MS);
// account strength q (0..1) <-> ladder rating: most Doctors sit low, a few maxed accounts at the very top
const qRating = q => 900 + 2450 * Math.pow(q, 2.3);
const ratingQ = r => clamp(Math.pow(clamp((r - 900) / 2450, 0, 1), 1 / 2.3), .02, 1);
const DOC_W1 = ["Rhodes", "Lungmen", "Kazimierz", "Siracusa", "Ursus", "Laterano", "Iberia", "Columbia", "Kjerag", "Victoria", "Yan", "Higashi", "Sargon", "Leithanien",
  "Originium", "Babel", "Penguin", "Ægir", "Minos", "Bolívar", "Rim", "Sami", "Durin", "Liberi", "Sankta", "Lupo", "Vulpo", "Feline", "Cautus", "Perro", "Draco", "Zalak"];
const DOC_W2 = ["Doctor", "Knight", "Hunter", "Sage", "Owl", "Wolf", "Courier", "Ranger", "Lancer", "Blade", "Fox", "Cat", "Main", "Enjoyer", "Pilot", "Tactician",
  "Medic", "Vanguard", "Sniper", "Caster", "Guard", "Rookie", "Ace", "Veteran", "Dreamer", "Captain", "Scholar", "Wanderer"];

// ---------- operator value for team building (cached) ----------
const META = {};
function metaScore(k) {
  if (META[k] != null) return META[k];
  const op = OPS[k], top = progForLV(k, 120);
  const st = opStats(k, top, op.runes).st;
  let v = st.hp / 6 + st.atk * 2.4 + st.def * 1.1 + st.spd * 9;
  v *= 1 + .05 * op.skills.filter(s => !s.passive).length;
  if (op.cls === "Medic" || op.branch === "bard" || op.branch === "blessing") v *= 1.15;
  return META[k] = v;
}
const isMedicK = k => OPS[k].cls === "Medic" || OPS[k].branch === "bard" || OPS[k].branch === "blessing";
const isAoeK = k => { const b = OPS[k].basic; return !!(b.aoe || b.n > 1); };
function leaderScore(k, ids) {
  const L = OPS[k].leader; if (!L) return 0;
  const n = L.scope === "All" ? ids.length : ids.filter(x => OPS[x].el === L.element).length;
  return n * L.amount * ({ ATK: 1.2, SPD: 1.3, HP: .8, DEF: .7, CR: .8, CD: .7 }[L.stat] || .3);
}
const withLeader = ids => { const b = ids.slice().sort((a, c) => leaderScore(c, ids) - leaderScore(a, ids))[0]; return [b, ...ids.filter(x => x !== b)]; };
// pick n operators from `pool` the way a Doctor of strength q would: strong players build balanced meta squads
function buildSquad(pool, n, q, rng, avoid = []) {
  const left = pool.filter(k => !avoid.includes(k));
  const out = [];
  const val = k => metaScore(k) * (.75 + .5 * rng()) * (1 - q * .2 + q * .2);
  while (out.length < n && left.length) {
    let cand;
    if (rng() > .25 + q * .75) cand = left[Math.floor(rng() * left.length)];
    else {
      const needHeal = !out.some(isMedicK) && q > .2, needTank = !out.some(k => OPS[k].cls === "Defender") && q > .5, needAoe = !out.some(isAoeK) && q > .4;
      const sc = k => val(k) * (needHeal && isMedicK(k) ? 1.6 : 1) * (needTank && OPS[k].cls === "Defender" ? 1.3 : 1) * (needAoe && isAoeK(k) ? 1.2 : 1) * (isMedicK(k) && out.some(isMedicK) ? .5 : 1);
      cand = left.slice().sort((a, b) => sc(b) - sc(a))[0];
    }
    out.push(cand); left.splice(left.indexOf(cand), 1);
  }
  return n === 4 ? withLeader(out) : out;
}

// ---------- a simulated Doctor ----------
// deterministic from the ladder seed and the Doctor's index; q decides roster size, rarity, investment and AI
const DOC_CACHE = new Map();
// a Doctor's name (the first draws of their account's dice, so it matches npcDoctor)
const docName = rng => (rng() < .25 ? "Dr." : "") + DOC_W1[Math.floor(rng() * DOC_W1.length)] + (rng() < .6 ? DOC_W2[Math.floor(rng() * DOC_W2.length)] : "") + (rng() < .55 ? Math.floor(rng() * 99 + 1) : "");
function npcDoctor(seed, i, q) {
  const key = seed + ":" + i;
  if (DOC_CACHE.has(key)) return DOC_CACHE.get(key);
  const rng = seeded(hash(key));
  const doc = { i, name: docName(rng), q, ...npcAccount(rng, q) };
  DOC_CACHE.set(key, doc);
  if (DOC_CACHE.size > 600) DOC_CACHE.delete(DOC_CACHE.keys().next().value);
  return doc;
}
// the meta: the operators top Doctors all end up running
let META_POOL = null;
const metaPool = () => META_POOL || (META_POOL = OP_KEYS.filter(k => OPS[k].rar >= 5).sort((a, b) => metaScore(b) - metaScore(a)).slice(0, 36));
function npcAccount(rng, q, size) {
  const wR = { 3: Math.max(.04, 1 - q * 1.2), 4: Math.max(.15, 1 - q * .6), 5: .5 + q, 6: .1 + 3 * q * q };
  const pool = OP_KEYS.filter(k => OPS[k].rar >= 3), roster = [];
  const want = size || Math.round(10 + q * 30);
  for (let t = 0; t < want * 6 && roster.length < want; t++) {
    const k = pool[Math.floor(rng() * pool.length)];
    if (!roster.includes(k) && rng() < wR[OPS[k].rar] / 3.2) roster.push(k);
  }
  // high-ranked accounts own most of the meta
  if (q > .7) for (const k of metaPool()) if (!roster.includes(k) && rng() < (q - .7) / .3) roster.push(k);
  // investment climbs steeply with rank: Bronze is full of new accounts, the top is maxed out
  const L = clamp(Math.round(5 + 115 * Math.pow(q, 1.1) + (rng() - .5) * 12), 3, 120);
  const prog = {}, boost = 1 + .42 * q * q;
  for (const k of roster) {
    const p = progForLV(k, clamp(q > .9 ? 120 : L + Math.round((rng() - .6) * 12), 3, 120));
    p.pot = q > .95 ? 6 : Math.min(6, 1 + Math.floor(5 * q * q * (.6 + .6 * rng())));
    prog[k] = p;
  }
  const ai = q < .35 ? "balanced" : q < .75 ? "aggressive" : "expert";
  const team = buildSquad(roster, 4, q, rng);
  return { roster, prog, boost, sets: q > .25, ai, team };
}
// battle spec for one of a Doctor's operators
const npcSpec = (doc, k) => ({ op: k, prog: doc.prog[k], boost: doc.boost, sets: doc.sets ? OPS[k].runes : [] });
const npcPower = doc => doc.team.reduce((a, k) => a + Math.round(power(k, doc.prog[k]) * doc.boost), 0);

// ---------- Contingency Contract ladder ----------
function ladderInit() {
  const seed = Math.floor(Math.random() * 1e9), rng = seeded(seed);
  const pop = [];
  for (let i = 0; i < LADDER_N; i++) { const q = (i + rng()) / LADDER_N; pop.push(Math.round(qRating(q) + (rng() - .5) * 160)); }
  return { seed, pts: LADDER_START, best: LADDER_START, tickets: TICKETS_MAX, tTime: Date.now(), popT: Date.now(), defT: Date.now(), week: weekId(),
    pop, opps: null, oppT: 0, log: [], seen: 0, wins: 0, losses: 0, rev: {} };
}
const ladderQ = i => (i + .5) / LADDER_N;
const ladderDoc = i => npcDoctor(S.ladder.seed, i, ladderQ(i));
const ladderRank = () => 1 + S.ladder.pop.filter(p => p > S.ladder.pts).length;
const eloK = p => p < 1600 ? 48 : p < 2500 ? 36 : 28;
const winChance = (me, them) => 1 / (1 + Math.pow(10, (them - me) / 400));
function eloDelta(me, them, win, k) {
  const e = winChance(me, them);
  if (win) return Math.max(4, Math.round(k * (1 - e)));
  return -Math.max(2, Math.round(k * e * (me < TIERS[1].min ? .5 : 1)));
}
function ladderOpps(force) {
  const L = S.ladder, P = L.pts;
  if (L.opps && !force) return L.opps;
  const bands = [[P - 140, P - 10], [P - 10, P + 110], [P + 110, P + 280]], used = new Set();
  L.opps = bands.map(([lo, hi]) => {
    for (let wide = 0; wide < 6; wide++) {
      const c = L.pop.map((p, i) => [p, i]).filter(([p, i]) => p >= lo - wide * 80 && p <= hi + wide * 80 && !used.has(i));
      if (c.length) { const [, i] = c[Math.floor(Math.random() * c.length)]; used.add(i); return i; }
    }
    return Math.floor(Math.random() * LADDER_N);
  });
  L.oppT = Date.now();
  return L.opps;
}
// the population keeps playing while you're away: ratings drift toward each Doctor's true strength
function ladderDrift(L, hours) {
  if (hours <= 0) return;
  const pull = Math.min(1, .04 * hours), sd = 14 * Math.sqrt(Math.min(hours, 48)), rng = seeded(hash(L.seed + ":" + Math.floor(Date.now() / 60000)));
  for (let i = 0; i < L.pop.length; i++) {
    const r = qRating(ladderQ(i));
    L.pop[i] = Math.max(0, Math.round(L.pop[i] + (r - L.pop[i]) * pull + (rng() + rng() - 1) * sd));
  }
}
// other Doctors attack your defense squad while you're away (higher tiers get attacked more often)
function ladderDefense(L, hours) {
  const def = (S.team.defense || []).filter(owned);
  if (!def.length || hours <= 0) return 0;
  const rate = .4 + .45 * tierIdx(L.pts);
  let n = Math.min(12, Math.floor(hours * rate + Math.random()));
  let done = 0;
  while (n-- > 0) {
    const band = L.pop.map((p, i) => [p, i]).filter(([p]) => Math.abs(p - L.pts) < 160);
    if (!band.length) break;
    const [ap, i] = band[Math.floor(Math.random() * band.length)], doc = ladderDoc(i);
    const B = makeBattle({ allies: doc.team.map(k => npcSpec(doc, k)), waves: [def.map(k => ({ op: k, prog: S.ops[k] }))], auto: true, aiStyle: "aggressive", enemyStyle: "aggressive" });
    let g = 0; while (!B.over && g++ < 3000) { const r = B.step(); if (r === "input") B.autoAct(); B.ev.length = 0; }
    const held = !(B.result && B.result.win);
    const d = Math.round(eloDelta(L.pts, ap, held, eloK(L.pts)) * .6);
    L.pts = Math.max(0, L.pts + d); L.pop[i] = Math.max(0, L.pop[i] - d);
    L.log.unshift({ t: Date.now(), i, held, d, team: doc.team.slice() });
    done++;
  }
  L.log = L.log.slice(0, 30);
  return done;
}
function weeklyPay(L, label) {
  const w = weekId();
  if (L.week === w) return null;
  const tier = tierIdx(L.pts);
  L.week = w;
  return { label, tier, rewards: TIER_REWARD[tier] };
}
// called from tickTimers: tickets, population drift, defense battles, weekly rewards
function ladderTick(now) {
  const L = S.ladder;
  if (L.tickets >= TICKETS_MAX) L.tTime = now;
  else { const n = Math.floor((now - L.tTime) / TICKET_MS); if (n > 0) { L.tickets = Math.min(TICKETS_MAX, L.tickets + n); L.tTime += n * TICKET_MS; if (L.tickets >= TICKETS_MAX) L.tTime = now; } }
  const h = (now - L.popT) / 3600000;
  if (h >= .25) { ladderDrift(L, h); L.popT = now; }
  const dh = (now - L.defT) / 3600000;
  if (dh >= .5 && !BT.on) { if (ladderDefense(L, dh)) L.best = Math.max(L.best, L.pts); L.defT = now; }
  const pays = [weeklyPay(L, "Contingency Contract"), weeklyPay(S.rta, "Real-Time Contract")].filter(Boolean);
  for (const p of pays) sendMail({ kind: "contract", title: `Weekly rewards · ${p.label}`, body: `Last week you finished in ${TIERS[p.tier].n}. Here are your weekly rewards, Doctor.`, rewards: p.rewards });
}
function ladderResult(i, win) {
  const L = S.ladder, them = L.pop[i];
  const d = eloDelta(L.pts, them, win, eloK(L.pts)) + (win && L.rev[i] ? 4 : 0);
  L.pts = Math.max(0, L.pts + d); L.pop[i] = Math.max(0, them - Math.round(d * .5));
  L.best = Math.max(L.best, L.pts);
  if (win) L.wins++; else L.losses++;
  delete L.rev[i];
  return d;
}

// ---------- Real-Time Contract ----------
function rtaInit() { return { pts: LADDER_START, best: LADDER_START, games: 0, wins: 0, losses: 0, streak: 0, place: 5, log: [], week: weekId() }; }
// matchmaking: an opponent whose account strength matches your rating, with a little spread
// a Doctor from the ladder population whose strength matches this rating (online ones queue first)
function rtaOpponent() {
  const r = S.rta.pts + (Math.random() - .45) * 120, q = ratingQ(r);
  const near = [];
  for (let i = 0; i < LADDER_N; i++) if (Math.abs(ladderQ(i) - q) < .02 + Math.random() * .02) near.push(i);
  const live = typeof isOnline === "function" ? near.filter(i => isOnline(i)) : [];
  const i = (live.length ? live : near.length ? near : [Math.round(q * (LADDER_N - 1))])[Math.floor(Math.random() * (live.length || near.length || 1))];
  const doc = ladderDoc(i);
  return { ...doc, i, pts: Math.round(clamp(r, 0, 3400)) };
}
// snake draft for squads of five (then one ban each, leaving 4 v 4)
const DRAFT_ORDER = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];
function draftValue(k, prog, mine, theirs, q) {
  let v = metaScore(k) * (power(k, prog) / Math.max(1, power(k, progForLV(k, 120))));
  const needHeal = !mine.some(isMedicK), needTank = !mine.some(x => OPS[x].cls === "Defender"), needAoe = !mine.some(isAoeK);
  if (isMedicK(k)) v *= needHeal ? 1.5 : .45;
  if (OPS[k].cls === "Defender") v *= needTank && mine.length >= 2 ? 1.25 : .85;
  if (isAoeK(k) && needAoe) v *= 1.15;
  // counter-picks: Arts against tanky picks, physical against Arts-heavy squads
  if (q > .5) {
    const tanks = theirs.filter(x => OPS[x].cls === "Defender").length, casters = theirs.filter(x => ARTS_CLASSES.has(OPS[x].cls)).length;
    if (tanks && OPS[k].basic.dmg === "arts") v *= 1 + .08 * tanks;
    if (casters >= 2 && OPS[k].stats.ares >= 15) v *= 1.1;
  }
  return v;
}
function draftPick(avail, progOf, mine, theirs, q, rng = Math.random) {
  const sc = k => draftValue(k, progOf(k), mine, theirs, q) * (1 + (rng() - .5) * (1 - q) * .9);
  return avail.slice().sort((a, b) => sc(b) - sc(a))[0];
}
// ban the opponent's biggest threat (weaker Doctors ban less precisely)
function draftBan(theirs, progOf, q, rng = Math.random) {
  const sc = k => metaScore(k) * (power(k, progOf(k)) / Math.max(1, power(k, progForLV(k, 120)))) * (isMedicK(k) ? 1.2 : 1) * (1 + (rng() - .5) * (1 - q));
  return theirs.slice().sort((a, b) => sc(b) - sc(a))[0];
}
function rtaResult(opp, win) {
  const R = S.rta, k = R.place > 0 ? 80 : eloK(R.pts);
  let d = eloDelta(R.pts, opp.pts, win, k);
  if (win) { R.streak = Math.max(0, R.streak) + 1; if (R.streak >= 3) d += 5; R.wins++; } else { R.streak = Math.min(0, R.streak) - 1; R.losses++; }
  R.pts = Math.max(0, R.pts + d); R.best = Math.max(R.best, R.pts); R.games++; if (R.place > 0) R.place--;
  R.log.unshift({ t: Date.now(), name: opp.name, pts: opp.pts, win, d });
  R.log = R.log.slice(0, 20);
  return d;
}
