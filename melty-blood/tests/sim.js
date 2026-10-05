// Balance check: auto-vs-auto win rates for each story battle, Night Patrol level and some Arcade stages.
const path = require('path');
const { chromium } = require('playwright');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE); await page.waitForTimeout(500);
  const out = await page.evaluate(() => {
    const sim = (team, waves, LV, n) => { let w = 0;
      for (let i = 0; i < n; i++) { const B = makeBattle({ allies: team.map(k => ({ op: k, prog: progForLV(k, LV) })), waves, auto: true, aiStyle: "balanced" });
        let g = 0; while (!B.over && g++ < 4000) { const r = B.step(); if (r === "input") B.autoAct(); B.ev.length = 0; }
        if (B.result && B.result.win) w++; }
      return (Math.round(w / n * 100) + "%").padStart(4); };
    const starters = ["shiki", "satsuki", "hisui", "kohaku"], mixed = ["arcueid", "ciel", "akiha", "hisui"], N = 12, rows = [];
    for (const nd of Object.values(NODES)) if (nd.waves) {
      const waves = nd.waves.map(w => convWave(w, nd.lv));
      rows.push(`${nd.id.padEnd(5)} ${nd.type.padEnd(6)} lv${String(nd.lv).padEnd(3)} starters@-3:${sim(starters, waves, Math.max(1, nd.lv - 3), N)} @+0:${sim(starters, waves, nd.lv, N)} @+5:${sim(starters, waves, nd.lv + 5, N)} | mixed@+0:${sim(mixed, waves, nd.lv, N)}`);
    }
    for (const h of HUNTS) for (const l of [1, 3, 6]) rows.push(`patrol ${h.code}-${l} lv${HUNT_LV[l - 1]} mixed@lv:${sim(mixed, huntWaves(h, l), HUNT_LV[l - 1], N)}`);
    for (const f of [1, 5, 10, 20, 30]) { const T = towerFloor(f); rows.push(`arcade ${f} lv${T.lv} mixed@lv:${sim(mixed, T.waves.map(w => convWave(w, T.lv)), T.lv, N)}`); }
    return rows.join("\n");
  });
  console.log(out); console.log('errs', errs);
  await browser.close();
})();
