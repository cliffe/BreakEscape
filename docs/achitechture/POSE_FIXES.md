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
