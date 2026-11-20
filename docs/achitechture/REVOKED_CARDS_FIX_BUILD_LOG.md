# Revoked RFID cards still open access-list doors: fix build log

Branch `build/revoked-cards`. Date 2026-11-13.

## Finding

From UX_FEEDBACK_ROUND_PLAN_REVIEW_R1.md M2 (branch build/ux-feedback). A cancelled
(revoked) access card still opened doors:

- The left-card consequence (NPC_NEEDS_SYSTEM.md 3.3b) cancels a card when its owner
  returns and finds it gone. The client runs a `revoke_card` action
  (apply-actions.js), which unions the id into the `revoked_card_ids` global.
- The requires-based rfid path already dropped a revoked card client-side
  (unlock-system.js `evaluateRfidCredential` reads `window.isCardRevoked`), but
  `heldRfidCardIds()` (the access-list path) did not filter it, so the client still
  sent a cancelled id to the server.
- The server kept no record of revocation at all. `Game#held_rfid_cards`,
  `rfid_passing_card_id` and `rfid_lock_passes?` never consulted the revoked set, so
  a cancelled card (or a saved clone of it) opened an access-list door, a role door
  and a requires-only rfid door.

## What the server can know

Revocation is authored as a `revoke_card` action on an object's
`onOwnerNoticesMissing`, fired by the client needs system
(`npc_left_item_gone:<owner>`). The owner returning to its post is a client-only
timing event, so the server cannot derive the cancellation from its own state. It is
a client-set global. The fix therefore records it server-side and makes the record
sticky (grow-only), rather than deriving it.

## Design

Cheat policy (user q78): access honest play could never reach must be refused; access
honest play reached must not be.

- `revoked_card_ids` stays an ordinary synced global (it still round-trips to the
  client for the UI filter), but `Game#merge_global_variables!` now merges it
  grow-only: a sync unions new ids and never removes one. A client that drops or
  clears the key on a later sync cannot un-revoke a card the server has recorded. The
  set is bounded (the unique cancelled card ids, a handful at most), so this respects
  the sync size rule: no per-sync growth, a small array that round-trips unchanged.
- `Game#revoked_card_ids` reads that global as the server's authoritative set.
- `Game#held_rfid_cards` excludes every revoked id (keycards and saved clones), so the
  access-list path (`rfid_passing_card_id`), the card-answer naming and
  `uid_only_refusal?` all refuse a cancelled card and a clone of one.
- `Game#rfid_lock_passes?` adds `rfid_requires_revoked?` for the trusted requires
  paths (a lock with no access list, or an access list opened by its requires with no
  card_ids sent). It refuses only when every required card the server can see the
  player hold (keycard inventory, or a saved clone while the copier is held) is
  revoked and none is live. Where the server sees no held required card the trust
  rule is unchanged, so no honest unlock is newly refused. The access-list card path
  is already filtered through `held_rfid_cards`, so a mixed door still opens via a
  live admitted card when its requires card is revoked.
- Client: `unlock-system.js heldRfidCardIds()` now drops revoked ids, so the UI never
  offers a cancelled card and never asks the server to open an access-list door with
  one. The server refuses it anyway; the two now agree.
- Validator: `check_revoke_card_globals` errors when a scenario uses a `revoke_card`
  action but does not declare `globalVariables.revoked_card_ids` as an array. Without
  the declared default the cancellation is unenforceable (no server seed, no client
  base value). Both scenarios that use revoke_card (test_clone_left_card,
  lab_physical_pentest) already declare it.

Door kinds covered: access-list (role and people) doors and objects, requires-only
rfid doors, mixed (requires plus access) doors, and saved clones of a revoked card.

## Tests

- Rails, through the real POST /unlock route
  (`test/controllers/break_escape/access_model_rfid_test.rb`): a revoked keycard is
  refused at an access-list door; a revoked card's saved clone is refused; a revoked
  id does not block a live card that also admits (honest play not refused); a revoked
  card is refused at a requires-only rfid door (with and without card_ids); a revoked
  requires card is refused at a mixed door. Reverting the server fix (neutralising
  `revoked_card_ids`) turns 4 of the 5 red; the positive "not refused" case stays
  green both ways, as intended.
- Rails model (`test/models/break_escape/game_test.rb`): the grow-only merge keeps a
  card revoked when a client resends an empty array or drops the key.
- Node (`test/js/rfid-revocation.test.mjs`): `heldRfidCardIds` drops a revoked id (card
  and clone) and keeps a live one; keeps every id when nothing is revoked.

Results:
- `access_model_rfid_test.rb`: 43 runs, 163 assertions, 0 failures.
- `game_test.rb` revoked_card_ids test: 1 run, 3 assertions, 0 failures.
- Regression batch (unlock_system_test, clone_card_saved_cards_test,
  access_model_rfid_test, sync_payload_size_test): 106 runs, 0 failures.
  carry_over_test + game_test: 126 runs, 0 failures. carry_over_server_owned_globals:
  1 run, 0 failures.
- Node: rfid-revocation (7), access-rfid-acl (26), rfid-clone-entry (9),
  revoke-card-action (5), access-remote-signin (15), lockpick-close-toast (4),
  locked-hint-refusals (9), all 0 fail.
- Validator (--no-graph) on test_clone_left_card and lab_physical_pentest: 0 errors
  each. With revoked_card_ids set to a non-array, the new check raises the expected
  error.

## Live result

Keyless server on port 3290 (TTS off), game 2409 created from test_clone_left_card via
tools/playtest/swap-scenario-game.rb (no db:seed). The vault door is a requires-only
rfid door (requires clerk_card). On the live persisted game row, through the real
`validate_unlock` path:
- Not revoked: a saved clone of clerk_card opens the vault (honest play reached, not
  refused).
- Revoked: the same clone is refused.
- Client then resends an empty revoked_card_ids: the server keeps clerk_card revoked
  (grow-only) and still refuses the vault.

The HTTP controller layer is covered by the ActionDispatch integration tests above
(the browser route needs a CSRF token and session the model proof does not). Server
stopped afterwards.

## Handover

Done: server enforcement (held_rfid_cards exclusion, rfid_requires_revoked?,
grow-only merge), client heldRfidCardIds filter, validator check, Rails + node tests,
live proof. No open items. Files touched below. The orchestrator runs the full suites
and the merge-batch validator under the lock.

Files:
- app/models/break_escape/game.rb
- public/break_escape/js/systems/unlock-system.js
- scripts/validate_scenario.rb
- test/controllers/break_escape/access_model_rfid_test.rb
- test/models/break_escape/game_test.rb
- test/js/rfid-revocation.test.mjs
- docs/achitechture/REVOKED_CARDS_FIX_BUILD_LOG.md
