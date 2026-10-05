
// =====================================================================
//  CLASS TABLES, CHARACTER TABLE AND ENEMIES
//  target: enemy | aoe_enemies | ally_single | self | team | aoe_allies
// =====================================================================
const CLASS_BASE = {
  Vanguard:   { hp: 9500, atk: 720, def: 520, spd: 114 },
  Guard:      { hp: 9200, atk: 820, def: 500, spd: 112 },
  Defender:   { hp: 10500, atk: 650, def: 650, spd: 104 },
  Sniper:     { hp: 8600, atk: 900, def: 430, spd: 113 },
  Caster:     { hp: 8800, atk: 840, def: 480, spd: 108 },
  Medic:      { hp: 10200, atk: 620, def: 630, spd: 110 },
  Supporter:  { hp: 9300, atk: 700, def: 520, spd: 112 },
  Specialist: { hp: 9000, atk: 780, def: 480, spd: 117 },
};
const CLASS_RUNES = { Sniper: ["Fatal", "Blade"], Caster: ["Focus", "Rage"], Guard: ["Fatal", "Blade"], Defender: ["Guard", "Energy"],
  Medic: ["Energy", "Will"], Supporter: ["Energy", "Will"], Vanguard: ["Swift", "Energy"], Specialist: ["Swift", "Blade"] };
const CLASS_LEADER = {
  Vanguard: { stat: "SPD", amount: .15, scope: "All" }, Guard: { stat: "ATK", amount: .24, scope: "Element" },
  Defender: { stat: "HP", amount: .25, scope: "All" }, Sniper: { stat: "CR", amount: .2, scope: "Element" },
  Caster: { stat: "ATK", amount: .24, scope: "Element" }, Medic: { stat: "RES", amount: .3, scope: "All" },
  Supporter: { stat: "ACC", amount: .3, scope: "All" }, Specialist: { stat: "CD", amount: .3, scope: "Element" },
};
const RAR_MULT = { 1: .7, 2: .76, 3: .84, 4: .92, 5: 1, 6: 1.06 };
const ARC_COST = 100;

// ---------- build the character table ----------
const OPS = {};
const OP_KEYS = [];
for (const c of CHARS) {
  const skills = c.skills.map(sk => {
    const o = { ...sk };
    if (o.slot === 3) { o.arc = ARC_COST; o.cd = 0; }
    o.desc = skillDesc(o);
    return o;
  });
  const op = { key: c.k, n: c.n, slug: c.k, rar: c.rar, cls: c.cls, el: c.el, asp: 1, featured: true, fig: c.fig,
    stats: { ...CLASS_BASE[c.cls], ...(c.stats || {}) }, skills, leader: c.leader ? { ...c.leader } : null,
    passives: c.passives || [], runes: CLASS_RUNES[c.cls], maxElite: 2 };
  if (op.leader && op.leader.scope === "Element") op.leader.element = c.el;
  OPS[op.key] = op; OP_KEYS.push(op.key);
}
const opByName = n => OPS[OP_KEYS.find(k => OPS[k].n === n)];
// menus show the same drawn figures as battles (rendered once, then cached)
const spriteURL = op => opArt(op.key).full;
const headURL = op => opArt(op.key).head;

// ---------- enemies: Ghouls, the Dead, Chaos beasts, Tatari phantoms ----------
const S1 = (name, mult, effects = [], hits = 1) => { const s = { slot: 1, name, cd: 0, target: "enemy", hits, mult, effects }; s.desc = skillDesc(s); return s; };
const S2 = (name, target, mult, effects = [], hits = 1) => { const s = { slot: 2, name, cd: 3, target, hits, mult, effects }; s.desc = skillDesc(s); return s; };
const ENEMY = {
  ghoul: { n: "Ghoul", cls: "Guard", el: "Blood", m: { hp: .7, atk: .75, def: .7, spd: 100 },
    fig: { type: "human", skin: "#b9c0b2", hair: "#34322e", hs: "short", col: "#45454e", col2: "#2c2c34", boot: "#1c1c20", acc: "#5a2a2a", eyec: "#ff3b5c", w: "claws", sc: "#ff3b5c" },
    skills: [S1("Rend", 2.6, [dbf("DOT", .2)])] },
  dead: { n: "The Dead", cls: "Vanguard", el: "Half", m: { hp: .62, atk: .7, def: .6, spd: 98 },
    fig: { type: "human", skin: "#a9b8a2", hair: "#2a2a26", hs: "bald", col: "#3a4038", col2: "#2a2e28", boot: "#1a1c18", acc: "#4a4a3a", eyec: "#c39bff", w: "none", sc: "#c39bff" },
    skills: [S1("Grasp", 2.4, [dbf("SLOW", .3)])] },
  hound: { n: "Shadow Hound", cls: "Specialist", el: "Blood", m: { hp: .55, atk: .8, def: .45, spd: 122 },
    fig: { type: "hound", col: "#221c26", acc: "#ff3b5c" },
    skills: [S1("Bite", 2.6, [dbf("DOT", .3)])] },
  panther: { n: "Chaos Panther", cls: "Guard", el: "Half", m: { hp: .82, atk: .9, def: .6, spd: 116 },
    fig: { type: "hound", col: "#2a2836", acc: "#9a7aff", h: 1.15 },
    skills: [S1("Pounce", 1.4, [], 2), S2("Pack Hunt", "aoe_enemies", 1.6, [tmDown(.1)])] },
  phantom: { n: "Rumor Phantom", cls: "Caster", el: "Crescent", m: { hp: .6, atk: .9, def: .55, spd: 104 },
    fig: { type: "hood", skin: "#d8dce8", col: "#2a2a3e", col2: "#1e1e2e", cape: "#3a3a56", eyes: "#8fd8ff", robe: 1, w: "arts", sc: "#8fd8ff" },
    skills: [S1("Whisper", 2.6, [dbf("SILENCE", .2, 1)]), S2("Spread the Rumor", "aoe_enemies", 1.6, [dbf("ATK_DOWN", .3)])] },
  wraith: { n: "Tatari Wraith", cls: "Caster", el: "Blood", m: { hp: .7, atk: .95, def: .6, spd: 106 },
    fig: { type: "hood", skin: "#e0d0d4", col: "#2a0e18", col2: "#1e0a12", cape: "#3a1020", eyes: "#ff3b5c", robe: 1, w: "arts", sc: "#ff3b5c" },
    skills: [S1("Curse", 2.8, [dbf("BRAND", .3)]), S2("Night Terror", "aoe_enemies", 1.8, [dbf("STUN", .2, 1)])] },
  executor: { n: "Rogue Executor", cls: "Sniper", el: "Holy", m: { hp: .6, atk: .9, def: .55, spd: 108 },
    fig: { type: "human", skin: "#efdccc", hair: "#3a3a40", hs: "short", col: "#1a1a24", col2: "#16161f", boot: "#101016", acc: "#c8b06a", trim: "#e8e2d0", robe: "robe", w: "blackkeys", sc: "#f4efe2" },
    skills: [S1("Black Keys", 1.4, [dbf("STUN", .1, 1)], 2)] },
  knight: { n: "Ghoul Knight", cls: "Defender", el: "Blood", m: { hp: 1.05, atk: .62, def: 1.1, spd: 96 },
    fig: { type: "human", skin: "#b9c0b2", hair: "#34322e", hs: "short", col: "#3a3a46", col2: "#2a2a34", boot: "#1c1c22", acc: "#5a2a2a", eyec: "#ff3b5c", bulk: 1.18, w: "shield", sc: "#ff3b5c", shc: "#4a4a56" },
    skills: [S1("Rusted Blade", 2.6, [dbf("PROVOKE", .3, 1)]), { slot: 2, name: "Bulwark", cd: 3, target: "self", effects: [selfBuff("DEF_UP"), { on: "self", type: "taunt", turns: 2 }], desc: "Gains DEF Up (2T). Gains Taunt (2T)." }] },
  homunculus: { n: "Atlas Homunculus", cls: "Guard", el: "Full", m: { hp: .8, atk: .85, def: .8, spd: 104 },
    fig: { type: "robot", col: "#6a6a7a", col2: "#4a4a58", boot: "#2a2a34", acc: "#f1d07a", w: "saber", sc: "#f1d07a" },
    skills: [S1("Calculated Strike", 2.8, [dbf("DEF_BREAK", .3)])] },
};
// Bosses are tougher versions of playable characters (same figure and kit, Arc Drive included).
// [character, HP multiplier, ATK multiplier]; bosses that revive or heal get less HP so the fight stays fair
const BOSS = { b_sion: ["sion", 3.0, 1.12], b_ciel: ["ciel", 3.0, 1.12], b_redakiha: ["red-akiha", 2.3, .98], b_chaos: ["chaos", 2.1, 1.0], b_wallachia: ["wallachia", 3.1, 1.05],
  b_nanaya: ["nanaya", 2.8, 1.1], b_riesbyfe: ["riesbyfe", 3.0, 1.1], b_roa: ["roa", 2.2, 1.0], b_redarc: ["red-arcueid", 2.6, 1.02], b_vlov: ["vlov", 3.0, 1.1],
  b_siontatari: ["sion-tatari", 2.8, 1.05], b_mech: ["mech-hisui", 2.8, 1.1], b_satsuki: ["satsuki", 2.6, 1.1], b_whitelen: ["white-len", 2.8, 1.1] };
for (const id in BOSS) {
  const [k, hp, atk] = BOSS[id], op = OPS[k];
  ENEMY[id] = { n: op.n, boss: 1, op: k, cls: op.cls, el: op.el, fig: op.fig, skills: op.skills, passives: op.passives,
    m: { hp, atk, def: 1.0, spd: op.stats.spd - 4 } };
}
for (const k in ENEMY) { ENEMY[k].key = k; ENEMY[k].enemy = true; ENEMY[k].passives = ENEMY[k].passives || []; ENEMY[k].runes = []; }
