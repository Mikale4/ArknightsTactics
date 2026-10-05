
// =====================================================================
//  JOURNEY — a retelling of Pokémon Red and Blue across Kanto: eight Gyms, Team Rocket, the Elite Four,
//  the Champion, and Cerulean Cave. Gym Leaders use their Red/Blue teams. Dialogue is original.
//  Node types: story · battle · side · chest · boss
//  Waves are lists of "species:level" (":12+" = Gym Leader strength, ":14!" = ace / boss).
// =====================================================================
const SPK = {
  narr: { n: "" },
  oak: { n: "Prof. Oak", t: "oak" }, blue: { n: "Blue", t: "blue" }, champ: { n: "Blue", t: "bluechampion" }, mom: { n: "Mom" },
  brock: { n: "Brock", t: "brock" }, misty: { n: "Misty", t: "misty" }, surge: { n: "Lt. Surge", t: "ltsurge" }, erika: { n: "Erika", t: "erika" },
  koga: { n: "Koga", t: "koga" }, sabrina: { n: "Sabrina", t: "sabrina" }, blaine: { n: "Blaine", t: "blaine" }, giovanni: { n: "Giovanni", t: "giovanni" },
  lorelei: { n: "Lorelei", t: "lorelei" }, bruno: { n: "Bruno", t: "bruno" }, agatha: { n: "Agatha", t: "agatha" }, lance: { n: "Lance", t: "lance" },
  grunt: { n: "Team Rocket Grunt", t: "teamrocketgruntm" }, gruntf: { n: "Team Rocket Grunt", t: "teamrocketgruntf" }, bill: { n: "Bill", t: "bill" },
  fuji: { n: "Mr. Fuji", t: "mrfuji" }, daisy: { n: "Daisy", t: "daisy" }, sci: { n: "Scientist", t: "scientist" }, bug: { n: "Bug Catcher", t: "bugcatcher" },
  hiker: { n: "Hiker", t: "hiker" }, jj: { n: "Jessie & James", t: "jessiejames" }, nurse: { n: "Nurse Joy", t: "nurse" }, me: { n: "", t: "me" },
};
const L = (s, t) => ({ s, t });
// "pidgey:4" → { op: "pidgey", LV: 4 }; "+" marks a Gym Leader's Pokémon, "!" the ace (a boss)
const W = (...list) => list.map(x => {
  const [op, rest = ""] = x.split(":"), LV = parseInt(rest, 10) || 0;
  return { op, LV, ...(rest.endsWith("!") ? { boss: 1, hpX: 1.8 } : rest.endsWith("+") ? { hpX: 1.15 } : {}) };
});
const TR = (name, spr, intro, lose, ball = "poke") => ({ name, spr, intro, lose, ball });
// Blue's team follows your starter: he always picks the one with the type advantage
const STARTERS = ["bulbasaur", "charmander", "squirtle"];
const RIVAL_OF = { bulbasaur: "charmander", charmander: "squirtle", squirtle: "bulbasaur" };
const RIVAL_LINE = { charmander: ["charmander", "charmeleon", "charizard"], squirtle: ["squirtle", "wartortle", "blastoise"], bulbasaur: ["bulbasaur", "ivysaur", "venusaur"] };
const rivalMon = st => RIVAL_LINE[RIVAL_OF[S.starter || "bulbasaur"]][st];
// the champion's last two depend on his starter (as in Red and Blue)
const champExtras = () => ({ charmander: ["exeggutor", "gyarados"], squirtle: ["arcanine", "exeggutor"], bulbasaur: ["gyarados", "arcanine"] }[RIVAL_OF[S.starter || "bulbasaur"]]);

const STORY = [{
  id: "kanto", title: "Kanto Journey", sub: "Pokémon League Challenge",
  blurb: "Leave Pallet Town with your first partner, earn all eight Gym Badges, stop Team Rocket, and challenge the Pokémon League.",
  chapters: [
    { id: "c1", title: "Pallet Town to Pewter City", env: "route", map: "route", badge: 0, reward: { lmd: 3000, orundum: 300 },
      nodes: [
        { id: "a", type: "story", name: "A World of Pokémon", starter: 1, pre: [
          L("oak", "Hello there! Welcome to the world of Pokémon! My name is Oak. People call me the Pokémon Prof."),
          L("oak", "This world is inhabited by creatures called Pokémon. Some people keep them as pets; others use them to battle. I study them."),
          L("blue", "Gramps! I'm fed up with waiting! You said you'd give me a Pokémon today!"),
          L("oak", "Patience, Blue. You'll get one too. First, our other young Trainer gets to choose. Go on, pick one of these three."),
        ], post: [
          L("blue", "Then I'll take this one! Hey, why don't we have a battle? Our Pokémon are raring to go!"),
        ] },
        { id: "b", type: "battle", name: "Rival in the Lab", lv: 5, env: "lab", trainer: TR("Blue", "blue", "I'll make my Pokémon fight! Smell ya later? Not yet!", "What? Unbelievable! I picked the wrong Pokémon!"),
          rivalWaves: () => [[{ op: rivalMon(0), LV: 4, moves: { charmander: ["scratch", "growl"], squirtle: ["tackle", "tailwhip"], bulbasaur: ["tackle", "growl"] }[rivalMon(0)] }]], pre: [
          L("oak", "A battle between friends! Remember: Fire beats Grass, Grass beats Water, and Water beats Fire. Tap your opponent to aim, then choose a move."),
        ], post: [
          L("blue", "Okay! I'll make my Pokémon battle to toughen it up! Gramps, see ya!"),
          L("oak", "Well done. The bond between Trainer and Pokémon grows with every battle."),
        ] },
        { id: "c", type: "battle", name: "Route 1", lv: 3, env: "route", wild: 1, catch: "pidgey", waves: [W("pidgey:3", "rattata:3")], pre: [
          L("narr", "Tall grass rustles on Route 1. Wild Pokémon live here; Trainers who walk the grass meet them."),
          L("oak", "Weaken a wild Pokémon and you can catch it. Take these Poké Balls!"),
        ], post: [L("narr", "Gotcha! The wild Pidgey was caught!")] },
        { id: "d", type: "chest", name: "Oak's Parcel", reward: { lmd: 1500, rec1: 6, permit: 3 }, pre: [
          L("oak", "You brought my Parcel from the Viridian Poké Mart? Thank you! Ah, my custom Poké Balls."),
          L("oak", "Here is a Pokédex. It records every Pokémon you see and catch. Completing it is my dream! And take a few Safari Balls; the Safari Zone near Fuchsia City is open to visitors."),
        ] },
        { id: "e", type: "battle", name: "Viridian Forest", lv: 6, env: "forest", trainer: TR("Bug Catcher Rick", "bugcatcher", "Hey! You have Pokémon! Come on! Let's battle 'em!", "No! Caterpie can't cut it!"),
          waves: [W("caterpie:6", "weedle:6"), W("metapod:7", "kakuna:7")], pre: [
          L("bug", "Bug Pokémon evolve quickly! Caterpie becomes Metapod and then Butterfree. Did you know?"),
        ] },
        { id: "f", type: "side", name: "Spark in the Forest", lv: 7, env: "forest", wild: 1, catch: "pikachu", waves: [W("pikachu:7!")], pre: [
          L("narr", "Something yellow darts between the trees, crackling with electricity."),
        ], post: [L("narr", "Gotcha! Pikachu was caught! It eyes its Poké Ball suspiciously, but stays by your side.")] },
        { id: "g", type: "battle", name: "Pewter Gym: Camper Liam", lv: 10, env: "gym", trainer: TR("Camper Liam", "camper", "Stop right there! You're light-years from facing Brock!", "Darn! Light-years isn't time... it measures distance!"),
          waves: [W("geodude:10", "sandshrew:11")], pre: [] },
        { id: "h", type: "boss", name: "Brock, the Rock-Solid Leader", lv: 13, env: "gym", badgeWin: 0,
          trainer: TR("Leader Brock", "brock", "I believe in rock-hard defense and determination. Show me your best!", "I took you for granted. As proof of your victory, here's the Boulder Badge!"),
          waves: [W("geodude:12+", "onix:14!")], pre: [
          L("brock", "So, you're here. I'm Brock, Pewter's Gym Leader. My rock-hard willpower is evident even in my Pokémon."),
          L("brock", "Rock-type Pokémon shrug off Normal and Flying moves. Water and Grass, though... we'll see what you brought."),
        ], post: [
          L("brock", "The Boulder Badge raises the Attack of your Pokémon. And with one Badge, they'll grow stronger for you: up to Lv 22."),
          L("narr", "The Boulder Badge glints in your Trainer Case. Seven more to go."),
        ] },
      ] },
    { id: "c2", title: "Mt. Moon to Cerulean City", env: "cave", map: "cave", badge: 1, reward: { lmd: 4000, orundum: 300, moonstone: 1 },
      nodes: [
        { id: "a", type: "story", name: "Into Mt. Moon", pre: [
          L("narr", "Mt. Moon. Meteorites fell here long ago, and the cave is said to be home to rare Pokémon."),
          L("hiker", "Watch your step! Zubat swarm in the dark, and the Geodude look just like rocks."),
          L("narr", "Deeper in, men in black uniforms marked with a red R are digging through the rock."),
        ] },
        { id: "b", type: "battle", name: "Mt. Moon B1F", lv: 9, env: "cave", wild: 1, catch: "zubat", waves: [W("zubat:9", "geodude:9", "paras:10")] },
        { id: "c", type: "battle", name: "Team Rocket in the Cave", lv: 12, env: "cave", trainer: TR("Team Rocket Grunt", "teamrocketgruntm", "We're pulling a big job here! Get lost, kid!", "Darn it all! I'm telling the boss!"),
          waves: [W("rattata:12", "zubat:12"), W("ekans:13", "sandshrew:12")], pre: [
          L("grunt", "Team Rocket will find the fossils revived from Mt. Moon's meteorites! They're worth a fortune!"),
        ] },
        { id: "d", type: "side", name: "Clefairy Under the Moon", lv: 12, env: "cave", wild: 1, catch: "clefairy", waves: [W("clefairy:11", "clefairy:12!")], pre: [
          L("narr", "In a hidden chamber, a ring of Clefairy dances around a glowing stone. They notice you."),
        ], post: [L("narr", "Gotcha! A Clefairy was caught! The others scatter, leaving a Moon Stone behind.")] },
        { id: "e", type: "battle", name: "Super Nerd Miguel", lv: 12, env: "cave", trainer: TR("Super Nerd Miguel", "supernerd", "Hey, stop! I found these fossils! They're both mine!", "Okay! I'll share! Take one!"),
          waves: [W("grimer:12", "voltorb:12", "koffing:12")] },
        { id: "f", type: "battle", name: "Nugget Bridge", lv: 17, env: "route", trainer: TR("Blue", "blue", "Yo! You're still struggling along back here?", "Hey! Take it easy! You won already!"),
          rivalWaves: () => [W("pidgeotto:17", "abra:16"), W("rattata:15", rivalMon(0) + ":18")], pre: [
          L("blue", "I caught a whole bunch of Pokémon on the way here. Let me show you how strong they are!"),
        ], post: [L("blue", "Hmph! At least you're raising your Pokémon. I'm off to see Bill. Smell ya later!")] },
        { id: "g", type: "battle", name: "Cerulean Gym: Swimmer Luis", lv: 16, env: "sea", weather: "rain", trainer: TR("Swimmer Luis", "swimmerm", "Splash! I'm first up! Let's do it!", "That can't be! I lost!"),
          waves: [W("horsea:16", "shellder:16")] },
        { id: "h", type: "boss", name: "Misty, the Tomboyish Mermaid", lv: 20, env: "sea", weather: "rain", badgeWin: 1,
          trainer: TR("Leader Misty", "misty", "My policy is an all-out offensive with Water-type Pokémon!", "Wow! You're too much! All right, you can have the Cascade Badge.", "great"),
          waves: [W("staryu:18+", "starmie:21!")], pre: [
          L("misty", "Hi, you're a new face! What's your policy on Pokémon? Mine is all-out offense with Water types!"),
          L("narr", "It's raining in the Cerulean Gym. Water-type moves are 50% stronger, and Fire-type moves are weaker."),
        ], post: [L("misty", "The Cascade Badge raises your Pokémon's Sp. Def, and they'll follow you up to Lv 26. Now go! I've got training to do.")] },
      ] },
    { id: "c3", title: "Vermilion City", env: "city", map: "city", badge: 2, reward: { lmd: 5000, orundum: 300, thunderstone: 1 },
      nodes: [
        { id: "a", type: "story", name: "The Pokémaniac's Cottage", pre: [
          L("bill", "Hiya! I'm a Pokémon... No, I'm not! Call me Bill! I'm a true Pokémaniac!"),
          L("bill", "I fused myself with a Pokémon by accident. Help me run the Cell Separation System, would you?"),
          L("narr", "With a whir, Bill steps out of the teleporter, human again."),
          L("bill", "Thanks! Here, take this S.S. Anne ticket. The cruise ship is in Vermilion City; there are Trainers aboard from all over."),
        ] },
        { id: "b", type: "battle", name: "Route 6", lv: 15, env: "route", wild: 1, catch: "meowth", waves: [W("oddish:15", "bellsprout:15"), W("meowth:16", "pidgey:15")] },
        { id: "c", type: "battle", name: "S.S. Anne: Gentleman", lv: 18, env: "sea", trainer: TR("Gentleman Brooks", "gentleman", "Competing against the young keeps me youthful.", "Good fight. Ah, I feel young again!"),
          waves: [W("growlithe:18", "ponyta:18")] },
        { id: "d", type: "battle", name: "S.S. Anne: Rival", lv: 19, env: "sea", trainer: TR("Blue", "blue", "Bonjour! Are you surprised to see me here?", "Humph! At least you're raising your Pokémon!"),
          rivalWaves: () => [W("pidgeotto:19", "raticate:16"), W("kadabra:18", rivalMon(1) + ":20")], pre: [
          L("blue", "I got an invitation too. Let me check out your Pokémon! I'll show you what a real Trainer does!"),
        ] },
        { id: "e", type: "side", name: "Diglett's Cave", lv: 19, env: "cave", wild: 1, catch: "diglett", waves: [W("diglett:18", "diglett:18"), W("dugtrio:22!")] },
        { id: "f", type: "battle", name: "Vermilion Gym: Sailor Dwayne", lv: 21, env: "plant", trainer: TR("Sailor Dwayne", "sailor", "This is no place for kids! Prepare to be shocked!", "You're not so bad, kid."),
          waves: [W("pikachu:21", "pikachu:21")] },
        { id: "g", type: "boss", name: "Lt. Surge, the Lightning American", lv: 23, env: "plant", badgeWin: 2,
          trainer: TR("Leader Lt. Surge", "ltsurge", "Hey, kid! Electric Pokémon saved me during the war! They'll zap you, just like my enemies!", "Whoa! You're the real deal, kid! Fine then, take the Thunder Badge!", "great"),
          waves: [W("voltorb:21+", "pikachu:18+", "raichu:24!")], pre: [
          L("surge", "Hey, kid! What do you think you're doing here? Ground types don't feel a thing from my Electric attacks, but do you even have one?"),
        ], post: [L("surge", "The Thunder Badge raises your Pokémon's Defense. And they'll listen to you up to Lv 32!")] },
      ] },
    { id: "c4", title: "Rock Tunnel to Celadon City", env: "city", map: "city", badge: 3, reward: { lmd: 6000, orundum: 400, leafstone: 1 },
      nodes: [
        { id: "a", type: "story", name: "Rock Tunnel", pre: [
          L("narr", "Rock Tunnel is pitch-black. Without Flash, Trainers feel their way along the walls."),
          L("hiker", "Ooh, you sure startled me! You've got Pokémon? Then you know the rules!"),
        ] },
        { id: "b", type: "battle", name: "Rock Tunnel", lv: 21, env: "cave", wild: 1, catch: "machop", waves: [W("geodude:20", "zubat:20"), W("machop:21", "onix:22")] },
        { id: "c", type: "chest", name: "Celadon Mansion", reward: { op: "eevee", lmd: 2000 }, pre: [
          L("narr", "On the top floor of Celadon Mansion, a Poké Ball rests on a table with a note: 'Take good care of me.'"),
          L("narr", "Inside is an Eevee. Its genes are unstable: an evolution stone can turn it into Vaporeon, Jolteon or Flareon."),
        ] },
        { id: "d", type: "battle", name: "Rocket Game Corner", lv: 23, env: "city", trainer: TR("Team Rocket Grunt", "teamrocketgruntm", "I'm guarding this poster! Go away, or else!", "Dang! Our hideout might be discovered!"),
          waves: [W("raticate:22", "zubat:22"), W("koffing:23", "grimer:23")], pre: [
          L("grunt", "There's no hideout behind this poster. Definitely not. Now beat it!"),
        ] },
        { id: "dj", type: "side", name: "Prepare for Trouble", lv: 25, env: "city", trainer: TR("Jessie & James", "jessiejames", "Prepare for trouble! And make it double!", "Looks like Team Rocket's blasting off again!"),
          waves: [W("ekans:24", "koffing:24"), W("meowth:26!")], pre: [
          L("jj", "Prepare for trouble! And make it double!"),
          L("jj", "We're the Team Rocket duo who'll take every rare Pokémon in Celadon! And that Pikachu-looking thing too, while we're at it!"),
          L("narr", "Meowth hops down from a balloon basket, claws out."),
        ], post: [L("jj", "Looks like Team Rocket's blasting off again!"), L("narr", "A twinkle in the sky over Celadon City. They dropped a few things on the way up.")] },
        { id: "e", type: "boss", name: "Giovanni's Hideout", lv: 26, env: "plant", trainer: TR("Giovanni", "giovanni", "So! I must say, I am impressed you got here!", "WHAT! This can't be!"),
          waves: [W("onix:25+", "rhyhorn:24+", "kangaskhan:29!")], pre: [
          L("giovanni", "Team Rocket captures Pokémon from around the world. They're important tools for keeping our criminal enterprise going."),
          L("giovanni", "I will not tolerate you meddling in my plans. You shall now experience pain!"),
        ], post: [L("giovanni", "I see that you raise Pokémon with utmost care. I shall return to my training. Keep the Silph Scope."), L("narr", "Giovanni leaves behind the Silph Scope. It can see through the ghosts of Lavender Town.")] },
        { id: "f", type: "battle", name: "Celadon Gym: Lass & Beauty", lv: 24, env: "forest", weather: "sun", trainer: TR("Beauty Tamia", "beauty", "Welcome to the Celadon Gym. Mind the flowers!", "Oh! I'm so sorry for my rudeness!"),
          waves: [W("bellsprout:23", "oddish:23"), W("exeggcute:24", "weepinbell:24")] },
        { id: "g", type: "boss", name: "Erika, the Nature-Loving Princess", lv: 27, env: "forest", badgeWin: 3,
          trainer: TR("Leader Erika", "erika", "I am Erika, Leader of Celadon Gym. I teach the art of flower arranging. My Pokémon are of the Grass type.", "Oh! I concede defeat. You are remarkably strong. I must confer upon you the Rainbow Badge.", "great"),
          waves: [W("victreebel:29+", "tangela:24+", "vileplume:29!")], pre: [
          L("erika", "Hello. Lovely weather, isn't it? It's so pleasant in my greenhouse. Oh, dear... I must have dozed off."),
          L("narr", "Every Pokémon in Erika's greenhouse knows how to put its opponents to sleep. Grass types shrug off Water, Electric and Ground moves."),
        ], post: [L("erika", "The Rainbow Badge raises your Pokémon's Sp. Atk, and they'll follow you up to Lv 44.")] },
      ] },
    { id: "c5", title: "Lavender Town to Fuchsia City", env: "tower", map: "tower", badge: 4, reward: { lmd: 7000, orundum: 400 },
      nodes: [
        { id: "a", type: "story", name: "The Pokémon Tower", pre: [
          L("narr", "Lavender Town. The Pokémon Tower is a resting place for Pokémon that have passed on."),
          L("fuji", "Team Rocket killed a Marowak trying to protect its child. Its spirit cannot rest. And now they hold me prisoner here..."),
          L("narr", "Through the Silph Scope, the shadowy ghosts on the tower stairs take shape."),
        ] },
        { id: "b", type: "battle", name: "Tower Channelers", lv: 25, env: "tower", trainer: TR("Channeler Hope", "channeler", "Be gone... Intruders...", "Wha? Where am I?"),
          waves: [W("gastly:24", "gastly:24"), W("haunter:26", "cubone:25")], pre: [
          L("narr", "Ghost types shrug off Normal and Fighting moves completely. Psychic and Ghost moves hit them hard."),
        ] },
        { id: "c", type: "boss", name: "The Restless Soul", lv: 30, env: "tower", wild: 1, waves: [W("marowak:30!")], pre: [
          L("narr", "Be gone... Be gone..."),
          L("narr", "The ghost is Cubone's mother, Marowak. Calm its spirit so it can rest."),
        ], post: [L("narr", "The Marowak's spirit is calmed. It fades away peacefully."), L("fuji", "Thank you. Take this Poké Flute; its tune can wake even the deepest sleeper.")] },
        { id: "d", type: "side", name: "Snorlax Blocks the Way", lv: 30, env: "route", wild: 1, catch: "snorlax", waves: [W("snorlax:30!")], pre: [
          L("narr", "A sleeping Pokémon blocks the road. It doesn't budge. You play the Poké Flute..."),
          L("narr", "Snorlax woke up! It attacked in a grumpy rage!"),
        ], post: [L("narr", "Gotcha! Snorlax was caught! It went straight back to sleep in its Poké Ball.")] },
        { id: "e", type: "battle", name: "Cycling Road", lv: 29, env: "route", trainer: TR("Biker Jared", "biker", "We're the toughest bikers on Cycling Road!", "Whoa! You're the real deal!"),
          waves: [W("koffing:28", "grimer:28"), W("weezing:29", "muk:29")] },
        { id: "f", type: "chest", name: "The Safari Zone Warden", reward: { permit: 5, rec2: 4, lmd: 3000 }, pre: [
          L("narr", "The Safari Zone Warden lost his gold teeth somewhere in the park. You find them in the grass."),
          L("narr", "Warden: Thank you! Here, have some Safari Balls on the house. Rare Pokémon live in my park: Chansey, Kangaskhan, Tauros, Scyther and more."),
        ] },
        { id: "g", type: "battle", name: "Fuchsia Gym: Jugglers", lv: 33, env: "gym", trainer: TR("Juggler Nate", "juggler", "Strength isn't the key for Pokémon. It's strategy!", "Hm? Strategy isn't everything?"),
          waves: [W("drowzee:31", "kadabra:31"), W("hypno:33", "drowzee:33")] },
        { id: "h", type: "boss", name: "Koga, the Poisonous Ninja Master", lv: 39, env: "gym", badgeWin: 4,
          trainer: TR("Leader Koga", "koga", "Fwahahaha! A mere child like you dares to challenge me?", "Humph! You have proven your worth! Here, take the Soul Badge.", "ultra"),
          waves: [W("koffing:37+", "muk:39+"), W("koffing:37+", "weezing:43!")], pre: [
          L("koga", "I shall show you true terror as a ninja master! You shall feel the despair of poison and sleep techniques!"),
        ], post: [L("koga", "The Soul Badge raises your Pokémon's Speed, and they'll obey you up to Lv 47.")] },
      ] },
    { id: "c6", title: "Saffron City", env: "city", map: "city", badge: 5, reward: { lmd: 8000, orundum: 500, linkcord: 1 },
      nodes: [
        { id: "a", type: "story", name: "Silph Co. Takeover", pre: [
          L("narr", "Team Rocket has taken over Silph Co., the company that makes Poké Balls. They want its newest invention: the Master Ball."),
          L("sci", "Please, help us! They've locked down every floor!"),
        ] },
        { id: "b", type: "battle", name: "Silph Co. Labs", lv: 33, env: "plant", trainer: TR("Scientist Ted", "scientist", "Electricity! It's our future!", "My calculations were off!"),
          waves: [W("magnemite:33", "voltorb:33"), W("magneton:35", "electrode:35")] },
        { id: "c", type: "chest", name: "Lapras on 7F", reward: { op: "lapras", lmd: 2000 }, pre: [
          L("sci", "Oh, thank you! Team Rocket was going to take this Pokémon. Please, it should be with someone like you. It's a Lapras."),
        ] },
        { id: "d", type: "battle", name: "Silph Co.: Rival", lv: 37, env: "plant", trainer: TR("Blue", "blue", "What kept you? Let's see what you're made of!", "Hah! I was just testing you."),
          rivalWaves: () => [W("pidgeot:37", "alakazam:35"), W("growlithe:38", rivalMon(1) + ":40")], pre: [
          L("blue", "Hah! I knew you'd show up. I'm going to beat you, then the boss!"),
        ] },
        { id: "e", type: "boss", name: "Giovanni at Silph Co.", lv: 40, env: "plant", trainer: TR("Giovanni", "giovanni", "Ah, you again. It seems you have the gift. Too bad it will be wasted.", "Arrgh! I lost again!?"),
          waves: [W("nidorino:37+", "kangaskhan:35+"), W("rhyhorn:37+", "nidoqueen:41!")], pre: [
          L("giovanni", "The president of Silph and I are discussing a business proposal. A child has no place here."),
        ], post: [L("giovanni", "Blast it all! You ruined our plans for Silph! But Team Rocket will never fall!"), L("sci", "You saved us! Please, take this Master Ball prototype... oh, it seems Team Rocket broke it. Here's a Linking Cord instead.")] },
        { id: "f", type: "side", name: "The Fighting Dojo", lv: 36, env: "gym", gift: "hitmonlee", trainer: TR("Karate Master Koichi", "blackbelt", "Hwaah! You're the one who wants to take on our dojo?", "Hwa! Arrgh! Beaten! As a reward, take one of our prized fighters."),
          waves: [W("mankey:32", "machop:32"), W("primeape:34", "machoke:36!")], post: [L("narr", "The Karate Master gives you Hitmonlee, the Kicking Pokémon.")] },
        { id: "g", type: "battle", name: "Saffron Gym: Psychics", lv: 36, env: "tower", trainer: TR("Psychic Johan", "psychic", "You know that power too!", "I knew it would end like this!"),
          waves: [W("slowpoke:34", "kadabra:34"), W("slowbro:37", "mrmime:36")] },
        { id: "h", type: "boss", name: "Sabrina, the Master of Psychic Pokémon", lv: 40, env: "tower", badgeWin: 5,
          trainer: TR("Leader Sabrina", "sabrina", "I had a vision of your arrival! I have had psychic powers since I was a child.", "This loss shocks me! But a loss is a loss. Take the Marsh Badge.", "ultra"),
          waves: [W("kadabra:38+", "mrmime:37+"), W("venomoth:38+", "alakazam:43!")], pre: [
          L("sabrina", "I dislike fighting, but if you wish, I will show you my powers!"),
          L("narr", "Psychic types are only weak to Bug and Ghost moves. Dark types don't exist in Kanto yet."),
        ], post: [L("sabrina", "The Marsh Badge makes your Pokémon's Sp. Atk even stronger, and they'll obey up to Lv 52.")] },
      ] },
    { id: "c7", title: "Cinnabar Island", env: "sea", map: "sea", badge: 6, reward: { op: "aerodactyl", lmd: 9000, orundum: 500, firestone: 1 },
      nodes: [
        { id: "a", type: "story", name: "Seafoam Islands", pre: [
          L("narr", "You surf south from Fuchsia. The Seafoam Islands are a frozen maze of caves, and something powerful sleeps in their depths."),
        ] },
        { id: "b", type: "battle", name: "Seafoam Caves", lv: 38, env: "ice", weather: "hail", wild: 1, catch: "seel", waves: [W("seel:38", "slowpoke:37"), W("shellder:38", "psyduck:38")], pre: [
          L("narr", "Hail falls inside the caves. Every Pokémon that isn't an Ice type loses a little HP each turn."),
        ] },
        { id: "c", type: "side", name: "Articuno", lv: 50, env: "ice", weather: "hail", wild: 1, catch: "articuno", waves: [W("articuno:50!")], pre: [
          L("narr", "A bird of legend spreads wings of ice. The air freezes around Articuno."),
        ], post: [L("narr", "Gotcha! Articuno was caught!")] },
        { id: "d", type: "battle", name: "Pokémon Mansion", lv: 39, env: "volcano", wild: 1, catch: "growlithe", waves: [W("growlithe:37", "ponyta:38", "koffing:38"), W("grimer:38", "magmar:40")], pre: [
          L("narr", "A diary in the burnt mansion: 'July 5. We named the newly discovered Pokémon Mew.' ... 'Feb. 6. Mew gave birth. We named the newborn Mewtwo.'"),
        ] },
        { id: "e", type: "chest", name: "The Fossil Lab", reward: { op: "omanyte", lmd: 3000 }, pre: [
          L("sci", "Ah, you have a fossil from Mt. Moon! Leave it with me... There! A Pokémon that lived in ancient seas: Omanyte!"),
          L("sci", "And the Old Amber from Pewter Museum holds the DNA of an ancient flying Pokémon. I'll have that ready when you've earned the Volcano Badge."),
        ] },
        { id: "f", type: "battle", name: "Cinnabar Gym: Super Nerds", lv: 38, env: "volcano", weather: "sun", trainer: TR("Super Nerd Erik", "supernerd", "Do you know how hot Pokémon fire breath can get?", "Yow! Hot, hot, hot!"),
          waves: [W("vulpix:36", "growlithe:36"), W("ninetales:38", "ponyta:40")] },
        { id: "g", type: "boss", name: "Blaine, the Hotheaded Quiz Master", lv: 44, env: "volcano", weather: "sun", badgeWin: 6,
          trainer: TR("Leader Blaine", "blaine", "Hah! I am Blaine! I am the Leader of Cinnabar Gym! My fiery Pokémon will incinerate all challengers!", "I have burned down to nothing! Not even ashes remain! You have earned the Volcano Badge!", "ultra"),
          waves: [W("growlithe:42+", "ponyta:40+"), W("rapidash:42+", "arcanine:47!")], pre: [
          L("blaine", "Hah! You better have Burn Heal! The sun burns hot in my Gym: Water moves are weaker here."),
        ], post: [L("blaine", "The Volcano Badge heightens the Attack of your Pokémon, and they'll obey you up to Lv 56."), L("sci", "And here is your Aerodactyl, revived from the Old Amber!")] },
      ] },
    { id: "c8", title: "Viridian City", env: "route", map: "route", badge: 7, reward: { lmd: 10000, orundum: 600 },
      nodes: [
        { id: "a", type: "story", name: "The Last Gym", pre: [
          L("narr", "The Viridian Gym, closed since your journey began, has finally opened its doors. Its Leader has returned."),
        ] },
        { id: "b", type: "side", name: "The Power Plant", lv: 42, env: "plant", wild: 1, catch: "zapdos", waves: [W("magnemite:40", "voltorb:40", "electabuzz:42"), W("zapdos:50!")], pre: [
          L("narr", "The abandoned Power Plant hums with static. Deep inside, a bird of legend crackles with lightning."),
        ], post: [L("narr", "Gotcha! Zapdos was caught!")] },
        { id: "c", type: "battle", name: "Viridian Gym: Cooltrainers", lv: 41, env: "gym", trainer: TR("Cooltrainer Samuel", "acetrainer", "The Viridian Leader is the strongest in Kanto!", "You're stronger than the Leader thinks!"),
          waves: [W("nidorino:39", "nidorina:39"), W("rhyhorn:41", "dugtrio:40")] },
        { id: "d", type: "battle", name: "Route 22: Rival", lv: 47, env: "route", trainer: TR("Blue", "blue", "Hey! I've been looking for you! I already beat every Gym!", "What!? I don't believe it!"),
          rivalWaves: () => [W("pidgeot:47", "rhyhorn:45", champExtras()[0].replace(/gyarados|arcanine|exeggutor/, m => ({ gyarados: "magikarp", arcanine: "growlithe", exeggutor: "exeggcute" }[m])) + ":45"), W("alakazam:47", rivalMon(2) + ":53")], pre: [
          L("blue", "I'm heading for the Pokémon League. Before that, I'll show you what a real Trainer looks like!"),
        ] },
        { id: "e", type: "boss", name: "Giovanni, Leader of Viridian Gym", lv: 48, env: "gym", badgeWin: 7,
          trainer: TR("Leader Giovanni", "giovanni", "Fwahahaha! This is my hideout! I am the leader of Team Rocket, and the Viridian Gym Leader!", "Ha! That was a truly intense fight! You have won! As proof, here is the Earth Badge!", "ultra"),
          waves: [W("rhyhorn:45+", "dugtrio:42+", "nidoqueen:44+"), W("nidoking:45+", "rhydon:50!")], pre: [
          L("giovanni", "For our third meeting, I shall battle you with everything I have. Show me the strength that defeated Team Rocket!"),
        ], post: [L("giovanni", "Having lost, I cannot face my underlings. Team Rocket is finished forever. I will dedicate my life to the study of Pokémon."), L("narr", "The Earth Badge! All eight Badges are yours. Your Pokémon will obey you up to Lv 70. The Pokémon League awaits.")] },
      ] },
    { id: "c9", title: "The Pokémon League", env: "plateau", map: "plateau", badge: 8, reward: { lmd: 20000, orundum: 1500, permit: 10 },
      nodes: [
        { id: "a", type: "story", name: "Victory Road", pre: [
          L("narr", "Victory Road: a long cave where only Trainers with all eight Badges may pass. At its end stands the Indigo Plateau."),
        ] },
        { id: "b", type: "battle", name: "Victory Road", lv: 47, env: "cave", weather: "sand", wild: 1, catch: "machoke", waves: [W("machoke:46", "graveler:47"), W("golbat:46", "onix:47", "marowak:46")], pre: [
          L("narr", "A sandstorm blows through the cave. Rock, Ground and Steel aside, everyone takes a little damage each turn."),
        ] },
        { id: "c", type: "side", name: "Moltres", lv: 52, env: "volcano", weather: "sun", wild: 1, catch: "moltres", waves: [W("moltres:52!")], pre: [
          L("narr", "Flames light the deepest chamber of Victory Road. Moltres, the legendary bird of fire, guards the way."),
        ], post: [L("narr", "Gotcha! Moltres was caught!")] },
        { id: "d", type: "boss", name: "Elite Four Lorelei", lv: 55, env: "ice",
          trainer: TR("Elite Four Lorelei", "lorelei", "Welcome to the Pokémon League! I am Lorelei of the Elite Four! No one can best me when it comes to icy Pokémon!", "How dare you! ...You're better than I thought. Go on ahead.", "ultra"),
          waves: [W("dewgong:54", "cloyster:53", "slowbro:54"), W("jynx:56", "lapras:56!")], pre: [
          L("lorelei", "Freezing moves are powerful! Your Pokémon will be at my mercy when they are frozen solid!"),
        ] },
        { id: "e", type: "boss", name: "Elite Four Bruno", lv: 56, env: "gym",
          trainer: TR("Elite Four Bruno", "bruno", "I am Bruno of the Elite Four! Through rigorous training, people and Pokémon can become stronger!", "Why? How could I lose?", "ultra"),
          waves: [W("onix:53", "hitmonchan:55", "hitmonlee:55"), W("onix:56", "machamp:58!")], pre: [
          L("bruno", "We will grind you down with our superior power! Hoo hah!"),
        ] },
        { id: "f", type: "boss", name: "Elite Four Agatha", lv: 58, env: "tower",
          trainer: TR("Elite Four Agatha", "agatha", "I am Agatha of the Elite Four! Oak's taken a lot of interest in you, child.", "Oh, my! You're something special, child!", "ultra"),
          waves: [W("gengar:56", "golbat:56", "haunter:55"), W("arbok:58", "gengar:60!")], pre: [
          L("agatha", "That old duff was once tough and handsome. Now he wants to fiddle with his Pokédex! He's wrong. Pokémon are for fighting!"),
        ] },
        { id: "g", type: "boss", name: "Elite Four Lance", lv: 60, env: "plateau",
          trainer: TR("Elite Four Lance", "lance", "I lead the Elite Four. You can call me Lance the dragon Trainer.", "That's it! I hate to admit it, but you are a Pokémon master!", "ultra"),
          waves: [W("gyarados:58", "dragonair:56", "dragonair:56"), W("aerodactyl:60", "dragonite:62!")], pre: [
          L("lance", "Dragons are mystical Pokémon. They're hard to catch and raise, but their powers are superior! Ice is their one great weakness."),
        ] },
        { id: "h", type: "boss", name: "Champion Blue", lv: 63, env: "plateau", champion: 1,
          trainer: TR("Champion Blue", "bluechampion", "Hey! I was looking forward to seeing you here! I'm the most powerful Trainer in the world!", "NO! That can't be! You beat my best! After all that work to become League Champ? My reign is over already?", "ultra"),
          rivalWaves: () => [W("pidgeot:61", "alakazam:59", "rhydon:61"), W(champExtras()[0] + ":61", champExtras()[1] + ":63", rivalMon(2) + ":65!")], pre: [
          L("champ", "While working on my Pokédex, I looked all over for powerful Pokémon. I assembled teams that would beat any Pokémon type."),
          L("champ", "And now I'm the Pokémon League Champion! Do you know what that means? I'll tell you: I am the most powerful Trainer in the world!"),
        ], post: [
          L("oak", "Congratulations! You are the new Pokémon League Champion! You've grown up so much since you first left Pallet Town."),
          L("oak", "Blue... You lost because you forgot to treat your Pokémon with trust and love. Without them, you will never become a Champ again."),
          L("narr", "Your Pokémon are entered into the Hall of Fame. They will now obey you all the way to Lv 100."),
        ] },
      ] },
    { id: "c10", title: "Cerulean Cave", env: "cave", map: "cave", badge: 8, reward: { orundum: 2000, permit: 10, rec4: 5 },
      nodes: [
        { id: "a", type: "story", name: "The Unknown Dungeon", pre: [
          L("narr", "Now that you are Champion, the guard at Cerulean Cave lets you pass. Only the strongest Pokémon live inside."),
          L("narr", "The deeper you go, the colder the air feels. Something is waiting at the bottom."),
        ] },
        { id: "b", type: "battle", name: "Cerulean Cave 1F", lv: 60, env: "cave", wild: 1, catch: "ditto", waves: [W("ditto:58", "electrode:60", "wigglytuff:60"), W("parasect:60", "kadabra:62", "chansey:62")] },
        { id: "c", type: "battle", name: "Cerulean Cave B1F", lv: 59, env: "cave", wild: 1, waves: [W("raichu:58", "magneton:58", "rhydon:59"), W("marowak:59", "dodrio:60", "machoke:60")] },
        { id: "d", type: "boss", name: "Mewtwo", lv: 70, env: "cave", wild: 1, catch: "mewtwo", waves: [W("mewtwo:70!")], pre: [
          L("narr", "At the bottom of the cave, a Pokémon created by genetic manipulation opens its eyes. Its psychic power fills the chamber."),
          L("narr", "Mewtwo: ..."),
        ], post: [L("narr", "Gotcha! Mewtwo was caught!"), L("narr", "Your Pokédex hums. One entry is still missing: #151, Mew. Keep an eye on your Mystery Gifts.")] },
      ] },
  ],
}];
// Flatten for lookups. Stage codes: chapter-number-stage (1-1…), side stages S1-1.
const NODES = {};
for (const ep of STORY) ep.chapters.forEach((ch, ci) => {
  let mc = 0, sc = 0;
  ch.no = String(ci + 1);
  ch.nodes.forEach((nd, i) => { nd.id = nd.type === "side" ? `S${ci + 1}-${++sc}` : `${ci + 1}-${++mc}`; nd.ch = ch; nd.ep = ep; nd.idx = i; nd.env = nd.env || ch.env; NODES[nd.id] = nd; });
});
const nodeWaves = nd => nd.rivalWaves ? nd.rivalWaves() : nd.waves;
const nodeCost = nd => nd.type === "story" || nd.type === "chest" ? 0 : 5 + Math.floor((nd.lv || 1) / 10) * 2;
const nodeTurnGoal = nd => (nd.waves || nd.rivalWaves ? nodeWaves(nd).length : 1) * 9 + (nd.type === "boss" ? 4 : 0);

// =====================================================================
//  EXPLORE · BATTLE TOWER · LINK BATTLES · DAILY RESEARCH · SHOPS
// =====================================================================
// Explore: wild areas to farm evolution stones, Exp. Candy, Seeds of Mastery and held items
const HUNTS = [
  { id: "forest", code: "VF", n: "Viridian Forest", sub: "Grass and Bug Pokémon in the deep woods", env: "forest", stone: "leafstone",
    mobs: ["oddish", "bellsprout", "paras", "caterpie", "weedle", "exeggcute"], boss: ["vileplume", "victreebel", "parasect"], items: ["miracleseed", "silverpowder", "sitrusberry", "lumberry", "kingsrock"] },
  { id: "moon", code: "MM", n: "Mt. Moon", sub: "Where the Moon Stones fall", env: "cave", stone: "moonstone",
    mobs: ["zubat", "geodude", "paras", "clefairy", "sandshrew", "onix"], boss: ["clefable", "golem", "golbat"], items: ["hardstone", "softsand", "scopelens", "brightpowder", "focusband"] },
  { id: "plant", code: "PP", n: "Power Plant", sub: "Static in the air, and Thunder Stones on the floor", env: "plant", stone: "thunderstone",
    mobs: ["magnemite", "voltorb", "pikachu", "electabuzz", "grimer"], boss: ["electrode", "raichu", "magneton"], items: ["magnet", "quickclaw", "widelens", "shellbell", "expertbelt"] },
  { id: "seafoam", code: "SI", n: "Seafoam Islands", sub: "Frozen caves, falling hail", env: "ice", weather: "hail", stone: "waterstone",
    mobs: ["seel", "shellder", "psyduck", "slowpoke", "horsea", "krabby"], boss: ["dewgong", "cloyster", "slowbro"], items: ["mysticwater", "nevermeltice", "leftovers", "wiseglasses", "lumberry"] },
  { id: "mansion", code: "PM", n: "Pokémon Mansion", sub: "A burnt laboratory under a scorching sun", env: "volcano", weather: "sun", stone: "firestone",
    mobs: ["growlithe", "ponyta", "vulpix", "koffing", "grimer", "magmar"], boss: ["arcanine", "rapidash", "weezing"], items: ["charcoal", "poisonbarb", "muscleband", "eviolite", "lifeorb"] },
  { id: "victory", code: "VR", n: "Victory Road", sub: "A sandstorm and the toughest wild Pokémon", env: "cave", weather: "sand", stone: "linkcord",
    mobs: ["machop", "geodude", "onix", "marowak", "golbat", "kadabra"], boss: ["machamp", "golem", "alakazam"], items: ["blackbelt", "twistedspoon", "spelltag", "dragonfang", "choiceband"] },
];
const HUNT_LV = [12, 22, 32, 44, 56, 68];
const HUNT_COST = [8, 10, 12, 14, 16, 18];
const huntWavesSpec = (h, l) => {
  const lv = HUNT_LV[l - 1], rng = seeded(hash(h.id + l));
  const m = () => h.mobs[Math.floor(rng() * h.mobs.length)];
  return [W(`${m()}:${lv}`, `${m()}:${lv}`, `${m()}:${lv}`), W(`${m()}:${lv}`, `${h.boss[Math.min(h.boss.length - 1, Math.floor((l - 1) / 2))]}:${lv + 3}!`)];
};

// Battle Tower: 30 floors of Trainers; every fifth floor a famous Trainer
const TOWER_FLOORS = 30;
const TOWER_BOSS = [["Brock", "brock", ["geodude", "onix", "graveler", "golem"]], ["Misty", "misty", ["staryu", "psyduck", "starmie", "golduck"]], ["Lt. Surge", "ltsurge", ["voltorb", "magneton", "electrode", "raichu"]],
  ["Erika", "erika", ["tangela", "weepinbell", "victreebel", "vileplume"]], ["Koga", "koga", ["koffing", "muk", "venomoth", "weezing"]], ["Sabrina", "sabrina", ["kadabra", "mrmime", "hypno", "alakazam"]]];
const TOWER_CLS = [["Ace Trainer", "acetrainer"], ["Ace Trainer", "acetrainerf"], ["Psychic", "psychic"], ["Psychic", "psychicf"], ["Black Belt", "blackbelt"], ["Battle Girl", "battlegirl"],
  ["Bird Keeper", "birdkeeper"], ["Beauty", "beauty"], ["Gentleman", "gentleman"], ["Lady", "lady"], ["Hiker", "hiker"], ["Tamer", "tamer"], ["Rocker", "rocker"], ["Guitarist", "guitarist"],
  ["Dragon Tamer", "dragontamer"], ["Expert", "expert"], ["Kindler", "kindler"], ["Ninja Boy", "ninjaboy"], ["Hex Maniac", "hexmaniac"], ["Ruin Maniac", "ruinmaniac"], ["Pokémon Ranger", "pokemonranger"],
  ["Pokémon Breeder", "pokemonbreeder"], ["Collector", "collector"], ["Rich Boy", "richboy"], ["Parasol Lady", "parasollady"], ["Painter", "painter"], ["Aroma Lady", "aromalady"], ["Gamer", "gamer"]];
function towerFloor(f) {
  const lv = 8 + f * 2, rng = seeded(hash("tower" + f));
  const pool = fieldable(lv, true);
  let waves, trainer;
  if (f % 5 === 0) {
    const [n, spr, team] = TOWER_BOSS[(f / 5 - 1) % TOWER_BOSS.length];
    trainer = TR(n, spr, "So you climbed this high. Let's see how far you get!", "Well fought. The next floor is yours.", "ultra");
    waves = [W(`${team[0]}:${lv}+`, `${team[1]}:${lv}+`), W(`${team[2]}:${lv + 1}+`, `${team[3]}:${lv + 3}!`)];
  } else {
    const [cls, spr] = TOWER_CLS[Math.floor(rng() * TOWER_CLS.length)];
    trainer = TR(cls + " " + ARENA_N1[Math.floor(rng() * ARENA_N1.length)], spr, "", "");
    const p = () => pool[Math.floor(rng() * pool.length)] + ":" + lv;
    waves = f > 3 ? [W(p(), p(), p()), W(p(), p(), p())] : [W(p(), p(), p())];
  }
  const reward = f % 5 === 0 ? { orundum: 200, permit: 1, rare: 2 } : { orundum: 50, lmd: 1500 + f * 300, ["rec" + Math.min(4, 1 + Math.floor(f / 8))]: 3 };
  return { id: "T" + f, f, lv, waves, reward, trainer, env: ["gym", "plateau", "city", "gym", "tower", "plateau"][Math.floor((f - 1) / 5)] };
}

// Link Battles: Trainers from around Kanto
const ARENA_N1 = ["Ash", "Gary", "May", "Dawn", "Cilan", "Iris", "Serena", "Clemont", "Hau", "Lillie", "Hop", "Marnie", "Nemona", "Arven", "Penny", "Wally", "Barry", "Bianca", "Cheren", "Shauna", "Tierno", "Bede", "Kieran", "Carmine"];
const ARENA_CLS = [["Ace Trainer", "acetrainer"], ["Ace Trainer", "acetrainerf"], ["Pokémon Breeder", "pokemonbreeder"], ["Pokémon Ranger", "pokemonranger"], ["Psychic", "psychicf"], ["Black Belt", "blackbelt"],
  ["Battle Girl", "battlegirl"], ["Bird Keeper", "birdkeeper"], ["Swimmer", "swimmerf"], ["Hiker", "hiker"], ["Juggler", "juggler"], ["Rocker", "rocker"], ["Pokéfan", "pokefan"], ["School Kid", "schoolkid"],
  ["Twins", "twins"], ["Tuber", "tuber"], ["Dragon Tamer", "dragontamer"], ["Gamer", "gamer"], ["Hex Maniac", "hexmaniac"], ["Collector", "collector"]];
const ARENA_MS = 10 * 60000, PAYOUT_MS = 6 * 3600000;

// Daily Research (resets every day)
const DAILIES = [
  { id: "clear", n: "Win 3 battles", goal: 3, reward: { orundum: 60, lmd: 2000 } },
  { id: "sanity", n: "Use 60 PP", goal: 60, reward: { orundum: 60, rec1: 3 } },
  { id: "hh", n: "Catch a Pokémon in the Safari Zone", goal: 1, reward: { orundum: 80 } },
  { id: "upgrade", n: "Train, evolve or master moves 3 times", goal: 3, reward: { rec2: 3 } },
  { id: "arena", n: "Win a Link Battle", goal: 1, reward: { tokens: 30, orundum: 40 } },
  { id: "rune", n: "Land 10 super-effective hits", goal: 10, reward: { lmd: 3000, summ: 1 } },
];
const DAILY_ALL = { permit: 1 };
// Shops: currency per tab
const SHOP = {
  mart: { n: "Poké Mart", cur: "lmd", items: [
    { id: "m_c1", n: "Exp. Candy S ×5", cost: 1000, give: { rec1: 5 } },
    { id: "m_c2", n: "Exp. Candy M ×3", cost: 2400, give: { rec2: 3 } },
    { id: "m_c3", n: "Exp. Candy L", cost: 3600, give: { rec3: 1 } },
    { id: "m_rare", n: "Rare Candy", cost: 4800, give: { rare: 1 } },
    { id: "m_seed", n: "Seed of Mastery", cost: 3000, give: { summ: 1 } },
    { id: "m_fire", n: "Fire Stone", cost: 6000, give: { firestone: 1 } },
    { id: "m_water", n: "Water Stone", cost: 6000, give: { waterstone: 1 } },
    { id: "m_thunder", n: "Thunder Stone", cost: 6000, give: { thunderstone: 1 } },
    { id: "m_leaf", n: "Leaf Stone", cost: 6000, give: { leafstone: 1 } },
    { id: "m_moon", n: "Moon Stone", cost: 9000, give: { moonstone: 1 } },
    { id: "m_sitrus", n: "Sitrus Berry", cost: 2500, give: { held: "sitrusberry" } },
    { id: "m_lum", n: "Lum Berry", cost: 2500, give: { held: "lumberry" } },
  ] },
  prize: { n: "Prize Corner", cur: "cert", items: [
    { id: "p_abra", n: "Abra", cost: 40, give: { op: "abra" } },
    { id: "p_clefairy", n: "Clefairy", cost: 60, give: { op: "clefairy" } },
    { id: "p_nidorina", n: "Nidorina", cost: 80, give: { op: "nidorina" } },
    { id: "p_dratini", n: "Dratini", cost: 200, give: { op: "dratini" } },
    { id: "p_scyther", n: "Scyther", cost: 260, give: { op: "scyther" } },
    { id: "p_pinsir", n: "Pinsir", cost: 260, give: { op: "pinsir" } },
    { id: "p_porygon", n: "Porygon", cost: 320, give: { op: "porygon" } },
    { id: "p_permit", n: "Safari Ball", cost: 25, give: { permit: 1 } },
  ] },
  bp: { n: "BP Exchange", cur: "tokens", items: [
    { id: "b_cord", n: "Linking Cord", cost: 120, give: { linkcord: 1 } },
    { id: "b_left", n: "Leftovers", cost: 160, give: { held: "leftovers" } },
    { id: "b_band", n: "Choice Band", cost: 260, give: { held: "choiceband" } },
    { id: "b_specs", n: "Choice Specs", cost: 260, give: { held: "choicespecs" } },
    { id: "b_scarf", n: "Choice Scarf", cost: 260, give: { held: "choicescarf" } },
    { id: "b_orb", n: "Life Orb", cost: 260, give: { held: "lifeorb" } },
    { id: "b_vest", n: "Assault Vest", cost: 220, give: { held: "assaultvest" } },
    { id: "b_belt", n: "Expert Belt", cost: 180, give: { held: "expertbelt" } },
    { id: "b_ball", n: "Light Ball", cost: 200, give: { held: "lightball" } },
    { id: "b_club", n: "Thick Club", cost: 200, give: { held: "thickclub" } },
    { id: "b_punch", n: "Lucky Punch", cost: 160, give: { held: "luckypunch" } },
    { id: "b_leek", n: "Leek", cost: 160, give: { held: "leek" } },
    { id: "b_powder", n: "Metal Powder", cost: 160, give: { held: "metalpowder" } },
  ] },
  gems: { n: "Gem Shop", cur: "orundum", items: [
    { id: "g_ball1", n: "Safari Ball", cost: 600, give: { permit: 1 } },
    { id: "g_ball10", n: "Safari Ball ×10", cost: 6000, give: { permit: 10 } },
    { id: "g_elixir", n: "Max Elixir", cost: 180, give: { prime: 1 } },
  ] },
  elixir: { n: "Max Elixir", cur: "prime", hidden: 1, items: [{ id: "e_pp", n: "Restore PP", d: "Refill your PP to max", cost: 1, give: { sanityMax: 1 } }] },
};
