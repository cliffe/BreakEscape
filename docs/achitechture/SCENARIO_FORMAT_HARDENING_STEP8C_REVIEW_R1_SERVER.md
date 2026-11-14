# Step 8c review, round 1, server / transform / validator half

Reviewer scope: `lib/break_escape/*`, `app/models/*`, `scripts/*`, `tools/format/rewrite_templates.rb`
and the Ruby tests. JS, templates and corpus are a separate reviewer's half and were not read here
(beyond confirming no Ruby reader still reads an old key).

Diff reviewed: `git diff build/hard-8b 0305bd1ad` (tested tip `0305bd1ad`; the working tip is
`a5f6fb6dc`, a docs-only build-log commit on top). Read-only; no code edited.

## Verdict

**PASS (approve).** The fold is a clean mechanical change. The transform is total over NPC-shaped
data, idempotent, loses no field a reader needs, retires the three keys cleanly, and the ship filter
is a true allow list of `screen` and `print` with `work.usb` built from `habits.usb` before the
block is stripped. Lock precedence is untouched and only the five documented fixtures differ. The
`expanded()` refinement is correct and restores pre-fold parity rather than changing behaviour. All
at-risk tests pass. The findings below are minor and none blocks the merge.

Blocker: 0  Major: 0  Minor: 3

## What was verified

- **Transform totality / idempotency.** `habits_in_one_block!` walks every live Hash via
  `AuthorNotes.each_live(..., free: :skip)` and folds `screenHabit`/`printHabit`/`usbHabit` into
  `habits` by key name, independent of schema location, so every NPC-shaped hash is covered
  (format_upgrade.rb:473-502). `each_live` calls the block on a Hash *before* iterating that Hash's
  keys (author_notes.rb:35-45), so deleting the old key and adding `habits` inside the block happens
  before the `.each` begins: no mutate-during-iteration, and the freshly-added `habits` sub-blocks
  (`screen`/`print`/`usb`) contain no fold key, so the later descent is a no-op. Idempotent: the
  early `return unless HABIT_FOLD.keys.any?` makes format-3 data a no-op, and
  `habits[new_key] = moved unless habits.key?(new_key)` makes a re-run keep the folded value.
- **Partial / wrong-type / null handling.** A pre-existing `habits` block is kept and the folded key
  joins it (tested, priya). A null or non-Hash habit value is moved verbatim, so the downstream
  `is_a?(Hash)` readers treat it as "no habit" exactly as the old top-level key did: reader parity
  holds for degenerate values.
- **player_state path.** `STEP_8C[:player_state]` is `->(state){ state }`. Confirmed no NPC record
  (with habit keys) is stored in player_state: the stored structures are item lists
  (inventory/objects_added/dropped/copied/clones) and `npc_states` overlays (`isKO`, `currentHP`,
  position) plus `encounteredNPCs` ids (game.rb:466-504, 306-308). No habit key is written to
  player_state. The no-op is justified. Covered by a test.
- **Stored format-2 game upgrades identically.** The frozen fixture
  `test/fixtures/format_8c/priya_awareness.old.loaded.json` (old loader output, a filled top-level
  `screenHabit`) folds to `habits.screen` unchanged, and `format_8c_corpus_test.rb`'s
  "upgrade then prepare equals prepare(new)" proves field-for-field equivalence.
- **Ship filter is an allow list.** `withhold_npc_secrets!` keeps `habits.slice('screen','print')`
  and drops the rest, or deletes a non-Hash `habits` (game.rb:5668-5675). `habits` is removed from
  `WITHHELD_NPC_KEYS` and `usbHabit` from `WITHHELD_WORK_NPC_KEYS`; `SHIPPED_HABIT_KEYS = %w[screen
  print]`. `compile_npc_plan!` runs before `withhold_npc_secrets!` (game.rb:5599-5600) and reads the
  unfiltered scenario record (`scenario_room_npc`), so `work.usb` is built from `habits.usb` before
  the block is stripped. `locksScreen`, `writesDown`, `password`, `passwordPattern`, `holdsDoors`,
  `usb` never ship.
- **Lock precedence unchanged.** `AccessIdentities.screen_always_locks?`, `OwnerClaim`
  (`open_without_estimate?`, `prints?`, `claim_reason`) and `pc_always_locks?` read the same shape,
  only the path changed (`owner['screenHabit']` -> `owner.dig('habits','screen')` etc.). The corpus
  test reimplements the old reader and compares it to the new reader on the new render for every
  workstation and every potential borrower; the five named fixtures (priya_pc, omar_pc, rosa_pc,
  ian_pc, jake_pc) are asserted and pass. No other workstation differs.
- **`expanded()` refinement is correct.** A `habits` block with only folded keys carries no
  awareness authoring, so `expanded` returns nil (matching a pre-fold bare `screenHabit`), while a
  block with any non-folded key still expands (npc_habits.rb:96-104). `expand!`'s write-back
  carries the folded sub-blocks across the awareness expansion so they are not dropped
  (npc_habits.rb:155-158), and `fill_screen_habit!` now writes `habits.screen`.
- **Validators and schema.** Retired keys are reported once, with a helpful rename line
  (`#/.../screenHabit: 'screenHabit' was renamed to 'habits.screen' in format 3`), verified live on
  `test_access_work.old.json`; the redundant unknown-field warning is suppressed via
  `retired_item_keys`. The schema moves `screen`/`print`/`usb` into the closed `habits` block
  (closed, `^_` allowed) and drops the three top-level keys, so new keys are validated and a
  reintroduced old key fails. `validate_access_work.rb` still flags `habits.usb` on a non-room NPC.
- **Org input sanitisation.** No new end-user/organiser text surface: habit values are numeric
  bounds, enum-ish, or a `setGlobal` string checked against declared globals; `_comment` is an
  author note. Nothing here needs the end-user sanitisation path.
- **No stale Ruby reader.** Grep of `app lib scripts tools` for the three old keys as hash reads
  returns nothing; the only live mention is the migrator regex in `rewrite_templates.rb`.

## Tests run (no full suites)

- `format_upgrade_test.rb`, `format_8c_corpus_test.rb`, `npc_habits_test.rb`: 77 runs, 0F 0E.
- `owner_claim_test`, `access_work_usb_habit_test`, `access_identities_screen_test`,
  `access_leak_scanner_test`, `pc_screen_lock_precedence_test`, `usb_habit_test`,
  `owner_claim_enforce_test`, `npc_habits_loader_test`, `access_model_withholding_test`,
  `format_8c_deployed_noop_test`, `npc_lockout_l_test`, `npc_workaround_h_test`,
  `npc_frustration_test`, `lab_physical_pentest_secrets_test`: 268 runs, 0F 0E.
- Validator: `test_access_work`, `test_access_social`, `test_needs_sims`, `test_access_habits`
  live templates each 0 errors; retired-key errors fire on the `.old.json` fixtures.

## Findings

### Minor

- **M1. Conflicting values are silently dropped (corrupt-data only).**
  `fold_one_hash_habit_fields!` (format_upgrade.rb:490-502) deletes the top-level key
  unconditionally but writes `habits[new]` only `unless habits.key?(new)`. If a hash somehow holds
  both `screenHabit` and `habits.screen`, the top-level value is discarded. Not reachable from a
  valid format-2 game (`habits.screen` did not exist in format 2) and the "folded value wins" rule
  is what makes the transform idempotent, so this is the intended choice. Failure scenario: only a
  hand-corrupted or partially-migrated game loses a field, silently. Fix: none required; optionally
  add a unit case asserting the folded value wins and the top-level is dropped, so the intent is
  pinned.

- **M2. A non-Hash `habits` is overwritten when a top-level habit key coexists.**
  format_upgrade.rb:483-487 replaces a non-Hash `habits` with a fresh `{}` when at least one fold
  key is present, discarding the original value. Only reachable with schema-invalid data (the schema
  requires `habits` to be an object) and `expand!` already skips such NPCs (npc_habits.rb:136), so
  there is no behavioural loss. Failure scenario: a hand-edited game with `"habits": "x"` plus a
  `screenHabit` loses the `"x"`. Fix: none required; if strictness is wanted, skip the hash when
  `habits` is present-and-not-a-Hash rather than overwriting.

- **M3. `expanded()` now returns nil for an empty `habits: {}` block (was `{}`).**
  npc_habits.rb:96-104: before the fold, an NPC with an empty `habits: {}` and no awareness level
  returned `{}` from `expanded` and so gained a (contentless) `expand!` report row; now it returns
  nil and gets no row. The 8c transform never produces an empty `habits` (it is created only when a
  fold key is present), so this is reachable only from degenerate authoring, and the row carried no
  fill or door effect. Failure scenario: a scenario authoring a bare `habits: {}` loses a
  meaningless report entry; no runtime effect. Fix: none required; the new behaviour matches the
  method's stated contract ("nil when neither a level nor an awareness block").

## Notes for the other reviewer / not in scope

- JS readers (`workstation-state.js`, `npc-needs.js`) and the JS reader-parity test
  (`format-8c-reader-parity.test.mjs`) are the other half; not read here.
- `rewrite_templates.rb` is a one-shot hand-edit migrator, self-checked against the real transform
  as oracle and refusing ERB templates and pre-existing `habits` collisions; correct for its job.
