# M03 review, round 9 (delta)

Scope: commit d317c30a0 (`seating.js` `unseatNPC`, answering R8 m1 to m3) and commit 28dac1dab (`npc-needs.js` `_sideBlocker`, answering R7 M1, M2, N1). Read-only review of the diffs and the code they touch; no suites run (a full train check runs separately).

## Findings

### m1 (minor): a hide mid seat move or mid fetch leaves the needs re-sit gate set

`public/break_escape/js/systems/seating.js:1633-1641` (the `!st` branch) ends the seat move and the fetch on an instant unseat, but unlike the seated branch (1652-1659) does not clear `_seatStopKey`, `_seatTriedAt`, `_seatRetries`, `_seatGaveUp`. Both a seat move and a fetch are started from `updateNeedsSeat` after `_seatStopKey = stop.key` is set (`seating.js:2381-2382`, then `startSeatMove` / `startFetch`).

Failure scenario: a needs NPC is walking to its chair (or fetching a swivel chair) at a non-post stop, and a script hides it. After show, `updateNeedsSeat` sees `retry = (_seatStopKey === stop.key)`; away from the post `postSeatRetryDue` is false, so it returns at `seating.js:2352` and the NPC stands for the rest of that stop. This is the same symptom R8 fixed for the seated case. At the post it retries after the retry interval, and the interrupted attempt has spent a retry (or a fetch retry). Needs NPCs only, scripted hide only, standing-only outcome, so minor.

Fix: in the `!st` branch, when `opts.instant` and either `_seatMove?.needsStop` or `_fetch` was ended, apply the same five-field reset (a small `resetNeedsSeatGate(behavior)` helper shared with the seated branch). The `_seatMove` record carries `stopKey` (used at 2272), so the test for "needs move" is `m.stopKey`.

### n1 (nit): the non-step seat-move branch of the new instant condition has no test

`npc-hide-seated-breath.test.mjs` pins the step stage (line 221) and the fetch (197, 212), but no test hides an NPC mid walk or mid roll-in seat move (`stage !== 'step'` with `opts.instant`). That branch was already reachable before this commit (non-step always ended), so behaviour is unchanged; only the pin is missing. Add one test that also asserts the chair's `seatedBy` is cleared. Worth adding with the m1 fix.

### n2 (nit): the `_sideBlocker` pre-check rebuilds `taken` by hand

`npc-needs.js:3459-3465` copies the `taken` loop from the real call (3398-3401). I compared the inputs and they agree today:

- cells taken: the real call for the re-routed user `o` runs after `job.dest = cell` is set for `s` (3419), so its `taken` is every other user's dest on the same target, including `cell`. The pre-check seeds `[cell]` and adds every user other than `s` and `o`. Same set.
- leash: both pass `from: npcPos(o)`.
- avoidRooms: both use `_avoidRooms(o)`.
- the capacity and `taken.some(near cell)` guard at 3397-3402 is true for `o` in the real call because `s.dest = cell`.

So the two cannot disagree now. The risk is future drift if one loop is edited. Suggest a `_takenFor(s, extra)` helper used by both. Optional.

## Checks answered

- Seating, scope of the hide: the `_fetch` branch can only run for a needs NPC (`_fetch` is set only by `startFetch` from `updateNeedsSeat`). `cancelMove` is called only when `_goToStayDest` is set while `_fetch` exists, and any other move already cancels a fetch, so that destination is the fetch's own. A non-needs NPC (no `_fetch`) takes neither branch. The player is untouched: no player state is read or written. The step-move end on hide restores `immovable` and zero velocity, which is what a hidden body needs.
- Seating, gate reset is limited to `opts.instant && needsStop`, and `needsStop` is set only on needs seats, so scripted seats keep `_seatTried = true`. Correct.
- Swap, M1: frozen users are skipped (`s.mode === 'frozen'` is the real field, used at 1446 and 4616). Correct.
- Swap, M2: the pre-check returns no blocker when the re-routed user has no side cell, so no swap and no `no_beside_cell` failure for it. Correct (see n2 for input parity).
- Tests: the swap tests 4 (frozen) and 5 (no side cell) assert no `pair_side_swap`, no new move for the frozen user and no job failure, so each fails against the pre-fix code (swap would fire). The seating tests assert the cleared gate fields, the released reservation, the dropped walk and the ended step move, each of which was left as-is before. I did not run them; the fail-before claims in the two write-ups are consistent with the diffs.

## Counts

blocker 0, major 0, minor 1, nit 2.

## Verdict

Both follow-ups do what their reviews asked, with no new failure mode. Nothing a player can hit in any mission. Fix m1 (with the n1 test) in the next round; n2 optional.
