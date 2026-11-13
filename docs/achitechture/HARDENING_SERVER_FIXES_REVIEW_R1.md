# Hardening server fixes - adversarial review R1 (2026-11-13)

Branch `build/hard-fixes`, commits `2f5471209..e23f4b76a` (items 1, 3, 5, 6 built; items 2, 4, 7
decisions/design only). Read-only review; commits after e23f4b76a (second builder, items 2 and 4)
are out of scope. Reviewer ran the touched test files only, no full suites.

Severity counts: blockers 0, majors 1, minors 5.

## Verdict

Approve the three built fixes (items 1, 3, 6) and the item 5 confirmation. Each lands on the path
the game runs, and every new test fails without its fix (verified by mutation, except the item 1
Rails negative re-run, blocked by the auto-mode classifier mid-run and established by code logic
plus the item 1 client negative proof). One cue-parity minor on item 1 and one missing regression
test on item 6 should be tidied but do not block. Item 7 is design only; its cheat-policy fallback
needs the conditionality in M1 nailed down before anyone builds it.

## Item 1 - hot desk with autoLockMin 0

Rule is now consistent across the paths asked about:
- Borrow done: `record_borrow_done!` deletes the guest record when `policy_locks_guest_outright?`
  (npc_frustration.rb:282-287, 380), so `borrow_body` reads no record and answers `guest: false`.
  The `pc_id` resolution was refactored to keep the `pc` object but is value-identical to the old
  `borrow_pc_id(w)` (npc_frustration.rb:373-374).
- Guest leaves (client): `onGuestLeft` locks outright and opens no guest session for `min === 0`
  (workstation-state.js:302-308), matching the server's refusal (game.rb:2307-2308).
- Reload mid-borrow: server holds no record, so the client rebuilds no guest on load - consistent.
- Policy change: no runtime policy mutation exists in the engine or server (grep found none);
  `autoLockMin` is fixed per scenario, so this path is moot and cannot diverge.

No NPC beat is lost: with `autoLockMin 0` the guest claim was always refused, so no player could
use that session and no server consumer reads a guest session the player cannot claim. The fix only
removes a session that was already dead on arrival.

### Findings

- minor (cue parity) - workstation-state.js:302-308. The `min === 0` branch emits
  `workstation_auto_locked` but not `workstation_screen_changed`, unlike the two sibling
  outright-lock paths `guestClaimRefused` (line 373-374) and `_autoLock` (line 461-462), which both
  call `_changed(..., true, 'auto')`. `npc-office-visuals.js` keys its lock cue (flash/glyph, chime)
  solely on `workstation_screen_changed:*` (line 580), so the kiosk guest-leave auto-lock plays no
  lock cue. `screen-states.js` still gets the locked visual via `workstation_auto_locked:*`, so the
  screen state is right; only the office-visuals cue is missed. The build log's claim that the
  branch mirrors "guestClaimRefused's publish/emit" is inaccurate on this point. Suggested fix: add
  `this._changed(this._find(pcId) || { id: pcId }, npcId, true, 'auto');` inside the branch.
- minor (stale-record robustness) - game.rb:2307-2308. The guest-claim refusal
  "policy autoLockMin is 0" returns without purging the guest record, unlike the locked-out and
  timed-out branches that call `end_guest_session_at!`. Only reachable if a record predates a
  flip to `autoLockMin 0`, which cannot happen today (record is deleted at borrow-done, policies are
  static). Harmless now; add the purge if runtime policy changes are ever introduced.

Test: `npc_workaround_h_test.rb` "slice 16 m4" exercises the real borrow/done/claim controller path
(35 runs, 257 assertions green). `workstation-state.test.mjs` "slice 16 m4" drives the real
`npc_guest_left:*` handler and asserts no guest, locked globals, the auto_locked payload, no
owner_left, and a sign-in next click (54 runs green). The JS test fails without the client fix
(confirmed by mutation: `not ok 44`). The Rails test fails without the server fix by the same
reasoning (without `policy_locks_guest_outright?` the kiosk record is never deleted, so `guest:true`
and a non-empty `guestSessions`, both asserted false); the mutation re-run was blocked by the
auto-mode classifier, so this one is logic plus the client empirical proof, not a fresh red run.

## Item 3 - a cut exchange releases its hold

Correct for every case asked about:
- Frozen NPC: `_releaseExchangeHold` guard `job.phase !== 'using'` passes because freeze keeps phase
  `using` and only sets `useRemaining` (npc-needs.js:1293). The arithmetic works out: new
  `useRemaining = max(0, (knotEnd - freezeAt) - (knotEnd - preHoldEnd)) = max(0, preHoldEnd -
  freezeAt)`, i.e. exactly the remaining pre-hold use, whether or not the pre-hold end was still
  ahead at freeze time. On unfreeze `useUntil` is recomputed from it (line 1306).
- Cut twice: after the first `_endChat`, `_finishExchange` nulls `c.ex`, and the release block is
  guarded by `if (c.ex)`, so a second call cannot double-subtract (npc-needs.js:2772, 2787).
- Heard in full: `over` is true, the `if (!over)` block is skipped, the completed hold is untouched
  (npc-needs.js:2791-2796).
- Reload: exchanges (`c.ex`, `_chats`) are runtime only, not serialised, so a reload carries no
  in-flight exchange; the fix neither helps nor harms it, which is correct.

### Findings

- minor (no action) - npc-needs.js:2778. A held side whose phase is not `using` (a queue front with
  a finite `useUntil`) is not released by the phase guard, but queued NPCs run off `queuedAt`, not
  `useUntil`, once `c.ex` clears, so the stale `useUntil` is never read. Harmless; flagged only so a
  later reader does not treat it as a leak.

Test: `npc-exchange-heard.test.mjs` adds the still-using and frozen cut cases, driving the real
`_startExchange`/`_endChat`/freeze path (17 runs green). Both fail without the fix (mutation:
`not ok 7`, `not ok 8`).

## Item 5 - grant_foothold_actions skips `_` notes

Confirmed, no change. `NetworkModel.grant_foothold_actions` walks via `AuthorNotes.each_live`, which
skips `_` notes and visits free data in full (network_model.rb:262-265), so a grant parked in a note
never widens the server allow list. `network_notes_not_live_test.rb` green (8 runs, 25 assertions).

## Item 6 - dismissBlockingUi reports a failure when still blocked

No caller now misreads the result. `fail()` returns `{ ok: false, reason, ... }` and never throws
(test-bridge/index.js:196-198), so callers that ignore the return are unaffected. Every repo caller
checked (tools/video/takes/*, tools/phone_calls/ps.js:578,676, tools/playtest/*) either `.catch`es
and re-reads `getState().blockingUi` to decide whether to keep going, or logs the result without
branching on `ok === true` to mean "done". None loops `while (ok) dismiss`, so `ok:false` cannot
end a loop early. The more honest `ok:false` is the intended behaviour for a caller that does trust
`ok`.

### Findings

- minor (coverage) - no committed regression test. The proof was a scratchpad browser script
  (`scratchpad/hard-fixes/dismiss-proof.mjs`, not in the tree), so nothing guards this one-branch
  change against regression. Suggest a small unit test over `dismissBlockingUi` with a stub that
  leaves a second blocker, or a note in the build log that it is browser-proof only.

## Item 7 - record landing-page build and phish send server-side (design only)

The analysis is accurate. `phish_page_evidence_holds?` reads `built`, `meetsThreshold` and
`victim.submitted` from client-synced `globalVariables.se_landing_pages`, and the landed send from
client-synced `mailState` (capture_proofs.rb:441-461), so a tampered client can forge both. The
foothold precedent holds: `player_state['footholds']` is written only by the locked
`network_plant`/`network_unplug` routes (network_access.rb:257-259) and sent to the client filtered
(`footholds_for_client`, games_controller.rb:428), a server-owned sub-store.

Sync size reasoning is right under the SYNC SIZE RULE: the proposed store is server-written, the
client never writes it back, and it is bounded by (authored pages) + (authored targets x kits),
both fixed per scenario, so it is a bounded delta, not an ever-growing re-send; retiring the
`se_landing_pages`/`mailState` trust also shrinks what each sync must be trusted for.

### Findings

- major (design) - capture_proofs.rb:445-448. The fallback "keep `meetsThreshold`/`victim.submitted`
  as client control-flow behind a server sanity check (authored page + authored landed send)" is
  only cheat-policy-safe if those two values are deterministic consequences of the authored page and
  landed send the server verifies. They are the exact gate on the reveal (`rec['meetsThreshold'] ==
  true`, `victim['submitted'] == true`). If they are independent client-asserted outcomes and
  `capture.secret` is a hard-access value (a lock code, PSK or flag), the fallback lets a tampered
  client forge them and be served the secret without running the phish minigame - access honest play
  reaches only through the minigame, which the CHEAT POLICY forbids for a hard secret. The design
  presents the server-side-threshold option as merely "preferred". Suggested fix: make the design
  state the conditionality - when `capture.secret` is itself a protected secret, moving the
  threshold/victim logic server-side is mandatory, not optional; the client-control-flow fallback is
  acceptable only when the served `capture.secret` is not a hard-access value. Otherwise the item,
  as designed, can be built in a way that reopens the very cheat it closes.
