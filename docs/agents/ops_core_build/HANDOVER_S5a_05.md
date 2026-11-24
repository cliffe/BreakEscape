# Handover S5a unit 05: admin profiles (`game.rb`)

Done. Files: `app/models/break_escape/game.rb`, `test/models/break_escape/admin_profiles_test.rb` (new, 11 tests, 59 assertions).

## Added (all public on `Game`, near `login_desktop_contents`)
- `admin_profiles_at(pc)`: `[profile_id, profile]` pairs in `accountProfiles` order whose `for` admits an account present on the PC; empty with no owner. Present accounts come from the private seam `admin_present_accounts(pc)` (owner only; S5b widens it here).
- `admin_session_opens_profile?(pc_id, profile_id)`: `session_admin?(pc_id)` and the profile is in `admin_profiles_at` of that PC.
- `admin_profile_reader(profile_id)` (for unit 07): `{ pc_id:, npc: }` or nil. Nil when any live session's own identity (route up) is admitted by the profile's `for`, when no admin session opens it, or the profile id is unknown. First PC in `access_sessions` order wins.
- `login_desktop_contents`: when `session_admin?`, extra profiles not already in `admitted_profiles`, once each, after admitted ones and before mapped shares.
- `scope_admitted_by_session?` (profile branch) and `session_admits?` (profile branch) gain the admin term via `admin_session_opens_profile?`.

## Notes
- `find_login_item` left alone: it already searches every profile; callers rely on `scope_admitted_by_session?`/`session_admits?`, which now agree with the listing.
- Not tested: "PC off" and "token expired" ending the admin read (session_admin? is nil for both through unit 02's `session_access`, tested there); this test covers locked, gone and route down.
- Proof run: admin_profiles 11/0; access_model_rules, access_model_withholding, desktop_user_room_data, credential_sessions, session_access, log_rows, npc_container_unlock, access_model_login: 142 runs total, 0 failures. `bin/ops-golden-compare` 16 runs 0 failures, nothing re-recorded. Rubocop clean.
