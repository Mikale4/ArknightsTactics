// Galleries: every Blader's figure (tests/shots/figures.png), every Beyblade with its Bit-Chip (tests/shots/beys.png),
// every Bit-Beast kind (tests/shots/beasts.png) and a pose sheet (tests/shots/poses.png).
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1060 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE); await page.waitForTimeout(500);
  await page.evaluate(() => {
    document.body.innerHTML = ''; document.body.style.background = '#0b1428';
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 1060; document.body.appendChild(cv);
    const g = cv.getContext('2d'); g.fillStyle = '#111d38'; g.fillRect(0, 0, 1400, 1060);
    const list = [...BLADERS.map(c => [c.short || c.n, c.fig]), ...['street', 'shark', 'bully', 'trainee', 'biovolt', 'dark', 'cyber', 'bega', 'guardian', 'tiger', 'knight', 'allstar'].map(k => [ENEMY[k].n, ENEMY[k].fig])];
    list.forEach(([n, f], i) => {
      const x = 46 + (i % 16) * 86, y = 200 + Math.floor(i / 16) * 215;
      g.save(); g.translate(x, y); g.scale(1.25, 1.25); drawFigure(g, f, { name: 'idle', time: .6 }); g.restore();
      g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText(n.length > 14 ? n.slice(0, 13) + '…' : n, x, y + 16);
    });
  });
  await page.screenshot({ path: SH + 'figures.png' });
  await page.evaluate(() => {
    const cv = document.querySelector('canvas'), g = cv.getContext('2d'); g.fillStyle = '#111d38'; g.fillRect(0, 0, 1400, 1060);
    OP_KEYS.forEach((k, i) => {
      const op = OPS[k], x = 50 + (i % 14) * 96, y = 90 + Math.floor(i / 14) * 168;
      g.save(); g.translate(x, y); g.scale(1, 1); drawBey(g, op.bey, { e: .55, spin: i * .7, blur: .2 }); g.restore();
      g.fillStyle = ELC[op.el]; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText(op.n.length > 16 ? op.n.slice(0, 15) + '…' : op.n, x, y + 18);
      g.fillStyle = '#a3b2cf'; g.font = '9px sans-serif'; g.fillText(op.blader + ' · ' + op.rar + '★', x, y + 30);
    });
  });
  await page.screenshot({ path: SH + 'beys.png' });
  await page.evaluate(() => {
    const cv = document.querySelector('canvas'), g = cv.getContext('2d'); g.fillStyle = '#060a16'; g.fillRect(0, 0, 1400, 1060);
    const kinds = ['dragon', 'bird', 'cat', 'wolf', 'horned', 'lizard', 'turtle', 'serpent', 'fish', 'ape', 'horse', 'god', 'gargoyle', 'humanoid'];
    const cols = ['#4ab4ff', '#ff6a2a', '#d8ffc8', '#cfe8ff', '#c86a3a', '#3ac88a', '#4ac8a8', '#a8c84a', '#3a8ad8', '#f2d04e', '#ff9ad8', '#ffd34d', '#d85a9a', '#d8a46a'];
    kinds.forEach((k, i) => {
      const x = 140 + (i % 5) * 280, y = 190 + Math.floor(i / 5) * 345;
      g.save(); g.translate(x, y); g.scale(.85, .85); drawBeast(g, k, cols[i], .9, 1); g.restore();
      g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText(k, x, y + 140);
    });
  });
  await page.screenshot({ path: SH + 'beasts.png' });
  await page.evaluate(() => {
    const cv = document.querySelector('canvas'), g = cv.getContext('2d'); g.fillStyle = '#111d38'; g.fillRect(0, 0, 1400, 1060);
    const ks = ['tyson-s', 'kai-s', 'ray-s', 'max-s', 'kenny-s', 'brooklyn-g', 'mingming-g'], poses = [['idle', 0], ['swing', .3], ['swing', .5], ['shoot', .15], ['cast', .6], ['buff', .6], ['hit', .1], ['victory', 0]];
    ks.forEach((k, r) => poses.forEach(([p, t], c) => { g.save(); g.translate(80 + c * 165, 140 + r * 140); g.scale(1.1, 1.1); drawFigure(g, OPS[k].fig, { name: p, t, time: 1 }); g.restore(); }));
  });
  await page.screenshot({ path: SH + 'poses.png' });
  console.log('errs', errs);
  await browser.close();
})();
