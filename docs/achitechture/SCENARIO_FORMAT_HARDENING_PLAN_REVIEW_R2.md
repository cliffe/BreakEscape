Counts: 1 blocker, 6 majors, 12 minors, 3 nits.

# Scenario format hardening plan: review round 2

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` at 0f532a6c1 (Draft). Date 2026-11-12. Code read on main 72e26f911 (`git show main:<path>` and an extracted `git archive main`). The validator runs used main's scripts with the merge-batch flags (`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph`). Corpus facts come from rendering all 176 templates with main's `render_erb_to_json`. Branch facts come from `git log`, `git diff main...<branch>` and pairwise `git merge-tree --write-tree` at the branch tips current during the review.

## Round 1 findings: status

| R1 | Status |
|---|---|
| B1 door entries | Resolved for the client and both filters. The server side of the rule is still unstated (m1 below). |
| M1 ink-on triage | Resolved. See the spot check below. |
| M2 known-failures list | Designed. Two gaps remain (M1, M2 below). |
| M3 m06 and capture secrets | m06 resolved by `acknowledgedClues`. The state of `build/usepayload-secret` is stale again (M5). |
| M4 parity and client reads | Parity is two-sided now. The client-read scan is incomplete (M4). |
| M5 binding copies | Resolved, with three bare renders missing (m2). |
| M6 upgrader | Resolved by deferral. Section 8 records the four problems correctly. |
| M7 value for cost | Resolved: 6a/6b split, upgrader deferred. |
| m1 to m8, n1 to n3 | Resolved, apart from the merge table, which has gone stale again (M5). |

## What was checked and held

- **Ink-on triage, spot check.** Ran main's validator with the merge-batch flags on 12 scenarios. Each count matches section 3.1: lab_exploitation 13 (all `standalone emote`), lab_feeling_blu 10 (all `contains '//'`), lab_vulnerability_analysis 9 (7 emote, 2 `//`), lab_malware_metasploit 1 (`//` at `instructor.ink:636`), ceo_exfil 4 (`#give_item` in `scenarios/ink/helper-npc.ink`), npc-sprite-test2 2 (`phone`, `keycard`), sis02_energy 3 (`nextTabPrompt`, `nextTabButton` and the third field, undeclared for `log_filter_terminal`), sis01_healthcare 1 (medication `interactionWarning`), test-rfid-multiprotocol 2 (`hacker-green`, `hacker-yellow`), crypto2_rsa_asymmetric 2 (`keyPins`), test_access_social 2 (Kim's phone, `sign_f14`). With `--skip-ink`, ceo_exfil shows the 10 hidden `targetKnot` lines and lab_malware_metasploit the hidden task line. The exit codes match (the six labs, ceo_exfil and npc-sprite-test2 exit 1; the others exit 0). test_desk_seating exits 1 and prints its schema error as `✗ Schema validation failed` with no `❌`, which is why section 3 counts schema failures apart. The arithmetic holds: 33 + 2 + 2 + 4 = 41, 43 keyPins lines, 49 lab lines in 8 entries, 24 escape-room lines in 6 entries, 116 in all.
- **Step 3 corpus effect.** An approximation of the step 3 rule over the rendered corpus (answers: secret-type `requires`, door entries resolved from the connected room, `creds.password`, capture secrets, `targetFlags`, flag-station flags, top-level `flags`, `wifi.psk`; matched against `globalVariables`, and against `minigameData` and `scenarioData` leaves by equality, or as a whole word at 6 or more characters) finds exactly m08 `suite_code` and m06's three `withdrawals[2,8,12].slot` values. Both are as the plan says.
- **Door entries in the corpus.** Only two carry lock fields, as the plan says: lab_physical_pentest `open_plan/doors[0]` and test_gate_tailgate `office/doors[0]`. Both have no `lockType` and no `locked`, and each carries the same `requires` as its rfid connected room.
- **Undeclared top-level keys.** The plan's ten, with the plan's counts.
- **Step 2 corpus.** `accountProfiles.*`, `roles.*`, NPC `creds`, `habits`, `workarounds[]` and `needs.*`, object `affordance`, and every access list carry no key outside their schema properties on main. One exception is in m4.

## Blocker

### B1. The 6a payload scan never sees a locked room, so the 6b decision rests on a scan of start rooms

**Section:** 6a Tests (payload scan), "What 6a's scan settles"; 6b Tests (parity).

**Evidence.** `GET room/:id` refuses any room that is not the start room, not in `unlockedRooms` and not a world room: `games_controller.rb` `room`, `render_error("Room not accessible: ...", :forbidden)` (about line 500 on main). `GET container/:id` refuses unless `path_unlocked?` holds (about line 566). The plan creates a standalone game and counts "a refusal" as a pass. On a fresh game, every locked room and container is refused, and those are the payloads that matter. m06's `data_center` (a pin lock) is never fetched. m08's `interrogation_room` is never fetched, nor is any room behind a door. The scan would report "no gap" from a small part of the surface. Under the orchestrator's ruling, 6b then never starts. The two-sided parity test in 6b has the same hole.

**Fix.** Before fetching, the test writes a fully opened state on the test game: every room id into `unlockedRooms`, and every object and container id into `unlockedObjects`. Where a route needs a session or foothold (sign-in PCs, profiles, file shares), it seeds one through the model helpers the existing withholding tests use. Then it fetches every room and every container, and a refusal fails the test unless the test lists that route and id with a reason. Run the scan twice: once on the fresh state (what a new player receives) and once fully opened (everything a route can ever send). The parity test uses both states too.

## Majors

### M1. The known-failures list blocks silent additions only by process

**Section:** step 1, "The known-failures list"; section 9, second risk.

**Evidence.** An entry is a line in a JSON file that any branch can edit. Nothing in the design fails when an entry is added, or when an entry's `count` goes up. The protections are "the batch notes name every entry added" and "sign-off in the pass log", and both rely on someone reading the diff. The node test checks the shape of each entry (dates, owner, scenario exists), not whether anyone approved it. A builder who meets a new `❌` in a listed scenario can raise `count` by one, and the run is green. The `match` rule allows a quieter swap too: fix one `contains '//'` line in lab_feeling_blu and add another, and the count still holds.

**Fix.**
- Each entry carries `"approved": "<heading or anchor in the current pass log>"`. The node test fails when that text is not found in the log named in CLAUDE.md (`scenarios/PASS4_EDITORIAL_LOG.md` today). An added entry, or a raised `count`, then needs an edit to the orchestrator's log, which shows in the branch diff.
- The merge-batch check runs `git diff <main>...<branch> -- scripts/validator_known_failures.json` and stops the batch on any added entry or raised `count` that the batch notes do not name. Add this line to AGENTS.md's merge-batch steps.
- Accept the swap case: it stays within one owner and one class of line. Say so in the design.

### M2. Partial validator runs fail every listed scenario as "stale"

**Section:** step 1, known-failures list, the stale rule.

**Evidence.** An entry fails the run when it matches fewer lines than `count`. The ink stage does not always run: `--skip-ink` skips it (the CI social job passes `--skip-ink`, `.github/workflows/ci.yml:144`), and item 4 says an ink compile failure "skips the checks that need the compiled JSON". With 47 of the 49 lab lines listed as ink lines, `validate_scenario.rb scenarios/lab_exploitation/scenario.json.erb --skip-ink` would print a stale error and exit 1, as would any machine where inklecate fails. Today no social scenario carries a listed line, so CI stays green. The first listed ink line in a social scenario would turn CI red.

**Fix.** Give each entry a `stage` (`ink`, `schema`, `common`, `habits`, `work`, `social`). The stale rule applies only to stages that ran in full on this run, and the summary says `<n> known failures not checked (ink skipped)`. Add node tests: a listed ink line under `--skip-ink` exits 0, and the same entry with ink on and the line fixed exits 1.

### M3. `acknowledgedClues` can hide a real leak, and anyone can add one

**Section:** step 3 item 4; 6a payload scan ("covered by an acknowledged clue").

**Evidence.**
- **The `global:` form settles q85 for every scenario.** A global ships in the bootstrap and in player_state from the first second of play. m08's `suite_code` is exactly this case, and section 6 leaves it to the user (q85 a, b or c). With `"in": "global:<name>"` available to every author, any scenario can mark its own copy of an answer in a global as a clue, and the check reports `ℹ️`. The m08 entry in the known-failures list stops mattering, because the m08 owner can add the marker.
- **`in` can name the lock itself.** `{ "lock": "safe", "in": "safe" }` acknowledges the safe's answer inside the safe's own `minigameData`. That `minigameData` ships with the room while the safe is still locked, so the marker turns a real leak into a note. Nothing in the design rejects it.
- **No gate on who adds entries.** Known-failures entries need sign-off. Clue markers live in scenario files that many owners edit, and need none. The validator shows each as one `ℹ️` line, and the summary (`Result: <n> errors (<k> known), <m> warnings`) does not count them.
- **The reason ships.** `acknowledgedClues` is a top-level key, and the bootstrap's top level is a deny list (`game.rb` `filtered_scenario_for_bootstrap`, lines 1146-1186 delete named keys only). Until 6b, every `reason` ("why showing it is the deduction") reaches the browser: a spoiler, though not a secret.

**Fix.**
- Allow `global:` only after the user answers q85 (a). Until then, the validator rejects the form with an error naming q85. If (a) is chosen, the global form prints `⚠️` ("ships at game start"), never `ℹ️`.
- Reject an entry whose `in` is the lock itself, or an object the lock contains (`contents` of the lock). Contents are served only after the unlock, so a marker there is not needed.
- Count markers in the summary line (`, <c> acknowledged clues`). The merge batch lists added markers in the same way as known-failures entries (grep the branch diff for `acknowledgedClues`), with the same sign-off.
- Add `filtered.delete('acknowledgedClues')` to the bootstrap in step 3, as a one-line engine change with a Rails test. Or require `reason` to name no answer, and accept that it ships. The first is cheaper to reason about.

### M4. The client-read scan misses aliases and server-added keys, and one table row is wrong

**Section:** 6a (top-level table, client-read scan); 6b (top-level allow list); 7.5.

**Evidence.**
- **An alias the patterns miss.** `public/break_escape/js/systems/npc-needs.js:5234` reads `w.gameScenario?.npcNeedsSeed`, then `w.gameScenario?.scenario_name || w.gameScenario?.name || 'scenario'`, with `w = window`. None of the plan's patterns (`gameScenario.<k>`, `window.gameScenario.<k>`, `window.gameState.scenario.<k>`, `scenario.<k>`) matches `w.gameScenario?.<k>`, and none mentions optional chaining. Other aliases on main: `const scenario = window.gameScenario` (`main.js:178`, `core/player.js:203`), `const gameScenario = window.gameScenario` (`minigame-starters.js:106,382`, `collision.js:157`).
- **The table's `name` row is wrong.** It says top-level `name` has no reader. npc-needs reads it as the office-life seed when a scenario has neither `npcNeedsSeed` nor `scenario_name`. The three scenarios with a top-level `name` (test-ble-scanner, test-rfid-multiprotocol, test-rfid) have no needs NPCs, so nothing changes today. A 6b allow list without `name` would still change the seed for any future scenario that relies on it.
- **`scenario_name` is the needs seed.** That matters for 7.5, which says title fields move to `mission.json`. Moving `scenario_name` changes every seeded office-life roll in old saves of a needs scenario that has no `npcNeedsSeed`.
- **Server-added keys.** The controller adds 26 top-level keys to the bootstrap after `filtered_scenario_for_bootstrap` (`games_controller.rb` lines 293-408: `objectivesState`, `submittedFlags`, `wornItem`, `savedGlobalVariables`, `savedNotes`, `commandBoard`, `savedPhoneState`, `sessions`, `signedInPcs`, `footholds`, `gainedFootholds`, `npcFrustration`, `feedPosts`, `lockoutPcs`, `playerInventory`, nine more `saved*` keys and `scenarioBriefShown`), and the model adds `characterSprites` (`game.rb:1101`). None is an authored key, and none is in the schema. The client reads most of them (for example `gameScenario.savedNotes` 5 times, `gameScenario.playerInventory` 5). As written, the top-level read scan ("every such key must be `x-client: true`") fails on all of them. Without a rule, a 6b allow list placed after the controller would strip them.

**Fix.**
- The scan matches any identifier bound to `window.gameScenario` or `window.gameState.scenario` (an assignment scan first, then reads of each bound name), with `?.` and bracket access with a string literal. The list of bound names goes in the test, so a new alias fails until it is added.
- Change the `name` row to "client: `npc-needs.js:5234` (seed fallback)", `x-client: true`. Add to 7.5: "`scenario_name` and `name` seed office life; move them only after `npcNeedsSeed` is written into every needs scenario."
- Define a second set, `SERVER_BOOTSTRAP_KEYS`, as a constant beside the controller code that adds them. The read scan accepts a key that is in the schema with `x-client: true`, or is in that constant. A node test checks that the constant matches the `filtered['<k>'] =` assignments in the controller and model. State in 6b that the allow list applies inside `filtered_scenario_for_bootstrap`, before the controller adds runtime keys.

### M5. The merge order is stale against current tips, and one pair now conflicts

**Section:** 5 (table, "Every pair among these merges cleanly", order); step 3 items 5 and 6.

**Evidence.**
- **A conflict.** `git merge-tree --write-tree build/sync-deltas build/unlock-gaps-r1` gives `CONFLICT (content)` in `games_controller.rb`, in three hunks of the inventory route. unlock-gaps-r1 answers `{ success: true, inventory: client_inventory }` on add and remove. sync-deltas (now 7c7b55c83, which includes a merge of `build/sync-proof-tools`) removes the inventory echo ("No client reads the inventory echo from this answer (sync deltas P2)"), under the sync size rule. This is a design clash, and whichever branch merges second has to settle it.
- **Moved tips.** c3-replies is at a4ecfe07e (26 ahead), usepayload-secret at 91849ba67 (4 ahead), sync-deltas at 7c7b55c83 (19 ahead), and unlock-gaps-r1 moved to 36f0c92b0 during this review.
- **usepayload-secret now changes the validator.** 91849ba67 adds 42 lines to `validate_scenario.rb` and a new `lib/break_escape/capture_model.rb`. `check_access_model` gains the warning "a usePayload.secret that is also a password or PIN lock code but no capture proof", and an `addCapture` twin. That is the second warning in step 3 item 5. `CaptureModel.lock_codes` and `hard_access_values` already collect lock answers, keyed on each node's own `lockType`, so they miss door entries that inherit one. Step 3 item 6 ("adds no validator check, so step 3 starts from nothing") is no longer true. As written, step 3 would print that warning twice.
- **unlock-gaps-r1 touches two more files** that this plan changes: `doors.js` (adds `cryptexConfig` to the door properties, entry else connected room) and `generate_dungeon_graph.rb` (lock labels). Step 5 deletes the graph script's binding class.

**Fix.** Regenerate the table at merge time from `git for-each-ref` and `git merge-tree`, and record the time. Add an order rule: unlock-gaps-r1 and sync-deltas go in separate batches, and the second rebases. The resolution keeps sync-deltas' no-echo answers, keeps `client_inventory` (answers stripped) for the bootstrap's `playerInventory`, and checks that no unlock-gaps-r1 client code reads the echo. Rewrite step 3 items 5 and 6: the proof warning exists (do not add it again), and only the "no `targetId` and no `addCapture` mapping" warning is new. Step 3 builds its answer set on `CaptureModel.lock_codes`, extended to resolve door entries from the connected room and to cover combination and cryptex, so the server and the validator share one list.

### M6. Section 7 does not map to q83 and q84

**Section:** 1 (out of scope), 6 item 3, 7, 8.

**Evidence.** q83 is the access and office-life consolidation (one owner, one outage field, habits folded). q84 is closing the older core kinds, plus `formatVersion`. Section 7 has five subsections with no question labels, and section 6 item 3 folds both questions into one line. There are three specific problems:
- 7.5 (drop dead fields, up to 146 scenarios) belongs to neither question, yet 7.4 says it runs "after 7.5 removes or declares the dead fields". A yes to q84 therefore approves 7.5 without saying so.
- Section 8 starts the `formatVersion` slice only for "a migration in section 7 that rewrites stored data". 7.4 says "Stored games: none for the closure itself". Under the plan's own rule, a yes to q84 would not start `formatVersion`, though q84 asks for it.
- Section 6 does not say which questions need the upgrader. q83 needs it (7.1 and 7.3 rewrite stored fields, and 7.3 needs the raw-shape handling in section 8). q84 needs it only if an alias is retired.

**Fix.** Head the subsections "q83: 7.1, 7.2, 7.3" and "q84: 7.4, with 7.5 as its first step, and `formatVersion`". For each question, give its size, scenario count, owners touched, and whether it brings in the upgrader. Split q84 so the user can say yes to the cheap part alone: the `formatVersion` field in the schema, set to 1 in every template, with a validator warning for a missing value. That part needs no upgrader. The upgrader slice starts with the first step that rewrites stored data (q83, or a q84 alias retirement). Change section 8's trigger sentence to match.

## Minors

### m1. B1 is right for the client and the filters; the server reads only the connected room

**Section:** step 3 "How a lock type is resolved", item 3; 6a `lockTypeFrom`.

**Evidence.** The server validates a door unlock against `room_data(target_id)` alone (`game.rb` `validate_unlock`, lines 2617-2677, and the rfid and mastermind helpers at 2220, 2804 and 2816). It never reads a door entry's `requires` or `lockType`. `set_pin_length!` fills `pinLength` only on a hash with its own `lockType` of pin. The client also matches an entry only when both `connectedRoom` and `direction` match (`doors.js:492-494`), and `NpcHabits.doorway_problem` (`npc_habits.rb:237-254`) already names the entries it never reads. A door entry whose own `lockType` or `requires` differs from the connected room's shows the player one lock, while the server checks another.

**Fix.** Say in step 3 that a door entry's `requires` is a client-side value (the gate sign, clone-as-entry) and that the server always checks the room. Add a warning: a door entry whose resolved lock type or `requires` differs from its connected room's ("the server checks the room's lock"). Resolve only entries that `doorway_problem` returns nil for; an entry it flags is dead, and the existing warning covers it. Both corpus entries match their rooms, so the warning adds no lines.

### m2. The binding table misses three bare renders and the trim mode

**Section:** step 5 table.

**Evidence.** These render a template with plain `ERB.new(...).result` and no binding: `scripts/ink_runtime_check/sis02_multicall.mjs:67`, `test/js/validator-office-presets.test.mjs:85` (test_needs_sims) and `test/js/validator-action-condition.test.mjs:134` (test_exercise_station). They work only because those templates call no helper. They break when a template adopts `json(...)`. `tools/pass2/render.rb:8` and `scripts/check_door_alignment.py:76` use `trim_mode: '-'`, but the server (`mission.rb:209`) does not. No template uses `-%>` today.

**Fix.** Add the three to the table, each moved to the lib one-liner. `ScenarioBinding.render` uses the server's ERB options (no trim mode), and the build log notes that the two trim-mode callers lose it.

### m3. Step 1's audit misses `INVALID:` assertions without the cross mark, and five skills

**Section:** step 1 items 2 and 9, Tests.

**Evidence.** Six assertions match `INVALID:` with no `❌`, and they break when the label becomes `❌ ERROR:`: `validator-mission-result.test.mjs:44,61,74`, `validator-mission-scoring.test.mjs:41` and `validator-pin-locks.test.mjs:40,48`. Six skills mention `❌` or `INVALID`: validate-scenario, scenario-design-review, mission-puzzle-chains, walkthrough-scenario, npc-dialog-review and break-escape-dungeon-graph. Item 9 names only validate-scenario.

**Fix.** The audit is "every test matching `INVALID`, `❌ SOCIAL` or `❌ ERROR`". Propose wording for all six skills.

### m4. Step 2: one live unknown key, blocks already closed, a boolean, and a double report

**Section:** step 2 Why and Change.

**Evidence.**
- On main, NPC `feed` carries `order` in 5 test_access_social NPCs, and main's schema does not declare it (`lib/break_escape/access_work.rb:401` reads it). c3-replies declares it. So "none expected" holds only after C3. The plan's check covered `resources`, `networks`, `wifi` and `policies`, not `feed`.
- `screenHabit`, `printHabit`, `usbHabit` and `frustration` already have `additionalProperties: false` on main.
- `portSecurity` is a boolean, so there is nothing to close.
- With `additionalProperties: false`, json-schema prints its own error for each unknown key, and item 2's pass would print the key again with its suggestion. Under step 1's count, that is two errors for one slip.

**Fix.** State that step 2 lands after C3 (the merge order already implies it) and that the corpus check covers every block on the list. Drop `portSecurity`, and mark the four blocks that are already closed as "add `^_` only". The pass rewrites the schema's `additionalProperties` message in place and does not add a second line.

### m5. A passed `reviewBy` turns the whole JS suite red on every branch

**Section:** step 1, known-failures node test.

**Evidence.** CI's "Whole test/js suite" and "Social and validator tests" jobs (`ci.yml:105,113`) run every `test/js/validator-*.test.mjs`. A date passing turns main and every open branch red at once, with no code change, including branches with nothing to do with the list.

**Fix.** Outside the merge batch, a passed `reviewBy` is a test warning (printed and skipped). It fails only when `MERGE_BATCH=1` is set, which the orchestrator sets.

### m6. The payload scan's value check should use leaf equality, not response text

**Section:** 6a Tests.

**Evidence.** "No authored secret value appears in the response text" means a substring search. Four-digit PINs then match coordinates, sizes, timestamps and ids (for example `4471` inside `14471`).

**Fix.** Use step 3's rule: equality with a string or number leaf, or a whole word inside a string when the answer is 6 or more characters.

### m7. The nested client-read scan costs more than it finds

**Section:** 6a Tests, "Under the top level".

**Evidence.** Reads on main of names that would be marked `x-serverOnly`: `.contents` 67, `.requires` 46, `.flags` 38, `.password` 21, `.role` 21, `.feed` 18, `.awareness` 17, `.secret` 13, `.answer` 8, `.combination` 6. A name scan cannot tell an rfid `requires` from a PIN `requires`, so the reviewed allow list starts at about 250 entries and tells little. B1's fixed payload scan catches the actual leak.

**Fix.** Keep the top-level read scan, which is precise. Drop the nested name scan, or run it as a report with no assertions.

### m8. Printing every section after a schema failure needs crash handling

**Section:** step 1 item 4.

**Evidence.** The common checks assume schema-shaped data (for example `rooms` as a Hash, `objects` as Arrays). Today they never see data that failed the schema, because the run exits first. A `NoMethodError` in one check would end the run with a stack trace and hide the sections after it.

**Fix.** Each section runs under a rescue. An exception prints `❌ ERROR: <check name> could not run: <message>` (it counts) and the run continues. Add a node test with a schema-invalid `rooms` value.

### m9. `build/phone-calls` is missing from the merge table

**Section:** 5.

**Evidence.** `build/phone-calls` (156 ahead) and `build/phone-calls-writing` (159 ahead) touch `validate_scenario.rb`, `mission.rb`, `game.rb`, `games_controller.rb` and `tts_line_extractor.rb`. Their base is 552c2d718 (11 November), and both conflict with main itself (`git merge-tree main build/phone-calls` exits 1). Step 1 renames labels across `validate_scenario.rb`, and step 5 moves the binding out of `mission.rb`.

**Fix.** Add them to the table. Note that they must rebase onto main before step 1 or step 5 lands, or that whoever merges second redoes the label rename on their lines.

### m10. Combination answers are arrays; "compared as text" does not cover them

**Section:** step 3 items 1 and 2.

**Evidence.** On unlock-gaps-r1, a combination lock's `requires` is a list of integers such as `[12, 30, 5]` (schema diff, and the server compares numbers, `game.rb` about line 2552). A cryptex compares case-insensitively (`casecmp?`, about line 2564). The step 3 rule compares "string or number as text", so an array never equals a global, and `WOLF` in a global does not match a cryptex `wolf`.

**Fix.** Define the text forms: a combination matches a global or leaf holding the numbers in order in any common form (`12-30-5`, `12 30 5`, `12,30,5`, or an equal array). A cryptex answer and a password are compared case-insensitively for the leak check (stricter is safer here). Add a fixture for each.

### m11. The leak check can flake on `@random_pin`

**Section:** step 3 ("an `@random_pin` copied into a global is caught within the same render").

**Evidence.** sis01_healthcare renders `backup_pin = @random_pin` (`scenario.json.erb:127`), and the validator binding draws `rand(1000..9999)`. A random PIN that happens to equal a four-digit leaf elsewhere in `minigameData` (a year, an amount, a slot) gives a one-off error. Once step 1 makes errors fail the run, that is a flaky merge batch.

**Fix.** The leak check renders a second time with fixed sentinel values for `random_pin`, `random_password` and `random_code` (values that no authored leaf can hold) and compares on that render. The "copied in the same render" case still shows, because the sentinel appears in both places.

### m12. The status line and some line numbers have drifted

**Section:** header; step 1 Why.

**Evidence.** The header says code references are to 13a0f9f96. On 72e26f911 the ink stage's early exit is near `validate_scenario.rb:6780` (the plan says 6786), and the success exit is at 7052.

**Fix.** Re-anchor the references on the main the build starts from, and say which commit that is.

## Nits

- **n1.** Known-failures `scenario`: say it is the repo-relative template path (`scenarios/<dir>/scenario.json.erb`), the form the validator receives.
- **n2.** 6b cache: say where the stripped copy lives (Rails cache or process memory) and how it is bounded, so it cannot grow with the number of games.
- **n3.** Section 3.1's escape-room heading says "last edited September and October". Give the commit or date the owner check uses, so the orchestrator can tell whether the track is still active.

## Does any "safe now" step still break something?

- **Saved games.** No. Steps 1 to 5 and 6a change no runtime code (step 5's renderer runs only at game creation and is equal by construction), so stored `scenario_data` and player_state are untouched. M3's bootstrap line removes a key the client never reads.
- **Scenarios.** Step 2 before C3 breaks test_access_social (m4). The order already puts C3 first; keep it a hard dependency.
- **CI.** Three ways: the `reviewBy` date (m5), stale entries on `--skip-ink` runs (M2), and the six `INVALID:` assertions (m3) if the audit stays as written. With those fixed, no step turns CI red by itself.

## Value for cost

Steps 1, 2, 3 and 5 are good value: they are cheap and catch real classes of bug. Step 1 is the largest because of the 41 fixture lines, and it carries the most process (M1, M2). Step 4 is fair at M, and its warnings stay advisory until the five scenarios are fixed. 6a is worth its cost only with B1 fixed. Without it, the payload scan is the expensive part (a game per scenario) and inspects the wrong state. The nested name scan (m7) is the one piece to cut. Deferring the upgrader and making 6b conditional both stand, provided the scan feeding the 6b decision can see locked content.
