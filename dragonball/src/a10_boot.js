// =====================================================================
//  LAUNCHERS
// =====================================================================
// rival fighters (versions you can collect) fight a few levels under the stage, at 80% HP and ATK
const RIVAL_LV = 3, RIVAL_SCALE = .8;
const convOne = (s, lv) => { if (!s.op) return { en: s.e, LV: lv + (ENEMY[s.e].boss ? 3 : 0) }; const LV = Math.max(1, lv - RIVAL_LV); return { op: s.op, LV, prog: progForLV(s.op, LV), scale: RIVAL_SCALE }; };
// an enemy party: up to three fighters from the stage's waves; bosses always come, and last
function rivalPicks(waves) {
  const all = waves.flat(), isBoss = s => s.e && ENEMY[s.e].boss;
  const boss = all.filter(isBoss), rest = all.filter(s => !isBoss(s));
  const picks = rest.slice().reverse().slice(0, Math.max(0, TEAM_SIZE - boss.length)).reverse();
  return [...picks, ...boss].slice(0, TEAM_SIZE);
}
const rivalTeam = (waves, lv) => rivalPicks(waves).map(s => convOne(s, lv));
const allySpecs = ids => ids.filter(owned).map(k => ({ op: k, prog: S.ops[k] }));
const recFor = lv => lv < 20 ? "rec1" : lv < 40 ? "rec2" : lv < 60 ? "rec3" : "rec4";
function squadOrToast(mode) {
  const ids = S.team[mode].filter(owned);
  if (!ids.length) { toast("Pick at least one fighter."); return null; }
  return ids;
}
function opsXp(ids, xp) { for (const k of ids) opXp(k, xp); return { k: "xp", n: xp }; }
function teamScreen(mode, title, cost, foes, back, launch) {
  closeModal();
  UI.team = null;
  route("team", { mode, title, cost, foes, from: mode === "story" ? "story" : "battle", back, launch });
}
function needSanity(n) {
  tickTimers();
  if (S.sanity >= n) return true;
  toast("Not enough Stamina."); sanityModal(); return false;
}
// a cleared chapter pays out once; returns the reward list when it just happened
function chapterPayout(ch) {
  if (S.chRw[ch.id] || !chapterCleared(ch)) return null;
  S.chRw[ch.id] = 1;
  return give(ch.reward);
}
function chapterModal(ch, list) {
  const i = STORY[0].chapters.indexOf(ch), nx = STORY[0].chapters[i + 1];
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <div class="eyebrow">${esc(ch.season)} · Chapter ${ch.no} cleared</div><h2>${esc(ch.title)}</h2>
    ${ch.reward.op ? `<img src="${spriteURL(OPS[ch.reward.op])}" alt="" style="height:200px;max-width:100%;object-fit:contain;filter:drop-shadow(0 10px 18px #000)"><p class="small"><b class="gold">${esc(opLabel(OPS[ch.reward.op]))}</b> joins your fighters!</p>` : ""}
    <div class="rewards">${rewardsHTML(list)}</div>
    ${nx ? `<p class="small dim">Chapter ${nx.no}, ${esc(nx.title)}, is now open.</p><button class="btn wide" data-act="chapter" data-c="${nx.id}">Continue</button>` : `<p class="small dim">You have finished the story: from Raditz's arrival to a Super Saiyan on Namek.</p><button class="btn wide" data-act="closeModal">Close</button>`}
  </div>`);
  sfx("win");
}

// ---------- story ----------
async function readStory(nd) {
  closeModal();
  if (UI.view !== "chapter") route("chapter", nd.ch.id);
  await playScene(nd.pre || [], `${nd.id} ${nd.name}`, nd.env || nd.ch.env);
  if (nodeStars(nd.id)) return;
  S.story[nd.id] = 1;
  const list = give({ orundum: 30, lmd: 600 });
  rerender();
  const ch = chapterPayout(nd.ch);
  if (ch) chapterModal(nd.ch, ch); else rewardModal("Story complete", list, `${nd.id} ${nd.name}`);
}
async function openChest(nd) {
  closeModal();
  if (nodeStars(nd.id)) return;
  if (UI.view !== "chapter") route("chapter", nd.ch.id);
  if (nd.pre) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.env || nd.ch.env);
  S.story[nd.id] = 1;
  const list = give(nd.reward);
  sfx("heal"); rerender();
  const ch = chapterPayout(nd.ch);
  if (ch) chapterModal(nd.ch, ch); else rewardModal("Capsule opened", list, `${nd.id} ${nd.name}`);
}
async function playGame(nd) {
  closeModal();
  if (UI.view !== "chapter" && !DEMO.quiet) route("chapter", nd.ch.id);
  if (!nodeStars(nd.id) && nd.pre && nd.pre.length && !(DEMO.on && DEMO.sim)) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.env || nd.ch.env);
  launchGame(nd);
}
const nodeFoes = nd => rivalTeam(nd.waves, nd.lv);
function nodeDrops(nd, first) {
  const lv = nd.lv;
  return first ? { orundum: nd.type === "boss" ? 150 : nd.type === "side" ? 100 : 60, lmd: 80 + lv * 15, [recFor(lv)]: 3 }
    : { lmd: 80 + lv * 15, [recFor(lv)]: 2, summ: 1 };
}
async function launchNode(id) {
  const nd = NODES[id], cost = nodeCost(nd), ids = squadOrToast("story");
  if (!ids || !needSanity(cost)) return;
  const first = !nodeStars(id);
  route("chapter", nd.ch.id);
  if (first && nd.pre && nd.pre.length) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.env || nd.ch.env);
  spendSanity(cost); S.stats.battles++; save();
  let chList = null;
  startBattle({
    allies: allySpecs(ids), foes: rivalTeam(nd.waves, nd.lv), env: nd.env || nd.ch.env,
    title: nd.name, sub: `${nd.id} · ${nd.ch.title}`,
    onWin(res) {
      const goal = nodeTurnGoal(nd);
      const missions = [{ n: "Win the battle", ok: true }, { n: "No fighter knocked out", ok: !res.lost }, { n: `Win within ${goal} turns`, ok: res.turns <= goal }];
      const stars = missions.filter(m => m.ok).length, prev = nodeStars(id);
      S.story[id] = Math.max(prev, stars);
      S.stats.wins++; S.daily.clear++;
      const list = give(nodeDrops(nd, first));
      if (stars === 3 && prev < 3) list.push(...give({ prime: 1 }));
      list.push(opsXp(ids, 50 + nd.lv * 18));
      chList = chapterPayout(nd.ch);
      return { rewards: list, missions };
    },
    onLose() { S.sanity += Math.max(0, cost - 1); return { rewards: [] }; },
    onQuit() { S.sanity += Math.max(0, cost - 1); save(); },
    async onClose(res) {
      if (!res.win) return;
      if (first && nd.post && nd.post.length) await playScene(nd.post, `${nd.id} ${nd.name}`, nd.env || nd.ch.env);
      rerender();
      if (chList) chapterModal(nd.ch, chList);
    },
    retry: () => launchNode(id),
  });
}
function sweepNode(id, x) {
  const nd = NODES[id], cost = nodeCost(nd) * x, ids = S.team.story.filter(owned);
  if (nodeStars(id) < 3) return;
  if (!needSanity(cost)) return;
  spendSanity(cost);
  let list = [];
  for (let k = 0; k < x; k++) list = list.concat(give(nodeDrops(nd, false)));
  list.push(opsXp(ids, (50 + nd.lv * 18) * x));
  S.daily.clear += x; S.stats.battles += x; S.stats.wins += x;
  closeModal(); rerender();
  rewardModal(x > 1 ? `Auto Clear ×${x}` : "Auto Clear", list, `${nd.id} ${nd.name}`);
}

// ---------- Training Grounds ----------
function huntTeam(h, l) { const lv = HUNT_LV[l - 1]; return rivalTeam(h.waves(lv), lv); }
const huntPrize = (h, l) => ({ [h.item]: 1 + Math.floor(l / 2), lmd: 800 + l * 700, [recFor(HUNT_LV[l - 1])]: 2 });
function huntDrops(h, l) { return give(huntPrize(h, l)); }
function launchHunt(id, l) {
  const h = HUNTS.find(x => x.id === id), cost = HUNT_COST[l - 1], ids = squadOrToast("hunt");
  if (!ids || !needSanity(cost)) return;
  if (!DEMO.quiet) route("hunt", id);
  spendSanity(cost); S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), foes: huntTeam(h, l), env: h.env, title: h.n, sub: `Training Grounds · ${h.code}-${l}`,
    onWin() {
      S.hunt[id] = Math.max(S.hunt[id] || 0, l); S.stats.wins++; S.stats.patrols++; S.daily.clear++;
      const list = huntDrops(h, l); list.push(opsXp(ids, 60 + HUNT_LV[l - 1] * 12));
      return { rewards: list };
    },
    onLose() { S.sanity += Math.max(0, cost - 1); return { rewards: [] }; },
    onQuit() { S.sanity += Math.max(0, cost - 1); save(); },
    retry: () => launchHunt(id, l),
  });
}
function sweepHunt(id, l) {
  const h = HUNTS.find(x => x.id === id), cost = HUNT_COST[l - 1] * 3;
  if ((S.hunt[id] || 0) < l || !needSanity(cost)) return;
  spendSanity(cost);
  let list = [];
  for (let k = 0; k < 3; k++) list = list.concat(huntDrops(h, l));
  list.push(opsXp(S.team.hunt.filter(owned), (60 + HUNT_LV[l - 1] * 12) * 3));
  S.daily.clear += 3; S.stats.battles += 3; S.stats.wins += 3; S.stats.patrols += 3;
  rerender(); rewardModal("Auto Clear ×3", list, `${h.code}-${l} ${h.n}`);
}

// ---------- World Martial Arts Tournament ----------
function launchTower(f) {
  const T = towerFloor(f), ids = squadOrToast("tower");
  if (!ids || f !== S.tower + 1) return;
  route("tower");
  S.stats.battles++;
  startBattle({
    allies: allySpecs(ids), foes: rivalTeam(T.waves, T.lv), env: T.env, title: `Match ${f}`, sub: "World Martial Arts Tournament",
    onWin() {
      S.tower = Math.max(S.tower, f); S.stats.wins++; S.daily.clear++;
      const list = give(T.reward); list.push(opsXp(ids, 50 + T.lv * 10));
      return { rewards: list };
    },
    retry: () => launchTower(f),
  });
}

// ---------- Scouter Rankings ----------
function launchArena(k) {
  tickTimers();
  const A = S.arena, o = A.opps && A.opps[k], ids = squadOrToast("arena");
  if (!o || !ids) return;
  if (A.attempts <= 0) { toast("No attempts left. One refills every 10 minutes."); return; }
  if (!DEMO.quiet) route("arena");
  if (A.attempts >= 5) A.aTime = Date.now();
  A.attempts--; S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), foes: o.team.slice(0, TEAM_SIZE).map(u => ({ op: u.op, LV: u.LV })), env: "tournament", title: o.cls ? `${o.cls} ${o.name}` : o.name, sub: `Scouter Rankings · Rank #${o.rank}`,
    onWin() {
      const before = A.rank;
      A.rank = o.rank < A.rank ? o.rank : Math.max(1, A.rank - ri(1, 4));
      S.stats.wins++; S.stats.versus++; S.daily.arena++;
      const list = give({ tokens: 25 }); if (A.rank < before) list.unshift({ k: "rank", n: A.rank });
      genOpps();
      return { rewards: list };
    },
    onLose() { return { rewards: give({ tokens: 5 }) }; },
  });
}

// =====================================================================
//  ACTIONS (event delegation on data-act)
// =====================================================================
function quip() {
  const st = $(".stage"); if (!st) return;
  const key = S.assistant, lines = (OPS[key] && QUIPS[OPS[key].base]) || QUIPS._;
  st.querySelector(".quip") && st.querySelector(".quip").remove();
  const q = document.createElement("div"); q.className = "quip";
  q.innerHTML = `<b>${esc(OPS[key] ? OPS[key].n : "")}</b>${esc(pick(lines))}`;
  st.appendChild(q); sfx("tap");
  const img = st.querySelector(".assist");
  if (img) img.animate([{ transform: "translateX(-50%) translateY(0)" }, { transform: "translateX(-50%) translateY(-10px)" }, { transform: "translateX(-50%) translateY(0)" }], { duration: 360, easing: "ease-out" });
  clearTimeout(quip.t); quip.t = setTimeout(() => q.remove(), 3600);
}
function introModal() {
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <img src="${spriteURL(OPS[STARTERS[0]])}" alt="Goku" style="height:230px;max-width:100%;object-fit:contain;filter:drop-shadow(0 12px 20px #000)">
    <div class="eyebrow">Kame House · Five years later</div>
    <h1>Dragon Ball Z<span style="display:block;color:var(--moon);font-size:18px;letter-spacing:.2em;margin-top:4px">Legend of the Z Fighters</span></h1>
    <p class="small dim" style="max-width:36ch">From Raditz's arrival to Super Saiyan Goku on Namek. Walk each chapter's map, then fight like in Goku Gekitōden: plan up to three commands a turn, hold POWER to charge your attacks, tap GUARD as the ring closes, and VANISH to dodge.</p>
    <button class="btn wide" data-act="introGo">Let's go!</button>
    <p class="tiny dim">Unofficial, non-commercial fan game. Dragon Ball belongs to Akira Toriyama, Bird Studio, Shueisha, Toei Animation and Bandai Namco. All art here is drawn by the game.</p>
  </div>`);
}
const ACT = {
  ...META_ACT,
  ...DEMO_ACT,
  go: d => { if (d.v === "op" && d.a !== UI.arg) UI.opTab = "info"; closeModal(); route(d.v, d.a || null); },
  poke: () => quip(),
  missions: () => missionsModal(),
  settings: () => { closeModal(); route("settings"); },
  sanity: () => sanityModal(),
  closeModal: () => closeModal(),
  introGo: () => { S.seenIntro = true; closeModal(); route("chapter", "c1"); },

  // story: tapping a stage walks the chapter's lead there on the field, then opens it
  chapter: d => { closeModal(); route("chapter", d.c); },
  openNode: d => {
    const nd = NODES[d.id];
    if (!nodeOpen(nd)) { toast(nd.type === "side" ? "Clear the stage before this side story first." : "Clear the previous stage first."); return; }
    if (UI.view !== "chapter" || UI.arg !== nd.ch.id) { route("chapter", nd.ch.id); setTimeout(() => { if (!fieldGo(nd)) nodeSheet(nd); }, 60); return; }
    if (!fieldGo(nd)) nodeSheet(nd);
  },
  startNode: d => {
    const nd = NODES[d.id];
    if (nd.type === "story") return readStory(nd);
    if (nd.type === "chest") return openChest(nd);
    if (nd.type === "event") return playGame(nd);
    teamScreen("story", `${nd.id} ${nd.name}`, nodeCost(nd), nodeFoes(nd), ["chapter", nd.ch.id], { kind: "node", id: nd.id });
  },
  sweep: d => sweepNode(d.id, +d.x),

  // party select
  teamBack: () => { const b = UI.arg && UI.arg.back; UI.team = null; route(b ? b[0] : "home", b ? b[1] : null); },
  slot: d => {
    const ids = UI.team.ids, k = +d.k;
    if (k === 0) { toast("Tap a selected fighter in the list below to remove it."); return; }
    ids.unshift(ids.splice(k, 1)[0]); sfx("tap"); rerender();
  },
  pickTeam: d => {
    const ids = UI.team.ids, i = ids.indexOf(d.k);
    if (i >= 0) ids.splice(i, 1);
    else if (ids.length >= TEAM_SIZE) { toast("Your party is full. Remove a fighter first."); return; }
    else ids.push(d.k);
    sfx("tap"); rerender();
  },
  deploy: () => {
    const a = UI.arg, L2 = a.launch;
    S.team[a.mode] = UI.team.ids.slice(); save();
    if (L2.kind === "node") launchNode(L2.id);
    else if (L2.kind === "hunt") launchHunt(L2.id, L2.l);
    else if (L2.kind === "tower") launchTower(L2.f);
    else if (L2.kind === "arena") launchArena(L2.k);
  },
  elf: d => { UI.el = d.e; rerender(); },
  styf: d => { UI.sty = d.e; rerender(); },

  // battle hub
  huntLv: d => { UI.huntLv[d.h] = +d.l; rerender(); },
  huntGo: d => {
    const h = HUNTS.find(x => x.id === d.h), l = +d.l;
    teamScreen("hunt", `${h.code}-${l} ${h.n}`, HUNT_COST[l - 1], huntTeam(h, l), ["hunt", h.id], { kind: "hunt", id: h.id, l });
  },
  huntSweep: d => sweepHunt(d.h, +d.l),
  towerGo: d => { const T = towerFloor(+d.f); teamScreen("tower", `World Tournament · Match ${T.f}`, 0, rivalTeam(T.waves, T.lv), ["tower", null], { kind: "tower", f: T.f }); },
  arenaGo: d => {
    const o = S.arena.opps[+d.k];
    if (S.arena.attempts <= 0) { toast("No attempts left."); return; }
    teamScreen("arena", `Rankings · ${o.name}`, 0, o.team.slice(0, TEAM_SIZE), ["arena", null], { kind: "arena", k: +d.k });
  },
  newOpps: () => { genOpps(); sfx("tap"); rerender(); },
  payout: () => {
    tickTimers();
    if (Date.now() - S.arena.payTime < PAYOUT_MS) return;
    const list = give(payout(S.arena.rank)); S.arena.payTime = Date.now();
    rerender(); rewardModal("Ranking rewards", list, `Rank #${S.arena.rank}`);
  },

  // fighters
  toggleAll: () => { UI.all = !UI.all; rerender(); },
  clsf: d => { UI.cls = d.c; rerender(); },
  sortf: d => { UI.sort = d.s; rerender(); },
  opTab: d => { UI.opTab = d.t; rerender(); },
  skUp: d => { if (skillUp(d.k, +d.i)) { sfx("heal"); toast(`Technique level ${RANK[S.ops[d.k].sk[+d.i]]}.`); } rerender(); },
  rec: d => { const lv = S.ops[d.k].lvl; if (useRecord(d.k, d.it)) { sfx("tap"); if (S.ops[d.k].lvl > lv) { S.daily.upgrade++; toast(`${OPS[d.k].n} reached level ${S.ops[d.k].lvl}.`); } } rerender(); },
  autoLv: d => { const lv = S.ops[d.k].lvl, n = autoLevel(d.k); if (n) { sfx("heal"); if (S.ops[d.k].lvl > lv) S.daily.upgrade++; toast(`Used ${n} training items. Level ${lv} → ${S.ops[d.k].lvl}.`); } rerender(); },
  promote: d => { if (promote(d.k)) { sfx("transform"); toast(`${OPS[d.k].n}: Zenkai Awakening ${S.ops[d.k].elite}!`, "gold"); } rerender(); },
  assistant: d => { S.assistant = d.k; toast(`${OPS[d.k].n} is now your partner.`); rerender(); },
  scroll: d => { const before = profLevels(S.ops[d.k]); if (useScroll(d.k, d.it)) { sfx("heal"); const after = profLevels(S.ops[d.k]), w = ITEMS[d.it].prof; if (after[w] > before[w]) toast(`${PROF_N[w]} Proficiency Lv ${after[w]}!`, "gold"); } rerender(); },

  // summons
  hhTab: d => { UI.hhStd = d.std === "1"; rerender(); },
  pull: async d => {
    const n = +d.n;
    if (S.permit >= n) S.permit -= n;
    else if (S.orundum >= 600 * n) S.orundum -= 600 * n;
    else { toast("Not enough Dragon Stones or Summon Tickets."); return; }
    const res = headhunt(n, !UI.hhStd); save(); renderTop();
    await gachaReveal(res);
    rerender();
  },

  // missions
  claimDaily: d => {
    const m = DAILIES.find(x => x.id === d.id);
    if (!m || S.daily.claimed[m.id] || (S.daily[m.id] || 0) < m.goal) return;
    S.daily.claimed[m.id] = 1; give(m.reward); sfx("heal"); renderTop(); missionsModal();
  },
  claimAllDaily: () => { if (S.daily.claimed.all) return; S.daily.claimed.all = 1; give(DAILY_ALL); sfx("win"); renderTop(); missionsModal(); },

  // shop
  shopTab: d => { UI.shopTab = d.t; rerender(); },
  buy: d => {
    const it = SHOP[d.t].find(x => x.id === d.id), cur = d.t;
    if (!it || S[cur] < it.cost) { toast("Not enough currency."); return; }
    S[cur] -= it.cost;
    const list = give(it.give); sfx("heal");
    if (UI.view === "shop") rerender(); else renderTop();
    rewardModal("Purchased", list, it.n);
  },
};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});

// =====================================================================
//  BOOT
// =====================================================================
function migrate(s) {
  s.hunt = s.hunt || {}; s.chRw = s.chRw || {}; s.field = s.field || {};
  if (s.prime == null) s.prime = 6;
  if (s.credit == null) s.credit = 300;
  // drop anything the roster no longer has
  for (const k in s.ops) { if (!OPS[k]) { delete s.ops[k]; continue; } const p = s.ops[k]; p.prof = p.prof || { m: 0, k: 0, g: 0 }; p.sk = p.sk || [1, 1, 1]; }
  for (const k in s.team) s.team[k] = [...new Set(s.team[k])].filter(x => OPS[x]).slice(0, TEAM_SIZE);
  if (!s.ops[s.assistant]) s.assistant = Object.keys(s.ops)[0] || STARTERS[0];
  for (const id in s.story) if (!NODES[id]) delete s.story[id];
  // inbox, achievements, title screen
  s.inbox = s.inbox || []; s.mailSeq = s.mailSeq || 0; s.inv = s.inv || {};
  for (const k of ["trM", "trK", "trG"]) if (s.inv[k] == null) s.inv[k] = 0;
  s.stats = { ...newStats(), ...(s.stats || {}) };
  if (!s.playerId) s.playerId = String(100000000 + Math.floor(R() * 899999999));
  if (!s.created) s.created = Date.now();
  if (s.named == null) s.named = !!s.seenIntro;
  if (s.lastLogin == null) s.lastLogin = "";
  if (s.lastGift == null) s.lastGift = Date.now();
  if (s.lvlGift == null) s.lvlGift = Math.max(1, Math.floor(s.lvl / 5) * 5);
  if (!s.achv) { s.achv = {}; s.achBase = 1; }
  s.settings = { speed: 1, auto: false, sound: true, ai: "balanced", autoGo: false, ...(s.settings || {}) };
  if (!s.welcome) welcomeMail(s);
  return s;
}
function start(data) {
  S = migrate((data && data.save) || load() || newSave());
  UI.huntLv = {};
  tickTimers();
  if (S.achBase) { checkAchievements(true); delete S.achBase; }
  route("home");
  showTitle();
  let tick = 0;
  setInterval(() => {
    if (BT.on) { tickTimers(); return; }
    if (++tick % 30 === 0 && UI.inGame && $("#modal").hidden && $("#gacha").hidden && $("#dlg").hidden && $("#battle").hidden) { metaTick(); renderTop(); }
    const sig = () => [S.sanity, S.arena.attempts, Date.now() - S.arena.payTime >= PAYOUT_MS].join("|");
    const before = sig();
    tickTimers();
    const now = Date.now(), A = S.arena;
    if (before !== sig()) { save(); if (UI.view === "arena" && !$("#modal").innerHTML) rerender(); else renderTop(); }
    for (const el of $$("[data-cd]")) {
      const left = { att: ARENA_MS - (now - A.aTime), pay: PAYOUT_MS - (now - A.payTime) }[el.dataset.cd];
      el.textContent = dur(Math.max(0, left));
    }
  }, 1000);
  const flush = () => { if (DEMO.on) return; if (FIELD.ch) S.field[FIELD.ch.id] = Math.round(FIELD.x); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ save: S }));
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start(window.claude && window.claude.hot && window.claude.hot.data || {});
</script>
