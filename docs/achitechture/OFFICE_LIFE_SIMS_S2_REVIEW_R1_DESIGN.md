# SIMS-2 review round 1: design and engine view, with live proof

Slice SIMS-2 (OLMP E6, plan 5.2): an arrival counts only where the NPC is. Diff reviewed
11b563d51^..e54332514 on `build/ol-sims-2` (no drift in npc-needs.js, npc-behavior.js, seating.js
or npc-needs.test.mjs up to 1c30bf6d5). Keyless server :3095, headless chromium. Scratch
`officelife-sims/s2-review-r1-design/`.

## Verdict: 0 blockers, 2 major, 4 minor

The core fix is right and matches plan 5.2: distance first at 48 px, move ids second, the no-id
transitional rule, one re-issue then `arrival_far` failure for a job phase, one re-issue then
`_watchReturn` for a walk home. No legitimate arrival was rejected in a natural run. The two majors
are a seating interaction the plan did not foresee (chair fetch during `using`) and proof claims in
the README that the evidence does not support.

## What was checked and holds

- **Plan 5.2 rules.** `_acceptArrival` (npc-needs.js:681-714): synthetic own-post/home arrivals
  bypass; id mismatch → `arrival_ignored`, dropped, no re-issue; null id treated as current; then
  48 px against `_phaseDest` (job.dest, which `_moveForPhase` sets to the queue cell in the queued
  phase, or `s.home` when returning). Far job arrival re-issues once (`_farPhase`), second fails
  with `arrival_far` via `_failJob` (cooldown, walk home). Returning re-issues once and never fails.
- **Positions compared are the same frame.** The payload's x,y is `npcBodyPos()` (body centre),
  the same as `world.npcPos`; `job.dest` is the approach cell in feet-centre world coords.
- **Can a legitimate arrival be rejected?** `approachCell` always returns a walkable cell
  (`findNearestWalkableWorldCell`, radius 1 for `useFrom`, 3 otherwise), and the behaviour fires an
  arrival only at the path end (< 8 px from the last node) or after 1.5 s within a tile (< 32 px).
  So a real arrival lands within 32 px of the cell whatever the object's size. Only a cell the path
  cannot reach (a `besideCell` with no route, a `visit.cell` in a wall) now fails, which is the
  intent. Natural run game 4244: 19 `using` entries for six NPCs, maximum 13 px from the target's
  approach cell (measured independently of `job.dest`), every one in the object's own room, zero
  `arrival_far`, zero `arrival_ignored`, no page errors.
- **Seated own-desk jobs.** `_moveForPhase` still queues a synthetic arrival at the post
  (npc-needs.js:3195); Tom, Amara and Sanjay at their own PCs entered `using` at 1 to 13 px in 4244.
- **Scripted moves and patrols.** A scripted `goToAndStay` has no owner, so `onExternalMove`
  suspends needs and clears the queued arrival; its own arrival is dropped at `onArrived` (owner
  check). It also resets `_moveId` to null. Patrols never emit `npc_arrived`.
- **Freeze.** The freeze calls `cancelMove` (clears `_moveId`, no arrival) and deletes the queued
  arrival; unfreeze re-issues with a fresh id.
- **Door closed mid-walk, room unload.** A blocked path fires no arrival (the behaviour retries),
  so the job still ends on its deadline as before. With the sprite unloaded `_tickNpc` returns
  before reading `_arrivals`; the stored payload position is used when it resumes.
- **Stubbed short path on the fixed build (game 4239, my run).** Full sequence:
  `63 arrival dist 336` (office, 222,136) → `64 arrival_far` → re-issue → `106 arrival dist 254`
  (lounge) → `107 arrival_far` → `107 job_failed arrival_far` → walk home. Grace never used the sofa
  where she stood. Screenshot `stub-grace-far-4239.png`.
- **Node tests.** The seven files with direct `onArrived(` calls plus the new arrival test: 7/7
  files pass (`testjs.txt`). The SIMS-2 tests would fail on the old code (they assert `arrival_far`,
  `arrival_ignored` and the re-issued id), so they do not pass by construction, except as noted in m3.

## Findings

### Major 1: a chair fetch during `using` now goes through the arrival check and is cut short at a non-own work object

npc-needs.js:681-714 (`_acceptArrival`), 708-711 (the job branch); seating.js:2029-2031
(`moveNeeds`), 1993-1996, 1803 (`seatPreference`).

Seating's chair fetch walks with `goToAndStay(..., { owner: 'needs', fromSeating: true })` and no
`moveId`. Its comment says "its arrival is ignored while using", which was true: `_advanceJob`
ignored `arrived` in the `using` phase. Under the transitional rule the arrival is now treated as
the current move and checked against `job.dest`. A fetched chair is 36 to 192 px from the NPC's
feet (`NEAR_CHAIR` to `FETCH_RANGE`), so the to-chair arrival is usually over 48 px away. The result
is `arrival_far phase using` and `_moveForPhase(s)` mid-use:

- At the NPC's own post, `_moveForPhase` takes the synthetic branch: only log noise, and
  `_farPhase = 'using'`.
- At a non-own work object (any object whose `satisfies` includes `work`, so `seatPreference`
  returns `fetch`: borrowed PCs in test_access_work, the work objects in lab_physical_pentest,
  test_seating, test_access_habits), the NPC is standing at the chair, so a real needs move back to
  the cell is issued. That `goToAndStay` is not `fromSeating`, so it calls `cancelFetch`: the chair
  is dropped where it is, the NPC walks back and works standing (`_seatStopKey` blocks a retry).

Evidence: code path above. In-browser check on game 4239: during Tom's `using office_coffee`, a
seating-shaped arrival (`owner 'needs'`, `moveId null`, 100 px off) gave `30 arrival dist 100`,
`31 arrival_far phase using`, `_farPhase 'using'` (`inject-using-4239.json`). Tom stood on his cell,
so the re-issue was synthetic; a real fetch would issue a move. Not reproduced with a real fetch.

The same applies to the one `returning`-while-`atPost` tick and to the windup (dest null there, so
the windup is safe).

Fix: in `_acceptArrival`, check only phases that wait on a needs move (`goto_item`,
`goto_target`, `queued`, and `returning`); in any other phase drop the arrival silently, as before.
Better still, have `_triggerGoToStayArrival` carry `fromSeating` in the payload (store it on the
move like `_moveId`) and have `onArrived` ignore those. Add a node test: a no-id far arrival during
`using` neither logs `arrival_far` nor issues a move.

### Major 2: the README's natural-run rows claim more than the runs show

scenarios/test_needs_sims/README.md:768-770; tools/playtest/needs-arrival-proof.mjs:163-191;
build log 29-31.

- **Grace natural runs: 0 of 20** in the builder's game 4181 (`graceRuns: 0`). The plan's main
  natural beat (20 Grace sofa trips) was not run. The README blames the harness. My real-clock run
  (game 4244) shows something else: Grace reached the sofa once (3 px, `see_rest` ticked,
  `natural-grace-sofa-4244.png`). The other four trips all wedged at (226-232, 134) beside Amara's
  seated desk and ended `job_failed timeout`, with no arrival fired and five or six
  `return_resumed` at the same spot on the way back. That is a navigation wedge from before this
  slice (the plan's 1.3 "stalled return" too), not an arrival fault. But it means `see_rest` is
  unreliable, and the cause is not the harness. The wedge point is the same place where the stub
  reproduction counted the arrival (223, 137).
- **Tom's kitchen trips.** The tool switches the office coffee off by writing
  `gameState.globalVariables` and emitting the change event. In my run with the same method, all
  six of Tom's trips went to `office_coffee` (4244 log). The tool's summary does not record targets,
  so "18 of 20 reached `using` at a kitchen source" is unsupported. The cross-room kitchen trip
  (the class of walk the fault lives in) was probably not exercised.
- "Thirty natural runs did not repeat the baseline": `officelife-sims/s2/` has no outputs for them
  (only an unused `live/grace-natural.mjs`).

Fix: correct the README rows (Grace 1 of 5, the wedge recorded as its own finding with game 4244,
Tom's target per run); switch the coffee off the way the scenario does (the socket interaction, or
the set_global path the needs system watches) and record targets; keep or drop the 30-run claim
according to the artefacts. Give the Amara-desk wedge its own backlog line next to E-carry.

### Minor 1: an unreachable home loops for ever, two re-issues per `_watchReturn` cycle

npc-needs.js:705, 3860, 3888.

`_watchReturn` calls `_goHome` without `keepFarFlag`, so it re-arms `returnFarReissued`. Each cycle
therefore re-issues twice (watch, then the far re-issue). This matches the plan's wording loosely
("re-issued once at once ... after that `_watchReturn`"). An NPC whose path cannot end within 48 px
of home never leaves `returning`. Stub game 4239: 34 `arrival_far` in 120 s, Grace parked 55 px
from home. The log is capped (2000), so this is churn, not growth. It agrees with the server
review's minor 2. Fix: pass `keepFarFlag: true` from `_watchReturn`, or log `arrival_far` once per
return.

### Minor 2: `_farPhase` is keyed on the phase name, not the move

npc-needs.js:709-710.

Queue steps all share `queued`, and a freeze/unfreeze re-issue keeps the old `_farPhase`. A far
arrival at a later queue cell, or after a conversation, fails the job at once with no re-issue.
This agrees with the server review's minor 1. Fix: clear `job._farPhase` in `_moveForPhase`
whenever the cell (`job.dest`) changes, or key it by `job.dest`.

### Minor 3: test gaps, and one test that partly passes by construction

test/js/npc-needs.test.mjs:1434-1461, 1399-1418.

- The capacity-2 test stubs `besideCell` to a far point and injects a bare `mate` state into
  `sys.states`. It proves "an unreachable destination fails after two far arrivals", not anything
  about the real `besideCell`. That is acceptable, but the name overstates it.
- The returning test stops after the second far arrival. It does not step `RETURN_YIELD_MS` to show
  `_watchReturn` taking over, or that `atPost` is set once a near arrival comes.
- Not covered: a far arrival at a queue step, a no-id arrival during `using` (Major 1), a far
  arrival after a freeze/unfreeze, and `arrival_ignored` while returning.

### Minor 4: the reproduction shows the symptom, not necessarily 3537's cause

tools/playtest/needs-arrival-proof.mjs:105-123.

The "legacy" half runs on the fixed build with `_acceptArrival = () => true`. That is the same as
the old `Set.delete` test for every needs-owned arrival, so it is a fair stand-in, but it is not
"the build as it stands". The stub truncates every Grace path over 3 nodes, including the walk home.
It reproduces the symptom well: `using lounge_sofa` 164 px away, in the office
(`stub-legacy-4178.png` shows it). Baseline 3537 went from `job_start` to `using` in 9 ticks with
Grace still over the west desks (her home). The stub takes 28 ticks and stops beside Amara's desk.
That timing points to an arrival that fired at the start of the walk: a stale or foreign
owner-`needs` arrival, such as seating's (see Major 1), not a short path. The fix catches that
too, because the sofa cell is far, so this does not block. The README should say the cause of 3537
is still unproven. The builder's `stub-fixed` log stops at the first `arrival_far`. My game 4239
run (above) completes the sequence.

## Live runs (this review)

| Game | Run | Result | Evidence |
|---|---|---|---|
| 4239 | Stubbed short path, fixed build, 120 s | far → re-issue → far (254 px, lounge) → `job_failed arrival_far` → home; no sofa use away from the cell; home unreachable under the stub → returning loop (m1) | `probe-stub-4239.json`, `stub-grace-far-4239.png`, `stub-end-4239.png` |
| 4244 | Natural, real clock, 420 s, Grace rest and Tom caffeine forced 5 times | 19 `using`, max 13 px from the approach cell, 0 room mismatches, 0 `arrival_far`/`arrival_ignored`; Grace sofa 1 of 5 (4 wedge timeouts at Amara's desk) | `probe-natural-4244.json`, `natural-grace-sofa-4244.png`, `natural-t90-4244.png` |
| 4239 | Seating-shaped no-id arrival during `using` | `arrival_far phase using`, `_farPhase 'using'` | `inject-using-4239.json` |
