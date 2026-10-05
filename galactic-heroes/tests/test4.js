// Galactic Heroes phone test 4.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  await page.goto(PAGE);
  await page.waitForTimeout(300);
  await page.click('[data-act=startGame]');
  // unlock everyone for a roster render
  await page.evaluate(() => { for (const id of CH_IDS) if (!S.roster[id]) S.roster[id] = mkProg(3 + (id.length % 4)); S.roster.vader.gear = 12; S.roster.yoda.gear = 8; route('chars'); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: SH + 't4_roster1.png', fullPage: true });
  await page.evaluate(() => { document.querySelector('#view').scrollTop = 900; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: SH + 't4_roster2.png' });
  await page.evaluate(() => { document.querySelector('#view').scrollTop = 1800; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: SH + 't4_roster3.png' });
  // full auto battle at 3x, DS campaign 1-A
  await page.evaluate(() => { S.settings.auto = true; S.settings.speed = 3; S.squads.dark = ['vader','palpatine','maul','boba','grievous']; launchCampaign('dark', 0, 0); });
  let k = 0;
  for (; k < 120; k++) { await page.waitForTimeout(500); if (await page.$('.result')) break; if (k % 6 === 3) await page.screenshot({ path: SH + `t4_ds_${String(k).padStart(3,'0')}.png` }); }
  await page.waitForTimeout(800);
  await page.screenshot({ path: SH + 't4_result.png' });
  console.log('battle frames until result:', k);
  await page.click('#rDone');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + 't4_after.png' });
  // arena
  await page.evaluate(() => { route('arena'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + 't4_arena.png' });
  await page.click('[data-act=arenaFight][data-k="0"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + 't4_squad.png' });
  await page.click('[data-act=fight]');
  for (k = 0; k < 120; k++) { await page.waitForTimeout(500); if (await page.$('.result')) break; if (k === 10) await page.screenshot({ path: SH + 't4_arena_battle.png' }); }
  await page.waitForTimeout(600);
  await page.screenshot({ path: SH + 't4_arena_result.png' });
  await page.click('#rDone');
  await page.evaluate(() => { route('store'); });
  await page.click('[data-act=chromium]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + 't4_pack.png' });
  console.log('ERRORS:', JSON.stringify(errs, null, 1));
  await browser.close();
})();
