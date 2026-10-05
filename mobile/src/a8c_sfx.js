
// =====================================================================
//  AUDIO — music per screen (assets/bgm), Arknights sound effects (assets/sfx)
//  and operator voice lines (assets/voice/<slug>/CN_0xx.mp3), with volume settings.
//  Plain <audio> elements, so it also works when the game is opened from a file.
// =====================================================================
const AUDIO_KEY = "ak_tactics_audio";
const AUD = { prefs: null, music: null, musicKey: null, want: null, unlocked: false, voice: null, voiceT: 0, base: {}, last: {}, ctx: null, noise: null, duck: 1 };
function audioPrefs() {
  if (!AUD.prefs) { try { AUD.prefs = JSON.parse(localStorage.getItem(AUDIO_KEY)); } catch (e) { /* storage unavailable */ } }
  return AUD.prefs || (AUD.prefs = { music: .55, sfx: .8, voice: .9, mute: false });
}
function setAudioPref(k, v) { audioPrefs()[k] = v; try { localStorage.setItem(AUDIO_KEY, JSON.stringify(AUD.prefs)); } catch (e) { /* storage unavailable */ } musicVolume(); }
const muted = () => audioPrefs().mute;

// ---------- music ----------
const BGM = {
  title: "1-sys title.mp3", loading: "1-sys loading.mp3", home: "1-sys lab.mp3", penguin: "1-sys penguinlogistics.mp3", shop: "1-sys shop.mp3", contract: "1-sys ccs1.mp3",
  plot: "1-avg plot.mp3", tense: "14-avg tense.mp3", calm: "45-avg calm.mp3", warm: "1-avg warm.mp3", lonely: "1-avg loneliness.mp3", frostnovadie: "1-avg frostnovadie.mp3",
  normal1: "1-bat normal01.mp3", normal2: "1-bat normal02.mp3", chernobog: "1-bat chernobog.mp3", lungmen: "1-bat longmenbat.mp3", sss: "1-bat exterminate.mp3", ccbat: "1-bat ccs1.mp3",
  bossLungmen: "1-bat longmenbatboss.mp3", mephisto: "12-bat mephistovariation.mp3", frostnova: "1-bat frostnova.mp3", yeti: "1-bat snowmonster.mp3",
  victory: "1-bat victory.mp3", failed: "1-bat failed.mp3",
};
const PENGUIN = new Set(["exusiai", "texas", "sora", "croissant"]);
function musicVolume() { if (AUD.music) AUD.music.volume = muted() ? 0 : audioPrefs().music * AUD.duck; }
function music(key) {
  if (!BGM[key] || AUD.musicKey === key) return;
  AUD.musicKey = key;
  const old = AUD.music, a = new Audio(ASSET + "bgm/" + encodeURIComponent(BGM[key]));
  a.loop = key !== "victory" && key !== "failed"; a.volume = 0; a.preload = "auto";
  AUD.music = a;
  const target = () => muted() ? 0 : audioPrefs().music * AUD.duck;
  const fade = (el, from, to, ms, done) => { const t0 = performance.now(); const st = now => { const k = Math.min(1, (now - t0) / ms); el.volume = clamp(from + (to - from) * k, 0, 1); if (k < 1) requestAnimationFrame(st); else if (done) done(); }; requestAnimationFrame(st); };
  if (old) fade(old, old.volume, 0, 600, () => { old.pause(); old.src = ""; });
  const start = () => a.play().then(() => fade(a, 0, target(), 900)).catch(() => { AUD.want = a; });
  start();
}
// the track for whatever screen is showing
function screenMusic() {
  const v = UI.view;
  if (v === "shop") return "shop";
  if (v === "arena" || (v === "team" && UI.arg && (UI.arg.mode === "arena" || UI.arg.mode === "defense"))) return "contract";
  if (v === "home" && PENGUIN.has(S && S.assistant)) return "penguin";
  return "home";
}
// browsers only allow sound after the first tap or key press
function audioUnlock() {
  if (AUD.unlocked) return;
  AUD.unlocked = true;
  if (AUD.want) { const a = AUD.want; AUD.want = null; a.play().then(musicVolume).catch(() => {}); }
}
document.addEventListener("pointerdown", audioUnlock, true);
document.addEventListener("keydown", audioUnlock, true);

// ---------- sound effects ----------
const SFX_FILES = {
  ui_win: "b_ui_win", ui_lose: "b_ui_lose", ui_star: "b_ui_star", ui_reward: "b_ui_rewardappear", ui_whoosh: "b_ui_whoosh", ui_mark: "b_ui_mark", ui_cast: "b_ui_getcast", ui_alarm: "b_ui_alarmenter",
  dead_ally: "b_char_dead", dead_enemy: "b_enemy_dead_n", dead_boss: "b_enemy_dead_h", buff_atk: "b_char_atkboost", buff_def: "b_char_defboost", buff_heal: "b_char_healboost",
  shield: "b_char_addshield", cast: "b_char_getcast", trap: "b_char_trap",
  arrow: "p_atk_arrow_n", arrow_hit: "p_imp_arrow_n", xbow: "p_atk_crossbow_n", xbow_hit: "p_imp_crossbow_n", pistol: "p_atk_pistol_n", handgun: "p_atk_handgun_n",
  rifle: "p_atk_rifle_n", rifle_hit: "p_imp_rifle_n", shotgun: "p_atk_shotgun_n", sword: "p_atk_bsword_n", sword_hit: "p_imp_katanasword_n", blade: "p_atk_blade_n", blade_hit: "p_imp_blade_n",
  dagger: "p_atk_dagger_n", dagger_hit: "p_imp_dagger_n", axe: "p_atk_axe_n", axe_hit: "p_imp_axe_n", hammer: "p_atk_hammer_n", hammer_hit: "p_imp_hammer_n",
  spear: "p_atk_spearstab_n", spear_hit: "p_imp_gunlance_n", punch: "p_atk_punch_n", punch_hit: "p_atk_punch_h", shieldbash: "p_atk_shield_n", shieldbash_hit: "p_imp_heavyshield_n",
  whip: "p_atk_whip_n", saw: "p_atk_chainsaw_n", mag: "p_atk_amiyamag_n", mag_hit: "p_imp_amiyamag_n", darkmag: "p_atk_darkmag_n", firemag: "p_atk_firemag_n", elecmag: "p_atk_elecmag_n",
  nova: "p_aoe_nmag_n", explo: "p_aoe_fireexplo_h", bigexplo: "p_imp_goldexplo_n", heal: "p_atk_heal_l", bigheal: "p_atk_heal_h", staff: "p_atk_staff_n",
  e_sword: "e_atk_sword_n", e_blade: "e_atk_blade_n", e_arrow: "e_atk_arrow_n", e_magic: "e_atk_magic_n", e_ice: "e_atk_magic_ice", e_punch: "e_atk_punch_n", e_axe: "e_atk_bigaxe_n",
  e_bite: "e_atk_lizardbite", e_shield: "e_atk_soldiershield", e_dark: "e_atk_evilmagic_n", e_blade_hit: "e_imp_blade_n", e_arrow_hit: "e_imp_arrow_n",
};
// older calls in the game, mapped to real samples
const SFX_ALIAS = { win: "ui_win", lose: "ui_lose", special: "cast", warp: "ui_whoosh", boom: "explo", zap: "elecmag", hit: "blade_hit", crit: "bigexplo", saber: "sword", bow: "xbow", shot: "rifle", arts: "mag", flame: "firemag", reward: "ui_reward" };
function sfx(kind, vol = 1) {
  if (muted()) return;
  const key = SFX_FILES[kind] ? kind : SFX_ALIAS[kind];
  if (key) {
    const t = performance.now();
    if (t - (AUD.last[key] || 0) < 45) return;
    AUD.last[key] = t;
    try {
      const base = AUD.base[key] || (AUD.base[key] = Object.assign(new Audio(ASSET + "sfx/" + SFX_FILES[key] + ".mp3"), { preload: "auto" }));
      const a = base.cloneNode(); a.volume = clamp(audioPrefs().sfx * vol, 0, 1); a.play().catch(() => {});
    } catch (e) { /* audio unavailable */ }
    return;
  }
  synth(kind);
}
// a few soft UI blips are still synthesized (taps happen constantly)
function synth(kind) {
  try {
    const A = AUD.ctx || (AUD.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (A.state === "suspended") A.resume();
    const t = A.currentTime, v = audioPrefs().sfx;
    const osc = (type, f0, f1, dur, vol, at = 0) => {
      const o = A.createOscillator(), g = A.createGain(); o.type = type; o.connect(g); g.connect(A.destination);
      o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + at + dur);
      g.gain.setValueAtTime(.0001, t + at); g.gain.exponentialRampToValueAtTime(vol * v, t + at + .015); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
      o.start(t + at); o.stop(t + at + dur + .02);
    };
    if (kind === "tap") osc("sine", 880, 660, .05, .03);
    else if (kind === "blaster") osc("square", 1500 + R() * 300, 160, .17, .05);
  } catch (e) { /* audio unavailable */ }
}
// attack and impact sounds follow the attacker's weapon (operators) or kind (enemies)
function attackSfx(u, impact) {
  const f = u.def.fig || {}, w = f.w || "none";
  if (!u.isOp) {
    if (f.type === "hound" || f.type === "slug") return "e_bite";
    if (w === "bowcaster" || w === "bow") return impact ? "e_arrow_hit" : "e_arrow";
    if (w === "shield") return "e_shield";
    if (w === "greatsword") return "e_axe";
    if (w === "rifle") return "rifle";
    if (w === "saber" || w === "dagger") return impact ? "e_blade_hit" : u.key === "crownslayer" ? "e_blade" : "e_sword";
    return u.el === "Water" ? "e_ice" : u.el === "Dark" ? "e_dark" : "e_magic";
  }
  const map = { bowcaster: "xbow", bow: "arrow", rifle: "rifle", pistol: "pistol", pistols: "handgun", spear: "spear", saber: "sword", saber2: "sword", staffsaber: "sword",
    greatsword: "blade", shield: "shieldbash", dagger: "dagger", staff: "staff", medrod: "heal" };
  let k = map[w];
  if (!k) k = u.el === "Fire" ? "firemag" : u.el === "Dark" ? "darkmag" : u.el === "Wind" ? "elecmag" : "mag";
  return impact && SFX_FILES[k + "_hit"] ? k + "_hit" : k;
}

// ---------- operator voice lines ----------
// operators with a folder in assets/voice (written by mobile/tools/fetch_audio.py)
const VOICE_LIST = "12f absinthe adnachiel akafuyu ambriel amiya angelina ansel april archetto arene aroma asbestos ash ashlock astesia astgenne aurora ayerscarpe bagpipe beagle beanstalk beehunter beeswax bena bibeak bison blaze blemishine blitz blue-poison breeze broca bryophyta bubble cantabile cardigan castle-3 cement ceobe ceylon chiave chongyue click cliffheart conviction corroserum courier croissant cuora cutter czerny dagda deepcolor delphine diamante dur-nar durin dusk earthspirit ebenholz elysium estelle ethan eunectes executor exusiai eyjafjalla fang fartooth feater firewatch firewhistle flamebringer flametail flint folinic franka friston-3 frost frostleaf gavial gitano gladiia glaucus gnosis goldenglow grani gravel greythroat greyy gummy harmonie haze heavyrain heidi hellagur hibiscus highmore honeyberry horn hoshiguma hung ifrit indigo indra ines irene iris istina jackie jaye jessica kafka kjera kroos la-pluma lancet-2 lappland lava leizi leonhardt lin ling liskarm logos lumen magallan manticore marcille matoimaru matterhorn may melantha midnight mint miss-christine mizuki morgan mostima mountain mr-nothing mudrock muelsyse mulberry myrrh myrtle nearl necrass nian nightingale nightmare noir-corne nymph orchid pallas passenger penance perfumer platinum plume podenco poncirus popukar pramanix projekt-red provence ptilopsis pudding purestream puzzle qanipalaat qiubai quartz quercus rangers rathalos-s-noir-corne reed roberta robin rockrock rope rosa saga saileach santalla saria savage scavenger scene schwarz shalem shirayuki sideroca siege silence silverash skadi skyfire snowsant sora specter spot stainless steward surtr suzuran swire tachanka tecno tequila texas thorns thrm-ex tomimi tsukinogi utage vanilla vermeil vigil vigna viviana-droste vulcan waai-fu warfarin warmy weedy whislash whisperain wild-mane wind-chimes windflit yato zima"; // @voice-list
const VOICE_MISS = {"adnachiel":"027 028","ansel":"027 028","beagle":"027 028","bison":"028","cardigan":"027 028","castle-3":"013 014","ceylon":"028","durin":"027 028","fang":"027 028","friston-3":"013 014","hibiscus":"027 028","kroos":"028","lancet-2":"013 014","lava":"027 028","melantha":"027 028","midnight":"014 027 028","myrtle":"028","noir-corne":"027 028","orchid":"014","plume":"014","popukar":"014 027 028","rangers":"027 028","spot":"014","steward":"027 028","vanilla":"014"}; // @voice-miss
const VOICED = new Set(VOICE_LIST.split(" "));
// line: one line id or a list to pick from; lines an operator doesn't have are skipped
function voice(k, line, chance = 1) {
  if (muted() || !k || !VOICED.has(k) || R() > chance) return;
  const gone = VOICE_MISS[k] || "", opts = (Array.isArray(line) ? line : [line]).filter(l => !gone.includes(l));
  if (!opts.length) return;
  line = pick(opts);
  const now = performance.now();
  if (AUD.voice && !AUD.voice.ended && now - AUD.voiceT < 900) return; // don't talk over a line that just started
  try {
    if (AUD.voice) AUD.voice.pause();
    const a = new Audio(ASSET + "voice/" + k + "/CN_" + line + ".mp3");
    a.volume = clamp(audioPrefs().voice, 0, 1);
    AUD.voice = a; AUD.voiceT = now;
    AUD.duck = .4; musicVolume();
    const undo = () => { if (AUD.voice === a) { AUD.duck = 1; musicVolume(); } };
    a.onended = undo; a.onerror = undo;
    a.play().catch(undo);
  } catch (e) { /* audio unavailable */ }
}
const VO = { title: "037", greet: "042", tap: ["002", "003", "004", "034"], onboard: "011", promo1: "013", promo2: "014", squad: "017", leader: "018", depart: "019",
  begin: "020", battle: ["025", "026", "027", "028"], three: "030", clear: "031", fail: "032" };
