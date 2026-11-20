# Slice 9.2 sub-slice L, code review round 1: server

Branch `build/9-2-l` at `374761abf`, reviewed as `git diff 6192486b6..HEAD`. Scope: models, lib,
validator, Ruby tests, leak scanner, verify-run and the scenario JSON. Spec: plan 6.6, 5.1, 5.2,
9 and 12 "Sub-slice L"; build log section "L: lockout as a cause".

## Tests run (Ruby 2.7.8, single files, no lock)

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_lockout_l_test.rb` | 11 runs, 71 assertions, 0 failures |
| `test/controllers/break_escape/access_model_login_test.rb` | 29 runs, 443 assertions, 0 failures |
| `test/controllers/break_escape/npc_frustration_test.rb` | 38 runs, 236 assertions, 0 failures |
| `test/unit/access_leak_scanner_test.rb` | 32 runs, 223 assertions, 0 failures |

All files load and run under 2.7.8; nothing in the diff needs a later Ruby (`filter_map` is 2.7).

## What holds

- **Recording a lockout that never happened.** The `check` answer is computed only from the
  server's own `loginLockouts`, which only `record_login_failure!` writes. The state sync ignores
  `npcFrustration` and `loginLockouts` (tamper test, `npc_lockout_l_test.rb:509`). A fail naming
  `locked_out` with no record is refused (`npc_frustration.rb` fail path), and with a record the
  cause is read again from `loginLockouts` (`lockout_recorded?`, `:650`).
- **Clearing one.** Nothing in play removes an account username's lockout (account keys are never
  trimmed, `game.rb` `add_login_lockout!`), and `reset` drops both keys together.
- **The check's narrowing.** Refused for another PC, a PC with no `maxAttempts`, a station owned by
  another `screenOwner`, a room the player cannot know of and an NPC not met; each refusal has a
  test that fails if its line is removed.
- **The owner claim.** `game.rb:1602-1605` refuses the claim while the owner's normalised username
  is locked out at that PC; the key is built the same way `attempt_login!` builds it, and
  `account_holder?` runs first, so `creds` is present. The reversed first-slice test
  (`access_model_login_test.rb:312`) changes only the lockout list between its two halves, so it
  fails without the new line; `npc_lockout_l_test.rb:472` proves it again through POST /login and
  checks no session is written.
- **Owned cause.** A recorded lockout ignores `rearmed` and refuses station eases; an ease at the
  borrowed hot desk opens the gate (H's repeating borrow), tested at `npc_lockout_l_test.rb:446`.
  `ease_report!`'s "refuse everywhere" rule (`:598`) is limited to `no_access` and `unreachable`,
  so the hot-desk ease is not swallowed.
- **Saved games.** An entry from before L gets `lockedOut: []` from `frustration_view`; a false
  check writes nothing; GET /scenario writes nothing.
- **Validator error on `hall_c_drawer`.** It is H's, not L's. `filing_cabinet1` was added in
  `df4d7301f` (H-4); there is no `filing_cabinet1*.png` in `public/break_escape/assets/objects/` on
  `6192486b6`, on `build/9-2-h` or on `main`. Running the validator in the `p-9-2-h` worktree
  (`076acc1d6`) on `test_access_work` reports the same single error (`rooms/hall_c/objects[4]`).
  The note that H's validator shows no errors on this scenario does not hold. Fix belongs on H:
  use `filing_cabinet` or `filing_cabinet_steel1`.

## Blocker

None.

## Major

None.

## Minor

**m1. A locked-out guest can still leave a borrowed session open, and the player can claim it.**
`game.rb:1618-1652` (`claim_guest_session!`) and `npc_frustration.rb:189` (`record_borrow_done!`)
never read `loginLockouts`. Scenario: a borrow PC under a policy with `maxAttempts` (the F4 kiosk
shape, or any author's hot desk under `strict`). The player types three wrong passwords for
`jbrooks` at the hot desk, then locks Jake out at his own PC. Jake borrows the hot desk, the server
writes `guestSessions[hot_desk] = jake`, and a guest claim there opens his desktop, although Jake
cannot sign in at that PC. That breaks 6.6's rule "a person who cannot sign in cannot leave a
session open" on the one route L leaves out. Fix: in `claim_guest_session!`, refuse
("the guest is locked out at this PC") when `loginLockouts` holds the guest's normalised username at
that PC, next to the careful-guest check; add a test with a hot desk under `strict`. Optionally
also skip writing `guestSessions` in `record_borrow_done!` in that case. If the orchestrator rules
it out of L's scope, add a line to plan 6.4 saying so.

**m2. `locked_out` is an owned cause for `social_media` on the server, work-only on the client.**
`access_work.rb:432` adds `locked_out` to `owned_causes` for any need once lockouts are passed,
and `npc_frustration.rb:623` passes them whatever the need. The build log's choice 3 says
`locked_out` applies to `work` only, and `npc-needs.js:2943` adds it only to work verdicts.
Scenario: an NPC with both `work` and `social_media` at the same station, under a policy with
`maxAttempts`, recorded locked out. The client meets a `social_media` use at the station and sends
an ease; the server refuses it (`ease_report!` `:601`, an owned cause at the station), so that
NPC's social frustration never eases at its desk, and a `social_media` fail with `rearmed` is held
to the park floor. A tampered client can also cite `locked_out` on a `social_media` fail whenever
`can_fail?` holds for it (blocked or off). Fix: pass lockouts only for `need == 'work'` in
`owned_causes` (and refuse a `locked_out` cause on any other need in `fail_report!`), or record in
plan 9.1 point 2 and in C's brief that C must add it on the client. A one-line test: a recorded
lockout, then a `social_media` ease at the station is answered, not refused.

**m3. The `check` does not require a work plan.**
`npc_frustration.rb:544` routes `check` before the `judged?` test, and
`AccessWork.lockout_station?` (`access_work.rb:440`) does not ask for one. The honest client sends a
check only for an owner with a work plan (`shouldCheckLockout`). Scenario: a needs-only office-life
NPC whose station is under `strict`. A tampered client locks out a guessed username there and sends
a check: it learns whether the guess was that NPC's username (decision 14's leak, for an NPC that L
never affects), and the server writes a `lockedOut` record that GET /scenario then sends back, so
the restored client makes that NPC's screen lock on every leave. Fix: refuse the check unless
`AccessWork.can_fail?(scenario_data, npc, 'work')` (or `work_plan?`); add the case to the refusal
test at `npc_lockout_l_test.rb:419`.

**m4. The leak scanner checks key names only.**
`tools/playtest/lib/access_leak_scanner.rb:643-668`. It reports a `loginLockouts` or
`loginFailures` key and a misplaced `lockedOut` list, but not (a) a `lockedOut: true` boolean in
any response other than POST /npc_frustration and POST /login, so a future bug that puts
`lockedOut: true` on an NPC record in GET /room or on a GET /scenario NPC passes; nor (b) a lockout
key string (`"jake_pc|jbrooks"`) under any other key name, for example in a global or a log
payload. Fix: report a boolean `lockedOut` outside those two routes (rule `lockout_list` or a new
one), and, with the game given, report any string value equal to one of the game's
`loginLockouts` or `loginFailures` keys. Add one test row for each.

## Nit

**n1. The owner claim is a second lockout oracle; the plan does not say so.** Plan 9.2's row
"A lockout of an owner" says sign-in answers are unchanged, and 9.3's residual list
(`ACCESS_MODEL_SLICE_9_2_PLAN.md:1484`) names only the `check`. With L, a claim at an owner's open
screen succeeds or is refused depending on whether a guessed username locked out at that PC is the
owner's, for any owner (any `screenOwner` PC too, work plan or not). This is the same knowledge
decision 14 accepted, but by another route. Fix: one line in 9.3 and in the build log.

**n2. Plan 9.1 point 2 still says the lockout is owned straight from `loginLockouts`.** L keeps A's
R2 m2 rule (owned only behind the record), so an NPC locked out but not yet checked keeps the use
floor for a `rearmed` fail on another cause (`npc_frustration_test.rb:269`). The code is the safer
reading; the plan text should say "behind the `check` record".

**n3. No test for a record that outlives its lockout.** `lockout_recorded?` re-reads
`loginLockouts` "so a record never outlives" it, but no test builds `lockedOut: ['jake_pc']` with an
empty `loginLockouts` and checks that the fail is refused and the station ease accepted. It is not
reachable in play today (account keys are never dropped); a two-assertion test keeps the guard
from being removed as dead.

**n4. GET /scenario sends the stored `lockedOut` list as is.** `npc_frustration.rb:115` passes
`e['lockedOut']` without filtering to the NPC's station or to strings. Only the server writes it,
so this is hygiene: `& [station id]` would match what the client reads.

**n5. `access-leak-check.rb` column width.** `rule.ljust(16)` runs `lockout_unrecorded` (18
characters) into its count, as the build log notes. `ljust(20)`.

## Verdict

No blockers or majors. The authority rules hold: a tampered client cannot plant, clear or fake a
lockout, cannot fail work for one the server did not record, and cannot claim a locked-out owner's
session. The reversed claim test and the new tests would each fail without their line of code.
Fix m1 to m3 (small, each one refusal and one test) and m4 in the scanner before merging; the nits
can go with them. The validator error is H's and should be fixed on `build/9-2-h`.
