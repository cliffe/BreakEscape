# CA engine review: E3 step-away beats as a list, round 2 (delta)

Commits reviewed: `e14f104ce` (engine and tests), `04a474ad1` (plan text). Previous round: `CA_ENGINE_REVIEW_E3_R1.md` (0 B, 1 M, 7 m).
Deferred by design and not raised: the schema and validator work, the 5b live proof (its kiosk-peek steps are listed at the end).

**Totals: 0 B, 0 M, 3 m**

Suites: `node --test test/js/social-episode-*.test.mjs` 267/267 (beats 36/36, up from 27); `node --test test/js/*parity*.test.mjs` 78/78. No console errors.

## R1 findings

| R1 | Status | Where |
|---|---|---|
| M1 kiosk peek cancels the return | Fixed | `episode-runner-minigame.js:457-472` |
| m1 waiting panel does not refresh | Fixed | `:602-612` |
| m2 facilitated beat offered again, double emit | Fixed (leftover in m2 below) | `:261`, `:583-590`, `:689` |
| m3 facilitated pause ignores `facilitated: false` | Fixed | `:538` |
| m4 reload return makes no move | Not fixed, decision recorded in the plan (Reload bullet). Sound: the reload spawn is in the kiosk room, and a kiosk peek after the reload now records a spot (see below) | plan line 351 |
| m5 saved-result note on a mid beat | Fixed, `<prefix>ReadyWait` with an engine default | `:649-651` |
| m6 validator todo misses three rules | Fixed, items 8-10 in `tmp/handover/ca0/E3_validator_todo.md`, `ReadyWait` added to the strings list | |
| m7 test gaps | Fixed: default spot functions, `main.js` registration, a stubbed sandbox scene completing through the framework, plus the M1/m1/m2/m3/m5 cases | `social-episode-beats.test.mjs:646-787` |

m3's second site (the triage reopen's `stepAwayAfter`, now `:1546`) needs no gate: it is set only when the run is not facilitated, and a beat's `facilitated` flag only matters in a facilitated run.

## The re-arm on kiosk close

- **The spot.** Re-arming from where the learner stands is right. The kiosk opens only from an interaction in range (`interactions.js`, `INTERACTION_RANGE_SQ`), the learner cannot move while the overlay is up, and `kiosk` is the only registry route to `startEpisodeRunner` (`minigame-registry.js:29`). So the close-time position is a kiosk-side spot, as good as the original Look-up one. Keeping the original would need a second store, because `onOpen` clears it (`_settleStepAwayWatch`) before the panel is known; nothing is gained. It also helps the reload case: after a reload the load-time watcher has no spot, and a peek-and-close now records one.
- **The condition** (`:460-462`) reads the instance's own `_beatPanel` and `state`. Look up clears `_beatPanel` before `close()` (`:693`), Carry on and the refresh clear it too (`:633`, `:607`), so only a close that leaves the beat live re-arms. A facilitated run never re-arms. A done global set without its change event (no writer does this) leaves the panel on "waiting"; the re-arm then reopens at the next stage after the grace with no real move. Acceptable.
- **No double arm.** `watchStepAway` stops any watcher for the episode first (`:1693`), and the map holds one per episode id. The load-time watcher is stopped by the kiosk open, then the close arms one. When the framework ends the waiting runner to start another minigame, `startMinigame` ends the running one first (`minigame-manager.js:66-75`), so the re-arm in `cleanup` runs before any new runner's `onOpen`, which stops it again. A chat that takes over the waiting runner leaves the re-armed watcher waiting on the chat, which is what we want. If the async load-time start lands after a kiosk open, its first tick sees a runner that is not its opener and ends.
- **`opener: this`** is the closed instance. Harmless: the framework's current minigame is never that instance again.

## Facilitated memory

`FACILITATED_STEPPED` (`:261`) holds `"<episodeId>:<beatId>"` strings, added only in facilitated runs, at most one per beat. It lives in module memory, is never written to game state and is never synced, so `player_state` does not grow. Keys carry the beat id, so one beat's pick cannot hide another. It clears on page load and in the test reset. There is no in-page episode restart that would need to clear it.

## The `ReadyWait` string

Engine default "Look up is ready in a moment." (`:161`). It is a UI hint, not a spoken line, and sits with the other generic defaults (`BEAT_COPY.heading`, `.text`, `.waiting`) that a shell can override. It should stay optional. Making it required would be out of step with those keys, and the default is neutral enough for any beat. The validator todo lists the key. If anything, rule 7 could warn when a beat has a `readyGlobal` and no `<prefix>ReadyWait`; that is optional.

## Minor

**m1. Carry on from the waiting panel renders the next stage twice.**
`episode-runner-minigame.js:620-636` with the waiting listener at `:602-612`. `writeGlobal` emits `global_variable_changed:<doneGlobal>` synchronously (`global-writer.js:191-196`). While `_carryOn` runs, the waiting listener is still subscribed and `_beatPanel` still names the beat, so the listener clears the panel, runs `_markResumed` (a no-op, since `Via` is already `carry`) and renders the next stage. Then `_carryOn` renders it again. Today that is harmless: stage renders have no side effects and launches need a click. But it means the next stage's render runs inside the global's emit, at the same moment the done global's scenario mappings (E4 take-back) fire. A future render with a side effect, or a mapping that opens a minigame and ends the runner mid-emit, would then act on a runner `_carryOn` is about to render again.
Fix: in `_carryOn`, call `this._unwatchReady()` and set `this._beatPanel = null` before the write. Test: count `renderFlipView` calls after Carry on from the waiting panel (expect 1).

**m2. A facilitated pause can show an enabled Look up that does nothing.**
`:538` gates the pause Look up on `_defendBeat()?.facilitated` but not on `_stepped(beat)`. After a facilitated Look up from the defend pause, `FACILITATED_STEPPED` holds the post-defend beat. Any later open that carries `pauseAfter: 'defend'` (the triage reopen, `:1544`, or a framework restore of the runner's own params) renders Look up enabled, and `_lookUp` returns at `:689` without a word. It is rare, since the defend stage completes once. Behaviour change for the 19 legacy shells in facilitated mode: Look up from the pause now emits once per page load where it used to be once per open. That matches the spec ("emits once per beat") and the step-away suite passes.
Fix: `... && this._defendBeat()?.facilitated && !this._stepped(this._defendBeat())` at `:538`, and one assertion in the test at `test:705`.

**m3. The re-arm test does not check which spot is recorded, and covers only `forceCloseMinigame`.**
`social-episode-beats.test.mjs:646-668` asserts `calls.spot.length === 1`, not its value. If the re-arm recorded a stale spot (the Look-up position, or null), the test would still pass. Reasoning on revert: with the `cleanup` re-arm removed, `pendingTimers()` stays 0 and the test fails, so it does catch the fix being reverted. The other new tests also fail on revert: the refresh test (`beatPanel` stays `waiting`), the facilitated reopen (`_steppedAways` is per instance, so the panel comes back), the pause gate, and both `ReadyWait` assertions. The Carry-on-from-waiting test at `:670` passes with or without the fix; it guards against an extra arm.
Fix: set `params.player` (or `window.player`) to a known position before the peek, different from the Look-up one, and assert `calls.spot[0]` equals it. Optionally add a case where a stub chat scene starts over the waiting runner: one watcher armed, no return until the chat closes, then one return.

## 5b live proof: steps to add for the kiosk peek (`test_episode_world_beat`)

Use the real kiosk X, not `forceCloseMinigame`, and read state from `gameState.globalVariables` and `world-play`'s `getStepAwaySpot()`.

1. At the kiosk in the start room, finish `mistake`, pick Look up. Confirm `worldBeatPickedVia === "lookup"` and a spot is recorded.
2. Take the item, walk into the second room, drop it, walk back and open the kiosk before the finder resolves. Expect the waiting panel (the shell's `worldBeatWaiting` text, Carry on only, no Look up) and `getStepAwaySpot()` null. `Via` is still `"lookup"`.
3. Close with the kiosk X. Expect `getStepAwaySpot()` to equal the player's current position at the kiosk.
4. Walk through the side door into the second room. Let the finder find and use the item (natural decay or `triggerNeed`). About 4 s after its last line ends (no chat open), expect the learner moved to the recorded spot in the start room, the runner open at `flip`, `Via === "resumed"`, exactly one runner open and no console errors.
5. Peek twice: open and close the kiosk twice mid-beat, then let the beat end. Expect one return and one reopen.
6. Peek, close, then talk to the finder NPC so a chat is open when the done global lands. Expect no move until the chat closes, then the 4 s grace, then the return.
7. Peek and stay on the waiting panel until the done global lands (the 90 s timeout bark). Expect the panel to move to `flip` by itself and `Via === "resumed"`. Close the kiosk, walk away, wait 10 s: no move and no reopen.
8. Peek, close, reload before the done global lands. Expect the load-time watcher to start (`Via` still `"lookup"`), no spot recorded, and after the beat ends the runner reopening at `flip` with no move (the recorded decision). Then repeat with a peek and close after the reload: the return now moves the learner to the kiosk spot.
9. Peek and Carry on from the waiting panel. Expect the done global written once, the take-back mapping firing once, the flip shown, and nothing armed on close (no move or reopen within 10 s).
