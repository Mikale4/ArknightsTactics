
// =====================================================================
//  CONTRACTS — Contingency Contract ladder and Real-Time Contract (screens, draft, launchers)
// =====================================================================
const TIER_ABBR = ["B", "S", "G", "P", "D", "M", "GM", "L"];
function tierBadge(p, size = 52) {
  const t = tierOf(p), a = TIER_ABBR[tierIdx(p)];
  return `<svg class="tbadge" width="${size}" height="${Math.round(size * 1.12)}" viewBox="0 0 48 54" aria-label="${t.n}"><path d="M24 2 44 10v18c0 12-9 20-20 24C13 48 4 40 4 28V10z" fill="${t.c}2a" stroke="${t.c}" stroke-width="2.5"/>
    <path d="M24 11 35 16v11c0 7-5 12-11 14-6-2-11-7-11-14V16z" fill="${t.c}"/><text x="24" y="${a.length > 1 ? 31 : 32}" text-anchor="middle" font-size="${a.length > 1 ? 10 : 13}" font-weight="800" font-family="Arial" fill="#05080f">${a}</text></svg>`;
}
const aiLabel = s => ({ balanced: "Balanced AI", aggressive: "Aggressive AI", expert: "Expert AI", safe: "Safe AI" }[s] || s);
const rewardText = r => Object.entries(r).map(([k, n]) => `${fmt(n)} ${ITEMS[k] ? ITEMS[k].n : k}`).join(", ");
const ago = t => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 60 ? m + "m ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago"; };
const rtaRank = p => 1 + S.ladder.pop.filter((x, i) => qRating(ladderQ(i)) > p).length;

SCREENS.arena = () => {
  tickTimers();
  const tab = UI.arenaTab === "rta" ? "rta" : "ladder";
  return `<div class="stack">
    <div class="spread">${back("go", "Terminal", 'data-v="battle"')}<span class="eyebrow">Contracts</span></div>
    <div class="tabs2"><button class="${tab === "ladder" ? "on" : ""}" data-act="arenaTab" data-t="ladder">Contingency Contract</button><button class="${tab === "rta" ? "on" : ""}" data-act="arenaTab" data-t="rta">Real-Time Contract</button></div>
    ${tab === "ladder" ? ladderHTML() : rtaHTML()}
  </div>`;
};
function tierCard(p, best, lines, side) {
  const t = tierOf(p), nx = TIERS[tierIdx(p) + 1];
  return `<section class="panel tiercard" style="--tc:${t.c}">${tierBadge(p)}
    <div class="tc-main"><div class="eyebrow" style="color:${t.c}">${t.n}</div><div class="tc-pts num">${fmtFull(p)} <small>pts</small></div>
      <div class="tiny dim">${lines}</div>
      ${nx ? `<div class="bar thin" style="margin-top:5px"><i style="width:${clamp((p - t.min) / (nx.min - t.min), 0, 1) * 100}%;background:${t.c}"></i></div><div class="tiny dim">${nx.min - p} pts to ${nx.n} · Best: ${tierOf(best).n}</div>` : `<div class="tiny" style="color:${t.c}">Top tier · Best ${fmtFull(best)} pts</div>`}</div>
    <div class="tc-side small">${side}</div></section>`;
}
function ladderHTML() {
  const L = S.ladder, now = Date.now(), opps = ladderOpps(), unseen = L.log.filter(x => x.t > L.seen).length, cool = now - L.oppT < REFRESH_MS;
  return `${tierCard(L.pts, L.best, `Rank #${fmtFull(ladderRank())} of ${fmtFull(LADDER_N + 1)} Doctors`,
      `<div>Tickets <b class="num">${L.tickets}/${TICKETS_MAX}</b></div>${L.tickets < TICKETS_MAX ? `<div class="tiny dim num">+1 in <span data-cd="tix">${dur(TICKET_MS - (now - L.tTime))}</span></div>` : ""}<div class="tiny dim">W ${L.wins} · L ${L.losses}</div>`)}
    <div class="row"><button class="btn ghost sm" style="flex:1" data-act="defense">Defense squad</button><button class="btn ghost sm" style="flex:1" data-act="rankings" data-t="ladder">Rankings</button>
      <button class="btn ghost sm" style="flex:1" data-act="defLog">Defense log${unseen ? ` <span class="badge-n">${unseen}</span>` : ""}</button></div>
    ${(S.team.defense || []).filter(owned).length ? "" : `<div class="hint">${IC.shield.replace("<svg", '<svg width="20" height="20"')}<span class="small">Set a defense squad. Other Doctors attack it while you're away.</span></div>`}
    <div class="spread"><h3>Opponents</h3><button class="btn ghost sm" data-act="ladderRefresh" ${cool ? "disabled" : ""}>${cool ? `Refresh in <span data-cd="ref">${dur(REFRESH_MS - (now - L.oppT))}</span>` : "Refresh"}</button></div>
    ${opps.map(i => { const d = ladderDoc(i), p = L.pop[i], to = tierOf(p);
      return `<section class="panel stack" style="gap:8px">
        <div class="spread"><div class="row" style="gap:8px">${tierBadge(p, 30)}<div><b>${esc(d.name)}</b><div class="tiny dim"><span style="color:${to.c}">${to.n}</span> · ${fmtFull(p)} pts · Power <span class="num">${fmtFull(npcPower(d))}</span></div></div></div>
          <button class="btn sm" data-act="ladderGo" data-i="${i}" ${L.tickets > 0 ? "" : "disabled"}>Fight</button></div>
        <div class="row">${d.team.map(k => opHTML(k, { s: 48, prog: d.prog[k] })).join("")}</div>
        <div class="tiny dim">Win <b style="color:var(--buff)">+${eloDelta(L.pts, p, true, eloK(L.pts))}</b> · Lose <b style="color:var(--debuff)">${eloDelta(L.pts, p, false, eloK(L.pts))}</b> · Defense played by ${aiLabel(d.ai)}</div></section>`; }).join("")}
    <p class="tiny dim">Each fight uses a Contract Ticket (one refills every 30 minutes). Weekly rewards every Monday 00:00 UTC by tier; ${tierOf(L.pts).n} pays ${rewardText(TIER_REWARD[tierIdx(L.pts)])}.
      Higher tiers face maxed squads and smarter AI, and get their defense attacked more often.</p>`;
}
function rtaHTML() {
  const R = S.rta;
  return `${tierCard(R.pts, R.best, R.place > 0 ? `Placement: ${R.place} match${R.place > 1 ? "es" : ""} left` : `Rank #${fmtFull(rtaRank(R.pts))} · Top ${Math.max(.1, Math.round(rtaRank(R.pts) / (LADDER_N + 1) * 1000) / 10)}%`,
      `<div>W ${R.wins} · L ${R.losses}</div><div class="tiny dim">${R.streak > 1 ? `${R.streak} win streak` : R.streak < -1 ? `${-R.streak} losses in a row` : "&nbsp;"}</div>`)}
    <button class="btn wide" data-act="rtaFind" ${Object.keys(S.ops).length >= 5 ? "" : "disabled"}>${Object.keys(S.ops).length >= 5 ? "Find Match" : "Recruit 5 operators to play"}</button>
    <div class="row"><button class="btn ghost sm" style="flex:1" data-act="rankings" data-t="rta">Rankings</button></div>
    <section class="sub small dim stack" style="gap:4px"><b style="color:var(--text)">How it works</b>
      <span>Matchmaking pairs you with a Doctor near your rating. Draft in turns (1-2-2-2-2-1) until each side has 5 operators, then ban one of theirs: the remaining 4 v 4 fight live, 20 seconds per turn.</span>
      <span>Higher tiers bring bigger rosters, counter-picks, smarter bans and the Expert AI. Win streaks of 3+ earn bonus points; placement matches move your rating faster.</span></section>
    ${R.log.length ? `<h3>Recent matches</h3>${R.log.slice(0, 8).map(m => `<div class="sub spread small"><span><b style="color:${m.win ? "var(--buff)" : "var(--debuff)"}">${m.win ? "Victory" : "Defeat"}</b> vs ${esc(m.name)} <span class="tiny dim">(${tierOf(m.pts).n})</span></span><span class="num">${m.d > 0 ? "+" : ""}${m.d} · <span class="tiny dim">${ago(m.t)}</span></span></div>`).join("")}` : ""}
    <p class="tiny dim">Weekly rewards by tier, paid every Monday 00:00 UTC: ${tierOf(R.pts).n} pays ${rewardText(TIER_REWARD[tierIdx(R.pts)])}.</p>`;
}
function rankingsModal(mode) {
  const L = S.ladder, mine = mode === "rta" ? S.rta.pts : L.pts;
  const rows = L.pop.map((p, i) => ({ i, p: mode === "rta" ? Math.round(qRating(ladderQ(i)) + (seeded(hash(L.seed + "rta" + i))() - .5) * 140) : p }));
  rows.push({ me: true, p: mine });
  rows.sort((a, b) => b.p - a.p);
  const at = rows.findIndex(r => r.me);
  const show = rows.slice(0, 30).map((r, k) => [k, r]).concat(at >= 30 ? [[-1], ...rows.slice(Math.max(30, at - 3), at + 4).map((r, j) => [Math.max(30, at - 3) + j, r])] : []);
  openModal(`<div class="stack"><div class="eyebrow">${mode === "rta" ? "Real-Time Contract" : "Contingency Contract"}</div><h2>Rankings</h2>
    <div class="stack" style="gap:3px">${show.map(([k, r]) => k < 0 ? '<div class="tiny dim" style="text-align:center">⋯</div>' : `<div class="rkrow ${r.me ? "me" : ""}"><span class="num">#${k + 1}</span>${tierBadge(r.p, 22)}<b>${r.me ? `${esc(S.name === "Doctor" ? "You" : "Dr. " + S.name)}` : esc(ladderDoc(r.i).name)}</b><span class="num">${fmtFull(r.p)}</span></div>`).join("")}</div>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
function defLogModal() {
  const L = S.ladder; L.seen = Date.now(); save();
  openModal(`<div class="stack"><div class="eyebrow">Contingency Contract</div><h2>Defense log</h2>
    ${L.log.length ? L.log.map(x => { const d = ladderDoc(x.i);
      return `<div class="sub stack" style="gap:6px"><div class="spread"><span><b style="color:${x.held ? "var(--buff)" : "var(--debuff)"}">${x.held ? "Defended" : "Defeated"}</b> · ${esc(d.name)} <span class="tiny dim">(${tierOf(L.pop[x.i]).n})</span></span>
        <span class="num small">${x.d > 0 ? "+" : ""}${x.d} · <span class="tiny dim">${ago(x.t)}</span></span></div>
        <div class="spread"><div class="row" style="gap:4px">${x.team.map(k => opHTML(k, { s: 36, prog: d.prog[k] })).join("")}</div>
        ${!x.held && !x.rev ? `<button class="btn sm" data-act="ladderRevenge" data-i="${x.i}" data-t="${x.t}" ${L.tickets > 0 ? "" : "disabled"}>Revenge</button>` : ""}</div></div>`; }).join("")
      : '<p class="small dim">No attacks yet. Set a defense squad; other Doctors attack it while you are away.</p>'}
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}

// ---------- launchers ----------
function launchLadder(i, revenge) {
  const L = S.ladder, ids = squadOrToast("arena");
  if (!ids) return;
  tickTimers();
  if (L.tickets <= 0) { toast("No Contract Tickets left. One refills every 30 minutes."); return; }
  route("arena");
  if (L.tickets >= TICKETS_MAX) L.tTime = Date.now();
  L.tickets--; S.stats.battles++;
  if (revenge) L.rev[i] = 1;
  save();
  const doc = ladderDoc(i);
  startBattle({
    allies: allySpecs(ids), waves: [doc.team.map(k => npcSpec(doc, k))], env: "arena", bgm: "ccbat", enemyStyle: doc.ai,
    title: doc.name, sub: `Contingency Contract · ${tierOf(L.pop[i]).n} · ${fmtFull(L.pop[i])} pts`,
    onWin() { const d = ladderResult(i, true); S.stats.wins++; S.daily.arena++; ladderOpps(true); contractDM(i, true); return { rewards: [{ k: "pts", n: d }, ...give({ tokens: 20 + tierIdx(L.pts) * 4 })] }; },
    onLose() { const d = ladderResult(i, false); ladderOpps(true); contractDM(i, false); return { rewards: [{ k: "pts", n: d }, ...give({ tokens: 5 })] }; },
    onQuit() { ladderResult(i, false); ladderOpps(true); save(); },
  });
}
let DRAFT = null;
function rtaFind() {
  if (Object.keys(S.ops).length < 5) { toast("Recruit at least 5 operators first."); return; }
  const opp = rtaOpponent(), t0 = Date.now(), wait = 1800 + Math.random() * 2600;
  openModal(`<div class="stack" style="align-items:center;text-align:center"><div class="eyebrow">Real-Time Contract</div><h2 id="mmH">Searching for an opponent…</h2>
    <div class="mmspin"></div><p class="small dim num" id="mmT">0:00</p><p class="tiny dim">Your rating: ${tierOf(S.rta.pts).n} · ${S.rta.pts}</p>
    <button class="btn ghost wide" data-act="rtaCancel">Cancel</button></div>`);
  const tick = setInterval(() => {
    const el = $("#mmT"); if (!el) { clearInterval(tick); return; }
    el.textContent = dur(Date.now() - t0);
    if (Date.now() - t0 >= wait) {
      clearInterval(tick);
      $("#mmH").textContent = "Opponent found";
      el.textContent = `${opp.name} · ${tierOf(opp.pts).n}`;
      sfx("ui_alarm");
      setTimeout(() => { if ($("#mmH")) { closeModal(); draftStart(opp); } }, 900);
    }
  }, 200);
}
function draftStart(opp) {
  DRAFT = { opp, first: Math.random() < .5 ? 0 : 1, step: 0, picks: [[], []], ban: [null, null], phase: "pick", until: 0, busy: false };
  const root = $("#draft"); root.hidden = false;
  draftNext();
}
const draftWho = () => DRAFT.first === 0 ? DRAFT_ORDER[DRAFT.step] : 1 - DRAFT_ORDER[DRAFT.step];
const myProg = k => S.ops[k];
function draftNext() {
  const D = DRAFT; if (!D) return;
  clearTimeout(D.tm);
  if (D.phase === "pick" && D.step >= DRAFT_ORDER.length) { D.phase = "ban"; D.until = Date.now() + 20000; }
  if (D.phase === "pick") {
    D.until = Date.now() + (draftWho() === 0 ? 25000 : 99999);
    if (draftWho() === 1) {
      // the opponent thinks for a moment before each pick
      D.tm = setTimeout(() => {
        const avail = D.opp.roster.filter(k => !D.picks[1].includes(k));
        draftDo(1, draftPick(avail, k => D.opp.prog[k], D.picks[1], D.picks[0], D.opp.q));
      }, 700 + Math.random() * 1800 * (1.2 - D.opp.q));
    } else D.tm = setTimeout(() => draftAuto(), 25000);
  } else if (D.phase === "ban") {
    if (D.ban[1] == null) D.ban[1] = draftBan(D.picks[0], myProg, D.opp.q);
    D.tm = setTimeout(() => { if (DRAFT === D && D.ban[0] == null) draftBanDo(draftBan(D.picks[1], k => D.opp.prog[k], 1)); }, 20000);
  }
  draftRender();
}
function draftAuto() {
  const D = DRAFT; if (!D || D.phase !== "pick" || draftWho() !== 0) return;
  draftDo(0, draftPick(Object.keys(S.ops).filter(k => !D.picks[0].includes(k)), myProg, D.picks[0], D.picks[1], 1));
}
function draftDo(side, k) {
  const D = DRAFT; if (!D || D.phase !== "pick" || draftWho() !== side || !k || D.picks[side].includes(k)) return;
  D.picks[side].push(k); D.step++; sfx("ui_mark", .7); if (side === 0) voice(k, VO.squad, .6);
  draftNext();
}
function draftBanDo(k) {
  const D = DRAFT; if (!D || D.phase !== "ban" || D.ban[0] != null || !D.picks[1].includes(k)) return;
  D.ban[0] = k; D.phase = "done"; clearTimeout(D.tm); sfx("ui_mark");
  draftRender();
  D.tm = setTimeout(draftBattle, 2200);
}
function draftBattle() {
  const D = DRAFT; if (!D) return;
  const mine = withLeader(D.picks[0].filter(k => k !== D.ban[1])), theirs = withLeader(D.picks[1].filter(k => k !== D.ban[0]));
  $("#draft").hidden = true; $("#draft").innerHTML = ""; DRAFT = null;
  S.stats.battles++; save();
  startBattle({
    allies: mine.map(k => ({ op: k, prog: S.ops[k] })), waves: [theirs.map(k => npcSpec(D.opp, k))], env: "arena", bgm: "ccbat", enemyStyle: D.opp.ai, timer: 20,
    title: D.opp.name, sub: `Real-Time Contract · ${tierOf(D.opp.pts).n} · ${fmtFull(D.opp.pts)}`,
    onWin() { const d = rtaResult(D.opp, true); S.stats.wins++; S.daily.arena++; if (D.opp.i != null) contractDM(D.opp.i, true, "rta"); return { rewards: [{ k: "pts", n: d }, ...give({ tokens: 15 + tierIdx(S.rta.pts) * 3 })] }; },
    onLose() { const d = rtaResult(D.opp, false); if (D.opp.i != null) contractDM(D.opp.i, false, "rta"); return { rewards: [{ k: "pts", n: d }] }; },
    onQuit() { rtaResult(D.opp, false); save(); },
    onClose() { UI.arenaTab = "rta"; rerender(); },
  });
}
function draftRender() {
  const D = DRAFT, root = $("#draft"); if (!D || !root) return;
  const me = draftWho() === 0 && D.phase === "pick", ot = tierOf(D.opp.pts);
  const phase = D.phase === "pick" ? (me ? `Your pick (${D.picks[0].length + 1}/5)` : `${esc(D.opp.name)} is picking…`) : D.phase === "ban" ? "Ban one of their operators" : "Battle starting…";
  const slot = (k, side, i) => {
    const banned = k && D.ban[1 - side] === k;
    return `<div class="dslot ${banned ? "banned" : ""} ${D.phase === "ban" && side === 1 && k ? "bannable" : ""}" ${D.phase === "ban" && side === 1 && k ? `data-act="draftBan" data-k="${k}"` : ""} style="${k ? `border-color:${RC[OPS[k].rar]}` : ""}">${k ? `<img class="dhead" src="${headURL(OPS[k])}" alt="${esc(OPS[k].n)}"><span class="dname">${esc(OPS[k].n)}</span>` : `<span class="tiny dim">${i + 1}</span>`}${banned ? '<span class="dban">BANNED</span>' : ""}</div>`;
  };
  const pool = Object.keys(S.ops).sort((a, b) => power(b, S.ops[b]) - power(a, S.ops[a]));
  root.innerHTML = `<div class="drwrap">
    <div class="drtop"><div><small>Real-Time Contract · Draft</small><b>vs ${esc(D.opp.name)}</b> <span class="tiny" style="color:${ot.c}">${ot.n} · ${D.opp.pts}</span></div>
      <div class="drtimer"><i id="drBar"></i></div></div>
    <div class="drphase ${me || D.phase === "ban" ? "mine" : ""}">${phase}</div>
    <div class="drteams"><div><div class="tiny dim">You</div><div class="drslots">${[0, 1, 2, 3, 4].map(i => slot(D.picks[0][i], 0, i)).join("")}</div></div>
      <div><div class="tiny dim">${esc(D.opp.name)}</div><div class="drslots">${[0, 1, 2, 3, 4].map(i => slot(D.picks[1][i], 1, i)).join("")}</div></div></div>
    ${D.phase === "pick" ? `<div class="drroster">${pool.map(k => `<button class="rcell ${D.picks[0].includes(k) ? "sel" : ""}" data-act="draftPick" data-k="${k}" ${me && !D.picks[0].includes(k) ? "" : "disabled"}>${opHTML(k)}<div class="pname">${esc(OPS[k].n)}</div><div class="pw">${fmt(power(k, S.ops[k]))}</div></button>`).join("")}</div>`
      : `<p class="small dim" style="text-align:center;padding:10px">${D.phase === "ban" ? "Tap one of their five operators. They are banning one of yours at the same time." : `You banned <b>${esc(OPS[D.ban[0]].n)}</b>. They banned <b>${esc(OPS[D.ban[1]].n)}</b>.`}</p>`}
  </div>`;
  const bar = () => { const b = $("#drBar"); if (!b || DRAFT !== D) return; const tot = D.phase === "pick" ? 25000 : 20000; b.style.width = clamp((D.until - Date.now()) / tot, 0, 1) * 100 + "%"; requestAnimationFrame(bar); };
  bar();
}
