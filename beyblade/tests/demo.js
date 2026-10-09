// The demo, end to end: a named player's save exists, the demo runs in Fast mode from a brand-new account, it must reach
// 100% (story 3 stars everywhere, Street Battles, Tower, Ranked #1, all Beyblades, every BBA Record) without errors, and
// the player's own save must be untouched and come back on exit. MODE=highlights or MODE=watch to watch the other modes
// for LIMIT seconds instead. Screenshots go to tests/shots/demo_*.png.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const MODE = process.env.MODE || 'fast', LIMIT = +(process.env.LIMIT || 1500);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE); await page.waitForTimeout(1500);
  // a real player first
  await page.mouse.click(195, 500); await page.waitForTimeout(600);
  await page.fill('#nname', 'Real Player'); await page.evaluate(() => ACT.nameGo()); await page.waitForTimeout(400);
  await page.evaluate(() => { ACT.introGo(); closeModal(); S.lmd = 12345; save(); }); await page.waitForTimeout(500);
  await page.evaluate(() => route('settings')); await page.waitForTimeout(300); await page.screenshot({ path: SH + 'demo_0_card.png' });
  await page.evaluate(() => ACT.demoAsk()); await page.waitForTimeout(400); await page.screenshot({ path: SH + 'demo_1_ask.png' });
  await page.evaluate(m => ACT.demoGo({ m }), MODE);
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < LIMIT * 1000) {
    await page.waitForTimeout(5000); k++;
    const st = await page.evaluate(() => ({ on: DEMO.on, done: !!DEMO.done, cap: DEMO.cap, pct: completionPct(), shown: DEMO.shown, simmed: DEMO.simmed }));
    if (k % 6 === 1 || st.done) console.log(Math.round((Date.now() - t0) / 1000) + 's', JSON.stringify(st));
    if ([3, 8, 16, 30].includes(k)) await page.screenshot({ path: SH + `demo_2_${k}.png` });
    if (st.done || !st.on || errs.length) break;
  }
  await page.waitForTimeout(1500); await page.screenshot({ path: SH + 'demo_3_done.png' });
  console.log('completion', await page.evaluate(() => JSON.stringify(completionParts().map(x => [x.n, x.v, x.max]))));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem(SAVE_KEY)));
  console.log('real save untouched during the demo:', stored.name === 'Real Player' && stored.lmd === 12345);
  await page.evaluate(() => ACT.demoExit()); await page.waitForTimeout(800);
  console.log('after exit:', await page.evaluate(() => JSON.stringify({ name: S.name, lmd: S.lmd, demo: DEMO.on, bar: !!document.getElementById('demobar') })));
  await page.screenshot({ path: SH + 'demo_4_back.png' });
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await browser.close();
})();
