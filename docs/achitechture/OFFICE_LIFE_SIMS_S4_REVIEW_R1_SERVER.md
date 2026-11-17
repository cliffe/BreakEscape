# SIMS-4 review, round 1: server, sync and cheat resistance

Slice: the staff-room pair (Keith Dando and Jodie Kerr) off IT's east door, their coupled breaks,
the gated exchanges and the new globals `job_called`, `job_cleared` and the three
`heard_exchange_*` markers. Branch `build/ol-sims`, tip `5118f584d` (the merge of SIMS-4,
`build/ol-sims-2` tip `80d0318a5`, into SIMS-1..3). SIMS-4 ships **0 engine and 0 server lines**
(build log SIMS-4), so every check is the existing server and engine against the new scenario and
ink data, plus the merge resolution.

Read-only evidence: saved state of the builder's games 4340-4428 via `rails runner` (script
`officelife-sims/s4-review-r1-server/dump_states.rb`, `te.rb` in the session scratchpad); the server
globals merge at `app/models/break_escape/game.rb:801` (`merge_global_variables!`); the sync delta
boundary at `public/break_escape/js/state-sync.js:31,81,163-173`; the shared global writer
`public/break_escape/js/systems/global-writer.js`; the engine exchange-heard path
`public/break_escape/js/systems/npc-needs.js:2767-2768,2850-2865`; the `set_global` ink action
`public/break_escape/js/systems/apply-actions.js:148-158`; room first-visit detection
`public/break_escape/js/core/rooms.js:1044,3194-3216`. No live server was started; no game state was
written.

## Verdict

Counts: 0 blockers, 0 major, 2 minor.

- Blockers: 0
- Majors: 0
- Minors: 2 (m1: the three `heard_exchange_*` markers are engine-set without forcing a sync, so the
  plan/README "a reload replays no beat" is strictly true only once a periodic or page-hide sync has
  carried the marker; a sub-30-second reload with no page-hide can replay a cosmetic exchange;
  m2: the first-visit break re-arms after any reload because `discoveredRooms` resets on load, so the
  opening tea break can fire again on the first post-reload entry)

## What was checked and confirmed

**The new globals reach the server and survive save.** `job_called`, `job_cleared` and the three
`heard_exchange_*` markers are declared once each in `globalVariables`
(`scenario.json.erb:60-64`), with no duplicate; `neil.ink` and `jodie.ink` each declare only the
VARs they read. `job_called` is set by `neil.ink`'s flickering-light choice through
`#set_global:job_called:true` and `job_cleared` by `jodie.ink`'s "Did that light get sorted?" choice
through `#set_global:job_cleared:true`, both routed through `writeGlobal` (`apply-actions.js:155`).
The `heard_exchange_*` markers are written by the engine on a heard exchange
(`npc-needs.js:2860-2861`, `this.world.setGlobal('heard_' + knot, true)` through the chatter
adapter's `writeGlobal`, `npc-needs-chatter.js:191`). Empirically the markers persist in saved
state: `heard_exchange_waiting=true` in 4345 and 36 further games; `job_called=true` with
`heard_exchange_job_called=true` in the five job-beat games 4376-4383 and the step-1 beat 4346. The
`job_cleared`/`exchange_job_cleared`/`heard_exchange_job_cleared` path is never set in any of the 49
games (the player was always in earshot, so the E9 case was not reached; build log SIMS-4), so it is
confirmed only by reading, not by saved state.

**The two-key gate is read correctly.** `exchange_job_cleared`'s
`requireGlobal { job_cleared: true, heard_exchange_job_called: true }` (`scenario.json.erb:1191`) is
evaluated through `_globalHolds` -> `world.globalHolds` -> `requiredGlobalsHold`
(`npc-needs.js:270-274`), whose object branch requires every key to match, so a single held key does
not open the gate. `exchange_waiting` is ungated and `exchange_job_called` holds on `job_called`
alone (`scenario.json.erb:1190,1192`), as intended. Jodie's id sorts first, so her list is read
first (`_findExchange`), and the gated knots sit ahead of the ungated `exchange_waiting`.

**`player_state` does not grow with play.** Across the 49 staff-room games 4340-4428 the serialized
`player_state` is 5494 to 7104 bytes (mean 6312). The larger figures are the office-plus-staff-room
crossing runs (more `onceOnly` office mappings fired), not per-break growth. `triggeredEvents`
holds 1 to 16 keys, every one an `onceOnly`-mapping key of the stable form
`<npcId>:<eventPattern>:<objectId>:<mappingIndex>` (for the pair:
`jodie:npc_chatted:staff_boiler:2`, `keith:npc_chatted:staff_cooler:3`,
`jodie:npc_exchange_heard:exchange_waiting:3`, `jodie:npc_exchange_heard:exchange_job_called:4`,
`keith:npc_used:staff_microwave:4`). Each fires once; nothing accumulates per line, per break or per
crossing. The pair's couplings and break-start mappings (`scenario.json.erb:1159-1161,1196-1197`)
are not `onceOnly`, carry only `needs.set`, and write nothing to `player_state`, matching the plan's
sync table (6.5: `job_called`/`job_cleared` once each, three `heard_` booleans once each, five
`triggeredEvents` keys for the tasks).

**The globals are not server-gated: forging them ticks optional tasks only, within policy (6.2).**
`merge_global_variables!` (`game.rb:801`) merges any client-sent global that is not server-owned
(`se_captures`), read-only (imported, wearable, `server_credit`) or the grow-only `revoked_card_ids`.
None of the SIMS-4 globals is on those lists, so a crafted `/sync` can set them true. That is within
the cheat policy: `job_called`, `job_cleared` and the `heard_` markers gate only the staff-room
exchanges (`requireGlobal` on Jodie's list) and `jodie.ink`'s cosmetic "Did that light get sorted?"
choice, and complete only the optional aim `watch_the_staff_room` ("Nothing to solve",
`scenario.json.erb:163-165`). No `unlockDoor`, `reward`, `revealOnGlobal` or `concludeRequires`
reads any of them (grep: none). Forging a global does not emit the `npc_exchange_heard:*` or
`npc_chatted:*` events the completion mappings need, so the five tasks still require the real
overheard beat; they can be forged only the way any optional task can, which the policy accepts.
No `heard_` marker, exchange knot or job board carries an account, address, password or code.

**The `neil.ink` merge unions both sides, nothing lost.** Against the SIMS-3 parent `98ddacd14` the
merge adds only the `job_called` VAR and the flickering-light choice; against the SIMS-4 parent
`80d0318a5` it adds the SIMS-3 `neil_page_on_tray` mirror, the branched "ready" line and the
`exit_conversation -> END` rework, and keeps the `job_called` choice. The `globalVariables` block at
the tip is the exact set-union of both parents: no key present in either parent is missing, and no
key is present that neither parent had. `neil.json` is recompiled (it carries `job_called`,
`neil_page_on_tray` and `neil_print_asked`). The flickering-light choice is `onceOnly` by its
`{ not job_called }` guard and the `job_called` ask line matches the pair's exchange.

## Findings

### m1 (minor) - the three `heard_exchange_*` markers are set without a forced sync, so the "reload replays no beat" guarantee holds only after a periodic or page-hide sync
Files: `public/break_escape/js/systems/npc-needs.js:2860-2861` (and `:2767-2768`, `_exchangeHeard`);
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` section 5.4 Sync ("a reload restores them and
replays no beat") and 6.5 ("a reload seeds the sync's confirmed state ... and replays no beat").

`_finishExchange` writes `heard_<knot>` through the chatter adapter's `writeGlobal`, which updates
`gameState.globalVariables` and emits `global_variable_changed`, but does not call
`stateSync.sync()` or `requestSoon()`. There is no per-event forced sync for these markers: the
completion mappings (`npc_exchange_heard:exchange_waiting`/`...job_called`,
`scenario.json.erb:1199-1200`) complete a task, but `serverCompleteTaskWithRetry` pre-flushes
globals only when the scenario gates a conclusion on a global (`objectives-manager.js:641-642`), and
test_needs_sims does not. So all three markers persist only on the 30-second periodic sync or the
page-hide flush (`state-sync.js:417,456`). `_exchangeHeard` (`:2767-2768`) reads
`heard_<knot>` as the sole cross-reload "already played" marker (the session `_exPlayed` set is
empty after a load), so if a marker has not yet synced when the game reloads without a page-hide
flush (a hard crash, a tab kill, or the test harness's programmatic reload), the engine replays that
exchange on the next meeting. `exchange_job_cleared` is the most exposed: it has no completion task,
no co-firing synced write and no other reader, so nothing shortens its window.

Impact is cosmetic and bounded, so this is a minor, not a blocker: the replayed exchange is three to
five optional lines, and the task does not re-tick because its `onceOnly` `triggeredEvents` key
persists (confirmed: the task keys are saved while a marker could be dropped). This is the same
engine behaviour SIMS-3 R1/R2 m1 raised for the print-reveal globals (a global set without
`_worldChanged`/a forced sync is persisted only by a later sync, so reload is nondeterministic); it
now also covers the three `heard_exchange_*` markers. Empirically harmless here (every proof game
lingered long enough for a sync, so the markers saved true). Suggested fix: reconcile the plan 5.4
Sync and 6.5 wording to say the `heard_` markers persist on the next periodic or page-hide sync, not
by the exchange itself, so a sub-30-second reload with no page-hide can replay a cosmetic exchange
(the task does not re-tick); and, as in the SIMS-3 owner item, note that a mission wanting a
reliably transient-or-persistent beat marker should drive it through an eventMapping `setGlobal`
(which calls `_worldChanged`) rather than the engine exchange-heard write. No code change is needed
for this slice.

### m2 (minor) - the first-visit break re-arms after a reload, so the opening tea break can fire again on the first post-reload staff-room entry
Files: `public/break_escape/js/core/rooms.js:1044` (`discoveredRooms = new Set()` on scenario load)
and `:3194-3216` (`isFirstVisit = !discoveredRooms.has(detectedRoom)`);
`scenarios/test_needs_sims/scenario.json.erb:1160` (Keith's `room_entered:staff_room`,
`firstVisit === true`, no `onceOnly`); `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` 5.4 Sync
("replays no beat").

`discoveredRooms` is reset to an empty set on every scenario load (`rooms.js:1044`) and is not
seeded from the saved `unlockedRooms`, so after a reload the first physical entry into `staff_room`
emits `room_entered` with `firstVisit: true` again. Keith's first-visit mapping is not `onceOnly`
and relies on that condition alone, so it re-fires on the first post-reload entry and sets his
caffeine to 20, which starts the opening tea break a second time. The mapping writes only a
`needs.set` (not synced, no `triggeredEvents` key, no task), and the opening exchange does not replay
because `heard_exchange_waiting` persists and the `hear_waiting` task key persists, so no beat or
task double-ticks.

Impact is cosmetic: for the showcase the re-armed opening break looks the same as a fresh start, so
this is a minor. It is worth recording because the plan's "replays no beat" does not mention that
`firstVisit` is per-load, not per-game, so a mission that copies the first-visit break-start pattern
will see it re-fire on every reload. Suggested fix: note in the plan/README that the first-visit
start is per-load (reset with `discoveredRooms`), so a reload re-arms it; no code change is needed
for this slice (the re-fire is harmless and the heard markers already guard the beat).

## Notes

- `jodie.ink`'s "Did that light get sorted?" choice sets `job_cleared` only through the
  `#set_global:job_cleared:true` tag and, unlike `neil.ink`'s `job_called` choice, does not also
  assign `~ job_cleared = true` in story. This is functionally correct: `writeGlobal` writes the
  open chat's own story detached when it declares the name (`global-writer.js`, step 3), so the
  `{ job_called && not job_cleared }` guard re-evaluates false on the next Continue and the choice
  disappears. The asymmetry with `neil.ink` is cosmetic; no change is required. (This is a dialogue
  review's call, not a server one; recorded here only because it touches the global write.)
- The `room_entered:manager_office` break start on Jodie (`scenario.json.erb:1197`) is a cross-room
  mapping that fires client-side when the player enters the private office; it sets Jodie's thirst
  (not synced) and carries no server or sync consequence. The validator's note on it is expected
  (build log SIMS-4).
- Read-only throughout: no live server, no game-state write. The 49 staff-room saves 4340-4428 were
  read, not modified.
