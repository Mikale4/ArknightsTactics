
// =====================================================================
//  STORY — Part 2: the Victoria arc (Episodes 09-14)
//  An original condensed retelling of the real Main Theme Episodes 09-14:
//  Stormwatch · Shatterpoint · Return to Mist · All Quiet Under the Thunder ·
//  The Whirlpool that is Passion · Absolved Will Be the Seekers.
//  New speakers use the v_ prefix, new enemies the v prefix.
// =====================================================================
addSpeakers({
  v_horn: { n: "Horn", op: "horn" },
  v_bagpipe: { n: "Bagpipe", op: "bagpipe" },
  v_hamilton: { n: "Colonel Hamilton", art: "hamilton" },
  v_outcast: { n: "Outcast", art: "outcast" },
  v_jane: { n: "Jane", art: "jane" },
  v_draco: { n: "Cloaked Draco", op: "reed" },
  v_harmonie: { n: "Harmonie", op: "harmonie" },
  v_mandragora: { n: "Mandragora", en: "vmandragora", art: "mandragora" },
  v_theresis: { n: "Theresis", art: "theresis" },
  v_theresa: { n: "Theresa", en: "vtheresa", art: "theresa" },
  v_siege: { n: "Siege", op: "siege" },
  v_morgan: { n: "Morgan", op: "morgan" },
  v_dagda: { n: "Dagda", op: "dagda" },
  v_heidi: { n: "Heidi", op: "heidi" },
  v_clovisia: { n: "Clovisia", art: "clovisia" },
  v_manfred: { n: "Manfred", en: "vmanfred", art: "manfred" },
  v_hoederer: { n: "Hoederer", art: "hoederer" },
  v_ines: { n: "Ines", op: "ines" },
  v_feist: { n: "Feist", op: "stainless" },
  v_allerdale: { n: "Allerdale", art: "allerdale" },
  v_catherine: { n: "Catherine", art: "catherine" },
  v_logos: { n: "Logos", op: "logos" },
  v_ascalon: { n: "Ascalon", art: "ascalon" },
  v_shining: { n: "Shining", art: "shining" },
  v_steamknight: { n: "The Last Steam Knight", en: "vsteamknight", art: "steamknight" },
  v_delphine: { n: "Delphine", op: "delphine" },
  v_baird: { n: "Baird", art: "baird" },
  v_cador: { n: "Cador", art: "cador" },
  v_golding: { n: "Golding", art: "golding" },
  v_trilby: { n: "Trilby Asher", en: "vtrilby" },
  v_damazti: { n: "Damazti Cluster", en: "vdamazti", art: "damazti" },
  v_eblana: { n: "Eblana", art: "eblana" },
  v_windermere: { n: "Duchess of Windermere", art: "windermere" },
  v_quisartustaj: { n: "Qui'sartuštaj", art: "quisartustaj" },
  v_nightingale: { n: "Nightingale", op: "nightingale" },
  v_sanguinarch: { n: "The Sanguinarch", en: "vsanguinarch", art: "sanguinarch" },
  v_nezzsalem: { n: "Nezzsalem", art: "nezzsalem" },
  v_revenant: { n: "Kindling Revenant", en: "vrevenant", art: "revenant" },
});

// ---------- Part 2 enemies: Dublinn, the Kazdel Military Commission, and what the Sarkaz dead left behind ----------
addEnemies({
  // ---- Dublinn (Episodes 09-10) ----
  vdubinfantry: { n: "Dublinn Phalanx Infantry", cls: "Guard", el: "Fire", m: { hp: 1.5, atk: 1.6, def: .9, spd: 104 },
    fig: { type: "hood", skin: "#d9cbb8", col: "#3a2a3e", col2: "#241a28", cape: "#4a2e52", eyes: "#c87aff", mask: 1, w: "spear", sc: "#c87aff" },
    skills: [{ slot: 1, name: "Phalanx Thrust", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .3, turns: 2 }], desc: "320% ATK. 30% chance to Burn (2T)." },
      { slot: 2, name: "Close Ranks", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "DEF_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .2 }], desc: "Gain DEF Up (2T) and 20% turn meter." }] },
  vdubcaster: { n: "Dublinn Shadowcaster", cls: "Caster", el: "Dark", m: { hp: 1.2, atk: 1.6, def: .6, spd: 104 },
    fig: { type: "hood", skin: "#d6c8c0", col: "#2e1e3a", col2: "#1e1428", cape: "#3e2652", eyes: "#d08aff", robe: 1, w: "arts", sc: "#b06aff" },
    skills: [{ slot: 1, name: "Purple Flame", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .3, turns: 2 }], desc: "280% ATK. 30% chance to Burn (2T)." },
      { slot: 2, name: "Pyre of Grievance", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.8, effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .3, turns: 2 }], desc: "Hits all enemies (180% ATK). 30% chance of ATK Down (2T)." }] },
  vevocator: { n: "Dublinn Evocator", cls: "Supporter", el: "Fire", m: { hp: 1.19, atk: 1.4, def: .65, spd: 106 },
    fig: { type: "hood", skin: "#e0d0c4", col: "#4a1e3e", col2: "#2e1228", cape: "#6a2a5a", eyes: "#ff8aff", robe: 1, w: "rod", sc: "#e07aff" },
    skills: [{ slot: 1, name: "Ember Chant", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "elem", kind: "burn", amount: .25 }], desc: "260% ATK. Builds 25% Burn Elemental Injury." },
      { slot: 2, name: "Evocation", cd: 3, target: "team", effects: [{ on: "team", type: "buff", what: "ATK_UP", turns: 2 }, { on: "team", type: "atkbar+", amount: .1 }], desc: "All allies gain ATK Up (2T) and 10% turn meter." }] },
  // ---- the Kazdel Military Commission (Episodes 10-14) ----
  vheirbearer: { n: "Sarkaz Heirbearer Warrior", cls: "Guard", el: "Dark", m: { hp: 1.45, atk: 1.4, def: .9, spd: 106 },
    fig: { type: "human", skin: "#d0c4bc", hair: "#2a2226", hs: "short", col: "#2a1e22", col2: "#1a1416", acc: "#a83a3a", boot: "#120e10", cape: "#4a1a20", coat: 1, horns: "sarkaz", hornc: "#1a1216", eyec: "#ff5a4a", bulk: 1.15, w: "greatsword", sc: "#ff6a5a" },
    skills: [{ slot: 1, name: "Heir's Cleave", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .35, turns: 2 }], desc: "300% ATK. 35% chance of DEF Down (2T)." },
      { slot: 2, name: "Inherited Hatred", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "ATK_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .2 }], desc: "Gain ATK Up (2T) and 20% turn meter." }] },
  vchaincaster: { n: "Sarkaz Chain Caster", cls: "Caster", el: "Dark", m: { hp: 1.12, atk: 1.47, def: .6, spd: 106 },
    fig: { type: "human", skin: "#d8ccc4", hair: "#3a2a3a", hs: "long", col: "#2a2236", col2: "#1c1626", acc: "#7a4ad8", boot: "#141018", horns: "sarkaz", hornc: "#1a1216", eyec: "#c87aff", robe: 1, w: "arts", sc: "#9a6aff" },
    skills: [{ slot: 1, name: "Chained Arts", cd: 0, target: "enemy", n: 3, falloff: .85, hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "SLOW", chance: .3, turns: 1 }], desc: "Arts jump between up to 3 enemies (240% ATK, 15% weaker per jump). 30% chance to Slow (1T)." },
      { slot: 2, name: "Binding Sigil", cd: 3, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "debuff", what: "BIND", chance: .6, turns: 2 }], desc: "260% ATK. 60% chance to Bind (2T)." }] },
  vroyalguard: { n: "Sarkaz Royal Court Soldier", cls: "Defender", el: "Dark", m: { hp: 1.54, atk: 1.26, def: 1.1, spd: 98 },
    fig: { type: "human", skin: "#ccc0b8", hair: "#1e1a1e", hs: "short", col: "#3a1a22", col2: "#26121a", acc: "#c8a24a", boot: "#100a0c", cape: "#5a1a28", horns: "sarkaz", hornc: "#141012", eyec: "#ff4a4a", bulk: 1.25, w: "shield", sc: "#c8a24a", shc: "#4a2a30" },
    skills: [{ slot: 1, name: "Court Blade", cd: 0, target: "enemy", hits: 1, mult: 2.4, effects: [{ on: "target", type: "debuff", what: "PROVOKE", chance: .3, turns: 1 }], desc: "240% ATK. 30% chance to Provoke (1T)." },
      { slot: 2, name: "Royal Bulwark", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "TAUNT", turns: 2 }, { on: "self", type: "buff", what: "DEF_UP", turns: 2 }, { on: "self", type: "shieldCasterHP", amount: .12, turns: 2 }], desc: "Gain Taunt, DEF Up and a Barrier (12% HP) for 2 turns." }] },
  vdrone: { n: "Sarkaz Engineering Drone", cls: "Sniper", el: "Wind", m: { hp: .9, atk: 1.25, def: .5, spd: 120 },
    fig: { type: "robot", col: "#7a6a58", col2: "#4a4038", acc: "#ff7a3a", h: .8, w: "pistol" },
    skills: [{ slot: 1, name: "Rivet Burst", cd: 0, target: "enemy", hits: 2, mult: 1.4, effects: [], desc: "2 hits (140% ATK each)." },
      { slot: 2, name: "Target Marking", cd: 3, target: "enemy", hits: 1, mult: 1.8, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .6, turns: 2 }], desc: "180% ATK. 60% chance of Fragile (2T)." }] },
  vartillery: { n: "Londinium Defense Artillery", cls: "Sniper", el: "Fire", m: { hp: 1.4, atk: 1.4, def: 1.05, spd: 92 },
    fig: { type: "robot", col: "#5a5a50", col2: "#3a3a32", acc: "#ffb03a", bulk: 1.5, h: .95, w: "rifle" },
    skills: [{ slot: 1, name: "Shell", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .25, turns: 2 }], desc: "300% ATK. 25% chance of DEF Down (2T)." },
      { slot: 2, name: "Bombardment", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.9, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .35, turns: 2 }], desc: "Hits all enemies (190% ATK). 35% chance to Burn (2T)." }],
    passives: [{ id: "IMMUNE_LIST", list: ["STUN", "SLEEP", "FREEZE", "LEVITATE", "FEAR"], name: "Emplacement", desc: "Bolted to the wall: immune to Stun, Sleep, Freeze, Levitate and Fear." }] },
  vbloodheir: { n: "Bloodthirsty Heir", cls: "Specialist", el: "Dark", m: { hp: 1.26, atk: 1.54, def: .65, spd: 118 },
    fig: { type: "human", skin: "#f0e2e2", hair: "#2a1018", hs: "long", col: "#2a0e14", col2: "#1a080c", acc: "#c81e3a", boot: "#0e0608", cape: "#4a0a16", eyec: "#ff2a4a", w: "dagger", sc: "#ff3a5a" },
    skills: [{ slot: 1, name: "Thirsting Fangs", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "HEAL_BLOCK", chance: .2, turns: 1 }], desc: "2 hits (150% ATK each). 20% chance per hit of Heal Block (1T)." },
      { slot: 2, name: "Blood Rush", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "SPD_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .25 }], desc: "Gain SPD Up (2T) and 25% turn meter." }],
    passives: [{ id: "LIFESTEAL", amount: .25, name: "Blood Debt", desc: "Heals for 25% of the damage it deals." }] },
  vwitherer: { n: "Sarkaz Wither Caster", cls: "Caster", el: "Dark", m: { hp: 1.12, atk: 1.4, def: .55, spd: 104 },
    fig: { type: "hood", skin: "#b8b4a8", col: "#3a3a2a", col2: "#26261a", cape: "#4a4a32", eyes: "#b8ff6a", robe: 1, w: "arts", sc: "#a8d86a" },
    skills: [{ slot: 1, name: "Withering Touch", cd: 0, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "elem", kind: "necrosis", amount: .35 }], desc: "260% ATK. Builds 35% Necrosis Elemental Injury." },
      { slot: 2, name: "Rot Field", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.7, effects: [{ on: "target", type: "debuff", what: "HEAL_BLOCK", chance: .35, turns: 1 }], desc: "Hits all enemies (170% ATK). 35% chance of Heal Block (1T)." }] },
  // ---- Victoria's own shadows (Episodes 11-12) ----
  vtrilby: { n: "Trilby Asher", cls: "Specialist", el: "Wind", m: { hp: 1.26, atk: 1.47, def: .7, spd: 116 },
    fig: { type: "human", skin: "#e6d4c4", hair: "#2a2420", hs: "short", col: "#1e2024", col2: "#141518", acc: "#c8a24a", boot: "#0e0e10", coat: 1, hat: "#16171a", eyec: "#e8d8a0", w: "saber", sc: "#dcdce6" },
    skills: [{ slot: 1, name: "Cane Sword", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [], desc: "300% ATK." },
      { slot: 2, name: "Into the Fog", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "STEALTH", turns: 1 }, { on: "self", type: "buff", what: "CRIT_RATE_UP", turns: 2 }, { on: "self", type: "atkbar+", amount: .3 }], desc: "Gain Camouflage (1T), Crit Rate Up (2T) and 30% turn meter." }] },
  vspy: { n: "Damazti Pathfinder Spy", cls: "Specialist", el: "Dark", m: { hp: 1.25, atk: 1.7, def: .6, spd: 120 },
    fig: { type: "hood", skin: "#c8c0b8", col: "#4a4a50", col2: "#2e2e34", cape: "#5a5a62", eyes: "#e8e8ff", mask: 1, w: "dagger", sc: "#c8c8d8" },
    skills: [{ slot: 1, name: "Borrowed Knife", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "strip", amount: 1, chance: .35 }], desc: "320% ATK. 35% chance to remove a buff." },
      { slot: 2, name: "A Friendly Face", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "STEALTH", turns: 2 }, { on: "self", type: "buff", what: "DODGE", turns: 2 }], desc: "Gain Camouflage and Dodge (2T)." }] },
  // ---- Sarkaz dead and their makings (Episodes 12-14) ----
  vchimera: { n: "Profane Chimera", cls: "Guard", el: "Dark", m: { hp: 1.4, atk: 1.4, def: .75, spd: 104 },
    fig: { type: "hound", col: "#5a2a3a", acc: "#ff4a6a", h: 1.35 },
    skills: [{ slot: 1, name: "Rend", cd: 0, target: "enemy", hits: 2, mult: 1.5, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .2, turns: 2 }], desc: "2 hits (150% ATK each). 20% chance per hit to Burn (2T)." },
      { slot: 2, name: "Profane Howl", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.6, effects: [{ on: "target", type: "debuff", what: "FEAR", chance: .2, turns: 1 }], desc: "Hits all enemies (160% ATK). 20% chance of Fear (1T)." }] },
  vsoul: { n: "Soul Remnant", cls: "Caster", el: "Dark", m: { hp: 1.0, atk: 1.25, def: .45, spd: 108 },
    fig: { type: "hood", skin: "#d8d0e8", col: "#2e2440", col2: "#1e182c", cape: "#4a3a6a", eyes: "#ff7a9a", robe: 1, w: "none" },
    skills: [{ slot: 1, name: "Grief", cd: 0, target: "enemy", hits: 1, mult: 2.8, effects: [{ on: "target", type: "debuff", what: "SILENCE", chance: .15, turns: 1 }], desc: "280% ATK. 15% chance to Silence (1T)." },
      { slot: 2, name: "Wail of the Myriad", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.7, effects: [{ on: "target", type: "atkbar-", amount: .1 }], desc: "Hits all enemies (170% ATK) and reduces turn meter by 10%." }] },

  // ---- named bosses ----
  vmandragora: { n: "Mandragora", boss: 1, cls: "Caster", el: "Dark", portrait: "mandragora", m: { hp: 3.0, atk: 1.25, def: .85, spd: 110 },
    fig: { type: "human", skin: "#ecdcd0", hair: "#3a2e3a", hs: "bob", col: "#2a2632", col2: "#1a1820", acc: "#a87aff", boot: "#141218", cape: "#3a2a4a", ears: "cat", robe: 1, eyec: "#c89aff", w: "arts", sc: "#b08aff" },
    skills: [{ slot: 1, name: "Geokinesis", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .35, turns: 2 }], desc: "300% ATK. 35% chance of DEF Down (2T)." },
      { slot: 2, name: "Stoneshield", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "DMG_REDUCE", turns: 2, v: .35 }, { on: "self", type: "shieldCasterHP", amount: .15, turns: 2 }], desc: "Takes 35% less damage and gains a Barrier (15% HP) for 2 turns." },
      { slot: 3, name: "Upheaval", cd: 4, target: "aoe_enemies", hits: 2, mult: 1.8, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .25, turns: 1 }], desc: "Hits all enemies twice (180% each). 25% chance per hit to Stun." }],
    passives: [{ id: "HOVER", on: "lowhp", cond: { hpBelow: .5 }, effects: [{ on: "self", type: "buff", what: "DODGE", turns: 3 }, { on: "self", type: "buff", what: "ATK_UP", turns: 3 }], name: "Low-Altitude Hovering", desc: "The first time her HP falls below 50%, she lifts into the air: Dodge and ATK Up (3T)." }] },
  vmanfred: { n: "Manfred", boss: 1, cls: "Guard", el: "Dark", portrait: "manfred", m: { hp: 3.2, atk: 1.2, def: 1.0, spd: 112 },
    fig: { type: "human", skin: "#d4c8c0", hair: "#4a4650", hs: "short", col: "#1e2226", col2: "#14171a", acc: "#c83a3a", boot: "#0c0e10", cape: "#2a1418", coat: 1, horns: "sarkaz", hornc: "#141012", eyec: "#ff5a3a", h: 1.06, w: "saber", sc: "#ff6a4a" },
    skills: [{ slot: 1, name: "Commission Sabre", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .4, turns: 2 }], desc: "320% ATK. 40% chance of Fragile (2T)." },
      { slot: 2, name: "Fire Mission", cd: 3, target: "aoe_enemies", hits: 1, mult: 1.9, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .4, turns: 2 }], desc: "Calls the wall guns: hits all enemies (190% ATK), 40% chance to Burn (2T)." },
      { slot: 3, name: "The Regent's Student", cd: 4, target: "enemy", hits: 2, mult: 2.6, ignoreDef: .3, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .35, turns: 1 }], desc: "2 hits (260% each), ignoring 30% DEF. 35% chance per hit to Stun." }],
    passives: [{ id: "IMMUNE_LIST", list: ["STUN", "PROVOKE", "FEAR"], name: "Field Commander", desc: "Immune to Stun, Provoke and Fear." }] },
  vsteamknight: { n: "The Last Steam Knight", boss: 1, cls: "Guard", el: "Fire", portrait: "steamknight", m: { hp: 4.8, atk: 1.6, def: 1.3, spd: 100 },
    fig: { type: "mando", helm: "#a8844a", col: "#5a4a3a", col2: "#3a3028", acc: "#ffb03a", cape: "#5a1a1a", boot: "#2a2018", bulk: 1.4, h: 1.3, w: "spear", sc: "#ffcf7a" },
    skills: [{ slot: 1, name: "Lance Drive", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "DEF_BREAK", chance: .4, turns: 2 }], desc: "320% ATK. 40% chance of DEF Down (2T)." },
      { slot: 2, name: "Boiler Vent", cd: 3, target: "self", effects: [{ on: "self", type: "buff", what: "DEF_UP", turns: 2 }, { on: "self", type: "buff", what: "COUNTER", turns: 2 }, { on: "self", type: "shieldCasterHP", amount: .15, turns: 2 }], desc: "Gain DEF Up, Counter and a Barrier (15% HP) for 2 turns." },
      { slot: 3, name: "Knight's Charge", cd: 4, target: "aoe_enemies", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "STUN", chance: .3, turns: 1 }, { on: "target", type: "atkbar-", amount: .2 }], desc: "Hits all enemies (300% ATK), -20% turn meter, 30% chance to Stun." }],
    passives: [{ id: "UNDYING", amount: .3, turns: 1, name: "Oath Beyond Death", desc: "Once per battle, a lethal blow leaves him at 30% HP, Invincible for 1 turn." }] },
  vdamazti: { n: "Damazti Cluster", boss: 1, cls: "Specialist", el: "Dark", portrait: "damazti", m: { hp: 4.8, atk: 1.6, def: .8, spd: 122 },
    fig: { type: "hood", skin: "#c8c0c8", col: "#4a4652", col2: "#2e2c34", cape: "#6a6676", eyes: "#f0f0ff", mask: 1, h: 1.08, w: "dagger", sc: "#d8d8f0" },
    skills: [{ slot: 1, name: "Many Hands", cd: 0, target: "enemy", hits: 3, mult: 1.2, spread: true, effects: [{ on: "target", type: "debuff", what: "BRAND", chance: .2, turns: 2 }], desc: "3 hits on random enemies (120% each). 20% chance per hit of Fragile (2T)." },
      { slot: 2, name: "Stolen Face", cd: 3, target: "enemy", hits: 1, mult: 2.6, effects: [{ on: "target", type: "strip", amount: 2 }, { on: "self", type: "buff", what: "STEALTH", turns: 1 }], desc: "260% ATK and removes 2 buffs; gains Camouflage (1T)." },
      { slot: 3, name: "Swarm of Selves", cd: 4, target: "aoe_enemies", hits: 2, mult: 1.6, dmg: "arts", effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .5, turns: 2 }], desc: "Hits all enemies twice with Arts (160% each). 50% chance per hit of ATK Down (2T)." }],
    passives: [{ id: "COLLECTIVE", on: "turn", effects: [{ on: "self", type: "healPct", amount: .04 }], name: "Collective", desc: "Many bodies, one will: heals 4% max HP at the start of each turn." }] },
  vsanguinarch: { n: "The Sanguinarch", boss: 1, cls: "Guard", el: "Dark", portrait: "sanguinarch", m: { hp: 4.0, atk: 1.4, def: .95, spd: 118 },
    fig: { type: "human", skin: "#f2e6e6", hair: "#1a1216", hs: "long", col: "#2a0a12", col2: "#16060a", acc: "#d81e3a", boot: "#0a0406", cape: "#6a0a1e", coat: 1, eyec: "#ff1a3a", h: 1.1, w: "saber", sc: "#ff2a4a" },
    skills: [{ slot: 1, name: "Crimson Blade", cd: 0, target: "enemy", hits: 1, mult: 3.2, effects: [{ on: "target", type: "debuff", what: "HEAL_BLOCK", chance: .35, turns: 1 }], desc: "320% ATK. 35% chance of Heal Block (1T)." },
      { slot: 2, name: "Blood Feast", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.0, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .4, turns: 2 }, { on: "self", type: "healPct", amount: .08 }], desc: "Hits all enemies (200% ATK), 40% chance to Burn (2T); heals 8% max HP." },
      { slot: 3, name: "Teekaz Blood", cd: 5, target: "aoe_enemies", hits: 2, mult: 2.2, dmg: "arts", effects: [{ on: "target", type: "debuff", what: "FEAR", chance: .35, turns: 1 }], desc: "Hits all enemies twice with Arts (220% each). 35% chance per hit of Fear (1T)." }],
    passives: [{ id: "LIFESTEAL", amount: .2, name: "Sanguinarch", desc: "Heals for 20% of the damage he deals." },
      { id: "IMMUNE_LIST", list: ["STUN", "SLEEP", "FEAR", "PROVOKE"], name: "Pure Blood", desc: "Immune to Stun, Sleep, Fear and Provoke." }] },
  vrevenant: { n: "Kindling Revenant", boss: 1, cls: "Caster", el: "Fire", portrait: "revenant", m: { hp: 3.4, atk: 1.2, def: .7, spd: 110 },
    fig: { type: "hood", skin: "#3a2a24", col: "#3a1a10", col2: "#24100a", cape: "#8a2a10", eyes: "#ffb03a", robe: 1, h: 1.35, bulk: 1.2, w: "none" },
    skills: [{ slot: 1, name: "Smouldering Grief", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .45, turns: 2 }], desc: "300% ATK. 45% chance to Burn (2T)." },
      { slot: 2, name: "Kindle the Dead", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.0, effects: [{ on: "target", type: "elem", kind: "burn", amount: .4 }], desc: "Hits all enemies (200% ATK). Builds 40% Burn Elemental Injury." },
      { slot: 3, name: "Myriad Rage", cd: 5, target: "aoe_enemies", hits: 3, mult: 1.4, effects: [{ on: "target", type: "debuff", what: "DOT", chance: .4, turns: 2 }], desc: "Hits all enemies 3 times (140% each). 40% chance per hit to Burn (2T)." }],
    passives: [{ id: "IMMUNE_LIST", list: ["SILENCE", "FEAR", "SLEEP"], name: "Burning Rage", desc: "Immune to Silence, Fear and Sleep." }] },
  vtheresa: { n: "Theresa", boss: 1, cls: "Caster", el: "Light", portrait: "theresa", m: { hp: 4.0, atk: 1.2, def: 1.0, spd: 116 },
    fig: { type: "human", skin: "#f4e8e4", hair: "#f0c4d0", hs: "long", col: "#f4eef2", col2: "#d8c8d4", acc: "#ff8ab0", boot: "#4a3a44", cape: "#e8dce6", horns: "sarkaz", hornc: "#2a2028", eyec: "#ff8ab0", robe: "skirt", h: 1.05, w: "arts", sc: "#ffe0ea" },
    skills: [{ slot: 1, name: "Civilight", cd: 0, target: "enemy", hits: 1, mult: 3.0, effects: [{ on: "target", type: "debuff", what: "ATK_DOWN", chance: .35, turns: 2 }], desc: "300% ATK. 35% chance of ATK Down (2T)." },
      { slot: 2, name: "White Flame", cd: 3, target: "aoe_enemies", hits: 1, mult: 2.2, effects: [{ on: "target", type: "strip", amount: 1, chance: .5 }], desc: "Hits all enemies (220% ATK). 50% chance to remove a buff." },
      { slot: 3, name: "The Crown's Trial", cd: 5, target: "aoe_enemies", hits: 2, mult: 2.0, effects: [{ on: "target", type: "debuff", what: "SILENCE", chance: .4, turns: 1 }, { on: "self", type: "healPct", amount: .12 }], desc: "Hits all enemies twice (200% each), 40% chance per hit to Silence (1T); heals 12% max HP." }],
    passives: [{ id: "REVIVE_ONCE", amount: .3, turns: 1, name: "King of Sarkaz", desc: "Once per battle, a lethal blow leaves her at 30% HP, Invincible for 1 turn." },
      { id: "IMMUNE_LIST", list: ["STUN", "SLEEP", "FREEZE", "LEVITATE", "FEAR"], name: "Civilight Eterna", desc: "Immune to Stun, Sleep, Freeze, Levitate and Fear." }] },
}, { vdubinfantry: 10, vdubcaster: 30, vevocator: 30, vheirbearer: 20, vchaincaster: 30, vroyalguard: 25, vdrone: 0, vartillery: 10, vbloodheir: 20,
  vwitherer: 35, vtrilby: 15, vspy: 20, vchimera: 20, vsoul: 30,
  vmandragora: 50, vmanfred: 30, vsteamknight: 20, vdamazti: 30, vsanguinarch: 40, vrevenant: 50, vtheresa: 60 });

// ---------- Part 2: Episodes 09-14 ----------
STORY.push({
  id: "ep2", title: "Crown in the Fog", sub: "Part 2", tint: "#2a3a30",
  blurb: "A year after Chernobog, Victoria is coming apart. The Sarkaz hold Londinium, a forgotten heir walks its slums, and a dead king's shadow waits behind the Regent.",
  chapters: [
    // ---------------- Episode 09 ----------------
    { id: "c9", title: "Stormwatch", env: "victoria", map: "victoria", reward: { op: "bagpipe", orundum: 500, permit: 3 },
      nodes: [
        { id: "9-1", type: "story", name: "County Hillock", mood: "plot", pre: [
          L("narr", "Eleven months and twenty-seven days after Chernobog. County Hillock, southern Victoria: chimney smoke, wet slate roofs, and a fog that never quite lifts."),
          L("v_bagpipe", "Captain Horn! The Tempest Platoon's all here, and the barracks gave us exactly zero beds. Shall I go and ask them nicely?"),
          L("v_horn", "Nicely, Bagpipe. We're here to find stolen military Originium, not to start a war with our own side."),
          L("v_hamilton", "Londinium sends wolves to sniff around my county. Spare me your inquiries, Captain. The Tarans are the rot here, and I am the knife."),
          L("v_horn", "Hanging people without a trial isn't a knife, Colonel. It's a match in a powder store."),
          L("kaltsit", "Doctor, our Hillock office reports the same 'spectre force' Horn is chasing. Outcast is there. Lend her your eyes over the comms."),
          L("doctor", "Patch me in. If this county is about to catch fire, I want to see where the sparks are.") ] },
        { id: "9-2", type: "battle", name: "Spectre Force", lv: 92, bgm: "normal1", waves: [W("vdubinfantry", "vdubcaster", "vdubcaster", "vdubinfantry"), W("vdubinfantry", "vdubcaster", "vdubcaster", "vdubinfantry", "vdubinfantry")], pre: [
          L("narr", "Night. A supply convoy on the county road. The lamps go out one by one, and the dark fills with purple flame."),
          L("v_bagpipe", "Ambush! Whoever these spectres are, they burn like real people. Doctor, call it!") ], post: [
          L("v_horn", "No banners, no demands. Only the colour of their fire. Dublinn."),
          L("v_bagpipe", "The Taran rebels? Out here? Then the colonel's about to get even worse.") ] },
        { id: "9-3", type: "story", name: "Ashes on the Gallows", mood: "lonely", pre: [
          L("narr", "By morning, three Taran men hang outside the barracks. No charge was ever read. The crowd watching says nothing at all."),
          L("v_jane", "One of them was Saoirse's cousin. He mended shoes, Outcast. He mended mine."),
          L("v_outcast", "Grief makes people listen to whoever offers them a target. Watch your friend closely, child. And watch yourself."),
          L("v_jane", "Saoirse gave me an address. A meeting tonight. She says it's only people talking... I don't know what to do with it."),
          L("v_horn", "Give it to me. Bagpipe and I will go ourselves, quietly. If these are rebels, I want to hear them before Hamilton shoots them.") ] },
        { id: "9-4", type: "battle", name: "The Night Assembly", lv: 93, bgm: "normal2", waves: [W("vdubinfantry", "vevocator", "vdubinfantry", "vdubcaster"), W("vdubcaster", "vdubinfantry", "vevocator", "hound", "vdubinfantry")], pre: [
          L("narr", "The 'rebels' in the cellar wear good coats and old rings: Taran nobility, not soldiers. Then Hamilton's men kick in the door."),
          L("v_hamilton", "Every one of them in chains! The evidence can be found later!"),
          L("narr", "The bomb goes off before the first chain closes. Outside, Dublinn is already in the streets."),
          L("v_bagpipe", "Forget the colonel, they're torching the whole block! Get the civilians behind us!") ], post: [
          L("v_draco", "Hillock belongs to Tara tonight. Victorians, go home while you still have legs to walk on."),
          L("v_horn", "A Draco wreathed in fire, giving the orders. She talks like a leader... she doesn't look like she wants to be one.") ] },
        { id: "9-5", type: "battle", name: "Originium Rain", lv: 94, bgm: "normal1", waves: [W("vdubcaster", "vdubinfantry", "vevocator", "vdubinfantry"), W("vevocator", "vdubinfantry", "vdubcaster", "vdubinfantry", "acidslug")], pre: [
          L("narr", "The county artillery opens fire on its own streets. The shells are hollow where the Originium should be, and they burn wrong, scattering raw crystal across the rooftops."),
          L("v_bagpipe", "Those are the stolen casings! Someone gutted them and fired the junk at us! Doctor, the clusters are waking the slugs in the drains!"),
          L("doctor", "Push through to the messenger. Whatever he's carrying, someone was willing to shell a town to bury it.") ], post: [
          L("narr", "The messenger is dead before they reach him. Bagpipe takes the dispatch case from his hands and doesn't open it until she's behind cover."),
          L("v_bagpipe", "...Captain needs to see this. No. All of Victoria needs to see this.") ] },
        { id: "9-6", type: "side", name: "The Draco in the Smoke", lv: 95, bgm: "sss", waves: [W({ op: "reed" }, "vdubinfantry", "vevocator", "vdubcaster", "vdubinfantry")], pre: [
          L("narr", "Word reaches the office: Dublinn has executed Saoirse as an informer. Jane went looking for her ashes. Outcast went looking for Jane."),
          L("v_outcast", "Found her, Doctor. And someone else: the cloaked Draco, burned to the bone by Originium and left behind by her own soldiers."),
          L("v_draco", "Don't touch me... I won't hang on a Victorian rope..."),
          L("v_outcast", "She's raving, and the Dublinn patrol coming down this street means to finish what the shells began. Keep them off us.") ], post: [
          L("v_draco", "...You're Rhodes Island. I know what I did. I signed the order for that girl. Saoirse."),
          L("v_outcast", "Then live long enough to answer for it. Dying is the easy way out, and you don't strike me as a coward."),
          L("v_jane", "Outcast... are we really going to carry her?"),
          L("v_outcast", "We carry everyone, Jane. It's the only rule worth keeping.") ] },
        { id: "9-7", type: "chest", name: "Rhodes Island Field Office", reward: { lmd: 20000, rec4: 6, chip: 3, orundum: 150 }, pre: [
          L("v_jane", "The office survived the shelling. Take what you need. Medicine first, then everything else.") ] },
        { id: "9-8", type: "story", name: "The Sixth Bullet", mood: "frostnovadie", pre: [
          L("narr", "Six of Dublinn's elite come hunting for their missing leader: the Bandit, the Elocutionist, the Toxicologist, the Immolator, the Accountant and the Convict."),
          L("v_outcast", "Bagpipe. Take the Draco. Get her to Jane, and don't stop for anything you hear behind you."),
          L("v_bagpipe", "What about you? There are six of them!"),
          L("v_outcast", "Then I'll need all six bullets. Kal'tsit and I made a promise about the last one. Tell her I'm sorry I broke it."),
          L("narr", "Bagpipe runs. Over her shoulder she glimpses purple fire, and a woman standing calmly inside it. Then a pillar of white light splits the night above Hillock."),
          L("kaltsit", "...Outcast's signal is gone. Doctor, mark the time. I won't be the only one who remembers it.") ] },
        { id: "9-9", type: "battle", name: "Road to the Signal Tower", lv: 96, bgm: "sss", waves: [W("vdubcaster", "vdubinfantry", "vevocator", "vdubinfantry"), W("vevocator", "vdubinfantry", "vdubcaster", "vdubinfantry", "vdubcaster")], pre: [
          L("narr", "Colonel Hamilton refused to abandon his stronghold. Dublinn took it within the hour, and him with it."),
          L("v_horn", "The signal tower is the only way to warn Londinium. Cello, Oboe, with me. Bagpipe, keep that Draco breathing."),
          L("v_bagpipe", "Captain, they're everywhere! Doctor, carve us a path!") ], post: [
          L("narr", "Cello and Oboe don't get up again. Horn closes their eyes herself, and keeps walking.") ] },
        { id: "9-10", type: "boss", name: "Mandragora", lv: 97, bgm: "bossLungmen", mood: { pre: "tense", post: "lonely" },
          waves: [W("vdubinfantry", "vdubcaster", "vdubinfantry", "vdubcaster"), W("vmandragora", "vdubcaster", "vdubinfantry", "vevocator")], pre: [
          L("v_harmonie", "This is Dublinn, speaking to every county in Victoria. Hillock is only the first. We are coming to purify this land."),
          L("v_mandragora", "Victorian soldiers, limping toward their little tower. Do you know how many Tarans your county buried under its stones?"),
          L("v_horn", "Bagpipe. Take the girl and the dispatch and run. That's an order."),
          L("v_bagpipe", "I'm not leaving you here!"),
          L("v_horn", "You're not leaving me. You're carrying the truth to Londinium. Doctor, buy her the time.") ], post: [
          L("v_mandragora", "Tch... Stubborn wolf. Keep your road, then. Victoria burns either way."),
          L("narr", "Horn plants her Piledriver in the road and does not move. Bagpipe runs until the sun comes up."),
          L("v_jane", "Everyone, this way! Tarans, Victorians, it doesn't matter. Hold on to each other and keep walking."),
          L("narr", "At dawn, Rhodes Island leads the survivors out of a burning Hillock. The storm Victoria ignored for twenty years has finally broken.") ] },
      ] },

    // ---------------- Episode 10 ----------------
    { id: "c10", title: "Shatterpoint", env: "victoria", map: "victoria", reward: { op: "horn", orundum: 600, permit: 3 },
      nodes: [
        { id: "10-1", type: "story", name: "The Regent's Court", mood: "tense", pre: [
          L("narr", "Londinium, capital of Victoria. For months its gates have answered to the Sarkaz flag of the Kazdel Military Commission."),
          L("v_theresis", "Gentlemen of the Royal Court. Two weapons will end this war before the Grand Dukes understand it has begun. The Shard, which I will hold. And the airship, which she will."),
          L("narr", "Beside the Regent stands a woman in white. The courtiers do not dare look at her for long."),
          L("v_theresis", "Rhodes Island will come. Kal'tsit has never once let me finish anything in peace. Let them come to Londinium.") ] },
        { id: "10-2", type: "battle", name: "The Downed Pilot", lv: 97, bgm: "normal2", waves: [W("vheirbearer", "vdrone", "vchaincaster", "vdrone", "vheirbearer"), W("vheirbearer", "vchaincaster", "vdrone", "vheirbearer", "vdrone")], pre: [
          L("kaltsit", "Objectives: recover the Blacksteel pilot who went down outside the city, then find a way through the walls. Siege, you know these streets."),
          L("v_siege", "I knew them twenty years ago. Londinium has a long memory and a short temper. Stay close."),
          L("amiya", "Someone's alive near the wreck! A civilian... and Sarkaz scavengers closing in!") ], post: [
          L("amiya", "The pilot didn't make it. But this man did. Sir, are you hurt?"),
          L("narr", "His name is Thomas. He knows a way into the city through Sudean's port, and he is very eager to be useful.") ] },
        { id: "10-3", type: "battle", name: "Port 309", lv: 98, bgm: "normal1", waves: [W("vdubinfantry", "vheirbearer", "vdubcaster", "vevocator"), W("vheirbearer", "vchaincaster", "vroyalguard", "vdubinfantry", "vdubcaster")], pre: [
          L("narr", "Port 309 is chaos. Sarkaz soldiers drag civilians out of the cargo holds. Thomas panics, bolts, and runs straight into a Dublinn squad."),
          L("v_mandragora", "This one's ours, Sarkaz. Back off before I bury you in the dock."),
          L("amiya", "Dublinn, the Sarkaz, someone else shooting from the cranes... Doctor, we can't stay hidden while they fight over civilians!"),
          L("doctor", "Then we stop hiding. Shield the civilians and break whoever comes for them.") ], post: [
          L("v_manfred", "There they are. Every rat in the port, in one place. Artillery: fire."),
          L("narr", "The city's own guns fall on Port 309. When the smoke clears, Thomas is gone, and so is half the pier.") ] },
        { id: "10-4", type: "story", name: "Under Londinium", mood: "plot", pre: [
          L("narr", "Hands pull Rhodes Island down a maintenance shaft as the shells land. Below the streets lies a second city of pipes, pumps and frightened people."),
          L("v_clovisia", "Welcome to the substructure. We're the Londinium Citizens' Self-Salvation Corps, which is a long name for people who refused to kneel."),
          L("kaltsit", "Your people pulled us out of an artillery strike. I don't forget such things."),
          L("v_clovisia", "Then help us with one. The Sarkaz hold a messenger of yours, Heidi, in a factory they turned into a prison."),
          L("doctor", "We'll go together. Though if they're keeping her where everyone knows to look, I'd like to know why.") ] },
        { id: "10-5", type: "chest", name: "Self-Salvation Corps Cache", reward: { lmd: 24000, rec4: 6, summ: 6, orundum: 150, permit: 1 }, pre: [
          L("v_clovisia", "Rations, tools, and a little LMD we 'borrowed' from the Commission. Take your share.") ] },
        { id: "10-6", type: "battle", name: "The Prison Factory", lv: 99, bgm: "sss", waves: [W("vroyalguard", "vchaincaster", "vheirbearer", "vdrone"), W("vdrone", "vheirbearer", "vchaincaster", "vroyalguard", "vheirbearer")], pre: [
          L("v_dagda", "Morgan and I will make noise at the front gate. Lots of noise."),
          L("v_morgan", "Loud, clever and very rude. It's what Glasgow does best."),
          L("v_heidi", "Doctor, I hear you're coming for me. Good. I've already started the riot from in here."),
          L("doctor", "...This is too easy. Everyone, watch the rooftops. It's a trap.") ], post: [
          L("v_heidi", "Thank you, Doctor. Kal'tsit owes you a drink, and I owe her a report she won't like."),
          L("narr", "Sarkaz squads close in from three sides. Then a fourth party arrives, loudly, with explosives.") ] },
        { id: "10-7", type: "story", name: "Babel's Ghosts", mood: "tense", pre: [
          L("w", "Miss me? Kal'tsit sent me to pull your feet out of the fire. Hold still, this'll be loud."),
          L("amiya", "W! Kal'tsit sent you?"),
          L("w", "She pays, I deliver. ...Oh, and don't look now. Hoederer's here."),
          L("v_hoederer", "W. It's been a long time. Leave the Doctor with me and you can walk out of here."),
          L("w", "Tempting. No. Doctor, run, I'll catch up!"),
          L("narr", "They escape, barely. Later, where no one is watching, Hoederer meets a quiet Sarkaz woman in an alley."),
          L("v_ines", "Did she get the message?"),
          L("v_hoederer", "She will. Theresa walks in Londinium, Ines. Someone has to tell W what the Regent has really built.") ] },
        { id: "10-8", type: "side", name: "Old Debts", lv: 100, bgm: "normal2", waves: [W({ op: "ines" }, "vheirbearer", "vchaincaster")], pre: [
          L("v_ines", "Doctor. The Commission's spotters are watching this street, so this has to look real."),
          L("v_ines", "Hold nothing back. If I can't hurt you a little, they won't believe a word I tell them tomorrow.") ], post: [
          L("v_ines", "Convincing enough. Tell W the shadows in Londinium are still mine. She'll know what it means.") ] },
        { id: "10-9", type: "battle", name: "The Sanguinarch's Hunt", lv: 100, bgm: "normal1", waves: [W("vbloodheir", "vbloodheir", "vheirbearer", "vchaincaster"), W("vbloodheir", "vchaincaster", "vbloodheir", "vroyalguard", "vbloodheir")], pre: [
          L("v_clovisia", "Something is following us through the tunnels. Something that drinks."),
          L("v_siege", "A Sanguinarch's brood. Morgan, Dagda, cover the civilians. Nobody is getting eaten in my city."),
          L("amiya", "How do they keep finding us? We change routes every hour!") ], post: [
          L("kaltsit", "Because someone has been telling them. 'Bill' died in the prison break, Doctor. The one who came back with us was never him."),
          L("narr", "The thing wearing Bill's face smiles, comes apart like smoke, and is gone. The Damazti Cluster has walked among them the whole time.") ] },
        { id: "10-10", type: "battle", name: "The Walls of Londinium", lv: 101, bgm: "sss", waves: [W("vartillery", "vroyalguard", "vdrone", "vdrone"), W("vartillery", "vheirbearer", "vartillery", "vchaincaster", "vroyalguard")], pre: [
          L("narr", "The tunnels lead to a train out of Sudean, but the guns on Londinium's walls cover every line. Amiya, the Doctor and Feist climb toward them."),
          L("v_feist", "I fix boilers, not cannons. Then again, a cannon's just a boiler that's angry."),
          L("v_horn", "Rhodes Island! Took you long enough."),
          L("amiya", "Horn! You're alive! We heard about Hillock..."),
          L("v_horn", "Victorian soldiers still man these walls, Amiya, and most of them hate that flag. Give them a reason, and they'll turn the guns around.") ], post: [
          L("narr", "The wall garrison rises. The control room burns, and Londinium's artillery falls silent for the first time in months.") ] },
        { id: "10-11", type: "boss", name: "Manfred", lv: 102, bgm: "mephisto", mood: { pre: "tense", post: "tense" },
          waves: [W("vroyalguard", "vheirbearer", "vdrone", "vchaincaster"), W("vmanfred", "vartillery", "vheirbearer", "vroyalguard")], pre: [
          L("v_manfred", "Horn of the Tempest Platoon. You should have stayed buried in Hillock."),
          L("v_horn", "Manfred. The Regent's favourite student. I've been looking forward to this."),
          L("v_manfred", "The Regent taught me patience. Your Doctor is about to learn what I do with it."),
          L("amiya", "He's commanding the whole wall from here! Doctor, take him down!") ], post: [
          L("v_manfred", "...Enough. The wall is lost, not the war. Run to your train, then."),
          L("narr", "Manfred withdraws, and Horn's soldiers carry her down the wall, barely breathing. Below, an old panel Siege remembers from her childhood lifts a whole tunnel to the surface."),
          L("narr", "The train out of Sudean starts to roll. On the tracks ahead, where the Sarkaz pursuit stops, stands a single woman in white."),
          L("kaltsit", "...Theresa."),
          L("amiya", "That's impossible. She died. Doctor, I was there. I was there!"),
          L("narr", "In Auchterigg, an old noble named Allerdale bows to Siege and calls her by a name she buried long ago: Alexandrina, last heir of the Aslan throne.") ] },
      ] },

    // ---------------- Episode 11 ----------------
    { id: "c11", title: "Return to Mist", env: "victoria", map: "victoria", reward: { op: "stainless", orundum: 600, permit: 4 },
      nodes: [
        { id: "11-1", type: "story", name: "Twenty-Six Years", mood: "calm", pre: [
          L("v_allerdale", "Twenty-six years ago, a little girl walked into a royal banquet carrying a sword taller than she was. Do you remember, Your Highness?"),
          L("v_siege", "I remember a lot of people bowing. Then a lot of people dying. Don't call me Highness, Allerdale."),
          L("v_allerdale", "Then I'll call you what Victoria is going to need. A banner."),
          L("narr", "That night the Military Commission orders the nobility purged. Something with red eyes walks through the Cumberland mansion's front door."),
          L("v_allerdale", "Ailshie! ...Go, all of you! Through the garden. Now!") ] },
        { id: "11-2", type: "battle", name: "The Cumberland Purge", lv: 102, bgm: "normal1", waves: [W("vbloodheir", "vheirbearer", "vwitherer", "vbloodheir"), W("vbloodheir", "vroyalguard", "vwitherer", "vheirbearer", "vbloodheir")], pre: [
          L("v_sanguinarch", "A little lion and a little noblewoman. Your blood smells of old Victoria. I have been so very thirsty."),
          L("v_siege", "Doctor, keep his brood off Allerdale's people. We break through, and then we run.") ], post: [
          L("narr", "Ailshie, Allerdale's servant of thirty years, does not leave the mansion. Neither does the old Steam Knight armour in the hall, crushed to scrap."),
          L("v_allerdale", "...Victoria keeps asking me to bury my friends. One day I'm going to refuse.") ] },
        { id: "11-3", type: "story", name: "Highbury Works", mood: "plot", pre: [
          L("v_feist", "Highbury Works. Kazdel builds its war engines here, with Victorian hands. Mine too, once."),
          L("doctor", "And the supervisor who's been watching us since we walked in?"),
          L("v_catherine", "Feist. You came back. You always did run off before your tea was finished."),
          L("v_feist", "Gran. I need the factory maps. All of them."),
          L("v_catherine", "...They're executing the senior staff this afternoon, so nobody can talk. Take the maps, boy. And take my workers with you.") ] },
        { id: "11-4", type: "battle", name: "The Workers Rise", lv: 103, bgm: "sss", waves: [W("vroyalguard", "vdrone", "vheirbearer", "vdrone"), W("vdrone", "vheirbearer", "vdrone", "vchaincaster", "vroyalguard")], pre: [
          L("v_feist", "Everyone! You built every gun in this hall. Today we decide who they point at!"),
          L("narr", "Spanners, rivet guns and steam hoses come out from under the workbenches. The overseers draw their swords.") ], post: [
          L("v_catherine", "Hah. Your grandfather would have liked you, Feist. He was an idiot too."),
          L("v_feist", "Love you too, Gran. Doctor, Highbury's workers are with the Corps now.") ] },
        { id: "11-5", type: "chest", name: "Catherine's Floor Plans", reward: { lmd: 28000, rec4: 8, chip: 4, orundum: 200 }, pre: [
          L("v_catherine", "Maps, tool chits, and the overseers' strongbox. Don't tell me what you do with the strongbox.") ] },
        { id: "11-6", type: "battle", name: "Sighs of Kings", lv: 104, bgm: "normal2", waves: [W("vwitherer", "vheirbearer", "vwitherer", "vroyalguard"), W("vchaincaster", "vroyalguard", "vwitherer", "vheirbearer", "vwitherer")], pre: [
          L("kaltsit", "Under the city lies a royal mausoleum, and in it the Sighs of Kings: a realmblade that can cut the Regent's Arts apart. We need it."),
          L("v_logos", "The dead on this road are restless. I can hear them singing out of tune. I will correct them."),
          L("v_ascalon", "And I'll correct anyone still alive. Go. I'll be in the shadows where you can't see me. As usual.") ], post: [
          L("narr", "The surface team holds the entrance. Below them, Siege, Allerdale and Amiya descend into the dark.") ] },
        { id: "11-7", type: "story", name: "The Regent", mood: "tense", pre: [
          L("narr", "The air goes still. Every Sarkaz on the field kneels at once."),
          L("v_theresis", "Kal'tsit. Doctor. You walk through my city as though it still remembers you."),
          L("kaltsit", "Doctor, behind me. Now!"),
          L("narr", "A single motion of the Regent's hand. Kal'tsit steps into it, and Mon3tr's roar is the last thing the Doctor hears for a long moment."),
          L("v_shining", "Her wounds are deep. Very deep. Doctor, keep her talking. I will keep her alive."),
          L("kaltsit", "...Don't look at me like that. I've survived worse. Go and get the sword.") ] },
        { id: "11-8", type: "side", name: "Rotchasers in the Deep", lv: 105, bgm: "normal1", waves: [W("vchimera", "vwitherer", "vchimera", "acidslug"), W("vchimera", "vwitherer", "vchimera", "vchimera", "vwitherer")], pre: [
          L("narr", "The mausoleum tunnels are full of things that eat the dead. Lately they have decided the living are more interesting."),
          L("amiya", "Doctor, they're blocking the side passage. If we clear it, we'll reach the old supply vaults.") ], post: [
          L("amiya", "The vaults are sealed with the royal crest... Siege, I think these were left for you.") ] },
        { id: "11-9", type: "battle", name: "Allerdale's Price", lv: 106, bgm: "sss", waves: [W("vtrilby", "vtrilby", "vdrone", "vtrilby"), W("vtrilby", "vtrilby", "vtrilby", "vdrone", "vtrilby")], pre: [
          L("narr", "Past rows of Steam Knights standing dead at their posts, the Sighs of Kings waits in the stone. Allerdale reaches it first."),
          L("v_allerdale", "I'm sorry, Your Highness. The Duke of Caster holds my family. He wants the sword, and his Trilby Ashers will take it."),
          L("v_trilby", "No need to make a scene, Doctor. Kindly step away from the blade."),
          L("v_siege", "Allerdale... Fine. Then we take it back.") ], post: [
          L("v_allerdale", "...Good. You fought for it. A crown nobody fights for isn't worth wearing.") ] },
        { id: "11-10", type: "boss", name: "The Last Steam Knight", lv: 107, bgm: "yeti", mood: { pre: "tense", post: "lonely" },
          waves: [W("vwitherer", "vroyalguard", "vwitherer", "vheirbearer"), W("vsteamknight", "vwitherer", "vheirbearer", "vwitherer", "vroyalguard")], pre: [
          L("narr", "One of the dead knights moves. Steam hisses from armour that has been cold for decades, and a lance rises toward the intruders."),
          L("v_steamknight", "...Who... disturbs... the King's rest..."),
          L("v_siege", "A Steam Knight. Victoria's finest, and Parliament sealed them down here to die guarding a tomb."),
          L("amiya", "He isn't listening! Doctor, we have to stop him, or none of us leaves!") ], post: [
          L("v_allerdale", "Go! Take the sword and go! I'll bring the ceiling down on him."),
          L("v_siege", "Allerdale, no!"),
          L("v_allerdale", "We'll meet again, Alexandrina. I saw it twenty-six years ago, remember? Now run."),
          L("narr", "Stone falls. In the dark, Amiya clutches her head and sees things that are not hers: Kazdel burning under two hundred years of crusades, and Kal'tsit in the ashes, trying to stop the Sarkaz from taking their revenge on the world."),
          L("narr", "Above, Kazdel's airship fleet is finished, and the Grand Dukes' armies close on Londinium."),
          L("doctor", "Amiya. Whatever you saw down there, you don't have to carry it alone. I'm here.") ] },
      ] },

    // ---------------- Episode 12 ----------------
    { id: "c12", title: "All Quiet Under the Thunder", env: "victoria", map: "victoria", reward: { op: "morgan", orundum: 700, permit: 4 },
      nodes: [
        { id: "12-1", type: "story", name: "Norport Adrift", mood: "lonely", pre: [
          L("narr", "The Shard is awake. One bolt from it and an army becomes a crater, so the Grand Dukes advance by inches."),
          L("narr", "The Commission cuts Norport Borough loose from the city and leaves it adrift: a whole borough of civilians for a shield, with no food and no water."),
          L("v_siege", "Glasgow, listen up. Nobody hoards. Nobody steals. Anyone who's hungry eats before anyone who's armed."),
          L("v_baird", "And anyone who argues can argue with me, boss."),
          L("v_cador", "Fine words. Now tell them where the bread's coming from."),
          L("v_delphine", "I'll run the clinics. My mother would never forgive me for hiding behind a crest at a time like this.") ] },
        { id: "12-2", type: "battle", name: "Blockade Line", lv: 107, bgm: "normal2", waves: [W("vroyalguard", "vheirbearer", "vdrone", "vchaincaster"), W("vheirbearer", "vchaincaster", "vdrone", "vroyalguard", "vheirbearer")], pre: [
          L("v_baird", "Commission patrols at the bridge again. They're taking anyone who looks strong enough to work."),
          L("v_siege", "Not today they aren't. Doctor, with me.") ], post: [
          L("v_cador", "We can win a hundred of these and Norport still starves. We need a way out, not another fight.") ] },
        { id: "12-3", type: "story", name: "Saint Marsol", mood: "tense", pre: [
          L("narr", "Saint Marsol School, the Corps' intelligence hub. Every report from every safehouse passes through Golding's hands."),
          L("v_golding", "They knew about the canal route. And the bakery safehouse. Doctor, the leak isn't in the field. It's in here."),
          L("amiya", "Molly... Molly hasn't reported in for three days."),
          L("v_golding", "Then the thing sitting at Molly's desk isn't Molly. And I've already told it far too much."),
          L("narr", "When the Corps comes to evacuate Saint Marsol, Golding is already gone. She made certain no one would ever pull another secret out of her.") ] },
        { id: "12-4", type: "battle", name: "The Mole", lv: 108, bgm: "sss", waves: [W("vspy", "vheirbearer", "vchaincaster", "vspy", "vspy"), W("vspy", "vheirbearer", "vspy", "vchaincaster", "vchaincaster")], pre: [
          L("amiya", "They're wearing Corps uniforms... wearing Corps faces!"),
          L("doctor", "Trust the squad, not the faces. Hit anything that runs for the files.") ], post: [
          L("narr", "The spies dissolve as they fall, like ink in water. Somewhere, a cluster of minds takes note of the Doctor's name.") ] },
        { id: "12-5", type: "story", name: "The Lion of Norport", mood: "plot", pre: [
          L("v_trilby", "Good evening, Rhodes Island. The Duke of Caster would like a closer look at that Kazdel airship. You would like to leave Norport alive. Shall we help each other?"),
          L("amiya", "Rhodes Island stays neutral. But if your road leads out of Norport, we'll walk it with you. For now."),
          L("narr", "In the main square, Morgan climbs onto a crate in front of thousands of frightened faces."),
          L("v_morgan", "You want to know who's been feeding you? That's Alexandrina, last of the Aslan line. Victoria's rightful heir. And she's been standing in your bread queues."),
          L("v_cador", "...So that's what Glasgow is now? Some noble's honour guard? I didn't bleed in these streets for a crown."),
          L("v_siege", "Cador. I never asked for one."),
          L("v_cador", "No. But you didn't say no, either.") ] },
        { id: "12-6", type: "chest", name: "Glasgow's Stash", reward: { lmd: 32000, rec4: 8, summ: 8, orundum: 200, permit: 1 }, pre: [
          L("v_morgan", "Glasgow's emergency stash. Well, my emergency stash, technically. Take it before I get sentimental.") ] },
        { id: "12-7", type: "side", name: "Borrowed Faces", lv: 109, bgm: "normal1", waves: [W({ op: "siege" }, { op: "morgan" }, "vspy")], pre: [
          L("narr", "Siege and Morgan walk out of the fog toward the Doctor. Neither of them blinks. Neither of them is breathing."),
          L("v_damazti", "We are the Damazti. We wear what we must. Show us what Rhodes Island does when its friends turn on it.") ], post: [
          L("v_damazti", "You struck them without hesitation, and yet you were careful with their faces. Interesting. Very interesting.") ] },
        { id: "12-8", type: "battle", name: "The Revenant Airship", lv: 110, bgm: "sss", waves: [W("vsoul", "vchaincaster", "vsoul", "vsoul"), W("vsoul", "vchaincaster", "vsoul", "vroyalguard", "vsoul")], pre: [
          L("narr", "Amiya and Ascalon slip aboard the Kazdel airship. Its engine is not an engine. It is a chorus: the souls of the Sarkaz dead, burning with millennia of rage."),
          L("amiya", "I'm Sarkaz too! Please, listen to me. I want to help you!"),
          L("narr", "The Revenants answer in a single voice: an Outblood cannot be their king."),
          L("v_ascalon", "They won't listen. Doctor, get her out of there.") ], post: [
          L("v_eblana", "Such a racket over the dead. Allow me."),
          L("narr", "Purple flame pours through the hull. It burns the Revenants back into silence, and then it keeps burning: out of the airship and down into Norport.") ] },
        { id: "12-9", type: "battle", name: "Norport Burns", lv: 110, bgm: "normal2", waves: [W("vheirbearer", "vbloodheir", "vchaincaster", "vbloodheir"), W("vbloodheir", "vroyalguard", "vheirbearer", "vchaincaster", "vbloodheir")], pre: [
          L("v_delphine", "Mother's landship! Windermere's banner, on the horizon! Get everyone to the docks!"),
          L("v_baird", "The Commission's trying to cut off the docks! Boss, go, I've got the stragglers!"),
          L("v_siege", "Baird, don't you dare play the hero!") ], post: [
          L("narr", "Baird does not reach the landship. Siege waits at the rail until the last refugee is aboard, and then the order comes to leave him."),
          L("v_siege", "...Go. Glasgow, we're going."),
          L("narr", "High above, Ines leaps from the airship's window with the signal already sent. W's shells and Hoederer's haze catch her before the Sarkaz can.") ] },
        { id: "12-10", type: "boss", name: "Damazti Cluster", lv: 111, bgm: "mephisto", mood: { pre: "tense", post: "warm" },
          waves: [W("vspy", "vspy", "vchaincaster", "vspy"), W("vdamazti", "vspy", "vspy", "vchaincaster")], pre: [
          L("v_damazti", "Amiya. We have worn a thousand faces looking for a reason to be. In you we see something new. A new Lord of Fiends."),
          L("amiya", "I'm nobody's lord! I just want people to stop dying!"),
          L("v_damazti", "Then answer us. What is the Damazti for? If you cannot, we will take you apart until we find out."),
          L("doctor", "Amiya, stay behind the line. We'll make them listen.") ], post: [
          L("v_logos", "You ask what you are for. Death, and then birth. Every Banshee knows it. Lay down what you are, and begin again."),
          L("v_damazti", "...Begin again. Yes. We would like that."),
          L("narr", "The whole Cluster goes quiet at once. That night, somewhere in Londinium, two infants are found crying in an empty room."),
          L("v_windermere", "My brave girl. Look at you, covered in soot. I've never been prouder."),
          L("narr", "Glasgow ends that night. Delphine returns to her mother, Cador walks away, and Morgan burns her journal at the landship's rail, one page at a time."),
          L("narr", "Elsewhere, Reunion's banner enters Londinium, and the Duke of Wellington orders his army to march in the name of Tara.") ] },
      ] },

    // ---------------- Episode 13 ----------------
    { id: "c13", title: "The Whirlpool that is Passion", env: "temple", map: "temple", reward: { op: "siege", orundum: 800, permit: 5 },
      nodes: [
        { id: "13-1", type: "story", name: "The Duchess's Last Order", mood: "lonely", pre: [
          L("narr", "Sarkaz infiltrators board Windermere's battleship in the night. The Duchess meets the Sanguinarch on her own deck, sword drawn."),
          L("v_windermere", "Delphine... don't cry. A duchess dies on her feet. I simply had to sit down at the end."),
          L("v_delphine", "Mother, please..."),
          L("narr", "In the same hour, the Confessarius Salus takes Amiya and vanishes into the old Sarkaz ruins. The Doctor goes after them."),
          L("v_logos", "Not alone, Doctor. Amiya carries the crown of Kazdel, and the Banshees do not abandon it. Ascalon, keep up."),
          L("v_ascalon", "I'm always up. You just never see me.") ] },
        { id: "13-2", type: "battle", name: "Ruins of the Teekaz", lv: 111, bgm: "normal1", waves: [W("vroyalguard", "vwitherer", "vheirbearer", "vsoul"), W("vwitherer", "vheirbearer", "vsoul", "vroyalguard", "vheirbearer")], pre: [
          L("narr", "The ruins are older than Victoria. Their altars are wet with blood that has not had time to dry."),
          L("v_logos", "Sarkaz soldiers, guarding the path. Salus has friends. Doctor, direct me. I will speak to them in the old tongue.") ], post: [
          L("v_logos", "These altars are not built of ordinary Originium. Someone has been brewing it in blood.") ] },
        { id: "13-3", type: "story", name: "Visions on the Altar", mood: "plot", pre: [
          L("narr", "Touch an altar and the world tilts. Seven thousand years fall away: ancient Teekaz kings, and a crown passed from hand to hand through slaughter."),
          L("w", "Hoederer, tell me you saw that too, or I'm shooting the altar."),
          L("v_hoederer", "I saw it. Kings feeding on kings. Someone wants to brew a new one out of this blood."),
          L("v_ines", "Then we find the pot and we break it."),
          L("narr", "At the deepest altar the Doctor finds Amiya: pale, unhurt, and furious. Salus is already gone."),
          L("amiya", "Doctor! I knew you'd come. Salus said things... about the crown, and about Nightingale. We have to warn Shining.") ] },
        { id: "13-4", type: "battle", name: "Hold Chetleigh", lv: 112, bgm: "sss", waves: [W("vheirbearer", "vchaincaster", "vbloodheir", "vchaincaster"), W("vbloodheir", "vheirbearer", "vchaincaster", "vdrone", "vheirbearer")], pre: [
          L("narr", "Windermere's army withdraws north and leaves its Infected soldiers and the refugees behind. Siege and Delphine refuse to leave with it."),
          L("v_delphine", "General Shearer called us deserters. I call us the only ones who stayed."),
          L("v_horn", "The Tempest Platoon is with you. Chetleigh is a small town, but it has walls. That's enough."),
          L("v_siege", "There's a Sarkaz witchcraft altar rolling this way. If it reaches the town, there won't be a town. Doctor, hold the line. I'll deal with the altar.") ], post: [
          L("narr", "Siege sets the charges on the altar herself and is nearly buried by the blast. When the dust clears, Victorian reinforcements are cresting the hill, and Chetleigh still stands.") ] },
        { id: "13-5", type: "story", name: "The Exemplars", mood: "warm", pre: [
          L("v_siege", "Before the War of the Four Nations there were the Exemplars. They answered to Victoria's people, not its lords. They were disbanded for it."),
          L("v_siege", "Tempest Platoon. Glasgow. Norport. Whoever you were before today: if you'll have me, we're the Exemplars now."),
          L("v_horn", "A unit nobody owns. I like it. Horn of the Exemplars, then."),
          L("v_delphine", "Count me in. Mother would have called it reckless. Then she'd have joined."),
          L("narr", "Far to the north, in a burning winery, Reunion's Guard stays behind in the fire so the others can escape with the suppressants. Nine carries his last question out of the smoke: should Reunion fight only for the Infected, or for everyone who is crushed?") ] },
        { id: "13-6", type: "side", name: "The Vampire's Lullaby", lv: 113, bgm: "normal2", waves: [W({ op: "nightingale" }, "vbloodheir", "vbloodheir", "vroyalguard", "vbloodheir")], pre: [
          L("v_quisartustaj", "Shining. Kal'tsit. Do not trouble yourselves to stand. I have come only for what is mine."),
          L("v_shining", "Nightingale, step back. ...Nightingale?"),
          L("v_quisartustaj", "She was always a vessel, healer. Now sleep, child, and defend your master."),
          L("kaltsit", "He's holding her with his Arts! Doctor, don't kill her. Break the hold.") ], post: [
          L("v_nightingale", "...Shining... I'm glad. I was a person, with you. Even if I was never meant to be..."),
          L("narr", "Before her eyes can clear, a second shadow swallows Nightingale whole. Qui'sartuštaj is gone, and so is she."),
          L("v_shining", "I will find her. Whatever the Confessarii are, they do not get to keep her.") ] },
        { id: "13-7", type: "chest", name: "The Winery Cellar", reward: { lmd: 36000, rec4: 10, chip: 5, orundum: 250 }, pre: [
          L("narr", "A crate left by the roadside, stamped with Reunion's mark: suppressants, field dressings, and a note that says only 'For everyone.'") ] },
        { id: "13-8", type: "battle", name: "Brentwood Basement", lv: 114, bgm: "sss", waves: [W("vbloodheir", "vwitherer", "vbloodheir", "vchaincaster"), W("vbloodheir", "vroyalguard", "vwitherer", "vbloodheir", "vbloodheir")], pre: [
          L("narr", "Under the town of Brentwood, in a basement the size of a cathedral, lies the skeleton of something impossible: a Feranmut, a beast that once walked through time. The Sarkaz call it the Lifebone."),
          L("v_hoederer", "Ulšulah. You were my comrade once. What have they made you guard?"),
          L("narr", "The altar wakes. The villagers chained around it twist and swell into eyeless, crawling things, 'blessed' with the Sanguinarch's blood."),
          L("w", "Well, that's disgusting. Doctor, let's make them stop moving.") ], post: [
          L("v_sanguinarch", "My gifts, wasted on peasants and mercenaries. Come up, then. Climb the bone, and meet your host.") ] },
        { id: "13-9", type: "battle", name: "Climbing the Lifebone", lv: 114, bgm: "normal1", waves: [W("vchaincaster", "vheirbearer", "vbloodheir", "vbloodheir"), W("vroyalguard", "vbloodheir", "vchaincaster", "vheirbearer", "vbloodheir")], pre: [
          L("narr", "The Exemplars, the Tempest Platoon and Logos break into the basement from above. W, Hoederer, Ines and Amiya climb the Lifebone itself, toward the light at its crown."),
          L("v_ines", "His blood-kin are all over the bone. W, left. Hoederer, right. Doctor, take the middle."),
          L("amiya", "I can feel him up there. Like a heartbeat that belongs to someone else.") ], post: [
          L("narr", "At the top of the Lifebone the world falls away. There is no up or down, only a dark like the first night of the universe, and a man in red waiting in it.") ] },
        { id: "13-10", type: "boss", name: "The Sanguinarch", lv: 115, bgm: "bossLungmen", mood: { pre: "tense", post: "plot" },
          waves: [W("vbloodheir", "vroyalguard", "vbloodheir", "vchaincaster"), W("vsanguinarch", "vbloodheir", "vbloodheir", "vroyalguard")], pre: [
          L("v_sanguinarch", "Duq'arael, Sanguinarch of the Sarkaz. Kneel, little Outblood. That crown is far too heavy for your neck."),
          L("amiya", "You killed Windermere. You turned a whole village into monsters. I'm not kneeling to you."),
          L("v_sanguinarch", "Then I'll drink the crown out of you, one drop at a time."),
          L("w", "Doctor, he's all yours. Well, ours. Try not to fall off the universe.") ], post: [
          L("narr", "Amiya draws on the black crown and speaks in the old Banshee way, and the blood in the Sanguinarch's veins turns against him."),
          L("v_sanguinarch", "That voice... the true Teekaz blood... in an Outblood? Curse you. Curse you all..."),
          L("narr", "He lunges once more, misses his footing, and falls into the dark between moments. He is still falling."),
          L("v_hoederer", "So the Lifebone has no master. I'll bet on us, then. Someone has to hold the reins."),
          L("kaltsit", "Doctor. His blood was cursed with original Originium, the source of Oripathy itself. The Regent was never after Londinium. He wants what the Shard can wake.") ] },
      ] },

    // ---------------- Episode 14 ----------------
    { id: "c14", title: "Absolved Will Be the Seekers", env: "core", map: "core", reward: { op: "logos", orundum: 900, permit: 6 },
      nodes: [
        { id: "14-1", type: "story", name: "Under a Crystal Sky", mood: "tense", pre: [
          L("narr", "The Lifebone flies for a day and a night. Then its link snaps, and it comes down hard in the mountains."),
          L("narr", "Over Victoria, the Shard opens. Originium falls like rain, and wherever it lands, crystal mountains grow."),
          L("kaltsit", "The Confessarii have finished the Blood of Teekaz. They are calling down Amnannam, the Cunabula of Suffering. The first Catastrophe."),
          L("doctor", "Then we split up. Siege takes the Exemplars to Silverrock Bluffs. Hoederer, W and Ines hold the Lifebone. Amiya, Kal'tsit, Logos and I go for the altar."),
          L("amiya", "Doctor... whatever happens up there, we come back together. Promise me."),
          L("doctor", "I promise.") ] },
        { id: "14-2", type: "battle", name: "Redmane Pass", lv: 115, bgm: "normal2", waves: [W("vchimera", "vwitherer", "vchimera", "acidslug"), W("vchimera", "vwitherer", "vsoul", "vchimera", "vwitherer")], pre: [
          L("v_logos", "The Redmane Mountains. The Originium rain has woken everything sleeping in the rock."),
          L("amiya", "Those slugs are eating the stone itself! And something bigger behind them... with too many heads.") ], post: [
          L("v_logos", "Chimeras. The Confessarii's handiwork. Every one of them was a Sarkaz once.") ] },
        { id: "14-3", type: "story", name: "Hoederer's Wager", mood: "frostnovadie", pre: [
          L("v_hoederer", "Manfred's camp is light tonight. One knife in the right tent and the Commission loses its head."),
          L("v_ascalon", "...Hoederer, wait. That isn't Manfred in the tent. It's a Damazti wearing his face."),
          L("v_manfred", "Correct. The real one is behind you."),
          L("narr", "Manfred's blade finds Hoederer before anyone can move. W's shot comes a heartbeat too late."),
          L("v_hoederer", "W... Ines... I lost the bet. Hold the bone. Don't let him have it."),
          L("v_ines", "Hoederer. Hoederer! ...Damn you. You never could fold a hand.") ] },
        { id: "14-4", type: "battle", name: "Hold the Lifebone", lv: 116, bgm: "sss", waves: [W("vroyalguard", "vheirbearer", "vdrone", "vchaincaster"), W("vheirbearer", "vchaincaster", "vroyalguard", "vdrone", "vheirbearer")], pre: [
          L("w", "Commission soldiers all the way down the ridge. They want the bone back. They can't have it."),
          L("v_ines", "For Hoederer, then. Doctor, if you're still on the comms, give us everything you've got.") ], post: [
          L("narr", "They hold for an hour. Then two. Then the Commission's numbers tell, and the Lifebone falls into Manfred's hands."),
          L("w", "Fine. Keep it warm for me, Manfred. I'm coming back for it.") ] },
        { id: "14-5", type: "battle", name: "Silverrock Bluffs", lv: 117, bgm: "normal1", waves: [W("vwitherer", "vsoul", "vchimera", "acidslug"), W("vchimera", "vwitherer", "vsoul", "vroyalguard", "vsoul")], pre: [
          L("narr", "The Exemplars reach the Duke of Caster's lines. The Stone of the Sword waits aboard his flagship, the Gloriana, as Nachzehrer troops and Eblana's burning dead pour across the plain."),
          L("v_siege", "Bagpipe! You're alive!"),
          L("v_bagpipe", "Alive and late, as usual! And the Duke of Gododdin's riders are right behind me!"),
          L("narr", "Then the Duke of Wellington's battleship breaks formation, and Nezzsalem, King of the Nachzehrers, tears the Gloriana apart with a wave of Originium.") ], post: [
          L("narr", "Out of the smoke rides the knight from the tomb, Charles Lynch, the Last Steam Knight, carving through the Sarkaz lines. Sir Bellingham pulls the Stone of the Sword from the wreck and throws it to Siege."),
          L("v_siege", "Victoria. If you're still in there somewhere, wake up."),
          L("narr", "The blade slides into the stone. Golden light rolls across the plain, and the Originium turns to dust wherever it touches.") ] },
        { id: "14-6", type: "chest", name: "Wreck of the Gloriana", reward: { lmd: 40000, rec4: 10, summ: 10, chip: 5, orundum: 300, permit: 1 }, pre: [
          L("v_bagpipe", "The Gloriana's stores! Most of it's on fire, but the bits that aren't are all ours.") ] },
        { id: "14-7", type: "battle", name: "The Blood of Teekaz", lv: 118, bgm: "normal2", waves: [W("vchimera", "vsoul", "vchaincaster", "vwitherer"), W("vchimera", "vwitherer", "vsoul", "acidslug", "vchaincaster")], pre: [
          L("narr", "At the summit, the Blood of Teekaz altar pulses like a heart. Chimeras and the Nachzehrers' dead stand between it and Rhodes Island."),
          L("v_nezzsalem", "Logos. The Banshees always arrive with their bells, just in time to mourn."),
          L("v_logos", "Nezzsalem. Then let me ring one for you. Doctor, the soldiers are yours. The King is mine.") ], post: [
          L("narr", "Logos rings his death knell and speaks his full incantation. It is not enough. The Nachzehrer King strikes him from the cliff, and Logos falls out of sight."),
          L("amiya", "Logos!"),
          L("narr", "Red branches burst from the Shard: the ritual is complete. Then the sky darkens again, and something vast and skeletal comes roaring over the ridge."),
          L("w", "Somebody call for a lift? Hold on to something! I've never flown one of these!") ] },
        { id: "14-8", type: "side", name: "Phantoms of Babel", lv: 118, bgm: "sss", waves: [W("vspy", "vsoul", "vbloodheir", "vsoul", "vspy"), W("vsoul", "vspy", "vsoul", "vchaincaster", "vbloodheir")], pre: [
          L("narr", "W rams the Lifebone into the Commission airship climbing toward Amnannam. Inside, shadows peel off the walls and take the shapes of old enemies."),
          L("w", "Oh, I know these faces. The assassins who came for Theresa, back at Babel. Doctor, you and me. Let's kill them again.") ], post: [
          L("w", "Ghosts don't bleed. Shame. I was in the mood.") ] },
        { id: "14-9", type: "battle", name: "The Kindling Revenant", lv: 119, bgm: "yeti", waves: [W("vsoul", "vchimera", "acidslug", "vwitherer"), W("vrevenant", "vsoul", "vchimera", "vsoul")], pre: [
          L("narr", "At the airship's core burns the Revenant: rage given a body, sacrificed millennia ago when the first King of Sarkaz called Amnannam down."),
          L("amiya", "I can read it... It was a person. Many people. They gave everything, and nobody ever told them it was over."),
          L("kaltsit", "Amiya, chain it. W, the core is inside its shadow."),
          L("w", "Inside the giant burning ghost. Of course it is.") ], post: [
          L("narr", "Amiya's chains hold. W reaches into the Revenant's shadow with her bare hands and tears the core out."),
          L("v_revenant", "...Ask your Regent... how Theresa died... It was arranged... all of it..."),
          L("doctor", "...What?"),
          L("narr", "The airship burns and climbs anyway, toward Amnannam. Logos staggers aboard at the last moment, saved by his mother's charm, as Originium swallows everything.") ] },
        { id: "14-10", type: "story", name: "The Golden Sea", mood: "lonely", pre: [
          L("narr", "The Doctor wakes on Rhodes Island. Ace is checking his gear. Outcast is polishing her revolver. FrostNova nods from the end of the corridor."),
          L("kaltsit", "Doctor. Look at me. None of this is real. Your mind is holding the Originium back by building the things you want."),
          L("doctor", "...I know. I just wanted to see them a little longer."),
          L("narr", "Beyond the dream lies a golden sea, where information pools like water. In its centre a tower grows like a tree, without end: the Tower of Babel."),
          L("amiya", "Logos is holding back the myriad souls. He told us to climb. Doctor, she's at the top. I know she is.") ] },
        { id: "14-11", type: "boss", name: "Theresa", lv: 120, bgm: "frostnova", mood: { pre: "tense", post: "frostnovadie" },
          waves: [W("vsoul", "vsoul", "vchimera", "acidslug"), W("vtheresa", "vsoul", "vsoul")], pre: [
          L("v_theresa", "Amiya. Kal'tsit. W. And you, Doctor. You came all this way. Sit with me a while."),
          L("v_theresa", "With Amnannam I can command Originium itself. I can free every Sarkaz soul chained inside it and end their grief forever."),
          L("amiya", "And who uses that power after you? It never stops with the Sarkaz. It never stops! That isn't what you taught me!"),
          L("v_theresa", "Then show me. A crown isn't inherited, Amiya. It's earned. This is your trial.") ], post: [
          L("narr", "In the Civilight Eterna, Amiya walks through Theresa's memories: wars she never wanted, friends she had to kill, a people she could not unite. Amiya accepts the crown anyway."),
          L("v_theresa", "White fire, burning the old rot away. Good. The myriad souls can rest now, and someone has to walk them home."),
          L("v_theresa", "Amiya, you've grown so tall. Kal'tsit, thank you for every year. W... your name is Wiš'adel now. It means a wish for home."),
          L("w", "...You always did know how to make me cry, Your Highness."),
          L("v_theresa", "Doctor. You're no longer the Evil Spirit of Babel. Take care of them. And stop my brother. He has Amnannam now."),
          L("narr", "The airship falls out of the golden sea. Amiya lands it with every scrap of Arts she has, and over Victoria, the Shard goes dark."),
          L("v_theresis", "Sister. I will finish what you began, whether the world forgives me or not."),
          L("narr", "End of Part 2. To be continued.") ] },
      ] },
  ],
});
