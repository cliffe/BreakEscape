# Handover: OPS_LOG_ROWS_PLAN reviser, R5 fix pass (latest, 2026-11-19)

Done (uncommitted): B1, M2 (`save_limit: true` switch, limits in `EVENTS`), m1 (`p` on row,
entry `[count, windowStartMs]`), m2, m3, m4, m5, m6/M1/M3/m7 (section 14 items 5 and 6), m8
(13.2 step 2 sentence + section 11 test), nits n1 to n8, open question 4. DECISIONS appended.

Open: plan is 1220 lines, must be under 1200 (cut about 22 more lines of prose only). Candidates:
section 10 bullets (around line 457), section 11 JS and live-proof paragraphs (around 640-660),
13.1 intro paragraph after the `as` table, 13.8 "Never in these rows" (around 1142), 13.4 second
paragraph. Then grep the plan for `save_limit: 10`, `rowSeq`, `391`, `42 bytes` (all cleared now)
and read 13.2 steps 4 and 6 end to end once.

Gotcha seen, not changed: 5.1 says `signin_fail` takes `typed` from the failure key's normalised
username part, while 13.1 says typed text is stored as typed and normalised only when shown.

# Earlier: after the R4 fix pass

Plan: docs/achitechture/OPS_LOG_ROWS_PLAN.md (1268 -> 1221 lines, uncommitted, worktree ops-plan).
Findings: docs/agents/ops_layer/reviews/OPS_LOG_ROWS_R4.md. Decisions appended to OPS_LOG_ROWS_DECISIONS.md.

Done: N1 (five-minute save window, entry [count, windowStartMs, rowSeq], reclaim on full map,
protected limit row, validator key-count warning, OpsLog.with_clock), N2/section 14 (MFA request in
full with the exact blocked helpdesk_request call; met requests dropped), N3 (secret registry,
note_issued_secret, matcher, guard message names event and key path only, typed==secret drops the
row), m1-m9, nits n1-n8, trim list except 13.2 step 6.

Second pass (later agent), done: Q2 says "written to (a)"; eviction test now covers the protected
limit-reached row; 13.1 to 13.3 and section 11 read end to end. Contradictions fixed: the spent
state had no home (entry stores only count, start, rowSeq), so a spent entry is now stored with a
negative count `-k` (steps 4 and 6, section 8 map row, 42 bytes an entry); the nil list in 13.1
now includes a full `opsLogSaves` map; 13.3 "Typed identities" wrongly said every result of an
event uses typed (signin_refused denied uses account), reworded; added the rule and a unit test
that calls without `save_limit` neither spend nor are stopped by a count; 5.2 and section 7 mention
`x10+`. Not changed: Q1 body does not say "written to (d)" though 13.8 is (d); add it.

Open: line count is 1186 (was 1221), target under 1150, so about 37 more lines to cut. Cuts so far
were prose only (13.2 secret registry, guard and save window, 13.4, 13.7 bullets, section 12 steps,
section 14, section 6 scoped readers). Candidates left: section 2 prose, 4.1 and 4.2 paragraphs,
section 9 first paragraph, section 10 bullets, 13.1 intro paragraphs, 13.8 "Never in these rows",
section 11 JS and live proof paragraphs, section 15 Q2/Q3 bodies. Cut words only, not rules or tests.
Do not commit; the orchestrator commits. No decisions were declined, so the DECISIONS file is
untouched.
