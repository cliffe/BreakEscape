Counts: 1 blocker, 7 majors, 8 minors, 3 nits.

# Scenario format hardening plan: review round 1

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` at ad8e00bf8 (Draft). Date 2026-11-12. Code read on main 13a0f9f96 unless stated; validator runs in the `build/schema-review` worktree (validator differs from main only by the q78 owner-claim warning, which adds no `❌`). Branch facts from `git log`, `git diff` against each merge base and `git merge-tree`.

## What was checked and held

- **The 62 lines.** Re-ran the validator over all 176 scenarios with the plan's flags (`--no-graph --skip-ink --no-lint`): 62 `❌` lines in the same 16 scenarios, every per-scenario count matching section 3.1, and the same 6 exit-1 scenarios as section 3.2. Read the lines themselves for 10 scenarios (test_access_social, sis01_healthcare, sis02_energy, lab_malware_metasploit, test-rfid-multiprotocol, test_behind_wall_fade, crypto1_captain_meow, biometric_breach, ceo_exfil, test_complex_multidirection): each message is what the table says.
- **Verdicts.** sis01: `ehr-terminal-minigame.js:197` only tests `med.interactionWarning` for truth, so a string is right and the validator walk is wrong. sis02: `log-filter-minigame.js:16-18,195` reads all three fields; `minigame-data-schemas.json:63` lacks them. lab_malware_metasploit: the tag is in neither `instructor.ink` nor `instructor.json`. test-rfid-multiprotocol: no `hacker-green` or `hacker-yellow` asset exists. test_access_social: validating it from an archive of `build/c3-replies` (its scripts, lib and scenario) gives 0 `❌`.
- **Step 2 "none expected".** Rendered every scenario and compared the keys of `resources.*`, `networks.*`, `networks.*.wifi` and `policies.*` with the schema: no unknown key anywhere.
- **Step 5 drift.** Confirmed. Server (`mission.rb:394-410`): `{"flag_1": ..., ...}`, and `'{}'` when a context is present but names no flags for that VM. Validator (`validate_scenario.rb:100-102`): `flags_for_vm`, so a plain array, and the fallback array when the VM is missing. 11 templates call it (m01 to m10 and test_simple_vm_flag). The one validator reader, `check_vm_flags_load_bearing` (`validate_scenario.rb:5752`), skips anything that is not a Hash, so its literal-to-ref map has always been empty.
- **Step 3's m08 finding.** An approximation of the step 3 rule over the rendered corpus finds m08 `suite_code` as the only global equal to an answer.
- **No textual conflicts.** `git merge-tree` of every pair among main, c3-replies, unlock-gaps, readme-93b, usepayload-secret and sync-deltas merges cleanly.

## Blocker

### B1. `requires` with no `lockType` is neither inert nor always secret: door entries read it (steps 3 and 6)

**Section:** step 3 item 3; step 6a, the conditional `requires` rule ("fail closed").

**Evidence.** The rendered corpus has 17 `requires` with no `lockType` outside `social` and conditions: the 15 unlocked PCs the plan lists, plus two `rooms.*.doors[]` entries carrying a card id, `lab_physical_pentest` `open_plan/doors[0]` (`cm_records_badge`) and `test_gate_tailgate` `office/doors[0]` (`test_staff_badge`, with a `gate` block). The client reads a door entry's `requires`: `doors.js:493-497` takes the matching `doors[]` entry as the door's lock properties, `doors.js:556` copies `requires` into the sprite, and `door-gates.js:310` and `doors.js:752` use `props.requires` to decide the gate's door sign. These entries have no `locked` key, so step 3 as written gives them the warning "inert; delete it", telling the author to delete a field the client uses. Step 6 strips any `requires` with no `lockType`, so both doors lose it in the room payload: a regression in a lab and the tailgate test. Today's filters keep it (they strip only when `lockType` is present and not biometric, bluetooth or rfid).

**Fix.** In both steps, resolve a `doors[]` entry's lock type from its connected room before applying either rule (the plan already asks the step 3 builder to confirm inheritance; make it a rule for step 6 too). A card, item or NPC id under rfid, biometric or bluetooth stays. Only a `requires` with no lock type on the entry or the connected room is "inert", and only on an object, never on a door entry. Add both scenarios to the step 3 fixtures and test_gate_tailgate to the step 6 live proof (walk through the gate once).

## Majors

### M1. The triage covers only `--skip-ink --no-lint`; the merge-batch rule runs ink

**Section:** 3, 3.2, step 1 "When it lands".

**Evidence.** The merge-batch rule runs the validator with `--no-graph` and ink on. Re-running all 176 that way: 14 scenarios exit 1 (the plan says 6) and 105 `❌` lines are visible before the early exits. The ink stage exits at `validate_scenario.rb:6786` before the common issues, so ceo_exfil now shows 4 `#give_item` errors (`scenarios/ink/helper-npc.ink`) and hides its 10 `targetKnot` lines. Not in the plan at all:

| Scenario | `❌` | Kind | Owner |
|---|---|---|---|
| lab_exploitation | 13 | ink: `**Heading:**` lines parse as choices, `//` comments cut lines | labs track |
| lab_post_exploitation | 12 | same | labs track |
| lab_feeling_blu | 10 | `//` in ink text | labs track |
| lab_vulnerability_analysis | 9 | both | labs track |
| lab_vulnerabilities | 3 | `//` | labs track |
| npc-sprite-test2 | 2 | `#give_item` with no matching itemsHeld | this build |
| ceo_exfil | +4 | `#give_item` in a shared ink file | escape-room owner |
| lab_malware_metasploit | +1 | `//` at instructor.ink:636 | labs track |

m01 to m10 are all clean with ink on (0 `❌`, exit 0).

Step 1 item 4 then prints every section after an ink failure too, so these scenarios will show further lines that are hidden today, as section 3.2 already says for schema failures.

**Fix.** Re-run the triage with the merge-batch flags (`--no-graph`, ink on, lint off: the lint is advisory and prints no `❌`), then once more with step 1's print-everything change, and table every line. The ink fixes are mostly mechanical (reword a `//`, attach a `**heading**` to a spoken line) but they are labs content, so they go to the labs track. Step 1's size goes from M to M+ on scenario edits.

### M2. Step 1 must carry the known-failures list the orchestrator has ruled on

**Section:** step 1 "When it lands", section 6 question 3, section 8 first risk.

**Evidence.** The plan offers waiting or "listed as known failing in the build log". The ruling is a dated list that the validator CI reads, each entry naming its scenario, the error and an owner, reviewed every merge batch and never added to silently. A build-log note does none of that. After M1 the list will hold labs and escape-room entries for some time, so how it works matters.

**Fix.** Replace the "When it lands" paragraph with:
- `scripts/validator_known_failures.json`: entries `{ "scenario", "match" (a substring of the `❌` line, stable across line numbers), "owner", "added" (date), "reviewBy" (date) }`.
- The validator reads it (`--known-failures <file>`, on by default in CI and the merge batch): a matched `❌` line still prints, marked `(known: <owner>, since <date>)`, and does not count towards the exit code; an unmatched one does. An entry that matches nothing fails the run ("stale known failure: remove it"), so the list can only shrink without someone deciding to change it.
- A node test pins the schema of the file and fails when an entry lacks an owner or date, or when `reviewBy` has passed.
- The merge-batch rule becomes "0 unlisted `❌`, and any change to the list is called out in the batch notes". Adding an entry needs the orchestrator's sign-off in the pass log.
- Step 1 lands once every line is fixed or listed; this build's own fixtures are fixed, never listed.

### M3. Step 3's corpus effect misses m06, and step 3 now starts from nothing

**Section:** step 3 "Corpus effect", item 4.

**Evidence.** `build/usepayload-secret` now has c18c1e605 (engine and tests) and c75096c5e (build log). It changes only `game.rb` and tests; it adds no validator check, so step 3 extends nothing. Its log reports, and my corpus scan confirms, that m06 `data_center/objects[0]/minigameData/withdrawals[2,8,12].slot` equal the custody console PIN (`data_center/objects[1].requires`). That is the deduction itself, but step 3's rule as written errors on it three times, failing a main mission no-one plans to change.

**Fix.** Add an explicit marker for a clue that is the puzzle (for example `"x-clueFor": "<lock object id>"` on the `minigameData` holder, or a top-level `acknowledgedClues` list naming the path and the lock), which the check accepts and reports once as a note. Expected corpus effect becomes "m08: 1 error, unless q85 rules; m06: 3 acknowledged clues once marked". Fold in the two validator warnings the branch log proposes (a non-account `usePayload` secret with no `targetId` and no `addCapture` mapping on its NPC, which the server can never serve; a capture secret that is a lock code with no `proof` in a scenario that declares proofs) and its proposal to teach `tools/playtest/lib/access_leak_scanner.rb` the non-account capture secrets. Rewrite item 4 as done: "the branch landed the server side only".

### M4. Step 6's guards against over-stripping point one way

**Section:** step 6a (`x-client` on top-level keys, fail closed), 6b, Tests (parity), Risks.

**Evidence.** The parity test allows the new serialiser to "remove more, never less". That catches a leak; it cannot catch the regression section 8 names, the serialiser stripping something the client needs. The client-read scan looks only for `x-serverOnly` names, so it misses a top-level key that ships today and loses its place because nobody set `x-client: true`. Rendered top-level keys that the schema does not declare, with scenario counts: `scenario_id` 94, `scenario_name` 94, `exportGlobals` 24, `importGlobals` 23, `description` 4, `name` 3, `globalItems` 2, `validSprites` 2, `timedMessages` 1, `showTitleScreen` 1. The plan names four of the ten. The client reads at least `scenario_name` and `name` off the scenario object, and `showTitleScreen` (title-screen-demo) by its name looks like a client switch. B1 is a live example of the same blind spot below the top level.

**Fix.**
- Make the parity test two-sided: it fails on every path the new serialiser drops that the old filters kept, unless that path is in a reviewed list in the test file with a reason (expected entries: none, or `requires` on legacy PCs).
- Extend the client-read scan to top-level reads (`gameScenario.<k>`, `window.gameState.scenario.<k>`, `scenario.<k>`): every key read must be `x-client: true`.
- List all ten undeclared top-level keys in 6a with a decision each, and run the payload scan against title-screen-demo and timed_messages_example.

### M5. Step 5 merges two of about nine ERB binding copies

**Section:** step 5 Why and Change.

**Evidence.** Besides the server and validator copies: `scripts/generate_dungeon_graph.rb:53-80` (its own class; `vm_flags_json` returns the fallback array, the same drift, and it feeds the dungeon-graph skill), `tools/pass2/render.rb:2-6`, `scenarios/lab_tesseract_trials/tools/render_scenario.rb:4-8`, `scripts/check_door_alignment.py`, and `scripts/ink_runtime_check/m02,m05,m07,m08_routes/route.js`. `tools/playtest/swap-scenario-game.rb` and three TTS tests already use `Mission::ScenarioBinding`, which the alias keeps working.

**Fix.** List every copy in step 5. The Ruby ones `require_relative` the lib class (graph generator, pass2, tesseract tool). The Python and JS ones either shell out to `ruby -e 'BreakEscape::ScenarioBinding.render ...'` or get a parity test against the lib class over m01 to m10. Add to the corpus check: the dungeon graph of the 11 `vm_flags_json` users before and after. Expect `check_vm_flags_load_bearing` warnings in m01 to m10 to change when the shape is corrected; record each change in the build log rather than calling it a bug by default, since that check has never seen a Hash.

### M6. Step 7's load-time upgrade has no lock, sees two data shapes, and the pilot cannot drop the fallbacks

**Section:** step 7 Change 3 and 5, Tests, Sync.

**Evidence.**
- "Under the existing game lock": `set_game` (`games_controller.rb:1754`) is a plain `Game.find`. `with_game_lock` is an `around_action` for some routes (line 93) that excludes `show` and `scenario`, the two that run first on a load, and the client fetches rooms while the bootstrap is in flight.
- "At creation, after `generate_scenario_data` and before `prepare_scenario_data!`": `generate_scenario_data` calls `prepare_scenario_data!` itself (`game.rb:4764`). At load, stored data has already been through `prepare_scenario_data!` (habits expanded, ids stamped). An upgrader step therefore sees raw data at creation and prepared data at load. Migrations 7.1 and 7.3 move exactly the fields `NpcHabits.expand!` fills.
- The pilot: `add_inventory_item!` (`game.rb:170-177`) stores the item hash in `player_state['inventory']`, so an old save's held key carries `key_id` there too. If player_state stays byte-identical, as the plan's own test requires, the client's `lockRef` fallback (`helpers.js:267`, plus `inventory.js:506`, `npc-game-bridge.js:44,247`, `objectives-manager.js:24`) cannot go: the restored inventory still says `key_id`.
- Sync (q77): `sync_state` loads only `SYNC_STATE_COLUMNS` (`games_controller.rb:783`) and never passes through `set_game`, so a player_state transform there can be bypassed. A tab opened before an upgrade keeps sending the old shape as deltas (sync-deltas c12d9d1e7 seeds "confirmed" from the bootstrap). Nothing maps old keys on the way in.

**Fix.** The upgrade runs in one helper called from `set_game` and from any route that reads `scenario_data` without it, as `@game.with_lock { reload; upgrade if still old }`, so a second request finds the work done. At creation, call it inside `generate_scenario_data` between `mission.generate_scenario_data` and `prepare_scenario_data!`. At load, run the steps and then `prepare_scenario_data!` again (it is idempotent, per its comment at `game.rb:1062-1067`), so a step is always written against raw-shaped fields. For the pilot, also rename `key_id` in player_state inventory items in place (same size, so q77 holds) and change the test to "player_state differs only by that rename", or keep the client fallback. Drop player_state transforms from the framework until a migration needs one; when one does, the bootstrap carries `formatVersion` and the client reloads on a mismatch from a sync answer.

### M7. Value for cost: defer step 7 and split step 6

**Section:** 1 (table), steps 6 and 7.

**Evidence.** Step 7 (M, engine, every load path) has one consumer, a pilot that touches no authored scenario and whose payoff is a fallback M6 shows it cannot yet remove. None of the section 7 migrations is approved. Step 6 (L) replaces filters that, once usepayload-secret and unlock-gaps are in, have no known leak left. Most of its protection comes from the annotations plus the payload scan over every scenario and route, which would have caught every leak the usepayload log lists.

**Fix.** Ship 6a with its payload scan and client-read scan as step 6 (S to M). Make 6b (one serialiser, deleting the lists) a follow-up that starts only if the scan finds a gap, or when a new secret-bearing block arrives. Defer step 7 until the user picks the first section 7 migration, and build it with that migration as its first real step; keep only the cheap parts now (the `formatVersion` field in the schema, the validator warning on `key_id`).

## Minors

### m1. Merge order is stale

**Section:** 5.

**Evidence.** `build/usepayload-secret` is committed (c18c1e605, c75096c5e), touches only `game.rb` and tests, and merges cleanly with every other branch. The plan puts it fifth, after steps 2 to 5, waiting for nothing. `build/unlock-gaps-r1` is the same commit as `build/unlock-gaps` (ef7a36534). `build/sync-deltas` (14 commits; `game.rb` 62 lines, controller 7) is missing from the table; it changes the bootstrap and sync paths step 7 hooks into. `build/c3-replies` also changes `validate_network.rb` (as does readme-93b), `validate_access_work.rb`, `validate_npc_habits.rb`, `validate_social/osint.rb` and `lib/break_escape/access_work.rb`, not only the schema.

**Fix.** Order: (1) c3-replies; (2) unlock-gaps, readme-93b and usepayload-secret, any order, one batch each; (3) sync-deltas, before step 7 if step 7 stays; (4) step 1; (5) steps 2 to 5; (6) step 6 (6a first); (7) step 7 if kept. Update the table with these facts, and note that c3-replies and readme-93b both touch `validate_network.rb` and merge cleanly.

### m2. The CI social job is red on main today

**Section:** step 1 "When it lands".

**Evidence.** test_access_social has a `social` key, and under `--strict-social` it exits 1 now (`✗ --strict-social: 1 social lint error(s)`, the duplicate `sign_f14`). The plan describes this as something that happens after step 1. It is already failing CI, and `--strict-social` is not a no-op today (`validate_scenario.rb:7005-7008`).

**Fix.** Say so. C3 is first in the order already; item 6 should read "after step 1, `--strict-social` adds nothing and stays accepted".

### m3. Step 1's test audit is too narrow

**Section:** step 1 Tests, item 2.

**Evidence.** 48 test files run the whole validator; their files hold 104 `status, 0` assertions. Some assert exit 0 next to a `❌` line, for example `test/js/validator-social-schema.test.mjs:158-159` (a `❌ SOCIAL: schema:` line with exit 0, the behaviour step 1 removes).

**Fix.** The builder lists every test that asserts exit 0 on output containing `❌` and updates each in the same commit as the switch.

### m4. Social schema errors become fatal without `--strict-social`

**Section:** step 1 items 3 and 4.

**Evidence.** `ValidateSocial.split_schema_errors` (`validate_social.rb:94-97`) moves `#/social` schema errors into the social lints, where they fail the run only under `--strict-social`. Under step 1 they fail every run. The corpus has none today.

**Fix.** State it in step 1 and keep the `❌ SOCIAL: schema:` text, since the existing tests match on it.

### m5. Step 6's cache key needs no digest

**Section:** step 6 Cost.

**Evidence.** The only write to `scenario_data` is at creation (`game.rb:4755`). A digest per request means serialising up to 363 KB, which is about what the cache saves.

**Fix.** Key by game id plus `formatVersion` (or `updated_at` if step 7 is deferred).

### m6. The keyPins note says the client tolerates absence; its fallback throws

**Section:** 3.1, notes on keyPins.

**Evidence.** `generatePinHeightsForLock` (`key-lock-system.js:169-182`) declares `const seed` and then runs `seed++`. Run in node, the same shape throws "Assignment to constant variable." It is reached from `assignKeysToLocks` (line 132) when a held key matches a lock with no `keyPins`.

**Fix.** The true-error verdict stands and gets stronger: say the fallback is broken, not untested. File a one-word engine fix (`let`) in the backlog rather than in this plan.

### m7. q85: the server-held globals step, as a candidate

**Section:** 6 question 1, step 3.

**Fix.** Add "Step 3b (candidate, waits for q85)": a top-level `serverGlobals` map, `{ "<name>": { "revealWhen": <condition> } }`, where a condition is one the server can check from its own records: a room in `unlockedRooms`, a task completed by a server route, a flag submitted, an item the server put in the inventory. The bootstrap and every sync answer send `""` for the global until the condition holds, then send the value once as a delta. A client write to a server-held global is ignored. Sync: one bounded string per declared global, no growth. The step 3 check accepts an answer held in a declared server global and errors on one that is not declared. The validator checks that `revealWhen` uses only server-checkable kinds and that no ink line reading the global can be reached before the condition. Tests: Rails (sent empty before, value after, client write ignored, reload before and after), node (validator), live proof on m08 through to the interrogation suite with `verify-run.rb`. Size M. Only m08 needs it today.

### m8. q86: what deleting the two scenarios involves

**Section:** 3.2, 6 question 2.

**Evidence.** Neither has a `collection`, so `db/seeds.rb` infers `default` and sets `published = true`: both are listed as playable missions wherever seeds ran. Removing a folder makes seeds offer the orphan delete (`db/seeds.rb:111-134`), which also destroys their games and Hacktivity listings. Nothing else in the repo refers to them except two docs.

**Fix.** Put these facts in question 2. If kept, fixing them is S (move the undeclared keys into the schema's form and add `"collection": "testing"` to `mission.json`).

## Nits

- **n1.** Section 3: name the flags in each table header ("62 lines with `--skip-ink --no-lint`"), so the count is not read as the merge-batch count.
- **n2.** Step 3 item 4 and the merge table still say usepayload-secret has no commits.
- **n3.** Step 6 live proof: name the capture scenario. It is lab_physical_pentest (Ruth's mapping for Len's records PIN), which the plan already lists, so the run needs the shoulder-surf beat played, not a separate scenario.
