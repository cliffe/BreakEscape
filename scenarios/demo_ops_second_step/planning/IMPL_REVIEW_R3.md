# demo_ops_second_step: implementation review R3 (delta)

Reviewer: Sonnet, read-only, round 3. Branch `ops-follow1`, worktree `/data/be-ops-follow`. Delta: `ec68cecca` (round 2 fixes). Read: `IMPL_REVIEW_R2.md` and that diff.

**Verdict: clean.** No new faults. Nothing in the delta touches what the server sends or access checks (two ink lines, docs, report), so nothing is marked "needs Opus".

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb` | 0 errors, 20 warnings (same as R2). `dungeon_graph.*` unchanged in git. |
| `bin/inklecate` on `ama_owusu.ink` and `thandiwe_moyo.ink` (the two changed), compared with committed `.json` | both compile and match exactly |
| `bin/rails test test/controllers/break_escape/demo_ops_second_step_scenario_test.rb` | 17 runs, 284 assertions, 0 failures. Run without `flock`: a `flock -w 300` attempt exited 1 at once with no output (lock file present, cause not looked into). The test uses the test DB and passed. |
| `bin/ops-golden-compare` (not under flock) | 27 runs, 54 assertions, 0 failures |
| Scope of `ec68cecca` | Only `scenarios/demo_ops_second_step/` files (PLAYTEST, two ink and json pairs, BUILD_REPORT, VOICED_LINES). No scenario.json.erb or engine change. |

## R2 items

| Item | Status | Evidence |
|---|---|---|
| N1 reload edge | Closed (doc) | PLAYTEST reload bullet says to reopen the Office and Kitchen doors before a lever. |
| N2 onceOnly budget | Closed | BUILD_REPORT now quotes the validator's V8 figure, 6/10. |
| N3 dialoguelint measures 0 lines | Open, deferred by agreement | Stated in BUILD_REPORT; owned by the cross-showcase prefix change. |

## Playtest 2 items

| Item | Status | Evidence |
|---|---|---|
| 1 lever press sends nobody for ~2 min | Closed as feedback, cause unproven | Ama's new line "Give them a minute or two. If nobody moves, ask me again." (`ama_owusu.ink:153`) sits after the gate, before `coffee_call` increments and the exit. It is honest: it promises nothing, and the report says the 60 s skip theory is unproven. Asking again works because the choice is not once-only. |
| 2 early click on Darren's PC after lunch | Closed (doc) | Run C step 2 says to wait about two minutes for the lock. |
| 3 no Lorna rows in Run C; Thandiwe asks for them | Closed | Thandiwe: "Look for requests nobody answered, and any approval." (`thandiwe_moyo.ink:34`). PLAYTEST step 5 says which rows need M4 or M5. Compiled json matches. |
| 4 "Captured" tile | Closed (doc) | PLAYTEST step 4. |
| 5 pane wording | Closed (doc) | PLAYTEST quotes both pane strings. I did not recheck them against the page code. |
| 6 Ama and Lorna barks unverified | Still unverified by a run | Documented as bubbles to check by eye. Acceptable. |
| 7, 8, 9 late toasts, repeated converse, habits block | Closed (doc) | New "Things a tester sees that are not faults" section. |
| Leak check exits 2 | Closed (doc), not re-run by me | The `--signin` rule is explained and reduced to one Niamh entry. The report says games 198, 202 and 203 all exit 0. I did not re-run the leak check (no captures here). |

## New findings

None blocking.

- Minor (info): VOICED_LINES lists both changed lines (12 and 8 words). Ama's new line is 57 characters, over the 40-character bubble note used elsewhere, but it is a conversation line, not a bark, so no limit applies.
- Minor (info): the worktree has uncommitted edits in `demo_ops_passwords` and `demo_ops_recon` (not this scenario, not part of this delta). They were left untouched and not committed.
