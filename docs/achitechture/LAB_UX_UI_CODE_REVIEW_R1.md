# Lab UX, interface items: adversarial code review, round 1 (2026-11-12)

Branch `build/lab-ux-ui` at 2ad7bad74 against `main`. Scope: the user's answers q53 (a) to (d) and q55 (d), as described in `LAB_UX_UI_BUILD_LOG.md`. Read: the whole diff, the build log, the six screenshots in `lab_ux_ui/`, and the code each change leans on (inventory.js, interactions.js pickup paths, container-minigame.js returns, notifications.js holds, pc-sessions.js, unlock-system.js sign-in, door-gates.js, player-damage-interrupt.js, knockback.js).

Live checks ran on a keyless server on :3046 (games 1435 to 1443).

Counts: 0 blocker, 4 major, 3 minor, 5 nit.

## Major

### M1 (b) A reader closed by a hit or a knockout reopens its container
`TextFileMinigame.cleanup()` arms the return on every close, whatever closed the reader. player-damage-interrupt.js closes the open minigame on a hit (`complete(false)`) so the player gets control back to run or fight, and `closeMinigameForKnockout` does the same when the KO screen shows. 100 ms later the return finds no minigame open and reopens the drawer or desktop.

Live proof (m01 game 1443, IT room PC, "Server Access Log", `MinigameFramework.startMinigame` hooked): own Close: `start:container`; `complete(false)` as a hit does it: `start:container`; `closeMinigameForKnockout()`: `start:container`. So a player attacked while reading is put straight back behind a panel, and after a knockout the container opens over the KO screen. A scripted conversation queued with `startDelayMs` over 100 (npc-manager.js `_queueScriptedConversation`) also ends the reader, then finds the reopened container and defers.

The notes viewer has the same gap already (notes-minigame.js reopens in `onComplete` whatever the outcome); this branch extends it to text files, which are the common case on PCs.

Fix: return only when the reader closed by its own Close or Esc (set a flag in that handler and read it in cleanup), or at least skip the return when `window.minigameClosedByDamage?.()` or the player is knocked out. Do the same in the notes viewer while there. Add a test for each close path.

### M2 (b) A sign-in desktop whose session ended while the reader was open reopens as the PC's sign-in screen
The desktop unregisters from pc-sessions.js when it closes for the reader, so an owner coming back (`ownerReturned`), a screen auto-lock or a displacement while the file is open finds no desktop: `_closeDesktop` does nothing and no "<owner> is back at the desk" line is shown. When the reader closes, the return reopens the desktop; `loadLoginDesktop` gets a 403, drops the local session and calls `openLoginSignIn(lockable)` 50 ms later.

`openLoginSignIn` has no presence check (that is step 1 of `interactLoginPc`, which this path skips), so the sign-in screen for that PC opens wherever the player stands, with the owner seated at it, and the player can sign in from there. Before this branch the reader closed to the world, so the gap was only reachable through a notes item on a desktop.

Not reproduced live (it needs an NPC needs cycle timed against the reader); the chain is read from container-minigame.js 338 to 377, pc-sessions.js 349 to 360 and unlock-system.js 302 to 330. Ask whether the server's sign-in also refuses an attended PC; if it does not, this is a way round the access model's "in use" rule.

Fix: before a return to a container whose lockable has `lockType: 'login'`, check `window.pcSessions?.has(pcId)`; without a session, drop the return and show the session-end message the closed desktop would have shown (pc-sessions.js could keep the last end reason per PC for this). Never fall through to `openLoginSignIn` from a return.

### M3 q55 (d) The walking-away test also catches a player following an NPC, and a hostile NPC in knockback
`npcWalkingAway` is true for any NPC moving at 10 px/s or more with velocity pointing away from the player. Two common cases meet that test and are not "an owner leaving their PC":

1. A player following a walking NPC to talk to them (a patrolling guard, an office-life NPC on a routine). Seen from behind, every walking NPC is walking away. A tap on them while their sprite overlaps any interactable object (a PC or monitor on the desk behind them, a filing cabinet, a notice board) now goes to the object: `objectUnderTap()` uses `findObjectsAtPosition`, sprite bounds only, with no reach limit, so the player walks off to that object, or opens it if it is in reach. The pick list path does the same through `leavingNpc`. With E, a walking NPC takes a 30 000 penalty, so anything else in range within 30 degrees of facing wins.
2. Combat. `applyKnockback` (utils/knockback.js) sets the NPC's body velocity to 250 px/s directly away from the player for 250 ms after every hit. A left click on a hostile NPC (which punches through `tryInteractWithNPC`) in that window, with any interactable sprite under the tap, uses the object instead: in a fight next to desks, the second jab can open a PC or a drawer.

So yes, the player can be unable to talk to a walking NPC by clicking them while they cross furniture; they have to wait or click a part of the sprite that overlaps nothing.

Fix: narrow the test to the case the user described. Use the needs state (npc-needs.js knows the NPC's mode and `home.objectId`; `npc_left_post` marks the moment) so an NPC gives way only while leaving its post, only for a tap on its own workstation (or an object within a tile of it), and only for a few seconds after leaving. Never for a hostile NPC, and never while `sprite.knockbackTimer` is set. Add tests for the follower and knockback cases.

### M4 (b) "Open" in the Copy / Move / Open dialog on a sign-in desktop still closes to the world
A takeable file on a local sign-in desktop shows the transfer dialog (access model 5.1). Its Open goes through `openFileInPlace`, which sets `pendingContainerReturn` only for network screens (container-minigame.js 917 to 920). For a local desktop no return is set, `cameFrom` is false, and the reader closes to the world. Only non-takeable files (the `handleInteractiveItem` path) come back, which is the path the live proof used (Dana's "Staff notice.txt").

Fix: in `openFileInPlace` set the return for every container (keep the network-screen branch as it is), and add a container-shares test for Open from the dialog.

## Minor

### m1 (a) Pick-up-then-open types: the toast is a glimpse, then replayed or cut short
For the phone, workstations, lab workstation, mail terminal and VM launcher the toast is raised when `addToInventory` answers and the tool opens at 1 s. notifications.js pulls back an info or success toast younger than 0.7 s when a minigame opens and replays it on close, and dismisses an older one. With a server answer slower than about 0.3 s (likely on Hacktivity), "Picked up X" or the workstation line shows for a moment, vanishes under the tool and comes back when it closes: the F13 / F24 "shown twice" pattern. With a fast answer, the 5 s workstation message ("You can now use it for cryptographic analysis") is dismissed after about 0.8 s. The old workstation branches were unreachable, so this is new behaviour in all these missions and every lab (Lab Sheet Workstation).

On :3046 the spy saw one `gameAlert` per pickup, as expected; the glimpse is a display effect the spy cannot see.

Fix: call `window.expectPanelWithin?.(1500)` before the add in that branch, as the other auto-open paths do, so the toast waits for the tool and shows once when it closes.

### m2 (d) A far click on an open gate commits to a walk the gate may not hold for
`walkThroughTarget` is decided at the click. A gate held open by a passing guard stays open for `holdMs` (2.5 s by default) after the guard leaves; a click from six or eight tiles away takes about that long to walk. The player then arrives at a shut gate, is pressed against its body and nothing is said. Before, a far click stopped on the near side. Not dangerous (the body still bars him) but it reads as the game ignoring the click.

Fix: for a far click, either stop on the near side as before and let a second click (in range) walk through, or re-check `walkThroughTarget` when the path reaches the doorway and stop short with the gate's hint if it no longer answers.

### m3 (c) The cue can be stale after content grows without a render
The ResizeObserver watches the list element's own box. A late font load, or an aim folding without a `transitionend` on the list itself, changes `scrollHeight` with no resize, scroll or render, so the cue shows or hides one step late until the next event. Also, `destroy()` leaves the window `resize` listener and the observer attached.

Fix: observe the list's first child (or a wrapper round the rendered HTML) as well, call `updateMoreBelow` after `document.fonts.ready`, and disconnect both in `destroy()`.

## Nit

- n1 (a) m02 "Planted Network Device": its `item_picked_up:phone` mapping opens the phone thread straight away, so "Picked up Planted Network Device" is held and shows after the conversation closes, a minute or more later. Harmless, slightly odd.
- n2 (b) `cameFrom` matches on the file's name alone. A stale return (a delegated locked item whose PIN pad was cancelled leaves `pendingContainerReturn` set) plus a world file with the same name sends the player back into the old container. Matching on the item object, or an id where there is one, would close it.
- n3 (d) The east/west branch of `walkThroughTarget` cannot run: `register()` declines a gate on a side door. Its tests exercise a case the game never builds. Remove it, or say in the comment that it is for a future side gate.
- n4 (d) The far side is chosen from `feet.y` against the doorway's centre only. A player standing in the doorway past the centre line is walked back the way he came.
- n5 The test_gate_tailgate screenshots show a broken Notepad icon in the inventory. Not caused by this branch as far as I can tell (no inventory art changed); noted so it is not lost.

## Checked and clean

- (a) Live sample on :3046, every world takeable in each game picked through `handleObjectInteraction` with `gameAlert` and `showNotification` spied: m02 (1437), m03 (1441), m07 (1435), m08 (1438), sis02 (1440), lab_physical_pentest (1436). Each pickup raised exactly one pickup toast; keys ("Plant Maintenance Key", "Deeds-room key", "Filing Cabinet Key"), text files (m08, held until the reader closed), badges, the RFID cloner, coffee and first aid all once. Notes raised none, as intended. Task and objective toasts that follow a pickup are separate messages, not doubles.
- No `item_picked_up` mapping in m01 to m10, the sis scenarios or the labs shows a toast of its own (they send phone messages, set globals or complete tasks). Container takes, NPC gives and `give_item` actions do not call `announcePickup`, so scripted gives and keys handed over in a reveal stay quiet.
- (d) A barred gate still bars: `walkThroughTarget` returns null when `openToPlayer` is false, and the door bodies (`blocksPlayer`) are the real barrier whatever the path says. `openToPlayer` and `_playerBarred` agree on `playerMayPassIf` and `careful`, so the click cannot get ahead of the body rule. The walk-out from inside is always allowed and lands two tiles past the doorway; pathfinding snaps a blocked target to the nearest walkable cell.
- (c) The cue's CSS uses no pseudo-element a theme already uses on the panel; collapsed hides it; the screenshot shows the fade and arrow on the themed panel (the plain theme was not checked).
- Unit tests: `test/js/lab-ux-ui.test.mjs` 15 pass, `test/js/container-shares.test.mjs` 18 pass.

## Rails suite

Run under the shared lock on 2ad7bad74: 1796 runs, 25577 assertions, 0 failures, 0 errors, 1 skip. Green.
