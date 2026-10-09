// Balance check: auto-vs-auto win rates for each story battle, Street Battle level and some BBA Tower floors.
// The story is checked with the four starters (a few levels under, at and over the stage level) and with a team from
// that season's story rewards. VARIANTS=1 instead rates every Beyblade in a fixed squad against three gauntlets (a boss
// of each type that has a weakness), to spot outliers; TYPES=1 prints the average per type.
const path = require('path');
const { chromium } = require('playwright');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE); await page.waitForTimeout(500);
  const out = await page.evaluate(variants => {
    const run = (team, waves, LV) => { const B = makeBattle({ allies: team.map(k => ({ op: k, prog: progForLV(k, LV) })), waves, auto: true, aiStyle: "balanced" });
      let g = 0; while (!B.over && g++ < 4000) { const r = B.step(); if (r === "input") B.autoAct(); B.ev.length = 0; }
      return !!(B.result && B.result.win); };
    const sim = (team, waves, LV, n) => { let w = 0; for (let i = 0; i < n; i++) if (run(team, waves, LV)) w++; return (Math.round(w / n * 100) + "%").padStart(4); };
    const starters = STARTERS.slice(0, 4), N = 12, rows = [];
    // the team a player is likely to have by each season: the story's reward Beyblades
    const SEASON_TEAM = { "Season 1": ["tyson-f", "kai-s", "lee-s", "max-s"], "V-Force": ["tyson-v", "kai-f", "max-f", "ray-s"], "G-Revolution": ["tyson-v2", "daichi-v", "max-v", "kai-v"] };
    if (variants) {
      const boss = k => { const id = "sim_" + k; bossOf(id, k, 2.6, 1.05); return id; };
      const G = ["tyson-v", "max-v", "zeo-v"].map(k => [[{ en: "biovolt", LV: 42 }, { en: "guardian", LV: 42 }, { en: "trainee", LV: 42 }], [{ en: boss(k), LV: 40 }, { en: "cyber", LV: 40 }, { en: "bega", LV: 40 }]]);
      const squad = ["mariah-s", "spencer-s", "emily-s"];
      const M = variants === "type" ? 4 : 16, rate = k => { let w = 0;
        for (const waves of G) for (let i = 0; i < M; i++) if (run([k, ...squad], waves, 40)) w++;
        return Math.round(w / M / G.length * 100); };
      const res = OP_KEYS.map(k => [k, OPS[k].rar, rate(k)]);
      const avg = f => { const l = res.filter(f); return Math.round(l.reduce((a, r) => a + r[2], 0) / l.length); };
      const sum = [...ELS.map(e => `${e} ${avg(r => OPS[r[0]].el === e)}%`), ...[3, 4, 5].map(x => `${x}★ ${avg(r => r[1] === x)}%`)].join(" · ");
      if (variants === "type") return sum;
      return sum + "\n" + res.sort((a, b) => b[2] - a[2]).map(r => `${r[0].padEnd(16)} ${OPS[r[0]].el.padEnd(9)} ${r[1]}★ ${String(r[2]).padStart(3)}%`).join("\n");
    }
    for (const nd of Object.values(NODES)) if (nd.waves) {
      const waves = nd.waves.map(w => convWave(w, nd.lv)), team = SEASON_TEAM[nd.ch.season];
      rows.push(`${nd.id.padEnd(6)} ${nd.type.padEnd(6)} lv${String(nd.lv).padEnd(3)} starters@-3:${sim(starters, waves, Math.max(1, nd.lv - 3), N)} @+0:${sim(starters, waves, nd.lv, N)} @+5:${sim(starters, waves, nd.lv + 5, N)} | season@+0:${sim(team, waves, nd.lv, N)}`);
    }
    const late = SEASON_TEAM["V-Force"];
    for (const h of HUNTS) for (const l of [1, 3, 6]) rows.push(`street ${h.code}-${l} lv${HUNT_LV[l - 1]} team@lv:${sim(late, huntWaves(h, l), HUNT_LV[l - 1], N)}`);
    for (const f of [1, 5, 10, 20, 30]) { const T = towerFloor(f); rows.push(`tower ${f} lv${T.lv} team@lv:${sim(late, T.waves.map(w => convWave(w, T.lv)), T.lv, N)}`); }
    return rows.join("\n");
  }, process.env.TYPES ? "type" : !!process.env.VARIANTS);
  console.log(out); console.log('errs', errs);
  await browser.close();
})();
