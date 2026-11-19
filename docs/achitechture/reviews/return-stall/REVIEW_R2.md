# Code review R2: needs NPC walking home stalls behind a standing NPC

Branch fix/needs-return-npc-stall, `git diff main...HEAD` at 6934709f2 (engine f48c80af8 and f401b9ee0; tests and restore 82466fa7d; live table 6934709f2).
Read-only review. Probes: copies of the main and HEAD engines (`git archive`) driven by a scratch harness built from `npc-needs-return-standing-npc.test.mjs` (real EasyStar, real `_planMovePath`, the engine's 8 px waypoint advance, `nearestBlockerOnPath` for the 13 px lane). Not committed; outside the repo.

Full suite: 812 files passed, 0 failed.

| Severity | Count |
|---|---|
| B (blocker) | 0 |
| M (major) | 0 |
| m (minor) | 4 |
| n (nit) | 4 |

Recommendation: mergeable. None of the minors needs to hold the merge; m1 is the one worth a follow-up commit on this branch if it is cheap.

## 1. R1 findings

| R1 | Status | Notes |
|---|---|---|
| M1 tight tier end rule | Resolved | `avoidTight` (npc-pathfinding.js:565-583) skips non-body cells near the start and goal for soft bodies. The test "pinch on the way and a home between two chairs" fails on f48c80af8 with tier asserts stripped and passes on HEAD. |
| M2 no live proof | Resolved, with a caveat (m3) | 11 trips on the new engine, 0 return_stuck, 8 at Vector's stalling height, 3 of them placed through the bridge. |
| M3 test_npc_needs changed | Resolved | `git diff main...HEAD -- scenarios/test_npc_needs` is empty. n4 (guard ink and voice) went with it. |
| m1 test motion model | Resolved; the todo is judged in section 4 | The test steps with the 8 px advance and covers 1 px clear and two other sizes. |
| m2 search count | Partly: tier recorded, no cap | See section 3 and m2 below. |
| m3 detour tight tier | Resolved | `_requestDetour` (npc-behavior.js:2029-2068) runs held, tight, plain; tested with real EasyStar and in npc-local-avoidance.test.mjs. |
| m4 player and seated bodies | Resolved | Player: `avoidBody(pb, false, true, true)` (npc-pathfinding.js:588) keeps the ring in the tight tier; test "R1 m4" fails on the old engine. Seated chairs avoided by design, documented. |
| m5 scope | Resolved | Comment at npc-behavior.js:2079-2082 and the new section of OFFICE_LIFE_STUCK_RETURN.md. Note the detour tier change (m3) reaches further than `_moveReroute`: see m2 below. |
| m6 leash | Resolved | "R1 m6" in npc-needs-reroute-held.test.mjs asserts the leash on all three calls. |
| n1 stale line numbers | Not addressed | tmp/rs/DIAGNOSIS.md still cites npc-needs.js:4198 for `_watchReturn` (now 4224). Untracked file, harmless. |
| n2 narrow aisle asserts the stall | Resolved | The test now asserts the calls and `_planTier === 'plain'`. |
| n3 timers | Resolved | `plan()` clears its timer. |
| n4 guard ink | Resolved by M3 | |

## 2. The soft-body rule

The rule is consistent with local avoidance. `_dynamicBlockers` (npc-behavior.js:1737-1758) skips immovable NPCs and lists the player and movable NPCs. `avoidBody(sprite.body, true, !!sprite.body?.immovable)` (npc-pathfinding.js:594) makes exactly the bodies the lane ignores soft, and keeps the whole ring or reach for exactly the NPC bodies the lane stops for. The player is soft but goes through the pass rules (`_notePlayerBlock`), so a near-end plan beside the player does not loop. A colleague who stops being held between plan and walk is a movable body in the lane; the next detour gives it its whole ring, so that case corrects itself.

Width check: for 20x10 bodies the tight reach is 24 px across and 14 px up and down; for the legacy 18x10 body, 23 or 22 by 14. Every cell centre the tight tier leaves open is at least 14 px from a standing body's centre on one axis, and a diagonal step between two open cells keeps more than 20 px from the centre, so no tight path enters the 13 px lane.

Can a walk now fail to plan where main planned? The worst result is still the plain path, then the existing stall watch: re-issues every 3 s, `return_stuck` with a 15 s back-off, `return_abandoned` after two back-offs (npc-needs.js:4224-4306). No new stuck or abandon path exists, and the near-destination arrival (npc-behavior.js:1436-1445: within 32 px for 1.5 s) still ends a walk that gets close. Probes, main against HEAD (open office floor, home with chairs beside it, a standing 20x10 NPC near it):

| Geometry | main | HEAD |
|---|---|---|
| Standing NPC 20 to 34 px east of the home, no chair | ring | ring |
| Standing NPC 22 to 34 px east, chair west of the home | ring | ring |
| Standing NPC 20 px east (touching at home), chair west | ring, from the north | plain, from the east through the NPC (m1) |
| Standing NPC 10 to 12 px south (overlapping the home), chair north | ring | plain; both end at home |
| Standing NPC 14 to 16 px south, chair north | ring | tight |
| Standing NPC on the home (8 to 12 px off) | plain | plain |
| Start pressed against a standing NPC in a 24 px corridor, or in a dead end with him at the mouth | plain | plain |

Scenario scan (rendered ERB, NPC start positions, pairs within 56 px where one has needs): test_needs_sims office tom/marek 34 px; m10 forward_post darren/sofia 32 px; m03 reception_lobby zainab/yusuf 46 px; m05 break_room niamh/bernadette 45 px; m08 operations_floor julian/agnieszka 48 px (both seated); m04 main_entrance ibrahim/joanne 24 px (both seated, so soft while seated; 24 px standing is a ring case on HEAD). m02 and m07 have no such pair. No posted pair sits in the 20 to 21 px band of m1.

## 3. Performance

Searches per call, each able to rerun once with `ignoreSeated` when a failed search touched a seated cell (npc-pathfinding.js:697-702):

| Call | main | HEAD |
|---|---|---|
| `_planMovePath`, rerouted, ring finds a path | 1 | 1 |
| `_planMovePath`, rerouted, ring fails | 2 (one flood) | 3 (two floods if tight fails) |
| `_requestDetour`, needs walk, held finds a path | 1 | 1 |
| `_requestDetour`, needs walk, held fails | 2 | 3 |

A failed EasyStar search floods every reachable cell in one synchronous `calculate()`. Bench on the vendored easystar-0.4.4 with a sealed goal: 34 ms on a 120x120 open grid, 51 ms on 200x200, 190 ms on 300x300; a successful search is under 1 ms. Real world grids are mostly wall, so the flood is over walkable cells only, but a loaded floor of 10k to 15k walkable cells is in the 30 ms range per flood.

How often: the plan tiers run on a rerouted needs walk (stall re-issue every 3 s, wedge recovery every 4 s, `_needsPathRecalc`). The detour tiers run on every needs walk that meets a body ahead (not only rerouted ones): at most every `AVOID_REPATH_MS` (400 ms) while not given up, and again straight after each back-off step (700 ms) while a yielder backs out. In the stuck case nothing moves, so the same failing floods repeat. See m2.

## 4. The open todo (start exactly touching, 8 px advance)

Measured on HEAD with the test's geometry (40 px aisle, centres 20 px apart): the tight path is (260,180), (268,188), (260,196), (252,196); `nearestBlockerOnPath` finds no blocker on it, so local avoidance does not stop the walker. Stepping it with the 8 px advance, the boxes overlap on one axis by about 1 to 2 px, but the depth of the overlap (the smaller axis) is 0.02 px at 2 px per tick and 0.32 px at the worst point of a continuous walk; at 3 or 4 px per tick there is no overlap. An advance of 6 px or less, or starting 21 px apart, gives none.

That is a corner kiss of a third of a pixel. Arcade separation resolves it in one step without a visible shove, and the walker is not stopped. It does not matter in play.

Recommendation: leave it as a documented limit, and turn the todo into a passing test that bounds it (penetration depth at most 1 px, no lane stop), so a later change that makes it worse fails. Do not shrink the advance on rerouted walks (it touches every rerouted walk for a sub-pixel graze) and do not widen the tight margin (loses the 40 px aisle, which is the m08 case). Correct the numbers in the todo comment, the doc's Known limit and the outcomes note: "overlaps by a pixel or two" is the overlap along one axis; the depth is 0.3 px. The outcomes note also says local avoidance "treats the touching start as a stop"; on this path it does not (see n2).

## 5. Do the tests prove behaviour; is the live proof sound

Tests. The outcomes table is honest about the tier record: with tier and call-count asserts stripped, the m08 path, the m08 detour, M1 (chairs), m1 (1 px clear and sizes) and m4 (player) all fail on f48c80af8 and pass on HEAD; against main every case fails. "R1 m3" only shows itself through the call count, which is fine for an order test. The m08 fixture is an open rectangle with Vector alone, but it reproduces the reported y 164 leg on the old engine, which is the fault. The probes in section 2 would make good extra cases (m1, m4 below).

Live proof. Sound as far as it goes: fresh games, no globals or game rows edited, tier sampled, and the placed rows test the stalling height on purpose. Two limits (m3): there is no same-session contrast on the old engine at the placed heights, and game 9411 trip 1 still held about 6 s at the old spot with two `return_resumed`, unexplained.

## Findings

### m1. A standing NPC touching the home side now forces the plain path where main planned round him
- Where: npc-pathfinding.js:549 and 594 (standing bodies never soft), 579 (tight reach kept near the goal).
- Probe: home with a chair 14 px west, a standing 20x10 NPC 20 px east (touching the walker's box at home). Main: ring path from the north, home. HEAD: ring fails (his ring closes the home's north and south neighbours, the chair closes the west), tight fails (his reach plus the half-cell margin closes the same cells), plain path from the east, which runs into him about 37 px out, outside the 32 px near-arrival radius. Local avoidance stops the walker, the detour also fails, and the stall watch takes over: re-issues, `return_stuck`, back-off, and `return_abandoned` if he does not move.
- Scope: a band of about 2 px (20 to 21 px from the home centre; at 22 px HEAD finds the ring path again), only with a chair or wall closing the far side. No posted pair in the missions sits in it (section 2). A colleague who stops to stand beside a seated worker's chair could.
- Fix, if cheap: near the goal only (not the start, which is the m08 case), give a standing body the lane rule instead of the full reach: avoid a cell within `END_RING_CELLS` of the goal when the boxes would overlap or the cell centre is within `AVOID_LANE_HALF_PX + 1` of his centre on the cross axis. At the goal the near-arrival timer ends the walk even if the lane check stops it within 32 px. Add the probe as a test (main ring, HEAD plain today). Otherwise document it as a known limit beside the touching-start one.

### m2. Failed tiers repeat their floods while nothing moves, and the detour change reaches every needs walk
- Where: npc-behavior.js:2029-2068 (`_requestDetour`, `held` is any needs walk), 2077-2103 (`_planMovePath`); npc-pathfinding.js:697-702 (seated rerun).
- Each failing tier is one synchronous flood of the reachable grid (about 30 ms on a floor-sized grid, more on a large map); a stuck walker that falls to plain now costs two floods per re-plan and two per detour, up to four with seated reruns, instead of one or two. The detour runs after every 700 ms back-off step, so a stalled needs NPC can cost about 60 ms of main-thread time every 700 ms until it clears, per walker. Two or three NPCs stuck at one cooler or doorway at shift change multiply that. The m3 change also gives the tight search to every needs detour, not only rerouted walks, which the doc section does not say.
- Is the R1 m2 cap needed: not for merge (the m08 run recorded no tight tier at all, and a successful search is under 1 ms), but a cheap guard is worth adding before office life spreads to more missions: per walker, remember "held and tight failed" for this goal cell and a signature of the other bodies' cells, and skip those tiers until the signature changes. Before that, log a timing (`performance.now()` round the tier chain) in the next live run to see the real flood cost on m08 or test_needs_sims.
- Also add one line to OFFICE_LIFE_STUCK_RETURN.md: the local detour of any needs walk runs held, tight, plain, whether or not `_moveReroute` is set.

### m3. The live proof has no same-session contrast and one unexplained hold
- Where: scenarios/m08_the_mole/office_life/LIVE_RETURN_STALL.md, first section.
- 0 of 8 trips at the stalling height stalled on HEAD, against 4 of 9 on f48c80af8 earlier (Vector's sprite at y 119 to 123, body about y 156 to 160, so all nine were at the stalling height; this also shows the height alone did not decide a stall there, contrary to the diagnosis). The difference is suggestive (Fisher exact, one-sided, about p 0.08), not conclusive, and the two sets ran on different days with different drivers.
- Game 9411 trip 1 held about 6 s at sprite (506,132), the old hold spot, with two `return_resumed`, then got home. The note calls it cleared but does not say what held her.
- Failure scenario: the fix lands and a remaining hold at (506,132) is a second cause that still reaches `return_stuck` with a different Vector position or start cell.
- Fix: rerun the placed rows (Vector body at y 152.7, 157, 150) three times each on f48c80af8 and on HEAD in one session, same driver, and log the planned path and blocker list at any hold over 3 s (diag.js already does this). One paragraph on the 9411 trip 1 hold.

### m4. Committed docs and code point at gitignored files
- Where: npc-pathfinding.js:528 ("DIAGNOSIS_M08"); docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md new section ("see tmp/rs/DIAGNOSIS_M08.md"); test/js/npc-needs-return-standing-npc.test.mjs (two references to tmp/rs/REVIEW_R1_OUTCOMES.md); LIVE_RETURN_STALL.md (tmp/rs/trip2.js, runtrip2.sh, trips2.jsonl, DIAGNOSIS_M08.md). `/tmp/*` is in .gitignore, so none of these exist on main or in another checkout.
- Fix: copy DIAGNOSIS_M08.md (and the driver scripts if they are to be reused) into docs/achitechture/reviews/return-stall/ next to the review rounds, and point the references there. This round copies REVIEW_R1.md, REVIEW_R1_OUTCOMES.md and this file only.

### n1. Todo and doc overstate the touching-start clip
docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md (Known limit), the comment above the todo test, and REVIEW_R1_OUTCOMES.md (m1 row) say the box clips the guard's corner "by a pixel or two". The depth is 0.02 px at 2 px per tick, 0.32 px at worst (section 4). Replace with the depth and make the todo a bounded passing test.

### n2. The outcomes reasoning for the todo is wrong on local avoidance
REVIEW_R1_OUTCOMES.md, m1 row: "local avoidance already treats the touching start as a stop". On that path `nearestBlockerOnPath` returns null (the first segment heads away from the guard), so the walker is not stopped. The conclusion (leave it) still holds, for the reason in section 4.

### n3. The detour's third tier is called "plain" but is not the plain path
npc-behavior.js:2043-2045, 2055. The detour's 'plain' tier still avoids moving bodies with their whole ring (`avoidDynamic` without `includeHeld`), unlike `_planMovePath`'s plain tier, which avoids no bodies. Both now write the same word into `_detourTier` and `_planTier`. A live reader comparing the two records may take them for the same search. Call it 'moving' (or note the difference in the doc section).

### n4. tmp/rs/DIAGNOSIS.md line numbers (R1 n1) still stale
Untracked; fix only if the file is copied into docs (m4).

## Tests

`bin/test-js` (full suite) on 6934709f2: 812 files passed, 0 failed, 812 total (the exact-touch case is a node:test todo inside a passing file).
