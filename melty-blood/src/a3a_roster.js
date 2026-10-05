
// =====================================================================
//  CHARACTERS — the Melty Blood cast. Each character has a Crescent, Half and Full Moon style; every style is a
//  separate unit with its own role, three skills and Talent (skill names follow each style's move list).
//  Skill format: {slot, name, cd, target, hits, mult, ignoreDef, effects[]}; S3 is an Arc Drive that
//  costs 100% Magic Circuit instead of a cooldown. Skill and Talent text is generated from the data (skillDesc, passiveDesc).
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
const taunt = (turns = 2) => ({ on: "self", type: "taunt", turns });
const allyHeal = amount => ({ on: "ally", type: "healPctTarget", amount });
const aoeTm = amount => ({ on: "aoe_enemies", type: "atkbar-", amount });
const onKillGain = amount => ({ on: "self", type: "atkbar+", amount, onKill: true });
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
    else if (e.type === "atkbar-") { const who = e.on === "aoe_enemies" ? "all enemies' " : ""; out.push(ch ? `${ch}reduce ${who}turn meter by ${P(e.amount)}` : `Reduces ${who}turn meter by ${P(e.amount)}`); }
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

// ---------- Talents (passives) ----------
const T = (name, id, x = {}) => ({ name, id, ...x });
const STATN = { hp: "HP", atk: "ATK", def: "DEF", spd: "SPD", cr: "Crit Rate", cd: "Crit Damage", acc: "Accuracy", res: "Resistance" };
const fxList = l => l.map(x => FX[x].n).join(" and ");
const PASSIVE_TEXT = {
  LIFESTEAL: p => `heals for ${P(p.amount)} of damage dealt`,
  REVIVE_ONCE: p => `once per battle, revives at ${P(p.amount)} HP with ${FX[p.buff || "INVINCIBLE"].n} (${p.turns || 1}T)`,
  TEAM_ATB_START: p => `all allies start battle with ${P(p.amount)} turn meter`,
  SELF_ATB_START: p => `starts battle with ${P(p.amount)} turn meter`,
  MC_START: p => `the team starts battle with ${P(p.amount)} Magic Circuit`,
  IMMUNE_LIST: p => `immune to ${fxList(p.list)}`,
  TEAM_ATB_ON_KILL: p => `on a kill, all allies gain ${P(p.amount)} turn meter`,
  MC_ON_KILL: p => `on a kill, adds ${P(p.amount)} Magic Circuit`,
  COUNTER: p => `${P(p.chance)} chance to counterattack when hit`,
  START_BUFF: p => `${p.team ? "all allies start" : "starts"} battle with ${fxList(p.what)} (${p.turns || 2}T)`,
  BLOOD_HEAT: p => `deals ${P(p.amount)} more damage while below ${P(p.below)} HP`,
  DMG_REDUCE: p => `takes ${P(p.amount)} less damage`,
  TEAM_DMG_REDUCE: p => `while standing, all allies take ${P(p.amount)} less damage`,
  REGEN: p => `heals ${P(p.amount)} of Max HP at the start of each turn`,
  BONUS_VS_DEBUFFED: p => `deals ${P(p.amount)} more damage to enemies with a debuff`,
  EXECUTE: p => `deals ${P(p.amount)} more damage to enemies below ${P(p.below)} HP`,
  CRIT_DEBUFF: p => `critical hits have a ${P(p.chance)} chance to inflict ${FX[p.what].n} (${p.turns || 2}T)`,
  ON_HIT_ATB: p => `gains ${P(p.amount)} turn meter when hit`,
  HIT_DEBUFF: p => `when hit, ${P(p.chance)} chance to inflict ${FX[p.what].n} (${p.turns || 2}T) on the attacker`,
  EXTRA_TURN: p => `${P(p.chance)} chance to act again after each turn`,
  ARC_TEAM_ATB: p => `after an Arc Drive, all allies gain ${P(p.amount)} turn meter`,
  ARC_TEAM_HEAL: p => `after an Arc Drive, heals all allies for ${P(p.amount)} of their Max HP`,
  ARC_SELF_ATB: p => `after an Arc Drive, gains ${P(p.amount)} turn meter`,
  STAT: p => Object.entries(p.stats).map(([k, v]) => `+${P(v)} ${STATN[k]}`).join(", "),
};
const passiveDesc = p => { const t = PASSIVE_TEXT[p.id](p); return t.charAt(0).toUpperCase() + t.slice(1); };

// ---------- the cast ----------
// fig: drawn figure (see drawFigure), shared by all of a character's Moon styles. Skill and Arc Drive names come from
// each style's move list in Melty Blood: Actress Again Current Code (Saber, Noel and Vlov from Type Lumina).
// Half Moon has only a basic Arc Drive in the fighting game, so Half S3s use that; Crescent and Full use Last Arcs
// and Blood Heat Arc Drives.
const CHARS = [
  { n: "Shiki Tohno", short: "Shiki", k: "shiki", rar: 4,
    fig: { type: "human", skin: "#f1dccb", hair: "#1e1a20", hs: "swoop", col: "#1d2440", col2: "#1a2038", boot: "#141418", acc: "#3a4466", trim: "#c8a64a", glasses: "#2a2a30", w: "dagger", sc: "#8fd8ff" },
    Crescent: { cls: "Specialist", stats: { atk: 820, spd: 120 }, leader: { stat: "CD", amount: .3, scope: "Element" }, talent: T("Lines of Death", "CRIT_DEBUFF", { what: "BRAND", chance: .5 }),
      skills: [atk(1, "Trump Card I: Death Slice", "enemy", 2, 1.7, [dbf("BRAND", .5)]),
        sup(2, "Serious Stance: Flash Run - Harvest Moon", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfGain(.2)]),
        atk(3, "17 Dissection", "enemy", 1, 5.4, [bonusVs("BRAND", .4, .3)], { ignoreDef: .5 })] },
    Half: { cls: "Vanguard", talent: T("Fleet-Footed", "STAT", { stats: { spd: .1 } }),
      skills: [atk(1, "Trump Card II: Low Scoop", "enemy", 1, 2.9, [tmDown(.1, .4)]),
        atk(2, "A Kick Even I Don't Understand", "enemy", 2, 1.3, [selfGain(.25), selfBuff("SPD_UP")]),
        atk(3, "Mystic Eyes of Death Perception", "enemy", 1, 4.4, [strip(1), tmDown(.3)])] },
    Full: { cls: "Guard", stats: { atk: 860 }, talent: T("Interception", "COUNTER", { chance: .3 }),
      skills: [atk(1, "Trump Card III: Eight Flower Mirror", "enemy", 7, .52, [dbf("DEF_BREAK", .15)]),
        atk(2, "Unexpected Kick: Flash Run - Six Deer", "aoe_enemies", 1, 2.2, [selfBuff("COUNTER"), tmDown(.1)]),
        atk(3, "Mystic Eyes of Death Perception: One-Hit Kill", "enemy", 1, 5.6, [strip(2)], { ignoreDef: .8 })] }
  },
  { n: "Shiki Nanaya", short: "Nanaya", k: "nanaya", rar: 5,
    fig: { type: "human", skin: "#f1dccb", hair: "#18161c", hs: "swoop", col: "#e9e7ea", col2: "#17161b", boot: "#101014", acc: "#2a2a30", trim: "#5fd4ff", eyec: "#5fd4ff", w: "dagger", sc: "#5fd4ff" },
    Crescent: { cls: "Specialist", stats: { atk: 830, spd: 121 }, leader: { stat: "CR", amount: .24, scope: "All" }, talent: T("Demon Hunter's Instinct", "TEAM_ATB_ON_KILL", { amount: .15 }),
      skills: [atk(1, "Flash Sheath: Eightfold Thrust", "enemy", 3, 1.05, [tmDown(.08, .5)]),
        sup(2, "Flash Run: Moon in the Water", "self", [selfBuff("STEALTH", 1), selfBuff("CRIT_RATE_UP"), selfGain(.25)]),
        atk(3, "Sensa Meigoku Shamon", "enemy", 8, .62, [dbf("BRAND", .3)], { ignoreDef: .2 })] },
    Half: { cls: "Vanguard", stats: { atk: 760, spd: 120 }, talent: T("Moon in the Water", "ON_HIT_ATB", { amount: .1 }),
      skills: [atk(1, "Flash Run: One Deer", "enemy", 2, 1.5, [dbf("SLOW", .3)]),
        atk(2, "Flash Run: Two Fold Six Rabbits", "enemy", 2, 1.3, [tmDown(.15), selfGain(.2)]),
        atk(3, "Flash Sheath: Monk Imprisoned by Doubts", "enemy", 2, 2.1, [], { ignoreDef: .5 })] },
    Full: { cls: "Guard", stats: { atk: 860 }, talent: T("Killing Impulse", "EXECUTE", { amount: .4, below: .5 }),
      skills: [atk(1, "Flash Sheath: Four Ways", "enemy", 4, .95, [dbf("BRAND", .3)]),
        atk(2, "Flash Sheath: Seven Nights", "enemy", 1, 2.8, [strip(1), dbf("DEF_BREAK", .5)]),
        atk(3, "Extreme Death: Seven Nights", "enemy", 1, 6.0, [bonusVs("BRAND", .4, .3)], { ignoreDef: .5 })] }
  },
  { n: "Arcueid Brunestud", short: "Arcueid", k: "arcueid", rar: 5,
    fig: { type: "human", skin: "#f6e6da", hair: "#f2d27a", hs: "bob", col: "#f2efe9", col2: "#5a4a7c", boot: "#2a2236", acc: "#d8d0e0", eyec: "#e0244a", robe: "robe", slim: 1, w: "claws", sc: "#ff4d6d" },
    Crescent: { cls: "Specialist", stats: { atk: 840 }, leader: { stat: "ATK", amount: .25, scope: "All" }, talent: T("Whim of the Princess", "EXTRA_TURN", { chance: .2 }),
      skills: [atk(1, "You're in the Way!", "enemy", 3, 1.05, [dbf("DEF_BREAK", .2)]),
        atk(2, "Ready... Go!", "enemy", 1, 2.8, [tmDown(.2), selfGain(.2)]),
        atk(3, "Melty Blood", "enemy", 1, 5.0, [strip(2)], { ignoreDef: .3 })] },
    Half: { cls: "Defender", stats: { hp: 11200 }, talent: T("True Ancestor", "REVIVE_ONCE", { amount: .25, buff: "INVINCIBLE", turns: 1 }),
      skills: [atk(1, "What Are You Doing...!", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
        sup(2, "Over Here, Over Here!", "self", [taunt(2), selfBuff("DEF_UP"), selfShield(.25)]),
        atk(3, "From Dreams to Reality (Marble Phantasm)", "aoe_enemies", 1, 2.6, [dbf("PROVOKE", .6, 1), teamShield(.1)])] },
    Full: { cls: "Guard", stats: { hp: 9800, atk: 850 }, talent: T("Princess of the Moon", "START_BUFF", { what: ["ATK_UP", "CRIT_RATE_UP"], turns: 2 }),
      skills: [atk(1, "How's That?!", "enemy", 1, 3.3, [dbf("DEF_BREAK", .4)]),
        atk(2, "Burst!", "aoe_enemies", 1, 2.4, [tmDown(.15)]),
        atk(3, "Shall We Play Around a Bit?", "enemy", 1, 5.2, [strip(2)], { ignoreDef: .3 })] }
  },
  { n: "Red Arcueid", short: "Red Arcueid", k: "red-arcueid", rar: 5,
    fig: { type: "human", skin: "#f6e6da", hair: "#f2d27a", hs: "long", hlen: 40, col: "#f4f0ee", col2: "#e8e2e8", boot: "#d8d0d8", acc: "#c8203a", trim: "#e0244a", eyec: "#e0244a", robe: "robe", slim: 1, w: "arts", sc: "#ff2a4a" },
    Crescent: { cls: "Caster", stats: { atk: 880 }, leader: { stat: "ATK", amount: .33, scope: "Element" }, talent: T("Crimson Moon", "LIFESTEAL", { amount: .2 }),
      skills: [atk(1, "Alte Schule", "enemy", 2, 1.6, [dbf("DOT", .35)]),
        atk(2, "Vorzeit echte Schule", "aoe_enemies", 2, 1.4, [dbf("HEAL_BLOCK", .5)]),
        atk(3, "Gnadenstoss", "aoe_enemies", 1, 4.0, [dbf("DOT", 1)], { ignoreDef: .3 })] },
    Half: { cls: "Supporter", talent: T("Thorns of Blood", "HIT_DEBUFF", { what: "DOT", chance: .35 }),
      skills: [atk(1, "Vollmond", "enemy", 1, 2.8, [dbf("ATK_DOWN", .4)]),
        atk(2, "Wackenroder", "aoe_enemies", 1, 1.8, [dbf("SLOW", .4), teamShield(.15)]),
        atk(3, "Pluto die Schwester", "aoe_enemies", 1, 3.2, [dbf("ATK_DOWN", .7), dbf("HEAL_BLOCK", .5), teamHeal(.15)])] },
    Full: { cls: "Caster", stats: { atk: 880 }, talent: T("Crimson Frenzy", "BLOOD_HEAT", { amount: .35, below: .5 }),
      skills: [atk(1, "Heisses Wasser", "enemy", 3, 1.1, [dbf("BRAND", .2)]),
        atk(2, "Rage Moerder", "enemy", 1, 2.8, [strip(1)]),
        atk(3, "Pluto die Schwester (Blood Heat)", "aoe_enemies", 1, 4.6, [], { ignoreDef: .35 })] }
  },
  { n: "Ciel", short: "Ciel", k: "ciel", rar: 4,
    fig: { type: "human", skin: "#f3decd", hair: "#26355f", hs: "bob", col: "#1a1a26", col2: "#16161f", boot: "#101016", acc: "#c8b06a", trim: "#e8e2d0", robe: "robe", slim: 1, w: "blackkeys", sc: "#f4efe2" },
    Crescent: { cls: "Sniper", leader: { stat: "ACC", amount: .4, scope: "All" }, talent: T("Burial Rite", "CRIT_DEBUFF", { what: "HEAL_BLOCK", chance: .5 }),
      skills: [atk(1, "Black Key Throw", "enemy", 3, 1.1, [dbf("STUN", .12, 1)]),
        atk(2, "Black Key: Long Verse", "aoe_enemies", 1, 2.2, [strip(1), dbf("HEAL_BLOCK", .5)]),
        atk(3, "Seventh Holy Scripture: Redemption from Original Sin", "enemy", 1, 5.4, [], { ignoreDef: .4 })] },
    Half: { cls: "Supporter", talent: T("Undying Body", "REVIVE_ONCE", { amount: .25, buff: "INVINCIBLE", turns: 1 }),
      skills: [atk(1, "Halo Acolyte", "enemy", 2, 1.4, [dbf("SILENCE", .25, 1)]),
        sup(2, "Seventh Heaven", "team", [cleanse(1), teamShield(.15)]),
        atk(3, "Seventh Holy Scripture", "aoe_enemies", 1, 2.8, [strip(1), dbf("ATK_DOWN", .6), teamBuff("DEF_UP")])] },
    Full: { cls: "Guard", talent: T("Burial Sentence", "EXECUTE", { amount: .35, below: .5 }),
      skills: [atk(1, "Flipper", "enemy", 2, 1.7, [dbf("DEF_BREAK", .35)]),
        atk(2, "Cavalry Toss", "enemy", 1, 2.8, [strip(1), dbf("STUN", .3, 1)]),
        atk(3, "Cremation Rite", "enemy", 1, 5.8, [strip(1)], { ignoreDef: .5 })] }
  },
  { n: "Powered Ciel", short: "Powered Ciel", k: "powered-ciel", rar: 5,
    fig: { type: "human", skin: "#f3decd", hair: "#26355f", hs: "bob", col: "#3a3f52", col2: "#1a1a26", boot: "#2a2e3a", acc: "#c8b06a", trim: "#f4efe2", bulk: 1.12, w: "pilebunker", sc: "#f4efe2" },
    Crescent: { cls: "Guard", stats: { hp: 10200, def: 560 }, leader: { stat: "DEF", amount: .3, scope: "All" }, talent: T("Executor's Armour", "IMMUNE_LIST", { list: ["STUN", "SILENCE"] }),
      skills: [atk(1, "Rapid Stake", "enemy", 1, 3.4, [dbf("DEF_BREAK", .5)]),
        atk(2, "Numeral Secret Crest: Lightning Fury", "aoe_enemies", 1, 2.2, [dbf("STUN", .2, 1)]),
        atk(3, "Seventh Holy Scripture: Saint's Burial", "aoe_enemies", 1, 3.8, [strip(1)])] },
    Half: { cls: "Defender", stats: { hp: 11000 }, talent: T("Sacred Armour", "TEAM_DMG_REDUCE", { amount: .08 }),
      skills: [atk(1, "Rapid Stake (Charged)", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
        sup(2, "Shaft Drive", "self", [selfBuff("DEF_UP"), selfBuff("COUNTER"), selfShield(.2)]),
        atk(3, "Seventh Holy Scripture: Impeachment of Original Sin", "aoe_enemies", 1, 3.0, [dbf("PROVOKE", .5, 1), teamShield(.2)])] },
    Full: { cls: "Caster", stats: { atk: 860 }, talent: T("Heavy Plating", "STAT", { stats: { hp: .15, def: .15 } }),
      skills: [atk(1, "Grand Zapper", "enemy", 1, 3.3, [dbf("STUN", .15, 1)]),
        atk(2, "Virgin Pain", "aoe_enemies", 2, 1.4, [dbf("DEF_BREAK", .3)]),
        atk(3, "Numeral Secret Crest: Heavenly Nest", "aoe_enemies", 3, 1.6, [], { ignoreDef: .3 })] }
  },
  { n: "Akiha Tohno", short: "Akiha", k: "akiha", rar: 4,
    fig: { type: "human", skin: "#f6e3d6", hair: "#141016", hs: "long", hlen: 42, col: "#7a2632", col2: "#3a1a22", boot: "#1a1012", acc: "#e8d8b0", trim: "#e8d8b0", robe: "skirt", slim: 1, w: "arts", sc: "#ff3b5c" },
    Crescent: { cls: "Caster", leader: { stat: "ATK", amount: .24, scope: "Element" }, talent: T("Brilliant Impetus: Deep Red", "LIFESTEAL", { amount: .15 }),
      skills: [atk(1, "Felling Birds", "enemy", 1, 3.2, [dbf("DOT", .4)]),
        atk(2, "Burning Beasts", "aoe_enemies", 2, 1.3, [dbf("ATK_DOWN", .4)]),
        atk(3, "Red Mistress: Blazing Flower", "aoe_enemies", 1, 3.8, [dbf("DOT", .7), tmDown(.15)])] },
    Half: { cls: "Defender", talent: T("Maximizing Beasts", "HIT_DEBUFF", { what: "DOT", chance: .3 }),
      skills: [atk(1, "Plucking Birds", "enemy", 1, 2.6, [dbf("PROVOKE", .4, 1)]),
        sup(2, "Brilliant Impetus: Temporary String", "aoe_enemies", [aoeDbf("SLOW", .5), aoeDbf("STUN", .25, 1)]),
        atk(3, "Red Mistress: Locks of Hair", "aoe_enemies", 1, 2.8, [dbf("ATK_DOWN", .6), selfShield(.25)])] },
    Full: { cls: "Caster", talent: T("Demon Blood", "BLOOD_HEAT", { amount: .3, below: .5 }),
      skills: [atk(1, "Disposing of Beasts", "enemy", 2, 1.7, [dbf("SLOW", .3)]),
        atk(2, "Smoking Out Birds", "aoe_enemies", 2, 1.3, [dbf("DOT", .4)]),
        atk(3, "Red Mistress: Locks of Hair (Blood Heat)", "aoe_enemies", 1, 4.2, [perDebuff(.08, .4)], { ignoreDef: .3 })] }
  },
  { n: "Akiha Vermillion", short: "Akiha Vermillion", k: "red-akiha", rar: 5,
    fig: { type: "human", skin: "#f6e3d6", hair: "#e01f3c", hs: "long", hlen: 48, col: "#7a2632", col2: "#3a1a22", boot: "#1a1012", acc: "#ff6a7a", trim: "#ffb3c0", eyec: "#ff3b5c", robe: "skirt", slim: 1, w: "arts", sc: "#ff2a4a" },
    Crescent: { cls: "Caster", stats: { atk: 890, spd: 110 }, leader: { stat: "ATK", amount: .33, scope: "Element" }, talent: T("Ever-Burning Plunder", "LIFESTEAL", { amount: .2 }),
      skills: [atk(1, "Felling Emptily Fluttering Birds", "enemy", 1, 3.6, [dbf("DOT", .6)]),
        atk(2, "Burning Bounding Beasts", "aoe_enemies", 2, 1.5, [dbf("HEAL_BLOCK", .6), selfHeal(.1)]),
        atk(3, "Red Mistress Ubiquitous: Hill of the Crimson Banquet", "aoe_enemies", 1, 4.2, [strip(1), dbf("DOT", 1)])] },
    Half: { cls: "Specialist", stats: { atk: 820, spd: 122 }, talent: T("Ever-Burning", "REGEN", { amount: .06 }),
      skills: [atk(1, "Plucking Birds", "enemy", 3, 1.05, [dbf("DOT", .3)]),
        atk(2, "Brilliant Impetus: Autumn Leaves", "enemy", 1, 2.6, [tmDown(.2), selfGain(.2)]),
        atk(3, "Red Mistress: Ubiquitous", "aoe_enemies", 1, 3.6, [dbf("HEAL_BLOCK", .6)])] },
    Full: { cls: "Caster", stats: { atk: 900 }, talent: T("Plunder the Weak", "BONUS_VS_DEBUFFED", { amount: .2 }),
      skills: [atk(1, "Brilliant Impetus: Scarlet Spots", "enemy", 1, 3.6, [dbf("DOT", .4)]),
        atk(2, "Brilliant Impetus: Fire Curtain", "aoe_enemies", 2, 1.5, [dbf("DOT", .35)]),
        atk(3, "Red Mistress: Ubiquitous (Blood Heat)", "aoe_enemies", 1, 4.6, [], { ignoreDef: .3 })] }
  },
  { n: "Hisui", short: "Hisui", k: "hisui", rar: 3,
    fig: { type: "human", skin: "#f4e0d2", hair: "#c9663e", hs: "bob", col: "#1c1c26", col2: "#1a1a24", boot: "#141418", acc: "#f4f2ee", apron: "#f4f2ee", headdress: "#f4f2ee", robe: "robe", slim: 1, w: "broom", sc: "#c39bff" },
    Crescent: { cls: "Medic", leader: { stat: "RES", amount: .3, scope: "All" }, talent: T("Attentive Maid", "START_BUFF", { what: ["IMMUNITY"], turns: 1, team: 1 }),
      skills: [atk(1, "This Ladle Is Solid.", "enemy", 2, 1.1, [dbf("GLANCING", .3)]),
        sup(2, "Hisui's 3 Step Cooking", "aoe_allies", [teamHeal(.2), cleanse(1)]),
        sup(3, "Fake Reality Marble: Round and Round Hisui World", "aoe_enemies", [aoeDbf("GLANCING", .8), revive(.3), teamBuff("HOT")])] },
    Half: { cls: "Medic", talent: T("Devoted Maid", "ARC_TEAM_HEAL", { amount: .1 }),
      skills: [atk(1, "Please Excuse Me.", "enemy", 1, 2.4, [dbf("GLANCING", .4)]),
        sup(2, "I Did My Best.", "aoe_allies", [teamHeal(.22), teamBuff("DEF_UP")]),
        atk(3, "Dark Jade Fist", "enemy", 1, 3.4, [revive(.3), teamHeal(.15)])] },
    Full: { cls: "Defender", talent: T("Stoic", "DMG_REDUCE", { amount: .08 }),
      skills: [atk(1, "That Is Dangerous.", "enemy", 1, 2.4, [dbf("PROVOKE", .4, 1)]),
        sup(2, "Please Sit Down.", "team", [teamShield(.15), teamBuff("DEF_UP")]),
        atk(3, "Great Dark Jade Fist", "aoe_enemies", 1, 2.6, [dbf("ATK_DOWN", .5), selfShield(.15), taunt(2)])] }
  },
  { n: "Kohaku", short: "Kohaku", k: "kohaku", rar: 3,
    fig: { type: "human", skin: "#f4e0d2", hair: "#c9663e", hs: "bob", col: "#e9a3b4", col2: "#7a2f4c", boot: "#2a1820", acc: "#f4f2ee", apron: "#f4f2ee", ribbon: "#f4f2ee", robe: "robe", slim: 1, w: "broom", sc: "#8fd8ff" },
    Crescent: { cls: "Supporter", leader: { stat: "SPD", amount: .15, scope: "All" }, talent: T("Kohaku's Scheme", "MC_START", { amount: .2 }),
      skills: [atk(1, "Battou: Hidden Sharp Sword", "enemy", 1, 2.4, [dbf("SLOW", .4)]),
        atk(2, "This Is a Victim of Modern Medicine.", "aoe_enemies", 1, 1.6, [dbf("DOT", .6), dbf("ATK_DOWN", .4)]),
        atk(3, "Ultimate Battou: Happy New Year's Comet", "aoe_enemies", 1, 2.4, [teamBuff("ATK_UP"), teamBuff("SPD_UP"), teamGain(.15)])] },
    Half: { cls: "Vanguard", talent: T("Won't You Come Back?", "COUNTER", { chance: .25 }),
      skills: [atk(1, "It's a Cleanup!", "enemy", 1, 2.9, [tmDown(.1, .4)]),
        atk(2, "Amber Magnum Uppercut", "enemy", 1, 2.8, [dbf("STUN", .35, 1)]),
        atk(3, "Low Blow Amber Kick", "enemy", 1, 4.4, [tmDown(.3)])] },
    Full: { cls: "Caster", talent: T("Experimental Subject", "BONUS_VS_DEBUFFED", { amount: .15 }),
      skills: [atk(1, "Battou: Air Strike", "enemy", 1, 3.2, [dbf("DOT", .35)]),
        sup(2, "Prepare Battou: Rude Dismissal", "self", [selfBuff("COUNTER"), selfBuff("DEF_UP"), selfShield(.15), selfGain(.2)]),
        atk(3, "Low Blow Amber Overthrow", "aoe_enemies", 1, 3.6, [dbf("DOT", .7), dbf("SLOW", .5)])] }
  },
  { n: "Mech-Hisui", short: "Mech-Hisui", k: "mech-hisui", rar: 4,
    fig: { type: "robot", col: "#2a3150", col2: "#1e2238", boot: "#141826", acc: "#ffd76b", headdress: "#f4f2ee", apron: "#e8ecf4", w: "rifle", sc: "#ffd76b" },
    Crescent: { cls: "Sniper", leader: { stat: "CR", amount: .2, scope: "Element" }, talent: T("Mechanical Body", "IMMUNE_LIST", { list: ["DOT", "STUN"] }),
      skills: [atk(1, "Laser", "enemy", 1, 3.0, [tmDown(.1, .5)]),
        atk(2, "Hallucinatory Missile", "aoe_enemies", 2, 1.4, [dbf("DEF_BREAK", .3)]),
        atk(3, "Execution Laser", "aoe_enemies", 1, 4.2, [], { ignoreDef: .25 })] },
    Half: { cls: "Supporter", talent: T("Armoured Chassis", "DMG_REDUCE", { amount: .15 }),
      skills: [atk(1, "Long Range: Electromagnetic Shock", "enemy", 1, 2.6, [dbf("STUN", .25, 1)]),
        sup(2, "S.O.S", "team", [teamShield(.18), teamBuff("DEF_UP")]),
        atk(3, "L.S.O. (Superhuman Sister Alliance)", "aoe_enemies", 1, 3.0, [dbf("SLOW", .6), tmDown(.1)])] },
    Full: { cls: "Sniper", talent: T("Various Amberjangs", "CRIT_DEBUFF", { what: "DEF_BREAK", chance: .6 }),
      skills: [atk(1, "Sweep (Assault)", "enemy", 4, .85),
        atk(2, "Rumbling Bomb", "aoe_enemies", 1, 2.2, [dbf("DOT", .5), dbf("DEF_BREAK", .3)]),
        atk(3, "Saturday Night Forever", "enemy", 1, 5.8, [], { ignoreDef: .4 })] }
  },
  { n: "Satsuki Yumizuka", short: "Satsuki", k: "satsuki", rar: 3,
    fig: { type: "human", skin: "#f6e3d6", hair: "#c8763a", hs: "twin", hlen: 24, col: "#eef0f6", col2: "#22305a", boot: "#1a1a22", acc: "#c8203a", trim: "#22305a", ribbon: "#c8203a", robe: "skirt", slim: 1, eyec: "#e0244a", w: "claws", sc: "#ff4d6d" },
    Crescent: { cls: "Guard", leader: { stat: "ATK", amount: .2, scope: "Element" }, talent: T("Sorry, Just One Bite!", "LIFESTEAL", { amount: .12 }),
      skills: [atk(1, "Sacchin Arm: Reaching for the Impossible Dream", "enemy", 2, 1.6, [selfHeal(.1, .3)]),
        atk(2, "Here I Go~!", "enemy", 1, 2.9, [tmDown(.15), selfGain(.15)]),
        atk(3, "Reality Marble: Depletion Garden", "aoe_enemies", 1, 3.0, [dbf("ATK_DOWN", .6), tmDown(.1)])] },
    Half: { cls: "Vanguard", talent: T("Never Give Up", "ON_HIT_ATB", { amount: .1 }),
      skills: [atk(1, "Sacchin Arm: Aerial Dash", "enemy", 1, 2.9, [tmDown(.1, .4)]),
        atk(2, "Don't Come Near Me!", "aoe_enemies", 1, 1.9, [dbf("SLOW", .4)]),
        atk(3, "Now I'm Mad...!", "enemy", 1, 4.4, [selfHeal(.15), teamGain(.1)])] },
    Full: { cls: "Guard", talent: T("Thirst", "BLOOD_HEAT", { amount: .3, below: .5 }),
      skills: [atk(1, "Sacchin Dunk: Dropping What I Hold", "enemy", 1, 3.4, [dbf("DEF_BREAK", .3)]),
        atk(2, "Chasing the Uncatchable Dream", "enemy", 2, 1.5, [selfGain(.2)]),
        atk(3, "Now I'm Mad...! (Unblockable)", "enemy", 1, 5.0, [selfHeal(.2)], { ignoreDef: .5 })] }
  },
  { n: "Sion Eltnam Atlasia", short: "Sion", k: "sion", rar: 4,
    fig: { type: "human", skin: "#f4e2d8", hair: "#6a4a9a", hs: "braid", hlen: 46, col: "#ece6f2", col2: "#4a3270", boot: "#2a1c3a", acc: "#8a6ac8", trim: "#8a6ac8", beret: "#5a3a8a", robe: "skirt", slim: 1, w: "pistol", sc: "#c39bff" },
    Crescent: { cls: "Sniper", leader: { stat: "ACC", amount: .3, scope: "All" }, talent: T("Divided Thought", "TEAM_ATB_START", { amount: .1 }),
      skills: [atk(1, "Warning Shot", "enemy", 2, 1.7, [dbf("SLOW", .3)]),
        atk(2, "Etherlite Grand", "enemy", 1, 2.6, [dbf("STUN", .6, 1)]),
        atk(3, "Barrel Replica: Obelisk", "enemy", 1, 5.6, [perDebuff(.1, .5)], { ignoreDef: .3 })] },
    Half: { cls: "Supporter", talent: T("Thought Acceleration", "MC_START", { amount: .25 }),
      skills: [atk(1, "Sigma Raiser", "enemy", 2, 1.3, [tmDown(.1, .5)]),
        sup(2, "High-Speed Thought", "team", [teamGain(.2), teamBuff("SPD_UP")]),
        atk(3, "Barrel Replica", "enemy", 1, 4.0, [teamBuff("ATK_UP"), teamBuff("CRIT_RATE_UP")])] },
    Full: { cls: "Sniper", talent: T("Calculated Shot", "STAT", { stats: { cr: .15 } }),
      skills: [atk(1, "Hollow Point", "enemy", 2, 1.75, [dbf("DEF_BREAK", .35)]),
        atk(2, "Transfer Ride", "enemy", 1, 2.8, [strip(1), tmDown(.2)]),
        atk(3, "Black Barrel Replica", "enemy", 1, 6.0, [strip(1)], { ignoreDef: .45 })] }
  },
  { n: "Sion TATARI", short: "Sion TATARI", k: "sion-tatari", rar: 5,
    fig: { type: "human", skin: "#ece4ea", hair: "#5a3a7a", hs: "braid", hlen: 46, col: "#1a1420", col2: "#14101a", boot: "#0e0a12", acc: "#c8203a", trim: "#e0244a", eyec: "#ff2a4a", cape: "#2a1020", coat: 1, slim: 1, w: "pistol", sc: "#ff2a4a" },
    Crescent: { cls: "Caster", leader: { stat: "CD", amount: .33, scope: "Element" }, talent: T("Vampiric Alchemy", "LIFESTEAL", { amount: .2 }),
      skills: [atk(1, "Terror News (Lie)", "enemy", 2, 1.6, [dbf("DOT", .3)]),
        atk(2, "Replicant Conductor (Osiris)", "aoe_enemies", 2, 1.3, [dbf("BRAND", .4)]),
        atk(3, "Replicant Conductor (Horus)", "aoe_enemies", 2, 2.0, [dbf("BRAND", .4)])] },
    Half: { cls: "Specialist", stats: { atk: 830 }, talent: T("Vampiric Regeneration", "REGEN", { amount: .05 }),
      skills: [atk(1, "Busy Bug", "enemy", 3, 1.12, [dbf("DOT", .3)]),
        atk(2, "Terror News (Malice)", "enemy", 1, 2.6, [dbf("HEAL_BLOCK", .5), selfHeal(.1)]),
        atk(3, "Cruel Blood", "enemy", 1, 5.0, [selfHeal(.25)], { ignoreDef: .3 })] },
    Full: { cls: "Guard", stats: { atk: 860 }, talent: T("Hunger", "EXECUTE", { amount: .3, below: .4 }),
      skills: [atk(1, "Etherlite Thrust", "enemy", 1, 3.3, [dbf("STUN", .15, 1)]),
        atk(2, "Chain Letter", "aoe_enemies", 1, 2.2, [dbf("SLOW", .4)]),
        atk(3, "No Ark", "enemy", 1, 5.6, [strip(2), onKillGain(.3)], { ignoreDef: .5 })] }
  },
  { n: "Riesbyfe Stridberg", short: "Riesbyfe", k: "riesbyfe", rar: 4,
    fig: { type: "human", skin: "#f3decd", hair: "#d8b878", hs: "bob", col: "#24242e", col2: "#1c1c26", boot: "#141418", acc: "#e8d8a8", trim: "#f4efe2", robe: "robe", w: "shield", sc: "#f4efe2", shc: "#c8c2b0" },
    Crescent: { cls: "Defender", leader: { stat: "HP", amount: .25, scope: "All" }, talent: T("Gamaliel's Shelter", "TEAM_DMG_REDUCE", { amount: .08 }),
      skills: [atk(1, "Wrist Pizzicato", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
        sup(2, "Wrist Portato", "self", [selfBuff("COUNTER"), selfBuff("DEF_UP"), taunt(2)]),
        atk(3, "Official Apocrypha: Original Sin Embrace", "aoe_enemies", 1, 2.8, [dbf("PROVOKE", .7, 1), selfShield(.25)])] },
    Half: { cls: "Defender", talent: T("Reflecting Seal", "HIT_DEBUFF", { what: "ATK_DOWN", chance: .35 }),
      skills: [atk(1, "Wrist Staccato", "enemy", 1, 2.6, [dbf("ATK_DOWN", .4)]),
        sup(2, "Wrist Mordent", "team", [teamShield(.2), cleanse(1)]),
        atk(3, "Official Apocrypha", "aoe_enemies", 1, 2.6, [dbf("ATK_DOWN", .6), teamHeal(.12)])] },
    Full: { cls: "Guard", talent: T("Unwavering Faith", "IMMUNE_LIST", { list: ["PROVOKE", "ATK_DOWN"] }),
      skills: [atk(1, "Pile Arcato", "enemy", 1, 3.5, [dbf("DEF_BREAK", .4)]),
        atk(2, "Press Aftact", "aoe_enemies", 1, 2.0, [dbf("STUN", .2, 1)]),
        atk(3, "Pile Arcato: Gamaliel Unleashed", "enemy", 1, 5.6, [strip(1)], { ignoreDef: .5 })] }
  },
  { n: "Aoko Aozaki", short: "Aoko", k: "aoko", rar: 5,
    fig: { type: "human", skin: "#f4e2d6", hair: "#6a2a2a", hs: "long", hlen: 36, col: "#f2f0ec", col2: "#2a2a3a", boot: "#1a1a22", acc: "#c8203a", trim: "#c8203a", ribbon: "#c8203a", robe: "skirt", slim: 1, w: "arts", sc: "#6ab0ff" },
    Crescent: { cls: "Caster", stats: { atk: 880 }, leader: { stat: "ATK", amount: .24, scope: "Element" }, talent: T("Repeat Magic", "EXTRA_TURN", { chance: .15 }),
      skills: [atk(1, "Browning Starmine", "enemy", 3, 1.05, [tmDown(.05, .5)]),
        atk(2, "Floating Starmine", "aoe_enemies", 2, 1.5, [dbf("DEF_BREAK", .4)]),
        atk(3, "Retroflow: Genesis Light Year", "aoe_enemies", 1, 4.4, [], { ignoreDef: .25 })] },
    Half: { cls: "Supporter", talent: T("Corner Carry", "BONUS_VS_DEBUFFED", { amount: .15 }),
      skills: [atk(1, "Magic Draw (DC)", "enemy", 1, 2.8, [dbf("SILENCE", .3, 1)]),
        atk(2, "Blazing Starmine", "aoe_enemies", 1, 2.2, [tmDown(.15)]),
        atk(3, "Severe Break", "aoe_enemies", 1, 3.6, [strip(1), teamGain(.15)], { ignoreDef: .2 })] },
    Full: { cls: "Caster", stats: { atk: 880 }, talent: T("Aoko Moonsault", "ARC_SELF_ATB", { amount: .3 }),
      skills: [atk(1, "Magic Draw (AC)", "enemy", 1, 3.4, [dbf("DEF_BREAK", .3)]),
        atk(2, "Blowdust Starmine: Blue Fire", "aoe_enemies", 2, 1.5, [dbf("DOT", .4)]),
        atk(3, "Severe Break Slider", "aoe_enemies", 1, 4.8, [], { ignoreDef: .3 })] }
  },
  { n: "Nrvnqsr Chaos", short: "Nero Chaos", k: "chaos", rar: 5,
    fig: { type: "human", skin: "#e8dcd2", hair: "#1e1a1c", hs: "short", col: "#1c1a20", col2: "#151318", boot: "#0e0c10", acc: "#4a3a2a", cape: "#18161c", coat: 1, h: 1.12, w: "arts", sc: "#9a7aff" },
    Crescent: { cls: "Caster", stats: { hp: 9800 }, leader: { stat: "HP", amount: .3, scope: "All" }, talent: T("Six Hundred Sixty-Six Lives", "REVIVE_ONCE", { amount: .3, buff: "INVINCIBLE", turns: 1 }),
      skills: [atk(1, "Chaos Release: Black Wings", "enemy", 2, 1.6, [dbf("DOT", .3)]),
        atk(2, "Chaos Release: Horned Beasts", "aoe_enemies", 3, .8, [tmDown(.05)]),
        atk(3, "Number of the Beast", "aoe_enemies", 1, 3.3, [dbf("SLOW", .6), selfBuff("HOT")])] },
    Half: { cls: "Caster", talent: T("Predator", "BONUS_VS_DEBUFFED", { amount: .2 }),
      skills: [atk(1, "Flying Poisonous Insect", "enemy", 2, 1.55, [dbf("DOT", .4)]),
        sup(2, "Scaled Insect Form", "aoe_enemies", [aoeDbf("SLOW", .5), aoeDbf("DOT", .35)]),
        atk(3, "Armament 999", "aoe_enemies", 2, 1.85, [tmDown(.1)])] },
    Full: { cls: "Defender", talent: T("Sea of Life", "REGEN", { amount: .05 }),
      skills: [atk(1, "Neuropteran Form", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
        atk(2, "Premature Egg", "aoe_enemies", 1, 1.8, [dbf("ATK_DOWN", .5), selfShield(.1)]),
        atk(3, "Chaos Exposure: Reptile Form", "aoe_enemies", 1, 3.0, [selfHeal(.2), taunt(2)])] }
  },
  { n: "Michael Roa Valdamjong", short: "Roa", k: "roa", rar: 5,
    fig: { type: "human", skin: "#f0e4dc", hair: "#e8e6ec", hs: "long", hlen: 30, col: "#ece8ee", col2: "#2a2a34", boot: "#1a1a22", acc: "#5a4a8a", cape: "#e2dee6", coat: 1, h: 1.05, w: "arts", sc: "#8fd8ff" },
    Crescent: { cls: "Caster", leader: { stat: "CD", amount: .3, scope: "Element" }, talent: T("Reincarnation", "REVIVE_ONCE", { amount: .3, buff: "INVINCIBLE", turns: 1 }),
      skills: [atk(1, "Thunder Needle", "enemy", 2, 1.7, [dbf("SILENCE", .25, 1)]),
        atk(2, "Numerology: Nest of Snakes", "aoe_enemies", 2, 1.25, [dbf("BRAND", .4)]),
        atk(3, "Hollow Course: Seventeen Reincarnations", "enemy", 1, 5.6, [strip(2)], { ignoreDef: .4 })] },
    Half: { cls: "Specialist", stats: { atk: 820 }, talent: T("Seventh Heaven", "SELF_ATB_START", { amount: .3 }),
      skills: [atk(1, "Thunder Flash", "enemy", 3, 1.05, [tmDown(.08, .5)]),
        atk(2, "Thunder Needle: Moment Viper", "enemy", 1, 2.6, [dbf("STUN", .4, 1)]),
        atk(3, "Heavenly Crashing Thunder", "aoe_enemies", 1, 3.6, [tmDown(.15)])] },
    Full: { cls: "Caster", talent: T("Serpent's Hunger", "BONUS_VS_DEBUFFED", { amount: .2 }),
      skills: [atk(1, "Funeral Fire Grab", "enemy", 1, 3.3, [dbf("DEF_BREAK", .35)]),
        atk(2, "Crushing Rising Thunder", "enemy", 1, 2.6, [dbf("STUN", .35, 1)]),
        atk(3, "Thunder Snake Ghostly Festival", "aoe_enemies", 1, 4.6, [], { ignoreDef: .3 })] }
  },
  { n: "Night of Wallachia", short: "Wallachia", k: "wallachia", rar: 5,
    fig: { type: "hood", skin: "#d8d0d8", col: "#120c14", col2: "#0c080e", cape: "#1a0a14", eyes: "#ff2a4a", robe: 1, h: 1.14, w: "arts", sc: "#ff2a4a" },
    Crescent: { cls: "Caster", stats: { hp: 9600, atk: 860 }, leader: { stat: "CD", amount: .3, scope: "Element" }, talent: T("Tatari", "LIFESTEAL", { amount: .15 }),
      skills: [atk(1, "Bad News (Lie)", "enemy", 1, 3.0, [dbf("BRAND", .5)]),
        atk(2, "Creature Channel (Apotheosis)", "aoe_enemies", 1, 2.0, [dbf("ATK_DOWN", .5), dbf("SLOW", .5)]),
        atk(3, "Night Ruler the Blood Dealer", "aoe_enemies", 2, 2.2, [strip(1), tmDown(.15)])] },
    Half: { cls: "Supporter", talent: T("Reflection of Fear", "HIT_DEBUFF", { what: "ATK_DOWN", chance: .35 }),
      skills: [atk(1, "Bad News (Malice)", "enemy", 1, 2.8, [dbf("SILENCE", .3, 1)]),
        sup(2, "Replicant Coordinator (Id)", "aoe_enemies", [aoeDbf("BRAND", .5), aoeDbf("ATK_DOWN", .4)]),
        atk(3, "Night on the Blood Liar (Unzanity)", "aoe_enemies", 1, 3.4, [dbf("STUN", .3, 1)])] },
    Full: { cls: "Caster", stats: { atk: 860 }, talent: T("The Undying Rumor", "REVIVE_ONCE", { amount: .25, buff: "INVINCIBLE", turns: 1 }),
      skills: [atk(1, "Virus Egg (Demagogue)", "enemy", 2, 1.65, [dbf("DOT", .35)]),
        atk(2, "Black Crack", "aoe_enemies", 1, 2.2, [dbf("GLANCING", .4)]),
        atk(3, "Night on the Blood Liar (Inzanity)", "aoe_enemies", 1, 4.4, [], { ignoreDef: .3 })] }
  },
  { n: "Len", short: "Len", k: "len", rar: 4,
    fig: { type: "human", skin: "#f6e8e0", hair: "#22223a", hs: "long", hlen: 30, col: "#1a1a2a", col2: "#16162a", boot: "#121220", acc: "#f4f2ee", ribbon: "#f4f2ee", robe: "robe", slim: 1, h: .82, ears: "cat", tail: "cat", w: "arts", sc: "#c39bff" },
    Crescent: { cls: "Supporter", leader: { stat: "SPD", amount: .2, scope: "All" }, talent: T("Pretty Walk", "TEAM_ATB_START", { amount: .1 }),
      skills: [atk(1, "Fleur Freeze", "enemy", 1, 2.4, [dbf("SLOW", .4)]),
        sup(2, "Powder Snow", "aoe_enemies", [aoeDbf("STUN", .3, 1)]),
        sup(3, "Cream Puff Dream REM", "team", [teamBuff("ATK_UP"), teamBuff("CRIT_RATE_UP"), teamHeal(.15), teamGain(.15)])] },
    Half: { cls: "Specialist", talent: T("Volatile Dream", "EXTRA_TURN", { chance: .2 }),
      skills: [atk(1, "London Rondo", "enemy", 2, 1.6, [tmDown(.1, .5), dbf("DEF_BREAK", .25)]),
        sup(2, "Magic the Poe", "self", [selfBuff("STEALTH", 1), selfBuff("CRIT_RATE_UP"), selfGain(.3)]),
        atk(3, "Ephemeral Transience", "enemy", 4, 1.2, [strip(1)])] },
    Full: { cls: "Caster", talent: T("Aegis Reflector", "COUNTER", { chance: .25 }),
      skills: [atk(1, "Flame Snow", "enemy", 1, 3.2, [dbf("DOT", .3)]),
        atk(2, "St. Elmo: Holy Bolt", "aoe_enemies", 1, 2.2, [dbf("GLANCING", .4)]),
        atk(3, "Ephemeral Dream", "aoe_enemies", 1, 4.2, [], { ignoreDef: .25 })] }
  },
  { n: "White Len", short: "White Len", k: "white-len", rar: 4,
    fig: { type: "human", skin: "#f8eee8", hair: "#eef0f6", hs: "long", hlen: 30, col: "#f4f4f8", col2: "#e8eaf2", boot: "#d8dce8", acc: "#2a2a3a", ribbon: "#1a1a2a", robe: "robe", slim: 1, h: .82, ears: "cat", tail: "cat", eyec: "#e0244a", w: "arts", sc: "#8fd8ff" },
    Crescent: { cls: "Specialist", leader: { stat: "CR", amount: .2, scope: "Element" }, talent: T("Swan Snow Slow", "CRIT_DEBUFF", { what: "SLOW", chance: .5 }),
      skills: [atk(1, "Fleur Freeze Couleur", "enemy", 2, 1.6, [dbf("SLOW", .35)]),
        sup(2, "Nutcracker", "self", [selfBuff("STEALTH", 1), selfBuff("SPD_UP"), selfGain(.3)]),
        atk(3, "Endless Expanses", "aoe_enemies", 1, 3.5, [dbf("STUN", .3, 1)])] },
    Half: { cls: "Guard", talent: T("Prima Ballerina", "STAT", { stats: { atk: .12 } }),
      skills: [atk(1, "Swan Lake", "enemy", 1, 3.1, [tmDown(.1, .4)]),
        atk(2, "Nursery Rhyme", "enemy", 1, 2.8, [strip(1), dbf("STUN", .3, 1)]),
        atk(3, "Ephemeral Transience", "enemy", 1, 4.6, [dbf("SLOW", .5)], { ignoreDef: .3 })] },
    Full: { cls: "Caster", talent: T("Pirouette Oise", "HIT_DEBUFF", { what: "SLOW", chance: .35 }),
      skills: [atk(1, "Snow Pillar", "enemy", 1, 3.2, [dbf("SLOW", .3)]),
        atk(2, "Fleur Freeze Mouchoir", "aoe_enemies", 1, 2.0, [dbf("SLOW", .5), tmDown(.1)]),
        atk(3, "Butterfly Dream", "aoe_enemies", 1, 4.2, [bonusVs("SLOW", .3)])] }
  },
  { n: "Miyako Arima", short: "Miyako", k: "miyako", rar: 3,
    fig: { type: "human", skin: "#f4dccb", hair: "#7a4a2a", hs: "bob", col: "#f2efe6", col2: "#a0283a", boot: "#1a1a1e", acc: "#a0283a", trim: "#a0283a", slim: 1, h: .82, w: "none", sc: "#f1d07a" },
    Crescent: { cls: "Vanguard", leader: { stat: "SPD", amount: .15, scope: "All" }, talent: T("Hakkyokuken Stance", "SELF_ATB_START", { amount: .25 }),
      skills: [atk(1, "Center Elbow Strike", "enemy", 1, 3.0, [tmDown(.1, .4)]),
        atk(2, "Quake Stomp", "aoe_enemies", 1, 1.8, [tmDown(.15), dbf("STUN", .2, 1)]),
        atk(3, "Forbidden Technique Final Thunder: Smashing Fist", "enemy", 1, 4.6, [dbf("DOT", .5), dbf("GLANCING", .5)])] },
    Half: { cls: "Defender", talent: T("Close Quarters", "COUNTER", { chance: .25 }),
      skills: [atk(1, "Five Form Fist", "enemy", 1, 2.6, [dbf("PROVOKE", .4, 1)]),
        atk(2, "Double Kick", "enemy", 2, 1.2, [selfBuff("COUNTER"), taunt(2)]),
        atk(3, "Ultimate Final Technique", "aoe_enemies", 1, 2.4, [dbf("STUN", .3, 1), selfShield(.2)])] },
    Full: { cls: "Guard", stats: { hp: 9800, atk: 860 }, talent: T("Fighting Spirit", "BLOOD_HEAT", { amount: .3, below: .5 }),
      skills: [atk(1, "Arrow Fist", "enemy", 2, 1.75, [tmDown(.1, .3)]),
        atk(2, "Thousand Year Smash", "enemy", 1, 3.0, [dbf("DEF_BREAK", .5), selfGain(.15)]),
        atk(3, "Amazing Ultimate Final Technique", "enemy", 1, 5.2, [], { ignoreDef: .5 })] }
  },
  { n: "Kouma Kishima", short: "Kouma", k: "kouma", rar: 4,
    fig: { type: "human", skin: "#e8cdb8", hair: "#5a1e1a", hs: "long", hlen: 26, col: "#2a2226", col2: "#1e1a1c", boot: "#141012", acc: "#8a2a2a", cape: "#3a2a2a", coat: 1, bulk: 1.28, h: 1.1, w: "none", sc: "#ff6a3d" },
    Crescent: { cls: "Guard", stats: { hp: 10200 }, leader: { stat: "HP", amount: .25, scope: "All" }, talent: T("Oni Blood", "IMMUNE_LIST", { list: ["STUN", "SLOW"] }),
      skills: [atk(1, "Buza Palm", "enemy", 1, 3.0, [dbf("DEF_BREAK", .3)]),
        atk(2, "Asamprajnata", "enemy", 1, 2.6, [dbf("STUN", .3, 1)]),
        atk(3, "Yama's Judgement", "aoe_enemies", 1, 3.8, [], { ignoreDef: .3 })] },
    Half: { cls: "Defender", stats: { hp: 11000, atk: 700 }, talent: T("Kishima Bulwark", "TEAM_DMG_REDUCE", { amount: .1 }),
      skills: [atk(1, "Triple Samadhi Prajna", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
        sup(2, "Plated God", "self", [selfBuff("DEF_UP"), selfBuff("COUNTER"), taunt(2)]),
        atk(3, "Unicorn: Jambu in Flames", "enemy", 1, 3.6, [dbf("DOT", .6), selfShield(.25)])] },
    Full: { cls: "Vanguard", talent: T("Demon Blood", "BLOOD_HEAT", { amount: .3, below: .5 }),
      skills: [atk(1, "Cremation", "enemy", 1, 3.1, [dbf("DOT", .3)]),
        atk(2, "Indra's Net", "enemy", 1, 2.6, [dbf("STUN", .35, 1)]),
        atk(3, "Crimson Lord: Jambudvipa Weariness Purification", "enemy", 1, 4.8, [dbf("DOT", 1)], { ignoreDef: .3 })] }
  },
  { n: "Neco-Arc", short: "Neco-Arc", k: "neco-arc", rar: 3,
    fig: { type: "human", skin: "#f6e6da", hair: "#f2d27a", hs: "bob", col: "#f2efe9", col2: "#5a4a7c", boot: "#f2efe9", acc: "#d8d0e0", robe: "skirt", hsz: 1.65, h: .7, ears: "cat", tail: "cat", w: "none", sc: "#f1d07a" },
    Crescent: { cls: "Specialist", leader: { stat: "CR", amount: .15, scope: "All" }, talent: T("Feline Whim", "EXTRA_TURN", { chance: .15 }),
      skills: [atk(1, "Neco One Two Three", "enemy", 3, 1.1, [tmDown(.05, .5)]),
        atk(2, "Neco Packet 2008", "aoe_enemies", 1, 2.2, [dbf("GLANCING", .4)]),
        atk(3, "Angolmois Hammer", "aoe_enemies", 1, 3.4, [dbf("STUN", .25, 1)])] },
    Half: { cls: "Caster", talent: T("Nine Lives", "REVIVE_ONCE", { amount: .2, buff: "INVINCIBLE", turns: 1 }),
      skills: [atk(1, "True Ancestor Beam", "enemy", 1, 2.8, [tmDown(.1, .5)]),
        atk(2, "Abaddon Flare", "aoe_enemies", 1, 1.8, [dbf("DOT", .4)]),
        atk(3, "Dawn of the Cat", "aoe_enemies", 1, 2.8, [tmDown(.15), teamGain(.1)])] },
    Full: { cls: "Guard", talent: T("Lucky Cat", "STAT", { stats: { cr: .15 } }),
      skills: [atk(1, "Neco Ninja Art: Love Earth", "enemy", 1, 3.4, [tmDown(.1, .4)]),
        atk(2, "I Want to Go to Crocodile Country", "enemy", 1, 2.6, [dbf("STUN", .25, 1), selfGain(.15)]),
        atk(3, "Delinquent Cat Gang Leader's Mansion", "enemy", 1, 5.0, [], { ignoreDef: .3 })] }
  },
  { n: "Neco-Arc Chaos", short: "Neco Chaos", k: "neco-chaos", rar: 3,
    fig: { type: "human", skin: "#e8dcd2", hair: "#1e1a1c", hs: "short", col: "#1c1a20", col2: "#151318", boot: "#0e0c10", acc: "#4a3a2a", cape: "#18161c", coat: 1, hsz: 1.65, h: .7, ears: "cat", tail: "cat", w: "arts", sc: "#9a7aff" },
    Crescent: { cls: "Caster", leader: { stat: "ATK", amount: .15, scope: "Element" }, talent: T("Neco Devour", "LIFESTEAL", { amount: .15 }),
      skills: [atk(1, "Chaos Beam", "enemy", 1, 3.0, [dbf("ATK_DOWN", .3)]),
        atk(2, "Undulating My Deer", "aoe_enemies", 3, .9),
        atk(3, "Summoning! Kaleidostick Strike", "aoe_enemies", 1, 3.4, [tmDown(.1)])] },
    Half: { cls: "Supporter", talent: T("Sea of Necos", "REGEN", { amount: .05 }),
      skills: [atk(1, "Bird: Half-Moon Version", "enemy", 2, 1.3, [dbf("SLOW", .3)]),
        sup(2, "Moriarty's Adventure", "team", [teamShield(.15), teamGain(.1)]),
        atk(3, "Dusk of the Cat", "aoe_enemies", 1, 2.6, [teamHeal(.15), teamBuff("HOT")])] },
    Full: { cls: "Caster", talent: T("Smallest Hurtbox", "DMG_REDUCE", { amount: .1 }),
      skills: [atk(1, "Chaos One-Way Ticket", "enemy", 1, 3.2, [tmDown(.1)]),
        atk(2, "Bird: Full-Moon Version", "aoe_enemies", 2, 1.3, [dbf("DOT", .3)]),
        atk(3, "Cat's Repayment Super Curse", "aoe_enemies", 1, 3.8, [], { ignoreDef: .2 })] }
  },
  { n: "Ryougi Shiki", short: "Ryougi", k: "ryougi", rar: 5,
    fig: { type: "human", skin: "#f2dfd2", hair: "#1c1a20", hs: "bob", col: "#3a5f8f", col2: "#3a5f8f", boot: "#2a1e18", acc: "#8a2a2a", cape: "#a8302a", coat: 1, robe: "robe", slim: 1, eyec: "#5fd4ff", w: "dagger", sc: "#5fd4ff" },
    Crescent: { cls: "Specialist", stats: { atk: 850, spd: 118 }, leader: { stat: "CR", amount: .24, scope: "All" }, talent: T("Direct Death", "EXECUTE", { amount: .35, below: .5 }),
      skills: [atk(1, "Double Belfry", "enemy", 3, 1.1, [], { ignoreDef: .3 }),
        sup(2, "Selfless Knowledge: Empty Heart, Possess Truth", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfBuff("IMMUNITY", 1), selfGain(.25)]),
        atk(3, "Pure Knowledge: Empty Boundaries", "enemy", 1, 5.8, [strip(2)], { ignoreDef: .7 })] },
    Half: { cls: "Vanguard", stats: { atk: 820, spd: 119 }, talent: T("Black Moon Kite", "ON_HIT_ATB", { amount: .1 }),
      skills: [atk(1, "Hidden Dagger", "enemy", 2, 1.6, [tmDown(.1, .5)]),
        sup(2, "Yin Yang Mother-of-Pearl", "self", [selfBuff("COUNTER"), selfBuff("STEALTH", 1), selfGain(.2)]),
        atk(3, "Mystic Eyes of Death Perception: Five Scenic Collapse", "aoe_enemies", 1, 3.6, [strip(1)])] },
    Full: { cls: "Guard", stats: { atk: 860 }, talent: T("Origin: Nothingness", "STAT", { stats: { cd: .3 } }),
      skills: [atk(1, "Double Belfry: Row of Beads", "enemy", 3, 1.2, [dbf("BRAND", .3)]),
        atk(2, "Yin Yang Spiral", "enemy", 1, 2.8, [strip(2), dbf("SILENCE", .4, 1), tmDown(.2)]),
        atk(3, "Mystic Eyes of Death Perception: Seven Scenic Demise", "enemy", 1, 5.8, [], { ignoreDef: 1 })] }
  },
  { n: "Saber", short: "Saber", k: "saber", rar: 5,
    fig: { type: "human", skin: "#f6e6da", hair: "#f0d070", hs: "bun", col: "#c9d2e2", col2: "#2a4a9a", boot: "#8a94a8", acc: "#f1d07a", trim: "#f1d07a", robe: "robe", slim: 1, w: "greatsword", sc: "#ffd76b" },
    Crescent: { cls: "Guard", stats: { hp: 9800, atk: 840, def: 560 }, leader: { stat: "ATK", amount: .24, scope: "All" }, talent: T("Magic Resistance", "IMMUNE_LIST", { list: ["STUN", "SILENCE"] }),
      skills: [atk(1, "First Air", "enemy", 2, 1.7, [dbf("DEF_BREAK", .3)]),
        sup(2, "Mana Burst", "self", [selfBuff("ATK_UP"), selfBuff("DEF_UP"), selfGain(.2)]),
        atk(3, "The Sword of Promised Victory", "aoe_enemies", 1, 4.2, [], { ignoreDef: .2 })] },
    Half: { cls: "Defender", stats: { hp: 11000 }, talent: T("Avalon's Blessing", "REGEN", { amount: .06 }),
      skills: [atk(1, "Strike Air", "enemy", 1, 2.6, [dbf("PROVOKE", .5, 1)]),
        sup(2, "Wing Air", "self", [selfBuff("COUNTER"), selfBuff("DEF_UP"), selfShield(.2)]),
        sup(3, "Avalon", "team", [teamShield(.25), teamBuff("IMMUNITY", 1), cleanse(1), teamHeal(.15)])] },
    Full: { cls: "Guard", stats: { atk: 860 }, talent: T("Charisma", "ARC_TEAM_ATB", { amount: .15 }),
      skills: [atk(1, "Third Air: Break", "enemy", 2, 1.75, [dbf("DEF_BREAK", .3), tmDown(.1)]),
        atk(2, "Elfin Dance", "enemy", 1, 2.9, [strip(1), selfGain(.2)]),
        atk(3, "The Sword of Promised Victory: Sword Dance", "aoe_enemies", 1, 4.8, [], { ignoreDef: .3 })] }
  },
  { n: "Noel", short: "Noel", k: "noel", rar: 4,
    fig: { type: "human", skin: "#f4e0d4", hair: "#e6a7b8", hs: "bob", col: "#9a2e44", col2: "#2a1a24", boot: "#1a1218", acc: "#f1d07a", trim: "#f4efe2", robe: "skirt", slim: 1, w: "spear", sc: "#f4efe2" },
    Crescent: { cls: "Vanguard", leader: { stat: "SPD", amount: .18, scope: "All" }, talent: T("Eager Executor", "SELF_ATB_START", { amount: .2 }),
      skills: [atk(1, "Heavy Thrust", "enemy", 1, 2.9, [tmDown(.1, .4)]),
        atk(2, "Black Key (Simple)", "enemy", 2, 1.3, [dbf("BRAND", .4)]),
        atk(3, "Heavenly Trinity", "aoe_enemies", 1, 2.8, [dbf("BRAND", .4), teamGain(.15)])] },
    Half: { cls: "Defender", talent: T("Stubborn Faith", "DMG_REDUCE", { amount: .1 }),
      skills: [atk(1, "Heavy Punishment", "enemy", 1, 2.6, [dbf("PROVOKE", .4, 1)]),
        sup(2, "Noel Somersault", "self", [selfBuff("DEF_UP"), taunt(2), selfShield(.2)]),
        atk(3, "Time to Repent", "aoe_enemies", 1, 2.4, [dbf("ATK_DOWN", .6), teamShield(.12)])] },
    Full: { cls: "Guard", talent: T("Envy", "BONUS_VS_DEBUFFED", { amount: .2 }),
      skills: [atk(1, "Rampaging Sister", "enemy", 2, 1.75, [dbf("DEF_BREAK", .3)]),
        atk(2, "Heavy Punishment (Overhead)", "enemy", 1, 2.8, [dbf("STUN", .3, 1)]),
        atk(3, "Exploding Black Keys", "aoe_enemies", 1, 4.2, [dbf("DEF_BREAK", .5)], { ignoreDef: .2 })] }
  },
  { n: "Vlov Arkhangel", short: "Vlov", k: "vlov", rar: 5,
    fig: { type: "human", skin: "#ece2e0", hair: "#e6e4ea", hs: "long", hlen: 34, col: "#1e1a24", col2: "#16121a", boot: "#0e0c10", acc: "#c8203a", cape: "#2a1a2a", coat: 1, h: 1.06, eyec: "#ff2a4a", w: "saber", sc: "#ff3b5c" },
    Crescent: { cls: "Guard", stats: { atk: 860 }, leader: { stat: "ATK", amount: .3, scope: "Element" }, talent: T("Dead Apostle's Pride", "LIFESTEAL", { amount: .2 }),
      skills: [atk(1, "Burya Tigr", "enemy", 2, 1.7, [dbf("DOT", .35)]),
        atk(2, "Homeward, Disease", "aoe_enemies", 1, 2.0, [dbf("DOT", .5)]),
        atk(3, "Mania, Scorching Heat", "enemy", 3, 1.85, [perDebuff(.1, .5)])] },
    Half: { cls: "Defender", stats: { hp: 11000 }, talent: T("Frozen Steel", "HIT_DEBUFF", { what: "SLOW", chance: .35 }),
      skills: [atk(1, "Ice, Memory", "enemy", 1, 2.6, [dbf("SLOW", .4)]),
        sup(2, "Homeward, Memory", "self", [selfBuff("DEF_UP"), selfBuff("COUNTER"), selfShield(.25)]),
        atk(3, "Depths, Northern Sea", "aoe_enemies", 1, 2.8, [dbf("SLOW", .6), dbf("ATK_DOWN", .5), selfHeal(.2)])] },
    Full: { cls: "Caster", stats: { atk: 880 }, talent: T("Twenty-Seven Ancestors", "BLOOD_HEAT", { amount: .35, below: .5 }),
      skills: [atk(1, "Burya Drakon", "enemy", 1, 3.4, [dbf("DOT", .4)]),
        atk(2, "Flame, Disease", "aoe_enemies", 2, 1.3, [dbf("HEAL_BLOCK", .4)]),
        atk(3, "Javol Kopiy", "enemy", 1, 5.6, [perDebuff(.08, .4)], { ignoreDef: .4 })] }
  },
];
