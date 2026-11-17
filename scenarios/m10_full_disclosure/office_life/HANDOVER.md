# m10 office life: plan-phase handover

Branch `plan/ol-m10`, worktree `.claude/worktrees/p-ol-m10`, base main `3e00651a8`. Plan phase only: no build, no servers.

## Done

- Stage 0: `BASELINE.md`, `positions_base.txt` (76 rows), `validator_info_lines.txt`, `v1_summary_base.txt`, `baseline_locks.json`. V6 not run (needs Rails env; said so in BASELINE.md).
- `PLAN.md` written (m05 shape, sections 0 to 10). The Stage 1 analysis is folded into PLAN.md section 1A: the harness refused a file named ANALYSIS.md as a report file.
- `QUESTIONS.md`: final casting picks at the top (Darren Price, Orus; Sofia Marchetti, Despina; recast from Ama and Lorna, who are in the Access Tour demo), then Q1 tier, Q2 casting, Q3 voicing, Q4 kettle spot.
- Plan in one line: bunker Tier 0; two extras posted at the use cells of a new `fp_kettle` on a third Tiled kit crate south of the folding table (about (8,8) and (9,8)), caffeine only, a one-way coupling, a mapped break on `conversation_closed:director_netherton`, three exchanges gated on the act globals, hidden at `closing_done`, `fp_staff_upset` (7 onceOnly on `agent_0x99`) and `fp_staff_ko`, six o'clock ink gets `or fp_staff_ko` at `:334` and `:375`, no `officePresets`, no levers.

## Casting facts behind the picks

- No free course character has a voice m10 leaves unused. Picks share voices with bunker-only phone contacts: Orus with `vance_phone`, Despina with `victoria_line`/`victoria_threat`. m10 already shares Iapetus three ways.
- Taken elsewhere: Access Tour demo (Ama, Lorna, Delphine, Julian, Thandiwe, Yasmin), Office Life Tour (Chidi, Jun, Graham, Agnieszka, Zainab), m01 (Fatima, Graham), m03 (Yusuf, Zainab), m04 (Ibrahim, Joanne), m05 (Niamh, Thandiwe), m06 (Lerato, Tomasz), m07 plan (Adaeze, Gwen).

## Open (resume here)

Review loop state: R1 to R8 done, each saved as `REVIEW_R<n>.md` with its fixes applied to PLAN.md. Counts: R1 1 B 3 M 5 m; R2 1 B 3 M 6 m; R3 0 B 2 M 4 m; R4 (delta) 1 B 0 M 3 m; R5 0 B 2 M 2 m; R6 (delta) 0 B 1 M 4 m; R7 (delta) 0 B 1 M 4 m; R8 (delta) 0 B 1 M 1 m; R9 (delta) 0 B 0 M 0 m. The review loop is closed.

1. Review loop closed at R9 (0 B, 0 M). Next: the user answers Q1 to Q5, then build per the skill. At build, check each new NPC's `displayName` matches its exchange prefixes exactly.
2. User questions open in `QUESTIONS.md`: Q1 tier, Q2 casting (now with Victoria's in-person overlap and option e, re-voice Sofia in m10 only), Q3 voicing, Q4 kettle spot, Q5 hearing radius (320 recommended).
3. Reviewers never open SecGen XML or scenario files, Vagrantfiles or exploit-detail field guides. Commit each round with explicit paths after `git diff --cached --stat`; never stage `node_modules` or `dungeon_graph.*`. If a tool refuses to write a file, do not work around it: put the text in the report.

## Commits

`1ae7106d2` stage 0 start; `595dea9e4` baseline, plan and questions. Recast `3f8768edc`; R1 `795e13bf4`. R2 outcomes `591243091`; R3 `e4d5cc615`; R4 `cb9954611`; R5 `ca3351f71`; R6 `66a1805db`; R7 `d560ac9bf`; R8 `fd588c8e8`; R9 in the commit that adds `REVIEW_R9.md`.
