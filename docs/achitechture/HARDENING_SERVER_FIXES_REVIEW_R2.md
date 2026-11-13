# Hardening server fixes - adversarial review R2 (2026-11-13)

Branch `build/hard-fixes`, commits `2f5471209..724e3c0ff`. Round 2 covers: confirmation that every
R1 finding is really closed (code read plus the touched test re-run, including the item 1 server
negative proof R1 could not run), and a fresh review of items 2 and 4 (commits `e999583c8`,
`e79a4439c`), which R1 held out of scope. Read-only except this file. Touched test files run
singly, no full suites.

Severity counts: blockers 0, majors 0, minors 3.

## Verdict

Approve. Items 2 and 4 are sound. Item 4 adds a server-only lookup source for a locked start item
and keeps the no-leak property: the answer and the locked contents still reach the client through no
payload (bootstrap, room, inventory, sync, unlock reply, GET /container all strip them), and the
unlock is gated on the correct answer, which the CHEAT POLICY requires. Item 2 is an advisory
validator warning with no runtime or sync effect and no corpus false positive. Every R1 finding is
closed as the Outcomes claim, the item 1 server negative proof now reproduces red when reverted, and
the branch's three live test families pass. Three minors, all documentation/robustness, none
blocking.

## R1 closures - all confirmed, none disputed

- major (item 7 design): CLOSED. The build log item 7 section (`HARDENING_SERVER_FIXES_BUILD_LOG.md`
  :266-285) now states the rule as mandatory, not a preference: when `capture.secret` is a protected
  value a server-side threshold and victim check are required, and the client-control-flow fallback
  is allowed only where the two gate values are deterministic consequences of the authored build and
  landed send. Item 7 stays design-only (not built), so nothing to test.
- minor 1 (item 1 cue parity, workstation-state.js): CLOSED. `onGuestLeft` `min === 0` branch now
  calls `this._changed(data, npcId, true, 'auto')` (workstation-state.js:310); `data` is the
  `_find(pcId)` object the guard already proved non-null, so `workstation_screen_changed:<id>` fires
  as the sibling paths do. `workstation-state.test.mjs` 54/54 green.
- minor 2 (item 1 stale record, game.rb:2307): CLOSED. The `autoLockMin 0` guest-claim refusal now
  calls `end_guest_session_at!(pc['id'])` + `save!` before refusing (game.rb:2308-2316). Covered by
  `npc_workaround_h_test.rb`, green.
- minor 3 (item 6 regression test): CLOSED. `test/js/test-bridge-dismiss.test.mjs` committed, 3/3
  green, drives the real `dismissBlockingUi`.
- minor 4 (item 3 no-action) and minor 5 (item 5 confirmation): correct, no change needed;
  `npc-exchange-heard.test.mjs` 17/17 and `network_notes_not_live_test.rb` green.
- item 1 server negative proof (R1 could not run it): REPRODUCED. With
  `|| policy_locks_guest_outright?(pc)` removed from `record_borrow_done!`
  (npc_frustration.rb:380), `npc_workaround_h_test.rb` goes red - the borrow answers
  `guest: true` instead of `false` (1 failure); restored, 36/36 green, tree a zero diff.

## Item 4 - a locked start item can now be opened (fresh review)

Three lookup sources were added, each appended LAST after the existing sources:
`Game#find_scenario_object` (game.rb:3366), `find_object_in_scenario` (games_controller.rb:2391) and
`find_container_in_scenario` via `find_container_recursive` (games_controller.rb:2329). All read the
raw `scenario_data['startItemsInInventory']`, which keeps `requires`.

Can a client read anything it could not before? No new leak:
- Same-id collision (a start item and a locked world object sharing an id): the start-items source
  is appended last in all three functions, so an id that resolves to any earlier source (rooms,
  profiles, resources, held grants/sticks, released NPC containers) still resolves there. The only
  ids the new source newly resolves are ids that matched nothing before and returned "not found" -
  exactly the authored start item and its nested contents. The feature, nothing more.
- The answer never ships: bootstrap `filter_requires_recursive` (games_controller.rb:295) +
  `startItemsInInventory` deleted from the bootstrap scenario (games_controller.rb:446); the stored
  inventory copy `filter_requires_and_contents_recursive` (game.rb:5770); the unlock reply and
  GET /container both `filter_container_contents` -> `filter_requires_and_contents_recursive`
  (games_controller.rb:2477), which strips `requires`, the cryptex/combination answer
  (`strip_lock_answers!`) and a locked child's contents. Verified by the Rails test's
  `refute_includes response.body, 'RIDDLE' / '3-14-15'` over the unlock reply and GET /scenario.
- Negative proof (run this round): replacing the source array with `Array(nil)` in
  `find_scenario_object` makes "a locked start item opens with the right answer" go red ("Invalid
  attempt", 422) - the fix is load-bearing. Restored, tree clean.

`test/controllers/break_escape/combination_cryptex_unlock_test.rb` 14/14 green (118 assertions).
`test_unlock_gaps` validates at 0 errors with the new locked Pocket Cryptex start item.

### Findings

- minor (doc) - `HARDENING_SERVER_FIXES_BUILD_LOG.md:122`. The item 4 note says the file is "Full
  file green (21 runs, 161 assertions)"; the file has 14 tests and runs 14/118. Over-reported count;
  correct it so the log matches the suite.
- minor (no action, design note) - `game.rb:3366` (and the two controller twins). The start-items
  unlock source iterates every authored start item unconditionally, unlike `held_grant_items` /
  `held_usb_sticks`, which gate on current possession. A player who has dropped or given away a
  locked start item can still `/unlock` it and read its contents - but only with the correct answer,
  which is a hard-enforced secret (CHEAT POLICY satisfied, no forge), so no access honest play could
  not reach. Harmless today (no shipped scenario ships a locked start item); flagged so a future
  author does not assume confiscating a locked start item hides its contents.

## Item 2 - re-issued revoked card id validator warning (fresh review)

Server behaviour unchanged (grow-only `revoked_card_ids` kept, correct under the CHEAT POLICY - an
RFID card is a captured credential). The build adds a validator-only advisory
(`check_revoke_card_globals`, scripts/validate_scenario.rb): it collects every `card_id` a
`revoke_card` cancels and every `card_id` handed to the player (a `give_item` item, a start item,
including a nested `rfidCard`/`card`/`contents` id) and warns on the intersection. World-object cards
the player clones or takes (the intended revoke mechanic) are not "handed over", so they do not warn.

False positives on the corpus: none. Ran the validator over the only three `revoke_card` scenarios -
`test_clone_left_card`, `lab_physical_pentest`, `test_unlock_gaps` - none emits a re-issue warning,
each at 0 errors. The JS test spawns the real Ruby `check_revoke_card_globals` (not a reimplementation
that could drift); 6/6 green.

### Findings

- minor (false positive beyond the corpus) - `scripts/validate_scenario.rb:2985`. The warning fires
  on any granted-and-revoked `card_id`, including an intended give-then-revoke-with-no-reissue plot
  beat (a temporary card the scenario later confiscates and never re-issues), which is a legitimate
  one-way pattern, not a foot-gun. Advisory only (no `validator_known_failures.json` entry, exit code
  unaffected) and fires on nothing shipped, so low impact; soften the wording to target only a card
  re-handed under a revoked id, or accept the occasional nudge.

## Whole-branch interactions

- SYNC SIZE RULE: item 4 adds no synced state beyond the existing `unlockedObjects` id list (one id
  per opened object, bounded by lockable objects + locked start items); item 2 is validator-only.
  No growth concern.
- CHEAT POLICY: item 4's unlock is answer-gated server-side (no forge); item 2 keeps the grow-only
  revoke stickiness. Both consistent.
- LOAD-BEARING ODDITIES: the three item 4 sources are appended, remove nothing; a non-Hash start
  item entry is tolerated (login_pc? guards Hash, String#[] returns nil), so no crash.
- Tests fail without the fixes: proven for item 4 (source mutated -> red) and item 1 server
  (helper reverted -> red); item 2's JS test asserts the warning the new intersection logic emits;
  items 3/5/6 carried from R1 (mutation there) and re-run green here.

## Tests run this round (single files, no lock)

- `combination_cryptex_unlock_test.rb` 14/118 green (and red under the source mutation)
- `npc_workaround_h_test.rb` 36/257 green (and red under the item 1 server-fix revert)
- `network_notes_not_live_test.rb` green (44/285 with the above together)
- `workstation-state.test.mjs` 54/54, `test-bridge-dismiss.test.mjs` 3/3,
  `npc-exchange-heard.test.mjs` 17/17, `validator-revoked-card-reissue.test.mjs` 6/6
- Validator on `test_clone_left_card`, `lab_physical_pentest`, `test_unlock_gaps`: 0 errors, no
  re-issue warning
