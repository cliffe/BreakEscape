# Handover: OPS_LOG_ROWS_PLAN reviser, after the R4 fix pass

Plan: docs/achitechture/OPS_LOG_ROWS_PLAN.md (1268 -> 1221 lines, uncommitted, worktree ops-plan).
Findings: docs/agents/ops_layer/reviews/OPS_LOG_ROWS_R4.md. Decisions appended to OPS_LOG_ROWS_DECISIONS.md.

Done: N1 (five-minute save window, entry [count, windowStartMs, rowSeq], reclaim on full map,
protected limit row, validator key-count warning, OpsLog.with_clock), N2/section 14 (MFA request in
full with the exact blocked helpdesk_request call; met requests dropped), N3 (secret registry,
note_issued_secret, matcher, guard message names event and key path only, typed==secret drops the
row), m1-m9, nits n1-n8, trim list except 13.2 step 6.

Open:
1. Under 1150 lines: about 71 more to cut. Candidates: 13.2 step 6 prose and the opsLogSaves
   paragraph, section 9 validator list, section 10, section 15 question bodies.
2. Read 13.1 to 13.3 and the section 11 L1a tests once end to end for contradictions (not done:
   context ran out). Check especially: 13.1 nil list vs step 4; step 6 class list vs the
   "Eviction and caps" test (it names first rows only, should add a held row); section 5.2 viewer
   text "FAIL x3" could mention `x10+`.
3. Section 15 question 2 should say the body is written to (a).
Do not commit; the orchestrator commits.
