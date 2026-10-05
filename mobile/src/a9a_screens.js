
// =====================================================================
//  SCREENS (1/2): shell, lobby, story map, node sheet, team, dialogue
// =====================================================================
const UI = { view: "home", arg: null, el: "all", cls: "all", sort: "power", all: false, opTab: "info", team: null, depotTab: "runes", shopTab: "credit", runeSet: "all", hhStd: false };

function toast(msg, cls = "") { const t = document.createElement("div"); t.className = "toast " + cls; t.textContent = msg; $("#toast").appendChild(t); setTimeout(() => t.remove(), 2600); }
function openModal(html) { const m = $("#modal"); m.innerHTML = `<div class="mbox" role="dialog">${html}</div>`; m.hidden = false; m.onclick = e => { if (e.target === m) closeModal(); }; }
function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }
const starRow = (n, max = 6) => { let s = ""; for (let k = 1; k <= max; k++) s += k <= n ? IC.star : ""; return `<div class="rstars">${s}</div>`; };
function opHTML(key, o = {}) {
  const op = OPS[key], p = o.prog !== undefined ? o.prog : S.ops[key];
  const own = !!p;
  return `<div class="pt ${own || o.show ? "" : "locked"}" style="--s:${o.s || 72}px;--gc:${RC[op.rar]}">
    ${o.nostars ? "" : starRow(op.rar)}
    <div class="ring"><img src="${headURL(op)}" alt="${esc(op.n)}" loading="lazy" draggable="false"></div>
    ${o.noel ? "" : `<span class="eldot ${op.el}"></span>`}
    ${p && !o.nolv ? `<div class="lv num">${p.lvl}</div>${p.elite ? `<span class="elite">E${p.elite}</span>` : ""}${p.pot > 1 ? `<span class="potb">P${p.pot}</span>` : ""}` : ""}
  </div>`;
}
function enHTML(spec, s = 46) {
  if (spec.op) return opHTML(spec.op, { s, prog: progForLV(spec.op, spec.LV || 1), nostars: 1 });
  const d = ENEMY[spec.en];
  return `<div class="pt" style="--s:${s}px;--gc:${d.boss ? "var(--ds)" : "#6b7a99"}"><div class="ring"><img src="${enemyArt(spec.en).head}" alt="${esc(d.n)}"></div><span class="eldot ${d.el}"></span>${spec.LV ? `<div class="lv num">${spec.LV}</div>` : ""}</div>`;
}
function itemIcon(k) { return k === "sanity" ? IC.sanity : (ITEMS[k] && ITEMS[k].ic) || IC.boost; }
function rewardsHTML(list) {
  const merged = [];
  for (const r of list) { const m = merged.find(x => x.k === r.k && !r.rune && !x.rune && !r.k.startsWith("op:")); if (m) m.n += r.n; else merged.push({ ...r }); }
  return merged.map(r => {
    if (r.k.startsWith("op:")) { const k = r.k.slice(3); return `<div class="rw">${opHTML(k, { s: 54, nostars: 1, nolv: 1, show: 1 })}<span>${r.isNew === false ? "Potential +1" : "New operator"}</span></div>`; }
    if (r.k === "rune") return `<div class="rw"><div class="ri" style="width:54px;height:54px;color:${RUNE_RC[r.rune.rar]}">${IC.rune.replace('fill="#5fd4ff"', `fill="${RUNE_RC[r.rune.rar]}"`)}</div><span>${r.rune.set}</span><span class="tiny dim">${RUNE_RAR[r.rune.rar]}</span></div>`;
    const name = r.k === "xp" ? "Operator EXP" : r.k === "rank" ? "Rank" : (ITEMS[r.k] && ITEMS[r.k].n) || r.k;
    return `<div class="rw"><div class="ri" style="width:54px;height:54px">${r.k === "xp" ? IC.boost : r.k === "rank" ? IC.arena : itemIcon(r.k)}</div><span class="num">${r.k === "rank" ? "#" + r.n : "×" + fmt(r.n)}</span><span class="tiny dim">${esc(name)}</span></div>`;
  }).join("");
}
const back = (act, label, data = "") => `<button class="btn ghost sm" data-act="${act}" ${data}>${IC.back.replace("<svg", '<svg width="16" height="16"')}${label}</button>`;

// ---------- shell ----------
function renderTop() {
  tickTimers();
  const mx = maxSanity(S.lvl);
  $("#topbar").innerHTML = `
    <button class="me" data-act="settings" aria-label="Profile and settings">
      <div class="me-badge num">${S.lvl}</div>
      <div style="min-width:0;text-align:left"><div class="me-name">${S.name === "Doctor" ? "Doctor" : "Dr. " + esc(S.name)}</div><div class="me-xp"><i style="width:${S.xp / pxpNeed(S.lvl) * 100}%"></i></div></div>
    </button>
    <div class="res">
      <button class="pill" data-act="sanity" aria-label="Sanity">${IC.sanity}<span id="sanPill">${S.sanity}<small>/${mx}</small></span></button>
      <div class="pill">${IC.lmd}<span>${fmt(S.lmd)}</span></div>
      <div class="pill">${IC.orundum}<span>${fmt(S.orundum)}</span></div>
    </div>`;
  const tabs = [["home", "Home", IC.home], ["story", "Main Theme", IC.story], ["battle", "Terminal", IC.battles], ["ops", "Operator", IC.ops], ["hh", "Headhunt", IC.permit.replace('viewBox', 'fill="currentColor" viewBox')]];
  const on = { op: "ops", team: UI.arg && UI.arg.from || "story", hunt: "battle", tower: "battle", arena: "battle", chapter: "story", missions: "home", shop: "home", depot: "home" }[UI.view] || UI.view;
  $("#tabs").innerHTML = tabs.map(([v, n, ic]) => `<button class="${on === v ? "on" : ""}" data-act="go" data-v="${v}">${ic}<span>${n}</span>${badge(v) ? '<i class="dot"></i>' : ""}</button>`).join("");
}
function badge(v) {
  if (v === "home") return DAILIES.some(d => !S.daily.claimed[d.id] && S.daily[d.id] >= d.goal) || ACHIEVEMENTS.some(a => !S.ach[a.id] && a.test());
  if (v === "story") return !!nextNode();
  if (v === "battle") return Date.now() - S.arena.payTime >= PAYOUT_MS;
  if (v === "hh") return S.permit > 0 || S.orundum >= 600;
  return false;
}
function route(view, arg, keep) {
  UI.view = view; UI.arg = arg;
  const el = $("#view"), st = el.scrollTop;
  el.innerHTML = (SCREENS[view] || SCREENS.home)(arg);
  el.scrollTop = keep ? st : 0;
  renderTop(); save();
}
const rerender = () => route(UI.view, UI.arg, true);

// ---------- lobby ----------
const QUIPS = {
  amiya: ["Doctor, the operators are all waiting for your orders.", "Please don't overwork yourself. Rhodes Island needs you rested.", "I'll always be right here, Doctor."],
  exusiai: ["Apple pie break? Apple pie break.", "Need something shot? I'm your angel!", "Penguin Logistics, always on time. Mostly."],
  texas: ["...Pocky?", "Deliveries are done. What's next, Doctor?", "I'll handle it. Quietly."],
  silverash: ["Every venture has a cost, Doctor. I simply prefer to pay it in advance.", "Kjerag remembers its friends."],
  blaze: ["Hey Doctor! Ready to light something up?", "Elite operator Blaze, standing by!"],
  ifrit: ["Can I blow something up now? Please?", "Saria says I have to ask first. I'm asking!"],
  saria: ["Ifrit, put that down. ...Doctor. Do you need something?"],
  _: ["Standing by, Doctor.", "All systems green. Awaiting orders.", "The next operation is ready when you are.", "Rhodes Island is behind you, Doctor."],
};
function nextHint() {
  const nd = nextNode();
  if (DAILIES.some(d => !S.daily.claimed[d.id] && S.daily[d.id] >= d.goal) || ACHIEVEMENTS.some(a => !S.ach[a.id] && a.test())) return { act: "missions", text: "Mission rewards are ready to claim." };
  if (S.gacha.total === 0) return { act: "go", data: 'data-v="hh"', text: "Try your first <b>Headhunt</b>. Your first ten-pull guarantees a 5★ or better." };
  if (nd) return { act: "openNode", data: `data-id="${nd.id}"`, text: `Continue the Main Theme: <b>${nd.id} ${esc(nd.name)}</b>.` };
  return { act: "go", data: 'data-v="battle"', text: "Farm modules in <b>Supplies</b> or take on the <b>Stationary Security Service</b>." };
}
const SCREENS = {};
SCREENS.home = () => {
  const ak = S.ops[S.assistant] ? S.assistant : Object.keys(S.ops)[0], op = OPS[ak];
  const hint = nextHint(), nd = nextNode();
  const missionsReady = badge("home");
  return `<div class="lobby">
    <section class="stage">
      <div class="floor"></div><div class="ring3d"></div>
      <img class="assist" src="${spriteURL(op)}" alt="${esc(op.n)}" data-act="poke" draggable="false">
      <div class="nameplate"><span class="eyebrow">Assistant</span><b>${esc(op.n)}</b><div class="row" style="gap:4px"><span class="el ${op.el}">${op.el}</span><span class="cls">${op.cls}</span></div></div>
      <div class="sidebtns">
        <button class="sidebtn" data-act="missions" aria-label="Missions">${IC.missions}<small>Missions</small>${missionsReady ? '<i class="dot"></i>' : ""}</button>
        <button class="sidebtn" data-act="go" data-v="shop" aria-label="Store">${IC.shop}<small>Store</small></button>
        <button class="sidebtn" data-act="go" data-v="depot" aria-label="Depot">${IC.depot}<small>Depot</small></button>
      </div>
    </section>
    ${hint ? `<button class="hint" data-act="${hint.act}" ${hint.data || ""}>${IC.boost.replace("<svg", '<svg width="22" height="22"')}<div><div class="eyebrow">Next objective</div><div class="small">${hint.text}</div></div></button>` : ""}
    <div class="tiles">
      <button class="tile ls-t" data-act="go" data-v="story"><span class="ticon" style="color:var(--holo)">${IC.story}</span><h3>Main Theme</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "All episodes cleared"}</span></button>
      <button class="tile ds-t" data-act="go" data-v="battle"><span class="ticon" style="color:var(--ds)">${IC.battles}</span><h3>Terminal</h3><span class="tsub">Supplies · SSS · Contract</span></button>
      <button class="tile" data-act="go" data-v="hh"><span class="ticon">${IC.permit}</span><h3>Headhunt</h3><span class="tsub">${S.permit} permits · ${fmt(S.orundum)} Orundum</span></button>
      <button class="tile" data-act="go" data-v="ops"><span class="ticon" style="color:var(--gold)">${IC.ops}</span><h3>Operator</h3><span class="tsub">${Object.keys(S.ops).length}/${OP_KEYS.length} recruited</span></button>
    </div>
    <p class="tiny dim" style="text-align:center;padding:4px 8px">Arknights Tactics is an unofficial, non-commercial fan game. Arknights characters and art belong to Hypergryph and Yostar.</p>
  </div>`;
};

// ---------- story ----------
SCREENS.story = () => {
  const ep = STORY[0];
  return `<div class="stack">
    <section class="panel ep-card" style="background:radial-gradient(90% 120% at 100% 0%,#5a1e14,transparent 60%),var(--hull)">
      <div class="eyebrow">Main Theme</div><h1 style="margin-top:4px;font-size:30px">${esc(ep.title)}</h1>
      <p class="small dim" style="margin-top:6px;max-width:42ch">${esc(ep.blurb)}</p>
    </section>
    ${ep.chapters.map((ch, i) => {
      const open = nodeOpen(ch.nodes[0]), done = chapterCleared(ch);
      const battles = ch.nodes.filter(n => n.waves), stars = battles.reduce((a, n) => a + nodeStars(n.id), 0);
      return `<button class="tile wide" data-act="chapter" data-c="${ch.id}" ${open ? "" : "disabled"} style="min-height:88px;background:linear-gradient(120deg,${mapTheme(ch.map).a},var(--hull2) 70%)">
        <span class="ticon" style="width:auto;height:auto;font:800 40px var(--f-display);opacity:.25;top:2px">${i + 1}</span>
        <div class="eyebrow">Episode ${ch.no}${done ? " · Cleared" : ""}</div><h3>${esc(ch.title)}</h3>
        <span class="tsub">${open ? `${stars}/${battles.length * 3} stars` : "Clear the previous episode to unlock"}</span></button>`;
    }).join("")}
  </div>`;
};
function mapTheme(m) {
  return { ruins: { a: "#4a1810", b: "#1a0c0a", c: "#ff7a3a" }, city: { a: "#16245a", b: "#080c1c", c: "#5fd4ff" }, slums: { a: "#4a3424", b: "#16100c", c: "#f2c14e" }, snow: { a: "#3a5a80", b: "#0c1624", c: "#cfe8ff" } }[m] || { a: "#16245a", b: "#080c1c", c: "#5fd4ff" };
}
SCREENS.chapter = cid => {
  const ch = STORY[0].chapters.find(c => c.id === cid), th = mapTheme(ch.map), ci = STORY[0].chapters.indexOf(ch);
  const XS = [50, 24, 70, 32, 74, 28, 60];
  let mainI = 0;
  const pos = ch.nodes.map(nd => {
    if (nd.type === "side") return null;
    const p = { x: XS[mainI % XS.length], y: 80 + mainI * 112 }; mainI++; return p;
  });
  // side stories branch off toward the outer edge, clear of the main path's curve
  ch.nodes.forEach((nd, i) => { if (!pos[i]) { const pr = pos[i - 1] || { x: 50, y: 80 }; pos[i] = { x: pr.x < 50 ? Math.max(11, pr.x - 18) : Math.min(89, pr.x + 18), y: pr.y + 50, side: true }; } });
  const H = 80 + mainI * 112 + 40, rng = seeded(hash(cid + "map"));
  const main = ch.nodes.map((n, i) => [n, pos[i]]).filter(([n]) => n.type !== "side");
  let d = "";
  main.forEach(([, p], i) => { const x = p.x * 4, y = p.y; if (!i) d = `M${x} ${y}`; else { const q = main[i - 1][1]; d += ` C${q.x * 4} ${(q.y + y) / 2} ${x} ${(q.y + y) / 2} ${x} ${y}`; } });
  let deco = "";
  for (let k = 0; k < 26; k++) {
    const x = rng() * 400, y = rng() * H, r = 6 + rng() * 26;
    deco += ch.map === "city" || ch.map === "slums" ? `<rect x="${x}" y="${y}" width="${r}" height="${r * (1 + rng())}" fill="${th.c}" opacity="${.04 + rng() * .06}"/>`
      : ch.map === "snow" ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${.03 + rng() * .05}"/>`
      : `<path d="M${x} ${y} l${r} ${-r * 1.4} l${r} ${r * 1.4}z" fill="${th.c}" opacity="${.04 + rng() * .06}"/>`;
  }
  const sideLines = ch.nodes.map((n, i) => n.type === "side" ? `<path d="M${pos[i - 1].x * 4} ${pos[i - 1].y} L${pos[i].x * 4} ${pos[i].y}" stroke="${th.c}" stroke-width="2" stroke-dasharray="4 6" opacity=".5" fill="none"/>` : "").join("");
  const icon = t => t === "boss" ? IC.skull : t === "story" ? IC.book : t === "chest" ? IC.chest : IC.sword;
  const nx = nextNode();
  return `<div class="stack">
    <div class="spread">${back("go", "Main Theme", 'data-v="story"')}<span class="eyebrow">Episode ${ch.no}</span></div>
    <h2>${esc(ch.title)}</h2>
    <div class="mapwrap" style="background:linear-gradient(180deg,${th.a},${th.b})">
      <svg class="map" viewBox="0 0 400 ${H}" preserveAspectRatio="none" style="height:${H}px">${deco}
        <path d="${d}" stroke="#000" stroke-width="10" fill="none" opacity=".35"/><path d="${d}" stroke="${th.c}" stroke-width="3" stroke-dasharray="8 7" fill="none" opacity=".85"/>${sideLines}</svg>
      ${ch.nodes.map((nd, i) => {
        const open = nodeOpen(nd), st = nodeStars(nd.id), done = st > 0;
        return `<button class="mnode ${nd.type} ${open ? "" : "locked"} ${done ? "done" : ""} ${nx === nd ? "next" : ""}" style="left:${pos[i].x}%;top:${pos[i].y}px" data-act="openNode" data-id="${nd.id}" aria-label="${nd.id} ${esc(nd.name)}">
          <span class="disc">${open ? icon(nd.type) : IC.lock}</span><span class="lbl">${nd.id}${nd.type === "side" ? " · Side" : ""}</span>
          ${nd.waves ? `<span class="nst">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</span>` : ""}</button>`;
      }).join("")}
    </div>
    <p class="tiny dim">Episode reward: ${ch.reward.op ? esc(OPS[ch.reward.op].n) + " joins Rhodes Island, plus " : ""}${ch.reward.orundum} Orundum${ch.reward.permit ? ` and ${ch.reward.permit} Headhunting Permits` : ""}.</p>
  </div>`;
};
function nodeSheet(nd) {
  const st = nodeStars(nd.id), cost = nodeCost(nd), lv = nd.lv;
  const waves = nd.waves ? nd.waves.map(w => w.map(s => ({ ...s, LV: lv + (s.e && ENEMY[s.e].boss ? 3 : 0), en: s.e }))) : null;
  const goal = nodeTurnGoal(nd);
  openModal(`<div class="stack">
    <div class="spread"><div><div class="eyebrow">${nd.id} · ${{ story: "Story", battle: "Operation", side: "Side Story", chest: "Supply Cache", boss: "Boss Operation" }[nd.type]}</div><h2 style="margin-top:4px">${esc(nd.name)}</h2></div>
      ${nd.waves ? `<div class="nstars">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</div>` : ""}</div>
    ${waves ? waves.map((w, k) => `<div><div class="tiny dim" style="margin-bottom:4px">Wave ${k + 1} of ${waves.length}</div><div class="row wrap">${w.map(s => enHTML(s, s.en && ENEMY[s.en].boss ? 56 : 46)).join("")}</div></div>`).join("") : ""}
    ${nd.waves ? `<div class="stack" style="gap:4px"><div class="tiny dim">3-star conditions</div>
      ${["Complete the operation", "No operator falls", `Clear within ${goal} of your turns`].map((m, k) => `<div class="mission">${k < st ? IC.star : IC.starOff}<span>${m}</span></div>`).join("")}</div>
      <div><div class="tiny dim" style="margin-bottom:4px">${st ? "Regular drops" : "First clear"}${st < 3 ? " · first 3-star clear adds 1 Originite Prime" : ""}</div><div class="rewards" style="justify-content:flex-start">${rewardsHTML(st ? [{ k: "lmd", n: 80 + lv * 15 }, { k: lv < 20 ? "rec1" : lv < 40 ? "rec2" : "rec3", n: 2 }, { k: "summ", n: 1 }] : [{ k: "orundum", n: nd.type === "boss" ? 150 : nd.type === "side" ? 100 : 60 }, { k: "lmd", n: 80 + lv * 15 }, { k: lv < 20 ? "rec1" : lv < 40 ? "rec2" : "rec3", n: 3 }])}</div></div>` : ""}
    ${nd.type === "chest" ? `<div class="rewards" style="justify-content:flex-start">${rewardsHTML(Object.entries(nd.reward).map(([k, n]) => ({ k, n })))}</div>` : ""}
    <div class="row">
      ${nd.waves && st >= 3 ? `<button class="btn ghost" data-act="sweep" data-id="${nd.id}" data-x="1">Auto Deploy</button><button class="btn ghost" data-act="sweep" data-id="${nd.id}" data-x="3">×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="startNode" data-id="${nd.id}" ${nd.type === "chest" && st ? "disabled" : ""}>${nd.type === "story" ? (st ? "Replay story" : "Read story") : nd.type === "chest" ? (st ? "Collected" : "Collect") : `Start <span class="cost">${IC.sanity}${cost}</span>`}</button>
    </div>
    ${nd.waves && st < 3 ? '<p class="tiny dim">Clear with 3 stars to unlock Auto Deploy.</p>' : ""}
  </div>`);
}

// ---------- team select ----------
SCREENS.team = arg => {
  const key = arg.mode;
  if (!UI.team || UI.team.key !== key) UI.team = { key, ids: (S.team[key] || []).filter(owned).slice(0, 4) };
  const ids = UI.team.ids;
  const pool = Object.keys(S.ops).filter(k => UI.el === "all" || OPS[k].el === UI.el).sort((a, b) => power(b, S.ops[b]) - power(a, S.ops[a]));
  const lead = ids[0] && OPS[ids[0]].leader;
  const myPw = ids.reduce((a, k) => a + power(k, S.ops[k]), 0);
  const foeEls = [...new Set((arg.foes || []).map(s => s.op ? OPS[s.op].el : ENEMY[s.en].el))];
  const counter = foeEls.map(e => Object.keys(BEATS).find(k => BEATS[k] === e && !(k === "Light" || k === "Dark")) || (e === "Light" ? "Dark" : e === "Dark" ? "Light" : null)).filter(Boolean);
  return `<div class="stack">
    <div class="spread">${back("teamBack", "Back")}<div class="eyebrow">${esc(arg.title || "")}</div></div>
    <h2>Squad</h2>
    ${foeEls.length ? `<div class="small">Enemy elements: ${foeEls.map(e => `<span class="el ${e}">${e}</span>`).join(" ")} ${counter.length ? `<span class="dim">· Strong picks:</span> ${[...new Set(counter)].map(e => `<span class="el ${e}">${e}</span>`).join(" ")}` : ""}</div>` : ""}
    <div class="squad">${[0, 1, 2, 3].map(k => {
      const id = ids[k];
      return `<div class="slot">${k === 0 ? `<span class="crown">${IC.crown}</span>` : ""}${id ? `<button data-act="slot" data-k="${k}" aria-label="${esc(OPS[id].n)}">${opHTML(id, { s: 66 })}</button>` : '<div class="empty"></div>'}</div>`;
    }).join("")}</div>
    <div class="leadtxt small">${lead ? `<b class="gold">Leader: ${esc(OPS[ids[0]].n)}</b> <span class="dim">${leaderText(lead)}</span>` : ids[0] ? `<span class="dim">${esc(OPS[ids[0]].n)} has no leader skill. Tap a squad member to make them leader.</span>` : `<span class="dim">Pick up to four operators. The first slot leads.</span>`}</div>
    <div class="spread small"><span>Squad power <b class="num">${fmtFull(myPw)}</b></span>${arg.cost ? `<span class="cost">${IC.sanity}${arg.cost}</span>` : ""}</div>
    <button class="btn wide" data-act="deploy" ${ids.length ? "" : "disabled"}>Mission Start</button>
    <div class="filters">${["all", ...ELS].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}">${e === "all" ? "All" : e}</button>`).join("")}</div>
    <div class="roster">${pool.map(k => `<button class="rcell ${ids.includes(k) ? "sel" : ""}" data-act="pickTeam" data-k="${k}">${opHTML(k)}<div class="pname">${esc(OPS[k].n)}</div><div class="pw">${fmt(power(k, S.ops[k]))}</div></button>`).join("")}</div>
  </div>`;
};
function leaderText(l) {
  if (!l) return "—";
  const sym = { ATK: "ATK", HP: "HP", DEF: "DEF", SPD: "SPD", CR: "Crit Rate", CD: "Crit Damage", ACC: "Accuracy", RES: "Resistance" }[l.stat] || l.stat;
  return `${sym} +${Math.round(l.amount * 100)}% for ${l.scope === "All" ? "all allies" : l.element + " allies"}`;
}

// ---------- dialogue ----------
// Layered silhouette backdrop per environment (skyline, ruins, peaks), seeded so a scene always looks the same.
function sceneSVG(env) {
  const th = mapTheme(env), rng = seeded(hash(env + "scene")), snow = env === "snow";
  const sky = { ruins: ["#1a0806", "#6a2412", "#e0703a"], city: ["#03050d", "#141a44", "#4a3478"], slums: ["#140e14", "#4a3040", "#d8965a"], snow: ["#3a5070", "#8aa8c8", "#e8f2ff"] }[env] || ["#03050d", "#141a44", "#4a3478"];
  const layer = (base, h0, h1, col, jag, lit) => {
    let x = -10, out = "";
    while (x < 410) {
      const w = 16 + rng() * 42, h = h0 + rng() * (h1 - h0);
      if (snow) { const pk = x + w * (.3 + rng() * .4); out += `<polygon points="${x - 30},${base} ${pk},${base - h * 1.3} ${x + w + 30},${base}" fill="${col}"/>`; }
      else if (jag) out += `<polygon points="${x},${base + 300} ${x},${base - h} ${x + w * .3},${base - h + 8 + rng() * 22} ${x + w * .55},${base - h - 6} ${x + w * .8},${base - h + 14 + rng() * 26} ${x + w},${base - h + rng() * 30} ${x + w},${base + 300}" fill="${col}"/>`;
      else out += `<rect x="${x}" y="${base - h}" width="${w}" height="${h + 300}" fill="${col}"/>`;
      if (lit) for (let k = 0; k < 6; k++) if (rng() < .5) out += `<rect x="${x + 3 + rng() * (w - 8)}" y="${base - h + 6 + rng() * (h - 12)}" width="2.5" height="3.5" fill="${lit}" opacity="${.35 + rng() * .5}"/>`;
      x += w + (snow ? 10 : rng() * 6);
    }
    return out;
  };
  let fx = "";
  for (let k = 0; k < 40; k++) fx += snow ? `<circle cx="${rng() * 400}" cy="${rng() * 800}" r="${.8 + rng() * 2.2}" fill="#fff" opacity="${.3 + rng() * .5}"/>`
    : env === "city" ? (k < 30 ? `<circle cx="${rng() * 400}" cy="${rng() * 380}" r="${rng() * 1.2 + .3}" fill="#fff" opacity="${.2 + rng() * .6}"/>` : "")
    : `<circle cx="${rng() * 400}" cy="${200 + rng() * 520}" r="${.8 + rng() * 1.8}" fill="${th.c}" opacity="${.25 + rng() * .5}"/>`;
  const jag = env === "ruins" || env === "slums";
  return `<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".55" stop-color="${sky[1]}"/><stop offset=".78" stop-color="${sky[2]}"/></linearGradient>
    <radialGradient id="gl" cx=".5" cy=".7" r=".5"><stop offset="0" stop-color="${th.c}" stop-opacity=".35"/><stop offset="1" stop-color="${th.c}" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="800" fill="url(#sk)"/><rect width="400" height="800" fill="url(#gl)"/>
    ${env === "city" ? `<circle cx="300" cy="170" r="26" fill="#e8f0ff" opacity=".85"/>` : env === "ruins" ? `<circle cx="110" cy="420" r="34" fill="#ffb08a" opacity=".5"/>` : ""}
    <g opacity=".55">${layer(560, 120, 320, snow ? "#7f98b8" : th.b, jag, env === "city" ? "#ffd76b" : null)}</g>
    <g>${layer(610, 60, 200, snow ? "#5a7090" : "#05070c", jag, env === "city" || env === "slums" ? (env === "city" ? "#5fd4ff" : "#ffb050") : null)}</g>
    <rect y="600" width="400" height="200" fill="${snow ? "#d8e4f0" : "#05070c"}"/>${fx}
    <rect width="400" height="800" fill="url(#gl)" opacity=".5"/></svg>`;
}
function playScene(lines, title, env) {
  return new Promise(resolve => {
    const root = $("#dlg"), th = mapTheme(env);
    root.innerHTML = `<div class="dwrap">
      <div class="dbg" style="background:${th.b}">${sceneSVG(env)}</div>
      <img class="dchar left" id="dL" alt="" hidden><img class="dchar right" id="dR" alt="" hidden>
      <div class="dtop"><span class="ttl">${esc(title || "")}</span><div class="row"><button class="tog" id="dAuto">AUTO</button><button class="tog" id="dSkip">SKIP</button></div></div>
      <div class="dbox" id="dBox"><div class="dname" id="dName" hidden></div><div class="dtext" id="dText"></div><div class="dnext" id="dNext" hidden></div></div>
    </div>`;
    root.hidden = false;
    let i = -1, typing = 0, full = "", auto = false, timer = 0, autoT = 0;
    const L = $("#dL"), Rr = $("#dR"), side = {};
    const done = () => { clearInterval(timer); clearTimeout(autoT); root.hidden = true; root.innerHTML = ""; resolve(); };
    const showLine = () => {
      i++; if (i >= lines.length) return done();
      const ln = lines[i], sp = SPK[ln.s] || { n: ln.s };
      const nm = $("#dName"); nm.hidden = !sp.n; nm.textContent = sp.n || "";
      $("#dBox").classList.toggle("dnarr", ln.s === "narr");
      const art = sp.op ? spriteURL(OPS[sp.op]) : sp.en ? enemyArt(sp.en).full : null;
      if (art) {
        const isRight = !!sp.en, img = isRight ? Rr : L;
        if (side[isRight ? "R" : "L"] !== ln.s) { img.classList.add("enter"); img.src = art; img.hidden = false; side[isRight ? "R" : "L"] = ln.s; requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove("enter"))); }
        if (isRight) img.style.transform = "scaleX(-1)";
        L.classList.toggle("dim", isRight); Rr.classList.toggle("dim", !isRight);
      } else { L.classList.add("dim"); Rr.classList.add("dim"); }
      full = ln.t; let n = 0; const tx = $("#dText"); tx.textContent = ""; $("#dNext").hidden = true;
      clearInterval(timer);
      typing = 1;
      timer = setInterval(() => { n += 2; tx.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(timer); typing = 0; $("#dNext").hidden = false; if (auto) autoT = setTimeout(showLine, 1100 + full.length * 18); } }, 22);
    };
    root.onclick = ev => {
      if (ev.target.closest("#dSkip")) return done();
      if (ev.target.closest("#dAuto")) { auto = !auto; $("#dAuto").classList.toggle("on", auto); if (auto && !typing) showLine(); return; }
      clearTimeout(autoT);
      if (typing) { clearInterval(timer); typing = 0; $("#dText").textContent = full; $("#dNext").hidden = false; if (auto) autoT = setTimeout(showLine, 1200); }
      else showLine();
    };
    showLine();
  });
}
