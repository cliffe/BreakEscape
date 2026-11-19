# OPS_LOCK_SECOND_STEP: round 7 (delta review of 28a11d5ff)

Scope: the lock types audit changes in commit 28a11d5ff to
`docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (`plan:`) and
`docs/achitechture/OPS_LOG_ROWS_PLAN.md` (`log:`), checked against the code in this worktree.
Code paths: `us.js` = `public/break_escape/js/systems/unlock-system.js`, `ms.js` =
`public/break_escape/js/systems/minigame-starters.js` (it lives under `systems/`, not
`minigames/`), `mm.js` = `public/break_escape/js/minigames/framework/minigame-manager.js`,
`rfid.js` = `public/break_escape/js/minigames/rfid/rfid-minigame.js`, `pcm.js` =
`public/break_escape/js/minigames/person-chat/person-chat-minigame.js`, `bridge.js` =
`public/break_escape/js/systems/npc-game-bridge.js`, `game.rb` =
`app/models/break_escape/game.rb`.

Counts: 0 blocker, 5 major, 6 minor, 4 nit.

## How the framework stacks scenes (background for M1 and M3)

There is one `currentMinigame` (`mm.js:6`). Starting a scene ends the current one
(`mm.js:70-80`); a parent that set `suspended: true` is ended without its `onComplete` and
comes back as a **new instance** through `returnTo` (`mm.js:20-37`, `:540-560`, `:610-635`).
Nothing is ever drawn over a live scene: the old instance runs `cleanup()` (`mm.js:500`) and
its pending promises resolve into a dead object. Every "opens over it as a child" in the plan
means "suspends it, and a fresh copy returns later".

## Major

### M1. "Opens when the conversation closes" has no defined hook, and the obvious one fires mid-conversation

plan:390-394, :398, :628-631; code `pcm.js:2117-2127`, `mm.js:423-474`, `mm.js:500`,
`chat-helpers.js:99-121`, `npc-manager.js:1886-1893`.

- The plan makes `ApiClient.unlock` the one place that opens the pane (plan:355-367) and then
  asks that, for an NPC's ink unlock, the pane waits for the conversation to close. It does not
  say where that wait lives or how `ApiClient.unlock` or `MfaClient.runLockStep` knows a
  conversation is up. `NPCGameBridge.unlockDoor` is the same call for the ink tag and for an
  `eventMappings[].unlockDoor` (`npc-manager.js:1890`), which can fire with any scene open
  (a container, a pad) or with none.
- The hook that exists is `conversation_closed:<npcId>`, emitted from `cleanup()`
  (`pcm.js:2117-2127`). `cleanup()` also runs when the chat is suspended for a child it
  opened: the NPC's inventory or the card copier (`mm.js:423-433`, `pendingConversationReturn`,
  `mm.js:500`). An ink knot that does `#unlock_door` and then `#give_item` would fire
  `conversation_closed` as the inventory opens, the pane would open over the inventory and
  displace it, and `_dropStrandedChatReturn` (`mm.js:429-433`) would drop the return to the
  chat. The phone chat (`phone-chat-conversation.js` also runs `processGameActionTags`) has the
  same issue, plus the ringer's skipped `conversation_closed` cases (`phone-ringer.js:46`,
  `:455`).
- Fix: put the wait in `MfaClient.runLockStep`, not in the NPC callers: before opening the pane,
  if `MinigameFramework.currentMinigame` is set and is not a lock pad or the copier, wait until
  `currentMinigame` is null, `window.pendingConversationReturn` is null and no panel is
  expected (re-check after `CHAT_RETURN_SETTLE_MS`, as `_settleChatReturn` does). Reuse
  `npc-manager.js:778-788` `_whileThreadOpen` for the chat part. Name the person chat, the phone
  chat and an event mapping fired under another scene. Add a JS test where `#unlock_door` is
  followed by `#give_item`: the pane opens only after the inventory and the chat are both shut.

### M2. A deferred NPC step cannot be retried; "nothing is lost and the next attempt asks again" is not true

plan:376-377, :392-394, :399, :409-411, :666; code `bridge.js:106-175`, `chat-helpers.js:104-117`,
`person-chat-conversation.js:447-488`.

- For an NPC door the first factor is the NPC. Once the held request is gone (reload, the pane
  closed with X, a deny or expiry, a knock-out during the wait), there is no "next attempt" the
  player can make: walking to the door runs the door's own lock type (`us.js` `rfid` branch,
  etc.), which the player usually cannot pass, and the ink `unlock_door` line is normally in a
  knot the player does not revisit. The server record stays live (plan:409-411) but no client
  path posts `method: "npc"` again. B12 (plan:666) asserts "the next attempt asks again"
  without saying what that attempt is.
- "Walking away first" is undefined: the chat is modal (keyboard paused while it is open), and
  under the plan the pane opens the moment the chat closes, so there is no window in which the
  player walks away with the pane unopened. The plan also says "X closes it; the record
  expires" (plan:399) and, for the NPC case, "treat a cancel as the step still pending"
  (plan:376): pick one.
- The cancel never reaches the NPC callers as a cancel: `bridge.js:165-174` turns any rejection
  into `{ success: false, error: error.message }`, so `chat-helpers.js:108-111` shows "Failed to
  unlock: … ", and it does so after the chat has closed, through the chat's destroyed `ui`
  (`pcm.js:2131-2133`). `person-chat-conversation.js:483-486` shows "Failed to unlock door".
  "Waiting on a second step." (plan:393) has no source: the `.then` runs only when
  `ApiClient.unlock` settles, which is after the step.
- Fix: decide how an NPC-opened step is re-presented. Options: (a) the client keeps
  `{ targetType, targetId, npcId }` for a pending NPC open in session memory (nothing secret;
  the server re-answers from the live record with no write) and the door's interaction re-posts
  `method: "npc"` while that entry exists; (b) the validator requires the `unlock_door` line to
  sit in a repeatable choice when its target carries `secondStep`; (c) accept the loss and say
  so (the player must ask the NPC again). Pass the cancel through the bridge
  (`{ success: false, secondStepCancelled: true }`), show the waiting line from `mfa_required`
  (which `MfaClient` already emits, plan:412-414) as a game toast rather than through the chat
  `ui`, and give B12 a reload case and an X case with the expected outcome.

### M3. The card copier bullet names the wrong handler, and the access-list path without the copier is not covered

plan:386-389, :396-397, :628-629; code `us.js:1486-1494`, `:1505-1518`, `:1543-1563`,
`rfid.js:322-384`, `us.js:167-189`.

- `requestRfidAccessUnlock` has two callers. With held physical keycards, STEP 2 posts directly
  with **no copier open** (`us.js:1547-1549`), so the pane opens alone there. Only when no
  keycard is held, or after the keycards are refused, does the copier post through
  `params.requestAccess` (`us.js:1489`).
- Inside the copier the answer is handled by `rfid.js:_askAccessList` (`:337-383`), not by
  `showAccessRefusal`. An unknown outcome there falls to the last branch: reject tone,
  `card_emulated` `success: false`, and `_showDenial(…, 'wrong_card', …)`, which calls
  `onRefused` and emits `door_unlock_failed` (`rfid.js:373-383`, `:289-290`). Also, because the
  pane suspends the copier, the instance awaiting the answer is no longer live: on a cancel it
  returns silently (`rfid.js:351-353`), and on a pass it takes the late path
  (`onLateAccessUnlock`, `us.js:1492`, `applyRfidAccessUnlock(…, { late: true })`, `us.js:1439-1447`),
  which opens a gated object's container with `autoOpen: false` and closes the reopened copier
  with `complete(false)`. The plan's "plays the reject tone" will not happen there.
- `showAccessRefusal` (`us.js:1505-1518`) is the STEP 2 no-copier path. A new outcome reaches it
  only when the player holds no copies; with copies, `us.js:1553-1559` runs first: reject tone,
  `door_unlock_failed('wrong_card')`, then the copier opens listing the right keycards as
  refused (`refusedKeycards: accessKeycardIds`). Without copies, the unknown outcome hits the
  `else` branch, "Failed to verify access" (`us.js:1515-1516`).
- Fix: in 5.4 name both callers. STEP 2 (`us.js:1549-1562`): on `second_step_cancelled`, no
  copier, no `door_unlock_failed`, the cancel line only. The copier (`rfid.js:_askAccessList`):
  a `second_step_cancelled` branch before the denial, and say what the suspended instance does
  (silent on a cancel is fine; then the returning copier needs no refusal mark). State that a
  pass at the copier opens through the late path and whether `autoOpen: false` is wanted for a
  gated container. Add `showAccessRefusal`'s branch for completeness. JS tests for each.

### M4. The fingerprint reader announces the unlock before the post

plan:380-385, :397, :626-628; code
`public/break_escape/js/minigames/biometrics/fingerprint-reader-minigame.js:241-256`,
`us.js:1295-1302`.

- On "accepted" the reader plays `confirm` and shows "You unlocked the <type> with <owner>'s
  fingerprint." ("Biometric Unlock Successful"), then closes; only after that does
  `us.js:1299` post `/unlock`. On a gated biometric lock this is the same lie as the Bluetooth
  toast, and the audit's list of four sites missed it (audit section 3 notes the reader was
  only partly read). The plan lists biometric as opening the pane alone (plan:397) and does not
  name this toast.
- Fix: add it to the "No success before the final answer" list: on a gated lock the reader says
  the print was accepted (true) and the "unlocked" toast moves to the `notifyServerUnlock` then,
  after `success: true`. JS test row.

### M5. A door's `secondStep` does not reach the code that would read it

plan:334-335, :384-385, :447-448; code `game.rb:2425-2427`, `systems/doors.js:520-535`,
`us.js:1594-1607`, `:1654`, `:1672`.

- The plan says the client "knows the lock is gated from the `secondStep` field it already
  holds, so nothing new is sent" (plan:384-385). For objects that holds: the object arrives as
  authored. For a door, G2 adds `secondStep` to the bootstrap room allowlist (plan:334), but the
  client copies door lock fields through two more allowlists: `doors.js` builds
  `doorProperties` field by field (`:531` shows the pattern for `acceptsUIDOnly`), and
  `getLockRequirementsForDoor` returns a fixed set at three exits (`us.js:1600-1607`, `:1654`,
  `:1672`). Without both, `lockRequirements.secondStep` is undefined at a door and the Bluetooth,
  key and lockpick toasts still fire early on a gated door.
- Fix: G2 names the three client copies (doors.js `doorProperties`, the three
  `getLockRequirementsForDoor` returns) alongside the bootstrap line, and the JS test asserts a
  gated door's `lockRequirements.secondStep` before its room loads. Note that the rfid direct
  card and clone branches do not need the field at all: their toasts already sit in a `.then`
  after `ApiClient.unlock`, which only settles after the step, so testing `success` is enough
  there.

## Minor

### m1. The key and lockpick toast sites are cited by a comment

plan:382-383. The plan cites `us.js:1160-1161`, which is a comment. The toasts are
`ms.js:232-234` (lockpick minigame, both modes), `ms.js:481` (key selection), and the
no-framework fallbacks `ms.js:83` and `:257`. They run in the starter's `onComplete`, which
has no server answer, so "waits for the final answer" means moving the toast into the
`us.js` callback after `notifyServerUnlock` (`us.js:1153-1163` and the key-selection callback)
for a gated lock. Say so, and note `expectContainerAfterUnlock` (`ms.js:230`, `:480`) is called
at the same moment and should move with it.

### m2. Cancel feedback is inconsistent between callers

plan:369-370, :384, :388, :628, :632. The pads close a cancel "with no reject sound"
(plan:369-370; test row plan:632), but the Bluetooth, rfid, key and lockpick callers play the
reject tone and say "Not approved." on a cancel (plan:384, :628), and that includes the player's
own X. The pads' rule exists because a player's own close is not a refusal
(`ms.js:613-616`, `:672-673`). Fix: one rule for all callers: a deny or expiry gets "Not
approved." and the reject tone; the player's own X gets nothing. That needs the rejection to
say which (`body.closedByPlayer` or similar) since all three share `second_step_cancelled`.

### m3. LOG 5.1 now contradicts its own lead-in, and the refused badge row is still not method-keyed

log:222-227, :1165-1166; code `game.rb` `validate_unlock` (rfid branch accepts `rfid`, `npc`,
and `flag_reward` on objects; `unlock_method_matches_lock?` at `game.rb:4504-4507`).
- The bullet opens "keyed on what the server resolved, never on the request's `method`" and the
  granted sub-bullet now adds "and the request's method is `rfid`". Reword: the method counts
  because `validate_unlock` accepted it against the lock type.
- Methods that reach the granted row today are `rfid`, `npc` (doors via `unlockDoor`, objects
  via `unlockable`) and `flag_reward` (objects). The change excludes the last two; the plan
  names only `npc`. Say `flag_reward` writes no badge row either.
- The refused row (log:232-238) is keyed on "an rfid card held", not on the method, so a refused
  `npc` post, or a lockpick attempt that fails the lock-type check at an rfid door, writes
  `badge_swipe denied` whenever the player holds any card: the same "swipe no card made" the
  audit's item 12 fixed for the granted row. Fix: require `method == 'rfid'` on the refused row
  too, with a test.

### m4. LOCK section 13 overstates who the badge row names

plan:723-726 against log:1165. "When a cloned card opens a gated door the badge row names the
card's holder". The log rule names the holder for a copy only when the request carried one card
or `showCardHolder` is set; with several cards it has no `as`. The copier sends one card per
Emulate, but the non-access-list clone branch (`us.js:1478`, `notifyServerUnlock`) may carry
several. Fix: "names the card's holder when the log can tell (log section 13.x)", or cite the
log row.

### m5. BLE completes a task before the lock opens

`public/break_escape/js/minigames/ble-scanner/ble-scanner-minigame.js:582-608`. On pairing the
scanner emits `task_completed_by_npc` for the object's `completesTask` and writes
`onPairSetGlobal`, then closes, and only then `us.js:1376` posts. On a gated BLE lock the task
completes and globals move while the lock stays shut pending the owner. Pre-existing, but the
step makes it visible. Fix: one sentence in 5.4 (or a validator warning for `completesTask` or
`onPairSetGlobal` on a gated BLE object), or record it in section 14 as out of scope.

### m6. B12 does not test what it describes

plan:666. Moira is both the NPC opening `records_room` and the step's owner (plan:173), so the
beat tests the owner case without saying how approval happens (pester her phone push while she
stands there?). It does not check the waiting line, the mid-chat child case of M1, a reload, or
X on the pane. Fix: after M1 and M2, give B12 explicit sub-steps: approve path, chat with a
`#give_item` after the unlock, reload during the wait, X on the pane; each with its server
record check.

## Nit

- n1. plan:136. The keyring is also read by `GET /keyring` (audit item 1). "read only by sign-in"
  is fine for locks, but say "no lock reads it" without the "only".
- n2. plan:745-750. The two out-of-scope findings have no destination. Name where they go
  (`docs/IDEAS_BACKLOG.md`, ACCESS A15, or the validator owner) so they are not lost.
- n3. plan:447-448. When G2 adds `secondStep` to the bootstrap allowlist, copy only `kind` and
  `owner`, so a later author field under `secondStep` cannot leak through the room payload.
- n4. plan:396-398. The non-access-list clone branch closes the copier before it posts
  (`us.js:1470-1483`), so its pane opens alone; the "opens alone" list says "a direct card"
  only. Add "or a copy played back outside an access list".

## Checked and fine

- `second_step_cancelled` is client-made with no server row or state (plan:421-422); the pane's
  deny goes through `/mfa/approve`, which writes its own row. The 403 shape with `status` set is
  what `requestRfidAccessUnlock` reads (`us.js:182-184`).
- `secondStep` on objects reaches the browser as authored in G1; `kind` and `owner` are meant
  to be public (plan:46-48), and nothing that satisfies the step is in the field.
- Every card path posts `method: "rfid"`: the direct card (`us.js:1526`), the clone branch
  (`us.js:1478`), the copier (`us.js:177`), the clone-as-entry post (`doors.js:699`), and a
  UID-only copy (same posts, `acceptsUIDOnly` decided by the server, `game.rb:4025`, `:4058`). So
  the method key logs cloned and UID-only cards correctly.
- The Bluetooth (`us.js:1339-1343`), clone (`:1478-1482`) and direct-card (`:1526-1529`) sites
  are cited correctly. The PIN and password pad toasts (`ms.js:609`, `:668`) run on the pad's
  success, which under the plan follows the final answer. No inventory change or door animation
  runs before `unlockTarget`.
