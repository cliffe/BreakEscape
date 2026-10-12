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
