# m09 room dressing: review, round 4

## Verdict

**Ready for lighting.** All seven R3 majors are fixed and hold up in a fresh in-game tour. Of the twenty R3 minors, sixteen are fixed (S4 not yet seen in play, F2 in part), three were accepted with a reason (K2, V4, D2), and one is fixed with a side effect (D1, see D3 below). Nothing above minor remains. Every room now reads as its place at a glance, the key story object in each is easy to find, props sit square to the walls, and no door, tap area or NPC route is blocked.

Five minors remain. All are small and none changes a room sheet or the furniture plan, so lighting and the POV backgrounds can start now and these can be picked up alongside it.

Counts: 0 blocker, 0 major, 5 minor.

Reviewer: fresh, read-only. Nothing edited apart from this file; nothing committed.

## What I looked at

- Standards: `.claude/skills/mission-room-dressing/SKILL.md`, `docs/agents/FINALE_BRIEF.md`, `ROOM_DRESSING.md` rounds 1–3, `DRESSING_REVIEW_R3.md`, and the user's rule that props sit square to the walls (one or two angled per room).
- Map renders: `dressing_r3/maps/`. A fresh `render_room_preview.py 'room_m09_*' --grid --scale 2` is pixel-identical to them, so they are current.
- In game: `dressing_r3/ingame/` (game 3099 and the two browser shots), plus a fresh `lighting-tour.sh` run of all eleven rooms (game 3106, every room unlocked server-side, `--close-intro --show-npc archive_guard`, shots in the session scratchpad, `r4/ingame/`). The 3099 cage shot predates round 3's "decor took the slot" fix (its feed table is empty); the 3106 shot shows the box on the table, as the fix intended.
- Benchmark: a fresh contact sheet of m05's `room_qdc_*` maps (two or three wall fixtures per back wall, furniture in groups with chairs facing desks, repeated kit varied in colour and height).
- Object lists from `room_edit.py <room> list`; NPC fields from `scenario.json.erb` (Sorensen (3.6, 4.6), sorensen_hatch (8.25, 5.5), Noor (6.5, 5.5), Tran (3.3, 3.5), Old Coyote's round at y 7.5 with its west-end waypoint (3, 7.5), override (3.5, 4.2), Lyle Dillard (3.5, 8), spawn (7, 7.5)).

Positions are room pixels (x left edge, y feet) unless marked as tiles.

## R3 findings: resolved?

| # | R3 sev | Status | Evidence |
|---|---|---|---|
| K1 | major | **resolved** | Closet now has its east wall, side strip and south frame in the render and in game (3106). Walls check reads 64. |
| K2 | minor | accepted | A wall-hung patch cabinet and the clipboard fill the back wall. Tran (3.3, 3.5) still covers the lower half of the rack; his position is story-set, so this stays. |
| H1 | major | **resolved** | The ledge counter, the side-on mesh screen with a gap at the hatch, and the low rails at both ends of the strip read as a cage front standing up. The north end is no longer an invisible wall. Sorensen stands behind the mesh at the gap. |
| H2 | minor | resolved | Stamp and pad read as a red and black pair at the counter's south end. |
| H3 | minor | resolved | Keypad on the hub's west wall at (17, 142), below the office door's mouth. |
| C1 | major | **resolved** | Chain-link over the back wall and both side strips; the room says "cage" at a glance. |
| C2 | major | resolved | The hatched box now runs round her; the taped box and sack of strips sit between her and the shredder. She reads as standing at the end of the shredding line. The shredder is still about 50 px east of her, which is the price of keeping its slot out of her tap frame; acceptable. |
| C3 | minor | resolved | Degausser on a small bench. |
| C4 | minor | resolved | Red-taped SERIES R boxes on the shelves. |
| V1 | major | **resolved** | Chain-link over the salvage cage's brick; reads as a locked pen. |
| V2 | minor | resolved | One ALPHA crate at the back wall, label whole; printer stand and folder table no longer cover it. |
| V3 / R3 | minor | resolved | `laptop1` shows in the reading room and the salvage cage. |
| V4 | minor | accepted | Controller stays on the north wall, with its cut wires drawn. Fine. |
| O1 | minor | resolved | Manila folder for the lease file and the Albion folder; HaX's case file keeps the pinboard. |
| O2 | minor | resolved | Dark `exec_desk1` on the rug. |
| O3 | minor | resolved | West sideboard with the rent ledger, east side table with the broker's note; no longer a mirrored pair. |
| S1 | major | **resolved** | Three variants alternate along both runs, with a gap between bay 10 and bay 11 under the plates. The boxes inside each unit still follow one layout, but at room scale the runs no longer look copy-pasted. |
| S2 | major | **resolved** | The hatched returns bay with pallets, a trolley and the pallet truck fills the south-east quarter, outside the patrol band. |
| S3 | minor | resolved | H&L 12 plate sits on bay 12's bottom rail and is easy to spot; the pulled-out boxes are on the aisle in front of it. |
| S4 | minor | fixed, not seen in play | Override tile (3.5, 4.2) is beside the reading-room door's mouth and clear of the west crossing. The override itself still needs an `m01_maya_ko` save after flag 1 to watch; a playtest item, not a dressing one. |
| D1 | minor | fixed, with a fault | The PERSONNEL plate was added but runs under the shutter control box. See D3. |
| D2 | minor | accepted | Dillard's feet sit just above the dock's wall line in both tours. See S5 for a different problem with his spot. |
| F1 | minor | resolved | Two chairs on the counter's public side, facing it. |
| F2 | minor | partly | Covered by O2 and F1. Three rooms still use the cream `desk1` (front desk ×3, hub sorting table, reading desk). See H5. |
| R1 | minor | resolved | `hospital_chair1` faces the reading table. |
| R2 | minor | resolved | SILENCE PLEASE and a framed county map join READING ROOM on the back wall, with the green banker's lamp; enough to say "reading room" without new floor furniture. |

## Rooms, judged afresh

Against m05's best rooms (break room, lab, server room, Torres's office): m09's dock, front desk, office, tape room and open stacks are now at that level, and the two cages and the hub are close behind. Wall fixtures run two to four per back wall, chairs face their desks, and repeated kit (shelves, reel racks) varies. In every room the floor south of the visible band (the bottom two rows, covered by the room below) is left empty, which is right.

| Room | Reads as its place | Key object easy to spot | Clutter / empty | Repetition | Square | Doors, taps, routes | Findings |
|---|---|---|---|---|---|---|---|
| loading_dock | yes: night yard, shutters, apron, hut, fence | incident log on the hut desk under the camera | balanced | none | yes; cones and pallet truck angled (2) | clear; spawn sits on the fence | D3, D4 |
| front_desk | yes: records front office, wordmark, counter with a public side | run sheet on the first trolley; taped box at Noor's desk | balanced | `desk1` ×3 (fine here) | yes | clear; Noor on open floor | none |
| open_stacks | yes: client-deposit warehouse, bays, returns bay | H&L 12 plate on bay 12, boxes in front | the west half's open floor is the patrol band and the crossing, so it stays bare | much reduced | yes; the step stool is the one angled prop | crossing, cross aisle and E door clear | S5 |
| server_closet | yes: a cramped comms cupboard | wipe console (degausser) SW, clear of Tran | full for its size | none | yes | W door clear; console opens alone | none new (K2 accepted) |
| staff_passage | yes: noticeboard, hooks, rota, card reader | n/a | right for a corridor | none | yes | both lanes clear | none |
| reading_room | yes, now: plates, map, banker's lamp, parquet, rug | drop terminal, laptop, wall screen and case file all distinct | the visible band is full; the SE corner is the S and E doors' lanes | none | yes; one side-facing chair | five slots, no shared menu | none |
| restricted_stacks | yes: cage front with hatch, binder shelves, card readers | Sorensen at the hatch; stamp and pad on the counter | centre clear on purpose (four door sightlines) | `desk1` sorting table | yes | all four doors and the gate mouth clear | H4, H5 |
| restricted_cage | yes: chain-link, SERIES R, shredding line | shredder line and feed-table box; plan chest NE | balanced | none | yes | W row 2 clear; walk from gate past her to the chest | none |
| sorensen_office | yes: walnut, binders, certificate, rug, safe | the safe; lease folder on the desk | balanced | none | yes; club chair the one angled piece | E door and keypad clear | none |
| tape_room | yes: tape store, reel racks, cabinets | reel deck alone on its bench | balanced | reel shelf ×5, broken by two cabinets | yes (cabinet doors drawn open, units square) | both W-side doors clear; deck reachable from the west | none |
| salvage_cage | yes: a mesh pen at the end of the trail | Tomb Beta's rack, BETA crate, drop link | full for a 10×6 | none | yes | S door mouth clear; every slot 32 px apart (rack and its label share a menu by design) | none |

## Findings

| # | Sev | Room | Where | Finding | Fix |
|---|---|---|---|---|---|
| D3 | minor | loading_dock | `m09_sign_personnel1` (70, 44), 43×11, and `aes_shutter_ctrl1` (92, 56), 20×27 | The plate added for R3 D1 runs under the shutter control box, so in game it reads "PERSO". A tile-level fault on the wall the player sees first. | Redraw the plate at 21 px wide or less so it ends before x 92 (two lines, "STAFF / IN", or an arrow plate), or drop it: the BAY 1 plate and the hatched apron already mark the door. Don't move the control box; it belongs next to the shutter. |
| D4 | minor | loading_dock | spawn `startPosition` (7, 7.5); fence `hce_cage_panel1` ×5, feet y 304, tops y 250 | The player starts with feet at about y 272, inside the fence's band, so the first thing seen is the player standing in the mesh (3106 shot). The fence panels have no collision object of their own. | Move the spawn up to about (7, 6.8) (feet about y 250, on the hatched line above the fence; still bottom right, facing both doors, as S5 §3.1 wants). Optionally add a collision rect over the fence (x 32–288, y 280–304) in Object Layer 1 so the player can't walk into it. |
| H4 | minor | restricted_stacks | `yellow_bin1` (262, 226), 22×29; sorensen_hatch (8.25, 5.5) | The wheelie bin's top (y 197) overlaps Sorensen's legs, so she looks as if she's standing in it. It also sits inside her 80 px tap frame (decor only, so no menu, but it crowds the hatch). | Swap it for the small `bin1` (18×19) at the strip's south end against the rail, feet about y 236, or remove it: the strip is sealed by collision and the rails. |
| S5 | minor | open_stacks | Dillard (3.5, 8); Old Coyote's west-end waypoint (3, 7.5), dwell 2.5 s | The two spots are 16 px apart on each axis. If Dillard is on the floor while Old Coyote is still on his round, Old Coyote stops inside Dillard's sprite every lap. Both belong to the `m01_maya_ko` branch: whether they can be visible together depends on when `tran_alerted` fires against flag 1 (which sends Old Coyote to his override tile). | Check the timing in the story. If they can overlap, move Old Coyote's west-end waypoint from (3, 7.5) to (5, 7.5), his start tile: the turn is then 48 px from Dillard and the lap still covers the west aisle mouths. Story-owned NPC field, so this is the orchestrator's call; don't move Dillard into the shutter's mouth (x 32–64). |
| H5 | minor | restricted_stacks (also front_desk, reading_room) | hub sorting table `desk1` (96, 224) | The cream office `desk1` appears five times in three rooms. In the front office it fits; on a warehouse floor it reads as office furniture. | Swap the hub's sorting table for a steel workbench (`zds_desk3`, as in the salvage cage) with the same open boxes on it. Optional; leave the front desk and reading room as they are. |

Not findings, noted for the record:

- Tran still covers the bottom half of the rack in the closet (R3 K2, story-set).
- HaX's case file on the reading table keeps the `case-file` pinboard art. Lying flat it reads as an evidence board on the table, which suits HaX.
- Inside each shelf variant the boxes follow one layout. At room scale it no longer reads as copy-pasted; a fourth variant would help only if new art is being made anyway.

## Top five

1. **D4, dock spawn in the fence.** Raise the spawn to about (7, 6.8); optionally add collision over the fence. The first frame of the mission currently shows the player standing in the mesh.
2. **D3, dock PERSONNEL plate cut off by the control box.** Redraw at 21 px or less, or drop it.
3. **H4, hub bin across Sorensen's legs.** Swap for a small bin at the strip's south end, or remove.
4. **S5, Dillard and Old Coyote's west turn 16 px apart.** Check whether both can be on the floor at once; if so, move the turn to (5, 7.5). Orchestrator's call.
5. **H5, cream office desk as the hub's sorting table.** Optional swap to a steel workbench.

## Checks run

All read-only; no repo file changed by them.

- `render_room_preview.py 'room_m09_*' --grid --scale 2`: pixel-identical to `dressing_r3/maps/` (all eleven).
- `lighting-tour.sh m09_digital_archaeology <scratch>/r4/ingame --close-intro --show-npc archive_guard`: game 3106, all eleven rooms shot. Node 18 on PATH is too old for Playwright; I put Playwright's bundled Node 24 first on PATH for the run. The tour reports "no-lighting" for every room, as expected before the lighting pass. No page errors, 4xx/5xx or "No Tiled item found" lines in the session log (R2's B6 'style' error did not appear).
- `slot_audit.py --notes`: 0 problems; the same five notes prompts kept on purpose since round 1.
- `check_room_walls.py --scenario`: all eleven read 64.
- `validate_scenario.rb`: one error, not from dressing. `kowalczyk` in loading_dock uses `spriteSheet: "halina_kowalczyk"`, which has no walk atlas or `game.js` load line yet. It comes from an uncommitted change in the working tree (with `the_architect` → `adrian_tesseract`), presumably the character pipeline in progress; the talk and viseme sheets exist, the walk atlas doesn't. It has to be resolved before that work is committed.
- Not run: a playtest of D4's spawn change or S5's timing; both need one after the fix.

## Assumptions

- Assumption: m05's `room_qdc_*` set stays the benchmark, as in R3.
- Assumption: the Kowalczyk and Tesseract sprite edits in the working tree belong to another agent's character work, so I reported the validator error rather than treat it as a dressing finding.
- Assumption: D4 reads the player's feet from the 3106 screenshot (about y 272); I did not walk the player into the fence to test its collision.
- Assumption: S5 is a possible overlap from coordinates; I did not trace in the ink whether `tran_alerted` can fire before flag 1.
- Choice: running the tour (a throwaway game on the keyless dev server) counts as read-only for this review, since it changes no repo file.
