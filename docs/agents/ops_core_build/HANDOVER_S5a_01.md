# Handover S5a unit 01: privilege unchanged-scenario fixtures

Done. No engine file edited. Captured from `ops-build` at `3034e2301` (main), before any S5a engine
edit, with `ONLY=privilege_test_access_signin,privilege_test_access_sessions,privilege_test_access_keyring,privilege_test_access_social bin/rails app:ops:unchanged:capture`
(a first capture, not a re-record). The core_* and log_* fixtures are untouched.

## What is pinned (step ids, in play order)
Cases are `privilege_cases` in `test/support/ops_unchanged_cases.rb`; fixtures are
`test/fixtures/files/ops_unchanged/privilege_<scenario>.json`, replayed by `test/lib/ops_unchanged_replay_test.rb`.
- `privilege_test_access_signin` (21): bootstrap, accounts_hot_desk, sam_wrong_password, sam_signs_in_hot_desk, desktop_hot_desk_sam, lock_hot_desk, desktop_hot_desk_locked (403), sam_unlocks_hot_desk, sam_refused_at_ian_pc, ian_signs_in_ian_pc, desktop_ian_pc, switch_user_ian_hot_desk, desktop_hot_desk_ian, archive_locked, archive_wrong_password, archive_right_password, archive_open (a folder in a profile), desktop_known_pc_no_session, sign_out_hot_desk, desktop_hot_desk_after_logout, bootstrap_after.
- `privilege_test_access_sessions` (18): bootstrap, claim_owner_dana, desktop_dana_pc_claimed, profile_file_dana_forecast, ian_signs_in_ian_pc, desktop_ian_pc, lock_ian_pc, desktop_ian_pc_locked, ian_unlocks_ian_pc, dana_at_hot_desk, desktop_hot_desk_dana, switch_user_omar_hot_desk, desktop_hot_desk_omar, ian_signs_in_dana_pc, claim_guest_none, sign_out_ian_pc, desktop_ian_pc_after_logout, bootstrap_after.
- `privilege_test_access_keyring` (20): bootstrap, keyring_plain, lena_signs_in_typed, desktop_lena_pc, profile_file_passwords, keyring_after_typed_signin, lock_lena_pc, desktop_lena_pc_locked, lena_unlocks_lena_pc, implant_session_lena_pc (200, keyboard session), implant_again_lena_pc, sign_out_lena_pc, keyring_signin_wrong_pc, keyring_signin_no_route, keyring_signin_lena_pc (credential, through `implant_lena_pc`), desktop_lena_pc_keyring, keyring_after_keyring_signin, plant_stick_allowed (inventory `remove` + `used_on`), plant_stick_again, bootstrap_after.
- `privilege_test_access_social` (16): bootstrap, jake_wrong_password, jake_signs_in_jake_pc, desktop_jake_pc, profile_file_jake_f5_note, lock_jake_pc, desktop_jake_pc_locked, jake_unlocks_jake_pc, jake_refused_at_hot_desk_wrong_account, omar_signs_in_omar_pc, claim_guest_before_borrow (422), borrow_done_omar_kiosk, claim_guest_kiosk, desktop_kiosk_guest, sign_out_kiosk, bootstrap_after.

## How a later unit uses it
Run `bin/ops-golden-compare` (no outer `flock`) after any engine edit; the four names must stay green with no
edit to the fixture. A diff means behaviour changed. What each unit can lean on:
- unit 02 (session_access): every sign-in answer and desktop here is a password, claim or foothold-credential session; none carries `access`, and none may gain it (no `creds.admin` exists in these scenarios).
- unit 05 (profiles): the profile listings and folder opens (signin `archive_*`, `desktop_*`) must not change for user sessions.
- unit 06 (implant): `implant_session_lena_pc` answers 200 at a keyboard session and `implant_again_lena_pc` answers `already`; both must stay.
- unit 07 (inventory remove): `plant_stick_allowed` is a plant the policy allows (200, one `plantedItems` entry, item removed); must stay.

## Gotchas
- The shipped four scenarios hold NO implant socket and NO plant socket, and no `creds.admin`. The keyring case therefore inlines the shipped scenario plus four objects (`kit_badusb` hid, `kit_stick` storage, `lena_usb_socket` with a grant_foothold `needsSession`, `stick_dock` with a `remove_item`). Nothing else is added. The scenario is inlined in the fixture, so later edits to the scenario files change nothing recorded.
- A keyring (credential) sign-in is never a keyboard sign-in: it needs a foothold, `from` or relay. The case signs in through the implant foothold, and only AFTER the implant, so no implant sits under a foothold, `from`, relay or technique session (brief rule). No case is a technique session.
- The clock is frozen, so the borrow hand-over cannot ripen: `npcFrustration.omar.handed['0']` is seeded in `playerState` (time = the fixture clock) and the done is sent with `cut: true` (skips the dwell). A real fail path is not in this fixture.
- Replay order: each step runs in order in one game; steps with the same shape of answer (the `desktop_*` ones) pin the locked 403 too.
- Social is large (about 150 KB) because its scenario is inlined.

## Re-record deliberately
Only when a unit changes an answer by design (section 4 of the brief). `ONLY=<name> bin/rails app:ops:unchanged:capture` for that one name, check the diff of the JSON is only the intended lines, and say so in the commit. Never to silence a diff.
