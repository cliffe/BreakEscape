# Pose fixes: review round 2

Branch `build/ol-pose-fixes`, tip 70b84a01e. Scope: the R1 commits after 52d520f12 (9ff06552d, 7e2229e9e, 70b84a01e) and a fresh read of `git diff main...HEAD` (engine files `npc-behavior.js`, `npc-poses.js`, `seating.js`, the two test files and the live proof script). Review only, nothing fixed.

Counts: **0 blocking, 0 major, 4 minor.**

Method: read the diff and the code around it (`NPCBehavior.update` chat block, `updateSeatedNPC` / `updateNeedsSeat`, the call runner and `_hangUp` in `npc-needs.js`, `inChatWith`, the minigame manager's child-minigame path, the NPC atlas animation builder in `npc-sprites.js`, `utils/npc-lookalike.js`). Ran `test/js/npc-poses.test.mjs` (35 pass) and `test/js/seating.test.mjs` (79 pass) on the branch. Ran the branch's two test files against the pre-R1 engine (`git archive 52d520f12`): the four new R1 pose tests other than the release-paths test fail there, and both changed seating tests fail, as they should. Looked at the four live crops.

R1 findings: M1, M2, M3, m1, m2, m4, m5, m6, m7 and m8 are fixed as described in `POSE_FIXES.md` "R1 fixes". m3 was left alone; see below.

## Minor

**m1. A chat that opens a child minigame lets the NPC start its seat walk mid-conversation.**
`seating.js:2314` and the chat hold at `npc-behavior.js:892` both key off `world.inChatWith`, which is true only while the open minigame is the person-chat for that NPC (`npc-needs.js:5263-5269`). When the chat hands over to the NPC's inventory (container minigame) and is restarted afterwards (`container-minigame.js:2236-2241`, `startMinigame('person-chat', ..., { fromTag: true })`), `inChatWith` is false for the child's lifetime. A Tom whose call was just hung up by the chat then starts his fresh home stop, and when the chat resumes the move carries on, because the `_seatMove` branch (`seating.js:2237-2240`) runs before the new guard and `updateSeatedNPC` returning true skips the chat hold. Result (by reading, not run): the player comes back from the give or inventory screen to a Tom walking to, or sitting in, his chair. Nothing sticks: he ends up seated, which is where he belongs. The same gap existed on main for any needs NPC whose stop changed mid-chat. If it matters, treat `window.pendingConversationReturn?.npcId === id` as still in chat for these two guards.

**m2. `_chatFaced` is reset only on a frame that gets past the seat early return.**
`npc-behavior.js:903` clears the flag, but `npc-behavior.js:884-887` returns first whenever `updateSeatedNPC` is true (a seat move, a step off, or seated). After the M2 path (chat ends, home stop starts at once) the flag stays true through the walk, the sit and the whole seated spell, and is cleared only on the first standing, non-chat frame afterwards. If a chat opens before that frame, for example as Tom steps off his chair for the next call and the player clicks him, `faceForChat` is skipped: the pose loop still drops the hold (chat blocks the pose), but the NPC is not turned to the player. Narrow. Clearing `_chatFaced` before the seating call whenever `inChatWith` is false closes it.

**m3. `hasPhonePose` ignores `officeVisuals: false`.**
`npc-poses.js:293-297` checks frames and `npcAllows` only, while the pose loop does nothing when `gameScenario.officeVisuals === false` (`npc-poses.js:305`). In such a scenario an NPC with phone frames still stands for every call (`seating.js:2015`) and shows only its idle, where main kept it seated. No scenario sets `officeVisuals: false` today, so this is latent. Returning false from `hasPhonePose` when the visuals are off keeps the M3 rule ("stands only when the pose will show").

**m4. Test gaps.**
- The wiring of `faceForChat` in `NPCBehavior.update` (called once per chat, the `_chatFaced` reset) has no unit test; `npc-poses.test.mjs:576` calls the method on a fake object only. The live proof (`tom-chat-facing.png`) covers the real path once.
- `hasPhonePose` itself is never tested against real animations or a `poses` list; both seating tests stub it (`seating.test.mjs:1672`, `:1681`, `:1697`).
- The "reload" half of `npc-poses.test.mjs:531` checks a freshly built rig, which cannot fail. The claim is true (the flag lives on the behaviour and is never saved) but the assertion proves nothing.
- `npc-poses.test.mjs:425` says "drink, no use" but the rig has `phone` frames; the comment is wrong, the assertion is fine.

## The questions asked

**Can the hold still stick?** No path found. It is set only at `npc-poses.js:367` when the shown (or settling) pose is `use` or `phone`, and every other outcome clears it: no key leads to `release()` (`:365`, `:279`), a `drink` or other pose clears it on the spot, and the `holding`/`held` sweep (`:392-393`) clears any id that was not re-held this frame, which covers `_mayPose` false, a missing behaviour, an NPC leaving `states` and `officeVisuals` off (the loop is empty, so the sweep clears all). `faceForChat` clears it at chat start. The only way to keep it is an exception thrown inside `update()` every frame before the sweep (the `postupdate` wrapper swallows it), which would break poses as a whole anyway. The hold does last a whole call or a whole non-brief machine use, so a passer-by is not faced during it; that is the agreed behaviour (only a conversation wins).

**Does `faceForChat` run in the other chat kinds?**
- NPCs not under needs control: no, and it does not need to. The pose loop iterates `npcNeedsSystem.states` only, so a non-needs NPC never gets the hold, and its `face_player` state runs during a chat as on main.
- Phone-chat: no. `inChatWith` is person-chat only (`npc-needs.js:5268`). The NPC in the room is not the one being spoken to face to face, the call or use pose carries on and nothing should turn it. Correct.
- A chat started by the NPC (an approach that opens a person-chat): yes. `inChatWith` reads the open minigame's `npcId`, not who started it, so the turn happens on the first frame of the chat either way. A bark opens no minigame, so there is no turn, which is right. During an approach the NPC is moving, which blocks the pose and drops the hold before the chat opens.
- Seated needs NPCs never reach the chat block (`updateSeatedNPC` returns true); the swivel faces the player as on main (`seating.js:2264-2267`). A static chair does not turn, as on main.
- Note for the record: `faceForChat` now turns every standing needs NPC to the player at chat start, not just a posing one. On main a standing needs NPC was not turned at all once the chat opened (R1 M1). This matches the decision and is an improvement.

**M2: can the NPC end up stuck standing?** No. The guard at `seating.js:2314` returns before `_seatStopKey` is written, so the stop stays fresh and starts on the first frame after the chat closes (it runs in the scene update, before the pose loop's `postupdate`).
- Room change: the chat is modal, so the player cannot leave mid-chat; the NPC's behaviour keeps ticking after the chat and the stop starts then.
- Reload: chats and calls are client only (`s.call` is not restored), the behaviour is rebuilt with no `_seatStopKey`, and the NPC sits at its post as after any reload.
- Minigame: a child minigame lets the stop start early (m1), the opposite of stuck.
- A colleague whose phone job was hung up by the chat: `_hangUp` zeroes `useRemaining`/`useUntil` (`npc-needs.js:4763-4766`), so the job ends when the freeze lifts and `needsStop` stops returning null.

**M3: is the phone-frames check cheap and right for SAME_ART copies?**
- Cost: `needsStop` (`seating.js:2015`) evaluates `hasPhonePose` only while `ns.call` is set or a phone job is `using`, thanks to the `&&` order. Each call is one `getNPC` lookup and at most eight `anims.get` lookups, per calling NPC per frame. No caching needed.
- SAME_ART: pose animations are keyed by NPC id and built from the NPC's own atlas JSON (`npc-sprites.js:420`, `npc-${npcId}-${type}-${dir}`). `derek_lawson.json` and `kevin_park.json` carry `pose_drink`, `pose_phone` and `pose_use` like their originals (`male_office_worker_v2`, `male_nerd_v2`), so the check is right for them. A lookalike swap (`utils/npc-lookalike.js`) changes the NPC's sprite before its animations are built, so the check follows the swapped atlas too.
- The check is "any direction has frames", while the pose plays only if the current direction has them (`npc-poses.js:361-362`). Every atlas with phone frames today has all eight directions, so this does not bite.

**m3 (R1), the post-call `use` flash at a PC: acceptable.** `wantedPose` returns null for a plain PC, so only a PC given `affordance.pose: "use"` could flash. Even then, with the home stop free to start, the seat move starts in the scene update of the frame the call ends, before the pose loop runs in `postupdate`, so `_seatMove` blocks the pose. A flash needs the seat start to be delayed (provisional home, retry not due) and also lasts at least the 150 ms settle. Cosmetic and rare; leave it.

**Are the tests real?** Yes, with the gaps in m4. Against the pre-R1 engine (52d520f12), these fail: R1 M1 narrow hold, R1 m1 exits, R1 m2 owner turns to the phone, R1 M1 `faceForChat`, the `needsStop` frames test and the M2 chat hang-up test. The release-paths test passes there, as expected for guard tests (R1 m5 asked for guards). The controls added for R1 m6 make the chat-blocked and seated-colleague cases able to fail.

**Synced player_state growth:** none. The diff touches no server code, no `player_state` and no sync call. `_poseHoldFacing`, `_chatFaced`, `holding` and `callTurn` are client-side, per behaviour or per pose module, and `callTurn` is pruned with the other maps when an id leaves `states` (`npc-poses.js:394`).

## Live crops

- `tom-phone-crop.png`: Tom standing behind his desk, `pose_phone` facing down. Correct.
- `tom-use-crop.png`: Tom facing right at the coffee machine (down-right of him), arm out, `pose_use`. Correct.
- `tom-chat-facing.png`: the player is up-left of Tom and Tom faces up-left (back of head to the camera). Turned to the player mid-pose as M1 asks.
- `tom-chat-call.png`: Tom standing at his desk in profile, facing right towards the player during the chat that ended his call. The blue ghost over his torso is the PC's proximity hint (`interactions.js:502-522`, a 20% blue copy at depth 9000 because the player stands near the PC), not a depth or pose fault.

## Checks with no finding

- `directionToObject` aims at the object's centre (`npc-poses.js:117-127`), and the lead turn happens once per use (`rec.turned`), once per call (`callTurn`), so a chat can still turn the NPC away and the pose loop does not turn it back.
- The owner on a call while `using` its own PC turns to the phone (`s.call?.phoneId` branch first, `npc-poses.js:339-345`).
- Poseless NPCs: the pose module skips them before any turn (`_mayPose`), and `needsStop` keeps their post stop for a call, so they stay seated with the swivel held (`idleMotionHeld({ call })`, `seating.js:2260-2262`), as on main.
- `faceForChat` respects `config.facePlayer` false (no turn, hold still released), as `facePlayer` does on main.
- `npc-pose-live-proof.mjs` imports `playwright` from the repo's `node_modules`; the comments match what the script does.
