# Carrying choices between missions: plan

Status: **proposal, not built** (user, 2026-10-17, `docs/agents/RESOLVED_DECISIONS.md`: "plan it and propose it, but don't build it yet"). Backlog: "Carry choices between missions" (`docs/IDEAS_BACKLOG.md:44`), with the follow-ons at `:90` (m03's Sterling and Danny threads) and `:162` (sis02 → sis03). m07 `DECISIONS_PENDING.md` U2.

The user's idea, verbatim: "should we just feed in previous completed mission states as read only global variables? for example: m01-scenario-path-variable-1 which is assigned the state from the most recent completed matching mission? Some simple way of defining in the scenario.json what variables to feed in from previous missions?"

Short answer: yes. It fits the engine well. Globals already reach ink, conditions and credits from one place (`scenario.globalVariables`), so an imported value only has to be put there when the game is created. The real work is in three places: deciding which run counts as "the most recent completed" one (a Restart wipes a completed game's globals, see 1.4), keeping the values read-only (client code writes globals from about 30 files, and the server from two places), and letting the validator check a declaration against another mission's file.

Line numbers are from the working tree on 2026-10-17, after commit a73b1175 (player HP sync), which moved everything in `game.rb` below about line 2030 by 17 lines. Methods are named alongside each line number so the citations survive further edits; re-check them before building. `app/models/break_escape/mission.rb` and m06's `scenario.json.erb` have uncommitted changes, so m06 line numbers may drift.

---

## 1. How state is stored today

### 1.1 Missions, games and players

- **Mission** (`break_escape_missions`): one row per scenario folder. `name` is the folder name and is unique (`test/dummy/db/schema.rb:77`). `Mission#generate_scenario_data` renders `scenarios/<name>/scenario.json.erb` through ERB with a `ScenarioBinding` that knows only random values and the VM context (`app/models/break_escape/mission.rb:123-134`, `:228-236`). `mission.json` is separate metadata (`mission.rb:42-58`). `consequences_persist` sits there (`scenarios/m07_architects_gambit/mission.json:55`), but nothing in the engine reads it (a grep for it in `app/`, `lib/` and `public/` finds nothing).
- **Player** is polymorphic (`game.rb:6`). Mounted in Hacktivity it is the `User` (`application_controller.rb:9-17`). Standalone, every visitor is the same `DemoUser` with handle `demo_player` (`application_controller.rb:12`). That matters for playtests (section 5.4).
- **Game** (`break_escape_games`, `db/migrate/20251120155358_create_break_escape_games.rb`): one row per play session. It holds:
  - `scenario_data`: the rendered scenario, fixed when the row is created (`game.rb:25`; `generate_scenario_data` `:2340`);
  - `player_state`: everything that changes (rooms, inventory, `globalVariables`, objectives and so on; defaults in `initialize_player_state`, `game.rb:2394`);
  - `status`: one of `in_progress`, `completed` or `abandoned` (`game.rb:17`);
  - `started_at`, `completed_at` and `mission_concluded_at` (the last added in `db/migrate/20260525000001_…`).
- A player can have **any number of games per mission**. The unique indexes were removed (`20251128000001_remove_unique_game_constraint.rb`, `20260517100000_remove_single_active_game_constraint.rb`). Only the non-unique `index_games_on_player_and_mission_non_unique` is left (`schema.rb:57`).
- Games are created by `GamesController#create` for VM missions (`games_controller.rb:96-170`) and by `MissionsController#show` for non-VM missions, which uses `find_or_create_by!` (`missions_controller.rb:36-39`). New Session creates another row (`games_controller.rb:231-257`). Hacktivity also creates games itself, building the Game with `game_slot:` set before saving (Hacktivity `game_slots_controller.rb:420`, `:428`). `find_or_create_by!` hands back any existing game, abandoned or completed included, so for non-VM missions only a New Session creates a new row. Every one of these goes through the model's `before_create` callbacks, so the proposal hooks there.
- Hacktivity adds a `game_slot` (an event listing) to a game (`game.rb:10-12`; Hacktivity `app/models/game_slot.rb`). The engine has two host hooks, `on_game_complete` and `can_continue_in_slot` (`lib/break_escape.rb:19-28`).

### 1.2 How globals are saved

1. **Defaults.** The scenario's `globalVariables` block is part of `scenario_data`. The bootstrap payload sends it to the client unchanged; `filtered_scenario_for_bootstrap` strips rooms, flags and target flags but not globals (`game.rb:735-776`).
2. **Client start.** `core/game.js` copies `gameScenario.globalVariables` into `window.gameState.globalVariables` (`public/break_escape/js/core/game.js:1358-1363`). It records those names as the **declared globals**, the only names that sync into ink (`:1369`; `npc-conversation-state.js:322-353`). Then it merges `savedGlobalVariables` over the defaults (`game.js:1374-1377`).
3. **Saved globals.** The `scenario` endpoint adds `savedGlobalVariables` from `player_state['globalVariables']` (`games_controller.rb:288-293`).
4. **Ink.** A declared global is pushed into every story that declares a `VAR` of that name (`npc-conversation-state.js:379-398`). Changes made by ink come back through `variableChangedEvent` (`:461-497`) and are broadcast to the other loaded stories.
5. **Sync.** `state-sync.js` sends the whole object on the first sync and afterwards only the keys changed since the last confirmed save, with `null` for a removed key (`public/break_escape/js/state-sync.js:11-25`, `:77`). The server merges them with `Game#merge_global_variables!`, where a `null` deletes the key (`games_controller.rb:1410-1411`, `game.rb:232-242`). The last write wins. `sync_state` loads only `id player_type player_id player_state updated_at` (`SYNC_STATE_COLUMNS`, `games_controller.rb:1369`, used at `:695`), so **`scenario_data` is not available during a sync**. A sync that is answered `stale` skips the globals merge, although the grow-only sections still merge (`:698-703`). The legacy `Api::GamesController#sync_state` (`api/games_controller.rb:16-17`) merges globals as well.
6. **Server reads and writes.** The server reads globals for `unlockCondition.globalVariable` (`game.rb:1513`) and for `concludeRequires.globals` (`unmet_conclude_requirements`, about `game.rb:2620`). It also writes them itself: `apply_task_set_globals!` (`game.rb:2188-2207`) sets a task's `onComplete.setGlobal` values for any name in `scenario_data['globalVariables']`.

Places that write globals on the client. These are the main ones; in all, about 30 files write to `gameState.globalVariables` (inventory, unlocks, interactions, hostility, the NPC bridge and manager, and about 20 minigames):
- ink `~ x = …`, through the observer;
- the `#set_global:x:v` tag (`minigames/helpers/chat-helpers.js:451`);
- the `#set_variable:x=v` tag (`chat-helpers.js:541`; m06 uses this form for its fund choice, e.g. `m06_satoshi_confrontation.ink:369`, `:412`);
- `applyActions` `set_global` (`systems/apply-actions.js:33`);
- task `onComplete.setGlobal` (`systems/objectives-manager.js:754`);
- `npcManager.setGlobalVariable`, used by several minigames;
- minigames that write `window.gameScenario.globalVariables[...]` directly (e.g. `minigames/shredded-document/shredded-document-minigame.js:27`).

### 1.3 What "completed" means

There is a completion flag, and it is set when the credits are reached:

- `Game#mission_completed?` is `status == 'completed' || mission_concluded_at.present?` (`game.rb:43-45`).
- **The usual path is the credits.** The `music` entry whose `credits` list rolls the ending (for m06 it is `conversation_closed:closing_debrief_person`, `scenarios/m06_follow_the_money/scenario.json.erb:170-180` in the working tree) calls `concludeMission()` (`public/break_escape/js/music/scenario-music-events.js:127-160`). That function first runs `stateSync.sync()`, so the debrief's last globals are saved, and then POSTs `/games/:id/conclude` (`:177-185`). `Game#conclude_mission!` checks `concludeRequires` and then sets `mission_concluded_at`, `status = 'completed'`, `completed_at` and `score` (`game.rb:2578-2597`). The controller returns these as `success`, `alreadyConcluded` and `missing` (`games_controller.rb:1137-1149`).
- **Second path:** when the last task of the `missionConclusion` aim completes, `check_mission_conclusion` sets the same fields (`game.rb:2048-2064`). That can happen **before** the debrief has been played.
- **Once concluded, always concluded.** Both paths return early when `mission_concluded_at` is already set (`check_mission_conclusion` `game.rb:2050`; `conclude_mission!` `:2582-2584`), and Restart does not clear it (1.4). A replay after a Restart therefore never "concludes" again. The credits still roll, because the endpoint answers `success: true, alreadyConcluded: true`.
- **Third path, Hacktivity's Finish button** (`Hacktivity/app/controllers/game_slots_controller.rb:243-251`, "Player-initiated game completion"). It sets `status: 'completed'` and nothing else, on a game that was never concluded (`active_game_for` requires `mission_concluded_at: nil`, `Hacktivity/app/models/game_slot.rb:57-62`). The player is giving up, and the story wasn't finished. `mission_completed?` is true for such a game, so carry-over must not use `mission_completed?` as its test (2.3).
- All of m01–m08 have a `missionConclusion` aim with `concludeRequires` (e.g. m06 `scenario.json.erb:518-530`).

### 1.4 Restart and New Session

- **Restart** (`POST /games/:id/reset`, `games_controller.rb:211-220`) calls `Game#reset_player_state!` (`game.rb:77-88`):
  - `player_state` is rebuilt from scratch (including `objectivesState` and `submitted_flags`), keeping only `vm_set_id`, `vm_ips`, `flags_by_vm`, `standalone_flags` and the avatar-unlock key;
  - `scenario_data` is **not** regenerated;
  - `status`, `completed_at` and `mission_concluded_at` are **not** cleared.
  
  A completed m06 game that the player restarts is therefore still `completed`, but its globals are back to the defaults. If carry-over read "the latest completed game's globals" live, a single Restart of m06 would silently turn m07's imports into defaults or a half-finished replay.
- Hacktivity has its own Restart (`game_slots_controller.rb:135-166`). It acts only on an in-progress, unconcluded game and refuses completed ones ("Completed missions cannot be restarted"). A completed game can be restarted only through the engine's `POST /games/:id/reset`.
- **New Session** (`games_controller.rb:231-257`) marks the old game `abandoned` only if it is `in_progress`; a completed game stays completed. It then creates a new Game with only the VM keys copied over, so a new `scenario_data` is rendered.

---

## 2. The proposal

### 2.1 Declarations in scenario.json

Two new top-level keys in `scenario.json.erb`.

**In the source mission: `exportGlobals`**, the globals another mission may read.

```json
"exportGlobals": ["assets_seized", "monitoring_enabled", "asset_decision_deferred",
                  "irina_recruited", "irina_arrested", "architect_identity_found"]
```

**In the reading mission: `importGlobals`.**

```json
"importGlobals": [
  { "from": "m06_follow_the_money", "var": "assets_seized",      "as": "m06_assets_seized",      "default": false },
  { "from": "m06_follow_the_money", "var": "monitoring_enabled", "as": "m06_monitoring_enabled", "default": false },
  { "from": "m06_follow_the_money", "completed": "m06_completed" }
]
```

- `from` is the source mission's `name`, which is its folder and is unique (`schema.rb:77`).
- `var` is a key in the source's `globalVariables` that the source also lists in `exportGlobals`.
- `as` is the name used in this mission. It may be left out when `from` starts with `mNN_` or `sisNN_`; it then defaults to that prefix plus `_<var>` (`m06_assets_seized`). For any other source it is required, because a derived prefix would be wrong: `test-tesseract-probes` would give a hyphen, and ten `lab_*` folders would share `lab`.
- `default` is the value used when nothing is found. It is required, and its type must match the source's default (2.8).
- The `completed` form (`{ "from": …, "completed": "<name>" }`, with no `var`, `as` or `default`) imports no variable. It sets the global named by `completed` to `true` when a concluded run of `from` exists and `false` otherwise, so ink can tell "never played" apart from "played, and chose the default". Without it, `m06_assets_seized == false` means either "watched" or "never played m06".

There is deliberately no expression language and no derived values. If a later mission wants one summary value ("frozen", "watched" or "undecided"), the source mission sets a global that holds it, or the reading ink works it out from two booleans.

### 2.2 Naming

The user's example, `m01-scenario-path-variable-1`, won't work as written. Hyphens can't appear in ink identifiers (`m01-x` parses as `m01 minus x`). They also break the JS conditions the engine evaluates, such as `globalVars.m06-x` in credits and in `chatBackground` conditions. The proposal keeps the idea and spells it with underscores:

- **`<mission prefix>_<source var>`**, for example `m06_assets_seized`, `m05_final_choice` and `m01_final_choice`. The prefix is required, because the same names recur across missions: `final_choice` exists in both m01 and m05, `player_approach` in m03 and m05, and `torres_turned`-style fates sit beside generic `mission_complete` and `debrief_played` in every mission. The name starts with a letter, so it is a valid identifier in ink, in JS and in the validator's own regexes.
- No current m01–m08 global starts with `m0N_` (checked against the rendered `globalVariables` of all eight), so the prefix can't collide today. The validator enforces it from then on (2.8).
- Imported names must not start with `global_`. That prefix has its own auto-discovery rule (`npc-conversation-state.js:345`, `:356-372`) and would confuse the two mechanisms.

### 2.3 Which run counts: "the most recent completed matching mission"

For this player, among their games of mission `from`, excluding the current game, take the most recent **story snapshot** (2.4). Concretely:

```ruby
source = Mission.find_by(name: entry['from'])
Game.where(player: player, mission: source)
    .where.not(mission_concluded_at: nil)
    .pluck(:id, :mission_concluded_at,
           Arel.sql("player_state -> 'storySnapshot'"),
           Arel.sql("player_state -> 'globalVariables'"),       # fallback for rows with no snapshot (2.4)
           Arel.sql("player_state -> 'importedGlobalNames'"))   # never loads player_state or scenario_data whole
# then: take the row with the latest snapshot timestamp (fallback: mission_concluded_at)
```

The query follows the shape of `AvatarUnlocks.completed_games` (`app/models/break_escape/avatar_unlocks.rb:141-147`), the existing example of per-player state read across games, with a jsonb key plucked in SQL. It deliberately uses a narrower test (next bullet). A snapshot is only ever written on a concluded game, and nothing clears `mission_concluded_at`, so that column alone selects every row with a snapshot. A mission may not import from itself (the validator rejects it), so the current game, which has no id yet during `before_create`, never needs excluding.

- "Completed" means **the story reached its conclusion**: `mission_concluded_at` is set, or the row has a snapshot. This is narrower than `mission_completed?` (`game.rb:43-45`), and on purpose. A status-only `completed` row is a Hacktivity Finish (1.3), a give-up, and must not override a run that was really finished. The cost is that games completed before the `mission_concluded_at` column existed (`20260525000001_…`, no backfill) never count. Those games are from before May 2026, and their players get the neutral lines. An abandoned or in-progress run never counts.
- "Most recent" goes by the snapshot's own timestamp, not `completed_at`. A Restart replay that reaches the credits refreshes the snapshot (2.4) but never changes `completed_at` (1.3).
- The rows per player and mission are few, and the index on `[player_type, player_id, mission_id]` covers the query (`schema.rb:57`). Each lookup is one query per distinct `from`, not one per variable.
- Missions are matched by `name` only. A renamed mission folder breaks the link, and the validator catches that (2.8).

### 2.4 The story snapshot (when it is written)

`player_state['storySnapshot'] = { 'at' => <iso8601>, 'globals' => { …all globals… } }` is written:

1. whenever the game concludes, on either path (`conclude_mission!`, `check_mission_conclusion`);
2. **and again on every later `POST /conclude` of a game that has already concluded**, as long as that game's `concludeRequires.globals` (story globals the replay must set again) are met. `tasksCompleted` is **not** re-checked. After a Restart, `objectivesState` and `submitted_flags` are wiped, so a replay would pass that check only if every flag were submitted again. Either way the credits are never refused here: a failed check only skips the refresh, so a half-finished replay can't overwrite a full run. The existing early return in `conclude_mission!` stays first. Inside it, the method refreshes the snapshot, saves, and returns `already: true` as it does now. It never re-runs the concluded branch (`completed_at`, `score`, `mission_concluded_at`).

Point 2 is what makes the credits the moment that counts. The save in point 2 changes only `player_state`, which triggers none of the three `after_commit` predicates (`game.rb:536-555`), so `on_game_complete` doesn't fire again. `record_avatar_unlocks` runs, but it only ever adds. The credits always call `/conclude` after a sync (1.3), so the snapshot holds the debrief's final choices even when the aim concluded earlier through its tasks. A Restart replay that reaches the credits again, with its `concludeRequires.globals` met, replaces the old snapshot. One that never gets there leaves it alone.

Details:
- `storySnapshot` is added to the keys `reset_player_state!` keeps (`game.rb:79`), on the pattern of the avatar-unlock key. A Restart of the source mission therefore doesn't erase the last finished run.
- The snapshot holds **all** of the game's own globals, not just the exported ones. Imported names are left out, so a value can't pass second-hand from m06 through m07 to m08; a later mission imports from the original source. The validator rejects an `exportGlobals` entry that is itself an import. A mission that declares a new export later can then read it from runs finished before the export existed. The export list is a contract checked by the validator (2.8); the server doesn't filter on it at run time. The size is about 100 small keys per mission (m02 has the most, 123).
- **Games concluded before this ships** have no snapshot. The lookup doesn't write anything to them. It treats the row's current `globalVariables`, minus its `importedGlobalNames`, as the snapshot, timestamped with `mission_concluded_at`, using the values already plucked in the same query. Writing to another game's row from inside `before_create` was rejected (round 2): an unlocked read-then-write can lose a sync from a tab still playing that game, and a failed statement aborts the whole PostgreSQL transaction, so game creation would fail.
- A concluded game that was restarted through the engine *before* this ships, and is part-way through a replay, falls back to the replay's values. The reset-time snapshot below only helps restarts made after shipping. It is a small case, and it ends in the neutral or a plausible line, never an error.
- **Restart of an old concluded game** is the one case where that fallback goes wrong, because the replay changes its globals. So `reset_player_state!` (`game.rb:77-88`), when `mission_concluded_at` is set and there is no snapshot, writes one from the current globals before wiping them. That costs one line, inside the row's own save.
- **`resolve_imported_globals` fails open.** On any error it logs and uses the defaults, and its query runs inside `transaction(requires_new: true)`, so a failed lookup can't abort the game's creation.
- **Types are checked at run time too.** A snapshot value whose JSON type differs from the import's `default` (a run from before a type change) is ignored and the default used.

### 2.5 Injecting the values (when a game is created)

A new `before_create` step, `resolve_imported_globals`, runs after `generate_scenario_data` and before `initialize_player_state` (the callback order is at `game.rb:24-28`). Like `inject_player_preferences` (`game.rb:2500`), it edits `scenario_data` once, at creation:

- `scenario_data['globalVariables'][as] = value`, where `value` is the snapshot's value or else `default`. Writing the value in as the scenario's own default means everything that already reads globals sees it with no further change: the client initialisation, the declared-globals set (`game.js:1369`), ink sync, eventMapping conditions, credits conditions, `chatBackground` and portrait conditions, and the command board.
- `scenario_data['importedGlobals'] = { as => { 'from' =>, 'var' =>, 'found' => bool, 'sourceGameId' => id|nil } }`. This is the provenance record and the read-only list. The client uses it for its guard. Testers and authors can see from it where a value came from.
- `initialize_player_state` also merges the imported values into `player_state['globalVariables']`, overriding anything there, so server-side reads of globals see them (`game.rb:1513`). It also writes the list of names to `player_state['importedGlobalNames']`, which the sync guard reads (2.6). Restart calls `initialize_player_state` again (`game.rb:82`). It takes the values from `scenario_data['globalVariables'][as]` for each name in `scenario_data['importedGlobals']`, and does not repeat the lookup, so a restarted game gets the same values and list back. (`importedGlobals` holds provenance only; the values live in `globalVariables`.)

Imports are resolved **once per Game row**. A mission's choices stay fixed for the whole of a game, through reloads and Restarts. A New Session renders a new scenario and looks the values up again, so it picks up a source run finished in the meantime.

Imports are not available to the ERB. The declarations are part of the ERB's output, so the values can't be known before it runs. Structural variation (an NPC who appears only if Irina was recruited, a different room background) uses the existing global-driven mechanisms instead: `initiallyHidden` plus an eventMapping on `game_loaded`, or `chatBackground` and credits conditions. That is enough for every first use in section 4.

### 2.6 Keeping them read-only

Ink has no read-only `VAR`, and `CONST` is compiled in, so the engine can't overwrite it. The values therefore stay ordinary `VAR`s, and read-only is enforced in three layers:

1. **The server is authoritative.** `merge_global_variables!` (`game.rb:232-242`) skips every key in `player_state['importedGlobalNames']`, deletes included. That list lives in `player_state`, not `scenario_data`, because `sync_state` doesn't load `scenario_data` (1.2), and reading it there would raise `MissingAttributeError` on every sync. Both `sync_state` actions use the guarded merge. `apply_task_set_globals!` (`game.rb:2188`) skips imported names as well. A client that changes an import can't make the change persist, and the next load restores the value.
2. **The validator** (the main guard, because it catches the mistake before anyone plays). It is an **error** for an imported name to be:
   - assigned in any of the mission's ink (`~ name =`, `#set_global:name:`, `#set_variable:name=`);
   - the target of `setVariable` (`onRead`, `onPickup`, `onInteract`), `onComplete.setGlobal`, `globalVarOnKO` or an `applyActions` `set_global`;
   - used in `concludeRequires.globals` or an `unlockCondition.globalVariable`. A mission must be finishable with every import at its default (2.7).

   It is a **warning** for an imported name to appear in an eventMapping condition whose actions give an item, open a door or reveal an NPC. Those can be legitimate (an extra helper for a player who recruited Irina) but need a design review to confirm the mission is still solvable without them.
3. **The client** adds a light guard, there to catch mistakes rather than to enforce anything. Within one session, any of the ~30 unguarded write paths can still change an import until the next reload. The server never stores the change, and the validator should have caught it first. `npcConversationStateManager` gets `setReadOnlyGlobals(names)`, alongside `setDeclaredGlobals` (`game.js:1369`). The ink observer (`npc-conversation-state.js:466`) and the `set_global` and `set_variable` tag handlers (`chat-helpers.js:451`, `:541`) refuse a write to a read-only name and log a warning. The observer also puts the story's value back. inkjs may already have used the written value for the rest of that passage, so the revert is clean-up, not protection. `syncGlobalVariablesFromStory` (`npc-conversation-state.js:404-449`, which pushes back the names a story touched, or every name when the observer didn't attach) gets the same check, for one line. The other paths (`apply-actions.js:33`, `objectives-manager.js:754`, the minigames) are left to the validator and the server, because touching each minigame isn't worth the risk.

### 2.7 When the source mission was never played

- The value is the declared `default`, and `importedGlobals[as].found` is `false`. The `completed` form sets `false`.
- **The authoring rule:** the default branch of every carry-over line is today's fate-neutral line, kept word for word. A player who hasn't played the earlier mission, an old save, or a game created before this ships sees exactly what they see now, and that line's cached audio is still used. The carry-over lines are added as the *other* branches.
- **Default values follow the existing conventions:** `false` for booleans, `""` for string enums (m01 and m05 `final_choice`, m03 `victoria_fate` and `danny_fate`, m07 `team_assignment`), and `0` for counts. The validator warns when a reading ink compares an imported string against a value the source mission never assigns (it collects the source's `~ x = "…"` and `#set_global:x:` values).

### 2.8 How the validator checks the declarations

The checks go in `scripts/validate_scenario.rb`, run from `check_recurring_bugs` or as a new `check_carry_over`:

- `importGlobals` and `exportGlobals` are added to the known top-level fields (`validate_scenario.rb:249`).
- **Source side, for each import:**
  - `from` names an existing `scenarios/<from>/scenario.json.erb`. The validator renders it with the same stub binding it already uses, which costs one extra render per distinct source.
  - `var` is in the source's `globalVariables`. **It is an error** if the source doesn't list `var` in `exportGlobals`.
  - The **types match**: `default` has the same JSON type as the source's own default (boolean, integer or string).
  - A source global that is exported but never written anywhere in the source mission is a warning, because it is always its default.
- **Reading side:**
  - `as` matches `/\A[a-z][a-z0-9]*_[a-z0-9_]+\z/`, doesn't start with `global_`, and doesn't collide with this mission's own `globalVariables` or with another import. `from` is not this mission.
  - The read-only and solvability rules in 2.6 are checked.
- **The existing checks see the imports.** Before the other checks run, the validator puts every import's `as => default` into its in-memory `json_data['globalVariables']`. The many existing checks that test "is this global declared?" then accept imported names with no change (for example `:1756`, `:2548`, `:3433`, `:3511`, `:3633`). `check_globals_never_read` (`:3735`) counts a source global listed in `exportGlobals` as read, so exports don't raise "dead global" warnings.
- **Inks** that read an import must declare `VAR m06_assets_seized = false`, the same as any synced global. A missing `VAR` is an inklecate compile error, so no new check is needed for that. Once the imported names are merged in, `check_ink_global_collisions` (`:3892`) catches a `VAR` whose type disagrees with the default (`VAR m06_x = ""` against `false`) and flags an unacknowledged assignment.

### 2.9 Which variables each mission exports

Each mission exports only its **story decisions and outcomes**: the fates, the stances and the "did they find the big thing" facts. Progress flags, guide-offer flags and flag-submission flags stay out. The validator rule that the source must list a variable in `exportGlobals` is the reason to keep the list short. It tells a writer editing m06 which names another mission depends on, so a rename can't break m07 without the validator saying so. (Section 3 explains why this is recommended over "any global can be imported".)

This is the starting list, taken from each mission's rendered `globalVariables` and the values its ink compares against:

| Mission | Export | Values |
|---|---|---|
| m01 | `final_choice`, `kevin_choice`, `derek_showed_remorse`, `found_casualty_projections`, `player_aborted_attack` | `final_choice`: arrest / expose / fight / recruit / surrender (`m01_closing_debrief.ink:596-608`); `kevin_choice`: evidence / ignore / warn / wrongly_accused |
| m02 | `paid_ransom`, `exposed_hospital`, `ghost_deal_accepted`, `patient_bed4_deceased`, `insider_asset_arrested`, `insider_asset_escaped`, `backup_recovery_source` | booleans; `backup_recovery_source` is a string |
| m03 | `victoria_fate`, `danny_fate`, `directive_decoded`, `guard_bribed` | `victoria_fate`: recruited / arrested / ko / escaped; `danny_fate`: protected / exposed / left / ko (`m03_closing_debrief.ink:131-362`) |
| m04 | `voltage_captured`, `voltage_escaped`, `casualties_occurred`, `disclosure_choice`, `crew_lost` | `disclosure_choice`: full / quiet / partial (`m04_closing_debrief.ink:560-566`) |
| m05 | `final_choice`, `torres_turned`, `torres_arrested`, `elena_treatment_funded`, `entropy_program_exposed`, `recruiter_deal_accepted` | `final_choice`: turn_double_agent / arrest / combat_nonlethal / combat_lethal / public_exposure (`m05_closing_debrief.ink:48`) |
| m06 | `assets_seized`, `monitoring_enabled`, `asset_decision_deferred`, `irina_recruited`, `irina_arrested`, `architect_identity_found` | booleans |
| m07 | `team_assignment`, `team_redirected`, `grid_saved`, `mercer_fate`, `elena_outcome`, `architect_echo_heard` | `team_assignment`: fracture / trojan_horse / meltdown / "" (`m07_closing_debrief.ink:150-164`); `mercer_fate`: arrested / escaped / ko; `elena_outcome`: turned / fled / ko / "" |
| m08 | `nightshade_arrested`, `nightshade_triple_agent`, `debrief_stance` | for sequels |

Only **scenario globals** can be exported. NPC-local ink variables are stored separately (`npcInkVariables`) and are not part of the snapshot. For example, m07's `teacher_discussed` is a local `VAR` in `m07_phone_agent_0x99.ink`, so the backlog's "HaX remembers the Tesseract conversation" needs it promoted to a scenario global first.

m01's audio is cached and m01 is otherwise left alone (AGENTS.md, standing rules). Adding `exportGlobals` to m01's `scenario.json.erb` is a JSON-only change with no effect on its ink or audio, but it does touch m01, so it is listed for the user (section 6, Q5).

### 2.10 Hacktivity events

- **The lookup works across events.** "This player" is the Hacktivity `User`. Their m06 run in a course or in an earlier event counts towards their m07 run in a new event, because the story belongs to the player.
- **A player in an event who hasn't played the earlier missions** gets the defaults, which are today's fate-neutral lines (2.7). Nothing is gated on an import (2.6), so scoring and completability are the same for everyone. Task scoring counts tasks and aims (`game.rb:48-56`), and imports can't add, remove or gate either.
- **A host switch.** A new configuration callable, `BreakEscape.configuration.carry_over_allowed`, of the form `->(player, game) { bool }`, sits next to `can_continue_in_slot` (`lib/break_escape.rb:19-28`). When it returns false, every import takes its default and `found` is `false`. Hacktivity could use it for an event that wants every player to start from the same story, by checking `game.game_slot`. The default is on. The hook is small, but nobody has asked for it yet, so it can wait until Hacktivity needs it (Q3).

### 2.11 How ink sees the values

Exactly like any other scenario global. The ink file declares the `VAR`, and the engine pushes the value in when the story loads (`npc-conversation-state.js:379-398`). For example:

```ink
VAR m06_completed = false          // Imported (read-only): a finished m06 run exists
VAR m06_assets_seized = false      // Imported (read-only) from m06 assets_seized
VAR m06_monitoring_enabled = false // Imported (read-only) from m06 monitoring_enabled

{
- m06_assets_seized:
    Director Magnus Netherton: <frozen line>
- m06_monitoring_enabled:
    Director Magnus Netherton: <watched line>
- else:
    Director Magnus Netherton: Frozen or watched, the advances had already been paid. Tonight is what they paid for.
}
```

Credits and other JSON conditions read `globalVars.m06_assets_seized`. Voiced lines must still not print the variable (AGENTS.md: "No printed variables in voiced lines"). Choosing between fixed strings is fine, but every new branch is a new clip to generate.

### 2.12 Restart, New Session and reloads

| Action | Imports in this game | Snapshot of this game (as a source) |
|---|---|---|
| Reload | unchanged (from `scenario_data`) | unchanged |
| Restart (`reset`) | unchanged: `scenario_data` is kept, and `initialize_player_state` re-merges the values (2.5) | kept (`storySnapshot` added to the keys Restart keeps); replaced if the replay reaches the credits with its `concludeRequires.globals` met |
| New Session | looked up again, so it can pick up a newer source run | a new row; the old row keeps its snapshot if it was concluded (New Session abandons only `in_progress` games, `games_controller.rb:239`) |
| Playing m06 again after m07 has started | the m07 game in progress keeps its values; the next m07 New Session sees the new run | the new m06 run's snapshot becomes the latest once its credits roll |

---

## 3. Alternatives, and the recommendation

| | A. Read the latest Game row's live globals | **B. Story snapshot on the Game row (proposed)** | C. A per-player story-state table |
|---|---|---|---|
| What it is | At game creation, read `player_state['globalVariables']` from the player's latest concluded game of `from` | Write `player_state['storySnapshot']` whenever the credits roll (2.4); read the latest | A new `break_escape_story_states` table, one row per (player, mission name), upserted at the credits |
| Schema change | none | none | a migration, which Hacktivity also has to copy in (it holds copies of every engine migration, e.g. `Hacktivity/db/migrate/20260330223326_create_break_escape_games.break_escape.rb`) |
| Restart of the source | **wrong**: a completed game that is restarted keeps `completed` but its globals are reset (1.4) | right: the snapshot survives a Restart and is refreshed only by reaching the credits again | right |
| Wandering after the credits | changes leak in | ignored | ignored |
| History of runs | yes | yes, one snapshot per run | only the latest, unless versioned |
| Lookup | one query; loads `player_state` | one query plucking three jsonb keys; picks the latest in Ruby | one indexed row |
| Lost when a game is deleted | yes | yes | no |

**Recommendation: B.** It fixes A's two real failures, the Restart and a Hacktivity Finish counting as a finished story, with a single preserved key and no migration. The lookup is no slower in practice, because a player has only a handful of rows per mission. C is the better shape if the story state ever grows beyond globals (an inventory carried between missions, a cross-campaign codex) or must survive games being deleted. Moving from B to C later is a backfill from the snapshots, so nothing is lost by starting with B.

**Exporting only declared variables, or letting any global be imported.**
- *Any global:* less to write, but a rename in the source silently breaks the reader, and an author can't see which of their globals other missions depend on.
- *Declared exports (proposed):* one extra list per source mission, and the validator can check both ends.
- *Snapshot only the exported variables:* smaller, but a new export would then have no data for runs already finished.

The proposal snapshots everything and validates against `exportGlobals`, which gets both benefits.

**A `consequences_persist` switch in mission.json.** It is set to `true` on m07 and sis01 and to `false` on sis02 and sis03 (`sis02_energy/mission.json:219`, `sis03_cyber_insurance/mission.json:223`), and nothing reads it. The sis pair says false, the very pair the backlog most wants connected. It could gate imports, but the declarations already say what carries, so a second switch only adds a way for the two to disagree. Proposal: leave it as documentation and say so in `README_scenario_design.md`. Q4 asks the user.

---

## 4. First uses

Each one keeps today's line as the `else` branch (2.7). The new branches below are sketches to show the shape. The dialogue writer writes the real lines, and each new branch is a new voiced clip.

**m01 → m02.** `m02_opening_briefing.ink:66`: "Derek Lawson's cell, Social Fabric. That material gave us our first real map…". Import `m01_final_choice`. Branches: `recruit` ("Derek's been talking to us since…"), `fight` or `expose` (he isn't talking), and else the current line. Possible second use: `m02_closing_debrief.ink:205` ("Derek Lawson kept casualty projections…") branches on `m01_found_casualty_projections` ("You found that spreadsheet") and keeps the current line otherwise. Needs m01 `exportGlobals` (Q5).

**m02 → m03.** `m03_opening_briefing.ink:94`: "A ward of patients on life support, encrypted in the night. How many died came down to a recovery call." Import `m02_patient_bed4_deceased` and `m02_completed`:
- `m02_completed and m02_patient_bed4_deceased`: the call cost a life, and the player made it;
- `m02_completed and not m02_patient_bed4_deceased`: everyone on that ward lived;
- else: the current line.

The player's choice line in Danny's scene, `m03_danny_choice.ink:34` ("People died."), could pick up the same import.

**m03 → m04.** There is no Sterling or Danny line in m04 today (a grep of m04's ink for Sterling, Victoria and Danny finds nothing). The backlog asks for one (`IDEAS_BACKLOG.md:90`). Proposed: one new HaX line in m04's debrief near the m03 directive quote (`m04_closing_debrief.ink:191-194`) when `m03_victoria_fate == "recruited"` (her tip mattered tonight), and one on `m03_danny_fate`. These are new lines with no neutral line to replace, so the default branch is simply silence.

**m04 → m05.** `m05_insider_trading_opening.ink:33`: "Task Force Null is three people and a whiteboard so far." Import `m04_voltage_captured` and `m04_voltage_escaped`, and add a branch for each ("…and Voltage, who has given us one number" or "…and Voltage is still out there"). Else: the current line alone. This also settles the backlog item at `IDEAS_BACKLOG.md:102`, which asks for an m04 thread in m05's briefing.

**m05 → m06.** `m06_opening_briefing.ink:43`: "Out: $847,000 to the Insider Threat Initiative for the Quantum Dynamics job, through TalentStack's wallet." Import `m05_final_choice`. On `turn_double_agent`, a follow-on line says Torres is still feeding them, now on SAFETYNET's script, and that that is how the wallet was traced. On `public_exposure`, the line says the exposure made the payment traceable. Else: nothing added.

**m06 → m07 (the fate-neutral line written for this).** `m07_opening_briefing.ink:26-28`, whose comment reads "fate-neutral nod to m06's freeze-or-watch choice (no cross-mission state; DECISIONS_PENDING U2)": "Frozen or watched, the advances had already been paid. Tonight is what they paid for." Import `m06_assets_seized` and `m06_monitoring_enabled`; the ink sketch is in 2.11. A second use: HaX's `topic_teacher` (`m07_phone_agent_0x99.ink:769-785`) was written to "work with or without m06". Importing `m06_architect_identity_found` lets her say "you read Satoshi's page" to a player who did.

**m07 → m08 (U2).**
- `m08_opening_briefing.ink:19`: "Portland happened. Four sites in one night, one team to send…". Import `m07_team_assignment` and `m07_team_redirected`. m07's debrief has a separate branch for each case (`m07_closing_debrief.ink:150-219`). When Trojan Horse was not covered, the backdoor wakes on day nine (`:389-392`), which is the day m08 takes place (Nightshade: "the last nine days", `m08_suspect_nightshade.ink:43`). ATHENA can then add that dispatch in eleven counties started dropping calls this morning.
- If the team was sent straight to Trojan Horse (`team_assignment == "trojan_horse" and not team_redirected`), she says no backdoor went anywhere.
- The redirected case says the clean-up is in its ninth day.
- Else: the current line.

`m08_closing_debrief.ink:212` ("Portland, Austin, all of it was theatre") can stay as it is.

**sis02 → sis03.** Not part of the spy campaign, but it is the most detailed request so far (`IDEAS_BACKLOG.md:162`, which names the sis02 globals). It would also be the first test of a non-`m` prefix (`sis02_bms_registers_saved`). This is **not** covered by v1. The variations that entry asks for (Exhibit B's evidence gap, the claim figure, the notification timeline) are in documents and objects, not ink. ERB can't see the imports (2.5), and the engine has no general way to choose readable text from a global. sis03 needs either conditional readable text (a new engine feature) or rewritten documents with the variation moved into dialogue. It is listed so the decision isn't lost, and would need its own plan.

**Not proposed here:** imports that change rooms, NPCs present or kit. They are possible (2.5) but need puzzle and design review, not just dialogue.

---

## 5. Build steps, tests, risks and effort

### 5.1 Build order

1. **Server: snapshot** (S).
   - `Game#write_story_snapshot!` (own globals minus imported names, plus a timestamp) is called from the concluded branches of `conclude_mission!` and `check_mission_conclusion`.
   - Inside the existing `if mission_concluded_at.present?` early return of `conclude_mission!`, the method calls `write_story_snapshot!` and `save!` only if `concludeRequires.globals` are met (not `tasksCompleted`), then returns `already: true` either way. There is no change to the concluded branch (2.4).
   - Add `storySnapshot` to the keys `reset_player_state!` keeps (`game.rb:79`).
   - Old rows: the lookup falls back to their globals in memory, and `reset_player_state!` snapshots an old concluded game before wiping it (2.4). There is no rake task and no write to other rows.
2. **Server: imports** (S–M).
   - `before_create :resolve_imported_globals`, between `generate_scenario_data` and `initialize_player_state`.
   - `initialize_player_state` merges the imported values in and writes `player_state['importedGlobalNames']`.
   - `merge_global_variables!` and `apply_task_set_globals!` skip those names. Both `sync_state` actions (engine and legacy API) go through the guarded merge.
   - The `carry_over_allowed` hook goes in `lib/break_escape.rb`.
3. **Client: guard** (S). `setReadOnlyGlobals`, called from `game.js` beside `setDeclaredGlobals`, plus the guard in the observer and in the two tag handlers. The test bridge (`systems/test-bridge/state.js`) exposes `importedGlobals`.
4. **Validator** (M). The checks in 2.8, with the imports merged into the declared globals before the existing checks run.
5. **Tooling** (S).
   - `tools/playtest/new-game.rb` gets `--imports none|latest|<file.json>`, **defaulting to `none`**, because `demo_player` is shared (5.3). It writes `player_state['importOverrides']` before `save!`, the same way it already seeds flags. `resolve_imported_globals` reads that first and then deletes the key. Games started from the browser UI (`games#create`) don't get the override and will pick up earlier runs; the playtest skill note says so.
   - The playtest-scenario skill and `README_scenario_design.md` get a carry-over section.
6. **Content**: exports in each source mission, then the first uses (section 4), one mission at a time through the dialogue loop. Engine changes are committed before the missions that rely on them (AGENTS.md, Housekeeping).

### 5.2 Tests

- **Rails model tests** (`test/models/`), all against fixtures:
  - a snapshot is written on conclude, refreshed on a later `/conclude` of a concluded game (even with every flag task wiped by a Restart), and kept by `reset_player_state!`;
  - the refresh leaves `score`, `completed_at` and `mission_concluded_at` unchanged and fires no `on_game_complete`;
  - a `sync_state` loaded with `SYNC_STATE_COLUMNS` (no `scenario_data`) merges globals and skips the imported ones without raising;
  - a concluded game with no snapshot is read through the in-memory fallback, minus its imported names, and nothing is written to it; a status-only `completed` game (Hacktivity Finish) is ignored;
  - `reset_player_state!` on a concluded game with no snapshot writes one first; a refresh whose `concludeRequires.globals` aren't met is skipped but still returns `already: true`;
  - a failing lookup leaves the game created, with defaults;
  - a snapshot value of the wrong type falls back to the default; imported names are not in the snapshot;
  - the lookup picks the newest snapshot, ignores in-progress and abandoned games, and ignores the current game;
  - a missing source gives the default and `found: false`;
  - `carry_over_allowed` returning false gives the defaults;
  - `merge_global_variables!` ignores imported keys, including `null`;
  - Restart keeps the imports; New Session looks them up again.
- **Controller test:** `conclude_mission_test.rb` gets the `already` path with a snapshot refresh, checking that the response is still `success: true, alreadyConcluded: true`.
- **Node test:** `test/js/global-sync-declared.test.mjs` gets read-only cases: an ink assignment is reverted with a warning logged, `#set_global` and `#set_variable` are refused, and the value still syncs into a second story.
- **Validator fixtures:** a source and reader pair under `scenarios/test_carry_over_*`, covering a missing export, a type mismatch, a write to an import, an import used in `concludeRequires`, and a bad name.
- **Browser:** m06 → m07 on the keyless server. Finish m06 and reach the credits, then create m07 and check the briefing branch. Restart m07 (same branch). Restart m06 without finishing, then a New Session of m07 (still the old run's value). Run `--imports none` (the neutral line).
- The regression set from AGENTS.md "Verifying work": the node suite, `bin/rails test`, `reopencheck` and the validator across m01–m08.

### 5.3 Risks

- **The snapshot depends on the credits being reached and the server answering.** The client fails open on a network error (`scenario-music-events.js:186-196`), so a dropped `/conclude` leaves the snapshot from the previous run, or none. Possible mitigation: also refresh the snapshot on a `sync_state` of a concluded game when `debrief_played` is true. I would leave this out: it is mission-specific, and the failure only leads to the neutral line.
- **Conclusion before the debrief** (the aim's tasks finishing first, 1.3) is covered by the refresh on every `/conclude`, as long as the credits call it. They always do.
- **A stale pre-conclude sync.** If the sync just before `/conclude` is answered `stale`, the server skips the merge (`games_controller.rb:698-699`), and the snapshot can miss the debrief's last globals. It is rare, and the next `/conclude` (a replay) or the next sync doesn't help, because the credits have already rolled. A possible fix is for `concludeMission()` to retry the sync once on `stale`. It is cheap and worth doing.
- **The shared standalone player.** Every local playtest uses the same `demo_player`, so carry-over from an earlier test run leaks into the next one. That is why `--imports` exists. Without it, playtest results would depend on run order.
- **A source mission is renamed or loses an export.** The validator catches this on the reading mission's next run. Old snapshots keep the old keys, so a renamed variable reads as its default.
- **Audio cost.** Every new branch is a new clip. Section 4 adds about 20 to 25 voiced lines across eight missions, all optional.
- **Old saves.** Games created before the change have no `importedGlobals`. Their inks see the `VAR` defaults, which are the neutral lines.
- **Non-VM missions reuse their game.** `MissionsController#show` uses `find_or_create_by!` (`missions_controller.rb:37`), so a non-VM mission keeps its first game's imports until the player starts a New Session. No m01–m08 mission is affected (they all need VMs), but the sis games are.
- **Privacy and size.** About 100 keys per finished run, stored in a column that already holds much more. No new personal data.

### 5.4 Effort

| Part | Size |
|---|---|
| Server: snapshot, lookup with fallback read, injection, guard, host hook (if Q3), tests | M (2–3 days) |
| Client guard and test bridge | S (half a day) |
| Validator checks and fixtures | M (1–2 days) |
| Tooling and docs | S (half a day) |
| Content: exports for m01–m08, first uses, dialogue loop, audio | per mission; S each for a single-line change (m02, m05, m06, m07), M for m08 and for the new m04 lines |

Engine total: about a week, which matches the backlog's "L" once content is included.

---

## 6. Open questions for the user

1. **Snapshot on the Game row (B), or a story-state table (C)?** The recommendation is B: no migration, and it survives a Restart. C is the answer if carry-over is ever meant to include kit or a codex.
2. **Should the source mission have to mark exports (`exportGlobals`)?** Recommended yes: renames are caught, and the snapshot still holds everything.
3. **Hacktivity events.** Should a player's earlier runs carry into an event? Recommended yes. Should an event be able to force everyone to the defaults? If so, build the host switch (2.10) now; if not, leave it out until it's wanted.
4. **`consequences_persist`.** Leave it as documentation (recommended), or have it gate imports?
5. **m01.** May m01's `scenario.json.erb` get an `exportGlobals` list? It is JSON only, with no change to the ink or audio.
6. **Which first uses to build first?** Recommended: m06 → m07 (the line already written for this) and m07 → m08 (U2), then the rest one mission at a time.
7. **Should a run that never concluded ever count?** Recommended no: a Hacktivity Finish, a give-up, leaves the previous finished run's choices in place (2.3).
8. **Should a Restart of the reading mission look the imports up again?** Recommended no: imports are fixed per game, and a New Session picks up newer source runs (2.5). The alternative is simpler for a player who replays m06 and then restarts m07, but it makes a game's story change under it.
9. **Should players see what carried over?** For example, a short "Previously…" line in the mission brief. Not proposed; ink handles everything in section 4.

---

## Appendix: review rounds

### Round 1 (Opus, read-only, 2026-10-17)

| Severity | Count |
|---|---|
| Blocker | 1 |
| Major | 1 |
| Minor | 11 |

| # | Finding | Outcome |
|---|---|---|
| 1 | **Blocker.** The read-only skip in `merge_global_variables!` read `scenario_data`, which `sync_state` doesn't load (`SYNC_STATE_COLUMNS`, `games_controller.rb:1369`, `:695`), so every sync would raise. The legacy API `sync_state` was missed. | Fixed: the names are kept in `player_state['importedGlobalNames']`, rebuilt by `initialize_player_state`; both sync actions are guarded (2.5, 2.6, 5.1, 5.2). Confirmed against the code. |
| 2 | **Major.** Moving the early return in `conclude_mission!` was underspecified: a gated refresh could refuse the credits on a Restart replay, which wipes the flag tasks. | Fixed: the early return stays first, and the refresh is ungated, saves only `player_state` and returns `already: true` (2.4, 5.1). Callback safety recorded. Refined in round 2 (#5): the refresh re-checks `concludeRequires.globals`. |
| 3 | The completed test wasn't the same as `mission_completed?`; `mission_concluded_at` has no backfill. | Fixed: the query uses `status = 'completed' OR mission_concluded_at IS NOT NULL`, with SQL pluck on the AvatarUnlocks pattern (2.3). Replaced in round 2 (#1). |
| 4 | `apply_task_set_globals!` is a server write path. | Fixed: it is guarded too (1.2, 2.6). |
| 5 | Stale line numbers after commit a73b1175. | Fixed: re-baselined, and method names added beside the citations. |
| 6 | Sync sends deltas, not the whole object; a `stale` pre-conclude sync can drop the last globals. | Fixed: 1.2 rewritten; risk and a retry added to 5.3. |
| 7 | The write-path count was wrong (about 30 client files). | Fixed: the wording says so, and 2.6 states the in-session gap. |
| 8 | Validator claims overstated (a missing VAR is a compile error; `requires` isn't a global gate). | Fixed: 2.8 corrected; 2.6 now lists error and warning cases. |
| 9 | sis02 → sis03: both say `consequences_persist: false`, and the variations are document content ERB can't see. | Fixed: 3 and 4 say so; sis03 is out of v1. |
| 10 | The observer revert is cosmetic (inkjs batches change events). | Fixed: worded as clean-up, and a warning log is added to the test. |
| 11 | Hacktivity's own creation path, and `find_or_create_by!` reuse. | Fixed: in 1.1 and 5.3. |
| 12 | Imports passing second-hand through snapshots; no run-time type check. | Fixed: imported names are left out of snapshots, and the validator rejects re-exporting one; a mismatched type falls back to the default (2.4). |
| 13 | Schema wording: the `completed` form, the default prefix for odd folder names, the no-op `where.not(id:)`, and the conclude JSON keys. | Fixed (2.1, 2.3, 1.3). |

The reviewer also noted, outside the plan's scope, that Restart sets `score = 0` on a completed game and the `already` path never recomputes it (`game.rb:85`). Not acted on; it's recorded here for the engine backlog.


### Round 2 (Opus, read-only, 2026-10-17)

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 8 |

Round-1 items: 1, 2, 4 and 6–10 and 13 confirmed closed. Item 3 was closed but led to finding 1 below. Item 5 was mostly closed (m06 and controller lines had drifted again). Items 11 and 12 were partly closed (findings 1 and 2). All are closed by the round-2 fixes.

| # | Finding | Outcome |
|---|---|---|
| 1 | **Major.** Hacktivity's Finish (`game_slots_controller.rb:243-251`) sets `status: 'completed'` on a never-concluded game. Under the `mission_completed?` test it would count, and usually be newest, so a give-up would override a finished run. | Fixed: a run counts only if `mission_concluded_at` is set or it has a snapshot (2.3). Finish is listed as a third path in 1.3, and Q7 added. Confirmed against the Hacktivity code. |
| 2 | **Major.** The lazy `update_column` backfill (AvatarUnlocks pattern) reads another row unlocked and writes the whole column. That can lose a sync, can abort the creation transaction on PostgreSQL, and copied imports second-hand. | Fixed: an in-memory fallback (globals minus `importedGlobalNames`) with no cross-row write; `reset_player_state!` snapshots an old concluded game before wiping; the lookup fails open inside `requires_new` (2.4). |
| 3 | `storyState` is already a phone-state key (`game.rb:1908-1910`). | Fixed: renamed to `storySnapshot` throughout the body. |
| 4 | Section 3 said B loads `player_state`; the pluck lacked the fallback's globals. | Fixed: the pluck takes the three jsonb keys, and the table is corrected. |
| 5 | The ungated refresh lets a half-finished replay overwrite a full run. | Fixed: the refresh re-checks `concludeRequires.globals` but not `tasksCompleted`, and never refuses the credits (2.4). |
| 6 | `syncGlobalVariablesFromStory` is an unguarded client write path. | Fixed: added to the client guard (2.6). |
| 7 | Default of `--imports`; browser-created playtest games leak; `importOverrides` should be removed after use. | Fixed: the default is `none`, the note is added and the key is deleted (5.1). |
| 8 | 2.5 was loose on where Restart gets the values. | Fixed: they come from `scenario_data['globalVariables']`, with no re-lookup. |
| 9 | Citation drift (m06, the conclude controller); Hacktivity's Restart wasn't mentioned. | Fixed (1.3, 1.4). |
| 10 | The host hook is YAGNI. | Accepted: it is deferred unless the user wants event opt-out (Q3). |

The reviewer also proposed Q8 (should a Restart of the reading mission look imports up again?). Added, with a recommendation.

### Round 3 (Opus, read-only, confirmation, 2026-10-17)

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 (a contradiction between sections) |
| Minor | 7 |

All 23 earlier items were confirmed closed. Round 2's #9 was the exception: the Hacktivity Restart sentence was wrong (see m5).

| # | Finding | Outcome |
|---|---|---|
| M1 | 5.1 said "no gate check" on the refresh; 2.4 and 5.2 say `concludeRequires.globals` is re-checked. A builder following 5.1 would rebuild the design round 2 rejected. | Fixed: 5.1 now matches 2.4. |
| m1 | `player_state ? 'storySnapshot'` is valid jsonb but redundant: snapshots exist only on concluded games. The SQLite note was moot (the test DB is PostgreSQL). | Fixed: the query uses `mission_concluded_at` alone (2.3). |
| m2 | Three places said reaching the credits always refreshes. | Fixed: each adds "with its `concludeRequires.globals` met" (2.4, 2.12). |
| m3 | The round-1 outcomes for #2 and #3 described the replaced designs. | Fixed: marked as refined or replaced in round 2. |
| m4 | The effort table still said "backfill" and listed the deferred hook. | Fixed. |
| m5 | Hacktivity's Restart refuses completed games, so it isn't "the same". | Fixed (1.4). The design is unaffected. |
| m6 | A stale sync skips the globals merge, not every merge. | Fixed (1.2). |
| m7 | An old concluded game restarted before shipping falls back to its replay's values. | Noted in 2.4 and accepted: a small case, with no error. |

Verdict: ready to hand to the user.
