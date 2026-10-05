# Pokémon Kanto Squad

A phone-first squad battler set in Kanto with the original 151 Pokémon. It is built on the same engine as Melty Blood RPG and Arknights Tactics Mobile, re-themed so that every term is Pokémon terminology. It's an unofficial, non-commercial fan game: Pokémon © Nintendo, Game Freak and Creatures Inc. The Pokémon and trainer sprites come from [Pokémon Showdown](https://play.pokemonshowdown.com/sprites/), and the species, move and ability data from [PokeAPI](https://pokeapi.co/).

Open `pokemon/index.html` directly or serve the repo (`npm run serve`, then `http://localhost:8000/pokemon/`). It's a single file: the sprites are embedded.

## Game Boy shell

The whole game runs on a Game Boy screen. Portrait is a DMG-style body; landscape is a wide Game Boy Advance-style one. The buttons work:

| Button | Menus | Battle |
|---|---|---|
| D-pad | left/right switches tabs, up/down scrolls | left/right picks the target, up/down highlights a move |
| A | presses the screen's main button, advances text | uses the highlighted move |
| B | back / close | shows the target's info |
| START | the START menu (Pokédex, Pokémon, Bag, Trainer Card, Mail, Save, Option) | pause |
| SELECT | the Bag | Auto on/off |

Keyboard: arrows, Z or Space (A), X or Esc (B), Enter (START), Shift (SELECT). The Trainer Card's options change the frame colour (Classic, Pikachu, Red, Blue, Atomic Purple) or turn it off. The shell lives in `a9d_gameboy.js` (logic) and at the end of `a1_head.html` (CSS); everything else is positioned inside `#screen`, a size container, so screen CSS uses `cqh`/`cqw` instead of `vh`/`vw`.

## What's in it

- **151 Pokémon** with Red/Blue typings (Clefairy and Jigglypuff are Normal, Mr. Mime is pure Psychic, Magnemite pure Electric), real base stats, and three moves each from their Gen 1 learnsets:
  - **S1** has no cooldown.
  - **S2** and **S3** have cooldowns; S3 starts on cooldown.
- **Abilities:** each Pokémon has one, with a working battle effect, for example Static, Levitate, Intimidate, Sturdy, Swift Swim (in rain), Imposter (Ditto transforms on entry) and Multiscale.
- **Battles:**
  - Turn order follows Speed through turn meters, and damage uses the main-series formula: STAB, the 15-type chart, critical hits, accuracy and evasion.
  - Spread moves deal 75% damage, as in Double Battles.
  - Status: Burn, Poison/Bad poison, Paralysis, Sleep, Freeze, Confusion, Leech Seed and Bind.
  - Stat stages run from −6 to +6.
  - Field effects: Reflect, Light Screen, Mist and Substitute.
  - Weather comes from the location: rain at Cerulean Gym, hail in Seafoam, sun at Cinnabar, a sandstorm on Victory Road.
  - Battle text is in the games' style: "It's super effective!", "A critical hit!", "The opposing Onix fainted!"
  - Moves that need their own handling: Transform, Metronome, Splash, Dream Eater, Pay Day, Explosion, Hyper Beam recharge and Low Kick by weight.
- **Kanto Journey:** 10 chapters that retell Red and Blue.
  - The eight Gym Leaders use their Red/Blue teams and levels; Team Rocket and Giovanni appear three times.
  - Blue picks the starter that beats yours, and his Champion team depends on it.
  - Then the Elite Four, Cerulean Cave and Mewtwo.
  - Side stages catch Pikachu, Clefairy, Diglett, Snorlax, Articuno, Zapdos and Moltres.
- **Gym Badges** raise the level cap (Lv 15 at first, then 22, 26, 32, 44, 47, 52, 56, 70, and 100 for the Champion) and give +5% to one stat each.
- **Evolution** by level, by evolution stone, or with a Linking Cord for the trade evolutions. Eevee can become Vaporeon, Jolteon or Flareon. Evolving into a species you already own merges the two and raises IVs.
- **Safari Zone** (the gacha):
  - Throw Safari Balls; catches show as a Poké Ball, Great Ball or Ultra Ball by rarity.
  - One featured area per day, plus pity.
  - Duplicates raise IVs; at perfect IVs they pay Game Corner Coins.
- **Trainers:** all from Showdown's trainer sprites.
  - The FireRed/LeafGreen set for Kanto's Gym Leaders, Elite Four, Blue, Oak, Team Rocket and trainer classes.
  - Jessie & James, Nurse Joy and a shop clerk.
  - 19 player looks, from Red and Leaf to Gloria. Your trainer appears in battle to send out your team.
- **Other modes:**
  - Explore areas (Viridian Forest, Mt. Moon, Power Plant, Seafoam Islands, Pokémon Mansion, Victory Road) for stones, Exp. Candy, Seeds of Mastery and held items.
  - The Battle Tower and Link Battles.
  - Shops: Poké Mart, Game Corner Prize Corner, BP Exchange and Gem Shop.
  - The Bag, the Pokédex (seen/caught, Prof. Oak's rating, where to find each Pokémon), Mail with Mystery Gifts, Medals, Daily Research, and a Trainer Card with Settings.

## Terminology

The engine's internal names stayed; only the visible text changed.

| Internal | Shown as |
|---|---|
| operators / characters (`OPS`, `S.ops`) | Pokémon |
| Headhunting / Manifest (`hh`, `pull`) | Safari Zone / throw |
| `permit` | Safari Ball |
| `orundum` | Gems |
| `lmd` | Poké Dollars (₽) |
| `cert` | Coins (Game Corner) |
| `tokens` | Battle Points (BP) |
| `prime` | Max Elixir |
| sanity / stamina | PP |
| `rec1`–`rec4` | Exp. Candy S/M/L/XL |
| `summ`, skill levels | Seed of Mastery, move Mastery (1–5, ★) |
| `pot` (potential) | IVs (IV rank 1–6) |
| power | CP |
| runes / Mystic Codes | held items (`S.held`, `p.held`) |
| story / Main Story | Journey (chapters, Gyms, Pokémon League) |
| `hunt` (Supplies) | Explore |
| `tower` | Battle Tower |
| `arena` | Link Battle |
| inbox | Mail (Mystery Gift) |
| achievements | Medals |
| daily missions | Daily Research |
| `free10`, `gold5` | Safari Pass, Master Ball |
| classes | roles from Pokémon UNITE (Attacker, All-Rounder, Speedster, Defender, Supporter) |
| passives | Abilities |
| reset account | Delete save data |

## Files

`src/` parts, in build order. Each relies on the globals from earlier ones, and `build.sh` writes `index.html`:

| Part | Contents |
|---|---|
| `a1_head.html` | CSS |
| `a2_core.js` | markup, utils, the type chart, weather, icons, Badges, items and status conditions |
| `a3a_dex.js` | generated by `tools/build_data.py`; don't edit by hand |
| `a3b_kits.js` | moves turned into skills, move text, Abilities, held items, the `OPS` table |
| (sprites) | built from `pokemon/sprites/` |
| `a4_story.js` | the Journey, Explore, Battle Tower, Link Battles, Daily Research and shops |
| `a5_sprites.js` | sprite loading, cropping and battle animation |
| `a6_state.js` | save, levels, IVs, evolution, Pokédex, Safari odds |
| `a7_engine.js` | battle rules |
| `a8a_render.js` | 3D camera and Kanto backdrops |
| `a8c_sfx.js` | sounds |
| `a8b_battle.js` | battle director, battle text and HUD |
| `a9a`/`a9b_screens.js` | screens |
| `a9c_meta.js` | Mail, Medals, Trainer Card and title screen |
| `a9d_gameboy.js` | the Game Boy shell's buttons, keyboard and START menu |
| `a10_boot.js` | launchers, actions, boot |

Data and sprites are regenerated with two scripts:

```sh
python3 pokemon/tools/build_data.py -v   # species, Gen 1 learnsets, evolutions, Abilities and kits (KITS overrides are checked against the learnsets)
sh pokemon/tools/fetch_sprites.sh        # Showdown sprites into pokemon/sprites/
sh pokemon/src/build.sh
```

Tests, run from the repo root:

```sh
node pokemon/tests/phone.js     # phone-size playthrough, screenshots in pokemon/tests/shots/
node pokemon/tests/figures.js   # every sprite, move, Ability and evolution resolves
node pokemon/tests/sim.js 24    # auto-vs-auto win rates for every Journey stage with random level-capped teams
```

Saves live in `localStorage` under `pokemon_kanto_squad_v1`; `migrate()` in `a10_boot.js` fills in fields that older saves are missing.
