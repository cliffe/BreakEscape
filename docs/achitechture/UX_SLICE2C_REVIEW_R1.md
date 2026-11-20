# UX slice 2c: review round 1

Branch `build/ux-slice2c`, diff `a8f74b3b8..HEAD` (5 commits, to 7aa6dcf61). Read-only review: code, tests, the build log and the shots in the scratchpad's `ux-shots/slice2c/` (1400x1000, 800x600, 915x412, 390x844). Engine paths below are under `public/break_escape/`.

Labels: B blocker, M major, m minor.

## Against the goal

- **Post-it on the bezel.** Met at 1400x1000 and 800x600: the note starts 4px under the screen, about 22px in from the screen's left edge, and sits on the chin (2px past the chin's bottom edge). Not met at 915x412 or 390x844, where it hangs about 18px below the monitor (M1).
- **Authored headshots.** Met: the tiles and the desktop bar load `<key>_headshot.png` (x2 on tiles, x1 compact and in the bar). The talk crop is only a fallback (see the builder's choices).
- **One frame size across views.** Met: one sizing rule from the window only, the same box for sign-in, wrong password, desktop, remote desktop and share at all four sizes. The frame fills the space; the content inside does not (M2).
- **X only, no Cancel or Close.** Met: the desktop's Close is gone, the X sits in the top strip inside the bezel and off the screen.
- **Frame wraps its content.** Met at every size, apart from the hanging note in compact windows (M1).
- **`.pixel-scroll`.** Met: the game area and the share's file grid carry the class, and the shared rule exists in `css/utilities.css`.
- **Crisp pixel text.** Mostly met. The PC name is Press Start 2P at 8px. Some GNF sizes are off its grid and render soft (m2), and the compact title is not legible (m1).
- **One look per concept.** Met for PCs: one bezel in `css/pc-monitor.css`, used by both minigames. Non-PC screens (tablets, servers, kiosks) now share the same desktop monitor (m7).

## The orchestrator's three observations

1. **Content does not scale with the frame (confirmed, M2).** At 1400x1000 the screen is 1120x700 and the sign-in block (title, four 104px tiles, the form) is about 450x300 in the middle. The share window at that size is one file in a large white field. Yes, scale it in whole-number steps: see M2.
2. **Post-it below the chin at 390x844 (confirmed, M1).** Also at 915x412. Cause in M1.
3. **Taskbar description cut off with an ellipsis at 390x844 (confirmed, M3).** "A shared hot desk PC. Anyone with an acc..." The share's status bar has the same rule.

## Findings

### M1. In the compact frame the post-it hangs below the monitor

`js/utils/pc-monitor.js:36-37`, `:86-91`; `css/pc-monitor.css:186-190`.

The room under the screen is `chin + 2` (46px full, 38px compact) and the note starts 4px down, leaving 42px and 34px. A one-line note is 44px tall (full: 2px off the bottom, fine). In the compact frame the note's `maxWidth` is 45% of the monitor (170px at 390 wide), so a typical "name: user / password" note wraps to two lines, 52px tall, and hangs 18px under the monitor over the game (shots main-01/02/03 at 390x844 and 915x412). The unit test at `test/js/pc-monitor-frame.test.mjs:100-110` checks only the note's top, so it passes.

Fix: make the chin hold the note. Measure the note once it is in the DOM (`postit.offsetHeight`) and pass it to `pcMonitorMetrics(w, h, { postitHeight })`, which sets `chin = max(bezel.chin, PC_POSTIT_GAP + postitHeight + 2)` and drops the `hang` reserve to a couple of pixels. To keep one frame size across a PC's views, cache the measured chin per PC id (sign-in and desktop share the note; a share window of that PC reuses the cached chin). Add a test that the note's bottom (top + height) is within 4px of `m.height` at all four sizes, using a fixed fake height for one and two lines.

### M2. The content does not scale with the frame

`js/utils/pc-monitor.js:56-93`, `css/password-minigame.css:1136` (`.pc-screen-area .signin-screen`), `css/container-minigame.css` (pc-desktop and pc-share rules).

The frame grows to 1120x700, but every size inside the screen is fixed in CSS pixels, so at 1400x1000 the sign-in screen and the share look empty and small, which works against the user's "expand to the available space". Scaling in whole-number steps keeps the pixel text crisp (Press Start 2P 16px becomes 32px, GNF 18px becomes 36px, headshots x2 become x4).

Fix: have `pcMonitorMetrics` return `uiScale = max(1, floor(min(screen.width / 560, screen.height / 350)))` (2 at 1120x700, 1 at 800x600 and below), set it as `data-ui-scale` and apply `zoom: var(--pc-ui-scale)` to an inner wrapper of the screen's scroll area (not to `.pc-monitor-screen` itself, whose size the metrics set). An integer zoom keeps `snapInnerBoxes` and `makeDraggable` on whole pixels. Unit test: `uiScale` is an integer, 2 at 1400x1000, 1 at the other three sizes; live shot of sign-in, desktop and share at 1400x1000. Check that the desktop's icon grid and the share's grid still make sense at x2 (they become a 560x350 layout), or apply the zoom only to the sign-in and password screens if they do not.

### M3. The PC's description is cut to one line with an ellipsis

`css/container-minigame.css:871-881` (`.desktop-taskbar-note`), `:926-940` (`.share-folder-status`).

Both use `white-space: nowrap; text-overflow: ellipsis`. The description is the object's observations, which can carry clues. Before this slice the header box showed it in full; now it is cut at phone width with no title, tooltip or tap to expand (there is no hover on a phone anyway). That is lost information and a regression.

Fix: let the note wrap (`white-space: normal`), cap it at three lines with `max-height: 54px; overflow-y: auto` and the `pixel-scroll` class, and let the taskbar grow (it is already `flex: 0 0 auto`). Same for `.share-folder-status`. Add a test with a long description that every word is in the DOM and the computed `white-space` is not `nowrap`, plus a 390x844 shot.

### M4. No live proof for the classic computer password screen or a mission desktop

Build log, "Not done": the classic password screen of a computer was only unit-tested. `isPcScreen()` (`js/minigames/password/password-minigame.js:590-596`) and `pcView` (`js/minigames/container/container-minigame.js:280`) move every computer password lock and every computer-named container desktop in every mission into the new frame, not just the access test scenarios. The memory notes say helper tests pass while live paths break.

Fix: take live shots at the four sizes of (a) a computer with a plain password lock and a post-it, and (b) a non-sign-in desktop with several icons, from a real mission (m01 has both) or a small focused test scenario. Check the X, the note on the chin, the description, scrolling with many icons, and Add to Notepad.

### m1. The compact rules hit a portrait phone, and the 8px title is not legible

`js/utils/pc-monitor.js:59`; `css/password-minigame.css:1201-1204`.

`compact` is set when either side is under 560px, so a 390x844 phone with plenty of height gets the short-window rules: an 8px Press Start 2P title with the inherited 2px text shadow (the zoomed 915x412 shot reads as a smear), usernames hidden, 32px headshots. The title also repeats the PC name already on the bezel.

Fix: split the flag in `pcMonitorMetrics`: `narrow` (width under 560: thin bezel, 84px tiles) and `short` (height under 560: 8px title, hidden usernames, folded tiles). On the 8px title drop the text shadow, or hide the on-screen title in the short frame since the bezel names the PC.

### m2. GNF at 12px and 14px renders soft

`css/container-minigame.css:894-899` (Switch user and Sign out at 12px), `css/pc-monitor.css:135` and `:147` (chin button 14px, 12px compact), `css/password-minigame.css:1162-1166` (compact screen note 14px).

The zoomed 1400x1000 shot shows "Switch user" and "Sign out" anti-aliased. Use 16px (the size the rest of the screen uses) and take the height back from padding; the thin button skin leaves room.

### m3. Lines drawn straight on the wallpaper are hard to read

`css/password-minigame.css:840-845` (`.signin-selected`), and `.signin-remote`, which has no rule of its own.

"Sam Okafor (sokafor)" is white on the grey mountain (main-02 at 1400x1000 and 915x412), and "Remote sign-in through Drop box: Comms room" is pale blue on the sky (remote-signin at 1400x1000). The labels next to them already sit on a dark backing.

Fix: give `.pc-screen-area .signin-selected` and `.pc-screen-area .signin-remote` the same dark backing and 2px border as `.pc-screen-note`.

### m4. The password screen's resize listener leaks when the manager ends the minigame

`js/minigames/password/password-minigame.js:733-737`; `js/utils/pc-monitor.js:193-198`.

`destroy()` (which removes the window resize listener) is called only from `complete()`. `MinigameFramework.endMinigame` (`minigame-manager.js:217-233`) calls `cleanup()` only, and a forced end (knockout, conversation, a new minigame) never runs the password screen's `complete()`. The listener then keeps the detached frame alive and runs on each resize. The container calls `destroy()` from `cleanup()`, so it is fine.

Fix: register the listener through the scene (`scene.addEventListener(view, 'resize', update)`, which the base `cleanup()` already removes), and keep `destroy()` for the class removal only. Do not move the whole `destroy()` into the password `cleanup()`: success paths call `cleanup()` before the success message, and removing `pc-view` there would re-lay the container while the message shows.

### m5. The frame is sized from `100vh`, not the visible viewport

`js/utils/pc-monitor.js:96-100`, `:193`.

`pcViewSpace` reads the container's box, which is `100vh`. On mobile browsers `100vh` includes the area behind the address bar, so the chin, the note and Add to Notepad can sit under the toolbar. The on-screen keyboard (sign-in) fires `visualViewport` resize, not window resize, on iOS.

Fix: take `min(container height, window.visualViewport?.height)` and also listen to `visualViewport` `resize`. Unit test with a fake `visualViewport` smaller than the container.

### m6. A click on the post-it marks it as dragged

`js/utils/pc-monitor.js:179-181`.

`mousedown` and `touchstart` set `data-dragged`, so tapping the note (or its red corner) without moving it pins it at the old place, and the next resize or rotation leaves it off the frame.

Fix: set the flag on the first `mousemove`/`touchmove` after a press, or on release only when the position changed.

### m7. Tablets, servers, kiosks and smartboards get a desktop monitor

`js/minigames/password/password-minigame.js:590-596`, `js/minigames/container/container-minigame.js:280`, `js/utils/computer-keywords.js`.

The keyword list that routes a lock to the PC frame includes `tablet`, `ipad`, `server`, `kiosk`, `smartboard`, `console`. With the device picture gone, those now show a desktop monitor with the mountain wallpaper. For PCs, laptops and terminals that is the intended one look. For the others it misdescribes the object.

Fix for now: none needed in this slice; log it in `docs/IDEAS_BACKLOG.md` as a frame variant (`data-device="tablet"` and so on) to settle with the user. Keep the device picture's information: the name is on the bezel and the observations on the screen, which is right.

### m8. Headshot fallback differs between the tiles and the desktop bar

`js/utils/npc-headshot.js:95-104`, `js/minigames/password/password-minigame.js:192-249`.

The tiles fall back to the talk crop; the desktop bar hides the picture. The log message names only the last key tried, not the sprite-sheet key, which is usually the one an artist would add.

Fix: log the full key list (`[headshot] none of a, b, c`). Either fall back the same way in both places or note the difference in the module header. The missing keys in the build log (m02, sis01, ca03, m05's knocked-out variant) need art: list them in the backlog and ask the user before generating anything.

### m9. Tests: the post-it bottom is untested, and the non-PC password frame lost coverage

`test/js/pc-monitor-frame.test.mjs:100-110`; `test/js/password-signin-mode.test.mjs` (R2 m3 and R4 n1 tests).

The post-it test would have caught M1 if it checked the bottom edge (see M1). R2 m3 (controls row after the game area) and R4 n1 (empty Submit scrolls the post-it into view, then the line) were rewritten for the PC frame, and nothing now covers the old password frame path that Wi-Fi keys, archives and case locks still use. Add a non-computer copy of each (an `archive` or `safe` lockable with a post-it). The CSS regex `\.pc-monitor-bezel \{[^}]*border: 2px solid[^}]*clip-path` pins property order; split it into two matches.

### m10. The 3:4 portrait cap leaves a phone's height unused

`js/utils/pc-monitor.js:19`, `:68`.

At 390x844 the screen is 342x456 and the frame spans y 147 to 681, about 280px of the height unused. The user asked for a frame that follows "a dimension matching the space available". Accept the portrait monitor; consider a 10:16 cap, which gives about 342x548 and makes room for the tiles and the form together on a phone (and makes m1's short rules unnecessary there).

### m11. The PC name on the bezel is cut at phone width and meets the webcam

`css/pc-monitor.css:93-106`.

At 390x844 the remote shot reads "Lena's PC (HB-FIN-0..." with the ellipsis touching the webcam. Let the name use the strip up to the X (move the webcam a little right, or hide it in the narrow frame), so the PC name is visible as the device-frame rule asks.

## The builder's choices

- **Portrait monitor on portrait phones, capped at 3:4.** Accept. A 16:10 screen at 390 wide would be 342x214, too small for sign-in. The cap could be taller (m10).
- **The share window loses its header box.** Accept. The UNC path is in the window's title bar and the description in its status bar; maximised with no wallpaper keeps slice 2a's rule. The status bar's ellipsis needs fixing (M3).
- **The classic computer password screen loses its device picture.** Accept for computers: the bezel is the device and its name is on the strip. Non-PC device types are m7. It still needs a live proof (M4).
- **Crop fallback when a headshot file is missing.** Accept as a runtime safety net, logged once per key. The user's rule is "never a crop", so the real fix is art for the listed keys, with the user's go-ahead (m8).

## Other checks

- Wi-Fi keys, archives and case locks: `isPcScreen()` returns false for join mode, case-lock types and non-computer kinds, so they keep `wrapInFrame()`, the device picture and the in-flow post-it. The snap test now uses a `safe` lockable. No regression seen in the code; covered by m9 for tests.
- Close button: the password screen is not `closeInsideFrame`, and the container overrides `placeCloseButton()` to do nothing in the monitor, so the base placer does not fight the bezel rule.
- Escaping: the PC name uses `textContent`, the post-it `escapeHtmlKeepWords`, the share path and status `escapeHtml`. The hostile-name tests were updated to the new places.
- Harness copy lists: every test that copies `password-minigame.js` or `container-minigame.js` into a temp tree also copies `utils/pc-monitor.js` and `utils/npc-headshot.js`; the others read the source or import from `public/` directly.
- Sync: display only, no `player_state` change, no new request. Headshots add at most one extra 404 per tile when the sprite-sheet key has no file.
- Pixel art: 2px borders, stepped corners, flat fills, no radius or gradients in the new CSS. The post-it's 4px offset shadow is pre-existing.

## Counts

B 0, M 4, m 11.
