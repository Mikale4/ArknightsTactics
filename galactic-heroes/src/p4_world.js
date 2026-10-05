
// =====================================================================
//  CAMPAIGN + ECONOMY
// =====================================================================
const MAX_LVL = 50, MAX_GEAR = 12, MAX_AB = 5;
const STAR_SHARDS = [0, 10, 15, 25, 30, 65, 85, 100];          // shards to reach star N (1 = activate)
const STAR_CREDITS = [0, 0, 100, 500, 1500, 3000, 6500, 10000];
const STAR_MULT = [0, 1, 1.12, 1.25, 1.4, 1.57, 1.76, 2.0];
const GEAR_COLOR = g => g >= 12 ? "var(--g5)" : g >= 7 ? "var(--g4)" : g >= 4 ? "var(--g3)" : g >= 2 ? "var(--g2)" : "var(--g1)";
const gearCost = g => ({ item: g < 4 ? "sal1" : g < 8 ? "sal2" : "sal3", n: [0, 8, 12, 16, 14, 18, 22, 26, 20, 24, 28, 32][g], credits: 120 * g * g });
const abCost = l => ({ mats: [0, 4, 8, 16, 28][l], credits: 250 * l * l });
const xpNeed = l => 50 * l + 8 * l * l;
const pxpNeed = l => 100 + 60 * l;
const maxEnergy = lvl => 110 + lvl * 2;
const ENERGY_MS = 30000;
const BRONZE_MS = 15 * 60000;
const ARENA_MS = 10 * 60000;
const PAYOUT_MS = 6 * 3600000;

const CAMPAIGN = {
  light: {
    n: "Light Side Battles", side: "light", foe: "dark",
    chapters: [
      { n: "Dust of Tatooine", pool: ["trooper", "b1", "trooper", "jango"], boss: "jango", shards: ["r2", "obiwan", "r2", "obiwan", "poe"] },
      { n: "Mos Eisley Crossfire", pool: ["trooper", "b1", "boba", "tarkin"], boss: "boba", shards: ["poe", "rex", "poe", "rex", "ahsoka"] },
      { n: "The Battle Station", pool: ["trooper", "tarkin", "grievous", "b1", "dooku"], boss: "grievous", shards: ["ahsoka", "rey", "ahsoka", "rey", "mace"] },
      { n: "Echo Base Evacuation", pool: ["trooper", "vader", "boba", "tarkin", "maul"], boss: "vader", shards: ["mace", "obiwan", "mace", "rex", "yoda"] },
      { n: "Shadows Over the Clouds", pool: ["vader", "boba", "kylo", "phasma", "dooku", "maul"], boss: "kylo", shards: ["yoda", "rey", "ahsoka", "poe", "yoda"] },
      { n: "The Emperor's Throne", pool: ["palpatine", "vader", "kylo", "phasma", "grievous", "trooper"], boss: "palpatine", shards: ["mace", "yoda", "r2", "rey", "yoda"] },
    ],
  },
  dark: {
    n: "Dark Side Battles", side: "dark", foe: "light",
    chapters: [
      { n: "Droid Foundry", pool: ["luke", "leia", "han", "chewie"], boss: "han", shards: ["tarkin", "boba", "tarkin", "boba", "maul"] },
      { n: "Clone Wars Front", pool: ["rex", "r2", "obiwan", "chewie"], boss: "obiwan", shards: ["maul", "dooku", "maul", "dooku", "grievous"] },
      { n: "March on the Temple", pool: ["ahsoka", "rex", "obiwan", "mace"], boss: "ahsoka", shards: ["grievous", "phasma", "grievous", "phasma", "kylo"] },
      { n: "Hunt for the Rebels", pool: ["poe", "rey", "leia", "han", "r2"], boss: "rey", shards: ["kylo", "tarkin", "boba", "dooku", "palpatine"] },
      { n: "Siege of the Jedi", pool: ["mace", "ahsoka", "luke", "rey", "obiwan"], boss: "mace", shards: ["palpatine", "kylo", "maul", "grievous", "vader"] },
      { n: "Fall of the Order", pool: ["yoda", "luke", "mace", "rey", "obiwan"], boss: "yoda", shards: ["vader", "palpatine", "phasma", "kylo", "vader"] },
    ],
  },
};
const NODE_LETTERS = ["A", "B", "C", "D", "E"];
const nodeKey = (c, n) => c + 1 + "-" + NODE_LETTERS[n];
function nodeInfo(table, c, n) {
  const T = CAMPAIGN[table], ch = T.chapters[c];
  const idx = c * 5 + n, rng = seeded(hash(table + c + "-" + n + "v2"));
  const lvl = Math.min(MAX_LVL, 1 + Math.round(idx * 1.6));
  const stars = Math.min(7, 1 + Math.floor(idx / 5));
  const gear = Math.min(MAX_GEAR, 1 + Math.floor(idx / 3));
  const abl = Math.min(MAX_AB, 1 + Math.floor(idx / 7));
  const mk = (id, boss) => ({ id, lvl: boss ? Math.min(MAX_LVL, lvl + 2) : lvl, stars, gear, ab: [abl, abl, abl], boss: !!boss });
  const pickPool = () => ch.pool[Math.floor(rng() * ch.pool.length)];
  const waveSizes = [[3], [4], [3, 4], [4, 4], [4, 4]][n];
  const waves = waveSizes.map((size, w) => {
    const last = w === waveSizes.length - 1;
    const list = [];
    if (n === 4 && last) list.push(mk(ch.boss, true));
    while (list.length < size) list.push(mk(pickPool()));
    return list;
  });
  return {
    key: nodeKey(c, n), table, c, n, idx, boss: n === 4, waves,
    energy: 6 + Math.floor((c + 1) / 2) * 2,
    shard: ch.shards[n], name: (n === 4 ? "Boss: " : "") + ch.n,
  };
}

const ARENA_NAMES1 = ["Kessel", "Rogue", "Ghost", "Nova", "Kyber", "Holo", "Rancor", "Bantha", "Gundark", "Krayt", "Ewok", "Jawa", "Tusken", "Dagobah", "Endor", "Bespin", "Hutt", "Mynock", "Sarlacc", "Corellian"];
const ARENA_NAMES2 = ["Runner", "Pilot", "Knight", "Lord", "Hunter", "Raider", "Ace", "Smuggler", "Sentinel", "Shadow", "Scoundrel", "Admiral", "Padawan", "Marauder", "Slicer"];

const ARENA_STORE = [
  { id: "vader", type: "shard", n: 5, cost: 450 },
  { id: "palpatine", type: "shard", n: 5, cost: 450 },
  { id: "yoda", type: "shard", n: 5, cost: 450 },
  { id: "kylo", type: "shard", n: 5, cost: 350 },
  { id: "mace", type: "shard", n: 5, cost: 350 },
  { id: "sal3", type: "item", n: 5, cost: 300 },
  { id: "mats", type: "item", n: 6, cost: 200 },
  { id: "droid2", type: "item", n: 3, cost: 150 },
];

const DAILIES = [
  { id: "wins", n: "Win 5 campaign battles", goal: 5, reward: { crystals: 50 } },
  { id: "arena", n: "Win 2 Squad Arena battles", goal: 2, reward: { crystals: 40, tokens: 50 } },
  { id: "energy", n: "Spend 60 energy", goal: 60, reward: { crystals: 30, credits: 1000 } },
  { id: "upgrades", n: "Upgrade characters 3 times", goal: 3, reward: { crystals: 20, mats: 3 } },
  { id: "bronze", n: "Open a Bronzium Pack", goal: 1, reward: { droid2: 1 } },
];
const DAILY_ALL = { crystals: 100 };

const START_ROSTER = {
  luke: { stars: 2 }, leia: { stars: 1 }, han: { stars: 1 }, chewie: { stars: 1 },
  trooper: { stars: 2 }, b1: { stars: 1 }, jango: { stars: 1 },
};
