
// =====================================================================
//  POKÉMON, MOVES, ABILITIES AND HELD ITEMS
//  Every Pokémon has three moves: S1 is free to use every turn, S2 and S3 have cooldowns (S3 starts on cooldown).
//  Skills keep the move's real type, category, power, accuracy and added effects (MOVES in a3a_dex.js).
// =====================================================================
const CAT_N = { P: "Physical", S: "Special", X: "Status" };
const CD = { 1: 0, 2: 3, 3: 4 };
const SPREAD = .75; // moves that hit every opposing Pokémon deal 75% damage, as in Double Battles
function moveTarget(M) {
  if (M.tg === "foes") return "aoe_enemies";
  if (M.tg === "self") return "self";
  if (M.tg === "team") return "team";
  if (M.tg === "ally") return "ally_single";
  if (M.tg === "field") return M.sp === "haze" ? "field" : "team";
  return "enemy";
}
// how a move looks in battle: contact moves run in, the rest fly across (or burst over every target)
function moveAnim(M, target) {
  if (M.c === "X") return target === "enemy" || target === "aoe_enemies" ? "status" : /recover|softboiled|rest/.test(M.sp || "") || M.hl ? "heal" : "buff";
  if (M.sp === "selfdestruct" || M.sp === "explosion") return "boom";
  if (target === "aoe_enemies") return M.ct ? "spin" : ["Rock", "Grass", "Normal", "Bug"].includes(M.t) ? "volley" : "nova";
  return M.ct ? "melee" : "shoot";
}
function makeSkill(key, slot) {
  const M = MOVES[key], target = moveTarget(M);
  const sk = { slot, key, name: M.n, type: M.t, cat: M.c, pow: M.p, acc: M.a, cd: CD[slot], cd0: slot === 3 ? 2 : 0, target, M, anim: moveAnim(M, target) };
  if (M.c === "X" && slot === 1) sk.cd = 0;
  if (key === "lowkick") { sk.pow = 60; sk.weight = 1; } // power depends on the target's weight
  if (M.hit) sk.hits = M.hit;
  sk.desc = moveDesc(sk);
  return sk;
}
// ---------- generated move text ----------
const P = v => Math.round(v * 100) + "%";
const statList = st => st.map(([s, n]) => `${STAGE_N[s]} ${n > 0 ? "+" : ""}${n}`).join(", ");
function moveDesc(sk) {
  const M = sk.M, out = [], who = sk.target === "aoe_enemies" ? "each target" : "the target";
  const fixed = { dragonrage: "Deals 40 damage", sonicboom: "Deals 20 damage", nightshade: "Deals damage equal to the user's level", seismictoss: "Deals damage equal to the user's level",
    psywave: "Deals random damage between half and 1.5× the user's level", superfang: "Takes half the target's current HP" }[M.sp];
  if (fixed) out.push(fixed + " (+6% per Mastery rank)");
  if (sk.weight) out.push("Heavier targets take more damage (20 to 120 power)");
  if (M.n === "High Jump Kick" || M.n === "Jump Kick") out.push("If it misses, the user crashes and loses half its max HP");
  if (sk.target === "aoe_enemies" && M.p) out.push(`Hits every opposing Pokémon (${P(SPREAD)} damage each)`);
  if (M.hit) out.push(M.hit[0] === M.hit[1] ? `Strikes ${M.hit[0]} times` : `Strikes ${M.hit[0]} to ${M.hit[1]} times`);
  if (M.pri > 0) out.push("Priority move: the user gets 30% turn meter back afterwards");
  if (M.cr) out.push("High critical-hit ratio");
  if (M.ail && M.c !== "X") out.push(`${M.ac}% chance to ${{ PAR: "paralyze", BRN: "burn", FRZ: "freeze", PSN: "poison", TOX: "badly poison", SLP: "put to sleep", CNF: "confuse", TRAP: "bind", INFAT: "infatuate" }[M.ail]} ${who}`);
  if (M.ail && M.c === "X") out.push({ PAR: "Paralyzes", BRN: "Burns", FRZ: "Freezes", PSN: "Poisons", TOX: "Badly poisons", SLP: "Puts to sleep", CNF: "Confuses", INFAT: "Infatuates", DISABLE: "Disables (no S2 or S3 for 2 turns)", SEED: "Plants a Leech Seed on", TRAP: "Binds" }[M.ail] + (sk.target === "aoe_enemies" ? " every opposing Pokémon" : " the target") + (M.ac < 100 && M.ac ? ` (${M.ac}%)` : ""));
  if (M.fl) out.push(`${M.fl}% chance to make ${who} flinch (lose 40% turn meter)`);
  if (M.st) {
    const t = M.sw === "self" ? (sk.target === "team" ? "your team's" : "the user's") : M.sw === "foes" ? "every opposing Pokémon's" : "the target's";
    out.push(`${M.sc < 100 ? M.sc + "% chance: " : ""}${t} ${statList(M.st)}`);
  }
  if (M.dr > 0) out.push(`The user recovers ${M.dr}% of the damage dealt`);
  if (M.dr < 0) out.push(`The user takes ${-M.dr}% of the damage dealt as recoil`);
  if (M.hl) out.push(`Restores ${M.hl}% of the user's max HP`);
  const sp = { transform: "Transforms into the target: copies its types, stats, stat changes and moves", metronome: "Uses a random damaging move",
    splash: "But nothing happens!", haze: "Resets the stat changes of every Pokémon in battle", rest: "Fully restores HP and cures status, then sleeps for 2 turns",
    reflect: "Reflect: your team takes a third less physical damage for 5 turns", lightscreen: "Light Screen: your team takes a third less special damage for 5 turns",
    substitute: "Uses 1/4 of the user's max HP to make a Substitute that takes hits for it", mist: "Mist: your team's stats can't be lowered for 5 turns",
    focusenergy: "Focus Energy: the user's critical-hit ratio rises sharply", dreameater: "Only works on a sleeping target; the user recovers half the damage dealt",
    payday: "Coins scatter: extra Poké Dollars after a win", hyperbeam: "The user must recharge and loses its next turn",
    explosion: "The user faints", selfdestruct: "The user faints", roar: "Scares the target off: its turn meter and stat changes reset",
    whirlwind: "Blows the target away: its turn meter and stat changes reset", fissure: "One-hit KO if it lands (30%). Fails against bosses",
    horndrill: "One-hit KO if it lands (30%). Fails against bosses", guillotine: "One-hit KO if it lands (30%). Fails against bosses", toxic: "",
    recover: "", softboiled: "", leechseed: "", disable: "" }[M.sp];
  if (sp) out.push(sp);
  if (!out.length && M.c !== "X") out.push("A plain attack");
  return out.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(". ") + ".";
}

// ---------- Abilities ----------
const ABILITY = {
  overgrow: ["Overgrow", "Grass-type moves are 50% stronger while its HP is below 1/3.", { id: "PINCH", type: "Grass" }],
  blaze: ["Blaze", "Fire-type moves are 50% stronger while its HP is below 1/3.", { id: "PINCH", type: "Fire" }],
  torrent: ["Torrent", "Water-type moves are 50% stronger while its HP is below 1/3.", { id: "PINCH", type: "Water" }],
  swarm: ["Swarm", "Bug-type moves are 50% stronger while its HP is below 1/3.", { id: "PINCH", type: "Bug" }],
  static: ["Static", "Pokémon that make contact with it may be paralyzed (30%).", { id: "CONTACT", what: "PAR", chance: .3 }],
  "poison-point": ["Poison Point", "Pokémon that make contact with it may be poisoned (30%).", { id: "CONTACT", what: "PSN", chance: .3 }],
  "flame-body": ["Flame Body", "Pokémon that make contact with it may be burned (30%).", { id: "CONTACT", what: "BRN", chance: .3 }],
  "effect-spore": ["Effect Spore", "Pokémon that make contact with it may be poisoned, paralyzed or put to sleep (30%).", { id: "CONTACT", what: "SPORE", chance: .3 }],
  "cute-charm": ["Cute Charm", "Pokémon that make contact with it may fall in love with it (30%).", { id: "CONTACT", what: "INFAT", chance: .3 }],
  "poison-touch": ["Poison Touch", "Its contact moves may poison the target (30%).", { id: "TOUCH" }],
  stench: ["Stench", "Its damaging moves may make the target flinch (10%).", { id: "STENCH" }],
  intimidate: ["Intimidate", "Lowers the Attack of every opposing Pokémon by 1 when the battle starts.", { id: "INTIMIDATE" }],
  levitate: ["Levitate", "It floats, so Ground-type moves can't hit it.", { id: "IMMUNE_TYPE", type: "Ground" }],
  "water-absorb": ["Water Absorb", "Water-type moves heal it by 1/4 of its max HP instead of hurting it.", { id: "ABSORB", type: "Water" }],
  "volt-absorb": ["Volt Absorb", "Electric-type moves heal it by 1/4 of its max HP instead of hurting it.", { id: "ABSORB", type: "Electric" }],
  "dry-skin": ["Dry Skin", "Water-type moves heal it by 1/4 of its max HP instead of hurting it.", { id: "ABSORB", type: "Water" }],
  "flash-fire": ["Flash Fire", "Fire-type moves don't hurt it; they power up its own Fire-type moves by 50% instead.", { id: "FLASH_FIRE" }],
  "lightning-rod": ["Lightning Rod", "Electric-type moves don't hurt it; they raise its Sp. Atk by 1 instead.", { id: "ROD" }],
  "thick-fat": ["Thick Fat", "Takes half damage from Fire- and Ice-type moves.", { id: "RESIST", types: ["Fire", "Ice"] }],
  insomnia: ["Insomnia", "It can't fall asleep.", { id: "NO_STATUS", list: ["SLP"] }],
  "vital-spirit": ["Vital Spirit", "It can't fall asleep.", { id: "NO_STATUS", list: ["SLP"] }],
  limber: ["Limber", "It can't be paralyzed.", { id: "NO_STATUS", list: ["PAR"] }],
  immunity: ["Immunity", "It can't be poisoned.", { id: "NO_STATUS", list: ["PSN", "TOX"] }],
  "own-tempo": ["Own Tempo", "It can't be confused.", { id: "NO_STATUS", list: ["CNF"] }],
  oblivious: ["Oblivious", "It can't be infatuated or confused.", { id: "NO_STATUS", list: ["INFAT", "CNF"] }],
  "magma-armor": ["Magma Armor", "It can't be frozen.", { id: "NO_STATUS", list: ["FRZ"] }],
  "water-veil": ["Water Veil", "It can't be burned.", { id: "NO_STATUS", list: ["BRN"] }],
  "inner-focus": ["Inner Focus", "It never flinches, and Intimidate doesn't affect it.", { id: "INNER_FOCUS" }],
  "clear-body": ["Clear Body", "Other Pokémon can't lower its stats.", { id: "NO_DROP", stats: "all" }],
  "hyper-cutter": ["Hyper Cutter", "Other Pokémon can't lower its Attack.", { id: "NO_DROP", stats: "atk" }],
  "keen-eye": ["Keen Eye", "Other Pokémon can't lower its accuracy.", { id: "NO_DROP", stats: "acc" }],
  "big-pecks": ["Big Pecks", "Other Pokémon can't lower its Defense.", { id: "NO_DROP", stats: "def" }],
  sturdy: ["Sturdy", "At full HP it can't be knocked out by one hit: it holds on with 1 HP.", { id: "STURDY" }],
  "rock-head": ["Rock Head", "It takes no recoil damage.", { id: "ROCK_HEAD" }],
  "shed-skin": ["Shed Skin", "33% chance each turn to shed its status condition.", { id: "SHED", chance: .33 }],
  "natural-cure": ["Natural Cure", "30% chance each turn to shake off its status condition.", { id: "SHED", chance: .3 }],
  hydration: ["Hydration", "Cures its status condition every turn while it rains.", { id: "SHED", chance: 1, w: "rain" }],
  guts: ["Guts", "Attack is 50% higher while it has a status condition, and a burn doesn't weaken it.", { id: "GUTS" }],
  "compound-eyes": ["Compound Eyes", "Its moves are 30% more accurate.", { id: "ACC", amount: 1.3 }],
  "shield-dust": ["Shield Dust", "Immune to the added effects of damaging moves.", { id: "SHIELD_DUST" }],
  "battle-armor": ["Battle Armor", "Critical hits can't land on it.", { id: "NO_CRIT" }],
  "shell-armor": ["Shell Armor", "Critical hits can't land on it.", { id: "NO_CRIT" }],
  "swift-swim": ["Swift Swim", "Speed doubles in rain.", { id: "WSPEED", w: "rain" }],
  chlorophyll: ["Chlorophyll", "Speed doubles in harsh sunlight.", { id: "WSPEED", w: "sun" }],
  "sand-rush": ["Sand Rush", "Speed doubles in a sandstorm, and the sandstorm doesn't hurt it.", { id: "WSPEED", w: "sand" }],
  "sand-veil": ["Sand Veil", "Evasiveness +1 in a sandstorm, and the sandstorm doesn't hurt it.", { id: "WEVA", w: "sand" }],
  "snow-cloak": ["Snow Cloak", "Evasiveness +1 in hail, and the hail doesn't hurt it.", { id: "WEVA", w: "hail" }],
  "rain-dish": ["Rain Dish", "Heals 1/16 of its max HP every turn while it rains.", { id: "WHEAL", w: "rain" }],
  "ice-body": ["Ice Body", "Heals 1/16 of its max HP every turn while it hails.", { id: "WHEAL", w: "hail" }],
  "solar-power": ["Solar Power", "In harsh sunlight its Sp. Atk is 50% higher, but it loses 1/8 of its max HP every turn.", { id: "SOLAR" }],
  synchronize: ["Synchronize", "If it is burned, poisoned or paralyzed, the Pokémon that did it gets the same condition.", { id: "SYNC" }],
  download: ["Download", "When the battle starts, raises its Attack or Sp. Atk by 1, whichever the opponents guard against worse.", { id: "DOWNLOAD" }],
  pressure: ["Pressure", "Opposing Pokémon that use an S2 or S3 move wait 1 extra turn before they can use it again.", { id: "PRESSURE" }],
  damp: ["Damp", "No Pokémon in the battle can use Self-Destruct or Explosion.", { id: "DAMP" }],
  "liquid-ooze": ["Liquid Ooze", "Pokémon that drain its HP lose that HP instead.", { id: "OOZE" }],
  soundproof: ["Soundproof", "Sound-based moves don't affect it.", { id: "SOUNDPROOF" }],
  "early-bird": ["Early Bird", "Wakes up from sleep twice as fast.", { id: "EARLY_BIRD" }],
  pickup: ["Pickup", "Picks up extra Poké Dollars after each win.", { id: "PICKUP" }],
  technician: ["Technician", "Moves with 60 power or less are 50% stronger.", { id: "TECHNICIAN" }],
  "sheer-force": ["Sheer Force", "Moves with added effects deal 30% more damage, but the added effects don't happen.", { id: "SHEER_FORCE" }],
  hustle: ["Hustle", "Attack is 50% higher, but its physical moves are 20% less accurate.", { id: "HUSTLE" }],
  "iron-fist": ["Iron Fist", "Punching moves are 20% stronger.", { id: "IRON_FIST" }],
  reckless: ["Reckless", "Moves with recoil or crash damage are 20% stronger.", { id: "RECKLESS" }],
  "no-guard": ["No Guard", "Moves used by it or against it always hit.", { id: "NO_GUARD" }],
  "skill-link": ["Skill Link", "Multi-strike moves always hit the maximum number of times.", { id: "SKILL_LINK" }],
  "serene-grace": ["Serene Grace", "The added effects of its moves are twice as likely to happen.", { id: "SERENE" }],
  adaptability: ["Adaptability", "Same-type moves get a ×2 boost instead of ×1.5.", { id: "ADAPT" }],
  "magic-guard": ["Magic Guard", "Only attacks hurt it: no damage from poison, burns, recoil, binding or Leech Seed.", { id: "MAGIC_GUARD" }],
  multiscale: ["Multiscale", "Takes half damage while its HP is full.", { id: "MULTISCALE" }],
  "marvel-scale": ["Marvel Scale", "Defense is 50% higher while it has a status condition.", { id: "MARVEL" }],
  filter: ["Filter", "Super-effective hits deal 25% less damage to it.", { id: "FILTER" }],
  "tinted-lens": ["Tinted Lens", "Its not-very-effective hits deal double damage.", { id: "TINTED" }],
  sniper: ["Sniper", "Its critical hits deal ×2.25 damage instead of ×1.5.", { id: "SNIPER" }],
  "weak-armor": ["Weak Armor", "When a physical move hits it, its Defense falls by 1 and its Speed rises by 2.", { id: "WEAK_ARMOR" }],
  "anger-point": ["Anger Point", "A critical hit on it maxes out its Attack.", { id: "ANGER" }],
  defiant: ["Defiant", "When another Pokémon lowers its stats, its Attack rises by 2.", { id: "DEFIANT", stat: "atk" }],
  competitive: ["Competitive", "When another Pokémon lowers its stats, its Sp. Atk rises by 2.", { id: "DEFIANT", stat: "spa" }],
  steadfast: ["Steadfast", "Each time it flinches, its Speed rises by 1.", { id: "STEADFAST" }],
  moxie: ["Moxie", "Knocking out a Pokémon raises its Attack by 1.", { id: "MOXIE" }],
  scrappy: ["Scrappy", "Its Normal- and Fighting-type moves can hit Ghost-type Pokémon.", { id: "SCRAPPY" }],
  infiltrator: ["Infiltrator", "Its moves pass through Reflect, Light Screen and Substitute.", { id: "INFILTRATOR" }],
  "cursed-body": ["Cursed Body", "When hit by a move, 30% chance to Disable the attacker.", { id: "CURSED" }],
  "friend-guard": ["Friend Guard", "While it is standing, its allies take 25% less damage.", { id: "FRIEND_GUARD" }],
  imposter: ["Imposter", "Transforms into an opposing Pokémon as soon as the battle starts.", { id: "IMPOSTER" }],
  "arena-trap": ["Arena Trap", "Traps the opposing team: every opposing Pokémon starts the battle with no turn meter.", { id: "ARENA_TRAP" }],
  rattled: ["Rattled", "Its Speed rises by 1 when a Bug- or Ghost-type move hits it.", { id: "RATTLED" }],
  unnerve: ["Unnerve", "Opposing Pokémon are too nervous to eat Berries.", { id: "UNNERVE" }],
  "run-away": ["Run Away", "Always ready to bolt: starts every battle with 25% turn meter.", { id: "RUN_AWAY" }],
};
const abilityOf = k => { const a = ABILITY[k] || [k, "", { id: "NONE" }]; return { name: a[0], text: a[1], ...a[2], key: k }; };

// ---------- Held Items ----------
// tier: 1 common (Explore drops), 2 uncommon, 3 rare (BP Exchange, bosses)
const HELD = {
  leftovers: { n: "Leftovers", t: 2, d: "Restores 1/16 of its max HP every turn." },
  quickclaw: { n: "Quick Claw", t: 1, d: "20% chance after each of its turns to gain 50% turn meter." },
  scopelens: { n: "Scope Lens", t: 1, d: "Raises its critical-hit ratio." },
  widelens: { n: "Wide Lens", t: 1, d: "Its moves are 10% more accurate." },
  brightpowder: { n: "Bright Powder", t: 1, d: "Moves aimed at it are 10% less accurate." },
  kingsrock: { n: "King's Rock", t: 1, d: "Its damaging moves may make the target flinch (10%)." },
  focusband: { n: "Focus Band", t: 2, d: "10% chance to hold on with 1 HP instead of fainting." },
  shellbell: { n: "Shell Bell", t: 2, d: "Restores HP equal to 1/8 of the damage it deals." },
  expertbelt: { n: "Expert Belt", t: 2, d: "Super-effective moves deal 20% more damage." },
  eviolite: { n: "Eviolite", t: 2, d: "Defense and Sp. Def ×1.5 while the holder can still evolve." },
  muscleband: { n: "Muscle Band", t: 1, d: "Physical moves deal 10% more damage." },
  wiseglasses: { n: "Wise Glasses", t: 1, d: "Special moves deal 10% more damage." },
  sitrusberry: { n: "Sitrus Berry", t: 1, d: "Restores 1/4 of its max HP when its HP drops below half. Once per battle." },
  lumberry: { n: "Lum Berry", t: 1, d: "Cures any status condition or confusion. Once per battle." },
  choiceband: { n: "Choice Band", t: 3, d: "Attack ×1.5." },
  choicespecs: { n: "Choice Specs", t: 3, d: "Sp. Atk ×1.5." },
  choicescarf: { n: "Choice Scarf", t: 3, d: "Speed ×1.5." },
  lifeorb: { n: "Life Orb", t: 3, d: "Its moves deal 30% more damage, but it loses 1/10 of its max HP each time it attacks." },
  assaultvest: { n: "Assault Vest", t: 3, d: "Sp. Def ×1.5." },
  lightball: { n: "Light Ball", t: 3, only: ["pikachu"], d: "Pikachu only: doubles Attack and Sp. Atk." },
  thickclub: { n: "Thick Club", t: 3, only: ["cubone", "marowak"], d: "Cubone and Marowak only: doubles Attack." },
  luckypunch: { n: "Lucky Punch", t: 3, only: ["chansey"], d: "Chansey only: sharply raises its critical-hit ratio." },
  leek: { n: "Leek", t: 3, only: ["farfetchd"], d: "Farfetch'd only: sharply raises its critical-hit ratio." },
  metalpowder: { n: "Metal Powder", t: 3, only: ["ditto"], d: "Ditto only: doubles Defense until it transforms." },
};
// a type-boosting item for every type (+20%)
const TYPE_ITEM = { Normal: "silkscarf:Silk Scarf", Fire: "charcoal:Charcoal", Water: "mysticwater:Mystic Water", Electric: "magnet:Magnet", Grass: "miracleseed:Miracle Seed",
  Ice: "nevermeltice:Never-Melt Ice", Fighting: "blackbelt:Black Belt", Poison: "poisonbarb:Poison Barb", Ground: "softsand:Soft Sand", Flying: "sharpbeak:Sharp Beak",
  Psychic: "twistedspoon:Twisted Spoon", Bug: "silverpowder:Silver Powder", Rock: "hardstone:Hard Stone", Ghost: "spelltag:Spell Tag", Dragon: "dragonfang:Dragon Fang" };
for (const t in TYPE_ITEM) { const [k, n] = TYPE_ITEM[t].split(":"); HELD[k] = { n, t: 1, boost: t, d: `${t}-type moves deal 20% more damage.` }; }
const HELD_KEYS = Object.keys(HELD);
const heldIcon = k => { const h = HELD[k]; const col = h && h.boost ? TC[h.boost] : h && h.t === 3 ? "#7a3fb8" : h && h.t === 2 ? "#3b7dd8" : "#c8a06a";
  return `<svg viewBox="0 0 24 24"><path d="M5 9h14l-2 12H7z" fill="${col}" stroke="${shade(col, -.5)}" stroke-width="1.3"/><path d="M8 9a4 4 0 0 1 8 0" stroke="${shade(col, -.5)}" stroke-width="1.6" fill="none"/><circle cx="12" cy="15" r="2.2" fill="#fff" opacity=".7"/></svg>`; };

// ---------- the 151 ----------
const SUPPORTERS = new Set(["clefairy", "clefable", "jigglypuff", "wigglytuff", "chansey", "butterfree", "mrmime", "drowzee", "hypno", "exeggcute", "lapras", "parasect", "venomoth", "vileplume", "tangela"]);
function roleOf(d) {
  const [hp, at, df, sa, sd, sp] = d.b;
  if (SUPPORTERS.has(d.k)) return "Supporter";
  if ((df + sd + hp) / 3 >= Math.max(at, sa) && sp < 85) return "Defender";
  if (sp >= 100 && sp >= Math.max(at, sa)) return "Speedster";
  if (sa > at + 5) return "Attacker";
  return "All-Rounder";
}
const OPS = {};
const OP_KEYS = [];
const DEXN = {};
for (const d of DEX) {
  const op = { key: d.k, id: d.id, n: d.n, short: d.n, genus: d.g, types: d.t, el: d.t[0], b: d.b, rar: d.r, leg: !!d.leg, cls: roleOf(d),
    skills: d.m.map((k, i) => makeSkill(k, i + 1)), ml: d.ml, ab: d.ab, passives: [abilityOf(d.ab)], evo: d.evo || [], from: d.from || null,
    h: d.h, w: d.w, cr: d.cr, gr: d.gr };
  OPS[d.k] = op; OP_KEYS.push(d.k); DEXN[d.id] = d.k;
}
// final forms (nothing evolves from them any further) and whether a Pokémon can still evolve (for Eviolite)
const canEvolve = k => OPS[k].evo.length > 0;
const evoLine = k => { let b = k; while (OPS[b].from) b = OPS[b].from; const out = []; const walk = (x, d) => { out.push([x, d]); for (const e of OPS[x].evo) walk(e.to, d + 1); }; walk(b, 0); return out; };
const opLabel = op => op.n;
// Showdown sprites (embedded by build.sh) for menus and battle
const spriteURL = op => sprFront(op.key);
const headURL = op => sprFront(op.key);
