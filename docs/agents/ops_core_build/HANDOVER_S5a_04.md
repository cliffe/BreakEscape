# Handover S5a unit 04: the pure pieces (lib/)

Done. Files: `lib/break_escape/access_work.rb` (`plant_refused?(data, obj, item, admin: false)`, returns false only for `admin == true`; `usb_habit_refused?` untouched), `lib/break_escape/capture_model.rb` (`session_grant_pc(obj)` plus helper `session_grant_pc_in`, both module functions, no ActiveSupport), `lib/break_escape/ops_log_events.rb`, `test/models/break_escape/privilege_lib_test.rb` (new, 11 tests).

## For units 06 and 07 (exact)
- `'admin_profile_read'`: label `ADMIN_READ`, places `%w[pc]`, results `%w[ok]`, detail key `'profile'` (`{ id: 'profile' }`). No save_limit.
- `'usb_install_overridden'`: label `USB_OVERRIDE`, places `%w[pc]`, results `%w[ok]`, detail key `'device'` (`%w[storage hid]`). No save_limit.
- KINDS `'profile'`: name = the id when `accountProfiles` holds it, else nil (`OpsLogEvents.profile_named`); room nil.

## Open: existing test needs a one-line edit (not mine)
`test/models/break_escape/ops_log_test.rb:593` (ceiling-row test) fails for `admin_profile_read`: 404 bytes > 400. The test's hand-kept lists (`OPS_AS_ACCOUNT_EVENTS`, line ~570) give an `as` of the typed-name worst case to every event not listed. Both new events write `as: { account: }`, so both belong in `OPS_AS_ACCOUNT_EVENTS` (as `technique_used` is). The owner of that test file should add them; not edited here.

## Proof run
privilege_lib_test, capture_record_test, hide_device_test, access_work_usb_habit_test pass; ops_log_test 1 failure (above); `bin/ops-golden-compare` 16 runs green, no fixture touched; node validator-capture-log and ops-unchanged-validator pass; rubocop clean.
