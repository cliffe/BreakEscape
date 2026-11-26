# Tour call-back scanner review

**Verdict: not clean.** One major finding: the change lets the scanner accept more than the server could ever grant.

Reviewed commit: `f72423182` (Scanner: a call-back desk grant for a held phone is clear of a stop seen on another desk). The other three recent commits (`208008648`, `0443de3eb`, `8fcc6bdc8`) touch ink and dialogue only, not the scanner or any access check.

## The diagnosis holds

Each claim was checked against capture `responses-302.jsonl` (game 302) and the server code (`app/models/break_escape/helpdesk_access.rb`):

- Row 240 adds `yusuf_phone`. No later row removes it, and every refusal row (374, 413, 414, 416, 417) comes after it.
- Rows 413 to 416 end in `refused` with `triesLeft 0` at 19:07:18. Row 417 is `blocked` with `retryIn 293`. Row 443, the `call_desk` mfa grant for `yusuf_demir` at 19:08:32, falls inside that stop. The refusal rows name no desk, so the old rule (`return nil if hd_stopped?`) flagged the grant.
- On the server, a `callback` desk's rule is `held_friendface_phone(npc['id'])`. When the phone is held, an mfa request for that username on that desk is granted. It cannot add to `call_desk|ydemir` in `helpdeskTries`, so that desk can never be stopped for that name. The grant at row 443 is honest.
- The missing log row is also honest. `account_resets` is keyed by account and `what`, not by desk. The `it_desk` grant at row 384 set `yusuf_demir.mfa`, so `grant_helpdesk!` returns at line 270 before `log_helpdesk_request` and `write_log_row!`.
- `access-leak-check.rb 302 responses-302.jsonl` on the branch now ends with `VERDICT: no leaks found.` and exits 0.

## What the change gets right

- The exception applies only to a `callback` desk that already covers the account. `hd_desk_covers?` is still checked first and still needs the phone to be held at the grant row.
- The exception needs the phone to have been held at every refusal and `blocked` row so far (`@hd_phone_unheld_at_refusal`), not only at the grant. It also needs fewer than `TRIES_CAP` refusal rows, which rules out a full table.
- Plain `refused` rows now feed `hd_note_refusal(nil)`. That only counts the row and marks unheld phones. It starts no stop, so nothing new is loosened there.
- The four tamper tests (phone never held, phone taken only after a refusal, the same grant on the question desk, another account) all stay flagged.

## Finding M1 (major): a callback desk that also resets passwords can stop a held-phone account itself

`hd_callback_clear_of_stops?` relies on this claim: "with the phone held the rule is met, the answer is a grant". That is true only for `what = mfa`. The server's `helpdesk_covers_request?` is `met && issues`, where `issues` is false for a `password` request on an account with no `resetPassword`. Take a callback desk whose `resets` include `password`, and an account it serves that has no reset password. With the phone held, each password request for that account is refused and counted under `desk|username`. After `maxTries` refusals the entry is stopped, and the honest server answers a later **mfa** request from that same desk with `blocked`.

The scanner does not see this. The phone was held at every refusal, so a tampered `granted` mfa answer from that desk inside the stop is credited.

Reproduced with a probe test (scratch only, not committed). The setup is the base helpdesk scenario plus `call_desk` with `verify: callback` and `resets: [password, mfa]`. The rows are: take `nia_phone` (nia has no `resetPassword`), three refusals ending in `triesLeft 0`, then `blocked`, then a `call_desk` mfa grant for `nia`. Result: 0 `helpdesk_grant` findings. Before `f72423182` this grant was flagged.

The tour is not affected, because its `call_desk` resets only `mfa`. The scanner is generic, though, and the header says nothing is loosened to let a run pass.

**Fix:** clear the stop only when the desk could not refuse the account for any reset it offers. Add this to `hd_callback_clear_of_stops?`:

```ruby
desk['resets'].all? { |w| BreakEscape::HelpdeskModel.covers?(desk, npc, w) }
```

Also add a tamper test that is the probe above with `assert_includes rules(...), 'helpdesk_grant'`. Row 443 still passes with this fix, because the tour's `call_desk` resets only `mfa`.

## Minor

- m1: The header's crediting paragraph (lines 45 to 51) and LIMITS (1) still say every grant inside any stop goes uncredited. Add one sentence on the callback exception and its proof, so the header matches `hd_grant_credit`.

## Tests run

- Every scanner test file (`test/**/*scanner*_test.rb`, 53 files), run once under the shared lock: 1075 runs, 71599 assertions, 0 failures, 0 errors, 0 skips.
- The new `access_leak_scanner_helpdesk_callback_stop_test.rb` passed in the same run and in a separate run alongside the probe.
- Leak check on game 302: exit 0, no leaks.
