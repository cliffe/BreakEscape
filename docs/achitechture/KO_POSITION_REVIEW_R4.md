R4: B0 / M0 / m2

# KO position on reload: R4 delta review

Scope: `git diff 03bfa0b74..36ec94699` (new test, doc note, one harness line), then the whole
feature diff `669cee5be...36ec94699 -- app public test` read again.

## Checked, no finding

- Delta: the R3 m1 harness line (`home.atKo`) and the doc rewording match the code. The doc
  now calls Amara's 5 px unverified, which is accurate.
- `rubocop:disable`: the feature adds none (grep of the diff). I could not run rubocop here
  (`bundle exec` fails to load in this worktree), so method length is judged by eye:
  `apply_ko_positions!` is about 35 lines with two short blocks, and every other new method is
  under 20. If the project's MethodLength limit is 10 this was already true of neighbouring
  methods, so nothing new.
- Dead code from the old top-level x/y: none left. No `'x'`/`'y'` write or assertion remains in
  the Rails test diff, and both branches of `apply_ko_positions!` serve `position.px/py` only.
- Comments against code: the `npc-sprites.js:118-126` cite in `game.rb` still points at the
  body-centre shift (lines 118 to 126). The `koBc` comment, `ko_room_reachable?` comment and
  first-fall-wins comments match the code they sit on.
- `npc-world-position.test.mjs`: the four tests exercise the real module through a copied
  tree (not a mock), the px-wins test fails if the reader prefers x/y, and the offset test
  fails if px gains a room offset. The null test cannot pass vacuously (it asserts `null`
  strictly).

## Minor

### m1. The test would not catch a truthiness regression in the px/py check

`test/js/npc-world-position.test.mjs:24-34`; reader at
`public/break_escape/js/systems/npc-sprites.js:311`. The reader uses
`position.px !== undefined && position.py !== undefined`. Every px/py case in the test uses
non-zero values.
Failure scenario: someone tidies the check to `if (position.px && position.py)`. A body that
fell at world x = 0 or y = 0 (a room at the origin edge, which is legal under the symmetric
`MAX_KO_COORD` bound) then falls through to the tile branch, gets no tile x/y, and returns
null, so the KO'd NPC is not placed. All four tests still pass.
Fix: add a case `{position:{px:0,py:0}}` expecting `{x:0,y:0}`, and one with only `px`
present (no `py`) expecting `null` or the tile fallback, whichever the reader intends.

### m2. Review ids and line numbers in code comments will rot

`app/models/break_escape/game.rb` (comments "review R1 m4", "review R1 m2", "review R1 M1",
"npc-sprites.js:118-126") and `public/break_escape/js/systems/npc-hostile.js` ("review R1 m1").
Failure scenario: the review docs are renamed or pruned, or `npc-sprites.js` gains a few lines
above the body-centre shift. The comments then point at nothing or at the wrong lines, and a
reader cannot tell what "R1 m2" meant. Several of these comments are otherwise self-explanatory,
which makes the ids pure noise.
Fix: drop the review ids and keep the reason already written beside them; replace the line
range with the comment text anchor ("Tile coordinates mean feet (body.center)" in
`createNPCSprite`).

## Outcome checklist

B 0, M 0, m 2. Fine to merge; both minors are small follow-ups. The test's temp directory
is never removed, which matches the other copy-list tests and is not worth a finding.

## Outcomes

- m1: fixed. `test/js/npc-world-position.test.mjs` gains a body at world x or y = 0 and a px-only position (6 tests).
- m2: fixed. The D5 comments in `game.rb` and `npc-hostile.js` no longer cite review ids or a line range; the restore contract is named by function (`createNPCSprite`). Older comments outside D5 were left as they are.
