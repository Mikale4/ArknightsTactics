
// =====================================================================
//  BLADERS AND THEIR BEYBLADES — the original Beyblade anime (Season 1, V-Force, G-Revolution).
//  Each Blader has one or more Beyblades (the versions they used across the seasons); every Beyblade is its own unit
//  with a type (Attack, Defense, Endurance, Balance), three moves and a Blader Ability.
//  Skill format: {slot, name, cd, target, hits, mult, ignoreDef, effects[]}; S3 is the Bit-Beast attack, which costs
//  100% Bit Power instead of a cooldown. Move and Ability text is generated from the data (skillDesc, passiveDesc).
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

// ---------- generated move text ----------
const P = v => Math.round(v * 100) + "%";
function skillDesc(sk) {
  const out = [], E = sk.effects || [], multi = (sk.hits || 1) > 1;
  if (sk.mult > 0) {
    let s = sk.target === "aoe_enemies" ? (multi ? `Hits every opposing Beyblade ${sk.hits} times (${P(sk.mult)} ATK each)` : `Hits every opposing Beyblade (${P(sk.mult)} ATK)`)
      : multi ? `${sk.hits} hits (${P(sk.mult)} ATK each)` : `${P(sk.mult)} ATK`;
    if (sk.ignoreDef) s += sk.ignoreDef >= 1 ? ", ignoring DEF" : `, ignoring ${P(sk.ignoreDef)} DEF`;
    out.push(s);
  }
  for (const e of E) {
    const ch = e.chance != null && e.chance < 1 ? `${P(e.chance)} chance${multi && e.on === "target" ? " per hit" : ""} to ` : "";
    const T = e.turns ? ` (${e.turns}T)` : "";
    const nm = e.what && FX[e.what] ? FX[e.what].n : "";
    if (e.type === "debuff") out.push(ch ? `${ch}inflict ${nm}${T}${e.on === "aoe_enemies" ? " on every opponent" : ""}` : `Inflicts ${nm}${T}${e.on === "aoe_enemies" ? " on every opponent" : ""}`);
    else if (e.type === "atkbar-") { const who = e.on === "aoe_enemies" ? "every opponent's " : ""; out.push(ch ? `${ch}reduce ${who}turn meter by ${P(e.amount)}` : `Reduces ${who}turn meter by ${P(e.amount)}`); }
    else if (e.type === "strip") out.push(`Removes ${e.amount} buff${e.amount > 1 ? "s" : ""}`);
    else if (e.type === "bonusPerDebuff") out.push(`+${P(e.per)} damage per debuff on the target (up to +${P(e.cap)})`);
    else if (e.type === "bonusIf") out.push(`+${P(e.bonusDmg)} damage against targets with ${FX[e.cond].n}`);
    else if (e.type === "buff") out.push(`${e.on === "self" ? "Gains" : sk.target === "ally_single" ? "Gives the ally" : "Gives all allies"} ${nm}${T}`);
    else if (e.type === "taunt") out.push(`Gains ${FX.TAUNT.n}${T}`);
    else if (e.type === "atkbar+") out.push(`${e.on === "self" ? (e.onKill ? "On a knockout, gains" : "Gains") : "All allies gain"} ${P(e.amount)} turn meter${e.perCrit ? " per critical hit" : ""}`);
    else if (e.type === "healPct") out.push(ch ? `${ch}recover ${P(e.amount)} of max Spin` : `Recovers ${P(e.amount)} of max Spin`);
    else if (e.type === "healPctTarget") out.push(`${sk.target === "ally_single" ? "The ally recovers" : "All allies recover"} ${P(e.amount)} of their max Spin`);
    else if (e.type === "healFlatCasterHP") out.push(`All allies recover Spin equal to ${P(e.amount)} of this Beyblade's max Spin`);
    else if (e.type === "cleanse") out.push(`Cleanses ${e.amount} debuff${e.amount > 1 ? "s" : ""} from ${sk.target === "ally_single" ? "the ally" : "all allies"}`);
    else if (e.type === "shieldCasterHP") out.push(`${e.on === "self" ? "Gains" : "Gives all allies"} a ${FX.SHIELD.n} worth ${P(e.amount)} of this Beyblade's max Spin${T}`);
    else if (e.type === "reviveOne") out.push(`Relaunches one knocked-out ally at ${P(e.amount)} Spin`);
  }
  if (sk.arc) out.push(`Bit-Beast attack: costs ${sk.arc}% Bit Power`);
  return out.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(". ") + ".";
}

// ---------- Blader Abilities (passives) ----------
const T = (name, id, x = {}) => ({ name, id, ...x });
const STATN = { hp: "Spin", atk: "ATK", def: "DEF", spd: "SPD", cr: "Crit Rate", cd: "Crit Damage", acc: "Accuracy", res: "Resistance" };
const fxList = l => l.map(x => FX[x].n).join(" and ");
const PASSIVE_TEXT = {
  LIFESTEAL: p => `recovers Spin equal to ${P(p.amount)} of the damage it deals`,
  REVIVE_ONCE: p => `once per battle, survives a finishing blow with ${P(p.amount)} Spin and ${FX[p.buff || "INVINCIBLE"].n} (${p.turns || 1}T)`,
  TEAM_ATB_START: p => `all allies start battle with ${P(p.amount)} turn meter`,
  SELF_ATB_START: p => `starts battle with ${P(p.amount)} turn meter`,
  MC_START: p => `the team starts battle with ${P(p.amount)} Bit Power`,
  IMMUNE_LIST: p => `immune to ${fxList(p.list)}`,
  TEAM_ATB_ON_KILL: p => `on a knockout, all allies gain ${P(p.amount)} turn meter`,
  MC_ON_KILL: p => `on a knockout, adds ${P(p.amount)} Bit Power`,
  COUNTER: p => `${P(p.chance)} chance to counterattack when hit`,
  START_BUFF: p => `${p.team ? "all allies start" : "starts"} battle with ${fxList(p.what)} (${p.turns || 2}T)`,
  BLOOD_HEAT: p => `deals ${P(p.amount)} more damage while below ${P(p.below)} Spin`,
  DMG_REDUCE: p => `takes ${P(p.amount)} less damage`,
  TEAM_DMG_REDUCE: p => `while spinning, all allies take ${P(p.amount)} less damage`,
  REGEN: p => `recovers ${P(p.amount)} of max Spin at the start of each turn`,
  BONUS_VS_DEBUFFED: p => `deals ${P(p.amount)} more damage to opponents with a debuff`,
  EXECUTE: p => `deals ${P(p.amount)} more damage to opponents below ${P(p.below)} Spin`,
  CRIT_DEBUFF: p => `critical hits have a ${P(p.chance)} chance to inflict ${FX[p.what].n} (${p.turns || 2}T)`,
  ON_HIT_ATB: p => `gains ${P(p.amount)} turn meter when hit`,
  HIT_DEBUFF: p => `when hit, ${P(p.chance)} chance to inflict ${FX[p.what].n} (${p.turns || 2}T) on the attacker`,
  EXTRA_TURN: p => `${P(p.chance)} chance to act again after each turn`,
  ARC_TEAM_ATB: p => `after a Bit-Beast attack, all allies gain ${P(p.amount)} turn meter`,
  ARC_TEAM_HEAL: p => `after a Bit-Beast attack, all allies recover ${P(p.amount)} of their max Spin`,
  ARC_SELF_ATB: p => `after a Bit-Beast attack, gains ${P(p.amount)} turn meter`,
  STAT: p => Object.entries(p.stats).map(([k, v]) => `+${P(v)} ${STATN[k]}`).join(", "),
};
const passiveDesc = p => { const t = PASSIVE_TEXT[p.id](p); return t.charAt(0).toUpperCase() + t.slice(1); };

// ---------- the Bladers ----------
// Names follow the Nelvana English dub. Signature attacks (the S3 Bit-Beast attacks) are the show's special moves;
// S1/S2 are smaller techniques written for the game. type: the Beyblade's type (Attack / Defense / Endurance / Balance).
// squad: the Blader's main team (team filter and Captain skills); a version's `team` is the team it was used for.
// look: { ring, ring2 (Attack Ring colours), disk, base, tip, shape, r } (see drawBey).
const F = x => ({ type: "human", skin: "#f3d6bf", boot: "#2a2a30", w: "launcher", ...x });
const cap = (stat, amount, team) => team ? { stat, amount, scope: "Team", team } : { stat, amount, scope: "All" };
const BLADERS = [
  // ===================== Bladebreakers =====================
  { n: "Tyson Granger", short: "Tyson", k: "tyson", squad: "Bladebreakers",
    fig: F({ hair: "#1e2a5a", hs: "pony", hlen: 22, cap: "#d8302a", cap2: "#2f6fd8", capBack: 1, col: "#d8302a", col2: "#4a5a8a", acc: "#f2d04e", trim: "#f2d04e", glove: "#2f6fd8", eyec: "#5a7ad8", lc: "#2f6fd8", sc: "#5fd4ff" }),
    beast: { n: "Dragoon", kind: "dragon", el: "Wind", col: "#4ab4ff", d: "The Azure Dragon, one of the four Sacred Bit-Beasts. It was sealed in the Granger family sword and commands storms and tornadoes." },
    beys: [
      { v: "s", n: "Dragoon S", season: 1, type: "Attack", rar: 4, left: 1, look: { ring: "#f2f4f8", ring2: "#2f6fd8", disk: "#9aa4b8", base: "#2f6fd8", shape: "wing" },
        talent: T("Never Give Up", "BLOOD_HEAT", { amount: .3, below: .5 }),
        skills: [atk(1, "Dragon Smash", "enemy", 2, 1.5, [dbf("DEF_BREAK", .3)]), atk(2, "Left-Spin Rush", "enemy", 1, 2.8, [tmDown(.2), selfGain(.2)]), atk(3, "Storm Attack", "enemy", 1, 5.0, [strip(1)])] },
      { v: "f", n: "Dragoon F", season: 1, type: "Attack", rar: 5, left: 1, look: { ring: "#e8f0ff", ring2: "#1e4fb8", disk: "#a8b0c0", base: "#1e3a8a", shape: "wing" },
        talent: T("Dragon Wind", "TEAM_ATB_ON_KILL", { amount: .15 }),
        skills: [atk(1, "Upper Attack", "enemy", 3, 1.05, [dbf("BRAND", .3)]), atk(2, "Gale Dash", "aoe_enemies", 1, 2.2, [tmDown(.15)]), atk(3, "Phantom Hurricane", "aoe_enemies", 1, 3.8, [dbf("SLOW", .6)])] },
      { v: "v", n: "Dragoon V", season: 2, type: "Attack", rar: 4, left: 1, look: { ring: "#2f6fd8", ring2: "#ffffff", disk: "#9aa4b8", base: "#1a2a5a", shape: "wing" },
        talent: T("Magnacore Pull", "STAT", { stats: { atk: .1, spd: .06 } }),
        skills: [atk(1, "Victory Smash", "enemy", 1, 3.1, [dbf("DEF_BREAK", .35)]), sup(2, "Tornado Guard", "self", [selfBuff("ATK_UP"), selfBuff("SPD_UP"), selfGain(.25)]), atk(3, "Victory Tornado", "enemy", 2, 2.6, [strip(1), tmDown(.2)])] },
      { v: "v2", n: "Dragoon V2", season: 2, type: "Attack", rar: 5, left: 1, look: { ring: "#1a4fd8", ring2: "#5fd4ff", disk: "#b8c0d0", base: "#14204a", shape: "spike" },
        leader: cap("CD", .35), talent: T("Refuse to Lose", "REVIVE_ONCE", { amount: .3, buff: "INVINCIBLE", turns: 1 }),
        skills: [atk(1, "Wave Attack", "enemy", 3, 1.1, [dbf("DEF_BREAK", .25)]), atk(2, "Vanishing Attack", "enemy", 1, 2.6, [selfBuff("STEALTH", 1), selfGain(.25)]), atk(3, "Hyper Victory Tornado", "aoe_enemies", 2, 2.0, [strip(1)])] },
      { v: "g", n: "Dragoon G", season: 3, type: "Attack", rar: 4, left: 1, team: "BBA Revolution", look: { ring: "#3a7bd5", ring2: "#c8d8f0", disk: "#b0b8c8", base: "#2a3a6a", shape: "wing" },
        talent: T("Engine Gear Burst", "SELF_ATB_START", { amount: .35 }),
        skills: [atk(1, "Galaxy Smash", "enemy", 2, 1.5, [tmDown(.1, .5)]), atk(2, "Twin Tornado Attack", "aoe_enemies", 1, 2.5, [dbf("ATK_DOWN", .4), tmDown(.1)]), atk(3, "Galaxy Storm", "enemy", 1, 5.8, [dbf("BRAND", 1)], { ignoreDef: .3 })] },
      { v: "gt", n: "Dragoon GT", season: 3, type: "Attack", rar: 5, left: 1, team: "BBA Revolution", look: { ring: "#2a5ad0", ring2: "#ffd34d", disk: "#c0c8d8", base: "#1a2a5a", shape: "saw" },
        leader: cap("SPD", .18), talent: T("Turbo Release", "EXTRA_TURN", { chance: .2 }),
        skills: [atk(1, "Turbo Upper", "enemy", 2, 1.6, [dbf("DEF_BREAK", .3)]), atk(2, "Dragoon Tank", "aoe_enemies", 1, 2.4, [selfGain(.2), tmDown(.1)]), atk(3, "Galaxy Turbo Twister", "aoe_enemies", 1, 4.2, [tmDown(.25)], { ignoreDef: .25 })] },
      { v: "ms", n: "Dragoon MS", season: 3, type: "Attack", rar: 5, left: 1, team: "G Revolutions", look: { ring: "#c8d0dc", ring2: "#2f6fd8", disk: "#e0e4ec", base: "#2a3a6a", shape: "spike", r: 37 },
        leader: cap("ATK", .3, "Bladebreakers"), talent: T("Everyone's Spirit", "ARC_TEAM_ATB", { amount: .2 }),
        skills: [atk(1, "Metal Storm", "enemy", 3, 1.15, [dbf("DEF_BREAK", .3)]), atk(2, "Dragon Gale", "aoe_enemies", 1, 2.4, [strip(1)]), atk(3, "Evolution Storm", "enemy", 1, 6.6, [strip(2)], { ignoreDef: .5 })] },
    ] },
  { n: "Kai Hiwatari", short: "Kai", k: "kai", squad: "Bladebreakers",
    fig: F({ skin: "#f1d8c6", hair: "#9aa8c8", hair2: "#1e2440", hs: "spiky", facepaint: "#2f6fd8", scarf: "#f2f2f6", col: "#1e2030", col2: "#6a7088", acc: "#c8302a", glove: "#c8302a", eyec: "#c8302a", h: 1.06, lc: "#c8302a", sc: "#ff7a3c" }),
    beast: { n: "Dranzer", kind: "bird", el: "Fire", col: "#ff6a2a", d: "The Vermilion Bird, a phoenix of fire and one of the four Sacred Bit-Beasts." },
    beys: [
      { v: "s", n: "Dranzer S", season: 1, type: "Balance", rar: 4, look: { ring: "#d8302a", ring2: "#ffb03a", disk: "#9aa4b8", base: "#3a2a2a", shape: "wing" },
        leader: cap("ATK", .22, "Bladebreakers"), talent: T("Lone Wolf", "STAT", { stats: { atk: .1, cr: .08 } }),
        skills: [atk(1, "Spin Fire", "enemy", 2, 1.5, [dbf("DOT", .35)]), atk(2, "Flame Wing", "aoe_enemies", 1, 2.0, [dbf("DOT", .4)]), atk(3, "Fire Arrow", "enemy", 1, 5.4, [tmDown(.3), dbf("DOT", .5)])] },
      { v: "f", n: "Dranzer F", season: 1, type: "Balance", rar: 4, look: { ring: "#e03a2a", ring2: "#2a4ad8", disk: "#a8b0c0", base: "#2a2a3a", shape: "wing" },
        talent: T("Cold Pride", "COUNTER", { chance: .25 }),
        skills: [atk(1, "Flame Slash", "enemy", 1, 2.9, [dbf("DEF_BREAK", .35)]), atk(2, "Flame Thrower", "aoe_enemies", 2, 1.3, [dbf("DOT", .35)]), atk(3, "Flame Saber", "enemy", 1, 5.2, [dbf("BRAND", 1)], { ignoreDef: .3 })] },
      { v: "bd", n: "Black Dranzer", short: "Black Dranzer", season: 1, type: "Balance", rar: 5, team: "Demolition Boys", look: { ring: "#1a1a22", ring2: "#c83a3a", disk: "#5a606a", base: "#120a14", shape: "wing" },
        beast: { n: "Black Dranzer", el: "Dark", col: "#a04ae0", d: "Biovolt's dark phoenix, built to steal other Bit-Beasts. Kai took it from the Abbey." },
        leader: cap("ATK", .33), talent: T("Biovolt's Creation", "LIFESTEAL", { amount: .2 }),
        skills: [atk(1, "Black Flame", "enemy", 2, 1.6, [dbf("HEAL_BLOCK", .4)]), atk(2, "Bit-Beast Steal", "enemy", 1, 2.6, [strip(2), tmDown(.2)]), atk(3, "Black Flame Saber", "aoe_enemies", 1, 4.0, [dbf("SILENCE", .5, 1)])] },
      { v: "v", n: "Dranzer V", season: 2, type: "Balance", rar: 4, look: { ring: "#e8402a", ring2: "#f2c14e", disk: "#9aa4b8", base: "#3a1a1a", shape: "wing" },
        talent: T("Magnacore Flare", "START_BUFF", { what: ["ATK_UP"], turns: 2 }),
        skills: [atk(1, "Volcano Smash", "enemy", 1, 3.0, [dbf("DOT", .4)]), atk(2, "Blazing Spiral", "aoe_enemies", 1, 2.1, [dbf("DEF_BREAK", .35)]), atk(3, "Volcano Emission", "aoe_enemies", 1, 3.8, [dbf("DOT", .8)])] },
      { v: "v2", n: "Dranzer V2", season: 2, type: "Balance", rar: 5, look: { ring: "#c8202a", ring2: "#ff8a3a", disk: "#b8c0d0", base: "#2a0e12", shape: "spike" },
        leader: cap("CR", .22), talent: T("Phoenix Rebirth", "REVIVE_ONCE", { amount: .35, buff: "ATK_UP", turns: 2 }),
        skills: [atk(1, "Spiral Flame", "enemy", 3, 1.05, [dbf("DOT", .3)]), sup(2, "Phoenix Wing", "self", [selfBuff("ATK_UP"), selfBuff("CRIT_RATE_UP"), selfGain(.3)]), atk(3, "Volcano Excellent Emission", "enemy", 1, 5.6, [strip(1)], { ignoreDef: .4 })] },
      { v: "g", n: "Dranzer G", season: 3, type: "Balance", rar: 4, team: "Blitzkrieg Boys", look: { ring: "#d83a2a", ring2: "#e8e8ee", disk: "#b0b8c8", base: "#2a1a1a", shape: "wing" },
        talent: T("Blitzkrieg", "EXECUTE", { amount: .35, below: .5 }),
        skills: [atk(1, "Gigs Slash", "enemy", 2, 1.55, [dbf("BRAND", .3)]), atk(2, "Blazing Gig", "enemy", 1, 2.9, [dbf("DOT", .6), tmDown(.15)]), atk(3, "Blazing Gig Tempest", "aoe_enemies", 1, 4.0, [dbf("DOT", .7)])] },
      { v: "gt", n: "Dranzer GT", season: 3, type: "Balance", rar: 5, team: "Blitzkrieg Boys", look: { ring: "#b8202a", ring2: "#ffd34d", disk: "#c0c8d8", base: "#1a0a0e", shape: "saw" },
        leader: cap("CR", .25), talent: T("Reverse Spin", "ON_HIT_ATB", { amount: .12 }),
        skills: [atk(1, "Reverse Flame Gigs", "enemy", 2, 1.6, [tmDown(.1)]), sup(2, "Gigs Turbo", "self", [selfBuff("SPD_UP"), selfBuff("ATK_UP"), selfGain(.3)]), atk(3, "Blazing Gigs Turbo", "enemy", 1, 5.8, [dbf("DOT", 1)], { ignoreDef: .3 })] },
      { v: "ms", n: "Dranzer MS", season: 3, type: "Balance", rar: 5, team: "G Revolutions", look: { ring: "#c8ccd8", ring2: "#e0402a", disk: "#e0e4ec", base: "#3a1a1a", shape: "wing", r: 37 },
        leader: cap("CD", .4), talent: T("Raw Emotion", "BLOOD_HEAT", { amount: .45, below: .5 }),
        skills: [atk(1, "Metal Spiral", "enemy", 3, 1.15, [dbf("DOT", .3)]), atk(2, "Phoenix Dive", "aoe_enemies", 1, 2.6, [strip(1), dbf("DOT", .4)]), atk(3, "Spiral Fireball", "enemy", 1, 6.2, [strip(1)], { ignoreDef: .5 })] },
    ] },
  { n: "Ray Kon", short: "Ray", k: "ray", squad: "Bladebreakers",
    fig: F({ skin: "#f1d6bf", hair: "#141418", hs: "long", hlen: 46, headband: "#d8302a", col: "#f2f2f6", col2: "#1a1a20", trim: "#d8302a", acc: "#d8302a", eyec: "#f2c14e", lc: "#2aa84a", sc: "#c8ff8a" }),
    beast: { n: "Driger", kind: "cat", el: "Lightning", col: "#d8ffc8", d: "The White Tiger, sacred beast of Ray's clan and one of the four Sacred Bit-Beasts. Its claws strike like lightning." },
    beys: [
      { v: "s", n: "Driger S", season: 1, type: "Balance", rar: 4, look: { ring: "#f2f2f6", ring2: "#3ac85a", disk: "#9aa4b8", base: "#2a4a2a", shape: "claw" },
        talent: T("Tiger's Instinct", "CRIT_DEBUFF", { what: "SLOW", chance: .5 }),
        skills: [atk(1, "Claw Swipe", "enemy", 2, 1.5, [dbf("SLOW", .3)]), atk(2, "Tiger Pounce", "enemy", 1, 2.7, [tmDown(.25), selfGain(.2)]), atk(3, "Tiger Claw", "enemy", 3, 1.8, [dbf("DEF_BREAK", .5)])] },
      { v: "f", n: "Driger F", season: 1, type: "Balance", rar: 4, look: { ring: "#3ac85a", ring2: "#f2f2f6", disk: "#a8b0c0", base: "#1a3a1a", shape: "claw" },
        talent: T("Kung Fu Reflexes", "ON_HIT_ATB", { amount: .1 }),
        skills: [atk(1, "Fang Strike", "enemy", 1, 2.9, [dbf("BRAND", .3)]), sup(2, "Lightning Step", "self", [selfBuff("SPD_UP"), selfBuff("COUNTER"), selfGain(.2)]), atk(3, "Tiger Fang", "enemy", 1, 5.0, [dbf("STUN", .35, 1)])] },
      { v: "v", n: "Driger V", season: 2, type: "Attack", rar: 4, look: { ring: "#5ac83a", ring2: "#f2d04e", disk: "#9aa4b8", base: "#2a3a1a", shape: "spike" },
        talent: T("Vulcan Edge", "STAT", { stats: { atk: .12 } }),
        skills: [atk(1, "Vulcan Slash", "enemy", 2, 1.55, [dbf("DEF_BREAK", .3)]), atk(2, "Thunder Pounce", "aoe_enemies", 1, 2.2, [dbf("STUN", .15, 1)]), atk(3, "Vulcan Claw", "enemy", 1, 5.4, [strip(1)], { ignoreDef: .3 })] },
      { v: "v2", n: "Driger V2", season: 2, type: "Balance", rar: 5, look: { ring: "#2aa84a", ring2: "#c8ff5a", disk: "#b8c0d0", base: "#0e2a14", shape: "claw" },
        leader: cap("SPD", .18), talent: T("Driger Returns", "ARC_TEAM_ATB", { amount: .15 }),
        skills: [atk(1, "Power Claw Rush", "enemy", 3, 1.05, [dbf("SLOW", .25)]), atk(2, "Tiger Roar", "aoe_enemies", 1, 1.9, [dbf("ATK_DOWN", .5), teamGain(.1)]), atk(3, "Vulcan Power Claw", "aoe_enemies", 1, 3.6, [dbf("STUN", .3, 1)])] },
      { v: "g", n: "Driger G", season: 3, type: "Attack", rar: 5, team: "White Tiger X", look: { ring: "#e8e8ee", ring2: "#2aa84a", disk: "#c0c8d8", base: "#1a2a1a", shape: "claw" },
        leader: cap("ATK", .3, "White Tigers"), talent: T("Clan Pride", "CRIT_DEBUFF", { what: "STUN", chance: .3, turns: 1 }),
        skills: [atk(1, "Gatling Slash", "enemy", 4, .9, [dbf("BRAND", .2)]), atk(2, "Gatling Claw", "enemy", 3, 1.0, [tmDown(.15), selfGain(.2)]), atk(3, "Gatling Claw Maximum", "enemy", 5, 1.2, [dbf("DEF_BREAK", .6)])] },
      { v: "ms", n: "Driger MS", season: 3, type: "Balance", rar: 5, team: "G Revolutions", look: { ring: "#c8ccd8", ring2: "#3ac85a", disk: "#e0e4ec", base: "#1a2a1a", shape: "claw", r: 37 },
        leader: cap("SPD", .2), talent: T("Heir of the Clan", "TEAM_ATB_START", { amount: .15 }),
        skills: [atk(1, "Metal Slash", "enemy", 2, 1.6, [dbf("SLOW", .3)]), sup(2, "Tiger Guard", "team", [teamBuff("CRIT_RATE_UP"), teamGain(.15)]), atk(3, "Thunder Slash", "aoe_enemies", 1, 4.0, [strip(1), dbf("STUN", .25, 1)])] },
    ] },
  { n: "Max Tate", short: "Max", k: "max", squad: "Bladebreakers",
    fig: F({ skin: "#f6dcc8", hair: "#f2d27a", hs: "spiky", col: "#3a9a4a", col2: "#ff8a2a", acc: "#ff8a2a", eyec: "#4aa8ff", h: .94, lc: "#4a8a5a", sc: "#5fdc8c" }),
    beast: { n: "Draciel", kind: "turtle", el: "Water", col: "#4ac8a8", d: "The Black Tortoise, one of the four Sacred Bit-Beasts and a guardian of water and pure defense. It came from Max's grandmother's locket." },
    beys: [
      { v: "s", n: "Draciel S", season: 1, type: "Defense", rar: 4, look: { ring: "#6a4ab8", ring2: "#5fdc8c", disk: "#9aa4b8", base: "#2a1a4a", shape: "round" },
        talent: T("Patient Defense", "COUNTER", { chance: .25 }),
        skills: [atk(1, "Shield Bash", "enemy", 1, 2.6, [dbf("PROVOKE", .4, 1)]), sup(2, "Hold the Center", "self", [taunt(2), selfBuff("DEF_UP"), selfShield(.2)]), atk(3, "Metal Ball Defense", "aoe_enemies", 1, 2.4, [teamShield(.2), dbf("ATK_DOWN", .5)])] },
      { v: "f", n: "Draciel F", season: 1, type: "Defense", rar: 4, look: { ring: "#4a5ad8", ring2: "#9aff8a", disk: "#a8b0c0", base: "#1a2a4a", shape: "round" },
        talent: T("Tortoise Shell", "DMG_REDUCE", { amount: .12 }),
        skills: [atk(1, "Fortress Rebound", "enemy", 1, 2.7, [dbf("ATK_DOWN", .35)]), sup(2, "Fortress Wall", "self", [taunt(2), selfBuff("COUNTER"), selfShield(.25)]), atk(3, "Fortress Defense", "aoe_enemies", 1, 2.6, [dbf("PROVOKE", .6, 1), teamShield(.15)])] },
      { v: "v", n: "Draciel V", season: 2, type: "Defense", rar: 4, look: { ring: "#3a8a5a", ring2: "#c8a64a", disk: "#9aa4b8", base: "#1a3a2a", shape: "round" },
        talent: T("Viper Coil", "HIT_DEBUFF", { what: "SLOW", chance: .35 }),
        skills: [atk(1, "Viper Strike", "enemy", 1, 2.6, [dbf("SLOW", .35)]), sup(2, "Tidal Guard", "team", [teamShield(.15), cleanse(1)]), atk(3, "Viper Wall", "aoe_enemies", 1, 2.8, [dbf("SLOW", .6), teamBuff("DEF_UP")])] },
      { v: "v2", n: "Draciel V2", season: 2, type: "Defense", rar: 5, look: { ring: "#2a6a4a", ring2: "#5fd4ff", disk: "#b8c0d0", base: "#0e2a1e", shape: "round" },
        leader: cap("HP", .3), talent: T("Mom's Gift", "TEAM_DMG_REDUCE", { amount: .1 }),
        skills: [atk(1, "Heavy Rebound", "enemy", 1, 2.8, [dbf("PROVOKE", .4, 1)]), sup(2, "Shell Shelter", "self", [taunt(2), selfBuff("DEF_UP"), selfBuff("COUNTER")]), atk(3, "Heavy Viper Wall", "aoe_enemies", 1, 3.0, [teamShield(.25), dbf("ATK_DOWN", .6)])] },
      { v: "g", n: "Draciel G", season: 3, type: "Defense", rar: 5, team: "PPB All Starz", look: { ring: "#4a3a8a", ring2: "#5fdc8c", disk: "#c0c8d8", base: "#1a1a3a", shape: "round" },
        leader: cap("DEF", .3), talent: T("Gravity Well", "ON_HIT_ATB", { amount: .12 }),
        skills: [atk(1, "Gravity Pull", "enemy", 1, 2.7, [tmDown(.15)]), atk(2, "Waterspout", "aoe_enemies", 1, 1.9, [dbf("SLOW", .4), tmDown(.1)]), atk(3, "Gravity Control", "aoe_enemies", 1, 3.0, [dbf("STUN", .3, 1), aoeTm(.2)])] },
      { v: "ms", n: "Draciel MS", season: 3, type: "Defense", rar: 5, team: "G Revolutions", look: { ring: "#c8ccd8", ring2: "#4a8a5a", disk: "#e0e4ec", base: "#1a2a2a", shape: "round", r: 37 },
        leader: cap("HP", .25, "Bladebreakers"), talent: T("Unbreakable", "REVIVE_ONCE", { amount: .3, buff: "INVINCIBLE", turns: 1 }),
        skills: [atk(1, "Metal Shield Smash", "enemy", 1, 2.9, [dbf("DEF_BREAK", .3)]), sup(2, "Aqua Barrier", "team", [teamShield(.2), cleanse(1)]), atk(3, "Aqua Shield", "aoe_enemies", 1, 3.2, [teamShield(.2), teamHeal(.1)])] },
    ] },
  { n: "Kenny", short: "Kenny", k: "kenny", squad: "Bladebreakers",
    fig: F({ hair: "#a87a4a", hs: "bob", glasses: "#2a2a30", col: "#f2f2f6", col2: "#c8a878", trim: "#3a8a3a", acc: "#3a8a3a", slim: 1, h: .9, lc: "#5a8a3a", sc: "#8ad85a" }),
    beast: { n: "Hopper", kind: "lizard", el: "Water", col: "#8ad85a", d: "The frog on Kenny's own Bit-Chip. Dizzi, the Bit-Beast in his laptop, does most of the talking." },
    beys: [
      { v: "s", n: "Hopper", season: 1, type: "Endurance", rar: 3, look: { ring: "#5a9a3a", ring2: "#d8ff9a", disk: "#9aa4b8", base: "#2a3a2a", shape: "flat" },
        talent: T("Data Analysis", "BONUS_VS_DEBUFFED", { amount: .2 }),
        skills: [atk(1, "Hopper Attack", "enemy", 1, 2.5, [dbf("GLANCING", .3)]), atk(2, "Scan for Weak Spots", "enemy", 1, 2.0, [dbf("BRAND", 1), dbf("DEF_BREAK", .5)]), atk(3, "Frog Splash", "aoe_enemies", 1, 2.6, [dbf("DEF_BREAK", .6)])] },
      { v: "g", n: "Hopper 2", season: 3, type: "Endurance", rar: 3, team: "BBA Revolution", look: { ring: "#3a8a5a", ring2: "#f2d04e", disk: "#b0b8c8", base: "#1a2a1a", shape: "flat" },
        talent: T("Battle Data", "TEAM_ATB_START", { amount: .1 }),
        skills: [atk(1, "Hopper Leap", "enemy", 2, 1.35, [dbf("ATK_DOWN", .25)]), sup(2, "Dizzi's Data", "team", [teamBuff("CRIT_RATE_UP"), teamBuff("ATK_UP"), cleanse(1)]), atk(3, "Frog Splash", "aoe_enemies", 1, 3.2, [dbf("BRAND", .6)])] },
    ] },
  { n: "Daichi Sumeragi", short: "Daichi", k: "daichi", squad: "Bladebreakers",
    fig: F({ skin: "#e8c4a0", hair: "#a8302a", hs: "spiky", col: "#2f5ad8", col2: "#4a5a8a", acc: "#8a6a3a", eyec: "#3ac85a", h: .84, lc: "#c8945a", sc: "#ffd34d" }),
    beast: { n: "Strata Dragoon", kind: "dragon", el: "Earth", col: "#e8b03a", d: "The golden Earth dragon, sometimes called the fifth sacred beast. Its attacks cut like a logger's tools." },
    beys: [
      { v: "v", n: "Strata Dragoon V", season: 3, type: "Attack", rar: 4, team: "BBA Revolution", look: { ring: "#e8b03a", ring2: "#7a3a1a", disk: "#9aa4b8", base: "#4a2a10", shape: "saw" },
        talent: T("Wild Kid", "EXTRA_TURN", { chance: .15 }),
        skills: [atk(1, "Spike Slash", "enemy", 2, 1.5, [dbf("DEF_BREAK", .3)]), atk(2, "Vast Cutter", "enemy", 1, 2.8, [strip(1)]), atk(3, "Vast Hurricane", "aoe_enemies", 1, 3.8, [tmDown(.15)])] },
      { v: "g", n: "Strata Dragoon G", season: 3, type: "Attack", rar: 5, team: "BBA Revolution", look: { ring: "#f2c14e", ring2: "#c8302a", disk: "#b0b8c8", base: "#3a1a0a", shape: "saw" },
        leader: cap("ATK", .25), talent: T("Logger's Son", "EXECUTE", { amount: .4, below: .5 }),
        skills: [atk(1, "Saw Slash", "enemy", 3, 1.05, [dbf("DEF_BREAK", .25)]), atk(2, "Twin Tornado Attack", "aoe_enemies", 1, 2.2, [dbf("ATK_DOWN", .35)]), atk(3, "Great Cutter", "enemy", 1, 5.8, [dbf("DEF_BREAK", 1)], { ignoreDef: .4 })] },
      { v: "ms", n: "Strata Dragoon MS", season: 3, type: "Attack", rar: 5, team: "G Revolutions", look: { ring: "#d8c890", ring2: "#c8302a", disk: "#e0e4ec", base: "#3a2a10", shape: "saw", r: 37 },
        talent: T("Golden Dragon", "START_BUFF", { what: ["ATK_UP", "CRIT_RATE_UP"], turns: 2 }),
        skills: [atk(1, "Saw Edge", "enemy", 2, 1.6, [dbf("BRAND", .3)]), atk(2, "Earth Rumble", "aoe_enemies", 1, 2.3, [dbf("STUN", .15, 1)]), atk(3, "Spike Saw", "aoe_enemies", 1, 4.4, [strip(1)])] },
    ] },
  { n: "Hiro Granger", short: "Hiro", k: "hiro", squad: "Bladebreakers",
    fig: F({ hair: "#8ac8e8", hs: "swoop", col: "#2a3a5a", col2: "#1a1a24", acc: "#5a6a8a", trim: "#8ac8e8", eyec: "#8a5a3a", h: 1.12, lc: "#5a6a8a", sc: "#8ac8e8" }),
    beast: { n: "Metal Driger", kind: "humanoid", el: "Lightning", col: "#a8c8e8", d: "A cybernetic, humanoid Driger. Hiro launched two at once as the masked Jin of the Gale." },
    beys: [
      { v: "g", n: "Metal Driger", season: 3, type: "Balance", rar: 5, team: "BBA Revolution", look: { ring: "#8a9ab0", ring2: "#5fd4ff", disk: "#c0c8d8", base: "#2a3040", shape: "claw" },
        leader: cap("SPD", .2), talent: T("Jin of the Gale", "SELF_ATB_START", { amount: .3 }),
        skills: [atk(1, "Gale Slash", "enemy", 2, 1.5, [tmDown(.1)]), atk(2, "Twin Metal Driger", "aoe_enemies", 2, 1.15, [dbf("DEF_BREAK", .3)]), atk(3, "Wave Buster Attack", "aoe_enemies", 1, 4.0, [dbf("GLANCING", .6)])] },
    ] },
  // ===================== White Tigers =====================
  { n: "Lee", k: "lee", squad: "White Tigers",
    fig: F({ hair: "#141418", hs: "spiky", col: "#2a2a30", col2: "#f2f2f6", trim: "#d8302a", acc: "#d8302a", eyec: "#f2c14e", lc: "#3a3a4a", sc: "#9a8ae8" }),
    beast: { n: "Galeon", kind: "cat", el: "Lightning", col: "#9a8ae8", d: "A black lion, one of the White Tiger clan's Bit-Beasts." },
    beys: [
      { v: "s", n: "Galeon", season: 1, type: "Balance", rar: 4, look: { ring: "#2a2a3a", ring2: "#9a8ae8", disk: "#9aa4b8", base: "#1a1a24", shape: "claw" },
        leader: cap("ATK", .25, "White Tigers"), talent: T("Grudge", "BLOOD_HEAT", { amount: .3, below: .5 }),
        skills: [atk(1, "Lion Swipe", "enemy", 2, 1.5, [dbf("STUN", .1, 1)]), atk(2, "Copied Tiger Claw", "enemy", 1, 2.8, [dbf("DEF_BREAK", .4)]), atk(3, "Dark Lightning", "aoe_enemies", 1, 3.9, [dbf("STUN", .3, 1)])] },
      { v: "g", n: "Galeon 2", season: 3, type: "Balance", rar: 4, team: "White Tiger X", look: { ring: "#3a2a4a", ring2: "#c8b8ff", disk: "#b0b8c8", base: "#1a1424", shape: "claw" },
        talent: T("Clan Leader", "TEAM_ATB_START", { amount: .12 }),
        skills: [atk(1, "Thunder Mane", "enemy", 3, 1.0, [dbf("SLOW", .2)]), atk(2, "Double Attack", "enemy", 2, 1.4, [teamGain(.1)]), atk(3, "Spiral Lightning", "enemy", 1, 5.2, [strip(1), dbf("STUN", .3, 1)])] },
    ] },
  { n: "Mariah", k: "mariah", squad: "White Tigers",
    fig: F({ hair: "#ff8ad8", hs: "long", hlen: 40, bandana: "#ff5aa8", col: "#ff8ac8", col2: "#f2f2f6", acc: "#ff5aa8", eyec: "#f2c14e", slim: 1, h: .92, lc: "#ff5aa8", sc: "#ff8ad8" }),
    beast: { n: "Galux", kind: "cat", el: "Wind", col: "#ff8ad8", d: "A lynx: quick, playful and sharp-clawed." },
    beys: [
      { v: "s", n: "Galux", season: 1, type: "Balance", rar: 3, look: { ring: "#ff8ac8", ring2: "#ffffff", disk: "#9aa4b8", base: "#4a1a3a", shape: "claw" },
        talent: T("Playful Taunt", "HIT_DEBUFF", { what: "ATK_DOWN", chance: .3 }),
        skills: [atk(1, "Pounce Swipe", "enemy", 2, 1.4, [dbf("DOT", .2)]), atk(2, "Mountain Cat Attack", "enemy", 1, 2.6, [tmDown(.2)]), atk(3, "Cat Scratch", "enemy", 4, 1.15, [dbf("DEF_BREAK", .4)])] },
    ] },
  { n: "Gary", k: "gary", squad: "White Tigers",
    fig: F({ hair: "#141418", hs: "short", col: "#c8302a", col2: "#2a2a30", acc: "#f2d04e", eyec: "#b8a0e8", bulk: 1.35, h: 1.16, lc: "#8a5a2a", sc: "#c8945a" }),
    beast: { n: "Galzzly", kind: "ape", el: "Earth", col: "#c8945a", d: "A grizzly bear with crushing strength." },
    beys: [
      { v: "s", n: "Galzzly", season: 1, type: "Attack", rar: 3, look: { ring: "#8a5a2a", ring2: "#f2d04e", disk: "#9aa4b8", base: "#3a2a1a", shape: "spike" },
        talent: T("Big Appetite", "STAT", { stats: { hp: .15 } }),
        skills: [atk(1, "Bear Paw", "enemy", 1, 3.0, [dbf("DEF_BREAK", .3)]), atk(2, "Bear Hug", "enemy", 1, 2.4, [dbf("STUN", .3, 1)]), atk(3, "Bear Ax Attack", "enemy", 1, 5.2, [dbf("DEF_BREAK", .7)])] },
    ] },
  { n: "Kevin", k: "kevin", squad: "White Tigers",
    fig: F({ hair: "#3ac85a", hs: "pony", hlen: 16, col: "#2aa8a8", col2: "#2a4a6a", acc: "#f2d04e", eyec: "#f2c14e", h: .8, lc: "#2a8a6a", sc: "#5fdc8c" }),
    beast: { n: "Galman", kind: "ape", el: "Wind", col: "#5fdc8c", d: "A monkey whose spin throws off illusory copies." },
    beys: [
      { v: "s", n: "Galman", season: 1, type: "Defense", rar: 3, look: { ring: "#2aa88a", ring2: "#f2d04e", disk: "#9aa4b8", base: "#1a3a3a", shape: "round" },
        talent: T("Trickster", "ON_HIT_ATB", { amount: .1 }),
        skills: [atk(1, "Monkey Jab", "enemy", 2, 1.3, [dbf("GLANCING", .25)]), sup(2, "Mirror Spin", "self", [selfBuff("STEALTH", 1), selfShield(.2)]), atk(3, "Crazy Monkey Attack", "aoe_enemies", 4, .72, [dbf("GLANCING", .4)])] },
    ] },
  // ===================== All Starz =====================
  { n: "Michael", k: "michael", squad: "All Starz",
    fig: F({ hair: "#d8402a", hs: "short", cap: "#2a4aa8", col: "#f2f2f6", col2: "#f2f2f6", trim: "#d8302a", acc: "#2a4aa8", eyec: "#4aa8ff", lc: "#f2f2f6", sc: "#ffb03a" }),
    beast: { n: "Trygle", kind: "bird", el: "Fire", col: "#ffb03a", d: "An eagle that dives like a fastball." },
    beys: [
      { v: "s", n: "Trygle", season: 1, type: "Attack", rar: 4, look: { ring: "#d8302a", ring2: "#f2f2f6", disk: "#9aa4b8", base: "#2a3a6a", shape: "wing" },
        leader: cap("CR", .2, "All Starz"), talent: T("Ace Pitcher", "CRIT_DEBUFF", { what: "STUN", chance: .3, turns: 1 }),
        skills: [atk(1, "Fastball", "enemy", 1, 3.0, [tmDown(.1, .5)]), atk(2, "Curveball", "enemy", 2, 1.4, [dbf("GLANCING", .4)]), atk(3, "Fast Ball Attack", "enemy", 1, 5.4, [dbf("STUN", .3, 1)])] },
      { v: "g", n: "Trygle 2", season: 3, type: "Attack", rar: 4, team: "PPB All Starz", look: { ring: "#b8202a", ring2: "#ffd34d", disk: "#b0b8c8", base: "#1a2a5a", shape: "wing" },
        talent: T("Captain's Arm", "SELF_ATB_START", { amount: .25 }),
        skills: [atk(1, "Sinker", "enemy", 2, 1.5, [dbf("DEF_BREAK", .3)]), atk(2, "Changeup", "aoe_enemies", 1, 2.0, [tmDown(.15)]), atk(3, "Maximum Cannonball Flame Attack", "enemy", 1, 5.6, [dbf("DOT", .6)])] },
    ] },
  { n: "Emily", k: "emily", squad: "All Starz",
    fig: F({ hair: "#ff8a3a", hs: "bob", glasses: "#c8302a", col: "#3a9a5a", col2: "#f2f2f6", robe: "skirt", acc: "#2a4aa8", slim: 1, h: .92, lc: "#2a6a5a", sc: "#3ac88a" }),
    beast: { n: "Trygator", kind: "lizard", el: "Water", col: "#3ac88a", d: "An alligator that drags opponents under." },
    beys: [
      { v: "s", n: "Trygator", season: 1, type: "Endurance", rar: 3, look: { ring: "#3a8a5a", ring2: "#f2f2f6", disk: "#9aa4b8", base: "#1a3a2a", shape: "flat" },
        talent: T("Statistics", "BONUS_VS_DEBUFFED", { amount: .2 }),
        skills: [atk(1, "Tennis Smash", "enemy", 1, 2.6, [dbf("ATK_DOWN", .3)]), atk(2, "Data Lob", "aoe_enemies", 1, 1.8, [dbf("SLOW", .35)]), atk(3, "Water Smash", "aoe_enemies", 1, 2.8, [dbf("HEAL_BLOCK", .5)])] },
    ] },
  { n: "Steve", k: "steve", squad: "All Starz",
    fig: F({ hair: "#3ac85a", hs: "short", col: "#2a4aa8", col2: "#c8c8d0", trim: "#f2f2f6", acc: "#f2f2f6", bulk: 1.3, h: 1.12, lc: "#2a4aa8", sc: "#c86a3a" }),
    beast: { n: "Tryhorn", kind: "horned", el: "Earth", col: "#c86a3a", d: "A horned beast that charges like a linebacker." },
    beys: [
      { v: "s", n: "Tryhorn", season: 1, type: "Attack", rar: 3, look: { ring: "#c86a3a", ring2: "#2a4aa8", disk: "#9aa4b8", base: "#3a2a1a", shape: "spike" },
        talent: T("Linebacker", "ON_HIT_ATB", { amount: .1 }),
        skills: [atk(1, "Tackle", "enemy", 1, 3.0, [tmDown(.15, .4)]), atk(2, "Blitz Rush", "aoe_enemies", 1, 2.0, [dbf("STUN", .12, 1)]), atk(3, "Stampede Rush", "aoe_enemies", 1, 3.6, [tmDown(.2)])] },
    ] },
  { n: "Eddy", k: "eddy", squad: "All Starz",
    fig: F({ skin: "#b88a6a", hair: "#1a1a20", hs: "short", col: "#d8302a", col2: "#d8302a", trim: "#f2f2f6", acc: "#f2f2f6", h: 1.12, lc: "#d8302a", sc: "#d8b84a" }),
    beast: { n: "Trypio", kind: "lizard", el: "Earth", col: "#d8b84a", d: "A scorpion with a huge stinger." },
    beys: [
      { v: "s", n: "Trypio", season: 1, type: "Defense", rar: 3, look: { ring: "#d8b84a", ring2: "#d8302a", disk: "#9aa4b8", base: "#3a3a1a", shape: "round" },
        talent: T("Show-Off", "COUNTER", { chance: .25 }),
        skills: [atk(1, "Crossover", "enemy", 1, 2.6, [dbf("PROVOKE", .3, 1)]), sup(2, "Full-Court Press", "self", [taunt(2), selfBuff("DEF_UP")]), atk(3, "Sting Shoot", "enemy", 1, 4.4, [dbf("DOT", 1), dbf("HEAL_BLOCK", .5)])] },
    ] },
  { n: "Rick Anderson", short: "Rick", k: "rick", squad: "All Starz",
    fig: F({ skin: "#e8c8a8", hair: "#f2f2f6", hs: "spiky", col: "#3a3a44", col2: "#5a4a3a", acc: "#c8302a", bulk: 1.25, h: 1.12, lc: "#5a4a3a", sc: "#a87a4a" }),
    beast: { n: "Rock Bison", kind: "horned", el: "Earth", col: "#c89a6a", d: "A bison that drops meteors of rock." },
    beys: [
      { v: "g", n: "Rock Bison", season: 3, type: "Defense", rar: 4, team: "PPB All Starz", look: { ring: "#8a6a3a", ring2: "#d8c8a0", disk: "#b0b8c8", base: "#3a2a1a", shape: "round" },
        talent: T("Loner", "DMG_REDUCE", { amount: .12 }),
        skills: [atk(1, "Boulder Bash", "enemy", 1, 2.8, [dbf("DEF_BREAK", .3)]), sup(2, "Rock Wall", "self", [taunt(2), selfShield(.25), selfBuff("COUNTER")]), atk(3, "Drop Rock Attack", "aoe_enemies", 1, 3.2, [dbf("STUN", .25, 1)])] },
    ] },
  // ===================== Majestics =====================
  { n: "Robert Jürgens", short: "Robert", k: "robert", squad: "Majestics",
    fig: F({ hair: "#8a5ad8", hs: "swoop", col: "#3a5aa8", col2: "#2a2a3a", trim: "#f2c14e", cape: "#5a2a6a", acc: "#f2c14e", eyec: "#8a5a3a", h: 1.08, lc: "#8a8aa0", sc: "#b07bff" }),
    beast: { n: "Griffolyon", kind: "bird", el: "Wind", col: "#b07bff", d: "A griffin, the pride of the Jürgens family." },
    beys: [
      { v: "s", n: "Griffolyon", season: 1, type: "Attack", rar: 4, look: { ring: "#6a4ab8", ring2: "#f2c14e", disk: "#9aa4b8", base: "#2a1a4a", shape: "wing" },
        leader: cap("ATK", .25, "Majestics"), talent: T("Noble Pride", "START_BUFF", { what: ["CRIT_RATE_UP"], turns: 2 }),
        skills: [atk(1, "Flail Launch", "enemy", 1, 3.0, [dbf("DEF_BREAK", .3)]), atk(2, "Checkmate", "enemy", 1, 2.6, [strip(1), bonusVs("BRAND", .4)]), atk(3, "Wing Dagger", "aoe_enemies", 2, 1.9, [dbf("BRAND", .5)])] },
    ] },
  { n: "Johnny McGregor", short: "Johnny", k: "johnny", squad: "Majestics",
    fig: F({ hair: "#a8302a", hs: "spiky", bandana: "#2f6fd8", col: "#d8c8a0", col2: "#5a4a3a", acc: "#2f6fd8", eyec: "#9a6ad8", lc: "#8a8a90", sc: "#5fb4ff" }),
    beast: { n: "Salamalyon", kind: "lizard", el: "Fire", col: "#5fb4ff", d: "A salamander wreathed in blue flames." },
    beys: [
      { v: "s", n: "Salamalyon", season: 1, type: "Endurance", rar: 3, look: { ring: "#2a6ab8", ring2: "#ff7a3a", disk: "#9aa4b8", base: "#1a2a4a", shape: "flat" },
        talent: T("Gladiator of Glasgow", "BLOOD_HEAT", { amount: .3, below: .5 }),
        skills: [atk(1, "Axe Launch", "enemy", 1, 2.8, [dbf("DOT", .35)]), atk(2, "Blue Flame", "aoe_enemies", 1, 1.9, [dbf("DOT", .4)]), atk(3, "Fire Rod", "enemy", 1, 4.6, [dbf("DOT", 1)])] },
    ] },
  { n: "Enrique", k: "enrique", squad: "Majestics",
    fig: F({ hair: "#f2d27a", hs: "curly", col: "#f2d04e", col2: "#f2f2f6", trim: "#d8302a", acc: "#d8302a", eyec: "#8a9ab8", lc: "#c8a64a", sc: "#ffd86a" }),
    beast: { n: "Amphilyon", kind: "lizard", el: "Earth", col: "#ffd86a", d: "A two-headed beast whose heads think for themselves." },
    beys: [
      { v: "s", n: "Amphilyon", season: 1, type: "Balance", rar: 3, look: { ring: "#f2c14e", ring2: "#d8302a", disk: "#9aa4b8", base: "#4a3a1a", shape: "claw" },
        talent: T("Two Heads", "EXTRA_TURN", { chance: .15 }),
        skills: [atk(1, "Centurion Strike", "enemy", 2, 1.45, [dbf("GLANCING", .25)]), atk(2, "Charm", "enemy", 1, 2.0, [dbf("ATK_DOWN", .5), dbf("PROVOKE", .3, 1)]), atk(3, "Twin Head Attack", "enemy", 2, 2.75, [strip(1)])] },
    ] },
  { n: "Oliver", k: "oliver", squad: "Majestics",
    fig: F({ hair: "#5fdc5a", hs: "bob", cap: "#2f4aa8", scarf: "#f2f2f6", col: "#2f4aa8", col2: "#2a2a3a", robe: "robe", acc: "#c8302a", eyec: "#b8a0e8", slim: 1, lc: "#ff8ad8", sc: "#ff9ad8" }),
    beast: { n: "Unicolyon", kind: "horse", el: "Light", col: "#ff9ad8", d: "A unicorn that can shake the whole dish." },
    beys: [
      { v: "s", n: "Unicolyon", season: 1, type: "Defense", rar: 3, look: { ring: "#ff8ac8", ring2: "#f2f2f6", disk: "#9aa4b8", base: "#4a1a3a", shape: "round" },
        talent: T("Artist's Eye", "TEAM_DMG_REDUCE", { amount: .06 }),
        skills: [atk(1, "Horn Thrust", "enemy", 1, 2.6, [dbf("DEF_BREAK", .3)]), sup(2, "Gourmet Break", "team", [allyHeal(.15), cleanse(1)]), atk(3, "Earth Shake", "aoe_enemies", 1, 2.8, [dbf("STUN", .25, 1), aoeTm(.1)])] },
    ] },
  // ===================== Demolition Boys / Blitzkrieg Boys =====================
  { n: "Tala", k: "tala", squad: "Demolition Boys",
    fig: F({ skin: "#f8e8e0", hair: "#d8402a", hs: "swoop", col: "#f2f2f6", col2: "#e8e8ee", trim: "#5a6a8a", acc: "#5a6a8a", eyec: "#8ad8ff", h: 1.04, lc: "#5a6a8a", sc: "#cfe8ff" }),
    beast: { n: "Wolborg", kind: "wolf", el: "Ice", col: "#cfe8ff", d: "A wolf Bit-Beast made at Balkov Abbey. It freezes the whole dish." },
    beys: [
      { v: "s", n: "Wolborg 2", season: 1, type: "Balance", rar: 5, look: { ring: "#e8eef8", ring2: "#5a8ad8", disk: "#9aa4b8", base: "#2a3a5a", shape: "flat" },
        leader: cap("ATK", .25, "Demolition Boys"), talents: [T("Cyber Tala", "IMMUNE_LIST", { list: ["STUN", "SILENCE"] }), T("Frozen Field", "BONUS_VS_DEBUFFED", { amount: .25 })],
        skills: [atk(1, "Ice Fang", "enemy", 2, 1.5, [dbf("SLOW", .3)]), atk(2, "Frost Howl", "aoe_enemies", 1, 2.0, [dbf("ATK_DOWN", .4)]), atk(3, "Blizzalog", "aoe_enemies", 1, 4.2, [dbf("STUN", .45, 1)])] },
      { v: "g", n: "Wolborg 4", season: 3, type: "Endurance", rar: 5, team: "Blitzkrieg Boys", look: { ring: "#cfe8ff", ring2: "#2a4a8a", disk: "#c0c8d8", base: "#1a2a4a", shape: "flat" },
        leader: cap("HP", .25, "Demolition Boys"), talent: T("Frozen Heart", "HIT_DEBUFF", { what: "SLOW", chance: .35 }),
        skills: [atk(1, "Snow Fang", "enemy", 2, 1.45, [dbf("SLOW", .3)]), atk(2, "Whiteout", "aoe_enemies", 1, 1.8, [dbf("HEAL_BLOCK", .4), tmDown(.1)]), atk(3, "Novae Rog", "enemy", 1, 5.4, [dbf("STUN", .6, 1)], { ignoreDef: .3 })] },
    ] },
  { n: "Bryan", k: "bryan", squad: "Demolition Boys",
    fig: F({ skin: "#f2e0d4", hair: "#b8a0d8", hs: "spiky", col: "#6a1a2a", col2: "#2a2a4a", acc: "#2a2a4a", eyec: "#b8a0d8", h: 1.06, lc: "#4a3a5a", sc: "#b8a0d8" }),
    beast: { n: "Falborg", kind: "bird", el: "Wind", col: "#b8a0d8", d: "A falcon made at Balkov Abbey. It strikes with blades of wind." },
    beys: [
      { v: "s", n: "Falborg", season: 1, type: "Attack", rar: 4, look: { ring: "#6a5a8a", ring2: "#d8c8ff", disk: "#9aa4b8", base: "#2a1a2a", shape: "wing" },
        talent: T("Ruthless", "EXECUTE", { amount: .4, below: .5 }),
        skills: [atk(1, "Talon Strike", "enemy", 2, 1.55, [dbf("DOT", .3)]), atk(2, "Blader Strike", "enemy", 1, 2.6, [dbf("HEAL_BLOCK", .6), dbf("ATK_DOWN", .4)]), atk(3, "Stroblitz", "enemy", 1, 5.4, [dbf("DEF_BREAK", .8)], { ignoreDef: .3 })] },
      { v: "g", n: "Falborg 2", season: 3, type: "Attack", rar: 4, team: "Blitzkrieg Boys", look: { ring: "#4a3a6a", ring2: "#ff8ad8", disk: "#b0b8c8", base: "#1a0e1a", shape: "spike" },
        talent: T("Wind Blades", "CRIT_DEBUFF", { what: "DOT", chance: .5 }),
        skills: [atk(1, "Wind Blade", "enemy", 3, 1.05, [dbf("DOT", .25)]), atk(2, "Gale Cutter", "aoe_enemies", 1, 2.1, [dbf("DEF_BREAK", .35)]), atk(3, "Stroblitz Attack", "aoe_enemies", 1, 4.0, [dbf("DOT", .7)])] },
    ] },
  { n: "Spencer", k: "spencer", squad: "Demolition Boys",
    fig: F({ hair: "#f2d27a", hs: "short", col: "#4a4a5a", col2: "#2a2a3a", acc: "#2a2a3a", bulk: 1.3, h: 1.18, lc: "#3a4a6a", sc: "#3a8ad8" }),
    beast: { n: "Seaborg", kind: "fish", el: "Water", col: "#3a8ad8", d: "A whale-like sea beast made at Balkov Abbey. It is strongest in water stadiums." },
    beys: [
      { v: "s", n: "Seaborg 2", season: 1, type: "Balance", rar: 3, look: { ring: "#2a5a9a", ring2: "#cfe8ff", disk: "#9aa4b8", base: "#1a2a3a", shape: "flat" },
        talent: T("Silent Giant", "STAT", { stats: { hp: .12, def: .1 } }),
        skills: [atk(1, "Tail Slam", "enemy", 1, 2.8, [tmDown(.15, .4)]), sup(2, "Deep Dive", "self", [selfBuff("DEF_UP"), selfShield(.2), selfGain(.2)]), atk(3, "Stramolyu", "aoe_enemies", 1, 3.4, [dbf("SLOW", .5)])] },
    ] },
  { n: "Ian", k: "ian", squad: "Demolition Boys",
    fig: F({ hair: "#3a2a7a", hs: "short", glasses: "#f2c14e", col: "#4a3a5a", col2: "#2a2a3a", acc: "#2a2a3a", eyec: "#d84aa8", h: .8, lc: "#4a5a2a", sc: "#a8c84a" }),
    beast: { n: "Wyborg", kind: "serpent", el: "Earth", col: "#a8c84a", d: "A sidewinder snake made at Balkov Abbey. It binds opponents in sand." },
    beys: [
      { v: "s", n: "Wyborg", season: 1, type: "Balance", rar: 3, look: { ring: "#6a8a3a", ring2: "#d8c84a", disk: "#9aa4b8", base: "#2a3a1a", shape: "claw" },
        talent: T("Cold Calculation", "HIT_DEBUFF", { what: "SLOW", chance: .3 }),
        skills: [atk(1, "Sidewinder", "enemy", 2, 1.4, [dbf("SLOW", .3)]), atk(2, "Coil", "enemy", 1, 2.6, [dbf("STUN", .4, 1)]), atk(3, "Sand Bind", "aoe_enemies", 1, 3.4, [dbf("SLOW", .7), dbf("STUN", .15, 1)])] },
    ] },
  // ===================== Dark Bladers =====================
  { n: "Sanguinex", k: "sanguinex", squad: "Dark Bladers",
    fig: F({ skin: "#e8e0e8", hair: "#141418", hs: "swoop", col: "#2a0a1a", col2: "#1a0a14", cape: "#1a0a14", trim: "#c8302a", acc: "#c8302a", eyec: "#ff3b5c", h: 1.1, slim: 1, lc: "#3a1a2a", sc: "#c83a5a" }),
    beast: { n: "Draculor", kind: "bird", el: "Dark", col: "#d84a6a", d: "A vampire bat that drains its prey." },
    beys: [
      { v: "s", n: "Draculor", season: 1, type: "Endurance", rar: 4, look: { ring: "#5a0a1a", ring2: "#ff5a6a", disk: "#6a606a", base: "#1a0a10", shape: "wing" },
        leader: cap("HP", .25, "Dark Bladers"), talent: T("Vampire", "LIFESTEAL", { amount: .2 }),
        skills: [atk(1, "Bloodsucker", "enemy", 2, 1.4, [dbf("HEAL_BLOCK", .3)]), atk(2, "Night Flight", "aoe_enemies", 1, 1.8, [dbf("SLOW", .3)]), atk(3, "Drac-Attack", "enemy", 1, 4.6, [selfHeal(.2), dbf("HEAL_BLOCK", .8)])] },
    ] },
  { n: "Lupinex", k: "lupinex", squad: "Dark Bladers",
    fig: F({ skin: "#c8b8a8", hair: "#6a6a7a", hs: "spiky", col: "#3a3040", col2: "#2a2a30", acc: "#6a6a7a", eyec: "#f2c14e", bulk: 1.1, lc: "#3a3040", sc: "#a89ab8" }),
    beast: { n: "Lycanlor", kind: "wolf", el: "Dark", col: "#a89ab8", d: "A werewolf that hunts under the full moon." },
    beys: [
      { v: "s", n: "Lycanlor", season: 1, type: "Attack", rar: 3, look: { ring: "#5a5a6a", ring2: "#f2c14e", disk: "#6a606a", base: "#1a1a20", shape: "claw" },
        talent: T("Full Moon", "EXECUTE", { amount: .35, below: .5 }),
        skills: [atk(1, "Wolf Bite", "enemy", 2, 1.5, [dbf("DOT", .25)]), sup(2, "Howl", "self", [selfBuff("ATK_UP"), selfGain(.25)]), atk(3, "Wolf Storm", "aoe_enemies", 1, 3.6, [dbf("DEF_BREAK", .4)])] },
    ] },
  { n: "Cenotaph", k: "cenotaph", squad: "Dark Bladers",
    fig: F({ skin: "#e8dcc0", hs: "bald", hair: "#d8ccb0", col: "#e8dcc0", col2: "#d8ccb0", boot: "#c8bca0", acc: "#a89a7a", eyec: "#5fd4ff", slim: 1, lc: "#a89a7a", sc: "#5fd4ff" }),
    beast: { n: "Sarcophalon", kind: "humanoid", el: "Dark", col: "#d8c89a", d: "A mummy wrapped in cursed bandages." },
    beys: [
      { v: "s", n: "Sarcophalon", season: 1, type: "Defense", rar: 3, look: { ring: "#c8b88a", ring2: "#5fd4ff", disk: "#8a806a", base: "#3a3020", shape: "round" },
        talent: T("Eternal Rest", "REVIVE_ONCE", { amount: .25, buff: "INVINCIBLE", turns: 1 }),
        skills: [atk(1, "Bandage Whip", "enemy", 1, 2.5, [dbf("SLOW", .35)]), sup(2, "Sarcophagus", "self", [taunt(2), selfShield(.25)]), atk(3, "Bandage Guard", "aoe_enemies", 1, 2.6, [dbf("STUN", .25, 1), teamShield(.12)])] },
    ] },
  { n: "Zomb", k: "zomb", squad: "Dark Bladers",
    fig: F({ skin: "#9ac88a", hair: "#1a1a20", hs: "short", col: "#4a4a3a", col2: "#2a2a24", acc: "#5a5a4a", eyec: "#ff3b5c", bulk: 1.25, h: 1.1, lc: "#4a4a3a", sc: "#7ab86a" }),
    beast: { n: "Shamblor", kind: "humanoid", el: "Dark", col: "#8ac87a", d: "A shambling undead brute." },
    beys: [
      { v: "s", n: "Shamblor", season: 1, type: "Defense", rar: 3, look: { ring: "#5a7a4a", ring2: "#c8ff9a", disk: "#6a706a", base: "#2a2a1a", shape: "round" },
        talent: T("Undead", "REGEN", { amount: .05 }),
        skills: [atk(1, "Shamble Slam", "enemy", 1, 2.7, [dbf("ATK_DOWN", .3)]), atk(2, "Grave Hold", "enemy", 1, 2.0, [dbf("PROVOKE", .5, 1), selfBuff("DEF_UP")]), atk(3, "Grave Crush", "aoe_enemies", 1, 2.8, [dbf("SLOW", .5)])] },
    ] },
  // ===================== Saint Shields =====================
  { n: "Ozuma", k: "ozuma", squad: "Saint Shields",
    fig: F({ skin: "#e0b890", hair: "#d8302a", hair2: "#141418", hs: "spiky", col: "#8a6a3a", col2: "#4a3a2a", acc: "#2a8a8a", trim: "#2a8a8a", eyec: "#3ac85a", lc: "#6a4a2a", sc: "#ffb03a" }),
    beast: { n: "Flash Leopard", kind: "cat", el: "Fire", col: "#ffb03a", d: "A leopard of sacred fire, given to Ozuma to seal the Sacred Bit-Beasts." },
    beys: [
      { v: "v", n: "Flash Leopard", season: 2, type: "Balance", rar: 4, look: { ring: "#e8902a", ring2: "#2a8a8a", disk: "#9aa4b8", base: "#4a2a10", shape: "claw" },
        talent: T("Mr. X", "SELF_ATB_START", { amount: .25 }),
        skills: [atk(1, "Leopard Dash", "enemy", 2, 1.5, [dbf("DOT", .25)]), atk(2, "Sealing Strike", "enemy", 1, 2.4, [dbf("SILENCE", .7, 1)]), atk(3, "Sacred Fire", "aoe_enemies", 1, 3.6, [dbf("DOT", .7)])] },
      { v: "v2", n: "Flash Leopard 2", season: 2, type: "Balance", rar: 5, look: { ring: "#ffb03a", ring2: "#d8302a", disk: "#b8c0d0", base: "#3a1a0a", shape: "claw" },
        leader: cap("HP", .25, "Saint Shields"), talent: T("Sealing Rite", "HIT_DEBUFF", { what: "SILENCE", chance: .25, turns: 1 }),
        skills: [atk(1, "Flash Strike", "enemy", 3, 1.05, [dbf("SILENCE", .1, 1)]), sup(2, "Invisible Beast", "self", [selfBuff("STEALTH", 1), selfBuff("ATK_UP"), selfGain(.25)]), atk(3, "Cross Fire", "aoe_enemies", 2, 2.1, [dbf("DOT", .6), dbf("SILENCE", .3, 1)])] },
    ] },
  { n: "Mariam", k: "mariam", squad: "Saint Shields",
    fig: F({ skin: "#e8c4a0", hair: "#2f6fd8", hs: "pony", hlen: 34, col: "#8a7a4a", col2: "#4a3a2a", acc: "#2a8a8a", eyec: "#3ac85a", slim: 1, lc: "#2a6a8a", sc: "#4ab8ff" }),
    beast: { n: "Sharkrash", kind: "fish", el: "Water", col: "#4ab8ff", d: "A shark that strikes from the depths." },
    beys: [
      { v: "v", n: "Sharkrash", season: 2, type: "Defense", rar: 3, look: { ring: "#2a7ab8", ring2: "#f2f2f6", disk: "#9aa4b8", base: "#1a2a3a", shape: "round" },
        talent: T("Big Sister", "TEAM_DMG_REDUCE", { amount: .06 }),
        skills: [atk(1, "Shark Bite", "enemy", 2, 1.3, [dbf("HEAL_BLOCK", .25)]), atk(2, "Seal Wave", "aoe_enemies", 1, 1.8, [dbf("SILENCE", .3, 1)]), atk(3, "Abyss Fire", "aoe_enemies", 1, 3.0, [dbf("DOT", .6)])] },
    ] },
  { n: "Dunga", k: "dunga", squad: "Saint Shields",
    fig: F({ skin: "#c8946a", hair: "#f2d27a", hs: "short", bandana: "#8a8a90", col: "#7a5a3a", col2: "#4a3a2a", acc: "#2a8a8a", eyec: "#3ac85a", bulk: 1.35, h: 1.16, lc: "#6a4a2a", sc: "#f2d04e" }),
    beast: { n: "Vortex Ape", kind: "ape", el: "Lightning", col: "#f2d04e", d: "A huge ape crackling with sparks." },
    beys: [
      { v: "v", n: "Vortex Ape", season: 2, type: "Attack", rar: 3, look: { ring: "#8a6a2a", ring2: "#f2d04e", disk: "#9aa4b8", base: "#3a2a10", shape: "spike" },
        talent: T("Hot Temper", "BLOOD_HEAT", { amount: .35, below: .5 }),
        skills: [atk(1, "Ape Smash", "enemy", 1, 3.1, [dbf("DEF_BREAK", .3)]), atk(2, "Ground Pound", "aoe_enemies", 1, 2.1, [dbf("STUN", .15, 1)]), atk(3, "Spark Hammer", "enemy", 1, 5.4, [dbf("STUN", .4, 1)])] },
    ] },
  { n: "Joseph", k: "joseph", squad: "Saint Shields",
    fig: F({ skin: "#e0b890", hair: "#3ac85a", hs: "short", col: "#8a7a4a", col2: "#4a3a2a", acc: "#2a8a8a", eyec: "#3ac85a", h: .82, lc: "#4a6a3a", sc: "#9ac86a" }),
    beast: { n: "Vanishing Moot", kind: "lizard", el: "Earth", col: "#9ac86a", d: "A Bit-Beast that hides itself from sight." },
    beys: [
      { v: "v", n: "Vanishing Moot", season: 2, type: "Endurance", rar: 3, look: { ring: "#5a8a3a", ring2: "#d8c8a0", disk: "#9aa4b8", base: "#2a3a1a", shape: "flat" },
        talent: T("Youngest Guardian", "TEAM_DMG_REDUCE", { amount: .06 }),
        skills: [atk(1, "Vanish Strike", "enemy", 2, 1.45, [dbf("GLANCING", .3)]), sup(2, "Hidden Village", "team", [allyHeal(.12), teamBuff("DEF_UP")]), atk(3, "Great Rock", "aoe_enemies", 1, 3.2, [dbf("DEF_BREAK", .6), dbf("STUN", .15, 1)])] },
    ] },
  // ===================== Team Psykick =====================
  { n: "Kane Yamashita", short: "Kane", k: "kane", squad: "Team Psykick",
    fig: F({ hair: "#1e2a4a", hs: "spiky", col: "#5a2a8a", col2: "#1a1a24", acc: "#1a1a24", trim: "#c8a8ff", eyec: "#4aa8ff", lc: "#3a3a4a", sc: "#7ab0d8" }),
    beast: { n: "Cyber Dragoon", kind: "dragon", el: "Wind", col: "#8ab8e8", d: "A machine copy of Dragoon, built by Team Psykick from battle data." },
    beys: [
      { v: "v", n: "Cyber Dragoon", season: 2, type: "Balance", rar: 4, look: { ring: "#5a6a8a", ring2: "#5fd4ff", disk: "#8a909a", base: "#1a1a24", shape: "wing" },
        leader: cap("ATK", .22, "Team Psykick"), talent: T("Cyber Link", "ARC_SELF_ATB", { amount: .3 }),
        skills: [atk(1, "Cyber Smash", "enemy", 2, 1.5, [dbf("DEF_BREAK", .3)]), atk(2, "Data Copy", "enemy", 1, 2.4, [strip(1), selfBuff("ATK_UP")]), atk(3, "Perfect Delete", "enemy", 1, 5.2, [strip(2)])] },
    ] },
  { n: "Salima", k: "salima", squad: "Team Psykick",
    fig: F({ hair: "#d8302a", hs: "long", hlen: 40, col: "#5a2a8a", col2: "#f2f2f6", robe: "skirt", acc: "#1a1a24", eyec: "#6a3a8a", slim: 1, lc: "#3a3a4a", sc: "#a8d8a8" }),
    beast: { n: "Cyber Driger", kind: "cat", el: "Lightning", col: "#b8e8b8", d: "A machine copy of Driger, built by Team Psykick." },
    beys: [
      { v: "v", n: "Cyber Driger", season: 2, type: "Balance", rar: 3, look: { ring: "#6a7a6a", ring2: "#c8ff8a", disk: "#8a909a", base: "#1a1a24", shape: "claw" },
        talent: T("Fair Play", "TEAM_ATB_START", { amount: .1 }),
        skills: [atk(1, "Cyber Swipe", "enemy", 2, 1.45, [dbf("SLOW", .25)]), atk(2, "System Overload", "aoe_enemies", 1, 1.9, [dbf("STUN", .15, 1)]), atk(3, "Cyber Claw", "enemy", 3, 1.6, [dbf("DEF_BREAK", .5)])] },
    ] },
  { n: "Goki", k: "goki", squad: "Team Psykick",
    fig: F({ hair: "#141418", hs: "short", col: "#f2d04e", col2: "#2f4aa8", boot: "#d8302a", acc: "#2f4aa8", lc: "#3a3a4a", sc: "#d88a6a" }),
    beast: { n: "Cyber Dranzer", kind: "bird", el: "Fire", col: "#e89a7a", d: "A machine copy of Dranzer, built by Team Psykick." },
    beys: [
      { v: "v", n: "Cyber Dranzer", season: 2, type: "Attack", rar: 3, look: { ring: "#8a5a5a", ring2: "#ffb03a", disk: "#8a909a", base: "#1a1a24", shape: "wing" },
        talent: T("Overclocked", "STAT", { stats: { atk: .1, spd: .05 } }),
        skills: [atk(1, "Cyber Flame", "enemy", 1, 3.0, [dbf("DOT", .3)]), atk(2, "Burner Dive", "aoe_enemies", 1, 2.0, [dbf("DOT", .35)]), atk(3, "Blast Impress", "enemy", 1, 5.2, [dbf("DEF_BREAK", .6)])] },
    ] },
  { n: "Jim", k: "jim", squad: "Team Psykick",
    fig: F({ hair: "#f2d27a", hs: "short", col: "#2f6fd8", col2: "#2a2a3a", acc: "#5a2a8a", lc: "#3a3a4a", sc: "#6aa8b8" }),
    beast: { n: "Cyber Draciel", kind: "turtle", el: "Water", col: "#7ab8c8", d: "A machine copy of Draciel, built by Team Psykick." },
    beys: [
      { v: "v", n: "Cyber Draciel", season: 2, type: "Defense", rar: 3, look: { ring: "#5a7a8a", ring2: "#5fd4ff", disk: "#8a909a", base: "#1a1a24", shape: "round" },
        talent: T("Tactician", "COUNTER", { chance: .25 }),
        skills: [atk(1, "Cyber Shell", "enemy", 1, 2.6, [dbf("ATK_DOWN", .3)]), sup(2, "Firewall", "self", [taunt(2), selfShield(.25)]), atk(3, "Sonic Radiation", "aoe_enemies", 1, 2.8, [dbf("GLANCING", .5), dbf("ATK_DOWN", .4)])] },
    ] },
  // ===================== Team Zagart and the Parts Hunters =====================
  { n: "Zeo Zagart", short: "Zeo", k: "zeo", squad: "Team Zagart",
    fig: F({ skin: "#f4e0d4", hair: "#3ac8c8", hs: "long", hlen: 30, col: "#f2f2f6", col2: "#e8e8ee", trim: "#8a4ad8", acc: "#8a4ad8", eyec: "#3ac8c8", slim: 1, lc: "#8a4ad8", sc: "#ff5a2a" }),
    beast: { n: "Cerberus", kind: "wolf", el: "Fire", col: "#ff5a2a", d: "The three-headed hound of the underworld, strongest of the ancient rock's Bit-Beasts." },
    beys: [
      { v: "v", n: "Burning Cerberus", season: 2, type: "Endurance", rar: 5, look: { ring: "#c8302a", ring2: "#2a2a30", disk: "#b8c0d0", base: "#2a0a0a", shape: "flat" },
        leader: cap("HP", .25), talent: T("Android Heart", "REVIVE_ONCE", { amount: .3, buff: "INVINCIBLE", turns: 1 }),
        skills: [atk(1, "Hellhound Fang", "enemy", 3, 1.05, [dbf("DOT", .3)]), atk(2, "Bit-Beast Absorb", "enemy", 1, 2.4, [strip(2), selfHeal(.15)]), atk(3, "Chain Storm", "aoe_enemies", 1, 3.8, [dbf("DOT", .8)])] },
    ] },
  { n: "Gordo", k: "gordo", squad: "Team Zagart",
    fig: F({ hair: "#e8602a", hs: "spiky", col: "#3a3a4a", col2: "#2a2a3a", acc: "#5fd4ff", eyec: "#5fd4ff", h: 1.15, lc: "#3a4a6a", sc: "#8ad8ff" }),
    beast: { n: "Orthrus", kind: "wolf", el: "Ice", col: "#8ad8ff", d: "A two-headed hound of ice, Cerberus's brother." },
    beys: [
      { v: "v", n: "Blizzard Orthrus", season: 2, type: "Attack", rar: 4, look: { ring: "#5a9ad8", ring2: "#f2f2f6", disk: "#9aa4b8", base: "#1a2a4a", shape: "spike" },
        talent: T("Brother Beast", "ON_HIT_ATB", { amount: .1 }),
        skills: [atk(1, "Twin Fang", "enemy", 2, 1.5, [dbf("SLOW", .3)]), atk(2, "Frozen Breath", "aoe_enemies", 1, 2.0, [dbf("ATK_DOWN", .35)]), atk(3, "Twin Spire", "enemy", 1, 5.4, [dbf("STUN", .4, 1)])] },
    ] },
  { n: "King", k: "king", squad: "Parts Hunters",
    fig: F({ hair: "#f2f2f6", hs: "swoop", col: "#2a2a3a", col2: "#1a1a24", trim: "#f2c14e", acc: "#f2c14e", eyec: "#c8302a", lc: "#2a2a3a", sc: "#e8e0ff" }),
    beast: { n: "Ariel", kind: "horned", el: "Light", col: "#e8e0ff", d: "A goat-like Bit-Beast of the Parts Hunters." },
    beys: [
      { v: "v", n: "Ariel", season: 2, type: "Attack", rar: 4, look: { ring: "#c8c0e8", ring2: "#f2c14e", disk: "#9aa4b8", base: "#2a2a3a", shape: "spike" },
        leader: cap("CR", .2, "Parts Hunters"), talent: T("Parts Hunter", "BONUS_VS_DEBUFFED", { amount: .2 }),
        skills: [atk(1, "Parts Snatch", "enemy", 1, 2.6, [strip(1)]), atk(2, "Double Attack", "enemy", 2, 1.4, [teamGain(.1)]), atk(3, "Ultimate Strike", "enemy", 1, 5.6, [dbf("DEF_BREAK", .7)])] },
    ] },
  { n: "Queen", k: "queen", squad: "Parts Hunters",
    fig: F({ hair: "#3a2a5a", hs: "long", hlen: 34, col: "#2a2a3a", col2: "#1a1a24", trim: "#f2c14e", acc: "#f2c14e", eyec: "#c8302a", slim: 1, lc: "#2a2a3a", sc: "#ffb070" }),
    beast: { n: "Gabriel", kind: "god", el: "Fire", col: "#ffb070", d: "Queen's Bit-Beast, raining fire from the sky." },
    beys: [
      { v: "v", n: "Gabriel", season: 2, type: "Attack", rar: 3, look: { ring: "#e8a060", ring2: "#2a2a3a", disk: "#9aa4b8", base: "#2a1a1a", shape: "wing" },
        talent: T("Royal Pair", "TEAM_ATB_START", { amount: .1 }),
        skills: [atk(1, "Queen's Strike", "enemy", 2, 1.4, [dbf("BRAND", .25)]), atk(2, "Double Attack", "aoe_enemies", 1, 1.9, [dbf("DEF_BREAK", .3)]), atk(3, "Sky Fire", "aoe_enemies", 1, 3.6, [dbf("DOT", .6)])] },
    ] },
  // ===================== F-Dynasty =====================
  { n: "Julia Fernandez", short: "Julia", k: "julia", squad: "F-Dynasty",
    fig: F({ hair: "#ff8a2a", hair2: "#7a4a2a", hs: "long", hlen: 34, col: "#d8302a", col2: "#1a1a24", trim: "#f2d04e", acc: "#f2d04e", eyec: "#3ac85a", slim: 1, lc: "#d8302a", sc: "#f2d04e" }),
    beast: { n: "Thunder Pegasus", kind: "horse", el: "Lightning", col: "#f2d04e", d: "A winged horse of lightning." },
    beys: [
      { v: "g", n: "Thunder Pegasus", season: 3, type: "Attack", rar: 4, left: 1, look: { ring: "#f2c14e", ring2: "#d8302a", disk: "#b0b8c8", base: "#3a2a0a", shape: "wing" },
        leader: cap("SPD", .15, "F-Dynasty"), talent: T("Circus Star", "EXTRA_TURN", { chance: .2 }),
        skills: [atk(1, "Matador Pass", "enemy", 2, 1.5, [dbf("GLANCING", .25)]), atk(2, "Gemini Attack", "aoe_enemies", 2, 1.1, [teamGain(.15)]), atk(3, "Toda La Fuerza", "enemy", 1, 5.8, [dbf("STUN", .35, 1)])] },
    ] },
  { n: "Raul Fernandez", short: "Raul", k: "raul", squad: "F-Dynasty",
    fig: F({ hair: "#d8302a", hair2: "#7a4a2a", hs: "spiky", col: "#2f4aa8", col2: "#1a1a24", trim: "#f2d04e", acc: "#f2d04e", eyec: "#3ac85a", h: .92, lc: "#2f4aa8", sc: "#ff7a3a" }),
    beast: { n: "Torch Pegasus", kind: "horse", el: "Fire", col: "#ff7a3a", d: "A winged horse of flame." },
    beys: [
      { v: "g", n: "Torch Pegasus", season: 3, type: "Attack", rar: 3, look: { ring: "#e8602a", ring2: "#2f4aa8", disk: "#b0b8c8", base: "#3a1a0a", shape: "wing" },
        talent: T("Shy Twin", "BLOOD_HEAT", { amount: .3, below: .5 }),
        skills: [atk(1, "Flame Hoof", "enemy", 2, 1.5, [dbf("DOT", .3)]), atk(2, "Gemini Crash", "aoe_enemies", 1, 2.1, [dbf("DOT", .35), teamGain(.1)]), atk(3, "Fuerza Valiente", "aoe_enemies", 1, 3.6, [dbf("DOT", .8)])] },
    ] },
  // ===================== Barthez Battalion =====================
  { n: "Miguel", k: "miguel", squad: "Barthez Battalion",
    fig: F({ hair: "#f2d27a", hs: "spiky", col: "#2aa8a8", col2: "#c8302a", acc: "#f2f2f6", eyec: "#8a9ab8", lc: "#4a3a6a", sc: "#c84a8a" }),
    beast: { n: "Dark Gargoyle", kind: "gargoyle", el: "Fire", col: "#d85a9a", d: "A winged gargoyle that rides a tornado of fire." },
    beys: [
      { v: "g", n: "Dark Gargoyle", season: 3, type: "Attack", rar: 4, look: { ring: "#5a3a6a", ring2: "#ff5a3a", disk: "#9aa4b8", base: "#1a0a1a", shape: "wing" },
        leader: cap("ATK", .25, "Barthez Battalion"), talent: T("Battalion Captain", "CRIT_DEBUFF", { what: "DOT", chance: .5 }),
        skills: [atk(1, "Gargoyle Claw", "enemy", 2, 1.55, [dbf("DEF_BREAK", .3)]), sup(2, "Demon Wings", "self", [selfBuff("ATK_UP"), selfBuff("SPD_UP"), selfGain(.2)]), atk(3, "Fire Execution", "aoe_enemies", 1, 4.0, [dbf("DOT", .7)])] },
    ] },
  { n: "Mathilda", k: "mathilda", squad: "Barthez Battalion",
    fig: F({ hair: "#ff8ad8", hs: "bob", glasses: "#f2c14e", col: "#f2d04e", col2: "#8a4ad8", acc: "#8a4ad8", slim: 1, h: .86, lc: "#8a4ad8", sc: "#c86ad8" }),
    beast: { n: "Pierce Hedgehog", kind: "cat", el: "Dark", col: "#c86ad8", d: "A hedgehog with poisoned quills." },
    beys: [
      { v: "g", n: "Pierce Hedgehog", season: 3, type: "Defense", rar: 3, look: { ring: "#8a4ad8", ring2: "#f2d04e", disk: "#9aa4b8", base: "#2a1a3a", shape: "saw" },
        talent: T("Quills", "HIT_DEBUFF", { what: "DOT", chance: .35 }),
        skills: [atk(1, "Needle Roll", "enemy", 2, 1.3, [dbf("DOT", .25)]), sup(2, "Spike Ball", "self", [taunt(2), selfBuff("COUNTER"), selfShield(.15)]), atk(3, "Poison Needle", "aoe_enemies", 1, 2.8, [dbf("DOT", .7), dbf("HEAL_BLOCK", .4)])] },
    ] },
  { n: "Claude", k: "claude", squad: "Barthez Battalion",
    fig: F({ hair: "#4a6a8a", hs: "swoop", col: "#2a4a6a", col2: "#1a2a3a", acc: "#d8a85a", lc: "#2a4a6a", sc: "#d8a85a" }),
    beast: { n: "Rapid Eagle", kind: "bird", el: "Wind", col: "#d8a85a", d: "A two-headed eagle." },
    beys: [
      { v: "g", n: "Rapid Eagle", season: 3, type: "Balance", rar: 3, look: { ring: "#a87a3a", ring2: "#f2f2f6", disk: "#9aa4b8", base: "#2a1a0a", shape: "wing" },
        talent: T("Obedient", "TEAM_ATB_ON_KILL", { amount: .12 }),
        skills: [atk(1, "Talon Dive", "enemy", 2, 1.5, [tmDown(.1, .5)]), atk(2, "Twin Heads", "enemy", 2, 1.4, [dbf("BRAND", .3)]), atk(3, "Twin Saber", "enemy", 2, 2.6, [strip(1)])] },
    ] },
  { n: "Aaron", k: "aaron", squad: "Barthez Battalion",
    fig: F({ skin: "#7a5236", hair: "#141418", hs: "long", hlen: 22, col: "#f2d04e", col2: "#5a7a3a", acc: "#d8c8a0", lc: "#5a7a3a", sc: "#a8683a" }),
    beast: { n: "Rushing Boar", kind: "horned", el: "Earth", col: "#c8885a", d: "A boar with horns along its back." },
    beys: [
      { v: "g", n: "Rushing Boar", season: 3, type: "Endurance", rar: 3, look: { ring: "#8a5a2a", ring2: "#f2d04e", disk: "#9aa4b8", base: "#3a2a10", shape: "flat" },
        talent: T("Thick Hide", "DMG_REDUCE", { amount: .14 }),
        skills: [atk(1, "Tusk Gore", "enemy", 2, 1.45, [dbf("DEF_BREAK", .3)]), sup(2, "Battalion Line", "team", [teamShield(.12), teamBuff("DEF_UP")]), atk(3, "Spin Charge", "aoe_enemies", 1, 3.8, [tmDown(.2), dbf("DEF_BREAK", .3)])] },
    ] },
  // ===================== BEGA (Justice 5) =====================
  { n: "Brooklyn", k: "brooklyn", squad: "BEGA",
    fig: F({ skin: "#f6e6da", hair: "#ff8a2a", hs: "swoop", col: "#f2f2f6", col2: "#e8e8ee", robe: "robe", trim: "#f2c14e", acc: "#f2c14e", eyec: "#3ac8c8", slim: 1, h: 1.06, lc: "#1a1a24", sc: "#9a6aff" }),
    beast: { n: "Zeus", kind: "god", el: "Dark", col: "#9a6aff", d: "Brooklyn's Bit-Beast: a dark power that can swallow the whole stadium in black water." },
    beys: [
      { v: "g", n: "Zeus", season: 3, type: "Endurance", rar: 5, team: "BEGA Justice 5", look: { ring: "#1a1a24", ring2: "#9a6aff", disk: "#6a606a", base: "#0a0a12", shape: "wing" },
        leader: cap("ATK", .3, "BEGA"), talent: T("Perfect Copy", "COUNTER", { chance: .3 }),
        skills: [atk(1, "Dark Wing", "enemy", 2, 1.6, [dbf("HEAL_BLOCK", .3)]), sup(2, "Predict", "self", [selfBuff("STEALTH", 1), selfBuff("CRIT_RATE_UP"), selfGain(.3)]), atk(3, "King of Darkness", "aoe_enemies", 1, 4.6, [dbf("SILENCE", .5, 1), dbf("HEAL_BLOCK", .6)])] },
    ] },
  { n: "Garland Siebald", short: "Garland", k: "garland", squad: "BEGA",
    fig: F({ hair: "#d8dce6", hs: "pony", hlen: 36, col: "#2aa8a8", col2: "#2a2a3a", acc: "#f2c14e", eyec: "#8a5ad8", bulk: 1.15, h: 1.1, lc: "#8a8a90", sc: "#ffd34d" }),
    beast: { n: "Apollon", kind: "god", el: "Light", col: "#ffd34d", d: "The sun god, blinding and radiant." },
    beys: [
      { v: "g", n: "Apollon", season: 3, type: "Attack", rar: 5, team: "BEGA Justice 5", look: { ring: "#f2c14e", ring2: "#ffffff", disk: "#c0c8d8", base: "#4a3a0a", shape: "spike" },
        leader: cap("CD", .4), talent: T("Martial Discipline", "START_BUFF", { what: ["ATK_UP", "CRIT_RATE_UP"], turns: 2 }),
        skills: [atk(1, "Corona Saber", "enemy", 2, 1.6, [dbf("BRAND", .3)]), atk(2, "Tonfa Launch", "enemy", 1, 2.9, [tmDown(.2), selfGain(.2)]), atk(3, "Radiant Thunder", "enemy", 1, 6.0, [dbf("STUN", .5, 1)], { ignoreDef: .3 })] },
    ] },
  { n: "Mystel", k: "mystel", squad: "BEGA",
    fig: F({ skin: "#c8946a", hair: "#f2d27a", hs: "spiky", col: "#2f6fd8", col2: "#f2f2f6", trim: "#f2c14e", acc: "#f2c14e", eyec: "#4aa8ff", slim: 1, lc: "#2f6fd8", sc: "#3aa8ff" }),
    beast: { n: "Poseidon", kind: "god", el: "Water", col: "#3aa8ff", d: "The sea god, hurling a red trident." },
    beys: [
      { v: "g", n: "Poseidon", season: 3, type: "Attack", rar: 4, team: "BEGA Justice 5", look: { ring: "#2a6ad8", ring2: "#d8302a", disk: "#b0b8c8", base: "#0a1a3a", shape: "spike" },
        talent: T("Free Spirit", "EXTRA_TURN", { chance: .15 }),
        skills: [atk(1, "Trident Thrust", "enemy", 3, 1.05, [dbf("SLOW", .25)]), sup(2, "Acrobat Float", "self", [selfBuff("STEALTH", 1), selfBuff("ATK_UP"), selfGain(.3)]), atk(3, "Ocean Javelin", "enemy", 1, 5.8, [strip(1)], { ignoreDef: .3 })] },
    ] },
  { n: "Ming-Ming", k: "mingming", squad: "BEGA",
    fig: F({ skin: "#f8e4d8", hair: "#4aa8ff", hs: "buns", col: "#ff8ad8", col2: "#f2f2f6", robe: "skirt", trim: "#f2d04e", acc: "#f2d04e", eyec: "#4aa8ff", slim: 1, h: .88, lc: "#ff8ad8", sc: "#ff9ad8" }),
    beast: { n: "Venus", kind: "god", el: "Light", col: "#ff9ad8", d: "The goddess of beauty, BEGA's idol beast." },
    beys: [
      { v: "g", n: "Venus", season: 3, type: "Endurance", rar: 4, team: "BEGA Justice 5", look: { ring: "#ff8ac8", ring2: "#ffffff", disk: "#c0c8d8", base: "#4a1a3a", shape: "flat" },
        talent: T("Pop Idol", "HIT_DEBUFF", { what: "ATK_DOWN", chance: .3 }),
        skills: [atk(1, "Heart Shot", "enemy", 2, 1.3, [dbf("ATK_DOWN", .3)]), sup(2, "Encore", "team", [allyHeal(.15), teamBuff("SPD_UP")]), atk(3, "Venus Temptation", "aoe_enemies", 1, 3.0, [dbf("ATK_DOWN", .7), dbf("PROVOKE", .4, 1)])] },
    ] },
  { n: "Crusher", k: "crusher", squad: "BEGA",
    fig: F({ skin: "#8a5a3a", hs: "bald", hair: "#2a1a10", col: "#ff8a2a", col2: "#1a1a24", acc: "#1a1a24", bulk: 1.45, h: 1.24, lc: "#5a5a60", sc: "#c8945a" }),
    beast: { n: "Gigars", kind: "humanoid", el: "Earth", col: "#d8a46a", d: "A rock giant from Greek myth." },
    beys: [
      { v: "g", n: "Gigars", season: 3, type: "Balance", rar: 4, team: "BEGA Justice 5", look: { ring: "#8a6a4a", ring2: "#ff8a2a", disk: "#b0b8c8", base: "#2a1a0a", shape: "round" },
        talent: T("For Monica", "BLOOD_HEAT", { amount: .35, below: .5 }),
        skills: [atk(1, "Giant Smash", "enemy", 1, 3.0, [dbf("DEF_BREAK", .3)]), sup(2, "Rock Armor", "self", [selfShield(.3), selfBuff("DEF_UP")]), atk(3, "Demolition Ax", "enemy", 1, 5.6, [dbf("DEF_BREAK", .8)])] },
    ] },
];
// main teams, in the order they appear in the show (the Beyblades screen's team filter)
const TEAMS = [...new Set(BLADERS.map(c => c.squad))];
