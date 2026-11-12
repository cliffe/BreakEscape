Counts: 0 blockers, 2 majors, 5 minors, 5 nits.

# Tap pick fix: code review round 2

Branch `build/tap-pick` at 2fd4b51e8, reviewed as `git diff main...build/tap-pick`, with the R1
fixes (2d9c93dd5) read line by line. Line numbers are at 2fd4b51e8.

The ruling this review checks against: a tap on visible pixels of an object drawn in front of an
NPC goes to the object (Sarah and the Building Directory); a tap on the NPC's figure talks.

## Summary

The R1 fixes are mostly sound. `opaqueAt` is right for every sprite the game draws today, the
hostile and seat exclusions hold, `showPcInUse` is a faithful extraction, and the live checks in
m01 and m02 behave as the build log says. Two things are wrong. The R1 m5 change (time limits
count from the last progress) made keyboard walking count as progress, so a far tap's use now
survives the player walking away with the arrow keys and fires when they come back. And the
ruling holds in only one of the two places it needs to: an in-reach NPC still beats a far object
drawn over her figure, because `tapPickList` returns her before `npcYieldsToObject` is asked.

No player_state or sync change (the pending use is one object reference in client memory). No UI
graphics changed; the only UI text is the menu detail line, so the pixel-art rule is not engaged.

## Majors

### M1. A far tap's use survives keyboard walking and fires when the player walks back into reach

`public/break_escape/js/systems/tap-pick.js:234-247`, with `public/break_escape/js/core/player.js:1059-1068`.

Keyboard movement cancels click-to-move (`updatePlayerKeyboardMovement` sets `isMoving` false),
which on the R1 branch meant the pending use dropped 400 ms after the tap. Since R1 m5, every
update in which the feet move 2 px resets `progressAt`, and that includes keyboard walking. While
the player walks with the keys, `isMoving()` is false, `inReach` is false and `still` stays near 0,
so neither drop fires. The first frame the keyboard walk brings the object into reach, it is used.

Failure scenario, live (game 1851, m01 reception): player at (200, 150), tap on the reception phone
(200, 58), which arms the use. ArrowDown held for 0.6 s (the player walks away to y 248), then
ArrowUp. At 2.05 s after the tap, with the player at y 75, `PhoneChatMinigame` opened. The player
had turned away from the phone with the keys and never tapped it again. The limit is "10 s with no
progress", so a player who keeps walking with the keys carries the armed use around indefinitely.

Fix: count progress only while click-to-move is active (`if (deps.isMoving() && f && ...)` around
the progress update), so a keyboard walk leaves `progressAt` alone and the 400 ms stopped-short
drop fires as before. Also clear the use where keyboard input cancels click-to-move
(`updatePlayerKeyboardMovement`, beside the existing reset: `window.__clearPendingTapUse?.()`),
as the E key already does. Add a `createPendingTapUse` test: armed, `isMoving` false, feet moving
2 px per update, then in reach: not used.

### M2. An in-reach NPC on her figure beats a far object drawn over her (the ruling, inverted)

`public/break_escape/js/systems/tap-pick.js:110` (`if (under.some(c => c.isNpc)) return under;`),
fed by `public/break_escape/js/core/game.js:2798` (`underTap` = on her own pixels, whether or not
something is drawn over them).

`npcYieldsToObject` (game.js:2306) applies the depth rule only in the NPC branch, which runs only
when the pick list is empty. When the NPC is in reach and the tap is on her opaque pixels, she is
an `underTap` candidate even where a far object is drawn over those pixels. `tapPickList` then
returns `[her]` and the handler talks to her at once; the depth check is never consulted.

Failure scenario, run through game.js's own pointerdown handler (the tap-pick-handler.test.mjs
harness, one added case, not committed): player at (126, 71); Sarah at (150, 60), depth 80, in
reach; a memo at (159, 60), depth 95, 34.8 px away (out of reach), drawn over her. A tap at
(159.5, 65) on the memo's pixels, with her figure behind them, logs `talk:sarah`. The ruling says
that tap is the memo's. The same shape fires for a seated owner with his monitor drawn in front of
him (the monitor's y is lower on screen, so its depth is higher) and the player beside him: a tap
on the monitor talks to him instead of saying "X is using this PC." In m01 this geometry does not
occur: wherever Sarah is in reach, the Sign-In Log (the one item drawn over her figure) is too
(checked from nine stand points in game 1851).

Fix: an NPC candidate is under the tap only when the tap is on her pixels and no interactable
object of the player's room (not a seat) drawn above her is opaque at the tap. That is
`!npcYieldsToObject(sprite, objectsUnderTap, deps)` for a non-hostile NPC, so pass
`objectsUnderTap` and the same deps into `gatherInteractablesNearClick` and set
`underTap: hitsBounds(sprite) && !yields(sprite)`. With nothing in reach under the tap the list is
then empty, and the NPC branch's own `npcYieldsToObject` sends the tap to the memo (walk, then
use). Add the case above to tap-pick-handler.test.mjs, and the monitor-in-front variant of
finding 6.

## Minors

### m1. Both in reach: a tap on an object's pixels drawn over the NPC still gives the menu

`public/break_escape/js/core/game.js:2798` and `tap-pick.js:106`.

With nothing far under the tap, `tapPickList` returns the gathered list unchanged, so the
Sign-In Log and Sarah both appear when the tap is on the log's pixels over her figure. That is
main's behaviour and the menu is a safe answer, but it is out of step with the ruling and with the
far case after M2.

Fix: once M2 marks an occluded NPC as not under the tap, drop in-reach NPC candidates that are not
under the tap when an in-reach object is under it on its own pixels (the object is what the
player is pointing at). Keep the menu when the tap is on her uncovered figure within the slop of
an object.

### m2. `opaqueAt` subtracts the trim offset that `getPixelAlpha` subtracts again

`public/break_escape/js/systems/tap-pick.js:51-55`.

Phaser 3.60's `TextureManager.getPixelAlpha` takes coordinates in the untrimmed frame
(`realWidth` space) and does `x -= textureFrame.x; y -= textureFrame.y` itself (checked in the
3.60.0 source). `opaqueAt` already subtracts `frame.x` and `frame.y`, so on a trimmed frame it
reads the pixel `frame.x` columns to the left. No atlas in `assets/characters` (273 JSON files)
or anywhere under `assets` has a trimmed frame today, so nothing breaks yet; the first trimmed
atlas would. The test stub for `getPixelAlpha` (tap-pick-handler.test.mjs:157) ignores frames and
trim, so it cannot catch this.

Fix: keep the bounds check on `lx - frame.x` against `cutWidth` (Phaser answers null in the
trimmed margin, which `opaqueAt` would read as opaque), and pass `Math.floor(lx)`,
`Math.floor(ly)` to `alphaAt`. Add a unit test with a trimmed frame and a stub that subtracts the
trim as Phaser does.

### m3. The menu entry for an in-use PC says "Walk over and use it."

`public/break_escape/js/core/game.js:2921-2933` (`farObjectCandidate`), open item 1 in the
build log.

Failure scenario: an object over the corner of Omar's PC while he sits at it (build log, game
1845). The menu shows "Omar's PC: Walk over and use it." Picking it shows "Omar Haddad is using
this PC." and does not walk. The text promises something that does not happen. Harmless, but it
reads as a bug.

Fix: in `farObjectCandidate`, when `window.pcInUseBy?.(obj)` names someone, use a detail such as
"In use." plus the observations, and keep the entry selectable so picking it explains why (as R1
M2 chose).

### m4. `objectStandPoint` does not route round NPC bodies; the blocked walk drops silently

`public/break_escape/js/systems/tap-pick.js:158-194`, open item 2 in the build log.

The in-use check now covers the seated owner at a sign-in PC, which was the case that mattered.
What is left: an NPC standing at the only free stand point of a far object (a noticeboard, a
cabinet in a corner), or seated at a desk whose drawer is the target. The player walks into the
NPC, the use is dropped after 1 s blocked, and nothing says why. Main walked into the NPC too, so
this is no worse than main; it is now visible because the use on arrival is expected.

Fix (can wait for a later branch): have `findCell` skip cells inside NPC bodies when choosing the
stand point, and when the blocked drop fires, a short toast ("Someone's in the way.") through the
existing `gameAlert`. Grade stays minor while the PC case is covered.

### m5. The NPC figure has no tap slop, so a near miss over a far object goes to the object

`public/break_escape/js/systems/tap-pick.js:136` and `game.js:2798`.

Objects get a one-tile slop; an NPC is under the tap only on an opaque pixel. A figure is about 20
px wide in an 80 px frame. A touch tap that lands 1 or 2 px off her outline, over a far wall
fixture or desk item behind her, now walks to that object and uses it on arrival, where main
walked to her or talked. The ruling covers taps on the figure and on visible object pixels; a near
miss on empty frame over a far object is neither, and the player meant her.

Fix: treat the NPC as on her figure when any pixel within 2 px of the tap is opaque (a 5 x 5
check, at most 25 `getPixelAlpha` calls, only for an NPC whose bounds hold the tap). Objects keep
the exact pixel test for the depth rule.

## Nits

- n1. `tap-pick.js:49`: the flipX mirror is off by one pixel. Phaser mirrors a flipped frame
  about its centre, so local `lx` maps to texel `floor(w - lx)`, not `floor(w - 1 - lx)`. NPCs do
  flip (npc-behavior.js:2742, west-facing frames), so a tap on the outermost column of a flipped
  figure reads the wrong texel. Use `w - lx` and clamp to `w - 1`.
- n2. `unlock-system.js:352` via `game.js:2911`: a far tap on an in-use PC records `pc_in_use`
  from anywhere in the room. test_access_habits completes `h10_never_leaves` on that event, so the
  task can now complete from across the room. Probably fine (the player saw him sitting there);
  say so in the scenario's PLAYTEST.md so a tester does not report it.
- n3. tap-pick-handler.test.mjs, the source cutter: robust enough. Renaming the handler or a
  helper, or making one `async`/`export`, fails loudly. Two quiet gaps: a regex literal after a
  keyword (`return /x/`) is read as division, and a new free identifier in a branch no test runs
  is never resolved. Suggest one test that compiles the cut source with a list of every free
  identifier it uses (or `'use strict'` and a run through each branch), so a missing stub fails
  by name.
- n4. `tap-pick.js:48`: a sprite whose key fell back to Phaser's `__MISSING` texture has a real
  image (a green outline), so `opaqueAt` treats only the outline as the figure. An NPC with missing
  art is then almost never under the tap. Treat `__MISSING` and `__DEFAULT` as "no pixel test".
- n5. `game.js:2306-2365`: when the NPC yields because of object X, the object branch walks the
  first object in `tapOrder`, which can be a different object (a seat, or another room's object
  drawn above X). Rare; pass X through, or filter `tapOrder` to the same-room objects the yield
  counted.

## Questions from the brief

**`opaqueAt`.** Origin: right (`originX * realWidth`, as Phaser's display origin for a sprite).
Scale: right for positive scale; a negative scale used as a flip would be read wrongly because of
`Math.abs`, but nothing sets one. flipX: right apart from n1. Atlas frames: right (frame name
passed). Trimmed frames: wrong (m2), latent. Keys with no source image: `getPixelAlpha` returns
null for an unknown key or frame, and a throwing `drawImage` (a WebGL-only dynamic texture, a
tainted canvas) is caught; both fall back to bounds, which is safe because the bounds pre-check
has already passed. `__MISSING` is the exception (n4). Seated breathing moves the head 1 px; no
effect. Cost: one `getPixelAlpha` is a 1 x 1 `drawImage` plus `getImageData` on the texture
manager's scratch canvas, tens of microseconds. A tap makes at most a handful (each in-reach NPC
whose bounds hold the tap, the far NPC, and the NPC plus each higher object in the yield check),
and only on pointerdown, never per frame. Negligible.

**`npcYieldsToObject`.** Depth: right (strictly above, on the object's pixels). Hostiles: never
yield (and an in-reach hostile in the pick list returns the list as gathered). Seats: excluded,
so a sitter's own chair never takes the tap. NPC behind a desk: desks are furniture, not
interactable, so a tap on her figure behind the desk talks; a desk item drawn over her takes the
tap only on its own pixels, as ruled. The gap is the in-reach case (M2), where the yield is never
asked.

**`showPcInUse`.** No behaviour change for the sign-in flow: same text, same toast, same
`inUseShown(pcId, userAt)`, same order (headless, off, offWhen sync, in use, session, claim). The
one difference is tolerance: `ws.presence(pcId)` answering undefined used to throw on the
destructure and now reads as "nobody". The far-tap path asks `pcInUseBy` without the offWhen sync
wait; a PC switched back on a moment ago is walked to and then judged on arrival, which is fine.

**Pending use.** New tap, E key, minigame, pick-one menu (closed before `onSelect`, so a far entry
picked from the menu is not dropped by its own menu) and the confirm overlay all drop it. The
blocked-walk drop works. The keyboard is the hole (M1).

**tap-pick-handler.test.mjs.** See n3: a good design, loud on most edits. 15 tests, all pass.

**The open items.** "Walk over and use it" for an in-use PC: minor (m3). `objectStandPoint` not
routing round NPCs: minor (m4), can wait now that the in-use message covers the seated owner.

## Tests

`node --test` on every test file that imports or reads game.js, player.js, tap-pick.js or
unlock-system.js, or the "is using this PC" text: 48 files, 0 failures, no lock.
tap-pick.test.mjs 26 pass, tap-pick-handler.test.mjs 15 pass. The M2 probe was a scratch copy of
the handler test with one extra case; nothing in the tree changed.

## Live checks

Keyless headless server on :3175 from the worktree, `session-start.sh --headless`,
`smoothStep` off, `setFPS(20)` with fixed steps on (`[20, true]`). Taps are `window.__test.clickAt`
(mouse events on the canvas through Phaser's input); the player was placed with `body.reset`.

| Check | Game | Result |
|---|---|---|
| NPC in front of furniture, tap on her head | 1851 (m01) | From (126, 71), tap (128, 20) on Sarah behind the desk: PersonChatMinigame, no menu |
| Desk item drawn over a far NPC | 1851 | From (160, 144), tap (135.5, 60.5) on a Sign-In Log pixel over Sarah's figure: armed `reception_area_notes_2`, walked, NotesMinigame on arrival |
| Far NPC's figure, off the log | 1851 | From (160, 144), tap (124, 40): walked towards Sarah, nothing armed, no conversation (far NPCs walk only, unchanged) |
| Far directory beside Sarah | 1851 | From (126, 71), tap (166, 60): walked, NotesMinigame (Building Directory), no menu |
| Locked door, far and near | 1851 | Far tap on Main Office (48, 32) from (160, 144): walked to (46, 47), nothing armed; tap from (48, 80): "Locked: Requires key" |
| Keyboard after a far tap (M1) | 1851 | Tap phone, ArrowDown 0.6 s, ArrowUp: PhoneChatMinigame opened 2.05 s after the tap |
| NPC conversation | 1852 (m02) | Tap on Bernie's figure from (120, 160): walked; second tap: PersonChatMinigame |
| Empty part of an NPC frame | 1852 | Tap (160, 100), no object under it: walked towards Bernie, as main |
| Locked device, far | 1852 | Tap on the self check-in kiosk (locked PC) from (160, 144): armed, walked, RansomwareDisplayMinigame on arrival |

The m01 notes are read and removed, so later taps in 1851 were placed to avoid them. m02's lobby
has no container other than the locked PCs and kiosks; the kiosk stands in for a container.

Games created: 1851 (m01_first_contact), 1852 (m02_ransomed_trust). Server and sessions stopped.
