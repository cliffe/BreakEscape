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
