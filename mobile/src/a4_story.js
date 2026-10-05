
// =====================================================================
//  STORY — Episode 1 "Embers of Chernobog" (an original fan retelling)
//  Node types: story · battle · side · chest · boss
// =====================================================================
const SPK = {
  narr: { n: "" },
  doctor: { n: "Doctor" },
  amiya: { n: "Amiya", op: "amiya" },
  ace: { n: "Ace" },
  kaltsit: { n: "Kal'tsit" },
  closure: { n: "Closure" },
  chen: { n: "Ch'en" },
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
};
const L = (s, t) => ({ s, t });
const W = (...list) => list.map(x => typeof x === "string" ? { e: x } : x);

const STORY = [{
  id: "ep1", title: "Embers of Chernobog", sub: "Episode 1",
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
          L("amiya", "Shieldguards. Their defense is high, so break it first. DEF Break makes everything hit harder."),
          L("doctor", "And Brand?"),
          L("amiya", "Brand makes them take more damage too. Stack both and they'll fold!") ] },
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
          L("narr", "End of Episode 1. Thank you for playing.") ] },
      ] },
  ],
}];
// Flatten for lookups. Stage codes follow Arknights: main stages 1-1…1-6, side stages S1-1.
const NODES = {};
for (const ep of STORY) ep.chapters.forEach((ch, ci) => {
  let mc = 0, sc = 0;
  ch.no = String(ci + 1).padStart(2, "0");
  ch.nodes.forEach((nd, i) => { nd.legacy = nd.id; nd.id = nd.type === "side" ? `S${ci + 1}-${++sc}` : `${ci + 1}-${++mc}`; nd.ch = ch; nd.ep = ep; nd.idx = i; NODES[nd.id] = nd; });
});
const nodeCost = nd => nd.type === "story" || nd.type === "chest" ? 0 : 6 + Math.floor(nd.lv / 10) * 2;
const nodeTurnGoal = nd => (nd.waves ? nd.waves.length : 1) * 9 + (nd.type === "boss" ? 4 : 0);

// =====================================================================
//  HUNTS · TOWER · ARENA · MISSIONS · SHOPS
// =====================================================================
const HUNTS = [
  { id: "slug", code: "SN", n: "Slug Nest", sub: "Originium Slug colony beneath Chernobog", env: "ruins", sets: ["Swift", "Energy", "Focus", "Will", "Endure"],
    waves: lv => [W("slug", "acidslug", "slug"), W("queenslug", "acidslug", "slug")] },
  { id: "crypt", code: "SC", n: "Sarkaz Catacombs", sub: "Mercenary warband in the old catacombs", env: "temple", sets: ["Fatal", "Blade", "Rage", "Violent", "Revenge"],
    waves: lv => [W("sarkaz", "caster", "sarkaz"), W("centurion", "sarkaz", "caster")] },
  { id: "frost", code: "FW", n: "Frozen Wastes", sub: "The Icecleaver's hunting ground", env: "snow", sets: ["Guard", "Shield", "Nemesis", "Despair", "Endure"],
    waves: lv => [W("wraith", "shield", "wraith"), W("yeti", "wraith", "shield")] },
];
const HUNT_LV = [10, 22, 34, 46, 58, 70];
const HUNT_COST = [8, 10, 12, 14, 16, 18];
const HUNT_RAR = [[.5, .4, .1, 0, 0], [.2, .45, .3, .05, 0], [0, .35, .45, .17, .03], [0, .15, .45, .32, .08], [0, 0, .35, .45, .2], [0, 0, .15, .5, .35]];

const TOWER_FLOORS = 30;
function towerFloor(f) {
  const lv = 4 + f * 3, rng = seeded(hash("tower" + f));
  const reunion = ["soldier", "crossbow", "caster", "thrower", "shield", "hound", "sarkaz", "wraith"];
  const bosses = ["crownslayer", "skullshatterer", "mephisto", "faust", "centurion", "frostnova"];
  const pickE = () => reunion[Math.floor(rng() * reunion.length)];
  let waves;
  if (f % 5 === 0) waves = [W(pickE(), pickE(), pickE()), W(bosses[(f / 5 - 1) % bosses.length], pickE(), pickE())];
  else if (f >= 8 && f % 2 === 0) {
    const pool = OP_KEYS.filter(k => OPS[k].rar >= 4);
    waves = [[0, 1, 2, 3].map(() => ({ op: pool[Math.floor(rng() * pool.length)] }))];
  } else waves = [W(pickE(), pickE(), pickE()), ...(f > 3 ? [W(pickE(), pickE(), pickE(), pickE())] : [])];
  const reward = f % 5 === 0 ? { orundum: 200, permit: 1, chip: 2 } : { orundum: 50, lmd: 1500 + f * 300, ["rec" + Math.min(4, 1 + Math.floor(f / 8))]: 3 };
  return { id: "T" + f, f, lv, waves, reward, env: ["city", "arena", "temple", "snow", "ruins", "slums"][Math.floor((f - 1) / 5)] };
}

const ARENA_N1 = ["Rhodes", "Lungmen", "Kazimierz", "Siracusa", "Ursus", "Laterano", "Iberia", "Columbia", "Kjerag", "Victoria", "Yan", "Higashi"];
const ARENA_N2 = ["Guard", "Courier", "Knight", "Hunter", "Ranger", "Doctor", "Blade", "Wolf", "Owl", "Lancer", "Sage", "Vanguard"];
const ARENA_MS = 10 * 60000, PAYOUT_MS = 6 * 3600000;

const DAILIES = [
  { id: "clear", n: "Clear 3 operations", goal: 3, reward: { orundum: 60, lmd: 2000, credit: 80 } },
  { id: "sanity", n: "Spend 60 Sanity", goal: 60, reward: { orundum: 60, credit: 40 } },
  { id: "hh", n: "Headhunt once", goal: 1, reward: { orundum: 80 } },
  { id: "upgrade", n: "Upgrade operators 3 times", goal: 3, reward: { rec2: 3 } },
  { id: "arena", n: "Win a Contingency Contract battle", goal: 1, reward: { tokens: 30, orundum: 40 } },
  { id: "rune", n: "Upgrade a module", goal: 1, reward: { lmd: 3000, credit: 40 } },
];
const DAILY_ALL = { permit: 1 };
const ACHIEVEMENTS = [
  ...STORY[0].chapters.map((c, i) => ({ id: "ch" + (i + 1), n: `Clear Episode ${String(i + 1).padStart(2, "0")}: ${c.title}`, test: () => chapterCleared(c), reward: i === 4 ? { orundum: 600, permit: 3 } : { orundum: 300 } })),
  { id: "ops10", n: "Recruit 10 operators", test: () => Object.keys(S.ops).length >= 10, reward: { orundum: 200 } },
  { id: "ops25", n: "Recruit 25 operators", test: () => Object.keys(S.ops).length >= 25, reward: { orundum: 400, permit: 1 } },
  { id: "ops50", n: "Recruit 50 operators", test: () => Object.keys(S.ops).length >= 50, reward: { orundum: 800, permit: 2 } },
  { id: "e1", n: "Promote an operator to Elite 1", test: () => Object.values(S.ops).some(p => p.elite >= 1), reward: { orundum: 150 } },
  { id: "e2", n: "Promote an operator to Elite 2", test: () => Object.values(S.ops).some(p => p.elite >= 2), reward: { orundum: 400, permit: 1 } },
  { id: "six", n: "Recruit a 6★ operator", test: () => Object.keys(S.ops).some(k => OPS[k].rar === 6), reward: { orundum: 300 } },
  { id: "tw10", n: "Clear Stationary Security Service floor 10", test: () => S.tower >= 10, reward: { orundum: 300, permit: 1 } },
  { id: "tw20", n: "Clear Stationary Security Service floor 20", test: () => S.tower >= 20, reward: { orundum: 500, permit: 2 } },
  { id: "tw30", n: "Clear all 30 Stationary Security Service floors", test: () => S.tower >= 30, reward: { orundum: 1000, permit: 3 } },
];
const SHOP = {
  credit: [
    { id: "r_lmd", n: "LMD ×12,000", cost: 200, give: { lmd: 12000 } },
    { id: "r_rec", n: "Strategic Battle Record ×3", cost: 240, give: { rec4: 3 } },
    { id: "r_summ", n: "Skill Summary ×3", cost: 160, give: { summ: 3 } },
    { id: "r_chip", n: "Chip Pack", cost: 300, give: { chip: 1 } },
  ],
  cert: [
    { id: "c_permit", n: "Headhunting Permit", cost: 25, give: { permit: 1 } },
    { id: "c_summ", n: "Skill Summary ×3", cost: 8, give: { summ: 3 } },
    { id: "c_chip", n: "Chip Pack ×2", cost: 12, give: { chip: 2 } },
    { id: "c_rune", n: "T4 Module", cost: 20, give: { rune: 4 } },
  ],
  tokens: [
    { id: "t_permit", n: "Headhunting Permit", cost: 240, give: { permit: 1 } },
    { id: "t_chip", n: "Chip Pack ×3", cost: 90, give: { chip: 3 } },
    { id: "t_summ", n: "Skill Summary ×4", cost: 60, give: { summ: 4 } },
    { id: "t_rune", n: "T5 Module", cost: 220, give: { rune: 5 } },
  ],
  prime: [
    { id: "p_san", n: "Restore Sanity", d: "Refill Sanity to max", cost: 1, give: { sanityMax: 1 } },
    { id: "p_oru", n: "Exchange for Orundum", d: "1 Originite Prime → 180 Orundum", cost: 1, give: { orundum: 180 } },
  ],
};
const STARTERS = ["amiya", "fang", "kroos", "melantha", "ansel"];
const BANNER_6 = ["exusiai", "silverash", "surtr", "saria", "ifrit", "skadi", "nightingale", "angelina", "ling", "mostima", "eyjafjalla", "hoshiguma", "mudrock", "suzuran", "mountain", "bagpipe", "ash", "thorns", "weedy", "ceobe", "siege"];
