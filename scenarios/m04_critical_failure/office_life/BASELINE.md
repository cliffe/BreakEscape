# m04 Critical Failure: office-life baseline

Branch `plan/ol-m04`, base main `3e00651a8`. Campaign mission (m04), so the skill applies without a special yes.

| Item | Value |
|---|---|
| Validator | 0 errors, 25 warnings; info lines in `validator_info_lines.txt` (one: legacy desk boxes in 9 maps) |
| V1 summary | `v1_summary_base.txt`: 12 NPCs, none with needs |
| Lock and key baseline | `baseline_locks.json`: 7 lock nodes, 0 gates |
| Object positions | `positions_base.txt`: 52 rows |
| V6 (cached office clips) | not run: needs Rails with the worktree env; deferred to the build's slice 3 |
| `gameClock` | start 04:05, rate 1; anchor 08:40 on `debrief_started` (`scenario.json.erb:546` to `:549`) |
| `npcThoughts` | false (D77) |
| `disableAttacks` | not set: every NPC can be attacked |
| Start room | `main_entrance` (`:564`) |
| `patrolOverride` | none in the scenario |
| Walkthrough | No current file in the mission folder. Player walkthrough: the HacktivityLabSheets page at `mission.json:7`. Regression routes: `scripts/ink_runtime_check/m04_routes/`. `stale_TESTING_WALKTHROUGH.md` (last updated 2026-10-01) is reference only |
