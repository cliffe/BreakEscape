# Step 8b (one owner field, format 2) adversarial code review, round 1

Branch `build/hard-8b`, reviewed at tip `8cee79d2e` against `git diff main...HEAD`. Read-only
review; the only change in this commit is this file. Judged against the shared "Step 8" and "Step
8b" sections of `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`, the build log, and the live
code and tests.

## Verdict

Ship. No blockers and no majors. The transform, the readers (Ruby and JS), the schema, the
validator, the template rewrite, the corpus/parity tests and the forbidden-field protection all
match the plan, and every targeted test I ran is green. Two minors below are wording/coverage
nits, not correctness defects.

## What I verified green

- Ruby: `test/unit/format_8b_corpus_test.rb`, `test/unit/format_upgrade_test.rb`,
  `test/controllers/break_escape/format_8b_deployed_noop_test.rb`, `test/unit/owner_claim_test.rb`,
  `owner_claim_enforce_test.rb`, `friendface_phone_test.rb`, `test/unit/npc_habits_test.rb`,
  `npc_habits_loader_test.rb` — 135 runs, 0 failures.
- JS: `format-8b-reader-parity`, `validator-retired-keys`, `workstation-state`, `npc-left-behind` —
  all pass. The 8b validator cases (`{ skip }` only when ruby is absent; ruby present here, so they
  ran) cover each retired-key rename error, the affordance moved-up errors, the list-owner error on
  each single-owner kind, a list owner allowed on a private object, and no unknown-field warning for
  `owner`/`private`/`deskPhone`.
- Validator on every rewritten scenario (test_access_social/needs_sims/habits/work/sessions,
  lab_physical_pentest): 0 errors, no retired-key rename line, no unknown-field warning for an owner
  key.

## The upgrade step (STEP_8B)

- Correct. Phase A renames owner fields on every live Hash through the schema-aware `each_live`
  walk (`free: :skip`, so a note that names an old key is left as written, matching
  `retired_keys_in` and `check_owner_fields`). Phase B derives the `needsHome` owner only for a
  workstation (String) or a private object (one-element list), reading the same `needsHome` the old
  readers did because phase A never touches `needsHome`. `rename_one_hash_owner_fields!` guards every
  destination with `unless value.key?('owner')`, so the transform is idempotent, a no-op on format-2
  data, and a two-field conflict keeps the first field read. An emptied `affordance` stays `{}`.
  Confirmed by `format_upgrade_test` (workstation String, private list, private-workstation String,
  desk-phone marker, left-behind chance default, note untouched, item `phoneOf`→`owner`) and by the
  frozen-fixture corpus-equivalence test.
- `needsHome` derivation now removed from `owner_id`, `ownerOf`, `login_pc_owner`, `owners_of`,
  `station_owner` (grepped: no reader derives from `needsHome`). I traced every caller of
  `login_pc_owner`/`owner_id`: all gate on `login_pc?`/`workstation?` (e.g. `find_login_pc` refuses a
  non-login PC, `owned_workstations` filters `workstation?`), so a non-workstation `needsHome` target
  such as lab_physical_pentest `kieran_laptop` (now `owner: ["kieran"]`, a private non-workstation PC)
  is never read for a derived owner. No behavioural change.
- player_state transform covers `inventory`, `room_states.*.objects_added`, `droppedItems`,
  `copiedItems`, `serverClones` (`player_state_item_lists`). I grepped `app/`/`lib/` for every
  `player_state[...]` list of item hashes; these are the only ones that hold item copies with an
  owner field. No list missed.

## Cheat side

- `CLIENT_ITEM_FORBIDDEN_FIELDS` now holds `owner` and keeps `phoneOf`
  (`games_controller.rb:2552`). `friendface_phone_test` was strengthened (not weakened): a client
  item carrying `owner` is refused, and both `owner` and `phoneOf` are stripped from an always-allowed
  client item. A Friendface phone is still only mintable from a scenario-declared item
  (`held_friendface_phone` reads declared phones plus the server inventory copy); the owner claim is
  server-side off `pc['owner']`. No new path to mint a phone or claim a PC.

## Old saved games

- The deployed-noop test proves the real transform is a no-op on m01/sis01/sis02/lab_social_engineering
  (no renamed key and no `needsHome` workstation without an owner, so the derivation adds nothing) —
  this is the risk that derivation (not just renames) could break a deployed game, and it is covered.
- `corpus_test` runs `prepared(transform(old)) == prepared(new)`, the real load order (upgrade then
  prepare), so the loader fills agree across the rename.

## Minors

- **minor** — `lib/break_escape/format_upgrade.rb` `rename_one_hash_owner_fields!` (the `leftBehindBy`
  branch, ~l.327, and the `phoneOwner` branch) is shared by the scenario and player_state walks, so a
  player_state item copy that lacks `leftBehindChance` would gain `leftBehindChance: 0` (a second
  key), and a copy with `phoneOwner` would gain `deskPhone: true`. The plan says a player_state copy
  "gains at most the one key the step writes". In practice harmless: every corpus left-behind item
  carries `leftBehindChance` (so no add on a real copy), desk phones are not takeable (never in
  player_state), and the add is one-time at load and idempotent, so the SYNC SIZE RULE holds (nothing
  re-sent). Suggested fix: add a line to the build log's sync section noting the default-write cannot
  grow a real stored copy, or have the player_state path call a rename-only variant; no code change
  required for correctness.
- **minor** — `scripts/validate_scenario.rb` `check_owner_fields` (the `needsHome no longer sets an
  owner` warning, ~l.668) has no dedicated executing test; the 8b validator test file exercises the
  rename errors, the list-owner error and the unknown-field suppression but not this warning.
  Warning-only, low risk. Suggested fix: add one `check_owner_fields` case to
  `validator-retired-keys.test.mjs` asserting the warning fires for a workstation that is an NPC's
  `needsHome` with no owner.

## Observations (no action)

- Reader parity (both the Ruby corpus test and the JS node test) deliberately scopes to the
  workstation domain plus any object that carried an explicit `screenOwner`, and the corpus set
  excludes lab_physical_pentest. That scoping is sound (I confirmed no reader reads a derived owner
  for a non-workstation object), but the lab_physical_pentest `kieran_laptop` private-list derivation
  rests on the live proof plus the retired-key check rather than an automated parity assertion. The
  live-template retired-key guards (Ruby and JS) and the 0-error validator run cover the committed
  template.
- Objects and items share the one `item` schema definition (there is no separate `object`
  definition), so `owner`/`private`/`deskPhone` declared there are reachable for items too; the
  removed item keys (`phoneOf`, `leftBehindBy`) and affordance keys (`owners`, `private`) are gone
  from the schema, so a reintroduced one fails the schema as a retired-key rename line.
- No stale old-key reader remains in `app/`, `lib/`, the engine JS, the validators,
  `tools/playtest/verify-run.rb`, the test-bridge or `docs/test-bridge.md` (grepped).
