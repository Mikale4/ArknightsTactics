
// =====================================================================
//  META — weekly themed Headhunting banners, the Inbox (mail from the
//  dev team, achievements, guild and Contract rewards) and Achievements.
// =====================================================================

// ---------- Headhunting banners: three themed banners rotate every Monday (UTC) ----------
// six = the theme's 6★ (one is featured each week, or two on Joint Operations), five/four = rate-up candidates
const BANNER_THEMES = [
  { id: "penguin", n: "Express Delivery", sub: "Penguin Logistics", d: "Lungmen's most reckless couriers are taking applications.", six: ["exusiai"], five: ["texas", "sora", "croissant", "bison"], col: "#f2c14e" },
  { id: "rhine", n: "Rhine Lab Research", sub: "Rhine Lab", d: "The Columbian lab's finest, on loan to Rhodes Island.", six: ["saria", "muelsyse", "ifrit"], five: ["silence", "ptilopsis"], col: "#5fd4ff" },
  { id: "hunters", n: "Abyssal Tide", sub: "Abyssal Hunters · Iberia", d: "From the drowned coast of Iberia, the sea's hunters answer.", six: ["skadi", "gladiia", "irene"], five: ["specter"], col: "#c83a4a" },
  { id: "kazimierz", n: "Knights of the Major", sub: "Kazimierz", d: "The Kazimierz Major's champions step out of the arena.", six: ["blemishine", "fartooth"], five: ["nearl", "ashlock", "wild-mane", "whislash"], col: "#e0c070" },
  { id: "siracusa", n: "Il Siracusano", sub: "Siracusa", d: "Family, law and old debts, settled in the rain.", six: ["penance"], five: ["lappland", "texas"], col: "#b23a3a" },
  { id: "lgd", n: "Guard Department", sub: "Lungmen", d: "Lungmen's finest keep the peace their own way.", six: ["hoshiguma", "lin"], five: ["swire", "waai-fu"], col: "#3a7ad8" },
  { id: "kjerag", n: "Snow-Capped Peaks", sub: "Kjerag · Karlan Trade", d: "SilverAsh's house brings the mountain's blessing.", six: ["silverash"], five: ["pramanix", "cliffheart"], four: ["courier", "matterhorn"], col: "#cfe8ff" },
  { id: "ursus", n: "Student Self-Governing Group", sub: "Ursus", d: "Kids who refused to break, all grown up.", six: ["rosa"], five: ["istina", "zima"], four: ["gummy"], col: "#d86a3a" },
  { id: "victoria", n: "Banner of Glasgow", sub: "Victoria", d: "The streets of Londinium remember who held them.", six: ["siege", "ines", "vigil"], five: ["indra", "morgan", "dagda"], col: "#8a9a84" },
  { id: "sui", n: "Sui's Garden", sub: "Yan", d: "The children of Sui wander back into the world.", six: ["nian", "dusk", "ling", "chongyue", "qiubai"], five: ["leizi", "hung"], col: "#d8a03a" },
  { id: "laterano", n: "Sanctum's Light", sub: "Laterano", d: "Halos and gunpowder, as is tradition.", six: ["mostima", "archetto"], five: ["executor"], col: "#ffe6a0" },
  { id: "rainbow", n: "Operation Lucent Arrowhead", sub: "Team Rainbow collaboration", d: "An elite counter-terror unit lands in Terra.", six: ["ash"], five: ["blitz", "tachanka", "frost"], col: "#3a8a5a" },
  { id: "higashi", n: "Blossoms of Higashi", sub: "Higashi", d: "Blades and petals from the far eastern isles.", six: ["saga"], five: ["akafuyu", "tsukinogi"], four: ["utage", "matoimaru", "shirayuki"], col: "#ff8aa8" },
  { id: "leithanien", n: "Leithanien Overture", sub: "Leithanien", d: "The music of the Arts, played for keeps.", six: ["ebenholz"], five: ["czerny"], col: "#9a7ad8" },
  { id: "rielite", n: "Elite Operators", sub: "Rhodes Island", d: "Rhodes Island's own heavy hitters.", six: ["blaze", "logos"], five: ["amiya"], col: "#5fd4ff" },
  { id: "dungeon", n: "Delicious in Dungeon", sub: "Collaboration", d: "An adventurer wanders in from a very hungry dungeon.", six: ["marcille"], five: [], col: "#a6d88a" },
  { id: "band", n: "Ave Mujica Live", sub: "Collaboration", d: "The stage lights come up on Terra.", six: ["togawa-sakiko"], five: [], col: "#8a5ad8" },
  { id: "joint_fire", n: "Joint Operation: Wildfire", sub: "Joint Operation", d: "Two 6★ operators share the spotlight.", joint: 1, six: ["surtr", "eyjafjalla", "ifrit"], five: ["flamebringer", "firewhistle", "skyfire"], col: "#ff7a3a" },
  { id: "joint_wall", n: "Joint Operation: Bulwark", sub: "Joint Operation", d: "Two 6★ operators share the spotlight.", joint: 1, six: ["mudrock", "saria", "hoshiguma", "eunectes"], five: ["liskarm", "nearl", "asbestos"], col: "#c8b06a" },
  { id: "joint_blade", n: "Joint Operation: Edge", sub: "Joint Operation", d: "Two 6★ operators share the spotlight.", joint: 1, six: ["thorns", "mountain", "hellagur", "pallas"], five: ["specter", "flint", "astesia"], col: "#c83a4a" },
  { id: "joint_support", n: "Joint Operation: Backline", sub: "Joint Operation", d: "Two 6★ operators share the spotlight.", joint: 1, six: ["suzuran", "nightingale", "angelina", "magallan", "lumen"], five: ["shamare", "warfarin", "breeze"], col: "#43d67e" },
].map(t => ({ ...t, six: t.six.filter(k => OPS[k]), five: t.five.filter(k => OPS[k]), four: (t.four || []).filter(k => OPS[k]) })).filter(t => t.six.length);
const BANNERS_PER_WEEK = 3;
const weekEnds = () => WEEK0 + (weekId() + 1) * WEEK_MS;
// the themed banners running this week (deterministic: every Doctor sees the same ones)
function bannersNow() {
  const w = weekId(), cycleLen = Math.ceil(BANNER_THEMES.length / BANNERS_PER_WEEK), cycle = Math.floor(w / cycleLen), pos = w % cycleLen;
  const rng = seeded(hash("bannercycle" + cycle)), order = BANNER_THEMES.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const out = [];
  for (let k = 0; k < BANNERS_PER_WEEK; k++) {
    const t = order[(pos * BANNERS_PER_WEEK + k) % order.length], r = seeded(hash(t.id + w));
    const sx = t.six.slice().sort(() => r() - .5), fv = t.five.slice().sort(() => r() - .5);
    out.push({ id: t.id + "@" + w, theme: t, n: t.n, sub: t.sub, d: t.d, col: t.col, joint: !!t.joint && sx.length > 1,
      feat6: t.joint && sx.length > 1 ? sx.slice(0, 2) : [sx[0]], feat5: fv.slice(0, 3), feat4: t.four.slice(0, 3), ends: weekEnds() });
  }
  return out;
}
const STD_BANNER = { id: "standard", n: "Rhodes Island Recruitment", sub: "Standard Headhunting", d: "Every 3★–6★ operator can appear.", col: "#5fd4ff", feat6: [], feat5: [], feat4: [], std: true };
const bannerById = id => id === "standard" ? STD_BANNER : bannersNow().find(b => b.id === id) || bannersNow()[0];
// compatibility: the old daily featured banner (the Demo's planning still asks for a featured 6★)
function bannerToday() { const b = bannersNow()[0]; return { feat6: b.feat6[0], feat5: b.feat5 }; }

// ---------- Inbox ----------
const MAIL_FROM = { dev: "Arknights Tactics Ops Team", sys: "Rhodes Island Logistics", ach: "Achievements", guild: "Guild", contract: "Contract Office" };
const MAIL_TTL = 30 * 864e5;
function sendMail(m) {
  S.mail = S.mail || [];
  S.mailSeq = (S.mailSeq || 0) + 1;
  const t = m.t || Date.now();
  S.mail.unshift({ id: S.mailSeq, t, read: false, claimed: !m.rewards || !Object.keys(m.rewards).length, exp: t + (m.ttl || MAIL_TTL), kind: m.kind || "sys", from: m.from || MAIL_FROM[m.kind || "sys"], title: m.title, body: m.body || "", rewards: m.rewards || null });
  S.mail.sort((a, b) => b.t - a.t);
  // keep the box tidy: drop expired mail and old read, empty mail
  const now = Date.now();
  S.mail = S.mail.filter(x => x.exp > now && !(x.claimed && x.read && now - x.t > 14 * 864e5)).slice(0, 150);
}
function claimMail(id) {
  const m = S.mail.find(x => x.id === id); if (!m) return [];
  m.read = true; if (m.claimed) return [];
  m.claimed = true; S.stats.mail = (S.stats.mail || 0) + 1;
  return give(m.rewards);
}
const mailUnread = () => (S.mail || []).filter(m => !m.read || !m.claimed).length;

// mail the dev team sends "occasionally": a weekly banner note plus a chance of a gift on any given day
const DEV_MAIL = [
  { title: "Emergency Maintenance Compensation", body: "We had to take the servers down unexpectedly today. Sorry for the trouble, Doctor. Please accept this as an apology.", rewards: { prime: 2, orundum: 200 } },
  { title: "Server Instability Compensation", body: "Some Doctors were disconnected during operations earlier. Here's something for the lost Sanity.", rewards: { orundum: 300, prime: 1 } },
  { title: "Thank You for Playing!", body: "Rhodes Island keeps growing because of Doctors like you. A small thank-you from all of us.", rewards: { permit: 1, lmd: 20000 } },
  { title: "Weekend Supply Drop", body: "The weekend's here. Logistics sent a crate of Battle Records and LMD your way.", rewards: { rec3: 5, lmd: 30000 } },
  { title: "Bug Fix Compensation", body: "We fixed an issue where module stats could display incorrectly. Thanks for your patience!", rewards: { orundum: 200, credit: 100 } },
  { title: "1,000,000 Doctors!", body: "We just passed one million Doctors. We couldn't have done it without you!", rewards: { permit: 2, prime: 1 } },
  { title: "Sanity Care Package", body: "Long operations are tiring. Take a break, Doctor, then take this.", rewards: { prime: 1 } },
  { title: "Logistics Support", body: "Promotion materials for your squad, courtesy of the Logistics Department.", rewards: { chip: 3, summ: 6 } },
  { title: "Contract Season Bonus", body: "The Contract Office is feeling generous this week. Good luck on the ladder!", rewards: { tokens: 120 } },
  { title: "Doctor Appreciation Day", body: "Today is all about you. Enjoy, and don't forget to eat something.", rewards: { orundum: 600 } },
  { title: "Patch Notes: Balance Update", body: "Several operator skills were adjusted this week. As always, here is a little something for the inconvenience.", rewards: { orundum: 300, credit: 120 } },
  { title: "Apology for Login Issues", body: "Some Doctors couldn't log in this morning. Sorry about that!", rewards: { prime: 1, orundum: 150 } },
];
// called from tickTimers: sends what arrived since the last check (at most a week back)
function mailTick(now) {
  if (!S.mailDay) { S.mailDay = today(); return; }
  const last = new Date(S.mailDay + "T00:00:00Z").getTime(), dayNow = new Date(today() + "T00:00:00Z").getTime();
  if (dayNow <= last) return;
  for (let d = Math.max(last + 864e5, dayNow - 6 * 864e5); d <= dayNow; d += 864e5) {
    const day = new Date(d).toISOString().slice(0, 10), rng = seeded(hash("devmail" + day)), t = d + Math.floor(rng() * 8 * 3600e3);
    // Monday: the new banners are live
    if (new Date(d).getUTCDay() === 1) {
      const names = bannersNow().map(b => `${b.n} (${b.feat6.map(k => OPS[k].n).join(" & ")})`).join(", ");
      sendMail({ kind: "dev", t: Math.min(now, d + 3600e3), title: "New Headhunting banners are live!", body: `This week: ${names}. Here's a permit to try your luck, Doctor.`, rewards: { permit: 1 } });
    }
    if (rng() < .35) sendMail({ kind: "dev", t: Math.min(now, t), ...DEV_MAIL[Math.floor(rng() * DEV_MAIL.length)] });
  }
  S.mailDay = today();
}
function welcomeMail() {
  sendMail({ kind: "dev", title: "Welcome to Rhodes Island, Doctor!", body: "Thank you for joining us. To get your squad started, here is a free ten-roll Headhunting Permit. Use it on any banner in Headhunting. Good luck!", rewards: { hh10: 1, orundum: 600 }, ttl: 90 * 864e5 });
}

// ---------- Achievements (rewards go to the Inbox) ----------
const ACH_CATS = [["story", "Main Theme"], ["ops", "Operators"], ["battle", "Combat"], ["terminal", "Terminal"], ["contract", "Contracts"], ["hh", "Headhunting"], ["guild", "Guild & Social"], ["doctor", "Doctor"]];
const statOf = k => (S.stats && S.stats[k]) || 0;
function stat(k, n = 1) { S.stats[k] = (S.stats[k] || 0) + n; }
const opsWhere = f => Object.entries(S.ops).filter(([k, p]) => f(p, k)).length;
function achTiers(id, cat, names, desc, val, goals, rewards) {
  return goals.map((g, i) => ({ id: id + (i + 1), cat, n: names[Math.min(i, names.length - 1)], d: desc.replace("{n}", fmtFull(g)), val, goal: g, reward: rewards[i] }));
}
const ACHV = [
  ...achTiers("story", "story", ["First Steps", "Into the Fire", "Veteran of Chernobog", "Every Last Stage"], "Clear {n} Main Theme stages", () => Object.keys(S.story).length, [5, 25, 60, 120], [{ orundum: 100 }, { orundum: 200 }, { orundum: 400, permit: 1 }, { orundum: 800, permit: 2 }]),
  ...achTiers("stars", "story", ["Perfectionist", "Flawless Commander", "Three-Star Legend"], "Earn 3 stars on {n} stages", () => Object.values(S.story).filter(v => v >= 3).length, [10, 40, 100], [{ orundum: 150 }, { orundum: 300, chip: 2 }, { orundum: 600, permit: 2 }]),
  ...achTiers("eps", "story", ["Chapter Closed", "Storyteller", "The Long Road"], "Clear {n} Main Theme episodes", () => CHAPTERS.filter(chapterCleared).length, [1, 5, 10], [{ lmd: 10000 }, { orundum: 400 }, { orundum: 800, permit: 3 }]),
  ...achTiers("bosses", "story", ["Giant Slayer", "Boss Hunter"], "Defeat {n} Main Theme bosses", () => Object.values(NODES).filter(n => n.type === "boss" && nodeStars(n.id)).length, [3, 10], [{ orundum: 200 }, { orundum: 500, permit: 1 }]),
  ...achTiers("ops", "ops", ["Recruiter", "Growing Roster", "Full House", "Collector"], "Recruit {n} operators", () => Object.keys(S.ops).length, [10, 30, 60, 120], [{ orundum: 100 }, { orundum: 250 }, { orundum: 500, permit: 1 }, { orundum: 1000, permit: 3 }]),
  ...achTiers("six", "ops", ["Shooting Star", "Constellation", "Galaxy"], "Own {n} 6★ operators", () => opsWhere((p, k) => OPS[k].rar === 6), [1, 5, 15], [{ orundum: 200 }, { orundum: 500 }, { permit: 3 }]),
  ...achTiers("e2", "ops", ["Elite Promotion", "Elite Squad", "Elite Corps"], "Promote {n} operators to Elite 2", () => opsWhere(p => p.elite >= 2), [1, 4, 12], [{ chip: 2 }, { orundum: 400, chip: 4 }, { orundum: 800, permit: 2 }]),
  ...achTiers("sk7", "ops", ["Skill Mastery", "Specialist Training"], "Raise {n} skills to Skill Level 7", () => Object.values(S.ops).reduce((a, p) => a + p.sk.filter(v => v >= 7).length, 0), [1, 10], [{ summ: 6 }, { orundum: 500, summ: 12 }]),
  ...achTiers("pot", "ops", ["Full Potential"], "Raise an operator to Potential {n}", () => Math.max(1, ...Object.values(S.ops).map(p => p.pot)), [6], [{ cert: 20, orundum: 300 }]),
  ...achTiers("lv", "ops", ["Maxed Out"], "Bring an operator to Elite 2 Lv {n}", () => Math.max(0, ...Object.values(S.ops).map(p => p.elite >= 2 ? p.lvl : 0)), [70], [{ orundum: 500, rec4: 5 }]),
  ...achTiers("wins", "battle", ["Battle-Tested", "Field Commander", "Tactician", "Strategist"], "Win {n} battles", () => S.stats.wins, [10, 100, 500, 2000], [{ lmd: 5000 }, { orundum: 200 }, { orundum: 500 }, { orundum: 1000, permit: 2 }]),
  ...achTiers("kills", "battle", ["Clean Sweep", "Exterminator"], "Defeat {n} enemies", () => statOf("kills"), [100, 2500], [{ lmd: 10000 }, { orundum: 400, chip: 3 }]),
  ...achTiers("skills", "battle", ["Arts Unleashed", "Signature Move"], "Use {n} skills in battle", () => statOf("skills"), [50, 1000], [{ summ: 3 }, { orundum: 300, summ: 9 }]),
  ...achTiers("crits", "battle", ["Critical Thinking"], "Land {n} critical hits", () => statOf("crits"), [500], [{ orundum: 300 }]),
  ...achTiers("hunt", "terminal", ["Supply Run", "Quartermaster"], "Clear {n} Supplies operations", () => statOf("hunts"), [10, 100], [{ lmd: 15000 }, { orundum: 400, rune: 5 }]),
  ...achTiers("sss", "terminal", ["Security Clearance", "Tower Climber", "Top Floor"], "Clear SSS floor {n}", () => S.tower, [5, 15, 30], [{ orundum: 200 }, { orundum: 400 }, { orundum: 800, permit: 2 }]),
  ...achTiers("t5", "terminal", ["Prized Module", "Module Hoard"], "Own {n} T5 modules", () => S.runes.filter(r => r.rar >= 5).length, [1, 12], [{ lmd: 20000 }, { orundum: 500 }]),
  ...achTiers("m15", "terminal", ["Fine-Tuned", "Overclocked"], "Upgrade {n} modules to +15", () => S.runes.filter(r => r.lvl >= 15).length, [1, 8], [{ lmd: 30000 }, { orundum: 500, permit: 1 }]),
  ...achTiers("ccw", "contract", ["First Blood", "Contract Regular", "Contract Veteran"], "Win {n} Contingency Contract battles", () => S.ladder.wins, [1, 50, 300], [{ tokens: 50 }, { tokens: 200, orundum: 300 }, { tokens: 500, permit: 2 }]),
  ...achTiers("rtaw", "contract", ["Live Wire", "Draft Master"], "Win {n} Real-Time Contract matches", () => S.rta.wins, [1, 50], [{ tokens: 50 }, { tokens: 300, orundum: 500 }]),
  ...achTiers("cct", "contract", ["Silver Lining", "Gold Standard", "Diamond Mind", "Master Class", "Legendary"], "Reach {n} points in Contingency Contract", () => S.ladder.best, [1300, 1600, 2200, 2500, 3100], [{ tokens: 50 }, { tokens: 100 }, { tokens: 200, orundum: 300 }, { tokens: 300, orundum: 500 }, { tokens: 500, permit: 3 }]),
  ...achTiers("rtat", "contract", ["Quick Draw", "Ban Phase", "Live Legend"], "Reach {n} points in Real-Time Contract", () => S.rta.best, [1600, 2200, 3100], [{ tokens: 100 }, { tokens: 250, orundum: 300 }, { tokens: 500, permit: 3 }]),
  ...achTiers("pulls", "hh", ["First Headhunt", "Regular Customer", "Whale Watching", "Gacha Addict"], "Headhunt {n} times", () => S.gacha.total, [1, 50, 300, 1000], [{ orundum: 100 }, { orundum: 300 }, { permit: 2 }, { permit: 5 }]),
  ...achTiers("sixpull", "hh", ["Golden Signal", "Lucky Doctor"], "Headhunt {n} 6★ operators", () => statOf("sixes"), [1, 10], [{ orundum: 300 }, { permit: 2 }]),
  ...achTiers("guildjoin", "guild", ["Better Together"], "Join or create a guild", () => S.guild ? 1 : statOf("guilds"), [1], [{ orundum: 200 }]),
  ...achTiers("donate", "guild", ["Generous", "Patron", "Benefactor"], "Donate to your guild {n} times", () => statOf("donations"), [1, 20, 100], [{ lmd: 10000 }, { orundum: 300 }, { orundum: 600, permit: 1 }]),
  ...achTiers("gboss", "guild", ["Raid Night", "Boss Breaker", "Raid Leader"], "Attack the guild boss {n} times", () => statOf("bossHits"), [1, 20, 100], [{ lmd: 10000 }, { orundum: 300, chip: 2 }, { orundum: 800, permit: 2 }]),
  ...achTiers("gdmg", "guild", ["Heavy Hitter", "Siege Engine"], "Deal {n} total damage to guild bosses", () => statOf("bossDmg"), [1e6, 5e7], [{ orundum: 300 }, { orundum: 800, permit: 2 }]),
  ...achTiers("chat", "guild", ["Hello, World", "Regular", "Chatterbox"], "Send {n} chat messages", () => statOf("chats"), [1, 50, 300], [{ credit: 50 }, { credit: 150 }, { orundum: 300 }]),
  ...achTiers("invite", "guild", ["Recruiter"], "Get {n} Doctors to join your guild", () => statOf("recruits"), [5], [{ orundum: 400 }]),
  ...achTiers("dlv", "doctor", ["Rookie Doctor", "Seasoned Doctor", "Senior Doctor", "Rhodes Island Legend"], "Reach Doctor level {n}", () => S.lvl, [10, 30, 60, 100], [{ orundum: 100 }, { orundum: 300 }, { orundum: 600, permit: 1 }, { orundum: 1000, permit: 3 }]),
  ...achTiers("san", "doctor", ["Overtime", "No Sleep"], "Spend {n} Sanity", () => statOf("sanity"), [500, 10000], [{ prime: 1 }, { prime: 3 }]),
  ...achTiers("mail", "doctor", ["You've Got Mail"], "Claim {n} Inbox rewards", () => statOf("mail"), [10], [{ orundum: 200 }]),
];
// unlocked achievements post their rewards to the Inbox; toasts only when the player is in the game
function achTick() {
  S.ach2 = S.ach2 || {};
  let n = 0;
  for (const a of ACHV) {
    if (S.ach2[a.id]) continue;
    let v = 0; try { v = a.val(); } catch (e) { v = 0; }
    if (v >= a.goal) {
      S.ach2[a.id] = Date.now(); n++;
      sendMail({ kind: "ach", title: `Achievement: ${a.n}`, body: `You completed "${a.d}". Well done, Doctor!`, rewards: a.reward });
      if (n <= 2 && typeof toast === "function" && $("#toast")) toast(`Achievement unlocked: ${a.n}`, "gold");
    }
  }
  return n;
}
