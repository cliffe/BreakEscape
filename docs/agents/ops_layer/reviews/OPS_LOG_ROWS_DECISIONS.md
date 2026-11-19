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

# Round 3

Every major, minor and partly closed item in `OPS_LOG_ROWS_R3.md` was acted on, with the orchestrator's rulings, except as below.

| Finding | Decision | Why |
|---|---|---|
| M3 | Fixed differently: `merge_limit:` replaced by `save_limit:`, a stored count per event and place (`opsLogSaves`, 256 entries, never evicted, new keys dropped when full), not a digest of the whole row | Orchestrator ruling 3; keying on place, not `as`, means typed text cannot multiply keys, and refusing new keys instead of evicting means a spent limit never reopens |
| M4 | Fixed differently: blocked `helpdesk_request` keeps `as: { typed: }` and uses `save_limit: 10` per desk, not `as: nil` with `once: true` | Orchestrator ruling 4: one row shape for every result; a per-desk counter bounds made-up usernames without touching the once-set |
| M2 | Fixed differently: no `:integer` allow-list by key name; the only numeric rule is `{ count: max }` with `max` at most 9, enforced in production | Orchestrator ruling 2; 9 sits below the MFA plan's two-digit matching number |
| m5 (`by`) | Kept the MFA plan's codes but named the key `approver` in 13.7 and asked that plan to rename | `by` is the reserved top-level key (13.6); one name per meaning avoids a later clash |
| m5 (`route`) | One shared list `keyboard`, `foothold`, `from`, `relay` for `signin_ok` and `mfa_challenge`, replacing `local`, `remote` | One code list per key name; the codes name a route kind, never a machine |
| m8 | Asked as question 3 with two options (folder row, per-file request), not three; no-row option dropped | Orchestrator ruling 7 framed two options; the body is written to (a), renamed `share_folder_opened` |
| n1 | Play row id is a ten-character HMAC keyed from `secret_key_base`, not a plain digest | Keeps the opacity claim true |
| Trim | Applied the trim list except the sibling-request shrink (section 14 grew with the new requests); plan is about 1259 lines, over the 1150 target | The new save counter, guard, tests and question 3 added more than the trims removed |
| Core review | Added kind `foothold` for `from` on scan rows, as the coordinator asked | A foothold is not a host, so `{ id: 'host' }` made every sweep malformed |
| S8c rows | Accepted: `door`/`object` places, `{ npc: }` identity, `method` code detail on the `mfa_*` events; source is the ordinary room/object rule, no source means no row | Coordinator request; all fit the typed rules and the 400-byte cap |
