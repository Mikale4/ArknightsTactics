// Galactic Heroes phone test 2.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
const [w, h, tag] = [ +process.argv[2], +process.argv[3], process.argv[4] ];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  await page.goto(PAGE);
  await page.waitForTimeout(400);
  await page.click('[data-act=startGame]');
  await page.evaluate(() => { S.settings.auto = true; S.settings.speed = 1; launchCampaign('light', 0, 2); });
  for (let k = 0; k < 16; k++) { await page.waitForTimeout(650); await page.screenshot({ path: SH + `${tag}_${String(k).padStart(2,'0')}.png` }); }
  await page.waitForTimeout(25000);
  await page.screenshot({ path: SH + `${tag}_end.png` });
  console.log('ERRORS:', JSON.stringify(errs, null, 1));
  await browser.close();
})();
