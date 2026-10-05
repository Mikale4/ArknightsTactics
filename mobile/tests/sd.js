// SD battle sprites + Pokémon-style camera: serves the repo over HTTP (sprites can't load from file://), plays a full auto battle
// with Spine 3.5 and 3.8 operators against SD enemies, and checks every unit with a sprite used it, with no page errors.
// Run from the repo root after `npm install` and `npx playwright install chromium`: node mobile/tests/sd.js
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const ROOT = path.resolve(__dirname, '../..'), PORT = 8765;
const { chromium } = require('playwright');
(async () => {
  const srv = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  try {
    for (const [W, H, tag] of [[390, 844, 'p'], [844, 390, 'l']]) {
      const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
      const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
      await page.goto(`http://localhost:${PORT}/mobile/`); await page.waitForTimeout(800);
      ok(await page.evaluate(() => SD.on && Object.keys(SD_OPS).length > 150 && Object.keys(SD_EN).length > 20), `${tag}: SD sprites listed`);
      // Heidi (Aceship) and Ines (PRTS) are Spine 3.8, Amiya and Blaze 3.5 (Blaze's skeleton has huge invisible effect parts); 2-6 has Reunion soldiers and Skullshatterer
      await page.evaluate(() => { localStorage.clear(); enterGuest(); S.seenIntro = true; closeModal();
        const ks = ['amiya', 'heidi', 'blaze', 'ines']; for (const k of ks) S.ops[k] = progForLV(k, 70); S.team.story = ks;
        S.settings.speed = 3; S.settings.auto = true; S.settings.ai = 'balanced';
        for (const id of ['1-1','1-2','1-3','1-4','1-5','1-6','1-7','2-1','2-2','2-3','2-4','2-5','2-6']) S.story[id] = 1; launchNode('2-6'); });
      await page.waitForTimeout(9000); await page.screenshot({ path: SH + `360_sd_${tag}.png` });
      const st = await page.evaluate(() => [...BT.vus.values()].map(v => ({ k: v.u.key, want: !!sdSpec(v.u), sd: !!v.sd, back: !!(v.sd && v.sd.b) })));
      ok(st.filter(v => v.want).every(v => v.sd), `${tag}: every unit with a sprite uses it (${st.map(v => v.k + (v.sd ? '' : '*')).join(' ')})`);
      ok(st.some(v => v.k === 'heidi' && v.sd) && st.some(v => v.k === 'ines' && v.sd), `${tag}: Spine 3.8 operators load (Aceship and PRTS)`);
      // every living unit's health bar is on screen at the home camera
      const bars = await page.evaluate(() => { camHome(100); return new Promise(r => setTimeout(() => r([...BT.vus.values()].filter(v => !v.dead && v.scr && v.out).map(v => { const q = proj(BT.K, ...billboard(v, v.out.top)); return [v.u.key, q ? Math.round(q[1]) : null]; })), 600)); });
      ok(bars.every(([, y]) => y != null && y > 0 && y < H), `${tag}: health bars on screen ${JSON.stringify(bars)}`);
      await page.waitForSelector('#rDone', { timeout: 240000 }); await page.screenshot({ path: SH + `361_sd_result_${tag}.png` });
      ok(await page.evaluate(() => Object.keys(SD.fail).length === 0) , `${tag}: no sprite failures ${JSON.stringify(await page.evaluate(() => SD.fail))}`);
      ok(errs.length === 0, `${tag}: no page errors ${JSON.stringify(errs.slice(0, 3))}`);
      await page.close();
    }
  } finally { await browser.close(); srv.kill(); }
})();
