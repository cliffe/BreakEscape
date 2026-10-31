# m06 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/M06_PASS_BRIEF.md`, stage 4. Up to ten design → implement → review cycles, about five while each one still improves the rooms. Evidence lives in `build_evidence/dressing_c<N>/`; in-game shots come from `tools/playtest/lighting-tour.sh` on the keyless :3001 server (every room unlocked, HUD hidden), in fresh games of my own. m04's dressing (`scenarios/m04_critical_failure/ROOM_DRESSING.md`) is the worked example.

The aim: a night at the Crypto Anarchists' HashChain Exchange, a slick fintech front over a crypto money operation. Each room should read as what it is and as different from the others. The user's standing notes from m04: photo-based sprites over new PixelLab ones where both exist; rooms packed and lived-in, not open floor; each cycle should make the rooms better and more detailed.

## Cycle 1 (2026-10-13): survey, the first room, and all nine rooms built

### Survey: what was there

The erb's nine rooms (authoritative):

| Room | Map type before | Size | Shared with |
|---|---|---|---|
| reception_lobby | `room_reception` | 10×10 | 26 scenarios |
| security_checkpoint | `hall_1x2gu` | 10×6 | 4 |
| trading_floor | `room_office` | 10×10 | 51 |
| irina_office | `room_office` (same map) | 10×10 | |
| blockchain_lab | `room_office` (same map) | 10×10 | |
| server_room | `room_servers` | 10×10 | 19 |
| data_center | `room_servers` (same map) | 10×10 | |
| executive_wing | `hall_1x2gu` (same map as the checkpoint) | 10×6 | |
| satoshi_office | `room_ceo` | 10×10 | 15 |

Before shots, in game: `build_evidence/dressing_c1/before/<room>-a.png` (game 2317).

### Critique (ranked)

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map is shared with other scenarios, and three groups of m06 rooms share one map: trading floor, Irina's office and the blockchain lab are the same purple office; the server room and data centre are the same; the checkpoint and executive wing are the same hall. Nothing can be redressed without changing other missions. |
| A2 | All | major | Nothing says fintech or crypto anywhere: purple carpet, landscape prints, chalkboards on easels, retro orange chairs, floor plants in the lobby. |
| A3 | All | major | 5 objects have no slot and land at random (`slot_audit`): the IT checklist, the backend server terminal, the transaction server, the custody console, the press clipping. Three more are pinned to floor tiles by explicit position (the rack sheet, the manifesto on the floor of Satoshi's office, the checklist at (2,2)). |
| T1 | Trading floor | major | A generic office with two desk blocks and a chalkboard; no screens, ticker or trading desks. |
| S1 | Server room / data centre | major | Identical rooms; a landscape print over the racks; the custody console (the mission's key terminal) has no fixture and nothing marks custody or cold storage. |
| E1 | Executive wing | major | A blank hall with three landscape prints; the press clipping lies on the floor at a random spot. |
| C1 | Satoshi's office | minor | Reads as a CEO office, but generic (potted plant, landscape prints, a red pot); the manifesto lies on the floor. |
| R1 | Lobby | minor | A purple waiting room with four floor plants and retro chairs; nothing says exchange. |

Counts: 1 blocker, 6 majors, 2 minors.

### Plan

1. Give m06 its own building: `room_hce_*` map types (HashChain Exchange), built by new builders in `scripts/generate_rooms.py`, so the shared maps stay as they are. Same sizes as now, so room positions, door corners, NPC tiles and the guard's and Kemal's windows don't move.
2. Sheets (`scripts/room_gen/make_hce_tileset.py`, new; it imports m04's helpers and leaves m04's sheets alone): midnight navy with a bitcoin-amber brand line front of house (lobby, checkpoint, trading floor, executive wing, Satoshi's office); warm pale grey with the amber line in the back offices (Irina's office, the lab); petrol blue with a cold cyan line in the server room and data centre. Floors: marble with a gold hex-chain inlay (lobby), the marble plain (checkpoint), blue-grey carpet with a lighter aisle (trading floor), taupe carpet (Irina), grey vinyl with trunking (lab), raised floor with cold aisles (server room), darker raised floor with a hatched line round the custody cage (data centre), smoked oak with a navy runner (executive wing), smoked oak with an amber rug (Satoshi).
3. Art: the photo-based house set for furniture where it exists; hand-drawn signs, ticker, clocks, screens, whiteboards, the press clipping and the white-paper frame (`scripts/room_gen/make_hce_props.py`, new); PixelLab only for what doesn't exist (mining rigs, crypto ATM, HSMs, cage, etc.).
4. Every scenario object onto a real fixture: slots in each map, `as-type` for the backend terminal and the press clipping, explicit floor positions removed.
5. Trading floor first, as the setting's signature room, for the user's sign-off; then the other eight in the same style.

### First room: the trading floor (for sign-off)

`room_hce_trading`. Back wall: an LED price ticker over a wall of market monitors (`screens`), world clocks for London, New York and Tokyo by the N door. Five steel trading desks in two banks of three rows, each with two or three screens and two mesh chairs tucked in at the front edge (the traders face their screens); the west bank's third row is a photocopier and coffee point. A lighter carpet aisle down the middle (x 114-180), where Irina and the trader stand and where her things fall if she's knocked out. The row y 64-104 is clear wall to wall (W and E doors), and an east lane x 258-288 runs clear from the N and E doors down to the S door.

- Slots: the Trading Workstation on the east bank's front desk (`pc10`, the only one, first in `table_items`), the Daily Trading Report on the west bank's middle desk (`notes3`), 70 px+ apart.
- A bin first placed at the east desks stood under the trader's feet (in-game shot, game 2319); moved to the aisle side of the west bank.
- Shot: `tmp/review/m06_dressing_first_room.png` (also `build_evidence/dressing_c1/trading/`). Logged as pending in `DECISIONS_PENDING.md` (D8).

### The other eight rooms

- **Lobby (`room_hce_lobby`):** the HASHCHAIN wordmark over a curved black reception desk (the brochure on it), a candlestick screen, a visitor kiosk, a bitcoin ATM in the NE corner, an exit sign by the N door; a hardware wallet in a display case and a gold coin on a pedestal flank the hex-chain inlay; a club-chair lounge with a glass table along the south, fig planters, a water cooler, a brochure rack. The N-door lane (x 32-70) and the spawn are clear.
- **Checkpoint (`room_hce_hall`):** the noticeboard with the IT checklist pinned on it (`notes4`, so it reads as "left pinned to the checkpoint noticeboard"), a small HASHCHAIN plate, the guard's desk with his monitors, STAFF ONLY and a camera by the N door, a water cooler. The floor x 200-288 (the pick window) and x 80-150 under the guard's beat stay clear.
- **Irina's office (`room_hce_office`):** bookcases and a steel filing cabinet on the back wall, her elliptic-curve whiteboard, the framed bitcoin white paper, a clock; her desk facing the room with a banker's lamp, journals and books piled beside it; a reading corner (club chair, side table with the research notes); a printer table with the Architect's email; a coat stand.
- **Blockchain lab (`room_hce_lab`):** CHAIN ANALYSIS plate, the analysts' transaction-graph whiteboard and two screens; two GPU mining rigs and a node shelf down the east side with an air mover; two analyst desks (the workstation on the front one, Priya's two papers at either end of the back one, 50 px+ apart); a Pi-cluster bench, beanbags and pizza boxes west. Priya at (3,3) stands on clear floor.
- **Server room (`room_hce_servers`):** a back row of mixed racks under a cable tray, SERVER ROOM 1 plate, UPS; the long row of blue servers across the middle; an ops bench with the SAFETYNET drop and the rack sheet (its own slot now, 32 px+ from the station), the backend console desk (`as-type:pc` onto a black monitor, as m03), a KVM cart and a precision air-con unit.
- **Data centre (`room_hce_vault`):** the custody cage across the NW (mesh panels and a shut cage door on a hatched floor line) holding two HSM cabinets and the hardware-wallet cabinet, under CUSTODY VAULT / TWO-PERSON RULE; the custody console on its own steel desk in front of the cage door, with the cold-storage procedure 40 px+ along; the transaction server's terminal by a block of black racks; an EXECUTIVE SUITE plate over the east end, which explains why the executive wing is through here; gas suppression, tape library, UPS.
- **Executive wing (`room_hce_exec_hall`):** smoked oak with a navy and amber runner; the framed press clipping (`as-type:hce_press_clipping`) on the back wall, a console table with an orchid, a gold coin sculpture, prints, a PRIVATE plate by the N door, a leather bench at the west end of the south wall.
- **Satoshi's office (`room_hce_ceo`):** room_ceo's desk at the same spot (so the Signing Case keeps its pinned front-edge position, elevation 32), his chair behind it on an amber and black rug; two market screens either side of the framed white paper; the safe in the NE corner (pinned as before); a hardware wallet in a display case and a node shelf west; a black leather sofa and glass table SW; his side table with the manifesto (its own slot now, not on the floor) and a laptop; a gold coin pedestal and a mini fridge.

### Scenario edits (layout fields only, each replacement asserted unique on a fresh read)

- Nine room `type`s → `room_hce_*` (a comment line added to the Satoshi-office ERB comment).
- `as-type:pc` on the backend server terminal; `as-type:hce_press_clipping` on the press clipping (was pinned at (4,2)).
- Explicit positions removed from the IT checklist (was (2,2)), the rack sheet (was (3,7); its `_comment` updated) and the manifesto (was (2,6), on the floor).
- Unchanged: the Signing Case (3.6, 3.35, elevation 32) and the safe (8,2).

### Connections (m11)

No change needed. The executive wing through the data centre now reads as the secure core between the trading side and the executive suite: the EXECUTIVE SUITE plate sits over the data centre's east end, and the two server rooms look different (blue racks and an ops bench on cyan-lit raised floor in one; the custody cage, HSMs and black racks in the other). The door signs ("Executive" etc.) were not touched.

### Watchers: cone coverage (`build_evidence/dressing_c1/cone.py`)

The engine's sight check has no occlusion, so new furniture changes only where the player can stand. Cells are 8 px over walkable floor.

| Watcher, pose | Before (`hall_1x2gu`) | After | Window cells seen, before → after |
|---|---|---|---|
| Guard (4,4) facing E | 142 | 136 | 36/36 → 36/36 |
| Guard (4,4) facing S, first 4 s | 0 | 0 | 0 → 0 |
| Guard (3,4) facing E | 174 | 166 | 36/36 → 36/36 |
| Guard (3,4) facing W | 46 | 46 | 0 → 0 |
| Kemal (8,4) dwell facing E | 26 | 26 | 2/20 → 2/20 |
| Kemal walking E | 122 | 119 | 20/20 → 20/20 |
| Kemal (4,4) dwell facing W | 122 | 108 | 0 → 0 |

The pick window by the checkpoint's N door (36 cells) and the floor under the executive wing's N door (20 cells) stay fully walkable, and what each watcher sees of them at each pose is unchanged. Kemal's beat (x 112-272, y 92-160) is clear of furniture.

### Checks after cycle 1

- Validator (`--skip-ink --no-graph`): schema, geometry, door alignment pass.
- `check_door_alignment.py`: 8 of 8 OK. Room depth: 0 empty rooms, unchanged depths.
- `check_room_walls.py`: every `room_hce_*` map reads 64.
- `slot_audit.py --notes`: 0 problems (5 before). One notes prompt left: the press clipping as FIXED (see below).
- Routes: 27 of 27 pass (the dialogue stage is adding routes).
- In game (game 2322, all nine rooms): every map loads, no "No Tiled item found", no failed tileset. Sheet: `build_evidence/dressing_c1/after/sheet.png`.

### New assets

- PixelLab, two `create-1-direction-object` calls at a 64 px canvas (balance 1807 → 1797 after the first; about 20 generations in all). The first batch came back mostly three-quarter view; the second, phrased "straight-on flat front view", came back square to the walls. Installed (trim only): `hce_mining_rig1/2`, `hce_cage_panel1`, `hce_cage_door1`, `hce_console_table1`, `hce_bench1`, `hce_crypto_atm1`, `hce_node_shelf1`, `hce_wallet_cabinet1`, `hce_price_board1`, `hce_trading_station1`, `hce_comms_cabinet1`, `hce_kiosk1`, `hce_hsm1/2`, `hce_coin_sculpture1`, `hce_coin_pedestal1`, `hce_display_case1`, `hce_reception_desk1`. Registered with `register_object.py`. Not yet placed: the price board, the six-screen trading station, the comms cabinet.
- Hand-drawn (`make_hce_props.py`): `hce_logo_sign1`, `hce_logo_small1`, `hce_ticker1`, `hce_world_clocks1`, `hce_chart_screen1-3`, `hce_press_clipping1`, `hce_whiteboard_maths1`, `hce_whiteboard_graph1`, `hce_whitepaper_frame1`, `hce_custody_sign1`, `hce_exec_sign1`, `hce_staff_sign1`, `hce_server_sign1`, `hce_lab_sign1` (registered `--wall`).
- Sheets (`make_hce_tileset.py`): nine `room_hce_*` floors, preloaded in `game.js`; the nine maps registered in `game.js` and the schema.

### Left open after cycle 1

- **The press clipping disappears after it is read.** The engine removes any read `notes` object from the scene (`notes-minigame.js:707-709`, `removeNoteFromScene`, whatever `takeable` says), so the framed clipping vanishes from the wall once read. This was already true before (it lay on the floor). The fingerprint is on its glass, so dusting it after reading may be impossible. `readDisplay: "gameDisplay"` would keep it, but the clipping is a fingerprint surface and a puzzle clue, so I have not changed how it reads; for the orchestrator.
- The README room table needs the nine new rows (cycle 2).

### Assumptions (cycle 1)

- Assumption: mission-specific map types are the right fix, as in m03 and m04; the shared maps stay untouched.
- Assumption: the trading floor is the right first room for sign-off, being the setting's signature space.
- Assumption: removing the explicit floor positions from the checklist, rack sheet and manifesto is a layout change the dialogue doesn't depend on (no ink refers to their tiles).

## Cycle 2 (2026-10-13): review of cycle 1, and fixes

A fresh Opus reviewer (read-only) went through the cycle 1 rooms against the skill's critique list and the hard constraints. All seven hard constraints passed: Kemal's beat and slip-past window, the guard's pick window and beat, the Signing Case on the desk's front edge, the clipping on the wall, the key clues findable, no pick-one menus between slots, door lanes, and the m11 layout (no connection change). Its verdict: cycle 1 is a large improvement; the executive wing, Satoshi's office, the lab and Irina's office lagged.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| EX-1 | Exec wing | major | The clipping is a `notes` object, so the engine removes it from the wall after the first read (`notes-minigame.js:685-709`, `:235-258`), and it is the Signing Case's only print surface; the erb comment at its object assumes it stays | **For the orchestrator** (not a layout change): add `"readDisplay": "gameDisplay"` and browser-check read-then-dust. Logged below |
| CP-1 | Checkpoint | major | The water cooler drew over the noticeboard and the pinned IT checklist | **Fixed:** cooler to the NW corner (x 36), key cabinet above it |
| EX-2 | Exec wing | major | One print hidden behind the coin sculpture; two scenery prints, the barest room | **Fixed:** both prints gone; a brass plaque, a HASHCHAIN plate over the console table, a camera watching the corridor. The floor can't take more (Kemal's beat) |
| CEO-1 | Satoshi | major | Built from the lobby's and lab's props (pedestal, node shelf, chart screens) | **Fixed:** a hand-drawn block-height screen (`hce_block_screen1`) instead of the two chart screens; a drinks cabinet instead of the node shelf; a bar cart instead of the coin pedestal. The display case (his hardware wallet) and the white paper stay his |
| CEO-2 | Satoshi | major | Bare south half, no visitor chairs, a three-quarter dorm fridge | **Fixed:** two visitor chairs facing the desk either side of Satoshi (x 144-176 clear), a floor globe SE, a fig planter instead of the fridge |
| LAB-1 | Lab | major | Trading-floor desks and chairs again; a wooden bench in a steel lab; blank west wall | **Fixed:** the back desk is now a big shared analysis table with Priya's two papers 90 px apart and two office chairs; an IT workbench instead of the wooden bench; a world flow map (`threat_map1`) on the west wall |
| OFF-1 | Irina | major | Sparse centre and east; lone bin; no visitor chair; the white paper repeated Satoshi's | **Fixed:** a visitor chair facing her desk, binder shelves east, a shredder by the printer table, the bin by the desk; a hand-drawn framed doctorate (`hce_phd_frame1`) instead of the white paper |
| VLT-1 | Data centre | minor | Three three-quarter cabinets side by side in the cage | **Fixed:** the second HSM is a front-view rack |
| VLT-2 | Servers / DC | minor | Six sprite types shared between the two | **Fixed:** the server room's tape library and UPS are now the comms cabinet and a different UPS |
| VLT-3 | Data centre | minor | The core didn't look guarded; bare south | **Fixed:** a camera over the cage door, supply boxes by the tape library. (The suggested monitor stand is a hospital vitals stand; not used) |
| VLT-4 | Data centre | minor | Docstring claimed a clear row the racks stand in | **Fixed** (docstring) |
| TR-1 | Trading | minor | Five identical desks | **Fixed:** the east bank's back desk is the six-screen head-trader station (`hce_trading_station1`) |
| TR-2 | Trading | minor | Irina's tap frame came within 1 px of the workstation's top-left | **Fixed:** workstation moved along the desk (x_frac 0.36) |
| TR-3 | Trading | minor | Irina's dropped items land 8 px apart (engine) and make a menu among themselves | **Left:** engine behaviour, not layout |
| CP-2 | Checkpoint | minor | Camera over the STAFF ONLY plate | **Fixed:** both moved apart |
| CP-3 | Checkpoint | minor | Bare west wall | **Fixed:** key cabinet, fire action notice |
| SRV-1 | Servers | minor | Sign into the NE door corner | **Fixed:** sign to x 194 |
| LOB-1 | Lobby | minor | Bare west side | **Fixed:** a live price board (`hce_price_board1`) below the N-door lane; the display case moved east |
| LAB-2 | Lab | minor | Priya at (3,3) stands about 45 px inside the W door, in the walk-in line | **For the orchestrator / dialogue stage:** an NPC position change; check ink and route drivers for tile references first. Suggested (6,4) |
| CEO-3 | Satoshi | minor | Fridge repeated | **Fixed** with CEO-2 |

Counts: 0 blockers, 7 majors, 13 minors. Fixed 17; 3 left for the orchestrator (EX-1, LAB-2) or as engine behaviour (TR-3).

### Checks after cycle 2

- Validator: schema, geometry, door alignment pass. `check_door_alignment.py`: 8 of 8. Walls: every map 64. `slot_audit --notes`: 0 problems (the press-clipping prompt stays, EX-1). Routes: 27 of 27.
- Cones (`dressing_c1/cone.py`): guard 136 / 0 / 166 / 43 cells with the window 36/36 walkable and seen exactly as before; Kemal 26 / 119 / 108 with 2/20, 20/20, 0/20 window cells seen, unchanged.
- In game (game 2325): all nine rooms load, no "No Tiled item found"; the Signing Case sits on the desk's front edge between the visitor chairs. Shots `build_evidence/dressing_c2/` (`sheet.png`, grid maps in `grid/`). Before/after pairs for the user: `tmp/review/m06_dressing_c2_<room>.png`.
- The first-room render (`tmp/review/m06_dressing_first_room.png`) was refreshed to show the head-trader station.

### New assets (cycle 2)

Hand-drawn: `hce_block_screen1`, `hce_phd_frame1` (registered `--wall`). No PixelLab spend this cycle.

### Assumptions (cycle 2)

- Assumption: the press clipping's read mode and Priya's position are not mine to change (a clue's interaction and an NPC tile), so both go to the orchestrator with a recommendation.
- Assumption: `chair-exec-rotate5` (back view) reads as visitor chairs facing Satoshi's desk; the in-game shot agrees.

## Cycle 3 (2026-10-13): the coordinator's decisions, the gallery wall, the lobby

The coordinator approved two cycle-2 items and parked one:

- **EX-1:** `"readDisplay": "gameDisplay"` added to the press clipping (`executive_wing_plaque`), so it stays on the wall after it is read. To check in the interaction walk: read it, dust it for the print, then open the Signing Case.
- **LAB-2:** Priya (`blockchain_analyst`) moved from (3,3) to (6,4). Nothing refers to her tile: the ink, the erb mappings and the m06 route drivers name her only by id (`route.js:144,195-202`, `r4`). The lab was rearranged around her: the workstation desk to the west below the W-door row, the IT workbench under it, the air mover by the rigs, beanbags and pizza boxes SW; the floor x 168-216, y 90-172 is clear for her.
- **TR-3** (Irina's dropped items making a menu among themselves): engine issue, now in the backlog.

My own pass: the executive wing's west wall became a small gallery (a hand-drawn abstract canvas, `hce_art_canvas1`, and two brass sconces, `hce_sconce1`, either side of the clipping); the lobby got the sconces either side of the wordmark and a navy rug painted under the lounge.

Checks: validator, door alignment 8/8, walls all 64, slot audit 0 problems and 0 notes prompts (the clipping's prompt is gone), routes 27/27 (one run showed 12 failures while the dialogue agent was mid-compile; re-run clean). Kemal's cone unchanged. In game: game 2326, `build_evidence/dressing_c3/`.

### Review (fresh Opus reviewer, read-only)

All hard constraints pass, including Priya's new spot (her ~80 px tap frame holds no slot; nearest paper 75 px from her centre) and the clipping (wall object with `readDisplay`, reachable from below). Verdict: a real but modest improvement; Satoshi's office, Irina's office and the executive wing deserve one more cycle, the rest are at small returns.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| CEO-4 | Satoshi | major | The fig planter (x 256-288, feet 140) stood in front of the safe pinned at (8,2) and hid its dial; there since cycle 2 | **Fixed (c4):** planter moved SW (x 104, feet 254); the safe stands alone in its corner |
| OFF-2 | Irina | major | Still the sparsest room: open south-centre, nothing marks the desk area | **Fixed (c4):** a burgundy rug painted under the desk, two visitor chairs facing it, a book trolley (the room's one angled prop) and a steel journal rack by the reading corner |
| OFF-3 | Irina | minor | Journal stack caught behind the binder shelves | **Fixed (c4):** moved beside the book trolley |
| EXW-3 | Exec wing | minor | The gold coin on a plinth repeated the lobby's | **Fixed (c4):** a trophy cabinet of industry awards at the same feet (86), clear of Kemal's beat |
| EXW-4 | Exec wing | minor | No side-wall fixture | **Fixed (c4):** fire alarm point on the west wall below the W-door row |
| TR-4 | Trading | minor | Pizza boxes in the east lane at the S door's mouth (no collision), repeating the lab's | **Fixed (c4):** removed |
| LAB-3 | Lab | minor | The workstation desk still had the trading floor's chairs | **Fixed (c4):** the lab's own office chairs (`_trading_desk` takes a `chair` now) |
| VLT-5 | Servers / DC | minor | The two rooms' console desks were the same setup | **Fixed (c4):** the data centre's transaction-server terminal is a standing station, no chair |
| LOB-2 | Lobby | minor | The right sconce was squeezed against the BTC screen | **Fixed (c4):** the wordmark group moved 6 px west |
| LOB-3 | Lobby | minor (optional) | No queue stanchions | **Left:** the only free spot overlaps the coin pedestal; the lobby is at small returns |

Counts: 0 blockers, 2 majors, 8 minors. Fixed 9, 1 left (optional).

## Cycle 4 (2026-10-13): fixes from the cycle 3 review

All of the above. Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; walls all 64; slot audit 0 problems, 0 notes prompts; routes 29/29 (the dialogue stage added two); Kemal's cone 26 / 117 / 108 cells with 2/20, 20/20, 0/20 window cells seen (unchanged; 117 from the trophy cabinet's slightly wider base); the guard's map is unchanged since cycle 2. In game: game 2327, no "No Tiled item found". Shots `build_evidence/dressing_c4/` (`sheet.png`, `grid/`). Pairs for the user: `tmp/review/m06_dressing_c4_<room>.png` (cycle 2 against cycle 4) and `tmp/review/m06_dressing_c4_sheet.png`.

New art (cycles 3-4): hand-drawn `hce_sconce1`, `hce_art_canvas1`. No PixelLab spend.

### Assumptions (cycles 3-4)

- Assumption: the route drivers and ink are the places a tile reference to Priya would live; the old playtest session logs in `tools/playtest/` mention her by id only and are historical.
- Assumption: the trophy cabinet (also used in m03's Zero Day offices) is fine to reuse in another mission's building.

## Cycle 5 (2026-10-13, in progress): confirmation review and interaction walk

Fresh Opus review of the cycle 4 rooms: 0 blockers, 1 major, 6 minors (5 optional or housekeeping, plus 1 note). All hard constraints pass: Kemal 26/117/108 cells, window 2/20, 20/20, 0/20; guard 36/36 walkable, poses unchanged; Signing Case on the desk edge; the safe unobscured; the clipping on the wall with `readDisplay`; clues readable; every slot 50 px or more from the next; lanes and covered rows clear. Verdict: dressing can close once LAB-4 is fixed; every room is at small returns.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| LAB-4 | Lab | major | The four `aes_office_chair1` (three-quarter, seat to camera) faced away from their desks, and made four angled props in one room (came in with c4's LAB-3) | **Fixed:** back-view `chair-darkgray-1`, used nowhere else in m06 |
| VLT-6 | Servers / DC | minor | Five rack/desk sprites still shared | **Left** (optional): the rooms read apart; the alternatives have baked backgrounds |
| CEO-5 | Satoshi / lobby | minor | Coffee table and fig repeat the lobby's | **Left** (optional) |
| CH-1 | Several | minor | `chair-grey-4` in four rooms | **Left** (optional) |
| VLT-7 | Data centre | minor | Docstring promised a CRAC unit that isn't there | **Fixed** (docstring) |
| DOC-1 | CEO, exec wing | minor | Docstrings described the cycle-1 rooms | **Fixed** |
| EXW-5 | Exec wing | note | Lower corridor bare, forced by Kemal's beat | None |

The lab, executive wing, Satoshi's office and data centre maps were regenerated after the fixes.

### Interaction walk (Sonnet, game 2328, every room unlocked server-side; session stopped, :3001 left as found)

All six checklist items pass. Every room loads its new map, with no duplicate sprites and no "No Tiled item found", before and after a page reload. Every scenario object opens directly, with no pick-one menu. Each door-to-door walk crosses. The guard and Kemal were talked past, with no debug KO.

**EX-1 confirmed in game:**
1. The clipping is read, and stays on the wall.
2. It is dusted (88% lift, Satoshi's card matched), and still stays.
3. The lifted print opens the Signing Case, which holds the Release Signing Record.

The Signing Case draws above the desk on its front-left edge, and nothing hides the safe.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| F1 | Satoshi | minor | The CEO chair and a guest chair can be pushed. Walking to the safe corner shoved one below the safe, which stayed reachable. | **Left:** this is the swivel-chair behaviour, the same as room_ceo before |
| F2 | Exec wing | minor | The harness's `moveToNear` stops short of Kemal; `interact` then walks up and works | **Left:** harness only |
| F3 | Trading | minor | Tapping the trader raised a menu in the harness. He stood 26 px from the head-trader station. | **Fixed:** station moved 8 px east (x 194-254). The S-door lane is still clear. |
| F4 | Trading, exec wing | minor | Console notice "Tables object layer not found or empty" | **Left:** harmless. Both maps have no table-layer furniture by design. |
| F5 | Lab | minor | A thin grey bar across the floor | **Left:** this is the floor trunking painted into `room_hce_lab` (y 150-156), which is intended |
| F6 | Engine | minor | 404s: `female_hacker_hood_v2_talk.png` and the fingerprint minigame's surface images | **For the orchestrator:** not dressing assets |
| F7 | Engine | minor | Resume after a reload returns the player to the lobby start | **For the orchestrator:** engine behaviour |

### Checks after cycle 5

- Validator: schema, geometry and door alignment pass.
- `check_door_alignment`: 8/8.
- Walls: all 64.
- Slot audit: 0 problems.
- Routes: 29/29.
- In game, game 2332: the lab, with its back-view chairs facing the desks, and the trading floor, with the moved station. No "No Tiled item found". Shots are in `build_evidence/dressing_c5/` and `tmp/review/m06_dressing_c5_*.png`.

### Phase art: room dressing CLOSED (2026-10-13)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| 1 (survey, first room, all nine rooms built) | 1 | 6 | 2 |
| 2 (review of cycle 1) | 0 | 7 | 13 |
| 3 (review; Priya moved, clipping read in place) | 0 | 2 | 8 |
| 4 | fixes for cycle 3 | | |
| 5 (review and interaction walk, game 2328) | 0 | 1 | 6 review + 7 walk |

Cycle 5's one major (LAB-4, the lab chairs) is fixed and confirmed in game 2332. Nothing above minor remains. The leftover minors are optional sprite repeats and engine or harness items, all listed above. The first-room look is still waiting for the user's sign-off (D8 in `DECISIONS_PENDING.md`).

Next: lighting (`mission-room-lighting`), then the POV backgrounds. Lighting should note three things:
- the ticker and market wall;
- the cyan server room;
- the custody cage.

## User review 2026-10-16 (pending-decisions form 2.3): trading floor approved; chairs rotate and collide

The trading floor's chairs (chair-grey-4) now use the rotating chair behaviour: 8 PixelLab rotation frames (40 px, original sprite as the south frame) and an entry in `STATIC_SWIVEL_PROPS`. The same sprite rolls in the office, server room and vault too. In game (game 2553): pushed from the east, a chair rolled about 170 px, shunting its neighbours along, and spun through all 8 frames. The office's book trolley lost its static box (`r.solid` → item) so it can roll as well.

Engine and asset changes shared with the other missions (they need the user's approval before commit, see the report):
- `rooms.js` `STATIC_SWIVEL_PROPS`: instrument_trolley1, aes_tool_trolley1, book_trolley1, chair-grey-4, chair-darkgray-1 and chair-grey-1 now roll, spin through 8 frames and collide, like the hospital trolleys and beds. Frames are PixelLab 8-rotation output at the prop's own size on a padded canvas (40 px chairs, 32/48/56 px trolleys), reordered to the engine's S, SW, W ... order, with the original sprite kept as its own frame. Preloaded in `game.js`. A swivel prop placed as a table (m08's server-room tool trolley holds a printout) stays put.
- `object-physics.js`: pushed chairs and trolleys now collide with the map's furniture collision boxes (Object Layer 1). They were player-only, so a trolley rolled straight over the lab bench.
- `game.js` tap gather: a swivel prop joins the pick-one menu only when the tap is on its own sprite. Without this, tapping the PC on the desk in front of a chair raised a chair menu (checked in game: m04's BMS terminal opens directly).
- Builders: trolleys that were `r.solid` (a static box under them that pinned them) are now plain items: m05 lab and Torres' office, m04 workshop, m06 office.

Checks: slot_audit 0 problems; check_room_walls all 64; validator no errors; doors OK. Evidence: `build_evidence/user_review_2026-10-16/`.
