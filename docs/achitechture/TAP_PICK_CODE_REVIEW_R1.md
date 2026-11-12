Counts: 0 blockers, 2 majors, 6 minors, 3 nits.

# Tap pick fix: code review round 1

Branch `build/tap-pick` at 11acb8562, reviewed as `git diff main...build/tap-pick` (game.js,
systems/tap-pick.js, test/js/tap-pick.test.mjs, the build log). Line numbers are at 11acb8562.

## Summary

The rule in `tapPickList` is sound for the two cases it was built for (Kim's stick beside her
phone, and a far NPC whose frame holds an in-reach note), and the move of the stand point code into
`objectStandPoint` is a faithful copy. Use on arrival is right for most object types, because it
does exactly what a tap in reach does. The problems are at the edges. NPC frames are 80 px boxes,
mostly transparent, so "the far object under the tap joins the menu" fires far more often than the
Omar case needs. It reaches ordinary taps on NPCs, and taps on hostile NPCs in a fight. The open
snag (a seated owner's PC) has an easy fix that reuses the existing "is using this PC" message.

No blockers. No player_state or sync change (the pending use is client memory only, one object
reference). No UI graphics changed, so the pixel-art rule is not engaged.

## Majors

### M1. An in-reach NPC under the tap now gives a menu whenever their frame overlaps any far interactable (combat included)

`public/break_escape/js/systems/tap-pick.js:44-45`, fed by `game.js:2268-2273` and
`game.js:2775` (`underTap: hitsBounds(sprite)` on the NPC's whole frame).

Failure scenario, seen live (game 1818, m01 reception): the player stands in front of the desk at
(126, 71) with Sarah in reach and the Building Directory out of reach. A tap at (166, 64) is on
Sarah's frame and inside the directory's bounds. On main this talks to Sarah: she is the only
in-reach candidate (the sign-in log's anchor is 32.6 px from the tap, outside the 32 px slop). On
the branch the tap opens a menu, "Sarah O'Brien" / "Building Directory". NPC frames are 80 x 80 with
the figure in the middle, so any NPC standing or sitting in front of a far PC, noticeboard,
whiteboard or desk item now gets this menu on a large part of their frame. The same happens in m06
(game 1821, trading floor): a tap on the takeaway coffees over the far Trading Workstation gives a
three-entry menu (coffees, Irina, workstation) where main gave two.

In combat it is worse. An in-reach hostile NPC under the tap is a candidate with `underTap: true`
(game.js:2775), so a hostile standing in front of any far interactable produces a pick-one menu
instead of the jab, and the player stands in the menu while being hit. Right-click and F still
punch, but left tap is the touch player's way to strike an in-reach hostile through the menu path.

Fix: count an NPC as under the tap only when the tap lands on an opaque pixel of the current frame
(`scene.textures.getPixelAlpha(localX, localY, sprite.texture.key, sprite.frame.name)`, allowing
for flipX and origin), not anywhere in its bounds. Then:
- a tap on Omar's body talks to Omar; a tap on the part of the PC that shows through his frame goes
  to the PC (walk, then use), which is what finding 6 wanted, with no menu in either case;
- a tap on Sarah's head over the far directory talks, as on main.
Also, never add far objects when an in-reach hostile NPC is under the tap (hostile wins outright).
Use the same opaque test for `farNpcUnderTap` (game.js:2271), so the empty part of a far NPC's
frame no longer drops in-reach items near the tap (the build log's last note). Add tests for an
in-reach NPC over a far object, and for an in-reach hostile over a far object.

### M2. The far PC of a seated owner: the menu offers a walk that cannot work and gives no message (the open snag)

`game.js:2862-2875` (`walkToObjectThenUse`) and `game.js:2878-2890` (`farObjectCandidate`).

Failure scenario (build log, game 1807): Omar seated, his PC out of reach. "Omar's PC" picked from
the menu walks the player into Omar and waits; the use drops after 10 s with no feedback. The same
walk happens without a menu, from the object branch (game.js:2360), when the PC is tapped clear of
Omar. The game already has the right answer for this: `interactLoginPc` step 1
(`unlock-system.js:350-363`) shows "Omar Haddad is using this PC." plus the PC's observations and
records `inUseShown`, but only once the player is in reach, which never happens here.

Fix, preferred: in `walkToObjectThenUse`, before walking, if the object is a sign-in PC
(`scenarioData.lockType === 'login'`) and `workstationState.presence(pcId)` reports a user present
(owner present, or a borrower's `userId`), show that same message and do not walk. Factor step 1 of
`interactLoginPc` into an exported `showPcInUse(lockable)` (or `pcInUseBy(lockable)` returning the
name) so the text, the toast and `inUseShown` stay in one place. Keep the PC in the menu: picking it
tells the player why they cannot use it, which is better than hiding it. Not offering it at all
while the owner is seated within reach would also work, but loses that explanation and still
leaves the clear-of-Omar tap walking into him. With M1's opaque test in place, the menu itself
mostly disappears for this case, so the message is what the player sees on a tap on the PC.

Separately (later, not this branch): `objectStandPoint` could skip cells occupied by NPC bodies, so
a PC with a free side is reached round the owner.

## Minors

### m1. A far object in another room is now walked to across rooms and used on arrival

`game.js:2360` with `game.js:2873`. `findObjectsAtPosition` returns objects of every room, and the
same-room sort (game.js:2343-2345) runs only when something under the tap is in reach.

Failure scenario: rooms overlap by their wall rows. The player taps a far object of the next room
that is drawn on the shared wall row or seen through an open doorway. Main walked there. The
branch walks round through the doorway and then uses it (picks it up, opens its minigame). This
cuts against the walk-behind-back-wall convention, which blocks cross-room interaction rather than
the walk. `farUnderTap` already filters with `sameRoomFrom` (game.js:2269); the object branch does
not.

Fix: in `walkToObjectThenUse`, arm the pending use only when `sameRoomFrom(playerFeet(player), obj)`;
otherwise walk only, as before.

### m2. A far NPC of another room under the tap drops in-reach items near the tap

`game.js:2270-2272`: `farNpcUnderTap` has no room check, and `findNPCAtPosition` searches every room.

Failure scenario: an NPC standing just north of a shared wall has a frame that reaches down over the
south room's back wall. The player, in the south room, taps beside an in-reach wall fixture (inside
the slop, not its bounds) where the NPC's frame is. Main used the fixture. The branch drops it, and
the NPC branch then walks the player round to the other room.

Fix: add `sameRoomFrom(feetAtTap, npcUnderTap)` to the `farNpcUnderTap` condition (M1's opaque test
narrows it further).

### m3. An object drawn over an NPC still loses the far tap to the NPC

`game.js:2293-2329` (the NPC branch runs before the object branch, whatever the depths).

Failure scenario, seen live (game 1818): the Visitor Sign-In Log (depth 90.6) is drawn over Sarah
(depth 81.5). From (122, 146) a tap on the log walked towards Sarah and armed no use
(`__pendingTapUse()` null); a second tap was needed and gave the "log / Sarah" menu. Pre-existing,
but it contradicts the rule this branch states ("a tap goes to the thing under the pointer") and
the new use on arrival never fires for such objects.

Fix: with M1's opaque test, let an object under the tap win over an NPC when the object's depth is
above the NPC's, or when the tap is not on the NPC's opaque pixels.

### m4. The pending use survives the E key and open menus or confirms

`tap-pick.js:124-135` (the drop checks) and `game.js:2852-2858` (the deps).

Failure scenario: the player taps a far object and, while walking, presses E (player.js:322,
`tryInteractWithNearest`) next to something else. That opens an action menu, a `gameConfirm`
(interactionWarning) or a pickup, none of which is a minigame. The walk then ends and the far object
is used too: a second interaction on top of the first, or a minigame opening under a menu.
Not live-tested; read from the code.

Fix: clear the pending use in `tryInteractWithNearest` (expose `window.__clearPendingTapUse` or pass
a hook), and drop it in `update` when `isInteractionMenuOpen()` or a confirm dialog is open (fold
both into the `minigameOpen` dep, renamed `busy`).

### m5. The 10 s limit counts walk time, and a blocked walk keeps the use alive

`tap-pick.js:129`.

Failure scenarios: (a) at 150 px/s a walk over about 1500 px, or a shorter one slowed by NPC
avoidance, arrives after the limit and nothing happens, with no message; (b) blocked against a
seated or standing NPC, `isMoving` stays true, so the use stays armed for up to 10 s, and if the
NPC steps away 8 s later the object is used with no new input.

Fix: drop the pending use when the player has made no progress (feet moved under 2 px) for about
1 s while `isMoving`, and measure the limit from the last progress, not from the tap.

### m6. The tests replicate the pipeline instead of running it, and miss the new edges

`test/js/tap-pick.test.mjs:33` (`tap()`) rebuilds the pointerdown pipeline with centre distance as
reach. The real code uses `reachX`, `interactionLineClear` and `npcReachDistSq`, `findNPCAtPosition`
picks the closest NPC, and the far filters (seat, same room, `npcGivesWay`) live only in game.js.
The two game.js tests (lines 267-285) are source greps. So the 26 tests prove `tapPickList`,
`objectStandPoint` and `createPendingTapUse` (all good), but not the wiring. Not covered: an in-reach
NPC (and hostile) over a far object (M1), a cross-room far object (m1) and NPC (m2), a far object
with an in-reach door under the same tap, a far menu entry's `onSelect` arming the use, and E or a
menu during the pending walk (m4).

Fix: move the candidate assembly (the `farUnderTap` and `farNpcUnderTap` filters and the
`tapPickList` call) into tap-pick.js as one function that takes the engine checks as deps, test it
with those deps, and add the cases above.

## Nits

- n1. `game.js:2371-2421`: far doors stay walk-only while every far object is now walked to and
  used. That is fine (a door's own zone fires on arrival for an open door), but say so in the
  build log's "Unchanged" list, so nobody "fixes" doors to match.
- n2. `game.js:2656-2659` (`findObjectsAtPosition`) builds bounds from `width * originX` without
  scale, while `hitsBounds` (game.js:2719) uses `getBounds()`. Both now decide one pick. Room
  objects are not scaled today, so no bug; use `getBounds()` in both.
- n3. `game.js:2878-2890`: a far entry in the menu looks the same as an in-reach one. A detail
  line such as "Walk over and use it" would tell the player why choosing it walks.

## Checks by area

| Area | Result | How |
|---|---|---|
| Doors, locked and unlocked | Unchanged: doors are not in `room.objects`, so the far branch never arms them; the door branch is untouched | code |
| Floor items | Kim's stick tap walks and picks up (build log, games 1796, 1799); far notes and phone walk and open | build log, live 1818 |
| Containers | Use on arrival opens the same lock or unlock UI an in-reach tap opens; acceptable (lockpick-catch risk is the same as for a tap in reach) | code |
| NPCs walking | `npcGivesWay` still makes a leaving NPC give way; far NPCs still walk only | code, tests |
| NPCs seated | M2; M1 for the menu | live 1818, build log 1807 |
| NPCs hostile | M1 (menu instead of a jab when a far object shares the tap); right-click and F unchanged | code |
| Seats | Far seat still `queueSit`, no pending use; seats left out of `farUnderTap` | code, tests |
| Wall fixtures behind the player | m1, m2 | code |
| Objects stacked on desks | m06 1821: tap on the coffees over the far workstation gives a three-entry menu; choosing the workstation walked and opened it (ExamineMinigame) | live 1821 |
| KO bodies | `findNPCAtPosition` and the gatherer skip KO'd NPCs; their drops are objects (U3) | code |
| Phone and inventory UI | Opening the phone from the tray mid-walk opened PhoneChatMinigame and dropped the pending use | live 1818 |
| Touch | Same `pointerdown` path; no new touch-only branch | code |
| Combat | Right-click punch path unchanged; left tap on hostile see M1 | code |

## The pending use (question 3)

- New tap: cleared at the top of `pointerdown` (game.js:2218), before the minigame guard. Live
  (1818): far tap on the reception phone armed it; a floor tap 150 ms later cleared it and the
  phone did not open.
- Keyboard: arrow keys stop click-to-move (`isMoving` false), so it drops 400 ms after the tap.
  Live (1818): far tap, then 300 ms walking down: dropped, nothing opened.
- Minigame: dropped on the first update with a minigame open. Live (1818): phone from the tray.
- Room change: not cleared by itself. A walk through a doorway keeps it (m1 says when that is
  wrong); a scripted move ends the walk out of reach and the 400 ms rule drops it.
- Gaps: E key and open menus or confirms (m4); blocked walks and the 10 s limit (m5).

## Tests (question 4)

46 test files that import or read game.js, interactions.js, interaction-reach.js, player.js or
tap-pick.js, run without the lock with `bin/test-js -j 3 <files>`: 46 passed, 0 failed.
tap-pick.test.mjs: 26 tests, 26 pass. Coverage gaps: m6.

## Merge conflicts (question 5)

`git merge-tree --write-tree` of build/tap-pick with build/ux-access (b5633eca6),
build/ux-devices (28eb80f58), build/unlock-gaps-r1 (8042190b2) and main (33c003230): no conflicted
files in any. None of them touches game.js, player.js, seating.js or interaction-reach.js. Only
build/ux-devices changes interactions.js (the notepad start index, lines 1180-1197), far from
anything here. One semantic link: ux-devices' action menu (keycard plus cloner,
`maybeShowObjectActionMenu`) will now also open on arrival after a far tap; it is shown with no
pointer position and centres, which is fine. The branch is 35 commits behind main; none of those
touches the interaction code.

## Live checks

Keyless headless server on :3140 from the worktree, setTimeout loop, `setFPS(20)`, fixed steps on,
taps through `window.__test.clickAt`. Games created: 1818 (m01_first_contact), 1819
(m06_follow_the_money, booted only; the lobby has no overlapping interactables), 1821
(m06_follow_the_money, `--start-room trading_floor`). Server and session processes stopped.
