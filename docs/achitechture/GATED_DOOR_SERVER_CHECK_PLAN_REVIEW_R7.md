# Adversarial review R7: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` at worktree HEAD
`2cfe76bd1` ("redesign enter_room live proof for real delays, retryable refusal"), R1-R6 with their
Outcomes, then independently opened the load-bearing client and server code. The hardest look went to
the owner's standing requirement for the `enter_room` part (§8, Chunk F): tested for network delays,
proven on a throttled network, and a legitimate player never refused; and to the retryable-refusal
handling that R6's amendment added to both §8.3 and §3.6.

Counts: **0 blockers, 1 major, 4 minors.**

## 1. R6's closures: the five enter_room live-proof cases (§13)

I drove each case against the real client flow (`objectives-manager.js` completion path, the door
`/unlock` -> `serve_opened_room` -> `unlock_room!` durable write, the controller's 422 render that
preserves the body). Confirmed the serving guarantee: `complete_task!`'s controller action renders a
failed result verbatim (`render json: result, status: :unprocessable_entity`,
`games_controller.rb:1645`), and `serverCompleteTask` returns `response.json()` for any status under
500 (`objectives-manager.js:1140-1144`), so a `{ success:false, error:'Room not reached',
retryable:true }` body reaches the caller intact and `serverCompleteTaskWithRetry` returns it at once
(`!last.transient` is true, `:619`) without entering the transient backoff loop. Good: no spin there.

- **Case 1 (delayed then aborted `currentRoom`+pre-flush, `/unlock` already landed).** Drivable with
  Playwright `route` on the sync endpoint (delay / `abort`). Fails without the durable `unlockedRooms`
  read (a `currentRoom`-only check would refuse). **Caveat:** the `abort` variant also implicitly
  requires that the awaited pre-flush tolerate a rejecting sync, or the thrown abort propagates to the
  outer catch (`objectives-manager.js:719`) and the completion POST is swallowed, failing the test even
  with the durable protection present. The node test "completion does not depend on the pre-flush"
  covers this, so the dependency is accounted for, but the live case only proves the server guarantee
  if that error handling is built first. Sound given that ordering.
- **Case 2 (old tab, no pre-flush).** Drivable (stub the pre-flush via `page.evaluate`, or abort the
  sync). Fails without durable `unlockedRooms`. Sound.
- **Case 3 (offline then reconnect, queued completion).** See minor 1: the "queued completion posts on
  reconnect" has no client mechanism; drivable only if the proof driver re-posts after reconnect.
- **Case 4 (duplicated / retried completion idempotent).** Drivable (fire twice via the bridge). It
  exercises `complete_task!`'s pre-existing already-completed branch, i.e. a regression guard rather
  than a protection this plan introduces; it would still fail if a duplicate re-ran the credit, so it
  is worth keeping. See minor 4 for the object-path sibling.
- **Case 5 (forge refused, retryable re-post does not launder).** Drivable (tamper so the target is in
  no durable list, POST directly). Fails if the trust comment is restored. Sound.

So four of the five reproduce what they claim and fail without their named protection. Case 3 is the
weak one (minor 1).

## 2. The retryable refusal: bound, double-credit, honest-play error, §3.6 alignment

- **One re-post after one sync, bounded.** §8.3 and the node test cap the client at one re-sync plus
  one re-post, then surface. `serverCompleteTaskWithRetry` returns a `retryable` refusal immediately
  (not via the transient loop), so the loop cannot spin. Confirmed.
- **Double-credit.** `complete_task!` is idempotent (already-completed branch) and the check reads only
  durable lists, so a re-post after promotion credits once. Safe for the enter_room path.
- **A sync that fails again.** In honest play the first post already succeeds (durable `unlockedRooms`
  is written at unlock, before entry), so the retryable path is reached only on the residual race. If,
  on that rare path, the single re-sync `await` rejects and is not wrapped, it propagates to the outer
  catch and the honest player sees the generic "Could not save… keep playing" alert instead of the
  re-post. Narrow, but it is an honest-play error the plan does not rule out (minor 2).
- **Aligning §3.6's `room_not_reachable` to the same handling changes something not yet closed
  (major 1).** The enter_room refusal is handled in `objectives-manager.js`; the §3.6 object-unlock
  refusal is handled in `unlock-system.js`, a different client system that maps any non-success
  response to `outcome: 'denied'` with no retryable branch (`unlock-system.js:172-177`). The plan's
  claim that "the two retryable refusals share one handling path" (§3.6, §8.3) is not true in the code,
  and no build chunk assigns the object-path client retry. See major 1.

## Major

### major 1. The §3.6 object-unlock client retry is unassigned and has no shared handler; the honest hi-vis player can still be refused
Plan §3.6 ("Transient honest-refusal window, viaPass path only"; "the two retryable refusals share one
handling path"), §8.3 ("mirrors §3.6's retryable `room_not_reachable`"), §14 Chunks A and F;
`public/break_escape/js/systems/unlock-system.js:160-181` (object/door unlock response mapping),
`public/break_escape/js/systems/objectives-manager.js:686-695` (completion refusal handling).

§3.6 relies on the client, on receiving the object gate's `{ success:false, reason:
room_not_reachable, retryable:true, status: :forbidden }`, awaiting one `stateSync.sync()` (which
promotes the room via viaPass) and re-attempting, "rather than surfacing a hard error to the player."
But:

1. The two client paths are genuinely separate systems. Door/object unlocks go through
   `unlock-system.js`, whose response handler returns `outcome: 'denied'` for any non-success body
   (`:172-177`) and has no `retryable` concept; `enter_room` completions go through
   `objectives-manager.js`. There is no shared handling path, so "the two retryable refusals share one
   handling path" overstates the code.
2. The build split does not assign the object-path client retry to anyone. Chunk A lists only
   server-side §3.6 work (the controller guard and the feedback-helper `nil` returns); Chunk F builds
   the retryable handling only in `objectives-manager.js` for `enter_room`. The object-unlock client
   retry falls through the gap, so a fresh Chunk A agent and a fresh Chunk F agent each reasonably
   build nothing for it.

Consequence: an honest hi-vis player who promotes `secure_area` via the viaPass `currentRoom` sync but
beelines to a container before that sync lands hits the object gate's `forbidden` refusal with no
automated re-attempt. It self-heals only on a manual re-interact (by which time the sync has landed),
so it is not a hard soft-lock, but it is a legitimate player being refused once, which the plan
explicitly set out to avoid.

**Suggested fix:** assign the object-path client retryable handling to a named chunk (Chunk A is the
natural home, since §3.6 lives there) and pin the handler site (`unlock-system.js` object-unlock
response mapping). Either introduce one shared helper both the completion path and the object-unlock
path call (so "one handling path" becomes true), or drop that wording and describe each path's retry
separately. Add the object-path case to the node retry tests.

## Minors

### minor 1. Live-proof Case 3 (offline then reconnect) has no client queue; it overstates the client and is drivable only via the proof driver
Plan §13 Case 3, §8.3 "Offline then reconnect" bullet;
`public/break_escape/js/systems/objectives-manager.js:607-625` (retry window), `:719-731` (network-
error catch). No `'online'` listener or completion queue exists anywhere in the engine (grep).

A network failure returns `{ transient:true }` (`:1149`), so `serverCompleteTaskWithRetry` retries
across ~150+300+600+1200ms (~2.25s). Past that, the task reverts to active with a "keep playing" alert
and nothing re-posts on reconnect; the completion re-fires only when `room_entered` fires again (the
avatar re-crosses the boundary). So the plan's "on reconnect the queued completion posts" describes a
queue that does not exist, and an offline gap longer than ~2s strands a low-stakes `enter_room` task
until re-entry.

**Suggested fix:** reword Case 3 and the §8.3 offline bullet to say the proof driver re-posts the
completion after reconnect (the assertion is that durable `unlockedRooms` persisted across the gap), not
that the client auto-queues; and note the >~2s offline-blip stranding as the same accepted low-stakes
behaviour already granted to reload in §11/§8.3. If auto-recovery is wanted, add a bounded reconnect
re-post, but that is new scoped work.

### minor 2. The retryable re-sync must tolerate a rejecting sync, like the pre-flush
Plan §8.3, §3.6; `objectives-manager.js:588-591` (pre-flush), `:719-731` (outer catch).

The node tests require the *pre-flush* `await stateSync.sync()` not to swallow the completion when the
sync rejects, but the *retryable re-sync* has no equivalent requirement. If that re-sync `await`
throws unhandled, an honest residual-race player gets the generic "Could not save" error instead of the
single re-post (which would have succeeded on durable state regardless). **Suggested fix:** state that
the retryable re-sync is wrapped so a sync failure still proceeds to the one re-post, and add a node
test "retryable refusal + re-sync rejects still re-posts once."

### minor 3. Rails test 11 is placed in Chunk A but its acceptance half needs Chunk B's promotion
Plan §13 test 11, §14 Chunks A and B.

Test 11 asserts refusal while the room is in `npcRouteRooms` **and then** "wear the pass / promote
`secure_area`, repeat: the container unlocks, contents served, task completes." Promotion (viaPass /
viaCredential) is Chunk B, not Chunk A. In Chunk A alone a route room never promotes, so the acceptance
half cannot run and an object in a split route room would stay permanently refused. **Suggested fix:**
split test 11 so the refusal half is Chunk A and the acceptance-after-promotion half is Chunk B (or move
the whole test to Chunk B), and note the A->B build dependency for §3.6's acceptance path.

### minor 4. Confirm the object-unlock retry re-post is idempotent for any `unlock_object` task credit
Plan §3.6 (object branch yields "a credit — an `unlock_object` task completes on unlock"),
§13 Case 4 / test 18 (idempotency proven for `enter_room` only).

The §3.6 object-path retry re-POSTs `/unlock` after promotion. The plan proves idempotency for the
`enter_room` completion (test 18) but not for a re-posted object unlock that completes an `unlock_object`
task. It is probably safe (post-promotion unlock reads `unlockedObjects` membership), but the plan
should assert it, as it does for `enter_room`, so a re-post cannot double-fire the object task credit.

## Load-bearing pins (fresh check at `2cfe76bd1`)

All pins I checked hold exactly, including R6's minor-3 correction: `SYNC_STATE_COLUMNS`
`games_controller.rb:2027`; `unlock_room!` `game.rb:116`, `room_unlocked?` `:122`,
`stored_scenario_data` `:797`, `SERVER_OWNED_GLOBAL_NAMES` `:1798`, `login_scope_of` `:1913`,
`rfid_requires_held?` `:2563`, `complete_task!` `:3675`, `enter_room` branch `:3745` (still the bare
"Trust the client" comment, so the change is real), `skip_task!` `:3798`; controller transaction
`:1137`, `serve_opened_room` call `:1139`, complete-task action render `:1642-1645`. The SYNC SIZE RULE
holds: `npcRouteRooms`/`serverCreditGlobals`/`serverCompletedOnly` are server-written derived lists not
in the client payload, the pre-flush sends `buildChanges()` deltas only, and credit globals replace
existing keys. The cheat policy, client-settable-credit closure (server-owned read-only union via
`write_server_globals!`), and the §7 `serverCompletedOnly` / `trusted:` keyword plumbing are sound.

## Verdict

**Not ready to build — fold in major 1 first.** The server design is sound and does not refuse honest
`enter_room` players: every target enters a durable list before the completion POST, and the check
reads that durable state. The redesigned five-case live proof fixes R6's impossible-reorder defect and
four of its cases are drivable and fail without their protection. The one real hole is the retryable
alignment R6 introduced: §3.6's object-unlock client retry is unassigned to any chunk and the claimed
"one handling path" does not exist in the code, so a fresh builder would ship Chunks A and F without it
and leave the honest hi-vis player exposed to a hard refusal in the viaPass window (major 1). Fold in
major 1 (assign and pin the object-path client retry; fix the "one handling path" claim) and the four
minors (Case 3 wording and offline stranding; wrap the retryable re-sync; split test 11 across A/B;
assert object-unlock re-post idempotency), then build.

## Outcomes

All findings verified against the code at the current tree and folded into the plan.

- **Major 1 (object-unlock client retry).** Verified the two client systems are separate:
  object/door unlocks funnel through `notifyServerUnlock` (`unlock-system.js:22-45`), whose
  `apiClient.unlock` throws a 403 with the body on `error.body` (`api-client.js:47-57`), caught and
  swallowed today at `unlock-system.js:39-41`; `enter_room` completions run in `objectives-manager.js`.
  §3.6 now gives the object path its own retry in that catch: recognise a `room_not_reachable` retryable
  body, await one `window.stateSync.sync()` wrapped so a rejecting sync still proceeds, re-post the
  `apiClient.unlock` once (fires only on that reason-and-flag body, never for a door). The "two refusals
  share one handling path" claim is replaced throughout (§3.6, §8.3) by "two handlers applying one rule
  (one sync, one re-post, bounded)". Assigned to Chunk A, with four `unlock-system` object-retry node
  tests (retry succeeds after promotion; forged attempt still refused after its one re-post; no spin; no
  retry for other refusals or doors). Object-unlock re-post idempotency added as Rails test 11c.
- **Minor 1 (offline).** Rather than reword Case 3, a bounded in-memory re-send queue of `enter_room`
  completions is added (§8.3, Chunk F): a field on `ObjectivesManager`, keyed by task id (at most one
  entry per `enter_room` task), never in `player_state` (SYNC SIZE RULE holds), re-sent on the browser
  `online` event and on the next successful state sync, dropped on success or a non-retryable refusal.
  Reload-while-offline is answered: the queue clears on reload, but the room persists in `unlockedRooms`
  and the task reloads active, so the next crossing re-fires it via the `room_entered` event
  (`objectives-manager.js:353`) -> `handleRoomEntered` (`:550`) -> `completeTask` (`:558`). Live-proof
  Case 3 now drives real offline/online via Playwright `context.setOffline`, with no proof-driver
  re-post.
- **Minor 2 (wrap the re-sync).** §8.3 and §3.6 now state the retryable re-sync is wrapped so a
  rejecting sync still proceeds to the one re-post; node tests added for a rejecting re-sync on both the
  completion path and the object-unlock path.
- **Minor 3 (test 11 split).** Rails test 11 is split: 11a (refusal while unpromoted) in Chunk A, 11b
  (acceptance after promotion) in Chunk B, with the A->B build order noted in both chunks.
- **Minor 4 (object-unlock idempotency).** Added as Rails test 11c in Chunk B: a re-posted object unlock
  after promotion credits the `unlock_object` task once via `unlockedObjects` membership.
