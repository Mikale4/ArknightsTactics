# Arknights Tactics Mobile

A phone-first rebuild of Arknights Tactics. It uses the turn-based combat rules of the original
(`arknights_tactics_v40_…html`) with the 3D battle camera from Galactic Heroes, and adds an
Epic Seven–style progression loop around it.

Play: open `mobile/index.html` (on GitHub Pages: `/ArknightsTactics/mobile/`). Progress saves in the browser.

## What's in it

- **Story**: Episode 1, *Embers of Chernobog*, in five chapters. Each chapter is a winding node map
  with story, battle, side-story, supply and boss nodes, plus character dialogue before and after fights.
  Battles award up to three stars: win, no operator falls, win within the turn goal.
  Three stars unlock sweeps. Clearing a chapter recruits a new operator or pays Orundum and permits.
- **Battle**: four-operator squads, turn gauges, three skills each, leader skills, element advantage
  (Fire > Wind > Water > Fire, Light and Dark counter each other), status effects, rune set bonuses
  and auto battle with three AI styles. Operators are drawn from their sprite art; the camera cuts
  to each attacker and target, and in portrait it fits all units on screen.
- **Headhunt**: featured banner (rotates daily) and standard banner, ×1 and ×10 pulls with
  Orundum or permits, 6★ pity after 50 pulls, and a guaranteed 5★ in your first ten-pull.
- **Operators**: 239 operators. Level them up with battle records, promote them to Elite 1 or 2,
  rank up their skills, raise potential with duplicates, and equip two runes each.
- **Battle hub**: rune Hunts (three hunts, six levels), a 30-floor Tower of Trials, and an Arena
  with ranks, attempts and a timed payout.
- **Lobby**: an assistant operator (tap them), missions with daily and achievement rewards, a shop
  with Orundum, Certificate and Arena Medal tabs, and a depot.

## Files

- `mobile/index.html` is the whole game: HTML, CSS and JS in one file.
- `assets/sprites/<slug>.webp` holds battle and lobby sprites, and `assets/heads/<slug>.webp` holds portrait icons.
  Both sets are generated from the battlecard art.

Unofficial, non-commercial fan game. Arknights characters and art belong to Hypergryph and Yostar.
