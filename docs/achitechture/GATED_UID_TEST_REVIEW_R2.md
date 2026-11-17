# Gated-door UID-only after-promotion test: review R2 (2026-11-14)

Scope: the test-only change on build/hard-tg-uid, range b83696932..739fe62b0. Reviews the
carried fixture, the two new test files and the R1 answer in the build log, fresh and as a
whole, focusing on what R1 did not cover: flakiness, suite cost, fixture discoverability, and
the security bar from the angles the code allows. Review only; no code changed.

Files reviewed:

- test/support/gated_uid_scenario.rb
- test/models/break_escape/gated_uid_only_after_promotion_test.rb
- test/controllers/break_escape/gated_uid_only_after_promotion_controller_test.rb
- docs/achitechture/GATED_UID_TEST_REVIEW_R1.md and the R1 answer in
  docs/achitechture/GATED_DOOR_SERVER_CHECK_BUILD_LOG.md

## Verdict: SHIP

Counts (new in R2): 0 Blocker, 0 Major, 2 Minor. R1's 3 minors stand and are already
acknowledged in the build log; nothing in R2 reopens them.

## Flakiness: order, time, shared DB

Not flaky, traced and run.

- Order. Both files were run together and alone across four seeds (12345, 54321, 99, 7):
  14 runs / 72 assertions, 9 runs / 32, 5 runs / 40, all green, no order dependence. Each test
  builds its own game through create_access_game (test_helper.rb:44), which deep_dups the
  scenario and player_state, and the fixture returns a freshly built hash on every `scenario`
  call. The frozen constants (EXEC_CARD, CLONER, VEST) are only ever read or `.dup`d, so no test
  mutates state another test reads. The in-test mutations (`player_state['unlockedRooms'] <<`,
  the migrate and promote calls) act on that test's own game.
- Shared DB. The suite runs with transactional tests (Rails default, not disabled in
  test_helper.rb), so every game these tests insert is rolled back at the test boundary. No test
  asserts a row count or reads a game it did not create, so a game left by another worktree or
  another file cannot change an outcome. The brief's shared-DB warning is about db:* tasks, which
  this change does not touch.
- Time. No assertion depends on wall-clock time, timestamps or need decay. promote_route_room!,
  migrate_soft_locked_route_rooms! and the rfid checks are pure state transitions.

## Suite cost

Negligible. The two files together finish in about 0.4s (14 tests). No sleeps, no external
calls, no VM or browser. They add nothing a reviewer would notice against the gated-door
neighbours.

## Fixture discoverability and reuse

Good. test/support/gated_uid_scenario.rb sits beside access_model_scenario.rb,
network_model_scenario.rb, access_social_scenario.rb and access_work_scenario.rb and follows the
same shape: a module_function module loaded by require_relative, named after what it holds
(GatedUidScenario), with a header comment that states the room shape and the two safes. A future
author grepping test/support, or following the require_relative at the top of either test, finds
it at once. It is not auto-globbed, which is the project convention here, so reuse means adding
the same require_relative; that is consistent with every sibling and needs no change.

## Security bar: a forged card never opens anything

The change proves three refusal branches on real objects, through the model helper and the real
/unlock route:

- An id the server never recorded (FORGED-99) is refused at the UID safe, before and after
  promotion (model test line 45, controller line 105). held_rfid_cards (game.rb:3058) never keys
  it, so rfid_passing_card_id (game.rb:3161) returns nil.
- A recorded clone claimed without the cloner in hand is refused (model test line 52):
  held_rfid_cards only folds serverClones in while rfid_cloner_held? (game.rb:3066).
- A UID-only copy is refused at a lock without acceptsUIDOnly and answers uid_only only after
  promotion (model test line 72, controller lines 81 and 93), via the guard at game.rb:3165.

Two of the angles the brief names are not asserted, though I traced that the code refuses both,
so these are coverage gaps rather than holes (see Findings). The third angle, "a card id from
another scenario", is the same branch as FORGED-99: held_rfid_cards is built only from this
game's keycard definitions and this game's serverClones, so any id the server did not record for
this game fails held.key? identically. That angle is covered.

## Findings

- Minor 1 (coverage) gated_uid_only_after_promotion_controller_test.rb:105 /
  gated_uid_only_after_promotion_test.rb:45. The forged-card proofs use only a plain unrecorded
  id (FORGED-99). A case or padding variant of the admitted id (for example 'exec-df-01' or
  ' EXEC-DF-01 ') is not asserted. Traced safe: normalise_card_ids (game.rb:3082) does only
  to_s / reject-empty / uniq, with no downcase or strip, and rfid_passing_card_id matches with
  held.key?(card_id) (game.rb:3164), an exact string key, so a case or padded variant misses the
  held map and is refused. The bar holds; one extra card_id in the forged test would pin it.
  Scenario: if a future change folded case or trimmed card ids before the held lookup, nothing
  here would catch it.

- Minor 2 (coverage) gated_uid_scenario.rb:51-55, exercised by
  gated_uid_only_after_promotion_test.rb:45. The fixture has a single carded NPC (exec); Len
  carries no creds.card. So the branch where a card is genuinely held but the lock's access list
  does not admit its identity (held.key? true, rfid_identity_passes? / acl_admits? false:
  game.rb:3167, 3095, 2321) is never driven here. Every refusal proven is an unheld id, an
  unheld clone, or a UID-only copy at a strict lock, not a held clone of a non-admitted role.
  Traced safe and covered generically elsewhere: acl_admits? returns false for a non-matching
  role (access_model_rules_test.rb:20), and the full held-copy-at-a-role-lock path is exercised
  in access_model_rfid_test.rb. A UID-specific proof would need a second carded NPC in the
  fixture whose role the exec safes do not admit. Scenario: a UID lock regression that admitted
  the wrong role would be caught by the access-model tests, not by this UID fixture.

## R1 findings

Unchanged and already accepted in the build log: the weak empty-list equality at
gated_uid_only_after_promotion_test.rb:99 (the stronger guard is the controller refute at
line 57), the missing UID-specific unlock_object task/idempotency proof (covered generically in
gated_door_credit_controller_test), and Len's never-fired unlockDoor mapping kept as
load-bearing realism. R2 adds nothing against these.

## Tests run (no full suites)

- New files together, seed 12345: 14 runs, 72 assertions, 0 failures, 0 errors.
- New files together, seed 54321: 14 runs, 72 assertions, 0 failures, 0 errors.
- Model file alone, seed 99: 9 runs, 32 assertions, 0 failures, 0 errors.
- Controller file alone, seed 7: 5 runs, 40 assertions, 0 failures, 0 errors.
- No production code was changed or mutated by this review; the tree holds only the pre-existing
  untracked node_modules.
