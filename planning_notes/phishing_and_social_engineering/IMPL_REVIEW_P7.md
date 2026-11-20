# Phase 7 awareness build: implementation review

Reviewer pass over the Phase 7 ("SE P7-*") and "SE wave 4" engine work committed 2026-10-22.
Scope: the episode runner, authenticator, measurement store, mail-client episode options, the
triage kinds/comparison/scoring/result changes, the success screen, objectives-manager live
unlocks, kiosk wiring, and the `awareness.rb`/`triage.rb` validator areas. Read-only review; no
engine or scenario files were changed.

Verdict: no blockers found. The build is careful and the gating is sound. Findings below are
minor or observations, plus the positive checks that back the "unaffected" and "no state loss"
claims.

## Tests run

All green, on the real modules in jsdom (children stubbed, views/store/framework real):

- `social-episode-runner` 29/0, `social-episode-model` 13/0, `social-episode-views` 12/0
- `social-awareness-measure` 13/0, `social-authenticator` 9/0
- `social-mail-episode-options` 9/0, `social-triage-starter` 18/0, `social-triage-scoring` 19/0
- `social-role-swap` 9/0, `success-screen` 12/0, `social-game-gating` 2/0, `social-p7-followups` 3/0

The runner test loads the real `EpisodeRunnerMinigame`, model, P7-B views, P7-C store and the
minigame framework (including return-to); only the OSINT/mail/triage children are stubs. The
gating test (`social-game-gating.test.mjs:19-33`) evaluates the exact `liveGlobalUnlock` source
expression lifted from `core/game.js`, so a widened gate is caught. Coverage of the real path is
good at the unit level; the cross-overlay IPC (runner -> mail/osint/triage and back) is proven by
the hand playtests cited in the commits (E1/E2/E4 12/12, E6 14/14), not by these tests.

## Gating: m01-m10 and the lab unaffected

Every engine touch-point is gated on scenario shape, sprite type, a param, or an additive
registration. Verified:

- `core/game.js:1677` passes `liveGlobalUnlock: !!gameScenario.social`, so the live aim unlock
  (`objectives-manager.js:725-755`) only watches globals for a scenario with a `social` block;
  m01-m10 keep the load-time-only check.
- `objectives-manager.js:1106-1131` only runs the success screen for
  `conclusionScreen.type === 'success'`; story missions stay on `bond_visualiser`/`end_screen`.
  The `screen` is read behind `if (!screen) return`, so a mission with no `conclusionScreen` is
  untouched.
- `interactions.js:1098` routes to the episode runner only for `sprite.scenarioData.type ===
  'kiosk'`; no Licence mission uses a kiosk object.
- `minigames/index.js` and `systems/minigame-starters.js` changes are additive scene
  registrations (`episode-runner`, `authenticator`) and new `window.start*` exports; no existing
  scene or starter is altered.
- Mail client episode options are param-gated: with no `maxSends`/`layout`/`sentIds`,
  `_episodeMode()` is false and `closeResult()` returns the old shape
  (`mail-client-minigame.js`, P7-G diff). The lab's mail client passes none of them.
- The triage "verify counts as caught" and awareness result copy are awareness-only. The lab's
  set is `scoringProfile: "analyst"` (`scenarios/lab_social_engineering/scenario.json.erb:869`),
  so `profile` resolves to `analyst` (`inbox-triage-minigame.js:124-125`) and `awarenessSkin` is
  false (no `skin:'awareness'` on the lab launch). Both the verify-as-caught counter and
  `_resultCopy()` (`inbox-triage-minigame.js:714-726`) take the non-awareness branch for the lab.
- `validate_social/awareness.rb:37` and the Phase-7 additions to `triage.rb` bail with `[]` unless
  `ctx.social` is a Hash, so Licence missions are not newly linted.

Note: `scoreTriage` already scored `verify: 60` for a phish verdict (`triage-scoring.js:41-42`), so
the 870af473 change only moves the summary `phishCaught` counter and the result-screen pointer
copy; it does not change any set's `percent`, `pass` or band. That is why the lab's grading is
unchanged even if a lab set were awareness-profiled.

## Persistence and reload safety

- Episode progress lives in the object global `episode_<id>_state` (ids and numbers only); the
  measurement store writes the array global `se_awareness_records`. Both are serialised through
  the normal `globalVariables` payload (`state-sync.js:150` spreads and JSON-stringifies the whole
  map), so array and object values persist exactly like the existing object global
  `se_landing_pages`. The validator enforces `se_awareness_records` is declared as `[]`/`{}`
  (`awareness.rb:631-644`).
- `se_awareness_records` is not an ink-declared variable, so `writeGlobal` skips the ink
  `setDeclaredVariable` path that cannot hold an array; it only lands in `gameState` and emits a
  change. Confirmed no ink receives the array.
- The sync-then-emit design (`triage-starter.js`) protects against a lost-save on a dropped
  connection: result globals are written to `gameState` first (so a later sync or pagehide flush
  carries them), the done events are only emitted after `syncConfirmed()`, and a reopen re-emits
  them (`reemitTriageDone`) when `done` reached the server but the conclusion task never completed.
  The measurement block is written locally in `_triageDone` regardless of sync, so a round is
  recorded even offline and dedup by `"<stage>:<setId>"` keeps the first answer
  (`awareness-measure.js:103-118`).
- The call watcher is module-level and dies on reload, but `_settleCall()`
  (`episode-runner-minigame.js:533-541`) re-derives the write stage from the outcome global on the
  next kiosk open, so a reload mid-call resumes correctly. Documented and covered.

## Findings

### Minor

1. `episode-runner-minigame.js:441-443` (`_renderDebrief`). On a reload while the debrief is on
   screen, `params.triageResult` is gone, so `raw = { ...stored, answers: [] }` and the debrief
   renders the summary line plus the Monday/no-blame cards but **zero per-message review cards**
   (only the numeric summary survives in `state.defend`). This is the deliberate "no free text
   persisted" trade-off, and the mission has already concluded by this point (the done global
   fires before the debrief), so impact is low. Worth a one-line note in the design doc that the
   per-card review is not reload-durable.

2. `episode-runner-minigame.js:116-129` (`defendSetKind`). The "most common group" vote only
   considers `calls/pages/phone/voice`; a set whose largest group is `messages`, and any tie,
   falls through to `'messages'`. A set that is, say, 3 pages + 3 phone with no email resolves to
   `'messages'`, so the panel heading/button read "Defend / Open the inbox" rather than matching
   the channel. Authors control the counts and `defend.calls` overrides to `'calls'`, so this is
   cosmetic. Consider breaking ties toward the non-email kind, or documenting the tie rule in the
   author-facing notes.

3. `flip-view.js:60-63` (`tellSentence`). A page/channel tell id with neither a library sentence
   (`redFlagString` returns the id unchanged) nor a `PAGE_TELLS` entry renders the raw id (e.g.
   `formOrigin` with a typo) as learner-facing text. Sets are small and authored, and the
   validator checks tell ids, so this is a safety-net observation rather than a live bug.

### Observations (no change needed)

- Text-only rendering is clean: no `innerHTML`/`insertAdjacentHTML`/`outerHTML` anywhere in the
  episode-runner, authenticator, inbox-triage, measurement-store or success-screen files. Every
  authored string goes through `el(tag, class, text)` (`textContent`) or an explicit
  `textContent =`. The debrief and flip views state this contract in their headers and keep to it.
- `success-screen.js` registers `window.showSuccessScreen` at import unconditionally, but nothing
  calls it except the gated `type === 'success'` branch, so this is inert for story missions. The
  `busy()`/`IDLE_MS` wait means it will not cover an open debrief or result screen; the runner
  reopens to the debrief synchronously in `_triageDone` before `persistTriageResult` resolves, so
  there is no race where the success screen opens first.
- `hideScore` (`episode-runner-minigame.js:152-163`) strips `percent/headline/pass` and each
  answer's `score` for the facilitated shared screen; `renderDebrief` guards every numeric read
  with `Number.isFinite`, so the hidden fields degrade cleanly to no summary/score lines.
- The authenticator (`authenticator-minigame.js`) is unscored and self-contained; `buildTimeline`
  orders pushes and the approval deterministically with a stable secondary key. The `mfa` stage's
  `onComplete` only advances on a normal exit (`isNormal`), matching Close/Esc semantics.
