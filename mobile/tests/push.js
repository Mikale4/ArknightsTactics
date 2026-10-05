// Demo power push: a Demo save stuck in the Contracts (no rating gain for 3 days) should switch to the push,
// pick a PvP roster, convert Originite Prime, farm modules and keep climbing without errors.
// Run from the repo root after `npm install` and `npx playwright install chromium`: node mobile/tests/push.js [minutes=6]
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const LIMIT = (+process.argv[2] || 6) * 60000;
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  await page.goto(PAGE); await page.waitForTimeout(700);
  // a mid-game Demo save: PvE done, Contingency Contract in Diamond, Real-Time Contract in Silver, stalled for 3 days
  await page.evaluate(() => {
    try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* storage unavailable */ }
    enterGame(DEMO_KEY, { name: 'Demo' }); closeModal();
    S.seenIntro = true; S.lvl = 40;
    for (const nd of Object.values(NODES)) S.story[nd.id] = nd.waves ? 3 : 1;
    S.hunt = { slug: 6, crypt: 6, frost: 6 }; S.tower = 30;
    const six = ['exusiai', 'saria', 'ifrit', 'siege', 'nightingale', 'silverash'], rest = OP_KEYS.filter(k => OPS[k].rar >= 4 && OPS[k].rar <= 5).slice(0, 30);
    for (const k of six) S.ops[k] = progForLV(k, 85);
    for (const k of rest) S.ops[k] = progForLV(k, 45);
    S.ladder.pts = S.ladder.best = 2100; S.rta.pts = S.rta.best = 1380; S.rta.place = 0;
    Object.assign(S, { lmd: 400000, prime: 30, tokens: 1500, cert: 200, orundum: 2000 });
    S.inv.summ = 30; S.inv.chip = 20; S.inv.rec4 = 60;
    S.demoPush = { on: false, peak: 2100 + 1380, since: Date.now() - 3 * 864e5, roster: null, rosterT: 0, rosterN: 0, maxedT: 0, rta: { day: '', n: 0 } };
    save(); S = null;
    showTitle();
  });
  await page.click('#tDemo'); await page.waitForTimeout(300);
  await page.click('#tDemoGo');
  await page.evaluate(() => { DEMO.fast = true; DEMO.speed = 16; });
  const t0 = Date.now(); let seen = 0;
  while (Date.now() - t0 < LIMIT) {
    await page.waitForTimeout(10000);
    const st = await page.evaluate(n => ({ on: DEMO.on, log: DEMO.log.slice(n), n: DEMO.log.length, errors: DEMO.errors,
      push: S && S.demoPush && { on: S.demoPush.on, roster: S.demoPush.roster }, cc: S && S.ladder.pts, rta: S && S.rta.pts, prime: S && S.prime, days: Math.round(DEMO.skew / 864e5 * 10) / 10 }), seen);
    seen = st.n;
    for (const l of st.log) if (/push|Headhunt|Real-Time Contract ·|Plateau|Recovering|T5|Orundum/i.test(l)) console.log('  ' + l);
    console.log(`${Math.round((Date.now() - t0) / 1000)}s cc ${st.cc} rta ${st.rta} prime ${st.prime} +${st.days}d errs ${st.errors} push ${st.push && st.push.on}`);
    if (!st.on) break;
  }
  const end = await page.evaluate(() => ({ push: S && S.demoPush, errors: DEMO.errors, cc: S && S.ladder.pts, rta: S && S.rta.pts }));
  ok(end.push && end.push.on && end.push.roster && end.push.roster.length === 8, 'power push turned on with a roster of 8');
  ok(end.errors === 0, 'no demo errors');
  console.log('roster', end.push && end.push.roster, 'cc', end.cc, 'rta', end.rta);
  console.log('page errors', errs.slice(0, 10));
  await browser.close();
})();
