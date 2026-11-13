# Hardening server fixes build log (2026-11-13)

Branch `build/hard-fixes`. A batch of small server/engine items from the ideas backlog.
Worktree `.claude/worktrees/p-hard-fixes`, ports 3620/3621.

## Item 1 — Hot-desk guest claim mismatch (autoLockMin 0)

Status: clear bug, fixed.

Reproduced on the code: with a hot-desk policy of `autoLockMin: 0` the guest claim is
refused (`app/models/break_escape/game.rb:2307-2308`), but `record_borrow_done!`
(`app/models/break_escape/npc_frustration.rb`) still wrote a `guestSessions` record (it
checked only `careful_guest?` and `account_locked_out_at?`), so `borrow_body` answered
`guest: true` and the client `onGuestLeft` (`public/break_escape/js/systems/workstation-state.js`)
opened the session. The player saw an open session whose claim was then refused.

Fix: a policy with `autoLockMin: 0` locks the screen the instant anyone leaves, so no guest
session is open there (the owner-leave roll already locks outright on such a policy).
- Server: new `policy_locks_guest_outright?(pc)` helper; `record_borrow_done!` now deletes the
  guest record for such a PC, so `borrow_body` reads no record and answers `guest: false`.
- Client: `onGuestLeft` locks the screen outright and opens no guest session when
  `autoLockMin === 0`, mirroring `guestClaimRefused`'s publish/emit.

Tests:
- `test/controllers/break_escape/npc_workaround_h_test.rb` — new test: a kiosk (`autoLockMin 0`)
  hot desk leaves no guest record and the borrow answers `guest: false`; the claim is refused.
- `test/js/workstation-state.test.mjs` — new test: `autoLockMin 0` locks the hot desk on the
  leave, opens no guest session, emits `workstation_auto_locked`, next click is the sign-in screen.
