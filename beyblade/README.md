# Beyblade: Let It Rip!

A phone-first, turn-based squad battler built from the original Beyblade anime: **Season 1**, **V-Force** and
**G-Revolution**, with the English dub's names. It runs on the same engine as Melty Blood RPG and Arknights
Tactics Mobile, with story chapters on stage maps, drawn 3D-ish battles in a Beystadium, a Booster gacha, Customize
Parts and battle modes.

Play: open `beyblade/index.html` (on GitHub Pages: `/ArknightsTactics/beyblade/`). Progress saves in the browser.

## What's in it

- **Story: Let It Rip!** Thirteen chapters (91 stages) follow the show:
  - **Season 1:** Bey City Regionals, The White Tigers, The All Starz, The Majestics, The World Championship.
  - **V-Force:** Mr. X, Team Psykick, The Ancient Rock, The Tag Team Championship.
  - **G-Revolution:** Jin of the Gale, The World Championships, BEGA, King of Darkness.

  Each chapter is a stage map with story scenes, battles, a side story, a cache and a boss. Rival teams use real
  Beyblades, and the dialogue is an original retelling.

  Clearing a chapter adds a Beyblade from that point in the show to your collection: Kai's Dranzer S, Lee's Galeon,
  Dragoon F, Dranzer F, Draciel F, Dragoon V, Dranzer V, Draciel V, Dragoon V2, Strata Dragoon V, Dragoon GT,
  Dragoon MS and Dranzer MS.
- **82 Beyblades from 52 Bladers.** Each Blader brings every Beyblade they used in the show, and each version
  is its own unit with its own type, moves and Blader Ability. Tyson alone has Dragoon S, F, V, V2, G, GT and MS.
  - The teams: the Bladebreakers, White Tigers, All Starz, Majestics, Demolition Boys, Dark Bladers, Saint Shields,
    Team Psykick, Team Zagart, the Parts Hunters, F-Dynasty, Barthez Battalion and BEGA.
  - The Bladebreakers start with Tyson, Max, Ray and Kenny. Kai joins after the regionals.
- **Types** (the toys' four types) set matchups and a built-in trait:
  - Attack beats Endurance, Endurance beats Defense, Defense beats Attack. Balance has no edge and no weakness.
  - **Attack** (Smash Attack) deals 12% more damage.
  - **Defense** (Iron Wall) takes 8% less damage and shakes off its debuffs once below half Spin.
  - **Endurance** (Long Spin) recovers 5% Spin each turn.
  - **Balance** (Bit Charge) builds Bit Power every turn and hits 20% harder with its Bit-Beast.
- **Bit-Beasts.** Every Beyblade's S3 is its Bit-Beast attack (Storm Attack, Fire Arrow, Tiger Claw, Gatling Claw
  Maximum, Novae Rog, King of Darkness…). It costs 100% of the team's **Bit Power** (up to 300%), which every hit
  builds.
  - The Bit-Beast rises out of the Beyblade as a glowing spirit before it strikes.
  - Each Bit-Beast has an element from the show (Wind, Fire, Water, Lightning, Earth, Ice, Dark, Light). The element
    adds a small stat lean, an extra effect on S1 and a tweak to the Bit-Beast attack.
- **Battles.** Teams of four Beyblades spin in a Beystadium. Battles open with *3, 2, 1… Let it rip!* and include
  turn meters, clashes, Captain skills and status effects (Cracked Ring, Weak Spot, Friction, Spin Lock, Stalled,
  Center Hold, Phantom Spin…).
  - A Beyblade loses by **Sleep Out** (it slows, wobbles and topples) or **Ring Out**, which happens on a critical
    hit, a Bit-Beast attack or a big hit.
  - A fresh rival wave keeps at most 50% of the rival team's Bit Power.
- **Random Boosters** (gacha). A daily featured 5★ and two featured 4★. You can open ×1 or ×10 with BeyPoints or
  Booster Tickets. The 5★ rate rises after 50 Boosters, and your first ten guarantee a 4★. Getting a Beyblade you
  already have raises its **Bit-Beast Sync** and leaves Spare Parts.
- **Growth.**
  - Level up with Battle Data.
  - Upgrade twice with Upgrade Kits.
  - Raise move levels (1 to MAX) with Grandpa's Training Scrolls.
  - Fit two **Customize Parts**, such as Wing Attack Ring, Heavy Weight Disk, Spin Gear, Engine Gear and Magnecore.
- **Battle modes.**
  - **Street Battles** (Customize Part prizes): Riverbank Battles, the Hobby Shop Cup and Balkov Abbey.
  - **BBA Tower:** 30 floors with champions and other Bladers' teams.
  - **Ranked Battles:** the BBA world ranking.
- **Home.**
  - A partner Beyblade with its Blader and Bit-Beast; tap it for a line.
  - Daily Training.
  - Max's dad's **Hobby Shop**: Coupons, Spare Parts, Ranking and Sports Drinks.
- **Meta.**
  - Title screen: a Beystadium under the lights, Dragoon and Dranzer clashing, Tyson and Kai launching.
  - **Mailbox:** a welcome gift from Mr. Dickenson with ten free Boosters and a Legendary Bit-Chip (a random 5★).
    Mail also brings a daily login gift and letters from Kenny, Dizzi, Grandpa, Max, Hilary, Kai and others.
  - **BBA Records:** tiered achievements.
  - Settings, including *Reset account*.

## Terminology

| Game system | Name used |
|---|---|
| Unit / variants | Beyblade (with its Blader); every version (S, F, V, V2, G, GT, MS) is a separate Beyblade |
| HP / ultimate meter / ultimate | Spin / Bit Power / Bit-Beast attack |
| Matchups | Attack, Defense, Endurance, Balance types; Bit-Beast elements |
| Defeat | Ring Out, Sleep Out |
| Leader skill / passive | Captain skill / Blader Ability |
| Promotion / duplicates / skill levels | Upgrade / Bit-Beast Sync / move level 1–MAX |
| Gear | Customize Parts (graded Plastic, Custom, Pro, Metal, Championship) |
| Gacha | Random Booster; Booster Ticket, Starter Booster, Legendary Bit-Chip |
| Stamina / currencies | Energy; Yen, BeyPoints, Spare Parts, Ranking Points, Sports Drinks, Hobby Shop Coupons |
| Materials | Battle Data S/M/L, Dizzi's Master Data, Upgrade Kit, Training Scroll |
| Modes | Main Story (Season 1, V-Force, G-Revolution), Street Battles, BBA Tower, Ranked Battles, Daily Training |
| Meta | Mailbox, BBA Records, Blader Rank |

Bladers, Beyblades, Bit-Beasts and attack names follow the Beyblade Fandom wiki and the English dub. S1/S2 moves are
written for the game. A few Bit-Beasts whose creature isn't confirmed (Vanishing Moot, Amphilyon, Trypio) use the
closest drawn shape.

No official art is used. Every Blader, Beyblade, Bit-Beast and stadium is drawn on canvas:

- **Beyblades** (`drawBey`): Attack Ring, Weight Disk, Blade Base and Bit-Chip, with motion blur and wobble.
- **Bit-Beasts** (`drawBeast`): glowing spirits in 14 shapes (dragon, phoenix, tiger, wolf, turtle, god…).
- **Bladers:** jointed figures with launchers.

## Building and testing

The game is assembled from the parts in `src/`. Never edit `index.html` directly:

```sh
sh beyblade/src/build.sh          # writes index.html (and dist/index.html for artifacts), syntax-checks
node beyblade/tests/phone.js      # phone playthrough, screenshots in tests/shots/
node beyblade/tests/figures.js    # every Blader, Beyblade and Bit-Beast shape, and a pose sheet
node beyblade/tests/sim.js        # auto-vs-auto win rates per story stage, Street Battle and Tower floor
VARIANTS=1 node beyblade/tests/sim.js  # win rate of every Beyblade in the same team
TYPES=1 node beyblade/tests/sim.js     # average win rate per type
```

Parts in build order:

| Part | Contents |
|---|---|
| `a1_head.html` | CSS |
| `a2_core.js` | Types, traits, items, statuses, icons |
| `a3a_roster.js` | `BLADERS`, the roster: figures, Bit-Beasts, Beyblade versions and kits; generated move text |
| `a3b_kits.js` | Type stats, Bit-Beast element kits, the unit table, generic rivals and `bossOf` |
| `a4_story.js` | Story bosses, speakers, `STORY`, Street Battles, Tower, Daily Training, shop, starters |
| `a5_art.js` | Blader figures |
| `a5b_bey.js` | Beyblades, Bit-Beasts and menu art |
| `a6_state.js` | Save, progression and Boosters |
| `a7_engine.js` | Battle rules |
| `a8a_render.js` | Stadium, camera and drawing |
| `a8c_sfx.js` | Sounds |
| `a8b_battle.js` | Battle director and HUD |
| `a9a`/`a9b`/`a9c` | Screens and meta |
| `a10_boot.js` | Actions and boot |

Unofficial, non-commercial fan game. Beyblade belongs to Takao Aoki, Takara Tomy, Hasbro, d-rights and Nelvana.
