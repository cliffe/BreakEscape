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
