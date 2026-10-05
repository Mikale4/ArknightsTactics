// Renders operator figures next to their art, plus a pose sheet, to tests/shots/80_figs.png and 81_poses.png.
// Run from the repo root after `npm install` and `npx playwright install chromium`.
const path = require('path'), fs = require('fs');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  await page.waitForTimeout(500);
  const keys = ["amiya","exusiai","texas","lappland","silverash","surtr","skadi","saria","ifrit","eyjafjalla","mostima","hoshiguma","nightingale","ptilopsis","angelina","suzuran","blaze","schwarz","fang","kroos","melantha","ansel","bagpipe","ling","mudrock","specter","thorns","mountain","nearl","ceobe","siege","archetto","lancet-2","executor","plume","weedy"];
  await page.evaluate(keys => {
    document.body.innerHTML = ''; document.body.style.background = '#1b2233'; document.body.style.overflow = 'auto';
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 1000; document.body.appendChild(cv);
    const g = cv.getContext('2d');
    g.fillStyle = '#2a3348'; g.fillRect(0, 0, 1400, 1000);
    keys.forEach((k, i) => {
      const col = i % 12, row = Math.floor(i / 12), x = 30 + col * 114, y = 20 + row * 330;
      const img = new Image(); img.src = spriteURL(OPS[k]);
      img.onload = () => { const h = 130, w = h * img.naturalWidth / img.naturalHeight; g.drawImage(img, x + 50 - w / 2, y, w, h); };
      g.save(); g.translate(x + 50, y + 300); g.scale(1.45, 1.45); drawFigure(g, OPS[k].fig, { name: 'idle', time: .6 }); g.restore();
      g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText(OPS[k].n + ' · ' + OPS[k].fig.w, x + 50, y + 318);
    });
  }, keys);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SH + '80_figs.png' });
  // poses
  await page.evaluate(() => {
    const cv = document.querySelector('canvas'), g = cv.getContext('2d');
    g.fillStyle = '#2a3348'; g.fillRect(0, 0, 1400, 1000);
    const ks = ['fang', 'hoshiguma', 'archetto', 'eyjafjalla', 'nightingale', 'texas', 'kroos'], poses = [['idle', 0], ['swing', .3], ['swing', .5], ['shoot', .15], ['cast', .6], ['buff', .6], ['hit', .1], ['victory', 0]];
    ks.forEach((k, r) => poses.forEach(([p, t], c) => {
      g.save(); g.translate(80 + c * 165, 130 + r * 135); g.scale(1.1, 1.1); drawFigure(g, OPS[k].fig, { name: p, t, time: 1 }); g.restore();
      if (!r) { g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(p + ' ' + t, 60 + c * 165, 14); }
    }));
  });
  await page.screenshot({ path: SH + '81_poses.png' });
  console.log('errs', errs);
  await browser.close();
})();
