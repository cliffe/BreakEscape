# Hard-fixes2 adversarial review, round 1

Branch `build/hard-fixes2`, commits `6b2344e20..56269f558`. Read-only review of the hot-desk
autoLockMin 0 lock change (train 31 follow-up). Worktree
`.claude/worktrees/p-hard-fixes2`. Item 3 checked against the main tree.

Scope reviewed:
- `public/break_escape/js/systems/workstation-state.js` (new `onBorrowedSession`, the dead
  `min === 0` branch removed from `onGuestLeft`, `data.screenLocked` set in `guestClaimRefused`).
- `test/js/workstation-state.test.mjs`, `test/js/test-bridge-access.test.mjs`.
- Build log `docs/achitechture/HARDENING_SERVER_FIXES_BUILD_LOG.md`, section
  "Follow-up (train 31 live check)".

Counts: 0 blockers, 0 majors, 3 minors.

## Blockers

None.

## Majors

None.

## Minors

- m1 (observation, benign). Two listeners now react to the same `npc_borrowed_session:<pcId>`:
  `pc-sessions.js:148` (`sat` -> `displaced`) and `workstation-state.js:219`
  (`onBorrowedSession`). For an autoLockMin 0 no-owner PC, `onBorrowedSession` then emits
  `workstation_auto_locked:<pcId>` (`workstation-state.js:315`), which `pc-sessions.js:143`
  turns into `screenAutoLocked`. Checked for a double sign-out: `displaced`
  (`pc-sessions.js:383`) and `screenAutoLocked` (`pc-sessions.js:358`) both read
  `this.sessions.get(pcId)` and delete it synchronously before any await, and
  `screenAutoLocked` additionally requires `via === 'claim'`. At an autoLockMin 0 no-owner hot
  desk the player can never hold a `via: 'claim'` session (the server refuses the guest claim,
  so no guest record is ever recorded), so `screenAutoLocked` is a no-op there and only
  `displaced` ends a password or remote session. No double logout, no conflicting message. This
  is correct, but the pairing is easy to miss and worth a line in the module doc.

- m2 (observation). Two borrows in a row at the same autoLockMin 0 PC: the second
  `npc_borrowed_session` re-enters `onBorrowedSession`, which re-emits `workstation_auto_locked`
  and `workstation_screen_changed` (how `auto`) even though `data.screenLocked` is already true.
  State is idempotent; the only effect is the office-visuals lock cue replaying and a no-op
  `screenAutoLocked`. Arguably right (a fresh borrow by a second NPC did end and lock), so no
  change needed, just noting it is intentional.

- m3 (pre-existing, out of scope for this change). `isLocked(objectId)`
  (`workstation-state.js:455`) returns false for a no-owner PC (it needs an owner away record),
  so `data.screenLocked = true` on a no-owner hot desk is not read by `isLocked`. This does not
  regress anything: `screen-states.js` only draws the owned-lock sprite texture for workstations
  with an owner (`_eligible`, `screen-states.js:66`), so a hot desk never used that texture. The
  player-visible lock feedback for the hot desk is the office-visuals cue keyed on
  `workstation_screen_changed` how `auto`, which the fix emits (`workstation-state.js:319`). The
  bridge reads `data.screenLocked` directly (item 2), which the fix now sets. So the unset field
  was a real gap and is now closed; `isLocked` staying owner-gated is orthogonal.

## Item 1 - correctness on every path

- Owned PC: `onBorrowedSession` guards with `ownerOf(data, ...)` and returns false
  (`workstation-state.js:310`). Untouched.
- No-owner PC, policy above 0 or none: `this._policy(data)?.autoLockMin !== 0` returns false
  (`workstation-state.js:311`). The open session is left to the guest flow (`onGuestLeft`), which
  the server's `guest: true` answer drives via `npc_guest_left`. Verified no double handling:
  for policy > 0 both events fire, but `onBorrowedSession` returns early and only `onGuestLeft`
  acts. New test `workstation-state.test.mjs` "train 31: npc_guest_left never opens a guest
  session at an autoLockMin 0 PC ... a borrow at a policy above 0 is left to the guest flow"
  pins this.
- No-owner PC, autoLockMin 0: locks outright, deletes any guest record, sets
  `data.screenLocked`, publishes both globals, emits `workstation_auto_locked` and
  `workstation_screen_changed` (how `auto`). The next click is `signin` (`onInteract`'s
  `!ownerId` branch finds no guest, `workstation-state.js:623-625`).
- Borrow ends with the NPC locking the screen (autoLockMin 0): the dispatched
  `npc_borrowed_session:<pcId>` is the end-of-borrow event (`npc-needs.js:3465`, emitted only when
  `b.leavesOpen`); the handler agrees with the server (`guest: false`, no `npc_guest_left`). Good.
- Reload mid-borrow: `resetGlobals` writes both globals false and the guests map starts empty
  (state not saved across a reload, per the module doc). Documented behaviour, unchanged.
- Two borrows in a row: see m2. Idempotent on state.

Nothing else listens to `npc_borrowed_session` beyond `pc-sessions.js` (m1) and this handler;
see the double-listener analysis above. No conflict in practice.

`data.screenLocked` in `guestClaimRefused` (`workstation-state.js:393`): client-only sprite
field, not sent to the server and not in `player_state`. The two globals it publishes
(`<pc>_screen_locked`, `<pc>_owner_away`) were already written by `_publishGuest` before this
change, so nothing new reaches the server or the player beyond the bridge now reporting the real
state. No player-visible or payload change.

## Item 2 - tests exercise the real event path and fail without the fix

The `slice 16 m4` test now drives `npc_borrowed_session` (the real event), not the dead
`npc_guest_left`, and asserts `pc.screenLocked === true` (the bridge field). The new bridge test
asserts `workstation('hot_desk').screenLocked === true` after a no-owner outright lock. Without
the fix both fail: `onBorrowedSession` does not exist (the direct call throws) and the
`npc_borrowed_session:*` handler is unwired (the `handlers['npc_borrowed_session:*']` lookup is
undefined), and the old `min === 0` branch never set `data.screenLocked` (so the bridge assertion
fails even if the event were reached). Confirmed by running the files:
`test/js/workstation-state.test.mjs` 55 pass, `test/js/test-bridge-access.test.mjs` 15 pass.
Importer spot-checks green: `screen-states` 24 pass, `npc-lockout` 32 pass.

## Item 3 - Ian's documented hot-desk borrow in test_access_work

Finding: this is a quirk of the driven keyless run, not a real engine or scenario bug. The
builder's stated cause ("the computed work plan routes his work through an un-gated email
source") does not match the engine.

The H1 mechanic is sound and is covered by a passing server controller test. Ian is `staff`
(`scenarios/test_access_work/scenario.json.erb:1646`); `roles.staff.workNeeds` is `["email"]`
(`scenario.json.erb:2838-2841`). His station `ian_pc` has `offWhen: ian_pc_unplugged`
(`scenario.json.erb:1549`), and his borrow workaround fires at frustration 50
(`scenario.json.erb:1685-1691`). The server treats a station `off` as a counted work failure:
`cause_candidates('off')` returns the station (`lib/break_escape/access_work.rb:488-489`) and
`cause_holds?('off')` reads the station's `offWhen`
(`lib/break_escape/access_work.rb:465-467`). `test/controllers/break_escape/npc_workaround_h_test.rb:66`
fails Ian with exactly `{ id: 'ian_pc', why: 'off' }` and asserts the borrow and
`guestSessions {hot_desk => ian}` (`npc_workaround_h_test.rb:151-158`).

On the client, the plan is the server-computed plan read off the NPC record (`_plan`,
`npc-needs.js:2099-2100`; no client-side `workNeeds` computation exists), so Ian's plan includes
`email` and the work need is judged (`_judged`, `npc-needs.js:2106-2109`). `_deadStation`
(`npc-needs.js:2125-2133`) then parks a judged work need whose own station is off as an `off`
give-up before any resource routing (`_giveUpReason`, `npc-needs.js:1800-1803`), and that `off`
park is counted toward frustration when judged (`npc-needs.js:1536-1537`). So a reachable,
un-gated `email` does not suppress the borrow; the dead station short-circuits to a counted fail
regardless. The builder's "ungated email" explanation is a misdiagnosis.

The reason the borrow did not fire on its own in the standalone driven run is timing: the needs
clock is not stepped while an outage holds or a failure park is running
(`scenarios/test_access_work/PLAYTEST.md:8`), so a single unplug parks Ian once and does not
accumulate the three counted off-fails the frustration-50 threshold needs within the driven loop.
Rosa's network-route outage (`finance_share` down, a `down` resource failure rather than a
station `off`) was the pragmatic driver for the proof and is equally valid. No fix made; flagged
for the test_access_work author that the build-log note mis-states the cause and that H1's
"wait for his third failure" step may need explicit re-attempts or clock steps to drive live.

## Cheat policy

The change makes the client agree with the server's hard refusal of a guest claim at an
autoLockMin 0 PC (no claimable session). It does not block any path honest play could reach that
the server would otherwise allow; it removes a client-only claimable session the server already
refuses. No secret, PIN, key or credential gating is touched. Compliant.

## Sync size

No growth. `data.screenLocked` is a client-only sprite field, not synced and not in
`player_state` (it appears only in `workstation-state.js` and as `sprite._screenLocked` in
`screen-states.js`). The two globals the lock publishes
(`<pc>_screen_locked`, `<pc>_owner_away`) are a fixed per-workstation pair of booleans already
written by `_publishGuest` before this change; the fix adds no keys and sets no unbounded value.
Each sync still carries the same bounded global set. Compliant.

## Verdict

PASS. No blockers or majors. The change is correct on every path reviewed, the tests exercise
the real event and fail without the fix, and it is clean under the cheat and sync-size rules. The
three minors are observations, not defects. Item 3 is a driven-run quirk, not a bug; the
build-log note mis-states its cause and should be corrected, but that is outside this change.
