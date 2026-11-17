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

Review loop state: R1 done (1 B, 3 M, 5 m; all fixed in PLAN.md, commit 795e13bf4). R2 done (1 B, 3 M, 6 m), saved as `REVIEW_R2.md` with each outcome decided, **but the PLAN.md rewrite for R2 is not applied yet**.

1. Apply every R2 outcome in `REVIEW_R2.md` to PLAN.md (standalone, no review references), and the Q2 change to QUESTIONS.md (Victoria's in-person gallery scenes; option to re-voice Sofia in m10 only to Vindemiatrix or Achernar). Commit with explicit paths.
2. R3 on `opus55` (R2 had a blocker and majors): full read-only review, plus the R2 unchecked items (end of forward_post objects array near `:2740` against ERB; new crate collision against the row-8 lane; validator on `startSound`; needs timing against the briefing window).
3. R4 and R5 as delta reviews on Sonnet (diff since last round plus previous findings); back to `opus55` if Sonnet finds a major or a delta adds a design decision. Stop at R5 unless a blocker is open.
4. Reviewers never open SecGen XML or scenario files, Vagrantfiles or exploit-detail field guides. Commit each round with explicit paths after `git diff --cached --stat`; never stage `node_modules` or `dungeon_graph.*`. If a tool refuses to write a file, do not work around it: put the text in the report.

## Commits

`1ae7106d2` stage 0 start; `595dea9e4` baseline, plan and questions. Recast `3f8768edc`; R1 `795e13bf4`.
