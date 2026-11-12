# Tap pick fix: build log

Branch `build/tap-pick`, from main 72e26f911. Sources: UX access R1 build log, finding 6
(`build/ux-access`), and the C3 replay's U3 row (`build/c3-replies`,
ACCESS_MODEL_SLICE_9_2_C3_BUILD_LOG.md).

## Cause

In game.js's scene `pointerdown`, `gatherInteractablesNearClick` lists every interactable in
reach whose bounds hold the tap or whose centre is within a tile of it (the tap slop). When it
found exactly one, `pointerdown` acted on it at once, before the NPC and object branches that walk
to the thing under the pointer. So an in-reach item beside the tap took it from an out-of-reach
object or NPC the pointer was actually on:

- U3: Kim knocked out drops her stick and her phone, 16 px apart. From where the player stands
  the phone is in reach and the stick is not; a tap on the stick picked up the phone.
- Finding 6: Omar sits over his PC, his 80 px frame covering it. With the PC out of reach and
  Omar in reach, a tap on the PC opened a conversation with Omar.
- Found live in m01 (same class): Sarah behind the reception desk, out of reach; a tap on her
  head opened the in-reach note within slop of it.

## Fix

New module `public/break_escape/js/systems/tap-pick.js` (no imports, node-testable):

- `tapPickList(candidates, farUnderTap, toCandidate, farOthers)`. When an out-of-reach
  interactable object, or an out-of-reach NPC, holds the tap in its bounds, candidates that are
  only near the tap drop out. Candidates under the tap stay. Far objects under the tap join them
  as "walk there, then use" entries, so the seated owner over his PC gives the pick-one menu
  ("Omar Haddad", "Omar's PC"). A far NPC joins no menu. With nothing in reach under the tap the
  list is empty and the existing NPC or object branch walks to the thing under the pointer.
- `objectStandPoint(obj, player, deps)`: the walk target for an out-of-reach object, moved
  unchanged out of `pointerdown`.
- `createPendingTapUse(deps)`: an object tapped from out of reach is used once the walk ends in
  reach. It is dropped by any new tap, when the walk stops short (not moving and out of reach
  400 ms after the tap), after 10 s, when the object goes, or when a minigame opens.

game.js:

- `gatherInteractablesNearClick` marks each candidate `underTap` (its own bounds hold the tap).
- `pointerdown` builds the far lists (objects under the tap that are out of reach, not seats,
  in the player's own room; the NPC under the tap if out of reach and not walking away), runs
  `tapPickList`, then the existing chair and leaving-NPC filters.
- `useObjectInReach`, `walkToObjectThenUse` and `farObjectCandidate` replace the inline code.
  The far object branch now walks and then uses the object on arrival; a seat still queues a sit,
  and swivel props still move to the tapped point.
- `pendingTapUse.update()` runs in `update()` after the gate walk; `pointerdown` clears it.

Unchanged: the in-reach menu, chairs, leaving NPCs, doors, floor taps and hold-to-walk, and the
far NPC walk (taps on far NPCs still walk only, they do not talk on arrival). Touch uses the same
`pointerdown` path.

## Tests

`test/js/tap-pick.test.mjs`, 26 tests: the five finding 6 cases (phone and stick; seated owner,
PC out of reach, tap under him gives the menu, tap clear of him walks to the PC; seated owner with
both in reach keeps the menu; memo next to an NPC keeps the menu; tap on a seated NPC's head
talks), U3 (stick tap walks to the stick; phone tap takes the phone; both in reach gives the
menu), the m01 far NPC case and a leaving NPC, `tapPickList` on its own, `objectStandPoint`
(aim, no walk, snapped aim, wall), the pending use (used once on arrival, not while walking,
dropped when stopped short, taken, minigame, timeout, new tap) and the game.js wiring.

Run without the lock (every file that reads game.js or the interaction code): tap-pick,
interaction-chair-picks, interaction-reach, interaction-room-rule, interaction-walls,
interaction-warning, lab-ux-ui, ending-credits-audio, rfid-cloner-click-guard,
rfid-keycard-click-guard, toast-click-through, behind-wall-fade, character-textures,
desk-footprints, engine-fixes-engine-a, fight-styles, global-sync-declared, item-drop,
npc-hostility-persistence, npc-needs, npc-reports-load-order, player-health-persistence,
player-regen, screen-states, social-engine-batch13, social-feed, social-fun-engine,
social-game-gating, vm-weave-engine: 29 files, 0 failures. No test imports game.js, so no
harness copy list needed the new module. No Rails code changed.

## Live proof

Keyless server on :3066 from the worktree, headless, setFPS(20) with fixed steps on and the
setTimeout loop. Taps are `window.__test.clickAt` (mouse events on the canvas).

| Check | Game | Result |
|---|---|---|
| U3 | 1796, 1799 | main has no `kim_phone` yet (it is on the unmerged C3 branch), so each game's stored scenario had Kim's phone added to her held items (that game row only). KO drops the stick at (168, 129) and the phone at (152, 129), stick out of reach, phone in reach, as in the replay. A tap on the stick's centre walked to it and picked it up ("Picked up Kim's USB stick"); the phone stayed on the floor. In 1799 the pickup was traced to `tap-pick.js` `update` (the pending use); server: `kim_usb` in the inventory, `u1_kim_gave_usb` true, `objects_added` empty |
| Finding 6 | 1807 (test_access_habits, omar_room) | Omar seated, PC out of reach, Omar in reach: a tap on the PC's top-left gives the menu "Omar Haddad" / "Omar's PC". Choosing the PC arms the walk and use, but the player stops against Omar: the only stand point in reach of the PC is where he sits (the same walk as before the fix). With Omar at the coffee machine, a tap on the PC from 100 px away walked into reach and opened the sign-in panel (PasswordMinigame) on arrival |
| m01 regressions | 1791 | Floor tap walks to the point. A far tap on the reception desk phone walks and opens it on arrival (PhoneChatMinigame). A tap between the phone and the directory, both in reach, gives the two-item menu. A tap inside Sarah's frame within slop of the in-reach directory no longer opens the directory. Two taps on Sarah from in front of the desk: walk, then conversation (PersonChatMinigame). A far tap on the locked door walks to its near side; a tap in reach shows "Locked: Requires key" |

Games created: 1788 (probably; made in the same second as another agent's game), 1790 (unused),
1791, 1792, 1794, 1796, 1799, 1807. Server stopped; all session processes stopped.

## Notes and open points

- Picking a seated owner's PC from the menu walks into the owner and waits; the use is dropped
  after 10 s. The PC cannot be reached while he sits there, which matches the game (his PC is in
  use), but the walk gives no message. A stand point search that avoids NPC bodies, or a line
  such as "Omar is using it", would be a separate change.
- Far NPC taps still only walk (no talk on arrival); the brief's "walk, then interact" is done
  for objects only.
- Far doors under the tap do not drop in-reach items near the tap; doors were left out.
- A far NPC whose 80 px frame covers an item: a tap on the item's own bounds still takes the
  item (it is under the tap); a tap on the frame's empty part near the item now walks to the NPC.
- The harness's `clickAt` dispatches on the canvas, so it cannot close the pick-one menu (the
  menu's backdrop takes outside taps in a real browser). Close it with a pointerdown on the page
  outside the menu, as done here.
- When Sarah is behind the m01 desk and the player stands close beside it, the NPC branch's
  stop-short point can lie across the desk, so a tap on her does nothing until the player moves
  round to the front (unchanged by this fix).

## Commits

- ec5645538 A tap goes to the thing under the pointer (objects); walk code moved to tap-pick.js
- 6f3190a3f An out-of-reach NPC under the tap counts too (m01 finding)
- this log

## R1 fixes

From TAP_PICK_CODE_REVIEW_R1.md (0 blockers, 2 majors, 6 minors, 3 nits). Main (33c003230)
merged first, no conflicts.

### What changed

- M1, tap-pick.js `opaqueAt(sprite, x, y, alphaAt)`: the tap is on an opaque pixel of the
  sprite's current frame (origin, scale, flipX and trimmed frames allowed for), read with
  `scene.textures.getPixelAlpha`; bounds when there is no pixel test. An NPC counts as under the
  tap only on her figure: the in-reach NPC candidate's `underTap`, and a far NPC in `farUnderTap`.
  `tapPickList` now: an in-reach hostile in the gathered list returns the list as gathered (the
  jab, or the old in-reach menu), and an in-reach NPC on her figure under the tap wins with no far
  entries (no menu with a far object). Far objects still join a menu with in-reach objects under
  the same tap (coffees over a far workstation).
- M2, unlock-system.js: step 1 of `interactLoginPc` is now `pcUserAt(pcId)`,
  `pcInUseBy(lockable)` (null for a headless host or a switched-off PC, which say something
  else first) and `showPcInUse(lockable)`, the only place "X is using this PC." is written (with
  the toast and `inUseShown`). `walkToObjectThenUse` asks `window.pcInUseBy` before walking and
  shows the message instead. The PC stays in the menu, so picking it explains why.
- m1: `walkToObjectThenUse` arms the use only for an object of the player's own room; one of
  another room is walked to only, as on main.
- m2: `farUnderTap` (tap-pick.js) takes the far NPC only when she is in the player's room, on
  her figure, and not walking away.
- m3: `npcYieldsToObject` (tap-pick.js): in the NPC branch, an interactable object of the
  player's room under the tap (not a seat) takes the tap when it is drawn above her and the tap
  is on its pixels, or when the tap is off her figure. A hostile never yields.
- m4: `createPendingTapUse` takes `busy` (minigame, pick-one menu or a `.game-confirm-overlay`
  dialog), and the E key (player.js) calls `window.__clearPendingTapUse()` before interacting.
- m5: the pending use records the feet at each update; the 10 s limit and the stopped-short
  400 ms count from the last progress (2 px), and a walk that is on a path but has not moved for
  1 s is dropped (walking into a seated owner, then used 8 s later when he leaves).
- m6: test/js/tap-pick-handler.test.mjs cuts game.js's own pointerdown handler and the helpers it
  calls out of the source text (a small brace scanner) and runs them with the real tap-pick.js
  and interaction-reach.js, stubbing only reach, rooms, movement and the menu. The old rebuilt
  pipeline in tap-pick.test.mjs is gone; its cases (U3, finding 6) run through the real handler.
- n1: see "Unchanged" below. n2: `findObjectsAtPosition` uses `getBounds()` (old maths as the
  fallback). n3: a far menu entry's detail starts "Walk over and use it."

Unchanged, on purpose: far doors stay walk-only (a far door under the tap is not used on
arrival; an open door's own zone fires when the player gets there). Do not "fix" doors to match
far objects.

### The Sarah case

The review's tap at (166, 64) from (126, 71) in m01 lies on an opaque pixel of the Building
Directory (reception_area_notes_1, depth 91, drawn above Sarah at 81) and on an empty part of
Sarah's 80 px frame: her figure ends near x 143, and no pixel of her figure lies inside the
directory's bounds. So under the M1 rule that tap now walks to the directory and reads it (no
menu, NotesMinigame), as a tap on the PC showing through Omar's frame goes to the PC. A tap on her
head (128, 15) from the same spot talks to her with no menu. A tap on her head at (128, 30) gives
the in-reach menu "Visitor Sign-In Log" / "Sarah O'Brien", as on main (the log is in reach and
within the slop; no far object is under that tap).

### Tests

tap-pick.test.mjs 26 pass; tap-pick-handler.test.mjs 15 pass. Every test file that imports or
reads a changed module (game.js, player.js, tap-pick.js, unlock-system.js, interaction-menu.js,
or the "is using this PC" text): 50 files, 0 failures, run without the lock.

### Live proof

Keyless headless server on :3170 from this worktree, setTimeout loop, setFPS(20), fixed steps
on. Taps are `window.__test.clickAt` on the canvas; the player was placed with `body.reset` before
some taps.

| Check | Game | Result |
|---|---|---|
| Sarah, far directory | 1836 (m01) | From (126, 71): tap (166, 64) walks and opens the directory (NotesMinigame), no menu; tap (128, 15) on her head talks (PersonChatMinigame), no menu |
| Far object | 1836 | From (160, 160): tap on the reception phone walks, arms the use, opens PhoneChatMinigame on arrival |
| In-reach menu | 1836 | From (126, 71): tap (128, 30) gives "Visitor Sign-In Log" / "Sarah O'Brien" |
| Object in another room | 1845 (test_access_habits, start omar_room, noor_room unlocked) | From omar_room, tap on noor_pc: walks into noor_room, no use armed, nothing opened |
| Seated owner's PC, plain tap | 1845 | Omar seated, PC out of reach: tap (190, 110) on the PC through his frame shows "Omar Haddad is using this PC." with the observations, no walk; tap (160, 125) on his figure talks |
| Seated owner's PC, menu | 1845 | omar_coffee moved over the PC's corner for this check (client only): tap gives "Omar coffee" / "Omar's PC" (detail "Walk over and use it. ..."); picking the PC shows the in-use toast, no walk |
| U3, Kim's stick | 1849 (test_access_social, start u1_room) | Kim KO'd (debugKO), stick at (168, 129) out of reach, phone in reach: tap on the stick walks and picks it up ("Picked up Kim's USB stick"), phone stays on the floor, `u1_kim_gave_usb` true |
| Hostile over a far object | 1845 | Omar made hostile, in reach; tap on the far PC through his frame: `playerCombat.attack` at Omar, no menu, no use armed |
| E key on the way | 1845 | Far tap on sign_h3, then E while walking: the pending use dropped, the sign not opened. Same tap without E: walks and opens the sign on arrival |

Games created: 1836 (m01), 1837 (test_access_habits, unused), 1838 (test_access_social, unused),
1845, 1849. Server and sessions stopped.

### Open

- The menu entry for an in-use PC says "Walk over and use it." although picking it only shows
  the in-use message; the detail could check `pcInUseBy` too.
- `objectStandPoint` still does not route round NPC bodies (review M2, later).

## R2 fixes

Against docs/achitechture/TAP_PICK_CODE_REVIEW_R2.md (0 blockers, 2 majors, 5 minors, 5 nits).
No player_state or sync change: the pending use is still one object reference in client memory.
The only new UI is toast and menu detail text through the existing `gameAlert` and pick-one
menu, so the pixel-art rule is not engaged.

### What changed

- **M1.** `createPendingTapUse` counts feet movement as progress only while click-to-move is
  active, so a keyboard walk leaves `progressAt` alone and the 400 ms stopped-short drop fires.
  `updatePlayerKeyboardMovement` (player.js) also clears the pending use, as the E key does.
- **M2.** An in-reach NPC is under the tap only when the tap is on her figure and no
  interactable object of the player's room (not a seat) drawn above her is opaque there
  (`npcCovered`, which is `npcYieldsToObject`). With nothing else in reach under the tap the pick
  list is empty, and the NPC branch sends the tap to the object: walk then use, or the in-use
  message for a seated owner's PC drawn in front of him.
- **m1.** An in-reach object under the tap on its own pixels (`onObjectPixels`, not a chair)
  drops in-reach NPCs not under the tap (`tapPickList`). A tap on her uncovered figure within an
  object's slop keeps the menu. Hostiles are left as gathered.
- **m2.** `opaqueAt` passes untrimmed frame coordinates to `getPixelAlpha` (Phaser subtracts the
  trim itself) and uses the trim only for the empty-margin test.
- **m3.** `farObjectCandidate` asks `pcInUseBy`: the entry reads "<name> is using it." plus the
  observations, and stays selectable so picking it shows the in-use toast.
- **m4.** A blocked walk (on a path, feet still for a second) now toasts "Someone's in the way."
  when an NPC is within a tile of the player's feet, otherwise "Something's in the way."
  (`onBlocked`). Routing `objectStandPoint` round NPC bodies is still open.
- **m5.** `opaqueNear`: an NPC's figure counts with a 2 px slop (5 x 5 pixel tests, only once the
  exact pixel misses). Used for the in-reach NPC, the far NPC (`farUnderTap`) and the yield test
  on her side; objects keep the exact test.
- **n1.** A flipped frame reads texel `w - lx`, clamped to `w - 1`.
- **n2.** test_access_habits: a far tap on `noor_pc` records `pc_in_use` and completes
  `h10_never_leaves` from across the room. Kept as intended (the task is about trying her PC, and
  she is in plain sight at it); PLAYTEST.md run 4 says so, so testers do not report it.
- **n3.** tap-pick-handler.test.mjs lists every free name in the cut source statically (strings,
  comments, template text and regex literals removed, then declared names, properties and object
  keys left out) and fails naming any the harness does not pass in. A second test proves the
  check finds a name. A regex after `return`, `typeof` or `case` is read as a regex. The harness
  also reads `playerIsMoving` live from its deps: before, the destructured stub froze it at
  false, so the handler tests never ran the "on a path" branch.
- **n4.** `__MISSING` and `__DEFAULT` texture keys get no pixel test (bounds decide).
- **n5.** `npcYieldTarget` returns the object she gives way to; the object branch puts it first
  in `tapOrder`. `npcYieldsToObject` is now its boolean wrapper.

### Tests

tap-pick.test.mjs 35 pass (9 new); tap-pick-handler.test.mjs 25 pass (10 new: the reviewer's M2
case, the monitor-in-front variant, m1 both ways, m1 memo beside her, m3, m5 both ways, M1
through the handler, m4 both messages, and the two n3 tests). The M1 handler test fails with the
`isMoving` guard removed. Every test file that imports or reads game.js, player.js, tap-pick.js
or unlock-system.js, or the "is using this PC" text: 48 files, 706 tests, 0 failures, run
without the lock.

### Live proof

Keyless headless server on :3190 from this worktree, `session-start.sh --headless`, setTimeout
loop, `smoothStep` off, `setFPS(20)` with fixed steps on. Taps are `window.__test.clickAt` on the
canvas; keys are `pressKey` with `holdMs`; the player was placed with `body.reset`.

| Check | Game | Result |
|---|---|---|
| M1 repro | 1859 (m01) | From (200, 150), tap (200, 58) armed `reception_desk_phone`; ArrowDown 0.6 s (to y 233, pending dropped), ArrowUp 2 s (to (199, 64), 16 px from the phone): nothing opened |
| Sarah's head | 1859 | From (126, 71), tap (128, 20): PersonChatMinigame, no menu |
| m1, log beside her, both in reach | 1859 | From (126, 71), tap (140, 62) on Sign-In Log pixels, in her frame, off her figure: NotesMinigame, no menu (the menu before this fix) |
| Her uncovered figure in the log's slop | 1864 (m01) | From (126, 71), tap (128, 30): menu "Visitor Sign-In Log" / "Sarah O'Brien", as ruled |
| Far log over far Sarah | 1864 | From (160, 144), tap (135.5, 60.5): armed `reception_area_notes_2`, walked, NotesMinigame on arrival |
| m3, in-use PC menu | 1870 (test_access_habits, walked to omar_room) | `omar_coffee` moved over the PC's corner (client only), player at (224, -400), coffee in reach, PC not: menu "Omar coffee" / "Omar's PC: Omar Haddad is using it. Omar's desk PC. ..."; picking the PC showed the in-use toast, no walk, nothing armed |
| m4, blocked walk | 1870 | Far tap on the coffee machine, then the player's body held still (`body.moves = false`): use dropped after a second with the toast "Something's in the way." |

M2 has no live geometry in m01 (R2 checked nine stand points: wherever Sarah is in reach, the
Sign-In Log is too); the handler tests carry it.

Games created: 1859, 1864 (m01_first_contact), 1870 (test_access_habits). Server and sessions
stopped.

### Open

- `objectStandPoint` still does not route round NPC bodies (R2 m4, second half); the blocked
  walk now says why it stopped.

## R3 fixes

From docs/achitechture/TAP_PICK_CODE_REVIEW_R3.md (0 blockers, 0 majors, 2 minors, 5 nits).
Commits 02a1721fe and 25a38140f.

### Changes

- **m1, stand point.** `objectStandPoint` returns the walkable cell it checked for reach and the
  wall line, not the raw aim (which can sit inside a desk). The ring search already returned a
  pathfinder cell.
- **m1, the walk itself.** Live, the cell fix alone was not enough in m06: with the stand point
  now a free cell, the direct line from (160, 230) to it was clear of walls, so the player went
  straight and walked into the trader standing in the middle aisle. The player's click-to-move
  line-of-sight tests ignored NPCs (only the EasyStar search avoids them). `movePlayerToPoint`
  now takes `{ avoidNpcs: true }`, used only by a far tap's walk (`walkToObjectThenUse`). It
  makes the direct-line check, the path smoothing, the last-leg shortcut and the waypoint
  corner check (`hasPlayerLineOfSight`) also refuse a line through a standing NPC's body
  (`NPCPathfindingManager.getNpcBodyRects`: visible, enabled, not knocked out). Floor taps and
  every other walk are unchanged.
- **m1, the message.** A far tap whose walk stops out of reach now says so (`onStoppedShort`):
  "Someone's in the way." with an NPC beside the player, else "Can't reach it from here.".
- **m2.** `busy` also counts a knocked-out player and `player.disableMovement` (game over,
  success screen, the freeze action), so the use drops with no toast.
- **n1.** The handler harness's free-name check is scope-aware: each declaration counts only
  inside its block (parameters and catch names inside their function or catch body). A new
  test shows `player` is a free name of the cut source, so dropping its stub fails the check.
- **n2.** `npcBesidePlayer` skips knocked-out bodies.
- **n3.** `opaqueAt` mirrors the row for `flipY` and undoes `rotation` about the origin before
  the frame lookup, so a rotated or vertically flipped item reads the right texel.
- **n4, n5.** No change, as the review says.

### Tests

tap-pick.test.mjs 44 pass (9 new: the snapped cell returned, the ring cell returned,
onStoppedShort, the busy and stopped-short wiring, flipY and rotation, NPC rects in the player
line of sight with and without the option and for a knocked-out body, and the avoidNpcs
wiring). tap-pick-handler.test.mjs 30 pass (5 new: a short stop says so once and the walk asks
to avoid NPCs, KO and frozen drop with no toast, a KO'd body is not "someone", the two n1
tests). The m1 cell test, the m2 and n2 handler tests and the wiring test fail with the fixes
reverted. Every test file that imports or reads game.js, player.js, tap-pick.js or
npc-pathfinding.js, or uses gameAlert, hasPlayerLineOfSight or movePlayerToPoint: 110 files,
1764 tests, 0 failures, run without the lock.

### Live proof

Keyless headless server on :3215 from this worktree, `session-start.sh --headless`, Phaser's
loop on setTimeout, `smoothStep` off, `setFPS(20)` with fixed steps on. Taps are
`window.__test.clickAt`; the player was placed with `body.reset`. Game 1891 (m06, started in
trading_floor).

| Check | Result |
|---|---|
| Far workstation from (160, 230), cell fix only | 3 runs: walked straight into the trader (standing at (160, 185)), stopped out of reach, toast "Can't reach it from here." (the walk is what failed) |
| Same, with the NPC-aware walk, trader at (160, 224) | 3 of 3: walked, arrived at about (167, 103), ExamineMinigame "Trading Workstation" at 1.1 to 1.3 s, no toast |
| Same, trader put back at (160, 185) in the aisle | 3 of 3: walked round both NPCs, ExamineMinigame at 1.1 to 1.2 s, no toast |
| From (60, 200), (250, 200), (100, 80) | All opened the workstation, no toast |
| Far tap, then `disableMovement` 150 ms in | Use dropped, no toast after 2.5 s |
| Far tap, then `playerHealth.damage(1000)` 150 ms in | Knocked Out screen, use dropped, no toast after 2.5 s |

Games created: 1891 (m06_follow_the_money). Server and session stopped.

### Open

- Floor taps still walk straight into a standing NPC when the line is clear of walls (the
  `avoidNpcs` option is used only by a far tap's walk). Turning it on for every click-to-move
  walk is a wider change to movement and was left alone.
