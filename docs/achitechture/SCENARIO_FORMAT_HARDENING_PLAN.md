# Scenario format hardening plan

Status: **Draft**. Date: 2026-11-12. Written on `build/schema-review`. Code references are to main at 13a0f9f96 unless they say otherwise. The validator triage in section 3 ran on main at 72e26f911 (build/readme-93b merged), and the door, binding and seeds facts were rechecked there.

Sources: `docs/achitechture/SCENARIO_FORMAT_REVIEW_STRUCTURE.md` and `docs/achitechture/SCENARIO_FORMAT_REVIEW_ACCESS.md`. Every claim the plan builds on was checked in the code; where a source review was wrong or incomplete, this plan says what the code does.

## 1. What this plan does

It hardens the scenario JSON format without changing any scenario's design. Six steps, in order of value for cost, plus one candidate that waits for the user:

| # | Step | Touches | Scenario edits | Size |
|---|---|---|---|---|
| 1 | Validator exit code matches its output, with a known-failures list | validator, CI | 41 lines in test scenarios fixed here; other tracks' lines fixed or listed (section 3) | M+ |
| 2 | Strict keys for the access, network and office-life blocks | schema, validator | none expected | S |
| 3 | Secret-leak check, with acknowledged clues | validator, schema | m08 waits for q85; m06 gets one marker | S |
| 3b | Server-held globals (candidate, waits for q85) | schema, model, controller, validator | m08 only | M |
| 4 | Reference and id checks driven by schema annotations | schema, validator | 5 scenarios, as warnings | M |
| 5 | One `ScenarioBinding` in `lib/` for every renderer, and a JSON-safe ERB helper | lib, model, validator, tools | none | S |
| 6a | Secrecy marks in the schema, an all-scenario payload scan and a client-read scan | schema, tests | none | S to M |
| 6b | One client serialiser (only if the 6a scan finds a gap) | lib, model, controller | none | L |

Deferred to a later slice: `formatVersion` and a load-time upgrader. That slice starts only when the user approves a format migration that needs it (q83 or q84). Section 8 records what its design must solve.

Out of scope: the five format migrations that wait for the user's answers (one owner field, one outage field and grammar, habits in one block, closing the core kinds, dropping dead fields). Section 7 sketches each so the user can choose.

## 2. Rules every step follows

- **Cheat policy.** The server hard-enforces secrets, keys and forged items; ink-gated steps and tailgating stay best effort with an NPC sanity check. A secret is any value that, read from the browser, lets a player skip a lock: a PIN, password, combination, cryptex word, flag answer, account password, Wi-Fi key, capture secret or a declared grant's contents. Steps 3 and 6 exist to keep every one of these on the server until it is earned.
- **Sync size rule (q77).** player_state and any per-game record the client re-sends must change by delta or stay bounded. Steps 1 to 6 add nothing to player_state and no new sync traffic. Step 3b, if approved, adds one bounded string per declared server global, sent once as a delta when it is revealed. Each step's section states its effect.
- **Tests.** Every step ships with node tests for validator behaviour (`test/js/validator-*.test.mjs`, the `check_*` function called through `ruby -e`, as `test/js/validator-pin-locks.test.mjs` does) and fixtures, Rails tests for any server change, and a corpus run of the validator over all 176 scenarios with the before and after counts in the build log. Builders run every test file their change touches plus every file that imports a changed module, without the shared lock; the orchestrator runs the full suites once per merge batch.
- **Merge-batch validator rule.** Each merge batch runs the validator (`--no-graph`, ink on) on every test scenario a merged branch touched and needs 0 `❌` before main moves. After step 1 this is the exit code, and the rule becomes "0 unlisted `❌`" (step 1, the known-failures list).
- **Live proof** for every engine change (steps 3b and 6b): a keyless server on the builder's own port, a browser run through the real routes, and `tools/playtest/verify-run.rb` showing progress on the server. Helper tests alone do not count.
- **No new gems or npm packages.** The validator already has `json-schema`; the server needs nothing new.

## 3. Triage

Run on 2026-11-12 over all 176 scenarios on main 72e26f911, with the merge-batch flags: `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph` (ink compiled and checked; the lint is advisory and prints no `❌`).

- **14 scenarios exit 1**: 8 on ink-stage errors (the 6 VM labs below, ceo_exfil, npc-sprite-test2) and 6 on schema errors (section 3.2).
- **105 `❌` lines are printed, in 22 scenarios.**
- **11 more are hidden** today because the ink stage exits before the common issues (`validate_scenario.rb:6786`): ceo_exfil's 10 `targetKnot` lines and lab_malware_metasploit's task line. Running those 8 scenarios with `--skip-ink` shows exactly these 11 and nothing else. With step 1 printing every section, the count is **116 lines**, plus whatever the 6 schema failures hide (unknown until step 1 prints them).
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

**C3 builder: 2 lines.** test_access_social: Kim posts from a phone with no Friendface phone, and object id `sign_f14` is used twice. Both are fixed on `build/c3-replies` (validated from an archive of that branch: 0 `❌`).

**Escape-room track: 24 lines** (the `escape_room` collection, last edited September and October).

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

Total: 41 + 2 + 24 + 49 = 116. 112 true errors, 4 false positives.

Notes on the verdicts:

- **keyPins (43 lines).** The README makes `keyPins` required on key locks and key items (README_scenario_design.md:635, 1244). The client's fallback for a lock with none, `generatePinHeightsForLock` (`public/break_escape/js/systems/key-lock-system.js:169-182`, reached from `assignKeysToLocks` at line 132), declared `const seed` and then ran `seed++`, so it threw "Assignment to constant variable." whenever a held key matched a lock with no `keyPins`. That is fixed on `build/keypin-seed` (a524171df, `let`). Whether a key cut from the generated mapping always fits the lockpicking minigame's own pins is still unproven, so the rule stays an error and the fix is a `keyPins` array on each lock and its key (the same array on both): one line per lock, nothing a player can see.
- **ceo_exfil targetKnot (10).** The validator's rule matches the engine: a phone NPC's saved story state wins over `targetKnot` on reopen (README_scenario_design.md:52). The fix is a design edit: each mapping sets a global, and the ink hub gets a conditional option for it, with a `sendTimedMessage` to tell the player.
- **`#give_item` in the shared helper ink (6).** npc-sprite-test2 and ceo_exfil share `scenarios/ink/helper-npc.ink`. Each scenario fixes its own NPC's `itemsHeld` (or, for ceo_exfil, its owner picks another ink file). Nobody edits the shared ink for one scenario without the other's owner.
- **The lab ink lines (48).** Mechanical: reword a `//` (for example "slash slash" or a URL without the scheme), and attach each `**Heading:**` to a spoken line. They are labs content, so the labs track makes them.
- **lab_malware_metasploit task (1).** `objectives[0].tasks[0]` targets `malware_specialist` and waits for `#complete_task:complete_instruction_task`; neither `instructor.ink` nor `instructor.json` has the tag, so the aim can never complete. The fix is one tag at the end of the instruction knot, or a task type that does not need it.
- **test-rfid-multiprotocol (2).** Only `hacker` and `hacker-red` are loaded (`public/break_escape/js/core/game.js:1446-1451`). Swap the two guards to existing sheets.
- **sis02_energy (3), false positive.** `public/break_escape/js/minigames/log-filter/log-filter-minigame.js:16-18` and 195-197 document and read all three fields; `scripts/minigame-data-schemas.json` (`log_filter_terminal`, line 63) omits them. Add them to its `optional` list.
- **sis01_healthcare (1), false positive.** The object-level `interactionWarning` (`public/break_escape/js/systems/interactions.js:720`) is an object, but the EHR minigame's medication rows have their own string field of the same name, tested only for truth (`public/break_escape/js/minigames/ehr-terminal/ehr-terminal-minigame.js:197`). The validator's walk (`scripts/validate_scenario.rb:2495-2503`) descends into `minigameData`. Stop the walk at `minigameData`.

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

**Why.** `scripts/validate_scenario.rb` exits 1 only for directory, structure, ink-compile, ink-check, schema and graph-key failures (lines 6701-6816, 6965, 7027, 7038). Every other `❌` is printed and the run ends with `exit 0` ("warnings don't cause failure", lines 7051-7053). On a schema or ink failure it exits early, before the common issues, habits report and work report are printed, so an author meets a second wave of errors after fixing the first. Agents are told to count `❌` lines by hand.

**Change.**
1. Fix the 4 false positives and the 37 true errors in this build's test scenarios (section 3.1), and the four schema-failing fixtures this build owns (section 3.2).
2. One label. Every hard finding is `❌ ERROR:`. Today there are `❌ INVALID` (108 sites in validate_scenario.rb), `❌ ERROR` (53 there, 117 in validate_npc_needs.rb) and `❌ SOCIAL` (validate_social.rb). The rename is mechanical and the text after the label stays: social lines become `❌ ERROR: SOCIAL: <text>`, so the existing tests that match `SOCIAL: schema:` keep their match. Tests that match on the old prefix with the `❌` (`❌ INVALID`, `❌ SOCIAL`) are updated in the same commit.
3. Schema errors print as `❌ ERROR: schema: <json pointer>: <message>`, with the opaque schema id removed and, where the pointer reaches a room, object or NPC, its id or name added.
4. Print every section before deciding the exit code. Neither a schema failure nor an ink-check failure exits early; an ink compile failure still skips the checks that need the compiled JSON, and says so.
5. Count by construction: all output goes through one writer that counts lines starting with `❌`, so a module that prints its own lines (habits, work, social) cannot slip past. The run ends with `Result: <n> errors (<k> known), <m> warnings` and exits 1 when an unlisted error remains.
6. Social schema errors become fatal on every run. Today `ValidateSocial.split_schema_errors` (`validate_social.rb:94-97`) moves `#/social` schema errors into the social lints, which fail the run only under `--strict-social`. The corpus has none, so nothing changes today, but the builder states it in the README's validator section.
7. `--strict-social`. The CI social job (`.github/workflows/ci.yml:144`, `--strict-social --no-graph --skip-ink` under `set -euo pipefail`) is **red on main today**: test_access_social exits 1 on the duplicate `sign_f14` (`✗ --strict-social: 1 social lint error(s)`). It goes green once `build/c3-replies` merges. After step 1, `--strict-social` adds nothing and stays accepted, because CI passes it.
8. The known-failures list (below).
9. Update the `validate-scenario` skill wording, the README validator section and AGENTS.md ("count every `❌`") to say the exit code is now the answer, and that a listed failure prints with its owner. Skill wording is proposed to the orchestrator, not edited by the builder.

**The known-failures list.** Step 1 lands before every other track has fixed its lines, so the gap is held in a file the validator reads, never in a build log.
- `scripts/validator_known_failures.json`: an array of entries `{ "scenario", "match", "count", "owner", "added", "reviewBy", "note" }`. `match` is a substring of the `❌` line that does not depend on line numbers (for example `contains '//'`); `count` is how many lines of that scenario it covers, exactly; `added` and `reviewBy` are ISO dates; `owner` names a track or person (labs track, escape-room track, the m08 owner).
- The validator reads it by default (`--known-failures <file>` to point elsewhere, `--no-known-failures` to see the raw result). A matched line still prints, marked `(known: <owner>, since <added>)`, and does not count towards the exit code. An unmatched line counts.
- An entry that no longer matches fails the run: fewer lines than `count` prints `❌ ERROR: stale known failure: <scenario> '<match>' now matches <n> of <count>; update or remove it`, and more lines than `count` counts the extra ones as unlisted. The list can only shrink or change by someone editing it.
- A node test (`test/js/validator-known-failures.test.mjs`) checks the file: every entry has a scenario that exists, a non-empty `match` and `owner`, a positive `count`, valid `added` and `reviewBy` dates with `added` not in the future, and `reviewBy` not passed. A passed `reviewBy` fails the test, which forces a decision at the next merge batch.
- The list is reviewed at every merge batch: the batch notes name every entry added, changed or removed, and adding an entry needs the orchestrator's sign-off in the pass log. This build's own fixtures are fixed, never listed.
- First contents, if the owners have not fixed their lines when step 1 lands: the 6 VM labs (labs track, 49 lines in 8 entries), the 5 escape rooms (escape-room track, 24 lines in 6 entries), and test_access_social only if c3-replies has not merged (it should have; see section 5). Each with a `reviewBy` the owner agrees.

**When it lands.** After this build's 41 lines and 4 fixtures are fixed, after `build/c3-replies` merges, and with every remaining line either fixed or listed. Step 1's own corpus run produces the list's first contents, so no line is listed by guesswork.

**Tests.**
- Node: a fixture with one `❌` line from each module (common, ink check, schema, habits, work, social) exits 1; a fixture with only warnings exits 0; a schema failure plus a common issue prints both and exits 1; an ink-check failure plus a common issue prints both; the summary line counts correctly; the four false-positive shapes (sis01 medication warning, sis02 fields) pass; a listed failure exits 0 and prints its owner; a stale entry and a short `count` each exit 1; an extra unlisted line exits 1.
- Test audit: 48 test files run the whole validator and hold 104 `status, 0` assertions. The builder lists every test that asserts exit 0 on output containing `❌` (for example `test/js/validator-social-schema.test.mjs:158-159`, a `❌ SOCIAL: schema:` line with exit 0) and updates each in the same commit as the switch.
- Corpus: before and after counts per scenario in the build log, with the merge-batch flags; after the fixes, every scenario that prints an unlisted `❌` exits 1, and no scenario that exited 0 with no `❌` changes.

**Sync.** No runtime change.

### Step 2. Strict keys for the access, network and office-life blocks

**Why.** These blocks are open in the schema and the validator's unknown-field pass does not walk them. A misspelt key is silent, and some slips change play: `wifi: { "PSK": ... }` leaves `psk` missing, which means an open network by design; `"downif"` on a resource means the outage never happens; `"autoLockMins"` drops an instant lock. Checked on main: `networks.*` and `networks.*.wifi` (properties `name`, `downIf`, `wifi`; `ssid`, `psk`), `resources.*` and `policies.*` set no `additionalProperties`, and the schema is run with `strict: false` (validate_scenario.rb:223). Every rendered scenario's keys under `resources.*`, `networks.*`, `networks.*.wifi` and `policies.*` were compared with the schema: no unknown key anywhere. No main mission uses these blocks, so closing them now costs nothing.

**Change.**
1. In `scripts/scenario-schema.json`, set `additionalProperties: false` with `patternProperties: { "^_": {} }` (so `_comment` keys still pass) on: the entries of `resources`, `networks`, `networks.*.wifi`, `policies`, `accountProfiles` and `roles`; the access list type (`roles`, `people`) wherever it appears (`access`, `for`); NPC `creds`, `screenHabit`, `printHabit`, `usbHabit`, `habits`, `frustration`, each `workarounds` entry, `feed` and its posts (C3 types the posts); object `affordance`, `portSecurity`; the `grant_foothold` action; each `needs` entry. The builder lists the final set in the build log with each block's schema path.
2. A small validator pass reads the closed blocks from the schema and, for each unknown key, prints `❌ ERROR: <path>: unknown key '<k>'`, adding `did you mean '<known>'?` when one known key matches case-insensitively or within edit distance 2. The schema stays the single definition; the pass only words the message.
3. The hand-kept lists in `check_unknown_fields` (validate_scenario.rb:401-470) stay for the core kinds, which remain open until the "close the core kinds" migration.

**Tests.** Node fixtures for each mutation in the access review's table (`PSK`, `downif`, `autoLockMins`, `lockchance`, `needHome`, affordance `owner`), each an error naming the right key and suggestion; a `_comment` key in each closed block passes. Corpus run: expected 0 new errors; any hit in a test scenario is fixed here, any in a mission goes to its owner.

**Sync.** No runtime change.

### Step 3. Secret-leak check, with acknowledged clues

**Why.** Nothing stops an author copying an answer to a place the browser receives at game start. `globalVariables` ships in the bootstrap and in player_state; `minigameData` ships with the room. m08 already does it: `suite_code = "5386"` (scenarios/m08_the_mole/scenario.json.erb:117) is a global so that Netherton's voiced ink can say it, which puts the interrogation-suite PIN in the browser from the start. Separately, the server strips `requires` only when the node's own `lockType` is present and is not biometric, bluetooth or rfid (game.rb:4596-4598 and games_controller.rb:1930), so `"locked": true, "requires": "4821"` with no `lockType` ships the PIN, and so would a door entry with a PIN in `requires` and no `lockType` of its own.

**How a lock type is resolved.** The check uses the client's own rule:
- a room, object or item: its own `lockType`;
- a `rooms.*.doors[]` entry: the entry's `lockType`, else the connected room's. The client takes the matching `doors[]` entry as the door's lock properties and fills each gap from the connected room (`public/break_escape/js/systems/doors.js:491-499` and 525-527: `lockType: lockProps.lockType || connectedRoomData?.lockType`, `requires: lockProps.requires || connectedRoomData?.requires`), copies the result into the sprite (line 556), and the gate code reads `props.requires` for the clone-as-entry credential and the door sign (`door-gates.js:310-314`, `doors.js:686` and 752). A card id in a door entry's `requires` is live.

Two door entries in the corpus carry `requires` with no `lockType` and no `locked`: lab_physical_pentest `open_plan/doors[0]` (`cm_records_badge`, connected room `secure_area`, rfid) and test_gate_tailgate `office/doors[0]` (`test_staff_badge`, with a `gate` block, connected room `staff_room`, rfid). Both resolve to rfid, so both are correct and stay.

**Change.** A validator check, `check_secret_leaks`, run on the rendered scenario (so an `@random_pin` copied into a global is caught within the same render).
1. Collect answers: `requires` on rooms, objects, `contents`, `itemsHeld`, `startItemsInInventory` and door entries whose resolved lock type is pin, password, combination or cryptex (the last two arrive with `build/unlock-gaps-r1`); top-level `flags` values; task `targetFlags`; flag-station `flags`; `creds.password`; `networks.*.wifi.psk`; capture secrets (`usePayload.secret`, `addCapture.secret`, `capture.secret`).
2. Error when an answer equals a `globalVariables` value (string or number compared as text), or equals a leaf string in any `minigameData` or `scenarioData`, or appears as a whole word inside one when the answer is 6 or more characters, unless an acknowledged clue covers it (item 4). The message names both places and points to the decision the author needs (section 6, q85).
3. `requires` with no resolved lock type:
   - resolved to biometric, bluetooth or rfid: an id (a card, fingerprint owner or device), never a secret; no finding;
   - resolved to a secret kind on a door entry that has no `lockType` of its own: an error ("this door entry ships its `requires` because the server filter reads the entry's own `lockType`; set `lockType` on the entry or remove `requires` and let the room carry it"). The corpus has none;
   - no lock type on the node or, for a door entry, on the connected room: on a `locked: true` room, object or item, an error; on an unlocked object, a warning ("inert; delete it"). A door entry is never told to delete its `requires`. The 15 legacy objects (all unlocked PCs with the literal `"requires": "password"`, in ceo_exfil and crypto1 to crypto4) get the warning, not an error.
   - The check does not look at `requires` inside `social` (it lists facts there, 12 hits in ca01 to ca14) or at objective conditions.
4. **Acknowledged clues.** A clue that is the puzzle is marked, never silenced by a looser rule. A top-level list:
   ```json
   "acknowledgedClues": [
     { "lock": "<id of the room or object whose answer is matched>",
       "in": "<object id holding the minigameData> | global:<name>",
       "reason": "<one line: why showing it is the deduction>" }
   ]
   ```
   A match between that lock's answer and a value inside the named object's `minigameData` (or the named global) is reported once as `ℹ️ acknowledged clue: <lock> in <in>: <reason>` and is not an error. An entry that matches nothing is a warning (stale). The list is marked `x-client: false` in step 6a: it holds ids, not answers, but the client has no use for it. m06_follow_the_money needs one entry: its transaction server's `minigameData` lists three `withdrawals[].slot` values (`data_center/objects[0]/minigameData/withdrawals[2,8,12].slot`) equal to the custody console PIN (`data_center/objects[1].requires`). Tracing the withdrawals to the slot is the deduction, shown on screen in the unlocked object, so it is not a leak. The marker is a one-entry edit to a main mission, made by m06's owner.
5. **Capture-secret warnings** (proposed by `build/usepayload-secret`, folded in here):
   - a non-account `usePayload` with a `secret` but no `targetId`, and no `addCapture` mapping on its NPC: the server can never serve it (`⚠️ WARNING: <path>: this usePayload secret can never be served`);
   - a capture secret that is a lock code with no `proof`, in a scenario that declares capture proofs: it will not be served (`⚠️ WARNING`).
6. **State of `build/usepayload-secret`.** That branch is server-only: c18c1e605 (withhold every capture secret from every route, serve it from `GET /capture_secrets` once earned, with tests), c75096c5e (build log), 3aab84403 (code review round 1: no blockers or majors, 3 minors, 2 nits), and any later round 1 fixes. It touches `game.rb`, tests and docs, and adds no validator check, so step 3 starts from nothing and is the only secret-in-the-format check. Its log also proposes teaching `tools/playtest/lib/access_leak_scanner.rb` the non-account capture secrets (today it knows `creds.password` and sign-in PC, profile and locked-container contents), so every live run checks this class too. That goes in step 3 as a small playtest-tool change with its own fixture.

**Corpus effect.** m08: one error, until the user rules on q85 (section 6). m06: three matches, reported as one acknowledged clue once its owner adds the marker. Neither is fixed by this build. Step 3 lands with m08 in the known-failures list (owner: the m08 owner, pending q85) and with m06's marker in, or m06's three lines listed until it is. Expected warnings: the 15 legacy PCs.

**Tests.** Node fixtures: a PIN copied into a global (string and number), into `minigameData`, a password inside a longer `minigameData` string, a flag answer in a global, a `@random_pin` rendered into both places; `requires` with no `lockType`, locked and unlocked; a door entry with a card id and no `lockType` whose connected room is rfid (no finding: copies of lab_physical_pentest `open_plan/doors[0]` and test_gate_tailgate `office/doors[0]`); a door entry with a PIN and no `lockType` whose connected room is pin (error); a door entry with `requires` and no lock type anywhere (no "delete it" message); `requires` in `social` (no finding); a clue PIN on a note's `text` (no finding: clues are the game); an acknowledged clue in `minigameData` and in a global (one note each); a stale acknowledged clue (warning); each capture-secret warning and its passing shape. The leak scanner gets a fixture response holding a non-account capture secret.

**Sync.** No runtime change.

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

**Why.** Reference checks exist one field at a time, so new fields arrive unchecked. The structure review's mutation test showed an eventMapping `completeTask` naming a missing task passes with no message, and `completeTask`, `unlockTask` and `unlockAim` are typed `{}`. Id uniqueness is checked only for objects directly in `rooms[*].objects` (scripts/validate_social.rb:144-160); duplicates inside `contents` and `itemsHeld` pass. Spot checks confirm the review: `derek_file` appears twice in m09 and `nightshade_payment` four times in m10.

**Change.**
1. A schema annotation `"x-ref": "<kind>"` on every property that names something: `room`, `npc`, `object`, `item`, `task`, `aim`, `global`, `lock` (a key lock's name), `network`, `resource`, `policy`, `role`. Arrays of references carry it on `items`. Type `completeTask`, `unlockTask`, `unlockAim` and `skipTask` as a string or array of strings with `x-ref`.
2. One shared schema walker in `lib/break_escape/schema_walk.rb` (plain Ruby, no Rails), which visits the data and the matching schema node together, resolving `$ref`, `oneOf` and `anyOf` by the data's shape. Steps 6a and 6b reuse it.
3. An index of every id by kind: room map keys; room NPCs, top-level `npcs` and `phoneNPCs`; objects at every depth (`objects`, `contents`, `itemsHeld`, `startItemsInInventory`) by `id`; tasks by `taskId`; aims by `aimId`; globals declared in `globalVariables` plus the engine-written patterns (`<npcId>_frustration`, `<objId>_screen_locked`, `<objId>_owner_away`, `<objId>_accessed`, `<jackId>_planted`) listed once in the schema under `x-engineGlobals`; lock names from key locks' `requires`.
4. Resolve every `x-ref` value against the index. Unresolved: `⚠️ WARNING` now. Existing one-off checks that already error (connections, `targetRoom`, `unlockDoor`) keep their level.
5. Uniqueness: an id used twice by objects at any depth is a warning; an NPC id used twice is a warning; the same string used as ids of two kinds that a bare-string field could confuse (a task and a global) is a note in the report.
6. Replace the hard-coded room `type` enum with a check against the room map files, as the validator already does for object sprites (fixes test_desk_seating for good).

**Promotion to errors.** After the 5 scenarios with duplicate ids are fixed: m09_digital_archaeology and m10_full_disclosure (main missions: their owners), lab_tesseract_trials (labs track), npc-hub-demo-ghost-protocol (this build: a demo) and test_access_social (this build after C3 merges). The promotion is one commit that flips the level and runs the corpus. The builder checks whether the server's unlock lookup (first hit by id) makes any of these duplicates a live bug and, if it does, reports it to the owner as a bug, not a nit.

**Tests.** Node fixtures for each kind (a missing task in `completeTask`, a missing aim, a missing global in a condition, a missing network on a room), duplicates in `contents` and `itemsHeld`, an engine-written global accepted, and the structure review's whole mutation set re-run as one fixture with every finding expected. Corpus: counts of the new warnings per scenario in the build log.

**Sync.** No runtime change.

### Step 5. One `ScenarioBinding` in `lib/` for every renderer, and a JSON-safe helper for ERB

**Why.** Each tool that renders a `scenario.json.erb` carries its own binding, and they have drifted. The server's `vm_flags_json` returns `{"flag_1": ..., "flag_2": ...}`, and `'{}'` when a VM context is present but names no flags for that VM (`app/models/break_escape/mission.rb:394-410`). The validator's returns `flags_for_vm`, a plain array, and the fallback array when the VM is missing (`scripts/validate_scenario.rb:100-102`). 11 templates call `vm_flags_json` (m01 to m10 and test_simple_vm_flag), so the validator has been checking a top-level `flags` shape the server never builds; its one reader of that shape, `check_vm_flags_load_bearing` (`validate_scenario.rb:5752`), skips anything that is not a Hash, so its literal-to-ref map has always been empty. Separately, values are pasted into JSON text, so a string with a quote breaks the render unless the author remembers `.to_json`.

**Every binding on main:**

| File | What it is | Action |
|---|---|---|
| `app/models/break_escape/mission.rb:337-415` | the server's class, the truth | moves to lib |
| `scripts/validate_scenario.rb:56-110` | the validator's copy | deleted; `require_relative` the lib file |
| `scripts/generate_dungeon_graph.rb:53-80` | its own class; `vm_flags_json` returns the fallback array (the same drift); feeds the dungeon-graph skill | deleted; `require_relative` |
| `tools/pass2/render.rb:2-6` | top-level `vm_object`, `flags_for_vm`, `vm_flags_json` | deleted; `require_relative` and `ScenarioBinding.render` |
| `scenarios/lab_tesseract_trials/tools/render_scenario.rb:3-8` | its own class | deleted; `require_relative` (the labs track is told) |
| `scripts/check_door_alignment.py:73-76` | Ruby embedded in Python, run through `ruby` | the embedded Ruby becomes `ruby -r <repo>/lib/break_escape/scenario_binding.rb -e 'print BreakEscape::ScenarioBinding.render(File.read(ARGV[0]), {})'` |
| `scripts/ink_runtime_check/m02_routes/route.js`, `m05_routes`, `m07_routes`, `m08_routes` (`route.js:35-40` in each) | Ruby embedded in JS, run through `ruby` | the same one-liner |

Left out, with reasons:
- `app/services/break_escape/tts_line_extractor.rb`, `tts_expected_lines.rb`, `tts_batch_processor.rb`, `tools/playtest/swap-scenario-game.rb`, and three TTS tests (`test/controllers/break_escape/tts_controller_test.rb`, `test/unit/break_escape/tts_mission_lines_test.rb`, `test/unit/break_escape/tts_stored_room_order_test.rb`): they already use `Mission::ScenarioBinding`, which the alias keeps working.
- `tools/playtest/new-game.rb`: it scans the template text with a regex for VM names (line 132) and renders nothing.
- `scenarios/m07_architects_gambit/.ALIGNMENT_PLAN.v1.bak`: a backup file, not code.

**Change.**
1. Move the class to `lib/break_escape/scenario_binding.rb` as `BreakEscape::ScenarioBinding`, plain Ruby (`securerandom`, `json`, `erb`), with the server's behaviour as the truth. Keep `Mission::ScenarioBinding` as an alias constant. Add `BreakEscape::ScenarioBinding.render(template_text, vm_context)`, used by `Mission#generate_scenario_data`, the validator's `render_erb_to_json` and every tool in the table.
2. Add `json(value)`: returns `value.to_json`, for `"title": <%= json(title) %>`. Document it in the README's ERB section beside `.to_json`.
3. Replace each copy as the table says.

**Tests.** Rails unit test of each helper (`vm_object`, `flags_for_vm`, `flags_for_vm_slice`, `vm_flags_json` with and without a context, `json` with quotes, backslashes and non-ASCII). A test that `Mission::ScenarioBinding` is the lib class. A node test that each Python and JS caller renders m01 identically to the lib class. Corpus: render all 176 scenarios with random values stubbed, before and after; the JSON is identical except the top-level `flags` of the 11 `vm_flags_json` users, which now match the server. Dungeon graphs of those 11 before and after, kept in the build log (the graphs are not committed). Validator over m01 to m10 before and after: `check_vm_flags_load_bearing` sees a Hash for the first time, so its warnings will change. Each change is recorded in the build log with a verdict (a real finding for the mission's owner, or a check bug fixed here); none is called a bug by default.

**Sync.** No runtime change (the server's output is unchanged by construction).

### Step 6. Secrecy as a schema property

**Why.** Which values are secret is decided by hand-kept lists, and the format does not show them:
- The bootstrap (`Game#filtered_scenario_for_bootstrap`, game.rb:1094-1190) allow-lists room fields (line 1122) but deny-lists the top level by name: `flags`, `accountProfiles`, `roles`, the network keys, feed facts, capture secrets, grant contents, `targetFlags`. A new secret-bearing top-level block ships unless someone adds it to the list.
- Two near-copies strip `requires` with the same rule, keyed on the node's own `lockType`: `Game#filter_requires_and_contents_recursive` (game.rb:4569-4598) and `GamesController#filter_requires_recursive` (games_controller.rb:1917-1938, called on the bootstrap at line 286). `build/unlock-gaps-r1` adds `strip_lock_answers!` (combination and cryptex answer copies, and start-inventory answers) to both.
- Per-feature lists: `WITHHELD_NPC_KEYS` and `WITHHELD_WORK_NPC_KEYS` (game.rb:4681-4685), `NetworkAccess::WITHHELD_OBJECT_FIELDS`, the `puzzle_graph_*` strip, `DeclaredGrants`, and the capture-descriptor walk that `build/usepayload-secret` widens to every `capture`, `addCapture` and `usePayload` at any depth.
- 33 schema descriptions say "never sent to the browser" in prose; nothing machine-readable.

Once usepayload-secret and unlock-gaps-r1 are in, no leak is known in these filters. Step 6 therefore starts with marks and scans that would catch the next one (6a), and replaces the filters (6b) only if the scans find a gap.

#### 6a. Marks, the payload scan and the client-read scan

No engine change. In `scripts/scenario-schema.json`:
- `"x-serverOnly": true` on every secret property (section 2's list), with `"x-servedBy": "<route>"` where a route serves it once earned (`GET /container`, `GET /network`, `GET /capture_secrets`).
- A conditional form for `requires`: `"x-serverOnly": { "unlessLockType": ["biometric", "bluetooth", "rfid"] }`, with the lock type resolved as in step 3 (on a door entry, the entry's `lockType`, else the connected room's: `"lockTypeFrom": "connectedRoom"` on the door entry definition). A card id under an rfid door entry stays client-visible. A `requires` with no resolved lock type, on an object, counts as secret (fail closed).
- Whole-record rules: NPC `creds`, `role`, `awareness`, `habits`, `workarounds`, `workNeeds`, `frustration`, `feed`, `usbHabit`.
- `"x-client": true | false` on every top-level property. The schema first declares every top-level key the corpus uses. Ten are undeclared today; each gets a decision from its readers on main:

| Key | Scenarios | Readers on main | `x-client` |
|---|---|---|---|
| `scenario_id` | 94 | none | false (dead; migration 7.5) |
| `scenario_name` | 94 | client: `public/break_escape/js/music/bond-visualiser.js:1747` | **true** |
| `exportGlobals` | 24 | none in code (documented in a comment, `carry_over.rb:5`) | false |
| `importGlobals` | 23 | server only, at creation (`carry_over.rb:106`) and in TTS extraction (`tts_line_extractor.rb:62`) | false |
| `description` | 4 | none | false |
| `name` | 3 | none at the top level (the client's `scenarioData.name` reads are object names) | false |
| `globalItems` | 2 (basic_mission, vm_free_mission) | none | false (q86) |
| `validSprites` | 2 (m01, lab_tesseract_trials) | server only (`avatar_unlocks.rb:77`, the player preferences controller) | false |
| `timedMessages` | 1 (timed_messages_example) | none at the top level (the NPC manager reads each NPC's own `timedMessages`) | false |
| `showTitleScreen` | 1 (title-screen-demo) | none (`main.js:132` starts the title screen unconditionally) | false |

All ten ship today, because the bootstrap's top level is a deny list. Marking them `x-client: false` changes nothing at runtime in 6a; it states what 6b would do.

**Tests (6a).**
- Rails, payload scan over every scenario (one file, tagged so it can run alone): create a standalone game, fetch `GET scenario`, `GET room/:id` for every room and `GET container/:id` for every container (a refusal counts as a pass). Using the schema walker, assert that no field marked `x-serverOnly` (with the resolved lock type for `requires`) appears at any path, and that no authored secret value appears in the response text unless the same value is also authored in a field marked client-visible or covered by an acknowledged clue. The scan names title-screen-demo and timed_messages_example among its cases, and test_gate_tailgate and lab_physical_pentest, whose door entries' card ids must still be present in the room payload.
- Node, client-read scan, both levels. Under the top level: a scan of `public/break_escape/js` for property reads of every `x-serverOnly` name, with a reviewed allow list (a name the client reads from a served route, such as a container's `contents`, or `requires` on an rfid door entry). At the top level: every read of `gameScenario.<k>`, `window.gameScenario.<k>`, `window.gameState.scenario.<k>` and `scenario.<k>` where the object is the scenario, and every such key must be `x-client: true`. Either fails on a read the schema would not ship.
- Node: every top-level key in the rendered corpus is declared in the schema with an `x-client` value.

**What 6a's scan settles.** If the scan finds a field that reaches the browser but should not, or a top-level key the client reads that the bootstrap would drop, that gap is fixed in the existing filters at once (a small engine change with live proof) and 6b starts. If it finds nothing across every scenario and route, 6b waits until a new secret-bearing block arrives.

**Sync.** No runtime change.

#### 6b. One client serialiser (conditional)

Starts only if the 6a scan finds a gap, or when a new secret-bearing block is added to the format.

**Change.** `lib/break_escape/client_scenario.rb` (plain Ruby) compiles the annotations once at boot into a table per schema definition, and strips a node in place with the step 4 walker. It covers the bootstrap, lazy room payloads and container payloads, and replaces `filter_requires_and_contents_recursive`'s requires rule, the controller's `filter_requires_recursive`, `strip_lock_answers!`, the two NPC key lists and the capture walk. The top level becomes an allow list: a key with no `x-client: true`, including one the schema does not know, does not ship. Door entries resolve their lock type from the connected room before the `requires` rule, so a PIN on an untyped door entry is stripped and a card id on an rfid door entry stays. State-dependent work (unlocked rooms, `hasPresentNpc`, `flagUnlockedRemotely`, `pinLength`, objectives state) stays where it is; only the secrecy rule moves. Subtrees the schema does not describe (an open core kind's unknown key, `minigameData`) are kept as authored, so the old per-feature lists stay as a second pass until the parity test shows the table covers them; then they are deleted in a separate commit.

**Capture secrets.** `build/usepayload-secret`'s capture walk becomes `secret` marked `x-serverOnly` with `x-servedBy: "/capture_secrets"` in the three capture descriptor definitions, with the serving code unchanged. Its tests (`capture_payload_secret_test.rb`, `capture_payload_secret_routes_test.rb`, the withholding tests) stay as regression tests.

**Cost.** The walk runs once per game, not per request. `scenario_data` is written only at creation (`game.rb:4755`); the one other writer is the playtest tool `tools/playtest/swap-scenario-game.rb`. Cache the stripped copy keyed by game id and a digest of the compiled annotation table (computed once at boot, so a deploy that changes a mark rebuilds every entry); the swap tool clears its game's entry. Then apply the state-dependent fields per request. Measure on m10 (the largest scenario, 363 KB of ERB) and lab_physical_pentest; target under 20 ms for the first bootstrap.

**Tests (6b).**
- Rails, two-sided parity: for every scenario and every route, the old filters' output and the new serialiser's output are compared path by path. It fails on every path the new serialiser keeps that the old one removed (a leak), and on every path it drops that the old one kept (a regression), unless that path is in a reviewed list in the test file with a reason. Expected entries in that list: the ten top-level keys marked `x-client: false` in 6a, and `requires` on the 15 legacy unlocked PCs. The test is deleted with the old lists.
- Rails, top level: a scenario with an unknown top-level key `secretThing` does not ship it; `scenario_name` does.
- The 6a payload and client-read scans, unchanged.
- Existing: `filtered_scenario_test.rb`, `access_model_withholding_test.rb`, `network_withholding_test.rb`, `lab_physical_pentest_secrets_test.rb`, `capture_secret_test.rb`, `access_model_no_password_test.rb` all pass unchanged.

**Live proof.** A keyless server on the builder's port; headless browser runs, each with a reload partway: m01 (gold standard: PIN door, flag station), test_access_sessions (sign-in PC, account password never in `window.gameState.scenario`), test_access_networks (Wi-Fi join; `psk` absent until joined), test_unlock_gaps (combination and cryptex), test_gate_tailgate (walk through the gate once: the door sign and the clone-as-entry credential still work), title-screen-demo and timed_messages_example (they still start and run), and lab_physical_pentest with the shoulder-surf beat played (Ruth's mapping for Len's records PIN: the capture secret appears only after the capture, from `/capture_secrets`). In each, a console scan of the bootstrap and every loaded room for the scenario's secrets, and `tools/playtest/verify-run.rb` showing progress on the server.

**Sync.** Payloads shrink or stay the same; player_state is untouched.

## 5. Merge order

Branches that touch the same files as this plan (`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `app/models/break_escape/game.rb`, `app/controllers/break_escape/games_controller.rb`). State on 2026-11-12, main at 72e26f911:

| Branch | Tip | Ahead of main | Files shared with this plan |
|---|---|---|---|
| build/readme-93b | 3da7627c5 | 0: merged into main | game.rb, network_access.rb, validate_network.rb |
| build/c3-replies | 6993fd3b0 | 25 | schema, `validate_network.rb`, `validate_access_work.rb`, `validate_npc_habits.rb`, `validate_social/osint.rb`, `lib/break_escape/access_work.rb`, test_access_social |
| build/usepayload-secret | 3aab84403 | 3 | game.rb only (capture-secret withholding and serving), tests, docs |
| build/unlock-gaps-r1 | 06bd6885a | 8 (build/unlock-gaps ef7a36534 plus 3 round 1 fix commits; it supersedes build/unlock-gaps) | schema (9 lines), validator (91), game.rb (106), controller (38): `strip_lock_answers!` in both filters |
| build/sync-deltas | 6a19d4ff5 | 18 | game.rb (109), controller (29), `state-sync.js` (269): the bootstrap and sync paths |
| build/keypin-seed | a524171df | 1 | `key-lock-system.js` (the keyPins fallback fix) |

Every pair among these merges cleanly (`git merge-tree`).

Order:
1. **build/c3-replies.** It clears test_access_social's two lines and turns the CI social job green.
2. **build/usepayload-secret**, **build/unlock-gaps-r1** (in place of build/unlock-gaps) and **build/keypin-seed**, in any order, one batch each. build/readme-93b is already in.
3. **build/sync-deltas**, at any point before step 6b and before any later upgrader slice, both of which hook the bootstrap and sync paths it changes.
4. **Step 1** (exit code and the known-failures list), once this build's 41 lines and 4 fixtures are fixed and every other line is fixed or listed. Every later branch then fails its own merge batch on any unlisted `❌`.
5. **Steps 2, 3, 4 and 5**, validator, schema, lib and tools; they can be built in parallel worktrees and merged one per batch. Step 3 lands with m08 listed (q85) and m06's marker in or its lines listed.
6. **Step 3b**, only if the user picks q85 (b).
7. **Step 6a.** Then **6b** only if the 6a scan finds a gap, rebased on main after usepayload-secret, unlock-gaps-r1 and sync-deltas, because it replaces the code they change.
8. The upgrader slice (section 8), only after the user approves a migration that needs it.

Each batch moves main only to the commit the full suites ran on, and runs the validator over every test scenario a merged branch touched.

## 6. Questions for the user

1. **q85: m08's door PIN in a global.** Netherton's voiced ink needs to say the suite code, and ink reads globals in the browser. Options: (a) accept it under the cheat policy as a voiced clue, marked as an acknowledged clue (step 3, item 4) that the leak check reports and allows; (b) server-held globals (step 3b): the global holds `""` until a server-checkable condition holds, then the value arrives as a delta; (c) change the beat so the code is read off the card and Netherton never says it. (a) is cheapest; (b) is new engine work (size M); (c) changes the mission's writing and its cached audio. Until the answer, m08's line sits in the known-failures list.
2. **q86: basic_mission and vm_free_mission.** They fail the schema (top-level `globalItems` and other undeclared keys). Facts on main: neither `mission.json` has a `collection`, so `db/seeds.rb` (line 71) puts both in the `default` collection with `published = true`: they are listed as playable missions wherever seeds ran. Deleting a folder makes the next seeds run offer the orphan delete (`db/seeds.rb:108-134`), which destroys each mission with its games and Hacktivity listings (typed confirmation at a terminal, or `BREAK_ESCAPE_PRUNE=1`). Nothing else in the repository refers to them except two docs. If kept, the fix is S: move the undeclared keys into the schema's form and add `"collection": "testing"` to each `mission.json`. Fix them as examples, or delete them?
3. **q83 and q84: format migrations.** The upgrader (section 8) is built only with the first migration the user approves that rewrites stored games' data.

## 7. The migrations (not in scope; for the user to pick)

Each needs scenario edits and waits for a decision. Where a migration changes the shape of stored games' data, the upgrader slice (section 8) is built with it as its first real step.

### 7.1 One `owner` field
- Changes: an `owner` (NPC id or list) and `private: true` on objects and items replace `screenOwner`, `affordance.owners`, `phoneOwner`, `phoneOf` and `leftBehindBy`; `needsHome` goes back to meaning movement only.
- Affects 8 scenarios: lab_physical_pentest, test_access_habits, test_access_sessions, test_access_social (and C3's additions), test_access_work, test_capture_log, test_clone_left_card, test_needs_sims. Main now also has `lib/break_escape/owner_claim.rb` (q78), which derives owners from `needsHome` and must read `owner` first.
- Stored games: copy each old field into `owner`, and write an explicit `owner` wherever the old rule derived one from `needsHome`, so old saves behave as before. player_state is keyed by object and NPC ids, which do not change.

### 7.2 One outage field and one condition grammar
- Changes: `offWhen` moves from `affordance` to the object and replaces `downIf` on networks and resources, all in the requireGlobal form (a name, or `{ name: value }`); `spriteVariants` accepts the same form.
- Affects 4 scenarios: test_access_networks, test_access_social, test_access_work, test_needs_sims.
- Stored games: `downIf: "g"` becomes `offWhen: "g"`; `affordance.offWhen` moves up a level. The server's two failure causes (`down`, `off`) are recorded per event, not stored, so saves need nothing more.

### 7.3 Habits in one block
- Changes: `screenHabit`, `printHabit` and `usbHabit` fold into `habits.screen`, `habits.print`, `habits.usb`; `awareness` stays the preset that fills them; the person's habit beats the PC's `lockChance`, and the validator prints each workstation's effective lock rule.
- Affects 5 scenarios (test_access_habits, test_access_social, test_access_work, test_needs_sims, lab_physical_pentest), plus `lockChance` on PCs in 6 test scenarios if the precedence changes.
- Stored games: move the three fields. Where the new precedence would change an old save's outcome, write the PC's old `lockChance` into the owner's habit so the save keeps its behaviour. These are the fields `NpcHabits.expand!` fills at creation, so the upgrader step must work on raw-shaped data (section 8, problem 2). The seeded screen roll is not stored, so nothing in player_state moves.

### 7.4 Close the core kinds
- Changes: add the fields from the structure review's M2 table to the schema, then `additionalProperties: false` (with `^_` allowed) on room, object, NPC, eventMapping, objective and task, and delete the hand lists in `check_unknown_fields`.
- Affects 37 scenarios that carry unknown-field warnings today, after 7.5 removes or declares the dead fields.
- Stored games: none for the closure itself, which is a validator rule. Any alias it retires (`target_room`, `roomId`, `task_id`, `setVariable`) becomes an upgrader step that rewrites it to the current spelling.

### 7.5 Drop dead fields
- Changes: remove `endGoal`, `version`, `scenario_id`, object `isEndGoal`, eventMapping `autoTrigger`, `note_title` and `note_content`; move title fields into `mission.json`.
- Affects up to 146 scenarios (`endGoal` 146, `scenario_id` 94, `version` 87, `isEndGoal` 9, `autoTrigger` 7, `note_*` 2). Mechanical; no spoken text changes, so cached audio is safe.
- Stored games: nothing reads these fields, so old games can keep them; no upgrader step is needed. `scenario_name` is read by the client, so it moves only with a reader change.

## 8. Deferred: `formatVersion` and a load-time upgrader

Not built in this plan. A game stores the rendered scenario at creation (`before_create :generate_scenario_data`, game.rb:33 and 4734-4765), so every rename is read in both spellings for as long as old games exist (the `key_id` to `opens_lock` fallbacks in `window.lockRef` and `lib/break_escape/item_identity.rb:12-17,48` show the cost), and the access loader `prepare_scenario_data!` (game.rb:1068-1074) runs only at creation. A top-level integer `formatVersion` and an ordered list of pure, idempotent upgrade steps would fix that. The slice starts when the user approves a migration in section 7 that rewrites stored data (q83 or q84), and is built with that migration as its first real step, after build/sync-deltas has merged.

Four problems its design must solve:

1. **No lock on the load path.** `set_game` (`games_controller.rb:1754`) is a plain `Game.find`. `with_game_lock` is an `around_action` for some routes (line 93) and excludes `show` and `scenario`, the two that run first on a load, and the client fetches rooms while the bootstrap is in flight. An upgrade on load must run in one helper, called from `set_game` and from every route that reads `scenario_data` without it, as `@game.with_lock { reload; upgrade if still old }`, so a second request finds the work done.
2. **Two data shapes.** `generate_scenario_data` calls `prepare_scenario_data!` itself (game.rb:4764), so at creation a step would see raw data, and at load it sees prepared data (habits expanded, ids stamped). Migrations 7.1 and 7.3 move exactly the fields `NpcHabits.expand!` fills. At creation the upgrade belongs inside `generate_scenario_data`, between `mission.generate_scenario_data` and `prepare_scenario_data!`; at load, run the steps and then `prepare_scenario_data!` again (it is idempotent, per its comment at game.rb:1062-1067), so every step is written against raw-shaped fields.
3. **player_state carries old shapes too.** `add_inventory_item!` (game.rb:170-177) stores the whole item hash in `player_state['inventory']`, so an old save's held key carries `key_id` there. While player_state is left untouched, the client fallbacks (`helpers.js:267`, `inventory.js:506`, `npc-game-bridge.js:44,247`, `objectives-manager.js:24`) cannot go. A rename pilot must either rename the key in player_state items in place (same size, so q77 holds) or keep the fallback.
4. **The sync path bypasses the loader.** `sync_state` loads only `SYNC_STATE_COLUMNS` (`games_controller.rb:783`) and never passes through `set_game`, and a tab opened before an upgrade keeps sending the old shape as deltas (build/sync-deltas seeds its "confirmed" state from the bootstrap). Nothing maps old keys on the way in. So player_state transforms stay out of the framework until a migration needs one; when one does, the bootstrap carries `formatVersion` and the client reloads when a sync answer reports a different one.

Other settled points: a stored `formatVersion` above the code's (code rolled back after games were upgraded) refuses to load with a clear message; the validator runs the upgrade on a copy and warns once per old spelling; releases that add a step say so in their notes.

## 9. Risks

- **Step 1 blocks other work.** Once errors fail the run, any branch carrying an unlisted `❌` fails its merge batch. The known-failures list keeps other tracks' lines visible with their owners without blocking, and a stale entry fails the run so the list cannot rot.
- **The known-failures list grows quietly.** Adding an entry needs the orchestrator's sign-off in the pass log, every batch names its list changes, and a passed `reviewBy` fails the node test.
- **Step 3 tells an author to delete a live field.** The door-entry lock type is resolved from the connected room, as the client does, and a door entry is never told to delete its `requires`; two corpus door entries are fixtures.
- **Step 6b strips a field the client needs.** The two-sided parity test, the top-level client-read scan and the live runs exist for this. `scenario_name` is the known top-level case and is marked `x-client: true` in 6a; the rfid door entries' card ids are the known nested case.
- **Step 6b cost per request.** The stripped copy is cached per game; the build log records the measurement.
- **Other tracks editing the same scenarios.** No builder edits a mission, lab or escape room without the orchestrator's confirmation from its owner.
