# P0-J R0: the two lints that apply to every scenario

Date 2026-10-21. Lints under test: aim `unlockCondition` keys (allowed: aimCompleted, aimsCompleted,
globalVariable, equals) and object `id` uniqueness across `rooms[*].objects`. Both are in
`scripts/validate_social.rb` and run for every scenario; everything else in the framework needs a
top-level `social` key, and no shipped scenario has one.

## Method

- Before: a throwaway `git worktree` of HEAD (scripts at HEAD, so no social lints), with the working
  tree's `scenarios/` copied over it so content is identical. After: the working tree.
- For every folder in `scenarios/` holding a `scenario.json.erb` (69):
  `ruby scripts/validate_scenario.rb scenarios/<s>/scenario.json.erb --no-graph --skip-ink`, output
  with the root path normalised, then `diff -r` of the two output folders.
- The worktree was removed afterwards. `git status --porcelain` shows no scenario `.json`, `.erb`
  or ink file rewritten (the only modified files under `scenarios/` are two `FINALE_*.md` logs edited by another session).

## Result

New lines: **none**. `diff -r` of the 69 before/after outputs is empty, and no output contains
`SOCIAL`. So no shipped scenario has an unsupported aim unlock key or a duplicate object id, and
there is nothing to classify as real finding or false positive.

Five scenarios stop before the common-issues stage in both runs (same in before and after, so
pre-existing and unrelated; they exit earlier on a schema or structure error): `basic_mission`, `test-blockchain-explorer`, `test-ble-scanner`, `test_table_items` and
`vm_free_mission`. The social lints did not run for them, in either run.

The lints do fire when they should: `test/js/validator-social-framework.test.mjs` covers a duplicate
id across two rooms and a `greaterThan` aim key on a fixture with no `social` key.

## Caveats

- Uniqueness is checked on `id` only, over `rooms[*].objects` (the unlock endpoint also matches on
  `name`; that is not linted, since shipped scenarios reuse names freely).
- The aim-key lint reads `objectives[*].unlockCondition`; task-level conditions are out of scope.
