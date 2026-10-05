# ArknightsTactics

Three single-file HTML games, served by GitHub Pages from `main` (https://mikale4.github.io/ArknightsTactics/):

| Path | What it is |
|---|---|
| `arknights_tactics_v40_…syntaxclean2.html` | The original desktop Arknights Tactics (combat rules, runes, leaders). Edit in place. |
| `mobile/` | **Arknights Tactics Mobile**: phone-first rebuild with Epic Seven–style progression, Arknights terminology, and Galactic Heroes–style battles. |
| `galactic-heroes/` | **Galactic Heroes**: Star Wars Galaxy of Heroes–style mobile squad battler (the battle engine `mobile/` borrows from). |
| `assets/sprites/`, `assets/heads/` | Trimmed WebP operator art (`<slug>.webp`, slug = lowercase name, non-alphanumerics → `-`). Used in menus and dialogue. |
| `assets/data/operators.json` | Operator roster source (UTF-8 BOM; load with `utf-8-sig`). |

## Never edit `mobile/index.html` or `galactic-heroes/index.html` directly
They are build outputs. Edit the parts in `src/` and rebuild:

```sh
sh mobile/src/build.sh            # also writes mobile/dist/index.html (artifact copy, gitignored) and syntax-checks
sh galactic-heroes/src/build.sh
```

`mobile/src` parts, in build order (each relies on globals from earlier ones):
`a1_head.html` CSS · `a2_core.js` markup, utils, icons, items, statuses · `a3a_roster.js` 239-operator roster ·
`a3b_kits.js` class templates, featured kits, enemies · `a4_story.js` Main Theme, Supplies, SSS, missions, Store ·
`a5_art.js` figure renderer (poses, weapons, race features) · `a5b_opfig.js` per-operator figures + colour table ·
`a6_state.js` save, progression, headhunting · `a7_engine.js` battle rules (event-driven) · `a8a_render.js` 3D camera and drawing ·
`a8c_sfx.js` WebAudio sounds · `a8b_battle.js` battle director and HUD · `a9a/a9b_screens.js` screens · `a10_boot.js` launchers, actions, boot.

## Terminology (UI must use real Arknights terms)
Internal identifiers kept their old names; only visible text changed:
`rune` → **Module** (tiers T1–T5) · `hunt` → **Supplies** (codes SN/SC/FW-1…6) · `tower` → **Stationary Security Service** ·
`arena` → **Contingency Contract** (`tokens` = Contract Bounty) · `story`/chapters → **Main Theme** / **Episode 01–05** ·
side stages **S1-1…** · sweep → **Auto Deploy** · `shop` → **Store** (Credit, Certificate, Contract, Originite Prime tabs) ·
passive → **Talent** · skill rank → **Skill Level** · results **Mission Accomplished / Mission Failed** · retreat → **Give Up**.
Gacha is **Headhunting** (never "summon").

## Battle look
Units are drawn, jointed figures (`drawFigure`), not sprites. Operator figures come from `opFig()` in `a5b_opfig.js`:
colours sampled from their art, class weapons, and race features only for operators listed in `RACE` (don't guess races).
Regenerate the colour table after changing sprites: `python3 mobile/tools/colors.py` (needs ImageMagick), then rebuild.

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
- `mobile/` and `galactic-heroes/` live on branch `claude/swgoh-mobile-game-html-ajhk0t`; Pages only serves them after a merge to `main`.
- The owner wanted Galactic Heroes in its own repo named `star-wars-test`; it still needs creating on GitHub. Its content is `galactic-heroes/`.
