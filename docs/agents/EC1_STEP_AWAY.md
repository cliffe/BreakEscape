# EC1 step-away panel: handover (2026-11-19)

Branch `feat/ca-ec1-step-away` in `.claude/worktrees/b-ca-ec1` (from main 4b5f65edd). Plan:
`.claude/worktrees/p-ca-living-office/planning_notes/security_awareness_course/living_office/LIVING_OFFICE_PLAN.md`
sections 6.2, 9 (EC1), 4.7, 11 proofs 2 and 8, 12. The first agent stopped at its context limit.

## Done (commit e64e47c05)

All five parts (a) to (e) are built. Plan line pointers in the runner, model and success screen all matched main
(`episode-runner-minigame.js` :376-378, :417, :446-457, :713-715, :1067-1085; `episode-model.js:469`;
`success-screen.js:46-49`). None was wrong.

- `public/break_escape/js/minigames/episode-runner/episode-model.js`: `STEP_AWAY_READY_GLOBAL` ('kit_defend_done'),
  `STEP_AWAY_EVENT` ('episode_step_away'), `stepAwayOn(episode)` (stepAway true, full variant, not check, debrief after
  defend; so never a twin/brief/check), `stepAwayHeld(episode, raw)` (defend done, debrief not done, no `debriefSeen`).
  `readState` keeps `debriefSeen: true` only in stepAway episodes. `completeStage` keeps `defendProgress` when
  `stageId === 'defend' && stepAwayOn` (check shells and twins keep today's deletion).
- `.../episode-runner-minigame.js`: `_triageDone` passes `defendProgress: result.answers` (stepAway only) and reopens
  with `stepAwayAfter: 'defend'` when not facilitated. `init` sets `this.stepAwayPanel` (memory only, stripped by
  `_reopenParams`). Dispatch branch after the pause branch -> `_renderStepAway` (heading 'Before the debrief', text
  from 6.2, overridable by `strings.stepAway` / `strings.stepAwayHeading`). `_lookUpButton` (disabled unless
  `globals.kit_defend_done === true`, re-checked on `global_variable_changed:kit_defend_done` via eventDispatcher.on/off,
  wait note 'Look up is ready once your result has saved.'). `_lookUp` closes the runner then emits
  `episode_step_away` `{ episodeId }` once; writes no state. Carry on renders the debrief, no state write.
  `_renderPause` adds Look up when `pauseAfter === 'defend'` in an opted-in shell (e). `_renderDebrief` passes the
  stored list as `answers` when there is no live triageResult. `cleanup` after a debrief view -> `_markDebriefSeen`
  (one save of `debriefSeen: true`, stepAway only), which releases the hold for the close-without-Finish route; Finish
  releases by `done` including debrief. `getTestState().episode` gained `stepAwayPanel`, `stepAwayReady`, `debriefSeen`.
- `public/break_escape/js/ui/success-screen.js`: generic hold registry on `window.successScreenHolds` (Map),
  `setSuccessScreenHold(id, fn)`, `successScreenHeld()`; `busy()` reads it. No new static import anywhere.
- `public/break_escape/js/systems/episode-starter.js`: `installStepAwayHold()` runs at module load (boot) and
  registers `episode-step-away` -> `stepAwayHoldNow()`, read live from saved state (survives reload).
- `public/break_escape/css/episode-runner.css`: disabled `.epr-button` look (flat grey, 2px, no radius), side-by-side
  buttons, `.epr-step-away-note`.
- `scripts/scenario-schema.json`: `awarenessEpisode.stepAway` (boolean), `strings.stepAway`, `strings.stepAwayHeading`.
- `scripts/validate_social/awareness.rb`: `step_away_checks` (boolean; error in a check mission or non-full variant).
- `test/js/validator-social-awareness.test.mjs`: new case; file passes 72/72.

## Open (next agent)

1. **Unit tests** (none written yet for the runner): new file `test/js/social-episode-step-away.test.mjs`, copying the
   harness of `test/js/social-episode-runner.test.mjs` (copy list lines 20-35, stubs, `deps`, `setup`, `open`) plus
   `ui/success-screen.js` and `utils/desktop-app.js` in the copy list. Give `window.eventDispatcher` an `on/off`.
   Cases from plan 12: panel shown when opted in and not facilitated (stage the state at defend, launch, complete
   triage with `answers`); no panel in a twin (variant defendOnly), a facilitated run, a check shell, or with stepAway
   absent; both buttons leave `stored()` deep-equal; event emitted once (double click); Look up disabled when
   `kit_defend_done` false and `episode_<id>_defend_complete` true, enabled after setting the global and emitting
   `global_variable_changed:kit_defend_done`; stored `defendProgress` after triage in stepAway, absent in a check
   shell and in a plain full shell (today's shape); reopen after Look up shows debrief with `answers` from storage;
   `stepAwayHoldNow()` true at defend-done, still true after Look up, false after Finish and after closing the kiosk
   at the debrief, and `successScreenHeld()` follows; facilitated pause after defend has `.epr-look-up`, pauses after
   other stages do not; held chain bark dropped when `kit_quiet` false: one `releaseHeldBarks` case with
   `stillValid: () => globals.kit_quiet === true` (copy `systems/bark-release-policy.js`).
2. Run `bin/test-js` (whole suite, includes social-*, validator-social-*, lab-physical-pentest-*, lab-ux-ui,
   lab-gated-credit-scan); find lab_social_engineering tests by grep. Payload-scan Ruby tests (proof 8):
   `test/models/break_escape/payload_scan_*_test.rb` on the test scenario.
3. **Test scenario** `scenarios/test_ca_step_away` (grep `/home/cliffe/Files/Projects/Code/Hacktivity/test` first):
   copy the awareness test shell (find via `grep -l awarenessEpisode scenarios/test_*`), set `stepAway: true`,
   declare `kit_defend_done: false`, add a host mapping `global_variable_changed:episode_<id>_defend_complete` ->
   set `kit_defend_done` (confirmed-save path, see `triage-starter.js:249-278`), and one on `episode_step_away`.
4. Live proof 2 on a keyless server on :3003 from this worktree (recipe in memory `worktree-live-proof-3002.md`;
   never db: tasks, never :3000/:3002), `window.__test.throttleFps(20)`; screenshots to
   `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ec1/`.
   The runner has no dark theme (light awareness skin only), so one theme.
5. Not done, out of EC1 code: the facilitator-guide line (memory: facilitator guide last); kiosk "finished" text
   variant is per-shell content.

## Second agent (2026-11-19, stopped at the context guard before live proof)

Review against plan 9: no code changed; every builder pointer and the five parts hold. Verdicts:

- (a) holds. `_markDebriefSeen` writes `debriefSeen: true` once (guarded by `debriefSeen`/`done.includes('debrief')`),
  only when the debrief view was showing at `cleanup`, only in stepAway episodes. Globals sync as keyed deltas
  (`state-sync.js:40-43`): the changed key `episode_<id>_state` goes once, then is confirmed and not re-sent. One extra
  save at most, never on Finish (Finish puts `debrief` in `done`), never on a second close. Nothing grows.
  A close without Finish releases the success screen but leaves `done` without `debrief`. Settled below
  ("kit_quiet after a close without Finish").
- (b) holds: `STEP_AWAY_READY_GLOBAL = 'kit_defend_done'`, fixed, as plan 6.1/6.2 name it.
- (c) holds: `_lookUp` calls `close()` then emits; the unit test records the emit with no minigame open, once on a double click.
- (d) holds: `stepAwayOn` requires stepAway === true, not check, `variantOf === 'full'` (twins are defendOnly), debrief
  after defend. Validator agrees (variant is required there, so no absent-variant mismatch).
- Failed save (`triage-starter.js:235-283`): result globals are written with `deferEmit`; on `!confirmed` it returns
  with no emit, so the `<prefix>complete` change event never fires, the mapping never sets `kit_defend_done`, and
  Look up stays disabled (unit case "Look up is disabled while kit_defend_done is false, even with <prefix>complete true").

Done:
- `test/js/social-episode-step-away.test.mjs`, 25 cases, 25 pass (every plan 12 EC1 case and the handover list, plus copy
  overrides, listener cleanup, Esc close, check-shell state equal with and without stepAway, success screen opening after
  release, the kit_quiet bark drop). Copy list adds `ui/success-screen.js`, `utils/desktop-app.js`,
  `systems/bark-release-policy.js`. No new static import in engine code, so no harness copy lists changed.
- `scenarios/test_ca_step_away/` (name not used in Hacktivity tests): copy of test_social_episode with `stepAway: true`,
  kit_defend_done/kit_quiet/kit_e1_out declared, the 6.1 mappings (kit_quiet up and down, kit_defend_done on the
  confirmed complete), a step-away mapping (condition kit_defend_done, sets kit_e1_out, host bark), and the kiosk's
  finished variant on `kit_defend_done && kit_quiet === false`. Validator `--strict-social --no-graph`: 0 errors, 6 warnings
  (stub-fixture warnings inherited from test_social_episode, plus kit_e1_out unread).
- Proof 8: `PAYLOAD_SCAN_ONLY=test_ca_step_away` payload_scan fresh + opened: 23 runs, 0 failures, 2 skips, no findings.
- `bin/test-js` full suite: see the commit message of the commit that adds this section (result added there).

Still open (next agent):
1. Live proof 2 on :3003 from this worktree (`tools/playtest/start-keyless-server.sh 3003`), fresh game per case via
   `tools/playtest/new-game.rb test_ca_step_away`, headless, `window.__test.throttleFps(20)`. Cases without kit staff:
   panel then Look up (event, kit_e1_out true, runner closed, success screen held); reopen -> debrief with cards; carry on;
   reload at the panel -> debrief, no panel, screen still held; close debrief without Finish -> screen opens; Finish ->
   screen opens; facilitated (needs a second fixture or a branch-only copy with `facilitated: true`; never edit a game
   record); failed save (block POST of the sync, check Look up disabled with `<prefix>complete` true locally); check shell
   (ca_pre_* run to its end, saved state has no defendProgress). Screenshots (Look up enabled and disabled, facilitated
   pause) to the scratchpad `ec1/` folder named in the brief. Stop the server after.
2. Pixel-art UI check of the panel against the screenshots. From the CSS alone: 2px borders, no radius, the disabled
   look is flat grey with the same frame; the runner has no X-less Cancel (Carry on is an action, the bar X closes).
   Font of `.epr-step-away-note` inherits the runner skin (light awareness skin; check it is a pixel font).

## Facilitator guide line (for the guide, written later)

In a shell with the step-away panel, the pause after the defend stage has a Look up button. It turns on once the
result has saved. Press it to close the kiosk so the group can watch the office for a minute; reopen the kiosk for the
debrief. Press Next step instead to go straight to the debrief.

## kit_quiet after a close without Finish (2026-11-19, decided)

The gap: closing the kiosk at the debrief without Finish saved `debriefSeen: true` and released the success screen,
but `done` never gained `debrief`, so the 6.1 "debrief done" mapping never fired and `kit_quiet` stayed true for the
session.

Chosen: kit content, not engine. A second `onceOnly` mapping on the same state event lowers `kit_quiet` when the
saved state carries the marker:

    { "eventPattern": "global_variable_changed:episode_<id>_state",
      "condition": "data.value.debriefSeen === true", "onceOnly": true,
      "setGlobal": { "kit_quiet": false } }

The condition grammar has `&&` but no `||` (`npc-manager.js` `safeEvaluateCondition`), so it is a second mapping, not
an extra term. No engine code changed and no new write: the mapping reads the one `debriefSeen` save that already
happens.

Why not complete the debrief stage on a close: `completeStage` ending the last stage also runs `_writeDone`, which
writes `awarenessEpisode.doneGlobal` (ca00 concludes its objective on it; any shell may author one). A close would then
conclude where an unchanged shell's close does not, against the plan's rule that the server conclusion and score
equal an unchanged shell's. It would also turn a reopen into the "Finished" panel, so a learner who closed by mistake could
no longer read the debrief or press Finish.

Rule for the wave 1A kit builder: every kit shell carries this mapping next to the "debrief done" one. It is inert
where it cannot fire (`readState` drops `debriefSeen` outside stepAway shells, and only stepAway shells write it), so
twins and plain shells can take it unchanged. A shell's "finished" kiosk text keyed on `kit_quiet === false` now
also shows after a close without Finish; reword per shell if that matters (the fixture's stub text is left).

Done: `scenarios/test_ca_step_away` has the mapping (validator `--strict-social --no-graph`: 0 errors, 6 warnings,
as before). `test/js/social-episode-step-away.test.mjs` runs the fixture's own state mappings on the real
`NPCManager` evaluator: close without Finish lowers `kit_quiet`, `done` keeps no `debrief`, the done global stays
unwritten, one save; Finish is unchanged (done gains debrief, done global written, no marker, nothing written on the
later close); `done`/`stage`/done global after a close match a plain full shell's; a check shell closes with the same
state with or without stepAway.

## Gate B fixes (2026-11-19, commit a2277811c; tests in social-episode-step-away.test.mjs)

Findings D1 to D3 are in `EC1_GATE_B_VERIFY.md`; live proof steps are under "Fix proof steps" there.

- **Hold rule (D3).** `stepAwayHeld(episode, raw, globals)` is false once the debrief is done or `debriefSeen`. It is
  true when the defend stage is in `done`, and also when the stage still reads `defend` and
  `<defendPrefix>complete` (`episode_<id>_defend_complete`) is true. That second case is a reload on the triage
  result before Continue: the round saved and the mission concluded, but the stage was never completed. The
  starter's `stepAwayHoldNow` passes the globals, so the success screen stays held from boot.
- **Reopen at the result.** No runner change. After that reload the kiosk opens on the defend launch. The triage
  restores all stored answers and shows the result again. Continue runs `_triageDone` (so `measure` runs once, as
  it never ran before the reload) and then the panel shows. The debrief is not skipped to: that would write the
  stage with no triage result recorded.
- **Debrief rescoring on reopen (D1).** The stored `defendProgress` keeps verdicts, flags, ms and action only (no
  score, no `isPhish`), and the debrief's fallback counted "report" on a genuine item as wrong. With no live
  `triageResult`, `_renderDebrief` now calls `_rescoreDefend(kept)`: `scoreTriage` over `buildTriageMessages` of
  the defend set, the same as the live round, with answers mapped as `_buildResult` does. Stored `defend` figures
  win over the rescored ones. Cards and summary now match Carry on. The state gains no field and no write.
- **Defend complete re-emit (D2).** If the confirmed-save retries all failed but the pagehide keepalive flush
  landed, `<defendPrefix>complete` is true and `kit_defend_done` is false for good. On open, a stepAway runner with
  that state calls `reemitTriageComplete` (triage-starter.js, on `window`): it waits for a confirmed sync, checks
  again that the event is still needed, and emits only `global_variable_changed:<prefix>complete`. The shell's
  mapping then sets `kit_defend_done`. It does nothing when `kit_defend_done` is already true, when complete is
  false, or while a save of the prefix is queued, and a module-level set allows one emit per page per episode.
- **Non-stepAway episodes are unchanged.** `stepAwayHeld`, the re-emit and the rescoring are all gated on
  `stepAwayOn`. A plain shell clears `defendProgress` at `completeStage`, so a reopen at its debrief still shows the
  stored figures with an empty answer list. Tests cover a plain shell, a twin and a check shell for each fix.

## Decisions to check

- Close-without-Finish release is persisted as `debriefSeen: true` in the existing state global (one save, once).
  The plan says the hold is derived from saved state and released by any close of the debrief; it names no marker.
- `kit_defend_done` is a hard-coded engine constant, as the plan names it.
- Look up closes the runner before emitting the event, so the host mapping fires with no minigame open.
