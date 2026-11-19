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
- Orchestrator log note (first reviser): `by` renamed `approver`; `as: { npc: }` only when the pane names the owner (it does for every kind as planned), else nil. The log plan's text says "seven" `mfa_*` events while both tables list eight; flagged, not changed.

## Round 1b (second reviser, Opus 5.5, 2026-11-19)

- M1: already done (`approver`); `own_phone` now never written for a lock.
- M2: adopted per orchestrator ruling. Open question 8 (recommend no carry-over); lock routes ignore `accountResets`, verify uses the owner's `code_device`, approve needs the owner's held phone, `ownPhone` dropped, `own=1` lists no lock request; kind registered with the MFA plan's `device_in_use?`. Controller test added.
- M3: adopted. Request 1 rewritten as a numbered list by MFA section; items 1-7 marked met by MFA request 11 (commit 629b8cc07); item 8 (answer again from a live record) still asked. Client: `takeCompleted(subject)`, `MfaClient` emits the events.
- m1: follow the MFA rule (push refused only for `phone: false`); the never-passable rule covers holding the phone where the lock is needed.
- m2: adopted; sets built from every authored home, independent of holding.
- m3: adopted; `secondStep` joins the `access`/`acceptsUIDOnly` error list at `validate_scenario.rb:8059`.
- m4: adopted; validator errors for `secondStep` on `startRoom` or an awareness world room, and for an `unlock_object` task naming a gated object by anything but its id. 5.3 states `GET /room` is the only other `unlockedRooms` writer and is safe under that rule.
- m5: adopted; 40-character id rule in the validator; closed `method` list; request 5 now asks for `places`, notes "seven" should read eight; Q3(c) no longer calls lockpick a lock type.
- m6: adopted; `badge_swipe` timing in section 13, K11, request 5 and the L2 controller row.
- m7: adopted; `gameClock`, `assert_ops_log_holds_no_secret`, secret-guard unit case, validator spec per error, graph test file, `lock_key_diff` unchanged check, JS dependency on MFA M1b copy lists.
- m8: adopted; section 8 says passed records persist and resets drop them.
- n1: room `lockType` pointer fixed; `infusion_pump`, `backup_recovery` removed. n2: in request 5. n3: `object:<id>`/`door:<room>` key as `PinDust`. n4: section 10.
- Orchestrator notes: `save_limit: true` wording; closed method list. Length not yet under 650 (709); see handover.
