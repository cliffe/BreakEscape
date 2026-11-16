# Pose fixes: review round 5, delta

Branch `build/ol-pose-fixes`, tip 9e81e4a4a. Scope: c8d379572..9e81e4a4a (`minigame-manager.js`, `npc-chat-resume.test.mjs`, the R5 fix log). Review only, no code changed.

Counts: **0 blocking, 0 major, 2 minor.** Verdict: clean to land; the two minors are optional.

`npc-chat-resume.test.mjs` passes 28 of 28 on the tip. Four mutations were run on `minigame-manager.js` (file restored with `git checkout` each time; tree clean afterwards apart from the pre-existing untracked `node_modules`). No server, no Rails tests, port 3092 untouched.

## R5 findings

- **M1 (clone reader keep arm untested): closed.** `R5 M1` (`npc-chat-resume.test.mjs:368`) does what the clone tag does: person-chat, record set, `startMinigame('rfid', null, { mode: 'clone' })`, wait past the settle, then the real `RFIDMinigame.prototype.complete(true)`. Mutation: dropping the clone arm from `minigame-manager.js:257` fails exactly this test (27 pass, 1 fail). The live clone check R5 also asked for is not in the fix log; the unit test now covers the guard, so this is a request carried over, not a defect in the diff.
- **m1 (keep rules too wide): closed.** The reader arm needs `cur.params?.mode === 'clone'` (`:257`); the container arm needs `pendingContainerReturn.npcOptions.npcId === rec.npcId` (`:260`). Mutations: widening the reader arm back to any rfid fails `R5 m1: a door reader...`; widening the container arm to `!!pendingContainerReturn` fails `R5 m1: a stale pendingContainerReturn...`.
- **m2 (vacuous container test): closed.** `window.pendingContainerReturn = null` at the top of each pass (`:348`) makes the container half drive the guard. I did not re-run the R5 mutation of deleting the guard lines in `container-minigame.js`; the reset removes the cause R5 identified.
- **m3 (settle in the finally, confirm gap): closed.** The queue call sits last in the `finally` (`minigame-manager.js:374-378`), after the ringer hook and the lane relayout, each already in its own try. A throwing `cleanup` or `onComplete` still reaches it; `R5 m3: a throwing cleanup` covers that. The confirm re-check (`:264-267`) is covered by `R5 m3: an interactionWarning confirm...`; mutation: replacing its condition with `false` fails it.

## Keep rules against m01 to m10

- **clone_keycard (m03 to m10).** The only opener is `chat-helpers.js:433`, which passes `mode: 'clone'`, and `startRFIDMinigame` hands `params` to `startMinigame` unchanged, so `cur.params.mode === 'clone'` holds for the reader the tag opens. The record is set at `:430` to `{ npcId: window.currentConversationNPCId, type }`. The other two clone openers (`interactions.js:1098`, `action-menu.js:100`) also pass `mode: 'clone'`. `RFIDMinigame` reassigns `this.mode` at `:238` but never `params`, so the check is on the stable field. No clone flow is dropped.
- **Item hand-over via NPC inventory.** The record is `{ npcId }` from `npc-game-bridge.js:384`, and `npcOptions.npcId` is `this.npcId` of the same container (`container-minigame.js:1739`, `:1786`, `:1886`), so the ids match. The other `pendingContainerReturn` writer (`:1630`) sets `npcOptions: null`, which belongs to a desktop or world container with no chat record; dropping there is right. m01 to m10 do not use `give_npc_inventory_items` anyway (R5 noted this).
- **Door readers** now drop the record inside the window, as intended.

## Confirm re-check: loop and lifetime

It re-arms only when all hold: record still current (identity check at `:250`, `returning` false), no open minigame, `fromInventory`, and `gameConfirmOpen()` (no argument, so any open confirm; `notifications.js:894`). Each pass either returns without a timer or sets exactly one. It stops when the dialog closes, the record is replaced or cleared, any minigame opens (the open arm then decides), or `returning` is set. The record lives as long as that dialog is open and no longer; a confirm left open indefinitely holds it indefinitely, but the NPC is then frozen by the same dialog the player has not answered, which is the intended behaviour. Timers are one per 400 ms and cannot multiply, because a re-arm replaces its own timer. No loop, no unbounded keep.

## _suspendedForChild skip

Correct. `suspendedForChild` returns from the `try` body (`:343-346`), the `finally` runs, and the `ending._suspendedForChild !== true` guard (`:374`) skips the queue, so a parent handing over to a child leaves the record to the child's own end. Same behaviour as the old call site, which was also after that early return. Mutation of the guard was not run (no test pins it either way; see m2 below).

## Minor

**m1. `undefined === undefined` makes `fromInventory` true when the record has no `npcId`.**
`minigame-manager.js:260`: `window.pendingContainerReturn?.npcOptions?.npcId === rec.npcId` is true when both sides are undefined, i.e. a record with no `npcId` and either no `pendingContainerReturn` or one with `npcOptions: null`. The clone tag builds `npcId` from `window.currentConversationNPCId`, which is set while a chat is open (`person-chat-minigame.js:459`), so it should always be present in m01 to m10 flows. If it is ever missing the narrowing silently reverts to "keep for any open minigame, and while any confirm is open". Cheap guard: `rec.npcId != null && ...`.

**m2. No test pins the `_suspendedForChild` skip.**
The skip is right by reading, but nothing fails if it is removed, because the queue and settle behave the same when the child is the only thing open. Optional: a test that ends a suspended parent and asserts no settle was queued.

## Other checks

- **Player state:** no growth. The diff touches no sync, controller, model or Ruby file; `pendingConversationReturn` and `pendingContainerReturn` stay page-only and are not serialised.
- **Placement vs old timing:** the 400 ms window now counts from the end of the `finally` rather than before the bark and relayout work; the reopen timers (100 ms) are still queued earlier in the same call, so ordering is unchanged.
