# m04 office life: plan-phase handover

Branch `plan/ol-m04`, worktree `.claude/worktrees/p-ol-m04`, base main `3e00651a8`. Plan phase only; do not build.

## Done

- Stage 0 baseline files. V6 deferred to the build (needs Rails). BASELINE.md walkthrough row corrected: no current walkthrough file; the HacktivityLabSheets page (`mission.json:7`) and `scripts/ink_runtime_check/m04_routes/`.
- Plan review rounds 1 to 5, all on the planning tier, each saved as `REVIEW_R<n>.md` with outcomes, PLAN.md rewritten after each:
  - R1: 0 B / 3 M / 3 m (partial, context guard).
  - R2: 0 B / 3 M / 9 m (partial, context guard).
  - R3: 1 B / 2 M / 7 m.
  - R4: 0 B / 1 M / 4 m (delta).
  - R5: 0 B / 0 M / 5 m (delta). Plan review loop closed.
- Main plan changes so far: cooler capacity 1 (second cell blocked); kettle gate opens on `vance_met` AND `vance_provided_keycard`; both newcomers talkable (one line plus a curt variant; Ibrahim's file `m04_npc_ibrahim_diallo.ink` owns the exchanges); coupling on `npc_use_started:ops_kettle`; guard's hostile numbers; head count option (d) "off the roster" (credit, debrief `:433` and the blueprint note at 2739 change; one re-voice); `hydrogen_alarm` dropped as an evacuation cause; exchange prefixes are exact displayNames; the leash and reload behaviour of a struck newcomer is described as the engine does it (anchor in reception, home at the last needs stop, no reply in the ops office, possible follow at the door, back at the sofa only on reload); guard faces south with sofa and cooler in his cone, accepted; Q7 added (kettle strike levers).

## Open

1. Plan phase done. Next: the user's picks on QUESTIONS.md Q1 to Q7, then the dialogue sample and build.
2. Reviewers run out of context near 150k: brief them narrowly with a hand-back budget near 110k.
3. If a tool refuses a write, do not work around it: put the text in the report and name the target file (AC0 rule).

## Findings worth knowing

- Clone privacy: `vance_met` alone is set before the clone on the cover and ally routes (`ink/m04_npc_robert_vance.ink:230` to `:240`, `:631` to `:634`).
- Exchanges need the owner's `storyPath` and displayName-exact speaker prefixes.
- Not yet checked (build-time, live): where `currentPlayerRoom` switches at the ops door (decides whether the kettle follow fires); real door and cell distances; how a restored KO sprite is placed; the person-chat background with a newcomer at the kettle.
