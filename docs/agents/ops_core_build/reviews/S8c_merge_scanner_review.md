# S8c merge scanner fix: delta review

Commit reviewed: 376ae2989 (on 404264af8, after merge b7fc3d7a9). Stage heads compared: S8c fbe61998b, S8b 5b6d48ebf.

## Verdict: clean

No defect found. Two non-blocking notes are listed at the end.

## Cause

- **Hook order (real).** At b7fc3d7a9/404264af8 `scan_lock_steps` ran before `scan_helpdesk`, so it saw the root `code` of an earned own-device answer (`GET mfa/device?npc_id=`). `ls_judge_secrets` excuses a root code only when `mfa_device_answer_ok?` holds, and that covers authored devices only, so the scanner reported `lockstep:key:code`. Confirmed: I loaded the 404264af8 scanner over the new test class. 3 inherited helpdesk cases fail, each with `lock_step_secret lockstep:key:code $.code` on `GET mfa/device`. With the old order and the new guard, the same 3 fail. With the new order and no guard, all pass.
- **tamper 11 (flake, real).** `MfaModel.numbers` sets `right = 10 + digest(game_id|subject|npc|nonce) % 90`. The fixed list `[11,12,13]` holds the right number for 3 game ids in 90. Game ids move when the merge adds tests, and a list that holds the number is an honest answer. The new list is the first three numbers in 11..99 that were never shown for that lock. It is sorted and unique and in range, so the only check it fails is `nums.include?(gate[:number])`. The test still requires `lock_step_answer` / `lockstep:phone`. It is a real tamper and does not depend on test order.

## Each rule set judges its own answers as on its own branch

- `helpdesk_leak_rules.rb` differs from S8b head only by the 3-line lock-form guard. `lock_step_leak_rules.rb` is identical to S8c head.
- **S8b view.** The helpdesk runs at the same point it did on S8b, before `scan_mfa`, and `scan_mfa` gets the same stripped body. Nothing from the lock rules runs before it in the row. Helpdesk code never reads `@ls_*` or `ls_placed?`, and none of the `mfa_*` helpers it calls (`mfa_pass_pc` and others) do.
- **S8c view.** With no helpdesk in the scenario, `@hd_active` is false and the body passes through unchanged, so the result is byte for byte the S8c behaviour. With a helpdesk, the copy loses only three things: the root `code` of a strictly shaped, earned own-device answer, `ownPhone` on an earned login answer (the lock rules never read it), and `numbers` on own-phone entries. Those entries are exact `host n pcId username` entries for an open PC step with an earned account, and they are never lock-form. The lock rules have no state of their own about these forms. The helpdesk does change `@mfa_pending` (`hd_drop_steps`), but only on a desk grant row, which `ls_judge_refusal` never places, so the result is the same in either order.
- `@ls_placed` now holds hashes from the same body object that `scan_mfa` sees. Under the old merge order the root identities could differ when the helpdesk stripped. That change is harmless and slightly more consistent.

## No answer is left unjudged by both rule sets

- A lock-form entry in an `own=1` list: the helpdesk returns no `flags[:phone]`, so `hd_judge_phone_route` reports `helpdesk:own:phone`. The copy is not stripped, so the lock rules see the entry whole, and `ls_phone_answer_ok?` (query keys must be `npc_id target_id target_type`) reports `lockstep:phone`. Both rules report it, so the scanner fails closed.
- An unearned or misshapen own form: nothing is stripped, so the helpdesk reports it and the lock and MFA rules still see the secret. That is the same as before.
- Lock-form answers on lock routes are never stripped, so the lock rules judge them as they did on S8c.

## Reverse-direction test

`AccessLeakScannerHelpdeskLockStepBothTest` inherits every helpdesk case and adds a push lock step owned by nia. It is a real regression test: against the pre-fix order, 3 inherited cases fail (honest run, own code allowed after a grant, own form for an uncovered account).

## Tests

All 42 scanner test files (test/unit and test/controllers `*scanner*`/`*leak*`) ran once under the tests.lock: 806 runs, 65748 assertions, 0 failures, 0 errors.

## Notes (non-blocking)

1. The new guard in `hd_own_phone_entries` cannot be observed. `mfa_phone_entry_ok?` already requires the exact key set `host n pcId username [numbers]`, so a lock-form entry was already refused. Without the guard all 52 cases still pass. It is defence in depth and does not loosen anything.
2. The new test 'an earned own phone list with its number choices is still allowed beside a lock step' also passes before the fix, so it does not catch this bug. The inherited own-code cases do.
