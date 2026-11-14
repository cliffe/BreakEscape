# Gated-door server check: adversarial review, round 4 (everything since R3)

Scope: `git diff 3f646ec42 d5f2c6646` on branch `build/hard-tailgate-plan`, reviewed read-only in the
worktree. Weight on the change that makes `currentRoom` really sync for every mission (`eb1230fef`),
the widened sync guard `Game#may_sync_current_room?`, the SYNC SIZE fix (`2bb7f6960`), the memo seeding
at game creation, and the three R3 minors plus the observation. Reviewed against
GATED_DOOR_SERVER_CHECK_PLAN.md (sections 3.3a, 7, 8), the build log from "Gameplay proof" to the end,
and R3.

## Verdict

Ship. The client now sends the player's real room (`state-sync.js:392` reads `window.currentPlayerRoom`,
which `core/rooms.js` actually sets, in place of the always-null `window.currentRoom`). Enabling that
sync is safe on every scenario in the brief: no honest player is refused, no forge is admitted, SYNC
SIZE holds, and the memo-seeding failure direction is the safe one. The three R3 minors and the
observation are closed in code. The two minors below are latent (no shipped scenario triggers them) and
future-proofing; neither blocks the merge.

## Counts

- Blockers: 0
- Majors: 0
- Minors: 2 (both latent)
- Observations: 2

## No honest case hits the 403 (the brief's central question)

A `currentRoom` the guard rejects raises `ActiveRecord::Rollback` (`games_controller.rb:854`), so the
whole sync is dropped and 403'd; on the client a 403 throws before `this.confirm(...)` runs
(`state-sync.js:641` vs `:657`), so nothing is marked confirmed and the next sync re-sends the batch.
A persistent honest 403 would therefore lose no data but would re-send the whole batch on every sync
(a SYNC SIZE breach) and never advance the saved room. So the acceptance set must admit every room an
honest player can stand in. It does, and the reason is a single structural invariant, not case
enumeration:

**Feet-detection only names a room that is already server-accessible.** `updatePlayerRoom`
(`core/rooms.js:3164-3176`) only considers rooms with a built `.map` (`:3165`). A room gets a `.map`
only through `loadRoomOnce`, which either uses the roomData cached from an `/unlock` response (the POST
already ran `unlock_room!`, so the room is in `unlockedRooms`) or fetches `GET room/<id>`; that endpoint
403s a room that is not start/`unlockedRooms`/world/route (`games_controller.rb:544-546`) and
`loadRoomOnce` bails before building the map on a non-ok response (`core/rooms.js:983-986`). So
`window.currentPlayerRoom` can only ever be a room the server has already recorded as accessible, i.e.
a room `may_sync_current_room?` accepts. This covers the normal door flow (even an unlocked door and an
open doorway POST `method: unlocked` and open only in the `.then`, `unlock-system.js:727-758`), the
"walk behind the back wall" effect (the neighbour is only detectable if it was loaded, which means it
was accessible), route-room slip-ins (`npcRouteRooms`, written by the NPC POST before the player
crosses), the start room (`start_room?`), and the awareness world room.

`may_sync_current_room?` (`game.rb:492`) mirrors `player_reached_room?` minus its circular `currentRoom`
disjunct: `unlockedRooms`, `in_npc_route_room?`, then a lazy scenario load for `start_room?` /
`awareness_world_room?`. Every source is server-written player_state or scenario_data; none is the client
string. Verified against the scenario set:

- m01-m10, sis01, sis02, lab_social_engineering: every non-start room is reached through a server-checked
  door unlock, so it is in `unlockedRooms` before the avatar can be detected in it. Live-proof smoke
  (m01 game 3502, sis01 3505, old-game 3490 re-walk, slow-net 3506) shows 0x403 across real walks.
- lab_physical_pentest, test_gate_tailgate: the split route room is in `npcRouteRooms`; promotion adds it
  to `unlockedRooms`. Both accepted.
- awareness ca* episodes: inspected all of them. Each has at most start + one world room; only
  `ca12_visitor_tailgater` has a world room that is not the start room (`lobby`), admitted by
  `awareness_world_room?` and, after the first `GET room`, by `unlockedRooms` (the auto-unlock branch
  `games_controller.rb:551` adds a world room because it is neither unlocked nor a route room). No
  episode places the learner in any third room. Live-proof ca12 game 3481: `lobby` sync 200, forged
  `__forged_nowhere__` 403.

I could not construct an honest 403 in any listed scenario.

## Other readers of player_state.currentRoom now that it is real

- `savedCurrentRoom` (`games_controller.rb:353`, consumed at `state-sync.js:130`): seeds the delta
  baseline only; nothing repositions the avatar to it on load (reload resumes in the start room, build
  log cases 4/7). No spawn change.
- `player_reached_room?` currentRoom disjunct (`game.rb:479`): safe. The sync only ever saves a
  `currentRoom` that passed `may_sync_current_room?`, which is a subset of the durable disjuncts, so the
  disjunct can only match an already-reachable room and adds no exploitable coverage.
- `games_controller.rb:502` (room response echoes currentRoom), `game.rb:6300` (init `||= startRoom`),
  `npc_frustration.rb:396` (comment only): none gates access or repositions.
- No carry-over, debrief, verify-run or objectives path reads `currentRoom` server-side (grep of `app/`).
  Hacktivity-facing summaries live in the other repo and were not inspected here; the only change they
  would see is a real room id instead of the perpetual start room, which is cosmetic unless a summary
  keys on `currentRoom == startRoom` as "not started" (worth a glance on the Hacktivity side, not a
  defect in this branch).
- Client readers (`objectives-manager.js`, `door-gates.js`, `npc-*`, `interactions.js`, `inventory.js`,
  `knockback.js`, ...) already read `window.currentPlayerRoom`; the change touches only the sync field,
  so none of them behaves differently.

## Memo seeding (serverCreditGlobals / serverCompletedOnly)

Safe in every direction the brief raises.

- `initialize_player_state` (`game.rb:6360-6369`) derives both memos from `scenario_data` at creation.
  The sync-path readers (`game.rb:273-281`, `:318-325`) drop the old `.pick(:scenario_data)` fallback:
  memo present -> use it; else scenario already loaded in-request -> derive; else (narrow sync row) ->
  `[]`. This is what fixes the Chunk B SYNC SIZE regression (the old fallback read the whole blob on
  every first global sync).
- Absent memo -> `[]` is the safe failure direction. A game stored before this change has a per-game
  `scenario_data` snapshot that predates `creditOnPass`, so it credits nothing: `[]` is correct, and a
  client still cannot write a credit global that does not exist for that game (serverCreditGlobals `[]`
  just means no extra read-only names, and there are none to protect), nor can a non-existent
  server-completed-only task become client-completable.
- Template edited after a game was created: the per-game snapshot and the seeded memo are both frozen
  at creation and stay consistent; a later template edit changes neither, so no drift.
- D's show-time migration: on a full load (`show`) `scenario_data` is present, so a memo-less old game
  derives from its own frozen snapshot (correct), and a branch-created game already has the memo. The
  deployment gate (A+B+C+D+E together) guarantees no game has `creditOnPass` in its snapshot without the
  memo.

## R3 findings: closed or open

- R3 MINOR 1 (serverCompletedOnly guard before the idempotent branch): CLOSED. The guard now sits after
  the already-completed branch in both `complete_task!` (`game.rb:4189`, after the idempotent return at
  `:4165-4186`) and `skip_task!` (`game.rb:4312`, after the already-completed/skipped return moved up to
  `:4302`). An honest re-post of a server-credited task gets the idempotent "Already..."; a forge of a
  not-yet-settled task still reaches the guard. Controller tests 5d/5e assert it.
- R3 MINOR 2 (validator misses a half-migrated credited task): CLOSED for JSON. `check_gated_door_credit`
  now collects every `creditOnPass.*.completeTask` id and walks `json_data` for a client `completeTask`
  of one, pruning the `creditOnPass` blocks themselves (`validate_scenario.rb:6732-6746`, `:6858-6882`).
  Ink `completeTask` is still not scanned (Observation 1), as the plan foresaw ("where feasible").
- R3 MINOR 3 (split predicate divergence): CLOSED. Runtime `gate_splits?` (`game.rb:198-203`), the
  validator (`validate_scenario.rb:6791`, `splits = pass_server_owned || has_cloner`) and the graph
  (`generate_dungeon_graph.rb:541-542`) now all split on "server-owned pass, or an rfid_cloner anywhere",
  with the `&& requires` condition dropped from the latter two. A shared note sits at `gate_splits?`.
  The graph keeps a separate `has_credential` for its label only and tags a cloner-only-no-card split
  "route only". Validator counts unchanged (0 errors on every brief scenario; warnings lab 7, test_gate
  2, m01 13, sis01 10, sis02 7, lab_SE 5, ca12 1).
- R3 Observation (non-local `return` in `with_lock`): CLOSED. `migrate_soft_locked_route_rooms!` uses
  `next` (`game.rb:530`).

## Findings (round 4)

### MINOR 1 - a currentRoom refusal rolls back the whole sync, and that path is now live

Files: `app/controllers/break_escape/games_controller.rb:2158-2160` (refusal) and `:853-854` (the
refusal raises `ActiveRecord::Rollback`, dropping globalVariables, notes, captures, health and every
other section in the same batch).

Failure scenario: before this branch the old guard never fired on honest play, because `currentRoom`
never synced. Now it does, so the whole-sync rollback is a live path for the first time. No shipped
scenario can trigger it (the room-load invariant above holds for all of them), but a future author who
creates a room the player can occupy without it being loaded through a server-checked path (a bespoke
teleport, a client-only placement, a roomless walkable join) would have every sync batch for that player
dropped, and if the condition persists the client re-sends the whole batch forever (SYNC SIZE) while the
saved room never advances.

Fix (optional, robustness): on a `currentRoom` the guard rejects, skip only the `currentRoom` update and
let the rest of the sync commit, rather than rolling the batch back. This is safe under the cheat policy:
a forge gains nothing from having `currentRoom` skipped (the durable lists still gate contents and
credit, and `merge_global_variables!` keeps its own read-only protection), while an honest edge case
keeps its other state. Alternatively, keep the rollback but add a regression guard asserting the
room-load invariant. Latent; not required to merge.

### MINOR 2 - the unrouted Api::GamesController sets currentRoom with no guard, now higher-stakes

File: `app/controllers/break_escape/api/games_controller.rb:16-18` (`@game.player_state['currentRoom'] =
params[:currentRoom]`, then `save!`), no `may_sync_current_room?` check and no row lock.

The controller is not in `config/routes.rb` and is documented as must-stay-unrouted (its header comment,
`:3-6`; `api_games_controller_test.rb` drives it only through a synthetic route). So it is dead in
production and not a live hole. But its warning comment predates this work and lists only the inventory
and lock bypass; now `currentRoom` feeds `player_reached_room?` (the enter_room server validation, §8)
and, in the real controller, the viaPass credit, so routing this action would also forge the soft
enter_room signal and set an unchecked saved room. Fix: extend the header comment to name the
currentRoom / enter_room / credit stakes, so a future editor does not route it. Pre-existing, latent.

### Observation 1 (minor) - validator minor-2 scans JSON, not compiled ink

`check_gated_door_credit` walks `json_data` for a client `completeTask` of a credited task but does not
read the compiled ink, so an ink `completeTask` of a serverCompletedOnly task would not warn. This
matches the plan's "where feasible" scope and is warning-only; no deployed scenario completes a credited
task from ink (the lab's `tailgate_in` has no client completer anywhere). Noted for the next editor.

### Observation 2 (trivial) - a forged currentRoom pays a scenario_data read

`may_sync_current_room?` loads `scenario_data` on the miss path (to check start/awareness), so a client
that forges `currentRoom` to a non-member room triggers one scenario read per forged sync before the
403. This is a cost borne only by a cheating client, not a SYNC SIZE issue (nothing is sent back), and
the refusal is correct. No change needed.

## Tests run (no full suites, no server)

- Rails models (39 runs, 143 assertions, 0 failures): `gated_door_credit_test`, `gated_route_room_test`,
  `gated_server_completed_task_test`, `lab_gated_migration_test`, `enter_room_validation_test`.
- Rails controllers, gated + currentRoom (33 runs, 164 assertions, 0 failures):
  `current_room_guard_refusal_test`, `gated_door_credit_controller_test`,
  `gated_route_room_controller_test`, `gated_server_completed_task_controller_test`, `lab_gated_door_test`,
  `saved_current_room_test`.
- Rails controllers, neighbours (134 runs, 466 assertions, 0 failures): `reload_persistence_test`,
  `games_controller_test`. The reload_persistence failure flagged in the build log at `eb1230fef` is
  resolved by the SYNC SIZE fix; green here.
- Node (all pass): `state-sync` (26), `sync-request-sizes` (8), `sync-delta-proof` (8),
  `enter-room-completion` (12), `validator-gated-door-credit` (13).
- Validator (`--no-graph`): 0 errors on lab_physical_pentest, test_gate_tailgate, m01_first_contact,
  sis01_healthcare, sis02_energy, lab_social_engineering, ca12_visitor_tailgater, test_bark_bubbles,
  test_access_habits; warning counts match the build log.
