# m08 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/M08_PASS_BRIEF.md`, stage 4. Up to ten design → implement → review cycles while each still improves the rooms; close when a fresh review finds nothing above minor and a Sonnet interaction walk on :3001 finds no pick-one menus or stuck spots. Evidence lives in `build_evidence/dressing_c<N>/`; in-game shots come from `tools/playtest/lighting-tour.sh` on the keyless :3001 server (every room unlocked, HUD hidden), in fresh games of my own. m05's dressing log is the worked example.

The aim: SAFETYNET headquarters, the Citadel, at night on a Level Red posture, while the player hunts a mole among their own colleagues. A government intelligence building that takes itself seriously: dark slate and walnut front of house, institutional blockwork in the back rooms, badge readers blinking red at every door. Each room should read as what it is and differ from the others.

Shared files touched (another agent is dressing m07 at the same time, so every edit is additive and small): `scripts/generate_rooms.py` (one four-line hook in `main()` that loads `scripts/room_gen/hq_rooms.py`; `register_object.py --wall` added the hq wall items to `WALL_MOUNTED_EXTRAS`), `public/break_escape/js/core/game.js` (preloads), `scripts/room_gen/catalog.json`, `scripts/room_gen/tilesets_ref.json`, `public/break_escape/assets/rooms/objects_hospital_extras.tsx`, `scripts/scenario-schema.json` (room-type enum), `README_scenario_design.md` (room table). m08's builders live in their own module so they don't add to the shared builder file.

## Cycle 1 (2026-10-14): survey, the first room, and all nine rooms built

### Survey: what was there

The erb's nine rooms (authoritative), door corners from `scripts/predict_door_sides.py` (every N/S door in the left corner, every E/W door on row 2):

| Room | Map type before | Size | Doors |
|---|---|---|---|
| main_lobby (start) | `room_reception` | 10×10 | N, W, E |
| director_office | `room_ceo` | 10×10 | S (lobby covers the bottom two rows) |
| operations_floor | `room_office` | 10×10 | W, E, N, S (archives cover the bottom two rows) |
| intel_analysis | `room_control_1x2gu` | 10×6 | S (ops covers the bottom two rows: floor y 64-128) |
| server_room | `room_servers` | 10×10 | W |
| security_archives | `room_archive_1x2gu` | 10×6 | N |
| cryptography_lab | `room_lab` | 10×10 | E, W, S |
| interrogation_room | `room_security` | 10×10 | N |
| break_room | `room_break` | 10×10 | E |

Before shots, in game: `build_evidence/dressing_c1/before/<room>-a.png`, `sheet.png` (game 2442).

### Critique (ranked)

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map is shared with other scenarios (room_reception with 26). Nothing could be redressed without changing other missions, and the shared maps' wall paintings float outside the rooms (the lobby's landscape on the east wall). |
| A2 | All | major | Nothing says SAFETYNET or an intelligence HQ: purple carpet everywhere, landscape prints, orange retro chairs, chalkboards on easels, floor plants in rows. |
| A3 | All | major | 8 objects had no slot and landed at random (`slot_audit`, 12 problems): the Security Alert Board, the Operations Status Board, the Tactical Board, the GitList server, the Access Log, the Database Catalogue, the CyberChef workstation, both interrogation screens (two "landscape" smartscreens on the interrogation floor), locker 0x88. Two lockers drew a 62 px sprite from a 30 px safe slot. |
| B1 | Break room | major | The three lockers stood in open floor at the foot of the room on `student_locker1` (a keypad locker, though they take keys), and HaX stood within a tile of 0x23 (browser check). |
| O1 | Ops floor | minor | The junior analyst at (8,8) stood in the bottom two rows, under the archives' back wall. |
| I1 | Intel | minor | Phantom at (5.0,4.3) had his feet in rows 4-5, which the ops floor's back wall covers in play. |

Counts: 1 blocker, 3 majors, 2 minors.

### Plan

1. Give m08 its own building: nine `room_hq_*` map types, built by builders in `scripts/room_gen/hq_rooms.py`, so the shared maps stay as they are. Same sizes, so room positions and door corners don't move.
2. Sheets (`scripts/room_gen/make_hq_tileset.py`, new; imports the m05/m06/ZDS helpers). One brand colour, a SAFETYNET signal-blue line on every wall (dark red in the interrogation suite). Walls: slate with walnut slats behind reception (lobby), umber with walnut slats (Director), slate blue-grey (ops, intel), lab grey (crypto), graphite (servers), olive blockwork (archives), pale grey blockwork (interrogation), warm putty (staff room). Floors: dark granite with the SAFETYNET seal at the spawn and walk-off mats at the W and E doors (lobby), walnut parquet with a navy rug (Director), charcoal carpet with lighter walkways joining the four doors (ops), dark navy carpet (intel), raised floor with cold aisles (servers), sealed concrete with yellow aisle lines (archives), grey anti-static tiles with a hatched box at the key-material cabinet (crypto), worn grey vinyl with a darker square under the table (interrogation), wood-effect vinyl with a kitchen strip (staff room). Dark walls and floors keep enough chroma for `check_room_walls.py`.
3. Art: hand-drawn signs, screens and notices (`scripts/room_gen/make_hq_props.py`, new); PixelLab only for what didn't exist; the house set for the rest.
4. Every scenario object onto a real fixture (as-type where it's a wall fixture or a locker); explicit floor positions removed.
5. The lobby first, as the start room and the setting's first impression, for the user's sign-off; the other eight in the same style.

### First room: the Citadel lobby (for sign-off)

`room_hq_lobby`. Back wall: the SAFETYNET / THE CITADEL wordmark on the walnut slats over a black reception counter with a blue light line (ATHENA's desk: the visitor badge printer with a blank card in its slot, a monitor, a phone, a plant), the LEVEL RED alert screen on the slats beside it, and in the NE corner the memorial wall (black granite, rows of gold stars, the last two brighter) with white lilies at its foot. The SAFETYNET seal is inlaid in the granite at the spawn. West of the spawn, the security line: an X-ray baggage scanner and a walk-through metal-detector arch (collision on its posts only, so the player can walk through). SE, a waiting area (black leather sofa, glass table, club chair, a fig); SW, a tall plant and a brochure rack. A badge reader with a red LED by each door, a fire alarm point and extinguisher on the west wall, a LEVEL RED poster on the east wall. ATHENA at (4.5,3.8) stands in front of the counter, unchanged.

- Slots: `as-type:hq_badge_printer` (Visitor Badge Printer) on the counter, `as-type:hq_alert_screen` (Security Alert Board) on the slats, 80 px apart.
- Shot: `tmp/review/m08_dressing_first_room.png` (also `build_evidence/dressing_c1/first_room_lobby.png`, game 2444). Logged as pending in `DECISIONS_PENDING.md` (R1).

### The other eight rooms

- **Director's office (`room_hq_director`):** walnut parquet and slats; bookcase NW, the window, a credenza with phone and orchid, the wall clock, a SAFETYNET plate; his big desk on the navy rug (the dossiers on it, a laptop), the safe on the floor at the desk's left end ("under the desk"), two non-rolling executive chairs facing the desk; a globe NE, a fig SE, a black club chair on the west side, a picture on the east wall. Netherton at (6.8,6.2) on clear rug east of the desk, unchanged.
- **Operations floor (`room_hq_ops`):** OPERATIONS plate, world clocks (LDN NYC TKY), the status wall (world map with four red markers, three red STAND DOWN bars, INVESTIGATION), a SHH poster; the walkways clear; the photocopier with the print tray west of Cipher; Cipher barricaded behind a desk of three monitors ("barricaded behind three monitors of proofs"); the analyst moved to (8.2,6.6) in front of her own desk of threat feeds; steel filing cabinets, a bin and a water cooler along the foot.
- **Intelligence analysis (`room_hq_intel`):** INTELLIGENCE plate, an analysis console under a SIEM screen, the four-site tactical board (a hand-drawn coast, four sites ringed in red, three crossed out, the one team square with arrows to each, T-0) with clear floor under it, a threat map over Phantom's desk (his notebook, a laptop), a steel cabinet. Phantom moved to (5.0,3.1), so his feet are on the visible floor, standing at the board nobody could take down.
- **Server room (`room_hq_servers`):** SERVER ROOM plate, suppression panel; a back row of racks (UPS, racks, storage, tape library); a middle row of six racks on the far side of the first cold aisle; the access log on a tool trolley at the end of the back row; the GitList terminal on a steel desk SW and the evidence relay on its own desk SE (164 px apart); precision air-con on the west wall below the door.
- **Security archives (`room_hq_archives`):** ARCHIVES / AUTHORISED ONLY; the archivist's desk west (terminal, the database catalogue), the badge audit printout on the floor below it ("slid off the desk onto the floor", its own floor slot now, not an explicit position); two archive shelves and a mobile stack; a reading table SE with the leak-investigations index. The N-door lane is clear.
- **Cryptography lab (`room_hq_crypto`):** the key-material cabinet in a hatched keep-clear box, CRYPTOGRAPHY plate over the cipher whiteboard (ROT13, a frequency chart, a Caesar wheel), an Enigma machine under glass; Nightshade's bare desk west of him (one locked workstation, nothing else, as his observations say), the CyberChef station SE (the chef-hat laptop), a security container and the confidential-waste console east. The west strip from the W door to the S door is clear.
- **Interrogation suite (`room_hq_interview`):** RECORDING lamp, the evidence wall screen (CASE FILE, three blank silhouettes: the sprite never shows a name), the one-way mirror, the disposition screen; the steel table bolted on its darker square, a fixed chair on the interviewer's side; a camera on a tripod watching the table.
- **Staff room (`room_hq_break`):** a dark kitchenette (kettle, mugs), the coffee machine with the facilities post-it on it, the NO post-its security poster on the wall, then the three lockers in a row against the back wall on m08's own sprites (`hq_locker_a1` 0x23 with conference stickers, `hq_locker_b1` 0x47 with a neat label and nothing else, `hq_locker_c1` 0x88 with an airline luggage tag on the handle; key cylinders, not keypads). The off-duty agent moved to (6.5,4.8) at a cafe table with a magazine, every locker within 105 px of him (his circle is 160). A middle table with someone's legal pad (the leak timeline); HaX at her table in the SW corner, now 150 px from the nearest locker; a plant, a sofa.

### Scenario edits (layout fields only; each replacement asserted unique on a fresh read; pre-edit copy in the session scratchpad)

- Nine room `type`s → `room_hq_*`.
- `"position": "as-type:..."` on the badge printer, Security Alert Board, Operations Status Board, Tactical Board, Evidence Display, Disposition Screen, the post-it (`notes_postit`), the legal pad (`notes_legalpad`) and the three lockers (`hq_locker_a/b/c`, replacing their explicit positions and the `"sprite": "student_locker1"` overrides). The locker comment updated.
- Explicit position removed: the badge audit printout (was (4.6,3.4)).
- NPC positions: off-duty agent (7.5,7.8) → (6.5,4.8); junior analyst (8,8) → (8.2,6.6); Phantom (5.0,4.3) → (5.0,3.1). Phantom's sight cone (120°, 150 px, facing down) still covers the floor in front of him. Every other NPC unchanged.

### Checks after cycle 1

- Validator (`--skip-ink --no-graph`): schema, geometry and door alignment pass, no errors (suggestions only, unchanged). `check_door_alignment.py`: all OK. Walls: all nine maps read 64.
- `slot_audit.py --notes`: 0 problems (12 before). 4 notes prompts on the post-it and the legal pad (FIXED: "read in place?", "a fixture should not be takeable"): left, both are loose papers the player is meant to take.
- Tap check (every slot against every slot, every rolling chair and every NPC, the engine's 32 px rule, taps at centre and top-left): the lockers at 26 px pitch had top-left taps reaching the next locker; respaced to 34 px (x 140, 174, 208), 0 hits.
- In game (game 2444, all nine rooms): every map loads, no "No Tiled item found", no failed request in the session log. Sheet: `build_evidence/dressing_c1/after/sheet.png`; grid previews `build_evidence/dressing_c1/grid/`; map contact sheet `build_evidence/dressing_c1/preview/contact_sheet.png`.

### New assets (cycle 1)

- PixelLab: one `create-1-direction-object` call at a 64 px canvas, "straight-on flat front view" phrasings, refs vending machine, server rack, water cooler (balance 1757 → 1747). 11 of 16 frames installed, trim only: `hq_interview_table1`, `hq_xray1`, `hq_enigma1`, `hq_mobile_stack1`, `hq_archive_shelf1`, `hq_security_container1`, `hq_green_safe1`, `hq_camera_tripod1`, `hq_detector_arch1`, `hq_console1`, `hq_rack1`. All came back front-on.
- Hand-drawn (`make_hq_props.py`): `hq_logo_sign1`, `hq_logo_small1`, `hq_memorial1`, `hq_flowers1`, `hq_alert_screen1`, `hq_ops_board1`, `hq_tactical_board1`, `hq_evidence_wall1`, `hq_disposition1`, `hq_one_way_mirror1`, `hq_recording1`, `hq_badge_reader1`, `hq_poster_postit1`, `hq_poster_ears1`, `hq_poster_red1`, `hq_cipher_board1`, `hq_locker_a1`, `hq_locker_b1`, `hq_locker_c1`, `hq_badge_printer1`, `hq_confidential_bin1`, `notes_postit1`, `notes_legalpad1`, and plates `hq_ops_sign1`, `hq_intel_sign1`, `hq_crypto_sign1`, `hq_server_sign1`, `hq_break_sign1`, `hq_director_sign1`, `hq_archive_sign1`, `hq_interview_sign1`.
- All registered with `register_object.py` (catalog, tileset, `game.js` preload, wall list); no duplicate gids. Nine sheets and nine maps registered in `game.js`, the schema enum and the README room table.

### Assumptions (cycle 1)

- Assumption: m08-only map types are the right fix, as in m03-m07; the shared maps stay untouched.
- Assumption: the lobby is the right first room for sign-off: it's the start room and sets the building's look.
- Assumption: moving three NPCs is a layout change in my remit: none of the three positions is referred to in the ink or the routes, and each move puts the NPC on visible clear floor (the agent's also keeps the sight-circle promise in the erb comment).
- Assumption: Cipher standing behind his desk (ops) and Nightshade across the interrogation table are right, though the skill prefers NPCs in front of furniture: Cipher's observations say he is "barricaded behind three monitors", and a subject across the table is the classic interrogation framing.

## Cycle 2 (2026-10-14): review of cycle 1, and fixes

A fresh Opus reviewer (read-only) checked the nine rooms against the skill's critique list and the hard constraints. Its main catch: cycle 1's tap check sized NPCs at about 32 px, but the engine's tap area for an NPC is its whole 80×80 frame (`game.js` `gatherInteractablesNearClick`: sprite bounds; body centre at `position*32`, frame x ±40, y −71..+9). Checked against the code and accepted; the tap check now uses the frame. Hard constraints otherwise passed: no slot within 32 px of another, no rolling `chair-*` in any HQ map, door lanes clear, feet ≤ 256 where a room lies to the south, wall items on the wall face, NPCs on clear floor, all three lockers inside the agent's circle (furthest ~92 px), HaX 140 px+ from 0x23.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| C2-1 | Lobby | major | ATHENA's frame (x 104-184) covered the badge printer: every tap on it raised a menu | **Fixed:** ATHENA (4.5,3.8) → (5.6,3.8), frame x 139-219; the erb comment updated |
| C2-2 | Intel | major | Phantom at (5.0,3.1): his frame held the tactical board's centre and his head covered its foot | **Fixed:** (5.2,3.6): frame x 126-206, y 44-124, clear of the board and the notebook; feet on the visible floor |
| C2-3 | All (docs) | minor | Builder docstrings sized NPCs wrongly | **Fixed:** the frame rule is in `hq_rooms.py`'s module docstring and each NPC line. For the skill's "Interactables need room" note: left for the orchestrator (skills are outside this stage's files) |
| C2-4 | Interrogation | major | Sparse; no chair on the subject's side | **Fixed:** the subject's chair, a recorder on the table, a clock on the west wall, the interviewer's desk SE (laptop, evidence box), archive boxes, a bin |
| C2-5 | Crypto | major | Sparse, chairless desks | **Fixed:** a front-on black chair at both desks, a second analysis bench under the cipher board (dark terminal, Pi cluster), a shredder by the confidential-waste console, a second key-material safe south, a wall clock |
| C2-6 | Archives | major | A small office with two shelves; the lone mobile stack read as a safe | **Fixed:** three archive shelves along the back wall (a run of mobile-stack ends was tried and also read as safes), archive boxes waiting to be shelved, a chair at each desk |
| C2-7 | Ops | major | Thin; no chairs; the promised hot desks missing | **Fixed in part:** a stood-down hot desk back to back with Cipher's (two dark monitors), Cipher's chair pushed aside, a fire alarm point on the west wall. **Left:** the W-E walkway stays full height (y 72-124): the E and W door mouths span y 64-118 and the strip under the status wall is where the player stands to read it |
| C2-8 | Ops | minor | The analyst's head covered her desk | **Fixed:** analyst (8.2,6.6) → (8.2,7.0), her desk up to feet 170 |
| C2-9 | Lobby | minor | The club chair faced away from the table; the fig crowded the sofa | **Fixed:** `club_chair_e1`, fig 4 px east |
| C2-10 | Lobby | minor | The lilies stood in the E-door mouth; the walk-off mats read as black cabinets | **Fixed:** lilies to x 240; mats repainted low-contrast (charcoal-blue, lighter border, faint ribs) and smaller |
| C2-11 | Director | minor | The safe was a three-quarter dial safe beside the desk, not a biometric one under it | **Fixed:** hand-drawn front-on `hq_desk_safe1` (green fingerprint reader, keypad fallback) tucked against the desk end; erb `as-type:hq_desk_safe` |
| C2-12 | Intel | minor | Phantom's notebook landed on a loose-paper sprite; no chair | **Fixed:** hand-drawn `notes_notebook1` (black hardback, red band, pencil), erb `as-type:notes_notebook`; a chair at the console |
| C2-13 | Break room | minor | Nothing to drink | **Fixed:** a drinks machine SE beside the sofa. No noticeboard (no free wall: kitchen, lockers and the poster fill the back wall, the E wall holds the door) |
| C2-14 | Servers | minor | Empty band between the desks | **Left:** the room reads as finished and that band is the walk between the two terminals |
| C2-15 | Break, Director | minor | Cycle-1 shots out of date; lockers to be tapped from the front in the walk | **Fixed:** retaken (game 2455); the locker taps go to the Sonnet walk |

Counts: 0 blockers, 6 majors, 9 minors. Fixed 12, in part 1, left 2 with reasons.

Also this cycle: the crypto lab's two angled `aes_office_chair1`s were swapped for front-on `exec_chair_black1` (the ops floor keeps one angled chair, Cipher's, pushed aside).

### Checks after cycle 2

- Validator: schema, geometry and door alignment pass, no errors. Walls: all 64. `slot_audit --notes`: 0 problems; 6 notes prompts, all on loose papers the player takes (post-it, legal pad, notebook), left.
- Tap check with 80×80 NPC frames: 0 slot-slot hits, 0 chair hits, 0 NPC hits.
- In game (game 2455, all nine rooms): no "No Tiled item found". Sheet `build_evidence/dressing_c2/sheet.png`, grid previews `build_evidence/dressing_c2/grid/`. First-room render refreshed (`tmp/review/m08_dressing_first_room.png`, `build_evidence/dressing_c2/first_room_lobby.png`).

### New assets (cycle 2)

Hand-drawn: `hq_desk_safe1`, `notes_notebook1`, `hq_recorder1`. No PixelLab spend.

### Scenario edits (cycle 2, layout only)

ATHENA (4.5,3.8) → (5.6,3.8) and her position comment; Phantom (5.0,3.1) → (5.2,3.6); analyst (8.2,6.6) → (8.2,7.0); `as-type:hq_desk_safe` on the Director's Safe; `as-type:notes_notebook` on Phantom's notes.

### Note for the orchestrator

Commit `0899995d` (m07's room-dressing commit) carries m08's cycle-1 kit as it stood then (the `room_hq_*` maps and sheets, `hq_rooms.py`, the props scripts, the shared registrations; its message says so). Everything since is uncommitted.

## Cycle 3 (2026-10-14): review of cycle 2, interaction walk, and fixes

### Review (fresh Opus reviewer, read-only)

All hard constraints passed: 0 tap hits with 80×80 NPC frames, no rolling chairs, lanes clear, feet ≤ 256 where needed, wall items on the wall face, lockers in the circle, HaX ~150 px from 0x23. C2 items: all closed or their reasons hold, except C2-3 (one docstring still stale, now C3-5). Verdict: every room done except the break room.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| C3-1 | Break | major | The facilities post-it (the only source of the archives password and the badge PIN) drew behind the coffee machine: a floor item at feet 72 against the machine's 100, only a 2 px sliver visible | **Fixed:** the machine is now a table-layer object (with its collision strip) and the post-it a `conditional_table_items` item on its left face, so it draws on top. Confirmed in game (game 2458, zoomed) |
| C3-2 | Break | minor | The off-duty agent's frame covered the bottom of lockers 0x47 and 0x88, and he stood under them like a guard | **Fixed:** (6.5,4.8) → (6.6,5.3), frame clear of the lockers; farthest locker corner 152 px (circle 160) |
| C3-3 | Intel | minor | Phantom's frame covered the foot of the tactical board | **Fixed:** (5.2,3.6) → (5.2,3.95), feet ~122 on the floor |
| C3-4 | Crypto | minor | Nightshade's frame covered 4 px of his own workstation | **Fixed:** x 5.3 → 5.45 |
| C3-5 | Interrogation | minor | Docstring sized the NPC the old way | **Fixed** |
| C3-6 | Servers, interrogation | minor | The tape library and the interrogation boxes crossed onto the east wall | **Fixed:** back row from x 93 (ends at 288); boxes SW beside the bin |
| C3-7 | Servers | minor | The south half (both terminals) reached only through one 30 px gap | **Fixed:** the middle row's east rack removed (60 px gap) |
| C3-8 | Crypto | minor | The second safe stood alone mid-floor | **Fixed:** removed |

Counts: 0 blockers, 1 major, 7 minors. All fixed.

### Interaction walk (Sonnet, games 2460 and 2463, every room unlocked server-side; sessions stopped)

Every scenario object opened on a top-left tap and a centre tap with no pick-one menu; every NPC talked; every door of the lobby, ops floor and crypto lab walked both ways; no "No Tiled item found", no duplicate or missing sprite; the server room's south half reached by tap-to-move and by keys.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| W1 | Lobby | minor | The badge printer was reached from behind the counter; reach from the visitor side untested | **Fixed (c4):** printer moved to the counter's front edge; the counter got full collision |
| W2 | Servers | minor | The player could walk behind the middle rack row (collision only 10 px deep) and vanish | **Fixed (c4):** rack rows, lockers and archive shelves get collision 32-50 px deep |
| W3 | All | minor | `assets/icons/text-file.png` is missing (404 when a text file opens) | **Left:** an engine asset, not dressing; for the orchestrator |
| W4 | Break | minor | The off-duty agent's dark hoodie reads like the player's sprite at a glance | **Left:** a character-stage question (his sprite is `male_hacker_hood_v2`); for the character pass |

### Confirmation run (Sonnet, games 2468, 2471, 2472; sessions stopped)

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| L3 | Break | major | None of the three lockers could be opened from the floor in front of them, by tap or E. The engine measures interaction range (32 px) from a map sprite's top-left; a player at the foot of a 62 px wall locker has its centre ~36 px from that point. (The first walk's locker taps came from spots the deeper collision now closes.) | **Fixed (c4):** lockers redrawn 20×52; top-left now ~26 px from a player at their foot |
| L1 | Lobby | minor | The player could walk round the west end of the counter and along the back strip | **Fixed (c4):** a collision box over the whole counter; the alert screen moved to the NE corner (x 238-286) so a player can stand under it (the counter's collision now ends at x 210), the memorial onto the slats beside the wordmark, the lilies by the counter's end |
| L2 | Ops / archives | minor | The ops floor's bottom strip is walkable under the archives' wall overlay | **Left:** the engine's room overlap, the same in every mission; the S door needs that strip |
| L4 | Servers | minor | A far tap on a desk terminal walks the player to the desk's north edge first | **Left:** engine pathing (the approach point lies behind the desk); a second tap works |
| — | Lobby, servers, archives | pass | Printer opens from the visitor side; nobody gets behind the shelves; the player is never drawn behind a rack row; the access log, both terminals, the index and the printout open | — |

## Cycle 4 (2026-10-14): fixes from the walk

All of L1, L3, W1 and W2 above. Lockers resized in place (same names; `catalog.json`, `tilesets_ref.json` and the extras `.tsx` heights edited exactly, no reformat). No new art beyond the redraw; no PixelLab spend.

### Checks after cycle 4

- Validator: no errors; door alignment and geometry pass. Walls: all 64. `slot_audit --notes`: 0 problems (6 prompts on loose papers, left). Tap check (80×80 NPC frames): 0 hits.
- In game (game 2474, all rooms): no "No Tiled item found". Sheet `build_evidence/dressing_c4/sheet.png`, grids `build_evidence/dressing_c4/grid/`. First-room render refreshed: `tmp/review/m08_dressing_first_room.png`, `build_evidence/dressing_c4/first_room_lobby.png`.

## Cycle 5 (2026-10-14): confirmation review, walk, and the last fixes

### Review (fresh Opus reviewer, read-only)

It built its own audit (`scratchpad/m08-dressing-review-c5/audit.py`): the nine built maps with their collision layers, a flood fill of where the player can stand from each door, reach from those spots to every slot's top-left, and every tap point inside each interactable's bounds tested against every other anchor. Reach: worst case locker 0x23 at 26 px, everything else under 18 px. Passed: no rolling chairs, lanes clear, feet ≤ 256 where needed, wall items on the wall face, no floor item in front of a wall item to read, NPC bodies on clear floor and reachable, lockers inside the sight circle (farthest corner ~117 px from the circle's centre, the sprite centre), HaX ~150 px from 0x23, at most two angled pieces in any room (ops: Cipher's chair and the photocopier).

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| C5-1 | Director | major | A tap on the safe's upper right (or the desk top between) was within 32 px of the dossiers' top-left: a pick-one menu | **Fixed:** dossiers to the back-middle of the desk (top-left (150,127)), safe 8 px further from the desk end (x 88): top-lefts 66 px apart, so no spot reaches both. Laptop to the desk's left. Audit: 0 conflicts. Browser: no menu (below) |
| C5-2 | Break | minor | Locker anchors 34 px apart: a tap high on one locker's right side, from between two lockers, can reach the next | **Left:** the back wall has no room for a 64 px pitch (kitchen, machine, three lockers, poster); a tap on the locker itself from its foot opens it alone (browser) |
| C5-3 | Break | minor | A tap on the coffee machine's upper right can reach both the post-it and 0x23 | **Left:** same reason; taps on the post-it or the locker are clean |
| C5-4 | Intel | minor | Phantom's empty frame corner within 32 px of the notebook | **Fixed:** notebook to the desk's east end, laptop west (anchors 76 px apart) |
| C5-5 | Interrogation | minor | The subject's chair drew over Nightshade's shins | **Fixed:** chair tucked under the table (feet 172), below his feet; checked with him shown (game 2476) |
| C5-6 | Interrogation | minor | Still the barest room | **Left:** an interview room is meant to be bare; table, chairs, recorder, camera, desk, boxes, clock and the three wall pieces are there |
| C5-7 | Director | minor | The safe had no collision | **Fixed** |
| C5-8 | Break | minor | Locker collision 16 px wide left 18 px gaps the player might slip through | **Fixed:** full-width strips (14 px gaps); browser: nobody gets between or behind |
| C5-9 | Docs | minor | Two stale docstrings | **Fixed** |

Counts: 0 blockers, 1 major, 8 minors. Fixed 6, left 3 with reasons.

### Interaction walk (Sonnet, game 2475, every room unlocked server-side; session stopped)

Pre-C5 maps. Every scenario object opened by tap and by E from where a player can stand (no teleporting), with no pick-one menu; the lockers open from the floor in front (L3 closed); the counter blocks walking behind it from both ends (L1 closed); the alert screen opens from the floor below it; every door of the lobby, ops floor and crypto lab both ways; nobody hidden behind furniture.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| F1 | Ops / intel | minor | Standing at the ops status board, the room detector reports `intel_analysis` (intel's 10×6 map overlaps ops' top 64 px). Could fire intel's entry logic from ops; not seen | **Left:** engine room detection, and the same room sizes and positions as before this stage; for the orchestrator |
| F2 | Archives | minor | `assets/icons/copy-sm.png` 404 when a text file opens (with the known `text-file.png`) | **Left:** engine assets; for the orchestrator |
| note | Break | — | The first keyless tap on a locker fires the off-duty agent's one-time catch before the locker screen | By design (pass-5 puzzle chains); not layout |

### Targeted check of the C5 fixes (Sonnet, games 2477-2481; sessions stopped)

Dossiers (centre, top-left, E), safe (centre, top-left, upper right, E), Phantom's notebook and Phantom, each locker (centre and E from its foot) and the post-it: each opens alone, no menu anywhere. Nobody gets between or behind the lockers. No page errors beyond TTS 503s. One note: a tap 20-30 px left of the dossiers, from beside the desk, opens them; that is the engine's 32 px tap slop round a sprite's top-left, and it opens nothing else.

### Checks after cycle 5

- Validator: no errors; geometry and door alignment pass. Walls: all 64. `slot_audit --notes`: 0 problems (6 prompts on loose papers, left). Tap check: 0 hits; the reviewer's audit: only the two accepted break-room cases (C5-2, C5-3). `game.js`: `node --check` passes.
- In game (game 2476, all rooms, the confrontation Nightshade shown): no "No Tiled item found". Sheet `build_evidence/dressing_c5/sheet.png`. First-room render: `tmp/review/m08_dressing_first_room.png` (also `build_evidence/dressing_c5/first_room_lobby.png`).

### Phase art: room dressing CLOSED (2026-10-14)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| 1 (survey, first room, all nine rooms built) | 1 | 3 | 2 |
| 2 (review of cycle 1) | 0 | 6 | 9 |
| 3 (review of cycle 2, interaction walk, confirmation run) | 0 | 1 review + 1 walk (L3) | 7 review + 7 walk |
| 4 | fixes for cycle 3's walk | | |
| 5 (review, walk game 2475, targeted check games 2477-2481) | 0 | 1 (C5-1, fixed and confirmed) | 8 review + 2 walk |

Nothing above minor remains. Left, each with its reason above: the break room's two edge-tap cases (C5-2, C5-3), the bare interview room (C5-6), the ops walkway kept full height (C2-7), the server room's empty band (C2-14), and for the orchestrator: the ops/intel room-detection overlap (F1), the missing `text-file.png` and `copy-sm.png` icons (W3, F2), the walkable strip under a south room's wall (L2), the far-tap approach to a desk terminal (L4), the off-duty agent's hoodie reading like the player (W4, character stage), and adding the 80×80 NPC frame and top-left reach rules to the skill's "Interactables need room" note (C2-3). The first-room look waits for the user's sign-off (R1 in `DECISIONS_PENDING.md`).

Spend: PixelLab 1757 → 1747 (one 64 px call, cycle 1); no Gemini.

Next: lighting (`mission-room-lighting`), then the POV backgrounds. Lighting should know about: the lobby's red LEVEL RED screen, the badge readers' red LEDs, the memorial wall; the ops status wall and its red bars; intel's screens; the server racks' lights; the interrogation RECORDING lamp and the one-way mirror; the crypto lab's key cabinet reader and Enigma case; the staff room's drinks machine.
