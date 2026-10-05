// Contracts: ladder screen, rankings, defense log, a ladder fight, and a Real-Time Contract match (matchmaking, draft, timed battle).
// Run from the repo root after `npm install` and `npx playwright install chromium`: node mobile/tests/arena.js
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const shot = n => page.screenshot({ path: SH + n + '.png' });
  await page.goto(PAGE); await page.waitForTimeout(700);
  // a mid-game Guest account
  await page.evaluate(() => {
    enterGuest(); S.seenIntro = true; closeModal();
    for (const k of ['exusiai', 'hoshiguma', 'nightingale', 'ifrit', 'siege', 'texas', 'amiya', 'ptilopsis']) S.ops[k] = progForLV(k, 90);
    S.team.arena = ['siege', 'exusiai', 'ifrit', 'nightingale']; S.team.defense = ['hoshiguma', 'exusiai', 'ifrit', 'nightingale'];
    S.settings.speed = 3; S.settings.auto = true; S.settings.ai = 'expert'; UI.arenaTab = 'ladder'; route('arena');
  });
  await page.waitForTimeout(300); await shot('120_ladder');
  ok(await page.$$eval('[data-act="ladderGo"]', b => b.length) === 3, 'three ladder opponents listed');
  await page.click('[data-act="rankings"]'); await page.waitForTimeout(200); await shot('121_rankings');
  ok((await page.$$('.rkrow')).length >= 30, 'rankings list');
  await page.evaluate(() => closeModal());
  // two hours away: the population drifts and the defense squad gets attacked
  const before = await page.evaluate(() => S.ladder.log.length);
  await page.evaluate(() => { S.ladder.defT -= 2 * 3600000; S.ladder.popT -= 2 * 3600000; tickTimers(); rerender(); });
  ok(await page.evaluate(() => S.ladder.log.length) >= before, 'defense attacks are simulated while away');
  await page.click('[data-act="defLog"]'); await page.waitForTimeout(200); await shot('122_defense_log'); await page.evaluate(() => closeModal());
  // one ladder fight on auto
  const pts0 = await page.evaluate(() => S.ladder.pts);
  await page.click('[data-act="ladderGo"]'); await page.waitForTimeout(300);
  await page.click('[data-act="deploy"]');
  await page.waitForSelector('#rDone', { timeout: 120000 }); await shot('123_ladder_result');
  await page.click('#rDone'); await page.waitForTimeout(300);
  ok(await page.evaluate(p => S.ladder.pts !== p && S.ladder.tickets === 9, pts0), 'ladder fight changes points and uses a ticket');
  // Real-Time Contract: matchmaking, draft, ban, battle
  await page.evaluate(() => { UI.arenaTab = 'rta'; rerender(); }); await page.waitForTimeout(200); await shot('124_rta');
  await page.click('[data-act="rtaFind"]'); await page.waitForTimeout(500); await shot('125_matchmaking');
  await page.waitForFunction(() => DRAFT, null, { timeout: 15000 });
  for (let g = 0; g < 200; g++) {
    const st = await page.evaluate(() => DRAFT ? { phase: DRAFT.phase, mine: draftWho() === 0, n: DRAFT.picks[0].length } : null);
    if (!st) break;
    if (st.phase === 'pick' && st.mine) { if (st.n === 2) await shot('126_draft'); await page.click('[data-act="draftPick"]:not([disabled])'); }
    else if (st.phase === 'ban') { await shot('127_ban'); await page.click('[data-act="draftBan"]'); }
    await page.waitForTimeout(250);
  }
  ok(await page.evaluate(() => BT.on), 'draft leads into the battle');
  await page.waitForTimeout(2500); await shot('128_rta_battle');
  await page.waitForSelector('#rDone', { timeout: 180000 });
  await page.click('#rDone'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => S.rta.games === 1 && S.rta.log.length === 1), 'match result recorded');
  await shot('129_rta_after');
  console.log('ladder', await page.evaluate(() => JSON.stringify({ pts: S.ladder.pts, rta: S.rta.pts, log: S.ladder.log.length })));
  console.log('errors', errs);
  await browser.close();
})();
