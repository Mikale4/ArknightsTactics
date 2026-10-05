
// =====================================================================
//  BATTLE ENGINE — turn meters (Speed decides how often a Pokémon moves), the main-series damage formula
//  (STAB, type matchups, critical hits, accuracy, spread moves), status conditions, stat stages, weather,
//  Abilities and held items. It emits events (and battle text) for the battle director.
// =====================================================================
let UID = 0;
const DMG_SCALE = .62;   // squad battles last longer than one-on-one ones: every hit is scaled down
const FLINCH_TM = .4;    // a flinch costs 40% turn meter
function makeBattle(cfg) {
  const B = { units: [], ev: [], wave: 0, waves: cfg.waves, over: false, result: null, turn: 0, allyTurns: 0, actor: null, waiting: null,
    tally: { crits: 0, kills: 0, payday: 0, superEff: 0 }, auto: !!cfg.auto, aiStyle: cfg.aiStyle || "balanced", weather: cfg.weather || null,
    depth: 0, pendingWave: false, allyCount: cfg.allies.length, dmgDone: {}, avgL: 10, trainer: cfg.trainer || null, wild: !!cfg.wild };
  const ev = e => B.ev.push(e);
  const msg = (t, extra) => ev({ k: "msg", t, ...(extra || {}) });
  const has = (u, id) => u.eff.some(e => e.id === id);
  const effOf = (u, id) => u.eff.find(e => e.id === id);
  const allies = u => B.units.filter(x => x.team === u.team && x.alive);
  const enemies = u => B.units.filter(x => x.team !== u.team && x.alive);
  const pv = (u, id) => u.passives.find(p => p.id === id);
  const item = (u, k) => u.held === k && !u.flags.itemUsed;
  // "the opposing Onix" mid-sentence, "The opposing Onix" at the start of one
  const nm = u => (u.team === "E" ? (B.wild ? "the wild " : "the opposing ") : "") + u.n;
  const Nm = u => { const s = nm(u); return s.charAt(0).toUpperCase() + s.slice(1); };
  const fxEv = u => {
    const list = [];
    if (u.status) list.push([u.status, 0]);
    for (const e of u.eff) list.push([e.id, e.turns]);
    ev({ k: "fx", u: u.uid, list, sh: u.shield, stages: { ...u.stages }, st: u.status });
  };

  // ---------- units ----------
  const newStages = () => ({ atk: 0, def: 0, spa: 0, sdf: 0, spe: 0, acc: 0, eva: 0 });
  function buildUnit(spec, team, slot) {
    const def = OPS[spec.op], prog = spec.prog || progForLV(spec.op, spec.LV);
    const { st } = opStats(spec.op, prog, team === "A" && !!spec.prog);
    if (spec.hpX) st.hp = Math.round(st.hp * spec.hpX);
    const u = { uid: ++UID, key: spec.op, spr: spec.op, def, isOp: true, team, slot, n: def.n, types: def.types.slice(), el: def.types[0], cls: def.cls,
      lvl: prog.lvl, boss: !!spec.boss, max: st, hp: st.hp, shield: 0, atb: 0, stages: newStages(), status: null, sTurn: 0, eff: [],
      cool: { 1: 0, 2: 0, 3: 0 }, skills: spec.moves ? spec.moves.map((k, i) => makeSkill(k, i + 1)) : def.skills, sk: prog.sk.slice(), passives: def.passives.slice(), held: prog.held || spec.held || null,
      flags: {}, alive: true, lastSkill: null };
    if (u.skills[2]) u.cool[3] = u.skills[2].cd0 || 0;
    return u;
  }
  function startEffects(list) {
    for (const u of list) {
      const foes = enemies(u);
      for (const p of u.passives) {
        if (p.id === "INTIMIDATE") { msg(`${Nm(u)}'s Intimidate!`); for (const f of foes) { if (pv(f, "INNER_FOCUS")) { msg(`${Nm(f)}'s Inner Focus kept it from being intimidated!`); continue; } stage(u, f, "atk", -1); } }
        else if (p.id === "DOWNLOAD") { const d = foes.reduce((a, f) => a + f.max.def, 0), s = foes.reduce((a, f) => a + f.max.sdf, 0); stage(u, u, d < s ? "atk" : "spa", 1, "Download"); }
        else if (p.id === "ARENA_TRAP") { msg(`${Nm(u)}'s Arena Trap! The opposing team can't get away!`); for (const f of foes) f.atb = 0; }
        else if (p.id === "RUN_AWAY") u.atb = clamp(u.atb + 25, 0, 100);
        else if (p.id === "IMPOSTER" && foes.length) transform(u, foes.slice().sort((a, b) => cpOf(b.max) - cpOf(a.max))[0], true);
      }
    }
  }
  function spawnWave(w) {
    B.wave = w;
    const list = B.waves[w].map((s, i) => buildUnit(s, "E", i));
    B.units.push(...list);
    for (const u of list) { u.atb = R() * 10; dexSee(u.key); }
    ev({ k: "wave", w, units: list.map(x => x.uid) });
    return list;
  }

  // ---------- stats ----------
  const inWeather = w => B.weather === w && !B.units.some(x => x.alive && x.flags.cloud);
  function statOf(u, s, ignoreStage) {
    let v = u.max[s] * (ignoreStage ? 1 : stageMult(u.stages[s]));
    if (s === "atk") {
      if (pv(u, "HUSTLE")) v *= 1.5;
      if (pv(u, "GUTS") && u.status) v *= 1.5;
      if (item(u, "choiceband")) v *= 1.5;
      if (item(u, "lightball") && u.key === "pikachu") v *= 2;
      if (item(u, "thickclub") && (u.key === "cubone" || u.key === "marowak")) v *= 2;
    } else if (s === "spa") {
      if (item(u, "choicespecs")) v *= 1.5;
      if (item(u, "lightball") && u.key === "pikachu") v *= 2;
      if (pv(u, "SOLAR") && inWeather("sun")) v *= 1.5;
    } else if (s === "def") {
      if (pv(u, "MARVEL") && u.status) v *= 1.5;
      if (item(u, "eviolite") && canEvolve(u.key)) v *= 1.5;
      if (item(u, "metalpowder") && u.key === "ditto" && !u.flags.transformed) v *= 2;
    } else if (s === "sdf") {
      if (item(u, "assaultvest")) v *= 1.5;
      if (item(u, "eviolite") && canEvolve(u.key)) v *= 1.5;
      if (inWeather("sand") && u.types.includes("Rock")) v *= 1.5;
    } else if (s === "spe") {
      if (item(u, "choicescarf")) v *= 1.5;
      if (u.status === "PAR") v *= .5;
      const ws = pv(u, "WSPEED"); if (ws && inWeather(ws.w)) v *= 2;
    }
    return v;
  }
  // turn-meter tempo: Speed relative to the battle's average level, so it matters at Lv 5 as much as at Lv 70
  const effSpd = u => 70 + .45 * statOf(u, "spe") * 50 / Math.max(5, B.avgL);
  const critStage = (u, sk) => (has(u, "FOCUS") ? 2 : 0) + (sk && sk.M.cr ? 1 : 0) + (item(u, "scopelens") ? 1 : 0) + ((item(u, "luckypunch") && u.key === "chansey") || (item(u, "leek") && u.key === "farfetchd") ? 2 : 0);
  const critChance = n => [1 / 24, 1 / 8, 1 / 2, 1][clamp(n, 0, 3)];
  const mastery = (u, sk) => 1 + .06 * ((u.sk[sk.slot - 1] || 1) - 1);
  const cdOf = (u, sk) => Math.max(0, (sk.cd || 0) - ((u.sk[sk.slot - 1] || 1) >= MAX_SK && sk.slot > 1 ? 1 : 0));

  // ---------- conditions ----------
  function addEff(u, id, turns, src, quiet) {
    if (!u.alive) return;
    const ex = effOf(u, id);
    if (ex) { ex.turns = Math.max(ex.turns, turns); ex.skip = u === B.actor; }
    else u.eff.push({ id, turns, skip: u === B.actor, src: src && src.uid });
    if (!quiet) ev({ k: "txt", u: u.uid, s: FX[id].n, c: FX[id].b ? "buff" : "debuff" });
    fxEv(u);
  }
  function removeEff(u, id) { const n = u.eff.length; u.eff = u.eff.filter(e => e.id !== id); if (id === "SUB") u.shield = 0; if (n !== u.eff.length) fxEv(u); }
  const STATUS_TXT = { BRN: "was burned!", PSN: "was poisoned!", TOX: "was badly poisoned!", PAR: "is paralyzed! It may be unable to move!", SLP: "fell asleep!", FRZ: "was frozen solid!",
    CNF: "became confused!", INFAT: "fell in love!", SEED: "was seeded!", TRAP: "was squeezed and bound!", DISABLE: "had its S2 and S3 moves disabled!" };
  const TYPE_IMMUNE = { BRN: "Fire", PSN: "Poison", TOX: "Poison", PAR: "Electric", FRZ: "Ice", SEED: "Grass" };
  // tries to give a status condition or volatile condition; `loud` reports failures (for status moves)
  function tryStatus(src, tar, what, loud, opts = {}) {
    if (!tar.alive) return false;
    if (what === "SPORE") what = pick(["PSN", "PAR", "SLP"]);
    const fail = t => { if (loud) msg(t || "But it failed!"); return false; };
    const major = MAJOR.includes(what);
    if (major && tar.status) return fail(loud && tar.status === what ? `${Nm(tar)} is already ${{ BRN: "burned", PSN: "poisoned", TOX: "poisoned", PAR: "paralyzed", SLP: "asleep", FRZ: "frozen" }[what]}!` : null);
    if (!major && has(tar, what)) return fail();
    if (TYPE_IMMUNE[what] && tar.types.includes(TYPE_IMMUNE[what])) return fail(`It doesn't affect ${nm(tar)}...`);
    if (what === "FRZ" && inWeather("sun")) return false;
    const ns = pv(tar, "NO_STATUS"); if (ns && ns.list.includes(what)) return fail(`${Nm(tar)}'s ${tar.passives[0].name} prevents it!`);
    if (tar.shield > 0 && src !== tar && src.team !== tar.team && !opts.sound && !pv(src, "INFILTRATOR") && opts.direct) return fail();
    if (what === "SLP" || what === "FRZ") { /* no extra checks */ }
    if (major) {
      tar.status = what;
      tar.sTurn = what === "SLP" ? (opts.turns || ri(1, 3)) : what === "TOX" ? 1 : what === "FRZ" ? 3 : 0;
      if (what === "SLP" && pv(tar, "EARLY_BIRD")) tar.sTurn = Math.ceil(tar.sTurn / 2);
      ev({ k: "status", u: tar.uid, s: what }); msg(`${Nm(tar)} ${STATUS_TXT[what]}`);
      fxEv(tar);
      if (pv(tar, "SYNC") && src && src !== tar && src.alive && ["BRN", "PSN", "TOX", "PAR"].includes(what)) { msg(`${Nm(tar)}'s Synchronize!`); tryStatus(tar, src, what === "TOX" ? "PSN" : what, false); }
    } else {
      const turns = { CNF: ri(2, 4), INFAT: 3, SEED: 99, TRAP: ri(2, 4), DISABLE: 2 }[what] || 2;
      tar.eff.push({ id: what, turns, skip: tar === B.actor, src: src && src.uid });
      msg(`${Nm(tar)} ${STATUS_TXT[what]}`); fxEv(tar);
    }
    if (item(tar, "lumberry")) { tar.flags.itemUsed = true; msg(`${Nm(tar)}'s Lum Berry cured it!`); cureAll(tar); }
    return true;
  }
  function cureAll(u) { u.status = null; u.sTurn = 0; u.eff = u.eff.filter(e => !["CNF", "INFAT"].includes(e.id)); fxEv(u); }
  // stat stages; returns true if anything changed
  function stage(src, tar, s, n, why) {
    if (!tar.alive) return false;
    if (n < 0 && src !== tar) {
      if (has(tar, "MIST")) { msg(`${Nm(tar)} is protected by the mist!`); return false; }
      const nd = pv(tar, "NO_DROP"); if (nd && (nd.stats === "all" || nd.stats === s)) { msg(`${Nm(tar)}'s ${tar.passives[0].name} prevents its ${STAGE_N[s]} from being lowered!`); return false; }
    }
    const old = tar.stages[s], v = clamp(old + n, -6, 6);
    if (v === old) { msg(`${Nm(tar)}'s ${STAGE_N[s]} won't go any ${n > 0 ? "higher" : "lower"}!`); return false; }
    tar.stages[s] = v;
    msg(`${why ? Nm(tar) + "'s " + why + " raised its " : Nm(tar) + "'s "}${STAGE_N[s]} ${why ? "!" : STAGE_WORD(v - old)}`);
    ev({ k: "txt", u: tar.uid, s: `${STAGE_S[s]} ${v - old > 0 ? "▲" : "▼"}${Math.abs(v - old) > 1 ? Math.abs(v - old) : ""}`, c: v > old ? "buff" : "debuff" });
    fxEv(tar);
    if (n < 0 && src !== tar && src.team !== tar.team) { const df = pv(tar, "DEFIANT"); if (df) stage(tar, tar, df.stat, 2, tar.passives[0].name); }
    return true;
  }
  function addATB(u, amount, quiet) {
    if (!u.alive) return;
    u.atb = clamp(u.atb + amount * 100, 0, 100);
    ev({ k: "tm", u: u.uid, tm: u.atb, v: amount * 100, quiet });
  }
  function heal(u, n, why) {
    if (!u.alive || n <= 0) return 0;
    const g = Math.min(Math.round(n), u.max.hp - u.hp); if (g <= 0) return 0;
    u.hp += g; ev({ k: "heal", u: u.uid, n: g, hp: u.hp, sh: u.shield });
    if (why) msg(why);
    return g;
  }
  // indirect damage (poison, weather, recoil...) — Magic Guard ignores it
  function chip(u, n, why) {
    if (!u.alive || pv(u, "MAGIC_GUARD")) return;
    if (why) msg(why);
    applyDamage(null, u, Math.max(1, Math.floor(n)), { trueDmg: true });
  }
  function revive(u, pct) {
    if (!u || u.alive) return;
    u.alive = true; u.hp = Math.max(1, Math.round(u.max.hp * pct)); u.eff = []; u.status = null; u.shield = 0; u.atb = 0; u.stages = newStages();
    ev({ k: "revive", u: u.uid, hp: u.hp });
  }

  // ---------- damage ----------
  function kill(u, killer) {
    u.alive = false; u.hp = 0; u.eff = []; u.shield = 0; u.atb = 0; u.status = null;
    if (u.team === "E") B.tally.kills++;
    ev({ k: "death", u: u.uid }); msg(`${Nm(u)} fainted!`);
    if (killer && killer.alive && killer !== u && pv(killer, "MOXIE")) stage(killer, killer, "atk", 1, "Moxie");
  }
  function applyDamage(att, tar, dmg, meta) {
    if (!tar.alive) return 0;
    let dealt = dmg;
    if (!meta.trueDmg && tar.shield > 0 && !meta.bypassSub) {
      const soak = Math.min(tar.shield, dealt); tar.shield -= soak; dealt -= soak;
      ev({ k: "dmg", u: tar.uid, n: soak, hp: tar.hp, sh: tar.shield, sub: 1 });
      if (tar.shield <= 0) { tar.shield = 0; removeEff(tar, "SUB"); msg(`${Nm(tar)}'s substitute faded!`); } else msg(`The substitute took damage for ${nm(tar)}!`);
      return 0;
    }
    // Sturdy and Focus Band hold on with 1 HP
    if (!meta.trueDmg && dealt >= tar.hp) {
      if (pv(tar, "STURDY") && tar.hp === tar.max.hp && !tar.flags.sturdyUsed) { dealt = tar.hp - 1; tar.flags.sturdyUsed = true; meta.endure = `${Nm(tar)} endured the hit thanks to Sturdy!`; }
      else if (item(tar, "focusband") && R() < .1) { dealt = tar.hp - 1; meta.endure = `${Nm(tar)} hung on using its Focus Band!`; }
    }
    tar.hp -= dealt;
    ev({ k: "dmg", u: tar.uid, n: dealt, crit: !!meta.crit, hp: Math.max(0, tar.hp), sh: tar.shield, dot: !!meta.trueDmg, eff: meta.eff });
    if (meta.endure) msg(meta.endure);
    if (att) B.dmgDone[att.uid] = (B.dmgDone[att.uid] || 0) + dealt;
    if (tar.hp <= 0) kill(tar, att);
    else if (item(tar, "sitrusberry") && tar.hp < tar.max.hp / 2) { tar.flags.itemUsed = true; heal(tar, tar.max.hp / 4, `${Nm(tar)} restored its HP using its Sitrus Berry!`); }
    return dealt;
  }
  // multiplier from type matchups, with Scrappy and Levitate
  function effOn(att, tar, sk) {
    if (sk.M.t === "Ground" && pv(tar, "IMMUNE_TYPE")) return 0;
    let e = typeEff(sk.M.t, tar.types);
    if (e === 0 && pv(att, "SCRAPPY") && (sk.M.t === "Normal" || sk.M.t === "Fighting") && tar.types.includes("Ghost")) e = typeEff(sk.M.t, tar.types.filter(t => t !== "Ghost"));
    return e;
  }
  const FIXED = { dragonrage: () => 40, sonicboom: () => 20, nightshade: u => u.lvl, seismictoss: u => u.lvl, psywave: u => Math.max(1, Math.floor(u.lvl * (.5 + R()))) };
  function damageOf(att, tar, sk, opts = {}) {
    const M = sk.M, e = effOn(att, tar, sk);
    if (e === 0) return { dmg: 0, e: 0 };
    // fixed damage ignores stats, type effectiveness (immunities aside) and boosts, but Mastery still adds its 6% per rank
    if (M.sp === "superfang") return { dmg: Math.max(1, Math.floor(tar.hp / 2 * (tar.boss ? .5 : 1) * mastery(att, sk))), e: 1 };
    if (FIXED[M.sp]) return { dmg: Math.max(1, Math.round(FIXED[M.sp](att) * DMG_SCALE * 1.5 * mastery(att, sk))), e: 1 };
    const crit = opts.crit, phys = M.c === "P";
    let pow = (sk.weight ? [[100, 20], [250, 40], [500, 60], [1000, 80], [2000, 100], [1e9, 120]].find(([w]) => (OPS[tar.key] || OPS[tar.spr]).w < w)[1] : sk.pow) * mastery(att, sk);
    if (pv(att, "TECHNICIAN") && sk.pow <= 60) pow *= 1.5;
    if (pv(att, "IRON_FIST") && M.pu) pow *= 1.2;
    if (pv(att, "RECKLESS") && M.dr < 0) pow *= 1.2;
    if (pv(att, "SHEER_FORCE") && (M.ail || M.fl || (M.st && M.sw !== "self"))) pow *= 1.3;
    const pin = pv(att, "PINCH"); if (pin && pin.type === M.t && att.hp < att.max.hp / 3) pow *= 1.5;
    if (has(att, "FLASHFIRE") && M.t === "Fire") pow *= 1.5;
    const H = HELD[att.held]; if (H && H.boost === M.t && !att.flags.itemUsed) pow *= 1.2;
    let A = statOf(att, phys ? "atk" : "spa"), D = statOf(tar, phys ? "def" : "sdf");
    if (crit) { A = Math.max(A, statOf(att, phys ? "atk" : "spa", true)); D = Math.min(D, statOf(tar, phys ? "def" : "sdf", true)); }
    let d = ((2 * att.lvl / 5 + 2) * pow * A / Math.max(1, D)) / 50 + 2;
    if (sk.target === "aoe_enemies") d *= SPREAD;
    if (inWeather("rain")) d *= M.t === "Water" ? 1.5 : M.t === "Fire" ? .5 : 1;
    if (inWeather("sun")) d *= M.t === "Fire" ? 1.5 : M.t === "Water" ? .5 : 1;
    if (crit) d *= pv(att, "SNIPER") ? 2.25 : 1.5;
    d *= opts.roll == null ? .85 + R() * .15 : opts.roll;
    if (att.types.includes(M.t)) d *= pv(att, "ADAPT") ? 2 : 1.5;
    d *= e;
    if (phys && att.status === "BRN" && !pv(att, "GUTS")) d *= .5;
    if (!crit && !pv(att, "INFILTRATOR") && has(tar, phys ? "REFLECT" : "LSCREEN")) d *= 2 / 3;
    const rs = pv(tar, "RESIST"); if (rs && rs.types.includes(M.t)) d *= .5;
    if (pv(tar, "MULTISCALE") && tar.hp === tar.max.hp) d *= .5;
    if (pv(tar, "FILTER") && e > 1) d *= .75;
    if (pv(att, "TINTED") && e < 1) d *= 2;
    if (item(att, "expertbelt") && e > 1) d *= 1.2;
    if (item(att, "lifeorb")) d *= 1.3;
    if (item(att, phys ? "muscleband" : "wiseglasses")) d *= 1.1;
    if (allies(tar).some(a => a !== tar && pv(a, "FRIEND_GUARD"))) d *= .75;
    return { dmg: Math.max(1, Math.round(d * DMG_SCALE)), e };
  }
  function accOf(att, tar, sk) {
    const M = sk.M;
    if (!M.a || sk.target === "self" || sk.target === "team") return 1;
    if (pv(att, "NO_GUARD") || pv(tar, "NO_GUARD")) return 1;
    if (M.sp === "fissure" || M.sp === "horndrill" || M.sp === "guillotine") return .3;
    if ((M.n === "Thunder" && inWeather("rain")) || (M.n === "Blizzard" && inWeather("hail"))) return 1;
    let eva = tar.stages.eva; const we = pv(tar, "WEVA"); if (we && inWeather(we.w)) eva += 1;
    let a = M.a / 100 * stageMult(clamp(att.stages.acc - eva, -6, 6), true);
    const ac = pv(att, "ACC"); if (ac) a *= ac.amount;
    if (pv(att, "HUSTLE") && M.c === "P") a *= .8;
    if (item(att, "widelens")) a *= 1.1;
    if (item(tar, "brightpowder")) a *= .9;
    return clamp(a, 0, 1);
  }
  // what the AI and the target hints expect a move to do to a target (average damage, accuracy included)
  function expectedDamage(att, tar, sk) {
    if (!sk || !(sk.pow > 0 || FIXED[sk.M.sp] || sk.M.sp === "superfang") || !tar || !tar.alive) return 0;
    if (sk.M.sp === "dreameater" && tar.status !== "SLP") return 0;
    if (absorbs(tar, sk)) return -1;
    const pc = critChance(critStage(att, sk));
    const hits = sk.hits ? (pv(att, "SKILL_LINK") ? sk.hits[1] : (sk.hits[0] + sk.hits[1]) / 2) : 1;
    const nc = damageOf(att, tar, sk, { roll: .925 }).dmg, cr = damageOf(att, tar, sk, { roll: .925, crit: true }).dmg;
    return Math.round(((1 - pc) * nc + pc * cr) * hits * accOf(att, tar, sk));
  }
  const absorbs = (tar, sk) => { const a = pv(tar, "ABSORB"); return (a && a.type === sk.M.t) || (sk.M.t === "Fire" && pv(tar, "FLASH_FIRE")) || (sk.M.t === "Electric" && pv(tar, "ROD")); };
  function attackOnce(att, tar, sk, first) {
    if (!att.alive || !tar.alive) return { dealt: 0 };
    const M = sk.M;
    // abilities that soak up a move's type
    if (absorbs(tar, sk)) {
      const a = pv(tar, "ABSORB");
      if (a) { if (!heal(tar, tar.max.hp / 4, `${Nm(tar)} restored HP using its ${tar.passives[0].name}!`)) msg(`It doesn't affect ${nm(tar)}...`); }
      else if (pv(tar, "FLASH_FIRE")) { addEff(tar, "FLASHFIRE", 99, tar, true); msg(`${Nm(tar)}'s Flash Fire powered up its Fire-type moves!`); }
      else { msg(`${Nm(tar)}'s Lightning Rod took the attack!`); stage(tar, tar, "spa", 1); }
      return { dealt: 0, absorbed: true };
    }
    const cs = critStage(att, sk), noCrit = pv(tar, "NO_CRIT");
    const crit = !noCrit && !FIXED[M.sp] && M.sp !== "superfang" && R() < critChance(cs);
    const r = damageOf(att, tar, sk, { crit });
    if (r.e === 0) { msg(`It doesn't affect ${nm(tar)}...`); return { dealt: 0, immune: true }; }
    const bypassSub = !!M.so || pv(att, "INFILTRATOR");
    const dealt = applyDamage(att, tar, r.dmg, { crit, eff: r.e, bypassSub });
    if (crit) { msg("A critical hit!"); B.tally.crits++; if (tar.alive && pv(tar, "ANGER") && tar.stages.atk < 6) { tar.stages.atk = 6; msg(`${Nm(tar)}'s Anger Point maxed its Attack!`); fxEv(tar); } }
    if (M.t === "Fire" && tar.status === "FRZ" && tar.alive) { tar.status = null; msg(`${Nm(tar)} thawed out!`); fxEv(tar); }
    // contact abilities and on-hit reactions
    if (tar.alive && att.alive && dealt > 0 && M.ct) {
      const ca = pv(tar, "CONTACT"); if (ca && R() < ca.chance) { msg(`${Nm(tar)}'s ${tar.passives[0].name}!`); tryStatus(tar, att, ca.what, false); }
      if (pv(att, "TOUCH") && R() < .3) tryStatus(att, tar, "PSN", false);
    }
    if (tar.alive && dealt > 0 && M.c === "P" && pv(tar, "WEAK_ARMOR")) { stage(tar, tar, "def", -1); stage(tar, tar, "spe", 2); }
    if (tar.alive && dealt > 0 && (M.t === "Bug" || M.t === "Ghost") && pv(tar, "RATTLED")) stage(tar, tar, "spe", 1, "Rattled");
    if (tar.alive && att.alive && dealt > 0 && pv(tar, "CURSED") && R() < .3 && !has(att, "DISABLE")) { msg(`${Nm(tar)}'s Cursed Body!`); tryStatus(tar, att, "DISABLE", false); }
    return { dealt, crit, e: r.e };
  }
  // added effects of a damaging move on one target (status, flinch, stat drops)
  function secondary(att, tar, sk) {
    const M = sk.M;
    if (!tar.alive || pv(tar, "SHIELD_DUST") || pv(att, "SHEER_FORCE")) return;
    const sg = pv(att, "SERENE") ? 2 : 1;
    if (M.ail && R() < M.ac / 100 * sg) tryStatus(att, tar, M.ail, false);
    const fl = M.fl || (item(att, "kingsrock") || pv(att, "STENCH") ? 10 : 0);
    if (fl && R() < fl / 100 * sg) {
      if (pv(tar, "INNER_FOCUS")) { /* never flinches */ }
      else { msg(`${Nm(tar)} flinched!`); addATB(tar, -FLINCH_TM); if (pv(tar, "STEADFAST")) stage(tar, tar, "spe", 1, "Steadfast"); }
    }
    if (M.st && M.sw !== "self" && R() < M.sc / 100 * sg) for (const [s, n] of M.st) stage(att, tar, s, n);
  }

  // ---------- special moves ----------
  function transform(u, t, quiet) {
    if (!t || !t.alive || t.flags.transformed || u.flags.transformed) { if (!quiet) msg("But it failed!"); return; }
    u.flags.transformed = true; u.spr = t.key; u.types = t.types.slice(); u.skills = t.skills; u.cool = { 1: 0, 2: 0, 3: 0 };
    for (const s of ["atk", "def", "spa", "sdf", "spe"]) u.max[s] = t.max[s];
    u.stages = { ...t.stages }; u.passives = t.passives.slice();
    ev({ k: "transform", u: u.uid, to: t.key });
    msg(`${Nm(u)} transformed into ${t.n}!`); fxEv(u);
  }
  const SELF_KO = new Set(["selfdestruct", "explosion"]);
  function damp() { return B.units.some(x => x.alive && pv(x, "DAMP")); }

  // ---------- targeting + AI ----------
  function targetable(u) { return enemies(u); }
  function defaultTarget(u, sk) {
    if (sk.target === "ally_single") return allies(u).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
    const foes = targetable(u);
    return foes.slice().sort((a, b) => scoreTarget(u, sk, b) - scoreTarget(u, sk, a))[0];
  }
  function scoreTarget(u, sk, t) {
    if (sk.pow > 0 || FIXED[sk.M.sp] || sk.M.sp === "superfang") { const d = expectedDamage(u, t, sk); return d < 0 ? -1 : Math.min(1.4, d / Math.max(1, t.hp) + (d >= t.hp ? .4 : 0)); }
    return statusValue(u, sk, t);
  }
  // value of a status move against (or for) a target, roughly on the same scale as "fraction of HP removed"
  function statusValue(u, sk, t) {
    const M = sk.M, sp = M.sp;
    if (sp === "splash") return .01;
    if (sp === "transform") return u.flags.transformed ? -1 : 1.2;
    if (sp === "metronome") return .45;
    if (sp === "haze") { const foeUp = enemies(u).reduce((a, f) => a + Object.values(f.stages).filter(v => v > 0).reduce((x, y) => x + y, 0), 0), myDown = allies(u).reduce((a, f) => a + Object.values(f.stages).filter(v => v < 0).reduce((x, y) => x - y, 0), 0); return (foeUp + myDown) * .18; }
    if (sp === "rest") return u.hp < u.max.hp * .4 || (u.status && u.status !== "SLP") ? .9 : -1;
    if (M.hl || sp === "recover" || sp === "softboiled") { const tg = sk.target === "ally_single" ? t : u; return tg.hp < tg.max.hp * .6 ? (1 - tg.hp / tg.max.hp) * 1.4 : -1; }
    if (sp === "reflect" || sp === "lightscreen") return has(u, sp === "reflect" ? "REFLECT" : "LSCREEN") ? -1 : .45;
    if (sp === "mist") return has(u, "MIST") ? -1 : .15;
    if (sp === "focusenergy") return has(u, "FOCUS") ? -1 : .3;
    if (sp === "substitute") return u.shield > 0 || u.hp < u.max.hp * .5 ? -1 : .3;
    if (sp === "roar" || sp === "whirlwind") return t.atb / 100 * .4 + Object.values(t.stages).reduce((a, v) => a + Math.max(0, v), 0) * .15;
    if (M.ail) {
      if (!t || !t.alive) return -1;
      const major = MAJOR.includes(M.ail);
      if (major && t.status) return -1;
      if (!major && has(t, M.ail)) return -1;
      if (TYPE_IMMUNE[M.ail] && t.types.includes(TYPE_IMMUNE[M.ail])) return -1;
      if (M.t === "Electric" && typeEff("Electric", t.types) === 0) return -1;
      if (M.pw && t.types.includes("Grass")) return -1;
      const ns = pv(t, "NO_STATUS"); if (ns && ns.list.includes(M.ail)) return -1;
      const v = { SLP: .75, PAR: .55, BRN: .5, TOX: .5, PSN: .4, FRZ: .8, CNF: .35, INFAT: .3, SEED: .45, DISABLE: .25, TRAP: .3 }[M.ail] || .3;
      return v * accOf(u, t, sk) * (sk.target === "aoe_enemies" ? 1.3 : 1) * (.6 + .4 * t.hp / t.max.hp);
    }
    if (M.st) {
      const self = M.sw === "self";
      const tg = self ? u : t;
      if (!tg) return -1;
      let v = 0;
      for (const [s, n] of M.st) {
        const cur = tg.stages[s];
        if (self) v += cur >= 4 ? 0 : (n > 0 ? .22 * n : 0) * (s === "atk" ? (u.max.atk >= u.max.spa ? 1.2 : .3) : s === "spa" ? (u.max.spa > u.max.atk ? 1.2 : .3) : 1);
        else v += cur <= -3 ? 0 : -n * .14;
      }
      return v * (M.sw === "foes" ? 1.5 : 1) * (u.hp / u.max.hp > .4 ? 1 : .4);
    }
    return .1;
  }
  const isHealSkill = s => !!(s.M.hl || ["recover", "softboiled", "rest"].includes(s.M.sp));
  function skillReady(u, s) {
    if (!s) return false;
    if (s.slot === 1) return true;
    if (has(u, "DISABLE")) return false;
    return (u.cool[s.slot] || 0) === 0;
  }
  function aiChoose(u, style = "balanced") {
    const foes = targetable(u), al = allies(u);
    let best = null, bs = -Infinity;
    for (const s of u.skills) {
      if (!skillReady(u, s)) continue;
      if (SELF_KO.has(s.M.sp) && damp()) continue;
      const dmgMove = s.pow > 0 || FIXED[s.M.sp] || s.M.sp === "superfang";
      let score, tgt = null;
      if (s.target === "aoe_enemies") {
        score = foes.reduce((a, f) => a + Math.max(0, dmgMove ? scoreTarget(u, s, f) : statusValue(u, s, f)), 0);
        if (dmgMove && foes.every(f => scoreTarget(u, s, f) < 0)) score = -1;
      } else if (s.target === "enemy") {
        for (const f of foes) { const v = scoreTarget(u, s, f); if (v > (score ?? -Infinity)) { score = v; tgt = f; } }
      } else if (s.target === "ally_single") {
        const low = al.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0]; tgt = low; score = statusValue(u, s, low);
      } else score = statusValue(u, s, u);
      if (score == null) continue;
      if (SELF_KO.has(s.M.sp)) score -= u.hp / u.max.hp * .9;
      if (style === "aggressive" && dmgMove) score *= 1.25;
      if (style === "safe" && !dmgMove) score *= 1.3;
      if (s.slot > 1 && score > 0) score *= 1.08;
      score += R() * .04;
      if (score > bs) { bs = score; best = { slot: s.slot, t: tgt }; }
    }
    return best || { slot: 1, t: null };
  }

  // ---------- turn flow ----------
  function advance() {
    const al = B.units.filter(x => x.alive);
    let best = null, bt = Infinity;
    for (const u of al) { const t = (100 - u.atb) / effSpd(u); if (t < bt) { bt = t; best = u; } }
    for (const u of al) u.atb = clamp(u.atb + effSpd(u) * bt, 0, 100);
    best.atb = 100;
    return best;
  }
  function predictOrder(n) {
    const snap = B.units.filter(x => x.alive).map(u => ({ u, atb: u.atb, spd: effSpd(u) })), out = [];
    for (let i = 0; i < n && snap.length; i++) {
      const nx = snap.reduce((a, b) => (100 - b.atb) / b.spd < (100 - a.atb) / a.spd ? b : a);
      const dt = Math.max(0, (100 - nx.atb) / nx.spd);
      for (const s of snap) s.atb = clamp(s.atb + s.spd * dt, 0, 100);
      nx.atb = 0; out.push(nx.u.uid);
    }
    return out;
  }
  function endTurn(u) {
    if (u.alive) {
      let changed = false;
      for (const e of u.eff) { if (e.skip) e.skip = false; else if (e.turns < 90) { e.turns--; changed = true; } }
      const gone = u.eff.filter(e => e.turns <= 0);
      for (const e of gone) {
        if (e.id === "REFLECT" || e.id === "LSCREEN") msg(`${Nm(u)}'s ${FX[e.id].n} wore off!`);
        else if (e.id === "TRAP") msg(`${Nm(u)} was freed from Bind!`);
        else if (e.id === "DISABLE") msg(`${Nm(u)}'s moves are no longer disabled!`);
        else if (e.id === "CNF") msg(`${Nm(u)} snapped out of its confusion!`);
      }
      u.eff = u.eff.filter(e => e.turns > 0);
      if (changed && gone.length) fxEv(u);
      if (item(u, "quickclaw") && R() < .2) { msg(`${Nm(u)}'s Quick Claw let it act sooner!`); addATB(u, .5, true); }
    }
    B.actor = null; B.waiting = null;
    const a = B.units.filter(x => x.team === "A" && x.alive).length, f = B.units.filter(x => x.team === "E" && x.alive).length;
    if (!a) { B.over = true; B.result = { win: false, alive: 0, turns: B.allyTurns }; }
    else if (!f) {
      if (B.wave < B.waves.length - 1) B.pendingWave = true;
      else { B.over = true; B.result = { win: true, alive: a, lost: B.allyCount - a, turns: B.allyTurns }; }
    }
  }
  // start-of-turn upkeep: weather, poison, burns, seeds, binding, items. Returns false if it fainted.
  function upkeep(u) {
    const H = u.max.hp;
    if (inWeather("sand") && !u.types.some(t => ["Rock", "Ground"].includes(t)) && !(pv(u, "WSPEED") || pv(u, "WEVA"))) chip(u, H / 16, `${Nm(u)} is buffeted by the sandstorm!`);
    if (u.alive && inWeather("hail") && !u.types.includes("Ice") && !(pv(u, "WEVA") || pv(u, "WHEAL"))) chip(u, H / 16, `${Nm(u)} is buffeted by the hail!`);
    if (u.alive && u.status === "BRN") chip(u, H / 16, `${Nm(u)} was hurt by its burn!`);
    if (u.alive && u.status === "PSN") chip(u, H / 8, `${Nm(u)} was hurt by poison!`);
    if (u.alive && u.status === "TOX") { chip(u, H / 16 * u.sTurn, `${Nm(u)} was hurt by poison!`); u.sTurn = Math.min(15, u.sTurn + 1); }
    const seed = effOf(u, "SEED");
    if (u.alive && seed && !pv(u, "MAGIC_GUARD")) {
      const src = B.units.find(x => x.uid === seed.src), n = Math.max(1, Math.floor(H / 8));
      chip(u, n, `${Nm(u)}'s health is sapped by Leech Seed!`);
      if (src && src.alive) { if (pv(u, "OOZE")) chip(src, n); else heal(src, n); }
    }
    if (u.alive && has(u, "TRAP")) chip(u, H / 8, `${Nm(u)} is hurt by Bind!`);
    if (!u.alive) return false;
    const wh = pv(u, "WHEAL"); if (wh && inWeather(wh.w)) heal(u, H / 16, `${Nm(u)} restored HP with its ${u.passives[0].name}.`);
    if (pv(u, "SOLAR") && inWeather("sun")) chip(u, H / 8);
    if (u.alive && item(u, "leftovers") && u.hp < H) heal(u, H / 16, `${Nm(u)} restored a little HP using its Leftovers!`);
    const sh = pv(u, "SHED");
    if (u.alive && u.status && sh && (!sh.w || inWeather(sh.w)) && R() < sh.chance) { msg(`${Nm(u)}'s ${u.passives[0].name} cured its status condition!`); u.status = null; u.sTurn = 0; fxEv(u); }
    return u.alive;
  }
  // can it move this turn? (sleep, freeze, paralysis, love, confusion, recharge)
  function canMove(u) {
    if (has(u, "RECHARGE")) { removeEff(u, "RECHARGE"); msg(`${Nm(u)} must recharge!`); return false; }
    if (u.status === "SLP") {
      u.sTurn--;
      if (u.sTurn > 0) { msg(`${Nm(u)} is fast asleep.`); ev({ k: "txt", u: u.uid, s: "Zzz", c: "txt" }); return false; }
      u.status = null; msg(`${Nm(u)} woke up!`); fxEv(u);
    }
    if (u.status === "FRZ") {
      u.sTurn--;
      if (u.sTurn > 0 && R() >= .2) { msg(`${Nm(u)} is frozen solid!`); return false; }
      u.status = null; msg(`${Nm(u)} thawed out!`); fxEv(u);
    }
    if (u.status === "PAR" && R() < .25) { msg(`${Nm(u)} is paralyzed! It can't move!`); ev({ k: "txt", u: u.uid, s: "PAR", c: "debuff" }); return false; }
    if (has(u, "INFAT") && R() < .5) { msg(`${Nm(u)} is immobilized by love!`); return false; }
    if (has(u, "CNF")) {
      msg(`${Nm(u)} is confused!`);
      if (R() < 1 / 3) {
        msg("It hurt itself in its confusion!");
        const d = Math.max(1, Math.round((((2 * u.lvl / 5 + 2) * 40 * statOf(u, "atk") / Math.max(1, statOf(u, "def"))) / 50 + 2) * DMG_SCALE));
        applyDamage(null, u, d, { trueDmg: true });
        return false;
      }
    }
    return u.alive;
  }
  function act(u, slot, t) {
    let sk = u.skills.find(s => s.slot === slot) || u.skills[0];
    if (!skillReady(u, sk)) sk = u.skills[0];
    const M = sk.M;
    u.lastSkill = sk;
    let targets;
    if (sk.target === "enemy") { if (!t || !t.alive || t.team === u.team) t = defaultTarget(u, sk); targets = t ? [t] : []; }
    else if (sk.target === "ally_single") { if (!t || !t.alive || t.team !== u.team) t = defaultTarget(u, sk); targets = [t]; }
    else if (sk.target === "self") targets = [u];
    else if (sk.target === "team") targets = allies(u);
    else if (sk.target === "field") targets = B.units.filter(x => x.alive);
    else targets = enemies(u);
    ev({ k: "act", u: u.uid, slot, name: sk.name, type: sk.type, cat: sk.cat, anim: sk.anim, s3: sk.slot === 3, t: targets[0] && targets[0].uid, tgt: sk.target });
    msg(`${Nm(u)} used ${sk.name}!`, { big: 1 });
    B.ctxKill = false;
    if (sk.slot > 1) u.cool[sk.slot] = cdOf(u, sk) + (enemies(u).some(f => pv(f, "PRESSURE")) ? 1 : 0);
    useMove(u, sk, targets);
    if (u.alive && M.pri > 0) addATB(u, .3, true);
    ev({ k: "end", u: u.uid });
    endTurn(u);
  }
  function useMove(u, sk, targets) {
    const M = sk.M, sp = M.sp;
    if (sp === "splash") { msg("But nothing happened!"); return; }
    if (SELF_KO.has(sp) && damp()) { msg(`${Nm(B.units.find(x => x.alive && pv(x, "DAMP")))}'s Damp prevents ${M.n}!`); return; }
    if (sp === "metronome") {
      const k = pick(METRONOME), virt = { ...makeSkill(k, sk.slot), slot: sk.slot, cd: 0 };
      msg(`Waggling a finger let it use ${virt.name}!`);
      ev({ k: "act", u: u.uid, slot: sk.slot, name: virt.name, type: virt.type, cat: virt.cat, anim: virt.anim, s3: false, t: null, tgt: virt.target, quiet: 1 });
      const tg = virt.target === "aoe_enemies" ? enemies(u) : virt.target === "self" ? [u] : virt.target === "team" ? allies(u) : [defaultTarget(u, virt)].filter(Boolean);
      return useMove(u, virt, tg);
    }
    if (sp === "transform") return transform(u, targets[0]);
    if (sp === "dreameater" && !(targets[0] && targets[0].status === "SLP")) { msg(`${Nm(targets[0] || u)} wasn't affected!`); return; }
    if ((sp === "fissure" || sp === "horndrill" || sp === "guillotine") && targets[0] && (targets[0].boss || targets[0].lvl > u.lvl)) { msg(`${Nm(targets[0])} is unaffected!`); return; }
    const dmgMove = M.c !== "X";
    if (dmgMove) {
      let total = 0, anyHit = false;
      const aoe = sk.target === "aoe_enemies";
      const nHits = !sk.hits ? 1 : pv(u, "SKILL_LINK") ? sk.hits[1] : sk.hits[0] === sk.hits[1] ? sk.hits[0] : pick([2, 2, 2, 3, 3, 3, 4, 5].filter(n => n >= sk.hits[0] && n <= sk.hits[1]));
      for (const x of targets) {
        if (!x.alive || !u.alive) continue;
        if (R() >= accOf(u, x, sk)) {
          ev({ k: "atk", a: u.uid, t: [x.uid], anim: sk.anim, type: sk.type, aoe: aoe ? 1 : 0, miss: 1, sp: sk.slot > 1 }); msg(`${Nm(x)} avoided the attack!`); ev({ k: "txt", u: x.uid, s: "MISS", c: "txt" });
          if (M.n === "High Jump Kick" || M.n === "Jump Kick") chip(u, u.max.hp / 2, `${Nm(u)} kept going and crashed!`);
          continue;
        }
        if (sp === "fissure" || sp === "horndrill" || sp === "guillotine") { ev({ k: "atk", a: u.uid, t: [x.uid], anim: sk.anim, type: sk.type, sp: 1 }); applyDamage(u, x, x.hp, { bypassSub: true }); msg("It's a one-hit KO!"); anyHit = true; continue; }
        let effSeen = null, hitsDone = 0, dealtHere = 0;
        for (let h = 0; h < nHits; h++) {
          if (!x.alive || !u.alive) break;
          ev({ k: "atk", a: u.uid, t: [x.uid], anim: sk.anim, type: sk.type, aoe: aoe ? 1 : 0, h, n: nHits, sp: sk.slot > 1 });
          const r = attackOnce(u, x, sk, h === 0);
          if (r.immune || r.absorbed) break;
          hitsDone++; anyHit = true; dealtHere += r.dealt; total += r.dealt; effSeen = r.e;
        }
        if (nHits > 1 && hitsDone) msg(`The Pokémon was hit ${hitsDone} time${hitsDone > 1 ? "s" : ""}!`);
        if (effSeen > 1) { msg(`It's super effective${aoe ? ` on ${nm(x)}` : ""}!`); if (u.team === "A") B.tally.superEff++; }
        else if (effSeen != null && effSeen < 1) msg(`It's not very effective${aoe ? ` on ${nm(x)}` : ""}...`);
        if (hitsDone) secondary(u, x, sk);
        if (sp === "payday" && hitsDone && u.team === "A") { B.tally.payday += 2 * u.lvl; msg("Coins were scattered everywhere!"); }
      }
      // drain, recoil, self-KO, recharge
      if (u.alive && M.dr > 0 && total > 0) {
        const n = Math.max(1, Math.round(total * M.dr / 100)), oozer = targets.find(x => pv(x, "OOZE"));
        if (oozer) chip(u, n, `${Nm(u)} sucked up the liquid ooze!`); else heal(u, n, sp === "dreameater" ? `${Nm(targets[0])}'s dream was eaten!` : `${Nm(targets[0])} had its energy drained!`);
      }
      if (u.alive && M.dr < 0 && total > 0 && !pv(u, "ROCK_HEAD")) chip(u, Math.max(1, total * -M.dr / 100), `${Nm(u)} was damaged by the recoil!`);
      if (u.alive && item(u, "lifeorb") && anyHit) chip(u, u.max.hp / 10, `${Nm(u)} lost some of its HP!`);
      if (u.alive && item(u, "shellbell") && total > 0) heal(u, total / 8);
      if (u.alive && M.st && M.sw === "self" && anyHit && R() < M.sc / 100) for (const [s, n] of M.st) stage(u, u, s, n);
      if (SELF_KO.has(sp) && u.alive) { u.hp = 0; ev({ k: "dmg", u: u.uid, n: 0, hp: 0, sh: 0, dot: 1 }); kill(u, null); }
      if (sp === "hyperbeam" && u.alive && targets.some(x => x.alive)) addEff(u, "RECHARGE", 1, u, true);
      if (sp === "roar" || sp === "whirlwind") for (const x of targets) if (x.alive) { x.atb = 0; x.stages = newStages(); ev({ k: "tm", u: x.uid, tm: 0, v: -100, quiet: 1 }); fxEv(x); }
      return;
    }
    // ---- status moves ----
    if (sp === "haze") { for (const x of B.units) if (x.alive) { x.stages = newStages(); fxEv(x); } msg("All stat changes were eliminated!"); return; }
    if (sp === "rest") {
      if (u.hp >= u.max.hp && !u.status) { msg("But it failed!"); return; }
      u.status = null; tryStatus(u, u, "SLP", false, { turns: 2 }); heal(u, u.max.hp); msg(`${Nm(u)} slept and became healthy!`); return;
    }
    if (sp === "reflect" || sp === "lightscreen" || sp === "mist") {
      const id = { reflect: "REFLECT", lightscreen: "LSCREEN", mist: "MIST" }[sp];
      for (const a of allies(u)) addEff(a, id, 5, u, true);
      msg({ REFLECT: "Reflect made your team stronger against physical moves!", LSCREEN: "Light Screen made your team stronger against special moves!", MIST: "Your team became shrouded in mist!" }[id].replace("Your team", u.team === "A" ? "Your team" : "The opposing team").replace("your team", u.team === "A" ? "your team" : "the opposing team"));
      ev({ k: "aura", u: u.uid, team: 1 });
      return;
    }
    if (sp === "focusenergy") { if (has(u, "FOCUS")) { msg("But it failed!"); return; } addEff(u, "FOCUS", 99, u, true); msg(`${Nm(u)} is getting pumped!`); return; }
    if (sp === "substitute") {
      if (u.shield > 0 || u.hp <= u.max.hp / 4) { msg(u.shield > 0 ? `${Nm(u)} already has a substitute!` : "But it does not have enough HP left to make a substitute!"); return; }
      applyDamage(null, u, Math.floor(u.max.hp / 4), { trueDmg: true }); u.shield = Math.floor(u.max.hp / 4); addEff(u, "SUB", 99, u, true); msg(`${Nm(u)} put in a substitute!`); return;
    }
    if (sp === "roar" || sp === "whirlwind") { for (const x of targets) if (x.alive) { x.atb = 0; x.stages = newStages(); ev({ k: "tm", u: x.uid, tm: 0, v: -100, quiet: 1 }); fxEv(x); msg(`${Nm(x)} was ${sp === "roar" ? "scared off" : "blown away"}!`); } return; }
    if (M.hl || sp === "recover" || sp === "softboiled") {
      for (const x of targets) if (!heal(x, x.max.hp * (M.hl || 50) / 100 * mastery(u, sk), `${Nm(x)} had its HP restored.`)) msg(`${Nm(x)}'s HP is full!`);
      return;
    }
    let any = false;
    for (const x of targets) {
      if (!x.alive) continue;
      const foe = x.team !== u.team;
      if (foe && R() >= accOf(u, x, sk)) { msg(`${Nm(x)} avoided the attack!`); ev({ k: "txt", u: x.uid, s: "MISS", c: "txt" }); continue; }
      if (foe && M.so && pv(x, "SOUNDPROOF")) { msg(`${Nm(x)}'s Soundproof blocks the move!`); continue; }
      if (foe && M.pw && x.types.includes("Grass")) { msg(`It doesn't affect ${nm(x)}...`); continue; }
      if (foe && M.t === "Electric" && M.ail && typeEff("Electric", x.types) === 0) { msg(`It doesn't affect ${nm(x)}...`); continue; }
      if (foe && x.shield > 0 && !M.so && !pv(u, "INFILTRATOR")) { msg("But it failed!"); continue; }
      if (M.ail) { if (tryStatus(u, x, M.ail, sk.target !== "aoe_enemies", { sound: !!M.so, direct: true })) any = true; }
      if (M.st) for (const [s, n] of M.st) if (stage(u, M.sw === "self" ? x : x, s, n)) any = true;
    }
    if (M.ail === "DISABLE" && !any) { /* message already shown */ }
    if (sk.anim === "buff") ev({ k: "aura", u: u.uid, team: sk.target === "team" ? 1 : 0 });
  }

  B.has = has; B.targetable = targetable; B.allies = allies; B.enemies = enemies; B.predictOrder = predictOrder;
  B.byId = uid => B.units.find(x => x.uid === uid);
  B.usable = (u, slot) => slot === 1 || skillReady(u, u.skills.find(s => s.slot === slot));
  B.effStat = { spd: effSpd, atk: u => statOf(u, "atk"), def: u => statOf(u, "def"), spa: u => statOf(u, "spa"), sdf: u => statOf(u, "sdf"), spe: u => statOf(u, "spe") };
  B.estimate = (u, t, s) => expectedDamage(u, t, s);
  B.effOn = (u, t, s) => effOn(u, t, s);
  B.step = () => {
    if (B.over) return "over";
    if (B.pendingWave) {
      B.pendingWave = false; const list = spawnWave(B.wave + 1);
      if (B.trainer) msg(`${B.trainer} sent out ${list.map(x => x.n).join(", ")}!`); else msg(`${list.map(x => "A wild " + x.n).join(", ")} appeared!`);
      startEffects(list); return "wave";
    }
    const u = advance(); B.actor = u; B.turn++;
    if (u.team === "A") B.allyTurns++;
    u.atb = 0;
    ev({ k: "turn", u: u.uid, tms: B.units.filter(x => x.alive).map(x => [x.uid, x.atb]) });
    for (const s in u.cool) if (u.cool[s] > 0) u.cool[s]--;
    if (!upkeep(u) || !canMove(u)) { ev({ k: "end", u: u.uid }); endTurn(u); return "acted"; }
    if (u.team === "A" && !B.auto) { B.waiting = u; return "input"; }
    const ch = aiChoose(u, u.team === "A" ? B.aiStyle : "balanced"); act(u, ch.slot, ch.t); return "acted";
  };
  B.playerAct = (slot, t) => { const u = B.waiting; if (!u) return; if (!B.usable(u, slot)) slot = 1; act(u, slot, t); };
  B.autoAct = () => { const u = B.waiting; if (!u) return; const ch = aiChoose(u, B.aiStyle); act(u, ch.slot, ch.t); };

  // ---------- setup ----------
  const mine = cfg.allies.map((s, i) => buildUnit(s, "A", i));
  B.units.push(...mine);
  const first = spawnWave(0);
  B.avgL = B.waves.flat().concat(cfg.allies.map(s => ({ LV: (s.prog || {}).lvl || s.LV }))).reduce((a, s) => a + (s.LV || 10), 0) / (B.waves.flat().length + cfg.allies.length);
  B.ev = [];
  if (B.weather) msg(WEATHER[B.weather].start);
  startEffects(mine); startEffects(first);
  return B;
}
