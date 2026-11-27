# m09 office life: plan-phase handover

Worktree `.claude/worktrees/p-ol-m09`, branch `plan/ol-m09`. The plan review loop is closed.

## Done

- Stage 0 baseline: `BASELINE.md`, `baseline_locks.json` (11 lock nodes), `positions_base.txt` (58 rows), `v1_summary_base.txt`, `validator_info_lines.txt` (empty). V6: 0 clips.
- Plan review, five rounds, each saved as `REVIEW_R<n>.md`: R1 B0 M5 m8, R2 B0 M3 m8, R3 B0 M1 m5 (all full reviews on the planning tier), R4 B0 M1 m5 (delta, cheaper tier), R5 B0 M0 m3 (delta, back on the planning tier after the R4 major). Every finding fixed; none deferred.
- `PLAN.md` round 5, standalone. Tier unchanged: 0 for people plus `roomTone: true`, no `roomToneTypes`. The validator will show 31 warnings (one new, accepted). Four rooms play their authored levels for the first time (closet 0.4, cage 0.5, tape room 0.35, salvage cage 0.6), and three late scenes in the salvage cage play over the hum ducked to 0.3.
- `QUESTIONS.md`: Q1 tier, Q2 Noor's cooler trip, Q3 the louder authored levels.

## Next

1. The user answers Q1 to Q3 (through AC0's decisions page).
2. Build on `build/ol-m09`: one slice (add the key beside `npcThoughts`, run 10.1, commit, then 10.2 to 10.4 live proof), then the build review loop.

## Gotchas

- Doors start shut on every load and stay open once opened; in the reading room `open_stacks` always wins on the normal route.
- The duck multiplies only the sound's volume; read `_ambientLevel`, `_ambientDuck` and the sound object's `volume` separately.
- Long section rewrites in PLAN.md were done by Python splices; a bare `cat > file` with no heredoc hangs on stdin.

## Build phase (branch build/ol-m09)

- Scenario change: `"roomTone": true` beside `npcThoughts` (d4584a4ad). Static checks and live readings are in `BUILD_REPORT.md`.
- Build review: R1 B0 M0 m6 (planning tier, full), R2 B0 M0 m2, R3 B0 M0 m0, R4 B0 M3 m6 (cheaper tier, report evidence overclaims), R5 B0 M1 m6 (planning tier). All fixed. R6 (delta, `BUILD_REVIEW_R6.md`): B0 M0 m3, all fixed. R5's major is closed. **The build review loop is closed.**
- Not run: front_desk and staff_passage silence readings (route A), open_stacks frame time, baseline frame comparison, persona listen. Not yet written: per-round REVIEW_R files for the build (round results are only in this note and the commit messages).
- Housekeeping done: server :3095 stopped; the worktree `node_modules` symlink pre-existed and is left alone.

## Remaining

- The user's listen check of the hum levels (D111a).
- front_desk and staff_passage silence readings (route A), not run.
- Frame-time comparison against the baseline and the open_stacks frame time, not run.
- Stale engine comments on the null-room hold, for the room-tone owner.
- Merge to main goes through the train.
