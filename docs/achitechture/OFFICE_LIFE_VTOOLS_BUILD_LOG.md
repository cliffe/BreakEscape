# Office-life validator tools V1 to V9: build log

Branch `build/ol-vtools`, from main 896ec3cd8 (format step 5 merged, so one `BreakEscape::ScenarioBinding`). Spec: OFFICE_LIFE_MISSIONS_PLAN.md section 4 (the V table, V5's event entries, the campaign-only scope), section 7 (V8) and section 10 (V6), read from c3f2878e9.

## What was built

| Id | Where | Kind | Tests |
|---|---|---|---|
| V1 | `ValidateOfficeLife.office_summary`, `--office-summary` in `validate_scenario.rb` | info section `OFFICE-LIFE SUMMARY (V1)` | `test/js/validator-office-life.test.mjs` (2) |
| V2 | `check_story_npcs_leave` | warning, campaign only | same file (2) |
| V3 | `check_npc_arrived` | warning, every scenario | same file (1) |
| V4 | `check_attackable_needs`, `E1_PROBE_PASSED = false` | warning, info once E1 passes; campaign only | same file (1) |
| V5 | `check_office_life_triggers`, `OFFICE_LIFE_EVENT_PREFIXES` / `_EXCLUSIONS` / `_IGNORE` | error, campaign only | same file (5, spawned with `--campaign`), `test/js/validator-office-life-events.test.mjs` (3) |
| V6 | `BreakEscape::TtsOfficeLines` (`app/services/break_escape/tts_office_lines.rb`), rake `app:break_escape:tts:office_lines[<mission>]` | report task, read only, keyless | `test/unit/break_escape/tts_office_lines_test.rb` (4) |
| V7 | `check_chatter_repeats` | warning, every scenario | same node file (2) |
| V8 | `sync_budget`, `sync_budget_lines`, `check_sync_budget` | info line `ℹ Office-life sync budget (V8)`, warning above a cap | same node file (1) |
| V9 | `scripts/lock_key_diff.rb` | report tool | `test/js/lock-key-diff.test.mjs` (24 after R3) |

Corpus pins (node file): the campaign constant is m01 to m10; V5 gives 0 errors on each; V2, V4 and V5 say nothing on `lab_physical_pentest`, `lab_social_engineering`, `test_needs_sims`, `test_access_work` and `test_access_social`. `README_scenario_design.md` has an "Office-life tools (V1 to V9)" section.

## Decisions and approximations

- **Campaign scope.** `CAMPAIGN_MISSIONS` lists m01 to m10. `validate_scenario.rb --campaign` sets `options[:campaign]`, and `run_validation` passes it and the scenario directory name to `ValidateOfficeLife.check(json, scenario_id:, campaign:)`. V5's positive fixtures spawn the validator with `--campaign`; the corpus pins call `check` with the real scenario id, so they need no flag.
- **V5 event lists.** Taken from the plan's entries, then checked by the fixture test against every literal under `public/break_escape/js/` with an office-life stem. Every literal was already classified and every entry matched at least one literal, so no entry was added or dropped. The match rule is the plan's: an entry ending `_` is a prefix, any other is the name alone or before `:`; exclusions are checked first, so `npc_used_object` and `npc_arrived` never count.
- **V5 globals.** A global counts as office life when office life writes it (workaround and `onUse` `setGlobal`s, `heard_<knot>` for exchanges and `phoneCalls`, `<magnet>_servings`, `<pc>_screen_locked/_owner_away/_accessed` for owned workstations, `revealOnGlobal` of slots and left-behind items, and any `setGlobal` on a mapping whose event is office life) and nothing else does: any other `setGlobal` in the scenario, or an ink `#set_global:` or `~ name =` in a story the scenario's NPCs load, removes it. A mapping is office-life triggered by its event, by `global_variable_changed:<g>`, or by a `globalVars.<g>` in its condition.
- **V5 "required lock".** The validator cannot tell a critical-path lock from an optional one (V9 can, from the graph), so an `unlockDoor` / `unlockObject` mapping on an office-life trigger is a warning, not an error. Required tasks are those not `optional` in aims not `optional`.
- **V2.** "Out of its own room" means: an object in another room satisfies one of its needs, the NPC may use it (`ValidateNpcNeeds.use_rule`), and the room is reachable under its leash (`leash_reach`). The knot test reads the NPC's ink source for `#complete_task:<required task>` anywhere in the story, not per knot. Any `patrolOverride.targetTile` mapping on the NPC exempts it; V2 does not check that the tile is the post, or that the mapping fires before the beat. Key or card source: an `itemsHeld` entry of type key, keycard, id_badge, rfid_card or access_card, or with `key_id`, `keyPins` or `rfid_data`.
- **V4.** `koImmune: true` exempts an NPC as well as `disableAttacks`. When the E1 probe passes, set `E1_PROBE_PASSED = true` and the line becomes `ℹ office life V4: ...`.
- **V7.** Lines compare after lower-casing and dropping punctuation. Barks are every `bark`/`barks` string in the scenario. The opener is the first spoken line of the knot named by `currentKnot` (else `start`) in the `.ink` beside the story's `.json`, with a `Name:` prefix and trailing tags stripped.
- **V8.** Counts per section 7 row: workstation globals (3 per owned workstation), frustration (NPCs with a work list), workaround slots, workaround and `onUse` globals, `heard_` globals, magnet servings and dropped magnet items (one per magnet object), reveal and left-behind globals, Friendface posts (`AccessWork.feed_posts`), `onceOnly` mappings on office-life events, office-life items (takeable slot, left-behind and magnet objects). "Small keys" sums the key rows against 64. The info line prints only when some row is non-zero.
- **V6.** Uses `TtsLineExtractor` with `chatter: true` and keeps entries whose path is a chatter pool or whose knot is an `exchanges[].knot` or `phoneCalls[].knot`. Entries are already unique by cache key, so shared pool lines count once per voice. A line whose key a person-chat line already holds is listed under that line by the extractor and so not here. The style prompt shows as a short hash in the voice label. `STRICT=1` exits 1 on any uncached clip, for the merge gate. It renders through `TtsLineExtractor.render_scenario` (the server's path), reading the dev database for the mission record only.
- **V9.** Renders through `BreakEscape::ScenarioBinding` via a subclass that fixes `random_password`, `random_pin` and `random_code`, so two renders hash alike; the interim tool's private binding copy is gone. Taken from the interim tool: requirement hashes (never secrets), array members keyed by id, the stale-graph refusal, the sectioned text diff. Added: it runs `generate_dungeon_graph.rb` itself (the graph files beside the scenario are rewritten, as a normal validator run does), `--graph-json` for fixtures, a format number in the baseline, an id-to-room placement map, and the rule-2 flag: a new lock node, or a new `gate`/`access`/`wearable`, whose far side (downstream over the graph's edges, or the gate's own room) holds a required task's room, target object or target NPC, or a non-optional lock. Exit 0 no change, 1 changes, 2 rule-2 flag, 64 usage or input error. The fixture test pins `nodes[].id/kind/optional` and `edges[].from/to/soft`, both on a hand-written graph and on the generator's own output. `tools/office_life/lock_key_baseline.rb` on build/ol-m02 can retire once m02 re-baselines with V9 (its baselines are a different format).

## How V10 merges in

V10 (build/ol-sims, SIMS-5) is `scripts/validate_office_life.rb` with `module ValidateOfficeLife`, `VN = ValidateNpcNeeds`, a `check(json)` entry point and the call `run.call('ValidateOfficeLife') { ValidateOfficeLife.check(json_data) }` in `validate_scenario.rb`. This branch has the same module, the same `VN` alias and `require_relative 'validate_npc_needs'`, and the same `run.call` name at the same place. Expect two textual conflicts, each resolved by keeping both sides:

1. `scripts/validate_office_life.rb`: both branches add the file. Take this branch's file, then paste V10's constants (`GRUMBLE_TOPICS`, `PHONE_TOPICS`, `NEEDS_JS`, `known_engine_topics`, `work_failure_topic?`), its `Ctx`, `build_context`, `home_room_of`, `ring_targets`, compatibility helpers and `check_pools` / `check_exchanges` / `check_phone_calls` below the V8 section. In `check`, at the marked "V10 slot", call `ctx = build_context(json, w.objs, w.npcs)` and the three V10 checks with `w.json, w.npcs, ctx, issues`. `World.build` collects `objs` and `npcs` exactly as V10's `check` does (rooms' objects, NPC `itemsHeld`, start inventory, then `expand_presets`), so V10 needs no other change. Update the header comment to drop "This file holds V10 only".
2. `scripts/validate_scenario.rb`: V10's one-line `run.call` against this branch's three-line block with `scenario_id:` and `campaign:`. Keep this branch's block. The `require_relative 'validate_office_life'` line is identical on both sides and merges cleanly.

V10's own test (`test/js/validator-office-life-v10.test.mjs`) calls `ValidateOfficeLife.check(json)` with no keywords, which this signature still accepts.

## Corpus run

Every `scenarios/*/scenario.json.erb` (179) was validated with `--no-graph --skip-ink --no-lint` before and after (after with `--office-summary`). Exit codes and `❌` counts are identical for every scenario: the new rules add no errors, and nothing printed `could not run`.

New warnings, per scenario. None of m01 to m10 has any (none has a needs NPC yet, and V3 and V7 found nothing), so each campaign mission's stage 0 baseline starts at zero office-life warnings.

| Scenario | New warnings |
|---|---|
| m01 to m10 | none |
| `lab_physical_pentest` | V8: office-life onceOnly mappings 12 (cap 10) |
| `test_access_work` | V8: frustration 14 (cap 6); workaround slots 7 (cap 4); office-life onceOnly mappings 22 (cap 10) |
| `test_access_social` | V8: frustration 9 (cap 6); workaround slots 5 (cap 4); Friendface posts 34 (cap 10); office-life onceOnly mappings 27 (cap 10) |
| `test_needs_sims` | V8: reveal and left-behind globals 8 (cap 6); office-life onceOnly mappings 48 (cap 10) |
| every other scenario | none |

The caps are per campaign mission; the test scenarios exist to exercise many slots at once, so their V8 warnings are expected.

V8 info lines printed (scenarios that write office-life state): `test_clone_left_card`, `test_capture_log`, `test_access_social`, `test_needs_sims`, `test_access_habits`, `lab_physical_pentest`, `test_npc_needs`, `test_access_work`, `test_access_sessions`. No campaign mission prints one yet.

V1 NPC counts for the stage 0 summaries: m01 7, m02 17, m03 10, m04 12, m05 12, m06 11, m07 8, m08 12, m09 21, m10 75.

## Suites

On f9dcfa4d7: `bin/test-js -j 3` 656 files passed, 0 failed; `bin/rails test` 2747 runs, 0 failures, 0 errors, 1 skip.

## R1 outcomes

Review: `OFFICE_LIFE_VTOOLS_REVIEW_R1.md` (REVISE, 4 majors, 14 minors). Main e1303fc0c (format step 6a-1 part 1) merged first with no conflicts; the validator node tests passed on the merge before any fix.

### Majors

- **M1 fixed.** `hostile` only for `behavior.hostile.startHostile: true` (a bare `hostile: true` still counts); a tuning block alone gives the new `fights` hint. The V1 fixture now has the real shape, and a new test uses m01's receptionist shape (tuning only: `fights`, no `hostile`).
- **M2 fixed.** Door entries are keyed by `connectedRoom` (`doors[secure_area]`), so adding a door no longer re-keys the others. Each gate records what it sits on. A door gate starts at `door_<connectedRoom>` (else the room) and guards that room; a room gate starts at `door_<room>`; an object gate starts at `lock_<id>` (the generator's id form), else the object's own node, and also flags when a required task names the object or the object is a lock. Its own room no longer counts. On a scratch copy of `lab_physical_pentest`: `access` on `coffee_station` now exits 1 (was 2); a baseline with the secure_area door's `gate` removed, diffed against the real file, exits 2 with `new gate at /rooms/open_plan/doors[secure_area] guards room 'secure_area' (required content), critical-path lock 'door_P4', ...`. Fixture tests cover the non-lock object (exit 1), a door gate from an empty room into a required room (exit 2, and an earlier door does not re-key), a gate on a required task's item, and an object gate on a lock that reaches through `lock_<id>`.
- **M3 fixed.** The snapshot holds `requiredContent`: `[room, why, id]` for every required task's `targetRoom`, `targetObject`, `targetNPC`, `targetItemIds` and `targetItems` (by type); the room of each NPC whose story (the `.ink`, else the compiled JSON) has `#complete_task:<id>`; the room of the object, NPC or room a completing mapping's eventPattern names (else of the holding NPC); and, beyond the review, every flag station and VM launcher for `submit_flags` tasks. Every required task in m03 (17), m08 (14) and m10 (20) now has a room. Tests: an m08-shaped `custom` task set by an NPC's ink, the same task completed by a `conversation_closed` mapping, a `submit_flags` task, and an optional room that stays exit 1.
- **M4 fixed.** An `unlockObject`/`unlockDoor` on an office-life trigger whose target is the `targetObject`/`targetRoom` of a required `unlock_object`/`unlock_room` task is `❌ ERROR` naming the task. Object and room targets are kept apart, so an object id equal to a room task's room is still a warning. Other locks stay a warning; raising non-optional graph locks to errors when the graph is generated was not done (V5 usually runs with `--no-graph`, and V9 already flags them on the diff).

### Minors

1. **Fixed.** V6 no longer uses the extractor's keys for exchange and call lines. `TtsLineExtractor#each_host_story_line` (new, public) yields every host line before the batch's dedupe, and V6 keys each line with `cache_key_for(text, name, style, language)`, no delivery, then dedupes itself. Test: a `#delivery:whispering` exchange line keys without it, and only an MP3 under that key shows cached.
2. **Fixed (listed, marked).** A clip whose key a person-chat line also holds is listed with `shared` (the task prints `shared with person-chat`). Test: a start line that repeats a chatter line.
3. **Fixed.** Office knots are keyed on `[storyPath of the NPC holding the entry, knot]`. Test: a same-named knot in another NPC's story is left out.
4. **Fixed.** The test asserts the exact person-chat texts left out and the exact office-life texts kept. New task tests run `bin/rails "app:break_escape:tts:office_lines[test_needs_sims]"` in a subprocess with `GEMINI_API_KEY` unset and `TTS_CACHE_DIR` (new, for tests) on a fixture cache: exit 0 without STRICT, 1 with STRICT while uncached, 0 with STRICT once every key is cached, and the usage abort (exit 1). Fixture stories: `test/fixtures/files/tts_office_lines/{amara,sam}.ink` and their compiled JSON.
5. **Fixed.** Other writers now include `#set_variable:` tags, `{ type: "set_global", key }` actions, `{ type: "setGlobal", global }` influence effects, and `"VAR=": "<name>"` in a story's compiled JSON when no `.ink` is beside it. Tests for each.
6. **Fixed.** Office-life globals are followed to a fixed point: a mapping triggered by an office-life global is office life, the globals it sets join the set, and it stops counting as another writer. Test: workaround global, then a `global_variable_changed` mapping setting `step2`, then a required task on `step2` (error); a story-event writer of `step2` clears it.
7. **Fixed.** A `patrolOverride` exempts only when the NPC starts in its home room (the tile is resolved in the room the NPC is in when the mapping fires, `npc-manager.js`) and the mapping's event is not office life. Tests for both.
8. **Fixed in part.** Away rooms now include print fetches (the output tray of an `onUse` `revealOutput` producer or a `needs.print` mapping's producer), `interests` items (`needsTag`), and any reachable room when a droppable magnet satisfies one of the NPC's needs. Each room shows why (`kitchen (print fetch)`). Visits are not covered: the readers expose no static visit target to check against.
9. **Fixed.** V4 lists held item ids, and the NPC-level `disableAttacks` no longer exempts; when set, the line says it has no effect.
10. **Fixed.** No `attackable` on phone NPCs; `patrol` for enabled, `waypoints` or `bounds` (`npc-behavior.js`); `exchanges=` counts exchanges others start `with` the NPC; `task` (ink) and `task-mapping` (held mapping) are separate hints.
11. **Fixed.** `npc_arrived:*` warns when any NPC has needs.
12. **Fixed (first option).** The onceOnly row also counts mappings with an office-life action, whatever the trigger: `needs` (a print command included), `patrolOverride`, or an `emitEvent` that is an office-life event.
13. **Fixed.** New pin: `lab_physical_pentest` forced to `campaign: true` gives exactly its 3 real V5 errors (`grab_creds` through `kp_creds_captured`, `drop_usb`, `usb_foothold`), so deleting V5 fails it. The scope-gate pin stays.
14. **Fixed.** `render` seeds `Kernel#rand` before each of two renders and refuses (exit 64) when they differ, which catches `SecureRandom` in a template. Test: a fixture with `<%= random_pin %>` and `<%= rand(1000..9999) %>` diffs empty three runs in a row; a `SecureRandom.hex` one is refused.

V9's baseline format is now 2 (gate `on`, door keys, `requiredContent`); no format 1 baseline is committed anywhere. On scratch copies of m01, m02, m08 and `lab_physical_pentest`, `--write` then a diff gives "empty", exit 0.

### R1 corpus run

Every `scenarios/*/scenario.json.erb` (179) was validated with `--no-graph --skip-ink --no-lint`, once with main e1303fc0c's `scripts/` and once with this branch. Exit codes and `❌` counts are identical for every scenario, and nothing printed `could not run`. Warnings differ only in `lab_physical_pentest` (+1), `test_access_social` (+4), `test_access_work` (+3) and `test_needs_sims` (+2), the same V8 lines and counts as the R0 table above. No scenario gets a V3 wildcard warning, and no V8 count changed under the wider onceOnly rule.

### R1 suites

On 885f740d0: `bin/test-js -j 3` 657 files passed, 0 failed; `bin/rails test` 2763 runs, 0 failures, 0 errors, 2 skips (1 before; this round adds no skip, so the second most likely arrived with the main merge, not checked).

## R2 outcomes

Review: `OFFICE_LIFE_VTOOLS_REVIEW_R2.md` (REVISE, 0 blockers, 2 majors, 5 minors). Each finding was reproduced before the fix and none is withdrawn; the review's Outcomes section gives file:line for each.

- **M1 fixed.** A new lock node, or a lock put on or switched on with no new node, is now checked against the locked object itself as well as what lies downstream. On a scratch copy of m04, a key lock on `flag_station_dropsite` and one on `analog_thermometer` both exit 2 (both exited 1 at R1).
- **M2 fixed.** Required content now also comes from `{ type: complete_task }` actions in any object, NPC or room action list, from `targetItemIds` matched on id, name, `opens_lock` or `key_id`, and from `targetGroup` on `collection_group`. Required tasks with a room, per mission: m01 26/26 (24 at R1), m02 26/26, m03 17/17, m04 12/12 (10 at R1), m05 22/22, m06 20/20, m07 11/11, m08 14/14, m09 22/22, m10 20/20. A node corpus pin keeps this at no gaps.
- **Flag stations (minor 1) fixed.** Each flag task is tied to the station its `targetFlags` prefix names, any type (m01's `entropy_launch_device` included); a ref whose prefix is a VM name falls back to the objects that list the ref or accept that VM, then to every station. VM launchers are kept as required content, one row each, since every campaign launcher is the shared attack box.
- **V8 (minor 2) fixed.** A `patrolOverride` counts as office life only on an office-life trigger. The R1 sentence "no V8 count changed under the wider onceOnly rule" was wrong: at R1, m02 (`roaming_ward_nurse`) and m09 (`old_coyote`) each printed `office-life onceOnly mappings 1/10`, because that corpus comparison counted warnings and errors and not info lines. Both now count 0, and a corpus pin holds them there.
- **V2 visits (minor 3) fixed.** A `prop_door` workaround's door and its prop's room, and a `borrow_session`'s PC room, are away rooms, resolved through `AW.object_index` as `validate_access_work.rb` does.
- **V2 magnets (minor 4) fixed.** Only a magnet the player can carry (`takeable: true`, `droppable: true`, or in the starting inventory) adds every reachable room; a fixed one adds its own room. A magnet with no `takeable` is fixed too, because the engine picks up only a truthy `takeable`.
- **Tests (minor 5).** New: 4 V9 cases (new lock on a station and on a `targetObject`, the three completion routes, station attribution, the m01 to m10 placement pin) and 4 V1 to V8 cases (fixed magnet, workaround visits, story `patrolOverride`, the m02 and m09 pin).

V9's baseline format stays 2: the snapshot fields are unchanged, only the rows `requiredContent` holds. Launcher rows now read `VM launcher (flag tasks)` instead of one row per flag task, so the m01 to m10 row counts drop (m10 56 to 35) while the rooms they cover rise or hold (m01 7 to 8).

### R2 corpus run

Every `scenarios/*/scenario.json.erb` (179) was validated with `--no-graph --skip-ink --no-lint`, once with main 32516127c's `scripts/` and `lib/` and once with this branch. Exit codes are identical for every scenario, `❌` counts are identical, and nothing printed `could not run`. (Six scenarios first showed exit 1 on main, from the scratch copy's absolute paths missing `validator_known_failures.json`; rerun with repo-relative paths, all six exit 0.) Warnings differ only in `lab_physical_pentest` (+1), `test_access_social` (+4), `test_access_work` (+3) and `test_needs_sims` (+2), the same V8 lines and counts as at R1. m01 to m10: exit 0, no office-life warning or error, and no V8 info line (m02 and m09 included). V8 info lines print for the same nine lab and test scenarios as at R0.

V9 on scratch copies of m01 to m10: `--write` then a diff gives "empty", exit 0, for all ten.

### R2 suites

On aa4cc5844: `bin/test-js -j 3` 657 files passed, 0 failed; `test/unit/break_escape/tts_office_lines_test.rb` (keyless) 9 runs, 0 failures, 0 skips. The full Rails suite was not run this round: no Rails code changed.

## R3 outcomes

Review: `OFFICE_LIFE_VTOOLS_REVIEW_R3.md` (REVISE, 0 blockers, 1 major, 7 minors). Each finding was reproduced first; none is withdrawn. The review's Outcomes section gives the detail.

- **M1 fixed.** V9 works out what a new locked room, door or gate cuts off from the scenario's own connections and doors (both directions, locks ignored), not from the graph's room edges, which the generator drops into and out of locked rooms. The required-content rooms and critical-path-lock rooms reachable from the start room before but not after the room (or door) is removed are named. m01 `hallway_east`, m01 `hallway_west` and a m05 locked annex between the lobby and the corridor went from exit 1 to exit 2.
- **Decision (minor 3).** Removing or switching off a critical-path lock is a bypass: `RULE 2: critical-path lock '<node>' removed or switched off`, exit 2. V9's exit 2 now covers a new door or gate guarding required content and a critical-path lock removed. m09 `plan_cabinet` switched off exits 2. The V9 header comment is updated; the README section still says exit 2 is for new doors and gates only.
- **Minors fixed.** 1: a `prop_door` NPC walks to the prop only, `share_login` adds the colleague's room. 2: id-less objects are keyed by `type|name` (then position), so an inserted plant gives an empty diff. 4: `completesTask` and `completesTaskOnOpen` are read, and `<vm>:flag_N` names the lock requiring it, not every acceptor. 5: a global-triggered mapping uses the rooms that set the global, and falls back to the holder's room only when nothing in the scenario sets it (engine-set globals in m02). 6: fixed magnets no longer count in V8. 7: `lock_on?` needs `locked: true`.
- **Tests.** V9 15 to 24 cases, V1 to V8 31 to 32 (the V2 prop_door test changed, one V8 case added).

### R3 corpus run

Every scenario with a `scenario.json.erb` or `scenario.json` (180) was validated with `--no-graph --skip-ink --no-lint`, once with the R2 tip's `scripts/` and once with this branch (main eae23283d merged in). Exit code, error and warning counts and V-line counts are identical for all 180 (`test_author_notes` is a `scenario.json` with no template and exits 1 in both runs). m01 to m10: exit 0, no office-life line. V9 self-diff (`--write` then a diff) on m01 to m10: empty, exit 0, for all ten. Required-content placement: every required task of m01 to m10 has a room (the node pin passes). Reviewer mutations on scratch copies: m01 `hallway_east` and `hallway_west` and m05 locked annex exit 2, m05 unlocked annex exit 1, m01 inserted plant exit 0, m09 `plan_cabinet` off exit 2.
