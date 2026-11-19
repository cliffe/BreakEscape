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
| R4 N1 | Save window is five minutes of `serverMs`, matching `CLOCK_ONLY_INTERVAL_MS`; the "limit reached" marker is `rowSeq` in the `opsLogSaves` entry (`[count, windowStartMs, rowSeq]`, 41 bytes, map about 11 KB), not a key on the row | A row key would push the 391-byte ceiling row past 400; validator warns (not errors) on more than 256 possible keys, per ruling |
| R4 N1 | Protected rows: eviction gained a class 5; class 4 takes the oldest first row, class 5 any row, so a held "limit reached" row goes last and the cap still holds | "Protected from eviction" cannot be absolute while `maxRows` must hold |
| R4 N3 | Registry `register_secret_source` plus request-scoped `note_issued_secret` (`OpsLog::Current`); no `x-secret` schema annotation or spec that fails on an unregistered field | Ruling 2 settled the registry form; a schema marker is left to the sibling editors |
| R4 m3 | `xN+` shown while a row's save entry is spent; the `+` goes when the entry resets | Needs no extra save |
| R4 m7 | Count above max is clamped to max with no `9+` mark | A mark needs a stored flag for a case no sibling can reach (8 pairs per PC) |
| R4 m8 | Lock rows take `{ npc: }` only when the second-step screen names the owner, else nil; never `{ account: }` | What the S8c screens show was not checked here; the MFA plan's editor decides per screen |
| R4 trim | Trim list applied except 13.2 step 6 prose (grew with the save window); plan is 1221 lines, over the 1150 target | The N1/N3/m5 fixes added about 60 lines; the remaining cut is left to the next pass |

# Round 5

Every blocker, major and minor in `OPS_LOG_ROWS_R5.md` was acted on, with the orchestrator's rulings, except as below.

| Finding | Decision | Why |
|---|---|---|
| B1 | Typed text stored as typed whatever it equals; matcher never reads `as.typed`; open question 4 added | Orchestrator ruling; any branch on its value is the oracle |
| M2 | Limit registered per result in `EVENTS` (`save_limit: { 'blocked' => 10 }`); the call passes the switch `save_limit: true`, never a number | `technique_refused` has limited (quiet) and unlimited (noisy) callers for one result, so a switch is needed; a switch with no number is simpler than a number that must match |
| m1 | The mark moves onto the row as `"p": 1`; `rowSeq` and the negative count are dropped (entry is `[count, windowStartMs]`, 34 bytes); protection is "a row with `p` whose latest time is inside the window" | The ceiling row is 343 bytes (349 with `p`), and the largest `p` row is blocked `helpdesk_request` at 382, so it fits under 400 and survives the entry's reset |
| m1 (identity) | `+` is documented as "later calls of that event and result at that place were dropped, whoever they named"; no per-identity tracking | Keying on `as` would let typed text multiply keys |
| m3 | Matcher skips values its type rule resolved (codes, scenario ids, declared usernames); validator warning kept | Cannot block an author; the type rules already prove those are not free text |
| m6, M1, M3, m7 | Section 14 items 5 and 6; lock plan marked met for `approver` and `{ npc: }` per the orchestrator's note, `method` list still asked | Sibling edits |
| technique_used ceiling | Recomputed as 388 at a `host` place (was 386) | Measured with compact JSON |

Round 6 (two minors, five nits), orchestrator's rulings applied.

| Finding | Decision | Why |
|---|---|---|
| m1 | `typed` is the `normalise_username` form (`strip.downcase[0, 64]`, `game.rb:2721-2723`); "case kept" and "stored as typed" removed; `signin_fail` and `signin_lockout` rows stand as written; blocked `helpdesk_request` and `signin_refused` pass the normalised form | `record_login_failure!` and `add_login_lockout!` only see the normalised key; one form per field, and the FAIL row's `n` matches the attempts counted |
| m2 | Matcher compares every non-typed value against `secret_values` minus authored collisions (a username, scenario id or `EVENTS` code); issued secrets always compared; guard message prefix `secret in`; the test-only `{ id: 'test_any' }` event proves the guard fires; validator warning extended to codes | The old skip left the guard nothing to compare, so a guard test passed on the type rule alone |
| n1, n2, n4, n5 | `badge_swipe` `EVENTS` line shown; section 14 item 6 `method` list marked met; "(the default `false`)" added; open question 4 "written to accepting it" | One-line fixes |
| n3 | Clause added: only a `save_limit: true` merge refreshes `last` for protection | Bounded already; stated for clarity |
| Not applied | Core plan wording at `OPS_CORE_PLAN.md:621` (n4) and the MFA plan's guard tests | Outside the two files this pass may edit; section 14 now states what the MFA plan must do |

## Section 14 dependency closure (2026-11-19)

- From the privilege plan: 13.7's `usb_install_overridden` row takes the implant exception (only a keyboard admin session at the grant's PC overrides a session-shaped implant), a bullet states that a refused plant (`usb_refused`, `needs_console`) writes no row, and section 11's per-call-site tests gain a line for both; the privilege plan's open marker is removed, and this plan's own marker on the MFA plan's `test_any` kind is removed now the MFA plan names it.
