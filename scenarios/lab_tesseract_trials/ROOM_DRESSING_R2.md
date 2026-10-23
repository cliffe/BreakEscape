# The Keyholder Trials: room dressing, round 2 of 3

Date: 2026-10-06. Method: `.claude/skills/mission-room-dressing/SKILL.md` (survey, critique, fix, verify). Nothing committed.

Scope: the orchestrator's round-2 list (library fix and enlargement, common-room games corner, foyer fair, corridor, workshop screen, the Copy-button wording after engine fix E6), then the user's art-direction feedback that arrived mid-round (below). Only this mission uses the `room_uni_*` maps.

Evidence in `build_evidence/dressing_r2/`:
- `before/contact_sheet.png` and `before/grid-room_uni_*.png` (the six rooms changed);
- `after/contact_sheet.png` (all 11 maps, final) and `after/grid-room_uni_*.png`;
- `new-assets-4x.png` (every new sprite at 4x);
- `pixellab/b2-contact.png`, `b3-contact.png` and their `items.json`;
- `ingame/REPORT.md` (main layout check) and `ingame/CONFIRM.md` (confirmation run after the user's feedback), with screenshots.

## User feedback received during the round, and what was done

Relayed by the orchestrator: prefer orthogonal, front-on props over isometric/angled ones (one or two angled things per room is fine); most rooms look good; fix three.

| Feedback | Done |
|---|---|
| Orthogonal art from now on | Batch b3 prompts all say "orthogonal top-down view, front-facing, square to the wall, no isometric angle", with front-on references (bookcase, filing cabinet). All hand-drawn props are front-on. The angled foosball from round 1's batch was swapped for an orthogonal one too. |
| Foyer: purple stall `freshers_stall1` doesn't match | Replaced by `freshers_stall2` (b3 #0): a front-on table with the purple cloth hanging straight down, leaflets and a sweet jar. Same spot. |
| Special Collections: angled display case and plan chest | `display_case3` (b3 #3, low glass case of 1970s tapes) and `plan_chest2` (b3 #4), both front-on. The case also moves from x 24 to 34 so it no longer overhangs the west wall. |
| Workshop: angled 3D printer overlapping the wall | `printer_3d2` (b3 #6, front-on printer on a stand). The printer, the CNC mill and the parts drawers all stood from x 24-28, over the west wall; they now start at x 32, on the floor. |

Angled pieces left, one or two per room as the user allows: the common room sofa; the library periodicals stand; the workshop's laser cutter, island workbench, electronics bench and CNC mill (the user called the workshop "mostly fine"; it has more than two, see round 3).

## Critique (survey before any change)

| Room | Problems found |
|---|---|
| Library | Book and Returns Slip 15 px apart: a pick-one menu on either tap (round 1 fail). One shelf run, a desk and a kiosk: read as an office with books. The "LIBRARY / QUIET" sign's second line ran into the sign's rim and read "OUITFT". |
| Common room | No games corner; Megan's spot and the sofa took the free floor. |
| Foyer | West half empty apart from walk lanes: the S-door column (x 32-64), the W-E lane (y 64-128), Jordan (x 101-129) and the spawn. Only walk-through items fit there. |
| Corridor | Bare floor; the back wall is full of interactables between x 58 and 240. Only two floor rows (the foyer covers the rest), so no bench fits. |
| Workshop | The "landscape painting" is the claimed slot for "Dr Schreuders' Build". In game the scenario's `"sprite": "info_screen1"` drew a 40x28 calendar screen in the corner of the 48x34 slot, which matches neither the slot nor the observation ("A map of this building. One of the little figures is wearing your hoodie"). |
| Others | No new problems. Known warnings unchanged (see Checks). |

## Changes, per room

**Library** (`room_uni_library`): now 20x6 (was 10x6), doubled westwards.
- Engine placement (`check_door_alignment.py`): a west neighbour sits at `x = corridor.x - width`, top aligned, so the library moves to world x -640..0 and its E door and NE door stay at the same world points; Special Collections stays at (-320,-384). Validator: "Room layout geometry OK". Nothing else is west of the teaching lab.
- East half keeps front of house (shifted 320 px): shelves, LIBRARY sign, a new RETURNS sign, the issue desk with lamp and issue PC, a second desk as the returns end, librarian's chair, kiosk.
- **Fix:** the book sits at the counter's join (top-left x 480) and the slip at the far end (top-left x 524): each top-left is 33-35 px from the other's centre. In game both open directly, no menu.
- West half, a reading room: periodicals stand and shelves on the back wall, two study carrels under a STUDY AREA sign (solid, tables layer), a radiator, a long reading table (two desks) with green lamps, a journal stack and four chairs, the returns trolley.
- No `book*` or `notes*` decor anywhere in the map, so nothing outranks the real slots.
- Generator: a `20x6_hall` template derived from `10x6_hall` with the same column map as `20x10`.

**Common room** (`room_uni_common`)
- Games corner by the W door: `foosball_table2` (top-down, x 40-88, feet 196, solid) and a dartboard on the west wall.
- Megan moves from tile (2.4, 7.6) to (3.1, 5.7), about 2 tiles, to play at the table's east side. Her ink (`npc_megan.ink`) names no place. This is the one change to `scenario.json.erb` positions.
- Sofa and low table move to the bottom-left, below the foosball; Cliffe's spot is untouched and still clear.

**Foyer** (`room_uni_foyer`)
- Bunting either side of the crest, above every wall item.
- The Cyber Security Society's pull-up banner (x 70, feet 250) and a bunch of balloons (x 66, feet 196), both walk-through, in the column between the S-door lane and Jordan.
- A CTF society poster on the west wall.
- The stall replacement (above).
- Spawn, W-E lane and S lane: the playtest walked spawn to the S door and back with no snag.

**Corridor** (`room_uni_corridor`)
- Radiator under the "verify" poster, a wall drinking fountain and a blue FIRE DOOR KEEP SHUT sign beside the workshop door (all wall items, clear of the NE door corner).
- A walk-through wet-floor sign at the W end, below the W door row.
- No bench: the two floor rows are a four-way through route, and the back wall is all interactables.

**Workshop** (`room_uni_workshop`)
- The slot is now `smartscreen2` (hand-drawn): a wall screen showing a floor plan of the building drawn from the real world layout, small figures, yours in yellow in the workshop beside a stranger. `"sprite": "info_screen1"` is removed from `cliffe_build_screen`, so the slot draws its own art. The id, type, `as-type:smartscreen` slot and text are unchanged.
- The machine column moves and the printer is replaced (above).

**Special Collections** (`room_uni_special`): case and chest replaced (above).

## Text: the Copy-button advice after E6

E6 made Add to Notepad store the raw file text, so "it adds a header and footer" is no longer true. The advice now rests on what still holds: a hand selection, on screen or from the notepad, picks up stray text. The notepad also shows a typed " -- " as a dash. No puzzle content changed.
- `scenario.json.erb`: the nine text-file observations ("For the code itself, use the file's Copy button: a hand selection, on screen or in your notepad, can pick up stray text."), FN1 step 1, FN6, `trial_vii.txt` and `staff_list.txt`.
- `ink/phone_agent_0x99.ink:310` (hint rung): "Copy the ciphertext with the file's Copy button, and nothing around it." Recompiled with `bin/inklecate`. `tagdiff`: structure unchanged, one prose line. inkcheck, loopcheck, reopencheck and dialoguelint: clean. **Spoken-line note:** this is one HaX phone line; if HaX's lines are voiced, its TTS cache entry is invalidated.
- `SOLUTION_GUIDE.md` lines 49, 237, 261, 425, 471, 522 and `TESTING_WALKTHROUGH.md:96`: rewritten around "extra text copied with the ciphertext". Line 237 notes the old wrapper behaviour as history.

## New assets

| Name | How | Size | Used in |
|---|---|---|---|
| `uni_bunting1`, `uni_bunting2` | hand-drawn | 104x10, 64x10 | foyer (`--wall`) |
| `uni_banner_soc1` | hand-drawn | 22x58 | foyer |
| `smartscreen2` | hand-drawn | 48x34 | workshop (`--wall`) |
| `uni_fountain1`, `uni_radiator1`, `uni_firedoor_sign1` | hand-drawn | 14x22, 26x10, 11x11 | corridor; radiator also library (`--wall`) |
| `uni_dartboard1` | hand-drawn | 16x16 | common room (`--wall`) |
| `uni_sign_returns1`, `uni_sign_study1` | hand-drawn | 32x11, 44x11 | library (`--wall`) |
| `uni_sign_library1` | redrawn, same size | 44x14 | library ("QUIET" legible) |
| `study_carrels1`, `periodicals_rack1`, `balloons1` | PixelLab b2 #1, #2, #4, trimmed only | 57x58, 48x52, 32x59 | library, foyer |
| `freshers_stall2`, `display_case3`, `plan_chest2`, `printer_3d2`, `foosball_table2` | PixelLab b3 #0, #3, #4, #6, #9, trimmed only | 62x47, 56x45, 52x46, 38x57, 48x57 | foyer, Special Collections, workshop, common room |

All registered with `register_object.py`, which edited catalog.json, tilesets_ref.json, objects_hospital_extras.tsx and the `game.js` preloads. `make_uni_props.py` holds the hand-drawn ones.

**PixelLab spend: 40 generations** (b2 20, b3 20). Balance 4204/5000 before, 4164/5000 after.
- b2 (canvas 64, refs bookcase and freshers_stall1): carrels, periodicals, balloons, A-boards, low stacks. Rejected the A-boards (#6, #7): 49 px, nearly a person's height. Other usable frames are kept in the contact sheet: #0 carrels with lamps, #11 prize wheel, #14 single carrel.
- b3 (canvas 64, refs bookcase and filing_cabinet, orthogonal prompts): spares are #1 (teal stall with a logo), #2 (display cabinet), #5 (map cabinet), #7 (enclosed printer), #8 (foosball without handles), #14 (front-on sofa, could replace the angled `uni_sofa1`).

`foosball_table1` (round 1's angled frame, installed and registered early this round) is now unused. `freshers_stall1`, `display_case2`, `plan_chest1` and `printer_3d1` stay registered but are unused by this mission. I didn't unregister any of them.

## Checks

| Check | Result |
|---|---|
| `generate_rooms.py` (6 rooms) and `--check` (all 11) | no errors. New warnings, all false alarms: the bunting in the foyer's NE corner and the periodicals stand in the library's NW corner, where those rooms have no north door. Known: corridor poster/noticeboard and drop box/tag pairs (deliberate); lecture-theatre ledge/seat overlaps and the lab and theatre "bottom 2 rows" hints (nothing south of them; round 1). |
| `check_room_walls.py --scenario` | 0 maps off the standard |
| `check_door_alignment.py` | 10/10 OK, library now 20x6 |
| `slot_audit.py --verbose --notes` | 0 problems, 0 notes prompts; book and slip land on the counter, the build screen on `smartscreen2` |
| `validate_scenario.rb --no-graph` | exit 0, no errors, room layout geometry OK; warnings are the scenario's existing ones |
| `game.js` | `node --check` OK; the diff is only the 19 new `this.load.image` lines |
| Ink | above |

## Verify (in game)

Two Sonnet playtests on the keyless :3001. Corridor, library, Special Collections and workshop were unlocked server-side for layout, after the foyer and common room had been played on the untouched game (disclosed in both reports).

Main run (game 1626, `ingame/REPORT.md`): 6 of 7 items pass.
- Foyer: bunting, balloons, banner and poster sit where intended, with no physics bodies. Jordan stays clear. Spawn to the S door and back: no snag.
- Common room (before the foosball swap): every tap opened directly; Megan's chat works.
- Corridor: new items placed. Poster, pigeonholes and drop box open the right thing. The tag shares a menu with the drop box (intended pair). The Floor Directory raised a menu once when the tester stood near the Sidhu door (entries not captured).
- **Library: book and slip each open directly with both in the room: round 1's fail is fixed.** Carrels and reading table block, trolley and chairs don't. East door to the west end and back, and to Special Collections, all clear.
- Workshop (first in-game look): the build screen is texture `smartscreen2` and its observation opens. Scoreboard and Relay Terminal open their pads. Cliffe is clear of the machines.
- Console: 0 errors, one expected TTS 503, no missing textures, no decor duplicates, no "No Tiled item found" lines. The log hook went in after the first load, so the opening foyer load wasn't covered.

Confirmation run after the user's feedback (game 1627, `ingame/CONFIRM.md`): 6 of 6 pass.
- `freshers_stall2`, `foosball_table2`, `display_case3`, `plan_chest2` and `printer_3d2` are in place; the old textures are absent.
- Megan's sprite centre is at (419,151). She clears the foosball (about 1 px), the sofa and the vending machine. Megan, Snack Machine, Locker 4, Cliffe and his laptop all open directly.
- Safe pad opens directly; the east lane in Special Collections walks clean.
- Workshop column starts at x 32; Cliffe is clear and his chat opens.
- No console errors, no missing textures.

**Side doors** (does the harness change make `enter` cross first time?):

| Crossing | Main run | Confirm run |
|---|---|---|
| foyer → common room | 2 | 1 |
| common room → staff office | 3 | – |
| foyer → teaching lab | 2 | – |
| corridor → library | 2 | 3 |
| library → Special Collections (N) | 2 | 1 |
| corridor → workshop (N) | 2 | 1 |
| foyer → corridor (N) | – | 1 |
| foyer → lecture theatre (S) | 2 fails, then moveTo + walk | – |

- Return crossings through an opened door gave `no-known-doorway` in both runs and were walked by hand.
- The main run's side doors never crossed first time. The confirmation run crossed first time on most doors, but corridor → library still took 3.
- So the harness change is not yet reliable. This is in the harness, not the maps.

## What's left, and why

- **Workshop angled machines** (laser cutter, island workbench, electronics bench, CNC mill): more than the user's "one or two", though the user called the room mostly fine. Round 3 could regenerate the two most visible as front-on (about 20 generations).
- **Common room sofa** is angled; b3 #14 is a front-on spare if the user wants it swapped (no new spend).
- **Library observation text:** the slip still says it was "tucked in a returned copy of The Codebreakers". It now lies on the same counter, 35 px from the book. That's a text change outside this round's scope; suggest "Found with a returned copy..." if the orchestrator wants it exact.
- **Floor Directory menu** near the Sidhu door: once, from an odd standing spot; worth one targeted tap test in round 3.
- **Harness:** side-door `enter` (table above), `no-known-doorway` on return crossings, and `moveToNear` stopping 37-62 px short.
- **Corridor bench:** not possible in two through-route floor rows.
- **Unused registered sprites:** listed under New assets.

## Assumptions

Assumption: removing `"sprite": "info_screen1"` from `cliffe_build_screen` is a cosmetic change inside this round's scope, since the id, type, slot and text are unchanged and the old override contradicted the observation.
Assumption: the user's feedback, relayed by the orchestrator, counts as the user's go-ahead for up to about 100 generations this round; 40 were used.
Assumption: widening the library to 20x6 doesn't touch the puzzle graph: the same two objects land on the same base-type slots and every door keeps its world position. Checked by the slot audit, door alignment and the validator, not by a full playthrough.
Assumption: the HaX hint line I reworded may be voiced. I didn't check whether its audio is cached, so treat it as one changed spoken line.
Assumption: the empty `playtest2/` folder in the repo root (dated 3 October) predates this session; I left it.
