// Social systems: Inbox (welcome ten-roll), weekly banners, World chat and replies, guild join/donate/boss fight, profiles, Settings.
// Run from the repo root after `npm install` and `npx playwright install chromium`: node mobile/tests/social.js
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
  await page.evaluate(() => { localStorage.clear(); enterGuest(); S.seenIntro = true; closeModal(); });
  // Inbox: the welcome ten-roll
  ok(await page.evaluate(() => S.mail.some(m => m.rewards && m.rewards.hh10)), 'new save gets a ten-roll permit by mail');
  await page.evaluate(() => route('inbox')); await shot('300_inbox');
  await page.click('[data-act="mailAll"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => S.inv.hh10 === 1 && S.mail.every(m => m.claimed)), 'claim all puts the permit in the Depot');
  await page.evaluate(() => closeModal());
  // Headhunting: three weekly banners + standard; the ten-roll permit pulls ten
  await page.evaluate(() => route('hh')); await page.waitForTimeout(200); await shot('301_banners');
  ok((await page.$$('.bchip')).length === 4, 'three themed banners and the standard banner');
  await page.click('[data-act="pull"][data-ten="1"]'); await page.waitForTimeout(300);
  await page.evaluate(async () => { const t = $('#gT'); if (t) t.click(); }); await page.waitForTimeout(1500);
  await page.evaluate(() => { const d = $('#gDone'); if (d) d.click(); }); await page.waitForTimeout(300);
  ok(await page.evaluate(() => S.inv.hh10 === 0 && S.gacha.total === 10), 'ten-roll permit used');
  // World chat: the world talks, and answers the player
  await page.evaluate(() => { UI.chatTab = 'world'; route('chat'); });
  const before = await page.evaluate(() => S.chat.world.length);
  ok(before >= 5, 'World chat has recent messages when you arrive');
  await page.fill('#cin', 'hey everyone, who should I build first?'); await page.click('[data-act="chatSend"]');
  for (let k = 0; k < 8; k++) { await page.evaluate(() => { for (const x of S.chat.q) x.at -= 20000; tickTimers(); }); await page.waitForTimeout(120); }
  const replies = await page.evaluate(() => { const i = S.chat.world.findIndex(m => m.i === -1); return S.chat.world.slice(i + 1).filter(m => m.i >= 0).length; });
  ok(replies >= 1, `other Doctors reply (${replies})`);
  await shot('302_chat');
  // personalities differ
  const kinds = await page.evaluate(() => new Set(Array.from({ length: 300 }, (_, i) => person(i).arch + person(i).style.laugh)).size);
  ok(kinds > 40, `varied personalities (${kinds} archetype/style combos in 300 Doctors)`);
  // Guild: join an open guild, donate, fight the boss
  await page.evaluate(() => { S.lvl = 30; S.lmd = 500000; route('guild'); }); await page.waitForTimeout(200); await shot('303_guild_find');
  await page.evaluate(() => { const g = guildList().find(x => x.pol === 'open' && x.mem.length < guildCap(x) && x.minLvl <= S.lvl); requestJoin(g); });
  ok(await page.evaluate(() => !!S.guild && myGuild().mem.includes(-1)), 'joined an open guild');
  await page.evaluate(() => { UI.gTab = 'donate'; rerender(); }); await page.click('[data-act="gdonate"][data-id="lmd"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => myGuild().don.by[-1] === 'lmd'), 'donated');
  await page.evaluate(() => { closeModal(); UI.gTab = 'boss'; rerender(); }); await page.waitForTimeout(200); await shot('304_guild_boss');
  const hp0 = await page.evaluate(() => gBoss(myGuild()).hp);
  await page.evaluate(() => { S.settings.speed = 3; S.settings.auto = true; for (const k of ['exusiai', 'hoshiguma', 'nightingale', 'ifrit']) S.ops[k] = progForLV(k, 70); S.team.gboss = ['exusiai', 'hoshiguma', 'nightingale', 'ifrit']; });
  await page.click('[data-act="gbossGo"]'); await page.waitForTimeout(300);
  await page.click('[data-act="deploy"]');
  await page.waitForTimeout(2500); await shot('305_gboss_battle');
  await page.waitForSelector('#rDone', { timeout: 180000 }); await shot('306_gboss_result');
  await page.click('#rDone'); await page.waitForTimeout(300);
  ok(await page.evaluate(h => gBoss(myGuild()).hp < h || gBoss(myGuild()).stage > 1, hp0), 'boss attack dealt damage');
  ok(await page.evaluate(() => gbTriesLeft() === 1), 'one attack left today');
  // profile of a guild member, invites
  await page.evaluate(() => profModal(myGuild().mem.find(i => i >= 0))); await page.waitForTimeout(200); await shot('307_profile');
  await page.evaluate(() => closeModal());
  // Settings and Achievements screens
  await page.evaluate(() => route('settings')); await page.waitForTimeout(200); await shot('308_settings');
  await page.click('[data-act="setTog"][data-k="cutins"]');
  ok(await page.evaluate(() => S.settings.cutins === false), 'settings toggle');
  await page.evaluate(() => route('achv')); await page.waitForTimeout(200); await shot('309_achievements');
  ok(await page.evaluate(() => Object.keys(S.ach2 || {}).length >= 2), 'achievements unlock and mail their rewards');
  // landscape lobby
  await page.setViewportSize({ width: 844, height: 390 }); await page.evaluate(() => route('home')); await page.waitForTimeout(300); await shot('310_home_landscape');
  console.log('errors', errs);
  if (errs.length) process.exitCode = 1;
  await browser.close();
})();
