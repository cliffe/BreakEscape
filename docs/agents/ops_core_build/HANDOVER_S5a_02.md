# Handover S5a unit 02: the level helper (`game.rb`)

Done. Files: `app/models/break_escape/game.rb`, `test/models/break_escape/session_access_test.rb` (new, 21 tests, 122 assertions).

## Added (all public, beside `session_identity`, `game.rb` about line 3296 on)
- `session_access(pc_id)`: the eight steps in plan order; nil / `'user'` / `'admin'`. A stored `access` is read only for `via: 'technique'` and only when exactly `'admin'`.
- `account_admin_at?(npc, pc)`: `creds.admin == true` (literal) and `pc_admits_account?`.
- `session_admin?(pc_id)`, `keyboard_admin?(pc_id)` (admin, blank `foothold`, not `remote_route_session?`).
- `client_access_level(pc_id)` (still private, in the later private block) is now `session_access(pc_id)`; it may answer nil. Its callers (`login_session_answer`, `host_row`, `ops_need_session`, `ops_technique_repeat_answer`) only compare to `'admin'`, except `NO:603` (unit 03, M27) which now can see nil.

## What later units can rely on
- Visibility: the four new methods are PUBLIC on `Game`, so `network_access.rb` and `capture_proofs.rb` (modules mixed into Game) and tests call them plainly (`@game.session_admin?`, `keyboard_admin?`).
- Reads are live: a locked session, an expired token, a downed route, an off PC, a missing account all answer nil and send no `access` (checked on the sign-in answer, `session_for_client` and the host row's `session`).
- Nothing is stored; `start_login_session!` and `ACCESS_STATE_DEFAULTS` are untouched.

## Tests
`session_access_test.rb`: `ActionDispatch::IntegrationTest` with `NetworkRequests`. Helper `admin_scenario(admins:, marker:, tokens:)` marks `creds.admin` on sam, lena, jake of `KeyringLoginScenario` (ian stays user); `build(admin_scenario)` then `sign_in_sam`, `keyring_in('lena_rdp')`, `lock`, `set_session`, `host_held`. Admin PCs: sam_pc and jake_pc at the keyboard, lena_pc through the office foothold.
Run: session_access 21/0 fail; technique_session_record, credential_sessions, access_model_rules, network_technique_session, ops_access_scenario, network_no_exposure, network_ops_no_exposure: 103 runs, 1 failure (below). `bin/ops-golden-compare`: 16 runs, 0 failures, no fixture re-recorded. node `ops-unchanged-validator` passes. Rubocop clean.

## Open: one existing test fails by design of step 4 (not edited)
`technique_session_record_test.rb:69` ("the session answer and the reloaded mirror carry access admin..."): its `technique_session` helper saves a stale `@game` after the plant, which overwrites the plant's foothold with `{}`; the record names a foothold that no longer exists, so the route is down and the mirror correctly has no `access` (the answer line 77 reads `login_session_answer` directly and still passes). Fix is a one-line test change (reload `@game` before `technique_session`, or seed `footholds` with `KS.office_foothold`); the brief says the file is unmodified, so the orchestrator should rule.

## Gotchas
- Host row key for the held session is `session` (not `held`).
- `creds.admin` strings or 1 are user (tested).
- A technique `access: true` (non-string) is user.
