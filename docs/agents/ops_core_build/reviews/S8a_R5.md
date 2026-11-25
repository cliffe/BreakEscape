# S8a review, round 5 (final): the playtest 3 fixes

Scope: `71adcb8e8` (client: the locked second-step pane's back button), `3d1ee057d` (leak scanner: the `POST mfa/verify` lockout allowance) and `8a429d362` (one line of `scenarios/test_ops_mfa/PLAYTEST.md`), on `ops-mfa` at `8a429d362`. Review only; nothing was fixed. This is the last round the rules allow on this stage, so each finding says whether it is to be fixed without further review or recorded.

Result: 0 blockers, 0 majors, 3 minor.

**Can land: yes.** No fix is needed first. R5-1 and R5-2 only narrow the new allowance (they can add findings, never remove one), so they may be made without further review if the honest fixture test and game 129 still pass; otherwise record them. R5-3 is a test to add or a line to record.

## How it was checked

- Scanner tests under the lock, in one run (the command of the task: the scanner unit and controller files, `ops_mfa_scenario_test.rb`, `mfa_verify_run_test.rb`): 405 runs, 3800 assertions, 0 failures, 0 errors, 0 skips.
- Client tests: `bin/test-js` on `mfa-signin-pane`, `password-signin-mode`, `mfa-real-phone-flow`, `mfa-signin-push-pane`: 4 files passed, 0 failed.
- Scratch probes outside the repo (scratchpad folder `r5/`): `probe.rb` (35 doctored copies of the fixture rows, run with `bin/rails runner`, real scenario, an unsaved `Game`), and two copies of the client test files with added cases (`js/mfa-signin-pane.r5.test.mjs`, `js/mfa-signin-push-pane.r5.test.mjs`).
- The three real captures through `tools/playtest/access-leak-check.rb` (point 5).

## 1. The new allowance

**When the server sends the body.** `verify_sign_in_code!` (`app/models/break_escape/mfa_sign_in.rb:95`) answers with `login_locked_out_answer` (`app/models/break_escape/game.rb:4643`, the four keys) in two cases only, both for the account and PC of the open code step the request names:

1. `mfa_sign_in.rb:110`: the key (PC and username) is already locked when the code arrives.
2. `mfa_sign_in.rb:324` to `:325`: this wrong code is the failure that takes the key's count to `maxAttempts` (`record_login_failure!`, `game.rb:4660` to `:4680`).

The count is one number per PC and username. Wrong passwords (`game.rb:3666`) and wrong codes (`mfa_sign_in.rb:324`) both add to it. It is cleared by a passed code (`mfa_sign_in.rb:306`), an approved push (`:253`) and a password sign-in that owes no step (`game.rb:3658`), which includes the unlock of the account's own locked session (`mfa_sign_in.rb:29`). A lock is never removed (nothing deletes from `loginLockouts` for an account), and a locked key is refused at the password step (`game.rb:3631`), so no new step opens for it. A malformed code, a stale code and the thirty-code closure add nothing to the count, and the scanner does not count them either (their answers carry no `attemptsLeft` with `mfaIncorrect`); this matches.

**Is "wrong codes equal to `maxAttempts` less one" the server's real condition?** It is the real condition for case 2 when every failure since the last clearing was a wrong code. It is not the condition when:

- a wrong password for the same account at the same PC fell in the same count. Probe: one wrong password, six wrong codes, the lock on the seventh code: **reported** (`lockout_list` on the `POST mfa/verify` row). The fixer's own test pins this as a finding;
- the key was locked by passwords while the step was open (case 1);
- the count was cleared by the password unlock of a locked session with no pass answer (the scanner clears only on a pass, `access_leak_scanner.rb:4105`), so the scanner's count is too high and a later honest lock is reported;
- two code steps were open in the scanner when any of the wrong codes arrived (the pair stays unknown until a pass, and a locked account never passes).

**Is the mixed case acceptable as a limit?** Yes, record it; do not fix it in this stage. A wrong-password answer names no PC and no account (the server answers a wrong password and an unknown username alike on purpose), so nothing in the capture ties it to the key, and crediting it would be a guess. It fails closed (exit 1, never a missed leak). It is not ordinary play: reaching a lock by codes needs eight failures in a row with no pass, which a player does only on purpose, and the written `PLAYTEST.md` has a single wrong code (`:56`) and no lockout by codes. The cost is that a tester who does the wrong-code lockout and also mistypes the password once gets a false `lockout_list` and must run again. `PLAYTEST.md` does not say so; one sentence there would save a wasted run (a doc line, no review needed).

**Attempts to pass an unearned notice** (`probe.rb`; "finding" means the lock row is still reported):

| Attempt | Result |
|---|---|
| The open step is another account's (Ines at the same PC); the seven wrong codes are Hana's | finding |
| The open step is at another PC (same account) | finding |
| A second code step opened at another PC just before the lock | finding |
| No open step | finding |
| `GET` | finding |
| Status 200; status as the string `"422"` | finding |
| An extra key (`pcId`) | finding |
| After a `cancelled` answer on `mfa/verify` | finding |
| After the expiring fifth wrong code with no new first step | finding |
| The first five wrong codes at another PC, or for another account | finding |
| The wrong-code rows tagged with another PC | finding |
| One wrong code on the loose route (`.json`), at status 200, or with no `attemptsLeft` | finding |
| Eight wrong codes, then the lock | finding |
| The whole honest run twice (count 14 at the second lock) | finding |
| An older code step still open at another PC | finding |
| **The lock row carries a `login` tag naming another PC than the open step** | **credited: R5-1** |
| **The lock row's path carries a query (`?pc_id=code_pc2`)** | **credited: R5-1** |
| **`attemptsLeft` is `0.0`** | **credited: R5-2** |
| The lock row is one hour after the step opened (the server drops a step after 300 seconds, `mfa_access.rb:29`) | credited: the recorded limit "time is not modelled" (scanner R1, R2), which now covers this allowance too |
| A second lock notice after a new first step for the same account at the same PC (count still 7) | credited: the server cannot send that first step (`game.rb:3631`), and the notice tells nothing the first one did not; no fix |
| The row is for another game id, or a wrong-code row is | credited by the library, as every second-step rule is (`/games/[^/]+/`); the command line refuses rows of another game (`access-leak-check.rb:71`); not new |

No attempt passed a notice for an account or PC other than the one open step's, and none passed without the full count.

**Honest answers it still flags** (all fail closed; all recorded below): the mixed lock; a lock sent because the account was locked by passwords while the step was open; a lock after a password unlock cleared the server's count; a lock when another code step was left open elsewhere (the scanner never times a step out); the same lockout body on `mfa/prompt` or `mfa/approve` (a push step whose account was locked by passwords, `mfa_sign_in.rb:244`).

Honest answers it credits, checked: the fixture; a stale code between the wrong ones; a wrong code, a pass, then the full run; a device read between; a `cancelled` answer on the push route between (it closes no code step).

## 2. Existing rules and tests

Nothing existing is touched or weakened.

- `3d1ee057d` adds two keys to the row context (`status`, `mfa_verify_strict`, `access_leak_scanner.rb:1017` to `:1018`; `status` is read only at `:1724`), one more condition on the `lockout_list` branch (`:1692`, which can only be false under the new proof), two instance variables, one call before the pass branch (`:4100`) and two deletes inside it (`:4105`). The count writes only its own two variables. The pass, close, session and name rules are byte for byte as they were.
- Tests: `3d1ee057d` adds one new file and one fixture; `71adcb8e8` adds one test to `test/js/mfa-signin-pane.test.mjs` and edits none. `git show --stat` agrees with the fixer.

## 3. The client fix

Read and run; it does what it says.

- After the lockout on the code pane (the capture's row 63 body): one "Use a different account" button, enabled (`#signin-locked-back`); the pane's own dead `#signin-second-back` is gone. The style sheet hides only the tiles, the form and the prompt in second-step mode (`password-minigame.css:1878` to `:1881`), so the new button, appended to `.signin-mode`, shows.
- After the click: `signInPane` is `password`, `.signin-mode` has lost `signin-second-step` and `signin-chosen`, `#signin-second` is hidden, the line reads "Choose an account." (the lockout text is gone), nothing under `.signin-mode` is disabled, `gameResult` is null, no account is selected, the password is empty, and the client holds no pending step for the PC (`mfa-client.js` drops it on `lockedOut` and on `codeLocked`). No request is sent by the click or after it.
- Picking the same account again and sending its password, with the server answering the login lockout: the locked state again ("This account is locked on this PC.", form disabled, one live back button), and the second back works too.
- The same holds from the thirty-code closure (`codeLocked`) and from a lockout on the push pane (no timer left running, no further `mfa/prompt` after 3.5 seconds). The repo's new test covers the code pane only: R5-3.

## 4. The item not done

Confirmed; exit 2 is the right choice.

- Server: `logout` (`games_controller.rb:1657` to `:1667`) answers `{ success: true, endedPcIds: [...] }` for any `pc_id`, whether or not `logout_session!` (`game.rb:3862`) found a session; `endedPcIds` lists onward sessions only and is empty in both cases.
- Capture 129: rows 111 and 117 are `{"success":true,"endedPcIds":[]}`. Between the sign-out (row 111) and the second sign-in (row 114) there are two rows, `GET login_accounts` (112) and `GET keyring` (113, `unchanged`); neither shows the Shipping PC's session. Rows 108 and 114, and 109 and 115, are the same shapes. So nothing in the capture tells "signed out of the Shipping PC, then signed in" from "signed out somewhere else, session still held", and crediting it would be a loosening.
- Runs: with `cal@plain_pc#2` added the check exits 2 ("the run already held cal at plain_pc before this sign-in"); without it, exit 1 with the one `mfa_session` finding.

**The limit, for the owner:** an account that signs out and signs in again at the same PC with no second step, with no page reload between, cannot be cleared by any `--signin` or `--logout` entry (exit 2, or one `mfa_session` finding with none), because the sign-out answer is the same whether or not a session was held and names no PC.

**What would remove it:** the recorder writing the PC the request named on every `POST login` and `POST logout` row, as the `login: { "pcId": ... }` tag the scanner already reads (`access_leak_scanner.rb:3614`, `:4217`). A successful sign-out tagged with a PC proves no session is held there after it. The command line refuses any tagged file today (`access_leak_scanner.rb:305` to `:314`), so a tagged copy of this capture could not be run; that path is untested end to end, and R5-1 must be fixed in the same change.

## 5. The real captures

| Game | Entries | Exit | Result |
|---|---|---|---|
| 129 | `--signin hana@code_pc2#1 --signin cal@plain_pc#1` | 1 | 1 finding: `mfa_session`, `mfa:session:cal`, `POST login`, row 114. `lockout_list` 0 |
| 129 | the same plus `--signin cal@plain_pc#2` | 2 | the entry is refused (point 4) |
| 111 | `--signin hana@code_pc1#1 --signin cal@plain_pc#1` | 0 | no leaks found |
| 86 | `--signin hana@code_pc1#1 --signin cal@plain_pc#1` | 0 | no leaks found |

All as expected.

## 6. Scanner tests

405 runs, 3800 assertions, 0 failures, 0 errors, 0 skips. The fixer's count was 405 runs, 0 failures.

## Findings

**R5-1 (minor; fix without review, or record): the allowance does not read what the lock row itself says about its PC.**
`tools/playtest/lib/access_leak_scanner.rb:1723` to `:1737`. `mfa_verify_lockout_proved?` takes the PC from the one open code step and never looks at the row's `login` tag or query; the wrong-code count beside it does read the tag (`:4130`). Input: the fixture rows with `"login": {"pcId": "code_pc2"}` on the last row, or with `?pc_id=code_pc2` on its path: credited, though the row says the answer is about another PC. Not reachable from the command line today (a tagged file is refused, and the recorder writes no query on a `POST`), so it is minor; it becomes live the day the recorder writes the tag, which is the cure for the limit in point 4. Smallest fail-closed fix: add the row's tag and query to the context at `:1017`, and in the method return false when the row has a `login` key whose `pcId` is not the step's PC, or has any query. One test line for each.

**R5-2 (minor; fix without review, or record): `attemptsLeft: 0.0` is credited.**
`access_leak_scanner.rb:1726`: `hash['attemptsLeft'] == 0` is true for the float. The server sends the integer (`game.rb:4645`). Input: the fixture with the last body's `attemptsLeft` set to `0.0`. No information is in it; it is a shape the server never sends. Fix: `hash['attemptsLeft'].is_a?(Integer) && hash['attemptsLeft'].zero?`.

**R5-3 (minor; add a test, or record): the back button on the locked push pane and after the thirty-code closure has no test in the repo.**
`public/break_escape/js/minigames/password/password-minigame.js:3298` to `:3301` now adds the button on every second-step pane; `test/js/mfa-signin-pane.test.mjs:184` covers the code-pane lockout only. The scratch cases pass (point 3), so this is cover, not a fault. Smallest fix: the same assertions once in `test/js/mfa-signin-push-pane.test.mjs` with a 422 lockout answer to `mfa/prompt`.

## For the owner: recorded scanner limits of this stage

From this round:

1. A lock on `POST mfa/verify` is credited only when wrong codes alone reached it; a lock reached with even one wrong password for that account at that PC in the same count is reported, because a wrong-password answer names no PC or account.
2. A lock notice sent because the account was locked by wrong passwords while its code step was open is reported, for the same reason.
3. The same lockout body on `mfa/prompt` or `mfa/approve` (a push step whose account is locked) is reported; no rule credits it.
4. The scanner's wrong-code count is cleared only by a pass answer, so after a password unlock of a locked session (which clears the server's count) a later honest lock by codes is reported.
5. A wrong code that arrives while two code steps are open in the scanner makes both accounts' counts unknown until each passes, so a lock that follows is reported.
6. The scanner does not time a step out: a code step abandoned at one PC stays open for the rest of the run (which leads to limit 5), and a lock notice more than 300 seconds after its step opened is still credited.
7. An account that signs out and signs in again at the same PC with no second step, with no reload between, cannot be cleared by any entry (exit 2); the recorder writing the request's PC on `POST login` and `POST logout` rows would remove it (R4-L2; point 4).
8. If R5-1 and R5-2 are not fixed: the allowance ignores a `login` tag or query on the lock row, and accepts `attemptsLeft` as `0.0`.

Carried from earlier rounds, unchanged by this one:

9. The recorder writes no PC on any row, so a sign-in that could be at more than one PC must be named with `--signin`, and a wrong name is an error, not a pass.
10. A desktop is judged only for a keyboard password session of a known account, and never again once that account passed a step at that PC in the run (R4-L3, R4-L4).
11. The "already held there" check knows only sessions a confirmed name placed (R4-L5).
12. A `--logout` name that is wrong can stand when another account replaces the session before any answer lists that PC (R3-4 a).
13. The second-step routes are matched by `/games/<any id>/`; only the command line, not the library, refuses rows of another game.
