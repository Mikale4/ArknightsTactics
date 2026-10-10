
// =====================================================================
//  META — Mailbox (gifts and Mystery Gifts), Z Records (achievements), the Scouter Card with settings, and the title screen
// =====================================================================
const GAME_VER = "1.0.0";
const MAIL_DAYS = 30;            // gifts expire after this many days; claimed mail is cleared after the same time
const GIFT_MS = 3 * 3600000;     // a letter from a friend every few hours of real time
const DAY_MS = 864e5;

// ---------- inbox ----------
function mailTo(s, m) {
  s.inbox = s.inbox || [];
  const mail = { id: ++s.mailSeq, t: Date.now(), from: m.from || "Capsule Corp.", title: m.title, body: m.body || "", rewards: m.rewards || {},
    claimed: false, read: false, exp: m.noExp ? 0 : Date.now() + MAIL_DAYS * DAY_MS, tag: m.tag || "" };
  s.inbox.unshift(mail);
  return mail;
}
function sendMail(m, quiet) { const mail = mailTo(S, m); if (!quiet) toast(`New mail: ${m.title}`, "gold"); return mail; }
const hasRewards = m => Object.keys(m.rewards).length > 0;
const unclaimedMail = () => (S.inbox || []).filter(m => !m.claimed && hasRewards(m));
const unreadMail = () => (S.inbox || []).filter(m => !m.read || (!m.claimed && hasRewards(m)));
function purgeMail() {
  const now = Date.now();
  S.inbox = (S.inbox || []).filter(m => !(m.exp && now > m.exp) && !(m.claimed && now - m.t > MAIL_DAYS * DAY_MS)).slice(0, 120);
}
function claimMail(m) {
  if (!m || m.claimed || !hasRewards(m)) { if (m) m.read = true; return []; }
  m.claimed = true; m.read = true;
  return give(m.rewards);
}
// every new account (and older saves, once) starts with a free ×10 and a guaranteed random 5★
function welcomeMail(s) {
  mailTo(s, { from: "Bulma", tag: "welcome", noExp: 1, title: "Welcome to the Z Fighters",
    body: "Hi! Bulma here, from Capsule Corp. Goku says you want to train with the Z Fighters, so here's a starter pack: ten free Summons and a wish from Shenron, which always brings a 5★ fighter. Use them on the Summon screen. And try not to get yourself killed, okay?",
    rewards: { free10: 1, gold5: 1 } });
  s.welcome = 1;
}
// daily login gift, a 7-day cycle
const LOGIN_GIFTS = [{ orundum: 100 }, { lmd: 8000 }, { rec2: 4 }, { orundum: 150 }, { summ: 3 }, { chip: 2 }, { permit: 2 }];
function dailyLogin() {
  if (S.lastLogin === today()) return;
  S.lastLogin = today(); S.stats.loginDays++;
  const n = S.stats.loginDays, day = (n - 1) % 7;
  sendMail({ from: "Kame House", tag: "login", title: `Daily Training · Day ${n}`,
    body: `Back for more training? Your login gift for day ${day + 1} of 7${day === 6 ? ", the big one" : ""}. Master Roshi says: work hard, study hard, eat hard, play hard.`, rewards: LOGIN_GIFTS[day] });
}
// letters from friends
const GIFTS = [
  { from: "Goku", title: "Hey!", body: "Chi-Chi made way too much food, so I'm sending you training stuff instead. Wait, I ate the food. Anyway, enjoy!", rewards: { rec2: 3, lmd: 3000 } },
  { from: "Bulma", title: "Capsule Corp. care package", body: "Dad's newest capsules. One of them is a fridge. You're welcome.", rewards: { orundum: 50, credit: 60 } },
  { from: "Master Roshi", title: "Turtle School homework", body: "The Turtle School way: work hard, study hard. Here's some study material. The good kind.", rewards: { summ: 2, lmd: 2000 } },
  { from: "Korin", title: "From the top of the tower", body: "Yajirobe ate most of this batch. Here's what's left.", rewards: { prime: 1, credit: 40 } },
  { from: "Mr. Satan's fan club", title: "Tournament prize money", body: "Congratulations on your matches! (We have no idea who you are, but the cheque cleared.)", rewards: { lmd: 6000 } },
  { from: "Krillin", title: "From Kame House", body: "Roshi's been watching 'workout tapes' again. I'm sending you stuff to get out of the house.", rewards: { orundum: 80, rec1: 5 } },
  { from: "Piccolo", title: "Train.", body: "(Weighted clothing, folded neatly. No note, except the word 'Train.')", rewards: { rec3: 2 } },
  { from: "Chi-Chi", title: "Study first!", body: "Here's a care package. Now go study, and THEN fight. That goes for Gohan's friends too!", rewards: { chip: 1, lmd: 2000 } },
  { from: "Vegeta", title: "...", body: "(A plain envelope with the Saiyan royal crest. Inside: something useful, and no note.)", rewards: { orundum: 60 } },
  { from: "Dr. Brief", title: "Lab samples", body: "Prototype gravity gear. Let me know how it holds up. Don't go past 100×, please.", rewards: { credit: 100 } },
  { from: "King Kai", title: "Heard this one?", body: "Why did the Saiyan bring a ladder to the fight? To reach a higher power level! ...Hello? Here, take a Summon Ticket.", rewards: { permit: 1 } },
  { from: "Gohan", title: "Found these on Namek", body: "Dende helped me look. Mom doesn't know I kept them.", rewards: { orundum: 100 } },
];
function castGift() {
  if (Date.now() - S.lastGift < GIFT_MS || S.inbox.some(m => m.tag === "gift" && !m.claimed)) return;
  S.lastGift = Date.now();
  sendMail({ ...pick(GIFTS), tag: "gift" });
}
// a gift every five player ranks
function rankGifts() {
  while (S.lvlGift + 5 <= S.lvl) {
    S.lvlGift += 5;
    const L = S.lvlGift;
    sendMail({ from: "King Kai", tag: "rank", title: `Rank ${L}`, body: `You reached Rank ${L}. Even all the way out here on my planet, I can feel your ki growing.`,
      rewards: L % 10 === 0 ? { orundum: 100 + L * 4, permit: 1 } : { orundum: 100 + L * 4 } });
  }
}

// Mystery Gift: once the Saiyan Saga is over, Bardock turns up in the Mailbox (he never comes from a Summon)
function mysteryGift() {
  const ch = STORY[0].chapters.find(c => c.id === "c6");
  if (S.mysterySent || !ch || !chapterCleared(ch)) return;
  S.mysterySent = 1;
  sendMail({ from: "Mystery Gift", tag: "mystery", noExp: 1, title: "Mystery Gift: Bardock",
    body: "A vision from long ago: a low-class Saiyan who saw Frieza coming and fought him alone, the day Planet Vegeta died. His son was sent to Earth as a baby. Bardock has joined your fighters.",
    rewards: { op: MYSTERY_OP } });
}

// ---------- achievements ----------
// Each achievement has tiers [goal, reward]; finishing a tier sends its reward to the Inbox.
const tier = (goal, reward) => [goal, reward];
const ownedKeys = () => Object.keys(S.ops);
const ACH_CATS = ["Story", "Collection", "Growth", "Battle", "Summons", "Login"];
const SAIYANS = ["goku", "gohan", "vegeta", "raditz", "nappa", "bardock"];
const ACH = [
  ...STORY[0].chapters.map((c, i) => ({ id: "ch" + (i + 1), cat: "Story", n: `Chapter ${c.no}: ${c.title}`, d: () => `Clear Chapter ${c.no} (${c.season})`,
    v: () => chapterCleared(c) ? 1 : 0, tiers: [tier(1, i === STORY[0].chapters.length - 1 ? { orundum: 800, permit: 5 } : [5, 9].includes(i) ? { orundum: 600, permit: 3 } : { orundum: 300 })] })),
  { id: "stages", cat: "Story", n: "Saga Runner", d: g => `Clear ${g} story stages`, v: () => Object.keys(S.story).filter(k => NODES[k] && S.story[k] > 0).length,
    tiers: [tier(5, { orundum: 100 }), tier(20, { orundum: 200 }), tier(50, { orundum: 400, permit: 1 }), tier(Object.keys(NODES).length, { orundum: 800, permit: 2 })] },
  { id: "stars", cat: "Story", n: "Flawless Victory", d: g => `Earn 3 stars on ${g} stages`, v: () => Object.keys(S.story).filter(k => NODES[k] && (NODES[k].waves || NODES[k].type === "event") && S.story[k] >= 3).length,
    tiers: [tier(5, { orundum: 100 }), tier(20, { orundum: 250 }), tier(50, { orundum: 500, permit: 2 })] },
  { id: "games", cat: "Story", n: "Snake Way Survivor", d: g => `Clear all ${g} minigames with 3 stars`, v: () => Object.values(NODES).filter(n => n.type === "event" && nodeStars(n.id) >= 3).length,
    tiers: [tier(Object.values(NODES).filter(n => n.type === "event").length, { orundum: 500, permit: 2 })] },
  { id: "owned", cat: "Collection", n: "Collector", d: g => `Collect ${g} fighters`, v: () => ownedKeys().length,
    tiers: [tier(10, { orundum: 150 }), tier(20, { orundum: 300 }), tier(30, { orundum: 500, permit: 1 }), tier(OP_KEYS.length, { orundum: 3000, permit: 10 })] },
  { id: "sacred", cat: "Collection", n: "Pride of the Saiyans", d: () => "Own a form of every Saiyan: Goku, Gohan, Vegeta, Raditz, Nappa and Bardock",
    v: () => SAIYANS.every(b => variantsOf(b).some(owned)) ? 1 : 0, tiers: [tier(1, { orundum: 300, permit: 1 })] },
  { id: "evo", cat: "Collection", n: "Every Form", d: g => `Own every form of ${g} character${g > 1 ? "s" : ""}`,
    v: () => CHARS.filter(c => c.vers.length > 1 && variantsOf(c.k).every(owned)).length,
    tiers: [tier(1, { orundum: 300, permit: 1 }), tier(3, { orundum: 600, permit: 2 }), tier(CHARS.filter(c => c.vers.length > 1).length, { orundum: 1000, permit: 3 })] },
  { id: "teams", cat: "Collection", n: "Across the Universe", d: g => `Own a fighter from ${g} factions`, v: () => new Set(ownedKeys().map(k => OPS[k].squad)).size,
    tiers: [tier(3, { orundum: 200 }), tier(TEAMS.length, { orundum: 800, permit: 2 })] },
  { id: "fives", cat: "Collection", n: "Legendary Warriors", d: g => `Own ${g} 5★ fighter${g > 1 ? "s" : ""}`, v: () => ownedKeys().filter(k => OPS[k].rar === 5).length,
    tiers: [tier(1, { orundum: 200 }), tier(5, { orundum: 400, permit: 1 }), tier(10, { orundum: 800, permit: 2 }), tier(OP_KEYS.filter(k => OPS[k].rar === 5).length, { orundum: 1500, permit: 4 })] },
  { id: "asc1", cat: "Growth", n: "Zenkai", d: g => `Awaken ${g} fighter${g > 1 ? "s" : ""} at least once`, v: () => Object.values(S.ops).filter(p => p.elite >= 1).length,
    tiers: [tier(1, { orundum: 150 }), tier(5, { orundum: 300, chip: 2 }), tier(20, { orundum: 600, permit: 1 })] },
  { id: "asc2", cat: "Growth", n: "Full Power", d: g => `Fully awaken ${g} fighter${g > 1 ? "s" : ""}`, v: () => Object.values(S.ops).filter(p => p.elite >= 2).length,
    tiers: [tier(1, { orundum: 400, permit: 1 }), tier(5, { orundum: 800, permit: 2 }), tier(15, { orundum: 1500, permit: 3 })] },
  { id: "rankex", cat: "Growth", n: "Technique Master", d: g => `Raise ${g} technique${g > 1 ? "s" : ""} to level MAX`, v: () => Object.values(S.ops).reduce((a, p) => a + p.sk.filter(r => r >= 7).length, 0),
    tiers: [tier(1, { orundum: 200, summ: 3 }), tier(5, { orundum: 400, summ: 6 }), tier(20, { orundum: 800, permit: 2 })] },
  { id: "origin", cat: "Growth", n: "Limit Breaker", d: g => `Max the Limit Break of ${g} fighter${g > 1 ? "s" : ""}`, v: () => Object.values(S.ops).filter(p => p.pot >= 6).length,
    tiers: [tier(1, { orundum: 500, permit: 1 }), tier(3, { orundum: 1000, permit: 3 })] },
  { id: "codes", cat: "Growth", n: "Diligent Student", d: g => `Study ${g} Scrolls`, v: () => S.stats.codeUps,
    tiers: [tier(10, { lmd: 10000 }), tier(50, { lmd: 30000, orundum: 200 }), tier(150, { orundum: 600, permit: 2 })] },
  { id: "code15", cat: "Growth", n: "Martial Arts Master", d: g => `Raise ${g} Proficienc${g > 1 ? "ies" : "y"} to level ${PROF_MAX}`, v: () => Object.values(S.ops).reduce((a, p) => { const l = profLevels(p); return a + [l.m, l.k, l.g].filter(x => x >= PROF_MAX).length; }, 0),
    tiers: [tier(1, { orundum: 200 }), tier(5, { orundum: 500, permit: 1 }), tier(15, { orundum: 1000, permit: 2 })] },
  { id: "plv", cat: "Growth", n: "Power Level", d: g => `Reach Rank ${g}`, v: () => S.lvl,
    tiers: [tier(10, { orundum: 200 }), tier(20, { orundum: 400, permit: 1 }), tier(40, { orundum: 800, permit: 2 }), tier(60, { orundum: 1200, permit: 3 }), tier(100, { orundum: 2000, permit: 5 })] },
  { id: "wins", cat: "Battle", n: "Z Fighter", d: g => `Win ${g} battles`, v: () => S.stats.wins,
    tiers: [tier(10, { orundum: 100 }), tier(50, { orundum: 300 }), tier(200, { orundum: 600, permit: 1 }), tier(1000, { orundum: 1500, permit: 3 })] },
  { id: "arcs", cat: "Battle", n: "Kamehameha!", d: g => `Use ${g} special techniques`, v: () => S.stats.arcs,
    tiers: [tier(10, { orundum: 100 }), tier(100, { orundum: 300 }), tier(500, { orundum: 600, permit: 1 }), tier(2000, { orundum: 1200, permit: 2 })] },
  { id: "perfects", cat: "Battle", n: "Perfect Guard", d: g => `Make ${g} perfect guards`, v: () => S.stats.perfects || 0,
    tiers: [tier(10, { orundum: 100 }), tier(100, { orundum: 300 }), tier(500, { orundum: 600, permit: 1 })] },
  { id: "struggles", cat: "Battle", n: "Beam Struggle", d: g => `Fight ${g} beam struggle${g > 1 ? "s" : ""}`, v: () => S.stats.struggles || 0,
    tiers: [tier(1, { orundum: 100 }), tier(10, { orundum: 300 }), tier(50, { orundum: 600, permit: 1 })] },
  { id: "kills", cat: "Battle", n: "Knockout", d: g => `Knock out ${g} enemies`, v: () => S.stats.kills,
    tiers: [tier(100, { orundum: 100 }), tier(1000, { orundum: 300 }), tier(5000, { orundum: 800, permit: 1 }), tier(15000, { orundum: 1500, permit: 3 })] },
  { id: "flawless", cat: "Battle", n: "Untouchable", d: g => `Win ${g} battles without a fighter knocked out`, v: () => S.stats.flawless,
    tiers: [tier(10, { orundum: 150 }), tier(50, { orundum: 400 }), tier(200, { orundum: 800, permit: 2 })] },
  { id: "arcade", cat: "Battle", n: "Tournament Champion", d: g => `Win match ${g} of the World Martial Arts Tournament`, v: () => S.tower,
    tiers: [tier(5, { orundum: 150 }), tier(10, { orundum: 300, permit: 1 }), tier(20, { orundum: 500, permit: 2 }), tier(30, { orundum: 1000, permit: 3 })] },
  { id: "versus", cat: "Battle", n: "Scouter Ranked", d: g => `Win ${g} Scouter Rankings battles`, v: () => S.stats.versus,
    tiers: [tier(5, { tokens: 100 }), tier(25, { tokens: 300, orundum: 200 }), tier(100, { tokens: 600, permit: 2 })] },
  { id: "patrol", cat: "Battle", n: "Field Training", d: g => `Win ${g} Training Grounds battles or field encounters`, v: () => S.stats.patrols,
    tiers: [tier(10, { lmd: 10000 }), tier(50, { orundum: 300, chip: 3 }), tier(200, { orundum: 600, chip: 6 })] },
  { id: "pulls", cat: "Summons", n: "Dragon Ball Hunter", d: g => `Summon ${g} times`, v: () => S.gacha.total,
    tiers: [tier(10, { orundum: 100 }), tier(50, { orundum: 300, permit: 1 }), tier(100, { orundum: 500, permit: 2 }), tier(300, { orundum: 1000, permit: 3 }), tier(1000, { orundum: 2000, permit: 5 })] },
  { id: "luck", cat: "Summons", n: "Shenron's Favour", d: g => `Summon ${g} 5★ fighter${g > 1 ? "s" : ""}`, v: () => S.stats.fives,
    tiers: [tier(1, { orundum: 150 }), tier(5, { orundum: 400, permit: 1 }), tier(20, { orundum: 1000, permit: 3 })] },
  { id: "login", cat: "Login", n: "Daily Training", d: g => `Log in on ${g} days`, v: () => S.stats.loginDays,
    tiers: [tier(3, { orundum: 100 }), tier(7, { orundum: 300, permit: 1 }), tier(30, { orundum: 800, permit: 2 }), tier(100, { orundum: 1500, permit: 5 }), tier(365, { orundum: 3000, permit: 10 })] },
];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];
const achTierName = (a, i) => a.tiers.length > 1 ? `${a.n} ${ROMAN[i + 1]}` : a.n;
const achDone = () => ACH.reduce((n, a) => n + (S.achv[a.id] || 0), 0);
const achTotal = ACH.reduce((n, a) => n + a.tiers.length, 0);
function checkAchievements(silent) {
  const got = [];
  for (const a of ACH) {
    let i = S.achv[a.id] || 0;
    const v = a.v();
    while (i < a.tiers.length && v >= a.tiers[i][0]) {
      if (!silent) mailTo(S, { from: "Z Records", tag: "ach", title: `Record: ${achTierName(a, i)}`, body: `${a.d(a.tiers[i][0])}. Your reward is attached.`, rewards: a.tiers[i][1] });
      got.push(achTierName(a, i)); i++;
    }
    S.achv[a.id] = i;
  }
  if (got.length && !silent) { toast(`Z Record: ${got[0]}${got.length > 1 ? ` (+${got.length - 1} more)` : ""}. Reward sent to your Mailbox.`, "gold"); sfx("heal"); }
  return got;
}
// battle statistics (called by the battle director when a fight ends): records, and the Proficiency the fight taught
function recordBattle(res, B) {
  if (DEMO.on) DEMO.result = res;
  S.stats.arcs += B.tally.specials; S.stats.kills += B.tally.kills;
  S.stats.perfects = (S.stats.perfects || 0) + B.tally.perfects; S.stats.struggles = (S.stats.struggles || 0) + B.tally.struggles;
  if (res.win && !res.lost) S.stats.flawless++;
  B.profNote = [];
  for (const u of B.side.A.units) if (u.isOp && S.ops[u.key] && B.prof[u.key]) { const before = profLevels(S.ops[u.key]), n = gainProf(u.key, B.prof[u.key]);
    if (n > 0) { const after = profLevels(S.ops[u.key]); for (const w of ["m", "k", "g"]) if (after[w] > before[w]) B.profNote.push(`${OPS[u.key].n} ${PROF_N[w]} Lv ${after[w]}`); } }
}
// everything the meta layer does on its own: expire mail, login gift, rank gifts, letters, achievements
function metaTick() {
  if (!UI.inGame || BT.on) return;
  purgeMail(); dailyLogin(); rankGifts(); castGift(); mysteryGift(); checkAchievements();
}

// ---------- screens: inbox ----------
const mailIcon = m => ({ welcome: IC.gift, gift: IC.gift, mystery: IC.gift.replace("<svg", '<svg style="color:var(--gold)"'), login: IC.cert, ach: IC.trophy.replace("<svg", '<svg style="color:var(--gold)"'), rank: IC.star }[m.tag] || IC.mail);
const ago = t => { const d = Math.floor((Date.now() - t) / DAY_MS); return d < 1 ? "Today" : d === 1 ? "Yesterday" : d + " days ago"; };
const rewardChips = r => Object.entries(r).map(([k, n]) => `<span class="cost">${itemIcon(k)}${fmt(n)}</span>`).join(" ");
SCREENS.inbox = () => {
  purgeMail();
  const list = S.inbox, open = unclaimedMail().length;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Mailbox</span></div>
    <div class="spread"><h2>Mailbox</h2><button class="btn sm" data-act="claimAllMail" ${open ? "" : "disabled"}>Claim all${open ? ` · ${open}` : ""}</button></div>
    <p class="small dim">Gifts, login rewards and Z Record rewards arrive here. Gifts expire after ${MAIL_DAYS} days.</p>
    ${list.length ? list.map(m => `<button class="mailrow ${m.read && (m.claimed || !hasRewards(m)) ? "done" : ""}" data-act="openMail" data-id="${m.id}">
      <span class="mi">${mailIcon(m)}</span>
      <span class="mt"><b>${esc(m.title)}</b><span class="tiny dim">${esc(m.from)} · ${ago(m.t)}${m.exp && !m.claimed ? ` · expires in ${Math.max(1, Math.ceil((m.exp - Date.now()) / DAY_MS))}d` : ""}</span>
        ${hasRewards(m) ? `<span class="row tiny" style="gap:6px">${rewardChips(m.rewards)}</span>` : ""}</span>
      <span class="ms">${m.claimed ? IC.check : hasRewards(m) ? '<i class="dot" style="position:static"></i>' : !m.read ? '<i class="dot" style="position:static"></i>' : ""}</span>
    </button>`).join("") : '<p class="small dim">No mail. Go battle!</p>'}
    ${list.some(m => m.claimed || (m.read && !hasRewards(m))) ? `<button class="btn ghost wide" data-act="clearMail">Delete read and claimed mail</button>` : ""}
  </div>`;
};
function mailModal(m) {
  m.read = true;
  openModal(`<div class="stack"><div class="row" style="gap:10px"><span class="mi">${mailIcon(m)}</span><div><div class="eyebrow">${esc(m.from)} · ${ago(m.t)}</div><h2 style="font-size:20px">${esc(m.title)}</h2></div></div>
    <p class="small" style="line-height:1.5">${esc(m.body)}</p>
    ${hasRewards(m) ? `<div class="rewards">${rewardsHTML(Object.entries(m.rewards).map(([k, n]) => ({ k, n })))}</div>` : ""}
    ${hasRewards(m) && !m.claimed ? `<button class="btn wide" data-act="claimMail" data-id="${m.id}">Claim</button>` : `<button class="btn ghost wide" data-act="closeMail">${m.claimed ? "Claimed" : "Close"}</button>`}
  </div>`);
  save();
}

// ---------- screens: achievements ----------
SCREENS.ach = () => {
  checkAchievements();
  S.achSeen = achDone();
  const cat = UI.achCat || "All", list = ACH.filter(a => cat === "All" || a.cat === cat);
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Z Records</span></div>
    <h2>Z Records</h2>
    <section class="panel stack" style="gap:6px"><div class="spread small"><span>Completed</span><b class="num">${achDone()} / ${achTotal}</b></div>
      <div class="bar"><i style="width:${achDone() / achTotal * 100}%"></i></div><p class="tiny dim">Each record you set sends its reward to your Mailbox.</p></section>
    <div class="filters">${["All", ...ACH_CATS].map(c => `<button class="chip ${cat === c ? "on" : ""}" data-act="achCat" data-c="${c}">${c}</button>`).join("")}</div>
    ${list.map(a => {
      const i = S.achv[a.id] || 0, full = i >= a.tiers.length, t = a.tiers[Math.min(i, a.tiers.length - 1)], v = a.v();
      return `<div class="achrow ${full ? "full" : ""}"><span class="ai">${IC.trophy}</span>
        <div class="stack" style="gap:4px;min-width:0;flex:1"><div class="spread"><b class="small">${esc(achTierName(a, Math.min(i, a.tiers.length - 1)))}</b>
          <span class="pipsA">${a.tiers.map((_, k) => `<i class="${k < i ? "on" : ""}"></i>`).join("")}</span></div>
          <span class="tiny dim">${esc(a.d(t[0]))}</span>
          ${full ? `<span class="tiny gold">Complete</span>` : `<div class="bar"><i style="width:${Math.min(100, v / t[0] * 100)}%"></i></div>
          <div class="spread tiny"><span class="num">${fmt(Math.min(v, t[0]))} / ${fmt(t[0])}</span><span class="row" style="gap:6px">${rewardChips(t[1])}</span></div>`}
        </div></div>`;
    }).join("")}
  </div>`;
};

// ---------- screens: Scouter Card + settings ----------
// a Dragon Ball for every chapter cleared (seven per saga… the story has twelve, so the balls repeat 1–7)
function trophySVG(ch, on) { return on ? dballSVG(((ch.no - 1) % 7) + 1, 40) : `<svg viewBox="0 0 24 24" width="40" height="40"><circle cx="12" cy="12" r="10.5" fill="#1e2432" stroke="#2e3548"/></svg>`; }
const trophies = () => STORY[0].chapters.filter(chapterCleared).length;
// the title on your Scouter Card, from the chapters you've cleared
const bladerTitle = n => n >= 12 ? "Legendary Super Saiyan" : n >= 10 ? "Namek Survivor" : n >= 6 ? "Z Fighter" : n >= 2 ? "Turtle School Disciple" : "Martial Arts Rookie";
const chipRow = (act, cur, opts) => `<div class="filters">${opts.map(([v, n]) => `<button class="chip ${String(cur) === String(v) ? "on" : ""}" data-act="${act}" data-v="${v}">${n}</button>`).join("")}</div>`;
SCREENS.settings = () => {
  const st = S.settings;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Scouter Card</span></div>
    <section class="panel tcard">
      <div class="spread" style="align-items:flex-start"><div style="min-width:0"><div class="eyebrow">Scouter reading · ID No. ${S.playerId.replace(/(\d{3})(?=\d)/g, "$1 ")}</div><h2 style="margin-top:4px">${esc(S.name)}</h2>
        <div class="small gold">${bladerTitle(trophies())}</div></div><img class="tlook" src="${lookArt(myLook())}" alt=""></div>
      <div class="statgrid small" style="margin-top:6px">
        <div><span>Battle Power</span><b>${fmtFull(topTeam(TEAM_SIZE).reduce((a, k) => a + power(k, S.ops[k]), 0))}</b></div><div><span>Fighters</span><b>${Object.keys(S.ops).length} / ${OP_KEYS.length}</b></div>
        <div><span>Rank</span><b>${S.lvl}</b></div><div><span>Started</span><b>${new Date(S.created).toLocaleDateString()}</b></div>
        <div><span>Battles won</span><b>${fmtFull(S.stats.wins)}</b></div><div><span>Z Records</span><b>${achDone()}/${achTotal}</b></div>
        <div><span>Scouter ranking</span><b>#${fmtFull(S.arena.rank)}</b></div><div><span>Zeni</span><b>${fmtFull(S.lmd)}</b></div>
      </div>
      <div class="trophies">${STORY[0].chapters.map(ch => `<span class="tro ${chapterCleared(ch) ? "on" : ""}" title="${esc(ch.title)}">${trophySVG(ch, chapterCleared(ch))}</span>`).join("")}</div>
      <p class="tiny dim" style="margin-top:4px">A Dragon Ball for every chapter of the Story you clear: ${trophies()} of ${STORY[0].chapters.length}.</p>
    </section>
    <section class="panel stack" style="gap:8px"><div class="spread"><h3>Completion</h3><b class="num gold" style="font-size:22px">${completionPct()}%</b></div>
      ${completionParts().map(x => `<div class="cmprow"><div class="spread small"><span>${esc(x.n)}</span><span class="num dim">${x.label || `${fmtFull(x.v)} / ${fmtFull(x.max)}`}</span></div><div class="bar"><i style="width:${Math.min(100, x.v / x.max * 100)}%"></i></div></div>`).join("")}
      ${DEMO.on ? "" : `<button class="btn ghost wide" data-act="demoAsk">Watch the demo: the whole game played to 100%</button>`}</section>
    <section class="panel stack" style="gap:10px"><h3>Profile</h3>
      <label class="small dim" for="pname">Name</label>
      <div class="row" style="gap:8px"><input id="pname" class="tinput" maxlength="16" value="${esc(S.name)}"><button class="btn sm" data-act="saveName">Save</button></div>
      <span class="small dim">Look</span><div class="avgrid">${LOOKS.map(k => `<button class="${myLook() === k ? "on" : ""}" data-act="setLook" data-v="${k}"><img src="${lookHead(k)}" alt=""><span>${esc(lookName(k))}</span></button>`).join("")}</div></section>
    <section class="panel stack" style="gap:10px"><h3>Sound</h3>
      ${chipRow("setSound", st.sound ? 1 : 0, [[1, "On"], [0, "Off"]])}</section>
    <section class="panel stack" style="gap:10px"><h3>Battle</h3>
      <span class="small dim">Battle speed</span>${chipRow("setSpeed", st.speed, [[1, "1×"], [2, "1.5×"], [3, "2×"]])}
      <span class="small dim">Start battles on auto</span>${chipRow("setAuto", st.auto ? 1 : 0, [[1, "On"], [0, "Off"]])}
      <span class="small dim">GO automatically once three commands are picked</span>${chipRow("setAutoGo", st.autoGo ? 1 : 0, [[1, "On"], [0, "Off"]])}
      <span class="small dim">Auto-battle tactics</span>${chipRow("setAi", st.ai, [["balanced", "Balanced"], ["aggressive", "Aggressive"], ["safe", "Defensive"]])}</section>
    <section class="panel stack" style="gap:10px"><h3>Account</h3>
      <p class="tiny dim">Progress saves in this browser only.</p>
      <button class="btn ghost wide" data-act="toTitle">Return to title screen</button>
      <button class="btn red wide" data-act="askReset">Reset account</button></section>
    <p class="tiny dim" style="text-align:center">Dragon Ball Z: Legend of the Z Fighters · Ver ${GAME_VER}<br>An unofficial, non-commercial fan game. Dragon Ball belongs to Akira Toriyama, Bird Studio, Shueisha, Toei Animation and Bandai Namco; all art here is drawn by the game itself.</p>
  </div>`;
};
function resetModal() {
  openModal(`<div class="stack"><div class="eyebrow ds">Danger</div><h2>Reset account?</h2>
    <p class="small dim">This deletes everything in this browser: your fighters, story progress, currencies, mail and Z Records. You will start again from the title screen with a new account. This cannot be undone.</p>
    <label class="small" for="rconf">Type <b>RESET</b> to confirm</label>
    <input id="rconf" class="tinput" autocomplete="off" autocapitalize="characters" placeholder="RESET">
    <div class="row" style="gap:10px"><button class="btn ghost" style="flex:1" data-act="closeModal">Cancel</button><button class="btn red" style="flex:1" data-act="doReset">Reset</button></div></div>`);
}
function nameModal() {
  openModal(`<div class="stack" style="text-align:center;align-items:center"><div class="eyebrow">New account</div><h2>What's your fighter name?</h2>
    <div class="avpick">${Object.keys(ROOKIE_LOOKS).map(k => `<button class="${myLook() === k ? "on" : ""}" data-act="pickLook" data-v="${k}"><img src="${lookHead(k)}" alt=""><span>${ROOKIE_LOOKS[k].n}</span></button>`).join("")}</div>
    <input id="nname" class="tinput" maxlength="16" placeholder="Fighter" style="text-align:center;width:100%">
    <p class="tiny dim">You can change your name, and pick from ${LOOKS.length} looks, later on your Scouter Card.</p>
    <button class="btn wide" data-act="nameGo">Confirm</button></div>`);
  m0Click();
}
// a modal opened from a tap must not close on the same tap
function m0Click() { const m = $("#modal"); m.onclick = null; setTimeout(() => { m.onclick = e => { if (e.target === m && !$("#nname")) closeModal(); }; }, 0); }

// ---------- title screen ----------
// A typical gacha login screen: key art (drawn live), logo, a load bar, "Tap to start", version and player ID.
// The key art: Goku and Frieza over Namek, beams locked in a struggle, a Dragon Ball rising behind the logo.
const TITLE = { on: false, raf: 0, t0: 0, stars: [], sparks: [] };
function showTitle() {
  closeModal();
  let el = $("#title");
  if (!el) { el = document.createElement("div"); el.id = "title"; document.body.appendChild(el); }
  el.innerHTML = `<canvas id="tcv"></canvas>
    <div class="tlogo"><div class="tpre">Unofficial fan game</div><h1>DRAGON BALL Z</h1><div class="tsub">LEGEND OF THE Z FIGHTERS</div></div>
    <div class="tload" id="tload"><div class="tbar"><i id="tbarI"></i></div><span id="tloadT">Gathering the Dragon Balls… 0%</span></div>
    <div class="ttap" id="ttap" hidden>Tap to Start</div>
    <div class="tfoot"><button class="tbtn" data-act="demoAsk">${IC.dball}<span>Demo</span></button><button class="tbtn" data-act="titleSettings">${IC.gearIc}<span>Settings</span></button><button class="tbtn" data-act="titleCredits">${IC.book}<span>Credits</span></button></div>
    <div class="tver">Ver ${GAME_VER} · ${S.named ? "ID " + S.playerId.replace(/(\d{3})(?=\d)/g, "$1 ") : "New account"}<br>Unofficial fan game. Dragon Ball © Bird Studio / Shueisha / Toei Animation.</div>`;
  el.hidden = false; el.classList.remove("out");
  UI.inGame = false; TITLE.on = true; TITLE.t0 = performance.now();
  const rng = seeded(7);
  TITLE.stars = Array.from({ length: 70 }, () => ({ x: rng(), y: rng() * .55, r: .4 + rng() * 1.2, p: rng() * 7 }));
  TITLE.sparks = [];
  el.onclick = e => { if (e.target.closest("[data-act]")) return; if ($("#ttap") && !$("#ttap").hidden) titleStart(); };
  cancelAnimationFrame(TITLE.raf); titleLoop();
}
function titleLoop() {
  const cv = $("#tcv"); if (!TITLE.on || !cv) return;
  TITLE.raf = requestAnimationFrame(titleLoop);
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t = (performance.now() - TITLE.t0) / 1000;
  const p = Math.min(1, t / 1.4), lt = $("#tloadT");
  if (lt) { $("#tbarI").style.width = p * 100 + "%"; lt.textContent = p < 1 ? `Gathering the Dragon Balls… ${Math.floor(p * 100)}%` : "Ready"; if (p >= 1 && $("#ttap").hidden) { $("#ttap").hidden = false; $("#tload").classList.add("done"); } }
  // a dying Namek: green-black sky turning red at the horizon
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#03060a"); sky.addColorStop(.5, "#0a2a22"); sky.addColorStop(.82, "#5a1a10"); sky.addColorStop(1, "#c8401a");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (const s of TITLE.stars) { g.globalAlpha = .3 + .3 * Math.sin(t * 1.6 + s.p); g.fillStyle = "#e8f0ff"; g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // the four-star ball rising behind the logo
  const bR = Math.min(W, H) * .2; drawDragonBall(g, W / 2, H * .3 + Math.sin(t) * 4, bR, 4, .8);
  // spires and lava on the horizon
  g.fillStyle = "#1a0806"; for (let k = 0; k < 14; k++) { const x = k / 13 * W, h = H * (.08 + ((k * 37) % 10) / 60); g.beginPath(); g.moveTo(x - 30, H); g.lineTo(x, H - h - H * .1); g.lineTo(x + 30, H); g.fill(); }
  g.fillStyle = "#ff6a1a"; g.globalAlpha = .7; g.fillRect(0, H * .96, W, H * .04); g.globalAlpha = 1;
  // Goku and Frieza with a beam struggle between them
  const fy = H * .78, fs = Math.min(W * .45, H * .28) / 110, gx = W * .16, fx = W * .84;
  const gk = OPS["goku-ssj"].fig, fz = OPS["frieza-4"].fig;
  const push = Math.sin(t * 1.3) * .08, mid = W / 2 + push * W;
  const hy = fy - 58 * fs;
  beamLine(g, gx + 40 * fs, hy, mid, hy, 16 * fs, "#7ad0ff");
  beamLine(g, fx - 40 * fs, hy, mid, hy, 16 * fs, "#ff5ad8");
  glowBall(g, mid, hy, (26 + Math.sin(t * 20) * 3) * fs, "#ffffff", "#ffffff");
  if (Math.random() < .6) TITLE.sparks.push({ x: mid, y: hy, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, l: 1 });
  g.globalCompositeOperation = "lighter";
  for (const s2 of TITLE.sparks) { s2.x += s2.vx; s2.y += s2.vy; s2.l -= .03; g.globalAlpha = Math.max(0, s2.l); g.fillStyle = s2.l > .5 ? "#fff6c0" : "#ff9a3c"; g.fillRect(s2.x, s2.y, 2.5, 2.5); }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  TITLE.sparks = TITLE.sparks.filter(s2 => s2.l > 0);
  cardAura(g, gx, fy, figTall(gk) * fs, "#ffd34d");
  g.save(); g.translate(gx, fy); g.scale(fs, fs); drawFigure(g, gk, { name: "beam", t: 1, time: t, air: true }); g.restore();
  cardAura(g, fx, fy, figTall(fz) * fs, "#d8a8ff");
  g.save(); g.translate(fx, fy); g.scale(-fs, fs); drawFigure(g, fz, { name: "beam", t: 1, time: t + 1, air: true }); g.restore();
  const vig = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .8); vig.addColorStop(0, "#0000"); vig.addColorStop(1, "#000b");
  g.fillStyle = vig; g.fillRect(0, 0, W, H);
}
function hideTitle() {
  const el = $("#title"); if (!el) return;
  TITLE.on = false; cancelAnimationFrame(TITLE.raf);
  el.classList.add("out"); setTimeout(() => { el.hidden = true; el.innerHTML = ""; }, 450);
}
// leaving the title: new accounts pick a name, then the intro; everyone gets their login gift and mail
function titleStart() {
  sfx("special"); hideTitle();
  UI.inGame = true;
  route("home");
  if (!S.named) { nameModal(); return; }
  afterLogin();
}
function afterLogin() {
  metaTick(); renderTop();
  if (!S.seenIntro) introModal(); else if (UI.view === "home") rerender();
}

// ---------- free Summons ----------
async function manifestWith(results) { save(); renderTop(); await gachaReveal(results); checkAchievements(); rerender(); }

const META_ACT = {
  inbox: () => { closeModal(); route("inbox"); },
  openMail: d => { const m = S.inbox.find(x => x.id === +d.id); if (m) { mailModal(m); if (UI.view === "inbox") { const st = $("#view").scrollTop; $("#view").innerHTML = SCREENS.inbox(); $("#view").scrollTop = st; renderTop(); } } },
  closeMail: () => { closeModal(); if (UI.view === "inbox") rerender(); },
  claimMail: d => {
    const m = S.inbox.find(x => x.id === +d.id); const list = claimMail(m); if (!list.length) return;
    sfx("heal"); rerender(); rewardModal("Claimed", list, m.title);
  },
  claimAllMail: () => {
    let list = []; for (const m of unclaimedMail()) list = list.concat(claimMail(m));
    if (!list.length) return;
    sfx("win"); rerender(); rewardModal("Claimed all", list, "Mailbox");
  },
  clearMail: () => { S.inbox = S.inbox.filter(m => !(m.claimed || (m.read && !hasRewards(m)))); sfx("tap"); rerender(); },
  achCat: d => { UI.achCat = d.c; rerender(); },
  // settings
  setSound: d => { S.settings.sound = d.v === "1"; rerender(); },
  setSpeed: d => { S.settings.speed = +d.v; rerender(); },
  setAuto: d => { S.settings.auto = d.v === "1"; rerender(); },
  setAi: d => { S.settings.ai = d.v; rerender(); },
  setAutoGo: d => { S.settings.autoGo = d.v === "1"; rerender(); },
  setLook: d => { if (LOOKS.includes(d.v)) { S.look = d.v; sfx("tap"); rerender(); } },
  pickLook: d => { if (!ROOKIE_LOOKS[d.v]) return; S.look = d.v; sfx("tap"); $$(".avpick button").forEach(b => b.classList.toggle("on", b.dataset.v === d.v)); },
  saveName: () => { const v = ($("#pname") || {}).value; S.name = (v || "").trim().slice(0, 16) || "Fighter"; toast("Name saved."); rerender(); },
  askReset: () => resetModal(),
  doReset: () => {
    if ((($("#rconf") || {}).value || "").trim().toUpperCase() !== "RESET") { toast("Type RESET to confirm."); return; }
    clearTimeout(saveTimer);
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
    S = migrate(newSave()); save();
    UI.inGame = false; closeModal(); route("home"); showTitle();
  },
  toTitle: () => { save(); showTitle(); },
  // title screen
  titleSettings: () => { titleStart(); if (S.named) route("settings"); },
  titleCredits: () => {
    openModal(`<div class="stack" style="text-align:center"><h2>Credits</h2>
      <p class="small dim">Dragon Ball Z: Legend of the Z Fighters is an unofficial, non-commercial fan game that plays like Dragon Ball Z: Goku Gekitōden (Game Boy, 1995): side-scrolling fields, planned command turns, a power gauge, timed guards and a ki gauge.</p>
      <p class="small dim">Dragon Ball and its characters belong to Akira Toriyama, Bird Studio, Shueisha, Toei Animation and Bandai Namco. Names follow the English dub.</p>
      <p class="small dim">Every fighter, place and effect is drawn by the game itself; no official assets are used.</p>
      <button class="btn wide" data-act="closeModal">Close</button></div>`);
  },
  nameGo: () => {
    const v = (($("#nname") || {}).value || "").trim().slice(0, 16);
    S.name = v || "Fighter"; S.named = true; closeModal(); sfx("tap"); afterLogin();
  },
  // free Summons from the welcome mail
  pullFree10: async () => {
    if (!(S.inv.free10 > 0)) return;
    S.inv.free10--;
    await manifestWith(headhunt(10, !UI.hhStd));
  },
  pullGold5: async () => {
    if (!(S.inv.gold5 > 0)) return;
    S.inv.gold5--; S.daily.hh++;
    await manifestWith([pullOne(false, 5)]);
  },
};
