# m09 room dressing: review, round 3

## Verdict

**One more round before lighting.** No blockers: every door, tap area and NPC route checked out in round 2, and nothing here stops play. But the seven majors change room sheets and furniture that the lighting renders and POV backgrounds will copy. The server closet has no east wall. The two cages don't read as cages. Sorensen doesn't stand at her shredder. The hatch counter reads as a plank. The open stacks is fourteen copies of one shelf, with a bare quarter. A short round 4 on these, then lighting.

Counts: 0 blocker, 7 major, 20 minor (two of the minors, F2 and V3, point at fixes listed under another room).

Reviewer: fresh, read-only. Nothing edited apart from this file; nothing committed.

## What I looked at

- Standards: `.claude/skills/mission-room-dressing/SKILL.md` (critique list, slots, tap areas, square-to-wall rule), `docs/agents/FINALE_BRIEF.md`, `ROOM_DRESSING.md` rounds 1–2, stage 5 `room_layout.md` §1–§3 and §8, `scripts/room_gen/m09_rooms.py`.
- Renders: `dressing_r2/maps/*.png`, `dressing_r2/ingame/*-a.png` (game 3081). A fresh `render_room_preview.py 'room_m09_*' --grid --scale 2` came out pixel-identical to `dressing_r2/maps/`, so those maps are current.
- Benchmark: a fresh contact sheet of m05's `room_qdc_*` maps. m05's back walls carry two or three fixtures each (boards, signs, clock, camera), and its furniture comes in groups with chairs facing their desks. Its repeated racks (server room) differ in colour and height. Against that, m09's front-of-house rooms (dock, front desk, office, tape room) are at the same level. The cages, the hub and the open stacks are thinner and more repetitive.
- Scenario NPC fields: Sorensen (3.6, 4.6), sorensen_hatch (8.25, 5.5), Noor (6.5, 5.5), Tran (3.3, 3.5), Old Coyote's round at y 7.5 and his override tile (2, 6.5), Lyle Dillard (`archive_guard`) at (3.5, 8). Spawn (7, 7.5).

Positions below are room pixels (x left edge, y feet) unless marked as tiles.

## Findings by room

### loading_dock (`room_m09_dock`)

Reads at a glance as a night dock yard: brick, shutters, bay lines, a hatched apron, pallets, a fence. The incident log is on the hut desk under the camera and the hi-vis hook, easy to find. The cones and the pallet truck are the only angled props. The spawn at (7, 7.5) is clear of everything.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| D1 | minor | back wall, BAY 2 shutter x 116–212 | The way in (the N door at x 32–64) draws as a white office door. The closed decor roller shutter next to it looks more like the way in. Players will tap the shutter first. Known engine-art item (R1 open 4). | Until the engine has shutter art, make the real door the obvious one: run the apron's hatching right up to the door's base (it starts at x 32, so this is close already). Add a small arrow plate (`m09_sign_bay1` is already at x 70) or a "STAFF / PERSONNEL" plate by the door. Leave the shutter as it is. |
| D2 | minor | open_stacks tile (3.5, 8), by the shutter | Lyle Dillard's spawn has his centre at y 256, which is the line where the dock's north wall covers the stacks' bottom two rows. Round 2 found that tiles outside y 2–8 get dropped from pathfinding, and 8 is the edge of that. He will probably draw across the dock's brick by the BAY 2 control box. | Check in the browser (`m01_maya_ko` save, after Tran is alerted). If he overlaps the wall, move him to (3.5, 7.5) or (2.5, 7), clear of the west crossing (scenario NPC field; say why in a comment). |

### front_desk (`room_m09_front`)

Reads as a records company's front office: wordmark, STAFF ONLY by the staff door, a terminal desk, the trolleys for the run. Noor stands on clear floor with the trolleys beside her, which is right for the story. The run sheet on the first trolley and the box by her desk are both visible.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| F1 | minor | public counter, x 56–212, y 250 | Two cream office desks end to end in the middle of the floor don't read as a public counter. Nothing is on the public side, so they look like a second staff desk. | Give the counter a public side: a bench or two `hospital_chair_north` on its south side (feet about y 290), a counter bell or a "PLEASE WAIT" plate on its top. Or swap the desks for a reception-counter sprite if the catalog has a plain one. Keep the water cooler where it is. |
| F2 | minor | all rooms | `desk1` (cream top) is used for Noor's desk, the counter, the hub's sorting table and Sorensen's desk. Four rooms share one desk. | Covered in O2 (office) and F1. Varying the counter alone is enough here. |

### open_stacks (`room_m09_stacks`)

It reads as a warehouse floor of client deposits, and the patrol band and cross aisle are clear (Old Coyote's lap passes the trolley, stool and pallet with room to spare). Two problems: the shelving is one sprite copied fourteen times, and the H&L bay label, the room's key clue, reads as something dropped on the floor.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| S1 | major | both shelf runs, x 100–532 | All 14 units are `supply_shelves1` with the same boxes in the same places, and the cage uses it twice more. Bays 10 and 11 are one unbroken run of five, so the BAY 10/BAY 11 plates divide nothing. At a glance it looks copy-pasted rather than like a records store. | Hand-draw two or three variants in `make_m09_props.py` at the same 50 px size (boxes moved around, one shelf half-empty, one with white archive boxes and number labels, one with a red RETAIN tag) and alternate them. Decor sprites with different image names won't hide each other. Leave a 12–16 px gap (an end-of-bay upright) between bay 10 and bay 11 at about x 250, under the plates. In the cage, use a variant with red-labelled SERIES R boxes (C4). |
| S2 | major | SE quarter, x 330–630, y 220–320 | The east half below the free-standing run is bare concrete apart from a floor vent: about a quarter of the room the player spends longest in. Nothing is south of the east half, so all of it shows. | Put a row of returns along the south wall's east half, outside the patrol band (his body reaches y 249): pallets of boxes or a wheeled roll cage at feet y 312–316, x 400–600. Add a "BAYS 13–20 →" floor arrow or a hatched forklift lane painted on the sheet. Keep x 548–608 at y 64–118 (E door) and the cross aisle clear. |
| S3 | minor | `m09_bay_label1` at (440, 104) | The label's foot is 4 px below the shelf's feet (y 100), across the yellow aisle line, so in game it reads as a card on the floor. This is the room's story object, the thing that makes the boxes findable. | Set its foot to y 94–96 so it sits on the bottom rail of bay 12's first unit. If it then reads small, give it a red border or a "RETENTION 25 YRS" second line on the plate. |
| S4 | minor | Old Coyote's `patrolOverride` (2, 6.5) | The stage 5 plan says the override puts him *beside* the reading-room door, never on it, so route B stays open. (2, 6.5) puts his centre at (64, 208): three tiles south of the W door's mouth (y 64–118), in the middle of the west crossing (x 32–100). From the shutter, the player would have to go round by the cross aisle. | Check route B in the browser on an `m01_maya_ko` save. If the crossing is blocked, move the target to about (3.5, 4.2): just south-east of the door's mouth at the end of the first aisle, clear of the lane (scenario field, story-owned; flag it to the orchestrator). |

### server_closet (`room_m09_closet`)

The props fit (rack, wipe schedule, degausser, terminal), but the room has no east wall.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| K1 | major | east edge x 128–160, south edge | **Tile-level: no east wall and no frame on the east or south.** The `room` layer is `[701..705], [711..715], … [751..755]`: columns 0–4 and rows 0–5 of the 10×10 sheet, the room's top-left corner only. The floor runs off the right and bottom edges in game (`server_closet-a.png`). Collision is still there (the `walls` layer has column 4), so it plays; it just looks unfinished. `check_room_walls.py` only reads the floor line, so it passes. | Build the room layer the way the shipped 5×6 rooms do (`small_room_1x1gu`, `room_hospital_storage_1x1gu` with `room_override`): take `TEMPLATES["5x6"]["room"]` (cells 1–4 and 10 on rows 0–3, then 41–44, 90 and 91–94, 100) and map it onto the m09 sheet's firstgid. Rows: `[701,702,703,704,710] [711,…,720] [721,…,730] [731,…,740] [741,742,743,744,790] [791,792,793,794,800]`. Re-render and re-check walls. |
| K2 | minor | Tran (3.3, 3.5), rack x 96–126 | Tran's sprite covers the bottom half of the rack, so he looks pasted onto it. With the east wall back the room is narrow, and it is thin: a rack, a box and two small machines. | After K1, add a slim UPS or patch-panel cabinet against the back wall west of the rack (x 66–94, clear of the W door mouth y 64–118: wall-standing, feet y 66–70). Hang a second sheet or a "NO FOOD OR DRINK" plate. Tran's position is story-set; leave him. |

### staff_passage (`room_m09_passage`)

Reads as a staff corridor: noticeboard, hi-vis and lanyards on hooks, the rota, a water cooler, the card reader by the S door. Both lanes are clear (the cooler stops at about x 250, right at the N lane's edge, and isn't in the way in game). No findings.

### reading_room (`room_m09_reading`)

Much better than round 1: five interactables on two rows, none sharing a menu, and the wall screen can be reached. It still reads as a small office with a green wall rather than a reading room.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| R1 | minor | `hospital_chair2` at (146, 126) | The chair is on the east side of the case-file table, and `chair2` faces east, so it has its back to the table. | Use `hospital_chair1` (faces W). |
| R2 | minor | whole room | No library furniture: no bookcase, card catalogue or reading lamp row. The "only warm room" is carried by the floor and wall colour alone. | Swap the notebook's small desk (`smalldesk2` at x 78) for a wooden card-catalogue cabinet with the notebook on top, if the catalog has one; or hand-draw one at 32 px. Or hang a framed county map / "SILENCE PLEASE" plate on the back wall between the sign and the desk. Don't add floor furniture: the rows are full. |
| R3 | minor | `field_laptop` (vm-launcher) | The "field laptop" is the pink desktop PC from the `vm-launcher` art. SAFETYNET's field kit reads as a home computer. Same in the salvage cage (V3). | Give `field_laptop` and `field_kit_link` `"sprite": "laptop1"` (or `exec_laptop1`). The engine supports a sprite key on a vm-launcher (`rooms.js:520`; m01 uses `vm-launcher-kali`). The laptop is about the same size as the 28×23 slot, so it won't hang down. Check it in game. |

### restricted_stacks (`room_m09_restricted`, the hub)

All four doors show from the middle, the returns trolley and sorting table stay out of the lanes, and Sorensen's static sprite can be reached across the counter (round 2). The cage front still doesn't read as one.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| H1 | major | cage front, x 220–288, y 120–252 | The counter reads as a long wooden plank lying on the floor with a hazard stripe. The darker strip behind it reads as a shadow, and `m09_mesh_low1` at the south end reads as a floor grate. Nothing rises: no mesh screen above the counter, no hatch opening. Her "behind the cage mesh" (stage 5 §1) isn't on screen. The strip's north end (y 120–128) is sealed by collision only since round 2 removed the north mesh run, so it is an invisible wall just under the gate mouth. | Make the mesh stand up. (a) Hand-draw a side-on mesh screen at native size, 6–8 px wide and about 104 px tall, with posts every 32 px and a gap at the hatch (about y 176–200), and stand it on the counter's east edge (x 240). Use the dock fence's grey and posts (`hce_cage_panel1`) so it reads as the same mesh. (b) Close the north end with a short mesh rail no more than 12 px tall at feet y 128, x 240–288, so it doesn't reach into the gate mouth (y 64–118). (c) Swap the south-end `m09_mesh_low1` for the same short rail. After that, check in game that the gate still opens from its mouth and that Sorensen still opens from the counter. |
| H2 | minor | `sorensen_stamp` at (224, 214) | The rubber stamp, the clue for the fingerprint puzzle, is a few red pixels at the counter's south end. Easy to miss. | Put a red ink pad (hand-drawn, about 12×8, decor) on the counter just above it, at about y 200: the pair reads as "stamp and pad". Keep the stamp's top-left where it is (below her frame). |
| H3 | minor | west wall by the office door (row 2) | The office's keypad (`m09_keypad1`) hangs inside the office (x 297, y 148), but the player needs it from the hub side, where there is nothing. The story calls it "a keypad by the door, not on the card system". | Add `m09_keypad1` on the hub's west wall below the office door's mouth, at about (16, 128–140), in the 12–30 px side-wall strip. Keep the one inside the office too. |

### restricted_cage (`room_m09_cage`)

Every object has a proper place, and the walk from the gate passes Sorensen and the feed table to reach the plan chest. But the room reads as a stock room with sage walls, and Sorensen stands by the shelves rather than at her shredder.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| C1 | major | whole room | No mesh anywhere: sage blockwork, two box shelves, a plan chest. Without the name it could be any store room. R2 open item 3. | Make the walls say cage. Repaint the back wall in `make_m09_tileset.py` as chain-link over blockwork (a mesh band with posts on rows 12–58), and paint mesh into the side strips. Or stand `hce_cage_panel1` (53×54) along the back wall where it is free (x 196–230, feet y 66 so its top clears the frame at y 12) and between the shelves and the plan chest. A mesh door sprite (`hce_cage_door1`) by the W door, on the wall face above the side strip, would show the gate. |
| C2 | major | Sorensen (3.6, 4.6) and the shredder line at x 164–236, y 150–160 | She stands about 50 px west of the shredder, in front of the shelves, so she doesn't look like someone feeding it (the stage 5 picture: "at the shredder's feed"). The gap exists because the shredder's top-left has to stay out of her 80 px tap frame (x ≥ 156). | Bring the scene to her without moving the slot. Extend the hatched keep-clear box west to x 118 so she stands inside it. Put a sack of shredded strips or an open box of sheets as decor (no slot) between her and the shredder (x 140–160, feet y 156): decor may sit inside her frame. Keep `shredder1` at x 164. If her position can change (story-owned), (4.2, 4.6) with the shredder at x 176 would be tighter still; check her frame against the feed table's slot. |
| C3 | minor | `m09_degausser1` at (204, 250) | A desktop machine standing on bare concrete in the middle of the south floor. | Stand it on a low steel bench (`zds_desk3` or `smalldesk2`), or against the east wall below the sideboard. |
| C4 | minor | shelves x 96–190 | The same `supply_shelves1` as the client deposits, under a SERIES R sign. | Use the S1 variant with red-labelled boxes, so "Series R" shows on the shelves as well as on the sign. |

### sorensen_office (`room_m09_office`)

Reads as a long-serving director's office: walnut, binders, certificate, kettle, a rug, a safe. The safe is the clearest object in the room, as it should be. The deck controller now has its own box.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| O1 | minor | `lease_file` on the desk | The lease file uses the `case-file` sprite, a pinboard with red string. It looks like an evidence board. The same art is used for HaX's case file (where it fits) and the salvage cage's printed folder (V3). Three documents, one look. | Hand-draw a manila folder (`m09_folder1`, about 28×20, a tab and a paperclip) for the lease file and the Albion folder; keep `case-file` for HaX's. Register it and point both `as-type`s at it. |
| O2 | minor | desk at x 126–204 | The cream-topped `desk1` is the front office's desk. In walnut and red it looks borrowed. | Use a dark wood executive desk (the one in m05's `room_qdc_torres` or another dark desk from the catalog) at the same footprint. |
| O3 | minor | side tables x 40–90 and 232–282, y 196 | Two identical tables placed symmetrically each side of the rug look staged. | Swap one for a low bookcase or a small filing cabinet with the rent ledger on top. Keep each slot 32 px from the others. |

### tape_room (`room_m09_tape`)

Reads as a tape store at a glance: reel shelves and tape cabinets in two rows, TAPE STORE, the legend framed by the salvage keypad. The reel deck stands alone on its bench with clear floor west of it, so the key object is the easiest find in the building. No findings at this level. The tape cabinets' open doors are drawn three-quarter, but they sit in a straight row square to the wall, which is fine.

### salvage_cage (`room_m09_salvage`)

Every object has its own spot, and round 2 took the field kit off the crate. It reads as a back storeroom with two desks; the "mesh pen" isn't there.

| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| V1 | major | whole room | Dark brick, no mesh: R2 open item 2. This is the end of the trail (Tomb Beta's rack); it should look like a locked pen. | Same treatment as C1: mesh painted over the brick on the back wall of `room_m09_salvage`'s sheet and in the side strips, or `hce_cage_panel1` standing against the back wall behind the desks (feet y 66: wall items draw behind the desks). |
| V2 | minor | ALPHA crates x 240–272, low table x 234–284 y 128 | The low table's top covers the bottom crate, so the second ALPHA label is cut in half (in game it reads "ALPHA / ALPH"). | Use a lower table for the folder (about 24 px tall, so it ends below the crate) or move the table to x 214–264 and the printer stand west to x 160–192, checking 32 px slot spacing against the BETA crate (118). Or take the stacked crate off and stand one ALPHA crate at the back wall. |
| V3 | minor | field kit (vm-launcher), Albion folder (`case-file`) | The pink desktop PC and the pinboard sprite again. | R3 (laptop sprite) and O1 (folder). |
| V4 | minor | `m09_door_controller1` at (40, 54) | The cut door controller hangs on the north wall. The door it controls is the S door, on the other side of the room. | Fine as it is (the S wall is covered by the tape room), but the eye reads it as belonging to nothing. Move it next to the rack and give it a cable run down to the S door corner (a 2 px wire painted down the west side strip), or accept it. |

## Top five

1. **K1, server closet: no east wall or frame.** The room layer takes the sheet's top-left 5×6 block. Rebuild it from the 5×6 template's cell map, as `small_room_1x1gu` does. Cheap, and visibly broken right now.
2. **H1, hub: the cage front doesn't stand up.** A side-on mesh screen on the counter's east edge with a gap at the hatch, and low rails closing both ends of the strip (one of them is an invisible wall today).
3. **C1 and V1, both cages: no mesh.** Paint chain-link over the back wall and side strips of the two sheets, or stand `hce_cage_panel1` runs against the back walls.
4. **C2, cage: Sorensen isn't at the feed.** Extend the hatched shredder box west round her and put a decor sack of strips between her and the shredder. The shredder slot stays where it is because of her tap frame.
5. **S1 and S3, open stacks: one shelf fourteen times, and the H&L label reads as dropped on the floor.** Two or three hand-drawn shelf variants, a gap between bay 10 and bay 11, and the label raised onto bay 12's bottom rail (foot y 94–96). S2 (the bare south-east quarter) goes in the same edit.

## Checks run

All read-only; `git status` shows no m09 file changed by them.

- `render_room_preview.py 'room_m09_*' --grid --scale 2`: identical to `dressing_r2/maps/`.
- `slot_audit.py --notes`: 0 problems; the same five notes prompts round 1 kept on purpose.
- `check_room_walls.py --scenario`: all eleven read 64. This doesn't catch K1, which is a missing east wall, not a floor-line fault.
- `generate_rooms.py --check` on all eleven: the usual generic hints. Ones that matter here: `m09_bay_label1` overlaps `supply_shelves1` (intended, but see S3), and the closet's props have feet in its "bottom two rows" (nothing is south of the closet, so this is harmless once K1 gives it a south frame).
- Not run: a browser session. D2 and S4 need one, and so do round 4's mesh pieces (gate reach, Sorensen's reach across the counter).

## Assumptions

- Assumption: m05's `room_qdc_*` set is the benchmark for a well-dressed shipped mission, as the orchestrator suggested.
- Assumption: K1 is visual only, because the closet's `walls` layer still carries column 4 collision; graded major, not blocker.
- Assumption: D2 (Dillard on the dock's wall line) and S4 (the override tile in the west crossing) come from reading coordinates against the renders, not from play; both are marked "check in the browser".
- Assumption: NPC positions are story-owned, so every fix here moves props first and leaves NPC changes as options for the orchestrator.
- Noticed, not acted on: round 2's page error (B6) and the trolley/bin state art still need a decision; neither is a dressing finding for this round.
