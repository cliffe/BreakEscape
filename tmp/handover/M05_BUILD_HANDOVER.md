# m05 office-life build handover

## Done (commit f1f2ad4b8 on plan/ol-m05)
- scenario.json.erb: officePresets; globals qdc_staff_upset, qdc_cooler_off, thandiwe_ko, niamh_ko, lisa_met; Lisa tea need + 3 mappings (lisa_met gate, 2 trip mappings); Thandiwe (6,6) and Niamh (6,4), seated, leash, needs, mappings (day breaks, couplings, goodbye seed, Thandiwe's hide x3); objects break_espresso, kettle1 (break room), corridor_cooler (corridor); credits conditions + new "A MEMBER OF STAFF" line; 6 trouble/cooler-switch mappings appended last on agent_0x99_handler; debrief ink VARs, friendly_kos and trust penalties (thandiwe_ko, niamh_ko), recompiled.
- Validator 0 errors; lock/key diff empty; V1 saved in office_life/v1_summary_build.txt.
- Left out deliberately (slice 5): storyPath for Thandiwe/Niamh, chatter pools, exchanges (ex_whispering, ex_collection, ex_heading_home) and heard_ globals. Slice 6: all Bernadette parts (NPC, bins, her mappings, bernadette_ko global, credits/debrief/trouble for her, Niamh's espresso coupling to her, ex_late_again).
- Used needsHome form { room, x, y } (schema requires room).

## Live finding so far (game 6975, break room start)
- Thandiwe sat on hospital_chair_south (north side of table 2, x 188, y 132), NOT the planned south-side chair (hospital_chair_north, y 192). Niamh then found no free chair (seatTried true) and stands at post (192,128), sprite looks like she is by the espresso. Seating needs fixing: try moving needsHome so the feet are within 36 px of the right chair foot (chair_south foot ~y162, chair_north foot ~y222; the plan's post tiles are probably wrong; try Niamh (6,5)-ish near y 160 and Thandiwe (6,7)-ish near y 222, measure with b._seat in probe3.mjs).
- No page errors. NPCs without storyPath load (lazy loader warns only); clicking them not yet tested.

## In progress / next
1. Fix seats, re-measure, then run plan checks L1-L5, E1-E3, E4 (route skip), E-L1-E-L5, reload (10.3), attack/KO probes (10.4, fresh game each), sync budget, walking pace x5, screenshots day and evening (after server_room_entered).
2. Write office_life/BUILD_REPORT.md (figures measured, pass/fail, deviations, slice 5 and 6 additions listed above) and commit.
3. Kill server: puma PID 1233537 (also in tmp/m05_puma.pid), port 3092. Unlink node_modules symlink in the worktree (it is a symlink to main's).

## Harness (scratchpad, may be cleared)
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/lib.mjs (boot, pos, st), probe1-3.mjs. Boot: do not press Escape after Enter (opens pause). Games: only 6975 made (new-game.rb m05_insider_trading --start-room break_room; needs RBENV_VERSION=2.7.8 BUNDLE_PATH=<main>/vendor/bundle PLAYTEST_PORT=3092 BREAK_ESCAPE_STANDALONE=true).

## Session 2 (commit 4106d5928 + this note)
DONE
- Seat fix (4106d5928): needsHome/position is the TILE CORNER (x*32,y*32), not its centre. Old Thandiwe (6,6)=(192,192) was 25 px from the north-side chair foot (196,167) vs 30 px from her own (196,222), so she took Niamh's chair; Niamh (6,4)=(192,128) was 39 px from the nearest foot, over NEAR_CHAIR 36, so no seat. Now Thandiwe (6,7)=(192,224), 4.5 px from foot (196,222); Niamh (6,5)=(192,160), 8 px from foot (196,167). Live (game 6989): Niamh on hospital_chair_south (188,132), Thandiwe on hospital_chair_north (188,192). Chair x,y are top-left; foot = (x+w/2, y+h).
- Validator 0 errors (34 warnings); lock/key diff empty; V1 identical to v1_summary_build.txt (after fix).
- L3 pass: Thandiwe leaves 2.8 s after Lisa's conversation closes, uses espresso 5.5 s; Niamh leaves at 8.5 s, uses 12.8 s. Away about 30 s each, 5 breaks.
- L1a FAIL (measured): Thandiwe (south side) routes up the aisle x~148, y 190 to 119; closest approach to Lisa (144,144) 21 px; Niamh 22 px. Plan wants 48. First user cell (148,106) (~(4,3)).
- L1c FAIL: second user takes the WEST beside cell (3,3), the kettle cell (116-120,104-107), 4 of 4 pair breaks, never (5,3). Plan accepts only if Lisa's trip completes with the cell taken: not yet proven (E-L run below).
- L1b pass: Lisa interact ok with pair at (4,3)+(3,3) in breaks 3,4,5 (break 1 inconclusive: minigame open after pamphlet; break 2 pair did not form). L2: pamphlet picked up in break 1 with pair using.
- E1 pass: Thandiwe hidden on server_room entry, still hidden at next corridor and break room entry. E2 pass: her chair (y192) unseated, sprite not visible. Evening torres_identified: qdc_cooler_off true.
- Attack probe (1 try each so far): KO Niamh (game from atk2): upset true, cooler_off true, niamh_ko true, she stays in break room after KO, no corridor trips. Attack Thandiwe single punch did not land in first try (probe fixed to loop until hostile); atk3/4/5 logs in tmp/handover/m05live/ may exist.
OPEN
- E3 (ten needs-minutes) result: see ev.log tail (may be unfinished). E4 (skip route), E5/E6/E7 Bernadette skipped as out of scope. E-L1..E-L5: el.log partial (first trip: Lisa at kettle (110,110) using, interact returned no-effect-confirmed, needs retry). Reload (10.3), rest of attack/KO probes (attack Niamh, KO Thandiwe, attack Lisa, KO Lisa), debrief trust -10 check, walking-pace x5 timing table, sync budget (globals and triggeredEvents deltas), screenshots (break-day, corridor-cooler, break-after-turn, break-evening are in scratchpad m05live/out/; copy into scenarios/m05_insider_trading/office_life/screenshots/), BUILD_REPORT.md.
- L1a/L1c decision: either accept and document (Lisa stays talkable), or move Thandiwe/Niamh and espresso useFrom per PLAN 2.3; then re-run L1, L2 and E-L1.
- Server puma 1233537 on :3092 still running, node_modules symlink still in worktree: kill/unlink at the very end.
Harness copies and logs: tmp/handover/m05live/ (lib.mjs needs the scratchpad paths edited; ng.sh makes a fresh game).

## Session 3: L1a, L1c, E-L1, E-L2 (commit cf5dc09db; server puma 1233537 still on :3092)
Frame note: npc positions and path points are the tile corner frame, so Lisa's post is (128,128), not (144,144). The 21 px "closest approach" in session 2 was against that post.
Cause L1a/L1c: espresso useFrom (-1,1) put the first user at (148,100), in Lisa's column; every route from the seats ran up the aisle x 148 past her. Cell (180,100) is under the espresso's collision, so the second user's right side was unwalkable and besideCell (npc-needs.js:5631) fell to the left, (3,3), the kettle cell. Fix: useFrom (0,1) at scenario.json.erb:1859 (engine reads it in approachCell, npc-needs.js:5426). First user now (180,115), second (212,111).

### Results so far
| Check | Tries | Measured |
|---|---|---|
| L1a min distance to Lisa (all samples, 60 ms) | 5 | Niamh 50, 52, 52, 52, 52 px; Thandiwe 84 px each. Excluding the last tile: 55 to 58 and 86 to 88 |
| L1c second user cell | 5 | Thandiwe (212,111) 5 of 5, never (110,110) kettle cell; Niamh first at (180,110 to 115) |
| L1b (side effect) Lisa talkable with pair using | 4 of 4 tried | ok; pamphlet pickup ok in try 1 |
| E-L1 trip: leave, trip, return (player 2 rooms away) | 5 | left post 2.8 to 8.0 s after leaving, use started 0.2 s later, npc_returned_post 12 s after use start, 5 of 5 |
| E-L1 talk at kettle (phase using, player near) | 5 (+2 earlier) | interact ok and dialogue opened and closed, 5 of 5 (earlier "no-effect-confirmed" was a conversation still open from the prime step) |
| E-L2 reload mid-trip | 5 of 5 | after reload: 1 Lisa sprite, at (128,128), idle, tea 100 each time |
| Validator | | 0 errors, 34 warnings |
| Lock/key diff vs baseline_locks.json | | empty |
| Retarget (commit d9df89e84): Lisa's tea trip to `qdc_fridge_milk` (qdc_fridge1, 36x61 at (34,160)), data only | | Fridge preset not used (type is Tiled base `qdc_fridge`), own affordance satisfies tea, useFrom (0,1); kettle1 no longer declared |
| E-L1 walk out, dwell, walk back | 5 | farthest 82 to 86 px from post at (54..60,172); left post 4.8 to 7.9 s, use 0.8 to 1.3 s later, returned 12.7 to 13.9 s after use start. Return ends at 27 to 32 px from (128,128), idle: FAILS the 8 px mark 5 of 5. The 1-tile walk-end guard (npc-behavior.js:1402 to 1416) is engine, not data |
| Route clearance (60 ms samples, per trip) | 5 | to seated-chair feet 78 to 92 px (south) and 115 (north); espresso cells 54 to 82 (first user) and 86 to 113 (second); pamphlet 78 to 107. All at least 48 |
| Talk at the fridge (phase using) | 5 | interact ok, dialogue opened and closed, 5 of 5 |
| Talk mid-trip walking out / walking back | 5 + 5 | 10 of 10 opened (out at (100..132,148..164); back at (64..71,172)); 'near' returned false once, interact still ok |
| E-L2 reload mid-walk (Lisa 30+ px out) | 5 of 5 | 1 Lisa sprite, at (128,128), idle, tea 100 after each reload |
| L1a rerun (game 7093) | 5 | Niamh min 48 to 50 px all samples, 62 to 68 px excluding the last tile; Thandiwe 79 to 85 and 90 to 96. Pass |
| Validator / lock-key diff after retarget | | 0 errors, 34 warnings; diff empty |

OPEN FINDING (not fixed, needs a call): Lisa's kettle cell (110,110) is 25 px from her post (128,128). The behaviour layer ends any goToAndStay move once within 32 px (npc-behavior.js:1402 to 1416, no arriveWithin on the walk home, npc-needs.js:4139), so after her trip she logs npc_returned_post but never walks back; she stays at the kettle cell for good (position 107 to 110 after every trip). Every try ended there. Data cannot give her more than about 18 px of return walk: moving her post south hits table 1's chairs, and the kettle cell can only be on the counter's south side. Options: (a) accept, as PLAN 2A allows "post or kettle cell"; (b) an engine change (arriveWithin for the walk home); (c) move her post and position together, a story-placement change.

### Session 4 note
Retargeted Lisa's trip to the fridge (see rows above). The walk is now visible (about 55 px out and 55 px back at walking pace, 12 s dwell). The earlier open finding is half resolved: she no longer sits at a cell 25 px from her post, but the return still ends 27 to 32 px short of (128,128) because the walk-end guard stops within one tile; ending within 8 px needs an engine change (arriveWithin on the walk home, npc-needs.js:4139) or moving her post. Probe: tmp/handover/m05live/el3.mjs (trip, talk), el4.mjs (walktalk, reload). Server puma 1233537 left running on :3092.
