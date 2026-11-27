# L1a and L1b delta review R2

Delta of the R1 fix commits (L1a `d727f8fc2`, `fdc2b42a2`, `a278ac2e5`; L1b `49211abbb`, `a84ab7d02`,
`40d47ac12`) against `L1a_R1.md` and `L1b_R1.md`, read at HEAD `d950ed316`. Reviewer read-only.
Every fix below was checked in the code at the line given, not from the outcome tables.

Run by this review: `flock ... bin/rails test test/models/break_escape/ops_log_test.rb`: 54 runs, 628
assertions, 0 failures (host Ruby 2.7). Nothing else was run; the controller and JS tests were read only.

## L1a: R1 findings

| Id | Status | Checked at |
|---|---|---|
| M1 | confirmed fixed | `app/models/break_escape/ops_log.rb:780-793` (from `CaptureModel.each_lock_answer`, filtered by `LOCK_ANSWER_TYPES`, Array forms joined); test `test/models/break_escape/ops_log_test.rb:680-690`, fixture `:125-135` |
| m1 | confirmed fixed | `ops_log.rb:413-416`; `ops_log_test.rb:569` |
| m2 | confirmed fixed | `ops_log.rb:127-130`; test `:619-626` (test, development on; production, staging, demo off) |
| m3 | confirmed fixed | `ops_log.rb:317-327` (whole call rescued off the guard; line holds event and error class only); test `:629-645` |
| m4 | confirmed fixed (ruling) | `ops_log.rb:758-774` (every `creds` hash; credential `account` holder), `:795-798` (flags); fixture `:145-148` |
| m5 | confirmed fixed (collisions); secrets still per call, see "Still open" | `ops_log.rb:193-202`; `test/support/ops_log_assertions.rb:11-14`; test `:648-656` |
| m6 | confirmed fixed | `ops_log.rb:112`; test `:658` |
| m7 | confirmed fixed | `scripts/validate_log_rows.rb:280`; JS test `test/js/validator-log-sources.test.mjs:166` |
| m8 | confirmed fixed | `validate_log_rows.rb:185-203`, `:252-273`; JS test `:177` |
| m9 | confirmed fixed | `validate_log_rows.rb:355-380`; JS test `:195` |
| m10 | confirmed fixed | `validate_log_rows.rb:124-129`, `:149`; JS test `:210` |
| m11 | confirmed fixed | `ops_log.rb:255`; `validate_log_rows.rb:43`; tests `ops_log_test.rb:248`, JS `:224` |
| m12 | confirmed fixed (ruling) | `validate_log_rows.rb:208-223`; JS test `:232` |
| m13 | confirmed fixed | `lib/break_escape/ops_log_events.rb:45`; test `:662` |
| m14 | confirmed fixed | `ops_log.rb:585-591`; test `:238-246` |
| m15 | confirmed fixed | `tools/playtest/verify-run.rb:276-280`; `ops_log_verify_run_test.rb:62-71` |
| m16 | confirmed fixed | `test/lib/ops_unchanged_replay_test.rb:18-21`; `test/support/ops_golden.rb:68-69` |
| m17 | confirmed fixed | `ops_log_test.rb:327` (p on a merged row), `:456` (classes 2 and 3), `:526` (step 7 at run time), `:610-616` (warning lines), `:746` (negative assertion), `:775-776` (two-digit secret); `ops_log_clock_test.rb:104-114`, `:118-133`; tautology and `.first(0)` gone |

## L1b: R1 findings

| Id | Status | Checked at |
|---|---|---|
| M1 | confirmed fixed (per ruling: code stands) | `test/controllers/break_escape/ops_logs_scenario_test.rb:107,114`; `scenarios/test_ops_logs/PLAYTEST.md:112-116,131`; `HANDOVER_L1b_3.md:28` |
| m1 | confirmed fixed | `access_model_login_test.rb:635-646` (`as` nil pinned); A24 `docs/ACCESS_AND_NETWORKS.md:705` |
| m2 | confirmed fixed | `docs/ACCESS_AND_NETWORKS.md:705-706` |
| m3 | confirmed fixed | `PLAYTEST.md:34` |
| m4 a-e, g-i | confirmed fixed | `access_model_rfid_test.rb:811, 818, 832, 845, 864, 877`; `access_model_login_test.rb:648, 730` |
| m4 f | not fixed (unowned) | no `save_limit: false` case in `ops_log_test.rb`; see "Still open" |
| m5 | confirmed fixed | `app/controllers/break_escape/games_controller.rb:1300-1303` (door, real-unlock branch only), `:1326-1327` (object); test `access_model_rfid_test.rb:889-902` |
| m6 | confirmed fixed (per ruling: code stays) | test `access_model_rfid_test.rb:864-875` (open object; door in a game with no `logSources`); A24 `:705` |

## The named checks

2. **Secret registry (L1a M1).** Registered now: `requires` of every pin, password, combination and
   cryptex lock from the one walk the answer sets use, including a door entry's own `requires` on a lock
   type inherited from the connected room; `creds.password` of every hash in the scenario that carries
   `creds` (room NPCs, top-level `npcs`, `phoneNPCs`, anywhere else); scenario `flags` (VM name => name =>
   value, the shape `vm_flags_json` makes and `game.rb:8110-8113` reads); wifi keys; capture secrets. The
   fixture would expose each gap named in R1: a string and an Array combination, a cryptex, a door entry
   code (`7390`) on an inherited pin lock, a top-level and a phone NPC password, a flag value. Not
   exposed by a fixture: see N1 and N2 (neither is a gap in what is registered).
3. **Guard per environment, never raising in production (m2, m3).** Correct and tested. With the guard
   off, `ops_log_guard!` is not called (`ops_log.rb:341`), so no secret walk runs in production; a
   malformed call warns with the event and key path, any other error with the event and class.
4. **Granted badge row (L1b m5).** Door: one call, in the `else` of the route-room gate, before
   `serve_opened_room` saves. Object: one call before `unlock_object!`. `rfid_in_force` is false at an
   open target, so there is no row on a repeat and no double row; every real rfid unlock still passes
   exactly one call site. No row is lost.
5. **L1b M1, m1, m6.** The tests assert what the rulings say (`n == 2`; `as` nil; `alreadyOpen` for a
   card-less post at an open object and in a game without `logSources`).
6. **New problems.** None of weight. No engine change runs for a scenario without `logSources`
   (`write_log_row!` still returns at step 1; the only route change is the moved call, gated on
   `rfid_in_force`, nil without `logSources`). No test deleted: 0 tests removed, 24 added across the six
   commits; the three removed assertions were each replaced by a stronger one or were the tautology R1
   asked to drop. Nothing new reaches the browser (no controller answer, sync section or bootstrap key
   changed). Ruby 2.7: `then`, `filter_map`, `to_h {}` are fine; the model suite passes on the host Ruby.

## New findings

**N1 (minor). The credential-holder branch adds nothing and no fixture can tell.**
`ops_log.rb:765-772`. The walk at `:761-763` already registers every `creds.password` in the scenario,
so the holder lookup can only re-add a value already present; the fixture's holder (`j_price_npc`) is a
room NPC. Harmless. Fix: delete the branch, or keep it and say in the comment that it is a restatement.

**N2 (minor). The authored answer copies are registered but untested, and the validator leaves them out.**
`ops_log.rb:788-789` registers a combination lock's `combination` and `cryptexConfig.answer`; the
fixture has neither key, so dropping those two lines fails no test. `scripts/validate_log_rows.rb:355-380`
(`log_registered_secrets`) does not list them, so the collision warning and the guard disagree for a copy
that differs from `requires`. Fix: one fixture object with each copy set to a value different from its
`requires`, asserted in the `secret_values` test; add the two fields to the validator's list.

**N3 (minor, for a ruling). Literal flag answers on a station are not registered.**
`ops_log.rb:795-798` registers top-level `flags` only, as ruled. A flag station's own `flags` list may
hold a literal answer rather than a reference (`game.rb:8116-8121`, schema `scenario-schema.json:5447`,
server-only). No row field can carry one today; say whether the "safe side" ruling should cover them
(one more walk: station `flags` entries without a `:`).

**N4 (minor). A test comment says the opposite of what the test does.**
`test/controllers/break_escape/access_model_rfid_test.rb:827-829`: "a refusal at a lock that is not in
force writes no denied row either" sits above a swipe at `power_room`, a lock in force, which is
asserted to write `denied`. The assertions are right; reword the comment ("a lock in force still logs").

## Still open

- **L1b m4 f** (`save_limit: false` neither spends nor is stopped). Read at `ops_log.rb:391-398, 528`:
  the counter is touched only when `call[:save_limit]`, so the behaviour is right. Coverage is indirect
  (the flood in `ops_log_test.rb:472-480` writes unlimited rows after the limit is spent, without
  asserting on the counter). It does not matter for landing L1a and L1b: no L1b event is called both
  ways. It matters before the first stage that calls one event both ways; add a six-line helper test
  then, or now with N2 (owner: whoever takes the `ops_log_test.rb` pass).
- **L1a m5, registered secrets read on each guarded call.** Five scenario walks, plus a hash of
  `scenario_data` for the collision cache key, on every guarded write. Test and development only; with
  the guard off none of it runs. It does not matter before landing. If suites on large scenarios slow
  down later, cache `registered_secret_values` on the game under the same key as the collisions.

## Doc point (plan section 10)

`OPS_LOG_ROWS_PLAN.md:474` should read: "No answer from an existing route gains a field, except that a
card-less rfid request at an already open door or object now answers `alreadyOpen: true` (section 12,
L1b item 2); the client only words a toast by it."

## Counts and verdict

| | Count |
|---|---|
| R1 findings confirmed fixed | 24 of 25 (L1a M1, m1 to m17; L1b M1, m1 to m3, m5, m6; m4 a-e, g-i) |
| not fixed | 1 part (L1b m4 f, a test gap) |
| fixed wrongly | 0 |
| new blocker | 0 |
| new major | 0 |
| new minor | 4 (N1 to N4) |

**Verdict: ready to land.** N1 to N4 and m4 f are small test and comment items that can ride with the
next edit to `ops_log_test.rb`; N3 needs a one-line ruling. Not done by this review: the controller,
clock, golden and JS validator tests were read, not run.

## R2 outcomes

| Item | Outcome |
|---|---|
| L1b m4 f | Done: `ops_log_test.rb` 'save_limit false neither spends the counter nor is stopped by a spent one' |
| N2 | Done: fixture combination and cryptex copies differing from `requires`, asserted in the `secret_values` test; added to `validate_log_rows.rb`; node case added. Proven: removing the two lines in `ops_log.rb` fails the Ruby test (`33-44-55` missing); removing the validator lines fails the node test |
| N3 | Done: flag-station and launch-device literal `flags` entries (no colon) registered in `ops_log.rb` and the validator; fixture station with a literal and a reference. Proven by disabling the walk: the Ruby test fails on the literal |
| N4 | Done: comment in `access_model_rfid_test.rb` reworded |
| PLAYTEST.md, HANDOVER_L1b_3.md | Done: `swap-scenario-game.rb` setup with the reason; beat 3 words the RFID reader emulate step and the "Access Granted" toast |
| N1 | Left as is (ruled) |
