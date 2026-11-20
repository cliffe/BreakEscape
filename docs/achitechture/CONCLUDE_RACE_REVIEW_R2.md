# Conclude-race fix: code review R2

Branch `build/conclude-race`, tip `b3ef8fcf3`. Reviews the R1 fixes
(`26a601256`), the clean merge of main `da5f53f34` (`93d006ad9`) and the build
log (`b3ef8fcf3`), over the full diff `da5f53f34..b3ef8fcf3`. Review only; no code
changed.

## Verdict

No blocker, no new M. Every R1 ruling is correctly applied and the merge is
clean. Counts: B 0, M 0, m 1, n 2. Ready for a train.

Tests run (touched files, no full suites):
- node `conclude-race.test.mjs`: 6/6.
- Rails `conclude_race_test.rb`: 5 runs, 33 assertions, 0 failures.
- Rails `games_controller_test.rb` + `game_state_locking_test.rb` +
  `conclude_mission_test.rb` + `task_set_global_test.rb`: 83 runs, 288
  assertions, 0 failures.
- Validator on `scenarios/test_conclude_race`: 0 errors, 1 advisory warning (the
  gate NPC has no `*_talk.png`; cosmetic, a test scenario).

## R1 findings re-verified

**M1 (fixed, and completion notification preserved).** The controller fires
`on_task_complete` only when the result has no `:message`
(`games_controller.rb:1635`), matching `skip_task` at :1664. The idempotent
"Already completed" branch is the only success path in `complete_task!` that sets
`:message` (the fresh-completion path returns no `:message`), so the hook fires
once on the real completion and never on the re-post. The one risk this guard
raises is the residual-race case where the *re-post* is what concludes the
mission (first POST warned): `on_task_complete` is suppressed there too. It does
not matter, because mission completion is pushed to the host by a separate
channel: `after_commit :fire_completion_callback` (`game.rb:40-42`) fires
`on_game_complete` when the re-post's `save!` flips `status` to `completed` /
sets `mission_concluded_at`. So the host still learns the mission concluded. The
first POST (task score) fired `on_task_complete`; the concluding save fires
`on_game_complete`. No lost notification, no double-fire.

**M2 (fixed, scoped, single round-trip, no staleness in practice).** The
hot-path pre-flush is a single `await window.stateSync?.sync?.()`, guarded by
`scenarioGatesOnGlobals()`, on both the completion
(`objectives-manager.js:609-611`) and skip (`:800-806`) paths. Scenarios with no
`concludeRequires.globals` do no pre-flush and keep their original timing;
confirmed against the pre-scoping source — only the "no global gate keeps the
original timing" test fails there, the rest pass because that build still
flushed. `scenarioGatesOnGlobals()` reads `aim.concludeRequires?.globals` from
`this.aims`, authored scenario data the client already holds, so no new trust
and no cheat surface (a client that lied about the flag would only make its own
race more likely). The `_gatesOnGlobals` cache is computed lazily and correct for
a page lifetime: the manager is a singleton created once (`game.js:1890`),
`reset()` keeps the same `aims`, and a page serves one scenario. See n2 for the
one latent edge.

**m2 (tests present; three of the four new node cases are without-fix failures,
one is a regression guard).** The Rails m2 cases both genuinely fail without the
server change (a still-false re-post needs the new `warning`; the
after-conclusion case needs `missionConcluded`). Of the node additions, "gates on
a global pre-flushes" and the skip pre-flush fail against main; "no global gate
keeps the original timing" fails against the over-broad pre-scoping build (it
guards the M2 scoping specifically). The one soft spot is noted at m1 below.

**n1 (rename correct, no logic flip).** `was_concluded_before` is renamed to
`was_not_concluded_before` at all three sites (`game.rb:3645`, `:3715`, `:3764`)
and every `mission_just_concluded = was_not_concluded_before &&
mission_concluded_at.present?` reads the renamed variable. The value and the
boolean logic are unchanged; the name now matches the value (true when the
mission was not concluded before).

**n2 / skip path (from the brief's new-issue list).** The skip path's single
pre-flush orders the global ahead of the skip POST. `skip_task!` can return a
`warning`, but `skipTask` reads only `result.missionConcluded` and drops the
warning silently (no toast, no fallback re-post, unlike `completeTask`). Covered
under m1. The sync-failure and double-completion cases are clean: `sync()` never
rejects (`state-sync.js` `_syncOnce` catches and returns `{ok:false}`), so the
unguarded scoped flush cannot throw into the POST; the retry loop stops on
success and the server's already-completed branch is a no-op for task state, so
the two POSTs the warning path makes do not double-award or double-complete.
sis01's merged `concludeRequires: {}` (empty) makes `scenarioGatesOnGlobals()`
false, so sis01 takes no pre-flush and keeps the timing its own scenario fix set;
no interaction with this change.

## m1 - skip-to-conclude residual race strands silently (minor, backlog)

`objectives-manager.js` `skipTask` has no warning fallback. If a skipped task is
the one that would conclude a global-gated mission and the single pre-flush sync
is answered stale, `skip_task!` returns `warning`, which `skipTask` ignores: no
re-post, no toast, and the mission stays unconcluded until some other trigger or
a reload. This is the skip sibling of R1 m1 (the completion path at least toasts
and re-posts). Skip-concludes-a-mission is an unusual shape and the pre-flush
covers the common race, so it is an accepted-risk edge. Suggest adding it to the
same `docs/IDEAS_BACKLOG.md` note as R1 m1, or giving `skipTask` the same
flush-and-re-post fallback `completeTask` has.

## n1 - `_gatesOnGlobals` cache is not reset on re-initialise (nit)

`scenarioGatesOnGlobals()` caches on first call and nothing clears it;
`initialize()` sets `this.aims` but does not reset `this._gatesOnGlobals`, and
`reset()` does not either. Not reachable today (one scenario per page, singleton
manager, `reset()` keeps the same `aims`), so no live bug. If the manager is ever
re-`initialize()`d with a different scenario without a page reload, the cache
would be stale. Cheap guard: set `this._gatesOnGlobals = undefined` in
`initialize()`.

## n2 - node "Not Yet exactly once" test is a pure regression guard (nit)

`conclude-race.test.mjs` test 5 ("a gate still unmet after the fallback re-post
toasts Not Yet exactly once") passes against both main and the pre-scoping build,
so it never fails without the fix; it only guards against a future double-toast
regression in the fallback. Fine to keep, but it does not demonstrate the m2
behaviour the way the other new cases do. Consider asserting the fallback made a
second POST (the re-post) as well as the single toast, so it pins the fallback's
shape rather than only its toast count.
