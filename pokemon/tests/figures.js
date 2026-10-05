// Data and sprite check: every Pokémon has animated front and back sprites (and they load), its menu GIF decodes back
// to the same frames, every kit move exists, every Ability has a battle effect, every evolution target exists, and
// every trainer sprite the Journey uses is embedded.
// Also saves a screenshot of a completed Pokédex. Run from the repo root: node pokemon/tests/figures.js
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SH = path.join(__dirname, 'shots') + '/'; fs.mkdirSync(SH, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE);
  await page.waitForFunction(() => SPR.ready, null, { timeout: 30000 });
  const report = await page.evaluate(() => {
    const bad = [];
    for (const k of OP_KEYS) {
      for (const [s, n] of [['f', 'front'], ['b', 'back']]) {
        const a = SPR.ani[s + ':' + k];
        if (!a) bad.push(`${k}: no ${n} sprite`); else if (a.seq.length < 4 || !(a.total > 0)) bad.push(`${k}: ${n} sprite isn't animated`);
      }
      if (!SPR.icon[k]) bad.push(k + ': no menu icon');
      if (!OPS[k].skills.length) bad.push(k + ': no moves');
      if (OPS[k].passives[0].id === 'NONE') bad.push(k + ': ability ' + OPS[k].ab + ' has no effect');
      for (const e of OPS[k].evo) if (!OPS[e.to]) bad.push(k + ': evolves into unknown ' + e.to);
    }
    const trainers = new Set();
    for (const id in NODES) { const nd = NODES[id]; if (nd.trainer) trainers.add(nd.trainer.spr); }
    for (const id in SPK) if (SPK[id].t && SPK[id].t !== 'me') trainers.add(SPK[id].t);
    for (const [, s] of TOWER_CLS.concat(ARENA_CLS)) trainers.add(s);
    for (const t of trainers) if (!SPR.box['t:' + t]) bad.push('trainer sprite missing: ' + t);
    const types = {}; for (const k of OP_KEYS) for (const t of OPS[k].types) types[t] = (types[t] || 0) + 1;
    const rar = {}; for (const k of OP_KEYS) rar[OPS[k].rar] = (rar[OPS[k].rar] || 0) + 1;
    return { pokemon: OP_KEYS.length, moves: Object.keys(MOVES).length, sprites: SPR.loaded + '/' + SPR.total, types, rarity: rar, safari: [3, 4, 5].map(r => SAFARI_POOL(r).length), bad };
  });
  // the menus' animated GIFs (encoded in the browser) decode back to the sheet's frames, pixel for pixel
  const gif = await page.evaluate(async () => {
    const bad = [], t0 = performance.now(); let frames = 0, bytes = 0;
    for (const k of OP_KEYS) {
      const url = gifOf('f:' + k);
      if (!url.startsWith('data:image/gif')) { bad.push(k + ': no animated GIF'); continue; }
      const a = SPR.ani['f:' + k], { S, ox, oy } = squareOf(a), data = Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0));
      bytes += data.length;
      const dec = new ImageDecoder({ data, type: 'image/gif' }); await dec.tracks.ready;
      const n = dec.tracks.selectedTrack.frameCount;
      if (n !== a.seq.length / 2) { bad.push(`${k}: ${n} GIF frames, expected ${a.seq.length / 2}`); dec.close(); continue; }
      const c = new OffscreenCanvas(S, S), g = c.getContext('2d', { willReadFrequently: true });
      const r = new OffscreenCanvas(a.w, a.h), rg = r.getContext('2d', { willReadFrequently: true });
      for (let i = 0; i < n; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        if (image.displayWidth !== S) bad.push(`${k}: GIF is ${image.displayWidth} wide, expected ${S}`);
        g.clearRect(0, 0, S, S); g.drawImage(image, 0, 0); image.close();
        rg.clearRect(0, 0, a.w, a.h); drawAniFrame(rg, a, a.seq[i * 2], 0, 0, a.w, a.h);
        const got = g.getImageData(ox, oy, a.w, a.h).data, want = rg.getImageData(0, 0, a.w, a.h).data;
        let diff = 0;
        for (let j = 0; j < got.length; j += 4) {
          const on = got[j + 3] > 127;
          if (on !== want[j + 3] > 127 || on && (got[j] !== want[j] || got[j + 1] !== want[j + 1] || got[j + 2] !== want[j + 2])) diff++;
        }
        if (diff) { bad.push(`${k} frame ${i}: ${diff} pixels differ`); break; }
        frames++;
      }
      dec.close();
    }
    return { gifs: OP_KEYS.length, frames, kb: Math.round(bytes / 1024), ms: Math.round(performance.now() - t0), bad };
  });
  report.bad.push(...gif.bad); delete gif.bad; report.gif = gif;
  console.log(JSON.stringify(report, null, 1));
  await page.evaluate(() => { for (const k of OP_KEYS) dexCatch(k); UI.inGame = true; document.getElementById('title').hidden = true; route('dex'); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: SH + 'dex_full.png', fullPage: false });
  await browser.close();
  process.exit(report.bad.length ? 1 : 0);
})();
