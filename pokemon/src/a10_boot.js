
// =====================================================================
//  LAUNCHERS
// =====================================================================
const convWave = (w, lv) => w.map(s => ({ op: s.op, LV: s.LV || lv, boss: s.boss, hpX: s.hpX, moves: s.moves }));
const allySpecs = ids => ids.filter(owned).map(k => ({ op: k, prog: S.ops[k] }));
const recFor = lv => lv < 20 ? "rec1" : lv < 40 ? "rec2" : lv < 60 ? "rec3" : "rec4";
const battleXp = lv => Math.round(30 + lv * lv * .75);
function squadOrToast(mode) {
  const ids = S.team[mode].filter(owned);
  if (!ids.length) { toast("Choose at least one Pokémon."); return null; }
  return ids;
}
// Exp. for the team; returns the level-up report for the results screen
function opsXp(ids, xp) {
  return ids.filter(owned).map(k => {
    const p = S.ops[k], from = p.lvl, cap = p.lvl >= levelCap();
    opXp(k, xp);
    if (p.lvl > from) S.daily.upgrade++;
    return { k, from, to: p.lvl, xp, cap, evo: canEvolveNow(k) };
  });
}
function teamScreen(mode, title, cost, foes, back, launch) {
  closeModal();
  UI.team = null;
  route("team", { mode, title, cost, foes, from: mode === "story" ? "story" : "battle", back, launch });
}
function needSanity(n) {
  tickTimers();
  if (S.sanity >= n) return true;
  toast("Not enough PP."); sanityModal(); return false;
}
function chapterPayout(ch) {
  if (S.chRw[ch.id] || !chapterCleared(ch)) return null;
  S.chRw[ch.id] = 1;
  return give(ch.reward);
}
function chapterModal(ch, list) {
  const i = STORY[0].chapters.indexOf(ch), nx = STORY[0].chapters[i + 1];
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <div class="eyebrow">Chapter ${ch.no} complete</div><h2>${esc(ch.title)}</h2>
    ${ch.reward.op ? `<img class="px" src="${sprFull(ch.reward.op)}" alt="" style="height:150px;image-rendering:pixelated"><p class="small"><b>${esc(OPS[ch.reward.op].n)}</b> joined your team!</p>` : ""}
    <div class="rewards">${rewardsHTML(list)}</div>
    ${nx ? `<p class="small dim">Chapter ${nx.no}, ${esc(nx.title)}, is now open.</p><button class="btn wide" data-act="chapter" data-c="${nx.id}">Continue</button>` : `<p class="small dim">You've seen everything Kanto has to offer... for now.</p><button class="btn wide" data-act="closeModal">Close</button>`}
  </div>`);
  sfx("win");
}
function badgeModal(i, then) {
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <div class="eyebrow">${BADGES[i].gym}</div><div class="bigbadge">${badgeSVG(i)}</div>
    <h2>You received the ${BADGES[i].n}!</h2>
    <p class="small dim">Your Pokémon now obey you up to <b>Lv ${LV_CAPS[i + 1]}</b>, and get +5% ${BADGES[i].sn}.</p>
    <button class="btn wide" data-act="closeModal">OK</button></div>`);
  sfx("win");
  if (then) { const m = $("#modal"); const obs = new MutationObserver(() => { if (m.hidden) { obs.disconnect(); then(); } }); obs.observe(m, { attributes: true }); }
}

// ---------- journey ----------
let STARTER_RES = null;
async function readStory(nd) {
  closeModal();
  if (UI.view !== "chapter") route("chapter", nd.ch.id);
  await playScene(nd.pre || [], `${nd.id} ${nd.name}`, nd.env);
  if (nd.starter && !S.starter) {
    await new Promise(res => { STARTER_RES = res; starterModal(); });
    if (nd.post) await playScene(nd.post, `${nd.id} ${nd.name}`, nd.env);
  }
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
  if (nd.pre) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.env);
  S.story[nd.id] = 1;
  const list = give(nd.reward);
  sfx("heal"); rerender();
  const ch = chapterPayout(nd.ch);
  if (ch) chapterModal(nd.ch, ch); else rewardModal("Received!", list, `${nd.id} ${nd.name}`);
}
function nodeFoes(nd) { return nodeWaves(nd).flat().map(s => ({ op: s.op, LV: s.LV || nd.lv })); }
function nodeDrops(nd, first) {
  const lv = nd.lv || 5;
  return first ? { orundum: nd.type === "boss" ? 150 : nd.type === "side" ? 100 : 60, lmd: 100 + lv * 25, [recFor(lv)]: 3 }
    : { lmd: 80 + lv * 18, [recFor(lv)]: 2, ...(lv >= 20 ? { summ: 1 } : {}) };
}
async function launchNode(id) {
  const nd = NODES[id], cost = nodeCost(nd), ids = squadOrToast("story");
  if (!ids || !needSanity(cost)) return;
  const first = !nodeStars(id);
  route("chapter", nd.ch.id);
  if (first && nd.pre && nd.pre.length) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.env);
  spendSanity(cost); S.stats.battles++; save();
  let chList = null, badgeGot = null;
  const waves = nodeWaves(nd).map(w => convWave(w, nd.lv));
  startBattle({
    allies: allySpecs(ids), waves, env: nd.env, weather: nd.weather, wild: !!nd.wild,
    trainer: nd.trainer && nd.trainer.name, trainerSpr: nd.trainer && nd.trainer.spr, intro: nd.trainer && nd.trainer.intro, lose: nd.trainer && nd.trainer.lose, ball: nd.trainer && nd.trainer.ball,
    title: nd.name, sub: `${nd.id} · ${nd.ch.title}`,
    onWin(res, B) {
      const goal = nodeTurnGoal(nd);
      const missions = [{ n: "Win the battle", ok: true }, { n: "None of your Pokémon fainted", ok: !res.lost }, { n: `Win within ${goal} of your turns`, ok: res.turns <= goal }];
      const stars = missions.filter(m => m.ok).length, prev = nodeStars(id);
      S.story[id] = Math.max(prev, stars);
      S.stats.wins++; S.daily.clear++;
      const list = give(nodeDrops(nd, first));
      if (stars === 3 && prev < 3) list.push(...give({ prime: 1 }));
      if (B.tally.payday) list.push(...give({ lmd: B.tally.payday }));
      const pick = ids.some(k => S.ops[k] && OPS[k].passives.some(p => p.id === "PICKUP")); if (pick) list.push(...give({ lmd: 100 + nd.lv * 20 }));
      const cat = nd.catch && first ? nd.catch : null;
      if (cat) { const lvAt = Math.min(levelCap(), (waves.flat().find(s => s.op === cat) || {}).LV || nd.lv); const r = grantOp(cat, lvAt); list.unshift({ k: "op:" + cat, n: 1, isNew: r.isNew }); }
      if (nd.gift && first) { const r = grantOp(nd.gift, Math.min(levelCap(), nd.lv)); list.unshift({ k: "op:" + nd.gift, n: 1, isNew: r.isNew }); }
      if (nd.badgeWin != null && S.badges <= nd.badgeWin) { S.badges = nd.badgeWin + 1; badgeGot = nd.badgeWin; }
      if (nd.champion && !S.champion) S.champion = true;
      const levels = opsXp(ids, battleXp(nd.lv));
      chList = chapterPayout(nd.ch);
      return { rewards: list, missions, levels };
    },
    onLose() { S.sanity += Math.max(0, cost - 1); return { rewards: [] }; },
    onQuit() { S.sanity += Math.max(0, cost - 1); save(); },
    async onClose(res) {
      if (!res.win) return;
      if (first && nd.post && nd.post.length) await playScene(nd.post, `${nd.id} ${nd.name}`, nd.env);
      rerender();
      const fin = () => { if (chList) chapterModal(nd.ch, chList); };
      if (badgeGot != null) badgeModal(badgeGot, fin); else fin();
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
  opsXp(ids, battleXp(nd.lv) * x);
  list.push({ k: "xp", n: battleXp(nd.lv) * x });
  S.daily.clear += x; S.stats.battles += x; S.stats.wins += x;
  closeModal(); rerender();
  rewardModal(x > 1 ? `Quick Battle ×${x}` : "Quick Battle", list, `${nd.id} ${nd.name}`);
}

// ---------- explore ----------
function huntWaves(h, l) { return huntWavesSpec(h, l).map(w => convWave(w, HUNT_LV[l - 1])); }
function huntDrops(h, l) {
  const list = [], lv = HUNT_LV[l - 1];
  if (R() < (h.stone === "linkcord" ? .1 + l * .04 : .2 + l * .08)) list.push(...give({ [h.stone]: 1 }));
  if (R() < .1 + l * .05) list.push(...give({ summ: 1 }));
  if (R() < Math.min(.9, .25 + l * .12)) {
    const pool = h.items.filter(k => HELD[k].t < 3 || l >= 4);
    list.push(...give({ held: pick(pool) }));
  }
  return list.concat(give({ lmd: 800 + l * 700, [recFor(lv)]: 2 }));
}
function launchHunt(id, l) {
  const h = HUNTS.find(x => x.id === id), cost = HUNT_COST[l - 1], ids = squadOrToast("hunt");
  if (!ids || !needSanity(cost)) return;
  route("hunt", id);
  spendSanity(cost); S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), waves: huntWaves(h, l), env: h.env, weather: h.weather, wild: true, title: h.n, sub: `Explore · ${h.code}-${l}`,
    onWin() {
      S.hunt[id] = Math.max(S.hunt[id] || 0, l); S.stats.wins++; S.stats.patrols++; S.daily.clear++;
      const list = huntDrops(h, l);
      return { rewards: list, levels: opsXp(ids, battleXp(HUNT_LV[l - 1])) };
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
  opsXp(S.team.hunt.filter(owned), battleXp(HUNT_LV[l - 1]) * 3);
  S.daily.clear += 3; S.stats.battles += 3; S.stats.wins += 3; S.stats.patrols += 3;
  rerender(); rewardModal("Quick Battle ×3", list, `${h.code}-${l} ${h.n}`);
}

// ---------- Battle Tower ----------
function launchTower(f) {
  const T = towerFloor(f), ids = squadOrToast("tower");
  if (!ids || f !== S.tower + 1) return;
  route("tower");
  S.stats.battles++;
  startBattle({
    allies: allySpecs(ids), waves: T.waves.map(w => convWave(w, T.lv)), env: T.env, title: `Floor ${f}`, sub: "Battle Tower",
    trainer: T.trainer.name, trainerSpr: T.trainer.spr, intro: T.trainer.intro, lose: T.trainer.lose, ball: T.trainer.ball,
    onWin() {
      S.tower = Math.max(S.tower, f); S.stats.wins++; S.daily.clear++;
      return { rewards: give(T.reward), levels: opsXp(ids, Math.round(battleXp(T.lv) * .6)) };
    },
    retry: () => launchTower(f),
  });
}

// ---------- Link Battles ----------
function launchArena(k) {
  tickTimers();
  const A = S.arena, o = A.opps && A.opps[k], ids = squadOrToast("arena");
  if (!o || !ids) return;
  if (A.attempts <= 0) { toast("No battles left. One refills every 10 minutes."); return; }
  route("arena");
  if (A.attempts >= 5) A.aTime = Date.now();
  A.attempts--; S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), waves: [o.team.map(u => ({ op: u.op, LV: u.LV }))], env: "gym", title: `${o.cls[0]} ${o.name}`, sub: `Link Battle · Rank #${o.rank}`,
    trainer: `${o.cls[0]} ${o.name}`, trainerSpr: o.cls[1], intro: "Let's battle!", lose: "Good game!", ball: "great",
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
  const st = $(".stage"); if (!st || !S.assistant) return;
  const key = S.assistant, lines = QUIPS[key] || QUIPS._;
  st.querySelector(".quip") && st.querySelector(".quip").remove();
  const q = document.createElement("div"); q.className = "quip";
  q.innerHTML = `<b>${esc(OPS[key].n)}</b>${esc(pick(lines))}`;
  st.appendChild(q); sfx("tap");
  const img = st.querySelector(".assist");
  if (img) img.animate([{ transform: "translateX(-50%) translateY(0)" }, { transform: "translateX(-50%) translateY(-16px)" }, { transform: "translateX(-50%) translateY(0)" }], { duration: 360, easing: "ease-out" });
  clearTimeout(quip.t); quip.t = setTimeout(() => q.remove(), 3600);
}
function introModal() {
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <img class="px" src="${trainerURL("oak")}" alt="Professor Oak" style="height:120px;image-rendering:pixelated">
    <div class="eyebrow">Pallet Town</div>
    <h1>Welcome to Kanto!</h1>
    <p class="small dim" style="max-width:36ch">Lead a team of up to four Pokémon. Every move has a type: hit a Pokémon's weakness for double damage, and moves that match the user's type get a 50% boost. Earn the eight Gym Badges to raise your level cap, evolve your Pokémon, catch more in the Safari Zone, and fill your Pokédex.</p>
    <button class="btn wide" data-act="introGo">Visit Professor Oak</button>
    <p class="tiny dim">Unofficial, non-commercial fan game. Pokémon © Nintendo, Game Freak and Creatures Inc. Sprites from Pokémon Showdown.</p>
  </div>`);
}
const ACT = {
  ...META_ACT,
  ...GB_ACT,
  go: d => { if (d.v === "op" && d.a !== UI.arg) UI.opTab = "info"; closeModal(); route(d.v, d.a || null); },
  poke: () => quip(),
  missions: () => missionsModal(),
  settings: () => { closeModal(); route("settings"); },
  sanity: () => sanityModal(),
  closeModal: () => closeModal(),
  introGo: () => { S.seenIntro = true; closeModal(); route("chapter", "c1"); nodeSheet(NODES["1-1"]); },
  pickStarter: d => {
    if (S.starter) return;
    S.starter = d.k; grantOp(d.k, 5); S.ops[d.k].pot = 3; S.assistant = d.k;
    for (const m in S.team) S.team[m] = [d.k];
    closeModal(); sfx("win"); toast(`You chose ${OPS[d.k].n}!`, "gold"); save();
    if (STARTER_RES) { const r = STARTER_RES; STARTER_RES = null; r(); }
  },

  // journey
  chapter: d => { closeModal(); route("chapter", d.c); },
  openNode: d => {
    const nd = NODES[d.id];
    if (!nodeOpen(nd)) { toast(nd.type === "side" ? "Clear the stage before this side stage first." : "Clear the previous stage first."); return; }
    if (UI.view !== "chapter" || UI.arg !== nd.ch.id) route("chapter", nd.ch.id);
    nodeSheet(nd);
  },
  startNode: d => {
    const nd = NODES[d.id];
    if (nd.type === "story") return readStory(nd);
    if (nd.type === "chest") return openChest(nd);
    if (!S.starter) { toast("Choose your first Pokémon at Professor Oak's lab first."); return; }
    teamScreen("story", `${nd.id} ${nd.name}`, nodeCost(nd), nodeFoes(nd), ["chapter", nd.ch.id], { kind: "node", id: nd.id });
  },
  sweep: d => sweepNode(d.id, +d.x),

  // team select
  teamBack: () => { const b = UI.arg && UI.arg.back; UI.team = null; route(b ? b[0] : "home", b ? b[1] : null); },
  slot: d => { UI.team.ids.splice(+d.k, 1); sfx("tap"); rerender(); },
  pickTeam: d => {
    const ids = UI.team.ids, i = ids.indexOf(d.k);
    if (i >= 0) ids.splice(i, 1);
    else if (ids.length >= 4) { toast("Your team is full. Tap a Pokémon at the top to remove it."); return; }
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

  // battle hub
  huntLv: d => { UI.huntLv[d.h] = +d.l; rerender(); },
  huntGo: d => {
    const h = HUNTS.find(x => x.id === d.h), l = +d.l;
    teamScreen("hunt", `${h.code}-${l} ${h.n}`, HUNT_COST[l - 1], huntWaves(h, l).flat(), ["hunt", h.id], { kind: "hunt", id: h.id, l });
  },
  huntSweep: d => sweepHunt(d.h, +d.l),
  towerGo: d => { const T = towerFloor(+d.f); teamScreen("tower", `Battle Tower · Floor ${T.f}`, 0, T.waves.map(w => convWave(w, T.lv)).flat(), ["tower", null], { kind: "tower", f: T.f }); },
  arenaGo: d => {
    const o = S.arena.opps[+d.k];
    if (S.arena.attempts <= 0) { toast("No battles left."); return; }
    teamScreen("arena", `Link Battle · ${o.name}`, 0, o.team, ["arena", null], { kind: "arena", k: +d.k });
  },
  newOpps: () => { genOpps(); sfx("tap"); rerender(); },
  payout: () => {
    tickTimers();
    if (Date.now() - S.arena.payTime < PAYOUT_MS) return;
    const list = give(payout(S.arena.rank)); S.arena.payTime = Date.now();
    rerender(); rewardModal("Link Battle rewards", list, `Rank #${S.arena.rank}`);
  },

  // Pokémon
  toggleAll: () => { UI.all = !UI.all; rerender(); },
  clsf: d => { UI.cls = d.c; rerender(); },
  sortf: d => { UI.sort = d.s; rerender(); },
  opTab: d => { UI.opTab = d.t; rerender(); },
  skUp: d => { if (skillUp(d.k, +d.i)) { sfx("heal"); toast(`${OPS[d.k].skills[+d.i].name}: Mastery ${RANK[S.ops[d.k].sk[+d.i]]}.`); } rerender(); },
  rec: d => { const lv = S.ops[d.k].lvl; if (useRecord(d.k, d.it)) { sfx("tap"); if (S.ops[d.k].lvl > lv) { S.daily.upgrade++; toast(`${OPS[d.k].n} grew to Lv ${S.ops[d.k].lvl}!`); } } rerender(); },
  autoLv: d => { const lv = S.ops[d.k].lvl, n = autoLevel(d.k); if (n) { sfx("heal"); if (S.ops[d.k].lvl > lv) S.daily.upgrade++; toast(`Used ${n} Exp. Candy. Lv ${lv} → ${S.ops[d.k].lvl}.`); } rerender(); },
  evolve: async d => {
    const from = d.k, to = d.to;
    if (!evoOptions(from).some(o => o.to === to && o.ok)) return;
    await evolveScene(from, to);
    if (evolve(from, to)) { UI.opTab = "info"; route("op", to); checkAchievements(); }
  },
  hold: d => { if (equipHeld(d.k, d.it)) { sfx("tap"); toast(`${OPS[d.k].n} is now holding the ${HELD[d.it].n}.`); } rerender(); },
  unhold: d => { equipHeld(d.k, null); sfx("tap"); rerender(); },
  assistant: d => { S.assistant = d.k; toast(`${OPS[d.k].n} is now your partner!`); rerender(); },
  depotTab: d => { UI.depotTab = d.t; rerender(); },
  dexF: d => { UI.dexF = d.v; rerender(); },
  dexEntry: d => dexModal(d.k),

  // Safari Zone
  hhTab: d => { UI.hhStd = d.std === "1"; rerender(); },
  pull: async d => {
    const n = +d.n;
    if (S.permit >= n) S.permit -= n;
    else if (S.orundum >= 600 * n) S.orundum -= 600 * n;
    else { toast("Not enough Gems or Safari Balls."); return; }
    const res = headhunt(n, !UI.hhStd); save(); renderTop();
    await gachaReveal(res);
    checkAchievements(); rerender();
  },

  // research
  claimDaily: d => {
    const m = DAILIES.find(x => x.id === d.id);
    if (!m || S.daily.claimed[m.id] || (S.daily[m.id] || 0) < m.goal) return;
    S.daily.claimed[m.id] = 1; give(m.reward); sfx("heal"); renderTop(); missionsModal();
  },
  claimAllDaily: () => { if (S.daily.claimed.all) return; S.daily.claimed.all = 1; give(DAILY_ALL); sfx("win"); renderTop(); missionsModal(); },

  // shops
  shopTab: d => { UI.shopTab = d.t; rerender(); },
  buy: d => {
    const sh = SHOP[d.t], it = sh && sh.items.find(x => x.id === d.id), cur = sh && sh.cur;
    if (!it || have(cur) < it.cost) { toast(`Not enough ${itemName(cur)}.`); return; }
    if (WALLET.includes(cur)) S[cur] -= it.cost; else S.inv[cur] -= it.cost;
    let list;
    if (it.give.op) { const r = grantOp(it.give.op); list = [{ k: "op:" + it.give.op, n: 1, isNew: r.isNew }]; }
    else list = give(it.give);
    sfx("heal");
    if (UI.view === "shop") rerender(); else renderTop();
    rewardModal(d.t === "elixir" ? "PP restored!" : "Thank you!", list, it.n);
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
  const fresh = newSave();
  for (const k in fresh) if (s[k] == null) s[k] = fresh[k];
  s.dex = { seen: {}, caught: {}, ...(s.dex || {}) };
  s.held = s.held || {}; s.inv = s.inv || {}; s.hunt = s.hunt || {}; s.chRw = s.chRw || {};
  s.stats = { ...newStats(), ...(s.stats || {}) };
  s.settings = { ...fresh.settings, ...(s.settings || {}) };
  for (const k of Object.keys(s.ops)) { if (!OPS[k]) { delete s.ops[k]; continue; } const p = s.ops[k]; p.sk = (p.sk || [1, 1, 1]).map(v => Math.min(MAX_SK, v)); if (p.held === undefined) p.held = null; s.dex.caught[k] = 1; s.dex.seen[k] = 1; }
  for (const k in s.team) s.team[k] = (s.team[k] || []).filter(x => s.ops[x]);
  if (!s.ops[s.assistant]) s.assistant = Object.keys(s.ops)[0] || null;
  s.inbox = s.inbox || [];
  if (!s.welcome) welcomeMail(s);
  return s;
}
function start(data) {
  S = migrate((data && data.save) || load() || newSave());
  UI.huntLv = {};
  tickTimers();
  gbInit(); applyShell();
  route("home");
  showTitle();
  preloadSprites().then(() => { if (UI.inGame && $("#modal").hidden && $("#gacha").hidden && $("#dlg").hidden && !BT.on) rerender(); });
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
