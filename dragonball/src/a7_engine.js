// =====================================================================
//  BATTLE ENGINE — Goku Gekitōden-style turns. Each turn both sides plan up to three commands, then the commands
//  play out in real time: attacks wind up (hold POWER to hit up to 30% harder, for more ki), incoming attacks can be
//  guarded with good timing (a perfect guard stops everything) or dodged with Vanish (costs ki), and ki runs low
//  fast: at below zero a fighter is exhausted and can't guard or vanish. Two beams fired at once clash in a beam
//  struggle. The turn ends when your commands are done. One fighter per side fights at a time; the others can be
//  switched in. Bosses that are beaten may transform and come back at full health.
//  Pure logic: the battle director (a8b_battle.js) and the demo's simulations drive it with tick().
// =====================================================================
let UID = 0;
const DT = 1 / 30;
const NEAR = 150, FAR = 540, MIDR = 330, ARENA_X = 720;      // distances in world units
const KI_MAX = 100, KI_MIN = -40, KI_REGEN = 4, KI_TURN = 10, VANISH_KI = 20;
const GUARD_MAX = 100, GUARD_COST = 24, GUARD_PCOST = 6, GUARD_REGEN = 12;
const PERFECT_WIN = .2, GUARD_WIN = .55, GUARD_CD = .5;     // seconds before impact
const HOLD_MAX = .9;                                        // seconds of holding POWER for a full-power attack
const PLAN_SLOTS = 3, TURN_LIMIT = 30, TURN_MAX_T = 14;
const DMG_K = 1.15;
const STUN_S = { BLIND: 2.4, FREEZE: 2.0 };
const WIND = { melee: .42, ki: .36, beam: 1.0, finger: .8, disc: .7, bomb: 2.2, flash: .5, freeze: .55, buff: .5, heal: .6, swap: .8 };
const RECOVER = { melee: .28, ki: .26, beam: .5, finger: .35, disc: .3, bomb: .55, flash: .3, freeze: .3, buff: .25, heal: .3, swap: .4 };
const SPEED = { melee: 0, ki: 1300, beam: 2600, finger: 4200, disc: 760, bomb: 520, flash: 0, freeze: 1500, swap: 2200 };
const KI_KINDS = new Set(["ki", "beam", "finger", "disc", "bomb"]);
const UNGUARDABLE = new Set(["disc", "flash", "freeze", "swap"]);
const KNOCK = { melee: 40, ki: 30, beam: 120, finger: 30, disc: 50, bomb: 170, freeze: 0, swap: 0, flash: 0 };

function makeBattle(cfg) {
  const B = { t: 0, turn: 0, phase: "intro", units: [], ev: [], atks: [], over: false, result: null, struggle: null, actT: 0,
    tally: { kills: 0, specials: 0, perfects: 0, struggles: 0, vanishes: 0 }, auto: !!cfg.auto, aiStyle: cfg.aiStyle || "balanced",
    side: { A: { key: "A", units: [], cur: null, q: [] }, E: { key: "E", units: [], cur: null, q: [] } },
    input: { hold: false, guardAt: -9, guardCD: 0 }, pilot: null, prof: {}, seq: 0 };
  const ev = e => B.ev.push(e);
  const has = (u, id) => u.eff.some(e => e.id === id);
  const pv = (u, id) => u.passives.find(p => p.id === id);
  const foeSide = s => s === "A" ? "E" : "A";
  const alive = u => u.status !== "out";
  const curOf = s => { const c = B.side[s].cur; return c && c.status === "field" ? c : null; };
  const foeOf = u => curOf(foeSide(u.team));
  const hpFrac = u => clamp(u.hp / u.max.hp, 0, 1);
  const dist = () => { const a = curOf("A"), e = curOf("E"); return a && e ? Math.abs(e.x - a.x) : FAR; };
  const human = u => u.team === "A" && !B.auto;

  // ---------- units ----------
  function buildUnit(spec, team, slot) {
    let def, st, sk, prof = { m: 0, k: 0, g: 0 };
    if (spec.op) {
      def = OPS[spec.op];
      const prog = spec.prog || progForLV(spec.op, spec.LV);
      st = opStats(spec.op, prog).st;
      if (spec.scale) { st.hp = Math.round(st.hp * spec.scale); st.atk = Math.round(st.atk * spec.scale); }
      sk = prog.sk; prof = profLevels(prog);
    } else {
      def = ENEMY[spec.en];
      st = enemyStats(spec.en, spec.LV).st;
      const r = Math.min(7, 1 + Math.floor(spec.LV / 18)); sk = [r, r, r];
    }
    const u = { uid: ++UID, key: spec.op || spec.en, def, isOp: !!spec.op, team, slot, n: def.n, el: def.el, cls: def.cls, race: def.race || "", boss: !!def.boss, LV: spec.LV || 1,
      max: { ...st }, hp: st.hp, ki: 30, guard: GUARD_MAX, eff: [], techs: def.techs, sk, prof, passives: def.passives || [], leader: def.leader || null,
      status: "bench", x: 0, y: 0, act: null, stunT: 0, stunK: null, staggerT: 0, flags: {}, once: {}, broken: false, form: 0,
      cnt: { m: 0, k: 0, g: 0 } };
    const ks = pv(u, "KI_START"); if (ks) u.ki += ks.amount;
    return u;
  }
  function applyLeader(L, list) {
    if (!L || !L.leader) return;
    const ld = L.leader;
    for (const t of list) {
      if (ld.scope === "Element" && t.el !== ld.element) continue;
      if (ld.scope === "Team" && t.def.squad !== ld.team && !(t.def.squad === "Ginyu Force" && ld.team === "Frieza Force")) continue;
      if (ld.scope === "Race" && t.race !== ld.team) continue;
      if (ld.stat === "HP") { t.max.hp = Math.round(t.max.hp * (1 + ld.amount)); t.hp = t.max.hp; }
      else if (ld.stat === "ATK") t.max.atk = Math.round(t.max.atk * (1 + ld.amount));
      else if (ld.stat === "DEF") t.max.def = Math.round(t.max.def * (1 + ld.amount));
      else if (ld.stat === "SPD") t.max.spd = Math.round(t.max.spd * (1 + ld.amount));
      else if (ld.stat === "CD") t.max.cd += ld.amount;
    }
  }
  cfg.allies.forEach((s, i) => { const u = buildUnit(s, "A", i); B.units.push(u); B.side.A.units.push(u); });
  cfg.foes.forEach((s, i) => { const u = buildUnit(s, "E", i); B.units.push(u); B.side.E.units.push(u); });
  applyLeader(B.side.A.units[0], B.side.A.units);
  applyLeader(B.side.E.units[0], B.side.E.units);

  // ---------- derived stats ----------
  const spdF = u => Math.max(.5, u.max.spd * (has(u, "SPD_UP") ? 1.25 : 1) * (has(u, "KAIOKEN") ? 1.25 : 1) * (has(u, "SLOW") ? .7 : 1) / 110);
  const effAtk = u => u.max.atk * (has(u, "ATK_UP") ? 1.3 : 1) * (has(u, "KAIOKEN") ? 1.4 : 1) * (has(u, "RAGE") ? 1.5 : 1) * (has(u, "ATK_DOWN") ? .7 : 1);
  const effDef = u => u.max.def;
  const lvMult = (u, c) => 1 + .06 * ((u.sk[c.basic ? 0 : Math.min(2, c.slot || 1)] || 1) - 1);
  const kiCost = (u, c, pow = 0) => {
    let k = c.ki || 0;
    if (u.el === "Blaster" && KI_KINDS.has(c.kind)) k *= 1 - KI_THRIFT;
    if (u.el === "Tactician" && !c.basic) k *= 1 - TAC_THRIFT;
    if (c.kind !== "buff" && c.kind !== "heal") k *= 1 + .5 * pow;
    return Math.round(k);
  };
  const canGuard = u => u.status === "field" && u.stunT <= 0 && u.ki >= 0 && !has(u, "KAIOKEN") && !u.broken;
  const canVanish = u => u.status === "field" && u.stunT <= 0 && u.ki >= VANISH_KI;
  B.canGuard = canGuard; B.canVanish = canVanish; B.kiCost = kiCost; B.spdF = spdF; B.dist = dist; B.curOf = curOf; B.foeOf = foeOf; B.has = has;

  // ---------- effects (lengths in turns) ----------
  function addEff(u, id, turns, quiet) {
    if (!alive(u)) return;
    if (id === "BLIND" || id === "FREEZE") { u.stunT = Math.max(u.stunT, STUN_S[id]); u.stunK = id; if (u.act && u.act.ph !== "rec") u.act = null; ev({ k: "stun", u: u.uid, s: id }); ev({ k: "txt", u: u.uid, s: FX[id].n, c: "debuff" }); return; }
    const ex = u.eff.find(x => x.id === id);
    if (ex) ex.turns = Math.max(ex.turns, turns); else u.eff.push({ id, turns });
    if (!quiet) ev({ k: "txt", u: u.uid, s: FX[id].n, c: FX[id].b ? "buff" : "debuff" });
    if (id === "KAIOKEN") ev({ k: "aura", u: u.uid, col: "#ff3a2a" });
  }
  function heal(u, n) { if (!alive(u) || n <= 0) return; const v = Math.min(n, u.max.hp - u.hp); if (v <= 0) return; u.hp += v; ev({ k: "heal", u: u.uid, n: Math.round(v) }); }
  function gainKi(u, n) { u.ki = clamp(u.ki + n, KI_MIN, KI_MAX); }

  // ---------- the hand: what a fighter can do this turn ----------
  function hand(u) {
    const out = [], bench = B.side[u.team].units.filter(x => x !== u && alive(x));
    for (const c of [BASIC.rush, BASIC.blast, ...u.techs, BASIC.charge, BASIC.in, BASIC.out, BASIC.tag]) {
      let ok = true, why = "";
      if (c.kind === "tag" && !bench.length) { ok = false; why = "No one to switch in"; }
      if (c.once && u.once[c.name]) { ok = false; why = "Already used"; }
      out.push({ c, ok, why, cost: kiCost(u, c) });
    }
    return out;
  }
  B.hand = hand;

  // ---------- AI planning ----------
  const STYLE_W = { balanced: { atk: 1, def: 1 }, aggressive: { atk: 1.35, def: .7 }, safe: { atk: .8, def: 1.35 } };
  function planFor(u) {
    const foe = foeOf(u), W = STYLE_W[u.team === "A" ? B.aiStyle : "balanced"] || STYLE_W.balanced;
    let ki = u.ki, d = dist(); const cmds = [];
    const team = B.side[u.team].units.filter(alive), lowTeam = team.reduce((a, x) => a + hpFrac(x), 0) / team.length;
    const H = hand(u).filter(h => h.ok);
    for (let i = 0; i < PLAN_SLOTS; i++) {
      const opts = [];
      for (const h of H) {
        const c = h.c, cost = h.cost;
        if (cmds.includes(c) && (c.kind === "buff" || c.kind === "heal" || c.kind === "swap" || c.once || c.kind === "flash" || c.kind === "freeze")) continue;
        if (ki - cost < KI_MIN + 5 && cost > 0) continue;
        let s = 0;
        if (c.kind === "charge") s = ki < 30 ? 95 : ki < 55 ? 40 : 6;
        else if (c.kind === "move") {
          const melee = u.el === "Striker" || u.el === "Defender";
          if (c.to === "near") s = d > NEAR + 20 && melee ? 30 : 0;
          else s = d < MIDR && u.el === "Blaster" ? 22 : 0;
        } else if (c.kind === "tag") s = hpFrac(u) < .22 && team.length > 1 && u.team === "E" ? 0 : hpFrac(u) < .2 ? 35 : 0;
        else if (c.kind === "buff") s = (c.fx || []).some(e => !has(u, e.what)) && ki - cost >= 10 ? 70 : 0;
        else if (c.kind === "heal") s = lowTeam < .6 ? 90 : lowTeam < .8 ? 25 : 0;
        else if (c.kind === "swap") s = foe && hpFrac(u) < hpFrac(foe) - .3 ? 120 : 0;
        else if (c.kind === "flash" || c.kind === "freeze") s = foe && foe.stunT <= 0 ? 48 : 0;
        else {
          // attacks: worth more when they're stronger per ki, and when the style suits them
          s = 30 + c.mult * 22 * W.atk;
          if (c.basic && c.kind === "melee") s += (u.el === "Striker" ? 18 : 0) + (d <= NEAR + 10 ? 10 : 0);
          if (c.basic && c.kind === "ki") s += u.el === "Blaster" ? 16 : 4;
          if (c.kind === "bomb") s += ki - cost >= 0 ? 40 : -60;
          if (!c.basic && ki - cost < 0) s -= 50;
          if (cost > 0 && ki - cost < 10) s -= 15 * W.def;
        }
        if (s > 0) opts.push([c, s * (.75 + R() * .5)]);
      }
      if (!opts.length) break;
      opts.sort((a, b) => b[1] - a[1]);
      const c = opts[0][0];
      cmds.push(c);
      ki += c.kind === "charge" ? c.gain : -kiCost(u, c);
      if (c.kind === "melee" || (c.kind === "move" && c.to === "near")) d = NEAR; else if (c.kind === "move") d = FAR;
      if (c.kind === "tag") break;
    }
    return cmds.length ? cmds : [BASIC.charge];
  }
  B.planFor = planFor;

  // ---------- battle start and turns ----------
  function enter(side, u) {
    const S2 = B.side[side];
    if (S2.cur && S2.cur.status === "field") S2.cur.status = "bench";
    S2.cur = u; u.status = "field"; u.act = null; u.stunT = 0;
    const foe = curOf(foeSide(side));
    u.x = foe ? foe.x + (side === "A" ? -MIDR : MIDR) : side === "A" ? -MIDR / 2 : MIDR / 2;
    u.x = clamp(u.x, -ARENA_X, ARENA_X);
    if (!u.flags.entered) {
      u.flags.entered = true;
      const sb = pv(u, "START_BUFF"); if (sb) for (const w of sb.what) addEff(u, w, sb.turns, true);
    }
    ev({ k: "enter", u: u.uid, side });
  }
  B.start = () => {
    enter("A", B.side.A.units[0]); enter("E", B.side.E.units[0]);
    for (const s of ["A", "E"]) for (const u of B.side[s].units) { const tb = pv(u, "TEAM_START_BUFF"); if (tb) for (const x of B.side[s].units) for (const w of tb.what) addEff(x, w, tb.turns + 1, true); }
    turnStart();
  };
  function turnStart() {
    B.turn++; B.phase = "plan"; B.actT = 0;
    for (const s of ["A", "E"]) {
      const u = curOf(s); if (!u) continue;
      const rg = pv(u, "REGEN"); if (rg && B.turn > 1) heal(u, u.max.hp * rg.amount);
      if (has(u, "REGEN")) heal(u, u.max.hp * .06);
      for (const b of B.side[s].units) { const bh = b.status === "bench" && pv(b, "BENCH_HEAL"); if (bh && B.turn > 1) heal(u, u.max.hp * bh.amount); if (b.status === "bench") gainKi(b, KI_TURN); }
      if (B.turn > 1) gainKi(u, KI_TURN);
      u.guard = Math.min(GUARD_MAX, u.guard + 20); if (u.guard >= 30) u.broken = false;
    }
    B.side.A.q = []; B.side.E.q = curOf("E") ? planFor(curOf("E")) : [];
    ev({ k: "turn", n: B.turn });
  }
  function turnEnd() {
    for (const u of B.units) { if (!alive(u)) continue; for (const e of u.eff) e.turns--; u.eff = u.eff.filter(e => e.turns > 0); }
    for (const s of ["A", "E"]) { B.side[s].q = []; const c = curOf(s); if (c) { c.act = null; c.staggerT = 0; } }
    B.atks = []; B.struggle = null; B.input.hold = false;
    if (checkOver()) return;
    for (const s of ["A", "E"]) if (!curOf(s)) { const nx = B.side[s].units.find(alive); if (nx) enter(s, nx); }
    if (B.turn >= TURN_LIMIT) { finish(teamFrac("A") >= teamFrac("E")); return; }
    turnStart();
  }
  const teamFrac = s => B.side[s].units.reduce((a, u) => a + (alive(u) ? hpFrac(u) : 0), 0) / B.side[s].units.length;
  function checkOver() {
    const a = B.side.A.units.some(alive), e = B.side.E.units.some(alive);
    if (a && e) return false;
    finish(a); return true;
  }
  function finish(win) {
    if (B.over) return;
    B.over = true; B.phase = "over";
    const A = B.side.A.units, lost = A.filter(u => !alive(u)).length;
    B.result = { win, alive: A.length - lost, lost, time: B.t, turns: B.turn };
    for (const u of A) B.prof[u.key] = { ...u.cnt };
    ev({ k: "over", win });
  }
  // the player's plan (or the AI's, on Auto), then the action phase
  B.plan = list => {
    if (B.phase !== "plan") return;
    const u = curOf("A");
    B.side.A.q = (list && list.length ? list : B.auto || !list ? planFor(u) : [BASIC.charge]).slice(0, PLAN_SLOTS);
  };
  B.go = () => {
    if (B.phase !== "plan") return;
    if (!B.side.A.q.length) B.plan(null);
    B.phase = "act"; B.actT = 0;
    ev({ k: "go" });
  };

  // ---------- player inputs (the battle buttons) ----------
  B.hold = on => { B.input.hold = !!on; };
  B.guard = () => {
    const u = curOf("A");
    if (!u || B.phase !== "act" || B.input.guardCD > 0) return false;
    if (!canGuard(u)) { ev({ k: "txt", u: u.uid, s: u.ki < 0 ? "EXHAUSTED" : has(u, "KAIOKEN") ? "NO GUARD" : u.broken ? "GUARD BROKEN" : "CAN'T GUARD", c: "txt" }); return false; }
    B.input.guardAt = B.t; B.input.guardCD = GUARD_CD;
    ev({ k: "guardUp", u: u.uid });
    return true;
  };
  B.vanish = () => {
    const u = curOf("A"); if (!u || B.phase !== "act") return false;
    const inc = B.atks.filter(a => a.to === u && !a.done && !a.vanished && a.kind !== "flash").sort((a, b) => a.impactAt - b.impactAt)[0];
    if (!inc || !canVanish(u)) return false;
    doVanish(u, inc); return true;
  };
  B.mash = () => { if (B.struggle) B.struggle.mashA += 1; };
  B.incoming = () => { const u = curOf("A"); return u ? B.atks.filter(a => a.to === u && !a.done && !a.vanished).sort((a, b) => a.impactAt - b.impactAt)[0] || null : null; };
  function doVanish(u, atk) {
    gainKi(u, -VANISH_KI); atk.vanished = true; B.tally.vanishes += u.team === "A" ? 1 : 0;
    ev({ k: "vanish", u: u.uid, atk: atk.id });
    ev({ k: "txt", u: u.uid, s: "VANISH", c: "buff" });
  }

  // ---------- actions ----------
  function startCmd(u, c) {
    const foe = foeOf(u);
    if (c.kind === "tag") {
      const nx = B.side[u.team].units.find(x => x !== u && alive(x) && x.status === "bench");
      B.side[u.team].q = [];
      if (nx) { u.status = "bench"; enter(u.team, nx); ev({ k: "txt", u: nx.uid, s: "SWITCH", c: "buff" }); }
      return;
    }
    if (c.once && u.once[c.name]) return;
    const cost = kiCost(u, c);
    if (cost > 0 && u.ki - cost < KI_MIN) { ev({ k: "txt", u: u.uid, s: "NOT ENOUGH KI", c: "debuff" }); return; }
    const act = { c, ph: "", t: 0, d: 0, pow: 0, want: 0, hits: 0 };
    u.act = act;
    if (c.kind === "move") { act.ph = "move"; act.d = 1.2; ev({ k: "act", u: u.uid, ph: "move", c: c.id }); return; }
    if (c.kind === "charge") { act.ph = "charge"; act.d = 1.0 / Math.sqrt(spdF(u)); ev({ k: "act", u: u.uid, ph: "charge" }); return; }
    if (c.kind === "melee" && foe && Math.abs(foe.x - u.x) > NEAR + 6) { act.ph = "dash"; act.d = 1.2; ev({ k: "act", u: u.uid, ph: "dash" }); return; }
    beginWind(u, act);
  }
  function beginWind(u, act) {
    const c = act.c;
    act.ph = "wind"; act.t = 0; act.d = (c.wind || WIND[c.kind] || .5) / spdF(u);
    // the AI decides now how long it will hold POWER; bombs always come out at full power
    act.noPow = c.kind === "buff" || c.kind === "heal" || c.kind === "flash" || c.kind === "swap" || c.kind === "bomb";
    if (!act.noPow && !human(u)) act.want = u.team === "A" ? .35 + R() * .5 : u.boss ? .3 + R() * .6 : R() * .7;
    ev({ k: "act", u: u.uid, ph: "wind", c: c.id || c.name, kind: c.kind, name: c.basic ? "" : c.name, d: act.d });
    if (!c.basic) ev({ k: "special", u: u.uid, name: c.name, kind: c.kind });
  }
  function fire(u, act) {
    const c = act.c, foe = foeOf(u), pow = clamp(act.pow, 0, 1);
    gainKi(u, -kiCost(u, c, pow));
    if (c.once) u.once[c.name] = 1;
    if (!c.basic && u.team === "A") B.tally.specials++;
    act.ph = "rec"; act.t = 0; act.d = (RECOVER[c.kind] || .3) / spdF(u) + (c.kind === "melee" ? (c.hits || 1) * .08 : 0);
    if (c.kind === "buff") { for (const e of c.fx || []) for (const x of e.on === "team" ? B.side[u.team].units : [u]) addEff(x, e.what, e.turns); ev({ k: "act", u: u.uid, ph: "buff" }); return; }
    if (c.kind === "heal") { for (const x of B.side[u.team].units) if (alive(x)) heal(x, x.max.hp * c.heal); ev({ k: "act", u: u.uid, ph: "buff" }); return; }
    if (!foe) return;
    const d = Math.abs(foe.x - u.x), sp = SPEED[c.kind] || 0;
    const atk = { id: ++B.seq, from: u, to: foe, c, kind: c.kind, pow, hits: c.hits || 1, t0: B.t, impactAt: B.t + (sp ? d / sp : .06) + (c.kind === "beam" ? .12 : 0), done: false, vanished: false, resp: null, x: u.x, dir: Math.sign(foe.x - u.x) || 1 };
    if (c.kind === "melee") atk.impactAt = B.t + .07;
    if (c.selfHit) { u.hp = Math.max(1, u.hp - u.max.hp * c.selfHit); ev({ k: "txt", u: u.uid, s: "SELF-DESTRUCT", c: "debuff" }); }
    // a beam fired into a beam that's winding up: both fire, and the beams clash
    if (c.kind === "beam" && foe.act && foe.act.c.kind === "beam" && foe.act.ph === "wind" && foe.act.t > .25 && foe.stunT <= 0) {
      const fa = foe.act; fa.pow = Math.max(fa.pow, fa.want * .7);
      gainKi(foe, -kiCost(foe, fa.c, fa.pow));
      fa.ph = "clash"; act.ph = "clash";
      const atk2 = { id: ++B.seq, from: foe, to: u, c: fa.c, kind: "beam", pow: fa.pow, hits: 1, t0: B.t, impactAt: 1e9, done: false, vanished: false, resp: null, x: foe.x, dir: -atk.dir };
      atk.impactAt = 1e9;
      B.atks.push(atk, atk2);
      B.struggle = { A: u.team === "A" ? atk : atk2, E: u.team === "A" ? atk2 : atk, pos: .5, t: 0, dur: 2.4, mashA: 0, mashE: 0 };
      B.tally.struggles += 1;
      ev({ k: "clash", a: u.uid, b: foe.uid });
      return;
    }
    // the defender's response, decided now for the AI (the player's comes from the GUARD and VANISH buttons)
    if (!human(foe)) atk.resp = aiDefend(foe, atk);
    B.atks.push(atk);
    ev({ k: "fire", atk: atk.id, u: u.uid, t: foe.uid, kind: c.kind, hits: atk.hits, name: c.basic ? "" : c.name, eta: atk.impactAt - B.t, pow });
  }
  // how well the AI guards: bosses and your own fighters on Auto are better at it
  function aiSkill(u) { return u.team === "A" ? .72 : u.boss ? .58 : .4 + Math.min(.15, u.LV / 600); }
  function aiDefend(u, atk) {
    const sk = aiSkill(u), r = R(), heavy = atk.kind === "bomb" || atk.c.heavy || atk.kind === "beam";
    if (atk.kind === "flash") return { k: "none" };
    if ((UNGUARDABLE.has(atk.kind) || heavy) && u.ki >= VANISH_KI + 5 && R() < sk * (UNGUARDABLE.has(atk.kind) ? .45 : .22)) return { k: "vanish", at: atk.impactAt - .12 - R() * .2 };
    if (UNGUARDABLE.has(atk.kind)) return { k: "none" };
    if (r < sk * .42) return { k: "perfect" };
    if (r < sk * .92) return { k: "guard" };
    return { k: "none" };
  }

  // ---------- damage ----------
  function damage(att, tar, atk, guardMult) {
    const c = atk.c;
    let m = effAtk(att) * c.mult * (1 + .3 * atk.pow) * lvMult(att, c);
    if (att.el === "Striker" && c.kind === "melee") m *= 1 + STRIKE_UP;
    if (att.el === "Blaster" && KI_KINDS.has(c.kind)) m *= 1 + KI_UP;
    const rel = elementRel(att.el, tar.el); if (rel === "adv") m *= 1.25; else if (rel === "dis") m *= .82;
    m *= 1 + .03 * (c.kind === "melee" ? att.prof.m : KI_KINDS.has(c.kind) ? att.prof.k : 0);
    const pr = pv(att, "PRIDE"); if (pr && hpFrac(att) < pr.below) m *= 1 + pr.amount;
    const ex = pv(att, "EXECUTE"); if (ex && hpFrac(tar) < ex.below) m *= 1 + ex.amount;
    const bv = pv(att, "BONUS_VS"); if (bv && tar.race === bv.race) m *= 1 + bv.amount;
    if (c.kind === "ki" && c.basic) m *= 1 - .25 * clamp((dist() - NEAR) / (FAR - NEAR), 0, 1);
    const crit = R() < att.max.cr;
    if (crit) m *= 1 + att.max.cd;
    m *= 1000 / (1000 + effDef(tar) * 1.4);
    if (has(tar, "DEF_UP")) m *= .7;
    if (has(tar, "DEF_DOWN")) m *= 1.3;
    if (tar.el === "Defender") m *= 1 - DEF_GUARD;
    const dr = pv(tar, "DMG_REDUCE"); if (dr) m *= 1 - dr.amount;
    m *= 1 - .025 * tar.prof.g;
    m *= DMG_K * (.92 + R() * .16) * guardMult;
    return { dmg: Math.max(guardMult > 0 ? 1 : 0, Math.round(m)), crit };
  }
  function hurt(att, tar, dmg, atk) {
    tar.hp -= dmg;
    // Yajirobe's Senzu Bean: once per battle, for the fighting ally
    if (tar.hp > 0 && hpFrac(tar) < .3) for (const x of B.side[tar.team].units) { const sz = alive(x) && pv(x, "TEAM_HEAL_ONCE"); if (sz && !x.once.senzu) { x.once.senzu = 1; heal(tar, tar.max.hp * sz.amount); ev({ k: "txt", u: tar.uid, s: "SENZU BEAN", c: "buff" }); } }
    if (tar.hp > 0) return;
    const zk = pv(tar, "ZENKAI");
    if (zk && !tar.once.zenkai) { tar.once.zenkai = 1; tar.hp = Math.round(tar.max.hp * zk.amount); addEff(tar, "ATK_UP", 2, true); ev({ k: "zenkai", u: tar.uid }); ev({ k: "txt", u: tar.uid, s: "ZENKAI!", c: "buff" }); return; }
    tar.hp = 0;
    if (tar.def.next) { transform(tar); return; }
    tar.status = "out"; tar.act = null;
    if (att.team === "A") B.tally.kills++;
    ev({ k: "ko", u: tar.uid });
    // Gohan's hidden potential: a friend going down unlocks it
    for (const x of B.side[tar.team].units) { const rg = alive(x) && pv(x, "RAGE"); if (rg) { x.eff = x.eff.filter(e => e.id !== "RAGE"); x.eff.push({ id: "RAGE", turns: rg.turns + 1 }); ev({ k: "txt", u: x.uid, s: "HIDDEN POWER", c: "buff" }); } }
    B.side[tar.team].q = []; B.side[att.team].q = [];
  }
  // a boss beaten in one form comes back in the next, at full health
  function transform(u) {
    const nk = u.def.next, nd = ENEMY[nk], st = enemyStats(nk, u.LV).st;
    const from = u.def;
    u.def = nd; u.key = nk; u.n = nd.n; u.el = nd.el; u.cls = nd.cls; u.techs = nd.techs; u.passives = nd.passives || [];
    u.max = { ...st }; u.hp = st.hp; u.ki = Math.max(u.ki, 50); u.act = null; u.eff = u.eff.filter(e => FX[e.id].b); u.stunT = 0; u.form++;
    B.side.A.q = []; B.side.E.q = [];
    for (const a of B.atks) a.done = true;
    ev({ k: "transform", u: u.uid, from: from.key, to: nk });
  }
  function resolve(atk) {
    atk.done = true;
    const att = atk.from, tar = atk.to;
    if (tar.status !== "field" || !alive(att)) return;
    if (atk.vanished) {
      ev({ k: "miss", atk: atk.id, u: tar.uid });
      // the defender reappears right next to the attacker
      if (atk.kind === "melee" || atk.kind === "disc" || atk.kind === "bomb") tar.x = clamp(att.x + (tar.team === "A" ? -NEAR : NEAR) * .8, -ARENA_X, ARENA_X);
      return;
    }
    if (atk.kind === "melee" && pv(tar, "AFTERIMAGE") && R() < pv(tar, "AFTERIMAGE").chance && tar.stunT <= 0) { ev({ k: "miss", atk: atk.id, u: tar.uid }); ev({ k: "txt", u: tar.uid, s: "AFTERIMAGE", c: "buff" }); return; }
    // guard response
    let resp = "none";
    if (!UNGUARDABLE.has(atk.kind) && canGuard(tar)) {
      if (human(tar)) {
        const lead = atk.impactAt - B.input.guardAt, eye = pv(tar, "GUARD_EYE"), pw = PERFECT_WIN * (1 + (eye ? eye.amount : 0)) * (tar.el === "Defender" ? 1.3 : 1);
        if (lead >= -.03 && lead <= pw) resp = "perfect"; else if (lead > pw && lead <= GUARD_WIN) resp = "guard";
      } else if (atk.resp) resp = atk.resp.k === "vanish" ? "none" : atk.resp.k;
    }
    const pierce = atk.c.pierce, bomb = atk.kind === "bomb";
    const mult = resp === "perfect" ? (bomb ? .25 : 0) : resp === "guard" ? (pierce ? .8 : bomb ? .5 : .3) : 1;
    if (resp !== "none") {
      const cost = (resp === "perfect" ? GUARD_PCOST : GUARD_COST) * (has(tar, "DEF_DOWN") ? 2 : 1) * (tar.el === "Defender" ? .5 : 1);
      tar.guard -= cost; tar.cnt.g += resp === "perfect" ? 2 : 1;
      if (resp === "perfect") { gainKi(tar, 8); if (tar.team === "A") B.tally.perfects++; if (atk.kind === "melee") att.staggerT = .35; }
      if (tar.guard <= 0) { tar.guard = 0; tar.broken = true; tar.stunT = Math.max(tar.stunT, .7); tar.stunK = "BREAK"; ev({ k: "guardBreak", u: tar.uid }); ev({ k: "txt", u: tar.uid, s: "GUARD BREAK", c: "debuff" }); }
    }
    // the swap of Body Change
    if (atk.kind === "swap") {
      const fa = hpFrac(att), ft = hpFrac(tar);
      att.hp = Math.max(1, Math.round(ft * att.max.hp)); tar.hp = Math.max(1, Math.round(fa * tar.max.hp));
      ev({ k: "swap", a: att.uid, b: tar.uid }); ev({ k: "txt", u: att.uid, s: "BODY CHANGE!", c: "buff" });
      return;
    }
    let total = 0, crit = false;
    if (atk.c.mult > 0) {
      const { dmg, crit: cr } = damage(att, tar, atk, mult); total = dmg; crit = cr;
      if (total > 0) {
        if (atk.kind === "melee") att.cnt.m += atk.hits; else if (KI_KINDS.has(atk.kind)) att.cnt.k += 1;
      }
    }
    ev({ k: "hit", atk: atk.id, u: tar.uid, from: att.uid, dmg: total, resp, crit, kind: atk.kind, hits: atk.hits, heavy: !!(atk.c.heavy || bomb || atk.kind === "beam") });
    if (resp === "perfect") ev({ k: "txt", u: tar.uid, s: "PERFECT GUARD", c: "crit" });
    else if (resp === "guard") ev({ k: "txt", u: tar.uid, s: "GUARD", c: "txt" });
    // knockback, stagger and effects (a perfect guard stops them all)
    if (mult > 0) {
      tar.x = clamp(tar.x + atk.dir * (KNOCK[atk.kind] || 30) * mult * (1 + atk.pow * .4), -ARENA_X, ARENA_X);
      if ((atk.c.heavy || bomb || atk.kind === "beam") && mult >= .5 && tar.act && (tar.act.ph === "wind" || tar.act.ph === "charge")) { tar.act = null; ev({ k: "txt", u: tar.uid, s: "INTERRUPTED", c: "debuff" }); }
      if (tar.act && tar.act.ph === "charge" && mult >= .3) { tar.act = null; }
      for (const e of atk.c.fx || []) if (e.on === "target" && R() < (e.chance ?? 1)) addEff(tar, e.what, e.turns);
    }
    if (atk.kind === "freeze" && !(atk.c.fx || []).length) addEff(tar, "FREEZE", 1);
    if (total > 0) hurt(att, tar, total, atk);
  }

  // ---------- the beam struggle ----------
  function stepStruggle() {
    const S2 = B.struggle; S2.t += DT;
    const pA = S2.A.from, pE = S2.E.from;
    if (!alive(pA) || !alive(pE) || pA.status !== "field" || pE.status !== "field") { B.struggle = null; S2.A.done = S2.E.done = true; return; }
    if (!human(pA) && R() < .2 + aiSkill(pA) * .25) S2.mashA += 1;
    if (R() < .18 + aiSkill(pE) * .22) S2.mashE += 1;
    const fA = effAtk(pA) * S2.A.c.mult * (1 + S2.A.pow * .3), fE = effAtk(pE) * S2.E.c.mult * (1 + S2.E.pow * .3);
    const push = (fA / (fA + fE) - .5) * .5 + (S2.mashA - S2.mashE) * .03;
    S2.mashA = 0; S2.mashE = 0;
    S2.pos = clamp(S2.pos + push * DT * 2.2, 0, 1);
    ev({ k: "clashPos", pos: S2.pos });
    if (S2.t >= S2.dur || S2.pos <= .02 || S2.pos >= .98) {
      const winA = S2.pos >= .5, win = winA ? S2.A : S2.E, lose = winA ? S2.E : S2.A;
      B.struggle = null; lose.done = true;
      win.c = { ...win.c, mult: win.c.mult * (.7 + Math.abs(S2.pos - .5)) };
      win.resp = { k: "none" }; win.impactAt = B.t + .05;
      for (const x of [pA, pE]) if (x.act && x.act.ph === "clash") { x.act.ph = "rec"; x.act.t = 0; x.act.d = .4; }
      ev({ k: "clashEnd", win: win.from.uid, lose: lose.from.uid });
    }
  }

  // ---------- one tick of the action phase ----------
  function stepUnit(u) {
    const foe = foeOf(u), dt = DT;
    if (u.stunT > 0) { u.stunT -= dt; if (u.stunT <= 0) { u.stunK = null; ev({ k: "unstun", u: u.uid }); } return; }
    if (!u.act || u.act.ph === "rec" && u.act.t >= u.act.d) gainKi(u, KI_REGEN * dt * (u.el === "Tactician" ? TAC_REGEN : 1) * (1 + (pv(u, "KI_REGEN") ? pv(u, "KI_REGEN").amount : 0)));
    if (!u.broken) u.guard = Math.min(GUARD_MAX, u.guard + GUARD_REGEN * dt * .3);
    else { u.guard += GUARD_REGEN * dt; if (u.guard >= 30) u.broken = false; }
    if (u.staggerT > 0) { u.staggerT -= dt; return; }
    const S2 = B.side[u.team];
    if (!u.act) {
      if (!S2.q.length) return;
      startCmd(u, S2.q.shift());
      return;
    }
    const a = u.act; a.t += dt;
    const face = foe ? Math.sign(foe.x - u.x) || (u.team === "A" ? 1 : -1) : u.team === "A" ? 1 : -1;
    const fly = (target, speed) => { const d = target - u.x, step = speed * dt; if (Math.abs(d) <= step) { u.x = target; return true; } u.x += Math.sign(d) * step; return false; };
    if (a.ph === "move") {
      const sp = 820 * spdF(u) * (u.ki < 0 ? .7 : 1);
      if (!foe) { u.act = null; return; }
      const tgt = a.c.to === "near" ? foe.x - face * NEAR : clamp(foe.x - face * FAR, -ARENA_X, ARENA_X);
      if (fly(tgt, sp) || a.t > a.d) { u.act = null; ev({ k: "act", u: u.uid, ph: "idle" }); }
      return;
    }
    if (a.ph === "dash") {
      const sp = 950 * spdF(u) * (u.el === "Striker" ? 2 : 1);
      if (!foe) { u.act = null; return; }
      if (fly(foe.x - face * (NEAR - 20), sp) || a.t > a.d) beginWind(u, a);
      return;
    }
    if (a.ph === "charge") {
      const g = a.c.gain / a.d * dt; gainKi(u, g);
      if (a.t >= a.d) { u.act = null; ev({ k: "act", u: u.uid, ph: "idle" }); }
      return;
    }
    if (a.ph === "wind") {
      const holding = !a.noPow && (human(u) ? B.input.hold : a.pow < a.want);
      if (holding) a.pow = Math.min(1, a.pow + dt / HOLD_MAX);
      if (a.c.kind === "bomb") a.pow = Math.min(1, a.t / a.d);
      // melee keeps its man in reach while it winds up
      if (a.c.kind === "melee" && foe && Math.abs(foe.x - u.x) > NEAR + 10) fly(foe.x - face * (NEAR - 20), 900 * spdF(u));
      const ready = a.t >= a.d && (a.noPow || (human(u) ? !B.input.hold || a.pow >= 1 : a.pow >= a.want || a.pow >= 1));
      if (ready) fire(u, a);
      return;
    }
    if (a.ph === "clash") return;
    if (a.ph === "rec" && a.t >= a.d) { u.act = null; ev({ k: "act", u: u.uid, ph: "idle" }); }
  }
  B.tick = () => {
    if (B.over || B.phase !== "act") return;
    B.t += DT; B.actT += DT;
    if (B.input.guardCD > 0) B.input.guardCD -= DT;
    if (B.struggle) { stepStruggle(); }
    else {
      for (const s of ["A", "E"]) { const u = curOf(s); if (u) stepUnit(u); }
      // AI vanishes at the last moment
      for (const atk of B.atks) if (!atk.done && atk.resp && atk.resp.k === "vanish" && !atk.vanished && B.t >= atk.resp.at && canVanish(atk.to)) doVanish(atk.to, atk);
      // the player's fighter on Auto guards with the AI's timing; the demo's cursor taps the buttons to show it
      if (B.pilot && B.auto) {
        const a = curOf("A");
        for (const atk of B.atks) if (!atk.done && atk.to === a && atk.resp && !atk.piloted && atk.resp.k !== "none") {
          const at = atk.resp.k === "vanish" ? atk.resp.at : atk.impactAt - .2;
          if (B.t >= at - .3) { atk.piloted = true; B.pilot(atk.resp.k === "vanish" ? "vanish" : "guard"); }
        }
        if (a && a.act && a.act.ph === "wind" && a.act.want > .3 && !a.act.piloted) { a.act.piloted = true; B.pilot("power", a.act.want * HOLD_MAX); }
      }
      // projectiles and impacts
      for (const atk of B.atks) if (!atk.done && B.t >= atk.impactAt) resolve(atk);
      B.atks = B.atks.filter(a => !a.done || B.t - a.impactAt < .05);
      if (B.over) return;
    }
    if (checkOver()) return;
    // the turn ends when your commands are done and the last attack has landed
    const a = curOf("A"), e = curOf("E");
    const aDone = !a || (!B.side.A.q.length && !a.act);
    const flying = B.atks.some(x => !x.done);
    if ((aDone && !flying && !B.struggle && (!e || !e.act || e.act.ph !== "rec")) || B.actT > TURN_MAX_T || !a || !e) turnEnd();
  };
  return B;
}
