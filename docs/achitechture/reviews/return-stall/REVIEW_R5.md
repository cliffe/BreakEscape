# Code review R5, final round (needs NPC walking home stalls behind a standing NPC)

Delta review of `25d4225c3..f32c9b37d` (the R4 fixes) and of the merge of main, 628ae88cb, on branch fix/needs-return-npc-stall. Result: 0 Blocker, 0 Major, 0 minor, 1 nit.

## 1. R4 findings against the outcomes

| Finding | Verdict |
|---|---|
| m1 no cap on the flood cost of a failed ring search | Resolved as accepted. No code change claimed, none made. The bound (3 s resume, 3 tries per place, 15 s back-off) is as described in R4, and the future cache option is recorded in the outcomes. |
| m2 no test for a caller that omits `laneHalf` | Resolved. The new test in test/js/npc-needs-return-standing-npc.test.mjs runs `findWorldPath` on the R3 (a) geometry with and without `laneHalf`. It asserts a path in both cases, a control (the released path passes closer) and a 24 px floor for the whole ring. The control stops the floor assertion passing for the wrong reason. |
| n1 dead `laneHalf` argument | Resolved. npc-behavior.js:2044 spreads `laneHalf` only when `includeHeld`, with a comment. The `moving` tier is built without it, matching npc-pathfinding.js:670, which discards the options there anyway. |
| n2 `window.seating` leak | Resolved. The R4 test saves `seating`, `rooms`, `player` and `chairs` and restores them in a `finally`, deleting keys that were unset. `window.seating = null` is now set after `walker(...)`, which is harmless. |
| n3 `_goHome` comment | Resolved. The doc block at npc-needs.js:4197 states that every stall re-issue passes `reroute: true`. I checked the claim against the call sites: :782, :4244, :4289 and :4337 all pass it (and :4411 does so through `_moveForPhase`). The first walk home (:1132, :1174, :1462 and the others) passes none. The comment is accurate. |

The backlog entry (docs/IDEAS_BACKLOG.md) reads cleanly: one bullet, dated, with the review reference, size, rationale and the test it needs. The merge kept both entries; no conflict markers remain (grep returns 0) and the entry sits before the next section heading.

## 2. Merge of main (628ae88cb)

`git diff f32c9b37d 628ae88cb -- public/break_escape/js/systems/npc-needs.js` is main's chatter work only: a `requireGlobal` field in `normalisePool`, a `holds` argument to `chatterPool`, a `_holds` function bound in the constructor, and `this._holds` passed at the 10 `chatterPool` call sites, plus a doc comment on `_globalHolds`.

- None of the branch's lines are touched. `reroute: true` at :782, :4244, :4289 (the `return_resumed` re-issue, with `nudge: tries === STUCK_TRIES`) and :4337 is intact, and the `_goHome` signature at :4213 is unchanged, so no option was renamed and no early return was added in the return path.
- `chatterPool` is a barks and chatter helper. `_watchReturn`, `_goHome` and `_moveForPhase` do not call it. The only overlap is the same file.
- `_holds` is assigned in the constructor before any use and defers to `_globalHolds`, which returns false (gate closed) when the world has no `globalHolds`. A test world without `globalHolds` and a pool with a `requireGlobal` would read as closed; that is main's documented choice and does not touch walking.
- Main's other systems changes (interactions, lockpick-catch, minigame-starters, notifications, npc-barks, npc-manager, unlock-system) are outside the files this branch changes. npc-behavior.js and npc-pathfinding.js are untouched by the merge.

No conflict, no undone fix.

## 3. Checks run

- `bin/test-js` (full): 848 files passed, 1 failed, 849 total. The failure is m01-decode-task.test.mjs. It shells out to `bin/rails runner` and fails with `Bundler::GemNotFound` (rubocop, pg, puma and others are not installed for this Ruby in the worktree). The test and the code it exercises are not in `git diff main...HEAD` and nothing in the branch touches Ruby, so this is an environment fault, not a branch fault. R4 ran 825 files with 0 failures before main added 24 test files; every test file the branch adds or changes passes.
- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors, 17 warnings. `git status` afterwards: only `node_modules` untracked, no dungeon_graph files modified or created.

## 4. Branch against main

`git diff main...HEAD --name-only` outside the review folder: docs/IDEAS_BACKLOG.md, docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md, npc-behavior.js, npc-needs.js, npc-pathfinding.js, scenarios/m08_the_mole/office_life/LIVE_RETURN_STALL.md, and four test files. The review folder holds the diagnosis, review and outcomes documents plus `drivers/` shell and JS scripts. No tmp files, no flags XML, no scenario JSON or ink changes; the only scenario-folder file is the m08 office_life document.

## Findings

**nit n1: the committed live-run drivers.** docs/achitechture/reviews/return-stall/drivers/*.sh and *.js (13 files). They are review evidence and none holds a credential or URL I could see from the names and sizes, but they carry local paths and game ids from the live runs. If the owner wants the tree lean, move them to tmp/delete/ and keep the outcomes documents. Not a merge condition.

No Blocker, Major or minor findings.

## Verdict

Merge. The R4 fixes are resolved as claimed, main's chatter change does not touch the return path, the one test failure is a missing-gems fault in this worktree's Ruby environment and also affects any branch run here, and the branch carries no stray files. Per the merge-the-tested-commit rule, fast-forward main only to the hash the full suites last ran on; if main moves again, re-run bin/test-js.
