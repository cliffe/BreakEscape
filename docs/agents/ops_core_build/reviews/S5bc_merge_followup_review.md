# S5b/S5c merge follow-up review (delta)

Branch `ops-priv2`, range `6ac27437f..HEAD`:

- `936657af5` Ops S5bc: merge follow-up (rubocop layout)
- `8a688a218` Ops S5bc review: cross-stage interactions (a review file only, not reviewed here)
- `0eab0458e` Ops S5bc: merge follow-up (account-only manifest: seven new room NPC loops, desk skip)

Read-only review. The only file this review changes is this one.

**Verdict: clean.** Every one of the seven classifications is right, and the one skip is in the right place and is tested. Two of the keeps (`helpdesk_keyring_entries` and `phone_request_rows`) do reach the browser with an account-only account's name or username in them. Both reach it only after a desk grant for that account, which is finding M1/M2 of `S5bc_interactions_review.md`. That finding is still open, and the fix belongs in `request_helpdesk!`, not in these readers (see below). The rubocop commit changes layout only. There is no fixture diff in the range.

## Evidence

- Every method body was read at HEAD, along with its callers.
- `test/models/break_escape/account_only_readers_test.rb` and `test/models/break_escape/helpdesk_access_test.rb` were run under `flock /home/deploy/BreakEscape/tmp/tests.lock` (result below).
- A scratch probe (`.../scratchpad/probe_account_only_desk_test.rb`, a subclass of `HelpdeskKeyringTest`) marks `sam` `accountOnly`, grants a desk password reset, and reads `GET /keyring` (result below).
- The real-route evidence for the desk path on `test_ops_privilege` (the `deskadmin.reset` keyring row carries the display name and username, and the scanner flags it) is already recorded in `S5bc_interactions_review.md`, Q2 and Q3.
- `bin/ops-golden-compare` was not run (the fixer reports it still running). This review does not depend on it.

## The seven methods

| Method | Fixer | Review | Can the output reach the browser? Account-only account there |
|---|---|---|---|
| `helpdesk_access.rb#helpdesk_npc_serving?` | skip | **agree** | It decides whether a desk answers at all; it returns no names. A desk's `npc` is the person the player talks to and must have met. An account-only entry is never in a room answer, so it can never be `encounteredNPCs` honestly, and it now fails before the met check, whatever the player state holds. The new test gives `unavailable` and records no try. |
| `helpdesk_access.rb#helpdesk_keyring_entries` | keep | **agree** | **Yes.** It feeds `GET /keyring` (`credential_keyring.rb:150`). After a desk resets `deskadmin` (account-only, on `test_ops_privilege` plus a desk), the `deskadmin.reset` row carries `account: { npcId, username, displayName }`. Skipping here would be wrong: the grant body and the reset itself (a usable admin password) would remain. The row appears only after a grant, and the grant is what M1 forbids. Once M1 lands, `accountResets` can never name an account-only account, and this reader has nothing to emit. |
| `mfa_sign_in.rb#phone_request_rows` | keep | **agree** | **Yes.** It feeds `GET /mfa/phone` (`games_controller.rb:1686`), and each row carries the account's `username`. It is reached by (a) the own-phone path, after a desk re-enrols the account's mfa (M2: an `open_desk` mfa grant for `labadmin`), or (b) a held `phone_friendface` whose `owner` is the account-only id. Path (a) closes with M1. Path (b) needs an author to give a phone to an account with no person behind it; see note n1. The rename from `mfa_phone_answer` is right: the `account_npcs` lookup moved into `phone_request_rows`, and `mfa_phone_answer` no longer matches the loop pattern. |
| `lock_step_reach.rb#build_carried_step_chains` | keep | **agree** | No. Its chains (item id, home, room) back the server's `carried_step_held?` checks. The only NPC walk is `itemsHeld`, and the validator's key list (`PRIVILEGE_ACCOUNT_ONLY_KEYS`) forbids `itemsHeld` on an account-only NPC, so the walk yields nothing for one. |
| `lock_step_model.rb#each_lock_step` | keep | **agree** | Not as a name. Each hit carries an `npc:` id, and its callers use it for server-side judgements and log-row placement (`OpsLogEvents.gated_object_entry` takes `room` and the lockable only). The same `itemsHeld` argument applies, so an account-only NPC yields no entry. |
| `lock_step_model.rb#find_npc` | keep | **agree** | No. Its only caller is `lock_step_never_passes?`, which uses it for `MfaModel.prompt_habit` on a step's owner, a boolean that the validator and models use. Skipping would turn an account-only owner into `nil` and change the habit default, so keep is right. |
| `ops_log_events.rb#npc_held_entry` | keep | **agree** | A log row's room, never a name: it returns `{ object, room_id }` for an item id. An account-only NPC holds no items (validator), so it never matches. |

## The skip and its test

`helpdesk_npc_serving?` now looks the NPC up once, refuses `nil`, and then refuses `AccessIdentities.account_only?(npc)` before reading `encounteredNPCs` and the knock-out record. The refusal is the existing `unavailable` 422, which a met-but-knocked-out desk NPC also gives, so it adds no new oracle. Whether an author may put an account-only NPC behind a desk at all is a validator question. The manifest test requires a `skip` entry's body to call `account_only?`, and this one does.

## Rubocop commit

Two hunks, layout only. `->(_msg) {}` becomes `->(_msg) { }` (Layout/SpaceInsideBlockBraces). The `else` and `end` of `tail = if ...` move to the column of `tail` (Layout/ElseAlignment and EndAlignment, `variable` style). The other change drops a blank line before the final `end` of `AccessLeakScanner`. No tokens change.

## Notes (not findings of this delta)

- **n0 (carry-over).** M1, M2 and M3 of `S5bc_interactions_review.md` are not addressed in this range. Until M1 lands, `helpdesk_keyring_entries` and `phone_request_rows` are the browser-facing readers that carry an account-only username, and the display name for the keyring row. No shipped scenario combines a desk with an account-only account.
- **n1 (validator gap, minor).** `validate_privilege.rb` refuses `creds.card` on an account-only NPC ("it is not a person who holds a badge"). It does not refuse an item `owner` (a `phone_friendface` or a `code_device`) that names an account-only id. With such a phone held, `GET /mfa/phone` would list that account's username with no earning answer. Suggested fix: an error, "an item cannot be owned by account-only '<id>'", next to the `card` check.

## Test results

- `bin/rails test test/models/break_escape/account_only_readers_test.rb test/models/break_escape/helpdesk_access_test.rb` (under the lock): 50 runs, 746 assertions, 0 failures, 0 errors. This includes the manifest-matches-source test, so the seven entries and the rename are exactly what the scanner finds.
- The probe (under the lock) used `sam` marked `accountOnly`. `request_helpdesk!('it_desk', 'sokafor', 'password', ...)` returned 200 `granted` with `npcId "sam"`. `GET /keyring` then returned `sam.reset` with `account: { npcId: "sam", username: "sokafor", displayName: "Sam Okafor" }` and the reset password. This confirms that `helpdesk_keyring_entries` reaches the browser with an account-only account's display name and username, and that the gate is the grant (M1). The probe made no assertions. Its room check was dropped as noise, because the fixture's `sam_fob` names `sam`.
