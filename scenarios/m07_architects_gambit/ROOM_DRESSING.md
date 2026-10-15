# m07 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/M07_PASS_BRIEF.md`, stage 4. Up to ten design → implement → review cycles while each still improves the rooms. Evidence lives in `build_evidence/dressing_c<N>/`; in-game shots come from `tools/playtest/lighting-tour.sh` on the keyless :3001 server (every room unlocked, HUD hidden), in fresh games. m05's dressing log is the worked example.

The aim: Pacific Northwest Regional Grid Control, a public utility's grid control facility outside Portland, at night, mid-evacuation, while a cascade sequence waits on the control system. Each room should read as what it is in a real utility (checkpoint, control room, server hall, SCADA room, generator hall, cable vault) and differ from its neighbours; the spy-thriller tension comes from the details (a muster board crossed off halfway, every panel amber, a splice that is newer than everything round it).

## Cycle 1 (2026-10-14): survey, the first room, and all six rooms built

### Survey: what was there

| Room | Map type before | Size | Doors |
|---|---|---|---|
| security_checkpoint (start) | `room_security` (shared) | 10×10 | E |
| operations_floor | `room_office` (shared by ~50 scenarios) | 10×10 | W, E |
| server_room | `room_servers` (shared) | 10×10 | W, N (NW), S (SW) |
| scada_control | `room_control_1x2gu` (m04, m07, m08, sis02) | 10×6 | S (SW) |
| generator_room | `room_battery_hall` (shared) | 20×10 | N (NW), S (SW) |
| cable_vault | `room_archive_1x2gu` (shared) | 10×6 | N (NW) |

Before shots, in game: `build_evidence/dressing_c1/before/<room>-a.png` (game 2433).

### Critique (ranked)

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map is shared with other scenarios; nothing could be redressed without changing other missions. The wall painting floating outside the walls (U6) comes from the shared `room_control_1x2gu` and `room_security` maps. |
| A2 | Generator hall | major | Dressed as a server hall (rows of battery racks on purple carpet); no generators, no transfer switch, nothing for the plant log to hang beside. |
| A3 | Cable vault | major | An office: a wall of wooden drawers, two desks with lamps, swivel chairs. Nothing underground, no cables. |
| A4 | All | major | 11 objects had no slot and landed at random (`slot_audit`): the evacuation board, the situation board, the substation map, the VM terminal, the backup server, the countdown display, the plant log, the transfer switch, the genset panel, the trunk cables. The SCADA console's 48 px sprite hung off a 24 px pc slot. |
| A5 | Operations floor | major | A purple open-plan office (bookcase, chalkboard on an easel, suitcases); nothing says grid control; the situation board landed mid-floor as a small chart. |
| A6 | Checkpoint | major | Purple carpet, chalkboard, retro orange chairs and potted palms: no guard counter, no screening, no muster board on the wall. |
| A7 | Server room | minor | Rows of racks on purple carpet with a landscape painting; the VM terminal and backup server dropped in random spots. |
| A8 | SCADA | minor | Reads as a control room already, but the countdown display has no fixture and the console sprite is mis-sized. |

Counts: 1 blocker, 5 majors, 2 minors.

### Plan

1. Give m07 its own building: six `room_pnw_*` map types (Pacific Northwest Regional Grid Control), built by new builders in `scripts/generate_rooms.py` (additive: a `PNW_FLOOR_SHEETS` dict, one `AES_WIDE_SHEETS` entry for the 20-wide hall, six `builders` entries). Same sizes, so room positions, doors and NPC tiles don't move. The shared maps stay as they are, which also retires U6 for m07.
2. Sheets (`scripts/room_gen/make_pnw_tileset.py`, new; imports the m04/m05/m06 helpers and leaves their sheets alone). One brand colour, an evergreen line on every wall. Walls: pale institutional grey (checkpoint), dark slate blue (ops floor, so the video wall reads), teal-graphite (server hall), plum-slate with a red line (SCADA, restricted), sage painted blockwork (generator hall), bare board-marked concrete with a yellow line (vault). Floors: grey terrazzo with the PNW fir-and-bolt inlay at the spawn, a walk-off mat at the E door and a yellow queue line (checkpoint); dark blue carpet tiles with a lighter aisle door to door and a raised supervisor's dais (ops); raised floor with a perforated cold aisle (servers); dark anti-static tiles (SCADA); blue-grey epoxy with walkway lines, hatched keep-clear boxes round the gensets and the transfer switch, a bunded day tank and fuel trunking (generator hall, a 640 px sheet in two halves); wet concrete with damp patches, a chequer-plate cable trench and a sump (vault).
3. Art: the house set where it fits; hand-drawn signs, boards, screens, the plant log, the cable ladder and the splice (`scripts/room_gen/make_pnw_props.py`, new); PixelLab for the plant and the consoles.
4. Every scenario object onto a real fixture; the situation board's `command_board` sprite override removed (as-type onto the video wall instead).
5. The operations floor first, as the setting's signature room, for the user's sign-off; then the other five in the same style.

### First room: the operations floor (for sign-off)

`room_pnw_ops`. Back wall: the 147-substation wall map (red marker rings, a red scrawl under it) and the situation video wall (a 4×2 bank of screens, every panel amber: the regional map, the load curve, the breaker grid, the alarm list, REMOTE SESSION, REBAL OFF, the clock, the load bars), an alarm panel. Two rows of three operator consoles (PixelLab, front-on, three monitors of one-line diagrams) facing the wall, with a 32 px gangway between the second and third of each row; position 3 (front row, east) carries an amber "3" tag and its chair is pushed back (a static, angled seat: the room's angled piece). The lighter aisle runs door to door along the top. At the back, the supervisor's desk on a grey dais with an amber nosing: the plant key and the handover sheet in the tray 55 px apart, a laptop, a phone; his chair shoved aside. Coffee station and water cooler SW, photocopier SE, call point and sanitiser west, extinguisher east.

- Slots: the map, the video wall and position 3 by `as-type`; the key and the handover sheet on the supervisor's desk.
- Render: `build_evidence/dressing_c1/first_room_operations_floor.png` (game 2435). Logged as pending in `DECISIONS_PENDING.md` (U13).

### The other five rooms

- **Checkpoint (`room_pnw_checkpoint`):** the PACIFIC NORTHWEST / REGIONAL GRID CONTROL wordmark over a black guard counter (the badge station, a phone, the radio charger, the open visitor ledger), the NERC CIP-006 ESCORT REQUIRED plate and a MUSTER N LOT sign under the wordmark, the evacuation muster board (names crossed off in red, then stopping; clear floor under it), CCTV monitors and a camera. A water cooler below the E door; the screening lane along the south behind a yellow queue line (x-ray scanner, walk-through arch, stanchions), grey lockers SE. The spawn (the inlay) and Hollis's patrol strip are open floor.
- **Server hall (`room_pnw_servers`):** a cable tray over seven racks against the back wall (rack 4 has the cabling survey note clipped low on its door), SERVER HALL / RESTRICTED; a middle row of five racks ending in the SCADA backup server, its own blue rack with a red BKP tag; the VM terminal and the SAFETYNET relay on separate steel desks to the south, no chairs. All three doors are on the west side, so the west lane runs clear and the kit fills the east.
- **SCADA control (`room_pnw_scada`):** SCADA CONTROL / AUTHORISED ONLY, a PNW 147 single-line mimic board, the countdown display (SEQUENCE LOADED, four step lamps, AWAITING HOST) over where Mercer stands; an operator console and the master desk with the cascade control position and the signed projection beside it; one operator chair. The floor is y 64-128 (the server room covers the rest); the band y 104-128 runs clear from the door to Mercer.
- **Generator hall (`room_pnw_genhall`):** BACKUP GENERATION HALL; in a hatched box at the west end the automatic transfer switch ATS-1 (PixelLab, a riveted plate), the plant log chained to the wall beside it, the genset control panel; three yellow gensets in hatched boxes with GEN 1-3 plates; starter battery racks, an engine cabinet and a junction box along the back wall; the red day tank in its bund with the hose reel over it; fuel trunking to the sets; a steel bench with the radio charger; a cable trolley, a transformer, a spill kit and drums along the south. The N-to-S door lane runs clear down the west behind a yellow walkway line.
- **Cable vault (`room_pnw_vault`):** CABLE VAULT / CONFINED SPACE; a cable ladder loaded with the trunk runs across the back wall, the splice on it (a resin joint, site tape, a small grey device with a green lamp); a gas detector; the Tomb Gamma printout on the trench lid at the splice's foot; Park's trestle with a battery printer and the intercept; a ladder, a cable drum, a junction box; damp patches and a sump.

### Scenario edits (layout fields only; each replacement asserted unique on a fresh read; pre-edit copy in the session scratchpad)

- Six room `type`s → `room_pnw_*`.
- `"position": "as-type:..."` on: the evacuation board (`pnw_evac_board`), the situation board (`pnw_video_wall`; its `"sprite": "command_board"` removed and its `_comment` updated), the substation map (`pnw_substation_map`), the operator workstation (`pnw_console_pos`), the countdown (`pnw_countdown`), the transfer switch (`pnw_ats`), the genset panel (`pnw_genset_panel`), the trunk cables (`pnw_splice`), the visitor log (`notes_ledger`), the cabling note (`notes_clip`), the plant log (`notes_plantlog`).
- `"readDisplay": "gameDisplay"` on the visitor log ("Do not remove from the desk"), the cabling note (clipped to the rack) and the plant log (chained to the wall): the notes minigame hides every notes object after a read, takeable or not (`notes-minigame.js` `removeNoteFromScene`), so a chained log vanished. The generic `onRead` still fires in this mode (`interactions.js:1599`), so `visitor_log_read` is unaffected; a copy still goes to notes.
- Unchanged: every NPC position, every ink and dialogue field. The Cascade Control System keeps `"sprite": "scada_historian"`, which now claims a real `scada_historian` on the master desk.

### Checks after cycle 1

- Validator (`--skip-ink --no-graph`): schema passed, door alignment OK, 0 errors (warnings are the existing eventMapping and cutscene ones). `check_door_alignment.py`: 5 of 5 OK. Walls: every `room_pnw_*` map reads 64.
- `slot_audit.py --notes`: 0 problems (11 before), 0 notes prompts.
- Routes (`m07_routes`): 27 of 27 pass.
- `game.js`: `node --check` passes; six tilemaps and seven sheets registered; schema enum and `README_scenario_design.md` room table updated.
- In game (game 2435, all six rooms): every map loads, no "No Tiled item found". Shots `build_evidence/dressing_c1/after/`.

### New assets (cycle 1)

- PixelLab: one `create-1-direction-object` call, 64 px canvas, front-view references (`ups_cabinet1`, `server_rack1`, `aes_switchgear2`), "straight-on flat front view" phrasings. Balance 1767 → 1757 (10 generations; it returned 16 frames). 15 installed, trim only: `pnw_genset1`, `pnw_ats1`, `pnw_switch_cabinet1`, `pnw_genset_panel1`, `pnw_engine_cabinet1`, `pnw_day_tank1`, `pnw_console1`, `pnw_console2`, `pnw_xray1`, `pnw_arch1`, `pnw_batteries1`, `pnw_hose_reel1`, `pnw_cable_trolley1`, `pnw_transformer1`, `pnw_junction_box1`. One (a three-quarter genset) dropped.
- Hand-drawn (`make_pnw_props.py`): `pnw_logo_sign1`, `pnw_evac_board1`, `pnw_nerc_notice1`, `pnw_muster_sign1`, `notes_ledger1`, `pnw_video_wall1`, `pnw_substation_map1`, `pnw_console_pos1` (the PixelLab console with a tag), `notes_clip1`, `pnw_backup_tag1`, `pnw_countdown1`, `pnw_mimic1`, `notes_plantlog1`, `pnw_genplate_one1`/`two1`/`three1`, `pnw_ear_sign1`, `pnw_cable_ladder1`, `pnw_splice1`, `pnw_portable_printer1`, and plates `pnw_ops_sign1`, `pnw_server_sign1`, `pnw_scada_sign1`, `pnw_genhall_sign1`, `pnw_vault_sign1`, `pnw_security_sign1`.
- All registered with `register_object.py` (catalog, tileset, `game.js` preload, wall list).
- After the shots: the checkpoint's near-black walk-off mat read as a hole in the floor; repainted as a ribbed grey-green mat.

### Assumptions (cycle 1)

- Assumption: the operations floor is the right first room for sign-off, being the setting's signature space (the checkpoint is the start room, but a guard desk says less about a grid facility).
- Assumption: adding `readDisplay` to three fixed notes is a layout-and-object change in my remit (m05's coordinator approved the same for the Lab Rules); none of them is takeable or counted by a task.
- Assumption: `register_object.py`'s note that "a name starting notes counts as a notes slot" is wrong for the engine (`rooms.js` `extractBaseTypeFromImageName` strips only trailing digits), so each `notes_*` sprite needs `as-type`. Reported, not fixed (shared tool docs).

## Cycle 2 (2026-10-14): review of cycle 1, and fixes

A fresh Opus reviewer (read-only; report kept as `build_evidence/dressing_c2/review_c2.md`) went through the six rooms against the skill's checklist, measured every slot and chair pair with the engine's tap rule (`game.js` `gatherInteractablesNearClick`, every pixel of each sprite), and checked each fixture against the object's text. Wall items, door lanes, the bottom rows and square-to-the-walls all passed; no counter, desk, rack or shelving is angled. Verdict: the operations floor works as the signature room; the server hall, SCADA and the vault need another cycle.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| M1 | SCADA | major | The countdown sat behind Mercer: his head hid "AWAITING HOST" and the display's centre was 32 px from his | **Fixed:** countdown over the operator console (x 30-106); the SCADA CONTROL plate moved east behind Mercer (decor) |
| M2 | SCADA | major | The win condition sat on the beige office `desk1` the ops supervisor uses | **Fixed:** `pnw_master_desk1`, a charcoal recolour of `desk1` with a red edge strip (same size, no rescale) |
| M3 | Server hall | major | Elena "working a rack terminal" stood on open floor | **Fixed:** `kvm_cart1` (static) pulled up to the west end of the middle rack row beside her; the VM desk moved 10 px east to stay 36 px from her |
| m1 | Ops | minor | The key overlapped back-row chair E; the supervisor's rolling chair straddled the dais edge | **Fixed:** desk to feet 304; console E's chair removed (the empty seat reads as evacuated); the supervisor's chair is now the static `aes_office_chair1` (the room's second angled piece) |
| m2 | Ops | minor | The handover sheet is "under the fob" in the text but 55 px from the key | **Left:** the tap rule needs the two 32 px+ apart; the text is not a dressing field. For the orchestrator if wanted (reword to "beside the fob") |
| m3 | Ops | minor | Little sign of an evacuation | **Fixed:** a mug left at position 3, a headset dropped on console A, an empty seat in the back row |
| m4 | Ops | minor | The "wall-sized" video wall covered half the wall | **Fixed:** a fifth column (camera feeds, 8.41M SERVED), x 114-273; the alarm panel went |
| m5 | SCADA | minor | The rolling chair stood in the walk-in band | **Fixed:** removed |
| m6 | SCADA | minor | The historian's right side also gathered the projection | **Fixed in part:** projection to frac 0.97; centre taps unique; an area overlap remains (below) |
| m7 | SCADA | minor | The monitor covers the mimic board's middle | **Left:** optional; the mimic still reads either side |
| m8 | Server hall | minor | The survey note at the rack's foot read as on the floor | **Fixed:** `notes_clip1` redrawn 11×26 with the paper in the top 14 px, so its feet stay in front of the rack and the paper sits at door height |
| m9 | Server hall | minor | The perforated aisle was under the middle row | **Fixed:** perforation moved to tile row 3, between the rows |
| m10 | Checkpoint | minor | The badge station was a consumer PC with a mountain wallpaper | **Fixed:** hand-drawn `pnw_badge_printer1` (card printer, keypad, the uncollected badge in its tray); scenario `as-type:pnw_badge_printer` |
| m11 | Checkpoint | minor | Bare west strip; the water cooler repeated the ops floor's | **Fixed:** two static waiting seats facing east on the west wall; a drinks machine instead of the cooler |
| m12 | Checkpoint | minor | The arch parked against the south wall | **Fixed:** standing on the queue line in the lane (feet 262) |
| m13 | Checkpoint | minor | Muster sign "N LOT" | **Fixed:** MUSTER / NORTH / LOT |
| m14 | Generator hall | minor | The plant log's edge picked up the genset panel | **Fixed:** log to x 138 |
| m15 | Generator hall | minor | Nothing showed ATS-1's cover was off | **Fixed:** `pnw_ats_cover1` on the floor in the hatched box, screws beside it |
| m16 | Generator hall | minor | The "steel bench" was the server hall's office desk | **Fixed:** `aes_trestle2` (steel trestle) with the radios, and a tool chest |
| m17 | Vault | minor | The Tomb Gamma printout lay on the trench lid; the text says "stuffed behind the splice housing" | **Fixed:** `notes_tucked1` wedged in the cable ladder 46 px left of the splice; scenario `as-type:notes_tucked` |
| m18 | Vault | minor | Park "crouched over the trunk runs" but the trench was sealed | **Fixed:** one trench plate lifted (open pit with three cables) above where Park stands, the plate laid on the floor, cones beside it |
| m19 | Vault | minor | The junction box repeated the generator hall's wall sprite | **Fixed:** a ventilation air mover (confined space) instead |

Counts: 0 blockers, 3 majors, 19 minors. Fixed 17 in full, 1 in part, 2 left with reasons.

Also: the checkpoint's repainted mat still read as a raised shutter in the cycle 2 shot; flattened to a low-contrast mat close to the terrazzo.

### Tap check (my own, every pixel of every slot, chair and NPC box)

A script (session scratchpad `m07-dressing-build/taps.py`) reads `slot_audit`'s claims, every rolling chair in each map and the measured NPC boxes, and reports, for each pair, the share of A's area where a tap also gathers B, and whether A's centre tap does. After the fixes: **no centre tap gathers two things in any room.** Area-only overlaps left (a tap near an edge, not the middle): ops map/video wall 21% (the two wall items are 6 px apart and both 72 px+ wide; their centres are 47 px+ from each other's top-left); SCADA countdown/historian 28%, historian/projection 19%, projection/Mercer 11% (the room is 256 px wide for a console, the master desk and Mercer); generator hall ATS/log 9%. The interaction walk checks these with real taps.

### Scenario edits (cycle 2; layout fields only, asserted unique, pre-edit copy in the scratchpad)

- `"position": "as-type:pnw_badge_printer"` on the Contractor Badge Station; `"position": "as-type:notes_tucked"` on the Tomb Gamma printout.

### Checks after cycle 2

- Validator: schema passed, door alignment OK, 0 errors. Walls: all six read 64. `slot_audit --notes`: 0 problems; 2 notes prompts on the Tomb Gamma printout (FIXED/takeable), left: it is a loose printout the player takes, and it counts for `recover_mole_evidence`. Routes: 30 of 30. `game.js` `node --check` passes.
- In game (game 2440, all six rooms): no "No Tiled item found". Shots `build_evidence/dressing_c2/`; grid previews `build_evidence/dressing_c2/grid/`. (Game 2439 was a tour cut short by my own pipe; its session closed itself.)

### New assets (cycle 2)

- Hand-drawn (`make_pnw_props.py`): `pnw_master_desk1`, `pnw_badge_printer1`, `pnw_ats_cover1`, `notes_tucked1`; redrawn `pnw_muster_sign1` (30×23), `pnw_video_wall1` (159×42), `notes_clip1` (11×26), with their registered sizes re-synced in the catalog, `tilesets_ref.json` and the extras `.tsx`. No PixelLab spend.

### Assumptions (cycle 2)

- Assumption: centre taps are the standard for "no pick-one menu" (as m05 measured); edge-only overlaps are minor and go to the interaction walk.
- Assumption: removing one back-row chair and the SCADA chair is fine: nothing in the text places a chair there.

## Cycle 3 (2026-10-14): review of cycle 2

A fresh Opus reviewer (read-only; `build_evidence/dressing_c4/review_c3.md`) checked the cycle 2 rooms sprite by sprite, confirmed the cycle 2 findings, and checked my tap script against `game.js` (its logic matches: 32 px slop, top-left anchor for map objects, centre for NPCs; no centre tap gathers two things). Cycle 2 closures confirmed: M1, M2, M3, m1, m4, m5, m8-m14, m16, m17, m19; m2, m6 and m7's reasons hold. Not closed: m3 (the mug and headset drew behind their consoles: items-layer depth is feet + 0.5). In part: m15 (the cover read as a plinth), m18 (the open trench read as a grille). The six rooms read as one building.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| M-1 | Server hall | major | The SCADA backup server (`servers4`) was a three-quarter rack, narrower and shorter than its front-on neighbours | **Fixed (c4):** `pnw_backup_server1`, a blue-steel recolour of `server_rack1` (30×55, front-on, amber activity strip); scenario `as-type:pnw_backup_server`; the middle row shifted 6 px west to fit it |
| m-A | Ops | minor | The cycle-2 mug and headset were hidden behind the consoles | **Fixed (c4):** the mug drawn into `pnw_console_pos1` itself; the headset placed on console A with `r.on` (table items draw on top) |
| m-B | Ops | minor | The photocopier was three-quarter (a third angled piece); the two pushed-back chairs were the same sprite at the same angle; the position-3 chair read as tucked in | **Fixed (c4):** binder shelves (front-on) instead of the copier; the supervisor's chair is `pnw_office_chair_m1`, a mirrored pixel copy; the position-3 chair to feet 204 |
| m-C | SCADA | minor | "AWAITING HOST" sat on the console monitors' tops | **Fixed (c4):** countdown to feet 46 |
| m-D | SCADA | minor | Mercer is "at the master console" but stood 22 px past the desk's end | **Fixed (c4):** `pnw_desk_return1`, an 18 px crop of the master desk's end (no rescale), so the desk reaches him; the projection's slot is unchanged |
| m-E | Generator hall | minor | GEN 1-3 plates hung over the battery racks | **Fixed (c4):** the plates sit on each genset's skid |
| m-F | Generator hall | minor | The ATS cover read as a plinth | **Fixed (c4):** redrawn 16×30, leaning against the wall beside the switch, a screw on the floor |
| m-G | Checkpoint | minor | The east side below the door was bare | **Fixed (c4):** a PPE cabinet on the east wall, a coat stand by the lockers |
| m-H | Vault | minor | The open trench read as a dark grille | **Fixed (c4):** a lit concrete lip on its south edge and three sheathed cables, one cut with copper ends showing |
| m-I | Server hall, generator hall | minor | No sign of the evacuation | **Fixed (c4):** a toolbox left in the server-hall aisle; a hi-vis vest on its hook in the generator hall |

Counts: 0 blockers, 1 major, 9 minors (plus m3 reopened, m15 and m18 in part, all folded in above). Housekeeping noted by the reviewer: `pnw_ops_sign1` and `pnw_security_sign1` are drawn and preloaded but placed nowhere (kept: spare plates for the lighting and background stages); the ops docstring's alarm panel and clock are gone (fixed).

## Cycle 4 (2026-10-14): fixes for cycle 3

All of the above. Hand-drawn or pixel-copied in `make_pnw_props.py` and registered: `pnw_backup_server1`, `pnw_office_chair_m1`, `pnw_desk_return1`; redrawn `pnw_console_pos1` (mug) and `pnw_ats_cover1` (16×30, size re-synced). Scenario: `"position": "as-type:pnw_backup_server"` on the SCADA Backup Server. No PixelLab spend.

### Checks after cycle 4

- Validator: schema passed, door alignment OK, 0 errors. Walls: all 64. `slot_audit`: 0 problems. Tap check: no centre tap gathers two things; the area-only overlaps are the cycle 2 list. Routes: 30 of 30. `game.js` `node --check` passes.
- In game (game 2441, all six rooms): no "No Tiled item found". Shots `build_evidence/dressing_c4/`; grid previews `build_evidence/dressing_c4/grid/`. The first-room render is refreshed: `build_evidence/dressing_c4/first_room_operations_floor.png`.
