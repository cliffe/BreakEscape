# Pose fixes: use and phone poses (branch build/ol-pose-fixes)

Two bugs found by a live proof on `scenarios/test_needs_sims`, where Tom (`male_office_worker_v2`, all 8 directions of `pose_phone`, `pose_use` and `pose_drink`) never showed `use` or `phone`.

## Causes

1. **No use pose.** Tom reaches `office_coffee` and stands at (230,245) facing up or up-left. The machine's centre (269,277) is down-right or right of him, so `facesObject` returned false and `wantedPose` skipped the 3 s `use` lead for `drink`. Two things turned him away: the arrival `faceTo` aims at the object's top-left x/y, not its centre, and the `face_player` behaviour state re-aims him at a nearby player on every tick.
2. **No phone pose.** The ring on `tom_phone` is answered by Tom (owner at his desk, no job, `s.call` only). He was seated, and seated wins in `poseBlocked`. A colleague who walks to a phone could meet the same trap: `needsStop` gave a `using` job at the phone an `at:<phone>` stop, so a chair beside it seated them.

## Fix

- `npc-poses.js`: new `directionToObject(b, obj)` (8-way from the object's centre). In `update()`, while a use lead (`use`) or a call (`phone`) is wanted, the NPC is turned once to the object (job use) or the phone (`s.call.phoneId`, for an owner with no job), and `b._poseHoldFacing` is set. `release()` clears it. The turn is once only, so a chat partner can still turn the NPC away later.
- `npc-behavior.js`: `facePlayer` returns early while `_poseHoldFacing` is set.
- `seating.js`: `needsStop` returns null while `ns.call` is set or a colleague's phone job is `using`. A seated NPC therefore stands up (seating unseats and steps to the stand spot), the pose plays, and the post stop sits them again after the call.
- An NPC with no `pose_phone` frames still answers with no pose (the `hasPoseAnim` check is unchanged); standing for the call applies regardless.
- Errands (the copier print queue): left as they are. `wantedPose` returns null for them and `_advanceJob` completes an errand on arrival without ever entering `using`, so there is no dwell to put a `use` pose in. Giving them one needs a short engine dwell, not a small change.

## Tests

`test/js/npc-poses.test.mjs` (new cases: turn to the machine on arrival and play `use`; centre-based 8-way turn; chat blocks the turn; colleague phone turn and `pose_phone`; seated stays seated in the pose module; `face_player` held off and released; owner call turn). `test/js/seating.test.mjs`: `needsStop` null for a colleague phone use and for an owner call. The old seating case that expected a seated owner to stay seated on a call (swivel suppression) lost its `call` row, as a call no longer seats the NPC. Most of these failed on the old code; the chat-blocked and seated-colleague cases passed there as regression guards and now carry a control half that can fail (R1 m6).

## Live results

Keyless server on :3094, own game from `new-game.rb`, `tools/playtest/npc-pose-live-proof.mjs` (the phone ring no longer waits for Tom to stand). Headless, setFPS(20) with fixed steps.

- Use: `__test.needs.set('tom','caffeine',5)`. `window.npcPoses.log` shows Tom `use` (`npc-tom-pose_use-right`), then `drink`, then null. Screenshot `scratchpad/pose-live/tom-use.png`.
- Phone: ringing `spare_phone` while Tom sat at his desk (first ring): log `tom phone npc-tom-pose_phone-down`. Screenshot `scratchpad/pose-live/tom-phone.png`.

## R1 fixes (review: POSE_FIXES_REVIEW_R1.md)

- **M1.** `_poseHoldFacing` is now on only while the shown pose is `use` or `phone` (the NPC must face its machine or phone), and off for `drink` and everything else. A conversation always wins: `NPCBehavior.faceForChat` (called once per chat from the needs chat-hold block in `update`, which returned before `face_player` ever ran) clears the hold and turns the NPC to the player. The hold is released on chat start, pose end, interruption (moving, chase), hostility, KO and reload (the flag lives on the behaviour, never saved); tests cover each.
- **M2.** `updateNeedsSeat` never starts a stop (fresh or retry) while a chat is open. A chat that hangs up a call leaves the NPC standing where it is for the whole conversation; the home stop starts after the chat closes and he sits.
- **M3.** `needsStop` returns null for a call only when `window.npcPoses.hasPhonePose(id)` (phone frames present and `poses` allows `phone`). An NPC without them stays seated for a call exactly as on main. Tested both ways.
- **m1.** The pose loop records which ids hold the flag each frame and clears it for any id that no longer does, so exits that skip `release()` (texture change while pending, NPC leaving states, `officeVisuals` false) leave nothing on.
- **m2.** An owner answering the phone turns to the phone (`s.call.phoneId`) even mid own-desk use; the lead turn to the job target is only for jobs with no call.
- **m3 (not changed).** The post-call `use` flash at the PC needs the PC to count as a machine; `wantedPose` returns null for a plain PC (existing test), so it only shows for a PC given `affordance.pose: "use"`. Left alone.
- **m4/m6.** The no-frames test now checks the poseless half and has a control; the chat-blocked and seated-colleague tests have a control that turns and plays, so they can fail.
- **m7.** `tools/playtest/npc-pose-live-proof.mjs` imports `playwright` from the repo's `node_modules` like the sibling scripts (no path into `p-9-2-h`); stale ring comment fixed.
- **m8.** `call` in `idleMotionHeld` stays (it still holds the swivel for an NPC without phone frames); comment added.

Live (keyless :3094, games 6435 to 6437, headless, setFPS(20), fixed steps; needs overlay hidden for the crops): the phone pose shows with Tom standing (`scratchpad/pose-live/tom-phone-crop.png`); the use pose shows (`tom-use-crop.png`); a chat opened mid-use turns Tom to the player (`tom-chat-facing.png`, direction up-left toward the player, hold false); a chat opened mid-call ends the call and Tom stays standing for 8 s of sampled chat (0 seat or move frames), then sits within 0.5 to 1 s of the chat closing.

## R2 fixes (review: POSE_FIXES_REVIEW_R2.md)

- **m1.** `world.inChatWith` (`npc-needs.js`) is also true while `window.pendingConversationReturn` names that NPC with type `person-chat`, so the inventory step counts as the chat. The old gap is closed too: `returnToConversationAfterNPCInventory` no longer nulls the pending return up front. It clears it (only if unchanged) after the chat has restarted, and a second call during the 50 ms delay does not restart the chat twice. A phone-chat return is not a face-to-face chat and stays false.
- **m2.** `NPCBehavior.update` resets `_chatFaced` whenever no needs chat is open, before the seat code can return, so a chat opened as Tom steps off his chair still turns him to the player.
- **m3.** `hasPhonePose` returns false when `gameScenario.officeVisuals === false`.
- **m4.** New tests: `hasPhonePose` against real animations and a `poses` list; the `faceForChat` wiring in `update` (once per chat, a second chat turns again); the reload check now builds a second behaviour and pose module and asserts the hold is rebuilt from the job, not carried over. The wrong comment in the no-use-frames test now says phone, not drink.
- **Tests.** `test/js/npc-chat-resume.test.mjs` (new), `seating.test.mjs` (inventory step keeps the NPC standing), `npc-poses.test.mjs`. Failing on the R2 tip: m1 world, gap and seating tests, m2 wiring test, m3 test. Guards (pass on the old code): `inChatWith` person-chat, pending phone-chat, once-per-chat turn, `hasPhonePose` frames, poses list and reload check.
- **Live** (keyless :3094, game 6464, headless, setFPS(20), fixed steps; `tools/playtest/npc-pose-r2-live-proof.mjs`). m1: chat mid-call, then the real `showNPCInventory` hand-over: 12 samples (6 s) in the container with 0 seat, move or non-chat frames; 20 samples at 50 ms across the close and resume gap with 0 non-chat frames; the chat resumed, Tom stood 3 s more, then re-seated after the chat closed. m2: `_chatFaced` false through the seat and seated spell; a chat opened as Tom stood for a second call faced him to the player (right).

## R3 fixes (review: POSE_FIXES_REVIEW_R3.md)

- **M1.** `inChatWith` counts a pending person-chat return only while the chat is coming back (`returning`, set by the child's `complete()` and cleared once the chat has restarted) or a minigame is actually open. The framework's `endMinigame` also drops the pending return when the NPC inventory or the card reader ends any way but handing back to the chat (`_dropStrandedChatReturn`: force close, displacement by another scene). `showNPCInventory` clears it if the container did not open or threw. The notes hand-over (`pendingContainerReturn`) keeps it, so the chain still resumes.
- **m1.** `npc-pose-r2-live-proof.mjs` computes pass or fail from its checks and exits 1; Chromium is resolved by Playwright like the sibling scripts. A third argument `forceclose` adds the M1 case.
- **m2.** A restart that throws is logged with `console.warn` (inventory and card reader) and the NPC is freed.
- **m3.** The card reader return now clears the pending record after the chat restarts, the same pattern as the inventory, so the 50 ms gap is closed and the comment is true.
- **m4.** New tests in `npc-chat-resume.test.mjs`: force close, displacement, failed open (bridge), card reader force close, person-chat displacement keeps the record, `complete()` marking, double-call guard, throwing restart, phone-chat branch, RFID gap. `npc-poses.test.mjs` m3 restores `gameScenario` to its previous state.
- **Live** (keyless :3094, games 6483 and 6484, headless, setFPS(20), fixed steps): the fixed proof script passes all checks (exit 0). Force close with the inventory open from a chat: Tom in chat while open, free (not in chat, no pending, back on his chair) after `forceCloseMinigame()`. A real `playerHealth.damage(1)` runs `complete(false)`, so the chat resumes by design; closing it leaves Tom free.

## R4 fixes (review: POSE_FIXES_REVIEW_R4.md)

- **M1.** One central clearing point in `minigame-manager.js`: every `endMinigame` that leaves a pending chat return queues `_settleChatReturn` (`CHAT_RETURN_SETTLE_MS`, 400 ms, past the 100 ms container reopen). The record survives only while the chat is returning, the NPC inventory or card reader is open, or a reader started from the inventory is open with `pendingContainerReturn` set. Otherwise it is dropped. This covers a note or file reader closed by a hit, KO, conversation or room change, an item that opens a phone or workstation that never returns to a container, and an item that opens nothing. No per-route patches.
- **M2.** New test runs the real `RFIDMinigame.prototype.complete` through the real framework and asserts the record survives, is flagged `returning`, Tom stays in chat through the gap and the restart runs. Mutation: deleting `this._returnsToChat = true` in `rfid-minigame.js` fails it (and the superseded-instance test).
- **m1.** New test runs the real container `complete()` with `pendingContainerReturn` set and asserts the record is kept. Deleting `this._returnsToChat = true` there fails 3 tests. The earlier test now clears `pendingConversationReturn` when it ends.
- **m2.** Both `complete()` overrides (`rfid-minigame.js`, `container-minigame.js`) hand a superseded instance straight to the base class before flagging or scheduling a restart. Tested for both; removing the RFID guard fails the test.
- **m3.** `npc-pose-r2-live-proof.mjs` now asserts the chat resumed after the hit (`m1fc_hit_chat_resumed`).
- **Live proof:** a third argument `itemexit` opens a note from Tom's inventory mid-chat and closes it by a hit and by a force close; Tom must be free, stay free during an unrelated minigame and return to his schedule.

R4 results: bin/test-js 731 files passed, 0 failed; Rails 3109 runs, 0 failures, 0 errors, 4 skips. Live (keyless :3092, game 6491, `npc-pose-r2-live-proof.mjs 6491 3092 itemexit`): all checks pass for both routes (a hit, a force close): the note reader held Tom in chat, after the exit Tom was not in chat with nothing pending, stayed free during an unrelated minigame, and went back to his schedule.

## R5 fixes (review: POSE_FIXES_REVIEW_R5.md)

- **M1.** New test `R5 M1` does what the clone tag does: opens a person-chat, sets the record, opens the clone reader (which displaces the chat), waits past the settle, then runs the real `RFIDMinigame.prototype.complete(true)` and asserts the chat resumes. Mutation: removing the card reader keep clause in `_settleChatReturn` fails it.
- **m1.** The keep rules now match the comment. The reader arm keeps only a clone reader (`params.mode === 'clone'`), so a door reader opened inside the window drops the record. The container arm keeps only a `pendingContainerReturn` whose `npcOptions.npcId` is this record's NPC, so a stale one from any other container no longer counts. Two tests, each failing when its narrowing is reverted.
- **m2.** The superseded-instance test clears `pendingContainerReturn` before each pass, so the container half is real. Mutation: deleting the three guard lines in `container-minigame.js` `complete()` now fails it.
- **m3.** `_queueChatReturnSettle()` moved into the `finally` of `endMinigame` (skipped for `_suspendedForChild`), so a throwing `cleanup` or `onComplete` cannot skip it. Test added; removing the call fails it and the R4 settle tests (the call sits last in the `finally`, after the phone ringer end hook, which a source test pins). The `interactionWarning` confirm gap is closed too: with no minigame open, a hand-over from this NPC's inventory pending and a `gameConfirmOpen()` dialog showing, the settle looks again after another interval instead of dropping the record. Test added.

## R5 delta minors (review: POSE_FIXES_REVIEW_R5_DELTA.md)

- **m1.** `_settleChatReturn` now requires `rec.npcId != null` before the `fromInventory` match, so a record with no `npcId` cannot match an absent `pendingContainerReturn` npcId. Test `R5 delta m1` displaces a chat with such a record and expects it dropped. Mutation: replacing the guarded expression with `true` fails it.
- **m2.** New test `R5 delta m2` ends a minigame flagged `_suspendedForChild` and expects the chat return record to stay untouched after the settle interval. Mutation: making the `endMinigame` finally guard unconditional fails it.
