# Unlock gaps build log (2026-11-12)

Branch `build/unlock-gaps`, from main at 6a834437c. Two latent server gaps from docs/IDEAS_BACKLOG.md, both now marked fixed there.

## Gap 1: combination padlocks and cryptexes

`Game#validate_unlock` had no `combination` or `cryptex` branch, and neither lock type was in `UNLOCK_METHODS_BY_LOCK_TYPE`, so both were refused before any check (422, shown as a wrong answer).

What changed:

- `UNLOCK_METHODS_BY_LOCK_TYPE` takes `combination` and `cryptex`, each opened only by its own method.
- New `Game.lock_answer_matches?(lock_type, secret, attempt)`, used by the door and object branches. The secret is the lock's `requires`.
  - Combination: compared as integer sequences, so `"12-30-5"` from the dials matches `requires` written `"12-30-05"`, `"12 30 5"` or `[12, 30, 5]`. Anything that is not all digits fails.
  - Cryptex: compared ignoring case and outer spaces. The wheels show fixed letters, so case can only differ through an authoring slip.
  - A blank or missing secret or answer never opens.
- PIN and password do no normalising (exact `to_s` compare). The combination and cryptex rules above differ on purpose, for the reasons given.
- `Game.strip_lock_answers!` removes the old client copies of the answer (`combination` on a combination lock, `cryptexConfig.answer`) in both payload filters (`filter_requires_and_contents_recursive` and the controller's `filter_requires_recursive`). `requires` was already stripped for both lock types.
- Client: both minigames used to read the answer to drive the UI (the padlock moved to the next dial only at the right number, and the cryptex enabled Submit only when the word matched). Neither holds the answer now:
  - combination: turning the next dial in its direction sets the current one. Unlock is enabled from the moment the last dial is reached, so 0 can be tried there. A wrong direction on the current dial still resets.
  - cryptex: Submit is enabled after any wheel turn, so any word can be tried.
  - `startCombinationMinigame(lockable, type, callback)` no longer takes a combination, and `unlock-system.js` no longer reads one.
- Schema: both `lockType` enums (room and object) take `combination` and `cryptex`. `cryptexConfig` is a known object field.
- Validator: new `check_combination_cryptex_locks` adds three checks.
  - Errors: no `requires` (naming the old field if the answer is still there); a combination that is not three numbers from 0 to 39; a cryptex word whose length differs from `wheelCount` (5 if unset); a letter that is not on its wheel.
  - Warns: an answer left in `combination` or `cryptexConfig.answer`.

## Gap 2: a container an NPC carries

Once a give or a knock-out released a container from an NPC, opening it called /unlock. `find_scenario_object` never looked at NPC-held items, so the player saw "Access denied".

What changed:

- `Game#released_npc_containers` returns the scenario copy of each container held by an NPC (room NPCs and headless email records) when:
  - the item has an `id` and has `contents`, is locked, or is a container type (`suitcase`, `briefcase`, `bag1`, `bin1`, the types interactions.js opens as containers);
  - it is not a USB habit stick, since those have their own path;
  - a server record releases it: the give record (`npc_given_items`, written only after a validated give) addresses it, or the NPC's KO is recorded (`npc_defeated?`, which needs a KO-claimable NPC the player has met).
- The dropped copy in `objects_added` and the inventory copy are never read for this, so the browser cannot invent a container or fields on one.
- Wired into `Game#find_scenario_object` (validate_unlock, PIN cracker feedback, case hint) and into the controller's `find_object_in_scenario` (the /unlock response contents) and `find_container_in_scenario` (GET /container). It also goes into `find_accessible_item`, so an item inside such a container can be taken. That take is a `container` location, so the container must be in `unlockedObjects` first.
- The container's own lock is checked as for any object (lockType and method must match, then the answer).
- Size: no player state is added. The lookup walks the scenario's NPC-held items per call (bounded by the scenario) and is not memoised, since the records change per request.

## Tests

All run without the lock, as the test lock rule asks (affected files only):

- New `test/controllers/break_escape/combination_cryptex_unlock_test.rb`: 11 runs, 60 assertions, 0 failures. Covers right, wrong and missing answers for an object padlock, a cryptex and a combination door; method mismatch; neither answer in the room or scenario payload; the normalisation rules.
- New `test/controllers/break_escape/npc_container_unlock_test.rb`: 7 runs, 43 assertions, 0 failures. Covers:
  - a KO-dropped locked bag: wrong then right password, GET /container, taking its memo;
  - a given folder: refused before the give, opened after, contents taken;
  - a give of one container not releasing the other;
  - a container still held being refused even with the right password;
  - forged records (a client-added inventory copy, a give record from an NPC not in the scenario) and an invented id being refused;
  - a KO releasing only that NPC's items.
  With `released_npc_containers` forced to `[]`, the three positive tests fail, which confirms they test the fix.
- Affected Rails files: game_test, games_controller_test, usb_habit_test, friendface_phone_test, forged_ko_drop_test, npc_give_test, headless_give_test, unlock_response_filter_test, declared_grants_test, access_model_desktop_test, add_object_key_forge_test, reload_persistence_test and scenario_npc_records_test, plus the two new files. 375 runs, 1588 assertions, 0 failures. Also ink_compiled_staleness_test and tts_mission_lines_test, which enumerate scenarios: 7 runs, 0 failures.
- JS: every test/js file that imports unlock-system.js, minigame-starters.js or either minigame (37 files): 377 tests, 0 failures. Two new files:
  - `test/js/combination-cryptex-no-answer.test.mjs` (4 tests): no answer is kept, any value can be submitted, and the exact strings sent;
  - `test/js/validator-combination-cryptex.test.mjs` (4 tests), run with validator-pin-locks: 9 tests, 0 failures.
- Validator: `scenarios/test_unlock_gaps/scenario.json.erb` gives 0 ❌ lines. A deliberately broken copy (`12-30-45`, a 7-letter word on 6 wheels) gives the two expected ❌ lines. m01 still gives 0 ❌.

## Live proof

Not done. No Mission row exists for `test_unlock_gaps`, and making one means seeding the shared dev database. The Rails tests drive the real endpoints (room load, KO drop through update_room, give through inventory, /unlock, GET /container). The JS tests check what each minigame sends. The new scenario lists the manual steps in its brief for a browser check once it is seeded.

## Left open

- The combination padlock's 40 positions and its L-R-L order are fixed in the minigame. A three-number `requires` is all the validator allows.
- After a wrong combination the dials stay where they were and Unlock re-enables on the next turn of dial 3. This is unchanged: `_handleReset` returns early while a submit is in flight.
- The dungeon graph generator was not taught the two lock types (the graph was not run, as `--no-graph` was used).
