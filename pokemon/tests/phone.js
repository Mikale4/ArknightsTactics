// Phone-size playthrough of Pokémon Kanto Squad: title, new game (name + look), Oak's intro, starter choice, the first
// rival battle, Route 1 (manual then auto), every hub screen, Mail and its free throws, Safari Zone, Pokédex, summary
// tabs, evolution, Brock with a strong team, a landscape battle, and finally deleting the save. Screenshots go to tests/shots/.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  const shot = async n => { await page.screenshot({ path: SH + n + '.png' }); };
  const ev = async (fn, arg, w = 350) => { await page.evaluate(fn, arg); await page.waitForTimeout(w); };
  const skipDlg = () => page.evaluate(() => { const d = document.getElementById('dSkip'); if (d) d.click(); });
  const waitResult = async (tag, max = 160) => {
    for (let k = 0; k < max; k++) { await page.waitForTimeout(700); if (await page.$('#rDone')) return true; if (tag && [3, 7, 12].includes(k)) await shot(tag + k); }
    return false;
  };
  await page.waitForTimeout(2200); await shot('00_title');
  await page.mouse.click(195, 500); await page.waitForTimeout(700); await shot('00b_name');
  await page.evaluate(() => ACT.pickAvatar({ v: 'leaf' }));
  await page.fill('#nname', 'Leaf'); await ev(() => { ACT.nameGo(); });
  await shot('01_intro');
  await ev(() => { ACT.introGo(); }); await shot('02_sheet');
  // Oak's lab: the scene, then the starter choice
  await page.evaluate(() => { ACT.startNode({ id: '1-1' }); }); await page.waitForTimeout(900); await shot('03_dialogue'); await skipDlg(); await page.waitForTimeout(500);
  await shot('03b_starters');
  await ev(() => ACT.pickStarter({ k: 'squirtle' }), null, 600); await skipDlg(); await page.waitForTimeout(500); await ev(() => closeModal());
  // rival battle: manual input first
  await ev(() => { ACT.openNode({ id: '1-2' }); }); await ev(() => { ACT.startNode({ id: '1-2' }); }); await shot('04_team');
  await ev(() => { ACT.deploy(); }, null, 900); await skipDlg(); await page.waitForTimeout(500); await shot('05_intro_a');
  await page.waitForSelector('.mvbtn', { timeout: 60000 }); await page.waitForTimeout(400); await shot('06_input');
  const b1 = await page.$('.mvbtn[data-s="1"]'); if (b1) await b1.click();
  for (const n of ['07_atk_a', '08_atk_b', '08_atk_c']) { await page.waitForTimeout(500); await shot(n); }
  await page.click('#bAuto');
  const done1 = await waitResult('09_auto_');
  await shot('10_result');
  console.log('rival won:', await page.evaluate(() => !!(BT.B && BT.B.result && BT.B.result.win)));
  if (done1) { await page.click('#rDone'); await page.waitForTimeout(900); await skipDlg(); await page.waitForTimeout(500); }
  await ev(() => closeModal());
  // mail: Safari Pass + Master Ball
  await ev(() => route('inbox')); await shot('11_mail');
  await ev(() => { ACT.claimAllMail(); }); await shot('12_claimed'); await ev(() => closeModal());
  await ev(() => route('hh')); await shot('13_safari');
  await page.evaluate(() => { ACT.pullGold5(); }); await page.waitForTimeout(1500); await shot('14_master_throw');
  await page.waitForTimeout(1800); await shot('15_master_card');
  await page.evaluate(() => { const d = document.getElementById('gDone'); if (d) d.click(); }); await page.waitForTimeout(300);
  await page.evaluate(() => { ACT.pullFree10(); }); await page.waitForTimeout(3600); await shot('16_ten');
  await page.evaluate(() => { const d = document.getElementById('gDone'); if (d) d.click(); }); await page.waitForTimeout(300);
  console.log('owned after pulls:', await page.evaluate(() => Object.keys(S.ops).length), 'fives:', await page.evaluate(() => S.stats.fives));
  for (const [n, fn, a] of [['17_home', v => route(v), 'home'], ['18_journey', v => route(v), 'story'], ['19_map', v => route('chapter', v), 'c1'], ['20_battlehub', v => route(v), 'battle'],
    ['21_explore', v => route('hunt', v), 'moon'], ['22_tower', v => route(v), 'tower'], ['23_link', v => route(v), 'arena'], ['24_box', v => route(v), 'ops'],
    ['25_summary', v => { UI.opTab = 'info'; route('op', v); }, 'squirtle'], ['26_moves', v => { UI.opTab = v; rerender(); }, 'skills'], ['27_train', v => { UI.opTab = v; rerender(); }, 'upgrade'],
    ['28_evolve', v => { UI.opTab = v; rerender(); }, 'evo'], ['29_item', v => { UI.opTab = v; rerender(); }, 'item'], ['30_dex', v => route(v), 'dex'],
    ['31_shop', v => { UI.shopTab = 'mart'; route(v); }, 'shop'], ['32_prize', v => { UI.shopTab = v; rerender(); }, 'prize'], ['33_bag', v => route(v), 'depot'],
    ['34_medals', v => route(v), 'ach'], ['35_card', v => route(v), 'settings']]) { await ev(fn, a); await shot(n); }
  await ev(() => dexModal('pikachu')); await shot('36_dexentry'); await ev(() => closeModal());
  await ev(() => missionsModal()); await shot('37_research'); await ev(() => closeModal());
  // evolution: raise Squirtle and evolve it
  await page.evaluate(() => { S.badges = 2; S.ops.squirtle.lvl = 16; ACT.evolve({ k: 'squirtle', to: 'wartortle' }); }); await page.waitForTimeout(1600); await shot('38_evolving');
  await page.waitForTimeout(2400); await shot('39_evolved');
  await page.evaluate(() => { const d = document.getElementById('evDone'); if (d) d.click(); }); await page.waitForTimeout(500); await shot('40_after_evo');
  // Brock with a strong team
  await ev(() => {
    for (const k of ['wartortle', 'ivysaur', 'pikachu', 'machop']) { if (!S.ops[k]) S.ops[k] = mkProg(15); S.ops[k].lvl = 15; }
    for (const id of ['1-3', '1-4', '1-5', 'S1-1', '1-6']) S.story[id] = 3;
    S.team.story = ['wartortle', 'ivysaur', 'pikachu', 'machop']; S.settings.auto = true; S.settings.speed = 2;
    ACT.openNode({ id: '1-7' }); ACT.startNode({ id: '1-7' }); ACT.deploy();
  }, null, 900);
  await skipDlg(); await page.waitForTimeout(1500); await shot('41_brock_intro');
  const done2 = await waitResult('42_brock_');
  await shot('43_brock_result');
  console.log('Brock won:', await page.evaluate(() => !!(BT.B && BT.B.result && BT.B.result.win)), 'badges:', await page.evaluate(() => S.badges));
  if (done2) { await page.click('#rDone'); await page.waitForTimeout(900); await skipDlg(); await page.waitForTimeout(700); await shot('44_badge'); }
  await ev(() => closeModal()); await ev(() => closeModal());
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
  await ev(() => { S.team.tower = ['wartortle', 'ivysaur', 'pikachu', 'machop']; launchTower(S.tower + 1); }, null, 7000);
  await shot('45_landscape');
  await page.setViewportSize({ width: 390, height: 844 });
  await ev(() => { BT.on && closeBattle(); route('settings'); ACT.askReset(); }); await page.fill('#rconf', 'delete'); await shot('46_delete');
  await ev(() => { ACT.doReset(); }, null, 1500); await shot('47_after_delete');
  console.log('after delete:', await page.evaluate(() => JSON.stringify({ named: S.named, mail: S.inbox.length, ops: Object.keys(S.ops).length, title: !document.getElementById('title').hidden })));
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await browser.close();
})();
