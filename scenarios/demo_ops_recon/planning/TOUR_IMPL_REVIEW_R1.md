# demo_ops_recon: guided tour, implementation review R1

Reviewer: implementation review, round 1 (read-only). Tree `/data/be-ops-follow`, branch `ops-showcase-tour` at `b8cf2c394` (main merged). Checked against `docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md` sections 1.1, 2.1, 2.3, 2.7 and 4, its review R4, the U1 build report, `planning/BUILD_REPORT.md` (section "Showcase tour U1"), `PLAYTEST.md`, the scenario, the six ink files and the Rails test. No SecGen XML, realism catalog or field guide was opened.

**Verdict: not clean.** 0 blockers, 2 majors, 6 minors. The engine wiring is right: every planned beat is in the guided path, ticks on the right event and can be reached by clicking in order, and the gate and the leak scan hold. The two majors are a teaching line that is not true and a PLAYTEST whose run tables contradict its own guided path.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_recon/scenario.json.erb --no-graph` | 0 errors, 26 warnings (the same count as the U1 report) |
| Ink compile (`bin/inklecate` into scratch, compared with the committed `.json`) | all six compile, and each is the same as the committed JSON |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/demo_ops_recon/` | totals by rule: none |
| `ruby tools/check_mapping_index_drift.rb main` | 3 scenarios, 0 failures |
| `bin/rails test test/controllers/break_escape/demo_ops_recon_scenario_test.rb` (under flock) | 24 runs, 416 assertions, 0 failures |
| `bin/rails test test/unit/break_escape/tts_mission_lines_test.rb` (under flock; U5 ran it before U1 landed) | 6 runs, 0 failures: no voiced line prints a variable |

## Coverage against plan 2.3

| Beat | In the guided path | Tick and line checked against the code |
|---|---|---|
| R1 `plug_in` | pointer with the Jun line (`ink/ama_owusu.ink:72-78`) | `network_foothold_gained:<jack id>` (`network-links.js:467`), live in U1 |
| R2 `sweep`, R3 `scan_printer` | yes | as before; barks at `scenario.json.erb:506-507` |
| R3b outage | pointer (`ama_owusu.ink:88-91`) | `set_global` emits on every call (`apply-actions.js:224-231`), so the printer-off bark (`:501`) can fire. Not seen live in U1 or in round 2 (PLAYTEST A5) |
| R4 `confirm_both` | yes | unchanged mappings `:494-497` |
| R5 `use_card` + false-card pointer | yes (bark `:520`) | |
| R5c `remote_signin` | pointer `:95-97`, panel, board | `pc_signed_in:agnieszka_pc` (`_replace` emit `pc-sessions.js:1003-1006`), live in U1 |
| R6 `terminal_view` + R6c | pointer, ink tick, R6c line in `terminal_ticked` | the scan in the Terminal is a table (`terminal-format.js:304-309`, `tableLines` `:237`) |
| Gate | `lever_day_end` (`ama_owusu.ink:153-217`) | the seven beats of rule 2.1.4, one line per undone beat, with "Skip them" |
| R7a, R7b barks | yes | `noteTechniqueSession` -> `_replace` -> `pc_signed_in` with `via: 'technique'` and the grant's `npcId`; a step up to another account is a new sign-in (`pc-sessions.js:748-770`, `:987-1006`); `hostId` is `file_server` (`network-view-minigame.js:1099`). The "red frame" is real: the remote view's screen rim is red for a technique session only (`container-minigame.js:801-805`, `ui-themes.css:1584-1586`). From the code only; not clicked live |
| R7c `open_share` | yes | as before |
| R8 `read_log` | yes | see M1 |
| R8c `unplug` | pointer with `{box_at_kitchen: kitchen\|hot desk}` (`:124-126`) | `network_device_unplugged:<jack id>` (`network-links.js:608`), both jacks, `open_share_done` condition; `endedPcIds` proved by the Rails probe test |

Objectives (`scenario.json.erb:224-262`), the board (`:469`) and "What's next?" list the beats in the same order. Every planned beat is reachable by clicking in order, and none is lost for good: a morning unplug fails the unplug mapping's condition and does not spend its once-only record. Zainab's card hand-over works wherever she is. The kitchen port gives a no-wait way in. The leak scan is honest: `play_whole_run` (test `:541-619`) loads every room, plays the new R5c credential sign-in at Agnieszka's PC, both cards, the step up, the log read and both unplugs, then scans every answer. A separate test (`:173`) checks that no mapping names a finding id. The R7a and R7b conditions name only `npcId` values. No voiced line prints a variable: the one inline conditional chooses between two fixed strings, and both are listed in `VOICED_LINES.md`. No line carries a stage direction.

## Findings

### Major

**M1. The R8 line "Every move you made is in that log" is not true for the tour's own R5c beat.**
- The line is the bark at `scenario.json.erb:519`, with the recap "The log kept every step you took" at `ama_owusu.ink:293`.
- The recon log source lists only network events (`scenario.json.erb:163`): link up and down, sweep, scan, check, confirm, technique and share open.
- The saved-connection sign-in at Agnieszka's PC writes a `signin_ok` row with method `credential` and route `foothold` (`app/models/break_escape/game.rb:4831-4835`), but only into a source that lists `signin_ok`. This one does not. So R5c, the beat U1 added, never shows in the log the player reads at R8.
- Fix, either one: (a) add `"signin_ok"` to `logSources.network_log.events` (it is the log's lesson; update the R8 rows test); or (b) soften both lines to the network moves ("Every move you made on the network is in that log ..."). Option (a) teaches more, and the row carries no secret (detail is method and route only, `ops_log_events.rb:26-27`).

**M2. PLAYTEST's run tables contradict its guided path and the scenario.** The next stage, a Haiku guided playthrough, reads these "Expect" cells and would report false failures.
- R1b (`PLAYTEST.md:105`) expects the old bark "You're in. Now see what answers." and the old kitchen line.
- R2 (`:106`), R3 (`:107`) and R5b (`:119`) quote the old barks ("That's everything that answers. Pick the printer and scan it.", "Try it from her row.").
- R8c (`:144`) is still a "Free beat" that expects "Unplugged. Every session through that box has ended with it.". The guided path makes it the `unplug` task with a new line.
- A0 (`:103`) and "End of run" (`:151`) say eight tasks. There are now ten.
- Line 93 lists the printer socket and Jun's catch as free play, but the tour now points at both (R3b, R1).
- Run B's R6c (`:124`) is the tell-Ama step, but the guided path's R6c is the Panels-switch pointer. Rename one of them.
- Fix: update the Expect cells to the current lines (copy them from the guided path table), make R8c a task beat, and change the task counts.

### Minor

**m1. Once the printer is off, nothing in "What's next?" says to switch it back on.** The R3b pointer, including "Then switch it back on.", is shown only while `not printer_off` (`ama_owusu.ink:88-91`). After the switch-off, "What's next?" says "Check the printer's admin page ..." and the bark says only "It won't answer on the network now.". The check and confirm then fail while the printer is down. This is recoverable, so the beat is not lost. Add `{ printer_off: Switch the printer back on at its wall socket first. }` (fixed text, voiced) as the first line of the `not confirm_both_done` branch.

**m2. A stale-bark guard can drop the R8 line, or the R7c line, for a player who goes out of order.**
- The read-log bark requires `unplug_done !== true` (`:519`), but the unplug ticks on `open_share_done` alone (`:500`, `:512`). A player who unplugs right after the share and then reads the log never hears R8's line.
- In the same way, the share bark requires `read_log_done !== true` (`:511`), and the log terminal is usable all day.
- The recaps still carry both lessons. Either accept this (it is the rule-2.1.1 pattern) or drop the guard on R8, the last teaching beat.

**m3. Moving the box from the kitchen to the hot desk repeats the plug-in bark mid-game.** Both plug-in mappings are once-only per jack (`:491`, `:505`). A player who plugged in at the kitchen and later plants at the hot desk hears "You're on the office network now. ... Now sweep the network." whenever that happens. Add `globalVars.plug_in_done !== true` to the condition of each. A failed condition does not spend the once-only record, as the build report notes.

**m4. The waits were not measured.**
- Plan 2.1.3 and the 4.1 "Done" criteria ask for the measured seconds of each lever window in PLAYTEST. `PLAYTEST.md:63` and `:91` still say the coffee and lunch windows "were not re-measured" and are "estimates (the build did not measure them)". Zainab's evening trip is also unmeasured (`:164`).
- The kitchen port avoids the wait, but Ama's R1 pointer and the board send the player to the hot desk.
- Measure in the Haiku run, or have the R1 pointer mention the kitchen port as the no-wait alternative.

**m5. R7a to R8c were not clicked live.** U1's live check stopped at R6. R7a, R7b, the R7c bark, R8 and the R8c tick and line are checked from the code (above) and the Rails mappings test only. The Haiku guided run must cover them, and also report whether the R3b printer-off bark shows (PLAYTEST A5 says round 2 never saw it, although the emit path is sound).

**m6. The `terminal_view` tick is a self-report.** The choice "I looked at the file server in the Terminal." is offered on `file_server_seen` (`:504`), which is a scan in either skin. A player who scanned in Panels can still claim it and hear "Its scan came back as a table". This is a known limit, as for the other self-reports in plan 4.2. Note it in PLAYTEST, or set a global from a Terminal-only signal if one exists.

## Not findings (checked)

- The barks in the plan's table are lengthened by a next-step sentence. Plan rule 2.1.1 allows this ("where useful, a second sentence pointing at the next beat"), and every bark is within the 30-word cap (test `:442`).
- The voice styles name Merrin & Sallow and keep the voices and accents of plan 3.2. `ttsPregenerateChatter` is set.
- "Call it a day" before the kitchen and server room are seen still gives the room line first, then the tour gate (`ama_owusu.ink:154-162`), as the plan orders.
