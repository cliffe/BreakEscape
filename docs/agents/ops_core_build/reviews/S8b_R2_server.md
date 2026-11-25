# S8b review, round 2: server, model, validator and graph

Branch `ops-helpdesk`, head `65b993fe1`. Fix commits reviewed: `6aea8f7d2`, `37205b305`,
`014763510` (diff `c225aa772..HEAD`). Read-only review: no code changed. The probes are one scratch
Rails test (a subclass of `OpsHelpdeskScenarioTest`, so every probe drives the real
`scenarios/test_ops_helpdesk` through the real routes with time frozen), kept outside the tree and
run with `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <file>`.

Runs on this head: eight Ruby test files of this area (`helpdesk_review_r1_test`,
`helpdesk_access_test`, `mfa_sign_in_reenrol_test`, `mfa_access_subject_test`,
`helpdesk_request_test`, `helpdesk_reenrol_test`, `ops_helpdesk_no_exposure_test`,
`helpdesk_answer_shapes_test`): 133 runs, 0 failures, 0 skips. `ops_helpdesk_scenario_test`: 22
runs, 0 failures. `bin/ops-golden-compare`: 27 runs, 0 failures. `node --test` on
`dungeon-graph-helpdesk`, `validator-helpdesk-form-ways`, `validator-helpdesk`,
`ops-unchanged-validator`: 47 pass, 0 fail. Validator on `test_ops_helpdesk`: 0 errors, 16
warnings, and the tree stays clean afterwards (the committed graph is the generated one).
`git diff c225aa772..HEAD --stat -- scenarios` lists only `test_ops_helpdesk`.

Counts: 0 blockers, 1 major, 4 minors.

## Round 1 findings

| Finding | State | Evidence |
| --- | --- | --- |
| R1-SERVER1 (major) pending step survives a password reset | closed | `helpdesk_access.rb:249`, `:266-271`. Three route tests (code, held phone, owner approval) pass. Probe with four pending records seeded (two of Tess, one of Wim, one of Vera; code, push and number match), then Tess's password grant: `pending after tess password grant: ["ops_pc", "vault_pc"]`. There is one pending map only (`mfaPending`, one caller of `issue_second_step!`, `mfa_sign_in.rb:348`); `mfaPrompts` is a per-owner count, not a step. The second-step reset keeps the step, as round 1 asked. See R2-SERVER2 for the test that does not test what its name says. |
| R1-SERVER2 (major) no `answer` edge past 64 characters | closed | `helpdesk_model.rb:50-54`, `generate_dungeon_graph.rb:1954-1961`, `validate_helpdesk.rb:369`. `grep -c "\|answer\|" scenarios/test_ops_helpdesk/dungeon_graph.md` prints 8 (staff file and feed post, for Tess and Wim). Regenerating changes nothing. |
| R1-SERVER3 (minor) refusal tells account from non-account past 200 names | closed, and the fix opened R2-SERVER1 | The three cap tests pass. Probe, table full of 200 stopped names: unknown name, an account at `it_desk` and an account at `id_desk` all answer `{"reason":"blocked","retryIn":300}`. No oracle found: every branch on `npc` comes after the rule and only chooses grant against refuse. |
| R1-SERVER4 (minor) rule not evaluated for an unknown name | closed | `helpdesk_access.rb:95-99`, `:177-190`. Same calls for both (`account_for_username`, then `rule_met?` or `held_friendface_phone`), same row (`as.typed`), same body. With an empty recovery map `answers_right` still normalises both sides of every question (`helpdesk_model.rb:73-77`). A typed name equal to an NPC id whose phone is held is still refused (`npc &&`). |
| R1-SERVER5 (minor) `own_form` defaulted to true | closed | `mfa_access.rb:135`. One caller, `mfa_sign_in.rb:215`, passes `own_form: own == true`. `mfa_access_subject_test` passes. |
| R1-SERVER6 (minor) own-phone reads write in memory | closed for `mfaAccounts` and `accountResets`; one write is left, R2-SERVER3 | `mfa_sign_in.rb:108-110`, `:249`. |
| R1-SERVER7 (minor) docs on the two extra ways to open the form | closed | `docs/ACCESS_AND_NETWORKS.md` "Three ways to open the form"; `validator-helpdesk-form-ways.test.mjs` passes. |

## The open item: four failed sign-in rows for three failed sign-ins

No row is written twice. The server writes one `signin_fail` per refused `POST /login`
(`game.rb:4686`), and the ops log folds a row into an identical earlier row within the last ten
(`ops_log.rb:776`, `MERGE_WINDOW = 10`), whatever sits between them. The fourth is beat 5 step 1
(the old password, refused after the reset), which folds into beat 1's row. The playtest read the
log at the end and saw both together; that is also why it reported "no audit row" for beat 5.

```
login 1: 422 {"success":false,...,"attemptsLeft":2}
login 2: 422 {"success":false,...,"attemptsLeft":1}
login 3: 422 {"success":false,"message":"This account is locked on this PC","lockedOut":true,"attemptsLeft":0}
GET log_rows?object_id=audit_log_pc:
   SIGN_IN t.ama Records PC  FAIL x3
   SIGN_IN t.ama Records PC  OK            (the signin_lockout row)
stored: [{"n":3,"event":"signin_fail",...,"seq":1},{"event":"signin_lockout","result":"ok","seq":2}]
(reset granted, then the old password once: 422 attemptsLeft 2)
GET log_rows:
   SIGN_IN t.ama Records PC  FAIL x4
   SIGN_IN t.ama Records PC  OK
   HELPDESK t.ama Ria Vance  GRANTED  what: password
   ACCT_RESET t.ama Ria Vance OK      agent: Ria Vance
```

The only thing to change is the playtest script: R2-SERVER5. Note, not a finding of this stage:
the lockout row reads `SIGN_IN ... OK` (`ops_log_events.rb:29`, older than S8b), which a reader
takes for a successful sign-in.

## The real capture

Not stale. A fresh run of `run_game` written to scratch and compared with
`test/fixtures/files/ops_helpdesk_real_capture_rows.jsonl` value by value: 39 rows against 39;
three rows differ, all in values that differ per game (`code` on the two `GET mfa/device` rows; `rev`
and row `id`s on `GET log_rows`). The plain scenario test passes. See R2-SERVER4 for what that
test does not compare.

## New findings

### R2-SERVER1 (major): 200 other names wipe a real account's count, so the stop never comes

`app/models/break_escape/helpdesk_access.rb:220-225`. The new cap drops the oldest name that is not
stopped, account or not. Before the fix an account's entry was never dropped. A count that has not
yet reached `maxTries` is therefore forgotten after 200 new names, and the account gets a fresh
set of tries with no wait.

Probe (real scenario, `it_desk`, `maxTries` 3): two wrong requests for `u.reyes`, then 200 other
names with one wrong request each, four times over.

```
ugo wrong answers, 200 junk names after each pair:
[{"reason":"refused","triesLeft":2},{"reason":"refused","triesLeft":1},
 {"reason":"refused","triesLeft":2},{"reason":"refused","triesLeft":1},
 {"reason":"refused","triesLeft":2},{"reason":"refused","triesLeft":1},
 {"reason":"refused","triesLeft":2},{"reason":"refused","triesLeft":1}]
ugo entry now: nil size=200
```

Eight wrong guesses and no stop; it goes on for as long as the requests are sent. The cost is 100
requests a guess against 100 seconds a guess under the rule, so a script guesses a short answer
(a staff number on a desk with `minCorrect` 1) many times faster than the stop allows. The stop is
on the docs' list of what the server holds hard, and `test/models/break_escape/helpdesk_access_test.rb:173`
now pins the wipe (`refute_includes keys, 'it_desk|sokafor'`) as wanted.

The table is also one for all desks, so the "all 200 stopped" answer at one desk blocks new names
at every desk (probe: `id_desk` answered `blocked` after 200 stops at `it_desk`), while the docs
say the stop is per desk.

A stop on a real account cannot be wiped (probe in the round 1 table; test
`a stopped name is never dropped by the cap` passes), and the desk cannot be denied for good: with
200 stopped names a right answer for a real account is still granted
(`account right: {"granted":true,"what":"password"}`), a new wrong name is `blocked` with
`retryIn` 300, then 150 after 150 s, and is served again at 301 s
(`{"reason":"refused","triesLeft":2} size=1`).

Fix, in `app/models/break_escape/helpdesk_access.rb`: never drop a live entry.
1. In `refuse_helpdesk!` set `entry['at'] = now` on every refusal.
2. An entry is spent when `now - (stoppedAt or at) >= DESK_STOP_SECONDS`. In `request_helpdesk!`
   replace `lift_helpdesk_stop!` with one that deletes the key's entry when it is spent, stopped
   or not.
3. `make_room_for_helpdesk_try!` deletes spent entries only. If the table still holds
   `TRIES_CAP` names, answer through `helpdesk_blocked_by_cap!` with `retryIn` the seconds until
   the soonest entry is spent. Delete the `loose.min_by` eviction.
4. Count the cap per desk (names whose key starts with `"<deskId>|"`), so one desk's table cannot
   block another.
5. Tests in `test/models/break_escape/helpdesk_access_test.rb`: replace the test at `:173` with
   "two wrong, 200 other names, a third wrong is `triesLeft: 0` and the fourth `blocked`"; add
   "a count is forgotten after five quiet minutes" and "a full table answers a new name `blocked`
   with the time to the soonest spent entry, for an account and a non-account alike". Add the
   probe above as a route test in `test/controllers/break_escape/helpdesk_review_r1_test.rb`.
6. `docs/ACCESS_AND_NETWORKS.md`, "What the player sees": replace "the oldest name that is not
   stopped is forgotten ..." with the new rule.

### R2-SERVER2 (minor): the test named "another account pending step is kept" tests no other account

`test/controllers/break_escape/helpdesk_review_r1_test.rb:99-104`. It asks for Sam's second-step
reset and checks Sam's own step stays. Nothing in the suite shows a password grant leaving another
account's step alone. The code is right (probe in the round 1 table).

Fix, same file: rename that test to "a second-factor reset keeps the account's step", and add one
that seeds `mfaPending` with a record for `sam` and one for another account at another PC, asks for
Sam's password reset through the route, and asserts only Sam's record went.

### R2-SERVER3 (minor): the own-phone read still creates `mfaPending` in memory when the key is absent

`app/models/break_escape/mfa_sign_in.rb:275`: `phone_request_rows` reads through
`mfa_pending_map`, which writes `player_state['mfaPending'] = {}` (`:334`). Probe, re-enrolled Wim,
key removed: `with no mfaPending key: changed=true key?=true`. A new game has the key
(`game.rb:3066`), so this shows only on a game saved before S8a; the route does not save. The
round 1 test passes because its game has the key.

Fix, same file, `phone_request_rows`: read `stored = player_state['mfaPending']` and select from
`stored.is_a?(Hash) ? stored : {}`. In `test/models/break_escape/mfa_sign_in_reenrol_test.rb` add
the same before-and-after assertion with `mfaPending` deleted first.

### R2-SERVER4 (minor): the capture drift check does not look at the answers

`test/controllers/break_escape/ops_helpdesk_scenario_test.rb:576-580` compares verb, path, query,
status and the `login` and `inv` marks. A key added to or dropped from any answer leaves the plain
run green, so "a plain run fails on drift" (the test's own message, the hand-on notes) is true for
the order of requests only. Today the bodies do match (see "The real capture").

Fix, same file: also compare, row by row, the sorted set of key paths of `body` (keys at every
level, arrays by index, values ignored) between `@log` and the committed rows.

### R2-SERVER5 (minor): PLAYTEST.md does not say where the fourth FAIL comes from

`scenarios/test_ops_helpdesk/PLAYTEST.md`, beat 5 step 1 says "refused; one attempt counted" and
names no server line; beat 1 says "three `SIGN_IN` fails and a lockout". Read at the end of a run
the log shows `FAIL x4`, which the first playtest reported as a server fault.

Fix, that file, beat 5: add "Server: no new row; the `SIGN_IN` fail row for Tess at Records PC
now reads `FAIL x4` (the log folds equal rows together)", and say the same where beat 16 lists the
audit rows.

## Checked and found sound

- **The cap as an oracle.** Stopped name: `blocked` before the account lookup. Loose name: the
  rule runs, then grant or refuse. Full table: `blocked` with the same `retryIn` for an account and
  a non-account. The cap answer writes one `blocked` row of the same shape as a per-name stop.
- **A stop on a real account** outlives 220 further names (route test) and is deleted only when
  it has run out.
- **Fix commit claims.** Each of the seven named fixes is in the diff and has a test, apart from
  the test title in R2-SERVER2. The sticky-note test does not skip (0 skips in the run).
- **Shipped scenarios** unchanged; golden compare unchanged.

## For the owner

1. **A count that fades (R2-SERVER1).** The fix makes a count that never reached the stop be
   forgotten after five quiet minutes. That is never faster for a guesser than the stop itself (two
   guesses per five minutes against three), but it is a rule the brief does not state. The other
   way, counts kept for ever and a full table refusing every new wrong name until a grant, has no
   honest `retryIn`.

Verdict: not clean
