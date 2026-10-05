
// =====================================================================
//  SD SPRITES — real Arknights battle chibis (Spine), drawn into the battle canvas
//  Each unit with a sprite gets a Spine skeleton (front, and back for operators) that plays
//  Idle / Attack / Skill_N / Move / Die / Start to match the battle poses. Skeletons render into an
//  offscreen WebGL canvas and are copied into the 2D battle canvas at the unit's spot, so depth
//  order, flashes and effects work as before. Spine 3.5 skeletons go through Aceship's binary→JSON
//  converter and the 3.6 runtime; 3.8 skeletons use the official 3.8 runtime (mobile/vendor).
//  Over file:// the data files can't be fetched, so units keep their drawn figures there.
// =====================================================================
// available sprites (mobile/tools/fetch_sd.py writes these): slug → [charId, has back view, Spine version]; enemy key → [enemyId, version]
const SD_OPS = {"12f":["char_009_12fce",1,"3.5.51"],"absinthe":["char_405_absin",1,"3.5.51"],"adnachiel":["char_211_adnach",1,"3.5.51"],"akafuyu":["char_475_akafyu",1,"3.5.51"],"ambriel":["char_302_glaze",1,"3.5.51"],"amiya":["char_002_amiya",1,"3.5.51"],"angelina":["char_291_aglina",0,"3.5.51"],"ansel":["char_212_ansel",1,"3.5.51"],"april":["char_365_aprl",1,"3.5.51"],"archetto":["char_332_archet",1,"3.5.51"],"arene":["char_271_spikes",1,"3.5.51"],"asbestos":["char_378_asbest",1,"3.5.51"],"ash":["char_456_ash",1,"3.5.51"],"ashlock":["char_431_ashlok",1,"3.5.51"],"astesia":["char_274_astesi",1,"3.5.51"],"astgenne":["char_135_halo",1,"3.8.99"],"aurora":["char_422_aurora",1,"3.5.51"],"ayerscarpe":["char_294_ayer",1,"3.5.51"],"bagpipe":["char_222_bpipe",1,"3.5.51"],"beagle":["char_122_beagle",1,"3.5.51"],"beanstalk":["char_452_bstalk",1,"3.5.51"],"beehunter":["char_137_brownb",1,"3.5.51"],"beeswax":["char_344_beewax",1,"3.5.51"],"bena":["char_369_bena",1,"3.5.51"],"bibeak":["char_252_bibeak",1,"3.5.51"],"bison":["char_325_bison",1,"3.5.51"],"blaze":["char_017_huang",1,"3.5.51"],"blemishine":["char_423_blemsh",1,"3.5.51"],"blitz":["char_457_blitz",1,"3.5.51"],"blue-poison":["char_129_bluep",1,"3.5.51"],"breeze":["char_275_breeze",1,"3.5.51"],"broca":["char_356_broca",1,"3.5.51"],"bubble":["char_381_bubble",1,"3.5.51"],"cantabile":["char_497_ctable",1,"3.8.99"],"cardigan":["char_209_ardign",1,"3.5.51"],"castle-3":["char_286_cast3",1,"3.5.51"],"ceobe":["char_2013_cerber",1,"3.5.51"],"ceylon":["char_348_ceylon",1,"3.5.51"],"chiave":["char_349_chiave",1,"3.5.51"],"click":["char_328_cammou",1,"3.5.51"],"cliffheart":["char_173_slchan",1,"3.5.51"],"conviction":["char_159_peacok",1,"3.5.51"],"corroserum":["char_489_serum",1,"3.5.51"],"courier":["char_198_blackd",1,"3.5.51"],"croissant":["char_201_moeshd",1,"3.5.51"],"cuora":["char_150_snakek",1,"3.5.51"],"cutter":["char_301_cutter",1,"3.5.51"],"czerny":["char_4047_pianst",1,"3.8.99"],"deepcolor":["char_110_deepcl",1,"3.5.51"],"dur-nar":["char_260_durnar",1,"3.5.51"],"durin":["char_501_durin",1,"3.5.51"],"dusk":["char_2015_dusk",1,"3.5.51"],"earthspirit":["char_183_skgoat",1,"3.5.51"],"ebenholz":["char_4046_ebnhlz",1,"3.8.99"],"elysium":["char_401_elysm",1,"3.5.51"],"estelle":["char_127_estell",1,"3.5.51"],"ethan":["char_355_ethan",1,"3.5.51"],"eunectes":["char_416_zumama",1,"3.5.51"],"executor":["char_279_excu",1,"3.5.51"],"exusiai":["char_103_angel",1,"3.5.51"],"eyjafjalla":["char_180_amgoat",1,"3.5.51"],"fang":["char_123_fang",1,"3.5.51"],"fartooth":["char_430_fartth",1,"3.5.51"],"feater":["char_241_panda",1,"3.5.51"],"firewatch":["char_158_milu",1,"3.5.51"],"flamebringer":["char_131_flameb",1,"3.5.51"],"flametail":["char_420_flamtl",1,"3.5.51"],"flint":["char_415_flint",1,"3.5.51"],"folinic":["char_345_folnic",1,"3.5.51"],"franka":["char_106_franka",1,"3.5.51"],"frost":["char_458_rfrost",1,"3.5.51"],"frostleaf":["char_193_frostl",1,"3.5.51"],"gavial":["char_187_ccheal",1,"3.5.51"],"gitano":["char_109_fmout",1,"3.5.51"],"gladiia":["char_474_glady",1,"3.5.51"],"glaucus":["char_326_glacus",1,"3.5.51"],"gnosis":["char_206_gnosis",1,"3.5.51"],"goldenglow":["char_377_gdglow",1,"3.5.51"],"grani":["char_220_grani",1,"3.5.51"],"gravel":["char_237_gravel",1,"3.5.51"],"greythroat":["char_367_swllow",1,"3.5.51"],"greyy":["char_253_greyy",1,"3.5.51"],"gummy":["char_196_sunbr",1,"3.5.51"],"haze":["char_141_nights",1,"3.5.51"],"heavyrain":["char_304_zebra",1,"3.5.51"],"heidi":["char_4045_heidi",0,"3.8.99"],"hellagur":["char_188_helage",1,"3.5.51"],"hibiscus":["char_120_hibisc",1,"3.5.51"],"honeyberry":["char_449_glider",1,"3.5.51"],"horn":["char_4039_horn",1,"3.8.99"],"hoshiguma":["char_136_hsguma",1,"3.5.51"],"hung":["char_226_hmau",1,"3.5.51"],"ifrit":["char_134_ifrit",1,"3.5.51"],"indigo":["char_469_indigo",1,"3.5.51"],"indra":["char_155_tiger",1,"3.5.51"],"irene":["char_4009_irene",1,"3.8.99"],"iris":["char_338_iris",1,"3.5.51"],"istina":["char_195_glassb",1,"3.5.51"],"jackie":["char_347_jaksel",1,"3.5.51"],"jaye":["char_272_strong",1,"3.5.51"],"jessica":["char_235_jesica",1,"3.5.51"],"kafka":["char_214_kafka",1,"3.5.51"],"kjera":["char_4013_kjera",1,"3.5.51"],"kroos":["char_124_kroos",1,"3.5.51"],"la-pluma":["char_421_crow",1,"3.5.51"],"lancet-2":["char_285_medic2",1,"3.5.51"],"lappland":["char_140_whitew",1,"3.5.51"],"lava":["char_121_lava",1,"3.5.51"],"leizi":["char_306_leizi",1,"3.5.51"],"leonhardt":["char_373_lionhd",1,"3.5.51"],"ling":["char_2023_ling",1,"3.5.51"],"liskarm":["char_107_liskam",1,"3.5.51"],"lumen":["char_4042_lumen",1,"3.8.99"],"magallan":["char_248_mgllan",1,"3.5.51"],"manticore":["char_215_mantic",1,"3.5.51"],"matoimaru":["char_289_gyuki",1,"3.5.51"],"matterhorn":["char_199_yak",1,"3.5.51"],"may":["char_133_mm",1,"3.5.51"],"melantha":["char_208_melan",1,"3.5.51"],"midnight":["char_283_midn",1,"3.5.51"],"mint":["char_388_mint",1,"3.5.51"],"mizuki":["char_437_mizuki",1,"3.5.51"],"mostima":["char_213_mostma",1,"3.5.51"],"mountain":["char_264_f12yin",1,"3.5.51"],"mr-nothing":["char_455_nothin",1,"3.5.51"],"mudrock":["char_311_mudrok",1,"3.5.51"],"mulberry":["char_473_mberry",1,"3.5.51"],"myrrh":["char_117_myrrh",1,"3.5.51"],"myrtle":["char_151_myrtle",1,"3.5.51"],"nearl":["char_148_nearl",1,"3.5.51"],"nian":["char_2014_nian",1,"3.5.51"],"nightingale":["char_179_cgbird",1,"3.5.51"],"nightmare":["char_164_nightm",1,"3.5.51"],"noir-corne":["char_500_noirc",1,"3.5.51"],"orchid":["char_278_orchid",1,"3.5.51"],"pallas":["char_485_pallas",1,"3.5.51"],"passenger":["char_472_pasngr",1,"3.5.51"],"perfumer":["char_181_flower",1,"3.5.51"],"pith":["char_509_acast",1,"3.5.51"],"platinum":["char_204_platnm",1,"3.5.51"],"plume":["char_192_falco",1,"3.5.51"],"podenco":["char_258_podego",1,"3.5.51"],"popukar":["char_281_popka",1,"3.5.51"],"pramanix":["char_174_slbell",1,"3.5.51"],"projekt-red":["char_144_red",1,"3.5.51"],"provence":["char_145_prove",1,"3.5.51"],"ptilopsis":["char_128_plosis",1,"3.5.51"],"pudding":["char_4004_pudd",1,"3.5.51"],"purestream":["char_385_finlpp",1,"3.5.51"],"quercus":["char_492_quercu",1,"3.5.51"],"rangers":["char_503_rang",1,"3.5.51"],"reed":["char_261_sddrag",1,"3.5.51"],"roberta":["char_484_robrta",1,"3.5.51"],"robin":["char_451_robin",1,"3.5.51"],"rockrock":["char_4040_rockr",1,"3.8.99"],"rope":["char_236_rope",1,"3.5.51"],"rosa":["char_197_poca",1,"3.5.51"],"saga":["char_362_saga",1,"3.5.51"],"saileach":["char_479_sleach",1,"3.5.51"],"saria":["char_202_demkni",1,"3.5.51"],"savage":["char_230_savage",1,"3.5.51"],"scavenger":["char_149_scave",1,"3.5.51"],"scene":["char_336_folivo",1,"3.5.51"],"schwarz":["char_340_shwaz",1,"3.5.51"],"shalem":["char_4025_aprot2",1,"3.5.51"],"sharp":["char_508_aguard",1,"3.5.51"],"shirayuki":["char_118_yuki",1,"3.5.51"],"sideroca":["char_333_sidero",1,"3.5.51"],"siege":["char_112_siege",1,"3.5.51"],"silence":["char_108_silent",1,"3.5.51"],"silverash":["char_172_svrash",1,"3.5.51"],"skadi":["char_263_skadi",1,"3.5.51"],"skyfire":["char_166_skfire",1,"3.5.51"],"snowsant":["char_383_snsant",1,"3.5.51"],"sora":["char_101_sora",0,"3.5.51"],"specter":["char_143_ghost",1,"3.5.51"],"spot":["char_284_spot",1,"3.5.51"],"steward":["char_210_stward",1,"3.5.51"],"surtr":["char_350_surtr",1,"3.5.51"],"suzuran":["char_358_lisa",1,"3.5.51"],"swire":["char_308_swire",1,"3.5.51"],"tachanka":["char_459_tachak",1,"3.5.51"],"tequila":["char_486_takila",1,"3.5.51"],"texas":["char_102_texas",1,"3.5.51"],"thorns":["char_293_thorns",1,"3.5.51"],"thrm-ex":["char_376_therex",1,"3.5.51"],"tomimi":["char_411_tomimi",1,"3.5.51"],"tsukinogi":["char_343_tknogi",1,"3.5.51"],"utage":["char_337_utage",1,"3.5.51"],"vanilla":["char_240_wyvern",1,"3.5.51"],"vermeil":["char_190_clour",1,"3.5.51"],"vigna":["char_290_vigna",1,"3.5.51"],"vulcan":["char_163_hpsts",1,"3.5.51"],"waai-fu":["char_243_waaifu",1,"3.5.51"],"warfarin":["char_171_bldsk",1,"3.5.51"],"weedy":["char_400_weedy",1,"3.5.51"],"whislash":["char_265_sophia",1,"3.5.51"],"whisperain":["char_436_whispr",1,"3.5.51"],"wild-mane":["char_496_wildmn",1,"3.5.51"],"windflit":["char_433_windft",1,"3.8.99"],"yato":["char_502_nblade",1,"3.5.51"],"zima":["char_115_headbr",1,"3.5.51"]}; // @sd-ops
const SD_EN = {"acidslug":["enemy_1004_mslime","3.5.51"],"caster":["enemy_1011_wizard","3.5.51"],"centurion":["enemy_1501_demonk","3.5.51"],"crossbow":["enemy_1003_ncbow","3.5.51"],"crownslayer":["enemy_1502_crowns","3.5.51"],"emperorsblade":["enemy_1115_embald","3.5.51"],"enraged":["enemy_1062_rager","3.5.51"],"faust":["enemy_1508_faust","3.5.51"],"frostnova":["enemy_1505_frstar","3.5.51"],"gshield":["enemy_1081_sotisd","3.5.51"],"gsniper":["enemy_1079_sotisp","3.5.51"],"guerrilla":["enemy_1078_sotisc","3.5.51"],"herald":["enemy_1080_sotidp","3.5.51"],"hound":["enemy_1000_gopro","3.5.51"],"mephisto":["enemy_1507_mephi","3.5.51"],"mortar":["enemy_1082_soticn","3.5.51"],"patriot":["enemy_1506_patrt","3.5.51"],"queenslug":["enemy_1050_lslime","3.5.51"],"sarkaz":["enemy_1010_demon","3.5.51"],"sarkazcaster":["enemy_1085_sotiwz","3.5.51"],"shield":["enemy_1006_shield","3.5.51"],"siegebreaker":["enemy_1083_sotiab","3.5.51"],"singer":["enemy_1514_smephi","3.5.51"],"skullshatterer":["enemy_1500_skulsr","3.5.51"],"slug":["enemy_1007_slime","3.5.51"],"soldier":["enemy_1002_nsabr","3.5.51"],"striker":["enemy_1113_empace","3.5.51"],"talulah":["enemy_1503_talula","3.5.51"],"thrower":["enemy_1028_mocock","3.5.51"],"vdubcaster":["enemy_1168_dumage","3.5.51"],"vevocator":["enemy_1176_dusocr","3.5.51"],"vmandragora":["enemy_1523_mandra","3.5.51"],"w":["enemy_1504_cqbw","3.5.51"],"wraith":["enemy_1068_snmage","3.5.51"],"yeti":["enemy_1069_icebrk","3.5.51"]}; // @sd-en
const SD = { on: typeof location !== "undefined" && location.protocol !== "file:", rt: null, data: {}, fail: {} };
const SD_K = .27;      // skeleton units → battle units (keeps Arknights' relative sizes: slugs small, Patriot huge)
const SD_DIR = 1;      // the art faces right
const SD_VENDOR = "vendor/";
const SD_TMP = { off: null, size: null };

function sdScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("can't load " + src)); document.head.appendChild(s); });
}
// both runtimes use the global name "spine": load 3.8, set it aside, then load the 3.6 runtime and the 3.5 converter
function sdRuntimes() {
  return SD.rt || (SD.rt = (async () => {
    await sdScript(SD_VENDOR + "spine-webgl-3.8.js");
    const s38 = window.spine; window.spine = undefined;
    await sdScript(SD_VENDOR + "spine-widget.js");
    const s36 = window.spine;
    await sdScript(SD_VENDOR + "spine-skeleton-binary.js");
    const mk = (R, v38) => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 512;
      const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true });
      if (!gl) throw new Error("WebGL unavailable");
      const ctx = v38 ? new R.webgl.ManagedWebGLRenderingContext(gl) : gl;
      const scene = v38 ? new R.webgl.SceneRenderer(cv, ctx, true) : new R.webgl.SceneRenderer(cv, gl);
      return { R, cv, gl, ctx, scene, v38, off: new R.Vector2(), size: new R.Vector2(), temp: [] };
    };
    return { r38: mk(s38, true), r36: mk(s36, false) };
  })());
}
// skeleton data for one sprite (cached); null when it can't be loaded
function sdLoad(path) {
  if (path in SD.data) return SD.data[path];
  return SD.data[path] = (async () => {
    const rt = await sdRuntimes();
    const [bin, atlasText] = await Promise.all([
      fetch(path + ".skel").then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => new Uint8Array(b)),
      fetch(path + ".atlas").then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }),
    ]);
    const v38 = /3\.8\./.test(new TextDecoder().decode(bin.slice(0, 64)));
    const E = v38 ? rt.r38 : rt.r36, R = E.R, dir = path.slice(0, path.lastIndexOf("/") + 1);
    const lines = atlasText.split(/\r?\n/), pages = lines.filter((l, i) => /\.png\s*$/i.test(l) && (i === 0 || !lines[i - 1].trim())).map(l => l.trim());
    const imgs = {};
    await Promise.all(pages.map(p => new Promise((res, rej) => { const im = new Image(); im.onload = () => { imgs[p] = im; res(); }; im.onerror = () => rej(new Error("texture " + p)); im.src = dir + p; })));
    const atlas = new R.TextureAtlas(atlasText, p => new R.webgl.GLTexture(E.ctx, imgs[p.trim()] || Object.values(imgs)[0]));
    let data;
    if (v38) data = new R.SkeletonBinary(new R.AtlasAttachmentLoader(atlas)).readSkeletonData(bin);
    else { const sb = new SkeletonBinary(); sb.data = bin; sb.initJson(); data = new R.SkeletonJson(new R.AtlasAttachmentLoader(atlas)).readSkeletonData(sb.json); }
    return { E, data, names: data.animations.map(a => a.name) };
  })().catch(e => { SD.fail[path] = e.message; return null; });
}
function sdSpec(u) {
  if (u.isOp) { const o = SD_OPS[u.key]; if (!o) return null; const b = ASSET + "sd/char/" + o[0] + "/"; return { front: b + "front/" + o[0], back: o[1] ? b + "back/" + o[0] : null }; }
  const e = SD_EN[u.key]; return e ? { front: ASSET + "sd/enemy/" + e[0], back: null } : null;
}
function sdInst(L) {
  if (!L) return null;
  const R = L.E.R, stateData = new R.AnimationStateData(L.data); stateData.defaultMix = .12;
  const skel = new R.Skeleton(L.data), state = new R.AnimationState(stateData);
  // some skeletons keep their parts in a named skin (the Reunion Caster's is "Wizard"), not the default one
  const parts = sk => sk && sk.attachments ? sk.attachments.reduce((a, m) => a + (m ? Object.keys(m).length : 0), 0) : 0;
  if (!parts(L.data.defaultSkin)) { const sk = L.data.skins.find(x => parts(x) > 0); if (sk) skel.setSkinByName(sk.name); }
  skel.setToSetupPose();
  const inst = { L, skel, state, cur: null, key: null, t: BT.clock };
  const idle = sdAnim(L.names, "idle"); if (idle) state.setAnimation(0, idle, true);
  state.update(0); state.apply(skel); skel.updateWorldTransform();
  skel.getBounds(L.E.off, L.E.size, L.E.temp);
  inst.h = Math.max(60, L.E.size.y) * SD_K;
  inst.cur = idle;
  return inst;
}
// load a unit's sprites; resolves when ready (or when there's nothing to load)
async function sdPrepare(vu) {
  if (!SD.on || vu.sd !== undefined) return;
  vu.sd = null;
  const sp = sdSpec(vu.u); if (!sp) return;
  try {
    const [f, b] = await Promise.all([sdLoad(sp.front), sp.back ? sdLoad(sp.back) : null]);
    if (f) vu.sd = { f: sdInst(f), b: b ? sdInst(b) : null };
  } catch (e) { SD.fail[sp.front] = e.message; }
}
const sdPrepareAll = vus => Promise.all(vus.map(sdPrepare));

// the Spine animation for a battle pose
function sdAnim(names, kind, slot) {
  const has = n => names.includes(n), find = re => names.find(n => re.test(n));
  // names vary: Idle / Idle_1 / C1_Idle, Move_Loop / Move_1, Attack / Attack_1 / Combat …
  if (kind === "idle") return has("Idle") ? "Idle" : find(/^Idle/) || find(/Idle(_1)?$/i) || find(/Idle/i) || find(/^Default/) || names[0];
  if (kind === "move") return has("Move_Loop") ? "Move_Loop" : has("Move") ? "Move" : find(/^(Move|Run)/) || find(/Move(_1)?$|Move_?Loop/i) || null;
  if (kind === "die") return has("Die") ? "Die" : find(/^Die/) || find(/Die/i) || null;
  if (kind === "start") return has("Start") ? "Start" : null;
  if (kind === "stun") return has("Stun") ? "Stun" : null;
  if (kind === "skill") {
    const n = slot || 1;
    return [`Skill_${n}`, `Skill${n}`, `Skill_${n}_Loop`, `Skill${n}_Loop`, `Skill_${n}_Begin`, `Skill${n}_Begin`].find(has)
      || (has("Skill") ? "Skill" : null) || find(/^Skill.*Loop$/) || find(/^Skill/) || sdAnim(names, "attack");
  }
  return has("Attack") ? "Attack" : has("Attack_Loop") ? "Attack_Loop" : find(/^Attack/) || find(/^Combat/) || find(/Attack/i) || find(/Skill/i) || null;
}
// what the unit should be doing right now: [animation, loop, restart key, duration hint ms]
function sdWant(vu, inst) {
  const names = inst.L.names, p = vu.pose;
  if (vu.dead) return [sdAnim(names, "die"), false, "die", 0];
  if (vu.spawnT != null && vu.spawnT <= BT.clock && BT.clock - vu.spawnT < 900) { const s = sdAnim(names, "start"); if (s) return [s, false, "start" + vu.spawnT, 900]; }
  if (vu.effs && vu.effs.some(x => x[0] === "STUN")) { const s = sdAnim(names, "stun"); if (s) return [s, true, "stun", 0]; }
  const n = p.name;
  if (n === "run") { const m = sdAnim(names, "move"); if (m) return [m, true, "move", 0]; }
  if (n === "swing" || n === "shoot" || n === "cast") return [vu.sdSlot ? sdAnim(names, "skill", vu.sdSlot) : sdAnim(names, "attack") || sdAnim(names, "idle"), false, n + p.t0, p.dur];
  if (n === "buff") return [sdAnim(names, "skill", vu.sdSlot || 1), false, n + p.t0, p.dur];
  return [sdAnim(names, "idle"), true, "idle", 0];
}
// draw the unit's sprite in its local space (feet at 0,0, +x = facing); returns anchor points like drawFigure
function sdDraw(g, vu, sc, back) {
  const inst = (back && vu.sd.b) || vu.sd.f, L = inst.L, E = L.E, R = E.R, st = inst.state, skel = inst.skel;
  const [name, loop, key, durMs] = sdWant(vu, inst);
  if (name && key !== inst.key) {
    inst.key = key;
    const anim = L.data.findAnimation(name);
    const tr = st.setAnimation(0, name, loop);
    // one-shot animations fit the pose's length, then fall back to idle
    tr.timeScale = !loop && durMs && anim ? clamp(anim.duration / (durMs / 1000 * 1.1), .8, 3) : 1;
    if (!loop && key !== "die") { const idle = sdAnim(L.names, "idle"); if (idle) st.addAnimation(0, idle, true, 0); }
  }
  const dt = Math.max(0, (BT.clock - inst.t) / 1000); inst.t = BT.clock;
  st.update(dt); st.apply(skel); skel.updateWorldTransform();
  skel.getBounds(E.off, E.size, E.temp);
  const ox = E.off.x, oy = E.off.y, w = Math.max(1, E.size.x), h = Math.max(1, E.size.y);
  const px = w * SD_K * sc * BT.dpr, py = h * SD_K * sc * BT.dpr, f = Math.min(1, 510 / Math.max(px, py));
  const pw = Math.max(2, Math.ceil(px * f)), ph = Math.max(2, Math.ceil(py * f));
  const gl = E.gl, cam = E.scene.camera;
  gl.viewport(0, 0, pw, ph); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  cam.viewportWidth = pw; cam.viewportHeight = ph; cam.zoom = w / pw;
  cam.position.x = ox + w / 2; cam.position.y = oy + h / 2;
  E.scene.begin(); E.scene.drawSkeleton(skel, true); E.scene.end();
  g.drawImage(E.cv, 0, E.cv.height - ph, pw, ph, ox * SD_K, -(oy + h) * SD_K, w * SD_K, h * SD_K);
  const H = inst.h;
  return { head: [0, -H * .78], chest: [0, -H * .5], tip: [H * .3, -H * .5], top: [0, -H - 6], sd: 1 };
}
