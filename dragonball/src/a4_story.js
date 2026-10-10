// =====================================================================
//  STORY — from Raditz's arrival to Super Saiyan Goku on a dying Namek: the Saiyan Saga and the Frieza Saga, with
//  the filler arcs in between (Snake Way and HFIL, Gohan's survival, Kami's Lookout, Planet Arlia).
//  Lines are written for the game; names follow the English dub.
//  Node types: story · battle · side · chest (a capsule) · boss · event (a minigame)
// =====================================================================
// story bosses: tougher versions of playable fighters [unit, HP multiplier, ATK multiplier, next form]
bossOf("b_raditz", "raditz-s", 2.6, 1.0); bossOf("b_piccolo", "piccolo-s", 2.2, .9); bossOf("b_nappa", "nappa-s", 2.8, 1.02);
bossOf("b_ape", "vegeta-o", 2.4, 1.05); bossOf("b_vegeta", "vegeta-s", 2.3, 1.04, "b_ape"); bossOf("b_vegeta2", "vegeta-s", 1.6, .96);
bossOf("b_cui", "cui-s", 2.4, 1.0); bossOf("b_dodoria", "dodoria-s", 2.6, 1.0); bossOf("b_zarbonm", "zarbon-m", 2.0, 1.02); bossOf("b_zarbon", "zarbon-s", 1.8, 1.0, "b_zarbonm");
bossOf("b_zarbon2", "zarbon-m", 2.6, 1.05); bossOf("b_guldo", "guldo-s", 2.4, 1.0); bossOf("b_recoome", "recoome-s", 2.8, 1.04); bossOf("b_burter", "burter-s", 2.2, 1.0);
bossOf("b_jeice", "jeice-s", 2.2, 1.0); bossOf("b_ginyu", "ginyu-s", 2.8, 1.06); bossOf("b_frieza1", "frieza-1", 2.6, 1.04); bossOf("b_frieza3", "frieza-3", 2.2, 1.06);
bossOf("b_frieza2", "frieza-2", 2.2, 1.04, "b_frieza3"); bossOf("b_frieza4", "frieza-4", 3.0, 1.1); bossOf("b_frieza5", "frieza-5", 2.4, 1.12); bossOf("b_frieza4b", "frieza-4", 2.0, 1.08, "b_frieza5");
bossOf("b_appule", "appule-s", 2.0, 1.0);
// bosses that aren't collectable fighters
ENEMY.b_goz = { ...ENEMY.ogre, n: "Goz", boss: 1, m: { hp: 2.2, atk: .78, def: .9, spd: 100 }, techs: [...ENEMY.ogre.techs, ET("Ogre Slam", "melee", 25, 2.6, { hits: 1, heavy: 1 })] };
ENEMY.b_mez = { ...ENEMY.ogre2, n: "Mez", boss: 1, m: { hp: 2.0, atk: .86, def: .8, spd: 106 }, techs: [...ENEMY.ogre2.techs, ET("Ogre Barrage", "ki", 25, 2.2, { hits: 4 })] };
ENEMY.b_pastsaiyan = { ...ENEMY.pastsaiyan, n: "Saiyan Elite of the Past", boss: 1, m: { hp: 2.4, atk: .95, def: .8, spd: 112 }, fig: { ...ENEMY.pastsaiyan.fig, hs: "bardock", armor: "#5a5a6a", pad: "#c8a050" } };
ENEMY.b_dino = { ...ENEMY.dino, n: "King Tyrannosaurus", boss: 1, m: { hp: 2.4, atk: .8, def: .9, spd: 96 }, fig: { ...ENEMY.dino.fig, skin: "#4a7a2a", h: 2.0 } };
for (const k of ["b_goz", "b_mez", "b_pastsaiyan", "b_dino"]) { ENEMY[k].key = k; ENEMY[k].enemy = true; ENEMY[k].passives = []; }

// people who don't fight here (drawn from a figure, shown on the left unless `right`)
const NPC = x => F(x);
const SPK = {
  narr: { n: "" },
  goku: { n: "Goku", op: "goku-s" }, gokun: { n: "Goku", op: "goku-n" }, ssj: { n: "Goku", op: "goku-ssj" }, gohan: { n: "Gohan", op: "gohan-s" }, gohann: { n: "Gohan", op: "gohan-n" },
  krillin: { n: "Krillin", op: "krillin-s" }, krillinn: { n: "Krillin", op: "krillin-n" }, piccolo: { n: "Piccolo", op: "piccolo-s" }, piccolon: { n: "Piccolo", op: "piccolo-n" },
  tien: { n: "Tien", op: "tien-s" }, yamcha: { n: "Yamcha", op: "yamcha-s" }, chiaotzu: { n: "Chiaotzu", op: "chiaotzu-s" }, yajirobe: { n: "Yajirobe", op: "yajirobe-s" },
  vegetaa: { n: "Vegeta", op: "vegeta-n" }, nail: { n: "Nail", op: "nail-s" }, dende: { n: "Dende", op: "dende-s" },
  raditz: { n: "Raditz", en: "b_raditz" }, nappa: { n: "Nappa", en: "b_nappa" }, vegeta: { n: "Vegeta", en: "b_vegeta" }, cui: { n: "Cui", en: "b_cui" }, dodoria: { n: "Dodoria", en: "b_dodoria" },
  zarbon: { n: "Zarbon", en: "b_zarbon" }, guldo: { n: "Guldo", en: "b_guldo" }, recoome: { n: "Recoome", en: "b_recoome" }, burter: { n: "Burter", en: "b_burter" }, jeice: { n: "Jeice", en: "b_jeice" },
  ginyu: { n: "Captain Ginyu", en: "b_ginyu" }, frieza: { n: "Frieza", en: "b_frieza1" }, frieza4: { n: "Frieza", en: "b_frieza4" }, frieza5: { n: "Frieza", en: "b_frieza5" },
  goz: { n: "Goz", en: "b_goz" }, mez: { n: "Mez", en: "b_mez" }, moai: { n: "King Moai", en: "moai" }, appule: { n: "Appule", en: "b_appule" },
  bulma: { n: "Bulma", fig: NPC({ hair: "#3ab8c8", hs: "bob", top: "#f2a0c8", under: "#f2a0c8", sleeves: "short", pants: "#2a4a8a", belt: "#2a2a30", boots: "#f2f2f6", slim: 1, h: .95, eyec: "#2a6ad8" }) },
  roshi: { n: "Master Roshi", fig: NPC({ hs: "bald", beard: "#f2f2f6", glasses: "#1a1a20", top: "#f2a0c8", under: "#f2a0c8", sleeves: "short", pants: "#f2e6c8", belt: "#2a2a30", boots: "#8a5a2a", h: .86, kid: .2 }) },
  kingkai: { n: "King Kai", fig: NPC({ skin: "#3a6ad8", antennae: 1, hs: "none", glasses: "#141418", top: "#141418", under: "#141418", sleeves: "long", pants: "#141418", belt: "#f2c14e", boots: "#2a2a30", bulk: 1.4, h: .9, kanji: "界" }) },
  kami: { n: "Kami", fig: NPC({ skin: "#5ab84a", antennae: 1, ears: "point", hs: "none", beard: null, top: "#f2f2f6", under: "#f2f2f6", sleeves: "long", pants: "#f2f2f6", belt: "#2a6ad8", boots: "#8a4a2a", h: 1.05, kanji: "神" }) },
  popo: { n: "Mr. Popo", fig: NPC({ skin: "#141418", hs: "none", turban: "#f2f2f6", turban2: "#d8302a", top: "#d8302a", under: "#d8302a", sleeves: "none", pants: "#f2f2f6", belt: "#f2c14e", boots: "#d8302a", bulk: 1.2, h: .82, eyec: "#141418" }) },
  yemma: { n: "King Yemma", right: 1, fig: NPC({ skin: "#d8402a", hs: "short", hair: "#141418", beard: "#141418", horns: "ogre", top: "#5a3ea8", under: "#5a3ea8", sleeves: "long", pants: "#5a3ea8", belt: "#f2c14e", boots: "#2a2a30", bulk: 1.9, h: 1.5 }) },
  snake: { n: "Princess Snake", right: 1, fig: NPC({ hair: "#2a8a5a", hs: "long", top: "#f2a0c8", under: "#f2a0c8", sleeves: "long", pants: "#f2a0c8", belt: "#f2c14e", boots: "#f2a0c8", slim: 1, eyec: "#2aa88a" }) },
  guru: { n: "Grand Elder Guru", fig: NPC({ skin: "#5ab84a", antennae: 1, ears: "point", hs: "none", top: "#f2f2f6", under: "#f2f2f6", sleeves: "long", pants: "#f2f2f6", belt: "#2a6ad8", boots: "#8a4a2a", bulk: 2.4, h: 1.25 }) },
  farmer: { n: "Farmer", fig: NPC({ hair: "#5a3a2a", hs: "short", top: "#3a6a2a", under: "#f2e6c8", sleeves: "long", pants: "#5a4a2a", belt: "#2a2a30", boots: "#3a2a1a", bulk: 1.1 }) },
};
const L = (s, t) => ({ s, t });
const W = (...list) => list.map(x => typeof x === "string" ? { e: x } : x);
const O = key => ({ op: key });

const STORY = [{
  id: "ep1", title: "Legend of the Z Fighters", sub: "Story",
  blurb: "From Raditz's arrival to a dying Namek: the Saiyan Saga and the Frieza Saga, and everything in between.",
  chapters: [
    // ======================= SAIYAN SAGA =======================
    { id: "c1", season: "Saiyan Saga", title: "A Saiyan Arrives", env: "wasteland", lead: "goku-s", reward: { op: "piccolo-s", orundum: 300 },
      nodes: [
        { id: "1-1", type: "story", name: "Kame House Reunion", env: "kamehouse", pre: [
          L("narr", "Five years after the World Martial Arts Tournament. A pod streaks out of the sky and craters a farmer's field."),
          L("farmer", "Stay back, you! I've got a shotgun!"),
          L("raditz", "A power level of five. Pathetic. Where is Kakarot?"),
          L("narr", "Far away on a tiny island, Goku brings his son to meet old friends."),
          L("goku", "Hey, everybody! This is my son, Gohan. Say hi, Gohan!"),
          L("roshi", "Goku has a son?! Well, at least he didn't name him after me."),
          L("bulma", "He's adorable! Gohan, after your great-grandpa... wait, what's that tail?") ] },
        { id: "1-2", type: "battle", name: "Dinosaur Country", lv: 1, waves: [W("dino", "dino")], pre: [
          L("goku", "Raditz took Gohan! Piccolo, he said we have one day to find him."),
          L("piccolo", "Don't get the wrong idea, Goku. I'm only helping you so I can kill you myself later."),
          L("narr", "Planning: pick up to three commands each turn, then tap GO. Rush needs you close; Ki Blast works from anywhere."),
          L("narr", "While your commands play out, hold POWER as an attack winds up to hit up to 30% harder. Watch your ki: it runs out fast.") ], post: [
          L("goku", "Sorry, big guy! We're in a hurry.") ] },
        { id: "1-3", type: "chest", name: "Capsule Corp Supplies", reward: { lmd: 2000, rec1: 6, orundum: 100, prime: 1 }, pre: [
          L("bulma", "Take this capsule. Food, water, and a couple of things my dad made. And bring Gohan back!") ] },
        { id: "1-4", type: "battle", name: "Raditz's Scouter", lv: 3, waves: [W("dino"), W(O("raditz-s"))], pre: [
          L("raditz", "My scouter picked you up a mile away, Kakarot. A power level of 416. And you, the green one: 408."),
          L("piccolo", "Then read this! Raaagh!"),
          L("narr", "When an enemy attack is coming, a ring closes around your fighter. Tap GUARD as it closes: a perfect guard (gold) stops all the damage.") ], post: [
          L("raditz", "You've hidden your power. Clever. But it won't save you.") ] },
        { id: "1-5", type: "side", name: "Tyrannosaurus Valley", lv: 4, waves: [W("dino", "dino"), W("b_dino", "dino")], pre: [
          L("goku", "Whoa, look at the size of that one! Gohan would love this place.") ], post: [
          L("goku", "Hehe. Dinner's sorted, anyway.") ] },
        { id: "1-6", type: "boss", name: "Goku & Piccolo vs. Raditz", lv: 6, waves: [W("dino"), W("b_raditz")], pre: [
          L("raditz", "Join me, Kakarot. You're a Saiyan, sent to Earth to wipe it clean. Our planet is gone: there are only four of us left."),
          L("goku", "My name is Goku. And you're not taking my son."),
          L("piccolo", "Hold him off for me. My Special Beam Cannon needs time to charge."),
          L("narr", "Big techniques have long wind-ups. If two beams fire at once, they clash in a beam struggle: mash POWER to push.") ], post: [
          L("narr", "Goku locks Raditz in a full nelson, and Piccolo's Special Beam Cannon pierces them both."),
          L("raditz", "Fool... In a year, two Saiyans far stronger than me will come. Vegeta and Nappa heard every word."),
          L("goku", "Piccolo... take care of Gohan. He's got... a real power in him..."),
          L("piccolo", "Don't worry. I'll make him a weapon. A year from now, he fights the Saiyans with us.") ] },
      ] },
    { id: "c2", season: "Saiyan Saga", title: "Snake Way", env: "snakeway", lead: "goku-s", reward: { op: "goku-k", orundum: 300 },
      nodes: [
        { id: "2-1", type: "story", name: "King Yemma's Check-In", pre: [
          L("narr", "The Other World. Kami has brought Goku to King Yemma's check-in station."),
          L("yemma", "You want to train with King Kai? At the end of Snake Way? It's a million kilometers long. Nobody's made it in centuries."),
          L("goku", "A million? Then I'd better start running!") ] },
        { id: "2-2", type: "event", name: "Run Snake Way", game: "snakeway", pre: [
          L("narr", "Snake Way: run, and jump the gaps. Fall off and you land in HFIL.") ] },
        { id: "2-3", type: "story", name: "Princess Snake's Palace", pre: [
          L("snake", "You look famished, traveler. Stay a while at my palace. Have a bath. Stay forever."),
          L("goku", "That's real nice of you, but I've got a whole lot of road left. Thanks for the food!") ] },
        { id: "2-4", type: "battle", name: "Fall into HFIL", lv: 8, env: "hfil", waves: [W("ogre", "ogre2"), W("ogre2", "ogre", "ogre2")], pre: [
          L("goku", "Whoa, whoa, whoa! I slipped off Snake Way! Where is this place?"),
          L("goz", "New arrival! Let's see if he can keep up with the Ogre fruit-picking games!") ] },
        { id: "2-5", type: "chest", name: "HFIL Fruit Grove", reward: { lmd: 3000, rec1: 8, summ: 2, orundum: 100 }, pre: [
          L("goku", "This fruit's actually pretty good. Okay, back up to Snake Way!") ] },
        { id: "2-6", type: "event", name: "Catch Bubbles", game: "bubbles", pre: [
          L("kingkai", "So you made it. Tell me a joke... No? Fine. First lesson: catch my monkey, Bubbles. In ten times Earth's gravity."),
          L("goku", "Ten times?! My legs feel like lead...") ] },
        { id: "2-7", type: "side", name: "Ogre Rematch", lv: 11, env: "hfil", waves: [W("ogre", "ogre"), W("ogre2", "ogre", "ogre2")], pre: [
          L("goz", "Back again? You're the only one who ever comes BACK to HFIL.") ] },
        { id: "2-8", type: "boss", name: "Goz and Mez", lv: 12, env: "hfil", waves: [W("b_goz", "b_mez")], pre: [
          L("mez", "Brother, this one ran the whole Snake Way. Let's test him properly."),
          L("goku", "Okay! But just one round. King Kai's waiting!") ], post: [
          L("kingkai", "You caught Bubbles, you hit Gregory, and you even made me laugh. Fine! I'll teach you the Kaioken."),
          L("kingkai", "It multiplies your power... and your pain. Double is safe. Triple might kill you. Don't try four."),
          L("goku", "Kaioken! This is amazing!") ] },
      ] },
    { id: "c3", season: "Saiyan Saga", title: "Gohan's Survival", env: "forest", lead: "gohan-s", reward: { op: "chiaotzu-s", orundum: 300 },
      nodes: [
        { id: "3-1", type: "story", name: "Six Months Alone", pre: [
          L("piccolo", "You will survive here on your own for six months. Then I'll train you."),
          L("gohan", "Alone? But... but I'm only four! I want my mom!"),
          L("piccolo", "Cry all you want. The Saiyans won't care.") ] },
        { id: "3-2", type: "battle", name: "Tyrannosaurus!", lv: 13, waves: [W("dino"), W("dino", "dino")], pre: [
          L("gohan", "It's chasing me! I have to be brave, like Dad... Masenko!") ] },
        { id: "3-3", type: "story", name: "The Full Moon", pre: [
          L("narr", "Under the full moon, Gohan's tail awakens something. A Great Ape tears through the valley."),
          L("piccolo", "So this is the power of a Saiyan. Then the moon has to go."),
          L("narr", "Piccolo blasts the moon out of the sky, and cuts off the boy's tail.") ] },
        { id: "3-4", type: "battle", name: "Piccolo's Training", lv: 14, waves: [W(O("piccolo-s"))], pre: [
          L("piccolo", "Six months are up. Now come at me like you mean to kill me."),
          L("gohan", "Yes, Mr. Piccolo!") ], post: [
          L("piccolo", "Hmph. Not bad, kid. Again.") ] },
        { id: "3-5", type: "chest", name: "Gohan's Fruit Stash", reward: { lmd: 3000, rec2: 4, summ: 2, orundum: 100 }, pre: [
          L("gohan", "I hid these for Mr. Piccolo. He says he only drinks water. That's so sad.") ] },
        { id: "3-6", type: "side", name: "The Valley's King", lv: 16, waves: [W("dino", "dino"), W("b_dino")], pre: [
          L("gohan", "The biggest dinosaur in the valley is back. This time I'm not running.") ] },
        { id: "3-7", type: "boss", name: "Sparring with Piccolo", lv: 18, waves: [W("b_piccolo")], pre: [
          L("piccolo", "One last lesson before the Saiyans come. Don't hold back. I won't.") ], post: [
          L("piccolo", "You'll do. Now rest. They'll be here soon."),
          L("gohan", "Mr. Piccolo... thank you.") ] },
      ] },
    { id: "c4", season: "Saiyan Saga", title: "Kami's Lookout", env: "lookout", lead: "krillin-s", reward: { op: "tien-s", orundum: 300 },
      nodes: [
        { id: "4-1", type: "story", name: "Kami's Invitation", pre: [
          L("kami", "Krillin, Yamcha, Tien, Chiaotzu. The Saiyans will reach Earth within the year. Mr. Popo will train you."),
          L("popo", "First, you will sweep the Lookout. All of it."),
          L("krillin", "Sweep?! This place is the size of a city!") ] },
        { id: "4-2", type: "battle", name: "Mr. Popo's Lesson", lv: 18, waves: [W("pastsaiyan")], pre: [
          L("popo", "Mr. Popo will show you the past. Saiyans who lived long ago. Fight them, or be swept away."),
          L("narr", "VANISH dodges an attack completely, for 20 ki. You can't guard or vanish when your ki is below zero.") ] },
        { id: "4-3", type: "battle", name: "Saiyans of the Past", lv: 20, waves: [W("pastsaiyan", "pastsaiyan")], pre: [
          L("tien", "Two of them. They fight like animals, but they never tire."),
          L("chiaotzu", "Tien, I can hold one still with my mind!") ] },
        { id: "4-4", type: "chest", name: "Korin's Senzu Beans", reward: { lmd: 3000, prime: 2, rec2: 4, orundum: 100 }, pre: [
          L("yajirobe", "Korin says you get three beans. I already ate two. So, uh... one each. Kinda.") ] },
        { id: "4-5", type: "side", name: "Yajirobe's Lunch", lv: 22, waves: [W(O("yajirobe-s"), "pastsaiyan")], pre: [
          L("yajirobe", "Hands off my lunch! You wanna fight? I'll fight! ...Hey, wait, which one of you's the Saiyan?") ] },
        { id: "4-6", type: "boss", name: "The Saiyan Elite", lv: 24, waves: [W("pastsaiyan"), W("b_pastsaiyan", "pastsaiyan")], pre: [
          L("popo", "One last vision. The strongest warrior of a destroyed world."),
          L("krillin", "Whatever happens, we stick together. Got it?") ], post: [
          L("kami", "You have grown strong. Stronger than I ever was. Now, go. They have landed."),
          L("tien", "Then let's go meet them.") ] },
      ] },
    { id: "c5", season: "Saiyan Saga", title: "The Saiyans Land", env: "wasteland", lead: "piccolo-s", reward: { op: "nappa-s", orundum: 300 },
      nodes: [
        { id: "5-1", type: "story", name: "Two Saiyans", pre: [
          L("nappa", "So this is Earth. Mind if I say hello?"),
          L("narr", "With one gesture, Nappa erases East City."),
          L("vegeta", "Nappa. Don't waste your energy. Let's find the Dragon Balls... and Kakarot."),
          L("piccolo", "They're here. Gohan, stay behind me.") ] },
        { id: "5-2", type: "battle", name: "Six Saibamen", lv: 25, waves: [W("saiba", "saiba"), W("saiba", "saiba", "saiba")], pre: [
          L("nappa", "Let's play a game. We plant six Saibamen, and they fight you one at a time."),
          L("yamcha", "Leave the first one to me. Time I showed what I can do.") ], post: [
          L("narr", "The last Saibaman clings to Yamcha and explodes. Yamcha falls."),
          L("krillin", "Yamcha!! You'll pay for that!") ] },
        { id: "5-3", type: "battle", name: "Saibaman Ambush", lv: 27, waves: [W("saiba", "saiba", "saiba"), W(O("saibaman-s"), "saiba", "saiba")], pre: [
          L("krillin", "Everyone get back! Haaa!"),
          L("piccolo", "Plenty survived that. Watch your backs.") ] },
        { id: "5-4", type: "chest", name: "Capsule Corp Supplies", reward: { lmd: 4000, rec2: 6, chip: 2, orundum: 150 }, pre: [
          L("bulma", "Dad sent armor plating, food and medicine. ...Is anybody still alive out there?") ] },
        { id: "5-5", type: "battle", name: "Nappa's Rampage", lv: 29, waves: [W("saiba"), W(O("nappa-s"))], pre: [
          L("nappa", "Next! Who wants to die first?"),
          L("chiaotzu", "Tien... goodbye."),
          L("tien", "Chiaotzu, no!") ], post: [
          L("piccolo", "Gohan... the only one who ever... talked to me..."),
          L("narr", "Piccolo shields Gohan from Nappa's blast. And on the Lookout, Kami falls with him.") ] },
        { id: "5-6", type: "side", name: "Saibaman Patch", lv: 30, waves: [W("saiba", "saiba", "saiba"), W("saiba", O("saibaman-s"), "saiba")], pre: [
          L("krillin", "There are more of these things sprouting by the minute. Clear them out before they hatch!") ] },
        { id: "5-7", type: "boss", name: "Goku vs. Nappa", lv: 32, waves: [W("saiba"), W("b_nappa")], pre: [
          L("goku", "Sorry I'm late, everybody. Krillin, Gohan, eat these Senzu Beans."),
          L("nappa", "Ha! You're Kakarot? Vegeta, his power level's nothing!"),
          L("goku", "Kaioken!") ], post: [
          L("nappa", "Vegeta... help me..."),
          L("vegeta", "A Saiyan who can't move is useless to me."),
          L("narr", "Vegeta hurls his own partner into the sky and blasts him to nothing.") ] },
      ] },
    { id: "c6", season: "Saiyan Saga", title: "Goku vs. Vegeta", env: "wasteland", lead: "goku-s", reward: { op: "vegeta-s", orundum: 400, permit: 3 },
      nodes: [
        { id: "6-1", type: "story", name: "It's Over 9000!", pre: [
          L("nappa", "Vegeta, what does the scouter say about his power level?"),
          L("vegeta", "It's over nine thousand!"),
          L("vegeta", "Kakarot. Let's take this somewhere with a little more room.") ] },
        { id: "6-2", type: "battle", name: "Kaioken!", lv: 33, waves: [W(O("vegeta-s"))], pre: [
          L("goku", "Kaioken... times two!"),
          L("vegeta", "So you hid a trick. It won't matter. I'm the Prince of all Saiyans!") ] },
        { id: "6-3", type: "boss", name: "Galick Gun vs. Kamehameha", lv: 35, waves: [W("b_vegeta")], pre: [
          L("vegeta", "Galick Gun! I'll blow you and this whole planet to dust!"),
          L("goku", "Kaioken times three! Kamehameha!"),
          L("narr", "When Vegeta falls, he won't stay down. Without a moon, he makes his own: a Power Ball.") ], post: [
          L("narr", "Yajirobe's sword cuts the Great Ape's tail. Vegeta shrinks back to his old size, battered and furious."),
          L("goku", "Everybody... lend me your energy. Spirit Bomb!") ] },
        { id: "6-4", type: "story", name: "A Saiyan's Pride", pre: [
          L("vegeta", "I'll be back. And next time... I'll be immortal."),
          L("krillin", "Goku, let me finish him! He killed everyone!"),
          L("goku", "Let him go, Krillin. He's... a great fighter. I want to face him again."),
          L("narr", "Vegeta's pod streaks into the sky. Somewhere far away, Frieza is waiting for him.") ] },
        { id: "6-5", type: "side", name: "Gohan the Great Ape", lv: 37, waves: [W("b_ape")], pre: [
          L("gohan", "Something's happening to me... the Power Ball...!"),
          L("krillin", "Gohan's turning into a Great Ape too! Somebody stop Vegeta's ape before they flatten us!") ] },
        { id: "6-6", type: "battle", name: "Last Saiyan Standing", lv: 38, waves: [W(O("saibaman-s"), O("saibaman-s")), W("b_vegeta2")], pre: [
          L("vegeta", "You think I'm finished? A Saiyan fights until his last breath!") ] },
      ] },
    // ======================= FRIEZA SAGA =======================
    { id: "c7", season: "Frieza Saga", title: "Journey to Namek", env: "space", lead: "krillin-s", reward: { op: "goku-n", orundum: 300 },
      nodes: [
        { id: "7-1", type: "story", name: "Kami's Spaceship", env: "lookout", pre: [
          L("bulma", "Piccolo came from a planet called Namek. If it has Dragon Balls, we can wish everyone back!"),
          L("krillin", "Gohan, Bulma and me. And Goku follows when he's out of the hospital."),
          L("gohan", "Mom said I can go if I study on the ship.") ] },
        { id: "7-2", type: "battle", name: "Planet Arlia", lv: 40, env: "arlia", waves: [W("arlian", "arlian"), W("arlian", "arlian", "arlian")], pre: [
          L("narr", "The ship breaks down near Planet Arlia, where King Moai feeds prisoners to his giant insect."),
          L("krillin", "Bugs. Of course it's bugs.") ] },
        { id: "7-3", type: "battle", name: "Arlian Prison Guards", lv: 41, env: "arlia", waves: [W("arlian", "brute", "arlian")], pre: [
          L("gohan", "The prisoners are rebels. Let's break them out!") ] },
        { id: "7-4", type: "chest", name: "Arlian Treasury", env: "arlia", reward: { lmd: 5000, rec3: 3, chip: 2, orundum: 150 }, pre: [
          L("bulma", "Ooh, is that the ship's spare parts? And... jewels. For the trip, obviously.") ] },
        { id: "7-5", type: "story", name: "100× Gravity", env: "gravity", pre: [
          L("narr", "Behind them, Goku launches in a capsule ship with a gravity machine built by Dr. Brief."),
          L("goku", "Ten times... twenty... fifty... one hundred! Hahh... hahh... Hehe, I'll get used to it.") ] },
        { id: "7-6", type: "side", name: "Space Pirates of Arlia", lv: 43, env: "arlia", waves: [W("arlian", "arlian"), W("brute", "arlian", "arlian")], pre: [
          L("krillin", "The guards want a rematch. Fine by me.") ] },
        { id: "7-7", type: "boss", name: "King Moai", lv: 44, env: "arlia", waves: [W("arlian", "arlian"), W("moai", "arlian")], pre: [
          L("moai", "Rebels! Feed them to the beast! No, wait... I'll squash them myself!") ], post: [
          L("narr", "Arlia is free. Repaired, the ship flies on toward Namek.") ] },
      ] },
    { id: "c8", season: "Frieza Saga", title: "Planet Namek", env: "namek", lead: "gohan-s", reward: { op: "dende-s", orundum: 300 },
      nodes: [
        { id: "8-1", type: "story", name: "A Green World", pre: [
          L("narr", "Planet Namek. Three suns, blue grass, and seven Dragon Balls."),
          L("krillin", "Those power levels... dozens of them, and all huge. Frieza's army is here."),
          L("vegetaa", "Frieza wants immortality? Not if I get the Dragon Balls first.") ] },
        { id: "8-2", type: "battle", name: "Frieza's Soldiers", lv: 46, waves: [W("soldier", "soldier2"), W("soldier", "scout", "soldier2")], pre: [
          L("gohan", "They're attacking the villages! Krillin, we have to do something!") ] },
        { id: "8-3", type: "boss", name: "Vegeta vs. Cui", lv: 47, waves: [W("soldier"), W("b_cui")], pre: [
          L("cui", "Vegeta! You and I were always equals. Lord Frieza will reward me for your head."),
          L("vegetaa", "Equals? Look at your scouter, Cui.") ], post: [
          L("vegetaa", "Fireworks, Cui. Enjoy them.") ] },
        { id: "8-4", type: "event", name: "Dodoria's Chase", game: "dodoria", pre: [
          L("dodoria", "There's the brat who saved that Namekian kid! Get back here!"),
          L("krillin", "Gohan, fly! Fly as fast as you can and don't look back!") ] },
        { id: "8-5", type: "battle", name: "The Village Massacre", lv: 49, waves: [W("soldier", "soldier2", "scout"), W(O("appule-s"), "soldier", "soldier2")], pre: [
          L("dende", "Please! They've come for our Dragon Ball!"),
          L("gohan", "I won't let them hurt you. Get behind me!") ] },
        { id: "8-6", type: "chest", name: "The Village Dragon Ball", reward: { lmd: 5000, rec3: 4, summ: 3, orundum: 150 }, pre: [
          L("dende", "The elder wants you to have it. Thank you, Gohan.") ] },
        { id: "8-7", type: "side", name: "Appule's Squad", lv: 50, waves: [W("soldier", "soldier"), W("b_appule", "soldier2")], pre: [
          L("appule", "The brat's here! Lord Frieza's going to reward me personally.") ] },
        { id: "8-8", type: "boss", name: "Dodoria", lv: 51, waves: [W("soldier2"), W("b_dodoria")], pre: [
          L("dodoria", "Vegeta? What are you doing here?"),
          L("vegetaa", "Tell me, Dodoria. Who really destroyed Planet Vegeta?") ], post: [
          L("dodoria", "It was Frieza! He feared the Saiyans... a Super Saiyan..."),
          L("vegetaa", "I knew it.") ] },
      ] },
    { id: "c9", season: "Frieza Saga", title: "The Dragon Balls", env: "namek", lead: "gohan-n", reward: { op: "krillin-n", orundum: 300 },
      nodes: [
        { id: "9-1", type: "story", name: "Grand Elder Guru", pre: [
          L("guru", "You carry great potential, little one. Let me bring it out."),
          L("gohan", "I feel... so much stronger!"),
          L("krillin", "Me next! Me next!") ] },
        { id: "9-2", type: "battle", name: "Zarbon's Patrol", lv: 52, waves: [W("soldier", "scout"), W("brute", "soldier2", "scout")], pre: [
          L("krillin", "Zarbon's men are sweeping the area. Stay low.") ] },
        { id: "9-3", type: "boss", name: "Zarbon's Secret", lv: 54, waves: [W("b_zarbon")], pre: [
          L("zarbon", "Vegeta. You've grown strong. Strong enough that I'll have to show you my other form. It isn't pretty."),
          L("vegetaa", "Your other form?") ], post: [
          L("zarbon", "No... I'm supposed to be the beautiful one..."),
          L("vegetaa", "And after a Saiyan nearly dies, he comes back stronger. Zenkai.") ] },
        { id: "9-4", type: "event", name: "The Dragon Ball in the Lake", game: "dive", pre: [
          L("krillin", "Vegeta hid a Dragon Ball at the bottom of that lake. Gohan, you're a good swimmer, right?"),
          L("gohan", "Leave it to me!") ] },
        { id: "9-5", type: "battle", name: "Zarbon Returns", lv: 56, waves: [W("soldier", "brute"), W(O("zarbon-m"), "soldier")], pre: [
          L("zarbon", "You again? Lord Frieza wants Vegeta alive. You two, he doesn't care about.") ] },
        { id: "9-6", type: "chest", name: "Saiyan Battle Armor", reward: { lmd: 6000, rec3: 4, chip: 3, orundum: 150 }, pre: [
          L("vegetaa", "Take the armor from Frieza's ship. It stretches. Even for a bald runt.") ] },
        { id: "9-7", type: "side", name: "Frieza's Elite Guard", lv: 57, waves: [W("brute", "scout"), W("brute", "soldier2", "scout")], pre: [
          L("gohan", "More of them. They want the Dragon Balls we hid.") ] },
        { id: "9-8", type: "boss", name: "Monster Zarbon", lv: 58, waves: [W("soldier"), W("b_zarbon2")], pre: [
          L("zarbon", "No more holding back, monkey. Feel my true power!"),
          L("vegetaa", "I already have. Now it's your turn to feel mine.") ], post: [
          L("narr", "Zarbon falls into the sea. Vegeta has five Dragon Balls. Frieza has none. And the Ginyu Force is coming.") ] },
      ] },
    { id: "c10", season: "Frieza Saga", title: "The Ginyu Force", env: "namek", lead: "vegeta-n", reward: { op: "vegeta-n", orundum: 400, permit: 3 },
      nodes: [
        { id: "10-1", type: "story", name: "Strike a Pose!", pre: [
          L("narr", "Five warriors land in a line. Each strikes a pose."),
          L("ginyu", "Recoome! Burter! Jeice! Guldo! And I, Captain Ginyu! Together we are..."),
          L("ginyu", "...the GINYU FORCE!"),
          L("krillin", "...Are they serious?"),
          L("vegetaa", "Don't laugh. They're Frieza's elite. Each one is a monster.") ] },
        { id: "10-2", type: "boss", name: "Guldo", lv: 60, waves: [W("b_guldo")], pre: [
          L("guldo", "Hold your breath, and time stands still. Only for me!"),
          L("narr", "Guldo's Time Freeze can't be guarded. Vanish before it lands.") ], post: [
          L("vegetaa", "Pathetic. That was the Ginyu Force?") ] },
        { id: "10-3", type: "boss", name: "Recoome", lv: 62, waves: [W("b_recoome")], pre: [
          L("recoome", "Recoome... KICK! And now... Recoome Eraser Gun!"),
          L("gohan", "He won't stay down!") ], post: [
          L("goku", "Hey, everybody. Sorry I'm late again.") ] },
        { id: "10-4", type: "story", name: "Goku Arrives", pre: [
          L("goku", "Here, Krillin, Gohan. Senzu Beans."),
          L("vegetaa", "Kakarot. Your power... what happened to you?"),
          L("goku", "Hundred times gravity. Now, who's next?") ] },
        { id: "10-5", type: "boss", name: "Burter and Jeice", lv: 64, waves: [W("b_burter", "b_jeice")], pre: [
          L("jeice", "Burter, he took out Recoome with one punch!"),
          L("burter", "Then we hit him together. Purple Comet Crush!") ] },
        { id: "10-6", type: "chest", name: "Senzu Bean Pouch", reward: { lmd: 6000, prime: 2, rec3: 4, orundum: 150 }, pre: [
          L("goku", "Last few Senzu. Make 'em count.") ] },
        { id: "10-7", type: "side", name: "Ginyu Force Encore", lv: 65, waves: [W(O("guldo-s"), O("burter-s")), W(O("jeice-s"), O("recoome-s"))], pre: [
          L("jeice", "Back from the brink, mates! Ginyu Force, strike a pose!") ] },
        { id: "10-8", type: "boss", name: "Captain Ginyu", lv: 67, waves: [W("b_ginyu")], pre: [
          L("ginyu", "What a magnificent body you have, Goku. I'll take it. BODY... CHANGE!"),
          L("narr", "Body Change swaps HP percentages with its target. Vanish to dodge it.") ], post: [
          L("narr", "Goku throws a frog into the path of Ginyu's final Body Change. The great Captain Ginyu croaks."),
          L("vegetaa", "Now. The Dragon Balls. Immortality is mine!") ] },
      ] },
    { id: "c11", season: "Frieza Saga", title: "Frieza's Wrath", env: "namek", lead: "gohan-n", reward: { op: "piccolo-n", orundum: 400 },
      nodes: [
        { id: "11-1", type: "story", name: "The Eternal Dragon Porunga", pre: [
          L("dende", "I'll speak the password. Takkaraputo... poppopporunga... pupiritto... paro!"),
          L("narr", "Porunga rises. The first wish brings Piccolo back to life; the second sends him to Namek."),
          L("narr", "Then Grand Elder Guru dies, and the dragon turns back to stone, one wish short."),
          L("frieza", "You... you insects stole my wish.") ] },
        { id: "11-2", type: "boss", name: "Frieza, First Form", lv: 70, waves: [W("b_frieza1")], pre: [
          L("frieza", "I'll kill you all slowly. You've earned that much."),
          L("vegetaa", "We'll see, Frieza. I've grown.") ], post: [
          L("frieza", "Impressive. You've earned the right to see my second form.") ] },
        { id: "11-3", type: "boss", name: "Second Form", lv: 72, waves: [W("b_frieza2")], pre: [
          L("frieza", "My power level is now over one million. But I won't make this quick."),
          L("krillin", "Gohan, get away from him!") ], post: [
          L("narr", "Piccolo arrives, fused with Nail. Frieza begins to change again.") ] },
        { id: "11-4", type: "story", name: "Piccolo Fuses with Nail", pre: [
          L("nail", "Fuse with me, Piccolo. Use my power to protect Namek."),
          L("piccolon", "I'm not Piccolo, and I'm not Nail. I'm the Namekian who will end you, Frieza."),
          L("gohan", "Mr. Piccolo!") ] },
        { id: "11-5", type: "battle", name: "The Last Henchmen", lv: 73, waves: [W("brute", "scout", "soldier2"), W(O("frieza-1"))], pre: [
          L("krillin", "Frieza's last soldiers are coming in from the ship!") ] },
        { id: "11-6", type: "chest", name: "Guru's Gift", reward: { lmd: 8000, rec4: 3, chip: 3, orundum: 200 }, pre: [
          L("dende", "With his last strength, the Grand Elder gave me the power to heal. Let me help you.") ] },
        { id: "11-7", type: "boss", name: "Final Form", lv: 75, waves: [W("b_frieza4")], pre: [
          L("frieza", "This is my final form. Smaller, smoother... and far, far stronger."),
          L("vegetaa", "I'm a Super Saiyan now! I can feel it!"),
          L("frieza", "Death Beam.") ], post: [
          L("vegetaa", "Kakarot... Frieza destroyed our planet... our people... make him pay..."),
          L("gokun", "I will. I promise.") ] },
      ] },
    { id: "c12", season: "Frieza Saga", title: "Super Saiyan", env: "namekdie", lead: "goku-ssj", reward: { op: "goku-ssj", orundum: 600, permit: 5 },
      nodes: [
        { id: "12-1", type: "story", name: "Goku vs. Frieza", env: "namek", pre: [
          L("gokun", "Frieza. This is for Vegeta, and for every Saiyan you killed."),
          L("frieza", "A monkey's revenge. How touching.") ] },
        { id: "12-2", type: "battle", name: "Kaioken ×20", lv: 77, env: "namek", waves: [W(O("frieza-4"))], pre: [
          L("gokun", "Kaioken... times twenty! Kamehameha!") ], post: [
          L("narr", "Frieza deflects it with one hand. Goku raises his arms to the sky: Spirit Bomb.") ] },
        { id: "12-3", type: "story", name: "I Am the Super Saiyan!", pre: [
          L("frieza", "That bomb was impressive. Your little bald friend won't be.") ,
          L("krillin", "Goku... help... me..."),
          L("narr", "Frieza destroys Krillin. Something inside Goku snaps."),
          L("ssj", "Everyone you ever hurt, Frieza. Every planet, every Saiyan, every Namekian. I'm here for all of them."),
          L("ssj", "I'm a Super Saiyan. And my name is Son Goku!") ] },
        { id: "12-4", type: "boss", name: "Super Saiyan vs. Frieza", lv: 80, waves: [W("b_frieza4b")], pre: [
          L("frieza", "Five minutes until this planet explodes. That's all I need."),
          L("ssj", "Then show me everything you've got."),
          L("narr", "Beat Frieza and he goes to 100% full power.") ], post: [
          L("frieza", "Please... give me some energy..."),
          L("ssj", "...Here. Live, Frieza. Never come back."),
          L("frieza", "I won't be beaten by a filthy monkey! Die!"),
          L("narr", "Goku's blast answers without a word.") ] },
        { id: "12-5", type: "event", name: "Escape from Namek", game: "escape", pre: [
          L("ssj", "The planet's breaking apart. There's a pod on Frieza's ship... I have to get there!") ] },
        { id: "12-6", type: "story", name: "Legend of the Z Fighters", env: "lookout", pre: [
          L("narr", "Namek explodes. On Earth, the Dragon Balls bring back everyone Frieza killed, and the Namekians find a new world."),
          L("krillin", "Goku made it. I'd bet my life on it. ...Again."),
          L("gohan", "Dad's out there somewhere. He'll come home. He always does."),
          L("narr", "The Saiyan Saga and the Frieza Saga are complete. Thanks for playing.") ] },
      ] },
  ],
}];
const NODES = {};
for (const ep of STORY) ep.chapters.forEach((ch, ci) => {
  ch.no = ci + 1;
  ch.nodes.forEach((nd, idx) => { nd.ep = ep; nd.ch = ch; nd.idx = idx; NODES[nd.id] = nd; });
});
// Stamina per stage, and the turn goal for the third star
const nodeCost = nd => nd.type === "story" || nd.type === "chest" || nd.type === "event" ? 0 : 6 + Math.floor(nd.lv / 10) * 2;
const nodeTurnGoal = nd => 4 + 2 * Math.min(TEAM_SIZE, nd.waves ? nd.waves.flat().length : 1) + (nd.type === "boss" ? 4 : 0) + (nd.waves && nd.waves.flat().some(s => s.e && ENEMY[s.e].next) ? 4 : 0);

// ---------- Training Grounds (hunts): proficiency scrolls and training gear ----------
const HUNTS = [
  { id: "kingkai", code: "KK", n: "King Kai's Planet", sub: "Ten times Earth's gravity, and Bubbles", env: "kingkai", item: "trM",
    waves: lv => [W("ogre", "ogre2", "ogre"), W("b_goz", "ogre2", "ogre")] },
  { id: "lookout", code: "KL", n: "Kami's Lookout", sub: "Mr. Popo's visions of the past", env: "lookout", item: "trK",
    waves: lv => [W("pastsaiyan", "pastsaiyan"), W("b_pastsaiyan", "pastsaiyan", "pastsaiyan")] },
  { id: "gravity", code: "GC", n: "Gravity Chamber", sub: "Goku's capsule ship at 100× gravity", env: "gravity", item: "trG",
    waves: lv => [W("soldier", "brute", "scout"), W("brute", "soldier2", "brute")] },
];
const HUNT_LV = [10, 22, 34, 46, 58, 70];
const HUNT_COST = [8, 10, 12, 14, 16, 18];

// World Martial Arts Tournament: 30 matches; every fifth is a champion, even matches from 8 on are other teams
const TOWER_FLOORS = 30;
function towerFloor(f) {
  const lv = 4 + f * 3, rng = seeded(hash("tower" + f));
  const mobs = ["saiba", "dino", "ogre", "ogre2", "pastsaiyan", "arlian", "soldier", "soldier2", "brute", "scout"];
  const bosses = ["b_raditz", "b_goz", "b_nappa", "b_pastsaiyan", "b_vegeta2", "b_dodoria", "b_zarbon2", "b_recoome", "b_ginyu", "b_frieza4"];
  const pickE = () => mobs[Math.floor(rng() * mobs.length)];
  let waves;
  if (f % 5 === 0) waves = [W(pickE(), pickE()), W(bosses[(f / 5 - 1) % bosses.length], pickE())];
  else if (f >= 8 && f % 2 === 0) {
    const pool = OP_KEYS.filter(k => OPS[k].rar >= 4);
    waves = [[0, 1, 2].map(() => ({ op: pool[Math.floor(rng() * pool.length)] }))];
  } else waves = [W(pickE(), pickE(), pickE())];
  const reward = f % 5 === 0 ? { orundum: 200, permit: 1, chip: 2 } : { orundum: 50, lmd: 1500 + f * 300, ["rec" + Math.min(4, 1 + Math.floor(f / 8))]: 3 };
  return { id: "T" + f, f, lv, waves, reward, env: "tournament" };
}

// Scouter Rankings: challengers and their titles
const ARENA_N1 = ["Orange Star", "Pepper Town", "Ginger Town", "Satan City", "North City", "Penguin Village", "Fire Mountain", "Karin Forest", "Kame Island", "Yunzabit", "West City", "South City"];
const ARENA_N2 = ["Fighters", "Dojo", "Tigers", "Cranes", "Turtles", "Wolves", "Dragons", "Stars", "Monks", "Brawlers", "Warriors", "Kickers"];
const ARENA_CLS = [[60, ["Universal Champion", "Tournament Champion", "Elite Warrior"]], [300, ["Martial Arts Master", "Regional Champion", "Dojo Master", "Tournament Finalist"]],
  [1e9, ["Street Fighter", "Junior Martial Artist", "Dojo Student", "Turtle School Student", "Crane School Student"]]];
const arenaCls = rank => pick(ARENA_CLS.find(([r]) => rank <= r)[1]);
const ARENA_MS = 10 * 60000, PAYOUT_MS = 6 * 3600000;

const DAILIES = [
  { id: "clear", n: "Win 3 battles", goal: 3, reward: { orundum: 60, lmd: 2000, credit: 80 } },
  { id: "sanity", n: "Spend 60 Stamina", goal: 60, reward: { orundum: 60, credit: 40 } },
  { id: "hh", n: "Summon once", goal: 1, reward: { orundum: 80 } },
  { id: "upgrade", n: "Train fighters 3 times", goal: 3, reward: { rec2: 3 } },
  { id: "arena", n: "Win a Scouter Rankings battle", goal: 1, reward: { tokens: 30, orundum: 40 } },
  { id: "rune", n: "Raise a Proficiency", goal: 1, reward: { lmd: 3000, credit: 40 } },
];
const DAILY_ALL = { permit: 1 };
// Z Records (achievements) live in a9c_meta.js (ACH): tiered, with rewards sent to the Mailbox.
const SHOP = {
  credit: [
    { id: "r_lmd", n: "Zeni ×12,000", cost: 200, give: { lmd: 12000 } },
    { id: "r_rec", n: "Gravity Capsule ×3", cost: 240, give: { rec4: 3 } },
    { id: "r_summ", n: "Z Orbs ×3", cost: 160, give: { summ: 3 } },
    { id: "r_chip", n: "Rainbow Z Orb", cost: 300, give: { chip: 1 } },
  ],
  cert: [
    { id: "c_permit", n: "Summon Ticket", cost: 25, give: { permit: 1 } },
    { id: "c_summ", n: "Z Orbs ×3", cost: 8, give: { summ: 3 } },
    { id: "c_chip", n: "Rainbow Z Orb ×2", cost: 12, give: { chip: 2 } },
    { id: "c_scr", n: "Scroll set", d: "A Melee, a Ki and a Guard Scroll", cost: 10, give: { trM: 1, trK: 1, trG: 1 } },
  ],
  tokens: [
    { id: "t_permit", n: "Summon Ticket", cost: 240, give: { permit: 1 } },
    { id: "t_chip", n: "Rainbow Z Orb ×3", cost: 90, give: { chip: 3 } },
    { id: "t_summ", n: "Z Orbs ×4", cost: 60, give: { summ: 4 } },
    { id: "t_scr", n: "Scroll set ×3", d: "Three each of the Melee, Ki and Guard Scrolls", cost: 120, give: { trM: 3, trK: 3, trG: 3 } },
  ],
  prime: [
    { id: "p_san", n: "Eat a Senzu Bean", d: "Refill Stamina to max", cost: 1, give: { sanityMax: 1 } },
    { id: "p_oru", n: "Trade for Dragon Stones", d: "1 Senzu Bean → 180 Dragon Stones", cost: 1, give: { orundum: 180 } },
  ],
};
// the starting party: Goku, Krillin, Gohan and Yamcha (Piccolo joins after Raditz); a party is three
const STARTERS = ["goku-s", "krillin-s", "gohan-s", "yamcha-s"];
// Bardock never comes from a Summon: he arrives as a Mystery Gift after the Saiyan Saga (a9c_meta.js)
const MYSTERY_OP = "bardock-s";
const boosterPool = rar => OP_KEYS.filter(k => OPS[k].rar === rar && k !== MYSTERY_OP);
const BANNER_TOP = boosterPool(5);
