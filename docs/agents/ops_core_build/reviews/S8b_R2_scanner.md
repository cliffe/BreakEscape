# S8b review, round 2: leak scanner

Scope: `tools/playtest/lib/helpdesk_leak_rules.rb`, its hooks in `tools/playtest/lib/access_leak_scanner.rb`, the
`access_leak_scanner_helpdesk*` test files and `test/fixtures/files/ops_helpdesk_browser_keyring_rows.jsonl`, at head
`65b993fe1`. Fix commits reviewed as new code: `530ff7a22` (seen by no reviewer before), `47a36a94f`, `65b993fe1`. Review
only; no code was changed.

How the evidence was made: scratch tests outside the repository, in
`/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8b-r2-scanner/`
(`r2_real_probe_test.rb`, `r2_fail_probe_test.rb`, `r2_tamper_probe_test.rb`), each run as
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <file> -n /test_<letter>/`. Probes A1, A2 and C1 play the real
`test_ops_helpdesk` scenario through the real routes (helpers of `ops_helpdesk_scenario_test.rb`) and scan the answers the
server gave. Probes B0 to B4 start from committed fixtures and the first playtest's capture
(`/data/tmp/scratch/s8b-playtest/responses-163.jsonl`). Round 1's own probes
(`scratchpad/s8b-r1/scanner2_probe_test.rb`) were run again at this head.

Counts: 0 blocker, 1 major, 6 minor.

## Round 1 findings

| Finding | State | Evidence |
| --- | --- | --- |
| R1-SCANNER1 (major) honest own approval reported after another step ended | closed | Round 1 probe F1 re-run on real routes: 0 findings (was 1). F2: 0. `hd_note_own_close` (`helpdesk_leak_rules.rb:608-622`) now closes the PC `mfa_pass_pc` names, or the steps of the route's kind; the `endedPcIds` branch is gone (no server code deletes a pending step for an ended PC: `grep mfa_pending app/models/break_escape/*.rb` shows no delete outside the pass, cancel and expiry paths and `drop_pending_second_steps!`). |
| R1-SCANNER2 (major) owner approval for a re-enrolled account clean after an expiry row | closed | Round 1 probe G1 re-run: gap rows now 1 finding, `helpdesk_secret helpdesk:own:pass line 24` (was 0). `:598` asks `hd_reenrolled?`, no step record. |
| R1-SCANNER3 (major) session rules off when only a re-enrolment creates a step | closed | Round 1 probe G2 re-run: edited scenario 2 findings (`mfa_session mfa:session:vera` lines 3 and 4; was 0), honest run 0. Probe B4 below shows the write only adds findings. |
| R1-SCANNER4 (minor) answer below its question id | closed | Test `R1-SCANNER4` passes; `hd_recovery_below?` read (`:214`, `:264`). A number is still not caught, see R2-SCANNER5. |
| R1-SCANNER5 (minor) old phone list with a second query parameter | closed for the probe given; one form still open | `npc_id=hana&x=1` now reports. The owner named twice does not: R2-SCANNER4. |
| R1-SCANNER6 (minor) test name claims more than it checks | not closed as written | A new test in the R1b file checks the hold with a real `session` hash. The old test (`access_leak_scanner_helpdesk_r1_test.rb:134-140`) is unchanged: same name, same empty desktop body. R2-SCANNER7. |
| R1-SCANNER7 (minor) header count of touched places | closed | `git diff e9114090c..HEAD --stat -- tools/playtest/lib/access_leak_scanner.rb`: 7 insertions, 2 deletions (five added lines, two rules given a clause); header `:7-9` and `:62-64` both say seven and list seven. Other header text is now untrue: R2-SCANNER5. |
| R1-SCANNER8 (minor) reset password as a hash key | closed | Test `R1-SCANNER8` passes; the reported path is `<key>`, never the password. |

## Is 530ff7a22 a proof-tied fix or a loosening?

Proof-tied, and still too narrow for one honest answer (R2-SCANNER1). Nothing unearned passes through it.

Server (`app/models/break_escape/credential_keyring.rb:116-126`, `:531-542`): the helpdesk entry
(`helpdesk_access.rb:112-129`) is appended to the keyring, then `keyring_scope_to_pc` merges `forThisPc` and `accepted` into
every entry, but only when `keyring_pc_openable?(pc_id, route)` (`:345-358`). For a password entry `forThisPc` is always
`true` and `accepted` is always `true` (`credential_model.rb:113-114`). So the two keys are fixed booleans; they carry
nothing. The scanner allows them only with exactly one `pc_id` that is a sign-in PC, with exactly those two values, and
every earlier condition (credited grant for that account, earlier in the capture, exact entry) still stands
(`helpdesk_leak_rules.rb:471-483`).

Probe B0, the first playtest's 156 rows with the scanner alone: 0 findings (the check had 8 `helpdesk_secret`). Scoped rows
carrying `tess.reset`: 41, 66, 75, 111. With both of Tess's grant rows removed: 16 helpdesk findings on lines 34, 40, 64,
67, 73, 82, 109, 114, so every keyring pass in that capture hangs on the grant.

Probe B1, the two fixture rows with one change each (owners reported):

```
control (unchanged)                               0
no grant                                          helpdesk:keyring:tess, helpdesk:reset:tess
grant for ugo only (ugo's own password)           helpdesk:keyring:tess, helpdesk:reset:tess
second-step grant for wim only                    helpdesk:keyring:tess, helpdesk:reset:tess
grant after the keyring row                       helpdesk:keyring:tess, helpdesk:reset:tess
grant inside a desk stop (uncredited)             helpdesk:grant:password, helpdesk:reset:tess, helpdesk:keyring:tess
grant names ugo, password is tess's               helpdesk:grant:password, helpdesk:reset:tess, helpdesk:keyring:tess
keyring row a POST / status 201 / keyring.json    helpdesk:keyring:tess, helpdesk:reset:tess (each)
pc_id the audit terminal / pc_id[]=records_pc     helpdesk:keyring:tess, helpdesk:reset:tess (each)
forThisPc holds the password / is 1               helpdesk:keyring:tess, helpdesk:reset:tess (each)
accepted holds a hash with the password           helpdesk:keyring:tess, helpdesk:reset:tess
the saved-connection entry carries the password   helpdesk:reset:tess
a second entry ugo.reset with tess's password     helpdesk:keyring:ugo, helpdesk:reset:tess
ugo's reset password in the tess entry            helpdesk:keyring:tess, helpdesk:reset:ugo
the password also in captures                     capture:x, helpdesk:reset:tess
entries nested one level down                     helpdesk:reset:tess
label changed                                     helpdesk:keyring:tess, helpdesk:reset:tess
```

No leaking server passed. The commit's "3 tests" is true (3 runs in `AccessLeakScannerHelpdeskBrowserTest`).

## New findings

### R2-SCANNER1 (major): an honest `pc_id` keyring answer is still reported when the server leaves the scope keys out

`helpdesk_leak_rules.rb:458-475` against `credential_keyring.rb:124` and `:345-358`.

The scanner asks for the two scope keys whenever the query names a sign-in PC. The server adds them only when that PC's
screen is openable: a `from` route that is refused (no session at the source, a locked source session, no reach), a
`foothold` that does not reach, or a keyboard screen for an unreachable PC gives the plain entry. The capture cannot show
which, so the honest plain entry is a finding.

Probe A1, real routes, shipped `test_ops_helpdesk`, no row edited, each scanned as `[Tess's grant, this row]`:

```
keyboard, room open                  pc_id=records_pc                 scoped (true, true)   0 findings
from front_pc, no session there      from=front_pc&pc_id=records_pc   NOT scoped            2 findings
                                     helpdesk_secret helpdesk:keyring:tess $.entries[1], helpdesk:reset:tess $.entries[1].password
relay                                pc_id=records_pc&relay=1         scoped                0
unknown pc / audit terminal          pc_id=ghost_pc, audit_log_pc     not scoped            0
from front_pc, signed in there       from=front_pc&pc_id=records_pc   scoped                0
keyboard, records room locked        pc_id=records_pc                 scoped                0
```

The client sends `pc_id` with `from` (`public/break_escape/js/api-client.js:293-299`). I did not click a browser path that
produces the refused-route row; the server answer itself is proved. A source session that ends or locks while the remote
sign-in screen is open is the likely way.

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, `hd_reset_entry_ok?`: when `scope` is not nil, accept EITHER the exact
plain key set (`HD_KEYRING_RESET_KEYS`, no scope key at all) OR the full set with `forThisPc == true` and
`accepted == scope[:accepts]`. One scope key alone, a third key or a wrong value stays a finding. This allows nothing new:
the plain entry is what the same credited grant already allows with no `pc_id`. Correct the comment at `:455-457` (it says
the server scopes every such answer). Add the A1 row (`from=front_pc&pc_id=records_pc`, plain entry) to
`ops_helpdesk_browser_keyring_rows.jsonl` or build it in `access_leak_scanner_helpdesk_browser_test.rb` and assert it
clean, with "no grant before it" still reported for it.

### R2-SCANNER2 (minor, narrow precondition): after a password grant the wrong-code count is not cleared, so a lock answer is credited that the server cannot give, and the honest one is reported

`helpdesk_leak_rules.rb:417-420` (`hd_drop_steps`) against `app/models/break_escape/helpdesk_access.rb:243-248`, and
`access_leak_scanner.rb:1729-1742`, `:4133-4144`.

A first password grant deletes the account's `loginFailures` (wrong codes count there) as well as its pending steps. The
scanner drops the pending steps and keeps `@mfa_wrong`.

Probe C1, real routes (scenario with `vera.creds.resetPassword` and `policies.vault.maxAttempts: 8` added): two wrong codes,
then `loginFailures` is `{"vault_pc|v.holt": {"n": 2}}`; after Vera's password grant it is `{}` and `mfaPending` is empty.

Probe B3, the S8a lockout fixture (`ops_mfa_verify_lockout_rows.jsonl`, `maxAttempts` 8) over the grafted scenario of the
R1 tests, with a `Game`:

```
control, rows 54-63 (8 wrong codes, lock on the 8th)                         0 findings
control, rows 60-63 alone (2 wrong codes, then the lock)                     lockout_list lockedOut line 4
rows 54-59, credited grant for hana, rows 60-63 (server count by then: 2)    0 findings      <- credited, cannot happen
rows 54-59, credited grant for hana, rows 54-63 (server count by then: 8)    lockout_list lockedOut line 17   <- honest, reported
```

Needs an account with a reset password and a code step at a PC with `maxAttempts`; `test_ops_helpdesk` has none. Round 1
missed it; the "password grant drops pending steps" fix models half of what the grant does.

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, `hd_drop_steps`: also
`@mfa_wrong.delete_if { |(_pc, npc), _n| accounts.include?(npc) }` and
`@mfa_wrong_unknown.delete_if { |(_pc, npc)| accounts.include?(npc) }`, under the first-grant condition of R2-SCANNER3. Name
this third write in the header (`:10-12`). Add the two B3 grant rows as tests (first reported, second clean) beside the
other drop tests in `access_leak_scanner_helpdesk_r1b_test.rb`, with a `Game` as `access_leak_scanner_mfa_lockout_test.rb`
builds one.

### R2-SCANNER3 (minor, narrow precondition): a REPEAT password grant drops steps in the scanner that the server keeps

`helpdesk_leak_rules.rb:404-408`, `:415-416` against `helpdesk_access.rb:235-238`.

`grant_helpdesk!` answers a repeat grant before it reaches `drop_pending_second_steps!`. The scanner calls `hd_drop_steps`
on every credited password grant. The comment "A password grant drops the account's pending second steps on the server" is
false for a repeat.

Probe A2, real routes (scenario with `wim.creds.resetPassword` added, nothing else): password grant, second-step grant,
sign-in at `ops_pc` (`ownPhone: true`), own list, the same password ask again, own approval.

```
repeat grant: 200 {"granted":true,"what":"password","lockoutPcIds":[],"npcId":"wim","deskId":"it_desk"}
              server mfaPending still holds ops_pc (kind push, npcId wim)
approve:      200 {"success":true,"npcId":"wim","approvedBy":"own_phone"}
scanner, whole honest run:               1 finding  mfa_session mfa:session:wim line 6 at $
control, same run without the repeat:    0 findings
```

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, `hd_note_request`: drop only for accounts not yet in `@hd_earned_pw`
(`fresh = earned[:accounts].reject { |id| @hd_earned_pw.include?(id) }`, then merge, then `hd_drop_steps(fresh)`). Correct
the comment. Add A2's rows as a test (clean), keeping the existing "pass after a grant with no new step" test (reported).

### R2-SCANNER4 (minor): the old phone's list passes when the query names the owner twice

`helpdesk_leak_rules.rb:676-681`: `hd_query_value` takes the FIRST value of a name; Rails takes the last. Probe B2, after
`grant_mfa` for hana, `GET mfa/phone` 200 with a `requests` list:

```
npc_id=hana                 helpdesk_secret helpdesk:old:phone
npc_id=nia&npc_id=hana      0 findings      (Rails reads hana)
npc_id=hana&npc_id=nia      helpdesk:old:phone
```

Fix, in `hd_judge_old_forms`: judge every value of the name (report when ANY `npc_id` value is a re-enrolled account, and
when any `item_id` value is a device whose owner is one). Add the three queries to the `R1-SCANNER5` test.

### R2-SCANNER5 (minor): header statements that are untrue or incomplete

`helpdesk_leak_rules.rb:7-64`.

- `:18` "no existing rule is touched": two existing rules were given a clause (`mfa_kind_at`, `mfa_pass_pc`; the same header
  says so at `:9` and `:63`) and this file writes `@mfa_active` and `@mfa_pending`.
- `:27-29`: the keyring entry is described without the two scope keys or the condition they need.
- `:32-33` "a pass for it while its own-phone step is open other than `approvedBy: own_phone`": since `47a36a94f` the rule
  no longer asks for an open step (`:598`).
- `:13-14`: the list of reused helpers omits `mfa_pass_pc`, `mfa_row_pc_tag`, `mfa_route_name`, `mfa_npc` and the state it
  reads (`@mfa_devices`, `@mfa_taken`, `@mfa_code_possible`).
- Limits: (1) and (8) say the same thing, as do (3) and the second half of (7), and (5) and (6) overlap. Missing: a
  recovery answer served as a JSON number is not caught (the R1b test asserts `{"staff_no": {"value": 40612}}` clean); a
  repeat grant and the lock count (R2-SCANNER2, R2-SCANNER3) until fixed; the scanner cannot tell whether a `pc_id` screen
  was openable (R2-SCANNER1's fix accepts both honest forms).

Fix: correct those passages in the header; no rule change.

### R2-SCANNER6 (minor): two commit messages do not match their diffs

`git show 530ff7a22 -- tools/playtest/lib/helpdesk_leak_rules.rb` carries, besides the scope keys, the whole rule change for
R1-SCANNER1, R1-SCANNER2, R1-SCANNER3 and `hd_drop_steps`; its message names only the scope keys. `47a36a94f`, whose message
claims those four changes, changes one line of the rules file (`MFA_PUSH_KINDS` qualified as
`AccessLeakScanner::MFA_PUSH_KINDS`) and adds the tests. Read, not run: at `530ff7a22` the unqualified constant inside
`module HelpdeskLeakRules` would raise `NameError` on any cancelled, expired or locked-out step row. The head is correct.

Fix: do not rewrite history. Add one line to the handon note's round 1 section saying which commit holds which change, so
a later bisect is not misled.

### R2-SCANNER7 (minor): R1-SCANNER6's test is unchanged

`test/controllers/break_escape/access_leak_scanner_helpdesk_r1_test.rb:134-140`, "R1-L4: the honest own-phone approval is
clean and holds the session", still scans a desktop body of `{ "contents": [] }`, which the session rule skips. Fix: drop
the `later` half and the words "and holds the session" from that test (the R1b test `R1-SCANNER6` now pins the hold), or
give its row the `session` hash.

## Checked and found sound

- **Own-step close.** Runs before `scan_mfa` on the same row, so `mfa_pass_pc` still sees the open step; the close is applied
  before the next row. An `ownPhone` answer the helpdesk file allows is also one `mfa_required_answer_ok?` accepts (same
  call on the stripped body), so the two records open together.
- **`@mfa_active` from the helpdesk file.** Probe B4: eight captures in the R1b `reenrol_only_scenario`, and the real helpdesk
  capture with round 1's G2 scenario, each scanned with the write and with it undone (a scanner subclass restoring
  `@mfa_active` after `helpdesk_begin_scan`). In every case `lost=[]`; the write only gained `mfa_session` findings. Outside
  the second-step rules `@mfa_active` is read nowhere, and only `mfa_verify_lockout_proved?` reads their state
  (`access_leak_scanner.rb:1733-1741`).
- **`@mfa_pending` drops.** Its readers are `mfa_pass_pc`, the phone-entry check (`:3705`), the wrong-code count (`:4137`) and
  the lock proof (`:1733`). The first two only lose allowances. The last two can gain one (two open code steps becoming
  one), which is true to the server for a first grant; the comment "dropping only ever takes allowances away" (`:416`) is
  not strictly true and R2-SCANNER2 is where it bites.
- **Always-a-finding rule.** Any status, strict or loose route; the only pass left for a re-enrolled account on a push route
  is `approvedBy: own_phone`, which `mfa_pass_pc` still has to prove (query exactly `own=1`, open own step, own list, grant).
- **Real-capture tests.** `bin/rails test test/unit/access_leak_scanner*.rb test/controllers/break_escape/access_leak_scanner*_test.rb -v`:
  465 runs, 4726 assertions, 0 failures, 0 errors, 0 skips. Ran and passed: S5a `AccessLeakScannerPrivilegeRealTest` 57
  (including "the real captures still give 0 findings with the five named entries, 38 with sign-ins only, 112 with nothing
  named"), S7 `AccessLeakScannerOpsRealTest` 22, `OpsAccessRealTest` 10, `OpsSkinRealTest` 2, S8a `MfaRealTest` 11,
  `MfaFixTest` 20, `MfaLockoutTest` 7, S8b `HelpdeskRealTest` 21, `HelpdeskBrowserTest` 3, `HelpdeskTest` 24 (the R1 and
  R1b classes run inside the 465).
- **Real capture drift.** `ops_helpdesk_scenario_test.rb` (which fails on drift from the committed capture): 22 runs, 0
  failures after the server fixes, so the handon's open note "capture not regenerated" needs no action. The capture has no
  `pc_id` keyring row; only the two browser rows cover the scoped entry.

## For the owner

1. R2-SCANNER2's fix is a third write from the helpdesk file into the second-step rules' state (`@mfa_wrong`,
   `@mfa_wrong_unknown`), and it removes entries, which can let a later lock answer be credited. It matches the server
   (probe C1). Say whether that write may live in the helpdesk file, as round 1's owner item 2 asked for `@mfa_active`.
2. Round 1's owner item 1 (the stop rule depends on playtest order) is still open; the header now states it as limit (8).

not clean
