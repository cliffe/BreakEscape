# Review R3: integration, buildability, tests and validator (confirmation round)

Target: `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` (rounds 1 and 2 folded in, 2,832 lines as read on
2026-10-22). Lens: fit with the ongoing SE build, packet buildability, tests, the validator, and whether
each packet can be built from the file alone. This is a read-only review. `PLAN:n` is a line in the
target as read today. Code paths are under `public/break_escape/js/` unless they start with `scripts/`,
`test/`, `tools/`, `app/`, `scenarios/`, `docs/` or a dot.

Working tree when read: `scripts/validate_scenario.rb` still holds the other agent's uncommitted hunk
(the `carry_over_import_name` move, 20 lines). `README_scenario_design.md` has a one-line foreign edit.
`scenarios/lab_social_engineering/` (scenario and three inks) and the person-chat and inbox-triage
files are in flight elsewhere. `run-suite.sh` is clean. `designs/12_deduction_board.md` and the whole
`deduction/` folder are still untracked. Commit `76cb7432` (today) moved the validator and `game.rb`
line numbers the plan cites (R3I-9).

## Part A: closure of rounds 1 and 2

### Round 1 (R1I)

| Id | Closed | Evidence |
|---|---|---|
| R1I-1 | yes, for its scope | `channels: { "person": "ded_b_tomas" }` (PLAN:666) matches `socialCharacter.channels.person` in `scripts/scenario-schema.json`. There is no tamper in B (PLAN:742, 750). The clean-fixture property is broken again by a different lint, DL8, which round 2 changed: see R3I-1 |
| R1I-2 | yes | One `.jsonl` per game, job name equal to the file suffix (PLAN:1698-1702). The `JOBS` strings (PLAN:2331, 2334-2336) fit `run-suite.sh`'s `name:scenario[:VW]` and its file guard `bridge-${j%%:*}.jsonl` |
| R1I-3 | yes | Tomás first, then Lindqvist's gift, then the HR cabinet (PLAN:1766-1772) |
| R1I-4 | yes | `triggers` joins `known_top_level` (PLAN:1156-1157), owned by P10-C1 with the foreign-hunk rule (PLAN:2309, 2367, 144-150) |
| R1I-5 | yes | Strict exit for triggers-only scenarios and the `❌ TRIGGERS:` prefix (PLAN:1157-1158, 1161-1162, 1605-1607); the CLI exit test is in §11.5 (PLAN:2528-2530) |
| R1I-6 | yes | P10-Q0 right after P10-W, engine commit after it (PLAN:2317, 142-143) |
| R1I-7 | yes | P10-X1 scope (PLAN:2318, 615-641); brief block, log and pointers are the orchestrator's before wave 0 (PLAN:102-108, 2276-2278, 2375) |
| R1I-8 | yes | Schema cases in `validator-social-schema.test.mjs`, temp `repo_root` after `validator-social-pretext.test.mjs:48-68`, folders `social_deduction/` and `social_triggers/` (PLAN:1610-1620) |
| R1I-9 | yes | §2 rule for files with foreign hunks (PLAN:144-150), repeated in §10.3 (PLAN:2377-2379) |
| R1I-10 | yes, small residue | §2's lists (PLAN:112-117) agree with §10.1 for the packets they cover. P10-E (Opus) and the spikes and baseline are on neither list, so "§10's model column follows this list" cannot be checked for them (R3I-14) |
| R1I-11 | yes | Ids are F1–F4, B0, K, T0, T, R1, R2, U1/U2, H1/H2, C1/C2. A grep finds no `P10-S<n>`, bare `P10-C`, `P10-H` or `P10-U` outside the §14 log |
| R1I-12 | yes | DL1–DL22 throughout; no `N<n>` lint id remains (grep); PLAN:1601 says what DL ids are |
| R1I-13 | yes | D's route table (PLAN:2095-2121); P10-A covers all four fixtures (PLAN:2295); a K packet edits only its own conformance cases (PLAN:2321-2324, 2368) |
| R1I-14 | yes | `bin/test-js` and its header (PLAN:118-120, 2267, 2387); `bin/test-js:1-19` confirms the IPC retry |
| R1I-15 | yes | The grep runs over the fixtures' scenario and ink only (PLAN:2571-2575) |
| R1I-16 | yes | §7.7 (PLAN:1537-1542) and DL18 (PLAN:1674) |
| R1I-17 | yes | §7 intro (PLAN:1362-1365); §2 (PLAN:121-123) |
| R1I-18 | yes | C1/C2, H1/H2 (PLAN:2299, 2308-2310). C2 is now the largest packet (R3I-12) |
| R1I-19 | yes | H1 runs after P10-A (PLAN:2299, 2356) |
| R1I-20 | yes | Closed through R2I-10: wave 3–5 rows have inputs (PLAN:2314-2346) |
| R1I-21 | yes | Every listed test exists (37 files checked with `ls`); named in P10-E, G, H2 and W proofs (PLAN:2297, 2298, 2308, 2316) |
| R1I-22 | yes | No fail replay (PLAN:918-928); the debrief reopens on `game_loaded` (PLAN:1037-1039) |
| R1I-23 | yes | Header (PLAN:6-9); X1 after W (PLAN:2318), X2 after K-B (PLAN:2342) |

23 of 23 closed. R1I-1 and R1I-10 each have a follow-on below.

### Round 2 (R2I)

| Id | Closed | Evidence |
|---|---|---|
| R2I-1 | yes | Stops are brought forward through door objects; one trigger per stop is `once`, so the timer and the object cannot both run it (PLAN:2123-2136). Only stop 1 is waited out, about 120 s (PLAN:2173-2176); risk 13 (PLAN:2596) |
| R2I-2 | yes | `bridge-deduction-b-600` with `JOBS` `deduction-b-600:test_social_deduction_b:600` (PLAN:1788-1790, 2331). B8 no longer checks the narrow layout (PLAN:1779-1780). `run-suite.sh` passes the third field as `VW` |
| R2I-3 | yes, with a wrong premise | P10-B0 (PLAN:2285); Q0 and Q compare with it (PLAN:2317, 2344, 2565-2567). Two of the five case-file opens it asks for (m09, m10) have no case-file board (R3I-4) |
| R2I-4 | yes | One order, answer then cost (PLAN:1387-1392, 1427-1429); B1's question order is written out (PLAN:1766-1769) and agrees with §9.1's Tomás paragraph (PLAN:1745-1747) |
| R2I-5 | yes | The complaint copy's route room is `b_kitchen` (PLAN:754-756) |
| R2I-6 | yes | All twelve facts granted; the expected debrief lines follow (PLAN:1781-1787) |
| R2I-7 | yes | P10-C1's schema-test mechanics (PLAN:2309); trigger shape errors fail every run (PLAN:1162-1165). `validator-social-schema.test.mjs:96-101` is the key-list assertion the row names |
| R2I-8 | yes | DL16's explicit list (PLAN:1672); the 12 existing cases match `systems/apply-actions.js:37-204`. DL14 rejects `skip_task` in a list (PLAN:1670) |
| R2I-9 | yes | `social-influence-bar` and `engine-fixes-round3` named; "five" board tests (PLAN:773-774, 1148-1150, 2298, 2308) |
| R2I-10 | yes | Wave 5 has an Inputs column (PLAN:2340-2346); `bridge-5.jsonl:14-25` is a reload (`location.assign` then `isReady`), named for T0 (PLAN:2331) |
| R2I-11 | yes | Owners for `conformance.json`, `good/` and `SUITE_RESULTS.md` (PLAN:2368-2372); K proofs re-run both evaluator tests (PLAN:2321-2326) |
| R2I-12 | yes | Planning docs committed before wave 0 (PLAN:151-153, 2276). They are still untracked today, which is expected before the build starts |
| R2I-13 | yes | Grep over fixture scenario and ink only (PLAN:2571-2575); item 12 excludes the fixtures (PLAN:2560). A grep of `scenarios/` finds no `"triggers"`, `#grant_fact`, `#verdict` or `#deduction_` today, so item 12 passes on shipped content |
| R2I-14 | yes | U1/U2 (PLAN:2306-2307); K-A in two checkpoints (PLAN:2333) |
| R2I-15 | **partly** | Each spike now names a scenario (PLAN:2286-2289), but the named scenarios lack what F1 and F2 need, and wave 0 forbids tracked changes (R3I-2) |

14 closed, 1 partly closed (R2I-15), 0 open.

## Part B: fresh findings

| Id | Severity | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R3I-1 | blocker | §9.1 rooms (PLAN:1718-1720); §4.9 hand check (PLAN:750-754); DL8 (PLAN:1644-1649, 1664); §8 tests (PLAN:1683); §11.5 (PLAN:2521-2522); P10-C2 and P10-K-B proofs (PLAN:2310, 2330) | Fixture B, the clean validator fixture, fails DL8 as DL8 now reads. (a) Round 2 added "its key or card lies in an opening room" to the open-door rule. `b_server_key` lies on the counter in `b_kitchen`, an opening room, so `b_server` is an opening room too. Then the badge log (`t_b_badge_log`, room `b_server` through the log filter's `completionActions`) and the DHCP printout are opening facts, so all twelve facts are held at the start. Okoro is guilty and nobody is open, which breaks DL8(a) (`maxGuilty` 0) and (b) (2 of 4 open), both errors. K-B's `--strict-social` exit 0 and C2's "clean fixture has no deduction issue" both fail. The hand check still says "opening rooms `b_office` and `b_kitchen`". (b) Even with the key moved, B has one non-opening room, so "opening facts plus those of any one other room decide every suspect" is true by construction. DL8's ⚠️ fires, and §8 and §11.5 require no issue at all on the clean fixture. Both C2 (wave 2, the first to build B's data) and K-B would have to make a design call | DL8's open-door rule (PLAN:1645-1648); B's key "on the counter" in `b_kitchen` (PLAN:1717-1718); room of a trigger on a log filter's global (PLAN:1635-1637); bridge B5 picks the key up loose (PLAN:1773) | Pick one for (a): put `b_server_key` in a locked container (a lockpick drawer or the HR cabinet) and add to DL8 "a key inside a locked container does not count as lying in the room"; or make the server door a PIN door (a puzzle, so closed), keeping "key door" coverage elsewhere. For (b): either make the single-room ⚠️ apply only when at least two non-opening rooms hold routes, or have §8 and §11.5 say the clean fixture has no ❌ and only the listed ⚠️s. Then redo §4.9's hand check, B5, and the §9.5 "Physical puzzles" row for B |
| R3I-2 | major | P10-F1, P10-F2, P10-F4 (PLAN:2286-2289); wave 0 rule (PLAN:2280-2281); §12 risks 1, 2, 4, 10 (PLAN:2584-2593) | Most of what the spikes must prove cannot be set up in the scenarios they name, and wave 0 allows no tracked change. `test_ko_countdown` has two rooms; the second (`vault`) has no NPCs, no NPC is `initiallyHidden` or has a `behavior.hostile` block, and no NPC has `itemsHeld`. So F1's "one whose room is not loaded" path (the riskiest, risk 1) cannot run. F2's drop order needs a KO'd NPC holding an item, and its room-state KO restore needs an NPC in an unloaded room: neither exists. `test_social_slice` has no `#give_item` at all, so F2 falls back to "any scenario". `test_social_docs_proof` gives a key, not a notes item. F4's `test_warden` is `npcType: "person"`, while D's guard is a phone NPC, so the part of risk 4 that is about a phone NPC's mappings is not tested. A bridge `eval` cannot add an NPC to an unloaded room, because the lazy loader reads room NPCs from the server | `scenarios/test_ko_countdown/scenario.json.erb` (rooms `lobby`, `vault`; `vault.objects: []`, no `npcs`); `scenarios/test_unlock_silence/scenario.json.erb:24-38`; `grep -rl give_item scenarios/test_social_slice` (none); `scenarios/test_social_docs_proof/ink/proof_quill.ink:57` (`#give_item:key:soc_key`) | Allow an untracked spike scenario (`scenarios/zz_ded_spike/`, `db:seed`, deleted afterwards and never committed), with a hidden hostile NPC in a second room, a calm NPC holding a notes item and a plain item, an ink `#give_item` of each, and a phone NPC with an `unlockDoor` mapping to a room two doors away. Name it in F1, F2 and F4, and say in the wave 0 rule that it is the one exception. Alternatively, name m01 for the hidden hostile (read-only, new game) and `sis02_energy` or m07 for a notes gift |
| R3I-3 | minor | §12 risk 10 (PLAN:2593); P10-F2 scope (PLAN:2287); P10-E After (PLAN:2297); §12 closing rule (PLAN:2599-2600) | Two dangling dependencies. Risk 10 says "P10-F2 extends to it" (removing an item the player is using), but F2's scope does not mention `remove_item` or an open minigame. And P10-E (wave 1, `After: —`) builds `reveal_hostiles` and `remove_item` on what F1 and F2 are meant to prove, while spike findings are only due "before wave 2 starts", so E can be built before a spike correction lands | PLAN:2287, 2297, 2599 | Add the remove-while-open check to F2's scope. Set P10-E `After: P10-F1, P10-F2` (or say that wave 1 starts once the wave 0 findings are in the build log) |
| R3I-4 | minor | P10-B0 (PLAN:2285); P10-Q0 (PLAN:2317); §11.8 (PLAN:2565-2567) | m09 and m10 have no case-file board. m09's "Case File, Helena" is `type: "notes"` with `sprite: "case-file"`. m10 dropped its case-file because it opened an empty intel board; the only match is an ERB comment. R2I-3's grep matched those strings. A Sonnet builder asked to open "the case-file in m09 and m10" will search for a board that does not exist, and may report it as a regression. The shipped scenarios with `"type": "case-file"` are `lab_social_engineering`, `test_social_slice`, `test_social_docs_proof` and `test_social_board_indicators` | `scenarios/m09_digital_archaeology/scenario.json.erb:1550-1555`; `scenarios/m10_full_disclosure/scenario.json.erb:2429-2431` | Drop m09 and m10 from the case-file opens. Keep them only in the load check ("game loads, no new console error"), and use the four scenarios above for the board opens. Name the modes each must reach: `lab_social_engineering` has scope, plan, recon and defender (defender in `blue_team_room`, not the start room) |
| R3I-5 | minor | Wave 0 (PLAN:2280); §10.3 (PLAN:2372, 2375); P10-B0 and spikes (PLAN:2285-2289, 2599) | Ownership conflicts with "No tracked file changes" in wave 0. `SUITE_RESULTS.md` is tracked, and §10.3 makes P10-B0 an appender. `run-suite.sh` writes its table to `tmp/se-suite-*/table.md`, not to `SUITE_RESULTS.md`, so appending is a hand edit. B0 and every spike write "in the build log", yet §10.3 gives `DEDUCTION_BUILD_LOG.md` to the orchestrator alone | `git ls-files tools/playtest/se/SUITE_RESULTS.md`; `run-suite.sh` header and final block | Say that B0 and the spikes return their tables in their reports and the orchestrator writes them into the build log and `SUITE_RESULTS.md`. Or exempt the two files from the wave 0 rule and list B0 and F1–F4 as appenders in §10.3. Give B0 the exact command: `ONLY="1a 3 6 board-indicators p7-episode" tools/playtest/se/run-suite.sh` |
| R3I-6 | minor | P10-B0 (PLAN:2285); P10-C1 proof (PLAN:2309); §11.5 last bullet (PLAN:2534-2535) | The `--strict-social` comparison runs across time on content that is changing. `lab_social_engineering`'s scenario and inks are uncommitted edits by another agent today. A result recorded at B0 and compared at C1 (or Q0) can differ because the content changed, giving a false regression, or a real one can be hidden. `IMPLEMENTATION_PLAN.md` §2.4 R0 avoids this by running the old and new validator on identical content in a HEAD worktree | `git status` (`M scenarios/lab_social_engineering/...`); `IMPLEMENTATION_PLAN.md:976` (R0) | Make C1's, C2's and Q0's strict-social check the R0 method: a worktree at the pre-change commit with the working tree's `scenarios/` copied in, both validators run, and the diff compared. Keep B0's list only as a record of which scenarios have a `social` key |
| R3I-7 | minor | §11.6 (PLAN:2542-2545) vs §9.2–§9.4 bridges (PLAN:1927-1947, 2050-2061, 2173-2191); P10-T0 proofs (PLAN:2331-2336) | §11.6 says each fixture's main script covers Space and `E` inert, Tab order, Esc and Close, and a reload with marks and verdicts (D: a faded cell). Only B's outline does (B4, B8). A's main script reloads only after the end (A8). C's main script has no reload. D's main script has no reload at all, so the faded-cell reload is never written. The T0 rows take §9.x as their scope, so a builder following the row leaves these out. "Each bridge finishes inside 600 s" is a proof only for D (PLAN:2336), although A's main script (lockpick, favour, PIN, log filter, dusting, two accusations, the debrief, the altar, credits, reload) is the longest | PLAN:1779-1780, 1938-1939, 2336 | Add the §11.6 items to the A, C and D main outlines (one line each), or point each T0 row at §11.6 as part of its scope. Make "finishes inside 600 s" part of every T0 proof, and allow a long script to split into two jobs by game state (as `1b`/`3b` do) |
| R3I-8 | minor | §11.5 first deduction bullet (PLAN:2526-2527) vs §8 tests (PLAN:1680-1681), DL16 (PLAN:1672) | `validator-social-deduction.test.mjs` (C2) is said to cover "every DL except DL16 and DL19", yet §11.5 lists "DL16's action-type list" among its cases. DL16 is defined for `triggers` only; the same constant is "reused by `deduction.rb` for stakes lists", but no DL id or message is given for an unknown action type in a stakes, favour or escalation list | PLAN:1672, 1680, 2526 | Put the stakes-list type check under DL14 (references resolve) with its own message, and change §11.5 to "DL14's action types in stakes lists". Leave DL16 in the triggers test |
| R3I-9 | minor | §5.10 (PLAN:1156-1158, 1163-1165); P10-C1 (PLAN:2309); §1 table (PLAN:87) vs §5.5 (PLAN:1026), P10-F3 (PLAN:2288) | Line pointers moved with today's commit `76cb7432`. `known_top_level` is now at `validate_scenario.rb:282` (plan: `:257-262`), the strict exit at `:5559-5562` (plan: `:5528-5531`), `split_schema_errors` at `validate_social.rb:90` (plan: `:84-89`). P10-C1's "own block only" rule leans on these. `skip_task!` is at `game.rb:1473`, and the plan cites it two different ways (`:1446-1470` in §1, `:1457-1482` in §5.5 and F3) | `grep -n` on HEAD and the working tree | Refresh the pointers, or name the code by anchor (`known_top_level = %w[`, `if options[:strict_social] && json_data.key?('social')`, `def skip_task!`) so drift does not matter |
| R3I-10 | minor | §9.5 coverage table (PLAN:2250) | The "No-combat held item (`#give_item`)" row is stale from round 1. It credits A with "Venn's key" and C with "Ahmed's key". Round 2 made Venn give a code (PLAN:1835-1836, R2D-10), and §9.3 has no key from Ahmed (contacts open doors with `#unlock_door`, PLAN:1989-1990). Only B proves the held-item gift | PLAN:2250, 1835, 1989 | Mark A and C blank in that row (or name a real gift if one is added) |
| R3I-11 | minor | §3.5 (PLAN:231) | "§7.6 gives the pattern and fixture A proves it". §7.6 is Tampering; the unique-item pattern is §7.8 (PLAN:1544) | PLAN:231, 1519, 1544 | Change to §7.8 |
| R3I-12 | minor | P10-C2 (PLAN:2310); §2 models (PLAN:112-116) | P10-C2 is now the largest packet: 20 lint rules, four derived sets (room of a route with eight inference cases, opening rooms by breadth-first search, reachable facts with "beyond the close", gate readers that parse ink conditions), ink reading on a temp `repo_root`, a good fixture that is B's whole scenario with rooms, NPCs and ink, and one good and one bad case per rule. §2 sends only "the lints that derive sets (DL5 to DL9, DL18)" to Opus; DL1–DL4, DL10–DL15, DL17 and DL20–DL22 are on neither list | PLAN:1622-1679 | Split into C2a (Sonnet: DL1–DL4, DL10, DL11, DL13–DL15, DL17, DL20–DL22, plus the good fixture) and C2b (Opus: the derived sets, DL5–DL9, DL12, DL18), C2b after C2a. State the split in §2 |
| R3I-13 | minor | P10-H2 owns (PLAN:2308); §5.9 (PLAN:1142); path rule (PLAN:11-12) | `css/intel-board-deduction.css` does not start with any prefix in the path rule, so by the plan's own rule it means `public/break_escape/js/css/…`, which does not exist. The board's stylesheet is at `public/break_escape/css/intel-board-minigame.css` (`show.html.erb:70`) | `ls public/break_escape/css/`; `app/views/break_escape/games/show.html.erb:70` | Write the full path `public/break_escape/css/intel-board-deduction.css` in §5.9, the H2 row and the W row's link |
| R3I-14 | minor | §2 models (PLAN:112-117) vs P10-E, B0, F1–F4 (PLAN:2285-2297) | §2 says "§10's model column follows this list", but P10-E (Opus) is on neither the Opus nor the Sonnet list, and neither are the baseline and spikes (Sonnet, F3 Opus). Neither choice is wrong | PLAN:112-117, 2297 | Add "the new action cases" to §2's Opus list and "the baseline and spikes (F3 on Opus)" to the Sonnet list |

## Part C: integrity and self-containment

Could a builder implement one packet from this file and its listed inputs alone? Mostly yes. The
packet table now gives scope, owned files, inputs or consumes, model, dependencies and proof for every
row. Wave order is consistent, and every shared file has one owner, including `validate_scenario.rb`
(C1, two places), `run-suite.sh` (each T0, its own entries), `SUITE_RESULTS.md` (append only) and
`conformance.json` (A; each K its own cases). There is a P10-B0 baseline, a P10-Q0 regression and an
engine commit point. All nine `JOBS` strings are exact and agree between §9 and §10. Each is one game
per job, and B's narrow-viewport job is its own. Every tool, script, test and model scenario the plan
names exists (37 tests, 15 scenarios and 14 tools and docs checked). No table is truncated (column
counts checked row by row). No renamed id from rounds 1–2 survives outside the §14 log. The places
where a builder would still have to guess:

1. **Test data sources.** P10-U1 and U2 test "on fixtures B's, A's and D's data" (PLAN:2456), but they
   own no fixture file. `conformance.json` holds `deduction` and `intelFacts` but not stakes action
   lists for certain, and `social_deduction/good/` (C2) is built in parallel with U1. Name the source:
   inline data in each test, or a `test/js/fixtures/social_deduction/runtime-*.json` owned by U1.
2. **Mirroring B into `good/`.** P10-K-B "mirrors any change into `good/`" (PLAN:2325-2326), but `good/`
   ink is C2's validator ink. It may be stubs that carry only the tags DL7, DL10, DL12 and DL18 read,
   while K-B's real ink is full dialogue. Say whether `good/ink/` is a stub set, and what counts as a
   change to mirror (data and tag placement, not dialogue).
3. **Backup recovery's global.** D's `t_d_backup` is "on its global" (PLAN:2110), and DL8 infers a room
   from "a backup recovery's global" (PLAN:1636-1637). The minigame writes fixed names
   (`backup_recovery_source`, `backup_restore_initiated`, `recovery_eta_hours`, `backup_reinfected`;
   `minigames/backup-recovery/backup-recovery-minigame.js:336-342`), not a configured one. Name the
   global D's trigger keys on, and tell C2 to map these fixed names to the scenario's
   `backup_recovery` object.
4. **DL12 and DL6 parsing rules.** DL12 checks that `#verdict_close` is "in a knot reached only through a
   choice" with a "Not yet" sibling. A's HaX puts `#verdict_close #unlock_door:a_sanctum` under the "Go
   in" choice, which may be an inline choice body rather than a knot (PLAN:1904-1906). DL6's
   "their ink offers no recovery choice" does not say what counts as recovery (a choice whose body
   calls `se_influence` with a positive delta?). Write both rules down for C2.
5. **Tomás's third topic.** "Anything odd last night?" grants no fact, so the `not se_intel_...` gate
   that hides answered topics cannot hide it, and asking it again costs 15 each time (PLAN:1743-1747,
   1435-1436). Say whether it is a `*` once-only choice. B1's influence numbers depend on it.
6. **DL8 and D's door objects.** By DL8's wording, D's carriages are closed (their doors open through the
   guard's `eventMappings`, which the open-door rule does not list), so the hand check holds. In play,
   the car 1 door object opens car 2 after one confirm. That is a design-lens question, not an
   integration one. I note it so a C2 builder does not "fix" DL8 to count it.
7. **`DECISIONS_PENDING.md`** (committed with the plan in wave 0) still says "the plan's §13.2 holds the
   same list" and describes retry as a button "on the debrief". The plan has moved both (§13.1, retry
   panel before the debrief). No packet reads it, but a one-line "answered, see plan §13.1" header would
   stop a builder being misled.
8. **The CLI exit test** in `validator-social-triggers.test.mjs` should name its model:
   `test/js/validator-social-framework.test.mjs` already runs the CLI with `--no-graph --skip-ink
   --no-lint` on a temp copy (its header, line 4). Add it to C1's inputs.

Checks that held: `S16` is still the next free `00` §12 item (`00_data_contract.md:2010` ends at S15).
`evaluateGlobalCondition` takes quoted string literals, so C's `globalVars.c_in_comms === '<id>'`
works (`utils/global-condition.js:13-23`). `#remove_npc` exists for C's act route (`chat-helpers.js:232`).
`apply-actions.js` already imports `writeGlobal`, `grantFact` and `readyToastText`, so P10-E needs no
new import. `npm run test:social` picks up every new test name (`package.json:14`). The starter at
`systems/minigame-starters.js:1145-1164` reads only `data.mode` today, so P10-W's `options.mode` and
`options.view` pass-throughs are new, as stated. `m04` is the shipped user of `show_end_screen`, so
R3-m04 covers item 13.

## Verdict

Not ready to build until R3I-1 is fixed. The round 2 change to DL8's open-door rule made fixture B,
which is both the first fixture and the clean validator fixture, fail its own DL8. Its three-room layout
also trips DL8's single-room warning by construction. This is the same kind of fault as R1I-1, it shows
up first in P10-C2, and the fix is small: move B's key behind a lock or make that door a PIN door,
narrow or exempt the warning, then redo B's hand check. The one major is that the spikes' named
scenarios cannot set up F1's deferred-foe path or F2's held-item and gift checks under wave 0's
no-tracked-changes rule. The minors are a wrong premise (no board in m09 or m10), ownership wording
for the build log and `SUITE_RESULTS.md`, a cross-time validator comparison on in-flight content,
bridge outlines that miss §11.6's per-script checks, one lint-id clash, stale pointers and rows, a
dangling section reference, a CSS path outside the plan's path rule, and packet size for C2.

Counts: **1 blocker, 1 major, 12 minor** (14 findings). Closure: round 1 23/23 closed; round 2 14 closed,
1 partly closed (R2I-15), 0 open.
