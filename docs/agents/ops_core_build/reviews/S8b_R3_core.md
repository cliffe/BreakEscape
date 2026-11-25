# S8b review, round 3: server and client

Branch `ops-helpdesk`, head `2b047efca` (includes the merge of main, `85cc7960c`). Round 2 fix commits
reviewed: server `df5ab9c12`; client `3e73d52d0`, `af1de1fd6`, `8f024addd`, `e68f9369a`. Read-only: no
code changed. Scratch (outside the tree): `<scratchpad>/s8b-r3-core/` holds `probe_test.rb` (route
probes A to D), `mut_test.rb` and `mut2_test.rb` (the fixer's tests run against broken copies of single
methods, prepended to `Game` for the run only), `merge.test.mjs` (cracked and reset through the real
client modules), `pretext.test.mjs` (the call, the form and the ask through the real modules), with
their outputs (`probe.out`, `mut.out`, `mut2.out`, `post.out`).

Runs on this head: `ops_helpdesk_scenario_test`, `credential_keyring_test`,
`ops_helpdesk_no_exposure_test`: 65 runs, 0 failures. `helpdesk_review_r1_test`, `helpdesk_access_test`,
`mfa_sign_in_reenrol_test` unbroken (the base classes inside the mutant run): 0 failures. `node --test` on
`helpdesk-request` 26, `helpdesk-pretext-open` 10, `helpdesk-keyring-connect` 7, `signin-rows` 37,
`keyring-client` 90, `keyring-signin` 56, `mfa-signin-pane` 23, `helpdesk-scenario-click-paths` 10,
`helpdesk-no-handwritten-answers` 11, `own-phone-scenes` 11, `ops-cracker` 26: all pass.
`capture-log` 32 pass, 1 fail (test 2, "the secret is masked until /capture_secrets answers"), the same
failure on main at `2d9e963c8`; not of this stage.

Counts: 0 blockers, 1 major, 3 minors.

## Round 2 findings

| Finding | State | Evidence |
| --- | --- | --- |
| R2-SERVER1 (major) 200 other names wipe a real account's count | closed for the probe; the same weakness is still reachable another way, R3-CORE1 | Round 2's probe through the real route (two wrong for the account, 200 other names, four times over): `refused 2, refused 1, refused 0, blocked 300, blocked 299, blocked 299, blocked 298, blocked 298`; entry `{"n"=>3,"at"=>..,"stoppedAt"=>..}`, table size 200. `helpdesk_access.rb:169-183`, `:203-233`. Cap per desk: test passes and fails under a whole-table mutant. |
| R2-SERVER2 (minor) test tested no other account | closed | `helpdesk_review_r1_test.rb:106-117`; fails when `drop_pending_second_steps!` clears every record. |
| R2-SERVER3 (minor) own-phone read creates `mfaPending` | closed | `mfa_sign_in.rb:275-276`; the new test fails when `phone_request_rows` goes through `mfa_pending_map` again. |
| R2-SERVER4 (minor) drift check ignores answers | closed (by reading) | `ops_helpdesk_scenario_test.rb:585-604` compares every body value, with only `code` (device rows) and `rev`, `id` (log rows) set aside: stronger than asked. The test passes on this head, so the committed capture matches after the fixes and the merge. |
| R2-SERVER5 (minor) PLAYTEST and the fourth FAIL | closed | `PLAYTEST.md` beat 1 server line (`e68f9369a`). |
| R2-CLIENT1 (minor) reset password not first | closed | `signin-rows.js:244-254`, remote tile. Real modules, captured value plus reset: row `value` and `use` are the reset password, the captured note kept as a line; keyboard and remote tiles fill the reset password. |
| R2-CLIENT2 (minor) a send that never answers | closed, with a limit (recorded limits, 1) | `helpdesk-request-minigame.js:204-231`, CSS rule for the dimmed Close. Probe: while waiting the line is "Sending your request..." and Close has `aria-disabled="true"`. |
| R2-CLIENT3 (minor) note names a log not held | closed | `helpdesk-request-minigame.js:242`, `:251-254`; both cases tested in `helpdesk-request.test.mjs`. |
| R2 beat 13 (pretext ask done only on "granted") | closed | `person-chat-pretext.js:300-336`. No dead end found, see "The questions asked". |

## Can each new server test fail?

Each fix was broken in a scratch copy of the one method and the fixer's tests run against it (run, not
reasoned, except the drift check).

| Test | Broken copy that makes it fail |
| --- | --- |
| route: 200 other names cannot wipe a real account count | room made by dropping the oldest name that is not stopped |
| route: a stop cannot be wiped by other names, account and non-account lapse alike | room made by dropping any name |
| route: a full table refuses a new name alike, served again once spent | no `at` written; spent only when stopped; no sweep of spent entries |
| route: R2-SERVER2 password grant drops only Sam's steps | every pending record cleared |
| model: two wrong, 200 others, third is `triesLeft 0`, fourth blocked | dropping the oldest |
| model: no live entry is ever dropped, one desk stops at 200 | dropping the oldest |
| model: a count is forgotten after five quiet minutes | no `at` written; spent only when stopped |
| model: a refusal renews the quiet time | `at` written on the first refusal only |
| model: full table answers `blocked` with the time to the soonest spent entry | `retryIn` fixed at 300; no sweep |
| model: the cap is per desk | cap counted over the whole table |
| model: a stopped name is never dropped by other names | no sweep; dropping any name |
| model: R2-SERVER3 no `mfaPending` key created | read through `mfa_pending_map` |
| scenario: answer bodies in the drift check | by reading only: any changed value outside the three per-game keys fails `assert_equal` |

## New findings

### R3-CORE1 (major): at a full desk, wrong answers for a name with no entry are never counted, and the right answer is still granted

`app/models/break_escape/helpdesk_access.rb:96-103`, `:203-210`. The rule is judged before the table is
looked at for room. A wrong answer for a name with no entry at a full desk goes to `refuse_helpdesk!`,
finds no room and answers `blocked` without writing an entry (`:208-209`). A right answer goes straight
to `grant_helpdesk!`. So once 200 other names hold one desk's table, any account with no entry there can
be guessed without limit: every wrong guess is `blocked`, none is counted, and the right one is granted.

Probe B, real route (`helpdesk/request`, desk `it_desk`, `maxTries` 3): 200 other names with one wrong
request each, then 50 wrong requests for the account, then the right answers.

```
B: 50 wrong guesses for sokafor at a full desk: {[422, {"reason"=>"blocked", "retryIn"=>300}]=>50}
B entry after 50 wrong: nil size=200
B non-account same point: [422, {"reason"=>"blocked", "retryIn"=>300}]
B right answer now: [200, {"granted"=>true, "what"=>"password", ...}]  reset={"sam"=>{"password"=>true}}
```

The cost is 200 requests, then no limit for five minutes, and the other names can be sent again as they
lapse. Round 2 ranked a stop that never comes at 100 requests a guess as a major; this is cheaper. Before
`df5ab9c12` the same path needed 200 stopped names (600 requests); a full desk now needs 200. The stop is
on the docs' list of what the server holds hard. No test covers a right answer, or repeated wrong ones,
for a new name at a full desk.

Fix, in `app/models/break_escape/helpdesk_access.rb`, `request_helpdesk!`: after the stop check
(`:88-93`) and before `account_for_username` (`:95`), when `helpdesk_tries_view[key]` is not a Hash call
`make_room_for_helpdesk_try!(helpdesk_tries, desk_id, now)` and, if it answers a number, return
`helpdesk_blocked_by_cap!(desk_id, typed, what, retry_in)`. A name with no entry at a full desk is then
answered `blocked` whatever its answers, an account and a non-account alike, and nothing is judged. A name
that already has an entry is served as now. The call in `refuse_helpdesk!` (`:208-209`) can stay.
Tests: in `test/models/break_escape/helpdesk_access_test.rb`, "at a full desk a name with no entry is
blocked whatever its answers: five wrong then the right answers for `sokafor` are all `blocked`,
`accountResets` stays empty, and 300 s later the right answers are granted"; the same through the route
in `test/controllers/break_escape/helpdesk_review_r1_test.rb`, with a non-account answered identically.
`docs/ACCESS_AND_NETWORKS.md`, "What the player sees": say a full desk answers a new name as stopped
whatever its answers.

### R3-CORE2 (minor): an entry saved with no `at` never lapses, and 200 of them stop the desk for good

`helpdesk_access.rb:178-183`, `:232`. An entry written by the round 1 code (`{ 'n' =>, 'seq' => }`, no
stop) has no time, so it is never spent. Probe C:

```
C legacy n=2 after 100000 s: acct [422, refused, triesLeft 0]  non [422, refused, triesLeft 0]
C 200 legacy names, 900000 s later, new names: acct [422, blocked, retryIn 300] non [422, blocked, retryIn 300] size=200
```

An account and a non-account behave alike here. Only a game saved on this branch between `37205b305`
and `df5ab9c12` can hold such entries; nothing shipped wrote them.

Fix, same file, `helpdesk_try_spent?`: an entry whose `stoppedAt` and `at` are both not Integers is
spent (return true). Add a model test with two such entries: the next wrong request answers
`triesLeft: 2`, and 200 of them do not block a new name.

### R3-CORE3 (minor): signing in with the reset password can show the "cracked" or "found in a file" lesson

`public/break_escape/js/minigames/password/password-minigame.js:2723-2724`, `:2734-2735`. The lesson is
chosen from the tile's kinds. A tile of an account that is cracked (or has a password in a file) and
reset carries both kinds and fills the reset password (`merge.test.mjs`:
`KEYBOARD [{"kinds":["cracked","reset"],"fill":"Tern-Harbour-41"}]`), so a sign-in that used the desk's
password is followed by "A password can be worked out from a hash ...". By reading for the toast; the
tile kinds and fill were run. The second half came with the merge (S7 added the `cracked` branch).

Fix, same file, both places: skip both lessons when `chosen.kinds.includes('reset')`. Add a case to
`test/js/keyring-signin.test.mjs`.

### R3-CORE4 (minor): a refused form, then a granted one in the same call, marks both asks as sent

`public/break_escape/js/minigames/person-chat/person-chat-pretext.js:321-332`, `:369-378`. The listener
of an ask whose form ended in a refusal is not dropped; when a later ask's form is granted both fire.
`pretext.test.mjs` P1: `asks log=[{"result":1,"sent":true},{"result":1,"sent":true}]`, so the first ask's
line also reads "The desk put the form through." The outcome (`got_it`) is right.

Fix, same file: keep one listener per call and desk (remember the last one and `off` it before `on` in
`watchHelpdeskDefault`), so only the newest ask is marked.

## The questions asked of this round

- **Account and non-account alike.** Probe D runs the same eleven requests for each (three wrong, one
  more, then at 150 s, 299 s, 300 s, 599 s, 899 s, 1198 s, 1199 s): the answers are equal, status and
  body (`D same for non-account: true`). Full desk: equal (probe B, the fixer's tests). Legacy entries:
  equal (probe C).
- **A stop cannot be wiped or outlived.** Other names: round 2's probe above, and the fixer's tests fail
  under a mutant that drops any name. During a stop the right answers and a request for the other kind
  of reset are both `blocked` (`D right answer during stop: [422, blocked, retryIn 300]`). `blocked`
  answers do not renew the stop: `retryIn` 300, 150, 1, then `refused, triesLeft 2` at exactly 300 s.
  A grant deletes only its own desk's key and is not reachable during a stop.
- **The 15 s timeout and a late answer.** The form shows "The desk did not answer. Try again." and
  drops the late answer, but `helpdesk-client.js:129-139` still writes the result global, raises
  `helpdesk_answered` and refreshes the keyring, so a late grant is in the keyring (Sign-ins row and
  tile, "Reset") without the form saying so. A second Send gets the repeat grant with the same password
  (`helpdesk_access.rb:239-241`). `pretext.test.mjs` P3 (an answer released after the form was closed
  and the call went on): `global=granted granted=["reset_request"]`, outcome `got_it`. Recorded limit 1.
- **Pretext ask after a refusal or an unsent close.** No dead end. The ledger is per turn
  (`social-influence.js:780-794`), the ink offers "Request a reset" again, and the form opens again.
  P1: refused, close, ask again in the same call, form reopens (one form, global cleared), granted,
  outcome `got_it`. P2: closed unsent, hang up (`walked_away`, `reports=1`), call again, granted,
  `got_it`.
- **Reset password first.** See R2-CLIENT1 in the table.

## The merge of main (`85cc7960c`)

Nothing lost or doubled in the files named. `games_controller.rb` keeps `:crack` and
`:helpdesk_request` in `set_game`; `minigames/index.js` exports, imports and registers both scenes once;
`ops_unchanged_cases.rb` merges `helpdesk_cases` and `cracking_cases`, with every helper of both sides
present once (the two blocks are interleaved, which reads oddly and changes nothing; `ruby -c` clean);
`verify-run.rb` adds the helpdesk rows and the crack row and tests both in the shown-or-not line;
`remote-host-text.js` has `cracked` and `reset` tags and `issued` and `cracked` source words;
`keyring.js` `foundVisible` and `findKindToasts` know both sources. One leftover with no effect in play:
`entryTagKind` (`keyring.js:54-61`, used only by tests) answers `in_file` for a `helpdesk` entry, where
`keyringTagKind` (`password-minigame.js:444-451`) answers `reset`.

An account both cracked and reset, server through the real routes (`crackedAccounts: ['sam']`, then the
desk's password grant):

```
K after reset: [{"id"=>"sam.cracked","source"=>"cracked","password"=>"Okafor-Desk-4410"},
                {"id"=>"sam.reset","source"=>"helpdesk","label"=>"Reset","password"=>"Tern-Harbour-41"}]
K old (cracked) password: 422 {"success"=>false,"message"=>"Incorrect username or password","attemptsLeft"=>49}
K reset password: 200 {"success"=>false,"mfaRequired"=>true}
```

The server always lists the reset entry last (`credential_keyring.rb:119`). The real client modules on
those entries:

```
cracked+reset ROWS     [{"kinds":["cracked","reset"],"sources":["Cracked","Issued"],"value":"Tern-Harbour-41","use":"Tern-Harbour-41"}, {hash row, "Cracked"}]
cracked+reset KEYBOARD [{"kinds":["cracked","reset"],"fill":"Tern-Harbour-41"}]
cracked+reset REMOTE   [{"kinds":["cracked","reset"],"fill":"Tern-Harbour-41"}]
captured+reset, in-file+reset: the same, reset value shown and filled
cracked only           row value the cracked password, tiles fill nothing (S7 as built)
```

So the Sign-ins row shows and uses the reset password under both tags, both tiles fill the reset
password, and the old cracked password is offered nowhere; the server refuses it. It is still in the
`GET /keyring` answer (the `sam.cracked` entry), as a captured one is after a reset.

## Recorded limits

1. A grant that arrives after the 15 s timeout is not shown by the form ("The desk did not answer. Try
   again."); the password is in the keyring and a second Send shows it.
2. A late refusal after the timeout uses one try without the form showing a count.
3. With R3-CORE1 fixed, a player who fills a desk with 200 names blocks every new name there, right
   answers included, until an entry lapses (five minutes, longer if the names are kept alive). It
   affects only that player's own game.
4. A form closed unsent and a hang-up counts as a failed call (`pretext_<call>_reports` + 1).
5. The old cracked or captured password stays in the keyring answer after a reset; only the screens
   put the reset one first.
6. `entryTagKind` in `keyring.js` does not know the `helpdesk` source (tests only).

Verdict: not clean
