# Bootstrap requires-drop delta review (step 3 + 6a-1 scan train)

Delta: c5f6d7400..c9b25a170, one commit (c9b25a170).
Scope: `app/models/break_escape/game.rb` (`filtered_scenario_for_bootstrap`) and
`test/models/break_escape/filtered_scenario_test.rb`. Review only, no code changes.

- Blocker: 0
- Major: 0
- Minor: 2

Verdict: SHIP

## What the change does

Inside the room keep-list loop of `filtered_scenario_for_bootstrap`, after
`strip_lock_answers!`, the method now also calls `set_pin_length!(kept_fields)` and then
deletes `requires` from the kept room unless its `lockType` names a card kind
(`CARD_REFERENCE_LOCK_TYPES = %w[biometric bluetooth rfid]`). This mirrors what
`GamesController#filter_requires_recursive` already did on the served route, moving the drop
into the model so the bootstrap output is answer-free on every path that calls the method,
not only the controller-wrapped one.

## Checks

### 1. Callers reading `requires` from the output. No server dependency.

The only production caller of `filtered_scenario_for_bootstrap` is
`GamesController#scenario` (app/controllers/break_escape/games_controller.rb:305), which
runs `filter_requires_recursive` on the result straight after, so it never relied on the
model keeping `requires`. No other caller in `app/`, `lib/` or `tools/` (grep: the rest are
tests and comments). Unlock validation does not read this output at all: it resolves the
authored answer from `scenario_data` (`find_scenario_object`, `validate_unlock`), so dropping
`requires` from the client-bound copy cannot break a server validation path.

### 2. Served output is identical for every lockType; no client regression.

Before this commit the served route already stripped `requires` for non-card locks, because
the controller's recursive pass ran on the model output. After the commit the model drops it
first and the controller's pass re-runs on top:

- Non-card locks (key, pin, password, combination, cryptex, flag): model deletes `requires`;
  the controller's second pass is a no-op on it (`set_pin_length!` returns early with no
  `requires`, the `delete` finds nothing). Output unchanged versus before.
- Card locks (biometric, bluetooth, rfid): model keeps `requires`; controller keeps it too
  (same card list). Output unchanged.
- `lockType` nil with `requires`: model skips the delete (`lock_type.is_a?(String)` false);
  the controller also skips it (`if lock_type &&` nil). Kept, as before.

Because the controller still runs afterwards, the model's stricter `is_a?(String)` guard
cannot cause divergence even for a malformed non-string truthy `lockType`: the controller's
`if lock_type && ...` would delete it on the way out. So the served bootstrap is byte-equal
to the pre-commit served bootstrap across all lock kinds.

Client reads line up with that. `key-lock-system.js:86` and the door/pad code read room
`requires` only where it still ships (card kinds) or from lazy-loaded room data
(`filtered_room_data`, a separate method this commit does not touch); the PIN pad reads
`pinLength`, not the PIN (`minigame-starters.js:548` comment confirms the server strips the
answer and the pad declares its length). `keyPins`, `cryptexConfig`, `access`,
`acceptsUIDOnly` are separate kept fields, untouched.

### 3. pinLength is correct.

`set_pin_length!` sets `pinLength = requires.to_s.length` only for `lockType == 'pin'` with a
present `requires`. In the model it runs before the `requires` delete, so the length is
captured first (test: `48213` -> 5). It is idempotent: when the controller calls it again on
the now-`requires`-free room it returns early and leaves the value. An authored `pinLength`
on a non-pin lock, or a pin lock with no `requires`, is left as authored (early return). A pin
lock that does carry `requires` has its `pinLength` overwritten with the true digit count,
which is the pre-existing controller behaviour, not a change.

### 4. lockType nil with `requires` kept. Correct and consistent.

The model keeps `requires` when `lockType` is not a string, matching the controller exactly, so
behaviour is unchanged. A `requires` under a nil `lockType` is an item/credential reference
(like the card kinds), not a code answer, and `strip_lock_answers!` / `strip_capture_secrets!`
cover the fields that do hold secrets. No new exposure.

### 5. Tests prove the behaviour; the old premise was wrong.

The renamed test now asserts a key room keeps `locked`/`lockType` but `requires` is nil and
`key123` is absent from the JSON. The old assertion (`requires == "key123"`, "for server-side
validation") rested on a false premise: the served route already stripped it and validation
reads `scenario_data`, so the model never needed to keep it. The flip is sound. The added test
covers the pin drop with `pinLength` fill and an rfid card ref surviving, with a JSON check that
`48213` does not leak. Focused suite green (`filtered_scenario_test.rb` 22/0/0,
`capture_payload_secret_test.rb` 12/0/0, the test that first caught the leak).

## Findings

### Minor 1 — test coverage gaps around the new branch

The new test does not exercise the nil-`lockType`-with-`requires` keep path, the idempotency of
`set_pin_length!` on a re-filtered room, or that an authored `pinLength` on a non-pin lock is
preserved. An assertion that the model output equals the controller-filtered output for each
lock kind would also lock in the "identical served bootstrap" guarantee that this change rests
on. Evidence: `test/models/break_escape/filtered_scenario_test.rb:152-165`. Not blocking; the
behaviour is covered indirectly by the controller's own pass and the capture test.

### Minor 2 — card list duplicated as a literal in the controller

The model uses `CARD_REFERENCE_LOCK_TYPES`; `filter_requires_recursive`
(games_controller.rb:2627) still hard-codes `%w[biometric bluetooth rfid]`. They agree today, so
output is identical, but the two can drift if the constant changes. Pre-existing and out of this
delta's scope; worth folding the controller onto the constant in a later pass. Evidence:
game.rb:6228 vs games_controller.rb:2627.
