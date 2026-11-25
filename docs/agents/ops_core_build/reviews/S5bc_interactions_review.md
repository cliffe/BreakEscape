# S5b/S5c cross-stage interactions review (after the merge of main)

Branch `ops-priv2` at 6ac27437f. Scope: how S5b (collect cached accounts), S5c (account kinds, account-only accounts) meet S7 (hash records, the cracker) and S8b (helpdesk recovery), and whether the leak scanner judges runs that use both. Read-only review: no code changed.

**Verdict: not clean.** The collect-to-crack-to-sign-in path is correct end to end, and the scanner judges it correctly. The helpdesk, though, has no rule about account kinds. Today a people desk resets an account-only local administrator or a local account like any other account, and a `none` desk reveals account-only usernames. The validator also accepts this, and in one case insists on it. No shipped scenario combines `helpdesks` with `accountOnly` or `accountKind` yet (`test_ops_helpdesk` has no kinds, and `test_ops_privilege` has no desk), so nothing that ships breaks today. The first scenario that combines them would, so the gap is graded major.

## How the evidence was made

There is one scratch integration test, `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-interactions/s5bc_interactions_test.rb`, run as `flock .../tests.lock bin/rails test <it> -n /S5bcX/` (6 runs, 0 failures). It reuses `OpsPrivilegeBeats` (the real `scenarios/test_ops_privilege`) and plays everything through the real routes: `POST /login`, `/harvest_credentials`, `/crack`, `/helpdesk/request`, `GET /keyring`, and `/scenario`. The answers it records are in `.../s5bc-interactions/out/*.json`. Two copies of the scenario are built in the test:

- **domain copy:** `ravi` (domain `northwind`, admin) is also cached at `desk_a`, with a hash record `desk_a_ravi`.
- **helpdesk copy:** two desks are added: `it_desk` (Ravi, `questions`, `staff_no`, resets password and mfa) and `open_desk` (Priya, `none`, resets password and mfa). `olu` (no kind) and `uma` (made `local` to `bay_pc` and `store_pc`) get recovery answers and reset passwords. The account-only `deskadmin` (local to `desk_a` and `desk_b`) also gets a recovery answer and a reset password. `labadmin` (account-only) gets neither.

For the scanner runs, the rows were recorded in the browser-log shape (no request body) and the keyboard sign-ins were named with `--signin`, as `AccessLeakScannerHarvestRealTest` does. The scanner was given the game.

## Question 1: a harvested hash with the cracker

Everything asked for holds. The local account was shown on the real scenario and the domain account on the domain copy.

| Step | Answer |
|---|---|
| keyring before anything | no entries |
| `POST /crack desk_a_deskadmin` before the collect | 404 `not_found` (the `harvested` proof does not hold) |
| admin collect at `desk_a` | 200, one row `deskadmin` with no portrait or avatar and `hashId desk_a_deskadmin` |
| keyring after the collect | `desk_a_deskadmin` hash, status `ready`, no password; no `desk_b_deskadmin` row |
| crack naming the fact before it is earned | 422 `fact_not_held` |
| crack with no fact before it is earned | 200 `needMoreFacts`, `missingCount 1` |
| crack `desk_b_deskadmin` (not collected there) | 404 `not_found` |
| fact earned (poster taken), crack picking nothing | 200 `nomatch`; keyring unchanged |
| crack with the fact | 200 `cracked`, `credentialIds ["deskadmin.cracked"]` |
| keyring after the crack | `deskadmin.cracked` (password, the authored value) plus the hash row now `cracked`; still no `desk_b` row |
| typed sign-in `deskadmin` at `desk_a`, `desk_b` | 200 `admin` |
| at `lab_pc`, `bay_pc`, `hot_desk` | 422 "This account can't sign in on this PC" (the local kind refuses; one `signin_refused` row with `kind: local` is pinned elsewhere) |
| domain copy: collect at `desk_a` | rows for `deskadmin` and `ravi` |
| crack `desk_a_ravi` | `ravi.cracked`; `deskadmin` stays `ready` (no batch spill) |
| `ravi` at `bay_pc`, `hot_desk` (domain `northwind`) | 200 `admin` |
| `ravi` at `desk_a`, `desk_b`, `lab_pc` (no domain) | 422 |

Nothing unearned appeared. The per-PC proof keeps the second PC's record out until that PC is collected, and the cracker gives out only the authored password.

## Question 2: account-only and local accounts at a helpdesk

Neither plan decides this. A23 (`docs/ACCESS_AND_NETWORKS.md` lines 898 to 960) and `OPS_MFA_HELPDESK_PLAN.md` section 4.2 say a desk serves "an account", and section 14 relies on S5c only for the sign-in order and the second step. `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` never mentions a helpdesk. The code follows the silence: `request_helpdesk!` looks the name up with `account_for_username` (`app/models/break_escape/game.rb:3272`), which covers every account holder, account-only ones included. Neither `helpdesk_covers_request?` (`helpdesk_access.rb`) nor `HelpdeskModel.covers?` reads `accountOnly` or `accountKind`.

What the server does today (helpdesk copy):

| Request | Answer |
|---|---|
| `it_desk`, unknown `nobody`, password | 422 `refused`, `triesLeft 2` |
| `it_desk`, `labadmin` (account-only, nothing authored), password | 422 `refused`, `triesLeft 2`, the same as unknown |
| `it_desk`, `deskadmin`, wrong answer | 422 `refused`, `triesLeft 2`, the same as unknown |
| `it_desk`, `deskadmin`, right answer | **200 granted**, `password Reset-Desk-99`, `npcId deskadmin` |
| then `deskadmin` / `Reset-Desk-99` at `desk_b` | **200 `admin`**, with no collect and no crack |
| `it_desk`, `umaquay` (local person), right answer | 200 granted |
| `open_desk`, unknown `administrator`, mfa | 422 `refused`, `triesLeft 2` |
| `open_desk`, `labadmin`, mfa | **200 granted**, `npcId labadmin`; `accountResets.labadmin.mfa` recorded |
| `open_desk`, `labadmin`, password (no `resetPassword`) | 422 `refused`, the same as unknown |
| keyring | `deskadmin.reset` with the account block (display name and username) |

On a `questions` desk the refusals do not tell anything apart: an account-only name, a wrong answer and an unknown name all give the same body and the same count. The leaks come from grants, covered in M1 and M2.

### The recommended rule

A real IT desk resets the directory accounts of the people who can phone it. It does not reset a machine's local accounts: a local administrator is reset by someone with admin rights on that machine or by its password manager, never by the service desk over the phone. It also does not reset service-style accounts that have no person behind them; their owner or a change process rotates those. The engine's rule should be:

1. A desk serves an account only when the account is **not** `accountOnly` **and** its `creds.accountKind` is **not** `local`. That covers `domain` accounts and accounts with no kind, so every existing scenario plays as before.
2. Every other account counts as "not an account" at the desk. The rule still runs on a stub, as it does today for an unknown name, and the request is refused and counted the same way. No answer, grant or count separates "account-only" or "local" from "no such name".
3. The validator makes it an error to author `creds.recovery` or `creds.resetPassword` on such an account ("a people desk never resets this account"). The info line and the recovery-required check leave such accounts out.

Today's behaviour does **not** match this rule: see M1 to M3.

## Question 3: the leak scanner over runs that use both

| Run | Result |
|---|---|
| collect, keyring, fact, crack, keyring, `deskadmin` sign-in at `desk_b` and its desktop, refused `lab_pc` sign-in (13 rows), honest | **clean** |
| tamper: the after-crack keyring moved before the crack | row 8 `password npc:deskadmin`, `crack_row`, `crack_unearned crack:entry:deskadmin.cracked` |
| tamper: `deskadmin.cracked` spliced into the first keyring | row 5 `password npc:deskadmin`, `crack_unearned` |
| tamper: the refused `lab_pc` sign-in rewritten as an admin success | row 13 `ops_string ops:key:access`; naming it `deskadmin@lab_pc#2` is refused by the scanner itself ("lab_pc does not admit deskadmin (it admits: desk_a, desk_b)"), so the kind is judged |
| desk refusals for `labadmin` and an unknown name, honest | **clean** |
| tamper: the `labadmin` refusal forged into a password grant carrying `deskadmin`'s reset password | `account_only npc:labadmin/username`, `helpdesk_grant`, `helpdesk_secret helpdesk:reset:deskadmin` |
| tamper: the unknown-name refusal forged into an mfa grant for `labadmin` | `account_only`, `helpdesk_grant helpdesk:grant:mfa` |
| tamper: `triesLeft 5` on a refusal | `helpdesk_secret helpdesk:answer` |
| collect at `desk_a`, then the desk grant for `deskadmin`, keyring, sign-in at `desk_b`, honest | **clean** |
| tamper: the grant's password changed to the authored one | `password`, `helpdesk_grant`, `helpdesk_secret` on the grant and the keyring row |
| desk grant for `deskadmin` **before** any collect, honest today | flagged: `account_only npc:deskadmin/username` on the grant, and username and name on the keyring |
| `open_desk` mfa grant for `labadmin`, honest today | flagged: `account_only npc:labadmin/username` |

The scanner does what was asked: honest runs scan clean and every forged answer is reported. The last two rows are honest answers the server gives today, which the scanner calls leaks. The scanner is right by S5c's own rule (an account-only name only after its earning answer), so the server is what should change (M1). Once M1 lands they are answers the server can no longer give.

## Findings

### Major

**M1. A people desk resets account-only and local accounts.** Evidence: Q2 table. `deskadmin` (account-only, local, admin) is reset with no collect and no crack, then signs in as admin at `desk_b`. `umaquay` (local) is reset as well. The S5b to S7 chain (admin session, collect, earned fact, crack) can be skipped entirely by an author who adds a recovery answer to a shared local administrator, and the validator accepts that (M3). The code is at `app/models/break_escape/helpdesk_access.rb` in `request_helpdesk!` (`npc = typed.empty? ? nil : account_for_username(typed)`), with no kind check there, in `helpdesk_covers_request?`, or in `HelpdeskModel.covers?`.

Fix:
- Add a plain-Ruby `HelpdeskModel.desk_serves_account?(npc)` that is false for `AccessIdentities.account_only?(npc)` or `npc.dig('creds','accountKind') == 'local'`.
- In `request_helpdesk!`, `npc = nil unless npc && HelpdeskModel.desk_serves_account?(npc)`, placed after the lookup and before `helpdesk_covers_request?`. The stub is then judged exactly as for an unknown name: same work, same refusal, same count and cap.
- Make `HelpdeskModel.covers?` return false for such an account, so the validator's info line, the dungeon graph's grant nodes and the scanner's `hd_grant_credit` (which call it) agree with the server.
- Tests:
  - a controller test in which the three requests (account-only with right answers, local with right answers, unknown name) give byte-equal bodies and equal `helpdeskTries` counts;
  - a `none` desk refuses `labadmin` for mfa;
  - a domain account and a kindless account are still granted.

**M2. A `none` desk reveals account-only usernames.** Evidence: `open_desk` mfa for `labadmin` gives 200 with `npcId labadmin`, while `administrator` gives 422. A guessed name confirms that a hidden account exists and names its id, which S5c otherwise keeps out of every answer until a collect (the scanner flags it as `account_only`). A `none` desk is an oracle for ordinary accounts by design (A23, validator warning), but S5c made account-only names secret, so the two stages conflict. The mfa grant also records `accountResets.labadmin.mfa` for an account no desk should touch. Fix: M1 closes this, because the account is then refused like an unknown name.

**M3. The validator accepts desk recovery on account-only and local accounts, and in one case requires it.** Evidence: the helpdesk copy validates with no helpdesk or privilege error, and prints `INFO: helpdesk: ... covers olu (password and mfa), deskadmin (password and mfa)`. Worse, `scripts/validate_helpdesk.rb:140-147` (`helpdesk_recovery_errors`) raises an ERROR for any account under an MFA PC that lacks a recovery value for every question of a `questions` desk. An account-only local administrator at an MFA PC is enrolled by default, so the validator tells the author to *add* recovery answers to it, which makes the desk reset it. (This was read from the code; no shipped scenario has the combination, so it was not run.)

Fix:
- In `check_helpdesk`, filter `accounts` with `HelpdeskModel.desk_serves_account?`, which covers both the recovery-required rule and the info line.
- Add an error: "`creds.recovery` / `creds.resetPassword` on an account-only or local account: a people desk never resets it."
- Add the case to `test/unit` for the helpdesk validator.

### Minor

**m1. Neither plan nor the docs state the rule.** A23 (`docs/ACCESS_AND_NETWORKS.md`, "Key fields" and "The three rules") and the S5c section of `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (section 9's account-only key list) say nothing about desks. Fix: add one line to A23, "A desk serves domain accounts and accounts with no kind; an account-only or local account is answered as an unknown name", one line to the S5c plan's section 14 (relations to the S8 plan), and the same note on A20 (account kinds).

**m2. The harvested domain account is not on any shipped path.** `test_ops_privilege` caches no domain account, so "a harvested domain hash cracks and signs in only on its domain" was shown here only on a copy (Q1, domain rows). Fix: add a case to `account_kind_test.rb` or a beat that caches `ravi` at a domain PC (it would need a hash record in the real scenario), or record that the case is pinned by this review's copy only.

**m3. A desk has no domain of its own.** With the rule above, a desk resets every domain account in the scenario whatever the domain. That is fine while scenarios have one domain. If a scenario gets two, add an optional `helpdesks.<id>.domain` that narrows `desk_serves_account?`. This is not needed now, only noted.

### Not findings

- `POST /login` with `credential: "deskadmin.cracked"` gives 422. That is correct: `credential` is for connecting kinds only, and a cracked password is typed (the tile fills it).
- A crack made after a desk reset gives the authored, now stale password. This is the S5c plan's stated rule ("a hash collected after a password reset is of the scenario's password"), and A23's "old notes stay old".
- Follow-up A's `heldItem` on hash rows is not on this branch. The Q1 keyring rows have no `heldItem`. Recheck the hash-row shape and the scanner's `crack_row` rule when it merges.
