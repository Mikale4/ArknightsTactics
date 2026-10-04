# Galactic Heroes

A mobile-first HTML game in the style of Star Wars: Galaxy of Heroes. It's a single self-contained `index.html` with no build step and no external assets. Open it in a phone or desktop browser, or serve it with GitHub Pages.

Galactic Heroes is an unofficial, non-commercial fan game. It is not affiliated with Lucasfilm, Disney, EA or Capital Games. Every character, portrait and environment is drawn in code.

## What's in it

- **3D battles:** turn-meter combat on a canvas-rendered 3D battlefield. The camera is a side view in landscape and sits behind your squad in portrait. It sweeps in at the intro, pushes in on each turn, cuts to low-angle close-ups with a letterbox for specials, shakes on crits and orbits your squad on victory.
- **Animated characters:** 24 procedurally drawn heroes (12 Light Side, 12 Dark Side). They breathe while idle, dash in for saber strikes with blade trails, and fire blaster bolts. Some use Force lightning, Force choke and push, thermal detonators or flamethrowers. They react to hits and fall when defeated.
- **Combat rules:** basic and special abilities with cooldowns, unique passives and leader abilities. Status effects include stun, taunt, stealth, foresight, expose, damage over time, ability block and offense, defense and speed ups and downs. There are also assists, counterattacks, multi-wave battles, auto-battle and 1×/2×/3× speed.
- **Campaign:** Light Side and Dark Side battles, each with 6 chapters × 5 nodes and boss nodes. Nodes cost energy, earn 1–3 stars and can be simmed once 3-starred. Each node drops shards for a specific hero.
- **Progression:** character levels (training droids), 1–7★ promotion from shards, gear tiers I–XII and ability upgrades.
- **Squad Arena:** ranked AI opponents, payouts every 6 hours and Arena Shipments.
- **Store and dailies:** Chromium and Bronzium packs, refills, salvage, and daily activities.
- **Saving:** progress is kept in `localStorage`.

## Controls

In battle, tap an enemy to target it, then tap an ability to use it. Hold an ability or a unit to see its details. **AUTO** lets the AI play for you, **1×/2×/3×** changes the speed and **II** pauses or retreats.
