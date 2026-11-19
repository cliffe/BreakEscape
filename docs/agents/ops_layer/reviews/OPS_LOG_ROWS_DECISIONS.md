# OPS_LOG_ROWS_PLAN.md: reviser decisions, round 1

Every blocker, major and minor in `OPS_LOG_ROWS_R1.md` was acted on in the plan except as below.

| Finding | Decision | Why |
|---|---|---|
| S1 (part) | Kept `where` as `{ kind:, id: }`, not `"pc:reception_pc"` | The sibling plans need many place kinds and a nil place; a structured value is checked per event. Measured 204 to 297 bytes a row; budgets use 300 and the caps were redone from that. `sources` and `actor` were dropped as suggested |
| C1 (part) | No separate `target:` or `n:` arguments | The orchestrator ruled the shape is the four columns plus optional `result` and `detail`; a second thing acted on, a count or a request number go in `detail` under registered keys (13.5, 13.7) |
| C1 (part) | Cracking writes no rows | Orchestrator cross-plan ruling: cracking is offline; `hash_obtained` moves to the action that obtained the hash |
| O3 (nit) | Seed rows get no `actor` | No actor field exists; 13.6 adds an optional `by` later with no migration |
| S5, R5, V4 (nits) | Acted on | Reset and rev (section 8, 6); text and Cancel (5.2) |
