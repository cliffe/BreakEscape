# Pose fixes: review round 3

Branch `build/ol-pose-fixes`, tip ed7270e0a (contains main df8772d17). Scope: 2cbcff2eb and f6f01fdea (the R2 fixes), and the merge ed7270e0a against Train 117's `npc-behavior.js` and `npc-sprites.js` changes. Review only, nothing fixed.

Counts: **0 blocking, 1 major, 4 minor.**

Ran `node --max-old-space-size=2048` on `test/js/npc-poses.test.mjs` (39 pass), `seating.test.mjs` (80 pass) and `npc-chat-resume.test.mjs` (4 pass). No full suites, no db tasks.

R2 findings m1 to m4: m2 (flag reset placement), m3 (`hasPhonePose` with `officeVisuals:false`) and m4 (test gaps) are fixed as described. m1 is fixed for the clean close but opens the major below.

## Major

**M1. A stale `pendingConversationReturn` freezes the NPC for the rest of the session.**
`inChatWith` now returns true whenever `window.pendingConversationReturn` names the NPC with type `person-chat` (`npc-needs.js:5345-5347`). The only things that clear it are `returnToConversationAfterNPCInventory` (`container-minigame.js:2221-2258`), which runs from `ContainerMinigame.complete()` (`container-minigame.js:2038-2060`), and the card reader's own return (`rfid-minigame.js:802-806`). A container that ends without `complete()` leaves it set:
- `forceCloseMinigame()` calls `endMinigame(false, null)` directly (`minigame-manager.js:445-448`). `player-damage-interrupt.js:8` says in terms that a hit, a knockout or a conversation closes the minigame with "no complete()", and calls it at `:107`, `:112`, `:200`, `:206`. `minigames/index.js:79` also calls it.
- `startMinigame` displaces a running minigame with `endMinigame(false, null)` (`minigame-manager.js:72`, `:86`), for example a call or any interrupting scene opening over the inventory.
- `complete()` with `pendingContainerReturn` set (the notes hand-over, `container-minigame.js:2043-2046`) skips the return; if the notes step ends the same way, it is stale too.
- `showNPCInventory` writes the pending state before `startContainerMinigame` (`npc-game-bridge.js:384-393`); if the container does not open, nothing ever clears it.
Nothing else clears it (grep of `js/` finds no other writer to null), and a reload is the only reset. Before R2 a stale value was inert. Now `inChatWith(tom)` stays true for ever: `NPCBehavior.update` holds him still with zero velocity every frame (`npc-behavior.js:926`, `:937-947`), the seat code never starts a stop (`seating.js:2314`) and holds the swivel, the pose loop drops his poses (`npc-poses.js:311`, `:325`), every call he gets is hung up on the spot (`npc-needs.js:4752`), and the scheduler and job checks skip him (`npc-needs.js:1434`, `:2204`, `:4573`, `:4613`). A player who is hit by a hostile while Tom's inventory is open leaves him a statue.
The R2 live proof closes the inventory with `__test.minigame.close()` (`npc-pose-r2-live-proof.mjs:46`, `:50`), which goes through `complete()`, so it never meets this path. A fix would clear the pending return when the child ends by any route (the framework's `endMinigame` cleanup, or a check in `inChatWith` that the current minigame is the child or the restarted chat, or a timestamp/age limit).

## Minor

**m1. The live proof script does not fail.** `tools/playtest/npc-pose-r2-live-proof.mjs` has no assertion and no `process.exit` or `process.exitCode`; it prints the JSON report and exits 0 whatever happened (`:66-68`). Line 6 hardcodes `/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/...` as the Chromium executable (no fallback, no env override). There is no worktree path in it, and the game id and port come from argv, but the run only works on this machine and a reader has to eyeball the output. The R1 script is the same style. It should compute pass/fail from `everSeatedOrMoving`, `everNotChat`, `stillStanding` and `turned`, and exit 1.

**m2. A restart that throws is rethrown and the chat is lost silently.** The `finally` in `container-minigame.js:2254-2256` clears the pending return even if `startMinigame` threw, so the NPC is freed (good, no stuck state), but the exception escapes the `setTimeout` callback as an uncaught error and the player is left with no chat and no message. The `finally` also clears it when `startMinigame` returns without opening anything. Not new behaviour (the old code nulled the state first and lost the chat the same way), but the R2 note says the return is cleared "after the chat has restarted", and that is only true on success. No test covers the failure.

**m3. The card reader still has the gap R2 closed for the inventory, and the comment says otherwise.** `npc-needs.js:5343-5345` says the card reader's return is covered "and cleared only after the chat restarts", but `returnToConversationAfterRFID` nulls the pending state up front (`rfid-minigame.js:806`) and restarts the chat 50 ms later (`:812-826`). For about 50 ms `inChatWith` is false, so the seat guard can pass in that window (smaller than the inventory gap, and one frame at 20 fps can land in it). Either use the same clear-after-restart pattern there or correct the comment.

**m4. Test coverage of the new return code is thin.** `npc-chat-resume.test.mjs:52-68` runs the real function (extracted by regex into `new Function`), and the gap assertion fails on the old code, so it is real. It does not cover: a second call during the 50 ms delay (the `resuming` guard, `container-minigame.js:2236-2238`), `startMinigame` throwing, the `phone-chat` branch, or the force-close route that causes M1. `seating.test.mjs:1717-1744` and the `chatRig` tests in `npc-poses.test.mjs` are real and would fail on the old code (R2's table of failing and guard tests matches the titles; labels are honest). `npc-poses.test.mjs` m3 restores `globalThis.gameScenario = {}` rather than the previous value (a leak into later tests if one sets it).

## The questions asked

**Can `inChatWith` stay true for ever?** Yes, on a force close, a displaced container or a failed open: see M1. Abandoned returns that do reach `returnToConversationAfterNPCInventory` clear it (success or throw). Room change: the container is modal, so the player cannot change room during the step; a displacing event is the M1 route. Reload: `window` state is rebuilt, so it cannot survive (matches R2 for chats).

**Restart fails?** Pending is cleared in `finally` regardless; see m2. If `window.MinigameFramework` is missing it is cleared at once (`:2234-2236`). The `resuming` flag makes a second call inert, but a second call arriving after a failed first one finds the pending state already null.

**`_chatFaced` placement.** Correct. The reset (`npc-behavior.js:926-927`) runs after the invalid-sprite and `body.enable` returns and before the seat early return, so every frame of a seat move or seated spell clears it, and a chat that opens as he steps off turns him. A hidden NPC returns first and keeps the flag, which is harmless: the first frame after the reveal resets it. A chat that spans the inventory hand-over counts as one chat, so he is turned once, not again on resume (an improvement). The chat block turns once at `:942`.

**`hasPhonePose` with `officeVisuals:false`.** Correct and consistent with the pose loop (`npc-poses.js:294` against `:306`, both read `gameScenario.officeVisuals`). The test has a visuals-on control.

**Merge ed7270e0a against Train 117.** `git diff df8772d17 ed7270e0a` on `npc-behavior.js` and `seating.js` shows only this branch's changes, so the merge added nothing of its own and has no conflict markers. The patrol settle grace (`_settleGraceUntil`, `SETTLE_GRACE_MS`, `npc-behavior.js:36-40`, `:1261-1291`, `:3283-3295`) and the `hasPatrolWaypoints` arrival guard in `npc-sprites.js` run in the patrol and bump-avoidance paths after the chat block; a chatting needs NPC returns before them with zero velocity, so no settle is stamped and the pose hold is not touched. `faceForChat` does not read the grace. The hidden-hostile changes (`npc-sprites.js:225-248`, `npc-hostile.js`) act on `body.enable`, which `update` already tests before the `_chatFaced` reset; a hidden NPC cannot be chatted with and the hold is cleared by the pose sweep. No interaction found.
