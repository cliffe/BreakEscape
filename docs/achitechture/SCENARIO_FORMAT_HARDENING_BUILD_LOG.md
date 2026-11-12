# Scenario format hardening: build log

Plan: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` (Final). Branch `build/harden-step1`, made from main f2d53bb40 with the Final plan merged in (e94325cd3).

## Step 1. The validator's exit code matches its output

Date: 2026-11-12. Line numbers in the plan were taken on 33c003230; on f2d53bb40 `def main` sat at `scripts/validate_scenario.rb:6780`, the common stage at 6949-6970 in the plan is the same 22 calls, and the early exits were at 6833 (no file), 6855 (directory), 6903 (structure), 6939 (ink), 7090 (schema), 7152 (graph key), 7163 (strict social) and 7184 (rescue).

### What changed

- **One writer.** `scripts/validator_report.rb` (`ValidatorReport`) replaces `$stdout` while `main` runs, so every line, including those a module prints itself, goes through it. A line holding `❌` is an error tagged with the current stage (`ink`, `schema`, `common`, `habits`, `work`, `social`); a line that starts (after a list number) with `⚠️` is a warning; section headers go through `header` and are never counted. `finish` prints any stale-entry lines and `Result: <n> errors (<k> known), <m> warnings`, plus `; <j> known failure(s) not checked (<stage> skipped)`, and returns the exit code: 1 when an unlisted error remains.
- **One label.** `❌ INVALID:` became `❌ ERROR:` (114 sites in validate_scenario.rb on f2d53bb40, not the 108 the plan counted). `❌ SOCIAL:` became `❌ ERROR: SOCIAL:` in validate_social.rb and `validate_social/{mail,dm_app,pretext,options}.rb`.
- **Schema errors** print as `❌ ERROR: schema: <json pointer> (<room, object or NPC>): <message>` without the gem's `in schema <uuid>` tail (`format_schema_error`, `describe_schema_pointer`).
- **Every section prints.** Directory, structure, schema and ink-check failures no longer exit. Structure errors print in the schema stage and the run goes on, so a `rooms` string reaches the schema and the checks (which then print `could not run`). Only a failed ERB render stops the run (nothing to check), and it still prints `❌ ERROR: ERB render could not run` and the Result line.
- **Ink compile failure.** `check_ink_files` already skips the compiled-JSON checks for a file that fails to compile; the run now says so (`⏭️ <n> ink file(s) failed to compile ...`) and marks the ink stage as not run in full.
- **A rescue per check.** `ValidatorReport#run_check` wraps each of the 22 common calls (including `NpcHabits.expanded_copy`, `ValidateNpcNeeds`, `ValidateAccessWork`, `ValidateNpcHabits`), the directory, structure, unknown-field, wiring (objectives, scoring, result, ending check), geometry, door, ink, dialogue lint, schema, social, habits report, work report, recommended-field and desk-box calls. An exception prints `❌ ERROR: <check> could not run: <class>: <message>`, marks its stage as not run in full, and the next call runs. Before, the three mission.json wiring checks shared one silent `rescue`; each now reports.
- **Social.** Social lint and `#/social` schema lines print in the social stage and fail the run like any `❌`. `--strict-social` stays accepted (CI passes it) and only prints the old count line, which four tests read.
- **Known failures.** `--known-failures <file>` (default `scripts/validator_known_failures.json`) and `--no-known-failures`. Matching is per scenario (repo-relative path, or the absolute path a test passes), per stage, by substring, up to `count` lines; `could not run`, `stale known failure` and `Result:` lines are never matched, and a `match` that is part of `❌ ERROR: ` is ignored. A broken list file prints `❌ ERROR: known-failures list could not run`.
- **AGENTS.md** gains the plan's line in its "Verifying work" validator bullet. `docs/agents/VALIDATOR_DECISIONS.md` is new.
- **README.** `README_scenario_design.md`: a new "The exit code is the answer" section under "Running the Validator" (labels, every section prints, could-not-run, the Result line, social schema errors fatal on every run, the known-failures list), the `--strict-social` section reworded, and two `❌ INVALID` mentions renamed. `README_ink_best_practices.md`: one label renamed.

### False positives and this build's fixtures

- sis01_healthcare (1): `check_interaction_warnings` no longer walks into `minigameData`.
- sis02_energy (3): `nextTabPrompt`, `nextTabButton`, `completeBanner` added to `log_filter_terminal`'s optional list in `scripts/minigame-data-schemas.json`.
- keyPins (33 lines in 6 test scenarios): every key lock and its key got the same `keyPins` array. The keys in test_complex_multidirection, test_multiple_connections, test_mixed_room_sizes, test_vertical_layout and test_horizontal_layout had no `opens_lock` at all, so none of them opened its door; each now has the `opens_lock` its name implies (Office 1 Key opens `office1_key`, and so on). test_behind_wall_fade's wall key opens nothing and only got `keyPins`.
- test-rfid-multiprotocol (2): guards moved from `hacker-green`/`hacker-yellow` to `hacker`/`hacker-red`.
- npc-sprite-test2 (2): the helper NPC now holds a spare phone and keycard for the shared `helper-npc.ink` `#give_item` tags. The shared ink is unchanged.
- test_desk_seating (1 schema): `room_test_desk_seating` added to the room `type` enum (the map exists).
- test-blockchain-explorer (2 schema): no code reads a `set_global` task type or `targetGlobal`, so the two tasks are now `custom` (they never completed before either; completing them from the explorer's flag globals is new work, not done here).
- test_table_items (4 schema): the four tables got names.
- test-ble-scanner (2 schema, 1 hidden common): `ble` is a real lock type (client `unlock-system.js` `case 'ble'`, server `game.rb` lock-type table and unlock paths) missing from both `lockType` enums; added. Its `ble_scanner` start item had no sprite: `public/break_escape/assets/objects/ble_scanner.png` is a byte copy of `bluetooth_scanner.png` (the icon the BLE minigame already shows).
- sf_clean (test fixture): its mail NPC lacked `phoneId`, a common `❌` that used to pass under `--strict-social` because only social errors counted.

The plan's section 3.2 named "top-level name, description and others" for test-ble-scanner and "globalItems and others" for basic_mission and vm_free_mission. The step 1 run shows other lines: test-ble-scanner's were the `ble` lock type and the sprite; basic_mission and vm_free_mission each print 4 schema lines (no `scenario_brief`, `flags` as an array, start room without `type` and `connections`). `globalItems` is an unknown-field warning, not a schema error.

### Corpus triage

All 177 `scenarios/*/scenario.json.erb`, `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph` (ink on, lint on), the merge-batch flags. "Before" is the old validator on f2d53bb40; "raw" is the new validator with `--no-known-failures` before the fixture fixes (sis01 and sis02 were already fixed); "after" is the branch with the list.

| | lines with ❌ | scenarios with ❌ | exit 1 |
|---|---|---|---|
| before (old validator) | 103 | 21 | 14 |
| raw (new validator, no list, sis fixes in) | 128 | 25 | 25 |
| after (fixes and list) | 81, all known | 13 | 0 |

Leaving out the 4 sis lines fixed first, the new validator shows 29 lines the old one did not: ceo_exfil's 10 `targetKnot` lines and lab_malware_metasploit's task line (behind the ink exit), and 18 from the 6 schema failures, whose schema lines now carry `❌` (basic_mission 4, vm_free_mission 4, test_table_items 4, test-blockchain-explorer 2, test_desk_seating 1) plus test-ble-scanner's 2 schema lines and its sprite line, which was behind the schema exit. No check raised on any corpus scenario: there is no `could not run` line in the corpus. m01 to m10 print 0 `❌` and exit 0. No scenario that exited 0 with no `❌` before changed.

| Scenario | before ❌ | before exit | raw ❌ | raw exit | after ❌ | after exit |
|---|---|---|---|---|---|---|
| basic_mission | 0 | 1 | 4 | 1 | 4 (4 known) | 0 |
| biometric_breach | 5 | 0 | 5 | 1 | 5 (5 known) | 0 |
| ceo_exfil | 4 | 1 | 14 | 1 | 14 (14 known) | 0 |
| crypto1_captain_meow | 1 | 0 | 1 | 1 | 1 (1 known) | 0 |
| crypto2_rsa_asymmetric | 2 | 0 | 2 | 1 | 2 (2 known) | 0 |
| crypto3_aes_symmetric | 2 | 0 | 2 | 1 | 2 (2 known) | 0 |
| lab_exploitation | 13 | 1 | 13 | 1 | 13 (13 known) | 0 |
| lab_feeling_blu | 10 | 1 | 10 | 1 | 10 (10 known) | 0 |
| lab_malware_metasploit | 1 | 1 | 2 | 1 | 2 (2 known) | 0 |
| lab_post_exploitation | 12 | 1 | 12 | 1 | 12 (12 known) | 0 |
| lab_vulnerabilities | 3 | 1 | 3 | 1 | 3 (3 known) | 0 |
| lab_vulnerability_analysis | 9 | 1 | 9 | 1 | 9 (9 known) | 0 |
| npc-sprite-test2 | 2 | 1 | 2 | 1 | 0 (0 known) | 0 |
| sis01_healthcare | 1 | 0 | 0 | 0 | 0 (0 known) | 0 |
| sis02_energy | 3 | 0 | 0 | 0 | 0 (0 known) | 0 |
| test_behind_wall_fade | 1 | 0 | 1 | 1 | 0 (0 known) | 0 |
| test-ble-scanner | 0 | 1 | 3 | 1 | 0 (0 known) | 0 |
| test-blockchain-explorer | 0 | 1 | 2 | 1 | 0 (0 known) | 0 |
| test_complex_multidirection | 10 | 0 | 10 | 1 | 0 (0 known) | 0 |
| test_desk_seating | 0 | 1 | 1 | 1 | 0 (0 known) | 0 |
| test_horizontal_layout | 4 | 0 | 4 | 1 | 0 (0 known) | 0 |
| test_mixed_room_sizes | 6 | 0 | 6 | 1 | 0 (0 known) | 0 |
| test_multiple_connections | 8 | 0 | 8 | 1 | 0 (0 known) | 0 |
| test-rfid-multiprotocol | 2 | 0 | 2 | 1 | 0 (0 known) | 0 |
| test_table_items | 0 | 1 | 4 | 1 | 0 (0 known) | 0 |
| test_vertical_layout | 4 | 0 | 4 | 1 | 0 (0 known) | 0 |
| vm_free_mission | 0 | 1 | 4 | 1 | 4 (4 known) | 0 |

By owner, 132 lines in all (128 raw plus the 4 sis false positives fixed first):

- this build: 51 (4 false positives, 33 keyPins, 2 sprites, 2 helper items, 10 in the four schema fixtures), all fixed;
- labs track: 49 lines in 8 entries (48 `ink`, 1 `common`; the plan said 47 ink, the run says 48: 13 + 12 + 7 + 2 + 10 + 3 + 1);
- escape-room track: 24 lines in 6 entries (`git log -1` on each template and ink folder: last change 2026-10-22 or earlier, so the track has not restarted);
- the user, q86: basic_mission 4 and vm_free_mission 4, one entry each.

### Known-failures entries (awaiting sign-off)

16 entries, 81 lines, `added` 2026-11-12, proposed `reviewBy` 2026-12-10. Each has a heading in `docs/agents/VALIDATOR_DECISIONS.md` marked "awaiting orchestrator sign-off".

| Scenario | Stage | Match | Count | Owner |
|---|---|---|---|---|
| lab_exploitation | ink | is a standalone emote starting with '*' | 13 | labs track |
| lab_post_exploitation | ink | is a standalone emote starting with '*' | 12 | labs track |
| lab_vulnerability_analysis | ink | is a standalone emote starting with '*' | 7 | labs track |
| lab_vulnerability_analysis | ink | contains '//', which ink treats as a comment | 2 | labs track |
| lab_feeling_blu | ink | contains '//', which ink treats as a comment | 10 | labs track |
| lab_vulnerabilities | ink | contains '//', which ink treats as a comment | 3 | labs track |
| lab_malware_metasploit | ink | contains '//', which ink treats as a comment | 1 | labs track |
| lab_malware_metasploit | common | '#complete_task:complete_instruction_task' was not found | 1 | labs track |
| biometric_breach | common | missing required 'keyPins' array | 5 | escape-room track |
| crypto1_captain_meow | common | missing required 'keyPins' array | 1 | escape-room track |
| crypto2_rsa_asymmetric | common | missing required 'keyPins' array | 2 | escape-room track |
| crypto3_aes_symmetric | common | missing required 'keyPins' array | 2 | escape-room track |
| ceo_exfil | ink | in itemsHeld. Add { | 4 | escape-room track |
| ceo_exfil | common | is a phone NPC event mapping with 'targetKnot' | 10 | escape-room track |
| basic_mission | schema | ERROR: schema: #/ | 4 | the user (q86) |
| vm_free_mission | schema | ERROR: schema: #/ | 4 | the user (q86) |

With `--skip-ink`, the 7 ink entries are "not checked" and never fail a run.

### CI

`.github/workflows/ci.yml`, "Validator over scenarios with a social key": replayed locally over the 84 scenarios its lister finds, `--strict-social --no-graph --skip-ink`: all exit 0. The "no tracked file was rewritten" step is unaffected (`--no-graph`, and `git status` was clean after every corpus run). The merge-batch rule becomes "the validator exits 0" (0 unlisted `❌`).

### Test audit

The plan's known cases, all updated in the same branch:

- old labels: `validator-pin-locks` (2), `validator-mission-result` (3), `validator-mission-scoring` (1), `validator-combination-cryptex` (3), `validator-action-condition` (6), `validator-social-followups` (3), `validator-social-schema` (4), `validator-social-triage` (1), `validator-social-awareness` (1);
- exit 0 on output holding `❌`: `validator-social-schema` (the `checklistTimeing` plain run), `validator-social-framework` (sf_broken plain, sf_nosocial, sf_sprite plain), `validator-social-pretext` (sp_broken plain), `validator-social-mail` (sm_broken plain); each now expects 1;
- `validator-conclusion-screen` matched the gem's raw schema text (`conclusionScreen/type' value`); it now matches the new form;
- `validator-social-framework` sf_clean under `--strict-social`: the fixture's own `phoneId` error, fixed in the fixture.

`❌ ERROR` matches in `dungeon-graph-networks`, `npc-left-behind`, `npc-needs-slots` and `validator-office-presets` were already on the new label. No Rails test reads the validator, the schema or the edited scenarios.

### Tests

- New: `test/js/validator-exit-code.test.mjs` (21), `test/js/validator-known-failures.test.mjs` (10, real list plus the checker), shared reader `test/js/validator-decisions-reader.mjs`.
- Run without the lock under `RBENV_VERSION=2.7.8`: every test file that runs the validator or reads the schema, the minigame schemas or sf_clean, plus `table-item-overlap-grouping`: 70 files, 70 PASS. `MERGE_BATCH=1 node test/js/validator-known-failures.test.mjs`: pass.
- Not run: the full suites (the orchestrator runs them under the lock at the merge batch).

### Proposed wording (not edited: skills and the common brief are outside this branch)

- **Common brief**, replacing "Count every line with ❌ as a failure: the validator labels some INVALID rather than ERROR": "The validator's exit code is the answer: 0 means no unlisted `❌`. A listed line prints with `(known: <owner>, since <date>)`."
- **validate-scenario** line 24: "**Errors (must fix)**: every `❌ ERROR:` line, each on its own line with the path bolded. The exit code is the answer (1 while any unlisted `❌` remains); a line marked `(known: <owner>, since <date>)` is on `scripts/validator_known_failures.json` and belongs to that owner. Quote the `Result:` line."
- **scenario-design-review** line 22: "| ❌ ERROR | Must fix before the scenario will work; the validator exits 1 while any unlisted one remains | List all, bold the path; name the owner of a `(known: ...)` line |"; line 50: "(the validator reports this as ❌ ERROR)"; line 203: "All unlisted ❌ ERROR lines from the validator, and the known ones with their owner".
- **walkthrough-scenario** line 29: "Any ❌ ERROR or ⚠️ WARNING lines (the validator exits 1 on an unlisted ❌); note them briefly ...".
- **npc-dialog-review** line 32: "❌ ERROR for a name used 5+ times in a file ...".
- **break-escape-dungeon-graph** line 25: "Report the validator's exit code and its `Result:` line; list any `❌ ERROR` lines (a `(known: ...)` one with its owner) and `⚠️` warnings."
- **mission-puzzle-chains**: its `❌` marks are its own table markers, not validator labels; no change.

### Open

- Sign-off of the 22 entries (16 before R1 m4 split two of them into four each) and their `reviewBy` dates (orchestrator, with the labs and escape-room owners and the user for q86).
- The `acknowledgedClues` and payload-exception lists do not exist yet; the list test reads the exceptions file once 6a-1 adds it, and step 3 adds the markers to the shared-heading check.
- test-blockchain-explorer's two tasks are `custom` and still never complete in play (now in `docs/IDEAS_BACKLOG.md`).
- build/phone-calls and build/phone-calls-writing (plan section 5): whoever merges second redoes the label rename on their validator lines.

### Code review round 1 fixes

Review: `docs/achitechture/SCENARIO_FORMAT_HARDENING_STEP1_REVIEW_R1.md` (0 blockers, 0 majors, 7 minors, 5 nits), all fixed.

- **m1.** `ValidatorReport` counts a line as an error only when its text, after indentation and an optional list number, starts with `❌` (`ERROR_RE`); `print_issue_list` counts the same way (`report.error_line?`). The `-o` and `-v` JSON dumps go through `report.raw` (the uncounted header writer). The dialogue lint's quoted text sits after `ERROR ` and a path, so it never starts a line. Before the change every `❌` in the corpus and test output already began its line, so no count moved. The reviewer's `-o` case (a note with text `❌ door left open`): plain, `-o` and `-v` all exit 0 with `Result: 0 errors`.
- **m2.** Any non-zero graph exit other than the key stop (3) prints `❌ ERROR: dungeon graph could not run (exit <n>); see the message above.` and exits 1. `dungeon-graph-networks` expected the old non-fatal line for exit 1; it now expects the new one and status 1.
- **m3 (the stricter option).** A line matching `INK_COMPILE_FAILURE_RE` (now defined once, in `ValidatorReport`) is never matched by a list entry, and the list test rejects a `match` that names a compile failure. So a compile failure always fails the run, whatever else the list holds.
- **m4.** basic_mission and vm_free_mission each have four entries, one per exact schema line, count 1, with their own headings (22 sections now). The list test rejects a `match` with under eight characters left once `❌ ERROR: `, `ERROR: `, `schema: #/` and `SOCIAL: ` are removed.
- **m5 (orchestrator ruling).** `readDecisions` keeps each section's prose; `signOffProblems(..., { mergeBatch })` fails a section whose prose holds "awaiting orchestrator sign-off". The known-failures test passes `MERGE_BATCH=1` through, and the clue and payload-exception lists get the same rule when they call the shared reader. The 22 sections stay awaiting, so `MERGE_BATCH=1 node test/js/validator-known-failures.test.mjs` fails until the orchestrator signs them at the merge.
- **m6.** AGENTS.md's merge-batch line says to run `bin/test-js` with `MERGE_BATCH=1` and to sign each new section in the merge commit.
- **m7.** The schema split and formatting run under their own rescue (fallback: the raw messages as schema errors plus `❌ ERROR: schema report could not run: ...`); `print_issue_list` runs its body under `run_check`; the `--strict-social` count line runs under `run_check('social', 'strict-social count')`. Each crash shows its `could not run` line and the later sections still print.
- **n1.** The directory check no longer calls `check_mission_scoring` and `check_mission_result`; the wiring check makes both calls with the rendered data, so a bad `scoring` prints and counts once.
- **n2.** Each ink compile writes to `<file>.json.tmp-<pid>-<random>`, is parsed there, and is renamed into place only when it is valid JSON; the temp file is always removed. Parallel runs never read a half-written file, and a failed compile leaves the old JSON alone. The corpus run below used 8 parallel workers.
- **n3.** Shared-heading labels use the entry's index in the list, taken before the filter.
- **n4.** `docs/IDEAS_BACKLOG.md` has the test-blockchain-explorer item.
- **n5.** A `reviewBy` earlier than `added` is a problem. The existing passed-`reviewBy` test now uses an earlier `added` date.

Checks after the fixes:

- Corpus: all 177 `scenarios/*/scenario.json.erb`, ink on, `--no-graph`, the default list, 8 in parallel: every one exits 0; 81 errors, 81 known; 13 scenarios print a `❌`, all known; no `could not run` or stale line; m01 to m10 each 0 `❌`; `git status` clean.
- CI social job replay (`RBENV_VERSION=2.7.8`, `bundle exec`): the lister finds sf_broken, sf_clean, sf_edges and sf_sprite and 84 corpus scenarios; all 84 exit 0 with `--strict-social --no-graph --skip-ink`; sf_clean exits 0, sf_broken exits 1 with `✗ --strict-social: 25 social lint error(s)`.
- Node tests, no lock: the same 70 files as the review: 1028 pass, 0 fail, including `validator-exit-code` (30) and `validator-known-failures` (15). `MERGE_BATCH=1` on the list test: fails on the 22 awaiting sections, as ruled.

## Step 2. Strict keys for the access, network and office-life blocks

Date: 2026-11-12. Branch `build/harden-step2`, made from main b7d500ccf (step 1 merged). The plan's line 224 for `strict: false` is still `validate_json` (`scripts/validate_scenario.rb:225`); `check_unknown_fields` moved from 402 to 554 with the new helpers above it.

### The closed set

Every block below has `additionalProperties: false` and `patternProperties: { "^_": {} }`.

| Block | Schema path | Before |
|---|---|---|
| a resource | `#/properties/resources/additionalProperties` | open |
| a network | `#/properties/networks/additionalProperties` | open |
| its Wi-Fi | `#/properties/networks/additionalProperties/properties/wifi` | open |
| a policy | `#/properties/policies/additionalProperties` | open |
| an account profile | `#/properties/accountProfiles/additionalProperties` | open |
| a role | `#/properties/roles/additionalProperties` | `additionalProperties: true` |
| a role's workaround | `#/properties/roles/additionalProperties/properties/workarounds/items` | open |
| a role's frustration | `#/properties/roles/additionalProperties/properties/frustration` | closed |
| the access list (`access` on rooms, objects and resources; a profile's `for`) | `#/definitions/accessList` | closed |
| an NPC workaround | `#/definitions/npc/properties/workarounds/items` | open |
| NPC `feed` | `#/definitions/npc/properties/feed` | open |
| a feed post | `#/definitions/npc/properties/feed/properties/posts/items` | open |
| NPC `creds`, `habits`, `screenHabit`, `printHabit`, `usbHabit`, `frustration` | `#/definitions/npc/properties/<name>` | closed |
| an NPC `needs` entry | `#/definitions/npc/properties/needs/additionalProperties` | closed |
| object `affordance` | `#/definitions/affordance`, through `$ref` from `#/definitions/item/properties/affordance` | **open in practice** (below) |
| a `grant_foothold` action | `#/definitions/grantFootholdAction` (new) | open |

Choices the plan left to the builder, or that the code forced:

- **The closed blocks got `^_` too.** The plan says they get the pattern "where they lack a `_comment` property"; all of them have one. Adding the pattern anyway makes the rule the same in every block (any `_` key passes), which is what the README now says.
- **Roles' own `workarounds` and `frustration`.** The plan names "each NPC `workarounds` entry"; a role's entries have the same shape and are closed too. No corpus scenario has a role workaround.
- **`affordance` was not closed.** Its `type` is `["object", "boolean"]`, and json-schema skips `additionalProperties` on a node whose type is a list (`additionalproperties.rb`: it runs only when `type` is absent or `"object"`). So `"owner"` for `"owners"` passed the schema, as the access review found. Its keys now sit in `#/definitions/affordance`, which has no type of its own (so `false` still passes), referenced with `$ref` beside the type list.
- **`grant_foothold`.** Actions share one open object schema, several action lists (`onConfirm`, `timers`, and the lists the schema does not describe) are untyped, and the gem has no `if`/`then`. A closed `grantFootholdAction` definition (type, pc, needsDropped, needsSession, needsHeld, name, condition) is the one key list, and `validate_grant_foothold_actions` validates every action whose `type` is `grant_foothold`, wherever it sits, against that definition with json-schema itself, prefixing each message with the action's pointer. So the schema still defines the keys and the gem still checks them.
- **Hints on the core kinds.** Rooms, objects and NPCs stay open (item 4). Their hand-list warnings now carry the same `did you mean` hint, so the access review's `lockchance` (object) and `needHome` (NPC) slips each print one warning naming the key and its suggestion.

### The message

`format_schema_errors` (in `validate_scenario.rb`, called in place of the per-line `format_schema_error` map) turns each json-schema `contains additional properties [...] outside of the schema` message into one line per key: `❌ ERROR: schema: <pointer> (<room, object or NPC>): unknown key '<k>', did you mean '<known>'?`. The known keys come from the schema node at that pointer (`schema_resolve`, following `$ref`, `properties`, `patternProperties`, `additionalProperties`, `items` and combinator branches; a `grant_foothold` action uses its own definition). The hint is a case-insensitive match, else the single closest key within edit distance 2 (1 for keys under five characters); a tie gives no hint. A misspelt required key (`SSID` for `ssid`) would also raise "did not contain a required property of 'ssid'"; that line is dropped when an unknown key at the same pointer suggests `ssid`, so one slip prints one line. Social schema errors are split off before this and keep their old text.

### Corpus

Key walk before closing (scratch script, all 177 rendered scenarios, every block in the set compared with the schema's declared keys): 0 unknown keys. Instances seen: accessList 41, accountProfiles 12, affordance 85, creds 57, feed 15, feed posts 34, NPC frustration 4, grant_foothold 3, habits 4, needs entries 91, networks 5, NPC workarounds 12, policies 15, printHabit 1, resources 22, role frustration 1, roles 3, screenHabit 10, usbHabit 1, wifi 1. Role workarounds: none in the corpus (the fixture covers them).

Validator after the change, all 177 `scenarios/*/scenario.json.erb`, ink on, `--no-graph`, default list: every scenario exits 0; 81 errors, 81 known; the same 13 scenarios print a `❌`; no `unknown key`, `could not run` or stale line; m01 to m10 print 0 `❌`. The same corpus with `--skip-ink` against main's schema (`-s`) and against the new one gives identical `Result:` lines (errors and warnings) for all 177. `git status` clean after every run. No known-failures entry added.

### Tests

- New: `test/js/validator-strict-keys.test.mjs` (8 tests): the base fixture with `_comment` and another `_` key in every block passes (and `affordance: false` still passes); 27 slips, one per block and placement (the plan's `PSK`, `downif`, `autoLockMins`, `lockchance` on `screenHabit`, affordance `owner`, a misspelt required `ssid`, `grant_foothold` in `triggerOnInteract`, `onConfirm` and a timer), each exactly one line with the right pointer, key and hint; two unknown keys print two lines; a tie gives no hint; every block in the set is closed in the schema; the full validator prints the `PSK` slip once and exits 1; `needHome` on an NPC and `lockchance` on an object are one warning each with a hint and no schema error; the corpus has no unknown key in any block (renders and validates all 177, about 13 s).
- Run without the lock under `RBENV_VERSION=2.7.8`: every test file that runs the validator or reads the schema (68 files): 68 pass, 993 tests, 0 fail.
- Not run: the full suites (the orchestrator runs them at the merge batch).

### Open

- `validate_network.rb:19-20` still calls `grant_foothold` reserved (access review m1); untouched.
- Plan section 7 (q84) closes the core kinds; until then a room, object or NPC slip is a warning.

### R1 fixes

Review: `docs/achitechture/SCENARIO_FORMAT_HARDENING_STEP2_REVIEW_R1.md` (0 blockers, 3 majors, 6 minors), all fixed. Code in 35c7c20fa, tests in df825084c. Each test below fails on the scripts at ff052383b and passes now (checked by putting the three old scripts back, running the test files, and restoring them from HEAD).

| Finding | Fix | Commit | Test |
|---|---|---|---|
| M1. A habits, screenHabit or printHabit slip printed the schema line and a second hand-kept line | Dropped the unknown-habit error in `validate_npc_habits.rb` (it now checks values only, for the names it knows), the `printHabit has unknown key` and `screenHabit has unknown field` warnings and `PRINT_HABIT_KEYS` in `validate_npc_needs.rb`; the schema lists the same keys | 35c7c20fa | strict-keys "full validator: each slip prints exactly one line naming the key" (all 27 slips through the real validator, one line each, exit 1); validator-npc-habits and npc-office-visuals now assert the module prints nothing for an unknown name |
| M2. `_` keys failed or warned in habits, screenHabit and printHabit | Same removal; habits values skip every `_` name, not only `_comment` | 35c7c20fa | strict-keys "full validator: `_` keys ... print nothing" (base fixture, no line names `_why` or `_comment`) |
| M3. A grant_foothold type slip in triggerOnInteract printed twice | `format_schema_errors` returns `out.uniq`: the main schema and the walker give the same formatted line | 35c7c20fa | strict-keys "a type slip in a grant_foothold in triggerOnInteract prints once" (formatter and full run) |
| m1. Swapped letters got no hint, and a swapped required key also printed "required" | `key_edit_distance` is now the optimal string alignment distance (a neighbour swap is one edit); with the hint in place the existing rule drops the "required" line, so nothing else was needed | 35c7c20fa | strict-keys "a swap of two neighbouring letters is one edit" (`ssdi`, `od`) |
| m2. The grant_foothold walker checked actions under `_` keys | The walker skips `_` keys; README says the schema does not check a `_` key's value | 35c7c20fa | strict-keys "a grant_foothold under a `_` key is not checked" (top level and on an object, formatter and full run) |
| m3. README promised one line per slip overall | README: one slip prints one schema line; a later check may report what the missing key breaks (`At` for `at`) | 35c7c20fa | wording only |
| m4. A map-level `_comment` (under `roles`, `networks` and the rest) fails | Decision: it keeps failing. Those maps hold only ids, and only some readers skip non-object entries (the server's `NetworkModel` does, the clue and capture walks do, others were not audited), so allowing a string entry there needs a reader audit first. README says to put the note inside an entry | 35c7c20fa | strict-keys "... a map-level `_comment` under roles still fails" pins the decision |
| m5. `comment` got no hint | `suggest_key` takes the block's declared `_` keys: with no closer key, `<k>` gets `_<k>` when the block declares it, and `comment` always gets `_comment`. The open-kind warnings get the same hint | 35c7c20fa | strict-keys "`comment` gets a hint towards `_comment`" |
| m6. Tests ran the formatter only; the corpus test skipped render failures | The tests above run the full validator (in parallel, about 1 s each); the corpus test collects render failures and asserts the list is empty | df825084c | the corpus test itself (not proven failing: no scenario fails to render) |

Left as is: `validate_network.rb`'s own grant_foothold walk still visits `_` keys. The server's `NetworkModel.grant_foothold_actions` also walks them, and `DeclaredGrants.executed?` looks only at the last path segments, so a grant inside, say, `_draft.triggerOnInteract` would be honoured at run time; keeping the network check there is the safer side.

Checks after the fixes:

- Corpus: all 177 `scenarios/*/scenario.json.erb`, ink on, `--no-graph`, the default list, 6 in parallel: every one exits 0; 81 errors, 81 known (unchanged); the same 13 scenarios print a `❌`; no `unknown key`, `could not run` or stale line; m01 to m10 each 0 `❌`; `git status` clean.

- Node tests, no lock, `RBENV_VERSION=2.7.8`, plain `node`: every test file that loads `validate_scenario.rb`, `validate_npc_habits` or `validate_npc_needs` (66 files, including `validator-strict-keys` with 14 tests): 1084 pass, 0 fail. No Ruby test file was touched. Not run: the full suites (the orchestrator runs them at the merge batch).

## Handover

Step 1 is done; nothing in progress. Commits on `build/harden-step1`: 22e29b9db (validator, list, decisions, fixtures), 42795f922 (tests), and the commit holding this log and the README edits.

Step 2 is done; nothing in progress. Commits on `build/harden-step2`: 3f80b61cb (schema, validator, tests), 2a49c4341 (this log and the README note), and for review round 1: 35c7c20fa (fixes), df825084c (tests) and the commit holding the R1 section of this log.
