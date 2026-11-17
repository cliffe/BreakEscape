# Adversarial review R8: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` at worktree HEAD
`7974a57bf` ("Gated-door plan: object-unlock client retry, bounded offline enter_room queue, test 11
split; R7 outcomes"), R1-R7 with their Outcomes, then opened the load-bearing client and server code
independently. `git show --stat 7974a57bf` confirms that commit changed only the plan and the R7
review file, so every code pin R7 verified at `2cfe76bd1` is unchanged at this tree; I re-checked the
ones this round turns on rather than taking them on faith.

The hardest look went to the owner's standing requirement for the `enter_room` part (§8, Chunk F):
tested for network delays and offline/reconnect, proven in a browser under real network conditions,
and a legitimate player never refused or left with a stranded task. That means the three R7 closures
on the client side: the object-unlock retry in `unlock-system.js`, the in-memory `enter_room`
completion queue in `objectives-manager.js`, and the reload-while-offline re-fire.

Counts: **0 blockers, 1 major, 4 minors.**

## 1. Confirming R7's three closures in the code

### 1a. Object-unlock retry in `unlock-system.js` (R7 major 1)
`notifyServerUnlock` is `unlock-system.js:22-45`; its catch is `:39-41` and today it only
`console.error`s and falls through to `return serverResponse` (undefined). So the hook the plan adds
the retry to is exactly where the plan says it is, and it is currently a swallow. The refusal body
reaches `error.body`: `ApiClient.post` throws on a non-ok response with `err.status = response.status`
and `err.body = error` (`api-client.js:47-57`, the assignments at `:55-56`), and `unlock` routes
through `post`. So the plan's "catch recognises a `room_not_reachable` retryable `error.body`" is
built on a real, current shape.

`notifyServerUnlock` is the single funnel for every unlock method: `handleUnlock` posts
`method: 'unlocked'` through it at `:722`/`:743`, and the key/pin/password/lockpick/biometric/
bluetooth/ble/rfid paths all call it (`:835, :871, :1000, :1010, :1050, :1087, :1189`). So a retry
placed in its catch covers every object-unlock method with one edit, which is correct. "Never for a
door" is satisfied structurally: the §3.6 server gate renders `reason: room_not_reachable` only in the
object branch (`target_type != 'door'`), so a door unlock can never carry that body, and a
reason-keyed retry therefore never fires for a door. The re-post is faithful: `notifyServerUnlock`
always calls `apiClient.unlock(type, targetId, null, method)` with no extra payload, so re-posting the
same arguments after the sync is safe, and an rfid object re-post sends no `card_ids` (the server
reads possession from its own state). The sync the retry awaits flushes the pending `currentRoom`
(the honest hi-vis player is standing in the room but the promoting sync had not landed), the server
promotes via viaPass, and the re-post then clears the gate. Closure confirmed; the hook, the funnel
and the door-safety are all real.

### 1b. In-memory `enter_room` completion queue in `objectives-manager.js`
Confirmed the queue would be memory-only and bounded as described: it is a field on
`ObjectivesManager`, never in `player_state`, so it is not in any sync payload (SYNC SIZE RULE holds),
and keying by task id caps it at one entry per `enter_room` task. No `'online'` listener or completion
queue exists in the engine yet (grep), so this is genuinely new Chunk F work, not a claim about
existing code. A proven sibling pattern exists: `conclude-mission.js:156` already uses
`window.addEventListener('online', ...)` with a matching `removeEventListener` at `:131`, so the
reconnect mechanism is feasible and has precedent.

The two failure points and their return shapes (brief's explicit ask):
- **Exhausted transient retry.** `serverCompleteTask` turns a `fetch` network failure into
  `{ success:false, transient:true, error }` (`:1149`) and a 5xx into the same shape (`:1140-1142`),
  so a plain offline drop does **not** throw. `serverCompleteTaskWithRetry` loops four times
  (~150+300+600+1200ms) and returns that transient object (`:607-625`). Back in `completeTask`,
  `!response.success` is the `:687-694` branch, which reverts the task to active at **`:689`** and
  alerts. This is the dominant offline path.
- **Thrown-error catch.** The `catch` at `:719-731` reverts at `:725`. It fires only if something in
  the `try` throws (not a plain network drop, which is already captured as a transient return).

See major 1: the plan attributes the exhausted-retry revert to `:725`, but that path reverts at
`:689`; getting a builder to enqueue at the right branch matters for the owner's offline requirement.
Everything else about the queue (drop on success, drop on a genuine non-retryable refusal, no
double-credit via `complete_task!`'s already-completed branch) is sound.

### 1c. Reload-while-offline re-fire (the brief's "does it fire for a room already stood in")
Answer: **yes, it fires for a room the player is already standing in after a reload, not only on a
crossing** — with one init-ordering caveat. `currentPlayerRoom` is a module-level `''`
(`rooms.js:103`, reset again at `:1038`), so a reload starts it empty. `updatePlayerRoom`
(`rooms.js:3147`) emits `room_entered` whenever the detected room differs from `currentPlayerRoom`
(the early-return guard at `:3178-3180`), so the first tick after reload sees `'' -> <roomId>` and
emits `room_entered` for the room the avatar already occupies (`:3198-3204`). `objectives-manager.js`
subscribes at `:353` and calls `handleRoomEntered` (`:550`), which re-completes an active
`enter_room` task for that room (`:558`). So the self-heal does not require a physical boundary
crossing.

Caveat: `handleRoomEntered` returns early when `!this.initialized` (`:551`). If that first
post-reload `updatePlayerRoom` tick runs before `ObjectivesManager` finishes initialising, the single
auto-emit is dropped, and because `currentPlayerRoom` is then set to the room, no further emit occurs
until the avatar actually leaves and re-enters. So the plan's conservative wording ("when the player
next crosses into the room") is the guaranteed-safe statement, and the standing-in-the-room auto-fire
is a best-effort bonus that lands whenever init precedes the first tick. Either way the player is
never permanently stranded, and the completion reads durable `unlockedRooms`. The plan understates
the self-heal, which is the safe direction. See minor 4.

## 2. Double-credit, spin, refusal leak, forged completion; conclude-race and ending interaction

- **Double-credit: no.** Server completion is idempotent (`complete_task!` already-completed branch),
  the queue is keyed by task id and dropped on success, and the §3.6 object re-post reads
  `unlockedObjects` membership (test 11c). Nothing credits twice.
- **Spin: no.** Both client retries are capped at one re-sync plus one re-post, then surface. The
  offline queue drains on discrete events (`online`, a successful sync), holds one entry per task id,
  and `serverCompleteTaskWithRetry` returns a `retryable`/non-transient refusal at once
  (`:619`, `!last.transient`) rather than entering the backoff loop. No tight loop anywhere.
- **Refusal leaked to an honest player: once, accepted.** An honest offline player sees one
  "Could not save... keep playing" alert (`:728`) before the queue re-posts on reconnect; within the
  accepted low-stakes `enter_room` behaviour. The object-unlock retry and the retryable re-post spare
  the honest player a hard refusal in the viaPass window.
- **Forged completion through: no.** The queue is fed only by transient/network failures; a forge's
  `enter_room` refusal is `{ success:false, error:'Room not reached', retryable:true }` returned
  inline (§8.2), handled by the one-sync-one-repost path, and refused on every re-post because the
  room never becomes durable. A forge never enters the queue. But see minor 1 on the drop-condition
  wording.
- **Queue vs conclude-race and mission ending: a gap (minor 3).** The conclude-race pre-flush and the
  `missionConcluded`/`warning`/`endingCheck` handling live in `completeTask` (`:662-718`). A drained
  queue entry re-posted as a bare `serverCompleteTask` bypasses all of that, so a queued `enter_room`
  task that happens to conclude a mission could re-post successfully on reconnect without triggering
  the end screen.

## Major

### major 1. The offline-queue feed point is mis-cited; a builder could wire it into the wrong branch and miss the dominant offline path
Plan §8.3 ("A longer failure, the network drops or `serverCompleteTaskWithRetry` exhausts its roughly
2.25s transient backoff (`objectives-manager.js:607-625`), reverts the task to active
(`objectives-manager.js:725`)") and §14 Chunk F ("fed by the transient/network failure paths
(`objectives-manager.js:719-731` and the exhausted `serverCompleteTaskWithRetry`)");
`objectives-manager.js:687-694` (the `!response.success` transient branch, revert at `:689`), `:719-731`
(the thrown-error catch, revert at `:725`), `:1140-1149` (`serverCompleteTask` return shapes).

A plain offline drop does not throw: `serverCompleteTask` catches the `fetch` rejection and returns
`{ success:false, transient:true }` (`:1149`), so after `serverCompleteTaskWithRetry` exhausts, the
flow lands in the `:687-694` branch and reverts at **`:689`**, not in the `:719` catch. The plan's
narrative attributes the exhausted-retry revert to `:725` (the catch). A builder who follows that line
and hooks the enqueue only into the `:719` catch would enqueue almost nothing on a real offline gap,
because the offline path is the transient return at `:687`. The owner's requirement that the
`enter_room` part is "tested for offline/reconnect" and that "a legitimate player is never ... left
with a stranded task" then fails in exactly the case it is meant to cover (live-proof Case 3). The
sentence does also name "the exhausted `serverCompleteTaskWithRetry`" as a feed, so a careful builder
recovers the right branch, but the line citation points the other way.

**Suggested fix:** correct the citation. State that the enqueue sits in the `:687-694` branch, keyed on
`response.transient === true` (the exhausted-retry/offline path), and additionally in the `:719` catch
for a thrown error; and that a genuine non-retryable refusal (`!transient && !retryable`) reverts and
alerts as today without enqueuing. Make the live-proof Case 3 assert the task actually entered the
queue from the transient path.

## Minors

### minor 1. "A true forge, retryable absent" mis-describes the `enter_room` forge, which is `retryable: true`
Plan §8.3 ("dropped on a successful completion or on a non-retryable refusal (a true forge, `retryable`
absent)"), §8.2 (the forge refusal is `{ success:false, error:'Room not reached', retryable:true }`).

The `enter_room` forge refusal carries `retryable: true`, so "a true forge has `retryable` absent" is
not accurate. In practice a forge never enters the queue (the queue is transient-fed, and the forge's
refusal is returned inline), so there is no live double-credit or forge-through. But a builder who
implements "drop only when `retryable` is absent" leaves open the case where a drained honest entry
re-posts and the server, on that instant, still answers `room_not_reachable` retryable (a durable
write not yet visible): by that literal rule the entry is kept and re-tried on every subsequent sync,
which contradicts "it never retries forever". **Suggested fix:** define the drop condition as "drop on
success, and on any refusal that is not `transient`" (so a `room_not_reachable` draining entry is
dropped, because that race is owned by the inline one-sync-one-repost path, not the queue), or cap
drain attempts per entry. Either removes the only path to an unbounded (if slow) drain.

### minor 2. "Drained on the next successful sync" needs a success hook that does not exist
Plan §8.3 ("the next successful `window.stateSync.sync()` also drains it"), §14 Chunk F;
`state-sync.js:597-676` (`sync()` resolves to a boolean behind an `{ ok, error }` run, and emits no
success event).

`sync()` returns a boolean promise but fires no event or callback on success, and `ObjectivesManager`
has no sync-success subscription (it only awaits its own `window.stateSync.sync()` calls at `:589-590,
:614, :805`). So "the next successful sync drains the queue" has no passive mechanism today: a timer
sync (`state-sync.js:328`) or a sync triggered elsewhere would not drain the queue. **Suggested fix:**
name this as new work, either a success event/callback on `state-sync` that the queue subscribes to,
or scope the drain to the `online` listener plus the syncs `ObjectivesManager` itself awaits (the
pre-flush and the retryable re-sync), and drop the "next successful sync" phrasing if no hook is
added. The `online` listener alone already covers the reconnect requirement.

### minor 3. A drained queue entry that concludes a mission bypasses the conclude pre-flush and the end-screen handling
Plan §8.3 (queue "re-posts each queued completion once"), §13 (conclusion/end-screen behaviour proven
only for the inline path); `objectives-manager.js:662-718` (ending-confirm, `missionConcluded`,
`warning`/`flushPendingGlobals` re-post).

If a queued `enter_room` task is the one that concludes a mission, a bare `serverCompleteTask` re-post
on reconnect would record the completion but skip the `endingCheck` confirm, the `missionConcluded`
end-screen trigger and the conclude-race `warning` fallback, all of which live in `completeTask`.
**Suggested fix:** route the drain through a path that still inspects a `missionConcluded`/`warning`
response (for example by draining through `completeTask`/`serverCompleteTaskWithRetry` rather than a
raw POST), or state that an `enter_room` task that concludes a mission is out of the queue's scope and
re-fires through the normal on-entry path instead. Low likelihood, worth a line so a builder does not
silently drop an ending.

### minor 4. The reload-in-room self-heal is understated, and its init-ordering caveat is unstated
Plan §8.3 "Reload while offline" and §11 ("when the player next crosses into the room");
`rooms.js:103` (`currentPlayerRoom = ''`), `:3178-3204` (`updatePlayerRoom` emit guard and emit),
`objectives-manager.js:551` (`handleRoomEntered` `!this.initialized` early return).

As confirmed in 1c, `room_entered` does re-fire for a room the player is already standing in after a
reload (the `'' -> roomId` transition on the first `updatePlayerRoom` tick), so the self-heal is
usually immediate, not "only on a crossing". The one real caveat the plan omits is that
`handleRoomEntered` drops the emit if `ObjectivesManager` is not yet initialised at that first tick,
after which no further emit comes until an actual crossing. **Suggested fix:** keep the conservative
"next crossing" guarantee, but note that the re-fire also lands on the post-reload auto-detection when
init precedes the first tick, and that a reload-in-room live proof should expect the auto-fire in that
ordering (and the crossing fallback otherwise). Documentation only; no code change implied.

## Load-bearing pins (fresh check at `7974a57bf`)

All pins this round turns on hold exactly: `notifyServerUnlock` `unlock-system.js:22-45` (catch
`:39-41`, still a swallow); `ApiClient.post` sets `err.status`/`err.body` `api-client.js:55-56`;
`notifyServerUnlock` is the single unlock funnel (`:722, :743, :835, :871, :1000, :1010, :1050, :1087,
:1189`); `room_entered` subscription `objectives-manager.js:353`, `handleRoomEntered` `:550`
(init guard `:551`, re-complete `:558`); `updatePlayerRoom` emit guard `rooms.js:3178`,
`currentPlayerRoom=''` `:103`; `serverCompleteTaskWithRetry` `:607-625`; the `!response.success` revert
`:689` and the thrown-error catch revert `:725`; `serverCompleteTask` return shapes `:1140-1149`.
Server: `enter_room` branch `game.rb:3745` still the bare "Trust the client" comment (the §8 change is
real and unbuilt); `rfid_requires_held?` `:2563`; `complete_task!(task_id, validation_data = {})`
`:3675` (so the §7 `trusted:` keyword is a real signature change); `skip_task!` `:3798`.
`conclude-mission.js:156` is a proven `window 'online'` precedent for the queue's reconnect drain.

The SYNC SIZE RULE holds: `npcRouteRooms`/`serverCreditGlobals`/`serverCompletedOnly` are
server-written derived lists absent from the client payload, the queue is memory-only, the pre-flush
sends `buildChanges()` deltas only, and credit globals replace existing keys. The cheat policy
(server-owned credit globals via `write_server_globals!`, `serverCompletedOnly` + `trusted:` keyword,
possession-gated viaCredential) and the load-bearing-oddity handling (the never-firing `unlockDoor`
permission mapping kept, the client credit writers moved to `tmp/delete/`) are sound.

## The reload-in-room answer, in one line

`room_entered` does fire for a room the player is already standing in after a reload (because
`currentPlayerRoom` resets to `''` and the first `updatePlayerRoom` tick emits the `'' -> roomId`
transition), so the task self-heals without a crossing provided `ObjectivesManager` is initialised at
that tick; if the tick precedes init the single emit is dropped and a crossing is then required, which
is the plan's guaranteed-safe "next crossing" fallback. The player is never stranded either way.

## Verdict

**Ready to build once major 1 is folded in.** The design is sound and honest-player-safe: every
`enter_room` target enters a durable list (`unlockedRooms` or `npcRouteRooms`) before the completion
POST, the check reads that durable state, both client retries are bounded, the queue is memory-only
and keyed by task id, and neither double-credits nor launders a forge. The three R7 closures are
faithfully reflected and their code hooks are accurate. The one finding that bears on the owner's hard
offline/reconnect requirement is major 1: the mis-cited feed point (`:725` instead of the `:687`
transient branch) could lead a fresh Chunk F builder to wire the queue where the offline path does not
land. Fold in major 1 (correct the feed branch and the enqueue key) and the four minors (drop-condition
wording, the sync-success hook, the drain-vs-ending path, the reload-in-room note), then build. No
redesign is needed and no blocker remains.

## Outcomes

All five findings verified in the code at this tree and folded into the plan.

- **major 1 (feed point mis-cited).** Confirmed: a plain offline drop returns
  `{ success: false, transient: true }` from `serverCompleteTask` (`objectives-manager.js:1149`,
  5xx `:1140-1142`), `serverCompleteTaskWithRetry` exhausts (`:607-625`) and the flow lands in the
  `!response.success` branch `:687-694`, reverting at `:689`, not in the `:719-731` catch. §8.3 and
  §14 Chunk F now key the enqueue on `response.transient === true` in the `:687-694` branch and on a
  thrown error in the `:719-731` catch, naming `:687-694` as the dominant offline path. Live-proof
  Case 3 now asserts the task entered the queue from the transient path.
- **minor 1 (drop rule).** Confirmed the `enter_room` forge refusal carries `retryable: true`, so
  "retryable absent" was wrong. The bound is now explicit: the queue is fed only by a transient or
  thrown failure, and the drain re-runs `completeTask`, which re-adds the id only on a fresh transient
  or thrown failure; a drained entry that returns any not-transient outcome (success, or a
  `room_not_reachable` retryable refusal whose race the inline one-sync-one-repost path owns) is
  dropped and never retries forever.
- **minor 2 (no sync-success hook).** Confirmed `state-sync.js` `sync()` (`:598-605`) resolves to a
  boolean via `_syncOnce` (`:618-671`) and fires no event/callback, and `ObjectivesManager` has no
  subscription. Decision taken: do **not** add a hook to the shared module; drain from the `online`
  listener plus the syncs `ObjectivesManager` already awaits (pre-flush `:613-615` and the inline
  retryable re-sync), via a re-entry-guarded `drainEnterRoomQueue()`. The "next successful sync"
  phrasing is removed. Reason: the `online` listener alone meets the reconnect requirement and the
  change stays inside one file.
- **minor 3 (conclude/end-screen).** Addressed: the drain removes the entry then re-runs
  `this.completeTask(taskId)` (never a bare `serverCompleteTask`), so the full path at `:662-718`
  (ending confirm, `missionConcluded` end screen, conclude-race `warning` pre-flush) still applies to
  a task that ends a mission. Added a node test: a queued `enter_room` completion that concludes a
  mission triggers `handleMissionConcluded` on the drained re-post.
- **minor 4 (reload-in-room self-heal + init replay).** Described accurately: `room_entered` fires on
  the first `updatePlayerRoom` tick after a reload (`currentPlayerRoom` reset to `''`,
  `rooms.js:103`/`:1038`; emit `:3178`/`:3200`), but if that tick precedes `ObjectivesManager` init
  the single emit is dropped at the `!this.initialized` guard (`:551`, `initialized=true` at `:110`)
  and only the next crossing completes it. Recommendation adopted: Chunk F adds a small, idempotent
  **init replay** (after `:110`, if `window.currentPlayerRoom` is non-empty, call
  `handleRoomEntered(window.currentPlayerRoom)` once), which closes the gap in both init/tick
  orderings; the "next crossing" guarantee stays as the floor.

Drain trigger chosen: `online` listener plus `ObjectivesManager`'s own awaited syncs, through
`drainEnterRoomQueue()` re-running `completeTask`; no sync-success hook added. Init replay: yes,
recommended and folded into Chunk F.
