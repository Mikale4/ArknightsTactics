
// =====================================================================
//  BATTLE ENGINE — real-time 1-on-1 tag battles in the Beystadium.
//  Each side brings up to three Beyblades; one spins in the dish at a time. Beyblades move on their own
//  (Blade Base, weight, the slope of the dish), clash when they meet and lose Spin as they go. The Blader presses
//  Attack (S1: a rush at the rival), the technique (S2) and the Bit-Beast attack (S3, 100% Bit Power), and can tag
//  a partner in: each Beyblade can be tagged in once per battle, and the one tagged out recovers Spin on the bench
//  but can't come back until its tag cooldown ends. A Beyblade is out when its Spin runs out (Sleep Out) or it's
//  knocked over the rim (Ring Out). Fixed time step; the renderer reads B.units and the events in B.ev.
// =====================================================================
let UID = 0;
const DT = 1 / 30;                       // seconds per tick
const DISH_R = 430;                      // dish radius in world units (the renderer draws the same dish)
const S1_CD = 2.0, S2_TURN = 2.8;        // Attack cooldown; seconds per technique cooldown turn
const DMG_K = .2, CLASH_K = .16;          // damage scale of moves and of collisions
const TAG_CD = 12, TAG_LOCK = 4;         // a tagged-out Beyblade's cooldown; delay between a team's tags
const BENCH_HEAL = .03, BENCH_CAP = .4;  // bench recovery per second, and the most one stay restores
const DECAY = .0085;                     // Spin lost per second (fraction of max) before parts and type
const MC_MAX = 300, ARC_FREEZE = 1.25;   // Bit Power cap; the pause while the Bit-Beast rises
const BOWL_K = 1.6, DRIVE_K = 2.4;       // slope of the dish toward the centre; how hard a Beyblade steers
const TIME_LIMIT = 300;                  // seconds; then the side with more Spin left wins
// the three pockets in the dish's lip, where Ring Outs are easier (angles match the drawn stadium)
const POCKETS = [0, 24, 48].map(k => (k + 6.5) / 72 * Math.PI * 2);
const angDiff = (a, b) => { let d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; };
// how each move looks: rushes, shockwaves, buffs
function animFor(u, sk) {
  const t = sk.target;
  if (t === "self" || t === "team" || t === "aoe_allies" || t === "ally_single")
    return (sk.effects || []).some(e => /heal|revive/i.test(e.type)) ? "heal" : "buff";
  if (t === "aoe_enemies") return sk.arc ? "nova" : "spin";
  return "melee";
}

function makeBattle(cfg) {
  const B = { t: 0, units: [], ev: [], over: false, result: null, started: false, freeze: 0, pendingArc: null,
    mc: { A: 0, E: 0 }, tally: { arcs: 0, kills: 0, tags: 0 }, auto: !!cfg.auto, aiStyle: cfg.aiStyle || "balanced",
    side: { A: { key: "A", units: [], active: null, tagLock: 0, next: -1 }, E: { key: "E", units: [], active: null, tagLock: 0, next: -1 } },
    dmgDone: {}, pairT: 0 };
  const ev = e => B.ev.push(e);
  const has = (u, id) => u.eff.some(e => e.id === id);
  const pv = (u, id) => u.passives.find(p => p.id === id);
  const foeSide = s => s === "A" ? "E" : "A";
  const activeOf = s => { const a = B.side[s].active; return a && a.status === "field" ? a : null; };
  const rivalOf = u => activeOf(foeSide(u.team));
  const alive = u => u.status !== "out";
  const teamOf = u => B.side[u.team].units.filter(alive);
  const spinFrac = u => clamp(u.hp / u.max.hp, 0, 1);

  // ---------- units ----------
  function buildUnit(spec, team, slot) {
    let def, st, sk, build, stockKey;
    if (spec.op) {
      def = OPS[spec.op];
      const prog = spec.prog || progForLV(spec.op, spec.LV);
      ({ st, build } = opStats(spec.op, prog));
      // story rivals fight with a handicap (scale < 1 on Spin and ATK)
      if (spec.scale) { st.hp = Math.round(st.hp * spec.scale); st.atk = Math.round(st.atk * spec.scale); }
      sk = prog.sk;
    } else {
      def = ENEMY[spec.en];
      ({ st, build } = enemyStats(spec.en, spec.LV));
      const r = Math.min(7, 1 + Math.floor(spec.LV / 18)); sk = [r, r, r];
    }
    const boss = !!(def.boss || spec.boss), P = physOf(build, def.el);
    return { uid: ++UID, key: spec.op || spec.en, def, isOp: !!spec.op, team, slot, n: def.n, el: def.el, cls: def.cls, boss, LV: spec.LV,
      max: { ...st }, hp: st.hp, shield: 0, eff: [], cool: { 1: 0, 2: 0 }, skills: def.skills, sk, passives: def.passives || [],
      leader: def.leader || null, build, P, r: 48 * (boss ? 1.15 : 1), mass: P.weight * (boss ? 1.3 : 1),
      orbit: P.spin === "L" ? -1 : 1, status: "bench", tagUsed: false, benchCD: 0, benchGain: 0, entered: false,
      x: 0, z: 0, vx: 0, vz: 0, px: 0, pz: 0, rush: null, kbT: 0, burstT: 0, flags: {}, provokedBy: null };
  }
  function applyLeader(L, list) {
    if (!L || !L.leader) return;
    const ld = L.leader;
    for (const t of list) {
      if (ld.scope === "Element" && t.el !== ld.element) continue;
      if (ld.scope === "Team" && t.def.squad !== ld.team) continue;
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

  // ---------- stats ----------
  const effSpd = u => Math.max(40, u.max.spd * (has(u, "SPD_UP") ? 1.25 : 1) * (has(u, "SLOW") ? .75 : 1));
  const effAtk = u => u.max.atk * (has(u, "ATK_UP") ? 1.5 : 1) * (has(u, "ATK_DOWN") ? .7 : 1) * (u.burstT > 0 ? 1.25 : 1);
  const effDef = u => u.max.def * (has(u, "DEF_UP") ? 1.5 : 1) * (has(u, "DEF_BREAK") ? .6 : 1);
  const effCR = u => clamp(u.max.cr + (has(u, "CRIT_RATE_UP") ? .3 : 0), 0, 1);
  const lvMult = (u, slot) => 1 + .06 * ((u.sk[slot - 1] || 1) - 1);
  const cdTurns = (u, sk) => sk ? Math.max(1, (sk.cd || 3) - ((u.sk[sk.slot - 1] || 1) >= 7 ? 1 : 0)) : 3;
  const cdFor = (u, slot) => {
    const sk = u.skills.find(s => s.slot === slot), sp = 110 / Math.max(60, u.max.spd);
    return slot === 1 ? S1_CD * sp : cdTurns(u, sk) * S2_TURN * sp;
  };
  const coolRate = u => (has(u, "SPD_UP") ? 1.3 : 1) * (has(u, "SLOW") ? .75 : 1);
  function speedUp(u, sec) { u.cool[1] = Math.max(0, u.cool[1] - sec); u.cool[2] = Math.max(0, u.cool[2] - sec); }
  function delay(u, sec) { u.cool[1] += sec * .5; u.cool[2] += sec; }

  // ---------- effects (durations in seconds) ----------
  function addEff(u, id, sec, src, quiet) {
    if (!alive(u)) return;
    const ex = u.eff.find(x => x.id === id);
    if (id === "DOT" || id === "HOT") u.eff.push({ id, t: sec });
    else if (ex) ex.t = Math.max(ex.t, sec);
    else u.eff.push({ id, t: sec });
    if (id === "PROVOKE") u.provokedBy = src;
    if (id === "STUN" && u.rush) u.rush = null;
    if (!quiet) ev({ k: "txt", u: u.uid, s: FX[id].n, c: FX[id].b ? "buff" : "debuff" });
  }
  function removeEff(u, id) { u.eff = u.eff.filter(e => e.id !== id); if (id === "SHIELD") u.shield = 0; if (id === "PROVOKE") u.provokedBy = null; }
  function immuneTo(u, what) { const imm = pv(u, "IMMUNE_LIST"); return imm && (imm.list.includes(what) || imm.list.includes("ANY")); }
  function tryDebuff(att, tar, what, turns, chance = 1) {
    if (!alive(tar) || tar.status !== "field") return false;
    if (immuneTo(tar, what)) { ev({ k: "txt", u: tar.uid, s: "IMMUNE", c: "txt" }); return false; }
    if (R() >= chance) return false;
    if (has(tar, "IMMUNITY")) { ev({ k: "txt", u: tar.uid, s: "IMMUNE", c: "txt" }); return false; }
    if (R() < Math.min(.85, .15 + Math.max(0, tar.max.res - att.max.acc))) { ev({ k: "txt", u: tar.uid, s: "RESIST", c: "txt" }); return false; }
    addEff(tar, what, turns * T_SEC * (what === "STUN" ? .55 : 1), att); return true;
  }
  function heal(u, n, quiet) {
    if (!alive(u) || n <= 0) return;
    if (has(u, "HEAL_BLOCK")) { if (!quiet) ev({ k: "txt", u: u.uid, s: "SPIN LOCKED", c: "debuff" }); return; }
    const g = Math.min(Math.round(n), u.max.hp - u.hp); if (g <= 0) return;
    u.hp += g; if (!quiet) ev({ k: "heal", u: u.uid, n: g });
  }
  function giveShield(u, v, turns) { u.shield += Math.round(v); addEff(u, "SHIELD", (turns || 2) * T_SEC, u, true); ev({ k: "heal", u: u.uid, n: Math.round(v), shield: 1 }); }
  function strip(u, n) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      const pool = u.eff.filter(e => FX[e.id].b && e.id !== "INVINCIBLE"); if (!pool.length) break;
      const e = pool[Math.floor(R() * pool.length)]; u.eff = u.eff.filter(x => x !== e); if (e.id === "SHIELD") u.shield = 0; k++;
    }
    if (k) ev({ k: "txt", u: u.uid, s: "BUFFS REMOVED", c: "debuff" });
  }
  function cleanse(u, n) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      const pool = u.eff.filter(e => !FX[e.id].b); if (!pool.length) break;
      const e = pool[Math.floor(R() * pool.length)]; u.eff = u.eff.filter(x => x !== e); if (e.id === "PROVOKE") u.provokedBy = null; k++;
    }
    if (k) ev({ k: "txt", u: u.uid, s: "CLEANSED", c: "buff" });
  }
  function gainMC(team, n) { B.mc[team] = clamp(B.mc[team] + n, 0, MC_MAX); }

  // ---------- entering the dish ----------
  function enter(u, how, q = .7) {
    const S = B.side[u.team];
    u.status = "field"; S.active = u; S.next = -1;
    const base = u.team === "A" ? Math.PI : 0, a = base + (R() - .5) * .7, r0 = DISH_R * .72;
    u.x = Math.cos(a) * r0; u.z = Math.sin(a) * r0; u.px = u.x; u.pz = u.z;
    // launched in along the wall, already circling
    const sp = 260 + q * 120, tx = -Math.sin(a) * u.orbit, tz = Math.cos(a) * u.orbit;
    u.vx = tx * sp - Math.cos(a) * 90; u.vz = tz * sp - Math.sin(a) * 90;
    u.rush = null; u.kbT = 0;
    if (!u.entered) {
      u.entered = true;
      for (const p of u.passives) if (p.id === "START_BUFF") for (const a2 of p.team ? teamOf(u) : [u]) for (const w of p.what) addEff(a2, w, (p.turns || 2) * T_SEC, u, true);
    }
    ev({ k: "enter", u: u.uid, how, q });
    // a tag-in comes in swinging
    if (how === "tag") { const s1 = u.skills.find(s => s.slot === 1); startRush(u, { ...s1, name: "Tag Attack", mult: (s1.mult || 2) * .6, effects: [] }, { tag: 1 }); }
  }
  function nextIn(S) {
    const list = S.units.filter(x => x.status === "bench");
    if (!list.length) return null;
    return list.sort((a, b) => (a.benchCD > 0) - (b.benchCD > 0) || b.hp / b.max.hp - a.hp / a.max.hp)[0];
  }
  function canTag(side, m) {
    const S = B.side[side], a = activeOf(side);
    return !!(a && !B.over && B.started && !B.freeze && S.tagLock <= 0 && m && m.status === "bench" && !m.tagUsed && m.benchCD <= 0 && !a.rush && !has(a, "STUN"));
  }
  function tagIn(side, m) {
    if (!canTag(side, m)) return false;
    const S = B.side[side], a = S.active;
    a.status = "bench"; a.benchCD = TAG_CD; a.benchGain = 0; a.eff = []; a.shield = 0; a.rush = null; a.provokedBy = null;
    ev({ k: "tagout", u: a.uid });
    m.tagUsed = true; S.tagLock = TAG_LOCK; B.tally.tags++;
    enter(m, "tag");
    return true;
  }

  // ---------- damage ----------
  function knockOut(u, ring, killer) {
    const rev = pv(u, "REVIVE_ONCE");
    if (rev && !u.flags.revived) {
      // Last Stand: clings on (pulled back from the rim) with some Spin left
      u.flags.revived = true; u.hp = Math.max(1, Math.round(u.max.hp * (rev.amount || .3))); u.shield = 0;
      u.eff = u.eff.filter(e => FX[e.id].b);
      if (ring) { const r = Math.hypot(u.x, u.z) || 1; u.x *= (DISH_R * .8) / r; u.z *= (DISH_R * .8) / r; u.vx = -u.x * .8; u.vz = -u.z * .8; }
      ev({ k: "txt", u: u.uid, s: "LAST STAND", c: "buff" }); ev({ k: "revive", u: u.uid });
      addEff(u, rev.buff || "INVINCIBLE", (rev.turns || 1) * T_SEC, u);
      return;
    }
    const S = B.side[u.team];
    u.status = "out"; u.hp = 0; u.eff = []; u.shield = 0; u.rush = null;
    if (S.active === u) S.active = null;
    if (u.team === "E") B.tally.kills++;
    ev({ k: "ko", u: u.uid, ring: !!ring });
    if (killer && alive(killer)) for (const p of killer.passives) {
      if (p.id === "TEAM_ATB_ON_KILL") { speedUp(killer, p.amount * ATB_S); for (const m of B.side[killer.team].units) if (m.status === "bench") m.benchCD = Math.max(0, m.benchCD - p.amount * ATB_S); }
      else if (p.id === "MC_ON_KILL") gainMC(killer.team, Math.round(p.amount * 100));
    }
    if (!S.units.some(alive)) finish(u.team === "E");
    else S.next = 1.1;
  }
  function finish(win) {
    if (B.over) return;
    B.over = true;
    const A = B.side.A.units, left = A.filter(alive).length;
    B.result = { win, alive: left, lost: A.length - left, time: B.t };
    ev({ k: "over", win });
  }
  // a hit: Barrier soaks it first, Invincible ignores it; returns Spin actually lost
  function applyDamage(att, tar, dmg, meta) {
    if (!alive(tar)) return 0;
    if (has(tar, "INVINCIBLE")) { ev({ k: "txt", u: tar.uid, s: "INVINCIBLE", c: "txt" }); return 0; }
    let dealt = dmg;
    if (!meta.trueDmg && tar.shield > 0) { const soak = Math.min(tar.shield, dealt); tar.shield -= soak; dealt -= soak; if (tar.shield <= 0) { tar.shield = 0; removeEff(tar, "SHIELD"); } }
    tar.hp -= dealt;
    if (!meta.quiet) ev({ k: "hit", u: tar.uid, a: att && att.uid, n: dmg, crit: !!meta.crit, glance: !!meta.glance, adv: meta.adv, kind: meta.kind, x: tar.x, z: tar.z, big: !!meta.big, delay: meta.delay || 0 });
    if (att) B.dmgDone[att.uid] = (B.dmgDone[att.uid] || 0) + dmg;
    return dealt;
  }
  // type traits and damage Abilities: an additive damage bonus and a multiplier on damage taken
  function dmgMods(att, tar, sk) {
    let bonus = 0, taken = 1;
    if (att.el === "Attack") bonus += ATK_SMASH;
    if (sk && sk.arc && att.el === "Balance") bonus += BAL_BIT;
    for (const p of att.passives) {
      if (p.id === "BLOOD_HEAT" && att.hp < att.max.hp * p.below) bonus += p.amount;
      else if (p.id === "EXECUTE" && tar.hp < tar.max.hp * p.below) bonus += p.amount;
      else if (p.id === "BONUS_VS_DEBUFFED" && tar.eff.some(x => !FX[x.id].b)) bonus += p.amount;
    }
    if (tar.el === "Defense") taken *= 1 - DEF_GUARD;
    const dr = pv(tar, "DMG_REDUCE"); if (dr) taken *= 1 - dr.amount;
    let td = 0; for (const a of teamOf(tar)) { const p = pv(a, "TEAM_DMG_REDUCE"); if (p) td = Math.max(td, p.amount); }
    return { bonus, taken: taken * (1 - td) };
  }
  // one hit of a move (the old attack formula, scaled for real time); applies the move's on-hit effects
  function attackOnce(att, tar, sk, opts = {}) {
    if (!alive(att) || !alive(tar) || tar.status !== "field") return 0;
    const rel = elementRel(att.el, tar.el);
    const glance = (rel === "dis" && R() < .5) || (has(att, "GLANCING") && R() < .5);
    let critChance = effCR(att) + (rel === "adv" ? .15 : 0), bonus = 0;
    for (const e of sk.effects || []) {
      if (e.type === "bonusIf" && has(tar, e.cond)) { bonus += e.bonusDmg || 0; critChance += e.bonusCrit || 0; }
      if (e.type === "bonusPerDebuff") bonus += Math.min(e.cap || 0, tar.eff.filter(x => !FX[x.id].b).length * (e.per || 0));
    }
    const crit = !glance && R() < critChance;
    const mitig = 1000 / (1000 + Math.max(0, effDef(tar) * (1 - (sk.ignoreDef || 0))));
    let dmg = effAtk(att) * (sk.mult || 1) * lvMult(att, sk.slot || 1) * mitig * DMG_K * (opts.scale || 1);
    if (crit) dmg *= 1 + att.max.cd;
    const M = dmgMods(att, tar, sk);
    dmg *= (1 + (rel === "adv" ? .15 : 0) + (glance ? -.3 : 0) + bonus + M.bonus) * (has(tar, "BRAND") ? 1.25 : 1) * M.taken;
    dmg = Math.max(1, Math.round(dmg));
    const big = !!(sk.arc || dmg > tar.max.hp * .22);
    const dealt = applyDamage(att, tar, dmg, { crit, glance, adv: rel === "adv", kind: opts.kind || "rush", big, delay: opts.delay });
    if (dealt > 0) gainMC(tar.team, 2);
    if (tar.status === "field" && tar.el === "Defense" && !tar.flags.spark && tar.hp > 0 && tar.hp < tar.max.hp / 2) {
      tar.flags.spark = true; ev({ k: "txt", u: tar.uid, s: "IRON WALL", c: "buff" }); cleanse(tar, 9);
    }
    // on-hit Talents (scaled down per hit so multi-hit moves don't trigger them many times over)
    const per = 1 / (sk.hits || 1);
    if (tar.hp > 0 && dmg > 0) {
      const oh = pv(tar, "ON_HIT_ATB"); if (oh) speedUp(tar, oh.amount * ATB_S * per);
      const hd = pv(tar, "HIT_DEBUFF"); if (hd && !opts.counter) tryDebuff(tar, att, hd.what, hd.turns || 2, hd.chance * per);
    }
    const cdb = pv(att, "CRIT_DEBUFF"); if (crit && cdb && tar.hp > 0) tryDebuff(att, tar, cdb.what, cdb.turns || 2, cdb.chance);
    if (!opts.counter) for (const e of sk.effects || []) {
      if (e.on === "target" || e.on === "enemy" || e.on === "aoe_enemies") {
        if (e.type === "debuff") tryDebuff(att, tar, e.what, e.turns || 1, e.chance ?? 1);
        else if (e.type === "atkbar-") { if (e.chance == null || R() < e.chance) delay(tar, (e.amount || 0) * ATB_S * per); }
        else if (e.type === "strip") { if ((e.chance ?? 1) >= 1 || R() < e.chance) strip(tar, e.amount || 1); }
      }
    }
    const ls = pv(att, "LIFESTEAL"); if (ls && dealt > 0) heal(att, dealt * (ls.amount || .2), true);
    if (att.P.absorb && dealt > 0) heal(att, dealt * att.P.absorb, true);
    if (tar.hp <= 0) { tar.hp = 0; knockOut(tar, !!(crit || sk.arc || big) && R() < .8, att); }
    return dealt;
  }
  // counter-spin: the rushed Beyblade hits straight back
  function maybeCounter(tar, att) {
    if (!alive(tar) || !alive(att) || tar.status !== "field") return;
    const pc = pv(tar, "COUNTER");
    if ((has(tar, "COUNTER") && R() < .3) || (pc && R() < pc.chance)) {
      ev({ k: "txt", u: tar.uid, s: "COUNTER", c: "buff" });
      const s1 = tar.skills.find(s => s.slot === 1);
      attackOnce(tar, att, { ...s1, effects: [] }, { counter: 1, kind: "counter", scale: .6 });
    }
  }
  function knockback(a, t, power) {
    const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d;
    const ratio = clamp(effAtk(a) / (effAtk(a) + effDef(t)) * 2, .55, 1.5);
    const resist = t.mass * (1 + Math.max(-.3, t.P.guard) + (has(t, "TAUNT") ? 1.5 : 0));
    const kb = 230 * power * a.P.smash * ratio / resist;
    t.vx += nx * kb; t.vz += nz * kb; t.kbT = .7;
    a.vx -= nx * kb * .35 * t.mass / a.mass; a.vz -= nz * kb * .35 * t.mass / a.mass;
    return kb;
  }

  // ---------- moves ----------
  function ready(u, slot) {
    const sk = u.skills.find(s => s.slot === slot); if (!sk || u.status !== "field" || B.freeze || !B.started || B.over) return false;
    if (has(u, "STUN") || u.rush) return false;
    if (slot > 1 && (has(u, "SILENCE") || has(u, "PROVOKE"))) return false;
    if (slot === 3) return B.mc[u.team] >= (sk.arc || 100);
    return (u.cool[slot] || 0) <= 0;
  }
  function startRush(u, sk, o = {}) {
    u.rush = { sk, t: 0, max: o.max || (sk.slot === 1 && !o.tag ? .75 : 1.6), speed: (o.speed || 680) * (sk.slot === 3 ? 1.35 : sk.slot === 2 ? 1.15 : 1), kb: o.kb || (sk.slot === 3 ? 2.1 : sk.slot === 2 ? 1.35 : 1), sure: sk.slot > 1 || o.tag };
    ev({ k: "rush", u: u.uid, slot: sk.slot, tag: !!o.tag });
  }
  function landRush(u, t) {
    const R0 = u.rush; u.rush = null;
    if (has(t, "STEALTH") && !R0.sk.arc) {
      removeEff(t, "STEALTH"); ev({ k: "miss", u: t.uid, a: u.uid });
      u.vx *= .4; u.vz *= .4; return;
    }
    const sk = R0.sk, n = sk.hits || 1;
    let dealt = 0;
    for (let h = 0; h < n && alive(t) && t.status === "field"; h++) dealt += attackOnce(u, t, sk, { kind: "rush", delay: h * .09 });
    if (sk.slot === 1) gainMC(u.team, 5);
    if (t.status === "field") { knockback(u, t, R0.kb); if (!sk.arc) maybeCounter(t, u); }
    // recoil: smashing costs a little of the attacker's own Spin
    if (dealt > 0 && alive(u) && !has(u, "INVINCIBLE")) {
      const rc = Math.round(dealt * .1 * u.P.recoil);
      if (rc > 0) { u.hp -= rc; ev({ k: "hit", u: u.uid, n: rc, kind: "recoil", x: u.x, z: u.z }); if (u.hp <= 0) { u.hp = 0; knockOut(u, false, t); } }
    }
  }
  // area moves become a shockwave across the dish: no rush needed, weaker the farther the rival is
  function shockwave(u, t, sk) {
    ev({ k: "wave", u: u.uid, x: u.x, z: u.z, big: !!sk.arc });
    if (!t) return;
    const d = Math.hypot(t.x - u.x, t.z - u.z), f = d < 360 ? 1 : .72, n = sk.hits || 1;
    for (let h = 0; h < n && alive(t) && t.status === "field"; h++) attackOnce(u, t, sk, { kind: "wave", scale: f, delay: .12 + h * .1 });
    if (t.status === "field") knockback(u, t, (sk.arc ? 1.6 : .8) * f);
  }
  function applyEffect(actor, e, sk) {
    if (e.onKill || e.type === "bonusIf" || e.type === "bonusPerDebuff") return;
    if (e.on === "target" || e.on === "enemy" || e.on === "aoe_enemies") {
      if ((sk.mult || 0) > 0) return;
      const t = rivalOf(actor); if (!t) return;
      if (e.type === "atkbar-") { if (e.chance == null || R() < e.chance) delay(t, (e.amount || 0) * ATB_S); }
      else if (e.type === "debuff") tryDebuff(actor, t, e.what, e.turns || 1, e.chance ?? 1);
      else if (e.type === "strip") strip(t, e.amount || 1);
      return;
    }
    if (e.chance != null && e.type !== "debuff" && R() >= e.chance) return;
    // "team" effects reach the Beyblade in the dish and its partners on the bench
    const list = e.on === "self" ? [actor] : teamOf(actor);
    for (const a of list) {
      if (e.type === "buff") { if (a.status === "field") addEff(a, e.what, (e.turns || 1) * T_SEC, actor); }
      else if (e.type === "taunt") addEff(a, "TAUNT", (e.turns || 1) * T_SEC, actor);
      else if (e.type === "atkbar+") { if (a.status === "field") speedUp(a, (e.amount || 0) * ATB_S); else a.benchCD = Math.max(0, a.benchCD - (e.amount || 0) * ATB_S); }
      else if (e.type === "healPct") heal(a, a.max.hp * (e.amount || 0));
      else if (e.type === "healPctTarget") heal(a, a.max.hp * (e.amount || 0));
      else if (e.type === "healFlatCasterHP") heal(a, actor.max.hp * (e.amount || 0));
      else if (e.type === "cleanse") cleanse(a, e.amount || 1);
      else if (e.type === "shieldCasterHP") { if (a.status === "field") giveShield(a, actor.max.hp * (e.amount || 0), e.turns); }
    }
  }
  function useSkill(u, slot) {
    if (!ready(u, slot)) return false;
    const sk = u.skills.find(s => s.slot === slot);
    if (slot === 3) {
      // the Bit-Beast rises: everything pauses while it appears, then the attack goes off
      gainMC(u.team, -(sk.arc || 100));
      if (u.team === "A") B.tally.arcs++;
      B.freeze = ARC_FREEZE; B.pendingArc = { u, sk };
      ev({ k: "arc", u: u.uid, name: sk.name });
      return true;
    }
    execSkill(u, sk);
    return true;
  }
  function execSkill(u, sk) {
    const t = rivalOf(u), anim = animFor(u, sk);
    ev({ k: "use", u: u.uid, slot: sk.slot, name: sk.name, anim });
    if ((sk.mult || 0) > 0) { if (sk.target === "aoe_enemies") shockwave(u, t, sk); else if (t) startRush(u, sk); }
    for (const e of sk.effects || []) applyEffect(u, e, sk);
    if (sk.slot === 1) u.cool[1] = cdFor(u, 1);
    else if (sk.slot === 2) { u.cool[2] = cdFor(u, 2); gainMC(u.team, 4); }
    const xt = pv(u, "EXTRA_TURN");
    if (xt && sk.slot < 3 && R() < xt.chance) { u.cool[sk.slot] = 0; ev({ k: "txt", u: u.uid, s: "READY AGAIN", c: "buff" }); }
    if (sk.arc) for (const p of u.passives) {
      if (p.id === "ARC_TEAM_ATB") for (const a of teamOf(u)) { if (a.status === "field") speedUp(a, p.amount * ATB_S); else a.benchCD = Math.max(0, a.benchCD - p.amount * ATB_S); }
      else if (p.id === "ARC_TEAM_HEAL") for (const a of teamOf(u)) heal(a, a.max.hp * p.amount);
      else if (p.id === "ARC_SELF_ATB") speedUp(u, p.amount * ATB_S);
    }
  }

  // ---------- physics ----------
  function steer(u) {
    const P = u.P, sf = .35 + .65 * spinFrac(u), foe = rivalOf(u), stalled = has(u, "STUN");
    const vmax = 270 * P.speed * Math.sqrt(effSpd(u) / 110) * sf * (u.burstT > 0 ? 1.35 : 1) * (has(u, "SLOW") ? .8 : 1);
    let ax = -BOWL_K * u.x, az = -BOWL_K * u.z;
    if (u.rush && foe) {
      // rushing: home in hard on the rival
      const dx = foe.x - u.x, dz = foe.z - u.z, d = Math.hypot(dx, dz) || 1, sp = u.rush.speed * (.6 + .4 * sf);
      const k = Math.min(1, 12 * DT);
      u.vx += (dx / d * sp - u.vx) * k; u.vz += (dz / d * sp - u.vz) * k; ax = 0; az = 0;
    } else if (!stalled) {
      const r = Math.hypot(u.x, u.z) + 1e-6;
      let dx = -u.z / r * u.orbit, dz = u.x / r * u.orbit;
      if (foe) { const fx = foe.x - u.x, fz = foe.z - u.z, fd = Math.hypot(fx, fz) + 1e-6, ag = P.aggro + (u.provokedBy === foe && has(u, "PROVOKE") ? .9 : 0); dx += fx / fd * ag; dz += fz / fd * ag; }
      const cen = (P.center + (has(u, "TAUNT") ? 1.2 : 0)) * (r / DISH_R) * 2; dx -= u.x / r * cen; dz -= u.z / r * cen;
      const dl = Math.hypot(dx, dz) + 1e-6, k = DRIVE_K * P.drive;
      ax += (dx / dl * vmax - u.vx) * k; az += (dz / dl * vmax - u.vz) * k;
      const j = (1 - sf) * 520 + 50; ax += (R() - .5) * j; az += (R() - .5) * j;
    } else { ax += (R() - .5) * 240; az += (R() - .5) * 240; }
    u.vx += ax * DT; u.vz += az * DT;
    const fr = Math.exp(-DT * (stalled ? 1.8 : .3)); u.vx *= fr; u.vz *= fr;
    u.px = u.x; u.pz = u.z;
    u.x += u.vx * DT; u.z += u.vz * DT;
  }
  function rim(u) {
    const r = Math.hypot(u.x, u.z), lim = DISH_R - u.r * .7;
    if (r <= lim) return;
    const nx = u.x / r, nz = u.z / r, vr = u.vx * nx + u.vz * nz;
    const pocket = POCKETS.some(p => angDiff(Math.atan2(u.z, u.x), p) < .1);
    const thr = 430 * (1 + Math.max(-.3, u.P.guard)) * (.55 + .9 * spinFrac(u)) * (pocket ? .62 : 1) * (u.boss ? 1.25 : 1);
    if (u.kbT > 0 && vr > thr && !has(u, "TAUNT") && !has(u, "INVINCIBLE")) { knockOut(u, true, rivalOf(u)); return; }
    u.x = nx * lim; u.z = nz * lim;
    if (vr > 0) {
      u.vx -= 1.5 * vr * nx; u.vz -= 1.5 * vr * nz;
      if (vr > 140) { const loss = Math.round(u.max.hp * .012 * (vr / 400)); u.hp -= loss; ev({ k: "hit", u: u.uid, n: loss, kind: "wall", x: u.x, z: u.z, quiet: 1 }); if (u.hp <= 0) { u.hp = 0; knockOut(u, false, rivalOf(u)); } }
    }
  }
  function collide(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || .01, min = a.r + b.r;
    if (a.rush && d < min + 8) { landRush(a, b); return; }
    if (b.rush && d < min + 8) { landRush(b, a); return; }
    if (d >= min) return;
    const nx = dx / d, nz = dz / d, over = min - d, tm = a.mass + b.mass;
    a.x -= nx * over * b.mass / tm; a.z -= nz * over * b.mass / tm; b.x += nx * over * a.mass / tm; b.z += nz * over * a.mass / tm;
    const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
    if (rel >= 0) return;
    // opposite spins collide violently; same spins grind together
    const opp = a.P.spin === "D" || b.P.spin === "D" || a.orbit !== b.orbit, e = opp ? .85 : .5;
    const j = -(1 + e) * rel / (1 / a.mass + 1 / b.mass);
    a.vx -= j / a.mass * nx; a.vz -= j / a.mass * nz; b.vx += j / b.mass * nx; b.vz += j / b.mass * nz;
    if (opp) { const tx = -nz, tz = nx, s = (R() - .5) * 120; a.vx += tx * s; a.vz += tz * s; b.vx -= tx * s; b.vz -= tz * s; }
    const impact = -rel;
    if (impact < 90 || B.t - B.pairT < .35) return;
    B.pairT = B.t;
    a.kbT = b.kbT = .4;
    ev({ k: "clash", x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, p: impact, opp });
    gainMC("A", 1); gainMC("E", 1);
    const clashHit = (att, tar) => {
      if (has(tar, "INVINCIBLE")) return 0;
      const rel2 = elementRel(att.el, tar.el), mitig = 1000 / (1000 + effDef(tar)), M = dmgMods(att, tar, null);
      let dmg = CLASH_K * effAtk(att) * Math.sqrt(att.P.smash) * clamp(impact / 300, .4, 2) * mitig * (opp ? 1.15 : .8) * (1 + (rel2 === "adv" ? .15 : 0) + M.bonus) * M.taken;
      dmg = Math.max(1, Math.round(dmg));
      const dealt = applyDamage(att, tar, dmg, { kind: "clash", adv: rel2 === "adv" });
      if (att.P.absorb && dealt > 0) heal(att, dealt * att.P.absorb, true);
      // same-spin grinding: the one spinning harder drains the other
      if (!opp && dealt > 0 && att.hp > tar.hp) heal(att, dealt * .3, true);
      return dealt;
    };
    const da = clashHit(b, a), db = clashHit(a, b);
    if (da > 0) gainMC(a.team, 1); if (db > 0) gainMC(b.team, 1);
    if (a.hp <= 0 && a.status === "field") { a.hp = 0; knockOut(a, false, b); }
    if (b.hp <= 0 && b.status === "field") { b.hp = 0; knockOut(b, false, a); }
  }

  // ---------- per-tick upkeep ----------
  function upkeep(u) {
    // effects run down; Friction and Spin Recovery work every second
    let dots = 0, hots = 0;
    for (const e of u.eff) { e.t -= DT; if (e.id === "DOT") dots++; else if (e.id === "HOT") hots++; }
    const had = u.eff.length; u.eff = u.eff.filter(e => e.t > 0);
    if (had !== u.eff.length) { if (!u.eff.some(e => e.id === "SHIELD")) u.shield = 0; if (!u.eff.some(e => e.id === "PROVOKE")) u.provokedBy = null; }
    if (dots && !has(u, "INVINCIBLE")) u.hp -= u.max.hp * .02 * dots * DT;
    if (hots) heal(u, u.max.hp * .02 * hots * DT, true);
    const rg = pv(u, "REGEN"); if (rg) heal(u, u.max.hp * rg.amount / T_SEC * DT, true);
    // natural spin-down: stamina from parts and type slows it
    if (!has(u, "INVINCIBLE")) u.hp -= u.max.hp * DECAY * clamp(1 - u.P.stamina, .45, 1.8) * DT;
    for (const s of [1, 2]) if (u.cool[s] > 0) u.cool[s] = Math.max(0, u.cool[s] - DT * coolRate(u));
    if (u.burstT > 0) u.burstT -= DT;
    if (u.kbT > 0) u.kbT -= DT;
    // Engine Gear: the spring lets go the first time Spin falls below half
    if (u.P.burst && !u.flags.burst && u.hp < u.max.hp * .5 && u.hp > 0) {
      u.flags.burst = true; u.burstT = 2.6 * u.P.burst; ev({ k: "burst", u: u.uid }); ev({ k: "txt", u: u.uid, s: "ENGINE GEAR!", c: "buff" });
    }
    if (u.rush) { u.rush.t += DT; if (u.rush.t > u.rush.max) { if (u.rush.sure && rivalOf(u)) { const t = rivalOf(u); u.x = t.x - (t.x - u.x) * .2; u.z = t.z - (t.z - u.z) * .2; landRush(u, t); } else u.rush = null; } }
    if (u.hp <= 0 && u.status === "field") { u.hp = 0; knockOut(u, false, rivalOf(u)); }
  }
  function bench(u) {
    if (u.benchCD > 0) u.benchCD = Math.max(0, u.benchCD - DT);
    if (u.entered && u.benchGain < BENCH_CAP && u.hp < u.max.hp) { const g = Math.min(u.max.hp * BENCH_HEAL * DT, u.max.hp - u.hp, u.max.hp * (BENCH_CAP - u.benchGain)); u.hp += g; u.benchGain += g / u.max.hp; }
    for (const s of [1, 2]) if (u.cool[s] > 0) u.cool[s] = Math.max(0, u.cool[s] - DT);
  }

  // ---------- AI ----------
  const REACT = { balanced: .14, aggressive: .3, safe: .08 };
  // B.pilot (set by the demo) receives your side's AI decisions ("atk", "s2", "s3", "tag:<uid>") and presses the button
  // itself; one decision at a time
  function ai(side) {
    const S = B.side[side], u = activeOf(side); if (!u || B.freeze) return;
    if (side === "A" && B.pilot && B.pilotBusy) return;
    const go = (a, fn) => { if (side === "A" && B.pilot) { B.pilotBusy = true; B.pilot(a); } else fn(); };
    const t = rivalOf(u), style = side === "A" ? B.aiStyle : "balanced";
    const react = REACT[style] || .14;
    // tag out a Beyblade that's spinning down when a fresher partner is ready
    const fresh = S.units.filter(m => canTag(side, m)).sort((a, b) => b.hp / b.max.hp - a.hp / a.max.hp)[0];
    const sf = spinFrac(u);
    if (fresh && sf < (style === "safe" ? .4 : .3) && spinFrac(fresh) > sf + .25 && R() < .05) { go("tag:" + fresh.uid, () => tagIn(side, fresh)); return; }
    if (!t) return;
    const d = Math.hypot(t.x - u.x, t.z - u.z);
    const s2 = u.skills.find(s => s.slot === 2), s3 = u.skills.find(s => s.slot === 3);
    if (ready(u, 3) && !has(t, "INVINCIBLE")) {
      const nearRim = Math.hypot(t.x, t.z) > DISH_R * .62;
      if (B.mc[side] >= 200 || spinFrac(t) < .45 || nearRim || style === "aggressive" || R() < .01) { go("s3", () => useSkill(u, 3)); return; }
    }
    if (ready(u, 2) && s2) {
      const support = !(s2.mult > 0), heals = (s2.effects || []).some(e => /heal/i.test(e.type));
      if (support ? (!heals || sf < .75 || teamOf(u).some(m => m.hp < m.max.hp * .6)) : (d < 620 && R() < react * 1.5)) { go("s2", () => useSkill(u, 2)); return; }
    }
    if (ready(u, 1) && d < 560 && R() < react) go("atk", () => useSkill(u, 1));
  }

  // ---------- the loop ----------
  B.tick = () => {
    if (B.over || !B.started) return;
    if (B.freeze > 0) {
      B.freeze -= DT;
      if (B.freeze <= 0) { B.freeze = 0; const p = B.pendingArc; B.pendingArc = null; if (p && p.u.status === "field") { ev({ k: "arcgo", u: p.u.uid }); execSkill(p.u, p.sk); } }
      return;
    }
    B.t += DT;
    for (const sk of ["A", "E"]) {
      const S = B.side[sk];
      if (S.tagLock > 0) S.tagLock -= DT;
      if (S.next >= 0 && !S.active) { S.next -= DT; if (S.next <= 0) { const n = nextIn(S); if (n) enter(n, "ko"); } }
      for (const u of S.units) if (u.status === "bench") bench(u);
      const a = activeOf(sk);
      if (a) { gainMC(sk, .6 * (a.el === "Balance" ? 2 : 1) * DT); upkeep(a); }
    }
    for (const sk of ["A", "E"]) { const a = activeOf(sk); if (a) steer(a); }
    const a = activeOf("A"), e = activeOf("E");
    if (a && e) collide(a, e);
    for (const sk of ["A", "E"]) { const u = activeOf(sk); if (u) rim(u); }
    if (B.over) return;
    if (B.auto) ai("A");
    ai("E");
    if (B.t >= TIME_LIMIT) {
      const left = s => B.side[s].units.reduce((x, u) => x + (alive(u) ? u.hp / u.max.hp : 0), 0);
      ev({ k: "txt", u: (activeOf("A") || {}).uid, s: "TIME UP", c: "txt" });
      finish(left("A") >= left("E"));
    }
  };
  // the player's buttons: "atk" (S1), "s2", "s3", or "tag:<uid>"
  B.press = act => {
    if (B.over || !B.started) return false;
    if (act.startsWith("tag:")) { const m = B.side.A.units.find(x => x.uid === +act.slice(4)); return tagIn("A", m); }
    const u = activeOf("A"); if (!u) return false;
    return useSkill(u, act === "atk" ? 1 : act === "s2" ? 2 : 3);
  };
  B.ready = (u, slot) => ready(u, slot);
  B.canTag = (side, m) => canTag(side, m);
  B.activeOf = activeOf;
  B.has = has;
  B.byId = uid => B.units.find(x => x.uid === uid);
  B.effStat = { spd: effSpd, atk: effAtk, def: effDef, cr: effCR };
  B.cdFor = cdFor;
  // launch: q is the launch quality (0–1) for each side; a great launch starts with extra Bit Power and speed
  B.start = (qA = .7, qE = .7) => {
    if (B.started) return;
    B.started = true;
    for (const [s, q] of [["A", qA], ["E", qE]]) {
      const S = B.side[s], first = S.units[0]; if (!first) continue;
      enter(first, "start", q);
      if (q >= .9) { gainMC(s, 25); addEff(first, "SPD_UP", 3, first, true); ev({ k: "txt", u: first.uid, s: "PERFECT LAUNCH!", c: "buff" }); }
      else if (q >= .6) gainMC(s, 10);
      else if (q < .3) { first.hp = Math.round(first.hp * .92); ev({ k: "txt", u: first.uid, s: "WEAK LAUNCH", c: "debuff" }); }
    }
  };

  // ---------- setup ----------
  for (const [s, list] of [["A", cfg.allies], ["E", cfg.foes]]) {
    const units = list.slice(0, 3).map((spec, i) => buildUnit(spec, s, i));
    B.side[s].units = units; B.units.push(...units);
    applyLeader(units[0], units);
    for (const u of units) {
      // techniques start half charged; turn-meter Abilities charge them further
      u.cool[2] = cdFor(u, 2) * .5;
      for (const p of u.passives) {
        if (p.id === "TEAM_ATB_START") for (const m of units) m.cool[2] = Math.max(0, m.cool[2] - p.amount * cdFor(m, 2));
        else if (p.id === "SELF_ATB_START") u.cool[2] = Math.max(0, u.cool[2] - p.amount * cdFor(u, 2));
        else if (p.id === "MC_START") gainMC(s, Math.round(p.amount * 100));
      }
    }
  }
  return B;
}
