// The figure gallery: every fighter and enemy drawn in a stance and four fighting poses (Rush, beam wind-up, beam, guard),
// plus every menu card and head icon, so a change to the renderer can be checked at a glance. Writes tests/shots/figures_*.png.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE); await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const list = [...OP_KEYS.map(k => [opLabel(OPS[k]), OPS[k].fig]), ...Object.keys(ENEMY).filter(k => !ENEMY[k].op).map(k => [ENEMY[k].n, ENEMY[k].fig])];
    const poses = [["idle", .5], ["punch", .55], ["beamWind", .8], ["beam", .8], ["guard", .6]], C = 5, W = 120, H = 170;
    const cv = document.createElement("canvas"); cv.width = C * poses.length * W; cv.height = Math.ceil(list.length / C) * H;
    const g = cv.getContext("2d");
    list.forEach(([n, f], i) => poses.forEach(([ps, t], j) => {
      const x = ((i % C) * poses.length + j) * W, y = Math.floor(i / C) * H;
      g.fillStyle = (i % 2) ? "#24304e" : "#1e2844"; g.fillRect(x, y, W, H);
      g.save(); g.translate(x + W * .42, y + H - 12); const sc = Math.min(1.2, 130 / figTall(f)); g.scale(sc, sc); drawFigure(g, f, { name: ps, t, time: 1.3 }); g.restore();
      if (!j) { g.fillStyle = "#fff"; g.font = "11px sans-serif"; g.fillText(n, x + 4, y + 12); }
    }));
    document.body.innerHTML = ""; document.body.appendChild(cv); cv.id = "gal";
    // menu art: every card and head icon
    const wrap = document.createElement("div"); wrap.id = "cards"; wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;background:#111;width:1400px";
    wrap.innerHTML = OP_KEYS.map(k => `<div style="width:130px;text-align:center;color:#fff;font:10px sans-serif"><img src="${opArt(k).full}" style="width:130px"><img src="${opArt(k).head}" style="width:48px;border-radius:50%"><div>${OPS[k].n}</div></div>`).join("");
    document.body.appendChild(wrap);
    return { fighters: OP_KEYS.length, enemies: list.length - OP_KEYS.length };
  });
  await page.waitForTimeout(500);
  await (await page.$('#gal')).screenshot({ path: SH + 'figures_poses.png' });
  await (await page.$('#cards')).screenshot({ path: SH + 'figures_cards.png' });
  console.log(JSON.stringify(info), 'ERRORS', JSON.stringify(errs));
  await browser.close();
})();
