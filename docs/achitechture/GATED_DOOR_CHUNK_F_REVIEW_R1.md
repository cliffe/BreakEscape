# Gated-door server check, Chunk F review, round 1

Scope: `enter_room` server validation (plan section 8), commits `2062da934` and `6ee2c2c86` on
`build/hard-tailgate-f`, diff `b1256d2be..6ee2c2c86`. Reviewed read-only against the hardening brief,
plan sections 8, 9, 11, 13 and the Chunk F bullet in 14, and the build log.

## Verdict

Pass. The change meets the user requirement that a legitimate player is never refused under network
delay, drop, old-tab, offline-then-reconnect, reload or duplicate, and refuses only a forge that the
cheat policy allows to be refused. Tests and live proof exercise the real paths. No blocker and no
major. Three minors, none of which can refuse an honest player on this branch.

Counts: blockers 0, majors 0, minors 3.

## What was checked and holds

- **`player_reached_room?` covers every honest route (`game.rb:158-164`).** The union is
  `unlockedRooms` or `startRoom` (via `room_unlocked?`, `game.rb:122`), an awareness world room
  (`awareness_world_room?`, `:134`), `npcRouteRooms`, or the saved `currentRoom`. The decisive fact
  for honest play is that a room becomes occupiable only after it is in `unlockedRooms`: `GET
  room/:room_id` returns `:forbidden` for a room that is not the start room, a world room, or already
  in `unlockedRooms` (`games_controller.rb:534`), and its auto-add only adds the start or world room
  (`:539-541`), never an arbitrary room. The `currentRoom` sync guard already on this branch refuses
  to save `currentRoom` unless the room is in `unlockedRooms` or is the start room
  (`games_controller.rb:2101-2104`). So any room an honest player can stand in is in `unlockedRooms`
  (or is the start or world room), and `player_reached_room?` passes for it. The `currentRoom`
  disjunct adds no independent coverage, exactly as the plan states.
- **No open-passage honest-refusal path.** Because `GET room` requires `unlockedRooms` membership
  before a room can load, there is no room an honest player reaches without that membership. The
  "unlocked door or open doorway still POSTs `method: unlocked`" claim is backed by the server:
  `validate_unlock` runs `unlock_room!` for a genuinely open door and rejects `method: unlocked` for
  a locked door (`game.rb:3124-3125`), so the membership is written on every honest crossing and
  cannot be forged for a secret-gated room.
- **Deployed scenarios keep completing.** `enter_room` targets on this branch: `m01` (`main_office_area`,
  `it_room`, `derek_office`, `server_room`), `m02` (`reception_lobby`, `hospital_ward`, `server_room`,
  `emergency_equipment_storage`), `sis02` (`battery_hall_1`), `lab_social_engineering` (`recon_room`,
  `operations_room`, `blue_team_room`, each behind a key-locked door: `recon_door`/`operations_door`/
  `blue_team_door`, `scenario.json.erb:1569-1573`). `sis01` has none. Every target is reached through a
  door unlock that writes `unlockedRooms` before entry, so `player_reached_room?` is true at completion
  time. No deployed task becomes uncompletable. The lab's tailgate gating (`secure_area`, `npcRouteRooms`,
  `creditOnPass`) is absent on this branch (Chunks A and D not landed), so no `enter_room` target depends
  on route-room membership here.
- **Forge boundary matches the cheat policy.** A client cannot sync `currentRoom` to a room not in
  `unlockedRooms`/`startRoom` (`games_controller.rb:2101`), and cannot add a locked room to
  `unlockedRooms` by lying about the unlock method (`game.rb:3124`). So a forged `enter_room`
  completion is possible only for a room the client could open honestly (a genuinely open door),
  which is the "shortcut that only saves time" the policy accepts. `task['targetRoom']` comes from
  `find_task_in_scenario` (authored data), not the client body, so the target cannot be forged.
- **Client path (`objectives-manager.js`).** Pre-flush (`:770-773`) awaits `safeSyncOnce` for ordering
  only and never blocks the POST on a rejecting or absent sync; the completion passes on durable
  `unlockedRooms`. The inline retryable re-post (`:783-787`) re-syncs once and re-posts once, with a
  transient re-post result falling to the transient path rather than a hard surface (R9 minor 1). The
  queue is a `Set` keyed by task id (`enterRoomQueue`), fed from both the transient branch and the
  thrown-error catch, drained by the `online` listener and by the syncs the manager awaits, re-entry
  guarded, never in `player_state` (SYNC SIZE RULE intact). The init replay (`:136-139`) reads the real
  `window.currentPlayerRoom` (set in `core/rooms.js:3183`), runs after `initialized = true`, and is
  idempotent against the first room-detect tick (status set to `completing` synchronously before any
  await, so the tick's emit cannot double-complete).
- **No regression for other task types.** The transient and queue handling are gated on
  `task.type === 'enter_room'`; every other task still reverts and alerts with `Objective Blocked`
  exactly as before.
- **SYNC SIZE RULE.** The queue is an in-memory field, never synced. The pre-flush sends a
  `buildChanges()` delta only, and nothing when nothing changed. Zero per-sync growth.

## Tests and live proof

- Rails `test/models/break_escape/enter_room_validation_test.rb`: 10 runs, 36 assertions, 0 failures.
  Calls the real `complete_task!` with real `player_state`; covers plan tests 14-21 plus a world-room
  case and a direct predicate test.
- Node `test/js/enter-room-completion.test.mjs`: 12 pass, 0 fail. Imports the real module and drives the
  real `completeTask`; fetch and `stateSync` are stubbed (unavoidable in node), which is the real client
  path.
- Node neighbours re-run, all green: `conclude-race` (6), `objectives-skip` (6), `objectives-reveal`
  (12), `objectives-global-unlock` (7), `objectives-signin-pc` (3), `ending-check` (21),
  `ending-replay-credits` (3).
- Live proof driver (`scratchpad/builder/enter_room_live_proof.mjs`) read and judged genuine: it uses
  Playwright `context.setOffline` for Case 3 (real offline then real `online` event, with an assertion
  that the task id is in the queue before reconnect), routes delay/abort on `sync_state` only (not the
  completion POST) for Cases 1a/1b, stubs `safeSyncOnce` and aborts all syncs for the old-tab Case 2,
  counts real completion POSTs, and reads server truth back with `bin/rails runner`. The five cases do
  exercise the network conditions claimed. Not re-run here: the referenced games (3311-3316) are
  historical on the shared dev DB, the driver is sound, and the unit and model tests already cover the
  real paths; re-running would need re-seeding and add DB churn for little extra assurance.

## Findings

### Minor 1 - the 5xx-while-online case is not drained by the `online` event, and the node test conflates the two triggers
`test/js/enter-room-completion.test.mjs:206-224` ("offline feed and reconnect drain") feeds the queue
with `__status5xx` and then drains it by firing the `window` `online` event. In a real browser a 5xx
does not fire `online` (the browser was never offline), so a persistent 5xx enqueue is drained only by
the next `enter_room` pre-flush or the next boundary crossing, not by reconnect.
Failure scenario: none for the honest player. The behaviour sits inside the plan's accepted floor (a
task may stay active until the next crossing), and the genuine offline then reconnect path is proven by
live-proof Case 3 with real `setOffline`.
Fix: optional. Either note in the test that `__status5xx` stands in for the transient shape rather than
the `online` trigger, or add a separate assertion that a 5xx enqueue drains on the next awaited
`enter_room` sync. No code change needed.

### Minor 2 - forward-looking (Chunk A): a second `retryable` refusal surfaces a hard block to a route-room slip-in and is not queued
`objectives-manager.js:783-812`. The inline retryable re-post re-syncs once (flushing `currentRoom`)
then re-posts once; a second `retryable` result is not transient, so it falls to the else branch and
surfaces `Objective Blocked` / `Room not reached` and is not enqueued, leaving the task active until the
next boundary crossing. For a future Chunk A `npcRouteRooms` slip-in the durable membership is written
by a separate `method: npc` route POST that the client re-sync cannot accelerate, so a tight race that
loses both the first and the re-post window would show a legitimate player a refusal.
Failure scenario: unreachable on this branch. `npcRouteRooms` is always empty here (Chunk A not landed)
and every honest `enter_room` target is in `unlockedRooms` before entry, so an honest first post already
passes and the retryable path is never taken for honest play. The concern only matters once Chunk A
introduces route rooms.
Fix (when Chunk A lands): let a second `retryable` `enter_room` refusal also feed the re-send queue (or
soften its surface to the `Sync Pending` message), so a route-room tight race is carried rather than
shown a hard block. Worth a line in the plan's section 8.3 so the Chunk A/B builder does not rely on the
single inline re-post for route rooms.

### Minor 3 - cosmetic: `drainEnterRoomQueue()` is invoked unawaited inside `completeTask`
`objectives-manager.js:772` and `:785`. The drain is called fire-and-forget in the pre-flush and the
inline retryable path. It is safe (the drain's body and the inner `completeTask` both swallow their own
errors, so no unhandled rejection), and the current-task entry is removed from the queue and early-returns
if it is still `completing`, so nothing is double-posted. The bare call reads as if its result were
awaited.
Failure scenario: none; readability only.
Fix: prefix with `void` or add a one-line comment that the drain is intentionally not awaited.

## Notes for the orchestrator

- The `online` listener is added once (ObjectivesManager is a singleton via `getObjectivesManager`,
  `objectives-manager.js:1504-1509`) and the page resets it on reload, so there is no listener leak in
  practice.
- The honest-play guarantee on this branch rests on the pre-existing `currentRoom` sync guard
  (`games_controller.rb:2101`) and the `GET room` membership requirement (`:534`). If a later chunk
  loosens either, the `enter_room` check's "every occupiable room is in `unlockedRooms`" assumption must
  be re-checked.
