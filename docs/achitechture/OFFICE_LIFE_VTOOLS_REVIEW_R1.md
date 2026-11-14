# Office-life validator tools V1 to V9: code review round 1

Branch `build/ol-vtools` at c8f87fda7, diffed against main 896ec3cd8. Spec: OFFICE_LIFE_MISSIONS_PLAN.md (c3f2878e9) sections 4, 6.10, 7 and 10; the build log `OFFICE_LIFE_VTOOLS_BUILD_LOG.md`; the new README section.

**Verdict: REVISE.** 0 blockers, 4 majors, 14 minors.

## What was run

- `validate_scenario.rb --no-graph --skip-ink --no-lint --office-summary` on m01, m02, m05, m10, `test_needs_sims` and `lab_physical_pentest`: every exit code was 0. The V1 NPC counts match the build log (m01 7, m02 17). The V8 lines match the log for the lab (onceOnly 12/10) and for `test_needs_sims` (reveal 8/6, onceOnly 48/10).
- `ValidateOfficeLife.check(..., campaign: true)` forced on the labs and test scenarios. V5 catches the patterns the plan calls intended there: `lab_physical_pentest` gives 3 errors (`grab_creds` through the `kp_creds_captured` global set by `workstation_owner_returned:staff_pc`, `drop_usb` from `item_dropped`, `usb_foothold` from `npc_used`), and `test_needs_sims` gives 45. Detection works on real data. `lab_social_engineering` gives nothing.
- V9 on scratch copies of m01, m02, m08 (which uses `random_pin`) and `lab_physical_pentest`: `--write` then a diff gives "empty" with exit 0 each time, and the regenerated `dungeon_graph.{json,md,html}` match the committed files byte for byte. Two mutations on the lab: locking `briefing_room` gives exit 2 (correct), and an `access` list on `coffee_station` also gives exit 2 (wrong, see M2).
- V6 (`env -u GEMINI_API_KEY STRICT=1 bin/rails "app:break_escape:tts:office_lines[...]"`) on `test_needs_sims` (228 clips, exit 1), `lab_physical_pentest` (67 clips, 1 cached, exit 1) and m02 (0 clips, exit 0). No file under `tts_cache/`, `log/` or `tmp/` changed. `tts_office_lines_test.rb`: 4 runs, 0 failures.
- V10 merge: `git merge-tree HEAD build/ol-sims` conflicts in exactly the two files the log predicts. The only method name both files define is `check`, and the only shared constant is `VN`. V10's tests match substrings with `has(...)`, so the extra V3, V7 and V8 issues that `check` now returns cannot break them. The merge is straightforward as the log describes it.
- Added lines: no em or en dashes, no model names, no US spellings outside code identifiers (`behavior`).

## Majors

### M1. V1 marks every combat-tuned NPC as `hostile`

`scripts/validate_office_life.rb:243`: `hints << 'hostile' if npc.dig('behavior', 'hostile')`. In the corpus, `behavior.hostile` is the block of combat numbers (`chaseSpeed`, `attackDamage`, `fightStyle`, `leash`; `npc-hostile.js:33`, "the combat numbers a scenario can set per NPC"). An NPC is hostile from the start only with `behavior.hostile.startHostile` (`npc-behavior.js:458`).

Failure: m01's `--office-summary` shows `hostile` on sarah_martinez, derek_lawson, kevin_park and maya_chen, none of whom starts hostile. Stage 0 builds its class table from this summary, so the receptionist would be wrongly ruled out of office life. The V1 fixture (`behavior: { hostile: true }`) is not what real scenarios contain, so the test passes anyway.

Fix: `hints << 'hostile' if npc.dig('behavior', 'hostile', 'startHostile') == true` (a bare `hostile: true` can stay for safety). Optionally add a `fights` hint when the tuning block is present. Change the V1 fixture to `{ hostile: { startHostile: true } }` and add a case where a tuning-only block gives no `hostile`.

### M2. V9 starts rule 2 for an object gate at the wrong node, and for a door gate on the wrong side

`scripts/lock_key_diff.rb:218-224`. The gate's start node is the object id if a lock node has that id, and otherwise the gate's own room. The graph names lock nodes `lock_<object id>` and `door_<room id>` (lab graph: `lock_hot_desk_pc`, `door_secure_area`), so an object id never matches and every object gate starts at its room. A door gate is keyed by array index (`/rooms/open_plan/doors[0]`, from `walk` at `:95`, because doors have no `id`) and also starts at its own room, which is the near side. The plan asks for the far side, `connectedRoom`.

Failure, reproduced on a copy of `lab_physical_pentest`: adding `"access": { "people": ["pierce"] }` to `coffee_station`, which is not a lock and has nothing behind it, prints `RULE 2: new access at /rooms/open_plan/objects[coffee_station] guards room 'secure_area' (required task), critical-path lock 'lock_hot_desk_pc', ...` and exits 2. Any new gate in a room that holds a lock or a required task exits 2, so the exit code tells the reviewer nothing. The opposite case also fails: a gate on a door out of a room with no downstream locks, leading to a required room, starts at the near room. It is caught only if a graph edge happens to run from the near room to the far one. Adding a door before an existing one shifts the indices, and the existing gate then shows as removed and re-added (a new gate, so flagged).

Fix: map an object gate to `lock_<id>` when that node exists, otherwise to the object itself, and flag only when the object is a required task's target or a lock. For a door, key the path by `connectedRoom` (`doors[secure_area]`) and start at `door_<connectedRoom>` or at the `connectedRoom` room node. Add fixture cases for an `access` list on a non-lock object (expect exit 1) and a gate on a door into a required room from a room with no other content (expect exit 2).

### M3. V9's "required content" ignores most required tasks in the campaign

`scripts/lock_key_diff.rb:147-161`. `required_rooms` uses only a required task's `targetRoom`, `targetObject` or `targetNPC`. In the campaign, most required tasks have none of these: m08 has 2 of 14 with a target, m03 4 of 17, m10 6 of 20. The rest are `manual`/`custom` tasks completed by mappings or ink, `collect_items` tasks with `targetItemIds`/`targetItems`, and `submit_flags`.

Failure: a slice adds a gate in front of the room of the NPC whose ink sets a required `custom` task, or of the object a required `collect_items` task names. If no lock lies further on, V9 reports a change with exit 1 instead of exit 2. Rule 2 is the reason V9 exists, and on m08 it is blind to 12 of the 14 required tasks.

Fix: add to `required_rooms` the placement of `targetItemIds`; the room of each NPC whose ink has `#complete_task:<id>` or whose mapping `completeTask`s it; and the room of the object or NPC named in the eventPattern of a mapping that completes a required task (`item_picked_up:<id>`, `object_interacted:<id>`, `conversation_closed:<npc>`, and so on). `ValidateOfficeLife.ink_required_tasks` and `each_mapping` already do most of this. Add an m08-shaped fixture (a `custom` task completed by an NPC's ink).

### M4. V5 leaves a provably required lock as a warning

`scripts/validate_office_life.rb:459-462`. An `unlockDoor`/`unlockObject` mapping on an office-life trigger is always a warning. The build log's reason is that the validator "cannot tell a critical-path lock". It can, though, tell a lock that a required task names. `unlock_object` and `unlock_room` tasks complete when their `targetObject`/`targetRoom` unlocks (`objectives-manager.js:285-305`). So `{ eventPattern: "npc_used:pc", unlockObject: "safe" }`, with a required `unlock_object` task on `safe`, completes required content from office life, and that is exactly V5's error case. m01 has 5 required `unlock_object` tasks and 1 `unlock_room`, and m09 has 3 between them.

Failure: an office-life slice that opens a required safe from `workstation_owner_left:<pc>` passes the merge gate with a warning.

Fix: when a mapping's `unlockObject`/`unlockDoor` target is the `targetObject`/`targetRoom` of a required task, report `❌ ERROR` and name the task. Keep the warning for other locks, or, when the validator has generated the graph (no `--no-graph`), raise it to an error for non-optional lock nodes. Add a fixture.

## Minors

1. **V6 keys exchange and call lines with their `#delivery:` note; the client sends none.** `app/services/break_escape/tts_office_lines.rb:67-77` takes the extractor's key, which carries `line_delivery(line)` for person-chat host lines. Exchanges and desk-phone calls play through `NpcChatterVoice`, `mgr.play(npcId, line)` (`npc-needs-chatter.js:253`), with no delivery. An exchange line tagged `#delivery:` (the tag appears in 50 ink files) shows V6 the state of a key the client never requests. STRICT can then pass on a clip that is really uncached, or fail on one that is cached. Fix: for exchange and call clips, recompute the key with `cache_key_for(text, name, style, language)` and no delivery, then dedupe on that key. Add a test with a tagged exchange line.
2. **V6 drops an office-life clip whose key a person-chat line already holds** (`tts_office_lines.rb:67`, the extractor's global `seen`). The merge gate's "0 uncached office-life clips" cannot see such a clip. Fix: run the office-life filter over its own dedupe, or list these clips with a "shared with person-chat" marker.
3. **V6 matches exchange and call knots by name across every story** (`tts_office_lines.rb:52-63`), so a same-named knot in another NPC's story counts as office life. Fix: key `office_knots` on story path and knot.
4. **V6 tests do not prove the task.** `tts_office_lines_test.rb:67-73` (the fourth test) only asserts `all.size > texts.size`. Nothing runs the rake task, its `STRICT=1` exit code or the usage abort, or shows that it works with `GEMINI_API_KEY` unset. Fix: assert the exact person-chat texts left out, and add a task test that runs it keyless, without STRICT (exit 0) and with STRICT (exit 1), on a fixture cache.
5. **V5's "something else writes it" misses some writers** (`validate_office_life.rb:408-429`): the ink tag `#set_variable:name=value` (`chat-helpers.js:647`), action lists `{ type: "set_global", key }` (`apply-actions.js:148`), social-influence effects `{ type: "setGlobal", global }` (`social-influence.js:576`), and stories that commit only compiled `.json`. Each one gives a false V5 **error** on a global that story content also sets. Fix: scan those forms too, and when no `.ink` source exists, scan the compiled JSON for `set_global:`/`set_variable:` strings and for `VAR=`.
6. **V5 does not follow office-life globals more than one step** (`:396-400`). If a mapping on `global_variable_changed:<office global>` sets `y`, and a required task waits on `y`, nothing is reported. Fix: repeat the office-global collection until it stops changing, treating mappings triggered by office globals like office-life events.
7. **V2's `patrolOverride` exemption is wide** (`:313-315`, flagged by the builder). Any mapping with a `targetTile` exempts the NPC, even one that walks it somewhere else, or one keyed on an office-life event itself. Fix: exempt only when the tile is in the NPC's home room and the mapping's event is not office life. The plan's "precedes the beat" can stay a stage 4 check.
8. **V2 counts only affordance needs as reasons to leave the room** (`:302-311`). A print fetch from a producer in another room (`habits.print`, or a `needs.print` mapping), a magnet or `interests` pull, and a visit can also take a story NPC away. Fix: add the producer room for print habits and mappings, and magnet rooms, to `away_need_rooms`.
9. **V4 does not list held items, and exempts on a field the engine ignores** (`:234-236`, `:354-366`). Plan 6.10 expects Gary's info line to list "his held keycard and lanyard" (the KO drops), but only `globalVarOnKO` and `taskOnKO` are printed. NPC-level `disableAttacks` exempts the NPC, yet `player-combat.js:17` reads only the scenario's flag, so an author who sets it on one NPC silences V4 while that NPC can still be attacked. Fix: print `itemsHeld` ids, and drop the NPC-level check (or warn that it has no effect). `koImmune` is right to exempt: the punch passes over (`player-combat.js:437`).
10. **V1 hint accuracy** (`:238-247`, `:276`). Phone NPCs (m01 `agent_0x99`) show `attackable`. A patrol defined only by `waypoints` (the engine enables it, `npc-behavior.js:307`) does not show `patrol`. `exchanges=` counts only the initiator's entries (`test_needs_sims` tom shows 0 but speaks in one). `task` fires for any held mapping with `completeTask`, so `test_needs_sims` amara, who holds the observer mappings, shows `task` with no task knot. Fix: skip `attackable` for `npcType: "phone"`, treat `waypoints` as a patrol, count exchanges where the NPC is `with` as well, and split `task` into ink and mapping.
11. **V3 misses wildcard patterns** (`:345`): `npc_arrived:*` also fires on needs arrivals (the needs system itself listens on it, `npc-needs.js:5398`). Fix: warn on `npc_arrived:*` when any NPC has needs.
12. **V8's onceOnly row counts only mappings on office-life events** (`:589`). Plan 6.2's own Gary print mapping is `onceOnly` on `conversation_closed:gary_whitlock`, so it would not be counted. Fix: also count `onceOnly` mappings that carry an office-life action (`needs`, a print, a `patrolOverride`, a `desk_phone_ring` emit). Or report the row as a delta against the stage 0 V8 line, which is what "new" means in section 7.
13. **The corpus pin for the labs proves only the scope gate** (`test/js/validator-office-life.test.mjs:241-245`). It passes a non-campaign `scenario_id`, so V2, V4 and V5 never run, and the test would still pass if the rules were deleted. Fix: keep it, and add a forced `campaign: true` pin on `lab_physical_pentest` that expects the 3 V5 errors listed above. That proves V5 on real data, including the global-chain case.
14. **V9's determinism test draws no random value** (`test/js/lock-key-diff.test.mjs:18-31`): the fixture is plain JSON, so `StableBinding` is not exercised (m08 passes in practice). A template that calls `rand` or `SecureRandom` directly would still give unstable hashes (`lock_key_diff.rb:45-52` fixes only the three binding values). Fix: put `<%= random_pin %>` in the fixture's PIN, and call `srand` with a fixed seed around `render`. Alternatively, render twice and stop on a mismatch.

## Approximations the builder flagged

- V5 critical-path locks: tighten as M4 says. The required-task case is provable.
- V2 `patrolOverride`: acceptable as a warning, tightened as minor 7. Reading `#complete_task` anywhere in the story is acceptable: it can only add warnings.
- V4 `koImmune`: correct (`player-combat.js:437`). The NPC-level `disableAttacks` added alongside it is not (minor 9).

## Checks that passed

- The match rule, exclusions and ignore list follow the plan, and the events test does collect from the engine (it asserts the collector sees helper arguments and templates, and fails on phantom entries).
- V5 errors exit 1 through the normal error count. They run only for m01 to m10 or with `--campaign`, which only the spawned validator parses.
- V9's exit codes are 0, 1, 2 and 64 as documented, and the graph-staleness refusal works with `--graph-json`. Without the option it regenerates the graph, and the output is stable. Baselines hold requirement hashes and flag references, never PINs or flag values.
- V6 needs no key and makes no network calls (`cache_key_for` is pure, and `TtsService.new` only notes the missing key). It writes nothing and reads only the mission record from the dev database.
