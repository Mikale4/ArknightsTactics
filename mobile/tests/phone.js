// Phone-size playthrough: story, battles, Terminal, Store, Depot, operator screens, a boss clear and a landscape battle. Saves screenshots to tests/shots/.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  await page.waitForTimeout(700);
  const shot = async n => { await page.screenshot({ path: SH + n + '.png' }); };
  const tap = async (sel, w = 350) => { await page.click(sel, { force: true }); await page.waitForTimeout(w); };
  await tap('[data-act=introGo]'); await tap('[data-act=startNode]', 500); await tap('#dSkip', 400);
  await page.evaluate(() => closeModal());
  await shot('90_home_map');
  await tap('[data-act=openNode][data-id="1-2"]'); await shot('91_sheet');
  await tap('[data-act=startNode]'); await shot('92_squad');
  await tap('[data-act=deploy]', 500); await tap('#dSkip', 300);
  await page.waitForTimeout(2600); await shot('93_intro_cam');
  await page.waitForSelector('.skbtn', { timeout: 30000 }); await page.waitForTimeout(600); await shot('94_input');
  const ready = await page.$('.skbtn.ready'); if (ready) await ready.click();
  for (const [t, n] of [[350, '95_atk_a'], [450, '96_atk_b'], [600, '97_atk_c']]) { await page.waitForTimeout(t); await shot(n); }
  await page.click('#bAuto');
  let done = false;
  for (let k = 0; k < 90 && !done; k++) { await page.waitForTimeout(700); done = !!(await page.$('#rDone')); if (k === 2 || k === 5 || k === 9) await shot('98_auto_' + k); }
  await shot('99_result');
  if (done) await tap('#rDone', 900);
  await page.evaluate(() => { const d = document.getElementById('dSkip'); if (d) d.click(); });
  await page.waitForTimeout(300);
  // Terminal screens
  await page.evaluate(() => { closeModal(); route('battle'); }); await page.waitForTimeout(300); await shot('100_terminal');
  await page.evaluate(() => route('hunt', 'slug')); await page.waitForTimeout(300); await shot('101_supplies');
  await page.evaluate(() => route('tower')); await page.waitForTimeout(300); await shot('102_sss');
  await page.evaluate(() => route('arena')); await page.waitForTimeout(300); await shot('103_cc');
  await page.evaluate(() => { UI.shopTab = 'credit'; route('shop'); }); await page.waitForTimeout(300); await shot('104_store');
  await page.evaluate(() => { UI.shopTab = 'prime'; rerender(); }); await page.waitForTimeout(300); await shot('105_store_prime');
  await page.evaluate(() => { give({ rune: 4 }); give({ rune: 2 }); route('depot'); }); await page.waitForTimeout(300); await shot('106_depot');
  await page.evaluate(() => { UI.opTab = 'runes'; route('op', 'amiya'); }); await page.waitForTimeout(300); await shot('107_op_modules');
  await page.evaluate(() => { UI.opTab = 'skills'; rerender(); }); await page.waitForTimeout(300); await shot('108_op_skills');
  await page.evaluate(() => sanityModal()); await page.waitForTimeout(300); await shot('109_sanity');
  await page.evaluate(() => { closeModal(); missionsModal(); }); await page.waitForTimeout(300); await shot('110_missions');
  await page.evaluate(() => { closeModal(); route('story'); }); await page.waitForTimeout(300); await shot('111_main_theme');
  await page.evaluate(() => { for (const id of ['1-1', '1-2', '1-3', '1-4', 'S1-1', '1-5']) S.story[id] = 3; route('chapter', 'c1'); }); await page.waitForTimeout(300); await shot('112_ep01_map');
  // boss with a strong squad, to see bosses and a 3-star OP award
  await page.evaluate(() => { for (const k of ['exusiai', 'hoshiguma', 'nightingale', 'ifrit']) S.ops[k] = progForLV(k, 45); S.team.story = ['hoshiguma', 'exusiai', 'ifrit', 'nightingale']; S.settings.auto = true; S.settings.speed = 2; });
  await page.evaluate(() => { closeModal(); ACT.openNode({ id: '1-6' }); }); await page.waitForTimeout(300);
  await page.evaluate(() => ACT.startNode({ id: '1-6' })); await page.waitForTimeout(400);
  await page.evaluate(() => ACT.deploy()); await page.waitForTimeout(600);
  await page.evaluate(() => { const d = document.getElementById('dSkip'); if (d) d.click(); });
  done = false;
  for (let k = 0; k < 120 && !done; k++) { await page.waitForTimeout(700); done = !!(await page.$('#rDone')); if (k === 6 || k === 10 || k === 14) await shot('113_boss_' + k); }
  await shot('114_boss_result');
  console.log('prime', await page.evaluate(() => S.prime), 'story', await page.evaluate(() => JSON.stringify(S.story)));
  // landscape
  if (done) await tap('#rDone', 600);
  await page.evaluate(() => { const d = document.getElementById('dSkip'); if (d) d.click(); closeModal(); });
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
  await page.evaluate(() => { S.team.tower = ['hoshiguma', 'exusiai', 'ifrit', 'nightingale']; launchTower(S.tower + 1); });
  await page.waitForTimeout(6500); await shot('115_land_battle');
  // enemy gallery
  await page.setViewportSize({ width: 1200, height: 420 });
  await page.evaluate(() => {
    document.body.innerHTML = ''; const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 420; document.body.appendChild(cv);
    const g = cv.getContext('2d'); g.fillStyle = '#2a3348'; g.fillRect(0, 0, 1200, 420);
    Object.keys(ENEMY).forEach((k, i) => { g.save(); g.translate(50 + (i % 9) * 128, 190 + Math.floor(i / 9) * 200); g.scale(1.1, 1.1); drawFigure(g, ENEMY[k].fig, { name: 'idle', time: .5 }); g.restore();
      g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText(ENEMY[k].n, 50 + (i % 9) * 128, 205 + Math.floor(i / 9) * 200); });
  });
  await shot('116_enemies');
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await browser.close();
})();
