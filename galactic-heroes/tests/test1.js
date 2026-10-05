// Galactic Heroes phone test 1.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto(PAGE);
  await page.waitForTimeout(800);
  await page.screenshot({ path: SH + '01_intro.png' });
  await page.click('[data-act=startGame]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + '02_home.png' });
  await page.click('#tabs button[data-v=chars]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + '03_chars.png' });
  await page.click('[data-v=char][data-a=luke]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: SH + '04_char.png', fullPage: false });
  await page.click('#tabs button[data-v=battles]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + '05_battles.png' });
  await page.click('.node[data-n="0"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + '06_node.png' });
  await page.click('[data-act=toSquad]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SH + '07_squad.png' });
  await page.click('[data-act=fight]');
  for (let k = 0; k < 6; k++) { await page.waitForTimeout(700); await page.screenshot({ path: SH + `08_battle_${k}.png` }); }
  console.log('ERRORS:', JSON.stringify(errs, null, 1));
  await browser.close();
})();
