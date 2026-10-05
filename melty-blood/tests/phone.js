// Phone-size playthrough of Melty Blood RPG: intro, story, a manual and an auto battle, every hub screen,
// the Tatari, a boss with Arc Drives, and a landscape battle. Screenshots go to tests/shots/.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  await page.waitForTimeout(800);
  const shot = async n => { await page.screenshot({ path: SH + n + '.png' }); };
  const ev = async (fn, arg, w = 350) => { await page.evaluate(fn, arg); await page.waitForTimeout(w); };
  const skipDlg = () => page.evaluate(() => { const d = document.getElementById('dSkip'); if (d) d.click(); });
  const waitResult = async (tag, max = 120) => {
    for (let k = 0; k < max; k++) { await page.waitForTimeout(700); if (await page.$('#rDone')) return true; if (tag && [4, 8, 12].includes(k)) await shot(tag + k); }
    return false;
  };
  await shot('01_intro');
  await ev(() => { ACT.introGo(); }); await shot('02_sheet');
  await ev(() => { ACT.startNode({ id: '1-1' }); }, null, 900); await shot('03_dialogue'); await skipDlg(); await page.waitForTimeout(400);
  await ev(() => closeModal());
  await ev(() => { ACT.openNode({ id: '1-2' }); }); await ev(() => { ACT.startNode({ id: '1-2' }); }); await shot('04_squad');
  await ev(() => { ACT.deploy(); }, null, 700); await shot('05_pre'); await skipDlg();
  await page.waitForSelector('.skbtn', { timeout: 40000 }); await page.waitForTimeout(500); await shot('06_input');
  const ready = await page.$('.skbtn[data-s="1"]'); if (ready) await ready.click();
  for (const n of ['07_atk_a', '08_atk_b']) { await page.waitForTimeout(450); await shot(n); }
  await page.click('#bAuto');
  const done1 = await waitResult('09_auto_');
  await shot('10_result');
  if (done1) { await page.click('#rDone'); await page.waitForTimeout(900); await skipDlg(); await page.waitForTimeout(400); }
  for (const [n, fn, a] of [['11_home', v => route(v), 'home'], ['12_story', v => route(v), 'story'], ['13_map', v => route('chapter', v), 'c1'], ['14_battlehub', v => route(v), 'battle'],
    ['15_patrol', v => route('hunt', v), 'alley'], ['16_arcade', v => route(v), 'tower'], ['17_versus', v => route(v), 'arena'], ['18_chars', v => route(v), 'ops'],
    ['19_char', v => { UI.opTab = 'info'; route('op', homeKey(v)); }, 'shiki-c'], ['20_skills', v => { UI.opTab = v; rerender(); }, 'skills'], ['20b_variant', v => { UI.opTab = 'info'; route('op', v); }, 'arcueid-h-holy'], ['21_tatari', v => route(v), 'hh'],
    ['22_shop', v => { UI.shopTab = 'credit'; route(v); }, 'shop'], ['23_items', v => { give({ rune: 4 }); give({ rune: 2 }); route(v); }, 'depot']]) { await ev(fn, a); await shot(n); }
  await page.evaluate(() => { ACT.pull({ n: '10' }); }); await page.waitForTimeout(700); await shot('24_manifest');
  await page.mouse.click(195, 420); await page.waitForTimeout(2300); await shot('25_cards');
  await page.evaluate(() => { const d = document.getElementById('gDone'); if (d) d.click(); }); await page.waitForTimeout(300);
  await ev(() => missionsModal()); await shot('26_missions'); await ev(() => closeModal());
  // boss with a strong squad: Arc Drives, cut-ins and the Magic Circuit meter
  await ev(() => {
    for (const k of ['arcueid-f', 'ciel-c', 'akiha-f', 'hisui-c', 'arcueid-h'].map(homeKey)) S.ops[k] = progForLV(k, 30);
    for (const id of ['1-1', '1-2', '1-3', '1-4', 'S1-1', '1-5']) S.story[id] = 3;
    S.team.story = ['arcueid-f', 'ciel-c', 'akiha-f', 'hisui-c'].map(homeKey); S.settings.auto = true; S.settings.speed = 2;
    ACT.openNode({ id: '1-6' }); ACT.startNode({ id: '1-6' }); ACT.deploy();
  }, null, 900);
  await skipDlg();
  const done2 = await waitResult('27_boss_');
  await shot('28_boss_result');
  console.log('boss won:', await page.evaluate(() => !!(BT.B && BT.B.result && BT.B.result.win)), 'mc:', await page.evaluate(() => JSON.stringify(BT.B && BT.B.mc)));
  if (done2) { await page.click('#rDone'); await page.waitForTimeout(900); await skipDlg(); await page.waitForTimeout(600); await shot('29_night_cleared'); }
  await ev(() => closeModal());
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
  await ev(() => { S.team.tower = ['arcueid-f', 'arcueid-h', 'akiha-f', 'hisui-c'].map(homeKey); launchTower(S.tower + 1); }, null, 6500);
  await shot('30_landscape');
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await browser.close();
})();
