
// =====================================================================
//  BATTLE LAUNCHERS
// =====================================================================
function squadUnits(ids) { return ids.filter(owned).map(id => ({ id, prog: S.roster[id] })); }

function campaignRewards(node, stars, sim) {
  const list = [], c = node.c;
  const credits = Math.round((90 + node.idx * 28) * (stars === 3 ? 1.2 : 1));
  S.credits += credits; list.push({ k: "credits", n: credits });
  const sal = c < 2 ? "sal1" : c < 4 ? (R() < .5 ? "sal1" : "sal2") : (R() < .5 ? "sal2" : "sal3");
  const sn = ri(2, 4) + Math.floor(c / 2); give({ [sal]: sn }); list.push({ k: sal, n: sn });
  if (R() < .45) { const m = ri(1, 2) + Math.floor(c / 3); give({ mats: m }); list.push({ k: "mats", n: m }); }
  if (R() < (sim ? .45 : .35)) { const d = c < 3 ? "droid1" : "droid2"; give({ [d]: 1 }); list.push({ k: d, n: 1 }); }
  if (R() < (node.boss ? .75 : .6)) { const s = ri(1, node.boss ? 3 : 2); addShards(node.shard, s); list.push({ k: "shard:" + node.shard, n: s }); }
  return list;
}
function launchCampaign(table, c, n) {
  const node = nodeInfo(table, c, n), ids = UI.squad && UI.squad.key === table ? UI.squad.ids : S.squads[table];
  const allies = squadUnits(ids);
  if (!allies.length) return toast("Pick at least one hero.");
  if (S.energy < node.energy) { refillModal(); return; }
  S.squads[table] = allies.map(a => a.id);
  spendEnergy(node.energy); S.stats.battles++; save();
  closeModal();
  startBattle({
    allies, waves: node.waves, env: ENV_FOR[table][c], side: table,
    title: `Battle ${node.key}`, sub: `${CAMPAIGN[table].n} · ${CAMPAIGN[table].chapters[c].n}`,
    onWin(res) {
      S.stats.wins++; S.daily.wins++;
      const prev = S.camp[table][node.key] || 0;
      S.camp[table][node.key] = Math.max(prev, res.stars);
      const list = campaignRewards(node, res.stars, false);
      const xp = 40 + node.idx * 32;
      for (const a of allies) charXp(a.id, xp);
      list.push({ k: "xp", n: xp });
      if (res.stars === 3 && !S.firstClear[table + node.key]) { S.firstClear[table + node.key] = 1; S.crystals += 20; list.push({ k: "crystals", n: 20 }); }
      if (n === 4 && prev === 0 && c < 5) toast(`Chapter ${c + 2} unlocked!`, "gold");
      return list;
    },
    onLose() { const back = node.energy - 1; S.energy += back; return back > 0 ? [{ k: "energy", n: back }] : []; },
    onQuit() { S.energy += node.energy - 1; save(); renderTop(); },
    retry: () => launchCampaign(table, c, n),
  });
}
function simNode(table, c, n, times) {
  const node = nodeInfo(table, c, n);
  if ((S.camp[table][node.key] || 0) < 3) return;
  times = Math.min(times, Math.floor(S.energy / node.energy));
  if (times < 1) return refillModal();
  const all = [];
  for (let k = 0; k < times; k++) { spendEnergy(node.energy); all.push(...campaignRewards(node, 3, true)); S.daily.wins++; S.stats.wins++; S.stats.battles++; }
  save();
  rewardModal(times > 1 ? `Simmed ×${times}` : "Battle simmed", all, `${CAMPAIGN[table].n} · ${node.key}`);
  renderTop();
}
function launchArena(k) {
  const A = S.arena, opp = A.opps[k];
  const ids = UI.squad && UI.squad.key === "arena" ? UI.squad.ids : S.squads.arena;
  const allies = squadUnits(ids);
  if (!allies.length) return toast("Pick at least one hero.");
  if (A.attempts <= 0) return toast("No attempts left. One recharges every 10 minutes.");
  if (A.attempts >= 5) A.aTime = Date.now();
  A.attempts--; S.squads.arena = allies.map(a => a.id); S.stats.battles++; save();
  startBattle({
    allies, waves: [opp.team.map(u => ({ ...u, ab: [...u.ab] }))], env: "arena", side: "light", stars: false,
    title: "Squad Arena", sub: `vs ${opp.name} · Rank #${opp.rank}`,
    onWin() {
      S.stats.wins++; S.daily.arena++;
      const list = [{ k: "tokens", n: 40 }]; S.tokens += 40;
      if (opp.rank < A.rank) { A.rank = opp.rank; list.unshift({ k: "rank", n: A.rank }); }
      genOpps();
      return list;
    },
    onLose() { return []; },
    onClose() { UI.view = "arena"; UI.arg = null; },
    onQuit() { UI.view = "arena"; UI.arg = null; },
  });
}

// =====================================================================
//  ACTIONS (event delegation via data-act)
// =====================================================================
const ACT = {
  go(d) { closeModal(); if (d.v !== "squad") UI.squad = null; route(d.v, d.a || null); },
  back() { const a = UI.arg; UI.squad = null; route(a && a.mode === "arena" ? "arena" : "battles", a && a.table); },
  chap(d) { UI.chap[UI.table] = +d.c; rerender(); },
  node(d) { if (d.t) { UI.table = d.t; UI.chap[d.t] = +d.c; route("battles", d.t); } nodeModal(UI.table, +d.c, +d.n); },
  toSquad(d) { closeModal(); UI.squad = null; route("squad", { mode: "campaign", table: d.t, c: +d.c, n: +d.n }); },
  sim(d) { closeModal(); simNode(d.t, +d.c, +d.n, +d.x); rerender(); },
  pickSq(d) {
    const ids = UI.squad.ids, i = ids.indexOf(d.id);
    if (i >= 0) ids.splice(i, 1); else if (ids.length < 5) ids.push(d.id); else return toast("Your squad is full. Tap a squad member to swap them out.");
    sfxMenu(); rerender();
  },
  slot(d) {
    const k = +d.k, ids = UI.squad.ids, id = ids[k];
    openModal(`<div class="stack"><div class="row">${ptHTML(id, { s: 56 })}<div><h3>${esc(CH[id].n)}</h3><p class="tiny dim">${CH[id].lead ? esc(CH[id].lead.n) + ": " + esc(CH[id].lead.d) : "No leader ability."}</p></div></div>
      ${k > 0 ? `<button class="btn wide" data-act="makeLead" data-k="${k}">Make leader</button>` : ""}
      <button class="btn ghost wide" data-act="rmSlot" data-k="${k}">Remove from squad</button></div>`);
  },
  makeLead(d) { const ids = UI.squad.ids, [id] = ids.splice(+d.k, 1); ids.unshift(id); closeModal(); rerender(); },
  rmSlot(d) { UI.squad.ids.splice(+d.k, 1); closeModal(); rerender(); },
  fight() {
    const a = UI.arg;
    if (a.mode === "arena") launchArena(a.opp); else launchCampaign(a.table, a.c, a.n);
  },
  filter(d) { UI.filter = d.f; rerender(); },
  activate(d) { if (activate(d.id)) { toast(`${CH[d.id].n} joined your roster!`, "gold"); sfxMenu("win"); } rerender(); },
  promote(d) { if (promote(d.id)) { toast(`${CH[d.id].n} promoted to ${S.roster[d.id].stars}★`, "gold"); sfxMenu("win"); } rerender(); },
  gearUp(d) { if (gearUp(d.id)) { toast(`Gear ${roman(S.roster[d.id].gear)} equipped`); sfxMenu(); } rerender(); },
  abUp(d) { if (abUp(d.id, +d.i)) { toast(`${CH[d.id].ab[+d.i].n} upgraded`); sfxMenu(); } rerender(); },
  train(d) { const l = S.roster[d.id].lvl; train(d.id, d.it); if (S.roster[d.id].lvl > l) toast(`${CH[d.id].n} reached level ${S.roster[d.id].lvl}`); sfxMenu(); rerender(); },
  autoTrain(d) { const l = S.roster[d.id].lvl, n = autoTrain(d.id); if (n) toast(`Used ${n} droid${n > 1 ? "s" : ""}: level ${l} → ${S.roster[d.id].lvl}`); sfxMenu(); rerender(); },
  arenaFight(d) { UI.squad = null; route("squad", { mode: "arena", opp: +d.k }); },
  newOpps() { genOpps(); rerender(); },
  payout() {
    if (Date.now() - S.arena.payTime < PAYOUT_MS) return;
    const p = payout(S.arena.rank); S.crystals += p.crystals; S.tokens += p.tokens; S.arena.payTime = Date.now();
    rewardModal("Arena payout", [{ k: "crystals", n: p.crystals }, { k: "tokens", n: p.tokens }], `Rank #${S.arena.rank}`); rerender();
  },
  arenaBuy(d) {
    const it = ARENA_STORE[+d.k]; if (S.tokens < it.cost) return;
    S.tokens -= it.cost;
    if (it.type === "shard") addShards(it.id, it.n); else give({ [it.id]: it.n });
    toast(`Bought ${it.n}× ${it.type === "shard" ? CH[it.id].n + " shards" : ITEMS[it.id].n}`); rerender();
  },
  chromium() { if (S.crystals < 250) return; S.crystals -= 250; const r = openChromium(); save(); rewardModal("Chromium Pack", r, "Shipment"); rerender(); sfxMenu("win"); },
  chromium10() { if (S.crystals < 2200) return; S.crystals -= 2200; const all = []; for (let k = 0; k < 10; k++) all.push(...openChromium()); save(); rewardModal("10 Chromium Packs", all, "Shipment"); rerender(); sfxMenu("win"); },
  bronze(d) {
    if (d.free) { if (Date.now() - S.bronzeTime < BRONZE_MS) return; S.bronzeTime = Date.now(); }
    else { if (S.credits < 250) return; S.credits -= 250; }
    const r = openBronzium(); save(); rewardModal("Bronzium Pack", r, "Shipment"); rerender();
  },
  refill() { refillModal(); },
  refillBuy() { if (S.crystals < 50) return; S.crystals -= 50; S.energy = Math.max(S.energy, maxEnergy(S.lvl)); S.eTime = Date.now(); closeModal(); toast("Energy refilled"); rerender(); },
  heist() { if (S.crystals < 100) return; S.crystals -= 100; S.credits += 6000; toast("+6,000 credits"); rerender(); },
  buyDroids() { if (S.crystals < 80) return; S.crystals -= 80; give({ droid2: 4 }); toast("+4 Advanced Training Droids"); rerender(); },
  buySal() { if (S.crystals < 120) return; S.crystals -= 120; const r = [{ k: "sal1", n: 15 }, { k: "sal2", n: 10 }, { k: "sal3", n: 4 }]; for (const x of r) give({ [x.k]: x.n }); rewardModal("Salvage Crate", r, "Shipment"); rerender(); },
  dailies() { dailiesModal(); },
  claimDaily(d) {
    const q = DAILIES.find(x => x.id === d.id); if (!q || S.daily.claimed[q.id] || S.daily[q.id] < q.goal) return;
    S.daily.claimed[q.id] = 1; give(q.reward); dailiesModal(); renderTop(); save();
  },
  claimAll() { if (S.daily.claimed.all || !DAILIES.every(d => S.daily.claimed[d.id])) return; S.daily.claimed.all = 1; give(DAILY_ALL); dailiesModal(); renderTop(); save(); },
  closeModal() { closeModal(); rerender(); },
  settings() { settingsModal(false); },
  askReset() { settingsModal(true); },
  doReset() { S = newSave(); S.seenIntro = true; save(); closeModal(); route("home"); toast("Progress erased. Welcome back, Commander."); },
  toggleSound() { const n = $("#pname").value; S.settings.sound = !S.settings.sound; settingsModal(false); $("#pname").value = n; },
  saveName() { const v = ($("#pname").value || "").trim().slice(0, 18); if (v) S.name = v; closeModal(); save(); renderTop(); },
  startGame() { S.seenIntro = true; save(); closeModal(); sfxMenu("win"); route("home"); },
};
function sfxMenu(kind = "tap") { sfx(kind); }

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});

// =====================================================================
//  BOOT
// =====================================================================
function introModal() {
  openModal(`<div class="stack" style="align-items:center;text-align:center">
    <img src="${squadArt(["luke", "leia", "han"])}" alt="" style="width:240px;max-width:100%">
    <div class="eyebrow">A long time ago, in a galaxy far, far away…</div>
    <h1>Galactic<span style="display:block;color:var(--gold);font-size:20px;letter-spacing:.3em">Heroes</span></h1>
    <p class="small dim" style="max-width:36ch">Assemble squads of five, fill their turn meters, unleash specials and collect heroes from both sides of the Force. Start with Light Side Battle 1-A.</p>
    <button class="btn wide" data-act="startGame">Begin</button>
    <p class="tiny dim">Unofficial fan game. Not affiliated with Lucasfilm, Disney, EA or Capital Games.</p>
  </div>`);
}
function start(data) {
  S = (data && data.save) || load() || newSave();
  tickTimers();
  route(S.seenIntro ? "home" : "home");
  if (!S.seenIntro) introModal();
  setInterval(() => {
    if (BT.on) { tickTimers(); return; }
    const sig = () => [S.energy, S.arena.attempts, Date.now() - S.bronzeTime >= BRONZE_MS, Date.now() - S.arena.payTime >= PAYOUT_MS].join("|");
    const before = sig();
    tickTimers();
    const now = Date.now(), A = S.arena;
    if (before !== sig()) { save(); if (!$("#modal").innerHTML && UI.view !== "squad") rerender(); else renderTop(); }
    for (const el of $$("[data-cd]")) {
      const left = { bronze: BRONZE_MS - (now - S.bronzeTime), att: ARENA_MS - (now - A.aTime), pay: PAYOUT_MS - (now - A.payTime) }[el.dataset.cd];
      el.textContent = dur(Math.max(0, left));
    }
    const pill = $("#topbar .pill span"); if (pill) pill.innerHTML = `${S.energy}<small>/${maxEnergy(S.lvl)}</small>`;
  }, 1000);
  window.addEventListener("pagehide", () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } });
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ save: S }));
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start(window.claude && window.claude.hot && window.claude.hot.data || {});
</script>
