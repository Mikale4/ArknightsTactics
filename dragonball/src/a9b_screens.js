
// =====================================================================
//  SCREENS (2/2): Battle hub, Beyblades, Customize Parts, Random Boosters, missions, hobby shop
// =====================================================================
SCREENS.battle = () => {
  const A = S.arena, payReady = Date.now() - A.payTime >= PAYOUT_MS, nd = nextNode();
  return `<div class="stack">
    <h2>Battle</h2>
    <button class="tile wide ls-t" data-act="go" data-v="story" style="min-height:76px"><span class="ticon" style="color:var(--holo)">${IC.story}</span>
      <div class="eyebrow">Main Story</div><h3>${esc(STORY[0].title)}</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "Every tournament won"}</span></button>
    <div class="eyebrow">Street Battles · win Customize Parts</div>
    ${HUNTS.map(h => {
      const best = (S.hunt && S.hunt[h.id]) || 0, boss = h.waves(1)[1][0].e;
      return `<button class="tile wide" data-act="go" data-v="hunt" data-a="${h.id}" style="min-height:96px;background:linear-gradient(120deg,${mapTheme(h.env).a},var(--hull2) 70%)">
        <span class="ticon" style="width:56px;height:56px;right:10px;top:10px"><img src="${enemyArt(boss).head}" alt="" style="width:100%;border-radius:50%"></span>
        <div class="eyebrow">${h.code}-1 to ${h.code}-6 · ${best ? h.code + "-" + best + " cleared" : "not cleared"}</div><h3>${esc(h.n)}</h3><span class="tsub">${esc(h.sub)}</span>
        <span class="tsub">Prizes: ${h.parts.map(m => PART_MODELS[m].n).slice(0, 4).join(", ")}${h.parts.length > 4 ? "…" : ""}</span></button>`;
    }).join("")}
    <div class="tiles">
      <button class="tile" data-act="go" data-v="tower"><span class="ticon" style="color:var(--holo)">${IC.tower}</span><h3>BBA Tower</h3><span class="tsub">Floor ${Math.min(S.tower + 1, TOWER_FLOORS)}/${TOWER_FLOORS}</span></button>
      <button class="tile" data-act="go" data-v="arena"><span class="ticon" style="color:var(--gold)">${IC.arena}</span><h3>Ranked Battles</h3><span class="tsub">Rank #${A.rank} · ${A.attempts}/5${payReady ? " · rewards ready" : ""}</span></button>
    </div>
  </div>`;
};
SCREENS.hunt = id => {
  const h = HUNTS.find(x => x.id === id), best = (S.hunt && S.hunt[id]) || 0;
  const lvl = UI.huntLv && UI.huntLv[id] || Math.min(6, best + 1);
  const lv = HUNT_LV[lvl - 1], foes = huntTeam(h, lvl);
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Street Battles</span></div>
    <h2>${h.code}-${lvl} ${esc(h.n)}</h2><p class="small dim">${esc(h.sub)}. Rivals are level ${lv}; the boss is level ${lv + 3}.</p>
    <div class="chips">${[1, 2, 3, 4, 5, 6].map(k => `<button class="chip ${k === lvl ? "on" : ""}" data-act="huntLv" data-h="${id}" data-l="${k}" ${k <= best + 1 ? "" : "disabled"}>${h.code}-${k}</button>`).join("")}</div>
    <div><div class="tiny dim" style="margin-bottom:4px">Rival team · one-on-one tag battle</div><div class="row wrap">${foes.map(s => enHTML(s, s.en && ENEMY[s.en].boss ? 56 : 46)).join("")}</div></div>
    <section class="sub stack" style="gap:6px"><div class="small"><b>Customize Part prizes</b> <span class="dim">· 2–3 per win</span></div>
      <div class="chips">${h.parts.map(m => `<span class="chip" title="${esc(PART_MODELS[m].d)}">${esc(PART_MODELS[m].n)}</span>`).join("")}</div>
      <div class="tiny dim">${HUNT_RAR[lvl - 1].map((p, i) => p ? `${PART_GRADE[i + 1]} ${Math.round(p * 100)}%` : "").filter(Boolean).join(" · ")}</div></section>
    <div class="row">
      ${best >= lvl ? `<button class="btn ghost" data-act="huntSweep" data-h="${id}" data-l="${lvl}">Quick Clear ×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="huntGo" data-h="${id}" data-l="${lvl}">Battle <span class="cost">${IC.sanity}${HUNT_COST[lvl - 1]}</span></button>
    </div>
  </div>`;
};
SCREENS.tower = () => {
  const cur = Math.min(S.tower + 1, TOWER_FLOORS), done = S.tower >= TOWER_FLOORS;
  const floors = [];
  for (let f = Math.min(TOWER_FLOORS, cur + 2); f >= Math.max(1, cur - 3); f--) floors.push(towerFloor(f));
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">BBA Tower</span></div>
    <h2>${done ? "Tower cleared" : "Floor " + cur}</h2>
    <p class="small dim">Each floor can be cleared once. Every fifth floor is a champion with a Booster Ticket, and even floors from 8 on are against other Bladers' teams.</p>
    ${floors.map(T => {
      const state = T.f <= S.tower ? "done" : T.f === cur ? "next" : "locked";
      return `<section class="panel stack" style="gap:8px;${state === "next" ? "box-shadow:inset 0 0 0 2px var(--gold)" : state === "locked" ? "opacity:.5" : ""}">
        <div class="spread"><b>Floor ${T.f}${T.f % 5 === 0 ? " · Champion" : ""}</b><span class="tiny dim">Lv ${T.lv}</span></div>
        <div class="row wrap">${rivalTeam(T.waves, T.lv).map(s => enHTML(s, 40)).join("")}</div>
        <div class="spread"><div class="rewards" style="justify-content:flex-start;transform:scale(.85);transform-origin:left">${rewardsHTML(Object.entries(T.reward).map(([k, n]) => ({ k, n })))}</div>
        ${state === "next" ? `<button class="btn sm" data-act="towerGo" data-f="${T.f}">Battle</button>` : state === "done" ? `<span class="tiny gold">Cleared</span>` : ""}</div>
      </section>`;
    }).join("")}
  </div>`;
};
SCREENS.arena = () => {
  tickTimers();
  if (!S.arena.opps) genOpps();
  const A = S.arena, now = Date.now(), payReady = now - A.payTime >= PAYOUT_MS, po = payout(A.rank);
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Ranked Battles</span></div>
    <section class="panel" style="background:radial-gradient(100% 120% at 100% 0%,#0a2a6a,var(--hull) 60%)">
      <div class="spread"><div><div class="eyebrow">BBA world ranking</div><div style="font:900 44px var(--f-title);line-height:1" class="num gold">#${A.rank}</div></div>
      <div style="text-align:right" class="small"><div>Attempts <b class="num">${A.attempts}/5</b></div>${A.attempts < 5 ? `<div class="tiny dim num">+1 in <span data-cd="att">${dur(ARENA_MS - (now - A.aTime))}</span></div>` : ""}<div class="row" style="justify-content:flex-end;margin-top:4px"><span class="cost">${IC.tokens}${fmt(S.tokens)}</span></div></div></div>
      <div class="divider" style="margin:10px 0"></div>
      <div class="spread small"><span>Rank rewards: <span class="cost">${IC.orundum}${po.orundum}</span> <span class="cost">${IC.tokens}${po.tokens}</span></span>
        <button class="btn sm" data-act="payout" ${payReady ? "" : "disabled"}>${payReady ? "Claim" : `<span data-cd="pay">${dur(PAYOUT_MS - (now - A.payTime))}</span>`}</button></div>
    </section>
    <div class="spread"><h3>Challengers</h3><button class="btn ghost sm" data-act="newOpps">New challengers</button></div>
    ${A.opps.map((o, k) => `<section class="panel stack" style="gap:8px">
      <div class="spread"><div class="row" style="gap:8px;min-width:0"><img class="rvlook" src="${rivalHead(o)}" alt=""><div style="min-width:0"><b>${esc(o.name)}</b><div class="tiny gold">${esc(o.cls || "Street Blader")}</div><div class="tiny dim">Rank #${o.rank} · Power <span class="num">${fmtFull(o.pw)}</span></div></div></div>
      <button class="btn sm" data-act="arenaGo" data-k="${k}" ${A.attempts > 0 ? "" : "disabled"}>Battle</button></div>
      <div class="row">${o.team.map(u => opHTML(u.op, { s: 48, prog: progForLV(u.op, u.LV) })).join("")}</div></section>`).join("")}
    <p class="tiny dim">Spend Ranking Points at the hobby shop.</p>
  </div>`;
};

// ---------- characters ----------
SCREENS.ops = () => {
  let list = UI.all ? OP_KEYS.slice() : Object.keys(S.ops);
  list = list.filter(k => (UI.el === "all" || OPS[k].el === UI.el) && (UI.sty === "all" || OPS[k].squad === UI.sty) && (UI.cls === "all" || String(OPS[k].season) === UI.cls));
  const sorters = { power: (a, b) => (S.ops[b] ? power(b, S.ops[b]) : -1) - (S.ops[a] ? power(a, S.ops[a]) : -1), rarity: (a, b) => OPS[b].rar - OPS[a].rar || OPS[a].n.localeCompare(OPS[b].n), level: (a, b) => (S.ops[b] ? effLV(S.ops[b]) : -1) - (S.ops[a] ? effLV(S.ops[a]) : -1), name: (a, b) => OPS[a].n.localeCompare(OPS[b].n) };
  list.sort(sorters[UI.sort]);
  return `<div class="stack">
    <div class="spread"><h2>Beyblades</h2><button class="chip ${UI.all ? "on" : ""}" data-act="toggleAll">${UI.all ? "Collection" : "Owned"} · ${Object.keys(S.ops).length}/${OP_KEYS.length}</button></div>
    <div class="filters">${["all", ...ELS].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}">${e === "all" ? "All types" : e}</button>`).join("")}</div>
    <div class="filters">${["all", ...TEAMS].map(e => `<button class="chip ${UI.sty === e ? "on" : ""}" data-act="styf" data-e="${e}">${e === "all" ? "All teams" : e}</button>`).join("")}</div>
    <div class="filters">${["all", "1", "2", "3"].map(c => `<button class="chip ${UI.cls === c ? "on" : ""}" data-act="clsf" data-c="${c}">${c === "all" ? "All seasons" : SEASONS[c]}</button>`).join("")}</div>
    <div class="filters">${["power", "rarity", "level", "name"].map(s => `<button class="chip ${UI.sort === s ? "on" : ""}" data-act="sortf" data-s="${s}">Sort: ${s}</button>`).join("")}</div>
    <div class="roster">${list.map(k => `<button class="rcell ${S.ops[k] && canPromote(k) ? "ready" : ""}" data-act="go" data-v="op" data-a="${k}">${opHTML(k)}${pnameHTML(k)}<div class="pw">${S.ops[k] ? fmt(power(k, S.ops[k])) : SEASONS[OPS[k].season]}</div></button>`).join("") || '<p class="small dim">No Beyblades match these filters.</p>'}</div>
  </div>`;
};
SCREENS.op = key => {
  const op = OPS[key], p = S.ops[key], tab = UI.opTab;
  const st = p ? opStats(key, p).st : opStats(key, mkProg()).st;
  const tabs = [["info", "Status"], ["skills", "Moves"], ["upgrade", "Level Up"], ["runes", "Customize"]];
  let body = "";
  if (tab === "info" || !p) body = `<section class="panel"><h3 style="margin-bottom:8px">Stats${p ? "" : " (Lv 1)"}</h3><div class="statgrid">
      <div><span>Spin</span><b>${fmtFull(st.hp)}</b></div><div><span>ATK</span><b>${fmtFull(st.atk)}</b></div>
      <div><span>DEF</span><b>${fmtFull(st.def)}</b></div><div><span>SPD</span><b>${st.spd}</b></div>
      <div><span>Crit Rate</span><b>${pct(st.cr)}</b></div><div><span>Crit Damage</span><b>${pct(st.cd)}</b></div>
      <div><span>Accuracy</span><b>${pct(st.acc)}</b></div><div><span>Resistance</span><b>${pct(st.res)}</b></div></div></section>
    <section class="panel stack" style="gap:8px">
      <div><b class="gold">Captain skill</b><p class="small dim">${op.leader ? leaderText(op.leader) : "None"}</p></div>
      ${op.passives.length ? `<div><b class="gold">Blader Ability</b><p class="small dim">${op.passives.map(x => esc(x.text)).join(" ")}</p></div>` : ""}
      <div><b class="gold">${elName(op.el)} · ${TYPE_TRAIT[op.el].n}</b><p class="small dim">${TYPE_TRAIT[op.el].d} ${BEATS[op.el] ? `Strong against ${BEATS[op.el]}, weak to ${weakTo(op.el)}.` : "Balance types have no weakness and no edge."}</p></div>
      <div><b class="gold">Bit-Beast · ${esc(op.beast.n)}</b><p class="small dim">${esc(op.beast.d || "")} ${esc(op.beast.el)} element: ${esc(op.beastKit)}</p></div>
      <div><b class="gold">Stock parts</b><p class="small dim">${(b => PART_SLOTS.map(s => PART_MODELS[b[s]].n).join(" · "))(stockModels(op, key))}. ${esc(partTraitText(stockModels(op, key).bb))}.</p></div>
      ${p ? `<div><b class="gold">Bit-Beast Sync ${p.pot}/6</b><p class="small dim">+2% to all stats per level. Raised by getting the same Beyblade again from Boosters.</p></div>` : `<p class="small dim">Find this Beyblade in a Random Booster.</p>`}
    </section>`;
  else if (tab === "skills") body = `<section class="panel stack" style="gap:10px">${op.skills.map((sk, i) => {
      const r = p.sk[i], c = skillCost(r), lock = r >= 4 && p.elite < 1;
      return `<div class="ab"><div class="abicon ${i ? "special" : ""}">${skillIcon({ cls: op.cls }, sk)}</div>
        <div class="stack" style="gap:4px;min-width:0"><div class="spread"><b>${sk.arc ? "Bit" : "S" + sk.slot} ${esc(sk.name)}</b><span class="tag">${sk.arc ? "Bit-Beast attack" : sk.cd ? `Technique · ${Math.round(sk.cd * S2_TURN)}s cooldown` : "Attack · " + S1_CD + "s"}</span></div>
        <p class="small dim">${esc(sk.desc)}</p>
        <div class="spread"><div class="row" style="gap:6px"><b class="tiny gold">Level ${RANK[r]}</b><div class="pips">${[1, 2, 3, 4, 5, 6, 7].map(k => `<i class="${k <= r ? "on" : ""} ${k >= 5 ? "om" : ""}"></i>`).join("")}</div></div>
        ${r < 7 ? `<button class="btn sm ghost" data-act="skUp" data-k="${key}" data-i="${i}" ${!lock && S.inv.summ >= c.summ && S.lmd >= c.lmd ? "" : "disabled"}>${lock ? "Needs Upgrade 1" : `<span class="cost">${IC.summ}${c.summ}</span><span class="cost">${IC.lmd}${fmt(c.lmd)}</span>`}</button>` : '<span class="tiny gold">Level MAX</span>'}</div></div></div>`;
    }).join('<div class="divider"></div>')}<p class="tiny dim">Moves level from 1 to MAX with Training Scrolls. Each level adds 6% damage and Spin recovery; MAX also shortens the technique's cooldown. Levels 5 to MAX need Upgrade 1. Attack is your rush at the rival, the technique has a cooldown, and the Bit-Beast attack costs 100% Bit Power. Higher SPD shortens every cooldown.</p></section>`;
  else if (tab === "upgrade") {
    const cap = LV_CAP[p.elite], need = xpNeed(p.lvl, p.elite), nextE = p.elite + 1, ec = nextE <= op.maxElite ? eliteCost(key, nextE) : null;
    body = `<section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Level ${p.lvl}<span class="dim small"> / ${cap}</span></h3><span class="small dim num">${p.lvl >= cap ? "Level cap" : `${fmtFull(p.xp)}/${fmtFull(need)} EXP`}</span></div>
      <div class="bar"><i style="width:${p.lvl >= cap ? 100 : p.xp / need * 100}%"></i></div>
      <div class="row wrap">${["rec1", "rec2", "rec3", "rec4"].map(it => `<button class="btn ghost sm" data-act="rec" data-k="${key}" data-it="${it}" ${S.inv[it] > 0 && p.lvl < cap ? "" : "disabled"}><span class="cost">${ITEMS[it].ic}×${S.inv[it] || 0}</span></button>`).join("")}
        <button class="btn sm blue" data-act="autoLv" data-k="${key}" ${p.lvl < cap && ["rec1", "rec2", "rec3", "rec4"].some(i => S.inv[i] > 0) ? "" : "disabled"}>Auto</button></div>
    </section>
    <section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Upgrade ${p.elite}</h3><span class="tiny dim">Max Upgrade ${op.maxElite}</span></div>
      ${ec ? `<p class="small dim">Upgrade at level ${cap} to reach Upgrade ${nextE}: new metal parts, a higher level cap (${LV_CAP[nextE]}) and stronger base stats.</p>
        <div class="spread small"><span>Cost</span><span class="row"><span class="cost">${IC.chip}${S.inv.chip}/${ec.chip}</span><span class="cost">${IC.lmd}${fmt(ec.lmd)}</span></span></div>
        <button class="btn wide" data-act="promote" data-k="${key}" ${canPromote(key) ? "" : "disabled"}>${p.lvl < cap ? `Reach level ${cap} first` : "Upgrade to stage " + nextE}</button>`
      : `<p class="small gold">${op.maxElite === p.elite ? "Fully Upgraded." : ""}</p>`}
    </section>`;
  } else if (tab === "runes") {
    const build = opStats(key, p).build, slot = PART_SLOTS.includes(UI.partSlot) ? UI.partSlot : "ar", cur = build[slot];
    const P = physOf(build, op.el);
    const free = S.parts.filter(x => partSlot(x) === slot && (!x.eq || x.eq.k !== key)).sort((a, b) => b.rar - a.rar || b.lvl - a.lvl);
    body = `<section class="panel stack" style="gap:8px"><h3>Customize Parts</h3>
      <div class="pslots">${PART_SLOTS.map(s => { const b = build[s], pt = b.part;
        return `<button class="pslot ${s === slot ? "on" : ""}" data-act="partSlotF" data-s="${s}" style="--pc:${PART_GC[pt ? pt.rar : 0]}"><span class="tiny dim">${SLOT_NAME[s]}</span><b>${esc(PART_MODELS[b.m].n)}</b><span class="tiny" style="color:var(--pc)">${pt ? PART_GRADE[pt.rar] + (pt.lvl ? " +" + pt.lvl : "") : "Stock"}</span></button>`; }).join("")}</div>
      <div class="sub stack" style="gap:4px"><div class="small"><b>${esc(PART_MODELS[cur.m].n)}</b> <span class="dim">${esc(PART_MODELS[cur.m].d)}</span></div>
        <div class="tiny dim">${esc(partStatText(cur.m, cur.part ? cur.part.rar : 0, cur.part ? cur.part.lvl : 0))}${partTraitText(cur.m) ? " · " + esc(partTraitText(cur.m)) : ""}</div>
        ${cur.part ? `<div class="row" style="margin-top:4px"><button class="btn sm ghost" data-act="partSheet" data-id="${cur.part.id}">Tune up</button><button class="btn sm ghost" data-act="unfit" data-k="${key}" data-s="${slot}">Use stock part</button></div>` : ""}</div>
      <div class="statgrid">
        <div><span>Weight</span><b>${P.weight.toFixed(2)}</b></div><div><span>Speed</span><b>${Math.round(P.speed * 100)}%</b></div>
        <div><span>Knockback</span><b>×${P.smash.toFixed(2)}</b></div><div><span>Holds ground</span><b>${P.guard >= 0 ? "+" : ""}${Math.round(P.guard * 100)}%</b></div>
        <div><span>Stamina</span><b>${P.stamina >= 0 ? "+" : ""}${Math.round(P.stamina * 100)}%</b></div><div><span>Rotation</span><b>${P.spin === "D" ? "Dual" : P.spin === "L" ? "Left" : "Right"}</b></div>
      </div>
      <p class="tiny dim">Parts change how the Beyblade moves and fights in the dish: the Blade Base sets its movement, the Weight Disk its weight, the Attack Ring its knockback and recoil, and the Spin Gear its rotation. Opposite spins clash harder; the same spin grinds.</p></section>
      <section class="stack" style="gap:6px"><div class="spread"><h3>Your ${SLOT_NAME[slot]}s</h3><span class="tiny dim">${free.length} available</span></div>
      ${free.length ? free.slice(0, 40).map(x => partRow(x, `<button class="btn sm" data-act="fit" data-k="${key}" data-id="${x.id}">Fit</button>`)).join("") : `<p class="small dim">No other ${SLOT_NAME[slot]}s yet. Street Battles and the Hobby Shop have more.</p>`}</section>`;
  }
  return `<div class="stack">
    <div class="spread">${back("go", "Beyblades", 'data-v="ops"')}${p ? `<button class="btn ghost sm" data-act="assistant" data-k="${key}" ${S.assistant === key ? "disabled" : ""}>${S.assistant === key ? "Partner" : "Set as partner"}</button>` : ""}</div>
    <section class="panel" style="padding:12px;overflow:hidden">
      <div class="opart" style="--ecs:${ELC[op.el]}55"><img src="${spriteURL(op)}" alt="${esc(op.n)}">
        <div class="meta">${starRow(op.rar).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start;height:14px"')}
          <div class="eyebrow" style="text-shadow:0 1px 3px #000">${esc(op.bladerFull)} · ${esc(op.team)}</div>
          <h2 style="font-size:26px;text-shadow:0 2px 6px #000">${esc(op.n)}</h2>
          <div class="row" style="gap:4px">${elChip(op.el)}${beastChip(op)}<span class="cls">${SEASONS[op.season]}</span></div>
          ${p ? `<div class="small" style="text-shadow:0 1px 3px #000">Upgrade ${p.elite} · Lv ${p.lvl} · Power <b class="num" style="color:var(--holo)">${fmtFull(power(key, p))}</b></div>` : `<div class="small dim">Not collected</div>`}
        </div></div>
    </section>
    ${variantsOf(op.base).length > 1 ? `<section class="panel stack" style="padding:10px 12px;gap:10px">
      ${verRow(`${esc(op.blader)}'s Beyblades · each version has its own type and moves`, variantsOf(op.base), key, verLabel, k => ELC[OPS[k].el])}
      <p class="tiny dim">Every version is a separate Beyblade you collect and raise on its own.</p></section>` : ""}
    ${p ? `<div class="tabs2">${tabs.map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="opTab" data-t="${k}">${n}</button>`).join("")}</div>` : ""}
    ${body}
  </div>`;
};
// a row of a Blader's other Beyblades, owned ones in colour
// short label for a version: the generation letter (S, F, V, V2, G, GT, MS) or number, "Black" for Black Dranzer
const verLabel = k => { const n = OPS[k].n; return /^Black /.test(n) ? "Black" : n.split(" ").length > 1 ? n.split(" ").pop() : n; };
function verRow(title, keys, cur, label, col) {
  return `<div><div class="eyebrow" style="margin-bottom:6px">${title}</div><div class="variants">${keys.map(k => `<button class="${k === cur ? "cur" : ""} ${S.ops[k] ? "" : "unowned"}" data-act="go" data-v="op" data-a="${k}" ${k === cur ? "disabled" : ""}>${opHTML(k, { s: 46, nostars: 1, show: 1 })}<span class="tiny" style="color:${col(k)}">${label(k)}</span></button>`).join("")}</div></div>`;
}
function partRow(pt, right = "") {
  const m = PART_MODELS[pt.m];
  return `<div class="rune ${pt.eq ? "eq" : ""}" style="--rc:${PART_GC[pt.rar]}"><button class="rg" data-act="partSheet" data-id="${pt.id}" aria-label="${esc(m.n)}">+${pt.lvl}</button>
    <div style="min-width:0"><b>${esc(m.n)}</b> <span class="tiny" style="color:${PART_GC[pt.rar]}">${PART_GRADE[pt.rar]}</span><div class="tiny dim">${SLOT_NAME[m.slot]} · ${esc(partStatText(pt.m, pt.rar, pt.lvl))}${pt.eq ? ` · on ${esc(OPS[pt.eq.k].n)}` : ""}</div></div>${right}</div>`;
}
function partSheet(pt) {
  const c = partCost(pt), m = PART_MODELS[pt.m];
  openModal(`<div class="stack"><div class="rune" style="--rc:${PART_GC[pt.rar]}"><span class="rg">+${pt.lvl}</span><div><b>${esc(m.n)}</b> <span class="tiny" style="color:${PART_GC[pt.rar]}">${PART_GRADE[pt.rar]} ${SLOT_NAME[m.slot]}</span><div class="tiny dim">${esc(m.d)}</div></div></div>
    <div class="statgrid"><div><span>Stats</span><b>${esc(partStatText(pt.m, pt.rar, pt.lvl))}</b></div><div><span>Level</span><b>+${pt.lvl} / 15</b></div></div>
    ${partTraitText(pt.m) ? `<p class="small">${esc(partTraitText(pt.m))}</p>` : ""}
    <p class="small dim">${pt.eq ? `Fitted to ${esc(opLabel(OPS[pt.eq.k]))}.` : "Not fitted."} Tune-ups always succeed and raise the part's stats; its grade sets how far they go.</p>
    <div class="row wrap"><button class="btn" data-act="tune" data-id="${pt.id}" ${pt.lvl < 15 && S.lmd >= c ? "" : "disabled"}>Tune up <span class="cost">${IC.lmd}${fmt(c)}</span></button>
      <button class="btn ghost" data-act="tuneMax" data-id="${pt.id}" ${pt.lvl < 15 && S.lmd >= c ? "" : "disabled"}>Max level</button>
      ${pt.eq ? `<button class="btn ghost" data-act="takeOff" data-id="${pt.id}">Take off</button>` : ""}
      <button class="btn red" data-act="sell" data-id="${pt.id}">Sell <span class="cost">${IC.lmd}${fmt(partSellValue(pt))}</span></button></div>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}

// ---------- headhunt ----------
SCREENS.hh = () => {
  const B = bannerToday(), std = UI.hhStd, f6 = OPS[B.feat6];
  const pity = Math.max(0, S.gacha.pity - 49);
  return `<div class="stack">
    <div class="tabs2"><button class="${std ? "" : "on"}" data-act="hhTab" data-std="0">Booster of the Day</button><button class="${std ? "on" : ""}" data-act="hhTab" data-std="1">Standard</button></div>
    <section class="panel banner-card" style="${std ? "background:radial-gradient(90% 90% at 80% 30%,#14408a,transparent 70%),linear-gradient(160deg,#0e1a3a,#050a18)" : "background:radial-gradient(90% 90% at 80% 30%,#8a3a0a,transparent 70%),linear-gradient(160deg,#2a1406,#0a0602)"}">
      ${std ? `<img src="${spriteURL(OPS[STARTERS[0]])}" alt="">` : `<img src="${spriteURL(f6)}" alt="${esc(f6.n)}">`}
      <div class="eyebrow">${std ? "Standard Random Booster" : "Featured · changes daily"}</div>
      <h2>${std ? "Every Blader's Beyblade" : esc(f6.n)}</h2>
      ${std ? `<p class="small" style="max-width:24ch">Any Beyblade from all three seasons can be inside.</p>` : `<div class="row" style="gap:4px">${starRow(5).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start"')}${elChip(f6.el)}${beastChip(f6)}</div>
      <p class="small" style="max-width:26ch">${esc(f6.blader)}'s ${esc(f6.n)} is half of all 5★ results. Featured 4★: ${B.feat5.map(k => esc(OPS[k].n)).join(", ")}.</p>`}
    </section>
    <div class="row wrap small dim"><span>5★ 3% · 4★ 18% · 3★ 79%</span>${pity ? `<span class="gold">· 5★ rate now ${3 + pity * 3}%</span>` : `<span>· ${Math.max(0, 50 - S.gacha.pity)} Boosters until the 5★ rate starts rising</span>`}</div>
    ${S.inv.free10 > 0 ? `<button class="btn wide freepull" data-act="pullFree10">${IC.free10.replace("<svg", '<svg width="26" height="26"')}<span>Open 10 free Boosters on this banner<br><small>Starter Booster ×${S.inv.free10}</small></span></button>` : ""}
    ${S.inv.gold5 > 0 ? `<button class="btn wide freepull crimson" data-act="pullGold5">${IC.gold5.replace("<svg", '<svg width="26" height="26"')}<span>Legendary Bit-Chip: a random 5★ Beyblade<br><small>×${S.inv.gold5}</small></span></button>` : ""}
    ${S.gacha.firstTen ? `<div class="hint">${IC.star.replace("<svg", '<svg width="20" height="20"')}<span class="small">Your first ten Boosters guarantee at least one 4★ Beyblade.</span></div>` : ""}
    <div class="row" style="gap:10px">
      <button class="btn ghost" style="flex:1" data-act="pull" data-n="1" ${S.permit >= 1 || S.orundum >= 600 ? "" : "disabled"}>Open ×1<br><span class="cost">${S.permit >= 1 ? IC.permit + "1" : IC.orundum + "600"}</span></button>
      <button class="btn" style="flex:1" data-act="pull" data-n="10" ${S.permit >= 10 || S.orundum >= 6000 ? "" : "disabled"}>Open ×10<br><span class="cost">${S.permit >= 10 ? IC.permit + "10" : IC.orundum + "6,000"}</span></button>
    </div>
    <div class="mats"><span class="mat">${IC.permit}${S.permit}</span><span class="mat">${IC.orundum}${fmt(S.orundum)}</span><span class="mat">${IC.cert}${S.cert}</span></div>
    <p class="tiny dim">Each Random Booster holds one Beyblade. Getting one you already have raises its Bit-Beast Sync (up to 6) and leaves Spare Parts for the hobby shop.</p>
  </div>`;
};
function gachaReveal(results) {
  return new Promise(resolve => {
    const top = Math.max(...results.map(r => OPS[r.key].rar));
    const root = $("#gacha");
    root.innerHTML = `<div class="gwrap"><canvas class="gcv" id="gcv"></canvas><div class="gtitle" id="gT"><div class="eyebrow">Random Booster</div><h1>3, 2, 1… Let it rip!</h1><p class="small dim">Tap to open</p></div><div class="ggrid" id="gG" hidden></div><button class="btn" id="gDone" hidden>Done</button></div>`;
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
      G.innerHTML = results.map((r, i) => { const op = OPS[r.key]; return `<div class="gcard" style="--rc:${RC[op.rar]};animation-delay:${i * .12}s">${r.isNew ? '<span class="gnew">NEW</span>' : ""}<img src="${spriteURL(op)}" alt="${esc(op.n)}"><span class="gst">${"★".repeat(op.rar)}<br>${esc(op.n)}<br><span style="font-size:.85em"><b style="color:${ELC[op.el]}">${elShort(op.el)}</b> ${esc(op.blader)}</span></span></div>`; }).join("");
      if (top >= 5) sfx("win"); else sfx("heal");
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
  openModal(`<div class="stack"><div class="eyebrow">Resets daily</div><h2>Daily Training</h2>${dl}
    <div class="sub spread"><span class="small">Finish all of today's training: <span class="cost">${IC.permit}1</span></span>
      <button class="btn sm" data-act="claimAllDaily" ${DAILIES.every(d => S.daily.claimed[d.id]) && !S.daily.claimed.all ? "" : "disabled"}>${S.daily.claimed.all ? "Claimed" : "Claim"}</button></div>
    <button class="btn ghost wide" data-act="go" data-v="ach">${IC.trophy.replace("<svg", '<svg width="18" height="18"')} BBA Records · ${achDone()}/${achTotal}</button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
SCREENS.shop = () => {
  const tab = SHOP[UI.shopTab] ? UI.shopTab : "credit", cur = { credit: ["credit", IC.credit], cert: ["cert", IC.cert], tokens: ["tokens", IC.tokens], prime: ["prime", IC.prime] }[tab];
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="mat">${cur[1]}${fmt(S[cur[0]])}</span></div>
    <h2>Hobby Shop</h2><p class="small dim">Max's dad keeps a little of everything behind the counter, and a Beystadium out back for testing.</p>
    <div class="tabs2">${[["credit", "Coupons"], ["cert", "Spare Parts"], ["tokens", "Ranking"], ["prime", "Drinks"]].map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="shopTab" data-t="${k}">${n}</button>`).join("")}</div>
    <div class="tiles">${SHOP[tab].map(it => `<button class="tile" data-act="buy" data-t="${tab}" data-id="${it.id}" ${S[cur[0]] >= it.cost ? "" : "disabled"} style="min-height:104px">
      <span class="ticon">${itemIcon(Object.keys(it.give)[0] === "sanityMax" ? "sanity" : Object.keys(it.give)[0])}</span>
      <h3 style="font-size:15px">${esc(it.n)}</h3>${it.d ? `<span class="tsub">${esc(it.d)}</span>` : ""}<span class="tsub cost">${cur[1]}${fmt(it.cost)}</span></button>`).join("")}</div>
  </div>`;
};
SCREENS.depot = () => {
  const tab = UI.depotTab;
  const f = UI.depotSlot || "all", parts = S.parts.filter(pt => f === "all" || partSlot(pt) === f).sort((a, b) => b.rar - a.rar || b.lvl - a.lvl);
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Items</span></div>
    <h2>Items</h2>
    <div class="tabs2"><button class="${tab === "parts" ? "on" : ""}" data-act="depotTab" data-t="parts">Parts · ${S.parts.length}</button><button class="${tab === "mats" ? "on" : ""}" data-act="depotTab" data-t="mats">Materials</button></div>
    ${tab === "parts" ? `<div class="filters">${["all", ...PART_SLOTS].map(s => `<button class="chip ${f === s ? "on" : ""}" data-act="depotSlot" data-s="${s}">${s === "all" ? "All parts" : SLOT_NAME[s] + "s"}</button>`).join("")}</div>
      ${parts.length ? parts.map(pt => partRow(pt, `<button class="btn sm ghost" data-act="partSheet" data-id="${pt.id}">Manage</button>`)).join("") : '<p class="small dim">No parts yet. Win Street Battles from the Battle tab to get them.</p>'}
      ${S.parts.some(pt => !pt.eq && pt.rar <= 2) ? `<button class="btn ghost wide" data-act="sellJunk">Sell all spare Plastic and Custom parts</button>` : ""}`
    : `<div class="rewards" style="justify-content:flex-start">${["rec1", "rec2", "rec3", "rec4", "chip", "summ", "permit", "cert", "tokens", "prime", "credit", "free10", "gold5"].filter(k => k !== "free10" && k !== "gold5" || have(k) > 0).map(k => `<div class="rw"><div class="ri" style="width:54px;height:54px">${itemIcon(k)}</div><span class="num">×${fmt(have(k))}</span><span class="tiny dim">${ITEMS[k].n}</span></div>`).join("")}</div>`}
  </div>`;
};
function sanityModal() {
  openModal(`<div class="stack"><h2>Energy</h2><p class="small dim">Battles cost Energy. You regain 1 every 30 seconds, a Blader Rank up refills it, and 1 Sports Drink restores it to max.</p>
    <div class="spread"><span class="cost">${IC.sanity}<b class="num">${S.sanity}/${maxSanity(S.lvl)}</b></span><span class="tiny dim">${S.sanity < maxSanity(S.lvl) ? "+1 in " + dur(SAN_MS - (Date.now() - S.sTime)) : "Full"}</span></div>
    <button class="btn wide" data-act="buy" data-t="prime" data-id="p_san" ${S.prime >= 1 ? "" : "disabled"}>Restore <span class="cost">${IC.prime}1</span> <span class="tiny">(you have ${S.prime})</span></button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
function rewardModal(title, list, sub = "") {
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">${esc(sub)}</div><h2>${esc(title)}</h2>
    <div class="rewards">${rewardsHTML(list)}</div><button class="btn wide" data-act="closeModal">Collect</button></div>`);
}
