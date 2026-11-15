# Office life: stuck needs walks and re-routing

## Handover (2026-11-15, round 8): ready for the full live proof

Status: **ready for the full live proof**. Round 8 fixed fault 2 from round 7 (the blocker-ahead heading) and passed one quick row 1 check. The full live proof (row 2 5 of 5, three more row 1 wedge checks, the tour, the m01 and m02 train smoke) has not been run.

Done and committed:
- **Local avoidance follows the path** (`46dfad42b`). `npc-behavior.js` `nearestBlockerOnPath`: a blocker counts when it is within the lane half-width (13 px) of the path polyline (feet, then each waypoint left), walking the segments until 42 px of path (`AVOID_LOOKAHEAD_PX`) is used up. The first segment keeps the old forward rule, so a body behind or beside the walker still never blocks; later segments use the distance to the segment, rounded at its start, so a body at a corner counts; the last segment runs on past the final waypoint for whatever look-ahead is left, as the heading check did. With one waypoint left this is `nearestBlockerAhead` on the heading. `_handleBlockerAhead` uses it when `nextWaypoint` is `currentPath[pathIndex]`, and the heading check otherwise. In game 5443 Marek's detour first leg (8 px) pointed at the player and then turned away; the player no longer counts, so the detour is walked.
- **Who it affects.** `_handleBlockerAhead` is the one avoidance check for every path-following walker (needs walks, patrols, scripted routes, `goToAndStay`), so all of them change. On a straight stretch the result is the same as before (collinear waypoints). At a corner: a body straight ahead past the turn no longer stops the walker (it was never on the path), and a body on the path just after the turn, within 42 px, now counts where the heading check missed it, so the walker waits or detours a little earlier instead of bumping it. Patrols in m01 to m10 may stop slightly less often for a player standing off a corner, which is the intended effect. The tailgate/body-block lever is unchanged: the first segment still ignores bodies behind and beside.
- **Driver hook** (`23aad084e`). `tools/playtest/needs-stuck-return-proof.mjs` wraps `pathfindingManager.findWorldPath` and logs Marek's searches (clock, ends, `includeHeld`, points found, first six points) as `report.marek_searches`, capped at 400, in both the skipped and the full report. Not run in a full driver pass this round.
- Tests: `test/js/npc-local-avoidance.test.mjs` 24 passed (7 new: straight path blocks; first short leg turning away does not, while the heading check alone would; a body on a later segment within 42 px blocks, with `fwd` the path distance; a body beyond 42 px of path does not although it is 41 px away in a straight line; a body behind does not; a one-point path matches the heading check; a walker on the game 5443 shape keeps walking). `bin/test-js` 675 passed, 0 failed; `tts_office_lines_test.rb` 9 runs, 46 assertions, 0 failures; `bin/rubocop` 366 files, no offences (all on `23aad084e`).

Quick live check (port 3093, keyless, headless setFPS(20), the round 7 wedge probe with the setFPS line added, row 1 only, player left at spawn about (160,223)):

| Game | Code | Result |
|---|---|---|
| 5447 | `23aad084e` | **passed**: Marek got his cup at needs tick 396 and was `returned_post` at tick 426, 7.5 s home, passing within 26 px of the player; no `return_stuck`, no `return_abandoned`; 272 searches, none with 0 points. One `return_resumed` at (195,276) after 4 s standing still beside the coffee, 64 px from the player, before he set off (not the wedge; not read further). |

Game 5446 was made and not driven.

Still to do (the full live proof): row 2 5 of 5 with the stuck-return driver; why 5442 and 5443 had no turn-back (read `sanjay_log`; the late queue clear after the wedge is the likely cause, and should be gone now); three more row 1 wedge checks; the tour (rows 1, 3, 5, 6, driver `e617cd48f` not run yet); the train smoke on m01 and m02. Worth a look while there: the 4 s stand at the coffee before the walk home in 5447.

## Code review R1 fixes (2026-11-15): live re-check not done

Status: **fixes in, live re-check still to do.** The R1 outcomes, one line per finding, are in `OFFICE_LIFE_STUCK_RETURN_REVIEW_R1.md` ("Outcomes"). Commits: `359bc1104` (the fixes, tests and driver changes) and the follow-up commit that fixes the `otherHeld` regression below and records this section.

Suites on `359bc1104`: `bin/test-js` 675 files passed, 0 failed; `tts_office_lines_test.rb` 9 runs, 46 assertions, 0 failures; `bin/rubocop` 366 files, no offences. Not rerun after the one-line follow-up fix (`npc-needs-reroute-held.test.mjs` 10 passed on it).

Live (port 3093, keyless, headless setFPS(20), fresh games):

| Run | Game | Code | Result |
|---|---|---|---|
| Row 2, run 1 | 5458 | `359bc1104` | **broken by this branch, not a behaviour result**: page error `ReferenceError: otherHeld is not defined` on the first NPC contact; the needs clock stopped at about 6 s, driver `skipped: queue_never_cleared` |
| Row 2, run 2 | 5459 | `359bc1104` | same page error and skip |

Cause: the m7 refactor moved the settle guard into `settleOnContact` and dropped the local `otherHeld`, which `handleNPCCollision` still reads further down. Fixed in the follow-up commit (`const otherHeld = !settleOnContact(...)`). The node tests could not catch it because nothing drives `handleNPCCollision`.

Not done (budget stop): row 2 twice on the fixed code, the away run with the new `sayings` and `sanjay_grumble_shown` records (`needs-stuck-return-proof.mjs` now wraps `npcNeedsSystem._showSaying` in the page), tour row 3 with the varied mid points and the `near` record (`needs-tour-regression.mjs`), and the lab_physical_pentest smoke (scratchpad script, 60 s of needs clock counting `walk_stuck`, `return_stuck`, `return_abandoned`, `seat_gave_up` and how far each needs NPC walked; `train-smoke.mjs` takes game ids only, so a boot smoke alone would not cover the walks). Games 5460, 5461 (test_needs_sims) and 5462 (lab_physical_pentest) were made and not driven.

Behaviour changes to watch in that re-check: the world adapter now passes `reroute` to the behaviour layer (before, needs re-issues planned the plain path and only the detour used `includeHeld`), and the last re-route in one place nudges onto a walkable cell. Both reach every needs walk, so row 2 and row 1 timings may move. The tour row 3 stop in 5454 was not a different approach from row 5: both took mid (232,176) and aimed at (222,41), so what stopped the player at (220,103) was a body or chair that had moved by row 5.

## Full live proof (round 8 code)

Run 2026-11-15 on `67bf8502f`, keyless server on port 3093, headless setFPS(20) with fixed steps, a fresh game per run. Row 2 uses the stuck-return driver with the player held at (232,176).

| Run | Game | Result |
|---|---|---|
| Row 2, run 1 | 5448 | pass: `see_turned_back`, `see_look_round`; grumble spoken and overheard at 4.3 s; Marek home in 6 s |
| Row 2, run 2 | 5449 | pass: both tasks; grumble spoken and overheard at 1.8 s; Marek home in 6 s |
| Row 2, run 3 | 5450 | pass: both tasks; grumble spoken and overheard at 1.3 s; Marek home in 6 s |
| Row 2, run 4 | 5451 | pass: both tasks; grumble spoken and overheard at 2.5 s; Marek home in 6.25 s |
| Row 2, run 5 | 5452 | pass: both tasks; grumble spoken and overheard at 1.5 s; Marek home in 6 s |
| Row 2, away point 300,40 | 5457 | partial: `see_turned_back` and `see_look_round` true; player held at (269,9), 267 px from Sanjay at (204,268); staff swivelled with reason `listen` from 121.25 s; Marek home in 2.75 s, no stalls; no spoken or overheard grumble. Not confirmed as a picture: `saying` is null in the listen probes and no event carries a picture flag for the grumble, so the driver cannot tell a picture from silence |
| Tour row 1 | 5454 | pass (queue seen, 69 s) |
| Tour row 3 | 5454 | fail: the switch-off itself worked (off, Marek and Tom turned back, Tom's grumble as a picture, back on), but the driver could not read the Activity Board first: three tries, player stopped at (220,103) aiming for (222,41), 62 px short, nudges moved 0 |
| Tour row 5 | 5454 | pass (board read, chat seen at 25 s) |
| Tour row 6 | 5454 | pass (Kitchen Rota read, 97 s) |
| Train smoke m01 | 5455 | OK, start room `reception_area` |
| Train smoke m02 | 5456 | OK, start room `reception_lobby` |

Pass counts: row 2 5 of 5 for `see_turned_back` and `see_look_round`, 5 of 5 under 20 s home (6 to 6.25 s), 5 of 5 with a spoken overheard grumble. Away run: distance and swivelling met, picture not confirmed. Tour: rows 1, 5, 6 pass, row 3 fails on the board read. Train smoke 2 of 2, 0 page errors.

Notes:
- Game 5453 was a wrong first attempt at the away run (the point was passed as the stand argument, the 4th, not the away argument, the 5th); it behaved as a plain row 2 run with the player at (300,40) clamped to (279,210), 105 px from Sanjay, grumble overheard. It is not counted. Game 5457 is the real away run.
- Row 3 cause (not fixed): the player's walk to the Activity Board (222,41) ends at (220,103) every try, with the nudge unable to move. Amara sits at about (228,123) with her desk and chair near that line, so something on the approach (her desk or chair) blocks the player; row 5 reached the same board at (219,47) from another approach in the same game. Likely a driver path problem, not Marek's or Sanjay's walk.
- The tour log also has one `walk_stuck` for Grace at (42,138), tick 1240, early in the run; Grace carried on and the rows after it passed.
- No `return_stuck` or `return_abandoned` in any row 2 run.

## Handover (2026-11-15, round 7, budget stop): not ready for code review (superseded by round 8 above)

Status: **not ready**. Round 7 hit its tool-call budget part way through the live proof.

Done and committed:
- **Look-round radius** (`4ea5d4bc1`, coordinator's call after the user's "same earshot approach"). `seating.js` `LISTEN_RADIUS` is 160 px (was 128), the earshot default (`OVERHEAR_RADIUS`). `npc-needs.js` `_buildSpeakers` gives each speaker entry a `radius`: the pool's `overhearRadius` for a grumble or picture (`s.saying.radius`, set in `_showSaying`), `_chatRadius` for a chat line, `OVERHEAR_RADIUS` for a desk-phone call. `listenTarget` uses the entry's radius before its default. So whoever could hear a line turns to it. **Cross-mission effect (corrected after code review R1, m9):** none on main for m01 to m10. `listenTarget` is only called from `updateNeedsSeat` with the needs system's speakers, and no m01 to m10 scenario on main has a needsHome NPC. The player-facing scenario that gets this and the other needs-layer changes is lab_physical_pentest. The m02 office-life pilot (branch build/ol-m02, not on main yet) adds needs NPCs, so m02 will be affected when it lands. Tests: `test/js/seating.test.mjs` (renamed listenTarget test, new radius test; 48 passed). Live: 5440 and 5441 both had `see_look_round`.
- **Bounded give-up** (`aaeb84a82`). `npc-needs.js` `RETURN_STUCK_MAX_BACKOFFS` (2): after two `return_stuck` back-offs in one place the walk home ends (`return_abandoned`), the NPC idles where it stands, and the next tick (selector first) re-plans one fresh walk home round held bodies (`_replanAbandoned`). A second abandon within `STUCK_SAME_PX` is `final` and leaves it idle until a job moves it. Test in `test/js/npc-needs-stuck-walk.test.mjs`. Seen live in 5439: `return_abandoned` at needs tick 675, `final` at 917, no further cycling.
- **Pathfinding, clearance rings near the ends** (`d488b3552`). `npc-pathfinding.js` `_avoidDynamicPositions` with `includeHeld`: ring cells (the one-cell clearance round a body) within 2 cells of the start or goal are left open; body cells stay avoided. Test in `test/js/npc-needs-reroute-held.test.mjs`.
- Drivers: `2d851fab1` (stuck-return driver dumps only walk stalls before the notice, up to four); `e617cd48f` (tour driver walks to 232,176 before each Activity Board read and records the move's aim, arrival and nudges; **not run yet**).
- `bin/test-js`: 675 passed, 0 failed (on `aaeb84a82`, before `d488b3552`; not rerun since). `tts_office_lines_test.rb` and `bin/rubocop` not run this round.

**Cause of Marek's coffee-route wedge (games 5430, 5431, 5439, 5443).** Not the coffee station, the queue cells, the socket or the notice. During row 1 the player stands at the spawn point, about (160,223) body centre, in open floor (the grid probe shows x 96 to 272 free at y 208 to 296) on Marek's line home from the coffee. Two engine faults stack:
1. The held-body re-route found no path at all (5439: every `includeHeld` search from (180,252) and (164,236) to his home cell (52,132) returned 0 points), because the clearance rings of his own chair and seated neighbours closed every cell round the goal. It fell back to the plain path, straight through the player. Fixed in `d488b3552`.
2. With that fixed (5443) the re-route now bends round the player ((188,244) (180,236) (180,228) (188,220)), but Marek still stands still 33 px from the player: velocity 0, nothing touching. `_handleBlockerAhead` (`npc-behavior.js`) judges "ahead" from the heading to the next waypoint only (`nearestBlockerAhead`, 42 px lookahead, 13 px lane). The next waypoint is 8 px away and its heading points at the player, so the player counts as ahead although the path turns away; each detour is adopted and the same check stops it again. **Next step, not built:** test the blocker against the path polyline for the first 42 px (distance from the blocker to each segment under the lane half-width) instead of the single heading, keep `nearestBlockerAhead` for a path with one point, and add node tests in `test/js/npc-local-avoidance.test.mjs`.

Live (port 3093, keyless, headless setFPS(20)):

| Game | Code | Run | Result |
|---|---|---|---|
| 5439 | `aaeb84a82` | wedge probe (row 1 only) | Marek wedged against the player at spawn, crept 12 px in 8 minutes; `return_abandoned` then `final` |
| 5440 | `4ea5d4bc1` | row 2 | played: turned back, look round, grumble overheard, Marek home 6 s; queue cleared at s 196 after a wedge against the player |
| 5441 | `4ea5d4bc1` | row 2 | played: turned back, look round, Marek home 6 s; wedge at (186,250) beside the player, s 110 to 151 |
| 5442 | `d488b3552` | row 2 | **not played**: no turn-back; queue cleared at s 236; cause not read |
| 5443 | `d488b3552` | row 2 | **not played**: no turn-back; queue cleared at s 225 after the wedge in fault 2 |

Still to do: fix fault 2; read why 5442 and 5443 had no turn-back (probably the late clear after the wedge, as in 5415, but check `sanjay_log`); then row 2 5 of 5, three more row 1 wedge checks, the tour (rows 1, 3, 5, 6) and the train smoke on m01 and m02; then `bin/test-js`, `tts_office_lines_test.rb` and `bin/rubocop`. Games 5444 and 5445 were made and not driven. The wedge probe is in the round 7 session scratchpad only; its hook (wrap `pathfindingManager.findWorldPath` and log Marek's searches) is worth adding to the stuck-return driver.

## Review summary (2026-11-15, round 6): not ready for code review (superseded by the round 7 handover above)

Status: **not ready**. Three things still fail live (listed under "Still failing" below). Everything else on the branch is done and tested.

### Engine changes on the branch since main

Slice 1, stalled needs walks re-route and give up (`0a5cdfd98`, `5a6525cf9`):
- `npc-sprites.js` `handleNPCCollision`, `handleNPCPlayerCollision`: a needs walk (`_moveOwner === 'needs'`) ends early on a bump only within `ARRIVAL_NEAR_PX` (48 px) of the destination by body centre; other moves keep the two-tile rule.
- `npc-pathfinding.js` `_avoidDynamicPositions` and the `avoidDynamic` option of the path search: `includeHeld` also blocks seated and held (immovable) NPC bodies, never the start or goal cell, for that one search; no path falls back to the plain search.
- `npc-behavior.js`: `moveTo(..., { reroute: true })` stores `_moveReroute`; `_recoverFromStuck` and `_requestDetour` pass `includeHeld` for needs moves.
- `npc-needs.js` `_watchWalk`, `_stallTry`, `_goHome({ reroute })`, `_moveForPhase({ reroute })`: the stall watch on walks out and home (`RETURN_STILL_PX`, `RETURN_YIELD_MS`), re-issue with `reroute` (`return_resumed`, `walk_rerouted`), three tries in the same place (`STUCK_SAME_PX`, `STUCK_TRIES`) then `return_stuck` and a 15 s back-off (`RETURN_STUCK_BACKOFF_MS`) home, or `walk_stuck` and the job failed out.

Slice 2, grumble earshot (`6c2eb2d6b`): `npc-needs.js` `_unheard` uses `world.playerHears` (the chatter earshot check); a grumble out of earshot is a picture, not a line.

Mutter gating (`c11767214`): `npc-needs.js` `_sayMutter` passes `always` only for `PRIORITY_MUTTERS` (`login_aloud`); the workaround start mutters follow the grumble rule.

Settle guard (`2608540fa`): `npc-sprites.js` `handleNPCCollision` does not settle a walker touching a held (immovable) NPC body, which re-collided every frame and froze it.

Chair-aware re-route (`873504ef6`): `npc-pathfinding.js` `_avoidDynamicPositions` with `includeHeld` also avoids every chair body (`window.chairs`; loose chairs are not in the world grid).

Post seat retry (`a480ba800`): `seating.js` `updateNeedsSeat`, `postSeatRetryDue`, `POST_SEAT_RETRY_MS` (4 s of needs clock): an NPC standing idle at its post tries its chair again; never mid-conversation, never away from the post, only a chair already in reach.

Chair ownership (`42f64f738`): `seating.js` `chairAtOtherPost`: a chair belongs to another NPC's post only when its foot is within `NEAR_CHAIR` of that post and nearer to it than to this NPC's own spot.

Seating trace (`a5a89878d`): `seating.js` `startFetch`, `endFetch`, `endSeatMove` log `fetch_start`, `fetch_end` and `seat_move_end` with a reason; `npc-behavior.js` `goToAndStay` passes its owner to `cancelFetch`.

Post fetch retry (`781614e66`): `seating.js` `postFetchRetryDue`, `POST_FETCH_RETRY_MS` (15 s, the fetch timeout), `behavior._fetchTriedAt` (cleared on a new stop): at the post a failed fetch is tried again once per fetch timeout. Away from the post one try stays final.

Removed in round 6 (`b252d1e0f`): the chair push re-walk (`fetchPushShort`, `FETCH_SPOT_PX`, `FETCH_PUSH_TRIES`, log line `fetch_push_short`). Every re-issue ended within a tick at the spot where the first push stopped (5415, 5422), so it never changed a result; the post fetch retry seats Tom about 13 s after his first fetch fails (tick 65 to 69 against tick 14 in every run this round).

### Scenario changes (`scenarios/test_needs_sims`)
- `scenario.json.erb`: Sanjay's caffeine follows `npc_left_post:marek` to the office coffee only during the Coffee Notice beat (global `coffee_notice_beat`, set by reading the notice, cleared by Marek's cup); reading the notice also tops Sanjay's `work` up to 100 so no work spell starts during the beat.
- `README.md` row 2: where to stand (in earshot of the coffee queue, where Sanjay turns back, and off Marek's routes), and read the notice while Sanjay is not typing.

### Tests
- New: `test/js/npc-needs-reroute-held.test.mjs` (re-route round held bodies and chairs), `test/js/npc-needs-stuck-walk.test.mjs` (stall watch, `return_stuck`, `walk_stuck`).
- Extended: `test/js/seating.test.mjs` (`postSeatRetryDue`, post retry rig, `chairAtOtherPost`, `postFetchRetryDue`, fetch retry rig), `npc-room-leash`, `npc-avoidance`, `npc-coffee-off`, `npc-magnet`, `npc-printer-power`, `npc-workarounds` (earshot premises), `test/js/fixtures/needs-stub-world.mjs`.
- Drivers: `tools/playtest/needs-stuck-return-proof.mjs` (row 2, Marek's walk home, the away point, seating trace, stall dumps; round 6: waits up to 420 s for row 1's queue and reports a run that never clears as `skipped`, `b252d1e0f`; dumps on a stall in the wait and on any walk, `c808ec67b`), `tools/playtest/needs-tour-regression.mjs` (rows 1, 3, 5, 6).
- Round 6 runs, on `c808ec67b`: `bin/test-js` 674 passed, 0 failed; `tts_office_lines_test.rb` 9 runs, 46 assertions, 0 failures; `bin/rubocop` 366 files, no offences. The seating suite is 47 passed (one test removed with `fetchPushShort`).

### Game 5415 (round 5)
Driver, not engine. The queue wait's 200 s cap ran out with Marek still at the coffee from row 1 (back at his post only at needs s 228), so the notice was read with no `npc_left_post:marek` to follow and Sanjay's caffeine was never set. 5381 (round 3) had the same 203 s pattern. The driver now waits up to 420 s and reports a run that never clears as skipped. Why Marek took 167 s over row 1's coffee in 5415 was not read; 5431 below suggests the same wedge.

### Final live table (port 3093, keyless, headless setFPS(20), stand 232,176, code `c808ec67b` or `b252d1e0f`)

| Game | Run | Row 2 played | see_turned_back | see_look_round | Grumble | Marek home (s) | Tom seated |
|---|---|---|---|---|---|---|---|
| 5430 | row 2 | **no**: Sanjay queued, no turn-back; Marek's walk to the coffee `walk_stuck` at (180,236) after three re-routes, so he went home without a cup | no | no | none | not measured (no cup) | yes at tick 69 (post fetch retry); standing at the coffee at the end |
| 5431 | row 2 | **skipped**: row 1's queue never cleared in 420 s; Marek `returning`, standing at (186,250), `return_resumed` pairs every back-off from tick 1121 to 1613 | | | | | |
| 5432 | row 2 | yes | yes | **no**: at the grumble Amara was off her desk (`returning`, 66 px), Tom seated at 155 px, outside `LISTEN_RADIUS` (128 px) | spoken, overheard | 5.75 | yes at tick 68 |
| 5433 | row 2 | yes | yes | yes | spoken, overheard | 6 | yes at tick 69 |
| 5434 | row 2 | yes | yes | **no**: Amara 149 px, Tom 154 px, Grace 192 px from Sanjay at (204,270), all seated, all outside `LISTEN_RADIUS` | spoken, overheard | 5.75 | yes at tick 69 |
| 5435 | away point 300,40 | yes | yes | yes | **picture**: no `npc_overheard`, player held at (269,9), 275 px from Sanjay at (204,276); Tom, Amara and Grace swivelled to listen | 2.75 | yes |
| 5436 | tour rows 1, 3, 5, 6 | row 1 yes (69 s), row 5 yes (24 s), row 6 yes (64 s); row 3 behaviour yes (Tom queued; after the switch-off Tom and Marek turned back, Tom's grumble a picture) but the driver marks it failed because both Activity Board reads ended `still-out-of-range`; two `walk_stuck` lines (Tom tick 1288, Grace tick 1418, both at (44,138)) | | | | | |
| 5437, 5438 | train smoke m01, m02 | SMOKE OK, 0 failed | | | | | |

### Still failing
1. **Row 2 is 1 of 5 in full** (5433). Marek home under 20 s in all three runs that played (5.75, 6, 5.75), and Tom was seated by the post fetch retry in every run.
2. **see_look_round, 1 of 3 played runs.** The turn-back happens at the coffee queue, about (204,270), and the seated staff are 149 to 192 px from there, outside `LISTEN_RADIUS` (128 px, `seating.js`, unchanged from main). Staff look round only when Sanjay turns back nearer his desk, or passes within 128 px with the bubble still up (5433, 5435, 5422). Options for the next round: raise `LISTEN_RADIUS` to the earshot radius (160 px; a shared constant, so it changes listening in m01 to m10 too), or a scenario change that makes Sanjay turn back nearer the desks. Not changed here, as it is a design call.
3. **Marek wedges on the coffee route before the notice** (5430 out at (180,236), 5431 home at (186,250), probably 5415 too). The give-up works (`walk_stuck`, `return_stuck` back-off), but in 5431 he never got free in 8 minutes. The new `wait_dump` in the driver records the bodies round him on the next such run; 5432 and 5433 caught only queue waits.
4. Tour row 3's Activity Board read (driver: `moveToNear` does not get in range).

## Handover (2026-11-15, round 5, budget stop): not ready for review

**Cause of Tom's wedge, confirmed** (seating trace, games 5413 and 5414). Tom spawns at (96,192), 28 px below his home cell (92,164), with no chair within 36 px of it, so his first seat try fetches the loose swivel chair at about (115,223). He reaches it and pushes it toward the home cell, but the push walk ends 46 px short at about (116,207) (a bump ends a walk early). `endFetch` then starts the seat move, whose walk is a straight line, not a grid path: it sticks on his desk corner at (108,193), more than 8 px from the spot (`seat_move_end walk_stuck`, stage `walk`). The chair is left about 49 px from the home cell, beyond the 36 px sit reach, and the round 4 post retry never fetched, so he stood there until his stop key changed (93 s later in both games, after a coffee, when a second fetch from his desk worked). In 5404 and 5407 the stop never changed during row 2, so there was no seated listener.

**Fix** (`public/break_escape/js/systems/seating.js`, `781614e66`):
- A chair push that stops more than 12 px from the work spot (`FETCH_SPOT_PX`) walks the rest by the grid, round the desk, up to 3 times (`fetchPushShort`, log line `fetch_push_short`), before the seat move takes over.
- The post retry fetches again, at most once per fetch timeout, 15 s of needs clock (`postFetchRetryDue`, `POST_FETCH_RETRY_MS`, `behavior._fetchTriedAt`, cleared on a new stop), so a fetch that failed for any other reason heals. Away from the post one try is still final.
- Trace (`a5a89878d`): `fetch_start`, `fetch_end` (reason `arrived`, `timeout`, `stop_changed`, `no_stop`, `status`, `chair_gone`, `move:<owner>`) and `seat_move_end` (reason `walk_stuck`, `mount_stuck`, `unseated`, `stop_changed`, `no_stop`, `chair_gone`) go in the needs log; `goToAndStay` passes its owner to `cancelFetch`. The stuck-return driver keeps every seating line from the start of the game (`seat_lines`) and reports `staff_seated`.
- Node tests in `test/js/seating.test.mjs`: `postFetchRetryDue`, `fetchPushShort`, and a rig where a failed fetch is not retried at 4 s and is retried at 15 s. The seating suite is 48 passed, 0 failed. The full `bin/test-js` and `tts_office_lines_test.rb` have **not** been run on this round's commits. `bin/rubocop`: no offences.

**Drivers:**
- `tools/playtest/needs-tour-regression.mjs` (`781614e66`): the Activity Board read walks up to the board again and retries up to three times (5409's read failed from the coffee station). It waits for two in the queue (one after 90 s, with one more board read at 75 s if nobody has queued). It records who turned back or parked after the switch-off and any `grumble` line or picture. Row 3 passes only when everyone queued turned back. **Not run yet** (game 5427 made for it).
- `tools/playtest/needs-stuck-return-proof.mjs` (`55bc3de30`): an optional 5th argument `x,y` holds the player there once Sanjay sets off for the coffee, and reports his distance at the grumble (`away_check`). Sanjay turns back from the coffee queue at about (204,269) in every run read (5413, 5414), so the away point has to be over 160 px from there: `300,40` was planned. **Not run yet** (game 5426 made for it).
- README row 2 (`2e186efbd`): the stand point is in earshot of the coffee queue, where Sanjay turns back, not of his desk.

Live table (port 3093, keyless, headless setFPS(20), stand 232,176):

| Game | Code | Row 2 played | see_turned_back | see_look_round | Grumble | Marek home (s) | Tom |
|---|---|---|---|---|---|---|---|
| 5413 | trace only, before the fix | yes | yes | yes | spoken, overheard | 6.25 | first fetch `walk_stuck`, sat after the second fetch at tick 374 |
| 5414 | trace only, before the fix | yes | yes | **no** | spoken, overheard | 6 | the same: `walk_stuck` at (108,192), second fetch at tick 372 |
| 5415 | the fix | **no**: no turn-back, no grumble (cause not read) | no | no | none | 6.25 | first fetch still `walk_stuck`; the post retry fetched at tick 65 and he sat |
| 5422 | the fix | yes | yes | yes | spoken, overheard | 6 | the same: retry fetch at tick 65, seated |

**What the two runs with the fix show.** The post fetch retry heals Tom: in both games he was seated about 13 s after his first fetch failed (tick 65 against tick 16), long before row 2. The push re-walk does not help: all three re-issues end within a tick, at the spot where the first push stopped (the re-issued `goToAndStay` ends at once), so the first fetch still ends `walk_stuck`. Next round, read why the re-issued walk ends at once (probably the grid's nearest walkable cell to the home cell is where Tom already stands, the cell below the desk), and either drop `fetchPushShort` or make the seat move's walk follow a grid path. 5415 did not play row 2: read its `sanjay_log` and `events` in `tmp/stuck-proof/stuck-proof-5415.json` before counting it against the fix. Row 2 is 1 of 2 with the fix, so the 5 of 5 target is not met yet.

**Next steps (fresh context):** read 5415 and the push re-walk (above); run row 2 on five new games for 5 of 5; run the away proof (`node tools/playtest/needs-stuck-return-proof.mjs <gid> 3093 tmp/stuck-proof 232,176 300,40`) and check `away_check.dist` > 160 and the grumble is a picture, not overheard; run the tour on one game; then the train smoke on m01 and m02. Then `bin/test-js` in full and `tts_office_lines_test.rb`. Games 5423 to 5429 were made in this run and not driven (5428 is m01, 5429 is m02); they can be reused if the server is on the same DB. If everything passes, set this handover to ready for code review, with the summary of every engine change on the branch: slices 1 and 2, the settle guard, chair-aware re-route, chair ownership, post seat retry and this round.

## Handover (2026-11-15, round 4): not ready for review

**Cause of the round 3 wedge, confirmed** (seating trace and chair probe in the proof driver, games 5391, 5392, 5398). After his turn-back Sanjay stops idle at his post with his feet 32 to 35 px from his home cell (92,124), so the seat search looks from the home cell (`needsSeatRef`, within `POST_SNAP`). It runs once (`_seatStopKey` set), starts no seat move and no fetch. His own chair, tucked in when he stood, has its foot at (89,126): 4 px from his home cell and 35.9 px from Marek's post (53,128). Marek's post is more than 36 px from Sanjay's home cell, so the `free()` filter in `updateNeedsSeat` counted it as another NPC's post, and any chair within 36 px of it was Marek's. Sanjay's own chair was refused, he stood in the corridor mouth for good, and Marek waited on him.

**Fix** (`public/break_escape/js/systems/seating.js`):
- `a480ba800`: a needs NPC standing idle at its post tries its chair again every 4 s of needs clock (`POST_SEAT_RETRY_MS`, `postSeatRetryDue`). Never mid-conversation with the player, never away from the post (one try stays final there), and a retry only sits on a chair already in reach: it never fetches one.
- `42f64f738`: the nearest post owns a chair (`chairAtOtherPost`): a chair belongs to another NPC's post only when its foot is within `NEAR_CHAIR` of that post and nearer to it than to this NPC's own spot. This alone clears the round 3 wedge; the retry covers a seat move that ended short against a walker (5408: Sanjay stood 8 s, then sat).
- Node tests in `test/js/seating.test.mjs`: `postSeatRetryDue`, the retry sitting once the chair is free (not before 4 s, not mid-chat), no retry away from the post, `chairAtOtherPost` both ways, and the rig sitting with a neighbour's post 35 px from its chair.
- Driver: `0f9ea4272`, `19eeaf2d7` and the commit between them add the seating trace and the staff probes; `tools/playtest/needs-tour-regression.mjs` (new, in `a480ba800`) drives README rows 1, 3, 5 and 6 on one game.

**Open: Tom standing at his post (next step).** Two of six runs with the fix (5404, 5407) missed `see_look_round`, and 5404 also left Marek out: Tom stood idle and unseated near his post, (123,171) in 5404, and the turn-back grumble at the coffee had no seated listener close enough. In 5404 Sanjay's walk home then stuck behind standing Tom at (118,185) and Marek behind Sanjay (`return_stuck`). The probes show Tom starts the game with no chair within 48 px of his home cell (92,164); his chair is loose elsewhere and he sits only after a fetch. A retry never fetches, so a failed or timed-out first fetch leaves him standing for the rest of the stop. Leads: let the post retry fetch as well (rate-limited, say every 15 s, the fetch timeout), and read why Tom's first fetch fails (the driver's `staff_probes` and `staff_log`; the log has no fetch lines, so add an `npc_fetching_chair` and fetch-end trace). Lead (b) from round 3 (a standing idle NPC steps aside for a walker that has waited on it) is not built.

Live table (port 3093, keyless, headless setFPS(20), stand 232,176 unless noted):

| Game | Code | Row 2 played | see_turned_back | see_look_round | Grumble | Marek home (s) |
|---|---|---|---|---|---|---|
| 5391, 5392 | before the fix (diagnosis) | yes | yes | yes | spoken, overheard | never: Sanjay standing at (116,149) and (116,145), no seat move started |
| 5397 | retry only | yes | yes | yes | spoken | 6 (Sanjay fetched a chair) |
| 5398 | retry only | yes | yes | yes | spoken | never: Sanjay's chair refused on every retry (probe above) |
| 5399, 5400 | both fixes | yes | yes | yes | spoken, overheard | 6, 6 |
| 5403 | both fixes | yes | yes | yes | spoken, overheard | 6.25 |
| 5404 | both fixes | yes | yes | **no** (Tom standing) | spoken, overheard | **never**: Tom wedge above |
| 5407 | both fixes | yes | yes | **no** (Tom standing) | spoken, overheard | 6.25 |
| 5408 | both fixes, stand 300,150 | yes | yes | yes | spoken: still in earshot, as Sanjay grumbles at the coffee (about 204,269), not at his desk | 5.25 |
| 5410 | both fixes, stand 24,264 (out of earshot of the coffee) | no: Sanjay never set off, no turn-back | no | no | none, so the out-of-earshot picture is still not proved | 2.75 |
| 5409 | README tour (`needs-tour-regression.mjs`) | row 1 yes (69 s), row 5 yes (75 s), row 6 yes (50 s); row 3 **not proved**: the driver's Activity Board read returned false, so no fresh queue formed and the socket was switched off with nobody waiting (driver issue, not read further); one `stuck` line in the game | | | | |
| 5411, 5412 | train smoke m01, m02 | | | | | SMOKE OK, 0 failed |

Still to prove: row 3 (fix the tour driver's board read: the player probably has to walk to the board first), the out-of-earshot grumble picture (stand far from the coffee and make sure row 2 plays), and row 2 5 of 5 once Tom's standing is fixed.

Tests: `bin/test-js` 674 passed, 0 failed (on `a480ba800` and on `42f64f738`); `tts_office_lines_test.rb` 9 runs, 0 failures; `bin/rubocop` no offences.

## Handover (2026-11-15, third budget stop): not ready for review

Row 2 now plays: 2 of 3 runs give both `see_turned_back` and `see_look_round` with the spoken grumble. Marek's walk home after his cup is broken in every run that plays row 2 (0 of 4): a new wedge, cause found below, not fixed.

This run (`410f716f9` scenario and driver, `9d4eb9276` stall dump, and the handover commit after them):
- **Stand point.** The player standing in Marek's path is the intended yield (README tour step 7), so no engine change. The driver now stands at (232,176), in the office's east half south of Amara's desk, off both of Marek's legs; within 160 px of Sanjay's desk (about 140 px), and the grumble was overheard from there in 5382 and 5383. (64,224), tried first, is on Marek's outbound leg from his post (game 5378: `walk_stuck` at his post, the player in the way). README row 2's "where to stand" now names this spot.
- **see_look_round.** Slice 2 did not break it. A grumble out of earshot is a picture, and a picture still sets `s.saying`, which `_buildSpeakers` reads, so seated staff turn for a picture as for a line (OFFICE_LIFE_PLAN 12.7 choice 3). The 0 of 5 came from row 2 not playing: with no turn-back there is no grumble to look round at. The earlier driver also counted the grumble from `npc_chatted`, which a grumble never emits (it emits `npc_overheard`), so `sanjay_grumble` was always empty; fixed. Every run here with a turn-back had listen swivels (Amara, Tom, Marek) within a second of the line.
- **see_turned_back.** Row 2 needs the turn-back path. Sanjay's caffeine is set when Marek leaves his post; Sanjay starts the job at once, queues at his desk behind Marek's claim (`queued`, `windup`) and turns back when Marek starts using the machine (`turned_back avoid`, about 5 s later). That needs Sanjay free when Marek leaves. A work spell is never interrupted, and one that ends after Marek has reached the coffee chooses no job: `parked avoid` at selection, no `npc_turned_back`, no grumble (game 5378, tick 1124). Fix, scenario and driver: reading the Coffee Notice also sets Sanjay's `work` to 100, so no work spell starts during the beat; the driver reads the notice only when Sanjay and Marek are both idle; README row 2 tells a player to read it while Sanjay is not typing.
- **Driver watch bug.** The watch for Marek's cup counted any `used` from the start of the game, so row 1's cup and walk home ended the watch at once (5375, 5376). It counts only cups after the notice now.

**Open: the new wedge (next step).** After his turn-back Sanjay walks back to his post and stops short of his chair, standing at about (116,140) body centre, not seated (his chair, `chair-white-1-rotate8` at (77,115), is not immovable). He stands in the mouth of the only corridor to Marek's post (52.8,128): Sanjay's chair above (y 115 to 126), desk1 below (41 to 99 x 147 to 157), Tom seated at (81,158). Stall dump, game 5383: Marek's body (107,145) 20x10, velocity 0, `isMoving` false, nothing touching, `pathIndex` 0 of a 10-point path straight through Sanjay ([116,148] [116,140] [108,132] then west on y 132). The `includeHeld` search finds no way round (the gap above Sanjay is 9 px for a 10 px body), so it falls back to the plain path, and the local avoidance yields to a standing NPC that never moves; `return_stuck` after three tries, the 15 s back-off, again. Leads, in order:
  1. Why Sanjay did not sit. `updateNeedsSeat` tries once per stop (`_seatStopKey`); his feet are probably more than `NEAR_CHAIR` (36 px) from the chair's foot, or the seat move went `stuck` against Marek, and it is never tried again at this stop. A retry while the NPC stands idle at its post (say every few seconds, or when the blocker has gone) would clear the corridor. Check `needsSeatRef`'s `POST_SNAP` case with his home cell.
  2. Whether a needs NPC standing idle at its post should step aside for a walker that has yielded to it for a while.
  The earlier 4 of 4 at 6 s were runs where row 2 did not play, so Sanjay was seated (or away) when Marek walked home.

Also open: the grumble earshot pair live (one out of earshot as a picture), README tour rows 1, 3, 5 and 6, and a node test for the settle guard.

Live table (port 3093, keyless, headless setFPS(20)):

| Game | Stand | Row 2 played | see_turned_back | see_look_round | Grumble | Marek home (s) |
|---|---|---|---|---|---|---|
| 5375, 5376 | 64,224 | no (watch bug ended the run) | no | no | none | not measured |
| 5377 | 64,224 | yes | yes | yes | spoken, overheard | never: `return_stuck` at (118,150) |
| 5378 | 64,224 | no: Marek `walk_stuck` at his post (player on his route); Sanjay parked at selection | no | no | none | never |
| 5381 | 232,176 | no (queue cleared at 203 s; cause not read) | no | no | none | never: stuck at (109,138) |
| 5382 | 232,176 | yes | yes | yes | spoken, overheard | never: stuck at (108,133) |
| 5383 | 232,176 | yes | yes | yes | spoken, overheard | never: `return_stuck` at (117,150), dump above |
| 5387, 5388 | train smoke m01, m02 | | | | | SMOKE OK, 0 failed |

Tests: `bin/test-js` 673 passed, 0 failed; `tts_office_lines_test.rb` 9 runs, 0 failures; `bin/rubocop` no offences.

## Handover (2026-11-15, second budget stop)

Earlier: slice 1 (`0a5cdfd98`, `5a6525cf9`), slice 2 grumble earshot (`6c2eb2d6b`), proof driver (`9620e78f1`).

This run:
- `c11767214`, `74508d9e2`: mutters follow the grumble earshot rule. `_sayMutter` passes `always` only for `PRIORITY_MUTTERS` (`login_aloud`, the line the player is meant to overhear; its listening window opens when it is said). The workaround start lines (`wk_writes_down`, `wk_prop_door`, `wk_borrow`, `wk_share_login`, called from `npc-workarounds.js` `due()`) are now a picture out of earshot. The q42 test's premise was updated (Mei's chatter must be heard to hold the lock) and a new test covers both cases.
- Cause of Marek's wedge at (111-116, 138), found with a stall dump in game 5347: seated Sanjay's body (immovable, 85-107 x 122-133) touching Marek's top-left corner, and a loose swivel chair (`chair-white-2-rotate3`, a dynamic body, never in the world grid) north-east of Sanjay's seat. `handleNPCCollision` (npc-sprites.js) settled the walker for 300 ms on every collision; touching a body that never moves re-collides every frame, so velocity stayed 0 and `pathIndex` stayed 0 while a valid `includeHeld` path (13 waypoints, north round Sanjay) was loaded. Not a grid bug: the desk and seated chair were in the grid.
- `2608540fa`: no settling against a held (immovable) NPC body. `873504ef6`: the `includeHeld` search also avoids every chair body (`window.chairs`), with a node test.
- `873504ef6` (scenario): Sanjay's caffeine follows `npc_left_post:marek` only during the Coffee Notice beat (global `coffee_notice_beat`, set by reading the notice, cleared by Marek's cup). Row 1's queue used to set it, and with Marek queued Sanjay parked the need for two minutes without any turn-back, so row 2 found it parked (5347: parked tick 283, notice tick 403).
- `3681252d1`: the driver reads the notice only once Marek is idle at his post (a notice read while he walks home sends him straight back with no `npc_left_post`, so Sanjay never sets off).

Live proof so far (port 3093, keyless, headless setFPS(20)):

| Game | Driver | Notice closed | see_turned_back | see_look_round | Marek home after coffee (s) |
|---|---|---|---|---|---|
| 5349-5352 | old wait, before the settle fix | yes | no | no | never in 100 s, wedged at (108-113, 138) |
| 5358, 5359, 5360, 5362 | old wait, settle fix | yes | no | no | 6, 6, 6, 6 |
| 5361 | old wait, settle fix | yes | no | no | 45 (wedged on the player at the stand point, 172,196) |
| 5363, 5366 | new wait | yes | no | no | 80, 83 |
| 5364, 5365 | new wait | yes | yes | no | not measured (no cup in the window) |
| 5367 | new wait | yes | no | no | not measured |

Still open:
- **Wedge on the player.** The driver stands the player at the midpoint between Sanjay and the coffee (about 176, 192), on Marek's route. 5361 stalled there; 5363 and 5366 probably too (not yet confirmed from their JSON in `tmp/stuck-proof/`). The NPC-player collision handler (npc-sprites.js, the second "ALWAYS trigger settling" block, about line 1590) still settles every frame, the same loop as the seated body. Next: decide whether a stationary player counts as held for settling, or move the stand point off the route (README row 2 says "mid-office"), then re-run.
- **see_look_round 0 of 5, see_turned_back 2 of 5.** Not diagnosed. Read `sanjay_grumble` and `events` in the per-game JSON, and the needs log for Sanjay (`parked` with no `turned_back` means he chose no job because Marek already held the claim or queue: a park at candidate selection emits no `npc_turned_back`).
- No node test for the settle guard (`handleNPCCollision` is not exported).
- Train smoke on m01 and m02 not run this round (games 5356 and 5357 were made for it and not driven). Games 5341, 5343 and 5347 were diagnostic runs; 5353 failed to boot under load.
- The grumble earshot pair (one picture out of earshot, one spoken) was not re-proved live this round.

## What goes wrong

Needs walks (out to a coffee machine or cooler, and home again) move with `goToAndStay`. Three gaps let them wedge.

1. **False arrivals from a collision.** `npc-sprites.js` ends any `goToAndStay` walk whose NPC bumps another NPC or the player within two tiles of the destination, measured from the sprite's origin (about 16 px above the feet). The needs layer only accepts an arrival within `ARRIVAL_NEAR_PX` (48 px) of the destination by body centre, so a bump 49 to 64 px short is an `arrival` the needs layer rejects as far. On a walk home it re-issues once, then ignores the rest. The NPC stands still, `_watchReturn` re-issues after 3 s, the walk bumps the same colleague, and the loop runs for minutes (game 5260: Marek, `pathLeft 8, dist 52`, Tom standing beside him).
2. **Held and seated NPCs are invisible to re-routing.** A seated NPC (or one held still while using an object) has an immovable body. The world grid is built only on room load and door open, so it doesn't include them. The local avoidance (`_dynamicBlockers`) and the detour search (`_avoidDynamicPositions`) both skip immovable bodies. So every re-plan, from the stuck watch, a detour or a needs re-issue, returns the same path straight into the seated colleague or their chair (games 4232, 5060, 5061).
3. **Nothing gives up.** The behaviour layer's stuck watch re-plans the same path for ever. The needs layer re-issues the walk home every 3 s (`return_resumed`), and an outbound walk waits for the job deadline (`timeout`).

## The fix

**Re-route option (chosen): block other NPCs' bodies, seated and held ones included, in the walker's own search.** A needs walk that has stalled plans its next path with `avoidDynamic: { exceptSprite, includeHeld: true }`. That marks every other NPC body, the immovable ones as well, plus the player, as avoided cells for that one search, and never the walker's start or goal cell. If that search finds nothing (the only way through is past the body), it falls back to the plain search, as now. Blocking the bodies is better than picking a side cell first. A side cell is a guess about which way round is clear, and it needs a second leg, whereas the grid search already knows the walls and desks, so it finds the real way round or reports that there isn't one. The avoid points live only for the one search (EasyStar's additional points, cleared in the callback), so nobody else's paths change.

Where it applies, needs moves only (`_moveOwner === 'needs'`), so patrols and scripted moves are unchanged:

- the behaviour layer's stuck recovery (`_recoverFromStuck` re-plan) and the local detour (`_requestDetour`);
- a needs re-issue that asks for it (`moveTo(..., { reroute: true })`, stored as `_moveReroute`, used by the first plan of that move).

**No false arrivals for needs walks.** The collision handlers end a needs walk early only when its body centre is within `ARRIVAL_NEAR_PX` (48 px) of the destination, the radius the needs layer accepts. A bump further out leaves the walk going, so the avoidance and stuck watch can route round the body. Other moves keep the two-tile rule.

**Stall watch in the needs layer, both directions.** Every tick of a walk home, and of a `goto_item` or `goto_target` leg, the needs layer records the NPC's position.

- No movement of `RETURN_STILL_PX` for `RETURN_YIELD_MS` (3 s): re-issue the walk with `reroute: true` (`return_resumed` home, `walk_rerouted` out). The outbound re-issue keeps the job's deadline.
- A re-issue that leaves the NPC within `STUCK_SAME_PX` (24 px) of where the last one did counts as a try in the same place. After `STUCK_TRIES` (3) tries in the same place:
  - home: log `return_stuck { x, y, tries }` once for this return, then stand for `RETURN_STUCK_BACKOFF_MS` (15 s) before trying again (the colleague may have stood up or walked off);
  - out: fail the job with `stuck`, which walks the NPC home as any failed job does.
- Moving more than 24 px from the place clears the count.

## What stays the same

- Patrols, scripted `goToAndStay` moves and seating's chair fetch: no `reroute`, no `includeHeld`, the two-tile collision arrival.
- m01 to m10: their needs NPCs, where they have any, only behave differently where a walk is wedged now.
- The node stub world never stalls, so the sims-day log is unchanged.
