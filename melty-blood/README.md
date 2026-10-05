# Melty Blood RPG — Night of Rumors

A phone-first, turn-based RPG take on Melty Blood, built on the same engine as Arknights Tactics Mobile
and Galactic Heroes. The cast and the Tatari incident from the fighting game become a squad RPG:
story chapters on stage maps, animated drawn battles with camera cuts, a gacha, gear and battle modes.

Play: open `melty-blood/index.html` (on GitHub Pages: `/ArknightsTactics/melty-blood/`). Progress saves in the browser.

## What's in it

- **Story — Night of Rumors**: five Nights in Misaki Town (The Rumor, The Executor, Tohno Mansion,
  Chaos in the Park, Night of Wallachia). Each Night is a stage map with story scenes, battles, side
  stories, caches and a boss, with dialogue before and after fights. Clearing a Night recruits Sion,
  Ciel, Akiha or Arcueid. All dialogue is an original fan retelling.
- **Battles**: squads of four, turn gauges, Moon styles (Crescent beats Full, Full beats Half, Half
  beats Crescent; Holy and Blood each beat the other), status effects and a squad leader.
  Every action fills your **Magic Circuit** (up to 300%); each character's third skill is an
  **Arc Drive** that spends 100% of it. Enemy bosses have their own circuit and Arc Drives.
  Battles open with *Ready… Fight!*, run in rounds, and end on *K.O.*
- **29 characters**, each drawn as an animated figure with a signature look and kit: Shiki Tohno,
  Shiki Nanaya, Arcueid, Red Arcueid, Ciel, Powered Ciel, Akiha, Akiha Vermillion, Hisui, Kohaku,
  Mech-Hisui, Satsuki, Sion, Sion TATARI, Riesbyfe, Aoko, Nrvnqsr Chaos, Michael Roa Valdamjong,
  Night of Wallachia, Len, White Len, Miyako, Kouma, Neco-Arc, Neco-Arc Chaos, Ryougi Shiki, Saber,
  Noel and Vlov.
- **Tatari** (gacha): rumors take shape. A daily featured 5★ and two 4★, ×1 and ×10 Manifests with
  Moon Crystals or Rumor Tickets, a rising 5★ rate after 50 Manifests, and a guaranteed 4★ in your
  first ten. Duplicates raise Resonance.
- **Growth**: level up with Blood Vials, Awaken twice with Moon Shards, raise skills with Grimoire
  Pages, and equip two **Mystic Codes** (sets such as Reinforcement, Mystic Eyes, Black Key, Heat, Gamaliel).
- **Battle modes**: Night Patrol (Mystic Code farming, three areas × six levels), Arcade Mode
  (a 30-stage ladder with bosses and mirror matches) and Versus (ranked squad battles).
- **Home**: an assistant character (tap them), missions, the Ahnenerbe café shop and items.

No official art is used: every character, enemy, portrait and backdrop is drawn on canvas.

## Building and testing

The game is assembled from the parts in `src/`. Never edit `index.html` directly:

```sh
sh melty-blood/src/build.sh       # writes index.html (and dist/index.html for artifacts), syntax-checks
node melty-blood/tests/phone.js   # phone playthrough, screenshots in tests/shots/
node melty-blood/tests/figures.js # every figure and a pose sheet
node melty-blood/tests/sim.js     # auto-vs-auto win rates per stage
```

Unofficial, non-commercial fan game. Melty Blood and Tsukihime belong to TYPE-MOON and French-Bread.
