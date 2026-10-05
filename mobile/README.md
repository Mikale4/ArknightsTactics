# Arknights Tactics Mobile

A phone-first rebuild of Arknights Tactics. It keeps the original game's turn-based combat rules
(`arknights_tactics_v40_…html`) and borrows the battle presentation from Galactic Heroes: jointed,
animated figures in a 3D arena with camera cuts, skill cut-ins and hit effects. Around that sits an
Epic Seven–style progression loop, named the way Arknights names things.

Play: open `mobile/index.html` (on GitHub Pages: `/ArknightsTactics/mobile/`). Progress saves in the browser.

## What's in it

- **Main Theme**: *Embers of Chernobog*, Episodes 01–05. Each episode is a stage map with story stages,
  operations, side stages (S1-1, S2-1…), supply caches and a boss operation, plus dialogue before and after
  fights. Clears are rated up to three stars; the first 3-star clear of a stage gives 1 Originite Prime,
  and 3 stars unlocks Auto Deploy. Clearing an episode recruits an operator or pays Orundum and permits.
- **Battles**: squads of four, turn gauges, three skills each, a squad leader, element advantage
  (Fire > Wind > Water > Fire, Light and Dark counter each other), status effects, module sets, and
  auto battle with three AI styles. Operators and enemies are drawn figures, coloured from each operator's
  art, with class weapons (spears, shields, bows, crossbows, guns, rods, medic staves, tomes, blades) and
  race features where they're well known (Cautus, Feline, Lupo, Vulpo, Kuranta, Sankta halos, Sarkaz horns…).
- **Headhunting**: a daily featured banner and the standard banner, ×1 and ×10 with Orundum or
  Headhunting Permits, 6★ pity after 50 pulls, and a guaranteed 5★ or better in your first ten-pull.
- **Operator**: 239 operators. Level them with Battle Records, promote to Elite 1 and Elite 2 with Chip
  Packs, raise skills to Skill Level 7 with Skill Summaries, gain Potential from duplicates, and equip two Modules.
- **Terminal**: Supplies operations that drop Modules (SN, SC, FW, levels 1–6), the 30-floor Stationary
  Security Service, and Contingency Contract (ranked squad battles that pay Contract Bounty).
- **Home**: an assistant operator (tap them), Missions (daily and Main Line), the Store (Credit,
  Certificate, Contract and Originite Prime tabs) and the Depot.

## Files

- `mobile/index.html` is the whole game: HTML, CSS and JS in one file.
- `assets/sprites/<slug>.webp` holds the operator art used in menus and dialogue, and `assets/heads/<slug>.webp`
  holds the portrait icons. Both sets are generated from the battlecard art.

Unofficial, non-commercial fan game. Arknights characters and art belong to Hypergryph and Yostar.
