# Handover: OPS_LOCK_SECOND_STEP_PLAN.md reviser, round 1

Stopped at the context limit. Nothing committed (orchestrator commits).

## Done
B1, M1, M2, M3, m1 (5.3 text), m2, m3, m4 and the orchestrator's log-row note, all in the plan. Record in `docs/agents/ops_layer/reviews/OPS_LOCK_SECOND_STEP_DECISIONS.md`.

## Open
1. Section 15 question 1: add that no client posts `npc` for an object today (doors only). Question 2: reword so (b), refusing `secondStep` on a room a `prop_door` targets, is weighed as making the step hard-enforced against a best-effort opener; keep (a) recommended; drop the repeated door-opener options (they are in the 5.3 table).
2. Section 7: trim the `contents, roomData` row and anything restating 5.2.
3. Section 14 request 1: mention Rule C and the shortcut-off first factor if the MFA shared functions are affected (probably not); request 5 already fits the log plan.
4. Length: plan is 699 lines, target under 600. Candidates: section 2 tables and prose, 5.2 closing paragraph, section 6 route table prose, section 11 controller table wording, section 15 questions 5 to 7.
5. Check the plan reads as written once (no review references; none added so far).

## Files touched
- `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md`
- `docs/agents/ops_layer/reviews/OPS_LOCK_SECOND_STEP_DECISIONS.md` (new)
- this note

## Gotchas
- `find_scenario_object` returns no path; Rule C relies on a separate walk keyed by object identity.
- `notifyServerUnlock` swallows rejections; that is why the cancelled marker and the `unlockTarget` guard exist.
- The answer-finder swap is gated on a non-empty `second_step_ids` to keep existing scenarios byte-identical.
