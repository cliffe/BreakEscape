# Hard-fixes2 adversarial review, round 2 (confirmation)

Branch `build/hard-fixes2`, commits `6b2344e20..540c3d87e`. Read-only review of the hot-desk
autoLockMin 0 lock change (train 31 follow-up), confirming round 1
(`HARDENING_FIXES2_REVIEW_R1.md`). Worktree `.claude/worktrees/p-hard-fixes2`, ports 3644/3645.

The change: at a no-owner hot desk whose policy is `autoLockMin 0`, the screen now locks outright
on the real event `npc_borrowed_session:<pcId>` (new `onBorrowedSession`,
`workstation-state.js:303`) instead of in `onGuestLeft` (which never fires there, since the server
answers `guest: false` and sends no `npc_guest_left`). The dead `min === 0` branch is removed from
`onGuestLeft`. `data.screenLocked = true` is set on that lock and in `guestClaimRefused`, so the
test bridge reads the real state rather than `null`.

Counts: 0 blockers, 0 majors, 4 minors (all observations, no change required).

## Blockers

None.

## Majors

None.

## Minors

- m1 (confirms R1 m1, benign). Two listeners fire on `npc_borrowed_session:<pcId>`:
  `pc-sessions.js:148` (`sat` -> `displaced`) and `workstation-state.js:219`
  (`onBorrowedSession`). Order does not matter. `onBorrowedSession` emits
  `workstation_auto_locked:<pcId>`, which `pc-sessions.js:143` turns into `screenAutoLocked`, but
  `screenAutoLocked` (`pc-sessions.js:358-360`) acts only on a `via === 'claim'` session. At a
  no-owner autoLockMin 0 PC the server refuses the guest claim, so no claim session can exist
  there, and `screenAutoLocked` is a no-op. `displaced` (`pc-sessions.js:383-395`) ends any
  password or remote session the player held there, reading and deleting
  `this.sessions.get(pcId)` synchronously before its first await, so there is no double logout and
  no conflicting message. The `sat` listener on `npc_borrowed_session` is pre-existing
  (`pc-sessions.js` is not in this change's diff), so the new handler adds no new double-handling.
  No change needed; a one-line module note on the pairing would help a future reader.

- m2 (confirms R1 m2). Two borrows in a row at the same autoLockMin 0 PC: the second
  `npc_borrowed_session` re-enters `onBorrowedSession` and re-emits `workstation_auto_locked` and
  `workstation_screen_changed` (how `auto`) with state already locked. State is idempotent; the
  only effect is the office-visuals cue replaying and a no-op `screenAutoLocked`. Intentional (a
  fresh borrow did end and re-lock). No change needed.

- m3 (confirms R1 m3). `isLocked(objectId)` (`workstation-state.js:455-463`) is owner-gated and
  returns false for a no-owner PC, so `data.screenLocked = true` on a hot desk is not read by
  `isLocked`. This gates nothing player-visible: `screen-states.apply` bails at `_eligible`
  (`screen-states.js:67-72, 81`), which itself requires an owner, so the locked texture was never
  drawn for a hot desk and `screen-states` plays no sound for it (the `loud` listener at
  `screen-states.js:134` returns null for a no-owner PC). The player-visible lock feedback for the
  hot desk is the office-visuals flash/glyph/chime keyed on `workstation_screen_changed` how
  `auto` (`npc-office-visuals.js:387`, no owner required), which the fix emits via
  `_changed(data, npcId, true, 'auto')` (`workstation-state.js:319`), the same emission
  `_autoLock` uses (`workstation-state.js:483`). So `isLocked`'s owner gate is orthogonal to the
  hot-desk feedback, and the fix closes the real gap (the unset bridge field). No change needed.

- m4 (fresh, benign improvement). `guestClaimRefused` now sets `data.screenLocked = true`
  (`workstation-state.js:393`). For an owned PC whose owner is away (the usual case for a refused
  guest claim), this additionally makes `isLocked` return true, so `screen-states` will now draw
  the locked texture after a refusal, where before the texture did not follow the refusal even
  though the globals and the cue said locked. This is a consistency fix, not a regression: the
  screen is genuinely locked after the refusal, and `onReturned` still clears `screenLocked` when
  the owner comes back. No change needed; noting it because the change touches an owned-PC path.

## Correctness on every path (fresh pass)

- Owned PC (any policy): `onBorrowedSession` returns false at the `ownerOf` guard
  (`workstation-state.js:309`). Unchanged. The only owned-PC behaviour change is m4.
- No-owner PC, policy above 0 or none: `onBorrowedSession` returns false at the
  `autoLockMin !== 0` guard (`workstation-state.js:311`), leaving the open session to the guest
  flow (`onGuestLeft`). New test `workstation-state.test.mjs` "train 31: ... a borrow at a policy
  above 0 is left to the guest flow" pins this (asserts no outright lock and no
  `workstation_auto_locked`).
- No-owner PC, autoLockMin 0: locks outright, deletes any guest record, sets `data.screenLocked`,
  publishes both globals, emits `workstation_auto_locked` and `workstation_screen_changed` (how
  `auto`). Next click is `signin`.
- Reload: `onBorrowedSession` fires only on a live event during play; on reload the guests map
  starts empty and the globals reset false. Unchanged.
- Listeners of `workstation_auto_locked`: only `screen-states` (`loud`, no-op for a no-owner PC)
  and `pc-sessions` (`screenAutoLocked`, no-op without a claim session). No separate sound or
  lighting listener on `workstation_auto_locked`; lighting fires through `npc-office-visuals`
  `onScreenChanged` on `workstation_screen_changed`, which the fix emits. All covered.

## Cheat policy and sync size

Unchanged from R1 and confirmed. The client now agrees with the server's hard refusal of a guest
claim at an autoLockMin 0 PC; no honest path is blocked. `data.screenLocked` is a client-only
sprite field, not synced and not in `player_state`; the two globals the lock publishes are a fixed
per-workstation boolean pair already written before this change. No growth, no re-sent state.

## Tests

Ran as single files (no lock), all green:
- `test/js/workstation-state.test.mjs` 55 pass / 0 fail
- `test/js/test-bridge-access.test.mjs` 15 pass / 0 fail
- `test/js/screen-states.test.mjs` 24 pass / 0 fail
- `test/js/npc-lockout.test.mjs` 32 pass / 0 fail
- `test/js/pc-sessions.test.mjs` 34 pass / 0 fail

The new tests are load-bearing: the bridge test and the `slice 16 m4` test call
`ws.onBorrowedSession(...)` directly and assert `screenLocked === true`, which cannot pass without
both the new handler and the `data.screenLocked` set (the field read `null` before, and the
handler did not exist).

## Browser check

Not run on my port. The real `npc_borrowed_session` lock can only be driven live by temporarily
giving a committed scenario's hot desk an `autoLockMin 0` policy and an NPC borrow, which is
editing a committed scenario. The builder did exactly this on `:3640` with `test_access_work`,
reverted uncommitted, and logged a PROOF PASS (build log "Follow-up (train 31 live check)", script
`scratchpad/hard-fixes2/hotdesk-lock-proof.mjs`): the live bridge read `screenLocked: true`,
`guest: null`, both globals true, and the two events fired with no `npc_guest_left`. I rely on
that documented live proof plus the bridge unit test, which exercises the real
`test-bridge/access.js` reader against a live `WorkstationState`.

## Verdict

PASS (confirmation). R1's three minors are confirmed as observations that need no change, and one
further benign owned-PC improvement (m4) was found. The change is correct on every path, the new
handler leaves owned-PC and policy-above-0 paths unchanged, the bridge now reports the real locked
state, and the change is clean under the cheat and sync-size rules. No blockers or majors.
