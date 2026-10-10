
// =====================================================================
//  SCREENS (1/2): shell, lobby, story map, node sheet, team, dialogue
// =====================================================================
const UI = { view: "home", arg: null, el: "all", sty: "all", cls: "all", sort: "power", all: false, opTab: "info", team: null, depotTab: "items", shopTab: "credit", hhStd: false };

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
// roster label: the fighter's name, then its style (in its colour) and version. Badges: letter and colour = style.
const pnameHTML = k => `<div class="pname">${esc(OPS[k].n)}<span class="sty"><b style="color:${ELC[OPS[k].el]}">${elShort(OPS[k].el)}</b> ${esc(OPS[k].ver)}</span></div>`;
const elChip = el => `<span class="el ${el}">${el}</span>`;
const beastChip = op => `<span class="el sty" style="--bc:${op.aura}">${esc(op.race)}</span>`;
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
    if (r.k.startsWith("op:")) { const k = r.k.slice(3); return `<div class="rw">${opHTML(k, { s: 54, nostars: 1, nolv: 1, show: 1 })}<span>${r.isNew === false ? "Limit Break +1" : "New fighter"}</span><span class="tiny dim">${esc(opLabel(OPS[k]))}</span></div>`; }
    const name = r.k === "xp" ? "Fighter EXP" : r.k === "rank" ? "Rank" : (ITEMS[r.k] && ITEMS[r.k].n) || r.k;
    return `<div class="rw"><div class="ri" style="width:54px;height:54px">${r.k === "xp" ? IC.boost : r.k === "rank" ? IC.arena : itemIcon(r.k)}</div><span class="num">${r.k === "rank" ? "#" + r.n : "×" + fmt(r.n)}</span><span class="tiny dim">${esc(name)}</span></div>`;
  }).join("");
}
const back = (act, label, data = "") => `<button class="btn ghost sm" data-act="${act}" ${data}>${IC.back.replace("<svg", '<svg width="16" height="16"')}${label}</button>`;

// ---------- shell ----------
function renderTop() {
  tickTimers();
  const mx = maxSanity(S.lvl);
  $("#topbar").innerHTML = `
    <button class="me" data-act="settings" aria-label="Scouter Card">
      <div class="me-badge num">${S.lvl}</div>
      <div style="min-width:0;text-align:left"><div class="me-name">${esc(S.name)}</div><div class="me-xp"><i style="width:${S.xp / pxpNeed(S.lvl) * 100}%"></i></div></div>
    </button>
    <div class="res">
      <button class="pill" data-act="sanity" aria-label="Stamina">${IC.sanity}<span id="sanPill">${S.sanity}<small>/${mx}</small></span></button>
      <div class="pill">${IC.lmd}<span>${fmt(S.lmd)}</span></div>
      <div class="pill">${IC.orundum}<span>${fmt(S.orundum)}</span></div>
    </div>`;
  const tabs = [["home", "Home", IC.home], ["story", "Story", IC.story], ["battle", "Battle", IC.battles], ["ops", "Fighters", IC.ops], ["hh", "Summon", IC.dball]];
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

// ---------- looks (the Scouter Card) ----------
// Two original martial artists to start with, then dress like one of the fighters: 15 in all.
const ROOKIE_LOOKS = {
  turtle: { n: "Turtle School", fig: F({ hair: "#3a2414", hs: "yamcha", ...TURTLE, kanji: "亀", eyec: "#5a3a2a" }) },
  crane: { n: "Crane School", fig: F({ hair: "#8a3a1a", hs: "long", top: "#2a8a5a", under: "#f2f2f6", sleeves: "short", pants: "#f2f2f6", belt: "#d8302a", boots: "#141418", wrist: "#d8302a", slim: 1, h: .95, eyec: "#3a8a5a", kanji: "鶴" }) },
};
const LOOK_BLADERS = ["goku", "gohan", "krillin", "piccolo", "tien", "yamcha", "chiaotzu", "yajirobe", "vegeta", "raditz", "nappa", "zarbon", "ginyu"];
const LOOKS = [...Object.keys(ROOKIE_LOOKS), ...LOOK_BLADERS];
const bladerOf = k => CHARS.find(b => b.k === k);
const lookName = k => ROOKIE_LOOKS[k] ? ROOKIE_LOOKS[k].n : bladerOf(k).short || bladerOf(k).n;
const lookFig = k => ROOKIE_LOOKS[k] ? ROOKIE_LOOKS[k].fig : OPS[k + "-" + bladerOf(k).vers[0].v].fig;
const myLook = () => LOOKS.includes(S.look) ? S.look : "turtle";
const LOOK_BG = ["#2a4a8a", "#122244", "#060c1a"];
const lookArt = k => figFull("look:" + k, lookFig(k)).url;
const lookHead = k => figHead("look:" + k, lookFig(k), LOOK_BG);
// a Scouter Rankings challenger: a martial artist built from a seed (hair, gi, colours)
function rivalFig(seed) {
  const r = seeded(seed), p = a => a[Math.floor(r() * a.length)];
  const COL = ["#d8302a", "#2f6fd8", "#3a9a4a", "#f2a62a", "#6a4ad8", "#2a2a30", "#f2f2f6", "#ff5aa8", "#2aa8a8", "#8a2a3a", "#f2d04e", "#ff8a1a"];
  const hs = p(["goku", "short", "yamcha", "bob", "long", "bald", "gohan", "jeice"]);
  const top = p(COL);
  const f = { skin: p(["#f3d6bf", "#e8c4a0", "#c8946a", "#8a5a3a", "#f6dcc8"]), hair: p(["#141418", "#3a2414", "#8a5a2a", "#f2d27a", "#a8302a", "#1e2a5a", "#5a5a6a", "#d87a2a"]),
    hs, top, under: p(COL), sleeves: p(["short", "none", "long"]), pants: p(COL), belt: p(COL), boots: p(["#141418", "#2f5fd8", "#8a4a2a", "#f2f2f6"]), wrist: r() < .5 ? p(COL) : null,
    eyec: p(["#5a3a2a", "#2f6fd8", "#3a8a5a", "#141418"]), h: .92 + r() * .16, bulk: .95 + r() * .25 };
  if (r() < .3) f.headband = p(COL);
  if (r() < .35) f.slim = 1;
  return F(f);
}
const rivalSeed = o => o.look || hash(o.name);
const rivalHead = o => figHead("rv:" + rivalSeed(o), rivalFig(rivalSeed(o)), LOOK_BG);

// ---------- lobby ----------
const QUIPS = {
  goku: ["Hey! Wanna spar? Just a little bit?", "I'm starving. Is it lunchtime yet?", "There's always someone stronger out there. That's what makes it fun!", "Chi-Chi's gonna kill me for skipping study time..."],
  gohan: ["Mr. Piccolo says I have to train every day.", "I want to be a scholar when I grow up. And strong, like Dad!", "My mom packed me extra food. Want some?"],
  krillin: ["Destructo Disc! ...Sorry, reflex.", "Why does everybody always want to fight the bald guy?", "Goku and I trained under Master Roshi together. Good times. Mostly."],
  piccolo: ["...", "Stop wasting time. Train.", "The kid has potential. Don't tell him I said that."],
  vegeta: ["I am the Prince of all Saiyans.", "Kakarot... I'll surpass you. Count on it.", "Don't speak to me unless it's a challenge."],
  tien: ["Discipline first. Power follows.", "Chiaotzu, stay close."], yamcha: ["Wolf Fang Fist! I'm getting the hang of this.", "The desert bandit is back, baby!"],
  frieza: ["Ohohoho. Do keep up.", "Kneel, monkey."], ginyu: ["Strike a pose!", "Ginyu Force, assemble!"], nappa: ["Vegeta, can I squash this one?"],
  _: ["Ready for a fight!", "Let's train!", "I can feel my power level rising.", "Let's find the Dragon Balls!"],
};
function nextHint() {
  const nd = nextNode();
  if (S.inbox.some(m => m.tag === "welcome" && !m.claimed)) return { act: "inbox", text: "Bulma's welcome gifts are in the <b>Mailbox</b>: ten free Summons and Shenron's Wish for a 5★ fighter." };
  if (S.inv.free10 > 0 || S.inv.gold5 > 0) return { act: "go", data: 'data-v="hh"', text: "Use your <b>free Summons</b> on the Summon screen." };
  if (dailyReady()) return { act: "missions", text: "Mission rewards are ready to claim." };
  const um = unclaimedMail().length;
  if (um) return { act: "inbox", text: `You have <b>${um}</b> unclaimed gift${um > 1 ? "s" : ""} in your Mailbox.` };
  if (S.gacha.total === 0) return { act: "go", data: 'data-v="hh"', text: "Do your first <b>Summon</b>. Your first ten guarantee a 4★ fighter or better." };
  if (nd) return { act: "openNode", data: `data-id="${nd.id}"`, text: `Continue the story: <b>${nd.id} ${esc(nd.name)}</b>.` };
  return { act: "go", data: 'data-v="battle"', text: "Earn Scrolls at the <b>Training Grounds</b> or fight through the <b>World Martial Arts Tournament</b>." };
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
      <img class="trainer" src="${lookArt(myLook())}" alt="You" data-act="settings" draggable="false">
      <div class="nameplate"><span class="eyebrow">Partner · ${esc(op.ver)}</span><b>${esc(op.n)}</b><div class="row" style="gap:4px">${elChip(op.el)}${beastChip(op)}</div></div>
      <div class="sidebtns left">
        <button class="sidebtn" data-act="inbox" aria-label="Mailbox">${IC.mail}<small>Mail</small>${mails ? `<i class="cnt num">${mails}</i>` : ""}</button>
        <button class="sidebtn" data-act="go" data-v="ach" aria-label="Achievements">${IC.trophy}<small>Z Records</small>${newAch ? '<i class="dot"></i>' : ""}</button>
      </div>
      <div class="sidebtns">
        <button class="sidebtn" data-act="missions" aria-label="Missions">${IC.missions}<small>Missions</small>${missionsReady ? '<i class="dot"></i>' : ""}</button>
        <button class="sidebtn" data-act="go" data-v="shop" aria-label="Capsule Corp shop">${IC.shop}<small>Shop</small></button>
        <button class="sidebtn" data-act="go" data-v="depot" aria-label="Items">${IC.depot}<small>Items</small></button>
      </div>
    </section>
    ${hint ? `<button class="hint" data-act="${hint.act}" ${hint.data || ""}>${IC.boost.replace("<svg", '<svg width="22" height="22"')}<div><div class="eyebrow">Next objective</div><div class="small">${hint.text}</div></div></button>` : ""}
    <div class="tiles">
      <button class="tile ls-t" data-act="go" data-v="story"><span class="ticon" style="color:var(--holo)">${IC.story}</span><h3>Story</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "Frieza is beaten"}</span></button>
      <button class="tile ds-t" data-act="go" data-v="battle"><span class="ticon" style="color:var(--ds)">${IC.battles}</span><h3>Battle</h3><span class="tsub">Training · Tournament · Rankings</span></button>
      <button class="tile" data-act="go" data-v="hh"><span class="ticon">${IC.dball}</span><h3>Summon</h3><span class="tsub">${S.permit} tickets · ${fmt(S.orundum)} Dragon Stones</span></button>
      <button class="tile" data-act="go" data-v="ops"><span class="ticon" style="color:var(--gold)">${IC.ops}</span><h3>Fighters</h3><span class="tsub">${Object.keys(S.ops).length}/${OP_KEYS.length} collected</span></button>
    </div>
    <p class="tiny dim" style="text-align:center;padding:4px 8px">Dragon Ball Z: Legend of the Z Fighters is an unofficial, non-commercial fan game. Dragon Ball belongs to Akira Toriyama, Bird Studio, Shueisha, Toei Animation and Bandai Namco.</p>
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
      return `<button class="tile wide" data-act="chapter" data-c="${ch.id}" ${open ? "" : "disabled"} style="min-height:88px;background:linear-gradient(120deg,${mapTheme(ch.env).a},var(--hull2) 70%)">
        <span class="ticon" style="width:auto;height:auto;font:800 40px var(--f-display);opacity:.25;top:2px">${i + 1}</span>
        <div class="eyebrow">${esc(ch.season)} · Chapter ${ch.no}${done ? " · Cleared" : ""}</div><h3>${esc(ch.title)}</h3>
        <span class="tsub">${open ? `${stars}/${battles.length * 3} stars` : "Clear the previous chapter to unlock"}</span></button>`;
    }).join("")}
  </div>`;
};
function mapTheme(m) {
  const E2 = ENVS[m] || ENVS.wasteland;
  return { a: shade(E2.sky[0], -.35), b: shade(E2.sky[0], -.75), c: E2.sky[2] };
}
SCREENS.chapter = cid => {
  const ch = STORY[0].chapters.find(c => c.id === cid), nx = nextNode();
  setTimeout(() => { if (UI.view === "chapter" && UI.arg === cid) fieldStart(ch); }, 0);
  return `<div class="stack">
    <div class="spread">${back("go", "Story", 'data-v="story"')}<span class="eyebrow">${esc(ch.season)} · Chapter ${ch.no}</span></div>
    <h2>${esc(ch.title)}</h2>
    ${fieldHTML(ch)}
    <p class="tiny dim">Walk with ◀ ▶, jump with ▲ and hold it in the air to fly; ▼ lands. Tap a stage to go there. Running into a wandering enemy starts a fight (no Stamina).</p>
    <div class="fstages">${ch.nodes.map(nd => { const open = nodeOpen(nd), st = nodeStars(nd.id);
      return `<button class="fstage ${open ? "" : "locked"} ${nx === nd ? "next" : ""}" data-act="openNode" data-id="${nd.id}"><b>${nd.id}</b>${esc(nd.name)}${nd.waves || nd.type === "event" ? `<span class="nst">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</span>` : ""}</button>`; }).join("")}</div>
    <p class="tiny dim">Chapter reward: ${ch.reward.op ? esc(opLabel(OPS[ch.reward.op])) + " joins your fighters, plus " : ""}${ch.reward.orundum} Dragon Stones${ch.reward.permit ? ` and ${ch.reward.permit} Summon Tickets` : ""}.</p>
  </div>`;
};
function nodeSheet(nd) {
  const st = nodeStars(nd.id), cost = nodeCost(nd), lv = nd.lv;
  const foes = nd.waves ? nodeFoes(nd) : null;
  const goal = nd.waves ? nodeTurnGoal(nd) : 0, G = nd.type === "event" ? GAMES[nd.game] : null;
  openModal(`<div class="stack">
    <div class="spread"><div><div class="eyebrow">${nd.id} · ${{ story: "Story", battle: "Battle", side: "Side Story", chest: "Capsule", boss: "Boss Battle", event: "Minigame" }[nd.type]}</div><h2 style="margin-top:4px">${esc(nd.name)}</h2></div>
      ${nd.waves || G ? `<div class="nstars">${[1, 2, 3].map(k => k <= st ? IC.star : IC.starOff).join("")}</div>` : ""}</div>
    ${foes ? `<div><div class="tiny dim" style="margin-bottom:4px">Enemy party · they fight one at a time</div><div class="row wrap">${foes.map(s => enHTML(s, s.en && ENEMY[s.en].boss ? 56 : 46)).join("")}</div></div>` : ""}
    ${nd.waves ? `<div class="stack" style="gap:4px"><div class="tiny dim">Star conditions</div>
      ${["Win the battle", "No fighter knocked out", `Win within ${goal} turns`].map((m, k) => `<div class="mission">${k < st ? IC.star : IC.starOff}<span>${m}</span></div>`).join("")}</div>
      <div><div class="tiny dim" style="margin-bottom:4px">${st ? "Regular prizes" : "First clear"}${st < 3 ? " · first 3-star clear adds 1 Senzu Bean" : ""}</div><div class="rewards" style="justify-content:flex-start">${rewardsHTML(st ? [{ k: "lmd", n: 80 + lv * 15 }, { k: lv < 20 ? "rec1" : lv < 40 ? "rec2" : "rec3", n: 2 }, { k: "summ", n: 1 }] : [{ k: "orundum", n: nd.type === "boss" ? 150 : nd.type === "side" ? 100 : 60 }, { k: "lmd", n: 80 + lv * 15 }, { k: lv < 20 ? "rec1" : lv < 40 ? "rec2" : "rec3", n: 3 }])}</div></div>` : ""}
    ${G ? `<p class="small dim">${esc(G.help)}</p><div class="stack" style="gap:4px"><div class="tiny dim">Star conditions</div>${G.stars.map((m, k) => `<div class="mission">${k < st ? IC.star : IC.starOff}<span>${esc(m)}</span></div>`).join("")}</div>` : ""}
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
    <h2>Party</h2>
    ${foeEls.length ? `<div class="small">Enemy styles: ${foeEls.map(elChip).join(" ")} ${counter.length ? `<span class="dim">· Strong picks:</span> ${[...new Set(counter)].map(elChip).join(" ")}` : ""}</div>` : ""}
    <div class="squad">${[...Array(TEAM_SIZE).keys()].map(k => {
      const id = ids[k];
      return `<div class="slot">${k === 0 ? `<span class="crown">${IC.crown}</span>` : ""}${id ? `<button data-act="slot" data-k="${k}" aria-label="${esc(OPS[id].n)}">${opHTML(id, { s: 66 })}</button>` : '<div class="empty"></div>'}</div>`;
    }).join("")}</div>
    <div class="leadtxt small">${lead ? `<b class="gold">Leader · ${esc(opLabel(OPS[ids[0]]))}</b> <span class="dim">${leaderText(lead)}</span>` : ids[0] ? `<span class="dim">${esc(OPS[ids[0]].n)} has no Leader Skill. The first slot is the party leader.</span>` : `<span class="dim">Pick up to three fighters. The first slot is the leader: it fights first and boosts the party with its Leader Skill. The others wait to switch in.</span>`}</div>
    <div class="spread small"><span>Battle Power <b class="num">${fmtFull(myPw)}</b></span>${arg.cost ? `<span class="cost">${IC.sanity}${arg.cost}</span>` : ""}</div>
    <button class="btn wide" data-act="deploy" ${ids.length ? "" : "disabled"}>Let's fight!</button>
    <div class="filters">${["all", ...ELS].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}">${e === "all" ? "All styles" : e}</button>`).join("")}</div>
    <div class="roster">${pool.map(k => `<button class="rcell ${ids.includes(k) ? "sel" : ""}" data-act="pickTeam" data-k="${k}">${opHTML(k)}${pnameHTML(k)}<div class="pw">${fmt(power(k, S.ops[k]))}</div></button>`).join("")}</div>
  </div>`;
};
function leaderText(l) {
  if (!l) return "—";
  const sym = { ATK: "ATK", HP: "HP", DEF: "DEF", SPD: "SPD", CR: "Crit Rate", CD: "Crit Damage" }[l.stat] || l.stat;
  return `${sym} +${Math.round(l.amount * 100)}% for ${l.scope === "All" ? "the whole party" : l.scope === "Team" ? l.team : l.scope === "Race" ? l.team + "s" : l.element + "s"}`;
}

// ---------- dialogue ----------
// the dialogue backdrop: the same place as the battle (sky, far and near layers, ground), painted once per place
const SCENE_BG = {};
function sceneBG(env) {
  if (SCENE_BG[env]) return SCENE_BG[env];
  const E2 = buildEnv(ENVS[env] ? env : "wasteland"), W = 600, H = 900, gy = H * .74;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, E2.sky[0]); gr.addColorStop(.6, E2.sky[1]); gr.addColorStop(1, E2.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E2.fx === "stars") for (const [x, y, s2] of E2.stars) { g.fillStyle = "#fff"; g.globalAlpha = .7; g.fillRect(x * W, y * gy, s2 * 1.4, s2 * 1.4); }
  g.globalAlpha = 1;
  if (E2.farCv) g.drawImage(E2.farCv, -300, gy - 360, BG_W * 1.1, 360);
  if (E2.nearCv) g.drawImage(E2.nearCv, -500, gy - 260, BG_W * 1.1, 260);
  if (E2.ground) { const g2 = g.createLinearGradient(0, gy, 0, H); g2.addColorStop(0, E2.ground[0]); g2.addColorStop(1, E2.ground[1]); g.fillStyle = g2; g.fillRect(0, gy, W, H - gy); }
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 0, W, H);
  return SCENE_BG[env] = toURL(cv);
}
function playScene(lines, title, env) {
  return new Promise(resolve => {
    const root = $("#dlg"), th = mapTheme(env);
    root.innerHTML = `<div class="dwrap">
      <div class="dbg" style="background:${th.b} url(${sceneBG(env)}) center bottom/cover no-repeat"></div>
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
