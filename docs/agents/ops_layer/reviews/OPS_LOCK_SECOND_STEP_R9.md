# OPS_LOCK_SECOND_STEP: round 9 (delta review of 137fed572)

**Nothing above minor.** Counts: 0 blocker, 0 major, 4 minor, 4 nit.

Scope: the R8 fix commit 137fed572 to `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (`plan:`),
checked against the code in this worktree. Code paths: `us.js` =
`public/break_escape/js/systems/unlock-system.js`, `bridge.js` =
`public/break_escape/js/systems/npc-game-bridge.js`, `api.js` = `public/break_escape/js/api-client.js`,
`om.js` = `public/break_escape/js/systems/objectives-manager.js`.

Not graded (open user questions in section 15): question 1 (an NPC-opened door still owes the
step) and question 9 (the pane waits until the conversation closes).

## R8 findings: closed?

- m1 (retry does not open the sprite): closed. The retry posts `npc` itself for
  `unlockTargetId(lockable, 'door')` (= `doorProperties.connectedRoom`, `us.js:55-58`) and calls
  `unlockTarget` (`us.js:1696`), which opens from `roomData` and emits `door_unlocked`
  (plan:531-545). The cancel handling is mis-specified; see m1 below.
- m2 (no writer for `npcStepOpener`): closed. One writer, `MfaClient.runLockStep`, over
  `gameScenario.rooms` and every sprite from `_findAllDoorSpritesForRoom` (`bridge.js:184`,
  exposed as `window.NPCGameBridge`, `bridge.js:819`) (plan:524-530). JS row present (plan:827-829).
- m3 (grant on a re-answer): closed. Written on any accepted `npc` post when absent or naming
  another NPC; `opener` is the grant after the write (plan:293-305, :360-370). Server row present
  (plan:786).
- m4 (toast and 400 ms delay at the door): closed. Opens at once when the first check is clear;
  `fromDoor` skips the wait (plan:422-430); B12c updated (plan:870).
- m5 (two panes on one tick): closed as stated; the queue it adds has two gaps (m2, m3 below).
- n1 to n6: closed. `window.playerIsKnockedOut` (`player-damage-interrupt.js:399`) and
  `window.gameConfirmOpen` (`notifications.js:1229`) exist; the fallback is cut; section 10 names
  `npcStepGrants` (plan:724-727); n5 reworded (plan:456-458); question 1 lists the costs.

## Minor

### m1. The retry's cancel branch reads a field `ApiClient.unlock` never returns

plan:536-542, :400-404, :825-826.

- The retry calls `ApiClient.unlock(...)` directly and says "on `secondStepCancelled` it does
  nothing" (plan:542). Under the 5.4 contract `ApiClient.unlock` does not resolve with that
  field on a cancel: it **rejects** with a 403-shaped error whose `body.reason` is
  `second_step_cancelled` (plan:401-404). `secondStepCancelled` exists only after the bridge's
  `catch` (plan:513-515) or `notifyServerUnlock` (plan:445) converts it, and the retry uses
  neither. Written as specified, every cancel at the door is an unhandled rejection.
- A non-cancel rejection (network error, a 500, a lost-pass re-post at plan:400-402) has no stated
  handling either, where every sibling branch in `handleUnlock` shows "Failed to verify access"
  (`us.js:1003-1006`, `:1024-1027`).
- Fix: specify `.then(response => response?.success && unlockTarget(...))` and
  `.catch(err => { if (err?.body?.reason === 'second_step_cancelled') return; console.error(...);
  window.gameAlert('Failed to verify access', 'error', 'Error', 3000); })`, the cancel line and
  tone having come from `cancelFeedback` already. JS row: a rejected cancel at the door raises no
  alert and no unhandled rejection; a network error shows the sibling branches' alert.

### m2. A queued request opens its pane on whatever its first answer was, which may be stale

plan:437-441, :593-597.

- A queued request holds the `secondStep` answer it got when it was posted, and the queue
  re-runs only the scene-clear check before opening (plan:438-439). Two ways that answer goes
  stale before the pane opens:
  - **Same door twice.** An ink `#unlock_door:X` and an event-mapping `unlockDoor` for X, or the
    player using door X within the 400 to 800 ms settle window after the chat that posted `npc`
    for X closes (the NPC is usually standing by that door). The first pane passes and opens X;
    the second then opens on an open door, and every `/mfa/*` route answers 404 (plan:593). The
    player sees an error pane for a door that is already open, and an X on it reaches the bridge
    as a cancel.
  - **Expiry.** The head pane can stay up for most of five minutes while the player pesters; a
    record queued behind it can expire meanwhile, and its pane opens with no live record (generic
    422 from the posts, plan:594).
- Fix: when a queued request reaches the head and the scene check is clear, re-post its
  `/unlock` body once before opening (a live record re-answers with no write and no count,
  plan:293-297). Open the pane only on a fresh `secondStep` answer; settle the request with the
  re-post's answer when it is `success: true` (so the door retry still calls `unlockTarget` and
  the bridge still emits `door_unlocked_by_npc`); a new challenge opens on the new record. Or
  dedupe by subject: a request for a subject already queued or open joins that one's settlement.
  JS rows: a duplicate same-door request after a pass settles as success with no second pane; a
  queued request whose record has gone opens on the re-post's new record.

### m3. A pad's own step can be queued behind an `npc` request that is waiting for that pad to close

plan:413-417, :435-441, :442-448.

- An event-mapping `unlockDoor` for a gated door fires "under any scene or none" (plan:416).
  Say it fires while the player has a gated `pin` safe's pad open. The `npc` request waits, since
  the pad is `currentMinigame` (plan:418). The player enters the right PIN; the server answers
  `secondStep`; `runLockStep` queues the pad's request behind the waiting one (plan:437-439).
  The waiting one opens only when no scene is open, and the pad stays open waiting for its own
  pane. Nothing moves until the player closes the pad with X, after which the NPC's pane opens
  and then the safe's pane opens alone. No pane, no toast and no line in between: to the player
  the right PIN did nothing.
- It also contradicts plan:435-436, "Every other method opens the pane at once, over its own pad".
- Fix: serialise on an open pane, not on a wait. A request that may open now (any non-`npc`
  method, or a `fromDoor` retry) opens if no pane is open, and a waiting `npc` request does not
  hold the queue; when it later finds the scene clear it queues behind any open pane. JS row: an
  event-mapping `npc` request waiting under a gated pad, then the pad's right code: the pad's pane
  opens at once over the pad; the NPC's pane opens after both are shut.

### m4. Retry passes skip `door_unlocked_by_npc`, which scenarios use for state, not only barks

plan:543-545, :870; code `bridge.js:138`, `om.js:344-350`, `scenarios/m10_full_disclosure/scenario.json.erb:1806`, `:1840`, `:1848`, `:1951`, `:1984`, `scenarios/m09_digital_archaeology/scenario.json.erb:254`.

- The plan drops `door_unlocked_by_npc` on a retry so that no NPC bark plays at the door. Every
  current mapping on that event is a `setGlobal` (m10's `breach_open`, `inner_door_open`,
  `stair_open`, `gallery_open`, `outer_lock_open`; m09's `cage_opened`). If an author gates
  such a door, the global is set when the step passes inside the conversation path and never
  when it passes on the retry, so the scenario's state depends on whether the player closed the
  pane once. Objectives are safe: `om.js` counts `door_unlocked` too (`:344-347`).
- Fix (either): emit `door_unlocked_by_npc` on a retry pass with
  `{ roomId, npcId, source: 'npc', retry: true }`, so state mappings fire and a bark mapping can
  add `!data.retry`; B12c's "no `door_unlocked_by_npc`" then applies to the click and B12e checks
  it fires once on the pass. Or keep the plan's choice and add a validator warning in section 9
  for a `secondStep` room that an `eventMappings` entry keys on `door_unlocked_by_npc`. The first
  keeps the event single-fire per open (the bridge path and the retry path are exclusive for one
  pass).

## Nit

### n1. The shared-files table lags the delta

plan:896, :900. The `api-client.js` row should name the sixth argument handed to `runLockStep`;
the `mfa-client.js` row should add the serialised queue, the knock-out check and the
`npcStepOpener` writer (it now writes door sprites and `gameScenario.rooms`, which are not
`MfaClient`'s own state).

### n2. "Checks once" for `fromDoor` does not say what a failed check does

plan:427-428. The KO case is covered by the null-return rule, but an open confirm dialog or a
chat return pending is not. Say: a `fromDoor` request whose single check is not clear settles as
a silent cancel (`closedByPlayer: true`). If m3's fix is taken, also say it never queues behind a
waiting request.

### n3. A grant outlives a door opened without the step

plan:343-347, :360-362, :380-381. The grant is deleted only by `record_step_open!`. A flag
reward or a propped door opens the room through `unlock_room!` and leaves it, so the bootstrap
keeps sending `npcStepOpener` for an open room. Harmless (the client-sees-unlocked check runs
before the retry, `us.js:1014-1031`), but the bootstrap could add the field only for a room not in
`unlockedRooms`, which also covers any later opener.

### n4. `opener` wording on a non-`npc` re-answer

plan:303-305. "the grant's value after any write above, which is the NPC whose `npc` post reached
the gate ... also on a re-answer" reads as if `opener` were the poster. On a keycard post with a
grant already held, `opener` is the grant's NPC, not the poster. Drop "which is the NPC whose
`npc` post reached the gate" or add "(any method)".

## Checked and fine

- **Forged or replayed `npc` grant.** The grant is written only after `validate_unlock` accepts
  the `npc` claim (plan:290-297; a refused claim is today's 422 with no write, plan:786). Nothing
  on the server reads it except the bootstrap; the step is still judged on `lockSteps`. A replay
  after the open meets Rule B and writes nothing; a replay after a pass opens the door, as any
  valid first factor would. The new re-answer write adds no server reader, so R8's forgery
  conclusion stands.
- **Idempotent.** Same NPC: no write. Another NPC: last writer wins, one key per gated door,
  bounded by the scenario.
- **Delta only.** Never read from a sync body (plan:626); the browser gets `opener` in each
  `secondStep` answer (one id, not growing) and `npcStepOpener` in the bootstrap only.
- **The retry bypasses nothing the server checked.** It replaces the client's lock-type branch
  with the same `npc` claim the bridge sends (`bridge.js:108`), judged by the same static checks;
  the client-sees-unlocked check still runs first, and the `door_unlock_attempt` emit
  (`us.js:1037`ff) sits before the lock-type branches, so it still fires.
- **Sixth argument.** `ApiClient.unlock(targetType, targetId, attempt, method, extra = {})`
  builds the body from `extra` and four named fields (`api.js:105-114`); a sixth parameter is
  not spread. No existing caller passes more than five (`lock-scope-refusal.js:55-56`,
  `bridge.js:108`, `apply-actions.js:206`, `us.js:177`, `person-chat-conversation.js:464`).
  `finishLock` re-posts the held body, which never had it.
- **Single-fire on the conversation path.** The bridge emits `door_unlocked_by_npc` once per
  successful answer (`bridge.js:136-143`); with no retry emit, an open gives it at most once.
- The plan reads standalone: no review or round references.
