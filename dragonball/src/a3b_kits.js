
// =====================================================================
//  STYLE TABLES, UNIT TABLE (characters × versions) AND OPPONENTS
// =====================================================================
const CLASS_BASE = {
  Striker:   { hp: 9800, atk: 880, def: 520, spd: 114 },
  Blaster:   { hp: 9200, atk: 900, def: 480, spd: 110 },
  Defender:  { hp: 11400, atk: 720, def: 660, spd: 104 },
  Tactician: { hp: 9600, atk: 790, def: 560, spd: 116 },
};
const CLASS_LEADER = {
  Striker: { stat: "ATK", amount: .2, scope: "Element" }, Blaster: { stat: "ATK", amount: .2, scope: "Element" },
  Defender: { stat: "HP", amount: .2, scope: "All" }, Tactician: { stat: "SPD", amount: .1, scope: "All" },
};
const RAR_MULT = { 1: .7, 2: .76, 3: .84, 4: .92, 5: 1, 6: 1.06 };

// ---------- the basic commands every fighter has ----------
const BASIC = {
  rush: { id: "rush", name: "Rush", kind: "melee", ki: 6, mult: 1.0, hits: 3, basic: 1 },
  blast: { id: "blast", name: "Ki Blast", kind: "ki", ki: 10, mult: .9, hits: 2, basic: 1 },
  charge: { id: "charge", name: "Power Up", kind: "charge", ki: 0, gain: 45, basic: 1 },
  in: { id: "in", name: "Close In", kind: "move", to: "near", ki: 0, basic: 1 },
  out: { id: "out", name: "Back Off", kind: "move", to: "far", ki: 0, basic: 1 },
  tag: { id: "tag", name: "Switch", kind: "tag", ki: 0, basic: 1 },
};
for (const k in BASIC) BASIC[k].desc = { rush: "Dashes in for a 3-hit combo: 100% ATK in all. Hold POWER while it winds up to hit up to 30% harder. Costs 6 ki.",
  blast: "Fires 2 blasts: 90% ATK in all, a little weaker from far away. Costs 10 ki.", charge: "Gathers ki: +45 ki over a second. Getting hit cuts it short.",
  in: "Flies in to close range (where Rush needs to be).", out: "Flies back to long range: more time to see attacks coming.", tag: "Switches in the next fighter in the party. Ends this turn's commands." }[k];

// ---------- build the unit table ----------
// Every version of a character ("<char>-<version>", e.g. "goku-k" for Kaioken Goku) is a separate unit.
const OPS = {};
const OP_KEYS = [];
const FAMS = [];
let techSeq = 0;
for (const c of CHARS) for (const v of c.vers) {
  const key = c.k + "-" + v.v, style = v.style;
  const passives = (v.talents || [v.talent]).filter(Boolean).map(t => ({ ...t, text: `${t.name}: ${passiveDesc(t)}.` }));
  const techs = v.kit.map((t, i) => ({ ...t, id: "t" + i, slot: Math.min(2, i + 1), desc: skillDesc(t) }));
  techSeq += techs.length;
  const stats = { ...CLASS_BASE[style], ...(v.stats || {}) };
  const op = { key, base: c.k, fam: key, n: v.n, ver: v.ver, short: v.short || c.short || c.n, blader: c.short || c.n, bladerFull: c.n, team: v.team || c.squad, squad: c.squad, race: c.race, slug: c.k,
    rar: v.rar, cls: style, el: style, season: v.season, fig: { ...c.fig, ...(v.fig || {}) }, aura: v.aura || c.aura, kiCol: v.ki || c.ki,
    stats, techs, leader: { ...(v.leader || CLASS_LEADER[style]) }, passives, maxElite: 2, featured: true };
  if (op.leader.scope === "Element") op.leader.element = style;
  // the Fighters screen lists three technique levels: basic attacks, the first technique, the rest
  op.skills = [{ slot: 1, name: "Rush & Ki Blast", desc: `${BASIC.rush.desc} ${BASIC.blast.desc}` },
    ...techs.slice(0, 1).map(t => ({ slot: 2, name: t.name, desc: t.desc, kind: t.kind })),
    ...(techs.length > 1 ? [{ slot: 3, name: techs.slice(1).map(t => t.name).join(" & "), desc: techs.slice(1).map(t => `${t.name}: ${t.desc}`).join(" "), kind: techs[1].kind }] : [])];
  OPS[key] = op; OP_KEYS.push(key); FAMS.push(key);
}
const homeKey = k => k;
const variantsOf = base => OP_KEYS.filter(k => OPS[k].base === base);
const elementsOf = fam => [fam];
const opLabel = op => op.n === op.blader ? `${op.n} (${op.ver})` : op.n;
const LEGACY = {};
// menus show the same drawn fighters as battles (rendered once, then cached)
const spriteURL = op => opArt(op.key).full;
const headURL = op => opArt(op.key).head;

// ---------- opponents ----------
// rank-and-file fighters: { n, cls, m: stat multipliers, fig, techs }
const ET = (name, kind, ki, mult, x = {}) => ({ ...tq(name, kind, ki, mult, x), id: "e" + name.length + kind, slot: 2, desc: skillDesc(tq(name, kind, ki, mult, x)) });
function shadeHex(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = c => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt); return "#" + [n >> 16 & 255, n >> 8 & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, "0")).join(""); }
const soldier = (skin, x = {}) => F({ skin, hs: "none", ...FORCE, ...x });
const ENEMY = {
  saiba: { n: "Saibaman", cls: "Striker", el: "Striker", m: { hp: .62, atk: .8, def: .6, spd: 112 }, fig: OPS["saibaman-s"].fig, aura: "#a8ff8a", kiCol: "#a8ff8a",
    techs: [ET("Acid", "ki", 25, 1.6, { fx: [fxT("DEF_DOWN", 2, .4)] })] },
  dino: { n: "Tyrannosaurus", cls: "Defender", el: "Defender", m: { hp: .9, atk: .7, def: .8, spd: 96 }, fig: F({ body: "dino", skin: "#6a8a3a", h: 1.7, eyec: "#ffd34d" }), aura: "#ffd34d", kiCol: "#ffd34d",
    techs: [ET("Chomp", "melee", 15, 1.8, { hits: 1, heavy: 1 })] },
  ogre: { n: "Ogre of HFIL", cls: "Defender", el: "Defender", m: { hp: .95, atk: .66, def: .9, spd: 98 }, fig: F({ skin: "#d84a3a", hs: "ogre", hair: "#141418", horns: "ogre", top: "#f2e6c8", under: "#f2e6c8", sleeves: "none", pants: "#3a6ad8", belt: "#f2d04e", boots: "#3a2a1a", bulk: 1.4, h: 1.15 }), aura: "#ff8a5a", kiCol: "#ff8a5a",
    techs: [ET("Club Swing", "melee", 15, 1.9, { hits: 2 })] },
  ogre2: { n: "Ogre of HFIL", cls: "Striker", el: "Striker", m: { hp: .8, atk: .8, def: .7, spd: 106 }, fig: F({ skin: "#3a6ad8", hs: "ogre", hair: "#141418", horns: "ogre", top: "#f2e6c8", under: "#f2e6c8", sleeves: "none", pants: "#d84a3a", belt: "#f2d04e", boots: "#3a2a1a", bulk: 1.2, h: 1.1 }), aura: "#8ac8ff", kiCol: "#8ac8ff",
    techs: [ET("Ogre Rush", "melee", 15, 1.7, { hits: 4 })] },
  pastsaiyan: { n: "Saiyan of the Past", cls: "Striker", el: "Striker", m: { hp: .8, atk: .86, def: .66, spd: 110 }, fig: F({ hair: "#141418", hs: "raditz", ...ARMOR, armor: "#3a3a3a", pad: "#8a6a3a", suit: "#3a2a1a", tail: "#3a2a1a", h: 1.08 }), aura: "#f2f2ff", kiCol: "#ffd34d",
    techs: [ET("Saiyan Rush", "melee", 18, 2.0, { hits: 3 }), ET("Energy Wave", "beam", 35, 2.2)] },
  arlian: { n: "Arlian Soldier", cls: "Striker", el: "Striker", m: { hp: .66, atk: .78, def: .62, spd: 108 }, fig: F({ body: "bug", skin: "#8a6ad8", eyec: "#ff3a3a", h: 1.0, armor: "#d8a83a", pad: "#d8a83a", padStyle: "none", suit: "#5a3a8a" }), aura: "#d8a8ff", kiCol: "#d8a8ff",
    techs: [ET("Spear Thrust", "melee", 15, 1.8, { hits: 2, pierce: 1 })] },
  moai: { n: "King Moai", cls: "Defender", el: "Defender", m: { hp: 1.5, atk: .8, def: .9, spd: 96 }, fig: F({ body: "bug", skin: "#6a4ab8", eyec: "#ffd34d", h: 1.25, bulk: 1.6, armor: "#f2c14e", pad: "#f2c14e", padStyle: "none", suit: "#8a2a3a", crown: "#f2c14e" }), aura: "#ffd34d", kiCol: "#ffd34d", boss: 1,
    techs: [ET("Royal Crush", "melee", 18, 2.2, { hits: 2, heavy: 1 }), ET("Insect Swarm", "ki", 30, 2.0, { hits: 5 })] },
  soldier: { n: "Frieza Soldier", cls: "Blaster", el: "Blaster", m: { hp: .64, atk: .8, def: .62, spd: 108 }, fig: soldier("#7ab0e8", { eyec: "#141418", hs: "short", hair: "#2a5a3a" }), aura: "#d8a8ff", kiCol: "#ff7ad8",
    techs: [ET("Arm Cannon", "ki", 20, 1.7, { hits: 2 })] },
  soldier2: { n: "Frieza Soldier", cls: "Striker", el: "Striker", m: { hp: .7, atk: .82, def: .62, spd: 110 }, fig: soldier("#e8a86a", { eyec: "#141418", spots: "#b07a3a" }), aura: "#d8a8ff", kiCol: "#ff7ad8",
    techs: [ET("Soldier's Rush", "melee", 15, 1.8, { hits: 3 })] },
  brute: { n: "Frieza Force Brute", cls: "Defender", el: "Defender", m: { hp: 1.0, atk: .7, def: .95, spd: 98 }, fig: soldier("#c8a8e8", { bulk: 1.55, h: 1.12, fins: "#9a7ac8", eyec: "#141418" }), aura: "#d8a8ff", kiCol: "#ff7ad8",
    techs: [ET("Body Slam", "melee", 15, 2.0, { hits: 1, heavy: 1 })] },
  scout: { n: "Frieza Scout", cls: "Tactician", el: "Tactician", m: { hp: .7, atk: .78, def: .66, spd: 114 }, fig: soldier("#5ac88a", { eyec: "#ff3a3a", eggHead: 1, slim: 1 }), aura: "#d8a8ff", kiCol: "#ff7ad8",
    techs: [ET("Scouter Snipe", "finger", 25, 1.9)] },
};
// Bosses are tougher versions of playable fighters (same techniques and Ability). `next` is the form a boss turns
// into when it's beaten: it transforms on the spot and comes back at full health.
const BOSS = {};
function bossOf(id, key, hp, atk, next) {
  BOSS[id] = [key, hp, atk];
  const op = OPS[key];
  ENEMY[id] = { key: id, enemy: true, n: opLabel(op), boss: 1, op: key, cls: op.cls, el: op.el, fig: op.fig, aura: op.aura, kiCol: op.kiCol, techs: op.techs,
    passives: op.passives, blader: op.blader, race: op.race, season: op.season, rar: op.rar, next: next || null, m: { hp, atk, def: 1.0, spd: op.stats.spd - 2 } };
}
for (const k in ENEMY) { ENEMY[k].key = k; ENEMY[k].enemy = true; ENEMY[k].passives = ENEMY[k].passives || []; }
