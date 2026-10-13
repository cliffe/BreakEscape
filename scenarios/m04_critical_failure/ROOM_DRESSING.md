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
