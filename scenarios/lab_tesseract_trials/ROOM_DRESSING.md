# The Keyholder Trials: room dressing

Pass date: 2026-10-06. Scope: object positions, sprites and room-level props in `scenario.json.erb` only. No map edits (all seven room types are shared with other scenarios) and no new art. No ids, locks, tasks, mappings or ink were changed.

Screenshots are in `build_evidence/dressing/`. "Before" is game 1591 and "after" is game 1592, both on the keyless :3001 server with every room unlocked server-side for the walk. The after shots were taken before any object was picked up, apart from the workshop, which was retaken after the scoreboard moved 4 px.

The main problem across the building was pins carried over from the walkability fix. Wall items (the Byte Wall, posters, whiteboards, the noticeboard, the floor directory) stood in the middle of the floor. Three objects sat in the strip of a room that the room to its south draws over, so they were hidden: the library's returns slip and book, Sidhu's whiteboard, and the corridor's floor directory. Sidhu himself stood half inside the common room's wall. Two objects drew a missing-texture box: Cliffe's laptop (`laptop` isn't a texture) and the Codebreakers book (`book1.png` is loaded under the key `book`).

## Per room

**Foyer** (`before-foyer.png`, `after-foyer.png`)
- The Byte Wall and its plaque are now on the back wall to the right of the reception desk. The plaque is the exhibit's label, so the two share a pick-one menu (validator warning 39, left on purpose).
- The Powers of Two poster is on the east wall, below the common-room door.
- A heritage display table (`desk1`, a scenario `table` with an empty `tableItems`, so it gets a collision box) holds the paper tape and the ASCII chart handouts. The handout's type went from `notes` to `notes4` so it no longer claims the reception desk's notes slot. A slot item keeps that desk's draw depth and would sit under the new table.
- The CryptoSecure lockbox is on the reception desk (the stand), not on the floor. Jordan is unchanged, in front of the desk.

**Teaching lab** (`before-teaching_lab.png`, `after-teaching_lab.png`)
- Dr Shaw's whiteboard is on the back wall beside the chalkboard, at the front of the class. It used to stand on the floor in the bottom-right corner.
- Tom now stands at the front of the class by the boards, in the strip the player enters from the east door. Earlier playtests found him hard to reach behind the desk row. `moveToNear tom_shaw` now arrives first time.

**Common room** (`before-common_room.png`, `after-common_room.png`)
- The noticeboard is on the back wall by the entrance.
- A snack machine (`vending_machine1`, new flavour object `common_vending_machine`) stands against the back wall next to candidate locker 4.
- The coffee station is against the east wall beside the chairs.
- Cliffe's laptop uses the `laptop1` sprite and sits on the front-right coffee table. Cliffe stands at that table, on open floor. Megan is unchanged.

**Corridor** (`before-corridor.png`, `after-corridor.png`)
- The Trial V poster is pinned on the back wall (`notes6` sprite) instead of lying on the floor.
- The pigeonholes are on the back wall. They used to stand in the middle of the corridor.
- The floor directory is on the back wall. It had been pinned inside the foyer's wall area.
- The drop box tag sits on the drop box. The drop box and its tag share a menu, which is fine because they belong together.

**Library** (`before-library.png`, `after-library.png`)
- The returned copy of *The Codebreakers* (now with the `book` texture) and the returns slip sit on top of the front bookcases, along the aisle. Both had been hidden under the teaching lab's back wall.
- The Special Collections safe is unchanged, in the gap between the back bookcases.

**Dr Selvarajan's office** (`before-sidhu_office.png`, `after-sidhu_office.png`)
- The ledger whiteboard is on the wall above his desk. It had been hidden under the common room's wall.
- Sidhu stands in front of his desk. He used to be half covered.
- The handout stays on its desk slot. The whiteboard is far enough from it that neither raises a menu.
- To read the board, the player walks into the gap between the bookcase and the desk. A click on the board from the floor walks there, and a second click opens it.

**Workshop** (`before-workshop.png`, `after-workshop.png`)
- The Hacktivity scoreboard is a wall screen (`conference_screen1` texture) on the back wall, top right. Before, it was a PC on the floor, half under the corridor's wall.
- Cliffe's build screen takes the map's own `smartscreen` slot (`as-type:smartscreen`, `info_screen1` texture), replacing the landscape picture that drew there.
- Cliffe stands at the end of his workbench (the lower desk).
- The relay terminal is unchanged.

## Checks (final ERB)

- `ruby scripts/validate_scenario.rb`: 0 errors. There are 10 warnings, 7 of them the build's deliberate ones. The 3 new ones are:
  - `tableItems` is not in the schema. The engine reads it (`rooms.js`, dynamic tables), and without it no table is made.
  - The Byte Wall and plaque are 21 px apart (the label pair above).
  - The display table and the ASCII handout are 9 px apart. A dynamic table isn't interactable, so this never raises a menu.
- `python3 scripts/check_door_alignment.py`: every door pair OK.
- Rendered verifiers: `verify_rendered_independent.py` gives ALL PASS for seeds 42, 7 and 1234.
- `slot_audit.py --notes`: 0 notes prompts. The NO SLOT lines are all pinned objects with explicit positions.
- In game (game 1592):
  - Every interactable in all seven rooms was approached and opened: the right minigame, examine view or lock came up for each. That covers the Byte Wall, the plaque, the poster, the ASCII handout, the tape, the lockbox, the sign-up laptop, Dr Shaw's whiteboard, both lab PCs, the noticeboard, locker 4, the snack machine, the coffee station, Cliffe's laptop, the Trial V poster, the pigeonholes, the floor directory, the drop box and its tag, the book, the slip, the safe, the ledger whiteboard, the build screen, the scoreboard and the relay terminal.
  - Every NPC was reached with `moveToNear`.
  - No missing textures in any loaded room and no "No Tiled item found" logs.
  - The only console errors were the expected TTS 503s and four 404s whose URLs weren't recorded. No asset failed to load.

## Left as is, with reasons

- The workshop's wall screens and Sidhu's board need the player to walk into the corner below them. A first click from the far side of the room can stop short behind the server cabinets or the desk, and a second click or a step closer opens them. Wall fixtures behave like this in the other missions too.
- Map decor in shared room types stays: the lamp stands in the lab and the library, the easel chalkboard in the lab and the workshop, and the workshop's bottom desk row, which the corridor draws over. Changing any of them means editing maps other scenarios use. The lamp stands are noted in ART_NEEDED.md.
- Harness quirks seen and not counted as findings:
  - keyboard `enter` into the lab sticks at the west door, but a pointer walk goes through;
  - `moveToNear` stops short of some wall items;
  - "mismatch" is reported when a locked container's password or PIN prompt opens, because the prompt's title differs from the object's name.
