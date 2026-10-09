
// =====================================================================
//  TYPE TABLES, UNIT TABLE (Bladers × Beyblades) AND OPPONENTS
//  target: enemy | aoe_enemies | ally_single | self | team | aoe_allies
// =====================================================================
const CLASS_BASE = {
  Attack:    { hp: 9000, atk: 880, def: 450, spd: 116 },
  Defense:   { hp: 10600, atk: 660, def: 660, spd: 104 },
  Endurance: { hp: 11000, atk: 640, def: 560, spd: 108 },
  Balance:   { hp: 9600, atk: 760, def: 540, spd: 112 },
};
const CLASS_LEADER = {
  Attack: { stat: "ATK", amount: .24, scope: "Element" }, Defense: { stat: "HP", amount: .25, scope: "All" },
  Endurance: { stat: "RES", amount: .3, scope: "All" }, Balance: { stat: "SPD", amount: .15, scope: "All" },
};
const RAR_MULT = { 1: .7, 2: .76, 3: .84, 4: .92, 5: 1, 6: 1.06 };
const ARC_COST = 100;

// ---------- Bit-Beast elements ----------
// Each Bit-Beast has an element from the show (Dragoon's storms, Dranzer's fire, Driger's lightning, Draciel's water,
// Wolborg's ice…). It adds a small lean to the stats, an extra effect on S1 and a tweak to the Bit-Beast attack.
const BEAST_EL = ["Wind", "Fire", "Water", "Lightning", "Earth", "Ice", "Dark", "Light"];
const BEAST_ELC = { Wind: "#5fdc8c", Fire: "#ff7a3c", Water: "#4aa8ff", Lightning: "#f2d04e", Earth: "#c8945a", Ice: "#cfe8ff", Dark: "#b07bff", Light: "#ffe6a0" };
const BEAST_KIT = {
  Wind: { d: "+4 SPD. S1 pushes back turn meter. The Bit-Beast attack gives all allies turn meter.",
    stat: { spd: 4 }, s1: tmDown(.1), arc: () => ({ add: teamGain(.1) }) },
  Fire: { d: "+5% ATK. S1 can inflict Friction. The Bit-Beast attack hits 8% harder (support ones give Attack Up).",
    stat: { atk: 1.05 }, s1: dbf("DOT", .25), arc: sk => sk.mult > 0 ? { mult: 1.08 } : { add: teamBuff("ATK_UP") } },
  Water: { d: "+6% Spin. S1 can inflict Slowed. The Bit-Beast attack also restores all allies' Spin.",
    stat: { hp: 1.06 }, s1: dbf("SLOW", .25), arc: () => ({ add: teamHeal(.08) }) },
  Lightning: { d: "+3% ATK and SPD. S1 can Stall. The Bit-Beast attack also removes a buff.",
    stat: { atk: 1.03, spd: 2 }, s1: dbf("STUN", .12, 1), arc: sk => ({ add: sk.mult > 0 ? strip(1) : teamBuff("CRIT_RATE_UP") }) },
  Earth: { d: "+8% DEF. S1 can inflict Cracked Ring. The Bit-Beast attack also gives all allies a Barrier.",
    stat: { def: 1.08 }, s1: dbf("DEF_BREAK", .25), arc: () => ({ add: teamShield(.08) }) },
  Ice: { d: "+5% Spin. S1 can inflict Attack Down. The Bit-Beast attack also pushes back every opponent's turn meter.",
    stat: { hp: 1.05 }, s1: dbf("ATK_DOWN", .25), arc: () => ({ add: aoeTm(.12) }) },
  Dark: { d: "+3% Spin and ATK. S1 can inflict Spin Lock. The Bit-Beast attack also restores its own Spin.",
    stat: { atk: 1.03, hp: 1.03 }, s1: dbf("HEAL_BLOCK", .25), arc: () => ({ add: selfHeal(.15) }) },
  Light: { d: "+5% DEF and Spin. S1 can Seal the Bit-Beast. The Bit-Beast attack also cleanses an ally's debuff.",
    stat: { def: 1.05, hp: 1.05 }, s1: dbf("SILENCE", .2, 1), arc: sk => ({ add: sk.mult > 0 ? cleanse(1) : teamBuff("IMMUNITY", 1) }) },
};
// add an effect to a skill, or strengthen the same effect if the skill already has it
function withEffect(sk, e) {
  const ex = sk.effects.find(x => x.type === e.type && x.on === e.on && x.what === e.what && !x.onKill && !x.perCrit);
  if (!ex) { sk.effects.push({ ...e }); return; }
  const i = sk.effects.indexOf(ex), up = { ...ex };
  if (e.type === "debuff") up.chance = Math.min(1, (ex.chance ?? 1) + .15);
  else if (e.type === "strip" || e.type === "cleanse") up.amount = (ex.amount || 1) + 1;
  else if (e.type !== "buff") up.amount = +((ex.amount || 0) + .05).toFixed(2);
  sk.effects[i] = up;
}
// per-hit effects are scaled down on multi-hit skills so a 7-hit S1 doesn't apply them seven times over
const perHit = (e, hits) => { const f = Math.min(1, 2 / (hits || 1)); return e.type === "debuff" ? { ...e, chance: +(e.chance * f).toFixed(3) } : { ...e, amount: +(e.amount * f).toFixed(3) }; };

// ---------- build the unit table ----------
// Every Beyblade a Blader used ("<blader>-<version>", e.g. "tyson-s" for Dragoon S) is a separate unit.
const OPS = {};
const OP_KEYS = [];
const FAMS = [];
for (const c of BLADERS) for (const v of c.beys) {
  const key = c.k + "-" + v.v, type = v.type, beast = { ...c.beast, ...(v.beast || {}) }, X = BEAST_KIT[beast.el] || BEAST_KIT.Wind;
  const passives = (v.talents || [v.talent]).filter(Boolean).map(t => ({ ...t, text: `${t.name}: ${passiveDesc(t)}.` }));
  const skills = v.skills.map(sk0 => {
    const sk = { ...sk0, effects: [...(sk0.effects || [])] };
    if (sk.slot === 1) withEffect(sk, perHit(X.s1, sk.hits));
    if (sk.slot === 3) { const t = X.arc(sk); if (t.mult) sk.mult = +(sk.mult * t.mult).toFixed(2); if (t.add) withEffect(sk, t.add); sk.arc = ARC_COST; sk.cd = 0; }
    sk.desc = skillDesc(sk);
    return sk;
  });
  const stats = { ...CLASS_BASE[type], ...(v.stats || {}) };
  for (const k in X.stat) stats[k] = k === "spd" ? stats[k] + X.stat[k] : Math.round(stats[k] * X.stat[k]);
  const op = { key, base: c.k, fam: key, n: v.n, short: v.short || beast.n, blader: c.short || c.n, bladerFull: c.n, team: v.team || c.squad, squad: c.squad, slug: c.k,
    rar: v.rar, cls: type, el: type, season: v.season || 1, beast, left: !!v.left,
    bey: { ...v.look, chip: v.look.chip || beast.col, kind: beast.kind }, fig: c.fig, stats, skills, leader: { ...(v.leader || CLASS_LEADER[type]) },
    passives, maxElite: 2, featured: true, beastKit: X.d };
  if (op.leader.scope === "Element") op.leader.element = type;
  OPS[key] = op; OP_KEYS.push(key); FAMS.push(key);
}
const homeKey = k => k;
const variantsOf = base => OP_KEYS.filter(k => OPS[k].base === base);
const elementsOf = fam => [fam];
const opLabel = op => `${op.blader} · ${op.n}`;
const LEGACY = {};
// menus show the same drawn Beyblades, Bit-Beasts and Bladers as battles (rendered once, then cached)
const spriteURL = op => opArt(op.key).full;
const headURL = op => opArt(op.key).head;

// ---------- opponents: rank-and-file Bladers ----------
const S1 = (name, mult, effects = [], hits = 1) => { const s = { slot: 1, name, cd: 0, target: "enemy", hits, mult, effects }; s.desc = skillDesc(s); return s; };
const S2 = (name, target, mult, effects = [], hits = 1) => { const s = { slot: 2, name, cd: 3, target, hits, mult, effects }; s.desc = skillDesc(s); return s; };
const kid = (hair, col, col2, x = {}) => ({ type: "human", skin: "#f1d6bf", hair, hs: "short", col, col2, boot: "#2a2a30", acc: shadeHex(col, -.3), w: "launcher", sc: "#ffd34d", ...x });
function shadeHex(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = c => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt); return "#" + [n >> 16 & 255, n >> 8 & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, "0")).join(""); }
const ENEMY = {
  street: { n: "Street Blader", cls: "Balance", el: "Balance", m: { hp: .7, atk: .75, def: .7, spd: 104 },
    fig: kid("#4a3a2a", "#d84a3a", "#2a3a6a", { cap: "#2f6fd8" }), bey: { ring: "#c8c8d0", ring2: "#ff5a4a", disk: "#8a909a", base: "#3a3f4a", shape: "flat", chip: "#9aa4b8" },
    skills: [S1("Basic Attack", 2.6, [tmDown(.08, .3)])] },
  shark: { n: "Blade Shark", cls: "Attack", el: "Attack", m: { hp: .62, atk: .82, def: .6, spd: 112 },
    fig: kid("#1a1a20", "#2a6a6a", "#1a1a24", { hs: "swoop", bandana: "#d83a2a" }), bey: { ring: "#2a8a8a", ring2: "#c8ffff", disk: "#7a8090", base: "#1a2a2a", shape: "saw", chip: "#5fd4ff" },
    skills: [S1("Shark Bite", 1.35, [dbf("DOT", .2)], 2)] },
  bully: { n: "Hobby Shop Bully", cls: "Defense", el: "Defense", m: { hp: 1.0, atk: .6, def: 1.05, spd: 96 },
    fig: kid("#5a3a1a", "#5a6a3a", "#3a3a2a", { bulk: 1.2 }), bey: { ring: "#6a7a4a", ring2: "#e0e8c0", disk: "#9aa0a8", base: "#2a2e22", shape: "round", chip: "#c8945a" },
    skills: [S1("Shove", 2.4, [dbf("PROVOKE", .3, 1)]), { slot: 2, name: "Hold the Middle", cd: 3, target: "self", effects: [selfBuff("DEF_UP"), { on: "self", type: "taunt", turns: 2 }], desc: "Gains Defense Up (2T). Gains Center Hold (2T)." }] },
  trainee: { n: "BBA Trainee", cls: "Endurance", el: "Endurance", m: { hp: .8, atk: .7, def: .7, spd: 102 },
    fig: kid("#2a2a30", "#f2f2f6", "#2a4a8a"), bey: { ring: "#f2c14e", ring2: "#ffffff", disk: "#a8b0c0", base: "#e8eaf0", shape: "round", chip: "#ff7a1a" },
    skills: [S1("Steady Spin", 2.4, [selfHeal(.05)])] },
  biovolt: { n: "Biovolt Soldier", cls: "Attack", el: "Attack", m: { hp: .7, atk: .88, def: .62, spd: 108 },
    fig: kid("#c8c8d0", "#3a2a2a", "#2a2026", { hs: "bald", cap: "#5a1a22", eyec: "#ff3b5c" }), bey: { ring: "#8a1a2a", ring2: "#ff8a8a", disk: "#5a606a", base: "#1a1a20", shape: "spike", chip: "#ff3b5c" },
    skills: [S1("Cold Strike", 2.8, [dbf("DEF_BREAK", .3)]), S2("Battalion Charge", "aoe_enemies", 1.5, [tmDown(.1)])] },
  dark: { n: "Dark Blader", cls: "Endurance", el: "Endurance", m: { hp: .75, atk: .85, def: .62, spd: 106 },
    fig: { type: "hood", skin: "#d8d0d8", col: "#1a0e24", col2: "#120a18", cape: "#2a1438", eyes: "#b07bff", robe: 1, w: "launcher", sc: "#b07bff" }, bey: { ring: "#3a1a5a", ring2: "#c89cff", disk: "#4a4058", base: "#120a18", shape: "claw", chip: "#b07bff" },
    beast: { kind: "serpent", col: "#b07bff" },
    skills: [S1("Shadow Grind", 2.6, [dbf("HEAL_BLOCK", .3)]), S2("Dark Vortex", "aoe_enemies", 1.6, [dbf("SLOW", .3)])] },
  cyber: { n: "Psykick Drone", cls: "Balance", el: "Balance", m: { hp: .78, atk: .82, def: .78, spd: 106 },
    fig: { type: "robot", col: "#4a5a6a", col2: "#2a3440", boot: "#1a2028", acc: "#5fd4ff", w: "launcher", sc: "#5fd4ff" }, bey: { ring: "#5a6a7a", ring2: "#5fd4ff", disk: "#3a4450", base: "#1a2028", shape: "spike", chip: "#5fd4ff" },
    skills: [S1("Calculated Hit", 2.8, [dbf("SILENCE", .2, 1)])] },
  bega: { n: "BEGA Blader", cls: "Attack", el: "Attack", m: { hp: .72, atk: .9, def: .64, spd: 110 },
    fig: kid("#e8e0f0", "#3a1a5a", "#1a0a2a", { hs: "swoop", trim: "#d84aff" }), bey: { ring: "#6a2a9a", ring2: "#ff9cf0", disk: "#6a6078", base: "#1a0a2a", shape: "wing", chip: "#d84aff" },
    skills: [S1("Pro Strike", 1.4, [dbf("BRAND", .15)], 2), S2("Spotlight Rush", "aoe_enemies", 1.6, [dbf("ATK_DOWN", .3)])] },
  guardian: { n: "Saint Guardian", cls: "Defense", el: "Defense", m: { hp: 1.05, atk: .62, def: 1.1, spd: 96 },
    fig: kid("#2a1a10", "#c8a46a", "#6a4a2a", { bandana: "#2a8a8a", bulk: 1.15 }), bey: { ring: "#c8a46a", ring2: "#2a8a8a", disk: "#9a8a6a", base: "#4a3a22", shape: "round", chip: "#2a8a8a" },
    skills: [S1("Stone Wall", 2.4, [dbf("PROVOKE", .3, 1)]), { slot: 2, name: "Ancient Guard", cd: 3, target: "self", effects: [selfShield(.15), { on: "self", type: "taunt", turns: 2 }], desc: "Gains a Barrier worth 15% of this Beyblade's max Spin (2T). Gains Center Hold (2T)." }] },
  tiger: { n: "Bai Hu Clan Blader", cls: "Balance", el: "Balance", m: { hp: .8, atk: .82, def: .72, spd: 110 },
    fig: kid("#1a1a20", "#f2f2f6", "#c8302a", { hs: "long", hlen: 26, headband: "#c8302a" }), bey: { ring: "#e8e8ee", ring2: "#c8302a", disk: "#9aa4b8", base: "#3a4a3a", shape: "claw", chip: "#f2d04e" },
    skills: [S1("Tiger Swipe", 2.7, [dbf("SLOW", .25)])] },
  knight: { n: "Castle Blader", cls: "Defense", el: "Defense", m: { hp: 1.0, atk: .68, def: 1.0, spd: 100 },
    fig: kid("#c8a46a", "#4a3a6a", "#2a2a3a", { cape: "#6a2a6a", trim: "#f2c14e" }), bey: { ring: "#7a7aa0", ring2: "#f2c14e", disk: "#a8a8b8", base: "#2a2a3a", shape: "round", chip: "#ffe6a0" },
    skills: [S1("Lance Charge", 2.6, [dbf("ATK_DOWN", .25)])] },
  allstar: { n: "PPB Lab Blader", cls: "Balance", el: "Balance", m: { hp: .78, atk: .84, def: .72, spd: 108 },
    fig: kid("#d8b878", "#f2f2f6", "#d83a3a", { cap: "#2a4aa8" }), bey: { ring: "#2a4aa8", ring2: "#ff5a4a", disk: "#a8b0c0", base: "#f2f2f6", shape: "flat", chip: "#ff5a4a" },
    skills: [S1("Data Strike", 2.7, [dbf("GLANCING", .2)])] },
};
// Bosses are tougher versions of playable Beyblades (same Bit-Beast and moves, Bit-Beast attack included).
// [unit, Spin multiplier, ATK multiplier]; in 1-on-1 battles a boss keeps BOSS_SPIN of the Spin multiplier
const BOSS = {}, BOSS_SPIN = .62;
function bossOf(id, key, hp, atk) {
  BOSS[id] = [key, hp, atk];
  const op = OPS[key];
  ENEMY[id] = { key: id, enemy: true, n: op.n, boss: 1, op: key, cls: op.cls, el: op.el, fig: op.fig, bey: op.bey, beast: op.beast, skills: op.skills,
    passives: op.passives, blader: op.blader, left: op.left, season: op.season, rar: op.rar, m: { hp: hp * BOSS_SPIN, atk, def: 1.0, spd: op.stats.spd - 4 } };
}
for (const k in ENEMY) { ENEMY[k].key = k; ENEMY[k].enemy = true; ENEMY[k].passives = ENEMY[k].passives || []; }
