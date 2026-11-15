R5: B/M/m 0/0/0

# D5 KO position, R5 final delta review

Range: `git diff 6c1ca2efa..be18beb68` (tip be18beb68). Four files changed: two new test
cases, comment rewording in `game.rb` and `npc-hostile.js`, and the R4 Outcomes block.

## Findings

None.

- `test/js/npc-world-position.test.mjs:31-38`. The zero test hits the reader at
  `public/break_escape/js/systems/npc-sprites.js:311` with `px:0,py:0` (also with a room
  origin present, so a tile fallback would give a different answer) and `px:0,py:192`. A
  truthiness regression in the check would fail both. The px-only test asserts a strict
  `null`: with `px` alone and no tile x/y the reader falls through to the tile branch and
  returns null, which matches the reader.
- Comment edits (`app/models/break_escape/game.rb:2118,2137,2165,5161`;
  `public/break_escape/js/systems/npc-hostile.js:327`) change comments only. No review ids
  remain in the D5 comments, and the `createNPCSprite` anchor in `npc-sprites.js` is a real
  function. Older comments outside D5 were left alone, as the Outcomes block says.

## Test results (run from the worktree)

- `bin/test-js`: 673 files passed, 0 failed.
- `bundle exec rails test test/controllers/break_escape/reload_persistence_test.rb test/controllers/break_escape/forged_ko_drop_test.rb`: 91 runs, 388 assertions, 0 failures, 0 errors, 0 skips.
- `bundle exec rubocop`: 366 files inspected, no offenses.

## Outcome checklist

B 0, M 0, m 0. Fine to merge.
