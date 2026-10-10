// Balance check without a browser: every story battle, fought on Auto by the starting fighters raised to the stage's
// level (and by a stronger party 10 levels higher), 20 times each. Prints win rates, average turns and the turn goal for
// the third star. Usage: node dragonball/tests/sim.js [runs]
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '../src') + '/';
let code = ['a2_core.js', 'a3a_roster.js', 'a3b_kits.js', 'a4_story.js', 'a6_state.js', 'a7_engine.js'].map(f => fs.readFileSync(SRC + f, 'utf8')).join('\n');
code = code.slice(code.indexOf('"use strict";'));
const ctx = { console, Math, Date, JSON, document: { createElement: () => ({ getContext: () => null }) }, localStorage: { getItem: () => null, setItem() {} } };
vm.createContext(ctx);
const RUNS = +(process.argv[2] || 20);
vm.runInContext(code + `
const party = lv => ["goku-s", "piccolo-s", "krillin-s"].map(k => ({ op: k, prog: progForLV(k, lv) }));
const strong = lv => ["goku-k", "vegeta-n", "piccolo-n"].map(k => ({ op: k, prog: progForLV(k, lv) }));
const foesOf = nd => { const all = nd.waves.flat(), isB = s => s.e && ENEMY[s.e].boss, b = all.filter(isB), r = all.filter(s => !isB(s)); return [...r.reverse().slice(0, Math.max(0, 3 - b.length)).reverse(), ...b].slice(0, 3).map(s => s.op ? { op: s.op, LV: Math.max(1, nd.lv - 3), prog: progForLV(s.op, Math.max(1, nd.lv - 3)), scale: .8 } : { en: s.e, LV: nd.lv + (ENEMY[s.e].boss ? 3 : 0) }); };
const run = (allies, foes) => { const B = makeBattle({ allies, foes, auto: true }); B.start(); let n = 0; while (!B.over && n++ < 30000) { if (B.phase === "plan") { B.plan(null); B.go(); } B.tick(); B.ev.length = 0; } return B.result || { win: false, turns: 99, lost: 3 }; };
for (const nd of Object.values(NODES)) {
  if (!nd.waves) continue;
  const goal = nodeTurnGoal(nd), foes = foesOf(nd);
  const stat = mk => { let w = 0, t = 0, three = 0; for (let i = 0; i < ${RUNS}; i++) { const r = run(mk(), foes); if (r.win) { w++; t += r.turns; if (!r.lost && r.turns <= goal) three++; } } return [Math.round(w / ${RUNS} * 100) + "%", w ? (t / w).toFixed(1) : "-", Math.round(three / ${RUNS} * 100) + "%"]; };
  const a = stat(() => party(nd.lv + 2)), b = stat(() => strong(nd.lv + 12));
  console.log(nd.id.padEnd(5), nd.type.padEnd(6), ("Lv" + nd.lv).padEnd(5), "goal", String(goal).padEnd(3), "| starters win", a[0].padEnd(5), "turns", a[1].padEnd(5), "3★", a[2].padEnd(5), "| strong win", b[0].padEnd(5), "turns", b[1].padEnd(5), "3★", b[2]);
}`, ctx);
