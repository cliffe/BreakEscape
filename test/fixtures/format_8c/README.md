# Format 8c habit-fold fixtures

Frozen inputs for the step-8c corpus equivalence, reader parity and stored-game equivalence
(`test/unit/format_8c_corpus_test.rb`, `test/js/format-8c-reader-parity.test.mjs`). Step 8c folds the
three top-level office-life habit keys into the NPC `habits` block:
`screenHabit -> habits.screen`, `printHabit -> habits.print`, `usbHabit -> habits.usb`.

## Rendered pairs

- `<scenario>.old.json`: the **format-2** render (top-level `screenHabit` / `printHabit` / `usbHabit`).
- `<scenario>.new.json`: the **format-3** render (one `habits` block holding `screen` / `print` / `usb`).

For `test_access_social`, `test_access_work` and `test_needs_sims` (the three rewritten templates);
plus `test_access_habits`, which authors no habit key, so its pair is identical bar the fold having
nothing to move. Freezing both sides keeps the equivalence a check of the step-8c transform alone:
`transform(old)` equals `new`. The live templates are guarded separately by an edit-proof retired-key
check.

Because the transform skips author notes, a `_comment` whose wording was hand-updated from a retired
key (two in `test_needs_sims`, two `<%# %>` comments in `lab_physical_pentest`) differs between
`transform(old)` and `new`. The corpus test strips author-note keys before the structural comparison,
and checks separately that no live author note still names a retired key.

## Loader output (stored-game equivalence)

- `<scenario>.old.loaded.json`: the **format-2 loader output**: `NpcHabits.expand!` run on the 8b tip
  `ab14d1926`, which fills a top-level `screenHabit` from `awareness` / `habits.locksScreen` the old
  way. For `test_access_habits` and `lab_physical_pentest` (neither authors a habit key; both carry
  awareness or `habits.locksScreen`), and a minimal `priya_awareness` scenario used by
  `format_upgrade_test`.

These prove the stored-game equivalence: a game prepared by the format-2 loader, once the step folds
its `screenHabit` into `habits.screen`, gives the same effective lock rule per workstation (and the
same folded data, field for field) as a fresh format-3 game the current loader fills.

## How they were made

- `.old.json`: rendered from the template at the 8b tip `ab14d1926` (`git show`), `srand(1)` then a
  plain parse (the four templates carry no value-producing ERB).
- `.new.json`: rendered the same way from this branch's rewritten template.
- `.old.loaded.json`: on a detached worktree at `ab14d1926`, `NpcHabits.expand!` (the format-2 loader)
  run on the format-2 render, dumped as pretty JSON.

Regenerate after a deliberate change by re-rendering/re-loading the same way. A change that alters the
step-8c transform is the only thing that should move `.new.json` relative to `transform(.old.json)`.
