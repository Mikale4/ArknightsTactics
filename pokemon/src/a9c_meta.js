
// =====================================================================
//  META — Mail (Mystery Gifts), Medals, Trainer Card + Settings, and the title screen
// =====================================================================
const GAME_VER = "1.0.0";
const MAIL_DAYS = 30;            // gifts expire after this many days; claimed mail is cleared after the same time
const GIFT_MS = 3 * 3600000;     // a letter from someone in Kanto every few hours of real time
const DAY_MS = 864e5;

// ---------- mail ----------
function mailTo(s, m) {
  s.inbox = s.inbox || [];
  const mail = { id: ++s.mailSeq, t: Date.now(), from: m.from || "Prof. Oak", title: m.title, body: m.body || "", rewards: m.rewards || {},
    claimed: false, read: false, exp: m.noExp ? 0 : Date.now() + MAIL_DAYS * DAY_MS, tag: m.tag || "" };
  s.inbox.unshift(mail);
  return mail;
}
function sendMail(m, quiet) { const mail = mailTo(S, m); if (!quiet) toast(`New mail: ${m.title}`, "gold"); return mail; }
const hasRewards = m => Object.keys(m.rewards).length > 0;
const unclaimedMail = () => (S.inbox || []).filter(m => !m.claimed && hasRewards(m));
function purgeMail() {
  const now = Date.now();
  S.inbox = (S.inbox || []).filter(m => !(m.exp && now > m.exp) && !(m.claimed && now - m.t > MAIL_DAYS * DAY_MS)).slice(0, 120);
}
function claimMail(m) {
  if (!m || m.claimed || !hasRewards(m)) { if (m) m.read = true; return []; }
  m.claimed = true; m.read = true;
  return give(m.rewards);
}
// every new Trainer starts with a Safari Pass (10 free throws) and a Master Ball (a guaranteed random 5★)
function welcomeMail(s) {
  mailTo(s, { from: "Mystery Gift", tag: "welcome", noExp: 1, title: "Welcome to Kanto!",
    body: "A gift to start your journey: a Safari Pass for ten free throws in the Safari Zone, and a Master Ball, which always catches a random 5★ Pokémon. Use both on the Safari tab.",
    rewards: { free10: 1, gold5: 1 } });
  s.welcome = 1;
}
const LOGIN_GIFTS = [{ orundum: 100 }, { lmd: 5000 }, { rec2: 4 }, { orundum: 150 }, { summ: 2, rare: 1 }, { held: "sitrusberry", lmd: 3000 }, { permit: 2 }];
function dailyLogin() {
  if (S.lastLogin === today()) return;
  S.lastLogin = today(); S.stats.loginDays++;
  const n = S.stats.loginDays, day = (n - 1) % 7;
  sendMail({ from: "Pokémon Center", tag: "login", title: `Daily Login · Day ${n}`,
    body: `Welcome back, Trainer! Here is your login gift for day ${day + 1} of 7${day === 6 ? ", the best one" : ""}. We hope to see you again tomorrow!`, rewards: LOGIN_GIFTS[day] });
}
const GIFTS = [
  { from: "Mom", title: "From home", body: "I saved some of your prize money for you, sweetie. Don't forget to change your underwear!", rewards: { lmd: 5000 } },
  { from: "Prof. Oak", title: "Research supplies", body: "Your Pokédex data has been a great help! Please take these for your Pokémon.", rewards: { rec2: 3, summ: 1 } },
  { from: "Bill", title: "From the PC", body: "Hiya! I found these lying around in the Storage System. They're all yours!", rewards: { orundum: 80, rec1: 4 } },
  { from: "Daisy", title: "A little something", body: "My brother Blue is so proud he won't say it, but he thinks you're a great rival. Here!", rewards: { rare: 1, lmd: 2000 } },
  { from: "Nurse Joy", title: "Pokémon Center", body: "We hope to see you again! Here's an Elixir for the road.", rewards: { prime: 1 } },
  { from: "Safari Zone Warden", title: "Free admission", body: "You returned my gold teeth! Come by the park any time. These are on the house.", rewards: { permit: 1 } },
  { from: "Celadon Dept. Store", title: "Loyalty reward", body: "Thank you for shopping with us! Please enjoy this complimentary item.", rewards: { held: "lumberry", lmd: 1500 } },
  { from: "Fan Club Chairman", title: "Let me tell you about my Rapidash", body: "Did I tell you about my Rapidash? It's so fast! Anyway, take this for listening.", rewards: { summ: 2 } },
  { from: "Mr. Fuji", title: "Thank you", body: "The Pokémon of Lavender Town rest peacefully thanks to you.", rewards: { orundum: 100 } },
  { from: "Game Corner", title: "Lucky coins", body: "A lucky Trainer like you deserves a few coins. Come try the Prize Corner!", rewards: { cert: 15 } },
];
function castGift() {
  if (Date.now() - S.lastGift < GIFT_MS || S.inbox.some(m => m.tag === "gift" && !m.claimed)) return;
  S.lastGift = Date.now();
  sendMail({ ...pick(GIFTS), tag: "gift" });
}
// a gift every five Trainer Levels
function rankGifts() {
  while (S.lvlGift + 5 <= S.lvl) {
    S.lvlGift += 5;
    const L2 = S.lvlGift;
    sendMail({ from: "Pokémon League", tag: "rank", title: `Trainer Level ${L2}`, body: `You reached Trainer Level ${L2}. Keep it up!`,
      rewards: L2 % 10 === 0 ? { orundum: 100 + L2 * 4, permit: 1 } : { orundum: 100 + L2 * 4 } });
  }
}
// Mew arrives as a Mystery Gift once Mewtwo is caught
function mewGift() {
  if (S.mewSent || !S.dex.caught.mewtwo) return;
  S.mewSent = 1;
  sendMail({ from: "Mystery Gift", tag: "welcome", noExp: 1, title: "Mystery Gift: Mew", body: "A Pokémon said to carry the genetic code of every Pokémon has been found under a truck near the S.S. Anne... Mew wants to join you!", rewards: { op: "mew" } });
}

// ---------- Medals ----------
const tier = (goal, reward) => [goal, reward];
const ownedKeys = () => Object.keys(S.ops);
const ACH_CATS = ["Journey", "Pokédex", "Training", "Battle", "Safari", "Login"];
const ACH = [
  ...BADGES.map((b, i) => ({ id: "badge" + i, cat: "Journey", n: b.n, d: () => `Defeat ${b.leader} at the ${b.gym}`, v: () => S.badges > i ? 1 : 0, tiers: [tier(1, { orundum: 200 + i * 50, permit: i === 7 ? 3 : 0 })] })),
  { id: "champ", cat: "Journey", n: "Champion", d: () => "Become the Pokémon League Champion", v: () => S.champion ? 1 : 0, tiers: [tier(1, { orundum: 1000, permit: 5 })] },
  { id: "stages", cat: "Journey", n: "Pathfinder", d: g => `Clear ${g} Journey stages`, v: () => Object.keys(S.story).filter(k => NODES[k] && S.story[k] > 0).length,
    tiers: [tier(5, { orundum: 100 }), tier(20, { orundum: 200 }), tier(50, { orundum: 400, permit: 1 })] },
  { id: "stars", cat: "Journey", n: "Ace Trainer", d: g => `Earn 3 stars on ${g} battles`, v: () => Object.keys(S.story).filter(k => NODES[k] && S.story[k] >= 3).length,
    tiers: [tier(5, { orundum: 100 }), tier(20, { orundum: 250 }), tier(50, { orundum: 500, permit: 2 })] },
  { id: "caught", cat: "Pokédex", n: "Pokédex", d: g => `Catch ${g} different Pokémon`, v: () => dexCaught(),
    tiers: [tier(10, { orundum: 150 }), tier(30, { orundum: 300 }), tier(60, { orundum: 500, permit: 1 }), tier(100, { orundum: 800, permit: 2 }), tier(150, { orundum: 1500, permit: 5 }), tier(151, { orundum: 3000, permit: 10 })] },
  { id: "seen", cat: "Pokédex", n: "Pokémon Watcher", d: g => `See ${g} different Pokémon`, v: () => dexSeen(), tiers: [tier(25, { orundum: 100 }), tier(75, { orundum: 250 }), tier(151, { orundum: 500 })] },
  { id: "legend", cat: "Pokédex", n: "Legendary", d: g => `Catch ${g} legendary Pokémon`, v: () => ["articuno", "zapdos", "moltres", "mewtwo", "mew"].filter(k => S.dex.caught[k]).length,
    tiers: [tier(1, { orundum: 300 }), tier(3, { orundum: 600, permit: 2 }), tier(5, { orundum: 1500, permit: 5 })] },
  { id: "fives", cat: "Pokédex", n: "Rare Finds", d: g => `Own ${g} 5★ Pokémon`, v: () => ownedKeys().filter(k => OPS[k].rar === 5).length,
    tiers: [tier(1, { orundum: 200 }), tier(5, { orundum: 400, permit: 1 }), tier(15, { orundum: 800, permit: 2 }), tier(30, { orundum: 1500, permit: 4 })] },
  { id: "types", cat: "Pokédex", n: "Type Collector", d: g => `Own Pokémon of ${g} different types`, v: () => new Set(ownedKeys().flatMap(k => OPS[k].types)).size,
    tiers: [tier(5, { orundum: 150 }), tier(10, { orundum: 300 }), tier(15, { orundum: 600, permit: 1 })] },
  { id: "evos", cat: "Training", n: "Evolution", d: g => `Evolve Pokémon ${g} times`, v: () => S.stats.evolutions,
    tiers: [tier(1, { orundum: 100 }), tier(10, { orundum: 300, rare: 2 }), tier(40, { orundum: 600, permit: 1 })] },
  { id: "lv", cat: "Training", n: "Level Up", d: g => `Raise a Pokémon to Lv ${g}`, v: () => Math.max(0, ...Object.values(S.ops).map(p => p.lvl)),
    tiers: [tier(20, { orundum: 100 }), tier(40, { orundum: 250 }), tier(60, { orundum: 500, permit: 1 }), tier(100, { orundum: 1500, permit: 3 })] },
  { id: "mastery", cat: "Training", n: "Move Master", d: g => `Master ${g} move${g > 1 ? "s" : ""} (Mastery ★)`, v: () => Object.values(S.ops).reduce((a, p) => a + p.sk.filter(r => r >= MAX_SK).length, 0),
    tiers: [tier(1, { orundum: 200, summ: 2 }), tier(5, { orundum: 400, summ: 4 }), tier(20, { orundum: 800, permit: 2 })] },
  { id: "ivs", cat: "Training", n: "Perfect IVs", d: g => `Max the IVs of ${g} Pokémon`, v: () => Object.values(S.ops).filter(p => p.pot >= 6).length,
    tiers: [tier(1, { orundum: 500, permit: 1 }), tier(5, { orundum: 1000, permit: 3 })] },
  { id: "plv", cat: "Training", n: "Veteran Trainer", d: g => `Reach Trainer Level ${g}`, v: () => S.lvl,
    tiers: [tier(10, { orundum: 200 }), tier(20, { orundum: 400, permit: 1 }), tier(40, { orundum: 800, permit: 2 }), tier(60, { orundum: 1200, permit: 3 })] },
  { id: "wins", cat: "Battle", n: "Battle Girl", d: g => `Win ${g} battles`, v: () => S.stats.wins,
    tiers: [tier(10, { orundum: 100 }), tier(50, { orundum: 300 }), tier(200, { orundum: 600, permit: 1 }), tier(1000, { orundum: 1500, permit: 3 })] },
  { id: "superEff", cat: "Battle", n: "Type Expert", d: g => `Land ${g} super-effective hits`, v: () => S.stats.superEff,
    tiers: [tier(25, { orundum: 100 }), tier(250, { orundum: 300 }), tier(2000, { orundum: 800, permit: 1 })] },
  { id: "kills", cat: "Battle", n: "Knockout Artist", d: g => `Knock out ${g} opposing Pokémon`, v: () => S.stats.kills,
    tiers: [tier(100, { orundum: 100 }), tier(1000, { orundum: 300 }), tier(5000, { orundum: 800, permit: 1 })] },
  { id: "flawless", cat: "Battle", n: "Untouchable", d: g => `Win ${g} battles without a Pokémon fainting`, v: () => S.stats.flawless,
    tiers: [tier(10, { orundum: 150 }), tier(50, { orundum: 400 }), tier(200, { orundum: 800, permit: 2 })] },
  { id: "tower", cat: "Battle", n: "Battle Tower", d: g => `Clear Battle Tower floor ${g}`, v: () => S.tower,
    tiers: [tier(5, { orundum: 150 }), tier(10, { orundum: 300, permit: 1 }), tier(20, { orundum: 500, permit: 2 }), tier(30, { orundum: 1000, permit: 3 })] },
  { id: "link", cat: "Battle", n: "Link Battler", d: g => `Win ${g} Link Battles`, v: () => S.stats.versus,
    tiers: [tier(5, { tokens: 100 }), tier(25, { tokens: 300, orundum: 200 }), tier(100, { tokens: 600, permit: 2 })] },
  { id: "explore", cat: "Battle", n: "Explorer", d: g => `Clear ${g} Explore battles`, v: () => S.stats.patrols,
    tiers: [tier(10, { lmd: 10000 }), tier(50, { orundum: 300, rare: 2 }), tier(200, { orundum: 600, linkcord: 2 })] },
  { id: "pulls", cat: "Safari", n: "Safari Regular", d: g => `Throw ${g} Safari Balls`, v: () => S.gacha.total,
    tiers: [tier(10, { orundum: 100 }), tier(50, { orundum: 300, permit: 1 }), tier(100, { orundum: 500, permit: 2 }), tier(300, { orundum: 1000, permit: 3 })] },
  { id: "luck", cat: "Safari", n: "Lucky Catch", d: g => `Catch ${g} 5★ Pokémon in the Safari Zone`, v: () => S.stats.fives,
    tiers: [tier(1, { orundum: 150 }), tier(5, { orundum: 400, permit: 1 }), tier(20, { orundum: 1000, permit: 3 })] },
  { id: "login", cat: "Login", n: "Daily Trainer", d: g => `Log in on ${g} days`, v: () => S.stats.loginDays,
    tiers: [tier(3, { orundum: 100 }), tier(7, { orundum: 300, permit: 1 }), tier(30, { orundum: 800, permit: 2 }), tier(100, { orundum: 1500, permit: 5 })] },
];
for (const a of ACH) for (const t of a.tiers) for (const k in t[1]) if (!t[1][k]) delete t[1][k];
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
      if (!silent) mailTo(S, { from: "Pokémon League", tag: "ach", title: `Medal: ${achTierName(a, i)}`, body: `${a.d(a.tiers[i][0])}. Your reward is attached.`, rewards: a.tiers[i][1] });
      got.push(achTierName(a, i)); i++;
    }
    S.achv[a.id] = i;
  }
  if (got.length && !silent) { toast(`Medal earned: ${got[0]}${got.length > 1 ? ` (+${got.length - 1} more)` : ""}. Reward sent to your Mail.`, "gold"); sfx("heal"); }
  return got;
}
function recordBattle(res, B) {
  S.stats.kills += B.tally.kills; S.stats.superEff += B.tally.superEff; S.daily.rune = (S.daily.rune || 0) + B.tally.superEff;
  if (res.win && !res.lost) S.stats.flawless++;
}
function metaTick() {
  if (!UI.inGame || BT.on) return;
  purgeMail(); dailyLogin(); rankGifts(); castGift(); mewGift(); checkAchievements();
}

// ---------- screens: mail ----------
const SENDER_SPR = { "Prof. Oak": "oak", Bill: "bill", Daisy: "daisy", "Nurse Joy": "nurse", "Pokémon Center": "nurse", "Mr. Fuji": "mrfuji", "Celadon Dept. Store": "clerk",
  "Safari Zone Warden": "gentleman", "Fan Club Chairman": "gentleman", "Game Corner": "gamer" };
const mailIcon = m => SENDER_SPR[m.from] ? `<img class="px" src="${trainerURL(SENDER_SPR[m.from])}" alt="">` : ({ welcome: IC.gift, gift: IC.gift, login: IC.pokeball, ach: IC.trophy.replace("<svg", '<svg style="color:var(--gold)"'), rank: IC.star }[m.tag] || IC.mail);
const ago = t => { const d = Math.floor((Date.now() - t) / DAY_MS); return d < 1 ? "Today" : d === 1 ? "Yesterday" : d + " days ago"; };
const rewardChips = r => Object.entries(r).map(([k, n]) => k === "op" ? `<span class="cost"><img class="px" src="${sprFront(n)}" alt="" style="width:18px;height:18px">${esc(OPS[n].n)}</span>` : k === "held" ? `<span class="cost">${heldIcon(n)}${esc(HELD[n].n)}</span>` : `<span class="cost">${itemIcon(k)}${fmt(n)}</span>`).join(" ");
const mailRewardList = r => Object.entries(r).map(([k, n]) => k === "op" ? { k: "op:" + n, n: 1 } : k === "held" ? { k: "held:" + n, n: 1 } : { k, n });
SCREENS.inbox = () => {
  purgeMail();
  const list = S.inbox, open = unclaimedMail().length;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Mail</span></div>
    <div class="spread"><h2>Mail</h2><button class="btn sm" data-act="claimAllMail" ${open ? "" : "disabled"}>Claim all${open ? ` · ${open}` : ""}</button></div>
    <p class="small dim">Mystery Gifts, login gifts, Medal rewards and letters arrive here. Gifts expire after ${MAIL_DAYS} days.</p>
    ${list.length ? list.map(m => `<button class="mailrow ${m.read && (m.claimed || !hasRewards(m)) ? "done" : ""}" data-act="openMail" data-id="${m.id}">
      <span class="mi">${mailIcon(m)}</span>
      <span class="mt"><b>${esc(m.title)}</b><span class="tiny dim">${esc(m.from)} · ${ago(m.t)}${m.exp && !m.claimed ? ` · expires in ${Math.max(1, Math.ceil((m.exp - Date.now()) / DAY_MS))}d` : ""}</span>
        ${hasRewards(m) ? `<span class="row tiny" style="gap:6px">${rewardChips(m.rewards)}</span>` : ""}</span>
      <span class="ms">${m.claimed ? IC.check : hasRewards(m) || !m.read ? '<i class="dot" style="position:static"></i>' : ""}</span>
    </button>`).join("") : '<p class="small dim">No mail right now.</p>'}
    ${list.some(m => m.claimed || (m.read && !hasRewards(m))) ? `<button class="btn ghost wide" data-act="clearMail">Delete read and claimed mail</button>` : ""}
  </div>`;
};
function mailModal(m) {
  m.read = true;
  openModal(`<div class="stack"><div class="row" style="gap:10px"><span class="mi">${mailIcon(m)}</span><div><div class="eyebrow">${esc(m.from)} · ${ago(m.t)}</div><h2 style="font-size:20px">${esc(m.title)}</h2></div></div>
    <p class="small" style="line-height:1.5">${esc(m.body)}</p>
    ${hasRewards(m) ? `<div class="rewards">${rewardsHTML(mailRewardList(m.rewards))}</div>` : ""}
    ${hasRewards(m) && !m.claimed ? `<button class="btn wide" data-act="claimMail" data-id="${m.id}">Claim</button>` : `<button class="btn ghost wide" data-act="closeMail">${m.claimed ? "Claimed" : "Close"}</button>`}
  </div>`);
  save();
}

// ---------- screens: Medals ----------
SCREENS.ach = () => {
  checkAchievements();
  S.achSeen = achDone();
  const cat = UI.achCat || "All", list = ACH.filter(a => cat === "All" || a.cat === cat);
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Medals</span></div>
    <h2>Medals</h2>
    <section class="panel stack" style="gap:6px"><div class="spread small"><span>Earned</span><b class="num">${achDone()} / ${achTotal}</b></div>
      <div class="bar"><i style="width:${achDone() / achTotal * 100}%"></i></div><p class="tiny dim">Every Medal sends its reward to your Mail.</p></section>
    <div class="filters">${["All", ...ACH_CATS].map(c => `<button class="chip ${cat === c ? "on" : ""}" data-act="achCat" data-c="${c}">${c}</button>`).join("")}</div>
    ${list.map(a => {
      const i = S.achv[a.id] || 0, full = i >= a.tiers.length, t = a.tiers[Math.min(i, a.tiers.length - 1)], v = a.v();
      const bi = a.id.startsWith("badge") ? +a.id.slice(5) : -1;
      return `<div class="achrow ${full ? "full" : ""}"><span class="ai">${bi >= 0 ? badgeSVG(bi, full) : IC.trophy}</span>
        <div class="stack" style="gap:4px;min-width:0;flex:1"><div class="spread"><b class="small">${esc(achTierName(a, Math.min(i, a.tiers.length - 1)))}</b>
          <span class="pipsA">${a.tiers.map((_, k) => `<i class="${k < i ? "on" : ""}"></i>`).join("")}</span></div>
          <span class="tiny dim">${esc(a.d(t[0]))}</span>
          ${full ? `<span class="tiny good">Earned</span>` : `<div class="bar"><i style="width:${Math.min(100, v / t[0] * 100)}%"></i></div>
          <div class="spread tiny"><span class="num">${fmt(Math.min(v, t[0]))} / ${fmt(t[0])}</span><span class="row" style="gap:6px">${rewardChips(t[1])}</span></div>`}
        </div></div>`;
    }).join("")}
  </div>`;
};

// ---------- screens: Trainer Card + settings ----------
const chipRow = (act, cur, opts) => `<div class="filters">${opts.map(([v, n]) => `<button class="chip ${String(cur) === String(v) ? "on" : ""}" data-act="${act}" data-v="${v}">${n}</button>`).join("")}</div>`;
SCREENS.settings = () => {
  const st = S.settings;
  return `<div class="stack">
    <div class="spread">${back("go", "Home", 'data-v="home"')}<span class="eyebrow">Trainer Card</span></div>
    <section class="panel tcard">
      <div class="spread"><div><div class="eyebrow">Trainer Card · ID No. ${S.playerId}</div><h2>${esc(S.name)}</h2></div><img class="px" src="${trainerURL(avatar())}" alt="" style="width:76px;height:76px;object-fit:contain"></div>
      <div class="statgrid small" style="margin-top:6px">
        <div><span>Money</span><b>₽${fmtFull(S.lmd)}</b></div><div><span>Pokédex</span><b>${dexCaught()} / 151</b></div>
        <div><span>Trainer Level</span><b>${S.lvl}</b></div><div><span>Started</span><b>${new Date(S.created).toLocaleDateString()}</b></div>
        <div><span>Battles won</span><b>${fmtFull(S.stats.wins)}</b></div><div><span>Medals</span><b>${achDone()}/${achTotal}</b></div>
      </div>
      <div class="badgecase" style="margin-top:8px">${BADGES.map((b, i) => `<span class="bdg ${i < S.badges ? "on" : ""}" title="${b.n}: +5% ${b.sn}">${badgeSVG(i, i < S.badges)}</span>`).join("")}</div>
      <p class="tiny dim" style="margin-top:4px">Each Gym Badge gives your Pokémon +5% to one stat and raises the level cap.${S.champion ? " Pokémon League Champion!" : ""}</p>
    </section>
    <section class="panel stack" style="gap:10px"><h3>Profile</h3>
      <label class="small dim" for="pname">Name</label>
      <div class="row" style="gap:8px"><input id="pname" class="tinput" maxlength="12" value="${esc(S.name)}"><button class="btn sm" data-act="saveName">Save</button></div>
      <span class="small dim">Look</span><div class="avgrid">${AVATARS.map(([k, n]) => `<button class="${avatar() === k ? "on" : ""}" data-act="setAvatar" data-v="${k}"><img class="px" src="${trainerURL(k)}" alt=""><span>${n}</span></button>`).join("")}</div></section>
    <section class="panel stack" style="gap:10px"><h3>Game Boy</h3>
      <span class="small dim">Frame colour (Off fills the screen)</span>${chipRow("setShell", S.settings.shell || "classic", SHELLS)}
      <p class="tiny dim">The buttons work: D-pad to move, A to confirm, B to go back, START for the menu, SELECT for Auto in battle. On a keyboard: arrows, Z, X, Enter and Shift.</p></section>
    <section class="panel stack" style="gap:10px"><h3>Options</h3>
      <span class="small dim">Sound</span>${chipRow("setSound", st.sound ? 1 : 0, [[1, "On"], [0, "Off"]])}
      <span class="small dim">Battle speed</span>${chipRow("setSpeed", st.speed, [[1, "1×"], [2, "2×"], [3, "3×"]])}
      <span class="small dim">Start battles on Auto</span>${chipRow("setAuto", st.auto ? 1 : 0, [[1, "On"], [0, "Off"]])}
      <span class="small dim">Auto-battle tactics</span>${chipRow("setAi", st.ai, [["balanced", "Balanced"], ["aggressive", "Aggressive"], ["safe", "Careful"]])}</section>
    <section class="panel stack" style="gap:10px"><h3>Save data</h3>
      <p class="tiny dim">Your progress is saved in this browser only.</p>
      <button class="btn ghost wide" data-act="toTitle">Return to the title screen</button>
      <button class="btn red wide" data-act="askReset">Delete save data</button></section>
    <p class="tiny dim" style="text-align:center">Pokémon Kanto Squad · Ver ${GAME_VER}<br>An unofficial, non-commercial fan game. Pokémon © Nintendo, Game Freak and Creatures Inc. Sprites from Pokémon Showdown; data from PokeAPI.</p>
  </div>`;
};
function resetModal() {
  openModal(`<div class="stack"><div class="eyebrow bad">Warning</div><h2>Delete all saved data?</h2>
    <p class="small dim">This deletes everything in this browser: your Pokémon, Badges, Pokédex, items, mail and Medals. You will start a brand-new adventure from the title screen. This can't be undone.</p>
    <label class="small" for="rconf">Type <b>DELETE</b> to confirm</label>
    <input id="rconf" class="tinput" autocomplete="off" autocapitalize="characters" placeholder="DELETE">
    <div class="row" style="gap:10px"><button class="btn ghost" style="flex:1" data-act="closeModal">No</button><button class="btn red" style="flex:1" data-act="doReset">Yes, delete</button></div></div>`);
}
function nameModal() {
  openModal(`<div class="stack" style="text-align:center;align-items:center"><img class="px" src="${trainerURL("oak")}" alt="" style="width:80px;height:80px;object-fit:contain">
    <div class="eyebrow">Prof. Oak</div><h2>First, what is your name?</h2>
    <div class="avpick">${["red", "leaf"].map(a => `<button class="${(S.avatar || "red") === a ? "on" : ""}" data-act="pickAvatar" data-v="${a}"><img class="px" src="${trainerURL(a)}" alt=""><span>${a === "red" ? "Red" : "Leaf"}</span></button>`).join("")}</div>
    <input id="nname" class="tinput" maxlength="12" placeholder="${S.avatar === "leaf" ? "Leaf" : "Red"}" style="text-align:center;width:100%">
    <p class="tiny dim">You can change your name, and pick from 19 looks, later on your Trainer Card.</p>
    <button class="btn wide" data-act="nameGo">That's me!</button></div>`);
  m0Click();
}
function m0Click() { const m = $("#modal"); m.onclick = null; setTimeout(() => { m.onclick = e => { if (e.target === m && !$("#nname") && !$(".starters")) closeModal(); }; }, 0); }

// ---------- title screen ----------
// A mobile-game login screen: blue sky, rolling hills, Pokémon hopping across, logo, load bar, "Tap to Start".
const TITLE = { on: false, raf: 0, t0: 0, mons: [], clouds: [] };
function showTitle() {
  closeModal();
  let el = $("#title");
  if (!el) { el = document.createElement("div"); el.id = "title"; $("#screen").appendChild(el); }
  el.innerHTML = `<canvas id="tcv"></canvas>
    <div class="tlogo"><div class="tball">${IC.pokeball}</div><h1>Pokémon</h1><div class="tsub">Kanto Squad</div></div>
    <div class="tload" id="tload"><div class="tbar"><i id="tbarI"></i></div><span id="tloadT">Loading Pokémon… 0%</span></div>
    <div class="ttap" id="ttap" hidden>PRESS START</div>
    <div class="tfoot"><button class="tbtn" data-act="titleSettings">${IC.gearIc}<span>Settings</span></button><button class="tbtn" data-act="titleCredits">${IC.book}<span>Credits</span></button></div>
    <div class="tver">Ver ${GAME_VER} · ${S.named ? "ID No. " + S.playerId : "New game"}<br>Unofficial fan game. Pokémon © Nintendo / Game Freak / Creatures Inc.</div>`;
  el.hidden = false; el.classList.remove("out");
  UI.inGame = false; TITLE.on = true; TITLE.t0 = performance.now();
  const rng = seeded(151);
  const cast = ["pikachu", "bulbasaur", "charmander", "squirtle", "eevee", "jigglypuff", "psyduck", "snorlax", "meowth", "clefairy", "gengar", "dragonite", "mew", "lapras", "pidgey", "magikarp"];
  TITLE.mons = cast.map((k, i) => ({ k, x: rng(), lane: i % 3, sp: .03 + rng() * .03, ph: rng() * 7, fly: ["pidgey", "dragonite", "mew", "gengar"].includes(k) }));
  TITLE.clouds = Array.from({ length: 6 }, () => ({ x: rng(), y: .08 + rng() * .25, w: .12 + rng() * .14, v: .004 + rng() * .006 }));
  el.onclick = e => { if (e.target.closest("[data-act]")) return; if ($("#ttap") && !$("#ttap").hidden) titleStart(); };
  cancelAnimationFrame(TITLE.raf); titleLoop();
}
function titleLoop() {
  const cv = $("#tcv"); if (!TITLE.on || !cv) return;
  TITLE.raf = requestAnimationFrame(titleLoop);
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
  const t = (performance.now() - TITLE.t0) / 1000;
  // load bar follows the real sprite loading, then "Tap to Start"
  const p = SPR.ready ? Math.min(1, Math.max(t / 1.2, SPR.loaded / Math.max(1, SPR.total))) : Math.min(.99, SPR.loaded / Math.max(1, SPR.total)), lt = $("#tloadT");
  if (lt) { $("#tbarI").style.width = p * 100 + "%"; lt.textContent = p < 1 ? `Loading Pokémon… ${Math.floor(p * 100)}%` : "Ready"; if (p >= 1 && $("#ttap").hidden) { $("#ttap").hidden = false; $("#tload").classList.add("done"); } }
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#2a6ad8"); sky.addColorStop(.55, "#7ab8f2"); sky.addColorStop(.8, "#d8f0ff");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // sun rays
  g.save(); g.translate(W * .78, H * .16); g.rotate(t * .05); g.fillStyle = "#ffffff18";
  for (let k = 0; k < 12; k++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-W * .06, -H); g.lineTo(W * .06, -H); g.fill(); }
  g.restore(); circ(g, W * .78, H * .16, Math.min(W, H) * .06, "#fff8d8");
  for (const c of TITLE.clouds) { const x = ((c.x + t * c.v) % 1.3 - .15) * W, y = c.y * H; g.fillStyle = "#ffffffcc"; g.beginPath(); g.ellipse(x, y, c.w * W, c.w * W * .28, 0, 0, 7); g.ellipse(x + c.w * W * .4, y - c.w * W * .12, c.w * W * .5, c.w * W * .25, 0, 0, 7); g.fill(); }
  // hills
  const hill = (y0, amp, col, ph) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 + Math.sin(x / W * 5 + ph) * amp); g.lineTo(W, H); g.fill(); };
  hill(H * .66, H * .03, "#6aa86a", 1); hill(H * .74, H * .025, "#5a9a4a", 3); hill(H * .82, H * .02, "#4a8a3a", 5);
  // the parade
  for (const m of TITLE.mons) {
    const im = sprImg("f", m.k), box = SPR.box["f:" + m.k]; if (!im || !box) continue;
    const x = ((m.x - t * m.sp) % 1.25 + 1.25) % 1.25 * W * 1.1 - W * .1;
    const base = [H * .72, H * .8, H * .9][m.lane], hop = m.fly ? Math.sin(t * 2 + m.ph) * 10 - H * .18 : -Math.abs(Math.sin(t * 5 + m.ph)) * 10;
    const sc = Math.min(W, H) / 330 * [0.85, 1, 1.15][m.lane], bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1;
    g.fillStyle = "#00000022"; g.beginPath(); g.ellipse(x, base, bw * sc * .35, 4, 0, 0, 7); g.fill();
    g.drawImage(im, box.x0, box.y0, bw, bh, x - bw * sc / 2, base + hop - bh * sc, bw * sc, bh * sc);
  }
}
function hideTitle() {
  const el = $("#title"); if (!el) return;
  TITLE.on = false; cancelAnimationFrame(TITLE.raf);
  el.classList.add("out"); setTimeout(() => { el.hidden = true; el.innerHTML = ""; }, 450);
}
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

// ---------- free Safari throws ----------
async function manifestWith(results, master) { save(); renderTop(); await gachaReveal(results, master); checkAchievements(); rerender(); }

const META_ACT = {
  inbox: () => { closeModal(); route("inbox"); },
  openMail: d => { const m = S.inbox.find(x => x.id === +d.id); if (m) { mailModal(m); if (UI.view === "inbox") { const st = $("#view").scrollTop; $("#view").innerHTML = SCREENS.inbox(); $("#view").scrollTop = st; renderTop(); } } },
  closeMail: () => { closeModal(); if (UI.view === "inbox") rerender(); },
  claimMail: d => {
    const m = S.inbox.find(x => x.id === +d.id); const list = claimMail(m); if (!list.length) return;
    sfx("heal"); rerender(); rewardModal("Received!", list, m.title);
  },
  claimAllMail: () => {
    let list = []; for (const m of unclaimedMail()) list = list.concat(claimMail(m));
    if (!list.length) return;
    sfx("win"); rerender(); rewardModal("Received!", list, "Mail");
  },
  clearMail: () => { S.inbox = S.inbox.filter(m => !(m.claimed || (m.read && !hasRewards(m)))); sfx("tap"); rerender(); },
  achCat: d => { UI.achCat = d.c; rerender(); },
  setSound: d => { S.settings.sound = d.v === "1"; rerender(); },
  setSpeed: d => { S.settings.speed = +d.v; rerender(); },
  setAuto: d => { S.settings.auto = d.v === "1"; rerender(); },
  setAi: d => { S.settings.ai = d.v; rerender(); },
  setAvatar: d => { S.avatar = d.v; rerender(); },
  pickAvatar: d => { S.avatar = d.v; $$(".avpick button").forEach(b => b.classList.toggle("on", b.dataset.v === d.v)); const n = $("#nname"); if (n) n.placeholder = d.v === "leaf" ? "Leaf" : "Red"; },
  saveName: () => { const v = ($("#pname") || {}).value; S.name = (v || "").trim().slice(0, 12) || (S.avatar === "leaf" ? "Leaf" : "Red"); toast("Name saved."); rerender(); },
  askReset: () => resetModal(),
  doReset: () => {
    if ((($("#rconf") || {}).value || "").trim().toUpperCase() !== "DELETE") { toast("Type DELETE to confirm."); return; }
    clearTimeout(saveTimer);
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
    S = migrate(newSave()); save(); applyShell();
    UI.inGame = false; closeModal(); route("home"); showTitle();
  },
  toTitle: () => { save(); showTitle(); },
  titleSettings: () => { titleStart(); if (S.named) route("settings"); },
  titleCredits: () => {
    openModal(`<div class="stack" style="text-align:center"><h2>Credits</h2>
      <p class="small dim">Pokémon Kanto Squad is an unofficial, non-commercial fan game made with love for Pokémon Red and Blue.</p>
      <p class="small dim">Pokémon and all related names are © Nintendo, Game Freak and Creatures Inc.</p>
      <p class="small dim">Pokémon and trainer sprites come from Pokémon Showdown's sprite collection. Species, move and ability data come from PokeAPI.</p>
      <button class="btn wide" data-act="closeModal">Close</button></div>`);
  },
  nameGo: () => {
    const v = (($("#nname") || {}).value || "").trim().slice(0, 12);
    S.name = v || (S.avatar === "leaf" ? "Leaf" : "Red"); S.named = true; closeModal(); sfx("tap"); afterLogin();
  },
  pullFree10: async () => {
    if (!(S.inv.free10 > 0)) return;
    S.inv.free10--;
    await manifestWith(headhunt(10, !UI.hhStd));
  },
  pullGold5: async () => {
    if (!(S.inv.gold5 > 0)) return;
    S.inv.gold5--; S.daily.hh++;
    await manifestWith([pullOne(false, 5)], true);
  },
};
