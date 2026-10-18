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
