# ArknightsTactics

Single-file HTML games, served by GitHub Pages from `main` (https://mikale4.github.io/ArknightsTactics/):

| Path | What it is |
|---|---|
| `arknights_tactics_v40_…syntaxclean2.html` | The original desktop Arknights Tactics (combat rules, runes, leaders). Edit in place. |
| `mobile/` | **Arknights Tactics Mobile**: phone-first rebuild with Epic Seven–style progression, Arknights terminology, and Galactic Heroes–style battles. |
| `assets/sprites/`, `assets/heads/` | Trimmed WebP operator art (`<slug>.webp`, slug = lowercase name, non-alphanumerics → `-`). Used in menus and dialogue. |
| `assets/data/operators.json` | Operator roster source (UTF-8 BOM; load with `utf-8-sig`). |

## Never edit `mobile/index.html` directly
They are build outputs. Edit the parts in `src/` and rebuild:

```sh
sh mobile/src/build.sh            # also writes mobile/dist/index.html (artifact copy, gitignored) and syntax-checks
```

`mobile/src` parts, in build order (each relies on globals from earlier ones):
`a1_head.html` CSS · `a2_core.js` markup, utils, icons, items, statuses · `a3a_roster.js` 239-operator roster ·
`a3b_real.js` real skills/talents (generated, see below) · `a3c_kits.js` class tables, branch traits, operator build, enemies ·
`a4_story.js` Main Theme Part 1 Ep 01–05 + speakers · `a4b_reunion.js` Part 1 Ep 06–08 · `a4c_victoria.js` Part 2 Ep 09–14 · `a4d_world.js` stage index, Supplies, SSS, missions, Store ·
`a5_art.js` figure renderer (poses, weapons, race features) · `a5b_opfig.js` per-operator figures + colour table ·
`a6_state.js` save, progression, headhunting · `a6b_ladder.js` Contract ladders (simulated Doctors, tiers, draft AI) · `a6c_lines.js` chat line corpus · `a6d_meta.js` weekly banners, Inbox, Achievements · `a6e_people.js` Doctors' personalities, presence, chat engine, guilds, guild boss · `a7_engine.js` battle rules (event-driven) · `a8a_render.js` 3D camera and drawing ·
`a8c_sfx.js` music, sound effects and voice lines · `a8b_battle.js` battle director and HUD · `a9a/a9b_screens.js` screens · `a9e_arena.js` Contract screens, draft, launchers · `a9f_social.js` Inbox, Achievements, Chat, profiles, Guild, Settings screens ·
`a9c_title.js` title screen + local accounts · `a9d_demo.js` Demo runner · `a10_boot.js` launchers, actions, boot.
All parts share one script, so a later `function` with the same name silently replaces an earlier one; `build.sh` fails on duplicates.

## Real operator kits
Every operator has their real Arknights skills (S1/S2/S3, unlocked at Elite 0/1/2) and talents, translated to turn-based
rules; the basic attack comes from their branch trait (`BRANCH` in `a3c_kits.js`). Don't edit `a3b_real.js` by hand:
- Translations live in `mobile/tools/kits/*.json` (format and rules: `mobile/tools/kits/KIT_FORMAT.md`).
- `python mobile/tools/merge_kits.py check mobile/tools/kits/<file>.json` validates; `python mobile/tools/merge_kits.py build`
  writes `a3b_real.js` (adds cooldowns from SP cost, unlock Elites, real-data stats from `mobile/tools/real.json`). Then rebuild.
- `mobile/tools/extract_kits.py` regenerates `real.json` from the game data (Kengxxiao/ArknightsGameData_YoStar en_US,
  plus zh_CN for CN-only operators like Togawa Sakiko).
- Battle rules (`a7_engine.js`): Physical (vs DEF) / Arts (vs RES points) / True damage; one turn = 3× an Arknights hit
  (`K_TURN`); duration skills are timed states; cooldowns, not SP.

## Terminology (UI must use real Arknights terms)
Internal identifiers kept their old names; only visible text changed:
`rune` → **Module** (tiers T1–T5, slots X/Y; sets show real module codes via `RUNE_SET`, e.g. Guard → PRO; selling → Disassemble) · `hunt` → **Supplies** (codes SN/SC/FW-1…6) · `tower` → **Stationary Security Service** ·
`arena` → **Contingency Contract** (async ladder vs defense squads) and **Real-Time Contract** (draft PvP); `tokens` = Contract Bounty · `story`/chapters → **Main Theme** / **Episode 01–05** ·
side stages **S1-1…** · sweep → **Auto Deploy** · `shop` → **Store** (Credit, Certificate, Contract, Originite Prime tabs) ·
passive → **Talent** · skill rank → **Skill Level** · Arts resistance → **RES**, debuff resistance → **Status RES** · shield → **Barrier** · stealth → **Camouflage** · results **Mission Accomplished / Mission Failed** · retreat → **Give Up**.
Gacha is **Headhunting** (never "summon").

## Battle look
Units are drawn, jointed figures (`drawFigure`), not sprites. Operator figures come from `opFig()` in `a5b_opfig.js`:
colours sampled from their art, class weapons, and race features only for operators listed in `RACE` (don't guess races).
Regenerate the colour table after changing sprites: `python3 mobile/tools/colors.py` (needs ImageMagick), then rebuild.

## Title screen, accounts, Demo
The game boots to a title screen (Touch to Start, Account, Notices, Demo). Accounts are local only (`ak_tactics_accounts`,
SHA-256 password hashes); each account saves to `ak_tactics_mobile_v1:acct:<id>`, Guest keeps `ak_tactics_mobile_v1`,
the Demo uses `ak_tactics_mobile_v1:demo`. `SAVE_SLOT` is the active key. `enterGame(slot)` loads a save and opens the lobby.
The Demo (`a9d_demo.js`) plays from a new save to 100% through the real UI with a visible finger, deciding with hidden
`makeBattle` simulations. In battle it plays at 1× battle speed with AUTO on; the Demo save's Auto AI is Expert. It swaps `window.Date` for a skewed clock so it can skip time on its own save only.
Power push (`pushState`): if neither Contract rating climbs for 2 in-game days it picks a PvP roster of 8 (`pvpRoster`, tested fully
built against Doctors a tier up), makes it the core for all upgrades, farms Supplies for its module sets, spends Contract Bounty on
T5 modules, turns spare Originite Prime into Orundum, saves ×10 pulls for banners whose 6★ helps, and queues Real-Time Contract up
to 10×/day once the roster is Elite 2. A fully maxed roster stuck for 60 days ends the run with a "plateaued" report.
`node mobile/tests/push.js` checks the push on a stalled save.
100% = all Main Theme stages (3★ on battles), Supplies 1–6 ×3, SSS 30, Legend in both Contracts, all Main Line missions.
It also claims the Inbox, picks the best weekly banner, joins a guild (donates, two boss attacks a day) and says hello in World chat once a day.
`node mobile/tests/demo.js [minutes]` runs it headless at top speed; `node mobile/tests/accounts.js` checks accounts.

## Audio (`a8c_sfx.js`)
Plain `<audio>` elements (work from file://). Music: `BGM` keys → `assets/bgm/*.mp3` (folder is lowercase; Pages is case-sensitive),
`music(key)` crossfades; `screenMusic()` picks the lobby track, scenes pass a mood (`moodFor` in a10), battles pass `cfg.bgm`
(`nodeBgm`, Supplies, SSS, Contracts). Effects: `SFX_FILES` → `assets/sfx/<name>.mp3` (Arknights samples), `attackSfx(u)` by weapon.
Voices: `assets/voice/<slug>/CN_0xx.mp3`, lines in `VO`, `VOICE_LIST` lists voiced operators. Volumes in `ak_tactics_audio`.
Re-fetch from PseudoMon/arknights-audio with `python mobile/tools/fetch_audio.py` (needs git + ffmpeg; `voice_map.json` maps
slugs to their voice folders; Beanstalk uses JP because the EN files upstream are empty). Then rebuild.

## Contract ladders (`a6b_ladder.js`, `a9e_arena.js`)
1,500 simulated Doctors per save (`S.ladder.pop` holds their points; accounts are rebuilt deterministically from
`S.ladder.seed` and index). Account strength q (0–1) sets roster, rarity mix, investment, module boost, squad quality and AI
(balanced < .35 ≤ aggressive < .75 ≤ expert); `qRating(q)` puts most Doctors in Bronze–Silver and maxed whales in Legend.
Tiers Bronze 0 · Silver 1300 · Gold 1600 · Platinum 1900 · Diamond 2200 · Master 2500 · Grandmaster 2800 · Legend 3100.
Contingency Contract: Elo points, 10 tickets (+1/30 min), 3 opponents near your points, defense squad attacked while away
(`ladderDefense`), population drift, weekly tier rewards (`S.pendingPay`). Real-Time Contract: matchmaking by rating,
snake draft 5 each (`DRAFT_ORDER`), 1 ban each → 4v4, 20 s turn timer (`turnTimer` in a8b), placements and streaks.

## Story parts
`STORY` holds parts (arcs); their chapters are the Episodes, numbered across parts by `a4d_world.js` (`CHAPTERS`, stage codes
`6-1`, `S6-1`…). New episodes push chapters / parts in their own file and add enemies with `addEnemies(defs, res)` (a3c) and
speakers with `addSpeakers(defs)` (a4). Speaker art: `op` (operator sprite), `art` (assets/story/<key>.webp), `en` (enemy art).
Nodes may set `mood` (scene music) and `bgm` (battle music). Keep existing stage order: saves store stars by stage code.

## Art for enemies and story characters
`mobile/tools/art_manifest.json` maps story art keys → Aceship avg portraits and enemy keys → enemy icons (ArknightsGameResource);
`python mobile/tools/fetch_art.py` downloads (cache in mobile/tools/.art_cache), trims/converts to `assets/story/*.webp` and
`assets/enemies/*.webp`, and writes the `@art-*` lists in `a5_art.js`. `enemyArt(key)` uses real art when listed, drawn figures otherwise.

## Social world (`a6e_people.js`, `a9f_social.js`)
The 1,500 ladder Doctors are the game's "players". `person(i)` rebuilds each one's personality from the ladder seed (archetype,
temperament, typing style, favourites, time zone + play window); `isOnline(i)` follows their schedule. World chat paces itself
by how many are online (`worldGap`), replies are queued with typing delays (`S.chat.q`), and the player's messages are classified
(`classify`) to pick who answers and how. Lines: `CHAT_LINES[topic]` entries, optionally tagged with voices; `styleText` applies the
speaker's typing style. Guilds (`S.gw`, 72 generated): join/request/invite/create, applications, daily donations, a weekly guild
boss (fixed HP pool across stages, 2 attacks/day, `turnLimit` fights; `gbRef` sizes HP from a reference squad), members who
donate, attack, chat, leave and get replaced. Contract fights and defense attacks can trigger whispers (`contractDM`).
Real-Time opponents are drawn from the same population. Rewards from the dev team, achievements (`ACHV`), guild boss
clears and weekly Contract tiers arrive in the Inbox (`sendMail`); new saves get a Ten-roll Headhunting Permit (`hh10`).
Headhunting runs three themed banners per week (`bannersNow`, `BANNER_THEMES`) plus Standard; collab operators
(`LIMITED_OPS`) only drop from their own banner.

## Auto-battle AI
Styles in `AI_STYLES`: balanced (default), aggressive, safe, expert. Expert (`expertChoose` in `a7_engine.js`) copies the battle
(`makeBattle({ from: B })`), plays each candidate action out ~24 steps with seeded dice (`R` is swapped for `seeded()`),
and scores the result. Keep `R` a `let`; clones must never use the expert style themselves.

## Saves
`localStorage` key `ak_tactics_mobile_v1`. `migrate()` in `a10_boot.js` upgrades old saves (stage codes moved to the
S-prefixed scheme, flag `codes2`). Keep it backward compatible.

## Testing
```sh
npm install && npx playwright install chromium
npm run test:mobile     # phone-size playthrough, screenshots in mobile/tests/shots/
npm run test:figures    # figure gallery vs. art
npm run test:balance    # auto-vs-auto win rates per stage (slow)
npm run serve           # then open http://localhost:8000/mobile/
```
Check screenshots at 390×844 portrait and 844×390 landscape after visual changes.

## Open items
- Galactic Heroes (the Star Wars squad battler whose battle engine `mobile/` borrowed) moved out of this repo to `C:\Games\galactic-heroes`; the owner wants it in its own GitHub repo named `star-wars-test`, which still needs creating.
