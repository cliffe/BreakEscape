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
