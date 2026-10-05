// Title screen accounts: Guest play, register, separate saves, log out, log back in, wrong password.
// Run from the repo root after `npm install` and `npx playwright install chromium`: node mobile/tests/accounts.js
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
// throwaway local test account (stored only in the test browser's localStorage)
const TEST_ID = 'TestDoctor', TEST_PW = 'test-pass-1234';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) process.exitCode = 1; };
  const title = async () => { await page.waitForSelector('#tTouch', { timeout: 8000 }); };
  await page.goto(PAGE); await title();
  // 1. guest play keeps the original save key
  await page.click('#tTouch'); await page.waitForTimeout(300); await page.click('#tGuest'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => SAVE_SLOT === SAVE_KEY && !!S), 'guest uses the original save');
  await page.evaluate(() => { S.lmd = 424242; save(); ACT.logout(); }); await title();
  // 2. register a new account with guest progress carried over
  await page.click('#tTouch'); await page.waitForTimeout(300);
  await page.click('.tpanel [data-tab=register]'); await page.waitForTimeout(200);
  await page.fill('#tId', TEST_ID); await page.fill('#tPw', TEST_PW); await page.fill('#tPw2', TEST_PW);
  ok(await page.$('#tCarry') !== null, 'register offers to carry over guest progress');
  await page.click('#tGo'); await page.waitForTimeout(1200);
  ok(await page.evaluate(() => SESSION && SESSION.name === 'TestDoctor' && SAVE_SLOT.includes(':acct:')), 'registered and logged in');
  ok(await page.evaluate(() => S.lmd === 424242 && S.name === 'TestDoctor'), 'guest progress carried over to the account');
  await page.evaluate(() => { S.lmd = 777; save(); }); await page.waitForTimeout(300);
  // 3. remembered login: reload and touch to start goes straight in
  await page.reload(); await title();
  ok((await page.textContent('.tuser')).includes('TestDoctor'), 'title remembers the account');
  await page.click('#tTouch'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => S && S.lmd === 777), 'remembered account loads its own save');
  // 4. log out, wrong password, right password
  await page.evaluate(() => ACT.logout()); await title();
  await page.click('#tTouch'); await page.waitForTimeout(300);
  await page.fill('#tId', TEST_ID); await page.fill('#tPw', 'wrong-password'); await page.click('#tGo'); await page.waitForTimeout(500);
  ok((await page.textContent('#tErr')).includes('Wrong password') && await page.evaluate(() => !S), 'wrong password is refused');
  await page.fill('#tPw', TEST_PW); await page.click('#tGo'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => S && S.lmd === 777), 'logs back in to the same save');
  // 5. guest save is now a fresh one, separate from the account
  await page.evaluate(() => ACT.logout()); await title();
  await page.click('#tTouch'); await page.waitForTimeout(300); await page.click('#tGuest'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => S.lmd !== 777 && S.lmd !== 424242), 'guest and account saves are separate');
  console.log('errors', errs);
  await browser.close();
})();
