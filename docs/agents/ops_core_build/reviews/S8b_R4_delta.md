# S8b review, round 4: delta of the round 3 fixes

Branch `ops-helpdesk`. Delta reviewed: `git diff b06cc2f6a..HEAD`, three commits: `a56f443ae` (server),
`01c76f226` (client), `4b4f5cd12` (scanner). Ten files, 245 lines added, 12 removed. Read-only: no code
changed. Scratch (outside the tree): `<scratchpad>/s8b-r4/` holds `probe_test.rb` (route probes V0 to
V4, output `probe.out`), `mut_test.rb` and `mut2_test.rb` (the new Rails tests run against broken
copies of single methods, prepended for the run only; `mut.out`, `mut2.out`), `hooks.mjs` and `reg.mjs`
(a node loader that breaks one line of a client file for the run only).

Runs on this head:

- `helpdesk_access_test`, `helpdesk_review_r1_test`, `ops_helpdesk_scenario_test`: 80 runs, 768
  assertions, 0 failures.
- Scanner suite (`test/unit/access_leak_scanner*.rb`,
  `test/controllers/break_escape/access_leak_scanner*_test.rb`): 575 runs, 5886 assertions, 0 failures.
- `bin/ops-golden-compare`: 30 runs, 60 assertions, 0 failures.
- `node --test`: `keyring-signin` 57, `helpdesk-pretext-open` 11, `helpdesk-request` 26,
  `keyring-client` 90, `mfa-signin-pane` 23, `signin-rows` 37, `helpdesk-scenario-click-paths` 10: all
  pass.

Counts: 0 blockers, 0 majors, 3 minors.

## Round 3 findings

| Finding | State | Evidence |
| --- | --- | --- |
| R3-CORE1 (major) free guesses for a new name at a full desk | closed | `helpdesk_access.rb:96-101`: a name with no entry is checked for room before `account_for_username` and the rule. Route probes V0 to V3 below: no grant, no count, account and non-account equal in every variation. The two new tests that pin it fail when the early check is skipped. |
| R3-CORE2 (minor) an entry with no time never lapses | closed, by another rule than the one asked | `helpdesk_access.rb:86`, `:186-198`: the entry is stamped `at = now` on the first request and lapses 300 s later; round 3 asked for "spent at once". The count is kept for those five minutes, which is the stricter side, and is the same for an account and a non-account. Route probe V4. Two gaps: R4-2, R4-3. |
| R3-CORE3 (minor) reset sign-in shows the cracked or in-file lesson | closed; one half has no test | `password-minigame.js:2724-2727` (first step), `:2737` (second step). The new test fails when `usedReset` is forced false. The second-step line can be broken with every test passing: R4-1. |
| R3-CORE4 (minor) a refused ask marked sent by a later grant | closed | `person-chat-pretext.js:371-387`. The new test fails (`[true, true]`) when the `off` of the previous listener is removed. |
| R3-SCANNER1 (minor) `;` hides the old-phone and old-code rules | closed | `helpdesk_leak_rules.rb:703-718`: `/[&;] */`, empty parts skipped, cut at the first `=`, both sides decoded; this is Rack 2.2's `parse_query` (a bad escape raises in both and is rescued as before). With `hd_query_pairs` put back to `URI.decode_www_form` both `R2-SCANNER4` tests fail. |
| R3-SCANNER2 (minor) header limits | closed | Limit (8) now ends "until a pass answer for that pair removes the mark"; the uncredited-grant sentence is in the paragraph above the limits and names limit 1. Comment only. |
| R3-SCANNER3 (minor) two behaviours with no test | closed | Both tests added; both can fail (table below). |

### R3-CORE1 through the real route

`POST helpdesk/request`, desk `it_desk`, `maxTries` 3, time frozen. Each line was run once for the
account `sokafor` and once for the non-account `zed` in a fresh game; "equal" compares status and whole
body of every answer.

```
V0 (round 3 probe B) 200 names one wrong each; 50 wrong; right (password); right (mfa); right at 299 s
   acct: blocked 300 x50, blocked 300, blocked 300, blocked 1        equal for non-account: true
   entry acct=nil non=nil size=200 resets=nil
   right at 300 s: 200 granted; size=0 resets={"sam"=>{"password"=>true}}

V1 a full desk of STOPPED names (200 names, three wrong each); 5 wrong; right; wrong, right at 150 s and 299 s
   acct: blocked 300 x5, blocked 300, blocked 150, blocked 150, blocked 1, blocked 1    equal: true
   entry acct=nil non=nil size=200 resets=nil
   at 300 s wrong, wrong, right: refused 2, refused 1, 200 granted

V2 a full desk of LIVE UNSTOPPED names, kept alive (refused again at 299 s, stopped at 598 s)
   wrong and right at 0, 299, 300, 598, 897 s
   acct: blocked 300, 300, 300, 300, 299, 299, 1, 1, 1, 1                               equal: true
   40 wrong for the account inside 0..897 s: entry nil (none counted, none granted)
   at 898 s wrong x4, right: refused 2, refused 1, refused 0, blocked 300, blocked 300

V3 a name whose own entry lapsed while the desk was full (one wrong at 0 s, 199 other names at 10 s)
   a) still live at 299 s: refused 1 (judged, counted); a fresh name at 10 s: blocked 290        equal: true
   b) at 300 s, slot free: refused 2, refused 2, refused 1, refused 0, blocked 300          equal: true
      (a fresh count of three, then the stop; table back to 200)
   c) at 300 s, another new name takes the slot first: wrong blocked 10, right blocked 10       equal: true
   d) account, at 300 s, right answers: 200 granted, size=199
   e) account, slot taken first, 30 wrong then right: blocked 10 x31; entry nil, resets nil
```

No variation gives a grant or an uncounted judged guess. A lapsed name gets what any new name gets: a
judged request with a fresh count when there is room, `blocked` when there is not.

## The delta as new code

**Outside the findings.** Three effects, none a defect:

- The early room check also runs before a grant, so a REPEAT grant for an account already reset (its
  entry was deleted by the first grant) is answered `blocked` at a full desk. V4:
  `first 200 granted; again at a full desk 422 blocked 300`. This follows from the round 3 fix
  instruction; recorded limit 4.
- `make_room_for_helpdesk_try!` now sweeps spent entries on the grant path too (it ran only on a
  refusal). Spent entries only; a grant already saves.
- `hd_query_names?` shares the new split, so the own-list rule (`hd_judge_phone_route`) now applies to a
  query such as `x=1;own=1` as well. That rule only reports, so this is stricter. The strict readers
  (`mfa_query_value`, `hd_keyring_scope`) are not touched and still split on `&` only: a `;` there
  earns nothing (the new test rows `pc_id=records_pc;pc_id=ghost_pc` and the reverse are reported).

No answer shape changed: the golden compare and the drift check in `ops_helpdesk_scenario_test` pass
without a new capture.

**Commit messages against their diffs.**

- `a56f443ae`: right, except "the first request that reaches its desk": the stamp is on every desk's
  untimed entries, by a request to any desk (R4-3).
- `01c76f226`: right. "At the first step and after a second step" is true of the code; only the first
  step is tested (R4-1).
- `4b4f5cd12`: right. It names "the old-phone and old-code rules"; the own-list rule is changed too
  (above), on the stricter side.

**Can each new test fail?** Run, not reasoned.

| Test | Broken copy that makes it fail |
| --- | --- |
| route: R3-CORE1 50 wrong then the right answers at a full desk | early room check skipped |
| model: R3-CORE1 a name with no entry is blocked whatever its answers | early room check skipped |
| route: R3-CORE1 the three round 2 properties | full-desk check applied to names that have an entry |
| model: R3-CORE1 a name that already has an entry is still judged | full-desk check applied to names that have an entry |
| model: R3-CORE2 an entry with no time | stamp removed. It does NOT fail when the stamp is made and not saved (R4-2). |
| JS: R3-CORE3 reset password of a cracked account | `usedReset` forced false. Not with the second-step line broken (R4-1). |
| JS: R3-CORE4 only the newest ask is marked | the `off` of the previous listener removed |
| scanner: `R2-SCANNER4` old phone, old device (the `;` rows) | `hd_query_pairs` split on `&` only |
| scanner: R3-SCANNER3 scoped entry under a query naming no sign-in PC | scope keys accepted without a scope |
| scanner: R3-SCANNER3 cracked and reset entry on one account | `hd_reset_entry_ok?` reduced to the id and the grant |

One run of `keyring-signin` under the loader also failed test 43 ("a slow /keyring holds
Checking..."); two more runs under the loader and the run without it did not. It is a timing test and
the loader slows module loading; not counted.

## New findings

### R4-1 (minor): the second-step half of R3-CORE3 has no test

`public/break_escape/js/minigames/password/password-minigame.js:2737`. With that line's `'reset'`
changed so it never matches, a cracked and reset account that owes a second step would again be taught
the "cracked" lesson after the step, and `keyring-signin` (57 pass) and `mfa-signin-pane` (23 pass) both
still pass.

Fix: add one case to `test/js/keyring-signin.test.mjs` beside the R3-CORE3 test: the same two entries,
the first step answered `mfaRequired`; assert `mg.params.mfaTeach` is undefined, and that no alert is
raised once the second step passes.

### R4-2 (minor): no test shows the stamp of an untimed entry is saved

`app/models/break_escape/helpdesk_access.rb:197` (`save! if stamped`). The model test uses one game
object in memory, so it passes with the `save!` removed (run: 5 runs, 0 failures). Without the save, a
desk of untimed entries answered only by `blocked` would be stamped again on every request and lapse
300 s after the last one, not the first. The code is right: route probe V4 (each request reloads the
game) gives `blocked 300` at 0 s, `blocked 1` at 299 s, `refused 2` at 300 s, with all 201 stored
entries holding the first request's time.

Fix: add a route test to `test/controllers/break_escape/helpdesk_review_r1_test.rb`: store 200 entries
`{ 'n' => 1 }` for `it_desk`, send one wrong request for a new name (`blocked`, `retryIn` 300), assert
every stored entry has `at == T0.to_i`; send another at 299 s (`retryIn` 1), then at 300 s
(`refused`, `triesLeft` 2).

### R4-3 (minor): the stamp is wider than the words say

`helpdesk_access.rb:86`, `:186-198`; `docs/ACCESS_AND_NETWORKS.md:879`; commit `a56f443ae`. The comment,
the doc and the message say an untimed entry is stamped "when a request first reaches its desk".
`stamp_untimed_helpdesk_tries!` walks the whole table: V4, a request to `it_desk` stamped an entry of
another desk (`"id_desk|x" => {"n"=>2, "at"=>1800900000}`). It also runs only for a request that passed
the `unavailable` checks. Nothing is lost by it (an untimed entry gets five minutes from the first
served request to any desk).

Fix: wording only. In the comment at `:186-188` and the doc sentence, say "when a request is first
served by any desk".

## Recorded limits the stage lands with

Server and client:

1. A grant that arrives after the form's 15 s timeout is not shown by the form ("The desk did not
   answer. Try again."); the password is in the keyring, and a second Send shows it (not at a full
   desk, see 4).
2. A late refusal after the timeout uses one try without the form showing a count.
3. A player who fills a desk with 200 names blocks every new name there, right answers included, until
   an entry lapses (five minutes; up to about fifteen if the names are kept alive to their stop). It
   affects only that player's own game.
4. At a full desk a repeat grant for an account already reset is answered `blocked` like any new name.
5. An entry saved with no time (an early build of this branch only) keeps its count for five minutes
   after the first request served by any desk, then lapses.
6. A form closed unsent and a hang-up counts as a failed call (`pretext_<call>_reports` + 1).
7. The old cracked or captured password stays in the keyring answer after a reset; only the screens put
   the reset one first. The server refuses the old one at sign-in.
8. `entryTagKind` in `keyring.js` does not know the `helpdesk` source (tests only).
9. If a first ask's form timed out and a second ask is open, a late grant marks the second ask as sent
   (one listener per desk).

Scanner (numbers in brackets are the limits in the header of `helpdesk_leak_rules.rb`):

10. A desk stop stops credit for every grant for five minutes, so the scripted run plays refusals last
    (1). An uncredited grant drops no step and marks no pair; that row is already a finding.
11. An honest lock answer for an account that had wrong codes before its first password grant is
    reported, until a pass for that pair (8); pinned by a test; not reachable in `test_ops_helpdesk`.
12. The scanner cannot tell whether a `pc_id` keyring screen was openable; the plain and the scoped
    reset entry are both accepted, nothing else (7).
13. A code's value is never checked; a recovery answer split across two places or served as a JSON
    number is not caught; anything before the first captured row is unknown (3, 4, 5).
14. The strict query readers (`mfa_query_value`, `hd_keyring_scope`) split on `&` only, so an honest
    row whose query used `;` would be reported. The client never sends `;`.

Round 3's scanner limit 5 (a `;` hides the old-phone-list rule) is closed and off the list.

For the owner, unchanged from round 3: whether a cracked row should stay, be marked stale or go once
the account is reset; and the stop rule's dependence on playtest order (limit 10).

## What a retrain must watch

The diff changes four source files and one doc. No test reads the doc. Against the full train on
`2b047efca` (Rails 5413 runs, 0 failures; JS the three known failures), these are the files that load
the changed code:

- `app/models/break_escape/helpdesk_access.rb`: `test/models/break_escape/helpdesk_access_test.rb`,
  `helpdesk_sign_in_test.rb`, `helpdesk_verify_run_test.rb`, `mfa_sign_in_reenrol_test.rb`;
  `test/controllers/break_escape/helpdesk_request_test.rb`, `helpdesk_reenrol_test.rb`,
  `helpdesk_answer_shapes_test.rb`, `helpdesk_review_r1_test.rb`, `helpdesk_keyring_test.rb`,
  `ops_helpdesk_scenario_test.rb`, `ops_helpdesk_no_exposure_test.rb`; `bin/ops-golden-compare`.
- `tools/playtest/lib/helpdesk_leak_rules.rb` (included in `AccessLeakScanner`, so every scanner test
  loads it): `test/unit/access_leak_scanner*.rb`,
  `test/controllers/break_escape/access_leak_scanner*_test.rb` (the six `access_leak_scanner_helpdesk*`
  files first), `ops_crack_scanner_real_answers_test.rb`, `ops_helpdesk_scenario_test.rb`,
  `helpdesk_verify_run_test.rb`.
- `password-minigame.js`: the 35 files of `grep -l password-minigame test/js/*.mjs`; the ones that
  reach the changed lines are `keyring-signin`, `mfa-signin-pane`, `mfa-signin-my-phone`,
  `mfa-signin-push-pane`, `mfa-real-phone-flow`, `mfa-child-handover`, `helpdesk-keyring-connect`,
  `password-signin-mode`, `password-minigame-submit`, `password-lockout-persist`, `signin-phone`,
  `signin-short-username`.
- `person-chat-pretext.js`: the 15 files of `grep -l person-chat-pretext test/js/*.mjs`:
  `helpdesk-pretext-open`, `phone-chat-skip-hint`, `pretext-debrief-labels`,
  `pretext-verdicts-unchanged`, `social-influence-new-call`, `social-influence-bar`,
  `social-pretext-prep`, `social-pretext-debrief`, `social-pretext-first-menu`,
  `social-pretext-session`, `social-gap-pretext-session`, `social-reuse-pretext`,
  `social-lab-dev-repair-name`, `validator-social-followups`, `finale-voiced-calls`; and
  `helpdesk-scenario-click-paths`, which drives the same call.

Expected test counts against `2b047efca`: Rails +7 runs (3 model, 2 route, 2 scanner), JS +2
(`keyring-signin` 56 to 57, `helpdesk-pretext-open` 10 to 11).

Verdict: clean
