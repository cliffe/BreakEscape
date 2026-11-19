# OPS_LOG_ROWS_PLAN.md: reviser decisions, round 1

Every blocker, major and minor in `OPS_LOG_ROWS_R1.md` was acted on in the plan except as below.

| Finding | Decision | Why |
|---|---|---|
| S1 (part) | Kept `where` as `{ kind:, id: }`, not `"pc:reception_pc"` | The sibling plans need many place kinds and a nil place; a structured value is checked per event. Measured 204 to 297 bytes a row; budgets use 300 and the caps were redone from that. `sources` and `actor` were dropped as suggested |
| C1 (part) | No separate `target:` or `n:` arguments | The orchestrator ruled the shape is the four columns plus optional `result` and `detail`; a second thing acted on, a count or a request number go in `detail` under registered keys (13.5, 13.7) |
| C1 (part) | Cracking writes no rows | Orchestrator cross-plan ruling: cracking is offline; `hash_obtained` moves to the action that obtained the hash |
| O3 (nit) | Seed rows get no `actor` | No actor field exists; 13.6 adds an optional `by` later with no migration |
| S5, R5, V4 (nits) | Acted on | Reset and rev (section 8, 6); text and Cancel (5.2) |

# Round 2

Every major and minor in `OPS_LOG_ROWS_R2.md` was acted on in the plan except as below. Nothing was declined outright.

| Finding | Decision | Why |
|---|---|---|
| F1 | Fixed in a modified form: merge looks back over the 10 newest rows; eviction goes merged refusals, other refusals, ok rows, and protects the first row of each event | Takes the "evict non-ok first" option but keeps first-of-kind rows, so a flood of forged refusals cannot remove the first sign-in or swipe |
| A4 (part) | Typed text is not stored exactly as given: control characters stripped, cut to 32 characters and 96 bytes, marked `cut` | Escaped control characters bloat rows past the 400-byte cap |
| A4, A1 (part) | Ids in rows capped at 40 characters and account usernames at 32, not 64 | At 64, `technique_used` builds a 489-byte row, over the 400-byte cap; 40 matches the core plan's own id cap. Repeat times stored as one `last` pair for the same reason. The validator refuses longer ids in a scenario with `logSources` |
| B2 | Row is `share_file_read` with a `folder` detail, not a placeless `share_read` with no detail | The opened folder is something the player chose and already sees, so naming it is earned; the row still names no file. `once:` per folder and account bounds it, with a save only when stored |
| B1, B5 | Names follow the orchestrator ruling: `usb_install_overridden`, `credentials_harvested`, `signin_refused` (renamed from `signin_denied` everywhere) | Orchestrator ruling; the privilege plan changes to match |
| B1 (part) | `credentials_harvested` detail is two integers (`count`, `hashes`), not the privilege plan's per-account list | A per-account list has no typed rule and breaks the four-key cap |
| A2 / privilege save-once need | `once:` is backed by a 256-digest set in `opsLogOnce` (about 4 KB), not a scan of stored rows | Orchestrator asked that eviction cannot cause a repeat; a digest set survives row eviction |
| B3 (part) | `mfa_expired` carries no detail | The MFA plan's revised section 13 lists none; its table is taken as written |
