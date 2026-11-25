# CA engine review: E2 world hold, round 1

Commit reviewed: `e5f0e032c` (E2: world hold after the call, holdUntil and holdMaxMs, plus unit tests).
Spec: `CA_PILOT_MECHANICS_PLAN.md` section 4 E2 (lines 118-127), section 3 tests (line 436), step 2b (line 479).

**Totals: 0 B, 2 M, 5 m**

`node --test test/js/social-episode-world.test.mjs` passes (19/19); the `social-episode-runner*` suites pass (53).

## What holds up

- The tick loop does what the spec asks in the live-page case. The hold ends on the global, and at the cap it writes the global true (once, guarded on `!g[until]` and again in `_writeHold`), then hands back once. A chat open at the cap is waited out because the `!current` test is unchanged. A global already set by a mapping on the chat close is not overwritten. Without `holdUntil`, `hold` is null, `held` is false and the path is byte-for-byte today's.
- Timer cleanup: every exit goes through `stopCallWatch`, which clears the scheduled tick and the event listener. Hold end, cap, runner reopened, give-up and the `_settleCall` stop all hit it. No interval is created (it is a re-armed timeout), so nothing leaks. No double hand-back: `back` empties `worldAway` before `finish` reopens the runner, so `_settleWorld` is a no-op on the flip reopen, and `_settleCall` is a no-op because `finish` has already saved the write stage.
- Kiosk inside the grace: `_settleCall` stops the watcher and writes the global; `_settleWorld` then finds the global set (no second write) and hands back. Exactly one leave, one flip (tested).
- Synced state: the only new write is one scalar global set to true, at most once, through `writeGlobal` plus `stateSync.sync()`. Nothing is added to the episode state record, and the hold clock lives only in memory. No growing state.
- Step-away (EC1/E3) does not touch `worldAway`, `enterWorld` or `leaveWorld`, and it runs at the defend stage where `_settleCall` returns early, so there is no interaction.
- Costume ownership matches the spec: `origin.costumed` is set only when `world.costume` is set and `applyCostume` returns true (the real `applyCostume` returns exactly `true` on success, `player-costume.js:70`), and `leaveWorld` removes only then. The existing "world costume comes off" behaviour still passes.
- Deviation (1), writing the global from `_settleCall` for the reload and kiosk cases, is sound: on those paths the stage state has not yet recorded the call, so `_settleCall` is the first place that knows the hold is over. Deviation (3), the clock starting at the first watcher tick, is sound: at most 300 ms late, and it sidesteps an unreliable event timestamp. Deviation (2) is sound only once the validator rule exists (see M1).
- Tests drive the real path: the real runner, starter, framework and `watchCall`, with fake timers and a fake clock. Only `enterWorld`/`leaveWorld` are stubs, and `world-play.js` has its own stub-room tests.

## Major

**M1. No validator rule and no schema entry; `holdUntil`/`holdMaxMs` are rejected by the schema and an uncapped hold drops silently.**
`scripts/scenario-schema.json:3138-3166` (the `world` block has `additionalProperties: false` and no `holdUntil`/`holdMaxMs`), `scripts/validate_social/awareness.rb:414-455` (`world_checks` has no hold rule), `episode-model.js:582-583`.
The spec gives E2 about 10 validator lines and a test that "the validator rejects `holdUntil` without `holdMaxMs`" (plan :127, :436). The commit adds neither. Today ca12's planned `world` block (plan :157) fails schema validation as an unknown key. And because `worldFor` drops a hold that has no valid cap, an authoring slip (`holdMaxMs` missing, `"75000"` as a string, or 0) gives today's instant hand-back with the done global never written, so every mapping gated on it stays armed into the defend half. That is the failure the "always ends with the global true" rule exists to prevent, and it would be silent.
Fix: add `holdUntil` (string, minLength 1) and `holdMaxMs` (number, exclusiveMinimum 0) to the schema `world` properties and description. In `world_checks`: error when `holdUntil` is set without a positive numeric `holdMaxMs`; warn when `holdMaxMs` is set without `holdUntil`; error when `holdUntil` names a server-owned global (worn, imported or credit global; `game.rb:189-192`), because the engine's client write of it would be refused on sync; warn when `holdMaxMs` exceeds the watcher's four-hour give-up (`CALL_WAIT_LIMIT`, `episode-runner-minigame.js:143`). Add the matching validator tests.

**M2. After a reload while held, nothing ends the hold until the learner opens the kiosk.**
`episode-runner-minigame.js:1168-1180` (`_settleCall`, the only reload path), `:1394` (`worldAway` and the watcher are page memory).
A reload drops the watcher, the cap clock and `worldAway`, and the learner respawns in the start room. The hold global is written only when the runner next opens (`_settleCall`). Until then there is no cap and the global stays false, so the beat's window mappings (the live gate, Yusuf's challenge, the no-vest toast) stay armed while the learner walks about, with no upper bound. The spec asks that the hold "always ends with the global true" and that a reload "settles and resumes into the flip" (plan :121, :123, step 2b :479). The unit test at `test/js/social-episode-world.test.mjs:411` opens the runner by hand straight after the simulated reload, so it cannot see the gap. Step 2b's reload check will pass only if the tester happens to walk to the kiosk first.
Fix: settle held worlds once on page load. `systems/episode-starter.js` already reads `awarenessEpisode`, so add a small `settleHeldWorld()` there (or wherever the game runs its post-load scenario hooks). When `worldFor(ep)?.holdUntil` is set, the call outcome global is a string, the stored state's `done` lacks `write` and the hold global is falsy, write the hold global true (one delta) and sync. The runner's `_settleCall` then completes the stage on the next kiosk open as now. Test it with a load-time call and no runner open, and assert the global is true and no hand-back ran. Add the same check to the 2b live proof: reload, do not touch the kiosk, wait past `holdMaxMs`, confirm the global is true and the gate is inert.

## Minor

**m1. The four-hour give-up writes the hold global even when no call outcome was ever heard.**
`episode-runner-minigame.js:1466-1469`. `endHold(g)` runs regardless of `ended`. A learner who left the phone chat hanging until give-up and then retries from the kiosk gets no hold, because the global is already true, and the beat's mappings never arm. The prep-card-close test (`:447`) protects exactly this case on the other exit.
Fix: `if (ended) endHold(g);` (hoist `ended` above the branch, or recompute it).

**m2. At the cap, the hand-back runs in the same tick as the global write, so it does not see overlays the write opens.**
`episode-runner-minigame.js:1444-1446`. `endHold` fires `global_variable_changed` for the hold global, and the scenario's mappings run synchronously. If any of them opens an overlay (a chat, a confirm, a readable), the hand-back teleports the learner and `finish` starts the runner over it. ca12's planned `take_off` (E4) opens no confirm (`apply-actions.js:425-439`), so ca12 is safe today, but nothing stops a later author.
Fix: when `endHold` actually writes, re-arm one more tick (`timer = schedule(tick, CALL_WAIT_MS); return;`) and hand back on the next tick, once `current` is clear and the global is true. That costs 300 ms and keeps "one hand-back".

**m3. A `world.costume` put on over a worn wearable still strips the wearable's look on hand-back.**
`utils/world-play.js:67-71`, `:96-101`; `player-costume.js:55-58` (`keep = worn || ...`, so `removeCostume` restores the chosen avatar, not the wearable). ca12 deletes `world.costume`, so it is not reached, but an episode with both a world costume and a wearable gets a worn global that says one thing while the sprite shows another. No check warns about it.
Fix: a validator warning in `world_checks` when `world.costume` is set and the scenario has any `wearable` item, pointing the author at the wearable instead.

**m4. Stale comments and docs.**
The `world-play.js` header (`:4-6`) still says `leaveWorld` "takes the costume off", and the `leaveWorld` JSDoc (`:84-86`) says "The costume comes off even if the placement cannot be made". The schema `world` description (`scenario-schema.json:3140`) says the learner is moved back "on the call ending (any outcome)", with no mention of the hold.
Fix: say that only a costume this module put on comes off, and describe the hold in the schema text.

**m5. Test gaps.**
`test/js/social-episode-world.test.mjs`:
- The reload test (`:411`) does not assert `leaves() === 0` and does not show that `worldAway` is empty. `worldAway` is module state shared across tests, so the test depends on earlier tests having emptied it.
- No test covers the give-up path under a hold (m1).
- No test covers the hold global turning true while a chat is still open. The hand-back must wait for the close; the code does this, but nothing pins it.
- The comment at `:431` ("the watcher sees the runner and stops") is wrong: `_settleCall` already stopped it on open.

Fix: add the three cases and correct the comment. The validator tests are covered by M1, the load-time settle test by M2.

## Not checked here

- Step 2b's browser live proof has not been run. Per the plan it needs its own committed hash, and M2 changes what its reload check should look for.
