# Review R2: integration, buildability, tests and validator

Target: `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` (round 1 folded in, 2026-10-22, 2487 lines). Lens:
fit with the ongoing SE build, packet buildability, tests and the validator. Read-only review,
2026-10-22. Plan line numbers are from the file as read today; `PLAN` is the target file. Code paths
are under `public/break_escape/js/` unless they start with `scripts/`, `test/`, `tools/`, `app/`,
`scenarios/` or a dot.

Working tree when read: `scripts/validate_scenario.rb` still holds another agent's uncommitted hunk
(`git diff --stat`: 20 lines). `README_scenario_design.md` and `tools/playtest/se/run-suite.sh` are now
clean. The m10 ink and scenario, `person-chat-minigame.js` and a new `person-chat-pending-reply.js` are
in flight elsewhere, and none of them is a Phase 10 file. `designs/12_deduction_board.md` and the whole
`deduction/` folder are untracked.

## Part A: round 1 closure

| R1I id | Closed | Evidence |
|---|---|---|
| R1I-1 | yes | `channels: { "person": "ded_b_tomas" }` (PLAN:638) matches `socialCharacter.channels.person: {type: string}` in `scripts/scenario-schema.json`. There is no tamper in B (PLAN:692-702, 714-715). The threshold effects (`setGlobal` + `clearOnRearm`, `endConversation`) are valid against `socialThresholdEffect`, and the character globals match `validate_social.rb:221-244`. I re-ran DL1–DL22 by hand on §4.9 and B passes. DL8 lands exactly on its limit (2 of 4 open, `ceil(0.5×4)=2`). One inconsistency is left in the note (R2I-5), but it does not change the result |
| R1I-2 | yes | One `.jsonl` per game, with job name = file suffix (PLAN:1561-1565). The `JOBS` strings are given per fixture (PLAN:2104-2108) and fit `run-suite.sh` (`name:scenario`, file guard `bridge-${j%%:*}.jsonl`). Reloads inside a script are possible (the `bridge-5.jsonl` pattern). The 600 px check is a new problem (R2I-2) |
| R1I-3 | yes | Tomás runs first (B1), then Lindqvist's gift (B2), then the HR cabinet (B3) (PLAN:1626-1631). Tomás has four topics (PLAN:1605-1610). Count elimination at B2 holds: with both grievance copies seen, Haddad and Morgan are F. The order of the cost relative to the answer conflicts with §7.2 (R2I-4) |
| R1I-4 | yes | `triggers` is added to `known_top_level` (PLAN:1074-1075, `validate_scenario.rb:257-261`), owned by P10-C1 with the foreign-hunk rule (PLAN:2087, 2141, 141-147) |
| R1I-5 | yes | The strict exit test covers triggers-only scenarios with a `TRIGGERS` error (PLAN:1075-1076, 2280-2282), and messages use the `❌ TRIGGERS:` prefix (PLAN:1079-1080, 1476). `Triggers.check` runs before the `social` return (`validate_social.rb:68`). Trigger *shape* errors take a different path (R2I-7) |
| R1I-6 | yes | P10-Q0 runs right after P10-W, before any fixture, with the engine commit after it (PLAN:2095, 139-140). Its scope does not cover the board's live paths (R2I-3) |
| R1I-7 | yes | P10-X1 scope (PLAN:2096, 588-613). The brief block, log and pointers are the orchestrator's, before wave 0 (PLAN:99-105, 2058-2059, 2146) |
| R1I-8 | yes | Schema cases go in `validator-social-schema.test.mjs` / `base.json` (PLAN:1487-1489). The temp `repo_root` follows `validator-social-pretext.test.mjs:48-68` (PLAN:1481-1485). Folders are `social_deduction/` and `social_triggers/`. The existing schema test's assertions need a note (R2I-7) |
| R1I-9 | yes | §2 "Files with other agents' edits" (PLAN:141-147); §10.3 tail (PLAN:2148-2154) |
| R1I-10 | yes | The §2 model list (PLAN:109-114) agrees with the §10.1 column for every row |
| R1I-11 | yes | Ids are F1–F4, K, T0, T, R1, R2 (PLAN:2052-2054). A grep finds no stale `P10-S*`, bare `P10-C` or bare `P10-H` outside the §14 log |
| R1I-12 | yes | DL1–DL22 throughout. No `N<n>` lint ids remain (grep) |
| R1I-13 | yes | D is specified in full (PLAN:1886-1953). P10-A covers all four fixtures (PLAN:2074). A K packet may edit its own conformance case (PLAN:2110-2112), though the owner table leaves that file out (R2I-11) |
| R1I-14 | yes | `bin/test-js` and its header are cited (PLAN:115-117, 2049, 2159). `bin/test-js:1-19` confirms the retry |
| R1I-15 | yes, with a residue | The grep is limited to player-facing strings (PLAN:2319-2322). The command cannot be run as described on the two JS files (R2I-13) |
| R1I-16 | yes | §7.7 (PLAN:1413-1420) and DL18 (PLAN:1537). Fixtures A and D give each dusted owner one object (PLAN:1700, 1918) |
| R1I-17 | yes | §7 intro (PLAN:1259-1263); §2 (PLAN:118-120) |
| R1I-18 | yes | C1/C2 and H1/H2 (PLAN:2078, 2086-2088). P10-U is now the largest single packet (R2I-14) |
| R1I-19 | yes | H1 runs after P10-A (PLAN:2078, 2131) |
| R1I-20 | **partly** | Waves 0 and 3–4 have an Inputs column (PLAN:2063, 2092, 2101), and the T0 rows give `JOBS` strings. Wave 5 (P10-X2, R1, Q, BL, R2; PLAN:2116-2122) still has none, although R1I-20 named waves 3–5. The T0 inputs name only `bridge-board-indicators.jsonl`, which has no reload. The model for a reload inside a script is `bridge-5.jsonl` (R2I-10) |
| R1I-21 | yes | Every test R1 listed is named in its packet's proof (PLAN:2076, 2077, 2086, 2094), and all of them exist. Two more readers of these files have turned up (R2I-9) |
| R1I-22 | yes | No fail replay (PLAN:879-885). The debrief reopens on `game_loaded` (PLAN:974-975), matching `main.js:157-166` |
| R1I-23 | yes | Header (PLAN:5-8); X1 after W, X2 after K-B (PLAN:2096, 2118) |

21 closed, 1 partly closed (R1I-20), 0 open. R1I-15, R1I-1 and R1I-3 are closed but each has a new
follow-on finding below.

## Part B: fresh findings

| Id | Severity | Plan section / line | Finding | Evidence | Suggested fix |
|---|---|---|---|---|---|
| R2I-1 | major | §9.4 stops and bridges (PLAN:1929-1939, 1967-1981); §11.6 (PLAN:2291) | Fixture D's bridges depend on wall-clock timers, and the plan gives no way to advance them. Timers count `Date.now()` from the start, or from `startOnGlobal`. Stop 1 fires 120 s after the start, and stops 2–4 fire 120 s after entering cars 2–4, so `bridge-deduction-d` must wait at least 480 s. On top of that come the shredded document, the backup recovery, the briefcase lockpick, dusting and the final call. `run-suite.sh` kills each bridge at `timeout 600`. `bridge-deduction-d-fail` has to reach car 4 to KO Volkov, and the doors open only on `d_stop_<n>` (§9.4 guard mappings). The test bridge has no clock or timer control, and no existing SE bridge moves timer time. | `ui/scenario-timer-dispatcher.js:27-35` (start from `Date.now()`), `:38` (`_timerStartTimes`); `run-suite.sh` `run_bridge` (`timeout 600`); `systems/test-bridge/index.js` (no clock API); grep of `tools/playtest/se/*.jsonl` for timer state: none | State the method in §9.4 and in P10-T0-D's row. Either the bridge shifts `scenarioTimerDispatcher.startTime` and `_timerStartTimes` back by `delayMs` through `eval` ("exercised, not earned", with a note), or the fail bridge sets `d_stop_1..3` with `writeGlobal` from the console. Keep at least one stop waited out in real time in the main bridge (D1), so the 30 s "slowing" hint and the fade are seen for real. Add the shift method to P10-F4's spike so it is proven in wave 0 |
| R2I-2 | major | §9.1 B8 (PLAN:1636-1637); §11.6 (PLAN:2293-2295) | "the 600 px layout" is asserted inside each fixture's main script. The harness fixes the viewport at launch (`--vw` / `VW`), and no command resizes it mid-run. That is why the SE suite runs `5-600:test_social_slice:600` as its own job with its own file. As written, B8 (and the same check in A, C and D) cannot pass. The "eight bridges" count and the `JOBS` strings are also incomplete. | `.claude/skills/playtest-scenario/scripts/playtest-session.js:142-151` (viewport from `VW` at launch); `run-suite.sh` JOBS `5-600:...:600`, `job()` passes `vw` | Move the 600 px check to its own script per fixture (or only for B, if one is enough): `bridge-deduction-b-600.jsonl` with JOBS `deduction-b-600:test_social_deduction_b:600`. Update §11.6's count and P10-T0-B's `JOBS` string. Alternatively, leave the narrow layout to the jsdom test and say so |
| R2I-3 | major | P10-Q0 and P10-Q (PLAN:2095, 2120); §11.8 (PLAN:2315-2319) | The regression gate before the engine commit does not exercise the files Phase 10 changes in live play. P10-H2 edits the board's `_render`, `rebuild`, `closeResult` and `getTestState`. P10-W changes `startIntelBoardMinigame`, which every case-file opens through. R0–R3 cover m01–m08, and none of those has a case-file. The scenarios that do have one are `lab_social_engineering`, `test_social_slice`, `test_social_board_indicators`, `test_social_docs_proof`, **m09** and **m10**. m10 is being edited by another agent right now. The jsdom board tests do not prove the live path (the "fix claims need live proof" rule). Q0's pass rule is also "every check as in the baseline", but no step records a Phase 10 baseline. `SUITE_RESULTS.md` already lists stale failures (bridge-1b 61/82, bridge-4 26/30, bridge-6 32/35), so without a fresh baseline those failures will be read as regressions, or the regressions missed among them. | `grep -l '"case-file"' scenarios/*/scenario.json.erb`; `systems/minigame-starters.js:1145-1164`; `tools/playtest/se/SUITE_RESULTS.md` tail; `IMPLEMENTATION_PLAN.md` §2.4 (R0–R3 scope m01–m08) | Add to wave 0: record a baseline of `bin/test-js` (whole suite), `tools/playtest/se/run-suite.sh` (the board-touching jobs at least: 1a, 3, 6, board-indicators, p7-episode) and the `--strict-social` list, all in the build log. Add to P10-Q0 and P10-Q: the same `run-suite.sh` jobs compared with that baseline, and a bridge open of the case-file in m09 and m10 (all four existing modes reach their first screen; Close gives no `minigame_failed`) |
| R2I-4 | minor | §7.2 pattern (PLAN:1284-1299) vs §9.1 Tomás and B1 (PLAN:1608-1610, 1626-1628) | The two sections contradict each other on when the cost lands. In §7.2 the cost comes before the answer: the influence change runs in the choice and the answer knot then checks `wary`, so "the third question crosses `wary`, so its answer is the vague one". §9.1 says "The answer comes before the cost", so question 3 answers and question 4 gets the vague line. B1 asserts the §9.1 version. B1 also does not name which topic is asked in which order, yet B2's "Tomás's pay topic is gone" only holds if the pay topic was the vague one. | PLAN:1286-1287, 1296-1299, 1608-1610, 1626-1628 | Pick one order and make §3.3, §7.2's ink and §9.1 agree. Write B1's order out: Q1 Okoro's grievance, Q2 Okoro's device, Q3 "Anything odd", Q4 pay (vague) |
| R2I-5 | minor | §4.9 hand check (PLAN:726) vs §8 "Room of a route" (PLAN:1500-1502) | The note says `t_b_complaint_copy` is "room 'none'". §8's rule says an `itemId` in an NPC's `itemsHeld` takes that NPC's room when the NPC's ink has a `#give_item`. Lindqvist's ink has one (PLAN:1600-1602), so the route's room is `b_kitchen` (an opening room). DL8's result does not change, because Lindqvist's grievance already opens through Tomás. But C2's clean-fixture test and a builder reading the note get two different answers from the same lint. | PLAN:726, 1500-1502, 1600-1602 | Correct the note to "room `b_kitchen` (his gift); it adds nothing new to the opening set" |
| R2I-6 | minor | `bridge-deduction-b-wrong` (PLAN:1638-1642) | "Facts granted from the console except Lindqvist's" conflicts with "his device cell was held". If all of Lindqvist's facts are left out, his device cell is not held. (He would still be decided clear by count elimination, which is a different debrief path.) | PLAN:1638-1641 | List the facts the console grants, e.g. "all twelve except `b_lindqvist_grievance`", and say which debrief line follows from that |
| R2I-7 | minor | §8 "Fixtures and tests" (PLAN:1487-1489); §5.10 (PLAN:1072-1073); §11.5 (PLAN:2283) | How the schema test treats triggers is not written down. (a) A shape error under `#/triggers` is not under `#/social`, so `split_schema_errors` leaves it in `other`. It then fails every validator run (exit 1 at "Schema validation failed"), not only `--strict-social`, and it never carries a `TRIGGERS:` prefix. (b) The existing test "every block rejects a typo" asserts `other` is empty for every case, so trigger cases must go in a separate test that asserts on `other`. (c) The first test asserts the exact key list of `base.social`, so adding `deduction` means editing that list. (d) The `base.json` trigger needs `scenario_triggers_fired` declared, or DL16 fires on the base fixture. | `scripts/validate_social.rb:84-89`; `validate_scenario.rb:5452-5458`, `:5468-5484` (exit 1 on other schema errors); `test/js/validator-social-schema.test.mjs:96-101`, `:111-121` | Add these four points to P10-C1's row: trigger cases assert on `other`; the key-list assertion gains `deduction`; base declares `scenario_triggers_fired: {}`; §5.10 notes that trigger shape errors are fatal on every run (acceptable, since no shipped scenario has `triggers`) |
| R2I-8 | minor | DL16 (PLAN:1535); §5.5 Endings step 3 (PLAN:962) | DL16 checks for "known `applyActions` types", but no list exists in the validator, and the plan gives none. §5.5 says "every type except `complete_task` and `skip_task`", but `skip_task` is not an `applyActions` case. An author who writes it in `onClose` gets a silent no-op that DL14 does not catch. | `systems/apply-actions.js` cases `:37-204` (set_global, grant_fact, emit_event, complete_task, unlock_object, unlock_door, hint, give_item, tint_objects, lighting_dip, confirm_action, show_end_screen); grep of `scripts/` for an action-type list: none | Give DL16 the explicit list: those 12 plus the 7 new types (one constant in `triggers.rb`, reused by `deduction.rb` for stakes lists). Drop "and `skip_task`" from §5.5, or make DL14 reject it |
| R2I-9 | minor | §5 loading rule (PLAN:738-746); P10-G and P10-H2 proofs (PLAN:2077, 2086); §11.7 item 11 | Two more tests read the files these packets edit and are not listed. `social-influence-bar.test.mjs` copies `intel-board-minigame.js`, so §5's "the four board tests" is really five. `engine-fixes-round3.test.mjs` reads `chat-helpers.js` and pins `hostileTurnMessage(hostileNpc, npcId)` by regex. | `test/js/social-influence-bar.test.mjs:18-24`; `test/js/engine-fixes-round3.test.mjs:28-30` | Add `social-influence-bar` to H2's "unchanged and green" list and change "four" to "five" in §5 and §11.4. Add `engine-fixes-round3` to G's list |
| R2I-10 | minor | Wave 5 table (PLAN:2116-2122); T0 inputs (PLAN:2104) | (R1I-20, the remaining part.) Wave 5 rows have no inputs. P10-BL needs the playtest-scenario skill, the keyless server and `verify-run.rb`. P10-R1 and P10-R2 need the review lens and `AGENTS.md` "Verifying work". P10-Q needs the wave-0 baseline (R2I-3). The T0 inputs name only `bridge-board-indicators.jsonl`, which has no reload, although B4, B7, A4, A8, C-wrong and D-fail all reload. | `tools/playtest/se/bridge-5.jsonl:14-25` (the in-script reload pattern) | Add an Inputs column to wave 5. Add `bridge-5.jsonl` to the T0 inputs as the reload model |
| R2I-11 | minor | §10.3 (PLAN:2136-2146); PLAN:2110-2112; §11.6 (PLAN:2292) | Two shared files have no owner in the table. (a) `test/js/fixtures/social_deduction/conformance.json` is P10-A's, but any P10-K-x may edit "its case". Such an edit must re-run both evaluator tests (JS and Ruby), and if K-B moves a clue, C2's `social_deduction/good/` (fixture B's data) silently diverges from the built fixture. (b) `tools/playtest/se/SUITE_RESULTS.md`, which other SE agents also append to. | PLAN:2074, 2088, 2110-2112, 2292 | Add both files to §10.3. Make the K proof include `bin/test-js test/js/social-deduction-eval.test.mjs test/js/validator-social-deduction-eval.test.mjs`. Have P10-K-B mirror any moved clue into `social_deduction/good/` and re-run `validator-social-deduction`. Name the T0 packets (append only) as owners of `SUITE_RESULTS.md` |
| R2I-12 | minor | §2 "Commits" (PLAN:136-140); wave 0 (PLAN:2058-2061); §10.3 (PLAN:2144) | `designs/12_deduction_board.md`, this plan and the R1 reviews are untracked. The container can reset (the commit-each-pass rule), and P10-X1 edits design 12, so its diff will have no `HEAD` version to compare against. | `git status --short` (`?? .../designs/12_deduction_board.md`, `?? .../deduction/`) | Wave 0: the orchestrator commits design 12 and the `deduction/` folder (plan and reviews) by explicit path before any packet starts |
| R2I-13 | minor | §11.8 term grep (PLAN:2319-2322); §11.7 item 12 (PLAN:2310) | (a) The grep is meant to cover "the §6.3 strings table in `deduction-model.js` and `deduction-view.js`" without grepping those files whole. No command does that, and H1's own test already checks the engine strings (PLAN:2262-2263). (b) Once the fixtures exist, item 12's grep for `"triggers"`, `#grant_fact` and `#verdict` across the scenarios will hit `test_social_deduction_*` at P10-Q. | PLAN:2262-2263, 2310, 2319-2322 | Make the grep `grep -rniE '<pattern>' scenarios/test_social_deduction_*/scenario.json.erb scenarios/test_social_deduction_*/ink/*.ink` and leave engine strings to the H1 test. Item 12: exclude `scenarios/test_social_deduction_*` and `test/` |
| R2I-14 | minor | P10-U (PLAN:2085); P10-K-A (PLAN:2106) | P10-U is now the largest packet: verdicts and grading, two `when` modes, KO plus warning plus reconcile, close, Finish ordering with two `syncConfirmed` waits, retry, tamper, favours (with the remove path), the nudge, pending hostiles re-armed on load, the one-at-a-time debrief launcher, and a 13-bullet test list. It is bigger than the P10-H that R1I-18 split. P10-K-A covers five suspects, five other NPCs (three of them hidden foes), five rooms, a favour errand, the unique-item call and a credits music event, all in one Opus run. | PLAN:2226-2254 (U tests); PLAN:1679-1756 (A) | Split U into U1 (verdicts, grading, close, Finish, retry, persistence) and U2 (KO, tamper, favours, nudge, pending hostiles, debrief launch), with U2 after U1. Allow P10-K-A to hand off at a checkpoint: data and rooms first, then ink |
| R2I-15 | minor | P10-F3, P10-F4 (PLAN:2067-2068); wave 0 rule (PLAN:2060) | The spikes may not change tracked files, but F3 and F4 name no scenario with the setup they need. F3 needs a conclusion aim with the success screen and one with credits. F4 needs a phone NPC whose `unlockDoor` mapping targets a room not yet loaded. Without a named scenario the spike agent has to invent one, which means adding a tracked scenario plus a `db:seed`. | `scenarios/test_unlock_silence/` (has `unlockDoor`); `awareness_e1_invoice_fraud` (success screen); `test_finale_calls_credits` (credits) | Name a scenario for each spike (e.g. F4 `test_unlock_silence` with the global set from the console; F3 `awareness_e1_invoice_fraud` and `test_finale_calls_credits`), or allow an untracked scratch scenario that is deleted afterwards |

## Checks that held

- **Numbering and names are still free.** `00` §12 ends at S15 (`00_data_contract.md:2010`), and the
  only `00` commit since R1 (`f958a834`) added no S-item. The validator file and test names, bridge
  names and fixture folders do not exist yet. `test/js/fixtures/social/` is the right home for
  `deduction-board.json` (the board tests' fixtures live there).
- **Tests named in packet proofs all exist** (29 files checked). Every test that reads or copies
  `core/game.js` (8) or `minigame-starters.js` (9) is in P10-W's list. All eight read the source text;
  none imports it, so the static import in `game.js` breaks no copied module.
- **Tools named in §2, §10 and §11 exist**: `bin/test-js`, `start-keyless-server.sh`, `new-game.rb`,
  `verify-run.rb`, `dialoguelint.mjs`, `inkcheck.js`, `loopcheck.js` (both set
  `allowExternalFunctionFallbacks`, so `se_influence` stories run), `reopencheck.mjs` with
  `missions.json`, `tagdiff.mjs`, `check_door_alignment.py`, `docs/test-bridge.md`,
  `SE_BUILD_BRIEF.md`, `RESUME.md`. All the model scenarios of §9 exist. Test fixtures use
  `mission.json` with `"collection": "testing"` and `"secgen_scenario": null`.
- **Validator wiring matches the code.** `known_top_level` is at `:257-261`, the strict exit at
  `:5528-5531`, the `social` return at `validate_social.rb:68` and the AREAS registration at
  `:584-604`. `ValidateSocial.errors` keeps any `❌` issue, so `TRIGGERS:` errors returned from
  `check` are seen by the exit test. The root schema is open (no `additionalProperties`), so the
  `known_top_level` warning is the only thing standing in the way of `triggers`.
- **Event payloads for fixture sources.** Container pickups emit `item_picked_up:<type>` with
  `itemId: item.id || item.name` (`container-minigame.js:501-509`). `room_entered:<id>` carries
  `roomId` (`core/rooms.js:3010-3018`). Keycards are ordinary inventory items, and only `key` goes on
  the ring (`inventory.js:668-692`), so C's `remove_item c_keycard` is valid under DL14. Phone NPCs
  inside a room's `npcs` are common (23 scenarios).
- **Stylesheets** load as `<link>` lines in `app/views/break_escape/games/show.html.erb:16-54`, so
  P10-W's added link fits the pattern (and touching `app/` brings `bin/rails test` in under §2).
- **Self-containment.** With the brief's Phase 10 block, each packet's inputs are named except in
  wave 5 (R2I-10). The packet split, wave order, `After` chains, the static-import order (§10.2) and
  the engine commit point are consistent: no packet consumes a file that a later wave creates.

## Verdict

Nearly ready. Every round 1 integration finding is closed except R1I-20, where wave 5 still has no
inputs. The round 1 edits introduced no blocker and no stale ids. Three majors remain, all in test
buildability and regression scope:

- Fixture D's bridges need eight minutes of wall-clock timers inside a 600 s per-bridge limit, and the
  plan gives no way to advance them.
- The 600 px check sits inside scripts whose viewport is fixed at launch.
- The early regression never opens a case-file, though Phase 10 changes the board and its starter, and
  m09 and m10 (one of them in flight) use both. It also has no baseline to compare against.

The minors are mostly consistency and ownership: the order of Tomás's cost and answer, a room note
that contradicts DL8, the wrong-call bridge's fact list, the schema-test mechanics for triggers, the
action-type list for DL16, two unlisted tests, unowned shared files, untracked design files, the grep
command, packet size, and spike scenarios.

Counts: **0 blocker, 3 major, 12 minor** (15 findings). Round 1 closure: 21 closed, 1 partly closed,
0 open.
