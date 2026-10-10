
// =====================================================================
//  SCREENS (2/2): Battle hub, Fighters (with Proficiency), Summon, missions, Capsule Corp shop
// =====================================================================
SCREENS.battle = () => {
  const A = S.arena, payReady = Date.now() - A.payTime >= PAYOUT_MS, nd = nextNode();
  return `<div class="stack">
    <h2>Battle</h2>
    <button class="tile wide ls-t" data-act="go" data-v="story" style="min-height:76px"><span class="ticon" style="color:var(--holo)">${IC.story}</span>
      <div class="eyebrow">Main Story</div><h3>${esc(STORY[0].title)}</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "Frieza is beaten"}</span></button>
    <div class="eyebrow">Training Grounds · win Scrolls and training gear</div>
    ${HUNTS.map(h => {
      const best = (S.hunt && S.hunt[h.id]) || 0, boss = h.waves(1)[1][0].e;
      return `<button class="tile wide" data-act="go" data-v="hunt" data-a="${h.id}" style="min-height:96px;background:linear-gradient(120deg,${mapTheme(h.env).a},var(--hull2) 70%)">
        <span class="ticon" style="width:56px;height:56px;right:10px;top:10px"><img src="${enemyArt(boss).head}" alt="" style="width:100%;border-radius:50%"></span>
        <div class="eyebrow">${h.code}-1 to ${h.code}-6 · ${best ? h.code + "-" + best + " cleared" : "not cleared"}</div><h3>${esc(h.n)}</h3><span class="tsub">${esc(h.sub)}</span>
        <span class="tsub">Prizes: ${esc(ITEMS[h.item].n)}s and training gear</span></button>`;
    }).join("")}
    <div class="tiles">
      <button class="tile" data-act="go" data-v="tower"><span class="ticon" style="color:var(--holo)">${IC.tower}</span><h3>World Tournament</h3><span class="tsub">Match ${Math.min(S.tower + 1, TOWER_FLOORS)}/${TOWER_FLOORS}</span></button>
      <button class="tile" data-act="go" data-v="arena"><span class="ticon" style="color:var(--gold)">${IC.arena}</span><h3>Scouter Rankings</h3><span class="tsub">Rank #${A.rank} · ${A.attempts}/5${payReady ? " · rewards ready" : ""}</span></button>
    </div>
  </div>`;
};
SCREENS.hunt = id => {
  const h = HUNTS.find(x => x.id === id), best = (S.hunt && S.hunt[id]) || 0;
  const lvl = UI.huntLv && UI.huntLv[id] || Math.min(6, best + 1);
  const lv = HUNT_LV[lvl - 1], foes = huntTeam(h, lvl);
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Training Grounds</span></div>
    <h2>${h.code}-${lvl} ${esc(h.n)}</h2><p class="small dim">${esc(h.sub)}. Enemies are level ${lv}; the boss is level ${lv + 3}.</p>
    <div class="chips">${[1, 2, 3, 4, 5, 6].map(k => `<button class="chip ${k === lvl ? "on" : ""}" data-act="huntLv" data-h="${id}" data-l="${k}" ${k <= best + 1 ? "" : "disabled"}>${h.code}-${k}</button>`).join("")}</div>
    <div><div class="tiny dim" style="margin-bottom:4px">Enemy party · they fight one at a time</div><div class="row wrap">${foes.map(s => enHTML(s, s.en && ENEMY[s.en].boss ? 56 : 46)).join("")}</div></div>
    <section class="sub stack" style="gap:6px"><div class="small"><b>Prizes</b> <span class="dim">· every win</span></div>
      <div class="rewards" style="justify-content:flex-start">${rewardsHTML(Object.entries(huntPrize(h, lvl)).map(([k, n]) => ({ k, n })))}</div>
      <div class="tiny dim">${esc(ITEMS[h.item].n)}s raise ${PROF_N[ITEMS[h.item].prof]} Proficiency on the Fighters screen.</div></section>
    <div class="row">
      ${best >= lvl ? `<button class="btn ghost" data-act="huntSweep" data-h="${id}" data-l="${lvl}">Auto Clear ×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="huntGo" data-h="${id}" data-l="${lvl}">Battle <span class="cost">${IC.sanity}${HUNT_COST[lvl - 1]}</span></button>
    </div>
  </div>`;
};
SCREENS.tower = () => {
  const cur = Math.min(S.tower + 1, TOWER_FLOORS), done = S.tower >= TOWER_FLOORS;
  const floors = [];
  for (let f = Math.min(TOWER_FLOORS, cur + 2); f >= Math.max(1, cur - 3); f--) floors.push(towerFloor(f));
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">World Martial Arts Tournament</span></div>
    <h2>${done ? "Tournament champion" : "Match " + cur}</h2>
    <p class="small dim">Thirty matches on the tournament stage. Each can be won once. Every fifth match is a champion with a Summon Ticket, and even matches from 8 on are against other fighters' parties.</p>
    ${floors.map(T => {
      const state = T.f <= S.tower ? "done" : T.f === cur ? "next" : "locked";
      return `<section class="panel stack" style="gap:8px;${state === "next" ? "box-shadow:inset 0 0 0 2px var(--gold)" : state === "locked" ? "opacity:.5" : ""}">
        <div class="spread"><b>Match ${T.f}${T.f % 5 === 0 ? " · Champion" : ""}</b><span class="tiny dim">Lv ${T.lv}</span></div>
        <div class="row wrap">${rivalTeam(T.waves, T.lv).map(s => enHTML(s, 40)).join("")}</div>
        <div class="spread"><div class="rewards" style="justify-content:flex-start;transform:scale(.85);transform-origin:left">${rewardsHTML(Object.entries(T.reward).map(([k, n]) => ({ k, n })))}</div>
        ${state === "next" ? `<button class="btn sm" data-act="towerGo" data-f="${T.f}">Battle</button>` : state === "done" ? `<span class="tiny gold">Won</span>` : ""}</div>
      </section>`;
    }).join("")}
  </div>`;
};
SCREENS.arena = () => {
  tickTimers();
  if (!S.arena.opps) genOpps();
  const A = S.arena, now = Date.now(), payReady = now - A.payTime >= PAYOUT_MS, po = payout(A.rank);
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Scouter Rankings</span></div>
    <section class="panel" style="background:radial-gradient(100% 120% at 100% 0%,#0a2a6a,var(--hull) 60%)">
      <div class="spread"><div><div class="eyebrow">Universal power ranking</div><div style="font:900 44px var(--f-title);line-height:1" class="num gold">#${A.rank}</div></div>
      <div style="text-align:right" class="small"><div>Attempts <b class="num">${A.attempts}/5</b></div>${A.attempts < 5 ? `<div class="tiny dim num">+1 in <span data-cd="att">${dur(ARENA_MS - (now - A.aTime))}</span></div>` : ""}<div class="row" style="justify-content:flex-end;margin-top:4px"><span class="cost">${IC.tokens}${fmt(S.tokens)}</span></div></div></div>
      <div class="divider" style="margin:10px 0"></div>
      <div class="spread small"><span>Rank rewards: <span class="cost">${IC.orundum}${po.orundum}</span> <span class="cost">${IC.tokens}${po.tokens}</span></span>
        <button class="btn sm" data-act="payout" ${payReady ? "" : "disabled"}>${payReady ? "Claim" : `<span data-cd="pay">${dur(PAYOUT_MS - (now - A.payTime))}</span>`}</button></div>
    </section>
    <div class="spread"><h3>Challengers</h3><button class="btn ghost sm" data-act="newOpps">New challengers</button></div>
    ${A.opps.map((o, k) => `<section class="panel stack" style="gap:8px">
      <div class="spread"><div class="row" style="gap:8px;min-width:0"><img class="rvlook" src="${rivalHead(o)}" alt=""><div style="min-width:0"><b>${esc(o.name)}</b><div class="tiny gold">${esc(o.cls || "Street Fighter")}</div><div class="tiny dim">Rank #${o.rank} · Battle Power <span class="num">${fmtFull(o.pw)}</span></div></div></div>
      <button class="btn sm" data-act="arenaGo" data-k="${k}" ${A.attempts > 0 ? "" : "disabled"}>Battle</button></div>
      <div class="row">${o.team.map(u => opHTML(u.op, { s: 48, prog: progForLV(u.op, u.LV) })).join("")}</div></section>`).join("")}
    <p class="tiny dim">Spend Ranking Points at the Capsule Corp shop.</p>
  </div>`;
};

// ---------- characters ----------
SCREENS.ops = () => {
  let list = UI.all ? OP_KEYS.slice() : Object.keys(S.ops);
  list = list.filter(k => (UI.el === "all" || OPS[k].el === UI.el) && (UI.sty === "all" || OPS[k].squad === UI.sty) && (UI.cls === "all" || String(OPS[k].season) === UI.cls));
  const sorters = { power: (a, b) => (S.ops[b] ? power(b, S.ops[b]) : -1) - (S.ops[a] ? power(a, S.ops[a]) : -1), rarity: (a, b) => OPS[b].rar - OPS[a].rar || OPS[a].n.localeCompare(OPS[b].n), level: (a, b) => (S.ops[b] ? effLV(S.ops[b]) : -1) - (S.ops[a] ? effLV(S.ops[a]) : -1), name: (a, b) => OPS[a].n.localeCompare(OPS[b].n) };
  list.sort(sorters[UI.sort]);
  return `<div class="stack">
    <div class="spread"><h2>Fighters</h2><button class="chip ${UI.all ? "on" : ""}" data-act="toggleAll">${UI.all ? "Collection" : "Owned"} · ${Object.keys(S.ops).length}/${OP_KEYS.length}</button></div>
    <div class="filters">${["all", ...ELS].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}">${e === "all" ? "All styles" : e}</button>`).join("")}</div>
    <div class="filters">${["all", ...TEAMS].map(e => `<button class="chip ${UI.sty === e ? "on" : ""}" data-act="styf" data-e="${e}">${e === "all" ? "All factions" : e}</button>`).join("")}</div>
    <div class="filters">${["all", "1", "2", "0"].map(c => `<button class="chip ${UI.cls === c ? "on" : ""}" data-act="clsf" data-c="${c}">${c === "all" ? "All sagas" : SEASONS[c]}</button>`).join("")}</div>
    <div class="filters">${["power", "rarity", "level", "name"].map(s => `<button class="chip ${UI.sort === s ? "on" : ""}" data-act="sortf" data-s="${s}">Sort: ${s}</button>`).join("")}</div>
    <div class="roster">${list.map(k => `<button class="rcell ${S.ops[k] && canPromote(k) ? "ready" : ""}" data-act="go" data-v="op" data-a="${k}">${opHTML(k)}${pnameHTML(k)}<div class="pw">${S.ops[k] ? fmt(power(k, S.ops[k])) : SEASONS[OPS[k].season]}</div></button>`).join("") || '<p class="small dim">No fighters match these filters.</p>'}</div>
  </div>`;
};
SCREENS.op = key => {
  const op = OPS[key], p = S.ops[key], tab = UI.opTab;
  const st = p ? opStats(key, p).st : opStats(key, mkProg()).st;
  const tabs = [["info", "Status"], ["skills", "Techniques"], ["upgrade", "Training"], ["runes", "Proficiency"]];
  let body = "";
  if (tab === "info" || !p) body = `<section class="panel"><h3 style="margin-bottom:8px">Stats${p ? "" : " (Lv 1)"}</h3><div class="statgrid">
      <div><span>HP</span><b>${fmtFull(st.hp)}</b></div><div><span>ATK</span><b>${fmtFull(st.atk)}</b></div>
      <div><span>DEF</span><b>${fmtFull(st.def)}</b></div><div><span>SPD</span><b>${st.spd}</b></div>
      <div><span>Crit Rate</span><b>${pct(st.cr)}</b></div><div><span>Crit Damage</span><b>${pct(st.cd)}</b></div></div></section>
    <section class="panel stack" style="gap:8px">
      <div><b class="gold">Leader Skill</b><p class="small dim">${op.leader ? leaderText(op.leader) : "None"}</p></div>
      ${op.passives.length ? `<div><b class="gold">Ability</b><p class="small dim">${op.passives.map(x => esc(x.text)).join(" ")}</p></div>` : ""}
      <div><b class="gold">${elName(op.el)} · ${TYPE_TRAIT[op.el].n}</b><p class="small dim">${TYPE_TRAIT[op.el].d} ${BEATS[op.el] ? `Strong against ${BEATS[op.el]}s, weak to ${weakTo(op.el)}s.` : "Tacticians have no weakness and no edge."}</p></div>
      <div><b class="gold">${esc(op.race)} · ${esc(op.team)}</b><p class="small dim">${SEASONS[op.season]}${op.season ? "" : ": a legend from before the story"}.</p></div>
      ${p ? `<div><b class="gold">Limit Break ${p.pot}/6</b><p class="small dim">+2% to all stats per level. Raised by summoning the same fighter again.</p></div>` : `<p class="small dim">${key === MYSTERY_OP ? "This fighter arrives as a Mystery Gift." : "Summon this fighter to collect it."}</p>`}
    </section>`;
  else if (tab === "skills") body = `<section class="panel stack" style="gap:10px">${op.skills.map((sk, i) => {
      const r = p.sk[i], c = skillCost(r), lock = r >= 4 && p.elite < 1;
      return `<div class="ab"><div class="abicon ${i ? "special" : ""}">${i ? IC.boost : IC.sword}</div>
        <div class="stack" style="gap:4px;min-width:0"><div class="spread"><b>${esc(sk.name)}</b><span class="tag">${i ? KIND_N[sk.kind] || "Technique" : "Basic attacks"}</span></div>
        <p class="small dim">${esc(sk.desc)}</p>
        <div class="spread"><div class="row" style="gap:6px"><b class="tiny gold">Level ${RANK[r]}</b><div class="pips">${[1, 2, 3, 4, 5, 6, 7].map(k => `<i class="${k <= r ? "on" : ""} ${k >= 5 ? "om" : ""}"></i>`).join("")}</div></div>
        ${r < 7 ? `<button class="btn sm ghost" data-act="skUp" data-k="${key}" data-i="${i}" ${!lock && S.inv.summ >= c.summ && S.lmd >= c.lmd ? "" : "disabled"}>${lock ? "Needs Zenkai 1" : `<span class="cost">${IC.summ}${c.summ}</span><span class="cost">${IC.lmd}${fmt(c.lmd)}</span>`}</button>` : '<span class="tiny gold">Level MAX</span>'}</div></div></div>`;
    }).join('<div class="divider"></div>')}<p class="tiny dim">Techniques level from 1 to MAX with Z Orbs. Each level adds 6% damage. Levels 5 to MAX need Zenkai Awakening 1. Every fighter also has Power Up, Close In, Back Off and Switch.</p></section>`;
  else if (tab === "upgrade") {
    const cap = LV_CAP[p.elite], need = xpNeed(p.lvl, p.elite), nextE = p.elite + 1, ec = nextE <= op.maxElite ? eliteCost(key, nextE) : null;
    body = `<section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Level ${p.lvl}<span class="dim small"> / ${cap}</span></h3><span class="small dim num">${p.lvl >= cap ? "Level cap" : `${fmtFull(p.xp)}/${fmtFull(need)} EXP`}</span></div>
      <div class="bar"><i style="width:${p.lvl >= cap ? 100 : p.xp / need * 100}%"></i></div>
      <div class="row wrap">${["rec1", "rec2", "rec3", "rec4"].map(it => `<button class="btn ghost sm" data-act="rec" data-k="${key}" data-it="${it}" ${S.inv[it] > 0 && p.lvl < cap ? "" : "disabled"} title="${esc(ITEMS[it].n)}"><span class="cost">${ITEMS[it].ic}×${S.inv[it] || 0}</span></button>`).join("")}
        <button class="btn sm blue" data-act="autoLv" data-k="${key}" ${p.lvl < cap && ["rec1", "rec2", "rec3", "rec4"].some(i => S.inv[i] > 0) ? "" : "disabled"}>Auto</button></div>
      <p class="tiny dim">Milk Crates, Turtle Shells, Weighted Clothing and Gravity Capsules: training gear from battles, the Training Grounds and the shop.</p>
    </section>
    <section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Zenkai Awakening ${p.elite}</h3><span class="tiny dim">Max ${op.maxElite}</span></div>
      ${ec ? `<p class="small dim">At level ${cap}, a Zenkai Awakening raises the level cap to ${LV_CAP[nextE]} and the base stats: every limit you break makes you stronger.</p>
        <div class="spread small"><span>Cost</span><span class="row"><span class="cost">${IC.chip}${S.inv.chip}/${ec.chip}</span><span class="cost">${IC.lmd}${fmt(ec.lmd)}</span></span></div>
        <button class="btn wide" data-act="promote" data-k="${key}" ${canPromote(key) ? "" : "disabled"}>${p.lvl < cap ? `Reach level ${cap} first` : "Awaken to stage " + nextE}</button>`
      : `<p class="small gold">${op.maxElite === p.elite ? "Fully awakened." : ""}</p>`}
    </section>`;
  } else if (tab === "runes") {
    const pr = p.prof || { m: 0, k: 0, g: 0 };
    body = `<section class="panel stack" style="gap:10px"><h3>Proficiency</h3>
      <p class="small dim">Fighting makes a fighter better at what it does. Melee hits raise Melee, ki attacks raise Ki, and guards raise Guard. Each level adds 3% melee damage, 3% ki damage or 2.5% damage reduction.</p>
      ${["m", "k", "g"].map(w => { const L2 = profLevel(pr[w] || 0), it = { m: "trM", k: "trK", g: "trG" }[w];
        return `<div class="sub stack" style="gap:6px"><div class="spread"><b>${PROF_N[w]} <span class="gold">Lv ${L2.l}</span><span class="dim small"> / ${PROF_MAX}</span></b><span class="tiny dim num">${L2.l >= PROF_MAX ? "MAX" : `${L2.xp}/${L2.need}`}</span></div>
          <div class="bar"><i style="width:${L2.l >= PROF_MAX ? 100 : L2.xp / L2.need * 100}%"></i></div>
          <div class="spread"><span class="tiny dim">+${L2.l * (w === "g" ? 2.5 : 3)}% ${w === "m" ? "melee damage" : w === "k" ? "ki damage" : "damage reduction"}</span>
          <button class="btn sm ghost" data-act="scroll" data-k="${key}" data-it="${it}" ${S.inv[it] > 0 && L2.l < PROF_MAX ? "" : "disabled"}><span class="cost">${ITEMS[it].ic}×${S.inv[it] || 0}</span> Study</button></div></div>`; }).join("")}
      <p class="tiny dim">Scrolls come from the Training Grounds, wandering enemies on the field, and the shop.</p></section>`;
  }
  return `<div class="stack">
    <div class="spread">${back("go", "Fighters", 'data-v="ops"')}${p ? `<button class="btn ghost sm" data-act="assistant" data-k="${key}" ${S.assistant === key ? "disabled" : ""}>${S.assistant === key ? "Partner" : "Set as partner"}</button>` : ""}</div>
    <section class="panel" style="padding:12px;overflow:hidden">
      <div class="opart" style="--ecs:${ELC[op.el]}55"><img src="${spriteURL(op)}" alt="${esc(op.n)}">
        <div class="meta">${starRow(op.rar).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start;height:14px"')}
          <div class="eyebrow" style="text-shadow:0 1px 3px #000">${esc(op.ver)} · ${esc(op.team)}</div>
          <h2 style="font-size:26px;text-shadow:0 2px 6px #000">${esc(op.n)}</h2>
          <div class="row" style="gap:4px">${elChip(op.el)}<span class="cls">${SEASONS[op.season]}</span></div>
          ${p ? `<div class="small" style="text-shadow:0 1px 3px #000">Zenkai ${p.elite} · Lv ${p.lvl} · Battle Power <b class="num" style="color:var(--holo)">${fmtFull(power(key, p))}</b></div>` : `<div class="small dim">Not collected</div>`}
        </div></div>
    </section>
    ${variantsOf(op.base).length > 1 ? `<section class="panel stack" style="padding:10px 12px;gap:10px">
      ${verRow(`${esc(op.blader)}'s forms · each has its own style and techniques`, variantsOf(op.base), key, verLabel, k => ELC[OPS[k].el])}
      <p class="tiny dim">Every form is a separate fighter you collect and raise on its own.</p></section>` : ""}
    ${p ? `<div class="tabs2">${tabs.map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="opTab" data-t="${k}">${n}</button>`).join("")}</div>` : ""}
    ${body}
  </div>`;
};
// a row of a character's other forms, owned ones in colour
const verLabel = k => OPS[k].ver;
function verRow(title, keys, cur, label, col) {
  return `<div><div class="eyebrow" style="margin-bottom:6px">${title}</div><div class="variants">${keys.map(k => `<button class="${k === cur ? "cur" : ""} ${S.ops[k] ? "" : "unowned"}" data-act="go" data-v="op" data-a="${k}" ${k === cur ? "disabled" : ""}>${opHTML(k, { s: 46, nostars: 1, show: 1 })}<span class="tiny" style="color:${col(k)}">${label(k)}</span></button>`).join("")}</div></div>`;
}
// ---------- headhunt ----------
SCREENS.hh = () => {
  const B = bannerToday(), std = UI.hhStd, f6 = OPS[B.feat6];
  const pity = Math.max(0, S.gacha.pity - 49);
  return `<div class="stack">
    <div class="tabs2"><button class="${std ? "" : "on"}" data-act="hhTab" data-std="0">Featured Summon</button><button class="${std ? "on" : ""}" data-act="hhTab" data-std="1">Standard</button></div>
    <section class="panel banner-card" style="${std ? "background:radial-gradient(90% 90% at 80% 30%,#14408a,transparent 70%),linear-gradient(160deg,#0e1a3a,#050a18)" : "background:radial-gradient(90% 90% at 80% 30%,#8a3a0a,transparent 70%),linear-gradient(160deg,#2a1406,#0a0602)"}">
      ${std ? `<img src="${spriteURL(OPS[STARTERS[0]])}" alt="">` : `<img src="${spriteURL(f6)}" alt="${esc(f6.n)}">`}
      <div class="eyebrow">${std ? "Standard Summon" : "Featured · changes daily"}</div>
      <h2>${std ? "Every fighter" : esc(opLabel(f6))}</h2>
      ${std ? `<p class="small" style="max-width:24ch">Any fighter from the Saiyan Saga and the Frieza Saga can answer.</p>` : `<div class="row" style="gap:4px">${starRow(5).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start"')}${elChip(f6.el)}${beastChip(f6)}</div>
      <p class="small" style="max-width:26ch">${esc(opLabel(f6))} is half of all 5★ results. Featured 4★: ${B.feat5.map(k => esc(opLabel(OPS[k]))).join(", ")}.</p>`}
    </section>
    <div class="row wrap small dim"><span>5★ 3% · 4★ 18% · 3★ 79%</span>${pity ? `<span class="gold">· 5★ rate now ${3 + pity * 3}%</span>` : `<span>· ${Math.max(0, 50 - S.gacha.pity)} Summons until the 5★ rate starts rising</span>`}</div>
    ${S.inv.free10 > 0 ? `<button class="btn wide freepull" data-act="pullFree10">${IC.free10.replace("<svg", '<svg width="26" height="26"')}<span>Use 10 free Summons on this banner<br><small>Free Summon ×${S.inv.free10}</small></span></button>` : ""}
    ${S.inv.gold5 > 0 ? `<button class="btn wide freepull crimson" data-act="pullGold5">${IC.gold5.replace("<svg", '<svg width="26" height="26"')}<span>Shenron's Wish: a random 5★ fighter<br><small>×${S.inv.gold5}</small></span></button>` : ""}
    ${S.gacha.firstTen ? `<div class="hint">${IC.star.replace("<svg", '<svg width="20" height="20"')}<span class="small">Your first ten Summons guarantee at least one 4★ fighter.</span></div>` : ""}
    <div class="row" style="gap:10px">
      <button class="btn ghost" style="flex:1" data-act="pull" data-n="1" ${S.permit >= 1 || S.orundum >= 600 ? "" : "disabled"}>Summon ×1<br><span class="cost">${S.permit >= 1 ? IC.permit + "1" : IC.orundum + "600"}</span></button>
      <button class="btn" style="flex:1" data-act="pull" data-n="10" ${S.permit >= 10 || S.orundum >= 6000 ? "" : "disabled"}>Summon ×10<br><span class="cost">${S.permit >= 10 ? IC.permit + "10" : IC.orundum + "6,000"}</span></button>
    </div>
    <div class="mats"><span class="mat">${IC.permit}${S.permit}</span><span class="mat">${IC.orundum}${fmt(S.orundum)}</span><span class="mat">${IC.cert}${S.cert}</span></div>
    <p class="tiny dim">Each Summon brings one fighter. Summoning one you already have raises its Limit Break (up to 6) and leaves Z Medals for the shop.</p>
  </div>`;
};
function gachaReveal(results) {
  return new Promise(resolve => {
    const top = Math.max(...results.map(r => OPS[r.key].rar));
    const root = $("#gacha");
    root.innerHTML = `<div class="gwrap"><canvas class="gcv" id="gcv"></canvas><div class="gtitle" id="gT"><div class="eyebrow">Summon</div><h1>Arise, Shenron!</h1><p class="small dim">Tap to make your wish</p></div><div class="ggrid" id="gG" hidden></div><button class="btn" id="gDone" hidden>Done</button></div>`;
    root.hidden = false;
    const cv = $("#gcv"), g = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
    const col = RC[top], t0 = performance.now();
    let run = true;
    // the sky darkens, the seven balls glow, and the Eternal Dragon rises; the glow takes the colour of the best result
    const loop = now => {
      if (!run || !cv.isConnected) return; requestAnimationFrame(loop);
      const t = (now - t0) / 1000;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#02030a"); gr.addColorStop(1, top >= 5 ? "#3a2a06" : top >= 4 ? "#24103a" : "#081a30");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * .8, rr = Math.min(W, H) * .16;
      if (t > .5) { g.save(); g.globalAlpha = clamp((t - .5) / 1.2, 0, 1); drawShenron(g, cx, H * .56, Math.min(W, H) / 560, t, 1); g.restore(); }
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + k / 7 * Math.PI * 2 + t * .3; drawDragonBall(g, cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr * .45, rr * .22, k + 1, .6 + .4 * Math.sin(t * 6 + k)); }
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .25 + .15 * Math.sin(t * 5); const lg = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 2); lg.addColorStop(0, col); lg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
    };
    requestAnimationFrame(loop); sfx("transform");
    let stage = 0;
    const show = () => {
      stage = 1; $("#gT").hidden = true; const G = $("#gG"); G.hidden = false;
      if (results.length === 1) { G.style.gridTemplateColumns = "1fr"; G.style.maxWidth = "260px"; }
      G.innerHTML = results.map((r, i) => { const op = OPS[r.key]; return `<div class="gcard" style="--rc:${RC[op.rar]};animation-delay:${i * .12}s">${r.isNew ? '<span class="gnew">NEW</span>' : ""}<img src="${spriteURL(op)}" alt="${esc(op.n)}"><span class="gst">${"★".repeat(op.rar)}<br>${esc(op.n)}<br><span style="font-size:.85em;opacity:.8">${esc(op.ver)}</span></span></div>`; }).join("");
      if (top >= 5) sfx("win"); else sfx("heal");
      setTimeout(() => { $("#gDone").hidden = false; stage = 2; }, results.length * 120 + 500);
    };
    root.onclick = ev => {
      if (ev.target.id === "gDone") { run = false; root.hidden = true; root.innerHTML = ""; resolve(); return; }
      if (stage === 0) show();
    };
    setTimeout(() => { if (stage === 0) show(); }, 2400);
  });
}

// ---------- missions / shop / depot ----------
function missionsModal() {
  const dl = DAILIES.map(d => {
    const v = Math.min(d.goal, S.daily[d.id] || 0), cl = S.daily.claimed[d.id];
    return `<div class="sub stack" style="gap:6px"><div class="spread"><b class="small">${d.n}</b><span class="small num">${v}/${d.goal}</span></div>
      <div class="bar"><i style="width:${v / d.goal * 100}%"></i></div>
      <div class="spread"><span class="row tiny">${Object.entries(d.reward).map(([k, n]) => `<span class="cost">${itemIcon(k)}${fmt(n)}</span>`).join(" ")}</span>
      <button class="btn sm" data-act="claimDaily" data-id="${d.id}" ${v >= d.goal && !cl ? "" : "disabled"}>${cl ? "Claimed" : "Claim"}</button></div></div>`;
  }).join("");
  openModal(`<div class="stack"><div class="eyebrow">Resets daily</div><h2>Daily Training</h2>${dl}
    <div class="sub spread"><span class="small">Finish all of today's training: <span class="cost">${IC.permit}1</span></span>
      <button class="btn sm" data-act="claimAllDaily" ${DAILIES.every(d => S.daily.claimed[d.id]) && !S.daily.claimed.all ? "" : "disabled"}>${S.daily.claimed.all ? "Claimed" : "Claim"}</button></div>
    <button class="btn ghost wide" data-act="go" data-v="ach">${IC.trophy.replace("<svg", '<svg width="18" height="18"')} Z Records · ${achDone()}/${achTotal}</button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
SCREENS.shop = () => {
  const tab = SHOP[UI.shopTab] ? UI.shopTab : "credit", cur = { credit: ["credit", IC.credit], cert: ["cert", IC.cert], tokens: ["tokens", IC.tokens], prime: ["prime", IC.prime] }[tab];
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="mat">${cur[1]}${fmt(S[cur[0]])}</span></div>
    <h2>Capsule Corp.</h2><p class="small dim">Bulma's family company: training gear, capsules and anything else money can buy. Even Senzu Beans, if you know who to ask.</p>
    <div class="tabs2">${[["credit", "Capsule Points"], ["cert", "Z Medals"], ["tokens", "Ranking"], ["prime", "Senzu"]].map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="shopTab" data-t="${k}">${n}</button>`).join("")}</div>
    <div class="tiles">${SHOP[tab].map(it => `<button class="tile" data-act="buy" data-t="${tab}" data-id="${it.id}" ${S[cur[0]] >= it.cost ? "" : "disabled"} style="min-height:104px">
      <span class="ticon">${itemIcon(Object.keys(it.give)[0] === "sanityMax" ? "sanity" : Object.keys(it.give)[0])}</span>
      <h3 style="font-size:15px">${esc(it.n)}</h3>${it.d ? `<span class="tsub">${esc(it.d)}</span>` : ""}<span class="tsub cost">${cur[1]}${fmt(it.cost)}</span></button>`).join("")}</div>
  </div>`;
};
SCREENS.depot = () => `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Items</span></div>
    <h2>Items</h2>
    <div class="rewards" style="justify-content:flex-start">${["rec1", "rec2", "rec3", "rec4", "trM", "trK", "trG", "chip", "summ", "permit", "cert", "tokens", "prime", "credit", "free10", "gold5"].filter(k => k !== "free10" && k !== "gold5" || have(k) > 0).map(k => `<div class="rw" title="${esc(ITEMS[k].d || "")}"><div class="ri" style="width:54px;height:54px">${itemIcon(k)}</div><span class="num">×${fmt(have(k))}</span><span class="tiny dim">${esc(ITEMS[k].n)}</span></div>`).join("")}</div>
  </div>`;
function sanityModal() {
  openModal(`<div class="stack"><h2>Stamina</h2><p class="small dim">Battles cost Stamina. You regain 1 every 30 seconds, a Rank up refills it, and one Senzu Bean restores it to max.</p>
    <div class="spread"><span class="cost">${IC.sanity}<b class="num">${S.sanity}/${maxSanity(S.lvl)}</b></span><span class="tiny dim">${S.sanity < maxSanity(S.lvl) ? "+1 in " + dur(SAN_MS - (Date.now() - S.sTime)) : "Full"}</span></div>
    <button class="btn wide" data-act="buy" data-t="prime" data-id="p_san" ${S.prime >= 1 ? "" : "disabled"}>Restore <span class="cost">${IC.prime}1</span> <span class="tiny">(you have ${S.prime})</span></button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
function rewardModal(title, list, sub = "") {
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">${esc(sub)}</div><h2>${esc(title)}</h2>
    <div class="rewards">${rewardsHTML(list)}</div><button class="btn wide" data-act="closeModal">Collect</button></div>`);
}
