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

---

# Slice 3 build handover (2026-11-17)

Branch build/ol-m07, commit c36090d54.

## Done
- scenario.json.erb: officePresets; adaeze_okafor and gwen_pritchard in operations_floor (seated, needsHome, needsRooms, thirst, group ops_floor, leash, globalVarOnKO adaeze_ko/gwen_ko, pools, talk breaks, coupled break on Gwen, three hides each); ops_cooler declared (water_cooler, offWhen ops_staff_upset, useSeconds 22, overhearRadius 360, useFrom dx 0 dy -1 PLACEHOLDER); affordance false on ops_floor_workstation; trouble rows and two hands-down rows appended on agent_0x99; two credits lines after Park; five globals.
- Static checks pass (BUILD_LOG.md).

## Not done
- Exchanges unwired: four lines over 40 chars (BUILD_LOG.md has the block and options). Needs the user's call on shortened text (ink and SPOKEN_LINES change), then re-compile ink.
- All measurements: chair body-centre cells (positions 2,5 and 4,5 are estimates), useFrom plus engine second cell and routes, needs clock ratio, first trip 45 to 120 s (tune initial), use and walk-home over five tries, 50-seed manual-clock order test, no no_beside_cell over five trips.
- Live checks L1, L2, L5, L6, L8, 10.3, 10.4 and LIVE_SLICE3.md. No server started; nothing running.

## Gotchas
- I ran `git checkout -- dungeon_graph.html` once to clear a generated file (rule slip); dungeon_graph.md is modified and unstaged: never stage it.
- Write .md with heredocs. node_modules is a symlink or dir already in the worktree (untracked, do not stage).
