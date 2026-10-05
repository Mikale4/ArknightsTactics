
// =====================================================================
//  SCREENS (2/2): Terminal, operators, modules, headhunting, missions, store
// =====================================================================
SCREENS.battle = () => {
  const A = S.arena, payReady = Date.now() - A.payTime >= PAYOUT_MS, nd = nextNode();
  return `<div class="stack">
    <h2>Terminal</h2>
    <button class="tile wide ls-t" data-act="go" data-v="story" style="min-height:76px"><span class="ticon" style="color:var(--holo)">${IC.story}</span>
      <div class="eyebrow">Main Theme</div><h3>${esc(STORY[0].title)}</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "All episodes cleared"}</span></button>
    <div class="eyebrow">Supplies · module operations</div>
    ${HUNTS.map(h => {
      const best = (S.hunt && S.hunt[h.id]) || 0, boss = h.waves(1)[1][0].e;
      return `<button class="tile wide" data-act="go" data-v="hunt" data-a="${h.id}" style="min-height:96px;background:linear-gradient(120deg,${mapTheme(h.env === "temple" ? "slums" : h.env).a},var(--hull2) 70%)">
        <span class="ticon" style="width:56px;height:56px;right:10px;top:10px"><img src="${enemyArt(boss).head}" alt="" style="width:100%;border-radius:50%"></span>
        <div class="eyebrow">${h.code}-1 to ${h.code}-6 · ${best ? h.code + "-" + best + " cleared" : "not cleared"}</div><h3>${esc(h.n)}</h3><span class="tsub">${esc(h.sub)}</span>
        <span class="tsub">Module sets: ${h.sets.join(", ")}</span></button>`;
    }).join("")}
    <div class="tiles">
      <button class="tile" data-act="go" data-v="tower"><span class="ticon" style="color:var(--holo)">${IC.tower}</span><h3 class="long">Stationary Security Service</h3><span class="tsub">Floor ${Math.min(S.tower + 1, TOWER_FLOORS)}/${TOWER_FLOORS}</span></button>
      <button class="tile" data-act="go" data-v="arena"><span class="ticon" style="color:var(--gold)">${IC.arena}</span><h3 class="long">Contingency Contract</h3><span class="tsub">Rank #${A.rank} · ${A.attempts}/5${payReady ? " · bounty ready" : ""}</span></button>
    </div>
  </div>`;
};
SCREENS.hunt = id => {
  const h = HUNTS.find(x => x.id === id), best = (S.hunt && S.hunt[id]) || 0;
  const lvl = UI.huntLv && UI.huntLv[id] || Math.min(6, best + 1);
  const lv = HUNT_LV[lvl - 1], waves = h.waves(lv).map(w => w.map(s => ({ en: s.e, LV: lv + (ENEMY[s.e].boss ? 3 : 0) })));
  return `<div class="stack">
    <div class="spread">${back("go", "Terminal", 'data-v="battle"')}<span class="eyebrow">Supplies</span></div>
    <h2>${h.code}-${lvl} ${esc(h.n)}</h2><p class="small dim">${esc(h.sub)}. Enemies are level ${lv}; the boss is level ${lv + 3}.</p>
    <div class="chips">${[1, 2, 3, 4, 5, 6].map(k => `<button class="chip ${k === lvl ? "on" : ""}" data-act="huntLv" data-h="${id}" data-l="${k}" ${k <= best + 1 ? "" : "disabled"}>${h.code}-${k}</button>`).join("")}</div>
    ${waves.map((w, k) => `<div><div class="tiny dim" style="margin-bottom:4px">Wave ${k + 1}</div><div class="row wrap">${w.map(s => enHTML(s, ENEMY[s.en].boss ? 56 : 46)).join("")}</div></div>`).join("")}
    <section class="sub stack" style="gap:6px"><div class="small"><b>Module drops</b> <span class="dim">· 2–3 modules per clear</span></div>
      <div class="chips">${h.sets.map(s => `<span class="chip" title="${esc(RUNE_INFO[s])}">${s}</span>`).join("")}</div>
      <div class="tiny dim">${HUNT_RAR[lvl - 1].map((p, i) => p ? `${RUNE_RAR[i + 1]} ${Math.round(p * 100)}%` : "").filter(Boolean).join(" · ")}</div></section>
    <div class="row">
      ${best >= lvl ? `<button class="btn ghost" data-act="huntSweep" data-h="${id}" data-l="${lvl}">Auto Deploy ×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="huntGo" data-h="${id}" data-l="${lvl}">Start <span class="cost">${IC.sanity}${HUNT_COST[lvl - 1]}</span></button>
    </div>
  </div>`;
};
SCREENS.tower = () => {
  const cur = Math.min(S.tower + 1, TOWER_FLOORS), done = S.tower >= TOWER_FLOORS;
  const floors = [];
  for (let f = Math.min(TOWER_FLOORS, cur + 2); f >= Math.max(1, cur - 3); f--) floors.push(towerFloor(f));
  return `<div class="stack">
    <div class="spread">${back("go", "Terminal", 'data-v="battle"')}<span class="eyebrow">SSS</span></div>
    <h2>${done ? "All floors cleared" : "Stationary Security Service"}</h2>
    <p class="small dim">${done ? "" : `Floor ${cur} of ${TOWER_FLOORS}. `}Each floor can be cleared once. Every fifth floor holds a boss and a Headhunting Permit.</p>
    ${floors.map(T => {
      const state = T.f <= S.tower ? "done" : T.f === cur ? "next" : "locked";
      return `<section class="panel stack" style="gap:8px;${state === "next" ? "box-shadow:inset 0 0 0 2px var(--gold)" : state === "locked" ? "opacity:.5" : ""}">
        <div class="spread"><b>Floor ${T.f}${T.f % 5 === 0 ? " · Boss" : ""}</b><span class="tiny dim">Lv ${T.lv}</span></div>
        <div class="row wrap">${T.waves[T.waves.length - 1].map(s => enHTML(s.op ? { op: s.op, LV: T.lv } : { en: s.e, LV: T.lv }, 40)).join("")}</div>
        <div class="spread"><div class="rewards" style="justify-content:flex-start;transform:scale(.85);transform-origin:left">${rewardsHTML(Object.entries(T.reward).map(([k, n]) => ({ k, n })))}</div>
        ${state === "next" ? `<button class="btn sm" data-act="towerGo" data-f="${T.f}">Start</button>` : state === "done" ? `<span class="tiny gold">Cleared</span>` : ""}</div>
      </section>`;
    }).join("")}
  </div>`;
};
SCREENS.arena = () => {
  tickTimers();
  if (!S.arena.opps) genOpps();
  const A = S.arena, now = Date.now(), payReady = now - A.payTime >= PAYOUT_MS, po = payout(A.rank);
  return `<div class="stack">
    <div class="spread">${back("go", "Terminal", 'data-v="battle"')}<span class="eyebrow">Contingency Contract</span></div>
    <section class="panel" style="background:radial-gradient(100% 120% at 100% 0%,#3a2a08,var(--hull) 60%)">
      <div class="spread"><div><div class="eyebrow" style="color:var(--gold)">Contract rank</div><div style="font:800 44px var(--f-display);line-height:1" class="num gold">#${A.rank}</div></div>
      <div style="text-align:right" class="small"><div>Attempts <b class="num">${A.attempts}/5</b></div>${A.attempts < 5 ? `<div class="tiny dim num">+1 in <span data-cd="att">${dur(ARENA_MS - (now - A.aTime))}</span></div>` : ""}<div class="row" style="justify-content:flex-end;margin-top:4px"><span class="cost">${IC.tokens}${fmt(S.tokens)}</span></div></div></div>
      <div class="divider" style="margin:10px 0"></div>
      <div class="spread small"><span>Bounty: <span class="cost">${IC.orundum}${po.orundum}</span> <span class="cost">${IC.tokens}${po.tokens}</span></span>
        <button class="btn sm" data-act="payout" ${payReady ? "" : "disabled"}>${payReady ? "Claim" : `<span data-cd="pay">${dur(PAYOUT_MS - (now - A.payTime))}</span>`}</button></div>
    </section>
    <div class="spread"><h3>Rival squads</h3><button class="btn ghost sm" data-act="newOpps">Refresh</button></div>
    ${A.opps.map((o, k) => `<section class="panel stack" style="gap:8px">
      <div class="spread"><div><b>${esc(o.name)}</b><div class="tiny dim">Rank #${o.rank} · Power <span class="num">${fmtFull(o.pw)}</span></div></div>
      <button class="btn sm" data-act="arenaGo" data-k="${k}" ${A.attempts > 0 ? "" : "disabled"}>Start</button></div>
      <div class="row">${o.team.map(u => opHTML(u.op, { s: 48, prog: progForLV(u.op, u.LV) })).join("")}</div></section>`).join("")}
    <p class="tiny dim">Spend Contract Bounty in the Contract Store.</p>
  </div>`;
};

// ---------- operators ----------
SCREENS.ops = () => {
  let list = UI.all ? OP_KEYS.slice() : Object.keys(S.ops);
  list = list.filter(k => (UI.el === "all" || OPS[k].el === UI.el) && (UI.cls === "all" || OPS[k].cls === UI.cls));
  const sorters = { power: (a, b) => (S.ops[b] ? power(b, S.ops[b]) : -1) - (S.ops[a] ? power(a, S.ops[a]) : -1), rarity: (a, b) => OPS[b].rar - OPS[a].rar || OPS[a].n.localeCompare(OPS[b].n), level: (a, b) => (S.ops[b] ? effLV(S.ops[b]) : -1) - (S.ops[a] ? effLV(S.ops[a]) : -1), name: (a, b) => OPS[a].n.localeCompare(OPS[b].n) };
  list.sort(sorters[UI.sort]);
  return `<div class="stack">
    <div class="spread"><h2>Operators</h2><button class="chip ${UI.all ? "on" : ""}" data-act="toggleAll">${UI.all ? "Collection" : "Owned"} · ${Object.keys(S.ops).length}/${OP_KEYS.length}</button></div>
    <div class="filters">${["all", ...ELS].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}">${e === "all" ? "All elements" : e}</button>`).join("")}</div>
    <div class="filters">${["all", ...CLASSES].map(c => `<button class="chip ${UI.cls === c ? "on" : ""}" data-act="clsf" data-c="${c}">${c === "all" ? "All classes" : c}</button>`).join("")}</div>
    <div class="filters">${["power", "rarity", "level", "name"].map(s => `<button class="chip ${UI.sort === s ? "on" : ""}" data-act="sortf" data-s="${s}">Sort: ${s}</button>`).join("")}</div>
    <div class="roster">${list.map(k => `<button class="rcell ${S.ops[k] && canPromote(k) ? "ready" : ""}" data-act="go" data-v="op" data-a="${k}">${opHTML(k)}<div class="pname">${esc(OPS[k].n)}</div><div class="pw">${S.ops[k] ? fmt(power(k, S.ops[k])) : OPS[k].cls}</div></button>`).join("") || '<p class="small dim">No operators match these filters.</p>'}</div>
  </div>`;
};
SCREENS.op = key => {
  const op = OPS[key], p = S.ops[key], tab = UI.opTab;
  const st = p ? opStats(key, p).st : opStats(key, mkProg()).st;
  const tabs = [["info", "Status"], ["skills", "Skills"], ["upgrade", "Level Up"], ["runes", "Modules"]];
  let body = "";
  if (tab === "info" || !p) body = `<section class="panel"><h3 style="margin-bottom:8px">Stats${p ? "" : " (Lv 1)"}</h3><div class="statgrid">
      <div><span>HP</span><b>${fmtFull(st.hp)}</b></div><div><span>ATK</span><b>${fmtFull(st.atk)}</b></div>
      <div><span>DEF</span><b>${fmtFull(st.def)}</b></div><div><span>SPD</span><b>${st.spd}</b></div>
      <div><span>Crit Rate</span><b>${pct(st.cr)}</b></div><div><span>Crit Damage</span><b>${pct(st.cd)}</b></div>
      <div><span>Accuracy</span><b>${pct(st.acc)}</b></div><div><span>Resistance</span><b>${pct(st.res)}</b></div></div></section>
    <section class="panel stack" style="gap:8px">
      <div><b class="gold">Leader skill</b><p class="small dim">${op.leader ? leaderText(op.leader) : "None"}</p></div>
      ${op.passives.length ? `<div><b class="gold">Talent</b><p class="small dim">${op.passives.map(x => esc(x.text)).join(" ")}</p></div>` : ""}
      <div><b class="gold">Recommended modules</b><p class="small dim">${op.runes.map(r => `${r} (${RUNE_INFO[r]})`).join(" · ")}</p></div>
      ${p ? `<div><b class="gold">Potential ${p.pot}/6</b><p class="small dim">+2% to all stats per level. Raised by recruiting duplicates.</p></div>` : `<p class="small dim">Recruit this operator through Headhunting.</p>`}
    </section>`;
  else if (tab === "skills") body = `<section class="panel stack" style="gap:10px">${op.skills.map((sk, i) => {
      const r = p.sk[i], c = skillCost(r), lock = r >= 4 && p.elite < 1;
      return `<div class="ab"><div class="abicon ${i ? "special" : ""}">${skillIcon({ cls: op.cls }, sk)}</div>
        <div class="stack" style="gap:4px;min-width:0"><div class="spread"><b>S${sk.slot} ${esc(sk.name)}</b><span class="tag">${sk.cd ? "CD " + sk.cd : "Basic"}</span></div>
        <p class="small dim">${esc(sk.desc)}</p>
        <div class="spread"><div class="pips">${[1, 2, 3, 4, 5, 6, 7].map(k => `<i class="${k <= r ? "on" : ""} ${k >= 5 ? "om" : ""}"></i>`).join("")}</div>
        ${r < 7 ? `<button class="btn sm ghost" data-act="skUp" data-k="${key}" data-i="${i}" ${!lock && S.inv.summ >= c.summ && S.lmd >= c.lmd ? "" : "disabled"}>${lock ? "Needs Elite 1" : `<span class="cost">${IC.summ}${c.summ}</span><span class="cost">${IC.lmd}${fmt(c.lmd)}</span>`}</button>` : '<span class="tiny gold">Skill Level 7</span>'}</div></div></div>`;
    }).join('<div class="divider"></div>')}<p class="tiny dim">Each skill level adds 6% damage and healing. Skill Level 7 reduces S2 and S3 cooldowns by one turn. Levels 5 to 7 need Elite 1.</p></section>`;
  else if (tab === "upgrade") {
    const cap = LV_CAP[p.elite], need = xpNeed(p.lvl, p.elite), nextE = p.elite + 1, ec = nextE <= op.maxElite ? eliteCost(key, nextE) : null;
    body = `<section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Level ${p.lvl}<span class="dim small"> / ${cap}</span></h3><span class="small dim num">${p.lvl >= cap ? "Level cap" : `${fmtFull(p.xp)}/${fmtFull(need)} EXP`}</span></div>
      <div class="bar"><i style="width:${p.lvl >= cap ? 100 : p.xp / need * 100}%"></i></div>
      <div class="row wrap">${["rec1", "rec2", "rec3", "rec4"].map(it => `<button class="btn ghost sm" data-act="rec" data-k="${key}" data-it="${it}" ${S.inv[it] > 0 && p.lvl < cap ? "" : "disabled"}><span class="cost">${ITEMS[it].ic}×${S.inv[it] || 0}</span></button>`).join("")}
        <button class="btn sm blue" data-act="autoLv" data-k="${key}" ${p.lvl < cap && ["rec1", "rec2", "rec3", "rec4"].some(i => S.inv[i] > 0) ? "" : "disabled"}>Auto</button></div>
    </section>
    <section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Elite ${p.elite}</h3><span class="tiny dim">Max Elite ${op.maxElite}</span></div>
      ${ec ? `<p class="small dim">Promote at level ${cap} to unlock Elite ${nextE}: higher level cap (${LV_CAP[nextE]}) and stronger base stats.</p>
        <div class="spread small"><span>Cost</span><span class="row"><span class="cost">${IC.chip}${S.inv.chip}/${ec.chip}</span><span class="cost">${IC.lmd}${fmt(ec.lmd)}</span></span></div>
        <button class="btn wide" data-act="promote" data-k="${key}" ${canPromote(key) ? "" : "disabled"}>${p.lvl < cap ? `Reach level ${cap} first` : "Promote to Elite " + nextE}</button>`
      : `<p class="small gold">${op.maxElite === p.elite ? "Fully promoted." : ""}</p>`}
    </section>`;
  } else if (tab === "runes") {
    const sets = [...new Set(p.runes.map(runeById).filter(Boolean).map(r => r.set))];
    const free = S.runes.filter(r => !r.eq || r.eq.k !== key).sort((a, b) => b.rar - a.rar || b.lvl - a.lvl);
    body = `<section class="panel stack" style="gap:8px"><h3>Module slots</h3>
      <div class="runeslots">${[0, 1].map(s => { const r = runeById(p.runes[s]); return r ? `<button class="rslot full" data-act="runeSheet" data-id="${r.id}"><b style="color:${RUNE_RC[r.rar]}">${r.set} +${r.lvl}</b><span class="tiny">${runeMainText(r)}</span><span class="tiny dim">${RUNE_INFO[r.set]}</span></button>` : `<div class="rslot"><b>Slot ${s + 1}</b><span class="tiny">Empty</span></div>`; }).join("")}</div>
      <p class="tiny dim">Active module sets: ${sets.length ? sets.map(s => `${s} (${RUNE_INFO[s]})`).join(" · ") : "none"}</p></section>
      <section class="stack" style="gap:6px"><div class="spread"><h3>Your modules</h3><span class="tiny dim">${S.runes.length} owned</span></div>
      ${free.length ? free.slice(0, 40).map(r => runeRow(r, `<span class="row"><button class="btn sm ghost" data-act="equip" data-k="${key}" data-s="0" data-id="${r.id}">Slot 1</button><button class="btn sm ghost" data-act="equip" data-k="${key}" data-s="1" data-id="${r.id}">Slot 2</button></span>`)).join("") : '<p class="small dim">No spare modules. Supplies operations in the Terminal drop them.</p>'}</section>`;
  }
  return `<div class="stack">
    <div class="spread">${back("go", "Operators", 'data-v="ops"')}${p ? `<button class="btn ghost sm" data-act="assistant" data-k="${key}" ${S.assistant === key ? "disabled" : ""}>${S.assistant === key ? "Assistant" : "Set assistant"}</button>` : ""}</div>
    <section class="panel" style="padding:12px;overflow:hidden">
      <div class="opart" style="--ecs:${ELC[op.el]}55"><img src="${spriteURL(op)}" alt="${esc(op.n)}">
        <div class="meta">${starRow(op.rar).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start;height:14px"')}
          <h2 style="font-size:26px;text-shadow:0 2px 6px #000">${esc(op.n)}</h2>
          <div class="row" style="gap:4px"><span class="el ${op.el}">${op.el}</span><span class="cls">${op.cls}</span></div>
          ${p ? `<div class="small" style="text-shadow:0 1px 3px #000">Elite ${p.elite} · Lv ${p.lvl} · Power <b class="num" style="color:var(--holo)">${fmtFull(power(key, p))}</b></div>` : `<div class="small dim">Not recruited</div>`}
        </div></div>
    </section>
    ${p ? `<div class="tabs2">${tabs.map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="opTab" data-t="${k}">${n}</button>`).join("")}</div>` : ""}
    ${body}
  </div>`;
};
function runeRow(r, right = "") {
  return `<div class="rune ${r.eq ? "eq" : ""}" style="--rc:${RUNE_RC[r.rar]}"><button class="rg" data-act="runeSheet" data-id="${r.id}" aria-label="${r.set} module">+${r.lvl}</button>
    <div style="min-width:0"><b>${r.set}</b> <span class="tiny" style="color:${RUNE_RC[r.rar]}">${RUNE_RAR[r.rar]}</span><div class="tiny dim">${runeMainText(r)}${r.eq ? ` · on ${esc(OPS[r.eq.k].n)}` : ""}</div></div>${right}</div>`;
}
function runeSheet(r) {
  const c = enhanceCost(r);
  openModal(`<div class="stack"><div class="rune" style="--rc:${RUNE_RC[r.rar]}"><span class="rg">+${r.lvl}</span><div><b>${r.set} Module</b> <span class="tiny" style="color:${RUNE_RC[r.rar]}">${RUNE_RAR[r.rar]}</span><div class="tiny dim">${RUNE_INFO[r.set]}</div></div></div>
    <div class="statgrid"><div><span>Main stat</span><b>${runeMainText(r)}</b></div><div><span>Level</span><b>+${r.lvl} / 15</b></div></div>
    <p class="small dim">${r.eq ? `Equipped on ${esc(OPS[r.eq.k].n)}.` : "Not equipped."} Upgrades always succeed and raise the main stat.</p>
    <div class="row wrap"><button class="btn" data-act="enhance" data-id="${r.id}" ${r.lvl < 15 && S.lmd >= c ? "" : "disabled"}>Upgrade <span class="cost">${IC.lmd}${fmt(c)}</span></button>
      <button class="btn ghost" data-act="enhanceMax" data-id="${r.id}" ${r.lvl < 15 && S.lmd >= c ? "" : "disabled"}>Max level</button>
      ${r.eq ? `<button class="btn ghost" data-act="unequip" data-id="${r.id}">Unequip</button>` : ""}
      <button class="btn red" data-act="sell" data-id="${r.id}">Sell <span class="cost">${IC.lmd}${fmt(sellValue(r))}</span></button></div>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}

// ---------- headhunt ----------
SCREENS.hh = () => {
  const B = bannerToday(), std = UI.hhStd, f6 = OPS[B.feat6];
  const pity = Math.max(0, S.gacha.pity - 49);
  return `<div class="stack">
    <div class="tabs2"><button class="${std ? "" : "on"}" data-act="hhTab" data-std="0">Featured</button><button class="${std ? "on" : ""}" data-act="hhTab" data-std="1">Standard</button></div>
    <section class="panel banner-card" style="${std ? "background:radial-gradient(90% 90% at 80% 30%,#14306a,transparent 70%),linear-gradient(160deg,#141c30,#0a1020)" : ""}">
      ${std ? `<img src="${spriteURL(OPS.amiya)}" alt="">` : `<img src="${spriteURL(f6)}" alt="${esc(f6.n)}">`}
      <div class="eyebrow">${std ? "Standard Headhunting" : "Featured · rotates daily"}</div>
      <h2>${std ? "Rhodes Island Recruitment" : esc(f6.n)}</h2>
      ${std ? `<p class="small" style="max-width:24ch">Every 3★–6★ operator can appear.</p>` : `<div class="row" style="gap:4px">${starRow(6).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start"')}<span class="el ${f6.el}">${f6.el}</span><span class="cls">${f6.cls}</span></div>
      <p class="small" style="max-width:26ch">50% of 6★ results are ${esc(f6.n)}. Rate-up 5★: ${B.feat5.map(k => esc(OPS[k].n)).join(", ")}.</p>`}
    </section>
    <div class="row wrap small dim"><span>6★ 2% · 5★ 8% · 4★ 50% · 3★ 40%</span>${pity ? `<span class="gold">· 6★ rate now ${2 + pity * 2}%</span>` : `<span>· ${50 - S.gacha.pity > 0 ? 50 - S.gacha.pity : 0} pulls until the 6★ rate starts climbing</span>`}</div>
    ${S.gacha.firstTen ? `<div class="hint">${IC.star.replace("<svg", '<svg width="20" height="20"')}<span class="small">Your first ten-pull guarantees at least one 5★ operator.</span></div>` : ""}
    <div class="row" style="gap:10px">
      <button class="btn ghost" style="flex:1" data-act="pull" data-n="1" ${S.permit >= 1 || S.orundum >= 600 ? "" : "disabled"}>Headhunt ×1<br><span class="cost">${S.permit >= 1 ? IC.permit + "1" : IC.orundum + "600"}</span></button>
      <button class="btn" style="flex:1" data-act="pull" data-n="10" ${S.permit >= 10 || S.orundum >= 6000 ? "" : "disabled"}>Headhunt ×10<br><span class="cost">${S.permit >= 10 ? IC.permit + "10" : IC.orundum + "6,000"}</span></button>
    </div>
    <div class="mats"><span class="mat">${IC.permit}${S.permit}</span><span class="mat">${IC.orundum}${fmt(S.orundum)}</span><span class="mat">${IC.cert}${S.cert}</span></div>
    <p class="tiny dim">Duplicates raise Potential (up to 6) and award Distinction Certificates for the Certificate Store.</p>
  </div>`;
};
function gachaReveal(results) {
  return new Promise(resolve => {
    const top = Math.max(...results.map(r => OPS[r.key].rar));
    const root = $("#gacha");
    root.innerHTML = `<div class="gwrap"><canvas class="gcv" id="gcv"></canvas><div class="gtitle" id="gT"><div class="eyebrow">Headhunting</div><h1>Signal detected</h1><p class="small dim">Tap to reveal</p></div><div class="ggrid" id="gG" hidden></div><button class="btn" id="gDone" hidden>Done</button></div>`;
    root.hidden = false;
    const cv = $("#gcv"), g = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
    const col = RC[top], stars = [];
    for (let k = 0; k < 90; k++) stars.push({ x: R() * W, y: R() * H, v: 2 + R() * 9, l: 20 + R() * 80 });
    let run = true;
    const loop = () => {
      if (!run || !cv.isConnected) return; requestAnimationFrame(loop);
      g.fillStyle = "rgba(2,4,10,.35)"; g.fillRect(0, 0, W, H);
      g.strokeStyle = col; g.lineWidth = 2; g.globalCompositeOperation = "lighter";
      for (const s of stars) { s.y += s.v; s.x -= s.v * .35; if (s.y > H + 40) { s.y = -40; s.x = R() * W * 1.3; } g.globalAlpha = .5; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + s.l * .35, s.y - s.l); g.stroke(); }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    };
    loop(); sfx("special");
    let stage = 0;
    const show = () => {
      stage = 1; $("#gT").hidden = true; const G = $("#gG"); G.hidden = false;
      if (results.length === 1) { G.style.gridTemplateColumns = "1fr"; G.style.maxWidth = "260px"; }
      G.innerHTML = results.map((r, i) => { const op = OPS[r.key]; return `<div class="gcard" style="--rc:${RC[op.rar]};animation-delay:${i * .12}s">${r.isNew ? '<span class="gnew">NEW</span>' : ""}<img src="${spriteURL(op)}" alt="${esc(op.n)}"><span class="gst">${"★".repeat(op.rar)}<br>${esc(op.n)}</span></div>`; }).join("");
      if (top >= 6) sfx("win"); else sfx("heal");
      setTimeout(() => { $("#gDone").hidden = false; stage = 2; }, results.length * 120 + 500);
    };
    root.onclick = ev => {
      if (ev.target.id === "gDone") { run = false; root.hidden = true; root.innerHTML = ""; resolve(); return; }
      if (stage === 0) show();
    };
    setTimeout(() => { if (stage === 0) show(); }, 1600);
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
  const ach = ACHIEVEMENTS.map(a => {
    const ok = a.test(), cl = S.ach[a.id];
    return `<div class="sub spread"><div><b class="small">${esc(a.n)}</b><div class="row tiny">${Object.entries(a.reward).map(([k, n]) => `<span class="cost">${itemIcon(k)}${fmt(n)}</span>`).join(" ")}</div></div>
      <button class="btn sm" data-act="claimAch" data-id="${a.id}" ${ok && !cl ? "" : "disabled"}>${cl ? "Done" : ok ? "Claim" : "Locked"}</button></div>`;
  }).join("");
  openModal(`<div class="stack"><div class="eyebrow">Resets daily</div><h2>Missions</h2>${dl}
    <div class="sub spread"><span class="small">Complete all daily missions: <span class="cost">${IC.permit}1</span></span>
      <button class="btn sm" data-act="claimAllDaily" ${DAILIES.every(d => S.daily.claimed[d.id]) && !S.daily.claimed.all ? "" : "disabled"}>${S.daily.claimed.all ? "Claimed" : "Claim"}</button></div>
    <h3 style="margin-top:6px">Main Line</h3>${ach}
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
SCREENS.shop = () => {
  const tab = SHOP[UI.shopTab] ? UI.shopTab : "credit", cur = { credit: ["credit", IC.credit], cert: ["cert", IC.cert], tokens: ["tokens", IC.tokens], prime: ["prime", IC.prime] }[tab];
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="mat">${cur[1]}${fmt(S[cur[0]])}</span></div>
    <h2>Store</h2>
    <div class="tabs2">${[["credit", "Credit"], ["cert", "Certificate"], ["tokens", "Contract"], ["prime", "Originite"]].map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="shopTab" data-t="${k}">${n}</button>`).join("")}</div>
    <div class="tiles">${SHOP[tab].map(it => `<button class="tile" data-act="buy" data-t="${tab}" data-id="${it.id}" ${S[cur[0]] >= it.cost ? "" : "disabled"} style="min-height:104px">
      <span class="ticon">${it.give.rune ? IC.rune : itemIcon(Object.keys(it.give)[0] === "sanityMax" ? "sanity" : Object.keys(it.give)[0])}</span>
      <h3 style="font-size:15px">${esc(it.n)}</h3>${it.d ? `<span class="tsub">${esc(it.d)}</span>` : ""}<span class="tsub cost">${cur[1]}${fmt(it.cost)}</span></button>`).join("")}</div>
  </div>`;
};
SCREENS.depot = () => {
  const tab = UI.depotTab;
  const runes = S.runes.filter(r => UI.runeSet === "all" || r.set === UI.runeSet).sort((a, b) => b.rar - a.rar || b.lvl - a.lvl);
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Depot</span></div>
    <h2>Depot</h2>
    <div class="tabs2"><button class="${tab === "runes" ? "on" : ""}" data-act="depotTab" data-t="runes">Modules · ${S.runes.length}</button><button class="${tab === "mats" ? "on" : ""}" data-act="depotTab" data-t="mats">Materials</button></div>
    ${tab === "runes" ? `<div class="filters">${["all", ...RUNE_SETS].map(s => `<button class="chip ${UI.runeSet === s ? "on" : ""}" data-act="runeSetF" data-s="${s}">${s === "all" ? "All sets" : s}</button>`).join("")}</div>
      ${runes.length ? runes.map(r => runeRow(r, `<button class="btn sm ghost" data-act="runeSheet" data-id="${r.id}">Manage</button>`)).join("") : '<p class="small dim">No modules yet. Clear Supplies operations in the Terminal to collect them.</p>'}
      ${S.runes.some(r => !r.eq && r.rar <= 2) ? `<button class="btn ghost wide" data-act="sellJunk">Sell all unequipped T1 and T2 modules</button>` : ""}`
    : `<div class="rewards" style="justify-content:flex-start">${["rec1", "rec2", "rec3", "rec4", "chip", "summ", "permit", "cert", "tokens", "prime", "credit"].map(k => `<div class="rw"><div class="ri" style="width:54px;height:54px">${itemIcon(k)}</div><span class="num">×${fmt(have(k))}</span><span class="tiny dim">${ITEMS[k].n}</span></div>`).join("")}</div>`}
  </div>`;
};
function settingsModal(confirmReset) {
  openModal(`<div class="stack"><h2>Profile</h2>
    <label class="small dim" for="pname">Doctor name</label>
    <input id="pname" maxlength="16" value="${esc(S.name)}" style="font:600 16px var(--f-body);padding:10px 12px;background:var(--hull2);color:var(--text);border:1px solid var(--line2);border-radius:6px">
    <div class="statgrid small"><div><span>Doctor level</span><b>${S.lvl}</b></div><div><span>Roster power</span><b>${fmtFull(rosterPower())}</b></div><div><span>Battles won</span><b>${S.stats.wins}</b></div><div><span>Headhunts</span><b>${S.gacha.total}</b></div></div>
    <button class="btn ghost wide" data-act="toggleSound">Sound: ${S.settings.sound ? "On" : "Off"}</button>
    <button class="btn ghost wide" data-act="cycleAi">Auto-battle AI: ${S.settings.ai}</button>
    ${confirmReset ? `<div class="sub stack" style="gap:8px;border-color:var(--ds)"><b class="small">Erase all progress?</b><p class="tiny dim">Your operators, modules, story progress and currencies will be deleted from this browser.</p>
      <div class="row"><button class="btn red sm" data-act="doReset">Erase progress</button><button class="btn ghost sm" data-act="settings">Keep playing</button></div></div>`
      : `<button class="btn ghost wide" data-act="askReset">Reset progress</button>`}
    <p class="tiny dim">Progress saves in this browser. Arknights Tactics is an unofficial, non-commercial fan game. Arknights characters and art belong to Hypergryph and Yostar.</p>
    <button class="btn wide" data-act="saveName">Done</button></div>`);
}
function sanityModal() {
  openModal(`<div class="stack"><h2>Sanity</h2><p class="small dim">Operations cost Sanity. You regain 1 every 30 seconds, a Doctor level-up refills it, and 1 Originite Prime restores it to max.</p>
    <div class="spread"><span class="cost">${IC.sanity}<b class="num">${S.sanity}/${maxSanity(S.lvl)}</b></span><span class="tiny dim">${S.sanity < maxSanity(S.lvl) ? "+1 in " + dur(SAN_MS - (Date.now() - S.sTime)) : "Full"}</span></div>
    <button class="btn wide" data-act="buy" data-t="prime" data-id="p_san" ${S.prime >= 1 ? "" : "disabled"}>Restore <span class="cost">${IC.prime}1</span> <span class="tiny">(you have ${S.prime})</span></button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
function rewardModal(title, list, sub = "") {
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">${esc(sub)}</div><h2>${esc(title)}</h2>
    <div class="rewards">${rewardsHTML(list)}</div><button class="btn wide" data-act="closeModal">Collect</button></div>`);
}
