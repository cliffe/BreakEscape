# Handover: OPS_CORE_PLAN reviser, round 1b pass

Stopped at the context limit. Nothing committed. Files touched: `docs/achitechture/OPS_CORE_PLAN.md`
(now 1573 lines), `docs/agents/ops_layer/reviews/OPS_CORE_DECISIONS.md` (appended).

## Done
- M5 (repeat defined in 5.4; repeat and stale-id table in 6), M6 (routes, answers, state note,
  tests, beats, shared files), M7 (sections 0, 3, 4.2, 4.3, 9.1, 9.2, 11.4), M8 (sections 11,
  12.1, 12.2, 13, 14 item 8).
- m12 to m24: all acted on, or closed already (m21). See the decisions file for fixes that differ.
- Nits n5, n6, n7, n8, n9 also taken.
- Orchestrator rulings: `access` in answers follows the computed level (sections 0, 5.4, 7, 10,
  14 item 1); snake_case log names with the "route already saves" line per row; the sentence on
  which findings take a card (5.4, 14 item 6).
- Section 15 cut to four user questions; old numbers re-pointed (searched: every "question N"
  now resolves to 2, 3 or 4).

## Not done: the full read-through
Checked by search only: question numbers, beat ids (8a, 8b, 10a exist), old dotted log names,
"waits for the refetch", `delta: true`. Not yet read top to bottom for contradictions. Worth a look:
- Section 2 (today's code) and section 5.2 were not re-read after the edits.
- Section 7's no-exposure paragraph and 11.2 `network_ops_no_exposure_test` do not mention the
  400 or the `no_grant` refusal.
- Section 9.3 (graph): a weakness with no `grants` has no outgoing edge; not stated.
- 11.5 live proof and the leak scanner paragraph were not revisited for noise, repeat or log rows.
- Section 3's S3 row and 12.1 step 9 do not name the `no_grant` warning or the `connectsTo` check.
- `REFUSAL_TEXT` code list: `bad_request`, `not_found`, `not_needed`, `not_responding`,
  `not_confirmed`, `false_positive`, `fixed`, `wrong_class`, `wrong_product`, `wrong_version`,
  `need_unmet`, `no_grant`; the plan never lists them in one place.
- Cross-plan request 12's line runs long (one unwrapped line).

## Gotchas
- `notes1` as the card sprite is assumed to be a plain paper item; the plan tells the build step
  to confirm.
- The log plan's table 13.7 differs from this plan's rows in four ways (request 8): place kind
  `pc`, `finding` as alias, new keys `how` and `grant`, new event `network_alerted`; `from` may
  exceed the 40-character detail limit.
