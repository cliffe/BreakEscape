# Sims tidy review, round 7

Branch `build/ol-sims-tidy` at 8371bc107. Scope: the commits since 442a7255b, leaving out the main merge 686f48eb2:
dce0b40a3 (seating sweep), 663603791 and ade76b7fe (tour driver), a2d2c64ab and b5a337735 (`_handleBlockerAhead`
back-off, pin and yield hold), 9d400d750 (three-NPC lane test). Read alongside SIMS_TIDY_REVIEW_R6.md and its R6
Outcomes. Nothing was fixed in this round.

Counts: 0 B, 1 M, 3 m.

## Who reaches `_handleBlockerAhead`

It has one caller, the path-follow branch of `updatePatrol` (npc-behavior.js:1366), so it runs only in the `patrol`
state. That covers waypoint and random patrols, multi-room route walkers, `goToAndStay` moves (needs walks, ink or
npc-manager walk-tos at npc-manager.js:1627, the walk home at :1885, seating's seat moves at seating.js:2414). There is
no follower mode in npc-behavior.js, and cutscene NPC moves go through `goToAndStay`. A `goToAndStay` mover is `busy`
(`_stopOnArrival`, npc-behavior.js:1564), so against an idle NPC it keeps priority and squeezes rather than backs off;
the back-off mostly falls to patrols and to needs walkers meeting each other. Scripted route actions keep their
`mustReach` squeeze (npc-behavior.js:1673), which runs before the yield decision, so a step already in progress
finishes (at most 700 ms) and the squeeze follows.

## Findings

### M1. A patrol that yields to a stationary NPC in a one-body gap now paces to and fro for ever

npc-behavior.js:1653-1661 and 1697-1705, with the yield hold at 1624-1627.

Before a2d2c64ab a yielder backed off for one behaviour update (about 2 px) and then waited the full cycle again, so it
stood almost still. A waypoint patrol held still like that was re-targeted within about 3 s by `_patrolStalled`
(npc-behavior.js:1800, 4 px over `changeDirectionInterval`, default 3 s) or after 4 s by the stuck watch
(`_checkPathStuck`, :1398, 16 px over 4 s), and walked on to its next waypoint.

Now each step is 700 ms at 0.45 of patrol speed (about 31 px at 100 px/s), and the steps chain until the blocker is
past `AVOID_YIELD_HOLD_PX` (96 px) or 10 s. When the blocker is an NPC that is not walking (idle at its post, a
`face_player` stop, an NPC that has arrived and dwells, a timed-out needs walker), nothing ever clears the gap. Trace:
the patrol meets it, holds still 600 ms, the detour finds nothing, it backs off three or so steps to 96 px, `_avoid`
clears, it walks back in, meets the same NPC, and waits about 2.5 s before the next back-off. That still period is
under the 3 s stall window and the 4 s stuck window, and each back-off moves it far more than 4 px or 16 px, so both
re-target paths re-arm every cycle. The patrol paces between about 30 px and 96 px from the blocker indefinitely, on a
cycle of roughly 5 to 6 s. The patrol is the yielder whenever the tie-break (`avoidanceYieldsTo`, :200, both idle, so
the higher id yields) says so, or always if the standing NPC carries a stale pin (m2).

Failure scenario: a guard on a waypoint route through a doorway (one body wide) in any mission, with an NPC standing
in or just beside that doorway whose id sorts below the guard's. On main the guard turns to his next waypoint after
about 3 s; on this branch he walks back and forth in front of the doorway until the other NPC moves, which may be
never. Random patrols are not affected (they re-target every `changeDirectionInterval` regardless), needs walks are
bounded by their 20 s deadline, and a `goToAndStay` walker is busy and does not yield to an idle NPC.

This comes from a code trace, not a run: the live check map (below) is open floor, where detours succeed and the
back-off is rarely needed. A unit check would be one walker against a fixed body in the R6 lane harness, run through
`updatePatrol` so the stall and stuck watches take part. Possible fixes, for the next round: count a back-off step
that ends with the same NPC still within the hold as no progress for `_patrolStalled` and the stuck watch, or stop
yielding to a blocker that has not moved since the meeting began (it is not coming through, so backing off gains
nothing).

### m1. The back-off step does not look behind it, so a yielder can push or pass through the player

npc-behavior.js:1699-1704.

The step heads straight away from the blocker for up to 64 px and only the pin check (gained under 3 px) stops it.
The player standing behind the yielder is not an obstacle to that check. In open floor away from walls a routed NPC is
made unpushable against the player (`playerPushMode` 'pin', npc-sprites.js:700), so the player is shoved back about
31 px per step for as long as the steps chain; within 12 px of a wall the pair do not separate ('slide') and the NPC
walks back through the player's sprite. On main the step was about 2 px, so neither showed. Exposure is low, since a
back-off needs a failed detour, which mostly happens in narrow gaps where 'slide' applies, but it touches the
tailgate lever the avoidance comment (npc-behavior.js:58-62) promises to leave alone: a player following a guard
through a corridor, when another NPC meets the guard head-on, is pushed or walked through. A cheap fix is to treat the
player (or any `_dynamicBlockers` body) within a body's width behind the step as a pin.

### m2. `_avoid` (and so `pinned` and `yieldTo`) is only cleared inside `_handleBlockerAhead`

npc-behavior.js:1609, 1628, 1752-1759 are the only resets; `_dynamicBlockers` reads the pin at :1590.

An NPC that leaves the path-follow branch while pinned (arrival through the 1.5 s near-destination rule at about
:1319, which fires exactly when another body holds its cell; `face_player`; `idle`; a needs walk deadline; a seat;
a conversation) keeps `_avoid.pinned = true` until its next walk meets nothing. Others meeting it meanwhile always
yield to it, which feeds M1. A stale `yieldTo` also carries into the NPC's next walk for the rest of its 10 s: the
old partner up to 96 px ahead on the new path counts as a blocker. Neither survives a reload (in-memory state), and a
room change does not matter (behaviours persist and positions are world coordinates). Fix: clear `_avoid` when a new
move or patrol target starts and when the NPC leaves the `patrol` state.

### m3. The tests prove the step, the pin and the three-NPC lane, not the cases above

test/js/npc-local-avoidance.test.mjs, the R6 M1 tests and `laneRun`.

The step and pin unit tests are sound and the lane test fails on a2d2c64ab as the R6 Outcomes say. The lane harness
has no walls, no player and no stationary body, its bodies never push each other (a step into a body stops dead, where
Phaser's NPC-NPC collider can shove the body behind, which changes when a pin is set), and it runs only at dt 50 ms.
Missing: a walker against a body that never moves (M1, through `updatePatrol`), a step with the player behind (m1), a
pinned NPC that stops walking (m2), and the lane run at dt 16 ms. On timing: the step is timed on scene time and the
manager throttles behaviour updates to 50 ms (npc-behavior.js:275), so 20 fps and 60 fps give the same step length to
within one update; I found no frame-rate dependence.

## Other questions from the brief

- **Backing into a wall or a closed door.** The body stops, the step gains under 3 px, it is pinned, and the other NPC
  yields. Into a wall at an angle it slides along the wall, gains ground and stays a yielder; that is acceptable.
  Backing out through an open doorway leaves the NPC in the next room's floor with its `roomId` unchanged; its next
  path is a world path, so it walks back. Not seen live; not a finding.
- **Two against two.** Acceptable as a known limit: it did not clear on main either, so it is not a regression, the
  exposure analysis in R6 is fair, and needs walks are bounded by the 20 s deadline. It shares M1's root (the queue
  paces instead of standing still), so a fix for M1 should be checked against it.
- **seating.js (dce0b40a3).** Correct. A chair in use drops its sweep state each sweep; the cap position is stored once
  when it caps and a move further than the chair's larger side starts fresh tries. No finding.
- **Tour driver (663603791, ade76b7fe).** The lane wait, fallback goals and walk-back read correctly; `p` is the live
  body centre after each try. `ok` now means within 24 px of whichever goal was used (up to a tile off the aim), which
  the R6 table reports honestly. No finding.

## Live check

Keyless server from the worktree on :3093 (PID 2162112), fresh game 6143 of test-npc-waypoints (mission 120: nine
waypoint patrols in one room, no needs; test_npc_avoidance is not a published mission). Headless, `setFPS(20)` with
fixed steps on (confirmed `fixedStep` true), 240 samples over 120 s, player left at spawn.

- Page errors 0. Detours adopted 56. Two stuck lines, each recovery step 1 only (waypoint_zigzag at (221, 190) and
  waypoint_rectangle at (227, 244)), in a room of nine patrols; neither recurred.
- The seven NPCs that walk reached waypoints 20 to 53 times each and covered 2,000 to 4,300 px. The longest still
  spell for any of them was 11 samples (about 5.5 s, a dwell NPC). Back-off was active in 0 to 26 of 240 samples per
  NPC, pinned in 3 samples (one NPC) and never for two at once. No oscillation pattern.
- Two NPCs did not move, neither through avoidance (no `_avoid` state at any sample): waypoint_with_face stood facing
  the player at spawn, as its config says, and waypoint_line_horizontal's route lies on row 2, which looks like a
  pre-existing scenario quirk. Not counted.
- The player moved 4 px in 2 minutes.

Movement was normal on open floor. This map does not exercise M1 (detours round the standing NPC succeed).
