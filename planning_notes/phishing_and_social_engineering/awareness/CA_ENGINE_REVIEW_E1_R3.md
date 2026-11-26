# CA engine review: E1 side-door gates, round 3 (delta)

Scope: commits ac2497809 and e9b08acc2 against the R2 findings (`CA_ENGINE_REVIEW_E1_R2.md`, 016090c68), plus the open question on R2 m4 now that E4 has landed (3ea4d7316, eb488bb2c). Code read at the worktree HEAD.

**Totals: 0 B, 0 M, 3 m.** The R2 live-proof major (M1) stays open and is not counted here.

## Tests run (each alone, `bin/test-js`)

door-gates-r2-fixes, door-gates-side, lock-step-unlock-system, e4-mapping-actions, npc-walk-gate, door-gates-r1-fixes, engine-fixes-pass4b, locked-hint-refusals: all PASS.

## R2 fixes: verdicts

- **m1 (corridor and reassert exit): fixed.** `_unmarkAll` (`door-gates.js:390-399`) unmarks at `g.x/g.y` and at every sprite's own `worldX/worldY`, and is used at all three places that unmark (`:329` adoption, `:377` reassert, `:761` close). `unmarkDoor` matches a stored side corridor within 2 px (`npc-pathfinding.js:984-986`), so a corridor stored at the clicked sprite is now dropped. The reassert exit (`doors.js:996-1003`) is guarded by `rg && !byNpc`. From outside, `clickOutcome` has no side effect (`inert_enter`, `pass` and `denied` only return), so the only effect is the intended `exitOpen` when the player is in the secured room. See m2 for one non-click route to it.
- **m2 (handshake for a loaded room, refusal when live): fixed.** `enterThroughInertGate` (`doors.js:817-835`) now always calls `loadRoomBehindDoor` with `skipLoad` for a loaded room. The cache write is guarded by `!window.rooms?.[room]`, so no stale entry. A live window gets `refuseAtGate` (bark and `door_gate_denied`).
- **m3 (one request, sound first): fixed, no bypass.** `props.locked` is always a boolean on a door sprite (`doors.js:525`), so the pre-load branch (`:681-688`) always sends the handshake (`:790`) and `preHandshake` is set whenever the branch ran. `handleUnlock` with `opts.handshake` (`unlock-system.js:1054-1062`) acts only on the server's own response: success goes to `unlockTarget`, failure or a null response (network error) shows "Access denied", and a cancelled second step is silent. An ordinary door cannot skip the server: with no pre-load (room already loaded, or `locked` true) `preHandshake` is null and the old path runs in full. One request, one `unlockTarget`, one `openDoor` per click; `needsLoading` is false afterwards (`doors.js:977`). Sound order is right: `lock` plays before the load (`:684`) and the handshake path does not play it again (`unlock-system.js:1052` is bypassed by the early return). Two small changes of behaviour, neither a defect: a transient network error on the pre-load handshake now ends in "Access denied" with no retry (before, `handleUnlock` asked again and said "Failed to verify access"), and a click on a gate-to-be (secured-room sprite, outer room unloaded) now plays the lock click before `exit`.
- **m5 (warning on openDoor of a gate): fixed** (`doors.js:933-937`, log only).
- **m6 (plan text): fixed.**
- **m4: see below. Recommend fixing now.**

## Findings

**m1. R2 m4 is still open, and it is reachable through the walkers' proximity opener.**
`npc-walk.js:823-833` (`openDoorsNear`), `doors.js:1135-1141` (`openDoorForNpc`), `:977` (`needsLoading` false for `byNpc`), `:994` (`processRoomDoors` runs at once).
A walk-in or walk-out opens any unlocked closed door within `DOOR_OPEN_PX` of the walker in the walker's, far or home room, and skips only sprites that are already gates. In the ca12 shape (learner starts in the secured room, outer room not yet loaded) the secured room's door to the outer room is a pending, ordinary-looking sprite. A walker who passes it opens it by proximity: `openDoor` runs with `byNpc`, does not load the far room, and `processRoomDoors` immediately removes wall tiles, destroys the sprite and leaves the stored side corridor. When the outer room loads later, its gate group has one sprite and a doorway that is open for good. The `ensureLoaded(d.far)` calls in `chooseEntry/chooseExit` (`:535`, `:710`) protect only the door the walker routes through, not one he walks past. E4 has landed and is not editing `npc-walk.js` now, so the blocker on m4 is gone.
Smallest fix, one line in `doors.js` `openDoorForNpc`, after `:1138`: `if (!window.rooms?.[props.connectedRoom]) return false;`. Loading a room creates and registers its door sprites synchronously (R1 B1 note), so a loaded far room means the gate has been adopted and the `isGate` check on the next line then protects it. A routed door always has its far room loaded first, so no walk changes. A walker next to a door to an unloaded room simply does not open it, as for any unusable door. Test, in `door-gates-r2-fixes.test.mjs`: `openDoorForNpc` on an unlocked pending sprite whose `connectedRoom` is not in `window.rooms` returns false and leaves `openDoor` uncalled; with the room present it opens as before. I have not added it, because it fails until the fix lands.

**m2. A non-click unlock of a gate-to-be exits the player.**
`doors.js:996-1003`. `processRoomDoors` is reached from any `unlockDoor` (person-chat `#unlock_door`, `npc-workarounds.js`, `unlockTarget`), not only from a click. If the player stands in the secured room when such an unlock lands on the pending sprite, the reassert is followed by `clickOutcome`, which calls `exitOpen` and opens the gate for one hold window with no click. Before this round the gate was destroyed for good, so it is better than it was. No shipped scenario does this. Fix when convenient: pass a flag from the click path (or test `isRepeatInteraction`-style click recency) so only a player-initiated open takes the exit.

**m3. A second click during the pre-load repeats the handshake and `openDoor` (carried over, not new).**
`doors.js:681-688`, `isRepeatInteraction` (300 ms). While `loadRoom` is in flight, a second click after 300 ms enters the same branch: second lock sound, second handshake (the room is still unloaded), and after the shared load a second `unlockTarget` and `openDoor` on a sprite the first call may already have destroyed. This was equally true before R3 (two `handleUnlock` calls), so it is not a regression, and the R2 m3 test covers one click only. Fix when convenient: a per-sprite in-flight flag set around the pre-load that returns early on a second click. I did not check what a second `openDoor` on a destroyed sprite does.

## Note

`enterThroughInertGate` ignores the handshake's answer when the room is already loaded (`doors.js:823-826`), so a refused handshake still opens the gate. That matches the cheat-resistance policy (client-side gate, objects refused server-side for an unpromoted route room) and is not counted.

## Verdict

**CLEAN apart from the live proof** for the R2 fixes (m1, m2, m3, m5, m6 all real, no regression found). One small fix list for E1: m1 above (the one-line `openDoorForNpc` guard plus its test) now that E4 has landed. m2 and m3 can wait. The R2 live proof (the three runs listed in R2 M1) is still owed before E1 is called done.
