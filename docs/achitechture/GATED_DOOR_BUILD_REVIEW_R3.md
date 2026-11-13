# Gated-door server check: whole-build adversarial review, round 3 (Chunks A to F)

Scope: the complete server-checked gated-door build, `git diff b1256d2be 51a319b5b` minus main's
train 35 (merged at `86dc44c23`; the `tools/playtest/shell-*`, `ui-rules-audit` and UI-shell CSS/JS
files are excluded). Branch `build/hard-tailgate-plan`, tip `51a319b5b`, reviewed in the worktree.
Most weight on Chunks C, D and E (no prior review of their own) and on how the whole fits. Read-only
review; no code changed. Reviewed against GATED_DOOR_SERVER_CHECK_PLAN.md (sections 3, 7, 8, 9, 10,
12, 15), the build log, and the three earlier reviews (Chunk A R1, Chunk F R1, combined R2).

## Verdict

Pass, changes advised, no blocker. Chunks C, D and E are faithful to the plan. The whole build is
inert for every non-gated scenario (m01-m10, sis01, sis02, lab_social_engineering, the test-rfid
scenarios, the two presentation-only gate demos): `server_completed_only_task_ids` and
`server_credit_global_names` are empty, `npcRouteRooms` stays empty, the object-action gate never
fires, the soft-lock scan finds nothing and `show` stays lock-free, and `player_reached_room?` passes
on durable `unlockedRooms` exactly as Chunk F's review verified. Only the lab and `test_gate_tailgate`
split. No forge promotes a split room, opens its objects, writes a credit global, completes a credited
task, or skips one. No legitimate player is refused in any deployed or test scenario. Every finding
from the three earlier reviews is closed in code or by design. The three minors are latent: none
refuses a player or opens a forge in any scenario that ships today; they are hardening against a future
author mistake and two validator/runtime alignments.

## Counts

- Blockers: 0
- Majors: 0
- Minors: 3 (plus one trivial observation)

## Earlier findings: closed or open

Chunk A R1:
- MAJOR 1 (lab unwinnable via tailgate under A alone; deployment gate): CLOSED. Full stack landed; the
  build log gate reads "A, B, C and D together, with E". `lab_gated_door_test` and the Chunk E live
  proof show both lab routes complete `tailgate_in` and open `secure_area`.
- MAJOR 2 (object retry bypassed by the five code-posting minigames): CLOSED. Shared
  `unlockWithRouteRoomRetry`; the node source-guard asserts no minigame posts a bare `apiClient.unlock`.
- MINOR 1 (a second unlock route defeats the split): CLOSED. Chunk E validator errors on an
  `unlock_door` reward/action into a split room and on a non-`openFor` NPC `unlockDoor` mapping; node
  test covers both and excludes the `openFor` NPC. See R3 minor 3 for a split-predicate alignment gap.
- MINOR 2 (build log "briefly" wording): CLOSED (doc).
- MINOR 3 (no endpoint leak test): CLOSED (`gated_door_credit_controller_test`).

Chunk F R1:
- Minor 1 (5xx not drained by `online`; test conflation): CLOSED (doc comment).
- Minor 2 (second retryable surfaced a hard block): CLOSED (enqueue on `transient || retryable`).
- Minor 3 (unawaited `drainEnterRoomQueue`): CLOSED (`void` prefix).

Combined R2 (A+B+F):
- MAJOR 1 (deployment gate must name Chunk C): CLOSED. Chunk C landed (`955285782`); the gate names it.
- MINOR 1 (inline retryable not scoped to `enter_room`): CLOSED. Chunk C added `task.type === 'enter_room'`.
- MINOR 2 (`credit_via_credential!` forwards client `card_ids`; safe only for a `requires`-only lock):
  CLOSED. Chunk E validator errors on a split gate whose rfid room lock carries an `access` ACL; node
  test covers it. Both split rooms are `requires`-only, so the forwarded `card_ids` stay inert.

## Findings (round 3)

### MINOR 1 - the serverCompletedOnly guard precedes the idempotent already-completed branch

File: `app/models/break_escape/game.rb:4122-4124` (`complete_task!`), and the same shape in
`skip_task!` at `:4262-4264`.

The guard sits before the already-completed branch at `:4127`. So a client POST of a credited task
that the server has already credited returns `{ success: false, error: 'Task is server-completed
only' }` (422) rather than the idempotent `{ success: true, message: 'Already completed' }`. For a
non-`enter_room` task the client reverts it to active and shows "Objective Blocked"
(`objectives-manager.js`), i.e. a legitimate, already-earned finding would be shown as blocked.

Failure scenario: an author wires (or leaves) a client `complete_task`/`completeTask` action
(apply-actions.js:187-190 is the live path) for a credited task; a legitimate player triggers it after
the server credit landed and is shown a hard block on an earned task. No scenario ships this today: the
lab's only credited task, `tailgate_in` (`type: manual`), has no client completer (grep of scenario,
ink and engine JS, and the `lab-gated-credit-scan` node test, confirm this), and manual tasks have no
client auto-completion path. `test_gate_tailgate` credits no task (its `creditOnPass` has no
`completeTask`). So the ordering is latent, not an active refusal.

Fix: move the `!trusted && server_completed_only_task_ids...` guard to after the already-completed
branch. This is strictly safer: a forge targets a not-yet-completed task, so it never enters the
already-completed branch and still hits the guard and is refused; an honest or duplicate re-post of an
earned credited task gets idempotent success. Apply the same reordering in `skip_task!` (a credited
task that is already `completed`/`skipped` should return the idempotent "Already..." rather than 422).

### MINOR 2 - the validator catches a half-migrated credit global but not a half-migrated credited task

File: `scripts/validate_scenario.rb` (`check_gated_door_credit`, the client-writer scan near the
`global_writers` call).

The validator warns when a credit global is still written by a client `set_global`/`setGlobal` (a
half-done migration). There is no equivalent check for a credited task still completed by a client
`completeTask` eventMapping or ink action. Combined with minor 1, a leftover client `completeTask` of a
`serverCompletedOnly` task would surface a hard "Objective Blocked" to an honest player, and nothing in
the validator would flag it. The lab's two `room_entered:secure_area` backstops and the two credit
writers were removed in Chunk D (confirmed), so no scenario triggers this; it is a regression guard.

Fix: add a warning that scans eventMappings (and, where feasible, ink) for a client `completeTask` of
any task in the `serverCompletedOnly` set, mirroring the existing credit-global client-writer warning.

### MINOR 3 - the validator and graph split predicate diverge from runtime `gate_splits?`

Files: `scripts/validate_scenario.rb:6771` (`splits = pass_server_owned || (has_cloner &&
!g[:requires].empty?)`); `scripts/generate_dungeon_graph.rb:537` (`has_credential = dg_has_cloner &&
room_requires.any?`); runtime `app/models/break_escape/game.rb` `gate_splits?` (pass server-owned, or
`scenario_has_rfid_cloner?` alone, with no room-`requires` condition).

Runtime splits a gate when a cloner exists anywhere, regardless of whether the target room carries a
`requires` card. The validator and graph add `&& room has requires`. The validator's split set is a
subset of the runtime's, so it never over-flags a legitimate author (the safe direction). But for a
gate whose room has no `requires` card while the scenario has a cloner, the runtime splits the gate and
the validator stays silent: if that gate's `playerMayPassIf` is client-writable, the runtime leaves the
room permanently in `npcRouteRooms` (viaPass never promotes a client-writable pass, viaCredential has
no card to check), an honest player can never earn it, and the "split gate pass must be server-owned"
error would not fire. No deployed or test scenario has this shape (lab and `test_gate_tailgate` both
carry a `requires` card and a server-owned pass; the two demos have no cloner).

Fix: align the three predicates. Simplest is to drop the `&& requires` condition in the validator and
graph so both mirror the runtime; or add the same room-`requires` condition to runtime `gate_splits?`.
Pick one and keep the model, the validator and the graph generator in step (a small shared note where
`gate_splits?` is defined would help the next editor).

### Observation (trivial) - non-local `return` inside `with_lock`

File: `app/models/break_escape/game.rb:493` (`migrate_soft_locked_route_rooms!`).

The `return if player_state['routeRoomsMigrated']` re-check sits inside the `with_lock` block. It fires
only on the concurrent-migrate race, before any mutation, so the transaction is empty whether Rails 7.0
commits or rolls it back; the only possible artefact is a deprecation line in the log on that rare race.
No correctness effect, no write lost. Optional: hoist the re-check or use a local flag instead of a
non-local return. Not worth a code change on its own.

## Focus-area assessment

### C - serverCompletedOnly, the trusted: keyword, process_flag bypass

- The guard refuses a client forge of a credited objective tick on both client routes
  (`complete_task!` and `skip_task!`) and lets only `apply_credit_on_pass!`'s `trusted: true` through.
  `trusted` is a real keyword, never read from `validation_data`, so `{ "trusted": true }` in the body
  cannot smuggle through (live proof game 3399 and the model tests confirm).
- Can an honest client post a credited task? No, for the shipped set. The only `serverCompletedOnly`
  task anywhere is the lab's `tailgate_in`; Chunk D removed every client writer and both backstops, and
  grep of scenario/ink/engine JS finds no remaining client completer. The enter_room queue, replay and
  reload are `enter_room`-specific and `tailgate_in` is `manual`, so they never touch it;
  `test_gate_tailgate`'s `enter_staff` is an `enter_room` task deliberately kept out of the credit's
  `completeTask`, so it is not `serverCompletedOnly`. If one ever did post a credited task, the player
  would see a 422 and (for a non-`enter_room` task) a hard "Objective Blocked" (minor 1).
- Ruby 2.7 keyword handling: the three production callers are explicit (`game.rb:369` trusted: true;
  `games_controller.rb:1231` and `:1673` trusted: false), which also keeps the positional
  `validation_data` hash unambiguous under 2.7 keyword separation. No test caller passes a symbol-keyed
  hash as the second positional arg without an explicit `trusted:` (grep confirms), so none raises
  `unknown keyword`.
- `process_flag_task_completions!` bypass: it writes task status directly, so a credited task that was
  a `submit_flags` task would skip the guard. The Chunk E validator errors on a `submit_flags` task in
  any `creditOnPass.completeTask` (node test covers it), and `tailgate_in` is `manual`. Closed.

### D - lab edits and migrate_soft_locked_route_rooms!

- The lab scenario gains `creditOnPass` on the records gate (viaPass/viaCredential), and the two client
  credit writers and the two `ruth_phone` backstops are removed. No honest path is lost: both routes now
  complete `tailgate_in` server-side (`lab_gated_door_test` green; live proof games 3397 viaPass, 3398
  viaCredential), and the former "failed-save backstop" role is replaced by the reload re-walk and the
  stored-game migration. The load-bearing `len_never_fires -> unlockDoor: secure_area` mapping is intact
  (`scenario.json.erb:1647`) and correctly excluded from the validator's second-unlock-route error
  because Len is the gate's `openFor` NPC (lab validates with 0 errors).
- The lock-free scan on `show` is correct: `any_soft_locked_route_room?` returns false (no lock, no
  write) for every game with no stuck split room, which is every deployed mission and every
  non-soft-locked lab game. Only a genuinely stuck stored lab game pays a `with_lock`. The
  `clear_attribute_change('player_state')` before `with_lock` discards only the `serverCreditGlobals`
  memoise dirtied by the scan; nothing earlier in `show` writes `player_state` (the migrate call is the
  first statement after `@mission`/authorize), so no honest write is lost.
- Race: the `with_lock` reloads the row and re-checks `route_room_soft_locked?` under the lock, so a
  concurrent sync that credited the room between the lock-free scan and lock acquisition leaves the room
  in `unlockedRooms` (credit global true -> not soft-locked -> not demoted). A game cannot stay stuck:
  if soft-locked it is demoted and self-heals on the next currentRoom sync (viaPass) or rfid unlock
  (viaCredential); if earned it is left alone. `routeRoomsMigrated` makes it one-shot.

### E - validator, fixture, graph, live proof

- Validator rules fire correctly and only where intended. Across the brief's scenarios: 0 errors
  everywhere (re-run, "Result:" line); warnings unchanged except the lab 6 -> 7, the single accepted Q5
  warning on the `secure_area` "Key sign-out sheet" readable (the `7041` combination leak). m01 13,
  lab_social_engineering 5, sis02 7, sis01 10, test_gate_tailgate 2, the two demos 3/2 all match the
  build log. The rules are right (client-writable split pass = error; ACL rfid split room = error;
  undeclared/absent/`submit_flags` credit task = error; non-splitting gate with `creditOnPass` = warn;
  half-migrated credit global = warn; second unlock route = error; Q5 readable code = warn). Node test
  `validator-gated-door-credit` (11 cases) green.
- Fixture: `test_gate_tailgate`'s `visitor_pass` is a worn, server-owned pass (nested `give_item`
  wearable + `wear` confirm; the client `set_global visitor_pass` writer removed), and
  `WearableModel.worn_globals` resolves the nested wearable (the validator would otherwise error on the
  split pass, and it reports 0 errors). The gate credits `test_staff_entered` (declared, server-credit)
  on both paths with no `completeTask`, so `enter_staff` stays an `enter_room` task.
- Graph label present in the committed `dungeon_graph.{md,json,html}` for both split gates.
- Live proof: it proves the SERVER credit logic on the real endpoints with a real session and CSRF
  (viaPass, viaCredential, the pass-global/complete/skip forges all refused). It does NOT prove the
  CLIENT orchestration, because it fired the POSTs from a loaded page and seeded the clone/cloner (and,
  in Chunk F, the unlocked room) rather than driving the avatar through the game's own input, physics
  and NPC simulation. A gameplay proof must still show, driven through `window.__test`: (1) a hi-vis
  player walking up behind Len, the client door-gate opening, the client itself issuing the `method:
  npc` route POST and the `currentRoom` sync, and the viaPass credit landing end to end (pick up
  `cm_deeds_key`, reach Ruth); (2) the clone route driven through the real `badge_reader`/clone
  minigame, not a seeded `server_clones`; (3) the no-vest slip-in standing in the room, earning nothing,
  and being turned round by Ruth; and ideally (4) a lockable object in a split route room to exercise
  the object-action gate and the object-unlock retry in a genuine pre-promotion window (no deployed
  split room has one today, so it stays Rails-test-only). This is the gap the concurrent gameplay
  playtest should close; it is confidence in the client wiring, not a hole in the server enforcement.

### Whole build

- Legitimate player never refused: confirmed for every deployed and test scenario. The enter_room check
  passes on durable `unlockedRooms`/`npcRouteRooms` written before entry (Chunk F review verified every
  deployed `enter_room` target); the credit paths only add, never refuse; the serverCompletedOnly and
  object-action gates fire only on the two split scenarios and only on an unearned attempt.
- Forges refused: a synced credit global is dropped (read-only union); a direct complete/skip of a
  credited task is 422; an rfid unlock with no held card/clone is refused by `rfid_requires_held?`; an
  object unlock in an unpromoted route room is refused with no contents and no feedback leak.
- SYNC SIZE: `npcRouteRooms`, `serverCreditGlobals`, `serverCompletedOnly` are server-written,
  bounded, memoised, and never in the client payload; the credit globals reuse existing
  `globalVariables` keys. Zero per-sync growth; `credit_via_pass_on_sync!` reads no scenario on an
  ordinary sync (cheap `player_state` gate first).
- Stored games from before the change: handled by the one-shot soft-lock migration (demote-and-re-earn
  for a stuck game; leave an earned game); `npcRouteRooms`/derived lists default or derive on first read
  with no format bump.

## Tests run (no full suites, no server started, port 3651 not needed)

- Rails models: `gated_route_room_test`, `gated_door_credit_test`, `gated_server_completed_task_test`,
  `lab_gated_migration_test`, `enter_room_validation_test` -> 37 runs, 135 assertions, 0 failures.
- Rails controllers: `gated_route_room_controller_test`, `gated_door_credit_controller_test`,
  `gated_server_completed_task_controller_test`, `lab_gated_door_test` -> 25 runs, 143 assertions, 0
  failures.
- Rails neighbours: `games_controller_test` (63 runs), `lab_physical_pentest_content_test` (4 runs),
  `task_set_global_test` + `conclude_race_test` (10 runs) -> all green.
- Node: `validator-gated-door-credit` (11), `lab-gated-credit-scan` (3), `enter-room-completion` (12),
  `unlock-route-room-retry` (7) -> all pass.
- Validator: all gated scenarios plus m01, lab_social_engineering, sis02, sis01 -> 0 errors each;
  warning counts match the build log; the lab's one new warning is the accepted Q5 readable-code leak.
