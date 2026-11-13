# Conclude race build log

Branch: `build/conclude-race` (from main `2f5471209`). Worktree `.claude/worktrees/p-conclude-race`.

## The bug

A task completes on the same beat that sets a global named in the mission's
`concludeRequires.globals`. The task-completion POST (`POST .../objectives/tasks/:id`)
can reach the server before the state sync (`PUT .../sync_state`) that carries that
global. The server reads `player_state['globalVariables'][var]`, finds it absent, and
answers with a conclusion warning (`Game#unmet_conclude_requirements`,
`game.rb` ~3711-3726). The client shows it as a "Not Yet…" toast
(`objectives-manager.js` ~660-664). The global lands a moment later and the mission
concludes anyway, so the warning is shown over the ending.

Reported by the release-readiness session: sis02 hit it; about 69 awareness `ca*`
scenarios gate on episode/triage globals (ca01 completes its task from an eventMapping
on the gate global's change, the race shape). sis01's "Not Yet" was a *different* bug
(its debrief task completes when the debrief opens, minutes before `debrief_complete`
is set) and is fixed in its scenario on `build/rel-fixes`; it is not a race and not a
proof case here.

## Root cause

Nothing ordered the pending global sync before the task-completion POST. The parallel
**conclude** path was already protected: `concludeMission()` in
`music/scenario-music-events.js` (lines 369-373) flushes `window.stateSync.sync()`
twice before `POST .../conclude`. The task-completion path had no equivalent.

## The fix

Mirror the proven conclude-path pre-flush on the task-completion and skip paths, and
heal a residual race with an idempotent re-post.

1. **Primary (client, root cause).** `ObjectivesManager.flushPendingGlobals()` awaits
   `window.stateSync.sync()` twice. It is called before the completion POST (in
   `serverCompleteTaskWithRetry`, once, ahead of the retry loop) and before the skip
   POST (in `skipTask`). `sync()` sends `buildChanges()` — deltas only, and nothing at
   all when nothing changed — so no growth of `player_state` (SYNC SIZE RULE).
2. **Second line of defence (client + server).** If the completion still returns a
   conclusion `warning` (a tight residual race, or the flush failed), the client flushes
   again and re-posts the completion. The server's "already completed" branch in
   `Game#complete_task!` now re-evaluates the gate (`recheck_pending_mission_conclusions!`)
   and reports `missionConcluded` / `warning`, so the idempotent re-post can conclude the
   mission instead of leaving it stranded. The client shows the toast only if the gate is
   *still* unmet after the re-post. The warning is not merely dropped.

### What each request now sends

- `PUT .../sync_state` (the pre-flush): unchanged — `buildChanges()` deltas (changed
  globals among them), or no request when nothing changed. Bounded, delta-only.
- `POST .../objectives/tasks/:id` (completion): **body unchanged** (`submittedFlags` /
  `currentCount` only where already sent). Response may now also carry
  `missionConcluded` / `warning` on the *already-completed* branch — fields the client
  already handles.
- `POST .../objectives/tasks/:id/skip`: unchanged body; same pre-flush ahead of it.

### Cheat policy

No new trust. `concludeRequires.globals` is already the client-reported weak gate
(`game.rb` comment at `unmet_conclude_requirements`); hard secrets gate via
`concludeRequires.tasksCompleted` (server-validated flags), untouched. The global still
travels the same validated sync path; the fix only orders it before the POST.

## Files touched

- `public/break_escape/js/systems/objectives-manager.js`
- `app/models/break_escape/game.rb`
- `test/js/conclude-race.test.mjs` (new)
- `test/controllers/break_escape/conclude_race_test.rb` (new; the Rails test uses an
  inline `scenario_data`, so no scenario directory was added)

## Tests

Written failing first, then made green by the fix.

- `test/js/conclude-race.test.mjs` (node, 2 tests): the pre-flush runs before the
  completion POST; a residual warning is healed by a flush + idempotent re-post that
  concludes (no "Not Yet" toast). Red before the fix (no flush; warning not healed).
- `test/controllers/break_escape/conclude_race_test.rb` (Rails, 2 tests): completing
  the gate task before its global syncs warns and does not conclude (reproduces the
  race); a re-post after the global arrives concludes the mission. The second was red
  before the server change (returned "Already completed" with no `missionConcluded`).

Touched-file importers run (no full suites):

- node, every test importing `objectives-manager.js` (15 files): all pass.
  credits-header-text 8, credits-mission-exit 4, ending-check 21, ending-credits-audio 13,
  ending-replay-credits 3, objectives-all-optional-aim 3, objectives-global-unlock 7,
  objectives-network-footholds 8, objectives-required-marker 10, objectives-reveal 12,
  objectives-signin-pc 3, objectives-skip 6, objectives-target-ids 6, success-screen 16,
  conclude-race 2.
- Rails, every test exercising `complete_task!` / the already-completed branch:
  task_set_global, social_sync_then_emit, conclude_mission, conclude_race (22/112),
  game_test + reload_persistence (168/668), games_controller + game_state_locking
  (68/230). All pass.

## Live proof

Not yet run in a browser (handed back near the context budget). The two tests above
exercise the real code paths, not mocks of them: the node test drives the real
`ObjectivesManager.completeTask` flow (only `stateSync`/`fetch` are seams) and asserts
the sync runs before the completion POST; the Rails test goes over real HTTP through
the real controller and `Game#complete_task!`. Both reproduce the ordering and are red
before the fix.

### Important finding that changes the proof cases

- **ca01's conclude gate is already protected**, so it will NOT show the race live.
  Its gate global `episode_e1_invoice_fraud_defend_complete` is written by the inbox
  triage minigame through `triage-starter.js` `persistTriageResult`, which already does
  "sync, then emit": it writes the globals with `deferEmit`, awaits
  `stateSync.syncConfirmed()`, and only then emits `global_variable_changed:...complete`
  (the event that completes `sort_payments_inbox`). That is a per-feature workaround for
  this exact race. ca01 has the shape but the triage path hand-rolled the fix.
- **The generic race is the plain path**: `apply-actions.js` `setGlobal` calls
  `writeGlobal(..., { emitAlways: true })`, which emits the change immediately, no sync.
  Any eventMapping that completes a conclude-gate task on that change is the race. The
  engine fix makes this path safe, so a scenario no longer needs the triage-starter
  workaround. This is the case to prove live.

### Live-proof plan (for the follow-up runner)

Keyless server on :3061 only (start by hand like `tools/playtest/start-keyless-server.sh`
but `-p 3061`; log at `tmp/keyless-3061.log`; stop it after, by PID). Use setFPS(20),
fixed steps on. No VM flags needed (sis02 and ca01 have no VMs).

1. **Minimal plain-path scenario** (cleanest): a scenario with a start room, an
   interactable whose `onInteract` runs `setGlobal gate_global true` (the plain,
   immediate-emit path), an eventMapping `global_variable_changed:gate_global ->
   completeTask: final_task`, and a `missionConclusion` aim whose single task is
   `final_task` with `concludeRequires.globals: ["gate_global"]` and a `bond_visualiser`
   conclusionScreen. Create a game row directly (a `bin/rails runner` with inline
   `scenario_data`, as `conclude_race_test.rb` does — avoids seeding a Mission). Load
   `/break_escape/games/:id`, drive the interact via `window.__test`, assert the credits
   open and no "Not Yet" toast fired. Then `grep` `tmp/keyless-3061.log` for the order:
   `Started PUT ".../sync_state"` must precede `Started POST ".../objectives/tasks/final_task"`,
   and that POST completes 200 (not a 422/warning). `tools/playtest/count-task-posts.sh`
   and `verify-run.rb <id>` confirm the single completion and `mission_concluded_at`.
2. **sis02 old-gate test copy**: copy sis02's scenario to `scenarios/test_*` (or a scratch
   row), restore its old globals conclude gate (the FLAG SESSION global, set via the plain
   path, not triage), drive to the FLAG SESSION beat and conclusion, same log-order check.
   Do NOT edit sis02 itself.
3. **ca01**: expected to conclude cleanly BECAUSE triage-starter already syncs-then-emits;
   worth running once to confirm no regression and to show the log order (the sync lands
   before the `sort_payments_inbox` POST either way). Not a demonstration of the engine
   fix on its own.

## Handover

Status at hand-back (near context budget):

- **Done and committed** (`2fb8f961e`): the engine fix + both failing-first tests + build
  log. Branch `build/conclude-race` off main `2f5471209`, worktree
  `.claude/worktrees/p-conclude-race`.
- **Root cause / fix / request payloads**: see the sections above. No `player_state`
  growth; no new server trust.
- **Tests green**: node conclude-race 2/2 and all 15 objectives-manager importers; Rails
  conclude_race 2/2 plus task_set_global, social_sync_then_emit, conclude_mission,
  game_test, reload_persistence, games_controller, game_state_locking (all pass). Full
  suites deliberately not run (test-lock rule).
- **Open**: the three browser live proofs (plan above). Note the ca01/triage-starter
  finding — ca01 will not show the race on its own.
- **Gotchas**: `complete_task!`'s already-completed branch now returns `missionConcluded`
  and sometimes `warning`; two existing tests assert only `json['message']`, still green.
  The conclude POST path (`scenario-music-events.js` `concludeMission`) already pre-flushed;
  only the task-completion and skip paths were missing it.
- **Files touched**: `public/break_escape/js/systems/objectives-manager.js`,
  `app/models/break_escape/game.rb`, `test/js/conclude-race.test.mjs`,
  `test/controllers/break_escape/conclude_race_test.rb`, this log.
