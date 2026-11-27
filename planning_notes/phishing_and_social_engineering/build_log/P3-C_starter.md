# P3-C: triage starter, sync then emit, reopen

Code: `public/break_escape/js/systems/triage-starter.js`. It holds `startInboxTriageMinigame` and the save
logic, in its own module so the Node test can load it without `minigame-starters.js` and its import chain.

## For P3-W (the shared-file block)

`systems/minigame-starters.js` gets only this, beside the other social starters:

```js
import { startInboxTriageMinigame } from './triage-starter.js';
export { startInboxTriageMinigame };
window.startInboxTriageMinigame = startInboxTriageMinigame;
```

The `triage-workstation` branch in `interactions.js` calls `window.startInboxTriageMinigame(sprite)`. A shell
that has a conclusion task puts `conclusionTaskId` in the object's `minigameData` beside `triageSetId`
(an episode runner may pass `{ stage, conclusionTaskId }` as the second argument instead).

## For P3-B (what the overlay receives and should do)

Status at hand-off: `inbox-triage-minigame.js` already calls `persistResult` (with `onResult` as an alias) and
has `setSavingState`; it holds Finish while saving.

Params: `triageSetId`, `set` (the resolved `social.triageSets` entry), `stage` (effective), `prefix`,
`conclusionTaskId`, `readOnly`, `storedResult`, `savingNotice` ("Saving your result..."), `persistResult`,
plus `requiresKeyboardInput` and `disableClose` (both true).

1. When a round's result screen appears, call `this.params.persistResult(result)` with the scorer's
   result (`percent`, `reportRate` are what it reads). It returns `Promise<{ confirmed, emitted }>`. Each
   "Try again" round passes its own new result object; a "Try the other set" round is saved under the
   paired set's own prefix, found by `result.setId`. If the overlay never calls it, the starter saves on
   `complete(true)` instead; calling it and then completing with the same object saves once.
2. Add `setSavingState(state)`. The starter calls it while the overlay is still open: `'saving'` shows the
   notice (only after a first failed attempt, so a quick save shows nothing), `'saved'` hides it, `'failed'`
   should leave a line such as "Not saved yet. It will save the next time you open this workstation."
   Once the overlay has closed, `'saving'` becomes a `gameAlert`.
3. `readOnly` with `storedResult` `{ percent, reportRate, pass, headline, readOnly: true }`: a pre or post set
   already done. Show the result from it, offer no round and no Try again, and finish with `complete(true)`
   (the starter ignores the result of a read-only open).
4. Finish: `gameResult = result`, `complete(true)`. Close mid-round: `gameResult = { aborted: true }`,
   `complete(false)`; nothing is written.

## Behaviour

- Writes `<prefix>percent`, `reportRate`, `pass`, `done` through `writeGlobal(..., { deferEmit: true })`, awaits
  `stateSync.syncConfirmed()` (a refused section counts as unconfirmed; 403 is final), then emits the changed
  `global_variable_changed:<name>` events (done last) and `inbox_triage_completed`
  `{ setId, stage, prefix, percent, reportRate, pass, reemit }`. That event name is new; no design doc named
  the done event.
- On `false`, nothing is emitted. The held names are kept per prefix and go out with the next confirmed
  save, even though writing the same value again is not a change.
- `pass = (stored pass) || percent >= outcome.passPercent` (default 0): never cleared.
- Reopen: `<prefix>done` true, `conclusionTaskId` given and that task not `completed` in
  `objectivesManager.taskIndex`: await `syncConfirmed()`, check the task again, then emit pass (when true),
  done and the done event with `reemit: true`. One re-emit per prefix at a time. This runs for any stage
  that names a conclusion task, not only pre and post; a confirmed mission round also re-emits unchanged pass
  and done while its conclusion task is open. 05 N6 ties the re-emit to the pre/post guard; the wider rule
  covers the lab, whose `triage_pass` could otherwise reach the server without ever firing Ruth's mapping.
- A set with no `outcome.setGlobalPrefix` saves nothing (a console warning); P3-E's lint should require it.

## Tests and runs (2026-10-21)

- `bundle exec node --test test/js/social-triage-starter.test.mjs`: 17 pass. The social glob with
  `--test-concurrency=1`: 424 pass (run before the 17th test was added).
- `bin/rails test test/controllers/break_escape/social_sync_then_emit_test.rb`: 5 runs, 41 assertions, 0 failures.
- `tools/playtest/se/triage-sync-regress.js` on slice game 2916 (keyless :3001, Node 24, the 1248 browser
  wrapper from `se-P1-T0b-fix`): RESULT PASS, 14 checks. Blocked sync: no event during 4 attempts, notice
  shown, events after the block lifts with done last and the confirmed PUT carrying `p3c_blocked_done`.
  Offline: 6 attempts, nothing emitted, `failed`. Forced 403: one PUT, nothing emitted. The server row
  afterwards holds all three probes' values (the held ones went with a later sync).
- Not yet run: the minigame-level E2E (overlay, workstation, host mapping, task POST). It needs P3-B, P3-W
  and the slice's triage set; P3-T should run it with this script's routing.
