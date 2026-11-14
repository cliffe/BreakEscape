# SIMS-4 review, round 3: server, sync and cheat resistance

Slice: the staff-room pair (Keith Dando and Jodie Kerr). New since R2: Jodie gains an `upkeep` need met
only by the new `staff_lockers`; the `npc_exchange_heard:exchange_job_called` mapping drops `upkeep` to
0 so she walks to the lockers after her break; `npc_used:staff_lockers` sets `job_cleared` through a
`setGlobal` and completes a new task `see_light_fixed`, which steadies the flickering-light variant.
Jodie's ink no longer sets `job_cleared` (it only reads it); Neil's ink resets `asked_now` at the top
of `hub`. Branch `build/ol-sims`, tip `ed0a5cd1f`.

Read-only evidence. `git diff --stat main...HEAD -- app/ lib/` is empty, so every server and controller
path is byte-for-byte main. The engine JS the sync and cheat checks rest on is also unchanged from main:
`git diff --stat main...HEAD` reports no change to `state-sync.js`, `systems/npc-manager.js`,
`systems/objectives-manager.js`, `systems/global-writer.js` or `systems/apply-actions.js`. Only
`systems/npc-needs.js` differs from main (127 lines), and its hunks are all in path and arrival-tolerance
code (around lines 28, 369, 626, 1303, 3143, 3800, 4481, 5155, 5396); the sync-bearing lines this review
uses, the `heard_${knot}` write (`npc-needs.js:2892`), `_exchangeHeard` (`:2783`), `stowRevealedSlots`
(`:5381`) and `slotHome` (`:4854`), sit between those hunks and are untouched. No live server was started;
no game state was written or read back. R2's saved-game measurement stands because the server code is
identical to the build it ran on.

## Verdict

Counts: 0 blockers, 0 major, 1 minor.

- Blockers: 0
- Majors: 0
- Minors: 1 (m1: the docs and the `npc_used:staff_lockers` comment say completing `see_light_fixed`
  brings `job_cleared`'s sync sooner; for this scenario it does not, because `test_needs_sims` gates no
  conclusion on a global, so the task-completion pre-flush never runs and the custom-task POST carries no
  globals. The design is still safe because the self-heal the docs describe is real, so this is a wording
  fix only.)

## R2 m1 is addressed in the docs

R2 m1 asked that the reload-replay note add the `job_called` and `job_cleared` cases the lighting variant
rides on. It is now carried as an explicit third case at `README.md:150` ("A third case (server review R2
m1): `job_called` is set through ink `#set_global` ... and `job_cleared`, now set by Jodie's
`npc_used:staff_lockers` mapping, can be lost the same way ...") and at the plan 5.4 Sync paragraph
(point (3), "which brings the sync sooner but is not relied on"), the build log at `:313`, and the
`npc_used:staff_lockers` comment at `scenario.json.erb:1226`. Closed, subject to the wording correction in
m1 below.

## What was checked and confirmed

**No server code slipped in.** `git diff --stat main...HEAD -- app/ lib/` is empty, so
`merge_global_variables!` (`game.rb:801`), `complete_task!` (`game.rb:4233`), the task-type validation,
`SERVER_OWNED_GLOBAL_NAMES` (`game.rb:2262`) and the sync route are identical to main. The `app/` changes
in the wider `ed270e239..HEAD` range are the phish chunk C work merged from main, not this slice.

**The new task and the global are declared and accepted.** `see_light_fixed` is declared once as a
`custom` task under the optional aim `watch_the_staff_room` (`scenario.json.erb:175`). `job_cleared` is
declared false once (`:63`). `complete_task!`'s `when 'custom'` branch (`game.rb:4331`) validates nothing
beyond task-found, not-already-completed and the server-completed-only guard, so the client route
(`games_controller.rb:1757`, `trusted: false`) accepts it. The scenario holds no `creditOnPass` gate, so
`server_completed_only_task_ids` is empty and `see_light_fixed` is never server-only. `merge_global_variables!`
rejects only `SERVER_OWNED_GLOBAL_NAMES` (`%w[se_captures]`) and treats `imported_global_names`,
`wearable_read_only_globals` and `server_credit_global_names` as read-only; `job_cleared` and `job_called`
are in none of these (no VM flags, no worn globals, no gate credit here), so the server stores the
client-sent value. That is intended: the policy hard-enforces only secrets, keys and forged items, and
neither global carries an account, address, password or code.

**Forging the task or the global stays within the cheat policy (6.2).** A crafted `complete_task` POST can
tick `see_light_fixed`, and a crafted `/sync` can set `job_cleared` true. Both are cosmetic and optional:
`see_light_fixed` completes only the "Nothing to solve" aim `watch_the_staff_room`; `job_cleared` gates
only the `staff_room` lighting variant (`:1099`), Jodie's cosmetic "Did that light get sorted?" hub reply
(`jodie.ink:25`) and the `exchange_job_cleared` gate (`:1214`). No `unlockDoor`, `reward`, `revealOnGlobal`
or `concludeRequires` reads either global (grep: none). Forging the global does not emit the
`npc_exchange_heard:*` or `npc_used:*` events the completion mappings need, so the real overheard and
real-use beats are still the only non-forged routes, as R2 found. Jodie's ink moving off `job_cleared`
(now read-only in `jodie.ink`) does not change this: the only writer is the server-reachable mapping.

**Synced `player_state` does not grow and is sent as deltas.** The new upkeep path adds no synced
accumulation. `upkeep` is a needs level, and the two `needs.set` mappings (`:1224`, `:1225`) carry only
`needs.set`, which `state-sync.js` never syncs. `job_cleared` is one boolean key, delta-synced like the
other staff-room booleans. The new `onceOnly` mappings add stable `triggeredEvents` keys only:
`npc_exchange_heard:exchange_job_called` (two handlers, `:1223` task and `:1224` upkeep drop),
`npc_used:staff_lockers` (`:1226`) and `npc_exchange_heard:exchange_job_cleared` (`:1227`). The
`room_entered:staff_room` re-send mapping (`:1225`) is not `onceOnly` and has no `maxTriggers`, so
`exportTriggeredEvents` never persists it (`npc-manager.js:2098` exports only handlers whose
`triggered.persist` is true, and `:1432` sets `persist` only for `config.once || config.maxTriggers`); its
cooldown `lastTime` is in-memory only. Nothing grows per break, per crossing or per reload, matching plan
5.4/6.5. R2's 49-game measurement applies unchanged (server code identical).

**The reload replay matches the design and self-heals.** `job_cleared`, the `heard_${knot}` markers and the
`npc_used:staff_lockers` `onceOnly` record all reach the server the same way, through `state-sync` on the
30-second periodic sync or the page-hide flush (the mapping `setGlobal` at `npc-manager.js:1442` writes
`gameState.globalVariables` and emits, but never calls `stateSync.sync()`; `heard_${knot}` goes through
`world.setGlobal`/`writeGlobal`, also no forced sync). Because all three ride the same delta, a fast reload
with no page-hide loses them together, so the `npc_used:staff_lockers` `onceOnly` latch is cleared in the
same loss that drops `job_cleared`; Jodie's `room_entered:staff_room` re-send then takes her back to the
lockers (or the job-called exchange replays first if its marker also went), she uses the lockers again, and
the re-armed mapping re-sets `job_cleared` and re-completes `see_light_fixed` (idempotent on the server).
The README and plan "it heals itself" description is accurate; the impact is bounded to a cosmetic
re-flicker of an optional aim, so there is no soft-lock.

## Findings

### m1 (minor) - the docs and the lockers-mapping comment say completing `see_light_fixed` brings `job_cleared`'s sync sooner; for this scenario it does not
Files: `scenarios/test_needs_sims/scenario.json.erb:1226` ("The task completion makes the global reach the
server sooner (server R2 m1)"); `scenarios/test_needs_sims/README.md:150` ("the mapping also completes
`see_light_fixed`, which brings the sync sooner but is not relied on") and `:65` ("a task completion only
makes that sooner"); `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` section 5.4 Sync (point (3), same
phrase) and section 6.5 ("a reveal or marker that must survive a reload needs an eventMapping that also
completes a task"); `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md:315` ("a task completion only makes
that sooner").

A task completion flushes globals sooner only through the pre-flush in
`objectives-manager.js:serverCompleteTaskWithRetry` (`:634-651`), which awaits `stateSync.sync()` only when
`scenarioGatesOnGlobals()` holds (`:641`), that is, only when some aim has a non-empty
`concludeRequires.globals` (`:627-632`). `test_needs_sims` has no such gate, so the pre-flush never runs.
The completion itself is a `serverCompleteTask` POST (`:1246`) whose body carries only `submittedFlags` or
`currentCount`, never `globalVariables`; for a `custom` task the body is empty, and the `custom` path has no
`safeSyncOnce` (only `enter_room` does, `:776`). So completing `see_light_fixed` does not carry `job_cleared`
to the server any sooner than the 30-second periodic sync or the page-hide flush: `job_cleared` rides
exactly the path R2 m1 recorded for the ink setter.

Impact: cosmetic and documentation-only, so a minor, not a blocker. The runtime behaviour is correct and
safe because the self-heal above does not depend on the pre-flush. The gap is that the explanation is
wrong, and the general guidance in plan 6.5 ("a marker that must survive a reload needs an eventMapping
that also completes a task") holds only for a scenario that gates a conclusion on a global; a future
mission copying the pattern without such a gate would not get the earlier flush the sentence promises.
Suggested fix (docs and comment only, no code change): at the five sites say that the completion brings the
global's sync sooner only in a scenario whose mission conclusion gates on a global (the condition for
`serverCompleteTaskWithRetry`'s pre-flush); `test_needs_sims` does not, so here `job_cleared` reaches the
server on the next periodic or page-hide sync like any bare `setGlobal`, and the design relies on the
self-heal, not on the task completion. The S3 R4 evidence (game 4608, `staff_room_seen` set by a bare
mapping read true on the server) supports "a bare `setGlobal` is not lost", not "a task completion makes it
sooner", so keep that citation under the first claim only.

## Notes

- Jodie's "Did that light get sorted?" hub choice (`jodie.ink:25`) now only reads `job_cleared` and sets no
  global, matching the brief; the only writer is the mapping at `scenario.json.erb:1226`.
- Neil resets `asked_now` at the top of `hub` (`neil.ink:37`) as well as in `start` (`:26`); `asked_now` is
  an ink-only VAR, not a scenario global, so it never reaches the server and raises no sync or cheat
  concern.
- `heard_exchange_job_called` and the other `heard_*` markers are never written by the scenario; the engine
  writes `heard_${ex.knot}` on an overheard exchange (`npc-needs.js:2892`), which is why the self-heal and
  the delta-sync reasoning above apply to them.
- Read-only throughout: no live server, no game-state write, no SecGen or exploit material opened (none was
  needed).

## Severity table

| ID | Severity | Title | Code change |
|---|---|---|---|
| m1 | minor | Docs and lockers-mapping comment claim completing `see_light_fixed` flushes `job_cleared` sooner; this scenario gates no conclusion on a global, so it does not | No (docs and comment only) |
