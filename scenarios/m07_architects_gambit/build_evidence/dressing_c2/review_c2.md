# m07 room dressing review, cycle 2 (read-only)

Sources: the six `room_pnw_*` builders (`scripts/generate_rooms.py` 4324-4570), the generated maps `public/break_escape/assets/rooms/room_pnw_*.json` (bounds dumped to the scratch file `objs.txt`), `slot_audit.py --verbose --notes` (0 problems, 0 notes prompts; every object on its intended sprite), the in-game shots `build_evidence/dressing_c1/after/*-a.png`, the grid previews `build_evidence/dressing_c1/grid/*.png`, and the tap rule in `public/break_escape/js/core/game.js:2096-2125` (bounds contain the tap, or within 32 px (TILE_SIZE) of `obj.x,y`, which is the top-left because `rooms.js:2459` sets origin 0,0; `chair-*` sprites except `chair-waiting` are rolling chairs, `rooms.js:2471`). The pairwise tap check (`taps.py` in scratch) samples every pixel of each sprite and counts how many also hit the other object.

Geometry checks that pass in every room: back-wall hangings sit within y 12-59, side-wall items within x 12-30 and 290-308, nothing sits in the bottom rows a southern neighbour covers (server feet at most 248, generator hall west half at most 226, SCADA at most 124), door mouths are clear apart from the SCADA chair (m5 below), and no counter, desk, rack or shelving is drawn at an angle (the only angled pieces are the ops floor's pushed-back `aes_office_chair1` and the vault's step-ladder).

## Findings

### Majors

**M1. SCADA: the countdown display sits behind Mercer, which hides its text and shares his taps.**
`pnw_countdown1` is at x 206-282, y 24-56 (`generate_rooms.py:4471`). Mercer's measured box is x 212-236, y 40-90, so his head and shoulders cover the left half of the "AWAITING HOST" line and two of the four step lamps (`after/scada_control-a.png`: it reads "ITING HOST"). By the tap rule, 37% of the display's area also picks up Mercer and 33% of Mercer's sprite also picks up the display. The display's centre (244,40) is 32.0 px from Mercer's centre, right on the tap radius, so a tap in the middle of the display opens a pick-one menu or not depending on a pixel or two of how he is standing. This is a readable object next to the boss NPC.
Fix (prop moves only; Mercer's tile stays): (a) the cleanest: put the countdown on the back wall above the operator console at about x 30-106 (the console's monitors cover only its bottom 5 px), and move `pnw_scada_sign1` east to about x 214-281, y 13-30, where Mercer may cover a decor sign without harm. Or (b) shift the countdown as far east as the corner bevel allows (x about 212-288; check with `--check`). That takes the centre to about 38 px from Mercer but still leaves a 24×16 overlap. Option (a) gives up the "clock behind the villain" staging in the docstring; that line is not in the scenario text (erb 1945).

**M2. SCADA: the master control position is the same beige wooden office desk as the ops supervisor's.**
`master = r.table("desk1", 112.0, 104.0)` (`generate_rooms.py:4473`) and `sup = r.table("desk1", 118.0, 298.0)` (4403) use the same light-wood desk with a drawer pedestal. In `after/scada_control-a.png` the win-condition object ("The master control position for 147 substations", erb 1918) sits on what reads as an office table beside a black operator console (`pnw_console2`, also on the ops floor). This is the climax room, and its centrepiece is the least utility-like piece of furniture in the building.
Fix: give the master position a dark steel control desk the same size as `desk1` (78×39, so the slot fractions still work). For example, a hand-drawn palette swap of `desk1` to the consoles' charcoal with an amber edge strip, registered as `pnw_master_desk1`. That is a recolour, not a rescale, so it's free. Keep `desk1` for the supervisor only.

**M3. Server hall: Elena is described "working a rack terminal with her back to the door", but she stands on open floor with nothing to work at.**
erb 1721 (observation) and erb 1707 (position 3,7.5). Her box is x 84-108, y 184-234. The nearest kit is the VM desk 22 px east and the middle rack row 50 px north-east (`after/server_room-a.png`). She faces the camera and nothing is in front of her. The skill says to move the prop, not the NPC.
Fix: add `kvm_cart1` (37×61, a steel cart with a monitor and keyboard; already in the catalog and not a swivel prop) pulled up to the west end of the middle rack row, about x 110, feet 200 (x 110-147, y 139-200). She then stands at its west side, side-on to the W door. It is decor, so it adds no tap candidates. Check that the VM desk (x 130-181, top 209) is still reachable from the south and west, and that the west lane x 32-76 stays clear.

### Minors

**m1. Ops floor: the plant key's tap area overlaps a rolling chair, and the supervisor's chair half-hangs off the dais.**
Back-row chair E `chair-grey-1` is at x 124-148, y 220-258 (`generate_rooms.py:4400`). The key is at x 123-135, y 254-275 (4404), so their bounds overlap at y 254-258. 19% of the key's area also picks up the chair, and tapping (kicking) chair E offers the key on 85% of the chair, including its centre. The supervisor's `chair-grey-2` at x 92-117, y 267-304 (4408) has its top-left 31 px from the key's left edge, so 7% of the key also hits it. It also straddles the dais's west edge (x 96) in `grid/room_pnw_ops.png`. The back-row chairs E and F sit on the dais's amber nosing (chair feet at 258, dais from about 248).
Fix: drop the supervisor's desk 8 px (feet 306, top 267; the key's top moves to about 262, which clears chair E and leaves 42 px to its top-left). Replace the rolling `chair-grey-2` with a static, non-`chair-` seat (a second `aes_office_chair1` is allowed as the room's second angled piece) placed fully on the dais west of the desk. Static seats are not tap candidates.

**m2. Ops floor: the handover sheet is "under the plant key's fob" (erb 1667), but it lies 55 px away at the other end of the desk** (key at frac 0.14, notes3 at 0.86, `generate_rooms.py:4404/4407`). The skill lets pairs that belong together share a menu. Either put the sheet beside the key (about frac 0.26) and accept a two-item menu for the pair, or have the scenario owner reword the observation to "in the tray at the end of the desk". The second is a text change outside this pass's remit.

**m3. Ops floor: there is little sign of a mid-evacuation.** Five of six operator chairs are tucked neatly into their desks (`chair-grey-1` at feet 178/258), the consoles are tidy apart from papers baked into `pnw_console2`, and position 3's "coffee still warm" (erb 1680) has no cup. Cheap additions, all decor:
- pull two chairs straight back 10-14 px (no extra angles);
- put `dirty_mugs1` or `office-misc-cup` on position 3 (it's in the items layer, so place an items-layer cup at its right end) and on one other console;
- add `coat_stand1` by the W door with nothing on it;
- scatter paper using a sprite whose base name is not `notes`. A decor `notes*` sprite in `items` would be claimed by the Shift Handover Sheet before its `conditional_table_items` slot, because `items` is searched first.

**m4. Ops floor: the "wall-sized situation board" (erb 1646) covers 128 of the roughly 256 px of back wall** (`pnw_video_wall1` x 116-244, `generate_rooms.py:4386`). The paper map beside it ("ten feet wide") is 72 px. For the signature room a video wall that spans most of the back wall would read more like a real control centre. Move the map to the west wall's gap or shrink it to a hand-drawn 40 px panel, and extend the video wall (regenerated at the new width, never resized). Optional; the room already works.

**m5. SCADA: the operator chair stands in the walk-in band from the door.** `chair-grey-1` at x 60-84, y 86-124 (`generate_rooms.py:4476`). The docstring says y 104-128 runs clear from the SW door (x 32-64) to Mercer. The chair occupies x 60-84 of that band and is a rolling chair, so the player will bump it on the way in. Tuck it in to feet about 112, or move it to x 72-96.

**m6. SCADA: the right third of the Cascade Control monitor picks up the casualty projection.** `scada_historian` x 114.5-162.5, y 36.5-84.5 and `notes3` top-left 175.2,70.4 (`generate_rooms.py:4474-4475`). 29% of the monitor's area also gathers the projection. The centre tap is clean (38 px). Move notes3 to frac 0.97 (top-left about 186) or the historian to frac 0.28. Either clears it, and the projection stays "beside Mercer".

**m7. SCADA: the 48 px historian monitor covers the middle of the PNW 147 mimic** (mimic x 106-202, y 22-52; monitor x 114-162 from y 36; `after/scada_control-a.png`). Screens in front of a mimic are realistic, so this is optional. If M2's rework moves the desk, centre the mimic over the gap between the console and the desk.

**m8. Server hall: the cabling survey note reads as lying on the floor at the rack's foot.** `notes_clip1` y 82-96 (`generate_rooms.py:4440`) ends 2 px below rack 4's feet (94). In `after/server_room-a.png` the clipboard sits on the floor line. "Clipped to the rack door" (erb 1850): raise it to feet about 82 (y 68-82), mid-door. No other interactable is within reach of it.

**m9. Server hall: the perforated cold-aisle tiles are under the middle rack row, not in front of it.** The dotted row shows only at x 36-110, y 130-165 (`grid/room_pnw_servers.png`); the racks at x 112-262, y 115-170 stand on the rest. Repaint the perforated row in `make_pnw_tileset.py` along y 172-204 for x 112-288, in front of the racks' faces.

**m10. Checkpoint: the badge station is a consumer all-in-one PC with a mountain wallpaper, and there is no output tray.** `pc5` (`generate_rooms.py:4349`). The observation (erb 1571) has "a badge already sitting in the output tray, printed and never collected". Put a small card printer beside it (hand-drawn, about 16×12, decor in `table_items` at frac about 0.33). The phone at 0.44 may need to move to 0.50 to make room. Ideally swap pc5 for a darker workstation sprite.

**m11. Checkpoint: the west half of the room is bare, and the water cooler repeats the one next door.** x 32-90, y 140-240 is empty terrazzo (`grid/room_pnw_checkpoint.png`). Hollis patrols x 96-224, so this strip is free. Two `chair-waiting-right-1` seats facing east against the west wall below the extinguisher (feet about 220 and 252) would give the room a visitor wait area; waiting chairs are not tap candidates. `water_cooler1` (4353) also stands in the ops floor's SW corner. Swap the checkpoint's for something a guard post has, such as a key cabinet or `coat_stand1`.

**m12. Checkpoint: the screening lane is parked against the south wall.** `pnw_arch1` feet 300 (4358) has its walk-through axis running north-south into the wall, so nobody could pass through it. It reads at game scale as a screening area, so this is low priority. If you keep it, add `aes_barrier1` or a stanchion at the lane's east end, so it reads as closed for the night rather than mis-placed.

**m13. Checkpoint: the muster sign reads "MUSTER / N LOT"** (`pnw_muster_sign1`, 4344; `after/security_checkpoint-a.png`). "N LOT" looks like a typo at 1x. Redraw it as "MUSTER / NORTH LOT" (the key's observation, erb 1633, says "north parking lot").

**m14. Generator hall: the plant log's right edge picks up the genset panel.** `notes_plantlog1` x 142-158 (4504) and `pnw_genset_panel1` top-left 186,46: 19% of the log's area gathers the panel. Move the log to x 138 (centre 146,43, which is 40 px from the panel's top-left; 4 px gap to the ATS, whose top-left is then 38 px from the log's nearest edge). It stays "beside the transfer switch".

**m15. Generator hall: the ATS shows no sign that "somebody has already had the cover off"** (erb 2007). `pnw_ats1` is a closed cabinet with a display and keypad (4503). Lean a loose cover plate against the wall inside the hatched box, east of the ATS (hand-drawn, about 14×30), with a screw tin on the floor. It is a cheap detail that shows tension and points at the plate.

**m16. Generator hall: the "steel bench" is the server hall's office desk.** `zds_desk1` (4523) is also the server hall's relay desk (4447). `it_workbench1` (60×58, a steel bench with a lower shelf) exists and suits a plant room. Keep the radio charger and cup on it.

**m17. Cable vault: the Tomb Gamma printout lies on the trench lid, but the text says "stuffed behind the splice housing"** (erb 2117; `notes3` at x 128-142, y 67-78, `generate_rooms.py:4559`; `after/cable_vault-a.png`). Either tuck it on the wall poking out from the splice's east side (about x 182-196, feet 52) and accept a shared menu with the splice (a paper wedged behind a fixture belongs with it, as the skill allows), or reword the observation to "on the trench lid at the foot of the splice". Moving it also removes Park's head-tap overlap with it (12% of Park's sprite now picks up the printout).

**m18. Cable vault: Park is "crouched over the trunk runs" (erb 2086), but the runs are on the wall above his head and the trench is sealed.** Paint one lifted chequer plate in `make_pnw_tileset.py`, with exposed black cables in the trench at about x 128-176, y 66-88, just north of his feet at (144,138). Ring it with `aes_cones1` or `aes_barrier1` at x about 176-200. This also fills the room a little: x 230-290, y 120-180 and x 32-80, y 112-180 are bare.

**m19. Cable vault: the junction box is the generator hall's back-wall sprite, standing free near the south edge with its cable tails ending in the floor.** `pnw_junction_box1` at x 80-115, feet 176 (4565); the same image is at genhall x 436-471. Use a floor-standing piece instead, such as a cable trolley or a coiled cable, or drop it. The cable drum already fills the south.

## Does the operations floor work as the signature room?

Yes. It is the only room with a raised supervisor's dais, a red-ringed substation map and an amber video wall. The 2×3 console grid with a gangway reads as a control room at game scale, position 3's tag and pushed-back chair tell a story, and every scenario object is on a real fixture with clean centre taps. It differs clearly from the pale checkpoint and the teal server hall. Its weak spots are the ones in m1-m4: a small video wall for a "wall-sized" board, very little sign that the floor was emptied in a hurry, and a crowded join between the back row and the dais. None of these stops sign-off.

## Per-room verdict

| Room | Verdict | Open items |
|---|---|---|
| security_checkpoint | done (polish optional) | m10, m11, m12, m13 |
| operations_floor | done, with a short polish pass recommended | m1, m2, m3, m4 |
| server_room | needs another cycle | M3; m8, m9 |
| scada_control | needs another cycle | M1, M2; m5, m6, m7 |
| generator_room | done (polish optional) | m14, m15, m16 |
| cable_vault | needs another cycle (small) | m17, m18, m19 |

Overall: 0 blockers, 3 majors, 19 minors.

## Not raised (checked and fine)

Slot claims (0 problems); wall-face bounds; north-door corners and side-door rows (checkpoint E, ops W/E, server W, vault and genhall NW lanes); no item in any covered bottom row; no rack, desk, shelf or counter angled; Hollis's patrol strip, Elena's, Mercer's and Park's standing spots free of furniture overlap (except Mercer over the wall display, M1); every other scenario-slot pair and slot/chair pair outside the tap rule. The repainted walk-off mat in `grid/room_pnw_checkpoint.png` reads as a ribbed mat and no longer as a hole.

## Assumptions

- Assumption: the generated `room_pnw_*.json` maps match the current builders. I measured bounds from the JSON and did not regenerate anything.
- Assumption: rolling chairs' taps use the same top-left anchor as map slots. They are placed through the same `rooms.js` path with origin 0,0.
- Assumption: Mercer's tile (7,3) and Elena's (3,7.5) are fixed by the story, so every fix moves props. M1 option (a) gives up a staging choice stated in the builder docstring but not in the scenario text.
