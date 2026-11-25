# CA engine review: E2 world hold round 3 and E5 flip line by global round 4 (delta)

Deltas: E2 `b02d9fef8` (on `e5f0e032c`, `adda44122`), E5 `3781d8f15`. Previous: `CA_ENGINE_REVIEW_E2_R2.md`, `CA_ENGINE_REVIEW_E5_R3.md`.
Reviewer: Sonnet 5.5, 2026-11-25. Code not edited. Deferred by design, not re-raised: schema/validator entries, the 2b live browser proof.

**Totals: E2 0 B, 0 M, 2 m. E5 0 B, 0 M, 0 m.**

Tests: `node --test test/js/social-episode-world.test.mjs test/js/social-episode-views.test.mjs test/js/social-episode-runner.test.mjs`: 117 pass, 0 fail.

## E2 round 2 findings

| R2 | Status | Where |
|---|---|---|
| m1 stage gate differs from `_settleCall` | Fixed | `systems/episode-starter.js:62` now `readState(...).stage !== 'write'`, the same test as `episode-runner-minigame.js:1169`. Doc comment `:48` updated. |
| m2 window-only load hook | Fixed | `main.js:11` static import, `:216` `settleHeldWorld(window)`. A missing export now fails at module load. |
| m3 stale test name and plan clause | Fixed | Test name no longer claims a validator warning; plan `:121` now names `settleHeldWorld` and `_settleCall`. |
| m4 reload fires on-hold-end mappings only for registered NPCs | Open (see m1 below) | Plan has no sentence for it. |

### Static import in main.js: load order and cycles

No change to load order and no cycle. `main.js:10` already imports `systems/minigame-starters.js`, which imports `./episode-starter.js` (`minigame-starters.js:18`), so the module was in the graph and evaluated before main.js's own body either way. ES modules evaluate once; the new line at `main.js:11` adds no fetch and only a binding. `episode-starter.js` imports only `episode-model.js` and `global-writer.js`; `episode-model.js` imports only `landing-page-model.js`. None of them import main.js, so no cycle. The `window.settleHeldWorld` install at `episode-starter.js:68` stays for the tests and the bridge; harmless.

### settleHeldWorld stage check against _settleCall

Equivalent for the case that matters. Both require `stage === 'write'` and a set outcome. `readState` derives `stage` from `nextStage(done)`, so the old `!done.includes('write')` was true at brief, research and prep as well; the new test excludes them. A learner who has completed `write` reads a later stage and is skipped, so the old "already settled" case still holds. Differences are only in what each does next: `_settleCall` also stops the watcher and writes through the runner, `settleHeldWorld` writes through `writeGlobal` and leaves state alone; both are idempotent against the other (`_writeHold` returns on a truthy global). Nothing regressed.

### Would the tests fail if the fixes were reverted

- m1 (stage check): yes. The new case (`social-episode-world.test.mjs:590`, outcome set, `done: []`) reads stage `brief`. With the old `done.includes('write')` test it would write `e12_world_done = true`, and `quiet()` would return `true`, not `undefined`. The positive case (`:561-568`, `done: ['brief']`, stage `write`) still passes under the new check, so it covers both sides.
- m2 (static import): only by source grep. `:597` asserts the import line and `:598` asserts `settleHeldWorld(window)` inside `once('game_loaded'...)`. Reverting to `window.settleHeldWorld?.()` fails both. It proves the text, not that the hook runs; the 2b live proof owns that.
- m3: test name and plan text only, no assertion needed.

## E5 round 3 finding

| R3 | Status | Where |
|---|---|---|
| m1 fixture keyed on `ca12_world_done`, landed class unasserted | Fixed | `social-episode-views.test.mjs:717` keys the last entry on `ca12_runner_go`; `:732-733` assert `ca12_runner_go` + `ca12_world_done` gives the timeout line and `ca12_world_done` alone gives `undefined`; `:741-742` assert `landedClass` true on the landed ByGlobal line and false on the missed one. |

Revert check: removing `aw-landed-no-tells` from `flip-view.js:371` fails `:741`. Re-keying the plan/fixture entry back to `ca12_world_done` fails `:732` (the `got_it` + cap case would match). The `tail.landedClass === false` assertion also guards against the class leaking onto missed lines. No product code changed in this delta; nothing regressed.

## Minor

**m1. The reload rule for on-hold-end mappings is not written in the plan (R2 m4, still open).**
`CA_PILOT_MECHANICS_PLAN.md:123`. After a reload the hold global is written at `game_loaded`, when only start-room NPCs have registered their mappings. ca12 is safe today only because mapping 11 (`take_off` hi-vis) sits on Lorna, the start-room host (`:188`).
Fix: add one sentence to `:123`: "Actions that must run when the hold ends go on a start-room NPC or a scenario-level mapping, because a reload settles the hold at `game_loaded`." Check it when the ca12 mappings are written, and include it in the 2b live check.

**m2. Plan `:123` still says the hook is "installed as `window.settleHeldWorld`, run by `main.js`".**
`main.js` now imports and calls the export (`main.js:11`, `:216`); the window install is only a test seam.
Fix: reword to "exported from `systems/episode-starter.js` and imported by `main.js`, which runs it on `game_loaded` (a `window.settleHeldWorld` install remains for tests)".
