# m07 office life: handover (plan phase, round 2 done)

Branch `plan/ol-m07`, worktree `.claude/worktrees/p-ol-m07`. Nothing built. Stopped at the context guard after R2.

## Done

- Stage 0 baseline: `BASELINE.md`, `validator_info_lines.txt`, `v1_summary_base.txt`, `baseline_locks.json`, `positions_base.txt` (V6: 0 clips).
- `ANALYSIS.md`, `PLAN.md` (rewritten after R1), `QUESTIONS.md` (picks for AC0 at the top: Adaeze Okafor, Gwen Pritchard).
- R1 (opus55): B1 M3 m7, all fixed in the rewrite (`REVIEW_R1.md`).
- R2 (opus55): B0 M3 m5 (`REVIEW_R2.md`), fixes listed there but NOT yet applied to PLAN.md.

## Next

1. Rewrite PLAN.md standalone applying every R2 fix in `REVIEW_R2.md` (no review references in PLAN.md). Commit.
2. R3: R2 had majors on Opus, so R3 stays on opus55 as a full or delta round (diff since f342c2e1b plus R2 findings). R4 and R5 are delta rounds on Sonnet (back to opus55 if Sonnet finds a major or a new design decision appears). Stop at R5 unless a blocker is open. Save `REVIEW_R<n>.md` with "B x / M x / m x".
3. Keep QUESTIONS.md in step (clip count now about 28; update if the M2 ink branches change it).

## Decisions taken (log for the user)

- Cast: AC0 excluded the Office Life Tour cast, Lerato, Tomasz, Darren, Ibrahim, Joanne; every free man's voice clashes in m07 (Iapetus, Rasalgethi, Sadaltager), Lorna is facilities (6/6 clear), so two women.
- B1: the handover sheet says the coffee machine is broken (`scenario.json.erb:1904`), so the pair use the cooler only; the coffee station stays undeclared decor.

## Gotchas

- The Write tool refuses `.md` files in a subagent; write plan files with a shell heredoc.
- Do not stage `dungeon_graph.*`. Commit with `git commit -m ... -- <paths>` after `git diff --cached --stat`.
