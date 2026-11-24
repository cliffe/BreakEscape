# S8b review, round 3: leak scanner

Reviewed: head `2b047efca` (round 2 fix `a6af605e1`, merge of main `85cc7960c`). Files: `tools/playtest/lib/helpdesk_leak_rules.rb`,
the seven hook lines in `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, the helpdesk scanner tests.
No code changed. Probes are one scratch Rails test (real routes of the shipped `test_ops_helpdesk`, and the R1b grafted
scenario), run under the test lock; it is not in the repository.

Result: no blocker, no major. Three minors.

## Round 2 findings

| Finding | State | Evidence |
|---|---|---|
| R2-SCANNER1 (major) honest plain `pc_id` entry reported | closed | `hd_reset_entry_keys_ok?` (`:491-497`): exact plain set, or exact plain + both scope keys with `forThisPc == true` and `accepted == scope[:accepts]`, the second only when `hd_keyring_scope` found one `pc_id` naming a sign-in PC. `R2-SCANNER1` tests (real routes: scoped for `pc_id=records_pc`, plain for `from=front_pc&pc_id=records_pc`, both 0; 11 tampers each reported, including no grant). Probe F below. |
| R2-SCANNER2 (minor) lock count after a grant | closed as designed, with a stated limit | No count is cleared; `hd_drop_steps` (`:435`) adds the account's counted pairs to `@mfa_wrong_unknown`. The lock the server cannot give is reported (test). The honest lock is reported too: header limit (8), pinned by `R2-SCANNER2 limit`. Probes C and D below. |
| R2-SCANNER3 (minor) repeat grant drops steps | closed | `hd_note_request` (`:416-418`) drops only for accounts not yet in `@hd_earned_pw`. Real-route test: repeat grant, server keeps `mfaPending`, own approval, 0 findings. |
| R2-SCANNER4 (minor) owner named twice | closed for `&`; the same hole is open for `;` | `hd_query_values` (`:702`) judges every value. See R3-SCANNER1. |
| R2-SCANNER5 (minor) header | closed, one sentence still too strong | Each R2 passage is corrected (`:10-24`, `:32-41`, `:52-70`). See R3-SCANNER2. |
| R2-SCANNER6 (minor) commit messages | closed | The hand-on note carries the line naming which commit holds which change. |
| R2-SCANNER7 (minor) R1-L4 test | closed | `access_leak_scanner_helpdesk_r1_test.rb:134`: the `later` half and "and holds the session" are gone. |

## The round 2 fix as new code

- **Reset entry, exact plain or exact scoped.** Probe F, real routes, Tess's grant then the keyring: the server gives no scope
  keys for `pc_id=ghost_pc` and `pc_id=audit_log_pc` and both for `pc_id=records_pc`; all three honest rows scan to 0. The real
  scoped entry under each of these queries is reported (`helpdesk:keyring:tess`, `helpdesk:reset:tess`): no query,
  `pc_id=ghost_pc`, `pc_id=audit_log_pc`, `pc_id=tess`, `pc_id=`, `pc_id[]=records_pc`, `from=front_pc`,
  `pc_id=records_pc&pc_id=records_pc`, `pc_id=records_pc;x=1`. The plain form allows nothing the grant did not already allow
  with no `pc_id`.
- **First grant marks wrong-code pairs unknown: stricter only.** `@mfa_wrong_unknown` is read in one place
  (`access_leak_scanner.rb:1795`, `return false`, a finding) and deleted in one (`:4729`, a proved pass for that pair). Adding
  to it cannot pass anything. Probe D: the S8a lockout fixture (rows 54..63) with a credited grant placed at every position of
  four layouts, 44 captures, each scanned by the scanner and by a subclass whose `hd_drop_steps` omits the mark: findings the
  mark removed 0, findings it added 2.
- **Can a tester hit limit (8)?** Not in the shipped scenario. Probe C (`pc_admits_account?` and `policy_for` over every
  account and sign-in PC): the two accounts with a reset password, Tess and Ugo, sign in only at `records_pc` (no second
  step); the one code PC, `vault_pc`, admits only Vera (no reset password) and has no `maxAttempts`. No PLAYTEST.md order
  reaches it.
- **Repeat grant, every query value.** Read and tested as the table says.

## The merge of main

- `git diff 2d9e963c8 85cc7960c -- tools/playtest/lib/access_leak_scanner.rb` is exactly the seven S8b lines (require,
  include, `helpdesk_begin_scan`, `scan_helpdesk` before `scan_mfa`, rule text, `mfa_kind_at`, `mfa_pass_pc`); nothing of S7
  is lost and nothing doubled. `helpdesk_leak_rules.rb` and every helpdesk test and fixture are byte-equal to `a6af605e1`.
  `verify-run.rb` keeps both row sets and both conditions. `note_network_swept` now receives the body `scan_helpdesk`
  returns; that body differs only on own-phone answers, never on a scan answer.
- **One capture: crack, reset, re-enrolment of one account** (probe A; shipped scenario plus a held hash record
  `wim_hash`, `wim.creds.resetPassword` and an empty `social.intelFacts`; real routes; scanned with the game). Run: take the
  record, keyring, `POST crack` (cracked), keyring, password grant, keyring, keyring `pc_id=ops_pc`, crack again,
  second-step grant, sign-in with the old password (422), sign-in with the new one (`ownPhone`), own list, own approval,
  keyring, bootstrap. The keyring holds `wim.cracked` (old password) and `wim.reset` (new password) side by side.
  Honest run: 0 findings. Reset first, then crack: 0 findings. Neither rule excuses the other's value:

  ```
  cracked entry carries the reset password            crack_unearned, helpdesk:reset:wim
  reset entry carries the cracked password            password npc:wim, helpdesk:keyring:wim
  no crack answer, the reset grant kept               password npc:wim, crack_unearned (every later keyring)
  no password grant, the crack kept                   helpdesk:keyring:wim, helpdesk:reset:wim (every later keyring)
  grant answer carries the old password               password npc:wim, helpdesk_grant
  crack answer carries the reset password             crack_answer, helpdesk:reset:wim
  reset entry after the crack, before the grant       helpdesk:keyring:wim, helpdesk:reset:wim
  cracked entry renamed wim.reset                     password npc:wim, crack_unearned, helpdesk:keyring:wim
  reset entry dressed as cracked (id wim.reset)       crack_unearned, helpdesk:keyring:wim, helpdesk:reset:wim
  wim.cracked holding the reset password              crack_unearned, helpdesk:reset:wim
  the same on the scoped keyring                      crack_unearned, helpdesk:reset:wim
  reset password inside crackFacts                    crack_key, helpdesk:reset:wim
  ```

  `password_held_for?` (`ops_cracking.rb:78-87`) does not read helpdesk entries, so a reset never counts as holding the
  account's password for the reused-password crack, on the server or in the scanner.
- **Scanner tests on the merged hash.**
  `bin/rails test test/unit/access_leak_scanner*.rb test/controllers/break_escape/access_leak_scanner*_test.rb test/controllers/break_escape/ops_crack_scanner_real_answers_test.rb test/controllers/break_escape/ops_helpdesk_scenario_test.rb -v`:
  584 runs, 6154 assertions, 0 failures, 0 errors, 0 skips. Real-capture classes that ran and passed: S5a
  `AccessLeakScannerPrivilegeRealTest` 57; S7 `AccessLeakScannerOpsRealTest` 22, `OpsAccessRealTest` 10, `OpsSkinRealTest` 2,
  `OpsCrackScannerRealAnswersTest` 1 (the whole-run capture: 0 findings, then its nine mutations each reported); S8a
  `MfaRealTest` 11, `MfaFixTest` 20, `MfaLockoutTest` 7, `MfaR2Test` 14, `MfaR3Test` 4; S8b `HelpdeskRealTest` 21,
  `HelpdeskBrowserTest` 3, `HelpdeskTest` 24, `R1Test` 18, `R1bTest` 15, `R2RealTest` 3, `R2Test` 5. The crack unit tests
  (25, 20, 11), `FactTest` 17, `NetSweepLogTest` 5 and `OpsHelpdeskScenarioTest` 22 (fails on drift from the committed
  capture) passed too.

## New findings

### R3-SCANNER1 (minor): the old phone's list still passes when the query separates with `;`

`helpdesk_leak_rules.rb:702-706` (`hd_query_values`). `URI.decode_www_form` splits on `&` only; Rack 2.2.23 (`Gemfile.lock`)
splits on `&` and `;`.

Probe B, real route, Vera's phone held: `GET mfa/phone?npc_id=nobody` is 403; `GET mfa/phone?npc_id=nobody;npc_id=vera` is
200 `{"requests":[]}` (Rails read `vera`). Probe E, the R2-SCANNER4 test's rows (grant for hana, then a 200 list):

```
npc_id=hana                  helpdesk:old:phone
npc_id=nia;npc_id=hana       0 findings, from any rule
x=1;npc_id=hana              0 findings, from any rule
x=1;item_id=hana_device      no helpdesk:old:code (the S8a rule mfa_secret still reports this row)
```

Minor: the client never sends `;`, and the row needs a server that serves the old list to begin with. The strict uses of a
query are not affected (`pc_id=records_pc;x=1` with scope keys is reported; an own list under `x=1;own=1` with no grant is
reported).

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, `hd_query_values`: split the query as Rack does
(`query.split(/[&;] */n)`, then `URI.decode_www_form_component` on each side of the first `=`) and collect every value of
the name. Add `npc_id=nia;npc_id=hana`, `x=1;npc_id=hana` and `x=1;item_id=hana_device` to the two `R2-SCANNER4` tests in
`test/controllers/break_escape/access_leak_scanner_helpdesk_r2_test.rb`.

### R3-SCANNER2 (minor): header limit (8) says more than the code does, and two limits are not listed

`helpdesk_leak_rules.rb:67-70`. Limit (8) says the lock answer "is reported even when honest". The mark is removed by a
proved pass for that pair (`access_leak_scanner.rb:4728-4729`), after which a lock for it is credited again; the comment at
`:426-431` says so, the header does not. Not listed: an UNCREDITED 200 grant (an honest one inside a stop, limit 1) neither
drops steps nor marks pairs (`:415-419`; read, not run; that row is already a `helpdesk_grant` finding); and the `;` query
until R3-SCANNER1 is fixed.

Fix, in the header of `tools/playtest/lib/helpdesk_leak_rules.rb`: add "until a pass answer for that pair" to (8) and add
the uncredited-grant sentence to (1). No rule change.

### R3-SCANNER3 (minor): two proved behaviours have no test

- A scoped reset entry under a query that names no sign-in PC (`pc_id=ghost_pc`, `pc_id=audit_log_pc`, `pc_id` twice) is
  reported (probe F), but the `R2-SCANNER1` tamper list only edits the entry, never the query.
- No test holds a cracked entry and a reset entry for one account, so a later change to either rule set could let one
  excuse the other unseen.

Fix, in `test/controllers/break_escape/access_leak_scanner_helpdesk_r2_test.rb`: add the three queries to the `R2-SCANNER1`
"third shape" test (copy the real scoped row, replace `query`); add one real-route test in `AccessLeakScannerHelpdeskR2RealTest`
built as probe A (scenario override adding the `wim_hash` record, its takeable file, `resetPassword` and an empty
`social.intelFacts`; scan with `game: Game.find(@game.id)`), asserting the honest run clean and the first two rows of the
table above reported.

## Recorded limits (land as known)

1. A desk stop stops credit for every grant for five minutes, so the scripted run plays refusals last (header limit 1).
2. An honest lock answer for an account that had wrong codes before its first password grant is reported, until a pass for
   that pair (limit 8; pinned; not reachable in `test_ops_helpdesk`).
3. The scanner cannot tell whether a `pc_id` keyring screen was openable; the plain and the scoped reset entry are both
   accepted, nothing else (limit 7).
4. An uncredited grant drops no step and marks no pair (R3-SCANNER2).
5. A `;` in a query hides the old-phone-list rule (R3-SCANNER1) until fixed.
6. A code's value is never checked; a recovery answer split across two places or served as a JSON number is not caught;
   anything before the first captured row is unknown (limits 3, 4, 5).

## Outside this stage (seen while probing, not ranked)

- S7 rule, on main: `crack_facts_ok?` (`access_leak_scanner.rb:3851-3852`) reports an honest `crackFacts: []` when the
  scenario has a hash record and no `social.intelFacts`. Probe A's first run gave `crack_key crack:key:crackFacts` on every
  keyring answer; with an empty `social.intelFacts` added, 0. Fails closed; no shipped scenario has that shape.

## For the owner

1. After a desk reset the keyring still lists `<npc>.cracked` with the old password (scoped: `forThisPc` true, `accepted`
   true) beside `<npc>.reset`, and a crack run after the reset still answers `cracked`; the old password is then refused at
   sign-in (422). The scanner accepts both rows, each on its own proof. Whether a cracked row should stay, be marked stale or
   go once the account is reset is a design choice for the server and client, not a leak.
2. Round 1's owner item (the stop rule depends on playtest order) is unchanged and stays limit 1.

clean
