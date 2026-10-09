
// =====================================================================
//  LAUNCHERS
// =====================================================================
// rival Bladers' Beyblades fight a few levels under the stage, with stock parts and 80% Spin and ATK
const RIVAL_LV = 3, RIVAL_SCALE = .8;
const convOne = (s, lv) => { if (!s.op) return { en: s.e, LV: lv + (ENEMY[s.e].boss ? 3 : 0) }; const LV = Math.max(1, lv - RIVAL_LV); return { op: s.op, LV, prog: progForLV(s.op, LV), scale: RIVAL_SCALE }; };
// a rival team for a 1-on-1 tag battle: up to three Beyblades from the stage's rounds; bosses always come, and last
function rivalPicks(waves) {
  const all = waves.flat(), isBoss = s => s.e && ENEMY[s.e].boss;
  const boss = all.filter(isBoss), rest = all.filter(s => !isBoss(s));
  // prefer the last round's rivals (the stronger ones), then fill from earlier rounds
  const pool = [...rest.slice().reverse()];
  const picks = pool.slice(0, Math.max(0, TEAM_SIZE - boss.length)).reverse();
  return [...picks, ...boss].slice(0, TEAM_SIZE);
}
const rivalTeam = (waves, lv) => rivalPicks(waves).map(s => convOne(s, lv));
const allySpecs = ids => ids.filter(owned).map(k => ({ op: k, prog: S.ops[k] }));
const recFor = lv => lv < 20 ? "rec1" : lv < 40 ? "rec2" : lv < 60 ? "rec3" : "rec4";
function squadOrToast(mode) {
  const ids = S.team[mode].filter(owned);
  if (!ids.length) { toast("Pick at least one Beyblade."); return null; }
  return ids;
}
function opsXp(ids, xp) { for (const k of ids) opXp(k, xp); return { k: "xp", n: xp }; }
function rollPart(rars, pool) {
  let r = R(), rar = 1;
  for (let i = 0; i < rars.length; i++) { if (r < rars[i]) { rar = i + 1; break; } r -= rars[i]; rar = i + 1; }
  const pt = makePart(randomModel(pool), rar); S.parts.push(pt);
  return { k: "part", n: 1, part: pt };
}
function teamScreen(mode, title, cost, foes, back, launch) {
  closeModal();
  UI.team = null;
  route("team", { mode, title, cost, foes, from: mode === "story" ? "story" : "battle", back, launch });
}
function needSanity(n) {
  tickTimers();
  if (S.sanity >= n) return true;
  toast("Not enough Energy."); sanityModal(); return false;
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
    ${ch.reward.op ? `<img src="${spriteURL(OPS[ch.reward.op])}" alt="" style="height:200px;max-width:100%;object-fit:contain;filter:drop-shadow(0 10px 18px #000)"><p class="small"><b class="gold">${esc(opLabel(OPS[ch.reward.op]))}</b> joins your collection.</p>` : ""}
    <div class="rewards">${rewardsHTML(list)}</div>
    ${nx ? `<p class="small dim">Chapter ${nx.no}, ${esc(nx.title)}, is now open.</p><button class="btn wide" data-act="chapter" data-c="${nx.id}">Continue</button>` : `<p class="small dim">You have finished the story: three World Championships in a row!</p><button class="btn wide" data-act="closeModal">Close</button>`}
  </div>`);
  sfx("win");
}

// ---------- story ----------
async function readStory(nd) {
  closeModal();
  if (UI.view !== "chapter") route("chapter", nd.ch.id);
  await playScene(nd.pre || [], `${nd.id} ${nd.name}`, nd.ch.env);
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
  if (nd.pre) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.ch.env);
  S.story[nd.id] = 1;
  const list = give(nd.reward);
  sfx("heal"); rerender();
  const ch = chapterPayout(nd.ch);
  if (ch) chapterModal(nd.ch, ch); else rewardModal("Cache opened", list, `${nd.id} ${nd.name}`);
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
  if (first && nd.pre && nd.pre.length) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.ch.env);
  spendSanity(cost); S.stats.battles++; save();
  let chList = null;
  startBattle({
    allies: allySpecs(ids), foes: rivalTeam(nd.waves, nd.lv), env: nd.ch.env,
    title: nd.name, sub: `${nd.id} · ${nd.ch.title}`,
    onWin(res) {
      const goal = nodeTimeGoal(nd);
      const missions = [{ n: "Win the battle", ok: true }, { n: "No Beyblade knocked out", ok: !res.lost }, { n: `Win within ${goal} seconds`, ok: res.time <= goal }];
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
      if (first && nd.post && nd.post.length) await playScene(nd.post, `${nd.id} ${nd.name}`, nd.ch.env);
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
  rewardModal(x > 1 ? `Auto Deploy ×${x}` : "Auto Deploy", list, `${nd.id} ${nd.name}`);
}

// ---------- hunts ----------
function huntTeam(h, l) { const lv = HUNT_LV[l - 1]; return rivalTeam(h.waves(lv), lv); }
function huntDrops(h, l) {
  const list = [];
  for (let k = ri(2, 3); k > 0; k--) list.push(rollPart(HUNT_RAR[l - 1], h.parts));
  return list.concat(give({ lmd: 800 + l * 700, [recFor(HUNT_LV[l - 1])]: 2 }));
}
function launchHunt(id, l) {
  const h = HUNTS.find(x => x.id === id), cost = HUNT_COST[l - 1], ids = squadOrToast("hunt");
  if (!ids || !needSanity(cost)) return;
  route("hunt", id);
  spendSanity(cost); S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), foes: huntTeam(h, l), env: h.env, title: h.n, sub: `Street Battles · ${h.code}-${l}`,
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
  rerender(); rewardModal("Auto Deploy ×3", list, `${h.code}-${l} ${h.n}`);
}

// ---------- tower ----------
function launchTower(f) {
  const T = towerFloor(f), ids = squadOrToast("tower");
  if (!ids || f !== S.tower + 1) return;
  route("tower");
  S.stats.battles++;
  startBattle({
    allies: allySpecs(ids), foes: rivalTeam(T.waves, T.lv), env: T.env, title: `Floor ${f}`, sub: "BBA Tower",
    onWin() {
      S.tower = Math.max(S.tower, f); S.stats.wins++; S.daily.clear++;
      const list = give(T.reward); list.push(opsXp(ids, 50 + T.lv * 10));
      return { rewards: list };
    },
    retry: () => launchTower(f),
  });
}

// ---------- arena ----------
function launchArena(k) {
  tickTimers();
  const A = S.arena, o = A.opps && A.opps[k], ids = squadOrToast("arena");
  if (!o || !ids) return;
  if (A.attempts <= 0) { toast("No attempts left. One refills every 10 minutes."); return; }
  route("arena");
  if (A.attempts >= 5) A.aTime = Date.now();
  A.attempts--; S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), foes: o.team.slice(0, TEAM_SIZE).map(u => ({ op: u.op, LV: u.LV })), env: "bba", title: o.name, sub: `Ranked Battle · Rank #${o.rank}`,
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
    <img src="${spriteURL(OPS[STARTERS[0]])}" alt="Tyson and Dragoon" style="height:230px;max-width:100%;object-fit:contain;filter:drop-shadow(0 12px 20px #000)">
    <div class="eyebrow">Bey City · The riverbank</div>
    <h1>Beyblade<span style="display:block;color:var(--moon);font-size:18px;letter-spacing:.24em;margin-top:4px">Let It Rip!</span></h1>
    <p class="small dim" style="max-width:36ch">Battle through all three seasons of the original anime in one-on-one tag matches. Your Beyblade moves around the dish on its own: tap Attack to rush the rival, use its technique when it's charged, and call its Bit-Beast at 100% Bit Power. Tag in a partner when you need to; the one you tag out recovers Spin on the bench. Knock rivals out of the dish (Ring Out) or outspin them until they topple (Sleep Out).</p>
    <button class="btn wide" data-act="introGo">3, 2, 1… Let it rip!</button>
    <p class="tiny dim">Unofficial, non-commercial fan game. Beyblade belongs to Takao Aoki, Takara Tomy, Hasbro and Nelvana. All art here is drawn by the game.</p>
  </div>`);
}
const ACT = {
  ...META_ACT,
  go: d => { if (d.v === "op" && d.a !== UI.arg) UI.opTab = "info"; closeModal(); route(d.v, d.a || null); },
  poke: () => quip(),
  missions: () => missionsModal(),
  settings: () => { closeModal(); route("settings"); },
  sanity: () => sanityModal(),
  closeModal: () => closeModal(),
  introGo: () => { S.seenIntro = true; closeModal(); route("chapter", "c1"); nodeSheet(NODES["1-1"]); },

  // story
  chapter: d => { closeModal(); route("chapter", d.c); },
  openNode: d => {
    const nd = NODES[d.id];
    if (!nodeOpen(nd)) { toast(nd.type === "side" ? "Clear the stage before this side story first." : "Clear the previous stage first."); return; }
    if (UI.view !== "chapter" || UI.arg !== nd.ch.id) route("chapter", nd.ch.id);
    nodeSheet(nd);
  },
  startNode: d => {
    const nd = NODES[d.id];
    if (nd.type === "story") return readStory(nd);
    if (nd.type === "chest") return openChest(nd);
    teamScreen("story", `${nd.id} ${nd.name}`, nodeCost(nd), nodeFoes(nd), ["chapter", nd.ch.id], { kind: "node", id: nd.id });
  },
  sweep: d => sweepNode(d.id, +d.x),

  // team select
  teamBack: () => { const b = UI.arg && UI.arg.back; UI.team = null; route(b ? b[0] : "home", b ? b[1] : null); },
  slot: d => {
    const ids = UI.team.ids, k = +d.k;
    if (k === 0) { toast("Tap a selected Beyblade in the list below to remove it."); return; }
    ids.unshift(ids.splice(k, 1)[0]); sfx("tap"); rerender();
  },
  pickTeam: d => {
    const ids = UI.team.ids, i = ids.indexOf(d.k);
    if (i >= 0) ids.splice(i, 1);
    else if (ids.length >= TEAM_SIZE) { toast("Your team is full. Remove a Beyblade first."); return; }
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
  towerGo: d => { const T = towerFloor(+d.f); teamScreen("tower", `BBA Tower · Floor ${T.f}`, 0, rivalTeam(T.waves, T.lv), ["tower", null], { kind: "tower", f: T.f }); },
  arenaGo: d => {
    const o = S.arena.opps[+d.k];
    if (S.arena.attempts <= 0) { toast("No attempts left."); return; }
    teamScreen("arena", `Ranked · ${o.name}`, 0, o.team.slice(0, TEAM_SIZE), ["arena", null], { kind: "arena", k: +d.k });
  },
  newOpps: () => { genOpps(); sfx("tap"); rerender(); },
  payout: () => {
    tickTimers();
    if (Date.now() - S.arena.payTime < PAYOUT_MS) return;
    const list = give(payout(S.arena.rank)); S.arena.payTime = Date.now();
    rerender(); rewardModal("Ranking rewards", list, `Rank #${S.arena.rank}`);
  },

  // Beyblades
  toggleAll: () => { UI.all = !UI.all; rerender(); },
  clsf: d => { UI.cls = d.c; rerender(); },
  sortf: d => { UI.sort = d.s; rerender(); },
  opTab: d => { UI.opTab = d.t; rerender(); },
  skUp: d => { if (skillUp(d.k, +d.i)) { sfx("heal"); toast(`Move ${+d.i + 1} raised to level ${RANK[S.ops[d.k].sk[+d.i]]}.`); } rerender(); },
  rec: d => { const lv = S.ops[d.k].lvl; if (useRecord(d.k, d.it)) { sfx("tap"); if (S.ops[d.k].lvl > lv) { S.daily.upgrade++; toast(`${OPS[d.k].n} reached level ${S.ops[d.k].lvl}.`); } } rerender(); },
  autoLv: d => { const lv = S.ops[d.k].lvl, n = autoLevel(d.k); if (n) { sfx("heal"); if (S.ops[d.k].lvl > lv) S.daily.upgrade++; toast(`Used ${n} Battle Data. Level ${lv} → ${S.ops[d.k].lvl}.`); } rerender(); },
  promote: d => { if (promote(d.k)) { sfx("win"); toast(`${OPS[d.k].n} reached Upgrade ${S.ops[d.k].elite}!`, "gold"); } rerender(); },
  assistant: d => { S.assistant = d.k; toast(`${OPS[d.k].n} is now your partner.`); rerender(); },

  // parts
  partSheet: d => { const pt = partById(+d.id); if (pt) partSheet(pt); },
  fit: d => { fitPart(d.k, +d.id); sfx("tap"); closeModal(); rerender(); },
  unfit: d => { removePart(d.k, d.s); sfx("tap"); rerender(); },
  partSlotF: d => { UI.partSlot = d.s; rerender(); },
  tune: d => { const pt = partById(+d.id); if (pt && tunePart(pt)) { sfx("zap"); rerender(); partSheet(pt); } },
  tuneMax: d => { const pt = partById(+d.id); let n = 0; while (pt && tunePart(pt)) n++; if (n) { sfx("special"); toast(`${partName(pt)} tuned to +${pt.lvl}.`); } rerender(); partSheet(pt); },
  takeOff: d => { const pt = partById(+d.id); if (pt && pt.eq) removePart(pt.eq.k, pt.eq.s); rerender(); partSheet(pt); },
  sell: d => { const pt = partById(+d.id); if (!pt) return; const v = partSellValue(pt); sellPart(pt); closeModal(); toast(`Sold for ${fmtFull(v)} Yen.`); rerender(); },
  sellJunk: () => { const junk = S.parts.filter(p => !p.eq && p.rar <= 2); let v = 0; for (const p of junk) { v += partSellValue(p); sellPart(p); } toast(`Sold ${junk.length} spare parts for ${fmtFull(v)} Yen.`); rerender(); },
  depotTab: d => { UI.depotTab = d.t; rerender(); },
  depotSlot: d => { UI.depotSlot = d.s; rerender(); },

  // headhunt
  hhTab: d => { UI.hhStd = d.std === "1"; rerender(); },
  pull: async d => {
    const n = +d.n;
    if (S.permit >= n) S.permit -= n;
    else if (S.orundum >= 600 * n) S.orundum -= 600 * n;
    else { toast("Not enough BeyPoints or Booster Tickets."); return; }
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
  s.hunt = s.hunt || {}; s.chRw = s.chRw || {};
  if (s.prime == null) s.prime = 6;
  if (s.credit == null) s.credit = 300;
  if (!s.codes2) {
    // carry stars across if stage codes are renumbered
    const old = s.story || {}; s.story = {};
    for (const id in NODES) { const nd = NODES[id]; if (old[nd.legacy]) s.story[id] = old[nd.legacy]; }
    s.codes2 = 1;
  }
  // drop anything the roster no longer has
  const nk = k => OPS[k] ? k : LEGACY[k] || k;
  for (const k of Object.keys(s.ops)) if (!OPS[k] && OPS[nk(k)]) { if (!s.ops[nk(k)]) s.ops[nk(k)] = s.ops[k]; delete s.ops[k]; }
  // version 2: 1-on-1 tag battles. Teams shrink to three; the old two-slot Customize Parts become real parts
  // (Attack Ring, Weight Disk, Spin Gear or Blade Base) of the same grade and level, taken off for refitting.
  if (!s.v2) {
    const OLD = { Fatal: "spike", Blade: "smash", Rage: "upper", Despair: "smash", Revenge: "defring", Swift: "flat", Focus: "semiflat", Shield: "ball",
      Energy: "tenwide", Guard: "widedef", Endure: "eightheavy", Will: "neor", Violent: "egr", Nemesis: "magne" };
    s.parts = (s.runes || []).map((r, i) => ({ id: i + 1, m: OLD[r.set] || "wing", rar: clamp(r.rar || 1, 1, 5), lvl: r.lvl || 0, eq: null }));
    s.partSeq = s.parts.length + 1;
    delete s.runes; delete s.runeSeq;
    for (const k in s.ops) { delete s.ops[k].runes; s.ops[k].parts = { ar: null, wd: null, sg: null, bb: null }; }
    s.v2 = 1;
    s.v2mail = 1;
  }
  s.parts = s.parts || []; s.partSeq = s.partSeq || 1;
  for (const k in s.ops) if (!s.ops[k].parts) s.ops[k].parts = { ar: null, wd: null, sg: null, bb: null };
  for (const pt of s.parts) if (pt.eq) { pt.eq.k = nk(pt.eq.k); if (!s.ops[pt.eq.k]) pt.eq = null; }
  for (const k in s.team) s.team[k] = [...new Set(s.team[k].map(nk))].filter(x => OPS[x]).slice(0, TEAM_SIZE);
  s.assistant = nk(s.assistant);
  for (const k in s.ops) if (!OPS[k]) delete s.ops[k];
  if (!s.ops[s.assistant]) s.assistant = Object.keys(s.ops)[0] || STARTERS[0];
  // inbox, achievements, title screen (older saves are treated as named accounts and get the welcome gifts once)
  s.inbox = s.inbox || []; s.mailSeq = s.mailSeq || 0; s.inv = s.inv || {};
  s.stats = { ...newStats(), ...(s.stats || {}) };
  if (!s.playerId) s.playerId = String(100000000 + Math.floor(R() * 899999999));
  if (!s.created) s.created = Date.now();
  if (s.named == null) s.named = !!s.seenIntro;
  if (s.lastLogin == null) s.lastLogin = "";
  if (s.lastGift == null) s.lastGift = Date.now();
  if (s.lvlGift == null) s.lvlGift = Math.max(1, Math.floor(s.lvl / 5) * 5);
  if (!s.achv) { s.achv = {}; s.achBase = 1; }
  delete s.ach;
  if (!s.welcome) welcomeMail(s);
  if (s.v2mail) {
    delete s.v2mail;
    mailTo(s, { from: "Mr. Dickenson", tag: "gift", title: "New BBA rules: tag battles", noExp: 1,
      body: "From today, official battles are one on one, with tag partners! Teams are three Beyblades, and Customize Parts are now real parts: Attack Rings, Weight Disks, Spin Gears and Blade Bases. Your old parts were converted and taken off, so fit them again in each Beyblade's Customize tab. Here is something for your trouble.",
      rewards: { orundum: 600, permit: 3, part3: 3 } });
  }
  return s;
}
function start(data) {
  S = migrate((data && data.save) || load() || newSave());
  UI.huntLv = {};
  tickTimers();
  // saves from before achievements count what was already done, then get one gift instead of a flood of mail
  if (S.achBase) { checkAchievements(true); delete S.achBase; mailTo(S, { from: "BBA Records", tag: "gift", title: "BBA Records are open", body: "The BBA now keeps records of your feats. Everything you had already done is counted; here is a gift for it.", rewards: { orundum: 300, permit: 2 } }); }
  route("home");
  showTitle();
  let tick = 0;
  setInterval(() => {
    if (BT.on) { tickTimers(); return; }
    if (++tick % 30 === 0 && UI.inGame && $("#modal").hidden && $("#gacha").hidden && $("#dlg").hidden) { metaTick(); renderTop(); }
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
  window.addEventListener("pagehide", () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } } });
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ save: S }));
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start(window.claude && window.claude.hot && window.claude.hot.data || {});
</script>
