Counts: 0 blockers, 0 majors, 7 minors, 5 nits.

# Scenario format hardening, step 1: code review round 1

Branch `build/harden-step1` at 41d298da1, reviewed as `git diff main...build/harden-step1` (merge base f2d53bb40). Plan: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`, step 1. Build log: `docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`.

The step does what the plan asks. Every section I broke on a copy of m01 exits 1, a crashing check no longer hides the checks after it, a `could not run` line cannot be listed, and stale entries fail only when their stage ran. The findings below are edges where a `❌` can still be miscounted or where the list's sign-off rests on process rather than a test.

## What I ran

### Mutations (one injected error per section)

m01_first_contact rendered to plain JSON and copied to a scratch folder, then one mutation per run, ink on, `--no-graph`, the default list. Every run below exited 1 with the injected line printed and a `Result:` line; the unmutated copy exited 0 with `Result: 0 errors (0 known), 12 warnings`.

| Section | Mutation | Result |
|---|---|---|
| directory | `mission.json` deleted | exit 1, 1 error |
| structure | `rooms` an array | exit 1; schema line plus the wiring and common checks still print (15 errors) |
| structure | `rooms` a string | exit 1; `could not run` for each check that raised, no stack trace (14 errors) |
| ink | `storyPath` to a missing file | exit 1 |
| ink | `storyPath` to an ink file that fails to compile | exit 1, `⏭️ ... failed to compile` printed |
| wiring | `npc_conversation` task naming no NPC | exit 1 |
| wiring | mission.json `scoring: "bogus"`, `endingCheck: "yes"` | exit 1 (each printed twice, nit n1) |
| schema | room `type` not in the enum | exit 1 |
| schema plus common | the two together | exit 1, both print, 2 errors |
| common | PIN length mismatch | exit 1 |
| social | duplicate object id; unknown key under `social` | exit 1 each |
| habits | `awareness: "bogus"` | exit 1 |
| work | `workarounds: [{bogus: 1}]` | exit 1 |
| ERB | template that raises | exit 1, `ERB render could not run` |

Crashes, injected with a Ruby prelude that redefines one method to raise: `check_lock_credentials`, `check_common_issues`, `validate_json`, `ValidateSocial.check`, `ValidateNpcHabits.report_lines` and `check_ink_files` each printed `could not run`, and the PIN mismatch from a later check still printed (2 errors, exit 1). `format_schema_error`, `ValidateSocial.split_schema_errors` and `print_issue_list` are outside the per-check rescues: each printed only `validator could not run` and hid the rest, still exit 1 (minor m7).

### Known-failures list

- A list entry aimed at `could not run` is ignored by the validator and rejected by the list test (both covered by the new tests, and confirmed above).
- lab_exploitation with its first entry's count raised to 14: `stale known failure ... now matches 13 of 14`, exit 1. The same list with `--skip-ink`: `1 known failure(s) not checked (ink skipped)`, exit 0. Count lowered to 12: `13 errors (12 known)`, exit 1.
- Five entries checked against the printed lines: lab_feeling_blu ink `contains '//'` (10 of 10), ceo_exfil ink `in itemsHeld. Add {` (4 of 4) and common `targetKnot` (10 of 10), lab_malware_metasploit ink and common (1 and 1), crypto2_rsa_asymmetric common `keyPins` (2 of 2), basic_mission schema (4 of 4, but see m4). Every listed line carries `(known: <owner>, since 2026-11-12)`.
- `MERGE_BATCH=1 node test/js/validator-known-failures.test.mjs`: 10 pass (no `reviewBy` has passed yet).

### Corpus and CI

- All 177 `scenarios/*/scenario.json.erb`, ink on, `--no-graph`, default list: every one exits 0. Totals over the `Result:` lines: 81 errors, 81 known, matching the build log. 13 scenarios print a `❌`, all known. No `could not run` line anywhere. m01 to m10 each print 0 `❌`. `git status` clean afterwards.
- CI social job replayed under the project Ruby (2.7.8, `bundle exec`): the lister finds sf_broken, sf_clean, sf_edges and sf_sprite among the fixtures and 84 corpus scenarios; all 84 exit 0 with `--strict-social --no-graph --skip-ink`. sf_clean exits 0 and sf_broken exits 1 with its `--strict-social` count line.
- Merge-batch validator rule: it now reads as "the validator exits 0", and the corpus run shows that holds for every test scenario.

### Tests

70 node files run without the lock: every `test/js/*.test.mjs` that names the validator, the schema, the minigame schemas, the social validator, sf_clean or the list, plus `table-item-overlap-grouping`. 70 pass, including `validator-exit-code` (21 of 21) and `validator-known-failures` (10 of 10).

## Judgement of the builder's content fixes

- **Keys gained `opens_lock` in five layout scenarios.** Right. `Game#has_key_in_inventory?` (`app/models/break_escape/game.rb:213`) and the client (`inventory.js:506`, `objectives-manager.js:24`) match a key by `opens_lock` or id; these keys had neither, so no door in those scenarios could be opened by its key. Every key's `keyPins` equals its lock's `keyPins` (checked pair by pair in all five), and each key sits in a room reachable before its lock. test_behind_wall_fade's wall key opens nothing, so `keyPins` alone is right there.
- **`ble` in both `lockType` enums.** Right. The client handles it (`unlock-system.js:1006`, the BLE scanner minigame filters on `lockType === 'ble'`), and the server has it in the lock-type table (`game.rb:2691`) and in both unlock paths (`game.rb:2851`, `2956`, trusted client, as for `bluetooth` and `biometric`).
- **`ble_scanner.png`.** A byte copy of `bluetooth_scanner.png` (`cmp` identical, 11 by 22 pixel art). Acceptable: `unlock-system.js` checks for an item of type `ble_scanner`, so the start item cannot simply change type, and the validator's sprite check wants `assets/objects/<type>.png`. The two files can drift, which is harmless.
- **test-blockchain-explorer tasks to `custom`.** Right for step 1. Nothing reads `set_global` or `targetGlobal`; the objectives manager only unlocks aims on a global (`objectives-manager.js:818`) and never completes a task from one, and the blockchain minigame has no completion actions. Removing the tasks would leave the demo with an empty aim. The tasks never completed before and still do not (nit n4).
- **npc-sprite-test2, test-rfid-multiprotocol, test_table_items, `room_test_desk_seating`.** All fine: the shared `scenarios/ink/helper-npc.ink` gives a phone and a keycard (lines 163, 169), `hacker.png` and `hacker-red.png` exist, and `room_test_desk_seating.json` exists.

## Minors

### m1. A `❌` anywhere in printed content counts as an error

`scripts/validator_report.rb:195` counts any line that includes `❌`. Three places print author content through the report: the `-o` JSON dump (`scripts/validate_scenario.rb:6989`), the `-v` JSON dump after a schema failure (`7164`) and the dialogue lint's quoted ink text (`5557`).

Failure: a notes object whose `text` is `"❌ door left open"` validates with exit 0, and with `-o` exits 1 with `Result: 1 errors`; the counted "error" is the JSON line `"text": "❌ door left open"`. An ink line that quotes the emoji does the same in the dialogue lint. No corpus scenario holds one today.

Fix: give `ValidatorReport` a raw writer (as `header` does) and send the two JSON dumps and the lint's per-finding lines through it; or count only lines whose text, after indentation and an optional list number, starts with `❌`, which is what plan item 5 says.

### m2. A dungeon graph abort prints `❌` and the run exits 0

`scripts/validate_scenario.rb:7231`. The graph generator's `abort("❌ ERROR: no hidden id is free of the Wi-Fi key ...")` (`scripts/generate_dungeon_graph.rb:606`) exits 1 and writes to stderr, which the report never sees; the validator then prints `⚠️ Dungeon graph generation failed (non-fatal)` and exits 0. Only status 3 is turned into a `❌` line.

Failure: a scenario with a one or two character Wi-Fi key, validated without `--no-graph` (the authoring default), shows a `❌ ERROR` on the terminal and exits 0. Pre-existing behaviour, but it is now the one `❌` that does not fail the run.

Fix: treat any non-zero graph exit as `❌ ERROR: dungeon graph could not run (exit <n>)`, or capture the generator's stderr with Open3 and print it through the report.

### m3. An ink compile failure can be listed, and then every ink entry for that scenario goes unchecked

`scripts/validator_report.rb:20` and `test/js/validator-known-failures.test.mjs:45`. A compile failure marks the whole ink stage as not run in full (`validate_scenario.rb:7036`), yet its line (`fails to compile`, `produced invalid JSON` and the rest of `INK_COMPILE_FAILURE_RE`, `6818`) is matchable.

Failure: an entry `{ stage: "ink", match: "fails to compile", count: 1 }` passes the list test. The run then exits 0, the checks that read that file's compiled JSON never run, and every other ink entry for the scenario is reported as "not checked", so a fixed or grown ink line can no longer go stale.

Fix: in `match_entry`, return nil for a line matching `INK_COMPILE_FAILURE_RE` (as for `could not run`), and in the list test reject a `match` that matches the same expression.

### m4. Two entries use a match that covers any schema line

`scripts/validator_known_failures.json:159` and `:170`: basic_mission and vm_free_mission use `"match": "ERROR: schema: #/"`, which every schema line in those scenarios holds. The list test only rejects a match that is part of `❌ ERROR: `.

Failure: someone fixes `scenario_brief` in basic_mission and in the same change breaks an unrelated schema field. The count stays 4, the run exits 0, and the new break is hidden. The plan allows swaps within "one class of line"; here the class is the whole schema stage.

Fix: split each into entries per class (`required property of 'scenario_brief'`, `#/flags: of type array`, `(room 'start'): did not contain a required property`, count 1, 1 and 2), and have the list test reject a `match` that, once `❌ ERROR: `, `schema: #/` and `SOCIAL: ` are removed, has fewer than eight characters left.

### m5. The sign-offs are written by the builder and nothing tells signed from unsigned

`docs/agents/VALIDATOR_DECISIONS.md:14` and each of the 16 sections: every one says "Status: awaiting orchestrator sign-off", and the list test passes, with or without `MERGE_BATCH=1`, because it reads only the heading and the `json` block.

Failure: an entry, or a raised count, is added in a branch with its own heading and block. The branch diff shows it, but if the batch notes miss it, main moves with an entry nobody approved, and the decisions file says "awaiting" for ever. The same is true of today's 16.

Fix: under `MERGE_BATCH=1`, fail any section whose prose holds `awaiting orchestrator sign-off`, so the batch that merges an entry has to sign it; or the orchestrator rewrites the 16 status lines in the merge commit for this branch. Either way, check the 16 dates and owners with the labs and escape-room owners and the user (q86) first.

### m6. `MERGE_BATCH=1` is set nowhere outside the plan

`AGENTS.md:186` says each merge batch diffs the list and needs dated sign-offs, but not that the node suite runs with `MERGE_BATCH=1`. The only readers are `test/js/validator-known-failures.test.mjs:82` and the plan.

Failure: on 2026-12-11 the `reviewBy` dates pass, the test prints a warning nobody reads, and the forced decision the plan describes never happens.

Fix: add "run `bin/test-js` with `MERGE_BATCH=1`" to the AGENTS.md line and to the merge-batch recipe in the orchestrator's common brief.

### m7. The reporting glue has no rescue of its own

`scripts/validate_scenario.rb:7146-7147` (`ValidateSocial.split_schema_errors`, `format_schema_error`), `7177` (the common and social list), `7239` (`ValidateSocial.errors`) and the `print_issue_list` calls.

Failure: with any of these raising (shown by redefining each to raise), the output stops at `❌ ERROR: validator could not run: RuntimeError: boom`, every stage is marked not run, and the common, habits and work findings never print. The exit code stays 1, so nothing passes that should fail; this is the "one crash hides the rest" case the plan's item 4 set out to remove, in the schema and social reporting.

Fix: wrap the schema formatting in `report.run_check('schema', 'schema report')` (fallback: the raw messages), and the `--strict-social` count line in `run_check('social', ...)`.

## Nits

### n1. One mission.json fault prints two errors

`scripts/validate_scenario.rb:262-263` (the directory check) and `7058-7059` (the wiring check) both call `check_mission_scoring` and `check_mission_result`. A bad `scoring` or `endingCheck` prints twice and counts as 2 errors; an entry for it would need `count: 2`. Pre-existing duplication, now counted. Fix: drop the two calls from the directory check, as the wiring check makes the same calls with the rendered data.

### n2. Parallel validator runs race on compiled ink

`scripts/validate_scenario.rb:1035` compiles each ink file with `-o` into the repository's own ink folder. In this review's parallel mutation runs, one run read m01's `m01_npc_sarah.json` while another was writing it and printed `compiled ink file produced invalid JSON` (exit 1). Pre-existing, but a merge batch that validates scenarios in parallel can hit it, and shared files such as `scenarios/ink/helper-npc.ink` make it likelier. Fix: compile to a temp file and rename it into place, or run the batch serially.

### n3. Shared-heading labels use the index after the filter

`test/js/validator-known-failures.test.mjs:59-60`: `entries.filter(...).map((e, i) => ...)` numbers entries after dropping those with no `approved`, so the label can name the wrong entry. Fix: map with the original index, then filter.

### n4. test-blockchain-explorer's open item is only in the build log

`scenarios/test-blockchain-explorer/scenario.json.erb:19` and `:25`: the two `custom` tasks never complete in play. The build log's "Open" list says so; `docs/IDEAS_BACKLOG.md` does not. Fix: add a backlog line (complete a task from a global, or give the blockchain minigame completion actions).

### n5. `reviewBy` before `added` is accepted

`test/js/validator-known-failures.test.mjs:52`. An entry with `added: 2026-11-12` and `reviewBy: 2026-11-01` passes as well formed (and only warns). Fix: reject `reviewBy < added`.
