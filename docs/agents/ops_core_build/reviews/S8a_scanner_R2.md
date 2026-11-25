# S8a leak scanner review, round 2

Scope: commit `5f413a659` (the fix of R1-L1 to R1-L14), read whole, against the server as it is now (after `f4ea81d6c`, `5956c7787`, `8515d0bfa`).
Files: `tools/playtest/lib/access_leak_scanner.rb` (lines 3444 to 4011, and 458 to 466), `tools/playtest/access-leak-check.rb`, `tools/playtest/verify-run.rb` (not changed by the fix), `test/controllers/break_escape/access_leak_scanner_mfa_fix_test.rb`, `access_leak_scanner_mfa_real_test.rb`.

Result: 1 blocker, 1 major, 7 minor. Nothing was fixed in this round.

## How it was checked

- The round 1 scratch file was run again unchanged against the fixed scanner (every round 1 capture rebuilt).
- New attempts are doctored copies of two honest runs: the run built by `access_leak_scanner_mfa_real_test.rb` (`run_game`), and the tester's real browser capture of `PLAYTEST.md` (game 86, 288 rows, read only). "Passes" means the scanner reported nothing, used every entry and would exit 0. Scratch files, outside the repo: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/r2/s8a_scanner_r2_test.rb`, `s8a_real_capture_test.rb`, `s8a_real_capture2_test.rb` in the same folder.
- Tests run: the seven scanner unit files, the five real-answer files (with the new fix file), `ops_mfa_scenario_test.rb`, `ops_logs_scenario_test.rb`, `ops_scan_scenario_test.rb`: 412 runs, 4016 assertions, 0 failures, 0 errors. (The fixer reports 419; the difference is the choice of files, not a failure.)
- The honest run. On the test's run with the `login` tags removed, and on the real capture of game 86: with no names the scanner reports Hana's unlock and Cal's Shipping PC sign-in (lines 107 and 278 of the real capture); with `--signin hana@code_pc1#1 --signin cal@plain_pc#1` both scan clean with no unused entry. The claim holds. The token row is Hana's second sign-in success and is placed by its host label, so it needs no name.
- The server since round 1. `f4ea81d6c` is the validator, `5956c7787` is client code, `8515d0bfa` makes `mfa_reenrolled?` private and edits comments. No answer shape changed. `verify-run.rb` calls only `mfa_now`, which is still public. The scanner still matches the server on the points round 1 listed.
- The edited assertion (`via: technique` on `POST login` no longer exempt). The `login` action reaches only `attempt_login!` (`password`), the two claims (`claim`) and `attempt_credential_login!` (`credential`). A technique session is written only by `network_ops.rb:624` and answered on `POST network/technique`, nested under `session`. So the edit tightens. The other scenarios' real tests (which hold real technique grants) pass; none of those scenarios has a second step, so the second-step rules are off there. In a scenario with both, the technique answer is not read by these rules at all (R2-L3).

## The 14 round 1 findings

| Finding | State | Note |
|---|---|---|
| R1-L1 (blocker) | fixed with a new fault | The honest run now passes with two names. A name is taken on trust wherever no later row refutes it: R2-L1, R2-L2. |
| R1-L2 | fixed | Captures 1 and 2 are reported; the `endedPcIds` case too. Comes back under a name (R2-L2) and by a route the rules do not read (R2-L5). |
| R1-L3 | fixed | Captures 4, 5, 6 and 10b are reported; the registry check works. `via: claim` is still exempt by its own word (R2-L4). |
| R1-L4 | fixed in part | Captures 7, 8, 9 and 10 are reported. A session-shaped success on a route or verb the rules know but do not judge is still skipped (R2-L3), and a name clears an answer with no `via` (R2-L1). |
| R1-L5 | fixed | Captures 11 and 12 are reported. |
| R1-L6 | fixed | Capture 13 is reported (every open step of the kind is closed). The tag variant cannot occur in a real capture. |
| R1-L7 | fixed with a new fault | sis03 is clean. The exemption is by the shape of the value, not by what the scenario authors (R2-L7). |
| R1-L8 | fixed | Capture 15 is reported. |
| R1-L9 | fixed | Capture 3 is reported (an unnamed logout ends every earned session). |
| R1-L10 | fixed | Capture 14 is reported. |
| R1-L11 | fixed | Capture 24 is reported. |
| R1-L12 | fixed in part | The path and query check works (capture 18). The tag check (capture 20) works only on a tag the recorder never writes. |
| R1-L13 | not fixed in a browser capture | Capture 29 is still a finding with no tag, and no option names the PC of a pass answer. It fails closed. The written playtest avoids it by its order of beats. |
| R1-L14 | fixed | `CredentialModel.policy_for` is used. |

Captures 22 (a pass five hours late) and 25 (a code in an unparsed `bodyText`) still pass; both were recorded limits.

## Findings

### R2-L1 (blocker): a name alone clears a session at a step PC when no later row contradicts it, and says nothing

`access_leak_scanner.rb:3836` (a named PC that owes no step returns clean before anything else is read), `:3794` (the check is armed only for `via: password` and not `remote`), `:3760` and `:3794` (one slot, dropped or overwritten by the next sign-in), `:500` to `:553` (nothing is checked when the scan ends), `:3756` (a name is used on any status and on `/login.json`).

Hana and Cal are each admitted at a PC with a step and at Shipping PC, which has none. Each of these passes with exit 0 and no unused entry:

- Real capture, rows 95 to 98 and 100 removed (the step, the pass and the lock), so row 107 is a session for Hana at Accounts PC with no step. Named honestly it is reported. With `--signin hana@plain_pc#1 --signin cal@plain_pc#1` and row 108 (the desktop) absent, or the capture given only up to row 107: clean. This is the case of a check run after a beat, which the header of `access-leak-check.rb` invites.
- Real capture, Cal given a session at Orders PC with no step (rows 162 to 164 and 177 removed, row 178 made a `POST login` success), desktop row 179 absent, `--signin cal@plain_pc#1 --signin cal@plain_pc#2`: clean. This is the careless case: the tester sees a finding for Cal, adds one more name, and it goes.
- The same bypass with the desktop row present but the sign-in answer carrying no `via`, or `via: credential` with `kind: saved_connection`, or the desktop's session marked `remote`: clean, and never checked. Round 1 required an answer with no `via` to be reported (R1-L4); a name now clears it.
- The same bypass named at Shipping PC, then Cal's own named sign-in before the desktop of Accounts PC arrives: clean (the slot was overwritten).
- A session for Hana at Ledger PC with no step, named as the unlock at Accounts PC (where a real lock is held), no desktop row: clean.
- A `--logout` named at the wrong PC stands in the same way when no later answer lists that PC.

With the desktop row present and in order, the plain cases are refused (exit 2); that part works. What can be hidden without it: every step-less session answer for an account that is also admitted at a PC with no step (here Hana at both code PCs and Cal at Orders PC, two of the five enrolled accounts), one per name, with no limit on the number of names. Ines, Dev and Nia have no such PC and cannot be named away.

The scanner cannot say "named, unconfirmed" today: it keeps no record of a name that was never checked. The proof it needs is in every honest capture: in the real run each keyboard sign-in success is followed within about a second by `GET container/<pc>` whose `session` names the account (rows 87 and 88, 107 and 108, 278 and 279).

Smallest fix that stays fail-closed: a named sign-in is provisional until confirmed. Arm the check for every named sign-in whatever its `via`, `remote` or status. The first later 200 desktop row whose `session.npcId` is that account must be the named PC; any other PC is exit 2. A name still unconfirmed when the account next signs in, passes a step or signs out, when another name is armed, or when the scan ends is exit 2 with the text "named, unconfirmed: give the capture up to the desktop that followed". Do the same for `--logout` (unconfirmed at the end of the scan is exit 2). The honest run passes unchanged. The better fix is still round 1's: the recorder tags `POST login` rows with the `pc_id` of the request body, as it tags `inv`; then no name is needed and the tester's word is out of the rule.

### R2-L2 (major): the desktop row does not refute a name when the run already holds that account at the PC shown

`access_leak_scanner.rb:3825` (`elsif @mfa_at[shown] != pending[:account]`).

Real capture with only row 100 (the lock) removed: Hana passes the step at Accounts PC (row 97), then row 107 is a second session for her there with no step and no lock. The server would ask for the step again. Named honestly this is reported (it is round 1's capture 1). With `--signin hana@plain_pc#1` it is clean, although row 108, the desktop of Accounts PC showing Hana, follows at once: the run holds Hana at Accounts PC from the pass, so the desktop is not read as a refutation, and the name is never confirmed either. So the fixer's statement that a wrong name is caught whenever a later desktop row shows the step PC is not true, and R1-L2 comes back under a name.

Fix: the same as R2-L1. Once the first desktop row after a named sign-in must be the named PC, drop the `@mfa_at` exception; an honest browser opens the desktop of the PC it has just signed in at.

### R2-L3 (minor): session answers the rule still does not judge

`access_leak_scanner.rb:3744` to `:3749` (the `case` has no `else`), `:508` (a row with no body is skipped).

Round 1's capture 7 control (Hana's sign-in success with no lock before it) is not reported when its method is GET or PUT, or when the same body sits on `POST logout`, `lock_session`, `inventory`, `mfa/device`, `mfa/phone`, `mfa/<anything>` or `POST scenario`; nor when it is nested under `session` (the shape of a technique answer). A `GET container/<step pc>` answer whose `session` names an account that never passed the step is not judged (the desktop of Stock PC showing Nia before any step was opened passes). A sign-in answer whose body the recorder lost (`bodyError`) is skipped, so the step-less session of R2-L1 with row 107's body lost and its desktop following passes with no name at all.

Fix: add `else mfa_judge_unplaced` and send a non-POST `login` there too. Treat a `POST login`, `mfa/verify`, `mfa/prompt` or `mfa/approve` row with no readable body as a sign-in the scanner cannot place: take every earned session back. Judging the desktop's `session` (the PC is in the path) is right but needs each sign-out placed first: in the real run row 91 shows Hana's honest session at Accounts PC after three unnamed sign-outs elsewhere. That needs the recorder's tag on `logout`.

### R2-L4 (minor): `via: claim` exempts any account at any PC by its own word

`access_leak_scanner.rb:3837`.

A `POST login` success for Dev at Orders PC with `via: claim` passes, and so does a bootstrap session for Hana at Accounts PC, never earned, with `via: claim`. Dev owns no PC and nothing in the scenario lets a guest session exist, so the server could not give either. This is the fault R1-L3 fixed for `relay: true`.

Fix: exempt a claim only when a PC the answer could be about has that account as its `owner`, or the scenario authors a `borrow_session` workaround that can leave that account a guest session there.

### R2-L5 (minor): a session ended or replaced by a route the rules do not read stays credited

`access_leak_scanner.rb:3912` to `:3938`.

A technique session for another account at Accounts PC (`POST network/technique`, `session` with host `ACC01`) between Hana's lock and her next sign-in: the sign-in still passes as the unlock, though the server has replaced her session. A bootstrap that lists Hana's password session after the same technique answer also passes. The same holds for a session an NPC's borrow displaces. No shipped scenario has both a step and a technique.

Fix: any 200 answer that holds a `session` Hash with a host label, outside the routes already read, takes the earned session and the lock back at that PC (at every PC when the label is unknown).

### R2-L6 (minor): rows the server did not answer as read still earn or close the wrong way

`access_leak_scanner.rb:3919` (a `cancelled`, `expired` or `lockedOut` answer on `/mfa/approve.json` closes nothing, so the approval after it passes with no new step), `:3756` and `:3965` (a sign-in success with status 201 or on `/login.json` uses up a name and records the account as held at the PC, which a later `--logout` and the refutation check then rely on).

Fix: close steps on the loose route too (closing is the safe direction); use a name and write `@mfa_at` only on the strict route with status 200.

### R2-L7 (minor): the `code` narrowing is by the shape of the value

`access_leak_scanner.rb:3676` to `:3682`, `:3693`.

Answers to the question asked. The gate is structural in one half: the rule runs only where a code device is authored, which is the server's own condition for a code to exist (a scenario with a `code` policy and no device has none; checked). `test_ops_mfa` is the only shipped scenario with a second-step policy; there the real device code under a `code` key in a sign-in answer, a room answer or the bootstrap is still reported, as a string and as a number. The other half is not structural: inside such a scenario a `code` value passes unless it holds six digits in a row after spaces, tabs and hyphens are removed. These pass: `12345` as a number (a code with a leading zero sent as a number, one code in ten), `123456.0`, `"123.456"`, `"123_456"`, `"123/456"`, a code split by a newline, full-width digits. The server sends none of these today. In the other direction, a scenario with a device that authors a six-digit `code` field gets an honest finding the tester cannot clear, and the validator line round 1 asked for was not added. The fix test's sweep of shipped scenarios asserts nothing for a scenario that has a step (`access_leak_scanner_mfa_fix_test.rb:383`).

Fix: collect the authored `code` values of the scenario when the scanner is built and exempt only a value equal to one of them that is not six digits; every other value under `code` is a finding. Add the validator error for an authored six-digit `code`, or a `numbers` key, in a scenario with a second step.

### R2-L8 (minor): an honest unlock of a locked token session is reported and cannot be cleared

`access_leak_scanner.rb:3842`, `:3926` (only a passed step credits `@mfa_held`).

The server skips the step for the account's own locked session of any kind (`mfa_sign_in.rb:29`), and a token session over a foothold can be locked (`game.rb:4030`). Token sign-in at Accounts PC, Lock, then the password: the server unlocks with no step; the scanner reports `mfa:session:hana`. It fails closed and is one click off the written playtest (beat 9).

Fix: also credit `@mfa_held` when a sign-in placed at exactly one PC was judged exempt as a token.

### R2-L9 (minor): three round 1 fixes work only on a tag that does not exist

`access_leak_scanner.rb:3662`, `:3873`, `:3932`, `:3997`.

The pass answer with two panes open (R1-L13), the step answer against its row (R1-L12) and the single-PC close and sign-out are fixed only for rows carrying a `login` tag. The recorder writes none, and the new tests for them add the tag by hand, so they prove a path no capture takes. A tag is also trusted more than a name: it is never checked against the desktop that follows.

Fix: have the recorder write the tag (`pc_id` of the request body on `POST login`, `mfa/verify`, `mfa/prompt`, `mfa/approve`, `logout`, `lock_session`; null when unreadable). Until it does, refuse (exit 2) a `login` tag on a row of a capture, so a hand-edited file cannot place a sign-in.

## The fixer's remaining limits, judged

| Limit | Judgement |
|---|---|
| A tag on `mfa/*` and `logout` rows is honoured but the recorder writes none | Close before landing, in the recorder. It is the real fix for R2-L1, R2-L2, R1-L13 and the desktop half of R2-L3, and about fifteen lines beside `inventoryTag`. If the recorder is out of reach, R2-L1's confirmation rule is the least that must land, and R2-L9's refusal of hand-written tags with it. |
| `--resume` has nothing to restore | Acceptable. A power cut that ends a session reaches the scanner through `endedPcIds`; a 403 `off` row ends nothing in these rules. A `--resume` entry in a scenario with no admin account comes back unused (exit 2), checked. |
| Code validity not checked | Acceptable, as round 1 judged. |
| Timing and the five-minute closure not modelled | Acceptable to land. Rows carry `t`; a pass more than 300 seconds after its step opened could be reported later. |
| Five wrong codes closing the step not modelled | Acceptable: the closing answer carries no mark that tells it from a wrong code. |

## For the owner

Limits that remain after the fixes above:

- A name, once confirmed by the desktop row, rests on the browser opening the desktop of the PC it signed in at. A sign-in whose desktop never opened cannot be named.
- The scanner trusts a pass answer's own word that the code or number was right.
- An owner approval is not checked against the prompt count, nor against the owner being knocked out (the server then answers nobody).
- A step that ran out with no answer saying so, or was closed by five wrong codes, stays open in the scanner.
- A cancel, expiry or lockout closes every open step of that kind in the scanner while the server closes one; a pass on one of the others afterwards is an honest finding (beat 15's wrong number closes Dev's open step from beat 13).
- A token's or invite's exemption is checked against the registry, not against the proof that the run held it.
- The host label of a remote sign-in answer is the answer's own word for the PC.
- An unparsed `bodyText` or a `dom` page is not read by the key rules.
- A session carried in from before the first capture file is reported; give every capture file of the game.
