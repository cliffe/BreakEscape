# Scenario format hardening plan

Status: **Draft**. Date: 2026-11-12. Written on `build/schema-review`. Code references are to main at **33c003230** (which includes build/c3-replies, build/usepayload-secret, build/keypin-seed and build/readme-93b), unless they say otherwise. The validator triage in section 3 ran on main at 72e26f911; step 1's own corpus run repeats it on the main the build starts from. A builder re-anchors any line number that has moved on that main and names the commit in the build log.

Sources: `docs/achitechture/SCENARIO_FORMAT_REVIEW_STRUCTURE.md` and `docs/achitechture/SCENARIO_FORMAT_REVIEW_ACCESS.md`. Every claim the plan builds on was checked in the code; where a source review was wrong or incomplete, this plan says what the code does.

## 1. What this plan does

It hardens the scenario JSON format without changing any scenario's design. Six steps, in order of value for cost, plus one candidate that waits for the user:

| # | Step | Touches | Scenario edits | Size |
|---|---|---|---|---|
| 1 | Validator exit code matches its output, with a known-failures list | validator, CI, tests | 41 lines in test scenarios fixed here; other tracks' lines fixed or listed (section 3) | M+ |
| 2 | Strict keys for the access, network and office-life blocks | schema, validator | none expected | S |
| 3 | Secret-leak check, with acknowledged clues | validator, schema, `CaptureModel`, one bootstrap line | m08 waits for q85; m06 gets one marker | S+ |
| 3b | Server-held globals (candidate, waits for q85) | schema, model, controller, validator | m08 only | M |
| 4 | Reference and id checks driven by schema annotations | schema, validator | 5 scenarios, as warnings | M |
| 5 | One `ScenarioBinding` in `lib/` for every renderer, and a JSON-safe ERB helper | lib, model, validator, tools, tests | none | S |
| 6a | Secrecy marks in the schema, a two-state payload scan and a top-level client-read scan | schema, tests | none | M |
| 6b | One client serialiser (only if the 6a opened-state scan finds a gap) | lib, model, controller | none | L |

Deferred to a later slice: the load-time upgrader. It starts with the first approved step that rewrites stored data (section 8). The `formatVersion` field itself can come earlier and alone, as the cheap part of q84 (section 7).

Out of scope: the format migrations that wait for the user. Section 7 groups them by question: q83 (7.1 to 7.3) and q84 (7.4, 7.5 and `formatVersion`).

## 2. Rules every step follows

- **Cheat policy.** The server hard-enforces secrets, keys and forged items; ink-gated steps and tailgating stay best effort with an NPC sanity check. A secret is any value that, read from the browser, lets a player skip a lock: a PIN, password, combination, cryptex word, flag answer, account password, Wi-Fi key, capture secret or a declared grant's contents. Steps 3 and 6 exist to keep every one of these on the server until it is earned.
- **Sync size rule (q77).** player_state and any per-game record the client re-sends must change by delta or stay bounded. Steps 1 to 6 add nothing to player_state and no new sync traffic; step 3 removes one key from the bootstrap. Step 3b, if approved, adds one bounded string per declared server global, sent once as a delta when it is revealed. Each step's section states its effect.
- **Tests.** Every step ships with node tests for validator behaviour (`test/js/validator-*.test.mjs`, the `check_*` function called through `ruby -e`, as `test/js/validator-pin-locks.test.mjs` does) and fixtures, Rails tests for any server change, and a corpus run of the validator over all 176 scenarios with the before and after counts in the build log. Builders run every test file their change touches plus every file that imports a changed module, without the shared lock; the orchestrator runs the full suites once per merge batch.
- **Merge-batch validator rule.** Each merge batch runs the validator (`--no-graph`, ink on) on every test scenario a merged branch touched and needs 0 `❌` before main moves. After step 1 this is the exit code, and the rule becomes "0 unlisted `❌`" (step 1, the known-failures list).
- **Live proof** for every engine change (steps 3, 3b and 6b): a keyless server on the builder's own port, a browser run through the real routes, and `tools/playtest/verify-run.rb` showing progress on the server. Helper tests alone do not count.
- **No new gems or npm packages.** The validator already has `json-schema`; the server needs nothing new.

## 3. Triage

Run on 2026-11-12 over all 176 scenarios on main 72e26f911, with the merge-batch flags: `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph` (ink compiled and checked; the lint is advisory and prints no `❌`).

- **14 scenarios exit 1**: 8 on ink-stage errors (the 6 VM labs below, ceo_exfil, npc-sprite-test2) and 6 on schema errors (section 3.2). test_desk_seating prints its schema error as `✗ Schema validation failed` with no `❌`, which is why the schema failures are counted apart.
- **105 `❌` lines are printed, in 22 scenarios.**
- **11 more are hidden** today because the ink stage exits before the common issues (`validate_scenario.rb:6854` on 33c003230): ceo_exfil's 10 `targetKnot` lines and lab_malware_metasploit's task line. Running those 8 scenarios with `--skip-ink` shows exactly these 11 and nothing else. With step 1 printing every section, the count is **116 lines**, plus whatever the 6 schema failures hide (unknown until step 1 prints them).
- **m01 to m10: 0 `❌`, exit 0.**

For comparison, with `--skip-ink --no-lint` the same corpus prints 62 `❌` lines in 16 scenarios and 6 scenarios exit 1. The ink stage adds 54 lines and 8 exit-1 scenarios.

### 3.1 The 116 lines, by owner

**This build (test and demo scenarios): 41 lines.**

| Scenario | Lines | Message | Verdict |
|---|---|---|---|
| test_complex_multidirection | 10 | key lock or key item without `keyPins` | true error |
| test_multiple_connections | 8 | same | true error |
| test_mixed_room_sizes | 6 | same | true error |
| test_vertical_layout | 4 | same | true error |
| test_horizontal_layout | 4 | same | true error |
| test_behind_wall_fade | 1 | same | true error |
| test-rfid-multiprotocol | 2 | NPC `spriteSheet` `hacker-green` and `hacker-yellow` do not exist | true error |
| npc-sprite-test2 | 2 | `#give_item:keycard` and `#give_item:phone` in the shared `scenarios/ink/helper-npc.ink`, with no matching item in the helper NPC's `itemsHeld` (exits 1) | true error |
| sis02_energy | 3 | `minigameData` fields `nextTabPrompt`, `nextTabButton`, `completeBanner` undeclared for `log_filter_terminal` | **false positive** |
| sis01_healthcare | 1 | `interactionWarning` must be an object | **false positive** |

**C3 builder: 2 lines, now fixed on main.** test_access_social: Kim posted from a phone with no Friendface phone, and object id `sign_f14` was used twice. Both were fixed on `build/c3-replies`, which is in main at 33c003230.

**Escape-room track: 24 lines** (the `escape_room` collection). The last change to any of these five `scenario.json.erb` files is df29856c3 on 2026-10-22; a later commit, d6d5d7da2 on 2026-11-06, touched only crypto1's dungeon graph. The owner check uses `git log -1 --format='%h %ad' --date=short main -- scenarios/<dir>/scenario.json.erb scenarios/<dir>/ink` for each scenario; a date after 2026-10-22 means the track is active again.

| Scenario | Lines | Message | Verdict |
|---|---|---|---|
| crypto1_captain_meow | 1 | key lock or key item without `keyPins` | true error |
| crypto2_rsa_asymmetric | 2 | same | true error |
| crypto3_aes_symmetric | 2 | same | true error |
| biometric_breach | 5 | same | true error |
| ceo_exfil | 4 | `#give_item` for keycard, lockpick, phone and workstation in the shared `helper-npc.ink`, with no matching item on the reception NPC (exits 1) | true error |
| ceo_exfil | 10 (hidden today) | phone NPC eventMapping uses `targetKnot`, which is ignored once a story state is saved | true error |

**Labs track: 49 lines** (the VM labs; every one exits 1 on ink today).

| Scenario | Lines | Message | Verdict |
|---|---|---|---|
| lab_exploitation | 13 | `**Heading:**` lines in `instructor.ink` parse as standalone emotes starting with `*` | true error |
| lab_post_exploitation | 12 | same | true error |
| lab_vulnerability_analysis | 9 | 7 headings as above, 2 lines containing `//` (ink cuts the rest of the line as a comment) | true error |
| lab_feeling_blu | 10 | `//` in ink text | true error |
| lab_vulnerabilities | 3 | `//` in ink text | true error |
| lab_malware_metasploit | 1 | `//` at `instructor.ink:636` | true error |
| lab_malware_metasploit | 1 (hidden today) | `npc_conversation` task whose `#complete_task` tag is not in the instructor ink | true error |

Total: 41 + 2 + 24 + 49 = 116, of which 2 are now fixed on main. 112 true errors, 4 false positives.

Notes on the verdicts:

- **keyPins (43 lines).** The README makes `keyPins` required on key locks and key items (README_scenario_design.md:635, 1244). The client's fallback for a lock with none, `generatePinHeightsForLock` (`public/break_escape/js/systems/key-lock-system.js`, reached from `assignKeysToLocks`), declared `const seed` and then ran `seed++`, so it threw "Assignment to constant variable." whenever a held key matched a lock with no `keyPins`. build/keypin-seed (in main) fixes that with `let`. Whether a key cut from the generated mapping always fits the lockpicking minigame's own pins is still unproven, so the rule stays an error and the fix is a `keyPins` array on each lock and its key (the same array on both): one line per lock, nothing a player can see.
- **ceo_exfil targetKnot (10).** The validator's rule matches the engine: a phone NPC's saved story state wins over `targetKnot` on reopen (README_scenario_design.md:52). The fix is a design edit: each mapping sets a global, and the ink hub gets a conditional option for it, with a `sendTimedMessage` to tell the player.
- **`#give_item` in the shared helper ink (6).** npc-sprite-test2 and ceo_exfil share `scenarios/ink/helper-npc.ink`. Each scenario fixes its own NPC's `itemsHeld` (or, for ceo_exfil, its owner picks another ink file). Nobody edits the shared ink for one scenario without the other's owner.
- **The lab ink lines (48).** Mechanical: reword a `//` (for example "slash slash" or a URL without the scheme), and attach each `**Heading:**` to a spoken line. They are labs content, so the labs track makes them.
- **lab_malware_metasploit task (1).** `objectives[0].tasks[0]` targets `malware_specialist` and waits for `#complete_task:complete_instruction_task`; neither `instructor.ink` nor `instructor.json` has the tag, so the aim can never complete. The fix is one tag at the end of the instruction knot, or a task type that does not need it.
- **test-rfid-multiprotocol (2).** Only `hacker` and `hacker-red` are loaded (`public/break_escape/js/core/game.js`, the guard sprite list). Swap the two guards to existing sheets.
- **sis02_energy (3), false positive.** `public/break_escape/js/minigames/log-filter/log-filter-minigame.js` documents and reads all three fields; `scripts/minigame-data-schemas.json` (`log_filter_terminal`) omits them. Add them to its `optional` list.
- **sis01_healthcare (1), false positive.** The object-level `interactionWarning` (`public/break_escape/js/systems/interactions.js`) is an object, but the EHR minigame's medication rows have their own string field of the same name, tested only for truth (`public/break_escape/js/minigames/ehr-terminal/ehr-terminal-minigame.js`). The validator's walk (`scripts/validate_scenario.rb:2467-2503`) descends into `minigameData`. Stop the walk at `minigameData`.

The orchestrator confirms with each owner before anyone edits their files. The `keyPins` edits are mechanical enough for this build to prepare as a patch the escape-room owner approves; the ceo_exfil design change and the lab ink stay with their owners.

### 3.2 The 6 schema failures

These already exit 1, so the switch does not change their exit code, but step 1 prints every section after a schema failure and they will then show further lines that are hidden today. Step 1 re-triages them.

| Scenario | Schema error | Proposed fix | Who |
|---|---|---|---|
| test_desk_seating | room `type` `room_test_desk_seating` not in the 145-entry enum (the map file exists) | add the map to the enum now; step 4 replaces the enum with a file check | this build |
| test-blockchain-explorer | task `type` `set_global` not in the enum | add it if the objectives code handles it, else change the fixture | this build |
| test_table_items | an object without `name`, and others | fix the fixture | this build |
| test-ble-scanner | top-level `name`, `description` and others | fix the fixture | this build |
| basic_mission, vm_free_mission | top-level `globalItems` and others | the user decides (section 6, q86) | user |

## 4. The steps

### Step 1. The validator's exit code matches its output

**Why.** `scripts/validate_scenario.rb` exits 1 only for directory, structure, schema, ink-compile, ink-check and graph-key failures (on 33c003230: lines 6748, 6770, 6818 for the schema, 6854 for ink, 7003, 7065, 7076). Every other `❌` is printed and the run ends with `exit 0` ("warnings don't cause failure", lines 7089-7091). On a schema or ink failure it exits early, before the common issues, habits report and work report are printed, so an author meets a second wave of errors after fixing the first. Agents are told to count `❌` lines by hand.

**Change.**
1. Fix the 4 false positives and the 37 true errors in this build's test scenarios (section 3.1), and the four schema-failing fixtures this build owns (section 3.2).
2. One label. Every hard finding is `❌ ERROR:`. Today there are `❌ INVALID` (108 sites in validate_scenario.rb), `❌ ERROR` (53 there, 117 in validate_npc_needs.rb) and `❌ SOCIAL` (validate_social.rb). The rename is mechanical and the text after the label stays: social lines become `❌ ERROR: SOCIAL: <text>`, so the existing tests that match `SOCIAL: schema:` keep their match. Tests that match on an old label are updated in the same commit (see Tests, the audit).
3. Schema errors print as `❌ ERROR: schema: <json pointer>: <message>`, with the opaque schema id removed and, where the pointer reaches a room, object or NPC, its id or name added.
4. Print every section before deciding the exit code. Neither a schema failure nor an ink-check failure exits early; an ink compile failure still skips the checks that need the compiled JSON, and says so. The common checks assume schema-shaped data (`rooms` a Hash, `objects` Arrays) and today never see data that failed the schema, so each section runs under a rescue: an exception prints `❌ ERROR: <check name> could not run: <message>`, counts as an error, marks that stage as not run in full, and the run continues with the next section.
5. Count by construction: all output goes through one writer that counts lines starting with `❌` and tags each with the stage that printed it (`ink`, `schema`, `common`, `habits`, `work`, `social`), so a module that prints its own lines cannot slip past. The run ends with `Result: <n> errors (<k> known), <m> warnings` (step 3 adds `, <c> acknowledged clues`), plus `<j> known failures not checked (<stage> skipped)` when a stage did not run in full. It exits 1 when an unlisted error remains.
6. Social schema errors become fatal on every run. Today `ValidateSocial.split_schema_errors` (`validate_social.rb:94`) moves `#/social` schema errors into the social lints, which fail the run only under `--strict-social`. The corpus has none, so nothing changes today, but the builder states it in the README's validator section.
7. `--strict-social`. The CI social job (`.github/workflows/ci.yml:144`, `--strict-social --no-graph --skip-ink` under `set -euo pipefail`) went green when build/c3-replies merged. After step 1, `--strict-social` adds nothing and stays accepted, because CI passes it.
8. The known-failures list (below).
9. Wording. Six skills mention `❌` or `INVALID`: validate-scenario, scenario-design-review, mission-puzzle-chains, walkthrough-scenario, npc-dialog-review and break-escape-dungeon-graph. The builder proposes new wording for all six to the orchestrator (the exit code is the answer; a listed failure prints with its owner; the label is `❌ ERROR:`), and edits the README validator section and the AGENTS.md line "count every `❌`" in the branch.

**The known-failures list.** Step 1 lands before every other track has fixed its lines, so the gap is held in a file the validator reads, never in a build log.

- `scripts/validator_known_failures.json`: an array of entries `{ "scenario", "stage", "match", "count", "owner", "added", "reviewBy", "approved", "note" }`.
  - `scenario` is the repo-relative template path, the form the validator receives: `scenarios/<dir>/scenario.json.erb`.
  - `stage` is one of `ink`, `schema`, `common`, `habits`, `work`, `social`, the stage whose line the entry matches.
  - `match` is a substring of the `❌` line that does not depend on line numbers (for example `contains '//'`); `count` is how many lines of that scenario and stage it covers, exactly.
  - `added` and `reviewBy` are ISO dates; `owner` names a track or person (labs track, escape-room track, the m08 owner).
  - `approved` is the text of a heading in the current pass log, where the orchestrator recorded the sign-off for this entry.
- The validator reads the list by default (`--known-failures <file>` to point elsewhere, `--no-known-failures` to see the raw result). A matched line still prints, marked `(known: <owner>, since <added>)`, and does not count towards the exit code. An unmatched line counts.
- **Stale entries.** For an entry whose stage ran in full on this run, fewer lines than `count` prints `❌ ERROR: stale known failure: <scenario> <stage> '<match>' now matches <n> of <count>; update or remove it`, and more lines than `count` counts the extra ones as unlisted. For an entry whose stage did not run in full (`--skip-ink`, an ink compile failure, a section that raised), the entry is not checked and is counted in the `not checked` line. So `--skip-ink` runs, including CI's social job, never fail on a listed ink line.
- **Swaps within an entry are accepted.** Fixing one `contains '//'` line and adding another in the same scenario keeps the count and passes. The swap stays within one owner, one stage and one class of line, which is what the entry already allows.
- **The node test** (`test/js/validator-known-failures.test.mjs`) checks each entry: the scenario file exists; `stage` is one of the six; `match` and `owner` are non-empty; `count` is positive; `added` and `reviewBy` are valid dates with `added` not in the future; and `approved` appears as a heading in the pass log. The test reads the log's path from the "Current pass" line of `CLAUDE.md` (today `scenarios/PASS4_EDITORIAL_LOG.md`), so it follows the pass. An added entry or a raised `count` therefore needs an edit to the orchestrator's log, which shows in the branch diff.
- **A passed `reviewBy`** prints a warning and skips that assertion, unless `MERGE_BATCH=1` is set, when it fails. The orchestrator sets `MERGE_BATCH=1` for the merge-batch suites, so a date passing never turns main or an unrelated branch red, and the decision is forced at the next batch.
- **Merge-batch check.** Each batch runs `git diff <main>...<branch> -- scripts/validator_known_failures.json` for every merged branch, and stops on any added entry or raised `count` that the batch notes do not name. The orchestrator signs off each one in the pass log under the heading the entry's `approved` names. The builder proposes this as a line for the orchestrator's merge-batch checklist (AGENTS.md has no merge-batch section today; the builder proposes one).
- This build's own fixtures are fixed, never listed.
- **First contents**, if the owners have not fixed their lines when step 1 lands: the 6 VM labs (labs track, 49 lines in 8 entries, 47 of them `stage: ink`), and the 5 escape rooms (escape-room track, 24 lines in 6 entries). Each with a `reviewBy` the owner agrees and an `approved` heading the orchestrator writes.

**When it lands.** After this build's 41 lines and 4 fixtures are fixed, and with every remaining line either fixed or listed. Step 1's own corpus run produces the list's first contents, so no line is listed by guesswork.

**Tests.**
- Node: a fixture with one `❌` line from each module (common, ink check, schema, habits, work, social) exits 1; a fixture with only warnings exits 0; a schema failure plus a common issue prints both and exits 1; an ink-check failure plus a common issue prints both; a schema-invalid `rooms` value (a string) prints the schema error and a `could not run` line for each check that raised, then the summary, and exits 1 with no stack trace; the summary line counts correctly; the four false-positive shapes (sis01 medication warning, sis02 fields) pass; a listed failure exits 0 and prints its owner; a stale entry and a short `count` each exit 1; an extra unlisted line exits 1; a listed ink line under `--skip-ink` exits 0 and prints the `not checked` line; the same entry with ink on and the line fixed exits 1 (stale).
- Node, the list file: an entry whose `approved` heading is missing from the log fails; a passed `reviewBy` warns without `MERGE_BATCH=1` and fails with it.
- Test audit: 48 test files run the whole validator and hold 104 `status, 0` assertions. The builder lists every test that asserts exit 0 on output containing `❌`, and every assertion that matches `INVALID`, `❌ SOCIAL` or `❌ ERROR`, with or without the cross mark, and updates each in the same commit as the switch. Known cases: `test/js/validator-social-schema.test.mjs:158-159` (a `❌ SOCIAL: schema:` line with exit 0), `validator-mission-result.test.mjs:44,61,74`, `validator-mission-scoring.test.mjs:41` and `validator-pin-locks.test.mjs:40,48` (`INVALID:` with no cross mark).
- Corpus: before and after counts per scenario in the build log, with the merge-batch flags; after the fixes, every scenario that prints an unlisted `❌` exits 1, and no scenario that exited 0 with no `❌` changes.

**Sync.** No runtime change.

### Step 2. Strict keys for the access, network and office-life blocks

**Why.** Several of these blocks are open in the schema and the validator's unknown-field pass does not walk them. A misspelt key is silent, and some slips change play: `wifi: { "PSK": ... }` leaves `psk` missing, which means an open network by design; `"downif"` on a resource means the outage never happens; `"autoLockMins"` drops an instant lock. Checked on main: `networks.*` and `networks.*.wifi`, `resources.*`, `policies.*` and NPC `feed` set no `additionalProperties`, and the schema is run with `strict: false` (validate_scenario.rb:224). No main mission uses these blocks, so closing them now costs nothing.

**When it lands.** After build/c3-replies, which declares NPC `feed.order` (read by `lib/break_escape/access_work.rb`, used by 5 test_access_social NPCs). C3 is in main at 33c003230, so the dependency holds; it stays a hard rule for any rebase.

**Change.**
1. In `scripts/scenario-schema.json`, set `additionalProperties: false` with `patternProperties: { "^_": {} }` (so `_comment` keys still pass) on: the entries of `resources`, `networks`, `networks.*.wifi`, `policies`, `accountProfiles` and `roles`; the access list type (`roles`, `people`) wherever it appears (`access`, `for`); each NPC `workarounds` entry; NPC `feed` and its posts; the `grant_foothold` action. These blocks are already closed on main and get only the `^_` pattern where they lack a `_comment` property: NPC `creds`, `habits`, `screenHabit`, `printHabit`, `usbHabit`, `frustration`, each `needs` entry, and object `affordance`. `portSecurity` is a boolean and is left alone. The builder lists the final set in the build log with each block's schema path.
2. The corpus check, before the commit: every rendered scenario's keys under every block in item 1 are compared with the schema. Expected result: no unknown key. Any hit in a test scenario is fixed here; any in a mission goes to its owner before the block is closed.
3. The validator rewrites json-schema's own `additionalProperties` message in place, as `❌ ERROR: schema: <path>: unknown key '<k>'`, adding `did you mean '<known>'?` when one known key matches case-insensitively or within edit distance 2. It prints one line per unknown key, never a second line for the same slip. The schema stays the single definition; the pass only words the message.
4. The hand-kept lists in `check_unknown_fields` (validate_scenario.rb:402) stay for the core kinds, which remain open until q84's closure (section 7).

**Tests.** Node fixtures for each mutation in the access review's table (`PSK`, `downif`, `autoLockMins`, `lockchance`, `needHome`, affordance `owner`), each exactly one error naming the right key and suggestion; a `_comment` key in each block passes. Corpus run: expected 0 new errors.

**Sync.** No runtime change.

### Step 3. Secret-leak check, with acknowledged clues

**Why.** Nothing stops an author copying an answer to a place the browser receives at game start. `globalVariables` ships in the bootstrap and in player_state; `minigameData` ships with the room. m08 already does it: `suite_code = "5386"` (scenarios/m08_the_mole/scenario.json.erb:117) is a global so that Netherton's voiced ink can say it, which puts the interrogation-suite PIN in the browser from the start. Separately, the server strips `requires` only when the node's own `lockType` is present and is not biometric, bluetooth or rfid (game.rb:4697-4699 and games_controller.rb:1930), so `"locked": true, "requires": "4821"` with no `lockType` ships the PIN, and so would a door entry with a PIN in `requires` and no `lockType` of its own.

**How a lock type is resolved.**
- A room, object or item: its own `lockType`.
- A `rooms.*.doors[]` entry: the entry's `lockType`, else the connected room's. This is the client's rule: the client takes the `doors[]` entry whose `connectedRoom` and `direction` both match (`public/break_escape/js/systems/doors.js:494` and 565) as the door's lock properties and fills each gap from the connected room (lines 526-527: `lockType: lockProps.lockType || connectedRoomData?.lockType`, `requires: lockProps.requires || connectedRoomData?.requires`), copies the result into the sprite, and the gate code reads `props.requires` for the clone-as-entry credential and the door sign (`door-gates.js`). A card id in a door entry's `requires` is live on the client.
- **The server checks the room.** The server validates a door unlock against `room_data(target_id)` alone (`Game#validate_unlock`, game.rb:2701, and the rfid and mastermind helpers it calls). It never reads a door entry's `requires` or `lockType`. A door entry's `requires` is therefore a client-side value (the gate sign, clone-as-entry), and the step says so in the README's door section.
- Only door entries for which `NpcHabits.doorway_problem` (`lib/break_escape/npc_habits.rb:238`) returns nil are resolved. An entry it flags is one the client never reads, and the existing validator warning (validate_scenario.rb:6438) already covers it.

Two door entries in the corpus carry `requires` with no `lockType` and no `locked`: lab_physical_pentest `open_plan/doors[0]` (`cm_records_badge`, connected room `secure_area`, rfid) and test_gate_tailgate `office/doors[0]` (`test_staff_badge`, with a `gate` block, connected room `staff_room`, rfid). Both resolve to rfid with the same `requires` as their room, so both are correct and stay.

**The answer set is shared with the server.** `lib/break_escape/capture_model.rb` (from build/usepayload-secret, in main) already has `CaptureModel.lock_codes` (password and PIN codes, keyed on each node's own `lockType`) and `hard_access_values` (those plus rfid and biometric `requires`, Wi-Fi PSKs and flag values). The server uses them to withhold a capture secret that opens a lock, and the validator uses `lock_codes` for its capture-proof warning. Step 3 extends both instead of building a second list:
- door entries resolve their lock type from the connected room, as above;
- `lock_codes` adds combination and cryptex answers (these lock types arrive with build/unlock-gaps-r1, so step 3 lands after it).

This changes the server: a capture secret equal to an untyped door entry's PIN, or to a combination or cryptex answer, becomes withheld until its proof holds, as a PIN already is. That is the cheat policy applied to two more lock kinds. The builder adds Rails tests for both cases on `authored_capture_secret`, runs a corpus check that no capture currently served changes its served state (expected none: no scenario has such a capture), and gives live proof on lab_physical_pentest's shoulder-surf beat.

**Change.** A validator check, `check_secret_leaks`, run on the rendered scenario.
1. **Collect answers:** the extended `CaptureModel.lock_codes` (rooms, objects, `contents`, `itemsHeld`, `startItemsInInventory` and door entries, with resolved lock types pin, password, combination and cryptex); top-level `flags` values; task `targetFlags`; flag-station `flags`; `creds.password`; `networks.*.wifi.psk`; capture secrets (`usePayload.secret`, `addCapture.secret`, `capture.secret`).
2. **Compare.** An error when an answer matches a `globalVariables` value, or a string or number leaf in any `minigameData` or `scenarioData`, unless an acknowledged clue covers it (item 5). A match is one of:
   - equality with the leaf, after the text forms below;
   - for an answer of 6 or more characters, a whole word inside a string leaf.

   Text forms: a number and its string are equal (`4821` and `"4821"`). A combination answer (a list of integers such as `[12, 30, 5]`) matches an equal array, or a string holding the numbers in order in a common form (`12-30-5`, `12 30 5`, `12,30,5`, `12, 30, 5`). A cryptex answer and a password compare case-insensitively (the server compares a cryptex with `casecmp?`; for the leak check, stricter is safer). The message names both places and points to the decision the author needs (section 6, q85).
3. **Random values.** The check renders the template a second time with fixed sentinel values for `@random_pin`, `@random_password` and `@random_code` (`__random_pin__` and so on, values no authored leaf can hold) and compares on that render. A random value copied into a global still shows, because the sentinel appears in both places, and a random PIN that happens to equal a year or an amount elsewhere cannot cause a one-off error. `ScenarioBinding` (step 5, or the validator's copy before step 5) takes a `sentinels: true` option for this; the server never passes it.
4. **`requires` with no resolved lock type, and door entries that differ:**
   - resolved to biometric, bluetooth or rfid: an id (a card, fingerprint owner or device), never a secret; no finding;
   - resolved to a secret kind on a door entry that has no `lockType` of its own: an error ("this door entry ships its `requires` because the server filter reads the entry's own `lockType`; set `lockType` on the entry or remove `requires` and let the room carry it"). The corpus has none;
   - a door entry whose resolved lock type or `requires` differs from its connected room's: a warning ("the server checks the room's lock, so the player sees one lock and the server checks another"). Both corpus entries match their rooms, so this adds no lines;
   - no lock type on the node or, for a door entry, on the connected room: on a `locked: true` room, object or item, an error; on an unlocked object, a warning ("inert; delete it"). A door entry is never told to delete its `requires`. The 15 legacy objects (all unlocked PCs with the literal `"requires": "password"`, in ceo_exfil and crypto1 to crypto4) get the warning, not an error;
   - the check does not look at `requires` inside `social` (it lists facts there, 12 hits in ca01 to ca14) or at objective conditions.
5. **Acknowledged clues.** A clue that is the puzzle is marked, never silenced by a looser rule. A top-level list:
   ```json
   "acknowledgedClues": [
     { "lock": "<id of the room or object whose answer is matched>",
       "in": "<object id holding the minigameData>",
       "reason": "<one line: why showing it is the deduction>" }
   ]
   ```
   - A match between that lock's answer and a value inside the named object's `minigameData` is reported once as `ℹ️ acknowledged clue: <lock> in <in>: <reason>` and is not an error. An entry that matches nothing is a warning (stale).
   - **Rejected forms.** An entry whose `in` is the lock itself, or an object inside the lock's `contents` at any depth, is an error: the lock's own `minigameData` ships with the room while the lock is still shut, and contents are served only after the unlock, so a marker there is either a leak or not needed.
   - **The `global:` form** (`"in": "global:<name>"`) waits for q85. Until the user answers (a), the validator rejects it with an error naming q85. If (a) is chosen, the form is accepted and prints as `⚠️ WARNING: acknowledged clue in a global ships at game start: <lock> in global:<name>: <reason>`, never as `ℹ️`. The switch is one constant in the validator, flipped in the commit that records the answer.
   - **Counted and reviewed.** The summary line adds `, <c> acknowledged clues`. Each merge batch greps every merged branch's diff for `acknowledgedClues`, and an added or changed marker needs the same sign-off as a known-failures entry: named in the batch notes and signed off by the orchestrator in the pass log.
   - **Not shipped.** `acknowledgedClues` is a top-level key, and the bootstrap's top level is a deny list (`Game#filtered_scenario_for_bootstrap`, game.rb:1094-1186, deletes named keys only), so every `reason` would reach the browser: a spoiler, though not a secret. Step 3 adds `filtered.delete('acknowledgedClues')` there, with a Rails test through the real `GET /games/:id/scenario` route (not the helper alone) and the browser check below. No client code reads the key (the step 6a scan confirms it).
   - **m06.** m06_follow_the_money needs one entry: its transaction server's `minigameData` lists three `withdrawals[].slot` values (`data_center/objects[0]/minigameData/withdrawals[2,8,12].slot`) equal to the custody console PIN (`data_center/objects[1].requires`). Tracing the withdrawals to the slot is the deduction, shown on screen in the unlocked object, so it is not a leak, and the object is not the lock or inside it. The marker is a one-entry edit to a main mission, made by m06's owner.
6. **Capture-secret warnings.** main already has, in `check_access_model` (validate_scenario.rb:6233-6268), the warning for a capture secret that is a password or PIN lock code with no `proof` (for `usePayload` and for an `addCapture` mapping). Step 3 does not add it again; with the extended `lock_codes`, it now also covers door-entry, combination and cryptex answers. The one new warning: a non-account `usePayload` with a `secret` but no `targetId`, and no `addCapture` mapping on its NPC, can never be served (`⚠️ WARNING: <path>: this usePayload secret can never be served`).
7. **Playtest leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` knows `creds.password` and sign-in PC, profile and locked-container contents. It learns the non-account capture secrets, so every live run checks this class too. A small playtest-tool change with its own fixture.

**Corpus effect.** m08: one error, until the user rules on q85 (section 6). m06: three matches, reported as one acknowledged clue once its owner adds the marker. Neither is fixed by this build. Step 3 lands with m08 in the known-failures list (`stage: common`, owner the m08 owner, pending q85) and with m06's marker in, or m06's three lines listed until it is. Expected warnings: the 15 legacy PCs. The builder records the corpus counts of the extended `lock_codes` before and after.

**Tests.** Node fixtures:
- leaks: a PIN copied into a global (string and number), into `minigameData`; a password inside a longer `minigameData` string; a flag answer in a global; a combination as `12-30-5` in a global and as an equal array in `minigameData`; a cryptex answer in a different case; a `@random_pin` rendered into both places (caught on the sentinel render); a four-digit leaf that equals a random PIN only on the normal render (no finding);
- lock types: `requires` with no `lockType`, locked and unlocked; a door entry with a card id and no `lockType` whose connected room is rfid (no finding: copies of lab_physical_pentest `open_plan/doors[0]` and test_gate_tailgate `office/doors[0]`); a door entry with a PIN and no `lockType` whose connected room is pin (error); a door entry whose `requires` differs from its room's (warning); a door entry `doorway_problem` flags (not resolved); a door entry with `requires` and no lock type anywhere (no "delete it" message); `requires` in `social` (no finding); a clue PIN on a note's `text` (no finding: clues are the game);
- acknowledged clues: one in `minigameData` (one note, counted in the summary); one naming the lock itself (error); one naming an object in the lock's `contents` (error); the `global:` form (error naming q85; with the constant flipped, a warning); a stale marker (warning);
- capture: the new `usePayload` warning and its passing shape; the existing proof warning on a door-entry PIN and on a combination answer.

Rails: the bootstrap does not carry `acknowledgedClues`; `authored_capture_secret` withholds a capture secret equal to an untyped door entry's PIN and to a combination answer until the proof holds. The leak scanner gets a fixture response holding a non-account capture secret.

**Live proof.** A keyless server on the builder's port: m06 started in a headless browser, `window.gameScenario.acknowledgedClues` undefined after load and after a reload; lab_physical_pentest's shoulder-surf beat played, with the capture secret appearing only from `/capture_secrets` after the capture; `verify-run.rb` showing progress on the server.

**Sync.** The bootstrap loses one key; player_state is untouched.

### Step 3b. Server-held globals (candidate, waits for q85)

Built only if the user picks option (b) in q85. Otherwise m08 is handled by an acknowledged clue (option a) or a writing change (option c), and this step is dropped.

**Change.**
1. A top-level `serverGlobals` map: `{ "<name>": { "revealWhen": <condition> } }`, where a condition is one the server can check from its own records: a room in `unlockedRooms`, a task completed by a server route, a flag submitted, an item the server put in the inventory.
2. The bootstrap and every sync answer send `""` for the global until the condition holds, then send the value once, as a delta. A client write to a server-held global is ignored.
3. Step 3's check accepts an answer held in a declared server global and errors on one that is not declared.
4. The validator checks that `revealWhen` uses only server-checkable kinds, and that no ink line reading the global can be reached before the condition holds.

**Tests.** Rails: the global is sent empty before the condition, with its value after; a client write is ignored; a reload before and after. Node: the validator rules. Live proof on m08 through to the interrogation suite, with `verify-run.rb`.

**Sync.** One bounded string per declared global, sent once as a delta when revealed; no growth. Only m08 needs it today. Size M.

### Step 4. Reference and id checks driven by schema annotations

**Why.** Reference checks exist one field at a time, so new fields arrive unchecked. The structure review's mutation test showed an eventMapping `completeTask` naming a missing task passes with no message, and `completeTask`, `unlockTask` and `unlockAim` are typed `{}`. Id uniqueness is checked only for objects directly in `rooms[*].objects` (`ValidateSocial.duplicate_object_ids`, scripts/validate_social.rb:146); duplicates inside `contents` and `itemsHeld` pass. Spot checks confirm the review: `derek_file` appears twice in m09 and `nightshade_payment` four times in m10.

**Change.**
1. A schema annotation `"x-ref": "<kind>"` on every property that names something: `room`, `npc`, `object`, `item`, `task`, `aim`, `global`, `lock` (a key lock's name), `network`, `resource`, `policy`, `role`. Arrays of references carry it on `items`. Type `completeTask`, `unlockTask`, `unlockAim` and `skipTask` as a string or array of strings with `x-ref`.
2. One shared schema walker in `lib/break_escape/schema_walk.rb` (plain Ruby, no Rails), which visits the data and the matching schema node together, resolving `$ref`, `oneOf` and `anyOf` by the data's shape. Steps 6a and 6b reuse it.
3. An index of every id by kind: room map keys; room NPCs, top-level `npcs` and `phoneNPCs`; objects at every depth (`objects`, `contents`, `itemsHeld`, `startItemsInInventory`) by `id`; tasks by `taskId`; aims by `aimId`; globals declared in `globalVariables` plus the engine-written patterns (`<npcId>_frustration`, `<objId>_screen_locked`, `<objId>_owner_away`, `<objId>_accessed`, `<jackId>_planted`) listed once in the schema under `x-engineGlobals`; lock names from key locks' `requires`.
4. Resolve every `x-ref` value against the index. Unresolved: `⚠️ WARNING` now. Existing one-off checks that already error (connections, `targetRoom`, `unlockDoor`) keep their level.
5. Uniqueness: an id used twice by objects at any depth is a warning; an NPC id used twice is a warning; the same string used as ids of two kinds that a bare-string field could confuse (a task and a global) is a note in the report.
6. Replace the hard-coded room `type` enum with a check against the room map files, as the validator already does for object sprites (fixes test_desk_seating for good).

**Promotion to errors.** After the 5 scenarios with duplicate ids are fixed: m09_digital_archaeology and m10_full_disclosure (main missions: their owners), lab_tesseract_trials (labs track), npc-hub-demo-ghost-protocol (this build: a demo) and test_access_social (this build). The promotion is one commit that flips the level and runs the corpus. The builder checks whether the server's unlock lookup (first hit by id) makes any of these duplicates a live bug and, if it does, reports it to the owner as a bug, not a nit.

**Tests.** Node fixtures for each kind (a missing task in `completeTask`, a missing aim, a missing global in a condition, a missing network on a room), duplicates in `contents` and `itemsHeld`, an engine-written global accepted, and the structure review's whole mutation set re-run as one fixture with every finding expected. Corpus: counts of the new warnings per scenario in the build log.

**Sync.** No runtime change.

### Step 5. One `ScenarioBinding` in `lib/` for every renderer, and a JSON-safe helper for ERB

**Why.** Each tool that renders a `scenario.json.erb` carries its own binding, or none, and they have drifted. The server's `vm_flags_json` returns `{"flag_1": ..., "flag_2": ...}`, and `'{}'` when a VM context is present but names no flags for that VM (`app/models/break_escape/mission.rb:394`). The validator's returns `flags_for_vm`, a plain array, and the fallback array when the VM is missing (`scripts/validate_scenario.rb:102`). 11 templates call `vm_flags_json` (m01 to m10 and test_simple_vm_flag), so the validator has been checking a top-level `flags` shape the server never builds; its one reader of that shape, `check_vm_flags_load_bearing` (`validate_scenario.rb:5741`), skips anything that is not a Hash, so its literal-to-ref map has always been empty. Separately, values are pasted into JSON text, so a string with a quote breaks the render unless the author remembers `.to_json`.

**Every renderer on main:**

| File | What it is | Action |
|---|---|---|
| `app/models/break_escape/mission.rb:337` (class) and `:209` (`ERB.new`, no trim mode) | the server's class, the truth | moves to lib |
| `scripts/validate_scenario.rb:57-110` | the validator's copy | deleted; `require_relative` the lib file |
| `scripts/generate_dungeon_graph.rb` | its own class; `vm_flags_json` returns the fallback array (the same drift); feeds the dungeon-graph skill. build/unlock-gaps-r1 also edits this file (lock labels) | deleted; `require_relative` |
| `tools/pass2/render.rb` | top-level `vm_object`, `flags_for_vm`, `vm_flags_json`; renders with `trim_mode: '-'` | deleted; `require_relative` and `ScenarioBinding.render` |
| `scenarios/lab_tesseract_trials/tools/render_scenario.rb` | its own class | deleted; `require_relative` (the labs track is told) |
| `scripts/check_door_alignment.py` | Ruby embedded in Python, run through `ruby`, with `trim_mode: '-'` | the embedded Ruby becomes `ruby -r <repo>/lib/break_escape/scenario_binding.rb -e 'print BreakEscape::ScenarioBinding.render(File.read(ARGV[0]), {})'` |
| `scripts/ink_runtime_check/m02_routes/route.js`, `m05_routes`, `m07_routes`, `m08_routes` | Ruby embedded in JS, run through `ruby` | the same one-liner |
| `scripts/ink_runtime_check/sis02_multicall.mjs:67` | bare `ERB.new(...).result`, no binding | the same one-liner |
| `test/js/validator-office-presets.test.mjs:85` (test_needs_sims) | bare render, no binding | the same one-liner |
| `test/js/validator-action-condition.test.mjs:134` (test_exercise_station) | bare render, no binding | the same one-liner |

The three bare renders work only because their templates call no helper; they would break as soon as a template adopts `json(...)`.

Left out, with reasons:
- `app/services/break_escape/tts_line_extractor.rb`, `tts_expected_lines.rb`, `tts_batch_processor.rb`, `tools/playtest/swap-scenario-game.rb`, and three TTS tests (`test/controllers/break_escape/tts_controller_test.rb`, `test/unit/break_escape/tts_mission_lines_test.rb`, `test/unit/break_escape/tts_stored_room_order_test.rb`): they already use `Mission::ScenarioBinding`, which the alias keeps working.
- `tools/playtest/new-game.rb`: it scans the template text with a regex for VM names and renders nothing.
- `scenarios/m07_architects_gambit/.ALIGNMENT_PLAN.v1.bak`: a backup file, not code.

**Change.**
1. Move the class to `lib/break_escape/scenario_binding.rb` as `BreakEscape::ScenarioBinding`, plain Ruby (`securerandom`, `json`, `erb`), with the server's behaviour as the truth. Keep `Mission::ScenarioBinding` as an alias constant. Add `BreakEscape::ScenarioBinding.render(template_text, vm_context)`, used by `Mission#generate_scenario_data`, the validator's `render_erb_to_json` (validate_scenario.rb:125) and every tool in the table. `render` uses the server's ERB options (no trim mode). No template uses `-%>` today; the build log notes that `tools/pass2/render.rb` and `check_door_alignment.py` lose `trim_mode: '-'`. The `sentinels: true` option from step 3 lives here once step 5 lands.
2. Add `json(value)`: returns `value.to_json`, for `"title": <%= json(title) %>`. Document it in the README's ERB section beside `.to_json`.
3. Replace each copy as the table says.

**Tests.** Rails unit test of each helper (`vm_object`, `flags_for_vm`, `flags_for_vm_slice`, `vm_flags_json` with and without a context, `json` with quotes, backslashes and non-ASCII). A test that `Mission::ScenarioBinding` is the lib class. A node test that each Python and JS caller renders m01 identically to the lib class. Corpus: render all 176 scenarios with random values stubbed, before and after; the JSON is identical except the top-level `flags` of the 11 `vm_flags_json` users, which now match the server. Dungeon graphs of those 11 before and after, kept in the build log (the graphs are not committed). Validator over m01 to m10 before and after: `check_vm_flags_load_bearing` sees a Hash for the first time, so its warnings will change. Each change is recorded in the build log with a verdict (a real finding for the mission's owner, or a check bug fixed here); none is called a bug by default.

**Sync.** No runtime change (the server's output is unchanged by construction).

### Step 6. Secrecy as a schema property

**Why.** Which values are secret is decided by hand-kept lists, and the format does not show them:
- The bootstrap (`Game#filtered_scenario_for_bootstrap`, game.rb:1094-1186) allow-lists room fields but deny-lists the top level by name: `flags`, `accountProfiles`, `roles`, the network keys, feed facts, capture secrets, grant contents, `targetFlags`. A new secret-bearing top-level block ships unless someone adds it to the list.
- Two near-copies strip `requires` with the same rule, keyed on the node's own `lockType`: `Game#filter_requires_and_contents_recursive` (game.rb:4668) and `GamesController#filter_requires_recursive` (games_controller.rb:1917, called on the bootstrap at line 286). build/unlock-gaps-r1 adds `strip_lock_answers!` (combination and cryptex answer copies, and start-inventory answers) to both.
- Per-feature lists: `WITHHELD_NPC_KEYS` and `WITHHELD_WORK_NPC_KEYS` (game.rb:4783-4787), `NetworkAccess::WITHHELD_OBJECT_FIELDS`, the `puzzle_graph_*` strip, `DeclaredGrants`, and the capture-descriptor walk that withholds every `capture`, `addCapture` and `usePayload` secret at any depth.
- 33 schema descriptions say "never sent to the browser" in prose; nothing machine-readable.

Once unlock-gaps-r1 is in, no leak is known in these filters. Step 6 therefore starts with marks and scans that would catch the next one (6a), and replaces the filters (6b) only if the scans find a gap.

#### 6a. Marks, the payload scan and the client-read scan

No engine change. In `scripts/scenario-schema.json`:
- `"x-serverOnly": true` on every secret property (section 2's list), with `"x-servedBy": "<route>"` where a route serves it once earned (`GET /container`, `GET /network`, `GET /capture_secrets`).
- A conditional form for `requires`: `"x-serverOnly": { "unlessLockType": ["biometric", "bluetooth", "rfid"] }`, with the lock type resolved as in step 3 (on a door entry, the entry's `lockType`, else the connected room's: `"lockTypeFrom": "connectedRoom"` on the door entry definition). A card id under an rfid door entry stays client-visible. A `requires` with no resolved lock type, on an object, counts as secret (fail closed).
- Whole-record rules: NPC `creds`, `role`, `awareness`, `habits`, `workarounds`, `workNeeds`, `frustration`, `feed`, `usbHabit`.
- `"x-client": true | false` on every top-level authored property. The schema first declares every top-level key the corpus uses. Ten are undeclared today, and step 3 adds an eleventh; each gets a decision from its readers on main:

| Key | Scenarios | Readers on main | `x-client` |
|---|---|---|---|
| `scenario_id` | 94 | none | false (dead; 7.5) |
| `scenario_name` | 94 | client: `bond-visualiser.js:1747` (mission name), and `npc-needs.js:5234`, the office-life seed when a scenario has no `npcNeedsSeed` | **true** (a seed) |
| `exportGlobals` | 24 | none in code (documented in a comment, `carry_over.rb:5`) | false |
| `importGlobals` | 23 | server only, at creation (`carry_over.rb`) and in TTS extraction (`tts_line_extractor.rb`) | false |
| `description` | 4 | none | false |
| `name` | 3 | client: `npc-needs.js:5234` (seed fallback after `npcNeedsSeed` and `scenario_name`) | **true** (a seed) |
| `globalItems` | 2 (basic_mission, vm_free_mission) | none | false (q86) |
| `validSprites` | 2 (m01, lab_tesseract_trials) | server only (`avatar_unlocks.rb`, the player preferences controller) | false |
| `timedMessages` | 1 (timed_messages_example) | none at the top level (the NPC manager reads each NPC's own `timedMessages`) | false |
| `showTitleScreen` | 1 (title-screen-demo) | none (`main.js` starts the title screen unconditionally) | false |
| `acknowledgedClues` | 1 once m06's marker lands | none; deleted from the bootstrap in step 3 | false |

The three scenarios with a top-level `name` (test-ble-scanner, test-rfid-multiprotocol, test-rfid) have no needs NPCs, so the seed fallback changes nothing today; it would for a future needs scenario that relies on it.

All but `acknowledgedClues` ship today, because the bootstrap's top level is a deny list. Marking them `x-client: false` changes nothing at runtime in 6a; it states what 6b would do.

**Server-added bootstrap keys.** After `filtered_scenario_for_bootstrap`, the controller's `scenario` action adds 26 top-level keys (games_controller.rb:293-408: `objectivesState`, `scenarioBriefShown`, `submittedFlags`, `wornItem`, `savedGlobalVariables`, `savedNotes`, `savedBiometricSamples`, `savedNpcInkVariables`, `savedTriggeredEvents`, `savedTimedMessages`, `savedScenarioClock`, `commandBoard`, `savedCommandBoardLog`, `savedNpcVisibility`, `savedNpcHostility`, `savedPlayerHealth`, `savedPhoneState`, `savedMailState`, `sessions`, `signedInPcs`, `footholds`, `gainedFootholds`, `npcFrustration`, `feedPosts`, `lockoutPcs`, `playerInventory`), and the model adds `characterSprites` (game.rb:1101). None is authored and none belongs in the schema. They go in a constant, `SERVER_BOOTSTRAP_KEYS`, defined beside the controller code that adds them (and including `characterSprites`). A new server-added key goes into that constant in the same commit that adds it. A node test checks that the constant equals the set of `filtered['<k>'] =` assignments in the controller's `scenario` action and in `filtered_scenario_for_bootstrap`, so a key added without the constant fails.

**Tests (6a).**
- **Rails, payload scan over every scenario** (one file, tagged so it can run alone). For each scenario it creates a standalone game and scans two states:
  - *Fresh:* the state a new player receives.
  - *Opened:* the test writes player_state directly, as `test/models/break_escape/access_model_withholding_test.rb` does: every room id into `unlockedRooms`, every object and container id at any depth into `unlockedObjects`. Where a route also needs a session or foothold (sign-in PCs, account profiles, file shares), it seeds one the way `access_model_withholding_test.rb` and `network_withholding_test.rb` do.

  In each state it fetches `GET scenario`, `GET room/:id` for every room and `GET container/:id` for every container. In the fresh state a refusal passes. In the opened state a refusal fails unless the test lists that route and id with a reason (for example a container that needs a foothold the test cannot seed).

  Assertions, with the schema walker: no field marked `x-serverOnly` (with the resolved lock type for `requires`) appears at any path, except a field with `x-servedBy` on the route that serves it; and no authored secret value appears as a response leaf, by step 3's matching rule (equality after the text forms, or a whole word inside a string leaf for an answer of 6 or more characters), unless the same value is also authored in a client-visible field or covered by an acknowledged clue. The scan names title-screen-demo and timed_messages_example among its cases, and test_gate_tailgate and lab_physical_pentest, whose door entries' card ids must still be present in the room payload in both states.
- **Node, top-level client-read scan.** First an assignment scan of `public/break_escape/js` finds every identifier bound to `window.gameScenario` or `window.gameState.scenario`, including `this.<name> =`, destructuring (`const { rooms } = window.gameScenario`) and aliases of `window` itself (`const w = window`, then `w.gameScenario`). On main these include `scenario` (`main.js:178`, `core/player.js:203`, `door-gaps.js:11`), `gameScenario` (`core/game.js:1666`, `core/rooms.js`, `collision.js:157`, `minigame-starters.js`), `this.scenario` (`person-chat-minigame.js:55`) and `w` (`npc-needs.js`, `consumables.js`). The list of bound names is kept in the test, so a new alias fails until it is added. Then every read of `<bound>.<k>`, `<bound>?.<k>` and `<bound>['<k>']` (a string literal) is collected. Each key must be declared in the schema with `x-client: true`, or be in `SERVER_BOOTSTRAP_KEYS`. A read the schema would not ship fails.
- **Nested reads** are not scanned by name. A name scan cannot tell an rfid `requires` from a PIN `requires`, so its allow list would start at about 250 entries and say little; the opened-state payload scan catches the actual leak.
- Node: every top-level key in the rendered corpus is declared in the schema with an `x-client` value.

**What 6a's scan settles.** Any field that reaches the browser but should not, in either state, or a top-level key the client reads that the bootstrap would drop, is fixed in the existing filters at once (a small engine change with live proof). The decision to start 6b rests on the opened-state scan, because it covers every payload a route can ever send: if it finds a gap, 6b starts; if it finds nothing across every scenario and route, 6b waits until a new secret-bearing block arrives. A finding only in the fresh state is fixed in place and does not start 6b by itself.

**Sync.** No runtime change.

#### 6b. One client serialiser (conditional)

Starts only if the 6a opened-state scan finds a gap, or when a new secret-bearing block is added to the format.

**Change.** `lib/break_escape/client_scenario.rb` (plain Ruby) compiles the annotations once at boot into a table per schema definition, and strips a node in place with the step 4 walker. It covers the bootstrap, lazy room payloads and container payloads, and replaces `filter_requires_and_contents_recursive`'s requires rule, the controller's `filter_requires_recursive`, `strip_lock_answers!`, the two NPC key lists and the capture walk.

The top level becomes an allow list, applied inside `filtered_scenario_for_bootstrap`, before the controller adds its runtime keys: an authored key with no `x-client: true`, including one the schema does not know, does not ship. Keys in `SERVER_BOOTSTRAP_KEYS` are added afterwards by the controller and are not touched by the allow list.

Door entries resolve their lock type from the connected room before the `requires` rule, so a PIN on an untyped door entry is stripped and a card id on an rfid door entry stays. State-dependent work (unlocked rooms, `hasPresentNpc`, `flagUnlockedRemotely`, `pinLength`, objectives state) stays where it is; only the secrecy rule moves. Subtrees the schema does not describe (an open core kind's unknown key, `minigameData`) are kept as authored, so the old per-feature lists stay as a second pass until the parity test shows the table covers them; then they are deleted in a separate commit.

**Capture secrets.** The capture walk becomes `secret` marked `x-serverOnly` with `x-servedBy: "/capture_secrets"` in the three capture descriptor definitions, with the serving code unchanged. Its tests (`capture_payload_secret_test.rb`, `capture_payload_secret_routes_test.rb`, the withholding tests) stay as regression tests.

**Cost.** The walk runs once per game, not per request. `scenario_data` is written only at creation (`Game#generate_scenario_data`, game.rb:4837); the one other writer is the playtest tool `tools/playtest/swap-scenario-game.rb`. The stripped copy is cached in `Rails.cache` (the app's configured store, never a process-memory hash), keyed by game id and a digest of the compiled annotation table (computed once at boot, so a deploy that changes a mark rebuilds every entry), with `expires_in: 1.hour`. The expiry and the store's own size limit bound it, so it does not grow with the number of games; the swap tool deletes its game's entry. Where the configured store is a null store (some development setups), the walk runs on every bootstrap and must still meet the target. The state-dependent fields are applied per request on top. Measure on m10 (the largest scenario, 363 KB of ERB) and lab_physical_pentest; target under 20 ms for the first bootstrap.

**Tests (6b).**
- Rails, two-sided parity, in both of 6a's states (fresh and opened): for every scenario and every route, the old filters' output and the new serialiser's output are compared path by path. It fails on every path the new serialiser keeps that the old one removed (a leak), and on every path it drops that the old one kept (a regression), unless that path is in a reviewed list in the test file with a reason. Expected entries in that list: the top-level keys marked `x-client: false` in 6a, and `requires` on the 15 legacy unlocked PCs. The test is deleted with the old lists.
- Rails, top level: a scenario with an unknown top-level key `secretThing` does not ship it; `scenario_name` and `name` do; every key in `SERVER_BOOTSTRAP_KEYS` still arrives.
- The 6a payload and client-read scans, unchanged.
- Existing: `filtered_scenario_test.rb`, `access_model_withholding_test.rb`, `network_withholding_test.rb`, `lab_physical_pentest_secrets_test.rb`, `capture_secret_test.rb`, `access_model_no_password_test.rb` all pass unchanged.

**Live proof.** A keyless server on the builder's port; headless browser runs, each with a reload partway: m01 (gold standard: PIN door, flag station), test_access_sessions (sign-in PC, account password never in `window.gameState.scenario`), test_access_networks (Wi-Fi join; `psk` absent until joined), test_unlock_gaps (combination and cryptex), test_gate_tailgate (walk through the gate once: the door sign and the clone-as-entry credential still work), test_needs_sims (office-life rolls unchanged across the reload, so the seed still arrives), title-screen-demo and timed_messages_example (they still start and run), and lab_physical_pentest with the shoulder-surf beat played (Ruth's mapping for Len's records PIN: the capture secret appears only after the capture, from `/capture_secrets`). In each, a console scan of the bootstrap and every loaded room for the scenario's secrets, and `tools/playtest/verify-run.rb` showing progress on the server.

**Sync.** Payloads shrink or stay the same; player_state is untouched.

## 5. Merge order

Branches that touch the same files as this plan (`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `app/models/break_escape/game.rb`, `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/mission.rb`, `scripts/generate_dungeon_graph.rb`, `public/break_escape/js/systems/doors.js`, `lib/break_escape/capture_model.rb`). State recorded 2026-11-12 15:23 UTC, main at 33c003230:

| Branch | Tip | Ahead of main | Merges with main | Files shared with this plan |
|---|---|---|---|---|
| build/c3-replies | 6d222c6fa | 0: merged | | |
| build/usepayload-secret | 91849ba67 | 0: merged (validator capture-proof warning, `CaptureModel`) | | |
| build/keypin-seed | a524171df | 0: merged | | |
| build/readme-93b | 3da7627c5 | 0: merged | | |
| build/unlock-gaps-r1 | 8042190b2 | 10 (supersedes build/unlock-gaps) | clean | schema, validator, game.rb, controller (`strip_lock_answers!` in both filters), `doors.js` (`cryptexConfig` on the door properties, entry else connected room), `generate_dungeon_graph.rb` (lock labels) |
| build/sync-deltas | f03396201 | 24 (includes build/sync-proof-tools 7bca2de76) | clean | game.rb, controller: the bootstrap and sync paths |
| build/phone-calls | 56a9e74b2 | 159, based on 552c2d718 | **conflicts** | validator, `mission.rb`, game.rb, controller, `tts_line_extractor.rb` |
| build/phone-calls-writing | 734b6e922 | 159, based on 552c2d718 | **conflicts** | the same |

Pairwise (`git merge-tree --write-tree`): build/sync-deltas and build/unlock-gaps-r1 conflict in `games_controller.rb`, in the inventory route (unlock-gaps-r1 answers with the inventory; sync-deltas removes that echo under the sync size rule). That overlap is being settled between those two branches; this plan needs only that they land in separate batches. build/phone-calls conflicts with both, and with main.

The table is regenerated at each merge batch, with the time recorded, from:
```
git for-each-ref --format='%(refname:short) %(objectname:short)' refs/heads/build/
git rev-list --count main..<branch>
git merge-tree --write-tree main <branch>
git merge-tree --write-tree <branch-a> <branch-b>    # each pair still open
```

Order:
1. **Done:** build/c3-replies, build/usepayload-secret, build/keypin-seed, build/readme-93b are in main.
2. **build/unlock-gaps-r1** and **build/sync-deltas**, in separate batches; the second rebases on main after the first. Step 3 needs unlock-gaps-r1 (combination and cryptex lock types); step 5 rebases after it (`generate_dungeon_graph.rb`).
3. **build/phone-calls** and **build/phone-calls-writing** rebase onto main before step 1 or step 5 lands. If they land after, whoever merges second redoes step 1's label rename on their validator lines and step 5's binding move in `mission.rb`.
4. **Step 1** (exit code and the known-failures list), once this build's 41 lines and 4 fixtures are fixed and every other line is fixed or listed. Every later branch then fails its own merge batch on any unlisted `❌`.
5. **Steps 2, 3, 4 and 5**: validator, schema, lib and tools; they can be built in parallel worktrees and merged one per batch. Step 3 lands after unlock-gaps-r1, with m08 listed (q85) and m06's marker in or its lines listed.
6. **Step 3b**, only if the user picks q85 (b).
7. **Step 6a.** Then **6b** only if the opened-state scan finds a gap, rebased on main after unlock-gaps-r1 and sync-deltas, because it replaces the code they change.
8. The upgrader slice (section 8), only with the first approved step that rewrites stored data.

Each batch moves main only to the commit the full suites ran on, and runs the validator over every test scenario a merged branch touched.

## 6. Questions for the user

1. **q85: m08's door PIN in a global.** Netherton's voiced ink needs to say the suite code, and ink reads globals in the browser. Options: (a) accept it under the cheat policy as a voiced clue, marked as an acknowledged clue in a global (step 3, item 5), which the leak check reports as a warning ("ships at game start") and allows; (b) server-held globals (step 3b): the global holds `""` until a server-checkable condition holds, then the value arrives as a delta; (c) change the beat so the code is read off the card and Netherton never says it. (a) is cheapest, and it opens the `global:` marker form to every scenario, each use a warning reviewed at the merge batch; (b) is new engine work (size M); (c) changes the mission's writing and its cached audio. Until the answer, m08's line sits in the known-failures list and the `global:` form is rejected.
2. **q86: basic_mission and vm_free_mission.** They fail the schema (top-level `globalItems` and other undeclared keys). Facts on main: neither `mission.json` has a `collection`, so `db/seeds.rb` puts both in the `default` collection with `published = true`: they are listed as playable missions wherever seeds ran. Deleting a folder makes the next seeds run offer the orphan delete, which destroys each mission with its games and Hacktivity listings (typed confirmation at a terminal, or `BREAK_ESCAPE_PRUNE=1`). Nothing else in the repository refers to them except two docs. If kept, the fix is S: move the undeclared keys into the schema's form and add `"collection": "testing"` to each `mission.json`. Fix them as examples, or delete them?
3. **q83: access and office-life consolidation** (section 7, 7.1 to 7.3). One owner field, one outage field and grammar, habits in one block. Size L; 9 scenarios plus `lockChance` in 6; owners: this build's test scenarios, the labs track (lab_physical_pentest), and the engine (`owner_claim.rb`, the habits loader). It brings in the upgrader (section 8). Yes or no, or a subset.
4. **q84: closing the older core kinds, and `formatVersion`** (section 7, 7.4 and 7.5). It splits into three parts, each a separate yes:
   - (i) **`formatVersion` alone:** S, one line in each of the 176 templates (including m01 to m10, whose owners are told; no spoken text), a schema field and a validator warning when it is missing. No upgrader. This is the cheap yes.
   - (ii) **7.5, drop dead fields:** M, up to 146 scenarios, every track, mechanical. No upgrader.
   - (iii) **7.4, close the core kinds:** M to L, 37 scenarios, after (ii). The upgrader only if an alias is retired.

## 7. The migrations (not in scope; for the user to pick)

Each needs scenario edits and waits for a decision. The upgrader slice (section 8) is built with the first approved step that rewrites stored games' data.

| Question | Parts | Size | Scenarios | Owners touched | Brings in the upgrader |
|---|---|---|---|---|---|
| q83 | 7.1, 7.2, 7.3 | L | 9, plus `lockChance` in 6 test scenarios if precedence changes | this build (test scenarios), labs track (lab_physical_pentest), engine | yes: 7.1 and 7.3 rewrite stored fields, and 7.3 needs the raw-shape handling (section 8, problem 2) |
| q84 (i) | `formatVersion` | S | 176, one line each | every track, including m01 to m10 | no |
| q84 (ii) | 7.5 | M | up to 146 | every track | no |
| q84 (iii) | 7.4, after 7.5 | M to L | 37 | every track | only if an alias is retired |

### q83: 7.1, 7.2 and 7.3

#### 7.1 One `owner` field
- Changes: an `owner` (NPC id or list) and `private: true` on objects and items replace `screenOwner`, `affordance.owners`, `phoneOwner`, `phoneOf` and `leftBehindBy`; `needsHome` goes back to meaning movement only.
- Affects 8 scenarios: lab_physical_pentest, test_access_habits, test_access_sessions, test_access_social (with C3's additions), test_access_work, test_capture_log, test_clone_left_card, test_needs_sims. Main also has `lib/break_escape/owner_claim.rb` (q78), which derives owners from `needsHome` and must read `owner` first.
- Stored games: copy each old field into `owner`, and write an explicit `owner` wherever the old rule derived one from `needsHome`, so old saves behave as before. player_state is keyed by object and NPC ids, which do not change.

#### 7.2 One outage field and one condition grammar
- Changes: `offWhen` moves from `affordance` to the object and replaces `downIf` on networks and resources, all in the requireGlobal form (a name, or `{ name: value }`); `spriteVariants` accepts the same form.
- Affects 4 scenarios: test_access_networks, test_access_social, test_access_work, test_needs_sims.
- Stored games: `downIf: "g"` becomes `offWhen: "g"`; `affordance.offWhen` moves up a level. The server's two failure causes (`down`, `off`) are recorded per event, not stored, so saves need nothing more.

#### 7.3 Habits in one block
- Changes: `screenHabit`, `printHabit` and `usbHabit` fold into `habits.screen`, `habits.print`, `habits.usb`; `awareness` stays the preset that fills them; the person's habit beats the PC's `lockChance`, and the validator prints each workstation's effective lock rule.
- Affects 5 scenarios (test_access_habits, test_access_social, test_access_work, test_needs_sims, lab_physical_pentest), plus `lockChance` on PCs in 6 test scenarios if the precedence changes.
- Stored games: move the three fields. Where the new precedence would change an old save's outcome, write the PC's old `lockChance` into the owner's habit so the save keeps its behaviour. These are the fields `NpcHabits.expand!` fills at creation, so the upgrader step must work on raw-shaped data (section 8, problem 2). The seeded screen roll is not stored, so nothing in player_state moves.

### q84: `formatVersion`, then 7.5, then 7.4

#### `formatVersion` alone
- Changes: a top-level integer `formatVersion` in the schema (`x-client: false` until the upgrader needs the client to see it), set to `1` in every template, and a validator warning when it is missing. The engine does not read it yet.
- Affects all 176 templates, one line each; no spoken text, so cached audio is safe.
- Stored games: none. New games carry the field from creation; old games have none, which the upgrader later reads as version 0.

#### 7.5 Drop dead fields (the first step of the closure)
- Changes: remove `endGoal`, `version`, `scenario_id`, object `isEndGoal`, eventMapping `autoTrigger`, `note_title` and `note_content`; move title fields into `mission.json`.
- Affects up to 146 scenarios (`endGoal` 146, `scenario_id` 94, `version` 87, `isEndGoal` 9, `autoTrigger` 7, `note_*` 2). Mechanical; no spoken text changes, so cached audio is safe.
- `scenario_name` and `name` seed office life (`npc-needs.js:5234`), and `scenario_name` also names the mission in `bond-visualiser.js`. Move them only after `npcNeedsSeed` is written into every needs scenario (its value set to the current `scenario_name`, so old and new games roll the same) and the visualiser reads the name from `breakEscapeConfig`.
- Stored games: nothing reads the dropped fields, so old games can keep them; no upgrader step is needed.

#### 7.4 Close the core kinds
- Changes: add the fields from the structure review's M2 table to the schema, then `additionalProperties: false` (with `^_` allowed) on room, object, NPC, eventMapping, objective and task, and delete the hand lists in `check_unknown_fields`.
- Affects 37 scenarios that carry unknown-field warnings today, once 7.5 has removed or declared the dead fields.
- Stored games: none for the closure itself, which is a validator rule. Any alias it retires (`target_room`, `roomId`, `task_id`, `setVariable`) becomes an upgrader step that rewrites it to the current spelling; retiring none keeps the upgrader out.

## 8. Deferred: the load-time upgrader

Not built in this plan. A game stores the rendered scenario at creation (`before_create :generate_scenario_data`, game.rb:33 and 4837), so every rename is read in both spellings for as long as old games exist (the `key_id` to `opens_lock` fallbacks in `window.lockRef` and `lib/break_escape/item_identity.rb` show the cost), and the access loader `prepare_scenario_data!` (game.rb:1068) runs only at creation. An ordered list of pure, idempotent upgrade steps, keyed on `formatVersion`, would fix that.

**Trigger.** The slice starts with the first approved step that rewrites stored data: any q83 migration, or a q84 alias retirement. It is built with that step as its first real step, after build/sync-deltas has merged. A yes to q84 (i) adds the field only and does not start the slice; a yes to q84 (ii), or to (iii) with no alias retired, does not start it either.

Four problems its design must solve:

1. **No lock on the load path.** `set_game` (`games_controller.rb:1754`) is a plain `Game.find`. `with_game_lock` is an `around_action` for some routes (line 93) and excludes `show` and `scenario`, the two that run first on a load, and the client fetches rooms while the bootstrap is in flight. An upgrade on load must run in one helper, called from `set_game` and from every route that reads `scenario_data` without it, as `@game.with_lock { reload; upgrade if still old }`, so a second request finds the work done.
2. **Two data shapes.** `generate_scenario_data` calls `prepare_scenario_data!` itself (game.rb:4867), so at creation a step would see raw data, and at load it sees prepared data (habits expanded, ids stamped). Migrations 7.1 and 7.3 move exactly the fields `NpcHabits.expand!` fills. At creation the upgrade belongs inside `generate_scenario_data`, between `mission.generate_scenario_data` and `prepare_scenario_data!`; at load, run the steps and then `prepare_scenario_data!` again (it is idempotent, per its comment above game.rb:1068), so every step is written against raw-shaped fields.
3. **player_state carries old shapes too.** `add_inventory_item!` (game.rb:170) stores the whole item hash in `player_state['inventory']`, so an old save's held key carries `key_id` there. While player_state is left untouched, the client fallbacks (`helpers.js`, `inventory.js`, `npc-game-bridge.js`, `objectives-manager.js`) cannot go. A rename pilot must either rename the key in player_state items in place (same size, so q77 holds) or keep the fallback.
4. **The sync path bypasses the loader.** `sync_state` loads only `SYNC_STATE_COLUMNS` (`games_controller.rb:783`) and never passes through `set_game`, and a tab opened before an upgrade keeps sending the old shape as deltas (build/sync-deltas seeds its "confirmed" state from the bootstrap). Nothing maps old keys on the way in. So player_state transforms stay out of the framework until a migration needs one; when one does, the bootstrap carries `formatVersion` and the client reloads when a sync answer reports a different one.

Other settled points: a stored `formatVersion` above the code's (code rolled back after games were upgraded) refuses to load with a clear message; the validator runs the upgrade on a copy and warns once per old spelling; releases that add a step say so in their notes.

## 9. Risks

- **Step 1 blocks other work.** Once errors fail the run, any branch carrying an unlisted `❌` fails its merge batch. The known-failures list keeps other tracks' lines visible with their owners without blocking, a stale entry fails the run so the list cannot rot, and the stage rule keeps partial runs (`--skip-ink`, CI's social job) from failing on lines they never checked.
- **The known-failures list or the clue markers grow quietly.** An entry needs an `approved` heading in the pass log that the node test checks; every batch diffs the list file and greps for `acknowledgedClues`, and the orchestrator signs off each addition. Markers are counted in every summary line. A passed `reviewBy` fails the merge-batch suites.
- **A clue marker hides a real leak.** A marker cannot name its own lock or anything inside it, and the `global:` form is rejected until q85 is answered, then printed as a warning.
- **Step 3 tells an author to delete a live field.** The door-entry lock type is resolved from the connected room, as the client does, and a door entry is never told to delete its `requires`; two corpus door entries are fixtures.
- **Step 3 changes which capture secrets the server withholds.** The extended `lock_codes` withholds secrets equal to door-entry, combination and cryptex answers until their proof holds. The corpus check shows no served capture changes today; Rails tests and the lab_physical_pentest live run cover it.
- **The 6a scan misses locked content.** It scans an opened state as well as a fresh one, and an unexplained refusal in the opened state fails.
- **Step 6b strips a field the client needs.** The two-sided parity test in both states, the top-level client-read scan with its alias list, `SERVER_BOOTSTRAP_KEYS` and the live runs exist for this. `scenario_name` and `name` are the known top-level cases (mission name and office-life seed); the rfid door entries' card ids are the known nested case.
- **Step 6b cost per request.** The stripped copy is cached per game in `Rails.cache` with an expiry; the build log records the measurement.
- **Other tracks editing the same scenarios.** No builder edits a mission, lab or escape room without the orchestrator's confirmation from its owner.
- **Long-lived branches.** build/phone-calls and build/phone-calls-writing conflict with main and touch the validator and `mission.rb`; they rebase before step 1 and step 5, or the second to merge redoes the rename and the binding move.
