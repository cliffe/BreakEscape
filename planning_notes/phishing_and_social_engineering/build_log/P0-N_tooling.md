# P0-N: playtest tooling (plan item 0.11)

Run 2026-10-21. Keyless :3001 only; :3000 untouched. Nothing committed.

## Files

- `tools/playtest/verify-run.rb` (edited): always prints the `objectivesState` tasks (status, completion time), `tasks_completed`, `score` and whether the scenario is social. Completed tasks join the verdict signals only when `scenario_data` has a top-level `social` key or `--tasks` is passed. Without either, the signals and verdict text are unchanged.
- `tools/playtest/count-task-posts.sh` (new): `count-task-posts.sh <game_id> [task_id] [log]`.
- `tools/playtest/se/check-bridge.mjs` (new): `node check-bridge.mjs <session.jsonl> [--allow-empty]`.

## How count-task-posts decides "200"

Rails logs `Completed 200 OK` without the path, and the three Puma threads interleave lines (seen at log line 316568 onward), so the status line cannot be matched to its request. The script queues each `Started POST` on the exact path (a `/skip` or query-string path never matches) and pairs it with the controller's own marker `[BreakEscape] Task completed: <task_id>` (games_controller.rb:1050), logged only on the success path that renders 200. `Task completion failed` (422) and an exception (500, no marker) leave the request unpaired, so they are not counted. A repeat POST for an already completed task answers 200 and logs the marker, so it counts, which is how a double completion shows. Limit: two games completing the same task id at the same moment with one failing could swap counts. It prints the server start time (ps lstart of the PID in the log header while the server runs, else the first request in the log).

## Gate

Fixture game 2816 on `test_objectives` (collection `testing`, already in the dev DB, no seed needed). Runner snippet: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-N/fixture_game.rb`. It completed `explore_reception` and `enter_office` through `complete_task!`; `unlock_office` and `unlock_safe` refused, as designed.

```
verify-run.rb --tasks 2816
tasks           2 in objectivesState, 2 completed
  enter_office     "completed"  at 2026-10-21T10:45:27Z
  explore_reception "completed" at 2026-10-21T10:45:27Z
tasks_completed 2
score           23
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
exit=0

verify-run.rb 2816            (no --tasks, not social)
VERDICT: BOOTSTRAP ONLY — ... exit=1      (tasks still listed)

verify-run.rb --tasks 2818    (fresh test_objectives game)
tasks 0 ... VERDICT: NO PROGRESS RECORDED ... exit=1
```

m05 game 2817 made with `PLAYTEST_PORT=3001 new-game.rb m05_insider_trading`; opening played headless on :3001 (session log `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-N/opening-session.jsonl`, session exited itself, no browser of mine left). The opening completed `receive_mission_briefing`:

```
verify-run.rb 2817
tasks           1 in objectivesState, 1 completed
  receive_mission_briefing "completed" at 2026-10-21T10:46:10Z
tasks_completed 1
score           2
VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.   exit=1
```

`count-task-posts.sh 2817` on the real log: `game 2817 task receive_mission_briefing: 1 completed POST(s) with 200`.

`count-task-posts.sh` on a hand-written interleaved fixture log (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-N/fixture.log`), game 7: alpha 200 = 1; beta (PUT) = 0; gamma (`/skip`) = 0; delta (500 then retried 200) = 1; eps (422) = 0 completed, 1 refused; game 8's alpha not counted for game 7.

`check-bridge.mjs`: hand sample (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-N/sample-bridge.jsonl`: one true, one false, one non-boolean, one waitFor timeout) gives 3 evals, 1 passed, 2 failed, one warning, exit 1. A file of only the true eval gives PASS, exit 0. A file with no eval gives FAIL (exit 1) unless `--allow-empty`. The real opening session log also fails on my deliberately wrong probe (`currentRoom` is not a state key), exit 1.

## Not tested

The `social`-key path of verify-run.rb: no scenario has a `social` key yet. It uses `g.scenario_data.key?('social')`, so it will switch on once one does.
