# Ops follow-up A: review R3 delta

Scope: the R2 fixes on `ops-follow1`. 24bb29977 (R2-A1, R2-A2) changes `tools/playtest/lib/access_leak_scanner.rb` and
`test/controllers/break_escape/ops_crack_scanner_real_answers_test.rb`. 95144c7e1 (the action toast) changes
`public/break_escape/js/systems/notifications.js` and `test/js/toast-action.test.mjs`. The review attacks the
fail-closed held set.

Verdict: **clean** (0 blocker, 0 major, 0 minor).

## R2 findings

| Id | R2 severity | State | Evidence |
|----|-------------|-------|----------|
| R2-A1 | minor | closed | `mfa_note_inventory` (`access_leak_scanner.rb:4811-4830`) now treats `hide` with an item id like a named remove. The fallback branch (an unreadable row, or a remove or hide with no id) also subtracts `crack_held_files` (`:4833-4835`, the `proof.held` ids of the crack records). Three new `crack_row` mutations are in `ops_crack_scanner_real_answers_test.rb:144-152`. Probe (scratch subclass, never committed) with the old `mfa_note_inventory` patched back in: all three mutations are MISSED (0 `crack_row`). On HEAD each one is CAUGHT (18 `crack_row`). |
| R2-A2 | minor | closed | The new mutation `heldItem naming another held file` (`:136-142`) sets `farah_file` on the last `dana_hash` row, after `farah_file` was added. Probe with `item == proof.held` removed from `crack_held_item_ok?`: only this mutation is MISSED. On HEAD it is CAUGHT. The clause is now pinned. |

## Attack on the fail-closed held set

- **A refused hide.** The controller answers a refused hide with 422 (`games_controller.rb:1484-1486`). `info[:ok]` is
  false, so the row changes nothing. A 200 hide always takes the item out of `player_state['inventory']`
  (`capture_proofs.rb:117-118`), or the item was already planted. So deleting the id matches the server.
- **MFA side effect.** After a hide, a code device is no longer in `@mfa_taken`. The server agrees:
  `mfa_device_answer` needs `held_code_device`. The MFA scanner tests (`access_leak_scanner_mfa_*`,
  `recorder_tags_scanner_mfa`) pass.
- **Honest runs.**
  - The whole-run test of `ops_crack_scanner_real_answers` scans the honest capture in teardown: 0 findings on HEAD.
  - The `demo_ops_passwords` whole-run scan is clean on HEAD (78f89611c): `demo_ops_passwords_scenario_test.rb` plus
    the real-answers test give 42 runs, 0 failures.
  - In my second full run, that test failed with five `crack_row` findings on keyring rows. Cause: at that moment the
    demo test's capture had no `inv` tags. Every inventory row fell into the fallback branch, so no add was recorded.
    Another track's commit e6a418c5d (it landed during this review) adds the recorder's `inv` tag.
  - That failure does not come from this delta. A probe that strips `inv` from the demo capture fails the same way
    with `crack_held_files` patched to `[]` (5 findings either way). That is the R1-A1 rule: an untagged capture never
    shows the file taken.
- **Where an honest run can now be flagged.** Only after a 200 inventory row that the recorder could not read, or a
  200 remove or hide that names no item:
  - The recorder writes a null `inv` only when the request body cannot be read, or when the query names a field the
    controller reads (`response-capture.js:82-104`). The game client sends a JSON body with an item.
  - A held file then counts as not held until a tagged add shows it again. This is the trade the finding asked for,
    and it is the same as R1-L5 for devices and phones. It is not a finding.
- `crack_held_files` reads `@crack_records`, which `collect_crack` fills before any row. `Array(...)` and the
  `is_a?(Hash)` guards cover a malformed registry entry.

## Toast (95144c7e1)

- `actionToastDuration` changes the time only when `validToastAction(options)` is true. That means an action with a
  non-empty string label and an `onPress` function. It also needs a finite duration between 0 and 12 s. Plain toasts,
  `0` (until closed), longer times and invalid actions keep their time. The new test asserts each case. The hover and
  focus pause is the existing toast R1 B2 code (`notifications.js:333-360`) and is unchanged.
- Under node 22, the 29 toast and notification JS files (`test/js/*toast*`, `*notif*`, item-gain, note, error floor,
  etc.) all pass.

## New findings

None.

## Notes as checked

- Scanner run, once (under `flock /home/deploy/BreakEscape/tmp/tests.lock`), on HEAD before e6a418c5d. It covered the
  12 `test/unit/access_leak_scanner_*` files and
  `test/controllers/break_escape/{access_leak_scanner_*, demo_ops_*_scenario, ops_crack_scanner_real_answers,
  ops_logs_scenario, ops_scan_scenario, recorder_tags_scanner_crack, recorder_tags_scanner_mfa}_test.rb`.
  - First run: 584 runs, 3 failures. Two of them are `demo_ops_recon` tests (a 403 printer scan and a 404 card). That
    file passes alone (19 runs, 0 failures), so these depend on test order and come from outside this delta. The third
    failure was cut off by my output pipe.
  - A second, full-output run: 584 runs, 7246 assertions, 1 failure. That failure is the untagged `demo_ops_passwords`
    scan above, now fixed by e6a418c5d.
- Probes were scratch subclasses run with `-n` and kept in the scratchpad. None is committed.
- `bin/ops-golden-compare` was not run: the delta changes no scenario or validator.
- Both commit messages are accurate, and each commit touches only the files its finding names.
