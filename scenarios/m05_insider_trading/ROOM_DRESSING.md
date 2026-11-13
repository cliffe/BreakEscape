# m05 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/M05_PASS_BRIEF.md`, stage 4. Up to ten design → implement → review cycles, about five while each still improves the rooms. Evidence lives in `build_evidence/dressing_c<N>/`; in-game shots come from `tools/playtest/lighting-tour.sh` on the keyless :3001 server (every room unlocked, HUD hidden), in fresh games of my own. m04's and m06's dressing logs are the worked examples.

The aim: Quantum Dynamics Corporation, a quantum-cryptography research firm, during a day of the insider hunt. Each room should read as what it is and as different from the others. The user's standing notes from m04: photo-based sprites over new PixelLab ones where both exist; rooms packed and lived-in, not open floor; each cycle more detailed.

## Cycle 1 (2026-10-13): survey, the first room, and all ten rooms built

### Survey: what was there

The erb's ten rooms (authoritative):

| Room | Map type before | Size | Shared with |
|---|---|---|---|
| reception_lobby | `room_reception` | 10×10 | 26 scenarios |
| main_corridor | `hall_1x2gu` | 10×6 | several |
| break_room | `room_break` | 10×10 | several |
| open_office_area | `room_it` | 10×10 | several |
| server_hallway | `hall_1x2gu` (same map as the corridor) | 10×6 | |
| server_room | `room_servers` | 10×10 | 19 |
| torres_office | `room_ceo` | 10×10 | 15 |
| research_lab | `room_lab` | 10×10 | several |
| patricia_office | `room_office` | 10×10 | 51 |
| data_center | `room_servers` (same map as the server room) | 10×10 | |

Before shots, in game: `build_evidence/dressing_c1/before/<room>-a.png` (game 2360).

### Critique (ranked)

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map is shared with other scenarios, and two pairs of m05 rooms share one map (corridor and server hallway; server room and key vault). Nothing could be redressed without changing other missions. |
| A2 | All | major | Nothing says quantum research or security-cleared firm: purple carpet everywhere, landscape prints, chalkboards on easels, retro orange chairs, suitcases and backpacks strewn on the floors. |
| A3 | All | major | 5 objects had no slot and landed at random (`slot_audit`): the corridor flyer, the IT notice, the Bludit terminal, the Mug, the upload terminal. Five were pinned to floor tiles by explicit positions (the same five, the Mug at elevation 32). |
| N3 | Key vault | major | Browser check N3: entering from the server room left the player behind a desk 36 px from Torres. The vault was the server room's map: a desk in the SE corner, by the S door, and the upload terminal pinned on the floor at (6,7). |
| L1 | Lab | major | A generic office (desks, a chalkboard on an easel, floor lamps); no lab kit; the Lab Rules notice landed on a desk; no visitor-badge hook (m12). |
| T1 | Torres | major | The CEO office of other missions (room_ceo): nothing personal to a cryptography lead whose son drew on his mug. |
| P1 | Patricia | major | A shared purple office with two desk blocks; nothing says security; her locked filing cabinet was a small safe. |
| R1 | Lobby | minor | A purple waiting room with floor plants and retro chairs; no reception or security desk to speak of. |

Counts: 1 blocker, 6 majors, 1 minor.

### Plan

1. Give m05 its own building: ten `room_qdc_*` map types (Quantum Dynamics Corporation), built by new builders in `scripts/generate_rooms.py`, so the shared maps stay as they are. Same sizes as before, so room positions, door corners and NPC tiles don't move.
2. Sheets (`scripts/room_gen/make_qdc_tileset.py`, new; imports the m04/m06 helpers and leaves their sheets alone). One brand colour, a quantum-violet line on every wall. Walls: lilac-grey front of house (lobby, corridor, open-plan, Patricia, Torres), clean-room white in the lab, sage in the break room, graphite in the server hallway and server room, darker graphite with a red line in the key vault. Floors: pale stone with a violet Bloch-sphere inlay (lobby), slate carpet (corridor), grey vinyl with trunking (server hallway), wood-effect vinyl with a kitchen strip (break room), blue-grey carpet with a walkway (open-plan), plum carpet (Patricia), oak with a blue rug (Torres), white anti-static tiles with hatched keep-clear boxes (lab), raised floor (server room), dark raised floor with a red hatched two-person line (vault).
3. Art: the photo-based house set for furniture where it exists; hand-drawn signs, notices, boards and screens (`scripts/room_gen/make_qdc_props.py`, new); PixelLab only for what doesn't exist (cryostat, laser bench, glovebox, fume hood, dewar, key safes, kitchen kit).
4. Every scenario object onto a real fixture; every explicit floor position removed.
5. The lab first, as the setting's signature room, for the user's sign-off; then the other nine in the same style.

### First room: Halloran's Heisenberg lab (for sign-off)

`room_qdc_lab`. Back wall: HEISENBERG LAB plate over the cryostat prototype (gold tiers on a black stand) in a yellow-and-black hatched keep-clear box, its control rack under a red LASER warning, a helium dewar beside it, a fume hood, the lattice whiteboard (LWE, N=1024) and the laminated LAB RULES notice at the door end of the wall, with clear floor under both. West: the laser bench (QKD optics, the room's angled prop) on its own hatched box; a trolley of optics. East: a glovebox, clear of Halloran, and on the east wall by the door the visitor-badge hook with an empty red lanyard (decor only; m12). South: the long lab bench (a workstation, gloves boxes, a test-tube rack, a monitor with the Zürich lanyard over its corner), stools tucked in facing it, and Halloran's own small desk with a laptop and a mug. Halloran at (6,6) stands on clear floor in the column the door row opens onto.

- Slots: the Lab Rules on the hand-drawn `qdc_lab_rules1` (`as-type`), the lanyard on `notes1` on the bench, 100 px+ apart.
- Shot: `tmp/review/m05_dressing_first_room.png` (also `build_evidence/dressing_c1/lab/`, game 2368). Logged as pending in `DECISIONS_PENDING.md` (D15).

### The other nine rooms

- **Lobby (`room_qdc_lobby`):** the QUANTUM DYNAMICS wordmark over a black security reception counter (the staff directory, a monitor, a phone, a plant on it), a sign-in kiosk and queue stanchions west of it, a camera, the 999-readiness poster and the dispatch-rollout screen on the back wall; the violet Bloch-sphere inlay at the spawn; the Heisenberg chip in a display case east; a waiting area on a violet rug SE (sofa, glass table, club chair); a water cooler, waiting chairs and a fig west and south-west. The N-door lane (x 32-72) and the E-door row are clear.
- **Main corridor (`room_qdc_hall`):** QDC plate, a water cooler, the staff noticeboard with Lisa's collection flyer pinned on it (its own slot now, not a floor position), a fire action notice, a drinks machine, the team poster, a bin. The S-door walk-in (x 30-72) and the row y 92-128 are open wall to wall.
- **Server hallway (`room_qdc_server_hall`):** graphite walls, grey vinyl with trunking; a cable tray over a network rack, the UPS and boxed kit; RESTRICTED and a camera by the server-room door, and IT's notice taped on the wall beside it (its own slot, not a floor position). The W-door mouth is clear.
- **Break room (`room_qdc_break`):** sage walls and wood-effect vinyl; a kitchenette (sink, microwave, cupboards), an under-counter fridge with the collection tin and a kettle on it (the tin the flyer mentions), the staff noticeboard over the gap where Lisa stands, the espresso machine with the TalentStack leaflet on the floor behind it, a clock; a fridge-freezer on the west wall; two cafe tables with a chair either side; a snack machine and recycling bins east; a sofa, coffee table, foosball table and magazine rack along the south.
- **Open-plan office (`room_qdc_open`):** a lighter walkway from the S door to the N door; Owen's network whiteboard, his IT workbench under the IT SUPPORT plate, a comms cabinet and the 999 rollout screen on the back wall; cables by the bench; two banks of steel desks with monitors, chairs tucked in. Owen at (6,4) stands on clear floor reached from the door row and the walkway.
- **Torres' office (`room_qdc_torres`):** oak with a worn blue rug; two bookcases, Miguel's crayon drawing pinned up, a certificate, a clock, a filing cabinet, a window; his desk on the rug (the Mug on its front-right corner, a lamp, a monitor, a family photo), his chair behind, two visitor chairs; the briefcase on the floor at the desk's left end (as-type onto a briefcase sprite); a sideboard with a water jug, a coat stand, a reading chair, journals, a bin, a fig.
- **Patricia's office (`room_qdc_security`):** plum carpet; her suspects board (eight badge photos, two strung to a note) in the NW, SECURITY plate, the vetting binders, a steel filing cabinet and the locked one behind her desk (as-type onto `filing_cabinet_locked1`, so it reads as a filing cabinet, not a small safe), a key cabinet; her desk with the incident log, a monitor and a phone, her chair, two visitor chairs; the CCTV desk SE; a shredder, a safe, a coat stand, a fig, a cabinet.
- **Server room (`room_qdc_servers`):** graphite walls, raised floor; a back row of racks under a cable tray, SERVER ROOM plate, UPS; a long row of servers across the middle; the research-network terminal on its own desk (the Bludit vm-launcher, its own slot now) and the SAFETYNET drop on a steel bench, 80 px apart; a precision air-con unit; suppression panel. The east lane x 256-288 runs clear door to door.
- **Key vault (`room_qdc_vault`):** darker graphite with a red line; KEY VAULT / HEISENBERG LEADS ONLY over a wall of key safes and the secure key cabinet behind a red hatched two-person line; a camera; racks and a tape library east; the upload terminal on a steel desk mid-room, Torres standing at its front (his (5,7) unchanged), the sealed envelope at the desk's far end; a second bench west with the schedule and the manifest; gas suppression cylinders. **N3:** nothing stands in x 200-288 below y 120, so a player coming in at the SE door walks straight to Torres.

### Scenario edits (layout fields only; each replacement asserted unique on a fresh read; pre-edit copy kept in the session scratchpad)

- Ten room `type`s → `room_qdc_*`.
- Lab Rules: `"position": "as-type:qdc_lab_rules"`, `"readDisplay": "gameDisplay"` (it stays on the wall after a read; the engine removes a read `notes` object otherwise, as m06 found with the press clipping), observations "taped to the wall by the lab door".
- Torres' briefcase: `"position": "as-type:briefcase"`. Patricia's cabinet: `"position": "as-type:filing_cabinet_locked"` (m03's pattern).
- Explicit positions removed: the flyer (was (7,4)), the IT notice (was (3,2.3)), the Bludit terminal (was (2,7)), the Mug (was (5.6,4.1) at elevation 32; now the first `office-misc-cup` in the desk's table items), the upload terminal (was (6,7)). The flyer's, IT notice's and Mug's comments updated.
- Unchanged: every NPC position.

### Checks after cycle 1

- Validator (`--skip-ink --no-graph`): 0 errors; schema, geometry and door alignment pass (the warnings are the pre-existing eventMapping ones).
- `check_door_alignment.py`: 9 of 9 OK. Walls: every `room_qdc_*` map reads 64.
- `slot_audit.py --notes`: 0 problems (5 before), 0 notes prompts.
- Routes: 28 of 28 pass (before and after).
- In game (game 2369, all ten rooms): every map loads, no "No Tiled item found", no failed request in the session log. Sheet: `build_evidence/dressing_c1/after/sheet.png`; grid previews `build_evidence/dressing_c1/grid/`.

### New assets (cycle 1)

- PixelLab, one `create-1-direction-object` call at a 64 px canvas, "straight-on flat front view" phrasings (balance 1787 → 1777). 13 of 16 frames installed, trim only: `qdc_cryostat1`, `qdc_dewar1`, `qdc_key_lockers1`, `qdc_key_cabinet1`, `qdc_fume_hood1`, `qdc_glovebox1`, `qdc_optical_bench1`, `qdc_kitchenette1`, `qdc_espresso1`, `qdc_fridge1`, `qdc_recycling_bins1`, `qdc_instrument_rack1`, `qdc_rack_black1`. Several came back slightly three-quarter; the optical bench and instrument rack are the lab's two angled props.
- Hand-drawn (`make_qdc_props.py`): `qdc_logo_sign1`, `qdc_logo_small1`, `qdc_lab_sign1`, `qdc_server_sign1`, `qdc_vault_sign1`, `qdc_security_sign1`, `qdc_it_sign1`, `qdc_lab_rules1`, `qdc_badge_hook1`, `qdc_laser_warning1`, `qdc_whiteboard_lattice1`, `qdc_whiteboard_net1`, `qdc_suspects_board1`, `qdc_dispatch_screen1`, `qdc_kid_drawing1`, `qdc_collection_tin1`, `qdc_poster_secure1`, `qdc_poster_ready1`, `qdc_poster_team1`.
- All registered with `register_object.py` (catalog, tileset, `game.js` preload, wall list). Ten sheets and ten maps registered in `game.js` and the schema.

### Assumptions (cycle 1)

- Assumption: mission-specific map types are the right fix, as in m03, m04 and m06; the shared maps stay untouched.
- Assumption: the lab is the right first room for sign-off, being the setting's signature space.
- Assumption: adding `readDisplay` to the Lab Rules is a layout-and-object change in my remit (the m06 coordinator approved the same for the press clipping); nothing reads it through `onRead`.
- Assumption: removing the five explicit floor positions is safe: no ink or route refers to object tiles (routes 28/28).

## Cycle 2 (2026-10-13): review of cycle 1, square-to-the-walls, and fixes

A fresh Opus reviewer (read-only) went through the ten rooms against the skill's critique list and the hard constraints. All seven hard constraints passed: interactables 32 px+ apart (vault schedule/manifest 37 px, terminal/envelope 50 px, Mug/briefcase 90 px), Lab Rules readable with clear floor under it and the badge hook decor only, the vault's walk-in to Torres open (N3), every clue findable, "Heisenberg Leads Only" on the vault sign, door lanes clear, wall items within the wall face. Its verdict: no blockers; Patricia's office, the open office, the vault and Torres' office need another cycle.

At the same time the coordinator passed on the user's rule, now in the skill (section 2, "Square to the walls, not isometric"): kitchen cabinets, counters, desks, shelving and racks must face straight on; one or two angled items a room at most. Checked every sprite in the ten rooms (contact sheet in the scratchpad): the first PixelLab batch had come back three-quarter for the kitchenette, espresso cabinet, fridge, fume hood, instrument rack, key safes, key cabinet, black rack, recycling bins, glovebox and laser bench; the house set's `network_rack1`, `aes_security_desk1`, `checkin_kiosk1` and `safe1` were three-quarter too.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| SQ | All | major | Wall-lining kit three-quarter (coordinator, user rule) | **Fixed:** second PixelLab batch with "straight-on flat front view, square to the wall, no side visible" and front-view references (vending machine, server rack, water cooler); all 16 frames came back front-on. Re-installed over the same names (sizes re-synced in the catalog, tileset and `tilesets_ref.json`): kitchenette, fridge, espresso, fume hood, instrument rack, key safes, key cabinet, recycling bins (now paper, glass, general), glovebox, laser bench, black rack; new: `qdc_cctv_desk1`, `qdc_eyewash1`, `qdc_lab_desk1`, `qdc_kitchenette2` (spare). `network_rack1` → `server_rack1`; `aes_security_desk1` → `qdc_cctv_desk1`; the kiosk and `safe1` gone. Angled props left: the lab's optical trolley, Torres' book trolley, the tool trolleys (one a room) |
| F1 | Patricia | major | West half bare carpet; a loose cabinet floating at (80,300) | **Fixed:** a meeting table SW with four plain chairs facing it, the wooden cabinet against the west wall, the coat stand by it |
| F2 | Patricia / Torres | major | Same desk, chair, visitor chairs, coat stand, plant in both | **Fixed:** Torres now has a mahogany desk with its own chair and lamp, a book trolley, a pink reading armchair; Patricia keeps the steel-and-wood desk with plain teal visitor chairs, the CCTV desk and a tall plant |
| F3 | Patricia | major | A decoy `safe1` near the real locked cabinet | **Fixed:** removed; the cabinet is the room's one lock |
| F4 | Open office | major | Bare east third; promised photocopier and filing cabinet missing | **Fixed in part:** photocopier, filing cabinet and bin SW; bank A moved down. **Withdrawn in part:** the walkway x 226-288 is the route between the S and N doors (both at x 256-288), so nothing stands in it; plants on its edge were tried and dropped (desk-plant sprites) |
| F5 | Vault | major | South and east bare | **Fixed:** an HSM rack against the east wall and a tape cart, feet ≤ 190, so the walk-in along y 200-256 stays open; TWO-PERSON RULE plate over the racks |
| F6 | Break room | major | Recycling bins included a biohazard wheelie bin | **Fixed** (regenerated: paper, glass, general) |
| F7 | Lobby, lab | minor | "SAFE" poster reads as a safe label | **Fixed:** redrawn as LOCK (a monitor with a padlock: lock your screen) |
| F8 | Lobby | minor | Retro orange chairs back; no waiting row | **Fixed:** a row of three waiting seats, a periodicals rack, a black leather sofa in the waiting area. The brochure rack wasn't added (no free wall below the E door) |
| F9 | Torres | minor | South half open; swivel "reading chair"; nothing says cryptography lead | **Fixed:** pink armchair with journals; his key-rotation whiteboard (`qdc_whiteboard_keys1`, hand-drawn: dates crossed off, two ringed) |
| F10 | Torres | minor | Mug on the desk's front lip | **Fixed:** on the mahogany desk's top (frac 0.66 of a taller sprite whose top half is the chair; the builder's "on legs" hint is a false alarm here, checked in game) |
| F11 | Server hallway | minor | IT notice drawn as a loose paper; extinguisher over it | **Fixed:** its own hand-drawn sprite `qdc_it_notice1` (`as-type`), extinguisher moved off it |
| F12 | Server hallway | minor | Sparse | **Fixed in part:** a tool trolley by the W door. No badge reader (no wall free beside the N door) |
| F13 | Break room | minor | Office desks with swivel chairs as cafe tables; leaflet in open floor | **Fixed:** plain chairs, two a side; the leaflet at the espresso machine's foot |
| F14 | All | minor | Sprites repeated between neighbours | **Fixed in part:** open office gets a year planner (key-rotation windows) instead of the 999 screen and a sanitiser instead of the poster; break room gets a wall TV, beanbags and a tall plant (not the noticeboard, coffee table or fig); lobby a black sofa and no water cooler. The water cooler (corridor) and `notice_board1` (corridor only now) stay |
| F15 | Lab | minor | Floor trunking under the bench made the book pile float | **Fixed:** trunking removed from `room_qdc_lab` |
| F16 | Open office | minor | Owen pressed against bank A | **Fixed:** bank A at feet 178, chairs 190 |

Counts: 0 blockers, 7 majors (plus the square-to-the-walls major), 9 minors. Fixed 14 in full, 3 in part with reasons.

Not changed: the IT notice stays takeable with no `readDisplay` (`slot_audit` prompts FIXED); it was takeable before, a taped notice can come off the wall, and its `onRead` sets `it_notice_read`, which a read mode change could affect. For the orchestrator if wanted.

### Checks after cycle 2

- Validator: schema, geometry, door alignment pass, 0 errors. `check_door_alignment.py`: 9/9. Walls: all 64. `slot_audit --notes`: 0 problems (2 prompts on the IT notice, left as above). Routes: 36/36 (the dialogue stage added eight). `game.js`: `node --check` passes; every `qdc_*` sprite has a preload.
- In game (game 2370, all ten rooms): no "No Tiled item found", no failed request. Shots `build_evidence/dressing_c2/` (`sheet.png`). Before/after pairs: `tmp/review/m05_dressing_c2_<room>.png` (before on the left), `tmp/review/m05_dressing_c2_sheet.png`. The first-room render was refreshed with the front-on kit.

### New assets (cycle 2)

- PixelLab: one call, 64 px canvas (balance 1777 → 1767), 15 of 16 frames installed.
- Hand-drawn: `qdc_it_notice1`, `qdc_whiteboard_keys1`, `qdc_two_person_sign1`; `qdc_poster_secure1` redrawn.

### Assumptions (cycle 2)

- Assumption: re-installing the front-on frames over the same sprite names (and re-syncing their sizes) is cleaner than new names, since nothing outside m05 uses them.
- Assumption: the open office's walkway is a real route (S and N doors share x 256-288), so it stays empty despite the reviewer's call for more there.

## Cycle 3 (2026-10-13): review of cycle 2

A fresh Opus reviewer (read-only) checked the cycle 2 rooms sprite by sprite for the square-to-the-walls rule, confirmed the cycle 2 findings, and re-ran the hard constraints. All hard constraints pass except one spacing measured by the engine's own rule (Q11). Verdict: the lab, corridor and break room are done; the rest want one more cycle, mostly sprite swaps.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| Q1 | Open office, Torres, Patricia | major | `filing_cabinet_steel1` is three-quarter, in three rooms | **Fixed (c4):** hand-drawn front-on `qdc_filing_steel1` in the open office and Patricia's office; Torres gets the wooden front-on `filing_cabinet` |
| Q2 | Patricia | major | The locked cabinet (`filing_cabinet_locked1`) three-quarter beside the steel one | **Fixed (c4):** hand-drawn front-on `filing_cabinet_locked2` (lock bar and padlock); `as-type:filing_cabinet_locked` still claims it, no scenario edit |
| Q3 | Server hallway, server room | major | `aes_ups1` three-quarter | **Fixed (c4):** `ups_cabinet1` (front-on) in both |
| Q4 | Lobby | major | `periodicals_rack1` three-quarter shelving; cycle 2's reason for skipping the brochure rack was weak | **Fixed (c4):** `brochure_rack1` (front-on) in the SW corner |
| Q5 | Lobby | minor | Fig over the waiting row; the seats faced a plant and a shelf | **Fixed (c4):** seat row x 72, fig beside it against the west wall, rack in the corner |
| Q6 | Lobby | minor | Stanchions rope off nothing | **Fixed in part (c4):** removed. A speed gate wasn't added: the only free spot (x 76) overlaps the counter's west end, and the N-door lane must stay clear |
| Q7 | Lab | minor | Eyewash in the E-door mouth, under the Lab Rules | **Fixed (c4):** eyewash to feet 150, glovebox to feet 214, Halloran's desk to x 180-230 below where she stands, book pile beside it |
| Q8 | Lab | minor | Test-tube rack on the floor | **Fixed (c4):** on the instrument bench |
| Q9 | Lab | minor | Stools on the bench's north side | **Left:** the bench is on the last usable row; stools tucked in on the north side read as tucked in |
| Q10 | Open office | minor | Comms cabinet hung below the skirting | **Fixed (c4):** on the wall face (feet 56) |
| Q11 | Vault | minor | Manifest's top-left 29 px from the schedule's centre (engine rule) | **Fixed (c4):** manifest at frac 0.80, 37 px |
| Q12 | Vault | minor | "HSM rack" a plain server rack, the "tape cart" the hallway's trolley | **Fixed (c4):** two hand-drawn front-on HSM racks (`qdc_hsm1`: four modules with keypads, displays and status lights) against the east wall, feet 186; the vault access log on a clipboard on the east wall instead of the cart |
| Q13 | Patricia | minor | Bare meeting table, a plant floating mid-floor | **Fixed (c4):** binders, cups and a laptop on the table; the tall plant against the west wall; the coat stand moved by the door clear of it |
| Q14 | All | minor | Repeated desks and chairs | **Left:** `zds_desk1` is the house steel desk, and each room's set differs around it; the break room keeps its two small tables |
| Q15 | Open office | minor | No plants or personal clutter; copier slightly three-quarter | **Fixed in part (c4):** a desk plant, a photo and a pot plant on the desks. The copier stays (barely angled, the room's one) |

Counts: 0 blockers, 4 majors, 11 minors. Fixed 11, in part 2, left 2 with reasons.

Cycle 2 closures confirmed by the reviewer: F1, F2 (leftovers became Q1, Q13), F3, F5, F6, F7, F9, F10, F11, F13, F15, F16 closed; F4's and F12's reasons hold; F8's reason was weak (now Q4, fixed); SQ was not fully closed (now Q1-Q4, fixed).

## Cycle 4 (2026-10-13): fixes for cycle 3

All of the above. New art, hand-drawn (`make_qdc_props.py`), registered with `register_object.py`: `qdc_filing_steel1`, `filing_cabinet_locked2`, `qdc_hsm1`. No PixelLab spend.

### Checks after cycle 4

- Validator: 0 errors; door alignment and geometry pass. `check_door_alignment.py`: 9/9. Walls: all 64. `slot_audit --notes`: 0 problems (the two IT-notice prompts, left as in cycle 2). Routes: 36/36. Every `qdc_*` sprite and `filing_cabinet_locked2` has a preload in `game.js`.
- In game (game 2371, all ten rooms): no "No Tiled item found", no failed request. Shots `build_evidence/dressing_c4/` (`sheet.png`). Pairs: `tmp/review/m05_dressing_c4_<room>.png` (cycle 2 left, cycle 4 right).

## Cycle 5 (2026-10-13): confirmation review and interaction walk

### Review (fresh Opus reviewer, read-only)

All hard constraints pass, measured with the engine's tap rule (`gatherInteractablesNearClick`): tapping the centre of any scenario object gathers only that object in every room (vault terminal/envelope 57 px, schedule/manifest 37 px; Mug/briefcase 74 px; Bludit/drop 89 px; log/cabinet 121 px). The Lab Rules sit on the wall with clear floor under them and the badge hook is decor only; the vault walk-in from the S door to Torres is open (the HSM racks' collision ends at feet 186, the row y 190-256 is clear); every clue is reachable; door lanes clear; NPCs on clear floor; wall items within the wall face. Square to the walls: all 78 furniture sprites checked; every wall-lining piece is front-on, and the angled pieces are within one or two a room. Cycle 3's Q1-Q15 are closed or their reasons hold (Q13's fix introduced R1). Verdict: every room done; **room dressing can close, nothing above minor**.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| R1 | Patricia | minor | The tall plant's pot overlapped the NW meeting chair (side effect of Q13) | **Fixed:** meeting set 16 px east (table x 60, chairs x 72 and 110) |
| R2 | Patricia | minor | Bare carpet x 128-216, y 210-300 | **Fixed:** a credenza against the south wall |
| R3 | Server hallway | minor | Tool trolley reached 7 px into the W-door clear zone | **Fixed:** to x 104, under the rack |
| R4 | Patricia / break room | minor | Same teal chairs in both | **Fixed:** Patricia's visitor chairs are `chair-grey-1` (back view, facing the desk); the meeting table keeps the teal ones |
| R5 | Torres | minor | Visitor chairs are the open-office task chairs | **Left:** acceptable (the reviewer's view too); no better back-view chair in the catalog |
| R6 | Patricia | minor | Pale exhibition-table top for the meeting table | **Left:** nothing better in the catalog; it now has binders, cups and a laptop on it |
| R7 | Lab / lobby | minor | LOCK poster in both rooms | **Left:** a campaign poster repeating across a site is realistic |

Counts: 0 blockers, 0 majors, 7 minors. Fixed 4, left 3 with reasons.

### Interaction walk (Sonnet, game 2373, every room unlocked server-side; session stopped, :3001 left as found)

All ten rooms load with no "No Tiled item found", no missing texture and no 4xx/5xx. Every door of the corridor, open office and server room walked both ways with no snag. Lab Rules read in place and still on the wall after the read and after a page reload; the VIS badge hook is not interactable. Vault walk-in (N3): entered by the server room's north door, walked straight to Torres and talked, nothing in the way. Lisa, Owen, Halloran and Patricia reached from their doors. Fifteen of sixteen scenario objects opened directly.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| W1 | Lab | major | The Conference Lanyard raised a pick-one menu: a stool (`chair-white-2-rotate1`) 19 px away. Every `chair-*` sprite rolls when pushed and is a tap candidate (`rooms.js:2471`, `game.js` `gatherInteractablesNearClick`) | **Fixed:** a script now checks every slot against every chair and every other slot with the engine's rule (taps at each slot's centre and top-left); it found four more near misses the harness hadn't hit (the Bludit terminal's chair, Torres' visitor chairs against the Mug and the briefcase). All moved: the server-room terminal is a standing one, Torres' visitor chairs 32 px+ off both, and the lab stools are now `hospital_chair_south`, which don't roll (one shoved along the bench in the confirmation run brought the menu back). Check: 0 hits |
| W2 | Vault | minor | Torres' sprite top-left sits inside the upload terminal's bounds; a tap on his head from a spot in reach of both could gather two. Not reproduced: a normal approach opened him directly | **Left:** his position (5,7) is the story's ("alone at the terminal"), and the terminal is 68 px above him |
| W3 | Lab | minor | The stool beside the lanyard rolled when pushed | **Fixed** with W1 |
| W4 | Harness | note | `interact` on Owen and the Lab Rules needed a second call; the resume overlay loops on "Prev" | **Left:** harness timing, not layout |

### Confirmation run (Sonnet, game 2380, every room unlocked server-side; sessions stopped)

After the chair fixes: the Lanyard, the Mug, Torres' Briefcase, the Bludit terminal, the Security Incident Log and the Locked Filing Cabinet each open directly, by the harness's top-left tap and by a centre tap, with no menu; no chair in any menu; no page errors. Nearest chairs 43-53 px. A chair shoved along the lab bench brought the menu back, which is why the lab stools were then swapped for fixed seats (`hospital_chair_south`; the chair check reads 0 hits, final lab shot game 2382).

### Checks after cycle 5

- Validator: 0 errors; geometry and door alignment pass. `check_door_alignment.py`: 9/9. Walls: all 64. `slot_audit --notes`: 0 problems (the two IT-notice prompts, left as in cycle 2). Chair/slot tap check: 0 hits. Routes: 38/38.
- In game: game 2378 (all rooms, `build_evidence/dressing_c5/sheet.png`) and game 2382 (the lab with fixed stools). Original-versus-final pairs: `tmp/review/m05_dressing_c5_<room>.png` (the shared maps before on the left), `tmp/review/m05_dressing_c5_sheet.png`. The first-room render (`tmp/review/m05_dressing_first_room.png`) is the final lab.

### Phase art: room dressing CLOSED (2026-10-13)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| 1 (survey, first room, all ten rooms built) | 1 | 6 | 1 |
| 2 (review of cycle 1, plus the square-to-the-walls rule) | 0 | 8 | 9 |
| 3 (review of cycle 2) | 0 | 4 | 11 |
| 4 | fixes for cycle 3 | | |
| 5 (review, interaction walk game 2373, confirmation game 2380) | 0 | 1 (walk W1, fixed and confirmed) | 7 review + 3 walk |

Nothing above minor remains. Left, each with its reason above: Torres' and Patricia's visitor chairs are the house task chairs (R5), the meeting table's plain top (R6), the LOCK poster in two rooms (R7), the IT notice's read mode (cycle 2, for the orchestrator), Torres' head over the terminal's bounds (W2), the lab stools on the bench's north side (Q9). The first-room look is waiting for the user's sign-off (D15 in `DECISIONS_PENDING.md`).

Spend: PixelLab 1787 → 1767 (two 64 px calls); no Gemini.

Next: lighting (`mission-room-lighting`), then the POV backgrounds. Lighting should know about: the cryostat and LASER warning in the lab; the CCTV desk in Patricia's office; the graphite server side with its violet line; the vault's red line, key safes and HSM status lights; the break room's wall TV.

## User review 2026-10-16 (pending-decisions form 2.2): lab eyewash, wheeled kit

- **Eyewash/safety shower** ("strange, should be on a wall"): the free-standing qdc_eyewash1 was a wall fixture standing loose on the floor. The back wall was full and the east wall holds the door, so the sprite was split by cropping (no rescale): `qdc_safety_shower1` (shower and eyewash basin, 21x48) is plumbed into the NE corner of the back wall (feet y 72, no collision so the E door row stays open), and `qdc_first_aid_cabinet1` (19x22) hangs on the east wall below the door (x 289, feet 176). The whiteboard and LAB RULES moved 4-6 px left to make room (Lab Rules keeps clear floor under it). The first-aid kit from the old sprite was dropped.
- **Wheeled items** ("should have 8-direction rotation and collisions like chairs and hospital beds"): the lab's instrument trolley, the server hall's tool trolley, Torres' book trolley and the office chairs (chair-darkgray-1, chair-grey-1) now roll, spin and collide. The lab stools stay static on purpose (cycle 5: a rolling stool shoved along the bench raised a menu on the lanyard). In game (game 2554): pushed left, the lab trolley moved 24 px, stopped against the optical bench and spun through all 8 frames.

Engine and asset changes shared with the other missions (they need the user's approval before commit, see the report):
- `rooms.js` `STATIC_SWIVEL_PROPS`: instrument_trolley1, aes_tool_trolley1, book_trolley1, chair-grey-4, chair-darkgray-1 and chair-grey-1 now roll, spin through 8 frames and collide, like the hospital trolleys and beds. Frames are PixelLab 8-rotation output at the prop's own size on a padded canvas (40 px chairs, 32/48/56 px trolleys), reordered to the engine's S, SW, W ... order, with the original sprite kept as its own frame. Preloaded in `game.js`. A swivel prop placed as a table (m08's server-room tool trolley holds a printout) stays put.
- `object-physics.js`: pushed chairs and trolleys now collide with the map's furniture collision boxes (Object Layer 1). They were player-only, so a trolley rolled straight over the lab bench.
- `game.js` tap gather: a swivel prop joins the pick-one menu only when the tap is on its own sprite. Without this, tapping the PC on the desk in front of a chair raised a chair menu (checked in game: m04's BMS terminal opens directly).
- Builders: trolleys that were `r.solid` (a static box under them that pinned them) are now plain items: m05 lab and Torres' office, m04 workshop, m06 office.

Checks: slot_audit 0 problems; check_room_walls all 64; validator no errors; doors OK. Evidence: `build_evidence/user_review_2026-10-16/`. PixelLab: 60 generations for the six 8-rotation sets (all missions).
