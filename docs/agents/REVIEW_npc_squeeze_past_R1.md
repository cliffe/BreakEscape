# Review: NPC squeeze-past, round 1

Commits: d35f8eae0 (needs walk squeezes past the player) and 243503e41 (engine part only: `pin_dusted`).

B0 M1 m9

## Scope and what holds

Read: `npc-behavior.js` (update, determineState, executeState, path follow, `_handleBlockerAhead`, the new pass helpers, `goToAndStay`, `cancelMove`, `_triggerGoToStayArrival`, detour and stall code), `npc-sprites.js` (collider, `handleNPCPlayerCollision`, `keepsRouteAgainstPlayer`, `collisionArrives`), the needs `moveTo`/stall/return code in `npc-needs.js`, `door-gates.js` header, and the new tests. Rendered all 189 scenarios and listed every NPC with needs plus guard, hostile, chase or gate traits.

- Exemptions: no scenario has a needs NPC meant to body-block. The guards with needs (m02 `hodan_warsame`, m03 `yusuf_demir`, test guards) only block when hostile, which is exempt. Len (the tailgate lever) is a patrol, so exempt. Gates are separate bodies, so the anti-tailgate rule is untouched.
- The pass ends at 28 px centre to centre; bodies are 20x10 and 18x10, so a normal end never separates overlapping bodies and never pushes the player into a wall.
- Conversation while passing: the needs-chat branch holds the NPC still and the pass stays; the walk resumes through the player afterwards. Fine.
- Performance: one filter and a hypot per walking NPC per frame; `isPassingPlayer` runs only in the collider's process callback on overlap. Negligible.
- No reload or room-change leak: `_playerPass` is in-memory and the blocker list is global.

## M

**M1. A near-target pass now ends the walk inside the player, and the next walk can start blocked by the player it is standing in.**
Before, a needs walk with the player at its target squeezed with the collider on, and `handleNPCPlayerCollision` arrived it on the bump (`collisionArrives`, within 48 px). Now the pass turns the collider off. That skips the collision callback, so the NPC walks on to its `arriveWithin: 6` use or pickup cell under the player. `_triggerGoToStayArrival` then clears the pass and the collider comes back with the bodies deeply overlapped (Arcade leaves them embedded). Failure: in lab_physical_pentest the player drops the BadUSB and stands on it. Sofia passes after 0.6 s, picks it up from inside the player's sprite, and her next walk (to her PC) sees the player at `fwd > 0` in her lane. She stands inside the player for another 2.5 s before passing again. This is the flagship beat the commit targets.
Fix: while a pass is active and the NPC is within `NEEDS_COLLISION_ARRIVE_PX` of `_goToStayDest` with the player touching, arrive there (as the collision used to), or keep the pass across arrival and the next walk until the bodies are clear. That means ending it on distance alone, checked from `update()` rather than only inside the path-follow branch.

## m

**m1. A pass is kept or ended only inside `_handleBlockerAhead`.** A pass that stops for any other reason re-enables the collider mid-overlap: arrival (M1), `cancelMove`, a script `goToAndStay`, the NPC turning hostile, or a KO. And `_playerPass` survives an owner change (a script move, hostility), gated only by `_mayPassPlayer`. A later needs walk revives an `active: true` pass and walks through the player with no wait. Fix: clear `_playerPass` in `goToAndStay` when the owner is not `needs` and in `setHostile`/KO, and end a pass by distance in `update()` when no path is being followed.

**m2. An unfinished timer carries into a different walk.** `goToAndStay` keeps an inactive `_playerPass` (meant for the 3 s re-issue of the same walk), so a new walk to another target inherits up to 2.4 s of an earlier block and passes almost at once. Fix: keep the timer only when the new destination equals the old `_goToStayDest` (or the same `moveId` family); otherwise reset it.

**m3. Opted-out NPCs lost the games 1099 to 1124 fix.** The old near-target `mustReach` squeeze applied to every needs walk. Now an NPC with `squeezePastPlayer: false` and the player on its pickup cell holds or detours until the job times out. Fix: keep the old bounded squeeze (`mustReach`) for opted-out needs walks near the target, or document that opting out also gives that up.

**m4. The README says "a job, need or interest", but every needs-owned move passes.** That includes the walk home with `yieldToPlayer: false` (stall re-issues, `_replanAbandoned`) and seating's chair fetch. Probably intended, but say so, or gate on the move kind.

**m5. The re-issue test does not re-issue.** "a needs re-issue ... does not restart the timer" only sets `b._avoid = null`. The real re-issue is `goToAndStay`, which also clears `currentPath` and `patrolTarget`, so frames skip `_handleBlockerAhead` until the path comes back. With a slow or failed path (`_pathRetryAfter` is 2 s) that gap exceeds `AVOID_PLAYER_BLOCK_GAP_MS` and resets the timer: the original bug again. Fix: drive the test through `goToAndStay(..., { owner: 'needs' })` and a pathfinder that answers a frame later, plus one case where the path answers after more than 1 s.

**m6. "arrival or a cancelled walk ends the pass" tests only `cancelMove`.** Add an arrival case. No test or recorded live proof shows the NPC actually moving through the player in Phaser (collider returning false plus velocity). The demo scenario exists, but the commit has no live run. Per the live-proof rule, add a headless run of `test_npc_squeeze_past` (setFPS 20, fixed step on) that asserts Sam reaches the coffee with the player parked in the west gap, and that Opal does not.

## pin_dusted (243503e41)

There is no PIN leak: the payload is `{ targetType, targetId }` only, and the digits stay in `pinDustKnown` and the DOM as before. A refusal does not emit. A reopen through `restoreDust` does not emit. The door id is `connectedRoom`, the canonical room id that `/unlock` uses.

**m7. A second emit is possible after a reload.** `restoreDust` is async. A Dust click before it resolves (or after it failed on a network error) passes the `this.dustSet` guard, calls `pinDust(..., true)` and emits again for a lock dusted before the reload. Ruth's mapping is `onceOnly` with an idempotent `setGlobal`, so it is harmless there, but the guide says "once per fresh dust". Fix: have the server say whether this call made the dust new (`body.fresh`) and emit only then, or disable the button until `restoreDust` settles.

**m8. The object id falls back to `name`.** `getTargetId` returns `scenarioData.id || scenarioData.name || objectId`. A dustable object with no `id` emits its display name, which a `data.targetId === "<id>"` mapping never matches. Fix: the validator could warn on a `dustable` lock with no `id`, or the guide could say `targetId` is the object's `id`.

**m9. A client event sets a debrief global.** `window.eventDispatcher.emit('pin_dusted', { targetId: 'p4_safe' })` from the console sets `kp_safe_dusted`. It only adds one debrief line, so this is best-effort under the cheat-resistance policy. Note it, and don't use the event for scoring or a capture. If it ever matters, set the global server-side in the `pin_dust` endpoint.

## Outcomes

Fixed in the follow-up commit (engine, tests and this file only):

- **M1**: `_tickPlayerPass` runs every frame of a walk (before the path-follow branch). An active pass within `AVOID_PLAYER_ARRIVE_PX` (48, the old collision radius) of `_goToStayDest` arrives the walk, so the NPC uses or picks up from outside the player's body and the next walk does not start inside it. Test: arrival inside and outside the radius, stopped short of the player.
- **m1**: the same tick ends a pass by distance when no path is followed, or when the walk may no longer pass (owner change, hostile, KO). `goToAndStay` drops the pass for a non-needs owner or a new destination; `setHostile(true)` clears it. Tests for each.
- **m2**: the block timer is kept only for a needs re-issue of the same destination; any other walk starts afresh. Test.
- **m3**: an NPC with `squeezePastPlayer: false` gets the old bounded near-target squeeze (`mustReach`) back. Test.
- **m5**: `goToAndStay` marks a kept timer `reissued`, so the one frame gap while the path is fetched (up to the 2 s retry) is not counted as the block lapsing. Tests now drive the real `goToAndStay` with a path returning after 100 ms and after 1.5 s, plus a case where a true lapse still restarts the timer (the 1.5 s case fails without the fix).
- **m6 (arrival half)**: arrival and `cancelMove` both covered by tests. The headless Phaser run of `test_npc_squeeze_past` is not done here; the live-proof agent on :3060 owns it.
- **m7**: `restoreDust` records its in-flight promise and `handleDust` awaits it, so a click before it settles cannot dust or emit a second time. If the restore request itself fails on the network, a later dust can still emit again; a server-side `fresh` flag would close that, left for the server owner.
- **m8**: `pin_dusted` carries `getEventTargetId()` (object `id`, then `objectId`, never the display name). Requests to the server still use `getTargetId()`. Test.

Not changed:

- **m4**: the README sentence ("a job, need or interest") is outside this commit's allowed files. Every needs-owned move passes, including the walk home and the chair fetch; reword the README or gate on move kind when the README is next edited.
- **m9**: left as best-effort under the cheat-resistance policy. A console `pin_dusted` can set `kp_safe_dusted`, which only adds a debrief line. The event must not be used for scoring or a capture. If it ever matters, set the global in the `pin_dust` endpoint.
