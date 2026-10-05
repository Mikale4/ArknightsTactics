# Melty Blood RPG — Night of Rumors

A phone-first, turn-based RPG take on Melty Blood, built on the same engine as Arknights Tactics Mobile
and Galactic Heroes. The cast and the Tatari incident from the fighting game become a squad RPG:
story chapters on stage maps, animated drawn battles with camera cuts, a gacha, gear and battle modes.

Play: open `melty-blood/index.html` (on GitHub Pages: `/ArknightsTactics/melty-blood/`). Progress saves in the browser.

## What's in it

- **Story — Night of Rumors**: five Nights in Misaki Town (The Rumor, The Executor, Tohno Mansion,
  Chaos in the Park, Night of Wallachia). Each Night is a stage map with story scenes, battles, side
  stories, caches and a boss, with dialogue before and after fights. Clearing a Night recruits Water Half
  Moon Sion, Ether Crescent Moon Ciel, Imaginary Full Moon Akiha or Imaginary Full Moon Arcueid. All dialogue is an original fan retelling.
- **Moon styles × Elements, Summoners War style**: every character comes in Crescent, Half and Full
  Moon, and every Moon style in five Elements. Each combination is its own unit (for example Fire Half
  Moon Shiki and Water Half Moon Shiki), collected and raised separately: 29 characters × 3 × 5 = 435 units.
  - **Moon style** sets the role, three skills (named after that style's moves in the fighting game) and
    Personal Skill, plus a trait from the fighting game's systems: Crescent enters Blood Heat (more damage at 200%+
    Magic Circuit), Half has the toughest guard and an automatic Circuit Spark, Full charges its own meter
    and hits harder with Arc Drives. Half Moon S3s use the basic Arc Drive, as Half has no Last Arc.
  - **Element** (the magecraft Elements of the Nasuverse) sets matchups (Water beats Fire, Fire beats Wind,
    Wind beats Water; the rare Ether and Imaginary Numbers beat each other), the unit's colour, a small stat
    lean and kit tweaks: Fire S1s can Curse and its Arc Drives hit harder, Water slows and heals, Wind controls
    turn meter, Ether seals skills and strips buffs, Imaginary Numbers heal-blocks and drains. Ether and
    Imaginary Numbers versions are rare (5% each).
  - Badges show both: the moon phase is the Moon style, the colour is the Element.
- **Battles**: squads of four, turn gauges, Element affinity, Moon-style traits, status effects and a squad leader.
  Every action fills your **Magic Circuit** (up to 300%); each character's third skill is an
  **Arc Drive** that spends 100% of it. Enemy bosses have their own circuit and Arc Drives.
  Battles open with *Ready… Fight!*, run in rounds, and end on *K.O.*
- **29 characters**, each drawn as an animated figure: Shiki Tohno,
  Shiki Nanaya, Arcueid, Red Arcueid, Ciel, Powered Ciel, Akiha, Akiha Vermillion, Hisui, Kohaku,
  Mech-Hisui, Satsuki, Sion, Sion TATARI, Riesbyfe, Aoko, Nrvnqsr Chaos, Michael Roa Valdamjong,
  Night of Wallachia, Len, White Len, Miyako, Kouma, Neco-Arc, Neco-Arc Chaos, Ryougi Shiki, Saber,
  Noel and Vlov.
- **Tatari** (gacha): rumors take shape. A daily featured 5★ and two 4★, ×1 and ×10 Manifests with
  Jewels or Rumor Tickets, a rising 5★ rate after 50 Manifests, and a guaranteed 4★ in your
  first ten. Duplicates raise Spirit Origin.
- **Growth**: level up with Blood Vials, Ascend twice with Crimson Moon Shards, raise Skill Ranks (E to EX)
  with Magic Crest Fragments, and equip two **Mystic Codes** (sets such as Reinforcement, Mystic Eyes, Black
  Key, Heat, Gamaliel).
- **Battle modes**: Night Patrol (Mystic Code farming, three areas × six levels), Arcade Mode
  (a 30-stage ladder with bosses and mirror matches) and Versus (ranked squad battles).
- **Home**: an assistant character (tap them), missions, the Ahnenerbe café shop and items.

## Terminology

Every name in the game comes from Melty Blood, Tsukihime or the wider Nasuverse:

| Game system | Name used |
|---|---|
| Gacha / pull | Tatari / Manifest (rumors take shape) |
| Variants / matchups | Moon styles (Crescent, Half, Full) / magecraft Elements (Fire, Water, Wind, Ether, Imaginary Numbers) |
| Special meter, ultimate | Magic Circuit, Arc Drive; style traits Blood Heat, Circuit Spark, Charge |
| Classes | Saber, Lancer, Archer, Assassin, Shielder, Ruler (healers), Caster (supports), Magus (magic attackers) |
| Leader skill / passive | Charisma / Personal Skill |
| Promotion / duplicates / skill levels | Ascension / Spirit Origin / Skill Rank E–EX |
| Statuses | Bounded Field, Presence Concealment, Target Focus, Shield Counter, Skill Seal, Curse, Bind, Line of Death, Guts |
| Gear | Mystic Codes |
| Stamina / currencies | Prana; Yen, Jewels, Rumor Tickets, Tatari Fragments, Versus Points, Holy Relics, Ahnenerbe Coupons |
| Materials | Blood Drop to True Ancestor's Blood (EXP), Crimson Moon Shard, Magic Crest Fragment |
| Modes | Nights (story), Night Patrol, Arcade Mode, Versus |

No official art is used: every character, enemy, portrait and backdrop is drawn on canvas.

## Building and testing

The game is assembled from the parts in `src/`. Never edit `index.html` directly:

```sh
sh melty-blood/src/build.sh       # writes index.html (and dist/index.html for artifacts), syntax-checks
node melty-blood/tests/phone.js   # phone playthrough, screenshots in tests/shots/
node melty-blood/tests/figures.js # every figure and a pose sheet
node melty-blood/tests/sim.js     # auto-vs-auto win rates per stage
VARIANTS=1 node melty-blood/tests/sim.js  # win rate of every Moon style in the same squad
ELEMENTS=1 node melty-blood/tests/sim.js  # average win rate per Element across all 435 units
```

Unofficial, non-commercial fan game. Melty Blood and Tsukihime belong to TYPE-MOON and French-Bread.
