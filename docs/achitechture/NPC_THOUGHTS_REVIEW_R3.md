# npcThoughts review R3: proof rerun

Question: did commit aa417656b (the phone-talking guard in `_talking`, the null-line mutter in `_sayMutter`) stop icons or picture chat when the flag is on? Answer: no. The weak R3 rerun was variance in the proof, not a regression.

## Reading the diff (faff59b48..aa417656b)

- `_talking` now skips a desk-phone item only when it has neither a line nor a picture. An item with a picture still counts as talking.
- `_sayMutter` gains an `else if (!this._thoughtsOn())` branch. With thoughts on it never runs.
- The flag is read live on every call (`gameScenario.npcThoughts !== false` in `npcThoughtsOn`, and in `update()` of npc-action-icons.js), so flipping `window.gameScenario.npcThoughts` after load takes effect on the next frame. Nothing is cached at world creation.

## Live proof

Keyless server on port 3093 from the worktree, headless, setFPS(20), fixed steps on. Phases `far,near`, 60 s each. Old commit = the two engine files (npc-needs.js, npc-action-icons.js) checked out from faff59b48 into the same tree, restored afterwards. Counts are max icons visible / max thought bubbles visible / picture bubbles seen. The flip runs use test_npc_thoughts_off with `FLIP=1`, ravi and tess forced to coffee. Controls are test_needs_sims.

| Commit | Run | Game | Icons / thoughts / pictures |
| --- | --- | --- | --- |
| aa417656b | control A | 7065 | 4 / 1 / 0 |
| aa417656b | control B | 7067 | 4 / 1 / 0 |
| aa417656b | flip, chase script | 7064 | 2 / 1 / 1 |
| aa417656b | flip, chase script | 7066 | 2 / 1 / 1 |
| aa417656b | flip, fresh game | 7113 | 0 / 2 / 0 |
| aa417656b | flip, fresh game | 7114 | 2 / 1 / 1 |
| aa417656b | flip, fresh game | 7115 | 0 / 2 / 0 |
| aa417656b | flip, forced every 10 s | 7117 | 0 / 2 / 0 |
| aa417656b | flip, forced every 10 s | 7118, 7119, 7120 | 2 / 1 / 1 each |
| faff59b48 | control A | 7077 | 4 / 1 / 0 |
| faff59b48 | control B | 7079 | 4 / 1 / 0 |
| faff59b48 | flip | 7076 | 0 / 2 / 0 |
| faff59b48 | flip | 7078 | 2 / 1 / 1 |
| aa417656b | m02 off, staff_room | 7084 | 0 / 0 / 0, 6 spoken bubbles |

Both commits show the same two outcomes on the flip run: either the two NPCs act (2 icons, 1 thought, 1 picture) or they stay at their desks for the whole phase (0 icons, 2 parked thoughts, no talking turns at all). The second outcome is the "0 icons, 2 thoughts, 0 pictures" of the earlier R3 rerun, and it also happens at faff59b48, so aa417656b did not cause it. It depends on where the NPCs start (the idle runs started at y 129 to 135, the active ones at y 201 to 243). The control never shows a picture in either commit: test_needs_sims has one talker (tom) and no pair.

## Proof script changes

- No Escape key press. It opened the pause menu, which blocked `enterRoom`. A person-chat or title minigame is closed with `__test.minigame.close()`, then `dismissBlockingUi('Resume')`, as the other playtest scripts do.
- `room:a+b+c` walks one door at a time (m02 needs six hops from the lobby to staff_room).
- The needs are forced again every 10 s, and the player is walked beside any NPC that is saying a picture, so the bubble is in view. The summary now carries `pictureTurnTicks`.
- The idle-start case is not forced away. Count a flip run as valid only when `turns` lists a talking turn; rerun otherwise.
