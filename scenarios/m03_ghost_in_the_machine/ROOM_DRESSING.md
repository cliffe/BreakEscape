# m03 room dressing

Skill: `.claude/skills/mission-room-dressing/`. About five survey → critique → fix → verify cycles (m03 pass 2 brief, stage 3). Screenshots live in `build_evidence/dressing_c<N>/`; in-game shots were taken on the keyless :3001 server in fresh games of my own (every room unlocked, HUD hidden, NPCs forced visible for the shot), never touching the regression runs' sessions.

## Cycle 1 (2026-10-12)

### Survey: what was there

m03 used four shared map types: `room_reception` (reception), `room_office` (both the conference room and Danny's office), `room_servers` and `room_ceo`. m01 uses `room_reception`, `room_office` and `room_servers` too, and `room_ceo` is used by 15 other scenarios, so none of them could be redressed for Zero Day without changing m01 and the rest. Cycle 1 gives m03 its own map types instead; the shared maps are untouched (`git status` shows no change to any existing room .json/.tmj).

Before shots (in game, then the bare map with every conditional slot drawn):

| Room | In game | Map |
|---|---|---|
| reception_lobby | `build_evidence/dressing_c1/before/reception_lobby.png` | `before/grid-room_reception.png` |
| conference_room_01 | `before/conference_room_01.png` | `before/grid-room_office.png` |
| server_room | `before/server_room.png` | `before/grid-room_servers.png` |
| executive_office | `before/executive_office.png` | `before/grid-room_ceo.png` |
| danny_office | `before/danny_office.png` | `before/grid-room_office.png` |

### Critique (ranked per room)

The aim: Zero Day Syndicate trades as "WhiteHat Security Services", an exploit broker posing as a security consultancy. Front of house should look expensive and smug; the CEO's office should say money and ego; the server room should look like the real business.

**Reception** (major): the purple m01 sheet and an m01 reception layout. 1. Nothing says who the firm is: no name, no brand. 2. The receptionist (6, 3) stood on the front of the counter. 3. Waiting area of orange retro chairs between four identical floor plants, generic landscape pictures. 4. The founding plaque, which the computer password depends on, was a loose paper on the counter (notes1); the directory was another loose paper.

**Conference room** (blocker for theme): it was an open-plan office. 1. No conference table at all; two desk pods with PCs and clutter, a school chalkboard on an easel. 2. Victoria's "clone her card at the whiteboard" beat had no proper whiteboard: the Conference Whiteboard was a paper on a desk. 3. Shared the exact map with Danny's office, so the two rooms looked identical.

**Server room** (blocker): 1. The VM Access Terminal had no slot and landed at a random spot on the floor (slot_audit NO SLOT). 2. A landscape window and a pile of bags and suitcases along the back wall. 3. The filing cabinet and the wall safe were both small floor safes; the wall safe needed a pinned position, and the CyberChef laptop a pinned position on the old west desk, to stop them stacking. 4. The Server Room Whiteboard was a paper on a desk. 5. Nothing showed what the business is.

**CEO office** (major): the best of the five but shared with 15 scenarios. 1. Purple sheet, a pink armchair, five small generic pictures. 2. The Executive Computer was on a side desk across the room. 3. The Desk Drawer was a briefcase standing on the front of the desk. 4. The "locked cabinet in the corner" was a small wall safe. 5. Bottom half of the room empty.

**Danny's office** (major): the same open-plan office as the conference room. 1. Nothing personal: no sign he lives at his desk, no photo stand. 2. Family Photo and Performance Review were both loose papers on a shared desk, beside six other people's kit. 3. Danny at (5, 4) stood among the desks.

### Findings count

| Severity | Count | Fixed | Deferred |
|---|---|---|---|
| Blocker | 2 (no conference table; VM terminal with no slot) | 2 | 0 |
| Major | 10 | 10 | 0 |
| Minor | 8 | 7 | 1 (Server Room Whiteboard read in place: needs onRead on the gameDisplay path, an engine change) |

### Plan

1. Give m03 its own building: a repainted room sheet set (`scripts/room_gen/make_zds_tileset.py`) with cool white walls and a cyan brand line on a graphite skirting for the front of house, slate walls for the server room; floors: polished stone with the firm's hat mark at the spawn (reception), slate-blue carpet (conference, Danny), walnut parquet with a navy and gold rug (CEO), raised access floor with two perforated cold aisles (servers).
2. Five builder rooms in `scripts/generate_rooms.py` (`room_zds_reception`, `_conference`, `_office`, `_ceo`, `_servers`), registered in `game.js`, the schema enum and the README room table.
3. Every scenario object onto a real fixture (as-type where the base type differs), so nothing lands at random and fixed things read in place.
4. NPCs on clear floor, roughly centred towards the top right.
5. New props, PixelLab first, hand-drawn for flat signs.

Implemented in cycle 1: all of 1-5. Deferred: see "Cycle 2" below.

### Fix: what changed per room

**Reception** → `room_zds_reception`. WHITEHAT sign (hand-drawn) over a black marble front desk; founding plaque on the back wall beside it (`as-type:plaque`, read in place); trophy cabinet of industry awards by the door; a live threat-map wall screen; a CCTV camera in the corner; the building directory as a narrow sign on the west wall below the door's column (`as-type:uni_directory`, read in place); a black leather sofa and glass coffee table; two fig trees in chrome pots; bean-to-cup coffee machine; fire point and extinguisher. Receptionist moved (6, 3) → (7.1, 4.9), on clear floor right of the desk.

**Conference room** → `room_zds_conference`. A boardroom: whiteboard (`as-type:whiteboard`, read in place) and a wall screen with the firm's deck between two sets of blinds; sideboard with water and glasses; a long walnut table (a recolour of the hospital boardroom table, `scripts/room_gen/make_zds_props.py`) with three leather chairs on the north side and two swivel chairs seen from behind on the south; Presentation Materials on the table; flip chart; fig tree. Victoria stays at (5, 4), between the whiteboard and the table.

**Server room** → `room_zds_servers`. Back row: locked steel filing cabinet (`as-type:filing_cabinet_locked`), two racks and a storage array under a cable tray; on the wall the exploit marketplace's live price board, the wall safe (a real wall slot now, safe4) and the Server Room Whiteboard (`as-type:whiteboard`). Middle row: UPS, racks, a patched network rack. The operator's desk with the VM Access Terminal (now a real slot), an ops bench with the CyberChef laptop and the drop-site terminal (top-lefts 32px+ from each other's centres), a KVM cart, gas suppression cylinders and their panel. The two Pass 3 position pins (wall safe, laptop) were removed and their `_comment`s rewritten.

**CEO office** → `room_zds_ceo`. Walnut parquet and a navy and gold rug; a mahogany desk with a leather chair (PixelLab; its baked-in laptop and paper tray were painted out so the real Executive Computer, pc11, sits on it); her own portrait between two sets of blinds; bookcase; a locked steel filing cabinet in the NE corner (`as-type:filing_cabinet_locked`); drinks cabinet with decanters; black leather sofa and glass table; two visitor chairs facing the desk; fig tree; a second trophy cabinet. The Desk Drawer is an overlay of the desk's own right pedestal (`exec_desk_drawer1`, `as-type:exec_desk_drawer`), 32px+ from the computer.

**Danny's office** → `room_zds_office`. A consultant's office: network whiteboard, two framed certifications, bookcase, binder shelves, blinds; his desk on the west side with his PC and a framed family photo standing on it (`as-type:picture`, read in place); the performance review on a side table; a camp bed where he has been sleeping; a small lab rack; coat stand, bin, plant. Danny moved (5, 4) → (6.5, 4), clear floor top right.

Scenario edits (`scenario.json.erb`, layout fields only): five room `type`s; `position: "as-type:..."` on the directory, plaque, conference whiteboard, both filing cabinets, server whiteboard, desk drawer, family photo; `readDisplay: "gameDisplay"` on the directory, plaque, conference whiteboard and family photo; two position pins removed; receptionist and Danny positions.

Not changed on purpose: the Server Room Whiteboard keeps the notebook-page read, because the gameDisplay path in `interactions.js` (~line 1445) skips `onRead.setVariable`, and this whiteboard sets `whiteboard_seen`. The hallways (`hall_1x2gu`, shared) are untouched.

### New assets

PixelLab, two `pixellab_props.py` calls (about 20 generations each; balance 3250 → 3230 reported after both, other agents share the account):

- batch 1 (canvas 64): `leather_sofa1`, `glass_coffee_table1`, `trophy_cabinet1`, `drinks_cabinet1`, `exec_desk_mahogany1` (laptop and tray painted out by hand), `marble_desk1`, `fig_plant1`, `leather_chair1`
- batch 2 (canvas 48): `victoria_portrait1`, `market_board1`, `threat_map1`, `camp_bed1`

Hand-made (free): `whitehat_sign1` (PIL), `exec_desk_drawer1` (crop of the desk's pedestal), `zds_conference_table1` (walnut recolour), the four `room_zds_*` sheets. `exec_laptop1` was registered and then not used (the desk's laptop was painted out instead); remove it in cycle 2 or reuse it.

Unused but kept in the batch folders (scratchpad only): a bar cart, a trophy bookcase, a bin and shredder, a water cooler, a fiddle-leaf fig in terracotta, a coffee station, a black office chair, a vending machine.

### Verify

- `slot_audit.py --verbose --notes`: 0 problems, every object on its intended sprite; 1 notes prompt left (Server Room Whiteboard, reason above).
- `check_room_walls.py --scenario`: every map reads 64. `make_zds_tileset.py` checks each sheet too.
- `generate_rooms.py` validation: OK for all five; the remaining WARN lines are the generic N-door-corner and bottom-row hints on rooms with no door in that corner and nothing to the south, a deliberate wall safe on the back wall, and the drawer overlay sitting on the desk front ("may be on legs").
- `validate_scenario.rb --skip-ink --no-graph`: schema passes, geometry and door alignment OK; the warnings are the existing dialogue ones. m01 validates unchanged.
- `check_door_alignment.py` on m03: all OK. `node --check` on game.js: OK.
- In game (fresh games of my own on :3001): every scenario object's texture key and room position dumped from `window.rooms` and matched the plan; no "No Tiled item found" logs, no console errors in the session logs. Not done: walking through the doors and interacting with each object in a browser playtest (cycle 2, Sonnet).

After shots:

| Room | In game | Map |
|---|---|---|
| reception_lobby | `build_evidence/dressing_c1/after/reception_lobby.png` | `after/grid-room_zds_reception.png` |
| conference_room_01 | `after/conference_room_01.png` | `after/grid-room_zds_conference.png` |
| server_room | `after/server_room.png` | `after/grid-room_zds_servers.png` |
| executive_office | `after/executive_office.png` | `after/grid-room_zds_ceo.png` |
| danny_office | `after/danny_office.png` | `after/grid-room_zds_office.png` |

Contact sheet: `after/grid-contact_sheet.png`.

### Cycle 2: what to do next

1. Browser playtest (Sonnet) of the changed rooms: interact with every scenario object, check no pick-one menus (CEO desk, ops bench, Danny's desk), walk every door, check the receptionist's and Danny's conversations still open where they stand.
2. Reception: the marble desk is small for the room; try a longer counter (two desks or a PixelLab L-shaped desk) and something on the empty middle-right floor (stanchions to a speed gate by the N door, or a low planter wall). The fire extinguisher floats mid-wall; stand it under the call point at the floor line.
3. Conference room: the lower-left and middle are bare; a credenza or a second plant, and possibly a speakerphone and glasses on the table. Give the walnut table some grain.
4. Danny's office: the middle floor is empty; add energy-drink cans and takeaway boxes on the desk or bin, a second monitor, a rug; consider a desk lamp for the night scene (it matters for lighting).
5. Server room: an air-con unit and a tape library were dropped for space; a third, shorter rack row or a cage door would add weight. Check the slate walls under the lighting pass.
6. CEO office: rug sits a little low under the desk; lamp-stands in a pair; consider the bar cart from batch 1.
7. Hallways: `hall_1x2gu` is shared; a `room_zds_hall` variant (brand wall, art, a water cooler) would carry the look between rooms.
8. Remove or reuse `exec_laptop1`.

### Assumptions

- Assumption: m03-specific map types are the right fix, given m01 and 15 other scenarios share the old maps; the old maps stay as they were.
- Assumption: moving the receptionist and Danny is layout, not dialogue; nothing in the ink or event mappings reads their positions (only the night guard has waypoints).
- Assumption: the cover name on the sign is "WHITEHAT", taken from the Building Directory text; if the front's name changes in the dialogue pass, the sign needs redrawing.
- Assumption: Victoria's portrait uses the dark-haired PixelLab frame to match her female_blowse sprite, not a likeness check against her dialogue portrait.

## Cycle 2 (2026-10-12)

Started from a fresh look at the cycle-1 after shots (`build_evidence/dressing_c1/after/`), asking of each room: would a player know at a glance this is Zero Day's? Item 1 of the cycle-1 list (the interaction walk) is with a separate Sonnet tester; this cycle did items 2-6 and the `exec_laptop1` leftover.

### Critique of the cycle-1 result

| # | Room | Sev | Finding |
|---|---|---|---|
| R1 | Reception | major | The 63 px marble desk read as a side table in a 10×10 lobby; no front-desk presence. |
| R2 | Reception | major | The back wall behind the desk was plain white; the WHITEHAT sign floated with no feature behind it. |
| R3 | Reception | major | Middle and right floor empty; waiting area crammed into the SW with the receptionist floating mid-room. |
| R4 | Reception | minor | Plaque and sign sat over the desk span, so the plaque could not be kept in 32 px reach once the desk grew. |
| C1 | Conference | major | Bare middle-left floor; the table floated on plain carpet. |
| C2 | Conference | minor | Brown leather chairs on the north side, black swivels on the south: mismatched set. |
| C3 | Conference | minor | Pale wooden sideboard with a water jug looked like the hospital set, not a slick boardroom. |
| S1 | Server | major | Pine-topped desks (desk1/desk3) looked cheap against slate walls and racks. |
| S2 | Server | minor | Air-con dropped in cycle 1; east floor by the door bare. |
| E1 | CEO | minor | East wall bare; nothing on the east floor between the fig and the filing cabinet that said ego. |
| D1 | Danny | major | Middle and south floor empty; one camp bed did not sell "he has been living here". |
| D2 | Danny | minor | No overflow or neglect: tidy shelves, no clutter. |
| H1 | Halls | major | Both corridors used the shared purple `hall_1x2gu` with floor bags, a safe and a key decal: the look broke between every room. |
| X1 | Assets | minor | `exec_laptop1` registered but unused. |

Counts: 7 major, 7 minor, 0 blocker.

### Fixes

**Reception** (R1-R4): a long black reception counter with a cyan light strip (PixelLab, lengthened from 62 to 110 px by repeating its plainest columns, no scaling) under a walnut slat feature wall painted into `room_zds_lobby` (x 98-222), with the WHITEHAT sign on the slats; the plaque moved to x 70 by the N door, clear of the counter and in reach; the trophy cabinet moved east under the CCTV; the threat-map screen moved to the corridor. Waiting area along the south edge: the sofa faces a glass table with a black club chair either side facing in (one PixelLab chair and its mirror), concrete planters with figs in both south corners, a brochure rack by the west wall under the directory.

**Conference room** (C1-C3): new floor sheet `room_zds_boardroom` with a charcoal rug and cyan inner line under the table and chairs; three matching black leather executive chairs on the north side; a black credenza with a phone and an orchid replaces the wooden sideboard; a fig in a concrete planter on the west side; a conference phone and `exec_laptop1` (X1, now used) on the table; the walnut table got a faint grain.

**Server room** (S1-S2): steel-topped `zds_desk1` / `zds_desk3` (recolours in `make_zds_props.py`; the PC tower keeps its colours) for the operator desk and the ops bench; a precision air-con unit beside the KVM cart, west of the door lane.

**CEO office** (E1): a floor globe on a walnut stand east of the desk (the fig went); her business-magazine cover framed on the east wall.

**Danny's office** (D1-D2): pizza boxes and energy-drink cans by the camp bed, a mini fridge by the side table, a cluster of coffee cups on his desk, a dying plant on the side table, a pile of books by the bookcase, a tangle of leads under the desk's end.

**Halls** (H1): new builder room `room_zds_hall` (10×6, sheet `room_zds_hall`: the lobby stone without decals), used by `main_hallway` and `executive_wing_hallway`. Back wall only, because the rooms to the south cover all but y 64-128: the threat-map screen, the WHITEHAT sign, a fire point, a water cooler, a fig in a concrete planter; the NE door corner and both side-door rows clear; the night guard's patrol (y 96-128) clear of the wall pieces. Registered in `game.js`, the schema and the README.

Scenario edits this cycle: the two hallway `type`s only (`hall_1x2gu` → `room_zds_hall`), each region re-read just before the edit. No NPC fields touched.

### New assets (cycle 2)

PixelLab, two calls (balance 3230 → 3202 reported; shared account):
- batch 3 (canvas 64): `reception_counter1` (lengthened by hand), `club_chair_e1` (+ mirrored `club_chair_w1`), `credenza1`, `floor_globe1`, `exec_chair_black1`, `planter_fig1`, `brochure_rack1`
- batch 4 (canvas 32): `pizza_boxes1`, `energy_cans1`, `mini_fridge1`, `magazine_cover1`, `wilted_plant1`, `coffee_cups1`, `cable_tangle1`, `book_pile1`

Hand-made: `zds_desk1`, `zds_desk3` (steel recolours), the walnut grain on `zds_conference_table1`, sheets `room_zds_boardroom` and `room_zds_hall`, the slat wall in `room_zds_lobby`.

Caught and fixed while checking: `coffee_cups1` was first installed from the wrong contact-sheet frame (a mini whiteboard on an easel; the sheet's numbers sit above their images); reinstalled from the right frame and its size corrected in the catalogue, `objects_hospital_extras.tsx` and `tilesets_ref.json`. The hall's CCTV camera was hidden behind the planter and was removed.

### Verify

- `generate_rooms.py` for all six ZDS rooms: OK; remaining WARN lines are the generic corner and bottom-row hints (no door in those corners, nothing to the south of reception, conference or Danny's office), the deliberate wall safe, and the drawer overlay.
- `slot_audit.py --notes`: 0 problems; the one notes prompt left is the Server Room Whiteboard (engine change not approved, stays a notebook page).
- `check_room_walls.py --scenario`: all maps 64. `validate_scenario.rb --skip-ink --no-graph`: schema passes, geometry OK, door alignment OK. `check_door_alignment.py`: all OK. `node --check` game.js: OK.
- In game (fresh games of my own on :3001): all 16 scenario objects claimed their intended sprites at the same positions as cycle 1; no "No Tiled item found" logs, no errors in the session logs. NPCs forced visible for the shots; the night guard walks clear of the hall's water cooler and planter.

After shots (`build_evidence/dressing_c2/`): `reception_lobby.png`, `conference_room_01.png`, `server_room.png`, `executive_office.png`, `danny_office.png`, `main_hallway.png`, `executive_wing_hallway.png`; maps `grid-room_zds_*.png`, `grid-contact_sheet.png`.

### Cycle 3: what to do next

1. Fold in the Sonnet interaction-walk findings (cycle-1 item 1).
2. The WHITEHAT sign now appears three times (reception and both halls, which share a map). Give the executive wing its own variant (`room_zds_hall_exec`: art, a bench, a "PRIVATE" sign, no brand sign) so it reads as the quieter end of the building.
3. Reception: the counter's monitor faces the visitor side; check it reads right next to the receptionist. A rug or a darker stone border round the waiting area would anchor it.
4. Server room: the room is busy but still generic; a caged rack or a red-lit "PRODUCTION / DO NOT TOUCH" label on the back row would mark it as the business. Re-check under the lighting pass.
5. CEO office: the rug sits a touch low under the desk; try moving it up 8 px.
6. Danny's office: the floor between his desk and the camp bed is still open; a small rug or a second chair would help. Re-check his spot after the dialogue renames.

### Assumptions (cycle 2)

- Assumption: repeating a single plain column to lengthen the counter is not rescaling (no pixel is resampled), so it is within the no-resize rule.
- Assumption: mirroring the club chair for the facing pair is acceptable art reuse, the same as other mirrored variants in the set.
- Assumption: one hall map for both corridors is fine for this cycle; a separate executive-wing hall is in cycle 3.

## Cycle 3 (2026-10-12)

Inputs: the Sonnet interaction walk (`PASS2_REGRESSION_B2.md`: no blockers, every object in the new rooms works; F-1 to F-3 are dressing findings) and a fresh look at the cycle-2 after shots. The NPC renames had landed (receptionist `ffion_rees`, guard `terry_mott`); only Ffion's `position` was touched.

### Critique

| # | Room | Sev | Finding | Source |
|---|---|---|---|---|
| F-1 | Reception | major | The founding plaque (x 70) was 22 px from the N door's tap point: standing at the door raised a Plaque / Door pick-one menu that blocked leaving. | B2 |
| F-2 | CEO | major | A visitor chair was 18 px from the Desk Drawer (which holds the drive) and joined its pick-one menu. | B2 |
| F-3 | Conference, CEO | minor | The swivel chairs (`chair-exec-rotate5`) are tappable (`rooms.js` marks every `*-rotateN` sprite as an interactable swivel chair) but do nothing, and fed the Presentation Materials menu too. | B2 |
| H2 | Exec hall | major | Both corridors shared one map, so the WHITEHAT sign appeared three times; the executive wing read the same as the public corridor. | own |
| R5 | Reception | minor | The waiting area floated on bare stone; the trophy cabinet overlapped the slat wall's edge once the plaque had to move. | own |
| S3 | Server | major | Nothing on the floor said "this row is the product"; the racks read as any company's IT. | own |
| E2 | CEO | minor | The rug sat low: the desk stood at its top edge. | own |
| D3 | Danny | minor | Open floor between the desk and the camp bed; his "living space" had no edge. | own |

Counts: 4 major, 4 minor.

### Fixes

- **F-1:** plaque moved to x 230 on the back wall east of the slat wall (top-left 230,35): 180 px from the N door, clear of the counter, reachable from the floor in front of it. The trophy cabinet moved to the door side (x 66, decor, never tappable); the slat wall and counter shifted 7-12 px east to make room (slats x 110-224, counter x 112-222). Ffion moved (7.1, 4.9) → (7.5, 4.9) so she stays clear of the counter's end.
- **F-2/F-3:** new static sprite `exec_chair_back1`, a pixel copy of `chair-exec-rotate5` whose name does not match `-rotateN`, so it is plain decor. Used for both CEO visitor chairs and both south-side boardroom chairs. In game, after the change, the only interactable objects in the five rooms are the 16 scenario objects (checked by dumping `interactable` for every object). The wheeled `chair-grey-1` (Danny) and `chair-darkgray-1` (server) were already not interactable and stay pushable.
- **H2:** new builder room `room_zds_hall_exec` for `executive_wing_hallway`: carpet (`room_zds_carpet`), two framed prints and a clock, a fire point, a planter, and a hand-drawn PRIVATE plate beside the CEO's door; no brand sign. `main_hallway` keeps `room_zds_hall`. Registered in `game.js`, the schema and the README.
- **R5:** charcoal rug with the cyan inner line painted under the waiting area (`room_zds_lobby`, x 82-238, y 232-308).
- **S3:** a yellow and black hazard line painted round the middle (production) rack row on the raised floor (`room_zds_raised`, x 28-194, y 112-190), and a hand-drawn red RESTRICTED sign on the west wall at the row's end. Physical light sources already placed for the lighting stage: the marketplace board, the threat map (corridor), the racks, the VM terminal and the reception counter's cyan strip.
- **E2:** rug moved up 8 px (`room_zds_exec`, y 92-206).
- **D3:** new sheet `room_zds_office_floor` (carpet with a worn oatmeal rug, x 112-264, y 208-296) under the camp bed, cans and pizza boxes. First painted grey-green and too bright; toned down after the in-game look.

Scenario edits: `executive_wing_hallway` `type` → `room_zds_hall_exec`; `ffion_rees` `position` only. Each region re-read just before the edit.

### Assets (cycle 3)

No PixelLab this cycle (I made no calls; the shared balance reads 3192, down from 3202, from other agents). Hand-made: `exec_chair_back1` (static copy), `private_sign1`, `restricted_sign1`; sheet `room_zds_office_floor`; decals in `room_zds_lobby` (rug, slats moved), `room_zds_exec` (rug moved), `room_zds_raised` (hazard line).

### Verify

- `generate_rooms.py`: OK for all seven ZDS rooms. `slot_audit.py --notes`: 0 problems (the Server Room Whiteboard prompt stays; engine change not approved).
- `check_room_walls.py --scenario`: all 64. `validate_scenario.rb --skip-ink --no-graph`: schema passes, geometry and door alignment OK. `node --check` game.js: OK.
- In game (fresh games of my own on :3001): all 16 scenario objects on their intended sprites; the plaque at 230,35; no decor object interactable; no "No Tiled item found" logs.
- Not re-walked by a tester: the plaque menu at the door and the drawer menu (both fixed by geometry and by removing the interactable chairs; a short Sonnet check would confirm).

After shots (`build_evidence/dressing_c3/`): `reception_lobby.png`, `conference_room_01.png`, `server_room.png`, `executive_office.png`, `danny_office.png`, `main_hallway.png`, `executive_wing_hallway.png`; maps `grid-room_zds_*.png`, `grid-contact_sheet.png`.

### Cycle 4: what to do next

1. A short Sonnet re-walk: stand at the lobby exit (no menu), tap the CEO drawer and the Presentation Materials (no menu), and tap the plaque from the floor in front of it.
2. Conference room: the north-east quarter (Victoria's floor and the E door lane) is clean but plain; a wall-mounted speaker or a second screen on the east wall strip, and a glass water carafe on the credenza.
3. Server room: the east half above the operator desk is empty floor under the whiteboard (kept clear for reading); consider a floor-standing "PRODUCTION" rack label or LED strip along the back row's plinth, to give lighting something to catch.
4. CEO office: a pair of floor lamps either side of the sofa would give the lighting pass warm sources.
5. Danny's office: a desk lamp (his only light at night, for the "sitting in the dark" scene) and a second, cheaper visitor chair.
6. Reception: the counter's top items (phone, pens) are tiny; a visitor sign-in tablet or a bowl of branded USB sticks (a sly joke for a security front) would read better.

### Assumptions (cycle 3)

- Assumption: a pixel-identical copy of the swivel chair under a non-`-rotateN` name is the cleanest way to make it decor; changing `rooms.js` to skip swivel behaviour for certain placements would be an engine change.
- Assumption: Ffion standing 13 px further east is still "at her desk" for the ink; nothing reads her position.
- Assumption: a hazard line on the raised floor is a fair "restricted production row" marker in a server room and not too heavy; it can be dimmed by the lighting pass if it dominates.

## Cycle 4 (2026-10-12)

Inputs: the coordinator's notes on the cycle-3 contact sheet, my cycle-3 list (items 2-6) and a fresh look at the cycle-3 after shots. The re-walk (cycle-3 item 1) is with a Sonnet tester and feeds cycle 5.

### Critique

| # | Room | Sev | Finding | Source |
|---|---|---|---|---|
| D4 | Danny | major | The rug was a third of the room, flat and grey-green: it read as a gym mat or a hole in the floor. | coordinator |
| H3 | Exec hall | major | Bare carpet: nothing said people walk through it. | coordinator |
| S4 | Server | minor | The red "!" RESTRICTED sign looked cartoonish beside the realistic racks. | coordinator |
| C4 | Conference | minor | East wall strip empty; nothing that runs the room's AV. | own |
| E3 | CEO | minor | No light source of its own beyond the desk lamp, for the lighting pass. | own |
| D5 | Danny | minor | No light of his own for the night "sitting in the dark" scene. | own |
| R6 | Reception | minor | The counter-top props (phone, pens) were tiny and said nothing about the firm. | own |
| M1 | Main hall | optional | A little sparse. | coordinator |

Counts: 2 major, 5 minor, 1 optional.

### Fixes

- **D4:** a small warm kilim instead (`paint_rug_worn` in `make_zds_tileset.py`): 88×56 px under the camp bed only (x 182-270, y 230-286), terracotta field with a cream diamond row, a dark red border with cream ticks, a cream fringe on the short ends and a paler worn patch at the bed end. Pizza boxes and cans sit on it.
- **H3:** new sheet `room_zds_hall_exec` with a burgundy runner (gold lines) down the corridor at y 82-114, wall to wall through the W and E doors; a black console table (`credenza1`) against the back wall; the clock, a print, the fire point, the planter and the PRIVATE plate rearranged around it. The night guard walks the runner, clear of the console (feet 78).
- **S4:** `restricted_sign1` redrawn as a proper plate in the PRIVATE plate's style (45×9, white border, red field, white RESTRICTED lettering), now on the back wall under the marketplace board (x 163, feet 59) instead of on the west wall. Same asset name, so nothing is left over; its size was corrected in the catalogue, `objects_hospital_extras.tsx` and `tilesets_ref.json`.
- **C4:** an AV and lighting control panel (`power_panel1`) on the east wall below the door row.
- **E3:** tried a pair of `lamp-stand5` floor lamps either side of the desk; they read as garden or street lamps (the skill's theme-fit list bans those), so I took them out. The CEO's lit sources for the lighting pass are her desk lamp (on the desk sprite), the drinks cabinet and the trophy cabinet.
- **D5:** a desk lamp (`office-misc-lamp4`) at the left end of Danny's desk, away from the PC and photo.
- **R6:** the pens swapped for `usb_bowl1`, a hand-drawn bowl of branded USB sticks (cyan, black, white) on the counter: a security front handing out free USB sticks.
- **M1:** left as is. Its floor is the main walking route (S, N, W and E doors), so anything free-standing would get in the way.

No scenario edits this cycle.

### Assets (cycle 4)

No PixelLab calls. Hand-made: `usb_bowl1`; `restricted_sign1` redrawn; sheets `room_zds_hall_exec` (new) and `room_zds_office_floor` (repainted).

### Verify

- `generate_rooms.py`: OK for the six rooms changed. `slot_audit.py --notes`: 0 problems. `check_room_walls.py --scenario`: all 64. `validate_scenario.rb --skip-ink --no-graph`: schema passes, geometry and door alignment OK. `node --check` game.js: OK.
- In game (fresh games of my own on :3001): exactly 16 interactable objects across the five rooms, all of them scenario objects on their intended sprites; no "No Tiled item found" logs.

After shots (`build_evidence/dressing_c4/`): `reception_lobby.png`, `conference_room_01.png`, `server_room.png`, `executive_office.png`, `danny_office.png`, `main_hallway.png`, `executive_wing_hallway.png`; maps `grid-room_zds_*.png`, `grid-contact_sheet.png`.

### Cycle 5 plan: polish and confirmation, after the lighting placements settle

1. Fold in the cycle-3 re-walk findings (plaque at the lobby exit, CEO drawer, Presentation Materials).
2. Wait for the lighting pass to name the light sources it wants (screens, desk lamps, the counter strip, rack LEDs) and add or move physical fixtures only where it asks; re-shoot every room lit and dark.
3. Re-check NPC spots against the final dialogue (Ffion, Danny, Victoria) and the guard's patrol on the new runner.
4. Small polish from the cycle-4 shots: the RESTRICTED plate's lettering is tight at game scale (try a 46×10 plate with one more pixel of padding); Danny's book pile floats mid-floor and could sit against the bookcase; the conference credenza and the exec-hall console use the same sprite, which is fine but could take a second item each.
5. Final confirmation: slot audit, validator, door alignment, a short Sonnet walk of every door and object, then hand over to the POV-background stage with the final layout.

### Assumptions (cycle 4)

- Assumption: the burgundy runner and the kilim are warm enough to read as rugs at game scale without new PixelLab art; both are painted into the floor sheets, so they draw under every sprite.
- Assumption: the CEO office has enough light sources for the lighting stage without floor lamps; the lighting brief can ask for one if it wants.

## Cycle 5 (2026-10-12): polish and confirmation

Inputs: the cycle-3 re-walk (`PASS2_REWALK_C3.md`: F-1 to F-3 hold; carried R-2 and observation R-4), my cycle-4 polish list, the final NPC positions after the dialogue renames, and day and night tours with the lighting in (`lighting-tour.sh --close-intro --check`, night with `--globals clone_call_done=true,mission_phase=act2_infiltration --show-npc danny_foster,terry_mott`). The lighting stage asked for no new fixtures.

### Findings and fixes

| # | Sev | Finding | Outcome |
|---|---|---|---|
| R-2 | minor | Building Directory reachable only at 31.3 px in the re-walk. A probe in game showed the harness had stopped at the range edge: against the west wall the player gets to 13 px, but approaching from y 150 it was 33 px (out of range). | Fixed: directory lowered to feet 146 (top-left 14,131), centred on the walk-up line. Re-probed: in range (12-31 px) for any approach between y 104 and y 160, best 12 px. |
| R-4 | obs | Danny's PC and the Family Photo 26 px apart. | Fixed: PC moved to 0.28 along the desk, a few more px from the photo. No menu was seen before either. |
| P1 | minor | RESTRICTED plate lettering tight. | Fixed: plate redrawn at 47×11 with a pixel of padding above and below; registries updated (catalogue, `.tsx`, `tilesets_ref.json`). |
| P2 | minor | Danny's book pile floated mid-floor. | Fixed: stacked against the wall under his whiteboard (x 96, feet 82). |
| P3 | minor | Boardroom credenza and corridor console were the same sprite. | Fixed: the executive corridor now has the walnut `sideboard1` (water and glasses); the boardroom keeps the black credenza. |
| N1 | minor | Terry's patrol waypoints (x 80-208, feet 84-116) stood him on the corridor planter at night. | Fixed: planter removed from the executive corridor (the main hall keeps one); he walks the runner in front of the wall pieces with his torch. |

NPC spots against the final dialogue: Ffion (7.5, 4.9) is at the counter's end, still behind it at night per her late-night line; Victoria (5, 4) by the whiteboard, lit at night as the story says; Danny (6.5, 4) stands in the dark mid-room at night with his desk lamp the only light (the ink has him "sitting in the dark with his coat on"; a seated pose is the character pipeline's call, not layout). Terry's patrol is clear of everything. No positions changed this cycle.

Night shots read correctly as layout: the counter's cyan strip and slat-wall accent light reception, the racks and marketplace board carry the server room, the RESTRICTED plate is legible in their glow, the CEO's desk lamp, drinks and trophy cabinets carry her office, Danny's lamp pools on his desk, the threat map lights the main corridor. Nothing placed reads wrong in the dark.

Scenario edits this cycle: none.

### Verify (final)

- `slot_audit.py --verbose --notes`: 16 objects ok, 0 problems; one notes prompt left (Server Room Whiteboard, engine change not approved; stays a notebook page).
- `validate_scenario.rb --skip-ink --no-graph`: schema passes, geometry OK, door alignment OK. `check_door_alignment.py`: 6 of 6 connections OK. `check_room_walls.py --scenario`: every map 64. `generate_rooms.py --check` on all seven ZDS maps: OK. `node --check` game.js: OK.
- In game: exactly 16 interactable objects, all scenario objects on their intended sprites; no "No Tiled item found" logs.

Shots (`build_evidence/dressing_c5/`): `day/` and `night/` for all seven rooms (`reception_lobby`, `conference_room_01`, `server_room`, `executive_office`, `danny_office`, `main_hallway`, `executive_wing_hallway`), `day_sheet.png`, `night_sheet.png`, maps `grid-room_zds_*.png`, `grid-contact_sheet.png`.

### Status

The layout is final for the POV-background stage. Open items, none of which moves furniture: the Server Room Whiteboard read-in-place (engine change, not approved), and F-4 dialog titles ("Enter PIN for item", engine wording).

### Assumptions (cycle 5)

- Assumption: the directory probe's distance (player position offset 16 px in the facing direction, to the sprite's top-left) matches the engine's `getInteractionDistance`; I copied the formula rather than calling it.
- Assumption: Danny standing rather than sitting at night is a sprite question for the character pipeline, not a layout one.
