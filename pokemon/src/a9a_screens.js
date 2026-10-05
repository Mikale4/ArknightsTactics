
// =====================================================================
//  SCREENS (1/2): shell, home, journey map, stage sheet, team select, dialogue
// =====================================================================
const UI = { view: "home", arg: null, el: "all", cls: "all", sort: "cp", all: false, opTab: "info", team: null, depotTab: "items", shopTab: "mart", hhStd: false, dexF: "all" };

function toast(msg, cls = "") { const t = document.createElement("div"); t.className = "toast " + cls; t.textContent = msg; $("#toast").appendChild(t); setTimeout(() => t.remove(), 2600); }
function openModal(html) { const m = $("#modal"); m.innerHTML = `<div class="mbox" role="dialog">${html}</div>`; m.hidden = false; m.onclick = e => { if (e.target === m) closeModal(); }; }
function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }
const starRow = (n, max = 5) => { let s = ""; for (let k = 1; k <= max; k++) s += k <= n ? IC.star : ""; return `<div class="rstars">${s}</div>`; };
// a Pokémon portrait: sprite on a type-tinted disc, with level and IV badges
function opHTML(key, o = {}) {
  const op = OPS[key], p = o.prog !== undefined ? o.prog : S.ops[key];
  const own = !!p;
  return `<div class="pt ${own || o.show ? "" : "locked"}" style="--s:${o.s || 72}px;--gc:${TC[op.types[0]]};--gc2:${TC[op.types[1] || op.types[0]]}">
    ${o.nostars ? "" : starRow(op.rar)}
    <div class="ring"><img class="px" src="${sprFront(key)}" alt="${esc(op.n)}" loading="lazy" draggable="false"></div>
    ${p && !o.nolv ? `<div class="lv num">${p.lvl}</div>${p.pot > 1 && !o.noiv ? `<span class="potb">IV${p.pot}</span>` : ""}${p.held ? `<span class="heldb">${heldIcon(p.held)}</span>` : ""}` : ""}
  </div>`;
}
const pnameHTML = k => `<div class="pname">${esc(OPS[k].n)}<span class="sty">${OPS[k].types.map(t => `<i style="background:${TC[t]}"></i>`).join("")}</span></div>`;
const elChip = t => typeChip(t);
function enHTML(spec, s = 46) { return opHTML(spec.op, { s, prog: progForLV(spec.op, spec.LV || 1), nostars: 1, show: 1, noiv: 1 }); }
function itemIcon(k) { if (k === "sanity") return IC.sanity; if (HELD[k]) return heldIcon(k); return (ITEMS[k] && ITEMS[k].ic) || IC.boost; }
const itemName = k => k === "xp" ? "Exp. Points" : k === "rank" ? "Rank" : HELD[k] ? HELD[k].n : (ITEMS[k] && ITEMS[k].n) || k;
function rewardsHTML(list) {
  const merged = [];
  for (const r of list) { const m = merged.find(x => x.k === r.k && !r.k.startsWith("op:")); if (m) m.n += r.n; else merged.push({ ...r }); }
  return merged.map(r => {
    if (r.k.startsWith("op:")) { const k = r.k.slice(3); return `<div class="rw">${opHTML(k, { s: 54, nostars: 1, nolv: 1, show: 1 })}<span>${r.isNew === false ? "IVs up!" : "Caught!"}</span><span class="tiny dim">${esc(OPS[k].n)}</span></div>`; }
    if (r.k.startsWith("held:")) { const k = r.k.slice(5); return `<div class="rw"><div class="ri" style="width:54px;height:54px">${heldIcon(k)}</div><span class="num">×${r.n}</span><span class="tiny dim">${esc(HELD[k].n)}</span></div>`; }
    return `<div class="rw"><div class="ri" style="width:54px;height:54px">${r.k === "xp" ? IC.boost : r.k === "rank" ? IC.arena : itemIcon(r.k)}</div><span class="num">${r.k === "rank" ? "#" + r.n : "×" + fmt(r.n)}</span><span class="tiny dim">${esc(itemName(r.k))}</span></div>`;
  }).join("");
}
const back = (act, label, data = "") => `<button class="btn ghost sm" data-act="${act}" ${data}>${IC.back.replace("<svg", '<svg width="16" height="16"')}${label}</button>`;
const avatar = () => S.avatar === "leaf" ? "leaf" : "red";

// ---------- shell ----------
function renderTop() {
  tickTimers();
  const mx = maxSanity(S.lvl);
  $("#topbar").innerHTML = `
    <button class="me" data-act="settings" aria-label="Trainer Card">
      <div class="me-av"><img class="px" src="${trainerURL(avatar())}" alt=""></div>
      <div style="min-width:0;text-align:left"><div class="me-name">${esc(S.name)} <span class="num">Lv ${S.lvl}</span></div><div class="me-xp"><i style="width:${S.xp / pxpNeed(S.lvl) * 100}%"></i></div></div>
    </button>
    <div class="res">
      <button class="pill" data-act="sanity" aria-label="PP">${IC.sanity}<span id="sanPill">${S.sanity}<small>/${mx}</small></span></button>
      <div class="pill">${IC.lmd}<span>${fmt(S.lmd)}</span></div>
      <div class="pill">${IC.orundum}<span>${fmt(S.orundum)}</span></div>
    </div>`;
  const tabs = [["home", "Home", IC.home], ["story", "Journey", IC.story], ["battle", "Battle", IC.battles], ["ops", "Pokémon", IC.ops], ["hh", "Safari", IC.pokeball]];
  const on = { op: "ops", dex: "ops", team: UI.arg && UI.arg.from || "story", hunt: "battle", tower: "battle", arena: "battle", chapter: "story", shop: "home", depot: "home", inbox: "home", ach: "home", settings: "home" }[UI.view] || UI.view;
  $("#tabs").innerHTML = tabs.map(([v, n, ic]) => `<button class="${on === v ? "on" : ""}" data-act="go" data-v="${v}">${ic}<span>${n}</span>${badge(v) ? '<i class="dot"></i>' : ""}</button>`).join("");
}
function badge(v) {
  if (v === "home") return dailyReady() || unclaimedMail().length > 0;
  if (v === "story") return !!nextNode();
  if (v === "battle") return Date.now() - S.arena.payTime >= PAYOUT_MS;
  if (v === "ops") return Object.keys(S.ops).some(canEvolveNow);
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

// ---------- home ----------
const QUIPS = {
  pikachu: ["Pika pika!", "Pikachu!", "Pi-ka-chu!"], bulbasaur: ["Bulba!", "Bulbasaur!"], charmander: ["Char!", "Charmander!"], squirtle: ["Squirtle!", "Squirt!"],
  snorlax: ["(Snorlax is fast asleep.)", "(A huge yawn.)"], magikarp: ["(Splash! Splash!)"], psyduck: ["Psy...yai...yai?", "(Psyduck holds its head.)"],
  meowth: ["Meowth!", "(It's eyeing your Poké Dollars.)"], eevee: ["Vee!", "Eevee!"], jigglypuff: ["Jiggly... puff...", "(It starts singing. You feel sleepy.)"],
  _: ["(It looks happy to see you.)", "(It wants to battle!)", "(It nuzzles you.)", "(It looks at you expectantly.)"],
};
function nextHint() {
  const nd = nextNode();
  if (!S.starter) return { act: "openNode", data: `data-id="1-1"`, text: "Visit <b>Professor Oak's lab</b> and choose your first Pokémon." };
  if (S.inbox.some(m => m.tag === "welcome" && !m.claimed)) return { act: "inbox", text: "Your welcome gifts are in your <b>Mail</b>: a Safari Pass (×10) and a Master Ball." };
  if (S.inv.free10 > 0 || S.inv.gold5 > 0) return { act: "go", data: 'data-v="hh"', text: "Use your <b>Safari Pass</b> and <b>Master Ball</b> in the Safari Zone." };
  if (dailyReady()) return { act: "missions", text: "Daily Research rewards are ready to claim." };
  const evo = Object.keys(S.ops).find(canEvolveNow);
  if (evo) return { act: "go", data: `data-v="op" data-a="${evo}"`, text: `<b>${esc(OPS[evo].n)}</b> is ready to evolve!` };
  const um = unclaimedMail().length;
  if (um) return { act: "inbox", text: `You have <b>${um}</b> unclaimed gift${um > 1 ? "s" : ""} in your Mail.` };
  if (nd) return { act: "openNode", data: `data-id="${nd.id}"`, text: `Continue your journey: <b>${nd.id} ${esc(nd.name)}</b>.` };
  return { act: "go", data: 'data-v="battle"', text: "Climb the <b>Battle Tower</b> or find held items in <b>Explore</b>." };
}
const SCREENS = {};
SCREENS.home = () => {
  const ak = S.ops[S.assistant] ? S.assistant : Object.keys(S.ops)[0];
  const op = ak ? OPS[ak] : null, hint = nextHint(), nd = nextNode();
  const missionsReady = dailyReady(), mails = unclaimedMail().length, newAch = achDone() > (S.achSeen || 0);
  return `<div class="lobby">
    <section class="stage">
      <div class="sky"></div><div class="hill"></div><div class="floor"></div>
      ${op ? `<img class="assist px" src="${sprFull(ak)}" alt="${esc(op.n)}" data-act="poke" draggable="false">
      <img class="trainer px" src="${trainerURL(avatar())}" alt="">
      <div class="nameplate"><span class="eyebrow">Partner Pokémon</span><b>${esc(op.n)} <span class="small">Lv ${S.ops[ak].lvl}</span></b><div class="row" style="gap:4px">${typeChips(op.types)}</div></div>`
      : `<img class="trainer solo px" src="${trainerURL("oak")}" alt="Professor Oak"><div class="nameplate"><span class="eyebrow">Pallet Town</span><b>Prof. Oak is waiting</b></div>`}
      <div class="sidebtns left">
        <button class="sidebtn" data-act="inbox" aria-label="Mail">${IC.mail}<small>Mail</small>${mails ? `<i class="cnt num">${mails}</i>` : ""}</button>
        <button class="sidebtn" data-act="go" data-v="ach" aria-label="Medals">${IC.trophy}<small>Medals</small>${newAch ? '<i class="dot"></i>' : ""}</button>
        <button class="sidebtn" data-act="go" data-v="dex" aria-label="Pokédex">${IC.dex}<small>Pokédex</small></button>
      </div>
      <div class="sidebtns">
        <button class="sidebtn" data-act="missions" aria-label="Daily Research">${IC.missions}<small>Research</small>${missionsReady ? '<i class="dot"></i>' : ""}</button>
        <button class="sidebtn" data-act="go" data-v="shop" aria-label="Shops">${IC.shop}<small>Shops</small></button>
        <button class="sidebtn" data-act="go" data-v="depot" aria-label="Bag">${IC.depot}<small>Bag</small></button>
      </div>
    </section>
    ${hint ? `<button class="hint" data-act="${hint.act}" ${hint.data || ""}>${IC.pokeball.replace("<svg", '<svg width="22" height="22"')}<div><div class="eyebrow">Next</div><div class="small">${hint.text}</div></div></button>` : ""}
    <div class="badgecase">${BADGES.map((b, i) => `<span class="bdg ${i < S.badges ? "on" : ""}" title="${b.n}">${badgeSVG(i, i < S.badges)}</span>`).join("")}</div>
    <div class="tiles">
      <button class="tile ls-t" data-act="go" data-v="story"><span class="ticon" style="color:var(--red)">${IC.story}</span><h3>Journey</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "Kanto complete!"}</span></button>
      <button class="tile ds-t" data-act="go" data-v="battle"><span class="ticon" style="color:var(--blue)">${IC.battles}</span><h3>Battle</h3><span class="tsub">Explore · Tower · Link</span></button>
      <button class="tile" data-act="go" data-v="hh"><span class="ticon">${IC.safariball}</span><h3>Safari Zone</h3><span class="tsub">${S.permit} Safari Balls · ${fmt(S.orundum)} Gems</span></button>
      <button class="tile" data-act="go" data-v="dex"><span class="ticon" style="color:var(--red)">${IC.dex}</span><h3>Pokédex</h3><span class="tsub">Seen ${dexSeen()} · Caught ${dexCaught()} / 151</span></button>
    </div>
    <p class="tiny dim" style="text-align:center;padding:4px 8px">Unofficial, non-commercial fan game. Pokémon © Nintendo, Game Freak and Creatures. Sprites from Pokémon Showdown.</p>
  </div>`;
};

// ---------- journey ----------
SCREENS.story = () => {
  const ep = STORY[0];
  return `<div class="stack">
    <section class="panel ep-card">
      <div class="eyebrow">${esc(ep.sub)}</div><h1 style="margin-top:4px;font-size:28px">${esc(ep.title)}</h1>
      <p class="small dim" style="margin-top:6px;max-width:42ch">${esc(ep.blurb)}</p>
      <div class="badgecase sm">${BADGES.map((b, i) => `<span class="bdg ${i < S.badges ? "on" : ""}" title="${b.n}">${badgeSVG(i, i < S.badges)}</span>`).join("")}</div>
      <p class="tiny dim" style="margin-top:6px">Level cap: <b>Lv ${levelCap()}</b>${S.champion ? " (Champion)" : ` · next Badge raises it to Lv ${LV_CAPS[Math.min(8, S.badges + 1)]}`}</p>
    </section>
    ${ep.chapters.map((ch, i) => {
      const open = nodeOpen(ch.nodes[0]), done = chapterCleared(ch);
      const battles = ch.nodes.filter(n => n.waves || n.rivalWaves), stars = battles.reduce((a, n) => a + nodeStars(n.id), 0);
      const boss = ch.nodes.find(n => n.badgeWin != null || n.champion || n.catch === "mewtwo");
      return `<button class="tile wide chap" data-act="chapter" data-c="${ch.id}" ${open ? "" : "disabled"} style="--cc:${mapTheme(ch.map).a}">
        ${boss && boss.trainer ? `<img class="chtr px" src="${trainerURL(boss.trainer.spr)}" alt="">` : boss ? `<img class="chtr px" src="${sprFront(boss.catch)}" alt="">` : ""}
        <div class="eyebrow">Chapter ${ch.no}${done ? " · Cleared" : ""}</div><h3>${esc(ch.title)}</h3>
        <span class="tsub">${open ? `${stars}/${battles.length * 3} stars${boss && boss.badgeWin != null ? " · " + BADGES[boss.badgeWin].n : ""}` : "Clear the previous chapter to unlock"}</span></button>`;
    }).join("")}
  </div>`;
};
function mapTheme(m) {
  return { route: { a: "#7ac25a", b: "#2f6a2a", c: "#fff" }, forest: { a: "#3f8a4a", b: "#173a1e", c: "#d8f2a8" }, cave: { a: "#8a7a6a", b: "#2a221c", c: "#f2d8a8" },
    city: { a: "#7aa8e0", b: "#2a4a7a", c: "#fff" }, sea: { a: "#4a9ae0", b: "#1a4a8a", c: "#e8f6ff" }, tower: { a: "#8a5ab8", b: "#2a1a4a", c: "#e8d8ff" },
    plateau: { a: "#c8a03a", b: "#3a2a5a", c: "#fff2c8" }, volcano: { a: "#e0703a", b: "#5a1a0a", c: "#ffe0b0" }, ice: { a: "#8ac8f2", b: "#2a5a8a", c: "#fff" } }[m] || { a: "#7ac25a", b: "#2f6a2a", c: "#fff" };
}
SCREENS.chapter = cid => {
  const ch = STORY[0].chapters.find(c => c.id === cid), th = mapTheme(ch.map);
  const XS = [50, 24, 70, 32, 74, 28, 60];
  let mainI = 0;
  const pos = ch.nodes.map(nd => { if (nd.type === "side") return null; const p = { x: XS[mainI % XS.length], y: 80 + mainI * 112 }; mainI++; return p; });
  ch.nodes.forEach((nd, i) => { if (!pos[i]) { const pr = pos[i - 1] || { x: 50, y: 80 }; pos[i] = { x: pr.x < 50 ? Math.max(11, pr.x - 18) : Math.min(89, pr.x + 18), y: pr.y + 50, side: true }; } });
  const H = 80 + mainI * 112 + 40, rng = seeded(hash(cid + "map"));
  const main = ch.nodes.map((n, i) => [n, pos[i]]).filter(([n]) => n.type !== "side");
  let d = "";
  main.forEach(([, p], i) => { const x = p.x * 4, y = p.y; if (!i) d = `M${x} ${y}`; else { const q = main[i - 1][1]; d += ` C${q.x * 4} ${(q.y + y) / 2} ${x} ${(q.y + y) / 2} ${x} ${y}`; } });
  let deco = "";
  for (let k = 0; k < 26; k++) {
    const x = rng() * 400, y = rng() * H, r = 6 + rng() * 22;
    deco += ["route", "forest"].includes(ch.map) ? `<path d="M${x} ${y} l${r * .5} ${-r} l${r * .5} ${r}z" fill="#ffffff" opacity="${.06 + rng() * .08}"/>`
      : ch.map === "sea" || ch.map === "ice" ? `<path d="M${x} ${y} q${r / 2} ${-r / 3} ${r} 0 t${r} 0" stroke="#fff" fill="none" opacity="${.12 + rng() * .1}"/>`
      : `<circle cx="${x}" cy="${y}" r="${r / 2}" fill="${th.c}" opacity="${.05 + rng() * .06}"/>`;
  }
  const sideLines = ch.nodes.map((n, i) => n.type === "side" ? `<path d="M${pos[i - 1].x * 4} ${pos[i - 1].y} L${pos[i].x * 4} ${pos[i].y}" stroke="${th.c}" stroke-width="2" stroke-dasharray="4 6" opacity=".6" fill="none"/>` : "").join("");
  const icon = nd => nd.trainer && (nd.type === "boss" || nd.badgeWin != null) ? `<img class="px" src="${trainerURL(nd.trainer.spr)}" alt="">` : nd.catch && (nd.type === "side" || nd.type === "boss") ? `<img class="px" src="${sprFront(nd.catch)}" alt="">`
    : nd.type === "story" ? IC.book : nd.type === "chest" ? IC.chest : nd.wild ? IC.pokeball : IC.battles;
  const nx = nextNode();
  return `<div class="stack">
    <div class="spread">${back("go", "Journey", 'data-v="story"')}<span class="eyebrow">Chapter ${ch.no}</span></div>
    <h2>${esc(ch.title)}</h2>
    <div class="mapwrap" style="background:linear-gradient(180deg,${th.a},${th.b})">
      <svg class="map" viewBox="0 0 400 ${H}" preserveAspectRatio="none" style="height:${H}px">${deco}
        <path d="${d}" stroke="#000" stroke-width="12" fill="none" opacity=".25"/><path d="${d}" stroke="#f4ecd0" stroke-width="7" fill="none" opacity=".9"/><path d="${d}" stroke="#c8b888" stroke-width="2" stroke-dasharray="6 8" fill="none"/>${sideLines}</svg>
      ${ch.nodes.map((nd, i) => {
        const open = nodeOpen(nd), st = nodeStars(nd.id), done = st > 0;
        return `<button class="mnode ${nd.type} ${open ? "" : "locked"} ${done ? "done" : ""} ${nx === nd ? "next" : ""}" style="left:${pos[i].x}%;top:${pos[i].y}px" data-act="openNode" data-id="${nd.id}" aria-label="${nd.id} ${esc(nd.name)}">
          <span class="disc">${open ? icon(nd) : IC.lock}</span><span class="lbl">${nd.id}${nd.type === "side" ? " · Side" : ""}</span>
          ${nd.waves || nd.rivalWaves ? `<span class="nst">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</span>` : ""}</button>`;
      }).join("")}
    </div>
    <p class="tiny dim">Chapter reward: ${rewardText(ch.reward)}.</p>
  </div>`;
};
const rewardText = rw => Object.entries(rw).map(([k, n]) => k === "op" ? OPS[n].n + " joins your team" : `${fmt(n)} ${itemName(k)}`).join(", ");
function nodeSheet(nd) {
  const st = nodeStars(nd.id), cost = nodeCost(nd);
  const waves = nd.waves || nd.rivalWaves ? (S.starter || !nd.rivalWaves ? nodeWaves(nd) : null) : null;
  const goal = nodeTurnGoal(nd);
  openModal(`<div class="stack">
    <div class="spread"><div><div class="eyebrow">${nd.id} · ${{ story: "Story", battle: nd.wild ? "Wild Pokémon" : "Trainer Battle", side: "Side Stage", chest: "Event", boss: nd.wild ? "Boss Pokémon" : "Gym & League" }[nd.type]}</div><h2 style="margin-top:4px">${esc(nd.name)}</h2></div>
      ${nd.waves || nd.rivalWaves ? `<div class="nstars">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</div>` : ""}</div>
    ${nd.trainer ? `<div class="row" style="gap:10px"><img class="px" src="${trainerURL(nd.trainer.spr)}" alt="" style="width:64px;height:64px;object-fit:contain"><div class="small"><b>${esc(nd.trainer.name)}</b>${nd.trainer.intro ? `<div class="dim">“${esc(nd.trainer.intro)}”</div>` : ""}</div></div>` : ""}
    ${nd.weather ? `<div class="hint small" style="cursor:default">${WEATHER[nd.weather].ic} <span><b>${WEATHER[nd.weather].n}.</b> ${{ sun: "Fire moves +50%, Water moves −50%.", rain: "Water moves +50%, Fire moves −50%.", sand: "Pokémon that aren't Rock or Ground types lose 1/16 HP every turn.", hail: "Pokémon that aren't Ice types lose 1/16 HP every turn." }[nd.weather]}</span></div>` : ""}
    ${waves ? waves.map((w, k) => `<div><div class="tiny dim" style="margin-bottom:4px">${waves.length > 1 ? `${nd.wild ? "Wave" : "Round"} ${k + 1} of ${waves.length}` : nd.wild ? "Wild Pokémon" : "Opponent's team"}</div><div class="row wrap">${w.map(s => enHTML(s, s.boss ? 56 : 46)).join("")}</div></div>`).join("") : ""}
    ${waves ? `<div class="small dim">Types: ${[...new Set(waves.flat().flatMap(s => OPS[s.op].types))].map(typeChip).join(" ")}</div>` : ""}
    ${nd.catch && !S.dex.caught[nd.catch] ? `<div class="hint small" style="cursor:default">${IC.pokeball.replace("<svg", '<svg width="20" height="20"')}<span>First clear: catch <b>${esc(OPS[nd.catch].n)}</b>!</span></div>` : ""}
    ${nd.gift && !st ? `<div class="hint small" style="cursor:default">${IC.gift.replace("<svg", '<svg width="20" height="20"')}<span>First clear: receive <b>${esc(OPS[nd.gift].n)}</b>.</span></div>` : ""}
    ${nd.badgeWin != null && S.badges <= nd.badgeWin ? `<div class="hint small" style="cursor:default">${badgeSVG(nd.badgeWin).replace("<svg", '<svg width="22" height="22"')}<span>Win to earn the <b>${BADGES[nd.badgeWin].n}</b>: level cap Lv ${LV_CAPS[nd.badgeWin + 1]}, and +5% ${BADGES[nd.badgeWin].sn} for your Pokémon.</span></div>` : ""}
    ${waves ? `<div class="stack" style="gap:4px"><div class="tiny dim">Star goals</div>
      ${["Win the battle", "None of your Pokémon faint", `Win within ${goal} of your turns`].map((m, k) => `<div class="mission">${k < st ? IC.star : IC.starOff}<span>${m}</span></div>`).join("")}</div>
      <div><div class="tiny dim" style="margin-bottom:4px">${st ? "Rewards" : "First clear"}${st < 3 ? " · first 3-star clear adds a Max Elixir" : ""}</div><div class="rewards" style="justify-content:flex-start">${rewardsHTML(Object.entries(nodeDrops(nd, !st)).map(([k, n]) => ({ k, n })))}</div></div>` : ""}
    ${nd.type === "chest" ? `<div class="rewards" style="justify-content:flex-start">${rewardsHTML(Object.entries(nd.reward).map(([k, n]) => k === "op" ? { k: "op:" + n, n: 1 } : { k, n }))}</div>` : ""}
    <div class="row">
      ${waves && st >= 3 ? `<button class="btn ghost" data-act="sweep" data-id="${nd.id}" data-x="1">Quick Battle</button><button class="btn ghost" data-act="sweep" data-id="${nd.id}" data-x="3">×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="startNode" data-id="${nd.id}" ${nd.type === "chest" && st ? "disabled" : ""}>${nd.type === "story" ? (st ? "Replay" : "Start") : nd.type === "chest" ? (st ? "Done" : "Go") : `Battle! <span class="cost">${IC.sanity}${cost}</span>`}</button>
    </div>
    ${waves && st < 3 ? '<p class="tiny dim">Get 3 stars to unlock Quick Battle.</p>' : ""}
  </div>`);
}

// ---------- team select ----------
SCREENS.team = arg => {
  const key = arg.mode;
  if (!UI.team || UI.team.key !== key) UI.team = { key, ids: (S.team[key] || []).filter(owned).slice(0, 4) };
  const ids = UI.team.ids;
  const pool = Object.keys(S.ops).filter(k => UI.el === "all" || OPS[k].types.includes(UI.el)).sort((a, b) => power(b, S.ops[b]) - power(a, S.ops[a]));
  const myPw = ids.reduce((a, k) => a + power(k, S.ops[k]), 0);
  const foeTypes = [...new Set((arg.foes || []).flatMap(s => OPS[s.op].types))];
  const strong = TYPES.filter(t => (arg.foes || []).some(s => typeEff(t, OPS[s.op].types) > 1));
  return `<div class="stack">
    <div class="spread">${back("teamBack", "Back")}<div class="eyebrow">${esc(arg.title || "")}</div></div>
    <h2>Choose your team</h2>
    ${foeTypes.length ? `<div class="small">Opponents: ${foeTypes.map(typeChip).join(" ")}</div><div class="small"><span class="dim">Super effective:</span> ${strong.map(typeChip).join(" ") || "—"}</div>` : ""}
    <div class="squad">${[0, 1, 2, 3].map(k => {
      const id = ids[k];
      return `<div class="slot">${id ? `<button data-act="slot" data-k="${k}" aria-label="${esc(OPS[id].n)}">${opHTML(id, { s: 66 })}</button>` : '<div class="empty"></div>'}</div>`;
    }).join("")}</div>
    <div class="spread small"><span>Team CP <b class="num">${fmtFull(myPw)}</b> · Lv cap ${levelCap()}</span>${arg.cost ? `<span class="cost">${IC.sanity}${arg.cost}</span>` : ""}</div>
    <button class="btn wide" data-act="deploy" ${ids.length ? "" : "disabled"}>Battle!</button>
    <div class="filters">${["all", ...TYPES].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}" ${e !== "all" ? `style="--tc:${TC[e]}"` : ""}>${e === "all" ? "All types" : e}</button>`).join("")}</div>
    <div class="roster">${pool.map(k => {
      const se = (arg.foes || []).some(s => OPS[k].skills.some(sk => sk.cat !== "X" && typeEff(sk.type, OPS[s.op].types) > 1));
      return `<button class="rcell ${ids.includes(k) ? "sel" : ""} ${se ? "adv" : ""}" data-act="pickTeam" data-k="${k}">${opHTML(k)}${pnameHTML(k)}<div class="pw">CP ${fmt(power(k, S.ops[k]))}</div></button>`;
    }).join("")}</div>
    <p class="tiny dim">A glowing frame means that Pokémon has a move that is super effective against this opponent.</p>
  </div>`;
};

// ---------- dialogue ----------
function sceneSVG(env) {
  const th = mapTheme(env), rng = seeded(hash(env + "scene"));
  const day = !["cave", "tower", "plateau", "volcano"].includes(env);
  const sky = { route: ["#4a8ad8", "#8ec4f2", "#dff2ff"], forest: ["#1e4a2a", "#4a8a4a", "#a8d88a"], city: ["#5a9ae0", "#a8d0f2", "#f2f8ff"], sea: ["#3a7ad8", "#7ab8f2", "#d8f0ff"],
    cave: ["#0c0a10", "#2a2430", "#4a3e48"], tower: ["#140a24", "#3a1a52", "#7a4a8a"], plateau: ["#0a0614", "#2a1a4a", "#6a3a8a"], volcano: ["#2a0a06", "#7a2a10", "#e07a3a"],
    ice: ["#3a5a80", "#8ab0d8", "#e8f4ff"], lab: ["#3a4a5a", "#7a90a8", "#d8e2ec"], gym: ["#202838", "#384a68", "#6a7ea0"], plant: ["#1a1e2a", "#3a4258", "#8a92a8"] }[env] || ["#4a8ad8", "#8ec4f2", "#dff2ff"];
  let hills = "";
  for (let k = 0; k < 7; k++) { const x = rng() * 400, r = 80 + rng() * 120; hills += `<ellipse cx="${x}" cy="${620 + rng() * 40}" rx="${r}" ry="${r * .45}" fill="${shade(th.a, -.1 - rng() * .2)}"/>`; }
  let trees = "";
  if (env === "route" || env === "forest") for (let k = 0; k < 14; k++) { const x = rng() * 420 - 10, h = 50 + rng() * 60; trees += `<rect x="${x - 4}" y="${640 - h * .3}" width="8" height="${h * .3}" fill="#5a3a1e"/><circle cx="${x}" cy="${640 - h * .5}" r="${h * .32}" fill="${shade("#3f8a3a", -rng() * .3)}"/>`; }
  let fx = "";
  if (!day) for (let k = 0; k < 40; k++) fx += `<circle cx="${rng() * 400}" cy="${rng() * 420}" r="${rng() * 1.3 + .3}" fill="#fff" opacity="${.2 + rng() * .6}"/>`;
  else for (let k = 0; k < 5; k++) { const x = rng() * 400, y = 80 + rng() * 200; fx += `<ellipse cx="${x}" cy="${y}" rx="${40 + rng() * 40}" ry="${10 + rng() * 8}" fill="#fff" opacity=".55"/>`; }
  return `<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset=".85" stop-color="${sky[2]}"/></linearGradient></defs>
    <rect width="400" height="800" fill="url(#sk)"/>${fx}${hills}${trees}
    <rect y="640" width="400" height="160" fill="${shade(th.a, -.25)}"/><rect y="640" width="400" height="6" fill="${shade(th.a, .15)}" opacity=".6"/></svg>`;
}
function playScene(lines, title, env) {
  return new Promise(resolve => {
    const root = $("#dlg"), th = mapTheme(env);
    root.innerHTML = `<div class="dwrap">
      <div class="dbg" style="background:${th.b}">${sceneSVG(env)}</div>
      <img class="dchar left px" id="dL" alt="" hidden><img class="dchar right px" id="dR" alt="" hidden>
      <div class="dtop"><span class="ttl">${esc(title || "")}</span><div class="row"><button class="tog" id="dAuto">AUTO</button><button class="tog" id="dSkip">SKIP</button></div></div>
      <div class="dbox" id="dBox"><div class="dname" id="dName" hidden></div><div class="dtext" id="dText"></div><div class="dnext" id="dNext" hidden>▼</div></div>
    </div>`;
    root.hidden = false;
    let i = -1, typing = 0, full = "", auto = false, timer = 0, autoT = 0;
    const Lf = $("#dL"), Rr = $("#dR"), side = {};
    const done = () => { clearInterval(timer); clearTimeout(autoT); root.hidden = true; root.innerHTML = ""; resolve(); };
    const showLine = () => {
      i++; if (i >= lines.length) return done();
      const ln = lines[i], sp = SPK[ln.s] || { n: ln.s };
      const nm = $("#dName"), name = ln.s === "me" ? S.name : sp.n; nm.hidden = !name; nm.textContent = name || "";
      $("#dBox").classList.toggle("dnarr", ln.s === "narr");
      const spr = sp.t === "me" ? avatar() : sp.t;
      if (spr) {
        const isRight = ln.s !== "me", img = isRight ? Rr : Lf;
        if (side[isRight ? "R" : "L"] !== ln.s) { img.classList.add("enter"); img.src = trainerURL(spr); img.hidden = false; side[isRight ? "R" : "L"] = ln.s; requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove("enter"))); }
        Lf.classList.toggle("dim", isRight); Rr.classList.toggle("dim", !isRight);
      } else { Lf.classList.add("dim"); Rr.classList.add("dim"); }
      full = ln.t.replace(/\{name\}/g, S.name); let n = 0; const tx = $("#dText"); tx.textContent = ""; $("#dNext").hidden = true;
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
