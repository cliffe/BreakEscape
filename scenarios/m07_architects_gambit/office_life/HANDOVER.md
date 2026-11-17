# m07 office life: handover (plan phase done, five review rounds)

Branch `plan/ol-m07`, worktree `.claude/worktrees/p-ol-m07`. Nothing built. Plan review loop finished at R5 with no blocker or major open.

## Done

- Stage 0 baseline: `BASELINE.md`, `validator_info_lines.txt`, `v1_summary_base.txt`, `baseline_locks.json`, `positions_base.txt` (V6: 0 clips).
- `ANALYSIS.md`, `PLAN.md` (rewritten after R1), `QUESTIONS.md` (picks for AC0 at the top: Adaeze Okafor, Gwen Pritchard).
- R1 (planning tier): B1 M3 m7, all fixed in the rewrite (`REVIEW_R1.md`).
- R2 (planning tier): B0 M3 m5 (`REVIEW_R2.md`), applied.
- R3 (planning tier, full): B0 M3 m1 (`REVIEW_R3.md`), applied: real jitter mechanism, coupled row sets thirst 30, cooldown cut, m05 `hub_quiet` guard, ink-local keys in the sync budget.
- R4 (delta): B0 M0 m2 (`REVIEW_R4.md`), applied: coupled cooldown 10000, 50-seed order check over three paths.
- R5 (delta): B0 M0 m2 (`REVIEW_R5.md`), applied: two text corrections.

## Next

1. AC0 answers QUESTIONS.md Q1 to Q4 (and the cast clash check).
2. Then the build stage: `DIALOGUE_SAMPLE.md` for approval before slice 5, then slices per PLAN.md.

## Decisions taken (log for the user)

- Cast: AC0 excluded the Office Life Tour cast, Lerato, Tomasz, Darren, Ibrahim, Joanne; every free man's voice clashes in m07 (Iapetus, Rasalgethi, Sadaltager), Lorna is facilities (6/6 clear), so two women.
- B1: the handover sheet says the coffee machine is broken (`scenario.json.erb:1904`), so the pair use the cooler only; the coffee station stays undeclared decor.

## Gotchas

- The Write tool refuses `.md` files in a subagent; write plan files with a shell heredoc.
- Do not stage `dungeon_graph.*`. Commit with `git commit -m ... -- <paths>` after `git diff --cached --stat`.
