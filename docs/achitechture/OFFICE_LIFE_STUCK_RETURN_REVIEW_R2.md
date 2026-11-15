R2: 0/1/7

# Office life stuck return: code review R2

Reviewed: the R1 fix delta `git diff ee9d938cb..8a061ccb2 -- public test scenarios tools`, then the whole branch `git diff 97b8dbb25...8a061ccb2 -- public scenarios` once, on build/ol-stuck-return at `8a061ccb2`. Read only; nothing was run. The reach of the change is as R1 described it: the needs-layer changes reach lab_physical_pentest and the test_* needs scenarios; m01 to m10 see `nearestBlockerOnPath` and the settle guard only.

## Answers to the brief's questions

1. **m3 (reroute and nudge passed live).** Live needs re-issues now plan with `includeHeld` from the second re-route on, on every back-off re-issue, on `_replanAbandoned`, and on the `arrival_far` re-issue (`npc-needs.js:740`, also passed through now). A failed held-aware search falls back to the plain path in `_planMovePath` (`npc-behavior.js:1718`), so more failing searches cost one extra search each and cannot leave the walker without a path. Two things can change: a held-aware path can be much longer (round every chair), see m6; and the nudge has two faults, M1 and m1. Nudge loops on their own are bounded: the nudge runs only on `tries === STUCK_TRIES`, and a second nudge from a walkable cell only re-centres it (at most about 6 px on the 8 px grid), so it does not drift.
2. **settleOnContact refactor.** Apart from `otherHeld`, nothing was dropped. `gameTime` was block-scoped inside the old `if`, and nothing below reads it. The second settle block (`npc-sprites.js:1473`) is unchanged and reads the restored `otherHeld`. The semantics are the same: an immovable body returns false (held, no settle), anything else settles. `otherNPC?.body` adds optional chaining where the caller has already checked `otherNPC`. A node test of `handleNPCCollision` is feasible, see m7.
3. **Timers and resets.** The seat and fetch retry counts reset on a new stop key, and the key goes to null whenever `needsStop` is null (`seating.js:2050`), so every departure resets them. A reload rebuilds the behaviour objects, the needs state and the chairs (no needs state is persisted), so nothing carries over. A conversation blocks retries (`inChatWith`) and leaves the counts alone, which is fine. Two can stand or retry too long: the seat give-up lasts for the whole stop (m3), and the final abandon now re-plans every 60 s with no end (m2).
4. **M1 plain-detour fallback.** Yes, in principle. The plain detour ignores chairs and seated bodies, and `_dynamicBlockers` skips immovable bodies (`npc-behavior.js:1549`), so the adopted detour can lead into a seated body. The walker then slides along it (settle guard) until the stall watch re-routes. That is the pre-branch behaviour, reached only after the held-aware search found nothing. It is still better than the old give-up, which squeezed into the player. See m5 for a middle step.
5. **Back-off cleared on a new job** (`npc-needs.js:1504`). No side effects found. During the job `_watchReturn` does not run (mode `job`), and the walk home after it calls `_goHome` without `keepFarFlag`, which resets the same fields (`npc-needs.js:4018`). The clear is redundant but harmless, and `s.stall` is reset by that `_goHome` too.
6. **Test quality.** See m7.

## Findings

### M1. A nudge longer than STUCK_SAME_PX starts a new place, so the walk home can re-route for ever
`public/break_escape/js/systems/npc-behavior.js:3102` (nudge in `goToAndStay`), `public/break_escape/js/systems/npc-needs.js:4082` and `:4117` (`_stallTry`)

`_nudgeToWalkable` can move the body up to `NPC_STUCK_NUDGE_MAX_PX` (one tile, 32 px) when its cell is grid-blocked. `_stallTry` measures each stall against `s.stall.x/y`, the first stall in that place, with `STUCK_SAME_PX` 24 px. A nudge of 25 to 32 px therefore makes the next stall a new place (tries 1), and with the m1 fix `returnBackoffs` resets as well.

Failure: the player pushes Marek into a desk's clearance, so his body centre is in a blocked cell whose nearest walkable cell is about 28 px away (place A). Stalls at A count 1, 2, 3; the third re-route nudges him to A'. The re-planned path from A' heads home through the same wedge, and he is held back at A. A is more than 24 px from A', so the count starts again at 1. Tries never pass `STUCK_TRIES` in either place, so `return_stuck`, the back-off and `return_abandoned` never fire. That gives a `return_resumed` every 3 s and a 28 px teleport every third re-route for as long as the player stays: the game 5431 loop that round 7 bounded. Before m3 there was no nudge, so he stayed at A and the count reached the back-off. The outbound `_watchWalk` (`:4160`) has the same reset, but its job deadline bounds it. The walk home has no deadline. Not seen live. It needs a blocked cell more than 24 px deep, which is the wedge case the nudge is meant for.

Fix: after a nudge, carry the place across it. For example, `_goHome`/`_moveForPhase` with `nudge` could set `s.stall.nudged = true`, and `_stallTry` would then count a stall within `STUCK_SAME_PX + NPC_STUCK_NUDGE_MAX_PX` of a nudged place as the same place. Alternatively, cap the nudge at `STUCK_SAME_PX` for needs moves. Add a stub-world test that moves the NPC 28 px between stalls after the nudge and checks that `return_stuck` still comes.

### m1. The needs nudge ignores the player beside the walker
`public/break_escape/js/systems/npc-behavior.js:3102`

The behaviour layer's own recovery never nudges with the player within 1.5 tiles: `_checkPathStuck` re-arms on `_playerBeside` (`:1391`). The needs nudge has no such guard, and `findNearestWalkableStartCell` only knows the static grid. Failure: Marek wedged between a desk and the player, with his cell blocked, is reset up to 32 px onto a walkable cell that the player's body covers. Arcade separation then shoves the player or snaps Marek back, which is a visible bump. When his own cell is walkable, the nudge only re-centres him on it (at most about 6 px) and does nothing useful. Fix: nudge only when the current cell is grid-blocked, and skip the nudge when `_playerBeside` holds or when the chosen cell centre is within a body radius of any `_dynamicBlockers()` entry.

### m2. The final abandon now cycles every 60 s for ever, and the constant's comment says it cannot
`public/break_escape/js/systems/npc-needs.js:1508`, `:4107`, comment at `:48`

The late re-plan fires once per `RETURN_FINAL_REPLAN_MS` with no cap. With a place that stays blocked (a player standing in a doorway while away from the keyboard, or a seated colleague who never stands), each minute brings a walk, re-routes with one nudge, two 15 s back-offs and another final abandon. The NPC visibly walks into the same spot for about half of each minute, with a burst of log lines, for the rest of the session. The comment on `RETURN_STUCK_MAX_BACKOFFS` still says "so the cycle can never run for ever". Fix: double the late interval on each final abandon in the same place (60, 120, 240 s), or skip the late re-plan while a body from `_dynamicBlockers` is within 48 px of `returnAbandon` (the other option R1 offered). Update the comment either way.

### m3. seat_gave_up lasts for the whole stop, and retries can be used up by a passing obstacle
`public/break_escape/js/systems/seating.js:2056` to `:2063`, `:2075`

`_seatGaveUp` clears only on a new stop key. For an NPC whose jobs are all at its own desk, the key stays `at:<home>` through idle, own-desk use and the returning tick (`needsStop`, `:1772`), so after a give-up it stands for the session until a need sends it elsewhere. A retry is counted whatever ended the seat move. Failure: the player stands on the work cell beside Sanjay's desk, outside conversation, for about 12 s. Three seat moves end short, `seat_gave_up` is logged, and Sanjay stands at his desk for minutes after the player has gone. Fix: clear `_seatGaveUp` and the counts after a long quiet time at the stop (for example 120 s of needs clock), or do not count a retry whose seat move ended with the player or a moving NPC within a tile of the work cell.

### m4. The detour fallback chain does not check that its avoidance state is still current
`public/break_escape/js/systems/npc-behavior.js:1695`

The callback checks only `this.patrolTarget !== target`. If `_avoid` was cleared (the blocker left, `:1586`) or replaced while the held-aware search ran, the chain still runs the plain search on the stale `a` and adopts its path. This predates R1, but M1 now chains two searches. It only matters if `findWorldPath` calls back on a later tick (the async mode the comment at `npc-pathfinding.js:556` mentions). In sync mode the chain finishes inside the call. Fix: in the callback, return early when `this._avoid !== a` (after clearing `a.pending`).

### m5. No middle step between held-aware and plain detours
`public/break_escape/js/systems/npc-behavior.js:1704`, `public/break_escape/js/systems/npc-pathfinding.js:453`

The fallback goes straight from "avoid every chair and seated body plus a clearance ring" to "avoid none of them". Failure: an aisle of tucked-in chairs whose rings close it, but whose bodies leave a gap. The plain detour can then pass through a seated body's cell (question 4), although a path avoiding the bodies, without their rings, exists. Fix: try `includeHeld` with rings off (body cells only) before the plain search, in `_requestDetour` and `_planMovePath`. This is worth doing if the live re-check shows `, plain` detours followed by contact with seated staff.

### m6. Live re-issues now take held-aware paths that may be much longer, under the old deadlines
`public/break_escape/js/systems/npc-needs.js:4160`, `:5491`

Before R1, live needs re-issues planned the plain path, and row 2's 5 of 5 was on that behaviour. A held-aware path round every chair in an open-plan room can be several times longer. `_watchWalk` keeps the job's original deadline across the re-route, so more outbound legs may end in `timeout`. The walk home has no deadline, so it only takes longer. Fix or check: in the live re-check, count `timeout` job failures and compare re-route path lengths (`marek_searches` already logs points found) with the plain ones. If they are long, extend the deadline by the extra path length on a held-aware re-route.

### m7. Test gaps
`test/js/npc-local-avoidance.test.mjs`, `test/js/npc-needs-stuck-walk.test.mjs`, `test/js/seating.test.mjs`

- The `otherHeld` regression is still uncovered: `settleOnContact` is tested in isolation, but nothing calls `handleNPCCollision`. A test is feasible. Export `handleNPCCollision` (`@private exported for unit tests`, as elsewhere). `npc-sprite-style.test.mjs` already imports `npc-sprites.js` under node. Stub `window.npcBehaviorManager.getBehavior` and set `window.rooms = {}`: `isDirectionSafe` returns true with no `wallCollisionBoxes`, and a missing `roomData` skips the waypoint insert. Drive it with a behaviour in state `patrol` with a `patrolTarget`, one waypoint and `_stopOnArrival` false, against a movable and an immovable other body. That path runs every line that reads `otherHeld`, so a dropped local throws in the test.
- M2: no test that a new stop key resets `_seatRetries`, `_fetchRetries` and `_seatGaveUp`, which is what keeps a give-up from lasting the session. The fetch cap and the `fetchedBy` stamping are tested only through the helpers, not through `updateNeedsSeat`.
- m2: the test checks one late walk home. It does not check that the next comes only after another `RETURN_FINAL_REPLAN_MS`.
- m3: nothing covers the nudge together with the stall place (M1 above), or the nudge with the player beside (m1).
- m7 job-pick test: it asserts the cleared fields, but the `_goHome` after the job would clear them anyway (question 5), so it would pass without the change. Make it check something visible instead, for example no `return_stuck` back-off hold on the walk home after the job.

## Checked and found sound

- `nearestBlockerOnPath` with `startIndex`: the in-place reads, the reused `_pathSegs` (only the first `n` read), the tie break and the result copy give the same answers as the copying version. `left <= 0` returns null, where an empty slice did too.
- The m1 reset (`tries === 1`) is right with the back-off seeding `s.stall` at tries 1: a stall there again is tries 2 and keeps the count.
- The fetch claim uses the needs clock on both sides. A fetch cancelled by a move leaves a 60 s claim on a chair in mid-floor, which is acceptable.
- The m8 scenario mappings match `npc_turned_back` and `npc_job_failed` with `targetId`, and set only the beat global.
- Earshot gating for grumbles and the printer-off grumble (the user's "same earshot approach") is unchanged since R1: priority mutters stay spoken, and unheard lines take nothing from the bag.
