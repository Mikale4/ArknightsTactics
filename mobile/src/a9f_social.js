
// =====================================================================
//  SCREENS (social): Inbox, Achievements, Chat, Doctor profiles, Guild, Settings
// =====================================================================
const hhmm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const ago2 = ms => ms < 60e3 ? "just now" : ms < 3600e3 ? Math.floor(ms / 60e3) + "m ago" : ms < 864e5 ? Math.floor(ms / 3600e3) + "h ago" : Math.floor(ms / 864e5) + "d ago";
const rwChips = rw => Object.entries(rw || {}).map(([k, n]) => `<span class="cost">${k === "rune" ? IC.rune : itemIcon(k)}${k === "rune" ? "T" + n : fmt(n)}</span>`).join(" ");
const avatarOf = i => headURL(OPS[i === -1 ? S.assistant : person(i).fav[0]]);
const emblem = g => `<span class="gem" style="--gc:${g.col}">${(IC[g.em] || IC.shield)}</span>`;

// ---------- Inbox ----------
SCREENS.inbox = () => {
  const list = S.mail || [], unclaimed = list.filter(m => !m.claimed).length;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Inbox · ${list.length}</span></div>
    <h2>Inbox</h2>
    <div class="row"><button class="btn sm" data-act="mailAll" ${unclaimed ? "" : "disabled"}>Claim all (${unclaimed})</button><button class="btn ghost sm" data-act="mailClean">Delete read</button></div>
    ${list.length ? list.map(m => `<button class="mailrow ${m.read ? "" : "new"} ${m.claimed ? "" : "gift"}" data-act="mailOpen" data-id="${m.id}">
      <span class="mic">${m.kind === "ach" ? IC.star : m.kind === "guild" ? IC.shield : m.kind === "contract" ? IC.arena : m.kind === "dev" ? IC.boost : IC.missions}</span>
      <div class="mtx"><b>${esc(m.title)}</b><span class="tiny dim">${esc(m.from)} · ${ago2(Date.now() - m.t)} · expires in ${Math.max(1, Math.ceil((m.exp - Date.now()) / 864e5))}d</span></div>
      ${m.claimed ? "" : `<span class="mgift">${IC.chest}</span>`}</button>`).join("") : `<p class="small dim">No mail. Rewards from the dev team, achievements, your guild and the Contracts arrive here.</p>`}
  </div>`;
};
function mailModal(id) {
  const m = S.mail.find(x => x.id === id); if (!m) return;
  m.read = true;
  openModal(`<div class="stack"><div class="eyebrow">${esc(m.from)} · ${new Date(m.t).toLocaleString()}</div><h2>${esc(m.title)}</h2>
    <p class="small" style="white-space:pre-wrap">${esc(m.body)}</p>
    ${m.rewards ? `<div class="rewards">${rewardsHTML(Object.entries(m.rewards).map(([k, n]) => k === "rune" ? { k: "rune", n: 1, rune: { rar: n, set: RUNE_SETS[0] } } : { k, n }))}</div>` : ""}
    ${m.rewards && !m.claimed ? `<button class="btn wide" data-act="mailClaim" data-id="${m.id}">Claim</button>` : m.rewards ? `<p class="tiny dim" style="text-align:center">Claimed</p>` : ""}
    <button class="btn ghost wide" data-act="mailClose">Close</button></div>`);
}

// ---------- Achievements ----------
SCREENS.achv = () => {
  const cat = UI.achCat || "story", list = ACHV.filter(a => a.cat === cat), done = ACHV.filter(a => S.ach2 && S.ach2[a.id]).length;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">${done}/${ACHV.length} complete</span></div>
    <h2>Achievements</h2>
    <div class="bar"><i style="width:${done / ACHV.length * 100}%"></i></div>
    <div class="filters">${ACH_CATS.map(([k, n]) => `<button class="chip ${cat === k ? "on" : ""}" data-act="achCat" data-c="${k}">${n} ${ACHV.filter(a => a.cat === k && S.ach2 && S.ach2[a.id]).length}/${ACHV.filter(a => a.cat === k).length}</button>`).join("")}</div>
    <p class="tiny dim">Rewards are sent to your Inbox the moment an achievement is completed.</p>
    ${list.map(a => { let v = 0; try { v = a.val(); } catch (e) { v = 0; } const ok = S.ach2 && S.ach2[a.id];
      return `<div class="sub stack achrow ${ok ? "done" : ""}" style="gap:6px"><div class="spread"><b class="small">${ok ? IC.check.replace("<svg", '<svg width="14" height="14"') : ""} ${esc(a.n)}</b><span class="tiny num">${fmt(Math.min(v, a.goal))}/${fmt(a.goal)}</span></div>
        <span class="tiny dim">${esc(a.d)}</span><div class="bar"><i style="width:${Math.min(100, v / a.goal * 100)}%"></i></div><div class="row tiny">${rwChips(a.reward)}</div></div>`; }).join("")}
  </div>`;
};

// ---------- Chat ----------
function msgHTML(m, ch) {
  if (m.i === -2) return `<div class="cmsg sys"><span>${esc(m.txt)}</span></div>`;
  const me = m.i === -1, g = ch === "world" ? (me ? myGuild() : guildOf(m.i)) : null;
  return `<div class="cmsg ${me ? "me" : ""}"><button class="cav" data-act="prof" data-i="${m.i}" aria-label="Profile"><img src="${avatarOf(m.i)}" alt=""></button>
    <div class="cbody"><div class="cname">${g ? `<span class="gtag" style="color:${g.col}">[${esc(g.tag)}]</span>` : ""}<b data-act="prof" data-i="${m.i}">${esc(npcName(m.i))}</b><span class="ctime">${hhmm(m.t)}</span></div><div class="ctext">${esc(filterTxt(m.txt))}</div></div></div>`;
}
function chatTabKey() { return UI.chatTab || "world"; }
SCREENS.chat = () => {
  chatInit();
  const tab = chatTabKey(), C = S.chat, dmI = tab.startsWith("dm:") ? +tab.slice(3) : null;
  if (tab === "world") C.unread.world = 0;
  if (tab === "guild") C.unread.guild = 0;
  if (dmI != null) { const st = npcState(dmI); C.unread.dm = Math.max(0, C.unread.dm - (st.unread || 0)); st.unread = 0; }
  const tabs = [["world", "World", C.unread.world], ["guild", "Guild", C.unread.guild], ["dms", "Whispers", C.unread.dm]];
  let body = "";
  if (tab === "dms") {
    const th = Object.keys(C.dm).map(Number).filter(i => C.dm[i].length).sort((a, b) => C.dm[b].slice(-1)[0].t - C.dm[a].slice(-1)[0].t);
    body = th.length ? `<div class="stack" style="gap:6px">${th.map(i => { const last = C.dm[i].slice(-1)[0], st = npcState(i);
      return `<button class="dmrow" data-act="chatTab" data-t="dm:${i}"><img src="${avatarOf(i)}" alt=""><div class="mtx"><b>${esc(npcName(i))} ${isOnline(i) ? '<i class="ondot"></i>' : ""}</b><span class="tiny dim">${last.i === -1 ? "You: " : ""}${esc(last.txt.slice(0, 60))}</span></div>${st.unread ? `<span class="ubadge">${st.unread}</span>` : `<span class="tiny dim">${ago2(Date.now() - last.t)}</span>`}</button>`; }).join("")}</div>`
      : `<p class="small dim">No whispers yet. Tap a Doctor's name in chat to see their profile and whisper them.</p>`;
  } else if (tab === "guild" && !S.guild) body = `<p class="small dim">You're not in a guild yet.</p><button class="btn wide" data-act="go" data-v="guild">Find a guild</button>`;
  else {
    const list = dmI != null ? (C.dm[dmI] || []) : C[tab];
    body = `<div class="clog" id="clog">${list.map(m => msgHTML(m, tab)).join("") || `<p class="small dim">Say hi!</p>`}</div>`;
  }
  const head = dmI != null ? `<div class="spread">${back("chatTab", "Whispers", 'data-t="dms"')}<button class="btn ghost sm" data-act="prof" data-i="${dmI}">${esc(npcName(dmI))} ${isOnline(dmI) ? '<i class="ondot"></i>' : `<span class="tiny dim">· ${ago2(lastSeen(dmI))}</span>`}</button></div>`
    : `<div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">${tab === "world" ? fmtFull(onlineNow().length) + " Doctors online" : tab === "guild" && myGuild() ? esc(myGuild().name) : "Chat"}</span></div>
      <div class="tabs2">${tabs.map(([k, n, u]) => `<button class="${tab === k ? "on" : ""}" data-act="chatTab" data-t="${k}">${n}${u ? ` <span class="ubadge">${u > 99 ? "99+" : u}</span>` : ""}</button>`).join("")}</div>`;
  const canType = tab === "world" || (tab === "guild" && S.guild) || dmI != null;
  return `<div class="chatscr">${head}${body}
    ${canType ? `<form class="cinput" id="cform" onsubmit="return false"><input id="cin" maxlength="200" autocomplete="off" placeholder="${dmI != null ? "Whisper " + esc(npcName(dmI)) : tab === "guild" ? "Message your guild" : "Message World chat"}"><button class="btn sm" data-act="chatSend">Send</button></form>` : ""}</div>`;
};
// new messages are appended in place so typing isn't interrupted
chatUpdated = (ch, m, dmWith) => {
  if (!S) return;
  if (UI.view === "chat") {
    const tab = chatTabKey(), here = tab === ch || (ch === "dm" && tab === "dm:" + dmWith);
    const log = $("#clog");
    if (here && log) { const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80; log.insertAdjacentHTML("beforeend", msgHTML(m, ch)); while (log.children.length > CHAT_MAX) log.firstChild.remove(); if (near || m.i === -1) log.scrollTop = log.scrollHeight;
      if (ch === "world") S.chat.unread.world = 0; else if (ch === "guild") S.chat.unread.guild = 0; else { S.chat.unread.dm = Math.max(0, S.chat.unread.dm - 1); npcState(dmWith).unread = 0; } }
    else { for (const b of $$('#view .tabs2 [data-act="chatTab"]')) { const k = b.dataset.t, u = k === "dms" ? S.chat.unread.dm : S.chat.unread[k]; b.innerHTML = b.textContent.replace(/\s*\d+\+?$/, "") + (u ? ` <span class="ubadge">${u > 99 ? "99+" : u}</span>` : ""); } }
  }
  if (UI.view === "home") tickerUpdate();
  if (ch === "dm" && m.i >= 0 && !(UI.view === "chat" && chatTabKey() === "dm:" + dmWith) && setv("whisperToasts") && !(typeof DEMO !== "undefined" && DEMO.on)) toast(`${npcName(m.i)} whispers: ${m.txt.slice(0, 40)}${m.txt.length > 40 ? "…" : ""}`);
  const cb = $("#chatBtnDot"); if (cb) cb.hidden = !(S.chat.unread.guild + S.chat.unread.dm);
};
function tickerHTML() {
  chatInit();
  const m = S.chat.world.slice(-1)[0], u = S.chat.unread.guild + S.chat.unread.dm;
  return `<button class="ticker" data-act="go" data-v="chat"><span class="tk">${IC.missions.replace("<svg", '<svg width="16" height="16"')}World</span><span class="tmsg" id="tmsg">${m ? `<b>${esc(npcName(m.i))}:</b> ${esc(filterTxt(m.txt))}` : "Chat with other Doctors"}</span>${u ? `<span class="ubadge">${u}</span>` : ""}</button>`;
}
function tickerUpdate() { const t = $(".ticker"); if (t && !(S.settings.ticker === false)) t.outerHTML = tickerHTML(); }
function chatScrollEnd() { const log = $("#clog"); if (log) log.scrollTop = log.scrollHeight; }

// ---------- Doctor profiles ----------
function profModal(i) {
  if (i === -1) return meModal();
  if (i < 0) return;
  const p = person(i), doc = ladderDoc(i), g = guildOf(i), pts = S.ladder.pop[i], st = npcState(i), on = isOnline(i);
  const inMine = g && g.id === S.guild, sent = (S.gSent || []).some(x => x.i === i);
  openModal(`<div class="stack">
    <div class="row" style="gap:12px;align-items:center"><div class="pavatar"><img src="${avatarOf(i)}" alt=""></div>
      <div style="min-width:0"><div class="eyebrow">${on ? '<i class="ondot"></i> Online' : "Last seen " + ago2(lastSeen(i))}</div><h2 style="margin:2px 0">${esc(p.name)}</h2>
      <div class="small dim">Doctor Lv ${p.lvl} · ${ARCH_NAME[p.arch]}</div></div></div>
    <p class="small" style="font-style:italic">"${esc(p.bio)}"</p>
    <div class="statgrid small"><div><span>Contingency Contract</span><b>${tierOf(pts).n} · ${fmtFull(pts)}</b></div><div><span>Guild</span><b>${g ? `[${esc(g.tag)}] ${esc(g.name)}` : "None"}</b></div>
      <div><span>Doctor since</span><b>${p.joined} days</b></div><div><span>Met in Contracts</span><b>${st.met || 0}×</b></div></div>
    <div class="eyebrow">Favourite operators</div><div class="row">${p.fav.map(k => opHTML(k, { s: 52, nolv: 1, show: 1 })).join("")}</div>
    <div class="eyebrow">Defense squad</div><div class="row">${doc.team.map(k => opHTML(k, { s: 52, prog: doc.prog[k] })).join("")}</div>
    <div class="row wrap"><button class="btn sm" data-act="whisper" data-i="${i}">Whisper</button>
      ${canInvite() && !inMine ? `<button class="btn ghost sm" data-act="ginvite" data-i="${i}" ${sent || myGuild().mem.length >= guildCap(myGuild()) ? "disabled" : ""}>${sent ? "Invite sent" : "Invite to guild"}</button>` : ""}
      ${inMine && canInvite() && g.lead !== i ? `<button class="btn ghost sm" data-act="gkick" data-i="${i}">Remove from guild</button>` : ""}
      ${inMine && myRole() === "leader" && g.lead !== i ? `<button class="btn ghost sm" data-act="gpromote" data-i="${i}">${g.off.includes(i) ? "Remove officer" : "Make officer"}</button>` : ""}
      <button class="btn ghost sm" data-act="block" data-i="${i}">${S.blocked[i] ? "Unblock" : "Block"}</button></div>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}
function meModal() {
  const g = myGuild();
  openModal(`<div class="stack">
    <div class="row" style="gap:12px;align-items:center"><div class="pavatar"><img src="${avatarOf(-1)}" alt=""></div>
      <div><div class="eyebrow">Doctor ID ${(hash(SAVE_SLOT + S.ladder.seed) % 90000000 + 10000000)}</div><h2 style="margin:2px 0">${S.name === "Doctor" ? "Doctor" : "Dr. " + esc(S.name)}</h2><div class="small dim">Doctor Lv ${S.lvl}</div></div></div>
    <div class="statgrid small"><div><span>Roster power</span><b>${fmtFull(rosterPower())}</b></div><div><span>Operators</span><b>${Object.keys(S.ops).length}</b></div>
      <div><span>Contingency Contract</span><b>${tierOf(S.ladder.pts).n} · ${fmtFull(S.ladder.pts)}</b></div><div><span>Real-Time Contract</span><b>${tierOf(S.rta.pts).n} · ${fmtFull(S.rta.pts)}</b></div>
      <div><span>Guild</span><b>${g ? `[${esc(g.tag)}] ${esc(g.name)}` : "None"}</b></div><div><span>Achievements</span><b>${Object.keys(S.ach2 || {}).length}/${ACHV.length}</b></div>
      <div><span>Battles won</span><b>${fmtFull(S.stats.wins)}</b></div><div><span>Headhunts</span><b>${fmtFull(S.gacha.total)}</b></div></div>
    <div class="row wrap"><button class="btn sm" data-act="go" data-v="settings">Settings</button><button class="btn ghost sm" data-act="go" data-v="achv">Achievements</button><button class="btn ghost sm" data-act="go" data-v="inbox">Inbox</button></div>
    <button class="btn ghost wide" data-act="closeModal">Close</button></div>`);
}

// ---------- Guild ----------
const POL = { open: "Anyone can join", approval: "Approval required", closed: "Invite only" };
function guildCard(g, act) {
  const full = g.mem.length >= guildCap(g), req = (S.gReq || []).some(x => x.gid === g.id);
  return `<div class="sub stack" style="gap:6px"><div class="row" style="gap:10px;align-items:center">${emblem(g)}<div style="min-width:0;flex:1"><b>${esc(g.name)}</b> <span class="tiny dim">[${esc(g.tag)}]</span>
    <div class="tiny dim">Lv ${g.lvl} · ${g.mem.length}/${guildCap(g)} members · ${POL[g.pol]}${g.minLvl ? ` · Doctor Lv ${g.minLvl}+` : ""}</div></div></div>
    <p class="tiny" style="margin:0">${esc(g.desc)}</p>
    ${act ? `<button class="btn sm" data-act="gjoin" data-g="${g.id}" ${full || g.pol === "closed" || req || S.lvl < g.minLvl ? "disabled" : ""}>${req ? "Request sent" : full ? "Full" : g.pol === "closed" ? "Invite only" : S.lvl < g.minLvl ? `Needs Lv ${g.minLvl}` : g.pol === "open" ? "Join" : "Request to join"}</button>` : ""}</div>`;
}
SCREENS.guild = () => {
  guildWorld();
  const g = myGuild();
  if (!g) {
    const q = (UI.gSearch || "").toLowerCase();
    const list = guildList().filter(x => !q || x.name.toLowerCase().includes(q) || x.tag.toLowerCase().includes(q))
      .sort((a, b) => (q ? 0 : ((b.mem.length < guildCap(b) && b.minLvl <= S.lvl) - (a.mem.length < guildCap(a) && a.minLvl <= S.lvl)) * 10) + (b.lvl - a.lvl) + (Math.abs(a.q - ratingQ(S.ladder.best)) - Math.abs(b.q - ratingQ(S.ladder.best))) * 8).slice(0, 25);
    const inv = (S.gInv || []).filter(x => guildById(x.gid) && x.t <= Date.now());
    const cool = S.gLeft && Date.now() - S.gLeft < 3600e3;
    return `<div class="stack">
      <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Guild</span></div>
      <h2>Find a guild</h2>
      <p class="small dim">Guilds donate together and take on a weekly guild boss. Guild Wars and Guild Siege are coming later.</p>
      ${cool ? `<div class="hint"><span class="small">You left a guild recently. You can join another in ${dur(3600e3 - (Date.now() - S.gLeft))}.</span></div>` : ""}
      ${inv.length ? `<h3>Invitations</h3>${inv.map(x => { const gg = guildById(x.gid); return `<div class="sub stack" style="gap:6px"><span class="small"><b>${esc(npcName(x.i))}</b> invited you to <b>${esc(gg.name)}</b></span>${guildCard(gg)}
        <div class="row"><button class="btn sm" data-act="ginvAccept" data-g="${gg.id}" ${cool ? "disabled" : ""}>Accept</button><button class="btn ghost sm" data-act="ginvDecline" data-g="${gg.id}">Decline</button></div></div>`; }).join("")}` : ""}
      ${(S.gReq || []).length ? `<div class="sub small">Waiting for approval: ${(S.gReq || []).map(x => guildById(x.gid) ? esc(guildById(x.gid).name) : "").join(", ")}</div>` : ""}
      <div class="row"><input id="gsearch" class="tin" placeholder="Search guilds" value="${esc(UI.gSearch || "")}"><button class="btn ghost sm" data-act="gsearch">Search</button></div>
      <button class="btn wide" data-act="gcreate" ${cool ? "disabled" : ""}>Create a guild · <span class="cost">${IC.lmd}100K</span></button>
      <h3>${q ? "Results" : "Recommended"}</h3>
      ${list.map(x => guildCard(x, !cool)).join("") || '<p class="small dim">No guilds found.</p>'}
    </div>`;
  }
  const tab = UI.gTab || "members", role = myRole(), b = gBoss(g), apps = (S.gApps || []).length;
  const tabs = [["members", "Members"], ["donate", "Donate"], ["boss", "Boss"], ...(canInvite() ? [["recruit", "Recruit" + (apps ? ` (${apps})` : "")]] : []), ...(role === "leader" ? [["manage", "Manage"]] : [])];
  let body = "";
  if (tab === "members") {
    const order = { leader: 0, officer: 1, member: 2 }, roleOf = i => i === g.lead ? "leader" : g.off.includes(i) ? "officer" : "member";
    const mem = g.mem.slice().sort((a, c) => order[roleOf(a)] - order[roleOf(c)] || (c === -1 ? 1 : a === -1 ? -1 : isOnline(c) - isOnline(a)));
    body = mem.map(i => { const me = i === -1, on = me || isOnline(i), don = g.don && g.don.day === today() && g.don.by[i], tries = (b.tries && b.tries[i]) || 0;
      return `<button class="mrow" data-act="prof" data-i="${i}"><img src="${avatarOf(i)}" alt=""><div class="mtx"><b>${esc(npcName(i))}${me ? " (you)" : ""} ${on ? '<i class="ondot"></i>' : ""}</b>
        <span class="tiny dim">${roleOf(i) !== "member" ? `<span class="gold">${roleOf(i) === "leader" ? "Leader" : "Officer"}</span> · ` : ""}Lv ${me ? S.lvl : person(i).lvl} · ${tierOf(me ? S.ladder.pts : S.ladder.pop[i]).n}${on ? "" : " · " + ago2(lastSeen(i))}</span></div>
        <span class="tiny">${don ? IC.check.replace("<svg", '<svg width="14" height="14"') : ""} ${tries}/2</span></button>`; }).join("");
  } else if (tab === "donate") {
    const by = g.don && g.don.day === today() ? g.don.by : {}, mine = by[-1];
    body = `<p class="small dim">Donate once a day. Donations level up the guild (more members, bigger boss rewards) and earn you rewards. ${Object.keys(by).length} of ${g.mem.length} members have donated today.</p>
      ${DONATIONS.map(d => `<div class="sub spread"><div><b class="small">${d.n} donation</b><div class="row tiny">${rwChips(d.cost)} → +${d.xp} guild EXP · you get ${rwChips(d.give)}</div></div>
        <button class="btn sm" data-act="gdonate" data-id="${d.id}" ${mine || Object.entries(d.cost).some(([k, n]) => have(k) < n) ? "disabled" : ""}>${mine === d.id ? "Donated" : "Donate"}</button></div>`).join("")}`;
  } else if (tab === "boss") {
    const E = ENEMY[b.key], ranks = Object.entries(b.hits).map(([i, d]) => [+i, d]).sort((x, y) => y[1] - x[1]).slice(0, 10);
    body = `<div class="gboss"><img src="${enemyArt(b.key).full}" alt=""><div><div class="eyebrow">This week's guild boss</div><h2 style="margin:2px 0">${esc(E.n)}</h2><div class="small">Stage ${b.stage} · Lv ${gbLV(b.stage)}</div></div></div>
      <div class="bar boss"><i style="width:${b.hp / b.max * 100}%"></i></div><div class="spread tiny"><span class="num">${fmtFull(Math.round(b.hp))} / ${fmtFull(b.max)} HP</span><span>Resets in ${dur(weekEnds() - Date.now())}</span></div>
      <p class="small dim">Each member gets 2 attacks a day, ${GB_TURNS} turns each. Your damage carries over; every cleared stage sends rewards to all members' Inboxes.</p>
      <button class="btn wide" data-act="gbossGo" ${gbTriesLeft() > 0 ? "" : "disabled"}>Attack · ${gbTriesLeft()}/2 left today</button>
      <h3>Damage this week</h3>${ranks.map(([i, d], k) => `<div class="spread small"><span>${k + 1}. ${esc(npcName(i))}</span><span class="num">${fmt(d)}</span></div>`).join("") || '<p class="small dim">No attacks yet.</p>'}
      <h3>Recent attacks</h3>${b.log.slice(0, 8).map(x => `<div class="spread tiny"><span>${esc(npcName(x.i))}</span><span class="num">${fmt(x.dmg)} · ${ago2(Date.now() - x.t)}</span></div>`).join("")}`;
  } else if (tab === "recruit") {
    const sent = S.gSent || [];
    const recs = onlineNow().filter(i => !guildOf(i) && person(i).lvl >= g.minLvl).sort((a, c) => person(c).q - person(a).q).slice(0, 12);
    body = `${apps ? `<h3>Requests to join</h3>${S.gApps.map(a => `<div class="mrow"><img src="${avatarOf(a.i)}" alt=""><div class="mtx" data-act="prof" data-i="${a.i}"><b>${esc(npcName(a.i))}</b><span class="tiny dim">Lv ${person(a.i).lvl} · ${tierOf(S.ladder.pop[a.i]).n} · ${ago2(Date.now() - a.t)}</span></div>
        <button class="btn sm" data-act="gappOk" data-i="${a.i}">Accept</button><button class="btn ghost sm" data-act="gappNo" data-i="${a.i}">Decline</button></div>`).join("")}` : ""}
      <h3>Doctors looking for a guild</h3><p class="tiny dim">Online now, without a guild. You can also invite anyone from their profile in chat or the Contracts.</p>
      ${recs.map(i => `<div class="mrow"><img src="${avatarOf(i)}" alt=""><div class="mtx" data-act="prof" data-i="${i}"><b>${esc(npcName(i))} <i class="ondot"></i></b><span class="tiny dim">Lv ${person(i).lvl} · ${tierOf(S.ladder.pop[i]).n} · ${ARCH_NAME[person(i).arch]}</span></div>
        <button class="btn sm" data-act="ginvite" data-i="${i}" ${sent.some(x => x.i === i) || g.mem.length >= guildCap(g) ? "disabled" : ""}>${sent.some(x => x.i === i) ? "Sent" : "Invite"}</button></div>`).join("") || '<p class="small dim">Nobody right now. Check back later.</p>'}`;
  } else if (tab === "manage") {
    body = `<label class="small dim">Description</label><textarea id="gdesc" class="tin" rows="3" maxlength="160">${esc(g.desc)}</textarea>
      <label class="small dim">Who can join</label><div class="filters">${Object.entries(POL).map(([k, n]) => `<button class="chip ${g.pol === k ? "on" : ""}" data-act="gpol" data-p="${k}">${n}</button>`).join("")}</div>
      <label class="small dim">Minimum Doctor level</label><div class="filters">${[0, 20, 40, 60, 80, 100].map(l => `<button class="chip ${g.minLvl === l ? "on" : ""}" data-act="gmin" data-l="${l}">${l || "Any"}</button>`).join("")}</div>
      <button class="btn wide" data-act="gsave">Save</button>`;
  }
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<button class="btn ghost sm" data-act="chatGuild">${IC.missions.replace("<svg", '<svg width="16" height="16"')} Guild chat${S.chat.unread.guild ? ` <span class="ubadge">${S.chat.unread.guild}</span>` : ""}</button></div>
    <section class="panel guildcard" style="--gc:${g.col}"><div class="row" style="gap:12px;align-items:center">${emblem(g)}<div style="min-width:0;flex:1"><div class="eyebrow">${role === "leader" ? "Leader" : role === "officer" ? "Officer" : "Member"} · ${POL[g.pol]}</div>
      <h2 style="margin:2px 0">${esc(g.name)} <span class="small dim">[${esc(g.tag)}]</span></h2><div class="small">Lv ${g.lvl} · ${g.mem.length}/${guildCap(g)} members</div></div></div>
      <div class="bar" style="margin-top:8px"><i style="width:${g.xp / gxpNeed(g.lvl) * 100}%"></i></div><p class="tiny dim" style="margin:6px 0 0">${esc(g.desc)}</p></section>
    <div class="tabs2">${tabs.map(([k, n]) => `<button class="${tab === k ? "on" : ""}" data-act="gTab" data-t="${k}">${n}</button>`).join("")}</div>
    ${body}
    <button class="btn ghost wide" data-act="gleave">${role === "leader" && g.mem.length > 1 ? "Leave (leadership passes on)" : "Leave guild"}</button>
  </div>`;
};
function createGuildModal(err) {
  openModal(`<div class="stack"><h2>Create a guild</h2>${err ? `<p class="small" style="color:var(--ds)">${esc(err)}</p>` : ""}
    <label class="small dim">Name (3–20 characters)</label><input id="gname" class="tin" maxlength="20">
    <label class="small dim">Tag (2–4 letters)</label><input id="gtag" class="tin" maxlength="4" style="text-transform:uppercase">
    <label class="small dim">Description</label><textarea id="gdesc2" class="tin" rows="3" maxlength="160">Friendly guild. Donate daily and hit the boss!</textarea>
    <p class="tiny dim">Costs 100,000 LMD and needs Doctor level 10. You can change who can join later.</p>
    <button class="btn wide" data-act="gcreateGo" ${S.lmd >= 100000 && S.lvl >= 10 ? "" : "disabled"}>Create · <span class="cost">${IC.lmd}100K</span></button><button class="btn ghost wide" data-act="closeModal">Cancel</button></div>`);
}
function launchGuildBoss() {
  const g = myGuild(), ids = squadOrToast("gboss");
  if (!g || !ids) return;
  if (gbTriesLeft() <= 0) { toast("No attacks left today."); route("guild"); return; }
  const b = gBoss(g); b.tries[-1] = (b.tries[-1] || 0) + 1;
  route("guild"); S.stats.battles++; save();
  const stage = b.stage, key = b.key;
  const finish = (res, B) => {
    const dmg = Math.round(B.damageBy("A")), cleared = gbHit(g, -1, dmg);
    stat("bossHits"); stat("bossDmg", dmg);
    const list = give({ lmd: 3000 + Math.round(dmg / 200), ...(dmg > b.ref ? { rec3: 2 } : { rec2: 3 }) });
    if (Math.random() < .4) { const on = g.mem.filter(i => i >= 0 && isOnline(i)); if (on.length) later(4000, "guild", pick(on), dmg > b.ref ? "reply_congrats" : "g_banter", { to: S.name }); }
    return { rewards: [{ k: "dmg", n: dmg }, ...list], note: `${fmtFull(dmg)} damage${cleared ? ` · stage ${stage} cleared!` : ""}` };
  };
  startBattle({
    allies: allySpecs(ids), waves: [[{ en: key, LV: gbLV(stage), maxHp: b.max, hpNow: b.hp, boss: 1 }]], env: "core", bgm: "bossLungmen", turnLimit: GB_TURNS,
    title: `${ENEMY[key].n} · Stage ${stage}`, sub: `Guild Boss · ${g.name}`,
    onWin: finish, onLose: finish,
    onQuit() { save(); },
  });
}

// ---------- Settings ----------
const SET_DEF = { speed: 1, ai: "balanced", cutins: true, shake: true, dmgNums: true, textSpeed: "normal", motion: true, ticker: true, worldChat: true, whisperToasts: true, filter: false };
const setv = k => S.settings[k] != null ? S.settings[k] : SET_DEF[k];
function togRow(k, n, d) { return `<div class="setrow"><div><b class="small">${n}</b>${d ? `<div class="tiny dim">${d}</div>` : ""}</div><button class="tog ${setv(k) ? "on" : ""}" data-act="setTog" data-k="${k}">${setv(k) ? "On" : "Off"}</button></div>`; }
function optRow(k, n, opts) { return `<div class="setrow"><b class="small">${n}</b><div class="filters">${opts.map(([v, l]) => `<button class="chip ${String(setv(k)) === String(v) ? "on" : ""}" data-act="setOpt" data-k="${k}" data-v="${v}">${l}</button>`).join("")}</div></div>`; }
SCREENS.settings = () => {
  const A = audioPrefs(), conf = UI.setReset;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Settings</span></div>
    <h2>Settings</h2>
    <section class="panel stack" style="gap:8px"><h3>Sound</h3>
      ${[["music", "Music"], ["sfx", "Effects"], ["voice", "Voices"]].map(([k, n]) => `<label class="volrow"><span>${n}</span><input type="range" min="0" max="100" value="${Math.round(A[k] * 100)}" data-act="vol" data-k="${k}"></label>`).join("")}
      <div class="setrow"><b class="small">Mute everything</b><button class="tog ${A.mute ? "on" : ""}" data-act="toggleSound">${A.mute ? "Muted" : "Off"}</button></div></section>
    <section class="panel stack" style="gap:8px"><h3>Battle</h3>
      ${optRow("speed", "Default battle speed", [[1, "1×"], [2, "2×"], [3, "3×"]])}
      ${optRow("ai", "Auto-battle AI", AI_STYLES.map(s => [s, s[0].toUpperCase() + s.slice(1)]))}
      ${togRow("cutins", "Skill cut-ins", "The operator art that flashes up for big skills")}
      ${togRow("shake", "Screen shake")}
      ${togRow("dmgNums", "Damage numbers")}</section>
    <section class="panel stack" style="gap:8px"><h3>Story & display</h3>
      ${optRow("textSpeed", "Story text speed", [["slow", "Slow"], ["normal", "Normal"], ["fast", "Fast"], ["instant", "Instant"]])}
      ${togRow("motion", "Animations", "Turn off to reduce motion in menus")}</section>
    <section class="panel stack" style="gap:8px"><h3>Chat</h3>
      ${togRow("ticker", "World chat on the lobby")}
      ${togRow("whisperToasts", "Whisper notifications")}
      ${togRow("filter", "Filter rude words")}
      <div class="setrow"><div><b class="small">Blocked Doctors</b><div class="tiny dim">${Object.keys(S.blocked || {}).length ? Object.keys(S.blocked).map(i => esc(npcName(+i))).join(", ") : "Nobody"}</div></div>${Object.keys(S.blocked || {}).length ? `<button class="btn ghost sm" data-act="unblockAll">Unblock all</button>` : ""}</div></section>
    <section class="panel stack" style="gap:8px"><h3>Account</h3>
      <label class="small dim" for="pname">Doctor name</label>
      <div class="row"><input id="pname" class="tin" maxlength="16" value="${esc(S.name)}"><button class="btn sm" data-act="saveName2">Save</button></div>
      <div class="tiny dim">${SESSION && SESSION.id !== "guest" && SESSION.id !== "hot" ? `Logged in as Dr. ${esc(SESSION.name)}.` : "Playing as Guest."} Progress saves in this browser.</div>
      <div class="row wrap"><button class="btn ghost sm" data-act="exportSave">Copy save code</button><button class="btn ghost sm" data-act="importSave">Load save code</button></div>
      <button class="btn ghost wide" data-act="logout">${SESSION && SESSION.id !== "guest" ? "Log out" : "Back to title"}</button>
      ${conf ? `<div class="sub stack" style="gap:8px;border-color:var(--ds)"><b class="small">Erase all progress?</b><p class="tiny dim">Your operators, modules, story progress and currencies will be deleted from this browser.</p>
        <div class="row"><button class="btn red sm" data-act="doReset">Erase progress</button><button class="btn ghost sm" data-act="setResetNo">Keep playing</button></div></div>`
        : `<button class="btn ghost wide" data-act="setResetAsk">Reset progress</button>`}</section>
    <section class="panel stack" style="gap:6px"><h3>About</h3>
      <p class="tiny dim">Arknights Tactics ${GAME_VERSION} · an unofficial, non-commercial fan game. Arknights characters, art, music, sound and voices belong to Hypergryph and Yostar.
      Audio from the PseudoMon/arknights-audio archive; story and enemy art from the Aceship and ArknightsGameResource mirrors. The Doctors you meet in chat and the Contracts are simulated.</p></section>
  </div>`;
};
const RUDE_WORDS = /\b(stupid|idiot|dumb|trash|garbage|moron|shut up|stfu|loser|pathetic|clown|cringe)\b/gi;
const filterTxt = t => setv("filter") ? t.replace(RUDE_WORDS, w => w[0] + "*".repeat(w.length - 1)) : t;

// ---------- actions ----------
const SOCIAL_ACT = {
  mailOpen: d => mailModal(+d.id),
  mailClose: () => { closeModal(); if (UI.view === "inbox") rerender(); },
  mailClaim: d => { const list = claimMail(+d.id); sfx("ui_reward"); closeModal(); if (list.length) rewardModal("Claimed", list); rerender(); },
  mailAll: () => { const list = []; for (const m of (S.mail || []).slice()) if (!m.claimed) list.push(...claimMail(m.id)); for (const m of S.mail) m.read = true; sfx("ui_reward"); rerender(); if (list.length) rewardModal("Claimed", list, "Inbox"); },
  mailClean: () => { S.mail = (S.mail || []).filter(m => !(m.read && m.claimed)); rerender(); },
  achCat: d => { UI.achCat = d.c; rerender(); },
  chatTab: d => { UI.chatTab = d.t; route("chat"); chatScrollEnd(); },
  chatGuild: () => { UI.chatTab = "guild"; route("chat"); chatScrollEnd(); },
  chatSend: () => {
    const inp = $("#cin"); if (!inp) return;
    const v = inp.value.trim(); if (!v) return;
    inp.value = "";
    const tab = chatTabKey();
    if (tab.startsWith("dm:")) playerSay("dm", v, +tab.slice(3)); else playerSay(tab, v);
    sfx("tap"); inp.focus();
  },
  prof: d => profModal(+d.i),
  whisper: d => { closeModal(); UI.chatTab = "dm:" + d.i; chatInit(); S.chat.dm[d.i] = S.chat.dm[d.i] || []; route("chat"); chatScrollEnd(); const i = $("#cin"); if (i) i.focus(); },
  block: d => { const i = +d.i; if (S.blocked[i]) delete S.blocked[i]; else S.blocked[i] = 1; toast(S.blocked[i] ? `${npcName(i)} is blocked.` : `${npcName(i)} is unblocked.`); profModal(i); },
  unblockAll: () => { S.blocked = {}; rerender(); },
  ginvite: d => { const i = +d.i; inviteNpc(i); toast(`Invite sent to ${npcName(i)}.`); if (!$("#modal").hidden) profModal(i); else rerender(); },
  gkick: d => { kickMember(+d.i); closeModal(); rerender(); },
  gpromote: d => { promoteMember(+d.i); closeModal(); rerender(); },
  gTab: d => { UI.gTab = d.t; rerender(); },
  gsearch: () => { UI.gSearch = ($("#gsearch") || {}).value || ""; rerender(); },
  gjoin: d => { const g = guildById(d.g), r = requestJoin(g); toast(r === "joined" ? `Welcome to ${g.name}!` : r === "sent" ? "Request sent. The guild's leaders will decide." : r === "level" ? `Needs Doctor level ${g.minLvl}.` : "This guild is invite only."); rerender(); },
  ginvAccept: d => { const g = guildById(d.g); if (g && g.mem.length < guildCap(g)) { joinGuild(g); toast(`Welcome to ${g.name}!`); } else toast("That guild is full now."); S.gInv = (S.gInv || []).filter(x => x.gid !== d.g); rerender(); },
  ginvDecline: d => { S.gInv = (S.gInv || []).filter(x => x.gid !== d.g); rerender(); },
  gcreate: () => createGuildModal(),
  gcreateGo: () => {
    const name = (($("#gname") || {}).value || "").trim(), tag = (($("#gtag") || {}).value || "").trim().toUpperCase(), desc = (($("#gdesc2") || {}).value || "").trim().slice(0, 160);
    if (name.length < 3) return createGuildModal("The name needs at least 3 characters.");
    if (!/^[A-Z0-9]{2,4}$/.test(tag)) return createGuildModal("The tag needs 2–4 letters or numbers.");
    if (guildList().some(g => g.name.toLowerCase() === name.toLowerCase())) return createGuildModal("That name is taken.");
    if (S.lmd < 100000 || S.lvl < 10) return;
    S.lmd -= 100000; createGuild(name, tag, desc || "Friendly guild.", "approval", 0);
    closeModal(); sfx("ui_win"); toast(`${name} is founded!`); UI.gTab = "recruit"; route("guild");
  },
  gleave: () => openModal(`<div class="stack"><h2>Leave the guild?</h2><p class="small dim">You won't be able to join another guild for an hour.</p><div class="row"><button class="btn red sm" data-act="gleaveGo">Leave</button><button class="btn ghost sm" data-act="closeModal">Stay</button></div></div>`),
  gleaveGo: () => { leaveGuild(); closeModal(); UI.gTab = "members"; rerender(); },
  gdonate: d => { const list = donate(d.id); if (list) { sfx("ui_reward"); rewardModal("Donated", list, myGuild().name); } rerender(); },
  gbossGo: () => { const g = myGuild(), b = gBoss(g); teamScreen("gboss", `Guild Boss · ${ENEMY[b.key].n}`, 0, [{ en: b.key, LV: gbLV(b.stage) }], ["guild", null], { kind: "gboss" }); },
  gappOk: d => { if (!acceptApp(+d.i)) toast("The guild is full."); rerender(); },
  gappNo: d => { denyApp(+d.i); rerender(); },
  gpol: d => { myGuild().pol = d.p; rerender(); },
  gmin: d => { myGuild().minLvl = +d.l; rerender(); },
  gsave: () => { const g = myGuild(); g.desc = (($("#gdesc") || {}).value || g.desc).slice(0, 160); toast("Saved."); rerender(); },
  setTog: d => { S.settings[d.k] = !setv(d.k); applySettings(); save(); rerender(); },
  setOpt: d => { S.settings[d.k] = isNaN(+d.v) ? d.v : +d.v; applySettings(); save(); rerender(); },
  setResetAsk: () => { UI.setReset = 1; rerender(); },
  setResetNo: () => { UI.setReset = 0; rerender(); },
  saveName2: () => { const v = ($("#pname") || {}).value; S.name = (v || "").trim().slice(0, 16) || "Doctor"; toast("Saved."); rerender(); },
  exportSave: () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); try { navigator.clipboard.writeText(code); toast("Save code copied."); } catch (e) { openModal(`<div class="stack"><h2>Save code</h2><textarea class="tin" rows="6">${code}</textarea><button class="btn wide" data-act="closeModal">Close</button></div>`); } },
  importSave: () => openModal(`<div class="stack"><h2>Load save code</h2><p class="tiny dim">This replaces the progress in this slot.</p><textarea id="scode" class="tin" rows="6"></textarea><button class="btn wide" data-act="importGo">Load</button><button class="btn ghost wide" data-act="closeModal">Cancel</button></div>`),
  importGo: () => { try { const s = JSON.parse(decodeURIComponent(escape(atob((($("#scode") || {}).value || "").trim())))); if (!s || s.v !== 1) throw 0; enterGame(SAVE_SLOT, { save: s }); toast("Save loaded."); } catch (e) { toast("That code didn't work."); } },
};
// settings that change how things look are applied as body classes
function applySettings() {
  if (!S) return;
  document.body.classList.toggle("nomotion", !setv("motion"));
  document.body.classList.toggle("nodmg", !setv("dmgNums"));
}
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "cin") { e.preventDefault(); SOCIAL_ACT.chatSend(); } });
