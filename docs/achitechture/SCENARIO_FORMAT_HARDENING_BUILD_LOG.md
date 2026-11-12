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

## Handover

### Step 2b (build/harden-2b) handover

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
