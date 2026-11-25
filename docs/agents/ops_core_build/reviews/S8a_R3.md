# S8a review, round 3 (leak scanner and feature together)

Scope: the tree at `6877c05ae` on `ops-mfa`. Part A is the leak scanner after `98d60d987`, `c0a39ab1e`, `93ff5934a` and `6877c05ae` (`git diff c48606823..HEAD -- tools/playtest/ test/`, read whole, and the second-step section of `tools/playtest/lib/access_leak_scanner.rb`, lines 3480 to 4151, read whole). Part B is the feature after `f4ea81d6c`, `5956c7787`, `8515d0bfa`, `d6f31595b`, `6d2a17713` and `643d33f5d`. Nothing was fixed in this round.

Result: 0 blockers, 0 major, 13 minor.

**Can land: yes.** No finding has to be fixed first. R3-1 to R3-3 are each a few lines in the scanner and are worth doing in the same sitting; the rest can be recorded.

## How it was checked

- Tests run under the lock: `access_leak_scanner_mfa_fix_test.rb`, `access_leak_scanner_mfa_r2_test.rb`, `access_leak_scanner_mfa_real_test.rb`: 44 runs, 960 assertions, 0 failures. The seven scanner unit files, the three older real-answer files and `ops_mfa_scenario_test.rb` were not run: see the note at the end of this section.
- Node 22, each alone: `mfa-signin-pane`, `mfa-signin-push-pane`, `mfa-client`, `authenticator-live`, `validator-mfa`, `mfa-real-phone-flow`: all pass.
- The real capture (game 86, 288 rows) through the command line:
  - `--signin hana@code_pc1#1 --signin cal@plain_pc#1`: no leaks, exit 0.
  - no names: two `mfa_session` findings (rows 107 and 278), exit 1.
  - `hana@plain_pc#1` in place of the first name: exit 2, "named, unconfirmed ... the first desktop that followed is code_pc1, not plain_pc". `cal@push_pc#1` in place of the second: exit 2 in the same way.
  - a copy with a `login` tag written on row 107: exit 2, "capture files edited by hand".
- Hostile attempts are doctored copies of the real capture, scanned with the real scanner through `bin/rails runner` (no test database). Scratch file, outside the repo: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/r3/r3_probe_runner.rb`. "Passes" means no finding, no unused entry, exit 0.
- `PLAYTEST.md` and A22 were compared with the code by a reading agent; each mismatch listed below was then checked by me at the line given.

Not run: the seven scanner unit files, `access_leak_scanner_ops_real_test.rb`, `access_leak_scanner_privilege_real_test.rb`, `access_leak_scanner_ops_access_real_test.rb` and `ops_mfa_scenario_test.rb`. Another build held the test lock for more than eighteen minutes and the run was withdrawn. By reading, the diff touches those scenarios in two places only, both of which return at once when no PC asks for a second step (`mfa_note_bodyless`, `mfa_finish_scan`), and the `code` rule is off without a code device. Run these eleven files once before landing.

## Part A: the leak scanner

### State of the round 2 findings and the round 1 leftovers

| Finding | State | Note |
|---|---|---|
| R2-L1 (blocker) | fixed | A name is armed for every named sign-in and stands only on the first desktop row of a PC after it. Every bypass listed in round 2 now ends in exit 2 with the name and the reason. Three small gaps remain, all needing the sign-in's own desktop row to be missing from the capture: R3-1, R3-2, R3-3. |
| R2-L2 (major) | fixed | The `@mfa_at` exception is gone: the first desktop must be the named PC. An earlier session of the same account at a PC with no step is refused by the `prior` check (`:3900`), which holds only until the next unnamed sign-out (R3-2). |
| R2-L3 | fixed in part | Every method and route is judged, a nested `session` too, and a lost body on a sign-in or step route takes every earned session back. A desktop's own `session` is still not judged (`:3805`); recorded, with a cheap rule offered in R3-5. |
| R2-L4 | fixed | A claim is exempt only for the owner of a PC it could be about. Where a scenario authors any `borrow_session`, every claim is exempt again at every PC (`:3767`); `test_ops_mfa` authors none. Recorded. |
| R2-L5 | fixed | A foreign `session` answer takes the earned session and the lock back. |
| R2-L6 | fixed | A cancel, expiry or lockout closes on the loose route and at any status; a name is used only by the strict route with status 200. |
| R2-L7 | fixed | The exemption is by what the scenario authors, and never for six digits. The validator line was not written (R3-6). |
| R2-L8 | fixed | A token sign-in placed at one step PC is held like a passed step, so the unlock after a lock is clean. It rests on the token answer's own word and the registry (recorded limit). |
| R2-L9 | fixed by refusal | The command line exits 2 on any row with a `login` key. The scanner still honours a tag when called directly, which the unit tests use. See "The `login` tag" below. |
| R1-L1 | fixed | The honest capture passes with two names, and a name is no longer the tester's word alone. |
| R1-L4 | fixed | See R2-L3. |
| R1-L7 | fixed | See R2-L7. |
| R1-L12 | closed as far as a capture goes | The path and query check works. The tag half cannot occur now that a tagged capture is refused. |
| R1-L13 | not fixed, recorded | Two open steps of one account make an honest pass a finding. It fails closed, a test now pins it (`access_leak_scanner_mfa_r2_test.rb:252`), and the written playtest avoids it by its order of beats. Only the recorder's tag removes it. |

### The confirmation rule, attacked

| Attempt | Result |
|---|---|
| Honest capture, the two names | passes |
| Honest capture, one name wrong (either) | exit 2, names the entry, the row and the PC the desktop showed |
| A name given twice, or one name too many | exit 2 |
| Step-less session for Hana at `code_pc1` named at `plain_pc`; the desktop that follows is `plain_pc` but its session is `remote` | exit 2 |
| The same, and the run already holds Hana at `plain_pc` from an honest named sign-in, with no sign-out between | exit 2 ("the run already held hana at plain_pc") |
| The same, with any unnamed sign-out (of any account, anywhere) between the honest sign-in and the bypass | **passes** (R3-2) |
| The same, with another account's sign-in success between the bypass and the `plain_pc` desktop | **passes** (R3-1) |
| The same, the "desktop" row being a POST to the container path with a query | **passes** (R3-3) |
| Two named sign-ins in a row before any desktop row | exit 2 ("another name was armed") |
| The same account signing in or passing a step again before the desktop | exit 2 |
| A sign-out before the desktop | exit 2 |
| The desktop row unreadable, not 200, or with no session | exit 2 |
| A name on an answer that is not a keyboard password sign-in (token, remote, no `via`) | exit 2 at once |
| A name confirmed for one sign-in, reused for another | not possible: `@mfa_used` allows one row per entry, and a second entry for the same row is a parse error |
| `#n` with failed sign-ins between | counts only `success: true` answers; the 422 rows and the `mfaRequired` answers are not counted. Row 107 is Hana's `#1` and the token sign-in at row 140 her `#2`, as the usage text says |
| A confirmed name at a step PC, the step opened by Dev and the session answer for Cal | finding (`mfa:session:cal`): a name at a step PC still needs that account's own passed step, or the one unlock |
| A named `--logout`, capture ends before any listing of that PC | exit 2 |
| A named `--logout` at the wrong PC, the next listing of that PC still shows the account | exit 2 |
| A named `--logout` at the wrong PC, the account's session there replaced by another account before any listing | **passes** (R3-4) |
| An honest named `--logout`, the same account signing in again at that PC before any listing | exit 2 with a false reason (R3-4) |

A confirmed name earns nothing by itself: at a PC that owes the account no step it only clears the "could be at a step PC" doubt; at a step PC the answer is judged as before.

All three passing sign-in cases need the same thing: the desktop row that an honest browser opens straight after a sign-in is absent, and a later desktop row of the named PC shows the account there. That is the limit the fixer states ("a name rests on the browser opening that PC's desktop next"). R3-1 to R3-3 narrow it; none removes it.

### The `login` tag (question 3)

Refusing a tagged capture is the right fail-closed choice while the recorder writes none (`.claude/skills/playtest-scenario/scripts/response-capture.js` holds no `login` key; no fixture or shipped capture holds one). It is stated in the header comment (`access-leak-check.rb:32`) but not in the `usage` string printed on a bad call (`:75`), nor in the "Exit status" line (`:70`). The check must be removed in the same commit that teaches the recorder to write the tag; the comment at `access_leak_scanner.rb:305` says so. R3-7.

### `code` values (question 4)

- Only `test_ops_mfa` has a code device, so the `code` rule is off in every other shipped scenario. The real-answer test of `test_ops_mfa` and the real capture of game 86 are clean. No shipped capture flags.
- A second-step code cannot hide behind an authored value: an authored value is exempt only when it is not six digits once spaces, tabs and hyphens are removed, and the server's code is always six digits. The one remainder is a code with a leading zero sent as a number (`12345`) in a scenario that also authors the integer `12345` under a `code` key. The server sends strings; recorded.
- Every other value under a `code` key is now a finding in a scenario with a device: `12345`, `"1234567"`, `"W-03"` unauthored, `"not_found"`, `404`, `nil`, `true` (all checked). So a server answer that gains an error `code` key would be reported in such a scenario. None does today.

### Edited tests (question 5)

No assertion was weakened. `sign_in_row` now appends the desktop row after each sign-in success, which the rule needs; the two `W-03` and `A12` assertions changed from "clean" to "clean when authored, a finding when not", which is the tightening R2-L7 asked for; the named-logout case gained the listing row that confirms it and asserts what it did before. One note: the helper builds the desktop's `session` from five keys of the sign-in answer and drops `remote`, where the real desktop row of a remote sign-in carries it (real capture row 141). It changes no result today because a remote answer is refused when the name is armed.

### The fixer's remaining limits, judged (question 7)

| Limit | Judgement |
|---|---|
| A name rests on the browser opening that PC's desktop next | Record. It cannot close without the recorder writing the PC of the request. That is the follow-up to schedule: about fifteen lines beside `inventoryTag`, and it also removes R1-L13, the logout names and the `hand_tag_problem` check. |
| The pass answer's own word that the code was right | Record, as rounds 1 and 2 judged. |
| A desktop's `session` is not judged | Record. A cheap part of it can close now without placing sign-outs: R3-5. |
| R2-L7's validator error not written | Not needed to land: no shipped scenario trips it and the scanner fails closed. Write it when the validator is next touched; the exact lines are in R3-6. |

### Findings, Part A

**R3-1 (minor): another account's sign-in between a named sign-in and its desktop does not leave the name unconfirmed.**
`access_leak_scanner.rb:3887`. The header says "another sign-in or a sign-out comes first" is exit 2 (`access-leak-check.rb:30`), but the code refuses only the same account's sign-in or pass, and another named one. To see it: the real capture with rows 95 to 98, 100 and 108 removed, a copy of row 87 (the Sync service's sign-in) and then a `plain_pc` desktop showing Hana placed after row 107, `--signin hana@plain_pc#1 --signin cal@plain_pc#1`: clean. Smallest fix: drop `body['npcId'] == pending[:account]` from the condition, so any `success: true` answer on `login`, `mfa/verify`, `mfa/prompt` or `mfa/approve` before the desktop is exit 2. The honest capture has the desktop on the very next row (107 and 108, 278 and 279).

**R3-2 (minor): the "already held there" check is wiped by any unnamed sign-out.**
`:3864`, `:3900`, `:4086`. `prior` reads `@mfa_at`, and an unnamed sign-out clears `@mfa_at` for every PC although the server ended one session. To see it: Hana signs in honestly at `plain_pc` (named, confirmed) after row 30; the capture's own unnamed sign-outs follow; rows 95 to 98, 100 and 108 removed; a `plain_pc` desktop showing Hana after row 107; `--signin hana@plain_pc#1 --signin hana@plain_pc#2 --signin cal@plain_pc#1`: clean. With the sign-outs removed it is exit 2. Smallest fix: keep a separate set of `[pc, account]` pairs a confirmed name has placed, cleared only by a sign-out or sign-in the scanner can place at that PC or by `endedPcIds`; use it for `prior`. It errs towards exit 2.

**R3-3 (minor): any 200 row on the container path counts as the desktop.**
`:3883`, `:3895`. The method is not read, and `relay: true` on the session is not refused. A POST to `container/plain_pc?via=relay` confirmed a name. The server sends neither shape. Smallest fix: require `info[:method] == 'GET'` and `!session['relay']`; any other row on that path while a name waits is exit 2.

**R3-4 (minor): the `--logout` confirmation is looser than the `--signin` one in one direction and stricter in the other.**
`:3929` to `:3946`, `:4146`. (a) A wrong name stands when the account's session at the named PC is replaced by another account before any answer lists that PC: the listing shows somebody else, which is read as "signed out there", and the session at the PC the sign-out was really at stays credited. (b) An honest name is refused when the same account signs in again at that PC before any listing: real capture rows 1 to 46 with `--logout hana@code_pc2#1` exit 2 saying "the sign-out was not at code_pc2", which is false (row 40 is that sign-out; rows 43 to 46 are her next sign-in there). Neither matters to the written playtest, which needs no logout name. Smallest fix: an in-shape `mfaRequired` answer for that PC and account confirms the name (the server asks for the step only when the account holds no session there); any other sign-in success or pass that could be at that PC while the name waits is exit 2 saying it cannot be confirmed.

**R3-5 (minor): a desktop row showing a keyboard session at a step PC for an account that never passed the step in the run is not reported.**
`:3805`. This is the open half of R2-L3. A server that set the session at the first step would show it here and in the bootstrap `sessions`; the bootstrap is judged, the desktop is not. The full rule needs every sign-out placed, but this part does not: on a 200 `GET container/<pc>` whose `session` is `via: password` and not `remote`, report `mfa:session:<account>` when the PC owes that account a step and no pass answer for that account at that PC has been seen at any earlier row. "Ever passed" is not undone by a sign-out, so the honest row 91 stays clean. Can be recorded instead.

**R3-6 (minor): the validator does not refuse what the scanner will always report (R2-L7's second half).**
`scripts/validate_mfa.rb`, in `check_mfa`. Exact lines to add when it is next touched:
- In a scenario that authors a `code_device`, for each `code` key anywhere in the scenario whose value is not text or a whole number, or holds six digits in a row once spaces, tabs and hyphens are removed: ERROR `mfa: "code" at <path> looks like a second-step code (six digits) in a scenario with a code_device: the leak check reports it on every answer that carries it. Rename the key or change the value.`
- In a scenario where a policy has `"mfa": "push_number_match"`, for each `numbers` key anywhere: ERROR `mfa: "numbers" at <path>: the leak check reads this key as the number-matching choices and reports it. Rename the key.`

**R3-7 (minor): the command line's own text is behind the rule.**
`access-leak-check.rb:19` to `:21` still say "where no such answer follows, the name stands", which is now true only of the privilege rules; lines 28 to 31 say the opposite for a second-step scenario. The `usage` string (`:75`) and the "Exit status" line (`:70`) do not mention the `login` tag refusal or an unconfirmed name. The scanner's rule list (`access_leak_scanner.rb:3498` to `:3501`) says a name "that a later answer refutes" exits 2 and does not state that it must be confirmed. Smallest fix: one clause in each place.

**R3-8 (minor): `#n` is counted differently by the two rule sets.**
`:3818` against `:2981`. The second-step count rises on a `success: true` answer on the loose route or at any status; the privilege count does not. In a scenario with both an administrator account and a second step, one stray `/login.json` success would make `#n` name two different rows. No browser sends such a row and no shipped scenario has both. Record, or count only strict 200 rows in both.

## Part B: the feature since round 2

### State of the round 2 findings

| Finding | State | Note |
|---|---|---|
| R2-1 | fixed | `mfa-client.js:231`: a 403 on approve is `no_phone` only when the body's `error` is `no such phone` (the text the controller sends, `games_controller.rb:1626`, `:1649`). Both panes pass `result.body.reason` to `signInErrorMessage`. Tested. |
| R2-2 | fixed for a pending step | `noteRequired` keeps the route (`foothold:<id>`, `from:<pc>` or none) and `resumeSecondStep` ignores a record from another route (`password-minigame.js:3166`). The two ends build the route from the same fields (`pc-sessions.js:664`; `password-minigame.js:2569`, `:2764`). Nothing is stranded: the screen falls to the password pane, and the next first step replaces the record in the browser and on the server. After a reload the browser holds no record at all, so no route is compared. A completed step is still keyed by PC alone: R3-9. |
| R2-3 to R2-5 | fixed | `PLAYTEST.md` rewritten; F1 to F11 of the browser playtest are answered (F9 in part, R3-11). |
| R2-6 | fixed, three lines behind again | R3-12. |
| R2-7 | fixed | The phone closes on `locked_out` or `gone`. The line the sign-in screen then shows is the timed-out one: R3-10. |
| R2-8 | fixed | "Note this number before you open the phone." shows only when a number is on screen and the player holds the owner's phone (`password-minigame.js:3014`). |
| R2-9 | comments fixed | No answer fixture is shared by a controller test and the Node flow test; still open, acceptable. |
| R2-10 | fixed | Information lines list "the owner approves (pestered or always)" and only a holdable device; a two-digit PC id or username under number matching is an error (`validate_mfa.rb:167` to `:176`), which is the whole range of an issued number (10 to 99); `mfa_reenrolled?` is private. |
| R1-S4, R1-S13, R1-S14 | open, acceptable | As round 2 judged. |

### Findings, Part B

**R3-9 (minor): a completed step is taken by the next sign-in screen for that PC whatever its route.**
`mfa-client.js:171`, `password-minigame.js:3144`. `completedBySubject` is keyed by `pc:<id>` with no route, so an approval tapped for a step begun over a foothold, with that screen closed, signs in the keyboard screen when it next opens. The session on the server is the one its stored route gives. Not played by clicks. Smallest fix: keep the pending record's `route` on the completed body and have `resumeSecondStep` leave a record from another route for its own screen. Can be recorded under owner question 5.

**R3-10 (minor): after the phone closes on a lockout the sign-in screen says the sign-in timed out.**
`password-minigame.js:3156` to `:3160`. The pending record is gone and `mfaPhoneOpened` is set, so the pane shows "That sign-in timed out. Sign in again." for `locked_out` as for `gone`. Round 2 named this line as part of R2-7. Not reachable by clicks today (a tap on the phone does not count towards the lockout). Smallest fix: have the phone hand back the reason in its result and show the lockout screen for `locked_out`.

**R3-11 (minor): four statements in `PLAYTEST.md` are not true of the game.**
- `:70` "A code not yet used at Ledger passes: this is the first use there." A code's use is kept per account, not per PC (`mfa_access.rb:70` to `:74`; `mfa_sign_in.rb:87` to `:91`). If beat 4 step 1 falls in the same 60 second window as beat 3's pass, the device reads used and the code is refused. Say: wait for the device to show a new code before step 1.
- `:71` "all within the same minute". The window is the wall-clock minute (`now / 60`), not 60 seconds from the first use. Say: start step 2 as soon as the device shows a new code.
- `:12` "lockout after the fifth wrong code". The fifth wrong code ends the step; it is not a lockout (the PC's lockout here is at `maxAttempts` 8). Say "the step ending after the fifth wrong code".
- `:9` a reload keeps "inventory and pending steps". Only the server's record is kept; the browser resumes no pane, as `:125` says. Also nothing warns that a pending step dies after five minutes, which beats 2 to 3, 5, 8 to 9 and 14 to 15 rely on.

**R3-12 (minor): A22 in `docs/ACCESS_AND_NETWORKS.md` is behind `f4ea81d6c`.**
- `:754` quotes `(MFA plan S8b)`; the validator writes `(MFA plan stage S8b)` (`validate_mfa.rb:55`).
- `:796` the list of errors lacks the two-digit PC id or username under number matching.
- `:798` the information line lacks "the owner approves" and does not say only a holdable device is listed.
- `:802` says nothing of `--signin` names or the confirmation rule; one sentence pointing at the header of `access-leak-check.rb` is enough.

**R3-13 (minor): the leak check line in `PLAYTEST.md` gives no expected result.**
`PLAYTEST.md:32` to `:35`. Add: exit 0 with the two names; exit 2 naming the entry when a name is wrong or the capture stops before the desktop row; give the names only once their rows are in the files.

## For the owner

Design questions (from rounds 1 and 2; none blocks landing):

1. **Code policy with no device.** The account signs in on the password alone and the validator makes it an error. Should the server refuse instead?
2. **A step nobody can pass.** Validator error when no other route is listed, or a warning as now?
3. **A wrong number ends the attempt.** The pane now tells the player to note the number first. Is one try intended?
4. **Approve before any request** (R1-S4). Intended, or should the phone list a request only after one is sent?
5. **One step per PC.** The browser now keeps the route for a pending step but not for a completed one (R3-9), and the server keys by PC alone. Enough? Is the subject key `"<kind>:<id>"` the shape S8c wants?
6. **Log rows.** `signin_fail` beside `mfa_code_wrong`; `mfa_prompt_sent` for a push nobody receives; one `mfa_prompt_denied` for a deny and a wrong number. Wanted as they are?
7. **"Use a different account"** tells the server nothing, and a wrong password typed while a step is pending does not drop the record. Leave both?
8. **The held phone on its own** opens Friendface; requests show only from the sign-in screen. Is that the design?
9. **Wrong codes and `maxAttempts`.** With `maxAttempts` at 5 or below the lockout comes before the step's own five tries. Should the test scenario have one such PC? Is "Sign in again" the right cost after five wrong codes?
10. **A knock-out the browser does not report.** The owner keeps approving until the record reaches the server. Enough for a `pestered` owner?
11. **Loose owned phones.** Is the relaxed pickup rule meant for phones as well as the code device?
12. **The recorder.** Should it write the PC of the request on `login`, `mfa/*`, `logout` and `lock_session` rows? It is the one change that takes the tester's word, and the desktop-row rule, out of the leak check.

Recorded limits of the leak check:

- A `--signin` name stands on the first desktop row after the sign-in. A sign-in whose desktop never opened cannot be named, and a capture that lost that row can be read wrongly (R3-1 to R3-3 narrow this).
- A `--logout` name stands on a later listing of that PC (R3-4).
- A desktop's own `session` is not judged (R3-5).
- A pass answer's own word that the code or number was right is trusted; the typed code is not in the capture.
- An owner approval is not checked against the prompt count or against the owner being knocked out.
- A step that ran out with no answer saying so, or was closed by five wrong codes, stays open in the scanner; times are not checked.
- A cancel, expiry or lockout closes every open step of that kind, where the server closes one; a pass on another afterwards is an honest finding.
- Two open steps of one account make an honest pass a finding (R1-L13).
- A token's or invite's exemption, and the session a token earns (R2-L8), rest on the answer's own word and the registry, not on proof the run held the token. A claim is exempt everywhere in a scenario that authors any `borrow_session`.
- The host label of a remote sign-in answer is the answer's own word for the PC.
- The right `number` in a hash with no `mfa` or `mfaRequired` key, on a route outside sign-in, is not reported.
- An unparsed `bodyText` or a `dom` page is not read by the key rules.
- A session carried in from before the first capture file is reported; give every capture file of the game.
- A scenario with a code device that authors a six-digit `code`, or a number-matching scenario that authors `numbers`, gets a finding that cannot be cleared until the validator refuses it (R3-6).
- A capture holding a `login` tag is refused until the recorder writes one.

Recorded limits of the feature:

- No answer fixture is shared by a controller test and the Node flow test (R2-9).
- Tests still missing from R1-S13: approve before any prompt, the wider no-exposure reads, the technique route.
- `test_ops_mfa` validates with 13 warnings and uses the placeholder device sprite (R1-S14).
