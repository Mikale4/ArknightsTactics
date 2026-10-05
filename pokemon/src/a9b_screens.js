
// =====================================================================
//  SCREENS (2/2): Battle hub, Pokémon (PC Box), summary, evolution, Pokédex, Safari Zone, research, shops, Bag
// =====================================================================
SCREENS.battle = () => {
  const A = S.arena, payReady = Date.now() - A.payTime >= PAYOUT_MS, nd = nextNode();
  return `<div class="stack">
    <h2>Battle</h2>
    <button class="tile wide ls-t" data-act="go" data-v="story" style="min-height:76px"><span class="ticon" style="color:var(--red)">${IC.story}</span>
      <div class="eyebrow">Kanto Journey</div><h3>${esc(STORY[0].title)}</h3><span class="tsub">${nd ? "Next: " + nd.id + " " + esc(nd.name) : "Kanto complete!"}</span></button>
    <div class="eyebrow">Explore · evolution stones, Exp. Candy and held items</div>
    ${HUNTS.map(h => {
      const best = (S.hunt && S.hunt[h.id]) || 0, boss = h.boss[0];
      return `<button class="tile wide hunt" data-act="go" data-v="hunt" data-a="${h.id}" style="--cc:${mapTheme(h.env === "plant" ? "city" : h.env).a}">
        <span class="ticon" style="width:60px;height:60px;right:8px;top:8px"><img class="px" src="${sprFront(boss)}" alt="" style="width:100%"></span>
        <div class="eyebrow">${h.code}-1 to ${h.code}-6 · ${best ? h.code + "-" + best + " cleared" : "not cleared"}</div><h3>${esc(h.n)}</h3><span class="tsub">${esc(h.sub)}</span>
        <span class="tsub">${itemName(h.stone)}${h.weather ? " · " + WEATHER[h.weather].n : ""}</span></button>`;
    }).join("")}
    <div class="tiles">
      <button class="tile" data-act="go" data-v="tower"><span class="ticon" style="color:var(--blue)">${IC.tower}</span><h3>Battle Tower</h3><span class="tsub">Floor ${Math.min(S.tower + 1, TOWER_FLOORS)}/${TOWER_FLOORS}</span></button>
      <button class="tile" data-act="go" data-v="arena"><span class="ticon" style="color:var(--red)">${IC.arena}</span><h3>Link Battle</h3><span class="tsub">Rank #${A.rank} · ${A.attempts}/5${payReady ? " · rewards ready" : ""}</span></button>
    </div>
  </div>`;
};
SCREENS.hunt = id => {
  const h = HUNTS.find(x => x.id === id), best = (S.hunt && S.hunt[id]) || 0;
  const lvl = UI.huntLv && UI.huntLv[id] || Math.min(6, best + 1);
  const lv = HUNT_LV[lvl - 1], waves = huntWavesSpec(h, lvl);
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Explore</span></div>
    <h2>${h.code}-${lvl} ${esc(h.n)}</h2><p class="small dim">${esc(h.sub)}. Wild Pokémon are Lv ${lv}; the strongest one is Lv ${lv + 3}.</p>
    ${h.weather ? `<div class="hint small" style="cursor:default">${WEATHER[h.weather].ic}<span><b>${WEATHER[h.weather].n}</b> in this area.</span></div>` : ""}
    <div class="chips">${[1, 2, 3, 4, 5, 6].map(k => `<button class="chip ${k === lvl ? "on" : ""}" data-act="huntLv" data-h="${id}" data-l="${k}" ${k <= best + 1 ? "" : "disabled"}>${h.code}-${k}</button>`).join("")}</div>
    ${waves.map((w, k) => `<div><div class="tiny dim" style="margin-bottom:4px">Wave ${k + 1}</div><div class="row wrap">${w.map(s => enHTML(s, s.boss ? 56 : 46)).join("")}</div></div>`).join("")}
    <section class="sub stack" style="gap:6px"><div class="small"><b>Finds</b> <span class="dim">· every clear</span></div>
      <div class="row wrap" style="gap:6px"><span class="chip">${itemName(h.stone)} (${h.stone === "linkcord" ? 10 + lvl * 4 : 20 + lvl * 8}%)</span><span class="chip">Exp. Candy</span><span class="chip">Seed of Mastery (${10 + lvl * 5}%)</span></div>
      <div class="small"><b>Held items</b> <span class="dim">· ${Math.min(90, 25 + lvl * 12)}% per clear</span></div>
      <div class="row wrap" style="gap:6px">${h.items.map(k => `<span class="chip" title="${esc(HELD[k].d)}">${HELD[k].n}</span>`).join("")}</div></section>
    <div class="row">
      ${best >= lvl ? `<button class="btn ghost" data-act="huntSweep" data-h="${id}" data-l="${lvl}">Quick Battle ×3</button>` : ""}
      <button class="btn" style="flex:1" data-act="huntGo" data-h="${id}" data-l="${lvl}">Explore <span class="cost">${IC.sanity}${HUNT_COST[lvl - 1]}</span></button>
    </div>
  </div>`;
};
SCREENS.tower = () => {
  const cur = Math.min(S.tower + 1, TOWER_FLOORS), done = S.tower >= TOWER_FLOORS;
  const floors = [];
  for (let f = Math.min(TOWER_FLOORS, cur + 2); f >= Math.max(1, cur - 3); f--) floors.push(towerFloor(f));
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Battle Tower</span></div>
    <h2>${done ? "Tower conquered!" : "Floor " + cur}</h2>
    <p class="small dim">Each floor can be cleared once. Every fifth floor, a Gym Leader waits with a Safari Ball and Rare Candy.</p>
    ${floors.map(T => {
      const state = T.f <= S.tower ? "done" : T.f === cur ? "next" : "locked";
      return `<section class="panel stack" style="gap:8px;${state === "next" ? "box-shadow:inset 0 0 0 2px var(--red)" : state === "locked" ? "opacity:.55" : ""}">
        <div class="spread"><div class="row" style="gap:8px"><img class="px" src="${trainerURL(T.trainer.spr)}" alt="" style="width:40px;height:40px;object-fit:contain"><div><b>Floor ${T.f}</b><div class="tiny dim">${esc(T.trainer.name)}</div></div></div><span class="tiny dim">Lv ${T.lv}</span></div>
        <div class="row wrap">${T.waves[T.waves.length - 1].map(s => enHTML(s, 40)).join("")}</div>
        <div class="spread"><div class="rewards" style="justify-content:flex-start;transform:scale(.85);transform-origin:left">${rewardsHTML(Object.entries(T.reward).map(([k, n]) => ({ k, n })))}</div>
        ${state === "next" ? `<button class="btn sm" data-act="towerGo" data-f="${T.f}">Battle</button>` : state === "done" ? `<span class="tiny good">Cleared</span>` : ""}</div>
      </section>`;
    }).join("")}
  </div>`;
};
SCREENS.arena = () => {
  tickTimers();
  if (!S.arena.opps) genOpps();
  const A = S.arena, now = Date.now(), payReady = now - A.payTime >= PAYOUT_MS, po = payout(A.rank);
  return `<div class="stack">
    <div class="spread">${back("go", "Battle", 'data-v="battle"')}<span class="eyebrow">Link Battle</span></div>
    <section class="panel">
      <div class="spread"><div><div class="eyebrow">Link Battle rank</div><div style="font:900 44px var(--f-title);line-height:1" class="num">#${A.rank}</div></div>
      <div style="text-align:right" class="small"><div>Battles <b class="num">${A.attempts}/5</b></div>${A.attempts < 5 ? `<div class="tiny dim num">+1 in <span data-cd="att">${dur(ARENA_MS - (now - A.aTime))}</span></div>` : ""}<div class="row" style="justify-content:flex-end;margin-top:4px"><span class="cost">${IC.tokens}${fmt(S.tokens)} BP</span></div></div></div>
      <div class="divider" style="margin:10px 0"></div>
      <div class="spread small"><span>Rank rewards: <span class="cost">${IC.orundum}${po.orundum}</span> <span class="cost">${IC.tokens}${po.tokens}</span></span>
        <button class="btn sm" data-act="payout" ${payReady ? "" : "disabled"}>${payReady ? "Claim" : `<span data-cd="pay">${dur(PAYOUT_MS - (now - A.payTime))}</span>`}</button></div>
    </section>
    <div class="spread"><h3>Trainers looking for a battle</h3><button class="btn ghost sm" data-act="newOpps">Refresh</button></div>
    ${A.opps.map((o, k) => `<section class="panel stack" style="gap:8px">
      <div class="spread"><div class="row" style="gap:8px"><img class="px" src="${trainerURL(o.cls[1])}" alt="" style="width:44px;height:44px;object-fit:contain"><div><b>${esc(o.cls[0])} ${esc(o.name)}</b><div class="tiny dim">Rank #${o.rank} · Team CP <span class="num">${fmtFull(o.pw)}</span></div></div></div>
      <button class="btn sm" data-act="arenaGo" data-k="${k}" ${A.attempts > 0 ? "" : "disabled"}>Battle</button></div>
      <div class="row">${o.team.map(u => opHTML(u.op, { s: 48, prog: progForLV(u.op, u.LV), nostars: 1, noiv: 1 })).join("")}</div></section>`).join("")}
    <p class="tiny dim">Spend Battle Points (BP) at the BP Exchange for held items and Linking Cords.</p>
  </div>`;
};

// ---------- Pokémon (PC Box) ----------
SCREENS.ops = () => {
  let list = UI.all ? OP_KEYS.filter(k => S.dex.seen[k] || S.ops[k]) : Object.keys(S.ops);
  list = list.filter(k => (UI.el === "all" || OPS[k].types.includes(UI.el)) && (UI.cls === "all" || OPS[k].cls === UI.cls));
  const sorters = { cp: (a, b) => (S.ops[b] ? power(b, S.ops[b]) : -1) - (S.ops[a] ? power(a, S.ops[a]) : -1), rarity: (a, b) => OPS[b].rar - OPS[a].rar || OPS[a].id - OPS[b].id,
    level: (a, b) => (S.ops[b] ? S.ops[b].lvl : -1) - (S.ops[a] ? S.ops[a].lvl : -1), number: (a, b) => OPS[a].id - OPS[b].id };
  list.sort(sorters[UI.sort] || sorters.cp);
  return `<div class="stack">
    <div class="spread"><h2>Pokémon</h2><button class="chip ${UI.all ? "on" : ""}" data-act="toggleAll">${UI.all ? "Seen" : "Your Pokémon"} · ${Object.keys(S.ops).length}</button></div>
    <div class="row" style="gap:8px"><button class="btn ghost sm" data-act="go" data-v="dex">${IC.dex.replace("<svg", '<svg width="16" height="16"')} Pokédex ${dexCaught()}/151</button><span class="tiny dim">Lv cap ${levelCap()}</span></div>
    <div class="filters">${["all", ...TYPES].map(e => `<button class="chip ${UI.el === e ? "on" : ""}" data-act="elf" data-e="${e}" ${e !== "all" ? `style="--tc:${TC[e]}"` : ""}>${e === "all" ? "All types" : e}</button>`).join("")}</div>
    <div class="filters">${["all", ...CLASSES].map(c => `<button class="chip ${UI.cls === c ? "on" : ""}" data-act="clsf" data-c="${c}">${c === "all" ? "All roles" : c}</button>`).join("")}</div>
    <div class="filters">${[["cp", "CP"], ["level", "Level"], ["rarity", "Rarity"], ["number", "Number"]].map(([s, n]) => `<button class="chip ${UI.sort === s ? "on" : ""}" data-act="sortf" data-s="${s}">Sort: ${n}</button>`).join("")}</div>
    <div class="roster">${list.map(k => `<button class="rcell ${S.ops[k] && canEvolveNow(k) ? "ready" : ""}" data-act="go" data-v="op" data-a="${k}">${opHTML(k)}${pnameHTML(k)}<div class="pw">${S.ops[k] ? "CP " + fmt(power(k, S.ops[k])) : dexNo(OPS[k].id)}</div></button>`).join("") || '<p class="small dim">No Pokémon match these filters.</p>'}</div>
  </div>`;
};
const statBar = (n, v, max = 255) => `<div class="sbar"><span>${n}</span><b class="num">${v}</b><i><em style="width:${Math.min(100, v / max * 100)}%;background:${v >= 100 ? "#3ddc84" : v >= 70 ? "#f2c14e" : "#ff8a5a"}"></em></i></div>`;
SCREENS.op = key => {
  const op = OPS[key], p = S.ops[key], tab = p ? UI.opTab : "info";
  const prog = p || mkProg(5), st = opStats(key, prog).st;
  const tabs = [["info", "Summary"], ["skills", "Moves"], ["upgrade", "Train"], ["evo", "Evolve"], ["item", "Item"]];
  let body = "";
  if (tab === "info") {
    const ab = op.passives[0];
    body = `<section class="panel"><div class="spread"><h3>Stats${p ? "" : " (Lv 5)"}</h3>${p ? `<span class="small">CP <b class="num">${fmtFull(power(key, p))}</b></span>` : ""}</div>
      <div class="statgrid" style="margin-top:8px">
        <div><span>HP</span><b>${st.hp}</b></div><div><span>Attack</span><b>${st.atk}</b></div><div><span>Defense</span><b>${st.def}</b></div>
        <div><span>Sp. Atk</span><b>${st.spa}</b></div><div><span>Sp. Def</span><b>${st.sdf}</b></div><div><span>Speed</span><b>${st.spe}</b></div></div>
      <div class="eyebrow" style="margin:12px 0 6px">Base stats · total ${op.b.reduce((a, b) => a + b, 0)}</div>
      ${["HP", "Atk", "Def", "SpA", "SpD", "Spe"].map((n, i) => statBar(n, op.b[i])).join("")}</section>
    <section class="panel stack" style="gap:8px">
      <div><b>Ability · ${esc(ab.name)}</b><p class="small dim">${esc(ab.text)}</p></div>
      <div><b>${op.types.join(" / ")} type</b><p class="small dim">Weak to ${defWeak(op.types).join(", ") || "nothing"}.${defResist(op.types).length ? ` Resists ${defResist(op.types).join(", ")}.` : ""}</p></div>
      <div><b>Role · ${op.cls}</b><p class="small dim">${{ Attacker: "Hits hard from range with special moves.", "All-Rounder": "Balanced offense and bulk.", Speedster: "Fast: acts often and strikes first.", Defender: "Tough and hard to knock out.", Supporter: "Puts foes to sleep, heals or sets up the team." }[op.cls]}</p></div>
      ${p ? `<div><b>IVs · ${IV_WORD[p.pot]}</b><p class="small dim">IV rank ${p.pot}/6 (each rank adds about 3 to every stat at Lv 100). Catch it again to raise it.</p></div>` : `<p class="small dim">${S.dex.caught[key] ? "You don't have this Pokémon right now." : "Not caught yet. Find it in the Safari Zone or on your journey."}</p>`}
    </section>`;
  } else if (tab === "skills") body = `<section class="panel stack" style="gap:10px">${op.skills.map((sk, i) => {
      const r = p.sk[i], c = skillCost(r);
      return `<div class="ab"><div class="abicon" style="--tc:${TC[sk.type]}">${sk.slot === 1 ? "S1" : sk.slot === 2 ? "S2" : "S3"}</div>
        <div class="stack" style="gap:4px;min-width:0"><div class="spread"><b>${esc(sk.name)}</b><span class="row" style="gap:4px">${typeChip(sk.type)}<span class="tag">${CAT_N[sk.cat]}</span></span></div>
        <div class="tiny dim">${sk.pow ? `Power ${sk.weight ? "varies" : sk.pow} · ` : ""}Accuracy ${sk.acc ? (sk.mk === "acc" && r > 1 ? `${Math.min(100, Math.round(sk.acc * (1 + .06 * (r - 1))))}% (base ${sk.acc}%)` : sk.acc + "%") : "—"} ·${sk.slot === 1 ? "No cooldown" : `Cooldown ${sk.cd}${sk.cd0 ? ` (starts at ${sk.cd0})` : ""}`}${op.ml[i] ? ` · learned at Lv ${op.ml[i]}` : " · TM move"}</div>
        <p class="small dim">${esc(sk.desc)}</p>
        <div class="spread"><div class="row" style="gap:6px"><b class="tiny">Mastery ${RANK[r]}</b><div class="pips">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= r ? "on" : ""}"></i>`).join("")}</div></div>
        ${r < MAX_SK ? `<button class="btn sm ghost" data-act="skUp" data-k="${key}" data-i="${i}" ${(S.inv.summ || 0) >= c.summ && S.lmd >= c.lmd ? "" : "disabled"}><span class="cost">${IC.summ}${c.summ}</span><span class="cost">${IC.lmd}${fmt(c.lmd)}</span></button>` : '<span class="tiny good">Mastered</span>'}</div></div></div>`;
    }).join('<div class="divider"></div>')}<p class="tiny dim">Mastery runs 1 to 5 (★). Each rank adds 6%: damage for attacks, healing for healing moves, accuracy for status moves that can miss, and turn meter given back for other status moves. ★ also cuts the cooldown by one turn. Seeds of Mastery are found while exploring.</p></section>`;
  else if (tab === "upgrade") {
    const cap = levelCap(), need = xpNeed(p.lvl, key);
    body = `<section class="panel stack" style="gap:8px">
      <div class="spread"><h3>Lv ${p.lvl}<span class="dim small"> / ${cap}</span></h3><span class="small dim num">${p.lvl >= cap ? "Level cap" : `${fmtFull(p.xp)}/${fmtFull(need)} Exp.`}</span></div>
      <div class="bar"><i style="width:${p.lvl >= cap ? 100 : p.xp / need * 100}%"></i></div>
      <div class="row wrap">${["rec1", "rec2", "rec3", "rec4", "rare"].map(it => `<button class="btn ghost sm" data-act="rec" data-k="${key}" data-it="${it}" ${S.inv[it] > 0 && p.lvl < cap ? "" : "disabled"} title="${ITEMS[it].n}"><span class="cost">${ITEMS[it].ic}×${S.inv[it] || 0}</span></button>`).join("")}
        <button class="btn sm blue" data-act="autoLv" data-k="${key}" ${p.lvl < cap && ["rec1", "rec2", "rec3", "rec4"].some(i => S.inv[i] > 0) ? "" : "disabled"}>Auto</button></div>
      <p class="tiny dim">${p.lvl >= cap ? (S.champion ? "Lv 100 is the highest level." : `Your Pokémon will only grow past Lv ${cap} once you earn another Gym Badge.`) : "Exp. Candy gives Exp. Points; a Rare Candy gives a whole level."}</p>
    </section>`;
  } else if (tab === "evo") {
    const opts = evoOptions(key), line = evoLine(key);
    body = `<section class="panel stack" style="gap:10px">
      <h3>Evolution</h3>
      <div class="evoline">${line.map(([k, d]) => `<button class="${k === key ? "cur" : ""} ${S.dex.caught[k] ? "" : "unowned"}" data-act="go" data-v="op" data-a="${k}" style="--d:${d}">${opHTML(k, { s: 48, nostars: 1, show: 1, prog: S.ops[k] || null })}<span class="tiny">${esc(OPS[k].n)}</span></button>`).join("")}</div>
      ${opts.length ? opts.map(o => `<div class="evorow"><img class="px" src="${sprFront(o.to)}" alt=""><div style="flex:1;min-width:0"><b>${esc(OPS[o.to].n)}</b><div class="tiny dim">${o.lv ? `Evolves at Lv ${o.lv}` : `Use a ${ITEMS[o.item].n} (you have ${S.inv[o.item] || 0})`}${S.ops[o.to] ? " · you already have one: they'll merge and IVs go up" : ""}</div></div>
        <button class="btn sm ${o.ok ? "" : "ghost"}" data-act="evolve" data-k="${key}" data-to="${o.to}" ${o.ok ? "" : "disabled"}>${o.ok ? "Evolve" : esc(o.why)}</button></div>`).join("")
      : `<p class="small dim">${op.from ? `${esc(op.n)} doesn't evolve any further.` : `${esc(op.n)} doesn't evolve.`}</p>`}
      <p class="tiny dim">Evolution keeps level, IVs, Mastery and held item. Pokémon that evolve by trading in the games use a Linking Cord here.</p>
    </section>`;
  } else if (tab === "item") {
    const owned = HELD_KEYS.filter(k => (S.held[k] || 0) > 0);
    body = `<section class="panel stack" style="gap:8px"><h3>Held item</h3>
      ${p.held ? `<div class="evorow"><span class="ri" style="width:40px;height:40px">${heldIcon(p.held)}</span><div style="flex:1"><b>${esc(HELD[p.held].n)}</b><div class="tiny dim">${esc(HELD[p.held].d)}</div></div><button class="btn sm ghost" data-act="unhold" data-k="${key}">Take</button></div>` : `<p class="small dim">${esc(op.n)} isn't holding anything.</p>`}</section>
      <section class="stack" style="gap:6px"><h3>Your held items</h3>
      ${owned.length ? owned.map(k => { const free = heldFree(k), bad = HELD[k].only && !HELD[k].only.includes(key); return `<div class="evorow"><span class="ri" style="width:36px;height:36px">${heldIcon(k)}</span><div style="flex:1;min-width:0"><b>${esc(HELD[k].n)}</b> <span class="tiny dim">×${S.held[k]}${free < S.held[k] ? ` (${free} free)` : ""}</span><div class="tiny dim">${esc(HELD[k].d)}</div></div>
        <button class="btn sm ghost" data-act="hold" data-k="${key}" data-it="${k}" ${free > 0 && p.held !== k ? "" : "disabled"}>${bad ? "Give (no effect)" : "Give"}</button></div>`; }).join("") : '<p class="small dim">No held items yet. Explore wild areas or visit the BP Exchange.</p>'}</section>`;
  }
  return `<div class="stack">
    <div class="spread">${back("go", "Pokémon", 'data-v="ops"')}${p ? `<button class="btn ghost sm" data-act="assistant" data-k="${key}" ${S.assistant === key ? "disabled" : ""}>${S.assistant === key ? "Partner" : "Make partner"}</button>` : ""}</div>
    <section class="panel opcard" style="--tc:${TC[op.types[0]]};--tc2:${TC[op.types[1] || op.types[0]]}">
      <div class="opart"><img class="px" src="${sprFull(key)}" alt="${esc(op.n)}"></div>
      <div class="meta"><div class="tiny num dim">${dexNo(op.id)} · ${esc(op.genus)} Pokémon</div>
        <h2 style="font-size:26px">${esc(op.n)}</h2>
        <div class="row" style="gap:4px">${typeChips(op.types)}</div>
        ${starRow(op.rar).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start;height:14px;margin-top:4px"')}
        ${p ? `<div class="small" style="margin-top:4px">Lv <b>${p.lvl}</b> · CP <b class="num">${fmtFull(power(key, p))}</b></div>${canEvolveNow(key) ? `<button class="btn sm" style="margin-top:6px" data-act="opTab" data-t="evo">Ready to evolve!</button>` : ""}` : `<div class="small dim">${S.dex.caught[key] ? "Caught before" : S.dex.seen[key] ? "Seen" : "Unknown"}</div>`}
      </div>
    </section>
    ${p ? `<div class="tabs2">${tabs.map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="opTab" data-t="${k}">${n}${k === "evo" && canEvolveNow(key) ? '<i class="dot" style="position:static;display:inline-block;margin-left:4px"></i>' : ""}</button>`).join("")}</div>` : ""}
    ${body}
  </div>`;
};
// "What? Bulbasaur is evolving!"
function evolveScene(from, to) {
  return new Promise(resolve => {
    const root = $("#gacha");
    root.innerHTML = `<div class="gwrap evo"><div class="evostage"><img class="px a" src="${sprFull(from)}" alt=""><img class="px b" src="${sprFull(to)}" alt=""></div>
      <div class="evotext" id="evT">What? ${esc(OPS[from].n)} is evolving!</div><button class="btn" id="evDone" hidden>Continue</button></div>`;
    root.hidden = false; sfx("special");
    const st = $(".evostage");
    setTimeout(() => st.classList.add("go"), 300);
    setTimeout(() => { st.classList.add("done"); $("#evT").textContent = `Congratulations! Your ${OPS[from].n} evolved into ${OPS[to].n}!`; sfx("win"); $("#evDone").hidden = false; }, 3400);
    root.onclick = ev => { if (ev.target.id === "evDone") { root.hidden = true; root.innerHTML = ""; resolve(); } };
  });
}

// ---------- Pokédex ----------
SCREENS.dex = () => {
  const f = UI.dexF;
  const list = OP_KEYS.filter(k => f === "all" || (f === "caught" ? S.dex.caught[k] : f === "seen" ? S.dex.seen[k] && !S.dex.caught[k] : !S.dex.seen[k]));
  return `<div class="stack">
    <div class="spread">${back("go", "Pokémon", 'data-v="ops"')}<span class="eyebrow">Kanto Pokédex</span></div>
    <section class="panel dexhead"><div class="spread"><div><div class="eyebrow">Prof. Oak's Pokédex</div><h2>Seen ${dexSeen()} · Caught ${dexCaught()}</h2></div><span class="num" style="font:900 30px var(--f-title)">${Math.floor(dexCaught() / 151 * 100)}%</span></div>
      <div class="bar" style="margin-top:8px"><i style="width:${dexCaught() / 151 * 100}%"></i></div>
      <p class="small dim" style="margin-top:6px">${oakRating()}</p></section>
    <div class="filters">${[["all", "All 151"], ["caught", "Caught"], ["seen", "Seen only"], ["unknown", "Unknown"]].map(([v, n]) => `<button class="chip ${f === v ? "on" : ""}" data-act="dexF" data-v="${v}">${n}</button>`).join("")}</div>
    <div class="dexgrid">${list.map(k => {
      const op = OPS[k], c = S.dex.caught[k], s = S.dex.seen[k];
      return `<button class="dexcell ${c ? "caught" : s ? "seen" : "unk"}" data-act="dexEntry" data-k="${k}"><span class="num tiny">${dexNo(op.id)}</span><img class="px" src="${sprFront(k)}" alt="" loading="lazy"><span class="tiny">${s || c ? esc(op.n) : "???"}</span>${c ? `<i class="ball">${IC.pokeball}</i>` : ""}</button>`;
    }).join("")}</div>
  </div>`;
};
function oakRating() {
  const n = dexCaught();
  return n >= 151 ? "Prof. Oak: Your Pokédex is entirely complete! Congratulations!" : n >= 120 ? "Prof. Oak: Wonderful! You're so close to completing the Pokédex!"
    : n >= 80 ? "Prof. Oak: You're well on your way! There are still rare Pokémon out there." : n >= 40 ? "Prof. Oak: Good! Try the Safari Zone and Explore to find more."
    : n >= 10 ? "Prof. Oak: You're getting the hang of it! Keep catching." : "Prof. Oak: You still have lots to do. Look for Pokémon in grassy areas!";
}
function dexModal(k) {
  const op = OPS[k], c = S.dex.caught[k], s = S.dex.seen[k];
  const where = [];
  for (const id in NODES) { const nd = NODES[id]; if (nd.catch === k || nd.gift === k || (nd.reward && nd.reward.op === k)) where.push(`${id} ${nd.name}`); }
  for (const ch of STORY[0].chapters) if (ch.reward.op === k) where.push(`Chapter ${ch.no} reward`);
  for (const h of HUNTS) if (h.mobs.includes(k) || h.boss.includes(k)) where.push(`seen in ${h.n}`);
  if (SHOP.prize.items.some(i => i.give.op === k)) where.push("Game Corner Prize Corner");
  if (!op.leg) where.push(`Safari Zone (${op.rar}★)`);
  if (op.from) where.push(`evolve ${OPS[op.from].n}`);
  openModal(`<div class="stack">
    <div class="row" style="gap:12px"><div class="dexpic ${s || c ? "" : "unk"}"><img class="px" src="${sprFull(k)}" alt=""></div>
      <div><div class="eyebrow">${dexNo(op.id)}</div><h2>${s || c ? esc(op.n) : "???"}</h2>${s || c ? `<div class="small dim">${esc(op.genus)} Pokémon</div><div class="row" style="gap:4px;margin-top:4px">${typeChips(op.types)}</div>` : ""}</div></div>
    ${s || c ? `<div class="statgrid small"><div><span>Height</span><b>${(op.h / 10).toFixed(1)} m</b></div><div><span>Weight</span><b>${(op.w / 10).toFixed(1)} kg</b></div>
      <div><span>Ability</span><b>${esc(op.passives[0].name)}</b></div><div><span>Catch rate</span><b>${op.cr}</b></div></div>
      ${["HP", "Atk", "Def", "SpA", "SpD", "Spe"].map((n, i) => statBar(n, op.b[i])).join("")}
      <div class="small"><b>Moves:</b> <span class="dim">${op.skills.map(sk => sk.name).join(" · ")}</span></div>
      <div class="small"><b>Where to find it:</b> <span class="dim">${esc(where.join(" · ") || "Unknown")}</span></div>` : `<p class="small dim">You haven't seen this Pokémon yet.</p>`}
    <div class="row" style="gap:8px">${S.ops[k] ? `<button class="btn" style="flex:1" data-act="go" data-v="op" data-a="${k}">Summary</button>` : ""}<button class="btn ghost" style="flex:1" data-act="closeModal">Close</button></div>
  </div>`);
}

// ---------- Safari Zone ----------
SCREENS.hh = () => {
  const B = bannerToday(), std = UI.hhStd, f6 = OPS[B.feat6];
  const pity = Math.max(0, S.gacha.pity - 49);
  return `<div class="stack">
    <div class="tabs2"><button class="${std ? "" : "on"}" data-act="hhTab" data-std="0">Featured Area</button><button class="${std ? "on" : ""}" data-act="hhTab" data-std="1">Whole Park</button></div>
    <section class="panel banner-card safari">
      ${std ? `<div class="bcrowd">${["kangaskhan", "tauros", "chansey", "scyther", "pinsir"].map(k => `<img class="px" src="${sprFull(k)}" alt="">`).join("")}</div>` : `<img class="px bmain" src="${sprFull(B.feat6)}" alt="${esc(f6.n)}">`}
      <div class="eyebrow">${std ? "Safari Zone · Fuchsia City" : "Featured today"}</div>
      <h2>${std ? "The Whole Park" : esc(f6.n)}</h2>
      ${std ? `<p class="small" style="max-width:24ch">Every Pokémon except the legendary ones can turn up.</p>` : `<div class="row" style="gap:4px">${starRow(5).replace('class="rstars"', 'class="rstars" style="justify-content:flex-start"')}${typeChips(f6.types)}</div>
      <p class="small" style="max-width:26ch">Half of all 5★ catches today are ${esc(f6.n)}. Featured 4★: ${B.feat5.map(k => esc(OPS[k].n)).join(", ")}.</p>`}
    </section>
    <div class="row wrap small dim"><span>5★ 3% · 4★ 18% · 3★ 79%</span>${pity ? `<span class="good">· 5★ chance now ${3 + pity * 3}%</span>` : `<span>· ${Math.max(0, 50 - S.gacha.pity)} throws until the 5★ chance starts rising</span>`}</div>
    ${S.inv.free10 > 0 ? `<button class="btn wide freepull" data-act="pullFree10">${IC.free10.replace("<svg", '<svg width="26" height="26"')}<span>Use a Safari Pass: 10 free throws<br><small>×${S.inv.free10}</small></span></button>` : ""}
    ${S.inv.gold5 > 0 ? `<button class="btn wide freepull master" data-act="pullGold5">${IC.gold5.replace("<svg", '<svg width="26" height="26"')}<span>Throw the Master Ball: a random 5★ Pokémon<br><small>×${S.inv.gold5}</small></span></button>` : ""}
    ${S.gacha.firstTen ? `<div class="hint">${IC.star.replace("<svg", '<svg width="20" height="20"')}<span class="small">Your first ten throws are guaranteed to catch at least one 4★ Pokémon.</span></div>` : ""}
    <div class="row" style="gap:10px">
      <button class="btn ghost" style="flex:1" data-act="pull" data-n="1" ${S.permit >= 1 || S.orundum >= 600 ? "" : "disabled"}>Throw ×1<br><span class="cost">${S.permit >= 1 ? IC.permit + "1" : IC.orundum + "600"}</span></button>
      <button class="btn" style="flex:1" data-act="pull" data-n="10" ${S.permit >= 10 || S.orundum >= 6000 ? "" : "disabled"}>Throw ×10<br><span class="cost">${S.permit >= 10 ? IC.permit + "10" : IC.orundum + "6,000"}</span></button>
    </div>
    <div class="mats"><span class="mat">${IC.permit}${S.permit} Safari Balls</span><span class="mat">${IC.orundum}${fmt(S.orundum)} Gems</span><span class="mat">${IC.cert}${S.cert} Coins</span></div>
    <p class="tiny dim">Catching a Pokémon you already have raises its IVs (up to 6). Once its IVs are perfect, you get Game Corner Coins instead.</p>
  </div>`;
};
// throw animation: balls wobble (Poké, Great or Ultra Ball by rarity), then "Gotcha!" cards
function gachaReveal(results, master) {
  return new Promise(resolve => {
    const top = Math.max(...results.map(r => OPS[r.key].rar));
    const root = $("#gacha");
    root.innerHTML = `<div class="gwrap"><canvas class="gcv" id="gcv"></canvas><div class="gtitle" id="gT"><div class="eyebrow">Safari Zone</div><h1>${master ? "Go, Master Ball!" : "Throw!"}</h1><p class="small">Tap to skip</p></div><div class="ggrid" id="gG" hidden></div><button class="btn" id="gDone" hidden>Done</button></div>`;
    root.hidden = false;
    const cv = $("#gcv"), g = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
    const kind = master ? "master" : BALL_OF(top), t0 = performance.now();
    let run = true;
    const loop = () => {
      if (!run || !cv.isConnected) return; requestAnimationFrame(loop);
      const t = (performance.now() - t0) / 1000;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#f2c87a"); sky.addColorStop(.6, "#c8b05a"); sky.addColorStop(1, "#6a8a3a");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 18; k++) { const x = (k * 97 % W), y = H * .62 + (k % 3) * 12; g.fillStyle = "#4a7a2a"; g.beginPath(); g.moveTo(x - 14, y + 30); g.lineTo(x, y + Math.sin(t * 3 + k) * 3); g.lineTo(x + 14, y + 30); g.fill(); }
      const k = Math.min(1, t / .7), bx = lerp(-30, W / 2, k), by = H * .66 - Math.sin(k * Math.PI) * H * .3;
      const wob = t > .8 && t < 2.3 ? Math.sin((t - .8) * 9) * .5 * (1 - (t - .8) / 1.6) : 0;
      if (t < 2.4) drawBall(g, bx, t > .7 ? H * .66 : by, 26, kind, t < .7 ? t * 16 : wob, 0);
      else { const f = Math.min(1, (t - 2.4) * 4); g.globalAlpha = 1 - f; drawBall(g, W / 2, H * .66, 26 + f * 30, kind, 0, f); g.globalAlpha = 1; g.fillStyle = `rgba(255,255,255,${1 - f})`; g.fillRect(0, 0, W, H); }
      if (t > 2.3 && t < 2.6) { g.fillStyle = "#fff"; g.font = "900 34px Nunito, Arial"; g.textAlign = "center"; g.fillText("Gotcha!", W / 2, H * .35); }
    };
    loop(); sfx("warp");
    setTimeout(() => sfx("tap"), 1000); setTimeout(() => sfx("tap"), 1500); setTimeout(() => sfx("win"), 2300);
    let stage = 0;
    const show = () => {
      if (stage || !$("#gT")) return;
      stage = 1; $("#gT").hidden = true; const G = $("#gG"); G.hidden = false;
      if (results.length === 1) { G.style.gridTemplateColumns = "1fr"; G.style.maxWidth = "240px"; }
      G.innerHTML = results.map((r, i) => { const op = OPS[r.key]; return `<div class="gcard r${op.rar}" style="--rc:${TC[op.types[0]]};animation-delay:${i * .12}s">${r.isNew ? '<span class="gnew">NEW</span>' : r.iv ? '<span class="gnew iv">IV↑</span>' : r.coins ? `<span class="gnew iv">+${r.coins}C</span>` : ""}<img class="px" src="${sprFull(r.key)}" alt="${esc(op.n)}"><span class="gst">${"★".repeat(op.rar)}<br>${esc(op.n)}</span></div>`; }).join("");
      if (top >= 5) sfx("win"); else sfx("heal");
      setTimeout(() => { if ($("#gDone")) $("#gDone").hidden = false; stage = 2; }, results.length * 120 + 500);
    };
    root.onclick = ev => {
      if (ev.target.id === "gDone") { run = false; root.hidden = true; root.innerHTML = ""; resolve(); return; }
      if (stage === 0) show();
    };
    setTimeout(show, 2800);
  });
}
// Professor Oak's three Pokémon
function starterModal() {
  openModal(`<div class="stack" style="text-align:center;align-items:center">
    <img class="px" src="${trainerURL("oak")}" alt="" style="width:88px;height:88px;object-fit:contain">
    <div class="eyebrow">Professor Oak's Lab</div><h2>Choose your first Pokémon</h2>
    <p class="small dim">Each is strong against one of the others: Grass beats Water, Water beats Fire, Fire beats Grass.</p>
    <div class="starters">${STARTERS.map(k => `<button class="starter" data-act="pickStarter" data-k="${k}" style="--tc:${TC[OPS[k].types[0]]}"><img class="px" src="${sprFull(k)}" alt=""><b>${OPS[k].n}</b><span class="row" style="gap:3px;justify-content:center">${typeChips(OPS[k].types)}</span></button>`).join("")}</div>
  </div>`);
  m0Click();
}

// ---------- research / shops / bag ----------
function missionsModal() {
  const dl = DAILIES.map(d => {
    const v = Math.min(d.goal, S.daily[d.id] || 0), cl = S.daily.claimed[d.id];
    return `<div class="sub stack" style="gap:6px"><div class="spread"><b class="small">${d.n}</b><span class="small num">${v}/${d.goal}</span></div>
      <div class="bar"><i style="width:${v / d.goal * 100}%"></i></div>
      <div class="spread"><span class="row tiny">${Object.entries(d.reward).map(([k, n]) => `<span class="cost">${itemIcon(k)}${fmt(n)}</span>`).join(" ")}</span>
      <button class="btn sm" data-act="claimDaily" data-id="${d.id}" ${v >= d.goal && !cl ? "" : "disabled"}>${cl ? "Claimed" : "Claim"}</button></div></div>`;
  }).join("");
  openModal(`<div class="stack"><div class="eyebrow">Resets daily</div><h2>Daily Research</h2>${dl}
    <div class="sub spread"><span class="small">Finish all of today's research: <span class="cost">${IC.permit}1</span></span>
      <button class="btn sm" data-act="claimAllDaily" ${DAILIES.every(d => S.daily.claimed[d.id]) && !S.daily.claimed.all ? "" : "disabled"}>${S.daily.claimed.all ? "Claimed" : "Claim"}</button></div>
    <button class="btn ghost wide" data-act="go" data-v="ach">${IC.trophy.replace("<svg", '<svg width="18" height="18"')} Medals · ${achDone()}/${achTotal}</button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
SCREENS.shop = () => {
  const tab = SHOP[UI.shopTab] && !SHOP[UI.shopTab].hidden ? UI.shopTab : "mart", sh = SHOP[tab], cur = sh.cur;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="mat">${itemIcon(cur)}${fmt(have(cur))} ${itemName(cur)}</span></div>
    <div class="shophead"><img class="px" src="${trainerURL({ mart: "clerk", prize: "gamer", bp: "acetrainerf", gems: "lady" }[tab])}" alt=""><div><h2>${sh.n}</h2><p class="small dim">${{ mart: "Celadon Dept. Store: everything a Trainer needs.", prize: "The Game Corner's prize counter. Trade Coins for rare Pokémon.", bp: "Spend Battle Points from Link Battles on powerful held items.", gems: "Trade Gems for Safari Balls and Max Elixirs." }[tab]}</p></div></div>
    <div class="tabs2">${Object.entries(SHOP).filter(([, v]) => !v.hidden).map(([k, v]) => `<button class="${tab === k ? "on" : ""}" data-act="shopTab" data-t="${k}">${v.n}</button>`).join("")}</div>
    <div class="tiles">${sh.items.map(it => {
      const k = Object.keys(it.give)[0], v = it.give[k], ic = k === "op" ? `<img class="px" src="${sprFront(v)}" alt="" style="width:100%">` : k === "held" ? heldIcon(v) : itemIcon(k === "sanityMax" ? "sanity" : k);
      const sub = k === "op" ? `${OPS[v].rar}★ ${OPS[v].types.join("/")}${S.ops[v] ? " · owned" : ""}` : k === "held" ? HELD[v].d : it.d || (ITEMS[k] && ITEMS[k].d) || "";
      return `<button class="tile shopit" data-act="buy" data-t="${tab}" data-id="${it.id}" ${have(cur) >= it.cost ? "" : "disabled"}>
      <span class="ticon">${ic}</span><h3 style="font-size:15px">${esc(it.n)}</h3><span class="tsub">${esc(sub)}</span><span class="tsub cost">${itemIcon(cur)}${fmt(it.cost)}</span></button>`;
    }).join("")}</div>
  </div>`;
};
SCREENS.depot = () => {
  const tab = UI.depotTab;
  const items = ["rec1", "rec2", "rec3", "rec4", "rare", "summ", ...STONES, "permit", "prime", "cert", "tokens", "free10", "gold5"].filter(k => !["free10", "gold5"].includes(k) || have(k) > 0);
  const held = HELD_KEYS.filter(k => (S.held[k] || 0) > 0);
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Bag</span></div>
    <h2>Bag</h2>
    <div class="tabs2"><button class="${tab === "items" ? "on" : ""}" data-act="depotTab" data-t="items">Items</button><button class="${tab === "held" ? "on" : ""}" data-act="depotTab" data-t="held">Held items · ${held.reduce((a, k) => a + S.held[k], 0)}</button></div>
    ${tab === "items" ? `<div class="baglist">${items.map(k => `<div class="bagrow"><span class="ri">${itemIcon(k)}</span><div style="flex:1;min-width:0"><b>${esc(ITEMS[k].n)}</b><div class="tiny dim">${esc(ITEMS[k].d || "")}</div></div><span class="num">×${fmt(have(k))}</span></div>`).join("")}</div>`
      : held.length ? `<div class="baglist">${held.map(k => `<div class="bagrow"><span class="ri">${heldIcon(k)}</span><div style="flex:1;min-width:0"><b>${esc(HELD[k].n)}</b><div class="tiny dim">${esc(HELD[k].d)}</div></div><span class="num">×${S.held[k]}${heldUsed(k) ? `<small class="dim"> (${heldUsed(k)} held)</small>` : ""}</span></div>`).join("")}</div><p class="tiny dim">Give held items to Pokémon from their summary (Item tab).</p>`
      : '<p class="small dim">No held items yet. Explore wild areas, or trade BP at the BP Exchange.</p>'}
  </div>`;
};
function sanityModal() {
  openModal(`<div class="stack"><div class="shophead"><img class="px" src="${trainerURL("nurse")}" alt=""><div><div class="eyebrow">Pokémon Center</div><h2>PP</h2></div></div><p class="small dim">Battles use PP. You regain 1 PP every 30 seconds, a Trainer Level up restores it, and a Max Elixir fills it to max.</p>
    <div class="spread"><span class="cost">${IC.sanity}<b class="num">${S.sanity}/${maxSanity(S.lvl)}</b></span><span class="tiny dim">${S.sanity < maxSanity(S.lvl) ? "+1 in " + dur(SAN_MS - (Date.now() - S.sTime)) : "Full"}</span></div>
    <button class="btn wide" data-act="buy" data-t="elixir" data-id="e_pp" ${S.prime >= 1 ? "" : "disabled"}>Use a Max Elixir <span class="tiny">(you have ${S.prime})</span></button>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
function rewardModal(title, list, sub = "") {
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">${esc(sub)}</div><h2>${esc(title)}</h2>
    <div class="rewards">${rewardsHTML(list)}</div><button class="btn wide" data-act="closeModal">OK</button></div>`);
}
