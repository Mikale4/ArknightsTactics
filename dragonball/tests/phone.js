// Phone-size playthrough of Dragon Ball Z: Legend of the Z Fighters: title screen, new account, intro, the chapter field
// (walking, flying, a wandering enemy), a manual battle (planning commands, GO, holding POWER, GUARD, VANISH) and then Auto,
// every hub screen, the Mailbox and its free Summons, Z Records, the Scouter Card, a boss that transforms, a minigame,
// a landscape battle, and finally an account reset back to the title. Screenshots go to tests/shots/.
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
  const waitResult = async (tag, max = 160) => {
    for (let k = 0; k < max; k++) { await page.waitForTimeout(700); if (await page.$('#rDone')) return true; if (tag && [4, 10, 18].includes(k)) await shot(tag + k); }
    return false;
  };
  const tap = sel => page.evaluate(s => { const b = document.querySelector(s); if (b) { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })), 80); } return !!b; }, sel);
  await page.waitForTimeout(1200); await shot('00_title');
  await page.mouse.click(195, 500); await page.waitForTimeout(700); await shot('00b_name');
  await page.fill('#nname', 'Goku Fan'); await ev(() => { ACT.nameGo(); });
  await shot('01_intro');
  await ev(() => { ACT.introGo(); }, null, 900); await shot('02_field');
  // the field: walk right, jump and fly, then tap the first stage and let the lead walk there
  await tap('#field .fb[data-k="R"]'); await page.evaluate(() => { FIELD.keys.R = true; }); await page.waitForTimeout(700); await page.evaluate(() => { FIELD.keys.R = false; });
  await page.evaluate(() => { FIELD.keys.U = true; fieldJump(); }); await page.waitForTimeout(500); await shot('02b_fly'); await page.evaluate(() => { FIELD.keys.U = false; FIELD.keys.D = true; }); await page.waitForTimeout(800); await page.evaluate(() => { FIELD.keys.D = false; });
  await ev(() => { ACT.openNode({ id: '1-1' }); }, null, 2500); await shot('02c_sheet');
  await ev(() => { ACT.startNode({ id: '1-1' }); }, null, 900); await shot('03_dialogue'); await skipDlg(); await page.waitForTimeout(400);
  await ev(() => closeModal());
  await ev(() => { ACT.startNode({ id: '1-2' }); }); await shot('04_party');
  await ev(() => { ACT.deploy(); }, null, 700); await shot('05_pre'); await skipDlg();
  // a turn by hand: Rush, Ki Blast, Power Up, then GO; hold POWER through the first wind-up
  await page.waitForSelector('.cmd', { timeout: 20000 }); await page.waitForTimeout(400); await shot('06_plan');
  for (const c of ['rush', 'blast', 'charge']) await page.click(`.cmd[data-c="${c}"]`);
  await shot('06b_picked');
  await page.click('#pGo');
  await page.waitForSelector('#bPow', { timeout: 5000 });
  await page.evaluate(() => BT.B.hold(true)); await page.waitForTimeout(700); await shot('07_power'); await page.evaluate(() => BT.B.hold(false));
  // guard every attack that comes: tap GUARD when the ring is about to close
  let guards = 0;
  for (let i = 0; i < 40; i++) {
    const t = await page.evaluate(() => { const B = BT.B, a = B && B.incoming(); return a ? a.impactAt - B.t : null; });
    if (t != null && t < .17 && t > 0) { await tap('#bGrd'); guards++; await page.waitForTimeout(150); }
    else await page.waitForTimeout(40);
    if (i === 20) await shot('07b_action');
  }
  console.log('guard taps:', guards, 'perfect guards so far:', await page.evaluate(() => BT.B.tally.perfects));
  await page.click('#bAuto');
  const done1 = await waitResult('09_auto_');
  await shot('10_result');
  if (done1) { await page.click('#rDone'); await page.waitForTimeout(900); await skipDlg(); await page.waitForTimeout(400); }
  for (const [n, fn, a] of [['11_home', v => route(v), 'home'], ['12_story', v => route(v), 'story'], ['13_field', v => route('chapter', v), 'c1'], ['14_battlehub', v => route(v), 'battle'],
    ['15_training', v => route('hunt', v), 'kingkai'], ['16_tournament', v => route(v), 'tower'], ['17_rankings', v => route(v), 'arena'], ['18_fighters', v => route(v), 'ops'],
    ['19_fighter', v => { UI.opTab = 'info'; route('op', v); }, 'goku-s'], ['20_techniques', v => { UI.opTab = v; rerender(); }, 'skills'], ['20b_training', v => { UI.opTab = v; rerender(); }, 'upgrade'],
    ['20c_proficiency', v => { UI.opTab = v; rerender(); }, 'runes'], ['20d_forms', v => { UI.opTab = 'info'; route('op', v); }, 'goku-ssj'], ['21_summon', v => route(v), 'hh'],
    ['22_shop', v => { UI.shopTab = 'credit'; route(v); }, 'shop'], ['23_items', v => route(v), 'depot']]) { await ev(fn, a); await shot(n); }
  // mailbox: the welcome mail holds ten free Summons and Shenron's Wish
  await ev(() => route('inbox')); await shot('23b_inbox');
  await ev(() => { ACT.openMail({ id: String(S.inbox.find(m => m.tag === 'welcome').id) }); }); await shot('23c_mail');
  await ev(() => { ACT.claimAllMail(); }); await shot('23d_claimed'); await ev(() => closeModal());
  await ev(() => route('hh')); await shot('23e_freepulls');
  await page.evaluate(() => { ACT.pullGold5(); }); await page.waitForTimeout(1400); await shot('23f_shenron');
  await page.mouse.click(195, 420); await page.waitForTimeout(1200); await shot('23g_gold5');
  console.log("5★ from Shenron's Wish:", await page.evaluate(() => S.stats.fives >= 1));
  await page.evaluate(() => { const d = document.getElementById('gDone'); if (d) d.click(); }); await page.waitForTimeout(300);
  await page.evaluate(() => { ACT.pullFree10(); }); await page.waitForTimeout(700); await page.mouse.click(195, 420); await page.waitForTimeout(2300); await shot('25_cards');
  await page.evaluate(() => { const d = document.getElementById('gDone'); if (d) d.click(); }); await page.waitForTimeout(300);
  await ev(() => missionsModal()); await shot('26_missions'); await ev(() => closeModal());
  await ev(() => route('ach')); await shot('26b_records');
  await ev(() => route('settings')); await shot('26d_card');
  // a minigame: Snake Way, played by hand with jumps at the gaps
  await ev(() => { for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '2-1']) S.story[id] = 3; route('chapter', 'c2'); launchGame(NODES['2-2']); }, null, 600);
  await shot('27_game_help'); await page.click('#gStart');
  for (let i = 0; i < 900; i++) { await page.evaluate(() => { const G = window.MG; if (G && !G.over) G.press(G.ai()); }); await page.waitForTimeout(30); if (i === 120) await shot('27b_game'); if (await page.$('#rDone')) break; }
  console.log('Snake Way stars:', await page.evaluate(() => nodeStars('2-2')));
  await page.waitForTimeout(500); await shot('27c_game_result');
  if (await page.$('#rDone')) await page.click('#rDone');
  await page.waitForTimeout(600);
  // the Saiyan Saga boss: Vegeta turns into a Great Ape when beaten
  await ev(() => {
    for (const k of ['goku-k', 'piccolo-s', 'tien-s', 'gohan-s']) S.ops[k] = progForLV(k, 60);
    for (const id of Object.keys(NODES).filter(k => /^[1-5]-|^6-[12]$/.test(k))) S.story[id] = 3;
    S.team.story = ['goku-k', 'piccolo-s', 'tien-s']; S.settings.auto = true; S.settings.speed = 3;
    ACT.startNode({ id: '6-3' }); ACT.deploy();
  }, null, 900);
  await skipDlg();
  let transformed = false;
  for (let i = 0; i < 260 && !(await page.$('#rDone')); i++) { await page.waitForTimeout(500); if (!transformed && await page.evaluate(() => BT.B && BT.B.units.some(u => u.form > 0))) { transformed = true; await page.waitForTimeout(400); await shot('28_great_ape'); } if (i === 12) await shot('28b_boss'); }
  console.log('boss transformed:', transformed, 'won:', await page.evaluate(() => !!(BT.B && BT.B.result && BT.B.result.win)), 'struggles:', await page.evaluate(() => BT.B && BT.B.tally.struggles));
  await shot('28c_boss_result');
  if (await page.$('#rDone')) { await page.click('#rDone'); await page.waitForTimeout(900); await skipDlg(); await page.waitForTimeout(600); await shot('29_chapter_cleared'); }
  console.log('mystery gift:', await page.evaluate(() => { for (const id of Object.keys(NODES).filter(k => /^6-/.test(k))) S.story[id] = S.story[id] || 1; mysteryGift(); return S.inbox.some(m => m.tag === 'mystery'); }));
  await ev(() => closeModal());
  await ev(() => { ACT.setLook({ v: 'vegeta' }); route('settings'); }, null, 600); await shot('29b_card_look');
  await ev(() => route('home'), null, 500); await shot('29c_home_look');
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
  await ev(() => { S.settings.auto = false; S.team.tower = ['goku-k', 'piccolo-s', 'tien-s']; launchTower(S.tower + 1); }, null, 3200);
  await shot('30_landscape_plan');
  await page.evaluate(() => { const c = document.querySelector('.cmd[data-c="t0"]'); if (c) c.click(); const g = document.querySelector('#pGo'); if (g) g.click(); }); await page.waitForTimeout(900);
  await shot('30b_landscape_action');
  // reset the account from Settings: back to a brand-new title screen with fresh welcome mail
  await page.setViewportSize({ width: 390, height: 844 });
  await ev(() => { if (BT.on) closeBattle(); route('settings'); ACT.askReset(); }); await page.fill('#rconf', 'reset'); await shot('31_reset');
  await ev(() => { ACT.doReset(); }, null, 1500); await shot('32_after_reset');
  console.log('after reset:', await page.evaluate(() => JSON.stringify({ named: S.named, mail: S.inbox.length, ops: Object.keys(S.ops).length, title: !document.getElementById('title').hidden })));
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await browser.close();
})();
