# Implementation review: SE mechanics batch

Reviewer pass over five commits, 2026-10-22. Focus: correctness, gating (shipped
m01–m08 must play exactly as before), test quality, and whether the tests prove
behaviour on the real path.

Commits reviewed:

- `90d00ec5` — SE mechanics batch (follow-ups, defender indicators, triage kinds, highlights)
- `9d4f096c` — live globalVariable aim unlock; validator give-item placement rule
- `a04b0ee9` — mail trim reported to the client and reconciled
- `316dee74` — closed social schema and option lints
- `e99068bf` — report row order, best triage round kept, lockedHint

## Verdict

No blockers. The shared-file hooks are opt-in and correctly gated: every one is a
no-op for a scenario without a `social` block, so m01–m08 are unaffected. Evidence
below. Findings are all minor.

### Checks run

- `ruby scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb --no-graph --skip-ink`:
  validates clean (only the pre-existing warnings/suggestions). The closed social
  schema and `split_schema_errors` do not reject a shipped mission.
- `test/models/break_escape/mail_state_test.rb`: 24 runs, 0 failures — the real
  server path for `merge_mail_state!` and the trim/`mail_trimmed_keys` reporting.
- `test/controllers/break_escape/mail_state_sync_test.rb`: 9 runs, 0 failures — the
  real controller path (`notSaved`, `mailTrimmed`).
- `test/js/social-*.test.mjs` + `validator-social-*` + `locked-hint` +
  `objectives-global-unlock`: 813/814 pass. The one failure is a test-isolation
  artefact (minor 1 below), not a product bug.

## Gating evidence (shipped missions untouched)

- `objectives-manager.js` `watchGlobalUnlocks(live)`: returns early unless `live`,
  and `game.js` passes `liveGlobalUnlock: !!gameScenario.social`
  (`core/game.js:~1667`). m01 has no `social` block, so the manager keeps the
  load-time-only check. m03/m05/m07 still unlock via `unlockAim` as before, and the
  call is idempotent.
- `social-intel.js` `watchReadinessGlobals(...)` is called unconditionally in
  `create()`, but reads `social.intelBoard.readinessSlots`; with no `social` block
  `names` is empty and it subscribes nothing and writes nothing
  (`social-intel.js:122-124`).
- `locked-hint.js` `withLockedHint(base, lockable)` returns `base` unchanged when the
  lockable has no `lockedHint`, so the "Wrong Keys"/"Wrong Key" alerts in
  `minigame-starters.js` are identical for shipped missions.
- `game.rb` options sanitise (`game.rb:2330-2335`) is inside `sanitize_mail_threads`,
  a mail-state-only path. Shipped missions send no `mailState`, so it never runs for
  them. It only adds `options` to a retained thread entry; it drops no other field.
- `triage-starter.js` best-round-keep and `report-model.js` row order are triage /
  engagement-report code, reached only by the social minigames.
- The mail-trim reconcile (`a04b0ee9`) runs only when `params[:mailState]` is present
  and only when a save succeeds and `mail_trimmed_keys` is non-empty; shipped missions
  send no `mailState`.
- The event both hooks ride, `global_variable_changed:<name>`, is real and already
  used across the engine (`global-writer.js:194`, `social-influence.js`,
  `scenario-music-events.js`, `npc-manager.js`). So the hooks act on the production
  event, not a test-only one.

## Findings

### Minor 1 — spurious combined-run test failure (test isolation)

`test/js/social-mail-runner.test.mjs` passes 18/18 in isolation, but a combined
`node --test test/js/social-*.test.mjs ...` run reports one `failureType:
'uncaughtException'` attributed to that file. The surfaced error is a deliberate
`boom` thrown on an error path in `social-global-writer.test.mjs` /
`social-ink-vars.test.mjs` (both intentionally break the variable writer). The most
likely cause is an unreleased timer / unawaited rejection leaking past a test's end
(the mail scheduler uses `setTimeout`). Not a product defect, but it makes the suite
flaky as a CI signal. Worth tightening the offending test's teardown (clear scheduler
timers / await the rejection) so the combined run is green.

### Minor 2 — trimmed message with no `id` is still reported-silently dropped

`game.rb:~2251` (`trim_mail_messages!`): `dropped << "mailboxes.#{box_id}.#{msg['id']}"
if msg['id']`. A message the server trims that lacks an `id` is dropped server-side
but not reported, so the client would still hold it as confirmed and lose it on the
next reload — the exact failure `a04b0ee9` sets out to fix, for the id-less edge case.
In practice every real mail record carries an `id` (the client keys by it, and
`mail-scheduler.js dropMessages` matches on `m.id`), so impact is low. Defensive note
only; consider asserting/logging if a trimmed message has no id.

### Minor 3 — mailbox-id dot assumption in the trim key, unguarded

`mail-scheduler.js dropMessages` splits the reported key `mailboxes.<box>.<msgId>` on
the first dot after the `mailboxes.` prefix, assuming the box id holds no dot (comment
at `mail-scheduler.js:~348`). The server (`trim_mail_messages!`) builds the key from a
raw `box_id` and does not enforce dot-free ids. A mailbox id containing a dot would
misroute the client-side drop (wrong box or wrong msgId), so the mail would not be
dropped on the client and would reappear/vanish inconsistently on reload. Box ids are
scenario-authored and no lint forbids a dot. Edge case; either enforce dot-free
mailbox ids in `validate_social` or key the drop as a `[box, msgId]` pair rather than a
dotted string.

### Minor 4 — the game.js wiring boolean is not covered by a test (real-path gap)

The tests exercise the real `ObjectivesManager.watchGlobalUnlocks` and the real
`watchReadinessGlobals` functions directly, and the event name they subscribe to is
the production one (evidence above), so the hooks themselves are tested on the real
path. What no test covers is the thin `game.js` gate itself —
`liveGlobalUnlock: !!gameScenario.social` and the unconditional
`watchReadinessGlobals({ scenario })` call in `create()`. A regression that widened the
gate (e.g. passing `liveGlobalUnlock` for every scenario, which would change m03/m05/m07
unlock timing) would not be caught by the current suite. The boolean is trivial and m01
validates clean, so risk is low; a one-line assertion that `create()` passes
`liveGlobalUnlock=false` for a non-social scenario would close it.

### Non-issues checked

- `split_schema_errors` (`validate_social.rb`): reclassifies only messages matching
  `'#/social(/|')` as social (non-fatal unless `--strict-social`); every other schema
  error stays in `errors` and remains always-fatal. The only unsafe direction would be
  a non-social error being downgraded, which needs a non-social schema pointer to read
  `#/social` — not possible with the current schema. A social data error whose message
  omits `#/social` simply stays fatal (stricter, safe). Covered by
  `validator-social-schema.test.mjs`.
- give-item placement rule (`9d4f096c`): the refactor into
  `give_item_placement_issues` adds a "text line follows → tag belongs to it, no
  warning" clause that narrows false positives per inkjs tag semantics (DOCS_GAPS gap
  24). It is a warning, not an error, so it cannot fail a shipped mission's validation.
- `watchGlobalUnlocks` `check()` re-checks every aim on any watched global change and
  relies on `unlockAim` being idempotent (stated and true), so no double-unlock.
- `buildDefenderModel` gained an optional `mailState = null` param — backward
  compatible; all board-model additions are type-guarded pure functions with tests
  (`social-intel-board-indicators.test.mjs`, passing).
