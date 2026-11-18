# Code review R3 (delta): chatter pool `requireGlobal` gate

Branch feat/chatter-pool-gate, delta `3f19b91f5..HEAD` (commits 1ddb323e9 and 7f3dbd3b2). Read-only: no engine, script or test file was changed or committed. This file is the only write.

## Runs

- `bin/test-js test/js/npc-*.test.mjs test/js/needs-*.test.mjs test/js/validator-*.test.mjs`, run twice: 178 files passed, 0 failed, both times. Other sessions were loading the machine at the time, so the pass also held under CPU contention.
- Mutation (my own, in the worktree, restored from a byte copy after each run): at each of `npc-needs.js:1019`, `:2161`, `:2173`, `:2221`, replace the last argument `this._holds` with `() => true` (gate always open; R2 and the outcomes file used the "remove the argument" mutation, so this is a different one). The gate test file failed each time on exactly the intended new test:
  - 1019: `an announce asks playerHears with the open announce pool's overhearRadius only`
  - 2161: `a faint grumble asks faintVolume with the open pool's overhearRadius only`
  - 2173: `_unheard asks playerHears with the open pool's overhearRadius only`
  - 2221: `mutter: with the speech lock busy, a closed pool shows its picture at once; an open one waits for the lock`
- After the runs `git diff --stat -- public scripts` is empty and `git status --short` shows no change under `public/` or `scripts/` (the only modified files in the tree are regenerated `dungeon_graph.*` files, which were already modified and are not part of this delta).

## Severity table

| Sev | Count | Items |
|---|---|---|
| B (blocker) | 0 | |
| M (major) | 0 | |
| m (minor) | 0 | |
| n (nit) | 3 | n1, n2, n3 |

## Outcome check for each R2 finding

| R2 | Claimed | Verified | Notes |
|---|---|---|---|
| m1 | Fixed | Yes | Four new tests, one per uncovered site. Each fails under the always-open mutation above, and the outcomes file reports the same for removal. Each asserts a concrete value (160 closed, 500 open; wait list empty versus one entry with `lines: true`), not mere presence. The announce test also asserts that the announce happened, so it cannot pass vacuously. |
| n1 | Fixed | Yes | Timeline of `mode:phase` per NPC every 500 ms for 60 steps, compared whole against the ungated run. See "Is the timeline test deterministic" below. |
| n2 | Fixed | Yes | `grumble_off` has a `PICTURE_CHATTER` entry (npc-needs.js:130, `['avoid']`), `grumble_blocked` has none, so `equal(..., 'grumble_off')` and `equal(..., 'grumble')` each pin one answer. The old either-or assertion is gone. |
| n3 | Fixed | Yes | `station_fail` and `social_blocked` are in both lists (NPC_NEEDS_SYSTEM.md 5.6a and SKILL.md:168). They now match the V12 list at `scripts/validate_office_life.rb:778` as R2 quoted it. |
| n4 | Fixed (documented) | Yes, with a wording nit (n1) | The doc line matches the code: `_tickMutterWaits` sends the mutter once `late || w.lines === false || _speechFreeFor(...)`, and a wait stored with `lines: true` keeps waiting for the lock until `MUTTER_WAIT_MS`; `_sayMutter` then runs `_grumble`, which finds no lines in the closed pool. |

## Is the timeline test deterministic

Yes. `office()` builds the system with `manualClock: true` and a fixed seed, so `step(500)` moves a counter and every random draw comes from the seeded generator. The only wall-clock reads in `npc-needs.js` are `Date.now()` at line 5425 as a fallback when `gameClock` is absent, and the stub world does not reach it. Passing twice under load agrees. The thirty seconds are 60 fixed steps, not elapsed time, so machine speed does not matter.

It can fail: a gate that changed trip choice, use length or speech-lock timing would shift a `job:using` entry by at least one 500 ms sample. The two new assertions guard against a vacuous pass (both NPCs must reach `job:using`, and each must leave it within the window). Both runs use the same seed, so a change that consumes a different number of random draws when a pool is closed would show up as a mismatch, which is the right behaviour for "gate does not alter timing".

Limit worth knowing, not a defect: the 500 ms sampling cannot see a difference shorter than one step. Nothing in the gate acts at that scale.

## Doc text against code

- 5.6a bullet on the queued mutter: accurate in structure and bound (`MUTTER_WAIT_MS`). See n1 for one wording point.
- SKILL.md:168 and NPC_NEEDS_SYSTEM.md security-pool lists: accurate against the V12 list.
- No other doc line changed in the delta.

## Regressions

None found. The delta touches only the test file, two doc lines and the review files; the engine is identical to R2's reviewed state. Full suite passes twice.

## Findings (all nits)

### n1. The queued-mutter doc line says "shows the picture", which is not so with `npcThoughts` off

`docs/achitechture/NPC_NEEDS_SYSTEM.md:660`. With thoughts off (all campaign missions) a mutter whose pool has no lines shows nothing; `_sayMutter` (`npc-needs.js:2250` onwards) emits `npc_mutter:<id>` with `line: null, picture: null`. The doc says it "shows the picture for its topic".
Failure scenario: an author reads it, expects a bubble in a campaign mission and files a bug.
Fix: "then shows the picture for its topic (or nothing, with `npcThoughts` off), not a line".

### n2. The closed mutter case checks that nothing waits but not that the picture is shown at once

`test/js/npc-chatter-pool-gate.test.mjs`, the test starting `mutter: with the speech lock busy`. R2 m1's fix asked for both halves: no wait entry and a `npc_mutter:ann` emission straight away. The test asserts only `mutterWaits()` is empty. A change that dropped the mutter on the floor instead of showing the picture would still pass.
Failure scenario: `mutter()` returns early on a closed pool; the NPC never shows the reason picture; this test stays green.
Fix: in the closed branch, assert `closed.w.calls.emits.some(e => e.name === 'npc_mutter:ann')` (the office uses `npcThoughtsOn = () => true` by default, so the picture appears).

### n3. The open-gate half of the radius tests does not isolate the gate from the default

`_unheard` and faint-grumble tests compare 160 (closed) with 500 (open). 160 is also the value any bug that ignores `overhearRadius` entirely would produce, so only the open half proves the radius is read at all. That is covered (500 is asserted), so the pair is sound; the remark is only that the closed half cannot tell "gate closed" from "radius ignored" without the open half. No action needed unless someone splits the loop into two tests.
