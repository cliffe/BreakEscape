# Code review R4 (needs NPC walking home stalls behind a standing NPC)

Delta review of `5bd2cba3a..HEAD` on fix/needs-return-npc-stall (5bb5cf541, 6f5427dfe, 3c465a21c, ee45093d6). Result: 0 Blocker, 0 Major, 2 minor, 3 nit.

## 1. R3 findings against the outcomes

| Finding | Verdict |
|---|---|
| m1 goal-side rule, one geometry | Resolved. Tests (a), (b), (c) assert the tier and `inLane(...) === null` on the real planner path, on three geometries plus the m08 start at 5 to 8 cells. They measure behaviour (distance from his lane), not the label alone. |
| m2 "Vector's height decides" | Resolved in DIAGNOSIS_M08.md (necessary, not sufficient). |
| n1 4 px bound | Resolved: 3.5 px, reason in the comment. |
| n2 duplicated lane width | Resolved, with the callers below. |
| n3 "timer" wording | Resolved. |

### n2: who passes `laneHalf`

Callers of `findWorldPath` with `avoidDynamic` are exactly four, all in npc-behavior.js, and all pass it: the search closure (:2044, the non-tight tiers), `_tightOpts` (:2072, used by both `_planMovePath` and the held search), and the rerouted ring tier in `_planMovePath` (:2084). No other file builds an `avoidDynamic` option (grep over public/break_escape/js).

Two details:
- :2044 also builds the `moving` tier (`includeHeld` false). There npc-pathfinding.js:670 passes `undefined` options, so `laneHalf` is dropped and the soft branch never used the rule anyway. The argument is dead for that tier. Harmless.
- A caller that omits `laneHalf` gets `laneHalf === null`, so the goal-side release is skipped at :565 and :598 and the whole ring stays. That is the old, stricter behaviour (more cells avoided), which at worst yields no ring path and drops to tight, then plain. Safe. `LANE_PX = (laneHalf ?? 0) + 1` is only reached in `standingRing`, which the `laneHalf !== null` guard short-circuits first, so the `?? 0` fallback is never used.

## 2. `reroute: true` on every return_resumed re-issue

Intact: the fallback. `_planMovePath` (npc-behavior.js:2083 to 2100) tries ring, then tight, then plain, and the plain call keeps `avoidRooms`. A rerouted plan therefore cannot fail where plain would succeed: reachability is unchanged. The obsolete reason (a player who held the walk has gone) does hold, because `_avoidDynamicPositions` reads body positions now.

Cost and worse-off cases:
- Floods. A rerouted plan with no ring and no tight path costs three searches instead of one. This happens per resume (at most every `RETURN_YIELD_MS` 3 s, bounded by `STUCK_TRIES` 3 per place, then the 15 s back-off and `RETURN_STUCK_MAX_BACKOFFS`). Note that `_moveReroute` stays set for collision re-plans of that move (npc-behavior.js:3486, :1603), so after the first resume every re-plan of that walk is three-tier too. See m1.
- Detour. A ring path can be longer than the plain path round a seated NPC or a desk-side body that is still there. It never goes through the leash rooms (`avoidRooms` is passed to every tier). The extra length is a few cells, and the alternative was the plain path through the same body's lane, which is the stall being fixed. Acceptable.
- Player who has gone: no cell is avoided for them, so the ring plan equals the plain one. No detour.
- Player still standing in the aisle: the ring plan now goes round the player instead of into them. Better, not worse.

stuck-walk test: `reroute === true` on the first re-issue with a reason that matches the change. It checks only the flag, but the flag-to-plan link is covered by the new R4 test, so the pair is meaningful.

## 3. Do the new tests prove behaviour

R3 m1 (a), (b), (c) and R4 do: they run real EasyStar through the real planner and assert the path's lateral distance from the standing body, with the old engine failing (a) and (c) per the outcomes. The R4 test takes the flag from the real needs layer and applies it through the real `goToAndStay`, so it fails if `reroute` is dropped at either step (the `mv.reroute ? ... : {}` spread makes a missing flag plan plain, which fails the ring assertion). Gaps are minor/nit below.

## 4. First walk home ring-first

Agree with leaving it off this branch. It changes every needs walk home in every mission (a flood and a possible detour on the common, unobstructed trip), needs its own mission-wide test and live run, and the residual is one hold of a few seconds before the first `return_resumed` (3 s) re-plans ring-first. The branch's targets are the 30 s loop and the 60 s abandon, and the live run shows neither (12 trips, no `return_stuck`, no `return_abandoned`, 11 of 12 without a hold). Record it in the backlog (the outcomes file already does).

## Findings

**minor m1: no cap on the flood cost of a failed ring search, now on every first resume.** npc-behavior.js:2083 to 2100, npc-needs.js:4274. A needs NPC whose home is boxed in by seated colleagues (ring and tight both fail) now runs three searches on the first resume where it ran one. The grid is the room-scale world grid; the call rate is bounded (3 s watch, 3 tries, 15 s back-off), so this is a one-off cost per resume, not a per-frame cost. Not fixed here; if a profile later shows a spike on a many-NPC mission, cache the "no ring path" result for the stall place. No change needed on this branch.

**minor m2: no test for a caller that omits `laneHalf`.** npc-pathfinding.js:565, :598. The safe default (whole ring stays) is the documented guarantee from R3 n2 but nothing pins it. A one-case test calling `findWorldPath` with `avoidDynamic` and no `laneHalf` on the (a) geometry, asserting the tier is not `ring` or the path is longer, would stop a later refactor turning `null` into a number.

**nit n1: dead argument.** npc-behavior.js:2044. For the `moving` tier the `laneHalf` is dropped at npc-pathfinding.js:670. Either say so in a comment or build the option only for `includeHeld` tiers.

**nit n2: R4 test duplicates planner setup.** test/js/npc-needs-return-standing-npc.test.mjs (R4 test) hand-sets `b.config`, `setVelocity`, `playAnimation`, `window.seating`. It works, but a missing `window.seating = null` restore leaks into later tests in the file; set it back in a `finally`.

**nit n3: `reroute` is now the default on every stall re-issue.** npc-needs.js:4274 joins :770, :4229 and :4322, all `reroute: true`. The `reroute` option of `_goHome` is then only false for first walks home, which is the case item 4 keeps out of scope; a comment at `_goHome` (:4198) saying so would help the next reader.

## Checks run

- `bin/test-js` (full): 825 files passed, 0 failed, 825 total.
- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors, 17 warnings. `git status` after: only `node_modules` untracked; no dungeon_graph files modified or created.
