# Conclude-race fix: code review R1

Branch `build/conclude-race`, diff `2f5471209..908201992`. Review only; no code changed.

Scope reviewed: `app/models/break_escape/game.rb` (complete_task!, skip_task!,
recheck_pending_mission_conclusions!, check_mission_conclusion,
unmet_conclude_requirements), `public/break_escape/js/systems/objectives-manager.js`
(flushPendingGlobals, serverCompleteTaskWithRetry, completeTask warning branch, skipTask),
`public/break_escape/js/state-sync.js` (sync/_syncRun/buildChanges), both call sites,
the controller actions, and the two new test files. Both touched test files pass
(JS node --test: 2/2; Rails conclude_race_test: 2 runs, 13 assertions, 0 failures).

## Verdict
No blocker. The core fix is sound: the server gate (`unmet_conclude_requirements`)
is re-used unchanged on the idempotent re-post, so no path concludes without meeting
`concludeRequires`; the fallback re-post is a single call, not a loop; a genuinely
unmet gate still surfaces the "Not Yet..." toast; `sync()` sends `buildChanges()`
deltas only and never rejects, so no sync-size growth and no new client trust.
Counts: B 0, M 2, m 2, n 2.

## M1 — complete_task fires `on_task_complete` twice for one conclude-race completion
`app/controllers/break_escape/games_controller.rb:1628-1637`

The idempotent re-post returns `{ success: true, message: 'Already completed', ... }`.
`complete_task` fires `BreakEscape.configuration.on_task_complete` on *any* success,
with no guard. `skip_task` directly below (line 1659) deliberately guards the same
hook with `!result.key?(:message)` ("A new skip can complete the aim ... so the host
rescores as it does after a completion"), precisely to avoid re-firing on an
already-settled re-post.

Scenario: the warning fallback path (objectives-manager.js:688-689) always makes two
POSTs for one conclude-race completion. POST 1 completes the task and returns a
`warning` (success:true) -> hook fires once. POST 2 hits the already-completed branch
(success:true, `message` present) -> hook fires again. Before this fix the client never
re-posted a successful completion, so the hook fired exactly once; the fix introduces
the second fire. Impact depends on whether the host `on_task_complete` is an idempotent
rescore (harmless, just wasteful) or increments anything (double award). The guard
precedent in the sibling action shows the double-fire is not intended.

Fix: match `skip_task` — gate the `complete_task` hook with `!result.key?(:message)`
(the idempotent branch is the only success path that sets `message`).

## M2 — pre-flush runs on every completion and skip, not only conclude-prone ones
`public/break_escape/js/systems/objectives-manager.js:594-595` (completion),
`:782` (skip)

`serverCompleteTaskWithRetry` awaits `flushPendingGlobals()` (up to two sequential
`stateSync.sync()` calls) before *every* task-completion POST, and `skipTask` does the
same before every skip POST. When the state is dirty (globals/room/clock commonly are)
the first `sync()` is a real PUT round-trip the player now waits through before the
completion POST lands and before `showTaskCompleteNotification` runs, for tasks that
have nothing to do with a mission conclusion. It is correct, but broader than the race
it fixes.

Scenario: ordinary mid-mission objective completion with pending global state ->
perceived completion latency grows by one (sometimes two) sync round-trips on the hot
path, on every task.

Fix (optional, to keep the hot path lean): scope the pre-flush to conclude-capable
tasks — `if (this.wouldConcludeMission(task) || <task is a concludeRequires gate
task>)` — and let the existing warning-fallback re-post cover the rest. `sync()` is a
no-op when nothing changed, so the cost is only felt when state is dirty; hence M, not a
blocker.

## m1 — an offline/failed sync at the concluding beat leaves the mission unhealed
`public/break_escape/js/systems/objectives-manager.js:681-698`

`flushPendingGlobals` swallows sync failure (returns false, never rejects). If the
concluding beat happens while offline, the global never reaches the server, both POSTs
return `warning`, the fallback cannot conclude, and the task is still marked
`completed` locally (line 716). Because `completeTask` short-circuits on a completed
task (line 637), nothing on the client re-triggers the conclusion once connectivity
returns; the player is left on a "Not Yet..." toast with the mission unconcludeable
until a reload (server load-time state rebuild) or the `music/scenario-music-events.js`
`concludeMission()` conclude path runs. This is close to pre-existing behaviour (you
could never conclude offline), and the fix does not worsen it, but the new fallback
does not heal it either.

Fix (consider): on a residual `warning` whose cause was a failed/stale flush (sync
returned false), say so in the toast ("...will conclude once your progress saves")
rather than the generic gate message, or leave a one-shot re-check armed for the next
successful sync.

## m2 — test gaps around the still-unmet and idempotent cases
`test/js/conclude-race.test.mjs`, `test/controllers/break_escape/conclude_race_test.rb`

Both tests fail without the fix (JS test 1 asserts a sync precedes the POST; JS test 2
and Rails test 2 assert conclusion via the re-post), so the regression is guarded. Not
covered:
- JS: a *genuinely* unmet gate after the fallback re-post still shows the "Not Yet..."
  toast exactly once (the comment at :686 claims this; nothing asserts it).
- Server: a re-post while the global is still false does **not** conclude and returns
  the warning (the negative of Rails test 2).
- Server: a second re-post *after* conclusion is idempotent — `missionConcluded:false`,
  no warning, no double save/award.
- No test exercises the skip-path pre-flush.

Fix: add those three/four cases.

## n1 — misleading predicate name `was_concluded_before`
`app/models/break_escape/game.rb:3645` (also pre-existing at :3715, :3764)

`was_concluded_before = mission_concluded_at.nil?` reads as the opposite of its value:
it is true when the mission was **not** concluded before. The later
`mission_just_concluded = was_concluded_before && mission_concluded_at.present?` is
correct, but the name inverts the intent. Rename to `was_unconcluded_before` /
`was_not_concluded` for readability. Nit; no behaviour change.

## n2 — `save! if changed?` in the already-completed branch
`app/models/break_escape/game.rb:3647`

Correct and idempotent (a re-post after conclusion changes nothing and skips the save;
a re-post that concludes saves once and fires the completion callback via
`status_previously_changed_to_completed?`, with `mission_conclusion_previously_changed?`
guarding the double-fire). Flagged only to confirm it was checked: the branch relies on
`recheck_pending_mission_conclusions!` mutating `self` before `changed?` is read, which
it does.

## Backlog note (not a change): triage sync-then-emit workaround
`public/break_escape/js/systems/triage-starter.js` persists result globals with
`syncConfirmed()` (confirmed save, back-off) *before* emitting the events that drive
task completion. That is a stronger, event-ordering guarantee than the new
`flushPendingGlobals()` backstop (plain `sync()` x2 + re-post): it avoids the warning
ever arising, rather than healing it after. The two are complementary — the new fix
does not make the triage workaround redundant, and removing its reopen re-emit on the
strength of the ObjectivesManager re-post would be a behaviour change with its own race
surface. Recommend leaving triage-starter.js as is; revisit only if the pre-flush is
later made the single conclusion-ordering mechanism.
