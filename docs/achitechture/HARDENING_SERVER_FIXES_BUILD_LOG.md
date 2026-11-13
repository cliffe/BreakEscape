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

## Item 5 — grant_foothold_actions skips `_` note keys

Status: already implemented (step 2b), confirmed, no change needed.

`NetworkModel.grant_foothold_actions` (`lib/break_escape/network_model.rb:256`) already walks the
scenario with `AuthorNotes.each_live`, which skips `_` note keys, so a grant parked in a note never
widens the server's allow list while a grant in free data (a minigame action list) is honoured.
Tests prove it: `test/controllers/break_escape/network_notes_not_live_test.rb` (a grant inside a
`_draft` note is not enumerated and its implant is refused `no_action`; an `_annex` room id is
honoured) and `test/unit/network_model_test.rb`. Both green (31 runs).

## Item 6 — dismissBlockingUi carried on while still blocked

Status: clear bug, fixed (test bridge).

`__test.dismissBlockingUi` (`public/break_escape/js/systems/test-bridge/index.js`) clicked the
button then answered `ok: true` with `stillBlocked: !!detectBlockingUi()`. A caller that trusts
`ok` (a scripted `dismiss` step) carried on against a page that was still blocked, for instance
after dismissing the tutorial prompt that sits over the session-resume overlay at startup.

Fix: when a blocker remains after the click, return `fail('still-blocked-after-dismiss', { clicked,
stillBlocked: true, blocker })`; return `ok: true, stillBlocked: false` only when the page is clear.
The `.claude/skills/*` playtest bootstrap loop ignores the return value and re-reads blocking each
pass, so it is unaffected; the `dismiss` step command and the `tools/` callers now see the failure.

Proof: browser proof on :3620 (game 3138, m01), real bridge + DOM, three cases:
- dismiss a blocker that reveals a second → `ok:false`, reason `still-blocked-after-dismiss`;
- dismiss that second while the mission's own UI still covers the canvas → `ok:false` (no carry-on);
- dismiss an overlay over a clear canvas → `ok:true`, `stillBlocked:false`.
Script `scratchpad/hard-fixes/dismiss-proof.mjs` (PROOF PASS). Doc updated: `docs/test-bridge.md`.
Related, left open: backlog line of 2026-11-13 (barkDelay R2 n2) covers the wider pressKey/_pick
"no change" reporting and getState hiding blockingUi during a minigame; out of scope here.
