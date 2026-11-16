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

`test/js/npc-poses.test.mjs` (new cases: turn to the machine on arrival and play `use`; centre-based 8-way turn; chat blocks the turn; colleague phone turn and `pose_phone`; seated stays seated in the pose module; `face_player` held off and released; owner call turn). `test/js/seating.test.mjs`: `needsStop` null for a colleague phone use and for an owner call. The old seating case that expected a seated owner to stay seated on a call (swivel suppression) lost its `call` row, as a call no longer seats the NPC. Each new test failed on the old code.

## Live results

Keyless server on :3094, own game from `new-game.rb`, `tools/playtest/npc-pose-live-proof.mjs` (the phone ring no longer waits for Tom to stand). Headless, setFPS(20) with fixed steps.

- Use: `__test.needs.set('tom','caffeine',5)`. `window.npcPoses.log` shows Tom `use` (`npc-tom-pose_use-right`), then `drink`, then null. Screenshot `scratchpad/pose-live/tom-use.png`.
- Phone: ringing `spare_phone` while Tom sat at his desk (first ring): log `tom phone npc-tom-pose_phone-down`. Screenshot `scratchpad/pose-live/tom-phone.png`.
