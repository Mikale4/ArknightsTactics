
// =====================================================================
//  OPERATOR KITS
//  Every operator uses their real Arknights skills and talents (REAL, a3b_real.js),
//  translated to turn-based rules (format: mobile/tools/kits/KIT_FORMAT.md).
//  Slot 0 is the basic attack, which comes from the operator's branch trait (BRANCH);
//  slots 1-3 are the real S1-S3, unlocked at Elite 0/1/2.
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
// hand-picked leader skills and recommended module sets
const FEATURED = {
  Exusiai: { leader: { stat: "ATK", amount: .24, scope: "Element", element: "Wind" }, runes: ["Swift", "Blade"] },
  SilverAsh: { leader: { stat: "CR", amount: .24, scope: "All" }, runes: ["Violent", "Will"] },
  Surtr: { leader: { stat: "ATK", amount: .33, scope: "Element", element: "Fire" }, runes: ["Rage", "Will"] },
  Saria: { leader: { stat: "HP", amount: .33, scope: "All" }, runes: ["Energy", "Shield"] },
  Ifrit: { leader: { stat: "ACC", amount: .4, scope: "All" }, runes: ["Focus", "Despair"] },
  Skadi: { leader: { stat: "CD", amount: .33, scope: "Element", element: "Water" }, runes: ["Fatal", "Blade"] },
  Nightingale: { leader: { stat: "RES", amount: .41, scope: "All" }, runes: ["Swift", "Will"] },
  Angelina: { leader: { stat: "SPD", amount: .24, scope: "All" }, runes: ["Despair", "Focus"] },
  Lappland: { leader: { stat: "ATK", amount: .33, scope: "Element", element: "Dark" }, runes: ["Revenge", "Will"] },
  Blaze: { leader: { stat: "DEF", amount: .33, scope: "Element", element: "Fire" }, runes: ["Guard", "Revenge"] },
  Schwarz: { leader: { stat: "CR", amount: .24, scope: "Element", element: "Dark" }, runes: ["Fatal", "Rage"] },
  Amiya: { leader: { stat: "ATK", amount: .2, scope: "All" }, runes: ["Focus", "Rage"] },
  Texas: { leader: { stat: "SPD", amount: .2, scope: "All" }, runes: ["Swift", "Violent"] },
  Hoshiguma: { leader: { stat: "DEF", amount: .3, scope: "All" }, runes: ["Guard", "Revenge"] },
  Eyjafjalla: { leader: { stat: "ATK", amount: .33, scope: "Element", element: "Fire" }, runes: ["Fatal", "Focus"] },
  Mostima: { leader: { stat: "SPD", amount: .19, scope: "All" }, runes: ["Swift", "Despair"] },
  Thorns: { leader: { stat: "HP", amount: .25, scope: "All" }, runes: ["Revenge", "Energy"] },
  Ptilopsis: { leader: { stat: "RES", amount: .3, scope: "All" }, runes: ["Swift", "Energy"] },
  Specter: { leader: { stat: "HP", amount: .2, scope: "Element", element: "Dark" }, runes: ["Energy", "Rage"] },
  Nearl: { leader: { stat: "HP", amount: .25, scope: "All" }, runes: ["Energy", "Will"] },
  Mudrock: { leader: { stat: "DEF", amount: .3, scope: "Element", element: "Fire" }, runes: ["Shield", "Guard"] },
  Suzuran: { leader: { stat: "RES", amount: .35, scope: "All" }, runes: ["Swift", "Will"] },
  Mountain: { leader: { stat: "HP", amount: .2, scope: "All" }, runes: ["Energy", "Revenge"] },
  Bagpipe: { leader: { stat: "ATK", amount: .2, scope: "All" }, runes: ["Swift", "Fatal"] },
  Ash: { leader: { stat: "CR", amount: .24, scope: "All" }, runes: ["Blade", "Rage"] },
  Kroos: { runes: ["Fatal", "Blade"] }, Melantha: { runes: ["Fatal", "Energy"] }, Fang: { runes: ["Swift", "Energy"] }, Ansel: { runes: ["Energy", "Will"] },
  Ling: { leader: { stat: "ATK", amount: .24, scope: "All" }, runes: ["Swift", "Focus"] },
  Weedy: { leader: { stat: "HP", amount: .2, scope: "Element", element: "Water" }, runes: ["Energy", "Despair"] },
  Ceobe: { leader: { stat: "ACC", amount: .3, scope: "All" }, runes: ["Fatal", "Violent"] },
  Siege: { leader: { stat: "ATK", amount: .25, scope: "All" }, runes: ["Fatal", "Swift"] },
};
const ARTS_CLASSES = new Set(["Caster", "Supporter", "Medic"]);

// ---------- branch traits → basic attack + trait passive ----------
// b: basic attack fields (target, mult, hits, n, aoe, dmg, heal, healN, reach, sure, falloff, front, effects)
// tl: trait passive (talent format); mech: engine-coded trait; prio: auto-target rule
const BRANCH = {
  pioneer:       { n: "Pioneer", t: "Blocks 2 enemies, so enemies are more likely to attack this operator." },
  charger:       { n: "Charger", t: "After defeating an enemy, all allies gain 5% turn meter.", tl: { on: "kill", effects: [{ on: "team", type: "atkbar+", amount: .05 }] } },
  tactician:     { n: "Tactician", t: "Calls Reinforcements: deals +50% damage to Slowed, Bound, Frozen or Stunned enemies.", tl: { dmgBonus: [{ cond: { targetCC: true }, v: .5 }] } },
  agent:         { n: "Agent", t: "Ranged attacks: can hit any enemy, ignoring Taunt and Camouflage.", b: { reach: true } },
  bearer:        { n: "Standard Bearer", t: "While a skill is active, doesn't Block, so enemies don't prefer it.", mech: "bearer" },
  lord:          { n: "Lord", t: "Ranged attacks: can hit any enemy, ignoring Taunt and Camouflage.", b: { reach: true } },
  artsfghter:    { n: "Arts Fighter", t: "Deals Arts damage.", b: { dmg: "arts" } },
  fighter:       { n: "Fighter", t: "Blocks 1 enemy. Fast, steady strikes." },
  sword:         { n: "Swordmaster", t: "Basic attacks deal damage twice (75% ATK each).", b: { hits: 2, mult: .75 } },
  centurion:     { n: "Centurion", t: "Attacks all blocked enemies: basic attacks hit up to 3 enemies (85% ATK).", b: { n: 3, mult: .85 } },
  instructor:    { n: "Instructor", t: "Extended range: basic attacks ignore Taunt and Camouflage and deal 120% ATK.", b: { reach: true, mult: 1.2 } },
  fearless:      { n: "Dreadnought", t: "Blocks 1 enemy. Heavy single blows." },
  musha:         { n: "Soloblade", t: "Can't be healed by allies. Restores 3% max HP with every hit.", tl: { special: "NO_ALLY_HEAL", on: "hit", effects: [{ on: "self", type: "healPct", amount: .03 }] } },
  reaper:        { n: "Reaper", t: "Can't be healed by allies. Basic attacks hit up to 3 enemies (80% ATK) and restore 2% max HP per enemy hit.", b: { n: 3, mult: .8 }, tl: { special: "NO_ALLY_HEAL", on: "hit", effects: [{ on: "self", type: "healPct", amount: .02 }] } },
  crusher:       { n: "Crusher", t: "Attacks all blocked enemies: basic attacks hit up to 3 enemies (90% ATK).", b: { n: 3, mult: .9 } },
  librator:      { n: "Liberator", t: "Basic action doesn't attack: it gains ATK +40% (max +200%) instead. The bonus resets when a skill ends.", mech: "librator" },
  protector:     { n: "Protector", t: "Blocks 3 enemies, so enemies are much more likely to attack this operator." },
  guardian:      { n: "Guardian", t: "Blocks 3 enemies and heals allies through skills." },
  artsprotector: { n: "Arts Protector", t: "Blocks 3 enemies. Basic attacks deal Arts damage while a skill is active.", mech: "artsprotector" },
  fortress:      { n: "Fortress", t: "Ranged AoE: basic attacks hit up to 3 enemies (70% ATK).", b: { n: 3, mult: .7 } },
  duelist:       { n: "Duelist", t: "Skill cooldowns only count down on turns after this operator was attacked.", mech: "duelist" },
  shotprotector: { n: "Sentry Protector", t: "Blocks 3 enemies and attacks from long range, ignoring Taunt and Camouflage.", b: { reach: true } },
  unyield:       { n: "Juggernaut", t: "Can't be healed by allies.", tl: { special: "NO_ALLY_HEAL" } },
  fastshot:      { n: "Marksman", t: "Targets the fastest enemy first and deals +15% damage to it.", prio: "spd", tl: { dmgBonus: [{ cond: { targetFastest: true }, v: .15 }] } },
  longrange:     { n: "Deadeye", t: "Targets the enemy with the lowest DEF first.", prio: "def" },
  reaperrange:   { n: "Spreadshooter", t: "Basic attacks hit every enemy (70% ATK) and deal 150% of that to the main target.", b: { aoe: true, mult: .7, front: 1.5 } },
  closerange:    { n: "Heavyshooter", t: "Point-blank shots: basic attacks can't be dodged.", b: { sure: true } },
  siegesniper:   { n: "Besieger", t: "Targets the enemy with the highest max HP first.", prio: "hp" },
  aoesniper:     { n: "Artilleryman", t: "AoE Physical: basic attacks hit up to 3 enemies (75% ATK).", b: { n: 3, mult: .75 } },
  corecaster:    { n: "Core Caster", t: "Deals Arts damage." },
  splashcaster:  { n: "Splash Caster", t: "AoE Arts: basic attacks hit up to 3 enemies (70% ATK).", b: { n: 3, mult: .7 } },
  blastcaster:   { n: "Blast Caster", t: "Long-line AoE Arts: basic attacks hit every enemy (70% ATK).", b: { aoe: true, mult: .7 } },
  chain:         { n: "Chain Caster", t: "Arts attacks jump between up to 4 enemies, 15% weaker per jump, with a 25% chance to Slow (1T).", b: { n: 4, falloff: .85, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .25, turns: 1 }] } },
  phalanx:       { n: "Phalanx Caster", t: "With no skill active: DEF +200%, RES +20, weak attacks (40% ATK). With a skill active: basic attacks hit every enemy.", mech: "phalanx" },
  funnel:        { n: "Mech-accord Caster", t: "A Drone attacks with Arts: 60% ATK, +25% for each consecutive attack on the same enemy (max 110%).", mech: "funnel", b: { mult: .6 } },
  mystic:        { n: "Mystic Caster", t: "Stores 2 charged attacks at the start of each wave; the next basic attack fires them as extra hits (80% ATK each).", mech: "mystic" },
  primcaster:    { n: "Primal Caster", t: "Arts attacks also build 15% Elemental Injury.", mech: "primcaster" },
  soulcaster:    { n: "Shaper Caster", t: "Each kill raises a Summon (max 2); each Summon adds a 50% ATK Arts hit to basic attacks.", mech: "soulcaster" },
  physician:     { n: "Medic", t: "Basic action heals the most injured ally for 100% ATK.", b: { target: "ally_single", heal: 1 } },
  ringhealer:    { n: "Multi-target Medic", t: "Basic action heals the 3 most injured allies for 80% ATK.", b: { target: "ally_single", heal: .8, healN: 3 } },
  healer:        { n: "Therapist", t: "Basic action heals any ally for 100% ATK.", b: { target: "ally_single", heal: 1 } },
  wandermedic:   { n: "Wandering Medic", t: "Basic action heals the most injured ally for 100% ATK and removes 1 debuff.", b: { target: "ally_single", heal: 1, effects: [{ on: "target", type: "cleanse", amount: 1 }] } },
  slower:        { n: "Decel Binder", t: "Arts attacks with a 50% chance to Slow (1T).", b: { effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .5, turns: 1 }] } },
  summoner:      { n: "Summoner", t: "Deals Arts damage and fights alongside Summons through skills." },
  underminer:    { n: "Hexer", t: "Deals Arts damage; skills weaken enemies." },
  bard:          { n: "Bard", t: "Doesn't attack: basic action heals every ally for 30% ATK.", b: { target: "team", heal: .3 } },
  blessing:      { n: "Abjurer", t: "Deals Arts damage. While a skill is active, basic attacks heal the most injured ally for 75% ATK instead.", mech: "blessing" },
  craftsman:     { n: "Artificer", t: "Blocks 2 enemies and supports the squad with devices through skills." },
  dollkeeper:    { n: "Dollkeeper", t: "Once per battle, lethal damage swaps in a Substitute: back at 50% HP instead of falling.", tl: { special: "UNDYING", amount: .5, turns: 0 } },
  hookmaster:    { n: "Hookmaster", t: "Shifts enemies with skills, delaying their turns." },
  stalker:       { n: "Ambusher", t: "Basic attacks hit up to 3 enemies (80% ATK). 50% chance to dodge Physical and Arts hits; enemies rarely target it.", b: { n: 3, mult: .8 }, tl: { stats: { dodge: .5 } }, mech: "stalker" },
  pusher:        { n: "Push Stroker", t: "Attacks all blocked enemies: basic attacks hit up to 3 enemies (80% ATK).", b: { n: 3, mult: .8 } },
  traper:        { n: "Trapmaster", t: "Plants 2 traps each wave: the first enemies to act take 150% ATK Physical damage and are Bound (1T).", mech: "traper" },
  executor:      { n: "Executor", t: "Fast redeployment: the first time this operator falls, it returns 3 turns later at full HP.", mech: "redeploy" },
  merchant:      { n: "Merchant", t: "Returns once, 3 turns after falling, but pays upkeep: loses 3% max HP at the start of each turn.", mech: "merchant" },
};
const ELEM_OF = { diamante: "necrosis", nymph: "necrosis", warmy: "burn", "miss-christine": "nervous" };
const RAR_MULT = { 1: .62, 2: .68, 3: .76, 4: .84, 5: .92, 6: 1 };

// ---------- build the operator table ----------
const OPS = {};
const OP_KEYS = [];
function basicFor(cls, br) {
  const B = BRANCH[br] || { n: br, t: "" };
  const b = { slot: 0, name: br === "bard" ? "Melody" : B.b && B.b.heal ? "Treatment" : "Attack", target: "enemy", mult: 1, hits: 1, ...(B.b || {}) };
  if (!b.dmg) b.dmg = ARTS_CLASSES.has(cls) ? "arts" : "phys";
  b.desc = B.t; b.basic = true;
  return b;
}
for (const line of ROSTER_RAW.split("\n")) {
  const [n, slug, rar, cls, el, asp] = line.split("|");
  const f = FEATURED[n], R = REAL[slug], B = BRANCH[R.b] || {};
  const dmg = ARTS_CLASSES.has(cls) || R.b === "artsfghter" ? "arts" : "phys";
  const op = { key: slug, n, slug, rar: +rar, cls, el, asp: +asp, featured: !!f, branch: R.b, branchName: B.n || R.b, trait: B.t || "",
    stats: { ...R.st }, basic: basicFor(cls, R.b), skills: R.sk.map(s => ({ dmg, ...s })), talents: R.tl,
    traitTl: B.tl || null, mech: B.mech || null, prio: B.prio || null, elem: ELEM_OF[slug] || null,
    leader: f && f.leader ? f.leader : !f && +rar >= 4 ? { ...CLASS_LEADER[cls], element: el } : null,
    runes: f ? f.runes : CLASS_RUNES[cls],
  };
  if (op.leader && op.leader.scope === "Element" && !op.leader.element) op.leader.element = el;
  op.maxElite = op.rar <= 2 ? 0 : op.rar === 3 ? 1 : 2;
  OPS[slug] = op; OP_KEYS.push(slug);
}
const opByName = n => OPS[OP_KEYS.find(k => OPS[k].n === n)];
const spriteURL = op => ASSET + "sprites/" + op.slug + ".webp";
const headURL = op => ASSET + "heads/" + op.slug + ".webp";

// ---------- Reunion + monster enemies (procedurally drawn) ----------
const ENEMY = {
  soldier: { n: "Reunion Soldier", cls: "Guard", el: "Fire", m: { hp: .7, atk: .75, def: .7, spd: 100 },
    fig: { type: "hood", skin: "#d9cbb8", col: "#3a3f4a", col2: "#2a2e36", cape: "#4a4f5a", eyes: "#ff5a3a", w: "staff" },
    skills: [{ slot: 1, name: "Crude Blade", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [], desc: "260% ATK." }] },
  thrower: { n: "Cocktail Thrower", cls: "Caster", el: "Fire", m: { hp: .6, atk: .8, def: .6, spd: 104 },
    fig: { type: "hood", skin: "#d9cbb8", col: "#5a3a2a", col2: "#3a2a20", cape: "#6a4a30", eyes: "#ffb03a", w: "none" },
    skills: [{ slot: 1, name: "Molotov", cd: 0, target: "enemy", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .4, turns: 2 }], desc: "240% ATK. 40% chance to Burn (2T)." },
      { slot: 2, name: "Firebomb", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .3, turns: 2 }], desc: "Hits all enemies (160% ATK). 30% chance to Burn (2T)." }] },
  crossbow: { n: "Reunion Crossbowman", cls: "Sniper", el: "Wind", m: { hp: .6, atk: .85, def: .55, spd: 106 },
    fig: { type: "hood", skin: "#d9cbb8", col: "#4a4038", col2: "#2e2a26", cape: "#5a4a3a", eyes: "#ff5a3a", mask: 1, w: "bowcaster" },
    skills: [{ slot: 1, name: "Bolt", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [], desc: "280% ATK." }] },
  caster: { n: "Reunion Caster", cls: "Caster", el: "Dark", m: { hp: .6, atk: .9, def: .55, spd: 102 },
    fig: { type: "hood", skin: "#cfc3b4", col: "#2a2240", col2: "#1e1830", cape: "#3a2e5a", eyes: "#b98aff", robe: 1, w: "none" },
    skills: [{ slot: 1, name: "Arts Bolt", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .3, turns: 2 }], desc: "280% ATK. 30% chance of ATK Down (2T)." },
      { slot: 2, name: "Arts Wave", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.8, effects: [], desc: "Hits all enemies (180% ATK)." }] },
  shield: { n: "Reunion Shieldguard", cls: "Defender", el: "Water", m: { hp: 1.05, atk: .6, def: 1.1, spd: 96 },
    fig: { type: "hood", skin: "#d9cbb8", col: "#3a4656", col2: "#2a323e", cape: "#4a5668", eyes: "#5fd4ff", mask: 1, bulk: 1.2, w: "shield", sc: "#4aa3ff", shc: "#5a6a7e" },
    skills: [{ slot: 1, name: "Shield Bash", cd: 0, target: "enemy", hits: 1, mult: 2.2, effects: [{ on: "target", type: "debuff", what: "PROVOKE", chance: .3, turns: 1 }], desc: "220% ATK. 30% chance to Provoke (1T)." },
      { slot: 2, name: "Hold the Line", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "TAUNT", turns: 2 }, { on: "self", type: "buff", what: "DEF_UP", turns: 2 }], desc: "Gain Taunt and DEF Up (2T)." }] },
  hound: { n: "Infected Hound", cls: "Specialist", el: "Dark", m: { hp: .55, atk: .8, def: .45, spd: 122 },
    fig: { type: "hound", col: "#4a3a3a", acc: "#ff5a3a" },
    skills: [{ slot: 1, name: "Maul", cd: 0, target: "enemy", hits: 2, mult: 1.3, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .25, turns: 2 }], desc: "2 hits (130% each). 25% chance per hit to Burn (2T)." }] },
  slug: { n: "Originium Slug", cls: "Guard", el: "Water", m: { hp: .5, atk: .6, def: .6, spd: 92 },
    fig: { type: "slug", col: "#d8b070", acc: "#5fd4ff" },
    skills: [{ slot: 1, name: "Crawl Bite", cd: 0, target: "enemy", hits: 1, mult: 2.2, effects: [], desc: "220% ATK." }] },
  acidslug: { n: "Acid Slug", cls: "Caster", el: "Wind", m: { hp: .55, atk: .7, def: .55, spd: 96 },
    fig: { type: "slug", col: "#8ad06a", acc: "#e6ff6a" },
    skills: [{ slot: 1, name: "Acid Spit", cd: 0, target: "enemy", hits: 1, mult: 2.2, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .35, turns: 2 }], desc: "220% ATK. 35% chance of DEF Break (2T)." }] },
  sarkaz: { n: "Sarkaz Swordsman", cls: "Guard", el: "Dark", m: { hp: .9, atk: 1.0, def: .8, spd: 108 },
    fig: { type: "human", skin: "#d8ccc4", hair: "#2a2028", hs: "long", col: "#2a2228", col2: "#1e181c", acc: "#8a2a3a", boot: "#141014", cape: "#3a1a24", coat: 1, horns: "sarkaz", hornc: "#1a1216", eyec: "#ff4a4a", w: "saber", sc: "#ff4a6a" },
    skills: [{ slot: 1, name: "Grim Slash", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .3, turns: 2 }], desc: "300% ATK. 30% chance to Brand (2T)." },
      { slot: 2, name: "Bloodlust", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .2 }], desc: "Gain ATK Up (2T) and 20% turn meter." }] },
  wraith: { n: "Frost Wraith", cls: "Caster", el: "Water", m: { hp: .75, atk: .95, def: .6, spd: 104 },
    fig: { type: "hood", skin: "#d6e8ff", col: "#cfe0f2", col2: "#9fb8d2", cape: "#e6f2ff", eyes: "#5fd4ff", robe: 1, w: "none" },
    skills: [{ slot: 1, name: "Frost Lance", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .45, turns: 2 }], desc: "280% ATK. 45% chance to Slow (2T)." },
      { slot: 2, name: "Blizzard", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.8, effects: [{ on: "target", type: "atkbar-", amount: .15 }], desc: "Hits all enemies (180% ATK) and reduces turn meter by 15%." }] },
  // ---- named bosses ----
  crownslayer: { n: "Crownslayer", boss: 1, cls: "Specialist", el: "Wind", m: { hp: 2.4, atk: 1.15, def: .8, spd: 126 },
    fig: { type: "hood", skin: "#e8d6c4", col: "#2a2a30", col2: "#1e1e24", cape: "#c84a2a", eyes: "#ff8a3a", mask: 1, w: "dagger", sc: "#ff8a3a" },
    skills: [{ slot: 1, name: "Twin Daggers", cd: 0, target: "enemy", hits: 2, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .3, turns: 2 }], desc: "2 hits (160% each). 30% chance per hit to Burn." },
      { slot: 2, name: "Smoke Step", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "STEALTH", turns: 1 }, { on: "self", type: "atkbar+", amount: .4 }], desc: "Gain Stealth (1T) and 40% turn meter." },
      { slot: 3, name: "Crowning Strike", cd: 4, target: "enemy", hits: 1, mult: 4.4, ignoreDef: .3, effects: [{ on: "target", type: "debuff", what: "HEAL_BLOCK", chance: .8, turns: 2 }], desc: "440% ATK, ignoring 30% DEF. 80% chance of Heal Block." }] },
  skullshatterer: { n: "Skullshatterer", boss: 1, cls: "Sniper", el: "Fire", m: { hp: 2.8, atk: 1.1, def: 1.0, spd: 100 },
    fig: { type: "hood", skin: "#d9cbb8", col: "#5a5048", col2: "#3a342e", cape: "#4a3a30", eyes: "#ff6a3a", mask: 1, bulk: 1.3, h: 1.12, w: "rifle" },
    skills: [{ slot: 1, name: "Grenade Launcher", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .4, turns: 2 }], desc: "280% ATK. 40% chance of DEF Break." },
      { slot: 2, name: "Barrage", cd: 3, target: "aoe_enemies", hits: 2, mult: 1.4, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .35, turns: 2 }], desc: "Hits all enemies twice (140% each). 35% chance per hit to Burn." },
      { slot: 3, name: "Last Stand", cd: 5, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "shieldCasterHP", amount: .25, turns: 2 }], desc: "Gain ATK Up (2T) and a Shield (25% HP)." }] },
  mephisto: { n: "Mephisto", boss: 1, cls: "Medic", el: "Dark", m: { hp: 2.2, atk: 1.0, def: .8, spd: 110 },
    fig: { type: "human", skin: "#efe2d4", hair: "#e8e4f0", hs: "short", col: "#efe8f4", col2: "#b8a8c8", acc: "#8a5ad8", boot: "#3a2a48", robe: 1, w: "none" },
    skills: [{ slot: 1, name: "Corrupt Hymn", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "GLANCING", chance: .4, turns: 2 }], desc: "260% ATK. 40% chance of Glancing." },
      { slot: 2, name: "Infused Mending", cd: 2, target: "aoe_allies", effects: [{ on: "ally", type: "healFlatCasterHP", amount: .18 }, { on: "ally", type: "buff", what: "ATK_UP", turns: 2 }], desc: "Heal allies for 18% of Mephisto's HP and grant ATK Up." },
      { slot: 3, name: "Requiem", cd: 5, target: "team", effects: [{ on: "ally", type: "reviveOne", amount: .4 }, { on: "ally", type: "buff", what: "HOT", turns: 2 }], desc: "Revive an ally at 40% HP; team gains Heal over Time." }] },
  faust: { n: "Faust", boss: 1, cls: "Sniper", el: "Dark", m: { hp: 2.2, atk: 1.25, def: .75, spd: 112 },
    fig: { type: "hood", skin: "#e2d6c8", col: "#2a2e2a", col2: "#1e221e", cape: "#3a423a", eyes: "#9aff8a", w: "bowcaster" },
    skills: [{ slot: 1, name: "Arbalest", cd: 0, target: "enemy", hits: 1, mult: 3.4, ignoreDef: .2, effects: [], desc: "340% ATK, ignoring 20% DEF." },
      { slot: 2, name: "Vanishing Point", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "STEALTH", turns: 2 }, { on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }], desc: "Gain Stealth and Crit Rate Up (2T)." },
      { slot: 3, name: "Siege Ballista", cd: 4, target: "enemy", hits: 1, mult: 5.2, ignoreDef: .4, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .5, turns: 1 }], desc: "520% ATK, ignoring 40% DEF. 50% chance to Stun." }] },
  frostnova: { n: "FrostNova", boss: 1, cls: "Caster", el: "Water", m: { hp: 3.2, atk: 1.2, def: .9, spd: 112 },
    fig: { type: "hood", skin: "#f2ecf4", col: "#e6eef8", col2: "#b8c8dc", cape: "#f4f8ff", eyes: "#5fd4ff", robe: 1, w: "none" },
    skills: [{ slot: 1, name: "Winter's Touch", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .6, turns: 2 }], desc: "300% ATK. 60% chance to Slow." },
      { slot: 2, name: "Frozen Field", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.2, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .3, turns: 1 }, { on: "target", type: "atkbar-", amount: .2 }], desc: "Hits all enemies (220% ATK), -20% turn meter, 30% chance to Stun." },
      { slot: 3, name: "Eternal Winter", cd: 5, target: "aoe_enemies", hits: 2, mult: 2.0, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .8, turns: 2 }], desc: "Hits all enemies twice (200% each). 80% chance to Slow." }],
    passives: [{ id: "IMMUNE_LIST", list: ["STUN", "SILENCE", "PROVOKE"], text: "Immune to Stun, Silence and Provoke." }] },
  queenslug: { n: "Giant Originium Slug", boss: 1, cls: "Defender", el: "Water", m: { hp: 3.4, atk: 1.0, def: 1.2, spd: 92 },
    fig: { type: "slug", col: "#c89a5a", acc: "#5fd4ff", h: 1.8 },
    skills: [{ slot: 1, name: "Crush", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .2, turns: 1 }], desc: "280% ATK. 20% chance to Stun." },
      { slot: 2, name: "Originium Burst", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.0, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .5, turns: 2 }], desc: "Hits all enemies (200%). 50% chance to Burn." }] },
  centurion: { n: "Sarkaz Centurion", boss: 1, cls: "Guard", el: "Dark", m: { hp: 3.2, atk: 1.25, def: 1.0, spd: 106 },
    fig: { type: "human", skin: "#c8beb6", hair: "#1a1418", hs: "short", col: "#1e1a20", col2: "#141016", acc: "#c83a4a", boot: "#0e0c10", cape: "#5a1a2a", coat: 1, horns: "sarkaz", hornc: "#100c0e", eyec: "#ff3a3a", bulk: 1.25, h: 1.15, w: "greatsword", sc: "#ff3a5a" },
    skills: [{ slot: 1, name: "Cleave", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .5, turns: 2 }], desc: "320% ATK. 50% chance to Brand." },
      { slot: 2, name: "War Cry", cd: 3, target: "team", effects: [{ on: "ally", type: "buff", what: "ATK_UP", turns: 2 }, { on: "ally", type: "atkbar+", amount: .15 }], desc: "Allies gain ATK Up and 15% turn meter." },
      { slot: 3, name: "Doom Spin", cd: 4, target: "aoe_enemies", hits: 2, mult: 1.9, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "Hits all enemies twice (190% each), 50% chance of DEF Break." }] },
  yeti: { n: "Yeti Icecleaver", boss: 1, cls: "Guard", el: "Water", m: { hp: 3.4, atk: 1.15, def: 1.1, spd: 100 },
    fig: { type: "hood", skin: "#e6eef6", col: "#c8d4e0", col2: "#8aa0b8", cape: "#e6eef6", eyes: "#5fd4ff", mask: 1, h: 1.25, bulk: 1.35, w: "greatsword", sc: "#9fe0ff" },
    skills: [{ slot: 1, name: "Ice Cleaver", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .5, turns: 2 }], desc: "300% ATK. 50% chance to Slow." },
      { slot: 2, name: "Permafrost Armor", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "DEF_UP", turns: 2 }, { on: "self", type: "buff", what: "COUNTER", turns: 2 }], desc: "Gain DEF Up and Counter (2T)." },
      { slot: 3, name: "Avalanche", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .35, turns: 1 }], desc: "Hits all enemies (300%). 35% chance to Stun." }] },
};
// Arts RES (points) per enemy; enemy Casters and Medics deal Arts damage
const ENEMY_RES = { thrower: 10, caster: 30, shield: 10, acidslug: 20, sarkaz: 20, wraith: 30, crownslayer: 30, skullshatterer: 20,
  mephisto: 50, faust: 30, frostnova: 50, queenslug: 20, centurion: 30, yeti: 30 };
const ENEMY_V = { ATK_UP: .5, DEF_UP: .5, DEF_BREAK: .4 }; // enemy kits keep their original buff strengths
function prepEnemy(k) {
  const d = ENEMY[k]; d.key = k; d.enemy = true; d.passives = d.passives || []; d.runes = []; d.ares = ENEMY_RES[k] || 0;
  // Arts damage skips DEF, so Arts enemies hit with less ATK than before damage types existed
  if (ARTS_CLASSES.has(d.cls)) d.m = { ...d.m, atk: +(d.m.atk * .75).toFixed(3) };
  // slot 0 is the basic attack, as for operators; enemy multipliers are already in this game's turn scale
  for (const s of d.skills) {
    s.slot -= 1; if (s.slot === 0) s.basic = true; s.dmg = s.dmg || (ARTS_CLASSES.has(d.cls) ? "arts" : "phys");
    for (const e of s.effects || []) {
      if (e.on === "ally") e.on = "team";            // older enemy kits: "ally" meant the whole team
      if (e.type === "reviveOne") e.type = "revive";
      if (e.v == null && ENEMY_V[e.what]) e.v = ENEMY_V[e.what];
    }
  }
}
for (const k in ENEMY) prepEnemy(k);
// later parts (new story episodes) add their enemies with this: addEnemies({ key: def, … }, { key: RES points, … })
function addEnemies(defs, res = {}) {
  Object.assign(ENEMY_RES, res);
  for (const k in defs) { if (ENEMY[k]) throw new Error("duplicate enemy " + k); ENEMY[k] = defs[k]; prepEnemy(k); }
}
