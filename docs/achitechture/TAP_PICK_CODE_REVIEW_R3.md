Counts: 0 blockers, 0 majors, 2 minors, 5 nits.

# Tap pick fix: code review round 3

Branch `build/tap-pick` at 875076d80 (main f2d53bb40, batch 10, merged into 05e2c9f50; the merge
was clean and the tap tests passed after it). Reviewed as `git diff main...build/tap-pick`, with
the R2 fixes (6016f319e) read line by line. Line numbers are at 875076d80.

## Summary

The R2 fixes hold. Keyboard walking now drops a far tap's use at once and leaves no race with a
fresh tap. The covered-figure rule (M2) and the "pointed at" rule (m1) behave as written, live
and in the handler tests. The figure slop, the trim and the flip maths are right for Phaser 3.60.
The batch 10 changes do not interact badly with the tap pick: KO drops are picked up by a far
tap, the card copier menu and the minigame footers are untouched by it.

Two minors remain, both about a far tap whose use does not happen. In m06, a far tap on the
Trading Workstation from below the desks walks, stops out of reach and drops the use without a
word, because the stand point is not a walkable cell. And the new "in the way" toast fires when
the player is knocked out on the way, on top of the game-over screen.

No player_state or sync change: the pending use is one object reference in client memory and is
never sent. No UI graphics changed; the only new UI is toast text through the existing
`gameAlert`, so the pixel-art rule is not engaged.

## Minors

### m1. A walk that ends out of reach drops the use silently; the stand point is not a walkable cell

`public/break_escape/js/systems/tap-pick.js:223-241` (`objectStandPoint`), with
`public/break_escape/js/systems/tap-pick.js:302` (the stopped-short drop) and
`public/break_escape/js/core/game.js:2942`.

`objectStandPoint` snaps the aim to a walkable cell (`aimed`) and checks that cell, but when the
cell passes it returns the raw aim (`target`), not the cell. The raw aim can lie inside furniture.
`movePlayerToPoint` then paths to its own snapped cell, and its last-leg shortcut heads for the
raw point (`playerFinalGoal`), where the feet hit a chair or desk and the walk stops. The player
is out of reach, so after 400 ms the use is dropped with no message. This code is a faithful copy
of main's, so main stopped in the same place; what is new is that the player now expects the
object to be used on arrival, and nothing says why it was not.

Failure scenario, live (game 1885, m06 trading floor): player placed at (160, 230), tap on the
Trading Workstation at (205.5, 99.5). `objectStandPoint` returns (186.8, 131.7); the pathfinder
snaps that to (172, 132), so the point is blocked. In three runs the walk ended at (182, 144),
(172, 108) and (187, 123), the use was dropped each time, no minigame opened and no toast showed.
From (60, 200), (250, 200) and (100, 80) the same tap walked and opened the workstation.

Fix: return the checked cell, not the raw aim: `if (aimed && reachAfter(aimed) <= range - 4 &&
wallClear(aimed, obj)) return aimed;` before the ring search, so every walk ends on a cell that
was tested for reach. Then have the stopped-short drop say why when the walk stopped out of reach
(`onStoppedShort`, a toast such as "Can't reach it from here."), so the remaining cases are not
silent. Add a `objectStandPoint` unit test where the aim is blocked and the snapped cell is in
reach, asserting the cell is returned.

### m2. "Someone's in the way." when the player is knocked out on the way

`public/break_escape/js/systems/tap-pick.js:294-299`, `public/break_escape/js/core/game.js:2897-2900`,
with `public/break_escape/js/core/player.js:1013-1022`.

When the player is KO'd, or `player.disableMovement` is set (game over, success screen, the
freeze action in apply-actions.js:519, ending-check.js:369), `updatePlayerMovement` zeroes the
velocity and returns without clearing `isMoving`. The pending use then sees "on a path, feet
still" and after a second calls `onBlocked`.

Failure scenario, live (game 1886, m06 executive wing): far tap on the plaque from (200, 120), then
`playerHealth.damage(1000)` 150 ms later. At 1.6 s the toast "Someone's in the way." showed over
the game-over screen (the minder standing a tile away counted as "someone"). Blocking with the guard does
not do this: `startBlock` cancels click-to-move, so the use drops silently, which is right.

Fix: add `window.playerHealth?.isKO?.() || window.player?.disableMovement` to `busy`
(game.js:2899), so the use is dropped without a message whenever the player cannot move.

## Nits

- n1. `test/js/tap-pick-handler.test.mjs:488-526`: the free-name check is not scope-aware. A name
  declared anywhere in the cut text (`const player = window.player;` in a helper or a branch)
  counts as declared everywhere. Probe: with `'player'` removed from `STUBS`, the free-name test
  still passes and only "handler m3: an object drawn under the NPC's figure leaves the tap to
  her" fails, on a ReferenceError in the far-NPC branch. So R2 n3's promise ("fails naming any the
  harness does not pass in") does not hold for names that are also local somewhere. Fix: record
  each declaration with the brace range it lives in (codeOnly already tracks depth) and treat a
  use as declared only inside that range.
- n2. `public/break_escape/js/core/game.js:2908-2913` (`npcBesidePlayer`): KO'd bodies and NPCs
  hidden by `visible === false` checks only, so a KO'd body on the floor beside the player counts
  as "someone" in the way (read, not seen live). Skip `npcHostileSystem.isNPCKO` sprites.
- n3. `public/break_escape/js/systems/tap-pick.js:38-67`: `opaqueAt` ignores rotation and
  `flipY`. rooms.js applies both (rooms.js:350, 358, 2766), from Tiled items and scenario
  `rotation`. No room map (0 rotated objects, 0 flip bits in `assets/rooms/*.json`) or scenario
  uses either today, so nothing reads the wrong texel yet. Treat a sprite with `rotation !== 0`
  or `flipY` as "no pixel test" (bounds decide), or mirror `ly` the same way as `lx`.
- n4. The figure slop flickers with the breathing animation. In m01 Sarah's idle frames move her
  outline by a pixel, so a tap at (137.5, 62.5) from (126, 71) gave the "Sign-In Log / Sarah"
  menu on frame 000 and the log alone on another (games 1880, 1881). That is inherent in a pixel
  test on an animated figure and needs no change; noted so a tester does not file it.
- n5. `opaqueNear` runs up to four times for the same NPC on one tap (`farUnderTap`, the gathered
  candidate, `npcCovered`, the NPC branch's `npcYieldTarget`). Measured live at 0.32 ms for a full
  25-read miss, so it costs about a millisecond a tap. No change needed; a per-tap cache keyed on
  the sprite would remove it if the count ever grows.

## Questions from the brief

**Keyboard progress cancelling (R2 M1).** Sound. `createPendingTapUse` counts movement as progress
only while `isMoving()` (tap-pick.js:287), and `updatePlayerKeyboardMovement` clears the use
every frame the keys move the player (player.js:1061). Keyboard is the only other movement input
(hold-to-walk starts only on a plain floor tap, which has already cleared the use in
pointerdown). Races checked live in game 1875: tap the phone, ArrowLeft for 200 ms mid-walk (the
use is cleared during the press), then tap the phone again: re-armed, walked, PhoneChatMinigame
322 ms later. Tap while ArrowLeft is held: nothing armed, walk cancelled, nothing opened
2.5 s later. The pathfinder runs `calculate()` synchronously and calls back a tick later, so
the 400 ms stopped-short window cannot fire before a fresh walk starts. The one ordering edge
(a key pressed on the very frame the walk ends in reach) uses the object, which is harmless.

**The M2 and m1 rules (objects drawn over NPCs).** Both right. The change the author flags, an
NPC only near a memo losing the menu when the tap is on the memo's pixels, is right for players:
the tap is on the memo and at least 2 px off her figure, so the memo is what they pointed at, and
it costs one close at worst where the old menu cost one extra pick on every such tap. A tap on her
figure, or within 2 px of it, still gives the menu, and a tap on her uncovered figure with a far
object behind it still talks to her. Live in m01 from (126, 71): (145.5, 62.5) on the Sign-In Log
opened it with no menu (game 1875; on main, her centre is 27.7 px from that tap, inside the
32 px slop, so main showed the menu); (136.5, 62.5) a pixel off her outline gave "Visitor
Sign-In Log / Sarah O'Brien" (game 1881); (135.5, 60.5) on log pixels drawn over her figure
opened the log (game 1881); (128, 20) on her head talked (game 1875). In m06 from (148, 104),
taps on Irina's figure (160.5, 120.5) and a pixel off it (171.5, 128.5) talked with no menu.

One thing a reader may expect and not get: an in-reach object drawn behind her figure, with the
tap on her figure, still gives the menu (both are under the tap). That is R2 m1's deliberate
choice and main's behaviour, not a defect.

**The 2 px figure slop.** Right size for its job. It is two texels times the sprite's scale
(scale 1 for every NPC seen), checked only when the exact pixel misses and only for an NPC whose
bounds hold the tap. It is small next to a fingertip, but it only decides menu against direct
use at the figure's edge; the object branch and the menu cover the rest. See n4 for the
breathing flicker and n5 for cost.

**The blocked-walk toast.** It cannot fire on a normal arrival: arrival sets `isMoving` false
(player.js:1312-1318), and a straight-line walk that hits a static body also clears it
(player.js:1406), so only a path that stalls for a second while still "moving" reaches
`onBlocked`. It cannot spam: the use is cleared before the toast, so one tap gives at most one
toast. The false case is KO and frozen movement (m2). Five far taps on the m06 workstation and
three on the m01 phone and door showed no toast. The silent case it does not cover is m1.

**Trim and flip maths.** Right. Phaser 3.60's batchSprite draws a flipped frame at
`x += -realWidth + 2 * displayOriginX` and then mirrors, which maps local `lx` to untrimmed texel
`realWidth - lx` whatever the origin; trimmed or not, `getPixelAlpha` then subtracts `frame.x`
itself. `opaqueAt` flips first, floors, tests the trimmed margin against `frame.x`/`cutWidth`
and passes untrimmed coordinates, which matches. The clamp to `w - 1` covers `lx` in [0, 1).
Rotation and flipY are not handled (n3).

**The handler harness.** The cutter and the free-name list work for every name the cut source
uses today (all 25 tests pass, and the second n3 test proves the check can find a name). The gap
is scope (n1). The harness's `isObjectInInteractionRange` stub is plain distance, with no
`reachX` or wall line, so geometry-sensitive cases need the live checks as well.

**Batch 10 regressions.**
- KO drops: game 1877 (test_unlock_gaps, courier KO'd with debugKO): the bag landed at (180, 114),
  about 45 px from the body. A tap on it from (166, 64), with the cryptex box in reach, armed the
  bag, walked, and opened its password lock 235 ms later. The KO'd body is skipped by every pick
  step (game.js:2798, findNPCAtPosition), so a drop under the body is not hidden by it. The
  32 px drop gap means two drops rarely share a tap; when they do, the far-under-tap rule is
  exactly the C3 U3 case it was built for.
- Card copier: the keycard's "Copy it with the card copier" entry is shown by
  `objectActions` inside `handleObjectInteraction`, after the pending use has been cleared, so a
  far tap on a keycard walks and then offers the copy, as an in-reach tap does. Door taps go
  through the unchanged door branch and the door zone; a door in reach under the tap only gains
  an `underTap` flag, which matters only when a far object's bounds hold the same tap.
- Minigame footers: CSS and layout only. `busy` checks the minigame, the interaction menu and
  `.game-confirm-overlay`, all unchanged by batch 10.

## Tests

After the merge: tap-pick.test.mjs and tap-pick-handler.test.mjs 60 pass. Every test file that
imports or reads game.js, player.js, tap-pick.js or unlock-system.js, or the "is using this PC"
text: 48 files, 713 tests, 0 failures, run without the lock. The n1 probe was a scratch copy of
the handler test, deleted afterwards.

## Live checks

Keyless headless server on :3200 from the worktree, `session-start.sh --headless`, Phaser's loop
on setTimeout, `smoothStep` off, `setFPS(20)` with fixed steps on. Taps are
`window.__test.clickAt` on the canvas; keys are `pressKey` with `holdMs`; the player was placed
with `body.reset`.

| Check | Game | Result |
|---|---|---|
| Sarah's head | 1875 (m01) | From (126, 71), tap (128, 20): PersonChatMinigame, no menu |
| Log beside her, off her figure | 1875 | Tap (145.5, 62.5): NotesMinigame, no menu |
| A pixel off her outline, on the log | 1881 (m01) | Tap (136.5, 62.5): menu "Visitor Sign-In Log" / "Sarah O'Brien" |
| Log drawn over her figure | 1881 | Tap (135.5, 60.5): NotesMinigame |
| Far phone | 1875 | From (160, 144), tap (200, 58): armed, walked, PhoneChatMinigame at 0.6 s |
| Keys mid-walk, then a fresh tap | 1875 | Use cleared during the key press; second tap re-armed and opened the phone |
| Tap while a key is held | 1875 | Nothing armed, nothing opened |
| Locked door, far and near | 1875 | Far tap on Main Office: walked to (46, 47), nothing armed; near tap from (48, 80): "Requires key" |
| Irina's figure and a pixel off it | 1885 (m06) | From (148, 104), taps (160.5, 120.5) and (171.5, 128.5): PersonChatMinigame, no menu |
| Far workstation, five stand points | 1885 | Four walked and opened it; from (160, 230) the walk stopped out of reach and the use dropped silently (m1) |
| Block during a far walk | 1886 (m06) | Guard cancels the walk; use dropped, no toast |
| KO during a far walk | 1886 | "Someone's in the way." over the game-over screen (m2) |
| KO drop beside the body | 1877 (test_unlock_gaps) | Far tap on the courier's bag: walked, PasswordMinigame on arrival |

Games created: 1875, 1880, 1881 (m01_first_contact), 1876, 1885, 1886 (m06_follow_the_money; 1885
starts in trading_floor, 1886 in executive_wing), 1877 (test_unlock_gaps through
swap-scenario-game.rb on a test_seating game; no Mission row added). 1876 started in the lobby
with no NPC near and was not used for a check; 1880 gave the n4 observation. Server and sessions stopped.
