# Lab UX, interface items: adversarial code review, round 2 (2026-11-12)

Branch `build/lab-ux-ui` at 03e72a5bd against `main`. Scope: the R1 fixes (c590d35ff, f7a90c8c9, 8ebb2a63f, 03e72a5bd), a check of every R1 finding, the test and live proof the fixer left out (m1, m2), a fresh read of the whole branch diff, and the question of the server's sign-in at an attended PC.

Live checks ran on keyless servers on :3057 and :3087 (this worktree's code, checked by the served `pc-sessions.js`). Games created: 1515, 1518 and 1521 (lab_vulnerabilities), 1516 and 1517 (test_gate_tailgate), 1534 and 1541 (test_access_signin). 1534 was served by another worktree's server that took :3057 after this review stopped its own, so nothing from it is used; 1516 and 1518 were set-up runs.

Counts (new in this round): 0 blocker, 0 major, 1 minor, 5 nit. R1's nits n1 to n5 are still open and carried at the end.

## R1 findings

| R1 | Verdict | How checked |
| --- | --- | --- |
| M1 container return only after the player's own close | Fixed | Code: `closeByPlayer()` is the only way `closedByPlayer` is set (base Close, Cancel, Esc; the reader's Close, minimise, Esc). A hit, `closeMinigameForKnockout`, a forced `endMinigame` and a displacing `startMinigame` all leave it unset, and `containerReturnBlocked` also stops a return after a hit in the 100 ms gap, a knockout, a busy framework or a room change. The notes viewer reads the same flag through `lastCloseWasOwn`, set in `cleanup()`, which `endMinigame` runs before `onComplete`. The fixer's live run (game 1471) covers all five close paths; `container-shares.test.mjs` covers them in unit tests. |
| M2 no sign-in screen from a return | Fixed | Live, game 1541, Ian's PC: desktop, Staff handbook.txt, then `pcSessions.displaced('ian_pc', ...)` while the reader was open. `endedUnseen` held "Ian Shaw has signed in at this PC"; own Close went to the world with that toast, and `openLoginSignIn` was never called. Second case: the server session ended by POST /logout with the client's copy kept; own Close reopened the desktop, got the 403, went to the world with "Signed out", and again no sign-in screen. `loginPcId` is set for every non-NPC container with `lockType: 'login'`, so the check in `returnToContainerAfterNotes` and the `fromReturn` 403 branch cover the same PCs. |
| M3 sustained walk-away | Fixed as asked, one gap left | `WalkAwayTracker` needs 300 to 600 ms of samples, 10 px of travel away, an 8 px wider gap, still moving away now, and no closing by the player; never hostile, never with `knockbackTimer`. The follower and knockback cases from R1 no longer count (fixer's live games 1502 and 1495; unit tests). See R2-m1 below for the case it now misses. |
| M4 Open from the dialog returns | Fixed | `openFileInPlace` arms the return for every container; the transfer dialog is only offered on a sign-in desktop (`offersTransfer`), never in NPC mode, so `npcOptions: null` is right. Fixer's live proof (game 1471, Licence keys.csv) and a new container-shares test. |
| m1 toast waits for the tool | Fixed | New test and live proof below. |
| m2 far gate click re-checked | Fixed | New test and live proof below. |
| m3 more-below cue | Fixed | The observer now follows the list's first child (re-pointed after every render), `document.fonts.ready` rechecks, and `destroy()` disconnects the observer and removes the resize listener. Covered by the fixer's panel test. |

### m1: proof supplied
- Live, lab_vulnerabilities, Lab Sheet Workstation picked up through `handleObjectInteraction` on the world sprite, with the inventory POST delayed in the page and the notification container watched:
  - Answer after 423 ms (game 1515): tool open at 1017 ms, closed at 3603 ms, the "added to inventory" toast shown once at 3732 ms and kept its full 5 s. Before the fix this was the glimpse-then-replay case.
  - Answer after 81 ms (game 1521): tool open at 1060 ms, closed at 3616 ms, toast shown once at 3685 ms. Before the fix this toast was dismissed after about 0.8 s.
  - Nothing was shown while the tool was open in either run.
- Tests (scratch file, not committed; see R2-n5): the pick-up-then-open branch calls `expectPanelWithin(1500)` before `addToInventory` for lab-workstation, workstation, phone, mail_terminal and vm-launcher; and with the real notifications.js, a toast raised 50 ms or 400 ms after that call, with the tool opening at 1 s, is not shown while the tool is open and is shown exactly once after it closes. Both pass; the second fails without the `expectPanelWithin` call, so it tells the cases apart.

### m2: proof supplied
- Live, test_gate_tailgate game 1517, `visitor_pass` set, the gate held open in the page as a guard's hold does, the player six tiles south, a real canvas click on the gate:
  - A, gate open the whole way: `pendingGateWalk` armed, the player walked to the near side, the walk was re-checked in reach and he went on through (track office (66,188) ... (61,59), staff_room (48,26) ... (48,-55)).
  - B, gate shut 600 ms into the walk: he stopped on the near side, office (51,38), with the pending walk spent on reaching the door, and the gate stayed shut. As with a far click on a shut gate, nothing is said.
  - C, arrow key pressed 200 ms after the click: the click-to-move path was cancelled and the pending walk dropped; he did not go through.
- Test (scratch file): `updatePendingGateWalk` lifted from game.js and run against stubs: far, nothing yet; in reach and still open, one walk to the far side; in reach and shut, no walk and the pending walk spent; stopped short after 400 ms, dropped (not before); dropped at 10 s and for a destroyed door. Passes.

## Minor

### R2-m1 q55 (d) A player who has just walked up to the desk does not see the leaving owner give way
`walkingAway` refuses when the player moved more than 4 px towards the NPC over the window, measured against the player's sample nearest the NPC's oldest one. That keeps a follower out, but it also catches the common way the case arises: the player walks to the PC as the owner gets up and leaves in the same direction. Run against the real tracker (player walking north at 150 px/s and stopping at the desk at t = 400 ms; the owner standing, then walking north at 90 px/s from t = 300 ms): with the player standing all along she counts from 480 ms; with the player just arrived she counts only from 960 ms, 560 ms after he stopped, by which time she is 60 px off. The fixer's live note says Dana's walk to the coffee takes under half a second, so for a player who has just arrived there is no moment where a tap on the PC beats her. The tap still opens a conversation with her, as before q55 (d).

Fix (either): measure the player's closing only while he is moving now or within the last 150 ms of samples, so a player who has stopped at the desk counts as standing; or, as R1 suggested, give way when the needs system says she has just left her post and the tap is on her own workstation (`npc_left_post`, `home.objectId`), with the tracker kept only for other NPCs. Add a test for "player arrived, then tapped".

## Nit

- R2-n1 (d) `updatePendingGateWalk` runs in `update()` with no check for an open minigame. If a conversation opens on the walk with the player already in reach (a sight challenge, a scripted call), the re-check can call `movePlayerToPoint` under the panel and he walks through when it closes. The test_gate_tailgate challenge shuts the gate (`closeDoor`), so it does not happen there; not reproduced elsewhere. Skip the step while `MinigameFramework.currentMinigame` is set, or drop the pending walk when one opens.
- R2-n2 game.js: `allNpcSprites`, `pendingGateWalk` and `updatePendingGateWalk` were inserted between the JSDoc of `findNPCAtPosition` and the function, so that comment ("@returns NPC sprite if found") now heads `allNpcSprites`. Move the new block above the comment.
- R2-n3 (b) `openFileInPlace` now arms `pendingContainerReturn` for any item with text, before handing it to `handleObjectInteraction`. A text file or note spends it; any other type with `text` that a scenario puts on a sign-in desktop as a takeable file would leave it armed, and a later note read in the world would reopen the desktop (the notes viewer has no `cameFrom` test). The M2 check limits the damage to a PC that still has a session. Arm it only for `text_file` and notes types, or give the notes viewer the same `cameFrom` test (this is R1's n2 from a new entry point).
- R2-n4 (b), pre-existing, not reproduced: Add to notes from a file read out of a container sets both `pendingTextFileReturn` and `pendingContainerReturn`. On the notes viewer's own close both returns fire at 100 ms: the container opens, the reader reopens over it (ending it), and closing the reader then goes to the world because the container return was spent. The same order exists on `main`; noted because this branch's aim is "back to the container".
- R2-n5 The m1 and m2 tests above are in this review's scratch file only (`uxui_r2/zz-r2-review-scratch.test.mjs` in the session scratchpad), as asked. They should be added to `test/js/lab-ux-ui.test.mjs`; the m2 one reads `updatePendingGateWalk` out of game.js by text, so a small export from a module of its own would be a sturdier home.

## Carried from R1 (still open, unchanged)
n1 m02 Planted Network Device toast after the phone thread; n2 `cameFrom` matching on the name alone; n3 the east/west branch of `walkThroughTarget` cannot run; n4 the far side chosen from the doorway's centre line; n5 the broken Notepad icon in the test_gate_tailgate screenshots.

## The sign-in at an attended PC (fixer's note on `attempt_login!`)

Agreed: best effort, client flow, no server change needed. Under the cheat-resistance policy the server must hold the secret, and `attempt_login!` does: the password is checked on the server, failures count towards a server-side lockout, `pc_admits_account?` decides who may use the PC, and reachability and footholds are checked. "The owner is at the desk" is a fact about where an NPC is standing, which only the client knows (NPC positions and the needs cycle run in the browser), and it is not a secret: a player who knows the password is meant to be able to sign in, and through a foothold may already do so wherever the owner is. Getting round the "in use" step needs either a console call or a client path like R1's M2, which this round closes. So the residual risk is a player using the console to sign in with a password he already has, which the policy accepts. It does not need a backlog item of its own; if one is written, it belongs with the shelved gated-door server check as a later hardening.

The password-free route is the owner claim (`claim_login_session!`), which also has no presence test and logs the client's globals without trusting them. It is part of the access model, not this branch, and was not reviewed here; mentioned only so that it is not confused with the password path.

## Checked and clean

- No new path reaches `openLoginSignIn` from a return: the text-file network-screen return calls `startContainerMinigame` without `fromReturn`, but only for network screens, which take the `this.remote` 403 branch first.
- `endedUnseen` is cleared when a desktop registers and when the message is taken, so a stale end message cannot show after a fresh sign-in at the same PC.
- `pendingGateWalk` is cleared by every pointerdown before the minigame check, set only by a far click on an open gate, and dropped by keys (the path cancel clears the module's `isMoving`, so the 400 ms rule ends it).
- `announcePickup` is only called from world pickup paths; container takes, NPC gives and `give_item` stay quiet, as R1 found.
- No em or en dashes in added lines; no new imports that need a harness copy list beyond the three stubs already updated.

## Tests run (affected files only)

- `test/js/lab-ux-ui.test.mjs` 19 pass; `test/js/container-shares.test.mjs` 23 pass; `interaction-warning` 13, `wearable-hooks` 4, `notifications-plain-default` 10, all pass.
- Every test file that imports notes-minigame, pc-sessions, player-damage-interrupt, door-gates, text-file-minigame or objectives-panel: 40 files, all pass (bin/test-js -j 3).
- Scratch file (the 19 above plus the three R2 tests): 22 pass.
