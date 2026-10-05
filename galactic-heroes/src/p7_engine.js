
// =====================================================================
//  BATTLE ENGINE — pure rules. Produces an event list (B.ev) that the
//  renderer plays back with animation and camera work.
// =====================================================================
let UID = 0;
function stat(u, k) {
  let v = u.max[k];
  const h = id => u.eff.some(e => e.id === id);
  if (k === "off") { if (h("offUp")) v *= 1.5; if (h("offDown")) v *= .5; }
  else if (k === "armor") { if (h("defUp")) v += 20; if (h("defDown")) v -= 20; }
  else if (k === "spd") { let m = 1; if (h("spdUp")) m += .3; if (h("spdDown")) m -= .3; v *= m; }
  else if (k === "crit") { if (h("critUp")) v += .3; }
  else if (k === "ten") { if (h("tenUp")) v += .5; if (h("tenDown")) v -= .5; }
  return v;
}
function leadMatch(lead, u) {
  if (!lead.tag) return true;
  const tags = Array.isArray(lead.tag) ? lead.tag : [lead.tag];
  return tags.some(t => u.def.tags.includes(t));
}
function defaultAnim(u, ab) {
  if (ab.anim) return ab.anim;
  const w = u.def.fig.w, melee = /saber|staff/.test(w);
  if (ab.tgt === "allies" || ab.tgt === "self" || ab.tgt === "ally") return "buff";
  if (ab.tgt === "enemies") return melee ? "spin" : "volley";
  return melee ? "melee" : w === "none" ? "zap" : "shoot";
}

function makeBattle(cfg) {
  const B = { units: [], ev: [], wave: 0, waves: cfg.waves, over: false, result: null, turn: 0, actor: null, waiting: null,
    leaders: { A: null, E: null }, auto: false, depth: 0, dmgDone: {}, pendingWave: false, allyCount: cfg.allies.length };
  const ev = e => B.ev.push(e);
  const fxEv = u => ev({ k: "fx", u: u.uid, list: u.eff.map(e => [e.id, e.st]) });

  function makeUnit(id, prog, team, boss, slot) {
    const def = CH[id], s = calcStats(id, prog);
    if (boss) { s.hp = Math.round(s.hp * 1.8); s.prot = Math.round(s.prot * 1.5); s.off = Math.round(s.off * 1.15); }
    return { uid: ++UID, id, def, team, prog, max: s, hp: s.hp, prot: s.prot, tm: R() * 12, eff: [], cd: def.ab.map(() => 0),
      alive: true, boss: !!boss, vars: {}, slot };
  }
  function applyStats(u, m) {
    if (!m) return;
    if (m.hpPct) u.max.hp = Math.round(u.max.hp * (1 + m.hpPct));
    if (m.protPct) u.max.prot = Math.round(u.max.prot * (1 + m.protPct));
    if (m.offPct) u.max.off = Math.round(u.max.off * (1 + m.offPct));
    for (const k of ["spd", "crit", "pot", "ten", "armor", "critDmg"]) if (m[k]) u.max[k] += m[k];
  }
  function prepTeam(list, L) {
    for (const u of list) {
      applyStats(u, u.def.uq && u.def.uq.stats);
      if (L && leadMatch(L.def.lead, u)) applyStats(u, L.def.lead.stats);
      u.hp = u.max.hp; u.prot = u.max.prot;
    }
  }
  function runStart(list, L) {
    for (const u of list) { const h = u.def.uq && u.def.uq.on && u.def.uq.on.start; if (h && u.alive) h(u, E); }
    if (L && L.def.lead.on && L.def.lead.on.start) L.def.lead.on.start(L, E);
  }
  function spawnWave(w, first) {
    B.wave = w;
    const list = B.waves[w].map((e, i) => makeUnit(e.id, e, "E", e.boss, i));
    B.units.push(...list);
    B.leaders.E = list[0] && list[0].def.lead ? list[0] : null;
    prepTeam(list, B.leaders.E);
    ev({ k: "wave", w, units: list.map(x => x.uid) });
    if (!first) runStart(list, B.leaders.E);
    return list;
  }

  function emit(name, info) {
    if (B.depth > 6) return;
    B.depth++;
    for (const u of B.units.slice()) {
      const h = u.def.uq && u.def.uq.on && u.def.uq.on[name];
      if (h && (u.alive || (name === "death" && info.unit === u))) h(u, E, info);
    }
    for (const team of ["A", "E"]) {
      const L = B.leaders[team], h = L && L.def.lead.on && L.def.lead.on[name];
      if (h) h(L, E, info);
    }
    B.depth--;
  }
  function removeEff(u, id) { const n = u.eff.length; u.eff = u.eff.filter(e => e.id !== id); if (u.eff.length !== n) fxEv(u); }
  function addEff(u, id, turns) {
    let e = u.eff.find(x => x.id === id);
    if (e) { e.turns = Math.max(e.turns, turns); if (id === "dot") e.st = Math.min(5, (e.st || 1) + 1); }
    else { e = { id, turns, st: 1 }; u.eff.push(e); }
    e.skip = u === B.actor;
    ev({ k: "txt", u: u.uid, s: FX[id].n, c: FX[id].b ? "buff" : "debuff" });
    fxEv(u);
  }
  function kill(u, killer) {
    u.alive = false; u.hp = 0; u.prot = 0; u.eff = []; u.tm = 0;
    ev({ k: "death", u: u.uid });
    emit("death", { unit: u, killer });
  }
  function applyDamage(t, dmg, crit, src, bypass) {
    const p = bypass ? 0 : Math.min(t.prot, dmg);
    t.prot -= p; t.hp -= dmg - p;
    ev({ k: "dmg", u: t.uid, n: dmg, crit, hp: Math.max(0, t.hp), prot: t.prot, dot: !!bypass });
    if (t.hp <= 0) kill(t, src);
  }
  function dealDamage(src, t, mult, o, c) {
    if (!t.alive || !src.alive) return { hit: false };
    if (!o.noEvade && !E.has(t, "stun")) {
      if (E.has(t, "foresight")) { removeEff(t, "foresight"); ev({ k: "txt", u: t.uid, s: "EVADED", c: "txt", evade: 1 }); return { hit: false, evaded: true }; }
      if (R() < .02) { ev({ k: "txt", u: t.uid, s: "EVADED", c: "txt", evade: 1 }); return { hit: false, evaded: true }; }
    }
    let dmg = stat(src, "off") * mult * (.92 + R() * .16);
    if (src.def.uq && src.def.uq.dmgMod) dmg *= src.def.uq.dmgMod(src, t, E);
    let bonus = o.bonus || 0; if (o.bonusFn) bonus += o.bonusFn(t);
    dmg *= 1 + bonus;
    dmg *= 1 - clamp(stat(t, "armor"), 0, 85) / 100;
    const adv = E.has(src, "advantage");
    const crit = adv || R() < stat(src, "crit") + (o.critBonus || 0);
    if (adv) removeEff(src, "advantage");
    if (crit) dmg *= stat(src, "critDmg");
    if (E.has(t, "expose")) { dmg += t.max.hp * .15; removeEff(t, "expose"); }
    dmg = Math.max(1, Math.round(dmg));
    B.dmgDone[src.uid] = (B.dmgDone[src.uid] || 0) + dmg;
    applyDamage(t, dmg, crit, src);
    if (t.alive) emit("hit", { src, tgt: t, dmg, crit, o: { counter: !!(c && c.counter) } });
    return { hit: true, crit, dmg, killed: !t.alive };
  }
  function targetable(u) {
    const en = E.enemies(u);
    const ta = en.filter(x => E.has(x, "taunt")); if (ta.length) return ta;
    const vis = en.filter(x => !E.has(x, "stealth")); return vis.length ? vis : en;
  }
  function pickTarget(u, list) {
    let best = null, bs = -Infinity;
    for (const t of list) {
      const ehp = t.hp + t.prot, est = stat(u, "off") * 1.2 * (1 - stat(t, "armor") / 100);
      let s = 1 - ehp / (t.max.hp + t.max.prot);
      if (est >= ehp) s += 2;
      if (E.has(t, "foresight")) s -= .8;
      s += E.debuffs(t).length * .05 + R() * .35 + (t.def.role === "Support" ? .1 : t.def.role === "Attacker" ? .08 : 0);
      if (s > bs) { bs = s; best = t; }
    }
    return best;
  }
  function runAbility(u, i, t, flags) {
    const ab = u.def.ab[i];
    const c = { u, t, ab, i, lv: 1 + .08 * ((u.prog.ab && u.prog.ab[i]) || 1) - .08, anim: defaultAnim(u, ab), ...flags };
    ab.run(c, E);
  }

  const E = {
    r: R, B,
    allies: u => B.units.filter(x => x.team === u.team && x.alive),
    enemies: u => B.units.filter(x => x.team !== u.team && x.alive),
    tag: (u, t) => u.def.tags.includes(t),
    has: (u, id) => u.eff.some(e => e.id === id),
    debuffs: u => u.eff.filter(e => !FX[e.id].b),
    buffs: u => u.eff.filter(e => FX[e.id].b),
    once(u, k) { if (u.vars["o_" + k]) return false; u.vars["o_" + k] = 1; return true; },
    text(u, s, c = "txt") { ev({ k: "txt", u: u.uid, s, c }); },
    mod(u, k, v) { u.max[k] += v; },
    hit(c, m, o = {}) {
      const u = c.u;
      if (!u.alive) return o.aoe ? [] : { hit: false };
      if (o.aoe) {
        const ts = E.enemies(u);
        ev({ k: "atk", a: u.uid, t: ts.map(x => x.uid), anim: c.anim, aoe: 1, sp: c.i > 0 });
        return ts.map(t => Object.assign(dealDamage(u, t, m * c.lv, o, c), { tgt: t }));
      }
      let t = c.t;
      if (!t || !t.alive || t.team === u.team) { const vt = targetable(u); if (!vt.length) return { hit: false }; t = c.t = pickTarget(u, vt); }
      ev({ k: "atk", a: u.uid, t: [t.uid], anim: c.anim, aoe: 0, sp: c.i > 0 });
      return Object.assign(dealDamage(u, t, m * c.lv, o, c), { tgt: t });
    },
    buff(u, id, turns) { if (!u.alive || E.has(u, "buffImm")) return false; addEff(u, id, turns); return true; },
    debuff(src, t, id, turns, chance = 1, o = {}) {
      if (!t || !t.alive) return false;
      if (R() >= chance) return false;
      if (E.has(t, "immunity")) { ev({ k: "txt", u: t.uid, s: "IMMUNE", c: "txt" }); return false; }
      if (!o.sure) {
        const res = clamp(stat(t, "ten") - stat(src, "pot"), .1, .85);
        if (R() < res) { ev({ k: "txt", u: t.uid, s: "RESISTED", c: "txt" }); emit("resist", { src, tgt: t, id }); return false; }
      }
      addEff(t, id, turns); emit("debuffed", { src, tgt: t, id }); return true;
    },
    heal(u, pct) {
      if (!u.alive) return;
      if (E.has(u, "healImm")) { ev({ k: "txt", u: u.uid, s: "HEAL BLOCKED", c: "debuff" }); return; }
      const n = Math.min(Math.round(u.max.hp * pct), u.max.hp - u.hp); if (n <= 0) return;
      u.hp += n; ev({ k: "heal", u: u.uid, n, hp: u.hp, prot: u.prot });
    },
    prot(u, pct) {
      if (!u.alive) return;
      const n = Math.min(Math.round(u.max.prot * pct), u.max.prot - u.prot); if (n <= 0) return;
      u.prot += n; ev({ k: "heal", u: u.uid, n, hp: u.hp, prot: u.prot, isProt: 1 });
    },
    tm(u, v) { if (!u.alive) return; u.tm = clamp(u.tm + v, 0, 100); ev({ k: "tm", u: u.uid, tm: u.tm, v }); },
    tmDown(src, t, v, chance = 1) {
      if (!t.alive || R() >= chance) return;
      const res = clamp(stat(t, "ten") - stat(src, "pot"), .1, .85);
      if (R() < res) { ev({ k: "txt", u: t.uid, s: "RESISTED", c: "txt" }); return; }
      t.tm = Math.max(0, t.tm - v); ev({ k: "tm", u: t.uid, tm: t.tm, v: -v });
    },
    cleanse(u, n = 99) {
      const d = E.debuffs(u); if (!d.length) return;
      const rm = d.sort(() => R() - .5).slice(0, n).map(e => e.id);
      u.eff = u.eff.filter(e => !rm.includes(e.id)); fxEv(u); ev({ k: "txt", u: u.uid, s: "CLEANSED", c: "buff" });
    },
    dispel(u) {
      const n = u.eff.length; u.eff = u.eff.filter(e => !FX[e.id].b);
      if (u.eff.length !== n) { fxEv(u); ev({ k: "txt", u: u.uid, s: "DISPELLED", c: "debuff" }); }
    },
    assist(c, filter, n = 1) {
      if (c.assist || c.counter || B.depth > 4) return;
      const cands = E.allies(c.u).filter(a => a !== c.u && !E.has(a, "stun") && filter(a)).sort(() => R() - .5).slice(0, n);
      for (const a of cands) {
        if (!c.t || !c.t.alive || !a.alive) break;
        ev({ k: "txt", u: a.uid, s: "ASSIST", c: "buff" });
        B.depth++; runAbility(a, 0, c.t, { assist: true }); B.depth--;
      }
    },
    counter(u, t) {
      if (B.depth > 4 || !u.alive || !t.alive) return;
      ev({ k: "txt", u: u.uid, s: "COUNTER", c: "buff" });
      B.depth++; runAbility(u, 0, t, { counter: true }); B.depth--;
    },
  };

  function advance() {
    const al = B.units.filter(x => x.alive);
    let best = null, bt = Infinity;
    for (const u of al) {
      const sp = Math.max(10, stat(u, "spd")), t = (100 - u.tm) / sp;
      if (t < bt - 1e-9 || (Math.abs(t - bt) < 1e-9 && sp > stat(best, "spd"))) { bt = t; best = u; }
    }
    const dt = Math.max(0, bt);
    for (const u of al) u.tm = Math.min(100, u.tm + Math.max(10, stat(u, "spd")) * dt);
    best.tm = 100;
    return best;
  }
  function endTurn(u) {
    if (u.alive) {
      let changed = false;
      for (const e of u.eff) { if (e.skip) e.skip = false; else { e.turns--; changed = true; } }
      const n = u.eff.length; u.eff = u.eff.filter(e => e.turns > 0);
      if (changed && u.eff.length !== n) fxEv(u);
    }
    B.actor = null; B.waiting = null;
    const allies = B.units.filter(x => x.team === "A" && x.alive).length;
    const foes = B.units.filter(x => x.team === "E" && x.alive).length;
    if (!allies) { B.over = true; B.result = { win: false, alive: 0, stars: 0 }; }
    else if (!foes) {
      if (B.wave < B.waves.length - 1) B.pendingWave = true;
      else { B.over = true; const lost = B.allyCount - allies; B.result = { win: true, alive: allies, stars: lost === 0 ? 3 : lost === 1 ? 2 : 1 }; }
    }
  }
  function act(u, i, t) {
    const ab = u.def.ab[i];
    ev({ k: "act", u: u.uid, i, name: ab.n, sp: i > 0, t: t && t.uid, anim: defaultAnim(u, ab), tgt: ab.tgt });
    runAbility(u, i, t, {});
    if (i > 0) u.cd[i] = ab.cd;
    emit("used", { unit: u, ab, idx: i, target: t });
    ev({ k: "end", u: u.uid });
    endTurn(u);
  }
  function aiChoose(u) {
    let best = { i: 0, s: 1 };
    u.def.ab.forEach((ab, i) => {
      if (i === 0 || !B.usable(u, i)) return;
      let s = 10 + ab.cd + R();
      const al = E.allies(u);
      if (ab.ai === "heal" || ab.ai === "cleanse") {
        const deb = al.reduce((a, x) => a + E.debuffs(x).length, 0), low = Math.min(...al.map(x => x.hp / x.max.hp));
        s = deb >= 2 || low < .6 ? 25 : deb === 1 ? 8 : -1;
      }
      if (ab.ai === "taunt") s = E.has(u, "taunt") ? -1 : u.hp / u.max.hp > .3 ? 12 : 4;
      if (ab.ai === "buff") s = 11 + R();
      if (s > best.s) best = { i, s };
    });
    const ab = u.def.ab[best.i];
    let t;
    if (ab.tgt === "enemy") t = pickTarget(u, targetable(u));
    else if (ab.tgt === "enemies") t = targetable(u)[0];
    else t = u;
    return { i: best.i, t };
  }

  B.E = E; B.stat = stat; B.targetable = targetable;
  B.byId = uid => B.units.find(x => x.uid === uid);
  B.usable = (u, i) => i === 0 || (u.cd[i] === 0 && !E.has(u, "abBlock"));
  B.aiChoose = aiChoose;
  B.step = () => {
    if (B.over) return "over";
    if (B.pendingWave) { B.pendingWave = false; spawnWave(B.wave + 1); return "wave"; }
    const u = advance(); B.actor = u; B.turn++; u.tm = 0;
    ev({ k: "turn", u: u.uid, tms: B.units.filter(x => x.alive).map(x => [x.uid, x.tm]) });
    u.cd = u.cd.map(x => Math.max(0, x - 1));
    const dot = u.eff.find(e => e.id === "dot");
    if (dot) applyDamage(u, Math.round(u.max.hp * .06 * dot.st), false, null, true);
    if (u.alive && E.has(u, "hot")) E.heal(u, .08);
    if (u.alive) emit("turn", { unit: u });
    if (!u.alive) { ev({ k: "end", u: u.uid }); endTurn(u); return "acted"; }
    if (E.has(u, "stun")) { removeEff(u, "stun"); ev({ k: "txt", u: u.uid, s: "STUNNED", c: "debuff" }); ev({ k: "end", u: u.uid }); endTurn(u); return "acted"; }
    if (u.team === "A" && !B.auto) { B.waiting = u; return "input"; }
    const ch = aiChoose(u); act(u, ch.i, ch.t); return "acted";
  };
  B.playerAct = (i, t) => {
    const u = B.waiting; if (!u) return false;
    if (!B.usable(u, i)) i = 0;
    const ab = u.def.ab[i];
    if (ab.tgt === "enemy") { const vt = targetable(u); if (!t || !vt.includes(t)) t = pickTarget(u, vt); }
    else if (ab.tgt === "enemies") t = targetable(u)[0];
    else t = u;
    act(u, i, t); return true;
  };
  B.autoAct = () => { const u = B.waiting; if (!u) return; const ch = aiChoose(u); act(u, ch.i, ch.t); };

  // setup
  const allies = cfg.allies.map((a, i) => makeUnit(a.id, a.prog, "A", false, i));
  B.units.push(...allies);
  B.leaders.A = allies[0] && allies[0].def.lead ? allies[0] : null;
  prepTeam(allies, B.leaders.A);
  const first = spawnWave(0, true);
  B.ev = [];
  runStart(allies, B.leaders.A);
  runStart(first, B.leaders.E);
  return B;
}
