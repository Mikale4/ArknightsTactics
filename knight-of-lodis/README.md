# The Knight of Lodis HD

An HD voxel mock-up of the battle screen from **Tactics Ogre: The Knight of Lodis** (Game Boy Advance, 2001).
It is a generic battlefield with two armies:

- **Alphonse's side:**
  - Alphonse (Knight): blue-violet hair, light armour, a gold sash.
  - Eleanor (Cleric): blonde, a white and blue dress, a green ribbon.
  - Ivanna (Knight): silver hair, red armour.
  - Rictor (High Priest): Alphonse's friend and commander. Blonde, with a blue cloak, a white shirt and green trousers.
  - Generic troops: a Soldier, an Archer and a Wizard.
- **The enemy:** a Knight (the leader), two Soldiers, an Archer, a Witch, a Hawkman and a Gremlin.

The field has a shallow stream with a wooden bridge, a dirt road, trees and boulders, and a ruined hilltop with
fallen pillars. Everything is drawn from voxels in the browser; nothing is copied from the game. Unofficial fan
mock-up.

## Controls

- **Tap** a unit to see its status. For your units, tap Move, Attack, a spell or Wait.
- **Drag** to pan, **pinch** or **+/−** to zoom, and **⟲ ⟳** or a two-finger twist to turn the map. On a desktop,
  right-drag or Shift-drag turns it and Q/E turn by 90°.
- **End Phase** hands the turn to the enemy, who closes in and attacks.
- **Auto** (or the A key) lets your side fight on its own, turn after turn, until you switch it off. Control comes
  back after the unit that is acting. Your side plays carefully:
  - The Cleric and the High Priest heal anyone badly hurt, Alphonse first.
  - Before stepping somewhere to attack, a unit weighs how many enemies could strike back there.
  - Alphonse stays out of harm's way, since losing him loses the battle.
  - With nothing to hit, the line holds just out of reach and then presses on from turn 4.
  - The enemy Knight is everyone's first target.

  He holds the ruined hill and only steps down to strike. In testing, Auto won 5 of 6 battles, in 5 to 12 turns.
- **1× / 2× / 3×** (or the S key) sets the battle speed.
- You win when the enemy Knight falls and lose when Alphonse does.

## How it is built

`index.html` is the whole thing. It loads three.js r160 from jsDelivr and needs no build step.

- **Terrain:** 1-unit voxels, 8 per tile side and 4 per height level. Every exposed face is meshed with per-corner
  ambient occlusion, and the whole field gets soft shadows.
- **Units:** sculpted at half that voxel size from parts: body, hair styles, helmets, hoods, hats, capes, weapons
  and shields.
- **Water:** an animated surface.
- **Rules:** a small model of the game's. Movement uses move points and jump height, and the stream costs extra.
  Attacks get bonuses for height and for striking from behind. The spells (Heal, Heal Plus, Exorcism, Fireball and
  Ice Javelin) are names from the game.
