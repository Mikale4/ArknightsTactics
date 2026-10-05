
// =====================================================================
//  LAUNCHERS
// =====================================================================
const convWave = (w, lv) => w.map(s => s.op ? { op: s.op, LV: lv } : { en: s.e, LV: lv + (ENEMY[s.e].boss ? 3 : 0) });
const allySpecs = ids => ids.filter(owned).map(k => ({ op: k, prog: S.ops[k] }));
const recFor = lv => lv < 20 ? "rec1" : lv < 40 ? "rec2" : lv < 60 ? "rec3" : "rec4";
function squadOrToast(mode) {
  const ids = S.team[mode].filter(owned);
  if (!ids.length) { toast("Pick at least one operator."); return null; }
  return ids;
}
function opsXp(ids, xp) { for (const k of ids) opXp(k, xp); return { k: "xp", n: xp }; }
function rollRune(rars, sets) {
  let r = R(), rar = 1;
  for (let i = 0; i < rars.length; i++) { if (r < rars[i]) { rar = i + 1; break; } r -= rars[i]; rar = i + 1; }
  const rune = makeRune(pick(sets), rar); S.runes.push(rune);
  return { k: "rune", n: 1, rune };
}
function teamScreen(mode, title, cost, foes, back, launch) {
  closeModal();
  UI.team = null;
  route("team", { mode, title, cost, foes, from: mode === "story" ? "story" : "battle", back, launch });
}
function needSanity(n) {
  tickTimers();
  if (S.sanity >= n) return true;
  toast("Not enough Sanity."); sanityModal(); return false;
}
// a cleared chapter pays out once; returns the reward list when it just happened
function chapterPayout(ch) {
  if (S.chRw[ch.id] || !chapterCleared(ch)) return null;
  S.chRw[ch.id] = 1;
  return give(ch.reward);
}
function chapterModal(ch, list) {
  const i = CHAPTERS.indexOf(ch), nx = CHAPTERS[i + 1];
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <div class="eyebrow">Episode ${ch.no} cleared</div><h2>${esc(ch.title)}</h2>
    ${ch.reward.op ? `<img src="${spriteURL(OPS[ch.reward.op])}" alt="" style="height:200px;max-width:100%;object-fit:contain;filter:drop-shadow(0 10px 18px #000)"><p class="small"><b class="gold">${esc(OPS[ch.reward.op].n)}</b> has joined Rhodes Island.</p>` : ""}
    <div class="rewards">${rewardsHTML(list)}</div>
    ${nx ? `<p class="small dim">Episode ${nx.no}, ${esc(nx.title)}, is now open.</p><button class="btn wide" data-act="chapter" data-c="${nx.id}">Continue</button>` : `<p class="small dim">You have cleared every Main Theme episode so far.</p><button class="btn wide" data-act="closeModal">Close</button>`}
  </div>`);
  sfx("win");
}

// story scenes: the mood of the music follows the moment
function moodFor(nd, part) {
  if (nd.mood) return typeof nd.mood === "string" ? nd.mood : nd.mood[part] || "plot";
  if (nd.legacy === "5-7") return "frostnovadie";
  if (nd.id === "1-1") return "calm";
  if (nd.type === "boss") return part === "pre" ? "tense" : "warm";
  if (part === "post") return "warm";
  if (nd.type === "chest") return "calm";
  return +nd.ch.no >= 4 && nd.type === "story" ? "lonely" : "plot";
}
// battle music: bosses get their themes, the rest follows where the episode takes place
function nodeBgm(nd) {
  if (nd.bgm) return nd.bgm;
  const foes = nd.waves.flat().map(s => s.e);
  if (foes.includes("frostnova")) return "frostnova";
  if (foes.includes("mephisto") || foes.includes("faust")) return "mephisto";
  if (foes.includes("crownslayer") || foes.includes("skullshatterer")) return "bossLungmen";
  if (foes.includes("yeti")) return "yeti";
  const c = +nd.ch.no;
  return c <= 2 ? "chernobog" : c <= 4 ? "lungmen" : "normal2";
}
// ---------- story ----------
async function readStory(nd) {
  closeModal();
  if (UI.view !== "chapter") route("chapter", nd.ch.id);
  await playScene(nd.pre || [], `${nd.id} ${nd.name}`, nd.ch.env, moodFor(nd, "pre"));
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
  if (nd.pre) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.ch.env, moodFor(nd, "pre"));
  S.story[nd.id] = 1;
  const list = give(nd.reward);
  sfx("ui_reward"); rerender();
  const ch = chapterPayout(nd.ch);
  if (ch) chapterModal(nd.ch, ch); else rewardModal("Supplies recovered", list, `${nd.id} ${nd.name}`);
}
function nodeFoes(nd) { return nd.waves.flat().map(s => s.op ? { op: s.op, LV: nd.lv } : { en: s.e, LV: nd.lv }); }
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
  if (first && nd.pre && nd.pre.length) await playScene(nd.pre, `${nd.id} ${nd.name}`, nd.ch.env, moodFor(nd, "pre"));
  spendSanity(cost); S.stats.battles++; save();
  let chList = null;
  startBattle({
    allies: allySpecs(ids), waves: nd.waves.map(w => convWave(w, nd.lv)), env: nd.ch.env, bgm: nodeBgm(nd),
    title: nd.name, sub: `${nd.id} · ${nd.ch.title}`,
    onWin(res) {
      const goal = nodeTurnGoal(nd);
      const missions = [{ n: "Complete the operation", ok: true }, { n: "No operator falls", ok: !res.lost }, { n: `Clear within ${goal} of your turns`, ok: res.turns <= goal }];
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
      if (first && nd.post && nd.post.length) await playScene(nd.post, `${nd.id} ${nd.name}`, nd.ch.env, moodFor(nd, "post"));
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
function huntWaves(h, l) { const lv = HUNT_LV[l - 1]; return h.waves(lv).map(w => convWave(w, lv)); }
function huntDrops(h, l) {
  const list = [];
  for (let k = ri(2, 3); k > 0; k--) list.push(rollRune(HUNT_RAR[l - 1], h.sets));
  return list.concat(give({ lmd: 800 + l * 700, [recFor(HUNT_LV[l - 1])]: 2 }));
}
function launchHunt(id, l) {
  const h = HUNTS.find(x => x.id === id), cost = HUNT_COST[l - 1], ids = squadOrToast("hunt");
  if (!ids || !needSanity(cost)) return;
  route("hunt", id);
  spendSanity(cost); S.stats.battles++; save();
  startBattle({
    allies: allySpecs(ids), waves: huntWaves(h, l), env: h.env, bgm: { slug: "normal1", crypt: "normal2", frost: "yeti" }[h.id], title: h.n, sub: `Supplies · ${h.code}-${l}`,
    onWin() {
      S.hunt[id] = Math.max(S.hunt[id] || 0, l); S.stats.wins++; S.daily.clear++;
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
  S.daily.clear += 3; S.stats.battles += 3; S.stats.wins += 3;
  rerender(); rewardModal("Auto Deploy ×3", list, `${h.code}-${l} ${h.n}`);
}

// ---------- tower ----------
function launchTower(f) {
  const T = towerFloor(f), ids = squadOrToast("tower");
  if (!ids || f !== S.tower + 1) return;
  route("tower");
  S.stats.battles++;
  startBattle({
    allies: allySpecs(ids), waves: T.waves.map(w => convWave(w, T.lv)), env: T.env, bgm: "sss", title: `Floor ${f}`, sub: "Stationary Security Service",
    onWin() {
      S.tower = Math.max(S.tower, f); S.stats.wins++; S.daily.clear++;
      const list = give(T.reward); list.push(opsXp(ids, 50 + T.lv * 10));
      return { rewards: list };
    },
    retry: () => launchTower(f),
  });
}

// =====================================================================
//  ACTIONS (event delegation on data-act)
// =====================================================================
function quip() {
  const st = $(".stage"); if (!st) return;
  const key = S.assistant, lines = QUIPS[key] || QUIPS._;
  st.querySelector(".quip") && st.querySelector(".quip").remove();
  const q = document.createElement("div"); q.className = "quip";
  q.innerHTML = VOICED.has(key) && !muted() ? `<b>${esc(OPS[key].n)}</b><span class="voiceon">${IC.voice}</span>` : `<b>${esc(OPS[key] ? OPS[key].n : "")}</b>${esc(pick(lines))}`;
  voice(key, VO.tap);
  st.appendChild(q); sfx("tap");
  const img = st.querySelector(".assist");
  if (img) img.animate([{ transform: "translateX(-50%) translateY(0)" }, { transform: "translateX(-50%) translateY(-10px)" }, { transform: "translateX(-50%) translateY(0)" }], { duration: 360, easing: "ease-out" });
  clearTimeout(quip.t); quip.t = setTimeout(() => q.remove(), 3600);
}
function introModal() {
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <img src="${spriteURL(OPS.amiya)}" alt="Amiya" style="height:220px;max-width:100%;object-fit:contain;filter:drop-shadow(0 12px 20px #000)">
    <div class="eyebrow">Rhodes Island · Chernobog</div>
    <h1>Arknights<span style="display:block;color:var(--gold);font-size:20px;letter-spacing:.3em">Tactics</span></h1>
    <p class="small dim" style="max-width:36ch">Lead squads of four through the story, fill turn gauges, chain skills, and exploit the element wheel: Fire beats Wind, Wind beats Water, Water beats Fire, and Light and Dark counter each other.</p>
    <button class="btn wide" data-act="introGo">Begin Episode 1</button>
    <p class="tiny dim">Unofficial, non-commercial fan game. Arknights characters and art belong to Hypergryph and Yostar.</p>
  </div>`);
}
const ACT = {
  go: d => { if (d.v === "op" && d.a !== UI.arg) UI.opTab = "info"; closeModal(); route(d.v, d.a || null); },
  poke: () => quip(),
  missions: () => missionsModal(),
  settings: () => route("settings"),
  me: () => meModal(),
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
    if (k === 0) { toast("Tap a selected operator in the list below to remove them."); return; }
    ids.unshift(ids.splice(k, 1)[0]); sfx("tap"); voice(ids[0], VO.leader); rerender();
  },
  pickTeam: d => {
    const ids = UI.team.ids, i = ids.indexOf(d.k);
    if (i >= 0) ids.splice(i, 1);
    else if (ids.length >= 4) { toast("Your squad is full. Remove someone first."); return; }
    else { ids.push(d.k); voice(d.k, ids.length === 1 ? VO.leader : VO.squad, .8); }
    sfx("tap"); rerender();
  },
  deploy: () => {
    const a = UI.arg, L2 = a.launch;
    S.team[a.mode] = UI.team.ids.slice(); save();
    if (L2.kind !== "defense") voice(UI.team.ids[0], VO.depart);
    if (L2.kind === "node") launchNode(L2.id);
    else if (L2.kind === "hunt") launchHunt(L2.id, L2.l);
    else if (L2.kind === "tower") launchTower(L2.f);
    else if (L2.kind === "ladder") launchLadder(L2.i, L2.rev);
    else if (L2.kind === "defense") { route("arena"); toast("Defense squad saved."); }
    else if (L2.kind === "gboss") launchGuildBoss();
  },
  elf: d => { UI.el = d.e; rerender(); },

  // battle hub
  huntLv: d => { UI.huntLv[d.h] = +d.l; rerender(); },
  huntGo: d => {
    const h = HUNTS.find(x => x.id === d.h), l = +d.l;
    teamScreen("hunt", `${h.code}-${l} ${h.n}`, HUNT_COST[l - 1], huntWaves(h, l).flat(), ["hunt", h.id], { kind: "hunt", id: h.id, l });
  },
  huntSweep: d => sweepHunt(d.h, +d.l),
  towerGo: d => { const T = towerFloor(+d.f); teamScreen("tower", `SSS · Floor ${T.f}`, 0, T.waves.map(w => convWave(w, T.lv)).flat(), ["tower", null], { kind: "tower", f: T.f }); },
  arenaTab: d => { UI.arenaTab = d.t; rerender(); },
  ladderGo: d => {
    const i = +d.i, doc = ladderDoc(i);
    if (S.ladder.tickets <= 0) { toast("No Contract Tickets left."); return; }
    teamScreen("arena", `Contract · ${doc.name}`, 0, doc.team.map(k => ({ op: k })), ["arena", null], { kind: "ladder", i });
  },
  ladderRefresh: () => { if (Date.now() - S.ladder.oppT < REFRESH_MS) return; ladderOpps(true); sfx("tap"); rerender(); },
  ladderRevenge: d => {
    const i = +d.i, x = S.ladder.log.find(e => e.i === i && e.t === +d.t), doc = ladderDoc(i);
    if (!x || S.ladder.tickets <= 0) return;
    x.rev = true; closeModal();
    teamScreen("arena", `Revenge · ${doc.name}`, 0, doc.team.map(k => ({ op: k })), ["arena", null], { kind: "ladder", i, rev: true });
  },
  defense: () => teamScreen("defense", "Defense squad", 0, [], ["arena", null], { kind: "defense" }),
  rankings: d => rankingsModal(d.t),
  defLog: () => { defLogModal(); rerender(); },
  rtaFind: () => rtaFind(),
  rtaCancel: () => closeModal(),
  draftPick: d => draftDo(0, d.k),
  draftBan: d => draftBanDo(d.k),

  // operators
  toggleAll: () => { UI.all = !UI.all; rerender(); },
  clsf: d => { UI.cls = d.c; rerender(); },
  sortf: d => { UI.sort = d.s; rerender(); },
  opTab: d => { UI.opTab = d.t; rerender(); },
  skUp: d => { if (skillUp(d.k, +d.i)) { sfx("buff_atk"); toast(`Skill ${+d.i + 1} raised to Skill Level ${S.ops[d.k].sk[+d.i]}.`); } rerender(); },
  rec: d => { const lv = S.ops[d.k].lvl; if (useRecord(d.k, d.it)) { sfx("tap"); if (S.ops[d.k].lvl > lv) { S.daily.upgrade++; toast(`${OPS[d.k].n} reached level ${S.ops[d.k].lvl}.`); } } rerender(); },
  autoLv: d => { const lv = S.ops[d.k].lvl, n = autoLevel(d.k); if (n) { sfx("buff_atk"); if (S.ops[d.k].lvl > lv) S.daily.upgrade++; toast(`Used ${n} records. Level ${lv} → ${S.ops[d.k].lvl}.`); } rerender(); },
  promote: d => { if (promote(d.k)) { sfx("ui_win"); voice(d.k, S.ops[d.k].elite >= 2 ? VO.promo2 : VO.promo1); toast(`${OPS[d.k].n} promoted to Elite ${S.ops[d.k].elite}!`, "gold"); } rerender(); },
  assistant: d => { S.assistant = d.k; toast(`${OPS[d.k].n} is now your assistant.`); rerender(); },

  // runes
  runeSheet: d => { const r = runeById(+d.id); if (r) runeSheet(r); },
  equip: d => { equipRune(d.k, +d.s, +d.id); sfx("tap"); rerender(); },
  enhance: d => { const r = runeById(+d.id); if (r && enhanceRune(r)) { sfx("ui_mark"); rerender(); runeSheet(r); } },
  enhanceMax: d => { const r = runeById(+d.id); let n = 0; while (r && enhanceRune(r)) n++; if (n) { sfx("buff_def"); toast(`${runeSetName(r.set)} Module upgraded to +${r.lvl}.`); } rerender(); runeSheet(r); },
  unequip: d => { const r = runeById(+d.id); if (r && r.eq) unequipRune(r.eq.k, r.eq.s); rerender(); runeSheet(r); },
  sell: d => { const r = runeById(+d.id); if (!r) return; const v = sellValue(r); sellRune(r); closeModal(); toast(`Disassembled for ${fmtFull(v)} LMD.`); rerender(); },
  sellJunk: () => { const junk = S.runes.filter(r => !r.eq && r.rar <= 2); let v = 0; for (const r of junk) { v += sellValue(r); sellRune(r); } toast(`Disassembled ${junk.length} modules for ${fmtFull(v)} LMD.`); rerender(); },
  runeSetF: d => { UI.runeSet = d.s; rerender(); },
  depotTab: d => { UI.depotTab = d.t; rerender(); },

  // headhunt
  hhTab: d => { UI.hhB = d.std === "1" ? "standard" : bannersNow()[0].id; rerender(); },
  hhBanner: d => { UI.hhB = d.b; rerender(); },
  pull: async d => {
    const n = +d.n;
    if (n === 10 && d.ten && (S.inv.hh10 || 0) > 0) S.inv.hh10--;
    else if (S.permit >= n) S.permit -= n;
    else if (S.orundum >= 600 * n) S.orundum -= 600 * n;
    else { toast("Not enough Orundum or permits."); return; }
    const res = headhunt(n, UI.hhB || bannersNow()[0].id); save(); renderTop();
    // a 6★ is announced in World chat, and other Doctors react
    const six = res.find(r => OPS[r.key].rar === 6);
    if (six) { sysMsg("world", `${S.name} obtained 6★ ${OPS[six.key].n} from Headhunting!`); react("world", -1, "pull_win", onlineNow(), { six: OPS[six.key].n }); }
    await gachaReveal(res);
    rerender();
  },

  // missions
  claimDaily: d => {
    const m = DAILIES.find(x => x.id === d.id);
    if (!m || S.daily.claimed[m.id] || (S.daily[m.id] || 0) < m.goal) return;
    S.daily.claimed[m.id] = 1; give(m.reward); sfx("ui_reward"); rerender(); missionsModal();
  },
  claimAllDaily: () => { if (S.daily.claimed.all) return; S.daily.claimed.all = 1; give(DAILY_ALL); sfx("win"); rerender(); missionsModal(); },
  claimAch: d => {
    const a = ACHIEVEMENTS.find(x => x.id === d.id);
    if (!a || S.ach[a.id] || !a.test()) return;
    S.ach[a.id] = 1; give(a.reward); sfx("ui_reward"); rerender(); missionsModal();
  },

  // shop
  shopTab: d => { UI.shopTab = d.t; rerender(); },
  buy: d => {
    const it = SHOP[d.t].find(x => x.id === d.id), cur = d.t;
    if (!it || S[cur] < it.cost) { toast("Not enough currency."); return; }
    S[cur] -= it.cost;
    const list = give(it.give); sfx("ui_reward");
    if (UI.view === "shop") rerender(); else renderTop();
    rewardModal("Purchased", list, it.n);
  },

  // settings
  toggleSound: () => { setAudioPref("mute", !muted()); settingsModal(false); },
  vol: (d, el) => setAudioPref(d.k, +el.value / 100),
  cycleAi: () => { const o = AI_STYLES; S.settings.ai = o[(o.indexOf(S.settings.ai) + 1) % o.length]; save(); settingsModal(false); },
  askReset: () => settingsModal(true),
  doReset: () => { const nm = S.name; try { localStorage.removeItem(SAVE_SLOT); } catch (e) { /* storage unavailable */ } S = migrate(newSave()); S.name = nm; closeModal(); route("home"); introModal(); },
  logout: () => { closeModal(); logout(); },
  saveName: () => { const v = ($("#pname") || {}).value; S.name = (v || "").trim().slice(0, 16) || "Doctor"; closeModal(); rerender(); },
};
Object.assign(ACT, SOCIAL_ACT);
document.addEventListener("input", e => { const el = e.target.closest("[data-act=vol]"); if (el) ACT.vol(el.dataset, el); });
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
  // the old Contract (rank list) became the tiered ladders
  if (!s.ladder) s.ladder = ladderInit();
  if (!s.rta) s.rta = rtaInit();
  delete s.arena;
  if (!s.team.defense) s.team.defense = (s.team.arena || []).slice();
  if (s.prime == null) s.prime = 6;
  if (s.credit == null) s.credit = 300;
  if (!s.codes2) {
    // stage codes moved to Arknights style (side stages S1-1…); carry stars across by position
    const old = s.story || {}; s.story = {};
    for (const id in NODES) { const nd = NODES[id]; if (old[nd.legacy]) s.story[id] = old[nd.legacy]; }
    s.codes2 = 1;
  }
  for (const k in s.team) s.team[k] = s.team[k].filter(x => OPS[x]);
  for (const k in s.ops) if (!OPS[k]) delete s.ops[k];
  if (!s.ops[s.assistant]) s.assistant = Object.keys(s.ops)[0] || "amiya";
  s.mail = s.mail || []; s.npc = s.npc || {}; s.team.gboss = s.team.gboss || (s.team.story || []).slice(); s.inv.hh10 = s.inv.hh10 || 0; s.stats = s.stats || { battles: 0, wins: 0 };
  if (s.pendingPay) { s.pendingMail = s.pendingPay; delete s.pendingPay; }
  return s;
}
// loads the save in `slot` and opens the lobby (called by the title screen, the Demo and hot reloads)
function enterGame(slot, opts = {}) {
  SAVE_SLOT = slot;
  S = migrate(opts.save || load() || newSave());
  if (!S.welcomed) { S.welcomed = 1; welcomeMail(); }
  for (const p of S.pendingMail || []) sendMail({ kind: "contract", title: `Weekly rewards · ${p.label}`, body: "Your weekly Contract rewards (already added to your account).", rewards: null });
  delete S.pendingMail;
  if (opts.name && (!S.seenIntro || S.name === "Doctor")) S.name = opts.name;
  Object.assign(UI, { view: "home", arg: null, team: null, opTab: "info", el: "all", cls: "all", all: false, hhB: null, huntLv: {} });
  closeModal();
  tickTimers();
  applySettings();
  route("home");
  if (!S.seenIntro) introModal();
  else voice(S.assistant, VO.greet, .9);
}
let booted = false;
function start(data) {
  if (!booted) {
    booted = true;
    setInterval(() => {
      if (!S) return;
      if (BT.on) { tickTimers(); return; }
      const sig = () => [S.sanity, S.ladder.tickets, S.ladder.log.length].join("|");
      const before = sig();
      tickTimers();
      const now = Date.now(), L = S.ladder;
      if (before !== sig()) { save(); if (UI.view === "arena" && !$("#modal").innerHTML) rerender(); else renderTop(); }
      for (const el of $$("[data-cd]")) {
        const left = { tix: TICKET_MS - (now - L.tTime), ref: REFRESH_MS - (now - L.oppT) }[el.dataset.cd];
        el.textContent = dur(Math.max(0, left));
      }
    }, 1000);
    const flush = () => { if (S) { try { localStorage.setItem(SAVE_SLOT, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } } };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ save: S, slot: SAVE_SLOT }));
  }
  if (data && data.save) { SESSION = { id: "hot", name: data.save.name }; enterGame(data.slot || SAVE_KEY, { save: data.save }); }
  else showTitle();
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start(window.claude && window.claude.hot && window.claude.hot.data || {});
</script>
