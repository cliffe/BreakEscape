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
