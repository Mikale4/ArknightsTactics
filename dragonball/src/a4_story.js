// =====================================================================
//  STORY — "Let It Rip!": the original anime retold as battles, from the Bey City regionals (Season 1)
//  through V-Force to the G-Revolution final. Lines are written for the game; names follow the English dub.
//  Node types: story · battle · side · chest · boss
// =====================================================================
// story bosses: tougher versions of playable Beyblades [unit, Spin multiplier, ATK multiplier]
bossOf("b_kai", "kai-s", 3.0, 1.0); bossOf("b_lee", "lee-s", 3.0, 1.0); bossOf("b_michael", "michael-s", 2.9, 1.02);
bossOf("b_sanguinex", "sanguinex-s", 2.3, 1.0); bossOf("b_robert", "robert-s", 2.5, 1.0); bossOf("b_bryan", "bryan-s", 2.6, 1.04);
bossOf("b_blackdranzer", "kai-bd", 2.3, 1.0); bossOf("b_tala", "tala-s", 4.3, 1.15);
bossOf("b_dunga", "dunga-v", 2.5, 1.0); bossOf("b_ozuma", "ozuma-v", 2.3, 1.0); bossOf("b_jim", "jim-v", 2.6, 1.0); bossOf("b_kane", "kane-v", 3.5, 1.1);
bossOf("b_ozuma2", "ozuma-v2", 2.6, 1.0); bossOf("b_king", "king-v", 2.6, 1.02); bossOf("b_gordo", "gordo-v", 2.6, 1.02); bossOf("b_zeo", "zeo-v", 1.7, 0.95);
bossOf("b_daichi", "daichi-v", 2.6, 1.0); bossOf("b_hiro", "hiro-g", 4.4, 1.18); bossOf("b_julia", "julia-g", 2.6, 1.02); bossOf("b_miguel", "miguel-g", 1.5, 0.95);
bossOf("b_ray", "ray-g", 2.6, 1.04); bossOf("b_max", "max-g", 2.3, .92); bossOf("b_tala4", "tala-g", 2.7, 1.04); bossOf("b_kaigt", "kai-gt", 2.0, 0.96);
bossOf("b_mingming", "mingming-g", 2.4, .98); bossOf("b_mystel", "mystel-g", 1.7, 0.95); bossOf("b_crusher", "crusher-g", 2.4, 1.0);
bossOf("b_garland", "garland-g", 3.0, 1.08); bossOf("b_brooklyn", "brooklyn-g", 3.5, 1.14);
// Carlos, leader of the Blade Sharks, isn't a collectable Beyblade: he launches three tops at once
ENEMY.b_carlos = { key: "b_carlos", enemy: true, boss: 1, runes: [], passives: [], n: "Spin Cutter", blader: "Carlos", cls: "Attack", el: "Attack", m: { hp: 2.2, atk: .95, def: .8, spd: 110 },
  fig: kid("#1a1a20", "#2a6a6a", "#1a1a24", { hs: "spiky", bandana: "#d83a2a", h: 1.08 }), bey: { ring: "#2a8a8a", ring2: "#ffd34d", disk: "#7a8090", base: "#1a2a2a", shape: "saw", chip: "#5fd4ff" },
  skills: [S1("Spin Cutter", 1.4, [dbf("DEF_BREAK", .25)], 2), S2("Triangle Attack", "aoe_enemies", 1.7, [tmDown(.15)])] };

// people who don't blade (drawn from a figure, shown on the left unless `right`)
const NPC = x => F({ w: null, ...x });
const SPK = {
  narr: { n: "" },
  tyson: { n: "Tyson", op: "tyson-s" }, kai: { n: "Kai", op: "kai-s" }, ray: { n: "Ray", op: "ray-s" }, max: { n: "Max", op: "max-s" }, kenny: { n: "Kenny", op: "kenny-s" },
  daichi: { n: "Daichi", op: "daichi-v" }, hiro: { n: "Hiro", op: "hiro-g" }, lee: { n: "Lee", op: "lee-s" }, mariah: { n: "Mariah", op: "mariah-s" }, michael: { n: "Michael", op: "michael-s" },
  robert: { n: "Robert", op: "robert-s" }, tala: { n: "Tala", op: "tala-s" }, ozuma: { n: "Ozuma", op: "ozuma-v" }, kane: { n: "Kane", op: "kane-v" }, rick: { n: "Rick", op: "rick-g" },
  kai_e: { n: "Kai", en: "b_kai" }, carlos: { n: "Carlos", en: "b_carlos" }, lee_e: { n: "Lee", en: "b_lee" }, kevin: { n: "Kevin", fig: OPS["kevin-s"].fig, right: 1 },
  michael_e: { n: "Michael", en: "b_michael" }, emily: { n: "Emily", fig: OPS["emily-s"].fig, right: 1 }, sanguinex: { n: "Sanguinex", en: "b_sanguinex" },
  robert_e: { n: "Robert", en: "b_robert" }, johnny: { n: "Johnny", fig: OPS["johnny-s"].fig, right: 1 }, bryan: { n: "Bryan", en: "b_bryan" }, tala_e: { n: "Tala", en: "b_tala" },
  blackkai: { n: "Kai", en: "b_blackdranzer" }, spencer: { n: "Spencer", fig: OPS["spencer-s"].fig, right: 1 },
  mrx: { n: "Mr. X", en: "b_ozuma" }, ozuma_e: { n: "Ozuma", en: "b_ozuma2" }, dunga: { n: "Dunga", en: "b_dunga" }, mariam: { n: "Mariam", fig: OPS["mariam-v"].fig, right: 1 },
  jim: { n: "Jim", en: "b_jim" }, kane_e: { n: "Kane", en: "b_kane" }, salima: { n: "Salima", fig: OPS["salima-v"].fig, right: 1 }, zeo: { n: "Zeo", fig: OPS["zeo-v"].fig },
  zeo_e: { n: "Zeo", en: "b_zeo" }, gordo: { n: "Gordo", en: "b_gordo" }, king: { n: "King", en: "b_king" }, queen: { n: "Queen", fig: OPS["queen-v"].fig, right: 1 },
  daichi_e: { n: "Daichi", en: "b_daichi" }, jin: { n: "Jin of the Gale", en: "b_hiro" }, julia: { n: "Julia", en: "b_julia" }, raul: { n: "Raul", fig: OPS["raul-g"].fig, right: 1 },
  miguel: { n: "Miguel", en: "b_miguel" }, mathilda: { n: "Mathilda", fig: OPS["mathilda-g"].fig, right: 1 }, ray_e: { n: "Ray", en: "b_ray" }, max_e: { n: "Max", en: "b_max" },
  tala_g: { n: "Tala", en: "b_tala4" }, kai_gt: { n: "Kai", en: "b_kaigt" }, mingming: { n: "Ming-Ming", en: "b_mingming" }, mystel: { n: "Mystel", en: "b_mystel" },
  crusher: { n: "Crusher", en: "b_crusher" }, garland: { n: "Garland", en: "b_garland" }, brooklyn: { n: "Brooklyn", en: "b_brooklyn" },
  dickenson: { n: "Mr. Dickenson", fig: NPC({ skin: "#f2dccb", hair: "#f2f2f6", hs: "old", col: "#6a6a72", col2: "#4a4a52", trim: "#c8a64a", acc: "#3a3a42", bulk: 1.2, h: .94 }) },
  jazzman: { n: "DJ Jazzman", fig: NPC({ hair: "#2a2a30", hs: "swoop", glasses: "#1a1a20", col: "#f2c14e", col2: "#2a2a30", trim: "#ff5a4a", acc: "#2a2a30" }) },
  grandpa: { n: "Grandpa", fig: NPC({ hair: "#f2f2f6", hs: "pony", hlen: 26, col: "#e8e0d0", col2: "#2a3a6a", robe: "robe", acc: "#2a3a6a", h: .96 }) },
  hilary: { n: "Hilary", fig: NPC({ hair: "#7a4a2a", hs: "bob", col: "#ff8ad8", col2: "#f2f2f6", robe: "skirt", acc: "#f2f2f6", eyec: "#8a5a3a", slim: 1, h: .92 }) },
  dizzi: { n: "Dizzi" },
  judy: { n: "Judy", fig: NPC({ hair: "#f2d27a", hs: "bob", col: "#f2f2f6", col2: "#2a2a3a", robe: "robe", acc: "#8a4ad8", eyec: "#4aa8ff", slim: 1 }) },
  boris: { n: "Boris", right: 1, fig: NPC({ skin: "#e8d0c0", hair: "#8a5ad8", hs: "short", glasses: "#5fd4ff", col: "#2a2a3a", col2: "#1a1a24", cape: "#1a1a24", acc: "#5a1a22", h: 1.12 }) },
  voltaire: { n: "Voltaire", right: 1, fig: NPC({ skin: "#e8d0c0", hair: "#a8a8b0", hs: "old", col: "#3a2a2a", col2: "#2a1a1a", acc: "#5a1a22", h: 1.04 }) },
  gideon: { n: "Gideon", right: 1, fig: NPC({ hair: "#8a5ad8", hs: "swoop", col: "#8a2a8a", col2: "#2a1a2a", trim: "#f2c14e", acc: "#f2c14e" }) },
  doctork: { n: "Doctor K", right: 1, fig: NPC({ hair: "#141418", hs: "bob", glasses: "#c8302a", col: "#f2f2f6", col2: "#2a2a30", robe: "robe", acc: "#2a2a30", slim: 1 }) },
  zagart: { n: "Dr. Zagart", right: 1, fig: NPC({ hair: "#5a4a3a", hs: "beard", glasses: "#ff3b5c", col: "#2a3a4a", col2: "#1a2430", acc: "#5a6a7a", bulk: 1.3, h: 1.14 }) },
  barthez: { n: "Barthez", right: 1, fig: NPC({ hair: "#2a2a30", hs: "short", col: "#3a3a5a", col2: "#2a2a3a", trim: "#f2c14e", acc: "#f2c14e", h: 1.06 }) },
};
const L = (s, t) => ({ s, t });
const W = (...list) => list.map(x => typeof x === "string" ? { e: x } : x);
const O = key => ({ op: key });

const STORY = [{
  id: "ep1", title: "Let It Rip!", sub: "Main Story",
  blurb: "From the riverbanks of Bey City to the BEGA stadium: three World Championships with the Bladebreakers.",
  chapters: [
    // ======================= SEASON 1 =======================
    { id: "c1", season: "Season 1", title: "Bey City Regionals", env: "river", map: "river", reward: { op: "kai-s", orundum: 300 },
      nodes: [
        { id: "1-1", type: "story", name: "The Dragon in the Sword", pre: [
          L("narr", "Bey City. Every kid on the block has a Beyblade, and every afternoon the riverbank turns into a stadium."),
          L("grandpa", "Yo, Tyson! Late for kendo again, little dude? The sword on that wall has been in our family for generations, you know."),
          L("tyson", "Sorry Grandpa, no time! Kenny says the Blade Sharks are stealing everybody's Beys down by the river."),
          L("kenny", "Not just stealing them, Tyson. Their leader is a Blader called Kai, and nobody has beaten him.") ] },
        { id: "1-2", type: "battle", name: "Blade Sharks", lv: 1, waves: [W("shark", "shark", "street")], pre: [
          L("carlos", "Hand over those Beys, kids. Blade Shark rules."),
          L("tyson", "Not a chance. Bladers ready? 3, 2, 1..."),
          L("max", "Let it rip!"),
          L("kenny", "Tap the launcher when the needle hits the sweet spot for a perfect launch!"),
          L("kenny", "Then your Beyblade circles the dish on its own. Tap ATTACK to rush the rival, and use your technique when it's charged.") ], post: [
          L("max", "Hi! I'm Max. My dad runs the hobby shop. You guys spin pretty good!"),
          L("tyson", "Pretty good? Watch me get even better.") ] },
        { id: "1-3", type: "battle", name: "The Hobby Shop", lv: 2, waves: [W("bully", "street", "bully")], pre: [
          L("max", "Dad lets anyone test their Beys in the stadium out back. Some kids just use it to push people around."),
          L("kenny", "Every hit builds Bit Power, the bar at the bottom. At 100%, a Beyblade can call its Bit-Beast for a special attack!"),
          L("max", "And it's one on one, but you can tag in a partner. Each of us can tag in once, and whoever tags out gets to rest and recover some Spin."),
          L("dizzi", "And I'll be in this laptop, being ignored. As usual.") ] },
        { id: "1-4", type: "chest", name: "Kenny's Toolbox", reward: { lmd: 2000, rec1: 6, orundum: 100 }, pre: [
          L("kenny", "Spare Weight Disks, a Blade Base or two... take what you need. A good Blader customizes!") ] },
        { id: "1-5", type: "side", name: "Carlos's Triple Launch", lv: 4, waves: [W("shark", "shark"), W("b_carlos", "shark")], pre: [
          L("carlos", "You beat my guys. Let's see you beat three Beys at once!"),
          L("ray", "Three launchers and one Blader. Spread out, everyone.") ], post: [
          L("carlos", "Tch. Kai's going to hear about this.") ] },
        { id: "1-6", type: "battle", name: "Regional Qualifiers", lv: 5, waves: [W("street", "trainee", "street"), W("shark", "trainee", "shark", "street")], pre: [
          L("jazzman", "Welcome to the Bey City Regional Tournament! Bladers, are you ready?"),
          L("ray", "Watch the badges over each Beyblade. Attack beats Endurance, Endurance beats Defense, and Defense beats Attack. Balance has no edge and no weakness."),
          L("kenny", "Every Beyblade slows down over time. Hit a weakened one hard near the rim and it flies right out of the dish. That's a Ring Out!"),
          L("kenny", "Parts matter too: the Attack Ring, Weight Disk, Spin Gear and Blade Base all change how a Beyblade moves and hits. Swap them in the Customize tab.") ] },
        { id: "1-7", type: "boss", name: "Tyson vs. Kai", lv: 7, waves: [W("shark", "shark"), W("b_kai", "shark", "shark")], pre: [
          L("kai_e", "So you're the one beating my Sharks. Your Beyblade is a toy."),
          L("tyson", "My Dragoon's no toy. Grandpa's sword had a Bit-Beast in it all along, and it chose me."),
          L("kai_e", "Then show me. Dranzer!") ], post: [
          L("jazzman", "Unbelievable! Tyson takes the regional title!"),
          L("dickenson", "Splendid battles, all of you. The BBA is sending a team to the Asian Tournament: Tyson, Kai, Ray and Max. You'll be the Bladebreakers."),
          L("kai", "...I'll be captain. Try to keep up."),
          L("tyson", "Captain? We'll see about that.") ] },
      ] },
    { id: "c2", season: "Season 1", title: "The White Tigers", env: "china", map: "china", reward: { op: "lee-s", orundum: 300 },
      nodes: [
        { id: "2-1", type: "story", name: "Hong Kong", pre: [
          L("narr", "The Bladebreakers land in Hong Kong for the Asian Tournament. Ray goes quiet the moment they step off the plane."),
          L("ray", "My old team is here. The White Tigers. I left our village with Driger, and they never forgave me."),
          L("max", "Then let's show them you made the right call!") ] },
        { id: "2-2", type: "battle", name: "Street Hustlers", lv: 8, waves: [W("street", "tiger", "street"), W("tiger", "tiger", "street")], pre: [
          L("kevin", "Hey, Ray! Long time. My friends want to see if your new team is any good."),
          L("ray", "Kevin. You haven't changed.") ] },
        { id: "2-3", type: "battle", name: "Crazy Monkey", lv: 9, waves: [W("tiger", O("kevin-s"), "tiger")], pre: [
          L("kevin", "Galman! Crazy Monkey Attack!"),
          L("kenny", "Four of them? It's an illusion! Only one of them is real.") ] },
        { id: "2-4", type: "chest", name: "Market Stall", reward: { lmd: 4000, rec1: 8, summ: 2, orundum: 100 }, pre: [
          L("tyson", "Dumplings first, Beyblades second. Kenny, pay the man.") ] },
        { id: "2-5", type: "side", name: "Mariah's Challenge", lv: 11, waves: [W("tiger", "tiger"), W(O("mariah-s"), O("gary-s"), "tiger")], pre: [
          L("mariah", "Ray! If you won't come home, then Galux and I will drag you there."),
          L("ray", "Mariah... I'm sorry. I'm not going back.") ], post: [
          L("mariah", "You really have changed, Ray. Fine. Win it all, then.") ] },
        { id: "2-6", type: "battle", name: "The China Tower", lv: 12, waves: [W(O("gary-s"), "tiger", "tiger"), W(O("kevin-s"), O("mariah-s"), "tiger")], pre: [
          L("jazzman", "Live from the China Tower, it's the Asian Tournament final!"),
          L("tyson", "Gary first? He's huge!"),
          L("kenny", "Bear Ax Attack hits like a truck. Keep your Spin up!") ] },
        { id: "2-7", type: "boss", name: "Ray vs. Lee", lv: 14, waves: [W("tiger", "tiger"), W("b_lee", O("gary-s"), "tiger")], pre: [
          L("lee_e", "You took Driger from our village, Ray. Galeon will take it back."),
          L("ray", "Driger chose to come with me, Lee. Let's settle this, sudden death."),
          L("lee_e", "Dark Lightning!") ], post: [
          L("lee", "...You've grown stronger, Ray. Driger is yours."),
          L("ray", "Thank you, Lee. Come cheer us on in America."),
          L("dickenson", "Asian champions! Next stop: the American Tournament.") ] },
      ] },
    { id: "c3", season: "Season 1", title: "The All Starz", env: "usa", map: "usa", reward: { op: "tyson-f", orundum: 300 },
      nodes: [
        { id: "3-1", type: "story", name: "Welcome to America", pre: [
          L("max", "My mom works at the PPB research center. She coaches the All Starz, the best team in America."),
          L("judy", "Hello, Max. Everything in the All Starz' training is data. Your friends' Beyblades are... old-fashioned."),
          L("tyson", "Old-fashioned? Dragoon's going to fly circles around your data.") ] },
        { id: "3-2", type: "battle", name: "PPB Training Center", lv: 15, waves: [W("allstar", "allstar", "trainee"), W("allstar", "allstar", "allstar")], pre: [
          L("kenny", "Their Beyblades are customized for every match. We need to upgrade too, Tyson.") ] },
        { id: "3-3", type: "battle", name: "Emily's Data", lv: 16, waves: [W("allstar", O("emily-s"), "allstar")], pre: [
          L("emily", "I've analysed every battle you've ever fought. The odds of you winning are twelve percent."),
          L("ray", "Then let's be the twelve percent.") ] },
        { id: "3-4", type: "chest", name: "Dragoon F", reward: { lmd: 6000, rec2: 6, chip: 2, orundum: 120 }, pre: [
          L("kenny", "I rebuilt Dragoon from the ground up. Meet Dragoon F!"),
          L("tyson", "Phantom Hurricane... yeah. This is it.") ] },
        { id: "3-5", type: "side", name: "Stampede", lv: 18, waves: [W("allstar", "allstar"), W(O("steve-s"), O("eddy-s"), "allstar")], pre: [
          L("max", "Steve plays football and Eddy plays basketball. They both blade like it's game day.") ], post: [
          L("max", "Good game, guys!") ] },
        { id: "3-6", type: "battle", name: "Las Vegas Stadium", lv: 19, waves: [W(O("steve-s"), "allstar", O("eddy-s")), W(O("emily-s"), "allstar", "allstar")], pre: [
          L("jazzman", "Welcome to Las Vegas! The All Starz versus the Bladebreakers!") ] },
        { id: "3-7", type: "boss", name: "Max vs. Michael", lv: 21, waves: [W("allstar", "allstar"), W("b_michael", O("emily-s"), "allstar")], pre: [
          L("michael_e", "Here's the windup... and the pitch! Trygle!"),
          L("max", "Draciel never gives up, and neither do I. Let's show Mom what friendship does."),
          L("judy", "Max... show me.") ], post: [
          L("judy", "I measured everything except your heart, Max. I'm proud of you."),
          L("michael", "Good game. Next time, I'm throwing my best stuff."),
          L("dickenson", "North America is yours! Now, Europe...") ] },
      ] },
    { id: "c4", season: "Season 1", title: "The Majestics", env: "europe", map: "europe", reward: { op: "kai-f", orundum: 300 },
      nodes: [
        { id: "4-1", type: "story", name: "Stranded", pre: [
          L("dickenson", "I'm afraid you'll have to find your own way across Europe. Consider it training!"),
          L("tyson", "He did that on purpose, didn't he."),
          L("kai", "Quiet. Something is following us.") ] },
        { id: "4-2", type: "battle", name: "London Fog", lv: 22, waves: [W("dark", "dark", "street"), W("dark", "dark", "dark")], pre: [
          L("narr", "In the fog of London, Bladers in black cloaks appear without a sound."),
          L("ray", "These are no ordinary Bladers. Their Bit-Beasts feel... cursed.") ] },
        { id: "4-3", type: "battle", name: "The Channel Train", lv: 23, waves: [W("dark", O("lupinex-s"), "dark")], pre: [
          L("ray", "A werewolf? Kenny, any silver in the toolbox?"),
          L("kenny", "I have a coin! Tape it on!") ] },
        { id: "4-4", type: "chest", name: "Paris Café", reward: { lmd: 8000, rec2: 8, summ: 3, orundum: 120 }, pre: [
          L("max", "Croissants! Does anybody have mustard?") ] },
        { id: "4-5", type: "side", name: "Dark Bladers", lv: 25, waves: [W(O("cenotaph-s"), O("zomb-s")), W("b_sanguinex", O("lupinex-s"), "dark")], pre: [
          L("sanguinex", "We lost to the Majestics, and we were cursed to wander. You will join us."),
          L("tyson", "No thanks. I've got a tournament to win.") ], post: [
          L("sanguinex", "You fought fairly... perhaps our curse can end after all.") ] },
        { id: "4-6", type: "battle", name: "Gladiator of Glasgow", lv: 26, waves: [W("knight", O("johnny-s"), "knight"), W(O("enrique-s"), O("oliver-s"), "knight")], pre: [
          L("johnny", "Commoners in our stadium? Salamalyon will burn you out of it."),
          L("kai", "Dranzer F is ready. Let him try.") ] },
        { id: "4-7", type: "boss", name: "The Olympia Challenge", lv: 28, waves: [W(O("johnny-s"), O("oliver-s")), W("b_robert", O("enrique-s"), "knight")], pre: [
          L("robert_e", "Welcome to my castle's coliseum. The Majestics battle with the honour of our families."),
          L("kai", "And we battle to win. Griffolyon won't stop Dranzer."),
          L("robert_e", "Wing Dagger!") ], post: [
          L("robert", "Remarkable. You've earned your place at the World Championship."),
          L("dickenson", "Well done! Pack your coats. We're going to Moscow.") ] },
      ] },
    { id: "c5", season: "Season 1", title: "The World Championship", env: "russia", map: "russia", reward: { op: "max-f", orundum: 400 },
      nodes: [
        { id: "5-1", type: "story", name: "Moscow", pre: [
          L("narr", "Moscow. Snow on every rooftop, and behind the walls of the Balkov Abbey, the Demolition Boys train without rest."),
          L("boris", "Welcome, Bladebreakers. Biovolt is honoured to host the World Championship."),
          L("kai", "Boris... I remember this place.") ] },
        { id: "5-2", type: "battle", name: "Biovolt Soldiers", lv: 29, waves: [W("biovolt", "biovolt", "dark"), W("biovolt", "biovolt", "biovolt")], pre: [
          L("kenny", "They don't battle like Bladers. They battle like machines.") ] },
        { id: "5-3", type: "battle", name: "Falborg", lv: 31, waves: [W("biovolt", O("ian-s"), "biovolt"), W("b_bryan", "biovolt", "biovolt")], pre: [
          L("bryan", "I don't attack Beyblades. I attack Bladers."),
          L("ray", "Driger and I won't back down. Not this time.") ] },
        { id: "5-4", type: "chest", name: "Draciel F", reward: { lmd: 10000, rec3: 4, chip: 2, orundum: 150 }, pre: [
          L("max", "Mom finished Draciel F! Fortress Defense, here we come.") ] },
        { id: "5-5", type: "side", name: "Lake Baikal", lv: 33, waves: [W("biovolt", "biovolt"), W("b_blackdranzer", "biovolt", "biovolt")], pre: [
          L("narr", "On the frozen surface of Lake Baikal, Kai stands alone with a Beyblade as black as night."),
          L("blackkai", "Black Dranzer is the strongest Bit-Beast in the world. I don't need the Bladebreakers."),
          L("tyson", "You're wrong, Kai. Let us show you.") ], post: [
          L("kai", "...I was a fool. I'm sorry. I'll battle with Dranzer from now on.") ] },
        { id: "5-6", type: "battle", name: "The Demolition Boys", lv: 34, waves: [W(O("ian-s"), "biovolt", "biovolt"), W(O("bryan-s"), O("spencer-s"), "biovolt")], pre: [
          L("jazzman", "It's the World Championship final! The Bladebreakers versus the Demolition Boys!"),
          L("spencer", "Seaborg thrives on the cold."),
          L("kai", "So does Dranzer's fire.") ] },
        { id: "5-7", type: "boss", name: "Tyson vs. Tala", lv: 36, waves: [W("biovolt", O("spencer-s")), W("b_tala", "biovolt", "biovolt")], pre: [
          L("voltaire", "With every Bit-Beast in the world, Biovolt will rule. Tala, finish them."),
          L("tala_e", "Wolborg. Blizzalog."),
          L("tyson", "It's freezing... but my friends are right here with me. Dragoon! Phantom Hurricane!") ], post: [
          L("narr", "The ice shatters, and every stolen Bit-Beast returns to its Blader."),
          L("dickenson", "The Bladebreakers are the world champions!"),
          L("tyson", "We did it! Now, where's the food?") ] },
      ] },
    // ======================= V-FORCE =======================
    { id: "c6", season: "V-Force", title: "Mr. X", env: "dojo", map: "dojo", reward: { op: "tyson-v", orundum: 400 },
      nodes: [
        { id: "6-1", type: "story", name: "A New School Year", pre: [
          L("hilary", "Tyson Granger, you're late again! Being world champion doesn't excuse homework."),
          L("tyson", "Hilary, I'm busy. Somebody in a hood has been challenging Bladers all over town."),
          L("kenny", "And winning. He calls himself Mr. X.") ] },
        { id: "6-2", type: "battle", name: "Shadows by the River", lv: 37, waves: [W("guardian", "street", "guardian"), W("guardian", "guardian", "street")], pre: [
          L("max", "These guys never launch a Bit-Beast we can see.") ] },
        { id: "6-3", type: "battle", name: "Spark Hammer", lv: 38, waves: [W("guardian", "b_dunga", "guardian")], pre: [
          L("dunga", "The Sacred Bit-Beasts belong sealed. Hand them over."),
          L("kai", "Dranzer belongs to no one but Dranzer.") ] },
        { id: "6-4", type: "chest", name: "Dragoon V", reward: { lmd: 12000, rec3: 6, chip: 2, orundum: 150 }, pre: [
          L("kenny", "Magnacore! The new core pulls Dragoon back to the centre of the dish. Meet Dragoon V."),
          L("tyson", "Victory Tornado. I like the sound of that.") ] },
        { id: "6-5", type: "side", name: "Invisible Beasts", lv: 40, waves: [W("guardian", "guardian"), W(O("mariam-v"), O("joseph-v"), "guardian")], pre: [
          L("mariam", "Our elders gave us these Beyblades for one purpose: to seal yours."),
          L("ray", "You'll have to beat us first.") ], post: [
          L("mariam", "Your bond with your Bit-Beasts... it's stronger than we were told.") ] },
        { id: "6-6", type: "battle", name: "The Saint Shields", lv: 41, waves: [W(O("joseph-v"), "guardian", O("mariam-v")), W("b_dunga", O("joseph-v"), "guardian")], pre: [
          L("hilary", "Go, go, Bladebreakers! ...Did I say that right?") ] },
        { id: "6-7", type: "boss", name: "Unmasked", lv: 43, waves: [W("guardian", "guardian"), W("b_ozuma", O("mariam-v"), "guardian")], pre: [
          L("mrx", "You beat my comrades. Now you face me."),
          L("tyson", "I lost to you once, Mr. X. Not twice."),
          L("mrx", "Flash Leopard! Sacred Fire!") ], post: [
          L("ozuma", "My name is Ozuma. Remember it. We will meet again, Tyson."),
          L("tyson", "Anytime, anywhere.") ] },
      ] },
    { id: "c7", season: "V-Force", title: "Team Psykick", env: "lab", map: "lab", reward: { op: "kai-v", orundum: 400 },
      nodes: [
        { id: "7-1", type: "story", name: "Psykick Island", pre: [
          L("gideon", "Welcome to my little island, champions. Dr. B has been dying to study your Bit-Beasts."),
          L("kenny", "It's a trap! The whole island is a Bit-Beast capture system!") ] },
        { id: "7-2", type: "battle", name: "Capture System", lv: 44, waves: [W("cyber", "cyber", "street"), W("cyber", "cyber", "cyber")], pre: [
          L("max", "Smash the machines before they lock on!") ] },
        { id: "7-3", type: "battle", name: "Cyber Draciel", lv: 45, waves: [W("cyber", "b_jim", "cyber")], pre: [
          L("jim", "Cyber Draciel is a perfect copy of yours, Max. Only better."),
          L("max", "A copy doesn't have a heart. Let's go, Draciel!") ] },
        { id: "7-4", type: "chest", name: "Dranzer V", reward: { lmd: 14000, rec3: 6, summ: 4, orundum: 150 }, pre: [
          L("kenny", "Dranzer V, finished. Kai, try not to break it this week."),
          L("kai", "No promises.") ] },
        { id: "7-5", type: "side", name: "Cyber Bit-Beasts", lv: 47, waves: [W("cyber", "cyber"), W(O("salima-v"), O("goki-v"), "cyber")], pre: [
          L("salima", "These Cyber Bit-Beasts are taking us over. Please... stop us."),
          L("ray", "Hang on, Salima. We'll get you out of there.") ], post: [
          L("salima", "Thank you. I can think clearly again.") ] },
        { id: "7-6", type: "battle", name: "The Battle Tower", lv: 48, waves: [W(O("goki-v"), "cyber", O("salima-v")), W(O("jim-v"), "cyber", "cyber")], pre: [
          L("gideon", "Every floor of my Battle Tower holds a Cyber Bit-Beast. Do climb up.") ] },
        { id: "7-7", type: "boss", name: "Perfect Delete", lv: 50, waves: [W("cyber", "cyber"), W("b_kane", O("goki-v"), "cyber")], pre: [
          L("kane_e", "Cyber Dragoon is built from your own battle data, Tyson. It knows every move you'll make."),
          L("tyson", "Then I'll make one it's never seen!"),
          L("kane_e", "Perfect Delete!") ], post: [
          L("narr", "The Battle Tower shakes and begins to fall. Cyber Dragoon's chip shatters, and Kane comes back to himself."),
          L("kane", "Tyson... thank you. Psykick won't use anybody again.") ] },
      ] },
    { id: "c8", season: "V-Force", title: "The Ancient Rock", env: "ruins", map: "ruins", reward: { op: "max-v", orundum: 400 },
      nodes: [
        { id: "8-1", type: "story", name: "A Stolen Rock", pre: [
          L("judy", "Max! The ancient rock in my lab held hundreds of sleeping Bit-Beasts. Someone stole it last night."),
          L("doctork", "Someone with a very rich employer. Dr. Zagart thanks you for the gift."),
          L("zeo", "Hi! I'm Zeo. I'm a huge fan, Tyson. Can I travel with you?") ] },
        { id: "8-2", type: "battle", name: "Rock Bit-Beasts", lv: 51, waves: [W("cyber", "street", "cyber"), W("dark", "cyber", "dark")], pre: [
          L("kenny", "Team Zagart's Bladers are using Bit-Beasts from the rock. Wild Fox, Phantom Spider..."),
          L("kai", "Old spirits, angry at being woken.") ] },
        { id: "8-3", type: "battle", name: "Return of the Saint Shields", lv: 52, waves: [W("guardian", O("dunga-v"), "guardian")], pre: [
          L("dunga", "The rock has woken. Now more than ever, the Sacred Bit-Beasts must be sealed."),
          L("ray", "Driger! ...No, Driger, come back!") ] },
        { id: "8-4", type: "chest", name: "Draciel V", reward: { lmd: 16000, rec3: 8, chip: 3, orundum: 150 }, pre: [
          L("max", "Mom and Kenny built Draciel V together. Viper Wall is ready!") ] },
        { id: "8-5", type: "side", name: "Mariam's Choice", lv: 54, waves: [W("guardian", "guardian"), W(O("mariam-v"), O("joseph-v"), "guardian")], pre: [
          L("mariam", "Max... you're kind. That makes this harder."),
          L("max", "Then don't do it, Mariam. Let's just battle, for fun.") ], post: [
          L("mariam", "...For fun. All right. Just this once.") ] },
        { id: "8-6", type: "battle", name: "The Hidden Village", lv: 55, waves: [W(O("dunga-v"), O("mariam-v"), "guardian"), W(O("joseph-v"), "guardian", "guardian")], pre: [
          L("ozuma", "Our village guarded these beasts for a thousand years. Prove they are safe with you."),
          L("tyson", "That's what we've been doing all along.") ] },
        { id: "8-7", type: "boss", name: "Ozuma's Last Stand", lv: 57, waves: [W(O("dunga-v"), O("joseph-v")), W("b_ozuma2", "guardian", "guardian")], pre: [
          L("ozuma_e", "Flash Leopard 2. Our final answer."),
          L("tyson", "Dragoon V2 says hi. Let it rip!"),
          L("ozuma_e", "Cross Fire!") ], post: [
          L("ozuma", "Your Bit-Beasts are safe in your hands. The Saint Shields' mission is over."),
          L("zeo", "...Tyson, I have to go. My father is waiting."),
          L("zagart", "Come, Zeo. Cerberus is ready for you.") ] },
      ] },
    { id: "c9", season: "V-Force", title: "The Tag Team Championship", env: "bba", map: "bba", reward: { op: "tyson-v2", orundum: 500 },
      nodes: [
        { id: "9-1", type: "story", name: "Two on Two", pre: [
          L("dickenson", "This year's World Championship is a tag-team tournament. Choose your partners wisely."),
          L("tyson", "Max and me. Kai and Ray. Easy."),
          L("hilary", "Did anyone else notice Zeo's team is in the bracket?") ] },
        { id: "9-2", type: "battle", name: "Opening Round", lv: 58, waves: [W("trainee", "allstar", "trainee"), W(O("kane-v"), O("jim-v"), "allstar")], pre: [
          L("jazzman", "Welcome to the tag-team World Championship!"),
          L("kane", "No Cyber Bit-Beasts this time. Just us. Let's do it right.") ] },
        { id: "9-3", type: "battle", name: "The Parts Hunters", lv: 59, waves: [W("cyber", "b_king", O("queen-v"))], pre: [
          L("king", "Win a battle, take a part. Those are the Parts Hunters' rules."),
          L("queen", "And we've got our eye on Dragoon's Attack Ring."),
          L("max", "Hands off!") ] },
        { id: "9-4", type: "chest", name: "Dragoon V2", reward: { lmd: 18000, rec4: 3, summ: 5, orundum: 200 }, pre: [
          L("kenny", "I tuned Dragoon V2 for everything Cerberus can do. Probably.") ] },
        { id: "9-5", type: "side", name: "Rematch with the Saint Shields", lv: 61, waves: [W(O("dunga-v"), O("joseph-v")), W(O("ozuma-v2"), O("mariam-v"), "guardian")], pre: [
          L("ozuma", "Not a mission this time, Tyson. Just Bladers.") ], post: [
          L("ozuma", "Good. Now go and win.") ] },
        { id: "9-6", type: "battle", name: "Twin Spire", lv: 62, waves: [W("cyber", O("gordo-v"), "cyber"), W(O("king-v"), O("queen-v"), "cyber")], pre: [
          L("gordo", "Orthrus is Cerberus's brother. Two heads. Twice the ice."),
          L("ray", "Then Driger will melt it twice.") ] },
        { id: "9-7", type: "boss", name: "Zeo and Cerberus", lv: 64, waves: [W(O("gordo-v"), "cyber"), W("b_zeo", "cyber", "cyber")], pre: [
          L("zeo_e", "With the four Sacred Bit-Beasts, Father can make me human. I'm sorry, Tyson."),
          L("tyson", "You're already my friend, Zeo. That's as human as it gets."),
          L("zeo_e", "Cerberus! Chain Storm!") ], post: [
          L("zeo", "...I lost. But I don't feel sad. Is that what it's like, being a Blader?"),
          L("tyson", "That's exactly what it's like. Rematch anytime."),
          L("dickenson", "Tyson Granger, world champion for the second time!") ] },
      ] },
    // ======================= G-REVOLUTION =======================
    { id: "c10", season: "G-Revolution", title: "Jin of the Gale", env: "dojo", map: "dojo", reward: { op: "daichi-v", orundum: 500 },
      nodes: [
        { id: "10-1", type: "story", name: "The Wild Kid", pre: [
          L("narr", "A new World Championship is announced. A wild kid from the mountains wants Tyson's title."),
          L("daichi", "I'm Daichi Sumeragi, and I'm gonna be the greatest Blader ever! Starting with you, champ!"),
          L("tyson", "Get in line, kid.") ] },
        { id: "10-2", type: "battle", name: "Mountain Kid", lv: 65, waves: [W("street", "b_daichi", "street")], pre: [
          L("daichi_e", "Strata Dragoon! Vast Hurricane!"),
          L("kenny", "An Earth dragon? He might actually be good!") ] },
        { id: "10-3", type: "battle", name: "The Team Splits", lv: 66, waves: [W("trainee", "allstar", "tiger"), W("tiger", "allstar", "trainee")], pre: [
          L("ray", "The White Tigers asked me to lead them this year. I said yes."),
          L("max", "And my mom's team asked me. I'm sorry, Tyson."),
          L("kai", "...I'll be battling with Tala's team."),
          L("tyson", "So I'll beat all of you. Fine by me.") ] },
        { id: "10-4", type: "chest", name: "BBA Revolution", reward: { lmd: 20000, rec4: 4, chip: 3, orundum: 200 }, pre: [
          L("daichi", "So it's you and me, champ? BBA Revolution! I'm the captain."),
          L("tyson", "You are not the captain.") ] },
        { id: "10-5", type: "side", name: "The Masked Blader", lv: 68, waves: [W("trainee", "trainee"), W(O("hiro-g"), "trainee", "trainee")], pre: [
          L("jin", "Tyson. You've gotten lazy at the top."),
          L("tyson", "Who are you? Take off that mask!") ], post: [
          L("jin", "Better. But not good enough. Not yet.") ] },
        { id: "10-6", type: "battle", name: "Qualifiers", lv: 69, waves: [W("trainee", "street", "allstar"), W("tiger", "allstar", "trainee", "street")], pre: [
          L("jazzman", "The World Championship qualifiers start now!") ] },
        { id: "10-7", type: "boss", name: "Two Metal Drigers", lv: 71, waves: [W("trainee", "trainee"), W("b_hiro", "trainee", "trainee")], pre: [
          L("jin", "Metal Driger. Both of them. Wave Buster Attack!"),
          L("tyson", "Two at once? Then Dragoon and I go twice as hard!") ], post: [
          L("hiro", "It's me, Tyson. Your brother."),
          L("tyson", "Hiro?! Where have you been all these years?"),
          L("hiro", "Training. From now on, I'm your coach.") ] },
      ] },
    { id: "c11", season: "G-Revolution", title: "The World Championships", env: "street", map: "street", reward: { op: "tyson-gt", orundum: 500 },
      nodes: [
        { id: "11-1", type: "story", name: "Round Robin", pre: [
          L("dickenson", "The finals are a round robin: America, Italy, Spain, Egypt and Australia."),
          L("daichi", "Five countries? Do they have food in all of them?"),
          L("tyson", "Finally, someone who gets it.") ] },
        { id: "11-2", type: "battle", name: "F-Dynasty", lv: 72, waves: [W("allstar", O("raul-g"), "allstar"), W("b_julia", O("raul-g"), "street")], pre: [
          L("julia", "The F-Dynasty grew up in the circus. Ready for a show?"),
          L("raul", "Julia, can we just battle normally for once?"),
          L("julia", "Gemini Attack!") ] },
        { id: "11-3", type: "battle", name: "Barthez Battalion", lv: 73, waves: [W(O("mathilda-g"), O("claude-g"), O("aaron-g")), W("b_miguel", O("mathilda-g"), O("claude-g"))], pre: [
          L("barthez", "My Battalion wins by any means necessary."),
          L("mathilda", "Miguel... is this really right?"),
          L("miguel", "...Fire Execution.") ] },
        { id: "11-4", type: "chest", name: "Dragoon GT", reward: { lmd: 22000, rec4: 5, summ: 6, orundum: 200 }, pre: [
          L("kenny", "Engine Gear Turbo! Dragoon GT can release a burst of spin mid-battle."),
          L("tyson", "Galaxy Turbo Twister. Oh yeah.") ] },
        { id: "11-5", type: "side", name: "Old Friends", lv: 75, waves: [W(O("mariah-s"), O("lee-g")), W("b_ray", O("kevin-s"), O("gary-s"))], pre: [
          L("ray_e", "I won't hold back, Tyson. White Tiger X is here to win."),
          L("tyson", "I'd be insulted if you did.") ], post: [
          L("ray", "Gatling Claw Maximum wasn't enough. You've really grown.") ] },
        { id: "11-6", type: "battle", name: "Mother and Son", lv: 76, waves: [W(O("michael-g"), "allstar", "allstar"), W(O("max-g"), O("rick-g"), "allstar")], pre: [
          L("rick", "Your little team's done. PPB All Starz all the way."),
          L("max_e", "Sorry, Tyson. Gravity Control!") ] },
        { id: "11-7", type: "boss", name: "Wilderness Stadium", lv: 78, waves: [W(O("tala-g"), O("bryan-g")), W("b_kaigt", "biovolt", O("spencer-s"))], pre: [
          L("tala_g", "The Blitzkrieg Boys have changed, Tyson. We battle for ourselves now."),
          L("kai_gt", "This is the match I've waited for. Dranzer GT! Blazing Gigs Turbo!"),
          L("tyson", "Then let's give it everything. Dragoon GT!") ], post: [
          L("kai", "...You win, Tyson. This time."),
          L("jazzman", "Tyson Granger is the world champion again!") ] },
      ] },
    { id: "c12", season: "G-Revolution", title: "BEGA", env: "bega", map: "bega", reward: { op: "tyson-ms", orundum: 600 },
      nodes: [
        { id: "12-1", type: "story", name: "The Takeover", pre: [
          L("boris", "BEGA has bought the BBA. From today, only BEGA Bladers may battle in official tournaments."),
          L("dickenson", "Boris... I'm afraid he has us, Tyson."),
          L("tyson", "Not if we win them back.") ] },
        { id: "12-2", type: "battle", name: "BEGA Bladers", lv: 79, waves: [W("bega", "bega", "street"), W("bega", "bega", "bega")], pre: [
          L("hilary", "They've closed every stadium in town!") ] },
        { id: "12-3", type: "battle", name: "Radiant Thunder", lv: 80, waves: [W("bega", O("garland-g"), "bega")], pre: [
          L("garland", "Your friend Tala challenged me. He is in hospital now."),
          L("kai", "...You'll pay for that.") ] },
        { id: "12-4", type: "chest", name: "Hard Metal System", reward: { lmd: 26000, rec4: 6, chip: 4, orundum: 250 }, pre: [
          L("kenny", "Emily, Miguel and I built them together: Hard Metal System Beyblades. Metal Attack Rings that spin either way!"),
          L("tyson", "Dragoon MS. Metal Storm. Let's take our sport back.") ] },
        { id: "12-5", type: "side", name: "Everyone Together", lv: 82, waves: [W("bega", "bega"), W(O("julia-g"), O("miguel-g"), O("lee-g"), O("michael-g"))], pre: [
          L("narr", "Bladers from every team come to train with the G Revolutions."),
          L("lee", "We fight BEGA together. Show us what you've got.") ], post: [
          L("tyson", "Thanks, everyone. We'll win this for all of us.") ] },
        { id: "12-6", type: "battle", name: "Ming-Ming and Mystel", lv: 83, waves: [W("bega", "b_mingming", "bega"), W("b_mystel", "bega", "bega")], pre: [
          L("jazzman", "It's the Justice 5 tournament! BEGA versus the G Revolutions!"),
          L("mingming", "Venus Temptation! Aren't I adorable?"),
          L("mystel", "Ocean Javelin.") ] },
        { id: "12-7", type: "boss", name: "Demolition Ax", lv: 85, waves: [W("bega", "b_mingming"), W("b_crusher", "bega", "bega")], pre: [
          L("crusher", "I fight for my sister, Monica. I can't lose."),
          L("ray", "Neither can I. Thunder Slash!") ], post: [
          L("crusher", "You fight with heart. Monica would like you."),
          L("boris", "Enough. Brooklyn and Garland will end this.") ] },
      ] },
    { id: "c13", season: "G-Revolution", title: "King of Darkness", env: "bega", map: "bega", reward: { op: "kai-ms", orundum: 800 },
      nodes: [
        { id: "13-1", type: "story", name: "The Prodigy", pre: [
          L("hiro", "Brooklyn never trained a day in his life, and he's never lost. I coached him, Tyson. I'm sorry."),
          L("tyson", "Then I'll be the first.") ] },
        { id: "13-2", type: "battle", name: "BEGA Tower", lv: 86, waves: [W("bega", "bega", "bega"), W("bega", O("mystel-g"), "bega", "bega")], pre: [
          L("kenny", "BEGA's best are guarding every floor.") ] },
        { id: "13-3", type: "battle", name: "Kai vs. Brooklyn", lv: 87, waves: [W("bega", O("brooklyn-g"), "bega")], pre: [
          L("brooklyn", "Why do you try so hard? Battling is so easy."),
          L("kai", "Because I have something to fight for. Dranzer MS! Spiral Fireball!") ] },
        { id: "13-4", type: "chest", name: "Everyone's Bit-Beasts", reward: { lmd: 30000, rec4: 8, summ: 8, orundum: 300 }, pre: [
          L("max", "Every Blader in the world is cheering for you, Tyson.") ] },
        { id: "13-5", type: "side", name: "Garland", lv: 89, waves: [W("bega", O("mingming-g")), W("b_garland", "bega", O("crusher-g"))], pre: [
          L("garland", "Apollon has never lost to a Blader who relies on luck."),
          L("tyson", "Good thing I rely on my friends.") ], post: [
          L("garland", "...A worthy champion. Go. Brooklyn is waiting.") ] },
        { id: "13-6", type: "battle", name: "Justice 5", lv: 90, waves: [W(O("mingming-g"), O("crusher-g"), "bega"), W(O("mystel-g"), O("garland-g"), "bega")], pre: [
          L("jazzman", "Two wins each! It all comes down to the final match!") ] },
        { id: "13-7", type: "boss", name: "King of Darkness", lv: 92, waves: [W(O("garland-g"), O("mystel-g")), W("b_brooklyn", "bega", "bega")], pre: [
          L("brooklyn", "Zeus. King of Darkness. Let's make everything go quiet."),
          L("tyson", "Dragoon, I can feel them all: Dranzer, Driger, Draciel, Strata Dragoon... everybody. Evolution Storm!") ], post: [
          L("narr", "The darkness breaks. Dragoon MS shines with every Bit-Beast in the stadium."),
          L("brooklyn", "So this is what it feels like... to lose. It's... warm."),
          L("dickenson", "BEGA is finished, and the BBA is back. Tyson, three World Championships in a row!"),
          L("kai", "Don't get comfortable, Tyson. I want a rematch."),
          L("tyson", "Bladers ready? 3, 2, 1... let it rip!"),
          L("narr", "The end. Thank you for playing.") ] },
      ] },
  ],
}];
// Flatten for lookups. Stage codes: main stages 1-1…1-6, side stages S1-1.
const NODES = {};
for (const ep of STORY) ep.chapters.forEach((ch, ci) => {
  let mc = 0, sc = 0;
  ch.no = String(ci + 1).padStart(2, "0");
  ch.nodes.forEach((nd, i) => { nd.legacy = nd.id; nd.id = nd.type === "side" ? `S${ci + 1}-${++sc}` : `${ci + 1}-${++mc}`; nd.ch = ch; nd.ep = ep; nd.idx = i; NODES[nd.id] = nd; });
});
const nodeCost = nd => nd.type === "story" || nd.type === "chest" ? 0 : 6 + Math.floor(nd.lv / 10) * 2;
// 3-star time goal: about 25 seconds per rival Beyblade, more for a boss
const nodeTimeGoal = nd => 25 * Math.min(TEAM_SIZE, nd.waves ? nd.waves.flat().length : 1) + (nd.type === "boss" ? 30 : 15);

// =====================================================================
//  STREET BATTLES · BBA TOWER · RANKED BATTLES · DAILY TRAINING · HOBBY SHOP
// =====================================================================
const HUNTS = [
  { id: "river", code: "RB", n: "Riverbank Battles", sub: "Bey City's street Bladers meet under the bridge", env: "river", parts: ["flat", "grip", "semiflat", "rsg", "lsg", "tenbal", "sixatk"],
    waves: lv => [W("street", "shark", "street"), W("b_carlos", "shark", "shark")] },
  { id: "shop", code: "HS", n: "Hobby Shop Cup", sub: "The weekly tournament in the stadium out back", env: "street", parts: ["wing", "spike", "upper", "smash", "absorb", "egr", "egl", "instant"],
    waves: lv => [W("trainee", "bully", "allstar"), W("b_michael", "allstar", "trainee")] },
  { id: "abbey", code: "BA", n: "Balkov Abbey", sub: "Biovolt's training halls under Moscow", env: "russia", parts: ["defring", "survivor", "widedef", "eightheavy", "tenwide", "magne", "neor", "neol", "ball", "sharp", "bearing"],
    waves: lv => [W("biovolt", "dark", "biovolt"), W("b_bryan", "biovolt", "dark")] },
];
const HUNT_LV = [10, 22, 34, 46, 58, 70];
const HUNT_COST = [8, 10, 12, 14, 16, 18];
const HUNT_RAR = [[.5, .4, .1, 0, 0], [.2, .45, .3, .05, 0], [0, .35, .45, .17, .03], [0, .15, .45, .32, .08], [0, 0, .35, .45, .2], [0, 0, .15, .5, .35]];

// BBA Tower: a 30-floor ladder; every fifth floor is a champion, even floors from 8 on are other Bladers' teams
const TOWER_FLOORS = 30;
function towerFloor(f) {
  const lv = 4 + f * 3, rng = seeded(hash("tower" + f));
  const mobs = ["street", "shark", "bully", "trainee", "tiger", "allstar", "knight", "dark", "biovolt", "guardian", "cyber", "bega"];
  const bosses = ["b_kai", "b_lee", "b_michael", "b_robert", "b_tala", "b_ozuma2", "b_zeo", "b_hiro", "b_kaigt", "b_brooklyn"];
  const pickE = () => mobs[Math.floor(rng() * mobs.length)];
  let waves;
  if (f % 5 === 0) waves = [W(pickE(), pickE(), pickE()), W(bosses[(f / 5 - 1) % bosses.length], pickE(), pickE())];
  else if (f >= 8 && f % 2 === 0) {
    const pool = OP_KEYS.filter(k => OPS[k].rar >= 4);
    waves = [[0, 1, 2].map(() => ({ op: pool[Math.floor(rng() * pool.length)] }))];
  } else waves = [W(pickE(), pickE(), pickE()), ...(f > 3 ? [W(pickE(), pickE(), pickE(), pickE())] : [])];
  const reward = f % 5 === 0 ? { orundum: 200, permit: 1, chip: 2 } : { orundum: 50, lmd: 1500 + f * 300, ["rec" + Math.min(4, 1 + Math.floor(f / 8))]: 3 };
  return { id: "T" + f, f, lv, waves, reward, env: ["bba", "street", "china", "usa", "europe", "russia"][Math.floor((f - 1) / 5)] };
}

const ARENA_N1 = ["Bey City", "Hong Kong", "Las Vegas", "Moscow", "Glasgow", "Madrid", "Cairo", "Sydney", "Rome", "New York", "Bai Hu", "Dish Central"];
const ARENA_N2 = ["Bladers", "Spinners", "Storm", "Sharks", "Tigers", "Stars", "Knights", "Wolves", "Shields", "Dynasty", "Revolution", "Smashers"];
// challengers' titles, by how high they rank
const ARENA_CLS = [[60, ["World Class Blader", "BBA Champion", "Grand Prix Winner"]], [300, ["Pro Blader", "Regional Champion", "Tournament Blader", "Blading Club Captain"]],
  [1e9, ["Street Blader", "Junior Blader", "Hobby Shop Regular", "BBA Trainee", "Riverbank Blader"]]];
const arenaCls = rank => pick(ARENA_CLS.find(([r]) => rank <= r)[1]);
const ARENA_MS = 10 * 60000, PAYOUT_MS = 6 * 3600000;

const DAILIES = [
  { id: "clear", n: "Win 3 battles", goal: 3, reward: { orundum: 60, lmd: 2000, credit: 80 } },
  { id: "sanity", n: "Spend 60 Energy", goal: 60, reward: { orundum: 60, credit: 40 } },
  { id: "hh", n: "Open a Random Booster", goal: 1, reward: { orundum: 80 } },
  { id: "upgrade", n: "Level up Beyblades 3 times", goal: 3, reward: { rec2: 3 } },
  { id: "arena", n: "Win a Ranked Battle", goal: 1, reward: { tokens: 30, orundum: 40 } },
  { id: "rune", n: "Tune up a Customize Part", goal: 1, reward: { lmd: 3000, credit: 40 } },
];
const DAILY_ALL = { permit: 1 };
// BBA Records (achievements) live in a9c_meta.js (ACH): tiered, with rewards sent to the Mailbox.
const SHOP = {
  credit: [
    { id: "r_lmd", n: "Yen ×12,000", cost: 200, give: { lmd: 12000 } },
    { id: "r_rec", n: "Dizzi's Master Data ×3", cost: 240, give: { rec4: 3 } },
    { id: "r_summ", n: "Training Scroll ×3", cost: 160, give: { summ: 3 } },
    { id: "r_chip", n: "Upgrade Kit", cost: 300, give: { chip: 1 } },
  ],
  cert: [
    { id: "c_permit", n: "Booster Ticket", cost: 25, give: { permit: 1 } },
    { id: "c_summ", n: "Training Scroll ×3", cost: 8, give: { summ: 3 } },
    { id: "c_chip", n: "Upgrade Kit ×2", cost: 12, give: { chip: 2 } },
    { id: "c_part", n: "Metal grade part", d: "A random Attack Ring, Weight Disk, Spin Gear or Blade Base", cost: 20, give: { part4: 1 } },
  ],
  tokens: [
    { id: "t_permit", n: "Booster Ticket", cost: 240, give: { permit: 1 } },
    { id: "t_chip", n: "Upgrade Kit ×3", cost: 90, give: { chip: 3 } },
    { id: "t_summ", n: "Training Scroll ×4", cost: 60, give: { summ: 4 } },
    { id: "t_part", n: "Championship part", d: "A random Attack Ring, Weight Disk, Spin Gear or Blade Base", cost: 220, give: { part5: 1 } },
  ],
  prime: [
    { id: "p_san", n: "Restore Energy", d: "Refill Energy to max", cost: 1, give: { sanityMax: 1 } },
    { id: "p_oru", n: "Trade for BeyPoints", d: "1 Sports Drink → 180 BeyPoints", cost: 1, give: { orundum: 180 } },
  ],
};
// the starting Beyblades: Tyson, Max, Ray and Kenny from Season 1 (Kai joins after the regionals); teams take three
const STARTERS = ["tyson-s", "max-s", "ray-s", "kenny-s"];
// any 5★ Beyblade can headline the Booster of the Day
// Black Dranzer never comes out of a Booster: it arrives as a Mystery Gift after the World Championship (a9c_meta.js)
const MYSTERY_OP = "kai-bd";
const boosterPool = rar => OP_KEYS.filter(k => OPS[k].rar === rar && k !== MYSTERY_OP);
const BANNER_TOP = boosterPool(5);
