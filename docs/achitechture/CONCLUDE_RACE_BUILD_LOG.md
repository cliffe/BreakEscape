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
- `test/controllers/break_escape/conclude_race_test.rb` (new)
- `scenarios/test_conclude_race/` (new, minimal test scenario)

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

(filled as it lands)

## Handover

(only if the context limit is reached)
