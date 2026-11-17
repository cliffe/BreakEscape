# m04 office life: plan-phase handover

Branch `plan/ol-m04`, worktree `.claude/worktrees/p-ol-m04`, base main `3e00651a8`. Plan phase only; do not build.

## Done

- Stage 0 baseline files (`BASELINE.md`, `baseline_locks.json`, `v1_summary_base.txt`, `positions_base.txt`, `validator_info_lines.txt`). V6 deferred to the build (needs Rails).
- `PLAN.md` written (m05 shape, standalone; the cast audit and analysis are in its sections 1, 2.1, 2.2 and 2A). `QUESTIONS.md` written with Q1 to Q5 and the cast picks at the top.
- Cast re-picked: `ibrahim_diallo` and `joanne_pell` (Chidi and Jun are the showcase core cast). Both atlases have seated and pose frames.

## Open

1. Plan review rounds: none run yet. R1 on the `opus55` agent type, read-only, findings as text; save as `REVIEW_R1.md` (if refused as a file name, `R1_FINDINGS.md`) with B/M/m counts; rewrite PLAN.md standalone after each round; R4 and R5 Sonnet deltas per the skill; stop at R5 unless a blocker is open.
2. A tool hook refused writing `ANALYSIS.md` ("Subagents should return findings as text, not write report files"). Its content was folded into PLAN.md. Review files may hit the same filter.

## Findings worth knowing

- The head count is in four voiced lines, not one: `ink/m04_opening_briefing.ink:315`, `ink/m04_npc_voltage.ink:239`, `:436`, `ink/m04_closing_debrief.ink:433`, plus credit 242. Q2 says so.
- `room_entered:*` is a prefix wildcard in the dispatcher (`public/break_escape/js/systems/npc-events.js:54` to `:56`); the plan uses it for the evacuation hide, with a per-room fallback if the validator rejects it.
- Room geometry (estimates from the Tiled maps): reception sofa sprite top-left (196,214), cooler sprite 264,153 to 288,200, planter collision y 238 to 250, guard at (7.3,4); ops kettle at (203,44) on a counter with collision to y 92, Vance at (5,7).
- `vance_met` is declared `false` at `scenario.json.erb:3024`.
