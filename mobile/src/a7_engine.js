
// =====================================================================
//  BATTLE ENGINE — ATB turn order, elements and module sets from the original game,
//  with the real Arknights kits translated in (format: mobile/tools/kits/KIT_FORMAT.md):
//  Physical/Arts/True damage, timed skill states, talents, branch traits.
//  Emits events for the renderer.
// =====================================================================
let UID = 0;
const MELEE = new Set(["Vanguard", "Guard", "Defender", "Specialist"]);
const K_TURN = 3;                                   // one turn hits like three Arknights normal attacks
const CC = ["STUN", "SLEEP", "FREEZE", "LEVITATE"]; // statuses that cost the next turn
const STATE_FLAGS = { taunt: "TAUNT", stealth: "STEALTH", counter: "COUNTER", immune: "IMMUNITY", invincible: "INVINCIBLE" };
const isHealSpec = s => !!s && (!!s.heal || (s.effects || []).some(e => /heal|revive/i.test(e.type)) || /ally_single|aoe_allies/.test(s.target || ""));
const hasStateOnly = s => !!s.state && !(s.mult > 0) && !s.heal && (!s.target || s.target === "self");
function animFor(u, sk) {
  const t = sk.target || "self";
  if (sk.heal || t === "self" || t === "team" || t === "allies" || t === "aoe_allies" || t === "ally_single")
    return isHealSpec(sk) ? "heal" : "buff";
  const melee = MELEE.has(u.cls) || (u.def.fig && (u.def.fig.type === "slug" || u.def.fig.type === "hound"));
  if (t === "aoe_enemies" || t === "enemies" || sk.aoe || sk.n > 1) return melee ? "spin" : u.cls === "Sniper" ? "volley" : "nova";
  return melee ? "melee" : u.cls === "Sniper" ? "shoot" : "orb";
}

function makeBattle(cfg) {
  const B = { units: [], ev: [], wave: 0, waves: cfg.waves, over: false, result: null, turn: 0, allyTurns: 0, actor: null, waiting: null,
    leaders: { A: null, E: null }, auto: !!cfg.auto, aiStyle: cfg.aiStyle || "balanced", enemyStyle: cfg.enemyStyle || "balanced", depth: 0, pendingWave: false, allyCount: cfg.allies.length, dmgDone: {} };
  const ev = e => B.ev.push(e);
  const has = (u, id) => u.eff.some(e => e.id === id);
  const fxEv = u => {
    const m = {};
    for (const e of u.eff) if (!e.fromState) m[e.id] = (m[e.id] || 0) + 1;
    for (const s of u.states) m.SKILL = (m.SKILL || 0) + 1;
    for (const e of u.eff) if (e.fromState && (e.id === "TAUNT" || e.id === "STEALTH")) m[e.id] = 1;
    ev({ k: "fx", u: u.uid, list: Object.entries(m), sh: u.shield });
  };
  const allies = u => B.units.filter(x => x.team === u.team && x.alive);
  const enemies = u => B.units.filter(x => x.team !== u.team && x.alive);

  // ---------- units ----------
  function buildUnit(spec, team, slot) {
    let def, st, sets, sk, skills, passives, elite = 2;
    if (spec.op) {
      def = OPS[spec.op];
      const prog = spec.prog || progForLV(spec.op, spec.LV);
      ({ st, sets } = opStats(spec.op, prog, spec.sets || (spec.prog ? null : def.runes)));
      if (spec.boost && spec.boost !== 1) for (const s of ["hp", "atk", "def"]) st[s] = Math.round(st[s] * spec.boost);   // simulated Doctors' module stats
      sk = prog.sk; elite = prog.elite;
      skills = [def.basic, ...def.skills.filter(s => !s.passive && s.elite <= elite)];
      passives = opPassives(def, elite);
    } else {
      def = ENEMY[spec.en];
      ({ st, sets } = enemyStats(spec.en, spec.LV));
      const r = Math.min(7, 1 + Math.floor(spec.LV / 18)); sk = [r, r, r];
      skills = def.skills; passives = (def.passives || []).map(p => ({ ...p, special: p.special || p.id }));
    }
    if (spec.maxHp) st.hp = Math.round(spec.maxHp);   // guild bosses: a fixed HP pool
    const cool = {};
    for (const s of skills) if (s.slot) cool[s.slot] = spec.op ? s.cd0 || 0 : 0;
    return { uid: ++UID, key: spec.op || spec.en, def, isOp: !!spec.op, team, slot, n: def.n, el: def.el, cls: def.cls, boss: !!(def.boss || spec.boss),
      max: { ...st }, hp: spec.hpNow != null ? Math.max(1, Math.min(st.hp, Math.round(spec.hpNow))) : st.hp, shield: 0, atb: 0, eff: [], states: [], cool, skills, sk, elite, passives, top: Math.max(...skills.map(s => s.slot)),
      sets: new Set(sets), leader: def.leader || null, flags: {}, tst: new Map(), alive: true, provokedBy: null,
      mech: def.mech || null, prio: def.prio || null, elemKind: def.elem || null, elem: {}, lib: 0, charges: 0, summons: 0, traps: 0 };
  }
  const special = (u, id) => u.passives.find(p => p.special === id);
  function applyLeader(L, list) {
    if (!L || !L.leader) return;
    const ld = L.leader;
    for (const t of list) {
      if (ld.scope === "Element" && t.el !== ld.element) continue;
      if (ld.stat === "HP") { t.max.hp = Math.round(t.max.hp * (1 + ld.amount)); t.hp = t.max.hp; }
      else if (ld.stat === "ATK") t.max.atk = Math.round(t.max.atk * (1 + ld.amount));
      else if (ld.stat === "DEF") t.max.def = Math.round(t.max.def * (1 + ld.amount));
      else if (ld.stat === "SPD") t.max.spd = Math.round(t.max.spd * (1 + ld.amount));
      else if (ld.stat === "CR") t.max.cr = clamp(t.max.cr + ld.amount, 0, 1);
      else if (ld.stat === "CD") t.max.cd += ld.amount;
      else if (ld.stat === "ACC") t.max.acc = clamp(t.max.acc + ld.amount, 0, 1);
      else if (ld.stat === "RES") t.max.res = clamp(t.max.res + ld.amount, 0, 1);
    }
  }
  // auras ("who") from talents
  function auraHits(src, who, u) {
    if (who === "enemies") return u.team !== src.team;
    if (u.team !== src.team) return false;
    if (who === "team") return true;
    if (who === "allies") return u !== src;
    if (who === "random_ally") return u.uid === src.flags.randAlly;
    if (who === "melee") return MELEE.has(u.cls);
    if (who === "ranged") return !MELEE.has(u.cls);
    if (who.startsWith("class:")) return u.cls === who.slice(6);
    return false;
  }
  function startEffects(list) {
    for (const u of list) {
      const others = list.filter(x => x !== u);
      if (others.length) u.flags.randAlly = pick(others).uid;
      if (u.sets.has("Will")) addEff(u, "IMMUNITY", 1, u, true);
      if (u.sets.has("Shield")) { const v = Math.round(u.max.hp * .15); for (const a of list) { a.shield += v; addEff(a, "SHIELD", 3, u, true); } }
      for (const p of u.passives) if (p.special === "TEAM_ATB_START") for (const a of list) a.atb = clamp(a.atb + p.amount * 100, 0, 100);
    }
    // permanent max HP auras
    for (const src of list) for (const p of src.passives) if (p.aura && p.aura.stats.hp && p.aura.who !== "enemies")
      for (const u of list) if (auraHits(src, p.aura.who, u)) { u.max.hp = Math.round(u.max.hp * (1 + p.aura.stats.hp)); u.hp = u.max.hp; }
    for (const u of list) trigger(u, "start", {});
  }
  function spawnWave(w) {
    B.wave = w;
    const list = B.waves[w].map((s, i) => buildUnit(s, "E", i));
    B.units.push(...list);
    B.leaders.E = list.find(u => u.leader) || null;
    applyLeader(B.leaders.E, list);
    for (const u of list) u.atb = R() * 10;
    ev({ k: "wave", w, units: list.map(x => x.uid) });
    for (const u of B.units.filter(x => x.team === "A" && x.alive)) {
      if (u.mech === "mystic") u.charges = 2;
      if (u.mech === "traper") u.traps = 2;
      if (w > 0) trigger(u, "wave", {});
    }
    return list;
  }

  // ---------- stats ----------
  const sv = (u, id) => { let v = 0; for (const e of u.eff) if (e.id === id) v = Math.max(v, e.v != null ? e.v : FX[id].v || 0); return v; };
  const ss = (u, k) => { let v = 0; for (const s of u.states) if (typeof s.m[k] === "number") v += s.m[k]; return v; };
  const skillActive = u => u.states.length > 0;
  function dyn(u, k) {
    let v = 0;
    for (const p of u.passives) if (p.whileStats && p.whileStats[k] && condOK(u, p.while, {})) v += p.whileStats[k];
    for (const s of B.units) if (s.alive) for (const p of s.passives) if (p.aura && p.aura.stats[k] && k !== "hp" && auraHits(s, p.aura.who, u)) v += p.aura.stats[k];
    return v;
  }
  const mod = (u, k) => ss(u, k) + dyn(u, k);
  const phalanxIdle = u => u.mech === "phalanx" && !skillActive(u);
  const effSpd = u => Math.max(1, u.max.spd * Math.max(.25, 1 + sv(u, "SPD_UP") + mod(u, "spd") - sv(u, "SLOW") - sv(u, "COLD") - sv(u, "BIND") - sv(u, "FEAR")));
  const effAtk = u => u.max.atk * Math.max(.2, 1 + sv(u, "ATK_UP") + mod(u, "atk") + .4 * u.lib - sv(u, "ATK_DOWN")) + sv(u, "INSPIRE");
  const effDef = u => u.max.def * Math.max(0, 1 + sv(u, "DEF_UP") + mod(u, "def") - sv(u, "DEF_BREAK") + (phalanxIdle(u) ? 2 : 0));
  const effCR = u => clamp(u.max.cr + sv(u, "CRIT_RATE_UP") + mod(u, "cr"), 0, 1);
  const effCD = u => u.max.cd + mod(u, "cdmg");
  const effRes = u => clamp((u.max.ares + sv(u, "RES_UP") + mod(u, "ares") - sv(u, "RES_DOWN") - (has(u, "FREEZE") ? 15 : 0) + (phalanxIdle(u) ? 20 : 0)) * Math.max(0, 1 + dyn(u, "aresPct")), 0, 95);
  const effSRes = u => u.max.res + mod(u, "res");
  const effDodge = u => clamp(u.max.dodge + sv(u, "DODGE") + mod(u, "dodge"), 0, .9);
  const healMult = u => Math.max(0, 1 + u.max.heal + mod(u, "heal"));
  const blockOf = u => u.mech === "bearer" && skillActive(u) ? 0 : u.max.block || 0;
  const lvMult = (u, slot) => u.isOp ? (slot ? .82 + .03 * ((u.sk[slot - 1] || 1) - 1) : 1) : 1 + .06 * ((u.sk[Math.max(0, slot - 1)] || 1) - 1);
  const cdOf = (u, sk) => u.isOp ? sk.cd || 0 : Math.max(0, (sk.cd || 0) - ((u.sk[sk.slot] || 1) >= 7 && sk.slot > 0 ? 1 : 0));
  function takenMult(u, att) {
    let v = 1 + u.max.dmgTaken + mod(u, "dmgTaken") + sv(u, "BRAND") + sv(u, "FRAGILE") - sv(u, "DMG_REDUCE");
    for (const p of u.passives) for (const r of p.dmgReduce || []) if (condOK(u, r.cond, { attacker: att })) v -= r.v;
    return Math.max(.1, v);
  }

  // ---------- conditions + triggers ----------
  const isCC = u => CC.some(id => has(u, id)) || has(u, "SLOW") || has(u, "BIND") || has(u, "COLD");
  function condOK(u, c, ctx) {
    if (!c) return true;
    const t = ctx.target, a = ctx.attacker;
    if (c.hpBelow != null && !(u.hp / u.max.hp < c.hpBelow)) return false;
    if (c.hpAbove != null && !(u.hp / u.max.hp > c.hpAbove)) return false;
    if (c.targetHpBelow != null && !(t && t.hp / t.max.hp < c.targetHpBelow)) return false;
    if (c.targetHpAbove != null && !(t && t.hp / t.max.hp > c.targetHpAbove)) return false;
    if (c.targetHas && !(t && has(t, c.targetHas))) return false;
    if (c.targetDebuffed != null && !!(t && t.eff.some(e => !FX[e.id].b)) !== !!c.targetDebuffed) return false;
    if (c.targetBoss != null && !!(t && t.boss) !== !!c.targetBoss) return false;
    if (c.targetCC != null && !!(t && isCC(t)) !== !!c.targetCC) return false;
    if (c.targetFastest && !(t && enemies(u).every(x => effSpd(x) <= effSpd(t)))) return false;
    if (c.selfHas && !has(u, c.selfHas)) return false;
    if (c.skillActive != null && skillActive(u) !== !!c.skillActive) return false;
    if (c.attackerRanged != null && !!(a && !MELEE.has(a.cls)) !== !!c.attackerRanged) return false;
    if (c.attackerMelee != null && !!(a && MELEE.has(a.cls)) !== !!c.attackerMelee) return false;
    if (c.alliesAlive != null && allies(u).length < c.alliesAlive) return false;
    if (c.enemiesAlive != null && enemies(u).length < c.enemiesAlive) return false;
    return true;
  }
  function trigger(u, on, ctx) {
    if (!u.alive && on !== "death") return;
    for (const p of u.passives) {
      const list = p.on ? [p, ...(p.triggers || [])] : p.triggers || [];
      for (const g of list) {
        if (g.on !== on) continue;
        const st = u.tst.get(g) || { n: 0, done: false }; u.tst.set(g, st);
        if (st.done) continue;
        if (on === "lowhp") { if (!(u.hp / u.max.hp < ((g.cond && g.cond.hpBelow) || .5))) continue; st.done = true; }
        else if (!condOK(u, g.cond, ctx)) continue;
        st.n++;
        if (g.every && st.n % g.every) continue;
        if (g.chance != null && R() >= g.chance) continue;
        if (g.once) st.done = true;
        for (const e of g.effects || []) runEffect(u, e, ctx);
      }
    }
  }
  function effTargets(u, e, ctx, fallback) {
    switch (e.on) {
      case "self": return [u];
      case "target": return ctx.target ? [ctx.target] : fallback || [];
      case "attacker": return ctx.attacker && ctx.attacker.alive ? [ctx.attacker] : [];
      case "team": return allies(u);
      case "allies": return allies(u).filter(x => x !== u);
      case "enemies": return enemies(u);
      case "lowest": { const l = allies(u).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0]; return l ? [l] : []; }
      case "random_enemy": { const f = enemies(u); return f.length ? [pick(f)] : []; }
      case "random_ally": { const f = allies(u).filter(x => x !== u); return f.length ? [pick(f)] : [u]; }
      default: return fallback || [];
    }
  }
  // one effect from a talent trigger or a skill (non-hit effects)
  function runEffect(u, e, ctx, fallback) {
    if (e.type === "bonusIf" || e.type === "bonusPerDebuff") return;
    if (e.type !== "debuff" && e.chance != null && R() >= e.chance) return;
    if (e.type === "revive") { const dead = B.units.filter(x => x.team === u.team && !x.alive && !x.retreated); if (dead.length) revive(dead[dead.length - 1], e.amount || .3); return; }
    for (const x of effTargets(u, e, ctx, fallback)) {
      if (!x.alive) continue;
      switch (e.type) {
        case "buff": addEff(x, e.what, e.turns || 1, u, false, e.v); break;
        case "debuff": tryDebuff(u, x, e.what, e.turns || 1, e.chance != null ? e.chance : 1, e.v); break;
        case "dmg": for (let h = 0; h < (e.hits || 1); h++) attackOnce(u, x, { mult: e.mult || 0, dmg: e.dmg || (u.basicDmg), slot: 0 }, { proc: true }); break;
        case "heal": heal(x, effAtk(u) * (e.amount || 0) * (u.isOp ? K_TURN : 1) * healMult(u), u); break;
        case "healPct": heal(x, x.max.hp * (e.amount || 0), u); break;
        case "shield": giveShield(x, e.amount ? effAtk(u) * e.amount * (u.isOp ? K_TURN : 1) : u.max.hp * (e.pctHP || 0), e.turns || 2); break;
        case "atkbar+": addATB(x, e.amount || 0); break;
        case "atkbar-": addATB(x, -(e.amount || 0)); break;
        case "cleanse": cleanse(x, e.amount || 1); break;
        case "strip": strip(x, e.amount || 1); break;
        case "cdReduce": cdReduce(x, e.amount || 1, x !== u); break;
        case "elem": addElem(u, x, e.kind, e.amount || .2); break;
        case "retreat": retreat(x); break;
        // legacy effect types (enemy kits)
        case "healPctTarget": heal(x, x.max.hp * (e.amount || 0), u); break;
        case "healFlatCasterHP": heal(x, u.max.hp * (e.amount || 0), u); break;
        case "shieldCasterHP": giveShield(x, u.max.hp * (e.amount || 0), e.turns); break;
        case "taunt": addEff(x, "TAUNT", e.turns || 1, u); break;
      }
    }
  }

  // ---------- statuses ----------
  function addEff(u, id, turns, src, quiet, v, fromState) {
    if (!u.alive) return;
    if (id === "COLD" && has(u, "COLD") && !fromState) { removeEff(u, "COLD"); id = "FREEZE"; turns = 1; v = undefined; }
    // Inspiration adds a share of the giver's ATK as flat ATK
    if (id === "INSPIRE") v = Math.round((v != null ? v : FX.INSPIRE.v) * (src ? src.max.atk : 0));
    const ex = u.eff.find(x => x.id === id && !x.fromState);
    if (id === "DOT" || id === "HOT") u.eff.push({ id, turns, v, skip: u === B.actor });
    else if (ex && !fromState) { ex.turns = Math.max(ex.turns, turns); ex.skip = u === B.actor; if (v != null) ex.v = Math.max(ex.v != null ? ex.v : 0, v); }
    else u.eff.push({ id, turns, v, skip: u === B.actor, fromState });
    if (id === "PROVOKE") u.provokedBy = src;
    if (!quiet) ev({ k: "txt", u: u.uid, s: FX[id].n, c: FX[id].b ? "buff" : "debuff" });
    fxEv(u);
  }
  function removeEff(u, id) { const n = u.eff.length; u.eff = u.eff.filter(e => e.id !== id || e.fromState); if (id === "SHIELD") u.shield = 0; if (id === "PROVOKE") u.provokedBy = null; if (n !== u.eff.length) fxEv(u); }
  function immuneTo(u, what) { const imm = special(u, "IMMUNE_LIST"); return imm && (imm.list.includes(what) || imm.list.includes("ANY")); }
  function tryDebuff(att, tar, what, turns, chance = 1, v) {
    if (!tar.alive) return false;
    if (immuneTo(tar, what)) { ev({ k: "txt", u: tar.uid, s: "IMMUNE", c: "txt" }); return false; }
    if (R() >= chance) return false;
    if (has(tar, "IMMUNITY")) { ev({ k: "txt", u: tar.uid, s: "IMMUNE", c: "txt" }); return false; }
    if (R() < Math.min(.85, .15 + Math.max(0, effSRes(tar) - att.max.acc))) { ev({ k: "txt", u: tar.uid, s: "RESIST", c: "txt" }); return false; }
    addEff(tar, what, turns, att, false, v); return true;
  }
  function addATB(u, amount, quiet) {
    if (!u.alive) return;
    u.atb = clamp(u.atb + amount * 100, 0, 100);
    ev({ k: "tm", u: u.uid, tm: u.atb, v: amount * 100, quiet });
  }
  function heal(u, n, src) {
    if (!u.alive || n <= 0) return;
    if (has(u, "HEAL_BLOCK")) { ev({ k: "txt", u: u.uid, s: "HEAL BLOCKED", c: "debuff" }); return; }
    if (src && src !== u && special(u, "NO_ALLY_HEAL")) return;
    const g = Math.min(Math.round(n), u.max.hp - u.hp); if (g <= 0) return;
    u.hp += g; ev({ k: "heal", u: u.uid, n: g, hp: u.hp, sh: u.shield });
  }
  function giveShield(u, v, turns) { if (!u.alive || v <= 0) return; u.shield += Math.round(v); addEff(u, "SHIELD", turns || 2, u, true); ev({ k: "heal", u: u.uid, n: Math.round(v), hp: u.hp, sh: u.shield, isShield: 1 }); }
  function strip(u, n) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      const pool = u.eff.filter(e => FX[e.id].b && e.id !== "INVINCIBLE" && !e.fromState); if (!pool.length) break;
      const e = pool[Math.floor(R() * pool.length)]; u.eff = u.eff.filter(x => x !== e); if (e.id === "SHIELD") u.shield = 0; k++;
    }
    if (k) { ev({ k: "txt", u: u.uid, s: "BUFFS REMOVED", c: "debuff" }); fxEv(u); }
  }
  function cleanse(u, n) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      const pool = u.eff.filter(e => !FX[e.id].b); if (!pool.length) break;
      const e = pool[Math.floor(R() * pool.length)]; u.eff = u.eff.filter(x => x !== e); if (e.id === "PROVOKE") u.provokedBy = null; k++;
    }
    if (k) { ev({ k: "txt", u: u.uid, s: "CLEANSED", c: "buff" }); fxEv(u); }
  }
  function cdReduce(u, n, quiet) {
    let any = false;
    for (const s in u.cool) if (u.cool[s] > 0) { u.cool[s] = Math.max(0, u.cool[s] - n); any = true; }
    if (any && !quiet) ev({ k: "txt", u: u.uid, s: "COOLDOWN −" + n, c: "buff" });
  }
  function addElem(src, u, kind, amount) {
    if (!u.alive || !ELEM[kind]) return;
    u.elem[kind] = (u.elem[kind] || 0) + amount;
    if (u.elem[kind] < 1) return;
    u.elem[kind] = 0;
    ev({ k: "txt", u: u.uid, s: ELEM[kind].n.toUpperCase(), c: "debuff" });
    const pctHP = { burn: .12, necrosis: .1, nervous: .08, corrosion: 0 }[kind];
    if (pctHP) applyDamage(src, u, Math.max(1, Math.round(u.max.hp * pctHP)), { trueDmg: true });
    if (!u.alive) return;
    if (kind === "burn") addEff(u, "RES_DOWN", 2, src, false, 20);
    else if (kind === "necrosis") addEff(u, "ATK_DOWN", 2, src, false, .3);
    else if (kind === "nervous") addEff(u, "STUN", 1, src);
    else addEff(u, "DEF_BREAK", 2, src, false, .3);
  }
  function revive(u, pct) {
    if (!u || u.alive) return;
    u.alive = true; u.hp = Math.max(1, Math.round(u.max.hp * pct)); u.eff = []; u.states = []; u.shield = 0; u.atb = 0; u.provokedBy = null; u.lib = 0;
    ev({ k: "revive", u: u.uid, hp: u.hp });
  }
  function retreat(u) {
    if (!u.alive) return;
    u.alive = false; u.retreated = true; u.hp = 0; u.eff = []; u.states = []; u.shield = 0; u.atb = 0;
    ev({ k: "txt", u: u.uid, s: "RETREATED", c: "txt" }); ev({ k: "death", u: u.uid });
  }

  // ---------- skill states ----------
  function applyState(u, sk) {
    const m = sk.state;
    endState(u, u.states.find(s => s.slot === sk.slot), true);
    const S = { slot: sk.slot, name: sk.name, m, left: (m.turns || 1) >= 99 ? 1e12 : (m.turns || 1) * 100, hpAdd: 0, hold: sk.basic === false };
    u.states.push(S);
    if (m.hp) { const add = Math.round(u.max.hp * m.hp); u.max.hp += add; u.hp += add; S.hpAdd = add; }
    for (const k in STATE_FLAGS) if (m[k]) addEff(u, STATE_FLAGS[k], 99, u, true, typeof m[k] === "number" ? m[k] : undefined, sk.slot);
    if (m.regen) u.flags.regenNow = true;
    fxEv(u);
  }
  function endState(u, S, quiet) {
    if (!S) return;
    u.states = u.states.filter(x => x !== S);
    u.eff = u.eff.filter(e => e.fromState !== S.slot);
    if (S.hpAdd) { u.max.hp -= S.hpAdd; u.hp = Math.min(u.hp, u.max.hp); }
    if (u.mech === "librator") u.lib = 0;
    if (!quiet) for (const e of S.m.onEnd || []) runEffect(u, e, {});
    fxEv(u);
  }

  // ---------- damage ----------
  function kill(u, killer) {
    const und = !u.flags.undying && u.passives.find(p => p.special === "UNDYING" || p.special === "REVIVE_ONCE");
    if (und) {
      u.flags.undying = true; u.hp = Math.max(1, Math.round(u.max.hp * (und.amount || 0))); u.shield = 0;
      u.eff = u.eff.filter(e => e.fromState || FX[e.id].b);
      ev({ k: "txt", u: u.uid, s: "UNDYING", c: "buff" }); ev({ k: "revive", u: u.uid, hp: u.hp, inPlace: 1 });
      if (und.turns !== 0) addEff(u, und.buff || "INVINCIBLE", und.turns || 1, u);
      return;
    }
    u.alive = false; u.hp = 0; u.eff = []; u.states = []; u.shield = 0; u.atb = 0; u.lib = 0;
    if ((u.mech === "redeploy" || u.mech === "merchant") && !u.flags.redeployed) { u.flags.redeployed = true; u.redeployIn = 3; }
    ev({ k: "death", u: u.uid });
    if (killer && killer.alive) {
      for (const p of killer.passives) if (p.special === "TEAM_ATB_ON_KILL") for (const a of allies(killer)) addATB(a, p.amount);
      if (killer.mech === "soulcaster" && killer.summons < 2) { killer.summons++; ev({ k: "txt", u: killer.uid, s: "SUMMON", c: "buff" }); }
      trigger(killer, "kill", { target: u });
    }
    for (const a of allies(u)) trigger(a, "allyDeath", { target: u });
  }
  function applyDamage(att, tar, dmg, meta) {
    if (!tar.alive) return 0;
    if (has(tar, "INVINCIBLE")) { ev({ k: "txt", u: tar.uid, s: "INVINCIBLE", c: "txt" }); return 0; }
    let dealt = dmg;
    if (!meta.trueDmg && tar.shield > 0) { const soak = Math.min(tar.shield, dealt); tar.shield -= soak; dealt -= soak; if (tar.shield <= 0) { tar.shield = 0; removeEff(tar, "SHIELD"); } }
    if (meta.noKill) dealt = Math.min(dealt, tar.hp - 1);
    tar.hp -= dealt;
    ev({ k: "dmg", u: tar.uid, n: dmg, crit: !!meta.crit, glance: !!meta.glance, hp: Math.max(0, tar.hp), sh: tar.shield, dot: !!meta.trueDmg, adv: meta.adv });
    if (att) B.dmgDone[att.uid] = (B.dmgDone[att.uid] || 0) + dmg;
    if (dealt > 0 && has(tar, "SLEEP")) removeEff(tar, "SLEEP");
    if (tar.sets.has("Nemesis") && dealt > 0 && tar.hp > 0) addATB(tar, (dealt / tar.max.hp) * (.04 / .07), true);
    if (tar.hp <= 0) kill(tar, att); else trigger(tar, "lowhp", {});
    return dealt;
  }
  // one hit; spec: {mult, dmg, ignoreDef, ignoreRes, slot, effects, sure}; opt: {proc, counter, multOverride}
  function attackOnce(att, tar, spec, opt = {}) {
    if (!att.alive || !tar.alive) return 0;
    const type = spec.dmg || "phys";
    if (type !== "true" && !spec.sure && !opt.proc && R() < effDodge(tar)) { ev({ k: "txt", u: tar.uid, s: "DODGE", c: "txt" }); trigger(tar, "hurt", { attacker: att, dodged: true }); return 0; }
    const rel = elementRel(att.el, tar.el);
    const glance = !opt.proc && ((rel === "dis" && R() < .5) || (has(att, "GLANCING") && R() < .5));
    let critChance = opt.proc ? 0 : effCR(att) + (rel === "adv" ? .15 : 0), bonus = 0;
    for (const e of spec.effects || []) {
      if (e.type === "bonusIf" && has(tar, e.cond)) { bonus += e.bonusDmg || 0; critChance += e.bonusCrit || 0; }
      if (e.type === "bonusPerDebuff") bonus += Math.min(e.cap || 0, tar.eff.filter(x => !FX[x.id].b).length * (e.per || 0));
    }
    for (const p of att.passives) for (const b of p.dmgBonus || []) if (condOK(att, b.cond, { target: tar })) bonus += b.v;
    if (glance) critChance = 0;
    const crit = R() < critChance;
    const mult = opt.multOverride != null ? opt.multOverride : spec.mult || 0;
    const raw = effAtk(att) * mult * (att.isOp ? K_TURN : 1) * lvMult(att, spec.slot || 0);
    let mit = 1;
    if (type === "phys") mit = 1000 / (1000 + Math.max(0, effDef(tar) * (1 - (spec.ignoreDef || 0))));
    else if (type === "arts") mit = 1 - effRes(tar) * (1 - (spec.ignoreRes || 0)) / 100;
    let dmg = Math.max(raw * mit, raw * .05);
    if (crit) dmg *= 1 + effCD(att);
    dmg *= Math.max(.1, 1 + (rel === "adv" ? .15 : 0) + (glance ? -.3 : 0) + bonus) * takenMult(tar, att);
    dmg = Math.max(1, Math.round(dmg));
    const dealt = applyDamage(att, tar, dmg, { crit, glance, adv: rel === "adv", trueDmg: type === "true" });
    if (crit) B.ctxCrits++;
    if (opt.proc) return dealt;
    tar.flags.hurtSince = true;
    if (tar.alive && att.sets.has("Despair") && R() < .25) tryDebuff(att, tar, "STUN", 1, 1);
    for (const e of spec.effects || []) {
      if (e.on !== "target" && e.on !== "enemy") { if (e.on === "self" && e.type === "atkbar+" && e.perCrit && crit) addATB(att, e.amount || 0); continue; }
      if (e.onKill) continue;
      if (e.type === "debuff") tryDebuff(att, tar, e.what, e.turns || 1, e.chance != null ? e.chance : 1, e.v);
      else if (e.type === "atkbar-") { if (e.chance == null || R() < e.chance) addATB(tar, -(e.amount || 0)); }
      else if (e.type === "strip") { if (e.chance == null || R() < e.chance) strip(tar, e.amount || 1); }
      else if (e.type === "elem") addElem(att, tar, e.kind, e.amount || .2);
      else if (e.type === "dmg") attackOnce(att, tar, { mult: e.mult || 0, dmg: e.dmg || att.basicDmg }, { proc: true });
    }
    if (att.alive) trigger(att, "hit", { target: tar });
    if (tar.alive && att.alive) {
      trigger(tar, "hurt", { attacker: att });
      const refl = ss(tar, "reflect");
      if (refl > 0) attackOnce(tar, att, { mult: refl, dmg: tar.states.find(s => s.m.reflectDmg) ? tar.states.find(s => s.m.reflectDmg).m.reflectDmg : "phys" }, { proc: true });
    }
    if (tar.alive && att.alive && !opt.counter && B.depth < 3) {
      if ((has(tar, "COUNTER") && R() < sv(tar, "COUNTER")) || (tar.sets.has("Revenge") && R() < .15)) {
        ev({ k: "txt", u: tar.uid, s: "COUNTER", c: "buff" });
        const cs = basicSpec(tar);
        if (!cs.heal && cs.mult > 0) { B.depth++; ev({ k: "atk", a: tar.uid, t: [att.uid], anim: animFor(tar, { target: "enemy" }), aoe: 0, counter: 1 }); attackOnce(tar, att, cs, { counter: true }); B.depth--; }
      }
    }
    const ls = (special(att, "LIFESTEAL") ? special(att, "LIFESTEAL").amount || .2 : 0) + ss(att, "lifesteal");
    if (ls > 0 && dealt > 0 && att.alive) heal(att, dealt * ls, att);
    if (!tar.alive) B.ctxKill = true;
    return dealt;
  }

  // ---------- actions ----------
  // basic attack spec for a unit right now: branch basic + active skill states + trait mechanics
  function basicSpec(u) {
    const base = u.skills.find(s => s.slot === 0) || { slot: 0, target: "enemy", mult: 1, hits: 1, dmg: "phys" };
    const s = { ...base, effects: [...(base.effects || [])] };
    for (const st of u.states) if (st.m.basic) { const b = st.m.basic; Object.assign(s, { ...b, effects: [...s.effects, ...(b.effects || [])] }); }
    if (u.mech === "artsprotector" && skillActive(u) && !(u.states.some(x => x.m.basic && x.m.basic.dmg))) s.dmg = "arts";
    if (u.mech === "phalanx") { if (skillActive(u)) s.aoe = true; else s.mult = .4 * (s.mult || 1); }
    if (u.mech === "blessing" && skillActive(u) && !s.heal) { s.target = "ally_single"; s.heal = .75; }
    if (u.mech === "primcaster") s.effects.push({ on: "target", type: "elem", kind: u.elemKind || "burn", amount: .15 });
    if (s.heal && s.target !== "team") s.target = "ally_single";
    else if (!s.heal && s.target === "ally_single") s.target = "enemy";
    return s;
  }
  function resolveTargets(u, spec, t) {
    const tg = spec.heal && spec.target !== "team" && spec.target !== "allies" && spec.target !== "self" ? "ally_single" : spec.target || "self";
    if (tg === "self") return [u];
    if (tg === "team") return allies(u);
    if (tg === "allies") { const a = allies(u).filter(x => x !== u); return a.length ? a : [u]; }
    if (tg === "ally_single") {
      const al = allies(u).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp);
      const first = t && t.alive && t.team === u.team ? t : al[0];
      if (spec.healN > 1) return [first, ...al.filter(x => x !== first)].slice(0, spec.healN);
      return first ? [first] : [];
    }
    const foes = enemies(u);
    if (tg === "aoe_enemies" || spec.aoe) { const main = t && t.alive && t.team !== u.team ? t : null; return main ? [main, ...foes.filter(x => x !== main)] : foes; }
    const okT = x => x && x.alive && x.team !== u.team && (spec.reach || canTarget(u, x));
    const main = okT(t) ? t : defaultTarget(u, spec);
    if (!main) return [];
    if ((spec.n || 1) > 1 || tg === "enemies") {
      const rest = foes.filter(x => x !== main).sort((a, b) => Math.abs(a.slot - main.slot) - Math.abs(b.slot - main.slot) || a.hp - b.hp);
      return [main, ...rest].slice(0, spec.n || 3);
    }
    return [main];
  }
  // performs one attack/heal spec; returns the targets
  function perform(u, spec, t, anim, isBasic) {
    let targets = resolveTargets(u, spec, t);
    const healing = spec.heal > 0;
    if (healing && isBasic && !allies(u).some(a => a.hp < a.max.hp)) {
      // nobody needs treatment: weak Arts attack instead
      spec = { slot: 0, target: "enemy", mult: .5, hits: 1, dmg: "arts" }; targets = resolveTargets(u, spec, null);
      anim = animFor(u, spec);
    }
    if (spec.heal > 0) {
      const amt = effAtk(u) * spec.heal * (u.isOp ? K_TURN : 1) * lvMult(u, spec.slot || 0) * healMult(u);
      for (const x of targets) heal(x, amt, u);
      for (const e of spec.effects || []) if (e.on === "target") for (const x of targets) runEffect(u, e, { target: x });
      return targets;
    }
    if ((spec.mult || 0) > 0 && targets.length && spec.spread) {
      // each hit lands on a random enemy
      for (let h = 0; h < (spec.hits || 1); h++) {
        const alive = enemies(u); if (!alive.length || !u.alive) break;
        const x = h === 0 && targets[0].alive ? targets[0] : pick(alive);
        ev({ k: "atk", a: u.uid, t: [x.uid], anim, aoe: 0, h, n: spec.hits || 1, sp: (spec.slot || 0) > 0 });
        attackOnce(u, x, spec);
      }
      return targets;
    }
    if ((spec.mult || 0) > 0 && targets.length) {
      const multi = targets.length > 1;
      for (let h = 0; h < (spec.hits || 1); h++) {
        const alive = targets.filter(x => x.alive); if (!alive.length || !u.alive) break;
        ev({ k: "atk", a: u.uid, t: alive.map(x => x.uid), anim, aoe: multi ? 1 : 0, h, n: spec.hits || 1, sp: (spec.slot || 0) > 0 });
        alive.forEach(x => {
          const i = targets.indexOf(x);
          let m = spec.mult;
          if (spec.falloff) m *= Math.pow(spec.falloff, i);
          if (spec.front && i === 0) m *= spec.front;
          attackOnce(u, x, spec, { multOverride: m });
        });
      }
      const main = targets[0];
      if (isBasic && u.alive && main) {
        // trait extras: Mystic charges, Shaper summons
        const extra = (u.mech === "mystic" ? u.charges : 0), sum = u.mech === "soulcaster" ? u.summons : 0;
        if (extra && main.alive) { ev({ k: "atk", a: u.uid, t: [main.uid], anim, aoe: 0, h: 1, n: 2 }); for (let i = 0; i < extra; i++) attackOnce(u, main, { ...spec, effects: [] }, { multOverride: .8 }); u.charges = 0; }
        for (let i = 0; i < sum; i++) { const f = enemies(u); const x = main.alive ? main : f[0]; if (x) attackOnce(u, x, { mult: .5, dmg: "arts" }, { proc: true }); }
      }
    }
    return targets;
  }
  function useBasic(u, t) {
    if (u.autoNext) { const sk = u.skills.find(s => s.slot === u.autoNext); u.autoNext = 0; if (sk && (u.cool[sk.slot] || 0) === 0) return useSkill(u, sk, t, true); }
    if (u.mech === "librator" && !skillActive(u)) {
      ev({ k: "act", u: u.uid, slot: 0, name: "Gather Strength", anim: "buff", t: u.uid, tgt: "self" });
      if (u.lib < 5) { u.lib++; ev({ k: "txt", u: u.uid, s: `ATK +${u.lib * 40}%`, c: "buff" }); }
      return [];
    }
    const spec = basicSpec(u);
    // "stops attacking" skills: no basic attack while their state lasts (heal-mode basics still heal)
    if (u.states.some(x => x.hold) && !spec.heal) {
      ev({ k: "act", u: u.uid, slot: 0, name: "Hold Position", anim: "buff", t: u.uid, tgt: "self" });
      return [];
    }
    if (u.mech === "funnel" && !spec.heal) {
      const tt = t && t.alive ? t : defaultTarget(u, spec);
      u.flags.funK = tt && u.flags.funT === tt.uid ? u.flags.funK + 1 : 0; u.flags.funT = tt && tt.uid;
      spec.mult = Math.min(1.1, (spec.mult || .6) + .25 * u.flags.funK);
    }
    const anim = animFor(u, spec);
    ev({ k: "act", u: u.uid, slot: 0, name: spec.name || "Attack", anim, t: t && t.uid, tgt: spec.heal ? "ally_single" : spec.target });
    const out = perform(u, spec, t, anim, true);
    killEffects(u, spec, out);
    return out;
  }
  function killEffects(u, spec, targets) {
    if (!B.ctxKill || !u.alive) return;
    for (const e of spec.effects || []) if (e.onKill) runEffect(u, { ...e, on: e.on === "target" ? "random_enemy" : e.on }, { target: targets[0] });
  }
  function useSkill(u, sk, t, viaAuto) {
    const stateOnly = hasStateOnly(sk);
    const anim = stateOnly ? "buff" : animFor(u, sk);
    ev({ k: "act", u: u.uid, slot: sk.slot, name: sk.name, anim, s3: sk.slot >= 2 && sk.slot === u.top, t: t && t.uid, tgt: sk.target || "self" });
    let targets = [];
    if (!stateOnly && (sk.mult > 0 || sk.heal > 0)) targets = perform(u, sk, t, anim, false);
    else if (sk.target && sk.target !== "self") targets = resolveTargets(u, sk, t);
    else targets = [u];
    if (u.alive) for (const e of sk.effects || []) {
      if (e.onKill) { if (B.ctxKill) runEffect(u, e, {}); continue; }
      if ((e.on === "target" || e.on === "enemy") && (sk.mult > 0 || sk.heal > 0)) continue;   // applied per hit / per heal
      if (e.on === "target" || e.on === "enemy") { for (const x of targets) runEffect(u, { ...e, on: "target" }, { target: x }); continue; }
      runEffect(u, e, { target: targets[0] });
    }
    if (u.alive && sk.state) applyState(u, sk);
    u.cool[sk.slot] = cdOf(u, sk);
    trigger(u, "skill", { slot: sk.slot });
    if (u.alive && stateOnly && sk.basic !== false && !viaAuto) {
      const sp = basicSpec(u);
      if ((sp.mult || 0) > 0 || sp.heal) { B.ctxKill = false; killEffects(u, sp, perform(u, sp, t, animFor(u, sp), true)); }
    }
    return targets;
  }

  // ---------- targeting + AI ----------
  const canSeeStealth = u => !!special(u, "TRUESIGHT");
  function singleTargetables(u, list) { if (canSeeStealth(u)) return list; const vis = list.filter(x => !has(x, "STEALTH")); return vis.length ? vis : list; }
  function targetable(u) { const f = singleTargetables(u, enemies(u)); const ta = f.filter(x => has(x, "TAUNT")); return ta.length ? ta : f; }
  const canTarget = (u, x) => targetable(u).includes(x);
  const hasKeyDebuff = t => has(t, "DEF_BREAK") || has(t, "BRAND") || has(t, "FRAGILE") || has(t, "HEAL_BLOCK");
  function defaultTarget(u, sk) {
    if (sk && (sk.target === "ally_single" || sk.heal)) return allies(u).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
    const foes = sk && sk.reach ? enemies(u) : targetable(u);
    if (!foes.length) return null;
    if (u.prio === "spd") return foes.slice().sort((a, b) => effSpd(b) - effSpd(a))[0];
    if (u.prio === "def") return foes.slice().sort((a, b) => effDef(a) - effDef(b))[0];
    if (u.prio === "hp") return foes.slice().sort((a, b) => b.max.hp - a.max.hp)[0];
    const score = x => x.hp / x.max.hp + (hasKeyDebuff(x) ? -.3 : 0) - .12 * blockOf(x) + (x.mech === "stalker" ? .4 : 0);
    return foes.slice().sort((a, b) => score(a) - score(b))[0];
  }
  function expectedDamage(att, tar, s) {
    if (!s || !(s.mult > 0) || !tar || !tar.alive) return 0;
    const rel = elementRel(att.el, tar.el), adv = rel === "adv" ? .15 : 0, glPen = rel === "dis" ? -.3 : 0;
    const type = s.dmg || "phys";
    const mit = type === "phys" ? 1000 / (1000 + Math.max(0, effDef(tar) * (1 - (s.ignoreDef || 0)))) : type === "arts" ? 1 - effRes(tar) * (1 - (s.ignoreRes || 0)) / 100 : 1;
    const base = effAtk(att) * s.mult * (att.isOp ? K_TURN : 1) * lvMult(att, s.slot || 0) * takenMult(tar, att);
    const glance = rel === "dis" ? .5 : 0, pCrit = clamp(effCR(att) + (rel === "adv" ? .15 : 0), 0, 1);
    const nc = base * mit * (1 + adv + glPen), cr = base * mit * (1 + effCD(att) + adv + glPen);
    return Math.max(1, Math.round((1 - glance) * ((1 - pCrit) * nc + pCrit * cr) + glance * nc * .7)) * (s.hits || 1);
  }
  const usable = (u, slot) => {
    if (slot === 0) return true;
    const s = u.skills.find(x => x.slot === slot);
    return !!s && !s.auto && (u.cool[slot] || 0) === 0 && !has(u, "SILENCE") && !has(u, "FEAR");
  };
  function aiChoose(u, style = "balanced") {
    if (style === "expert") return expertChoose(u);
    const foes = targetable(u), al = allies(u);
    const lowest = al.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
    const needHeal = lowest && lowest.hp / lowest.max.hp < .6 || B.units.some(x => x.team === u.team && !x.alive && !x.retreated);
    const ready = u.skills.filter(s => s.slot > 0 && usable(u, s.slot)).sort((a, b) => b.slot - a.slot)
      .filter(s => !(hasStateOnly(s) && u.states.length))
      .filter(s => !(isHealSpec(s) && !needHeal && !(s.mult > 0)) && !(s.state && s.state.onEnd && s.state.onEnd.some(e => e.type === "retreat") && enemies(u).length < 2 && B.wave === B.waves.length - 1 && enemies(u).every(x => x.hp < x.max.hp * .3)));
    const tgtFor = (s, pickFoe) => {
      const sp = hasStateOnly(s) ? basicSpec(u) : s;
      if (sp.heal || sp.target === "ally_single") return lowest;
      return sp.target === "enemy" || sp.target === "enemies" || sp.target === "aoe_enemies" || sp.mult > 0 ? pickFoe(sp) : u;
    };
    const lowestTTK = s => { let best = null, bt = Infinity; for (const t of foes) { const d = expectedDamage(u, t, s), ttk = d > 0 ? t.hp / d : Infinity; if (ttk < bt) { best = t; bt = ttk; } } return best || defaultTarget(u, s); };
    const threat = () => foes.slice().sort((a, b) => (effAtk(b) * effSpd(b) + b.atb * 2) - (effAtk(a) * effSpd(a) + a.atb * 2))[0];
    const basic = { slot: 0, ...basicSpec(u) };
    if (style === "aggressive") { const s = ready[0] || basic; return { slot: s.slot, t: tgtFor(s, sp => lowestTTK(sp)) }; }
    if (style === "safe") {
      const util = ready.find(s => s.state || (s.effects || []).some(e => e.on !== "target" && /cleanse|shield|buff|atkbar\+|revive|heal/.test(e.type)));
      if (util) return { slot: util.slot, t: tgtFor(util, threat) };
      const s = ready[0] || basic; return { slot: s.slot, t: tgtFor(s, threat) };
    }
    const s = ready[0] || basic;
    return { slot: s.slot, t: tgtFor(s, sp => defaultTarget(u, sp)) };
  }

  // ---------- Expert AI: look ahead by playing each candidate action out on copies of the battle ----------
  function expertCandidates(u) {
    const out = [];
    for (const s of [{ slot: 0 }, ...u.skills.filter(x => x.slot > 0 && usable(u, x.slot))]) {
      const spec = s.slot ? s : basicSpec(u), sp = hasStateOnly(spec) ? basicSpec(u) : spec;
      const healing = sp.heal > 0 && sp.target !== "team" && sp.target !== "allies";
      if (healing || sp.target === "ally_single") {
        const hurt = allies(u).filter(a => a.hp < a.max.hp).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp).slice(0, 3);
        for (const a of hurt.length ? hurt : [allies(u)[0]]) out.push({ slot: s.slot, t: a });
      } else if ((sp.mult > 0) && !(sp.aoe || sp.target === "aoe_enemies" || sp.spread)) {
        const foes = sp.reach ? enemies(u) : targetable(u);
        for (const f of foes.slice().sort((a, b) => a.hp - b.hp).slice(0, 4)) out.push({ slot: s.slot, t: f });
      } else out.push({ slot: s.slot, t: null });
    }
    return out;
  }
  function expertValue(C, team) {
    let v = 0;
    const val = x => x.alive ? 1 + x.hp / x.max.hp + Math.min(.3, x.shield / x.max.hp) : 0;
    for (const x of C.units) v += x.team === team ? 1.3 * val(x) : -val(x);
    const left = C.waves.length - 1 - C.wave;
    v -= left * 2 * (C.waves[C.waves.length - 1] || []).length;
    if (C.over) v += C.result.win === (team === "A") ? 40 : -40;
    return v;
  }
  // every candidate is played out against the same dice rolls (seeded), so luck doesn't decide between moves
  function expertChoose(u) {
    const cands = expertCandidates(u);
    if (cands.length <= 1) return cands[0] || aiChoose(u, "aggressive");
    const K = Math.max(6, Math.floor(120 / cands.length)), seed0 = Math.floor(Math.random() * 1e9), real = R;
    let best = cands[0], bs = -Infinity;
    try {
      for (const c of cands) {
        let sum = 0;
        for (let k = 0; k < K; k++) {
          R = seeded(seed0 + k * 7919);
          const C = makeBattle({ from: B, waves: B.waves, allies: [] }), cu = C.byId(u.uid);
          C.waiting = cu; C.actor = cu;
          C.playerAct(c.slot, c.t ? C.byId(c.t.uid) : null); C.ev.length = 0;
          for (let n = 0; n < 24 && !C.over; n++) { const r = C.step(); if (r === "input") C.autoAct(); C.ev.length = 0; }
          sum += expertValue(C, u.team);
        }
        if (sum / K > bs) { bs = sum / K; best = c; }
      }
    } finally { R = real; }
    return best;
  }

  // ---------- turn flow ----------
  function advance() {
    const al = B.units.filter(x => x.alive);
    let best = null, bt = Infinity;
    for (const u of al) { const t = (100 - u.atb) / effSpd(u); if (t < bt) { bt = t; best = u; } }
    for (const u of al) {
      u.atb = clamp(u.atb + effSpd(u) * bt, 0, 100);
      for (const s of u.states) s.left -= bt * u.max.spd;
    }
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
      for (const e of u.eff) { if (e.fromState) continue; if (e.skip) e.skip = false; else { e.turns--; changed = true; } }
      const had = u.eff.length, hadShield = u.eff.some(e => e.id === "SHIELD");
      u.eff = u.eff.filter(e => e.fromState || e.turns > 0);
      if (hadShield && !u.eff.some(e => e.id === "SHIELD")) u.shield = 0;
      if (!u.eff.some(e => e.id === "PROVOKE")) u.provokedBy = null;
      if (changed && had !== u.eff.length) fxEv(u);
    }
    B.actor = null; B.waiting = null;
    const a = B.units.filter(x => x.team === "A" && x.alive).length, f = B.units.filter(x => x.team === "E" && x.alive).length;
    if (!a) { B.over = true; B.result = { win: false, alive: 0, turns: B.allyTurns }; }
    else if (!f) {
      if (B.wave < B.waves.length - 1) B.pendingWave = true;
      else { B.over = true; B.result = { win: true, alive: a, lost: B.allyCount - a, turns: B.allyTurns }; }
    }
    // timed fights (guild boss): the squad withdraws when its turns run out
    if (!B.over && cfg.turnLimit && B.allyTurns >= cfg.turnLimit) { B.over = true; B.result = { win: false, timeUp: true, alive: a, turns: B.allyTurns }; }
  }
  function act(u, slot, t) {
    B.ctxCrits = 0; B.ctxKill = false;
    const sk = slot ? u.skills.find(s => s.slot === slot) : null;
    const targets = sk ? useSkill(u, sk, t) : useBasic(u, t);
    if (u.alive && targets.some(x => x.team !== u.team)) trigger(u, "attack", { target: targets.find(x => x.team !== u.team) });
    if (u.alive && u.sets.has("Violent") && R() < .22) { ev({ k: "txt", u: u.uid, s: "EXTRA TURN", c: "buff" }); u.atb = 100; ev({ k: "tm", u: u.uid, tm: 100, v: 100, quiet: 1 }); }
    ev({ k: "end", u: u.uid });
    endTurn(u);
  }
  // free actions at the start of a turn: expired states, regeneration, auto skills
  function turnStart(u) {
    for (const S of u.states.slice()) if (S.left <= 1) { endState(u, S); ev({ k: "txt", u: u.uid, s: S.name + " ended", c: "txt" }); }
    if (!u.alive) return;
    for (const s in u.cool) if (u.cool[s] > 0 && !u.states.some(x => x.slot === +s) && !(u.mech === "duelist" && !u.flags.hurtSince)) u.cool[s]--;
    u.flags.hurtSince = false;
    const dots = u.eff.filter(e => e.id === "DOT").reduce((a, e) => a + (e.v != null ? e.v : .05), 0);
    if (dots) applyDamage(null, u, Math.max(1, Math.floor(u.max.hp * dots)), { trueDmg: true });
    if (!u.alive) return;
    const regen = u.eff.filter(e => e.id === "HOT").reduce((a, e) => a + (e.v != null ? e.v : .05), 0) + ss(u, "regen");
    if (regen) heal(u, u.max.hp * regen, u);
    const drain = ss(u, "drain") + (u.mech === "merchant" ? .03 : 0);
    if (drain) applyDamage(null, u, Math.max(1, Math.floor(u.max.hp * drain)), { trueDmg: true, noKill: true });
    trigger(u, "turn", {});
    // enemy traps
    for (const tp of B.units) if (tp.alive && tp.team !== u.team && tp.traps > 0) {
      tp.traps--; ev({ k: "txt", u: u.uid, s: "TRAP", c: "debuff" });
      attackOnce(tp, u, { mult: 1.5, dmg: "phys" }, { proc: true });
      if (u.alive) tryDebuff(tp, u, "BIND", 1, 1);
      break;
    }
    if (!u.alive || CC.some(id => has(u, id)) || has(u, "SILENCE") || has(u, "FEAR")) return;
    for (const sk of u.skills) {
      if (!sk.auto || (u.cool[sk.slot] || 0) > 0 || !u.alive) continue;
      if (sk.state || !(sk.mult > 0)) { useSkill(u, sk, null, true); if (sk.state && !(sk.mult > 0)) u.flags.skipBasicOnce = false; }
      else u.autoNext = sk.slot;
    }
  }

  B.has = has; B.targetable = targetable; B.allies = allies; B.enemies = enemies; B.predictOrder = predictOrder;
  B.byId = uid => B.units.find(x => x.uid === uid);
  B.usable = usable;
  B.effStat = { spd: effSpd, atk: effAtk, def: effDef, cr: effCR, res: effRes, sres: effSRes, dodge: effDodge };
  B.estimate = (u, t, s) => expectedDamage(u, t, s);
  B.basicSpec = basicSpec;
  B.damageBy = team => B.units.filter(u => u.team === team).reduce((a, u) => a + (B.dmgDone[u.uid] || 0), 0);
  B.step = () => {
    if (B.over) return "over";
    if (B.pendingWave) { B.pendingWave = false; const list = spawnWave(B.wave + 1); startEffects(list); return "wave"; }
    const u = advance(); B.actor = u; B.turn++;
    if (u.team === "A") B.allyTurns++;
    u.atb = 0;
    // fallen Executors and Merchants redeploy after a few of their team's turns
    for (const d of B.units) if (!d.alive && d.redeployIn > 0 && d.team === u.team && --d.redeployIn === 0) { d.redeployIn = 0; revive(d, 1); ev({ k: "txt", u: d.uid, s: "REDEPLOYED", c: "buff" }); }
    ev({ k: "turn", u: u.uid, tms: B.units.filter(x => x.alive).map(x => [x.uid, x.atb]) });
    turnStart(u);
    if (!u.alive) { ev({ k: "end", u: u.uid }); endTurn(u); return "acted"; }
    const cc = CC.find(id => has(u, id));
    if (cc) { removeEff(u, cc); ev({ k: "txt", u: u.uid, s: cc === "STUN" ? "STUNNED" : FX[cc].n.toUpperCase(), c: "debuff" }); ev({ k: "end", u: u.uid }); endTurn(u); return "acted"; }
    if (has(u, "PROVOKE") && u.provokedBy && u.provokedBy.alive) { act(u, 0, u.provokedBy); return "acted"; }
    if (B.over) return "acted";
    if (u.team === "A" && !B.auto) { B.waiting = u; return "input"; }
    const ch = aiChoose(u, u.team === "A" ? B.aiStyle : B.enemyStyle); act(u, ch.slot, ch.t); return "acted";
  };
  B.playerAct = (slot, t) => { const u = B.waiting; if (!u) return; if (!usable(u, slot)) slot = 0; act(u, slot, t); };
  B.autoAct = () => { const u = B.waiting; if (!u) return; const ch = aiChoose(u, B.aiStyle); act(u, ch.slot, ch.t); };

  // ---------- setup ----------
  if (cfg.from) {
    // a working copy of another battle for look-ahead: units are copied, static kit data is shared
    const F = cfg.from, map = new Map();
    for (const u of F.units) map.set(u.uid, { ...u, max: { ...u.max }, eff: u.eff.map(e => ({ ...e })), states: u.states.map(x => ({ ...x })), cool: { ...u.cool },
      flags: { ...u.flags }, elem: { ...u.elem }, tst: new Map([...u.tst].map(([k, v]) => [k, { ...v }])) });
    B.units = F.units.map(u => map.get(u.uid));
    for (const c of B.units) if (c.provokedBy) c.provokedBy = map.get(c.provokedBy.uid) || null;
    Object.assign(B, { wave: F.wave, over: F.over, result: F.result, turn: F.turn, allyTurns: F.allyTurns, pendingWave: F.pendingWave, allyCount: F.allyCount,
      auto: true, aiStyle: "aggressive", enemyStyle: "aggressive", leaders: { A: F.leaders.A && map.get(F.leaders.A.uid), E: F.leaders.E && map.get(F.leaders.E.uid) },
      actor: F.actor && map.get(F.actor.uid), waiting: F.waiting && map.get(F.waiting.uid), ev: [] });
    return B;
  }
  const mine = cfg.allies.map((s, i) => buildUnit(s, "A", i));
  B.units.push(...mine);
  for (const u of B.units) u.basicDmg = (u.skills.find(s => s.slot === 0) || {}).dmg || "phys";
  B.leaders.A = mine[0] && mine[0].leader ? mine[0] : null;
  applyLeader(B.leaders.A, mine);
  const first = spawnWave(0);
  for (const u of first) u.basicDmg = (u.skills.find(s => s.slot === 0) || {}).dmg || "phys";
  B.ev = [];
  startEffects(mine); startEffects(first);
  return B;
}
