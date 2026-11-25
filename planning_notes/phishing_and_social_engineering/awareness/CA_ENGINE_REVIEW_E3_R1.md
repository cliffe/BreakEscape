# CA engine review: E3 step-away beats as a list, round 1

Commits reviewed: `095dc1a30` (engine), `7f0ab0328` (tests), `9ebc391b2` (watcher grace, facilitated skip, console errors).
Spec: `CA_PILOT_MECHANICS_PLAN.md` section 4 E3 (lines 322-357), section 3 E3 checks (line 440), steps 5 and 5b (lines 485-486), the ca15 beat (2.2-2.7, lines 266-271).
Deferred by design and not raised: the schema and validator entries (`tmp/handover/ca0/E3_validator_todo.md`), the 5b live proof.

**Totals: 0 B, 1 M, 7 m**

All ten `social-episode-*` suites pass: beats 27/27, world 26/26, runner 54/54, step-away 56/56 (unchanged since before E3), model 14, views 37, sandbox 18, brief-cards 11, reread 8, aftermath 7.

## What holds up

- **Legacy shells are unchanged.** All 19 shells that set `awarenessEpisode.stepAway: true` (ca03, ca05-ca16, ca18, test_ca01_panel, test_ca_office_kit, test_ca_step_away; none uses `stepAways` yet) normalise to `LEGACY_BEAT`, whose filter (`after: defend`, not the last stage, debrief after defend, full non-check episode) is the old `stepAwayOn` test exactly. Traced paths:
  - Post-defend panel (`episode-runner-minigame.js:430-432`): the only change is `this.state[this._defendBeat().pickedKey]`, reached only after `stepAwayOn` short-circuits, so `_defendBeat()` is never null there and the key is `stepAwayPicked`.
  - Carry on (`_carryOn`, `:582`): `_markStepAwayPicked(beat, null)` keeps the old guard (facilitated or no beat: no write; already picked: no write), `doneGlobal` is null so no global write, then the same panel reset and render.
  - Look up (`:646`): same guard, same single `stepAwayPicked` write, no watcher (`resumeOnDone` false), same `{ episodeId }` payload on `episode_step_away`.
  - `stepAwayHeld` (`episode-model.js:204`), `_reemitDefendDone`, `debriefSeen`, the facilitated pause Look up (`:520`) and the triage reopen's `stepAwayAfter` (`:1505`) all still go through `stepAwayOn`, which is `postDefendBeat(...) !== null`. `readState` writes `stepAwayPicked` under the same condition and no `Via` key.
  - `_beatPanel` is always null for a legacy shell (`_pendingBeat` skips the defend beat), so the render order change in `9ebc391b2` cannot reach it. `_markResumed` and `_settleStepAwayWatch` are no-ops.
  The step-away suite runs unmodified and passes.
- **Panel order for a beat after `mistake`.** The panel shows on the stage advance in the open runner (`_complete` sets `_beatPanel` before rendering) and on the reopen after a child completes the stage (`onOpen` recomputes it after `_settleCall`/`_settleWorld`). In production the sort runs in `consequence-sandbox` and completes through `_completeWhileAway`, so the reopen path is the one ca15 uses; test `:343` covers it. The flip sits behind the panel; `stepAwayPicked` is untouched and the post-defend panel still shows later (test `:320`).
- **Carry on writes `doneGlobal` once.** Guarded on the global not already true, written with `openChat: false`, then one sync. The pick and its `Via` go in one state write. From the waiting panel the `Via` goes `lookup` to `carry`; the global write is still single (test `:398`).
- **Synced state stays bounded.** Per beat: one boolean and, for a `resumeOnDone` beat, one string from a closed set (`BEAT_VIA`), each written only when it changes. At most two state writes per beat (`lookup` then `resumed` or `carry`), plus one done-global scalar. `readState` drops a `Via` on a beat that is not `resumeOnDone`. No server allow list exists, so the spec's check needed no server change.
- **The watcher.** Built like `watchCall`, a re-armed timeout and no interval. The grace restarts whenever any minigame is open (a chat at the moment the global lands, or one that opens inside the grace), so a closing chat is never cut. `end()` runs before the move and reopen, so there is one hand-back. Any other episode-runner open ends it on the next tick, and `onOpen` stops it at once through `_settleStepAwayWatch`. The spot (`spotHeld` plus world-play's `stepAwaySpot`) is cleared on every exit.
- **Load-time start.** `game_loaded` is emitted at the end of `create()` (`core/game.js:2656`), after the saved globals are merged (`:1777`), so the episode state is present. `resumeBeatFromState` reads the raw saved state and starts only on `Via === "lookup"`; the table test covers lookup, resumed, carry, nothing and a legacy shell. It has no shared state with E2's `settleHeldWorld` on the same event, and each handler catches its own error. The Mission Brief popup on reload is a notes minigame (`helpers.js:40-47`), so the watcher waits it out.
- **`returnPlayerTo` is shared, and the ca12 hand-back is unchanged.** `leaveWorld` resolves the player as before and calls `returnPlayerTo(back, deps)`, which does the old `placeAt`. The only difference is that a non-finite origin is now skipped instead of placed at NaN. The step-away spot is a separate variable, so `worldActive()` never reads it (test `:613`).
- **The facilitated fix in `9ebc391b2`.** `_steppedAways` belongs to the runner instance and is keyed by beat id, so it cannot leak across beats or survive a reload or a reopen. Its side effect on reopen is m2.
- **Tests mostly drive the real path.** The real framework, runner, starter, `global-writer` and `readState` run, with fake timers and a fake clock; the reload test uses the real `watchStepAway` and the runner's real default deps. The gaps are listed in m7.

## Major

**M1. Opening the kiosk while the beat is still live cancels the automatic return for good. The waiting panel then invites the learner back out with nothing left to bring them back.**
`episode-runner-minigame.js:690-703` (`_settleStepAwayWatch` stops the watcher and clears the spot on every open), `:447` (`cleanup` restarts nothing), `:547-562` (the waiting panel), test `social-episode-beats.test.mjs:398` (asserts `pendingTimers() === 0` after the waiting-panel open).
Failure: in ca15 the learner picks Look up, takes the stick and drops it, then walks back to the kiosk to check (the panel told them "your place is saved"). The open shows "Still out there. Carry on whenever you like." and stops the watcher. They close the kiosk with the X and go back to watch Joanne. Joanne finds the stick, `ca15_drop_done` lands, and nothing happens: no return to the kiosk and no flip. The learner has to work out on their own that the kiosk now holds the flip, so the plan's "however the beat ends ... the learner is back at the kiosk" (2.6, line 270) fails for anyone who peeks. The state also contradicts itself: `Via` is still `"lookup"` (`_markResumed` skips a waiting beat), so a reload brings the watcher back while simply closing the kiosk does not. The spec's reason for stopping on another open ("that open resumes at the next stage anyway", line 348) is true only when the global is already true. On the waiting panel it is false.
Fix: when a runner that showed the waiting panel for a `resumeOnDone` beat closes (`cleanup`, with `this._beatPanel?.mode === 'waiting'` and the stored `Via` still `"lookup"`, not facilitated), call `_startResumeWatch(beat)` again. That records the spot at the kiosk where the learner now stands and re-arms the watcher with `opener: this`. Keep the stop in `onOpen`, so the watcher never fires while the panel is up. Change test `:398` to close the waiting runner, set `drop_done`, run the grace and assert one return and a reopen at the flip, and add a step to 5b: peek at the kiosk mid-beat, close it, let the beat end, and confirm the return.

## Minor

**m1. The waiting panel does not refresh when the done global lands while it is open.**
`episode-runner-minigame.js:564-580`. If `doneGlobal` turns true while the learner is on the waiting panel (the 90 s timeout fires while they read it), the panel keeps saying "Still out there" with only Carry on. Clicking it is harmless (it writes `carry`, and the global write is skipped), but the copy is wrong and the learner does not know the beat has ended.
Fix: in `_renderBeat` for `mode === 'waiting'`, listen on `global_variable_changed:<doneGlobal>` (the `_watchReady` pattern, cleared in `_destroyView`). On true, set `_beatPanel = null`, call `_markResumed()` and re-render, so the next stage shows.

**m2. In a facilitated run, a beat with `facilitated: true` comes back on every reopen and Look up can fire twice.**
`episode-runner-minigame.js:547-562`, `:582-585`, `:646-650`. A facilitated run stores no pick, and `_steppedAways` is per instance. A facilitator who closes the runner at the flip and reopens it sees the "choose" panel again. A second Look up emits the beat's event a second time (the scenario chain re-runs, for example a second give), against the spec's "Look up emits once per beat". The ca15 `red_stick` beat is `facilitated: false`, so ca15 is not affected.
Fix: in facilitated mode, show the panel only on the in-runner stage advance (`_complete`) and never from `onOpen`. Or keep a module-level `Set` of beat ids picked this page load, as `REEMITTED` does. Add a test: facilitated, Look up, reopen, no second emit.

**m3. The facilitated defend pause offers Look up even when the post-defend beat says `facilitated: false`.**
`episode-runner-minigame.js:520` and `:1505` gate on `stepAwayOn` only, never on `beat.facilitated`. Legacy shells are fine (`LEGACY_BEAT.facilitated` is true). A `stepAways` shell whose defend beat is `facilitated: false` still gets the pause Look up, against the spec's "facilitated runs skip a beat whose `facilitated` is false".
Fix: `const b = this._defendBeat(); if (after === 'defend' && b && b.facilitated && ...)`, with the same test at `:1505`, and one test.

**m4. After a reload, the automatic return makes no move, so the flip can open wherever the learner has walked to.**
`systems/episode-starter.js:94` (`returnToSpot: null`). The spec accepts this because a reload spawns the learner in the start room (line 349). But a learner who reloads mid-beat and walks back out to watch Joanne gets the flip, the defend triage and the post-defend Look up wherever they are standing, not at the kiosk. The plan wants that set piece played in view of the kiosk (2.6).
Fix (cheap): in `startStepAwayWatchFromState`, record `w.player`'s position at `game_loaded` (the start-room spawn) with `setStepAwaySpot` and pass `returnToSpot: () => returnToStepAwaySpot()`. The kiosk-open path already clears it. If the owner prefers the spec as written, record that decision in the plan.

**m5. The "result has saved" note shows on a mid beat that has a `readyGlobal`.**
`episode-runner-minigame.js:611`. `_lookUpButton` always appends `STEP_AWAY_COPY.wait` ("Look up is ready once your result has saved."), which describes the defend save. A beat after `mistake` with a `readyGlobal` shows that line while it waits, which is wrong there. `red_stick` has `readyGlobal: null`, so it is not reached today.
Fix: read `strings[<prefix>ReadyWait]` or a neutral `BEAT_COPY.wait` ("Look up is ready in a moment.") for a beat other than post-defend, and add it to the validator todo's strings list.

**m6. The validator todo leaves out three existing rules that read only `stepAway`.**
`scripts/validate_social/awareness.rb:192` (`KIT_KEYS`: a `stepAways` key in a check or annual shell is not caught), `:862-871` (the boolean, full-only and not-in-check rule), `:877-880` (`step_away_look_up_checks` returns early unless `stepAway == true`, so a list-form shell whose defend beat waits on `kit_defend_done` with no setting mapping is not warned). This is not a request to do the deferred validator work now. The todo file should name these three, so whoever picks it up extends them rather than only adding new rules.
Fix: add the three to `tmp/handover/ca0/E3_validator_todo.md`.

**m7. Test gaps.**
`test/js/social-episode-beats.test.mjs`:
- The runner's default `rememberSpot`, `clearSpot` and `returnToSpot` (the dynamic imports into world-play, runner `:270-272`) are stubbed in every runner test, and world-play is tested on its own. Nothing checks that the defaults call `setStepAwaySpot`, `clearStepAwaySpot` and `returnToStepAwaySpot`, so a mis-wired default would pass. Add one test with those three deps left out, a fake `window.player`, Look up, a move away, then the grace: assert the player is back at the Look-up spot (this also covers spec check (f), "in the kiosk room after the return").
- Nothing checks that `main.js` registers `startStepAwayWatchFromState` on `game_loaded`. The updated world test (`social-episode-world.test.mjs:597`) only allows it in the import. Add a regex like the `settleHeldWorld` one.
- The in-runner advance tests call `cur()._complete('mistake')` and `_completeWhileAway` directly, not through a `consequence-sandbox` onComplete. That is acceptable, but one test through a stubbed sandbox scene registered on the framework would cover the production order (child closes, framework reopens with `returnParams`).
- M1's close-and-return case, m1's refresh and m2's double emit, as listed above.

## Not checked here

- Live browser behaviour (5b, deferred): the real teleport across rooms, the 4 s grace against a real bark, and the E4 take-back firing from Carry on's global write while the runner is open.
- Whether ca15's scenario timers (90 s and 30 s, `startOnGlobal`) survive a reload. If they do not, a reloaded learner whose `Via` is `lookup` waits on a global nothing will set, until they Carry on from the waiting panel. That is not stranding, but the ca15 shell work should check it.
