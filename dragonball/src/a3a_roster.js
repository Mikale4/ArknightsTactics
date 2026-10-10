// =====================================================================
//  FIGHTERS — the Saiyan Saga and the Frieza Saga (English dub names). Each character has one or more versions (the
//  forms and outfits they fought in); every version is its own unit with a fighting style, techniques and an Ability.
//  Techniques: {name, kind, ki, mult, hits, …}. Every fighter also has the basic commands (Rush, Ki Blast, Power Up,
//  Close In, Back Off, Switch). Technique and Ability text is generated from the data (skillDesc, passiveDesc).
// =====================================================================
// kinds: melee (dash in, combo) · ki (blasts) · beam (can clash) · finger (thin, fast beam) · disc (can't be guarded)
//        bomb (huge, slow) · flash (blinds) · freeze (holds) · buff · heal · swap (Body Change)
const tq = (name, kind, ki, mult, x = {}) => ({ name, kind, ki, mult, hits: 1, ...x });
const fxS = (what, turns = 2) => ({ on: "self", what, turns });
const fxT = (what, turns = 1, chance = 1) => ({ on: "target", what, turns, chance });
const fxP = (what, turns = 2) => ({ on: "team", what, turns });
const F = x => ({ body: "human", skin: "#f3cfae", eyec: "#141418", ...x });
const T = (name, id, x = {}) => ({ name, id, ...x });
// a few looks shared by many fighters
const ARMOR = { armor: "#f2ecd8", pad: "#c8a050", suit: "#1a2a6a", boots: "#f2f2f6", bootTrim: "#d8a83a", glove: "#f2f2f6" };
const FORCE = { armor: "#f2ecd8", pad: "#6a5a8a", padStyle: "frieza", suit: "#2a2a3a", boots: "#f2f2f6", bootTrim: "#5fd4ff", glove: "#f2f2f6", scouter: "#43d67e" };
const GINYU = { armor: "#f2ecd8", pad: "#d8a83a", padStyle: "ginyu", suit: "#2a2a3a", boots: "#f2f2f6", bootTrim: "#f2f2f6", glove: "#f2f2f6", scouter: "#ff5a6a" };
const TURTLE = { top: "#ff8a1a", under: "#2f5fd8", sleeves: "short", pants: "#ff8a1a", belt: "#2f5fd8", boots: "#2f5fd8", bootTrim: "#ffd34d", wrist: "#2f5fd8", kanji: "亀" };

const CHARS = [
  // ===================== Z FIGHTERS =====================
  { n: "Goku", k: "goku", squad: "Z Fighters", race: "Saiyan", aura: "#f2f2ff", ki: "#7ad0ff",
    fig: F({ hair: "#141418", hs: "goku", ...TURTLE, kanji: "亀", tail: null }),
    vers: [
      { v: "s", n: "Goku", ver: "Saiyan Saga", season: 1, style: "Striker", rar: 4,
        leader: cap("ATK", .2, "Z Fighters"), talent: T("Saiyan Zenkai", "ZENKAI", { amount: .2 }),
        kit: [tq("Kamehameha", "beam", 40, 2.6), tq("Kaioken", "buff", 20, 0, { fx: [fxS("KAIOKEN", 2)] })] },
      { v: "k", n: "Kaioken Goku", ver: "Kaioken", season: 1, style: "Striker", rar: 5, aura: "#ff3a3a", fig: { kaioken: 1 },
        leader: cap("ATK", .3, "Z Fighters"), talent: T("Kaioken ×3", "START_BUFF", { what: ["KAIOKEN"], turns: 2 }),
        kit: [tq("Kaioken Kamehameha", "beam", 45, 3.0), tq("Kaioken Rush", "melee", 25, 2.2, { hits: 5 }), tq("Spirit Bomb", "bomb", 100, 5.6)] },
      { v: "n", n: "Goku", ver: "Namek", season: 2, style: "Striker", rar: 5, fig: { top: "#ff8a1a", under: "#2f5fd8", kanji: "悟" },
        leader: cap("ATK", .3, "Saiyan", "Race"), talent: T("100× Gravity Training", "STAT", { stats: { atk: .1, spd: .06 } }),
        kit: [tq("Kamehameha", "beam", 40, 2.8), tq("Kaioken ×20", "buff", 30, 0, { fx: [fxS("KAIOKEN", 2), fxS("ATK_UP", 2)] }), tq("Super Spirit Bomb", "bomb", 100, 6.0)] },
      { v: "ssj", n: "Super Saiyan Goku", ver: "Super Saiyan", season: 2, style: "Striker", rar: 5, aura: "#ffd34d", fig: { hs: "ssj", hair: "#ffd84a", eyec: "#2aa88a", top: "#ff8a1a", torn: 1, kanji: "悟" },
        leader: cap("ATK", .35), talent: T("Legendary Super Saiyan", "STAT", { stats: { atk: .12, def: .08, spd: .06 } }),
        kit: [tq("Super Kamehameha", "beam", 45, 3.4), tq("Super Saiyan Rush", "melee", 30, 2.6, { hits: 6, heavy: 1 })] },
    ] },
  { n: "Gohan", k: "gohan", squad: "Z Fighters", race: "Saiyan", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ hair: "#141418", hs: "gohan", kid: 1, top: "#5a3ea8", under: "#5a3ea8", sleeves: "long", pants: "#5a3ea8", belt: "#d8302a", boots: "#7a4a2a", wrist: null, tail: "#7a4a2a" }),
    vers: [
      { v: "s", n: "Gohan", ver: "Saiyan Saga", season: 1, style: "Blaster", rar: 3,
        talent: T("Hidden Potential", "RAGE", { turns: 2 }),
        kit: [tq("Masenko", "beam", 35, 2.4)] },
      { v: "n", n: "Gohan", ver: "Namek", season: 2, style: "Blaster", rar: 4, fig: { ...ARMOR, suit: "#2a3a8a", tail: null, top: null },
        leader: cap("HP", .2, "Z Fighters"), talent: T("Hidden Potential", "RAGE", { turns: 3 }),
        kit: [tq("Masenko", "beam", 35, 2.6), tq("Angry Barrage", "ki", 45, 2.6, { hits: 6, heavy: 1 })] },
    ] },
  { n: "Krillin", k: "krillin", squad: "Z Fighters", race: "Earthling", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ hs: "bald", dots: 1, kid: .55, h: .86, ...TURTLE }),
    vers: [
      { v: "s", n: "Krillin", ver: "Saiyan Saga", season: 1, style: "Tactician", rar: 3,
        talent: T("Quick Thinking", "KI_REGEN", { amount: .3 }),
        kit: [tq("Destructo Disc", "disc", 40, 2.6), tq("Scatter Shot", "ki", 30, 1.8, { hits: 5 })] },
      { v: "n", n: "Krillin", ver: "Namek", season: 2, style: "Tactician", rar: 4, fig: { ...ARMOR, suit: "#2a3a8a", kanji: null, top: null },
        leader: cap("SPD", .12), talent: T("Afterimage Technique", "AFTERIMAGE", { chance: .2 }),
        kit: [tq("Double Destructo Disc", "disc", 50, 3.0, { hits: 2 }), tq("Solar Flare", "flash", 25, 0, { fx: [fxT("BLIND", 1)] })] },
    ] },
  { n: "Piccolo", k: "piccolo", squad: "Z Fighters", race: "Namekian", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ skin: "#5ab84a", antennae: 1, ears: "point", hs: "none", turban: "#f2f2f6", turban2: "#5a3ea8", cape: "#f2f2f6", capeIn: "#d8dce6", capePads: 1,
      top: "#5a3ea8", under: "#5ab84a", sleeves: "none", pants: "#5a3ea8", belt: "#5fd4ff", boots: "#8a4a2a", wrist: "#d8302a", h: 1.12, eyec: "#141418", pink: "#e87a8a" }),
    vers: [
      { v: "s", n: "Piccolo", ver: "Saiyan Saga", season: 1, style: "Blaster", rar: 4,
        leader: cap("DEF", .25, "Namekian", "Race"), talent: T("Namekian Regeneration", "REGEN", { amount: .05 }),
        kit: [tq("Special Beam Cannon", "finger", 50, 3.2, { pierce: 1, wind: 1.5 }), tq("Explosive Demon Wave", "beam", 40, 2.4)] },
      { v: "n", n: "Piccolo", ver: "Fused with Nail", season: 2, style: "Defender", rar: 5, fig: { turban: null, cape: null, capePads: 0 },
        leader: cap("HP", .3), talent: T("Fused with Nail", "REGEN", { amount: .08 }),
        kit: [tq("Special Beam Cannon", "finger", 50, 3.6, { pierce: 1, wind: 1.4 }), tq("Light Grenade", "beam", 45, 3.0)] },
    ] },
  { n: "Tien", k: "tien", squad: "Z Fighters", race: "Earthling", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ hs: "bald", thirdEye: 1, top: "#2a6a3a", under: "#2a6a3a", sleeves: "none", pants: "#f2f2f6", belt: "#d8302a", boots: "#141418", wrist: null, h: 1.1, bulk: 1.1 }),
    vers: [
      { v: "s", n: "Tien", ver: "Saiyan Saga", season: 1, style: "Defender", rar: 4,
        leader: cap("DEF", .2, "Z Fighters"), talent: T("Third Eye", "GUARD_EYE", { amount: .5 }),
        kit: [tq("Tri-Beam", "beam", 50, 3.2, { pierce: 1 }), tq("Solar Flare", "flash", 25, 0, { fx: [fxT("BLIND", 1)] })] },
    ] },
  { n: "Yamcha", k: "yamcha", squad: "Z Fighters", race: "Earthling", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ hair: "#141418", hs: "yamcha", scar: 1, ...TURTLE }),
    vers: [
      { v: "s", n: "Yamcha", ver: "Saiyan Saga", season: 1, style: "Striker", rar: 3,
        talent: T("Desert Bandit", "STAT", { stats: { spd: .06, cr: .1 } }),
        kit: [tq("Wolf Fang Fist", "melee", 25, 2.2, { hits: 6 }), tq("Spirit Ball", "ki", 35, 2.4, { homing: 1 })] },
    ] },
  { n: "Chiaotzu", k: "chiaotzu", squad: "Z Fighters", race: "Earthling", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ skin: "#f6f2ee", hs: "bald", cheek: "#ff6a7a", kid: 1, h: .74, top: "#2a8a8a", under: "#ffd34d", sleeves: "long", pants: "#ffd34d", belt: "#2a8a8a", boots: "#141418", wrist: null, hat: "#ff8a1a" }),
    vers: [
      { v: "s", n: "Chiaotzu", ver: "Saiyan Saga", season: 1, style: "Tactician", rar: 3,
        talent: T("Telepath", "KI_START", { amount: 20 }),
        kit: [tq("Telekinesis", "freeze", 30, 0, { fx: [fxT("FREEZE", 1)] }), tq("Dodon Ray", "finger", 30, 2.0)] },
    ] },
  { n: "Yajirobe", k: "yajirobe", squad: "Z Fighters", race: "Earthling", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ hair: "#141418", hs: "yajirobe", top: "#f2e6c8", under: "#f2e6c8", sleeves: "short", pants: "#8a7a5a", belt: "#2a2a30", boots: "#5a3a2a", wrist: null, bulk: 1.35, h: .9, sword: "#d8dce6" }),
    vers: [
      { v: "s", n: "Yajirobe", ver: "Saiyan Saga", season: 1, style: "Defender", rar: 3,
        talent: T("Senzu Stash", "TEAM_HEAL_ONCE", { amount: .3 }),
        kit: [tq("Katana Slash", "melee", 20, 2.0, { hits: 2, pierce: 1 }), tq("Senzu Bean", "heal", 60, 0, { heal: .35, once: 1 })] },
    ] },
  { n: "Bardock", k: "bardock", squad: "Saiyans", race: "Saiyan", aura: "#f2f2ff", ki: "#7ad0ff",
    fig: F({ hair: "#141418", hs: "bardock", scar: 1, ...ARMOR, suit: "#141418", pad: "#2a7a3a", armor: "#3a8a4a", headband: "#d8302a", scouter: "#43d67e", tail: "#5a3a2a" }),
    vers: [
      { v: "s", n: "Bardock", ver: "Legend", season: 0, style: "Striker", rar: 5,
        leader: cap("ATK", .3, "Saiyan", "Race"), talent: T("Father of Goku", "PRIDE", { amount: .3, below: .5 }),
        kit: [tq("Riot Javelin", "beam", 40, 3.0), tq("Spirit of the Saiyans", "bomb", 90, 5.2)] },
    ] },
  // ===================== SAIYANS =====================
  { n: "Raditz", k: "raditz", squad: "Saiyans", race: "Saiyan", aura: "#f2f2ff", ki: "#b07bff",
    fig: F({ hair: "#141418", hs: "raditz", ...ARMOR, armor: "#2a2a30", pad: "#5a3a2a", suit: "#2a2a3a", boots: "#f2f2f6", bootTrim: "#5a3a2a", tail: "#3a2a1a", scouter: "#ff5a6a", headband: "#c8302a", wrist: "#d8302a", h: 1.12 }),
    vers: [
      { v: "s", n: "Raditz", ver: "Saiyan Saga", season: 1, style: "Striker", rar: 4,
        leader: cap("ATK", .2, "Saiyans"), talent: T("Saiyan Zenkai", "ZENKAI", { amount: .15 }),
        kit: [tq("Double Sunday", "beam", 40, 2.6), tq("Saturday Crush", "ki", 30, 2.2, { heavy: 1 })] },
    ] },
  { n: "Nappa", k: "nappa", squad: "Saiyans", race: "Saiyan", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ hs: "bald", mustache: "#141418", ...ARMOR, armor: "#f2ecd8", pad: "#5a3a2a", suit: "#1a2a5a", tail: "#3a2a1a", scouter: "#43d67e", h: 1.2, bulk: 1.45, sleeves: "none" }),
    vers: [
      { v: "s", n: "Nappa", ver: "Saiyan Saga", season: 1, style: "Defender", rar: 4,
        leader: cap("HP", .25, "Saiyans"), talent: T("Elite Brute", "DMG_REDUCE", { amount: .12 }),
        kit: [tq("Break Cannon", "beam", 40, 2.8), tq("Bomber DX", "bomb", 70, 3.8, { wind: 1.4 })] },
    ] },
  { n: "Vegeta", k: "vegeta", squad: "Saiyans", race: "Saiyan", aura: "#f2f2ff", ki: "#b07bff",
    fig: F({ hair: "#141418", hs: "vegeta", ...ARMOR, scouter: "#43d67e", tail: "#3a2a1a", h: .96, brow: "angry" }),
    vers: [
      { v: "s", n: "Vegeta", ver: "Saiyan Saga", season: 1, style: "Blaster", rar: 5,
        leader: cap("ATK", .3, "Saiyans"), talent: T("Saiyan Pride", "PRIDE", { amount: .3, below: .5 }),
        kit: [tq("Galick Gun", "beam", 45, 3.2), tq("Energy Barrage", "ki", 40, 2.6, { hits: 8 })] },
      { v: "o", n: "Great Ape Vegeta", ver: "Great Ape", season: 1, style: "Striker", rar: 5, aura: "#ff9a3c", ki: "#ff9a3c", fig: { body: "ape", fur: "#7a4a2a", h: 2.4, ...ARMOR, scouter: null },
        leader: cap("HP", .3, "Saiyan", "Race"), talent: T("Full Moon Power", "STAT", { stats: { hp: .2, atk: .15, spd: -.12 } }),
        kit: [tq("Mouth Blast", "beam", 40, 3.2, { heavy: 1 }), tq("Great Ape Stomp", "melee", 25, 2.8, { hits: 2, heavy: 1 })] },
      { v: "n", n: "Vegeta", ver: "Namek", season: 2, style: "Blaster", rar: 5, fig: { armor: "#f2ecd8", pad: "#f2ecd8", padStyle: "frieza", suit: "#1a2a6a", scouter: null, tail: null },
        leader: cap("ATK", .3, "Saiyan", "Race"), talent: T("Zenkai Boost", "ZENKAI", { amount: .3 }),
        kit: [tq("Galick Gun", "beam", 45, 3.4), tq("Energy Barrage", "ki", 40, 2.8, { hits: 8 }), tq("Big Bang", "bomb", 80, 4.6)] },
    ] },
  { n: "Saibaman", k: "saibaman", squad: "Saiyans", race: "Saibaman", aura: "#a8ff8a", ki: "#a8ff8a",
    fig: F({ body: "saiba", skin: "#4aa83a", h: .82, eyec: "#ff3a3a" }),
    vers: [
      { v: "s", n: "Saibaman", ver: "Saiyan Saga", season: 1, style: "Striker", rar: 3,
        talent: T("Grown in a Day", "STAT", { stats: { spd: .08 } }),
        kit: [tq("Acid", "ki", 25, 1.8, { fx: [fxT("DEF_DOWN", 2, .6)] }), tq("Self-Destruct", "melee", 0, 4.2, { selfHit: .9, heavy: 1 })] },
    ] },
  // ===================== NAMEKIANS =====================
  { n: "Nail", k: "nail", squad: "Namekians", race: "Namekian", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ skin: "#5ab84a", antennae: 1, ears: "point", hs: "none", top: "#f2f2f6", under: "#5ab84a", sleeves: "none", pants: "#f2f2f6", belt: "#5fd4ff", boots: "#8a4a2a", wrist: null, h: 1.12, pink: "#e87a8a", sash: "#2a6ad8" }),
    vers: [
      { v: "s", n: "Nail", ver: "Frieza Saga", season: 2, style: "Defender", rar: 4,
        leader: cap("DEF", .25, "Namekian", "Race"), talent: T("Guru's Guardian", "REGEN", { amount: .06 }),
        kit: [tq("Namekian Strike", "melee", 20, 2.2, { hits: 3 }), tq("Full-Power Energy Wave", "beam", 45, 2.8)] },
    ] },
  { n: "Dende", k: "dende", squad: "Namekians", race: "Namekian", aura: "#f2f2ff", ki: "#ffd34d",
    fig: F({ skin: "#5ab84a", antennae: 1, ears: "point", hs: "none", kid: 1, h: .72, top: "#f2f2f6", under: "#5ab84a", sleeves: "none", pants: "#f2f2f6", belt: "#5fd4ff", boots: "#8a4a2a", wrist: null, pink: "#e87a8a", sash: "#2a6ad8" }),
    vers: [
      { v: "s", n: "Dende", ver: "Frieza Saga", season: 2, style: "Tactician", rar: 3,
        talent: T("Healing Hands", "BENCH_HEAL", { amount: .06 }),
        kit: [tq("Healing", "heal", 45, 0, { heal: .25 })] },
    ] },
  // ===================== FRIEZA FORCE =====================
  { n: "Cui", k: "cui", squad: "Frieza Force", race: "Alien", aura: "#d8a8ff", ki: "#ff7ad8",
    fig: F({ skin: "#8a5ad8", hs: "none", fins: "#6a3ab8", ...FORCE, pad: "#f2ecd8", eyec: "#141418" }),
    vers: [
      { v: "s", n: "Cui", ver: "Frieza Saga", season: 2, style: "Blaster", rar: 3,
        talent: T("Vegeta's Rival", "BONUS_VS", { race: "Saiyan", amount: .25 }),
        kit: [tq("Energy Wave", "beam", 35, 2.4), tq("Sharpshooter Volley", "ki", 30, 2.0, { hits: 4 })] },
    ] },
  { n: "Dodoria", k: "dodoria", squad: "Frieza Force", race: "Alien", aura: "#ff9ad8", ki: "#ff5a8a",
    fig: F({ body: "human", skin: "#ff8ac8", hs: "none", spikes: "#d85a9a", ...FORCE, pad: "#f2ecd8", bulk: 1.7, h: 1.08, scouter: "#ff5a6a" }),
    vers: [
      { v: "s", n: "Dodoria", ver: "Frieza Saga", season: 2, style: "Defender", rar: 4,
        leader: cap("HP", .2, "Frieza Force"), talent: T("Frieza's Bodyguard", "DMG_REDUCE", { amount: .14 }),
        kit: [tq("Dodoria Rush", "melee", 20, 2.4, { hits: 3, heavy: 1 }), tq("Maximum Mouth Cannon", "beam", 40, 2.8)] },
    ] },
  { n: "Zarbon", k: "zarbon", squad: "Frieza Force", race: "Alien", aura: "#9affe0", ki: "#8affd8",
    fig: F({ skin: "#7ac8b8", hair: "#2a8a5a", hs: "zarbon", ...FORCE, pad: "#f2ecd8", cape: "#3a4ab8", capeIn: "#2a3a8a", scouter: "#43d67e", earring: "#ffd34d", h: 1.1, slim: 1 }),
    vers: [
      { v: "s", n: "Zarbon", ver: "Frieza Saga", season: 2, style: "Blaster", rar: 4,
        leader: cap("ATK", .2, "Frieza Force"), talent: T("Hidden Form", "PRIDE", { amount: .35, below: .4 }),
        kit: [tq("Elegant Blaster", "beam", 40, 2.8), tq("Graceful Strikes", "melee", 20, 2.0, { hits: 4 })] },
      { v: "m", n: "Monster Zarbon", ver: "Transformed", season: 2, style: "Striker", rar: 4, fig: { monster: 1, skin: "#4a9a7a", bulk: 1.5, h: 1.18 },
        talent: T("Monstrous Strength", "STAT", { stats: { atk: .12, hp: .1 } }),
        kit: [tq("Monster Crush", "melee", 30, 3.0, { hits: 2, heavy: 1 }), tq("Mouth Energy Wave", "beam", 40, 2.8)] },
    ] },
  { n: "Appule", k: "appule", squad: "Frieza Force", race: "Alien", aura: "#d8a8ff", ki: "#ff7ad8",
    fig: F({ skin: "#b07ad8", hs: "none", spots: "#7a4ab8", eggHead: 1, ...FORCE, eyec: "#ff3a3a" }),
    vers: [
      { v: "s", n: "Appule", ver: "Frieza Saga", season: 2, style: "Striker", rar: 3,
        talent: T("Frieza Force Soldier", "STAT", { stats: { atk: .06, spd: .04 } }),
        kit: [tq("Soldier's Rush", "melee", 18, 1.9, { hits: 3 }), tq("Arm Cannon", "ki", 25, 1.9, { hits: 2 })] },
    ] },
  // ===================== GINYU FORCE =====================
  { n: "Guldo", k: "guldo", squad: "Ginyu Force", race: "Alien", aura: "#a8ffa8", ki: "#a8ffa8",
    fig: F({ skin: "#6ac85a", hs: "none", fourEyes: 1, ...GINYU, h: .78, bulk: 1.3, kid: .4 }),
    vers: [
      { v: "s", n: "Guldo", ver: "Ginyu Force", season: 2, style: "Tactician", rar: 3,
        talent: T("Hold Your Breath", "KI_START", { amount: 25 }),
        kit: [tq("Time Freeze", "freeze", 35, 0, { fx: [fxT("FREEZE", 1)] }), tq("Psycho Spear", "ki", 30, 2.2, { pierce: 1 })] },
    ] },
  { n: "Recoome", k: "recoome", squad: "Ginyu Force", race: "Alien", aura: "#ffb8a8", ki: "#ff6a3a",
    fig: F({ skin: "#f6d8c8", hair: "#ff7a1a", hs: "recoome", ...GINYU, padStyle: "none", h: 1.3, bulk: 1.6, sleeves: "none" }),
    vers: [
      { v: "s", n: "Recoome", ver: "Ginyu Force", season: 2, style: "Defender", rar: 4,
        leader: cap("HP", .25, "Ginyu Force"), talent: T("Recoome Toughness", "DMG_REDUCE", { amount: .15 }),
        kit: [tq("Recoome Kick", "melee", 20, 2.4, { hits: 1, heavy: 1, kick: 1 }), tq("Recoome Eraser Gun", "beam", 45, 3.2)] },
    ] },
  { n: "Burter", k: "burter", squad: "Ginyu Force", race: "Alien", aura: "#a8d8ff", ki: "#5fd4ff",
    fig: F({ skin: "#4a7ad8", hs: "none", bigEyes: 1, ...GINYU, h: 1.32, slim: 1, eyec: "#ff3a3a" }),
    vers: [
      { v: "s", n: "Burter", ver: "Ginyu Force", season: 2, style: "Striker", rar: 4,
        leader: cap("SPD", .15, "Ginyu Force"), talent: T("Fastest in the Universe", "STAT", { stats: { spd: .14 } }),
        kit: [tq("Space Mach Attack", "melee", 25, 2.4, { hits: 5 }), tq("Blue Hurricane", "melee", 35, 2.8, { hits: 4, heavy: 1 })] },
    ] },
  { n: "Jeice", k: "jeice", squad: "Ginyu Force", race: "Alien", aura: "#ffb8a8", ki: "#ff5a3a",
    fig: F({ skin: "#d8503a", hair: "#f2f2f6", hs: "jeice", ...GINYU, h: 1.0 }),
    vers: [
      { v: "s", n: "Jeice", ver: "Ginyu Force", season: 2, style: "Blaster", rar: 4,
        talent: T("Purple Comet", "BONUS_VS", { race: "Saiyan", amount: .15 }),
        kit: [tq("Crusher Ball", "ki", 40, 3.0, { heavy: 1 }), tq("Jeice Rush", "melee", 20, 2.0, { hits: 4 })] },
    ] },
  { n: "Captain Ginyu", short: "Ginyu", k: "ginyu", squad: "Ginyu Force", race: "Alien", aura: "#d8a8ff", ki: "#b07bff",
    fig: F({ skin: "#8a5ad8", hs: "none", horns: "ginyu", ...GINYU, padStyle: "none", h: 1.12, bulk: 1.15, eyec: "#141418" }),
    vers: [
      { v: "s", n: "Captain Ginyu", ver: "Ginyu Force", season: 2, style: "Tactician", rar: 5,
        leader: cap("ATK", .3, "Ginyu Force"), talent: T("Ginyu Force Pose", "TEAM_START_BUFF", { what: ["ATK_UP"], turns: 1 }),
        kit: [tq("Milky Cannon", "beam", 40, 3.0), tq("Body Change", "swap", 70, 0, { once: 1 })] },
    ] },
  // ===================== FRIEZA =====================
  { n: "Frieza", k: "frieza", squad: "Frieza Force", race: "Frieza Race", aura: "#d8a8ff", ki: "#ff5ad8",
    fig: F({ body: "frieza1", skin: "#f2ecf2", dome: "#7a3ab8", eyec: "#c8202a", tail: "#f2ecf2", h: .82, armor: "#f2ecd8", pad: "#7a5a3a", padStyle: "frieza", suit: "#2a2a3a" }),
    vers: [
      { v: "1", n: "Frieza", ver: "First Form", season: 2, style: "Tactician", rar: 5,
        leader: cap("ATK", .3, "Frieza Force"), talent: T("Emperor of the Universe", "EXECUTE", { amount: .3, below: .3 }),
        kit: [tq("Death Beam", "finger", 35, 2.6, { pierce: 1 }), tq("Psychokinesis", "freeze", 35, 1.2, { fx: [fxT("FREEZE", 1)] })] },
      { v: "2", n: "Frieza", ver: "Second Form", season: 2, style: "Striker", rar: 5, fig: { body: "frieza2", h: 1.3, bulk: 1.2 },
        leader: cap("HP", .3, "Frieza Force"), talent: T("Transformed", "STAT", { stats: { hp: .1, atk: .1 } }),
        kit: [tq("Horn Charge", "melee", 25, 2.8, { hits: 2, heavy: 1 }), tq("Death Beam", "finger", 35, 2.8, { pierce: 1 })] },
      { v: "3", n: "Frieza", ver: "Third Form", season: 2, style: "Blaster", rar: 5, fig: { body: "frieza3", h: 1.2 },
        leader: cap("ATK", .3, "Frieza Force"), talent: T("Grotesque Power", "EXECUTE", { amount: .4, below: .3 }),
        kit: [tq("Death Beam Barrage", "finger", 45, 3.2, { hits: 5, pierce: 1 }), tq("Mouth Energy Wave", "beam", 40, 3.0)] },
      { v: "4", n: "Frieza", ver: "Final Form", season: 2, style: "Blaster", rar: 5, fig: { body: "frieza4", h: .9 },
        leader: cap("ATK", .35), talent: T("Perfect Form", "STAT", { stats: { atk: .1, spd: .08 } }),
        kit: [tq("Death Saucer", "disc", 40, 3.0, { hits: 2 }), tq("Death Beam", "finger", 35, 3.0, { pierce: 1 }), tq("Death Ball", "bomb", 100, 6.0)] },
      { v: "5", n: "Full Power Frieza", ver: "100% Full Power", season: 2, style: "Striker", rar: 5, aura: "#ff9ad8", fig: { body: "frieza4", h: 1.0, bulk: 1.3, veins: 1 },
        leader: cap("ATK", .35, "Frieza Force"), talent: T("100% Full Power", "PRIDE", { amount: .3, below: .6 }),
        kit: [tq("Nova Strike", "melee", 30, 3.0, { hits: 4, heavy: 1 }), tq("Death Ball", "bomb", 100, 6.4)] },
    ] },
];

// ---------- Leader Skills (the first fighter in the party) ----------
function cap(stat, amount, team, scope) { return { stat, amount, scope: team ? (scope || "Team") : "All", team: team || null }; }

// ---------- generated technique text ----------
const P = v => Math.round(v * 100) + "%";
const KIND_N = { melee: "Melee", ki: "Ki blast", beam: "Beam", finger: "Finger beam", disc: "Disc", bomb: "Ultimate", flash: "Flash", freeze: "Hold", buff: "Power-up", heal: "Healing", swap: "Special" };
function skillDesc(sk) {
  const out = [], multi = (sk.hits || 1) > 1;
  if (sk.mult > 0) {
    const dmg = multi ? `${sk.hits} hits, ${P(sk.mult)} ATK in all` : `${P(sk.mult)} ATK`;
    out.push({ melee: `Dashes in for a combo: ${dmg}`, ki: `Fires ${multi ? sk.hits + " blasts" : "a blast"}: ${dmg}`, beam: `Fires a beam: ${dmg}`, finger: `Fires a piercing ray from the fingertip: ${dmg}`,
      disc: `Throws ${multi ? "spinning discs" : "a spinning disc"} of ki: ${dmg}`, bomb: `Gathers a giant ball of energy and hurls it: ${dmg}`, freeze: `Strikes for ${dmg}` }[sk.kind] || dmg);
  }
  if (sk.kind === "beam") out.push("Two beams fired at once clash in a beam struggle");
  if (sk.kind === "disc") out.push("Can't be guarded, only dodged with Vanish");
  if (sk.kind === "bomb") out.push("Very long wind-up, slow to arrive, and a guard only stops half of it");
  if (sk.pierce) out.push("Pierces a normal guard (only a perfect guard stops it)");
  if (sk.homing) out.push("Steers after a vanishing target");
  if (sk.heavy) out.push("Heavy: interrupts the opponent's attack");
  if (sk.kind === "flash") out.push("A blinding flash: can't be guarded or vanished");
  for (const e of sk.fx || []) {
    const nm = FX[e.what].n, t = `${e.turns} turn${e.turns > 1 ? "s" : ""}`;
    if (e.on === "self") out.push(`Gains ${nm} (${t}): ${FX[e.what].d.charAt(0).toLowerCase() + FX[e.what].d.slice(1)}`);
    else if (e.on === "team") out.push(`The whole party gains ${nm} (${t})`);
    else out.push(`${e.chance < 1 ? P(e.chance) + " chance to inflict" : "Inflicts"} ${nm} (${e.what === "BLIND" || e.what === "FREEZE" ? "about 2.5 seconds" : t})`);
  }
  if (sk.heal) out.push(`Heals the whole party for ${P(sk.heal)} of max HP${sk.once ? ", once per battle" : ""}`);
  else if (sk.once) out.push("Once per battle");
  if (sk.kind === "swap") out.push("Swaps bodies with the opponent: trades HP percentages with it. Once per battle");
  if (sk.selfHit) out.push(`Costs the user ${P(sk.selfHit)} of its own HP`);
  out.push(sk.ki ? `Costs ${sk.ki} ki` : "Costs no ki");
  return out.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(". ") + ".";
}

// ---------- Abilities (passives) ----------
const STATN = { hp: "HP", atk: "ATK", def: "DEF", spd: "SPD", cr: "Crit Rate", cd: "Crit Damage" };
const fxList = l => l.map(x => FX[x].n).join(" and ");
const PASSIVE_TEXT = {
  ZENKAI: p => `once per battle, survives a finishing blow with ${P(p.amount)} HP and comes back stronger (Power Up, 2 turns)`,
  REGEN: p => `recovers ${P(p.amount)} of max HP at the start of each turn`,
  PRIDE: p => `deals ${P(p.amount)} more damage while below ${P(p.below)} HP`,
  KI_START: p => `enters battle with ${p.amount} extra ki`,
  KI_REGEN: p => `recovers ki ${P(p.amount)} faster`,
  DMG_REDUCE: p => `takes ${P(p.amount)} less damage`,
  AFTERIMAGE: p => `${P(p.chance)} chance to leave an afterimage and dodge a melee attack`,
  STAT: p => Object.entries(p.stats).map(([k, v]) => `${v > 0 ? "+" : ""}${P(v)} ${STATN[k]}`).join(", "),
  BENCH_HEAL: p => `while waiting to switch in, heals the fighting ally for ${P(p.amount)} of max HP each turn`,
  RAGE: p => `when an ally is knocked out, gains ${FX.RAGE.n} (+50% damage) for ${p.turns} turns`,
  START_BUFF: p => `enters battle with ${fxList(p.what)} (${p.turns} turns)`,
  TEAM_START_BUFF: p => `at the start of battle the whole party gains ${fxList(p.what)} (${p.turns} turn${p.turns > 1 ? "s" : ""})`,
  GUARD_EYE: p => `its perfect-guard window is ${P(p.amount)} wider`,
  BONUS_VS: p => `deals ${P(p.amount)} more damage to ${p.race}s`,
  EXECUTE: p => `deals ${P(p.amount)} more damage to an opponent below ${P(p.below)} HP`,
  TEAM_HEAL_ONCE: p => `the first time the fighting ally drops below 30% HP, tosses it a Senzu Bean: heals ${P(p.amount)} of its max HP (once per battle, even from the bench)`,
};
const passiveDesc = p => { const t = PASSIVE_TEXT[p.id](p); return t.charAt(0).toUpperCase() + t.slice(1); };

// factions, in the order they appear in the show (the Fighters screen's filter)
const TEAMS = [...new Set(CHARS.map(c => c.squad))];
