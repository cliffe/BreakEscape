# OPS_LOCK_SECOND_STEP_PLAN.md, review round 5 (delta)

Reviewer: Opus 5.5, 2026-11-19. Plan at 1e3a4d78c (740 lines); delta df008e61d..1e3a4d78c read
in full, plus section 9 (486-512) and the feature scenario (609-634). Code read in this
worktree: `game.rb` (`validate_unlock` 4597-4612 and 4685-4710, `released_npc_containers`
4945-4956, `scenario_npc_records` 5105-5118, `headless_npc_records` 5127-5147,
`headless_contact_records` 5150-5178), `social_feed.rb:180-221` (`held_friendface_phone`,
`declared_friendface_phones`), `games_controller.rb#unlock` 1211-1240 and the item finder
3575-3650, `validate_scenario.rb:1250-1308`, `declared_grants.rb:1-70`,
`generate_dungeon_graph.rb:15-29`. MFA plan 22-29, 217-250, 403, 466-484, 718, 836-866; core
plan section 10 (1197-1247).

Counts: 0 blocker, 1 major, 1 minor, 2 nit.

## R4 closure

- **M1 (never passes, "or" for "and")**: closed and right. Plan 493-500: true when the item
  cannot be taken and, for `push` only, the habit reads `never`. This matches the MFA plan: a
  push step passes by the owner (case 5, MFA plan 471-473) or a held phone (case 2, 467);
  `push_number_match` is never approved by the owner (MFA plan 27-29, 471-472) and needs the
  held phone and the right number at `POST /mfa/approve` (718); `code` needs the device (22-23).
  `moira_pc`, `moira_locker` and `records_room` are `push` with Moira on `pestered` (609-615),
  so none matches. `dana_cabinet` (`push_number_match`, off the critical path) is the intended
  warning case, but see M1 below. Unit cases added to `mfa_model_test.rb` (557-560).
- **m1 (door with `resolved: nil`)**: closed (268-272). See the access check below.
- **m2 (headless walk in lib)**: closed in form (500-507), but the walk it added disagrees with
  the game (M1 below). R4's m2 asked for the headless records; that part of its fix was wrong.
- **m3 (golden script)**: closed (545-554): scenarios named, the script stated, the core plan's
  capture task named. One gap left, m1 below.
- **m4 (`MfaModel` list)**: closed (204-206, shared-files row 655, unit test 557-560).
- **Nits n1 to n3**: closed (graph row 658 and 524-526; order line 644; "never passes" at 524
  and 573, no "never approves" left in the plan).

## Access path (task item 2): verified

- The door branch of `validate_unlock` already resolves through `room_data(target_id)`
  (`game.rb:4600-4609`) and never reaches the object find at 4702. With `resolved: nil` a door
  resolves as today, and the plan's text (270-271) now says so. Rule C reads objects only, so a
  door is never refused by an object that shares its name.
- With `resolved: nil` an object resolves through `resolve_unlock_target`, which the plan puts
  behind `find_scenario_object` and tests to find the same object (561-563). The lookup is a
  pure read; moving it ahead of `unlock_scope_refused?` (4689) and `object_unlocked?` (4696)
  changes no answer.
- The gate is a controller step, not part of `validate_unlock`, so omitting `resolved:` cannot
  skip it; `unlock_object!` is the only writer to `unlockedObjects` and Rule A refuses a gated
  id there. With no `secondStep` in the scenario the set is empty, Rule C is false and the
  shortcut stays on: same result for every existing caller (`games_controller.rb:1226` and the
  model tests' string calls).

## Major

### M1. `held_item_sources` counts places the game does not count

Plan 500-507 and the unit test at 559-560 ("a phone held only by a headless record, and one
reached only by a declared grant" both count as takeable). The game disagrees in both
directions that matter.

1. **Headless records and declared grants.** The MFA plan calls `held_friendface_phone(npc_id)`
   unchanged for `POST /mfa/approve` and `GET /mfa/phone` (MFA plan 483, 717-718). That test
   counts a phone only when `declared_friendface_phones` lists it (`social_feed.rb:190-197`),
   and that walk covers room objects and `contents`, room NPCs' `itemsHeld` and start items
   (`social_feed.rb:202-221`): no headless records, no declared grants. A phone the player
   gets only from a headless record or a grant is never "held" for an approval, so a
   `push_number_match` step on it never passes, and a `push` step passes only if the owner
   is pestered. The predicate says it passes, and the planned unit test asserts that. The
   `code` device has the same walk (`device_for`, MFA plan 225-227).
2. **Room NPCs' `itemsHeld` is counted unconditionally.** After the MFA plan, a
   `phone_friendface` or `code_device` leaves an NPC's `itemsHeld` only when the NPC's story
   offers it or the NPC is knocked out (MFA plan 403); the MFA validator's own "nobody can get"
   warning uses `AccessWork.offers_item_text?` and `koImmune` (MFA plan 841,
   `lib/break_escape/access_work.rb:169`). The plan's own feature scenario shows the gap:
   Dana's phone is "never given" and B10 (633) asserts `dana_cabinet` never opens, yet if the
   phone sits in Dana's `itemsHeld` the predicate calls it takeable, so neither the warning
   nor the dashed graph edge appears for the one lock meant to show them.

A side effect of keeping headless records: `Game.headless_npc_records` also returns
`social.mailClient.contacts[].emailRecord` records (`game.rb:5145`, `:5150-5178`), which the
plan's walk (`social.characters[].emailRecord` only) and the validator copy
(`validate_scenario.rb:1259-1290`) both miss. Dropping headless records (fix below) removes
this question.

**Fix.** Make the predicate count exactly what the held tests count: room objects and their
`contents`, start items, and a room NPC's `itemsHeld` only when `AccessWork.offers_item_text?`
finds an offer of that type in its story or the NPC is not `koImmune` (the MFA plan's
"nobody can get" rule, one shared helper for both). Drop headless records and declared grants
from `held_item_sources`, and say why (`held_friendface_phone` and `device_for` do not count
them). Turn the unit test round: a phone only on a headless record or behind a grant gives
"never passes". State Dana's `koImmune: true` and no give in her ink, and add to B10 or the
validator specs that `dana_cabinet` gets the warning and the dashed edge. If headless or grant
phones should count, that is a cross-plan request to the MFA plan to widen
`declared_friendface_phones` and `device_for`, not a validator-only change.

## Minor

### m1. The golden script does not say how a right first factor is held

Plan 547-549: "every lock posted once wrong and once right". For a `key`, `rfid` or
`lockpick` method the right answer depends on the item held, and in m01 (12 locked, 12
`contents`) and m02 (17 locked, 8 `contents`) many locks sit in locked rooms or containers,
where scope refusals answer first. "Right" is undefined until the script fixes the order and
how the inventory is filled.

**Fix.** One sentence: locks are posted in room-walk order from the start room, each after its
room and container ancestors are open, with the lock's `requires` item placed in the
inventory by the test's setup (the same for main and branch); a lock the scope refuses is
recorded as refused. Also note that `test_simple_success` has no locks or containers, so it
contributes room answers only.

## Nit

- **n1.** Line 507 runs well past the wrap width ("no Rails. The validator and the graph call
  the predicate. A task needs the lock when ..."); line 560 likewise. Rewrap.
- **n2.** 500-501 "The worked example's `push` locks" could name `dana_cabinet` as the one lock
  that does match, so the reader sees both sides of the rule in the plan's own scenario.

## Names and references (task item 5)

No review or round references (grep for round numbers, "review" and "reviewer" finds none in
the plan). "never passes" is used at 524 and 573; "never approves" remains only in the prose
of the owner's habit (19, 497), where it is correct. Fixture scenarios exist:
`scenarios/{test_objectives,test_simple_success,test_pin_dust,m01_first_contact,m02_ransomed_trust}/scenario.json.erb`;
none uses `rand`, `shuffle` or `SecureRandom`, so a byte comparison is stable. The capture
follows core plan section 10 part 1 (fixed script, real routes, rake task, shared folder and
helper).

## Verdict

Not yet. The R4 findings are closed and the access path holds against the code, but the new
item walk (M1) disagrees with `held_friendface_phone` and the MFA plan's offer and knock-out
gate, and the plan's own `dana_cabinet` shows it. M1 and m1 are text edits; a short Sonnet
delta round after them should be able to stop the review.
