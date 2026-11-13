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

### R2 fixes

Review: `docs/achitechture/SCENARIO_FORMAT_HARDENING_STEP2_REVIEW_R2.md` (0 blockers, 0 majors, 1 minor, 3 nits). m1, n1 and n2 fixed in 47f808d16 (code, tests, README); n3 left for a later step, as ruled. Each new test fails on a mutant with its fix removed and passes now.

| Finding | Fix | Test |
|---|---|---|
| m1. The grant_foothold walker skipped a room (or any id-map entry) whose id starts with `_` | Ruling: ids are not notes. The walker now carries the schema node for each value. Where that node is an id map (its `additionalProperties` is a schema, directly or in a combinator branch: `rooms`, `networks`, `resources`, `roles`, an NPC's `needs` and the rest) and the key is not a declared property, the key is an id and is walked, `_` or not. A `_` key anywhere else is a property name, a note, and is still skipped. Where the schema does not describe a value (open action lists), its `_` keys are skipped as before | strict-keys "ids are not notes": room `_annex`, connected from `r1`, with a `pcc` slip in an onConfirm grant_foothold prints one `unknown key 'pcc', did you mean 'pc'?` line at `#/rooms/_annex/...` (formatter and full run, exit 1), while a `_note` grant_foothold inside that room is still skipped. Fails with the id-map branch removed |
| n1. `comments` drew `did you mean 'contents'?` | `suggest_key` checks note-like keys (`comment`, `comments`, `note`, `notes`, any case) after the case-insensitive match and before the distance step: `_<k>` when the block declares it, else `_comment` | strict-keys "`comment` gets a hint towards `_comment`": `comments` in accountProfiles and `notes` in resources each hint `_comment`. Fails with the note-like branch removed |
| n2. The `comment` branch was untested | Folded into the note-like check above | the same test: `Comment` in policies hints `_comment` (the `_<k>` branch cannot answer it). Fails with the branch removed |
| n3. A value slip in habits, screenHabit or printHabit prints two lines | Left, as ruled: it predates step 2 (see Handover) | none |

README: the schema-validation paragraph now lists the note-like keys and says an id is never a note.

Checks after the fixes:

- Corpus: all 177 `scenarios/*/scenario.json.erb`, ink on, `--no-graph`, the default list, 6 in parallel, under the test lock: every one exits 0; 81 errors, 81 known (unchanged); the same 13 scenarios print a `❌`; no `unknown key`, `could not run` or stale line; m01 to m10 each 0 `❌`; `git status` clean.
- Node tests, under the test lock, `RBENV_VERSION=2.7.8`, plain `node`, 3 at a time: the 82 `test/js` files that load `validate_scenario.rb`, `validate_npc_habits`, `validate_npc_needs` or another `scripts/validate` path: 1257 pass, 0 fail, every file exit 0 (`validator-strict-keys` has 15 tests). No Ruby test file was touched.

## Step 2b. Author notes are not live

Date: 2026-11-12. Branch `build/harden-2b`, made from main 35993ec89 (steps 1 and 2 merged at 406fa7791, plus the plan commits). This section records a partial build: the self-contained schema resolver and notes helper are built and unit-tested; the live wiring (schema marks, server walkers, payload strips, boot check, validator migration) and the live proof are not yet done and are specified below for the next worker.

### Done and tested (commit 732f41433)

- **`lib/break_escape/scenario_schema.rb`** (`BreakEscape::ScenarioSchema`), plain Ruby (`json` only). The resolver the plan's item 1 calls for, as module functions over a `Node`:
  - `load(path, starts: STARTS)` parses a schema file, compiles a `Table`, and checks every start the file holds (raising with the pointer on a missing file, an unparsable file, or a broken `$ref` at a start). `root` loads `DEFAULT_PATH` on first use under a Mutex; `at(pointer)` raises `ArgumentError` on a pointer not in `STARTS`. `boot_check!(app, path:)` loads under `eager_load` and installs the process table for the default path, else no-ops.
  - `child(node, key)`, `item(node)`, `id_key?(node, key)`, `free?(node)`, `classify(node, key)` implement rules 1-4 (property / id / free / undeclared), the map test (`additionalProperties` a schema, or `x-id-map: true`), the free test (`x-free-data: true`), and the "a map branch's `patternProperties` are never consulted" rule. `FREE` is the sentinel; `child`/`item` of `FREE` are `FREE`; nil passes through.
  - `STARTS` currently holds `#`, `#/definitions/room`, `#/definitions/item`, `#/definitions/item/properties/contents`, `#/definitions/npc/properties/eventMappings`, `#/definitions/eventMapping`. Extend it as walkers/strips are wired (the plan names more: the player_state item copies start at `#/definitions/item`).
- **`lib/break_escape/author_notes.rb`** (`BreakEscape::AuthorNotes`): `note?(node, key)`, `each_live(data, node, prune:, free:)` and `strip_notes!(obj, node)` exactly as the plan's items 1 (the calls), 2 and 3 describe. `strip_notes!` returns its argument.
- **Tests.** `test/unit/author_notes_test.rb` (17 runs, 55 assertions, all pass under `RBENV_VERSION=2.7.8 ruby test/unit/author_notes_test.rb`) with `test/fixtures/files/author_notes_schema.json`, covering every classification case the plan's unit list names: a `_` property and `^_` pattern note; a `_` room id, `_` global name (`x-id-map: true`, open value -> nil child), `_` need id; a `_` note inside a `_` room's object; `x-id-map: false` note; free data never a note with `FREE` children (direct and two levels down); a map-with-properties node (`byChoice` property beside `_` ids); a character id; a patterned map key (pattern ignored); a typed branch beside a free branch; a key under nil; `strip_notes!` (notes gone, free data and ids kept, returns its argument); `each_live` (free visited, notes skipped, `free: :skip` prunes the free subtree); `at` STARTS restriction; `load` on a broken `$ref` and a missing file. Smoke-checked against the real `scripts/scenario-schema.json`: `root` loads, `at('#/definitions/room')` and `child`/`item`/`id_key?`/`note?` behave.

### Deliberate design note and orchestrator ruling

The plan's item 1 describes an eager compile into a frozen table of about 2,540 interned Nodes, used both at run time and by the schema-walk test (Explore/Reach). The first build (732f41433) resolved lazily, data-driven: each walker holds a Node and asks `child`/`item` as it descends over finite data, so the schema is never traversed without data to bound it. This is behaviourally equivalent for every walker and strip (the resolver gives the same note/id/free answer per location).

**Orchestrator ruling (phase A):** lazy resolution in the walkers is accepted, but an eager enumerator was added that uses the very same `classify` code, so the schema-walk test is built in full. `Table#explore` seeds the root and every start pointer, then follows `child` for each declared property name, the two probe keys and `item`, interning Nodes exactly as the lazy walk does; `Table#each_raw_location` is the raw-schema structural walk (for Marks and Reach). Module helpers `open_kinds`, `marks_on`, `only_required?`, `map_location?` single-source the Marks logic. On the patched schema `explore` reaches **2,823 Nodes** (the plan's ~2,540 was an estimate on main before this step's marks; the test asserts `> 2000`, not an exact count) and **94 map locations, all reached** (matches the plan's 94).

### Phase A (commit afe5b6ca3)

**Schema marks.** All 48 open locations now carry exactly one mark; `scripts/scenario-schema.json` edited in place (position-preserving patcher, formatting kept). The final lists, taken from the schema-walk scan on this main:

- **x-id-map: true (21).** `flags`; `task.onComplete.setGlobal`; `eventMapping.setGlobal`; `socialPretextAsk.grants.setGlobal`; `socialPretextCall.outcomes.{got_it,reported,walked_away}.setGlobal`; `socialPhishTarget.outcome.setGlobal/oneOf/1`; `item.onRead.setVariable`; `item.onPickup.setVariable`; NPC `externalVariables`, `persistentVariables`; the requireGlobal object branches `affordance.offWhen/oneOf/1`, `los.challengeOnSight...requireGlobal/oneOf/1`, `needsCompany.avoids.items/oneOf/1/requireGlobal/oneOf/1`, `phoneCalls...requireGlobal/oneOf/1`, `exchanges...requireGlobal/oneOf/1`; and the four newly declared maps `timers.items.properties.setGlobal`, `item.onAbort.properties.setGlobal`, `item.onLaunch.properties.setGlobal`, `item.onPairSetGlobal`.
- **x-id-map: false (15).** `narrator.voice`; `timers.items`; `objective.conclusionScreen.bondVisualiserOpts`; NPC `creds.card`; `voice.fx/oneOf/1`; `feed.posts[].when`; item `ttsVoice`, `onAbort`, `onLaunch`; `triggerOnInteract[].item`, `triggerOnInteract[].onConfirm/items`, `interactionWarning.onProceed/items`, `interactionWarning.onDecline/items`, `wearable.onWear/items`, `wearable.onRemove/items`.
- **x-free-data: true (15).** `globalVariables.additionalProperties/oneOf/3` and `/oneOf/4`; `socialThresholdEffect.value`, `.alternativeRoute`; `socialCharacter.alternativeRoute`; `socialExercise.config`; `room.cryptexConfig`; NPC `usePayload`; `eventMapping.openMinigame/oneOf/1.minigameData`; `eventMapping.completeTask`, `.unlockTask`, `.unlockAim`; `triggerOnInteract[].value`; `flagReward.value`; and the newly declared `item.minigameData`.
- **Closures.** `socialCharacter.emailRecord.itemsHeld` and `socialMailContact.emailRecord.itemsHeld` gained `items: { "$ref": "#/definitions/item" }`. `timers.items` gained a declared `actions` array whose items declare `item` as `#/definitions/item`.
- **Removed.** The 18 `^_` patterns on map nodes (detected programmatically; exactly the 18 the plan names).
- Open objects that also declare properties (`socialCharacter.emailRecord`, `socialMailContact.emailRecord`, `socialSeededMessage.from/oneOf/1`, `flipAftermath.items.items`, NPC `rfidCard`) are **not** open by the test's part-4 rule (they have `properties`), so they carry no mark, as the plan allows.

**Corpus unchanged.** Old-vs-new schema diff (`-s` old vs new, `--no-graph --skip-ink --no-known-failures`, every `❌` and `Result:` line) over all 177 `scenarios/*/scenario.json.erb`: **empty diff**. The marks are inert to json-schema; the pattern removals, itemsHeld/timer closures and the new declared item properties add no validator line (no corpus `_` key sits in any of the 18 maps; no corpus `emailRecord.itemsHeld` holds items; `minigameData`/`onPairSetGlobal` were already accepted on open item).

**Tests.** `test/unit/scenario_schema_test.rb` (8 runs, 6072 assertions, pass): Explore (reaches > 2000 Nodes, every `ScenarioSchema.at` pointer in `app/`/`lib/`/`scripts/` is in STARTS), Reach (all 94 map locations reached), the run-time probe walk (for every reached Node, `strip_notes!` and `each_live` agree with `classify` on a `_probe` key; a plain probe is never a note), Marks (every open location exactly one mark; no map node carries a pattern), and the old-rule fixture (the parent-name rule reports its misses). A deliberate break (drop the `flags` mark, re-add a map `^_`) produced 3 failures across the Marks, pattern and run-time-probe parts; the schema was restored. `author_notes_test.rb` still passes (17/55).

**Not yet in the test:** the corpus render part (part 6, `setGlobal`/`setVariable`-shaped key under nil across rendered templates) and the `OwnerClaim.scenario_objects` / `CaptureModel.each_capture_writer` probe assertions in part 3; both need the phase-B walker migration (those walkers must carry a Node first). Deferred to phase B.

### Phase A (continued): validator migration, the `_`-skip audit, the action-in-a-note warning

Date: 2026-11-12. The three remaining phase-A items, all resolver-driven and inert at run time (the corpus is unchanged). Commits: see the handover.

**Validator migration onto `ScenarioSchema` (plan item 1, "The validator's own resolution").** In `scripts/validate_scenario.rb`: the four local helpers `schema_deref`, `schema_resolve`, `schema_map_value` and `schema_node_keys` are removed; the grant walker (`validate_grant_foothold_actions`) and `schema_known_keys` (used by step 2's unknown-key formatter `format_schema_errors`) now resolve through `BreakEscape::ScenarioSchema` (root/child/item) and `BreakEscape::AuthorNotes.note?`. The grant walker starts at `ScenarioSchema.root` and, at each Hash key, skips `note?` keys and descends with `child`; arrays descend with `item`. This is behaviourally equal to step 2's walk (the old code already chose id-vs-note by the schema; the resolver gives the same answer on the 18 patterned maps, which rule 1 ignores). Resolution always uses the **repository schema** regardless of `--schema`; when `--schema` names another file the run prints one line saying so (json-schema validation still uses the named file). `schema_known_keys` now takes the declared property names across **every** object-capable branch (`Node#declared_property_keys`) where the old `schema_resolve` took the first matching branch, so a suggestion list can only gain keys. **No message changed**: the strict-keys node test (all 15) and every `validator-*` node test stay green, and the corpus validator output is byte-identical old vs new (empty diff over 175 templates, `--no-graph --skip-ink`). Requires for `scenario_schema` and `author_notes` were added to the validator.

**The `_`-skip-by-name audit (plan item 6).** Grepped `app/`, `lib/`, `scripts/`, `tools/` for `start_with?('_')`/`start_with?("_")`/`=~ /\A_/`/`/^_/`/`[0] == '_'`/JS `startsWith('_')`. Each site was classified **against the resolver** (the real repository schema), not against the plan's prose list, which turned out to be partly stale: four sites the plan listed as moves are notes per the resolver (step 2 closed those blocks as fixed-field `{phish,real}`/factor objects that still carry the `^_` note pattern), so they stay as keeps. See the rewritten "Audit outcome" below for the full table. Eight sites moved to `AuthorNotes.note?` + the location's Node (with the needed `ScenarioSchema.at` pointers added to `STARTS`): `lib/break_escape/npc_habits/clues.rb` (`social.intelFacts`), `scripts/validate_npc_habits.rb` (`roles`), `scripts/validate_social/awareness.rb` (`stepLabels`, `flipDefenderLineByChoice`, `flipMontageByChoice` outer and inner, and the recursive `guess_credential_checks` credential scan, which now threads the Node down the recursion and flags a credential-named `_` key that is an id or free data), and `scripts/validate_social/mail.rb` (`replies.byChoice`). Each moved site has a unit assertion in `test/unit/author_notes_test.rb` (`test_moved_sites_treat_underscore_as_id`) that a `_` key there resolves to an id; the kept-discrepancy sites have `test_kept_sites_treat_underscore_as_note`. The corpus has no `_` key in any of these maps, so the moves add and remove no validator line (confirmed by the empty old-vs-new diff).

**STARTS additions (8).** `#/properties/roles`, `#/properties/social/properties/intelFacts`, `#/definitions/socialAwarenessEpisode/properties/stepLabels`, `.../strings/properties/flipDefenderLineByChoice`, `.../strings/properties/flipMontageByChoice`, `#/definitions/socialAwarenessEpisode/properties/guess`, `#/definitions/socialTriageSet/properties/scoring/properties/kindPoints`, `#/definitions/socialPhishTarget/properties/replies`. The schema-walk test's Explore-pointer assertion (every `ScenarioSchema.at('#/...')` literal in `app/`/`lib/`/`scripts/` is in STARTS) still passes; `test/unit/scenario_schema_test.rb` now reaches more Nodes (6088 assertions, up from 6072) with no failure.

**The action-in-a-note validator warning (plan item 7).** `check_notes_hold_no_actions(json_data)` (new, run in the `common` stage) walks the scenario with the resolver and, for each key `note?` calls a note, warns `⚠️ WARNING: <path>: this author note holds an action, which the engine never runs` when the note's value holds a Hash with a String `type` at any depth. It never looks inside an id or free data, so a `type` under a `_` id or in `minigameData`/a free global is not flagged (proved by `test/js/validator-note-actions.test.mjs`). The corpus has none, so this adds no line (0 across all 175).

**README.** `README_scenario_design.md`, the schema-validation paragraph, gained a sentence: an author note is dead data (never run, never shipped), free data is real (a `_` key there is not a note), the schema (one resolver) decides, and a note that holds an action is warned.

**Tests run (test-lock congestion rule, single files only).** `test/unit/author_notes_test.rb` (19 runs, 72 assertions), `test/unit/scenario_schema_test.rb` (8 runs, 6088 assertions), `test/js/validator-note-actions.test.mjs` (2/2), all 58 `test/js/validator-*.test.mjs`, and the Rails single files `test/unit/npc_habits_clues_test.rb` + `npc_habits_clues_feed_test.rb` (18 runs, for the `clues.rb` engine change). Corpus: old-vs-new validator diff empty over 175 templates; all exit 0.

### NOT DONE (remaining step 2b work, in plan order)

1. **Schema marks** (plan item 1 and item 6 schema part): **DONE in phase A (afe5b6ca3).** See "Phase A" above. `free?` now answers correctly on the real schema.
2. **Walkers skip notes** (item 2): `NetworkModel.grant_foothold_actions`, `DeclaredGrants.collect`, `WearableModel.wearable_items` and `.global_writers`, `OwnerClaim.scenario_objects` and `.mappings`, `Game#merge_biometric_samples!`' known-owner walk, the capture-writer callers (item 5), `scripts/validate_network.rb`'s `gf_walk`, and the validator's grant walker. Each carries a Node and skips `note?` keys, visits free data in full.
3. **Notes never ship** (item 3): `AuthorNotes.strip_notes!` at the bootstrap (`games_controller.rb:278` area, on `filtered` before player-state keys), `command_board_config`, `filtered_room_data`, `filter_container_contents`, and the `filter_inventory_for_client!` entry points (`item_for_answer`, inventory list). The route audit (grep every `render json:` in `app/controllers/break_escape/`).
4. **Capture writers** (item 5): `CaptureModel.each_capture_writer(data, notes: :skip)` plus the `enum_for` keyword fix; the seven callers keep `:skip`.
5. **Validator migration** (item 1 "The validator's own resolution"): **DONE in phase A (continued).** See the section below.
6. **The `_`-skip-by-name audit** (item 6): **DONE in phase A (continued).** See the section below and the rewritten "Audit outcome".
7. **Boot initializer**: `initializer 'break_escape.scenario_schema'` in `engine.rb` calling `boot_check!`; the Rails unit boot-check test.
8. **The action-in-a-note validator warning** (item 7): **DONE in phase A (continued).** **README** schema-section line: **DONE** (`README_scenario_design.md`, the schema-validation paragraph). Plan item 8's fuller README rewrite (the three-mark rule for a new open node) stays for phase B with the boot/strip work.
9. **Tests**: the Rails tests (implant note/first-match, plant, granted-item, free-data-honoured, biometric/wearable/owner, captures, notes-never-ship per route, guards, free-data guards); the schema-walk test; the node grant-walker agreement test; the corpus checks (grants/captures/leave_route/global_writers before-after identical; `_` keys under nil; bootstrap sizes/time).
10. **Live proof** (keyless server on port 3270, `swap-scenario-game.rb`, `scenarios/test_author_notes/`, `_annex` room and a `_draft` grant; `verify-run.rb`): still to do.

### Audit outcome

Done (phase A continued). Grep over `app/`, `lib/`, `scripts/`, `tools/` for `start_with?('_')`/`start_with?("_")`/`=~ /\A_/`/`/^_/`/`[0] == '_'`/JS `startsWith('_')`: the engine JS has none; `app/` has none that decide note-vs-id. Every site was classified against the resolver (the real repository schema), and the move/keep decision was taken from the resolver, not the plan's prose. The resolver and the plan agree on the 8 moves and the plain keeps, but **disagree on four sites the plan listed as moves**: the resolver reads them as notes, because step 2 closed those blocks as fixed-field `{phish,real}`/factor objects that still carry the `^_` note pattern. Those four stay keeps.

**MOVED (resolver: id map, so a `_` key is an id, now read via `note?` + Node):**

| Site | Map | Node start |
|---|---|---|
| `lib/break_escape/npc_habits/clues.rb` (intelFacts walk) | `social.intelFacts` | `#/properties/social/properties/intelFacts` |
| `scripts/validate_npc_habits.rb` (`check_values`, roles) | `roles` | `#/properties/roles` |
| `scripts/validate_social/awareness.rb` `step_label_checks` | `stepLabels` | `.../socialAwarenessEpisode/properties/stepLabels` |
| `awareness.rb` `flipDefenderLineByChoice` | that map | `.../strings/properties/flipDefenderLineByChoice` |
| `awareness.rb` `flipMontageByChoice` outer (beat ids) | that map | `.../strings/properties/flipMontageByChoice` |
| `awareness.rb` `flipMontageByChoice` inner (option ids) | the value map | `child(montage, beat)` |
| `awareness.rb` `guess_credential_checks` (recursive) | the `guess` subtree | `.../socialAwarenessEpisode/properties/guess`, threaded down with `child`/`item` |
| `scripts/validate_social/mail.rb` `replies.byChoice` | that map | `child(.../socialPhishTarget/properties/replies, byChoice)` |

**KEPT — plan agrees (fixed-field block, a `_` key is a note by step 2's `^_` pattern; the resolver gives the same answer, so the by-name skip stays):** `validate_npc_habits.rb:122` (`habits`); `awareness.rb` `facilitator` and the `{label,opens}` rows; `triage.rb:425` (`{phish,real}` feedback) and `:628` (form fields); `options.rb:122` (hint variants); `validate_social/dm_app.rb:65`,`:131` (`app`, `profile`); `validate_social.rb:130` (`unlockCondition`). In `validate_scenario.rb`, `:264`'s old grant-walker `_` skip went with the migration; the remaining `start_with?('_')` sites there are the suggestion/formatter split and the separate minigame-schemas file, which stay as the rule that a note name is never offered as a suggestion.

**KEPT — differs from the plan (plan said move; resolver says note, so kept as-is):**

| Site | Why the resolver says note |
|---|---|
| `triage.rb:419` `labels.verdictFeedback` (outer) | the verdictFeedback block is fixed verdict keys + `^_` note pattern, `additionalProperties:false` |
| `triage.rb:707`/`:718` `verdict_points_checks` (the `{phish,real}` split map and the direct verdict map) | the kindPoints value is `oneOf[socialTriageKindPointsMap, {phish,real}+^_]`; both are fixed-field, the `^_` pattern on the split branch makes a `_` key a note |
| `options.rb:94` `hintsByFactor` | fixed factor keys + `^_` note pattern, `additionalProperties:false` |

A unit assertion covers each class: `test_moved_sites_treat_underscore_as_id` (moves resolve to id) and `test_kept_sites_treat_underscore_as_note` (verdictFeedback, the kindPoints value, hintsByFactor resolve to note). No site the grep found is left unclassified.

### Phase B1 (build/harden-2b): the walkers skip notes, the capture keyword, the Rails route proofs

Date: 2026-11-12. Commits: e61ef12f4 (walkers + capture keyword + schema-walk parts 3 and 6), a722680b1 (Rails route tests), and the commit holding this log. Phase B2 (payload strips, route audit, boot initializer, README item 8, live proof) is deliberately left out, so the branch is still inert at run time (no strip runs, no initializer).

**Walkers that grant or derive skip notes, visit free data (plan item 2).** Each now carries a schema Node and skips a Hash entry when `AuthorNotes.note?` is true, through `AuthorNotes.each_live` or its own lambda, while descending into free data in full:
- `NetworkModel.grant_foothold_actions` (network_model.rb) and `DeclaredGrants.collect` (declared_grants.rb): rewritten on `each_live`, which yields the same key path the old lambdas built (String Hash keys, Integer Array indices), so `DeclaredGrants.executed?`/`path_string` are unchanged.
- `WearableModel.wearable_items` (on `each_live` with `prune: ->(k){k=='wearable'}`) and `.global_writers` (on `each_live`); a `tree_path(keys)` helper rebuilds the old path string.
- `OwnerClaim.scenario_objects` (keeps its `add`/`add_values` lambdas, each gains a Node argument) and `.mappings` (on `each_live`, starting at `#/definitions/npc/properties/eventMappings` for an Array shape, `#/definitions/eventMapping` for the bare Hash).
- `Game#merge_biometric_samples!`' known-owner walk (on `each_live`).
- `scripts/validate_network.rb`'s `gf_walk` (keeps its host-carrying lambda, gains a Node, skips notes), so the network validator and the server agree. The validator's own grant walker was migrated in phase A.
- Guarded `require_relative 'author_notes'` added to network_model, declared_grants, wearable_model, owner_claim, capture_model and validate_network; author_notes pulls scenario_schema. No new `STARTS` pointer was needed (every walk starts at `ScenarioSchema.root` or at the two eventMapping pointers already in STARTS).

**Capture writers (plan item 5).** `CaptureModel.each_capture_writer(data, notes: :skip, &block)` gains the keyword and carries a Node. `:skip` (the default, and what all seven callers take) skips a writer inside a note; `:visit` visits notes (for a later withholding caller). Free data is visited either way. The `enum_for` form forwards the keyword (`enum_for(:each_capture_writer, data, notes: notes)`), so an enumerator caller keeps its mode.

**Schema-walk test (test/unit/scenario_schema_test.rb).**
- Part 3 gains `test_runtime_probe_walk_owner_and_capture_agree`: for every reached Node on a clean data path (no `_`- or `#`-prefixed segment), place `{ "_probe" => { id, addCapture } }` at the path and run `OwnerClaim.scenario_objects` and `CaptureModel.each_capture_writer` from the root; both see the probe iff `AuthorNotes.note?` is false there, and neither otherwise. The expectation keys off `note?` (which is false whenever a Node has a free branch, so a typed property beside a free branch such as `socialExercise.config` is kept), not off `classify`'s kind. ~2,400 clean-path Nodes checked.
- Part 6 gains `test_corpus_has_no_setglobal_map_under_nil`: renders all 175 templates (via the validator's `render_erb_to_json`, so it needs the json-schema gem; loads fine under both 2.7.8 and /usr/bin/ruby3.2) and walks each from the root with the resolver.

**Part 6 finding and a deviation from the plan's letter, needs sign-off.** The plan says the part-6 list is empty on main. The dangerous case it names (a `setGlobal`/`setVariable` MAP-of-names key reached under nil, where a `_` name would be dropped as a note) *is* empty, and part 6 hard-fails on it. But five `type: set_global` ACTION hashes sit under nil, because objects are open core kinds (`scenarioData`, `onOwnerNoticesMissing` are undescribed and stay so until the section-7 closure): `lab_physical_pentest` `open_plan/objects/3/onOwnerNoticesMissing/0`, `sis01_healthcare` `it_security_office/objects/1/scenarioData/minigameData/{completionActions/0, progressActions/0, progressActions/1}`, and `test_clone_left_card` `office/objects/2/onOwnerNoticesMissing/0`. These are harmless: a set_global action's name is a value field, not a Hash key, so no `_` name is dropped and `global_writers` still collects them (the corpus before/after for `global_writers` is identical). Part 6 asserts this exact list (`KNOWN_SET_GLOBAL_UNDER_NIL`) so a *new* one is caught, rather than asserting empty. This differs from the plan's "empty" wording; it keeps a meaningful test and needs an orchestrator ruling (treat as a documented known list, or mark these locations in the schema in a later step).

**Corpus before/after, identical (plan's corpus check).** All 175 templates rendered once (`srand(1)`), then the walker lists computed with the new working tree and with the HEAD (phase-A) lib (a `git archive HEAD` copy, with `scenarios/` symlinked so `default_story_text` resolves): `grant_foothold_actions`, `DeclaredGrants.for`, `global_writers`, `capture_writers`, `scenario_objects` (id/room/held) and `leave_route` per NPC are **byte-identical** across the corpus. (A first run showed a spurious `leave_route` diff that was only the old copy's `scenarios/` not resolving; the symlink removed it.)

**Rails route tests (test/controllers/break_escape/network_notes_not_live_test.rb), on the NS network fixture.** `POST /network/implant`: a `grant_foothold` in a `_draft` note answers `no_action`; a grant in an `_annex` room (an id that starts with `_`, honoured) and a grant in free-data `minigameData.completionActions` succeed; a note-held copy ahead of the live action does not win the first match (the stored foothold's `name` is the live action's). `POST /network/plant`: a rogue device granted only in a note is `no_device` (not a declared device via `rogue_device_definitions`), one granted in free-data `completionActions` succeeds. **Revert proof:** stubbing `AuthorNotes.note?` to return false (notes treated as live) fails 5 of 8; the 3 positive free-data/`_annex` cases pass either way. The capture Rails cases (plan item 5's route tests) are **not yet written** (phase B2 list).

**Tests run (test-lock congestion rule, single files / targeted only).** Unit: `author_notes_test.rb` (19/72), `scenario_schema_test.rb` (10 runs, 12790 assertions, under both Rubies; part 6 runs, not skipped). Node: `grant-foothold-action` (4), `biometric-samples` (9), `dungeon-graph-networks` (52), `validator-note-actions` (2). Rails: the new `network_notes_not_live_test.rb` (8/25), and the consumer suites `network_implants_test`, `capture_payload_secret_routes_test`, `biometric_samples_test` (28/209), `owner_claim_enforce_test` + `wearable_test` (31/281), `owner_claim_test` unit (18/151). All green. Validator spot-run on m01 and sis01: 0 errors. Full Rails/JS suites not run (congestion rule).

**Gotchas carried forward.** (1) The PostToolUse formatter reindented the `if/else` in `OwnerClaim.mappings` after an Edit; rewritten as a single-line ternary and verified. Check every diff on Ruby edits. (2) Part 6 needs the validator renderer, so run `scenario_schema_test.rb` where the json-schema gem is on the load path. (3) The part-6 `type: set_global`-under-nil known list is a deviation awaiting an orchestrator ruling (see above).

### Phase B2 (build/harden-2b): notes never ship, the boot initializer, README item 8, the live proof

Date: 2026-11-12. Commits: 17e9c9326 (payload strips + boot initializer), 48afbfd47 (Rails note/capture/boot tests), the README commit, and the commit holding this log, the scenario and the plan line. This closes step 2b's run-time work: notes are now stripped from every client payload and the schema boots under eager_load.

**Notes never ship (plan item 3).** `AuthorNotes.strip_notes!(copy, node)` runs at each payload builder, after that builder's own filtering and before any player-state key is attached, on a copy the route already owns (never the stored `scenario_data`):
- bootstrap (`GET scenario`, games_controller.rb): on `filtered` right after `filter_requires_recursive`, with `ScenarioSchema.root`, before `objectivesState`, `savedGlobalVariables`, `captures`, `savedCurrentRoom`, `playerInventory` and the other player-state keys are attached. A `_`-prefixed saved global in `savedGlobalVariables` is kept (attached after the strip).
- `Game#filtered_room_data`: at the end, on `room` (a `deep_dup`), with `#/definitions/room`. Covers `GET room/:id`, `POST unlock`'s door `roomData` (`serve_opened_room`) and `POST npc_workaround`'s `roomData`.
- `filter_container_contents`: on the returned list, with `#/definitions/item/properties/contents`. Covers `GET container`, the unlocked object's `contents` from `POST unlock` and the sign-in desktop (`render_login_desktop`).
- `Game#command_board_config`: returns `strip_notes!(config.deep_dup, nil)` (the schema does not declare `commandBoard`, so every `_` key is a note). Attached to the bootstrap after its strip.
- `Game#filter_inventory_for_client!` entry points: `item_for_answer` (one item, `#/definitions/item`) and `client_inventory` (the inventory list, `#/definitions/item/properties/contents`). Covers the bootstrap `playerInventory`, the network inventory echoes (`item_for_answer` in `network_access.rb`, `client_inventory`) and every route that hands over an inventory copy.

**The route audit (plan item 3).** Grep of every `render json:` in `app/controllers/break_escape/`: 95 in games_controller.rb, 4 in api/games_controller.rb, 2 in player_preferences, 1 in application_controller. Every route that returns scenario-derived data is now covered by one of the strips above:

| Route | Scenario data? | Strip that covers it |
|---|---|---|
| `GET scenario` (bootstrap, `render json: filtered`) | yes (whole scenario + `playerInventory`) | bootstrap strip + `client_inventory` |
| `GET room/:id` (`room: room_data` = `filtered_room_data`) | yes | `filtered_room_data` |
| `POST unlock` (`door_answer`/`response` roomData via `serve_opened_room`; unlocked object `contents`) | yes | `filtered_room_data` + `filter_container_contents` |
| `POST npc_workaround` (`roomData`) | yes | `filtered_room_data` |
| `GET container/:id` (`contents`) | yes | `filter_container_contents` |
| `render_login_desktop` (sign-in desktop `contents`) | yes | `filter_container_contents` |
| network result bodies (`network`, `network/implant`, `inventory`, ...) carrying `added`/`inventory` echoes | yes (inventory echo only) | `item_for_answer` + `client_inventory` |
| `GET ink` | no (compiled ink, not scenario JSON) | none needed |
| `GET scenario_map` | no (only room type/connections/locked/lockType/hasNPCs/accessible) | none needed |
| `GET capture_secrets`, `GET objectives`, `conclude_mission`, flag submission, `tts`, all `{success:...}`/`result[:body]` status routes | no (player-state/action outcomes, no scenario `_` notes) | none needed |

Confirmed and recorded: `api/games_controller.rb` is **not routed** (`config/routes.rb` has no `Api` scope, and the controller's own comment says it must stay unrouted because it stores the client's item as sent), so its `render json: player_state['inventory']` is unreachable and carries no strip. `GET scenario_map` carries only navigation metadata (confirmed by reading the method). No engine JS reads a `_` property of a payload (phase A grep, unchanged).

**The boot initializer (plan item 1, "The boot check", item 7 on the NOT DONE list).** `engine.rb` gains `initializer 'break_escape.scenario_schema'`, which requires `scenario_schema` and calls `ScenarioSchema.boot_check!(app)`. With `eager_load` on (production, CI test) a missing, unparsable or broken schema raises at boot; with it off (development, rake tasks) it does nothing and the schema compiles lazily. `boot_check!` itself was already in `scenario_schema.rb` from phase A.

**Tests.**
- `test/controllers/break_escape/notes_never_ship_test.rb` (6 tests): the bootstrap, the bootstrap `commandBoard`, `GET room/:id`, `GET container` and a `_annex` room each carry no author note, while free-data values, `_` global ids, a `_annex` room id and a saved `_` global still ship; the stored `scenario_data` keeps every note after the strips. Revert proof: with `strip_notes!` made a no-op, 4 of 6 fail (the two free-data/id guards pass either way).
- `test/controllers/break_escape/capture_notes_not_live_test.rb` (4 tests): a note-held `addCapture` neither serves nor shadows the live secret of the same target id; a note-only writer target is never declared, so never served; a note-only mapping proof does not turn proof-gating on (the account password is served as today); a note-held proof does not satisfy gating (with a live `captureProof` elsewhere, the account password stays withheld though `droppedItems` would make the note proof hold if read). Revert proof: with `each_capture_writer`'s default flipped to `notes: :visit`, all 4 fail.
- `test/unit/scenario_schema_boot_test.rb` (4 tests): `boot_check!` raises on a missing and on an unparsable file under `eager_load`, no-ops with `eager_load` off (does not read the path), and with the default path installs the table so `root` does not re-read.
- Consumer suites run green with the strips in place: `capture_payload_secret_routes_test`, `capture_secret_endpoint_test`, `capture_proofs_test`, `access_model_desktop_test`, `access_model_login_test`, `npc_container_unlock_test`, `network_no_exposure_test`, `saved_current_room_test`, `inventory_canonical_item_test`, `reload_persistence_test`, `games_controller_test`, `npc_workaround_test`, `declared_grants_test` (304 + 74 + 69 + 108 runs across the batches, 0 failures).

**Part-6 `KNOWN_SET_GLOBAL_UNDER_NIL` ruling (orchestrator, phase B2).** The five `type: set_global` action hashes under nil (phase B1) stay pinned as `KNOWN_SET_GLOBAL_UNDER_NIL` in the schema-walk test. They are harmless (a set_global's name is a value field, not a Hash key, so no `_` name is dropped and `global_writers` still collects them). They will get schema marks/declarations at the core-kind closure (plan section 7.2), where the test's list is reset to empty in the same commit. One line added to plan section 7.2 records this.

**README (plan item 8).** `README_scenario_design.md` gains the three-mark rule for a new open node: a map key is an id, an `x-free-data` node is free data, anything else is structure where a `_` key is a note; a new open node must carry exactly one of `x-id-map: true`, `x-id-map: false`, `x-free-data: true`; a map node never carries a `^_` pattern; the schema walk test enforces all three. Phase A's shorter note (a note is dead and never ships, an id may start with `_`, free data is not a note, the resolver decides) stays above it.

**Live proof (plan item 10).** `scenarios/test_author_notes/` (0 validator errors, 7 recommended-field warnings only): a `lobby` with an NPC carrying `creds` and `_creds_old`, a locked `safe` with a `_draft` holding a PIN, a `crate` whose `contents` folder holds a `_note` password, a `command_board` whose `commandBoard` holds a `_note`, a `note_pc` with a dead `grant_foothold` inside `_draft` (the validator's grant walker skips it, no error), plus an object-valued global `board_state` with a `_inner` free key and a `_secretglobal` id; a reachable `_annex` room. Keyless server on port 3270, game 2345 created by `tools/playtest/swap-scenario-game.rb test_access_networks test_author_notes --unlock-all` (173 missions before and after, no `db:` task). Over the real HTTP routes:
- `GET scenario`, `GET room/lobby`, `GET room/_annex`, `GET container/crate` (crate unlocked): none of `NOTE-CREDS-OLD-111`, `NOTE-DRAFT-PIN-222`, `NOTE-CONTENTS-PW-333`, `NOTE-BOARD-444`, `NOTE-FOOTHOLD-DEAD` appears.
- Positive: `guard` ships without `_creds_old`, `safe` without `_draft` (lockType kept), the `folder` ships without `_note`, `commandBoard` ships as `{title: "Ops"}` with no `_note`.
- Ships as authored: `board_state._inner = FREE-GLOBAL-VALUE-555`, the `_secretglobal` global id, and the `_annex` room id all reach the client in the bootstrap.
- Stored `scenario_data` of game 2345 still holds `_creds_old` and `commandBoard._note` (the strips work on copies).
- The server was stopped afterwards (its own PID on 3270). The grant_foothold live/dead behaviour was proven through the real `POST network/implant` route in phase B1 (`network_notes_not_live_test`), so the fixture keeps only the dead note grant (schema-valid without a full network block); the HTTP proof here covers item 3's strips.

### R1 fixes

Review: `docs/achitechture/SCENARIO_FORMAT_HARDENING_STEP2B_REVIEW_R1.md` (1 blocker, 0 majors, 1 minor, 1 nit), all fixed.

**B1 (blocker) and n1 (STARTS).** Two routes shipped a scenario sub-object that a model method deep_dups straight out of `scenario_data`, bypassing the six controller strips:
- `social_feed.rb` `feed_answer`: the intel fact (`facts[fid].deep_dup`) was embedded unsliced as `fact.entry`. Now `AuthorNotes.strip_notes!(entry, ScenarioSchema.at('#/definitions/socialIntelFact'))` on that owned copy before `out` is built. Closes the bootstrap `feedPosts`, `POST /feed_post` and `POST /friendface_phone?posts=1` paths, which all route through `feed_answer`.
- `game.rb` `objectives_state` (`GET /objectives`): each objective was `map(&:deep_dup)`ed and filtered for target flags only. New `strip_objective_notes` strips each duped objective with `#/definitions/objective` after `filter_target_flags`.
- `ScenarioSchema::STARTS` gains `#/definitions/socialIntelFact` and `#/definitions/objective` (n1). `scenario_schema_test`'s Explore-pointer assertion (every `ScenarioSchema.at` literal is in STARTS) still passes; the test now reaches more Nodes (12610 assertions).

**Route audit redone as "what each render embeds" (B1 fix instruction).** Every `render json:` in `app/controllers/break_escape/` traced back to its source; the question is no longer "what the controller builds" but "what the response actually carries". A scenario sub-object can carry a note only when it is embedded wholesale (deep_dup or an unsliced reference). Results:

| Render / route | What it embeds from scenario_data | Wholesale? | Strip |
|---|---|---|---|
| `GET scenario` (bootstrap) | whole scenario, `feedPosts`, `playerInventory`, `commandBoard` | yes | root strip + `feed_answer` + `client_inventory` + `command_board_config` |
| `GET room/:id`, `POST unlock` roomData, `POST npc_workaround` roomData | room (deep_dup) | yes | `filtered_room_data` (`#/definitions/room`) |
| `GET container/:id`, unlock contents, `render_login_desktop` | object contents | yes | `filter_container_contents` |
| `POST feed_post`, `POST friendface_phone`, bootstrap feedPosts | intel fact entry (`feed_answer`) | **yes — was unstripped** | **FIXED: `feed_answer` strip** |
| `GET objectives` | each objective (`objectives_state`) | **yes — was unstripped** | **FIXED: `strip_objective_notes`** |
| `GET network` (`network_rows`) | host and resource rows | no — `host_row`/`resource_row` build key-by-key | none needed |
| `GET login_accounts` | account tiles | no — `login_account_tiles` builds `{username,displayName,portrait,avatar}` | none needed |
| `GET capture_secrets` | `{target_id => secret_string}` | no — key-by-key strings | none needed |
| `GET container` PC session, `session_for_client` | login session answer | no — `login_session_answer` key-by-key | none needed |
| `GET scenario_map`, `GET ink`, flag/tts/`{success:...}` routes | navigation metadata / compiled ink / action outcomes | no scenario `_` note | none needed |

Only `feed_answer` and `objectives_state` embedded a sub-object wholesale without a strip; both are fixed. No other leak found.

**Sentinel backstop (orchestrator addition; m1).** `scenarios/test_author_notes/scenario.json` extended so a `_`-prefixed author note holding a unique `SENTINEL-` value sits in every note-capable block a player route can ship. The resolver (not memory) was used to pick the locations: a scratch walk with `AuthorNotes.note?`/`ScenarioSchema` over the fixture confirms 20 `_sentinel*` keys resolve to **notes** (rooms, objects, contents, NPCs, intel facts, feed posts, objectives, tasks, command board, items held, start items, phone, networks + wifi, social + mailClient, policy, resource) and 3 `_` keys resolve to id/free (`_secretglobal` global id, `board_state._inner` free value, `_annex` room id). The fixture validates clean (`validate_scenario.rb --no-graph`: 0 errors, 10 warnings, all recommended-field / action-in-note / unused-resource warnings).

`test/controllers/break_escape/author_notes_sentinel_test.rb` (5 tests): plays the main routes (bootstrap, rooms lobby/vault/_annex, container crate, feed_post, friendface_phone, objectives, capture_secrets, network, inventory echo, sync_state) and asserts no body carries a `SENTINEL` value or a `_sentinel` key; asserts the free value, `_` global id and `_annex` id ship in the bootstrap; asserts the feed reveals the `jake_secret` fact and `GET /objectives` ships `aim_1` (so the B1 routes are actually exercised); and a resolver-driven coverage test asserting each required block kind has a sentinel note. **Must-fail proof:** with both B1 strips disabled, the main-route test fails (`feed_post shipped a sentinel note value`, `SENTINEL-FACT` in the fact entry); restored.

**Live proof (port 3272, game 2356, keyless server, now stopped).** `swap-scenario-game.rb test_access_networks test_author_notes --unlock-all` (no `db:` task; Mission count unchanged), then `encounteredNPCs`/`unlockedObjects` set on the one game row. A headless-browser capture (Playwright, headless shell) recorded every `/games/2356/*` response: the engine's own boot fetches plus a driven sweep of `/scenario`, `/room/{lobby,vault,_annex}`, `/container/crate`, `/feed_post`, `/friendface_phone`, `/objectives`, `/capture_secrets`, `/network`, `/sync_state`. All 200. No `SENTINEL` value and no `_sentinel` key in any body. `FREE-GLOBAL-VALUE-555`, `_secretglobal` and `_annex` ship in the bootstrap. The feed revealed `jake_secret` (fact entry shipped, note stripped) and `/objectives` shipped `aim_1`. Server stopped by its own PID.

**Tests run (test-lock congestion rule; single/targeted files under the shared flock lock).**
- Rails: `author_notes_sentinel_test` (5/110); `feed_post_test`, `feed_post_reply_test`, `friendface_phone_test`, `social_sync_then_emit_test`, `games_controller_test`, `filtered_scenario_test`, `reload_persistence_test` (223/992) — the consumers of the two changed methods.
- Unit: `scenario_schema_test` (10/12610, STARTS change), `author_notes_test` (19/72).
- No node test references `test_author_notes` or `scenario_schema` (grep), so none is affected by this round; the change is Ruby-only.
- Validator: `validate_scenario.rb scenarios/test_author_notes/scenario.json --no-graph` → 0 errors, 10 warnings.
- Diffs checked for the PostToolUse reindent gotcha: no unrelated Ruby block moved.

**Files touched (R1):** `app/models/break_escape/social_feed.rb`, `app/models/break_escape/game.rb`, `lib/break_escape/scenario_schema.rb`, `scenarios/test_author_notes/scenario.json`, `test/controllers/break_escape/author_notes_sentinel_test.rb`, this log.

## Step 7. formatVersion and the load-time upgrader (phase 1: server and validator)

Date: 2026-11-12. Branch `build/harden-7`, made from main `c9a4f7a84` (step 2b merged). The plan's
request-site and line references were re-anchored on that main. Phase 1 is the server side, the
validator rules and their Rails and node tests. **Phase 2 (not built here):** the client fetch guard
(`public/break_escape/js/format-guard.js`), the `core/game.js` bootstrap-refusal handling and client
reload logic, the node static scan of request sites and the jsdom wrapper tests, the sweep tool
(`tools/format/upgrade_games.rb`) and all live proofs. See the handover for exactly where this stops.

### What changed (phase 1)

- **`lib/break_escape/format_upgrade.rb` (new).** Plain Ruby, required with the guarded form. `STEPS`
  is an empty, unfrozen Array (the dev switch appends in place; nothing is reassigned), read only
  through `steps` so a test stubs that one method. `current` is the last step's version or 0.
  `version_of(data)` gives 0 for an absent or nil field, the Integer for a non-negative Integer, and
  raises `Unreadable` for a string, float or negative. `upgrade!(data, state)` runs each step above
  the stored version in order on both in place, stamps `current`, and reports `scenario_changed` by
  comparing a `Marshal` deep copy of data (without `formatVersion`) taken once before the first step;
  a stored version above current raises `TooNew`. `retired_keys_in(data)` walks with
  `AuthorNotes.each_live(..., free: :skip)`, so notes and free data are skipped. `ALIASES` is empty
  (`apply_aliases!`, `aliased?`). `install_dev_test_step!(env:, enabled:)` appends one no-op step
  (version 900) only in development, idempotently.
- **`app/models/break_escape/game.rb`.** `before_create :stamp_format_version` stamps `current` onto
  data that has no `formatVersion` (so supplied data with `formatVersion: 0` keeps 0, as `0 ||=` is a
  no-op). `ensure_current_format!` raises `TooNew`/`Unreadable` for a too-new or unreadable game, and
  otherwise upgrades under `with_lock { reload; upgrade!; prepare_scenario_data! if scenario_changed;
  save! }`, taking the lock only when the stored version is below current.
- **`app/controllers/break_escape/application_controller.rb`.** `prepend_before_action
  :set_format_header` sets `X-Break-Escape-Format: <current>` on every engine response; a `rescue_from
  ActionController::InvalidAuthenticityToken` answers CSRF failures locally (422 JSON) for JSON
  requests only (`request.content_mime_type&.json? || request.format.json?`) and re-raises otherwise.
- **`games_controller.rb`.** Re-prepends `set_format_header` after its `refuse_oversized_body` prepend,
  so the header stays first in this controller's chain. `set_game` runs `ensure_current_format!` and
  turns `TooNew`/`Unreadable` into `render_format_refusal` (the HTML page for `show`, 409 JSON
  `{ error, message, current }` for every other route). `sync_state` plucks the stored version under
  its row lock (`scenario_data -> 'formatVersion'`, parsed if the adapter hands back JSON text) via
  `sync_format_refusal`, before any merge, and answers 409 without writing when it is too new or
  unreadable. The `scenario` bootstrap ships `filtered['formatVersion'] = version_of(scenario_data)`.
- **`static_files_controller.rb`.** `skip_before_action :set_format_header`, so a cached asset never
  carries a stale version.
- **`app/views/break_escape/games/format_refusal.html.erb` (new).** The HTML refusal page: self-hosted
  pixel fonts (GNF, Press Start 2P), a 2px solid square-cornered border, no radius or smooth fonts.
- **`lib/break_escape/engine.rb`.** A `break_escape.format_upgrade_test_step` initializer calls
  `install_dev_test_step!(env: Rails.env)` (acts only in development with the env var set).
- **`scripts/scenario-schema.json`.** `formatVersion` declared as a top-level `integer`, `minimum 0`.
- **`scripts/validate_scenario.rb`.** `check_retired_keys` errors on a template that sets
  `formatVersion` and on each key `FormatUpgrade.retired_keys_in` finds (a warning for an aliased
  key); wired into the common run block. STEPS is empty, so it adds no corpus line.

### Sync size

Step 7 adds one integer to `scenario_data` (written once at creation or upgrade, never in
player_state), one integer to the bootstrap and one constant response header. `sync_state` reads one
jsonb scalar (`scenario_data -> 'formatVersion'`) under the lock it already holds; it never loads the
full `scenario_data` blob and writes nothing on a refusal. player_state is untouched.

### Tests (phase 1)

- Unit `test/unit/format_upgrade_test.rb` (12): `version_of`, `current`, `upgrade!` order/idempotence/
  `TooNew`, `scenario_changed` (no-op false, rename true, player_state-only false), the mixed
  anonymiser state equals a clean upgrade, `retired_keys_in` depth and note-skip, the dev switch.
- Controller/model `test/controllers/break_escape/format_version_test.rb` (17): creation stamping; a
  pre-step-7 game not written on load (ships and headers 0); the header on an ordinary route and on
  every early exit (409 refusal, Pundit, CSRF 422, oversized body); `set_format_header` first on every
  engine controller bar the static one; the 409 refusal on `scenario`/`room`/`show`/`sync_state` with
  nothing written; unreadable refused; re-preparing only when a step changed the scenario; the lock
  rerun; sync never upgrades.
- Node `test/js/validator-retired-keys.test.mjs` (5): a retired key is one error with the new name; a
  key inside a note is ignored; a `formatVersion` template errors; an aliased key is a warning.
- Updated `reload_persistence_test.rb`: the sync query-count test now expects the narrow FOR UPDATE
  load plus the one formatVersion jsonb-scalar pluck, and asserts the full `scenario_data` column is
  never loaded.

### Must-fail proof

The too-new refusal test returned 200 with `@game.ensure_current_format!` removed from `set_game`
(refusal gone), and 409 with it restored. The node and unit tests fail by construction without
`check_retired_keys` / `FormatUpgrade`.

### Results

- `test/unit/format_upgrade_test.rb`: 12 runs, 0 failures.
- `test/controllers/break_escape/format_version_test.rb`: 17 runs, 0 failures.
- `test/js/validator-retired-keys.test.mjs`: 5 pass.
- Affected existing files, all green: `reload_persistence_test` (69), `games_controller_test` +
  `authorization_test` + `author_notes_sentinel_test` (89 together), `notes_never_ship_test` +
  `capture_notes_not_live_test` (10), `filtered_scenario_test` (21).
- Validator spot-check (`--no-graph`): m01, m02, test_author_notes, test_access_networks all
  `Result: 0 errors`. STEPS empty, so `check_retired_keys` adds nothing to the corpus.
- Diffs checked for the PostToolUse reindent gotcha: every edited Ruby diff is additions only (plus
  the one intended `if refusal` -> `elsif refusal` in sync_state); no unrelated block moved.

### Files touched

`lib/break_escape/format_upgrade.rb` (new), `lib/break_escape/engine.rb`,
`app/models/break_escape/game.rb`, `app/controllers/break_escape/application_controller.rb`,
`app/controllers/break_escape/games_controller.rb`,
`app/controllers/break_escape/static_files_controller.rb`,
`app/views/break_escape/games/format_refusal.html.erb` (new), `scripts/scenario-schema.json`,
`scripts/validate_scenario.rb`, `test/unit/format_upgrade_test.rb` (new),
`test/controllers/break_escape/format_version_test.rb` (new),
`test/js/validator-retired-keys.test.mjs` (new),
`test/controllers/break_escape/reload_persistence_test.rb`, this log.

### Step 7 (build/harden-7) handover

- **Done (phase 1):** the full server side (FormatUpgrade, stamping, `ensure_current_format!` under
  the row lock from `set_game` with re-prepare on change, the 409/HTML refusal, `sync_state`'s version
  check under its lock, the header on every engine controller with the static exemption, the CSRF
  rescue for JSON only, the bootstrap `formatVersion`), the schema declaration, the validator rules,
  and their Rails and node tests. Commits: `355d02bda` (server + validator), `583a2508b` (tests),
  `c6757d489` (reload query-count test), plus the commit holding this log section.
- **In progress:** none.
- **Open / phase 2 (where this stops):**
  1. The client fetch guard `public/break_escape/js/format-guard.js` (first import of `main.js`), the
     wrapper comparison and reload/banner logic, and the `core/game.js` `loaderror` bootstrap-refusal
     handling. None of these exists yet; the server already sends the header, the bootstrap
     `formatVersion` and the 409 bodies they consume.
  2. The node static scan of request sites and the jsdom wrapper + bootstrap-refusal tests.
  3. The sweep tool `tools/format/upgrade_games.rb` and its `--dry-run` test.
  4. All live proofs (old game on the base worktree, new game, the reload-for-real with the dev
     switch, the refusal, and the clean-up of 900-stamped games). The base worktree (port 3281) is
     not yet made; the dev switch and `swap-scenario-game.rb --format-version` support (plan's
     refusal proof) are the one server-side bit the swap tool still needs for phase 2's refusal proof.
  5. Optional/deferred Rails tests from the plan's list that are lower value for the no-rename step 7
     and heavier: the per-deployed-scenario re-prepare test (render the four deployed templates) and
     the alias-rule test. The `scenario_changed`/re-prepare logic they guard is already covered by the
     fixture-step controller tests.
  6. README sections for `formatVersion` and the validator wording, and the six skill wording
     proposals, were not touched (none needed for the server mechanism; propose at phase 2).
- **Gotchas:**
  1. `STEPS` must stay an unfrozen Array and be read only through `FormatUpgrade.steps`; tests stub
     `steps` (minitest block-form `stub`, `require 'minitest/mock'`), the dev switch appends in place.
  2. `swap-scenario-game.rb` must stamp `current` on swapped data and gain `--format-version <n>` for
     the phase-2 refusal proof (900); it is never used to make an "old" game (plan section 2).
  3. The `sync_state` formatVersion pluck is defensive about the adapter returning JSON text vs a
     decoded value; `reload_persistence_test`'s query-count test was updated for the extra scalar read.
  4. The PostToolUse formatter reindents Ruby after an Edit; every diff here was checked.

## Step 7 phase 2. The client, the deferred tests, the tools (build/harden-7)

Date: 2026-11-13. Built on the phase-1 server side already on the branch. Phase 2 is the client
fetch guard, the bootstrap-refusal handling, the two Rails tests phase 1 deferred, the sweep tool,
the swap-tool `--format-version` support, the README note, and the live proofs.

### What changed (phase 2)

- **`public/break_escape/js/format-guard.js` (new).** Wraps `window.fetch`. It is the first import of
  `main.js`, so it installs before any module can keep a `fetch` reference. For each response it reads
  `X-Break-Escape-Format` (ignored when absent or not a run of digits) and compares it with the version
  the tab holds (`held`, null until the bootstrap is read, set by `setHeldFormatVersion`). A mismatch,
  or a `409 { error: "format" }` body (read from a clone, `current` as the version), flushes the pending
  sync (`syncConfirmed({ attempts: 1 })`, awaited up to 3 s) and reloads once per `be-format-reload:
  <gameId>:<held>:<n>` session key; a second mismatch on the same pair, or storage throwing, shows a
  pixel-art banner (2px border, pixel font, `textContent`) and saving carries on. A refusal banner adds
  "Progress cannot be saved on this server." The keepalive flush (`init.keepalive`) is not inspected.
  `showBootstrapRefusal(url, deps)` fetches the bootstrap once and shows a `409 format` message in
  `#loading`.
- **`main.js`.** `import './format-guard.js';` as the first import.
- **`core/game.js`.** Imports `setHeldFormatVersion` and `showBootstrapRefusal`. On
  `filecomplete-json-gameScenarioJSON` it sets the held version from `scenario.formatVersion`; a new
  `loaderror` listener on the `gameScenarioJSON` key calls `showBootstrapRefusal`.
- **`tools/format/upgrade_games.rb` (new).** `bin/rails runner` sweep. `--dry-run` reports counts per
  stored version and, per step, how many games would change, and writes nothing; a real run is refused
  in development. Each real upgrade goes through `Game#ensure_current_format!` under its row lock.
- **`tools/playtest/swap-scenario-game.rb`.** Stamps `formatVersion` (current, or `--format-version N`
  for the refusal proof) on the swapped data, since the swap updates an existing row and `before_create`
  does not run.
- **`README_scenario_design.md`.** A note that `formatVersion` is server-stamped and never authored, the
  validator error, and the refusal/reload behaviour.

### Tests (phase 2)

- **`test/js/format-guard.test.mjs` (new, 9).** The jsdom wrapper: held 0 and header 0 do nothing;
  header absent does nothing; held null is not compared; header 1 against 0 flushes the sync and reloads
  once, a repeat on the pair shows the banner without reloading and saving continues, a new pair reloads
  again; storage throwing shows the banner and never reloads; a keepalive mismatch does nothing; a
  `409 format` (no header) reloads once then banners with the message and the not-saved line; another 409
  error, a non-JSON 409 and an unparseable body all do nothing and the caller keeps its response;
  `showBootstrapRefusal` shows the message in `#loading` on a `409 format` and nothing otherwise.
- **`test/js/format-guard-sites.test.mjs` (new, 5).** A static lint (a backstop, not a soundness proof):
  no fetch capture (assignment, bracket access, destructuring off a global, or passing fetch as an
  argument); none of the non-fetch transports that could load `scenario_data` past the wrapper
  (`XMLHttpRequest`, `EventSource`, `WebSocket`, `navigator.sendBeacon`); the only engine-route
  `load.json` is the `gameScenarioJSON` bootstrap in `core/game.js`; `format-guard.js` is main.js's first
  import. A sufficiently indirect reference (a computed property, fetch reached through another object)
  is out of its reach; none exists today. The capture patterns were checked against bad and good forms
  (`const f = fetch`, `this._fetch = window.fetch`, `window['fetch']`, `const { fetch } = window`,
  `foo(window.fetch)` match; `deps.fetch ?? (... ? fetch : null)` and `const realFetch = ... : fetch`
  do not).
- **`test/controllers/break_escape/format_deployed_scenarios_test.rb` (new, 7).** For m01_first_contact,
  sis01_healthcare, sis02_energy and lab_social_engineering: a no-op step (current 1 via a fixture list)
  stamps and never re-prepares, on both a prepared and a raw unprepared render, adding only
  `formatVersion`; a renaming step re-prepares once; the alias rule (no retired key outside `ALIASES`;
  a fixture retired key is caught and names the scenario and key).
- **`test/controllers/break_escape/upgrade_games_tool_test.rb` (new, 2).** `--dry-run` over games at 0 and
  at current reports both and writes nothing; a real run is refused in development.

### Results (phase 2)

- `node test/js/format-guard.test.mjs`: 9 pass. `node test/js/format-guard-sites.test.mjs`: 5 pass.
- `bin/rails test test/controllers/break_escape/format_deployed_scenarios_test.rb`: 7 runs, 0 failures.
- `bin/rails test test/controllers/break_escape/upgrade_games_tool_test.rb`: 2 runs, 0 failures.
- Unaffected main.js-source node tests spot-checked green: canvas-fonts, capture-client, test-bridge-parses.
- `bin/rails runner tools/format/upgrade_games.rb --dry-run` live on the dev DB: 1946 games at version 0,
  current 0, would upgrade 0, nothing written.
- Test-lock/congestion rule: targeted files only (the four new test files plus the three spot-checks);
  no change to any Rails controller or model, so no existing Rails test is affected. The orchestrator runs
  the full suites and the validator sweep at the merge batch.

### Must-fail / regression proofs

- The static-scan capture regex was shown to match the forbidden forms and not the call-time ones (inline
  node check). The jsdom wrapper tests fail by construction without the guard logic.

### Commits (phase 2)

- `3dd665c5a` client guard + node tests (format-guard.js, main.js, core/game.js, the two .mjs tests).
- `5f5bbde66` deferred re-prepare and alias-rule Rails tests.
- `21a334aac` sweep tool + dry-run test.
- `2591bf6c2` swap-scenario-game.rb `--format-version`.
- `a486adf7c` README note.
- (this log section's commit).

### Skill wording proposals (for the orchestrator, not applied to any skill)

Phase 2 touches the client load path and adds a validator rule. The following one-line additions are
proposed for the orchestrator to apply to the named skills (builders do not edit `.claude/skills/*`):

1. **validate-scenario** and **scenario-design-review**: add that the validator errors on a template that
   sets `formatVersion` ("the server stamps it at creation") and on any field a later format step renamed
   (the error names the new key and the format).
2. **playtest-scenario**: note that a page reload during play can be the format guard (a game upgraded
   under an open tab), not a crash; a "This game has been updated" banner is expected after a format bump,
   not a bug.
3. **mission-room-dressing** / any UI skill: the format-refusal page and the guard banner follow the
   pixel-art UI rule (2px border, pixel font); keep them that way if touched.
4. **walkthrough-scenario**: when a walkthrough is run against a server older than the game's saved format,
   the game is refused with a 409/HTML format message rather than loading; this is expected, not a failure.
5. A general note for any skill that creates games by swapping (`swap-scenario-game.rb`): the swap now
   stamps `formatVersion`; `--format-version N` is for the refusal proof only and must never be used to
   fake an "old" game.
6. **bump-version** / release skills: a release can run `tools/format/upgrade_games.rb --dry-run` to see how
   many stored games a format step would upgrade; load time remains the guarantee.

### Live proofs

Two keyless servers: the branch on port 3280 (started this session) and a base worktree at the merge base
on port 3281 (not yet made; see handover). Both share the development database; no db: task is ever run.

**Done this session: the server-side refusal, via curl (no switch, so current 0).**
`tools/playtest/swap-scenario-game.rb test_seating test_access_networks --format-version 900` made game
**2394** (`formatVersion 900`). On the branch server at :3280 (current 0, a too-new game):

- `GET /break_escape/games/2394` (show): `409`, HTML body "...newer version of Break Escape (format 900;
  this server reads up to 0)", header `X-Break-Escape-Format: 0`.
- `GET .../scenario`: `409`, body `{"error":"format","message":"This game was saved by a newer version of
  Break Escape (format 900; this server reads up to 0)","current":0}`, header `0`.
- `GET .../room/lobby`: `409`.
- `PUT .../sync_state` by curl returns `422 invalid_authenticity_token` (CSRF first, no token in curl); the
  `sync_state` 409 format refusal itself is proven by `format_version_test.rb`'s sync refusal test.
- Nothing written: after the refusals the game's `scenario_data` still read `formatVersion 900` and its
  `updated_at` was unchanged from the swap (`00:09:46Z`), with player_state intact.

**Clean-up:** game **2394** was set back to `formatVersion: 0` with `update_column` (the swap had no real
design). It is recorded here as **unusable for any later proof**. No other game was touched.

**Not done this session, handed over (browser-driven, need the base worktree):**
- The reload for real with the dev switch (`BREAK_ESCAPE_FORMAT_TEST_STEP=1`, version 900): a tab open on a
  branch game at 0, server restarted with the switch, the page reloading once on a room fetch and (second
  run) on a sync, then no second reload and a saved action. The dev switch, the header, the guard and the
  409 bodies they consume are all built and unit-proven; this needs a real browser under the switch.
- The refusal with an open tab across a switch-off restart (tab holding 900 after its reload, then the
  server restarts without the switch): the next room fetch and sync each `409`, the tab reloads once, the
  reloaded bootstrap is refused and shows the message in `#loading`, player_state unchanged.
- The old game from before step 7, made on the base worktree at the merge base and loaded on the branch
  (no reload, `scenario_data` holds no `formatVersion`, the PIN door opens, `verify-run.rb` shows progress).
- The new game on the branch (m01 through the PIN door, stamped 0).
These five browser proofs are the remaining phase-2 work; everything they exercise exists and is unit- or
curl-proven, so they are verification, not new code.

### Step 7 phase 2 handover (build/harden-7)

- **Done:** the client guard and its wiring (format-guard.js, main.js first import, core/game.js version +
  bootstrap refusal), the two node tests (wrapper + static scan), the two deferred Rails tests
  (per-deployed-scenario re-prepare, alias rule), the sweep tool + dry-run test, swap-tool
  `--format-version`, the README note, and the server-side refusal live proof via curl (game 2394, now
  cleaned to 0). Commits `3dd665c5a`, `5f5bbde66`, `21a334aac`, `2591bf6c2`, `a486adf7c`, `63a39d59a`, and
  this log commit.
- **In progress:** none.
- **Open (hand over):** the five browser-driven live proofs above. Steps to resume: (1) make the base
  worktree by hand at `git merge-base main build/harden-7` (never an isolation worktree, plan section 2),
  start its keyless server on :3281 sharing the dev DB; (2) make the old game there (m01 via new-game.rb,
  or the base's one-off runner for a Mission-less scenario) and play it to the PIN door; (3) stop :3281,
  load the same game on :3280, confirm no reload and no `formatVersion` written; (4) the dev-switch reload
  proof: restart :3280 with `BREAK_ESCAPE_FORMAT_TEST_STEP=1` under an open tab, watch the reload on a room
  fetch and on a sync (record the triggering request from the network log); (5) the switch-off refusal
  proof; clean up every 900-stamped game back to 0 and record ids. The playtest-scenario skill drives the
  browser via the `window.__test` bridge.
- **Gotchas:**
  1. The branch keyless server on :3280 was started this session; stop it (by PID) if still running.
  2. `sync_state`'s 409 format refusal cannot be curled without a CSRF token (CSRF returns 422 first); it
     is covered by `format_version_test.rb`, and a browser POST carries the token.
  3. Game **2394** is a used 900-proof game, now at 0, unusable for later proofs.
  4. No Rails controller or model changed in phase 2, so no existing Rails test is affected; the full
     suites and the validator sweep are the orchestrator's merge-batch job (congestion rule).
  5. The static scan's capture regex is tuned to the current tree; a new call-time `fetch` guard shaped
     unlike `? fetch : null` or `: fetch` could trip it, so prefer those shapes.

## Step 7 live proofs (phase 3, this session)

Date: 2026-11-13. The browser-driven live proofs the phase-2 handover left open, plus the `pick`
check. Two keyless servers sharing the development database: the branch on **:3280** and a base
worktree at the merge base **c9a4f7a84** (the main step 7 branched from, before any step 7 code) on
**:3281**. Base worktree made by hand (`git worktree add --detach`), node_modules symlinked to
`p-9-2-h`, `.bundle/config` copied from `p-9-2-h`, and the branch `development_secret.txt` copied into
the base for the run (md5 `73f96a0c...`; base had none) so CSRF holds across the swap. Headless runs
used `setFPS(20)` with fixed steps on. Drivers live in the session scratchpad (`p-harden-7-proofs/`),
nothing added to the repo. No `db:` task was run anywhere.

Because m01's first progression door (reception to main_office_area) is a lockpicking dexterity
minigame the test bridge cannot play, and the Main Office Key sits behind the receptionist, both games
were head-started into `main_office_area` with `new-game.rb --start-room main_office_area --unlock
main_office_area` (the sanctioned test-only option; it edits only the one game's row and never writes
`formatVersion`). From there the real PIN locks are reached and driven through the real page: the
filing-cabinet PIN **2024** (`main_office_area_safe_0`, an unlocked object) and the IT-room PIN **door**
**2468** (`it_room`, an unlocked room). Both are real `pin` minigames solved by clicking the keypad.

**Proof 1, an old game from before step 7 (game 2397).** Created on the base (old code), so
`scenario_data` has no `formatVersion`. Played on the base server (:3281): the filing-cabinet PIN was
opened; every base response carried no `X-Break-Escape-Format` header (old code) and the bootstrap had
no `formatVersion`; `verify-run.rb` after the base run: 2 unlocked rooms, 1 unlocked object, score 2,
VERDICT "progress recorded". The base server was stopped. The branch server (:3280) then loaded the
same game 2397:
- The page did **not** reload: one page load, and no `be-format-reload:*` key in `sessionStorage`
  before or after play.
- The bootstrap `GET /scenario` returned `formatVersion` the Integer **0** (`version_of` of an absent
  field), and every engine response carried `X-Break-Escape-Format: 0` (`/scenario`, `/room/...`,
  `/inventory`, `/sync_state`).
- `scenario_data` still holds **no** `formatVersion` after the load (read with `bin/rails runner`): a
  game at 0 is not stamped, as the plan says.
- A further real beat on the branch: the IT-room PIN **door** (2468) opened on the first attempt and the
  player entered `it_room`; the sync saved (200).
- Nothing lost: `verify-run.rb` after the branch load shows 3 unlocked rooms (the base's
  main_office_area plus the branch's it_room), the base's unlocked object still present, tasks_completed
  3, score 10, VERDICT "progress recorded".

**Proof 2, a new game on the branch (game 2398).** Created on the branch (new code): `scenario_data`
is stamped `formatVersion` **0** at creation (DB read). Loaded and played on :3280: bootstrap
`formatVersion` Integer 0, header 0 on every response, one page load and no reload key, the
filing-cabinet PIN (2024) opened through the real page, the sync saved. `verify-run.rb`: 2 unlocked
rooms, 1 unlocked object (`main_office_area_safe_0`), task `access_main_office` completed, score 2,
VERDICT "progress recorded" (exit 0).

**Proof 4, what `pick(scenario_data->'formatVersion')` returns on a live DB game.** On PostgreSQL
(the development adapter), `Game.where(id: ...).pick(Arel.sql("scenario_data -> 'formatVersion'"))`
returns a **decoded Ruby Integer** (0 on game 2398), and **nil** when the field is absent (game 2397).
The text form `->>` returns the String `"0"`. The sync refusal (`sync_format_refusal`,
games_controller.rb:2026) uses the `->` form, so on this adapter it already receives an Integer and the
`String` branch is not exercised. **Decision: keep** phase 1's defensive `String`/`JSON.parse` branch
unchanged. It is cheap, it is the documented contract (the plan notes `pick` of a jsonb expression "may
come back decoded or as its JSON text, depending on the adapter's result type map"), and `version_of`
rejects anything that is not a non-negative Integer regardless, so the branch is correct insurance
against a different adapter or result type map rather than dead code on this one.

**Games created this session (all development-DB, all `formatVersion` 0 or absent, none 900-stamped):**
2397 (old, base, head-started, proof 1), 2398 (new, branch, head-started, proof 2). Also 2395 and 2396
were m01 games made early to shake out the drivers before head-start was adopted; they are harmless and
untouched. Game 2394 (the prior session's refusal proof) remains reset to 0. No 900-stamped game exists
yet, so nothing needed resetting this session.

**Still open (handed over): the reload-for-real and the refusal with an open tab (plan step 7, "The
reload, for real" and "The refusal").** These need the development switch
`BREAK_ESCAPE_FORMAT_TEST_STEP=1` and a page held open across a server restart. They were not started
this session (context budget). See the handover below for exact resume steps. Everything they exercise
(the switch, the header, the guard, the 409 bodies) is built and unit-proven; the server-side refusal
was already curl-proven last session (game 2394). This remaining work is verification, not new code.

### Step 7 phase 3 handover (build/harden-7)

- **Done this session:** live proofs 1 (old game 2397: no reload, not stamped, header/bootstrap 0, PIN
  door opens, saves, nothing lost), 2 (new game 2398: stamped 0, header/bootstrap 0, no reload, PIN
  opens, saves) and 4 (the `pick` returns an Integer on PostgreSQL; the defensive String parse is kept
  and the reason recorded). No engine code changed; no bug found.
- **In progress:** none.
- **Open (hand over): proof 3, the reload-for-real and the open-tab refusal.** Resume steps:
  1. Make a base worktree again only if a fresh old game is wanted (proof 3 is branch-only, so it is not
     needed). Start the branch keyless server on :3280 from `p-harden-7` by hand (the standard env:
     `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true RBENV_VERSION=2.7.8 bundle exec rails server -b
     127.0.0.1 -p 3280`), confirming the keyless boot warning.
  2. The reload: open a branch m01 game at 0 (e.g. a fresh head-started game, or reuse 2398) in a held
     Playwright page (the `ready()` helper in the scratchpad `lib.mjs`, `setFPS(20)`, fixed steps on).
     Stop :3280 and restart it with `BREAK_ESCAPE_FORMAT_TEST_STEP=1` exported (the initializer appends a
     no-op step at version 900, so `FormatUpgrade.current` reads 900 and the stored game is upgraded to
     900 on its next load). Keep the tab open; walk into a new room (a `GET /room/:id`) and watch the
     page reload exactly once; on a second run, let the first request after the restart be a sync and
     watch it reload on that. Record the triggering request from the network log. After the reload the
     stored game reads `formatVersion: 900`, no second reload happens (the `be-format-reload` session
     key), and a further action saves.
  3. The refusal: a `swap-scenario-game.rb ... --format-version 900` game on :3280 without the switch
     shows the full HTML refusal page on `show` (already curl-proven as game 2394 last session; redo
     in-browser). The `#loading` path is only a fallback for a show that answers 200 while `/scenario`
     answers 409, which a too-new game never reaches, since show refuses first. Then a tab holding 900
     (after a switch-on reload) kept open while :3280 restarts without the switch: its next room fetch
     and next sync each get the 409 `format` body and the tab reloads once; the reloaded page is itself
     the show route's full HTML refusal page (the stored game is still too new), not a `#loading`
     message. player_state unchanged (read before and after).
  4. Clean-up: every game stamped 900 (by the switch or by `--format-version 900`) is set back to
     `formatVersion: 0` with a one-off `bin/rails runner` naming the ids, and each id recorded here as
     unusable for later proofs. Stop the branch server by PID.
- **Gotchas / notes for the resumer:**
  1. The drivers and helpers are in the scratchpad at `p-harden-7-proofs/` (`lib.mjs`, `playdriver.mjs`
     and the `probe_*.mjs`). `lib.mjs` has `ready`, `clearConversations` (waits for the Agent HaX intro
     cutscene to fully close, it reopens between segments), `openPinObject`, `openPinDoor`, the
     `bootstrapFormat`/`reloadKeys` format readers, and the hold-across-restart pattern is the sync-F
     driver (`p-sync-f/f_drive.mjs`) which starts and stops the server as a node child.
  2. m01's first real door is a lockpicking dexterity minigame the bridge cannot play, so head-start into
     `main_office_area` to reach the PIN locks. The PIN keypad is driven by `clickText('2')...('8')` then
     `clickText('ENTER')`; it is slightly racy, so `openPinDoor` retries and confirms with `enterRoom`.
  3. The base worktree for proofs 1/2 was removed with `git worktree remove` at the end of this session
     and the copied secret went with it; the branch server was stopped. A resumer starts fresh.
  4. No full suites were run (congestion rule); no Rails controller or model changed this session.

## Step 7 proof 3 (phase 4, this session): the reload-for-real and the open-tab refusal

Date: 2026-11-13. The two browser-driven proofs the phase-3 handover left open: the reload for
real under the development switch, and the refusal with a tab held open on a 900-stamped game. One
branch keyless server on **:3280** only (no base worktree: proof 3 is branch-only). The server was
restarted three times as a detached child (its own process group, stopped with `SIGTERM` to the
group), with the held Playwright tabs kept open across every restart: current **0** (switch off),
current **900** (`BREAK_ESCAPE_FORMAT_TEST_STEP=1`), current **0** again. `setFPS(20)`, fixed steps
on. No `db:` task was run. Driver `p-harden-7-proofs/proof3_drive.mjs` with reader `p3_read.rb`
(both in the session scratchpad; nothing added to the repo). Engine code unchanged; no bug found.

The switch raised current as designed: `FormatUpgrade.current` read 900 under the switch (runner),
and the server-current probe (a `GET` of the swap-900 game's `scenario`, which mutates nothing)
returned `409` header `0` at current 0 and `200` header `900` under the switch.

**Games (all on the development DB, all reset to `formatVersion: 0` and recorded unusable below):**
2410 (run A, reload on a room fetch, then the open-tab refusal), 2411 (run B, reload on a sync),
2418 (the banner), 2412 (swap `--format-version 900`, the direct show refusal). 2410, 2411 and 2418
are head-started m01 games (`new-game.rb --start-room main_office_area`), stamped `formatVersion` 0
at creation; 2412 is a `test_access_networks` swap stamped 900.

- **3a, reloads exactly once on a room fetch, and flushes the pending change (game 2410).** Tab
  opened at current 0 (stored fv 0), its 30 s auto-sync timer stopped, and a pending global
  `proof3_pendingA` set but left unsynced. Server restarted with the switch (current 900). The tab's
  first engine request, `GET /room/main_office_area` (response header 900), tripped the guard: it
  flushed the pending sync and reloaded once (one extra page load; session key
  `be-format-reload:2410:0:900`). After the reload the stored game read **fv 900** and held
  `proof3_pendingA` (the flush landed before the reload) plus `proof3_afterReloadA` from a further
  `syncConfirmed` that returned true with no new reload key. One reload; saving carries on.
- **3b, reloads exactly once on a sync (game 2411).** Same setup; the first post-restart request was
  a forced `syncConfirmed` (`PUT /sync_state`, header 900). The guard reloaded once (key
  `be-format-reload:2411:0:900`); the sync's own global `proof3_pendingB` persisted and the stored
  game rose to fv 900.
- **3c, a second mismatch shows the pixel-art banner and saving carries on (game 2418).** The session
  key `be-format-reload:2418:0:900` was primed to stand for a pair that had already reloaded once (the
  exact state a first reload leaves). With the switch on, a `GET /room/main_office_area` (header 900)
  then showed the banner instead of reloading: `border-bottom: 2px solid rgb(255, 204, 0)`, font
  `"Press Start 2P", GNF, VT323, monospace`, text "This game has been updated. Reload the page to keep
  playing with the latest version.", and no extra page load. A following `syncConfirmed` returned true
  and `proof3_banSave` persisted (fv 900): saving carries on after the banner.
- **3d, the direct show refusal (game 2412).** On the current-0 server, `GET /break_escape/games/2412`
  (show) returned **409** with the HTML refusal page carrying "...newer version of Break Escape
  (format 900; this server reads up to 0)" and header `X-Break-Escape-Format: 0`. The show route
  refuses outright with the full refusal page, so the Phaser bootstrap XHR never runs; the
  `showBootstrapRefusal` `#loading` path is the fallback for a show that answers 200 while `/scenario`
  answers 409, which a too-new game never reaches (show refuses first). That `#loading` path stays
  covered by `test/js/format-guard.test.mjs`. This is correct behaviour, not a gap: the user sees a
  full-page readable refusal rather than a `#loading` line.
- **3e, the open-tab refusal across a switch-off restart (game 2410).** After 3a the tab held 900
  (stored fv 900). The server dropped back to current 0. The held tab's next request, `GET
  /room/it_room`, returned **409** `{ error: "format", message: "This game was saved by a newer
  version of Break Escape (format 900; this server reads up to 0)", current: 0 }` (the 409 path,
  readable message). The guard reloaded once more (new key `be-format-reload:2410:900:0` beside the
  earlier `0:900`), and the reloaded page is the show route's full HTML refusal (the stored game is
  still too new). **player_state unchanged across the refusal:** before and after, game 2410 read fv
  900, the same two marks and the same `updated_at` (`00:54:21Z`); nothing was written. The concurrent
  sync attempt was cut off by the reload navigation (expected) and wrote nothing.

The version transitions are evidenced by the sessionStorage reload keys (each encodes the held version
and the server's `n`) and the stored `formatVersion`, not by the page's `scenario.formatVersion`, which
the guard keeps in a module-private `held` and does not expose on `window`.

**Clean-up:** every 900-stamped game was set back to `formatVersion: 0` with a one-off `bin/rails
runner` (`update_column`, no callbacks): **2410, 2411, 2418, 2412** all `900 -> 0`. All four are
recorded **unusable for later proofs** (their player_state carries the proof's marker globals and, for
2412, a swapped scenario with no Mission). The branch server was stopped (final stop confirmed, :3280
down). No other game was touched.

**Step 7 is complete:** phase 1 (server + validator), phase 2 (client + tools + the deferred Rails
tests + the curl refusal proof), phase 3 (live proofs 1, 2, 4), and phase 4 (proof 3, above). Open for
the orchestrator: the full Rails and `MERGE_BATCH=1 bin/test-js -j 3` suites and the validator sweep at
the merge batch (the congestion rule kept this builder to targeted files), the six skill-wording
proposals in phase 2, and the README/validator wording.

**R1 fixes (build/harden-7, 2026-11-13).** The four review nits from
`SCENARIO_FORMAT_HARDENING_STEP7_REVIEW_R1.md`: n1 dropped the dead `bannerShown` state in
`format-guard.js`; n2 rewrote `sync_format_refusal` to read the stored `formatVersion` with
`jsonb_typeof` plus `->>` so it rebuilds the value exactly as `set_game` sees it on any adapter (a
stored JSON string scalar such as `"1"` is now Unreadable on both paths), with a new sync string-scalar
test in `format_version_test.rb`; n3 corrected the `swap-scenario-game.rb` stamping comment (the first
`save!` is a create that stamps current; the override survives via the second `save!`); n4 widened the
request-site lint to bracket access, destructuring and argument-passing fetch captures, banned
`EventSource`/`WebSocket`/`sendBeacon`, and reworded the test names and this log as a lint, not a proof.
Also corrected the phase-3 handover's open-tab wording: the reloaded page is itself the show route's
full HTML refusal page, not a `#loading` message. Node lints green (5 + 9); the Rails format tests run
below.

**Merge batch 17 fixes (build/harden-7, 2026-11-13, after merging main de63f5900).** Three meeting
tests outside this builder's own runs failed against step 7. Resolution: make the format subsystem
inert at current 0 (production during step 7), the principled dual of not stamping an inert 0.
(1, 2) `before_create :stamp_format_version` now writes nothing while current is 0, so a game created
with hand-set `scenario_data` is left byte for byte (fixes `access_model_loader_test` and
`npc_habits_loader_test`; `version_of` already reads a missing key as 0). (3) `sync_format_refusal`
returns at once when current is 0, reading no `scenario_data`, so a plain sync stays off the column
(the sync-deltas rule pinned by `capture_proofs_test`'s query counter and `reload_persistence_test`);
a hand-crafted too-new or unreadable game is already refused at load by `set_game`, so its client never
reaches a sync. Once a format step lands (current > 0) the sync check runs its one jsonb-scalar pluck
and refuses as before. Updated this builder's own step-7 tests to match: creation-stamping and the two
sync-refusal cases now run under the fixture step list (current 1), plus a new inert-at-0 sync test and
a current-0 creation test; `reload_persistence_test`'s save-query count drops from 2 to 1 at current 0.
NOTE for the orchestrator: once real format steps exist, the sync gate will again add one cheap
jsonb-scalar pluck per sync (one scalar, never the materialised blob); there is no dedicated column and
a migration was out of scope, so flag if a format-version column is wanted before step 8 lands a step.

- **Done:** (1) schema resolver and notes helper + unit tests (732f41433); (2) **phase A** (afe5b6ca3): schema marks, eager enumerator, schema-walk test; (3) **phase A continued:** validator migration, `_`-skip audit, action-in-a-note warning, README line; (4) **phase B1:** every granting/deriving walker skips notes and visits free data, `CaptureModel.each_capture_writer`'s `notes:` keyword, schema-walk parts 3 and 6, the corpus before/after proof (identical), and the implant/plant Rails route tests with a revert proof (see "Phase B1"); (5) **phase B2, this session:** `strip_notes!` at every client payload builder, the route audit, the boot initializer, the Rails note/capture/boot tests (each with a revert proof), the part-6 ruling recorded, README item 8, and the live proof on port 3270. See "Phase B2" above. **Step 2b is complete.**
- **In progress:** none.
- **Open:** none for step 2b. The orchestrator still runs the full Rails and `MERGE_BATCH=1 bin/test-js -j 3` suites and the validator over every touched scenario at the merge batch (the congestion rule kept this builder to targeted files).
- **Part-6 `KNOWN_SET_GLOBAL_UNDER_NIL` ruling (resolved):** the five `type: set_global`-under-nil locations stay pinned as the known list; they get schema marks at the core-kind closure (plan section 7.2, one line added), where the list is reset to empty. No further action in step 2b.
- **Files touched (phase B2):** `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/game.rb`, `lib/break_escape/engine.rb`, `README_scenario_design.md`, `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` (section 7.2 line), `test/controllers/break_escape/notes_never_ship_test.rb`, `test/controllers/break_escape/capture_notes_not_live_test.rb`, `test/unit/scenario_schema_boot_test.rb`, `scenarios/test_author_notes/` (mission.json, scenario.json), this log.
- **Commits (phase B2):** 17e9c9326 (strips + boot initializer), 48afbfd47 (Rails note/capture/boot tests), the README commit, and the commit holding this log, the scenario and the plan line. Phase B1: e61ef12f4, a722680b1, and its log commit. Phase A: 732f41433, afe5b6ca3, 0d445efd0, e40c3b5f6.
- **Gotchas:** (1) The walkers all start at `ScenarioSchema.root` or at the two eventMapping pointers already in STARTS; a new `at` pointer must be added to STARTS (the schema-walk test asserts every literal `ScenarioSchema.at('#/...')` is listed; `OwnerClaim.mappings` uses a variable pointer, so its two literals are not caught by that grep but are in STARTS). (2) The PostToolUse formatter reindents Ruby after an Edit (it mangled the `if/else` in `OwnerClaim.mappings`, now a single-line ternary; it still reindents `scripts/validate_npc_habits.rb` and `lib/break_escape/npc_habits/clues.rb`). Check every Ruby diff. (3) All resolution uses the **repository schema** (`ScenarioSchema.root`) even under `--schema`. (4) Part 6 needs the validator renderer (json-schema gem on the load path). (5) The part-6 `type: set_global`-under-nil known list is a deviation awaiting a ruling. (6) Full Rails/JS suites not run (congestion rule); targeted files only.

Step 1 is done; nothing in progress. Commits on `build/harden-step1`: 22e29b9db (validator, list, decisions, fixtures), 42795f922 (tests), and the commit holding this log and the README edits.

Step 2 is done; nothing in progress. Commits on `build/harden-step2`: 3f80b61cb (schema, validator, tests), 2a49c4341 (this log and the README note), and for review round 1: 35c7c20fa (fixes), df825084c (tests) and the commit holding the R1 section of this log. Review round 2: 47f808d16 (fixes) and the commit holding the R2 section of this log.

R2 n3 (a value slip in habits, screenHabit or printHabit prints the schema line and the hand check's line) predates step 2 and belongs to a later step.

## Step 8a. One outage field: offWhen (format 1)

Date: 2026-11-13. Branch `build/harden-8a`, made from main `8b6cf6a0d` (step 7 merged, inert at
current 0). This step renames the two outage fields into one, `offWhen`, and makes `FormatUpgrade`
current 1 with the first real upgrade step. The step 7 review R2 carry-overs (m1, n1, n2, and the
8a Sync line) are done here.

### What changed

- **`scripts/scenario-schema.json`.** `networks.*.downIf` and `resources.*.downIf` become `offWhen`
  in the requireGlobal form (`oneOf` string | `{"x-id-map": true, "type": "object"}`); `offWhen` is
  removed from `#/definitions/affordance` and declared as an object-level item property (same
  requireGlobal form). The bare-name form keeps the old meaning; the `{ name: value }` form is now
  possible on networks, resources and objects.
- **`lib/break_escape/format_upgrade.rb`.** `STEPS = [STEP_8A]` (version 1,
  `one_outage_field_offWhen`). `current` is now 1. The `scenario` transform walks live data from the
  root (`AuthorNotes.each_live`, `free: :skip`) and, for every live Hash, renames a bare `downIf` to
  `offWhen` and moves an `affordance.offWhen` up to the object (`rename_one_hash_outage_fields!`); an
  emptied affordance stays `{}`. The `player_state` transform applies the same move to each item copy
  (inventory, `room_states.*.objects_added`, `droppedItems`/`copiedItems`/`serverClones`) from the
  item Node. Both are idempotent, skip notes and free data, and leave format-1 data unchanged.
  `retired`: `networks.*.downIf`, `resources.*.downIf`, `affordance.offWhen` at any depth.
- **Readers moved to the new names.** Ruby: `app/models/break_escape/network_access.rb`
  (`host_service_off?` reads object-level `offWhen` via `AccessWork.object_off_when`; `network_up?`
  and `resource_down?` read `offWhen` and evaluate it through the shared `AccessWork.globals_hold?`;
  `reach_cache_key` keys on `network_up?`), `lib/break_escape/access_work.rb` (new
  `off_when_present?` and `object_off_when` helpers; `cause_holds?`, `cause_why_reachable?`, `plan`,
  `off_when?`, `can_fail?` read `offWhen`), `lib/break_escape/network_model.rb` (route `down_of`
  reads `offWhen`; the `{ name: value }` form cannot be a route name, so a network carrying it is
  treated as up through a link route, its own `network_up?` still gating direct access), `game.rb`
  (work-plan comment). JS: `npc-work.js` (the work plan carries `offWhen` values, checked with a
  local `offWhenHolds`/`offWhenNames` since this module stays import-free), `npc-needs.js`,
  `npc-reports.js`, `unlock-system.js`, `container/container-minigame.js` (object-level `offWhen`).
- **Validators and dungeon graph.** `validate_network.rb` (new `offwhen_names`/`offwhen_holds_on?`
  helpers; the network outage check, the start-down open-share warning and the outage info lines read
  `offWhen`), `validate_access_work.rb` (new `offwhen_global_names`; the resource outage,
  leak-scanner, work-fail and starts-down reads), `validate_npc_needs.rb` (`check_off_when` reads
  object-level `offWhen`), `generate_dungeon_graph.rb` (network label and the NPC outage list),
  `validate_scenario.rb` `known_item_fields` gains `offWhen`.
- **Scenarios rewritten (4, none with ERB).** test_access_networks (network `downIf` -> `offWhen`;
  bench_pc's `affordance.offWhen` moved up, its affordance emptied to `{}`), test_access_social (5
  resource `downIf`, 2 object `affordance.offWhen`), test_access_work (7, 1), test_needs_sims (0
  resource; 3 object `affordance.offWhen`: coffee, office copier, kitchen copier). All validate with
  0 errors (`--no-graph`): networks 7 warn, social 6, work 8, needs_sims 32 (pre-existing counts).

### Carry-overs from the step 7 R2 review (done here)

- m1: `capture_proofs_test.rb` `count_scenario_loads` now counts only the quoted `"scenario_data"`
  full-column load, not the `sync_format_refusal` jsonb-scalar pluck that runs on every sync once
  current is non-zero (reason in the test, as `reload_persistence_test.rb:841` draws it).
- n1: the stale stamping comment in `tools/playtest/swap-scenario-game.rb` reworded.
- n2: the plan wording at the fields table and the "Stamped at creation" bullet reworded (nothing
  stamped while current is 0; first stamped by the step that raises current).
- The step 8a Sync line in the plan states player_state renames in place, once per game, on the
  server, and that sync neither upgrades nor refuses a below-current game.

### Tests

- `test/unit/format_upgrade_test.rb`: two existing "no steps" tests now stub `steps` to `[]`
  (current is a real 1); the dev-switch ensure asserts current returns to 1; two new tests cover the
  8a transform (rename, emptied affordance, note left as written, player_state item copies,
  idempotence) and the `{ name: value }` resource form. 14 runs, 59 assertions, 0 failures.
- Verified by hand: the validator prints the rename error on a reintroduced network `downIf`
  (format 1).

### NOT DONE (handover)

Stopped at the context budget after the core implementation, the carry-overs and the
format_upgrade unit tests. Remaining, in plan order:

1. **Test migration** of every existing outage test to the new names. The fixtures and inline
   scenarios still use `downIf`/`affordance.offWhen` in: `test/support/access_work_scenario.rb`,
   `test/support/network_model_scenario.rb`, `test/js/fixtures/needs-work-world.mjs`, and the Rails
   and node tests the plan names (`network_outages_test.rb`, `network_host_service_off_test.rb`,
   `npc_frustration_test.rb`, `access_work_test.rb`, `network_model_test.rb`,
   `access_work_plan_test.rb`, `access_work_social_test.rb`, `npc_workaround_test.rb`,
   `feed_post_test.rb`, `npc_lockout_l_test.rb`, `social_lockout_q33_test.rb`,
   `owner_claim_enforce_test.rb`, `network_implants_test.rb`, and the node tests
   `npc-coffee-off`, `npc-printer-power`, `npc-needs-work`, `npc-work`, `npc-reports`,
   `dungeon-graph-networks`, `dungeon-graph-workarounds`, `validator-network-model`,
   `validator-access-work`, `validator-access-reactive`, `validator-strict-keys`,
   `validator-access-reply`, `npc-needs-social-media`, `container-shares`, `access-signin-routing`).
   Grep for `downIf` and `affordance.offWhen`/`affordance?.offWhen` in `test/` for the full list.
2. **New unit/validator tests the plan lists:** the step on raw and prepared data at the model
   level; the validator "one rename error per key" tests (see item 4 below about the double line);
   add 8a cases to `validator-retired-keys.test.mjs`.
3. **The step 2 formatter / retired-key dedup.** A reintroduced retired key in a closed block now
   prints BOTH the schema `unknown key` line and the rename line (two errors for one slip). The plan
   wants one line (step 7: step 2's unknown-key formatter reads `retired` and prints the rename line
   instead). Wire `scripts/validate_scenario.rb`'s unknown-key formatter to suppress a key that
   `FormatUpgrade.retired_entries` lists, so one slip prints one rename line. (Rewritten scenarios
   have no retired keys, so this is cosmetic double-counting, not a false pass.)
4. **Corpus equivalence and reader parity** runs (plan step 8): render each of the 4 scenarios from
   the merge base and from the branch with `srand(1)`, confirm the transform applied to the old
   render equals the new render and that `prepare_scenario_data!` agrees; load the old readers from
   the merge base and compare derived outage conditions and the needs target lists (bench_pc is the
   one emptied affordance). The JS reader parity (old module text via `git show <base>:<path>`).
5. **Full suites** under the shared lock: `bin/rails test` (RBENV_VERSION=2.7.8) and `bin/test-js
   -j 3`. Not run; expect failures until the item-1 fixtures are migrated.
6. **docs/test-bridge.md:406** still says the work plan's `needs[].downIf`; update to `offWhen`.
7. **Live proof** (plan step 8a): two keyless servers (branch 3080, old-game base 3081 at
   `git merge-base main build/harden-8a`), setFPS(20) with fixed steps on. Show test_access_networks
   outage on/off and a host leaving/returning; test_access_work printer outage and a work failure
   with cause `down`; a stored old game (made on the base, played through the printer outage, loaded
   on the branch) upgrading to format 1 with the old keys gone and the beat behaving; an old tab's
   sync refused with 409 and the header; `verify-run.rb` progress. Stop both servers.
8. **Remaining stale comments:** a few pure-comment `downIf` mentions in network_access.rb
   (728, 942, 1113, 1171) and a PLAYTEST.md; `outage_global` in network_access.rb is now unused but
   kept (load-bearing-oddity caution).

No blockers found. The transform, schema, readers, scenarios and validators are consistent; the
remaining work is test migration and proof.

### Continuation (2026-11-13, second builder)

Done since the handover above:

- **Test migration (item 1): complete.** Every `downIf` and `affordance.offWhen` in the Rails and
  node tests and in the shared fixtures moved to the single object/network/resource `offWhen`:
  `test/support/access_work_scenario.rb`, `test/support/network_model_scenario.rb`,
  `test/js/fixtures/needs-work-world.mjs`, the nine Rails behaviour tests, and the node tests
  (needs/work/reports/coffee/printer/social-media/container/signin/dungeon). The four
  validator-message node tests (`validator-access-work`, `validator-network-model`,
  `validator-access-reactive`, `validator-access-reply`) and `validator-strict-keys` were migrated
  and their expected strings reconciled against the validator's new wording (the undeclared-global
  line is now `offWhen names 'x', which is not declared`; the station-off report quotes the
  condition with `.inspect`; a non-requireGlobal `offWhen` errors `must be a global name or
  { name: value }`). One real find: `validator-access-work.test.mjs` m2 relied on overwriting an
  object's `affordance` to also drop its outage; with `offWhen` at object level the test now
  deletes `objects[0].offWhen` so dana_pc stays on (48 s, not 24 s). All migrated files pass alone.
- **Orchestrator ruling (item 3): done, no exception.** `NetworkModel.reach_conditions` keeps each
  network's `offWhen` condition whole on the route (bare name stays a String, `{ name: value }` kept
  as a Hash); `AccessWork.cause_holds?` (unreachable) and `npc-work.js` `reachable`, `wakeOnFor`,
  `planGlobals` evaluate a route entry with `globals_hold?`/`offWhenHolds` and read names with
  `offwhen_global_names`/`offWhenNames`. A network down under either form is down on a link route.
  Tests: `network_model_test.rb` (hash form carried on the route) and `npc-work.test.mjs` (reachable,
  planGlobals and wakeOnFor on the `{ name: value }` and mixed route). The access-work validator's
  two route-global collectors read through `offwhen_global_names`.
- **Formatter dedup (item 4): done.** `format_schema_errors` suppresses the schema unknown-key line
  for a key that `FormatUpgrade.retired_keys_in` lists at that pointer (and drops the raw
  additional-properties message when every unknown key there was retired), so one reintroduced
  retired key prints one rename line. Tests in `validator-retired-keys.test.mjs` (dedup plus a
  genuine unknown key still printing); 8a retired cases added there too.
- **Stale comments (item 6): done.** `docs/test-bridge.md` work plan `offWhen?`; the pure-comment
  `downIf` mentions in `network_access.rb` reworded; `outage_global` was genuinely unused
  (grep: no callers in app/lib/scripts/test) and removed, its `game.rb` comment reference updated.

Validator over the four touched scenarios and m01: 0 errors each. format_upgrade_test 14/59 green.

NOT DONE (second handover), in plan order:

1. **Model-level and prepared-data unit tests (item 2 remainder).** `format_upgrade_test.rb` already
   covers the 8a transform on raw data, the emptied affordance, the player_state item copies,
   idempotence and the `{ name: value }` resource form. Still to add if the plan wants them
   explicitly: the transform on *prepared* data through a built (unsaved) `Game`, and a Rails
   `prepare_scenario_data!` agreement check (these overlap item 5's corpus/parity run).
2. **Corpus equivalence and reader parity (item 5).** Not run. Render each of the four scenarios
   from the merge base and the branch with `srand(1)`; the 8a `scenario` transform on the old render
   must equal the new render; `prepare_scenario_data!` must agree; old Ruby and JS readers (loaded
   from `git show <base>:<path>`) must give the same outage conditions and needs target lists
   (bench_pc is the emptied affordance).
3. **Full suites under the lock (item 7).** Not run here (test-lock rule: the orchestrator runs the
   full suites per merge batch). Every touched test file passes run alone. Expect green.
4. **Live proof (item 8).** Not done: two keyless servers (branch 3080, base 3081 from a worktree at
   `git merge-base main build/harden-8a`), setFPS(20) fixed steps on; an old game made on the base,
   loaded on the branch, upgrading to format 1 under the row lock; an outage through `offWhen`; an
   old tab's sync refused with 409 and the header; `verify-run.rb` progress.

### Step 8a live proof (2026-11-13, third builder)

Item 8 above is now done. Two keyless servers sharing the development database, `setFPS(20)` with
fixed steps on, headless. The branch server on **:3080** ran from `p-harden-8a` (tip `4c9b2a552`;
the task was briefed at `23e68344f`, which the parallel corpus/parity commit advanced, tests only,
no change to the upgrader or the readers this proof exercises; `FormatUpgrade.current` is 1). The
base server on **:3081** ran from a hand-made base worktree `.claude/worktrees/p-harden-8a-base` at
`git merge-base main build/harden-8a` = **`8b6cf6a0d`** (step 7 merged, inert at current 0);
`node_modules` symlinked from `p-9-2-h`, `.bundle/config` copied from `p-9-2-h`. No `db:` task was
run anywhere. Drivers and the read-only row reader live in the session scratchpad (`p-8a-proof/`),
nothing added to the repo.

**How the old games were made (deviation from the plan, on the brief's instruction).** The plan's
"Old games for live proofs" rule makes a test scenario's old game with a one-off runner that
prepares the data; the brief for this proof instead directed `tools/playtest/swap-scenario-game.rb`.
Each old game was therefore made on the base with
`swap-scenario-game.rb <scenario> <scenario> --unlock-all` (current 0, so stored `formatVersion` 0,
unprepared raw render), then played on the base server's real page to pick up takeable items so
player_state held real item copies. One consequence is recorded under 3a below: because the base
game is unprepared, the branch's first load re-prepares it (the transform changes `scenario_data`,
so `ensure_current_format!` re-runs `prepare_scenario_data!`), so the upgraded row also gains the
loader's usual fills; the outage-key rename itself is isolated and exact.

Games (all development DB): **2613** `test_access_networks` and **2614** `test_access_work` (old,
base, upgraded on the branch); **2620** `test_access_networks` (new branch game, 3e). None of the
three outage scenarios has a takeable object carrying the outage key, so the item copies picked up
(spare USB stick, keystroke injector, storage USB sticks) carry no outage field; the player_state
transform walks them and correctly leaves them unchanged.

**Before (base, pre-upgrade), read-only runner.**
- 2613: `formatVersion` 0; `scenario_data/networks/server_net/downIf`; one
  `scenario_data/rooms/workshop/objects[2]/affordance/offWhen` (bench_pc); inventory copies
  `kit_stick`, `kit_badusb` (no outage key). Base `GET /scenario`: status 200, header **0**,
  bootstrap `formatVersion` 0.
- 2614: `formatVersion` 0; seven `resources/*/downIf` (crm, rota, stores, printer, intranet,
  printer_w7, finance_share); one `rooms/cable_room/objects[1]/affordance/offWhen`; inventory copies
  `kit_usb`, `kit_badusb`.

**3a. Upgrade on the branch's real load, under the row lock.** Loading each game on :3080 goes
through `set_game` to `Game#ensure_current_format!` (`with_lock { reload; upgrade; save }`). After
the load, read-only runner:
- 2613: `formatVersion` **1**; zero `downIf`, zero `affordance.offWhen`; two `offWhen`, at
  `rooms/workshop/objects[2]/offWhen` (object level) and `networks/server_net/offWhen`. Inventory
  copies `kit_stick`, `kit_badusb` unchanged, none carrying `downIf`/`affordance.offWhen`/`offWhen`.
  Branch `GET /scenario`: status 200, header **1**, bootstrap `formatVersion` 1; one page load, no
  `be-format-reload` key.
- 2614: `formatVersion` **1**; zero `downIf`, zero `affordance.offWhen`; eight `offWhen` (seven
  `resources/*/offWhen`, one `rooms/cable_room/objects[1]/offWhen`). Inventory copies unchanged.
The outage-key rename is exactly the 8a transform; the row's other differences from the base row are
the expected `prepare_scenario_data!` fills of a first-time load of an unprepared game (see the
deviation note), not an 8a change.

**3b. The outage still works after upgrade (object `offWhen`, branch game 2613).** In the workshop,
with `bench_pc_off` true and synced, `interact bench_pc` opens nothing (the PC is off). With
`bench_pc_off` false and synced, `interact bench_pc` opens the sign-in (`password`) minigame (the PC
is back on). The field the client reads is the object-level `offWhen` the step moved up from
`affordance.offWhen`.

**3c. An old tab is refused (409 + header).** A base tab (old code, :3081) was opened on 2613 while
it was still format 0 (bootstrap `formatVersion` 0, header 0; it holds 0). The branch then upgraded
2613 to format 1 (3a). The still-open base tab's next `set_game` request, `GET /room/lobby`,
returned **409** with body
`{"error":"format","message":"This game was saved by a newer version of Break Escape (format 1; this server reads up to 0)","current":0}`;
base responses carry `X-Break-Escape-Format: 0`. The format guard reloaded the tab once (session key
`be-format-reload:2613:0:0`), and the reloaded base `show` route is itself the full-page 409 HTML
refusal ("newer version of Break Escape (format 1; this server reads up to 0)", header
`X-Break-Escape-Format: 0`). Note: on the base (current 0) `sync_state` is inert and does not itself
refuse, so a concurrent base sync returned 200; the refusal surfaces on the `set_game` routes (room
fetch and show), which the guard wraps. This is the intended "a game upgraded by a newer branch
refuses to load on older code".

**3d. `verify-run.rb` on the upgraded games.** 2613: "progress recorded, 7 rooms beyond the first",
inventory Notepad, Spare USB stick, Keystroke injector; exit 0. 2614: "progress recorded, 22 rooms
beyond the first", inventory Notepad and the two storage USB sticks; exit 0.

**3e. A new game on the branch is format 1 and plays.** `swap-scenario-game.rb` of
`test_access_networks` on the branch created **2620** stamped `formatVersion` **1** at creation
(`scenario_data` carries `offWhen`, no `downIf`). Played on :3080: items picked up and synced, and
`verify-run.rb` reports "progress recorded"; the stored row stays `formatVersion` 1 with `offWhen`
intact.

**Servers and clean-up.** Both servers were stopped by their own PIDs (branch puma pid 3843423 on
:3080, base puma pid 3843420 on :3081); both confirmed down. The base worktree
`.claude/worktrees/p-harden-8a-base` is **left in place** (as the task directed), not moved to
`tmp/delete/`. Games 2613, 2614 and 2620 are development-DB games that carry the proof's picked-up
items; they are at format 1 and reusable, recorded here. No other game was touched.

### Step 8a corpus equivalence, reader parity and full suites (2026-11-13, fourth builder)

Items 1 and 2 of the second handover (corpus equivalence, reader parity, the item 2 prepared-data
remainder) are now done as committed tests, and the full suites were run under the shared lock.

**Corpus equivalence and the prepared-data remainder (committed Rails test).**
`test/unit/format_8a_corpus_test.rb` renders each of the four rewritten scenarios from the merge
base (`git merge-base main HEAD` = `8b6cf6a0d`, old field names read with `git show <base>:<path>`)
and from the branch, each with `srand(1)`. For every scenario it shows: the 8a `scenario` transform
applied to the old render equals the new render (parsed JSON, key order ignored); the transform is a
no-op on the new render; `FormatUpgrade.retired_keys_in` finds nothing in the new render; and
`prepare_scenario_data!` agrees across the rename, the transform on the prepared old data (an
unsaved `Game` built with the render) equalling the prepared new data. That prepared-data check is
the item 2 remainder (the 8a transform on prepared data through a built, unsaved `Game`). Moved
keys per scenario (matching the step's own record): test_access_networks 1 network `downIf`, 1
object `affordance.offWhen` (bench_pc, the one emptied affordance); test_access_social 5 resource,
2 object; test_access_work 7 resource, 1 object; test_needs_sims 3 object.

**Reader parity.** The same Rails test loads the old object outage reader from the merge base as
`BreakEscape::AccessWorkOld` (the module text eval'd at the top-level binding, require lines
dropped) and runs it on the old render, the live reader on the new render: the derived object
outage condition of every object matches, and the up/down verdict of every network, resource and
object matches across a sweep of its outage globals (all off, then each name on). A network's and a
resource's old reader is a bare field read (`downIf`), so the old side reads that field directly on
the old render. bench_pc keeps a truthy (`{}`) affordance and gains `offWhen`, so it stays in the
needs target lists. The JS counterpart, `test/js/format-8a-reader-parity.test.mjs`, loads the old
and new `pcSwitchedOff` (the shared object-off evaluator) from `git show` and the working tree and
matches their verdicts over every object in the four scenarios and the global sweep, and checks
that every object keeps its affordance truthiness (needs-target membership unchanged).

**Format-version test migration (previously missed).** Raising `FormatUpgrade.current` from 0 to 1
activates creation stamping and the load and sync format checks that step 7 kept inert, which
turned eleven step-7 tests red (they pinned the current-0 behaviour). Migrated:
`format_version_test.rb` (the three inert-path tests stub an empty step list to hold current 0; the
header and too-new-`current` assertions read `FormatUpgrade.current`); `access_model_loader_test.rb`
and `npc_habits_loader_test.rb` (a created game is now stamped, so the hand-set-data checks compare
`except('formatVersion')`); `reload_persistence_test.rb` (the narrow sync load now also runs the
`formatVersion` jsonb pluck, so two `break_escape_games` SELECTs, still never the full
`scenario_data` blob). These are the stamping consequences the step-7 log's own comments
anticipated.

**Full suites (under `scratchpad/tests.lock`).**
- `RBENV_VERSION=2.7.8 bin/rails test`: 2330 runs, 42087 assertions, 0 failures, 0 errors, 1 skip.
- `MERGE_BATCH=1 bin/test-js -j 3`: 586 files, 586 passed, 0 failed.
- Validator loop (`--no-graph`) over `scenarios/*/scenario.json.erb` and the `.json` scenarios: the
  four touched scenarios validate with 0 errors each. Unrelated pre-existing known failures remain
  in other tracks (crypto, labs, escape-room, biometric), none touched by this branch.

**Commits:** `4c9b2a552` (corpus equivalence and reader-parity tests), `d14afa363` (format-version
test migration), and the commit holding this log.

## Step 8a review R1 fixes (2026-11-13)

Addressing `SCENARIO_FORMAT_HARDENING_STEP8A_REVIEW_R1.md` (0 blockers, 1 major, 1 minor, 4 nits).

**maj1: the corpus and parity tests no longer read through git.** Both tests derived the "old" side
from `git merge-base main HEAD`, so they would go vacuous or fail once 8a lands on main (the merge
base then points at the new code) and error in a gitless checkout. The four old renders are now
vendored as fixtures under `test/fixtures/format_8a/<scenario>.old.json` (captured from the base
`8b6cf6a0d`, each base template rendered with `srand(1)`; the folder's README records how). The old
readers are reproduced inline: in the Rails test `object_off_when_old` reads an object's own
`affordance.offWhen` (no preset merge is needed, because no office preset defines `offWhen`, so the
own-affordance read is the whole answer on this corpus) and `globals_hold_old?` is the pre-8a
evaluator; the networks and resources still read a bare `downIf` on the fixture. In the node test
`pcSwitchedOffOld` is the pre-8a `data.affordance.offWhen` reader, inline, while the live
`pcSwitchedOff` is still pulled from the working-tree module so the parity stays bound to real code.
Every `git show`, `merge-base` and the AccessWorkOld eval are gone. Proof it still bites: breaking
the scenario transform locally (prefixing the renamed value) turns the corpus test red (6 failures),
and reverting restores green.

**min1:** `scenarios/test_access_networks/PLAYTEST.md` now names the fields in their current shape:
the network and resource outage conditions as `offWhen`, and the host one as object-level `offWhen`
rather than `affordance.offWhen`.

**nit1:** the `npc-work.js` `offWhenHolds` docstring now reads "(was `downIf`, a bare name)".

**nit3:** the JS outage helpers (`offWhenHolds` in `npc-work.js` and `container-minigame.js`,
`pcSwitchedOff` in `unlock-system.js`, `_isOff` in `npc-needs.js`) now treat an empty-object
`offWhen` as "no condition" (never off), matching Ruby `AccessWork.off_when_present?`. New test
`test/js/outage-empty-hash-guard.test.mjs` extracts each live helper and checks the empty-object
edge both ways.

**nit4:** the stale `downIf` comments at `generate_dungeon_graph.rb:1069`, `npc-needs.js` (the
early-return note) and `npc-reports.js` now say `offWhen`.

**nit2 (not applied, needs a decision).** The outdented `else`/`elsif`/`end` in
`generate_dungeon_graph.rb`, `validate_access_work.rb` and `validate_npc_needs.rb` are not stray
editor noise: `rubocop-rails-omakase` (the repo's inherited config) flags main's deeper
(keyword-aligned) `else`/`end` on these assignment-position conditionals as `Layout/ElseAlignment`
and `Layout/EndAlignment` offences and autocorrects them to column 4. The mandatory post-edit and
pre-commit rubocop hooks both re-outdent the lines and the pre-commit hook blocks any commit that
still carries the deeper alignment, so main's indentation cannot be restored without an inline
`rubocop:disable` (itself new noise) or a config change. Left as the branch (and rubocop) has it.


## Step 8a corpus-test design fix (2026-11-13)

Batch 21 (main + network-views slice 1 + copier + barkDelay + step 8a) failed two step-8a corpus
tests for `test_access_networks`: the equivalence and the `prepare_scenario_data!` check. Slice 1
legitimately edited that scenario (dropped `linkName` overrides, changed sign text), so the corpus
test's "new" side, which it read by rendering the LIVE template, no longer equalled
`transform(old fixture)`. Any later edit to one of the four test scenarios would break the test the
same way. A test-design flaw, not a transform bug.

**Fix: freeze both sides.** The new render is now vendored beside the old one as
`test/fixtures/format_8a/<scenario>.new.json`, captured from this branch's templates at its tip
(`srand(1)` then ERB via `Mission::ScenarioBinding`, then pretty JSON). On this branch
`transform(old)` already equals that render, so freezing it is safe; a later scenario edit changes
the live render but not the frozen pair. The equivalence and prepare checks, and the Ruby/JS reader
parity, now read the frozen pair.

**Edit-proof live guard.** A separate test in each file renders the four LIVE templates and asserts
no retired outage key has come back (`retired_keys_in` in Ruby; an inline object/network/resource
walk in the node test). It pins no content, so ordinary scenario edits pass, but a returning
`downIf` or `affordance.offWhen` turns it red.

**JS reader parity decision.** The node parity test also read its "new" side from the live template
and matched objects to the frozen old fixture by id, so an object-set change in a scenario would
break it too. Its new side now reads `<scenario>.new.json`. It stays a reader-vs-reader check (old
`pcSwitchedOff` on the old render vs live `pcSwitchedOff` on the new render), never a frozen-expected
blob, and is edit-proof; the live guard above covers returning old names.

**Proof it still bites.** Prefixing the renamed value in `rename_one_hash_outage_fields!` turns the
Ruby corpus test red (6 failures); reverting restores green (21 runs, 298 assertions, 0 failures).
The node parity test passes (1 file). README updated with how both sides are made.

## Step 8b build plan (re-anchored 2026-11-13, anchor 2f5471209)

Step 8b (one owner field, format 2) is re-anchored in the plan against `2f5471209`; see
`SCENARIO_FORMAT_HARDENING_STEP8B_REANCHOR.md` (verdict: mechanical). Split into five chunks, each a
fresh agent under about 150k tokens, built on branch `build/harden-8b` from a main that holds steps 7
and 8a. 8a needed four builders plus a review-fix pass; 8b is the same shape. Each chunk commits its
own files with explicit paths; the integrator runs the full suites once per merge batch.

Standing rules for every chunk: no `db:` task on the shared DB; the validator runs with
`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`; a new static JS import
goes on each test-harness copy list; count every `❌` line as a failure.

### Chunk 1 — schema, transform, validator (first; others build on it)

- **Scope.** `scripts/scenario-schema.json`: add object-level `owner` (string or array of strings),
  `private` (boolean), `deskPhone` (boolean), and item-level `owner`; remove object `screenOwner`,
  `phoneOwner`, `affordance.owners`, `affordance.private` and item `phoneOf`, `leftBehindBy` from the
  closed blocks, all in one commit. Make `leftBehindChance` the left-behind marker (required for a
  left-behind item). `lib/break_escape/format_upgrade.rb`: `STEP_8B` (version 2,
  `one_owner_field`), `current` now 2; the `scenario` transform renames each old field to `owner`,
  moves `affordance.owners`/`affordance.private` up to object `owner`/`private`, writes an explicit
  `owner` wherever the old `needsHome` rule derived one (computed on the data as supplied), marks desk
  phones `deskPhone: true` and left-behind items `leftBehindChance: 0` where absent, and empties an
  affordance it drains to `{}`; the `player_state` transform renames the keys inside item copies
  (inventory, `room_states.*.objects_added`, dropped/copied/cloned lists) in place. Both idempotent,
  skip notes and free data, no-op on format-2 data. `retired`: object `screenOwner`, `phoneOwner`,
  `affordance.owners`, `affordance.private`; item `phoneOf`, `leftBehindBy`. Validator:
  `known_item_fields` (validate_scenario.rb:780-814) loses the four item/object names and gains
  `owner`, `private`, `deskPhone`; the list-owner errors for a workstation / desk phone / Friendface
  phone / left-behind item; the `needsHome`-no-longer-sets-an-owner warning; the two-field conflict
  report (`screenOwner` vs `affordance.owners`, none expected); the formatter suppresses the schema
  unknown-key line for a reintroduced retired key (as 8a's dedup does).
- **Files.** `scripts/scenario-schema.json`, `lib/break_escape/format_upgrade.rb`,
  `scripts/validate_scenario.rb`, `test/unit/format_upgrade_test.rb`,
  `test/js/validator-retired-keys.test.mjs`.
- **Tests.** `format_upgrade_test.rb` (the 8b transform on raw and on prepared data: derived owner for
  a workstation, a private object, a desk phone, a left-behind item, and an object that is an NPC's
  `needsHome` but none of those gets no owner; the player_state transform on a phone in the inventory
  and on a room-added item; idempotence; no-op on format-2); `validator-retired-keys.test.mjs` (each
  retired key one rename line; a list owner on each single-owner kind one error, on a private object
  none; `owner`/`private`/`deskPhone` print no unknown-field warning). Hand-verify the validator
  prints the rename error on a reintroduced `screenOwner`.
- **Done when.** Those two test files pass alone; the four touched scenarios still need the rewrite
  (chunk 4) so they are not validated clean yet; `FormatUpgrade.current` is 2.

### Chunk 2 — Ruby readers

- **Scope.** Move every Ruby owner reader to `owner`/`private`/`deskPhone`, reading only the new
  names: `AccessIdentities.owner_id` (access_identities.rb:230), `OwnerClaim` (owner_claim.rb:244,
  :375-377), `NpcHabits.owned_workstations` (npc_habits.rb:165, through `owner_id`), `AccessWork`
  (hot-desk owner, access_work.rb:1381), `SocialFeed` (`friendface_owner`, social_feed.rb:343, and
  `held_friendface_phone`), `Game` (`login_pc_owner` game.rb:2088, the held-phone check game.rb:1739),
  `GamesController` (found item game.rb/controller:2671, the allowed-field list :2535, and
  `CLIENT_ITEM_FORBIDDEN_FIELDS` :2533-2538 gains `owner`, keeps `phoneOf`). Validator owner-derivers:
  `validate_access_work.rb:397`/`:1226-1230`, `validate_npc_needs.rb` (`owners_of` :1075, :507/:1078,
  desk phone :148-170, left-behind :1437-1474), `validate_npc_habits.rb:403`/`:242`/`:450`,
  `validate_network.rb:189`, `validate_scenario.rb:6960`/`:7011`; `tools/playtest/verify-run.rb`
  :161/:177. The desk-phone marker becomes `deskPhone: true` (not the presence of `phoneOwner`).
- **Files.** The Ruby files above plus their support fixtures (`test/support/*_scenario.rb` that set
  owner fields) and the Rails tests named in the plan (`owner_claim_test.rb`,
  `owner_claim_enforce_test.rb`, `npc_habits_test.rb`, `npc_habits_loader_test.rb`,
  `npc_habits_postit_test.rb`, `friendface_phone_test.rb`, `feed_post_reply_test.rb`,
  `validator-access-*`). Grep `test/` for `screenOwner|phoneOwner|phoneOf|leftBehindBy|affordance.*owners|affordance.*private`
  for the full list.
- **Tests.** Each touched Rails test alone, RBENV_VERSION=2.7.8: `owner_id` reads `owner` only and an
  object with only a `needsHome` NPC has no owner; a client-built item carrying `owner` (and one
  carrying `phoneOf`) is stored without it; a game at format 1 with a Friendface phone in its
  inventory still opens the same feed after load and the NPC still has no phone.
- **Done when.** Every touched Rails/support file passes alone; readers read no retired name (grep of
  app/lib/scripts/tools leaves only comments, the schema, and the retired list).

### Chunk 3 — JS readers, the reveal event, fixtures

- **Scope.** Move every JS owner reader: `workstation-state.js` `ownerOf` (:115), `npc-needs.js`
  (`_owners` :1218, `affordance.private` :1231, desk-phone owner :3989, the shipped-copy builder
  :4633/:4640, left-behind reveal :4594/:5205/:5229), `npc-action-icons.js` (:301),
  `office-room-tone.js` (:115, now reads `deskPhone`), `left-card-consequence.js`,
  `friendface-phone.js` (:34/:123/:141). Rename the `object_revealed:<id>` payload key `leftBehindBy`
  to `owner` (emit npc-needs.js:5229, read left-card-consequence.js:57) in the same commit; grep
  scenarios, ink and `docs/` for a handler of the payload key (none expected).
- **Files.** The JS files above; `test/js/fixtures/` that carry owner fields; the node tests
  (`workstation-state.test.mjs`, `npc-needs.test.mjs`, `npc-left-behind.test.mjs`,
  `npc-desk-phone.test.mjs`, `left-card-consequence.test.mjs`, `friendface-phone.test.mjs`); each
  harness copy list if a new import appears.
- **Tests.** Each touched node test alone (`bin/test-js` runs plain node): `ownerOf` reads `owner`
  only; a desk phone with `owner` and `deskPhone: true` rings for its owner and an object with `owner`
  and no `deskPhone` does not; a left-behind item with `owner` and `leftBehindChance` is a reveal
  slot; the `object_revealed` payload carries `owner`.
- **Done when.** Every touched node file passes alone; no JS reader reads a retired name.

### Chunk 4 — template rewrite, corpus equivalence, reader parity

- **Scope.** `tools/format/rewrite_templates.rb --step 2` rewrites the nine templates
  (lab_physical_pentest [incl. its 1 `affordance.private`], test_access_habits, test_access_sessions,
  test_access_social, test_access_work, test_capture_log, test_clone_left_card, test_needs_sims, and
  test_npc_needs which holds no retired key but gains derived `owner`s). lab_physical_pentest is on the
  labs track: the user's decision covers the edit; the labs track is told before the branch merges.
  Update any `_comment`/ERB note that names a retired key. Freeze both sides as fixtures as 8a learnt
  (`test/fixtures/format_8b/<scenario>.old.json` and `.new.json`, captured with `srand(1)` and
  SecureRandom stubbed), never read through `git merge-base`; add an edit-proof live guard that
  renders the live templates and asserts no retired owner key has returned.
- **Files.** The nine `scenarios/*/scenario.json.erb`; `tools/format/rewrite_templates.rb` (if the
  8b case needs owner-derivation support); `test/fixtures/format_8b/*`;
  `test/unit/format_8b_corpus_test.rb`; `test/js/format-8b-reader-parity.test.mjs`.
- **Tests.** Corpus equivalence: the 8b `scenario` transform on each old render equals the new render
  (parsed JSON, key order ignored); `prepare_scenario_data!` agrees across the rename;
  `retired_keys_in` finds nothing in any new render. Reader parity: the old `owner_id`/`ownerOf`
  reproduced inline (own field read, no office preset defines an owner field — confirm by grep) equal
  the new `owner` for every object; for every private object the NPCs allowed; for every desk phone
  and left-behind item its owner; and the needs target lists for test_needs_sims tom_pc and sanjay_pc
  (the emptied affordances) are unchanged. Record whether the old Ruby and JS rules ever disagree
  (none expected: no object is two NPCs' `needsHome` on the corpus). Prove both tests still bite
  (prefix a renamed value → red).
- **Done when.** The four test scenarios most changed (and the nine in all) validate with 0 errors
  (`--no-graph`); the corpus and parity tests pass and bite; moved keys per scenario are logged with
  counts matching the re-anchor.

### Chunk 5 — live proofs (including the old-game proof)

- **Scope.** Two keyless servers sharing the dev DB, `setFPS(20)` with fixed steps on, headless, on
  the builder's assigned ports (not :3000/:3001/:3002). Branch server on one port; base server on a
  hand-made base worktree at `git merge-base main build/harden-8b`. Prove, per plan step 8b Live
  proof: test_access_sessions owner claim at a PC whose owner used to be derived; test_needs_sims the
  desk phone rings and its owner answers and a left-behind item appears when its owner leaves;
  test_access_social Jake's Friendface phone; lab_physical_pentest the left-card beat; and the
  stored-game proof — a real old game made on the base (section 2 one-off runner, or
  `swap-scenario-game.rb` if the brief directs, recording which), Jake's phone taken on the base
  before the switch, loaded on the branch, upgrading to format 2 on first load (old keys gone from
  `scenario_data` and from the stored item copies, read with `bin/rails runner`), the beat behaving,
  an old tab's sync refused with 409 and the header, `verify-run.rb` showing progress. Keep both dumps
  (before and after the load). Stop both servers by PID.
- **Files.** Drivers and the read-only row reader in the session scratchpad only; nothing added to the
  repo except this log's proof section.
- **Done when.** Each beat passes; the stored game shows format 2 with the renamed keys; the old-tab
  refusal shows 409 + header; both servers confirmed down.

## Step 8b chunk 1 — schema, transform, validator (2026-11-13)

Branch `build/harden-8b` from `0193813e9` (tip; steps 7 and 8a merged, format subsystem live at
current 1). Chunk 1 of the five-chunk split: the schema, the `FormatUpgrade` step and the validator
only. Templates and the Rails/JS owner readers stay on the old names (chunks 2 to 4), so the corpus
is not validated clean yet; the expected failures that follow are cleared by chunk 4's template
rewrite.

### What changed

- **`scripts/scenario-schema.json`.** The closed `affordance` block loses `owners` and `private`.
  The `item` definition (the one object/item node) loses `screenOwner`, `phoneOwner`, `phoneOf` and
  `leftBehindBy`, and gains `owner` (string or non-empty array of strings), `private` (boolean) and
  `deskPhone` (boolean). `leftBehindChance` stays and its description now makes it the left-behind
  marker. Descriptions that taught the old names (`workstation`, the `site` phone, the two
  `phone_friendface` type notes) now name `owner`. No `x-ref` added (step 4 owns that).
- **`lib/break_escape/format_upgrade.rb`.** `STEP_8B` (version 2, name `one_owner_field`); `STEPS`
  is now `[STEP_8A, STEP_8B]` so `current` is 2. The `scenario` transform `one_owner_field!` runs in
  two phases: phase A walks every live Hash (`AuthorNotes.each_live`, `free: :skip`) and renames
  `screenOwner`/`phoneOwner`/`phoneOf`/`leftBehindBy` to `owner`, moves `affordance.owners` and
  `affordance.private` up to `owner`/`private` (an emptied affordance stays `{}`), marks a desk phone
  `deskPhone: true` and writes `leftBehindChance: 0` where absent; phase B writes the explicit owner
  the old `needsHome` rule derived — a String on a workstation (the inlined `isWorkstation` rule),
  a one-element list on a private object — only where no owner is present. The `needsHome` map and
  the room-object walk are inlined (not `AccessIdentities`, which chunk 2 changes) so the upgrade
  stays fixed. The `player_state` transform renames the same keys inside the stored item copies
  (inventory, `room_states.*.objects_added`, dropped/copied/cloned lists) in place, with no
  derivation. `retired`: object `screenOwner`, `phoneOwner`, `affordance.owners`, `affordance.private`;
  item `phoneOf`, `leftBehindBy`. Both transforms idempotent and a no-op on format-2 data.
- **`scripts/validate_scenario.rb`.** `known_item_fields` loses `screenOwner`, `phoneOwner`,
  `phoneOf`, `leftBehindBy` and gains `owner`, `private`, `deskPhone` (`screenLocked`, `rings`, `site`,
  `leftBehindChance` kept). New `check_owner_fields` (registered after `check_retired_keys`): a list
  `owner` on a workstation / desk phone / Friendface phone / left-behind item is one error (a private
  object may list several); a warning where a workstation or private object has no owner of its own
  but an NPC's `needsHome` names it; the pre-rename two-field conflict (`screenOwner` vs
  `affordance.owners`, differing) is an error (none expected). `check_item_fields` now suppresses the
  redundant unknown-field warning for a retired key name, so a reintroduced item-level retired key
  (open block, no schema `additionalProperties` line for 8a's formatter dedup to catch) prints only
  the one rename error from `check_retired_keys`.

### Tests

- `test/unit/format_upgrade_test.rb` (RBENV_VERSION=2.7.8): **17 runs, 85 assertions, 0 failures.**
  Added three 8b tests (every old field to one owner plus needsHome derivation and an emptied
  affordance; idempotent and no-op on format-2; the player_state rename without derivation). Fixed
  the two 8a assertions the current bump moved (`formatVersion`/`ran` now cover both steps; the dev
  switch leaves `current` 2).
- `test/js/validator-retired-keys.test.mjs`: **22 tests, 0 fail.** Added the six retired owner keys
  (each one rename line to `owner` in format 2; `affordance.owners`/`private` as moved-up renames; the
  reintroduced-`affordance.private` schema-line suppression); a list owner on each single-owner kind
  is one error and on a private object none; `owner`/`private`/`deskPhone` print no unknown-field
  warning.
- Hand-verify: the full validator on a scenario with a reintroduced `screenOwner` prints exactly one
  line — the format-2 rename error, no duplicate unknown-field warning.
- Importers of the changed module (current 1 to 2): `format_version_test.rb` + `format_deployed_scenarios_test.rb`
  (27 runs, 0 fail — they stub `steps`); `access_model_loader_test.rb`, `npc_habits_loader_test.rb`,
  `upgrade_games_tool_test.rb`, `capture_proofs_test.rb`, `reload_persistence_test.rb` (125 runs, 0
  fail); the access validator node tests `validator-access-work/social/model` (99 tests, 0 fail).

### Expected failures left for later chunks

- `test/unit/format_8a_corpus_test.rb`: **9 failures.** It asserts the live templates carry no retired
  key; the un-rewritten corpus still holds the 8b owner keys (test_access_work screenOwner +
  affordance.private; test_access_social 11 phoneOf; test_needs_sims affordance.private x3 +
  leftBehindBy + phoneOwner). Cleared by **chunk 4** (template rewrite). The paths and counts match
  the re-anchor's per-scenario lists.
- The nine corpus scenarios do not validate clean (retired-key errors plus the needsHome-no-owner
  warnings) until **chunk 4** rewrites them.

### Sync size

No growth. The `player_state` transform renames item copies in place once per game at load; a copy
keeps its size (owner replaces the old key) or gains at most one bounded key (`deskPhone` bool or
`leftBehindChance: 0`). Sync reads and writes no owner field, so nothing is re-sent because of 8b.

### Files touched

`scripts/scenario-schema.json`, `lib/break_escape/format_upgrade.rb`, `scripts/validate_scenario.rb`,
`test/unit/format_upgrade_test.rb`, `test/js/validator-retired-keys.test.mjs`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

### Handover

- **Done:** chunk 1 as specified. `FormatUpgrade.current` is 2; the two named test files pass alone.
- **For chunk 2 (Ruby readers):** `AccessIdentities.owner_id`, `OwnerClaim`, `NpcHabits`, `AccessWork`,
  `SocialFeed`, `Game`, `GamesController` (and `CLIENT_ITEM_FORBIDDEN_FIELDS` gains `owner`), plus the
  validator owner-derivers at `validate_scenario.rb:6960`/`:7011` and the `validate_access_*`/`npc_*`
  scripts, all still read the old names. `check_owner_fields`' new `owner`-reading checks and the
  derived-owner transform already read the new names.
- **For chunk 4:** rewrite the nine templates and freeze the format_8b fixtures; the 9
  `format_8a_corpus_test` failures and the corpus validation errors clear then.
- **Note for chunks 4/5:** verify the real 8b transform is a no-op on the four deployed scenarios
  (m01, sis01, sis02, lab_social_engineering) — the plan asserts it, but chunk 1 did not render them
  (the deployed-scenarios Rails test stubs `steps`, so it did not exercise the real transform).

## Step 8b chunk 3 — JS readers, the reveal event, fixtures (2026-11-13)

Branch `build/harden-8b` (chunk 1 at tip `1aeb51d76`). Chunk 3 of the five-chunk split: the engine
JS owner readers, the `object_revealed` payload key, and the node fixtures and tests that carry owner
fields. Every reader now reads `owner`/`private`/`deskPhone` only, never deriving an owner from
`needsHome`; single-owner readers take a String only. No new static import, so no harness copy list
changed.

### What changed (engine JS)

- **`workstation-state.js`.** `ownerOf(data)` returns `data.owner` when it is a non-empty String, else
  null (a list is not a single owner); the `npcs` argument and the `needsHome` fallback are gone. Its
  call sites in this file, `lighting.js`, `screen-states.js` and `test-bridge/access.js` drop the
  now-unused second argument; `_stationsOf`'s dead `npcs` local is removed. Doc comment updated.
- **`npc-needs.js`.** `_owners(o)` reads `o.owner` (a String, or a list on a private object), no
  affordance/screenOwner/needsHome fallbacks; `_permitted` reads top-level `o.private`. `onPhoneRing`
  rings only when `o.deskPhone === true` and reads `o.owner` (String). The live-world `describe`
  builder ships top-level `owner`, `private` and (for a desk phone) `deskPhone` + `rings` in place of
  `screenOwner`/`phoneOwner`, so the needs world's `getObject`/`listObjects` carry the new fields.
  `isSlot` treats `leftBehindChance !== undefined` as the left-behind marker; `leftBehindItems`
  filters by `sd.owner`; the `object_revealed:<id>` reveal emit carries `owner: npcId` (was
  `leftBehindBy`). Comments updated.
- **`npc-action-icons.js`** (`d.deskPhone === true` for the phone icon), **`office-room-tone.js`**
  (`sd.deskPhone === true` marks a desk phone), **`friendface-phone.js`** (`phoneKey`,
  `syncOwners`, `openFriendfacePhone` read `data.owner`; comments updated),
  **`left-card-consequence.js`** (payload comment only; it already reads `data.objectId`, not the
  owner key).
- **The reveal event.** `object_revealed:<id>`'s payload key `leftBehindBy` becomes `owner` (emit
  `npc-needs.js`, read `left-card-consequence.js` via `objectId`). Grep of `scenarios/`, ink and
  `docs/` found no condition or handler reading the payload key (only item-field declarations, which
  chunk 4 rewrites); `docs/test-bridge.md` already names the bridge output `owner`, so it is
  unchanged.

### Fixtures and tests

Node fixtures and the chunk's tests moved to the new names. `test/js/fixtures/needs-sims-world.mjs`:
the three private PCs carry top-level `owner`/`private`; the left-behind helper uses `owner` and emits
`owner`. `workstation-state.test.mjs` gets an `assignOwners(objects, npcs)` shim (and explicit
`owner` on the late-pushed and inline-literal stations) that writes the owner the format-2 upgrade
derives, so the readers see an explicit `owner`; the `ownerOf` unit test now asserts no derivation and
that a list gives null. `npc-needs.test.mjs` private-object tests use top-level `owner` (single or
list) and `private`; `npc-desk-phone.test.mjs` uses `owner`+`deskPhone`; `npc-left-behind.test.mjs`
uses `owner`+`leftBehindChance` (and its validator sub-test matches chunk 2's new left-behind
messages). `lighting-workstation-indicators.test.mjs`, `npc-needs-work.test.mjs`, `room-tone`,
`friendface-phone`, `social-feed-replies`, `left-card-consequence`, `npc-action-icons`,
`office-presets`, `lab-ux-ui`, `npc-lockout`, `screen-states`, `test-bridge-access` and
`npc-office-visuals` moved to explicit owners.

### Tests

- Run alone (RBENV_VERSION=2.7.8, plain `node`): `workstation-state` (53), `npc-needs` (64),
  `npc-desk-phone` (25), `npc-left-behind` (14 pass + 1 expected fail, below), `left-card-consequence`
  (5), `friendface-phone` (11); all pass.
- Every `test/js` file importing a changed module (`workstation-state.js`, `npc-needs.js`,
  `npc-action-icons.js`, `office-room-tone.js`, `left-card-consequence.js`, `friendface-phone.js`,
  plus `lighting.js`/`screen-states.js`/`test-bridge/access.js` touched by the `ownerOf` signature):
  53 files via `bin/test-js`, **51 pass, 2 fail** (both expected, below). Fixed along the way:
  `lighting-workstation-indicators`, `npc-lockout`, `screen-states`, `test-bridge-access`,
  `npc-office-visuals`, `office-presets`, `room-tone`, `npc-needs`, `npc-needs-work`,
  `social-feed-replies`, `social-feed-reactions`, `npc-action-icons`.

### Expected failures left (cleared by chunk 4)

- `npc-left-behind.test.mjs` test "validator: test_needs_sims has no errors and lists Tom's badge"
  and `npc-needs-slots.test.mjs` test "validator: test_needs_sims has no errors and lists its copier
  pool": both run the full validator on `scenarios/test_needs_sims/scenario.json.erb`, which still
  carries the retired owner keys until **chunk 4** rewrites it. No other failure.

### Sync size

No growth. The JS readers read owner fields off the already-synced scenario/world data and the
`player_state` item copies; the `describe` builder swaps `screenOwner`/`phoneOwner` for `owner` plus
at most a bool `private`/`deskPhone` on an in-memory world copy that is never synced. Nothing a sync
sends changes.

### Files touched

`public/break_escape/js/systems/workstation-state.js`, `.../npc-needs.js`, `.../npc-action-icons.js`,
`.../office-room-tone.js`, `.../friendface-phone.js`, `.../left-card-consequence.js`,
`.../lighting.js`, `.../screen-states.js`, `.../test-bridge/access.js`;
`test/js/fixtures/needs-sims-world.mjs`; `test/js/{workstation-state,npc-needs,npc-needs-work,npc-desk-phone,npc-left-behind,left-card-consequence,friendface-phone,social-feed-replies,social-feed-reactions,room-tone,lighting-workstation-indicators,npc-action-icons,office-presets,lab-ux-ui,npc-lockout,screen-states,test-bridge-access,npc-office-visuals}.test.mjs`;
this build log.

### Handover

- **Done:** chunk 3 as specified. No JS reader reads a retired owner name; the `object_revealed`
  payload carries `owner`; all touched node files pass alone bar the two chunk-4-gated validator
  sub-tests.
- **For chunk 4:** rewriting `test_needs_sims` (and the other eight templates) clears the two expected
  failures above. The chunk-3 fixtures were hand-moved to the new names; they do not depend on the
  template rewrite.
- **For chunk 5 (live proofs):** the desk phone rings only with `deskPhone: true`; the left-behind
  slot shows for `sd.owner === <npc>` with `leftBehindChance` present; Jake's Friendface phone opens
  at its owner from item `owner`. The `describe` builder is the live path for the needs world, so a
  live proof that exercises private-object permission, desk-phone ring and left-behind reveal covers
  the renamed shipped fields.
- **Note:** `validator-access-*`, `validator-npc-habits`, `validator-npc-leash`, `validator-strict-keys`
  and `validator-retired-keys` node tests drive the Ruby validator (not the changed JS modules) and
  are chunk 1/2's; chunk 3 did not touch them. `lighting.js`'s `workstationIndicators(data, npcs, …)`
  signature keeps its now-unused `npcs` param (external callers pass it); only `ownerOf`'s dropped.

## Step 8b chunk 2 — Ruby readers (2026-11-13)

Chunk 2 of the five-chunk split: every Ruby owner reader now reads `owner`/`private`/`deskPhone`
only, never deriving an owner from `needsHome`. Single-owner readers accept a String only. Built on
chunk 1 (schema, transform, validator), on branch `build/hard-8b`. Templates stay on the old names
until chunk 4, so the live corpus is not clean yet; the expected failures below clear then.

### What changed

- **`lib/break_escape/access_identities.rb`.** `owner_id(obj, _scenario = nil)` returns `obj['owner']`
  (a String) or nil; no `needsHome` fallback. The scenario arg is kept for callers.
- **`lib/break_escape/owner_claim.rb`.** `colleague_phone?` gates on `deskPhone == true` and reads
  `owner`; `permitted?` reads object-level `private`; `owners_of(obj)` returns the object's explicit
  `owner` (String → one-element list, or a list as-is), no `needsHome`.
- **`lib/break_escape/access_work.rb`.** `lockout_pc?` reads `st['owner']` (hot-desk-has-no-owner rule).
- **`lib/break_escape/npc_habits.rb`.** comment only (`owned_workstations` delegates to `owner_id`).
- **`app/models/break_escape/social_feed.rb`.** `friendface_owner` reads item `owner`. A phone taken
  before the upgrade still counts: the player_state transform (chunk 1) renames the stored inventory
  copy's `phoneOf` to `owner`, which `held_friendface_phone`/`friendface_phone_taken?` read.
- **`app/models/break_escape/game.rb`.** `login_pc_owner` reads `pc['owner']` (no `needsHome`); the
  room-bootstrap held-phone drop reads item `owner`.
- **`app/controllers/break_escape/games_controller.rb`.** `CLIENT_ITEM_FORBIDDEN_FIELDS` gains `owner`
  and keeps `phoneOf` (an old-code tab cannot send either); the found-item friendface check reads
  `owner`.
- **Validators (owner derivers moved to the new names, messages reworded):**
  `validate_network.rb` (headless-owner message); `validate_access_work.rb` (`screen_owned_pcs`,
  `private_pc?` now object-level only, the writes-down owner rule via `AccessIdentities.owner_id`, the
  friendface-phone block reads item `owner`); `validate_npc_habits.rb` (owned message, `check_ids`
  owner); `validate_npc_needs.rb` (`check_phones` keyed on `deskPhone` reading `owner`, the answerer
  checks, `station_owner`, `owners_of` object-level `owner`, `private` reads moved off `affordance`,
  `check_left_behind` keyed on `leftBehindChance` reading `owner`); `validate_scenario.rb` (the
  owner-name error message and the placement-warning workstation owner read; its `check_owner_fields`
  conflict/`needsHome`-warning block and `check_item_fields` suppression are chunk 1's and untouched).
  `tools/playtest/verify-run.rb` and `generate_dungeon_graph.rb` read owners only through
  `AccessIdentities.owner_id`, so they move with it and needed no edit.
- **Support fixtures and tests moved to the new names.** `test/support/{access_model,capture_proof,
  network_model}_scenario.rb` rename explicit `screenOwner`; `access_work_scenario.rb` gains an
  `assign_owners!(data)` that writes `owner` on any id-bearing PC an NPC's `needsHome` names (what the
  chunk-4 rewrite does), called by its `scenario` builder and by two tests that add owned PCs after
  it (`npc_lockout_l`, `npc_workaround`). `npc_habits_loader_test.rb`'s `scenario` helper does the
  same. The owner Rails/unit tests set explicit `owner` where they relied on `needsHome` ownership.

### Tests (RBENV_VERSION=2.7.8, single files, no full suite)

- `owner_claim_test` + `npc_habits_test`: 50 runs, 288 assertions, 0 fail.
- `npc_habits_loader_test` + `npc_habits_postit_test`: 16 runs, 166, 0 fail.
- `friendface_phone_test` + `feed_post_reply_test` + `feed_post_reactions_test`: 49 runs, 271, 0 fail.
- `owner_claim_enforce_test` + `social_lockout_q33_test` + `npc_lockout_l_test`: 38 runs, 358, 0 fail.
- `access_model_login_test` + `network_remote_signin_test`: 47 runs, 576, 0 fail.
- `access_model_{loader,rules,withholding}_test` + `access_work_plan_test` + `network_model_test`
  (unit): 62 runs, 417, 0 fail.
- `npc_workaround_test` + `npc_workaround_h_test`: 63 runs, 431, 0 fail (after adding `assign_owners!`
  to npc_workaround's scenario). `npc_frustration_test` + `capture_proofs_test` + `usb_habit_test`
  passed in the same batch.
- `access_model_{desktop,no_password,rfid}_test` + `access_helper_equality_test` +
  `access_model_rules_test`: 85 runs, 937, 0 fail.
- network batch 1 (`network_model` unit, `network_remote_signin`, `network_host_service_off`,
  `network_outages`, `network_withholding`): 77 runs, 755, 0 fail.
- misc batch (`captures_sync`, `network_footholds`, `network_pivot`, `network_shares`, `network_wifi`,
  `usb_habit`, `wearable`, `clone_card_saved_cards`): 142 runs, 944, 0 fail.
- network batch 2 (`network_implants`, `network_inventory_delta`, `network_link_names`,
  `network_no_exposure`, `network_notes_not_live`, `start_item_answer_network`,
  `lab_physical_pentest_network`): 67 runs, 2280, 0 fail.
- Ruby validator (`scripts/validate_scenario.rb test_needs_sims --no-graph`): runs clean, no
  exception; the retired-key / owner-absent errors are the un-rewritten template (chunk 4).

### Expected failures left for later chunks

- `test/models/break_escape/lab_physical_pentest_secrets_test.rb`: **3 failures** (lines 94, 482, 506).
  All read ownership off the live `lab_physical_pentest` template, which still carries `screenOwner`
  (staff_pc, staff_pc_2) until **chunk 4** rewrites it, so `owner_id`/`login_pc_owner` return nil and
  the screenHabit fill and claim do not fire. Cleared by chunk 4's template rewrite. No other Rails
  test depends on an un-rewritten template.

### Sync size

No growth. Readers only; no state added. The player_state transform (chunk 1) renames item copies in
place once per load. Sync reads and writes no owner field.

### Files touched

`lib/break_escape/{access_identities,owner_claim,access_work,npc_habits}.rb`,
`app/models/break_escape/{social_feed,game}.rb`,
`app/controllers/break_escape/games_controller.rb`,
`scripts/validate_{network,access_work,npc_habits,npc_needs,scenario}.rb`,
`test/support/{access_model,capture_proof,network_model,access_work}_scenario.rb`,
`test/unit/{owner_claim,npc_habits}_test.rb`, `test/models/break_escape/{npc_habits_loader,
lab_physical_pentest_secrets}_test.rb`, `test/controllers/break_escape/{npc_habits_postit,
friendface_phone,feed_post_reply,feed_post_reactions,owner_claim_enforce,social_lockout_q33,
npc_lockout_l,npc_workaround,access_model_login,network_remote_signin}_test.rb`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

### Handover

- **Done:** chunk 2 as specified. Every Ruby owner reader reads only `owner`/`private`/`deskPhone`;
  grep of app/lib/scripts/tools for the retired names leaves only comments, the schema and transform
  (chunk 1), and the intentional `check_owner_fields` conflict block and `CLIENT_ITEM_FORBIDDEN_FIELDS`
  `phoneOf` entry.
- **For chunk 4:** rewriting the nine templates clears the 3 `lab_physical_pentest_secrets` failures
  and the un-rewritten-template validator errors. The `assign_owners!` helpers added to the test
  fixtures mirror the rewrite; they are test-only and do not change the shipped templates.
- **For chunk 5 (live proofs):** the desk phone answers only with `deskPhone: true` and `owner`; the
  owner claim reads `pc['owner']` (`login_pc_owner`); a Friendface phone taken on the base server is
  still taken after the upgrade because the player_state transform renames its stored `phoneOf` to
  `owner`, which `SocialFeed` reads.

## Step 8b chunk 4 — template rewrite, corpus equivalence, reader parity (2026-11-13)

Chunk 4 of the five-chunk split: the nine templates move to format 2 (one owner field), the frozen
format_8b fixtures, the Ruby corpus/parity test and the JS reader-parity test, and the real-transform
no-op proof on the deployed scenarios. Built on chunks 1 to 3 (schema/transform/validator, Ruby and
JS readers), branch `build/hard-8b`.

### Template rewrite (moved keys per scenario)

`tools/format/rewrite_templates.rb --step 2` (new) rewrites the seven pure-JSON templates as surgical
source edits that keep each file's own formatting: it uses the real `FormatUpgrade::STEP_8B` transform
as an oracle (render the template, transform, edit the source to that shape), does file-level renames
for the item keys that live outside room objects (`phoneOf`/`leftBehindBy`), and rewrites each
affected affordance block to match its inline-or-multiline source style. It verifies, per scenario,
that the rewritten template re-renders to exactly `transform(old)` and holds no retired owner key, and
refuses an ERB template. The two ERB templates (`lab_physical_pentest`, `test_capture_log`) are
hand-edited.

Keys moved (objects changed), matching the re-anchor's derived-owner counts:

- `test_access_habits`: 17 objects — 9 derived PC `owner`s, 8 coffee objects move `affordance.owners`
  (a one-element `owner` list) + `affordance.private` up to object level.
- `test_access_sessions`: 14 — 7 derived PC `owner`s, 7 coffee `affordance.owners`+`private` moves.
- `test_access_social`: 16 derived PC `owner`s + 11 item `phoneOf` -> `owner` on NPC-held Friendface
  phones.
- `test_access_work`: 13 — 12 derived PC `owner`s, 1 `screenOwner` -> `owner` and `affordance.private`
  -> `private` (pat_pc).
- `test_needs_sims`: 5 — amara/sanjay/tom PCs derive `owner` and move `affordance.private` up (two
  drain the affordance to `{}`), `phoneOwner` -> `owner` + `deskPhone: true` (tom_phone),
  `leftBehindBy` -> `owner` (tom_badge).
- `test_npc_needs`: 2 derived PC `owner`s (no retired keys).
- `test_clone_left_card`: 1 `leftBehindBy` -> `owner`.
- `test_capture_log` (ERB, hand): 1 `screenOwner` -> `owner` (mel_pc).
- `lab_physical_pentest` (ERB, hand, labs track): 2 `screenOwner` -> `owner` (staff_pc, staff_pc_2),
  3 `leftBehindBy` -> `owner` (pierce_comms_card, pierce_printout, hampshire_badge), kieran_laptop
  derives `owner: ["kieran"]` and moves `affordance.private` up to `private`, and one ERB note naming
  `leftBehindBy pierce` now says `owner pierce`. Only the owner keys and their notes were touched.

All nine validate with 0 errors (`--no-graph`). No dungeon_graph was written (every run used
`--no-graph`).

### Corpus equivalence and reader parity

`test/fixtures/format_8b/*` freezes the old render (template at the merge base `2f5471209`, which
still carries the pre-8b owner keys) and the new render (the rewritten template) for the four
scenarios that cover every transform path: habits (affordance.owners/private move), social (item
phoneOf), work (screenOwner + affordance.private + derived), needs_sims (phoneOwner desk phone,
leftBehindBy badge, drained affordances, derived). Both sides are frozen so a later scenario edit
cannot make `transform(old)` drift from `new`; the live templates are guarded separately by an
edit-proof retired-key check in each test (per the 8a lesson: never compare live templates with HEAD).

- `test/unit/format_8b_corpus_test.rb` (29 runs, 490 assertions, 0 fail): `transform(old) == new`,
  the transform is a no-op on new, `retired_keys_in(new)` empty, and the prepared-data agreement. The
  prepared check uses `prepared(transform(old)) == prepared(new)`, NOT 8a's `transform(prepared(old))`:
  the real load pipeline is upgrade then prepare (`Game#ensure_current_format!`), `prepare_scenario_data!`
  derives owner-dependent state (an NPC's `screenHabit` from the workstation it owns) and does not
  itself run the upgrade, so unlike 8a the transform and prepare do NOT commute. Reader parity: the
  old `AccessIdentities.owner_id`, `OwnerClaim.owners_of`/`permitted?`/`colleague_phone?` and the
  left-behind owner, reproduced inline, equal the live readers for every object. `owner_id` parity is
  scoped to the workstation domain (the isWorkstation rule plus any object that carried an explicit
  screenOwner): a non-workstation needsHome target (e.g. a USB-policy PC) got no derived owner by
  design, and no caller reads `owner_id` for one.
- `test/js/format-8b-reader-parity.test.mjs` (12 subtests, pass): the old `ownerOf(data, npcs)` loaded
  from the merge-base module text via `git show`, the new `ownerOf(data)` from the live module; equal
  over every workstation across the four scenarios, plus the edit-proof live-template guard.

Both tests bite: prefixing a frozen owner value turns each red (verified, then restored).

### Ruby/JS disagreement

None. No object is two NPCs' `needsHome` on the corpus (asserted per scenario in both tests), so the
old Ruby `owner_id` (first room NPC) and old JS `ownerOf` (first in the room's npcs list) could never
resolve to different owners; first-match order is never observable and the single-owner merge is
unambiguous.

### Deployed-scenarios no-op (real transform)

`test/controllers/break_escape/format_8b_deployed_noop_test.rb` (4 runs, 12 assertions, 0 fail)
renders m01, sis01, sis02 and lab_social_engineering through the real `Mission::ScenarioBinding` and
applies the real `STEP_8B` (not a stub): a no-op on every one, no retired owner key present. The
step-7 deployed-scenarios test stubs `FormatUpgrade.steps`, so it never exercised the real transform;
this closes the chunk-1 handover note.

### Failures cleared

- `format_8a_corpus_test` (was 9, then 6): the 8a fixtures predate 8b and carried the now-retired
  owner keys. STEP_8A (outage) and STEP_8B (owner) touch disjoint keys, so both sides of the social,
  work and needs_sims 8a pairs were upgraded through STEP_8B in place; `transform_8a(old) == new`
  still holds and the owner keys are gone. 21 runs, 0 fail; the 8a JS parity still passes; the 8a
  README records the upgrade.
- `npc-left-behind.test.mjs` and `npc-needs-slots.test.mjs` validator sub-tests: pass (the rewritten
  test_needs_sims validates clean).
- `lab_physical_pentest_secrets_test.rb` (was 3 fail, lines 94/482/506): 38 runs, 0 fail (staff_pc /
  staff_pc_2 now carry `owner`).

### Tests run (single files, no full suite)

format_8b_corpus (29/0), format_8b_deployed_noop (4/0), format_8a_corpus (21/0); format-8b-reader-parity,
format-8a-reader-parity, npc-left-behind, npc-needs-slots, validator-office-presets,
lab-physical-pentest-route-lines (JS, pass); scenario_schema_test + lab_physical_pentest_content_test +
npc_habits_clues_test (28/0); lab_physical_pentest_secrets_test (38/0). Validator on all nine templates:
0 errors each (`--no-graph`).

### Pre-existing failures found (NOT chunk 4's, for the orchestrator)

Six validator node tests that drive the Ruby validator with inline fixtures still carry the old owner
keys and so fail against chunk 2's owner-reading validator: `validator-access-work`,
`validator-access-model`, `validator-access-social`, `validator-npc-habits`, `validator-npc-leash`,
`validator-strict-keys`. They were last touched at step 8a, not by chunk 2, and chunk 3's handover
named this set as "chunk 1/2's". They are independent of the chunk-4 template/fixture work (their
fixtures are inline, not the live templates) and migrating them needs chunk 2's exact new validator
wording, so they are left for a chunk-2 follow-up.

### Sync size

No growth. Templates and fixtures only; no synced state changed. The transform renames in place and
derives at most one bounded key per object, as chunks 1 to 3 recorded.

### Files touched

The nine `scenarios/*/scenario.json.erb`; `tools/format/rewrite_templates.rb`;
`test/fixtures/format_8b/*` (README + 8 json); `test/fixtures/format_8a/{README.md,
test_access_social,test_access_work,test_needs_sims}.{old,new}.json`;
`test/unit/format_8b_corpus_test.rb`; `test/js/format-8b-reader-parity.test.mjs`;
`test/controllers/break_escape/format_8b_deployed_noop_test.rb`; `README_scenario_design.md`;
`scenarios/test_needs_sims/README.md`; this build log.

### Handover

- **Done:** chunk 4 as specified. All nine templates are format 2 and validate clean; corpus
  equivalence, both-side reader parity and the deployed no-op pass and bite; the listed chunk-1-to-3
  failures are cleared; the owner field docs in `README_scenario_design.md` and
  `scenarios/test_needs_sims/README.md` moved to the new names (grep of living READMEs and scenario
  notes is clean).
- **For chunk 5 (live proofs):** the rewritten templates are the live path; test_access_sessions owner
  claim, test_needs_sims desk-phone ring / left-behind reveal, test_access_social Jake's phone and the
  lab left-card beat all read the new owner fields. The merge base for the old-game proof is
  `2f5471209`.
- **For the orchestrator:** the six validator node tests above (chunk-2 owner-fixture migration gap)
  need a chunk-2 follow-up before the batch merges.

## Step 8b chunk-2 follow-up — validator node fixtures to one owner field (2026-11-13)

Migrated the six validator node tests the chunk-4 handover named, so each inline fixture uses the
format-2 owner shape (`owner`, `private`, `deskPhone`, `leftBehindChance`) and checks against the
current validator wording. No validator script changed. Branch `build/hard-8b`, built on `d8cf09321`.

### What changed (per file)

- **validator-npc-leash.test.mjs** (12/12): `cooler` helper hoists `private`/`owners` to object-level
  `private`/`owner`; the two inline `tom_pc` fixtures moved `affordance.private`/`owners` up. The
  `affordance.owners names unknown NPC` assertion is now `object '…' owner names unknown NPC` (validate
  _npc_needs wording). The "needsHome makes Tom its owner" case: needsHome no longer owns, so the
  private `tom_pc` carries an explicit `owner: 'tom'` and still serves nobody-warning-free (intent
  kept, not weakened).
- **validator-access-social.test.mjs** (25/25): the held Friendface phone and the test fixtures use
  `owner` not `phoneOf`; the `phoneOf 'nobody' names no room NPC` assertion is now `owner 'nobody'…`.
  Dropped the "phoneOf on another type warns" sub-case: `phoneOf` is retired to `owner`, which is
  valid on any object kind, so that warning no longer exists (retired-key error is covered in
  validator-retired-keys.test.mjs). Title updated.
- **validator-access-model.test.mjs** (36/36): `jake_pc` carries explicit `owner: 'jake'` (was derived
  from needsHome); `screenOwner`→`owner` on the hot_desk and dana_ws fixtures with the matching
  `owner '…' names unknown person` / `through owner` wording; the colleague-phone leave route uses
  `deskPhone: true, owner`; the private-source miss uses object-level `private`/`owner`.
- **validator-strict-keys.test.mjs** (15/15): the base `pc1` fixture moved `affordance.owners` to
  object-level `owner`/`private`. The `owners→owner` affordance slip (the retired key) is replaced by
  a `restores→restore` affordance slip, which still proves affordance is a closed, hinted block.
- **validator-npc-habits.test.mjs** (46/46) and **validator-access-work.test.mjs** (38/38): added an
  `assignOwners` helper that writes an explicit `owner` onto each id-bearing PC an NPC's needsHome
  names (mirrors chunk-2's `assign_owners!`), reproducing the old derivation the loader no longer
  does; explicit `screenOwner`/`affordance.private` fixtures renamed; the `owns '…' through screenOwner`
  assertion is now `through owner`. An id-less owned PC (the id-warning fixture) sets `owner` inline.

### Tests

- The six files: 12 + 25 + 36 + 15 + 46 + 38 = 172, all pass.
- Full `test/js/validator-*.test.mjs` suite: 893 tests, 891 pass, 2 fail. The two failures are in files
  outside this assignment and share the same chunk-2 gap (they still author retired owner fields):
  `validator-access-reactive.test.mjs` ("C2: a clean reactive feed raises nothing", uses `phoneOf`) and
  `validator-network-model.test.mjs` ("headless … on an owned workstation is an error", uses a
  needsHome-derived owner). The chunk-4 handover's "six" undercounts: these two need the same
  migration. Left for the orchestrator (not in this agent's file ownership).

## Step 8b chunk 5 — live proofs (including the old-game proof) (2026-11-13)

Chunk 5 of the five-chunk split: the five live proofs from plan step 8b "Live proof", each on the
real page with the real `window.__test` bridge, headless. Two keyless servers sharing the dev DB:
the branch server on **:3610** (branch `build/hard-8b`, `FormatUpgrade.current` 2), the base server
on **:3611** from the hand-made base worktree `.claude/worktrees/p-hard-8b-base` at the merge base
`2f5471209` (8a merged, `current` 1). Both started by hand the way `start-keyless-server.sh` does,
`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true`, GEMINI warning confirmed in each boot log. No
`db:` task anywhere. Drivers, the read-only row reader (`dump_owner.rb`) and the captures live in the
session scratchpad (`8b-chunk5/`); nothing was added to the repo except this section.

Branch games were made by `new-game.rb` (the real standalone-new-game creation path) where the
scenario has a Mission row, and by `swap-scenario-game.rb` only for `test_access_sessions` (no row;
its branch game is a current game, not an old one, so the swap tool is allowed there). The old game
for the stored-game proof was made by the **base worktree's own `new-game.rb`** (real-page creation,
Mission row 245 present), never the swap tool, per the 8a lesson and plan section 2.

All four branch games read back `formatVersion` 2 with zero retired owner keys in `scenario_data` and
`player_state`, and carry explicit `owner` on the derived PCs: `test_access_social` (3221) jake_pc
`owner "jake"`, lena_pc `owner "lena"`, jake_phone `owner "jake"`; `test_needs_sims` (3222) tom_pc
`owner "tom"`/`private true`, tom_badge `owner "tom"`/`leftBehindChance 0.7`, tom_phone `owner
"tom"`/`deskPhone true`; `test_access_sessions` (3224) dana_pc `owner "dana"`, ian_pc `owner "ian"`.

### Proof 1 — test_access_sessions, owner claim at a derived-owner PC (branch game 3224)

Beat T2. Entered `dana_room`; `waitFor npc_left_post:dana` returned (Dana to `dana_coffee`). After a
4 s settle, `interact dana_pc` opened her desktop with no password. The server's room payload for
`dana_room` carried `dana_pc ... "owner":"dana"` (derived owner, now explicit in format 2). The claim
request **POST /login -> 200** `{"success":true,"npcId":"dana","username":"dreyes","via":"claim"}`;
**GET /container/dana_pc -> 200** with `session {via: claim}`. `drain` held `pc_signed_in`,
`workstation_accessed`, `workstation_owner_left`; `window.__test.access.sessions()` =
`[{pcId:"dana_pc", npcId:"dana", username:"dreyes", via:"claim"}]`. `verify-run.rb 3224`:
`sessions 1: dana_pc = dana (claim)`, `signedInPcs dana_pc`, progress recorded (8 rooms beyond the
first). **PASS.**

### Proof 2 — test_needs_sims, desk phone answered by its owner + left-behind item (branch game 3222)

Desk phone: `interact spare_phone` (its `triggerOnInteract` emits `desk_phone_ring:tom_phone`) while
Tom was at his desk. Recorded event **`desk_phone_answered:tom_phone` `{ownerId:"tom",
answeredBy:"tom", knot:"call_supplier"}`** followed by `npc_call_heard:call_supplier
{speakerId:"tom", ownerId:"tom", phoneId:"tom_phone"}`; task `hear_tom_call` completed. The owner is
read from the `deskPhone` object's `owner` field. Left-behind: on Tom's real leave,
`npc_left_post:tom {leftBehind:["tom_badge"]}` and **`object_revealed:tom_badge` `{npcId:"tom",
objectId:"tom_badge", owner:"tom"}`** — the `object_revealed` payload carries the renamed `owner` key
(chunk 3's `leftBehindBy -> owner`), and the badge drew on the empty desk (visible, interactable);
task `see_left_behind` completed. `verify-run.rb` reports this single-room office scenario as
"BOOTSTRAP ONLY" by its rooms/objects/flags gate (no room transition and the badge pickup did not
register as an object unlock), but the two task completions and the two events are the evidence that
both owner reads fire on the live path. **PASS** (desk-phone owner answer and left-behind reveal).

### Proof 3 — test_access_social, Jake's Friendface phone (branch game 3221)

`debugKO jake` dropped `jake_phone` (`owner "jake"`); picked it up (`interact jake_phone`, now in the
inventory). Opening it issued **POST /friendface_phone -> 200** `{"npcId":"jake","site":"friendface",
"person":"jake"}` and the osint-browser opened on **Jake Brooks'** profile. The server reads the held
phone's `owner` (SocialFeed `held_friendface_phone`/`friendface_owner`). Task `f14_jake_phone`
completed; `verify-run.rb 3221` progress recorded, inventory holds Jake's phone. **PASS.**

### Proof 4 — lab_physical_pentest, the left-card beat (branch game 3241)

Through the briefing to `open_plan`; `waitFor workstation_owner_left:staff_pc_2` returned
`{ownerId:"pierce", screenLocked:false, reason:"needs"}`. The needs system set
`pierce_comms_card_left` and the card revealed: **`object_revealed:pierce_comms_card` `{npcId:"pierce",
objectId:"pierce_comms_card", owner:"pierce"}`**. The open_plan room payload then carried
`pierce_comms_card ... "owner":"pierce","card_id":"lw_comms_card"` (format 2 owner on the keycard, the
left-card the owner leaves when she steps away). `verify-run.rb 3241`: progress recorded (4 rooms
beyond the first), globals include `pierce_comms_card_left` and `staff_pc_2_owner_away`. Clone/take of
the card was not driven (it needs the RFID cloner from the kit); the reveal and the server owner field
are the owner-read under test. **PASS** (left-card reveal reads `owner`).

### Proof 5 — the stored-game (old-game) proof on test_access_social (game 3239)

The old game was made on the base (`:3611`, `current` 1) by the **base worktree's `new-game.rb`**
(real creation path: `generate_scenario_data` renders the base template, then `prepare_scenario_data!`
fills, then `stamp_format_version` stamps 1; Mission row 245 present), NOT the swap tool. Played on
the base's real page: `jake_room`, `debugKO jake`, picked up `jake_phone`, synced, so `player_state`
holds the old stored copy.

**Before (base, format 1), `dump_owner.rb 3239`:** `formatVersion 1`; **11** retired keys in
`scenario_data` (every `*_phone/phoneOf`, incl. `jake_phone phoneOf "jake"`); the derived PC owners
are not materialised in format 1 (read-time only). `player_state["inventory"]` `jake_phone` copy keys
include **`phoneOf "jake"`**, no `owner`. Base **GET /scenario** header `X-Break-Escape-Format: 1`;
base **POST /friendface_phone -> 200** `{"npcId":"jake","person":"jake"}` (old reader read `phoneOf`).

Stopped the base session, then the base server (by its listening pid), confirmed `:3611` down.

Loaded the same game on the branch (`:3610`). First **GET /scenario -> 200**, header
**`X-Break-Escape-Format: 2`** — the load upgraded the game (`set_game` ->
`ensure_current_format!`, under the row lock).

**After (branch, format 2), `dump_owner.rb 3239`:** `formatVersion 2`; **0** retired keys in
`scenario_data` and **0** in `player_state`; `jake_phone owner "jake"` (object), jake_pc `owner "jake"`
and lena_pc `owner "lena"` (the derived owners now explicit); `player_state` `jake_phone` inventory
copy **`owner "jake"`, no retired key** (the `player_state` transform renamed the stored copy in
place). The phone still counts as taken (it is still in the inventory after the upgrade; the taken
check reads the inventory copy). Opening the held phone on the branch page: **POST /friendface_phone
-> 200** `{"npcId":"jake","person":"jake"}`, the feed opened on Jake Brooks the same as before.
`verify-run.rb 3239`: progress recorded (1 room beyond the first, inventory holds Jake's phone, task
`f14_jake_phone` completed). **PASS.** (The old-tab 409 refusal is outside this brief's listed
requirements; the 409 + `X-Break-Escape-Format` header mechanism is format-agnostic and was proved at
step 8a, section "3c".)

### Sync size

No growth. Every proof's `player_state` sync carried the same bounded data before and after the owner
rename: the stored item copy's `phoneOf` became `owner` **in place** (one shorter key, no addition),
a derived-owner PC gains at most the one `owner` key once at upgrade, and `sync_state` reads and
writes no owner field (globals and encountered NPCs only). The upgraded old game (3239) `player_state`
holds the same inventory it held before, one key renamed.

### Servers and clean-up

Branch server `:3610` and base server `:3611` both stopped by their own listening pids; both
confirmed down by curl. All browser sessions stopped by `session-stop.sh` (or their pidfile). The base
worktree `.claude/worktrees/p-hard-8b-base` is left in place, as 8a did. Games 3221, 3222, 3224, 3236,
3239, 3241 are development-DB games left at format 2, recorded here; no other game was touched.

### Handover

- **Done:** chunk 5 as specified. All five proofs pass on the real page. The stored game upgraded on
  first load (format 1 -> 2, the 11 `phoneOf` keys gone from `scenario_data` and the renamed key gone
  from the stored `jake_phone` copy, header `X-Break-Escape-Format: 2`, phone still taken, feed opens
  the same, `verify-run` progress). Branch games are format 2 with derived owners explicit and zero
  retired keys.
- **Old games made:** stored-game proof via the base worktree's own `new-game.rb` (real-page creation,
  Mission row 245), never the swap tool; `test_access_sessions`' branch game via `swap-scenario-game.rb`
  (current game, not an old one).
- **For the orchestrator:** `test_needs_sims`' `verify-run` prints "BOOTSTRAP ONLY" because it is a
  single-room office scenario (no room transition, no object unlock) — the two task completions and the
  two owner-read events are the evidence there; not a regression. The two extra validator node tests the
  chunk-2 follow-up still leaves red (`validator-access-reactive`, `validator-network-model`) are
  independent of chunk 5.

## Step 8b full-suite fixes — the last test fixtures still deriving an owner (2026-11-13)

The integrator's full JS and Rails suites on the merge tip `92460079a` left four JS files and five
Rails cases red. Each is a test fixture that still relied on an owner derived from `needsHome`, or
still authored a retired owner key; no production reader was wrong. Every owner reader the failures
exercise was confirmed to read `owner` only and never derive from `needsHome`:
`scripts/generate_dungeon_graph.rb` (through `AccessIdentities.owner_id`), `tools/playtest/verify-run.rb`
(`owner_id`), `tools/playtest/lib/access_leak_scanner.rb` (through `Game#login_pc_owner`, game.rb:2088,
which reads `pc['owner']`), `NpcHabits.owned_workstations` (`owner_id`) and `scripts/validate_network.rb`
(`owner_id`). The brief-named readers (`generate_dungeon_graph.rb`, `verify-run.rb`,
`access_leak_scanner.rb`, `access_identities.rb`, `npc_habits.rb`) were all already on format 2;
nothing an earlier chunk missed.

### Fixes (test-only, each reproduces the retired needsHome derivation with an explicit `owner`)

- **test/js/dungeon-graph-habits.test.mjs** (9/9): the sticky-note fixture's `omar_pc` and the
  locksScreen fixture's six PCs (`dana_pc`...`tom_pc`) gain `owner: '<npc>'` matching each NPC's
  `needsHome`. The graph's writesDown and locksScreen edges hang off `owner_id`/`screen[:filled]`, so
  without an explicit owner it drew none. kai_pc (policy instant), priya_pc (own `locksScreenOnLeave`),
  ian_pc (always locks) and tom_pc (needs untracked) are still correctly edge-free with the owner set.
- **test/js/playtest-verify-run-access.test.mjs** (15/15): `HABITS_SCENARIO`'s dana_pc/priya_pc/omar_pc
  gain `owner`, so `verify-run --access` prints the per-PC owner lines the test asserts.
- **test/js/validator-access-reactive.test.mjs** (10/10): dana's held phone used retired `phoneOf: 'dana'`;
  now `owner: 'dana'`, so the q35 "holds no Friendface phone" error no longer fires on the clean feed.
- **test/js/validator-network-model.test.mjs** (64/64): the clean fixture's `lena_pc` gains `owner: 'lena'`,
  so the "headless host is a workstation with an owner" error bites (the check reads `owner_id`).
- **test/unit/pc_screen_lock_precedence_test.rb** (8 cases): the bare PC gains `owner: 'jake'` so
  `NpcHabits.expand!` fills jake's screenHabit from `habits.locksScreen`.
- **test/unit/access_identities_screen_test.rb** (plain-Ruby case): the two PCs gain `owner: 'jake'`/
  `owner: 'mia'`. The raw-data assertion (the id-less PC owns nothing) still holds: `workstation?`
  needs an id, so the unstamped raw PC is not an owned workstation.
- **test/unit/access_leak_scanner_test.rb** (:399, :406, :420): `habits_scenario`'s `omar_pc` gains
  `owner: 'omar'` so `login_pc_owner` resolves and the owner's own postitNote/savedNotes exception
  fires; `hot_desk` is left ownerless by design (its three cases expect the password reported).

### Grep sweep (whole tree)

Remaining hits for `screenOwner`/`phoneOwner`/`phoneOf`/`leftBehindBy`/`affordance.owners`/
`affordance.private`/needsHome-as-owner are all legitimate: the `CLIENT_ITEM_FORBIDDEN_FIELDS` list and
its test (`games_controller.rb`, `friendface_phone_test.rb`), the schema `owner`/`deskPhone`
descriptions, the `rewrite_templates.rb` upgrade transform, the frozen `test/fixtures/format_8b/*.old.json`
renders with their old-reader parity tests (`format_8b_corpus_test.rb`, `format-8b-reader-parity.test.mjs`),
and `check_owner_fields` in `validate_scenario.rb` (the plan's intended migration-aid block that
detects the pre-rename conflict and warns when `needsHome` names an ownerless workstation). `owner_claim.rb`
reads `needsHome` only for the owner's idle/print position, with an explicit comment that it no longer
sets an owner. No stray reader left.

### Tests

- JS: dungeon-graph-habits 9/9, playtest-verify-run-access 15/15, validator-access-reactive 10/10,
  validator-network-model 64/64.
- Rails: pc_screen_lock_precedence + access_identities_screen + access_leak_scanner together 55 runs,
  318 assertions, 0 failures.
- Only test-fixture files changed; nothing imports them, so no other importer to run.

## Step 8b review R1 minor fixes

Two coverage/wording nits from `SCENARIO_FORMAT_HARDENING_STEP8B_REVIEW_R1.md`, no correctness defect.

- **Player_state rename is marker-free.** `rename_one_hash_owner_fields!` now takes `write_markers:`
  (default true). The scenario walk keeps the markers (`phoneOwner` sets `deskPhone: true`, a
  left-behind item gets `leftBehindChance: 0`). The player_state walk
  (`one_owner_field_in_player_state!`) passes `write_markers: false`, so a stored item copy is renamed
  in place and gains at most the one `owner` key. This keeps the SYNC SIZE RULE tight by construction:
  the upgrade cannot add a second key to a re-sent copy, independent of what the corpus happens to
  carry. Left-behind slots are read from scenario-sourced room objects, never from stored copies,
  and desk phones are not takeable, so no reader needs the markers on a stored copy. One unreachable
  case remains: a left-behind item that is also droppable, re-dropped after the upgrade, carries no
  `leftBehindChance` where a fresh game's re-dropped copy would. No corpus left-behind item is
  droppable, and the reveal global already gates it, so the key is deliberately not re-added.
- **Corpus coverage.** The frozen equivalence and parity fixtures cover test_access_habits,
  test_access_social, test_access_work and test_needs_sims, which between them exercise every path of
  the transform (derived workstation and private owners, emptied affordance, desk phone, left-behind,
  Friendface phone). test_access_sessions, test_npc_needs, test_clone_left_card, test_capture_log and
  lab_physical_pentest were rewritten by the same transform (or by hand for the two with ERB) and
  validate with no retired-key line; they have no frozen fixture of their own.
- **The needsHome warning now has an executing test.** `validator-retired-keys.test.mjs` fires
  `check_owner_fields`' "needsHome no longer sets an owner" warning (a workstation that is an NPC's
  `needsHome` with no owner of its own) and asserts the matching case with an explicit owner stays
  silent.

### Tests

- Ruby: `format_upgrade_test`, `format_8b_corpus_test`, `format_8b_deployed_noop_test` together
  51 runs, 594 assertions, 0 failures. (`engine.rb` is the only other requirer of `format_upgrade.rb`;
  the deployed-noop test exercises its load path.)
- JS: `validator-retired-keys.test.mjs` 24/24 (was 22; two new 8b owner-warning cases).

## Step 8c build plan (re-anchored 2026-11-13, anchor a693650b9)

Step 8c (habits in one block, format 3) is re-anchored in the plan against `a693650b9` (the finished
8b branch tip; formats 0 to 2 live, `FormatUpgrade.current` 2); see
`SCENARIO_FORMAT_HARDENING_STEP8C_REANCHOR.md` (verdict: mechanical). Built on branch `build/hard-8c`
from a main that holds steps 2, 2b, 7, 8a and 8b. Seven chunks, each a fresh agent under about 150k
tokens; each commits its own files with explicit paths. The 8c test surface is larger than 8b's (26
test files name the three keys, plus the USB subsystem), so the test ownership below is exhaustive and
the integrator does not re-run the full suites until chunk 7.

Standing rules for every chunk: no `db:` task on the shared DB; the validator runs with
`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`; a new static JS import
goes on each test-harness copy list; count every `❌` line as a failure. **Do not edit**
`test/fixtures/format_8a/*` or `test/fixtures/format_8b/*`: they are frozen historical renders that
still carry habit keys and would break the 8a/8b corpus tests if touched.

The three keys fold as: `screenHabit` -> `habits.screen`, `printHabit` -> `habits.print`,
`usbHabit` -> `habits.usb`, each keeping its own keys and staying a closed block with `^_` allowed.

### Chunk 1 — schema, transform, validate_scenario.rb, format upgrade (first; others build on it)

- **Scope.** `scripts/scenario-schema.json`: add `screen`, `print`, `usb` sub-objects inside the closed
  `habits` block (4275-4290), each carrying the keys and descriptions moved from the top-level
  `screenHabit`/`printHabit`/`usbHabit` definitions (:4781-:4783), then remove those three top-level
  keys, all in one commit. `lib/break_escape/format_upgrade.rb`: `STEP_8C` (version 3,
  `habits_in_one_block`), `current` now 3; the `scenario` transform moves each top-level habit key into
  `habits.<screen|print|usb>` (creating `habits` if absent), idempotent, skips notes and free data,
  no-op on format-3 data. NPC records are not stored in player_state, so the `player_state` transform
  is a no-op (confirm by grep and assert it). `retired`: NPC `screenHabit`, `printHabit`, `usbHabit`.
  `scripts/validate_scenario.rb`: `known_npc_fields` (:807-:822) loses `screenHabit printHabit usbHabit`;
  the `screen_habits` map (:1297-:1302) reads `habits.screen`; the ship note at :7092; the retired-key
  dedup so a reintroduced top-level key prints only the one rename line (as 8a/8b do).
- **Files.** `scripts/scenario-schema.json`, `lib/break_escape/format_upgrade.rb`,
  `scripts/validate_scenario.rb`, `test/unit/format_upgrade_test.rb`,
  `test/js/validator-retired-keys.test.mjs`.
- **Tests.** `format_upgrade_test.rb` (the 8c transform on raw data and on prepared data with an
  authored and with a loader-filled habit; player_state no-op; idempotence; no-op on format-3);
  `validator-retired-keys.test.mjs` (each of the three retired keys one rename line; `habits.screen`/
  `.print`/`.usb` print no unknown-field warning). Also add a `format_8c_deployed_noop_test.rb`
  asserting the four deployed scenarios (m01_first_contact, sis01_healthcare, sis02_energy,
  lab_social_engineering) upgrade to format 3 with no habit change, since none authors the keys and
  none has `awareness`/`habits.locksScreen`.
- **Done when.** Those test files pass alone; `FormatUpgrade.current` is 3; the three authored-habit
  scenarios still await the rewrite (chunk 5) so they do not validate clean yet.

### Chunk 2 — Ruby runtime readers and the ship filter

- **Scope.** Move every Ruby runtime habit reader to the folded paths, reading only the new names:
  `NpcHabits.fill_screen_habit!` (npc_habits.rb:179) and `expand!` (:116/:146) write/read
  `habits.screen`; `AccessIdentities` screen read (access_identities.rb:186/:196); `OwnerClaim`
  (`printHabit` owner_claim.rb:157/:254/:260, `screenHabit` :226/:235); `AccessWork.usb_habit`
  (access_work.rb:1211) and the `work.usb` build (:1165-:1170); `NpcFrustration` (its `AccessWork.usb_habit`
  call at :439 follows for free; update the comment at :276); `Game` the filter
  (`WITHHELD_NPC_KEYS`/`WITHHELD_WORK_NPC_KEYS` game.rb:5620/:5624, applied :5656-:5657) becomes an
  allow list that keeps `habits.screen` and `habits.print` and deletes the rest of `habits`
  (`locksScreen`, `writesDown`, `password`, `passwordPattern`, `holdsDoors`, `usb`, and any later key);
  `work.usb` stays built from `habits.usb`; the `screenHabit` precedence note beside `pc_always_locks?`
  (:2094-:2096) and the `habits`-block reads `npc_habit`/`written_down?` (:2101-:2113).
- **Files.** `lib/break_escape/npc_habits.rb`, `access_identities.rb`, `owner_claim.rb`, `access_work.rb`;
  `app/models/break_escape/npc_frustration.rb`, `game.rb`; `test/support/access_model_scenario.rb`;
  the Rails/unit tests: `npc_habits_test.rb`, `npc_habits_loader_test.rb`,
  `access_identities_screen_test.rb`, `pc_screen_lock_precedence_test.rb`, `owner_claim_test.rb`,
  `owner_claim_enforce_test.rb`, `npc_frustration_test.rb`, `npc_lockout_l_test.rb`,
  `npc_workaround_h_test.rb`, `access_model_withholding_test.rb`, `access_leak_scanner_test.rb`,
  `lab_physical_pentest_secrets_test.rb`, `usb_habit_test.rb`, `access_work_usb_habit_test.rb`.
- **Tests.** Each touched Rails/unit file alone (RBENV_VERSION=2.7.8): the readers read `habits.screen`/
  `.print`/`.usb` only; the loader fills `habits.screen` with the same values and report entries as
  before; the Rails what-ships test shows a room NPC carrying every `habits` key arriving in the
  bootstrap and room payload with `habits` holding exactly `screen` and `print` (`writesDown`,
  `password`, `holdsDoors` never ship), and `work.usb` still built for a USB habit.
- **Done when.** Every touched Ruby file passes alone; no runtime reader reads a retired name (grep of
  app/lib leaves only comments, the schema and the retired list).

### Chunk 3 — JS readers and node reader tests

- **Scope.** `public/break_escape/js/systems/workstation-state.js` reads `npc.habits.screen` (:124);
  `npc-needs.js` reads `rec.habits.print` (:973/:3351) and keeps reading `work.usb` (:508/:3413/:3439,
  unchanged, since usb ships in the work plan). Grep the rest of the engine for any other
  `screenHabit`/`printHabit` read (none expected).
- **Files.** `workstation-state.js`, `npc-needs.js`; the node tests `workstation-state.test.mjs`,
  `npc-office-visuals.test.mjs`, `npc-print-forget.test.mjs`, `npc-printer-power.test.mjs`; each
  harness copy list if a new import appears.
- **Tests.** Each touched node file alone (`bin/test-js` runs plain node): `decideLocked` reads the
  owner's `habits.screen`; the print errand reads `habits.print`; the office visuals and printer-power
  cases pass on the folded fixtures.
- **Done when.** Every touched node file passes alone; no JS reader reads a retired name.

### Chunk 4 — the Ruby validators, verify-run, the leak scanner, and their node tests

- **Scope.** Move the validator derivers to the folded paths: `validate_npc_habits.rb`
  (:158/:333/:354/:521/:527, including the effective-rule printout source labels), `validate_npc_needs.rb`
  (screen :497/:526-:529/:566, print :335/:394-:418), `validate_access_work.rb` (the careful-guest
  screen warning :1164-:1169, usb :357/:508/:577-:615/:680-:699/:750). `tools/playtest/verify-run.rb`
  (:165-:166 reads `habits.screen`). `tools/playtest/lib/access_leak_scanner.rb` (the withheld-key set
  :147/:320). Keep all `validate_scenario.rb` edits in chunk 1; this chunk does not touch it.
- **Files.** The five files above; the node tests `validator-npc-habits.test.mjs`,
  `validator-access-work.test.mjs`, `validator-usb-habit.test.mjs`, `validator-strict-keys.test.mjs`,
  `validator-access-model.test.mjs`, `playtest-verify-run-access.test.mjs`.
- **Tests.** Each touched node file alone: each retired key one error; the effective-rule printout for
  a PC with its own field, an owner with an authored `habits.screen`, an owner with a preset, and a hot
  desk guest; `verify-run --access` prints the per-PC lines on the folded fixtures.
- **Done when.** Every touched node file passes alone; no validator or tool reads a retired name.

### Chunk 5 — template rewrite, README, corpus equivalence, reader parity

- **Scope.** `tools/format/rewrite_templates.rb --step 3` rewrites the three templates that author a
  habit key: test_access_social (5 `screenHabit`, 1 `usbHabit`), test_access_work (3 `screenHabit`),
  test_needs_sims (2 `screenHabit`, 1 `printHabit`). test_access_habits and lab_physical_pentest author
  none (lab_physical_pentest's two `screenHabit` mentions are `<%# %>` comments; update their wording by
  hand), so they get no key move but are re-validated. Update `README_scenario_design.md`: the habit
  teaching (the closed-blocks list at :56 and the sections at :1077, :1150, :1177, :1187) moves to
  `habits.screen`/`.print`/`.usb`; in the same commit clear the `downIf`->`offWhen` wording step 8a
  left in that file (:931, :945, :964, :966, :990, :992, :1090, :1100, :1104, :1191, :1193, :1195).
  Freeze both sides as fixtures (`test/fixtures/format_8c/<scenario>.old.json` [format-2 render, still
  `screenHabit`] and `.new.json` [folded], captured with `srand(1)` and SecureRandom stubbed), never
  read through `git merge-base`; add an edit-proof live guard that renders the live templates and
  asserts no retired habit key has returned.
- **Files.** The three `scenarios/*/scenario.json.erb` plus lab_physical_pentest's comment wording;
  `README_scenario_design.md`; `tools/format/rewrite_templates.rb` (if the 8c case needs support);
  `test/fixtures/format_8c/*`; `test/unit/format_8c_corpus_test.rb`;
  `test/js/format-8c-reader-parity.test.mjs`.
- **Tests.** Corpus equivalence: the 8c transform on each old render equals the new render (parsed
  JSON, key order ignored); `prepare_scenario_data!` agrees across the fold (the loader finds
  `habits.screen` present and fills nothing, matching the old filled `screenHabit` field for field);
  `retired_keys_in` finds nothing in any new render. Reader parity: for every workstation and every NPC
  that can borrow one, the effective lock rule is the same under the old reader on the old render and
  the new reader on the new render; the five fixtures (priya_pc test_access_habits, omar_pc
  test_access_social, rosa_pc/ian_pc/jake_pc test_access_work) are named. Prove both tests bite
  (prefix a renamed value -> red).
- **Done when.** All five authored/awareness scenarios validate with 0 errors (`--no-graph`); the
  corpus and parity tests pass and bite; moved keys per scenario are logged with counts matching the
  re-anchor.

### Chunk 6 — live proofs (including the old-game proof)

- **Scope.** Two keyless servers sharing the dev DB, `setFPS(20)` with fixed steps on, headless, on the
  builder's assigned ports (not :3000/:3001/:3002). Branch server on one port; base server on a
  hand-made base worktree at `git merge-base main build/hard-8c`. Prove, per plan step 8c Live proof:
  test_access_work the hot desk beats H1 to H3 (the guest's `habits.screen` decides) and Rosa's own PC
  locking when she leaves; test_needs_sims a print fetched; test_access_social the USB refusal; and the
  stored-game proof — a real old game on test_access_habits made on the base (section 2 one-off runner,
  or `swap-scenario-game.rb` if the brief directs, recording which), whose game holds a `screenHabit`
  the old loader filled from awareness, loaded on the branch, upgrading to format 3 on first load (old
  top-level keys gone, the value now at `habits.screen`, read with `bin/rails runner`), then the beat
  that habit drives (priya_pc locking when she leaves), an old tab's sync refused with 409 and the
  header, `verify-run.rb` showing progress. Keep both dumps (before and after the load). Stop both
  servers by PID.
- **Files.** Drivers and the read-only row reader in the session scratchpad only; nothing added to the
  repo except this log's proof section.
- **Done when.** Each beat passes; the stored game shows format 3 with `habits.screen`; the old-tab
  refusal shows 409 + header; both servers confirmed down.

### Chunk 7 — full suites under the shared lock, test-only fallout, before review

- **Scope.** Run the full Rails and JS suites once on the branch tip under the shared lock
  (`flock /tmp/claude-1000/.../tests.lock bin/rails test` and the same for `bin/test-js -j 3`). Fix
  only test-only fallout: any remaining test file with an inline habit fixture or assertion still on a
  retired name that the owning chunk missed (the 8b lesson: the full suites found ten such late). For
  each failure, confirm the production reader already reads the folded path (quote the reader line) and
  that only the fixture was stale; never weaken a reader to make a test pass. Known timing flakes
  (fingerprint-generator, client-purchase, password-signin-mode) count green only if they pass rerun
  alone. Truncate `test/dummy/log/test.log` if it grows large.
- **Files.** Whatever test/support/fixture files the run reveals; log the grep sweep of the whole tree
  for `screenHabit`/`printHabit`/`usbHabit` showing every remaining hit is legitimate (comments, the
  schema, the retired list, the frozen `format_8a`/`format_8b`/`format_8c` fixtures, the upgrade
  transform).
- **Done when.** Both full suites green on one tip (flakes reruns aside); the grep sweep is clean; the
  branch is ready for code review.

## Step 8c chunk 1 — schema, transform, validate_scenario.rb, format upgrade (2026-11-13)

Branch `build/hard-8c` from `e5499e795` (step 8b plus current main; formats 0 to 2 live,
`FormatUpgrade.current` 2). Chunk 1 of the seven-chunk split: the schema, the `FormatUpgrade` step
and the `validate_scenario.rb` edits only. Every runtime reader (Ruby and JS), the validator
derivers, the templates and the fixtures stay on the old names (chunks 2 to 5), so the corpus is not
validated clean yet; the expected failures that follow clear in later chunks.

### What changed

- **`scripts/scenario-schema.json`.** The closed NPC `habits` block (awareness habits) gains three
  closed sub-blocks `screen`, `print` and `usb`, each `additionalProperties: false` with `^_` allowed,
  carrying the keys and descriptions moved from the top-level `screenHabit`/`printHabit`/`usbHabit`
  definitions. The three top-level keys are removed. The `locksScreen` description (and the moved
  `screen` description) now name `habits.screen`, not `screenHabit`. No `x-ref` added (step 4 owns
  that).
- **`lib/break_escape/format_upgrade.rb`.** `STEP_8C` (version 3, name `habits_in_one_block`); `STEPS`
  is now `[STEP_8A, STEP_8B, STEP_8C]` so `current` is 3. The `scenario` transform
  `habits_in_one_block!` walks every live Hash (`AuthorNotes.each_live`, `free: :skip`) and folds the
  three top-level habit keys into the NPC's `habits` block via `fold_one_hash_habit_fields!`, creating
  `habits` only where at least one key is present; each move is guarded by `unless habits.key?(new)`
  so a second run or format-3 data is a no-op and an already-folded value wins, and the top-level key
  is always removed. The `player_state` transform is `->(state) { state }` — a no-op: no sync path
  stores an NPC record (grep of `app`/`lib`: player_state holds `npcFrustration`, `phonesTaken`,
  `npc_given_items`, `sharedLogins`, `encounteredNPCs`, never an NPC hash with habit keys).
  `retired`: NPC `screenHabit` -> `habits.screen`, `printHabit` -> `habits.print`,
  `usbHabit` -> `habits.usb`, each `path: nil` (match anywhere; the keys are unique to NPC records,
  as 8b did for its item keys).
- **`scripts/validate_scenario.rb`.** `known_npc_fields` loses `screenHabit`, `printHabit`, `usbHabit`.
  `npc_screen_habits` reads `habits.screen` from the expanded copy, not `screenHabit`. The owner-claim
  ship-note comment (`:7092` area) now says "`habits.screen` is filled". The NPC unknown-field loop in
  `check_unknown_fields` now suppresses the redundant unknown-field warning for a retired NPC key
  (reusing the `retired_item_keys` set, which holds every retired entry's key), so a reintroduced
  top-level `screenHabit` prints only the one rename line from `check_retired_keys` (the 8a/8b dedup
  pattern, now for NPC keys). The validator derivers in `validate_npc_habits.rb`/`validate_npc_needs.rb`/
  `validate_access_work.rb`, `verify-run.rb` and the leak scanner are untouched (chunk 4).

### Tests

- `test/unit/format_upgrade_test.rb` (RBENV_VERSION=2.7.8): **22 runs, 112 assertions, 0 failures.**
  Added four 8c tests (the fold into a new and into an existing `habits` block, with a note left as
  written; the fold of a loader-filled `screenHabit` on prepared data via `NpcHabits.expand!`,
  unchanged; idempotence and no-op on format-3; the player_state no-op). Updated the three current-bump
  assertions the version-3 step moved (`formatVersion`/`ran` now cover all three steps; the dev-switch
  teardown leaves `current` 3).
- `test/js/validator-retired-keys.test.mjs`: **29 tests, 0 fail** (was 24). Added the three NPC retired
  keys (each one rename line to `habits.screen`/`.print`/`.usb` in format 3); the folded
  `habits.screen`/`.print`/`.usb` print no unknown-field warning; a reintroduced top-level `screenHabit`
  on an NPC prints no unknown-field warning (the dedup).
- `test/controllers/break_escape/format_8c_deployed_noop_test.rb` (new): **4 runs, 60 assertions, 0
  failures.** The real `STEP_8C` scenario transform is a no-op on each of m01_first_contact,
  sis01_healthcare, sis02_energy and lab_social_engineering, and the raw render carries no
  `screenHabit`/`printHabit`/`usbHabit`/`awareness` and no `habits.locksScreen`, so the loader fills no
  habit either; a full `upgrade!` only stamps `formatVersion` 3.
- Hand check: the full validator on test_access_social prints exactly 6 retired-key errors
  (5 `screenHabit` + 1 `usbHabit`, matching the re-anchor) and no duplicate unknown-field warning; it
  does not crash on the now-empty `npc_screen_habits` map.
- Importers of `format_upgrade.rb` (current 2 to 3): `format_version_test` + `format_deployed_scenarios_test`
  + `upgrade_games_tool_test` (29 runs, 0 fail — they stub `steps`); `access_model_loader_test`,
  `npc_habits_loader_test`, `capture_proofs_test`, `reload_persistence_test` (123 runs, 0 fail). Node
  tests that name a habit key and were not expected to change: `validator-usb-habit` (25),
  `validator-access-work` (38), `validator-access-model` (36), `playtest-verify-run-access` (15),
  `workstation-state` (55), `npc-office-visuals` (36), `npc-print-forget` (15), `npc-printer-power`
  (14) — all 0 fail.

### Expected failures left for later chunks

- `test/unit/format_8a_corpus_test.rb`: **9 failures**; `test/unit/format_8b_corpus_test.rb`: **10
  failures.** Both assert the live templates carry no retired key and the frozen format-2 render holds
  none; the un-rewritten corpus still authors the habit keys (test_access_social 5 `screenHabit` + 1
  `usbHabit`, test_access_work 3 `screenHabit`, test_needs_sims 2 `screenHabit` + 1 `printHabit`).
  Cleared by **chunk 5** (template rewrite). Counts and paths match the re-anchor's per-scenario lists.
- The three authored-habit scenarios (test_access_social, test_access_work, test_needs_sims) do not
  validate clean (retired-key errors) until **chunk 5** rewrites them.
- `test/js/validator-strict-keys.test.mjs`: **3 failures.** Two: a reintroduced top-level `screenHabit`
  is now a retired key (one rename line, no schema unknown-key line), so the test's count of 1 schema
  line for `screenHabit` reads 0. One: the closed-block enumeration reads the removed top-level habit
  schema paths and raises on `additionalProperties`. Cleared by **chunk 4** (it owns this test and
  moves its habit paths to `habits.screen`/`.print`/`.usb`).
- `test/js/validator-npc-habits.test.mjs`: **1 failure** (`the office life autoLockSeconds check sees
  the filled habit`, line 240). The fixture fills a habit from `awareness: 'low'`; in chunk 1 the
  loader (`NpcHabits`) still fills `screenHabit` while `npc_screen_habits` already reads `habits.screen`,
  so the screen-habit map is empty and the autoLockSeconds warning fires. Cleared by **chunk 2**, which
  makes `NpcHabits.fill_screen_habit!`/`expand!` fill `habits.screen`.

### Sync size

No growth. NPC records are not stored in player_state, so the `player_state` transform is a no-op and
nothing a sync writes or reads changes. The scenario transform renames keys inside NPC records in
`scenario_data` only, once per game at load.

### Files touched

`scripts/scenario-schema.json`, `lib/break_escape/format_upgrade.rb`, `scripts/validate_scenario.rb`,
`test/unit/format_upgrade_test.rb`, `test/js/validator-retired-keys.test.mjs`,
`test/controllers/break_escape/format_8c_deployed_noop_test.rb`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

### Handover

- **Done:** chunk 1 as specified. `FormatUpgrade.current` is 3; the three named chunk-1 test files pass
  alone.
- **For chunk 2 (Ruby runtime readers):** `NpcHabits.fill_screen_habit!`/`expand!`, `AccessIdentities`,
  `OwnerClaim`, `AccessWork.usb_habit`/`work.usb`, `NpcFrustration`, and the `Game` ship filter still
  read the old names. Making the loader fill `habits.screen` clears the `validator-npc-habits` line-240
  failure (chunk 1's `npc_screen_habits` already reads the folded path).
- **For chunk 4:** `validator-strict-keys.test.mjs` needs its habit schema paths moved to
  `habits.screen`/`.print`/`.usb` and its `screenHabit` slip case treated as a retired key.
- **For chunk 5:** rewrite the three authored-habit templates and freeze the `format_8c` fixtures; the
  9 + 10 corpus-test failures and the three scenarios' retired-key errors clear then.

## Step 8c chunk 3 — JS readers and node reader tests (2026-11-13)

Branch `build/hard-8c` on chunk 1's tip (`6943c3b47`). Chunk 3 moves the engine JS habit readers to the
folded paths and migrates the four node test files that carry habit fixtures. No new static import, so
no test-harness copy list changes.

### What changed

- **`public/break_escape/js/systems/workstation-state.js`.** `habitOf()` now reads
  `npc?.habits?.screen` (was `npc?.screenHabit`). Precedence is untouched: the PC's own field still beats
  the owner's habit, the order is unchanged. The three doc comments that named `screenHabit` as the data
  key now say `habits.screen`.
- **`public/break_escape/js/systems/npc-needs.js`.** The two print-errand readers (the `print` command at
  :968 and the `revealOutput` hook path at :3350) now read `rec.habits?.print` (was `rec.printHabit`),
  inlined so no local variable carries the retired substring. `work.usb` is read via `this._plan(s)?.usb`
  (the work plan the ship filter builds from `habits.usb`) and is unchanged, as specified. The three
  comments naming `printHabit` as the data key now say `habits.print`.
- Engine-wide grep of `public/break_escape/js` for `screenHabit`/`printHabit`/`usbHabit`: clean (no reads,
  no comments).

### Tests

All run with `bin/test-js` (plain node), `RBENV_VERSION=2.7.8` for the ruby-shelling validator sub-tests.

- `workstation-state.test.mjs` (JS reader only): **PASS.** `habitOf`/`rig16` fixtures folded to
  `habits.screen`; `decideLocked` takes the habit as a direct arg and was untouched.
- `npc-print-forget.test.mjs`: **PASS.** The print-mechanic rig fixture folded (`tom.habits.print`); the
  validator sub-test folded and its two `printHabit` assertion regexes moved to `habits\.print`.
- `npc-printer-power.test.mjs`: **PASS.** Rig fixture and the three validator `printHabit: {}` fixtures
  folded; its assertions key on `revealOutput`/room wording, unchanged.
- `npc-office-visuals.test.mjs`: **PASS.** This file is validator-only for habits: npc fixtures folded to
  `habits.screen`, the issue filter regex moved to `habits\.screen`, and the four message-substring
  assertions moved to the folded wording (`NPC 'x' habits.screen never applies`,
  `habits.screen.lockChance`, `habits.screen but the NPC owns no workstation`).
- Importers sweep: ran every `test/js` file importing `npc-needs.js` or `workstation-state.js` (45 files,
  fixtures excluded). **43 pass, 2 fail** — `npc-needs-slots.test.mjs` and `npc-left-behind.test.mjs`,
  both only in their `validator: test_needs_sims has no errors` subtest. These are the live-template
  retired-key errors chunk 1 introduced in `validate_scenario.rb` (the un-rewritten `test_needs_sims`
  still authors 2 `screenHabit` + 1 `printHabit`), independent of chunk 3; cleared by **chunk 5**. Every
  other test/js file that still names a habit key is chunk-4-owned (`validator-*`) or chunk-1's
  `validator-retired-keys`; no reader-side test outside my four names a habit key.

### Cross-chunk note (important)

The validator sub-tests inside `npc-office-visuals`, `npc-print-forget` and `npc-printer-power` shell to
`scripts/validate_npc_needs.rb`, which **chunk 4 owns and had already folded in the working tree** (reads
`npc['habits']['screen']` / `habits.print`, messages say `habits.screen` / `habits.print`). My assertions
are aligned to that folded wording. These sub-tests pass only once chunk 4's `validate_npc_needs.rb` fold
is committed; against chunk 1's committed validator they would fail with retired-key errors. If chunk 4
settles on different message wording, these three files' assertions must be re-checked (chunk 7 sweep).

### Sync size

No change. Chunk 3 only reads NPC records on the client; nothing is written to or read from player_state.

### Files touched

`public/break_escape/js/systems/workstation-state.js`, `public/break_escape/js/systems/npc-needs.js`,
`test/js/workstation-state.test.mjs`, `test/js/npc-office-visuals.test.mjs`,
`test/js/npc-print-forget.test.mjs`, `test/js/npc-printer-power.test.mjs`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

### Expected failures left for later chunks

- `npc-needs-slots.test.mjs`, `npc-left-behind.test.mjs` (the `test_needs_sims` validator subtest only):
  cleared by **chunk 5** (template rewrite).
- The three validator sub-tests in my files depend on **chunk 4**'s `validate_npc_needs.rb` fold being
  committed (see cross-chunk note).

## Step 8c chunk 4 — the Ruby validators, verify-run, the leak scanner, and their node tests (2026-11-13)

Branch `build/hard-8c` (tip `6c6483a74` at start: chunk 1 and chunk 3 committed; chunk 2's Ruby runtime
readers, the ship filter and its tests are present in the tree, uncommitted). Chunk 4 of the seven-chunk
split: the three validator derivers, `verify-run.rb`, the leak scanner, and the six node tests the plan
assigns. No runtime reader, schema, template or `validate_scenario.rb` edit (owned by other chunks).

### What changed

- **`scripts/validate_npc_habits.rb`.** `effective_lock` reads the owner's `habits.screen`
  (`owner.dig('habits', 'screen')`, was top-level `screenHabit`). The effective-rule printout source
  labels and the author-facing warnings now name `habits.screen`: the `:authored_screen_habit` conflict
  warning, `habit_source`, the default-rule label, and `screen_effects` (`habit not applied: the NPC
  sets habits.screen`, `habits.screen lockChance ...`).
- **`scripts/validate_npc_needs.rb`.** The print-habit check reads `npc.dig('habits', 'print')` and all
  its error/warning text names `habits.print`. The screen-habit/autoLockSeconds check reads
  `habits.screen` (presence via `npc['habits'].key?('screen')`, value via `dig`, and the owner fallback
  `dig('habits', 'screen')`); the `screen_habits:` keyword doc comment follows.
- **`scripts/validate_access_work.rb`.** `usbHabit` left `A_ONLY_FIELDS` (the whole `habits` block is
  not an A-only field); a separate check flags `habits.usb` on a non-room NPC record. `check_usb_habit`
  reads `npc.dig('habits', 'usb')` and its messages name `habits.usb`; `check_usb_give_order`/
  `check_usb_ko_route` read `npc.dig('habits', 'usb', 'setGlobal')`; the `usb_refusal_beats?` walk skip
  list is `%w[globalVariables usb]` (so the habit's own declaration is not read as a beat; policy `usb`
  string values are harmless to skip and the `setGlobal` string is already guarded). The careful-guest
  warnings now teach `"habits": { "screen": { "lockChance": 0 } }`.
- **`tools/playtest/verify-run.rb`.** The per-NPC habits line reads the screen habit from
  `npc.dig('habits', 'screen')` and is labelled `habits.screen`; `screen`/`print`/`usb` are excluded
  from the `values` key=value dump (they get their own treatment or are server-only), so the awareness
  habit values print unchanged.
- **`tools/playtest/lib/access_leak_scanner.rb`.** Mirrors the chunk-2 ship filter: `WITHHELD_KEYS`
  drops `habits` and `WITHHELD_WORK_KEYS` drops `usbHabit` (both now covered by the habits allow list);
  a new `SHIPPED_HABIT_KEYS = %w[screen print]` and `scan_withheld_keys` flags any `habits` sub-key
  outside that allow list (`npc:<id>/habits.<key>`), so a leaked `locksScreen`/`writesDown`/`password`/
  `passwordPattern`/`holdsDoors`/`usb` is caught. The `withheld_key` description is updated. This touches
  line 145 (`WITHHELD_KEYS`) as well as the re-anchor's cited 147/320, because the re-anchor's citations
  came from grepping the three retired key names and `habits` is not one of them; removing `habits` is
  required for correctness now that `habits.screen`/`.print` ship.

### Tests

Node (single files, `node --test`):
- `validator-strict-keys.test.mjs`: 15 pass, 0 fail (was 3 fail). Folded the NPC fixture's
  `screenHabit`/`printHabit`/`usbHabit` into `habits.screen`/`.print`/`.usb` (each keeping `...c`), moved
  the three slip cases and pointers to `#/rooms/r1/npcs/0/habits/{screen,print,usb}`, and pointed the
  closed-block enumeration at `D.npc.properties.habits.properties.{screen,print,usb}`.
- `validator-npc-habits.test.mjs`: 46 pass, 0 fail (was 4 fail). Folded the authored `screenHabit`
  fixtures into `habits.screen`; the report-line and warning assertions now read `habits.screen`.
- `validator-usb-habit.test.mjs`: 25 pass, 0 fail (was 19 fail). Folded `usbHabit` into `habits.usb`
  throughout; all assertions name `habits.usb`.
- `validator-access-work.test.mjs`: 38 pass, 0 fail (was 1 fail). Folded the borrower's `screenHabit`
  into `habits.screen`.
- `validator-access-model.test.mjs`: 36 pass, 0 fail. Folded jake's `screenHabit`/`printHabit` edits
  into `habits.screen`/`.print`.
- `playtest-verify-run-access.test.mjs`: 15 pass, 0 fail. Folded the three NPCs' `screenHabit` into
  `habits.screen`; the report expectation reads `habits.screen`.

Ruby test of a changed script: `test/unit/access_leak_scanner_test.rb` (chunk 2 owns this file and has
updated it in the tree to expect `npc:omar/habits.password` and `npc:omar/habits.usb`): **43 runs, 258
assertions, 0 failures** against this chunk's scanner — chunk 2 and chunk 4 agree on the allow-list
behaviour.

Assertions changed in meaning: none weakened. Every assertion that named an old top-level habit key now
names the folded path (`habits.screen`/`.print`/`.usb`) and tests the same behaviour; the strict-keys
slip cases still prove the folded sub-blocks are closed and allow `^_`.

### Expected failures left for later chunks

- `test/unit/scenario_schema_test.rb` `test_corpus_has_no_setglobal_map_under_nil` (1 failure): the live
  `test_access_social` template still authors top-level `usbHabit`, whose `setGlobal` the chunk-1 schema
  no longer places, so the walk reaches it "under nil". Cleared by **chunk 5** (template rewrite). Not a
  chunk-4 file.
- The three authored-habit templates (`test_access_social`, `test_access_work`, `test_needs_sims`) still
  validate with retired-key errors until **chunk 5** rewrites them.

### Sync size

No change. These are validator/diagnostic scripts; none reads or writes player_state. The leak scanner
reads captured response bodies only.

### Files touched

`scripts/validate_npc_habits.rb`, `scripts/validate_npc_needs.rb`, `scripts/validate_access_work.rb`,
`tools/playtest/verify-run.rb`, `tools/playtest/lib/access_leak_scanner.rb`,
`test/js/validator-strict-keys.test.mjs`, `test/js/validator-npc-habits.test.mjs`,
`test/js/validator-usb-habit.test.mjs`, `test/js/validator-access-work.test.mjs`,
`test/js/validator-access-model.test.mjs`, `test/js/playtest-verify-run-access.test.mjs`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

## Step 8c chunk 2 — Ruby runtime readers and the ship filter (2026-11-13)

Branch `build/hard-8c` on chunk 1's tip (`6943c3b47`). Chunk 2 moves every Ruby runtime habit
reader to the folded paths and turns the NPC `habits` filter into an allow list. No schema,
transform, validator-script or JS edit here (chunks 1, 3, 4). Ran with `RBENV_VERSION=2.7.8`.

### What changed

- **`lib/break_escape/npc_habits.rb`.** `fill_screen_habit!` reads and writes `npc['habits']['screen']`
  (was the top-level `screenHabit`): the authored-habit guard is `habits.key?('screen')` and the fill
  is `(npc['habits'] ||= {})['screen'] = { 'lockChance' => chance }`. `expand!` now carries the folded
  office-life sub-blocks (`FOLDED = screen print usb`) across the awareness expansion so the write-back
  (`npc['habits'] = plan[:habits].merge(folded)`) never drops an authored `habits.screen`/`.print`/`.usb`.
  `expanded` gained a guard: a `habits` block holding only folded keys (no non-folded awareness key) and
  no level expands to nothing, so a bare authored `habits.screen` leaves the NPC untouched and out of the
  report, exactly as a bare top-level `screenHabit` did before the fold (an invalid-only awareness block
  still resolves to `{}` as before, so `format_upgrade_test`/`npc_habits_test` passwordPattern cases hold).
- **`lib/break_escape/access_identities.rb`.** `screen_always_locks?` reads `owner['habits']['screen']`.
- **`lib/break_escape/owner_claim.rb`.** the owner-claim print source and `prints?` read
  `owner['habits']['print']`; `open_without_estimate?` reads `owner['habits']['screen']`.
- **`lib/break_escape/access_work.rb`.** `usb_habit` reads `npc['habits']['usb']`; the `work.usb` build
  and `NpcFrustration` (through `AccessWork.usb_habit`) follow unchanged.
- **`app/models/break_escape/game.rb`.** the filter is now an allow list. `WITHHELD_NPC_KEYS` loses
  `habits`; `WITHHELD_WORK_NPC_KEYS` loses `usbHabit`; a new `SHIPPED_HABIT_KEYS = %w[screen print]`.
  `withhold_npc_secrets!` keeps only `habits.slice('screen','print')` and deletes the rest of `habits`
  (`locksScreen`, `writesDown`, `password`, `passwordPattern`, `holdsDoors`, `usb`, any later key); a
  `habits` block that ends up empty, or is not a Hash, is deleted whole, as the old deny-list delete did.
  `work.usb` is still built from `habits.usb` (`compile_npc_plan!` runs before the filter). The
  `npc_habit`/`written_down?` reads (`habits.writesDown`, unchanged by the fold) and the precedence
  comment beside `pc_always_locks?` are left reading the `habits` block.
- Comments naming the retired keys (npc_frustration.rb:276, the readers above, test support) updated to
  the folded names. Grep of `app/`/`lib/` for `screenHabit`/`printHabit`/`usbHabit` now leaves only
  `lib/break_escape/format_upgrade.rb` (chunk 1's retired list and fold transform).

### Tests

All 14 assigned Rails/unit files migrated to the folded fixtures and run together:
**296 runs, 2664 assertions, 0 failures.** Notable additions:

- `access_model_withholding_test.rb`: the two filter tests now assert a shipped `habits` holds only
  `screen` and `print`; a block of only server-only habits (dana's `password`) is dropped whole; a moved
  NPC keeps its shipped `habits.screen`; the bootstrap JSON carries no `locksScreen`/`writesDown`/
  `holdsDoors`/`passwordPattern`.
- `usb_habit_test.rb`: a new what-ships test (the brief's requirement) — a room NPC carrying every
  `habits` key arrives in the room payload with `habits` holding exactly `screen` and `print`,
  `writesDown`/`password`/`holdsDoors`/`usb` absent, and `work.usb` still built from the usb habit; the
  bootstrap carries no server-only habit key.
- `access_leak_scanner_test.rb`: migrated to the scanner's per-subkey reporting (`npc:omar/habits.password`,
  `npc:omar/habits.usb`) and `habits.usb` stick fixtures. The scanner itself
  (`tools/playtest/lib/access_leak_scanner.rb`) is **chunk 4's** and was already folded in the shared
  working tree; the chunk-2 test is aligned to that folded scanner (`SHIPPED_HABIT_KEYS = screen print`).

### Expected failures and cross-chunk notes

- **`test/unit/format_upgrade_test.rb:252` (chunk 1's file) now fails.** Its test "step 8c folds a
  loader-filled screenHabit on prepared data, unchanged" asserts `expand!` fills a top-level
  `screenHabit` for the transform to fold. After chunk 2 the loader fills `habits.screen` directly, so
  there is no top-level key and the fold is a no-op. The test must be updated to assert the loader fills
  `habits.screen` and the transform leaves it. **I did not edit it** (not a chunk-2 file); chunk 1 or the
  integrator should update it.
- `validator-npc-habits.test.mjs` line 240 (chunk 1's listed expected failure): the loader now fills
  `habits.screen`, which `npc_screen_habits` already reads, so this clears once chunk 4 owns that test;
  that file is chunk 4's, untouched here.
- The leak-scanner alignment assumes chunk 4's folded `access_leak_scanner.rb` lands; against chunk 1's
  committed tree the scanner is already folded in the working copy.

### Sync size

No growth. NPC records are not in player_state; the filter only prunes keys from room/bootstrap payloads
(the shipped `habits` shrinks to at most `screen` and `print`), so each sync sends no more than before.

### Files touched (chunk 2)

`lib/break_escape/npc_habits.rb`, `access_identities.rb`, `owner_claim.rb`, `access_work.rb`;
`app/models/break_escape/npc_frustration.rb`, `game.rb`; `test/support/access_model_scenario.rb`;
`test/unit/npc_habits_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`,
`test/unit/access_identities_screen_test.rb`, `test/unit/pc_screen_lock_precedence_test.rb`,
`test/unit/owner_claim_test.rb`, `test/controllers/break_escape/owner_claim_enforce_test.rb`,
`test/controllers/break_escape/npc_frustration_test.rb`, `npc_lockout_l_test.rb`,
`npc_workaround_h_test.rb`, `test/models/break_escape/access_model_withholding_test.rb`,
`test/unit/access_leak_scanner_test.rb`, `test/models/break_escape/lab_physical_pentest_secrets_test.rb`,
`test/controllers/break_escape/usb_habit_test.rb`, `test/unit/access_work_usb_habit_test.rb`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

## Step 8c chunk 5 — template rewrite, README, corpus equivalence, reader parity (2026-11-13)

Branch `build/hard-8c` on the chunk 1-4 tip (`21fff798c`). Chunk 5 rewrites the three authored-habit
templates, updates the author-facing docs, freezes the `format_8c` fixtures, and adds the corpus
equivalence, reader parity and stored-game equivalence tests. The old side for equivalence and parity
is the step-8b tip `ab14d1926` (format 2). No runtime reader, schema, validator-script or
`validate_scenario.rb` edit (owned by earlier chunks).

### What changed

- **`tools/format/rewrite_templates.rb`.** Added a `--step 3` path (`rewrite_scenario_8c`). For each
  NPC with a top-level `screenHabit`/`printHabit`/`usbHabit`, it wraps the key's value verbatim in a
  fresh `habits` block (`screen`/`print`/`usb`), preserving inline-vs-multiline source style, and
  edits bottom-up. The real `STEP_8C` transform is the oracle: it refuses to write unless the
  rewritten template, rendered, equals `transform_8c(old render)` and carries no retired key (so an
  NPC that already held a `habits` block, which would collide, is refused for a hand edit — none in
  the corpus).
- **Templates.** `tools/format/rewrite_templates.rb --step 3` rewrote `test_access_social`
  (5 `screenHabit` + 1 `usbHabit`), `test_access_work` (3 `screenHabit`) and `test_needs_sims`
  (2 `screenHabit` + 1 `printHabit`), matching the re-anchor's per-scenario counts. By hand, the two
  `_comment` author notes in `test_needs_sims` and the two `<%# %>` comments in
  `lab_physical_pentest` that named `screenHabit` were reworded to `habits.screen`, so no template
  teaches a retired name. `test_access_habits` authors none; it is re-validated only.
- **`README_scenario_design.md`.** The habit teaching moved to `habits.screen`/`.print`/`.usb` (the
  closed-blocks list; "The owner's habit"; the careful-guest rule; the USB-habit field and its
  server-only note). In the same commit the leftover step-8a `downIf` wording was cleared: every
  `downIf` (13 occurrences, networks and resources) now reads `offWhen`, the network-outage table row
  and error wording were generalised to the requireGlobal form (`offWhen` accepts a name or a
  `{ name: value }` object), and the station outage line now reads `offWhen` not `affordance.offWhen`.
- **Fixtures.** `test/fixtures/format_8c/`: `<scenario>.old.json` (format-2 render) and `.new.json`
  (format-3 render) for the three rewritten templates plus `test_access_habits`;
  `test_access_habits.old.loaded.json`, `lab_physical_pentest.old.loaded.json` and
  `priya_awareness.old.loaded.json` (format-2 loader output, `NpcHabits.expand!` on `ab14d1926`, a
  top-level `screenHabit` filled). Captured on a detached base worktree at `ab14d1926`, removed after.

### Moved keys per scenario (matching the re-anchor)

- test_access_social: 5 `screenHabit` -> `habits.screen`, 1 `usbHabit` -> `habits.usb`.
- test_access_work: 3 `screenHabit` -> `habits.screen`.
- test_needs_sims: 2 `screenHabit` -> `habits.screen`, 1 `printHabit` -> `habits.print`.
- test_access_habits, lab_physical_pentest: no template move (loader-filled habit only; stored-game change).

### Tests

- `test/unit/format_8c_corpus_test.rb` (new): **23 runs, 813 assertions, 0 failures.** Corpus
  equivalence (`transform(old) == new`, notes stripped; no-op on new; `retired_keys_in(new)` empty);
  prepare agrees across the fold; the edit-proof live guard (no retired key, and no author note names
  one); Ruby reader parity on the effective screen-lock rule for every workstation and every NPC that
  could borrow it (old `screen_always_locks?` reading `screenHabit` vs the live reader reading
  `habits.screen`); the five named precedence fixtures (priya_pc, omar_pc, rosa_pc, ian_pc, jake_pc);
  and the stored-game equivalence for test_access_habits and lab_physical_pentest (a format-2 loader
  game, folded, equals a fresh format-3 game field for field and per-workstation lock rule). Proved to
  bite: prefixing a folded value in a fixture turns it red (4 failures), restored.
- `test/js/format-8c-reader-parity.test.mjs` (new): **PASS.** Loads the old `habitOf`/`decideLocked`
  from `ab14d1926` with `git show` and the live ones; the effective lock rule (decideLocked over a
  spread of trip lengths, roll null so deterministic) matches old-on-old vs new-on-new for every
  workstation and borrower across the rewritten scenarios; the five named fixtures asserted directly
  (test_access_habits via the loaded fixture and a JS fold); the edit-proof live guard. Proved to
  bite, restored.
- `test/unit/format_upgrade_test.rb:252` fixed: the "folds a loader-filled screenHabit on prepared
  data" test now starts from the frozen `priya_awareness.old.loaded.json` (format-2 loader output,
  top-level `screenHabit`), folds it, and asserts the result equals the current loader's format-3
  fill field for field. **22 runs, 114 assertions, 0 failures.**
- Expected failures chunks 1-4 left for chunk 5, all cleared:
  - `format_8a_corpus_test.rb` and `format_8b_corpus_test.rb`: the frozen format-1/2 renders
    legitimately still carry habit keys (retired by the later step 8c), so each test's retired-key
    assertion was scoped to its own step version (`version <= 1` / `<= 2`); the live-template guards
    pass unchanged now the templates no longer author habits. **50 runs, 0 failures.**
  - `scenario_schema_test.rb` `test_corpus_has_no_setglobal_map_under_nil`: the folded `usbHabit`
    now sits at `habits.usb`, which the schema places. **0 failures.**
  - `npc-needs-slots.test.mjs`, `npc-left-behind.test.mjs` (`test_needs_sims` validator subtest), and
    the validator subtests in `npc-office-visuals`/`npc-print-forget`/`npc-printer-power`: **5 files
    PASS** (templates validate clean; chunk 4's `validate_npc_needs.rb` fold is committed).
  - The three authored templates plus lab_physical_pentest and test_access_habits validate with
    **0 errors** (`--no-graph`); no dungeon_graph side effects.

### Sync size

No change. The templates only move NPC-record keys inside `scenario_data`; NPC records are not stored
in player_state, so the player_state transform is a no-op and no sync payload changes.

### Files touched (chunk 5)

`tools/format/rewrite_templates.rb`, `scenarios/test_access_social/scenario.json.erb`,
`scenarios/test_access_work/scenario.json.erb`, `scenarios/test_needs_sims/scenario.json.erb`,
`scenarios/lab_physical_pentest/scenario.json.erb`, `README_scenario_design.md`,
`test/unit/format_upgrade_test.rb`, `test/unit/format_8a_corpus_test.rb`,
`test/unit/format_8b_corpus_test.rb`, `test/unit/format_8c_corpus_test.rb`,
`test/js/format-8c-reader-parity.test.mjs`, `test/fixtures/format_8c/*`,
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

### For chunks 6 and 7

- Chunk 6 (live proofs): the detached base worktree pattern worked (`git worktree add --detach
  <path> ab14d1926`), but `bin/rails` there hit a bundler "GemNotFound" despite an identical
  `Gemfile.lock`; the format-2 loader output was captured with a standalone `ruby3.2` script requiring
  the libs directly (`NpcHabits.expand!`), no Rails. Chunk 6 needs a full server, so it may need the
  existing `p-hard-8b` worktree's bundle or a `bundle install` on its base.
- Stale author-facing docs still name the retired habit keys but were OUT of the build-plan's file
  list, so left for a later sweep (flag to the orchestrator): per-scenario `PLAYTEST.md` and
  `README.md` in test_access_habits/test_access_work/test_access_social/test_needs_sims/
  lab_physical_pentest, `test_access_habits/mission.json` (`test_objective`), and the `usbHabit.setGlobal`
  mention in `scenarios/test_access_social/ink/kim.ink`. None ships or is schema-validated.
- Chunk 7 full-suite sweep: grep the tree for `screenHabit`/`printHabit`/`usbHabit`; legitimate hits
  are comments, the schema's "was screenHabit" notes, the retired list, the frozen format_8a/8b/8c
  fixtures, and the docs listed above.
