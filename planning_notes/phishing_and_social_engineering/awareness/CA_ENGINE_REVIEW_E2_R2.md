# CA engine review: E2 world hold, round 2 (delta)

Commits reviewed: `e5f0e032c` (original) and `adda44122` (round-1 fixes).
Round 1: `CA_ENGINE_REVIEW_E2_R1.md`. Spec: `CA_PILOT_MECHANICS_PLAN.md` section 4 E2.

**Totals: 0 B, 0 M, 4 m**

Tests: `node --test test/js/social-episode-world.test.mjs` passes (26/26). Every suite that loads `episode-starter.js`, `minigame-starters.js`, the episode runner, `world-play.js` or `global-writer.js`, plus all `social-episode*` suites, passes (3165 tests; the one "failure" in that run was an `.ink` fixture my file glob picked up, not a test).

## Round-1 findings

| R1 | Status |
|---|---|
| M1 schema and validator | Deferred by decision; not re-raised. |
| M2 reload leaves the hold open | Fixed: `settleHeldWorld` on `game_loaded` (checked below). |
| m1 give-up writes without an outcome | Fixed: `episode-runner-minigame.js:1478` writes only when the outcome was heard or changed (the same test as `ended`). Tested both ways. |
| m2 overlays opened by the cap write | Fixed: one-tick re-arm at `:1447-1454` (checked below). Tested with an overlay opened by the write. |
| m3 world costume over a wearable | Validator half deferred with M1. See m3 below for the test name that claims the warning exists. |
| m4 stale comments | Fixed in `world-play.js`; schema text deferred with M1. Plan text has one leftover (m3). |
| m5 test gaps | Fixed: `leaves() === 0` on the reload test, give-up test, global-true-mid-chat test, comment corrected. |

## settleHeldWorld (episode-starter.js:43-67, main.js:209-216)

- **Fires once per load, after the restore.** `game_loaded` is emitted once, at the end of `create()` (`core/game.js:2656`), and main.js registers with `once`. Saved globals are merged at `game.js:1777`, well before, and the episode state and the call outcome are both globals, so all three reads see server state.
- **No double write, no race with the runner.** At `game_loaded` the runner cannot be open (nothing reopens it on load; `worldAway` is empty on a fresh page). Either order is idempotent anyway: `settleHeldWorld` returns on a truthy global or a done write stage, `_writeHold` (`episode-runner-minigame.js:1162`) returns on a truthy global, and `writeGlobal` emits only on a change. A later kiosk open finds the global set and only completes the stage.
- **Delta only.** One scalar global through `writeGlobal`, then `stateSync.sync()`. The sync's `confirmed` is seeded from the bootstrap before the restore (`game.js:1770`), and `sync()` coalesces with an in-flight run (`state-sync.js:824-827`). Nothing grows and nothing is re-sent.
- **Window global.** It is installed today: main.js imports `minigame-starters.js` statically (`main.js:10`), which imports `episode-starter.js` (`minigame-starters.js:18`). It matches the `installStepAwayHold` precedent. It is fragile, though; see m2.
- **The main.js hook test is a source grep** (`social-episode-world.test.mjs:594-597`). It proves the text is there, not that the hook runs. The 2b live check must show the real path (list at the end).

## One-tick re-arm at the cap

Correct. At the cap tick `holdWritten` is set, the global is written and the tick re-arms without stopping the watch. On the next tick the global reads true, so `held` is false; an overlay the write opened makes `current` truthy and the tick falls through to the normal re-arm, so the hand-back waits for it to close. A runner opened inside the 300 ms stops the watch and `_settleCall`/`_settleWorld` settle it as before. A global that turned true on its own skips the extra tick, which is right: its mappings ran at the earlier close and a new overlay is caught by `!current`. If the write throws, the next tick hands back without the global (the comment says so); `writeGlobal` throwing is not a realistic path, so I accept it.

## Give-up path

Correct as far as E2 goes. With no outcome heard it hands back and leaves the global unset, so a retry still holds. With an outcome heard (only possible if a chat stayed open for four hours) it writes and hands back in the same tick, without the cap path's extra tick and with the chat still open. That is the pre-existing give-up behaviour at a four-hour edge; not raised.

## Minor

**m1. `settleHeldWorld` gates on "write not done" where `_settleCall` gates on "stage is write".**
`systems/episode-starter.js:61` against `episode-runner-minigame.js:1169`.
`!done.includes('write')` is also true while the learner is at an earlier stage (brief, research, prep). If the call outcome global is set at that point (a stale outcome from an earlier call to the same `callId`; the watcher's `before` parameter exists because the outcome can already be set when a call starts), a reload writes the hold global true before the call is made. The real call then runs with `holdOpen` false from the first tick, so it hands back at once and none of the beat's window mappings ever arm. `_settleCall` would not do this, because it requires `state.stage === 'write'`. No path in the engine today resets the stage state while keeping the outcome, so this is latent.
Fix: use the runner's test, `readState(episode, globals[stateKey(episode.id)]).stage !== 'write'` → return false. Add one case to the "does nothing" test: outcome set, state at `brief` only with the write stage not yet reached.

**m2. The load hook is reached through `window` with optional chaining, so a broken module chain is silent.**
`main.js:214`, `episode-starter.js:67`.
If `minigame-starters.js` is ever moved to a dynamic import (main.js already does that for several modules), `window.settleHeldWorld` is undefined at `game_loaded`, `?.()` does nothing, and R1 M2 is back with no error and the grep test still green. main.js already imports from `systems/` statically; `import { settleHeldWorld } from './systems/episode-starter.js'` adds no module to the page (it is in the graph already) and does not touch the Node harness copy lists (main.js is never loaded in Node). A missing export would then fail at load.
Fix: import it in main.js and call `settleHeldWorld(window)`; keep the window install only if the test bridge wants it. Leave the grep test, or point it at the import, and rely on the live check below for the real path.

**m3. Leftover text that says something untrue.**
- `test/js/social-episode-world.test.mjs:599`: the test name ends "(over a wearable the validator warns)". No validator warning exists (R1 m3's validator half was deferred with M1). Fix: drop the parenthesis, or say "validator warning deferred with M1".
- `CA_PILOT_MECHANICS_PLAN.md:121` still lists "the `_settleWorld` path after a reload at `:1246`" as a way the hold ends. After a reload `worldAway` is empty, so `_settleWorld` returns at once; the reload paths are now `settleHeldWorld` and `_settleCall` (as `:123` says). Fix: replace that clause with "a reload (`settleHeldWorld` on load, or `_settleCall` on the next kiosk open)".

**m4. On the reload path, an on-hold-end mapping fires only if its owner is registered by `game_loaded`.**
`main.js:213`; the plan's mapping 11 (`global_variable_changed:ca12_world_done` → `take_off` hi-vis, on Lorna) and Yusuf's mapping 8.
On the live page the hold global changes while the learner is in the lobby, so every NPC's mappings are registered. After a reload the write happens at `game_loaded`, when only start-room NPCs have registered (NPCs in other rooms register later; `npc-manager.js:404` handles the same gap for held conversations). A mapping on a lobby or studio NPC misses the one change event and never fires, since the global stays true. For ca12 this is safe only if Lorna's `take_off` mapping is on an NPC in `training_room` (the start room); otherwise the learner reloads wearing a hi-vis that nothing takes off. Yusuf's mapping 8 is harmless after a reload (his patrol restarts from the scenario default).
Fix: one line in the E2 section of the plan: actions that must run when the hold ends belong on a start-room NPC (or a scenario-level mapping), because a reload settles the hold at `game_loaded`. Check it when ca12's mappings are written, and cover it in the live check.

## What the 2b live check must show (the main.js hook has only a source-grep test)

On a test scenario with a world hold, in a real browser:
1. Make the call so the outcome global is set, then reload before the cap and before the hold global is set. Do not touch the kiosk.
2. After the page loads: `window.gameState.globalVariables[<holdUntil>] === true` without any kiosk open, and the episode state global still has no `write` in `done`.
3. The network log shows a sync request after load whose globals delta carries the hold global (and only what changed since the bootstrap), not the whole globals block; no second write of the hold global follows.
4. The gate is inert and no window mapping fires afterwards (walk through the lobby past the guard). Wait past `holdMaxMs` and confirm nothing changes.
5. Any on-hold-end action (ca12: the hi-vis `take_off`) has run after the reload, i.e. its mapping's owner was registered by `game_loaded` (m4).
6. Open the kiosk: the write stage completes, the flip opens once, and the hold global is not written again.
7. Without the reload, a cap that ends while nothing is open hands back about 300 ms after the global write (one tick), once.
