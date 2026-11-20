# UI shell review, round 1 (build/ui-shell at a6fc9e79c)

Scope: `git diff main...HEAD` (main 1ce7486c7 merged): the minigame shell in
css/minigames-framework.css and js/minigames/framework/base-minigame.js, the lock and core
scenes from critique A, tools/playtest/ui-rules-audit.mjs and the two new test files. Paths
are under public/break_escape/ unless they start with tools/, test/ or docs/.

## How it was checked

- `tools/playtest/ui-rules-audit.mjs --all --strict` with shots, game 3084, at 1400x1000,
  800x600, 915x412 and 390x844, on the tip (:3450) and on main (detached worktree
  p-ui-shell-main at 6b2344e20, own keyless server on :3453, stopped afterwards; main has moved
  since only in network-view and password files). Every shot pair was pixel-diffed and every
  scene the builder did not touch whose shots changed was looked at side by side.
- Extra shots the builder did not take, tip against main: PC desktop in the monitor frame
  (with and without the post-it), person chat (m02 receptionist), phone chat, a long
  rules-of-engagement note and a short post-it note, the BLE scanner with five devices.
- A probe over every registered scene at 915x412, 390x844 and 800x600: does the shell scroll,
  where the X is before and after scrolling the shell to its end.
- Touch and pointer probes: combination hold-to-spin by CDP touch in a 390x844 touch context;
  lockpicking pointer mapping (mouse to canvas centre, read `input.activePointer`) at open,
  50 ms after a scroll and 700 ms after it, at 915x412, 1400x1000 (2x zoom) and 390x844.
- `node --test` on test/js/minigame-shell-fit.test.mjs and test/js/ui-rules-audit-fit.test.mjs:
  23 passed.

Scripts and shots: scratchpad ui-shell-r1/ (probe.mjs, specs-r1.mjs, lockdom.mjs,
notesdom.mjs, shots-tip, shots-main, r1-tip, r1-main, cmp).

## Audit counts (same tool, same game, four sizes)

| Run | window-offscreen | frame-offscreen | clipped | `--strict` exit |
|---|---|---|---|---|
| main 6b2344e20 | 28 (28) | 10 (10) | 64 (18) | not run |
| tip a6fc9e79c | 0 (0) | 4 (4) | 53 (16) | 1 |

These match the build log. `--strict` fails as it should while breaches remain.

## Findings

### Major

**M1. The default X scrolls off screen with the shell (regression).**
css/minigames-framework.css:16 makes the shell `overflow: auto`, and the default X is
`position: absolute; top: 15px; right: 15px` inside it (css/minigames-framework.css:330-333).
Only scenes with `closeInsideFrame` re-place the X on scroll (base-minigame.js:166). For every
other scene whose shell now scrolls, scrolling down carries the X away. Probe, X top after
scrolling the shell to its end: EHR terminal 915x412 at y=-121, backup recovery 915x412 at -177
and 390x844 at -21, ESD pushbutton 915x412 at -233, claims management 915x412 at -235, coverage
decision form 915x412 at -93; at 800x600 backup recovery -247, ESD -45, claims -47. On main the X stayed in the window corner (the frame spilled
instead). A phone player has no Esc, so they must scroll back up to leave.
Fix: give the X that is not `.minigame-close-in-frame` `position: fixed` (the shell is a fixed,
full-window box, so the visual place is unchanged), with its right offset widened by the shell
scrollbar when one shows; or call `placeCloseButton`-style re-placement on the shell's scroll
for every scene. Add an "X still in the viewport after the shell scrolls" check to the audit.

**M2. Horizontal shell scroll is not accounted for when the X is placed.**
base-minigame.js:146-154 adds `scrollTop` but not `scrollLeft`. The shell now scrolls sideways
where a scene's content is wider than a phone: network architecture at 390x844 (a
`closeInsideFrame` scene) puts its X at x=-234 after the shell is scrolled right, and
sis-config-threshold at 390x844 also scrolls the shell sideways. Fix: subtract
`this.container.scrollLeft` from `right` (content coordinates), and clamp the X to the visible
part of the frame as the vertical case does. (The two horizontal bars in network architecture
are listed under m5.)

**M3. Notes: the X sits on the page's scrollbar and the page edge.**
The X anchor is the notepad (js/minigames/notes/notes-minigame.js:30), but the box that scrolls
is its child `.notes-minigame-content-area` (css/notes.css:77), as wide as the notepad, so its
paper-coloured 14px scrollbar runs down the notepad's right edge. `placeCloseButton` only
clears the anchor's own scrollbar. Measured with a long rules-of-engagement note: at 390x844
the X is 350-380 and the bar 370-384; at 915x412 the X is 584-614 and the bar 604-618. The X
covers the top of the bar (the thumb's start) and overlaps the page edge, which breaks "the X
sits inside the frame and never overlaps the border". Fix: give the content area a right inset
that clears the X's column at the top (or start the scroll box below the X), or anchor the X
to the content area so its scrollbar is cleared.

**M4. Lockpicking on a tall phone: the instructions strip is still off screen (A07 only partly
holds).** At 390x844 `#phaser-game-container` is as tall as the whole game area (804px) because
Scale.FIT fills its parent, the canvas inside is 220px, and `.lockpick-feedback` starts at
y=844, under the window, after about 580px of empty space. The branch made it reachable
(css/lockpicking.css:103-107 lets the game area scroll; main could not reach it at all), but a
player sees a lone scrollbar and no instructions, with no "More below" cue. The lock itself is
now whole with its labels, which is the A07 claim, and it holds. Fix: on phones size the box to
the canvas (`aspect-ratio: 580 / 340; height: auto; flex: 0 0 auto`) so the strip sits under
the lock.

**M5. Alarm panel: at 915x412 the labels render at about 5px and blurred.**
A41's fix shrinks the SVG rows between header and footer (css/alarm-panel-minigame.css:12-24,
the panel's `max-height: 100%`), so the 8px Press Start 2P labels (`.ap-label`, drawn as SVG
`<text>` in js/minigames/alarm-panel/alarm-panel-minigame.js:98-99 inside a viewBox at :110)
are scaled down with the drawing: in the 915x412 shot "BATTERY HALL 1" and "WITHIN SETPOINTS"
are about 5px tall with colour fringes. This breaks "text renders crisply at whole-number
sizes" and is hard to read. The panel is no longer cut off (the blocker is gone), but the fix
swapped one fault for another. Fix: never scale the SVG below 1 (let the game area scroll at
native size, as the code already allows with `overflow: auto`), or scale only by whole
numbers, or draw the lamp rows as HTML.

### Minor

**m1. Lockpicking input is stale for up to half a second after a scroll.** At 915x412, 50 ms
after the game area scrolls 82px the pointer maps 82px off (canvas centre read as y=118, not
200); at 700 ms it is right again. Phaser 3.60 rereads canvas bounds only on its resize
interval. The 915x412 scroll predates this branch, but the branch makes the game area scroll in
more cases. Fix: on `scroll` of the game area and the shell call
`this.game.scale.updateBounds()` (js/minigames/lockpicking/lockpicking-game-phaser.js, next to
`_watchLockZoom`). At 1400x1000 (2x zoom) and 390x844 (FIT) the mapping was correct at every
step.

**m2. PIN message line wraps and moves the keys.** css/pin.css:579-590 gives the line
`min-height: 24px` and `max-width: 320px` at VT323 24px, and says it keeps its height so the
keys do not jump. "Incorrect PIN. 2 attempts remaining." wraps to two lines (builder's own
pin-wrong-code shot), so the keypad drops 24px when the message shows and rises again on the
next key (js/minigames/pin/pin-minigame.js:308 clears it). Fix: `min-height: 52px` (two lines
plus padding), or a shorter text such as "Wrong PIN. 2 tries left.".

**m3. Audit: the biometrics and Bluetooth "clipped" hits are false positives.** Confirmed: in
both, the clipping ancestor (`.biometrics-scanner-controls`,
`.biometrics-samples-list-container`, `.bluetooth-scanner-controls`) is 0px tall with
`max-height: 0; opacity: 0` (css/biometrics-minigame.css:223-227, :375-379), the collapsed
state of the panel, and the shots show nothing cut. Fix in tools/playtest/ui-rules-audit.mjs
:101-124: skip an element whose clipping ancestor has a zero client height or width, or a
computed opacity of 0.

**m4. Audit: `--strict` passes scenes it never audited.** container (TypeError on open),
phone-chat (needs npcId), person-chat (NPC not found) and network-view (not open) print
"clean" at every size and do not count towards `--strict` (ui-rules-audit.mjs:228-247,
:269-270). Fix: count "(not open)" and open errors as strict failures unless the scene is on an
explicit skip list, and give those four BUILTIN_PARAMS (or a --surfaces entry) that open them.
Also, the clipped loop stops at the first scroll box (:119), so a scroll box that is itself cut
by an outer hidden box is never reported.

**m5. Two horizontal scrollbars in network architecture at 390x844.** Its inner diagram scroller
and the shell both scroll sideways (shot pair mg-network-architecture_390x844). On main the
spill was simply cut. Better than unreachable, but a double bar breaks the "one scrollbar"
look. Owner: the console branch (scene content wider than the frame); note it there.

**m6. PC view inherits the scrolling shell.** `.minigame-container.pc-view`
(css/pc-monitor.css:6-13) does not reset `overflow`, so it is now `auto`. The monitor itself is
unchanged (tip and main shots are pixel-identical at all four sizes, with and without the
post-it), but the post-it drag has no clamp (js/utils/helpers.js:186-230), so a note dragged
past the window edge now adds shell scrollbars to the PC view. Found by reading the code, not
tested live. Fix: `.minigame-container.pc-view { overflow: hidden; }`.

**m7. The zero-specificity `box-sizing: border-box` changes scene widths.** Scenes that set a
width and padding on their game area without their own `box-sizing` lose the padding from their
width: the ESD panel is 600px wide instead of 640px at 800x600, so its status line now wraps to
two lines. Nothing broke in the shots, but the console owners should know
(css/minigames-framework.css, the `:where()` rule).

**m8. Most new tests read source text, not behaviour.** Of the 20 tests in
test/js/minigame-shell-fit.test.mjs, only the two placeCloseButton tests (jsdom),
`steppedLampPoints` and `wholeZoom` run code, and `wholeZoom` is pulled out of the source text
with `new Function`. The rest regex the JS or parse the CSS (A01, A02, A03-A06, A10, A41-A43,
A18, the X list, A07, A09, A23). They would all pass with M1, M3 and m2 present. Missing
behaviour tests: `showPinMessage` (shows, clears on the next key, closes after a delay);
`BleScannerMinigame.hasMoreBelow` (a static function, easy to test with a stub box);
combination `_refreshDials` calling `scrollIntoView` only when the active dial changes; the
default X after a shell scroll; `scrollLeft` in `placeCloseButton`. The three audit tests in
test/js/ui-rules-audit-fit.test.mjs do run the real `audit()` on stubbed layouts and are fine.

## Claimed fixes checked live

| Claim | Result |
|---|---|
| Shell: border-box, safe centring, scroll, 100dvh | Holds: window-offscreen 28 to 0; frames taller than the window start at the top and scroll. See M1, M2 for the X. |
| Zero-specificity cap | Holds: PIN plate keeps its 600px; no scene was found stretched by the cap. |
| Overlay consoles without margins | Holds: SIEM, EHR, command board fill the window. |
| A01 combination | Holds at 390x844: three dials stacked, all in the frame. Touch hold on dial 1's right arrow spun 00 to 11 in 1.4 s; a tap on the left arrow then gave 10. |
| A02 cryptex | Holds: five wheels fit at 390x844. |
| A03, A04, A06 notes | Holds for the long rules-of-engagement note and the short post-it: main was frame-offscreen at 390x844, the tip is clean; nav row under the page; tape strip reads as tape. See M3 for the X. |
| A10, A11 PIN line | Holds: message on its own line, not over keys 4 to 6. See m2. |
| A41-A43 alarm panel | Panel fits and the X is inside it; lamps stepped. See M5. |
| A18, A19, A24 biometrics, reader | Holds in shots: list shows two samples, instructions closed, LED in the heading row. |
| A14-A17 dusting, A26-A30 flag station and VM launcher, A34 text file, A39-A40 examine | X inside each frame in the shots; no Courier New or 1px rules in the diff. |
| A07 lockpicking | Lock and labels whole on a phone; see M4 for the strip. |
| A09 lockpicking zoom | Holds: 1400x1000 draws at 2x (1200x800 canvas at 100,55) and pointer mapping is right. |
| A23 BLE | Holds: pixel scrollbar, "More below" strip, cyan SAVE. |
| Toasts at the top | In place; not exercised against the X on a phone. |
| PC monitor frame, person chat, phone chat | Unchanged: PC shots pixel-identical, conversation diffs are only the talking animation. |

Pixel-art rule: no added line in the diff brings border-radius, 1px rules, gradients, soft
shadows or smooth fonts. The alarm-panel text in M5 is the one crispness breach.

## Verdict

Not ready to merge as is. The shell change is the right one and fixes 28 off-window frames, but
it brings one regression that reaches beyond the scenes the builder touched (M1, the X
scrolling away in every scene that is not `closeInsideFrame`) and its horizontal twin (M2).
Fix M1 to M3 and M5 (each is a few lines), take M4 if the lockpicking file is open anyway, add
behaviour tests for M1, M3 and the PIN line, then a short round 2 re-running the scroll probe
and the four-size audit.

Counts: blocker 0, major 5, minor 8.
