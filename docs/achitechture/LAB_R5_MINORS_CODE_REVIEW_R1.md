# Lab R5 minors: adversarial code review, round 1

Branch `build/lab-r5` against `main` (commits `de6fe9c1f` to `1a4e0e611`). Sources: `LAB_R5_MINORS_BUILD_LOG.md`, `PHYSICAL_PENTEST_ACCESS_FOLLOWUP_CODE_REVIEW_R5.md` and the diff.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 1 (R1-m1) |
| Nit | 5 (R1-n1 to R1-n5) |

Each of the seven R5 items is done as the R5 review asked. The minor finding concerns where the new "Both routes" window sits in real play, not whether its logic is right: the logic gives exactly one line for every order and gap, in the node test and in a real browser.

## What was checked, and the answers

### The timer give retry (E5-m4)

- **Pairing.** Each give promise now carries `.action`, and the dispatcher pairs by it. `p.action` is set on every promise `applyActions` returns (the only `gives.push` is in the `give_item` case), so `giveAction` is never undefined.
- **A retry with the condition dropped can hand over an item whose condition has gone false since the fire.** Yes, by design, and I agree with it: the give was decided when the timer fired, and a first POST that had got through would have granted it. The old behaviour was worse: the retry re-read the condition, `applyActions` returned nothing, the retry counted as settled and the timer was marked fired with the item never given.
- **Can a client replay it?** It gains nothing. The server grants a declared grant at any time with no trigger or condition check (`games_controller.rb`, the declared-grant branch with "NOTE: no trigger check; a declared grant can be claimed at any time"), so a client could always POST the item directly. The validator already warns on every conditioned `give_item` for that reason. Not a finding.

### "Both routes" and `kp_route_line_shown` (L5-m1, L5-m2)

- **Window logic.** Worked through by hand for both orders. Clone first at 0, tailgate at d: `hint_clone_opened` shows at 600 ms only if d > 600, `hint_tailgated` never shows, `hint_both_routes` shows at d + 1600 only if d < 600. Tailgate first, clone at d: `hint_tailgated` shows at 1500 only if d > 1500, `hint_clone_opened` never shows, `hint_both_routes` shows at 1600 only if d < 1500 (for 1500 < d < 1600 the tailgate line has set the flag). Exactly one line in every case. When several timers fall due in one frame (a background tab, a reload), `update` walks them in list order and the "both" timer is last, so it reads the flag after the others have set it.
- **Reload.** The dispatcher's init skip (a timer whose `setGlobal` keys already hold) now marks the other route line fired once either has shown. That timer's own condition would refuse it anyway, so this changes nothing.
- **Can the client write the global?** Yes: `Game#merge_global_variables!` takes any global that is not imported or worn. It only suppresses or forces a hint toast on the player's own screen. Nothing on the server, in the ink or in the objectives reads it (grep across `app`, `lib`, the lab's ERB and ink): the debrief and the `tailgate_in` task read `kp_badge_tailgated` and `kp_records_cloned` only. Not a finding.
- **The line is true.** `ruth_debrief.ink` lists both findings when both globals are set (the tailgating block, the cloning block and the "two routes" block).
- **Real browser, both routes, real clicks** (my own keyless server on :3047, headless, `playtest-scenario` harness; kit, vest and Len's clone done through the game's own interactions and the RFID read's Save):

| Game | How | Credits | Lines shown |
|---|---|---|---|
| 1456 | Clone at the open door from the parking tile, then walked in behind Len on his next round | clone, tailgate 28 s later | "Cloned badge" only (0.6 s after the clone); `hint_both_routes` done, not shown |
| 1460 | Door click (the door zone's own handler) from 62 px south of the door while open for Len, then `enter` at once | clone, tailgate 0.73 s later | "Cloned badge" only, 0.1 s before the tailgate credit |
| 1461 | The same from 38 px south of the door | clone, tailgate 0.53 s later | "Both routes" only, 1.62 s after the tailgate credit; on screen as a toast |

The click to clone credit took 34 to 240 ms (the server unlock round trip). Mission data was not changed; games 1456, 1460 and 1461 are new rows in the dev database.

### The condition grammar (E5-m1, E5-m2)

- **Engine and validator agree.** I ran `parseActionCondition` (engine) and `action_condition_problem` (validator) from `main` and from the branch over three sets: every `"condition"` string literal in every scenario source (1807 strings), 30,175 random token strings, and 59,073 grammar-shaped strings with 15 kinds of whitespace (ASCII, no-break space, BOM, U+2028, U+0085, U+3000, U+200B, U+001C, NUL) around every term and operator.

| Set | `main` disagreements | Branch disagreements |
|---|---|---|
| Scenario conditions (1807) | 0 | 0 |
| Random tokens (30,175) | 108 | 0 |
| Grammar-shaped (59,073) | 817 | 0 |

  The branch accepts exactly the same scenario conditions as `main` (1103 of 1807 on both sides, same verdict for each).
- **Validator before and after, all 176 scenarios.** `main`'s `validate_scenario.rb` and the branch's, each run on every `scenarios/*/scenario.json.erb` of the branch with `--no-graph`: the outputs are identical for all 176 (22 files with a ❌ line on both, the same lines). So the narrower `||` exemption reports nothing new anywhere, and nothing is lost.

### Patrol guards (E5-m5)

Both callbacks capture `patrolTarget` after it is set and before the request, and the waypoint one clears `_pathfindingInProgress` before the guard, so a dropped answer never wedges the next request. Every assignment to `patrolTarget` in `npc-behavior.js` and `npc-sprites.js` replaces the object or sets null; none rebuilds the same target while a request is in flight, so a good answer is never dropped. A dropped answer after a null target leaves the patrol to choose again, which is better than the old behaviour of walking a path with no target.

### The arrival check in npc-needs (E5-m3)

Confirmed dead. The only way into the arrival block is `phase === 'goto_target'` (`goto_item` returns above it, `queued` goes to `_advanceQueued`), `_advanceJob` has one caller (`tick`), and nothing between the per-tick check and that call returns early. The per-tick check sees the same `atPost`, `caughtEmitted` and `_targetsOwnPost` and runs first. A same-tick arrival queued by `_moveForPhase` (`dist <= HOME_EPS`) is read on the next tick, after the per-tick check again.

### Does each test fail without the change?

Mutations applied one at a time in the worktree and reverted (`git checkout --`), each with its own test file:

| Mutation | Result |
|---|---|
| Dispatcher pairs by position again | timer-give-retry: 1 fails |
| Retry keeps the condition | timer-give-retry: 1 fails |
| `hint_clone_opened` without its `setGlobal` | route-lines: 1 fails |
| `hint_tailgated` without its `setGlobal` | **route-lines: all pass** (R1-n1; the Rails data test catches it) |
| `hint_both_routes` at 1400 ms | route-lines: 1 fails |
| `hint_both_routes` at 2200 ms | all pass (fine: any delay over 1500 ms is correct) |
| Waypoint patrol guard removed | npc-route-multiroom: 1 fails |
| Random patrol guard removed | npc-route-multiroom: 1 fails |
| `goto_target` term dropped from the per-tick check | npc-needs: 1 fails |
| Engine `trim()` back, or `\s` back in `ACTION_NAME` | validator-action-condition: 1 fails each |
| Validator `strip` back | validator-action-condition: 1 fails |
| Old `:js` exemption line, or no `is_action` skip | validator-action-condition: 1 fails each |

Also run, all green: `timer-give-retry` 12, `lab-physical-pentest-route-lines` 5, `validator-action-condition` 4, `npc-route-multiroom` 24, `npc-needs` 61, `npc-needs-slots` 19, `npc-needs-work` 51, `apply-actions-hint-give` 7; `lab_physical_pentest_secrets_test.rb` 36 runs, 0 failures. I did not rerun the full suites (the build log has them green).

## Findings

### R1-m1 (minor). The "Both routes" window misses the usual click-and-walk case, and the comment says the opposite

**Where.** `scenarios/lab_physical_pentest/scenario.json.erb` (the comment above `hint_tailgated`, and `hint_clone_opened`'s `delayMs: 600`); `scenarios/lab_physical_pentest/PLAYTEST.md` (the "Both credits close together" entry).

**Why it matters.** The comment calls a tailgate within 0.6 s of the clone "the usual case when a player in the vest with a clone clicks the open door and walks straight in". In the browser it was not: clicking from one step south of the door (62 px) and walking straight in gave a 0.73 s gap, so the player read "Cloned badge: ... that is what counted: no need to follow him" and was credited with the tailgate 0.1 s later, with no line about it (game 1460). Only from about a tile away (38 px, game 1461) did the gap fall under 0.6 s and "Both routes" show. Nothing false is said and the debrief lists both, so this is minor. But the "no need to follow him" line lands as the player follows him, the case the new line was added to cover. The asymmetry R5 noted (0.6 s one way, 1.5 s the other) is still the reason.

**Fix.** Either of these is a judgement for the user:
1. Give `hint_clone_opened` the same 1500 ms delay as `hint_tailgated`. Worked through: clone first, tailgate at d < 1500, the clone line is skipped and "Both routes" shows at d + 1600; d > 1500, only the clone line. Tailgate first is unchanged. The clone line then shows 1.5 s after the click in place of 0.6 s; its "The door stays open a few seconds after a badge read" still holds. Raise `hint_both_routes` only if it must stay after both (1600 still is).
2. Keep 600 ms and correct the comment and `PLAYTEST.md`: under 0.6 s needs the player at the door when they click; a click from a step away shows the clone line alone.

**Test.** For option 1, add to the route-lines test `run(C, T, 1000)` expecting `['Both routes']` (it now expects `['Cloned badge']`) and `run(C, T, 1600)` expecting `['Cloned badge']`; the Rails test's `delayMs` comparison still holds. Either way, update the `PLAYTEST.md` entry: it says the close case was "not yet seen in play by a scripted run"; games 1460 and 1461 above have now seen both sides of it.

### R1-n1 (nit). The route-lines truth table never reaches the one case where `hint_tailgated`'s flag matters

**Where.** `test/js/lab-physical-pentest-route-lines.test.mjs`.

The tailgate line's `setGlobal` only decides anything when the clone lands 1500 to 1600 ms after the tailgate (the tailgate line has shown, and "Both routes" must not). No case sits there: the table goes from 1450 to 2000, and removing that `setGlobal` passes the file. The Rails test pins the `setGlobal` as data, so the lab is covered; the node test, which claims "exactly one line shows in every case", is not. **Fix.** Add `assert.deepEqual(run(T, C, 1550), ['Tailgated'])`.

### R1-n2 (nit). A failed ERB render turns the route-lines test into a silent skip

**Where.** `test/js/lab-physical-pentest-route-lines.test.mjs`, `const skip = render.status !== 0 && ...`.

The test spawns plain `ruby`. Under a Ruby that cannot load the validator, all five tests skip, and a skip reads as green in a count of files. `validator-action-condition.test.mjs` has the same pattern from before this branch. **Fix.** Fail in place of skipping when the render fails, or print the skip reason to stderr so a run log shows it.

### R1-n3 (nit). "The give already passed its condition" holds within a page, not across a reload

**Where.** `public/break_escape/js/ui/scenario-timer-dispatcher.js`, the comment on the retry; build log E5-m4 row.

When all three retries fail, the timer stays unfired and the next load fires it again, which re-reads the timer's and each action's condition, so a give that passed at the first fire can be skipped then. That is a reasonable outcome (it is a fresh fire), but the comment reads as if the decision is final. **Fix.** One clause: "within this page; a reload after the retries give up fires the timer again and reads the conditions afresh". Separately, and older than this branch: a `cancelOnGlobal` that lands during the retries does not stop them, and the timer is then also marked fired. Worth a line in the backlog, not a change here.

### R1-n4 (nit). Two loose ends in the new validator test

**Where.** `test/js/validator-action-condition.test.mjs`, third test.

The comment "An entry of a conditionalActions list is not an action: its own condition gets the soft warning" has no case or assertion behind it. The `desk|` alternative in the filter regex matches nothing (issue paths use indices, not ids); the `issues.length === 1` assertion is what makes the test bite. **Fix.** Add a `conditionalActions` entry with `||` and assert its soft warning (that would make the count 2), or drop the comment; drop `desk|`.

### R1-n5 (nit). The two action-list walks disagree on what an action is

**Where.** `scripts/validate_scenario.rb`, `check_or_in_global_conditions` and `check_action_conditions`.

The `||` check now exempts the own condition of every entry under an action-list key. The grammar check reads an entry only if it has a `type`. An entry with a `condition` and no `type` under one of those keys is not an action, so it is checked by neither. No scenario has one (the 176 outputs are identical before and after). **Fix.** In the `:action` branch, treat the hash as an action only when it has a `type`: `is_action = ctx == :action && node.key?('type')`.

## For the orchestrator

1. Nothing blocks a merge. R1-m1 needs the user's call between the two options (a 1.5 s clone line, or a corrected comment and playtest note).
2. The nits are one line each; R1-n1 and R1-n5 are the ones worth doing with R1-m1.
