# Handover: OPS_CORE_PLAN.md, planner (draft complete, ready for review round 1)

Updated 2026-11-19 by the second planner. Plan: `docs/achitechture/OPS_CORE_PLAN.md` (977 lines).
Nothing committed.

## Done

- All sections 0 to 15 written. The "incomplete" status line and every "(unverified)" mark are
  gone.
- The first planner's "Not read" list was checked in the code, items 1 to 11. What changed in the
  plan as a result:
  - `start_login_session!` has no way to take extra keys: it gains `access:` and `technique:`
    keywords (5.4). It writes `signedInPcs` for a technique session with no change (question 8).
  - A PC holds one session, so a technique session replaces any session there (section 0,
    question 10, cross-plan request 8).
  - The remote-blocked exception is not one line: `desktop_request_allowed?` is the gate, and
    `desktop_refusal`, `host_row` and the client's `hostAction` repeat the term for display. All
    use one predicate, `technique_session_through?`. `settle_session_at_keyboard!` needs an early
    return for `via: "technique"`. Section 5.4 has the exact condition, a "stays refused" table
    and the hostile test (`network_technique_blocked_host_test.rb`).
  - Discovery is enforced inside `host_reachable_through?` (six callers) plus
    `from_route_refusal` (5.2).
  - A technique can grant only a `saved_connection` credential in S3: `password` needs `foundIn`
    and `token` needs a foothold proof (4.3, question 9).
  - `ACCESS_STATE_DEFAULTS` values get a shallow `dup`, so `opsDiscovered` defaults to `{}` (8).
  - No reserved-field mechanism exists or is needed: the schema blocks are closed (section 3).
  - A block carries `ops: true` only when a host on it declares services, so an existing
    scenario's `GET /network` is unchanged (5.2, 10).
  - JS harness copy lists are per test file; the four that copy the view are named in 11.3.

## Not checked in code (a reviewer should)

- That no sync section can write `sessions` or the ops keys (taken from digest D5b; the hostile
  controller test is specified to prove it).
- The exact route list `test/support/payload_scan.rb` scans, and how `scripts/lock_key_diff.rb`
  classes node ids.
- `validate_network.rb` section pointers (`VN:364`, `:519`, `:587`, `:774`) come from the file's
  comment headings, not from reading each section body.
- The keyboard desktop rule for a technique session follows the credential-session precedent
  (served, not settled); whether the keyboard should refuse it instead was not put to the user.

## Gotchas

- `scenario_data` is jsonb: key order is lost, so everything is sorted by id.
- Outage and `fixedIf` globals are client-synced, so both are soft gates.
- All example product names are invented; `summary` and `falseBecause` say what is wrong, never
  how.
