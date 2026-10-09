
// =====================================================================
//  META — Mailbox (gifts and Mystery Gifts), BBA Records (achievements), the Blader Card with settings, and the title screen
// =====================================================================
const GAME_VER = "1.0.0";
const MAIL_DAYS = 30;            // gifts expire after this many days; claimed mail is cleared after the same time
const GIFT_MS = 3 * 3600000;     // a letter from a Blader every few hours of real time
const DAY_MS = 864e5;

// ---------- inbox ----------
function mailTo(s, m) {
  s.inbox = s.inbox || [];
  const mail = { id: ++s.mailSeq, t: Date.now(), from: m.from || "BBA", title: m.title, body: m.body || "", rewards: m.rewards || {},
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
  mailTo(s, { from: "Mr. Dickenson", tag: "welcome", noExp: 1, title: "Welcome to the BBA",
    body: "Welcome, young Blader! The Beyblade Battle Association is delighted to have you. Inside are ten free Random Boosters and a Legendary Bit-Chip, which always holds a 5★ Beyblade. Open them at the Booster shop. Now, let it rip!",
    rewards: { free10: 1, gold5: 1 } });
  s.welcome = 1;
}
// daily login gift, a 7-day cycle
const LOGIN_GIFTS = [{ orundum: 100 }, { lmd: 8000 }, { rec2: 4 }, { orundum: 150 }, { summ: 3 }, { chip: 2 }, { permit: 2 }];
function dailyLogin() {
  if (S.lastLogin === today()) return;
  S.lastLogin = today(); S.stats.loginDays++;
  const n = S.stats.loginDays, day = (n - 1) % 7;
  sendMail({ from: "Max's dad's hobby shop", tag: "login", title: `Daily Practice · Day ${n}`,
    body: `Welcome back! Your login gift for day ${day + 1} of 7${day === 6 ? ", the big one" : ""}. The stadium out back is open again tomorrow.`, rewards: LOGIN_GIFTS[day] });
}
// letters from the Bladers
const GIFTS = [
  { from: "Kenny", title: "Spare parts", body: "I found these in my toolbox. Dizzi says I'm a hoarder. I say I'm prepared.", rewards: { rec2: 3, lmd: 3000 } },
  { from: "Dizzi", title: "Don't tell the Chief", body: "Psst. I moved some BeyPoints out of Kenny's budget. You didn't hear it from me.", rewards: { orundum: 50, credit: 60 } },
  { from: "Grandpa", title: "Training notes, dude", body: "Yo, homie! Kendo and Beyblade are the same, little dude: it's all in the wrist. Study these.", rewards: { summ: 2, lmd: 2000 } },
  { from: "Max", title: "From the hobby shop", body: "Dad let me raid the back room! Also there's a coupon in here. Also mustard. Sorry about the mustard.", rewards: { prime: 1, credit: 40 } },
  { from: "Mr. Dickenson", title: "BBA allowance", body: "A small grant from the Beyblade Battle Association. Spend it wisely, or at least on Beyblades.", rewards: { lmd: 6000 } },
  { from: "Tyson", title: "Hey, you!", body: "Grandpa made too many rice balls, so I'm sending you stuff instead. Wait, that doesn't make sense. Whatever, enjoy!", rewards: { orundum: 80, rec1: 5 } },
  { from: "Ray", title: "From the White Tiger village", body: "Lee and Mariah sent these for you. Train well.", rewards: { rec3: 2 } },
  { from: "Hilary", title: "Homework first!", body: "Here's a care package. Now go do your homework, and THEN Beyblade.", rewards: { chip: 1, lmd: 2000 } },
  { from: "Kai", title: "...", body: "(A plain envelope. Inside: something useful, and no note.)", rewards: { orundum: 60 } },
  { from: "Judy Tate", title: "PPB lab samples", body: "Prototype data from the PPB research center. Let me know how they perform.", rewards: { credit: 100 } },
  { from: "DJ Jazzman", title: "Bladers ready?", body: "A little something from the announcer's booth! Now get out there and let it rip!", rewards: { permit: 1 } },
  { from: "Daichi", title: "Found these on the mountain", body: "Don't ask where I got 'em. Can I have some of your lunch?", rewards: { orundum: 100 } },
];
function castGift() {
  if (Date.now() - S.lastGift < GIFT_MS || S.inbox.some(m => m.tag === "gift" && !m.claimed)) return;
  S.lastGift = Date.now();
  sendMail({ ...pick(GIFTS), tag: "gift" });
}
// a gift every five player levels
function rankGifts() {
  while (S.lvlGift + 5 <= S.lvl) {
    S.lvlGift += 5;
    const L = S.lvlGift;
    sendMail({ from: "BBA", tag: "rank", title: `Blader Rank ${L}`, body: `You reached Blader Rank ${L}. The BBA has noticed your skill.`,
      rewards: L % 10 === 0 ? { orundum: 100 + L * 4, permit: 1 } : { orundum: 100 + L * 4 } });
  }
}

// Mystery Gift: once the World Championship is won, Black Dranzer turns up in the Mailbox (it never comes out of a Booster)
function mysteryGift() {
  const ch = STORY[0].chapters.find(c => c.id === "c5");
  if (S.mysterySent || !ch || !chapterCleared(ch)) return;
  S.mysterySent = 1;
  sendMail({ from: "Mystery Gift", tag: "mystery", noExp: 1, title: "Mystery Gift: Black Dranzer",
    body: "A sealed case arrived with no return address, stamped with the crest of Balkov Abbey. Inside is Black Dranzer, the Beyblade Voltaire built to steal every Bit-Beast in the world. Kenny says it's safe now. Probably.",
    rewards: { op: MYSTERY_OP } });
}

// ---------- achievements ----------
// Each achievement has tiers [goal, reward]; finishing a tier sends its reward to the Inbox.
const tier = (goal, reward) => [goal, reward];
const ownedKeys = () => Object.keys(S.ops);
const ACH_CATS = ["Story", "Collection", "Growth", "Battle", "Boosters", "Login"];
const ACH = [
  ...STORY[0].chapters.map((c, i) => ({ id: "ch" + (i + 1), cat: "Story", n: `Chapter ${c.no}: ${c.title}`, d: () => `Clear Chapter ${c.no} (${c.season})`,
    v: () => chapterCleared(c) ? 1 : 0, tiers: [tier(1, i === STORY[0].chapters.length - 1 ? { orundum: 800, permit: 5 } : [4, 8].includes(i) ? { orundum: 600, permit: 3 } : { orundum: 300 })] })),
  { id: "stages", cat: "Story", n: "Tournament Run", d: g => `Clear ${g} story stages`, v: () => Object.keys(S.story).filter(k => NODES[k] && S.story[k] > 0).length,
    tiers: [tier(5, { orundum: 100 }), tier(20, { orundum: 200 }), tier(50, { orundum: 400, permit: 1 }), tier(91, { orundum: 800, permit: 2 })] },
  { id: "stars", cat: "Story", n: "Perfect Match", d: g => `Earn 3 stars on ${g} battles`, v: () => Object.keys(S.story).filter(k => NODES[k] && NODES[k].waves && S.story[k] >= 3).length,
    tiers: [tier(5, { orundum: 100 }), tier(20, { orundum: 250 }), tier(50, { orundum: 500, permit: 2 })] },
  { id: "owned", cat: "Collection", n: "Collector", d: g => `Collect ${g} Beyblades`, v: () => ownedKeys().length,
    tiers: [tier(10, { orundum: 150 }), tier(25, { orundum: 300 }), tier(50, { orundum: 500, permit: 1 }), tier(OP_KEYS.length, { orundum: 3000, permit: 10 })] },
  { id: "sacred", cat: "Collection", n: "The Four Sacred Bit-Beasts", d: () => "Own a Dragoon, a Dranzer, a Driger and a Draciel",
    v: () => ["tyson", "kai", "ray", "max"].every(b => variantsOf(b).some(owned)) ? 1 : 0, tiers: [tier(1, { orundum: 300, permit: 1 })] },
  { id: "evo", cat: "Collection", n: "Every Generation", d: g => `Own every Beyblade of ${g} Blader${g > 1 ? "s" : ""}`,
    v: () => BLADERS.filter(c => c.beys.length > 1 && variantsOf(c.k).every(owned)).length,
    tiers: [tier(1, { orundum: 300, permit: 1 }), tier(3, { orundum: 600, permit: 2 }), tier(8, { orundum: 1000, permit: 3 })] },
  { id: "teams", cat: "Collection", n: "World Tour", d: g => `Own a Beyblade from ${g} different teams`, v: () => new Set(ownedKeys().map(k => OPS[k].squad)).size,
    tiers: [tier(4, { orundum: 200 }), tier(8, { orundum: 400, permit: 1 }), tier(TEAMS.length, { orundum: 800, permit: 2 })] },
  { id: "fives", cat: "Collection", n: "Legendary Bladers", d: g => `Own ${g} 5★ Beyblade${g > 1 ? "s" : ""}`, v: () => ownedKeys().filter(k => OPS[k].rar === 5).length,
    tiers: [tier(1, { orundum: 200 }), tier(5, { orundum: 400, permit: 1 }), tier(12, { orundum: 800, permit: 2 }), tier(23, { orundum: 1500, permit: 4 })] },
  { id: "asc1", cat: "Growth", n: "Upgrade", d: g => `Upgrade ${g} Beyblade${g > 1 ? "s" : ""} at least once`, v: () => Object.values(S.ops).filter(p => p.elite >= 1).length,
    tiers: [tier(1, { orundum: 150 }), tier(5, { orundum: 300, chip: 2 }), tier(20, { orundum: 600, permit: 1 })] },
  { id: "asc2", cat: "Growth", n: "Fully Customized", d: g => `Fully Upgrade ${g} Beyblade${g > 1 ? "s" : ""}`, v: () => Object.values(S.ops).filter(p => p.elite >= 2).length,
    tiers: [tier(1, { orundum: 400, permit: 1 }), tier(5, { orundum: 800, permit: 2 }), tier(15, { orundum: 1500, permit: 3 })] },
  { id: "rankex", cat: "Growth", n: "Technique Master", d: g => `Raise ${g} move${g > 1 ? "s" : ""} to level MAX`, v: () => Object.values(S.ops).reduce((a, p) => a + p.sk.filter(r => r >= 7).length, 0),
    tiers: [tier(1, { orundum: 200, summ: 3 }), tier(5, { orundum: 400, summ: 6 }), tier(20, { orundum: 800, permit: 2 })] },
  { id: "origin", cat: "Growth", n: "Perfect Sync", d: g => `Max the Bit-Beast Sync of ${g} Beyblade${g > 1 ? "s" : ""}`, v: () => Object.values(S.ops).filter(p => p.pot >= 6).length,
    tiers: [tier(1, { orundum: 500, permit: 1 }), tier(3, { orundum: 1000, permit: 3 })] },
  { id: "codes", cat: "Growth", n: "Chief Mechanic", d: g => `Tune up Customize Parts ${g} times`, v: () => S.stats.codeUps,
    tiers: [tier(10, { lmd: 10000 }), tier(50, { lmd: 30000, orundum: 200 }), tier(200, { lmd: 80000, orundum: 400 }), tier(500, { orundum: 800, permit: 2 })] },
  { id: "code15", cat: "Growth", n: "Tournament Grade", d: g => `Tune ${g} Customize Part${g > 1 ? "s" : ""} to +15`, v: () => S.parts.filter(pt => pt.lvl >= 15).length,
    tiers: [tier(1, { orundum: 200 }), tier(5, { orundum: 500, permit: 1 }), tier(20, { orundum: 1000, permit: 2 })] },
  { id: "plv", cat: "Growth", n: "Blader Rank", d: g => `Reach Blader Rank ${g}`, v: () => S.lvl,
    tiers: [tier(10, { orundum: 200 }), tier(20, { orundum: 400, permit: 1 }), tier(40, { orundum: 800, permit: 2 }), tier(60, { orundum: 1200, permit: 3 }), tier(100, { orundum: 2000, permit: 5 })] },
  { id: "wins", cat: "Battle", n: "Beybattle Winner", d: g => `Win ${g} battles`, v: () => S.stats.wins,
    tiers: [tier(10, { orundum: 100 }), tier(50, { orundum: 300 }), tier(200, { orundum: 600, permit: 1 }), tier(1000, { orundum: 1500, permit: 3 })] },
  { id: "arcs", cat: "Battle", n: "Bit-Beast, Rise!", d: g => `Call ${g} Bit-Beast attacks`, v: () => S.stats.arcs,
    tiers: [tier(10, { orundum: 100 }), tier(100, { orundum: 300 }), tier(500, { orundum: 600, permit: 1 }), tier(2000, { orundum: 1200, permit: 2 })] },
  { id: "kills", cat: "Battle", n: "Out of the Dish", d: g => `Knock out ${g} rival Beyblades`, v: () => S.stats.kills,
    tiers: [tier(100, { orundum: 100 }), tier(1000, { orundum: 300 }), tier(5000, { orundum: 800, permit: 1 }), tier(20000, { orundum: 1500, permit: 3 })] },
  { id: "flawless", cat: "Battle", n: "Still Spinning", d: g => `Win ${g} battles without losing a Beyblade`, v: () => S.stats.flawless,
    tiers: [tier(10, { orundum: 150 }), tier(50, { orundum: 400 }), tier(200, { orundum: 800, permit: 2 })] },
  { id: "arcade", cat: "Battle", n: "BBA Tower", d: g => `Clear BBA Tower floor ${g}`, v: () => S.tower,
    tiers: [tier(5, { orundum: 150 }), tier(10, { orundum: 300, permit: 1 }), tier(20, { orundum: 500, permit: 2 }), tier(30, { orundum: 1000, permit: 3 })] },
  { id: "versus", cat: "Battle", n: "Ranked Blader", d: g => `Win ${g} Ranked Battles`, v: () => S.stats.versus,
    tiers: [tier(5, { tokens: 100 }), tier(25, { tokens: 300, orundum: 200 }), tier(100, { tokens: 600, permit: 2 })] },
  { id: "patrol", cat: "Battle", n: "Street Legend", d: g => `Win ${g} Street Battles`, v: () => S.stats.patrols,
    tiers: [tier(10, { lmd: 10000 }), tier(50, { orundum: 300, chip: 3 }), tier(200, { orundum: 600, chip: 6 })] },
  { id: "pulls", cat: "Boosters", n: "Booster Fan", d: g => `Open ${g} Random Boosters`, v: () => S.gacha.total,
    tiers: [tier(10, { orundum: 100 }), tier(50, { orundum: 300, permit: 1 }), tier(100, { orundum: 500, permit: 2 }), tier(300, { orundum: 1000, permit: 3 }), tier(1000, { orundum: 2000, permit: 5 })] },
  { id: "luck", cat: "Boosters", n: "Lucky Launch", d: g => `Get ${g} 5★ Beyblade${g > 1 ? "s" : ""} from Boosters`, v: () => S.stats.fives,
    tiers: [tier(1, { orundum: 150 }), tier(5, { orundum: 400, permit: 1 }), tier(20, { orundum: 1000, permit: 3 })] },
  { id: "login", cat: "Login", n: "Daily Practice", d: g => `Log in on ${g} days`, v: () => S.stats.loginDays,
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
      if (!silent) mailTo(S, { from: "BBA Records", tag: "ach", title: `Record: ${achTierName(a, i)}`, body: `${a.d(a.tiers[i][0])}. Your reward is attached.`, rewards: a.tiers[i][1] });
      got.push(achTierName(a, i)); i++;
    }
    S.achv[a.id] = i;
  }
  if (got.length && !silent) { toast(`BBA Record: ${got[0]}${got.length > 1 ? ` (+${got.length - 1} more)` : ""}. Reward sent to your Mailbox.`, "gold"); sfx("heal"); }
  return got;
}
// battle statistics (called by the battle director when a fight ends)
function recordBattle(res, B) {
  S.stats.arcs += B.tally.arcs; S.stats.kills += B.tally.kills;
  if (res.win && !res.lost) S.stats.flawless++;
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
    <p class="small dim">Gifts, login rewards and BBA Record rewards arrive here. Gifts expire after ${MAIL_DAYS} days.</p>
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
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">BBA</span></div>
    <h2>BBA Records</h2>
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

// ---------- screens: Blader Card + settings ----------
// a trophy for every tournament (story chapter) won, coloured by season
const SEASON_COL = { "Season 1": "#f2c14e", "V-Force": "#5fd4ff", "G-Revolution": "#ff8a3c" };
function trophySVG(ch, on) {
  const c = on ? SEASON_COL[ch.season] || "#f2c14e" : "#2e3548", d = on ? shade(c, -.35) : "#1e2432";
  return `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M12 6h16v10a8 8 0 0 1-16 0z" fill="${c}"/><path d="M12 9H6v3a6 6 0 0 0 6 6M28 9h6v3a6 6 0 0 1-6 6" fill="none" stroke="${c}" stroke-width="2.5"/>
    <rect x="18" y="24" width="4" height="9" fill="${d}"/><rect x="11" y="33" width="18" height="5" rx="1" fill="${c}"/><rect x="9" y="38" width="22" height="5" rx="1" fill="${d}"/>${on ? '<path d="M15 8h3v8a5 5 0 0 1-3-3z" fill="#fff" opacity=".45"/>' : ""}</svg>`;
}
const trophies = () => STORY[0].chapters.filter(chapterCleared).length;
// the title on your Blader Card, from the tournaments you've won
const bladerTitle = n => n >= 13 ? "Legendary Blader" : n >= 9 ? "Tag Team Champion" : n >= 5 ? "World Champion" : n >= 1 ? "Regional Champion" : "Rookie Blader";
const chipRow = (act, cur, opts) => `<div class="filters">${opts.map(([v, n]) => `<button class="chip ${String(cur) === String(v) ? "on" : ""}" data-act="${act}" data-v="${v}">${n}</button>`).join("")}</div>`;
SCREENS.settings = () => {
  const st = S.settings;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Blader Card</span></div>
    <section class="panel tcard">
      <div class="spread" style="align-items:flex-start"><div style="min-width:0"><div class="eyebrow">BBA License · ID No. ${S.playerId.replace(/(\d{3})(?=\d)/g, "$1 ")}</div><h2 style="margin-top:4px">${esc(S.name)}</h2>
        <div class="small gold">${bladerTitle(trophies())}</div></div><img class="tlook" src="${lookArt(myLook())}" alt=""></div>
      <div class="statgrid small" style="margin-top:6px">
        <div><span>Yen</span><b>¥${fmtFull(S.lmd)}</b></div><div><span>Beyblades</span><b>${Object.keys(S.ops).length} / ${OP_KEYS.length}</b></div>
        <div><span>Blader Rank</span><b>${S.lvl}</b></div><div><span>Started</span><b>${new Date(S.created).toLocaleDateString()}</b></div>
        <div><span>Battles won</span><b>${fmtFull(S.stats.wins)}</b></div><div><span>BBA Records</span><b>${achDone()}/${achTotal}</b></div>
        <div><span>World ranking</span><b>#${fmtFull(S.arena.rank)}</b></div><div><span>Login days</span><b>${S.stats.loginDays}</b></div>
      </div>
      <div class="trophies">${STORY[0].chapters.map(ch => `<span class="tro ${chapterCleared(ch) ? "on" : ""}" title="${esc(ch.title)}">${trophySVG(ch, chapterCleared(ch))}</span>`).join("")}</div>
      <p class="tiny dim" style="margin-top:4px">A trophy for every tournament you win in the Story: ${trophies()} of ${STORY[0].chapters.length}.</p>
    </section>
    <section class="panel stack" style="gap:10px"><h3>Profile</h3>
      <label class="small dim" for="pname">Name</label>
      <div class="row" style="gap:8px"><input id="pname" class="tinput" maxlength="16" value="${esc(S.name)}"><button class="btn sm" data-act="saveName">Save</button></div>
      <span class="small dim">Look</span><div class="avgrid">${LOOKS.map(k => `<button class="${myLook() === k ? "on" : ""}" data-act="setLook" data-v="${k}"><img src="${lookHead(k)}" alt=""><span>${esc(lookName(k))}</span></button>`).join("")}</div></section>
    <section class="panel stack" style="gap:10px"><h3>Sound</h3>
      ${chipRow("setSound", st.sound ? 1 : 0, [[1, "On"], [0, "Off"]])}</section>
    <section class="panel stack" style="gap:10px"><h3>Battle</h3>
      <span class="small dim">Battle speed</span>${chipRow("setSpeed", st.speed, [[1, "1×"], [2, "1.5×"], [3, "2×"]])}
      <span class="small dim">Start battles on auto</span>${chipRow("setAuto", st.auto ? 1 : 0, [[1, "On"], [0, "Off"]])}
      <span class="small dim">Auto-battle tactics</span>${chipRow("setAi", st.ai, [["balanced", "Balanced"], ["aggressive", "Aggressive"], ["safe", "Defensive"]])}</section>
    <section class="panel stack" style="gap:10px"><h3>Account</h3>
      <p class="tiny dim">Progress saves in this browser only.</p>
      <button class="btn ghost wide" data-act="toTitle">Return to title screen</button>
      <button class="btn red wide" data-act="askReset">Reset account</button></section>
    <p class="tiny dim" style="text-align:center">Beyblade: Let It Rip! · Ver ${GAME_VER}<br>An unofficial, non-commercial fan game. Beyblade belongs to Takao Aoki, Takara Tomy, Hasbro and Nelvana; all art here is drawn by the game itself.</p>
  </div>`;
};
function resetModal() {
  openModal(`<div class="stack"><div class="eyebrow ds">Danger</div><h2>Reset account?</h2>
    <p class="small dim">This deletes everything in this browser: your Beyblades, Customize Parts, story progress, currencies, mail and BBA Records. You will start again from the title screen with a new account. This cannot be undone.</p>
    <label class="small" for="rconf">Type <b>RESET</b> to confirm</label>
    <input id="rconf" class="tinput" autocomplete="off" autocapitalize="characters" placeholder="RESET">
    <div class="row" style="gap:10px"><button class="btn ghost" style="flex:1" data-act="closeModal">Cancel</button><button class="btn red" style="flex:1" data-act="doReset">Reset</button></div></div>`);
}
function nameModal() {
  openModal(`<div class="stack" style="text-align:center;align-items:center"><div class="eyebrow">New account</div><h2>What's your Blader name?</h2>
    <div class="avpick">${Object.keys(ROOKIE_LOOKS).map(k => `<button class="${myLook() === k ? "on" : ""}" data-act="pickLook" data-v="${k}"><img src="${lookHead(k)}" alt=""><span>${ROOKIE_LOOKS[k].n}</span></button>`).join("")}</div>
    <input id="nname" class="tinput" maxlength="16" placeholder="Blader" style="text-align:center;width:100%">
    <p class="tiny dim">You can change your name, and pick from ${LOOKS.length} looks, later on your Blader Card.</p>
    <button class="btn wide" data-act="nameGo">Confirm</button></div>`);
  m0Click();
}
// a modal opened from a tap must not close on the same tap
function m0Click() { const m = $("#modal"); m.onclick = null; setTimeout(() => { m.onclick = e => { if (e.target === m && !$("#nname")) closeModal(); }; }, 0); }

// ---------- title screen ----------
// A typical gacha login screen: key art (drawn live), logo, a fake load bar, "Tap to start", version and player ID.
// The key art: a Beystadium under the lights, Dragoon and Dranzer clashing, Tyson and Kai launching from either side.
const TITLE = { on: false, raf: 0, t0: 0, stars: [], sparks: [], crowd: [] };
function showTitle() {
  closeModal();
  let el = $("#title");
  if (!el) { el = document.createElement("div"); el.id = "title"; document.body.appendChild(el); }
  el.innerHTML = `<canvas id="tcv"></canvas>
    <div class="tlogo"><div class="tpre">3 · 2 · 1</div><h1>BEYBLADE</h1><div class="tsub">LET IT RIP!</div></div>
    <div class="tload" id="tload"><div class="tbar"><i id="tbarI"></i></div><span id="tloadT">Winding the ripcord… 0%</span></div>
    <div class="ttap" id="ttap" hidden>Tap to Start</div>
    <div class="tfoot"><button class="tbtn" data-act="titleSettings">${IC.gearIc}<span>Settings</span></button><button class="tbtn" data-act="titleCredits">${IC.book}<span>Credits</span></button></div>
    <div class="tver">Ver ${GAME_VER} · ${S.named ? "ID " + S.playerId.replace(/(\d{3})(?=\d)/g, "$1 ") : "New account"}<br>Unofficial fan game. Beyblade © Takao Aoki / Takara Tomy / Hasbro / Nelvana.</div>`;
  el.hidden = false; el.classList.remove("out");
  UI.inGame = false; TITLE.on = true; TITLE.t0 = performance.now();
  const rng = seeded(7);
  TITLE.stars = Array.from({ length: 60 }, () => ({ x: rng(), y: rng() * .4, r: .4 + rng() * 1.2, p: rng() * 7 }));
  TITLE.crowd = Array.from({ length: 140 }, () => ({ x: rng(), y: rng(), c: pick(["#ff5a4a", "#4aa8ff", "#f2c14e", "#ffffff", "#5fdc8c"], rng), p: rng() * 7 }));
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
  // load bar, then "Tap to Start"
  const p = Math.min(1, t / 1.4), lt = $("#tloadT");
  if (lt) { $("#tbarI").style.width = p * 100 + "%"; lt.textContent = p < 1 ? `Winding the ripcord… ${Math.floor(p * 100)}%` : "Ready"; if (p >= 1 && $("#ttap").hidden) { $("#ttap").hidden = false; $("#tload").classList.add("done"); } }
  // arena: dark sky, stands full of fans with flashing cameras
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#02040c"); sky.addColorStop(.45, "#0a1430"); sky.addColorStop(1, "#14244a");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (const s of TITLE.stars) { g.globalAlpha = .3 + .3 * Math.sin(t * 1.6 + s.p); g.fillStyle = "#e8f0ff"; g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  const cx = W / 2, cy = H * .66, R = Math.min(W * .44, H * .4), e = .36;
  // stands
  g.fillStyle = "#0a1028"; g.beginPath(); g.ellipse(cx, cy - R * .05, R * 1.9, R * 1.9 * e + H * .12, 0, Math.PI, 0); g.fill();
  for (const c of TITLE.crowd) {
    const a = Math.PI + c.x * Math.PI, rr = 1.25 + c.y * .55, x = cx + Math.cos(a) * R * rr, y = cy - R * .05 + Math.sin(a) * (R * rr * e + H * .08 * c.y);
    if (y > cy - R * e * .9) continue;
    g.globalAlpha = .35 + .3 * Math.sin(t * 3 + c.p); g.fillStyle = c.c; g.fillRect(x, y, 2, 2);
    if (Math.sin(t * 2.3 + c.p * 13) > .995) { g.globalAlpha = .9; g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  }
  g.globalAlpha = 1;
  // spotlights sweeping the dish
  g.globalCompositeOperation = "lighter";
  for (let k = 0; k < 4; k++) {
    const sx = W * (.1 + k * .27), ang = Math.sin(t * .6 + k * 1.7) * .35, tx = cx + Math.sin(ang) * R * .8;
    const lg = g.createLinearGradient(sx, 0, tx, cy); lg.addColorStop(0, "#9fd0ff33"); lg.addColorStop(1, "#9fd0ff00");
    g.fillStyle = lg; g.beginPath(); g.moveTo(sx - 6, 0); g.lineTo(sx + 6, 0); g.lineTo(tx + R * .25, cy); g.lineTo(tx - R * .25, cy); g.closePath(); g.fill();
  }
  g.globalCompositeOperation = "source-over";
  // the Beystadium: rim, wall and dish floor
  g.fillStyle = "#2a3a6a"; g.beginPath(); g.ellipse(cx, cy + 14, R * 1.08, R * 1.08 * e, 0, 0, 7); g.fill();
  g.fillStyle = "#c8d0e0"; g.beginPath(); g.ellipse(cx, cy, R * 1.08, R * 1.08 * e, 0, 0, 7); g.fill();
  const df = g.createRadialGradient(cx, cy, R * .1, cx, cy, R); df.addColorStop(0, "#3a6ad8"); df.addColorStop(.7, "#1e3a8a"); df.addColorStop(1, "#0e1a40");
  g.fillStyle = df; g.beginPath(); g.ellipse(cx, cy, R, R * e, 0, 0, 7); g.fill();
  g.strokeStyle = "#ffffff22"; g.lineWidth = 1.5; for (const k of [.35, .7]) { g.beginPath(); g.ellipse(cx, cy, R * k, R * k * e, 0, 0, 7); g.stroke(); }
  // Dragoon and Dranzer orbit the centre and clash every couple of seconds
  const dg = OPS["tyson-s"], dz = OPS["kai-s"], ph = t * 1.4, cl = Math.pow(Math.max(0, Math.sin(t * 2.2)), 18);
  const ox = Math.cos(ph) * R * (.42 - cl * .3), oy = Math.sin(ph) * R * .42 * e, bs = Math.min(W, H) / 330;
  const beys = [[cx + ox, cy + oy, dg, -1], [cx - ox, cy - oy, dz, 1]].sort((a, b) => a[1] - b[1]);
  for (const [x, y, op, dir] of beys) {
    g.fillStyle = "#0008"; g.beginPath(); g.ellipse(x, y + 2, 40 * bs, 40 * bs * e, 0, 0, 7); g.fill();
    g.save(); g.translate(x, y); g.scale(bs, bs); drawBey(g, op.bey, { e: .4, spin: t * 22 * dir, tilt: Math.sin(t * 3 + dir) * .05, blur: .9 }); g.restore();
  }
  if (cl > .5 && Math.random() < .7) for (let k = 0; k < 4; k++) TITLE.sparks.push({ x: cx, y: cy, vx: (Math.random() - .5) * 9, vy: -Math.random() * 7 - 1, l: 1 });
  g.globalCompositeOperation = "lighter";
  for (const s of TITLE.sparks) { s.x += s.vx; s.y += s.vy; s.vy += .35; s.l -= .035; g.globalAlpha = Math.max(0, s.l); g.fillStyle = s.l > .5 ? "#fff6c0" : "#ff9a3c"; g.fillRect(s.x, s.y, 2.5, 2.5); }
  TITLE.sparks = TITLE.sparks.filter(s => s.l > 0);
  if (cl > .3) { g.globalAlpha = cl * .5; const fl = g.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, R * .6); fl.addColorStop(0, "#ffffff"); fl.addColorStop(1, "#ffffff00"); g.fillStyle = fl; g.fillRect(0, 0, W, H); }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  // Tyson and Kai on either side of the dish, launchers raised
  const fs = Math.min(W * .5, H * .3) / 150, fy = H * .985;
  g.save(); g.translate(W * .09, fy); g.scale(fs, fs); drawFigure(g, dg.fig, { name: "idle", time: t }); g.restore();
  g.save(); g.translate(W * .91, fy); g.scale(-fs, fs); drawFigure(g, dz.fig, { name: "idle", time: t + 1.3 }); g.restore();
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

// ---------- free Boosters ----------
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
  setLook: d => { if (LOOKS.includes(d.v)) { S.look = d.v; sfx("tap"); rerender(); } },
  pickLook: d => { if (!ROOKIE_LOOKS[d.v]) return; S.look = d.v; sfx("tap"); $$(".avpick button").forEach(b => b.classList.toggle("on", b.dataset.v === d.v)); },
  saveName: () => { const v = ($("#pname") || {}).value; S.name = (v || "").trim().slice(0, 16) || "Blader"; toast("Name saved."); rerender(); },
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
      <p class="small dim">Beyblade: Let It Rip! is an unofficial, non-commercial fan game made with love for the original Beyblade anime (Season 1, V-Force and G-Revolution).</p>
      <p class="small dim">Beyblade and its characters belong to Takao Aoki, Takara Tomy, Hasbro, d-rights and Nelvana. Names follow the English dub; Beyblade and attack names follow the Beyblade Fandom wiki.</p>
      <p class="small dim">Every Blader, Beyblade, Bit-Beast and stadium is drawn by the game itself; no official assets are used.</p>
      <button class="btn wide" data-act="closeModal">Close</button></div>`);
  },
  nameGo: () => {
    const v = (($("#nname") || {}).value || "").trim().slice(0, 16);
    S.name = v || "Blader"; S.named = true; closeModal(); sfx("tap"); afterLogin();
  },
  // free Boosters from the welcome mail
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
