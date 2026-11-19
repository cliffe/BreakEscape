# EC1 gate B fixes: handover (2026-11-19)

Worktree `.claude/worktrees/b-ca-ec1`, branch `fix/ec1-reopen-hold`. The first fix agent stopped at the context guard
after the engine commit. Brief: the D1/D2/D3 task (findings in `EC1_GATE_B_VERIFY.md`, design in `EC1_STEP_AWAY.md`).

## Done (commit a2277811c, engine only, NOT yet tested)

- **D3** `episode-model.js` `stepAwayHeld(episode, raw, globals)`: false once debrief done or `debriefSeen`; true when
  defend is in `done`; also true when `state.stage === 'defend'` and `globals['<defendPrefix>complete'] === true`
  (reload on the triage result before Continue). `episode-starter.js stepAwayHoldNow` passes the globals.
  Reopen landing chosen: no runner change. After that reload the kiosk opens on the defend launch; the triage restores
  all stored answers (`inbox-triage-minigame.js _restoreProgress` -> `_finishSort`) and shows the result again;
  Continue runs `_triageDone` (so `measure`, never run before the reload, runs once) and then shows the panel. Why: the
  panel is memory-only and the design's "reload at the panel lands on the debrief" rule covers a reload *after*
  `_triageDone` saved stage debrief; here the stage was never completed, and skipping to the debrief would skip
  `recordTriageResult` and write the stage without a triage result.
- **D1** `episode-runner-minigame.js _renderDebrief` + new `_rescoreDefend(kept)`: with no live `triageResult` and a
  stored `defendProgress`, scores it with `scoreTriage` over `buildTriageMessages(defendSet, {mailState, social,
  globals})` (same as the live round), answers mapped as `_buildResult` does (score, isPhish, action, none); stored
  `defend` figures spread over the rescored fields. Non-stepAway shells: `defendProgress` is deleted at
  `completeStage`, so no answers to rescore; they keep `{...stored, answers: []}` (unchanged; cannot be fixed without
  growing state). New static imports `buildTriageMessages` (triage-messages.js) and `scoreTriage` (triage-scoring.js):
  both files are already in every harness copy list that copies the runner (checked; minigame-se-close only reads source).
- **D2** `triage-starter.js reemitTriageComplete({prefix, stillNeeded})` (also set on `window` at module load): skips
  when complete is not true or a save of the prefix is queued; shares the `reemits` slot; awaits `confirm`; re-checks
  queue/complete/`stillNeeded()`; emits only `global_variable_changed:<prefix>complete`. Runner `_reemitDefendDone()`
  in `init` after `_readState`: stepAway only, complete true and `kit_defend_done !== true`, `deps.reemitDone` (default
  `window.reemitTriageComplete`); module `REEMITTED` set guards one emit per page per episode
  (`_resetDefendReemitsForTests` exported). Normal case: kit_defend_done already true, nothing sent.

## Open (next agent)

1. Append tests to `test/js/social-episode-step-away.test.mjs` (boolean asserts only). Note: the existing test
   "a reopen after Look up lands on the debrief ... answers from storage" (around line 380) asserts
   `shown.answers` deep-equals `CLEANED`; the fixture set has no `truth` and verdict `keep`, so check whether
   `scoreTriage` throws (falls back to CLEANED) or rescoring changes it, and update the expectation.
   Planned cases: D3 hold true at stage defend with complete true, false without it / after debriefSeen / debrief
   done, never in a twin or plain shell, `SS.successScreenHeld()` follows; D3 reopen opens the defend launch, then
   triage complete -> panel. D1: custom set with truth (phish + genuine), answers trust-on-phish and
   report-on-genuine; render the real `renderDebrief` (import from the copied debrief-view.js) for the live result
   (scoreTriage + `_buildResult` mapping) and for the reopen, compare `.aw-card` count and `.aw-summary` text; show the
   stored-only path differs (test is not vacuous). Plain shell regression: `{...stored, answers: []}` unchanged.
   D2: add `systems/triage-starter.js` to this test's copy list, load it, set `window.stateSync = {syncConfirmed}`,
   register a listener on the complete event that sets kit_defend_done; cases: emits once and kit true; kit already
   true -> no emit; unconfirmed -> no emit, later confirmed reopen emits; no mapping -> one emit over two opens;
   stillNeeded false after sync -> no emit; plain shell -> no emit. Flush with a few `setTimeout(0)` awaits; reset
   `_resetDefendReemitsForTests` and `_resetTriageStarterForTests`; delete `window.stateSync` after.
   Also add a unit case in `test/js/social-triage-starter.test.mjs` if cheap.
2. Commit tests, then run `node --test test/js/social-episode-step-away.test.mjs test/js/social-*.test.mjs` and
   `bin/test-js` (m01-decode-task may fail on Bundler gems: environment).
3. `EC1_STEP_AWAY.md`: add a section for the new hold rule, the reopen landing decision (above) and D1 rescoring, D2.
4. `EC1_GATE_B_VERIFY.md`: add "Fix proof steps": D3 reload at the result screen (overlay held, kiosk opens on defend,
   result restored, Continue -> panel, Look up enabled); D1 two wrong answers (bank trust, laptop report), Look up +
   reopen vs Carry on, compare `article.aw-card` count and summary text (must match); D2 persistent in-page block of
   `PUT /sync_state` containing `episode_e1_stub_defend_complete:true` (init.js flag, as section 2), then let the
   pagehide keepalive through by route-only interception (game 10328 method), reload, open the kiosk: one
   `global_variable_changed:episode_e1_stub_defend_complete`, kit_defend_done true, counter of the complete event 1;
   reopen again: no second emit.
