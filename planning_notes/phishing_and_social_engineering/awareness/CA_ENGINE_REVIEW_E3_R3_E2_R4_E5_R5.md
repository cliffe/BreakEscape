# CA engine review: E3 round 3, E2 round 4, E5 round 5 (combined delta)

Delta: `802307b61` (E3 R2 fixes) on top of `e14f104ce`/`04a474ad1`; the E2 and E5 baseline is `a0acd5080` and the last review `CA_ENGINE_REVIEW_E2_R3_E5_R4.md`. Files re-read: `episode-model.js`, `episode-runner-minigame.js`, `utils/world-play.js`, `systems/episode-starter.js`, `main.js`, `flip-view.js` (unchanged since the E5 review).
Deferred by design and not raised: schema and validator work, live proofs 1b, 2b and 5b.

**Totals: E3 0 B, 0 M, 0 m. E2 0 B, 0 M, 0 m. E5 0 B, 0 M, 0 m.**

Suites: `node --test test/js/social-episode-*.test.mjs` 268/268 (beats 37/37, one new test); `node --test test/js/*parity*.test.mjs` 78/78.

## E3 R2 minors

| R2 | Status | Where |
|---|---|---|
| m1 Carry on from the waiting panel rendered the next stage twice | Fixed | `episode-runner-minigame.js:622-625` (`_unwatchReady()` and `_beatPanel = null` before the done-global write) |
| m2 facilitated pause showed a dead Look up | Fixed | `:538` adds `!this._stepped(this._defendBeat())` |
| m3 re-arm test did not check the spot | Fixed | `social-episode-beats.test.mjs:652-658` sets `window.player` and asserts `calls.spot[0]` |

Would the new tests fail without the fixes? Checked by mutating a scratch copy (`scratchpad/mut`, the worktree untouched):
- m1 fix removed: `E3 panel: Carry on from the waiting panel renders the next stage once` fails (36 pass, 1 fail). The test counts `renderFlipView` calls, so it sees the second render.
- m2 fix removed: the facilitated pause test fails on the new "no dead Look up" assertion.
- m3: replacing the recorded spot with `null` or a constant fails both the re-arm test and the default-spot-functions test, so the value is now pinned.

`_carryOn` ordering is safe: the panel is dropped before `_markStepAwayPicked` and the write, nothing between reads `_beatPanel`, and the choose-mode Carry on only loses a ready-global listener the next render replaces. The write's synchronous emit now finds no listener, so the E4 take-back mapping runs with no runner render inside it.

## E2 (hold, settleHeldWorld, leaveWorld, costume ownership)

- `leaveWorld` now calls `returnPlayerTo(back, deps)` (`world-play.js:131`), the same `placeAt` as before with a finite-coordinate guard. `origin` and `costumed` handling is untouched: costume removal is still gated on `back.costumed` (`:135`), applied only when `enterWorld`'s `applyCostume` returned true (`:109`). The step-away spot is a separate variable (`stepAwaySpot`), so `worldActive()` and the call hand-back never see it.
- `settleHeldWorld` is unchanged. Its precondition (call outcome set, stage `write`, hold global falsy) cannot hold together with a `resumeOnDone` beat's `Via === "lookup"`: that Via is cleared to `resumed` at the first open of the next stage, and a call outcome needs the write stage to have been opened.
- The call watcher's `finish` reopens the runner through `startMinigame`; the open runs `_settleStepAwayWatch`, which clears any recorded spot without a move. Correct: the learner is at the kiosk.

## E5 (flip line by global)

`flip-view.js` is unchanged since the E5 R4 review. `_renderFlip` still passes `globals: this.globals` (`:1037`), and `this.globals` falls back to `gameState.globalVariables` (`:312`), so a watcher reopen (`reopen` carries no `globals`) renders the same flip line. The step-away reopen also sets `resume: true` and `state`, which the flip path ignores.

## Load-time hooks

`main.js:213-221` registers two independent `once('game_loaded')` listeners, settle first and the watcher second. `settleHeldWorld` is synchronous and wrapped in try/catch; `startStepAwayWatchFromState` is async (dynamic import) with its own `.catch`, so a throw in one cannot stop the other. They act on exclusive states (see E2 above), so order does not change the outcome even so. `startStepAwayWatchFromState` is a pure read of the saved state, starts nothing for a facilitated run (a facilitated run never stores `Via`), and starts at most one watcher (`watchStepAway` stops any earlier one for the episode). The world test (`social-episode-world.test.mjs:597`) accepts the extended import.

No new findings.
