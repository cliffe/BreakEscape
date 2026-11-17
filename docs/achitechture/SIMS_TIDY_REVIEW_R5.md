# Sims tidy review, round 5 (delta)

Branch build/ol-sims-tidy, tip 0fc7f1602. Scope: fix commit cd5956f74 (anchor-distance doorway give-up, seating and
deadline_memo tests, `parkByCooler` re-approach) and merge e52c7e18d. Nothing was fixed or edited.

Result: 0 blockers, 1 major, 3 minors.

## Findings

### M1. `parkByCooler`'s re-approach does not fire on the stall it was written for

tools/playtest/needs-tour-regression.mjs:245. The retry runs only when `!r?.ok && dist >= 24`. In the tour below, row 6's
park reported `ok: true` with the player at (-26, 87) against an aim of (-196, 292), about 260 px short, and
`retried: false`. `__test.moveTo` returned ok while the player had not arrived, so the guard never opened. The R4 row 5
failure had the same signature (player stuck near (-36, 87)). Failure scenario: the flake recurs in row 5, `moveTo` says
ok, no retry, the cooler exchange is never heard and the wait times out at 180 s, exactly as in R4. The line-250 `ok`
also reports true from `r.ok` alone, so the park result hides the misplacement. Row 6 does not need the cooler position
(its exchange was heard), so it passed; row 5 would not. Fix suggestion: retry on distance alone (`dist >= 24`), and compute
`ok` from distance only.

### m1. The anchor rule can still loop on a drift larger than 4 px in total

public/break_escape/js/systems/seating.js:1881-1884. The anchor is the first-try foot and is only replaced when the foot
is more than 4 px from it. A foot that wanders 3 px a try as a triangle wave (0, 3, 6, 3, 0, 3, 6 ...) resets at every
excursion past 4: the anchor goes 0 then 6 then 0, the count restarts each time, and the give-up (line 1894) is never reached.
A foot that drifts one way is bounded by the gap, so it ends; the back-and-forth case does not. Consequence is one glide
and one `chair_out_of_doorway` log line a second for as long as it lasts, not a freeze. Steady 3 px drift that stays
within 4 px of the anchor (0, 3, 0, 3 or 0, 1, 2, 3, 4) does give up correctly. Realism is low (a blocked glide would need
to alternate sides). Cheap bound if wanted: count total tries per chair since it last left the gap, or keep the anchor
for a few resets.

### m2. The seating tests do not cover drift accumulation or the anchor clear

test/js/seating.test.mjs:1451 and :1466. Both tests are sound: the 5/6 nudge fails under the old 4 px grid (5 and 6 fall in
different cells) and the 5 px and exactly 4 px cases pin the `>` boundary. Missing: a drift whose sum exceeds 4 px while
each step is under it (m1), and a test that the anchor is cleared (`chair._doorSweep = undefined`, seating.js:1873) once
the chair is out of the gap, so a chair pushed back into the same gap gets three fresh tries. The clear is correct by
reading; it is not tested.

### m3. The Deadline Memo test pins the mark, not the behaviour; no live read

test/js/needs-sims-board-reach.test.mjs:46-70. The only assertion that fails without `wallMounted` is the equality at
:57-ish (`memo.wallMounted === true`). The distance assertions pass marked or unmarked (the file's own comment says the
unmarked memo is already inside the 32 px reach from y 52). So the test cannot show the mark helps. No live read of the
caffeine 20 mapping was taken in R4, and this round's tour rows (1, 3, 5, 6) do not touch the memo either.

## Questions asked

- **Can the anchor rule loop forever?** Only with a foot that moves more than 4 px from the anchor, back and forth, in
  steps of 4 px or less (m1). A fixed anchor with accumulating drift cannot: the third try measures from the first-try
  foot, so drift beyond 4 px resets once and the new anchor holds.
- **Is the anchor ever cleared?** Yes, at seating.js:1873 when the chair has no spot (foot out of every gap rect). It is
  not cleared by the skip branches (seated, fetching, gliding, moving, player's chair), so a chair that sits out a spell and
  returns within 4 px of the anchor keeps its give-up. That is the intent.
- **Do the tests prove the behaviour?** The two seating tests do for the cases they name (79 of 79 pass in seating and
  board-reach files). They do not cover m1 or the clear (m2). The memo test proves only the mark (m3).

## Merge e52c7e18d

Files changed from main since the fix commit that touch engine code: public/break_escape/js/systems/npc-manager.js
(scripted video-call `interrupt`, `skipIfGlobal`, `_interruptAndOpen`, `_skipGlobalSet`), plus tests for those and the
validator, playtest skill scripts, and m02 office-life documents. Nothing touches seating.js, path-doorways, npc-needs.js,
npc-pathfinding or reach code. test_needs_sims has no video-call mapping with `interrupt`, so the scripted-call change does
not apply to it. No interaction found.

## Tour

Keyless server on :3093 from the worktree (PID 758199, killed afterwards, port confirmed closed). Fresh game 6070 from
new-game.rb, the only id driven. Command: `BOARD_ROUTE=direct node tools/playtest/needs-tour-regression.mjs 6070 3093 <out>`.

- Row 1 (coffee queue): ok, 68 s.
- Row 3 (socket off): ok. Board read first try; Marek and Tom queued, both turned back (reason off) and parked
  (no_source); grumbles heard (Marek line, Tom picture).
- Row 5 (water cooler chat): ok. Player arrived at (-197, 289) against aim (-196, 292); exchange heard after 25 s.
  `parkByCooler` retried: false (arrived first time).
- Row 6 (contractor): ok. Rota read first try, Sanjay social 35, exchange waited 129 s. `parkByCooler` retried: false,
  with the player at (-26, 87) while `ok` read true (see M1). Doorway sweep: 1 sweep, 0 replans, one
  `chair_in_doorway_no_spot` at (277, 87), no repeats; one `return_stuck` for Tom at (-24, 84); page errors 0.

The retry path was never exercised in this run, so the re-approach remains unproven in either direction.

## R5 Outcomes

- **M1 fixed.** `parkByCooler` (tools/playtest/needs-tour-regression.mjs) now re-approaches once whenever the player ends 24 px or more
  from the aim, whatever `moveTo` returned, and computes `ok` from distance alone. It reports `retried` and the final `dist`. Both
  row 5 and row 6 go through this helper. The other approach code in the driver (`read`, the coffee and socket walks) does not park
  against a fixed aim on trust of `ok`: `read` follows each move with an interact call and checks its result, so no change there.
  The retry is still unproven live; the next tour will show it.
- **m1 fixed.** seating.js gains `DOOR_SWEEP_MAX_TRIES = 9` beside `DOOR_SWEEP_TRIES = 3` (per anchor). The per-chair total and a
  `capped` flag survive anchor resets. At the cap the chair logs one `chair_in_doorway_no_spot` line and is left alone. The count
  clears when the foot leaves every door gap (the existing `_doorSweep = undefined`), which is also how a seated, picked-up or
  reloaded chair starts again.
- **m2 done.** Two seating tests added. The 0, 3, 6, 3, 0 oscillation test (9 glides, one give-up line, no further glide) fails on
  the previous seating.js (checked with `git apply -R`). The anchor-clear test passes on both, because the clear was already
  correct by reading; it pins the behaviour rather than a change.
- **m3 left as is.** The memo test still pins the mark only. The memo's reach is checked live in round 6.
