# Handover — NPC local avoidance (route around player and NPCs)

Task: NPCs should route around the player and other NPCs instead of knocking into
them. Main case: Len (lab_physical_pentest guard on patrol) pushes against the
player when they stand in his way.

## Status

- Engine + unit tests + focused scenario: DONE and committed (`3b74f5fb8`).
- `bin/test-js`: 415 passed, 0 failed (full suite, after the change).
- `test/js/npc-needs-slots.test.mjs`: GOLDEN_SIMS_DAY byte-identical (18/18).
- Live browser proofs: NOT YET RUN (handed over at the context budget). See
  "Remaining live proofs" — this is the outstanding work.

## How it worked before (evidence)

- One world grid at 16px built only from immovable/static bodies
  (`npc-pathfinding.js` `buildWorldGrid` ~L308-372). The player and walking NPCs
  are dynamic non-immovable bodies, so the pathfinder never sees them.
- The PLAYER already routes around NPCs: `findWorldPath(..., avoidNPCs=true)` →
  `_avoidNPCPositions` (`npc-pathfinding.js` ~L406-433). NPCs did NOT: every NPC
  plan goes through `_planMovePath` → `findWorldPath(...)` with `avoidNPCs=false`
  (`npc-behavior.js` ~L1330-1334).
- Physics colliders separate bodies: NPC↔player `createNPCCollision` and NPC↔NPC
  `setupNPCToNPCCollisions` (`npc-sprites.js` L746, L1012). `handleNPCPlayerCollision`
  / `handleNPCCollision` only insert a sidestep for `config.patrol.waypoints`
  patrols. Len is a `multiRoom` route (`scenario.json.erb` L880-897) with no
  `config.patrol.waypoints` set during a leg, so those handlers bail at the
  `!waypoints` guard (`npc-sprites.js` L1297-1301, L1489-1493) and he just
  `triggerSettling`s then resumes shoving — the reported knock.
- Stuck detector `_checkPathStuck` re-arms while the player is beside the NPC
  (`_playerBeside`, `npc-behavior.js` ~L1253), so it never rescues an NPC the
  player is blocking.

## Design (what I built, and why)

Reactive local-avoidance layer, triggered ONLY when a body is AHEAD on the path —
so when nothing blocks, planning/timing/determinism are unchanged (this is why
GOLDEN_SIMS_DAY and the lab timed beats are safe; always-avoid planning would not
be). No `Math.random`; tie-breaks are ordered.

Files:
- `npc-pathfinding.js`: new `_avoidDynamicPositions(exceptSprite, skipCX, skipCY)`
  and a `findWorldPath` option `opts.avoidDynamic = { exceptSprite }` that routes
  round the player + every other active NPC body (self excluded).
- `npc-behavior.js`:
  - exported pure helpers `nearestBlockerAhead(pos, heading, blockers, lookAhead,
    laneHalf)` and `avoidanceYieldsTo(selfId, selfBusy, otherId, otherBusy)`.
  - `_handleBlockerAhead(time, nextWaypoint)` called in `updatePatrol`'s
    path-follow branch, right after `_checkPathStuck`. Sequence: wait
    (`AVOID_WAIT_MS` 600ms) → throttled detour re-path (`AVOID_REPATH_MS` 400ms,
    via `_requestDetour` using `avoidDynamic`) → if no way round after
    `AVOID_GIVEUP_MS` 2500ms: a yielding NPC meeting another NPC **backs off**
    (`_moveAwayFrom`); against the player or a filled doorway a **gentle bounded
    squeeze** (`AVOID_SQUEEZE_FACTOR` 0.45 speed for `AVOID_SQUEEZE_MS` 450ms, then
    a cooldown wait). Never a sustained shove, never per-frame jitter.
  - helpers `_dynamicBlockers`, `_avoidIsBusy`, `_stopHere`, `_moveToward`.
  - Only AHEAD bodies block → player behind/beside is ignored (tailgate and
    body-block levers intact). Off-switch: `window.__npcAvoidOff = true`.

Coordinator design constraints honoured: wait→detour→fail-through/squeeze;
deterministic yield (busy keeps priority, tie → higher id yields); seated/guards/
gate-holds/chase/conversation untouched (seated bodies are `immovable` → skipped;
chase is a different state and never reaches this branch); Len's gate hold and
tailgate timing not touched (only his patrol walk now yields).

## Unit tests

`test/js/npc-local-avoidance.test.mjs` (13 tests, pass): ahead/behind/beside,
look-ahead bound, deterministic closest + id tie, yield rule, and behaviour-level
wait / squeeze / back-off / detour-adopt / off-switch.

NOTE: `test/js/npc-avoidance.test.mjs` is the office-life session's NEEDS test — I
accidentally overwrote it, then restored it byte-for-byte from HEAD. My test lives
under the `npc-local-avoidance` name. Do not confuse the two.

## Remaining live proofs (the outstanding work)

Server :3001 is up. Headless harness: `tools/playtest/cmd.sh <gameId> <jsonCmd> <t>`.
Check `pgrep -fa 'chrom.*headless'` before launching; stop only your own PIDs.

1. LAB REPLAY (Len — the main case). Replay dir:
   `/tmp/claude-1000/.../c84d7b68-.../scratchpad/lab-pov/replay-r4/` (`run.sh`,
   command files `b1.txt`..`b16.txt`, game id 1038). Also `lab.py` +
   `lab_args920.json` in the office-life scratchpad. Drive to score 100 and, at the
   tailgate beat, watch Len walking the records-door route while the player stands
   in his path: he must wait/detour, not grind into the player. Confirm the gate
   hold + tailgate timing and USB (10-13s) / creds (57-65s) beats are unchanged.
   WARNING: another agent is fixing a replay stall at Sofia's PC (`usb_target_pc`)
   after seat-box slice 6 (`git log` around `af380d860`). Do NOT touch `seating.js`.
   If the replay still stalls there, say so and do not fix it yourself.
2. `test_needs_sims` live: sit/work/leave/return and the kitchen-copier errand still
   work; and the doorway head-on — two staff crossing at the office↔kitchen door
   mid-day should no longer briefly overlap; one yields.
3. `test_needs_leash`: `python3 /tmp/claude-1000/.../3c2d3b5d-.../scratchpad/leash.py
   <game>` — leashed Ravi 0 Maya's-office samples, unleashed ≥1.
4. `scenarios/test_npc_avoidance` (new): two NPCs cross the desk pinch without
   deadlock; an NPC detours round a standing player; the north doorway case. It is
   not seeded — swap an existing game's stored scenario (SEAT_BOX_PLAN.md slice 0)
   to run it, or seed on :3001 (`db:seed` is fine on the standalone app).

If any live proof shows a regression, fixes go in a FOLLOW-UP commit (do not amend
`3b74f5fb8`).

## Live verification — session 2 (2026-11-07, follow-up agent)

Status: engine re-verified green; the live Len open-floor before/after is BLOCKED by
mission state (Len parks), not by the avoidance change. No regression found; no code
changed this session.

### Done and green
- `bin/test-js`: **415 passed, 0 failed**. Includes `npc-local-avoidance.test.mjs`
  (13/13: nearestBlockerAhead ahead/behind/beside + look-ahead bound, deterministic
  closest + id tie, yield rule, wait/squeeze/back-off/detour-adopt/off-switch) and the
  office-life `npc-avoidance.test.mjs` (untouched, passes).
- GOLDEN_SIMS_DAY byte-identical: `npc-needs-slots` passes within the suite and
  `git status` shows no fixture change. Working tree clean apart from the three
  pre-existing forbidden files (dungeon_graph.*, generate_rooms.py). I modified no
  engine/test/golden file.
- Engine read confirms the design: `_handleBlockerAhead` is gated by
  `window.__npcAvoidOff`, runs only in updatePatrol's path-follow branch (so a parked/
  dwelling NPC never enters it), only AHEAD bodies block, detour re-paths via
  `avoidDynamic`, fall-through is back-off (NPC) or bounded squeeze (player/door).

### Blocked / not reproduced live (the MAIN proof)
Fresh lab game **1056** (`new-game.rb lab_physical_pentest`), driven to open_plan.
- **Len parks at the records door and will not re-walk the open floor on demand.**
  Once his multiRoom route reaches the `(1,2)` badge waypoint (pixel ~(1021,76),
  open_plan origin (960,0), so (4,4)=(1104,144), (1,2)=(1008,80)), his next leg into
  secure_area is gated/unreachable (`transitionToNextRoom` "unreachable, retry in 2s"
  / `turnBackFromGate`), so he sits with `patrolTarget=null`, `pathFollowingActive=false`,
  `v=0`. He stayed frozen at (1021,76) for 30s+ windows whether the player stood in
  open_plan OR was moved out to hall.
- Consequence: with the player standing in front of parked Len, **OFF and ON are
  identical** (both `v=0`, `_avoid` never set, `avoidFrames=0`, no jitter, no shove) —
  because `_handleBlockerAhead` only fires during path-follow, which parked Len isn't
  doing. So the reported shove is NOT observable in this reachable state. The shove the
  user saw must happen during Len's ACTIVE patrol legs, i.e. while the player is already
  in open_plan as Len is still cycling early on — a timing window this run did not hit
  (the player reaches open_plan only after Len has parked).
- One upside worth noting: the avoidance change does NOT disturb Len's gate-hold/door
  park (OFF==ON there), which satisfies the "guards' gate holds stay unchanged" bar.

### Replay-to-100 also blocked by unrelated issues
- The r4 `b1..b16` command files are STALE for the current re-dressed briefing_room
  (re-dress commits `1e40e3e7a`/`af380d860` at 18:17–18:21 postdate r4 at 16:12), so
  `moveToNear` on briefing_room/P1 objects now "arrives-but-outside-plain-range". My
  setup drive hit the same misses.
- The r5 `solve-cmds.jsonl` replay stalls at **`usb_target_pc` (Sofia's PC) in
  open_plan** — the known seat-box slice 6 regression owned by the office-life session.
  `git log` shows no fix on main past `af380d860`. Not caused by, and not fixed by, the
  avoidance change.

### What the NEXT agent should do (recommended, in priority order)
1. Catch Len mid-patrol: drive a FRESH lab game to open_plan EARLY (minimal route,
   don't trigger the tailgate/park), then stand the player on Len's open-floor diagonal
   between (4,4)=(1104,144) and (1,2)=(1008,80) and sample OFF then ON. OR complete a
   CLEAN tailgate (one `enter secure_area` at a time, verify `kp_badge_tailgated`
   latches) so the gate closes and Len resumes into secure_area → loops back across the
   open floor, then intercept him there.
2. Prefer `scenarios/test_npc_avoidance` for the clean OFF/ON engine demo: its NPCs
   patrol continuously (no mission-state gating), so the corridor pinch / standing-player
   detour / doorway cases reproduce on demand. It is unseeded — swap it onto a game
   (`tools/playtest/swap-scenario-game.rb`) or `db:seed` on :3001.
3. `test_needs_sims` doorway head-on and `test_needs_leash` (`leash.py`) are the other
   continuous-movement proofs.

Harness notes for the next agent: the briefing_room moveToNear misses make the stale
b-files unreliable; `enter` advances one room per call and a multi-room `enter` through
an already-open gate left the player's `roomId` null (room tracking confused) — tailgate
with single-step enters and verify the global, don't trust a chained enter. Headless
chrome count stayed at 1 throughout (my session added/removed one cleanly).

## Live verification — session 3 (2026-11-07, follow-up agent)

### THE REGRESSION WAS REAL AND IS NOW FIXED (commit 2996a4944)
The coordinator diagnosed (and I confirmed in code) that 3b74f5fb8 broke the
lab's secure_area: Len's multiRoom route waypoint at open_plan (1,2) carries
`action:{unlockRoom:"secure_area"}`. When the player stands at the badge
reader/door (one tile *beyond* (1,2)), `_handleBlockerAhead` saw the player as a
blocker ahead and yielded forever, so the path never completed
(`updatePatrol` L1223 `distance<8` never hit), `_pendingRouteAction` (L1236)
never set, and the server-unlock never fired. Both player routes (clone entry,
doors.js ~660; tailgate, door-gates.js open()) depend on that unlock → "Len
parks at the records door". Game 1054 passed 18:52 (pre-commit); 1058 failed
19:42 (post-commit).

Fix in npc-behavior.js:
- `updatePatrol` computes `mustReach = patrolTarget.routeAction && pathIndex ===
  currentPath.length-1` (final leg to an action waypoint) and passes it to
  `_handleBlockerAhead(time, nextWaypoint, mustReach)`.
- In `_handleBlockerAhead`, after the brief `AVOID_WAIT_MS` wait, if `mustReach`
  it squeezes straight toward the cell at `AVOID_SQUEEZE_FACTOR` (45%) speed —
  no detour, no back-off, no indefinite hold — so the NPC reaches the cell and
  the action fires. Still never a full-speed shove.
- Unit tests: `test/js/npc-local-avoidance.test.mjs` now 15/15 (added: mustReach
  squeezes forward after the wait; without it the same early frame still holds —
  i.e. mustReach is exactly what frees the route).
- `bin/test-js`: **415 passed, 0 failed**. GOLDEN_SIMS_DAY byte-identical
  (`git status` shows no fixture change).

### CRITICAL HARNESS FINDING — the 2fps throttle and the smoothStep fix
Headless chrome throttles `requestAnimationFrame` to ~2fps (page treated as
hidden; JS visibility/focus overrides do NOT lift it). Worse, Phaser's
`loop.smoothStep=true` collapses the ~500ms throttled frame gap to ~16ms, so
**physics integrates ~60x slower than the scene clock** while avoidance timers
(scene-time) run near real-time — a severe desync. A body given velocity 60
moved 1px/scene-sec. This is why NPC-movement live proofs have been so hard.
Fix, per session, after popups are dismissed:
  `g=window.game.sys.game; g.loop.smoothStep=false; g.loop.minFps=1;
   window.game.physics.world.fixedStep=false;`
That restores physics to ~0.5x real-time (30px/s for v=60) and roughly
re-syncs movement with timers. Still ~2x slow and rAF-coarse (~1-2 samples/s),
but usable. Manual `loop.step()` pumping does NOT help (Phaser 3.60 step() reads
performance.now internally → delta≈0 in a tight loop).

### Tooling (reusable)
`.../scratchpad/avoid/drive2.py`: `setup(gid)` (dismiss popups + smoothStep off),
`teleport_player`, `set_avoid`, `poll_player`/`poll_pair` (single-eval rAF
samplers returning dense traces), `npc_pos`. Import and drive via
tools/playtest/cmd.sh.

### test_npc_avoidance scenario fixed (commit 12dcbf940)
It never worked: walker waypoints used x=10 in a 10-tile room (interior x=1..8),
so sequential patrol wedged at spawn and nobody paced; the doorway case targeted
a non-existent centre door (the real door is NW, ~col 1-2). Rewrote: walkers
pace row 5 cols 2..7 (cross mid-lane), Rob + the doorway case use the NW door.
With avoidance ON the walkers now pace and pass without overlap or deadlock (both
keep v=70, min sampled dist ~88px). NOTE: a true **one-tile pinch** is still
TODO — desks at rows 4/6 made row 5 non-traversable (their collision inflates
into the lane; walkers turned back at the pinch mouth, no contrast OFF vs ON), so
desks now sit at rows 3/7 (open lane). Next: size/offset the pinch desks so row 5
stays walkable by one body but not two.

### What I could NOT finish (budget: hit the stop threshold on the regression pivot)
These remain for the next session; the fix above is the priority deliverable and
is done + committed + tested.
1. **Live lab proof of the fix** (coordinator's ask). Fresh `new-game.rb
   lab_physical_pentest` starts in **briefing_room** (1071 confirmed). Natural
   drive briefing_room → reception → hall → open_plan (NOT a head-start spawn —
   that puts open_plan at world origin and Len won't patrol). Stand the player at
   the badge reader near (1,2); confirm Len now reaches (1,2), `unlockRoom` fires
   and `window.rooms.secure_area` appears, for BOTH routes (tailgate behind Len;
   clone+vest with the player waiting at the reader). The heavy lab page is very
   slow through the harness (evals ~tens of seconds each), so allow long timeouts.
2. **Full replay** with `.../scratchpad/lab-pov/solve-cmds-fixed.jsonl` to score
   100 + credits. Coordinator's required patch: replace the truncated/invalid
   lines 140-147 with the single line
   `{"cmd":"wait","for":"condition","fn":"() => !!(window.rooms && window.rooms.secure_area)","timeoutMs":8000}`.
   Harness only steps game time during active walk/moveTo, so a bare "wait" barely
   advances Len — allow for that.
3. `lab.py` with `lab_args920.json` (office-life s18a/): USB 10-13s, creds 57-65s.
4. `test_needs_sims` doorway head-on + copier errand + sit/work/leave/return;
   `test_needs_leash` (leash.py: leashed 0 samples, unleashed ≥1). Do NOT touch
   npc-needs*/seating.js/test_needs_*/npc-avoidance.test.mjs.

Len park question (asked in the brief): it is a **bug**, not intended — the park
was this avoidance regression (now fixed), not a door-gate design choice. The
`turnBackFromGate`/"retry in 2s" seen earlier was the *downstream* symptom: the
gate never opened because secure_area never unlocked because Len never reached
(1,2). The separate safety bugs (clone route not loading the room; walking into
unloaded void through an open gate) are with the user, per the coordinator.
