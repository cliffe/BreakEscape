# Scenario format hardening plan

Status: **Draft**. Date: 2026-11-12. Written on `build/schema-review` (tip 8a9215b5b, based on main 6a834437c). Code references are to main at 13a0f9f96 unless they say otherwise; main has moved on by 21 commits (the owner claim, q78) and the line numbers below were checked there.

Sources: `docs/achitechture/SCENARIO_FORMAT_REVIEW_STRUCTURE.md` and `docs/achitechture/SCENARIO_FORMAT_REVIEW_ACCESS.md`. Every claim the plan builds on was checked in the code; where a review was wrong or incomplete, this plan says what the code does.

## 1. What this plan does

It hardens the scenario JSON format without changing any scenario's design. Seven steps, in order of value for cost:

| # | Step | Touches | Scenario edits | Size |
|---|---|---|---|---|
| 1 | Validator exit code matches its output | validator | 58 true errors fixed first (section 3) | M |
| 2 | Strict keys for the access, network and office-life blocks | schema, validator | none expected | S |
| 3 | Secret-leak check | validator | 1 needs a user decision (m08) | S |
| 4 | Reference and id checks driven by schema annotations | schema, validator | 5 scenarios, as warnings | M |
| 5 | One `ScenarioBinding` in `lib/`, and a JSON-safe ERB helper | lib, model, validator | none | S |
| 6 | Secrecy as a schema property; one client serialiser | schema, lib, model, controller | none | L |
| 7 | `formatVersion` and a load-time upgrader | lib, model, controller, validator | none | M |

Out of scope: the five format migrations that wait for the user's answers (one owner field, one outage field and grammar, habits in one block, closing the core kinds, dropping dead fields). Section 7 sketches each so the user can choose.

## 2. Rules every step follows

- **Cheat policy.** The server hard-enforces secrets, keys and forged items; ink-gated steps and tailgating stay best effort with an NPC sanity check. A secret is any value that, read from the browser, lets a player skip a lock: a PIN, password, combination, cryptex word, flag answer, account password, Wi-Fi key, capture secret or a declared grant's contents. Steps 3 and 6 exist to keep every one of these on the server until it is earned.
- **Sync size rule (q77).** player_state and any per-game record the client re-sends must change by delta or stay bounded. Steps 1 to 6 add nothing to player_state and no new sync traffic. Step 7 rewrites a stored `scenario_data` at most once per game per format version, on the server, and never sends it back and forth. Each step's section states its effect.
- **Tests.** Every step ships with node tests for validator behaviour (`test/js/validator-*.test.mjs`, the `check_*` function called through `ruby -e`, as `test/js/validator-pin-locks.test.mjs` does) and fixtures, Rails tests for any server change, and a corpus run of the validator over all 176 scenarios with the before and after counts in the build log. Builders run every test file their change touches plus every file that imports a changed module, without the shared lock; the orchestrator runs the full suites once per merge batch.
- **Merge-batch validator rule.** Each merge batch runs the validator (`--no-graph`) on every test scenario a merged branch touched and needs 0 `❌` before main moves. After step 1 this is the exit code.
- **Live proof** for every engine change (steps 6 and 7): a keyless server on the builder's own port, a browser run through the real routes, and `tools/playtest/verify-run.rb` showing progress on the server. Helper tests alone do not count.
- **No new gems or npm packages.** The validator already has `json-schema`; the server needs nothing new.

## 3. Triage of the 62 error lines

Re-run on 2026-11-12 over all 176 scenarios (`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph --skip-ink --no-lint`). The review's count holds: 62 `❌` lines in 16 scenarios, all with exit 0. Separately, 6 scenarios exit 1 on schema errors, which print `✗` and are not among the 62.

### 3.1 The 62 lines

| Scenario | Lines | Message | Verdict | Who fixes |
|---|---|---|---|---|
| test_complex_multidirection | 10 | key lock or key item without `keyPins` | true error | this build (test fixture) |
| test_multiple_connections | 8 | same | true error | this build |
| test_mixed_room_sizes | 6 | same | true error | this build |
| test_vertical_layout | 4 | same | true error | this build |
| test_horizontal_layout | 4 | same | true error | this build |
| test_behind_wall_fade | 1 | same | true error | this build |
| crypto1_captain_meow | 1 | same | true error | escape-room content owner |
| crypto2_rsa_asymmetric | 2 | same | true error | escape-room content owner |
| crypto3_aes_symmetric | 2 | same | true error | escape-room content owner |
| biometric_breach | 5 | same | true error | escape-room content owner |
| ceo_exfil | 10 | phone NPC eventMapping uses `targetKnot`, which is ignored once a storyState is saved | true error | escape-room content owner (ink change) |
| lab_malware_metasploit | 1 | `npc_conversation` task whose `#complete_task` tag is not in the instructor ink | true error | labs track |
| test-rfid-multiprotocol | 2 | NPC `spriteSheet` `hacker-green` and `hacker-yellow` do not exist | true error | this build |
| test_access_social | 2 | Kim has a feed but no Friendface phone; object id `sign_f14` used twice | true error | already fixed on `build/c3-replies` |
| sis02_energy | 3 | `minigameData` fields `nextTabPrompt`, `nextTabButton`, `completeBanner` undeclared for `log_filter_terminal` | **false positive** | this build (schema file) |
| sis01_healthcare | 1 | `interactionWarning` must be an object | **false positive** | this build (validator) |

58 true errors, 4 false positives. No line is in m01 to m10.

Notes on the verdicts:

- **keyPins (43 lines).** The README makes `keyPins` required on key locks and key items (README_scenario_design.md:635, 1244). The client tolerates its absence: `generatePinHeightsForLock` in `public/break_escape/js/systems/key-lock-system.js:169` seeds pins from the room and key ids, and the bootstrap comment at app/models/break_escape/game.rb:1108-1109 says lockpicking then "uses random pins". Whether a key cut from the generated mapping always fits the lockpicking minigame's own pins has not been proven, so the rule stays an error and the fix is to add a `keyPins` array to each lock and its key (the same array on both). It is a one-line edit per lock and changes nothing a player can see.
- **ceo_exfil (10).** The validator's rule matches the engine: a phone NPC's saved story state wins over `targetKnot` on reopen (README_scenario_design.md:52 lists it as a known pitfall). The fix is a design edit: each mapping sets a global and the ink hub gets a conditional option for it, with a `sendTimedMessage` to tell the player. Ten mappings on one NPC.
- **lab_malware_metasploit (1).** `objectives[0].tasks[0]` targets `malware_specialist` and waits for `#complete_task:complete_instruction_task`; neither `instructor.ink` nor `instructor.json` has the tag, so the aim can never complete. The fix is one tag at the end of the instruction knot, or a task type that does not need it.
- **test-rfid-multiprotocol (2).** Only `hacker` and `hacker-red` are loaded (`public/break_escape/js/core/game.js:1446-1451`). Swap the two guards to existing sheets.
- **test_access_social (2).** On `build/c3-replies` Kim holds a phone with `phoneOf: "kim"` and `sign_f14` appears once. Both lines clear when C3 merges.
- **sis02_energy (3), false positive.** `public/break_escape/js/minigames/log-filter/log-filter-minigame.js:16-18` and 195-197 document and read all three fields; `scripts/minigame-data-schemas.json` (`log_filter_terminal`, line 63) omits them. Add them to its `optional` list.
- **sis01_healthcare (1), false positive.** The object-level `interactionWarning` (`public/break_escape/js/systems/interactions.js:720`) is an object, but the EHR minigame's medication rows have their own string field of the same name (`public/break_escape/js/minigames/ehr-terminal/ehr-terminal-minigame.js:197`). The validator's walk (scripts/validate_scenario.rb:2495-2503) descends into `minigameData`. Stop the walk at `minigameData`.

Owners named above: **escape-room content owner** for ceo_exfil, biometric_breach and crypto1 to crypto3 (the `escape_room` collection, last edited September and October); **labs track** for lab_malware_metasploit; **C3 builder** for test_access_social. The orchestrator confirms with each owner before anyone edits their files. The `keyPins` edits are mechanical enough for this build to prepare as a patch the owner approves; the ceo_exfil and lab changes are content and stay with their owners.

### 3.2 The 6 schema failures

These already exit 1, so the switch does not change them, but step 1 prints every section after a schema failure and they will then show further lines that are hidden today. Step 1 re-triages them.

| Scenario | Schema error | Proposed fix | Who |
|---|---|---|---|
| test_desk_seating | room `type` `room_test_desk_seating` not in the 145-entry enum (the map file exists) | add the map to the enum now; step 4 replaces the enum with a file check | this build |
| test-blockchain-explorer | task `type` `set_global` not in the enum | add it if the objectives code handles it, else change the fixture | this build |
| test_table_items | an object without `name`, and others | fix the fixture | this build |
| test-ble-scanner | top-level `name`, `description` and others | fix the fixture | this build |
| basic_mission, vm_free_mission | top-level `globalItems` and others | these have no `collection` in `mission.json`; ask the user whether to fix or delete them | user |

## 4. The steps

### Step 1. The validator's exit code matches its output

**Why.** `scripts/validate_scenario.rb` exits 1 only for directory, structure, ink-compile, schema and graph-key failures (lines 6701-6816, 6965, 7027, 7038). Every other `❌` is printed and the run ends with `exit 0` ("warnings don't cause failure", line 7051-7053). On a schema failure it exits at line 6965, before the common issues, habits report and work report are printed, so an author meets a second wave of errors after fixing the first. Agents are told to count `❌` lines by hand.

**Change.**
1. Fix the 4 false positives (section 3.1). Fix the fixture errors this build owns (34 lines: the five layout tests, test_behind_wall_fade, test-rfid-multiprotocol) and the four schema-failing fixtures (section 3.2).
2. One label. Every hard finding is `❌ ERROR:`. Today there are `❌ INVALID` (108 sites in validate_scenario.rb), `❌ ERROR` (53 there, 117 in validate_npc_needs.rb) and `❌ SOCIAL` (validate_social.rb). The rename is mechanical; the text after the label stays, so existing tests that match on the message body keep passing. Tests that match on `INVALID` or `SOCIAL` are updated in the same commit.
3. Schema errors print as `❌ ERROR: schema: <json pointer>: <message>`, with the opaque schema id removed and, where the pointer reaches a room, object or NPC, its id or name added.
4. Print every section before deciding the exit code. The schema failure no longer exits early.
5. Count by construction: all output goes through one writer that counts lines starting with `❌`, so a module that prints its own lines (habits, work, social) cannot slip past. The run ends with `Result: <n> errors, <m> warnings` and exits 1 when n > 0.
6. `--strict-social` stays as an accepted flag with no effect, because CI passes it (`.github/workflows/ci.yml:144`).
7. Update the `validate-scenario` skill wording, the README validator section and AGENTS.md ("count every `❌`") to say the exit code is now the answer. Skill wording is proposed to the orchestrator, not edited by the builder.

**When it lands.** After every true error in section 3.1 is fixed or its owner has agreed a date, and after `build/c3-replies` merges. CI's social job runs the validator with `set -euo pipefail` over social scenarios; test_access_social fails it until C3 is in. If an owner cannot fix in time, the user chooses between waiting and landing with that scenario listed as known failing in the build log.

**Tests.** Node: a fixture with one `❌` line from each module exits 1; a fixture with only warnings exits 0; a schema failure plus a common issue prints both and exits 1; the summary line counts correctly; the four false-positive shapes (sis01 medication warning, sis02 fields) pass. Corpus: before and after counts per scenario in the build log; after the fixes, every scenario that printed `❌` either prints none or exits 1, and no scenario that exited 0 with no `❌` changes.

**Sync.** No runtime change.

### Step 2. Strict keys for the access, network and office-life blocks

**Why.** These blocks are open in the schema and the validator's unknown-field pass does not walk them. A misspelt key is silent, and some slips change play: `wifi: { "PSK": ... }` leaves `psk` missing, which means an open network by design; `"downif"` on a resource means the outage never happens; `"autoLockMins"` drops an instant lock. Checked on main: `networks.*` and `networks.*.wifi` (properties `name`, `downIf`, `wifi`; `ssid`, `psk`), `resources.*` and `policies.*` set no `additionalProperties`, and the schema is run with `strict: false` (validate_scenario.rb:223). No main mission uses these blocks, so closing them now costs nothing.

**Change.**
1. In `scripts/scenario-schema.json`, set `additionalProperties: false` with `patternProperties: { "^_": {} }` (so `_comment` keys still pass) on: the entries of `resources`, `networks`, `networks.*.wifi`, `policies`, `accountProfiles` and `roles`; the access list type (`roles`, `people`) wherever it appears (`access`, `for`); NPC `creds`, `screenHabit`, `printHabit`, `usbHabit`, `habits`, `frustration`, each `workarounds` entry, `feed` and its posts (C3 types the posts); object `affordance`, `portSecurity`; the `grant_foothold` action; each `needs` entry. The builder lists the final set in the build log with each block's schema path.
2. A small validator pass reads the closed blocks from the schema and, for each unknown key, prints `❌ ERROR: <path>: unknown key '<k>'`, adding `did you mean '<known>'?` when one known key matches case-insensitively or within edit distance 2. The schema stays the single definition; the pass only words the message.
3. The hand-kept lists in `check_unknown_fields` (validate_scenario.rb:401-470) stay for the core kinds, which remain open until the "close the core kinds" migration.

**Tests.** Node fixtures for each mutation in the access review's table (`PSK`, `downif`, `autoLockMins`, `lockchance`, `needHome`, affordance `owner`), each an error naming the right key and suggestion; a `_comment` key in each closed block passes. Corpus run: expected 0 new errors (the review found no unknown key in these blocks); any hit in a test scenario is fixed here, any in a mission goes to its owner.

**Sync.** No runtime change.

### Step 3. Secret-leak check

**Why.** Nothing stops an author copying an answer to a place the browser receives at game start. `globalVariables` ships in the bootstrap and in player_state; `minigameData` ships with the room. m08 already does it: `suite_code = "5386"` (scenarios/m08_the_mole/scenario.json.erb:117) is a global so that Netherton's voiced ink can say it, which puts the interrogation-suite PIN in the browser from the start. Separately, the server strips `requires` only when `lockType` is present and is not biometric, bluetooth or rfid (game.rb:4596-4598 and games_controller.rb:1930), so `"locked": true, "requires": "4821"` with no `lockType` ships the PIN.

**Change.** A validator check, `check_secret_leaks`, run on the rendered scenario (so an `@random_pin` copied into a global is caught within the same render).
1. Collect answers: `requires` on rooms, objects, `contents`, `itemsHeld` and `startItemsInInventory` whose `lockType` is pin, password, combination or cryptex (the last two arrive with `build/unlock-gaps`); top-level `flags` values; task `targetFlags`; flag-station `flags`; `creds.password`; `networks.*.wifi.psk`; capture secrets (`usePayload.secret`, `addCapture.secret`, `capture.secret`).
2. Error when an answer equals a `globalVariables` value (string or number compared as text), or equals a leaf string in any `minigameData` or `scenarioData`, or appears as a whole word inside one when the answer is 6 or more characters. The message names both places and points to the decision the author needs (section 6, question 1).
3. `requires` with no `lockType`: error on a room, object or item that is `locked: true`; a warning on an unlocked one ("inert; delete it"). The 15 legacy objects (all unlocked PCs with the literal `"requires": "password"`, in ceo_exfil, crypto1 to crypto4) get the warning, not an error. The check does not look at `requires` inside `social` (it lists facts there, 12 hits in ca01 to ca14) or at objective conditions. Room `doors[]` entries take their lock type from the room; the builder confirms that inheritance in the door code before including them.
4. **Coordinate with `build/usepayload-secret`.** At the time of writing that branch has no commits; its worktree holds an uncommitted change to `strip_capture_secrets!` (strip `secret` from every `capture`, `addCapture` and `usePayload` at any depth, for every NPC) and serves those secrets from `GET /capture_secrets`. Its brief also covers checking `globalVariables` and `minigameData`. Before writing this step, the builder reads `git log main..build/usepayload-secret` and `git show` of each commit. If that branch has landed a globals or minigameData check, this step extends it (more answer kinds, the `requires` rule) instead of adding a second one.

**Corpus effect.** m08 is flagged (one error). It is a main mission, so the error is not fixed in this build: the user decides (section 6, question 1) and the m08 owner implements it. Until then the step lands with m08 as the single known failure, or the check starts as a warning for one batch; the user chooses.

**Tests.** Node fixtures: a PIN copied into a global (string and number), into `minigameData`, a password inside a longer `minigameData` string, a flag answer in a global, a `@random_pin` rendered into both places, `requires` with no `lockType` locked and unlocked, `requires` in `social` (no finding), a clue PIN on a note's `text` (no finding: clues are the game).

**Sync.** No runtime change.

### Step 4. Reference and id checks driven by schema annotations

**Why.** Reference checks exist one field at a time, so new fields arrive unchecked. The structure review's mutation test showed an eventMapping `completeTask` naming a missing task passes with no message, and `completeTask`, `unlockTask` and `unlockAim` are typed `{}`. Id uniqueness is checked only for objects directly in `rooms[*].objects` (scripts/validate_social.rb:144-160); duplicates inside `contents` and `itemsHeld` pass. Spot checks confirm the review: `derek_file` appears twice in m09 and `nightshade_payment` four times in m10.

**Change.**
1. A schema annotation `"x-ref": "<kind>"` on every property that names something: `room`, `npc`, `object`, `item`, `task`, `aim`, `global`, `lock` (a key lock's name), `network`, `resource`, `policy`, `role`. Arrays of references carry it on `items`. Type `completeTask`, `unlockTask`, `unlockAim` and `skipTask` as a string or array of strings with `x-ref`.
2. One shared schema walker in `lib/break_escape/schema_walk.rb` (plain Ruby, no Rails), which visits the data and the matching schema node together, resolving `$ref`, `oneOf` and `anyOf` by the data's shape. Step 6 reuses it.
3. An index of every id by kind: room map keys; room NPCs, top-level `npcs` and `phoneNPCs`; objects at every depth (`objects`, `contents`, `itemsHeld`, `startItemsInInventory`) by `id`; tasks by `taskId`; aims by `aimId`; globals declared in `globalVariables` plus the engine-written patterns (`<npcId>_frustration`, `<objId>_screen_locked`, `<objId>_owner_away`, `<objId>_accessed`, `<jackId>_planted`) listed once in the schema under `x-engineGlobals`; lock names from key locks' `requires`.
4. Resolve every `x-ref` value against the index. Unresolved: `⚠️ WARNING` now. Existing one-off checks that already error (connections, `targetRoom`, `unlockDoor`) keep their level.
5. Uniqueness: an id used twice by objects at any depth is a warning; an NPC id used twice is a warning; the same string used as ids of two kinds that a bare-string field could confuse (a task and a global) is a note in the report.
6. Replace the hard-coded room `type` enum with a check against the room map files, as the validator already does for object sprites (fixes test_desk_seating for good).

**Promotion to errors.** After the 5 scenarios with duplicate ids are fixed: m09_digital_archaeology and m10_full_disclosure (main missions: their owners), lab_tesseract_trials (labs track), npc-hub-demo-ghost-protocol (this build: a demo) and test_access_social (the C3 builder, or this build after C3 merges). The promotion is one commit that flips the level and runs the corpus. The builder checks whether the server's unlock lookup (first hit by id) makes any of these duplicates a live bug and, if it does, reports it to the owner as a bug, not a nit.

**Tests.** Node fixtures for each kind (a missing task in `completeTask`, a missing aim, a missing global in a condition, a missing network on a room), duplicates in `contents` and `itemsHeld`, an engine-written global accepted, and the structure review's whole mutation set re-run as one fixture with every finding expected. Corpus: counts of the new warnings per scenario in the build log.

**Sync.** No runtime change.

### Step 5. One `ScenarioBinding` in `lib/`, and a JSON-safe helper for ERB

**Why.** The ERB binding exists twice: `BreakEscape::Mission::ScenarioBinding` (app/models/break_escape/mission.rb:337-415) and the validator's copy (scripts/validate_scenario.rb:56-110), "kept in step by hand". They have already drifted: the server's `vm_flags_json` returns `{"flag_1": ..., "flag_2": ...}`, the validator's returns a plain array. All ten main missions call `vm_flags_json`, so the validator has been checking a top-level `flags` shape the server never builds. Separately, values are pasted into JSON text, so a string with a quote breaks the render unless the author remembers `.to_json`.

**Change.**
1. Move the class to `lib/break_escape/scenario_binding.rb` as `BreakEscape::ScenarioBinding`, plain Ruby (`securerandom`, `json`), with the server's behaviour as the truth. Keep `Mission::ScenarioBinding` as an alias constant. Add `BreakEscape::ScenarioBinding.render(template_text, vm_context)` and have both `Mission#generate_scenario_data` and the validator's `render_erb_to_json` call it.
2. Add `json(value)`: returns `value.to_json`, for `"title": <%= json(title) %>`. Document it in the README's ERB section beside `.to_json`.
3. Delete the validator's copy and `require_relative '../lib/break_escape/scenario_binding'`, as it already does for `declared_grants`, `npc_habits`, `access_work` and `owner_claim`.

**Tests.** Rails unit test of each helper (`vm_object`, `flags_for_vm`, `flags_for_vm_slice`, `vm_flags_json` with and without a context, `json` with quotes, backslashes and non-ASCII). A test that `Mission::ScenarioBinding` is the lib class. Corpus: render all 176 scenarios with random values stubbed, before and after; the JSON is identical except the top-level `flags` of the 11 `vm_flags_json` users, which now match the server. Run the validator over m01 to m10 before and after; any new finding caused by the corrected `flags` shape is a validator bug to fix in this step.

**Sync.** No runtime change (the server's output is unchanged by construction).

### Step 6. Secrecy as a schema property

**Why.** Which values are secret is decided by hand-kept lists, and the format does not show them:
- The bootstrap (`Game#filtered_scenario_for_bootstrap`, game.rb:1094-1190) allow-lists room fields (line 1122) but deny-lists the top level by name: `flags`, `accountProfiles`, `roles`, the network keys, feed facts, capture secrets, grant contents, `targetFlags`. A new secret-bearing top-level block ships unless someone adds it to the list.
- Two near-copies strip `requires` with the same rule: `Game#filter_requires_and_contents_recursive` (game.rb:4569-4598) and `GamesController#filter_requires_recursive` (games_controller.rb:1917-1938, called on the bootstrap at line 286). `build/unlock-gaps` adds `strip_lock_answers!` (combination and cryptex answer copies) to both.
- Per-feature lists: `WITHHELD_NPC_KEYS` and `WITHHELD_WORK_NPC_KEYS` (game.rb:4681-4685), `NetworkAccess::WITHHELD_OBJECT_FIELDS`, the `puzzle_graph_*` strip, `DeclaredGrants`, and the capture-descriptor walk that `build/usepayload-secret` widens to `CAPTURE_SECRET_KEYS = %w[capture addCapture usePayload]`.
- 33 schema descriptions say "never sent to the browser" in prose; nothing machine-readable.

**Change, in three parts.**

*6a. Annotate.* In `scripts/scenario-schema.json`:
- `"x-serverOnly": true` on every secret property (section 2's list), with `"x-servedBy": "<route>"` where a route serves it once earned (`GET /container`, `GET /network`, `GET /capture_secrets`).
- A conditional form for `requires`: `"x-serverOnly": { "unlessLockType": ["biometric", "bluetooth", "rfid"] }`. A `requires` with no `lockType` counts as secret (fail closed), which closes the leak step 3 warns about.
- `"x-client": true | false` on every top-level property. Top-level keys the engine reads but the schema lacks are added first, with `x-client` set: `scenario_name` (the client reads it), `scenario_id`, `importGlobals`, `exportGlobals`. A top-level key with no `x-client: true`, including one the schema does not know, does not ship.
- Whole-record rules move into the annotation too: NPC `creds`, `role`, `awareness`, `habits`, `workarounds`, `workNeeds`, `frustration`, `feed`, `usbHabit`.

*6b. One serialiser.* `lib/break_escape/client_scenario.rb` (plain Ruby) compiles the annotations once at boot into a table per schema definition, and strips a node in place with the step 4 walker. It covers the bootstrap, lazy room payloads and container payloads, and replaces `filter_requires_and_contents_recursive`'s requires rule, the controller's `filter_requires_recursive`, `strip_lock_answers!`, the two NPC key lists and the capture walk. State-dependent work (unlocked rooms, `hasPresentNpc`, `flagUnlockedRemotely`, `pinLength`, objectives state) stays where it is; only the secrecy rule moves. Subtrees the schema does not describe (an open core kind's unknown key, `minigameData`) are kept as authored, so the old per-feature lists stay as a second pass until the parity test (below) shows the table covers them; then they are deleted in a separate commit.

*6c. Build on `build/usepayload-secret`.* Step 6 starts only after that branch merges. Its `CAPTURE_SECRET_KEYS` and `authored_capture_secrets` become: `secret` marked `x-serverOnly` with `x-servedBy: "/capture_secrets"` in the three capture descriptor definitions, and the serving code unchanged. Its tests (`capture_payload_secret_test.rb`, `capture_payload_secret_routes_test.rb`, the withholding tests) stay as regression tests. If its globals and minigameData checks landed in the validator, step 3 already extended them.

**Cost.** The walk runs per bootstrap and per room request. Strip the secret fields once per game into a cached copy keyed by game id and a digest of `scenario_data`, then apply the state-dependent fields per request. Measure on m10 (the largest scenario, 363 KB of ERB) and lab_physical_pentest; target under 20 ms for the bootstrap.

**Tests.**
- Rails, parity: for every scenario, the old filters' output and the new serialiser's output are compared field by field; the new one may remove more, never less. This test is deleted with the old lists.
- Rails, payload scan over every scenario: create a standalone game, fetch `GET scenario`, `GET room/:id` for every room, and `GET container/:id` for every container (a refusal counts as a pass). Assert that no annotated server-only field appears at any path, and that no authored secret value appears in the response text unless the same value is also authored in a field marked client-visible (a clue on a note is the game; step 3 judges those). One file, tagged so it can run alone.
- Rails, top level: a scenario with an unknown top-level key `secretThing` does not ship it.
- Node: a scan of `public/break_escape/js` for property reads of every `x-serverOnly` name, with a reviewed allow list (a name the client reads from a served route, such as a container's `contents`). It catches a client feature that silently depended on a field the server now strips.
- Existing: `filtered_scenario_test.rb`, `access_model_withholding_test.rb`, `network_withholding_test.rb`, `lab_physical_pentest_secrets_test.rb`, `capture_secret_test.rb`, `access_model_no_password_test.rb` all pass unchanged.

**Live proof.** A keyless server on the builder's port; headless browser runs, each with a reload partway: m01 (gold standard: PIN door, flag station), test_access_sessions (sign-in PC, account password never in `window.gameState.scenario`), test_access_networks (Wi-Fi join; `psk` absent until joined), test_unlock_gaps (combination and cryptex), lab_physical_pentest, and a capture scenario (the secret appears only after the capture, from `/capture_secrets`). In each, a console scan of the bootstrap and every loaded room for the scenario's secrets, and `tools/playtest/verify-run.rb` showing progress on the server.

**Sync.** Payloads shrink or stay the same; player_state is untouched.

### Step 7. `formatVersion` and a load-time upgrader

**Why.** A game stores the rendered scenario when it is created (`before_create :generate_scenario_data`, game.rb:33 and 4734-4765), so every rename must be read in both spellings for as long as old games exist. The `key_id` to `opens_lock` rename shows the cost: fallbacks in `window.lockRef`, `lib/break_escape/item_identity.rb:12-17,48`, a deprecated schema entry and a validator error. The schema's `version` (line 15) is an optional string nothing reads. And the access loader, `prepare_scenario_data!` (game.rb:1068-1074), runs only at creation, so stored games never receive a loader change.

**Change.**
1. A top-level integer `formatVersion`. Absent means 1. The existing `version` strings are left alone (dropping them is a migration, section 7.5).
2. `lib/break_escape/scenario_format.rb` (plain Ruby): `CURRENT`, and an ordered list of steps, each `from -> from + 1`, each a pure, idempotent function on scenario data. A step may also declare a player_state transform, which must rewrite existing keys in place and never append (the sync rule); a step that cannot meet that is not allowed.
3. `ScenarioFormat.upgrade!(data)` runs every step from the data's version to `CURRENT` and stamps `formatVersion`. It is called:
   - at creation, after `generate_scenario_data` and before `prepare_scenario_data!`;
   - on load, in the controller's game loader under the existing game lock: when the stored `formatVersion` is below `CURRENT`, upgrade and save `scenario_data` once (one write per game per version);
   - by the validator, on a copy, before its checks, printing one warning per old spelling met ("`key_id` is the version 1 spelling; write `opens_lock`").
4. A stored `formatVersion` above `CURRENT` (code rolled back after games were upgraded) refuses to load the game with a clear message, rather than misreading it.
5. Pilot step 1 to 2: `key_id` to `opens_lock`. No authored scenario uses `key_id` (0 of 176), so it touches only old stored games and proves the path end to end. Once it ships, the client fallback in `window.lockRef` can go, because every route hands the client upgraded data. The server fallback in `item_identity.rb` goes once the builder has listed every reader of `scenario_data` outside a request (jobs, rake tasks, Hacktivity reports) and routed each through the upgrader.

**Tests.** Rails: a game whose stored data is version 1 with `key_id` loads as version 2 with `opens_lock`, in both the stored record and the client payload; a second load writes nothing; a version 3 game refuses to load; a new game is created at `CURRENT`; player_state is byte-identical after the pilot step. Node: the validator warns on `key_id` and checks the upgraded copy.

**Live proof.** Keyless server; create a game, set its stored data back to version 1 with a `key_id` key on a key lock (a test helper, not a console edit of a real game), reload in the browser, open the lock with the key, `verify-run.rb` shows the unlock.

**Sync.** No player_state change in the pilot. `scenario_data` is server-side and is not re-sent by the client.

## 5. Merge order

Four branches touch the same files (`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `app/models/break_escape/game.rb`, `app/controllers/break_escape/games_controller.rb`). State on 2026-11-12:

| Branch | Ahead of its base | Files shared with this plan |
|---|---|---|
| build/c3-replies | 23 commits | schema (2 lines), test_access_social |
| build/unlock-gaps | 5 | schema (4), validator (56), game.rb (100), controller (19): `strip_lock_answers!` in both filters |
| build/readme-93b | 6 | game.rb (9), network_access.rb, validate_network.rb |
| build/usepayload-secret | 0 commits; uncommitted work in its worktree | game.rb capture-secret stripping and serving |

Order:
1. **build/c3-replies**, which clears test_access_social's two errors.
2. **build/unlock-gaps** and **build/readme-93b**, in either order.
3. **Step 1** (exit code), once section 3's fixes are in. Every later branch then fails its own merge batch on any `❌`.
4. **Steps 2, 3, 4 and 5**, validator and lib only; they can be built in parallel worktrees and merged one per batch. Step 3 waits for build/usepayload-secret if that branch adds a validator check.
5. **build/usepayload-secret**.
6. **Step 6**, rebased on main after build/usepayload-secret and build/unlock-gaps, because it replaces the code both of them change.
7. **Step 7.**

Each batch moves main only to the commit the full suites ran on, and runs the validator over every test scenario a merged branch touched.

## 6. Questions for the user

1. **m08's door PIN in a global.** Netherton's voiced ink needs to say the suite code, and ink reads globals in the browser. Options: (a) accept it under the cheat policy as a voiced clue and mark it in the scenario as an acknowledged exception the leak check allows; (b) a server route that speaks a secret line only once its condition holds, so the global holds a placeholder until then; (c) change the beat so the code is read off the card and Netherton never says it. (a) is cheapest; (b) is new engine work; (c) changes the mission's writing and its cached audio.
2. **basic_mission and vm_free_mission.** They fail the schema and have no `collection`. Fix them as examples, or delete them?
3. **Landing step 1 with a known failure.** If the escape-room or lab fixes are not ready, may step 1 land with those scenarios listed as known failing?

## 7. The migrations (not in scope; for the user to pick)

Each needs scenario edits and waits for a decision. The upgrader from step 7 carries old saved games through each one.

### 7.1 One `owner` field
- Changes: an `owner` (NPC id or list) and `private: true` on objects and items replace `screenOwner`, `affordance.owners`, `phoneOwner`, `phoneOf` and `leftBehindBy`; `needsHome` goes back to meaning movement only.
- Affects 8 scenarios: lab_physical_pentest, test_access_habits, test_access_sessions, test_access_social (and C3's additions), test_access_work, test_capture_log, test_clone_left_card, test_needs_sims. Main now also has `lib/break_escape/owner_claim.rb` (q78), which derives owners from `needsHome` and must read `owner` first.
- Upgrader: copy each old field into `owner`, and write an explicit `owner` wherever the old rule derived one from `needsHome`, so old saves behave as before. player_state is keyed by object and NPC ids, which do not change.

### 7.2 One outage field and one condition grammar
- Changes: `offWhen` moves from `affordance` to the object and replaces `downIf` on networks and resources, all in the requireGlobal form (a name, or `{ name: value }`); `spriteVariants` accepts the same form.
- Affects 4 scenarios: test_access_networks, test_access_social, test_access_work, test_needs_sims.
- Upgrader: `downIf: "g"` becomes `offWhen: "g"`; `affordance.offWhen` moves up a level. The server's two failure causes (`down`, `off`) are recorded per event, not stored, so saves need nothing more.

### 7.3 Habits in one block
- Changes: `screenHabit`, `printHabit` and `usbHabit` fold into `habits.screen`, `habits.print`, `habits.usb`; `awareness` stays the preset that fills them; the person's habit beats the PC's `lockChance`, and the validator prints each workstation's effective lock rule.
- Affects 5 scenarios (test_access_habits, test_access_social, test_access_work, test_needs_sims, lab_physical_pentest), plus `lockChance` on PCs in 6 test scenarios if the precedence changes.
- Upgrader: move the three fields. Where the new precedence would change an old save's outcome, write the PC's old `lockChance` into the owner's habit so the save keeps its behaviour. The seeded screen roll is not stored, so nothing in player_state moves.

### 7.4 Close the core kinds
- Changes: add the fields from the structure review's M2 table to the schema, then `additionalProperties: false` (with `^_` allowed) on room, object, NPC, eventMapping, objective and task, and delete the hand lists in `check_unknown_fields`.
- Affects 37 scenarios that carry unknown-field warnings today, after 7.5 removes or declares the dead fields.
- Upgrader: none for the closure itself, which is a validator rule. Any alias it retires (`target_room`, `roomId`, `task_id`, `setVariable`) becomes an upgrader step that rewrites it to the current spelling.

### 7.5 Drop dead fields
- Changes: remove `endGoal`, `version`, `scenario_id`, object `isEndGoal`, eventMapping `autoTrigger`, `note_title` and `note_content`; move title fields into `mission.json`.
- Affects up to 146 scenarios (`endGoal` 146, `scenario_id` 94, `version` 87, `isEndGoal` 9, `autoTrigger` 7, `note_*` 2). Mechanical; no spoken text changes, so cached audio is safe.
- Upgrader: delete the fields from stored data (nothing reads them). `scenario_name` is read by the client, so it moves only with a reader change and an upgrader step that copies it.

## 8. Risks

- **Step 1 blocks other work.** Once errors fail the run, any branch carrying an unfixed `❌` fails its merge batch. Section 3's fixes must land first, and the summary line makes the cause obvious.
- **Step 6 strips a field the client needs.** The client-read scan, the parity test and the live runs exist for this. `scenario_name` is the known case and is listed in 6a.
- **Step 6 cost per request.** The cache keyed by game and data digest keeps it to one walk per game; the build log records the measurement.
- **Step 7 on a rollback.** A game upgraded by new code refuses to load on old code instead of misreading. Releases that add an upgrader step say so in their notes.
- **Other tracks editing the same scenarios.** No builder edits a mission, lab or escape room without the orchestrator's confirmation from its owner.
