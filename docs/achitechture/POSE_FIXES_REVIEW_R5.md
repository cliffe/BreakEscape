# Pose fixes: review round 5

Branch `build/ol-pose-fixes`, tip 2a7c9eeb8. Scope: d6a8dc630..2a7c9eeb8, the R4 fixes: the settle in `minigame-manager.js`, the superseded-instance guards in `rfid-minigame.js` and `container-minigame.js`, the new tests in `test/js/npc-chat-resume.test.mjs` and the `itemexit` case in the live proof. Review only, no code changed.

Counts: **0 blocking, 1 major, 3 minor.**

Ran `npc-chat-resume.test.mjs` (23 pass), `npc-poses.test.mjs` (39 pass) and `seating.test.mjs` (80 pass) in a scratch worktree at 2a7c9eeb8, plus five mutations and one probe test there; the scratch worktree is removed. No full suites, no server, no db tasks, no SecGen. Port 3092 not used.

## R4 findings

- **R4 M1 (stranded record after an aborted hand-over): closed.** Every `endMinigame` that leaves a record queues `_settleChatReturn` (`minigame-manager.js:354`), and once no child or inventory-started reader is open the record is dropped. Removing the queue call fails 3 tests. What is left is bounded to one chain of back-to-back minigames (m1 below), not the session.
- **R4 M2 (card reader return untested): closed for the unit test, open for the live check.** The new test at `npc-chat-resume.test.mjs:329` runs the real `RFIDMinigame.prototype.complete`. R4 also asked for a live run of one real clone scene resuming its chat; the fix log's live proof covers only `itemexit`, and the new settle adds a second line the clone flow depends on with no test (M1 below).
- **R4 m1 (notes hand-over flag): closed.** `:322` runs the real container `complete()` with `pendingContainerReturn` set.
- **R4 m2 (guard order): closed in the code.** Both guards mirror the base class check (`base-minigame.js:347`) and run before anything is flagged or scheduled (`rfid-minigame.js:743`, `container-minigame.js:2040`). The container half of its test is vacuous (m2 below).
- **R4 m3 (hit case unchecked): closed** (`m1fc_hit_chat_resumed`).

## Major

**M1. The settle's card reader keep arm protects every clone_keycard scene in m03 to m10, and deleting it passes every test.**
The clone tag sets the record and then opens the reader (`chat-helpers.js:430-432`). `startMinigame('rfid')` ends the person-chat first, and that end queues a settle for the record (`minigame-manager.js:354`). The player is then in the reader for well over 400 ms, so the settle always runs with the reader open, and only `cur._sceneType === 'rfid'` at `minigame-manager.js:256` keeps the record. Without it the record is dropped mid-clone, `RFIDMinigame.complete()` finds no record, and the chat does not come back after the copy: m03 (Ffion, Victoria), m04, m05 (Owen), m06, m07, m08, m09 and m10, the same list as R4 M2.
Mutation: changing line 256 to `if (open && (cur.mode === 'npc')) return;` leaves `npc-chat-resume.test.mjs` at 23 pass, 0 fail. The R4 M2 test (`:329`) starts the reader with the record already set and completes it at once, so no settle is ever queued while it is open. A probe test that does what the tag does (open a person-chat, set the record, open the reader so it displaces the chat, wait past the settle, then run the real `complete(true)`) passes on the tip and fails with the mutation, so the code is right today and only the guard is missing. That probe is the test to add. It also wants the live check R4 M2 asked for: one real clone scene (m05 Owen is the shortest) resuming its chat, with the reader held open for a few seconds before the copy finishes.

## Minor

**m1. The keep rules are wider than the comment says.**
`minigame-manager.js:256` keeps the record for any open card reader, not only the clone reader the chat opened (`params.mode === 'clone'`). `:257` keeps it for any open minigame while `pendingContainerReturn` is set, whoever set it and however old it is. A stale `pendingContainerReturn` is common: an item handed over from any container to a phone, a workstation or a lock leaves it set (`container-minigame.js:1796`; only network and sign-in desktop returns are cleared on the next container open, `:895-898`). With one present, a record that should be dropped survives any minigame the player opens inside the 400 ms window, and every later end re-queues the settle, so it lives as long as minigames follow each other within 400 ms. The NPC is frozen for that chain only, then dropped once the world is idle at a settle. The card reader case is a little worse: a door reader opened inside the window keeps the record, and its unlock then restarts the NPC's chat at the door (`rfid-minigame.js:747-752`, the older behaviour R4 noted). Narrower checks would close both: the reader arm only for `cur.params?.mode === 'clone'`, the container arm only when `pendingContainerReturn.npcOptions?.npcId === rec.npcId`.

**m2. The container half of the superseded-instance test passes without the guard.**
`npc-chat-resume.test.mjs:345` runs for both classes, but `pendingContainerReturn` is still set from the R4 m1 test (`handOver` at `:243` sets it and `:322` never clears it, and `frame()` does not reset it). The container's `complete()` therefore takes the "just closing" branch, which flags and restarts nothing with or without the guard. Mutation: deleting the three guard lines at `container-minigame.js:2040-2042` leaves 23 of 23 passing. With `window.pendingContainerReturn = null` added at the start of each loop pass, the same mutation fails the test. The fix log's "Tested for both" holds only for the reader.

**m3. The timer covers only hand-overs whose next step is synchronous or on a shorter timer.**
The timer itself is sound for the routes traced: the settle is a `setTimeout`, not Phaser time, so `setFPS(20)` does not slow it; the notes (`notes-minigame.js:893`, 100 ms) and text file (`text-file-minigame.js:649`, 100 ms) reopens are scheduled in the same `endMinigame` before the 400 ms settle, so browser timer throttling or clamping keeps their order; `startNotesMinigame`, the text file reader and `startContainerMinigame` set `currentMinigame` synchronously. Two gaps remain:
- An inventory item with an `interactionWarning` shows a `gameConfirm` dialog (`interactions.js:842`, `:778`), which is not a minigame. If the player takes more than 400 ms to answer (always), the settle finds nothing open and drops the record; after the note and the reopened inventory, the chat no longer resumes. Before R4 it did. No m01 to m10 NPC inventory uses this, so it is a trap for authors rather than a live bug.
- `_queueChatReturnSettle()` sits inside the `try` after `onComplete` (`minigame-manager.js:325`, `:354`). A throwing `cleanup` or `onComplete` skips it, and the record waits for the next `endMinigame`. Moving the call into the `finally` (skipped for `_suspendedForChild`) closes that.
A targeted drop where a reader spends `pendingContainerReturn` without reopening (`returnToContainerAfterNotes({ reopen: false })`, the text file's non-own close) would remove the time dependency for the routes R4 named. The timer is an acceptable catch-all on top; as the only mechanism it is fine for today's content, with the two gaps above.

## The questions asked

**1. The settle and its races.**
- Slow reopen: no step in the inventory to reader to inventory chain is on Phaser time, and the shorter reopen timers are queued before the settle in the same call, so low FPS, `setFPS(20)` and a throttled tab do not reorder them. An async step outside timers (the confirm dialog) does (m3).
- A new minigame inside the window: kept only if it is a card reader or `pendingContainerReturn` is set (m1); otherwise dropped, which is right.
- Two settles: each captures its record and checks identity (`:252`), so a replaced record is never touched; two settles for the same record are harmless, the second sees null.
- After a room change: drops if nothing is open, which is right, since the chain is broken. Reload: page state is gone. Mission end: below.
- Main-mission flows: clone_keycard keeps its record through the settle only because of the reader arm (M1); it is never dropped today. Item hand-over (`give_npc_inventory_items`) is not used in m01 to m10. Badge cloning is the same clone_keycard path. The person-chat restart after `returning` is never touched by the settle (`:247`, `:253`).

**2. The superseded-instance guards.** Correct: same condition as the base class, checked first, so a late timer on a closed reader (`rfid-minigame.js:220`, `:490`, `:569`) neither flags a newer record nor schedules a restart. Neither guard looks at `_ending`, also like the base class; a `complete()` during the instance's own end (the damage interrupt) still hands back to the chat, as intended. The test is real for the reader (R4 says so; removing the RFID guard fails it) and vacuous for the container (m2).

**3. Are the tests real?** Partly. Removing the settle queue fails 3 tests, removing the `pendingContainerReturn` keep fails 1. Removing the card reader keep fails none (M1) and removing the container guard fails none (m2). The R4 M1 tests drive the real framework and the real container `complete()`, but model the readers with `FakeOther` and clear `pendingContainerReturn` by hand instead of running `returnToContainerAfterNotes` or the text file cleanup, so they check the settle rule, not the reader routes.

**4. The ending screen with a record pending.** All three endings are DOM overlays opened from `ObjectivesManager.handleMissionConcluded` (`objectives-manager.js:1384`): `showEndScreen` (`apply-actions.js:502`), `BondVisualiser.open` (`bond-visualiser.js:2042`) and `showSuccessScreen` (`success-screen.js`, which waits until no minigame has been open for 1 s). None calls `startMinigame`, `endMinigame` or `closeMinigame`, so the ending neither displaces a child nor queues a settle. A pending record behaves as if no ending had happened: kept while its child is open, dropped by the next settle once nothing is. A reader completed under the credits restarts its chat under or over the overlay, as on main; this branch does not change that. Nothing to fix here.

**5. Synced player_state.** No growth. The range touches no sync, controller, model or Ruby file; `pendingConversationReturn`, `pendingContainerReturn`, `returning`, `resuming` and `_returnsToChat` are page-only and never serialised.

## Verdict

The design closes R4 M1 and the code is correct for every route traced, including clone_keycard in m03 to m10. Not clean: M1 needs the displaced-chat clone test and the live clone check before this lands, and m2 is a one-line test fix. m1 and m3 can be taken or left.
