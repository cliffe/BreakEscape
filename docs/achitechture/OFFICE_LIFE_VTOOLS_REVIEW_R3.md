# Office-life validator tools V1 to V9: code review round 3

Branch `build/ol-vtools` at 379e64264 (R2 fixes aa4cc5844, build log 524184317, main eae23283d merged). Read against R2 (`OFFICE_LIFE_VTOOLS_REVIEW_R2.md`, findings and Outcomes), the build log's "R2 outcomes", `git show aa4cc5844`, the plan at c3f2878e9 (rule 2 at line 28, the V9 row at line 295) and the engine code each tool mirrors.

**Verdict: REVISE.** 0 blockers, 1 major, 7 minors.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 7 |

Every R2 finding is closed as described, and no false exit 2 or false warning shows up on the committed corpus. The major is older than R2 and was missed by both earlier rounds: V9 works out which rooms lie beyond a new lock from the dungeon graph's room edges, and the graph leaves out every connection into or out of a locked room. A new locked room or corridor in front of required rooms therefore exits 1. That is the case the plan spells out ("New rooms join off existing rooms and never sit between the player and a required step").

## What was run

- `bin/test-js -j 4`: 660 files passed, 0 failed. Separately: `lock-key-diff` 15/15, `validator-office-life` 31/31, `validator-office-life-events` 3/3, `validator-references` 15/15, `validator-exit-code` 30/30.
- `bin/rails test test/unit/break_escape/tts_office_lines_test.rb`: 9 runs, 46 assertions, 0 failures, 0 errors, 0 skips.
- V6 keyless with `STRICT=1`: m01 and m02 0 clips; `test_needs_sims` 228 uncached, exit 1. `git status` unchanged.
- `validate_scenario.rb --no-graph --skip-ink --no-lint` on all 178 scenarios: every exit 0, no `could not run`, no office-life line on m01 to m10 (m02 and m09 no longer print a V8 line). Against the R2 corpus run, the only change is `npc-hub-demo-ghost-protocol` going from 15 to 18 warnings, which come from main's new duplicate NPC id check and not from the V tools. Main's reference checks (`check_references`, `reference_uniqueness_issues`) produce no new warning on any office-life fixture, so the merge causes no double reporting.
- Required-content coverage (the R2 script): m01 26/26, m02 26/26, m03 17/17, m04 12/12, m05 22/22, m06 20/20, m07 11/11, m08 14/14, m09 22/22, m10 20/20. Stations: m10 1 to 4 split across `gate_terminal`, `release_console`, `sealed_hatch` and `core_host_terminal`; m09 across `drop_terminal` and `tomb_beta_station`.
- V9 self-diff on copies of m02 and m10: empty, exit 0.
- V9 mutations on scratch copies (baseline from the unchanged copy, real scenario files untouched), scripts and copies in the session scratchpad under `vtools-r3/`:

| Mission | Mutation | Exit | Right? |
|---|---|---|---|
| m05 | key lock on `upload_schedule` (task target) | 2, names `find_upload_schedule` | yes |
| m05 | key lock on `data_package_manifest` (not required) | 1 | yes |
| m05 | new fixed coffee machine with an affordance | 0 | yes |
| m05 | new locker with `lockType` and `locked: false` | 1 | yes |
| m05 | new **locked** room `ol_annex` between `reception_lobby` and `main_corridor` | **1** | **no (major)** |
| m05 | the same room unlocked | 1 | yes |
| m09 | key lock on `drop_terminal` (station by prefix) | 2, names both flag tasks | yes |
| m09 | key lock on `field_laptop` (VM launcher) | 2 | yes |
| m09 | new printer with an `access` list | 1 | yes |
| m09 | `plan_cabinet` switched from `locked: true` to `false` | 1 | see minor 3 |
| m01 | lock `conference_room`, `maya_office` | 1 | yes |
| m01 | lock `kevin_office` | 2 (Kevin's workstation is a critical-path lock) | yes |
| m01 | lock `hallway_east` (only route to `derek_office` and `storage_closet`) | **1** | **no (major)** |
| m01 | lock `hallway_west` (only route to `manager_office`) | **1** | **no (major)** |
| m01 | unlocked id-less plant inserted first in `main_office_area` | 1, a lock "removed" and "added" | noise (minor 2) |

## R2 findings

| R2 | Outcome |
|---|---|
| M1 new lock on required content | Closed. The new-lock loop (`scripts/lock_key_diff.rb:405-415`) matches the snapshot's `locks` entry to `lock_<id>` or `lock_<graph_nid(id)>` and adds `lock_entry_guards`; the second loop (`:417-423`) catches a lock with no new node. Reproduced on m05 and m09 (table above); an unrequired object still exits 1. |
| M2 completion routes | Closed. `targetItemIds` by id, name, `opens_lock` and `key_id` (`:215`, `:223`) mirrors `targetIdMatches` (`objectives-manager.js:18-21`, `:221`, `:249`, `:442`); `targetGroup` reads `collection_group`, the field every engine path copies into `collectionGroup` (`inventory.js:638`, `interactions.js:1957`); `complete_task_actions` (`:272-280`) finds the m04 thermometer and shutdown button. Coverage is full on m01 to m10. Two task-completion fields are still not read (minor 4). |
| minor 1 station attribution | Closed for the station-qualified form every campaign mission uses. The fallback chain is judged below. |
| minor 2 V8 story patrolOverride | Closed. `office_life_action?` (`scripts/validate_office_life.rb:781-785`) needs an office trigger for a `patrolOverride`; m02 and m09 print no V8 line. |
| minor 3 V2 visits | Closed as asked, but the `door` half of it is wrong for the engine (minor 1). `AW.object_index` resolves the prop and PC rooms (`:405-414`). |
| minor 4 fixed magnet | Closed in V2 (`carried?`, `:368-370`, matching `interactions.js:1141`). V8 still counts fixed magnets twice (minor 6). |
| minor 5 test gaps | Closed for the cases listed; the prop_door test pins the wrong room (minor 1). |

**The fallback chain for flag tasks naming no station.** For `<station>:<vm>-flagN` the chain is right: it names the station the server accepts (`game.rb:5808-5820`, "that station only"). For m01 `submit_ssh_flag` (`"shatter_server:flag_1"`, `scenarios/m01_first_contact/scenario.json.erb:358`) the chain falls through to `acceptsVms` and names `entropy_launch_device` and `flag_station_dropsite`. Neither completes the task. The server never matches the reference form (`game.rb:5808-5812`). The task is completed by `completesTask` on the flag-locked `entropy_encrypted_archive` (`:2179`, read by `games_controller.rb:1244`) and by the `ssh_flag_submitted` mapping (`:986-990`). Nothing is missed today: the archive is a critical-path lock in its own right, and both named rooms hold other required content. The attribution is still wrong, though, and the legacy unqualified form (`"linux_server-flag1"`, any station accepting that VM) falls through to every `flag-station` by type, which skips a launch device or other type that accepts the VM. Acceptable as a conservative rule; minor 4 has the fix.

**The deferred V8 over-count.** Deferring it was reasonable. It is still a possible false warning, though, so minor 6 records it.

## Major

### M1. V9 cannot see past a newly locked room: a locked room or corridor in front of required rooms exits 1

`scripts/lock_key_diff.rb:307-331` (`downstream`, `guards`), `:351-358` (`lock_entry_guards`) and `:370-374` (`gate_guards` for door and room gates). Whether a new lock or gate guards anything is decided by walking the graph's edges downstream from its node. `generate_dungeon_graph.rb:1262-1265` draws no room-to-room edge when either end is locked ("Locked source or destination: access already shown via key/puzzle chain"). Lock `hallway_east`, then, and the graph has `door_hallway_east → hallway_east` and nothing onward: the existing edges `hallway_east → maya_office`, `hallway_west → hallway_east` and `storage_closet → hallway_east` are removed, and there was never an edge `hallway_east → door_derek_office`, because `derek_office` is locked too. `downstream` returns only the corridor, which holds no required content, so the lock passes as exit 1.

Failures, reproduced on scratch copies:

- m01: a key lock on `hallway_east`, the only way to `derek_office` (6 required tasks) and `storage_closet` (`open_derek_storage_safe`), exits 1. The same on `hallway_west`, the only way to `manager_office`, exits 1.
- m05: a new locked room `ol_annex` placed between `reception_lobby` and `main_corridor`, which cuts the start room off from every other room, exits 1 with only `+ lockNodes door_ol_annex` and the room edges to show for it. Rule 2 forbids exactly this, and V9 is the tool meant to prove it did not happen.

A door `gate` (or room `gate`) on such a corridor has the same blind spot, since `gate_guards` starts the same walk from `door_<room>`. The current corpus hides the problem: by scenario connections, only m01 has rooms (the two hallways) that hold no required content of their own but are the sole route to rooms that do. Office life is meant to add rooms ("New rooms join off existing rooms") and security windows, so later missions will hit it.

Fix: work out room reachability from the rendered scenario's `connections` (both directions, locked rooms included), not from the graph's room edges. For a new lock or gate on room or door R, flag the required rooms and the rooms holding critical-path lock nodes that are reachable from `startRoom` in the baseline layout but not once R is removed. Removing R, rather than walking downstream of it, also stops a lock on a side room from being blamed for rooms that have a second way in. Keep the graph walk for the object and key chain. Add fixture cases: a locked corridor in front of a locked required room (exit 2), a new locked room between the start room and the rest (exit 2), and a locked side room whose onward rooms have another way in (exit 1).

## Minors

1. **V2 sends a prop_door NPC into the door's room, which it never enters** (`scripts/validate_office_life.rb:409`). The engine performs `prop_door` as "a visit to the prop" (`public/break_escape/js/systems/npc-workarounds.js:8`), and `validate_access_work.rb:1271-1274` makes it an error for the prop to be inside the door's room ("the NPC must reach it while the door is shut"). The door room is the room being propped open, not a destination. Reproduced with a fixture: a key-holding NPC whose prop is in its own office and whose `door` is a locked `store` next door gets `V2: ... out of its own room (to store (workaround visit))`, a false warning. The test at `test/js/validator-office-life.test.mjs:180` asserts that wrong room. The NPC does walk for `share_login` (to the colleague named in `with`, `npc-workarounds.js:48`), and V2 does not add that room. Fix: drop the `door` line, keep the prop's room, add the `with` NPC's home room for `share_login`, and change the test to assert the store is not listed.
2. **Locks on id-less objects are keyed by array index, so inserting an object shifts them** (`scripts/lock_key_diff.rb:113-116`, `:417-419`). m01 has two id-less locks, `Main Filing Cabinet` (`main_office_area`, `scenario.json.erb:1256`) and `Kevin's Workstation` (`kevin_office`, `:1825`), both at `objects[0]`. Reproduced: inserting an unlocked plant at the head of `main_office_area/objects` gives exit 1 with `- .../objects[0] Main Filing Cabinet` and `+ .../objects[1] Main Filing Cabinet`, which reads as a lock removed and another added. It breaks the "empty diff" the plan expects of a slice that adds only props, and in the second loop the shifted path can also hide a new lock placed at the old index. Fix: key array members by `name` (or `type` plus `name`) when there is no id, as the graph does (`generate_dungeon_graph.rb:143`).
3. **Removing a critical-path lock, or switching it off, exits 1 like any other change** (`scripts/lock_key_diff.rb:402-431`, `:471-473`). Rule 2 says no lock is "moved, removed or given a second way past it" (plan line 28). Reproduced on m09: `plan_cabinet` set to `locked: false` gives exit 1, `graph: 2 removed, 1 added`, and no `RULE 2` line. This matches the V9 row, which only asks for new doors and gates to be flagged, and the change is printed for the reviewer. Still, a bypass of the critical path carries the same exit code as a new plant. Fix: print a `RULE 2` line, and exit 2 or a separate code, when a non-optional lock node disappears, when a lock on a critical-path node is switched off, or when its `requirementHash` changes. A changed requirement can also make a lock unopenable.
4. **Two task-completion fields are not read, and flag forms other than `<station>:` are attributed loosely** (`scripts/lock_key_diff.rb:202-268`, `:285-297`). `completesTask` on a flag-locked object (`games_controller.rb:1244`) and `completesTaskOnOpen` (`unlock-system.js:997`, used by sis01) both complete tasks. m01's `submit_ssh_flag` is completed by the archive's `completesTask` and attributed to the launch device and the drop-site instead (see the fallback judgement above). Fix: add `completesTask` and `completesTaskOnOpen` (string or array) as rows naming the object. For the reference form `<vm>:flag_N`, use the flag locks whose `requires` equals the ref. For the unqualified `<vm>-flagN`, use every object whose `acceptsVms` holds `<vm>`, of any type.
5. **Mapping rows fall back to the holder NPC's room, which over-includes the handler's room** (`scripts/lock_key_diff.rb:262-265`). A `global_variable_changed:*` mapping names no room or object, so its rows go to the room of the NPC holding it. On m01, 10 tasks get rows in `reception_area` (cabinet, safes, every flag task and others), none of which happen there. Today this is harmless because the start room is required anyway. In a mission whose handler NPC stands in an optional room, a new gate on that room would be a false exit 2. Fix: for a global trigger, take the rooms of the objects whose `flagRewards`, `onPickup` or similar actions set that global, and drop the holder-room fallback for phone NPCs.
6. **V8 counts fixed magnets as office-life items and as dropped magnet items** (`scripts/validate_office_life.rb:764`, `:768`). `dropped magnet items` (cap 2) goes up for every magnet, and `office-life items` (cap 4) for every magnet with `takeable != false`, so an untakeable coffee urn or a magnet with no `takeable` counts, although V2's `carried?` already treats both as fixed. Three fixed magnets would give a false `V8: sync budget dropped magnet items is 3, above its cap of 2` warning. Nothing in the corpus reaches the cap. Fix: count both rows through `carried?`.
7. **`lock_on?` treats `lockType` without `locked` as a lock; the engine does not** (`scripts/lock_key_diff.rb:345-347`). The engine locks an object only when `locked === true` (`interactions.js:474`, `:1749`), and the graph does the same (`generate_dungeon_graph.rb:146`). An office-life change that adds `lockType` to a required PC without `locked: true` would be a false exit 2 in the second loop. One object in the whole corpus is like this (`ceo_exfil`, a bluetooth lock), so this is low risk. Fix: `l['locked'] == true`.

## Checks that passed

- No false exit 2 and no false warning on the committed corpus. Every V9 mutation with a lock directly on a required object, station or launcher exits 2 and names the task.
- V6 needs no key, makes no network call and writes nothing; `STRICT=1` exits as documented.
- V9 stays deterministic after the main merge (m02 and m10 self-diffs empty). The baseline holds hashes and flag references only, no secrets.
- Lines added in R2: no em or en dashes, no model names.

## Outcomes

Each finding was reproduced before the fix. None is withdrawn. Tests are in `test/js/lock-key-diff.test.mjs` (V9, now 24) and `test/js/validator-office-life.test.mjs` (V1 to V8, now 32).

| Finding | Outcome |
|---|---|
| M1 | Fixed. The snapshot carries a `layout` (start room plus both-way adjacency from `connections` and `doors`, locks ignored). `cut_off` takes a new locked room, or a door, out of it and names every required-content room and every room holding a critical-path lock that the start room reaches before but not after. Room locks and gates use the room; door locks and gates cut the one door. The graph walk stays for the object and key chain. The room-lock graph node `door_<room>` is now matched to its lock entry. Reproduced on copies, all exit 1 before and exit 2 after: m01 `hallway_east` (names `derek_office` and `storage_closet`), m01 `hallway_west` (`manager_office`), m05 new locked `ol_annex` (eight rooms). The same room unlocked still exits 1. Four fixture tests: locked corridor in front of a locked required room, new locked room beside the start room, locked side room with a second way in (exit 1) and a locked dead end (exit 1), door gate with and without a second way in. |
| Minor 1 | Fixed. A `prop_door` visit is to the prop's room only. A `share_login` visit adds the `with` NPC's home room. The test now asserts the store is absent and adds the own-office prop case (no V2 warning). |
| Minor 2 | Fixed. Id-less array members are keyed by `type|name`, with position (else ordinal) when those repeat. An unlocked plant inserted first in m01 `main_office_area` gives an empty diff, exit 0. Test: insert before an id-less lock, and two same-name safes kept apart by position. |
| Minor 3 | Done as decided: a critical-path (non-optional) lock the baseline had that is gone, or whose entry is no longer `locked: true` (the graph keeps the node of an object left with a `lockType`), prints `RULE 2: critical-path lock '<node>' removed or switched off (a bypass)` and exits 2. An optional lock removed stays exit 1. m09 `plan_cabinet` switched off now exits 2. Tests: room lock removed, object switched off, optional lock removed. The header comment and the build log carry the new exit rule; `README_scenario_design.md` still describes exit 2 as new doors and gates only, and is outside this round's edit list. |
| Minor 4 | Fixed. `completesTask` and `completesTaskOnOpen` (string or array) tie the task to the object. A `<vm>:flag_N` reference no longer falls through to `acceptsVms`: it names the objects whose `requires` or `flags` hold it. The unqualified `<vm>-flagN` goes to every object accepting the VM, any type. m01 `submit_ssh_flag` now names `entropy_encrypted_archive` and no longer the launch device or the drop-site. Tests: the completion fields, and the three flag forms. |
| Minor 5 | Fixed with a fallback. A `global_variable_changed:<g>` mapping takes the rooms where `<g>` can be set (a `set_global` action, a `setGlobal` or `setVariable` map such as `onRead`, or NPC ink assigning it). The holder NPC's room stands in only when nothing in the scenario sets the global (m02 `backup_restore_initiated` and `ransom` choices are set by engine code), because skipping the mapping left m02 `initiate_backup_recovery` and `make_ransom_decision` without a room and the placement pin failed. Test: both cases. |
| Minor 6 | Fixed. `dropped magnet items` and the magnet part of `office-life items` count only magnets `carried?` accepts. Leave-behind and reveal items keep their `takeable != false` rule. Test: three fixed magnets give no V8 line, three carried ones give `dropped magnet items is 3`. |
| Minor 7 | Fixed. `lock_on?` is `locked == true`, and an object gate's `lock` flag reads the same. Test: `lockType` alone on a required target is exit 1, with `locked: true` exit 2. |
