// Runs the title-screen Demo headless at top speed until it reaches 100% (or a time limit) and reports progress.
// Run from the repo root after `npm install` and `npx playwright install chromium`:
//   node mobile/tests/demo.js [minutes=90]
const path = require('path'), fs = require('fs');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const LIMIT = (+process.argv[2] || 90) * 60000;
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  await page.waitForTimeout(800);
  // start a new Demo from the title screen, then switch it to headless speed
  await page.click('#tDemo'); await page.waitForTimeout(300);
  await page.click('#tDemoNew');
  await page.evaluate(() => { DEMO.fast = true; DEMO.speed = 16; });
  const t0 = Date.now(); let last = '';
  while (Date.now() - t0 < LIMIT) {
    await page.waitForTimeout(15000);
    const st = await page.evaluate(() => ({ on: DEMO.on, g: S ? demoGoals() : null, log: DEMO.log.slice(-1)[0], errors: DEMO.errors,
      lvl: S && S.lvl, ops: S && Object.keys(S.ops).length, days: Math.round(DEMO.skew / 864e5 * 10) / 10 }));
    const line = `${Math.round((Date.now() - t0) / 1000)}s ${st.g ? Math.floor(st.g.pct) + '% nodes ' + st.g.nodesDone + ' hunts ' + st.g.hunts + ' sss ' + st.g.tower + ' cc ' + st.g.cc + ' rta ' + st.g.rt + ' ach ' + st.g.ach : ''} lvl ${st.lvl} ops ${st.ops} +${st.days}d errs ${st.errors} | ${st.log}`;
    if (line !== last) console.log(line); last = line;
    if (!st.on) break;
  }
  const end = await page.evaluate(() => ({ on: DEMO.on, log: DEMO.log.slice(-40), title: !!document.querySelector('#title:not([hidden])') }));
  console.log('--- last log ---\n' + end.log.join('\n'));
  console.log('demo still running:', end.on, '| errors:', errs.slice(0, 20));
  await browser.close();
})();
