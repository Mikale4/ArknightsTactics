// Data and sprite check: every Pokémon has front and back sprites (and they load), every kit move exists, every Ability
// has a battle effect, every evolution target exists, and every trainer sprite the Journey uses is embedded.
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
      if (!SPR.box['f:' + k]) bad.push(k + ': no front sprite');
      if (!SPR.box['b:' + k]) bad.push(k + ': no back sprite');
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
  console.log(JSON.stringify(report, null, 1));
  await page.evaluate(() => { for (const k of OP_KEYS) dexCatch(k); UI.inGame = true; document.getElementById('title').hidden = true; route('dex'); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: SH + 'dex_full.png', fullPage: false });
  await browser.close();
  process.exit(report.bad.length ? 1 : 0);
})();
