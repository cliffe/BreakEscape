# Adversarial review R9: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` at worktree HEAD
`ac203e573` ("Gated-door plan: fold R8 ...; R8 outcomes"), R1-R8 with their Outcomes, then opened the
load-bearing client and server code independently. This is the last review round before building; the
focus is the owner's standing requirement for the `enter_room` part (§8, Chunk F): tested for network
delays and offline/reconnect, proven in a browser under real network conditions, and a legitimate
player never refused or left with a stranded task.

Counts: **0 blockers, 0 majors, 2 minors.**

## 1. R8's closures confirmed in the code at `ac203e573`

Every pin the brief names holds, re-checked fresh rather than taken on faith:

- **Offline queue feed, transient branch.** `serverCompleteTask` turns a `fetch` reject into
  `{ success:false, transient:true }` (`objectives-manager.js:1149`) and a 5xx into the same shape
  (`:1140-1142`); a plain offline drop does not throw. `serverCompleteTaskWithRetry` loops four times
  over ~2.25s (150/300/600/1200 ms; `:607-625`, delays at `:619-621`, early return on
  `!last.transient` at `:619`) and returns the transient object. Back in `completeTask`, that lands in
  the `!response.success` branch (`:687-694`), which reverts to active at `:689`. Plan §8.3 (lines
  629-637) and §14 (`:687-694`, line 1121) now cite `:689`/`:687-694` as the dominant offline path, and
  the thrown-error catch (`:719-731`, revert at `:725`) as the second feed. The R8 major-1 mis-citation
  (`:725` as the exhausted-retry revert) is gone (grep of the plan: `:725` now appears only against the
  catch, lines 634/678).
- **Drain re-runs `completeTask`, re-entry guarded, on `online` and after awaited syncs.** Plan §8.3
  (lines 656-670) and Chunk F (lines 1122-1125) have the drain fire from a `window 'online'` listener
  and from the syncs `ObjectivesManager` awaits, through a re-entry-guarded `drainEnterRoomQueue()` that
  removes the entry then re-runs `this.completeTask(taskId)`. `state-sync.js` `sync()` (`:597-605`)
  resolves to a boolean via `_syncOnce` (`:618-671`) and fires no event/callback, so the R8 minor-2
  decision to add no sync-success hook and drain from `online` + own awaited syncs is faithful to the
  code. `conclude-mission.js:156` is a real `window 'online'` precedent (listener `:157`,
  `removeEventListener` `:131`).
- **Any not-transient outcome drops the entry.** Plan lines 665-670: only a fresh transient or thrown
  failure re-adds the id, so a drained entry returning success or any refusal (including a
  `room_not_reachable` retryable, owned by the inline one-sync-one-repost path) is dropped and cannot
  retry forever. This is the corrected R8-minor-1 bound; the earlier "retryable absent" wording is
  gone.
- **Drained mission-concluding completion gets the ending handling.** Because the drain re-runs
  `this.completeTask`, the full path at `:662-718` applies: the `endingCheck` confirm (`:662-676`), the
  `missionConcluded` end-screen trigger (`:697-700`, `handleMissionConcluded`) and the conclude-race
  `warning` re-flush (`:701-718`). Node test added (plan lines 1009-1013). Confirmed in code that these
  all live inside `completeTask`, so a bare `serverCompleteTask` would have bypassed them.
- **Init replay idempotent, after tasks loaded.** `initialize` builds `taskIndex` (`:90-97`) and
  restores saved statuses (`restoreState()`, `:103`) before setting `this.initialized = true` (`:110`),
  so a replay placed after `:110` runs with tasks loaded and cannot fire before them. `handleRoomEntered`
  (`:550`) guards on `this.initialized` (`:551`) and only completes an active `enter_room` task for that
  room (`:553-558`); `completeTask` sets `status='completing'` synchronously at `:680` before its first
  `await` (`:686`) and early-returns for a `completed`/`completing` task (`:657`). So the init replay and
  the first `updatePlayerRoom` tick's own `room_entered` emit (`rooms.js:3178` guard, emit `:3200`;
  `currentPlayerRoom`/`window.currentPlayerRoom` reset to `''` at `rooms.js:103`/`:1038`) can both call
  `handleRoomEntered` in either order and produce exactly one effective completion, never a
  double-complete. Server completion is idempotent (`complete_task!` already-completed branch, `:3682`),
  so even a duplicate POST is a no-op.

## 2. Interactions checked; nothing refuses or strands an honest player, nothing forges through

- **Drain x inline retryable.** The `enter_room` forge and the honest residual race both return
  `{ success:false, error:'Room not reached', retryable:true }` inline (not transient), so neither
  enters the queue; the inline one-sync-one-repost owns them, a forge is refused on every re-post, an
  honest gap self-heals once the durable `unlockedRooms`/`npcRouteRooms` membership is visible. The
  queue is transient/thrown-fed only. No forge reaches the queue; no double-credit (idempotent
  completion, keyed-by-id queue dropped on success).
- **Init replay x reload-while-offline.** On a reload offline, the init replay fires `completeTask`,
  which exhausts to a transient return and enqueues from `:687-694`; `online` then drains it. This is
  strictly better than the plan's stated floor ("next crossing"), and consistent with it.
- **Route-room promotion x enter_room on a route room.** `player_reached_room?` includes
  `npcRouteRooms`, written by the gate NPC's `method: npc` route POST before the avatar can pass
  (client gate opens only once the NPC holds the door). A tight race is caught by the retryable re-post
  and, failing that, the next-crossing floor. Sound.
- **Object-unlock retry (§3.6) x promotion.** `notifyServerUnlock` (`unlock-system.js:22-45`) is still
  a swallow in its catch; it is the single unlock funnel; the §3.6 server gate renders
  `reason: room_not_reachable` only in the object branch (`target_type != 'door'`), so the reason-keyed
  retry structurally never fires for a door; `ApiClient.post` sets `err.status`/`err.body`
  (`api-client.js`), so a 403 body reaches `error.body`. The retry is bounded one-sync-one-repost. An
  offline object unlock throws a bodyless network error and is unchanged (not retried, not queued), which
  is consistent because viaPass promotion cannot land offline anyway.
- **SYNC SIZE, cheat policy, load-bearing oddities.** `npcRouteRooms`/`serverCreditGlobals`/
  `serverCompletedOnly` are server-written derived lists absent from the client payload; the queue is a
  memory-only field; the pre-flush sends `buildChanges()` deltas only; credit globals replace existing
  keys. `merge_global_variables!` read-only union (`game.rb:332-340`) and the frozen
  `SERVER_OWNED_GLOBAL_NAMES` (`:1798`) are as the plan describes, so making the credit globals
  read-only via the local `read_only` list (not the frozen constant) is correct. The never-firing
  `unlockDoor` permission mapping is kept; the client credit writers move to `tmp/delete/`. All sound.

## Minors

### minor 1. A transient result on the inline retryable re-post is unspecified; the literal rule would surface a hard refusal on a network blip
Plan §8.3 (lines 608-616): on a `room_not_reachable` retryable refusal the client "re-posts the
completion once; only a re-post that is still refused surfaces to the player." A transient re-post
result (`{ success:false, transient:true }`, the network dropping during that single re-post) is
`success:false`, so by the literal "still refused -> surface" rule the honest player sees the hard
"Room not reached" alert, and the completion is not routed into the offline queue; it then relies on the
next-crossing floor. This is a narrow double-fault (retryable race, then an offline blip in the same
sub-second window, with the player online enough to have posted at all), the floor holds, and no forge
is laundered, so it is a minor, not a major. **Suggested fix:** one line in §8.3 and Chunk F: a
transient re-post in the inline retryable path is handled as the transient path (revert to active and
enqueue), and only a genuine non-transient refusal surfaces. This keeps the "never left with a stranded
task" guarantee tight even under the double-fault.

### minor 2. The drain-trigger citation "pre-flush at `:613-615`" is the conclude-race pre-flush, which does not run for a pure `enter_room` scenario
Plan §8.3 (lines 658-660) lists the syncs `ObjectivesManager` awaits as drain triggers: "the
conclude-race pre-flush at `:613-615` and the inline retryable re-sync." The `:614` pre-flush inside
`serverCompleteTaskWithRetry` is gated on `scenarioGatesOnGlobals()` (`:607-614`), so for a scenario
with `enter_room` tasks but no `concludeRequires.globals` gate (`test_gate_tailgate` is the fixture
here) that sync never fires and is not a drain trigger. The new `enter_room` pre-flush Chunk F adds
(§8.3 lines 597-605, "scoped to the enter_room completion path") is the relevant awaited sync, and the
`online` listener is the load-bearing reconnect drain regardless, so no offline/reconnect case is
actually missed. **Suggested fix:** in the drain-trigger list name the new `enter_room` pre-flush (not
the conclude-race `:614` line, which is conditional), or simply state that the `online` listener is the
reconnect drain and the awaited-sync drains are opportunistic. Wording only; the design is correct.

## Load-bearing pins (fresh check at `ac203e573`)

Hold exactly: `objectives-manager.js` `:657` early-return, `:680` synchronous `completing`, `:686`
`serverCompleteTaskWithRetry`, `:687-694` transient branch (revert `:689`), `:697-700`
`missionConcluded`/`handleMissionConcluded`, `:701-718` warning re-flush, `:719-731` catch (revert
`:725`), `:1140-1142`/`:1149` transient return shapes, `:607-625` retry loop (pre-flush `:613-614`
gated on `scenarioGatesOnGlobals`), `:90-110` initialize/taskIndex/initialized, `:103` restoreState,
`:353` `room_entered` subscription, `:550-558` `handleRoomEntered` (init guard `:551`), `flushPendingGlobals`
double-sync (`:586-588`). `state-sync.js` `sync()` `:597-605` resolves boolean, no event. `rooms.js:103`
`currentPlayerRoom=''`, `:1038` reset, `:3178` emit guard, `:3200` emit. `unlock-system.js:22-45`
`notifyServerUnlock` (catch still a swallow), single unlock funnel. `conclude-mission.js` `window 'online'`
precedent (`:131` remove, `:157` add). Server: `game.rb:3745` still the bare "Trust the client"
`enter_room` comment (the §8 change is real and unbuilt); `complete_task!(task_id, validation_data = {})`
`:3675` (so the §7 `trusted:` keyword is a real signature change) with the already-completed idempotent
branch `:3682`; `merge_global_variables!` read-only union `:332-340`; `SERVER_OWNED_GLOBAL_NAMES`
`:1798`; `stored_scenario_data` single-source `:797-806`. Controller: `merge_last_write_wins_sections`
`currentRoom` guard `:2098-2107` (today `unlockedRooms`/`startRoom` only, §3.3a extends to
`npcRouteRooms`); `unlock` action object branch and feedback helpers `:1103-1168`.

## Verdict

**Ready to build.** R8's major is correctly folded (the offline queue feeds from the transient branch
`:687-694` keyed on `response.transient === true` and from the thrown-error catch `:719-731`, with the
`:725` mis-citation removed), all four R8 minors are reflected faithfully in the code and the plan, and
the owner's `enter_room` requirement is met by design: every target enters a durable list
(`unlockedRooms` or `npcRouteRooms`) before the completion POST, the check reads that durable state,
both client retries are bounded, the queue is memory-only and keyed by task id, the drain re-runs the
full `completeTask` path (so a mission-ending completion still fires the end screen), and the init
replay closes the reload-in-room gap idempotently. The two minors are precision/wording in §8.3 and
Chunk F; neither changes the design and both are safe to fold during the Chunk F build. No blocker and
no major remains.
