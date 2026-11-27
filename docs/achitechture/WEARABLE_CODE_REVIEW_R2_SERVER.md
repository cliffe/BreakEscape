# Wearable items: code review round 2 (server and lab)

Branch `build/wearable` at 6589ce444, against `main` (merge base 0503974aa; `main` has moved on
by one backlog-only commit since). Scope: the server half of the diff: `app/models/break_escape/wearables.rb`,
`lib/break_escape/wearable_model.rb`, `POST wear` (controller, route, policy, row lock), the hooks
in `game.rb` and `network_access.rb`, the validator (`scripts/validate_wearable.rb`, schema), the lab
scenario JSON and the Ruby tests. Decided by the orchestrator and not treated as findings:
`unseenOnly` is checked in the client only; the records-door bypass is pre-existing and backlogged.

Checked by: reading the diff and the code paths it touches; `bin/rails test
test/controllers/break_escape/wearable_test.rb` (27 runs, 114 assertions, 0 failures) and
`test/models/break_escape/lab_physical_pentest_secrets_test.rb` (36 runs, 0 failures); the full
validator on `lab_physical_pentest` and `test_wearable` (no wearable, costume or other errors);
comparing the controller action lists, policy and routes against `main` after the merge
(fecfad507). Tests were judged for strength by reading them against the code, not by mutation (this
review writes nothing but this file).

## Severity table

| Id | Severity | Finding |
|----|----------|---------|
| m1 | minor | In-flight games are not upgraded at all: the older-game reconcile path can never run, and the build log says otherwise |
| m2 | minor | Validator misses the `# set_variable:<worn global>=` ink tag |
| m3 | minor | No Rails test that `pp_disguise` stays writable in a scenario without wearables |
| n1 | nit | Two read-only edge cases have no test (a `null` delete of a worn global; reset clears `worn`) |
| n2 | nit | The validator checks `wear` / `take_off` targets only under a fixed list of action keys |

No blockers, no majors.

## Round 1 findings: fixed and tested?

| R1 | Status | Evidence |
|----|--------|----------|
| m1 (costume protects no server outcome) | Wording fixed; backlogged (orchestrator) | Build log "Open", README sentence, `docs/IDEAS_BACKLOG.md` |
| m2 (in-flight game stuck) | Code added and tested, but the state it handles cannot arise for a real game: see m1 below | `wearables.rb:190-201`, `:283-316`; tests `wearable_test.rb:243`, `:255`, `:271` |
| m3 (drop alone keeps the worn item) | Fixed and tested | `game.rb:452` calls `release_dropped_worn_item!` (`wearables.rb:105`); the test at `wearable_test.rb:177` now sends no remove and would fail without the call (worn record, global and held copy all asserted) |
| m4 (`# set_global:` tags) | Fixed and tested | `validate_wearable.rb:577`; `test/js/validator-wearable.test.mjs:92`. A third tag form is still missed: m2 below |
| m5 (test gaps) | Fixed | Lab grant then wear then take off (`wearable_test.rb:369`, real lab scenario rendered), plant (`:340`), 403 on another player's game (`:293`), drop (`:177`), `check_wearables` on the lab in Rails (`:390`) |
| n1 (log line) | Fixed | `game.rb:290-298` |
| n2 (`spec_for_id`) | Removed | `lib/break_escape/wearable_model.rb` |
| n3 (`pp_disguise` client-writable) | Fixed and tested for a wearables scenario | `wearables.rb:41-44`; `wearable_test.rb:285`. The opposite case is untested: m3 below |
| n4 (unrouted API controller) | Comment added | `api/games_controller.rb:3-6`; still absent from `config/routes.rb` |
| n5 (docs) | Fixed | README wearable paragraph, last sentences |

## Authority, question by question

- **Wear without holding the item, or a made-up wearable.** Refused. `wear!` reads `wearable` from the
  server's held copy (`wearables.rb:60-64`). Every way an item reaches the inventory stores a server
  copy: `canonical_inventory_item` (`games_controller.rb:2154`) copies the scenario or room item and
  strips `CLIENT_ITEM_FORBIDDEN_FIELDS` (which includes `wearable`) from anything else. A source-less
  `update_room add_object` cannot plant a forged wearable in a room to pick up later: `item_add_params`
  (`games_controller.rb:2748`) permits no `wearable` key. The costume must also be a key of the
  game's own `scenario_data['disguises']`.
- **Write a worn global or `pp_disguise` by sync.** No. `merge_global_variables!` (`game.rb:284`)
  checks the read-only list before the `nil` delete branch, so neither a set nor a delete gets
  through. No other sync section (`npcInkVariables`, notes, grow-only sections) writes
  `player_state['worn']` or `wearableGlobals`. Remaining server writers of a global are authored
  (`apply_task_set_globals!`, `flagRewards`, imports), and `WearableModel.global_writers` walks the
  whole tree, so a `set_global` or `setGlobal` naming a worn global anywhere in the JSON is a
  validator error.
- **Remove or drop past the rule.** Every server path that takes an item out of the inventory calls
  the release: `remove_inventory_item!` (`game.rb:205`), the network plant (`network_access.rb:204`)
  and now the player drop (`game.rb:452`). The other inventory writers (`network_access.rb:227`, the
  unplug's link item; `game.rb:4282`, initialisation) never remove a wearable. The 9.2 B merge
  (`npc_frustration`, `npc_workaround`) brought no inventory removal. The "seen" part of the rule is
  client-only by decision.
- **Locks.** `wear` is in both `set_game` and `with_game_lock` (`games_controller.rb:29`, `:95`);
  `update_room`, `inventory` and `network_plant` are locked; `sync_state` takes its own row lock and
  the first-sync list is worked out inside it.
- **Merge resolution.** Against `main`, the controller's `before_action` and `around_action` lists,
  the policy and the routes differ only by the added `wear` entries; every 9.2 B action
  (`npc_frustration`, `npc_workaround`) is present in both lists, and `wear?` sits beside the other
  `show?` delegates.
- **Reset.** `reset_player_state!` keeps only the preserved keys (`game.rb:99-102`), so `worn` goes,
  and `initialize_player_state` writes `wearableGlobals` again (`game.rb:4324`).

## Findings

### m1. In-flight games are not upgraded, and the reconcile path cannot run

`app/models/break_escape/wearables.rb:190-201` (`worn_global_names` fallback), `:283-304`
(`reconcile_worn_globals!`), `:307-316` (`clear_stray_worn_globals!`); build log, "Server" bullets 5
and 6.

`scenario_data` is a per-game snapshot: `generate_scenario_data` returns at once when it is present
(`game.rb:4174`), and nothing in `app` or `lib` clears or regenerates it. A lab game started on `main`
therefore keeps the old lab JSON, with no `wearable` on the vest. On its first sync after deploy
`worn_globals` of that snapshot is `[]`, so `wearableGlobals` is stored as `[]`, nothing becomes
read-only and `reconcile_worn_globals!` returns at once (`stuck` is always empty because `names` is
empty). Every game created on this branch gets `wearableGlobals` at creation, so the fallback branch
never sees a scenario with wearables either. Round 1's m2 assumed an old game would read the new lab;
it does not.

Failure scenario: none in the code (the old game keeps working the old way: its `set_costume` and
`set_global courier_ready` actions still run, and `pp_disguise` and `courier_ready` stay
client-writable for it). The cost is twofold. The build log tells the reader that an older game "puts
a worn global left true ... in step once", which describes a state that cannot happen, and hides what
does happen: until a player restarts, an in-flight lab game has no `unseenOnly`, no tray frame and a
client-writable `courier_ready`. The three tests at `wearable_test.rb:232`, `:255` and `:271` build
that impossible state by deleting `wearableGlobals` from a game whose scenario has wearables.

Suggested fix: correct the build log ("a game made before this build keeps its own scenario snapshot
and the old costume behaviour until it is restarted; the reconcile path guards only a game whose
`wearableGlobals` is missing while its scenario has wearables, which no current path produces"). Then
either keep the reconcile code as a cheap guard, saying so in its comment, or drop it with its three
tests to cut about 40 lines. `clear_stray_worn_globals!` can stay either way: it is harmless and
covers a hand-edited game.

### m2. Validator misses the `set_variable` ink tag

`scripts/validate_wearable.rb:577`. The chat runners act on `# set_variable:name=value` as well as
`# set_global:name:value` (`public/break_escape/js/minigames/helpers/chat-helpers.js:647-686`: it
writes `gameState.globalVariables[name]` and broadcasts the change). The tag is in real use
(`scenarios/m01_first_contact/ink/m01_npc_kevin.ink:36`, `:262`).

Failure scenario: an author writes `# set_variable:courier_ready=true` in a lab NPC's ink. The
validator passes it. In play the client sets `courier_ready` true, opens the records door gate and
skips the shoulder-surf, while the server refuses the sync and still holds false with no worn record
and no costume on the avatar. After a reload the gate closes again with no explanation.

Suggested fix: add `line =~ /#\s*set_variable\s*:\s*#{quoted}\s*(?:=|$)/` beside the two patterns,
and a line in `test/js/validator-wearable.test.mjs`'s ink fixture.

### m3. No test that `pp_disguise` stays writable without wearables

`app/models/break_escape/wearables.rb:41-44` (`wearable_read_only_globals`: `names.empty? ? [] : ...`).

Failure scenario: a later change simplifies this to always append `pp_disguise` (or adds it to the
read-only list in `merge_global_variables!`). Every Rails test stays green: the only `pp_disguise`
test (`wearable_test.rb:285`) uses a scenario with wearables, and `test/js/costume-actions.test.mjs`
runs in the client with no server. In `test_npc_needs` (and any scenario that uses `set_costume`) the
costume is then dropped on every sync and lost on reload.

Suggested fix: one integration test with a scenario that has `disguises` and no wearable: a sync of
`pp_disguise: 'courier'` is stored, and `wearableGlobals` is `[]`.

### n1. Two read-only edge cases untested

`app/models/break_escape/game.rb:289-303`; `game.rb:93-111`.

- A sync of `globalVariables: { vest_on: null }` must not delete the worn global. It is safe today only
  because the read-only check comes before the `value.nil?` branch; a reorder passes every test.
- A reset while worn should leave no `worn` record and `wearableGlobals` restored. Safe today through
  the preserved-keys slice; untested.

Suggested fix: add both to `wearable_test.rb` (two short tests).

### n2. `wear` / `take_off` targets checked only under listed action keys

`scripts/validate_wearable.rb:709-710` (`WEARABLE_ACTION_LIST_KEYS`). Action lists also live under
keys outside that list (for example `flagRewards`, used by 11 scenarios). A `wear` with a mistyped
`itemId` under such a key is not reported, and in a scenario with no wearable items
`actions_named?` returns false, so neither the target check nor the writer scan runs. The client
would just find nothing to wear. Low impact today (no scenario does this).

Suggested fix: walk every array of hashes whose `type` is `wear` or `take_off`, whatever the key, the
way `global_writers` walks the whole tree.

## The lab

The vest is a declared grant from the hook's `give_item`; the grant copy keeps `wearable` (tested
through the real rendered lab at `wearable_test.rb:369`). No `set_costume`, `clear_costume` or
`courier_ready` writer remains in the JSON (validator clean; Rails test at `:390`); the lab's ink is
unchanged on this branch. `seenBy.ignore` names `ruth` and `ruth_debrief`, both room NPCs. The
locker's hint reads `!courier_ready` before its `take_off`, as intended. Nothing on the server reads
`courier_ready` (as round 1 recorded).

## Verdict

Approve the server and lab half. Every round 1 server finding is fixed or recorded as the
orchestrator decided, and the fixes are tested in ways that would fail if the fix were removed (the
drop, plant, read-only `pp_disguise`, lab grant path and authorisation tests all check the end state
on the server). No request a tampered client can send puts a costume on without the server's own held
copy, writes a worn global or `pp_disguise` in a wearables scenario, or keeps the costume after the
item leaves the inventory. Before merge, correct the build log about in-flight games (m1); m2 and m3
are small and can go in the same commit; the nits can wait.
