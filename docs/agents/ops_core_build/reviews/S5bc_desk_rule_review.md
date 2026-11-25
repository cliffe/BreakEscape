# S5b/S5c review: the helpdesk account-kind rule and related fixes

Branch `ops-priv2` at 36575ce9e (c821f856b, a4d6e4e26, 36575ce9e), plus Item 4, which is not committed: the working-tree change to `test/controllers/break_escape/ops_privilege_scenario_test.rb`. This is a read-only review and no code was changed. The rule under review is the decision of 2026-11-25 in `S5bc_interactions_review.md` (M1 to M3, m1).

**Verdict: not clean.** Items 1 to 3 do what the decided rule says. I found no blocker or major in them: on reading, an account-only or local name takes exactly the unknown-name path at every point. The verdict is held back for two reasons:

1. Item 4 is incomplete. The fix is real, but it cannot pass until the fixture is recorded again once, and that has not happened.
2. No Rails test could be run for this review, including the side-by-side probe through the real route. The shared test lock is deadlocked (see "What could not be run").

## What could not be run

`/home/deploy/BreakEscape/tmp/tests.lock` is held by `flock ... bin/rails app:ops:unchanged:capture` (pid 4075898, cwd `/data/be-ops-follow`). Its child, `ruby` (4075900), is waiting on the same lock through a nested `flock ... rails test test/lib/ops_unchanged_capture_test.rb` (4075913). That wait can never end. Behind it, in this tree, is the Item 4 fixer's queued `PRIV_ANSWERS_RECORD=1 ... ops_privilege_scenario_test.rb` (4130441). When the lock frees, that run will rewrite `test/fixtures/files/ops_privilege_answers.json` here.

Because of this, the following were not run by this review:
- `helpdesk_account_kinds_test.rb`
- `helpdesk_model_test.rb`
- the beats test
- the real-route probes

`bin/ops-golden-compare` was not run either.

## What was run

- **Validator JS tests**, with node 22 from `~/.local/node-v22.11.0-linux-x64`, because the system node is 10. These files pass, including the five new cases: `validator-helpdesk`, `validator-privilege-kinds`, `validator-privilege`, `validator-privilege-cached` and `validator-mfa`.
- **Validator output before and after**, with `--no-graph`. The scripts and lib at 5f508df27 were set up in a scratch copy with the tree's assets symlinked in. The comparison covered the only two shipped scenarios that use `accountOnly`, `accountKind`, `helpdesks`, `recovery` or `resetPassword` (`test_ops_privilege` and `test_ops_helpdesk`). The output is byte-identical apart from the path line. A grep shows no other shipped scenario carries those keys, so the output is unchanged on all shipped scenarios.
- **Crack tokens recomputed under each tree's secret**, in plain Ruby with ActiveSupport::KeyGenerator, SHA256 and 1000 iterations (see Item 4).

## Item 1 (c821f856b): the server rule

`request_helpdesk!` sets `npc = nil` unless `HelpdeskModel.desk_serves_account?(npc)`. It does this after `account_for_username` and before `helpdesk_covers_request?`. Every step that follows is the same for an unknown name, taken in order:

- **Stopped and cap.** The stopped check, `make_room_for_helpdesk_try!` and `helpdesk_blocked_by_cap!` all run before the lookup. They are keyed on `tries_key(desk_id, typed)`, so they cannot tell the two names apart.
- **The rule.** It is judged on the same stub, `{ 'id' => typed, 'creds' => {} }`. The callback rule calls `held_friendface_phone(typed)` for both. Its result is discarded anyway, because `npc` is nil.
- **The refusal.** `refuse_helpdesk!` takes no account argument. The count, the stop, `triesLeft`, the body `{reason: 'refused', triesLeft:}` and the log row `helpdesk_request as: {typed:}` (echoed through `ops_log_typed` with no account branch) are the same.
- **No grant.** The grant path is unreachable, so there is no `accountResets` write, no keyring `.reset` row (`helpdesk_keyring_entries` needs `account_reset?`), no MFA re-enrolment and no "My phone" on the phone route.

`covers?` now returns false first for such an account. The validator, the dungeon graph (`generate_dungeon_graph.rb:2090`) and the scanner's `hd_desk_covers?` all call it, so all three agree with the server. Directory accounts (no kind) and domain accounts are still served (`desk_serves_account?` returns true unless the account is account-only or `accountKind == 'local'`).

`HelpdeskAccountKindsTest` probes through the real route. It compares an account-only or local name against a fresh unknown name, asked the same number of times, and checks equal status, byte-equal body and equal counts. It does this on a questions desk and on a `none` desk. It also checks that a kindless account is granted, and that neither the keyring nor `mfa/phone` (including with `npc_id: labadmin`) names an account-only account after refused requests. The test is the right shape. It was not re-run here.

### Minor

- **D1. A desk run by an account-only NPC still names it in the bootstrap.** `HelpdeskModel.forms` (the bootstrap `helpdeskForms`) copies `desk['npc']` without checking it. `helpdesk_npc_serving?` refuses such a desk at request time, but the id is still served. The new validator error (`a4d6e4e26`) stops anyone authoring this, and no shipped scenario has it. If defence in depth is wanted, `forms` could drop that desk. **Checked later:** the validator now rejects a desk run by an account-only NPC as an error, so no validator-clean scenario can reach this; no server change is needed.
- **D2. A reset saved before this fix still holds.** `effective_password` and `helpdesk_keyring_entries` still honour an `accountResets` entry for an account-only or local account. That entry can only exist in a game saved before c821f856b in a scenario that combines desks with kinds, and none ships. Note it only. No change is needed.
- **D3. Test gaps.**
  - (Closed: `helpdesk_account_kinds_test.rb` now has a callback desk case and a full-table case.) There is no callback desk case. It is structurally identical, but the decision says "every desk kind".
  - There is no stopped or cap case for an unserved name. Both are before the lookup.
  - No case compares log rows.
  - A domain account is shown granted only in the model unit test, not through the route. Ravi is the `it_desk` agent in the test copy, so another domain account would be needed.

## Item 2 (a4d6e4e26): the validator

- `check_helpdesk` splits the accounts into those a desk serves and those it does not. The recovery-required rule, the info line and the remaining desk checks see only the served accounts. This closes M3's "the validator demands recovery on a shared local admin".
- `helpdesk_kind_errors` raises an error when `creds.recovery` or `creds.resetPassword` is on an unserved account. It also raises one when a desk's NPC is account-only.
- `privilege_account_only` raises an error when an item `owner` names an account-only NPC.

Each message names only ids. The new rules are inert unless one of those keys is present, which matches the before-and-after comparison above.

One effect follows correctly from `covers?`: `validate_mfa.rb:170` no longer counts "a helpdesk that resets mfa" as a way back for an account-only or local MFA account. The validator now tells the truth about those accounts.

### Minor

- **V1. The S5c plan was not updated.** m1 asked for one line in `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 14. Only `docs/ACCESS_AND_NETWORKS.md` was changed. A20 and A23 there state the rule correctly, including "same status, body, count, cap and log rows", which matches the code.

## Item 4 (uncommitted): the keyringRev fixture fix

**The cause is real.** Hash keyring entries carry `token`, which `OpsCracking` makes as an HMAC under `Rails.application.key_generator`. `keyringRev` is an MD5 over those entries, and log row ids are HMACs under the same generator. `test/dummy/tmp/development_secret.txt` is gitignored and random in each tree. I recomputed the token for `baypc_olu` (game 190019):

| Secret | Token |
|---|---|
| this tree, `/data/be-ops-logs` | `CHE3-MXCQ-YCU4-FFG5-53V7-FMQ3`, the committed fixture value |
| `/data/be-ops-follow` | `FL5F-...` |
| `/home/deploy/BreakEscape` | `9XLG-...` |

So the fixture passes only in the tree that recorded it.

**The cause is the tree, not test order.** The test comment says the stub makes the comparison hold "in every tree and in any test order". I found no order dependence in these values: no caller memoises the key, and each calls `key_generator` on every use, so the stub takes effect for the whole `play_all_beats` block. The "order" wording should go, or a failing order should be shown.

**The fix is the right one.** Stubbing `Rails.application.key_generator` with a fixed `CachingKeyGenerator` for that one test removes the dependence on the tree's secret.

**It needs one re-record, and that has not been done.** With the stub and the current fixture, the test fails in this tree as well. Once re-recorded, the diff to `ops_privilege_answers.json` must be confined to values derived from the key: `token`, `keyringRev` and `rev`, and log row `id`s. Any other changed line would mean a behaviour change, and must be explained or rejected. The JS tests that read the fixture (`cached-accounts-*`, `signin-domain`, `account-only-session`, `test-bridge-cached-accounts`) pin no tokens. One literal token appears in `access_leak_scanner_privilege_real_test.rb:1563` as tamper text, and it is flagged whatever its value.

**One small side effect.** If this is the first integration request in a process, Rails' memoised `env_config` captures the stubbed generator for cookies for the rest of that process. That does no harm, because cookies are signed and read with the same generator, but it is worth knowing.

## To make this clean

1. Free the test lock. The capture run in `/data/be-ops-follow` must not call `flock` inside `flock`.
2. Re-record the fixture under the stub. Check that the diff touches only the values derived from the key, then commit Item 4 with the comment fixed.
3. Run under the lock: `helpdesk_account_kinds_test.rb`, `helpdesk_model_test.rb`, `ops_privilege_scenario_test.rb` (two seeds), and the helpdesk, keyring, MFA phone and scanner controller tests. Then run `bin/ops-golden-compare` outside the lock.
4. Optional: D1 and D3 (a callback case and a cap case), and V1.
