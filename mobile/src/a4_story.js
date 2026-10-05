
// =====================================================================
//  STORY — Main Theme, an original fan retelling of the Arknights main story.
//  STORY holds the parts (arcs); each part's chapters are the Episodes, numbered across parts.
//  Part 1 "Embers of Chernobog" starts here; a4b/a4c add episodes, a4d_world indexes them.
//  Node types: story · battle · side · chest · boss
//  Optional node fields: mood (story music: string or { pre, post }), bgm (battle music key)
// =====================================================================
const SPK = {
  narr: { n: "" },
  doctor: { n: "Doctor" },
  amiya: { n: "Amiya", op: "amiya" },
  ace: { art: "ace", n: "Ace" },
  kaltsit: { art: "kaltsit", n: "Kal'tsit" },
  closure: { art: "closure", n: "Closure" },
  chen: { art: "chen", n: "Ch'en" },
  hoshiguma: { n: "Hoshiguma", op: "hoshiguma" },
  swire: { n: "Swire", op: "swire" },
  exusiai: { n: "Exusiai", op: "exusiai" },
  texas: { n: "Texas", op: "texas" },
  blaze: { n: "Blaze", op: "blaze" },
  lappland: { n: "Lappland", op: "lappland" },
  silverash: { n: "SilverAsh", op: "silverash" },
  nearl: { n: "Nearl", op: "nearl" },
  ptilopsis: { n: "Ptilopsis", op: "ptilopsis" },
  soldier: { n: "Reunion Soldier", en: "soldier" },
  crownslayer: { n: "Crownslayer", en: "crownslayer" },
  skullshatterer: { n: "Skullshatterer", en: "skullshatterer" },
  mephisto: { n: "Mephisto", en: "mephisto" },
  faust: { n: "Faust", en: "faust" },
  frostnova: { n: "FrostNova", en: "frostnova" },
  // later in Part 1, and again in Part 2
  w: { n: "W", en: "w", art: "w" },
  talulah: { n: "Talulah", en: "talulah", art: "talulah" },
  patriot: { n: "Patriot", en: "patriot", art: "patriot" },
  misha: { n: "Misha", art: "misha" },
  scout: { n: "Scout", art: "scout" },
  riguard: { n: "Rhodes Island Guard", art: "riguard" },
};
// speakers: n = name shown; op = operator key (their art); en = enemy key; art = story portrait (assets/story/<art>.webp)
function addSpeakers(defs) { for (const k in defs) { if (SPK[k]) throw new Error("duplicate speaker " + k); SPK[k] = defs[k]; } }
const L = (s, t) => ({ s, t });
const W = (...list) => list.map(x => typeof x === "string" ? { e: x } : x);

const STORY = [{
  id: "ep1", title: "Embers of Chernobog", sub: "Part 1",
  blurb: "Rhodes Island wakes its Doctor in a burning city. Reunion is rising, and every road leads toward Lungmen.",
  chapters: [
    { id: "c1", title: "Awakening", env: "ruins", map: "ruins", reward: { orundum: 300, permit: 2 },
      nodes: [
        { id: "1-1", type: "story", name: "The Sarcophagus", pre: [
          L("narr", "Chernobog. The sky is the colour of a dying ember, and the city's alarms have been screaming for an hour."),
          L("amiya", "Doctor? Doctor! Can you hear me? Please, open your eyes."),
          L("doctor", "...Where am I? Who... am I?"),
          L("amiya", "You're safe. Mostly. I'm Amiya, of Rhodes Island. We came to bring you home."),
          L("ace", "Sorry to cut the reunion short. Reunion has the east block. We move now or we don't move at all."),
          L("amiya", "Doctor, I know you don't remember anything. But you used to lead us. Will you lead us again?"),
          L("doctor", "...Tell me who is standing with us, and where the enemy is."),
          L("amiya", "That's the Doctor I know. Let's go!") ] },
        { id: "1-2", type: "battle", name: "Corridor Breakout", lv: 1, waves: [W("soldier", "soldier", "soldier")], pre: [
          L("ace", "Three of them in the corridor. Doctor, call the shots."),
          L("amiya", "Leave it to us! Doctor, tap an enemy to target it, then choose a skill.") ], post: [
          L("amiya", "We did it! Doctor, your commands were perfect.") ] },
        { id: "1-3", type: "battle", name: "Ash Hounds", lv: 2, waves: [W("hound", "soldier", "hound")], pre: [
          L("soldier", "Rhodes Island dogs! Let the hounds have them!"),
          L("ace", "Infected hounds. Fast, and they bite through armour. Don't let them reach the medic.") ] },
        { id: "1-4", type: "chest", name: "Abandoned Supply Cache", reward: { lmd: 2000, rec1: 6, orundum: 100 }, pre: [
          L("amiya", "A Rhodes Island supply cache! Someone left this here for us.") ] },
        { id: "1-5", type: "side", name: "Crossbow Nest", lv: 4, waves: [W("crossbow", "crossbow", "soldier")], pre: [
          L("narr", "A side alley glitters with bolts. Clearing it isn't necessary... but the stash behind it looks valuable.") ] },
        { id: "1-6", type: "battle", name: "The Burning Square", lv: 4, waves: [W("soldier", "caster", "soldier"), W("thrower", "soldier", "caster")], pre: [
          L("ace", "The square is the only way to the extraction point. Two waves at least."),
          L("amiya", "Doctor, if the casters get a full turn, we'll feel it. Prioritise them.") ] },
        { id: "1-7", type: "boss", name: "Crownslayer", lv: 7, waves: [W("soldier", "soldier"), W("crownslayer", "soldier", "thrower")], pre: [
          L("crownslayer", "So the rumours were true. Rhodes Island came back for its ghost."),
          L("amiya", "Let us pass. We don't want to fight you."),
          L("crownslayer", "Nobody ever wants to fight. And yet here we all are."),
          L("ace", "Doctor. Amiya. Get through her. I'll hold the rear.") ], post: [
          L("crownslayer", "...Tch. Reunion will remember this, Doctor."),
          L("amiya", "She's retreating! Ace, we're through, come on!"),
          L("ace", "Go. Someone has to keep the door shut. Take care of them, Doctor."),
          L("narr", "The door closes. Amiya does not look back until the city is far behind them.") ] },
      ] },
    { id: "c2", title: "The Burning City", env: "ruins", map: "ruins", reward: { op: "blaze", orundum: 300 },
      nodes: [
        { id: "2-1", type: "story", name: "Voices on the Comms", pre: [
          L("kaltsit", "Doctor. You are awake, and you are alive. Good. Both of those facts are expensive. Do not waste them."),
          L("amiya", "Kal'tsit, Chernobog is moving. The whole city is... walking."),
          L("kaltsit", "Reunion has seized the city's core. Their leader wants Chernobog aimed at Lungmen."),
          L("doctor", "Then we stop it from getting there."),
          L("kaltsit", "Then you will need more hands than you have. An elite operator is en route. Survive until she arrives.") ] },
        { id: "2-2", type: "battle", name: "Molotov Row", lv: 9, waves: [W("thrower", "soldier", "thrower")], pre: [
          L("amiya", "Fire bombs! Spread out, and keep the healer busy!") ] },
        { id: "2-3", type: "battle", name: "Shield Wall", lv: 11, waves: [W("shield", "crossbow", "shield")], pre: [
          L("amiya", "Shieldguards. Their DEF soaks Physical hits, but Arts go straight through it. Casters, focus them!"),
          L("doctor", "And if the Arts users are down?"),
          L("amiya", "Then lower their DEF first, or make them Fragile. Stack both and they'll fold!") ] },
        { id: "2-4", type: "side", name: "A Wolf in the Ruins", lv: 13, waves: [W({ op: "lappland" }, "hound", "hound")], pre: [
          L("lappland", "Ahaha! Rhodes Island, in the middle of all this smoke? I've been so bored."),
          L("amiya", "We're not your enemy!"),
          L("lappland", "I know. That's what makes it fun.") ], post: [
          L("lappland", "Not bad, not bad at all. Look me up in Lungmen, Doctor. Texas owes me a fight.") ] },
        { id: "2-5", type: "chest", name: "Scorched Armoury", reward: { lmd: 4000, rec2: 4, chip: 2, orundum: 100 } },
        { id: "2-6", type: "battle", name: "Railyard Ambush", lv: 14, waves: [W("soldier", "crossbow", "caster"), W("shield", "thrower", "caster", "soldier")], pre: [
          L("amiya", "The railyard leads to the city edge. Reunion knows it too.") ] },
        { id: "2-7", type: "boss", name: "Skullshatterer", lv: 17, waves: [W("soldier", "thrower", "crossbow"), W("skullshatterer", "shield", "crossbow")], pre: [
          L("skullshatterer", "You're the ones who walked past Crownslayer. I won't make it that easy."),
          L("amiya", "This city is going to crash into Lungmen! Thousands of people will die!"),
          L("skullshatterer", "Thousands of us already have. Nobody ever counted those.") ], post: [
          L("skullshatterer", "...Sister... I'm sorry..."),
          L("blaze", "Phew, made it! Rhodes Island elite operator Blaze, reporting in. Looks like I missed the hard part."),
          L("amiya", "Blaze! You're just in time. We're heading for Lungmen."),
          L("blaze", "Then let's go make some noise, Doctor.") ] },
      ] },
    { id: "c3", title: "Lungmen Gate", env: "city", map: "city", reward: { op: "texas", orundum: 300 },
      nodes: [
        { id: "3-1", type: "story", name: "City of Neon", pre: [
          L("narr", "Lungmen rises out of the wastes like a promise: glass towers, moving districts, and a wall that does not open for the Infected."),
          L("chen", "Rhodes Island. You bring Reunion to my city's doorstep and expect a welcome?"),
          L("amiya", "We came to warn you. Chernobog is on a collision course with Lungmen."),
          L("hoshiguma", "Madam, if they're telling the truth, we need every pair of hands."),
          L("swire", "And if they're lying, we'll know soon enough. Welcome to Lungmen, Doctor.") ] },
        { id: "3-2", type: "battle", name: "Sewer Slugs", lv: 18, waves: [W("slug", "slug", "acidslug", "slug")], pre: [
          L("swire", "The sewers are crawling with Originium Slugs again. Wonderful."),
          L("amiya", "They're slow, but the acid ones break your armour. Don't let them pile up!") ] },
        { id: "3-3", type: "battle", name: "Infiltrators", lv: 20, waves: [W("soldier", "caster", "crossbow"), W("hound", "hound", "caster")], pre: [
          L("hoshiguma", "Reunion agents inside the walls. They came in with the slugs, the clever devils.") ] },
        { id: "3-4", type: "story", name: "Special Delivery", pre: [
          L("narr", "A delivery van screeches around the corner, bounces off a lamppost and stops a metre from the Doctor's boots."),
          L("exusiai", "Penguin Logistics! Sorry about the lamppost, it jumped out at us."),
          L("texas", "...Package for Rhodes Island. Sign here."),
          L("amiya", "Exusiai! Texas! What's inside?"),
          L("exusiai", "Ammo, apple pie, and a whole lot of trouble chasing us. Mostly the trouble.") ] },
        { id: "3-5", type: "side", name: "Penguin Logistics' Test", lv: 23, waves: [W({ op: "exusiai" }, { op: "texas" })], pre: [
          L("texas", "The boss wants to know if Rhodes Island is worth working with."),
          L("exusiai", "Don't worry, we'll only shoot you a little!") ], post: [
          L("exusiai", "Okay, okay, you pass! Apple pie's on me."),
          L("texas", "...You're good, Doctor. That's rarer than you'd think.") ] },
        { id: "3-6", type: "chest", name: "Penguin Stash", reward: { lmd: 6000, rec2: 6, summ: 4, orundum: 100, permit: 1 } },
        { id: "3-7", type: "boss", name: "Mephisto", lv: 27, waves: [W("soldier", "caster", "soldier"), W("mephisto", "sarkaz", "soldier")], pre: [
          L("mephisto", "Ahh, Rhodes Island. Do you know what I love about soldiers? They always get back up. With a little help."),
          L("amiya", "He's healing them... and changing them. Doctor, take him down first!") ], post: [
          L("mephisto", "Faust! Faust, get me out of here!"),
          L("texas", "He ran. The rat always runs.") ] },
      ] },
    { id: "c4", title: "Slum Shadows", env: "slums", map: "slums", reward: { op: "exusiai", orundum: 400 },
      nodes: [
        { id: "4-1", type: "story", name: "The Other Lungmen", pre: [
          L("narr", "Below the neon, the slums. Tin roofs, Infected families, and a quiet that is not peace."),
          L("amiya", "Doctor... these people didn't choose Reunion. They just had nowhere else to go."),
          L("doctor", "Then let's make sure they still have somewhere to go when this is over."),
          L("nearl", "Spoken like a knight. Mind if I walk with you? Kazimierz owes Rhodes Island a debt.") ] },
        { id: "4-2", type: "battle", name: "Sarkaz Mercenaries", lv: 30, waves: [W("sarkaz", "sarkaz", "caster")], pre: [
          L("nearl", "Sarkaz swordsmen. Hired blades, and they don't break easily.") ] },
        { id: "4-3", type: "battle", name: "Night Patrol", lv: 32, waves: [W("hound", "caster", "hound"), W("sarkaz", "thrower", "crossbow")], pre: [
          L("amiya", "They're hunting through the alleys. We have to clear them before dawn.") ] },
        { id: "4-4", type: "side", name: "Karlan Trade's Wager", lv: 35, waves: [W({ op: "silverash" }, { op: "pramanix" }, { op: "cliffheart" })], pre: [
          L("silverash", "Doctor. My company has... interests in Lungmen. Before I invest in you, allow me to measure you."),
          L("amiya", "A sparring match? Now?"),
          L("silverash", "There is no better time to learn what someone is worth than when the city is burning.") ], post: [
          L("silverash", "Excellent. Karlan Trade will support Rhodes Island. Consider it a long-term investment.") ] },
        { id: "4-5", type: "chest", name: "Smuggler's Den", reward: { lmd: 9000, rec3: 4, chip: 3, orundum: 150 } },
        { id: "4-6", type: "battle", name: "Rooftop Pursuit", lv: 38, waves: [W("crossbow", "crossbow", "sarkaz"), W("sarkaz", "caster", "shield", "hound")], pre: [
          L("texas", "Faust's crossbows are on the rooftops. Keep moving.") ] },
        { id: "4-7", type: "boss", name: "Faust & Mephisto", lv: 41, waves: [W("sarkaz", "crossbow", "caster"), W("faust", "mephisto", "sarkaz")], pre: [
          L("faust", "...You hurt him. You won't do that twice."),
          L("mephisto", "Faust, there you are! Kill them! Kill all of them!"),
          L("exusiai", "Doctor, the quiet one's the sniper. Don't let him vanish!") ], post: [
          L("faust", "Mephisto... run. I'll... hold them."),
          L("narr", "Faust's last bolt never leaves the string. In the silence afterward, even Exusiai stops smiling."),
          L("exusiai", "Hey, Doctor. Penguin Logistics is in. All the way in.") ] },
      ] },
    { id: "c5", title: "Winter's Requiem", env: "snow", map: "snow", reward: { orundum: 600, permit: 5 },
      nodes: [
        { id: "5-1", type: "story", name: "The Snowfield", pre: [
          L("narr", "Beyond the city walls, the snow falls up as much as down. Originium dust glitters in the wind like broken glass."),
          L("kaltsit", "Reunion's Yeti Squadron holds the plain. Their leader, FrostNova, is dying of Oripathy. Dying people are dangerous."),
          L("amiya", "She's still a person, Kal'tsit."),
          L("kaltsit", "So were all the others. That is precisely the problem.") ] },
        { id: "5-2", type: "battle", name: "Whiteout", lv: 44, waves: [W("wraith", "wraith", "soldier")], pre: [
          L("amiya", "I can't see three steps ahead... Doctor, stay close.") ] },
        { id: "5-3", type: "battle", name: "Yeti Patrol", lv: 47, waves: [W("wraith", "shield", "crossbow"), W("wraith", "sarkaz", "wraith")], pre: [
          L("blaze", "Ice casters. Let me warm them up a little.") ] },
        { id: "5-4", type: "chest", name: "Frozen Convoy", reward: { lmd: 12000, rec3: 6, summ: 6, orundum: 150, permit: 1 } },
        { id: "5-5", type: "side", name: "The Icecleaver", lv: 50, waves: [W("wraith", "wraith"), W("yeti", "wraith", "shield")], pre: [
          L("narr", "Something enormous moves through the blizzard, dragging a blade the size of a door.") ] },
        { id: "5-6", type: "battle", name: "Last Line", lv: 53, waves: [W("wraith", "crossbow", "shield", "soldier"), W("sarkaz", "wraith", "caster", "wraith")], pre: [
          L("amiya", "This is FrostNova's last line. Everyone, give it everything!") ] },
        { id: "5-7", type: "boss", name: "FrostNova", lv: 57, waves: [W("wraith", "wraith", "shield"), W("frostnova", "wraith", "wraith")], pre: [
          L("frostnova", "Rhodes Island. You walk through my brothers and sisters as if they were snow."),
          L("amiya", "We never wanted this. Please, you're ill, we can help you!"),
          L("frostnova", "Help. Everyone offers help, once it is too late for it to matter."),
          L("frostnova", "Then show me, Doctor. Show me you are worth the winter.") ], post: [
          L("frostnova", "...It's warm. Strange. I thought the end would be cold."),
          L("amiya", "FrostNova... please, hold on..."),
          L("frostnova", "Take care of them, Doctor. The ones nobody counts."),
          L("narr", "The snow keeps falling. Chernobog still moves toward Lungmen. But tonight, Rhodes Island knows exactly who it is fighting for."),
          L("narr", "Far across the wastes, the walking city keeps its course. Chernobog will reach Lungmen's wall in thirty-two hours, and Rhodes Island turns back to meet it.") ] },
      ] },
  ],
}];
