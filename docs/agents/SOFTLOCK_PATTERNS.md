# Softlock patterns: what to check

A softlock is a reachable state where the player can no longer finish, or loses an ending, with no error to say so. These patterns were found in shipped missions (sis02 Marcus Webb, October 2026). Every review, playtest and lab-sheet pass should check for them. Knockout softlocks (an NPC whose KO strands a required task) are covered separately in `README_ink_best_practices.md` and `scenario-design-review` §2h.

## The patterns

| # | Pattern | How it shows up | How to check |
|---|---|---|---|
| S1 | **Burnt first-call gate** | A first conversation offers once-only (`*`) choices; the progress choices need evidence, and a "nothing yet" choice diverts to the hub. Later calls go straight to the hub, which never offers the progress path again. The global the lock needs is never set. | For every knot that sets a gating global (`#set_global:` or `~ x = true` read by a lock, timer or task), list every route into it. If all routes start in a once-only first-call menu, the player who calls early is stuck. The hub needs a sticky (`+`) option for each kind of evidence, gated on `not <global>`. |
| S2 | **Order dependence** | Items or rooms the designer expected in sequence can be reached out of order (a loose key, an open door), and the gate accepts only the "expected" evidence. | For each gate, ask what else the player could already hold when they arrive. Accept any sufficient evidence, in any order. Walk the dungeon graph for alternative routes to the same rooms. |
| S3 | **Said but not set** | Dialogue announces an outcome ("I'm authorising the shutdown") on a branch that does not set the global the lock checks. | Grep each line that promises an unlock, authorisation or handover, and confirm the same knot sets the global or gives the item. |
| S4 | **Premature task completion** | `#complete_task` fires at the start of a call (or on opening an object) rather than when the substantive outcome happens. The server reveals the next aim, telling the player they are done. | Each `#complete_task` should sit in the knot where the outcome happens, not in `start`. Check what unlocks when it completes. |
| S5 | **Sticky option over exhausted once-only content** | A `+` option leads to a knot whose sub-choices are all `*`. After they are used up, choosing it again runs out of content and the ink errors. | For each `+` option, check whether its target can run dry; hide it once every sub-choice has been taken. `loopcheck` finds these if the state matrix revisits the knot enough times. |
| S6 | **Unreachable setter after a branch** | A global needed later can only be set on one branch of an earlier decision, or before a timer fires. | For every required global, list its setters and the conditions on them. Check each ending branch and each timer-cancelled path still reaches one. |
| S7 | **Lock waits on an event that cannot recur** | A lock, timed message or objective waits for `global_variable_changed:x` or an item pickup that already happened, or can only happen once, before the listener exists. | For each `waitForEvent`/`eventPattern` on the critical path, check the event can still fire after the listener is armed, or that the condition is also checked on arrival. |
| S8 | **Advice that hides a bug** | A lab sheet, hint or solution guide warns the player not to do something ordinary ("don't call Marcus before you have evidence"). | Treat any such warning as a bug report. Reproduce it; fix the game, then remove the warning. |

## How to test for them

- **Multi-call scripts.** Play an NPC's ink several times in a row with the game's phone/person-chat reopen logic, changing globals between calls to match what the player could have found. Cover: call early then bring each kind of evidence; evidence on the first call; out-of-order progress (S2); open the call and close it without choosing. Assert the gating global is set and the task completed in every path except the no-evidence one. `scripts/ink_runtime_check/` has `inkcheck.js`, `loopcheck.js`, `reopencheck.mjs` and `tagdiff.mjs`; a per-mission multi-call script can be built on the same runtime.
- **State matrix.** Run `inkcheck`/`loopcheck` over combinations of the evidence globals, not just the happy path.
- **Compare with the committed version.** A good test fails on the old ink. If it passes on both, it is not testing the bug.
- **Playtest the off-path orders.** In browser playtests, deliberately do the ordinary wrong thing first: call the handler early, open the far room first, skip an optional NPC, then carry on.

Report softlocks as **blocker** / **Must fix**.
