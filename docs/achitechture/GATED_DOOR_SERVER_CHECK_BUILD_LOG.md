# Gated-door server check: build log

Per-chunk record of what was built against `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md`.
Each chunk is its own section so parallel branches merge cleanly.

## Chunk F: enter_room server validation (section 8)

Branch `build/hard-tailgate-f`, built on `b1256d2be` (main merged in). Independent of Chunks A to E.

### What was built

Server (`app/models/break_escape/game.rb`):
- `player_reached_room?(room_id)`: true when the room is in `unlockedRooms`, is the `startRoom` (both
  via `room_unlocked?`), is an awareness world room, is in `npcRouteRooms`, or equals the saved
  `currentRoom`. The durable terms carry the check; `currentRoom` is a soft defensive disjunct. Reads
  `npcRouteRooms` with a `|| []` default, so it works whether or not Chunk A's route-room list has
  landed on this branch (it has not here; the list reads empty).
- The `enter_room` branch of `complete_task!` now refuses with
  `{ success: false, error: 'Room not reached', retryable: true }` unless `player_reached_room?` is true,
  replacing the former "Trust the client" comment.

Client (`public/break_escape/js/systems/objectives-manager.js`):
- An `enter_room` pre-flush: before the completion POST, `completeTask` awaits one state sync for
  ordering only (via `safeSyncOnce`, which swallows a rejection), then opportunistically drains the
  queue. The durable `unlockedRooms` write carries the server check, so a rejecting, aborted or absent
  sync never blocks the POST.
- Inline retryable re-post: a `retryable` refusal triggers one re-sync (wrapped so a rejecting sync
  still proceeds) and one re-post. A genuine non-transient second refusal surfaces once (no loop). A
  transient re-post result takes the transient path instead (revert and enqueue), so an honest player
  hitting a race then an offline blip is never shown a hard refusal (R9 minor 1).
- A bounded in-memory re-send queue (`this.enterRoomQueue`, a `Set` keyed by task id): fed from the
  transient branch (`response.transient === true`) and the thrown-error catch, drained by a `window`
  `online` listener (the load-bearing reconnect trigger) and, opportunistically, by the syncs the
  manager awaits on the `enter_room` path (the new pre-flush and the inline re-sync; the conclude-race
  pre-flush is gated on `scenarioGatesOnGlobals()` and does not fire for a pure `enter_room` scenario,
  R9 minor 2). `drainEnterRoomQueue()` is re-entry guarded and re-runs the full `this.completeTask`, so a
  drained mission-concluding completion still fires the end screen. Memory only: never in `player_state`,
  so the SYNC SIZE RULE is untouched.
- Init replay: at the end of `initialize`, if `window.currentPlayerRoom` is a non-empty string, call
  `handleRoomEntered` once to close the reload-in-room ordering gap. Idempotent.

### R9 minors folded (plan text amended)

- Minor 1: a transient result on the inline retryable re-post takes the transient path (revert and
  enqueue); only a genuine non-transient refusal surfaces. Amended in section 8.3 and the Chunk F bullet.
- Minor 2: the drain-trigger wording. The conclude-race pre-flush (`:613-614`) is gated on
  `scenarioGatesOnGlobals()` and is not a drain trigger for a pure `enter_room` scenario; the drain runs
  after the new `enter_room` pre-flush and the inline re-sync, and the `online` listener is the main
  reconnect drain. Amended in section 8.3 and the Chunk F bullet.

### Plan drift (line citations re-checked against `b1256d2be`)

- `complete_task!` is at `game.rb:3675` and the `enter_room` branch at `:3745` (plan cited `:3745`;
  holds). `complete_task!(task_id, validation_data = {})` already carries the `validation_data` keyword;
  no signature change in Chunk F.
- `objectives-manager.js` citations hold within a few lines after the constructor edit: the transient
  branch, the thrown-error catch, the retry loop and `serverCompleteTask`'s transient return shapes are
  all present as the plan describes.
- `npcRouteRooms` does not exist on this branch (Chunk A builds it elsewhere, as expected). The predicate
  reads it defensively; no behavioural dependence on Chunk A.

### Tests

- Rails `test/models/break_escape/enter_room_validation_test.rb` (new): tests 14-21 plus a world-room
  case (20b) and a direct `player_reached_room?` predicate test. 10 runs, 36 assertions, 0 failures.
- Node `test/js/enter-room-completion.test.mjs` (new): pre-flush ordering, completion independent of the
  pre-flush, retryable re-sync/re-post and single surface, rejecting re-sync, R9-minor-1 transient
  re-post, non-transient refusal not queued, offline feed and reconnect drain, queue bound, thrown-error
  feed, drained non-transient drop, and a queued mission-concluding completion. No new static import, so
  no test-harness copy-list change. All pass.
- Rails neighbours (no regressions): `game_test.rb`, `conclude_race_test.rb`, `task_set_global_test.rb`,
  `reload_persistence_test.rb` (178 runs), `games_controller_test.rb` (63 runs).
- Node neighbours (no regressions): the eight `objectives-*` files, `conclude-race`, `ending-check`,
  `ending-replay-credits`, `credits-*`, `success-screen`, `ending-credits-audio`.

### Live proof (enter_room under real network delays, section 13)

Fixture: `test_objectives` (startRoom `reception`; `office1` is pin-locked `1234`; `enter_office` is an
`enter_room` task on `office1` reached through the door unlock that writes `unlockedRooms`).

<!-- live-proof-results -->
