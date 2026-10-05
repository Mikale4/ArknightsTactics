# Arknights Tactics Mobile

A phone-first rebuild of Arknights Tactics. It keeps the original game's turn-based combat rules
(`arknights_tactics_v40_…html`) and borrows the battle presentation from Galactic Heroes: jointed,
animated figures in a 3D arena with camera cuts, skill cut-ins and hit effects. Around that sits an
Epic Seven–style progression loop, named the way Arknights names things.

Play: open `mobile/index.html` (on GitHub Pages: `/ArknightsTactics/mobile/`). Progress saves in the browser.

## What's in it

- **Title screen**: Touch to Start, local accounts (log in, register, or play as Guest; each Doctor has their own save),
  Notices, and **Demo**: a runner that plays a brand-new save all the way to 100% on its own, tapping through the real
  screens. It never touches your saves, skips time on its own save while it waits for Sanity, and can be sped up or stopped.
  If its Contract climb stalls it switches to a power push: it builds and maxes a PvP roster of eight, farms modules for it,
  saves headhunts for banners that help, and queues Real-Time Contract often.

- **Main Theme**: an original retelling of the Arknights main story in two parts. Part 1, *Embers of Chernobog*
  (Episodes 01–08): Chernobog, Lungmen, FrostNova, W, Patriot and Talulah. Part 2, *Crown in the Fog* (Episodes 09–14): the
  Victoria arc in Londinium, up to Theresa. Each episode is a stage map with story stages, operations, side stages (S1-1…),
  supply caches and a boss, with real Arknights portraits for the cast and enemies. Clears are rated up to three stars; the first
  3-star clear gives 1 Originite Prime, and 3 stars unlocks Auto Deploy.
- **Battles**: squads of four, turn gauges, a squad leader, element advantage
  (Fire > Wind > Water > Fire, Light and Dark counter each other), status effects, modules, and
  auto battle with four AI styles (balanced, aggressive, safe, and Expert, which plays each possible move out a few turns ahead before choosing). Every operator fights with their real Arknights kit, translated to turns:
  a basic attack from their branch trait (Centurions hit three enemies, Medics heal, Liberators build ATK…),
  their real skills S1–S3 (unlocked at Elite 0/1/2, with cooldowns from the skill's SP cost and Auto skills
  that fire on their own) and their real talents. Damage is Physical (reduced by DEF), Arts (reduced by RES)
  or True, as in Arknights. Operators and enemies are drawn figures, coloured from each operator's
  art, with class weapons (spears, shields, bows, crossbows, guns, rods, medic staves, tomes, blades) and
  race features where they're well known (Cautus, Feline, Lupo, Vulpo, Kuranta, Sankta halos, Sarkaz horns…).
- **Headhunting**: three themed banners every week (Penguin Logistics, Rhine Lab, Abyssal Hunters, Kazimierz, Joint Operations, collaborations…) and the standard banner, ×1 and ×10 with Orundum or
  Headhunting Permits, 6★ pity after 50 pulls, and a guaranteed 5★ or better in your first ten-pull.
- **Operator**: 239 operators. Level them with Battle Records, promote to Elite 1 and Elite 2 with Chip
  Packs, raise skills to Skill Level 7 with Skill Summaries, gain Potential from duplicates, and equip two Modules (slots X and Y; module types use real module codes such as PRO, GUA and DRE).
- **Terminal**: Supplies operations that drop Modules (SN, SC, FW, levels 1–6) and the 30-floor Stationary
  Security Service.
- **Contracts** (PvP against a simulated ladder of 1,500 Doctors, Bronze → Legend):
  **Contingency Contract** — attack other Doctors' defense squads, set your own defense (it gets attacked while you're away),
  Elo points, tickets, rankings, weekly tier rewards. **Real-Time Contract** — matchmaking, a pick/ban draft (5 each, 1 ban)
  and a live 4 v 4 with a turn timer. The higher you climb, the stronger the rosters, the smarter the drafts and the AI.
- **Sound**: Arknights music for each screen, story mood and boss, real Arknights battle and UI sound effects, and operator
  voice lines (English, or Japanese where there is no English set) for the assistant, squad picks, deployment, skills and results.
  Music, Effects and Voices volumes are in Settings.
- **A living world**: the 1,500 Doctors from the Contracts are the game's other players. Each has a personality, a typing style,
  favourite operators and a daily schedule. They chat in World chat (not spam: a line every minute or so), answer you, whisper
  after Contract fights, recruit for their guilds, ask to join yours, and come and go.
- **Guilds**: find, join or create one; invite Doctors or accept their requests; donate daily; take on the weekly guild boss
  (2 attacks a day, shared HP across stages). Guild Wars and Guild Siege come later.
- **Inbox and Achievements**: gifts from the dev team now and then, a free ten-roll for new Doctors, weekly Contract rewards,
  guild boss rewards, and ~95 achievements whose rewards arrive by mail.
- **Settings**: sound volumes, default battle speed and AI, cut-ins, screen shake, damage numbers, story text speed, animations,
  chat options (ticker, whisper alerts, word filter, blocked Doctors), name, save codes, reset.
- **Home**: an assistant operator (tap them), Missions (daily and Main Line), the Store (Credit,
  Certificate, Contract and Originite Prime tabs) and the Depot.

## Files

- `mobile/index.html` is the whole game: HTML, CSS and JS in one file, built from `mobile/src/`.
- `mobile/tools/kits/` holds the translated operator kits; `mobile/tools/merge_kits.py` turns them into `mobile/src/a3b_real.js`.
- `assets/sprites/<slug>.webp` holds the operator art used in menus and dialogue, and `assets/heads/<slug>.webp`
  holds the portrait icons. Both sets are generated from the battlecard art.

Unofficial, non-commercial fan game. Arknights characters and art belong to Hypergryph and Yostar.
