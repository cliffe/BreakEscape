# Handover: OPS_MFA_HELPDESK_PLAN reviser, round 2

Stopped at the context limit on 2026-11-19. Nothing committed.

## Done

- Every R2 major (R2-1, R2-2) and minor (R2-3 to R2-11, R2-13, R2-14) is written into
  `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md`, plus nit R2-12 (sign-in steps named, not numbered).
  Round 1 items F7, F10, F8, F13 are closed by the same edits.
- Orchestrator rulings 1 to 4 and the mid-task log ruling (snake_case names, merged prompt rows,
  "saved by" per row) are in sections 3, 5.2, 13 and 14.
- Round 2 decisions appended to `docs/agents/ops_layer/reviews/OPS_MFA_HELPDESK_DECISIONS.md`.
- Open questions cut from six to four; "talking an owner into a code" settled in section 5.5.

## Open

1. **The plan is not smaller.** 1013 lines before, 1125 after. The cuts (stage M4, the keyring
   re-judge, the phone-menu approval) were outweighed by the new rules. A trimming pass is needed.
   Likely places: section 2 (tables restate code a builder can read), section 5.2's device-gate
   prose, section 5.3's sign-in screen bullets, section 7's general-rule paragraph, section 9's
   warning list, section 11's controller bullets (they repeat the beats table).
2. **Not re-read after editing.** The whole file was edited by string, never read end to end
   afterwards. Read it once for leftovers: a grep for `M4`, `credential_login_checks`,
   `generation`, `codeExpired`, `step 5` and `six users` is clean, but check section 4.1's field
   table, section 7's table, section 8's reload paragraph and section 9's graph paragraph for
   wording that still assumes a saved connection takes the step or a phone menu entry exists.
3. Section 5.5 still has the row "A code device's read code"; check it against the new `used`
   rule (a used code is not carried back).

## Gotchas

- A player drop keeps the item's `owner` in `objects_added` (`game.rb:1143-1166`), so the pickup
  test must skip player drops as well as authored objects. The plan uses `droppedItems` for that.
- Grep finds three sites that build the lockout key, not four (`game.rb:3483`, `:3580`,
  `access_work.rb:1393`); `credential_login.rb:59` calls `account_locked_out_at?`.
- `mfa_prompt_sent` carries no `request` detail on purpose: the log helper merges only exact
  repeats, so a per-request number would stop the run merging.
- Unverified pointers taken from the review: `episode-model.js:518-547`,
  `minigame-starters.js:1334-1350`, `games_controller.rb:3384-3399` (declared grants),
  `social_feed.rb:265-273`.

## Files touched

- `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md`
- `docs/agents/ops_layer/reviews/OPS_MFA_HELPDESK_DECISIONS.md`
- this note
