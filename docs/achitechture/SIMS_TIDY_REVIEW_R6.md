# Sims tidy review, round 6 (delta)

Branch build/ol-sims-tidy, tip 230c13335. Scope: fix commit 230c13335 (`DOOR_SWEEP_MAX_TRIES`, the per-chair `total`
and `capped` state and the give-up flag carried across anchor resets in seating.js; `parkByCooler` retrying on distance;
the two new seating tests). Nothing was fixed or edited. seating.test.mjs: 75 of 75 pass.

Result: 0 blockers, 1 major, 2 minors.

## Findings

### M1. Row 6 fails: four NPCs jam the kitchen doorway, the player walks into the jam and Marek never reaches the cooler

Seen at tools/playtest/needs-tour-regression.mjs:301-303 (row 6 park and wait); the cause is not in 230c13335 and I did
not locate it. In game 6081, Tom, Grace, Rosa and Sanjay piled up on the kitchen side of the kitchen doorway (x -56 to
-7, y 83 to 97) from 183 s, while the player was still in the office (stall snapshots show the player at (41, 69) to
(256, 175) until 205 s). The doorway sweep did not fire on that gap (its only lines are for the lounge doorway chair at
(277, 89)), so no chair is involved. At 205 s the row 6 park walked the player from the rota stand point into the jam:
both grid searches, from (-19, 73) and then from (-33, 87) to (-196, 292), returned no path (`len 0`, NPCs avoided), and
the player stopped at (-37, 87). Marek, the NPC the row waits for, then logged `walk_rerouted` and `walk_stuck` at (10 to
15, 84) in the doorway behind the jam. `see_outcast` was missing after 181 s. Stuck lines in the run: ten (`return_stuck`
or `walk_stuck`) between 195 s and 311 s, all at the kitchen doorway. R5 saw one (`return_stuck` for Tom at (-24, 84)) and
R4's row 5 failure stalled at (-36, 87), so this is intermittent and has recurred. Failure scenario: any run where three
or more needs NPCs return through the kitchen doorway together; the tour row fails, and in play the kitchen stays shut to
NPCs for minutes. It counts as a major because the tour is the branch's acceptance check, even though this fix commit did
not cause it.

### m1. A capped chair stays ignored, silently, after a real move inside the gaps or a trip out while it is in use

public/break_escape/js/systems/seating.js:1886 and :1897-1902. On an anchor reset `total`, `capped` and (when capped)
`gaveUp` carry over, so a capped chair gets no glide and no log line wherever it next rests in any gap. The only clear is
line 1874, which runs only when a sweep sees the chair resting, not skipped, with its foot outside every gap. Checked
with scratch copies of the test rig, after the 0, 3, 6, 3 oscillation has capped the chair (9 glides):

- A: chair moved 25 px within the gap to (-20, 85), where a clear spot exists: 0 further glides, 0 further log lines,
  `capped: true`.
- B: chair sat on (skipped) while moved to (200, 200), then back into the gap at (-10, 80), then released: 0 further
  glides, 0 further log lines.
- C: chair resting outside the gap for one sweep, then back in: one fresh glide. The clear works.

So to the question asked: a chair an NPC carries out and later back in starts again only if one sweep sees it at rest
outside the gaps. If it is sat on, fetched, mounted, gliding, moving or the player's chair for the whole time it is
outside (an NPC fetches it and sits, then it is fetched straight back; the player sits on it and rolls it out and back),
or if someone shoves it from one part of a gap to another, the cap holds and nothing is logged. Before 230c13335 a move
of more than 4 px gave three fresh tries. Reaching the cap needs nine failed glides first, so this is rare, and the chair
can still be pushed out by hand. A cheap fix would clear `total` and `capped` when the anchor moves by more than a chair
width, or whenever a skip branch is taken. The new tests do not cover a capped chair leaving the gaps (C) or moving
inside them (A).

### m2. The cooler re-approach repeats the same walk, so it cannot get past what stopped the first one

tools/playtest/needs-tour-regression.mjs:246-249. The retry now fires on distance, as R5 asked, and the result is honest
(row 6: `retried: true, ok: false, dist: 259`). It calls the same `moveTo` to the same aim moments later from the same
place. In row 6 the first walk stopped because the grid search found no path through a doorway full of NPCs; the retry
searched again with the same NPCs in place and also found none. A retry helps only with a transient stall. If the stall
recurs, the driver could wait for `return_stuck` lines to clear, aim at the second candidate cell, or record the stall and
let the row's own result stand.

## Tour

Keyless server on :3093 from the worktree (PID 1045440, killed afterwards; port confirmed closed). Fresh game 6081 from
new-game.rb, the only id driven. Command:
`BOARD_ROUTE=direct node tools/playtest/needs-tour-regression.mjs 6081 3093 <out>`. setFPS(20), fixed steps on.

- Row 1 (coffee queue): ok, 68 s.
- Row 3 (socket off): ok. Board read first try; Tom and Marek queued, both turned back (reason off) and parked
  (no_source); grumbles heard (Marek line, Tom picture).
- Row 5 (water cooler chat): ok. Board read first try. Park: `retried: false, ok: true, dist: 3`, player (-197, 289)
  against aim (-196, 292). Exchange heard after 25 s.
- Row 6 (contractor): FAILED. Rota read on the third try (two `still-out-of-range` stops at (41, 38), then read from
  (-19, 42)); Sanjay social set to 35. Park: `retried: true, ok: false, dist: 259`, player (-37, 87) against aim
  (-196, 292). `see_outcast` missing after 181 s (M1).
- Doorway sweep: 2 lines, both for office_chair-white-1-rotate8_153 at the lounge doorway (277, 89): one
  `chair_in_doorway_no_spot`, then one `chair_out_of_doorway` to (205, 121). No repeats. Replans 0, page errors 0.

## Deadline Memo, live

Same game, a fresh page load. The memo's sprite spans (262, 22) to (304, 53). The floor under its left half opens at
grid y 72. The player was walked under the memo's left edge as far towards the wall as the floor allows: sprite (274, 46),
feet (274, 77), the lowest stand point below it. From there `__test.interact('deadline_memo')` returned `mode: direct`,
`inRange: true`, distance 0 (the wallMounted measure), `picked.matches: true`, confirmed by its gameDisplay overlay. The
player did not move. Amara's caffeine read 57.17 before and 19.67 after, which is the mapping's `set caffeine 20` minus
under a second of decay. Page errors 0. The memo is in reach and its mapping applies.

## R6 Outcomes

### Head-on stalls, A/B and after the fix

A head-on stall here is two NPC bodies with a goto job within 40 px of each other in the kitchen passage box
(x -70..32, y 70..100) for 8 s or more. Every run is the tour (`needs-tour-regression.mjs`, rows 1, 3, 5, 6) on a
fresh test_needs_sims game, keyless server on :3093, setFPS(20) with fixed steps on.

| Engine | Scenario | Games | Head-on stall | Row 6 failed |
|---|---|---|---|---|
| branch before the fix (230c13335 line) | branch | 6093, 6094, 6095, 6099, 6100, 6104 | 4 of 6 | 4 of 6 (the same games) |
| main baseline (8dce8782f) | branch, copied in | 6101, 6102, 6103 | 1 of 3 (6102) | 1 of 3 (6102) |
| main baseline (8dce8782f) | main | 6096, 6097 | 0 of 2 | 0 of 2 |
| a2d2c64ab (back-off steps, pin) | branch | 6115, 6116, 6117, 6118 | 0 of 4 | 2 of 4 (6116, 6117) |
| b5a337735 + driver ade76b7fe (yield hold, pin tie-break) | branch | 6134, 6135, 6136 | 0 of 3 | 0 of 3 |

Row 3 fails on every main-baseline game, with either scenario (caffeine about 88 at the board read against 9 on the
branch); not looked into. Main's own scenario sends less traffic through the kitchen, which is why the A/B ran the
branch scenario on the main engine. The stall rate there (1 of 3) shows the head-on yield bug is main code, made more
frequent by the branch's busier kitchen.

Final runs, per game (park `retried` from the driver's `parkByCooler`):

| Game | Row 1 | Row 3 | Row 5 (park retried) | Row 6 (park retried) | Head-on stalls | Stuck lines |
|---|---|---|---|---|---|---|
| 6134 | ok (68 s) | ok | ok (false, dist 2) | ok (false, dist 6), outcast seen after 73 s | none | 0 |
| 6135 | ok | ok | ok (false, dist 2) | ok (true, dist 5), outcast seen after 119 s | none | 3 |
| 6136 | ok | ok | ok (false, dist 3) | ok (false, dist 6), outcast seen after 81 s | none | 0 |

In 6135 the row 6 park waited the full 20 s for the lane twice and twice stopped at (-27, 87) and (-32, 87), in the
mouth of the passage, before the third try (a tile north of the aim) parked at (-192, 258). Marek logged one
`walk_stuck` at (-15, 84) at t 918 and Tom two `return_stuck` near (-20, 12); the row still passed. The lane wait
holds the player back from a busy lane but cannot stop it entering one that fills while it walks.

Page errors 0 in all three. Games 6131 to 6133 (probably those ids) were made by new-game.rb with their id lines cut
from the output, and were never driven.

### Yield fix

a2d2c64ab made a back-off a whole 700 ms step, followed at once by the next one, and pinned a yielder that could not
gain ground. That cleared the two-NPC stall, but a lane simulation of three NPCs (one walking east against two walking
west, driven by the real `_handleBlockerAhead`) showed two more ways to lock up:

- A yielder's step took it just past `AVOID_LOOKAHEAD_PX`. The blocker was no longer ahead, `_avoid` cleared, the
  yielder walked back in and met the same NPC after a fresh wait. It repeated for 90 s with nobody through.
- Two pinned NPCs facing each other both stopped yielding, so both held for ever.

b5a337735: the yielder records `yieldTo` and `yieldUntil`; for up to `AVOID_YIELD_HOLD_MS` (10 s) after its first step
it keeps treating that NPC as ahead out to `AVOID_YIELD_HOLD_PX` (96 px, three tiles), so it keeps backing off instead
of walking back into it. `pinned` is recomputed at the end of every step, so a pin clears as soon as a step gains
ground. When both sides are pinned (or neither), the usual tie-break `avoidanceYieldsTo` decides, so exactly one
yields. In the simulation the three-NPC cases clear in 15 to 35 s with 3 or 4 yield handovers. The test
`R6: three NPCs in a one-body lane all get through, ...` in test/js/npc-local-avoidance.test.mjs runs that case: it
passes on b5a337735 and fails on a2d2c64ab (no NPC reaches its target in 60 s).

### Known limit: two NPCs against two in one lane

The same simulation with two NPCs walking each way through a one-body lane does not clear, on either version. The
cause is the design rather than the simulation: yielding is pairwise. The front pair settles who yields, but the NPC
behind the yielder sees the yielder as a body ahead and waits for it rather than backing off with it, so the queue
retreats in short steps between waits, the 10 s hold runs out, pins flip, and the front pair meets again. A 20 s or
30 s hold does not fix it. A fix would need queue-aware yielding (a follower behind a backing-off NPC backs off too),
which is beyond this round.

Exposure: test_needs_sims has five or more needs NPCs that use the kitchen passage (Tom, Grace, Marek, Sanjay, Rosa),
so two against two can happen there, although Marek avoids everyone and turns back rather than enter, and the Sanjay
and Rosa pair set off one after the other, not together. The three final games had no head-on stall of any kind; the pre-fix jams (6093: four NPCs and the
parked player) were not broken down by walking direction, so whether any was two against two is not known. m02_ransomed_trust
has three needs NPCs, so its needs walks alone cannot make two against two; sis01_healthcare has none.

### Row 6 causes (6116, 6117)

Both failed for reasons outside the yield code; the driver part is fixed in ade76b7fe.

- 6117: the driver set Sanjay's social need to 35 straight after the rota read, while Grace was drinking at the
  cooler and Marek (who avoids everyone) waited. Sanjay went to chat with Grace; his `npc_use_started` armed Rosa's
  coupled cooler break, hers re-armed his, and the pair held the cooler from t 811 to 1187. Marek's first walk then
  timed out in kitchen-lane traffic (the 20 s minimum needs-walk deadline), and Sanjay's avoid armed `outcast_pending`
  only at t 1523, after the row's 180 s wait had ended. The scenario already raises Sanjay's social need when Marek
  leaves for the cooler (his `npc_left_post:marek` mapping), so the driver's bump was never needed. ade76b7fe drops it
  and records only the level.
- 6116: the same early bump and cooler hold, plus the player's park walked into the lane between Tom (-33, 84) and
  Grace (3, 84); its NPC-avoiding search found nothing (path length 0) twice, and the player stood at (-30, 87) for the
  whole wait. Sanjay (t 990 to 1038) and then Marek (thirst walk from t 987, timed out at 1075 at (4, 84)) could not get
  past. ade76b7fe makes `parkByCooler` wait up to 20 s for the lane (x -70..48, y 64..108) to clear before each of up
  to four tries (the aim, then a tile west, north, south and east of it), and walks a player still in the lane back to
  where it started.

### Main code written up, not fixed

- **Sanjay and Rosa cooler coupling** (test_needs_sims scenario.json.erb, Sanjay's mapping near line 734 and Rosa's
  near line 965, 30 s cooldowns each): whoever starts using the cooler first sets the other's social need, and each
  start re-arms the other, so the pair can hold the capacity-2 cooler for minutes. Any NPC that avoids '*' (Marek) is
  shut out for the whole time. A cap on the pair's repeats, or a longer cooldown than the use time, would break the
  loop; this is scenario design and needs a decision on how the showcase should look.
- **20 s needs-walk deadline** (npc-needs.js, the walk deadline's 20 s minimum near line 3370): a walk through the
  one-body kitchen lane with traffic in it can take longer than 20 s once yields and back-offs run, and a timed-out
  walk gives up the errand. A deadline that grows with the number of bodies met, or pauses while yielding, would fit
  busy lanes better.

### Suites

On 9d400d750 (b5a337735 plus the lane test): bin/test-js 712 of 712 files pass (npc-local-avoidance 34 of 34);
Rails, run alone afterwards, 2940 runs, 48173 assertions, 0 failures, 0 errors, 3 skips.
