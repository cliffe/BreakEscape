# Sims tidy, round 4 delta review

Branch build/ol-sims-tidy, tip 120c322d0. Scope: fix commit e0867c2be (R3 minors) and the merge of main in 120c322d0.
Round 4, so blockers, majors and minors are all reported.

Counts: 0 blockers, 0 majors, 2 minors. Tour: rows 1, 3, 5, 6 all ok on the second fresh game; row 5 failed once on the first game (driver flake, see Tour).

## Findings

### m1. The 4 px give-up key resets at cell edges, so the infinite retry can still come back

public/break_escape/js/systems/seating.js:1879.

`Math.round(f.x / 4) + ',' + Math.round(f.y / 4)` is a rounding grid, not a tolerance. Two feet 1 px apart land in different
cells whenever they straddle a rounding edge (x of 5 and 6 give cells 1 and 2; 9 and 10 give 2 and 3; one pair in four
along each axis). When the key differs, the next line replaces `chair._doorSweep` with a fresh `{ tries: 0 }`, so a chair
whose foot is nudged between 5 and 6 never reaches `DOOR_SWEEP_TRIES` and the sweep glides it once a second for good,
logging `chair_out_of_doorway` each time and never the single give-up line.

Proof: the R3 test copied with the chair starting at x 5 and the nudge `5 + (++n % 2)` (otherwise identical) fails with
"three tries, not one a second", expected 3, actual 8. With 8 and 9 (the committed test) both feet fall in cell 2, so the
test passes. The probe file was not kept.

Same shape for the case "foot drifts A, B, A": any key change discards the counter, so the cap counts consecutive tries
in one cell, not tries per chair.

Smaller than the R3 minor it was meant to fix (it needs the nudge to straddle an edge) but the same failure. Fix options:
keep the counter on the chair and reset it only when the foot has moved more than a distance from the first-try foot
(store `fromX, fromY` in `_doorSweep` and compare with `Math.hypot(...) > 4`), which has no edges.

The committed test only covers the lucky pair; it should also run a nudge across an edge (5 and 6).

### m2. The Deadline Memo's wallMounted change has no test and no live read

scenarios/test_needs_sims/scenario.json.erb:525 area (`deadline_memo`, `"wallMounted": true`).

The board change had test/js/needs-sims-board-reach.test.mjs and a live read. The memo got neither. The tour rows (1, 3, 5, 6)
use the board and the rota, not the memo. If the memo is still short of reach, nothing fails. Add a case to
needs-sims-board-reach.test.mjs (or a sibling) asserting `wallMounted` on the memo and that the player's lowest stand
point on the floor reaches it, and one live read that the caffeine 20 mapping fires.

## Checked, no finding

- **player.js:1471 MOVEMENT_SPEED.** `MOVEMENT_SPEED` is imported (player.js:6) and passed as `{ speed }`. The test is a
  source regex plus a constants equality check; it proves the call site and the default, not the behaviour, which the
  existing 20/60/360 Hz helper tests cover. Acceptable.
- **test/js/easystar-version.test.mjs.** Requires exactly one script tag and the one vendored file name to match the
  version in show.html.erb. Would fail on a bump (stated by the R3 outcome). No problem found.
- **Sweep key, other effects.** `_doorNoSpotAt` still uses the exact foot (seating.js:1889), which is fine: that only
  de-duplicates one log line. The key is per chair, so two different chairs never share a give-up. Two genuinely
  different spots for one chair 1 to 3 px apart do share a give-up, which is the intent.
- **Scope.** e0867c2be touches only the four listed items, the R3 Outcomes text and tests. Nothing outside the slice.
- **Merge 120c322d0 interactions.** Main brought: rooms.js `applyScenarioObjectPosition` (tile x/y still win, and
  test_needs_sims objects use tile positions inside the room, so the memo at 8.1875, 0.6875 and the chairs are unaffected);
  interactions.js pickup-only types (workstations, launchers; none are in test_needs_sims); npc-needs.js `requestSoon`
  after a consume (carry path, a try/catch, no change to seating, doorways, reach or need decay); README note on reload
  replay; toast/HUD files. No change to seating.js, path-doorways, npc-pathfinding or reach code. Node run of
  seating, path-doorways, easystar-version and room-object-position: 103 of 103 pass.

## Tour (keyless server on :3093, PID 133785, stopped afterwards)

Command: `BOARD_ROUTE=direct node tools/playtest/needs-tour-regression.mjs <game> 3093 <out>`.
tools/playtest/needs-tour-rows.mjs is only the row 3 helper module; the driver is needs-tour-regression.mjs.

Game 6060 (fresh test_needs_sims):

- Row 1 (coffee queue): ok.
- Row 3 (socket off): ok. Board read first try, Marek and Tom queued, both turned back with reason off, both parked
  (no_source), grumbles heard (Marek line, Tom picture).
- Row 5 (water cooler chat): FAILED. Board read and park ok, then the wait timed out at 180 s with `hear_rota_exchange`
  missing.
- Row 6 (contractor): ok. Rota read, Sanjay social 35, exchange waited 131 s. Doorway sweep lines: 2 glides out
  and one `chair_in_doorway_no_spot` at (276, 87), no repeats, no mount_stuck. Some walk_stuck and return_stuck lines
  for Grace, Sanjay and Tom near x -50 (doorway area), as in earlier handovers.

Row 5 on game 6060: in the park step the player ended at (-36, 87) while the aim was (-196, 292) beside the cooler, so
the player was never at the cooler and the exchange was not heard. The tour driver's park did not get the player there on
that run (the earlier exchange did fire in row 6). Not tied to seating, doorway or reach code.

Game 6061 (second fresh test_needs_sims, same command):

- Row 1: ok. Row 3: ok (Tom and Marek queued, both turned back and parked, grumbles heard).
- Row 5: ok. Player arrived at (-197, 289) beside the cooler, exchange heard after 25 s.
- Row 6: ok, though the rota read needed a third approach (two tries ended "still-out-of-range", 72 px short, third read
  true). Doorway sweeps: 2, replans 0, one `return_stuck` for Tom at (-47, 85), errs 0.

Row 5's one failure is a driver positioning flake; the approach to the rota in row 6 is also fragile in the driver. Neither
touches the changes in this round. Worth a driver retry on park, but not a finding against the slice. Games 6060 and 6061
were created for this round; the server (PID 133785) was killed afterwards.

## R4 Outcomes

- **m1 fixed.** `sweepDoorwayChairs` (seating.js) now keeps the first-try foot per chair (`_doorSweep.fromX, fromY`) and counts
  a later try as the same spot while the foot is within `DOOR_SWEEP_SAME_PX` (4 px, Euclidean) of it. Only a move further
  than that starts a fresh count. The rounding grid is gone. The R3 test now starts at x 5 with the nudge `5 + (++n % 2)`
  (the edge-crossing case from this review). A new test moves the chair 5 px after the give-up (three more tries and a
  second give-up line) and then 4 px from the new anchor (no reset). Both fail with the source change reverted
  (`git apply -R` on seating.js only).
- **m2 fixed, with a finding.** needs-sims-board-reach.test.mjs now pins `deadline_memo` as `wallMounted` and checks its marked
  reach from the floor in front of it. The mark assertion fails without `wallMounted` (checked by removing it from the
  scenario). The sprite is 42 x 31 at y 22, so its top edge is 30 px from the lowest stand point (y 52): unmarked it is
  just inside the 32 px reach there, unlike the board (39 px). The test therefore does not claim an unmarked miss; it
  asserts the marked distance is never longer. No live read was taken (no server started).
- **Tour driver.** `parkByCooler` in tools/playtest/needs-tour-regression.mjs makes one re-approach when the first walk
  ends 24 px or more from the aim, and reports `retried`. Not run live (no server started).
- **Suites.** bin/test-js: 708 of 708 files pass. Rails: 2940 runs, 0 failures, 0 errors, 3 skips on the second run; the first
  run showed 1 error that did not recur (run while the JS suite was also running).
