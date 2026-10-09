
// =====================================================================
//  SCREENS (1/2): shell, lobby, story map, node sheet, team, dialogue
// =====================================================================
const UI = { view: "home", arg: null, el: "all", sty: "all", cls: "all", sort: "power", all: false, opTab: "info", team: null, depotTab: "parts", shopTab: "credit", partSlot: "ar", hhStd: false };

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
    ${o.noel ? "" : `<span class="eldot" style="--ec:${ELC[op.el]}">${op.el[0]}</span>`}
    ${p && !o.nolv ? `<div class="lv num">${p.lvl}</div>${p.elite ? `<span class="elite">U${p.elite}</span>` : ""}${p.pot > 1 ? `<span class="potb">+${p.pot - 1}</span>` : ""}` : ""}
  </div>`;
}
// roster label: the Beyblade's name, then its type (in its colour) and Blader. Badges: letter and colour = type.
const pnameHTML = k => `<div class="pname">${esc(OPS[k].n)}<span class="sty"><b style="color:${ELC[OPS[k].el]}">${elShort(OPS[k].el)}</b> ${esc(OPS[k].blader)}</span></div>`;
const elChip = el => `<span class="el ${el}">${el}</span>`;
const beastChip = op => op.beast && op.beast.n ? `<span class="el sty" style="--bc:${op.beast.col}">${esc(op.beast.n)} · ${esc(op.beast.el)}</span>` : "";
function enHTML(spec, s = 46) {
  if (spec.op) return opHTML(spec.op, { s, prog: progForLV(spec.op, spec.LV || 1), nostars: 1 });
  const d = ENEMY[spec.en];
  return `<div class="pt" style="--s:${s}px;--gc:${d.boss ? "var(--ds)" : "#6b7a99"}"><div class="ring"><img src="${enemyArt(spec.en).head}" alt="${esc(d.n)}"></div><span class="eldot" style="--ec:${ELC[d.el]}">${d.el[0]}</span>${spec.LV ? `<div class="lv num">${spec.LV}</div>` : ""}</div>`;
}
function itemIcon(k) { return k === "sanity" ? IC.sanity : (ITEMS[k] && ITEMS[k].ic) || IC.boost; }
function rewardsHTML(list) {
  const merged = [];
  for (const r of list) { const m = merged.find(x => x.k === r.k && !r.part && !x.part && !r.k.startsWith("op:")); if (m) m.n += r.n; else merged.push({ ...r }); }
  return merged.map(r => {
    if (r.k.startsWith("op:")) { const k = r.k.slice(3); return `<div class="rw">${opHTML(k, { s: 54, nostars: 1, nolv: 1, show: 1 })}<span>${r.isNew === false ? "Bit-Beast Sync +1" : "New Beyblade"}</span><span class="tiny dim">${esc(opLabel(OPS[k]))}</span></div>`; }
    if (r.k === "part") return `<div class="rw"><div class="ri" style="width:54px;height:54px;color:${PART_GC[r.part.rar]}">${IC.rune}</div><span>${esc(partName(r.part))}</span><span class="tiny" style="color:${PART_GC[r.part.rar]}">${PART_GRADE[r.part.rar]}</span></div>`;
    const name = r.k === "xp" ? "Beyblade EXP" : r.k === "rank" ? "Rank" : (ITEMS[r.k] && ITEMS[r.k].n) || r.k;
    return `<div class="rw"><div class="ri" style="width:54px;height:54px">${r.k === "xp" ? IC.boost : r.k === "rank" ? IC.arena : itemIcon(r.k)}</div><span class="num">${r.k === "rank" ? "#" + r.n : "×" + fmt(r.n)}</span><span class="tiny dim">${esc(name)}</span></div>`;
  }).join("");
}
const back = (act, label, data = "") => `<button class="btn ghost sm" data-act="${act}" ${data}>${IC.back.replace("<svg", '<svg width="16" height="16"')}${label}</button>`;

// ---------- shell ----------
function renderTop() {
  tickTimers();
  const mx = maxSanity(S.lvl);
  $("#topbar").innerHTML = `
    <button class="me" data-act="settings" aria-label="Settings">
      <div class="me-badge num">${S.lvl}</div>
      <div style="min-width:0;text-align:left"><div class="me-name">${esc(S.name)}</div><div class="me-xp"><i style="width:${S.xp / pxpNeed(S.lvl) * 100}%"></i></div></div>
    </button>
    <div class="res">
      <button class="pill" data-act="sanity" aria-label="Energy">${IC.sanity}<span id="sanPill">${S.sanity}<small>/${mx}</small></span></button>
      <div class="pill">${IC.lmd}<span>${fmt(S.lmd)}</span></div>
      <div class="pill">${IC.orundum}<span>${fmt(S.orundum)}</span></div>
    </div>`;
  const tabs = [["home", "Home", IC.home], ["story", "Story", IC.story], ["battle", "Battle", IC.battles], ["ops", "Beyblades", IC.ops], ["hh", "Boosters", IC.launcher]];
  const on = { op: "ops", team: UI.arg && UI.arg.from || "story", hunt: "battle", tower: "battle", arena: "battle", chapter: "story", missions: "home", shop: "home", depot: "home", inbox: "home", ach: "home", settings: "home" }[UI.view] || UI.view;
  $("#tabs").innerHTML = tabs.map(([v, n, ic]) => `<button class="${on === v ? "on" : ""}" data-act="go" data-v="${v}">${ic}<span>${n}</span>${badge(v) ? '<i class="dot"></i>' : ""}</button>`).join("");
}
function badge(v) {
  if (v === "home") return dailyReady() || unclaimedMail().length > 0;
  if (v === "story") return !!nextNode();
  if (v === "battle") return Date.now() - S.arena.payTime >= PAYOUT_MS;
  if (v === "hh") return S.permit > 0 || S.orundum >= 600 || S.inv.free10 > 0 || S.inv.gold5 > 0;
  return false;
}
const dailyReady = () => DAILIES.some(d => !S.daily.claimed[d.id] && S.daily[d.id] >= d.goal);
function route(view, arg, keep) {
  UI.view = view; UI.arg = arg;
  if (UI.inGame) metaTick();
  const el = $("#view"), st = el.scrollTop;
  el.innerHTML = (SCREENS[view] || SCREENS.home)(arg);
  el.scrollTop = keep ? st : 0;
  renderTop(); save();
}
const rerender = () => route(UI.view, UI.arg, true);

// ---------- lobby ----------
const QUIPS = {
  tyson: ["Bladers ready? Let's go! ...After lunch.", "Dragoon and I never give up. Ever.", "Grandpa says I should train more. Grandpa's always right. Don't tell him I said that.", "I'm gonna be the greatest Blader in the world!"],
  kai: ["...", "Don't slow me down.", "Dranzer doesn't lose twice to the same opponent.", "Hn. Train harder."],
  ray: ["Driger is restless today. Let's battle.", "I made noodles for the team. Want some?", "Calm mind, sharp claws."],
  max: ["Hey, wanna battle? Just for fun!", "Mustard makes everything better. Even Beyblades. Probably.", "Draciel's got your back!"],
  kenny: ["My data says we have a 73% chance of winning. Up from 12%!", "Dizzi, stop talking while I'm working!", "Don't touch the laptop!"],
  daichi: ["I'm gonna be the greatest Blader ever! Right after Tyson. No, before Tyson!", "Is there food? I smell food.", "Strata Dragoon, let's rip!"],
  hiro: ["You've grown, Tyson. But you can grow more.", "A Blader who stops training stops winning."],
  tala: ["Wolborg doesn't feel the cold. Neither do I.", "The Abbey is behind us now."],
  brooklyn: ["Battling is so easy. Why does everyone try so hard?", "The birds sing so nicely today."],
  mingming: ["Ming-Ming loves her fans!", "Aren't I adorable?"],
  zeo: ["Tyson is my best friend. Is that... what friends feel like?", "Cerberus is calm today."],
  _: ["Bladers ready?", "3, 2, 1, let it rip!", "My Beyblade's spinning great today.", "Let's find somebody to battle!"],
};
function nextHint() {
  const nd = nextNode();
  if (S.inbox.some(m => m.tag === "welcome" && !m.claimed)) return { act: "inbox", text: "Your welcome gifts from Mr. Dickenson are in the <b>Mailbox</b>: ten free Random Boosters and a guaranteed 5★ Beyblade." };
  if (S.inv.free10 > 0 || S.inv.gold5 > 0) return { act: "go", data: 'data-v="hh"', text: "Open your <b>free Boosters</b> at the Booster shop." };
  if (dailyReady()) return { act: "missions", text: "Mission rewards are ready to claim." };
  const um = unclaimedMail().length;
  if (um) return { act: "inbox", text: `You have <b>${um}</b> unclaimed gift${um > 1 ? "s" : ""} in your Mailbox.` };
  if (S.gacha.total === 0) return { act: "go", data: 'data-v="hh"', text: "Open your first <b>Random Booster</b>. Your first ten guarantee a 4★ Beyblade or better." };
  if (nd) return { act: "openNode", data: `data-id="${nd.id}"`, text: `Continue the story: <b>${nd.id} ${esc(nd.name)}</b>.` };
  return { act: "go", data: 'data-v="battle"', text: "Win Customize Parts in <b>Street Battles</b> or climb the <b>BBA Tower</b>." };
}
const SCREENS = {};
SCREENS.home = () => {
  const ak = S.ops[S.assistant] ? S.assistant : Object.keys(S.ops)[0], op = OPS[ak];
  const hint = nextHint(), nd = nextNode();
  const missionsReady = dailyReady(), mails = unclaimedMail().length, newAch = achDone() > (S.achSeen || 0);
  return `<div class="lobby">
    <section class="stage">
      <div class="floor"></div><div class="ring3d"></div>
      <img class="assist" src="${spriteURL(op)}" alt="${esc(op.n)}" data-act="poke" draggable="false">
      <div class="nameplate"><span class="eyebrow">Partner · ${esc(op.blader)}</span><b>${esc(op.n)}</b><div class="row" style="gap:4px">${elChip(op.el)}${beastChip(op)}</div></div>
      <div class="sidebtns left">
        <button class="sidebtn" data-act="inbox" aria-label="Mailbox">${IC.mail}<small>Mail</small>${mails ? `<i class="cnt num">${mails}</i>` : ""}</button>
        <button class="sidebtn" data-act="go" data-v="ach" aria-label="Achievements">${IC.trophy}<small>Records</small>${newAch ? '<i class="dot"></i>' : ""}</button>
      </div>
      <div class="sidebtns">
        <button class="sidebtn" data-act="missions" aria-label="Missions">${IC.missions}<small>Missions</small>${missionsReady ? '<i class="dot"></i>' : ""}</button>
        <button class="sidebtn" data-act="go" data-v="shop" aria-label="Hobby shop">${IC.shop}<small>Hobby Shop</small></button>
        <button class="sidebtn" data-act="go" data-v="depot" aria-label="Items">${IC.depot}<small>Items</small></button>
      </div>
    </section>
    ${hint ? `<button class="hint" data-act="${hint.act}" ${hint.data || ""}>${IC.boost.replace("<svg", '<svg width="22" height="22"')}<div><div class="eyebrow">Next objective</div><div class="small">${hint.text}</div></div></button>` : ""}
    <div class="tiles">
      <button class="tile ls-t" data-act="go" data-v="story"><span class="ticon" style="color:var(--holo)">${IC.story}</span><h3>Story</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "Every tournament won"}</span></button>
      <button class="tile ds-t" data-act="go" data-v="battle"><span class="ticon" style="color:var(--ds)">${IC.battles}</span><h3>Battle</h3><span class="tsub">Streets · Tower · Ranked</span></button>
      <button class="tile" data-act="go" data-v="hh"><span class="ticon">${IC.permit}</span><h3>Boosters</h3><span class="tsub">${S.permit} tickets · ${fmt(S.orundum)} BeyPoints</span></button>
      <button class="tile" data-act="go" data-v="ops"><span class="ticon" style="color:var(--gold)">${IC.ops}</span><h3>Beyblades</h3><span class="tsub">${Object.keys(S.ops).length}/${OP_KEYS.length} collected</span></button>
    </div>
    <p class="tiny dim" style="text-align:center;padding:4px 8px">Beyblade: Let It Rip! is an unofficial, non-commercial fan game. Beyblade belongs to Takara Tomy, Hasbro, Aoki Takao and Nelvana.</p>
  </div>`;
};

// ---------- story ----------
SCREENS.story = () => {
  const ep = STORY[0];
  return `<div class="stack">
    <section class="panel ep-card" style="background:radial-gradient(90% 120% at 100% 0%,#14408a,transparent 60%),var(--hull)">
      <div class="eyebrow">${esc(ep.sub)}</div><h1 style="margin-top:4px;font-size:30px">${esc(ep.title)}</h1>
      <p class="small dim" style="margin-top:6px;max-width:42ch">${esc(ep.blurb)}</p>
    </section>
    ${ep.chapters.map((ch, i) => {
      const open = nodeOpen(ch.nodes[0]), done = chapterCleared(ch);
      const battles = ch.nodes.filter(n => n.waves), stars = battles.reduce((a, n) => a + nodeStars(n.id), 0);
      return `<button class="tile wide" data-act="chapter" data-c="${ch.id}" ${open ? "" : "disabled"} style="min-height:88px;background:linear-gradient(120deg,${mapTheme(ch.map).a},var(--hull2) 70%)">
        <span class="ticon" style="width:auto;height:auto;font:800 40px var(--f-display);opacity:.25;top:2px">${i + 1}</span>
        <div class="eyebrow">${esc(ch.season)} · Chapter ${ch.no}${done ? " · Cleared" : ""}</div><h3>${esc(ch.title)}</h3>
        <span class="tsub">${open ? `${stars}/${battles.length * 3} stars` : "Clear the previous chapter to unlock"}</span></button>`;
    }).join("")}
  </div>`;
};
function mapTheme(m) {
  return { bba: { a: "#16245a", b: "#080c1c", c: "#ff7a1a" }, dojo: { a: "#4a2a2a", b: "#140808", c: "#f3a65a" }, street: { a: "#1a3a6a", b: "#081428", c: "#5fd4ff" },
    river: { a: "#3a2a5a", b: "#100a1c", c: "#ffd9a8" }, china: { a: "#2a3a3a", b: "#0a1010", c: "#e8c46a" }, usa: { a: "#1a1e5a", b: "#06081c", c: "#ff3b3b" },
    europe: { a: "#3a2a4a", b: "#100a16", c: "#c39bff" }, russia: { a: "#2a3a5a", b: "#0a1020", c: "#cfe8ff" }, ruins: { a: "#4a2a10", b: "#1a0c06", c: "#f3c27a" },
    lab: { a: "#0e2a3a", b: "#040c12", c: "#5fd4ff" }, bega: { a: "#3a1060", b: "#10041c", c: "#d84aff" } }[m] || { a: "#16245a", b: "#080c1c", c: "#5fd4ff" };
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
    deco += ["street", "bba", "usa", "bega", "lab"].includes(ch.map) ? `<rect x="${x}" y="${y}" width="${r}" height="${r * (1 + rng())}" fill="${th.c}" opacity="${.04 + rng() * .06}"/>`
      : ["russia", "river", "dojo"].includes(ch.map) ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${ch.map === "russia" ? "#ffffff" : th.c}" opacity="${.03 + rng() * .05}"/>`
      : `<path d="M${x} ${y} l${r} ${-r * 1.4} l${r} ${r * 1.4}z" fill="${th.c}" opacity="${.04 + rng() * .06}"/>`;
  }
  const sideLines = ch.nodes.map((n, i) => n.type === "side" ? `<path d="M${pos[i - 1].x * 4} ${pos[i - 1].y} L${pos[i].x * 4} ${pos[i].y}" stroke="${th.c}" stroke-width="2" stroke-dasharray="4 6" opacity=".5" fill="none"/>` : "").join("");
  const icon = t => t === "boss" ? IC.skull : t === "story" ? IC.book : t === "chest" ? IC.chest : IC.sword;
  const nx = nextNode();
  return `<div class="stack">
    <div class="spread">${back("go", "Story", 'data-v="story"')}<span class="eyebrow">${esc(ch.season)} · Chapter ${ch.no}</span></div>
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
    <p class="tiny dim">Chapter reward: ${ch.reward.op ? esc(opLabel(OPS[ch.reward.op])) + " joins your team, plus " : ""}${ch.reward.orundum} BeyPoints${ch.reward.permit ? ` and ${ch.reward.permit} Booster Tickets` : ""}.</p>
  </div>`;
};
function nodeSheet(nd) {
  const st = nodeStars(nd.id), cost = nodeCost(nd), lv = nd.lv;
  const foes = nd.waves ? nodeFoes(nd) : null;
  const goal = nodeTimeGoal(nd);
  openModal(`<div class="stack">
    <div class="spread"><div><div class="eyebrow">${nd.id} · ${{ story: "Story", battle: "Battle", side: "Side Story", chest: "Supplies", boss: "Big Match" }[nd.type]}</div><h2 style="margin-top:4px">${esc(nd.name)}</h2></div>
      ${nd.waves ? `<div class="nstars">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</div>` : ""}</div>
    ${foes ? `<div><div class="tiny dim" style="margin-bottom:4px">Rival team · one-on-one tag battle</div><div class="row wrap">${foes.map(s => enHTML(s, s.en && ENEMY[s.en].boss ? 56 : 46)).join("")}</div></div>` : ""}
    ${nd.waves ? `<div class="stack" style="gap:4px"><div class="tiny dim">Star conditions</div>
      ${["Win the battle", "No Beyblade knocked out", `Win within ${goal} seconds`].map((m, k) => `<div class="mission">${k < st ? IC.star : IC.starOff}<span>${m}</span></div>`).join("")}</div>
      <div><div class="tiny dim" style="margin-bottom:4px">${st ? "Regular prizes" : "First clear"}${st < 3 ? " · first 3-star clear adds 1 Sports Drink" : ""}</div><div class="rewards" style="justify-content:flex-start">${rewardsHTML(st ? [{ k: "lmd", n: 80 + lv * 15 }, { k: lv < 20 ? "rec1" : lv < 40 ? "rec2" : "rec3", n: 2 }, { k: "summ", n: 1 }] : [{ k: "orundum", n: nd.type === "boss" ? 150 : nd.type === "side" ? 100 : 60 }, { k: "lmd", n: 80 + lv * 15 }, { k: lv < 20 ? "rec1" : lv < 40 ? "rec2" : "rec3", n: 3 }])}</div></div>` : ""}
    ${nd.type === "chest" ? `<div class="rewards" style="justify-content:flex-start">${rewardsHTML(Object.entries(nd.reward).map(([k, n]) => ({ k, n })))}</div>` : ""}
    <div class="row">
      ${nd.waves && st >= 3 ? `<button class="btn ghost" data-act="sweep" data-id="${nd.id}" data-x="1">Quick Clear</button><button class="btn ghost" data-act="sweep" data-id="${nd.id}" data-x="3">×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="startNode" data-id="${nd.id}" ${nd.type === "chest" && st ? "disabled" : ""}>${nd.type === "story" ? (st ? "Replay story" : "Read story") : nd.type === "chest" ? (st ? "Collected" : "Collect") : `Battle <span class="cost">${IC.sanity}${cost}</span>`}</button>
    </div>
    ${nd.waves && st < 3 ? '<p class="tiny dim">Clear with 3 stars to unlock Quick Clear.</p>' : ""}
  </div>`);
}

// ---------- team select ----------
SCREENS.team = arg => {
  const key = arg.mode;
  if (!UI.team || UI.team.key !== key) UI.team = { key, ids: (S.team[key] || []).filter(owned).slice(0, TEAM_SIZE) };
  const ids = UI.team.ids;
  const pool = Object.keys(S.ops).filter(k => UI.el === "all" || OPS[k].el === UI.el).sort((a, b) => power(b, S.ops[b]) - power(a, S.ops[a]));
  const lead = ids[0] && OPS[ids[0]].leader;
  const myPw = ids.reduce((a, k) => a + power(k, S.ops[k]), 0);
  const foeEls = [...new Set((arg.foes || []).map(s => s.op ? OPS[s.op].el : ENEMY[s.en].el))];
  const counter = foeEls.map(e => Object.keys(BEATS).find(k => BEATS[k] === e)).filter(Boolean);
  return `<div class="stack">
    <div class="spread">${back("teamBack", "Back")}<div class="eyebrow">${esc(arg.title || "")}</div></div>
    <h2>Team</h2>
    ${foeEls.length ? `<div class="small">Rival types: ${foeEls.map(elChip).join(" ")} ${counter.length ? `<span class="dim">· Strong picks:</span> ${[...new Set(counter)].map(elChip).join(" ")}` : ""}</div>` : ""}
    <div class="squad">${[...Array(TEAM_SIZE).keys()].map(k => {
      const id = ids[k];
      return `<div class="slot">${k === 0 ? `<span class="crown">${IC.crown}</span>` : ""}${id ? `<button data-act="slot" data-k="${k}" aria-label="${esc(OPS[id].n)}">${opHTML(id, { s: 66 })}</button>` : '<div class="empty"></div>'}</div>`;
    }).join("")}</div>
    <div class="leadtxt small">${lead ? `<b class="gold">Captain · ${esc(opLabel(OPS[ids[0]]))}</b> <span class="dim">${leaderText(lead)}</span>` : ids[0] ? `<span class="dim">${esc(OPS[ids[0]].n)} has no Captain skill. The first slot is the team captain.</span>` : `<span class="dim">Pick up to three Beyblades. The first slot is the captain: it launches first and leads with its Captain skill. The other two wait on the bench to tag in.</span>`}</div>
    <div class="spread small"><span>Team power <b class="num">${fmtFull(myPw)}</b></span>${arg.cost ? `<span class="cost">${IC.sanity}${arg.cost}</span>` : ""}</div>
    <button class="btn wide" data-act="deploy" ${ids.length ? "" : "disabled"}>Let it rip!</button>
    <div class="filters">${["all", ...ELS].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}">${e === "all" ? "All types" : e}</button>`).join("")}</div>
    <div class="roster">${pool.map(k => `<button class="rcell ${ids.includes(k) ? "sel" : ""}" data-act="pickTeam" data-k="${k}">${opHTML(k)}${pnameHTML(k)}<div class="pw">${fmt(power(k, S.ops[k]))}</div></button>`).join("")}</div>
  </div>`;
};
function leaderText(l) {
  if (!l) return "—";
  const sym = { ATK: "ATK", HP: "Spin", DEF: "DEF", SPD: "SPD", CR: "Crit Rate", CD: "Crit Damage", ACC: "Accuracy", RES: "Resistance" }[l.stat] || l.stat;
  return `${sym} +${Math.round(l.amount * 100)}% for ${l.scope === "All" ? "the whole team" : l.scope === "Team" ? l.team + " allies" : l.element + "-type allies"}`;
}

// ---------- dialogue ----------
// Layered silhouette backdrop per environment (skyline, ruins, peaks), seeded so a scene always looks the same.
function sceneSVG(env) {
  // Layered night backdrops for dialogue: skylines, spires, trees or the red moon, seeded per location
  const th = mapTheme(env), rng = seeded(hash(env + "scene"));
  const sky = { bba: ["#03050d", "#0c1430", "#1e2c5a"], dojo: ["#1a1438", "#a8486a", "#f3a65a"], street: ["#2a6ad8", "#7ab8f2", "#d8f0ff"], river: ["#3a2a6a", "#e88a6a", "#ffd9a8"],
    china: ["#3a4a5a", "#9ab0b8", "#e8eee8"], usa: ["#02040e", "#0a1640", "#1a2a70"], europe: ["#2a3a5a", "#7a96b8", "#d8e4ee"], russia: ["#0a0e1a", "#2a3a5a", "#7a90b0"],
    ruins: ["#2a1608", "#a8582a", "#f3c27a"], lab: ["#020308", "#07101f", "#10233a"], bega: ["#05020d", "#1a0a36", "#3a1060"] }[env] || ["#03050d", "#0c1430", "#1e2c5a"];
  const style = { dojo: "tree", river: "tree", china: "peak", europe: "spire", russia: "spire", ruins: "jag" }[env] || "rect";
  const moon = { bba: [300, 150, 22, "#9fd0ff"], dojo: [110, 470, 40, "#ffd08a"], street: [300, 140, 26, "#fffbe8"], river: [110, 470, 40, "#ffe2b0"], china: [300, 160, 26, "#fffbe8"],
    usa: [300, 150, 22, "#ffe7a0"], europe: [100, 150, 24, "#fffbe8"], russia: [290, 150, 24, "#eef2ff"], ruins: [200, 430, 50, "#fff3c4"], lab: [320, 200, 16, "#5fd4ff"],
    bega: [200, 200, 40, "#d89cff"] }[env] || [300, 160, 30, "#f4ecd8"];
  const layer = (base, h0, h1, col, lit) => {
    let x = -10, out = "";
    while (x < 410) {
      const w = 16 + rng() * 42, h = h0 + rng() * (h1 - h0);
      if (style === "peak") { const pk = x + w * (.3 + rng() * .4); out += `<polygon points="${x - 30},${base} ${pk},${base - h * 1.2} ${x + w + 30},${base}" fill="${col}"/>`; }
      else if (style === "tree") { out += `<rect x="${x + w * .45}" y="${base - h * .5}" width="${w * .12}" height="${h}" fill="${col}"/><circle cx="${x + w / 2}" cy="${base - h * .55}" r="${w * .55}" fill="${col}"/><circle cx="${x + w * .25}" cy="${base - h * .35}" r="${w * .4}" fill="${col}"/>`; }
      else if (style === "spire") out += `<rect x="${x}" y="${base - h}" width="${w}" height="${h + 300}" fill="${col}"/><polygon points="${x - 2},${base - h} ${x + w / 2},${base - h - w * 1.1} ${x + w + 2},${base - h}" fill="${col}"/>`;
      else if (style === "jag") out += `<polygon points="${x},${base + 300} ${x},${base - h} ${x + w * .3},${base - h + 8 + rng() * 22} ${x + w * .55},${base - h - 6} ${x + w * .8},${base - h + 14 + rng() * 26} ${x + w},${base - h + rng() * 30} ${x + w},${base + 300}" fill="${col}"/>`;
      else out += `<rect x="${x}" y="${base - h}" width="${w}" height="${h + 300}" fill="${col}"/>`;
      if (lit && style !== "tree") for (let k = 0; k < 6; k++) if (rng() < .5) out += `<rect x="${x + 3 + rng() * (w - 8)}" y="${base - h + 6 + rng() * (h - 12)}" width="2.5" height="3.5" fill="${lit}" opacity="${.35 + rng() * .5}"/>`;
      x += w + (style === "tree" ? -4 : rng() * 6);
    }
    return out;
  };
  let fx = "";
  for (let k = 0; k < 44; k++) fx += env === "russia" ? `<circle cx="${rng() * 400}" cy="${rng() * 760}" r="${.8 + rng() * 1.8}" fill="#ffffff" opacity="${.35 + rng() * .5}"/>`
    : env === "bega" || env === "usa" || env === "bba" ? `<circle cx="${rng() * 400}" cy="${560 + rng() * 200}" r="${1 + rng() * 2}" fill="${pick(["#ff5a4a", "#4aa8ff", "#f2c14e", "#ffffff", "#d84aff"])}" opacity="${.35 + rng() * .5}"/>`
    : ["street", "china", "europe", "ruins", "river", "dojo"].includes(env) ? "" : (k < 34 ? `<circle cx="${rng() * 400}" cy="${rng() * 420}" r="${rng() * 1.2 + .3}" fill="#fff" opacity="${.2 + rng() * .6}"/>` : "");
  const lit = ["street", "bba", "usa", "bega"].includes(env) ? "#ffd78a" : env === "lab" ? "#5fd4ff" : null;
  return `<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".55" stop-color="${sky[1]}"/><stop offset=".8" stop-color="${sky[2]}"/></linearGradient>
    <radialGradient id="gl" cx=".5" cy=".7" r=".5"><stop offset="0" stop-color="${th.c}" stop-opacity=".3"/><stop offset="1" stop-color="${th.c}" stop-opacity="0"/></radialGradient>
    <radialGradient id="mg"><stop offset=".55" stop-color="${moon[3]}" stop-opacity=".9"/><stop offset="1" stop-color="${moon[3]}" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="800" fill="url(#sk)"/>
    <circle cx="${moon[0]}" cy="${moon[1]}" r="${moon[2] * 1.9}" fill="url(#mg)" opacity=".5"/><circle cx="${moon[0]}" cy="${moon[1]}" r="${moon[2]}" fill="${moon[3]}" opacity=".92"/>
    <rect width="400" height="800" fill="url(#gl)"/>
    <g opacity=".55">${layer(560, 120, 320, th.b, lit)}</g>
    <g>${layer(610, 60, 200, "#05040a", lit)}</g>
    <rect y="600" width="400" height="200" fill="#05040a"/>${fx}
    <rect width="400" height="800" fill="url(#gl)" opacity=".4"/></svg>`;
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
      const art = sp.op ? opArt(sp.op).blader : sp.en ? enemyArt(sp.en).blader : sp.fig ? bladerArt("spk:" + ln.s, sp.fig) : null;
      if (art) {
        const isRight = !!sp.en || !!sp.right, img = isRight ? Rr : L;
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
