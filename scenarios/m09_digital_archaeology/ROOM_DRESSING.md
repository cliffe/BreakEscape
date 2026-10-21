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
