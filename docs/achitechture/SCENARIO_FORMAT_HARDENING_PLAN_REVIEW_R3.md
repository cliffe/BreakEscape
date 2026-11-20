Counts: 0 blockers, 2 majors, 9 minors, 2 nits.

# Scenario format hardening plan: review round 3

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` at 071d0584e (Draft). Date 2026-11-12. Code read on main 33c003230 with `git show main:<path>`; branch facts from `git rev-list`, `git diff main...<branch>` and `git show <branch>:<path>`. Reviews R1 and R2 were used only to check that their findings are closed.

The orchestrator's ruling stands: step 3 may change the server so that a capture secret equal to a door-entry, combination or cryptex answer is withheld until its proof holds. This review checks whether the plan's tests and corpus check prove that no served capture changes.

## Round 2 findings: status

| R2 | Status |
|---|---|
| B1 payload scan never sees a locked room | Resolved in design (two states, unexplained refusals fail). The opened state still misses several payloads (M2). |
| M1 known failures by process only | Resolved: `approved`, merge-batch diff check, swaps accepted. Pass rollover breaks it (m3). |
| M2 partial runs fail as stale | Resolved: `stage` and the `not checked` line, with tests. |
| M3 `acknowledgedClues` | Resolved: `global:` gated on q85, self and contents rejected, counted, deleted from the bootstrap with a route test. |
| M4 client-read scan | Mostly resolved: alias scan, `name` row, 7.5 seed note, `SERVER_BOOTSTRAP_KEYS`. Two gaps remain (m4, m5). |
| M5 merge order and step 3 items | Resolved: table regenerated per batch, unlock-gaps-r1 and sync-deltas in separate batches, step 3 builds on `CaptureModel`. The description of `CaptureModel` is wrong in a way that matters (M1). |
| M6 section 7 versus q83 and q84 | Resolved. One sizing gap in q84 (ii) (m7). |
| m1 server reads only the room | Resolved. |
| m2 bare renders and trim mode | Resolved. |
| m3 audit and six skills | Resolved. |
| m4 step 2 corrections | Resolved. |
| m5 `reviewBy` turns CI red | Resolved (`MERGE_BATCH=1`). |
| m6 leaf equality | Resolved. The exemption clause needs tightening (M2). |
| m7 nested name scan | Resolved (dropped). |
| m8 crash handling | Resolved in principle. The rescue is too coarse and can be listed away (m2). |
| m9 phone-calls branches | Resolved. |
| m10 combination and cryptex forms | Resolved for the validator. Unspecified for the server (M1). |
| m11 `@random_pin` flake | Partly resolved. The sentinels miss the templates' direct `rand` calls (m1). |
| m12 anchors | Resolved (33c003230). |
| n1 to n3 | Resolved. |

## Majors

### M1. Step 3's server change names the wrong function, misses the account gate, and its corpus check cannot prove that no served capture changes

**Section:** step 3, "The answer set is shared with the server", item 6, Tests (Rails), Live proof; section 9, fifth risk.

**Evidence.**
- **The server's capture withholding does not read `lock_codes`.** `Game#authored_capture_secret` (game.rb:1265) withholds a non-account secret through `hard_access_capture_value?` (game.rb:1281-1285), which calls `CaptureModel.hard_access_values`. That function has its own walk over `HARD_ACCESS_LOCK_TYPES` (capture_model.rb, `hard_access_values`) and does not call `lock_codes`. The plan says `hard_access_values` is "those plus rfid and biometric `requires`, Wi-Fi PSKs and flag values", which reads as if it contains `lock_codes`. It does not. Extending `lock_codes` alone, as the step's bullets and the ninth-section risk say ("The extended `lock_codes` withholds secrets..."), changes nothing in `authored_capture_secret`.
- **`lock_codes` drives a different server path: account passwords.** `CaptureProofs#account_password_opens_something?` (capture_proofs.rb:86-87) calls `CaptureModel.password_opens_lock?`, which tests `lock_codes`. In a scenario that declares proofs, an account whose password opens something is served only once a proof holds. So extending `lock_codes` changes when account passwords are served (a password equal to a combination or cryptex answer becomes withheld), and the plan never mentions accounts. The corpus check ("no capture currently served changes its served state") and the Rails tests cover only non-account secrets.
- **No server comparison rule for the new kinds.** Both sets are `Set`s of strings probed with `include?` (exact match). `lock_codes` keeps only a `String` or `Integer` `requires`, so a combination written `[12, 30, 5]` is dropped. `hard_access_values` runs `Array(value)` over `requires`, so if `combination` were added to `HARD_ACCESS_LOCK_TYPES` it would add `"12"`, `"30"` and `"5"` as separate values and withhold any capture secret `"5"`. The server already has the right rule for an answer: `Game.lock_answer_matches?` on build/unlock-gaps-r1 (game.rb about 2550: combination compared as its numbers in order, cryptex by `casecmp?` after `strip`). Step 2's text forms are written for the validator only.
- **The corpus check has no method.** "No capture currently served changes its served state" needs to say what is compared. A capture's served state on the record alone is a pure function of two predicates: for a non-account writer with no `proof`, `hard_access_capture_value?(secret)`; for an account holder in a proof-declaring scenario, `password_opens_lock?`. A diff of those two predicates, old against new, over every writer and every account holder in the corpus, proves the claim with no game state. The plan does not say this, and a builder who compares the two `lock_codes` sets (which the plan also asks for) will see them differ by design and learn nothing about serving.
- **The live proof does not exercise the change.** lab_physical_pentest's shoulder-surf secret is Len's records PIN on a `pin` lock, which is withheld on main today. Playing it proves no regression, but no corpus scenario holds a capture equal to a combination, cryptex or untyped door-entry answer, so nothing live shows the new withholding.

**Fix.** Rewrite the step 3 paragraph and the matching risk:
- Name both server paths. `hard_access_values` gains door-entry resolution and combination and cryptex answers; it serves `authored_capture_secret`. `lock_codes` gains the same; it serves `password_opens_lock?` (account gate, `capture_proofs.rb:87`), the validator's proof warning (validate_scenario.rb:6237) and `validate_capture_log.rb:62`.
- Add one plain-Ruby normaliser in `CaptureModel`, `answer_key(lock_type, value)`: for `combination`, the numbers in order joined by `-` (`[12, 30, 5]`, `"12-30-05"`, `"12 30 5"` all give `"12-30-5"`), matching `Game.lock_answer_matches?`; for `cryptex` and `password`, `strip.downcase`; otherwise `to_s`. Both sets hold keys, and both probes (`hard_access_capture_value?`, `password_opens_lock?`) normalise the secret or password with every applicable form before `include?`. `Game.lock_answer_matches?` then calls the same normaliser so the server has one rule.
- Define the corpus check: for all 176 rendered and prepared scenarios (one render each, shared by old and new code), list every capture writer with an authored secret and no proof, and every account holder in a proof-declaring scenario; record `hard_access_capture_value?` and `password_opens_lock?` under main's `CaptureModel` and the new one; the build log shows the list and the expected empty diff.
- Rails tests, on top of the two in the plan: a combination authored as an array with a capture secret `"12-30-5"`; a cryptex `wolf` with a secret `WOLF`; a capture secret `"5"` beside a combination `[12, 30, 5]` (still served); an account password equal to a combination answer in a proof-declaring scenario (withheld until the proof holds); the same account in a scenario with no proofs (served, as today).
- Live proof: keep lab_physical_pentest as the no-regression run, and add one run on a test scenario that carries a `usePayload` secret equal to a combination answer (a fixture added to this build's own test scenario, never to test_unlock_gaps without its owner), showing the secret only from `/capture_secrets` after the proof.

### M2. The opened state does not reach every payload, so "covers every payload a route can ever send" is not true, and the value check may never fire

**Section:** 6a Tests (payload scan), "What 6a's scan settles"; section 9, sixth risk.

**Evidence.**
- **Rooms and plain containers: reached.** `GET room/:id` admits a room in `unlockedRooms` (games_controller.rb:491-500). `check_container_unlocked` matches `unlockedObjects` by id only (games_controller.rb:2111-2117), so seeding every id at every depth reaches every plain container that has an id. The test must take the ids from the created game's `scenario_data` (after `prepare_scenario_data!`), not from the template.
- **Sign-in PC desktops: one identity per session.** A sign-in PC is "opened by a session, never by `unlockedObjects`" (games_controller.rb:552-554), and `render_login_desktop` serves "its own contents, then each profile admitted for the session's identity" (comment above games_controller.rb:2129). Seeding one session per PC reaches one account's profiles. Other accounts' profiles on the same PC are never fetched.
- **Switched-off PCs.** `desktop_refusal` returns `'off'` for a PC that is off (q72), driven by globals or resource outages. A refusal there either fails the opened state or gets listed, and its desktop is never scanned.
- **Routes the scan never fetches.** The plan fetches `GET scenario`, `GET room/:id` and `GET container/:id`. These also serve authored scenario data: `GET network` (the view per foothold, where `x-servedBy: "GET /network"` is meant to apply), `GET login_accounts`, `GET scenario_map`, `GET objectives` and `POST friendface_phone`. `x-servedBy` is therefore never exercised: the scan asserts an exception for routes it does not call.
- **Inventory.** The bootstrap's `playerInventory` is `player_state['inventory']` as stored (games_controller.rb:408), and the inventory route echoes it. Items reach it through `canonical_inventory_item` (games_controller.rb:2236), which filters today. The opened state seeds no inventory, so a future pickup path that stores an unfiltered copy would not be seen.
- **The exemption can swallow every leak.** The value rule passes a secret "if the same value is also authored in a client-visible field". Every response leaf comes from an authored field. If the leaf's own source field counts, the rule never fires: a `cryptexConfig.answer` copy (the class `strip_lock_answers!` exists for) is an unmarked, authored field holding the answer.
- **No proof the scan can fail.** Nothing in 6a shows that the scan finds a leak when one exists. A scan that reports "no gap" across 176 scenarios is the input to the 6b decision.

**Fix.**
- In the opened state: for each sign-in PC, one fetch per account the PC admits (`pc_admits_account?`), with that account's session seeded; seed every resource outage and `offWhen` global to its "up" value, so no PC is off, and list any that stays off with a reason; add every collectible item to the inventory through `add_inventory_item!(canonical_inventory_item(...))` (the real pickup path), then scan `playerInventory` in the bootstrap.
- Fetch `GET network` for each seeded foothold and `GET login_accounts` for each sign-in PC, in both states; these are where `x-servedBy` is asserted. Leave `scenario_map`, `objectives` and `friendface_phone` out only with a line each in the test saying what they serve and why it carries no authored secret.
- Reword "What 6a's scan settles" to name the routes scanned, and say that 6b's decision rests on those routes.
- State the exemption precisely: a leaf passes only when the value is authored at a different path that step 3's leak check does not flag (not `globalVariables`, `minigameData` or `scenarioData`), or is covered by an acknowledged clue. The leaf's own source path never exempts it.
- Add a mutation test that runs with the scan: on a copy of test_unlock_gaps with `strip_lock_answers!` stubbed to do nothing, the scan must fail on the `cryptexConfig.answer` path; on a copy of m01 with the `requires` strip stubbed out, it must fail on a PIN door. Both are tagged with the scan and run when it runs.

## Minors

### m1. The sentinel render misses the templates' own `rand` calls

**Section:** step 3 item 3; step 5 item 1 (`sentinels: true`).

**Evidence.** Only sis01_healthcare uses a binding random value (`backup_pin = @random_pin`, scenario.json.erb:127). The same template draws `itsec_pin` and `clinical_pin` with `Kernel#rand` (lines 124-126). lab_tesseract_trials draws PINs, tokens and hole numbers with `rand` and `Array#sample` (scenario.json.erb:28, 76, 92, 93, 112). Sentinels for `@random_*` do not touch these, so the one-off false error R2 m11 described remains possible on both scenarios once step 1 makes errors fail the run.

**Fix.** Drop the sentinels and the `sentinels: true` option. The leak check renders twice, under `srand(1)` and `srand(2)` (both `Kernel#rand` and `Array#sample` use the default generator), and reports a match only when it appears in both renders. A real copy shows in both; a coincidence almost never does; and the result is the same on every run. `SecureRandom` values (`@random_password`, `@random_code`, tesseract's keys) are 8 or more characters and cannot collide with a short leaf in practice. Replace the sentinel fixtures with: a `rand` PIN copied into a global (caught); a `rand` PIN equal to a leaf under one seed only (no finding).

### m2. The rescue is per stage, and a `could not run` line can be listed away

**Section:** step 1 items 4 and 5, the known-failures list.

**Evidence.** The common stage is one array built from 19 check calls (validate_scenario.rb:6949-6970 on 33c003230), including `ValidateNpcNeeds`, `ValidateAccessWork` and `ValidateNpcHabits`. A rescue around the stage loses every check after the one that raised, which is the "second wave of errors" step 1 sets out to remove. Separately, an entry `{ "stage": "common", "match": "could not run", "count": 1 }` passes the node test as specified, makes a crash green, and marks every other common entry for that scenario as not checked.

**Fix.** Wrap each check call, not each stage: one rescue per `common_issues += ...` line and per ink, schema, habits, work and social call. In the node test, reject any entry whose `match` is found in a `could not run`, `stale known failure` or `Result:` line, or is a prefix of `❌ ERROR:` alone; the validator also never lets an entry match those lines. Add a fixture: a listed `could not run` still exits 1.

### m3. `approved` breaks at the next pass, and the AGENTS.md line it edits does not exist

**Section:** step 1, the known-failures list (`approved`, node test), item 9.

**Evidence.** The node test reads the log path from CLAUDE.md's "Current pass" line. When the pass moves to PASS5, every entry's heading is in the PASS4 log, and the test fails on main and every branch in the same commit. The PASS4 log is the m02 to m08 editorial log (six headings); engine sign-offs would sit in a mission log. AGENTS.md on main has no "count every `❌`" line; that rule is in the builders' common brief.

**Fix.** `approved` holds `"<repo path>#<heading text>"`, and the test checks that file and heading, whatever the current pass. Item 9 edits the common brief's validator line and proposes it to the orchestrator; AGENTS.md gains the merge-batch checklist only.

### m4. The `SERVER_BOOTSTRAP_KEYS` node test as written pulls in `objectives`

**Section:** 6a, "Server-added bootstrap keys".

**Evidence.** The test compares the constant with every `filtered['<k>'] =` in the controller's `scenario` action and in `filtered_scenario_for_bootstrap`. The controller has 26, as the plan says. The model has two: `characterSprites` (game.rb:1101) and `objectives` (game.rb:1149, `filter_target_flags`). `objectives` is authored and belongs in the schema with `x-client: true`, so the test forces it into a constant that is meant to hold only non-authored keys.

**Fix.** The test collects the assignments and drops any key the schema declares at the top level; the remainder must equal the constant.

### m5. The client-read scan misses the bootstrap passed as an argument

**Section:** 6a Tests, node top-level client-read scan.

**Evidence.** On main the bootstrap is passed into functions whose parameter reads top-level keys: `syncScenarioPlayer(window.gameScenario, ...)` (player.js:141) reads `scenario.player`; `op.presetsOn(window.gameScenario)` (game.js:2020) reads `officePresets`; `resolveCreditsTheme` and `scenarioCreditsOverlay(window.gameScenario, ...)` (bond-visualiser.js:1735, 1757) read `creditsTheme` and `creditsOverlay`; also `cctvFeeds`, `collectCharacterSprites` and `endingReplayOptions`. An assignment scan never binds these parameters. If bound names are matched across all files, the plain name `scenario` happens to match some of them and also matches unrelated variables; if per file, they are missed.

**Fix.** Bound names are per file. Add a call-site pass: any call that passes a bound name (or `window.gameScenario`) as an argument names a function and argument position; the test holds a list of those functions with the parameter name, and the scan treats that parameter as bound inside the function. A call site not in the list fails, as a new alias does.

### m6. Step 3's flag answers are empty in the validator until step 5

**Section:** step 3 item 1; section 5 order, item 5.

**Evidence.** `hard_access_values` reads top-level `flags` as a Hash of Hashes (capture_model.rb, `flags.each_value { |group| group.each_value ... if group.is_a?(Hash) }`). The validator's `vm_flags_json` returns an array (validate_scenario.rb:102-104), so in the validator every VM group is skipped and no flag value enters the answer set. The server builds `{ "flag_1": ... }` (mission.rb:401-409). Steps 3 and 5 are listed as parallel.

**Fix.** Step 3 lands after step 5, or its collection reads a group as either a Hash's values or an Array. Say which in section 5.

### m7. q84 (ii) leaves out the work that 7.5's title-field move needs

**Section:** section 6 item 4 (ii); section 7 table; 7.5.

**Evidence.** 7.5 moves title fields to `mission.json` only after `npcNeedsSeed` is written into every needs scenario and `bond-visualiser.js` reads the name from `breakEscapeConfig`. That is an engine change and extra scenario lines. Section 6 calls (ii) "mechanical, no upgrader" and the table lists no engine owner.

**Fix.** Either take `scenario_name` and `name` out of 7.5 (they stay, declared `x-client: true`), or add "one client change (`bond-visualiser.js`) and an `npcNeedsSeed` line in each needs scenario" to (ii) and the table. The first is cheaper.

### m8. Value for cost: 6a carries 6b's preparation

**Section:** 6a; section 1 table.

**Evidence.** 6a's own text says the `x-client` marks change nothing at runtime and "state what 6b would do". The client-read scan and `SERVER_BOOTSTRAP_KEYS` protect only a top-level allow list, which exists only in 6b. 6b may never start. The payload scan, with M2's fixes, is what finds leaks.

**Fix.** 6a keeps: the `x-serverOnly` marks (the payload scan's path check uses them), the two-state payload scan with its mutation tests, and the "every top-level key is declared" node test. Move the `x-client` marks, the client-read scan and `SERVER_BOOTSTRAP_KEYS` to the start of 6b. 6a drops from M to S+.

### m9. Value for cost: `formatVersion` in 176 templates buys nothing before the upgrader

**Section:** section 6 item 4 (i); section 7 table; "`formatVersion` alone".

**Evidence.** The engine does not read the field, old games read as version 0 either way, and every template in the repository is migrated in the same commit as the code that changes the format, so the template's own number adds nothing the server cannot stamp. The cost is a one-line edit in every track's files, including m01 to m10.

**Fix.** Offer (i) as: when the upgrader slice starts, `generate_scenario_data` stamps `formatVersion` into `scenario_data` at creation, and templates carry none. Drop the 176-file edit from the questions, or keep it as an option and say it is not the cheap one.

## Nits

- **n1.** Section 5's tips have moved since 15:23: build/unlock-gaps-r1 is at 387e6f14a (12 ahead; it now merges 33c003230 in), build/sync-deltas at 10b0a88fd (29), build/phone-calls at 6e32014c6 (165). The plan regenerates the table per batch, so this needs only a refresh before the builder starts.
- **n2.** Step 3, "How a lock type is resolved": a door entry's own PIN that differs from its room's opens nothing on the server (it checks the room), so withholding a capture equal to it is harmless but adds nothing. Say so in one line, so a reader does not take it for a new lock.

## Does any step still break something?

- **Saved games.** No. Step 3's server change alters which capture secrets and account passwords are served, read from the authored scenario on each request, and stores nothing. M1's predicate diff shows whether any game would see a change.
- **Sync size.** Unchanged: steps 1 to 6a add nothing to player_state, step 3 deletes one bootstrap key, and 3b stays one bounded delta per declared global.
- **CI.** m3 (pass rollover) is the one remaining way a step turns main red with no code change.

## Value for cost

Steps 1, 2, 4 and 5 stand as planned. Step 3 is good value, and its server change is small once M1 names both paths and one normaliser. The plan has grown mostly in 6a and in step 1's process: m8 moves a third of 6a into the conditional 6b, m9 removes a 176-file edit, and m3 keeps the `approved` field cheap. With those, the plan's size matches what it protects.
