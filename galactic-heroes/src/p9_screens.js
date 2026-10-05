
// =====================================================================
//  SCREENS
// =====================================================================
const UI = { view: "home", arg: null, table: "light", chap: { light: 0, dark: 0 }, filter: "all", squad: null };
const ENV_FOR = { light: ["desert", "desert", "station", "snow", "clouds", "station"], dark: ["geonosis", "forest", "temple", "forest", "temple", "lava"] };

function toast(msg, cls = "") {
  const t = document.createElement("div"); t.className = "toast " + cls; t.textContent = msg;
  $("#toast").appendChild(t); setTimeout(() => t.remove(), 2600);
}
function openModal(html) {
  const m = $("#modal"); m.innerHTML = `<div class="mbox" role="dialog">${html}</div>`; m.hidden = false;
  m.onclick = e => { if (e.target === m) closeModal(); };
}
function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }

function starsHTML(n, size) { let s = ""; for (let k = 1; k <= 7; k++) s += k <= n ? IC.star : IC.starOff; return `<div class="stars"${size ? ` style="height:${size}px;justify-content:flex-start"` : ""}>${s}</div>`; }
function ptHTML(id, o = {}) {
  const p = o.prog !== undefined ? o.prog : S.roster[id];
  return `<div class="pt ${p ? "" : "locked"}" style="--s:${o.s || 72}px;--gc:${p ? GEAR_COLOR(p.gear) : "var(--g1)"}">
    ${o.nostars ? "" : starsHTML(p ? p.stars : 0)}
    <div class="ring"><img src="${portrait(id)}" alt="${esc(CH[id].n)}" draggable="false"></div>
    ${p && !o.nolv ? `<div class="lv num">${p.lvl}</div>` : ""}
  </div>`;
}
function itemIcon(k) {
  if (k.startsWith("shard:")) return null;
  return (ITEMS[k] && ITEMS[k].ic) || (k === "xp" ? IC.boost : k === "rank" ? IC.arena : k === "energy" ? IC.energy : IC.boost);
}
function rewardsHTML(list) {
  const merged = [];
  for (const r of list) { const m = merged.find(x => x.k === r.k); if (m && r.k !== "rank") m.n += r.n; else merged.push({ ...r }); }
  return merged.map(r => {
    if (r.k.startsWith("shard:")) { const id = r.k.slice(6); return `<div class="rw">${ptHTML(id, { s: 54, nostars: 1, nolv: 1, prog: S.roster[id] || null })}<span>${r.n} shard${r.n > 1 ? "s" : ""}</span></div>`; }
    const name = r.k === "xp" ? "Character XP" : r.k === "rank" ? "New rank" : (ITEMS[r.k] && ITEMS[r.k].n) || r.k;
    const val = r.k === "rank" ? "#" + r.n : "×" + fmt(r.n);
    return `<div class="rw"><div class="ri">${itemIcon(r.k)}</div><span class="num">${val}</span><span class="tiny dim">${esc(name)}</span></div>`;
  }).join("");
}

// ---------- top bar + tabs ----------
function renderTop() {
  tickTimers();
  const mx = maxEnergy(S.lvl);
  $("#topbar").innerHTML = `
    <button class="me" data-act="settings" aria-label="Profile and settings">
      <div class="me-badge num">${S.lvl}</div>
      <div style="min-width:0;text-align:left"><div class="me-name">${esc(S.name)}</div><div class="me-xp"><i style="width:${S.lvl >= MAX_LVL ? 100 : S.xp / pxpNeed(S.lvl) * 100}%"></i></div></div>
    </button>
    <div class="res">
      <button class="pill" data-act="refill" aria-label="Energy">${IC.energy}<span>${S.energy}<small>/${mx}</small></span></button>
      <div class="pill">${IC.credits}<span>${fmt(S.credits)}</span></div>
      <div class="pill">${IC.crystals}<span>${fmt(S.crystals)}</span></div>
    </div>`;
  const tabs = [["home", "Home", IC.home], ["battles", "Battles", IC.battles], ["chars", "Heroes", IC.chars], ["arena", "Arena", IC.arena], ["store", "Store", IC.store]];
  const on = { squad: "battles", char: "chars" }[UI.view] || UI.view;
  $("#tabs").innerHTML = tabs.map(([v, n, ic]) => `<button class="${on === v ? "on" : ""}" data-act="go" data-v="${v}">${ic}<span>${n}</span>${badge(v) ? '<i class="dot"></i>' : ""}</button>`).join("");
}
function badge(v) {
  if (v === "chars") return CH_IDS.some(id => canUpgradeStar(id));
  if (v === "store") return Date.now() - S.bronzeTime >= BRONZE_MS;
  if (v === "arena") return Date.now() - S.arena.payTime >= PAYOUT_MS;
  if (v === "home") return DAILIES.some(d => !S.daily.claimed[d.id] && S.daily[d.id] >= d.goal);
  return false;
}
const canUpgradeStar = id => !owned(id) ? (S.shards[id] || 0) >= STAR_SHARDS[1] : S.roster[id].stars < 7 && (S.shards[id] || 0) >= STAR_SHARDS[S.roster[id].stars + 1] && S.credits >= STAR_CREDITS[S.roster[id].stars + 1];

function route(view, arg, keepScroll) {
  UI.view = view; UI.arg = arg;
  const el = $("#view");
  const st = el.scrollTop;
  el.innerHTML = (SCREENS[view] || SCREENS.home)(arg);
  if (keepScroll) el.scrollTop = st; else el.scrollTop = 0;
  renderTop();
  const mv = $("#modelView"); if (mv) mountModel(mv, arg);
  save();
}
const rerender = () => route(UI.view, UI.arg, true);

// ---------- art ----------
const ART = {};
function squadArt(ids) {
  const key = ids.join(","); if (ART[key]) return ART[key];
  const cv = document.createElement("canvas"); cv.width = 360; cv.height = 240; const g = cv.getContext("2d");
  const xs = [190, 110, 270], ys = [220, 196, 196], sc = [1.65, 1.35, 1.35];
  [1, 2, 0].forEach(k => {
    const id = ids[k]; if (!id) return;
    const f = CH[id].fig;
    g.save(); g.translate(xs[k], ys[k]);
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(0, 0, 30 * sc[k], 7 * sc[k], 0, 0, 7); g.fill();
    g.scale(sc[k] * (k === 2 ? -1 : 1), sc[k]);
    drawFigure(g, f, { name: k === 0 ? "victory" : "idle", time: .4 + k });
    g.restore();
  });
  try { ART[key] = cv.toDataURL(); } catch (e) { ART[key] = ""; }
  return ART[key];
}
function mountModel(cv, id) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 160, H = cv.clientHeight || 220;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext("2d");
  let pose = { name: "idle", t0: performance.now(), dur: 0 };
  cv.onclick = () => {
    const f = CH[id].fig;
    const opts = /saber|staff/.test(f.w) ? ["swing", "buff", "victory"] : f.w === "none" ? ["cast", "buff", "choke"] : ["shoot", "buff", "victory"];
    pose = { name: pick(opts), t0: performance.now(), dur: 1000 };
  };
  const loop = now => {
    if (!cv.isConnected) return;
    requestAnimationFrame(loop);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * .9;
    const pg = g.createRadialGradient(cx, cy, 4, cx, cy, W * .45); pg.addColorStop(0, "rgba(95,212,255,.5)"); pg.addColorStop(1, "rgba(95,212,255,0)");
    g.fillStyle = pg; g.beginPath(); g.ellipse(cx, cy, W * .44, W * .1, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(95,212,255,.7)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, W * .32, W * .07, 0, 0, 7); g.stroke();
    g.globalAlpha = .25; for (let k = 0; k < 5; k++) { const y = cy - ((now / 18 + k * 40) % 200); g.fillStyle = "#5fd4ff"; g.fillRect(cx - W * .3, y, W * .6, 1); } g.globalAlpha = 1;
    let t = pose.dur ? (now - pose.t0) / pose.dur : 0;
    if (pose.dur && t >= 1) { pose = { name: "idle", t0: now, dur: 0 }; t = 0; }
    const f = CH[id].fig, sc = (H * .66) / (112 * Math.max(f.h || 1, .8));
    g.save(); g.translate(cx - 4, cy); g.scale(sc, sc); drawFigure(g, f, { name: pose.name, t, time: now / 1000 }); g.restore();
  };
  requestAnimationFrame(loop);
}

// ---------- screens ----------
const SCREENS = {
  home() {
    const top = topTeam(3);
    const hint = nextHint();
    const lsDone = Object.values(S.camp.light).filter(v => v > 0).length, dsDone = Object.values(S.camp.dark).filter(v => v > 0).length;
    const bronze = Date.now() - S.bronzeTime >= BRONZE_MS;
    const dDone = DAILIES.filter(d => S.daily[d.id] >= d.goal).length;
    const ready = CH_IDS.filter(canUpgradeStar).length;
    return `<div class="stack">
      <section class="panel hero">
        <img class="hero-art" src="${squadArt(top)}" alt="">
        <div class="eyebrow">Unofficial Star Wars fan game</div>
        <h1 style="margin-top:6px">Galactic<span>Heroes</span></h1>
        <div class="gp"><span class="dim small">Galactic Power</span><b>${fmtFull(gp())}</b></div>
        <div class="tiny dim">${Object.keys(S.roster).length} of ${CH_IDS.length} heroes recruited</div>
      </section>
      ${hint ? `<button class="hint" data-act="${hint.act}" ${hint.data || ""}>${IC.boost.replace("<svg", '<svg width="22" height="22"')}<div style="text-align:left"><div class="eyebrow">Next objective</div><div class="small">${hint.text}</div></div></button>` : ""}
      <div class="tiles">
        <button class="tile ls-t" data-act="go" data-v="battles" data-a="light"><span class="ticon">${IC.saber("#4aa3ff")}</span><h3>Light Side Battles</h3><span class="tsub">${lsDone}/30 nodes cleared</span></button>
        <button class="tile ds-t" data-act="go" data-v="battles" data-a="dark"><span class="ticon">${IC.saber("#ff4b4b")}</span><h3>Dark Side Battles</h3><span class="tsub">${dsDone}/30 nodes cleared</span></button>
        <button class="tile" data-act="go" data-v="arena"><span class="ticon" style="color:var(--gold)">${IC.arena}</span><h3>Squad Arena</h3><span class="tsub">Rank #${S.arena.rank} · ${S.arena.attempts}/5 attempts</span></button>
        <button class="tile" data-act="go" data-v="store"><span class="ticon">${IC.crystals}</span><h3>Shipments</h3><span class="tsub">${bronze ? "Free Bronzium ready" : "Packs and refills"}</span></button>
        <button class="tile wide" data-act="dailies"><span class="ticon">${IC.mats}</span><h3>Daily Activities</h3><span class="tsub">${dDone}/${DAILIES.length} complete today</span></button>
        <button class="tile wide" data-act="go" data-v="chars"><span class="ticon" style="color:var(--holo)">${IC.chars}</span><h3>Heroes</h3><span class="tsub">${ready ? ready + " ready to activate or promote" : "Level up, gear and promote your roster"}</span></button>
      </div>
      <p class="tiny dim" style="text-align:center;padding:4px 8px">Galactic Heroes is a non-commercial fan tribute. It is not affiliated with or endorsed by Lucasfilm, Disney, EA or Capital Games.</p>
    </div>`;
  },

  battles(arg) {
    const table = arg || UI.table; UI.table = table;
    const T = CAMPAIGN[table];
    let chap = UI.chap[table];
    if (!nodeOpen(table, chap, 0)) chap = UI.chap[table] = 0;
    const ch = T.chapters[chap];
    const next = firstOpenUncleared(table);
    return `<div class="stack">
      <div class="seg"><button class="lsb ${table === "light" ? "on" : ""}" data-act="go" data-v="battles" data-a="light">Light Side</button><button class="dsb ${table === "dark" ? "on" : ""}" data-act="go" data-v="battles" data-a="dark">Dark Side</button></div>
      <div class="chips">${T.chapters.map((c, k) => `<button class="chip ${k === chap ? "on" : ""}" data-act="chap" data-c="${k}" ${nodeOpen(table, k, 0) ? "" : "disabled"}>Ch ${k + 1}</button>`).join("")}</div>
      <section class="panel chap-head" style="background:linear-gradient(120deg,${table === "light" ? "var(--ls-deep)" : "var(--ds-deep)"},var(--hull) 70%)">
        <span class="cnum">${chap + 1}</span>
        <div class="eyebrow">${T.n} · Chapter ${chap + 1}</div>
        <h2 style="margin-top:4px">${esc(ch.n)}</h2>
        <p class="small dim" style="margin-top:6px">Use ${table === "light" ? "Light" : "Dark"} Side heroes only. Earn 3 stars by finishing with no heroes defeated to unlock sims.</p>
      </section>
      <div class="nodes">${[0, 1, 2, 3, 4].map(n => {
        const node = nodeInfo(table, chap, n), open = nodeOpen(table, chap, n), st = S.camp[table][node.key] || 0;
        const isNext = next && next[0] === chap && next[1] === n;
        const foes = [...new Set(node.waves.flat().map(e => e.id))];
        return `<button class="node ${open ? "" : "locked"} ${node.boss ? "boss" : ""} ${isNext ? "next" : ""}" data-act="node" data-c="${chap}" data-n="${n}" ${open ? "" : "disabled"}>
          <span class="nid">${node.key}</span>
          <div style="min-width:0"><div class="ntitle">${node.boss ? "Boss · " + esc(CH[ch.boss].n) : "Battle " + node.key}</div>
            <div class="minis">${foes.slice(0, 5).map(id => ptHTML(id, { s: 26, nostars: 1, nolv: 1, prog: { gear: node.waves[0][0].gear } })).join("")}</div></div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <div class="nstars">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</div>
            <span class="cost small">${IC.energy}${node.energy}</span>
          </div>
        </button>`;
      }).join("")}</div>
    </div>`;
  },

  squad(arg) {
    const { mode, table } = arg;
    const side = mode === "arena" ? null : CAMPAIGN[table].side;
    const key = mode === "arena" ? "arena" : table;
    const sq = UI.squad = (UI.squad && UI.squad.key === key ? UI.squad : { key, ids: (S.squads[key] || []).filter(id => owned(id) && (!side || CH[id].side === side)).slice(0, 5) });
    const ids = sq.ids;
    const pool = Object.keys(S.roster).filter(id => !side || CH[id].side === side).sort((a, b) => power(b, S.roster[b]) - power(a, S.roster[a]));
    const lead = ids[0] && CH[ids[0]].lead;
    const myPw = ids.reduce((a, id) => a + power(id, S.roster[id]), 0);
    let foePw = 0, title = "", cost = 0;
    if (mode === "arena") { const o = S.arena.opps[arg.opp]; foePw = o.pw; title = `vs ${o.name}`; }
    else { const node = nodeInfo(table, arg.c, arg.n); foePw = node.waves.flat().reduce((a, e) => a + power(e.id, e) * (e.boss ? 1.6 : 1), 0) / node.waves.length; title = `Battle ${node.key}`; cost = node.energy; }
    return `<div class="stack">
      <div class="spread"><button class="btn ghost sm" data-act="back">${IC.back.replace("<svg", '<svg width="16" height="16"')}Back</button><div class="eyebrow">${esc(title)}</div></div>
      <h2>Assemble Your Squad</h2>
      <div class="squad">${[0, 1, 2, 3, 4].map(k => {
        const id = ids[k];
        return `<div class="slot">${k === 0 ? `<span class="crown">${IC.crown}</span>` : ""}${id ? `<button data-act="slot" data-k="${k}" aria-label="${esc(CH[id].n)}">${ptHTML(id, { s: 58 })}</button>` : '<div class="empty"></div>'}</div>`;
      }).join("")}</div>
      <div class="leadtxt small">${lead ? `<b class="gold">Leader: ${esc(lead.n)}</b> <span class="dim">${esc(lead.d)}</span>` : ids[0] ? `<span class="dim">${esc(CH[ids[0]].n)} has no leader ability. Tap a squad member to make them leader.</span>` : `<span class="dim">Pick up to five heroes. The first slot is your leader.</span>`}</div>
      <div class="spread small"><span>Squad power <b class="num">${fmtFull(myPw)}</b></span><span class="dim">Enemy power <b class="num" style="color:${foePw > myPw * 1.15 ? "var(--ds)" : "var(--text)"}">${fmtFull(foePw)}</b></span></div>
      <button class="btn wide" data-act="fight" ${ids.length ? "" : "disabled"}>${mode === "arena" ? "Battle" : `Battle <span class="cost">${IC.energy}${cost}</span>`}</button>
      <div class="eyebrow" style="margin-top:4px">${side ? (side === "light" ? "Light Side" : "Dark Side") + " heroes" : "All heroes"}</div>
      <div class="roster">${pool.map(id => `<button class="rcell ${ids.includes(id) ? "sel" : ""}" data-act="pickSq" data-id="${id}">${ptHTML(id)}<div class="pname">${esc(CH[id].n)}</div><div class="pw">${fmt(power(id, S.roster[id]))}</div></button>`).join("")}</div>
    </div>`;
  },

  chars() {
    const f = UI.filter;
    const list = CH_IDS.filter(id => f === "all" || CH[id].side === f);
    const own = list.filter(owned).sort((a, b) => power(b, S.roster[b]) - power(a, S.roster[a]));
    const locked = list.filter(id => !owned(id)).sort((a, b) => (S.shards[b] || 0) - (S.shards[a] || 0));
    return `<div class="stack">
      <div class="spread"><h2>Heroes</h2><span class="small dim">${Object.keys(S.roster).length}/${CH_IDS.length} recruited</span></div>
      <div class="chips">${[["all", "All"], ["light", "Light Side"], ["dark", "Dark Side"]].map(([k, n]) => `<button class="chip ${f === k ? "on" : ""}" data-act="filter" data-f="${k}">${n}</button>`).join("")}</div>
      <div class="roster">${own.map(id => `<button class="rcell ${canUpgradeStar(id) ? "ready" : ""}" data-act="go" data-v="char" data-a="${id}">${ptHTML(id)}<div class="pname">${esc(CH[id].n)}</div><div class="pw">${fmt(power(id, S.roster[id]))}</div></button>`).join("")}</div>
      ${locked.length ? `<div class="eyebrow" style="margin-top:6px">Not yet recruited</div>
      <div class="roster">${locked.map(id => { const s = S.shards[id] || 0; return `<button class="rcell ${s >= 10 ? "ready" : ""}" data-act="go" data-v="char" data-a="${id}">${ptHTML(id)}<div class="pname">${esc(CH[id].n)}</div><div class="pw num">${s}/10 shards</div><div class="shardbar" style="width:72px"><i style="width:${Math.min(100, s * 10)}%"></i></div></button>`; }).join("")}</div>` : ""}
    </div>`;
  },

  char(id) {
    const d = CH[id], p = S.roster[id], sh = S.shards[id] || 0;
    const s = p ? calcStats(id, p) : calcStats(id, mkProg(1));
    const ns = p ? p.stars + 1 : 1, need = STAR_SHARDS[Math.min(7, ns)];
    const lvlNeed = p ? xpNeed(p.lvl) : 1;
    const gc = p && p.gear < MAX_GEAR ? gearCost(p.gear) : null;
    const abRows = d.ab.map((ab, i) => {
      const l = p ? p.ab[i] : 1, c = abCost(l);
      return `<div class="ab"><div class="abicon ${i ? "special" : ""}">${abIcon({ def: d }, ab, i)}</div>
        <div class="stack" style="gap:4px;min-width:0"><div class="spread"><b>${esc(ab.n)}</b><span class="tag">${i ? "Special" + (ab.cd ? " · CD " + ab.cd : "") : "Basic"}</span></div>
        <p class="small dim">${esc(ab.d)}</p>
        <div class="spread"><div class="pips">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= l ? "on" : ""} ${k === 5 ? "om" : ""}"></i>`).join("")}</div>
        ${p && l < MAX_AB ? `<button class="btn sm ghost" data-act="abUp" data-id="${id}" data-i="${i}" ${S.inv.mats >= c.mats && S.credits >= c.credits ? "" : "disabled"}><span class="cost">${IC.mats}${c.mats}</span><span class="cost">${IC.credits}${fmt(c.credits)}</span></button>` : p ? '<span class="tiny gold">MAX</span>' : ""}</div></div></div>`;
    }).join('<div class="divider"></div>');
    return `<div class="stack">
      <div class="spread"><button class="btn ghost sm" data-act="go" data-v="chars">${IC.back.replace("<svg", '<svg width="16" height="16"')}Heroes</button><span class="tag ${d.side === "light" ? "ls" : "ds"}">${d.side === "light" ? "Light Side" : "Dark Side"}</span></div>
      <section class="panel" style="padding:0;overflow:hidden;background:radial-gradient(80% 90% at 30% 20%,${d.side === "light" ? "#16335f" : "#4a1420"},var(--hull) 70%)">
        <div style="display:grid;grid-template-columns:44% 1fr;align-items:end">
          <canvas id="modelView" style="width:100%;height:230px;display:block;cursor:pointer" aria-label="${esc(d.n)} model, tap to animate"></canvas>
          <div class="stack" style="gap:6px;padding:14px 14px 14px 0;min-width:0">
            ${starsHTML(p ? p.stars : 0, 14)}
            <h2 style="font-size:22px">${esc(d.n)}</h2>
            <div class="row wrap" style="gap:4px"><span class="tag">${d.role}</span>${d.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
            ${p ? `<div class="small">Power <b class="num" style="color:var(--holo)">${fmtFull(power(id, p))}</b></div>
            <div class="small">Level <b class="num">${p.lvl}</b> · Gear <b style="color:${GEAR_COLOR(p.gear)}">${roman(p.gear)}</b></div>` : `<div class="small dim">Not recruited</div>`}
            <div class="tiny dim">Tap the hologram to see moves</div>
          </div>
        </div>
      </section>
      <section class="panel stack" style="gap:8px">
        <div class="spread"><h3>${p ? (p.stars >= 7 ? "Max stars" : `Promote to ${ns}★`) : "Recruit"}</h3><span class="small num">${sh}${p && p.stars >= 7 ? "" : "/" + need} shards</span></div>
        ${p && p.stars >= 7 ? "" : `<div class="bar"><i style="width:${Math.min(100, sh / need * 100)}%"></i></div>`}
        ${!p ? `<button class="btn wide" data-act="activate" data-id="${id}" ${sh >= 10 ? "" : "disabled"}>Activate</button>
          <p class="tiny dim">${shardSources(id)}</p>`
        : p.stars < 7 ? `<button class="btn wide" data-act="promote" data-id="${id}" ${sh >= need && S.credits >= STAR_CREDITS[ns] ? "" : "disabled"}>Promote <span class="cost">${IC.credits}${fmt(STAR_CREDITS[ns])}</span></button><p class="tiny dim">${shardSources(id)}</p>` : ""}
      </section>
      ${p ? `<section class="panel stack" style="gap:8px">
        <div class="spread"><h3>Level ${p.lvl}</h3><span class="small dim num">${p.lvl >= charCap() ? `Cap ${charCap()} (player level + 2)` : `${fmtFull(p.xp)}/${fmtFull(lvlNeed)} XP`}</span></div>
        <div class="bar"><i style="width:${p.lvl >= charCap() ? 100 : p.xp / lvlNeed * 100}%"></i></div>
        <div class="row wrap">${["droid1", "droid2", "droid3"].map(it => `<button class="btn ghost sm" data-act="train" data-id="${id}" data-it="${it}" ${S.inv[it] > 0 && p.lvl < charCap() ? "" : "disabled"}><span class="cost">${ITEMS[it].ic}×${S.inv[it] || 0}</span><span class="tiny">+${fmt(ITEMS[it].xp)}</span></button>`).join("")}
          <button class="btn sm blue" data-act="autoTrain" data-id="${id}" ${p.lvl < charCap() && (S.inv.droid1 || S.inv.droid2 || S.inv.droid3) ? "" : "disabled"}>Auto</button></div>
      </section>
      <section class="panel stack" style="gap:8px">
        <div class="spread"><h3>Gear <span class="gear-name" style="color:${GEAR_COLOR(p.gear)}">${roman(p.gear)}</span></h3><span class="tiny dim">Max ${roman(MAX_GEAR)}</span></div>
        ${gc ? `<div class="spread small"><span>Next tier needs</span><span class="row"><span class="cost">${ITEMS[gc.item].ic}${S.inv[gc.item] || 0}/${gc.n}</span><span class="cost">${IC.credits}${fmt(gc.credits)}</span></span></div>
        <button class="btn wide" data-act="gearUp" data-id="${id}" ${canAfford(gc.item, gc.n) && S.credits >= gc.credits ? "" : "disabled"}>Gear up to ${roman(p.gear + 1)}</button>` : '<p class="small gold">Gear maxed out.</p>'}
      </section>` : ""}
      <section class="panel"><h3 style="margin-bottom:8px">Stats</h3><div class="statgrid">
        <div><span>Health</span><b>${fmtFull(s.hp)}</b></div><div><span>Protection</span><b>${fmtFull(s.prot)}</b></div>
        <div><span>Offense</span><b>${fmtFull(s.off)}</b></div><div><span>Speed</span><b>${s.spd}</b></div>
        <div><span>Armor</span><b>${Math.round(s.armor)}%</b></div><div><span>Crit Chance</span><b>${pct(s.crit)}</b></div>
        <div><span>Potency</span><b>${pct(s.pot)}</b></div><div><span>Tenacity</span><b>${pct(s.ten)}</b></div>
      </div></section>
      <section class="panel stack" style="gap:10px"><h3>Abilities</h3>${abRows}
        <div class="divider"></div>
        <div class="ab"><div class="abicon unique">${IC.boost}</div><div class="stack" style="gap:4px"><div class="spread"><b>${esc(d.uq.n)}</b><span class="tag">Unique</span></div><p class="small dim">${esc(d.uq.d)}</p></div></div>
        ${d.lead ? `<div class="divider"></div><div class="ab"><div class="abicon leader">${IC.crown}</div><div class="stack" style="gap:4px"><div class="spread"><b>${esc(d.lead.n)}</b><span class="tag">Leader</span></div><p class="small dim">${esc(d.lead.d)}</p></div></div>` : ""}
      </section>
    </div>`;
  },

  arena() {
    tickTimers();
    if (!S.arena.opps) genOpps();
    const A = S.arena, now = Date.now();
    const payReady = now - A.payTime >= PAYOUT_MS, po = payout(A.rank);
    const def = topTeam(5);
    return `<div class="stack">
      <section class="panel" style="background:radial-gradient(100% 120% at 100% 0%,#3a2a08,var(--hull) 60%)">
        <div class="spread"><div><div class="eyebrow" style="color:var(--gold)">Squad Arena</div><div style="font:800 44px var(--f-display);line-height:1" class="num gold">#${A.rank}</div></div>
        <div style="text-align:right" class="small"><div>Attempts <b class="num">${A.attempts}/5</b></div>${A.attempts < 5 ? `<div class="tiny dim num">+1 in <span data-cd="att">${dur(ARENA_MS - (now - A.aTime))}</span></div>` : ""}<div class="row" style="justify-content:flex-end;margin-top:4px"><span class="cost">${IC.tokens}${fmt(S.tokens)}</span></div></div></div>
        <div class="divider" style="margin:10px 0"></div>
        <div class="spread small"><span>Payout: <span class="cost">${IC.crystals}${po.crystals}</span> <span class="cost">${IC.tokens}${po.tokens}</span></span>
          <button class="btn sm" data-act="payout" ${payReady ? "" : "disabled"}>${payReady ? "Claim" : `<span data-cd="pay">${dur(PAYOUT_MS - (now - A.payTime))}</span>`}</button></div>
      </section>
      <div><div class="eyebrow" style="margin-bottom:6px">Your defense (top 5 heroes)</div><div class="row">${def.map(id => ptHTML(id, { s: 50 })).join("")}</div></div>
      <div class="spread"><h3>Opponents</h3><button class="btn ghost sm" data-act="newOpps">Refresh</button></div>
      ${A.opps.map((o, k) => `<section class="panel stack" style="gap:8px">
        <div class="spread"><div><b>${esc(o.name)}</b><div class="tiny dim">Rank #${o.rank} · Power <span class="num">${fmtFull(o.pw)}</span></div></div>
        <button class="btn sm" data-act="arenaFight" data-k="${k}" ${A.attempts > 0 ? "" : "disabled"}>Battle</button></div>
        <div class="row">${o.team.map(u => ptHTML(u.id, { s: 46, prog: u })).join("")}</div></section>`).join("")}
      <h3 style="margin-top:6px">Arena Shipments</h3>
      <div class="tiles">${ARENA_STORE.map((it, k) => `<button class="tile" data-act="arenaBuy" data-k="${k}" ${S.tokens >= it.cost ? "" : "disabled"} style="min-height:120px;align-items:center;text-align:center">
        ${it.type === "shard" ? ptHTML(it.id, { s: 48, nostars: 1, nolv: 1 }) : `<div class="ri" style="width:48px;height:48px">${ITEMS[it.id].ic}</div>`}
        <span class="small" style="margin-top:4px">${it.n}× ${it.type === "shard" ? esc(CH[it.id].n) + " shards" : ITEMS[it.id].n}</span><span class="cost small">${IC.tokens}${it.cost}</span></button>`).join("")}</div>
    </div>`;
  },

  store() {
    const now = Date.now(), free = now - S.bronzeTime >= BRONZE_MS;
    return `<div class="stack">
      <h2>Shipments</h2>
      <section class="panel stack" style="gap:8px;background:linear-gradient(130deg,#3a1440,var(--hull) 65%)">
        <div class="spread"><div><h3>Chromium Pack</h3><p class="small dim">3 hero shard bundles, with a new hero guaranteed in the first slot when possible, plus 500 credits.</p></div><span style="width:42px;flex:none">${IC.crystals}</span></div>
        <div class="row"><button class="btn" data-act="chromium" ${S.crystals >= 250 ? "" : "disabled"}>Open <span class="cost">${IC.crystals}250</span></button><button class="btn ghost" data-act="chromium10" ${S.crystals >= 2200 ? "" : "disabled"}>Open 10 <span class="cost">${IC.crystals}2,200</span></button></div>
      </section>
      <section class="panel stack" style="gap:8px;background:linear-gradient(130deg,#3a2a14,var(--hull) 65%)">
        <div><h3>Bronzium Pack</h3><p class="small dim">Credits, training droids, salvage or a few hero shards. One free pack every 15 minutes.</p></div>
        <div class="row">${free ? `<button class="btn" data-act="bronze" data-free="1">Open free</button>` : `<button class="btn ghost" disabled>Free in <span data-cd="bronze">${dur(BRONZE_MS - (now - S.bronzeTime))}</span></button>`}
          <button class="btn ghost" data-act="bronze" ${S.credits >= 250 ? "" : "disabled"}>Open <span class="cost">${IC.credits}250</span></button></div>
      </section>
      <div class="tiles">
        <button class="tile" data-act="refillBuy" ${S.crystals >= 50 ? "" : "disabled"}><span class="ticon">${IC.energy}</span><h3>Energy Refill</h3><span class="tsub cost">${IC.crystals}50 · fills to ${maxEnergy(S.lvl)}</span></button>
        <button class="tile" data-act="heist" ${S.crystals >= 100 ? "" : "disabled"}><span class="ticon">${IC.credits}</span><h3>Credit Heist</h3><span class="tsub cost">${IC.crystals}100 → 6,000 credits</span></button>
        <button class="tile" data-act="buyDroids" ${S.crystals >= 80 ? "" : "disabled"}><span class="ticon">${IC.droid2}</span><h3>Training Kit</h3><span class="tsub cost">${IC.crystals}80 → 4 adv. droids</span></button>
        <button class="tile" data-act="buySal" ${S.crystals >= 120 ? "" : "disabled"}><span class="ticon">${IC.sal2}</span><h3>Salvage Crate</h3><span class="tsub cost">${IC.crystals}120 → mixed salvage</span></button>
      </div>
      <section class="panel"><h3 style="margin-bottom:8px">Inventory</h3><div class="rewards" style="justify-content:flex-start">${["sal1", "sal2", "sal3", "mats", "droid1", "droid2", "droid3"].map(k => `<div class="rw"><div class="ri">${ITEMS[k].ic}</div><span class="num">×${fmt(S.inv[k] || 0)}</span><span class="tiny dim">${ITEMS[k].n}</span></div>`).join("")}</div></section>
    </div>`;
  },
};

function shardSources(id) {
  const where = [];
  for (const t of ["light", "dark"]) CAMPAIGN[t].chapters.forEach((ch, c) => ch.shards.forEach((s, n) => { if (s === id) where.push(`${t === "light" ? "LS" : "DS"} ${nodeKey(c, n)}`); }));
  if (ARENA_STORE.some(a => a.id === id)) where.push("Arena Shipments");
  where.push("Chromium Packs");
  return "Shards from: " + [...new Set(where)].slice(0, 6).join(", ");
}
function nodeOpen(table, c, n) {
  if (c === 0 && n === 0) return true;
  const [pc, pn] = n === 0 ? [c - 1, 4] : [c, n - 1];
  return (S.camp[table][nodeKey(pc, pn)] || 0) > 0;
}
function firstOpenUncleared(table) {
  for (let c = 0; c < 6; c++) for (let n = 0; n < 5; n++) if (nodeOpen(table, c, n) && !S.camp[table][nodeKey(c, n)]) return [c, n];
  return null;
}
function nextHint() {
  const act = CH_IDS.find(id => !owned(id) && (S.shards[id] || 0) >= 10);
  if (act) return { act: "go", data: `data-v="char" data-a="${act}"`, text: `Activate <b>${esc(CH[act].n)}</b>. You have enough shards.` };
  if (DAILIES.some(d => !S.daily.claimed[d.id] && S.daily[d.id] >= d.goal)) return { act: "dailies", text: "Daily Activity rewards are ready to claim." };
  for (const t of ["light", "dark"]) {
    const nx = firstOpenUncleared(t);
    if (nx) { const node = nodeInfo(t, nx[0], nx[1]); return { act: "node", data: `data-c="${nx[0]}" data-n="${nx[1]}" data-t="${t}"`, text: `Fight ${t === "light" ? "Light" : "Dark"} Side battle <b>${node.key}</b>${node.boss ? ` against ${esc(CH[CAMPAIGN[t].chapters[nx[0]].boss].n)}` : ""}.` }; }
  }
  if (Date.now() - S.bronzeTime >= BRONZE_MS) return { act: "go", data: 'data-v="store"', text: "A free Bronzium pack is waiting in Shipments." };
  return null;
}

// ---------- modals ----------
function nodeModal(table, c, n) {
  const node = nodeInfo(table, c, n), st = S.camp[table][node.key] || 0;
  const salv = c < 2 ? "sal1" : c < 4 ? "sal2" : "sal3";
  openModal(`<div class="stack">
    <div class="spread"><div><div class="eyebrow">${CAMPAIGN[table].n} · ${node.key}</div><h2 style="margin-top:4px">${node.boss ? "Boss: " + esc(CH[CAMPAIGN[table].chapters[c].boss].n) : esc(CAMPAIGN[table].chapters[c].n)}</h2></div>
      <div class="nstars">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</div></div>
    ${node.waves.map((w, k) => `<div><div class="tiny dim" style="margin-bottom:4px">Wave ${k + 1} of ${node.waves.length} · Level ${w[0].lvl}</div><div class="row wrap">${w.map(e => ptHTML(e.id, { s: e.boss ? 56 : 46, prog: e })).join("")}</div></div>`).join("")}
    <div><div class="tiny dim" style="margin-bottom:4px">Possible rewards</div><div class="rewards" style="justify-content:flex-start">${rewardsHTML([{ k: "shard:" + node.shard, n: node.boss ? 3 : 2 }, { k: "credits", n: 90 + node.idx * 28 }, { k: salv, n: 4 }, { k: "mats", n: 2 }, { k: c < 3 ? "droid1" : "droid2", n: 1 }])}</div></div>
    <div class="row">
      <button class="btn ghost" data-act="sim" data-t="${table}" data-c="${c}" data-n="${n}" data-x="1" ${st >= 3 && S.energy >= node.energy ? "" : "disabled"}>Sim</button>
      <button class="btn ghost" data-act="sim" data-t="${table}" data-c="${c}" data-n="${n}" data-x="5" ${st >= 3 && S.energy >= node.energy * 5 ? "" : "disabled"}>Sim ×5</button>
      <button class="btn" style="flex:1" data-act="toSquad" data-t="${table}" data-c="${c}" data-n="${n}">Battle <span class="cost">${IC.energy}${node.energy}</span></button>
    </div>
    ${st < 3 ? '<p class="tiny dim">Earn 3 stars to unlock sims, which win the battle instantly.</p>' : ""}
  </div>`);
}
function dailiesModal() {
  const allDone = DAILIES.every(d => S.daily.claimed[d.id]);
  openModal(`<div class="stack"><div class="eyebrow">Resets daily</div><h2>Daily Activities</h2>
    ${DAILIES.map(d => {
      const v = Math.min(d.goal, S.daily[d.id] || 0), done = v >= d.goal, cl = S.daily.claimed[d.id];
      return `<div class="sub stack" style="gap:6px"><div class="spread"><b class="small">${d.n}</b><span class="small num">${v}/${d.goal}</span></div>
        <div class="bar"><i style="width:${v / d.goal * 100}%"></i></div>
        <div class="spread"><span class="row tiny">${Object.entries(d.reward).map(([k, n]) => `<span class="cost">${itemIcon(k)}${n}</span>`).join(" ")}</span>
        <button class="btn sm" data-act="claimDaily" data-id="${d.id}" ${done && !cl ? "" : "disabled"}>${cl ? "Claimed" : "Claim"}</button></div></div>`;
    }).join("")}
    <div class="sub spread"><span class="small">Complete all five: <span class="cost">${IC.crystals}${DAILY_ALL.crystals}</span></span>
      <button class="btn sm" data-act="claimAll" ${DAILIES.every(d => S.daily.claimed[d.id]) && !S.daily.claimed.all ? "" : "disabled"}>${S.daily.claimed.all ? "Claimed" : "Claim"}</button></div>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
  void allDone;
}
function settingsModal(confirmReset) {
  openModal(`<div class="stack"><h2>Profile</h2>
    <label class="small dim" for="pname">Commander name</label>
    <input id="pname" maxlength="18" value="${esc(S.name)}" style="font:600 16px var(--f-body);padding:10px 12px;background:var(--hull2);color:var(--text);border:1px solid var(--line2);border-radius:6px">
    <div class="statgrid small"><div><span>Player level</span><b>${S.lvl}</b></div><div><span>Galactic Power</span><b>${fmtFull(gp())}</b></div><div><span>Battles won</span><b>${S.stats.wins}</b></div><div><span>Battles fought</span><b>${S.stats.battles}</b></div></div>
    <button class="btn ghost wide" data-act="toggleSound">Sound: ${S.settings.sound ? "On" : "Off"}</button>
    ${confirmReset ? `<div class="sub stack" style="gap:8px;border-color:var(--ds)"><b class="small">Erase all progress?</b><p class="tiny dim">Your heroes, items and campaign stars will be deleted from this browser.</p>
      <div class="row"><button class="btn red sm" data-act="doReset">Erase progress</button><button class="btn ghost sm" data-act="settings">Keep playing</button></div></div>`
      : `<button class="btn ghost wide" data-act="askReset">Reset progress</button>`}
    <p class="tiny dim">Progress saves in this browser. Galactic Heroes is an unofficial, non-commercial fan game and is not affiliated with Lucasfilm, Disney, EA or Capital Games. All characters and art are drawn in code.</p>
    <button class="btn wide" data-act="saveName">Done</button></div>`);
}
function rewardModal(title, list, sub = "") {
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">${esc(sub)}</div><h2>${esc(title)}</h2>
    <div class="rewards">${rewardsHTML(list)}</div><button class="btn wide" data-act="closeModal">Collect</button></div>`);
}
function refillModal() {
  openModal(`<div class="stack"><h2>Energy</h2><p class="small dim">Energy powers campaign battles. You regain 1 energy every 30 seconds, and leveling up refills it.</p>
    <div class="spread"><span class="cost">${IC.energy}<b class="num">${S.energy}/${maxEnergy(S.lvl)}</b></span><span class="tiny dim">${S.energy < maxEnergy(S.lvl) ? "+1 in " + dur(ENERGY_MS - (Date.now() - S.eTime)) : "Full"}</span></div>
    <button class="btn wide" data-act="refillBuy" ${S.crystals >= 50 ? "" : "disabled"}>Refill <span class="cost">${IC.crystals}50</span></button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
