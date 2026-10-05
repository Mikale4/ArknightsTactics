// Balance check: auto-vs-auto win rates for every story stage, Supplies level and selected SSS floors.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  await page.waitForTimeout(500);
  const out = await page.evaluate(() => {
    const sim = (team, waves, LV, n) => { let w = 0, t = 0;
      for (let i = 0; i < n; i++) { const B = makeBattle({ allies: team.map(k => ({ op: k, prog: progForLV(k, LV) })), waves, auto: true, aiStyle: "balanced" });
        let g = 0; while (!B.over && g++ < 4000) { const r = B.step(); if (r === "input") B.autoAct(); B.ev.length = 0; }
        if (B.result && B.result.win) { w++; t += B.result.turns; } }
      return Math.round(w / n * 100) + "%"; };
    const starters = ["amiya", "fang", "kroos", "melantha"], mixed = ["amiya", "exusiai", "texas", "ptilopsis"];
    const rows = [];
    for (const nd of Object.values(NODES)) if (nd.waves) {
      const waves = nd.waves.map(w => convWave(w, nd.lv));
      rows.push(`${nd.id.padEnd(4)} ${nd.type.padEnd(6)} lv${String(nd.lv).padEnd(3)} starters@-3:${sim(starters, waves, Math.max(1, nd.lv - 3), 16).padStart(4)} @+0:${sim(starters, waves, nd.lv, 16).padStart(4)} @+5:${sim(starters, waves, nd.lv + 5, 16).padStart(4)} | mixed@+0:${sim(mixed, waves, nd.lv, 16).padStart(4)}`);
    }
    for (const h of HUNTS) for (const l of [1, 3, 6]) { const waves = huntWaves(h, l), lv = HUNT_LV[l - 1]; rows.push(`hunt ${h.id} L${l} lv${lv} mixed@lv:${sim(mixed, waves, lv, 12)} @+10:${sim(mixed, waves, lv + 10, 12)}`); }
    for (const f of [1, 5, 10, 15, 20, 30]) { const T = towerFloor(f); rows.push(`tower ${f} lv${T.lv} mixed@lv:${sim(mixed, T.waves.map(w => convWave(w, T.lv)), T.lv, 12)}`); }
    return rows.join("\n");
  });
  console.log(out); console.log('errs', errs);
  await browser.close();
})();
