
// =====================================================================
//  WORLD — stage index, Terminal, Contracts names, missions, Store
// =====================================================================
// Episodes are numbered across parts (Part 2 continues at Episode 09). Stage codes follow Arknights:
// main stages 1-1…1-7, side stages S1-1.
const NODES = {}, CHAPTERS = [];
for (const ep of STORY) for (const ch of ep.chapters) {
  const ci = CHAPTERS.length; CHAPTERS.push(ch);
  let mc = 0, sc = 0;
  ch.no = String(ci + 1).padStart(2, "0"); ch.part = ep;
  ch.nodes.forEach((nd, i) => { nd.legacy = nd.id; nd.id = nd.type === "side" ? `S${ci + 1}-${++sc}` : `${ci + 1}-${++mc}`; nd.ch = ch; nd.ep = ep; nd.idx = i; NODES[nd.id] = nd; });
}
const partOpen = ep => STORY.indexOf(ep) === 0 || chapterCleared(STORY[STORY.indexOf(ep) - 1].chapters.slice(-1)[0]);
const nodeCost = nd => nd.type === "story" || nd.type === "chest" ? 0 : 6 + Math.floor(nd.lv / 10) * 2;
const nodeTurnGoal = nd => (nd.waves ? nd.waves.length : 1) * 9 + (nd.type === "boss" ? 4 : 0);

// =====================================================================
//  HUNTS · TOWER · ARENA · MISSIONS · SHOPS
// =====================================================================
const HUNTS = [
  { id: "slug", code: "SN", n: "Slug Nest", sub: "Originium Slug colony beneath Chernobog", env: "ruins", sets: ["Swift", "Energy", "Focus", "Will", "Endure"],
    waves: lv => [W("slug", "acidslug", "slug"), W("queenslug", "acidslug", "slug")] },
  { id: "crypt", code: "SC", n: "Sarkaz Catacombs", sub: "Mercenary warband in the old catacombs", env: "temple", sets: ["Fatal", "Blade", "Rage", "Violent", "Revenge"],
    waves: lv => [W("sarkaz", "caster", "sarkaz"), W("centurion", "sarkaz", "caster")] },
  { id: "frost", code: "FW", n: "Frozen Wastes", sub: "The Icecleaver's hunting ground", env: "snow", sets: ["Guard", "Shield", "Nemesis", "Despair", "Endure"],
    waves: lv => [W("wraith", "shield", "wraith"), W("yeti", "wraith", "shield")] },
];
const HUNT_LV = [10, 22, 34, 46, 58, 70];
const HUNT_COST = [8, 10, 12, 14, 16, 18];
const HUNT_RAR = [[.5, .4, .1, 0, 0], [.2, .45, .3, .05, 0], [0, .35, .45, .17, .03], [0, .15, .45, .32, .08], [0, 0, .35, .45, .2], [0, 0, .15, .5, .35]];

const TOWER_FLOORS = 30;
function towerFloor(f) {
  const lv = 4 + f * 3, rng = seeded(hash("tower" + f));
  const reunion = ["soldier", "crossbow", "caster", "thrower", "shield", "hound", "sarkaz", "wraith"];
  const bosses = ["crownslayer", "skullshatterer", "mephisto", "faust", "centurion", "frostnova"];
  const pickE = () => reunion[Math.floor(rng() * reunion.length)];
  let waves;
  if (f % 5 === 0) waves = [W(pickE(), pickE(), pickE()), W(bosses[(f / 5 - 1) % bosses.length], pickE(), pickE())];
  else if (f >= 8 && f % 2 === 0) {
    const pool = OP_KEYS.filter(k => OPS[k].rar >= 4);
    waves = [[0, 1, 2, 3].map(() => ({ op: pool[Math.floor(rng() * pool.length)] }))];
  } else waves = [W(pickE(), pickE(), pickE()), ...(f > 3 ? [W(pickE(), pickE(), pickE(), pickE())] : [])];
  const reward = f % 5 === 0 ? { orundum: 200, permit: 1, chip: 2 } : { orundum: 50, lmd: 1500 + f * 300, ["rec" + Math.min(4, 1 + Math.floor(f / 8))]: 3 };
  return { id: "T" + f, f, lv, waves, reward, env: ["city", "arena", "temple", "snow", "ruins", "slums"][Math.floor((f - 1) / 5)] };
}

const ARENA_N1 = ["Rhodes", "Lungmen", "Kazimierz", "Siracusa", "Ursus", "Laterano", "Iberia", "Columbia", "Kjerag", "Victoria", "Yan", "Higashi"];
const ARENA_N2 = ["Guard", "Courier", "Knight", "Hunter", "Ranger", "Doctor", "Blade", "Wolf", "Owl", "Lancer", "Sage", "Vanguard"];

const DAILIES = [
  { id: "clear", n: "Clear 3 operations", goal: 3, reward: { orundum: 60, lmd: 2000, credit: 80 } },
  { id: "sanity", n: "Spend 60 Sanity", goal: 60, reward: { orundum: 60, credit: 40 } },
  { id: "hh", n: "Headhunt once", goal: 1, reward: { orundum: 80 } },
  { id: "upgrade", n: "Upgrade operators 3 times", goal: 3, reward: { rec2: 3 } },
  { id: "arena", n: "Win a Contract battle (either mode)", goal: 1, reward: { tokens: 30, orundum: 40 } },
  { id: "rune", n: "Upgrade a module", goal: 1, reward: { lmd: 3000, credit: 40 } },
];
const DAILY_ALL = { permit: 1 };
const ACHIEVEMENTS = [
  ...CHAPTERS.map((c, i) => ({ id: "ch" + (i + 1), n: `Clear Episode ${c.no}: ${c.title}`, test: () => chapterCleared(c),
    reward: c === c.part.chapters.slice(-1)[0] || i === 4 ? { orundum: 600, permit: 3 } : { orundum: 300 + Math.min(300, i * 25) } })),
  { id: "ops10", n: "Recruit 10 operators", test: () => Object.keys(S.ops).length >= 10, reward: { orundum: 200 } },
  { id: "ops25", n: "Recruit 25 operators", test: () => Object.keys(S.ops).length >= 25, reward: { orundum: 400, permit: 1 } },
  { id: "ops50", n: "Recruit 50 operators", test: () => Object.keys(S.ops).length >= 50, reward: { orundum: 800, permit: 2 } },
  { id: "e1", n: "Promote an operator to Elite 1", test: () => Object.values(S.ops).some(p => p.elite >= 1), reward: { orundum: 150 } },
  { id: "e2", n: "Promote an operator to Elite 2", test: () => Object.values(S.ops).some(p => p.elite >= 2), reward: { orundum: 400, permit: 1 } },
  { id: "six", n: "Recruit a 6★ operator", test: () => Object.keys(S.ops).some(k => OPS[k].rar === 6), reward: { orundum: 300 } },
  { id: "tw10", n: "Clear Stationary Security Service floor 10", test: () => S.tower >= 10, reward: { orundum: 300, permit: 1 } },
  { id: "tw20", n: "Clear Stationary Security Service floor 20", test: () => S.tower >= 20, reward: { orundum: 500, permit: 2 } },
  { id: "tw30", n: "Clear all 30 Stationary Security Service floors", test: () => S.tower >= 30, reward: { orundum: 1000, permit: 3 } },
  { id: "ccGold", n: "Reach Gold in Contingency Contract", test: () => S.ladder.best >= 1600, reward: { orundum: 300, tokens: 200 } },
  { id: "ccLegend", n: "Reach Legend in Contingency Contract", test: () => S.ladder.best >= 3100, reward: { orundum: 1500, permit: 5 } },
  { id: "rtaGold", n: "Reach Gold in Real-Time Contract", test: () => S.rta.best >= 1600, reward: { orundum: 300, tokens: 200 } },
  { id: "rtaLegend", n: "Reach Legend in Real-Time Contract", test: () => S.rta.best >= 3100, reward: { orundum: 1500, permit: 5 } },
];
const SHOP = {
  credit: [
    { id: "r_lmd", n: "LMD ×12,000", cost: 200, give: { lmd: 12000 } },
    { id: "r_rec", n: "Strategic Battle Record ×3", cost: 240, give: { rec4: 3 } },
    { id: "r_summ", n: "Skill Summary ×3", cost: 160, give: { summ: 3 } },
    { id: "r_chip", n: "Chip Pack", cost: 300, give: { chip: 1 } },
  ],
  cert: [
    { id: "c_permit", n: "Headhunting Permit", cost: 25, give: { permit: 1 } },
    { id: "c_summ", n: "Skill Summary ×3", cost: 8, give: { summ: 3 } },
    { id: "c_chip", n: "Chip Pack ×2", cost: 12, give: { chip: 2 } },
    { id: "c_rune", n: "T4 Module", cost: 20, give: { rune: 4 } },
  ],
  tokens: [
    { id: "t_permit", n: "Headhunting Permit", cost: 240, give: { permit: 1 } },
    { id: "t_chip", n: "Chip Pack ×3", cost: 90, give: { chip: 3 } },
    { id: "t_summ", n: "Skill Summary ×4", cost: 60, give: { summ: 4 } },
    { id: "t_rune", n: "T5 Module", cost: 220, give: { rune: 5 } },
  ],
  prime: [
    { id: "p_san", n: "Restore Sanity", d: "Refill Sanity to max", cost: 1, give: { sanityMax: 1 } },
    { id: "p_oru", n: "Exchange for Orundum", d: "1 Originite Prime → 180 Orundum", cost: 1, give: { orundum: 180 } },
  ],
};
const STARTERS = ["amiya", "fang", "kroos", "melantha", "ansel"];
const BANNER_6 = ["exusiai", "silverash", "surtr", "saria", "ifrit", "skadi", "nightingale", "angelina", "ling", "mostima", "eyjafjalla", "hoshiguma", "mudrock", "suzuran", "mountain", "bagpipe", "ash", "thorns", "weedy", "ceobe", "siege"];
