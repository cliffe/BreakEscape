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

- `<scenario>.old.habits.json`: for `test_access_habits` and `lab_physical_pentest`, a map of NPC id to
  the `screenHabit` and `habits.locksScreen` the **format-2 loader** filled (`NpcHabits.expand!` on the
  8b tip `ab14d1926`, from `awareness` / `habits.locksScreen`). This is the only frozen part. The test
  rebuilds the old loader output from the live render: it drops each NPC's `habits.screen`, puts back
  the frozen `screenHabit` and `locksScreen`, folds the result and compares it with a fresh format-3
  render. Scenario edits unrelated to habits never touch these files; a changed `awareness` or
  `habits.locksScreen` makes the frozen value stale and the test fails.
- `<scenario>.old.loaded.json`: the whole format-2 loader output, kept only where another test reads
  it: `test_access_habits` (the JS reader-parity test) and the minimal `priya_awareness` scenario
  (`format_upgrade_test`).

The equivalence proved: a game prepared by the format-2 loader, once the step folds its `screenHabit`
into `habits.screen`, gives the same effective lock rule per workstation (and the same folded data,
field for field) as a fresh format-3 game the current loader fills.

## How they were made

- `.old.json`: rendered from the template at the 8b tip `ab14d1926` (`git show`), `srand(1)` then a
  plain parse (the four templates carry no value-producing ERB).
- `.new.json`: rendered the same way from this branch's rewritten template.
- `.old.habits.json`: read from the 8b-tip loader output of each scenario (the NPCs that carry a
  `screenHabit`, with their `habits.locksScreen`).
- `.old.loaded.json`: `NpcHabits.expand!` (the format-2 loader) run on the format-2 render at
  `ab14d1926`, dumped as pretty JSON.

Regenerate after a deliberate change by re-rendering/re-loading the same way. A change that alters the
step-8c transform is the only thing that should move `.new.json` relative to `transform(.old.json)`.
The lab renders a per-game `@random_password`; `live_render` in the corpus test pins it to `FixedPw1`
(SecureRandom ignores `srand`).
