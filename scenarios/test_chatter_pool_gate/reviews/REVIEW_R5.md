# Review R5 (final round): delta 99be016d7..HEAD

Scope: fix commits 391271cf2, 47f85a6ab, 16cf8dfe1 and merge 576ae7a83, limited to scenarios/m08_the_mole, scenarios/test_chatter_pool_gate, test/js/m08-chatter-gate-data.test.mjs, tools/playtest/m08-chatter-gate-proof.mjs, public/break_escape/js, scripts, docs. Result: 0 Blocker, 0 Major, 1 minor, 2 nits. All six R4 findings are resolved as the outcomes file says.

## Checks

1. R4 findings.
   - m1: scenario.json.erb:1867 now reads `globalVars.ops_watch_upset && !globalVars.julian_console_owner_away`. Resolved, see the state table below.
   - m2: test added, see check 2.
   - m3: CONTRACT.md:316-317 and PLAN.md:97, :102 are updated. Two PLAN.md lines were missed, see findings.
   - n1: probe header (m08-chatter-gate-proof.mjs:3-4) now matches `setG`.
   - n2, n3: LIVE_CHATTER_GATE.md rows c, e and f record the reload-with-ko and agnieszka_ko phases; both show 0 uses and 0 speech in 150 s.

2. Console state table. Variants at :1866-1868 are, in order: upset and Julian at post (lock-screen text), screen locked ("SESSION LOCKED"), owner away ("NIGHT WATCH CONSOLE, signed in"), then the base text. The emitter (:1672) reads only owner_away and not screen_locked; the pc-session claim (pc-sessions.js:654-660) sends only `<id>_screen_locked` and `<id>_owner_away`. Neither reads upset or ko.

   | upset | Julian | locked | text | amber glow | claimable |
   |---|---|---|---|---|---|
   | no | at post | no | base text | no | no |
   | no | at post | yes | SESSION LOCKED | no | no |
   | no | away | no | signed in | yes | yes |
   | no | away | yes | SESSION LOCKED | no | no |
   | yes | at post | any | snapped to lock screen | no | no |
   | yes | away | no | signed in | yes | yes |
   | yes | away | yes | SESSION LOCKED | no | no |

   Text, emitter and claim agree in every row. Officer KO: `julian_ko`/`agnieszka_ko` set upset and ko but do not write owner_away (that comes from workstation-state.js), so a KO leaves the console in whichever row its owner_away value puts it, and the three signals still agree. Nothing here changes any spoken or displayed string.

3. New test (5 tests, all pass). I copied the test, conditional-text.js, the scenario directory and lib into a scratch directory and reverted one pin at a time: variant condition back to upset only; `offWhen` back to `ops_watch_upset`; the first Julian trip back to upset; both `requireGlobal` gates removed; the coupling back to upset; the agnieszka_ko writer dropping `ops_watch_ko`; the emitter condition widened. Each revert failed exactly one test (4 pass, 1 fail); the unmodified copy passes 5 of 5. The pins hold. Gaps are listed as nit n1.

4. Merge 576ae7a83. `git diff main HEAD` for npc-needs.js, scenario-schema.json and validate_office_life.rb shows only the branch's own gate work (39, 4 and 72 lines); the requireGlobal path (npc-needs.js:278-331), schema and V12 (validate_office_life.rb:766-823) are intact. In scenario.json.erb the merge pulled in main's text edits only (dash removal in TOMB GAMMA, the Vector and Phantom lines and the flag labels, the Q/F punch hint wording, the field_console_kali observations and print texts). `git diff main...HEAD` on the file shows no text change from this branch. No conflict markers or lost branch edits.

5. Text compare against main (`git diff main...HEAD -- scenarios/m08_the_mole/scenario.json.erb`). Changed lines: the two KO mappings (add `ops_watch_ko`), two chatter pools (array to object, same four lines each, plus `requireGlobal`), three trip conditions and one coupling condition (`ops_watch_upset` to `ops_watch_ko`), the console variant condition, an ERB comment, `offWhen`, and the new global. The eight pool lines are byte identical. No spoken or displayed line added, removed or reworded.

6. Office-life rule. `ops_watch_ko` and `ops_watch_upset` appear only in: agent_0x99 setGlobal mappings (:1276-1281), the two cooler pools, three exchange gates (:1794-1796), the Julian bark (:1807), trip and coupling conditions, the console variant, `offWhen`, global declarations (:2973-2974), and the relief-watch ink flavour VARs. No required task, objective, lock, key or VM flag reads either. Nothing in app/, lib/ or engine JS mentions them.

7. Results.
   - `bin/test-js`: Files: 821 passed, 0 failed, 821 total.
   - `ruby scripts/validate_scenario.rb` m08: 0 errors, 17 warnings. test_chatter_pool_gate: 0 errors, 1 warning. All warnings are existing categories (decor field, onceOnly overlaps, ops_cooler queue cells outside the room, V4 attack probe); no V12 warning. `git status` clean afterwards, so no dungeon_graph file changed.
   - `ruby scripts/lock_key_diff.rb` for m08 against baseline_locks.json: only the expected rename (gitlist_repository_server to field_console_kali on two edges).

## Findings

### minor

- m1. scenarios/m08_the_mole/office_life/PLAN.md:269. The bark line now says the condition is `globalVars.found_badge_audit === true && !globalVars.ops_watch_ko && !globalVars.julian_ko`, but scenario.json.erb:1807 still reads `!globalVars.ops_watch_upset`. The code is right (CONTRACT.md says upset silences barks); the plan is wrong. Failure scenario: someone follows the plan, changes the bark to ko, and the bark starts speaking over an upset floor. Fix PLAN.md:269 to `ops_watch_upset`.

### nit

- n1. test/js/m08-chatter-gate-data.test.mjs: the `other >= 5` count of `ops_watch_ko` occurrences is loose (it is satisfied by the comment and declaration), and nothing pins the exchanges (:1794-1796) or the bark (:1807) staying on upset. A later edit moving the bark to ko would pass the suite. Add two equality asserts if wanted.
- n2. PLAN.md:176 still lists the cooler as `offWhen: "ops_watch_upset"`; the scenario and PLAN.md:102 say `ops_watch_ko`.
