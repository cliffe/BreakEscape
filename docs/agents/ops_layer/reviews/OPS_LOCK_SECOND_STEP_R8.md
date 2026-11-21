# OPS_LOCK_SECOND_STEP: round 8 (delta review of def243b4a)

**Nothing above minor.** Counts: 0 blocker, 0 major, 5 minor, 6 nit.

Scope: the R7 fix commit def243b4a to `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (`plan:`)
and `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (`log:`), checked against the code in this worktree.
Code paths: `us.js` = `public/break_escape/js/systems/unlock-system.js`, `bridge.js` =
`public/break_escape/js/systems/npc-game-bridge.js`, `mm.js` =
`public/break_escape/js/minigames/framework/minigame-manager.js`, `game.rb` =
`app/models/break_escape/game.rb`.

Not graded (on the user's round 2 page, so treated as open): whether an NPC-opened door still
owes the step (plan:923-929), and whether the pane waits until the conversation closes
(plan:405-422). The findings below are mechanics that need fixing whichever way those go, unless
a finding says otherwise.

## R7 findings: closed?

- M1 (no hook for the wait): closed. The wait is in `MfaClient.runLockStep`, keyed on
  `method: "npc"`, with three named clear conditions and two checks in a row (plan:405-422).
  No deadlock: both chat callers fire and forget (`chat-helpers.js:101-104`,
  `person-chat-conversation.js:387` calls `handleUnlockDoor` without `await`), and the
  event-mapping loop awaits only its own posts (`npc-manager.js:1888-1892`).
- M2 (no retry): closed in design; see m1, m2 and m3 for gaps in the wiring.
- M3 (access-list callers): closed (plan:467-489). Cites match `us.js:1543-1565`,
  `rfid-minigame.js:322-384`.
- M4 (fingerprint toast): closed (plan:454-460).
- M5 (door field copies): closed (plan:336-351); `doors.js:518-540` and
  `us.js:1594`, `:1644` match.
- m1 to m6 and the nits: closed. Starter cites `minigame-starters.js:83`, `:230-234`, `:257`,
  `:480-481` and BLE `ble-scanner-minigame.js:593-610` all check out (the handover asked).

## Minor

### m1. A retry from the door passes the step but does not open the door

plan:491, :502-510, :823; code `bridge.js:106-145`, `us.js:1696-1715`.

- The retry calls `NPCGameBridge.unlockDoor(roomId, npcStepOpener)` from `handleUnlock`
  (plan:505-506). On success the bridge only sets `doorProperties.locked = false` on the sprites,
  sets `locked = false` in `gameScenario` and `rooms`, and emits `door_unlocked_by_npc`
  (`bridge.js:113-145`). It drops `response.roomData` and never calls `unlockTarget`, so the door
  sprite does not open and `door_unlocked` (`us.js:1710`) is not emitted. The player approves at
  the door and must click it again, which then goes through the "client sees unlocked" re-check
  (`us.js:1014-1031`).
- plan:491 says "On a pass the door opens through the caller's existing success branch", but
  `handleUnlock` has no success branch for a bridge call. B12e (plan:823) says "Door opens".
- Side effect: the retry re-emits `door_unlocked_by_npc` with Gordon's id though Gordon is
  nowhere near; any eventMapping bark keyed on it fires at the door.
- Fix: in `handleUnlock`, post directly with
  `ApiClient.unlock('door', unlockTargetId(lockable,'door'), npcStepOpener, 'npc')` and on
  `success` call `unlockTarget(lockable, 'door', lockable.layer, response)` as the other
  branches do; on `secondStepCancelled`, nothing. Say whether `door_unlocked_by_npc` should fire
  on a retry (suggest not). This also removes the bridge from the retry path, so the bridge
  change stays limited to its `catch`. Name the target as `doorProperties.connectedRoom`
  (`unlockTargetId`, `us.js:55-58`): plan:506 says `roomId`, and `doorProperties.roomId` is the
  room the sprite sits in (`doors.js:519`), not the locked room. JS test: after a pass on retry,
  `unlockTarget` runs once with the answer's `roomData`.

### m2. No client code is named for setting `npcStepOpener` from the `secondStep` answer

plan:360-362, :501; code `doors.js:518-531`, `bridge.js:181` (`_findAllDoorSpritesForRoom`),
`us.js:1644-1673`.

- plan:361 says "the client sets `doorProperties.npcStepOpener` from it at once", but no
  module owns that write: not `ApiClient.unlock`, `MfaClient` or the bridge in 5.4, the JS test
  list (plan:772-781) or the shared-files table (plan:847-851). The `npc` post has no door
  sprite of its own: zero, one or two sprites may lead to the room (one per loaded side), and
  sprites built later read `connectedRoomData?.npcStepOpener` from `gameScenario.rooms`
  (`doors.js` read pattern, plan:347), as does the scenario fallback of
  `getLockRequirementsForDoor` (`us.js:1644-1673`).
- Without this, the in-session retry (B12c, plan:821) has no field to read until a reload.
- Fix: name one writer, e.g. `MfaClient.runLockStep` on a `secondStep` answer carrying
  `opener` and `targetType: 'door'`: set `window.gameScenario.rooms[targetId].npcStepOpener` and
  the field on every sprite from `_findAllDoorSpritesForRoom(targetId)`. Add a JS row: after an
  `npc` post answered with `opener`, both the loaded sprite's and a later-built sprite's
  `lockRequirements` carry it.

### m3. The grant is written only "in the same save as the record", so an `npc` post against an existing record writes none

plan:293-302, :357-362, :586.

- Step 4 answers a live, unpassed record "again from the record, with no write" (plan:293-295).
  The grant is written "in the same save as the record" (plan:358). If the record was started
  by the door's own credential (a card at `records_room`) and Gordon's ink then posts `npc`, the
  answer carries `opener` (plan:301-302) and the client sets `npcStepOpener`, but no grant is
  written, so after a reload the bootstrap carries no `npcStepOpener` and the client and server
  disagree. It is also unclear whether `opener` in a re-answer is the posting NPC or the stored
  grant.
- Fix: say the gate writes the grant whenever an accepted `npc` post meets a gated door and the
  grant is absent or names another NPC, even on a re-answer (one small write, no row, no request
  count), and that `opener` is the grant's value after that write. Server test row in "G2 NPC
  grant" (plan:744).

### m4. At a door, the "Second step pending" toast always shows and the pane opens 400 to 800 ms late

plan:414-421, :505-508, :821.

- The retry posts `method: "npc"`, so it takes the wait. With nothing open, the first check is
  clear, but the pane needs "the second clear check in a row" (plan:415), so the client always
  waits at least one 400 ms interval (`mm.js:446`) and shows "Second step pending. It opens when
  you finish here." while nothing is open. B12c (plan:821) expects the pane with no mention of
  either.
- Fix (holds whichever way the open wait question goes): show the toast only when the first
  check is not clear, and open at once when the first check is clear and no chat return is
  pending (the two-check rule exists to catch a chat or container coming back, which needs a
  scene to have been open). Or skip the wait for the retry, which has no conversation by
  definition: it can pass a flag, e.g. `runLockStep(answer, request, { fromDoor: true })`.

### m5. Two waits can open two panes on the same tick

plan:405-422; code `chat-helpers.js:99-118`, `mm.js:70-80`.

- An ink knot with two `#unlock_door` tags (two gated doors), or an ink tag plus an
  event-mapping `unlockDoor`, starts two independent waits (the chat tags are fire and forget).
  Both see the same clear checks and both call the pane; the second `startMinigame` ends the
  first pane (`mm.js:70-80`), and the plan does not say whether that ending is a cancel with
  `closedByPlayer` true or false, so the first door may say "Not approved." without the player
  doing anything.
- Fix: serialise `runLockStep`: one pane at a time, later requests queued behind the current
  one's settlement (pass, cancel), each re-checking clear before it opens. JS test: two `npc`
  requests under one chat give two panes in turn and no "Not approved.".

## Nit

### n1. A null `startMinigame` leaves the wait's promise unsettled

plan:421, :500; code `mm.js:49-55`, `systems/player-damage-interrupt.js:351-361`.
`startMinigame` returns null while the player is knocked out, and the clear check does not test
for that, so the pane silently fails to open and `ApiClient.unlock` never settles. A KO ends in a
restart (a reload), so nothing is stranded in play, but tests that stub the clock will hang.
Fix: add `!window.playerIsKnockedOut?.()` to "clear", and treat a null return as a silent
cancel (`closedByPlayer: true`).

### n2. The "NPC check now refuses" fallback is close to dead and undefined

plan:508-510, :778-779; code `game.rb:5041-5047`, `:5051-5075`. Both server checks are static
(the mapping check has no encounter test; the `unlockable` check needs `encounteredNPCs`, which
only grows), so a check that accepted once does not refuse later. "Refuses" is also not defined
against a network error or the route-room retry. The client clears the field but the server
keeps the grant, so a reload restores it. Fix: cut the fallback and its JS row, or define
refusal as a 422 and have the server drop the grant on that refusal.

### n3. Section 10 does not mention `npcStepGrants`

plan:684-685. "Every game gains an empty `lockSteps`" should add "and an empty `npcStepGrants`;
it is written only behind `lock_step`, and the bootstrap adds `npcStepOpener` only from it, so an
existing scenario's bootstrap is unchanged". Section 9 needs nothing: the grant is runtime state
with no authored field, and the existing warning on a gated `unlockDoor` target (plan:660-661)
covers the authoring side. (Answers the fixer's third open point.)

### n4. LOG section 11 badge bullet does not mirror L1b step 2

log:618-623 against log:716-719. L1b step 2 lists the `flag_reward`, refused `npc` and
`lockpick` no-row cases; the section 11 bullet does not. Add "a refused `npc` post and a
`lockpick` post at an rfid door with a card held write no `denied` row; a `flag_reward` open of
an rfid object writes no `ok` row", or point to L1b step 2. No contradiction, only two lists.

### n5. "So nothing new is sent" is no longer true

plan:437-438. Since G2 sends `opener` and `npcStepOpener` (plan:300-302, :343, :570-572),
reword to "nothing new is sent for this; the door fields are 5.3's".

### n6. Proportion: what could be cut or deferred

- The grant, the bootstrap derivation, the `npcStepOpener` field in `doorProperties` and the three
  `getLockRequirementsForDoor` returns, the `handleUnlock` branch and B12b to B12d exist only
  under answer (a) to open question 1 (plan:923-929). Question 1 should say so: under (b) or (c)
  all of it drops.
- If the user wants less, keeping the opener in client memory only (no server key, no bootstrap
  edit, no B12d) loses only the retry after a reload, where the player can ask the NPC again.
- The `showAccessRefusal` cancel branch (plan:473-475) and the live-copier branch (plan:482-484)
  guard paths no current caller reaches; cheap, but they could wait for a caller.
- n2's fallback can go.

## Checked and fine

- Forgery: a crafted `npc` post can create a grant for any door in an `unlockDoor` mapping
  (no encounter check, `game.rb:5041-5047`) or in an encountered NPC's `unlockable`, exactly as
  it can post `npc` today. The grant authorises nothing on the server (nothing reads it except
  the bootstrap), and the step is still judged on `lockSteps`.
- What reaches the browser: `opener` and `npcStepOpener` are the NPC id the browser itself sent
  as `attempt` (`bridge.js:101`, `person-chat-conversation.js:464`); `secondStep` copies `kind`
  and `owner` only. Nothing server-side leaks.
- Size and sync: one entry per gated door, server-written, never in a sync body, dropped by
  `reset_player_state!`; it never expires by design, bounded by the scenario.
- The wait stops on a reload (it is page memory). The game has no in-page scene change to stop
  on. It never opens over a scene (currentMinigame, chat return and confirm checks), apart from
  the KO case in n1, where `startMinigame` refuses anyway.
- Chat notifications after the chat closes still show: `person-chat-ui.js:813-829` appends to
  `document.body`, so the success toast survives `destroy()`.
- The plan reads standalone: no review or round references.
