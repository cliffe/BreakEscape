# m04 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/M04_PASS_BRIEF.md`, stage 4. Up to ten survey → critique → fix → verify cycles, about five while each one still improves the rooms. Evidence lives in `build_evidence/dressing_c<N>/`; in-game shots come from `tools/playtest/lighting-tour.sh` on the keyless :3001 server (every room unlocked, HUD hidden), in fresh games of my own.

The aim: a night shift at Albion Energy Storage, a 200 MWh grid battery site heading towards thermal runaway. Each room should look like what it is and different from the rest.

## Cycle 1 (2026-10-13)

### Survey: what was there

The scenario's nine rooms (the erb is authoritative; the "inverter room" in the brief is the plant room, whose door sign reads "Inverter / Plant Room", and the ninth room is the SCADA control room):

| Room | Map type before | Map size | Shared with |
|---|---|---|---|
| main_entrance | `room_reception` | 10×10 | 27 scenarios |
| operations_office | `room_office` | 10×10 | 52 scenarios |
| security_office | `room_office` (same map as ops) | 10×10 | |
| scada_control_room | `room_control_1x2gu` | 10×6 | 4 (sis02 among them) |
| battery_hall_1 | `room_battery_hall` | 20×10 | 3 (sis02) |
| battery_hall_2 | `room_battery_hall` (same map) | 20×10 | |
| engineering_workshop | `room_it` | 10×10 | 5 (sis02) |
| plant_room | `room_it` (same map as the workshop) | 10×10 | |
| loading_dock | `small_room_1x1gu` | 5×6 | 2 |

Before shots, in game: `build_evidence/dressing_c1/before/<room>-a.png` (all nine).

### Critique (ranked)

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map is shared with other scenarios (sis02 has signed-off POV backgrounds on three of them), and three pairs of m04 rooms share one map: ops and security, Hall 1 and Hall 2, workshop and plant room (regression M4). Nothing can be redressed for m04 without changing other missions. |
| A2 | All | major | Declared `dimensions` are wrong for 8 of 9 rooms (m14); the engine and validator read the map, so they are dead config but mislead anyone authoring positions. |
| A3 | All | major | 12 objects have no slot and land at random (`slot_audit.py`): Budget Cut Memo, SCADA HMI, BMS Jump Server Terminal, Drop-Site Terminal, Hall 2's three papers and fixtures, the ESD pushbutton, the dock's two papers. |
| H1 | Hall 1 | major | The battery racks are the old `batrack` sprite, which reads as a server rack (black, red trim); 36 of them in three solid blocks, a server room in purple carpet. |
| H2 | Hall 1 | major | A decorative red `emergency-button` on the west wall looks like the ESD. |
| H3 | Hall 1 | major | BESS Process Diagram and Duty Round Panel are pinned papers/PCs on the floor; the status panel and H2 detector are a glass-pane `tablet` sprite. |
| H4 | Hall 2 | major | Identical to Hall 1 including the red button; nothing says rack banks A and B, inverters or the BMS cabinet the bypass module sits in. |
| P1 | Plant room | blocker | The finale room is the workshop's office layout (desks, chalkboard, potted plant). The ESD lands somewhere new on every load (regression M4: (1328,703) then (1553,608)). The Coordination Log is on a random desk, not "the plant-room bench". |
| W1 | Workshop | major | An IT office with suitcases, bags, a landscape picture and orange retro chairs; the jump-server terminal and drop-site terminal land at random. |
| R1 | Reception | major | Generic purple lobby with retro chairs and four floor plants; nothing says energy site, gatehouse or PPE. |
| O1 | Ops / security | major | Generic open-plan office, two identical rooms; security has no camera wall or radio. |
| S1 | SCADA | minor | The best of the nine (big HMI wall), but the HMI object itself has no slot and the room has a red wall button and purple carpet. |
| D1 | Dock | major | A 5×6 carpeted cupboard with a briefcase; no shutter, no bay, nowhere a van could have parked. |

Counts: 2 blockers, 10 majors, 1 minor.

### Plan

1. Give m04 its own building: `room_aes_*` map types built by builders in `scripts/generate_rooms.py`, so the shared maps (and sis02's backgrounds) stay as they are. Same sizes as now, so room positions and door corners don't move, except the dock (see 6).
2. Sheets (`scripts/room_gen/make_aes_tileset.py`): cream office walls with a green Albion brand line; grey blockwork with a yellow band for the plant side. Floors per room: terrazzo with an Albion bolt inlay (reception), blue-grey carpet with a kitchenette patch (ops), charcoal carpet (security), anti-static vinyl (SCADA), grey epoxy with walkway lines and hatched keep-clear rack rows (halls, one 640 px sheet per hall cut in two halves, west on room6's gids and east on room18's), concrete with a hazard line round the bench (workshop), green epoxy with a red-hatched box at the ESD (plant), concrete with bay lines and a striped shutter threshold (dock).
3. New art: PixelLab for the plant (racks, inverters, switchgear, generator, transformer, BMS cabinet with the bypass module, ESD station, dial thermometer, gas detector, vent fan, pallets, PPE rack...); hand-drawn signs and plates, the process diagram, the duty-round terminal and the roller shutter (`scripts/room_gen/make_aes_props.py`).
4. Every scenario object onto a real fixture by `as-type`, fixed things read in place.
5. Correct every room's `dimensions` to its map.
6. Dock: 10×10 instead of 5×6, under Hall 2's east half (the space is free; door alignment and the overlap check to confirm), with a roller shutter, bay lines, pallets and the go-bag by the door.
7. Order: Hall 1 first, as the look to sign off (the brief: the first room of a new setting needs the user's sign-off), then the other eight.

### Done so far: Battery Hall 1 (for sign-off)

`room_aes_hall1` (20×10). Racks: the new pale grey battery racks (PixelLab), each row headed by its BMS master (a controller on top): Rack Bank C's west row of seven, two short east rows of four, each inside a hatched keep-clear border on grey epoxy, with a yellow walkway line along the door row and a marked north-south aisle. Back wall, west to east: PPE sign, the dial thermometer, the RACK BANK C plate, a vent fan, the digital status display, an HV warning sign, the H2 detector under a second vent fan, the BESS process diagram, a CCTV camera and an amber beacon. West wall: the duty-round terminal where the red button was, and an extinguisher. East wall: an emergency phone. A pallet of replacement modules and a pallet truck in the west aisle.

- The thermometer (H-core deduction) keeps its spot, top-left (66,33) against (80,42) before, now 24×23 instead of 16×16, beside the RACK BANK C plate; the status display (x 228) and H2 detector (x 388) keep theirs too, so the stealth balance against Cipher is unchanged. The dial and the digital display sit side by side on one wall, which puts the contradiction in one glance.
- Cipher: no change needed. His waypoints (12,7), (12,3), (13,3), (10,3) run through the door row (y 64-132, clear wall to wall) and the aisle x 346-454 (clear to y 300); his crossing window is the same geometry as before.
- The red button is gone from the hall; nothing red in the hall reads as an ESD (the extinguisher is the only red thing).
- Scenario edits (layout fields only, region re-read first): `type` → `room_aes_hall1`, `dimensions` 20×10; `as-type` on the thermometer, status panel, H2 detector, process diagram (now read in place, `readDisplay: gameDisplay`) and duty-round panel; the two old position pins and their comments replaced.

Shots: `build_evidence/dressing_c1/hall1/battery_hall_1-a.png` (in game, Cipher shown), map `build_evidence/dressing_c1/grid-room_aes_hall1.png`.

### Checks after the Hall 1 step

- `validate_scenario.rb --skip-ink --no-graph`: schema passes, geometry OK, door alignment OK (warnings are the existing dialogue ones).
- `check_door_alignment.py`: 8 of 8 OK.
- Route driver: 19 of 19 routes pass.
- `check_room_walls.py --scenario`: every map 64.
- `slot_audit.py`: Hall 1 five of five on their fixtures; 10 problems left, all in rooms not yet done.
- `node --check` game.js: OK. Session log: no "No Tiled item found", no failed tileset.

### New assets so far

PixelLab, two `pixellab_props.py` calls (about 40 generations; balance 1926 before): 15 frames from the 64 px batch (racks, inverters, switchgear, generators, BMS bypass cabinets, chiller, transformer, suppression cabinet, control panel, junction box) and 32 from the 32 px batch (ESD stations, dial thermometer, gas detector, vent fan, pallet, pallet truck, PPE rack, cable drum, status display, bollard, signs, first aid, emergency phone, breaker panel, spare module, barrier, gas cylinders, microwave, cones, beacon, tool trolley, toolbox, pegboard, clipboard, CCTV, lockout station, radio charger, hose reels, compressor, drum). All `aes_*`, registered with `register_object.py` (wall items with `--wall`). Two frames dropped as the wrong scale (lockers, flammables cabinet).

Hand-made: 13 sprites from `make_aes_props.py`; 11 sheets from `make_aes_tileset.py`.

### Assumptions (cycle 1 so far)

- Assumption: m04-specific map types are the right fix, as in m03; the shared maps stay untouched.
- Assumption: keeping every room's size (except the dock) is better than resizing to the declared `dimensions`, because the sizes decide room positions and door corners that the NPC positions were tuned against.
- Assumption: Hall 1 holds Rack Bank C only and Hall 2 banks A and B with the inverters, from the Hall 2 manifest and the status panel's C1-C3 text.

### User feedback on Hall 1 (2026-10-13): original racks back

The user prefers the original battery stacks (`batrack`, drawn from photos) to the new pale grey PixelLab racks. Hall 1 now uses `batrack` (32×72) in all three rows; Hall 2 will use them too. Everything else in the room treatment stays (walls, band, epoxy, hatched borders, signs, fixtures, pallet); not yet signed off as a whole.

- Rows refitted to the taller stacks: west row x 98-322, east rows x 458-586, feet 208 and 296 (tops 136 and 224, below the walkway line at y 132-134). Borders moved to (92,140,328,216), (452,140,592,216), (452,226,592,304); the stacks' tops cover each border's north edge.
- Aisle lines now x 344-346 and 448-450; the aisle x 346-448 is clear from the door row to y 300, and the door row y 64-132 is clear wall to wall, so Cipher's waypoints (12,7), (12,3), (13,3), (10,3) and his crossing window are unchanged.
- `aes_battery_rack1/2` stay registered but unused for now.
- Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; routes 19/19; walls all 64; Hall 1 slots 5/5; no "No Tiled item found" in the session log.
- Loading dock at 10×10: approved by the user (2026-10-13), to be built with the other rooms once the Hall 1 look is signed off.

Shots: `build_evidence/dressing_c1/hall1_v2/battery_hall_1-a.png` (in game), map `build_evidence/dressing_c1/grid-room_aes_hall1_v2.png`.

## Cycle 2 (2026-10-13): densifying Hall 1

User on Hall 1 v2: "Looks a bit boring. A lot of open space." The rest of the treatment stays (walls, yellow band, epoxy, hatched borders, wall signs and fixtures); the loading dock at 10×10 is approved, to be built once Hall 1's look is signed off.

### Critique

| # | Sev | Finding |
|---|---|---|
| D1 | major | 15 stacks in three thin rows; real halls are packed. |
| D2 | major | No plant on the floor between the rows: no suppression, cabinets, cables or service kit. |
| D3 | minor | The floor is clean paint: no trunking, drains or wear where people walk. |

### Fixes

- **D1:** 35 stacks of the original `batrack`, packed in overlapping rows as the old photo-based map did: a west block (Rack Bank C) of two rows of seven, x 112-336, feet 202 and 238; an east block of three rows of four, x 456-584, feet 202, 240 and 278. Every top stays at y 130 or below the walkway; the aisle and the S-door lane stay clear.
- **D2:** in the pocket between the S-door lane and the west block, a gas suppression cabinet, a DC combiner cabinet and an electrolyte spill kit; at the east block's end, a BMS master tower and a step ladder; a bollard in the SE corner; a cable drum at the aisle's south end, below Cipher's dwell point. The pallet and pallet truck went to make room for the second west row (they will suit the dock).
- **D3:** painted into `room_aes_hall1_w/_e`: steel floor trunking along the west block's foot, across the aisle and along the east block's foot, a riser down the aisle's west edge; five drains (three in the walkway, one in the aisle, one in the S-door lane); scuffed wear at the W, E and S doors and a faint beaten path along the walkway.

New art: one PixelLab batch at 32 px (about 20 generations; balance 1906 → 1882 including other agents): spill kit, spill cabinet, step ladder, two combiner cabinets, floor tray, air mover, condenser, BMS tower, PPE cabinet, dark cabinet, floor grate, all `aes_*` and registered. The floor tray and grate frames are registered but drains and trunking were painted into the floor sheet instead, so nothing flat stands up as a sprite.

### Cipher: cone coverage and the crossing window

The engine's sight check (`npc-los.js` `isInLineOfSight`) tests range and angle only, with no occlusion, so racks and cabinets don't hide the player from Cipher: denser blocks change only where the player can stand. Coverage below is the share of walkable floor (8 px cells, floor visible in game, each object's bottom 16 px treated as solid) inside his 150 px, 120° cone at each pose. Script: `build_evidence/dressing_c2/cone.py` (map JSON as its argument).

| Pose | Original map (`room_battery_hall`) | v2 | Cycle 2 |
|---|---|---|---|
| (12,7) dwell, facing S | 9.0% | 7.7% | 8.3% |
| (12,3) walking N | 1.0% | 1.5% | 1.7% |
| (13,3) look E | 11.4% | 13.6% | 14.3% |
| (10,3) look W | 12.3% | 13.6% | 14.3% |
| Door-row cells seen at the (12,7) dwell | 0 | 0 | 0 |

The crossing window is intact: while he dwells at (12,7) facing south, none of the door row is in his cone, the same as before. The small rise in the other poses is the denominator shrinking (less open floor), not a wider view. All four waypoints stand on clear floor: the door row y 64-130 is clear wall to wall and the aisle x 346-448 is clear to y 300 (the cable drum is at y 280-304, below his feet at 256).

Readability: the dial (top-left 66,33), the status display (228,34) and the H2 detector (388,34) are unchanged on the back wall, and the walkway in front of each is clear.

### Checks

- Validator (`--skip-ink --no-graph`): schema, geometry and door alignment pass.
- `check_door_alignment.py`: 8 of 8 OK. Route driver: 24 of 24 pass (the dialogue stage has added routes). `check_room_walls.py`: all 64. Hall 1 slots: 5 of 5 on their fixtures. Session log: no "No Tiled item found", no failed tileset.

Shots: `build_evidence/dressing_c2/battery_hall_1-a.png` (in game, Cipher shown), `build_evidence/dressing_c2/hall1_before_after.png` (v2 above, cycle 2 below), map `build_evidence/dressing_c2/grid-room_aes_hall1.png`. The tour shows Hall 1 alone, so the west half's bottom two rows, which the workshop covers in play, are visible in the shot.

### Assumptions (cycle 2)

- Assumption: overlapping rows (as the original map did) are the "packed" look the user wants, rather than more aisles between single rows; there isn't room for a second full single row in the west half without crossing the door row.
- Assumption: the red cylinders in the suppression cabinet read as gas cylinders, not as an ESD.

## Cycle 3 (2026-10-13): Hall 1's door row, and the other eight rooms built

User on Hall 1 cycle 2: fill the door row with low kit; another rack row is fine; racks collide only at the base, so the player can walk behind them. Standing approval from here: keep iterating, build the other eight rooms in the same treatment (the 10×10 dock approved), up to ten cycles while each still improves, a fresh reviewer each cycle, report every two cycles.

### What changed

- **Hall 1:** the blocks moved up to feet 166 (west 3 rows of 6, x 108-300; east 4 rows of 4, x 456-584), so the stacks' tops (y 94) overhang a walk-behind lane y 88-148 along the back wall. Low kit stands against the wall in the gaps between the readable fixtures: spill cabinet, combiner, drum, PPE cabinet, air mover, spill kit. The floor under the dial (x 56-100), the status display (x 218-264), the H2 detector (x 378-412) and the process diagram (x 462-524) stays clear. Each rack row gets a collision strip along its base: a batrack's own table body is 12 px wide (`rooms.js:2576-2588`, inset 10 px each side), which left 20 px gaps a player (18 px wide, `player.js:135`) could slip through. Items-layer props get no body of their own, so the builder's new `_Uni.solid()` adds a strip under each.
- **The other eight rooms** got their own builders and maps (`room_aes_hall2`, `_plant`, `_workshop`, `_security`, `_ops`, `_reception`, `_control`, `_dock`), registered in `game.js`, the schema and the README room table. Every scenario object sits on a fixture (`slot_audit`: 0 problems, down from 12). Every room's `dimensions` now matches its map; the dock is 10×10 under Hall 2's east half (door alignment 8/8, overlap check clean).
- **Plant room:** the ESD fixed on the back wall (top-left 160,33) under an EMERGENCY SHUTDOWN plate, with a red-hatched keep-clear box in front and switchgear either side; the Coordination Log and the Operation Log on the steel bench, the laptop and the marked blueprints on Voltage's tables.
- **Scenario edits** (layout fields only, each replacement asserted unique on a fresh read): eight room `type`s and `dimensions`; `as-type` on 14 objects; `readDisplay: gameDisplay` on Hall 2's Emergency Procedures and the dock's schedule; the tool case's (7,7) pin replaced.

### Review (fresh Opus reviewer, read-only)

Hard constraints all passed: Cipher's waypoints on walkable floor with his crossing window intact, Relay's beat clear, Static and Voltage on clear floor, the ESD fixed, slot audit clean.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| F1 | Hall 2 | major | The BMS bypass cabinet stood behind Rack Bank A, half hidden and reachable only from the hidden lane | **Fixed:** bank A shortened to 4 stacks (x 136-264), cabinet moved into the open at x 86, procedures sign to x 140 (67 px from the cabinet's top-left) |
| F2 | Halls 1, 2 | major | 20 px corridors between overlapping rows, open at both ends | **Fixed:** each block is solid from its first row's base to its last (`_rack_block`); the only walk-behind lane is the one along the back wall, in front of each block's top. Decision logged (the user's "walk behind them" read as the back-wall lane) |
| F3 | Dock | major | Mostly empty; kit pushed into the corners | **Fixed:** returns pallets west, deliveries east, dock plate and tyre marks painted in the bay, barrier at its mouth, compressor, spill kit, drum |
| F4 | Security | major | Sparse, no printer, a fridge that read as a speaker | **Fixed:** photocopier, rota board, undercounter fridge, printer-desk chair, spare chair |
| F5 | Ops | minor | Noticeboard 24 px over the floor; coat stand in the east wall | **Fixed:** noticeboard to the back wall with the layout map pinned on it; filing cabinets moved south to clear the floor under it; coat stand to x 262 |
| F6 | Security, dock | minor | Cabinet and drum in the east wall strip | **Fixed:** moved to x 258 and x 240 |
| F7 | SCADA | minor | The procedure note lay inside the HMI's bounds (pick-one menu) | **Fixed:** both papers on a printer table, 47 px apart, clear of the console |
| F8 | Reception | minor | Orange retro chairs, no safety board, PPE rack over the floor | **Fixed:** leather sofa, safety board, PPE rack on the back wall, check-in kiosk |
| F9 | Hall 1 | minor | The pale combiner read as a ghostly tank | **Fixed:** dark junction box |
| F10 | Hall 1 | minor | Kit line stopped short; a lone bollard | **Fixed:** line to x 586; spill kit instead |
| F11 | Plant | minor | Toolbox and HV sign walk-through; red lockout box beside the ESD; office desk as camp table | **Fixed:** both solid; lockout station removed; two folding tables |
| F12 | Workshop | minor | First aid on the rack top; executive briefcase as the tool case | **Fixed:** first aid removed; a yellow hard case at the bench's end (`as-type:briefcase-yellow-`) |
| F13 | Hall 2 | minor | Red hatch at the inverters echoed the ESD box; outdoor condenser | **Fixed:** yellow/black hatch; chiller unit |
| F14 | erb | minor | Stale comment naming room_battery_hall | **Fixed:** comment updated (ERB comment only) |

Counts: 0 blockers, 4 majors, 10 minors; all fixed in cycle 4.

## Cycle 4 (2026-10-13): fixes from the cycle 3 review

All fourteen findings above, plus my own pass on the cycle 4 shots: the same blue sofa had landed in three rooms (reception now has the leather sofa, security a spare chair, ops keeps the sofa), and the dock's tyre marks were too heavy (lightened).

### Cipher (Hall 1), recomputed after the door-row change

`build_evidence/dressing_c2/cone.py` now also counts the builder's collision rectangles, so walkable floor is measured as the engine sees it.

| Pose | Cells in cone, cycle 2 | Cycle 4 | Share of walkable floor, cycle 4 |
|---|---|---|---|
| (12,7) dwell, facing S | 140 | 138 | 10.2% |
| (12,3) walking N | 28 | 28 | 2.1% |
| (13,3) look E | 243 | 183 | 13.5% |
| (10,3) look W | 243 | 174 | 12.9% |
| Door-row cells seen at the (12,7) dwell | 0 | 0 | |

The crossing window is intact (nothing in the door row is in his cone while he dwells facing south). The share rises only because the walkable floor shrank by a fifth (1694 to 1351 cells, 8 px); the cells in his view are the same or fewer at every pose. Cycle 2 counts are from the committed cycle-2 map (`git show HEAD:...room_aes_hall1.json`) under the same script. Sight has no occlusion in the engine (`npc-los.js:21-63`), so the stacks are visual cover only.

### Checks (after cycle 4)

Validator: schema, geometry and door alignment pass. `check_door_alignment.py`: 8/8. Route driver: 27/27 (the dialogue stage keeps adding routes). `check_room_walls.py`: every map 64. `slot_audit.py`: 0 problems; three notes prompts left on purpose (Hall 2's manifest is a takeable clipboard; the bypass module keeps the notebook read for its fingerprint branch). `node --check` game.js: OK. Session logs: no "No Tiled item found", no failed tileset.

### Evidence

`build_evidence/dressing_c3/` and `dressing_c4/final/`: in-game shots of all nine rooms (NPCs shown), `sheet.png`, grid maps. Before/after pairs for the user in `tmp/review/m04_dressing_c4_*.png`.

### Assumptions (cycles 3-4)

- Assumption: the user's "walk behind them" means the lane along the back wall behind the front of each block, not corridors inside the blocks.
- Assumption: the dock's 10×10 position (east of the plant room, under Hall 2's east half) is right; door alignment and the overlap check confirm it.
- Assumption: `as-type:briefcase-yellow-` (base type with a trailing hyphen) is how the engine names that sprite's base type; slot_audit agrees, not yet confirmed by a tap in game.

## Cycle 5 (2026-10-13): review fixes and the interaction walk

Inputs: a fresh Opus review of the cycle-4 rooms (0 blockers, 5 majors, 8 minors; its report reached the orchestrator, who relayed it) and a Sonnet interaction walk on :3001 (game 2230, every room unlocked server-side; `debugKO` used on Cipher, Relay and Static to get past their line-of-sight challenges; report and screenshots in the session scratchpad `m04-dressing-walk-c5/`).

### Interaction walk

Every object on its new fixture opened the right thing: Hall 1's five (the thermometer fires its caption and `anomaly_detected`; status display, H2 detector and process diagram open in place; the round panel examines), Hall 2's three, the plant room's ESD ("NOT ARMED. GRID PERMISSIVE NOT RECEIVED...", not pressed), laptop and three papers, the workshop's five (the tool case opens the lockpick), security's four (the camera wall reached from beside the console), ops' four, SCADA's three, reception's two, the dock's three. Every door-to-door walk passed; the Hall 1 lane runs W door to E door behind the racks (the player draws behind them), and the blocks are solid from the south. No "No Tiled item found", no stuck spots.

| id | sev | finding | outcome |
|---|---|---|---|
| W1 | major | A `notes` object leaves the scene after its first read (engine behaviour, `notes-minigame.js` removeNoteFromScene, regardless of `takeable: false`). Fine for papers, but the BMS bypass cabinet, a whole piece of furniture, vanished | **Fixed:** the cabinet is now decor (tables layer, with a collision strip); the scenario object claims `aes_bypass_module1`, a crop of the cabinet's own module laid exactly over it, so a read removes only the overlay and the cabinet looks unchanged. The bypass keeps the notebook read (its fingerprint branch). Papers vanishing after reading is left as is (engine behaviour, the same in every mission) |
| W2 | minor | Hugging the back wall in Hall 1, the player meets the low kit and has to step 25 px down into the lane | Left: the kit stands against the wall by design and the lane is wide (pathfinding takes it without help) |
| W3 | minor | 18 unattributed 404s and 2 TypeErrors in the console | Left: the server log ties the 404s to assets m04 doesn't use (other agents' games on the shared server) |

### Review findings

| id | room | sev | outcome |
|---|---|---|---|
| F1 | Hall 2 | major | **Fixed:** the empty hatched box west of bank A redrawn to bank A's four stacks |
| F2 | Plant | major | **Fixed:** a PCS inverter (`aes_inverter2`) where the single switchgear panel was, a PCS control cabinet on the south side (new PixelLab `aes_pcs_cabinet1`), an exit sign by the N door, trunking from the switchgear and PCS down both sides to the transformer and generator, walkway lines and wear on the ESD approach |
| F3 | Plant | minor | **Fixed:** Voltage's tables lifted to feet 178; a steel trestle (new `aes_trestle1`) and a folding table, laptop and plans 42 px apart |
| F4 | Ops | major | **Fixed:** filing cabinets against the back wall (blinds dropped to make room), bin beside the day desk, binders on it |
| F5 | Ops, workshop | minor | **Fixed:** desk chairs face their desks |
| F6 | Security | major | **Fixed:** the chair off the photocopier and the stray chair gone, a desk chair at the printer desk, photocopier to the SE, a warm taupe carpet so the room reads apart from ops, the guard's hi-vis/hard hat/radio hook (new PixelLab `aes_hivis_hook1`) by the door |
| F7 | SCADA | major | **Fixed:** a hand-drawn grid mimic board (`aes_mimic_board1`, 96×32: busbar, breakers, three bank lamps green/green/amber/red) over the console, office chairs, the console moved up to free the W-E lane |
| F8 | Reception | minor | **Fixed:** safety board clear of the PC, an AED cabinet, a glass coffee table in front of the sofa |
| F9 | Workshop | minor | **Fixed:** the monitoring cart solid, the tool case against the bench end, supply shelves on the west side, grey lockers (new `aes_lockers_grey1`) in place of the P B C lockers security also had, a cable tangle on the parts bench |
| F10 | Halls | minor | **Fixed early:** a grey wall gas detector with a readout (new PixelLab `aes_gas_detector2`) replaces the beacon-like H2 detector in both halls; Hall 1's object now `as-type:aes_gas_detector` (top-left 386,31, 2 px from the old spot). BMS tower kept (one use) |
| F11 | Hall 2 | minor | **Fixed:** chiller lowered clear of the inverters; a power panel instead of the second status display |
| F12 | Repeats | minor | **Fixed:** the dock's drum became a gas cylinder rack; the other repeats went with F6/F9/F10 |
| F13 | Signs | minor | **Fixed in part:** exit signs in the plant room and the dock, a yellow shutter control box (PixelLab `aes_shutter_ctrl1`) beside the shutter. The halls' S-door exits sit in rows the room to the south covers, so no sign there |

Scenario edits: `as-type` for the H2 detector (`aes_gas_detector`) and the bypass module (`aes_bypass_module`), and the bypass comment. Layout fields only.

New art: two PixelLab calls (64 px: trestle, folding table, UPS, grey lockers, shelving, PCS cabinet, electrical cabinet, console, skip, tool chest; 32 px: gas detector, hi-vis hook, shutter control), about 40 generations; hand-made `aes_mimic_board1` and `aes_bypass_module1` (a crop, no rescale).

Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; routes 27/27; walls all 64; slot audit 0 problems; `node --check` game.js OK; no "No Tiled item found". Cipher's cone unchanged from cycle 4 (138 / 28 / 183 / 174 cells; 0 door-row cells at the dwell).

Shots: `build_evidence/dressing_c5/` (all nine rooms in game, sheet, grid maps).

## Cycle 6 (2026-10-13)

Fresh Opus review of the cycle-5 rooms: 0 blockers, 2 majors, 5 minors. Hard constraints all pass (Cipher, readable fixtures, Relay, Static and Voltage, the ESD, door mouths, no ESD look-alikes, collision, slot audit 34/34). Its verdict: cycle 5 improved things (plant room most); the halls, dock and workshop are at small returns; security, reception and SCADA lag.

| id | room | sev | finding | outcome |
|---|---|---|---|---|
| F1 | Workshop | major | Tapping the jump-server PC's middle also caught the drop-site terminal (28 px), and the tool case sat 21 px from it: pick-one menus on the mission's two key terminals (the walk missed them because the harness taps top-lefts) | **Fixed:** PC at 0.22 and drop-site at 0.86 along the bench (top-lefts 55 px apart); tool case moved to the bench end on the hazard line, 42 px from the drop-site |
| F2 | Security | major | Still the weakest room: bare middle, one PC under an 8-screen wall | **Fixed:** the console runs on with a second desk carrying the access-control monitor; a CCTV recorder (new PixelLab `aes_dvr1`); the printer desk group moved up to make the middle a work area |
| F3 | Reception | minor | Read as a hotel lobby (salmon counter) | **Fixed:** a grey gatehouse security desk (new PixelLab `aes_security_desk1`) with a steel sign-in counter beside it carrying both papers (36 px apart); speed gates (new `aes_speed_gate1`, walk-through) on the way in; the kiosk moved to the top of the door lane |
| F4 | Reception | minor | The guard at (5,4) overlapped the counter and the player's spawn | **Fixed:** `security_guard` `position` (5,4) → (6.5,5), beside the sign-in counter (layout field; no patrol, no story reference to the spot) |
| F5 | SCADA | minor | Lower floor empty, no clock | **Fixed:** wall clock, a steel filing cabinet and a UPS |
| F6 | Dock | minor | Escape plan 27 px from the go-bag | **Fixed:** moved 10 px east (37 px) |
| F7 | Plant | minor | Light trunking read as raised kerbs on the green epoxy | **Fixed:** darker lids with a yellow edge for the plant sheet only |

Scenario edit: the guard's `position`. New art: one PixelLab call (64 px, about 20 generations; balance 1837 before): speed gates, security desk, CCTV recorder, office chair.

Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; routes 27/27; walls all 64; slot audit 0 problems; no "No Tiled item found". Cipher's cone unchanged (138 cells at the dwell, 0 in the door row).

Shots: `build_evidence/dressing_c6/` (nine rooms, sheet, grids). Pairs for the user: `tmp/review/m04_dressing_c6_*.png` (cycle 4 against cycle 6).

### Where it stands

The reviewer judges the scene close to small returns after this cycle. Cycle 7 will check that with a fresh reviewer and a short Sonnet re-walk of the cycle 5-6 changes (the bypass overlay, the workshop terminals and tool case, the reception counter and guard); I stop once a cycle finds nothing above minor.

### Assumptions (cycle 6)

- Assumption: moving the gate guard 1.5 tiles right and one down is a layout change the dialogue doesn't depend on (no waypoint, no story reference to where he stands).
- Assumption: walk-through speed gates are acceptable; giving them collision would need a gap a player can find.

## Cycle 7 (2026-10-13): confirmation (close pending one tap re-check)

Inputs: a fresh Opus review (0 blockers, 1 major, 5 minors; all hard constraints pass, Cipher's cone unchanged at 138 / 28 / 183 / 174 cells, 0 door-row cells at the dwell) and a Sonnet re-walk of the cycle 5-6 changes (0 majors, 6 minors), then a Sonnet tap check of reception.

| id | source | sev | finding | outcome |
|---|---|---|---|---|
| R-F1 | review | major | The guard, moved to (7.1,4) at the counter's east end (his ink: "looks up from the desk"), took the Procedures paper inside his 80 px tap frame: a pick-one menu | **Fixed**, then refined. At (7.8,4) the menu went but his opening challenge stopped firing: his centre was 101 px from the spawn, beyond the 96 px face-player distance, so he never turned to the player (tap check, games 2242/2244). Now (7.3,4), 88 px from the spawn, with the papers re-spaced so his frame (x 194-274) is clear of them. **Re-check of the opening in a fresh game is running** |
| R-F2 / W1 | both | minor | The two papers on the 51 px counter were 27 px apart at their middles (pick-one menu on the log) | **Fixed:** Sign-In Log on the gatehouse desk, Procedures on the counter (40 px+). Tap check: each opens directly |
| R-F3 | review | minor | Vance's PC 31 px from the Work Orders | **Fixed:** paper moved along the desk (35 px) |
| W2 | walk | minor | A gap between the two reception desks let the player walk behind them | **Fixed:** one collision block over both desks' footprint; tap check: blocked from both ends |
| R-F4 | review | minor | The plant bench papers sit inside Static's frame until he is dealt with | Left: the encounter clears both NPCs before the papers matter |
| R-F5 | review | minor | Cipher's frame covers the gas detector while he looks east from (13,3) | Left: a moment of the stealth beat |
| W3 | walk | minor | His cone covers the speed gates' east half only | Left: the gates are on the way in, inside his range; nothing depends on it |
| W4 | walk | minor | Dialogue/text, not layout: the guard's `on_sighted` narrator line ("on his feet as you come through the door") never showed and doesn't fit a spawn inside the room; HaX's message and the tool case's observation say "under the bench" (it stands by the bench's end, 32 px+ from the drop-site terminal, so it can't go under) | **For the dialogue stage** |
| W5 | walk | minor | One `door-locked` on the first workshop entry in an unlocked game; fine on retry | Left: not reproducible, not layout |

Scenario edits: the guard's `position` (6.5,5) → (7.3,4). Checks after the fixes: validator (schema, geometry, door alignment) pass; door alignment 8/8; routes 27/27; walls all 64; slot audit 0 problems. Shots: `build_evidence/dressing_c7/` (reception and ops, in game and maps).


### Phase art: room dressing CLOSED (2026-10-13)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| 1 (survey; Hall 1 first-room sign-off) | 2 | 10 | 1 |
| 2 (Hall 1, user: too empty) | 0 | 2 | 1 |
| 3 (review) | 0 | 4 | 10 |
| 4 | fixes for cycle 3 (all nine rooms on the Albion treatment) | | |
| 5 (review + interaction walk, game 2230) | 0 | 6 | 10 |
| 6 (review) | 0 | 2 | 5 |
| 7 (review + re-walk, games 2238/2239; guard tap re-check, game 2245) | 0 | 1 | 11 |

Cycle 7's major (the gate guard's tap area against the reception papers) is fixed and confirmed in game 2245: his challenge fires on its own from spawn, and each paper and his head open with one tap. The leftover minors are logged in ROOM_DRESSING.md cycle 7. Orchestrator text fixes after the close: the guard's sighting narration is now "The guard looks up from the desk and gets to his feet." (the player spawns inside the room), and the tool case is now "by the bench" / "against the end of the bench". Next: lighting (the new ESD sprite needs its own emitter), then POV backgrounds.

## User review 2026-10-16 (pending-decisions form 2.1): operations office matches its POV background

The user asked for the room to follow its conversation background (`docs/agents/pending_review/m04_pov_first_room.png`). Builder `room_aes_ops` (generate_rooms.py):
- Filing cabinets stand against the back wall: feet y 96 → 70, base just below the wall foot, as in the POV.
- Kitchenette back against the wall: counter and fridge feet y 104 → 92 (the front face now starts at the floor line, worktop on the wall face), collision box moved with them. The kettle and microwave follow the counter.
- Noticeboard ("poster") up: feet 50 → 45, its pinned Layout Map note 44 → 39. The rota board went up too (52 → 44) so the kettle and microwave no longer cover it.
- Vance's chair (chair-grey-1) now rolls and spins (see below); tapping the BMS terminal still opens it directly, no menu.

Engine and asset changes shared with the other missions (they need the user's approval before commit, see the report):
- `rooms.js` `STATIC_SWIVEL_PROPS`: instrument_trolley1, aes_tool_trolley1, book_trolley1, chair-grey-4, chair-darkgray-1 and chair-grey-1 now roll, spin through 8 frames and collide, like the hospital trolleys and beds. Frames are PixelLab 8-rotation output at the prop's own size on a padded canvas (40 px chairs, 32/48/56 px trolleys), reordered to the engine's S, SW, W ... order, with the original sprite kept as its own frame. Preloaded in `game.js`. A swivel prop placed as a table (m08's server-room tool trolley holds a printout) stays put.
- `object-physics.js`: pushed chairs and trolleys now collide with the map's furniture collision boxes (Object Layer 1). They were player-only, so a trolley rolled straight over the lab bench.
- `game.js` tap gather: a swivel prop joins the pick-one menu only when the tap is on its own sprite. Without this, tapping the PC on the desk in front of a chair raised a chair menu (checked in game: m04's BMS terminal opens directly).
- Builders: trolleys that were `r.solid` (a static box under them that pinned them) are now plain items: m05 lab and Torres' office, m04 workshop, m06 office.

Checks: slot_audit 0 problems; check_room_walls all 64; validator (--skip-ink --no-graph) no errors; check_door_alignment OK. In game (keyless :3001, game 2540 render, 2558 tap). Evidence: `build_evidence/user_review_2026-10-16/`.
