
// =====================================================================
//  CHARACTERS — kits, figures and roles for the Melty Blood cast.
//  Skill format: {slot, name, cd, target, hits, mult, ignoreDef, effects[]}; S3 is an Arc Drive that
//  costs 100% Magic Circuit instead of a cooldown. Descriptions are generated from the data (see skillDesc).
// =====================================================================
const dbf = (what, chance = 1, turns = 2) => ({ on: "target", type: "debuff", what, chance, turns });
const tmDown = (amount, chance) => ({ on: "target", type: "atkbar-", amount, chance });
const strip = (amount = 1) => ({ on: "target", type: "strip", amount, chance: 1 });
const aoeDbf = (what, chance = 1, turns = 2) => ({ on: "aoe_enemies", type: "debuff", what, chance, turns });
const selfBuff = (what, turns = 2) => ({ on: "self", type: "buff", what, turns });
const selfGain = amount => ({ on: "self", type: "atkbar+", amount });
const selfHeal = (amount, chance) => ({ on: "self", type: "healPct", amount, chance });
const selfShield = (amount, turns = 2) => ({ on: "self", type: "shieldCasterHP", amount, turns });
const teamBuff = (what, turns = 2) => ({ on: "ally", type: "buff", what, turns });
const teamGain = amount => ({ on: "ally", type: "atkbar+", amount });
const teamHeal = amount => ({ on: "ally", type: "healFlatCasterHP", amount });
const teamShield = (amount, turns = 2) => ({ on: "ally", type: "shieldCasterHP", amount, turns });
const cleanse = amount => ({ on: "ally", type: "cleanse", amount });
const revive = amount => ({ on: "ally", type: "reviveOne", amount });
const perDebuff = (per, cap) => ({ on: "target", type: "bonusPerDebuff", per, cap });
const bonusVs = (cond, bonusDmg, bonusCrit = 0) => ({ on: "target", type: "bonusIf", cond, bonusDmg, bonusCrit });
const atk = (slot, name, target, hits, mult, effects = [], x = {}) => ({ slot, name, cd: slot === 1 ? 0 : 3, target, hits, mult, effects, ...x });
const sup = (slot, name, target, effects, x = {}) => ({ slot, name, cd: slot === 1 ? 0 : 3, target, effects, ...x });

// ---------- generated skill text ----------
const P = v => Math.round(v * 100) + "%";
function skillDesc(sk) {
  const out = [], E = sk.effects || [], multi = (sk.hits || 1) > 1;
  if (sk.mult > 0) {
    let s = sk.target === "aoe_enemies" ? (multi ? `Hits all enemies ${sk.hits} times (${P(sk.mult)} ATK each)` : `Hits all enemies (${P(sk.mult)} ATK)`)
      : multi ? `${sk.hits} hits (${P(sk.mult)} ATK each)` : `${P(sk.mult)} ATK`;
    if (sk.ignoreDef) s += sk.ignoreDef >= 1 ? ", ignoring DEF" : `, ignoring ${P(sk.ignoreDef)} DEF`;
    out.push(s);
  }
  for (const e of E) {
    const ch = e.chance != null && e.chance < 1 ? `${P(e.chance)} chance${multi && e.on === "target" ? " per hit" : ""} to ` : "";
    const T = e.turns ? ` (${e.turns}T)` : "";
    const nm = e.what && FX[e.what] ? FX[e.what].n : "";
    if (e.type === "debuff") out.push(ch ? `${ch}inflict ${nm}${T}${e.on === "aoe_enemies" ? " on all enemies" : ""}` : `Inflicts ${nm}${T}${e.on === "aoe_enemies" ? " on all enemies" : ""}`);
    else if (e.type === "atkbar-") out.push(ch ? `${ch}reduce turn meter by ${P(e.amount)}` : `Reduces turn meter by ${P(e.amount)}`);
    else if (e.type === "strip") out.push(`Removes ${e.amount} buff${e.amount > 1 ? "s" : ""}`);
    else if (e.type === "bonusPerDebuff") out.push(`+${P(e.per)} damage per debuff on the target (up to +${P(e.cap)})`);
    else if (e.type === "bonusIf") out.push(`+${P(e.bonusDmg)} damage against targets with ${FX[e.cond].n}`);
    else if (e.type === "buff") out.push(`${e.on === "self" ? "Gains" : sk.target === "ally_single" ? "Grants the ally" : "Grants all allies"} ${nm}${T}`);
    else if (e.type === "taunt") out.push(`Gains Taunt${T}`);
    else if (e.type === "atkbar+") out.push(`${e.on === "self" ? (e.onKill ? "On a kill, gains" : "Gains") : "All allies gain"} ${P(e.amount)} turn meter${e.perCrit ? " per critical hit" : ""}`);
    else if (e.type === "healPct") out.push(ch ? `${ch}heal ${P(e.amount)} of Max HP` : `Heals ${P(e.amount)} of Max HP`);
    else if (e.type === "healPctTarget") out.push(`Heals ${sk.target === "ally_single" ? "the ally" : "all allies"} for ${P(e.amount)} of their Max HP`);
    else if (e.type === "healFlatCasterHP") out.push(`Heals all allies for ${P(e.amount)} of this character's Max HP`);
    else if (e.type === "cleanse") out.push(`Cleanses ${e.amount} debuff${e.amount > 1 ? "s" : ""} from ${sk.target === "ally_single" ? "the ally" : "all allies"}`);
    else if (e.type === "shieldCasterHP") out.push(`${e.on === "self" ? "Gains" : "Grants all allies"} a Shield worth ${P(e.amount)} of this character's Max HP${T}`);
    else if (e.type === "reviveOne") out.push(`Revives one fallen ally at ${P(e.amount)} HP`);
  }
  if (sk.arc) out.push(`Arc Drive: costs ${sk.arc}% Magic Circuit`);
  return out.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(". ") + ".";
}

// ---------- the cast ----------
// fig: drawn figure (see drawFigure). Colours follow each character's usual outfit.
const CHARS = [
  { n: "Shiki Tohno", k: "shiki", rar: 4, cls: "Specialist", el: "Crescent", leader: { stat: "CD", amount: .3, scope: "Element" },
    fig: { type: "human", skin: "#f1dccb", hair: "#1e1a20", hs: "swoop", col: "#1d2440", col2: "#1a2038", boot: "#141418", acc: "#3a4466", trim: "#c8a64a", glasses: "#2a2a30", w: "dagger", sc: "#8fd8ff" },
    skills: [atk(1, "Knife Arts", "enemy", 2, 1.5, [dbf("BRAND", .35)]),
      sup(2, "Mystic Eyes of Death Perception", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfGain(.2)]),
      atk(3, "Seventeen Dismemberments", "enemy", 1, 4.6, [bonusVs("BRAND", .3, .2)], { ignoreDef: .5 })] },
  { n: "Shiki Nanaya", k: "nanaya", rar: 5, cls: "Specialist", el: "Blood", stats: { atk: 830, spd: 121 }, leader: { stat: "CR", amount: .24, scope: "All" },
    passives: [{ id: "TEAM_ATB_ON_KILL", amount: .15, text: "Demon Hunter's Instinct: when Nanaya defeats an enemy, all allies gain 15% turn meter." }],
    fig: { type: "human", skin: "#f1dccb", hair: "#18161c", hs: "swoop", col: "#e9e7ea", col2: "#17161b", boot: "#101014", acc: "#2a2a30", trim: "#5fd4ff", eyec: "#5fd4ff", w: "dagger", sc: "#5fd4ff" },
    skills: [atk(1, "Flash Run", "enemy", 3, 1.05, [tmDown(.08, .5)]),
      sup(2, "Assassin's Stance", "self", [selfBuff("STEALTH", 1), selfBuff("CRIT_RATE_UP"), selfGain(.25)]),
      atk(3, "Flash Sheath: Eight Folds", "enemy", 8, .62, [dbf("BRAND", .3)], { ignoreDef: .2 })] },
  { n: "Arcueid Brunestud", k: "arcueid", rar: 5, cls: "Guard", el: "Full", stats: { hp: 9800, atk: 850 }, leader: { stat: "ATK", amount: .25, scope: "All" },
    passives: [{ id: "REVIVE_ONCE", amount: .3, buff: "INVINCIBLE", turns: 1, text: "True Ancestor: revives once at 30% HP with Invincible (1T)." }],
    fig: { type: "human", skin: "#f6e6da", hair: "#f2d27a", hs: "bob", col: "#f2efe9", col2: "#5a4a7c", boot: "#2a2236", acc: "#d8d0e0", eyec: "#e0244a", robe: "robe", slim: 1, w: "claws", sc: "#ff4d6d" },
    skills: [atk(1, "Claw Swipe", "enemy", 2, 1.6, [dbf("DEF_BREAK", .3)]),
      atk(2, "Marble Phantasm", "aoe_enemies", 1, 2.4, [tmDown(.15)]),
      atk(3, "True Ancestor's Chains", "enemy", 1, 4.6, [strip(2)])] },
  { n: "Red Arcueid", k: "red-arcueid", rar: 5, cls: "Caster", el: "Blood", stats: { atk: 880 }, leader: { stat: "ATK", amount: .33, scope: "Element" },
    passives: [{ id: "LIFESTEAL", amount: .2, text: "Crimson Moon: heals for 20% of damage dealt." }],
    fig: { type: "human", skin: "#f6e6da", hair: "#f2d27a", hs: "long", hlen: 40, col: "#f4f0ee", col2: "#e8e2e8", boot: "#d8d0d8", acc: "#c8203a", trim: "#e0244a", eyec: "#e0244a", robe: "robe", slim: 1, w: "arts", sc: "#ff2a4a" },
    skills: [atk(1, "Crimson Lance", "enemy", 1, 3.2, [dbf("DOT", .4)]),
      atk(2, "Blood Moon", "aoe_enemies", 2, 1.4, [dbf("HEAL_BLOCK", .5)]),
      atk(3, "Brunestud of the Crimson Moon", "aoe_enemies", 1, 4.0, [dbf("DOT", 1)], { ignoreDef: .3 })] },
  { n: "Ciel", k: "ciel", rar: 4, cls: "Sniper", el: "Holy", leader: { stat: "ACC", amount: .4, scope: "All" },
    fig: { type: "human", skin: "#f3decd", hair: "#26355f", hs: "bob", col: "#1a1a26", col2: "#16161f", boot: "#101016", acc: "#c8b06a", trim: "#e8e2d0", robe: "robe", slim: 1, w: "blackkeys", sc: "#f4efe2" },
    skills: [atk(1, "Black Keys", "enemy", 3, 1.0, [dbf("STUN", .12, 1)]),
      atk(2, "Baptismal Rite", "aoe_enemies", 1, 2.2, [strip(1), dbf("HEAL_BLOCK", .5)]),
      atk(3, "Seventh Holy Scripture", "enemy", 1, 5.0, [], { ignoreDef: .4 })] },
  { n: "Powered Ciel", k: "powered-ciel", rar: 5, cls: "Guard", el: "Holy", stats: { hp: 10200, def: 600 }, leader: { stat: "DEF", amount: .3, scope: "All" },
    passives: [{ id: "IMMUNE_LIST", list: ["STUN", "SILENCE"], text: "Executor's Armour: immune to Bind and Silence." }],
    fig: { type: "human", skin: "#f3decd", hair: "#26355f", hs: "bob", col: "#3a3f52", col2: "#1a1a26", boot: "#2a2e3a", acc: "#c8b06a", trim: "#f4efe2", bulk: 1.12, w: "pilebunker", sc: "#f4efe2" },
    skills: [atk(1, "Pile Bunker", "enemy", 1, 3.4, [dbf("DEF_BREAK", .5)]),
      sup(2, "Executor's Armour", "self", [selfBuff("DEF_UP"), selfBuff("COUNTER"), selfShield(.2)]),
      atk(3, "Seventh Holy Scripture: Full Power", "aoe_enemies", 1, 3.6, [strip(1)])] },
  { n: "Akiha Tohno", k: "akiha", rar: 4, cls: "Caster", el: "Blood", leader: { stat: "ATK", amount: .24, scope: "Element" },
    passives: [{ id: "LIFESTEAL", amount: .15, text: "Plunder: heals for 15% of damage dealt." }],
    fig: { type: "human", skin: "#f6e3d6", hair: "#141016", hs: "long", hlen: 42, col: "#7a2632", col2: "#3a1a22", boot: "#1a1012", acc: "#e8d8b0", trim: "#e8d8b0", robe: "skirt", slim: 1, w: "arts", sc: "#ff3b5c" },
    skills: [atk(1, "Crimson Hair", "enemy", 1, 3.2, [dbf("DOT", .4)]),
      atk(2, "Plunder", "aoe_enemies", 2, 1.3, [dbf("ATK_DOWN", .4)]),
      atk(3, "Inversion Impulse", "aoe_enemies", 1, 3.8, [dbf("DOT", .7), tmDown(.15)])] },
  { n: "Akiha Vermillion", k: "red-akiha", rar: 5, cls: "Caster", el: "Blood", stats: { atk: 890, spd: 110 }, leader: { stat: "ATK", amount: .33, scope: "Element" },
    passives: [{ id: "LIFESTEAL", amount: .2, text: "Ever-Burning Plunder: heals for 20% of damage dealt." }],
    fig: { type: "human", skin: "#f6e3d6", hair: "#e01f3c", hs: "long", hlen: 48, col: "#7a2632", col2: "#3a1a22", boot: "#1a1012", acc: "#ff6a7a", trim: "#ffb3c0", eyec: "#ff3b5c", robe: "skirt", slim: 1, w: "arts", sc: "#ff2a4a" },
    skills: [atk(1, "Vermillion Hair", "enemy", 1, 3.6, [dbf("DOT", .6)]),
      atk(2, "Searing Plunder", "aoe_enemies", 2, 1.5, [dbf("HEAL_BLOCK", .6), selfHeal(.15)]),
      atk(3, "Crimson Inversion", "aoe_enemies", 1, 4.2, [strip(1), dbf("DOT", 1)])] },
  { n: "Hisui", k: "hisui", rar: 3, cls: "Medic", el: "Half", leader: { stat: "RES", amount: .3, scope: "All" },
    fig: { type: "human", skin: "#f4e0d2", hair: "#c9663e", hs: "bob", col: "#1c1c26", col2: "#1a1a24", boot: "#141418", acc: "#f4f2ee", apron: "#f4f2ee", headdress: "#f4f2ee", robe: "robe", slim: 1, w: "broom", sc: "#c39bff" },
    skills: [atk(1, "Duster Swipe", "enemy", 1, 2.2, [dbf("GLANCING", .4)]),
      sup(2, "Tea Service", "aoe_allies", [teamHeal(.2), cleanse(1)]),
      sup(3, "Devoted Maid", "team", [revive(.3), teamBuff("HOT"), teamBuff("IMMUNITY", 1)])] },
  { n: "Kohaku", k: "kohaku", rar: 3, cls: "Supporter", el: "Crescent", leader: { stat: "SPD", amount: .15, scope: "All" },
    fig: { type: "human", skin: "#f4e0d2", hair: "#c9663e", hs: "bob", col: "#e9a3b4", col2: "#7a2f4c", boot: "#2a1820", acc: "#f4f2ee", apron: "#f4f2ee", ribbon: "#f4f2ee", robe: "robe", slim: 1, w: "broom", sc: "#8fd8ff" },
    skills: [atk(1, "Broom Strike", "enemy", 1, 2.4, [dbf("SLOW", .4)]),
      atk(2, "Mysterious Medicine", "aoe_enemies", 1, 1.6, [dbf("DOT", .6), dbf("ATK_DOWN", .4)]),
      sup(3, "Kohaku's Secret Formula", "team", [teamBuff("ATK_UP"), teamBuff("SPD_UP"), teamGain(.2)])] },
  { n: "Mech-Hisui", k: "mech-hisui", rar: 4, cls: "Sniper", el: "Full", stats: { def: 520 }, leader: { stat: "CR", amount: .2, scope: "Element" },
    passives: [{ id: "IMMUNE_LIST", list: ["DOT", "STUN"], text: "Mechanical Body: immune to Bleed and Bind." }],
    fig: { type: "robot", col: "#2a3150", col2: "#1e2238", boot: "#141826", acc: "#ffd76b", headdress: "#f4f2ee", apron: "#e8ecf4", w: "rifle", sc: "#ffd76b" },
    skills: [atk(1, "Hisui Beam", "enemy", 1, 3.0, [tmDown(.1, .5)]),
      atk(2, "Rocket Punch", "enemy", 2, 1.8, [dbf("DEF_BREAK", .6)]),
      atk(3, "Mega Hisui Laser", "aoe_enemies", 1, 3.8, [], { ignoreDef: .25 })] },
  { n: "Satsuki Yumizuka", k: "satsuki", rar: 3, cls: "Guard", el: "Blood", leader: { stat: "ATK", amount: .2, scope: "Element" },
    passives: [{ id: "LIFESTEAL", amount: .1, text: "Fledgling Vampire: heals for 10% of damage dealt." }],
    fig: { type: "human", skin: "#f6e3d6", hair: "#c8763a", hs: "twin", hlen: 24, col: "#eef0f6", col2: "#22305a", boot: "#1a1a22", acc: "#c8203a", trim: "#22305a", ribbon: "#c8203a", robe: "skirt", slim: 1, eyec: "#e0244a", w: "claws", sc: "#ff4d6d" },
    skills: [atk(1, "Vampire Claw", "enemy", 2, 1.6, [selfHeal(.1, .3)]),
      sup(2, "Thirst", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfGain(.2)]),
      atk(3, "Withered Garden", "aoe_enemies", 1, 3.0, [dbf("ATK_DOWN", .6), tmDown(.1)])] },
  { n: "Sion Eltnam Atlasia", k: "sion", rar: 4, cls: "Sniper", el: "Half", leader: { stat: "ACC", amount: .3, scope: "All" },
    passives: [{ id: "TEAM_ATB_START", amount: .1, text: "Divided Thought: all allies start battle with 10% turn meter." }],
    fig: { type: "human", skin: "#f4e2d8", hair: "#6a4a9a", hs: "braid", hlen: 46, col: "#ece6f2", col2: "#4a3270", boot: "#2a1c3a", acc: "#8a6ac8", trim: "#8a6ac8", beret: "#5a3a8a", robe: "skirt", slim: 1, w: "pistol", sc: "#c39bff" },
    skills: [atk(1, "Etherlite", "enemy", 2, 1.5, [dbf("SLOW", .3)]),
      atk(2, "Thread Bind", "enemy", 1, 2.4, [dbf("STUN", .5, 1)]),
      atk(3, "Black Barrel Replica", "enemy", 1, 5.2, [perDebuff(.1, .5)], { ignoreDef: .3 })] },
  { n: "Sion TATARI", k: "sion-tatari", rar: 5, cls: "Specialist", el: "Blood", stats: { atk: 840, spd: 119 }, leader: { stat: "CD", amount: .33, scope: "Element" },
    passives: [{ id: "LIFESTEAL", amount: .2, text: "Vampiric Alchemy: heals for 20% of damage dealt." }],
    fig: { type: "human", skin: "#ece4ea", hair: "#5a3a7a", hs: "braid", hlen: 46, col: "#1a1420", col2: "#14101a", boot: "#0e0a12", acc: "#c8203a", trim: "#e0244a", eyec: "#ff2a4a", cape: "#2a1020", coat: 1, slim: 1, w: "pistol", sc: "#ff2a4a" },
    skills: [atk(1, "Vampire Etherlite", "enemy", 3, 1.1, [dbf("DOT", .3)]),
      atk(2, "Calamity of Sion", "aoe_enemies", 2, 1.3, [dbf("BRAND", .4)]),
      atk(3, "Rumor of the Night", "enemy", 1, 4.8, [strip(2), { on: "self", type: "atkbar+", amount: .3, onKill: true }])] },
  { n: "Riesbyfe Stridberg", k: "riesbyfe", rar: 4, cls: "Defender", el: "Holy", leader: { stat: "HP", amount: .25, scope: "All" },
    fig: { type: "human", skin: "#f3decd", hair: "#d8b878", hs: "bob", col: "#24242e", col2: "#1c1c26", boot: "#141418", acc: "#e8d8a8", trim: "#f4efe2", robe: "robe", w: "shield", sc: "#f4efe2", shc: "#c8c2b0" },
    skills: [atk(1, "Gamaliel Bash", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
      sup(2, "Holy Shield", "team", [teamShield(.2), teamBuff("DEF_UP")]),
      atk(3, "Gamaliel: Last Rite", "aoe_enemies", 1, 2.6, [dbf("PROVOKE", .7, 1), selfShield(.25)])] },
  { n: "Aoko Aozaki", k: "aoko", rar: 5, cls: "Caster", el: "Full", stats: { atk: 880 }, leader: { stat: "ATK", amount: .24, scope: "Element" },
    fig: { type: "human", skin: "#f4e2d6", hair: "#6a2a2a", hs: "long", hlen: 36, col: "#f2f0ec", col2: "#2a2a3a", boot: "#1a1a22", acc: "#c8203a", trim: "#c8203a", ribbon: "#c8203a", robe: "skirt", slim: 1, w: "arts", sc: "#6ab0ff" },
    skills: [atk(1, "Magic Bullet", "enemy", 3, 1.05, [tmDown(.05, .5)]),
      atk(2, "Blue Blast", "aoe_enemies", 2, 1.5, [dbf("DEF_BREAK", .4)]),
      atk(3, "Starbow Break", "aoe_enemies", 1, 4.4, [], { ignoreDef: .25 })] },
  { n: "Nrvnqsr Chaos", k: "chaos", rar: 5, cls: "Caster", el: "Half", stats: { hp: 9800 }, leader: { stat: "HP", amount: .3, scope: "All" },
    passives: [{ id: "REVIVE_ONCE", amount: .35, buff: "INVINCIBLE", turns: 1, text: "Six Hundred Sixty-Six Lives: revives once at 35% HP with Invincible (1T)." }],
    fig: { type: "human", skin: "#e8dcd2", hair: "#1e1a1c", hs: "short", col: "#1c1a20", col2: "#151318", boot: "#0e0c10", acc: "#4a3a2a", cape: "#18161c", coat: 1, h: 1.12, w: "arts", sc: "#9a7aff" },
    skills: [atk(1, "Beast Fang", "enemy", 2, 1.6, [dbf("DOT", .3)]),
      atk(2, "Primordial Beasts", "aoe_enemies", 3, .9, [tmDown(.05)]),
      atk(3, "Sea of Life", "aoe_enemies", 1, 3.6, [dbf("SLOW", .6), selfBuff("HOT")])] },
  { n: "Michael Roa Valdamjong", k: "roa", rar: 5, cls: "Caster", el: "Crescent", leader: { stat: "CD", amount: .3, scope: "Element" },
    passives: [{ id: "REVIVE_ONCE", amount: .3, buff: "INVINCIBLE", turns: 1, text: "Serpent of Akasha: revives once at 30% HP with Invincible (1T)." }],
    fig: { type: "human", skin: "#f0e4dc", hair: "#e8e6ec", hs: "long", hlen: 30, col: "#ece8ee", col2: "#2a2a34", boot: "#1a1a22", acc: "#5a4a8a", cape: "#e2dee6", coat: 1, h: 1.05, w: "arts", sc: "#8fd8ff" },
    skills: [atk(1, "Serpent Fang", "enemy", 1, 3.2, [dbf("SILENCE", .3, 1)]),
      sup(2, "Akasha Insight", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfBuff("IMMUNITY", 1)]),
      atk(3, "Serpent of Akasha", "aoe_enemies", 1, 4.0, [strip(1), dbf("DEF_BREAK", .5)])] },
  { n: "Night of Wallachia", k: "wallachia", rar: 5, cls: "Caster", el: "Blood", stats: { hp: 9600, atk: 860 }, leader: { stat: "CD", amount: .3, scope: "Element" },
    passives: [{ id: "LIFESTEAL", amount: .15, text: "Tatari: heals for 15% of damage dealt." }],
    fig: { type: "hood", skin: "#d8d0d8", col: "#120c14", col2: "#0c080e", cape: "#1a0a14", eyes: "#ff2a4a", robe: 1, h: 1.14, w: "arts", sc: "#ff2a4a" },
    skills: [atk(1, "Rumor", "enemy", 1, 3.0, [dbf("BRAND", .5)]),
      atk(2, "Tatari", "aoe_enemies", 1, 2.0, [dbf("ATK_DOWN", .5), dbf("SLOW", .5)]),
      atk(3, "Night of Wallachia", "aoe_enemies", 2, 2.2, [strip(1), tmDown(.15)])] },
  { n: "Len", k: "len", rar: 4, cls: "Supporter", el: "Half", leader: { stat: "SPD", amount: .2, scope: "All" },
    passives: [{ id: "TEAM_ATB_START", amount: .1, text: "Night Mare: all allies start battle with 10% turn meter." }],
    fig: { type: "human", skin: "#f6e8e0", hair: "#22223a", hs: "long", hlen: 30, col: "#1a1a2a", col2: "#16162a", boot: "#121220", acc: "#f4f2ee", ribbon: "#f4f2ee", robe: "robe", slim: 1, h: .82, ears: "cat", tail: "cat", w: "arts", sc: "#c39bff" },
    skills: [atk(1, "Dream Scratch", "enemy", 1, 2.4, [dbf("SLOW", .4)]),
      sup(2, "Sweet Dream", "aoe_enemies", [aoeDbf("STUN", .35, 1)]),
      sup(3, "Kingdom of Dreams", "team", [teamBuff("ATK_UP"), teamBuff("CRIT_RATE_UP"), teamHeal(.15), teamGain(.15)])] },
  { n: "White Len", k: "white-len", rar: 4, cls: "Specialist", el: "Crescent", leader: { stat: "CR", amount: .2, scope: "Element" },
    fig: { type: "human", skin: "#f8eee8", hair: "#eef0f6", hs: "long", hlen: 30, col: "#f4f4f8", col2: "#e8eaf2", boot: "#d8dce8", acc: "#2a2a3a", ribbon: "#1a1a2a", robe: "robe", slim: 1, h: .82, ears: "cat", tail: "cat", eyec: "#e0244a", w: "arts", sc: "#8fd8ff" },
    skills: [atk(1, "Ice Ribbon", "enemy", 2, 1.5, [dbf("SLOW", .35)]),
      sup(2, "Snow Waltz", "self", [selfBuff("STEALTH", 1), selfBuff("SPD_UP"), selfGain(.3)]),
      atk(3, "Winter's Lullaby", "aoe_enemies", 1, 3.2, [dbf("STUN", .3, 1)])] },
  { n: "Miyako Arima", k: "miyako", rar: 3, cls: "Vanguard", el: "Full", leader: { stat: "SPD", amount: .15, scope: "All" },
    fig: { type: "human", skin: "#f4dccb", hair: "#7a4a2a", hs: "bob", col: "#f2efe6", col2: "#a0283a", boot: "#1a1a1e", acc: "#a0283a", trim: "#a0283a", slim: 1, h: .82, w: "none", sc: "#f1d07a" },
    skills: [atk(1, "Hakkyoku Palm", "enemy", 1, 3.0, [tmDown(.1, .4)]),
      atk(2, "Iron Mountain Lean", "enemy", 1, 2.8, [dbf("STUN", .35, 1)]),
      atk(3, "Fierce Tiger Climbs the Mountain", "enemy", 2, 2.1, [selfGain(.3)], { ignoreDef: .2 })] },
  { n: "Kouma Kishima", k: "kouma", rar: 4, cls: "Defender", el: "Crescent", stats: { hp: 11000, atk: 700 }, leader: { stat: "HP", amount: .25, scope: "All" },
    passives: [{ id: "IMMUNE_LIST", list: ["STUN", "SLOW"], text: "Oni Blood: immune to Bind and Slow." }],
    fig: { type: "human", skin: "#e8cdb8", hair: "#5a1e1a", hs: "long", hlen: 26, col: "#2a2226", col2: "#1e1a1c", boot: "#141012", acc: "#8a2a2a", cape: "#3a2a2a", coat: 1, bulk: 1.28, h: 1.1, w: "none", sc: "#ff6a3d" },
    skills: [atk(1, "Oni Fist", "enemy", 1, 2.8, [dbf("PROVOKE", .4, 1)]),
      sup(2, "Demon Blood", "self", [selfBuff("DEF_UP"), selfBuff("COUNTER"), selfHeal(.15)]),
      atk(3, "Kishima Rampage", "aoe_enemies", 2, 1.6, [dbf("DEF_BREAK", .5)])] },
  { n: "Neco-Arc", k: "neco-arc", rar: 3, cls: "Specialist", el: "Full", leader: { stat: "CR", amount: .15, scope: "All" },
    fig: { type: "human", skin: "#f6e6da", hair: "#f2d27a", hs: "bob", col: "#f2efe9", col2: "#5a4a7c", boot: "#f2efe9", acc: "#d8d0e0", robe: "skirt", hsz: 1.65, h: .7, ears: "cat", tail: "cat", w: "none", sc: "#f1d07a" },
    skills: [atk(1, "Neco Punch", "enemy", 1, 2.8, [tmDown(.1, .5)]),
      sup(2, "Nyah-Nyah Spirit", "self", [selfBuff("CRIT_RATE_UP"), selfBuff("SPD_UP"), selfGain(.3)]),
      atk(3, "Neco Meteor", "aoe_enemies", 1, 3.0, [dbf("GLANCING", .5)])] },
  { n: "Neco-Arc Chaos", k: "neco-chaos", rar: 3, cls: "Caster", el: "Half", leader: { stat: "ATK", amount: .15, scope: "Element" },
    fig: { type: "human", skin: "#e8dcd2", hair: "#1e1a1c", hs: "short", col: "#1c1a20", col2: "#151318", boot: "#0e0c10", acc: "#4a3a2a", cape: "#18161c", coat: 1, hsz: 1.65, h: .7, ears: "cat", tail: "cat", w: "arts", sc: "#9a7aff" },
    skills: [atk(1, "Chaos Neco Beam", "enemy", 1, 3.0, [dbf("ATK_DOWN", .3)]),
      atk(2, "Six Hundred Sixty-Six Necos", "aoe_enemies", 3, .8),
      atk(3, "Chaos Neco Big Bang", "aoe_enemies", 1, 3.4, [tmDown(.1)])] },
  { n: "Ryougi Shiki", k: "ryougi", rar: 5, cls: "Specialist", el: "Holy", stats: { atk: 850, spd: 118 }, leader: { stat: "CR", amount: .24, scope: "All" },
    fig: { type: "human", skin: "#f2dfd2", hair: "#1c1a20", hs: "bob", col: "#3a5f8f", col2: "#3a5f8f", boot: "#2a1e18", acc: "#8a2a2a", cape: "#a8302a", coat: 1, robe: "robe", slim: 1, eyec: "#5fd4ff", w: "dagger", sc: "#5fd4ff" },
    skills: [atk(1, "Severing Knife", "enemy", 2, 1.7, [], { ignoreDef: .3 }),
      sup(2, "Mystic Eyes: Origin", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfBuff("IMMUNITY", 1)]),
      atk(3, "Death Perception: Void", "enemy", 1, 5.4, [strip(2)], { ignoreDef: .7 })] },
  { n: "Saber", k: "saber", rar: 5, cls: "Guard", el: "Holy", stats: { hp: 9800, atk: 840, def: 560 }, leader: { stat: "ATK", amount: .24, scope: "All" },
    passives: [{ id: "IMMUNE_LIST", list: ["STUN", "SILENCE"], text: "Magic Resistance: immune to Bind and Silence." }],
    fig: { type: "human", skin: "#f6e6da", hair: "#f0d070", hs: "bun", col: "#c9d2e2", col2: "#2a4a9a", boot: "#8a94a8", acc: "#f1d07a", trim: "#f1d07a", robe: "robe", slim: 1, w: "greatsword", sc: "#ffd76b" },
    skills: [atk(1, "Invisible Air", "enemy", 2, 1.7, [dbf("DEF_BREAK", .3)]),
      sup(2, "Mana Burst", "self", [selfBuff("ATK_UP"), selfBuff("DEF_UP"), selfGain(.2)]),
      atk(3, "Excalibur", "aoe_enemies", 1, 4.2, [], { ignoreDef: .2 })] },
  { n: "Noel", k: "noel", rar: 4, cls: "Vanguard", el: "Holy", leader: { stat: "SPD", amount: .18, scope: "All" },
    fig: { type: "human", skin: "#f4e0d4", hair: "#e6a7b8", hs: "bob", col: "#9a2e44", col2: "#2a1a24", boot: "#1a1218", acc: "#f1d07a", trim: "#f4efe2", robe: "skirt", slim: 1, w: "spear", sc: "#f4efe2" },
    skills: [atk(1, "Halberd Sweep", "enemy", 1, 2.9, [tmDown(.1, .4)]),
      sup(2, "Rally of the Faithful", "team", [teamGain(.15), teamBuff("SPD_UP")]),
      atk(3, "Executioner's Chorus", "aoe_enemies", 1, 2.8, [dbf("BRAND", .4)])] },
  { n: "Vlov Arkhangel", k: "vlov", rar: 5, cls: "Guard", el: "Crescent", stats: { atk: 860 }, leader: { stat: "ATK", amount: .3, scope: "Element" },
    fig: { type: "human", skin: "#ece2e0", hair: "#e6e4ea", hs: "long", hlen: 34, col: "#1e1a24", col2: "#16121a", boot: "#0e0c10", acc: "#c8203a", cape: "#2a1a2a", coat: 1, h: 1.06, eyec: "#ff2a4a", w: "saber", sc: "#ff3b5c" },
    skills: [atk(1, "Crimson Edge", "enemy", 2, 1.7, [dbf("DOT", .35)]),
      sup(2, "Dead Apostle's Pride", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfBuff("COUNTER")]),
      atk(3, "Arkhangel's Requiem", "enemy", 3, 1.7, [perDebuff(.1, .5)])] },
];
