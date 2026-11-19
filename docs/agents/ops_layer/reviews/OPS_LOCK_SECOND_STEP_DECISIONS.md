# OPS_LOCK_SECOND_STEP_PLAN.md, reviser decisions

## Round 1 (reviser on Opus 5.5, 2026-11-19)

- B1: adopted. Rule C (`step_ancestors`, `behind_closed_step?`, modelled on `path_unlocked?`) in 5.2, with a two-column exits table. Verified: `/unlock` (Rule C inside `validate_unlock` beside `unlock_scope_refused?`, feedback helpers answer nil), plain `GET /container` (404 as invented), scope branches and the share and sign-in desktop takes (already refuse by their path test, since a gate object is locked), room-object and released-container takes, the inventory copy.
- M1: adopted. Resolve once first; first factor judged with the shortcut (`game.rb:4695-4698`) off for an unopened gate object; `flag_reward` skips only when `flag_reward_unlocks_object?` holds.
- M2: adopted. Server `npc` rule kept; section 2 now says the only NPC unlock path today is doors; chat-helpers edit dropped; K9 rewritten as a PIN pad close-and-retry beat; crafted `npc` post is a controller test.
- M3: adopted. Step handled once in `ApiClient.unlock` (callers listed in section 2, verified). Not quite "one place": `notifyServerUnlock` swallows rejections and its callers pass answers to `unlockTarget` untested, so a cancelled marker plus a guard in `unlockTarget` is also needed. `doors.js:699` kept only in the 5.3 split-gated row, as unreachable for a gated room.
- m1: adopted; propped door is best-effort, skips the step; question 2 still to reword (see handover).
- m2: adopted (share and desktop takes tabled; one-level search noted).
- m3: adopted, with a twist: the answer uses the gate's resolved object only when `second_step_ids` is non-empty, so existing scenarios keep the old finder call.
- m4: adopted (nested takeable may carry the step; rule stated in section 4 and tested).
- n1: partly done (MFA summary cut, section 13 tail cut). Section 7, door table vs question 2, and further trims not done.
- Orchestrator log note: `by` renamed `approver`; `as: { npc: }` only when the pane names the owner (it does for every kind as planned), else nil. The log plan's text says "seven" `mfa_*` events while both tables list eight; flagged, not changed.
