# m04 office life: plan-phase handover

Branch `plan/ol-m04`, worktree `.claude/worktrees/p-ol-m04`, base main `3e00651a8`. Plan phase only; do not build.

## Done

- Stage 0 baseline files. V6 deferred to the build (needs Rails). BASELINE.md walkthrough row corrected: no current walkthrough file; the HacktivityLabSheets page (`mission.json:7`) and `scripts/ink_runtime_check/m04_routes/`.
- Plan review rounds 1 to 3, all on the opus55 agent type, each saved as `REVIEW_R<n>.md` with outcomes, PLAN.md rewritten after each:
  - R1: 0 B / 3 M / 3 m (partial, context guard).
  - R2: 0 B / 3 M / 9 m (partial, context guard).
  - R3: 1 B / 2 M / 7 m.
- Main plan changes so far: cooler capacity 1 (second cell blocked); kettle gate opens on `vance_met` AND `vance_provided_keycard`; both newcomers talkable (one line plus a curt variant; Ibrahim's file `m04_npc_ibrahim_diallo.ink` owns the exchanges); coupling on `npc_use_started:ops_kettle`; guard's hostile numbers; head count option (d) "off the roster" (credit, debrief `:433` and the blueprint note at 2739 change; one re-voice); `hydrogen_alarm` dropped as an evacuation cause; exchange prefixes are exact displayNames.

## Open

1. Round 4. R3 had a blocker and two majors, so R4 goes back to opus55 as a delta (diff `git diff acb2e682a -- scenarios/m04_critical_failure/office_life/PLAN.md` plus REVIEW_R3.md), checking each R3 fix landed and nothing new broke. Then R5 on Sonnet as a delta if R4 has no B/M. Stop at R5 unless a blocker is open.
2. Reviewers keep running out of context at about 150k: brief them narrowly with a hand-back budget near 110k.
3. A tool hook refused writing `ANALYSIS.md`. If a write is refused, do not work around it: put the text in the report and name the target file (AC0 rule).

## Findings worth knowing

- Clone privacy: `vance_met` alone is set before the clone on the cover and ally routes (`ink/m04_npc_robert_vance.ink:230` to `:240`, `:631` to `:634`).
- Exchanges need the owner's `storyPath` and displayName-exact speaker prefixes.
- Not yet checked by any reviewer: the guard's live facing; leash anchors for a newcomer struck at the kettle.
