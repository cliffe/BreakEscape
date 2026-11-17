# UI shell review, round 2 (build/ui-shell at 73a4557fe)

Scope: the round 1 fixes in 28596758f (main ac526d218 merged since), read against
docs/achitechture/UI_SHELL_REVIEW_R1.md and the "Review round 1 fixes" section of
docs/achitechture/UI_SHELL_BUILD_LOG.md. Paths are under public/break_escape/ unless they start
with tools/, test/ or docs/. Read-only review: no code was changed.

## How it was checked

- `tools/playtest/ui-rules-audit.mjs --all --strict --skip person-chat,network-view` and
  `tools/playtest/shell-x-check.mjs --sizes 1400x1000,800x600,915x412,390x844`, game 3084 on the
  keyless server at :3450, headless shell with scrollbars shown. Audit lines diffed against the
  round 1 tip run.
- A probe (scratchpad ui-shell-r2/probe.mjs, bio.mjs, notes2.mjs; shots in ui-shell-r2/shots):
  lockpicking at 390x844, 360x740, 844x390 and 915x412 with touch, pointer mapping 20 ms after a
  scroll, then rotated; notes (long and post-it) at five sizes, and the new notes box against the
  old rules injected into the same page; alarm panel with four lamps at 390x844, 360x740 and
  915x412, before and after a sideways scroll; resize sequences 915x412 > 1400x1000 > 390x844 >
  844x390 > 915x412 for backup recovery, PIN, notes and network architecture; content growing
  after open (does `--minigame-shell-bar` follow); a hand-over (a scrolled backup recovery, then
  notes, then PIN started without a close); person chat and phone chat (m02 game 3112) and the PC
  desktop at all four sizes; biometrics, BLE and Bluetooth scanners with an
  `elementFromPoint` hit test on the X.
- `node` on test/js/minigame-shell-fit (27 pass), ui-rules-audit-fit (5 pass),
  minigame-close-shell (16 pass), shell-x-check (skipped without env; 1 pass with
  `SHELL_X_PORT=3450 SHELL_X_GAME=3084 SHELL_X_SCENES=biometrics,notes,pin`).

## Live runs at four sizes

| Run | window-offscreen | frame-offscreen | clipped | `--strict` |
|---|---|---|---|---|
| R1 tip a6fc9e79c | 0 (0) | 4 (4) | 53 (16) | exit 1 |
| builder, 28596758f | 0 (0) | 5 (5) | 23 (8) | exit 1, 0 not audited |
| this review, 73a4557fe | 0 (0) | 5 (5) | 23 (8) | exit 1, 0 not audited |

Kinds that `--strict` does not count, new since the R1 tip: `x-on-frame` 12 (biometrics, BLE
scanner, Bluetooth scanner, all four sizes: B1 below) and `overflow` 2 (notes at 800x600 and
915x412: M1 below). Container and phone chat now open and audit (phone chat shows one old
`shadow` on `.phone-messages-container`).

shell-x-check: 160 surface-sizes checked, 0 failed, exit 0 (68 skipped as "no X", the
title-only social engineering scenes). PIN keys stay put at every size. It passes the scanners
whose X cannot be seen or clicked (B1), so it is not yet the guard the log describes (m3).

## Round 1 findings

| R1 | Status | Evidence |
|---|---|---|
| M1 X scrolls away | Fixed, with a regression | Backup recovery at 915x412 scrolled 192px: X stays at 856,15; shell-x 160 ok. The window-coordinate X breaks shells that are not full-window: B1. |
| M2 scrollLeft | Fixed | No sideways failure in shell-x; network architecture X stays at the right edge at every size and after resizes. |
| M3 notes X on the bar | Fixed, with a regression | X clear of the page bar at all five sizes. The 48px offset meets an older short-landscape rule: M1. |
| M4 lockpicking strip | Fixed, live | 390x844: box 390x229 (580:340), strip at y=269 under the lock; 360x740 strip at y=251. Rotating to 844x390 keeps the strip under the canvas. Shots lock-390x844*.png. |
| M5 alarm text scaled | Fixed (text 1:1, crisp) | Labels draw at 8px. On phones the panel now scrolls sideways: M2. |
| m1 stale pointer | Fixed, live | 915x412, game area scrolled 82px: pointer reads 300,200 at the canvas centre 20 ms later; 844x390 the same. |
| m2 PIN line wraps | Fixed, live | Keys do not move for either message at 1400x1000, 800x600, 915x412, 390x844. |
| m3 collapsed-block false positive | Fixed | Biometrics and Bluetooth `clipped` gone. |
| m4 unopened scenes | Fixed | Container and phone chat open; NOT AUDITED 0; person chat and network view on `--skip` (accepted). |
| m5 two sideways bars | Deferred to the consoles branch | Reason holds (scene content). |
| m6 PC view overflow | Fixed in CSS | PC desktop X stays in the bezel at all four sizes; not dragged. |
| m7 border-box narrows ESD | Deferred to the consoles branch | Reason holds. |
| m8 source-text tests | Partly fixed | New jsdom behaviour tests run; `showPinMessage` timing and dial `scrollIntoView` still untested. |

Checked and clean: resize and rotation (the published bar width goes 14px > 0 > 14px with the
window; closeInsideFrame X re-placed each time); content growing after open (the ResizeObserver
sees the scrollbar appear: 0 > 14px, X moves left of it); hand-over (each scene gets a fresh shell
with scroll 0, one shell and one X in the page); person chat and phone chat X at the window corner,
as before; PC desktop X in the bezel.

## New findings

### Blocker

**B1. Biometrics, BLE scanner and Bluetooth scanner: the X is invisible and cannot be clicked.**
These three shells are not full-window: css/biometrics-minigame.css:3-14 and
css/bluetooth-scanner.css:3-55 (BLE alike) make `.minigame-container` itself a 350-450px fixed
panel with `clip-path` and `overflow: hidden`. The X is now `position: fixed`
(css/minigames-framework.css:352-355), so its offsets are from the window, but
`placeCloseButton` still measures `right` from the shell's own right edge
(js/minigames/framework/base-minigame.js:152-155: `c.right - Math.min(r.right, edge)`), which
gives 8px. The X lands at the window's right edge (1362,78 at 1400x1000; 762,58 at 800x600;
877,49 at 915x412) while the panel is at x 0-380, and the panel's clip-path cuts it away:
`elementFromPoint` at the X centre returns the game canvas or a HUD div at all three sizes.
At 390x844 the X shows but straddles the panel's right border (352-382 against 378). Before
the fix it was absolute in the panel at `right: 8px`, inside the frame. A touch player has no
way to close the scanner. The audit reports it as `x-on-frame` at every size; the build log's
results do not mention it.
Fix: measure from the fixed X's containing block, the viewport:
`const vw = document.documentElement.clientWidth;` then
`right = vw - Math.min(r.right, edge) + border + scrollbar + gap` and clamp with
`Math.max(right, vw - c.right + shellBar + gap)` (base-minigame.js:153-155). Then shoot the three
scanners at four sizes, and add the checks in m3.

### Major

**M1. Notes on short landscape screens: the page's scroll box runs past the page and the
window (regression from the R1 M3 fix).** css/notes.css:81 and :99 move the box down 48px and
take 48px off its height, but the short-landscape rule at css/notes.css:435
(`@media (orientation: landscape) and (max-height: 640px)`) still sets `height: 94%` and a 3% top
padding, so the box keeps its full height and starts 48px lower. Measured: 915x412 box 54-430
against the notepad 6-406; 800x600 54-607 against 6-594; 844x390 54-409 against 6-384. The
white text box covers the page's bottom edge, the page's own scrollbar runs off the window, and
the shell gains a vertical scrollbar it did not have (shot notes2-new-800x600.png against
notes2-old-800x600.png). 800x600 is the desktop app's size. The title and first lines still fit
(title at y 63-84). Fix: in that rule, `height: calc(94% - 48px); padding-top: 0;` (or drop the
height and use `bottom: 6%`). The audit already flags it as `overflow` at 800x600 and 915x412.

**M2. Alarm panel on phones: it scrolls sideways for empty space and the X lands on the
border.** At 390x844 and 360x740 the panel is drawn at 460px (css/alarm-panel-minigame.css:29,
:33; SVG 420px at js/minigames/alarm-panel/alarm-panel-minigame.js:110), the screen gives it 358px
and 328px, and `.ap-game-container` shows a horizontal scrollbar. What sits past the edge is the
header's live dot, the end of the footer ("READ O...") and blank row space: the labels and
statuses end about 260px in. After the player scrolls sideways the X stays where it was placed
(354-384) while the panel's right border moves to 373, so the X straddles the border (shot
alarm-390x844-scrolled.png; see m1). This is not acceptable on a phone: it breaks "the frame
wraps the content at every size", for content that would fit. Stacking is not needed. Fix: keep
1:1 text and fit the width: at 480px and under give `.ap-panel-wrap` `width: 100%; max-width:
460px`, make the SVG `width="100%"` with `preserveAspectRatio="xMinYMin slice"` (height stays
the attribute, so the scale stays 1 and only empty right-hand space is cut), and let the footer
wrap. Or work out SVG_W from the game area's width when the panel is drawn.

### Minor

**m1. A closeInsideFrame X does not follow a scroll inside the game area.**
`_watchCloseButton` re-places the X on the shell's scroll only
(js/minigames/framework/base-minigame.js:188). Scroll events do not bubble, so a frame inside a
scrolling game area (the alarm panel sideways on a phone, and down at 915x412 where the game area
scrolls 64px) moves away from a fixed X. Fix: listen in the capture phase on the shell,
`this.container.addEventListener('scroll', place, { capture: true, passive: true })`, and
remove it in cleanup.

**m2. Lockpicking at 390x844: the default X overlaps the canvas's top-right corner by 14px**
(X 346-374 by 16-44, canvas from y=30). It covers only the canvas background, not the lock, and
the default X was there before. Optional: a top margin of 32px on `#phaser-game-container` at
phone widths (css/lockpicking.css:143-149).

**m3. shell-x-check misses the faults it was written for, and the merge batch will not run it.**
(a) It checks the X against the viewport and scrollbars only, not against its frame or whether
it can be hit, so B1 passes at every size (tools/playtest/shell-x-check.mjs:49-63). Add, for
closeInsideFrame scenes, "X inside `closeAnchor()`'s rect" and, for all,
`document.elementFromPoint(X centre) === X`. (b) Default sizes leave out 1400x1000 (:22).
(c) It skips phone chat although the audit now opens it with `npcId` (:89). (d) Inner boxes are
scrolled down only, not sideways (:43), so M2's sideways case is not seen.
(e) test/js/shell-x-check.test.mjs:15 skips when SHELL_X_PORT and SHELL_X_GAME are unset, and
the merge-batch recipe in AGENTS.md (the `MERGE_BATCH=1 bin/test-js` line) does not set them, so
a merge batch reports it as a pass-by-skip. Either fail under `MERGE_BATCH=1` when the variables
are missing, or the orchestrator adds the server, game and browser variables to the merge-batch
recipe (an AGENTS.md change for the orchestrator to make).

**m4. `--strict` ignores `x-on-frame` and `overflow`.** tools/playtest/ui-rules-audit.mjs:291
counts only fit breaches, so 12 new x-on-frame hits (B1) and the notes overflow (M1) passed
through the builder's run unremarked. Count `x-on-frame` as a strict failure, and print a
per-kind delta against a saved baseline so new kinds show up.

Pre-existing, not from this branch: phone chat at 390x844 puts the default X on the phone's
top-right bezel corner (345-375 by 15-45); the phone frame could take the X like the PC bezel
does. Worth a line for the social branch.

Pixel-art rule: no line in 28596758f brings border-radius, 1px rules, gradients, soft shadows or
smooth fonts. The alarm labels are now crisp.

## Verdict

Not ready to merge. The round 1 fixes hold where they were aimed, live: the X stays reachable
when the shell scrolls, the lockpicking strip sits under the lock on phones, the pointer maps
right straight after a scroll, and the PIN keys keep still. But the fixed X has broken the close
button on the three scanner panels (B1), and the notes fix pushes the page's text box off the
page at 800x600 and 915x412 (M1). Both are one-line fixes. Fix B1 and M1, choose the alarm fit
(M2) and the capture-phase scroll (m1), and give shell-x-check the frame and hit tests (m3a)
so it would have caught B1. Then a short round 3: the three scanners and the alarm at four
sizes, and notes at 800x600, 915x412 and 844x390.

Counts: blocker 1, major 2, minor 4.
