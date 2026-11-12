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
