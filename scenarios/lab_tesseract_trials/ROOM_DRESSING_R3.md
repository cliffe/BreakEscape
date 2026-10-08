# The Keyholder Trials: room dressing, round 3 of 3

Date: 2026-10-06. Method: `.claude/skills/mission-room-dressing/SKILL.md` (survey, critique, fix, verify). Nothing committed.

Scope: the orchestrator's round-3 list. Front-on workshop machines, the common room sofa, the Returns Slip wording, the Floor Directory menu, retiring unused sprites, a last look at every room, and a whole-mission layout pass. Only this mission uses the `room_uni_*` maps.

Evidence in `build_evidence/dressing_r3/`:
- `before/contact_sheet.png` and `after/contact_sheet.png` (all 11 maps), plus `before/` and `after/` renders of the four changed rooms;
- `pixellab/b4-contact.png`, `b4-items.json` (the batch);
- `retired/` (the ten PNGs taken out of the game);
- `ingame/REPORT.md` (whole-mission layout pass, game 1630, all 12 rooms' screenshots) and `ingame/CONFIRM.md` (Floor Directory confirmation, game 1631).

## Critique (survey before any change)

| Room | Problems found |
|---|---|
| Workshop | Laser cutter, island workbench, electronics bench and CNC mill all drawn at an angle: four, against the user's one-or-two. Laser cutter and island bench were the most obviously isometric. No fire point. |
| Common room | Sofa (`uni_sofa1`) angled. The front-on spare (b3 #14) came with a rug drawn under it. |
| Sidhu's office | In game nothing is south of the office, so its whole floor shows, and the lower half (y 128-180) was bare carpet. The builder docstring said only y 64-128 was visible; it was wrong. |
| Seminar room | Sparse back wall (windows and whiteboard only) and nothing on the side walls. The NE floor is where Sidhu stands, so floor additions have to go west or south. |
| Library | Slip observation says "tucked in" the book; they now lie apart on the counter. The book's "bookmark holder" line implied the same. |
| Corridor | Round 2 saw a Floor Directory menu once near the Sidhu door. |
| Others | Foyer, teaching lab, lecture theatre, Special Collections and staff office: nothing new. Each has two angled props or fewer (see Verify, item 12). |

## Changes, per room

**Workshop** (`room_uni_workshop`)
- Laser cutter, island bench, electronics bench and CNC mill replaced by front-on redraws (`laser_cutter2`, `it_workbench2`, `electronics_bench2`, `cnc_mill2`, PixelLab b4). The room now has no angled props.
- Island bench moves 4 px right (x 128) to keep its 52 px width centred in the hazard square. The Relay Terminal (pc5) still lands on it, first in its layer.
- Laser cutter x 190 → 196 (narrower sprite, same right edge); CNC mill feet 190 → 196 (taller sprite, clears the drawers).
- Fire alarm call point on the east wall.

**Common room** (`room_uni_common`)
- Sofa swapped for `uni_sofa2` (b3 #14, front-on blue two-seater). I erased the rug pixels under it by hand; nothing was rescaled. Same spot.

**Sidhu's office** (`room_uni_office`)
- Lower half: a small meeting table with a chair each side, facing it (pens and a mug on top), a large plant in the SW corner, a bin beside the desk, and a fire call point on the east wall with an extinguisher below it.
- A research poster on the west wall below the door row (`uni_poster8`, hand-drawn: a chain of three hashed blocks; Sidhu works on blockchain).
- The W-to-N route (y 100-128) stays clear; the plant's leaves reach y 102 only at x 32-70, below the W door.

**Seminar room** (`room_uni_seminar`)
- Radiators under both windows, a wall clock, a fire call point on the east wall, the room's booking sheet on the west wall, and a stack of spare chairs between the water cooler and the south row of chairs. No floor additions in the NE, where Sidhu stands.

**Library** (text only, `scenario.json.erb`)
- Returns Slip: "Left on the returns counter, beside a returned copy of The Codebreakers. Trial VI. Shift: the number of this Trial."
- The Codebreakers: "David Kahn's history of secret writing, just returned. A slip of paper lies further along the counter."
- Ids, types, slots, text and puzzle links are unchanged. Observations aren't voiced.

**Corridor** (`room_uni_corridor`)
- The menu was real but narrow. The engine adds a door to the tap menu when the tap is within 32 px of the door's centre. The directory's top 2-4 px rows were inside that radius, and the harness taps the sprite's top-left, which sat 0.3 px outside it. A tap there produced "Floor Directory" + "Dr S. Selvarajan".
- Fix: `uni_directory1` redrawn at 16x15 (was 16x18), same feet (y 128), so its top edge is at y 113, 33 px from the door centre. I removed the title bar to keep a gap between the three arrow lines. The sign can't move lower: the foyer covers the corridor's bottom rows.

## Unused sprites retired

I grepped every scenario, map, script and the engine for each name, and checked every map's object gids against each tile id (allowing for each map's firstgid). No map, scenario or code uses any of these ten:

- the five on the orchestrator's list: `foosball_table1`, `freshers_stall1`, `display_case2`, `plan_chest1`, `printer_3d1`;
- five more this mission made and has now replaced: `display_case1` (round 1), `uni_sofa1`, `laser_cutter1`, `electronics_bench1`, `cnc_mill1` (this round).

Each was removed from:
- `catalog.json` and `tilesets_ref.json`;
- its `<tile>` block in `objects_hospital_extras.tsx`;
- the `game.js` preload.

None was in `WALL_MOUNTED_EXTRAS`. The PNGs were deleted and copies kept in `build_evidence/dressing_r3/retired/`.

`it_workbench1` stays: `room_hospital_office_it` uses it.

Gids: the extras tileset is an image collection with explicit tile ids, so removing entries renumbers nothing. Every remaining tile keeps its id and gid, and `tilecount` is now the entry count (185). `register_object.py` gives new tiles max id + 1 (195 next), so the retired ids 145-180 are never reused. I regenerated all 11 uni maps to refresh their embedded copy of the tileset. Every map's object list (layer, gid, x, y) is identical before and after.

## New assets

| Name | How | Size | Used in |
|---|---|---|---|
| `laser_cutter2` | PixelLab b4 #1, trimmed only | 46x60 | workshop |
| `it_workbench2` | PixelLab b4 #2, trimmed only | 52x60 | workshop |
| `electronics_bench2` | PixelLab b4 #4, trimmed only | 42x55 | workshop |
| `cnc_mill2` | PixelLab b4 #6, trimmed only | 41x57 | workshop |
| `uni_sofa2` | PixelLab b3 #14 (round 2 spare), rug pixels erased, trimmed | 62x38 | common room |
| `uni_poster8` | hand-drawn, `make_uni_props.py` | 16x21 | Sidhu's office (`--wall`) |
| `uni_directory1` | redrawn, `make_uni_props.py` | 16x15 (was 16x18) | corridor |

**PixelLab spend: 20 generations** (one batch, b4). Balance 4164/5000 before, 4144/5000 after.
- Canvas 64, refs `printer_3d2` and `plan_chest2` (both front-on). Eight prompts: two phrasings each of laser cutter, workbench, electronics bench and CNC mill, all "orthogonal, front-facing, square to the wall, no isometric angle".
- Spares, kept in the contact sheet only: #0 (boxy laser cutter), #3 (wall bench with pegboard), #5 (wooden electronics desk), #7 (CNC router), #9 (blue laser cutter), and small bench-top pieces #8, #10-15 (vinyl cutter, soldering station, hot-wire cutter, large-format printer, bench PSU and meter, ultrasonic bath, heat press).

## Checks

| Check | Result |
|---|---|
| `generate_rooms.py` (all 11) | no errors. New warnings are hints I left: the office's table, chairs and extinguisher are "in the bottom 2 rows", which are visible floor because nothing is south of the office (confirmed in game). The seminar clock is "where a N door is drawn", but the seminar has no N door (a false alarm, like round 2's bunting). "Only one floor plant" in the office: one fits. The two seminar radiators touch the bottom row of the window blinds, as a sill, deliberately. Known: corridor wall pairs; lab and lecture-theatre bottom-row hints; lecture ledge/seat overlaps. |
| `check_room_walls.py --scenario` | 0 maps off the standard |
| `check_door_alignment.py` | 10/10 OK |
| `slot_audit.py --notes` | 0 problems, 0 notes prompts; pc5 still lands on the island bench |
| `validate_scenario.rb --skip-ink --no-graph` | exit 0, no errors, room layout geometry OK; warnings are the scenario's existing ones |
| `game.js` | `node --check` OK; diff from this round is +5 loads (new sprites), +1 (`uni_poster8`), −10 (retired) |

## Verify (in game)

**Whole-mission layout pass** (Sonnet, game 1630, keyless :3001; `ingame/REPORT.md`): 12 of 12 pass.
- The foyer, common room, teaching lab, lecture theatre and staff office were checked on the untouched game. All 11 rooms were then unlocked server-side for layout (disclosed).

1. All 11 rooms screenshotted (library east and west).
2. Workshop: the four new textures, the fire point and `printer_3d2` are present, and the old textures are absent. Relay Terminal, Scoreboard and Build screen each open directly. Cliffe is clear of the machines by about 8 px (CNC, printer) and 15 px (hazard square), and his chat opens. The loop round the island is clear.
3. Common room: `uni_sofa2` present, `uni_sofa1` gone. Megan and Cliffe are clear; all five taps open directly. Megan's elbow meets the foosball handle tips, with no body overlap.
4. Sidhu's office: every new item is in place. The W door to N door walk and back is clear. Door Card and Handout open directly.
5. Seminar room: every new item is in place. Sidhu is clear of the chairs; his chat and the Ledger Whiteboard open directly.
6. Library: the new wording shows on both. Book and slip each open directly.
7. Floor Directory: the menu sliver described above (fixed, see the confirmation run).
8. Every scenario object opens with no pick-one menu, except Tag on the Drop Box (the intended pair).
9. NPCs are clear of furniture in every room.
10. Every door was crossed both ways. Each took one `enter` call, first time: the harness side-door fix now holds.
11. 358 sprites scanned: no missing textures, no decor duplicates, none of the ten retired textures. 0 console errors and no "No Tiled item found" logs. The only 4xx/5xx were TTS 503s (25, expected on keyless).
12. No room has more than two angled props:
    - library: two (check-in kiosk, returns trolley);
    - foyer, teaching lab, lecture theatre, corridor, Special Collections, seminar room and staff office: one each;
    - common room, Sidhu's office and workshop: none.

**Floor Directory confirmation** (Sonnet, game 1631, fresh, rooms unlocked server-side; `ingame/CONFIRM.md`): 4 of 4 pass.
- `uni_directory1` is 16x15, top-left at world (292,-15), and draws cleanly.
- A 2 px tap sweep over the whole sprite (180 taps from two standing spots by the door) and two `interact` calls all opened the directory directly, with no menu.
- The Sidhu door crosses first time both ways. 0 console errors; TTS 503s only.

Harness quirks seen (not fixed; another agent owns the harness):
- `moveToNear` returned `ok:false` for Oleg from 248 px away, although `interact` then reached him.
- `moveTo` often stops short, and `walk` is capped at about 1.5 s.
- A leftover interaction menu makes later taps report the same menu; `window.closeInteractionMenu()` between taps clears it.
- `mg close` reported no active minigame while the photocopier container was still loading.
- The Door Card's DOM dialog reads as "no effect".

## What's left, and why

- **Library check-in kiosk**: angled, and its top edge touches the wall base line (borderline overlap). It's one of the room's two allowed angled props. A front-on kiosk would take a few generations if the user wants it.
- **Workshop lower band** (y 222-256) is bare on purpose: it's Cliffe's approach from the east lane. The bottom rows are covered by the corridor.
- **Seminar bean bags**: kept, a judgement call since round 1.
- **Stale planning lines** about the slip being "tucked in" the book: `ROOMS_PLAN.md:255` and `DESIGN.md:151`. Left as history; the summary at the end of ROOMS_PLAN.md records the change.
- **Validator warnings** listed under Checks are hints I've explained, not faults.

## Assumptions

Assumption: retiring the five sprites made unused by this mission's own replacements (display_case1, uni_sofa1, laser_cutter1, electronics_bench1, cnc_mill1) is within "unused registered sprites", since no map, scenario or code uses them and copies are kept.
Assumption: the electronics bench and CNC mill were only mildly angled. I replaced them anyway, because one batch covered all four at no extra cost and the user prefers front-on.
Assumption: erasing the rug pixels from b3 #14 is an edit, not a rescale, so it keeps to the no-rescaling rule.
Assumption: the book's observation change is part of item 3's "fix the wording", because its "bookmark holder" line implied the slip was inside it.
Assumption: dropping the directory's title bar is acceptable, since its arrows and blue panel still read as a directory, and its text is unchanged.
