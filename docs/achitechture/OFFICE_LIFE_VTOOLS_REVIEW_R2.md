# Office-life validator tools V1 to V9: code review round 2

Branch `build/ol-vtools` at 1ce788678 (main 32516127c merged), diffed against 32516127c. Read against R1 (`OFFICE_LIFE_VTOOLS_REVIEW_R1.md`), the build log's "R1 outcomes" section, OFFICE_LIFE_MISSIONS_PLAN.md (c3f2878e9) sections 4 and 7, and the code and tests.

**Verdict: REVISE.** 0 blockers, 2 majors, 5 minors.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 5 |

Both majors are in V9's rule 2, the check the tool exists for: a new lock placed directly on required content exits 1, and some of the ways the engine completes a required task are still not counted as required content. Everything else R1 raised is closed, or closed well enough for a warning-level tool.

## What was run

- Node tests: `lock-key-diff.test.mjs` 11/11, `validator-office-life.test.mjs` 27/27, `validator-office-life-events.test.mjs` 3/3.
- Rails: `test/unit/break_escape/tts_office_lines_test.rb` 9 runs, 0 failures, 0 skips (keyless).
- `validate_scenario.rb --skip-ink --no-graph` on m01 to m10, `lab_physical_pentest` and `test_needs_sims`: every exit 0, no `could not run`, no office-life warning or error on any campaign mission. m02 and m09 now print a V8 info line (minor 2).
- `--office-summary` on m01: the receptionist and the other tuned NPCs show `fights`, none shows `hostile` (R1 M1 closed).
- V6 keyless with `STRICT=1`: m02 0 clips, exit 0; `test_needs_sims` 228 clips, exit 1. `git status` unchanged afterwards.
- V9 on scratch copies of m01, m04, m09 and m10: `--write` then a diff gives "empty", exit 0. `LockKeyDiff.snapshot` plus a self-diff against the committed graph on every scenario that has one: 156 pass, none crashes; `lab_tesseract_trials` is refused because it draws from `SecureRandom` (correct, R1 minor 14). No committed V9 baseline exists on any office-life branch, so the format 2 change strands nothing.
- Required-content coverage per campaign mission (script over `LockKeyDiff.required_content`): m02, m03, m05 to m10 have a room for every required task; m01 misses 2 and m04 misses 2 (major 2).
- Mutations on scratch copies of m04, each diffed against the unmodified baseline: a key lock on `flag_station_dropsite` exits 1 (major 1); a key lock on `analog_thermometer` exits 1 (majors 1 and 2).
- A V2 fixture with a fixed magnet (`takeable: false`) in the NPC's own room (minor 4).

## R1 findings

| R1 | Outcome |
|---|---|
| M1 V1 `hostile` | Closed. `starts_hostile?` (`validate_office_life.rb:261-264`) and the `fights` hint; m01 output checked. |
| M2 V9 gate start node | Closed for gates. Doors are keyed by `connectedRoom` (`lock_key_diff.rb:114`), a door gate starts at `door_<connectedRoom>` or the room (`:295-299`), an object gate at `lock_<id>` and also guards the object when required content names it (`:304-308`). New locks do not get the same object check (major 1). |
| M3 V9 required content | Partly closed. `required_content` (`:198-245`) adds item ids, item types, ink `complete_task`, completing mappings and flag stations, and m03, m08 and m10 are fully covered as the log says. m01 and m04 are not (major 2). |
| M4 V5 required lock | Closed. `required_unlock_targets` (`validate_office_life.rb:577-594`) and the error at `:614-617`, with object and room targets kept apart. |
| minor 1 delivery key | Closed. `each_host_story_line` (`tts_line_extractor.rb:123-132`) and `key_for` with no delivery (`tts_office_lines.rb:73-75`); the test proves only the undelivered key counts as cached. |
| minor 2 shared clips | Closed. Listed and marked `shared` (`tts_office_lines.rb:98-99`). |
| minor 3 knot by story | Closed. `office_knots` keys `[storyPath, knot]` (`:57-71`). |
| minor 4 V6 task tests | Closed. The rake task runs keyless in a subprocess with `TTS_CACHE_DIR` on a fixture cache (exit 0, 1, 0 and the usage abort). `TTS_CACHE_DIR` is read only by the task, never by `TtsService`, so it cannot move the server's cache. |
| minor 5 other writers | Closed (`validate_office_life.rb:531-557`). |
| minor 6 global chains | Closed. Fixed point at `:476-496`. |
| minor 7 patrolOverride | Closed (`:399-405`). |
| minor 8 V2 away rooms | Partial, and the reason given for the gap does not hold (minor 3). |
| minor 9 V4 drops | Closed (`:452-468`). |
| minor 10 V1 hints | Closed. |
| minor 11 `npc_arrived:*` | Closed (`:437-441`). |
| minor 12 V8 onceOnly | Partial, and the chosen rule over-counts story mappings (minor 2). |
| minor 13 lab V5 pin | Closed. |
| minor 14 V9 determinism | Closed. `render` seeds `Kernel#rand` and renders twice (`lock_key_diff.rb:67-81`). |

## Majors

### M1. V9 never flags a new lock placed directly on required content

`scripts/lock_key_diff.rb:329-335`. For each new lock node, `diff` calls `guards(cur, n['id'])`, which looks only *downstream* of the lock node for required rooms and critical-path locks (`:272-279`). The locked object itself is never compared with `requiredContent`. `gate_guards` does make that comparison for gates (`:306-307`), so the two paths disagree. The graph puts a locked object's lock node under its room (`generate_dungeon_graph.rb:147-150`) with no edge to anything the object completes, so a lock on a station, a task target or a task's trigger object has an empty downstream.

Failure, reproduced on a scratch copy of m04: adding `"locked": true, "lockType": "key", "requires": "station_key"` to `flag_station_dropsite`, the only flag station and the one every `submit_flags` task needs, prints the new lock node and lock entry and exits **1**. A lock on `analog_thermometer` exits 1 as well. The same happens when an office-life slice gives an owned workstation a `login` lock and that workstation is a required task's `targetObject`, which is the kind of change office life makes. The merge gate reads exit 1 as "changes, none guarding required content".

Fix: in the new-lock loop, take the object id from the snapshot's `locks` entry whose `lock_<graph_nid(id)>` matches the node (or from the lock's path), and add the same `requiredContent` check that `gate_guards` makes, naming the task. Add fixture cases for a new lock on a flag station and on a required task's `targetObject` (both exit 2).

### M2. Required content still misses three ways the engine completes a required task

`scripts/lock_key_diff.rb:207-218` and `:233-243`. The engine also completes tasks through:

- **Object action lists.** `{ "type": "complete_task", "taskId": ... }` in an object's `triggerOnInteract` or a minigame's `completionActions` (`apply-actions.js:187`). m04 completes both `identify_scada_anomalies` (`scenario.json.erb:2221-2224`, the thermometer) and `disable_attack_vectors` (`:2716-2719`, the shutdown button) this way. Both are in the conclusion gate.
- **`targetItemIds` by name or lock ref.** `targetIdMatches` takes the item's id, its `opens_lock`/`key_id` or its name (`objectives-manager.js:12-21, 221`). V9 looks up `placement[id]` by object id only. m01 `find_derek_access` names `"Derek's Office Key"` and `"Lock Pick Kit"` by name, and `derek_office_key` is the key's `opens_lock`, not its id (`m01 scenario.json.erb:250, 1631, 1741-1743`), so none of the three resolves.
- **`targetGroup`.** `collect_items` with `targetGroup` matches the item's collection group (`objectives-manager.js:430-433`). m01 `search_derek_computer` (`:285`) has no room.

Failure: on m01 and m04, 4 required tasks have no row in `requiredContent`, against the log's statement that M3 is fixed. With M1 this gives the reproduced exit 1 for a lock on m04's thermometer, which blocks a task the ending requires. A door gate is still caught if the room holds other required content, which hides the gap on today's corpus but not for an object-level change.

Fix: walk each room for hashes of `type: complete_task` (any key: `triggerOnInteract`, `completionActions`, `progressActions`, `onPickup` and the like) and add the enclosing object's room and id; resolve `targetItemIds` against id, `opens_lock`, `key_id` and `name`; add the rooms of items whose `collectionGroup` (or the field the engine reads) equals a `targetGroup`. Extend the coverage check to all ten missions in a node test: every required task has at least one `requiredContent` row, or is listed as an exception with a reason.

## Minors

1. **Flag stations ignore `targetFlags`, and a station of another type is missed** (`lock_key_diff.rb:215-217`). Every flag station and VM launcher is attributed to every `submit_flags` task, but campaign `targetFlags` name the station: `"gate_terminal:bunker_monitor-flag1"` (m10), `"drop_terminal:catalogue_server-flag1"` (m09). In m10 a gate in front of `core` reports that it guards `submit_flag_1` to `submit_flag_4`, while only `submit_flag_4` is submitted there. m01 `submit_launch_code` names `entropy_launch_device`, a `launch-device` held by Derek, which the type filter never sees (Derek's room is counted through his ink, so nothing is missed today). On the question raised: counting launchers as required is acceptable as a conservative rule, and on the corpus it gives no false exit 2, because every room with a launcher also holds a station some task names. It can over-flag when a slice adds a redundant launcher behind a new gate. Fix: attribute a flag task to the station its `targetFlags` prefix names (any type), keep launchers as required content only where a launcher with that VM is the sole one reachable before the station, or keep all launchers but name them "(VM launcher)" rather than listing every flag task.
2. **V8 now counts story `patrolOverride` mappings as office life** (`validate_office_life.rb:748, 754-756`). The R1 minor 12 rule counts any `onceOnly` mapping with a `patrolOverride`, whatever its trigger. m02's `roaming_ward_nurse` (`global_variable_changed:patient_bed4_state`, `scenario.json.erb:1737-1743`) and m09's `old_coyote` (`global_variable_changed:flag1_submitted`) are scripted patrol, which the event exclusions themselves class as "not office life", and both were committed before R1. m02 and m09 now print `office-life onceOnly mappings 1/10`, so the build log's "no V8 count changed under the wider onceOnly rule" is wrong for them (the R1 corpus comparison counted warnings and errors, not info lines). The plan's m02 pilot budget expects 4 new `onceOnly` mappings (`OFFICE_LIFE_MISSIONS_PLAN.md:554`); V8 will show 5 and the reviewer's sum check will not match. Fix: count `patrolOverride` only when the trigger is an office-life event or global, keep `needs` and office-life `emitEvent` as actions, and pin m02 and m09 at 0 in the corpus test.
3. **V2 visits: a static target does exist** (`validate_office_life.rb:370-394`). The log says the readers expose no static visit target. Workarounds do: `prop_door` names the door's room (`door`) and the object to prop it with (`prop`), and `validate_access_work.rb:1269-1280` already resolves the prop's room and checks it against the leash. A story NPC with a `prop_door` workaround onto another room leaves its post for it, and V2 says nothing. Fix: add the `door` room and the `prop` room of each workaround to `away_need_rooms` as `(workaround visit)`, and the target PC's room for `borrow_session`; queued check visits for down resources can stay out, as they have no authored target.
4. **V2 treats every magnet as droppable** (`validate_office_life.rb:380, 390-392`). Magnets are skipped from the need loop and then any magnet that satisfies a need adds every reachable room, without looking at `takeable`/`droppable`. Reproduced: a cake magnet with `takeable: false` in the NPC's own office gives `out of its own room (to kitchen (magnet))`. V8 already treats `takeable: false` magnets as fixed (`:746`). Fix: add every reachable room only for a magnet the player can carry (`takeable != false`, or in `startItemsInInventory`), and otherwise the magnet's own room as `(magnet)`. Add the fixed-magnet case to the V2 test.
5. **Test gaps.** No fixture covers a new lock on required content (M1), an object `complete_task` action, a name or `opens_lock` `targetItemIds` entry, a `targetGroup` task (M2), `targetFlags` station attribution (minor 1), a story `patrolOverride` mapping in V8 (minor 2), or a fixed magnet (minor 4). The V2 magnet test uses only `droppable: true` (`validator-office-life.test.mjs:153`). The coverage script used for this review (every required task has a room, per mission) would make a cheap corpus pin.

## The Rails skips

The second skip is `test/models/break_escape/payload_scan_fresh_state_test.rb:234`, "fresh-state corpus scan over every route (held until step 3 declares acknowledgedClues)". It came from main with format step 6a-1 (commits 57a31d85c and 515878efb, 14 November), not from this branch. It is a deliberate hold: the skip lifts by itself and the test then fails once step 3 declares `acknowledgedClues` in the schema. It does not touch the V tools and does not matter for this review. The skip that was there at R0 is `test/integration/room_lazy_load_test.rb:58` ("Route requires room_id parameter"), an unconditional skip. Running both files and `scenario_schema_test.rb` gives exactly these two skips.

## Checks that passed

- No campaign mission gets an office-life error or warning; the lab V5 pin finds its 3 real errors.
- V6 needs no key, makes no network call and writes nothing; `STRICT=1` exits as documented.
- V9 is deterministic on m01, m04, m09 and m10, refuses a stale graph and a `SecureRandom` template, and survives every scenario in the corpus without an exception. Baselines hold hashes and flag references only.
- Door gates, room gates and object gates on locks reach the right start node; an `access` list on a plain object (which the engine ignores outside lock requirements, `unlock-system.js:119`) exits 1, as R1 asked.
- Added lines: no em or en dashes, no model names.

## Outcomes

Every finding was checked against the code before the fix: both majors and all five minors reproduce as written, so none is withdrawn.

| Finding | Outcome |
|---|---|
| M1 new lock on required content | **Fixed.** The new-lock loop (`scripts/lock_key_diff.rb:401-423`) now takes the locked object from the snapshot's `locks` entry whose `lock_<id>` (or `lock_<graph_nid(id)>`) is the new node and adds `lock_entry_guards` (`:351-358`), which names the object through `object_guards` (`:339-342`, now shared with `gate_guards`). A lock put on, or switched on, with no new graph node is checked the same way from its `locks` entry (`:416-422`), so a fixture graph or a lock the generator does not draw still counts. m04 mutations rerun: a key lock on `flag_station_dropsite` and on `analog_thermometer` each exit **2**, naming the tasks. Tests: `test/js/lock-key-diff.test.mjs:196` (a flag station with no lock node, a required `targetObject` under a `lock_<id>` node with nothing downstream, and a lock on an unrequired object staying exit 1). |
| M2 missing completion routes | **Fixed.** `required_content` (`lock_key_diff.rb:202-268`): `targetItemIds` resolve on an item's `id`, `name`, `opens_lock` or `key_id` (`:223`), `targetGroup` on `collection_group` (`:225`), and `complete_task_actions` (`:272-281`) finds `{ type: complete_task }` under any key of an object, NPC or room, attributed to the nearest enclosing id (also inside mapping action lists). Placement over m01 to m10 (tasks with at least one room / required tasks): m01 26/26, m02 26/26, m03 17/17, m04 12/12, m05 22/22, m06 20/20, m07 11/11, m08 14/14, m09 22/22, m10 20/20 (R1 tip: m01 24/26, m04 10/12). Tests: `:226` (each route) and the corpus pin `:313` (every required task of m01 to m10 has a room; no exceptions needed today). |
| minor 1 flag stations | **Fixed.** `flag_stations` (`:285-297`): the object a `targetFlags` prefix names (any type), else objects whose `flags` hold the ref, else objects whose `acceptsVms` hold the prefix, else every flag station. m10 now ties `submit_flag_1` to `gate_terminal`, 2 to `release_console`, 3 to `sealed_hatch`, 4 to `core_host_terminal`; m09 splits across `drop_terminal` and `tomb_beta_station`; m01 `submit_launch_code` names `entropy_launch_device` and `submit_ssh_flag` (`shatter_server:flag_1`, which no station lists) falls to the two objects that accept `shatter_server`. VM launchers stay required, one row each as `VM launcher (flag tasks)` (`:230-232`): every campaign launcher is the shared attack box, not a per-flag VM, so it cannot be tied to one task. Test: `:250`. |
| minor 2 V8 story patrolOverride | **Fixed.** `office_life_action?` (`scripts/validate_office_life.rb:781-785`) counts a `patrolOverride` only when `office_trigger` finds an office-life event or a global only office life writes; `sync_budget` passes the office-life globals (`:770`). m02 and m09 now print no V8 line. Tests: `test/js/validator-office-life.test.mjs:369` (story trigger 0, office event and office global 2) and the corpus pin `:404` (m02 and m09 at 0). The build log's R1 sentence is corrected in its R2 section. |
| minor 3 V2 visits | **Fixed.** `away_need_rooms` (`validate_office_life.rb:403-414`) adds a `prop_door` workaround's `door` and its prop's room, and a `borrow_session`'s PC room, as `(workaround visit)`, resolving objects through `AW.object_index`, the same lookup `validate_access_work.rb:1269-1280` uses (not copied). Queued visits for down resources stay out. Test: `:171` (prop_door door and prop, borrow_session, and a leash clearing it). |
| minor 4 fixed magnet | **Fixed, with one change from the suggestion.** `carried?` (`:368-370`) treats a magnet as carried only when `takeable: true`, `droppable: true` or in the starting inventory: the engine picks up only a truthy `takeable` (`interactions.js:1141`), so a magnet with no `takeable` is fixed too, not only one with `takeable: false`. A fixed magnet adds its own room (`:401`). Test: `:158` (`takeable: false` and no `takeable` in the NPC's own room give nothing; `takeable: true` there and a fixed one in the kitchen give `kitchen (magnet)`). V8's `office-life items` row still counts `takeable != false`; it over-counts a little and was left alone. |
| minor 5 test gaps | **Fixed.** Every case listed is now covered by the tests named above. |
