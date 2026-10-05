
// =====================================================================
//  PEOPLE — the simulated Doctors behind both Contract ladders.
//  Every Doctor (ladder index i) has a personality rebuilt from the save's ladder seed:
//  an archetype, temperament, typing style, favourite operators, a time zone and play
//  schedule. They come online and go offline on their own, chat in World and Guild chat,
//  answer the player, whisper after Contract fights, run and join guilds, donate and hit
//  guild bosses. Lines come from CHAT_LINES (a6c_lines.js); personal state lives in S.npc.
// =====================================================================
const ARCHS = [
  { id: "veteran", v: ["elder", "chill", "mentor"], w: q => .4 + q, soc: [.3, .7], warm: [.4, .8], salt: [.1, .5], help: [.5, .95] },
  { id: "newbie", v: ["newbie", "warm", "hype"], w: q => 1.8 * (1 - q) * (1 - q), soc: [.3, .85], warm: [.5, .95], salt: [0, .3], help: [0, .2] },
  { id: "whale", v: ["whale", "hype", "snarky"], w: q => 1.3 * q * q, soc: [.3, .8], warm: [.3, .7], salt: [.1, .5], help: [.2, .6] },
  { id: "f2p", v: ["f2p", "salty", "chill"], w: () => .7, soc: [.3, .7], warm: [.3, .7], salt: [.3, .7], help: [.3, .7] },
  { id: "collector", v: ["warm", "hype"], w: () => .6, soc: [.4, .8], warm: [.6, .95], salt: [0, .3], help: [.2, .6] },
  { id: "lore", v: ["lore", "rp", "chill"], w: () => .45, soc: [.3, .7], warm: [.5, .9], salt: [0, .3], help: [.4, .8] },
  { id: "memer", v: ["meme", "snarky", "hype"], w: () => .7, soc: [.6, 1], warm: [.4, .8], salt: [.2, .6], help: [.1, .5] },
  { id: "tryhard", v: ["tryhard", "snarky", "mentor"], w: q => .2 + q * 1.2, soc: [.3, .7], warm: [.2, .6], salt: [.4, .8], help: [.4, .8] },
  { id: "casual", v: ["chill", "warm"], w: () => 1, soc: [.2, .6], warm: [.5, .9], salt: [.1, .4], help: [.2, .6] },
  { id: "mentor", v: ["mentor", "warm", "elder"], w: q => .15 + q * .6, soc: [.4, .8], warm: [.6, 1], salt: [0, .2], help: [.8, 1] },
  { id: "salty", v: ["salty", "snarky"], w: () => .45, soc: [.4, .8], warm: [.1, .4], salt: [.7, 1], help: [.1, .5] },
  { id: "lurker", v: ["shy", "chill"], w: () => 1.1, soc: [0, .07], warm: [.3, .8], salt: [0, .4], help: [.1, .5] },
  { id: "hypebeast", v: ["hype", "meme"], w: () => .5, soc: [.6, 1], warm: [.6, 1], salt: [0, .3], help: [.1, .4] },
  { id: "roleplayer", v: ["rp", "lore", "warm"], w: () => .22, soc: [.4, .8], warm: [.6, .95], salt: [0, .2], help: [.3, .7] },
  { id: "recruiter", v: ["warm", "tryhard", "hype"], w: q => .12 + q * .3, soc: [.6, 1], warm: [.6, .95], salt: [0, .3], help: [.5, .9] },
  { id: "shy", v: ["shy", "warm"], w: () => .5, soc: [.1, .35], warm: [.6, 1], salt: [0, .2], help: [.2, .6] },
];
const ARCH_NAME = { veteran: "Veteran", newbie: "New Doctor", whale: "Big spender", f2p: "Free-to-play", collector: "Collector", lore: "Lore buff", memer: "Joker",
  tryhard: "Competitive", casual: "Casual", mentor: "Mentor", salty: "Salty", lurker: "Lurker", hypebeast: "Hype", roleplayer: "Roleplayer", recruiter: "Recruiter", shy: "Shy" };
const EMOJI = { hype: ["🔥", "💯", "🎉", "😤", "🙌"], warm: ["😊", "❤️", "🥰", "✨", "🙂"], meme: ["💀", "😭", "🤡", "😂", "🗿"], salty: ["🙄", "😑", "😒", "🫠"],
  shy: ["🥺", "😳", "👉👈"], chill: ["👍", "😎", "🍵"], whale: ["💸", "💎", "👑"], f2p: ["🥲", "💀", "🙏"], tryhard: ["⚔️", "📈", "🧠"], newbie: ["🥺", "🙏", "😅"],
  lore: ["📖", "🕯️"], rp: ["🫡", "📋"], elder: ["👴", "🍵"], mentor: ["👍", "📘"], snarky: ["😏", "🙃"] };
const KAO = ["(｡•̀ᴗ-)✧", "(╯°□°)╯︵ ┻━┻", "ʕ•ᴥ•ʔ", "(´；ω；`)", "(￣▽￣)", "( ˘ω˘ )", "(ง •̀_•́)ง", "¯\\_(ツ)_/¯", "(⌐■_■)", "(・・;)", "(*^▽^*)", "( •̀ ω •́ )✧"];
const LAUGHS = ["lol", "lol", "lmao", "LOL", "xD", "haha", "hahaha", "kek", "www", "lmfao", "ahaha", "rofl", "hehe"];
const ABBR = { you: "u", your: "ur", "you're": "ur", are: "r", though: "tho", "right now": "rn", "to be honest": "tbh", "i don't know": "idk", "in my opinion": "imo",
  probably: "prob", because: "cuz", please: "pls", thanks: "thx", okay: "ok", people: "ppl", really: "rly", tonight: "tn", tomorrow: "tmrw", seriously: "srsly",
  definitely: "def", something: "smth", honestly: "honestly", "not gonna lie": "ngl", "oh my god": "omg", "for real": "fr", "by the way": "btw", "let me know": "lmk" };
const ABBR_RE = new RegExp("\\b(" + Object.keys(ABBR).map(k => k.replace("'", "'")).join("|") + ")\\b", "gi");
const TZS = [-8, -7, -6, -5, -5, -4, -3, 0, 0, 1, 1, 2, 3, 5.5, 7, 8, 8, 8, 9, 9, 10, 11];

const PEOPLE = new Map();
const rr = (rng, [a, b]) => a + (b - a) * rng();
// the personality of Doctor i (deterministic per save)
function person(i) {
  const key = S.ladder.seed + ":" + i;
  if (PEOPLE.has(key)) return PEOPLE.get(key);
  const q = ladderQ(i), name = docName(seeded(hash(key))), rng = seeded(hash("persona" + key));
  const tot = ARCHS.reduce((a, A) => a + A.w(q), 0);
  let x = rng() * tot, A = ARCHS[0];
  for (const c of ARCHS) { x -= c.w(q); if (x <= 0) { A = c; break; } }
  const extra = ["warm", "hype", "chill", "salty", "snarky", "meme", "shy"][Math.floor(rng() * 7)];
  const voices = [...A.v, extra];
  const style = {
    lower: rng() < .55, caps: rng() < .04, noPunct: rng() < .5, abbr: rng() < .45 ? .3 + rng() * .6 : 0, typo: rng() < .25 ? .1 + rng() * .25 : 0,
    laugh: LAUGHS[Math.floor(rng() * LAUGHS.length)], emoji: rng() < .4 ? (EMOJI[A.v[0]] || EMOJI.warm) : null, emojiRate: .15 + rng() * .4,
    kao: rng() < .1, stretch: rng() < .2, exclaim: rng() < .3 ? "!!" : rng() < .2 ? "!!!" : "!", ellipsis: rng() < .15, tilde: rng() < .07,
  };
  // favourites: what they own and love; collectors and roleplayers pick from anywhere
  const pool = (A.id === "collector" || A.id === "roleplayer" || rng() < .3) ? OP_KEYS.filter(k => OPS[k].rar >= 4) : OP_KEYS.filter(k => OPS[k].rar >= (q > .6 ? 5 : 3));
  const fav = [];
  while (fav.length < 3) { const k = pool[Math.floor(rng() * pool.length)]; if (!fav.includes(k)) fav.push(k); }
  const p = {
    i, q, name, arch: A.id, voices,
    soc: rr(rng, A.soc), warm: rr(rng, A.warm), salt: rr(rng, A.salt), help: rr(rng, A.help), humor: rng(), loyal: rng(), ego: rng() * (.4 + q * .6),
    style, fav, tz: TZS[Math.floor(rng() * TZS.length)] + (rng() < .5 ? 0 : 1),
    start: 7 + Math.floor(rng() * 16), len: 1.5 + rng() * (A.id === "lurker" ? 3 : 7) + (q > .8 ? 3 : 0), act: .35 + rng() * .6 + (q > .8 ? .15 : 0),
    lvl: clamp(Math.round(8 + 112 * Math.pow(q, .85) + (rng() - .5) * 10), 3, 120),
    bio: (typeof DOC_BIOS !== "undefined" && DOC_BIOS.length ? DOC_BIOS[Math.floor(rng() * DOC_BIOS.length)] : "Doctor of Rhodes Island."),
    joined: Math.floor(rng() * 900) + 30,
  };
  p.bio = p.bio.replace(/\{op\}/g, OPS[fav[0]].n);
  PEOPLE.set(key, p);
  if (PEOPLE.size > 2000) PEOPLE.delete(PEOPLE.keys().next().value);
  return p;
}
const npcState = i => (S.npc[i] = S.npc[i] || {});
const npcName = i => i === -1 ? S.name : i === -2 ? "System" : person(i).name;

// ---------- presence ----------
// online during their play window on days they play, plus a short daily check-in
function isOnline(i, now = Date.now()) {
  const p = person(i), local = now + p.tz * 3600e3, day = Math.floor(local / 864e5), h = (local % 864e5) / 3600e3;
  if (S.npc[i] && S.npc[i].away > now) return false;
  if (seeded(hash(i + ":day" + day))() < p.act) {
    const s = p.start, e = s + p.len;
    if ((h >= s && h < e) || (e > 24 && h < e - 24)) return true;
  }
  const ci = hash(i + "ci" + day) % 24;
  return h >= ci && h < ci + .34;
}
let ONLINE = { t: 0, list: [] };
function onlineNow(now = Date.now()) {
  if (now - ONLINE.t < 60000 && ONLINE.list.length) return ONLINE.list;
  const list = [];
  for (let i = 0; i < LADDER_N; i++) if (isOnline(i, now)) list.push(i);
  return (ONLINE = { t: now, list }).list;
}
function nextOnline(i, now) { for (let t = now; t < now + 30 * 3600e3; t += 10 * 60e3) if (isOnline(i, t)) return t + Math.random() * 5 * 60e3; return now + 24 * 3600e3; }
function lastSeen(i, now = Date.now()) { if (isOnline(i, now)) return 0; for (let t = now; t > now - 7 * 864e5; t -= 30 * 60e3) if (isOnline(i, t)) return now - t; return 7 * 864e5; }

// ---------- typing style ----------
function styleText(p, txt) {
  const st = p.style, rnd = Math.random;
  let s = txt;
  if (st.abbr) s = s.replace(ABBR_RE, w => rnd() < st.abbr ? ABBR[w.toLowerCase()] || w : w);
  s = s.replace(/\b(lol|lmao|haha)\b/gi, () => st.laugh);
  if (st.lower) s = s.toLowerCase();
  if (st.noPunct) s = s.replace(/[.,](?=\s|$)/g, "").replace(/'/g, rnd() < .5 ? "" : "'");
  if (st.ellipsis && rnd() < .35) s = s.replace(/[.!]?$/, "...");
  if (st.exclaim !== "!") s = s.replace(/!+$/, st.exclaim);
  if (st.stretch && rnd() < .3) s = s.replace(/\b(so|no|yes|omg|nice|please|pls|why|what)\b/i, w => w + w.slice(-1).repeat(2 + Math.floor(rnd() * 3)));
  if (st.typo && rnd() < st.typo) { const ws = s.split(" "), j = Math.floor(rnd() * ws.length), w = ws[j]; if (w.length > 4) { const c = 1 + Math.floor(rnd() * (w.length - 3)); ws[j] = w.slice(0, c) + w[c + 1] + w[c] + w.slice(c + 2); s = ws.join(" "); } }
  if (st.caps && rnd() < .6) s = s.toUpperCase();
  if (st.emoji && rnd() < st.emojiRate) s += " " + st.emoji[Math.floor(rnd() * st.emoji.length)];
  else if (st.kao && rnd() < .3) s += " " + KAO[Math.floor(rnd() * KAO.length)];
  if (st.tilde && rnd() < .4) s += "~";
  return s.trim().slice(0, 180);
}

// ---------- lines ----------
const LINES_FALLBACK = {
  reply_default: ["true", "same", "fair", "real", "yeah", "mood"], greet_generic: ["hi all", "hey everyone", "o/"], reply_greet: ["hey {to}", "hi {to}!", "yo {to}"],
  reply_congrats: ["grats {to}!", "nice pull {to}", "congrats!!"], reply_condolence: ["rip", "unlucky {to}", "it'll come"], quiet: ["o7", "same", "lol"],
};
const RECENT_LINES = [];
function linePick(topic, p) {
  const list = (typeof CHAT_LINES !== "undefined" && CHAT_LINES[topic]) || LINES_FALLBACK[topic] || LINES_FALLBACK.reply_default;
  let tot = 0;
  const ws = list.map(e => {
    const v = typeof e === "string" ? null : [].concat(e.v || []), t = typeof e === "string" ? e : e.t;
    let w = !v || !v.length ? 1 : v.some(x => p.voices.includes(x)) ? (v.includes(p.voices[0]) ? 4 : 2.5) : 0;
    if (RECENT_LINES.includes(t)) w *= .05;
    tot += w; return w;
  });
  if (tot <= 0) return typeof list[0] === "string" ? list[0] : list[0].t;
  let x = Math.random() * tot;
  for (let k = 0; k < list.length; k++) { x -= ws[k]; if (x <= 0) { const e = list[k], t = typeof e === "string" ? e : e.t; RECENT_LINES.push(t); if (RECENT_LINES.length > 80) RECENT_LINES.shift(); return t; } }
  const e = list[list.length - 1]; return typeof e === "string" ? e : e.t;
}
const META_OPS = () => metaPool();
function fillSlots(t, p, sl = {}) {
  const bn = bannersNow(), b = pick(bn), g = guildOf(p.i);
  const val = {
    me: p.name, to: sl.to || pick(onlineNow()).toString(), op: OPS[p.fav[0]].n, op2: sl.op2 || OPS[pick(META_OPS())].n,
    six: sl.six || OPS[pick(b.feat6)].n, banner: sl.banner || b.n, tier: sl.tier || tierOf(S.ladder.pop[p.i]).n, pts: fmtFull(S.ladder.pop[p.i]),
    guild: sl.guild || (g ? g.name : guildList().length ? pick(guildList()).name : "my guild"), boss: sl.boss || ENEMY[gBossKey(g || { id: "x" })].n,
    stage: sl.stage || pick(Object.values(NODES).filter(n => n.waves)).id, ep: sl.ep || pick(CHAPTERS).title, n: sl.n || (2 + Math.floor(Math.random() * 60)),
    lvl: p.lvl, dmg: sl.dmg || fmt(Math.round((.4 + p.q * 3) * (1 + Math.random()) * 1e6)),
  };
  if (/^\d+$/.test(val.to)) val.to = npcName(+val.to);
  return t.replace(/\{(\w+)\}/g, (m, k) => val[k] != null ? val[k] : m);
}
function npcLine(p, topic, sl) { return styleText(p, fillSlots(linePick(topic, p), p, sl)); }

// ---------- chat logs ----------
const CHAT_MAX = 70;
function chatInit() {
  S.chat = S.chat || { world: [], guild: [], dm: {}, unread: { world: 0, guild: 0, dm: 0 }, next: 0, gnext: 0, last: 0, q: [] };
  S.npc = S.npc || {};
  S.blocked = S.blocked || {};
}
function pushMsg(ch, m, dmWith) {
  const C = S.chat;
  if (m.i >= 0 && S.blocked[m.i]) return;
  const list = ch === "dm" ? (C.dm[dmWith] = C.dm[dmWith] || []) : C[ch];
  list.push(m);
  if (list.length > CHAT_MAX) list.splice(0, list.length - CHAT_MAX);
  if (ch === "dm") { const keys = Object.keys(C.dm); if (keys.length > 40) { keys.sort((a, b) => (C.dm[a].slice(-1)[0] || {}).t - (C.dm[b].slice(-1)[0] || {}).t); delete C.dm[keys[0]]; } }
  if (m.i !== -1 && !(UI.view === "chat" && UI.chatTab === (ch === "dm" ? "dm:" + dmWith : ch))) {
    if (ch === "dm") { C.unread.dm++; npcState(dmWith).unread = (npcState(dmWith).unread || 0) + 1; }
    else if (ch === "guild") C.unread.guild++;
    else C.unread.world++;
  }
  chatUpdated(ch, m, dmWith);
}
// screens hook in here (a9f_social.js redraws the open chat, the lobby ticker and badges)
let chatUpdated = () => {};
function npcSay(ch, i, topic, sl = {}, at = Date.now(), dmWith) {
  const p = person(i), txt = npcLine(p, topic, sl);
  pushMsg(ch, { t: at, i, txt }, dmWith != null ? dmWith : i);
  return txt;
}
function sysMsg(ch, txt) { pushMsg(ch, { t: Date.now(), i: -2, txt }); }
// a reply in a few seconds (typing time grows with length)
function later(ms, ch, i, topic, sl, dmWith) { S.chat.q.push({ at: Date.now() + ms, ch, i, topic, sl, dm: dmWith }); }

// ---------- world chat: what Doctors talk about ----------
function topicFor(p, now) {
  const st = npcState(p.i), local = new Date(now + p.tz * 3600e3), h = local.getUTCHours(), dayKey = Math.floor((now + p.tz * 3600e3) / 864e5);
  const w = {};
  const add = (k, v) => { w[k] = (w[k] || 0) + v; };
  if (st.greet !== dayKey) { add(h < 12 ? "greet_morning" : h >= 18 ? "greet_evening" : "greet_generic", 6); }
  const dow = new Date(now).getUTCDay();
  add("banner_hype", dow <= 2 ? 1.6 : .8); add("saving_for", .4); add("banner_skip", .3);
  add("pull_win", .5 + p.q * .4); add("pull_loss", .7); add("pity_salt", .2 + p.salt * .4); add("potential", .2 + p.q * .2);
  const pvp = p.arch === "tryhard" || p.arch === "whale" ? 2 : .5;
  add("pvp_win", .4 * pvp); add("pvp_loss", .5 * pvp * (.5 + p.salt)); add("pvp_meta", .4 * pvp); add("pvp_climb", .2 * pvp); add("rta_draft", .3 * pvp); add("defense_hit", .25 * pvp);
  const nb = p.arch === "newbie" ? 3 : (1 - p.q);
  add("ask_help", .6 * nb); add("ask_build", .4 * nb); add("stuck_stage", .5 * nb);
  add("lore", p.arch === "lore" || p.arch === "roleplayer" ? 2 : .3); add("waifu", p.arch === "collector" ? 2 : .4);
  add("farming", .5); add("module_rng", .3); add("sanity", .35); add("sss", .2); add("cleared_stage", .35 * (1 - p.q) + .1);
  add("irl", .6); add("random_meme", p.arch === "memer" || p.arch === "hypebeast" ? 2 : .4); add("quiet", p.arch === "lurker" || p.arch === "shy" ? 2 : .4);
  if (S.mail && S.mail.some(m => m.kind === "dev" && /Compensation|Maintenance|Issues|Fix|Patch/.test(m.title) && now - m.t < 864e5)) add("maintenance", .8);
  if (dow === 1) add("event_news", 1);
  const g = guildOf(p.i);
  if (g && g.lead === p.i && g.mem.length < guildCap(g) && g.pol !== "closed") add("guild_recruit", p.arch === "recruiter" ? 3 : 1);
  if (!g && p.soc > .4) add("lfg", .3);
  if (h >= 23 || h < 4) add("leave", 1);
  let tot = 0; for (const k in w) tot += w[k];
  let x = Math.random() * tot;
  for (const k in w) { x -= w[k]; if (x <= 0) return k; }
  return "quiet";
}
// who answers what (topic → reaction topic and the kind of person who reacts)
const REACT = {
  ask_help: { t: "reply_help_generic", who: p => p.help, n: [1, 2], p: .9, back: "reply_thanks" }, ask_build: { t: "reply_help_build", who: p => p.help, n: [1, 2], p: .85, back: "reply_thanks" },
  stuck_stage: { t: "reply_help_generic", who: p => p.help, n: [1, 1], p: .7, back: "reply_thanks" },
  pull_win: { t: "reply_congrats", who: p => p.warm, n: [1, 3], p: .8 }, pull_loss: { t: "reply_condolence", who: p => p.warm, n: [0, 2], p: .6, alt: ["reply_laugh", p => p.humor * (1 - p.warm)] },
  pity_salt: { t: "reply_condolence", who: p => p.warm, n: [0, 1], p: .5 }, random_meme: { t: "reply_laugh", who: p => p.humor, n: [0, 2], p: .6 },
  lore: { t: "reply_lore", who: p => p.arch === "lore" || p.arch === "roleplayer" ? 1 : .2, n: [0, 1], p: .55 }, waifu: { t: "reply_op_love", who: p => p.warm, n: [0, 1], p: .45, alt: ["reply_op_meh", p => p.salt] },
  pvp_meta: { t: "reply_agree", who: p => p.q, n: [0, 2], p: .6, alt: ["reply_disagree", p => p.ego] }, pvp_loss: { t: "reply_condolence", who: p => p.warm, n: [0, 1], p: .4, alt: ["reply_laugh", p => p.humor] },
  greet_morning: { t: "reply_greet", who: p => p.warm, n: [0, 2], p: .55 }, greet_evening: { t: "reply_greet", who: p => p.warm, n: [0, 2], p: .55 }, greet_generic: { t: "reply_greet", who: p => p.warm, n: [0, 1], p: .45 },
  banner_hype: { t: "reply_agree", who: p => p.soc, n: [0, 1], p: .45 }, banner_skip: { t: "reply_disagree", who: p => p.ego, n: [0, 1], p: .35 },
  irl: { t: "reply_default", who: p => p.warm, n: [0, 1], p: .4 }, pvp_climb: { t: "reply_congrats", who: p => p.warm, n: [0, 2], p: .6 }, cleared_stage: { t: "reply_congrats", who: p => p.warm, n: [0, 1], p: .45 },
  lfg: { t: "reply_mention", who: p => { const g = guildOf(p.i); return g && g.lead === p.i ? 1 : 0; }, n: [0, 1], p: .5 },
};
function pickBy(cands, fn, avoid = []) {
  const c = cands.filter(i => !avoid.includes(i) && !S.blocked[i]);
  let tot = 0; const ws = c.map(i => { const w = Math.max(0, fn(person(i))); tot += w; return w; });
  if (tot <= 0) return null;
  let x = Math.random() * tot;
  for (let k = 0; k < c.length; k++) { x -= ws[k]; if (x <= 0) return c[k]; }
  return c[c.length - 1];
}
function react(ch, from, topic, cands, sl = {}) {
  const R0 = REACT[topic]; if (!R0 || Math.random() > R0.p) return;
  const n = R0.n[0] + Math.floor(Math.random() * (R0.n[1] - R0.n[0] + 1)), used = [from];
  let delay = 4000 + Math.random() * 9000;
  for (let k = 0; k < n; k++) {
    const i = pickBy(cands, p => R0.who(p) * (.3 + p.soc), used); if (i == null) break;
    used.push(i);
    let t = R0.t;
    if (R0.alt && Math.random() < R0.alt[1](person(i)) * .6) t = R0.alt[0];
    later(delay, ch, i, t, { ...sl, to: from === -1 ? S.name : npcName(from) });
    delay += 3000 + Math.random() * 12000;
  }
  if (R0.back && n && from >= 0 && Math.random() < person(from).warm) later(delay + 4000 + Math.random() * 8000, ch, from, R0.back, { to: npcName(used[1]) });
}
function worldEvent(now) {
  const on = onlineNow(now); if (!on.length) return;
  const recent = S.chat.world.slice(-4).map(m => m.i);
  const i = pickBy(on, p => p.soc * p.soc, recent); if (i == null) return;
  const p = person(i), topic = topicFor(p, now), st = npcState(i);
  if (topic.startsWith("greet")) st.greet = Math.floor((now + p.tz * 3600e3) / 864e5);
  const sl = {};
  if (topic === "pull_win") { const b = pick(bannersNow()), k = pick(b.feat6); sl.six = OPS[k].n; if (Math.random() < .35) sysMsg("world", `${p.name} obtained 6★ ${OPS[k].n} from Headhunting!`); }
  npcSay("world", i, topic, sl, now);
  react("world", i, topic, on, sl);
}
function worldGap(now) {
  const n = onlineNow(now).length;
  return clamp((35 + Math.random() * 75) * 1000 * 160 / Math.max(25, n), 18000, 240000);
}
// returning after a while: the last stretch of chat is already there
function chatBackfill(now) {
  const C = S.chat, gap = now - (C.last || 0);
  if (gap < 10 * 60e3) return;
  const span = Math.min(gap, 40 * 60e3), n = Math.min(14, Math.round(span / 120e3)), saved = C.q.length;
  for (let k = n; k > 0; k--) { const t = now - k * span / n + Math.random() * 30e3; worldEvent(t); }
  // backfilled reactions land in the past too
  for (const x of C.q.splice(saved)) emitQueued({ ...x, at: Math.min(now, x.at - 60e3) });
  C.unread.world = Math.min(C.unread.world, 9);
}
function emitQueued(x) {
  if (x.ch === "dm") { if (S.blocked[x.i]) return; npcSay("dm", x.i, x.topic, x.sl, Math.min(Date.now(), x.at), x.i); if (x.fn) x.fn(); return; }
  if (x.ch === "guild" && !(S.guild && guildOf(x.i) && guildOf(x.i).id === S.guild)) return;
  npcSay(x.ch, x.i, x.topic, x.sl, Math.min(Date.now(), x.at));
  if (x.fn) x.fn();
}
function chatTick(now) {
  chatInit();
  const C = S.chat;
  chatBackfill(now); C.last = now;
  const due = C.q.filter(x => x.at <= now); C.q = C.q.filter(x => x.at > now);
  for (const x of due) emitQueued(x);
  if (now >= C.next) { if (C.next) worldEvent(now); C.next = now + worldGap(now); }
  if (S.guild && now >= C.gnext) { if (C.gnext) guildChatEvent(now); C.gnext = now + clamp(guildGap(), 30000, 600000); }
}

// ---------- the player talks ----------
const RUDE = /\b(stupid|idiot|dumb|trash|garbage|noob|suck|sucks|shut up|stfu|loser|l2p|cringe|clown|bad at|ez|get good|moron|pathetic|scrub|bot)\b/i;
function opsIn(txt) { const t = " " + txt.toLowerCase() + " "; return OP_KEYS.filter(k => OPS[k].n.length > 2 && new RegExp("[^a-z]" + OPS[k].n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^a-z]").test(t)); }
function namesIn(txt, cands) { const t = txt.toLowerCase(); return cands.filter(i => { const n = npcName(i).toLowerCase(); return n.length > 2 && t.includes(n); }); }
function classify(txt) {
  const t = txt.toLowerCase();
  return {
    greet: /\b(hi|hello|hey|heya|hiya|yo|sup|gm|good (morning|evening|afternoon)|howdy|greetings)\b|^o\/$/.test(t), bye: /\b(bye|cya|see (ya|you)|gn|good ?night|later|gtg|g2g)\b/.test(t),
    thanks: /\b(thanks|thank you|ty|thx|tysm|appreciate)\b/.test(t), q: /\?\s*$|^(how|what|why|who|which|where|when|should|does|do|is|can|any)\b/.test(t),
    pull: /\b(pull|roll|banner|headhunt|save|skip|pity|spark|rate.?up)\b/.test(t), build: /\b(build|team|squad|module|e2|elite|promot|skill|invest|level|carry|meta|tier ?list|defense)\b/.test(t),
    lore: /\b(lore|story|talulah|kal'?tsit|theresa|babel|reunion|episode|chernobog|londinium|patriot|frostnova|kashchey|amiya)\b/.test(t),
    rude: RUDE.test(t), laugh: /\b(lol|lmao|haha+|xd|lmfao|rofl|kek)\b/.test(t), gg: /\bgg\b/.test(t),
    win: /\b(got|pulled|finally|yes+)\b/.test(t) && /(6\s?★|6\*|six|limited|rate.?up)/.test(t), lose: /\b(spook|spooked|no 6|unlucky|salt|rip|pain|scam)\b/.test(t),
    guild: /\b(guild|recruit|lf|looking for|join)\b/.test(t),
  };
}
function playerSay(ch, txt, dmWith) {
  chatInit();
  txt = txt.trim().slice(0, 200); if (!txt) return;
  const now = Date.now(), C = S.chat;
  pushMsg(ch, { t: now, i: -1, txt }, dmWith);
  stat("chats");
  C.mine = (C.mine || []).filter(t => now - t < 20000); C.mine.push(now);
  const spam = C.mine.length >= 4 || (C.lastMine === txt.toLowerCase());
  C.lastMine = txt.toLowerCase();
  const I = classify(txt), ops = opsIn(txt);
  if (ch === "dm") return dmReply(dmWith, txt, I, ops);
  const cands = ch === "guild" ? guildMembers(S.guild).filter(i => i >= 0 && isOnline(i, now)) : onlineNow(now);
  const recent = (ch === "guild" ? C.guild : C.world).slice(-12).map(m => m.i).filter(i => i >= 0);
  const named = namesIn(txt, [...new Set([...recent, ...cands])]).filter(i => isOnline(i, now));
  const boost = ch === "guild" ? 1.6 : 1, sl = { to: S.name };
  const go = (fn, topic, n, extra = {}) => {
    for (let k = 0; k < n; k++) {
      const i = pickBy(cands, p => fn(p) * (.25 + p.soc), []); if (i == null) return;
      later(3000 + Math.random() * 14000 + k * 6000, ch, i, topic, { ...sl, ...extra });
    }
  };
  if (spam) { if (Math.random() < .6) go(p => p.salt + p.humor * .3, "reply_spam", 1); for (const i of cands.slice(0, 20)) npcState(i).aff = (npcState(i).aff || 0) - .02; return; }
  // named Doctors answer for themselves
  for (const i of named.slice(0, 2)) {
    const p = person(i), st = npcState(i);
    if (I.rude) { st.aff = (st.aff || 0) - .25; later(4000 + Math.random() * 8000, ch, i, "reply_insulted", sl); continue; }
    st.aff = (st.aff || 0) + .03;
    const topic = I.greet ? "reply_greet" : I.thanks ? "reply_thanks" : I.q && /\b(you|your|ur|u)\b/i.test(txt) ? "reply_question_me" : I.lore ? "reply_lore" : I.pull && I.q ? "reply_help_pull" : I.build && I.q ? "reply_help_build" : "reply_mention";
    if (Math.random() < .55 + p.warm * .4) later(4000 + Math.random() * 10000, ch, i, topic, sl);
  }
  if (named.length) return;
  if (I.rude) { go(p => p.salt * .8 + (1 - p.warm) * .4, "reply_insulted", Math.random() < .7 ? 1 : 2); for (const i of cands) if (Math.random() < .1) npcState(i).aff = (npcState(i).aff || 0) - .05; return; }
  if (I.greet) { go(p => p.warm, "reply_greet", Math.round(Math.random() * (I.q ? 1 : 2) * boost + .3)); if (!I.q) return; }
  if (I.bye) return go(p => p.warm, "reply_bye", Math.round(Math.random() * 1.5 * boost));
  if (I.win) return go(p => p.warm + .2, "reply_congrats", 1 + Math.round(Math.random() * 1.5 * boost));
  if (I.lose) return go(p => p.warm, Math.random() < .25 ? "reply_laugh" : "reply_condolence", Math.round(.5 + Math.random() * boost));
  if (I.q) {
    const topic = I.pull ? "reply_help_pull" : I.build ? "reply_help_build" : I.lore ? "reply_lore" : "reply_help_generic";
    const n = 1 + (Math.random() < .4 * boost ? 1 : 0);
    go(p => p.help * p.help + (p.arch === "mentor" ? .5 : 0), topic, n, { op2: ops[0] ? OPS[ops[0]].n : undefined });
    if (Math.random() < .25) go(p => (1 - p.q) * .5, "reply_unsure", 1);
    return;
  }
  if (ops.length) {
    const lovers = cands.filter(i => person(i).fav.includes(ops[0]));
    if (lovers.length && Math.random() < .8) later(5000 + Math.random() * 9000, ch, pick(lovers), "reply_op_love", { ...sl, op2: OPS[ops[0]].n });
    else go(p => p.ego + p.q * .3, metaScore(ops[0]) > metaScore(metaPool()[20]) ? "reply_op_love" : "reply_op_meh", 1, { op2: OPS[ops[0]].n });
    return;
  }
  if (I.gg) return go(p => p.warm, "reply_default", Math.round(Math.random() * boost));
  if (I.laugh) return Math.random() < .5 ? go(p => p.humor, "reply_laugh", 1) : null;
  if (I.guild && ch === "world" && !S.guild) {
    const leaders = cands.filter(i => { const g = guildOf(i); return g && g.lead === i && g.pol !== "closed" && g.mem.length < guildCap(g); });
    if (leaders.length) { const i = pick(leaders); later(6000 + Math.random() * 10000, "dm", i, "dm_recruit", { to: S.name, guild: guildOf(i).name }, i); setTimeout(() => offerInvite(i), 0); return; }
  }
  if (Math.random() < .35 * boost) go(p => p.warm * .5 + p.soc * .5, Math.random() < .5 ? "reply_agree" : "reply_default", 1);
}
function dmReply(i, txt, I, ops) {
  const p = person(i), st = npcState(i), now = Date.now();
  st.aff = (st.aff || 0) + (I.rude ? -.3 : .04);
  const topic = I.rude ? "reply_insulted" : I.greet ? (st.talked ? "reply_greet" : "dm_hello") : I.bye ? "dm_friendly_bye" : I.thanks ? "reply_thanks"
    : I.guild && S.guild && canInvite() ? "dm_reply_question" : I.q ? (I.pull ? "reply_help_pull" : I.build ? "reply_help_build" : I.lore ? "reply_lore" : /\b(you|your|ur|u)\b/i.test(txt) ? "reply_question_me" : "dm_reply_question")
    : ops.length ? (p.fav.includes(ops[0]) ? "reply_op_love" : "dm_reply_default") : "dm_reply_default";
  st.talked = 1;
  // lurkers and shy Doctors don't always answer; offline Doctors answer when they're back
  if (p.arch === "lurker" && Math.random() < .5) return;
  const at = isOnline(i, now) ? now + 4000 + Math.random() * 12000 + txt.length * 80 : nextOnline(i, now);
  S.chat.q.push({ at, ch: "dm", i, topic, sl: { to: S.name, op2: ops[0] ? OPS[ops[0]].n : undefined }, dm: i });
  // a friendly chat about guilds can turn into an invite
  if (I.guild && !S.guild && guildOf(i) && Math.random() < .5 + st.aff) offerInvite(i, at + 3000);
}
// Contract fights leave an impression: some Doctors whisper afterwards
function contractDM(i, playerWon, kind = "cc") {
  chatInit();
  const p = person(i), st = npcState(i), now = Date.now();
  st.met = (st.met || 0) + 1;
  let topic = null;
  if (playerWon) {
    if (Math.random() < .08 + p.salt * .2) topic = "dm_salty_loss", st.aff = (st.aff || 0) - .05;
    else if (Math.random() < .06 + p.warm * .12) topic = kind === "cc" && Math.random() < .5 ? "dm_defense_beaten" : "dm_gg_loss";
  } else if (Math.random() < .05 + p.ego * .12 + p.warm * .05) topic = "dm_gg_win";
  if (!topic || !isOnline(i, now)) return;
  S.chat.q.push({ at: now + 6000 + Math.random() * 20000, ch: "dm", i, topic, sl: { to: S.name }, dm: i });
}

// =====================================================================
//  GUILDS
// =====================================================================
const GUILD_COL = ["#5fd4ff", "#f2c14e", "#ff6a5a", "#43d67e", "#b26bff", "#ff8aa8", "#e0c070", "#9fb3c8", "#3a7ad8", "#d86a3a"];
const GUILD_EMBLEMS = ["shield", "sword", "crown", "star", "tower", "arena", "rune", "orb", "heal", "skull", "book", "claw"];
const guildCap = g => Math.min(30, 20 + g.lvl);
const gxpNeed = l => 1500 + l * 1200;
let GIDX = null;   // npc index → guild id (rebuilt from S.gw)
function guildWorld() {
  if (S.gw && S.gw.seed === S.ladder.seed) return S.gw;
  const rng = seeded(hash("guilds" + S.ladder.seed)), A = typeof GUILD_NAME_A !== "undefined" ? GUILD_NAME_A : ["Penguin", "Lungmen", "Originium", "Midnight", "Rhodes"],
    Bn = typeof GUILD_NAME_B !== "undefined" ? GUILD_NAME_B : ["Logistics", "Knights", "Syndicate", "Club", "Brigade"], descs = typeof GUILD_DESCS !== "undefined" ? GUILD_DESCS : ["Friendly guild, all welcome."];
  const G = 72, used = new Set(), guilds = [];
  // leaders: sociable, loyal Doctors (recruiters love it)
  const cand = [];
  for (let i = 0; i < LADDER_N; i++) { const p = person(i); cand.push([i, p.soc * .6 + p.loyal * .4 + (p.arch === "recruiter" ? .6 : 0) + (p.arch === "lurker" ? -1 : 0) + rng() * .5]); }
  cand.sort((a, b) => b[1] - a[1]);
  const leaders = cand.slice(0, G).map(c => c[0]);
  for (const lead of leaders) {
    let name;
    for (let t = 0; t < 20; t++) { name = A[Math.floor(rng() * A.length)] + " " + Bn[Math.floor(rng() * Bn.length)]; if (!used.has(name)) break; }
    used.add(name);
    const q = person(lead).q, minLvl = q > .8 ? 80 + Math.floor(rng() * 4) * 10 : q > .5 ? 30 + Math.floor(rng() * 4) * 10 : Math.floor(rng() * 3) * 10;
    const tag = name.split(" ").map(w => w[0]).join("").toUpperCase() + (rng() < .5 ? String.fromCharCode(65 + Math.floor(rng() * 26)) : "");
    guilds.push({ id: "g" + guilds.length, name, tag, col: GUILD_COL[Math.floor(rng() * GUILD_COL.length)], em: GUILD_EMBLEMS[Math.floor(rng() * GUILD_EMBLEMS.length)],
      lvl: clamp(1 + Math.floor(q * 8 + rng() * 3), 1, 12), xp: Math.floor(rng() * 1500), lead, off: [], mem: [lead], q,
      pol: rng() < .15 ? "closed" : q > .6 || rng() < .3 ? "approval" : "open", minLvl,
      desc: descs[Math.floor(rng() * descs.length)].replace(/\{lvl\}/g, minLvl || 1).replace(/\{tier\}/g, tierOf(qRating(q)).n), made: Date.now() - Math.floor(rng() * 600) * 864e5 });
  }
  // members: stronger Doctors are almost always in a guild, near their own strength
  for (let i = 0; i < LADDER_N; i++) {
    if (leaders.includes(i)) continue;
    const p = person(i);
    if (rng() > .3 + .55 * p.q - (p.arch === "lurker" ? .2 : 0)) continue;
    let best = null, bs = -1;
    for (let t = 0; t < 8; t++) { const g = guilds[Math.floor(rng() * guilds.length)]; if (g.mem.length >= guildCap(g) - 2) continue; const s = 1 - Math.abs(g.q - p.q) + rng() * .3; if (s > bs) { bs = s; best = g; } }
    if (best) best.mem.push(i);
  }
  for (const g of guilds) g.off = g.mem.filter(i => i !== g.lead).sort((a, b) => person(b).loyal - person(a).loyal).slice(0, 2);
  S.gw = { seed: S.ladder.seed, list: guilds, seq: guilds.length };
  GIDX = null;
  return S.gw;
}
const guildList = () => guildWorld().list;
const guildById = id => guildList().find(g => g.id === id) || null;
function guildIndex() {
  if (GIDX && GIDX.n === S.gw.list.reduce((a, g) => a + g.mem.length, 0) + S.gw.list.length) return GIDX.map;
  const map = new Map();
  for (const g of guildList()) for (const i of g.mem) map.set(i, g.id);
  GIDX = { map, n: S.gw.list.reduce((a, g) => a + g.mem.length, 0) + S.gw.list.length };
  return map;
}
const guildOf = i => { if (i === -1) return S.guild ? guildById(S.guild) : null; const id = guildIndex().get(i); return id ? guildById(id) : null; };
const guildMembers = id => (guildById(id) || { mem: [] }).mem;
const myGuild = () => S.guild ? guildById(S.guild) : null;
const myRole = () => { const g = myGuild(); return !g ? null : g.lead === -1 ? "leader" : g.off.includes(-1) ? "officer" : "member"; };
const canInvite = () => myRole() === "leader" || myRole() === "officer";
const guildPower = g => g.mem.reduce((a, i) => a + (i === -1 ? .7 : person(i).q), 0);
function guildMsg(txt) { if (S.guild) sysMsg("guild", txt); }
function joinGuild(g, viaInvite) {
  if (S.guild) leaveGuild(true);
  S.guild = g.id; g.mem.push(-1); GIDX = null;
  S.gJoined = Date.now(); stat("guilds");
  S.chat.guild = [];
  sysMsg("guild", `${S.name} joined the guild.`);
  const on = g.mem.filter(i => i >= 0 && isOnline(i));
  for (let k = 0, n = Math.min(on.length, 1 + Math.floor(Math.random() * 3)); k < n; k++) later(3000 + k * 5000 + Math.random() * 6000, "guild", on[Math.floor(Math.random() * on.length)], "g_welcome", { to: S.name });
  S.gReq = []; S.gInv = (S.gInv || []).filter(x => x.gid !== g.id);
}
function leaveGuild(quiet) {
  const g = myGuild(); if (!g) return;
  g.mem = g.mem.filter(i => i !== -1); g.off = g.off.filter(i => i !== -1); GIDX = null;
  if (g.lead === -1) {
    // the guild carries on under its most loyal officer, or disbands when empty
    const next = g.off[0] != null ? g.off[0] : g.mem.slice().sort((a, b) => person(b).loyal - person(a).loyal)[0];
    if (next == null) S.gw.list = S.gw.list.filter(x => x !== g);
    else { g.lead = next; g.off = g.off.filter(i => i !== next); }
  }
  S.guild = null; S.gLeft = Date.now(); S.gApps = [];
  if (!quiet) { S.chat.guild = []; }
}
function createGuild(name, tag, desc, pol, minLvl) {
  const g = { id: "g" + (S.gw.seq++), name, tag, col: GUILD_COL[Math.floor(Math.random() * GUILD_COL.length)], em: GUILD_EMBLEMS[Math.floor(Math.random() * GUILD_EMBLEMS.length)],
    lvl: 1, xp: 0, lead: -1, off: [], mem: [], q: .5, pol, minLvl, desc, made: Date.now(), mine: 1 };
  S.gw.list.push(g);
  joinGuild(g);
  return g;
}
// the player asks to join a guild; its leader (or an officer) decides when they're online
function requestJoin(g) {
  S.gReq = (S.gReq || []).filter(x => x.gid !== g.id);
  if (g.pol === "open") { if (S.lvl >= g.minLvl) { joinGuild(g); return "joined"; } return "level"; }
  if (g.pol === "closed") return "closed";
  S.gReq.push({ gid: g.id, t: Date.now() });
  return "sent";
}
function offerInvite(i, at = Date.now()) {
  const g = guildOf(i); if (!g || S.guild || g.mem.length >= guildCap(g)) return;
  S.gInv = (S.gInv || []).filter(x => x.gid !== g.id);
  S.gInv.push({ gid: g.id, i, t: at });
}
// the player invites a Doctor; they think it over and answer by whisper
function inviteNpc(i) {
  S.gSent = (S.gSent || []).filter(x => x.i !== i);
  S.gSent.push({ i, t: Date.now(), at: isOnline(i) ? Date.now() + 8000 + Math.random() * 40000 : nextOnline(i, Date.now()) });
}
function inviteDecision(i, g) {
  const p = person(i), st = npcState(i), cur = guildOf(i);
  if (g.mem.length >= guildCap(g)) return false;
  let pr = cur ? .08 * (1 - p.loyal) : .55;
  pr += (st.aff || 0) * .6 + (g.lvl - 5) * .02;
  if (p.q > .75 && guildPower(g) / Math.max(1, g.mem.length) < .5) pr -= .3;
  if (p.arch === "lurker") pr -= .2;
  if (p.lvl < g.minLvl) pr = 0;
  return Math.random() < clamp(pr, 0, .95);
}
function moveNpc(i, g) {
  const cur = guildOf(i);
  if (cur) { cur.mem = cur.mem.filter(x => x !== i); cur.off = cur.off.filter(x => x !== i); if (cur.lead === i) { cur.lead = cur.off[0] != null ? cur.off[0] : cur.mem[0]; if (cur.lead == null) S.gw.list = S.gw.list.filter(x => x !== cur); } }
  if (g) g.mem.push(i);
  GIDX = null;
}

// ---------- guild boss: one boss per week, stage after stage; members get 2 attacks a day ----------
const GBOSS_KEYS = () => ["patriot", "talulah", "w", "yeti", "frostnova", "centurion", "skullshatterer", "queenslug", "mephisto", "crownslayer", "faust"].filter(k => ENEMY[k]);
const gbLV = stage => Math.min(120, 35 + stage * 8);
function gbRef(key, LV) {
  // damage a solid squad does in one attempt, to size the HP pools (cached)
  const ck = key + ":" + LV; gbRef.c = gbRef.c || {};
  if (gbRef.c[ck]) return gbRef.c[ck];
  const B = makeBattle({ allies: ["silverash", "exusiai", "nightingale", "eyjafjalla"].filter(k => OPS[k]).map(k => ({ op: k, prog: progForLV(k, LV) })), waves: [[{ en: key, LV, maxHp: 1e12 }]], auto: true, aiStyle: "balanced", turnLimit: GB_TURNS });
  let g = 0; while (!B.over && g++ < 3000) { const r = B.step(); if (r === "input") B.autoAct(); B.ev.length = 0; }
  return (gbRef.c[ck] = Math.max(5000, B.damageBy("A")));
}
const GB_TURNS = 12;
const gBossKey = g => { const keys = GBOSS_KEYS(); return g.boss && g.boss.week === weekId() ? g.boss.key : keys[(weekId() + hash(g.id)) % keys.length]; };
function gBoss(g) {
  if (!g) return null;
  const w = weekId();
  if (!g.boss || g.boss.week !== w) {
    const key = gBossKey(g);
    g.boss = { week: w, key, stage: 1, ref: 0, hp: 0, max: 0, hits: {}, day: today(), tries: {}, log: [] };
    gbStage(g.boss, 1);
  }
  return g.boss;
}
function gbStage(b, stage) {
  b.stage = stage; b.ref = gbRef(b.key, gbLV(stage)); b.max = Math.round(b.ref * (7 + stage * 1.5)); b.hp = b.max;
}
function gbHit(g, who, dmg) {
  const b = gBoss(g); let cleared = 0;
  b.hits[who] = (b.hits[who] || 0) + dmg;
  b.log.unshift({ t: Date.now(), i: who, dmg }); if (b.log.length > 40) b.log.length = 40;
  while (dmg > 0) {
    const d = Math.min(dmg, b.hp); b.hp -= d; dmg -= d;
    if (b.hp <= 0) { cleared++; gbCleared(g, b); gbStage(b, b.stage + 1); }
    if (cleared > 3) break;
  }
  return cleared;
}
function gbCleared(g, b) {
  if (g.id !== S.guild) return;
  sysMsg("guild", `${ENEMY[b.key].n} (stage ${b.stage}) was defeated! Stage ${b.stage + 1} is open.`);
  sendMail({ kind: "guild", title: `Guild Boss: ${ENEMY[b.key].n} stage ${b.stage} cleared`, body: `${g.name} brought down stage ${b.stage}. Here's your share of the spoils, Doctor.`,
    rewards: { lmd: 8000 + b.stage * 3000, orundum: 60 + b.stage * 20, ...(b.stage % 3 === 0 ? { chip: 2 } : { rec3: 2 }) } });
  const on = g.mem.filter(i => i >= 0 && isOnline(i));
  if (on.length) later(4000 + Math.random() * 8000, "guild", pick(on), "g_boss_down", {});
}
const gbTriesLeft = () => { const g = myGuild(); if (!g) return 0; const b = gBoss(g); if (b.day !== today()) { b.day = today(); b.tries = {}; } return 2 - (b.tries[-1] || 0); };

// ---------- guild life: donations, boss attacks, comings and goings ----------
const DONATIONS = [
  { id: "lmd", n: "Standard", cost: { lmd: 20000 }, xp: 100, give: { credit: 40, tokens: 10 } },
  { id: "oru", n: "Generous", cost: { orundum: 300 }, xp: 300, give: { credit: 80, rec3: 2 } },
  { id: "prime", n: "Lavish", cost: { prime: 2 }, xp: 700, give: { credit: 150, chip: 1, tokens: 30 } },
];
function guildXp(g, n) { g.xp += n; while (g.xp >= gxpNeed(g.lvl) && g.lvl < 20) { g.xp -= gxpNeed(g.lvl); g.lvl++; if (g.id === S.guild) sysMsg("guild", `The guild reached level ${g.lvl}!`); } }
function donate(id) {
  const g = myGuild(), d = DONATIONS.find(x => x.id === id); if (!g || !d) return null;
  g.don = g.don && g.don.day === today() ? g.don : { day: today(), by: {} };
  if (g.don.by[-1]) return null;
  for (const [k, n] of Object.entries(d.cost)) if (have(k) < n) return null;
  for (const [k, n] of Object.entries(d.cost)) spend(k, n);
  g.don.by[-1] = id; guildXp(g, d.xp); stat("donations");
  S.gContrib = (S.gContrib || 0) + d.xp;
  sysMsg("guild", `${S.name} made a ${d.n.toLowerCase()} donation (+${d.xp} guild EXP).`);
  const on = g.mem.filter(i => i >= 0 && isOnline(i));
  if (on.length && Math.random() < .5) later(5000 + Math.random() * 10000, "guild", pick(on), "reply_thanks", { to: S.name });
  return give(d.give);
}
function guildGap() { const g = myGuild(); if (!g) return 600000; const n = g.mem.filter(i => i >= 0 && isOnline(i)).length; return (60 + Math.random() * 150) * 1000 * 4 / Math.max(1, n); }
function guildChatEvent(now) {
  const g = myGuild(); if (!g) return;
  const on = g.mem.filter(i => i >= 0 && isOnline(i, now)); if (!on.length) return;
  const recent = S.chat.guild.slice(-3).map(m => m.i);
  const i = pickBy(on, p => .2 + p.soc, recent); if (i == null) return;
  const p = person(i), st = npcState(i), dk = today();
  const opts = [["g_banter", 3], ["g_greet", st.gg !== dk ? 4 : 0], ["g_remind_donate", g.don && g.don.day === dk && !g.don.by[-1] ? .6 : .2], ["g_lazy", .2 * p.salt],
    ["g_boss_low", gBoss(g).hp < gBoss(g).max * .15 ? 1.5 : 0], ["banner_hype", .6], ["pull_loss", .4], ["pull_win", .3], ["irl", .7], ["random_meme", .3 + p.humor * .5], ["pvp_loss", .3], ["farming", .3]];
  let tot = opts.reduce((a, o) => a + o[1], 0), x = Math.random() * tot, topic = "g_banter";
  for (const [k, w] of opts) { x -= w; if (x <= 0) { topic = k; break; } }
  if (topic === "g_greet") st.gg = dk;
  npcSay("guild", i, topic, {}, now);
  const R0 = REACT[topic] || (topic.startsWith("g_") ? { t: "reply_default", who: q => q.warm, n: [0, 1], p: .5 } : null);
  if (R0) react("guild", i, REACT[topic] ? topic : "irl", on);
}
// once a minute: simulate what members did since the last tick (bounded, so a long absence doesn't stall)
function guildTick(now) {
  if (!S.gw) return;
  const G = S.gw;
  const last = G.tick || now; G.tick = now;
  // player's pending requests and invites
  for (const r of (S.gReq || []).slice()) {
    const g = guildById(r.gid); if (!g) { S.gReq = S.gReq.filter(x => x !== r); continue; }
    if (now - r.t < 60000 + (hash(r.gid + r.t) % 600000)) continue;
    const lead = g.lead, ok = S.lvl >= g.minLvl && g.mem.length < guildCap(g) && Math.random() < clamp(.45 + (S.ladder.best - qRating(g.q)) / 1500 + (npcState(lead).aff || 0), .05, .95);
    if (lead >= 0 && !isOnline(lead, now) && now - r.t < 6 * 3600e3) continue;
    S.gReq = S.gReq.filter(x => x !== r);
    if (ok) { joinGuild(g); if (lead >= 0) later(4000, "dm", lead, "dm_request_accepted_thanks", { to: S.name, guild: g.name }, lead); }
    else if (lead >= 0) { later(3000, "dm", lead, "dm_request_denied_react", { to: S.name, guild: g.name }, lead); }
    break;
  }
  for (const s of (S.gSent || []).slice()) {
    if (s.at > now) continue;
    S.gSent = S.gSent.filter(x => x !== s);
    const g = myGuild(); if (!g) continue;
    if (inviteDecision(s.i, g)) {
      moveNpc(s.i, g); stat("recruits");
      later(2000, "dm", s.i, "dm_accept_invite", { to: S.name, guild: g.name }, s.i);
      sysMsg("guild", `${npcName(s.i)} joined the guild.`);
      const on = g.mem.filter(i => i >= 0 && i !== s.i && isOnline(i, now));
      if (on.length) later(5000 + Math.random() * 8000, "guild", pick(on), "g_welcome", { to: npcName(s.i) });
    } else if (person(s.i).arch !== "lurker" || Math.random() < .3) later(2000, "dm", s.i, "dm_decline_invite", { to: S.name, guild: g.name }, s.i);
  }
  const g = myGuild();
  if (!g) return;
  const b = gBoss(g), dk = today();
  g.don = g.don && g.don.day === dk ? g.don : { day: dk, by: { ...(g.don && g.don.day === dk ? g.don.by : {}) } };
  if (b.day !== dk) { b.day = dk; b.tries = {}; }
  const mins = clamp(Math.round((now - last) / 60000), 0, 24 * 60);
  for (const i of g.mem) {
    if (i < 0) continue;
    const p = person(i);
    // members act while they're online; a long gap is simulated in one pass
    const was = mins > 30 ? Math.random() < p.act : isOnline(i, now);
    if (!was) continue;
    if (!g.don.by[i] && Math.random() < (mins > 30 ? .8 : .03) * (.4 + p.loyal * .6)) {
      const d = p.q > .8 && Math.random() < .4 ? DONATIONS[2] : p.q > .4 && Math.random() < .5 ? DONATIONS[1] : DONATIONS[0];
      g.don.by[i] = d.id; guildXp(g, d.xp);
      if (mins <= 30 && Math.random() < .35) later(1000 + Math.random() * 4000, "guild", i, "g_donate", {});
    }
    if ((b.tries[i] || 0) < 2 && Math.random() < (mins > 30 ? .85 : .025)) {
      const dmg = Math.round(b.ref * (.35 + 1.5 * p.q * p.q) * (.6 + Math.random() * .8));
      b.tries[i] = (b.tries[i] || 0) + 1;
      gbHit(g, i, dmg);
      if (mins <= 30 && Math.random() < .3) later(1500 + Math.random() * 5000, "guild", i, "g_boss_hit", { dmg: fmt(dmg) });
    }
  }
  // comings and goings, about daily
  if (Math.random() < mins / 1440 * 1.5) {
    const leaving = g.mem.filter(i => i >= 0 && i !== g.lead).find(i => Math.random() < .03 * (1 - person(i).loyal) * (g.lvl < 3 ? 2 : 1));
    if (leaving != null) {
      if (isOnline(leaving, now)) npcSay("guild", leaving, "g_leave_self", {}, now);
      moveNpc(leaving, null);
      sysMsg("guild", `${npcName(leaving)} left the guild.`);
      const on = g.mem.filter(i => i >= 0 && isOnline(i, now));
      if (on.length) later(4000 + Math.random() * 8000, "guild", pick(on), "g_left_react", { to: npcName(leaving) });
    }
  }
  // Doctors ask to join the player's guild when it has room (open guilds take them straight in)
  if (canInvite() && g.pol !== "closed" && g.mem.length < guildCap(g) && Math.random() < mins / 60 * (.15 + g.lvl * .02 + (S.ladder.best > 2200 ? .1 : 0))) {
    const on = onlineNow(now).filter(i => !guildOf(i) || (person(i).loyal < .25 && Math.random() < .3));
    const i = pickBy(on, p => (p.lvl >= g.minLvl ? 1 : 0) * (.3 + p.soc), []);
    if (i != null) {
      if (g.pol === "open") { moveNpc(i, g); stat("recruits"); sysMsg("guild", `${npcName(i)} joined the guild.`); later(4000, "guild", i, "g_greet", {}); }
      else if (!(S.gApps || []).some(a => a.i === i)) { S.gApps = (S.gApps || []).concat({ i, t: now }); later(2000, "dm", i, "dm_join_request", { to: S.name, guild: g.name }, i); }
    }
  }
  // recruiters with room whisper the guildless player now and then
  if (!S.guild && Math.random() < mins / 1440 * 2) {
    const leads = onlineNow(now).filter(i => { const x = guildOf(i); return x && x.lead === i && x.pol !== "closed" && x.mem.length < guildCap(x) && person(i).arch === "recruiter"; });
    if (leads.length) { const i = pick(leads); later(5000, "dm", i, "dm_recruit", { to: S.name, guild: guildOf(i).name }, i); offerInvite(i, now + 5000); }
  }
}
function acceptApp(i) {
  const g = myGuild(); S.gApps = (S.gApps || []).filter(a => a.i !== i);
  if (!g || g.mem.length >= guildCap(g)) return false;
  moveNpc(i, g); stat("recruits");
  sysMsg("guild", `${npcName(i)} joined the guild.`);
  later(3000, "dm", i, "dm_request_accepted_thanks", { to: S.name, guild: g.name }, i);
  later(9000, "guild", i, "g_greet", {});
  return true;
}
function denyApp(i) { const g = myGuild(); S.gApps = (S.gApps || []).filter(a => a.i !== i); if (g) later(3000, "dm", i, "dm_request_denied_react", { to: S.name, guild: g.name }, i); }
function kickMember(i) {
  const g = myGuild(); if (!g || !canInvite() || i === g.lead) return;
  moveNpc(i, null); sysMsg("guild", `${npcName(i)} was removed from the guild.`);
  const on = g.mem.filter(x => x >= 0 && isOnline(x));
  if (on.length && Math.random() < .6) later(5000, "guild", pick(on), "g_kick_react", { to: npcName(i) });
  npcState(i).aff = (npcState(i).aff || 0) - .5;
}
function promoteMember(i) {
  const g = myGuild(); if (!g || myRole() !== "leader") return;
  if (g.off.includes(i)) g.off = g.off.filter(x => x !== i);
  else if (g.off.length < 4) { g.off.push(i); sysMsg("guild", `${npcName(i)} is now an officer.`); const on = g.mem.filter(x => x >= 0 && x !== i && isOnline(x)); if (on.length) later(4000, "guild", pick(on), "g_promote", { to: npcName(i) }); }
}

// ---------- things Doctors decide on their own, about once a minute ----------
function socialTick(now, mins) {
  const C = S.chat;
  // guilds elsewhere change too: guildless Doctors find homes, restless ones move on
  if (Math.random() < mins / 1440 * 3) {
    for (let k = 0; k < 6; k++) {
      const i = Math.floor(Math.random() * LADDER_N), p = person(i), cur = guildOf(i);
      if (cur && (cur.id === S.guild || cur.lead === i)) continue;
      if (!cur && Math.random() < .3 + p.q * .4) { const g = pick(guildList().filter(x => x.id !== S.guild && x.pol !== "closed" && x.mem.length < guildCap(x) && Math.abs(x.q - p.q) < .25)); if (g) moveNpc(i, g); }
      else if (cur && Math.random() < .2 * (1 - p.loyal)) moveNpc(i, null);
    }
  }
  // Doctors who attacked the player's defense sometimes say something about it
  const L = S.ladder;
  for (const x of L.log.filter(x => x.t > (C.defSeen || 0)).slice(0, 3)) {
    if (!x.held && x.i != null && Math.random() < .12 + person(x.i).ego * .15 && isOnline(x.i, now)) S.chat.q.push({ at: now + 5000 + Math.random() * 30000, ch: "dm", i: x.i, topic: "dm_gg_win", sl: { to: S.name }, dm: x.i });
  }
  C.defSeen = Math.max(C.defSeen || 0, ...L.log.map(x => x.t), 0);
  // Doctors who like the player check in now and then
  if (Math.random() < mins / 1440 * 1.5) {
    const fans = Object.keys(S.npc).map(Number).filter(i => (S.npc[i].aff || 0) > .25 && isOnline(i, now) && !S.blocked[i]);
    if (fans.length) { const i = pick(fans); S.chat.q.push({ at: now + 3000, ch: "dm", i, topic: "dm_hello", sl: { to: S.name }, dm: i }); }
  }
  // big moments are announced in World chat, and people react
  for (const [key, best, label] of [["cc", L.best, "Contingency Contract"], ["rta", S.rta.best, "Real-Time Contract"]]) {
    const t = tierIdx(best); C.tiers = C.tiers || {};
    if (C.tiers[key] == null) { C.tiers[key] = t; continue; }
    if (t > C.tiers[key]) { C.tiers[key] = t; if (t >= 2) { sysMsg("world", `${S.name} reached ${TIERS[t].n} in ${label}!`); react("world", -1, "pvp_climb", onlineNow(now), { tier: TIERS[t].n }); } }
  }
}
// ---------- the world's clock (called from tickTimers) ----------
function worldTick(now) {
  if (!S || !S.ladder) return;
  chatInit();
  if (!S.gw) guildWorld();
  if (!worldTick.t || now - worldTick.t > 60000 || now < worldTick.t) {
    const mins = worldTick.t ? clamp((now - worldTick.t) / 60000, 0, 1440) : 1;
    worldTick.t = now; guildTick(now); socialTick(now, mins);
  }
  chatTick(now);
}
