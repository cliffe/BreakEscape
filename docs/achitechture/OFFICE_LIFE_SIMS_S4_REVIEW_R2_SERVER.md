# SIMS-4 review, round 2: server, sync and cheat resistance

Slice: the staff-room pair (Keith Dando and Jodie Kerr) off IT's east door, their coupled breaks,
the gated exchanges, the flickering-light lighting variant added in the R1 fix round, and the
globals `job_called`, `job_cleared` and the three `heard_exchange_*` markers. Branch
`build/ol-sims`, tip `3f4068967`. SIMS-4 ships **0 engine and 0 server lines** (build log SIMS-4 and
the R1 fix entry), so every check is the existing server and engine against the new scenario, ink and
lighting data.

Read-only evidence: `git diff --stat main...HEAD -- app/ lib/` is empty, so `game.rb` and every
controller are byte-for-byte main; the scenario data at `scenarios/test_needs_sims/scenario.json.erb`
and the ink at `ink/keith.ink`, `ink/jodie.ink`, `ink/neil.ink`; the server global merge
`app/models/break_escape/game.rb:801` (`merge_global_variables!`); the client route
`app/controllers/break_escape/games_controller.rb:1737` (`complete_task`, `trusted: false`); the sync
delta boundary `public/break_escape/js/state-sync.js:31-39,81-85,160-180`; the shared global writer
`public/break_escape/js/systems/global-writer.js:146-202` (`writeGlobal`); the ink `set_global`
action `public/break_escape/js/systems/apply-actions.js:148-158`; the task-completion pre-flush
`public/break_escape/js/systems/objectives-manager.js:632-652`. No live server was started; no game
state was written or read back from a running server. R1's saved-game evidence (games 4340-4428,
`player_state` 5494 to 7104 bytes, no per-break growth) stands because `app/` and `lib/` are unchanged
from the build it ran on.

## Verdict

Counts: 0 blockers, 0 major, 1 minor.

- Blockers: 0
- Majors: 0
- Minors: 1 (m1: the R1 fix round's lighting variant reads `job_cleared`, which is written the same
  no-forced-sync way as the `heard_exchange_*` markers, so a sub-30-second no-page-hide reload can
  re-flicker a cleared light; the reload-replay note in the README and plan 5.4 Sync enumerates only
  the heard markers and `firstVisit`, not this third case)

## R1's two minors are closed

**R1 m1 (the `heard_exchange_*` markers persist only on a later sync) is documented.** The plan now
carries the explicit two-point reload note at `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`
section 5.4 Sync (the paragraph beginning "Two engine details mean a reload can replay a cosmetic
beat"), and the README states the same at `scenarios/test_needs_sims/README.md:147` ("the three
`heard_exchange_*` markers persist only on the next periodic or page-hide sync... the task stays
ticked"). Both cite "server review R1 m1/m2". No code change was expected and none was made. Closed.

**R1 m2 (the first-visit break re-arms after a reload) is documented.** The same plan 5.4 Sync
paragraph point (2) and `README.md:147` state that `firstVisit` is per-load because the engine clears
`discoveredRooms` on load, so the first staff-room entry after any reload re-arms the opening tea
break, and that it does not double-tick a task. Closed.

## What was checked and confirmed

**No server or engine code slipped in.** `git diff --stat main...HEAD -- app/ lib/` returns nothing,
so `merge_global_variables!`, the games controllers and every sync path are identical to main. The
branch's non-doc changes are all under `scenarios/`, `scripts/` (the V10 validator, SIMS-5),
`test/js/` and `tools/playtest/`; none is runtime server or engine code. The plan's "0 engine lines"
claim for SIMS-4 holds.

**Every global the pair touches is declared once and is not server-gated.** The staff-room globals
are declared false exactly once each in `globalVariables`: `job_called`
(`scenario.json.erb:61`), `job_cleared` (`:63`), `heard_exchange_waiting` (`:64`),
`heard_exchange_job_called` (`:65`), `heard_exchange_job_cleared` (`:66`). The flickering-light
choice gate `staff_room_seen` (`:62`, a SIMS-3 global set by an Amara `room_entered:staff_room`
`setGlobal` mapping at `:612`) is also declared and read by `neil.ink:18,70`. None of these is in
`SERVER_OWNED_GLOBAL_NAMES`, `imported_global_names`, `wearable_read_only_globals`,
`server_credit_global_names` or `REVOKED_CARDS_GLOBAL` (`game.rb:807-835`), so `merge_global_variables!`
stores a client-sent value for each. That is intended: the policy hard-enforces only secrets, keys and
forged items, and none of these globals carries an account, address, password or code.

**Forging the globals or the tasks stays within the cheat policy (6.2).** A crafted `/sync` can set
`job_called`, `job_cleared` or any `heard_` marker true, and a crafted `complete_task` POST can tick
the five tasks. Both are within policy: the globals gate only the three staff-room exchanges
(`requireGlobal` on Jodie's list, `scenario.json.erb:1194-1196`), `jodie.ink`'s cosmetic "Did that
light get sorted?" choice and the flickering-light lighting variant, and the five tasks complete only
the optional aim `watch_the_staff_room` ("Nothing to solve"). `complete_task` runs with
`trusted: false` (`games_controller.rb:1759`) and refuses any server-completed-only task; no
`unlockDoor`, `reward`, `revealOnGlobal` or `concludeRequires` reads any staff-room global (grep:
none). Forging a global does not emit the `npc_exchange_heard:*`, `npc_chatted:*` or `npc_used:*`
events the completion mappings need, so the real overheard beat is still the only non-forged route, as
R1 found.

**Synced `player_state` does not grow and is sent as deltas.** `globalVariables` and `triggeredEvents`
are keyed sync sections (`state-sync.js:31`, `KEYED_SECTIONS`), so only a changed key is sent and a
seed from saved state (`seedFromSaved`, `state-sync.js:160-180`) pre-loads the confirmed set so a
reload sends only what changed. The pair's globals are plain booleans set once each; the coupling and
break-start mappings carry only `needs.set` (`scenario.json.erb:1163-1164,1190-1191`), which is never
synced; the five `onceOnly` task mappings add five stable `triggeredEvents` keys, one each. Nothing
accumulates per line, per break or per crossing, matching the plan 6.5 sync table. R1's 49-game
measurement (5494 to 7104 bytes, no per-break growth) applies unchanged because the server code is
identical to that build.

**The lighting variant reads a syncable scenario global.** The `staff_room` variant condition
`globalVars.job_cleared === true` (`scenario.json.erb:1091`) reads `job_cleared`, a declared,
whitelisted, delta-synced scenario global, not an engine-only or never-synced value. The condition
itself is well-formed and reads from synced state. The one caveat is its persistence across a fast
reload, which is m1 below.

## Findings

### m1 (minor) - the R1 lighting variant reads `job_cleared`, which is set without forcing a sync, so a sub-30-second reload can re-flicker a cleared light; the docs' reload-replay note names only the heard markers and `firstVisit`
Files: `scenarios/test_needs_sims/scenario.json.erb:1091` (the `job_cleared` lighting variant) and
`:1196` (the `exchange_job_cleared` gate, which also reads `job_cleared`);
`public/break_escape/js/systems/global-writer.js:146-202` (`writeGlobal` updates `gameState` and emits
`global_variable_changed` but never calls `stateSync.sync()` or `requestSoon()`);
`public/break_escape/js/systems/objectives-manager.js:638-644` (`serverCompleteTaskWithRetry`
pre-flushes globals only when `scenarioGatesOnGlobals()` holds, which test_needs_sims does not);
`scenarios/test_needs_sims/README.md:147` and
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` section 5.4 Sync (the reload-replay enumeration).

`job_cleared` is set by `jodie.ink`'s "Did that light get sorted?" choice through
`#set_global:job_cleared:true`, routed to `writeGlobal` (`apply-actions.js:155`). `writeGlobal`
updates `gameState.globalVariables` and emits the change for listeners (the lighting system re-reads
and the light stops flickering at once, client-side), but it does not force a sync. No task is tied to
`job_cleared`, so nothing co-fires a synced write, and the one conditional pre-flush in
`serverCompleteTaskWithRetry` does not run for this scenario (it has no `concludeRequires.globals`).
`job_cleared` therefore persists only on the 30-second periodic sync or the page-hide flush, exactly
the behaviour R1 m1 recorded for the three `heard_exchange_*` markers. A reload within about 30 seconds
of clearing the job, with no page-hide flush (a hard crash, a tab kill, or the harness's programmatic
reload), loses `job_cleared`: the saved state restores it false, the lighting variant evaluates false,
and the faulty panel flickers again as if the tube were never swapped. The `exchange_job_cleared` gate
reopens the same way, which R1 already flagged as the most exposed gate.

Impact is cosmetic and bounded, so this is a minor, not a blocker: the re-flicker and the reopened
gate both resolve the moment the player speaks to Jodie again (the choice is re-offered) or the next
periodic sync carries a `job_cleared` that did survive. Empirically R1's lighting proof (game 4480)
let the global settle before the reload, so the light held steady. The gap is a documentation one: the
reload-replay note at `README.md:147` and plan 5.4 Sync says "Two cosmetic beats can replay" and names
the three `heard_exchange_*` markers and `firstVisit`, but the lighting variant was added in the same
R1 fix round and rides on `job_cleared`, which shares the no-forced-sync write path. So there is a
third cosmetic case the enumeration omits. Suggested fix (docs only, no code change for this slice):
extend the `README.md:147` and plan 5.4 Sync note to say that `job_called` and `job_cleared` set
through ink `set_global` also persist only on the next periodic or page-hide sync (ink `set_global`
goes through `writeGlobal`, which does not force a sync), so a sub-30-second no-page-hide reload can
re-flicker the cleared light and reopen the `job_cleared` exchange gate; neither double-ticks a task.
A mission wanting the light or the gate to survive a fast reload should drive `job_cleared` through an
eventMapping that also completes a task (or otherwise triggers a delta sync), as the plan already
advises for marker persistence.

## Notes

- `jodie.ink`'s `job_cleared` choice now carries both `#set_global:job_cleared:true` and the running
  `~ job_cleared = true` assignment (R1 m1 fix), so the choice drops from the open chat at once. That
  is correct and is not the subject of m1; m1 is about cross-reload persistence of the stored value,
  not the in-chat story.
- `staff_room_seen` (`scenario.json.erb:62,612`) is a SIMS-3 global, set client-side by a non-`onceOnly`
  `setGlobal` with no sync by design (its mapping comment states this). It only gates whether
  `neil.ink` offers the flickering-light choice, carries no secret, and completes no task, so it is
  within policy; it is noted here only because the pair's `job_called` path depends on it.
- The coupling, break-start and `room_entered:manager_office` (`fireOnlyWhenLoaded: true`, R1 m5)
  mappings write only `needs.set`, which is never synced and reaches no server state.
- Read-only throughout: no live server, no game-state write, no SecGen or exploit material opened
  (none was needed).

## Severity table

| ID | Severity | Title | Code change |
|---|---|---|---|
| m1 | minor | Lighting variant reads `job_cleared`, set without a forced sync; reload-replay note omits this third cosmetic case | No (docs only) |
