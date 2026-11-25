# Tour call-back scanner review, round 2

**Verdict: clean.** M1 is closed. There is one small leftover from the minor, and it does not block.

Reviewed commit: `480792156` (Scanner: call-back desk exception only where the desk covers every reset kind). This is a delta on `TOUR_CALLBACK_SCANNER_REVIEW.md`.

## What changed since round 1

`git diff --name-only 42399b75b HEAD` shows two code files. Everything else is `tts_cache` audio (commits `512e5f243`, `eb247f4a3`, `3e2cb0278`):

- `tools/playtest/lib/helpdesk_leak_rules.rb`: the header has one new sentence, the comment on `hd_callback_clear_of_stops?` explains the new condition, and the method has one new clause.
- `test/controllers/break_escape/access_leak_scanner_helpdesk_callback_stop_test.rb`: one new tamper test.

No other rule, shape or access check was touched.

## M1: closed

`hd_callback_clear_of_stops?` now also requires `desk['resets'].all? { |w| BreakEscape::HelpdeskModel.covers?(desk, npc, w) }`.

This matches the server. In `request_helpdesk!`, a held-phone request on a `callback` desk is refused only when `helpdesk_covers_request?` is false. With the phone held, `met` is true, so the request is refused only when `issues` is false, which means a `password` request for an account with no `resetPassword`. `HelpdeskModel.covers?` returns false in exactly that case. A desk serving the account with an unavailable `what` is refused as `unavailable` before any count is taken. An account the desk does not serve fails `covers?` and is never credited, because `hd_desk_covers?` runs first. So when every offered kind is covered, the desk cannot count a held-phone account under its own `desk|name` key, and clearing the stop is sound.

`desk['resets']` is always an Array, because `HelpdeskModel.desks` normalises it in `build_desk`. The new `.all?` therefore cannot raise on a scenario with no `resets` or a malformed one.

### The probe, rebuilt

The probe ran as a scratch test, kept out of the tree, at `/data/tmp/scratch/tour-cb-r2/`:

1. The round 1 probe: a `callback` desk with `resets: [password, mfa]`, `nia_phone` taken, nia with no reset password, three refusals ending in `triesLeft 0`, `blocked`, then a `call_desk` mfa grant for nia. The grant is **flagged** (`helpdesk_grant`).
2. The same rows with the pre-fix method body swapped in. The original is restored in `ensure`. Here the grant is **not flagged**. This shows the probe tests the new clause.
3. Not over-tightened: the same desk, with nia owning a unique reset password. The grant is **clear**, which is right because the server could not stop that name.
4. The tour's shape, an mfa-only `callback` desk. The grant is **clear**.

All 4 pass. The committed tamper test is probe 1.

## Minor m1: mostly done

The crediting paragraph now names the exception and points to `hd_callback_clear_of_stops?`. **Leftover (nit, not blocking):** LIMITS (1) still begins "a stop on any desk or username stops every grant until it runs out". With the exception, that is no longer quite true. A clause such as "(except the proven call-back case above)" would make the two paragraphs agree. A later doc touch can fix this.

## Tests run

- Every scanner test file (`test/**/*scanner*_test.rb`, 53 files), run once under the shared lock: 1076 runs, 71601 assertions, 0 failures, 0 errors, 0 skips. That is round 1's 1075 runs plus the new tamper test.
- Scratch probe file: 4 runs, 0 failures.
- `access-leak-check.rb 302 responses-302.jsonl`, using the capture at `/data/tmp/scratch/tour-second_step-playtest-2/`: `VERDICT: no leaks found.`, exit 0. Row 443 is still credited.
