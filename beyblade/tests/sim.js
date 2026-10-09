// Balance check: auto-vs-auto win rates (and average battle length) for each story battle, Street Battle level and some
// BBA Tower floors, with the real-time engine stepped headlessly. The story is checked with the three starters (a few
// levels under, at and over the stage level) and with a team from that season's story rewards. VARIANTS=1 instead rates
// every Beyblade in a fixed squad against three gauntlets, to spot outliers; TYPES=1 prints the average per type.
// N sets the battles per row (default 12).
const path = require('path');
const { chromium } = require('playwright');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE); await page.waitForTimeout(500);
  const out = await page.evaluate(([variants, N]) => {
    const run = (team, foes, LV) => {
      const B = makeBattle({ allies: team.map(k => ({ op: k, prog: progForLV(k, LV) })), foes, auto: true, aiStyle: "balanced" });
      B.start(.75, .7);
      let g = 0; while (!B.over && g++ < 12000) { B.tick(); B.ev.length = 0; }
      return { win: !!(B.result && B.result.win), t: B.t };
    };
    const sim = (team, foes, LV, n = N) => {
      let w = 0, t = 0; for (let i = 0; i < n; i++) { const r = run(team, foes, LV); if (r.win) w++; t += r.t; }
      return `${(Math.round(w / n * 100) + "%").padStart(4)} ${String(Math.round(t / n)).padStart(3)}s`;
    };
    const starters = STARTERS.slice(0, TEAM_SIZE), rows = [];
    // the team a player is likely to have by each season: the story's reward Beyblades
    const SEASON_TEAM = { "Season 1": ["tyson-f", "kai-s", "lee-s"], "V-Force": ["tyson-v", "kai-f", "max-f"], "G-Revolution": ["tyson-v2", "daichi-v", "max-v"] };
    if (variants) {
      const boss = k => { const id = "sim_" + k; bossOf(id, k, 2.6, 1.05); return id; };
      const G = ["tyson-v", "max-v", "zeo-v"].map(k => [{ en: "biovolt", LV: 42 }, { en: "guardian", LV: 42 }, { en: boss(k), LV: 40 }]);
      const squad = ["mariah-s", "spencer-s"];
      const M = variants === "type" ? 4 : 10, rate = k => { let w = 0;
        for (const foes of G) for (let i = 0; i < M; i++) if (run([k, ...squad], foes, 40).win) w++;
        return Math.round(w / M / G.length * 100); };
      const res = OP_KEYS.map(k => [k, OPS[k].rar, rate(k)]);
      const avg = f => { const l = res.filter(f); return Math.round(l.reduce((a, r) => a + r[2], 0) / l.length); };
      const sum = [...ELS.map(e => `${e} ${avg(r => OPS[r[0]].el === e)}%`), ...[3, 4, 5].map(x => `${x}★ ${avg(r => r[1] === x)}%`)].join(" · ");
      if (variants === "type") return sum;
      return sum + "\n" + res.sort((a, b) => b[2] - a[2]).map(r => `${r[0].padEnd(16)} ${OPS[r[0]].el.padEnd(9)} ${r[1]}★ ${String(r[2]).padStart(3)}%`).join("\n");
    }
    for (const nd of Object.values(NODES)) if (nd.waves) {
      const foes = rivalTeam(nd.waves, nd.lv), team = SEASON_TEAM[nd.ch.season];
      rows.push(`${nd.id.padEnd(6)} ${nd.type.padEnd(6)} lv${String(nd.lv).padEnd(3)} starters@-3:${sim(starters, foes, Math.max(1, nd.lv - 3))} @+0:${sim(starters, foes, nd.lv)} @+5:${sim(starters, foes, nd.lv + 5)} | season@+0:${sim(team, foes, nd.lv)}`);
    }
    const late = SEASON_TEAM["V-Force"];
    for (const h of HUNTS) for (const l of [1, 3, 6]) rows.push(`street ${h.code}-${l} lv${HUNT_LV[l - 1]} team@lv:${sim(late, huntTeam(h, l), HUNT_LV[l - 1])}`);
    for (const f of [1, 5, 10, 20, 30]) { const T = towerFloor(f); rows.push(`tower ${f} lv${T.lv} team@lv:${sim(late, rivalTeam(T.waves, T.lv), T.lv)}`); }
    return rows.join("\n");
  }, [process.env.TYPES ? "type" : !!process.env.VARIANTS, +process.env.N || 12]);
  console.log(out); console.log('errs', errs);
  await browser.close();
})();
