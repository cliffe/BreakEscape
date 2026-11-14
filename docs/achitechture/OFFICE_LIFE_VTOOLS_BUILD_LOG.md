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
| V9 | `scripts/lock_key_diff.rb` | report tool | `test/js/lock-key-diff.test.mjs` (6) |

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
