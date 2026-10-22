# m09 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/FINALE_BRIEF.md`. Inputs: stage 5 `room_layout.md` §2–§3, §8; `ASSET_LIST.md` §2 and §4; `CONTRACT.md` (the playtest R1 map swaps). Several rounds of dressing are planned, then lighting, then backgrounds (user, F23).

## Round 1 (2026-10-22): survey, plan, eleven maps built

### Survey

Every room ran on a shipped placeholder map of the right size, chosen for door clearance (the cage on `room_qdc_security` and the reading room on `room_uni_office` after playtest R1 B1). `slot_audit.py` gave 29 problems: every scenario object sat on an explicit tile position with no slot, so each was drawn as a stand-in sprite floating over whatever furniture the placeholder had there. Before renders: `dressing_r1/before/<map>.png`.

| Room | Placeholder | Size | Notes |
|---|---|---|---|
| loading_dock | `room_aes_dock` | 10×10 | Albion's battery dock; exit sign in the N door corner |
| front_desk | `room_reception` | 10×10 | purple waiting room, potted palms, orange chairs |
| open_stacks | `room_aes_hall1` | 20×10 | a battery hall (Rack Bank C), nothing of a records store |
| server_closet | `small_room_1x1gu` | 5×6 | suitcases and a bin on purple carpet |
| staff_passage | `room_qdc_hall` | 10×6 | QDC corridor, coffee machine |
| reading_room | `room_uni_office` | 10×6 | a university office |
| restricted_stacks | `room_hq_ops` | 10×10 | m08's ops floor; no counter, no strip, so Sorensen stood on open floor |
| restricted_cage | `room_qdc_security` | 10×10 | Patricia's office from m05 (CCTV desk, plant) |
| sorensen_office | `room_hce_office` | 10×10 | Irina's office from m06 |
| tape_room | `room_servers` | 10×10 | a purple server room with suitcases |
| salvage_cage | `room_hq_intel` | 10×6 | m08's intelligence room |

### Critique

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map belonged to another mission; nothing could be redressed without changing those missions. |
| A2 | All | major | Nothing said records warehouse, Helena, or night: purple carpet, landscape prints, plants, suitcases. |
| A3 | All | major | 33 objects pinned to tile positions over unrelated furniture (29 NO SLOT, 4 SIZE in `slot_audit`). |
| H1 | restricted_stacks | major | No hatch counter or sealed strip (S5 §3.6): Sorensen's static sprite stood in the open, and the stamp lay on bare floor. |
| S1 | open_stacks | major | A battery hall; no shelving bays, no H&L bay, so the label and boxes floated mid-floor. |
| C1 | restricted_cage | minor | The shredder line, feed table and ledger shelf were not furniture, just sprites at points. |
| T1 | tape_room | minor | No tape racks or reel deck; `tape_library1` stood in for a reel-to-reel deck. |

### Plan

1. Give m09 its own building, as m05 and m08 did: eleven `room_m09_*` maps from builders in a new module, `scripts/room_gen/m09_rooms.py`, hooked into `generate_rooms.main()` like `hq_rooms.py`. Same sizes, so room positions, door corners and NPC tiles do not move. The shipped placeholder maps are untouched.
2. Sheets from `scripts/room_gen/make_m09_tileset.py` (repaints of room6, all reading 64 on `check_room_walls`): old red brick in the warehouse rooms, cream plaster at the front desk and passage, library green in the reading room, walnut slats in the office, sage blockwork in the cage, blue-grey blockwork in the tape room, grey in the closet; one records-green line on every wall. Floors: night asphalt with bay lines and a hatched apron at the shutter; two-tone lino; sealed concrete with aisle lines (a 640 px sheet in two halves for the stacks); oak with a red rug; brown carpet with a rug; cold vinyl; stained concrete; a darker strip behind the hatch counter and a hatched stand-back line in front of it.
3. Every scenario object onto a real slot (`as-type`), explicit positions removed. NPC positions, patrols, ids and locks unchanged.
4. Art: hand-drawn flat props (`scripts/room_gen/make_m09_props.py`); one PixelLab call for the reel deck (ASSET_LIST §4), with the other usable frames of that call installed as dressing.
5. Props square to the walls. Angled items kept to the dock's cones and pallet truck.

### Per room: what changed

Map renders (32 px grid, 2×): `dressing_r1/maps/room_m09_<room>.png`, contact sheet `dressing_r1/maps/contact_sheet.png`. In game (game 3063, every room unlocked server-side by `lighting-tour.sh`, no lighting yet): `dressing_r1/ingame/<room>-a.png`, sheet `dressing_r1/ingame/sheet.png`.

- **loading_dock → `room_m09_dock`.** A night yard against the warehouse's brick: BAY 1 plate and a hazard-hatched apron at the open shutter (the N door), BAY 2's shutter down with its control box and a bollard, a camera; the guard hut desk NE with the incident log, radio and flask, hi-vis on a hook over it, his chair; pallets of records boxes and the pallet truck west; wheelie bins east; a chain-link fence of mesh panels along the south. The scenario now spawns the player at tile (7, 7.5), bottom right, facing both doors (S5 §3.1); it was the room centre.
- **front_desk → `room_m09_front`.** Cream plaster, worn lino. STAFF ONLY and a card reader by the staff door; the MOUNTAIN STATES RECORDS & RETENTION wordmark over Noor's desk (terminal, lamp, phone, chair), RETURNS AND ENQUIRIES beside it. The taped box sits in front of her desk's right end, out of her frame. A public counter of two old wooden desks along the south-west, filing cabinets west, a water cooler. Two trolleys of records boxes east of Noor (PixelLab dressing), the destruction-run sheet clipped to the first; Noor at (6.5, 5.5) stands on clear floor beside them.
- **open_stacks → `room_m09_stacks`.** Sealed concrete, brick, yellow aisle lines. Client-deposit shelving in two runs (bays 10 and 11 west, bay 12 east) with plates on the wall, CLIENT DEPOSITS / BAYS 1-12 over the cross aisle, a camera. The H&L label on bay 12's shelf front; their boxes pulled out on the floor in front of it. Old Coyote's round is untouched: the south band (y 236-304) and the cross aisle at x 380-430 have no furniture, the west crossing (shutter to reading-room door) is clear.
- **server_closet → `room_m09_closet`.** Grey blockwork, anti-static tiles: rack NE, the wipe schedule on a clipboard, the degausser as the Wipe Console SE (its top-left is below Tran's frame), a terminal desk SW, a box of tapes.
- **staff_passage → `room_m09_passage`.** Plaster and lino with a green runner; noticeboard, hi-vis and lanyard hooks, the rota, a water cooler; card reader on the west wall by the S door. Both door lanes clear.
- **reading_room → `room_m09_reading`.** Library green with a brass line, oak parquet. READING ROOM; the drop terminal's wall screen; a small desk west with the notebook scan, the microfiche reader cart (PixelLab dressing), the reading desk (field laptop, green-shaded lamp, drop terminal); a reading table on a red rug with the case file. Slots are 32 px or more apart; the N, E and S door spots are clear.
- **restricted_stacks → `room_m09_restricted`.** The cage front built as S5 §3.6 describes: an oak hatch counter with mesh down its east edge (collision x 224-240, y 124-228), the darker sealed strip behind it (x 240-288) closed by mesh runs and collision at both ends, two bins at its south end. Sorensen's static sprite sits in the strip with her body edge at the counter. Her rubber stamp is on the counter's south end, below her frame. Back wall: RESTRICTED STACKS over two binder shelves and a filing cabinet, card readers by the tape-room door and the gate. A returns trolley between the W and S doors, a sorting table with open boxes; the middle stays clear so all four doors show.
- **restricted_cage → `room_m09_cage`.** Sage blockwork, concrete. SERIES R, two shelves of boxes waiting, the clock; the shredder line in a hatched keep-clear box (the cross-cut shredder at Sorensen's feed, a confidential-waste console, a bin); the feed table south-east of her with the last box; the plan chest in the NE corner; the printed ledger on a low sideboard east; the degausser and taped boxes to the south. Row 2 of the west wall stays clear (the B1 blocker).
- **sorensen_office → `room_m09_office`.** Walnut panelling, brown carpet, a worn red rug. Two shelves of binders, the county certificate, a credenza with the kettle, mugs and the deck controller; her desk on the rug with the lease file, a green lamp, a phone and her chair; the rent ledger on a side table west, the broker's note on one east, the build-out ledger on a sideboard south; the floor safe SE; the keypad on the east wall by the door; a club chair, coat stand, bin.
- **tape_room → `room_m09_tape`.** Blue-grey blockwork, cold vinyl. The salvage keypad by the N door with the shelf-mark legend framed beside it, TAPE STORE, a row of reel shelves and tape cabinets on the back wall and a second row across the middle (PixelLab dressing); the reel deck on its bench SW with open floor west of it (it is 59 px tall, and reach is measured from its top-left); the annotation sheets on a side table SE. The west strip between the two doors is clear.
- **salvage_cage → `room_m09_salvage`.** Dark brick, stained concrete. The cut door controller, SALVAGE; Tomb Beta's rack with its property label, the ALPHA crate with the field kit on it, the drop link on a steel desk, a printer stand with the mirror job in its tray; in front, the BETA crate and the printed folder on a low table.

### Scenario edits

Layout fields only. Pre-edit copy: the session scratchpad (`dress_r1/scenario_before_dressing.erb`).

- Eleven room `type`s → `room_m09_*`; the room comments that named a placeholder now name the old map.
- `"startPosition": { "x": 7, "y": 7.5 }` (spawn bottom right of the yard, S5 §3.1).
- 33 explicit positions removed. 27 became `as-type` slots (incident_book `notes_ledger`, trolley_list `notes_clip`, noor_desk_box `m09_box_taped`, hl_bay_label `m09_bay_label`, hl_box `supply_boxes`, tape_side_console `m09_degausser`, drop_terminal and tomb_beta_station `safetynet_flag_terminal`, drop_terminal_screen `m09_drop_screen`, case_file, lease_file and albion_folder `case-file`, notebook_scan `notes_notebook`, sorensen_stamp `m09_rubber_stamp`, cage_shredder `shredder`, feed_table_box `m09_box_open`, plan_cabinet `plan_chest`, printed_ledger `binders`, director_safe `safe`, rent_book `book`, deck_controller `tablet`, clerk_certificate `hce_phd_frame`, shelf_code_legend `m09_shelf_legend`, alpha_tape_deck `m09_reel_deck`, tomb_beta_rack `server_rack`, beta_asset_tag `notes_tucked`, enrolment_crate `m09_crate_beta`). Six claim their own type's slot with no position (field_laptop, field_kit_link, danny_sheet, refit_ledger, alpha_annotations, mirror_job_printout).
- Six `sprite` stand-ins dropped so the slot's art shows: noor_desk_box (was `office-misc-box1`), tape_side_console (`pc6`), drop_terminal_screen (`monitor_stand1`), feed_table_box (`office-misc-box1`), albion_folder (`notes5`; a folder now, `case-file`), enrolment_crate (`supply_boxes1`).
- Unchanged: every id, lock, lock code, NPC position and patrol waypoint, every `_comment` on puzzle logic.

### New assets

- **Hand-drawn** (`make_m09_props.py`, native size, free): `m09_logo_sign1`, plates `m09_sign_reading1`, `_restricted1`, `_staff1`, `_tape1`, `_salvage1`, `_director1`, `_series_r1`, `_bay1`, `_bay2`, `_stacks1`, `_returns1`, bay plates `m09_bay_plate10/11/12`, `m09_bay_label1`, `m09_shelf_legend1`, `m09_rubber_stamp1`, `m09_hatch_counter1`, `m09_mesh_low1`, `m09_keypad1`, `m09_door_controller1`, `m09_crate_alpha1`, `m09_crate_beta1`, `m09_box_taped1`, `m09_box_open1`, `m09_degausser1`, `m09_drop_screen1`.
- **PixelLab**, one `create-1-direction-object` call at a 64 px canvas, two phrasings of "a reel-to-reel deck on a bench, straight-on flat front view" (balance 4139 → 4123, 16 generations). Installed, trim only: frame 0 `m09_reel_deck1` (the ASSET_LIST §4 item), and from the same call's other frames, as dressing: `m09_microfiche1` (reading room), `m09_box_trolley1` (front desk trolleys, restricted stacks), `m09_reel_shelf1` and `m09_tape_cabinet1` (tape room). Contact sheet: `dressing_r1/pixellab_reel_batch.png`.
- `case-file` and `safetynet_flag_terminal1` (existing PNGs) added to the catalog and extras tileset so maps can hold them as slots.
- All registered with `register_object.py`. Eleven maps and twelve sheets registered in `game.js`, the schema's room-type enum, and the README room table.
- `register_object.py` fix: it refused to run because the highest-id extras tile (`planter-fig1-top-ani1`) is loaded in a loop with no line of its own; it now anchors on the highest tile that has a load line.

### Checks

- Validator: 0 errors, exit 0 (schema passes; the warnings are the existing eventMapping, objective-wiring and recommended-field ones).
- `slot_audit.py --notes`: 0 problems (29 before). Five notes prompts left on purpose: lease_file is takeable by design (the deed is carried); the case file, broker's note and build-out ledger have import-keyed `textVariants` that are fixed for a game, not live displays.
- `check_room_walls.py`: all eleven maps read 64. `check_door_alignment.py`: 11 of 11 OK. `predict_door_sides.py`: unchanged. Door-clearance check (`doorclear.py` in the session scratchpad): no furniture in any door mouth.
- Slot spacing (scratch `tools/slotdist.py`): every slot 32 px or more from the others and outside every NPC frame, except the rack and its property label (a shared menu, accepted: the label is on the rack).
- In game (game 3063): every map, sheet and prop loads; no "No Tiled item found"; objects land on their furniture. `game.js` passes `node --check`.
- `generate_rooms.py --check`: 33 hints, mostly the generic bottom-row and door-corner warnings for rooms with nothing south or no door in that corner.
- A browser playtest (doors both ways, reach to each object, patrol) was started; its result was not in when this round closed. It is owed.

### Open for round 2

1. Run the browser playtest: doors both ways (above all the cage's W door), reach to the 59 px reel deck from the west, the wall-mounted drop screen, the plan chest, the stamp at the counter and Sorensen across the hatch; Old Coyote's round past the shelving.
2. Reading room is tight: the reading table sits close in front of the reading desk and the microfiche lamp overlaps it. Consider dropping the microfiche cart or moving the case file onto the back row.
3. Salvage cage front row is crowded against the back desks; review once in-game shots exist.
4. The dock's N door draws as an ordinary door; the story calls it the shutter. Engine door art, not a map fix.
5. Owed art (ASSET_LIST §4): four-state trolleys, `cage_bin` bin states, logbook, deck controller box, county certificate.
6. Bay plates should be registered as wall items (validator hint "stands on the back wall").
7. The stacks' open middle and the hub's empty centre could take more detail (ladders, a returns cage) without touching the patrol band or the four door sightlines.

## Round 2 (2026-10-22): browser check, fixes, critique pass

### Browser check

Round 1's helper (log in the session scratchpad, `dress_r1/pt1/`) found every door walkable both ways (the cage's west door included) and all 32 objects reachable, with no missing art. It also found the six problems below. I fixed them and re-checked in my own headless session (game 3079, every room unlocked server-side, log `dress_r1/pt2/session.jsonl`).

| # | Finding (round 1 helper) | Fix | Re-check (game 3079) |
|---|---|---|---|
| B1 | Old Coyote never moved: his start (5, 8.5) and six of his seven waypoints sat at y 8.5, outside open_stacks' pathfinding bounds (tiles y 2–8), so `npc-behavior.js` dropped them | Start and round moved to y 7.5 (scenario NPC fields; the route is otherwise the same: west end at x 3, up the cross aisle at x 12.5, east to x 17). The shelving leaves y 7.5 clear | Walks a full lap: (116,213) → (338) → up to (404,134) → (542) → back to (107); he spots the player and opens his challenge as before |
| B2 | drop_terminal_screen only reachable from 52 px: it hung on the wall over the desk | The wall screen moved east of the desk, over open floor in the E door's mouth (x 236–272, y 32–58) | 25 px, no pick menu; drop_terminal 25 px, field_laptop, case_file and notebook_scan all open on their own |
| B3 | staff_passage → front_desk opened a two-entry door menu: each room draws its own sprite for a shared N/S doorway, and here both were in reach | Engine: `gatherInteractablesNearClick` (game.js) lists a doorway once per room pair, using the sprite of the room the player is in | passage → front desk → passage walks through with no menu |
| B4 | Reading room cramped; field kit PC on the ALPHA crate; hatch counter read as a tall plank, crowded with two bins and two mesh runs | Reading room, salvage cage and hub redone (below) | — |
| B5 | tape_side_console shared a pick menu with Jesse Tran (10–14 px) | Degausser moved SW and the terminal desk SE; Tran moved from (2.5, 4) to (3.3, 3.5), between the rack and the terminal and clear of the W door's mouth | Console opens its read modal, no menu |
| B6 | One uncaught "Cannot read properties of undefined (reading 'style')" page error | Not reproduced: none in game 3079. In round 1 it came alongside a run of 503s from the keyless server | Open (round 3: watch for it) |

Also re-checked in game 3079: restricted_stacks ↔ restricted_cage both ways; Sorensen at the hatch opens her person-chat from the counter (the engine reaches her body edge); the stamp opens the dusting minigame from 26 px; cage_shredder, feed_table_box and printed_ledger open; the reel deck opens from 26 px, approached from the west; the legend and annotations open; all seven salvage objects open, the rack and its label sharing a menu as intended. The plan cabinet is in reach at 24 px but no minigame opened in this probe (it is a biometric lock and no print had been lifted); round 1's helper confirmed its interaction. `tools/playtest/m09_digital_archaeology-flags-game3064.xml` is git-ignored (`tools/playtest/*-flags-game*.xml`), so I left it.

### Critique pass (all eleven rooms)

| Room | Reads as its place? | Square to walls | Doors and tap areas | Action |
|---|---|---|---|---|
| loading_dock | yes: a night yard, shutter, hut desk, fence | cones and pallet truck the only angled props | clear | none |
| front_desk | yes: records front office | yes | clear; Noor clear of the trolleys | none |
| open_stacks | yes, but the open floor read bare | yes | patrol band and cross aisle clear | added a box trolley being loaded in the first aisle, a pallet of returns in the east column (clear of the E door), NO SMOKING by the W end |
| server_closet | yes | yes | console and Tran now apart | B5 |
| staff_passage | yes | yes | one doorway entry now | B3 |
| reading_room | cramped | yes (one side-facing chair) | screen hard to reach | back row now notebook desk, reading desk (laptop, lamp, terminal), microfiche cart; wall screen east over open floor; the lamp is off the case-file table |
| restricted_stacks | counter read as a plank; hatch crowded | yes | sightlines to all four doors clear | counter redrawn 22 px wide (panelled front, oak top with brass edge and grain, mesh with a gap at the hatch); north mesh run and the confidential-waste bin removed (the strip stays sealed by collision); a wall clock |
| restricted_cage | yes | yes | W row 2 clear | none this round |
| sorensen_office | yes | yes | clear | the deck controller is now its own art (`m09_deck_controller1`, a black box with an aerial and key switch) in place of a tablet |
| tape_room | yes | yes | deck approachable from the west | none |
| salvage_cage | crowded front row; PC on a crate | yes | rack/label menu kept | field kit and drop link on two steel desks; ALPHA crates stacked against the wall; front row BETA crate, printer stand with the mirror job, folder on a low table, every slot 32 px or more apart |

### Changes in files

- `scripts/room_gen/m09_rooms.py`: closet, reading room, restricted stacks, salvage cage, stacks, office, as above; docstrings updated.
- `scripts/room_gen/make_m09_props.py`: hatch counter redrawn (22×104; catalog, `tilesets_ref.json` and the extras `.tsx` widths updated), new `m09_deck_controller1` (registered).
- `scripts/generate_rooms.py`: `m09_bay_plate` added to `WALL_MOUNTED_EXTRAS` (round 1 open item 6).
- `public/break_escape/js/core/game.js`: the doorway de-duplication (B3).
- Scenario (re-read before each edit; layout fields only): Old Coyote's start and waypoints (B1), Jesse Tran's position (B5), deck_controller → `as-type:m09_deck_controller` with its `tablet` stand-in dropped; comments say why.
- README room table: office and salvage rows updated.

### Art

No PixelLab call this round (balance unchanged at 4123). The deck controller box is hand-drawn. Still owed from ASSET_LIST §4, each needing a scenario change as well as art, so left for a decision: the trolleys' four states (they are dressing now, not objects; making them change needs objects with `spriteVariants`), the bins' `cage_bin` states (the bins are not placed by design), a guard's logbook (`notes_ledger1` already reads as one), a county certificate (`hce_phd_frame1`, a framed certificate with a seal, reads well enough).

### Checks after round 2

- Validator: exit 0, 0 errors, schema passes.
- `slot_audit.py --notes`: 0 problems; the same five notes prompts, left for the reasons in round 1.
- `check_room_walls.py`: all maps 64. `check_door_alignment.py`: 11 of 11 OK. Door-clearance check: no hits. Slot spacing: all 32 px or more, except the rack and its label (by design).
- `game.js` passes `node --check`.
- Renders: maps `dressing_r2/maps/` (contact sheet included); in game (game 3081) `dressing_r2/ingame/<room>-a.png`.

### Open for round 3

1. The 'style' page error (B6): not reproduced; watch for it in the next playtest.
2. Salvage cage: the "mesh pen" doesn't show; the walls are brick. Paint mesh into the back wall of the sheet, or hang mesh runs.
3. Restricted cage: same; a mesh feel along its walls would say "cage" at a glance.
4. Server closet is thin (rack, degausser, terminal); a reel rack would help if a narrow one is drawn.
5. The trolley and bin states need a decision on making them scenario objects before any art is made.
6. Lighting is next once dressing is signed off: the tour reports no lighting configured yet.

## Round 3 (2026-10-22): the R3 review's findings

Review: `DRESSING_REVIEW_R3.md` (0 blockers, 7 majors, 20 minors). I fixed all the majors and most of the minors, then checked them in a browser session of my own (game 3101, every room unlocked server-side; log in the session scratchpad, `dress_r1/pt3/`). Renders: maps `dressing_r3/maps/` (contact sheet included); in game `dressing_r3/ingame/<room>-a.png` (game 3099, Dillard shown); browser shots `dressing_r3/ingame/cage_browser.png`, `salvage_browser.png`.

### Per finding

| # | Sev | Fix | Checked in game |
|---|---|---|---|
| K1 | major | The closet's room layer is now built from the 5×6 template's cell map (`_build` in `m09_rooms.py`), so it has its east wall and south frame | yes: walls and frame drawn; W door both ways; the console opens with no menu |
| K2 | minor | Wall-hung patch cabinet west of the rack; clipboard moved to the west end. A floor-standing UPS stood in the W door's mouth, so I used a wall unit instead. Tran unchanged | render |
| H1 | major | The counter is now a 16 px ledge (`m09_hatch_counter2`) with a side-on mesh screen standing on its east edge (`m09_hatch_screen1`: 8×124, posts every 32 px, a gap at the hatch). Low mesh rails (`m09_mesh_rail1`, 12 px tall) close the strip at both ends, so the north collision is no longer invisible. Collisions unchanged | yes: gate walked both ways; Sorensen opens her person-chat from the counter |
| H2 | minor | Larger stamp-and-pad sprite (`m09_rubber_stamp2`, 20×14) in the same slot | yes: dusting minigame from 27 px |
| H3 | minor | `m09_keypad1` on the hub's west wall below the office door | render |
| C1 | major | Chain-link painted over the cage sheet's back wall and both side strips (`paint_chainlink`, kept above y 56 so the floor line still reads 64) | yes (`cage_browser.png`) |
| C2 | major | The hatched shredder box now runs from x 112, so Sorensen stands inside it. A sack of strips and a taped box sit between her and the shredder as decor. The shredder slot stays at x 164 (outside her tap frame); she was not moved | yes: she reads as at the feed |
| C3 | minor | The degausser is on a small steel bench | render |
| C4 | minor | The cage's shelves are `m09_shelves_red1` (white archive boxes with red tape) | yes |
| V1 | major | The same chain-link on the salvage cage sheet | yes (`salvage_browser.png`) |
| V2 | minor | One ALPHA crate at the back wall (x 254); printer stand moved to x 160–192, folder table to x 204–254; every slot 32 px or more apart | yes: all seven objects open |
| V3 / R3 | minor | `field_laptop` and `field_kit_link` get `"sprite": "laptop1"` | yes: texture `laptop1` in both rooms; both open the VM launcher |
| V4 | minor | Accepted: the cut controller stays on the north wall (the S wall is covered) | — |
| O1 | minor | New manila folder (`m09_folder1`) for `lease_file` and `albion_folder` (`as-type:m09_folder`; lease_file's `case-file` stand-in dropped). HaX's case file keeps `case-file` | yes: both open |
| O2 | minor | Sorensen's desk is now the dark `exec_desk1` | yes |
| O3 | minor | The west side table is a sideboard (rent ledger on it); the east one stays | yes: rent ledger opens |
| S1 | major | Three shelf variants (`m09_shelves_white1`, `_half1`, `_flip1`, recoloured or mirrored from the house shelving at native size) alternate with the original along both runs; a 14 px gap between bay 10 and bay 11 at x 250–264 | yes |
| S2 | major | A hatched returns bay along the south of the east half (y 270–304, x 392–606) with pallets of taped boxes, a box trolley and the pallet truck, outside Old Coyote's round | yes: his lap is unchanged |
| S3 | minor | Bay label foot at y 101, on bay 12's bottom rail and drawn in front of it (at y 95 it drew behind the shelf and vanished) | yes: visible; opens at 27 px |
| S4 | minor | Old Coyote's override tile moved from (2, 6.5), mid west crossing, to (3.5, 4.2), beside the reading-room door's mouth (S5 §3.3: beside the door, never on it). Both relay copies changed; the scenario comment says why | the pathfinding grid shows tile (3, 4) walkable; the override itself was not triggered (it needs flag 1 on an `m01_maya_ko` save) |
| D1 | minor | A PERSONNEL plate under BAY 1 by the open N door | render |
| D2 | minor | Dillard at (3.5, 8) shown in game (`--show-npc archive_guard`): his feet sit just above the dock's wall line, not across the brick. Left where he is | yes (`open_stacks-a.png`) |
| F1 | minor | Two chairs on the counter's public side, facing it | render |
| F2 | minor | Covered by O2 and F1 | — |
| R1 | minor | Reading-table chair is `hospital_chair1` (faces W, towards the table) | render |
| R2 | minor | A framed county map and SILENCE PLEASE on the back wall | render |

### Found while checking: decor that took a scenario slot

The engine searches the regular layers before the conditional ones. A decor sprite of the same base type as an `as-type` slot therefore takes the scenario object first. Three cases, all fixed:

- **front_desk**: the taped box on the counter took `noor_desk_box`, so the desk box sat on the counter (since round 1). It is now an `office-misc-box1`.
- **open_stacks**: the returns bay's `supply_boxes1` took `hl_box`, moving Harwick & Lowe's boxes to the south wall. The decor is now taped boxes.
- **restricted_cage**: an open box by the shredder took `feed_table_box`. It is now a taped box.

The check is in the session scratchpad. For each room it lists every `as-type` or own-type slot that has a same-base sprite in `items` or `table_items`; it now lists none. In game, `noor_desk_box` is at the desk (182, 92), `hl_box` is in front of bay 12 (494, 102) and `feed_table_box` is on the feed table (139, 177).

### Scenario edits (layout fields only, re-read before each edit)

- `lease_file`: `sprite` dropped, `as-type:m09_folder`. `albion_folder`: `as-type:m09_folder`.
- `field_laptop`, `field_kit_link`: `"sprite": "laptop1"`.
- Old Coyote's `patrolOverride.targetTile` (two copies): (3.5, 4.2); his comment notes it.

### Other files

- `scripts/room_gen/make_m09_props.py`: `round3()` adds the shelf variants, mesh rail, hatch screen, counter ledge, larger stamp, strip sack, county map, folder, SILENCE PLEASE and PERSONNEL plates. All are registered (the map and plates as wall items).
- `scripts/room_gen/make_m09_tileset.py`: `paint_chainlink` on the cage and salvage sheets; a wider shredder box; the returns bay hatching in the stacks.
- `scripts/room_gen/m09_rooms.py`: as above.

### Checks after round 3

Validator exit 0, 0 errors, schema passes. `slot_audit`: 0 problems. Walls: all 64. Door alignment: 11 of 11. Door clearance: no hits. Slot spacing: all 32 px or more except the rack and its label (by design). No PixelLab spend (balance 4123). The 'style' page error did not appear in game 3101; the 503s in its log are the keyless server's.

### Open for round 4 or lighting

1. Old Coyote's override at (3.5, 4.2): still to be seen in play on an `m01_maya_ko` save after flag 1.
2. Art still owed (ASSET_LIST §4): the trolley and bin states. Both need scenario objects first.
3. Four rooms use the cream `desk1` (front desk ×2, hub sorting table, reading desk). Noted, not changed.
4. Ready for lighting, in my view: every room now reads as its place, props sit square to the walls, and no door or tap area is blocked.
