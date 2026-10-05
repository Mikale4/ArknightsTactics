
// =====================================================================
//  OPERATOR KITS
//  Skill format follows the original game: {slot, name, cd, target, hits, mult, ignoreDef, effects[], desc}
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

// The original game's twelve hand-built kits (Ch'en is omitted: no art in the asset pack).
const FEATURED = {
  Exusiai: { stats: { hp: 9000, atk: 820, def: 420, spd: 118 }, leader: { stat: "ATK", amount: .24, scope: "Element", element: "Wind" }, runes: ["Swift", "Blade"], skills: [
    { slot: 1, name: "Angel's Volley", cd: 0, target: "enemy", hits: 3, mult: 1.3, effects: [{ on: "target", type: "atkbar-", chance: .5, amount: .1 }], desc: "3 hits (130% ATK). Each hit has a 50% chance to reduce the target's turn meter by 10%." },
    { slot: 2, name: "Reload", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }, { on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .3 }], desc: "Gain ATK Up and Crit Rate Up (2T) and 30% turn meter." },
    { slot: 3, name: "Heavenly Barrage", cd: 4, target: "enemy", hits: 5, mult: .7, ignoreDef: .2, effects: [{ on: "self", type: "atkbar+", amount: .05, perCrit: true }], desc: "5 hits (70% ATK), ignoring 20% DEF. Gain 5% turn meter per critical hit." }] },
  SilverAsh: { stats: { hp: 9800, atk: 750, def: 550, spd: 112 }, leader: { stat: "CR", amount: .24, scope: "All" }, runes: ["Violent", "Will"], skills: [
    { slot: 1, name: "Falcon Slash", cd: 0, target: "enemy", hits: 1, mult: 3.6, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "360% ATK. 50% chance to inflict DEF Break (2T)." },
    { slot: 2, name: "Eagle Eye", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }, { on: "self", type: "buff", what: "COUNTER", turns: 2 }], desc: "Gain ATK Up, Crit Rate Up and Counter (2T)." },
    { slot: 3, name: "Truesilver Slash", cd: 4, target: "aoe_enemies", hits: 3, mult: 1.1, effects: [{ on: "target", type: "strip", amount: 2, chance: 1 }, { on: "target", type: "debuff", what: "DEF_BREAK", chance: .6, turns: 2 }], desc: "Hits all enemies 3 times (110% each), removes 2 buffs, then 60% chance of DEF Break (2T)." }] },
  Surtr: { stats: { hp: 9200, atk: 880, def: 400, spd: 109 }, leader: { stat: "ATK", amount: .33, scope: "Element", element: "Fire" }, runes: ["Rage", "Will"],
    passives: [{ id: "REVIVE_ONCE", amount: .3, buff: "INVINCIBLE", turns: 1, text: "Last Embers: revives once at 30% HP and gains Invincible (1T)." }], skills: [
    { slot: 1, name: "Ember Edge", cd: 0, target: "enemy", hits: 1, mult: 3.4, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .3, turns: 2 }, { on: "self", type: "healPct", chance: .3, amount: .15 }], desc: "340% ATK. 30% chance to Burn (2T) and 30% chance to heal 15% HP." },
    { slot: 2, name: "Incinerate", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "IMMUNITY", turns: 1 }, { on: "self", type: "buff", what: "HOT", turns: 2 }, { on: "self", type: "atkbar+", amount: .2 }], desc: "Gain Immunity (1T), Heal over Time (2T) and 20% turn meter." },
    { slot: 3, name: "Eternal Flame", cd: 4, target: "enemy", hits: 1, mult: 4.0, ignoreDef: .3, effects: [{ on: "self", type: "buff", what: "INVINCIBLE", turns: 1, onKill: true }, { on: "self", type: "resetSelfCD", skill: 3, onKill: true }], desc: "400% ATK, ignoring 30% DEF. On a kill: gain Invincible (1T) and reset this skill." }] },
  Saria: { stats: { hp: 10500, atk: 650, def: 650, spd: 104 }, leader: { stat: "HP", amount: .33, scope: "All" }, runes: ["Energy", "Shield"], skills: [
    { slot: 1, name: "Restraint", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "PROVOKE", chance: .5, turns: 1 }], desc: "260% ATK. 50% chance to Provoke (1T)." },
    { slot: 2, name: "Calcification", cd: 3, target: "aoe_allies", effects: [{ on: "ally", type: "healFlatCasterHP", amount: .2 }, { on: "ally", type: "buff", what: "DEF_UP", turns: 2 }], desc: "Heal all allies for 20% of Saria's Max HP and grant DEF Up (2T)." },
    { slot: 3, name: "Order Restoration", cd: 4, target: "team", effects: [{ on: "ally", type: "cleanse", amount: 2 }, { on: "ally", type: "buff", what: "IMMUNITY", turns: 1 }, { on: "ally", type: "shieldCasterHP", amount: .2, turns: 2 }], desc: "Cleanse 2 debuffs and grant Immunity (1T) and a Shield (20% of Saria's HP, 2T) to all allies." }] },
  Ifrit: { stats: { hp: 8800, atk: 840, def: 480, spd: 106 }, leader: { stat: "ACC", amount: .4, scope: "All" }, runes: ["Focus", "Despair"], skills: [
    { slot: 1, name: "Heat Ray", cd: 0, target: "enemy", hits: 1, mult: 3.3, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .5, turns: 2 }], desc: "330% ATK. 50% chance to Brand (2T)." },
    { slot: 2, name: "Toxic Flame", cd: 3, target: "aoe_enemies", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .5, turns: 2 }], desc: "Hits all enemies twice (150% each). Each hit has a 50% chance to Burn (2T)." },
    { slot: 3, name: "Scorched Earth", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.8, effects: [{ on: "target", type: "atkbar-", amount: .2 }, { on: "target", type: "debuff", what: "HEAL_BLOCK", chance: 1, turns: 2 }], desc: "Hits all enemies (380% ATK), reduces turn meter by 20% and inflicts Heal Block (2T)." }] },
  Skadi: { stats: { hp: 8700, atk: 860, def: 450, spd: 115 }, leader: { stat: "CD", amount: .33, scope: "Element", element: "Water" }, runes: ["Fatal", "Blade"], skills: [
    { slot: 1, name: "Tidal Rush", cd: 0, target: "enemy", hits: 2, mult: 1.4, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .4, turns: 2 }], desc: "2 hits (140% each). 40% chance to Slow (2T)." },
    { slot: 2, name: "Deep Hunt", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .2 }], desc: "Gain ATK Up and Crit Rate Up (2T) and 20% turn meter." },
    { slot: 3, name: "Abyssal Strike", cd: 4, target: "enemy", hits: 1, mult: 4.2, effects: [{ on: "target", type: "bonusPerDebuff", cap: .5, per: .1 }], desc: "420% ATK. +10% damage per debuff on the target (up to +50%)." }] },
  Nightingale: { stats: { hp: 10200, atk: 620, def: 630, spd: 112 }, leader: { stat: "RES", amount: .41, scope: "All" }, runes: ["Swift", "Will"], skills: [
    { slot: 1, name: "Hymn", cd: 0, target: "enemy", hits: 1, mult: 2.2, effects: [{ on: "target", type: "debuff", what: "GLANCING", chance: .5, turns: 2 }], desc: "220% ATK. 50% chance to inflict Glancing (2T)." },
    { slot: 2, name: "Purifying Choir", cd: 3, target: "ally_single", effects: [{ on: "ally", type: "cleanse", amount: 2 }, { on: "ally", type: "healPctTarget", amount: .25 }], desc: "Cleanse 2 debuffs from an ally and heal them for 25% of their Max HP." },
    { slot: 3, name: "Sanctuary", cd: 5, target: "team", effects: [{ on: "ally", type: "reviveOne", amount: .3 }, { on: "ally", type: "buff", what: "IMMUNITY", turns: 2 }, { on: "ally", type: "buff", what: "HOT", turns: 2 }, { on: "ally", type: "shieldCasterHP", amount: .15, turns: 2 }], desc: "Revive one fallen ally at 30% HP, then grant the team Immunity and Heal over Time (2T) and a Shield (15% of Nightingale's HP)." }] },
  Angelina: { stats: { hp: 9300, atk: 700, def: 520, spd: 120 }, leader: { stat: "SPD", amount: .24, scope: "All" }, runes: ["Despair", "Focus"], skills: [
    { slot: 1, name: "Gravity Well", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "atkbar-", chance: .5, amount: .15 }], desc: "260% ATK. 50% chance to reduce turn meter by 15%." },
    { slot: 2, name: "Time Dilation", cd: 3, target: "team", effects: [{ on: "ally", type: "buff", what: "SPD_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .25 }], desc: "Grant the team SPD Up (2T). Angelina gains 25% turn meter." },
    { slot: 3, name: "Chrono Collapse", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .6, turns: 2 }, { on: "target", type: "atkbar-", amount: .2 }], desc: "Hits all enemies (320% ATK). 60% chance to Slow (2T) and reduces turn meter by 20%." }] },
  Lappland: { stats: { hp: 9100, atk: 780, def: 500, spd: 115 }, leader: { stat: "ATK", amount: .33, scope: "Element", element: "Dark" }, runes: ["Revenge", "Will"], skills: [
    { slot: 1, name: "Rending", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "HEAL_BLOCK", chance: .5, turns: 2 }], desc: "2 hits (150% each). 50% chance to inflict Heal Block (2T)." },
    { slot: 2, name: "Savage Lunge", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.2, effects: [{ on: "target", type: "debuff", what: "SILENCE", chance: .6, turns: 1 }], desc: "Hits all enemies (220% ATK). 60% chance to Silence (1T)." },
    { slot: 3, name: "Lupine Execution", cd: 4, target: "enemy", hits: 1, mult: 4.0, effects: [{ on: "self", type: "bonusIf", cond: "HEAL_BLOCK", bonusDmg: .3 }], desc: "400% ATK. +30% damage if the target has Heal Block." }] },
  Blaze: { stats: { hp: 9900, atk: 740, def: 570, spd: 111 }, leader: { stat: "DEF", amount: .33, scope: "Element", element: "Fire" }, runes: ["Guard", "Revenge"], skills: [
    { slot: 1, name: "Burning Drive", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .5, turns: 2 }], desc: "300% ATK. 50% chance to inflict ATK Down (2T)." },
    { slot: 2, name: "Overheat", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "shieldCasterHP", amount: .2, turns: 2 }, { on: "self", type: "buff", what: "COUNTER", turns: 2 }], desc: "Gain ATK Up (2T), a Shield (20% HP, 2T) and Counter (2T)." },
    { slot: 3, name: "Flame Cyclone", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.4, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "Hits all enemies (340% ATK). 50% chance of DEF Break (2T)." }] },
  Schwarz: { stats: { hp: 8600, atk: 900, def: 430, spd: 112 }, leader: { stat: "CR", amount: .24, scope: "Element", element: "Dark" }, runes: ["Fatal", "Rage"], skills: [
    { slot: 1, name: "Piercing Shot", cd: 0, target: "enemy", hits: 1, mult: 3.5, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .4, turns: 2 }], desc: "350% ATK. 40% chance to Slow (2T)." },
    { slot: 2, name: "Target Weakness", cd: 3, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: 1, turns: 2 }, { on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "260% ATK. Always Brands (2T); 50% chance of DEF Break (2T)." },
    { slot: 3, name: "Fatal Shot", cd: 4, target: "enemy", hits: 1, mult: 5.0, ignoreDef: .25, effects: [{ on: "self", type: "bonusIf", cond: "BRAND", bonusDmg: .3 }], desc: "500% ATK, ignoring 25% DEF. +30% damage if the target is Branded." }] },

  // ---- new hand-built kits ----
  Amiya: { stats: { hp: 9000, atk: 860, def: 460, spd: 113 }, leader: { stat: "ATK", amount: .2, scope: "All" }, runes: ["Focus", "Rage"], skills: [
    { slot: 1, name: "Arts Bolt", cd: 0, target: "enemy", hits: 2, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .35, turns: 2 }], desc: "2 hits (160% each). 35% chance per hit to inflict DEF Break (2T)." },
    { slot: 2, name: "Spirit Burst", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.4, effects: [{ on: "target", type: "atkbar-", amount: .15 }], desc: "Hits all enemies (240% ATK) and reduces their turn meter by 15%." },
    { slot: 3, name: "Chimera", cd: 5, target: "enemy", hits: 6, mult: .9, ignoreDef: 1, effects: [{ on: "self", type: "atkbar+", amount: .05, perCrit: true }], desc: "6 hits (90% each) that ignore DEF entirely. Gain 5% turn meter per critical hit." }] },
  Texas: { stats: { hp: 9400, atk: 760, def: 500, spd: 124 }, leader: { stat: "SPD", amount: .2, scope: "All" }, runes: ["Swift", "Violent"], skills: [
    { slot: 1, name: "Swordrain Cut", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .15, turns: 1 }], desc: "2 hits (150% each). 15% chance per hit to Stun (1T)." },
    { slot: 2, name: "Tactical Delivery", cd: 4, target: "team", effects: [{ on: "ally", type: "atkbar+", amount: .2 }], desc: "All allies gain 20% turn meter." },
    { slot: 3, name: "Sword Rain", cd: 4, target: "aoe_enemies", hits: 2, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .35, turns: 1 }], desc: "Hits all enemies twice (160% each). 35% chance per hit to Stun (1T)." }] },
  Hoshiguma: { stats: { hp: 11800, atk: 640, def: 720, spd: 102 }, leader: { stat: "DEF", amount: .3, scope: "All" }, runes: ["Guard", "Revenge"], skills: [
    { slot: 1, name: "Oni Guard", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "self", type: "atkbar+", amount: .1 }], desc: "260% ATK. Gain 10% turn meter." },
    { slot: 2, name: "Thorny Shield", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "TAUNT", turns: 2 }, { on: "self", type: "buff", what: "COUNTER", turns: 2 }, { on: "self", type: "buff", what: "DEF_UP", turns: 2 }], desc: "Gain Taunt, Counter and DEF Up (2T)." },
    { slot: 3, name: "Saga of the Oni", cd: 4, target: "team", effects: [{ on: "ally", type: "shieldCasterHP", amount: .22, turns: 2 }, { on: "ally", type: "buff", what: "DEF_UP", turns: 2 }], desc: "Grant all allies a Shield (22% of Hoshiguma's HP) and DEF Up (2T)." }] },
  Eyjafjalla: { stats: { hp: 8600, atk: 900, def: 450, spd: 108 }, leader: { stat: "ATK", amount: .33, scope: "Element", element: "Fire" }, runes: ["Fatal", "Focus"], skills: [
    { slot: 1, name: "Magma Shot", cd: 0, target: "enemy", hits: 1, mult: 3.4, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .5, turns: 2 }], desc: "340% ATK. 50% chance to Burn (2T)." },
    { slot: 2, name: "Ignition", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .35 }], desc: "Gain ATK Up (2T) and 35% turn meter." },
    { slot: 3, name: "Volcano", cd: 5, target: "aoe_enemies", hits: 3, mult: 1.4, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .45, turns: 2 }, { on: "target", type: "bonusPerDebuff", per: .08, cap: .4 }], desc: "Hits all enemies 3 times (140% each), 45% chance per hit to Burn. +8% damage per debuff on the target." }] },
  Mostima: { stats: { hp: 8800, atk: 830, def: 470, spd: 111 }, leader: { stat: "SPD", amount: .19, scope: "All" }, runes: ["Swift", "Despair"], skills: [
    { slot: 1, name: "Key of Chronology", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "atkbar-", chance: .6, amount: .15 }], desc: "300% ATK. 60% chance to reduce turn meter by 15%." },
    { slot: 2, name: "Lock of Control", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.0, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .7, turns: 2 }], desc: "Hits all enemies (200% ATK). 70% chance to Slow (2T)." },
    { slot: 3, name: "Fallen Halo", cd: 5, target: "aoe_enemies", hits: 1, mult: 3.4, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .4, turns: 1 }, { on: "target", type: "atkbar-", amount: .25 }], desc: "Hits all enemies (340% ATK), reduces turn meter by 25%, 40% chance to Stun (1T)." }] },
  Thorns: { stats: { hp: 9600, atk: 800, def: 520, spd: 110 }, leader: { stat: "HP", amount: .25, scope: "All" }, runes: ["Revenge", "Energy"], passives: [{ id: "LIFESTEAL", amount: .15, text: "Heals for 15% of damage dealt." }], skills: [
    { slot: 1, name: "Toxic Blade", cd: 0, target: "enemy", hits: 1, mult: 3.1, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .6, turns: 2 }], desc: "310% ATK. 60% chance to Burn (2T)." },
    { slot: 2, name: "Defensive Stance", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "COUNTER", turns: 2 }, { on: "self", type: "healPct", amount: .2 }], desc: "Gain Counter (2T) and heal 20% HP." },
    { slot: 3, name: "Destreza", cd: 4, target: "enemy", hits: 3, mult: 1.5, effects: [{ on: "target", type: "bonusIf", cond: "DOT", bonusDmg: .35 }], desc: "3 hits (150% each). +35% damage against Burning targets." }] },
  Ptilopsis: { stats: { hp: 9800, atk: 600, def: 600, spd: 116 }, leader: { stat: "RES", amount: .3, scope: "All" }, runes: ["Swift", "Energy"], skills: [
    { slot: 1, name: "Alarm Pulse", cd: 0, target: "enemy", hits: 1, mult: 2.3, effects: [{ on: "self", type: "atkbar+", amount: .1 }], desc: "230% ATK. Gain 10% turn meter." },
    { slot: 2, name: "Night Shift", cd: 2, target: "ally_single", effects: [{ on: "ally", type: "healPctTarget", amount: .3 }, { on: "ally", type: "buff", what: "HOT", turns: 2 }], desc: "Heal an ally for 30% of their Max HP and grant Heal over Time (2T)." },
    { slot: 3, name: "Dawn Chorus", cd: 4, target: "aoe_allies", effects: [{ on: "ally", type: "healFlatCasterHP", amount: .3 }, { on: "ally", type: "cleanse", amount: 1 }, { on: "ally", type: "atkbar+", amount: .1 }], desc: "Heal all allies for 30% of Ptilopsis's Max HP, cleanse 1 debuff and grant 10% turn meter." }] },
  Specter: { stats: { hp: 10000, atk: 790, def: 500, spd: 108 }, leader: { stat: "HP", amount: .2, scope: "Element", element: "Dark" }, runes: ["Energy", "Rage"],
    passives: [{ id: "REVIVE_ONCE", amount: .25, buff: "INVINCIBLE", turns: 1, text: "Unholy Vow: revives once at 25% HP with Invincible (1T)." }], skills: [
    { slot: 1, name: "Chainsaw Swing", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .3, turns: 2 }], desc: "300% ATK. 30% chance to Brand (2T)." },
    { slot: 2, name: "Bone Fracture", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "Hits all enemies (240% ATK). 50% chance of DEF Break (2T)." },
    { slot: 3, name: "Undying Will", cd: 5, target: "self", effects: [{ on: "self", type: "buff", what: "INVINCIBLE", turns: 1 }, { on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .5 }], desc: "Gain Invincible (1T), ATK Up (2T) and 50% turn meter." }] },
  Nearl: { stats: { hp: 10800, atk: 660, def: 680, spd: 105 }, leader: { stat: "HP", amount: .25, scope: "All" }, runes: ["Energy", "Will"], skills: [
    { slot: 1, name: "Shield Bash", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .4, turns: 2 }], desc: "260% ATK. 40% chance to inflict ATK Down (2T)." },
    { slot: 2, name: "First Aid", cd: 3, target: "aoe_allies", effects: [{ on: "ally", type: "healFlatCasterHP", amount: .18 }], desc: "Heal all allies for 18% of Nearl's Max HP." },
    { slot: 3, name: "Kazimierz Knight", cd: 4, target: "team", effects: [{ on: "ally", type: "buff", what: "DEF_UP", turns: 2 }, { on: "ally", type: "buff", what: "IMMUNITY", turns: 1 }, { on: "self", type: "buff", what: "TAUNT", turns: 2 }], desc: "Team gains DEF Up (2T) and Immunity (1T). Nearl gains Taunt (2T)." }] },
  Mudrock: { stats: { hp: 11500, atk: 700, def: 700, spd: 101 }, leader: { stat: "DEF", amount: .3, scope: "Element", element: "Fire" }, runes: ["Shield", "Guard"], skills: [
    { slot: 1, name: "Earthen Hammer", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .2, turns: 1 }], desc: "280% ATK. 20% chance to Stun (1T)." },
    { slot: 2, name: "Rock Armor", cd: 3, target: "self", effects: [{ on: "self", type: "shieldCasterHP", amount: .3, turns: 2 }, { on: "self", type: "buff", what: "TAUNT", turns: 2 }], desc: "Gain a Shield (30% HP, 2T) and Taunt (2T)." },
    { slot: 3, name: "Bloodline of Desecrated Earth", cd: 5, target: "aoe_enemies", hits: 2, mult: 1.8, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .35, turns: 1 }], desc: "Hits all enemies twice (180% each). 35% chance per hit to Stun (1T)." }] },
  Suzuran: { stats: { hp: 9300, atk: 640, def: 540, spd: 118 }, leader: { stat: "RES", amount: .35, scope: "All" }, runes: ["Swift", "Will"], skills: [
    { slot: 1, name: "Foxfire", cd: 0, target: "enemy", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .5, turns: 2 }], desc: "240% ATK. 50% chance to Slow (2T)." },
    { slot: 2, name: "Small Blessing", cd: 3, target: "team", effects: [{ on: "ally", type: "cleanse", amount: 1 }, { on: "ally", type: "buff", what: "HOT", turns: 2 }], desc: "Cleanse 1 debuff from all allies and grant Heal over Time (2T)." },
    { slot: 3, name: "Lullabye", cd: 5, target: "aoe_enemies", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .8, turns: 2 }, { on: "target", type: "debuff", what: "STUN", chance: .35, turns: 1 }], desc: "Hits all enemies (240% ATK). 80% chance to Slow (2T) and 35% chance to Stun (1T)." }] },
  Mountain: { stats: { hp: 10400, atk: 760, def: 560, spd: 113 }, leader: { stat: "HP", amount: .2, scope: "All" }, runes: ["Energy", "Revenge"], passives: [{ id: "LIFESTEAL", amount: .2, text: "Heals for 20% of damage dealt." }], skills: [
    { slot: 1, name: "Fist Combo", cd: 0, target: "enemy", hits: 3, mult: 1.1, effects: [{ on: "target", type: "atkbar-", chance: .2, amount: .05 }], desc: "3 hits (110% each). 20% chance per hit to reduce turn meter by 5%." },
    { slot: 2, name: "Steady Breathing", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "DEF_UP", turns: 2 }, { on: "self", type: "buff", what: "COUNTER", turns: 2 }], desc: "Gain DEF Up and Counter (2T)." },
    { slot: 3, name: "Earth-Shaker", cd: 4, target: "aoe_enemies", hits: 2, mult: 1.7, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .4, turns: 2 }], desc: "Hits all enemies twice (170% each). 40% chance per hit of DEF Break (2T)." }] },
  Bagpipe: { stats: { hp: 9700, atk: 780, def: 520, spd: 115 }, leader: { stat: "ATK", amount: .2, scope: "All" }, runes: ["Swift", "Fatal"], passives: [{ id: "TEAM_ATB_ON_KILL", amount: .1, text: "Tactical Uplift: on a kill, all allies gain 10% turn meter." }], skills: [
    { slot: 1, name: "Lance Thrust", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [], desc: "2 hits (150% each)." },
    { slot: 2, name: "Rally Formation", cd: 4, target: "team", effects: [{ on: "ally", type: "atkbar+", amount: .2 }, { on: "ally", type: "buff", what: "ATK_UP", turns: 2 }], desc: "All allies gain 20% turn meter and ATK Up (2T)." },
    { slot: 3, name: "High-Impact Assault", cd: 4, target: "enemy", hits: 3, mult: 1.6, ignoreDef: .15, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "3 hits (160% each), ignoring 15% DEF. 50% chance per hit of DEF Break (2T)." }] },
  Ash: { stats: { hp: 8600, atk: 880, def: 440, spd: 115 }, leader: { stat: "CR", amount: .24, scope: "All" }, runes: ["Blade", "Rage"], skills: [
    { slot: 1, name: "Assault Fire", cd: 0, target: "enemy", hits: 3, mult: 1.2, effects: [], desc: "3 hits (120% each)." },
    { slot: 2, name: "Flashbang", cd: 4, target: "aoe_enemies", hits: 1, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .5, turns: 1 }], desc: "Hits all enemies (160% ATK). 50% chance to Stun (1T)." },
    { slot: 3, name: "Breach Assault", cd: 4, target: "enemy", hits: 8, mult: .6, effects: [{ on: "self", type: "bonusIf", cond: "STUN", bonusDmg: .6, bonusCrit: .3 }], desc: "8 hits (60% each). Against Stunned targets: +60% damage and +30% Crit Rate." }] },
  Kroos: { stats: { hp: 8200, atk: 820, def: 420, spd: 112 }, runes: ["Fatal", "Blade"], skills: [
    { slot: 1, name: "Double Tap", cd: 0, target: "enemy", hits: 2, mult: 1.6, effects: [], desc: "2 hits (160% each)." },
    { slot: 2, name: "Steady Aim", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .25 }], desc: "Gain Crit Rate Up (2T) and 25% turn meter." },
    { slot: 3, name: "Hailstorm", cd: 4, target: "aoe_enemies", hits: 2, mult: 1.4, effects: [], desc: "Hits all enemies twice (140% each)." }] },
  Melantha: { stats: { hp: 9000, atk: 860, def: 460, spd: 110 }, runes: ["Fatal", "Energy"], skills: [
    { slot: 1, name: "Drain Cut", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "self", type: "healPct", chance: .4, amount: .1 }], desc: "320% ATK. 40% chance to heal 10% HP." },
    { slot: 2, name: "Blood Focus", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }], desc: "Gain ATK Up (2T)." },
    { slot: 3, name: "Crimson Edge", cd: 4, target: "enemy", hits: 1, mult: 4.4, effects: [{ on: "self", type: "bonusPerDebuff", per: .1, cap: .3 }], desc: "440% ATK. +10% damage per debuff on the target (up to +30%)." }] },
  Fang: { stats: { hp: 9400, atk: 700, def: 520, spd: 118 }, runes: ["Swift", "Energy"], skills: [
    { slot: 1, name: "Spear Charge", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "self", type: "atkbar+", amount: .1 }], desc: "280% ATK. Gain 10% turn meter." },
    { slot: 2, name: "Spur", cd: 4, target: "team", effects: [{ on: "ally", type: "atkbar+", amount: .15 }], desc: "All allies gain 15% turn meter." },
    { slot: 3, name: "Charging Mode", cd: 4, target: "enemy", hits: 2, mult: 2.0, effects: [{ on: "target", type: "atkbar-", amount: .2 }], desc: "2 hits (200% each). Reduces the target's turn meter by 20%." }] },
  Ansel: { stats: { hp: 9600, atk: 560, def: 580, spd: 110 }, runes: ["Energy", "Will"], skills: [
    { slot: 1, name: "Gentle Strike", cd: 0, target: "enemy", hits: 1, mult: 2.0, effects: [], desc: "200% ATK." },
    { slot: 2, name: "Healing Range", cd: 2, target: "ally_single", effects: [{ on: "ally", type: "healPctTarget", amount: .32 }], desc: "Heal an ally for 32% of their Max HP." },
    { slot: 3, name: "Medic Kit", cd: 4, target: "aoe_allies", effects: [{ on: "ally", type: "healFlatCasterHP", amount: .22 }, { on: "ally", type: "cleanse", amount: 1 }], desc: "Heal all allies for 22% of Ansel's Max HP and cleanse 1 debuff." }] },
  Ling: { stats: { hp: 9600, atk: 760, def: 520, spd: 116 }, leader: { stat: "ATK", amount: .24, scope: "All" }, runes: ["Swift", "Focus"], skills: [
    { slot: 1, name: "Summoned Dragon", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .3, turns: 2 }], desc: "2 hits (150% each). 30% chance per hit to Slow (2T)." },
    { slot: 2, name: "Ink and Wash", cd: 3, target: "team", effects: [{ on: "ally", type: "buff", what: "ATK_UP", turns: 2 }, { on: "ally", type: "buff", what: "CRIT_RATE_UP", turns: 2 }], desc: "Grant the team ATK Up and Crit Rate Up (2T)." },
    { slot: 3, name: "Where the Sky Ends", cd: 5, target: "aoe_enemies", hits: 3, mult: 1.5, effects: [{ on: "target", type: "atkbar-", amount: .1 }], desc: "Hits all enemies 3 times (150% each), reducing turn meter by 10% per hit." }] },
  Weedy: { stats: { hp: 9900, atk: 780, def: 520, spd: 112 }, leader: { stat: "HP", amount: .2, scope: "Element", element: "Water" }, runes: ["Energy", "Despair"], skills: [
    { slot: 1, name: "Water Cannon", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "atkbar-", chance: .5, amount: .15 }], desc: "300% ATK. 50% chance to reduce turn meter by 15%." },
    { slot: 2, name: "Torrent", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.2, effects: [{ on: "target", type: "atkbar-", amount: .2 }], desc: "Hits all enemies (220% ATK) and reduces turn meter by 20%." },
    { slot: 3, name: "Tidal Burst", cd: 5, target: "aoe_enemies", hits: 1, mult: 3.4, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .4, turns: 1 }], desc: "Hits all enemies (340% ATK). 40% chance to Stun (1T)." }] },
  Ceobe: { stats: { hp: 8700, atk: 880, def: 450, spd: 113 }, leader: { stat: "ACC", amount: .3, scope: "All" }, runes: ["Fatal", "Violent"], skills: [
    { slot: 1, name: "Axe Toss", cd: 0, target: "enemy", hits: 2, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .15, turns: 1 }], desc: "2 hits (160% each). 15% chance per hit to Stun (1T)." },
    { slot: 2, name: "Pocket Snacks", cd: 3, target: "self", effects: [{ on: "self", type: "healPct", amount: .2 }, { on: "self", type: "atkbar+", amount: .3 }], desc: "Heal 20% HP and gain 30% turn meter." },
    { slot: 3, name: "Bona Fide Caster", cd: 4, target: "enemy", hits: 5, mult: .9, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .3, turns: 2 }], desc: "5 hits (90% each). 30% chance per hit of DEF Break (2T)." }] },
  Siege: { stats: { hp: 10000, atk: 800, def: 560, spd: 113 }, leader: { stat: "ATK", amount: .25, scope: "All" }, runes: ["Fatal", "Swift"], skills: [
    { slot: 1, name: "Hammer Smash", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .35, turns: 2 }], desc: "320% ATK. 35% chance of DEF Break (2T)." },
    { slot: 2, name: "Lionheart", cd: 4, target: "team", effects: [{ on: "ally", type: "atkbar+", amount: .2 }, { on: "self", type: "buff", what: "ATK_UP", turns: 2 }], desc: "All allies gain 20% turn meter. Siege gains ATK Up (2T)." },
    { slot: 3, name: "Royal Execution", cd: 4, target: "enemy", hits: 1, mult: 5.0, ignoreDef: .3, effects: [{ on: "self", type: "atkbar+", amount: .5, onKill: true }], desc: "500% ATK, ignoring 30% DEF. On a kill, gain 50% turn meter." }] },
};

// ---------- deterministic class templates for every other operator ----------
const TEMPLATE = {
  Vanguard: (r, el) => [
    { slot: 1, name: "Charge Strike", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "atkbar-", chance: .4, amount: .1 }], desc: "300% ATK. 40% chance to reduce turn meter by 10%." },
    { slot: 2, name: "Tactical Deployment", cd: 4, target: "team", effects: [{ on: "ally", type: "atkbar+", amount: .15 }, { on: "ally", type: "buff", what: "SPD_UP", turns: 2 }], desc: "All allies gain 15% turn meter and SPD Up (2T)." },
    r() < .5 ? { slot: 3, name: "Spearhead", cd: 4, target: "enemy", hits: 2, mult: 1.9, ignoreDef: .2, effects: [{ on: "self", type: "atkbar+", amount: .3 }], desc: "2 hits (190% each), ignoring 20% DEF. Gain 30% turn meter." }
      : { slot: 3, name: "Breakthrough", cd: 4, target: "aoe_enemies", hits: 1, mult: 2.6, effects: [{ on: "target", type: "atkbar-", amount: .15 }], desc: "Hits all enemies (260% ATK) and reduces turn meter by 15%." }],
  Guard: (r, el) => [
    { slot: 1, name: "Blade Strike", cd: 0, target: "enemy", hits: 2, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .3, turns: 2 }], desc: "2 hits (160% each). 30% chance per hit of DEF Break (2T)." },
    { slot: 2, name: "Battle Focus", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .2 }], desc: "Gain ATK Up and Crit Rate Up (2T) and 20% turn meter." },
    r() < .5 ? { slot: 3, name: "Decisive Cut", cd: 4, target: "enemy", hits: 1, mult: 4.2, effects: [{ on: "target", type: "bonusPerDebuff", per: .1, cap: .5 }], desc: "420% ATK. +10% damage per debuff on the target (up to +50%)." }
      : { slot: 3, name: "Whirlwind", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .5, turns: 2 }], desc: "Hits all enemies (300% ATK). 50% chance of DEF Break (2T)." }],
  Defender: (r, el) => [
    { slot: 1, name: "Shield Strike", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "PROVOKE", chance: .4, turns: 1 }], desc: "260% ATK. 40% chance to Provoke (1T)." },
    { slot: 2, name: "Iron Wall", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "TAUNT", turns: 2 }, { on: "self", type: "buff", what: "DEF_UP", turns: 2 }, { on: "self", type: "shieldCasterHP", amount: .15, turns: 2 }], desc: "Gain Taunt and DEF Up (2T) and a Shield (15% HP)." },
    r() < .5 ? { slot: 3, name: "Bulwark", cd: 4, target: "team", effects: [{ on: "ally", type: "buff", what: "DEF_UP", turns: 2 }, { on: "ally", type: "shieldCasterHP", amount: .12, turns: 2 }], desc: "Team gains DEF Up (2T) and a Shield (12% of this operator's HP)." }
      : { slot: 3, name: "Shockwave", cd: 4, target: "aoe_enemies", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .6, turns: 2 }], desc: "Hits all enemies (240% ATK). 60% chance of ATK Down (2T)." }],
  Sniper: (r, el) => [
    { slot: 1, name: "Precise Shot", cd: 0, target: "enemy", hits: 1, mult: 3.4, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .3, turns: 2 }], desc: "340% ATK. 30% chance to Slow (2T)." },
    { slot: 2, name: "Mark Target", cd: 3, target: "enemy", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: 1, turns: 2 }], desc: "240% ATK. Always Brands (2T)." },
    r() < .5 ? { slot: 3, name: "Lethal Shot", cd: 4, target: "enemy", hits: 1, mult: 4.8, ignoreDef: .25, effects: [{ on: "self", type: "bonusIf", cond: "BRAND", bonusDmg: .3 }], desc: "480% ATK, ignoring 25% DEF. +30% damage against Branded targets." }
      : { slot: 3, name: "Arrow Rain", cd: 4, target: "aoe_enemies", hits: 3, mult: 1.0, effects: [], desc: "Hits all enemies 3 times (100% each)." }],
  Caster: (r, el) => [
    { slot: 1, name: "Arts Shot", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .3, turns: 2 }], desc: "320% ATK. 30% chance to Burn (2T)." },
    { slot: 2, name: "Arts Storm", cd: 3, target: "aoe_enemies", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .35, turns: 2 }], desc: "Hits all enemies twice (150% each). 35% chance per hit to Burn (2T)." },
    r() < .5 ? { slot: 3, name: "Arts Cataclysm", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.5, effects: [{ on: "target", type: "atkbar-", amount: .2 }], desc: "Hits all enemies (350% ATK) and reduces turn meter by 20%." }
      : { slot: 3, name: "Focused Annihilation", cd: 4, target: "enemy", hits: 1, mult: 4.6, ignoreDef: .3, effects: [{ on: "target", type: "debuff", what: "HEAL_BLOCK", chance: .7, turns: 2 }], desc: "460% ATK, ignoring 30% DEF. 70% chance of Heal Block (2T)." }],
  Medic: (r, el) => [
    { slot: 1, name: "Arts Pulse", cd: 0, target: "enemy", hits: 1, mult: 2.2, effects: [{ on: "target", type: "debuff", what: "GLANCING", chance: .3, turns: 2 }], desc: "220% ATK. 30% chance to inflict Glancing (2T)." },
    { slot: 2, name: "Triage", cd: 2, target: "ally_single", effects: [{ on: "ally", type: "healPctTarget", amount: .3 }, { on: "ally", type: "cleanse", amount: 1 }], desc: "Heal an ally for 30% of their Max HP and cleanse 1 debuff." },
    { slot: 3, name: "Field Hospital", cd: 4, target: "aoe_allies", effects: [{ on: "ally", type: "healFlatCasterHP", amount: .22 }, { on: "ally", type: "buff", what: "HOT", turns: 2 }], desc: "Heal all allies for 22% of this operator's Max HP and grant Heal over Time (2T)." }],
  Supporter: (r, el) => [
    { slot: 1, name: "Arts Wave", cd: 0, target: "enemy", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .45, turns: 2 }], desc: "240% ATK. 45% chance to Slow (2T)." },
    r() < .5 ? { slot: 2, name: "Encourage", cd: 3, target: "team", effects: [{ on: "ally", type: "buff", what: "ATK_UP", turns: 2 }, { on: "ally", type: "atkbar+", amount: .1 }], desc: "Team gains ATK Up (2T) and 10% turn meter." }
      : { slot: 2, name: "Haste", cd: 3, target: "team", effects: [{ on: "ally", type: "buff", what: "SPD_UP", turns: 2 }, { on: "ally", type: "atkbar+", amount: .1 }], desc: "Team gains SPD Up (2T) and 10% turn meter." },
    { slot: 3, name: "Arts Prison", cd: 4, target: "aoe_enemies", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .6, turns: 2 }, { on: "target", type: "atkbar-", amount: .2 }], desc: "Hits all enemies (260% ATK), reduces turn meter by 20%, 60% chance to Slow (2T)." }],
  Specialist: (r, el) => [
    { slot: 1, name: "Swift Strike", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [{ on: "target", type: "atkbar-", chance: .3, amount: .1 }], desc: "2 hits (150% each). 30% chance per hit to reduce turn meter by 10%." },
    { slot: 2, name: "Vanish", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "STEALTH", turns: 2 }, { on: "self", type: "atkbar+", amount: .25 }], desc: "Gain Stealth (2T) and 25% turn meter." },
    { slot: 3, name: "Ambush", cd: 4, target: "enemy", hits: 1, mult: 4.0, effects: [{ on: "target", type: "strip", amount: 2, chance: 1 }, { on: "target", type: "debuff", what: "STUN", chance: .3, turns: 1 }], desc: "400% ATK. Removes 2 buffs; 30% chance to Stun (1T)." }],
};
const TPL_PASSIVES = [
  null, null,
  { id: "LIFESTEAL", amount: .15, text: "Heals for 15% of damage dealt." },
  { id: "TEAM_ATB_START", amount: .1, text: "All allies start battle with 10% turn meter." },
  { id: "REVIVE_ONCE", amount: .25, buff: "INVINCIBLE", turns: 1, text: "Revives once at 25% HP with Invincible (1T)." },
  { id: "IMMUNE_LIST", list: ["STUN", "SILENCE"], text: "Immune to Stun and Silence." },
];
const RAR_MULT = { 1: .62, 2: .68, 3: .76, 4: .84, 5: .92, 6: 1 };

// ---------- build the operator table ----------
const OPS = {};
const OP_KEYS = [];
for (const line of ROSTER_RAW.split("\n")) {
  const [n, slug, rar, cls, el, asp] = line.split("|");
  const f = FEATURED[n], rng = seeded(hash(n + "kit"));
  const base = CLASS_BASE[cls];
  const spread = k => Math.round(base[k] * (1 + (rng() - .5) * .08));
  const op = { key: slug, n, slug, rar: +rar, cls, el, asp: +asp, featured: !!f,
    stats: f ? { ...base, ...f.stats } : { hp: spread("hp"), atk: spread("atk"), def: spread("def"), spd: base.spd + Math.round((rng() - .5) * 8) },
    skills: f ? f.skills : TEMPLATE[cls](rng, el),
    leader: f ? (f.leader || null) : +rar >= 4 ? { ...CLASS_LEADER[cls], element: el } : null,
    passives: f ? (f.passives || []) : +rar >= 6 ? [TPL_PASSIVES[Math.floor(rng() * TPL_PASSIVES.length)]].filter(Boolean) : [],
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
for (const k in ENEMY) { ENEMY[k].key = k; ENEMY[k].enemy = true; ENEMY[k].passives = ENEMY[k].passives || []; ENEMY[k].runes = []; }
