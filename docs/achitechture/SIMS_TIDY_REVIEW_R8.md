# Sims tidy review, round 8

Branch `build/ol-sims-tidy` at 181181a6f. Scope: ba95f6403 (R7 fixes in npc-behavior.js and
test/js/npc-local-avoidance.test.mjs) and the main merge df9d2051f. Read alongside SIMS_TIDY_REVIEW_R7.md and its
R7 Outcomes. Nothing was fixed in this round. Line numbers are at the tip.

Counts: 0 B, 0 M, 2 m. One known limit (one against three), not counted.

`node --test test/js/npc-local-avoidance.test.mjs`: 41 pass at the tip.

## Findings

### m1. A random patrol's re-target drops its yield hold every 3 s, mid back-off

npc-behavior.js:2454 (`chooseRandomPatrolTarget` clears `_avoid`), reached from the re-target check at
npc-behavior.js:1303-1310, which runs before the path-follow branch and `_handleBlockerAhead` (:1382).

A random patrol re-targets every `changeDirectionInterval` (3 s default) whether or not it is making progress. Since
R7 m2 that wipes `_avoid` with it: the back-off step in progress, `yieldTo` and `yieldUntil`. Before ba95f6403 the
hold survived a re-target and covered the new path as well. A wanderer that yields in a one-body gap now loses the
hold within 3 s; if the new random target lies past the same NPC, it walks straight back in, meets it within 64 px,
and starts a fresh 600 ms wait, while the other NPC (if it is the priority side) waits its 1.8 s for the yielder
again. That is the pre-R6 re-entry the yield hold was added to stop.

Failure scenario: a random-wander NPC (patrol with no waypoints, for example the random patrol in
npc-patrol-lockpick's patrol_corridor) meets a needs walker or `goToAndStay` mover head-on in a doorway. It backs off,
re-targets 3 s later, often picks a point past the doorway again, and the pair repeat the wait; the busy walker loses
about 2 s per repeat. Exposure is low: every mission patrol I found uses waypoints, and needs walks keep their deadline.
Waypoint choosers (:1884) are fine, since a waypoint patrol only re-targets when stalled.

Cheap fix: in the two choosers, clear the pin and the back-off step but keep `yieldTo` and `yieldUntil`, or skip the
random re-target while `_avoid.backoffUntil` is in the future.

### m2. The player check behind a back-off is shorter than the step, so one step can still touch the player

npc-behavior.js:1601 (`nearestBlockerAhead(pos, dir, player)` with the default `AVOID_LOOKAHEAD_PX`, 42 px, and lane
half 13 px), against the step at :1753-1758.

A back-off step runs 700 ms at 0.45 of patrol speed: about 31.5 px at the default 100 px/s, up to about 34 px with
the 50 ms update granularity. Bodies are 18 to 20 px by 10 px (npc-sprites.js:110-114, core/player.js:148). A player
straight behind at 42 to about 50 px (horizontal) is outside the check, and after the step the centres are about 10
to 18 px apart, so the bodies meet. A player 13 to 19 px off the lane's centre line is also outside the check and is
brushed as the NPC passes. The next decision then pins the yielder (the player is now within 42 px), so the effect is
one contact per meeting, a shove of at most about 7 px in 'pin' push mode or a brief overlap in 'slide'. This is the
remainder of R7 m1, much smaller than before.

Failure scenario: the player follows a guard into a corridor at about a body and a half behind; another NPC meets
the guard head-on, the guard yields and its first step back bumps the player once.

Cheap fix: give the player check a reach of the step length plus a body (for example
`AVOID_BACKOFF_MS * 0.45 * speed / 1000 + 20`) and a lane half of about 19 px.

## Known limit (not counted): one against three

See the sim table below. One against three never clears in a 3-tile or longer one-body lane when the lone NPC has the
lowest id. It never cleared on main either (main clears no lane case of this length at all), so it is not a
regression in outcome, and the branch clears strictly more cases than main in every lane length I ran. The
difference is in how it fails: on main the queue stands still, and a waypoint patrol's `_patrolStalled` (4 px over
3 s) turns it to its next waypoint; on the branch the queue paces (64 to 176 back-off handovers in 90 s), and each
step moves more than 4 px, so the stall watch does not fire. This is the same shape R6 and R7 accepted for two against
two.

Can it happen?

- **test_needs_sims.** Five needs staff; the scenario's own queue beat sends Amara, Tom and Marek to the kitchen
  together, and a fourth (Grace with the mugs) could come out against them. The kitchen door is a doorway, so the
  one-body stretch is about a tile, where the sim clears on both versions (lane 16 rows) and faster on the branch.
  Needs walks also end at their deadline (at least 20 s, npc-needs.js:67).
- **Missions.** Patrols per mission: m02 2 (different rooms), m03 1, m04 2 (one per battery hall), m06 2 (different
  rooms), m07 1, m09 1, m10 5 (one per room), sis01 2 (ward_7), lab_physical_pentest 1. No mission puts four walkers
  on one one-body passage. m02's needs NPCs are bounded by the deadline. Exposure is effectively a test map with
  several needs NPCs.

Grade: known limit, as two against two. If it is ever fixed, the lever is the same one R7 used for standing
blockers: stop chaining whole steps when the "coming" NPC is itself held (its own `_avoid` is set and it has not
moved), so the queue stands and the stall watch re-targets as on main.

## Answers to the brief's questions

- **Can two waiting NPCs both count as coming and back off from each other for ever?** No. A waiting NPC does count
  as coming (`walking` at :1590-1593 stays true while it holds in its own avoidance, and during its own back-off step),
  but the yielder choice at :1720 is symmetric and deterministic per pair: equal pins fall to the id and busy
  tie-break, unequal pins make the unpinned one yield. Only one of a pair backs off. A pin set by the new behind check
  (:1749) flips the roles once, and the pinned side then squeezes forward, which ends the meeting. Mutual pacing needs
  a third body (the one-against-three limit above).
- **Is "moving towards the yielder" robust to physics jitter?** The test at :1660 is `> 0` with no speed threshold,
  so a standing NPC nudged towards the yielder by a collision counts as coming for that update. The cost is bounded:
  the decision is re-made after each 700 ms step (and the hold filter at :1666 every update), so jitter buys at most
  one extra step. A path follower counts as coming whatever its direction (including one ahead walking away), which
  is what lets a queue behind a yielder make room; I found no harm from it beyond the known limit.
- **Centre-line probe.** The wall probe calls `hasWorldPhysicsLineOfSight` with margin 0 and half-width 0
  (:1605), so its three rays collapse to the centre line and a wall corner up to a body half-width off that line is
  missed. The step then meets the corner: the body stops (gained under 3 px, pinned as in R6) or slides along it.
  Nothing passes through a wall, so this is not a finding. The player side uses a 13 px lane, not just the centre
  line; its short reach is m2.
- **The nine clears.** Seated return (:879), chat return (:887), any non-patrol state (:1073), path complete
  (:1358), the waypoint chooser (:1884), the random chooser (:2454), `goToAndStay` (:3230), `cancelMove` (:3276), stay
  arrival (:3310). Only the random chooser drops a yield too early (m1). The waypoint chooser fires only after a 3 s
  stall, which is the intended exit. No clear is missing: a hidden or removed NPC's body is disabled, so it leaves
  every other NPC's blocker list (:1622) and its own stale state ends on its first update with nothing ahead; a room
  change does not matter (world coordinates, behaviours persist); a needs NPC in conversation is cleared at :887 and
  its move cancelled by npc-needs.js:1430-1436, and other NPCs facing the player leave the patrol state (:1073).
- **Merge df9d2051f.** Main brought interaction-menu keys, the test bridge's `pressKey` to the overlap menu, a one-line
  tap-menu placement change in game.js and session-start.sh. None touches NPC movement, physics or the behaviour
  update. No interaction.

## Lane sim comparison

Scratch copies of npc-behavior.js (with that commit's combat-config, chase-leash and fight-styles) from 8dce8782f
(main before a2d2c64ab), a1f07151f (R7 review state) and the tip, run through the R7 lane sim
(`_handleBlockerAhead` driven directly, mocks in the patrol state, no player, no wall probe). Busy and idle mocks gave
identical results. The time is when the last NPC reached its goal; "never" means not all in 90 s. a1f07151f matched
the tip on every row (the R7 changes do not act in this harness: all mocks follow a path, there is no player, and the
mock pathfinder has no line-of-sight call).

Lane 100 px each side of the centre (a 200 px one-body corridor), as in R7:

| Case | main dt 50 | tip dt 50 | main dt 16 | tip dt 16 |
|---|---|---|---|---|
| three A (amy against bob, cat) | never (still) | 18.3 s | never | 17.6 s |
| three B | never | 35.4 s | never | 61.8 s |
| three C | never | 22.9 s | never | 50.1 s |
| two against two A | never | never (116 handovers) | never | never (123) |
| two against two B | never | never (119) | never | never (93) |
| one against three, lone amy (lowest id) | never | never (165) | never | never (176) |
| one against three, lone eve (highest id) | never | 25.9 s | never | 60.6 s |
| one against three, lone cat (middle id) | never | 59.9 s | never | never (2 of 4 done) |

Shorter lanes (idle mocks, dt 50):

| Case | main, lane 16 (a doorway) | tip, lane 16 | main, lane 48 | tip, lane 48 |
|---|---|---|---|---|
| one against three, lone amy | 17.3 s | 9.8 s | never (still) | never (64 handovers) |
| one against three, lone eve | 22.6 s | 15.0 s | 48.5 s | 29.4 s |
| one against three, lone cat | 19.9 s | 12.4 s | never | 39.0 s |
| two against two A | 35.2 s | 15.2 s | never | 40.1 s |

The dt 16 rows call the decision every 16 ms; in the game the manager throttles behaviour updates to 50 ms, so the
dt 50 rows are the representative ones. No row is worse on the tip than on main in outcome; the lone-amy rows
differ only in standing against pacing, which is the known limit above.

## Live check

Keyless server from the worktree on :3093 (PID 2444930, `GEMINI_API_KEY` unset, `BREAK_ESCAPE_STANDALONE=true`;
boot log has the no-key warning). Headless, `setFPS(20)`, `fixedStep` true, 240 samples over 120 s, player left at
spawn. Watch script adapted to also count back-off episodes and direction reversals.

- **Game 6149, m02_ransomed_trust.** Only the reception lobby loads at spawn (opening cutscene); its five NPCs were
  idle or facing the player the whole time and the patrols (hospital_ward, office_corridor) never loaded. Page errors
  0. Nothing walked, so this run tells nothing about avoidance; I made a second game.
- **Game 6150, sis01_healthcare** (two patrol NPCs in the start room ward_7). Page errors 0, stuck lines 0, detours 0.
  patrol_nurse walked 1,402 px and reached 13 waypoints; longest still spell 15 samples (about 7.5 s, a waypoint
  dwell; no `_avoid` state at any sample); reversals 0; back-off and pinned samples 0. sarah_mitchell stayed in the
  idle state throughout, by its own state machine (no `_avoid` state). The four other ward NPCs are stationary by
  config. Player moved 0 px.

No back-and-forth and no stuck lines. Neither run produced a meeting between walkers, so the live check confirms
normal patrol movement on a real mission map, not the avoidance paths; the sims and the unit tests carry those.

Server killed; `ss` shows nothing on :3093 and curl is refused. new-game.rb left
tools/playtest/m02_ransomed_trust-flags-game6149.xml untracked in the worktree; not committed.
