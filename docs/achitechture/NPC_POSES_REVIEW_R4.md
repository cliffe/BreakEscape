# Player poses, review round 4

Scope: commit ae87b9030 (fixes for round 3, which found 0 Blocker, 1 Major, 4 minor), on branch
build/ol-poses with main merged at 99d2c6431. Files read: `public/break_escape/js/systems/player-poses.js`
(248 lines), the pose, phone-ringer and scripted-conversation-queue tests, and the three call sites of
`openWithPhoneLead` (`interactions.js:1815` and `:1837`, `npc-barks.js:985`). No live run and no code edits.

The merge at 99d2c6431 touched no pose code or pose test after ae87b9030 (`git diff ae87b9030 99d2c6431`
on `player-poses.js` and `test/js` is empty), so it cannot conflict with the pose work.

## Verdict on the round 3 fixes

| R3 | Real | Tested | Note |
| --- | --- | --- | --- |
| M1 minigame already open at the tap | Yes. `player-poses.js:158` calls `open()` before any timer or pose swap. | Yes: synchronous open, no timer, `cur.hold` kept, swap to a second chat keeps the hold. | The check sits after the `leadPending` branch, so a double tap during a lead still replaces rather than opens early. Correct order. |
| m1 per-frame cost | Yes. `_wantPhone` (`:179`) checks `has('phone')` first and `onMinigameStart` (`:191`) sets `phoneWanted` from it. | Yes: ten `update()` passes, zero `behaviors` reads. | See m-A for the one case where this over-corrects. |
| m2 reinstall | Partly. `dead`, `leadPending` and `leadOpen` are cleared and one fresh `once` listener is registered (`:237-241`), so there are never two live shutdown listeners. | Partly: see m-B. | Other state and the pending timer are not handled. |
| m3 behaviour tests | Yes. Ringer `answering` and scripted-call `phoneLead` now have behaviour tests. | Yes. | |
| m4 newest open wins | Yes. One timer, one open, the second caller's open runs (`:155`, `:161-166`). | Yes. | See m-C: a dropped open can carry a `startKnot`. |
| Sprite swap | Yes. | Both halves added. | |

Earlier lead-in races, re-checked against the new code:

- Double tap: second call replaces `leadOpen`, no second timer, `leadPending` cleared by the timer. Fine.
- KO during the lead: the timer re-checks `playerIsKnockedOut` and `isKO` at `:169`. Fine.
- Room change during the lead: the room change keeps the scene and the player, so the open runs. Same as before.
  Not a regression.
- Scene shutdown during the lead: `dead` set, the timer returns at `:167`. Fine, except the reinstall case in m-B.
- Another minigame opening during the lead: dropped at `:168`, and `leadOpen` was already nulled. Nothing lost
  that was not already dropped in round 3.

## Findings

### Blocker

None.

### Major

None.

### minor

**m-A. `phoneWanted` is decided once, from the direction at the start**
`player-poses.js:191` (`this.phoneWanted = this.has('phone')`). `has()` looks up the animation for the
player's current direction. If an atlas has the phone frames for some directions only, a chat opened while
facing a direction without them sets `phoneWanted` false for the whole call, and the per-frame retry never
runs, even if the sprite is later given a pose (the sprite-swap case the new test covers at the start of a
call but not mid-call). In the shipped atlases every direction has the frames, so the effect is theoretical.
Fix: keep `phoneWanted = true` for the open call and move the cost saving into a cheap flag, for example a
`this.hasAnyPhone` computed once per atlas (`scene.anims.exists` over the eight compass keys), or accept the
behaviour and add a comment saying so.

**m-B. Scene reuse leaves a stale timer and stale phone state**
`player-poses.js:238-241` and the lead timer at `:158-171`.
Scenario 1: a lead is pending (300 ms), the scene shuts down and restarts, then a new lead starts. The old
timer is still queued. It fires with `dead` false, so it passes the guard, and either runs the new lead's open
early and sets `leadPending` false while the new timer is still due, or (if no new lead exists) reaches
`run()` with `leadOpen` null, which throws `TypeError: run is not a function`. The `try` catches it and logs
`phone lead-in open failed`, so the cost is noise, but the early case can run the second open at under 300 ms
and then the second timer finds `leadOpen` null and logs the same error.
Scenario 2: a phone chat is open at the restart. `phoneWanted`, `phoneScene`, `phoneShown` and `cur` are not
cleared on reuse, so `_wantPhone` keeps trying to show a held phone with no minigame behind it until
`onMinigameEnd` runs, which a restart does not guarantee. The only in-game scene restart found is
`infusion-pump-minigame.js:152`, and its own scene key, so this path is rare.
The test (`test/js/player-poses.test.mjs`, "a reused instance after a scene restart") sets `leadPending` by
hand, so it never has a queued timer and never checks `leadOpen`, `cur` or the phone fields.
Fix: in the reuse branch also set `cur = null`, `phoneScene = null`, `phoneWanted = false`, `phoneShown =
false`. Give each lead a token (`const id = ++this.leadId`; the timer returns when `id !== this.leadId`,
and reinstall does `this.leadId++`), and guard `if (!run) return;` before the `try`. Add a test that
installs, starts a lead, shuts down, reinstalls, starts a second lead, then fires the first timer and
asserts nothing opens.

**m-C. "Nothing is lost" is slightly too strong for the replaced open**
`player-poses.js:155` and `npc-barks.js:972-985`. A notification click builds `go` with an explicit
`startKnot` (a jump), and the click has already removed its notification. If a second click or a call
arrives within 300 ms, the first `go` is dropped, so the first thread is not jumped to. The thread itself
stays in the phone's list and the second thread opens, so nothing unreadable is lost, but the jump is.
Fix: either keep this and word the R3 outcome as "the superseded open is dropped, its thread stays in the
phone", or have the replace path run the superseded open's `startKnot` side effects by queueing it
(`this.leadQueue`) and starting it after the newer one closes. Dropping is the smaller change and is
acceptable.

## Suite

`bin/test-js` run in full on the worktree at HEAD: 685 test files passed, 0 failed, 685 total.

R4: 0/0/3
