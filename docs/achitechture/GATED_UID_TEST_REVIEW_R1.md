# Gated-door UID-only after-promotion test: review R1 (2026-11-14)

Scope: the test-only commit 6eecede4c on build/hard-tg-uid (range b83696932..6eecede4c). Reviews
the carried fixture and the two test files. No production code changed by the commit, and this
review changed none either.

Files reviewed:

- test/support/gated_uid_scenario.rb
- test/models/break_escape/gated_uid_only_after_promotion_test.rb
- test/controllers/break_escape/gated_uid_only_after_promotion_controller_test.rb
- docs/achitechture/GATED_DOOR_SERVER_CHECK_BUILD_LOG.md (build-log note)

## Verdict: SHIP

Counts: 0 Blocker, 0 Major, 3 Minor.

## What was checked

### Assertions traced against the real code

Each assertion was read against game.rb and found true for the right reason:

- rfid_lock_passes? / rfid_passing_card_id (game.rb:3104, 3161). The safes carry access.roles, so
  acl_lock? is true and the access-list path runs. held_rfid_cards (game.rb:3058) marks the exec
  card id held UID-only via the serverClones branch (cloner held). rfid_passing_card_id skips a
  UID-only held id unless the lock has acceptsUIDOnly (line 3165), so uid_safe passes and
  strict_safe refuses. rfid_identity_passes? (game.rb:3090) admits the id because the exec NPC's
  creds.card matches and acl_admits? honours the single role string. The forged-id and
  cloner-not-held model tests exercise the two refusal branches (no held entry; serverClones
  ignored while no rfid_cloner is held).
- uid_only_refusal? (game.rb:3192). Returns false for an acceptsUIDOnly lock (line 3199) and false
  for an object in an unpromoted route room (line 3195); after promotion it returns true for the
  strict safe because held[id] is a UID-only copy that passes the identity check. Both the model
  test and the controller test prove the before/after split.
- object_in_unpromoted_route_room? (game.rb:244). login_scope_of resolves the safe to secure_area;
  true only while the room is in npcRouteRooms and not in unlockedRooms.
- promote_route_room! and apply_credit_on_pass! (game.rb:396, 373). The promotion test asserts the
  room moves to unlockedRooms, leaves npcRouteRooms, sets only the viaPass credit global, leaves
  the viaCredential global unset, and unlocks no object. apply_credit_on_pass! writes the credit
  global through write_server_globals! and completes tailgate_in trusted.
- migrate_soft_locked_route_rooms! (game.rb:517). The uncredited game is demoted back to
  npcRouteRooms and its UID objects are re-gated; the credited game (kp_badge_tailgated true) is
  left in unlockedRooms. route_room_soft_locked? (game.rb:595) is the branch each test drives.

Mutation proof: the UID guard at game.rb:3165 (`next false if held[card_id] &&
lock['acceptsUIDOnly'] != true`) was disabled locally. Three new tests failed, among them
"the strict safe refuses the UID copy and answers uid_only after promotion" (the strict safe
served its contents with HTTP 200). The file was restored with git checkout of game.rb in this
worktree only; the tree is clean afterwards (only the pre-existing untracked node_modules remains).

### Fixture faithfulness

Faithful. The split gate (openFor, openRadius, playerMayPassIf, creditOnPass.viaPass/viaCredential
with setGlobal and completeTask) is the shape of scenarios/lab_physical_pentest (gate at
scenario line 1372, same global names kp_badge_tailgated / kp_records_cloned and the same
tailgate_in task) and scenarios/test_gate_tailgate. The acceptsUIDOnly pair of safes keyed to a
role, with a sibling lock that omits acceptsUIDOnly, mirrors scenarios/test_access_doors
(lines 289-301), as does the exec NPC carrying a creds.card with rfid_protocol MIFARE_DESFire
(line 277). The single `role` string on the NPC matches the real convention (test_access_doors
uses `"role": "finance"`), and identity_roles reads the singular key. The hand-written
uid_clone_state matches what POST /clone_card writes for a DESFire source, and the controller test
(line 39) asserts that exact shape from the real route, so the model-level injection is validated
against the writer.

### Controller tests drive the real routes

Yes. The controller test posts clone_card, wear, unlock (door npc and object rfid) and
sync_state, and reads response codes and parsed bodies. It does not call model helpers to stand in
for a route. The forbidden/room_not_reachable, the unprocessable_entity/uid_only and the success
contents paths are all taken through GamesController#unlock.

### test/support loading

Safe. Both test files load the fixture with an explicit require_relative, the same way
access_model_scenario.rb, network_model_scenario.rb and access_social_scenario.rb are loaded by
their own tests. test_helper.rb does not auto-glob test/support, and the fixture is a
module_function module (GatedUidScenario) that monkeypatches nothing, so it cannot leak into
other tests.

### Missing cases

None of the deferred UID cases are missing. Plan test 11b's UID slice (acceptsUIDOnly accepted
after promotion) and item 12's uid_only feedback leak, the two pieces genuinely carried from
Chunk A, are both proven on real objects. The generic object-gate proofs the plan also names,
11b's unlock_object task completion and 11c's object re-post idempotency, already live in
gated_door_credit_controller_test (lines 165, 184, 206) for the non-UID object, so they are not
re-asserted here by design.

## Findings

- Minor 1 (gated_uid_only_after_promotion_test.rb:99). "promoting the route room re-opens and
  re-locks nothing it should not" asserts before_unlocked_objects equals
  Array(state['unlockedObjects']); both sides derive from an absent list, so the equality is []
  vs []. It proves promotion unlocks no object, but would still pass if unlockedObjects stayed
  nil. The stronger guard is the controller test (line 57, refute_includes 'uid_safe' straight
  after promotion), so this is a weak-equality note, not a hole. Scenario: a regression that left
  unlockedObjects nil through promotion would pass this line but fail the controller line.
- Minor 2 (gated_uid_only_after_promotion_controller_test.rb:32-63). The after-promotion UID path
  proves contents served and unlockedObjects membership, but asserts no unlock_object task
  completion or object re-post idempotency, because the fixture's only task (tailgate_in) is
  completed by the gate credit rather than by opening a safe. Covered for the generic object in
  gated_door_credit_controller_test, so nothing is missing; worth one line in the build log that
  the UID fixture's safes carry no object task. Scenario: a future UID lock that must complete an
  unlock_object task on open has no UID-specific proof.
- Minor 3 (gated_uid_scenario.rb:53). Len's eventMapping len_never_fires -> unlockDoor
  secure_area is never fired by any test. It echoes the real load-bearing phantom unlockDoor
  pattern, so keeping it reads as deliberate realism, but it is dead weight in the fixture and
  could mislead a later reader into thinking a test drives it. Scenario: none functional; a
  readability nit only.

## Tests run (no full suites)

- New files: gated_uid_only_after_promotion_test.rb and
  gated_uid_only_after_promotion_controller_test.rb together: 14 runs, 72 assertions, 0 failures,
  0 errors.
- Gated neighbours: gated_door_credit, gated_route_room, gated_server_completed_task (model and
  controller) and lab_gated_migration: 51 runs, 221 assertions, 0 failures, 0 errors.
- Mutation run (guard disabled): 3 failures, as expected; restored, tree clean.
