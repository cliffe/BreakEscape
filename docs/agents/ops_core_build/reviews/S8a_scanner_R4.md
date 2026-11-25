# S8a review, leak scanner, round 4 (the round 3 fix pass only)

Scope: `git diff 47415e71c..HEAD -- tools/playtest/ test/ scripts/` on `ops-mfa` at `102e09098`: the scanner commits `04c89612b` (R3-1, R3-2, R3-3, R3-5, R3-7) and `102e09098` (two older scanner tests), and the validator lines of `3094bb5e2` (R3-6). The second-step section of `tools/playtest/lib/access_leak_scanner.rb` (lines 3464 to 4185) was read whole. Nothing was fixed in this round.

Result: 0 blockers, 1 major, 4 minor.

**Can land: no, after fixing R4-L1.** R4-L1 is one line and a test. R4-L2 to R4-L5 can be recorded.

## How it was checked

- Tests under the lock, in one run: the seven scanner unit files, the seven scanner controller files, `ops_mfa_scenario_test.rb` and `mfa_verify_run_test.rb`: 397 runs, 3750 assertions, 0 failures, 0 errors, 0 skips.
- `access_leak_scanner_mfa_r3_test.rb` alone under the lock: 4 runs, 20 assertions, 0 failures, 0 errors, 0 skips.
- The same test file pointed at the scanner of `47415e71c` (a copy outside the repo): 4 runs, 4 failures (each at its first assertion).
- `validator-mfa.test.mjs` on Node 22: passes.
- Doctored copies of the game 86 capture, scanned with the scanner of `HEAD` and of `47415e71c` through `bin/rails runner` (no test database). Scratch files, outside the repo, in `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/r4/`: `r4_probe_runner.rb`, `r4_probe2.rb`.
- Real server answers, recorded in the browser capture's shape (no `login` tag) by a scratch integration test under the lock and then scanned: `r4_real_probe_test.rb` in the same folder. This is what shows R4-L1 and R4-L2 on honest play.
- The server was read for what a desktop answer shows: `games_controller.rb:3456` (`session: @game.session_for_client(pc['id'])`), `game.rb:3984` to `:3996` (`session_for_client`), `game.rb:4729` to `:4768` (`start_login_session!`), `game.rb:4780` to `:4812` (`login_session_answer`), `mfa_sign_in.rb:24` to `:33` (`mfa_step_for`), `network_access.rb:1607` (`settle_session_at_keyboard!`), `game.rb:3862` (`logout_session!`).

## The eight points

### 1. Do the new tests fail without the fix?

Yes, all four. A copy of the test file, with only its three paths changed (the scanner of `47415e71c`, the fixture and the scenario by absolute path), was run under the lock: 4 runs, 4 failures.

| Test | On `47415e71c` |
|---|---|
| R3-1 | "ArgumentError expected but nothing was raised" |
| R3-2 | "ArgumentError expected but nothing was raised" |
| R3-3 | "ArgumentError expected but nothing was raised" |
| R3-5 | expected `[["mfa_session", "mfa:session:hana"]]`, got `[]` |

Each stops at its first assertion, so the later assertions of each test were not seen failing by the test run. The probe runner covers them: on `47415e71c` both R3-3 captures pass (the POST and the `relay: true` one), and the R3-2 capture passes; on `HEAD` each is exit 2 (point 5).

### 2. The new test file by itself

Run alone under the lock at `102e09098`: 4 runs, 20 assertions, 0 failures, 0 errors, 0 skips.

### 3. The two edited older tests

The rows were unrealistic; the edit hides nothing in those two tests.

- The desktop answer's `session` is `session_for_client`, which passes the stored session's own `via` to `login_session_answer`. A claim is stored with `via: claim` and a technique session with `via: technique` (`start_login_session!`), and no code rewrites either to `password` (`settle_session_at_keyboard!` only drops `foothold` and `from`, and returns early for a technique session). So after a claim sign-in the desktop shows `via: claim`, and beside a bootstrap technique session the desktop shows `via: technique`. The old rows paired a claim answer, and a technique bootstrap, with a desktop showing a `password` session, which the server cannot send. The new rule was right to report them.
- `access_leak_scanner_mfa_r2_test.rb:89` and `:90`: both still use `refused`, which is `assert_raises(ArgumentError)`, so both still demand exit 2. Line 89's pattern is now an alternation; only its second half can match, because "another name was armed" (`access_leak_scanner.rb:3880`) can no longer be reached: any sign-in success while a name waits is refused one step earlier, at `:3907`. Harmless; tidy the pattern and the dead branch when the file is next touched.
- `:157` changed from "clean" to "a finding" for a desktop alone, and gained the clean case with the step rows. That is the new rule stated, not a weakening.

The case the new rule does wrongly flag is not in either edited test. It is the unlock of a locked token session, which the round 2 test (`access_leak_scanner_mfa_r2_test.rb:212`) pins without a desktop row: R4-L1.

### 4. The new R3-5 rule

Honest captures tried:

| Capture | Result |
|---|---|
| Every shipped scenario's `*_real_test` | pass (in the 397) |
| Game 86 and game 111, with the two names | clean, exit 0 |
| A passed step, a reload, the desktop, a lock, a reload, the unlock, the desktop (real answers) | clean |
| A password sign-in over the wall port with the step passed there, then the desktop at the keyboard (real answers) | clean |
| Switch user at a step PC (game 86 rows 79 to 88) | clean |
| An exempt account (`creds.mfa: false`) on a step PC's desktop (row 88 alone) | clean |
| A PC with no second step (row 279) | clean |
| A remote or relayed session on the desktop (`remote: true`, or `via: credential`) | not judged by this rule; clean |
| A desktop seen again after a sign-out elsewhere (row 91) | clean ("ever passed") |
| **A token session at a step PC, locked, unlocked with the password at the keyboard, then its desktop (real answers)** | **a finding on the desktop row: R4-L1** |
| **The same, unlocked with the password over the wall port, then the desktop opened at the keyboard (real answers)** | **a finding on the keyboard desktop row: R4-L1** |

Doctored captures it misses: R4-L3 (shapes the rule skips) and R4-L4 (an account that passed once is never judged again on a desktop).

### 5. R3-1 to R3-3

All three round 3 captures were rebuilt from game 86 as the round 3 review describes them. Each passed on `47415e71c` and is exit 2 on `HEAD`:

| Capture | `47415e71c` | `HEAD` |
|---|---|---|
| R3-1: rows 95 to 98, 100, 108 removed; row 87 (the Sync service's sign-in) and a `plain_pc` desktop showing Hana after row 107; `hana@plain_pc#1 cal@plain_pc#1` | passes | exit 2, "another sign-in or step passed ("svc_sync") before any desktop row" |
| R3-2: Hana named and confirmed at `plain_pc` after row 30, the capture's unnamed sign-outs, the same removal, a `plain_pc` desktop showing Hana after row 107; three names | passes | exit 2, "the run already held hana at plain_pc before this sign-in" |
| R3-3: the desktop row a POST to `container/plain_pc?via=relay` | passes | exit 2, "not a GET (POST)" |
| R3-3, second half: the desktop's session carries `relay: true` | passes | exit 2, "shows a relayed session" |

Closed as written. The family is narrower, not gone: R4-L5 lists four more ways to have the account shown at the named PC that the new `@mfa_placed` record does not see. The fix also has a cost on honest play: R4-L2.

### 6. The real captures

| Run | Result |
|---|---|
| Game 111, `--signin hana@code_pc1#1 --signin cal@plain_pc#1` | exit 0, "no leaks found" |
| Game 111, no names | exit 1, two `mfa_session` findings (`responses-111.jsonl:96` Hana, `:274` Cal) |
| Game 86, the two names | exit 0, "no leaks found" |
| Game 86, no names | exit 1, two `mfa_session` findings (`responses-86.jsonl:107` Hana, `:278` Cal) |

As expected.

### 7. Every scanner test file together

397 runs, 3750 assertions, 0 failures, 0 errors, 0 skips, in one run under the lock (69 seconds once it had the lock).

### 8. R3-4 and R3-8 left open

- **R3-8** (`#n` counted differently by the two rule sets): acceptable as a recorded limit. It needs a stray success on a loose `login` path, which no browser sends, in a scenario with both an administrator account and a second step, which none ships.
- **R3-4** (the `--logout` name): half (a), a wrong name that stands when another account replaces the session before any listing, is acceptable as a recorded limit. Half (b) is no longer free to leave as it was, because the R3-2 fix now leans on it: after R3-2 a named sign-out followed by a listing is the only way to pass an account that signs in twice at a PC with no step, and half (b) refuses exactly that capture unless a reload falls between. See R4-L2. It can still be recorded, but with the limit written down in the header and in `PLAYTEST.md`, since the written playtest does not do this.

### The validator lines (R3-6)

`scripts/validate_mfa.rb:119` to `:145`. They match the scanner: the `code` test is the same expression as `mfa_authored_code?` (`access_leak_scanner.rb:3703`), and the `numbers` test is on in the same case as `@mfa_numbers_possible`. The validator turns the `code` rule on for any authored `code_device`, the scanner only for one with a text `id`; that is the stricter side. Both directions are tested. No finding.

## Findings

**R4-L1 (major): the new desktop rule reports an honest unlock of a token session.**
`access_leak_scanner.rb:3824`. The rule excuses a keyboard password session at a step PC only when `@mfa_passed` holds the PC and account. The server gives one more: an account's own locked session is unlocked by the password with no step (`mfa_sign_in.rb:29`), and a token session over a foothold can be locked (`game.rb:4030` to `:4036`). The unlock is a fresh `via: password` session, so the desktop that follows shows a keyboard password session for an account that never passed a step. The sign-in rule already allows this (R2-L8, `:3981`, `:3988`); the desktop rule does not read it, so the fix pass undid R2-L8 one row later.
To see it, real server answers (scratch test, T1): plant the drop box, sign in at `code_pc1` with `hana_token`, `lock_session`, sign in with Hana's password at the keyboard, `GET container/code_pc1`; `--signin hana@code_pc1#2`. The server answers row 10 `{success: true, npcId: hana, via: password}` and row 11 a desktop whose session is `{npcId: hana, via: password}`; the scanner reports `mfa:session:hana` at row 11. On `47415e71c` the same rows are clean. The same capture built from game 86 rows 140, 141, 100, 107, 108 is clean on `47415e71c` and a finding at row 108 on `HEAD`. T2 (the unlock over the wall port, then the desktop at the keyboard, where `settle_session_at_keyboard!` drops the foothold) is a finding in the same way with no name at all (rows 10 to 12: the unlock answer and the first desktop carry `remote: true` and are clean, the keyboard desktop is reported); clean on `47415e71c`.
The written playtest does not reach it only because Hana passes a code at the Accounts PC in beat 3, before the token in beat 9. A run that uses the token without the device, which is the point of the token, and then locks, is reported as a leak that no name can clear.
Smallest fail-closed fix: in `mfa_note_signin` (`:4126`), where the row is the one unlock the sign-in judgement allowed (`pc == @mfa_unlocked_pc`) and `@mfa_row_strict`, add `[pc, npc]` to `@mfa_passed`. That is tied to the same proof the unlock already needs (a held session, a 200 `lock_session` answer, one unlock per lock) and excuses nothing else. Add the desktop row to the R2-L8 test (`access_leak_scanner_mfa_r2_test.rb:212`), and assert that the desktop is still a finding with no lock row.

**R4-L2 (minor): since R3-2, an honest account that signs in, out and in again at a PC with no step has no names that pass without a reload.**
`:3882`, `:3920`, `:3963`. To see it: game 86 rows 1 to 14, then 278, 279, 281 (the sign-out), 278, 279. With `cal@plain_pc#1 cal@plain_pc#2`: exit 2, "the run already held cal at plain_pc". With `--logout cal@plain_pc#1` added: exit 2, "the next answer that lists plain_pc's session still shows cal there, so the sign-out was not at plain_pc", which is false (R3-4 b). With no names: a finding. On `47415e71c` the two names passed. The same from real server answers (scratch test, T3): exit 2 both ways on `HEAD`. Only a reload between the sign-out and the second sign-in, with the sign-out named, passes. The new test's own passing branch (`access_leak_scanner_mfa_r3_test.rb:63`) uses `endedPcIds: ['plain_pc']`, which the server does not send for the PC signed out of (`logout_session!` returns only the onward sessions it pruned; every sign-out in both real captures has `[]`).
It fails closed, the written playtest does not do it, and round 3 asked for a rule that "errs towards exit 2", so it can be recorded. Smallest step: say so in the header of `access-leak-check.rb` and in `PLAYTEST.md` ("an account that signs in again at the same PC with no second step needs its sign-out named and a reload before the second sign-in"), and make the "already held" message say the same. A proof the capture could carry, if a loosening tied to proof is wanted: the server answers a desktop request for a PC with no session with 403 and `reason: no_session`, which could confirm a named sign-out at that PC; the browser did not ask for that desktop after any sign-out in either real capture, so it would help only where it does. The real cure is the recorder writing the PC on `logout` rows (owner question 12).

**R4-L3 (minor): the desktop rule skips shapes the server never sends, where the rest of the section reports them.**
`:3817` to `:3824`. Each of these, as the only change to a `code_pc1` desktop showing Hana with no step in the run, is clean: `remote` set to any value other than `false` or `nil` (the text `"no"`); `via` missing, or `"Password"`; `via: claim` for an account that does not own the PC (Ines), which `mfa_claim_exempt?` would refuse on a sign-in answer; `via: credential` with no `kind`; an account id the scenario does not hold; the path `container/code_pc1.json` (Rails serves it, the scanner reads the PC id as `code_pc1.json`). Smallest fail-closed fix: judge the desktop's session with the helpers the sign-in answer uses. Report unless `via` is `password` with `@mfa_passed`, or `remote == true`, or `mfa_claim_exempt?`, or `mfa_exempt_credential?`, or `via == 'technique'`; an unreadable account is `mfa:session:unknown`; strip an optional `.json` when reading the PC id. Check it against the real-answer tests before keeping it. Can be recorded.

**R4-L4 (minor, record): "ever passed" means a desktop is never judged again for an account that passed once.**
`:3824`, `:4077`. Game 86 rows 1 to 128 (Hana passed at `code_pc1` at row 29; row 128 is a first step), then a `code_pc1` desktop showing her session with no second step, `--signin hana@code_pc1#1`: clean. The same state shown by a bootstrap is a finding. In the written playtest Hana passes at the Accounts PC in beat 3, so the rule guards that PC only before then. It cannot be tightened without placing every sign-out; add the sentence to the recorded limits.

**R4-L5 (minor, record): `@mfa_placed` is written only by a confirmed name, so the R3-2 capture still passes when the earlier session came another way.**
`:3923`, `:4134`, `:4136`. All need the bypass's own desktop row to be missing, as in round 3. Each is clean on `HEAD` with the bypass named at `plain_pc`:
- the earlier session at `plain_pc` came from an answer its host label placed (`remote: true`, `host: SHP01`), then any unnamed sign-out;
- the earlier session was named and confirmed, then another account's answer labelled `plain_pc` unplaced it (`:4134`), and the desktop still shows the first account;
- the earlier sign-in lost its body, and its desktop showed the account;
- an earlier `plain_pc` desktop showed the account with no sign-in row at all.
Smallest fail-closed fix: write `@mfa_placed[pc]` wherever the scanner sees the account at the PC, that is at `:4136` (a strict sign-in placed at one PC by its label) and on every 200 GET desktop row that shows a keyboard password session; clear it only as now. It makes R4-L2 no worse (that capture is already exit 2).

## Recorded limits to add

- A desktop is judged only for a keyboard `via: password` session of a known account, and never again once that account passed a step at that PC in the run (R4-L3, R4-L4).
- An account that signs in again at the same PC with no second step, after a sign-out, cannot be named unless the sign-out is named and an answer lists that PC between (R4-L2).
- The "already held there" check knows only sessions a confirmed name placed (R4-L5).
