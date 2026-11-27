# m05 office life: build review round 5 (final)

Delta review of `fab5de6cf..901124128` (R3 fixes, R4 fixes, Bernadette's post moved to (7,4)), on branch `plan/ol-m05`. Read-mostly; no server was started, because the post checks below are settled from Tiled and the committed R4 probe and live data. Positions are in the break room's own frame (room origin subtracted). Engine untouched.

## Checks run

| Check | Result |
|---|---|
| Validator (`scripts/validate_scenario.rb --no-graph`) | 0 errors, 29 warnings |
| Lock and key diff against `baseline_locks.json` | "lock and key diff: empty" |
| Bernadette lines, `SPOKEN_LINES.md` against `scenario.json.erb` and her ink | All four pool lines, the three `ex_late_again` lines and the two conversation lines match word for word; counts (37, 27, 27, 32) are right; clip count unchanged |
| KO guards and shows | Unchanged since R3: four shows carry `bernadette_ko !== true`; the fifth mapping only sets needs. The move changed `position` and `needsHome` only, so shows still reveal her at her post |

## Post (7,4) = local (224,128)

Source: `public/break_escape/assets/rooms/room_qdc_break.json` (10 by 10 tiles of 32 px). Body 18 by 10, so her feet box is x 215 to 233, y 123 to 133.

- Collision: the room has ten collision rects and none lies near. Nearest are the counter strip (160,86) 40 by 10, whose padded grid band ends about x 208, y 98 (`npc-pathfinding.js:354-369`: one extra cell each side, 2 px vertical pad), and the vending machine (246,186). Table 2 spans x 159 to 210, y 157 to 196. Chair sprites (x 188 to 204) have no collision rect. The grid cell is free, and R4's probe reports `homeWalkable` true.
- Door lanes: the room's only connection is east (`main_corridor`). The east door is at tile row 2 (y 64 to 96); the feet box top is 27 px below the lane. The north doors at tile columns 1 and 8 (x 32 to 64, x 256 to 288) are 23 px or more away in x and 35 px or more in y. No lane touched.
- Player routes: a walk from the east door (about (288,80)) to Lisa at (128,128) passes 24 px north of her box at x 224; the counter band ends at y 98 and her box starts at y 123, leaving 25 px of free floor between them. Lisa's sides, the espresso use cell (182,110), the fridge (x 212 to 237, y 16 to 42) and the pamphlet (x 202 to 216, y 93 to 104) are all 20 px or more from her box, and the pamphlet and espresso are inside normal reach range from the open floor to their west and south.
- Seats: Niamh's seated feet (x 190 to 202, y 162 to 168) are 13 px west and 29 px south of her box. No overlap.

## Findings

Counts: B 0, M 0, m 1, n 3 (m1 and n2 fixed here; n1 and n3 recorded).

### m1. PLAN.md carried review references
- Evidence: 15 phrases such as "R1 fix M1", "R2 fix m3", "(build review R1, m2)", "(m1)", "(m2)", "(m3)", "R2 count fix" and "Superseded fallback" in sections 2.1, 2.2, 2.12, 2.13, 2A, 7 (lines 60, 119, 121, 135, 194 to 198, 255, 322, 324, 326).
- Failure: the plan cannot be read without the review files.
- Fix applied: each reworded as a plain statement with its content kept (for example "a third, the `door_opened` hide, is added for the lazy-load gap below", "Fallback, if a frame of her still shows"). `grep` for `R\d`, `m\d)` and "round" finds none left.

### n1. Standing at the post narrows the east lane to about 11 px on each side
- Evidence: between table 2's chairs (x 204) and the vending machine (x 244) the lane is 40 px; her box is 18 px wide.
- Failure scenario: a player who wants to go south past her to the bins or the vending machine cannot slip by while she stands there.
- Judgement: accepted. Neither is on any route that matters, both are examinable from the open floor to the north, she leaves for coffee and the bins several times an evening, and the player can talk to her. No fix.

### n2. The R4 engine findings were not all in the backlog
- Evidence: `docs/IDEAS_BACKLOG.md` held only the short-park entry (R3 n4, which also covers R4 n2). R4 n1 (seated NPC missing from the world grid) and R4 n3 (bump waypoint adds the room origin twice, `systems/npc-sprites.js:1541` to `:1584`, confirmed by reading it) had no entry.
- Fix applied: two backlog entries added after the short-park line.

### n3. DIALOGUE_SAMPLE.md still quotes the old line and the old position
- Evidence: `DIALOGUE_SAMPLE.md:40` says she arrives "by the recycling bins" and quotes "Still here? You'll wear that chair out."
- Failure: none in the game. It is the sample the user approved.
- Fix applied: none. It is a record of what was approved; the replacement line is in `SPOKEN_LINES.md` and goes to dialogue review before voicing.

## Check 3: the first walk from the post

The live tries (game 7439) began at the rest point (193,114 then 193,121), 32 px short of the post, so the first hop out of (224,128) was not walked live. Judgement: covered well enough, with no new run needed.
- The probe (`m05-ol-r4-route.mjs`, game 7438) plans `outFromPost` from (224,128) on the live world grid and tests it against every enabled NPC body with her 20 by 10 feet box. Result: 56 px from Lisa, no hits.
- That leg lies east of every live-measured hop, so it is farther from Lisa than the walked hops (57 px). It heads north-west, away from Niamh's seat.
- The only live unknown is a bump with something that moves, mainly Niamh. Bernadette is shown only in the evening, when Niamh is seated or at the espresso paired with her, and the one early position seen (Niamh at (212,112), not yet seated) occurred at room load in the day, 11 px from her box at its nearest.

If a live number is wanted anyway: one fresh game, wait until she is shown and idle at the post (assert her centre is within 2 px of (224,128) before she takes a need), then log her `npcPos` every 60 ms from the first move until she reaches (182,110), with Lisa's, Niamh's and any enabled NPC's body rects. Pass: minimum Lisa distance 56 px or more (allow 1 px rounding), zero box overlaps, and no waypoint insertion in the console ("Bumped into"). Five tries by reloading the game. The probe plus R4's five rest-point tries already stand in for this.

## Earlier findings

| Finding | Status |
|---|---|
| R3 n1 return leg unmeasured | Measured in R4; failed at (5,7), fixed by the post move; now 57 to 58 px on both legs in five of five tries |
| R3 n2 chair line at the espresso | Fixed: "One cup, then I'm back on the hoover." in `scenario.json.erb:1904` and `SPOKEN_LINES.md`; needs `npc-dialog-review` before voicing |
| R3 n3 stale KO note and ERB comment | Fixed (PLAN parenthesis removed, comment says four mappings, three reset needs) |
| R3 n4 backlog entry for short park | Fixed (entry present) |
| R3 carried: cooler cells, bins cell, `onceOnly` count 14 | Closed in R3; unchanged by the delta |
| R4 M1 post (5,7) left her at the aisle mouth | Fixed by the move to (7,4) |
| R4 M2 post (6,7) broke the out leg | Fixed by (7,4); proved live, 57 to 58 px both legs, five of five |
| R4 m1 plan frame wrong | Fixed: check L1a restated in the local frame, Lisa at (128,128) |
| R4 m2 probe ignored NPC bodies | Fixed: probe tests legs against NPC bodies |
| R4 n1 seated Niamh not in the grid | Engine backlog (entry added here, n2) |
| R4 n2 walk home rests short of the post | Engine backlog (short-park entry) |
| R4 n3 bump waypoint counts origin twice | Engine backlog (entry added here, n2) |

ready to train: yes
