// =====================================================================
//  FIELD AND MINIGAMES — the Goku Gekitōden parts outside battle.
//  The field: each chapter is a side-scrolling map. The chapter's lead walks, jumps and flies (hold ▲ in the air);
//  stages stand along the way (side stories float up in the sky), and roaming enemies start a battle when you run
//  into them. Tap a stage or an enemy and the lead goes there by itself.
//  Minigames: Snake Way and catching Bubbles are runs (tap to jump); Dodoria's chase, the Dragon Ball dive and the
//  escape from Namek are flights (hold to rise, or to dive). Same rules on screen and in the demo's simulations.
// =====================================================================
const FIELD = { on: false, ch: null, x: 80, y: 0, vx: 0, vy: 0, fly: false, target: null, keys: {}, roam: [], inv: 0, last: 0, cam: 0, T: 0, raf: 0 };
const FIELD_GAP = 330, SIDE_ALT = 150;
function fieldLayout(ch) {
  const pos = {}; let x = 220, prev = null;
  for (const nd of ch.nodes) {
    if (nd.type === "side") { pos[nd.id] = { x: (prev ? prev.x : x) + FIELD_GAP * .5, alt: SIDE_ALT }; continue; }
    pos[nd.id] = { x, alt: 0 }; prev = pos[nd.id]; x += FIELD_GAP;
  }
  return { pos, len: x + 120 };
}
// the furthest the lead can walk: up to the first stage still locked
function fieldWall(ch, L) {
  const lock = ch.nodes.find(n => n.type !== "side" && !nodeOpen(n));
  return lock ? L.pos[lock.id].x - 70 : L.len - 40;
}
function fieldFoe(nd) { const w = nd.waves && nd.waves[nd.waves.length - 1]; const s = w && w[w.length - 1]; return s ? (s.op ? { fig: OPS[s.op].fig, aura: OPS[s.op].aura } : { fig: ENEMY[s.e].fig, aura: ENEMY[s.e].aura, boss: ENEMY[s.e].boss }) : null; }
// a few rank-and-file enemies wander the cleared part of the map
function spawnRoamers(ch, L) {
  const mobs = [...new Set(ch.nodes.filter(n => n.waves).flatMap(n => n.waves.flat()).filter(s => s.e && !ENEMY[s.e].boss).map(s => s.e))];
  const wall = fieldWall(ch, L), out = [], rng = seeded(hash(ch.id + today()));
  if (!mobs.length) return out;
  for (let i = 0; i < 3; i++) { const x = 360 + rng() * Math.max(100, wall - 460); if (x > wall - 80) continue; out.push({ id: i, x, x0: x, e: mobs[Math.floor(rng() * mobs.length)], dir: rng() < .5 ? -1 : 1, alive: true }); }
  return out;
}
function fieldHTML(ch) {
  const L = fieldLayout(ch), nx = nextNode();
  const icon = t => t === "boss" ? IC.skull : t === "story" ? IC.book : t === "chest" ? IC.chest : t === "event" ? IC.boost : IC.sword;
  return `<div class="field" id="field">
    <canvas id="fcv"></canvas>
    ${ch.nodes.map(nd => { const open = nodeOpen(nd), st = nodeStars(nd.id);
      return `<button class="fnode ${nd.type} ${open ? "" : "locked"} ${st ? "done" : ""} ${nx === nd ? "next" : ""}" data-act="openNode" data-id="${nd.id}" aria-label="${nd.id} ${esc(nd.name)}">
        <span class="disc">${open ? icon(nd.type) : IC.lock}</span><span class="lbl">${nd.id}${nd.type === "side" ? " · Side" : ""}</span>
        ${nd.waves || nd.type === "event" ? `<span class="nst">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</span>` : ""}</button>`; }).join("")}
    <div class="fhint" id="fHint"></div>
    <div class="fpad"><button class="fb" data-k="L" aria-label="Left">◀</button><button class="fb" data-k="R" aria-label="Right">▶</button></div>
    <div class="fpad r"><button class="fb" data-k="D" aria-label="Down">▼</button><button class="fb up" data-k="U" aria-label="Jump or fly">▲</button></div>
  </div>`;
}
function fieldStart(ch) {
  fieldStop();
  const cv = $("#fcv"); if (!cv) return;
  const L = fieldLayout(ch), mem = S.field[ch.id];
  Object.assign(FIELD, { on: true, ch, L, cv, g: cv.getContext("2d"), x: mem != null ? Math.min(mem, fieldWall(ch, L)) : 80, y: 0, vx: 0, vy: 0, fly: false, target: null, keys: {}, inv: 1.5, last: 0, T: 0,
    env: buildEnv(ch.env), lead: OPS[ch.lead] || OPS[STARTERS[0]], face: 1 });
  FIELD.roam = spawnRoamers(ch, L);
  FIELD.cam = FIELD.x;
  for (const b of $$("#field .fb")) {
    const k = b.dataset.k;
    const on = ev => { ev.preventDefault(); FIELD.keys[k] = true; FIELD.target = null; if (k === "U") fieldJump(); };
    const off = () => { FIELD.keys[k] = false; };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
  }
  cv.addEventListener("pointerdown", ev => {
    // tap a roaming enemy to go and fight it
    const r = cv.getBoundingClientRect(), wx = FIELD.cam + (ev.clientX - r.left - r.width / 2) / FIELD.sc;
    const foe = FIELD.roam.find(m => m.alive && Math.abs(m.x - wx) < 40);
    if (foe) { FIELD.target = { x: foe.x, roam: foe.id }; FIELD.keys = {}; }
  });
  FIELD.raf = requestAnimationFrame(fieldFrame);
}
function fieldStop() { FIELD.on = false; cancelAnimationFrame(FIELD.raf); if (FIELD.ch && S && S.field) S.field[FIELD.ch.id] = Math.round(FIELD.x); }
function fieldJump() { if (FIELD.y <= 0) { FIELD.vy = 520; sfx("jump"); } else FIELD.fly = true; }
// go to a stage by itself, then open it
function fieldGo(nd) {
  if (!FIELD.on || FIELD.ch !== nd.ch) return false;
  const p = FIELD.L.pos[nd.id];
  FIELD.target = { x: p.x, alt: p.alt, node: nd.id }; FIELD.keys = {};
  return true;
}
function fieldFrame(now) {
  if (!FIELD.on) return;
  if (!FIELD.cv.isConnected || UI.view !== "chapter") { fieldStop(); return; }
  FIELD.raf = requestAnimationFrame(fieldFrame);
  const dt = FIELD.last ? Math.min(.05, (now - FIELD.last) / 1000) : .016; FIELD.last = now;
  if ($("#modal").hidden && !BT.on && $("#dlg").hidden && $("#battle").hidden) fieldStep(dt);
  fieldDraw();
}
function fieldStep(dt) {
  const F2 = FIELD, wall = fieldWall(F2.ch, F2.L);
  F2.T += dt; F2.inv = Math.max(0, F2.inv - dt);
  let dir = (F2.keys.R ? 1 : 0) - (F2.keys.L ? 1 : 0), up = F2.keys.U, down = F2.keys.D;
  const tg = F2.target;
  if (tg) {
    const dx = tg.x - F2.x, wantAlt = tg.alt || 0;
    dir = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
    if (wantAlt > 0 && F2.y < wantAlt - 6) { F2.fly = true; up = true; } else if (wantAlt === 0 && F2.y > 4) down = true;
    if (!dir && Math.abs(F2.y - wantAlt) < 10) {
      F2.target = null;
      if (tg.node) { const nd = NODES[tg.node]; if (nodeOpen(nd)) nodeSheet(nd); else toast("Clear the previous stage first."); }
      if (tg.roam != null) { const m = F2.roam.find(r => r.id === tg.roam && r.alive); if (m) fieldEncounter(m); }
    }
  }
  // walking speed scales up for long trips, so a tap on a far stage doesn't take forever
  const far = tg ? Math.abs(tg.x - F2.x) : 0, sp = (F2.fly || F2.y > 0 ? 320 : 230) * (far > 600 ? far / 600 : 1) * (DEMO.on ? 1.6 : 1);
  F2.vx = dir * sp; if (dir) F2.face = dir;
  F2.x = clamp(F2.x + F2.vx * dt, 40, wall);
  // jumping, flying, landing
  if (F2.fly) { F2.vy = up ? 260 : down ? -300 : 0; if (F2.y <= 0 && !up) { F2.fly = false; F2.y = 0; F2.vy = 0; } }
  else if (F2.y > 0 || F2.vy > 0) { F2.vy -= 1500 * dt; if (up && F2.vy < 120) F2.fly = true; }
  F2.y = clamp(F2.y + F2.vy * dt, 0, 230); if (F2.y <= 0 && !F2.fly) { F2.y = 0; F2.vy = Math.max(0, F2.vy); }
  // roaming enemies patrol, and a touch starts a fight
  for (const m of F2.roam) {
    if (!m.alive) continue;
    m.x += m.dir * 40 * dt; if (Math.abs(m.x - m.x0) > 90) m.dir *= -1;
    if (!F2.inv && !F2.target && Math.abs(m.x - F2.x) < 34 && F2.y < 50 && (F2.keys.L || F2.keys.R)) { fieldEncounter(m); break; }
  }
  // the lead stands at a stage: show its name
  const here = F2.ch.nodes.find(n => Math.abs(F2.L.pos[n.id].x - F2.x) < 40 && Math.abs(F2.L.pos[n.id].alt - F2.y) < 50);
  const h = $("#fHint"); if (h) { const t = here ? `${here.id} ${here.name}${nodeOpen(here) ? "" : " (locked)"}` : ""; if (h.textContent !== t) h.textContent = t; h.hidden = !here; }
}
function fieldDraw() {
  const F2 = FIELD, cv = F2.cv, r = cv.parentElement.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  const W = r.width, H = r.height;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px"; }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sc = F2.sc = clamp(H / 300, .7, 1.25), gy = H - 64;
  F2.cam += (F2.x - F2.cam) * .12;
  F2.cam = clamp(F2.cam, W / 2 / sc, Math.max(W / 2 / sc, F2.L.len - W / 2 / sc));
  const sx = x => W / 2 + (x - F2.cam) * sc;
  // backdrop: reuse the battle renderer's layers
  const E2 = F2.env;
  const gr = g.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, E2.sky[0]); gr.addColorStop(.6, E2.sky[1]); gr.addColorStop(1, E2.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E2.fx === "stars") for (const [x, y, s] of E2.stars) { g.fillStyle = "#fff"; g.globalAlpha = .6; g.fillRect(x * W, y * gy, s, s); } g.globalAlpha = 1;
  const layer = (lc, par, h) => { if (!lc) return; const off = ((F2.cam * par) % BG_W + BG_W) % BG_W; for (let x = -off; x < W; x += BG_W) g.drawImage(lc, x, gy - h, BG_W, h); };
  layer(E2.farCv, .2, 260); layer(E2.nearCv, .5, 180);
  if (E2.ground) { const g2 = g.createLinearGradient(0, gy, 0, H); g2.addColorStop(0, E2.ground[0]); g2.addColorStop(1, E2.ground[1]); g.fillStyle = g2; g.fillRect(0, gy, W, H - gy); }
  else { g.fillStyle = "#2a2a3a"; g.fillRect(0, gy, W, 6); }
  // the wall at the first locked stage
  const wall = fieldWall(F2.ch, F2.L);
  if (wall < F2.L.len - 50) { const wx = sx(wall + 40); g.fillStyle = "rgba(255,90,90,.18)"; g.fillRect(wx, 0, 6, gy); }
  // stages: who's standing there
  for (const nd of F2.ch.nodes) {
    const p = F2.L.pos[nd.id], x = sx(p.x), y = gy - p.alt * sc;
    if (x < -80 || x > W + 80) continue;
    if (p.alt) { g.fillStyle = "rgba(255,255,255,.75)"; for (const [dx, rr] of [[-28, 18], [0, 24], [26, 17]]) { g.beginPath(); g.arc(x + dx * sc, y + 6 * sc, rr * sc, 0, 7); g.fill(); } }
    const foe = fieldFoe(nd);
    if ((nd.type === "battle" || nd.type === "boss" || nd.type === "side") && foe && !nodeStars(nd.id)) {
      const s2 = sc * .62 * (nd.type === "boss" ? 1.2 : 1) * (foe.fig.body === "ape" ? .5 : 1);
      if (nd.type === "boss") cardAura(g, x + 24 * sc, y, figTall(foe.fig) * s2, foe.aura || "#ff5a5a");
      g.save(); g.translate(x + 24 * sc, y); g.scale(-s2, s2); drawFigure(g, foe.fig, { name: "idle", time: F2.T, ph: p.x }); g.restore();
    }
    if (nd.type === "chest" && !nodeStars(nd.id)) { g.save(); g.translate(x + 26 * sc, y - 12 * sc); g.rotate(Math.sin(F2.T * 2) * .1); g.fillStyle = "#f2f2f6"; g.beginPath(); g.ellipse(0, 0, 14 * sc, 9 * sc, 0, 0, 7); g.fill(); g.fillStyle = "#ffd34d"; g.fillRect(0, -9 * sc, 14 * sc, 18 * sc); g.restore(); }
    if (nd.type === "event" && !nodeStars(nd.id)) drawDragonBall(g, x + 26 * sc, y - 14 * sc - Math.sin(F2.T * 3) * 4, 9 * sc, 4, .8);
  }
  // roaming enemies
  for (const m of F2.roam) { if (!m.alive) continue; const x = sx(m.x); if (x < -60 || x > W + 60) continue; const f = ENEMY[m.e].fig, s2 = sc * .55 * (f.body === "dino" ? .7 : 1);
    g.save(); g.translate(x, gy); g.scale(-m.dir * s2, s2); drawFigure(g, f, { name: "walk", time: F2.T + m.id }); g.restore(); }
  // the lead
  const moving = Math.abs(F2.vx) > 1, air = F2.y > 2, lf = F2.lead.fig, s3 = sc * .7;
  g.save(); g.globalAlpha = .25; g.fillStyle = "#000"; g.beginPath(); g.ellipse(sx(F2.x), gy + 2, 18 * sc, 4 * sc, 0, 0, 7); g.fill(); g.restore();
  if (F2.fly && air) cardAura(g, sx(F2.x), gy - F2.y * sc, figTall(lf) * s3, F2.lead.aura || "#f2f2ff");
  g.save(); g.translate(sx(F2.x), gy - F2.y * sc); g.scale(F2.face * s3, s3);
  drawFigure(g, lf, air ? { name: moving ? "fly" : "idle", time: F2.T, air: true } : { name: moving ? (Math.abs(F2.vx) > 260 ? "run" : "walk") : "stand", time: F2.T });
  g.restore();
  // stage markers follow their spot (and hide when off screen, so they can't be tapped there)
  for (const b of $$("#field .fnode")) {
    const p = F2.L.pos[b.dataset.id], x = sx(p.x), y = gy - p.alt * sc - 92 * sc;
    const off = x < 20 || x > W - 20;
    b.style.display = off ? "none" : "";
    if (!off) b.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-50%)`;
  }
}
// a roaming enemy: a quick fight with the story party, for EXP and Zeni (no Stamina)
function fieldEncounter(m) {
  const ch = FIELD.ch, ids = S.team.story.filter(owned);
  if (!ids.length) return;
  const lv = Math.max(1, ...ch.nodes.filter(n => n.lv && nodeOpen(n)).map(n => n.lv)) - 1;
  m.alive = false; FIELD.inv = 3; FIELD.keys = {};
  S.stats.battles++;
  startBattle({ allies: allySpecs(ids), foes: [{ en: m.e, LV: lv }, ...(R() < .5 ? [{ en: m.e, LV: Math.max(1, lv - 2) }] : [])], env: ch.env, title: ENEMY[m.e].n, sub: `Encounter · ${ch.title}`,
    onWin() { S.stats.wins++; S.stats.patrols++; const list = give({ lmd: 200 + lv * 30, ...(R() < .25 ? { [pick(["trM", "trK", "trG"])]: 1 } : {}) }); list.push(opsXp(ids, 30 + lv * 8)); return { rewards: list }; },
    onLose() { return { rewards: [] }; },
  });
}

// =====================================================================
//  MINIGAMES
// =====================================================================
const GAMES = {
  snakeway: { n: "Snake Way", mode: "run", env: "snakeway", lead: "goku-s", len: 5200, time: 45, goal: 32, grav: 1900, jump: 760, speed: 300, gaps: 1,
    help: "Tap JUMP to leap the gaps in Snake Way. Fall, and you lose time in HFIL.", stars: ["Reach King Kai's planet", "Fall off no more than once", "Make it in 32 seconds"] },
  bubbles: { n: "Catch Bubbles", mode: "run", env: "kingkai", lead: "goku-s", len: 3000, time: 35, goal: 20, grav: 2900, jump: 900, speed: 250, rocks: 1, chase: 1,
    help: "Ten times gravity! Tap JUMP over the rocks and catch Bubbles before time runs out.", stars: ["Catch Bubbles", "Trip no more than twice", "Catch him in 20 seconds"] },
  dodoria: { n: "Dodoria's Chase", mode: "fly", env: "namek", lead: "gohan-s", time: 24, speed: 240, up: 1, blasts: 1, spires: 1,
    help: "Hold FLY to climb, let go to drop. Dodoria fires from behind: watch the warnings on the left.", stars: ["Escape Dodoria", "Get hit no more than once", "Don't get hit at all"] },
  dive: { n: "The Dragon Ball in the Lake", mode: "fly", env: "namek", lead: "gohan-s", time: 30, speed: 200, up: 0, fish: 1, water: 1, ball: 1,
    help: "Hold SWIM to dive, let go to float up. Grab air bubbles, dodge the fish, and bring back the Dragon Ball from the bottom.", stars: ["Bring back the Dragon Ball", "Get hit no more than once", "Finish with 40% air or more"] },
  escape: { n: "Escape from Namek", mode: "fly", env: "namekdie", lead: "goku-ssj", time: 24, speed: 280, up: 1, lava: 1, spires: 1,
    help: "Hold FLY to climb, let go to drop. Dodge the eruptions and reach Frieza's ship.", stars: ["Reach the ship", "Get hit no more than once", "Don't get hit at all"] },
};
const GH = 400;   // flight lane height
function makeGame(kind) {
  const C = GAMES[kind], rng = seeded(hash(kind)), G = { kind, C, t: 0, over: false, win: false, x: 0, y: C.mode === "fly" ? (C.water ? GH - 40 : GH / 2) : 0, vy: 0, hold: false, hits: 0, falls: 0, inv: 0,
    obs: [], gaps: [], rocks: [], bubbles: { x: 360, y: 0, vy: 0 }, air: 100, got: false, stumble: 0, fallT: 0, ev: [] };
  if (C.mode === "run") {
    for (let x = 500; x < C.len - 300; x += 330 + rng() * 280) { if (C.gaps) G.gaps.push([x, x + 70 + rng() * 60]); if (C.rocks) G.rocks.push({ x, h: 26 + rng() * 22 }); }
  } else {
    const L = C.speed * C.time, blastT = [];
    if (C.blasts) for (let t = 3; t < C.time - 2; t += 2.2 + rng() * 1.6) { blastT.push(t); G.obs.push({ k: "blast", t, y: 50 + rng() * (GH - 100), r: 20 }); }
    // no spire right where a blast flies past: there must always be a way through
    const clearOfBlasts = x => blastT.every(t => Math.abs(x - C.speed * t) > 330);
    for (let x = 520; x < L - 200; x += 220 + rng() * 200) {
      const r = rng();
      if (C.spires && r < .5 && clearOfBlasts(x)) { const top = rng() < .5, h = 90 + rng() * 120; G.obs.push({ k: "spire", x, w: 46, y0: top ? GH - h : 0, y1: top ? GH : h }); }
      else if (C.fish) G.obs.push({ k: "fish", x, y: 60 + rng() * (GH - 140), w: 44, h: 22, vx: -50 - rng() * 60 });
      else if (C.lava) G.obs.push({ k: "lava", x, w: 50, ph: rng() * 6 });
      if (C.water && rng() < .45) G.obs.push({ k: "air", x: x + 110, y: 80 + rng() * (GH - 160), r: 14 });
    }
    if (C.ball) G.ballX = L - 260;
  }
  G.press = on => { G.hold = !!on; if (on && C.mode === "run") jump(); };
  function jump() { if (G.y <= 0 && !G.fallT) { G.vy = C.jump; G.ev.push("jump"); } }
  const overGap = x => G.gaps.some(([a, b]) => x > a + 8 && x < b - 8);
  G.tick = dt => {
    if (G.over) return;
    G.t += dt; G.inv = Math.max(0, G.inv - dt);
    if (C.mode === "run") {
      if (G.fallT > 0) { G.fallT -= dt; G.y -= 600 * dt; if (G.fallT <= 0) { const gp = G.gaps.find(([a, b]) => G.x > a - 20 && G.x < b + 40); G.x = gp ? gp[0] - 60 : G.x - 80; G.y = 0; G.vy = 0; } return; }
      const sp = C.speed * (G.stumble > 0 ? .45 : 1); G.stumble = Math.max(0, G.stumble - dt);
      G.x += sp * dt;
      G.vy -= C.grav * dt; G.y = Math.max(G.y + G.vy * dt, overGap(G.x) ? -999 : 0); if (G.y <= 0 && !overGap(G.x)) { G.y = 0; G.vy = 0; }
      if (G.y < -10) { G.falls++; G.fallT = .8; G.ev.push("fall"); }
      for (const rk of G.rocks) if (!rk.hit && Math.abs(rk.x - G.x) < 22 && G.y < rk.h) { rk.hit = 1; G.stumble = 1; G.falls++; G.ev.push("trip"); }
      if (C.chase) {
        // Bubbles runs ahead, hopping now and then; he tires out over time
        const B2 = G.bubbles; B2.x += (C.speed * Math.max(.4, .92 - G.t * .012) + Math.sin(G.t * 3) * 40) * dt; B2.vy -= C.grav * dt; B2.y = Math.max(0, B2.y + B2.vy * dt); if (B2.y <= 0 && Math.random() < dt * 1.5) B2.vy = 600;
        if (G.x >= B2.x - 20 && Math.abs(G.y - B2.y) < 70) { G.over = true; G.win = true; G.ev.push("win"); }
      } else if (G.x >= C.len) { G.over = true; G.win = true; G.ev.push("win"); }
      if (G.t >= C.time && !G.over) { G.over = true; G.win = false; G.ev.push("lose"); }
      return;
    }
    // flying and swimming
    const upF = C.up ? (G.hold ? 1 : -1) : (G.hold ? -1 : 1);
    G.vy = clamp(G.vy + upF * 1500 * dt, -380, 380); G.y = clamp(G.y + G.vy * dt, 18, GH - 18); if (G.y <= 18 || G.y >= GH - 18) G.vy *= .3;
    G.x += C.speed * dt;
    if (C.water) { G.air = Math.max(0, G.air - dt * 3.4); if (G.air <= 0 && !G.inv) { G.hits++; G.inv = 1.5; G.air = 25; G.ev.push("hit"); } }
    const hitMe = () => { if (G.inv) return; G.hits++; G.inv = 1.2; G.ev.push("hit"); };
    for (const o of G.obs) {
      if (o.k === "spire" && Math.abs(o.x - G.x) < o.w / 2 + 12 && G.y > o.y0 - 10 && G.y < o.y1 + 10) hitMe();
      else if (o.k === "fish") { o.x += o.vx * dt; if (Math.abs(o.x - G.x) < 30 && Math.abs(o.y - G.y) < 20) hitMe(); }
      else if (o.k === "lava") { const h = Math.max(0, Math.sin(G.t * 1.6 + o.ph)) * GH * .7; o.h = h; if (Math.abs(o.x - G.x) < o.w / 2 + 10 && G.y < h + 10) hitMe(); }
      else if (o.k === "air" && !o.got && Math.hypot(o.x - G.x, o.y - G.y) < 30) { o.got = 1; G.air = Math.min(100, G.air + 30); G.ev.push("air"); }
      else if (o.k === "blast") { if (G.t >= o.t && !o.done) { const bx = G.x - 260 + (G.t - o.t) * 900; o.bx = bx; if (Math.abs(bx - G.x) < 24 && Math.abs(o.y - G.y) < o.r + 12) { hitMe(); o.done = 1; } if (bx > G.x + 400) o.done = 1; } }
    }
    if (C.ball && !G.got && Math.abs(G.x - G.ballX) < 34 && G.y < 50) { G.got = true; G.ev.push("ball"); }
    if (G.hits >= 4) { G.over = true; G.win = false; G.ev.push("lose"); }
    if (G.t >= C.time && !G.over) { G.over = true; G.win = !C.ball || G.got; G.ev.push(G.win ? "win" : "lose"); }
  };
  // stars for the result
  G.stars = () => {
    if (!G.win) return 0;
    if (C.mode === "run") return 1 + (G.falls <= (C.chase ? 2 : 1) ? 1 : 0) + (G.t <= C.goal ? 1 : 0);
    if (C.water) return 1 + (G.hits <= 1 ? 1 : 0) + (G.air >= 40 ? 1 : 0);
    return 1 + (G.hits <= 1 ? 1 : 0) + (G.hits === 0 ? 1 : 0);
  };
  // the demo's player: jumps the next gap or rock, and steers through the next opening
  G.ai = () => {
    if (C.mode === "run") {
      if (G.y > 0 || G.fallT) return false;
      const ahead = x => (G.gaps.some(([a]) => a - G.x > 6 && a - G.x < 46) || G.rocks.some(r => !r.hit && r.x - G.x > 10 && r.x - G.x < 62));
      return ahead();
    }
    // where it would like to be, then the heights that are blocked over the next stretch; it takes the closest free one
    let pref = C.water ? GH - 70 : GH / 2;
    if (C.ball && !G.got && G.ballX - G.x < 700) pref = 30;
    const nextAir = G.obs.find(o => o.k === "air" && !o.got && o.x > G.x && o.x - G.x < 260);
    if (C.water && nextAir && G.air < 70) pref = nextAir.y;
    const bad = [];
    for (const o of G.obs) {
      const d = o.x - G.x;
      if (o.k === "spire" && d > -40 && d < 240) bad.push([o.y0 - 55, o.y1 + 55]);
      if (o.k === "fish" && d > -30 && d < 170) bad.push([o.y - 48, o.y + 48]);
      if (o.k === "lava" && d > -40 && d < 220) { const tr = G.t + Math.max(0, d) / C.speed, h = Math.max(0, Math.sin(tr * 1.6 + o.ph), Math.sin(G.t * 1.6 + o.ph)) * GH * .7; bad.push([-99, h + 55]); }
      if (o.k === "blast" && !o.done && G.t > o.t - 1.3 && G.t < o.t + .45) bad.push([o.y - 80, o.y + 80]);
    }
    let want = pref, bestCost = 1e9;
    for (let y = 30; y <= GH - 30; y += 8) {
      const hit = bad.reduce((a, [lo, hi]) => a + (y > lo && y < hi ? Math.min(y - lo, hi - y) + 100 : 0), 0);
      const cost = hit * 10 + Math.abs(y - pref) + Math.abs(y - G.y) * .3;
      if (cost < bestCost) { bestCost = cost; want = y; }
    }
    want = clamp(want, 30, GH - 30);
    const goingUp = (want - G.y) - G.vy * .18 > 0;
    return C.up ? goingUp : !goingUp;
  };
  return G;
}
// play a minigame on screen (or simulate it for the demo), then score it like a stage
function launchGame(nd) {
  closeModal();
  const C = GAMES[nd.game], first = !nodeStars(nd.id);
  if (DEMO.on && DEMO.sim) { const G = makeGame(nd.game); let n = 0; while (!G.over && n++ < 20000) { G.press(G.ai()); G.tick(1 / 30); G.ev.length = 0; } finishGame(nd, G, first); DEMO.closed = true; return; }
  const G = makeGame(nd.game), root = $("#battle");
  window.MG = G; // the game on screen (the phone test plays it through this)
  root.innerHTML = `<div class="bwrap mg">
    <canvas id="gcv"></canvas>
    <div class="btop"><div class="bt-title"><small>${esc(nd.id)} · Minigame</small><b>${esc(C.n)}</b></div><button class="tog" id="gQuit">✕</button></div>
    <div class="mghud"><span id="gTime"></span><span id="gInfo"></span></div>
    <div class="mghelp" id="gHelp">${esc(C.help)}<button class="btn" id="gStart">Start</button></div>
    <button class="actb pow mgbtn" id="gBtn"><b>${C.mode === "run" ? "JUMP" : C.water ? "SWIM" : "FLY"}</b></button>
  </div>`;
  root.hidden = false;
  const cv = $("#gcv"), g = cv.getContext("2d"), env = buildEnv(C.env), lead = OPS[C.lead];
  let last = 0, live = false, raf = 0, T = 0;
  const btn = $("#gBtn");
  btn.addEventListener("pointerdown", ev => { ev.preventDefault(); if (live && !DEMO.on) G.press(true); btn.classList.add("held"); });
  const up = () => { if (live && !DEMO.on) G.press(false); btn.classList.remove("held"); };
  btn.addEventListener("pointerup", up); btn.addEventListener("pointerleave", up);
  const key = ev => { if (ev.code === "Space" && live && !DEMO.on && !ev.repeat) { ev.preventDefault(); G.press(ev.type === "keydown"); } };
  document.addEventListener("keydown", key); document.addEventListener("keyup", key);
  const end = () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); document.removeEventListener("keyup", key); };
  $("#gQuit").onclick = () => { end(); root.hidden = true; root.innerHTML = ""; if (DEMO.on) DEMO.closed = true; rerender(); };
  $("#gStart").onclick = () => { $("#gHelp").hidden = true; live = true; sfx("go"); };
  G.demoPress = on => { G.press(on); btn.classList.toggle("held", !!on); };
  const draw = () => {
    const r = cv.parentElement.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), W = r.width, H = r.height;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px"; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // runs show more of the road ahead; flights use the whole height for the lane
    const top = 90, bot = H - 130, sc = C.mode === "run" ? Math.min((bot - top) / GH, W / 520) : (bot - top) / GH, cam = G.x - W * .3 / sc, sx = x => (x - cam) * sc, sy = y => bot - y * sc;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, env.sky[0]); gr.addColorStop(.6, env.sky[1]); gr.addColorStop(1, env.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const layer = (lc, par, h) => { if (!lc) return; const off = ((cam * sc * par) % BG_W + BG_W) % BG_W; for (let x = -off; x < W; x += BG_W) g.drawImage(lc, x, bot - h, BG_W, h); };
    layer(env.farCv, .2, 260); layer(env.nearCv, .5, 180);
    if (C.water) { g.fillStyle = "rgba(30,110,150,.55)"; g.fillRect(0, sy(GH), W, bot - sy(GH) + 140); }
    if (C.mode === "run") {
      // the road, with its gaps (Snake Way is a winding yellow road; King Kai's planet is grass)
      g.fillStyle = C.gaps ? "#e8c85a" : "#5ab84a";
      let x0 = cam; const segs = []; let cur = x0;
      for (const [a, b] of G.gaps) { if (b < cam) continue; if (a > cam + W / sc) break; segs.push([cur, a]); cur = b; }
      segs.push([cur, cam + W / sc + 50]);
      for (const [a, b] of segs) if (b > a) { g.fillRect(sx(a), bot, (b - a) * sc, 18); g.fillStyle = shade(C.gaps ? "#e8c85a" : "#5ab84a", -.25); g.fillRect(sx(a), bot + 18, (b - a) * sc, 140); g.fillStyle = C.gaps ? "#e8c85a" : "#5ab84a"; }
      for (const rk of G.rocks) { const x = sx(rk.x); if (x < -40 || x > W + 40) continue; g.fillStyle = "#8a8a8a"; g.beginPath(); g.ellipse(x, bot, 22 * sc, rk.h * sc, 0, Math.PI, 0); g.fill(); }
      if (!C.chase) { const fx = sx(C.len); g.fillStyle = "#5ab84a"; g.beginPath(); g.arc(fx + 80 * sc, bot - 30 * sc, 90 * sc, 0, 7); g.fill(); }
      if (C.chase) { const B2 = G.bubbles, bx = sx(B2.x), by = sy(B2.y);
        g.fillStyle = "#8a5a3a"; g.beginPath(); g.arc(bx, by - 26 * sc, 13 * sc, 0, 7); g.fill(); g.beginPath(); g.ellipse(bx, by - 10 * sc, 11 * sc, 14 * sc, 0, 0, 7); g.fill();
        g.fillStyle = "#f2d8b8"; g.beginPath(); g.arc(bx + 5 * sc, by - 26 * sc, 7 * sc, 0, 7); g.fill(); g.fillStyle = "#141418"; g.beginPath(); g.arc(bx + 7 * sc, by - 28 * sc, 1.6 * sc, 0, 7); g.fill();
        g.strokeStyle = "#8a5a3a"; g.lineWidth = 3 * sc; g.beginPath(); g.moveTo(bx - 10 * sc, by - 8 * sc); g.quadraticCurveTo(bx - 26 * sc, by - 20 * sc, bx - 20 * sc, by - 34 * sc); g.stroke(); }
    } else {
      for (const o of G.obs) {
        const x = sx(o.x); if ((x < -80 || x > W + 80) && o.k !== "blast") continue;
        if (o.k === "spire") { g.fillStyle = C.lava ? "#3a1a14" : "#2a7a6a"; g.fillRect(x - o.w / 2 * sc, sy(o.y1), o.w * sc, (o.y1 - o.y0) * sc); }
        else if (o.k === "fish") { g.fillStyle = "#d8604a"; g.beginPath(); g.ellipse(x, sy(o.y), 24 * sc, 11 * sc, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 20 * sc, sy(o.y)); g.lineTo(x + 34 * sc, sy(o.y) - 10 * sc); g.lineTo(x + 34 * sc, sy(o.y) + 10 * sc); g.fill(); }
        else if (o.k === "lava" && o.h > 4) { g.fillStyle = "#ff6a1a"; g.fillRect(x - o.w / 2 * sc, sy(o.h), o.w * sc, o.h * sc); g.fillStyle = "#ffd34d"; g.fillRect(x - o.w / 4 * sc, sy(o.h), o.w / 2 * sc, o.h * sc); }
        else if (o.k === "air" && !o.got) { g.strokeStyle = "#e8fbff"; g.lineWidth = 2; g.beginPath(); g.arc(x, sy(o.y), o.r * sc, 0, 7); g.stroke(); }
        else if (o.k === "blast" && !o.done) {
          if (G.t > o.t - 1.1 && G.t < o.t) { g.fillStyle = "rgba(255,80,120,.8)"; g.font = `900 ${22 * sc}px sans-serif`; g.fillText("!", 14, sy(o.y)); g.fillRect(4, sy(o.y) - 2, 6, 4); }
          if (o.bx != null) glowBall(g, sx(o.bx), sy(o.y), o.r * sc, "#ff5a8a");
        }
      }
      if (C.ball && !G.got) drawDragonBall(g, sx(G.ballX), sy(26), 14 * sc, 4, 1);
      if (C.blasts) { const dx = 20, dy = sy(G.y); g.save(); g.translate(dx, dy + 20 * sc); g.scale(sc * .7, sc * .7); drawFigure(g, OPS["dodoria-s"].fig, { name: "fly", time: T, air: true }); g.restore(); }
    }
    // the player
    const px = sx(G.x), py = sy(G.y);
    const ps = sc * (C.mode === "run" ? 1.1 : .8);
    g.save(); g.globalAlpha = G.inv && Math.floor(T * 12) % 2 ? .4 : 1; g.translate(px, py + (C.mode === "fly" ? 18 * sc : 0)); g.scale(ps, ps);
    drawFigure(g, lead.fig, C.mode === "run" ? { name: G.y > 0 ? "fly" : "run", time: T } : C.water ? { name: "swim", time: T, air: true } : { name: "fly", time: T, air: true });
    if (G.got) drawDragonBall(g, 30, -40, 10, 4, .6);
    g.restore();
    $("#gTime").textContent = `${Math.max(0, C.time - G.t).toFixed(1)}s`;
    $("#gInfo").textContent = C.mode === "run" ? (C.chase ? `Bubbles ${Math.max(0, Math.round((G.bubbles.x - G.x) / 10))} m ahead · trips ${G.falls}` : `${Math.round(G.x / C.len * 100)}% · falls ${G.falls}`) : C.water ? `Air ${Math.round(G.air)}% · hits ${G.hits}${G.got ? " · Dragon Ball!" : ""}` : `Hits ${G.hits}/4`;
  };
  const loop = now => {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now; T += dt;
    if (live && !G.over) {
      if (DEMO.on) { const want = G.ai(); if (want !== G.hold) { G.demoPress(want); if (want) demoGamePress(); } }
      let acc = dt * (DEMO.on && DEMO.mode !== "watch" ? 1.5 : 1); while (acc > 0) { const st = Math.min(1 / 60, acc); G.tick(st); acc -= st; }
      for (const e of G.ev) sfx({ jump: "jump", fall: "lose", trip: "hit", hit: "hit", air: "heal", ball: "coin", win: "win", lose: "lose" }[e] || "tap");
      G.ev.length = 0;
      if (G.over) { live = false; setTimeout(() => { end(); finishGame(nd, G, first, true); }, 900); }
    }
    draw();
  };
  raf = requestAnimationFrame(loop);
  if (DEMO.on) { setTimeout(() => { if ($("#gStart")) demoTapEl("#gStart").then(() => { if ($("#gHelp") && !$("#gHelp").hidden) $("#gStart").click(); }); }, 1200); }
}
function finishGame(nd, G, first, shown) {
  const stars = G.stars(), prev = nodeStars(nd.id), C = GAMES[nd.game];
  if (stars) S.story[nd.id] = Math.max(prev, stars);
  S.stats.games = (S.stats.games || 0) + 1;
  let list = [];
  if (stars) { list = give(first ? { orundum: 100, lmd: 1500, summ: 2 } : { lmd: 800 }); if (stars === 3 && prev < 3) list.push(...give({ prime: 1 })); }
  const chList = stars ? chapterPayout(nd.ch) : null;
  save();
  if (!shown) { if (DEMO.on) DEMO.result = { win: !!stars, stars }; return; }
  if (DEMO.on) DEMO.result = { win: !!stars, stars };
  const root = $("#battle"), el = document.createElement("div");
  el.className = "result";
  el.innerHTML = `<div class="eyebrow">${esc(nd.id)} · Minigame</div><h1 class="${stars ? "gold" : "ds"}">${stars ? "Cleared!" : "Try again"}</h1>
    <div class="bigstars">${[0, 1, 2].map(k => `<span class="${k < stars ? "on" : ""}">${k < stars ? IC.star : IC.starOff}</span>`).join("")}</div>
    <div class="stack" style="gap:4px;text-align:left">${C.stars.map((m, k) => `<div class="mission">${k < stars ? IC.check : IC.cross}<span>${esc(m)}</span></div>`).join("")}</div>
    ${list.length ? `<div class="rewards">${rewardsHTML(list)}</div>` : ""}
    <div class="row" style="gap:10px"><button class="btn ghost" id="rRetry">Retry</button><button class="btn" id="rDone">Continue</button></div>`;
  $(".bwrap").appendChild(el);
  const close = async () => { root.hidden = true; root.innerHTML = ""; rerender(); if (stars && first && nd.post && nd.post.length) await playScene(nd.post, `${nd.id} ${nd.name}`, nd.ch.env); if (chList) chapterModal(nd.ch, chList); if (DEMO.on) DEMO.closed = true; };
  $("#rDone").onclick = close;
  $("#rRetry").onclick = () => { root.hidden = true; root.innerHTML = ""; if (DEMO.on) DEMO.closed = true; launchGame(nd); };
}
