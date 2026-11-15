R4: 0 B, 0 M, 4 m

# Office life stuck return: code review R4 (delta)

Scope: the R3 fix delta, `git diff 955992654..0085d868b -- public test` on build/ol-stuck-return (tip `0085d868b`), read against `OFFICE_LIFE_STUCK_RETURN_REVIEW_R3.md` (Outcomes). Read only; no servers started. Nothing was run: this is a read of the diff and the code round it.

## Checks with no finding

- **M1 (nudge reported back).** `goToAndStay` (npc-behavior.js:3121 to 3129) sets `_lastNudge = null` on every call, then records the landing only when `_needsNudgeSafe` passed and `_nudgeToWalkable` moved the body. `_nudgeToWalkable` returns the unchanged point for under 2 px or over the cap, so the `to.x !== at.x` test is right. `npcBodyPos` and the needs layer's `npcPos` are both `body.center`, so the landing and the stall positions share a frame. `behaviorManager.goToAndStay` calls the behaviour synchronously, so the adapter reads `_lastNudge` after the move that set it. `_goHome` and `_moveForPhase` now return the `moveTo` result on every path that moves (the early returns give `undefined`, which `_markNudge` ignores).
- **`_samePlace`.** Within 24 px of the first stall or of the landing, nothing between. `_stallTry`, `_watchWalk` and `_abandonReturn` all use it. The back-off seed `{ ...s.stall, tries: 1 }` keeps the centre and the landing, so a slow creep is a new place only after 24 px in total from both. `_watchReturn`'s `tries === 1` reset of `returnBackoffs` still fires on a genuinely new place.
- **Leftovers.** `STUCK_NUDGE_REACH_PX` and the `nudged` mark are gone from `public` and `test` (the only `nudged` left is the `moveTo` result field, npc-needs.js:4173 and :5558). The two older review documents mention the constant as history only. In `_abandonReturn` the dropped `nudged` and `reach` locals have no remaining readers. `RETURN_FINAL_REPLANS` and the other imports in the test are all still used.
- **State resets.** `returnLate` and `returnAbandon` are cleared together, on arrival (npc-needs.js:1476 to 1477) and at job pick (:1521 to 1522), and nowhere else, so they cannot disagree. `s.stall` (with `nx`, `ny`) is cleared by a fresh `_goHome`, by `_abandonReturn`, and replaced wholesale by `_stallTry` in a new place. `job.stall` and `rerouteGrace` live on the job. `a.player` lives on the abandon object, which each abandon replaces, so it is never sticky.
- **m3 floor.** `deadline > clockMs` makes the equality tick fail the job as before. The new test sets the deadline to land exactly on the stall tick; on the old code the floor would move it 10 s on, so `failAt` would differ from `rerouteAt`. It fails on the old code.
- **Player-blocked bound.** With the player standing still, the same wedge gives `again` true, so the abandon is final and the next walk waits `RETURN_FINAL_REPLAN_MS` from the abandon time. Walks are at least 60 s of needs clock apart, plus the walk's own cycle (about 50 s of stall time). So it is bounded at one walk a minute or slower, not tighter. A first abandon in a different place adds one immediate re-plan per late walk, so the rate is at most two walks per cycle, not unbounded. Intended bound confirmed.

## Findings

### m1. Quick re-plans are never counted, so two wedges that alternate on successive re-plans repeat for ever

npc-needs.js:4120 and :4133, :4141, :4144. `again` compares only with the previous abandon (one deep), and a not-`again` abandon sets `replan: true`, which the selector runs on the next tick with no wait and no count (`returnLate` moves only on a late, non-`replan` walk). The R3 m1 fix caps late walks per return, but a chain of quick re-plans never reaches a late walk.

Failure scenario: two routes home, each held by a body that stays put (a held NPC in a doorway at A, one by the printer at B, more than 24 px apart). The walk abandons at A (`replan`), the quick re-plan takes the route that wedges at B (not `again` against A, so `replan` again), and the next re-plan from B takes the A route. Each step is a full cycle (about 50 s of re-issues and two 15 s back-offs), with `return_stuck` and `return_abandoned` logged each time, for the rest of the session, and `returnLate` stays 0. The R3 m1 test alternates only via late walks, so it does not see this.

Fix: count every abandon per return (`s.returnAbandons`, cleared with `returnLate` at arrival and job pick) and treat the abandon as final once it passes a small cap (for example `RETURN_FINAL_REPLANS + 2`), whatever the place; or keep a short list of recent abandon places and treat a return to any of them as `again`. Add a test with three alternating places and quick re-plans only.

### m2. A player-blocked abandon after the late cap is reached is ignored, so the NPC parks

npc-needs.js:1527 and :4141. Both guards test `returnLate >= RETURN_FINAL_REPLANS` before looking at `a.player`. The uncounted walk is allowed only while the count is under the cap.

Failure scenario: three late walks are counted (a real blocker, now gone). The third abandons while the player is standing beside the NPC (a new wedge, or the player walked into the same corridor). `a.player` is true, but `returnLate` is already 3, so no further walk is allowed and the NPC idles off its post until its next job, which is the "blocker who steps away" case R3 m2 set out to cover. The new test sets the player near from the start, so the count is 0 throughout and never reaches the cap.

Fix: in both places let a player-blocked abandon bypass the cap: `a.replan || a.player || (returnLate < RETURN_FINAL_REPLANS && elapsed >= RETURN_FINAL_REPLAN_MS)`, keeping the 60 s wait for the `player` case (split the time test out), and the same in `_replanAbandoned`. Add a test that reaches the cap first, then sets the player near before the last abandon.

### m3. The seat give-up expiry cap is never given back, even after the NPC sits

seating.js:2078 and :2080. `_seatGiveUpExpiries` resets only when the stop key changes (:2072). For an NPC whose jobs are all at its own desk the key stays `at:<home>` (seating.js:1787 to 1796), so the three expiries are used up over a session whatever happens in between. Expiries also count when a later job (rather than the clock) ends the give-up.

Failure scenario: a chair is blocked for six minutes early in the session (three expiries, each followed by a seat give-up). The obstacle clears and the NPC sits fine. Two hours later the chair is pushed under a table for a minute: the next give-up starts with `_seatGiveUpExpiries` already 3, so it lasts until the key changes, which for this NPC is the rest of the session. That is the R2 m3 problem the expiry was added to remove.

Fix: set `_seatGiveUpExpiries = 0` (and `_seatRetries`, `_fetchRetries`) when the NPC actually sits at the stop, or count only clock expiries, not job-ended ones. Add a test that sits, then gives up again and expires.

### m4. The new adapter paths have no test against the real classes

test/js/fixtures/needs-stub-world.mjs:29 to 37 and :41 re-implement `moveTo`'s `{ nudged }` result and `playerBlocks`. Nothing in `test` exercises `NPCBehavior.goToAndStay`'s `_lastNudge`, the adapter's `moveTo` result, or `createEngineWorld().playerBlocks`. A rename of `_lastNudge`, or a `_playerBeside` signature change, would pass every unit test and fail only in a live game (the live re-check does not look at either field).

Failure scenario: the adapter reads `behaviour(id)?._lastNudge` after the behaviour is reset, or `playerBlocks` is called on an NPC without a body, and the needs layer silently takes the "refused nudge" and "player not beside" paths. Tests stay green.

Fix: add two small tests with a stub behaviour object on `window.npcBehaviorManager`: one drives the real `NPCBehavior.prototype.goToAndStay` with `_needsNudgeSafe` true and false and checks `_lastNudge` and the adapter result (landing, then null); one checks `playerBlocks` true and false against `window.player` at 40 px and 80 px, and false with no body.

## Test quality

| Test | Fails on the old code? |
|---|---|
| R3 M1, refused nudge keeps 24 px | Yes: the old mark reached 56 px, so the 28 px point counted as a fourth try; `_samePlace` also does not exist. |
| R3 M1, nudge kept, no re-centre | Yes: the old seed re-centred on the nudged position and had no `nx`. The `returnBackoffs` assertion needs the 50 px move to be a new place on both sides, which it is. |
| R3 m1, alternating late walks | Yes: `returnLate` never moved, so `starts` stays 0. It tests late walks only (see m1). |
| R3 m2, player beside | Yes: the old count reached 3 and stopped, so the `final` abandon count assertion fails. It starts with the player already near (see m2). |
| R3 m3, deadline tick | Yes, as above. |
| R3 m4, seating expiry | Yes: the old code reset `_fetchRetries` and `_fetchTriedAt`, and left `_seatGaveUpAt` set. |
| R2 M1 rewrite | Yes on the new nudge reporting; it needs `setNudge`, which the old code ignored. |

## Outcomes

- **m1: fixed.** `s.returnAbandons` counts every abandon per return (quick re-plans included), cleared with `returnLate` at arrival and at job pick. Past `RETURN_MAX_ABANDONS` (6) the abandon is final whatever the place, so the quick re-plan stops and only the capped late walks follow. Test: `R4 m1`, wedges alternating between two places on quick re-plans, which ends with at most 6 + 1 + 3 abandons and no walk for 20 minutes after.
- **m2: fixed.** A player-blocked abandon bypasses `RETURN_FINAL_REPLANS` in the selector and in `_replanAbandoned`, but still waits `RETURN_FINAL_REPLAN_MS`, and is still not counted. Test: `R4 m2` reaches the cap with alternating late walks, then abandons with the player beside it and checks the walk comes after the 60 s wait with `returnLate` unchanged.
- **m3: fixed.** `updateSeatedNPC` sets `_seatGiveUpExpiries`, `_seatRetries` and `_fetchRetries` to 0 on every update while the NPC is seated at its stop. Test: `R4 m3` in `seating.test.mjs`.
- **m4: tested, no big scaffolding.** New `test/js/npc-needs-nudge-adapter.test.mjs` builds a behaviour on the real `NPCBehavior.prototype` (as `npc-behavior-arrival.test.mjs` does) and uses the real `createEngineWorld`: `_lastNudge` landing, then null when refused (player beside) and when no nudge was asked; `moveTo` returns `{ nudged }`; `playerBlocks` true at 40 px, false at 80 px, false with no behaviour.
