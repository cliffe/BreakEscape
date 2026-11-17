# Pose fixes: review round 1

Branch `build/ol-pose-fixes`, tip f1d263491 (contains main 9ab53f57b). Diff `git diff main...HEAD`. Review only, nothing fixed.

Counts: **0 blocking, 3 major, 8 minor.**

Method: read the diff, `npc-poses.js`, `npc-behavior.js` (update and facing paths), `seating.js` (`needsStop`, `updateNeedsSeat`) and the call runner in `npc-needs.js`. Ran `test/js/npc-poses.test.mjs` (30 pass) and `test/js/seating.test.mjs` (78 pass) on the branch, then the branch's two test files against main's engine code (from `git archive main`): 5 of the 7 new pose tests and the new `needsStop` test fail on main, as they should. No live run: the optional crop was skipped because `bin/rails` resolved Ruby 2.7.8 with missing gems in this shell, and no server was started.

## Major

**M1. A posing NPC no longer turns to the player before a chat, and nothing turns it once the chat starts.**
`npc-poses.js:337` and `:346` set `_poseHoldFacing`, and `npc-behavior.js:1177` makes `facePlayer` return early while it is set. The hold is cleared only by `release()` (`npc-poses.js:278`), which runs when no pose is wanted. Two facts make this matter:
- The hold lasts the whole pose, not only the use lead. Once the lead turns into `drink` (or a non-brief machine `use` for the full job, or `phone` for the whole call), the key stays non-null at `npc-poses.js:358`, so the hold stays on for the full use or call, which can run for minutes.
- For a needs NPC in a person-chat, `NPCBehavior.update` returns at `npc-behavior.js:892` before the state switch, so `face_player` (`npc-behavior.js:1098`) never runs during the chat. I found no other code that turns a standing NPC to the player at chat start (`person-chat` and `interactions.js` set no NPC direction; only a seated swivel does, `seating.js:2262`).

So the player walks up to Tom at the coffee machine or on the phone, he does not turn (hold on), the chat opens, the pose is released (`poseBlocked` with `inChat`), but the behaviour never calls `facePlayer`, and Tom holds the whole conversation facing the machine or phone. On main he faced the player on approach. This fails the brief's rule that the NPC must turn to face the player when a conversation starts. Suggested direction: turn the NPC to the player once when the chat begins (for example in the `inChatWith` block at `npc-behavior.js:892`, ignoring the hold), and consider limiting the hold to the lead (`use`) and to `phone`, or letting `facePlayer` through when the player is within interaction range.

**M2. Talking to a standing caller hangs up the call and the NPC then walks off to its chair mid-conversation.**
`npc-needs.js:4693` hangs up a call when the player chats with the speaker, so `s.call` becomes null and `needsStop` returns the home stop again. During the call the stop was null, so `seating.js:2308` cleared `_seatStopKey`. The home stop is therefore a fresh stop (`retry` false at `seating.js:2316`), and the only chat guard is on the retry path (`seating.js:2318`). `updateNeedsSeat` then calls `startSeatMove` (or a fetch), `updateSeatedNPC` returns true, and `npc-behavior.js:884` returns before the chat hold at `:892` can freeze the NPC. Result (by reading, not run): the player opens a chat with Tom on the phone and Tom walks to his chair and sits while the conversation is open. On main the owner stayed seated through the call, so this path did not arise. Suggested fix: skip a fresh stop too while `inChatWith` is true (move the chat check out of the `retry &&` clause), and add a test for "call hung up by a chat, no seat move until the chat ends".

**M3. NPCs with no pose frames now stand up for every call (behaviour change for poseless NPCs).**
`seating.js:2014` returns null for any `ns.call` regardless of pose frames, so a seated owner with sit frames but no `pose_phone` now unseats, stands with the idle frame for the whole call and then walks back to sit. On main it stayed seated and swivel was held (`idleMotionHeld({ call })`). The design note says so ("standing for the call applies regardless"), and the orchestrator decided that anyone answering stands, but the brief also requires that an NPC with no pose frames behaves exactly as on main. These two rules conflict; one has to give. If the main behaviour is to be kept for poseless NPCs, gate the null stop on the NPC having a `pose_phone` animation (the `hasPoseAnim` check the pose module uses). Raised for a decision, not as a code defect.

## Minor

**m1. Exits from the pose loop that skip `release()` can leave `_poseHoldFacing` on.** `npc-poses.js:309` (no behaviour), `:310` (`_mayPose` false after a texture change while the pose is still pending, not active), `:297` (`officeVisuals` false) and an NPC leaving `sys.states` while its pose is pending (the cleanup at `:366` releases only `active` ids). Each needs a texture swap or state change during the 150 ms settle window, so it is unlikely, but a stuck hold also silences the patrol dwell turn (`npc-behavior.js:1289`) and the route turn-back beat (`:2476`). Clearing the flag on every path that drops a pose (or in the `!key` and `continue` exits) closes it. Reload is safe: the flag lives on the behaviour object and is never saved.

**m2. An owner who is mid own-desk use when the phone rings turns to the PC, not the phone.** With a `using` job, `rec` is set, so the owner branch at `npc-poses.js:326` (`!rec && s.call?.phoneId`) is skipped, and the lead branch at `:340` turns to `obj`, the job target (the PC). `wantedPose` returns `phone` because of `s.call`, so the phone pose plays aimed at the PC. Usually close to the phone's direction, but not always. Prefer `s.call.phoneId` whenever `s.call` is set.

**m3. After that call, a standing `use` pose can flash at the PC before the re-seat.** When the call ends the job is still `using` the PC, the NPC is standing and not yet moving, so `wantedPose` returns `use` (machine, facing) and the pose plays after the 150 ms settle until the seat move starts (`npc-poses.js:351`). Cosmetic.

**m4. Test title claims more than it checks.** `test/js/npc-poses.test.mjs:418` says "an NPC with no use frames still turns but shows nothing", but the body only checks the chat case. The no-frames half is untested.

**m5. Missing tests for the hold's release paths.** Nothing checks that chat, hostility or a KO mid-pose clears `_poseHoldFacing`, or that an NPC with no pose frames never gets the flag. The existing release test (`npc-poses.test.mjs:448`) covers only the job ending. These paths are correct today (blocked leads to `release` at `npc-poses.js:358`, and `_mayPose` false skips the hold), so these are guards, not fixes.

**m6. Design note overstates the test claim.** `docs/achitechture/POSE_FIXES.md:20` says each new test failed on the old code. Run against main's engine, the chat-blocked case (`:418`) and the seated-colleague case (`:438`) pass. They are fine as regression guards; the sentence should say so.

**m7. Live proof script is tied to another worktree and has a stale comment.** `tools/playtest/npc-pose-live-proof.mjs:8` loads `playwright-core` from the `p-9-2-h` worktree's `node_modules` by absolute path, so it breaks when that worktree is cleaned. `:38-39` still says it rings only while Tom is standing; it now rings when he is idle with no job, seated or not, which is what the note describes.

**m8. The `call` input to `idleMotionHeld` is now unreachable in practice.** A seated NPC can no longer be on a call, so `call: !!ns.call` at `seating.js:2259` is always false after the first frame. Harmless; leave it or drop it with a comment.

## Checks with no finding

- **Re-seat after a call.** Normal end, early end and hang-up all clear `s.call` (`npc-needs.js:4731`, `:4761`). Because `_seatStopKey` was nulled during the call, the home stop is a fresh try with its counters reset, so the NPC sits again promptly. Hostile or KO mid-call hangs up (`npc-needs.js:4691`) and the NPC stays unseated while hostile, as on main. A reload mid-call comes back with no call (calls are client only) and the NPC sits at its post.
- **Seat claims and other NPCs.** The empty chair at the owner's post stays protected by `chairAtOtherPost` / `otherPosts` and `chairClaimedByOther`. A colleague answering a phone near someone's post now stands instead of possibly taking that post's chair, which is an improvement.
- **Swivel, patrol.** Swivel only runs while seated; calls no longer reach it. `needsStop` has one caller (`seating.js:2233`), so patrol is unaffected apart from m1.
- **Removing the `call` row** in `seating.test.mjs`: justified. With the new `needsStop` that row would unseat the NPC and test nothing about swivel, and `idleMotionHeld({ call: true })` is still covered at `seating.test.mjs:866`.
- **Poseless NPCs in the pose module.** `_mayPose` false continues before any hold or turn (`npc-poses.js:310`), so the facing change does not touch them (M3 is the seating side only).
- **Synced player_state.** Nothing in the diff touches player_state or server sync. `_poseHoldFacing` and `callTurn` are client-side only, and `seating.js` has no sync calls. No growth.
