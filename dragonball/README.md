# Dragon Ball Z: Legend of the Z Fighters

A phone-first Dragon Ball Z game that plays like the Game Boy's **Dragon Ball Z: Goku Gekitōden** (Bandai, 1995).
Each chapter has a side-scrolling field to walk, jump and fly across. Battles are planned command turns fought out in
real time on a small map seen from above, with the two fighters' heads moving around it: a power gauge, timed guards,
Vanish and a ki gauge that runs dry. The story runs from Raditz's arrival to
Super Saiyan Goku on a dying Namek, covering the whole Saiyan Saga, the Frieza Saga and the filler arcs in between.
The rest of the game shares its shell with Beyblade: Let It Rip!, Melty Blood RPG and Arknights Tactics Mobile.
That shell gives it a Summon gacha, training, battle modes, a Mailbox, achievements and a hands-free demo.

Play: open `dragonball/index.html` (on GitHub Pages: `/ArknightsTactics/dragonball/`). Progress saves in the browser.
Unofficial, non-commercial fan game: every fighter, place and effect is drawn by the game on canvas.

## What's in it

- **Story.** Twelve chapters (84 stages), English dub names, original dialogue:
  - **Saiyan Saga:** A Saiyan Arrives (Goku and Piccolo vs. Raditz), Snake Way (King Yemma, Princess Snake, HFIL
    with Goz and Mez, King Kai and the Kaioken), Gohan's Survival (the wilderness, the full moon, Piccolo's
    training), Kami's Lookout (Mr. Popo's visions of the Saiyans of the past, Korin's Senzu Beans), The Saiyans Land
    (the Saibamen, Nappa) and Goku vs. Vegeta (Kaioken, Galick Gun vs. Kamehameha, the Great Ape, the Spirit Bomb).
  - **Frieza Saga:** Journey to Namek (Planet Arlia and King Moai, 100× gravity), Planet Namek (Cui, Dodoria's chase,
    Dodoria), The Dragon Balls (Guru, Zarbon's transformation, the Dragon Ball in the lake), The Ginyu Force (Guldo,
    Recoome, Burter and Jeice, Captain Ginyu's Body Change), Frieza's Wrath (Porunga, Piccolo fuses with Nail,
    Frieza's forms) and Super Saiyan (Kaioken ×20, Goku's transformation, 100% Full Power Frieza, the escape from
    Namek).
  - Stage types: story scenes, battles, side stories (they float up in the sky on the field), capsules, bosses and
    **minigames**. Clearing a chapter adds a fighter from that point in the show: Piccolo, Kaioken Goku, Chiaotzu,
    Tien, Nappa, Vegeta, Goku (Namek), Dende, Krillin (Namek), Vegeta (Namek), Piccolo fused with Nail, and finally
    Super Saiyan Goku.
- **The field (Goku Gekitōden's overworld).** Each chapter is a side-scrolling map with the chapter's lead (Goku,
  Gohan, Krillin, Piccolo, Vegeta, Super Saiyan Goku):
  - ◀ ▶ walk, ▲ jumps and, held in the air, flies; ▼ lands. Tap a stage and the lead walks or flies there by itself.
  - The first locked stage is a wall: clear stages to open the map.
  - Wandering enemies patrol the cleared part of the map. Run into one (or tap it) for a quick fight that costs no
    Stamina and pays EXP, Zeni and sometimes a Scroll.
- **Battles (Goku Gekitōden's system):**
  - **The battle screen:** as in Gekitōden, the fight is seen from above on a small map of the place (the wasteland,
    HFIL, King Kai's planet, Kami's Lookout, Namek and its seas, Frieza's ship, Namek's last minutes, the Tournament
    ring and more). Each fighter is a head in a ring (blue for yours, red for the enemy) that flies around the map:
    dashing in for a Rush, backing off, getting knocked back along the line of a hit, and circling the other fighter
    between moves. Ki blasts, beams, discs and energy balls fly between the heads; a dotted line shows the range. On a
    tall phone the map stands on its end with your fighter at the bottom; in landscape the action buttons move to the
    screen's edges.
  - **Plan:** each turn, pick up to three commands (Rush, Ki Blast, the fighter's techniques, Power Up, Close In,
    Back Off, Switch), then GO. Each command shows its ki cost and the ki you'll have left. There's a 15-second
    timer; Settings can GO automatically once three are picked.
  - **Act:** the commands play out in real time while the enemy carries out its own plan.
    - **Hold POWER** while an attack winds up to hit up to 30% harder (it costs more ki); a ring fills around your
      fighter's head.
    - **Tap GUARD** as the ring around your fighter closes. A perfect guard (gold) stops all the damage and gives ki;
      a normal guard stops 70%. Guarding wears down the guard gauge, and at zero the guard breaks.
    - **VANISH** dodges an attack completely for 20 ki.
    - Below zero ki a fighter is exhausted: it can't guard or vanish until ki recovers.
    - The turn ends when your commands are done.
  - **Distance:** Rush needs close range (the fighter dashes in), Ki Blasts weaken from far away, and long range
    leaves more time to see attacks coming. Distance is measured across the map in any direction.
  - **Techniques:**
    - **Beams** (Kamehameha, Galick Gun, Masenko): two fired at once clash in a **beam struggle**; mash POWER.
    - **Finger beams** pierce a normal guard (Special Beam Cannon, Death Beam).
    - **Discs** can only be vanished (Destructo Disc, Death Saucer).
    - **Ultimates** are huge and slow (Spirit Bomb, Death Ball).
    - **Solar Flare** blinds; **Time Freeze** and Telekinesis hold the target.
    - **Kaioken** gives +40% damage and speed but no guard; **Body Change** swaps HP with the target.
    - Healing: Dende's Healing Hands and Yajirobe's Senzu Bean.
  - **Bosses transform.** Vegeta becomes a Great Ape, Zarbon turns into his monster form, Frieza's second form
    becomes his third, and the final form goes to 100% Full Power. Each time the boss comes back at full health.
  - **Parties** are three fighters, one in the fight at a time; Switch brings the next one in. Auto plays for you
    (Balanced, Aggressive or Defensive), and the battle speed goes up to 2×. Keyboard: Space = POWER, G = GUARD,
    V = VANISH, Enter = GO.
  - Three stars: win, no fighter knocked out, and win within the stage's turn goal.
- **38 fighters from 25 characters**, each form its own unit:
  - Goku ×4 (Saiyan Saga, Kaioken, Namek, Super Saiyan), Gohan ×2, Krillin ×2, Piccolo ×2 (with Nail), Tien,
    Yamcha, Chiaotzu and Yajirobe.
  - Saiyans: Raditz, Nappa, Vegeta ×3 (Saiyan Saga, Great Ape, Namek) and the Saibamen.
  - Namekians: Nail and Dende.
  - Frieza Force: Cui, Dodoria, Zarbon ×2 and Appule.
  - Ginyu Force: Guldo, Recoome, Burter, Jeice and Captain Ginyu.
  - Frieza ×5: first, second, third and final forms, plus 100% Full Power.
  - **Bardock** arrives only as a Mystery Gift after the Saiyan Saga.
- **Fighting styles:** Striker beats Blaster, Blaster beats Defender, Defender beats Striker; Tactician has no edge and
  no weakness. Each style has a trait:
  - **Striker:** melee +12%, dashes in twice as fast.
  - **Blaster:** ki +12%, ki techniques cost 15% less.
  - **Defender:** takes 10% less damage; slower guard drain and a wider perfect-guard window.
  - **Tactician:** ki recovers 50% faster and techniques cost 15% less.
- **Abilities and Leader Skills.** Abilities: Saiyan Zenkai (survive a finishing blow once and come back stronger),
  Namekian Regeneration, Saiyan Pride, Hidden Potential, Third Eye, Afterimage, Healing Hands, Senzu Stash, the Ginyu
  Force Pose and more. Leader Skills boost a faction (Z Fighters, Saiyans, Frieza Force, Ginyu Force), a race or the
  whole party.
- **Growth:**
  - Levels come from training gear: Milk Crates, Turtle Shells, Weighted Clothing and Gravity Capsules.
  - **Zenkai Awakening** (two stages) raises the level cap; it costs Rainbow Z Orbs.
  - Technique levels cost Z Orbs.
  - **Limit Break** comes from summoning a fighter you already have.
  - **Proficiency** (from Gekitōden) has three tracks, Melee, Ki and Guard, each up to level 10. They rise from hits
    landed and guards made in battle, and from Scrolls.
- **Modes:**
  - **Training Grounds:** King Kai's Planet, Kami's Lookout and the Gravity Chamber, six levels each. They pay
    Melee, Ki and Guard Scrolls and training gear.
  - **World Martial Arts Tournament:** 30 matches, with a champion every fifth.
  - **Scouter Rankings:** challenger fighters with titles, Battle Power and a universal ranking.
- **Summon** with Dragon Stones or Summon Tickets: the seven Dragon Balls glow and Shenron rises. There's a
  daily featured 5★, a pity rate, and Z Medals from duplicates.
- **Meta:**
  - **Mailbox:** Bulma's welcome gifts (ten free Summons and Shenron's Wish for a 5★), daily login gifts from Kame
    House, letters from the cast and Rank gifts from King Kai.
  - **Z Records:** tiered achievements with rewards.
  - **Scouter Card:** your look (15 to pick from), Battle Power, a Dragon Ball for every chapter cleared, and a
    completion panel.
  - Also: Daily Training missions, the Capsule Corp. shop, Stamina and Senzu Beans.
- **Minigames** (from Gekitōden), each scored with three stars:
  - **Snake Way** and **Catch Bubbles** are runs: tap to jump.
  - **Dodoria's Chase**, **The Dragon Ball in the Lake** and **Escape from Namek** are flights or swims: hold to
    climb (or dive), let go to drop.
- **Demo:** a hands-free playthrough of the whole game to 100%, in a sandbox that sets your own save aside.
  - A pointer shows everything it taps: the stages on each field, the command cards and GO, GUARD, VANISH and
    POWER, the minigame buttons, and a wandering enemy.
  - Modes: Highlights, Watch all or Fast. Start it from the title screen or the Scouter Card.

## Terms

| Generic | In this game |
|---|---|
| Energy | Stamina (refilled by a Senzu Bean) |
| Gacha currency | Dragon Stones, Summon Tickets |
| Gold | Zeni |
| Duplicate currency | Z Medals |
| Shop | Capsule Corp. (Capsule Points) |
| Promotion | Zenkai Awakening (Rainbow Z Orbs) |
| Skill level | Technique level (Z Orbs) |
| Duplicates | Limit Break |
| Achievements | Z Records |
| Profile | Scouter Card |
| Team power | Battle Power |
| Ranked mode | Scouter Rankings (Ranking Points) |
| Tower | World Martial Arts Tournament |
| Material stages | Training Grounds |

## Source

The game is built from `src/` by `sh dragonball/src/build.sh` (never edit `index.html` by hand). Parts, in order:
`a1_head.html` CSS · `a2_core.js` utils, icons, items, statuses · `a3a_roster.js` characters and techniques ·
`a3b_kits.js` unit table and enemies · `a4_story.js` story, modes, shop · `a5_art.js` fighter renderer ·
`a5b_dbz.js` cards, Dragon Balls, Shenron · `a6_state.js` save and progression · `a7_engine.js` battle rules ·
`a8a_render.js` battle map (overhead places, heads, shots) · `a8c_sfx.js` sounds · `a8b_battle.js` battle director and HUD ·
`a8d_field.js` field and minigames · `a9a`/`a9b` screens · `a9c_meta.js` Mailbox, Z Records, Scouter Card, title ·
`a9d_demo.js` demo · `a10_boot.js` launchers, actions, boot.

Tests: `node dragonball/tests/phone.js` (a phone playthrough), `node dragonball/tests/figures.js` (the figure
gallery), `node dragonball/tests/sim.js` (balance, no browser) and `node dragonball/tests/demo.js` (the demo to 100%
in Fast mode). Screenshots go to `dragonball/tests/shots/`.
