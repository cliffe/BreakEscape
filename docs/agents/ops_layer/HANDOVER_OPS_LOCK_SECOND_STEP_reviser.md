# Handover: OPS_LOCK_SECOND_STEP_PLAN.md reviser

Stopped at the context limit. Nothing committed (orchestrator commits).

## Done (second reviser)
Every R1b finding acted on in the plan (see DECISIONS, second-reviser entry). Matched to MFA plan
commit 629b8cc07: `takeCompleted(subject)`, `MfaClient` emits events, `:passed`, `numbers(...,
subject_key, ...)`, `device_in_use?` registration, re-enrolment ignored, `ownPhone` gone. Request 1
in section 14 now lists items 1-7 as met by MFA request 11 and item 8 (answer again from a live
record) as still asked. `save_limit: true` wording in section 13. Q1/Q2 reworded, Q8 added
(re-enrolment, recommend no), Q3(c) lockpick fixed. Section 7 contents row trimmed.

## Open
1. Length: 709 lines, target under 650. Cut repetition only. Candidates: section 2 withheld-table
   prose and the "Office PC" paragraph; 5.2 Rule C exits table cells (long); 5.4 "What each caller
   does" bullet; section 6 checks row; section 11 controller rows (wording); section 12 shared-file
   table; section 9 graph paragraph.
2. Read through once for flow and stale phrasing after the many edits (no review references were
   added; grep "R1", "round" came back clean).
3. Check the MFA plan does provide item 8 (answer again from a live record); if it does, mark it met.

## Files touched
- `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md`
- `docs/agents/ops_layer/reviews/OPS_LOCK_SECOND_STEP_DECISIONS.md` (appended)
- this note

## Gotchas
- `DOOR_ENTRY_LOCK_FIELDS` only warns (`validate_scenario.rb:8050`); the error list is `:8059`.
- `GET /room` writes `unlockedRooms` directly for start and world rooms (`games_controller.rb:584-591`).
- `find_scenario_object` returns no path; Rule C uses a separate walk keyed by object identity.
- `notifyServerUnlock` swallows rejections, hence the cancelled marker and `unlockTarget` guard.

## Third reviser (R2 findings), stopped at the context limit; nothing committed

Done in the plan: M2 (path-based Rule C, `resolve_unlock_target`), m2, m3, m4, m6, n1, most of
the n2 trims, the validator sites and graph treatment (section 9 rewritten against the code).
See DECISIONS, "R2 (third reviser)".

Still to do, in the plan (all small edits):
1. **M1, section 13 last paragraph:** replace "Every call passes `save_limit: true` ... never a
   number and never `once:`" with: calls use the default `save_limit: false`; each row rides its
   branch's own save (log plan :756 says `save_limit` is for branches with no save; the `mfa_*`
   events register no limit, log plan :1023-1030). The controller test for stored rows is in.
2. **m1, section 14 request 1:** reduce to one line ("met by the MFA plan's request 11; a later
   change to those functions, the pending record or the counts is checked against this
   plan"); drop item 8 (now 5.2's own logic).
3. **m5, section 14 request 5:** add one line: log plan 5.1's granted `badge_swipe` bullet
   (log plan :221-225) should say it comes after this plan's gate, which returns before the
   transaction, so the first right card at a gated rfid lock writes no badge row. Section 13
   already states the order.
4. **m7, section 15:** add "The plan is written to (a)." to each of questions 1 to 8. Trim Q8's
   (a) text (owner rules overlap MFA 5.2), about 3 lines.
5. Length: check `wc -l`; target under 680. Grep for `step_ancestors` (should be none left).
6. Read 5.2 to 5.4 once for flow after the edits.
