# Device-in-use (S8b `device_in_use?` wired to S8c): review R2 (delta)

Delta review of `cdeeb6503` ("Ops device-in-use fix: real-run scan asserts clean, drop duplicate test, docs and
comment") on `ops-follow2`, against `DEVICE_R1.md`. No code was changed by this review.

## Verdict

**Clean.** R1 minors m1 to m5 are closed. m6 (the two tooling commits) is left alone, as the brief says. The fix
touches no application logic: one comment, two doc sentences and two test files. What the server serves and what the
scanner excuses are unchanged. There are no new blockers or majors, only two cosmetic nits (n1, n2).

## R1 minors

- **m1 (closed).** `access_leak_scanner_helpdesk_device_in_use_real_test.rb` now starts with an empty inventory and
  takes `sam_fob` through `POST /inventory` (`action_type: add`). It asserts `success` and records the row with the
  `inv` tag in the same shape `LockStepRealRows#rows_of` builds from a real capture
  (`{action, itemId, usedOn: nil}`). The test asserts `assert_empty pairs(scan_with(rows, scenario))` and still asserts
  that the old code is reported without the gate row.
  - **The test fails if the take is missing.** This was checked with a scratch probe (not committed) that runs the
    same rows four ways:
    - full run: `[]`;
    - without the take row: `lockstep:key:code` and `mfa:key:code`;
    - with the take row but no `inv` tag: the same two findings;
    - without the gate row: only `helpdesk:old:code`.
  - So the clean assertion has real force: it depends on the take being recorded, and the gate is the only thing that
    excuses the old code.
- **m2 (closed).** The synthetic "real rows" test in `access_leak_scanner_helpdesk_lock_step_both_test.rb` is deleted.
  Its two assertions were already covered by the first two tests in that file. Nothing references its name.
- **m3 (closed).** `ACCESS_AND_NETWORKS.md:877` now says "using the code at the lock uses up that minute's code on the
  own phone too". That matches the shared `used` window that U2 case 13 pins.
- **m4 (closed).** `:877` now says "passes, is dropped after five wrong codes, or expires", which matches U2 case 6
  (`codeLocked` does not blank the device). `:911` now says "a lock's code is always the owner's authored device".
- **m5 (closed).** The `mfa_sign_in.rb:70-73` comment is rewrapped. The comment's text and the code are unchanged.
- **m6 (not in scope).** The tooling commits `77bba9f6a` and `9fdc6de7e` are still on the branch, and a third tooling commit,
  `837f38255`, landed on it during this review. This review did not cover any of them.

## Runs

- **Rails tests,** run under the tests lock: 379 runs, 0 failures, 0 errors. They cover:
  - every `access_leak_scanner_helpdesk*` and `access_leak_scanner_lock_step*` file, the two changed ones included;
  - `lock_step_reenrol_device_test`;
  - `helpdesk_reenrol_test`;
  - `mfa_sign_in_reenrol_test`.
- **Golden.** `bin/ops-golden-compare`, run outside flock: 41 runs, 0 failures.

## New findings

- **n1 (nit).** In the real-run test, the `'body' =>` continuation line of `record` keeps its old indent after
  `@rows <<` became `row =`, so it no longer lines up.
- **n2 (nit).** The class comment of the real-run test still says the honest run "reports no `helpdesk:old:code`".
  The test now asserts that the whole scan is clean.

Neither nit affects behaviour, and neither needs another round.

## Not run

- JS tests, the demo browser check and the train were not run (no servers, per the brief, and nothing under `public/`
  changed).
