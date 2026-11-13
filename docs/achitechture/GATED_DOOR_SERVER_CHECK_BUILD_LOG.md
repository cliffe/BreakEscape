# Gated-door server check: build log

Builder log for GATED_DOOR_SERVER_CHECK_PLAN.md. One section per chunk.

## Chunk A: server split and serve (2026-11-13)

Server split and serve, the object-action gate, and the object-path client retry. No credit
(Chunk B) and no enter_room validation (Chunk F); the enter_room branch of complete_task! and
objectives-manager.js were left untouched.

### Done

Model (`app/models/break_escape/game.rb`), new helpers after `awareness_world_room?`:

- `npc_route_rooms` / `in_npc_route_room?` / `record_npc_route_room!` for the
  `player_state['npcRouteRooms']` list (defaults to `[]`, server-written only, §3.1).
- `server_owned_global_name?` (worn + imported + SERVER_OWNED union; serverCreditGlobals join in
  Chunk B), `scenario_has_rfid_cloner?` (recurses container contents), `gate_splits?`,
  `gate_for_connected_room`, `gated_route_room?` (NPC-keyed), `split_gated_door?` (door-keyed),
  `object_in_unpromoted_route_room?` (§3.6 predicate via `login_scope_of(...):room_id`).
- Feedback-helper nil/false returns added alongside the existing `unlock_scope_refused?` guard in
  `pin_cracker_feedback`, `password_case_mismatch?` and `uid_only_refusal?` (§3.6).

Controller (`app/controllers/break_escape/games_controller.rb`):

- `room`: route room is served (accessibility check gains `is_route_room`) but NOT auto-unlocked
  (auto-unlock guard gains `&& !is_route_room`) (§3.2).
- `unlock` door branch: `gated_route_room?(attempt, target_id) && !room_unlocked?` records the room
  in `npcRouteRooms` and serves `filtered_room_data` + `track_npc_encounters` without
  `unlock_room!`; otherwise `serve_opened_room` as before (§3.5).
- `unlock` object branch: a valid-path guard before the transaction refuses an object in a
  served-but-unearned route room with `{ success: false, reason: 'room_not_reachable',
  retryable: true }`, `:forbidden` (§3.6). Placed before `ActiveRecord::Base.transaction` so nothing
  is written and to avoid a non-local return out of the transaction block.
- `merge_last_write_wins_sections`: `currentRoom` acceptance extended to `npcRouteRooms` (§3.3a,
  acceptance only; viaPass promotion is Chunk B).

Client (`public/break_escape/js/systems/unlock-system.js`): `notifyServerUnlock` recognises a
`room_not_reachable` + `retryable` body on an object unlock (never a door), awaits one
`window.stateSync.sync()` wrapped so a rejecting/absent sync still proceeds, and re-posts
`apiClient.unlock` once, returning the re-post answer on success and surfacing the refusal otherwise.
No new static import, so no test-harness copy-list change.

### Tests

- Rails (new `test/models/break_escape/gated_route_room_test.rb`,
  `test/controllers/break_escape/gated_route_room_controller_test.rb`): 14 runs, 48 assertions,
  green. Covers plan tests 1, 6, 10, 11a, 12 (pin + password discrimination; uid_only false in the
  route room), 13, plus the list/predicate helpers.
- Node (new `test/js/unlock-route-room-retry.test.mjs`): the four §13 object-retry tests, green.
- Regression batch (all green): npc_container_unlock, unlock_response_filter, access_model_rfid,
  npc_mapping_unlock_door, avatar_unlocks, authorization, mail_state_sync, captures_sync,
  access_model_login, combination_cryptex_unlock, flag_reward_unlock_door; and the unlock-system
  node importers (rfid-clone-entry, rfid-clone-entry-load, door-gates-bar, door-gates-player-open,
  unlock-r1-ux).

### Plan drift noted

- `game.rb` line citations shifted since the plan (wearables UI landed on main): the methods are
  the same. Observed: `rfid_lock_passes?` 2545->2661, `rfid_requires_held?` 2563->2679 range,
  `uid_only_refusal?` 2633 (unchanged), `unlock_scope_refused?` 2740 (plan said 2758 for the
  neighbouring `unlock_session_refusal`), `pin_cracker_feedback` 3277, `password_case_mismatch?`
  3290, `validate_unlock` 3081->3196, `npc_mapping_unlocks_door?` 3521. Controller: unlock action
  1088, object branch ~1178, `serve_opened_room` 2244, `merge_last_write_wins_sections` 2098 all as
  cited. Intent followed in every case.

### Interim behaviour (resolved by Chunk B)

- In Chunk A alone a credential (`method: rfid`) door unlock of a split room goes through
  `serve_opened_room` -> `unlock_room!` and does **not** delete the room from `npcRouteRooms`, so the
  room sits in **both** lists **permanently** in Chunk A, not briefly (review R1 MINOR 2: the earlier
  "briefly" wording was wrong, there is no delete in Chunk A at all). Harmless: the object gate keys
  on `!unlockedRooms.include?`, so once the room is unlocked its objects open, and the stale
  `npcRouteRooms` id is bounded and server-only (SYNC SIZE unaffected). Resolved by Chunk B: the
  viaCredential promotion now removes the room from `npcRouteRooms` (`credit_via_credential!`), so the
  two lists are disjoint again.
- **Deployment gate (review R1 MAJOR 1, amended review R2 MAJOR 1): Chunks A, B, C and D must land
  together, with E's validator, before players see a credited gate. Chunk A must not reach main
  without B, C and D.** Under Chunk A alone the lab's and `test_gate_tailgate`'s tailgate (hi-vis /
  viaPass) path is a dead end: Len's route records `secure_area`/`staff_room` in `npcRouteRooms` but
  nothing promotes it (no viaPass/viaCredential credit until Chunk B), so an honest hi-vis player
  cannot pick up the loose `cm_deeds_key` (pickup reads `unlockedRooms`) or unlock any object there,
  and the finding never earns. The cloned-badge path still completes in A (it runs
  `serve_opened_room` -> `unlock_room!`), only the tailgate path is stranded. Chunk B adds the
  promotion; Chunk D adds the lab `creditOnPass` and removes the now double-firing client credit
  writers. **Chunk C is equally load-bearing for players (review R2 MAJOR 1):** without it
  `tailgate_in` stays client-completable, so a tampered client posts `/complete_task tailgate_in`
  directly and ticks the task and the `tailgate` aim without the server-checked passage (the
  objective-tick forge plan §7 closes, plan §5 "the aim behind `tailgate_in` is reachable only
  through the server-checked passage"). So shipping A+B+D without C would still leave the credited
  task forgeable. The integrator must merge A, B, C and D together (never A alone, and never without
  C), with E's validator, so no scenario ships with a broken or forgeable tailgate path.
- uid_only promoted-path discrimination (reason returns after promotion) is left to Chunk E's
  end-to-end UID-only clone fixture; the route-room guard for uid_only is proven false here and is
  byte-identical to the pin/password guards, which are proven both ways.

### Open / not done in Chunk A (by design)

- No `creditOnPass`, no server-owned credit globals, no viaPass/viaCredential (Chunk B).
- No schema/validator/graph work, no scenario edits, no migration (Chunks D/E).
- enter_room validation untouched (Chunk F, parallel branch).

## Chunk B: the credit, server-owned (2026-11-13)

The `creditOnPass` schema and the server-owned credit: viaPass on the `currentRoom` sync, viaCredential
on the rfid/key unlock, the credit globals made read-only to `sync_state`, and the promotion that
removes the room from `npcRouteRooms` (closing the Chunk A dual-list interim). Also closes review R1
findings MAJOR 1 (doc), MAJOR 2 (shared object-unlock retry), MINOR 2 (doc) and MINOR 3 (endpoint test).

### Done

Model (`app/models/break_escape/game.rb`):

- `server_credit_global_names`: the distinct `creditOnPass.*.setGlobal` names, derived once via
  `self.credit_global_names_in(data)` and memoised in `player_state['serverCreditGlobals']` as
  `worn_global_names` does (pick on the narrow sync row). Unioned into the local `read_only` list in
  `merge_global_variables!` and into `server_owned_global_name?`, so a client `sync_state` can never
  write a credit global (§3.4, the teeth).
- `ensure_scenario_data_loaded!`: the sync-path load. The viaPass credit runs the whole
  `complete_task!` tree, which reads `scenario_data` and reads/writes the stat columns and whose
  `save!` validates mission/status, none of which are on the narrow row. It loads every missing column
  **except `player_state`** (the in-flight merge, which a reload would clobber) in one query, sets each
  and clears its dirty state, so the crediting `save!` writes only the columns the credit changed
  (`player_state`, stats) and never rewrites the large, unchanged `scenario_data`. (Plan drift: the
  plan called this a "scenario_data-only load"; running `complete_task!` on the narrow row genuinely
  needs the stat/validation columns too, so the load is scenario_data **plus** the other missing
  columns, still one query, player_state preserved, scenario_data dirty-cleared. Test 2 asserts the
  save excludes `scenario_data`.)
- `apply_credit_on_pass!(room_id, path_key)`: sets the block's globals via `write_server_globals!`
  (bypassing the read-only check) and completes its task via `complete_task!`.
- `promote_route_room!(room_id, path_key)`: `unlock_room!`, `remove_npc_route_room!`, then the credit.
- `credit_via_pass_on_sync!(room_id)` (§3.3a): cheap `player_state` gate first (route room, not in
  `unlockedRooms`, so a normal sync reads no scenario), then load, then promote only when the gate's
  `playerMayPassIf` is server-owned and true. (Minor drift: on a route-room slip-in sync whose pass
  fails, the scenario is loaded once to read the gate, dirty-cleared so nothing is written; the "zero
  scenario read" guarantee holds for every sync whose `currentRoom` is not a served-but-unearned route
  room, which is the common case.)
- `credit_via_credential!(room_id, method, card_ids)` (§3.3b): re-asserts the server possession result
  (`rfid_lock_passes?` for rfid, `has_key_in_inventory?` for key) at the credit site, removes the room
  from `npcRouteRooms`, applies the viaCredential block. Never reads a client boolean.

Controller (`app/controllers/break_escape/games_controller.rb`):

- `merge_last_write_wins_sections`: after accepting `currentRoom` for a route room, calls
  `credit_via_pass_on_sync!` (inside the sync row-lock transaction).
- `unlock` door branch, credential path: captures "not yet earned" before `serve_opened_room`, then
  `credit_via_credential!` inside the existing transaction.

Schema (`scripts/scenario-schema.json`): `creditOnPass` on the gate object, with `viaPass`/
`viaCredential` blocks referencing a new `gateCreditBlock` definition (`setGlobal`, `completeTask`).

Client, review R1 MAJOR 2 (`public/break_escape/js/utils/lock-scope-refusal.js` + callers): one shared
helper `unlockWithRouteRoomRetry` owns the §3.6 one-sync-one-re-post retry. `notifyServerUnlock`
(`unlock-system.js`) and the five minigames that post their own code (pin, password, combination,
cryptex, flag) all route their object-unlock POST through it, so the retry is no longer a copy and the
minigame paths no longer bypass it. Doors and non-`room_not_reachable` refusals are unchanged. No
new import on the minigames (they already import `lock-scope-refusal.js`); `unlock-system.js` gains
that one import, so `test/js/access-remote-signin.test.mjs` now copies `lock-scope-refusal.js` and the
three slice tests that inline-stub unlock-system's imports (`access-rfid-acl`, `access-signin-postit`,
`access-signin-routing`) add it to their stub map.

### Tests

- Rails (new `test/models/break_escape/gated_door_credit_test.rb` 4 runs 18 assertions;
  `test/controllers/break_escape/gated_door_credit_controller_test.rb` 9 runs 56 assertions), all
  green. Covers plan tests 2 (incl. the save-excludes-scenario_data guarantee), 3, 3b, 4, 7, 8, 11b,
  11c, and the R1 MINOR 3 endpoint feedback-leak test.
- Node (`test/js/unlock-route-room-retry.test.mjs`, rewritten to drive the shared helper): 7 runs,
  incl. the pin and password paths through the retry and a source guard that every object-unlock
  caller routes through the helper and the minigames post no bare `apiClient.unlock`.
- Neighbours, all green: `gated_route_room_test`, `gated_route_room_controller_test`, `wearable_test`,
  `carry_over_test`, `captures_sync_test`, `mail_state_sync_test`, `access_model_rfid_test`,
  `access_model_login_test`, `npc_container_unlock_test`, `npc_mapping_unlock_door_test`,
  `combination_cryptex_unlock_test`, `flag_reward_unlock_door_test`, `unlock_response_filter_test`,
  `avatar_unlocks_test` (215 runs, 1226 assertions). Node neighbours that copy/slice the touched
  modules all green (pin/password/combination/cryptex/flag-station harness tests, lock-scope-refusal,
  the three access slice tests, rfid-revocation, rfid-clone-entry, access-remote-signin, and more).

### Open / not done in Chunk B (by design)

- No scenario edits, no lab `creditOnPass`, no soft-lock migration (Chunk D).
- No validator rules, no dungeon-graph label, no fixtures, no live proof (Chunk E). **Chunk E to-do
  (from review R1 MINOR 1):** add a validator check that no second unlock route (a non-`openFor` NPC
  `unlockDoor`/`unlockable` mapping, or a flag door-unlock reward) targets a split gated room, so an
  author cannot silently defeat the split; also the uid_only promoted-path discrimination needs the
  end-to-end UID-only clone fixture (carried from Chunk A).
  **Chunk E to-do (from review R2 MINOR 2):** the validator must also assert a split gate's rfid room
  lock is `requires`-only (no `access` ACL list). `credit_via_credential!` re-asserts possession with
  `rfid_lock_passes?(lock, card_ids)`, forwarding the client `card_ids`; for a `requires`-only lock
  that delegates to `rfid_requires_held?`, which reads server-held inventory and `server_clones` and
  ignores `card_ids`, so the credit is server-possession-only. An ACL (`access`-list) split gate would
  instead consult the client `card_ids` through the access model, so the credit would inherit the
  access model's possession semantics rather than a dedicated server check. No current scenario is an
  ACL split gate; the validator rule (or an explicit `rfid_requires_held?` branch for a split room in
  the credit path) closes the latent gap.
- enter_room validation untouched (Chunk F, parallel branch); the enter_room branch of
  `complete_task!` and `objectives-manager.js` were not touched.

## Chunk C: server-completed tasks (2026-11-13)

`serverCompletedOnly` (a credited task completes only through the server-checked passage), the
`complete_task!` and `skip_task!` guards, and the `trusted:` keyword (§7). Also folds review R2:
MAJOR 1 (deployment gate now names Chunk C), MINOR 1 (inline retryable re-post scoped to
`enter_room`), MINOR 2 (Chunk E to-do: validator asserts a split gate's rfid lock is `requires`-only).

### Done

Model (`app/models/break_escape/game.rb`):

- `server_completed_only_task_ids`: the distinct `creditOnPass.*.completeTask` ids, derived once via
  `self.completed_only_task_ids_in(data)` and memoised in `player_state['serverCompletedOnly']`
  exactly as `server_credit_global_names` does (reads `scenario_data` on a full load, a `pick` on the
  narrow sync row; the read path never saves).
- `complete_task!(task_id, validation_data = {}, trusted: false)`: a new `trusted:` keyword. A guard
  at the top (after the task lookup, before the already-completed branch) refuses a
  `serverCompletedOnly` task unless `trusted` is true. The `!trusted && ...` short-circuit means the
  trusted credit path never even evaluates the set (no extra scenario read on the credit path).
- `skip_task!`: a guard that refuses a `serverCompletedOnly` task outright (no `trusted` bypass; the
  server never legitimately skips a credited task), so a tampered `skip_task tailgate_in` cannot reach
  the `tailgate` aim without the passage.
- `apply_credit_on_pass!`: now calls `complete_task!(task_id, trusted: true)` so the server's own
  gate credit completes the credited task through the guard.

Controller (`app/controllers/break_escape/games_controller.rb`): both positional-hash callers of
`complete_task!` pass an explicit trailing `trusted: false` (the flag-object completion at the `unlock`
action, and the `complete_task` client action). This keeps `trusted` client-untrusted **and** keeps
the positional `validation_data` hash unambiguous under Ruby 2.7 keyword separation (a symbol-keyed
hash as the last positional arg to a method with a keyword otherwise raises `unknown keyword`).

Client (`public/break_escape/js/systems/objectives-manager.js`, review R2 MINOR 1): the inline
one-sync-one-re-post block (`:800`) now also requires `task.type === 'enter_room'`, matching the retry
to its stated scope (the pre-flush and the enqueue are already `enter_room`-only; only the `enter_room`
branch of `complete_task!` returns `retryable`). No behavioural change for current scenarios.

### Server-side callers of a credited completion (checked, §7)

- **Chunk B credit path** (`apply_credit_on_pass!` -> `complete_task!`): passes `trusted: true`. The
  only legitimate server-side completion of a credited task.
- **NPC / ink / eventMapping `completeTask`**: these fire on the client (confirmed by the
  `unlockDoor`-mapping comment at `game.rb` noting completeTask/setGlobal mappings fire client-side),
  so they drive the client `POST /complete_task` and land untrusted, correctly refused for a credited
  task. The lab's two `room_entered:secure_area` `completeTask` backstops are exactly such client
  mappings and are removed in Chunk D (they can no longer complete the task once it is
  `serverCompletedOnly`).
- **`task_set_global` / event path**: `apply_task_set_globals!` (from `process_task_completion`) sets
  globals, it does not complete tasks, and runs only inside a server-verified completion. No change.
- **Flag completion** (`games_controller.rb` `unlock` flag branch at `:1222`, and
  `process_flag_task_completions!`): complete only `submit_flags` tasks, never a gate-credit task
  (`tailgate_in` is `manual`/`custom`). `process_flag_task_completions!` writes task status directly
  (bypasses `complete_task!`), so if an author ever named a `submit_flags` task in a gate credit it
  would bypass the guard; no deployed scenario does this, and the Chunk E validator's "second unlock
  route" rule is the place to reject such an overlap. Left untrusted (the safe default).

### Tests

- Rails, new `test/models/break_escape/gated_server_completed_task_test.rb` (8 runs) and
  `test/controllers/break_escape/gated_server_completed_task_controller_test.rb` (6 runs): 14 runs,
  43 assertions, green. Covers plan tests 5 (`POST /complete_task tailgate_in` refused), 5b
  (`POST /skip_task tailgate_in` refused, aim not reached), 5c (`{ trusted: true }` in the body, and
  as a nested `validation_data` entry, still refused); the `serverCompletedOnly` derivation and
  dedup; the model-level untrusted-refuse / trusted-complete / validation_data-cannot-smuggle cases;
  an ordinary task unaffected; and **the end-to-end proof that the credited task still completes
  through the real endpoints** with the guard in place, via the hi-vis pass route (`wear` + `unlock
  method:npc` + `sync_state currentRoom`, viaPass) and the cloned-badge route (`unlock method:rfid`,
  viaCredential).
- Rails neighbours, all green: `gated_route_room_test`, `gated_door_credit_test`,
  `enter_room_validation_test`, `gated_route_room_controller_test`, `gated_door_credit_controller_test`
  (47 runs, 218 assertions), `task_set_global_test` and `conclude_race_test` (in that batch),
  `game_test` + `games_controller_test` (162 runs, 619 assertions).
- Node neighbours (objectives-manager.js touched by MINOR 1), all green: `enter-room-completion`
  (12), and `objectives-*` (all-optional-aim, global-unlock, network-footholds, panel-scroll,
  required-marker, reveal, signin-pc, skip, target-ids).

### Plan drift

- `complete_task!` is at `game.rb:3965` (plan/Chunk F cited `:3675`/`:3745`; the method and its
  `enter_room` branch are the same, shifted by the merges on this branch). `skip_task!` at `:4096`.
  The guards go where the plan says (top of each, after the task lookup).
- Ruby 2.7 keyword separation (not called out in the plan): adding the `trusted:` keyword forces the
  two positional-hash controller callers to pass an explicit trailing `trusted:` or they raise
  `unknown keyword`. Verified empirically on 2.7.8. All direct test callers use the single-arg form,
  so none needed changing.

### Open / not done in Chunk C (by design)

- No scenario edits, no lab `creditOnPass` (Chunk D); no validator rule, fixtures or live proof
  (Chunk E). The Chunk E validator owes the `requires`-only split-gate assertion (R2 MINOR 2, above).

## Chunk D: scenario migration and lab edits (2026-11-13)

Built on `955285782` (Chunks A, B, C landed). The lab `creditOnPass`, removal of the client credit
writers and backstops, and the §10 soft-lock demotion. No validator rule, fixture or graph work
(Chunk E).

### Done

Scenario (`scenarios/lab_physical_pentest/scenario.json.erb`):

- The records door gate (`secure_area`, was `:1372`) gains `creditOnPass` with a `viaPass` block
  (`setGlobal kp_badge_tailgated`, `completeTask tailgate_in`) and a `viaCredential` block
  (`setGlobal kp_records_cloned`, `completeTask tailgate_in`), per §3.4.
- Removed the two client credit writers (found by grep, not line number, as §6 says; they had drifted
  to `:915` kp_badge_tailgated and `:932` kp_records_cloned) and the two `room_entered:secure_area`
  `completeTask tailgate_in` backstops on `ruth_phone` (were `:728`, `:729`). Once `tailgate_in` is
  `serverCompletedOnly` (Chunk C) those backstops could never complete the task. The removed JSON is
  recorded in the worktree's `tmp/delete/lab_physical_pentest_client_credit_writers.removed.json5`
  (gitignored), per the common rules. The stale ERB comments that described the removed mappings were
  updated to point at the server credit instead.
- Kept, per §6 and the load-bearing-oddities rule: Len's `len_never_fires` `unlockDoor: secure_area`
  mapping (grants Len the server unlock permission), and the presentation mappings (`len_at_door`
  door_gate cues, `player_on_floor`, `kp_tailgate_cue`, `kp_len_held_cue`). No other scenario touched.

Model (`app/models/break_escape/game.rb`): the §10 soft-lock demotion.

- `migrate_soft_locked_route_rooms!`: for a stored game saved before this work, move a split gated
  room that sits in `unlockedRooms` with its `creditOnPass` globals all false/unset and its credited
  task incomplete back into `npcRouteRooms`, so the earn check re-runs (viaPass on the currentRoom
  sync, or viaCredential on an rfid unlock). An already-earned room is left in `unlockedRooms`. Stamps
  `player_state['routeRoomsMigrated']` and runs once. `show` is a read-only action that must not
  routinely take a row lock (`games_controller_test` asserts this), so the method scans lock-free
  first (`any_soft_locked_route_room?`) and returns with no write when nothing is stuck; only a
  genuinely soft-locked stored game pays its own `with_lock`. The lock-free scan memoises
  `serverCreditGlobals` into `player_state` as a read-path side effect, so the dirty state is cleared
  (`clear_attribute_change`) before `with_lock`, which refuses a dirty record.
- Helpers `split_gated_room_ids`, `any_soft_locked_route_room?`, `route_room_soft_locked?`.

Controller (`app/controllers/break_escape/games_controller.rb`): `show` calls
`@game.migrate_soft_locked_route_rooms!` after `@mission` is set, before the sprite guard and before
any room GET or sync, so a stored game is demoted before this request's auto-unlock. No
`with_game_lock` wrapper (the model self-locks only when it has work), so `show` stays lock-free in
the common case.

### Tests

- Rails, new `test/models/break_escape/lab_gated_migration_test.rb` (6 runs, 37 assertions) and
  `test/controllers/break_escape/lab_gated_door_test.rb` (5 runs, 41 assertions), all green, both
  against the REAL lab scenario file (Mission `lab_physical_pentest`, not a fixture). Covers plan
  test 9 (demote a soft-locked room; leave an earned room; runs once; nothing-to-do stays lock-free)
  and the honest-player rule (§5): both lab routes still complete `tailgate_in` and open `secure_area`
  through the real endpoints (viaPass: `wear` + `unlock method:npc` + `sync currentRoom`; viaCredential:
  `unlock method:rfid` with a cloned `cm_records_badge`), a wrong clone is refused, and a stored
  soft-locked game is demoted on `show`, not re-added by `GET room`, and then finishes the honest run.
- Node, new `test/js/lab-gated-credit-scan.test.mjs` (3 runs, green): no client eventMapping writes a
  credit global or completes `tailgate_in`, and the gate declares `creditOnPass` for both routes.
- Neighbours, all green: `gated_route_room_test`, `gated_door_credit_test`,
  `gated_server_completed_task_test`, `enter_room_validation_test`, the three gated controller tests,
  `lab_physical_pentest_content_test`, `game_test`, `games_controller_test` (228 runs, 2686
  assertions in the combined batch); node `lab-physical-pentest-debrief` (9).

### Validator

`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb scenarios/lab_physical_pentest/scenario.json.erb --no-graph`:
0 errors, 6 warnings. Identical to the base commit's warnings; the only change is the `ruth_phone`
`room_entered:hall` index pair shifting from (4, 5) to (2, 3) because the two backstops were removed
from the head of that NPC's eventMappings. Graph regeneration is Chunk E, so `--no-graph`.

### Checked: nothing else client-side completes tailgate_in

Grepped ink, scenario eventMappings and engine JS for `tailgate_in`: no remaining client writer or
completeTask (only the task definition, the gate's `creditOnPass`, updated comments and playtest/doc
markdown). So an honest client no longer posts `tailgate_in` directly, which Chunk C's complete-side
guard would now refuse.

### Plan drift

- The client credit writers had drifted from the plan's `:915`/`:932` to the same lines by coincidence
  at `955285782`; the backstops were still at `:728`/`:729`. Found by grep per §6.
- Plan §10 said the demotion "sets a routeRoomsMigrated flag so it runs once" run "in the game show
  action". Implemented so `show` stays lock-free (its architectural rule): the flag is stamped (and a
  row lock taken) only when an actual demotion fires. A game that never had a stuck room does not get
  the flag and re-runs the cheap read-only scan on each show, which is idempotent. No behavioural
  difference for a soft-locked game; it is demoted once and the flag short-circuits later loads.

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

### R1 (Chunk F review) minors folded

- Minor 2: a second `retryable` `enter_room` refusal (after the one re-sync and one re-post) now feeds
  the bounded `enterRoomQueue` like a transient result, instead of surfacing a hard "Room not reached".
  The `!response.success` branch enqueues on `response.transient || response.retryable`. Once Chunk A's
  `npcRouteRooms` lands, a legitimate player can briefly be refused while a separate `method: npc` route
  POST is still in flight; the queue now carries that honest crossing rather than hard-blocking it, so an
  honest player is never refused. A forge enters the queue too but never completes (the server keeps
  refusing), and the queue cannot spin: each drain is one `completeTask` run, triggered only by `online`
  or a manager sync, re-entry guarded. Amended in section 8.3, the section 11 node-test descriptions and
  the Chunk F bullet in section 14. Node tests updated: the former "forge surfaces once" test now asserts
  the forge stays queued, shows no `Objective Blocked`, and that a drain is bounded (two POSTs) and never
  completes; the "drained non-transient drop" test now uses a genuinely non-retryable response so the drop
  still holds.
- Minor 3: the two unawaited `drainEnterRoomQueue()` calls inside `completeTask` (the pre-flush and the
  inline retryable path) are now `void`-prefixed with a one-line note that the drain swallows its own
  errors. No behavioural change.
- Minor 1: no code change; added a one-line comment on node test 8 that `__status5xx` stands in for the
  transient shape, not the `online` trigger, with genuine offline-then-reconnect covered by live-proof
  Case 3.

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

Headless Chromium (`chrome-headless-shell`), keyless server on :3652, `setFPS(20)`. The door unlock
landed normally in every honest case (office1 seeded into `unlockedRooms` via `new-game.rb --unlock`,
which runs the same `unlock_room!` durable write); what is delayed, dropped, skipped or taken offline is
the soft `currentRoom` sync and the pre-flush, and the completion itself. Driver script (scratch, not
committed): `scratchpad/builder/enter_room_live_proof.mjs`. Each case used its own game and browser
context; server-side truth read back afterwards with `bin/rails runner`.

Side-evidence: in every game the start-room `enter_room` task (`explore_reception`) completed on boot
with no boundary crossing, i.e. the init replay / first room-detect tick fires in the live game.

- **Case 1a, delayed `currentRoom` + pre-flush (game 3311).** `sync_state` delayed 4s via
  Playwright `route`; one completion POST; `enter_office` completed, not refused. Server: completed.
  Proves the completion does not wait on the `currentRoom` sync.
- **Case 1b, dropped `currentRoom` + pre-flush (game 3312).** `sync_state` aborted; one completion POST;
  completed. Server: completed. Proves the durable `unlockedRooms` write carries the check with the
  pre-flush aborted.
- **Case 2, old tab, no pre-flush (game 3313).** `safeSyncOnce` stubbed to a no-op and every `sync_state`
  aborted (no `currentRoom` ever synced); one completion POST; completed. Server: completed. An old
  client with no pre-flush is not refused.
- **Case 3, offline then reconnect (game 3314).** `context.setOffline(true)`, then fire the completion:
  the four retries exhausted to a transient failure, `enter_office` reverted to active and the task id
  entered the in-memory queue (`enterRoomQueue` had it, size 1) with no success while offline. Then
  `context.setOffline(false)` fired the browser `online` event; the client's own `online` handler drained
  the queue (one further POST, no driver re-post) and `enter_office` completed, queue back to size 0.
  Server: completed. Proves the queue is fed from the real offline path and the client recovers by itself
  on reconnect.
- **Case 4, duplicated / retried completion (game 3315).** The completion, then a raw duplicate POST:
  the first completed; the duplicate returned `{ success: true, message: 'Already completed' }`; the task
  stayed completed, credited once. Server: completed. Proves idempotency over durable state.
- **Case 5, forge, refused (game 3316).** A tampered client that never reached office1 (not in any
  durable list) posted the completion: the server refused (`Room not reached`, `retryable: true`), the
  client re-synced and re-posted exactly once (two POSTs total), the room was still not durable, and the
  refusal surfaced once ("Objective Blocked"); the task stayed active and was not queued. Server:
  `enter_office` still active, office1 not in `unlockedRooms`. Proves the check bites on a true forge and
  the retryable refusal does not launder it into a pass.

All five cases pass: a legitimate player is never refused under delay, drop, old-tab, offline/reconnect
or duplicate, and a forge is refused.

## Chunk E: fixtures, validator, graph, live proof (2026-11-13)

Built on `44a9a1f4b` (Chunks A, B, C, D, F landed). The last build chunk: the `test_gate_tailgate`
worn-pass fixture, the validator rules of section 12 plus the carried Chunk E to-dos, the dungeon-graph
split-gate label, and the keyless-server live proof. No engine code changed in Chunk E (validator,
graph generator, one fixture and one node test only), so deployed-mission runtime is untouched.

Commit: `089d848f8`.

### Fixture: test_gate_tailgate (scenarios/test_gate_tailgate/scenario.json.erb)

- `visitor_pass` made a worn, server-owned pass (§6, Q1). The `visitor_lanyard` hook now `give_item`s a
  wearable lanyard whose `wearable.global` is `visitor_pass` and offers a `wear` confirm; the former
  client `set_global visitor_pass` writer is gone. `visitor` added to `disguises` (reusing the player
  sprite) so the wearable validates. So the viaPass path splits on a global `sync_state` cannot write.
- The records door gate gains `creditOnPass` with `viaPass` and `viaCredential` blocks, each setting
  `test_staff_entered` (a server-credit global, declared false). No `completeTask`: `enter_staff` is an
  `enter_room` task completed through its own §8 server-validated path, so it must not become
  `serverCompletedOnly`. Demos (`test_bark_bubbles`, `test_access_habits`) stay presentation only (Q3).

### Validator (scripts/validate_scenario.rb: new check_gated_door_credit, registered after check_access_model)

- Split gate `playerMayPassIf` must be server-owned (worn / imported / credit / runtime) else ERROR.
- Split gate's rfid room lock must be requires-only, no `access` ACL (ERROR) -- the carried B-R2-MINOR-2
  / Chunk C to-do. (check_access_model already errors on any gate door with a target `access` list; this
  rule states the credit-path reason and bites in isolation for the node test.)
- `creditOnPass.*.completeTask` must name an existing task (ERROR) and must not name a `submit_flags`
  task (ERROR) -- `process_flag_task_completions!` writes task status directly, bypassing the
  server-completed-only guard (carried Chunk C §7 to-do, "no submit_flags in a credit").
- `creditOnPass.*.setGlobal` must be a declared global (ERROR).
- A non-splitting gate that names `creditOnPass` warns (the credit can never fire).
- A credit global still written by a client `set_global`/`setGlobal` (outside the creditOnPass block)
  warns (half-done migration).
- Second unlock route into a split gated room (an `unlock_door` reward/action, or a non-`openFor` NPC
  `unlockDoor` mapping) is an ERROR -- the carried B-R1-MINOR-1 to-do.
- Q5: a server-enforced lock code (pin/password/combination/cryptex/key/rfid requires) in a split gated
  room's readable `text` warns (the leak the lab's `deeds_signout`/`7041` is the accepted case for).

The split predicate mirrors `Game#gate_splits?` (server-owned pass, or an rfid_cloner present with a
room `requires`). Server-owned names mirror `Game#server_owned_global_name?` (WearableModel.worn_globals
+ importGlobals + the creditOnPass credit globals + the runtime `se_captures`).

### Validator counts across every scenario in the brief (before -> after this chunk)

`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <scenario> --no-graph`. 0 errors (0 known)
on every scenario both before and after. Warnings: m01 13, m02 29, m03 5, m04 16, m05 16, m06 26, m07 22,
m08 4, m09 26, m10 64, sis01 10, sis02 7, lab_social_engineering 5, test_gate_tailgate 2, test-rfid 14,
test-rfid-multiprotocol 23 -- all UNCHANGED. The only change: **lab_physical_pentest 6 -> 7 warnings**,
the one new Q5 warning (the records-office `deeds_signout` readable carries the archive-safe combination
`7041` in a split gated room). This warning is the deliberately accepted Q5 case, not a regression; no
known-failures entry was added. Every other deployed scenario gains zero warnings or errors.

### Dungeon graph (scripts/generate_dungeon_graph.rb)

- A split gated door's node gets a `gated: credential or server pass` label (the holdsDoors block skips a
  gate with a `playerMayPassIf`, so these were unlabelled). Mirrors `gate_splits?`.
- Regenerated `scenarios/lab_physical_pentest/dungeon_graph.{html,json,md}` and
  `scenarios/test_gate_tailgate/dungeon_graph.{html,json,md}`. The lab graph also absorbs pre-existing
  scenario drift (the committed graph predated later lab content); the split-gate label is the Chunk E
  change. No other scenario's graph was touched.

### Tests

- Node `test/js/validator-gated-door-credit.test.mjs` (new): 11 cases, each validator rule bites -- a
  clean split gate (no issues), client-writable pass global (error), non-splitting gate with creditOnPass
  (warn), missing completeTask (error), submit_flags completeTask (error), undeclared setGlobal (error),
  half-done migration (warn), unlock_door second route (error), non-openFor unlockDoor mapping (error) vs
  the openFor NPC (no error), ACL rfid split room (error), Q5 readable leak (warn). All pass.
- Regression (no change): `door-gates-validator` + `validator-exit-code` (65), the six `dungeon-graph-*`
  node tests (71). All green.

### UID-only after-promotion discrimination test (carried from Chunk A): LEFT, needs a heavy fixture

No deployed split gated room (lab `secure_area`, test_gate `staff_room`) holds an rfid-locked object with
`acceptsUIDOnly`, so the after-promotion `reason: uid_only` return cannot be exercised without a new
fixture (a split gated room + a promoted route + an rfid-locked object + a UID-only clone). Left undone,
as the brief permits. It is covered structurally: Chunk A proved the route-room guard returns
`uid_only = false` before promotion and is byte-identical to the pin/password guards, which are proven
both ways (Chunk A/B). Recommend a dedicated fixture if the end-to-end UID-only discrimination is wanted.

### Live proof (keyless server on :3650 from this worktree; headless chrome-headless-shell; real client
POSTs fired from a loaded game page so session + CSRF are real; server truth read back with a read-only
`bin/rails runner`). The object-action gate "open a route-room object before promotion" forge has no
lockable object in either deployed split route room, so it stays covered by Rails tests 11a-13 (Chunk A/B).

Honest routes (both complete the credited task and open the room's contents, server truth):
- **test_gate_tailgate viaPass, game 3396.** Wear the lanyard (visitor_pass server-set true), unlock via
  Sam (staff_room -> npcRouteRooms), sync currentRoom staff_room (viaPass credit), complete enter_staff.
  Truth: test_staff_entered true, staff_room in unlockedRooms, npcRouteRooms emptied, enter_staff posts
  success.
- **lab_physical_pentest viaPass, game 3397.** Wear the hi-vis (courier_ready), unlock via Len, sync
  currentRoom secure_area. Truth: kp_badge_tailgated true, tailgate_in completed, secure_area unlocked,
  npcRouteRooms emptied.
- **lab_physical_pentest viaCredential, game 3398.** A recorded clone of cm_records_badge plus the held
  rfid_cloner; POST unlock method:rfid. Truth: kp_records_cloned true, tailgate_in completed, secure_area
  unlocked. (The clone and cloner were seeded as a head-start, the shape POST /clone_card produces after
  an encounter, exactly as lab_gated_door_test does; the credit runs on the real unlock endpoint.)

Forged attempts (all refused; player-facing result sensible; avatar stays put, no snap-back):
- **lab, game 3399.** Sync `{ kp_badge_tailgated: true, kp_records_cloned: true }` -> accepted-but-dropped
  (both stay false, read-only server-credit globals). POST complete_task tailgate_in -> 422 "Task is
  server-completed only". POST skip_task tailgate_in -> 422 "Task is server-completed only". Truth:
  secure_area in npcRouteRooms NOT unlockedRooms, tailgate_in active, both kp globals false.
- **test_gate_tailgate, game 3402.** POST complete_task enter_staff before reaching the room -> 422 "Room
  not reached", retryable. Then unlock via Sam (route recorded), then sync
  `{ test_staff_entered: true }` -> accepted-but-dropped. Truth: test_staff_entered false,
  staff_room in npcRouteRooms NOT unlockedRooms.

Honest regression on deployed missions (a few doors each, real endpoints, all succeed and the room lands
in unlockedRooms -- nothing changed):
- **m01_first_contact:** server_room (rfid, game 3406), derek_office (key, game 3407).
- **sis02_energy:** battery_hall_1 (rfid, game 3408), engineering_workshop (rfid, game 3409).

### Open / not done

- UID-only after-promotion discrimination test: left (heavy fixture), see above.
- The object-action-gate "open before promotion" forge was not re-run live (no lockable object in a
  deployed split route room); covered by Rails tests 11a-13.

## Gameplay proof: played as a student, not fetched (2026-11-13)

Driven through the window.__test bridge in a headless browser on a keyless server on :3650 from this
worktree: real avatar movement, the hi-vis/lanyard worn from the kit through its confirm, the NPC
followed through the gate, the cloner minigame run against the NPC, and the records door clicked. This
is the path the earlier Chunk E live proof skipped by firing the sync and unlock POSTs from a loaded
page. Server truth read back read-only.

### Result per case

| Case | Game | Route | Outcome |
|---|---|---|---|
| 1 | 3418 | lab hi-vis (viaPass) | FAIL: credit never fires in real play |
| 2 | 3419 | lab clone (viaCredential) | PASS |
| 3 | 3420 | test_gate visitor_pass (viaPass) | enter_staff completes, but the viaPass credit does NOT fire |
| 4 | 3421 | lab hi-vis, reload | recovers, but position lost and task still uncompletable via hi-vis |
| 5 | 3422 | lab hi-vis, throttled | tailgate works, no error, but credit still does not fire |

### The defect the fetch-driven proof hid

The viaPass credit (GATED_DOOR §3.3a) is wired to fire on the `currentRoom` sync. The real client never
sends `currentRoom` in `PUT /sync_state`. `public/break_escape/js/state-sync.js:385` builds the field as
`out.currentRoom = window.currentRoom?.name`, but `window.currentRoom` is set to `null` in
`public/break_escape/js/main.js:64` and is never assigned a room object anywhere (it stays null in every
session, not just bridge-driven ones). The engine's real player room lives in `window.currentPlayerRoom`
(set in `core/rooms.js:3182-3183`), which the field should read. Because the built field is always
undefined, the sync delta at `state-sync.js:480-481` never adds `currentRoom`, so the controller branch
at `games_controller.rb:2146-2163` that calls `credit_via_pass_on_sync!` is never reached.

Proven three ways while standing inside the gated room, game 3418: `window.currentPlayerRoom` was
`"secure_area"` while `window.currentRoom` was `null`; a forced full `window.stateSync.sync()` sent a body
whose only keys were `globalVariables, scenarioClock, timedMessages, clientTs` (no `currentRoom`); and the
server, after the walk and sync, still held `currentRoom="briefing_room"` (the start room, never advanced),
`secure_area` in `npcRouteRooms` not `unlockedRooms`, `kp_badge_tailgated` unset, `tailgate_in` not
completed. The Chunk E live proof (game 3397) set `kp_badge_tailgated`/`tailgate_in` only because it fired
a `/sync_state` fetch with `currentRoom` hand-set; the real client cannot produce that request.

The clone route is unaffected because its credit (viaCredential) runs in the `/unlock` door branch, not
the sync.

### Server truth

- **Case 1, game 3418 (hi-vis).** Wore the hi-vis from the kit (confirm "Put it on", `courier_ready`
  true), waited by the ledger shelves, walked in behind Len on his badge read (crossed into
  `secure_area`, `window.currentPlayerRoom="secure_area"`). After sync: `currentRoom="briefing_room"`,
  `unlockedRooms` without `secure_area`, `npcRouteRooms=["secure_area"]`, `kp_badge_tailgated` unset,
  `tailgate_in` not completed (only `brief_heard` completed). Player-visible: the objective "Get past the
  records door" stays active while the avatar is standing inside the records office, with no error or
  toast to explain why. Screenshot:
  `scratchpad/tgplay/case1-stuck-in-secure_area.png`.
- **Case 2, game 3419 (clone).** Picked up the RFID cloner (`cloner_held` true), stood by Len, chose
  "Chat with Len, close enough for the cloner...", the RFID read opened, clicked Save (clone of
  `cm_records_badge` saved, `opt_clone` completed), clicked the records door. Toast "Door: Access granted:
  cloned staff badge accepted." Truth: `kp_records_cloned=true`, `tailgate_in` completed, `secure_area` in
  `unlockedRooms`, `npcRouteRooms=[]`. Clean pass.
- **Case 3, game 3420 (visitor_pass).** Wore the visitor lanyard from the kit (`visitor_pass` true),
  followed Sam through the gate into `staff_room`. Truth: `enter_staff` completed and the "enter" aim
  completed (the enter_room task validates against `npcRouteRooms` membership, which the NPC wrote). BUT
  `test_staff_entered` unset and `staff_room` still in `npcRouteRooms`, not `unlockedRooms`: the viaPass
  credit did not fire, the same defect as case 1. The brief's stated outcome (enter_staff completes)
  holds; the Chunk E claim of `test_staff_entered` true and the room promoted does not hold in real play.
- **Case 4, game 3421 (reload).** Wore the hi-vis, slipped into `secure_area`, synced, reloaded with
  `?skip_resume=1`. The game recovered and was playable; the Mission Brief replayed (intended). The player
  resumed in `briefing_room`, not `secure_area`: because `currentRoom` never synced, all physical progress
  through the building was lost on reload. Truth after reload: `secure_area` still in `npcRouteRooms`
  (gate still slippable), `courier_ready` still true, `tailgate_in` not completed. The task stays
  completable only via the clone route, never via the hi-vis route. No crash, no error toast.
- **Case 5, game 3422 (throttled).** Repeated case 1 with a page-level fetch delay of 1.5 to 3 s on every
  `/sync_state` and `/unlock` request (8 requests delayed). The tailgate into `secure_area` worked, no
  JavaScript error fired (window error and unhandledrejection listeners stayed empty) and no error toast
  showed. `tailgate_in` still not completed: the throttle changes nothing, the non-completion is the
  viaPass defect, not the delay.

### What could not be driven

- The viaPass "promoted after reload" variant of case 4 could not be exercised, because promotion never
  happens via the hi-vis route (the defect above), so there is no promoted state to reload into.

Logs: `tools/playtest/lpp-hivis-3418-session.jsonl`, `lpp-clone-3419-session.jsonl`,
`tgt-3420-session.jsonl`, `lpp-reload-3421-session.jsonl`, `lpp-throttle-3422-session.jsonl`.

## Fixes after R3 and gameplay (2026-11-13)

Commit `eb1230fef`. Tests, validator counts and a gameplay re-proof below. Branch `build/hard-tailgate-plan`.

### The currentRoom defect (found by gameplay, also present on main)

`public/break_escape/js/state-sync.js` built `currentRoom` from `window.currentRoom?.name`, but
`window.currentRoom` is set to `null` in `main.js` and never assigned; the player's room is the string
`window.currentPlayerRoom` (`core/rooms.js`). `buildPlayerSections` now reads `window.currentPlayerRoom`
(empty string collapses to undefined, so the delta never sends a bare `''` the guard would refuse).

What changes now that currentRoom really syncs, checked per the plan:

- **Sync guard.** Every reader of `window.currentRoom` was checked first: `person-chat-minigame.js` and
  `test-bridge/state.js` already prefer `currentPlayerRoom`/`npc.roomId`, so none wanted the object.
  Enabling the sync means currentRoom now reaches `merge_last_write_wins_sections`. The old guard
  accepted only unlockedRooms / npcRouteRooms / startRoom and refused everything else (a 403 that rolls
  back the whole sync, a tested contract). That would newly 403 the one deployed case where the player
  legitimately stands in a room not in those lists: an **awareness world room**. `enterWorld`
  (`utils/world-play.js`) loads `episode.world.room` and places the player there with no door unlock, so
  it is never in unlockedRooms (only `ca12_visitor_tailgater` has a world room, `lobby`, that is not the
  start room; the other ca-episodes' world room is the start room). The guard now calls
  `Game#may_sync_current_room?`, which mirrors `player_reached_room?` (minus its circular currentRoom
  disjunct): the three cheap player_state lists first (no scenario read on an ordinary sync into an
  unlocked room), then a lazy `scenario_data` load for the start-room and awareness-world-room checks.
  A genuine forge (a locked room in none of these) is still refused.
- **savedCurrentRoom at load.** Only `state-sync.js:130` consumes it, to seed the delta baseline so the
  first post-load sync does not resend an unchanged room. Nothing repositions the player to the saved
  room on load (m01 reload: player resumes in the start room, not the saved room). No spawn change.
- **Delta rule (SYNC SIZE).** currentRoom is sent only when it is truthy and differs from the confirmed
  value (`state-sync.js:487`), once per room change, then confirmed; an unchanged room sends nothing.
  No per-sync growth.
- **player_reached_room? currentRoom disjunct (Chunk F).** Still safe: the guard only ever saves
  currentRoom to a room in the accepted set, so a forged currentRoom a sync rejects never persists, and
  the disjunct can only match an already-durably-reachable room.

### R3 minors and the observation

- **Minor 1.** The `serverCompletedOnly` guard moved after the already-completed branch in both
  `complete_task!` and `skip_task!`. An honest re-post of an already-credited task gets the idempotent
  "Already completed"; a forge of a not-yet-completed task still hits the guard. Controller tests 5/5b/5c
  (a not-yet-completed task) still refuse; new tests 5d/5e (an already-credited task) assert the
  idempotent reply.
- **Minor 2.** The validator warns when an eventMapping/reward/action completes (client `completeTask`) a
  task that a `creditOnPass.completeTask` credits (the serverCompletedOnly set), mirroring the
  credit-global client-writer warning; the creditOnPass blocks themselves are pruned. Node test bites.
  It fires on no deployed scenario (lab, test_gate_tailgate, m01, sis01, sis02, lab_social_engineering).
- **Minor 3.** The split predicate is aligned to the runtime `gate_splits?` (a server-owned pass, or an
  rfid_cloner anywhere, with no room-`requires` condition). The validator (`check_gated_door_credit`) and
  graph (`generate_dungeon_graph.rb`) dropped `&& requires`. Chosen because the runtime rule is the truth
  and it wrongly splits no deployed gate: the only cloner gates (lab, test_gate_tailgate) each carry a
  requires card, so the split decision and the committed graphs are byte-identical, while a cloner-split
  gate with a client-writable pass is now caught. A shared note sits at `Game#gate_splits?`.
- **Observation.** `migrate_soft_locked_route_rooms!` uses `next` in place of the non-local `return`
  inside `with_lock`.

### Tests (no full suites)

- Rails models: `gated_route_room_test`, `gated_door_credit_test`, `gated_server_completed_task_test`,
  `lab_gated_migration_test`, `enter_room_validation_test` -> 37 runs, 0 failures (before the two new
  minor-1 model tests; with them `gated_server_completed_task_test` grows and still passes).
- Rails controllers: `gated_route_room_controller_test`, `gated_door_credit_controller_test`,
  `gated_server_completed_task_controller_test` (now with 5d/5e), `lab_gated_door_test`,
  `reload_persistence_test`, `games_controller_test` (63 runs, 0 failures). All green except one
  **pre-existing** `reload_persistence_test` failure (`the save reads neither scenario_data...`, expects
  2 game SELECTs, gets 3) that also fails at `f3e6c63a8` with these changes reverted: a plain
  globalVariables sync (no currentRoom) reads full `scenario_data`. Not caused by this work; flagged.
- Node: `state-sync.test.mjs` (26, incl. 3 new currentPlayerRoom tests), `validator-gated-door-credit`
  (13, incl. the two new minor tests), `enter-room-completion` (12), `lab-gated-credit-scan` (3). Pass.
- Validator (ERROR/WARNING line counts, unchanged from R3): lab_physical_pentest 0/7, test_gate_tailgate
  0/2, m01_first_contact 0/13, sis01_healthcare 0/10, sis02_energy 0/7, lab_social_engineering 0/5.

### Gameplay re-proof (played as a student, headless, :3650, setFPS behaviour as before)

The avatar was driven through `window.__test`: worn items from the kit, the NPC followed through the
gate, the records/staff door reached, the **real client's own** `sync_state` capturing currentRoom (not
hand-set). Server truth read back read-only.

| Case | Game | Route | Outcome |
|---|---|---|---|
| 1 | 3456 | lab hi-vis (viaPass) | PASS: real sync sent `currentRoom:"secure_area"`; server promoted secure_area into unlockedRooms, `npcRouteRooms=[]`, `kp_badge_tailgated=true`, `tailgate_in` completed; `cm_deeds_key` picked up |
| 3 | 3457 | test_gate_tailgate (viaPass) | PASS: `test_staff_entered=true`, staff_room promoted, `enter_staff` completed (the R3 claim that failed in real play before) |
| 4 | 3456 | lab reload in secure_area | PASS: reload harmless, credit persisted, no errors; player resumes in the start room (nothing repositions to the saved room, as before) |
| 6 | 3464 | lab no-vest slip-in | PASS: the gate never opens for the unauthorised player (`door_gate_opened` never fires), so he cannot enter; earns nothing; `currentRoom="open_plan"` synced and accepted |
| 7 | 3458 | m01 reload after a second room | PASS: unlocked+entered main_office_area, `currentRoom` sync returned HTTP 200 (no 403) for both rooms; reload harmless, inventory intact |

Not re-driven live this round, with reason: **clone (viaCredential)** runs in the `/unlock` door branch,
untouched by the client currentRoom fix; its server path is proven by the passing controller test
`the credited task still completes end to end via the cloned-badge route` (tailgate_in completed,
secure_area unlocked). **Throttle (1.5-3s on sync/unlock)** only delays requests; the earlier proof
already showed the tailgate works under that delay with no error, and the one open question then (the
credit firing) is proven by case 1.

Logs: `tools/playtest/lpp-hivis-3456-session.jsonl`, `tgt-3457-session.jsonl`,
`lpp-novest-3464-session.jsonl`, `m01-reload-3458-session.jsonl`.

## Fix: SYNC SIZE regression (ordinary sync read scenario_data) + awareness sanity (2026-11-13)

Commits `2bb7f6960` (fix + Rails tests), `b009d08dd` (node harness).

### The regression (NOT pre-existing; introduced on this branch by Chunk B)

`reload_persistence_test.rb:834` ("the save reads neither scenario_data nor the player and
mission rows") expects an ordinary sync (`globalVariables` only, no `currentRoom`) to issue 2
game SELECTs (the narrow `FOR UPDATE` load + the `formatVersion` jsonb pluck), never the full
`scenario_data` blob. It got 3. The earlier fixer called it pre-existing; it is not. `build/hard-8c`
(which contains main `fc4b4d8a5`) ran this test green. **Culprit: Chunk B commit `0a64c271f`**, which
added `server_credit_global_names` to the `merge_global_variables!` read-only list (`game.rb:797`).
On a fresh game the `serverCreditGlobals` memo is absent, so that method fell back to
`self.class.where(id: id).pick(:scenario_data)` -- a full blob read on every game's first global
sync. `server_completed_only_task_ids` (Chunk C) had the identical fallback (not on the sync path,
but fixed for symmetry).

### The fix

- **Seed at creation.** `initialize_player_state` now derives `serverCreditGlobals` and
  `serverCompletedOnly` from `scenario_data` (loaded at creation) and memoises them into
  `player_state`, as `worn_global_names` does. The narrow sync row then reads the memo from
  `player_state` and never reloads `scenario_data`.
- **Sync-path readers never read `scenario_data`.** `server_credit_global_names` /
  `server_completed_only_task_ids` drop the `.pick(:scenario_data)` fallback: memo present -> use it;
  else scenario_data already loaded in-request (creation, show, the credit paths that call
  `ensure_scenario_data_loaded!` first) -> derive and memoise; else (narrow sync row, no memo) -> `[]`.
- **Absent-memo failure direction (checked).** An absent memo returns `[]`, which is the safe
  direction: a game stored before this change has a `scenario_data` snapshot (per-game column, taken
  at creation) that predates the `creditOnPass` scenario edits, so it credits no global at all; `[]`
  is correct and a client still cannot write a credit global that does not exist for that game. A
  game created by this code always has the memo. So A+B+C+D+E ship together (the deployment gate):
  no game can have `creditOnPass` in its snapshot yet lack the memo.
- SYNC SIZE: both memos are small, bounded, server-written only, derived once, never re-sent by the
  client and never grow per sync.

Tests added to `reload_persistence_test.rb`: creation seeds both memos; and an ordinary sync does no
full `scenario_data` read even with the memo deleted (the pre-change path).

### Node harness regression (also introduced on this branch, by `eb1230fef`)

`test/js/sync-request-sizes.test.mjs` case 2 ("first sync in a different room ...") failed: `eb1230fef`
changed `state-sync.js:392` to read `window.currentPlayerRoom` and updated `state-sync.test.mjs`, but
left this test's `loadedGame()` helper setting only the legacy `window.currentRoom`, so `buildChanges`
saw no room. Harness now sets `currentPlayerRoom: 'lobby'` to match the real page; the committed
`buildchanges_room_only` fixture is unchanged.

### Tests (no full suites)

- Rails (0 failures): `reload_persistence_test` (71 runs, incl. the 2 new), `games_controller_test`,
  `gated_door_credit`/`gated_route_room`/`gated_server_completed_task` (model + controller),
  `lab_gated_door`, `lab_gated_migration`, `enter_room_validation`, `captures_sync`, `wearable`
  (the batch: 167 runs, 658 assertions).
- Node (5 files pass): `state-sync`, `sync-delta-proof`, `sync-request-sizes`, `global-sync-declared`,
  `social-state-sync-confirmed`.

### Awareness sanity: ca12_visitor_tailgater (live, keyless :3650, headless, setFPS(20), fixed steps on)

Game 3481. Entered the world through the real `utils/world-play.js` `enterWorld({room:'lobby'})`
(start room `training_room`, world room `lobby`), then fired the real client `window.stateSync.sync()`.
Server log read back per request:

- The `currentRoom: "lobby"` sync returned **200**; server saved `currentRoom="lobby"`.
- The ordinary sync after it (`globalVariables` only, no `currentRoom`) returned **200** and read
  **no** `scenario_data` -- only the narrow load + the `formatVersion` jsonb pluck.
- A forged `currentRoom: "__forged_nowhere__"` returned **403** (that path loads `scenario_data` to
  check start/awareness, then refuses).

`may_sync_current_room?` probed directly with `lobby` absent from `unlockedRooms` (in-memory, not
saved): `lobby` -> true (the awareness lazy-read branch), start room -> true, forged -> false. So the
awareness world room is accepted via the lazy scenario read and a genuine forge is still refused.
