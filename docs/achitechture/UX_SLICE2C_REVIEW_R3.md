# UX slice 2c: review round 3

Branch `build/ux-slice2c`, diff `a8f74b3b8..HEAD`, focused on `3c7e500c4..HEAD` (the round 2 fixes: `ef0239c30`, `f1eae17e4`, `fe2745e44`, `159748439`, `a97c789d1` and the build log). This was a read-only review of the code, the tests, the build log, the driver logs and the shots in the scratchpad's `ux-shots/slice2c-r2fix/`. Engine paths are under `public/break_escape/`. I took no live run of my own.

Labels: B blocker, M major, m minor.

## Round 2 findings

| R2 | Status | Evidence |
|---|---|---|
| M1 password screen a second design, overflows at x2 | Fixed | No `.attempts-counter` in the monitor (`password-minigame.js:896`), the label is "Password:" (`:764`), the keyboard toggle sits beside the eye (`:808-810`), and every screen button has `pc-os-btn`. The driver logs `over 0`, `counter false`, `keyboardInRow true` and the thin skin on all three buttons after a wrong password at all four sizes. In m01-kevin-wrong the screen is now label, field row, Submit and one message line. The `scale(0.95)` press is gone from the keyboard tile and the keys. |
| M2 overflowing desktop draws a browser scrollbar | Fixed | `pixel-scroll` on the scroller, the "More below" strip shown and hidden by scroll position (`over 164`, then `more false` once scrolled at x2). desktop-overflow-1400x1000 shows the pixel scrollbar and the cue, and the real click on the last row opened the file. |
| M3 visual viewport rule | Fixed | `100vh; 100dvh` on `.minigame-container.pc-view` (`pc-monitor.css:9-12`), and `pcViewSpace` no longer reads `visualViewport` (`pc-monitor.js:130-134`). It is my preferred option from R2. |
| m1 kept note heights grow | Fixed | One `{ sizeKey, height }` per PC (`pc-monitor.js:156-176`). Within an `update` the larger measurement wins, so the loop cannot swing, and across updates the measured height replaces the kept one. |
| m2 `currentCSSZoom` fallback | Fixed in code | `cssZoomOf` (`pc-monitor.js:141-153`), used in both places. The WebKit run is still open and needs the user's yes for the download. |
| m3 doubled outline on icon labels | Fixed | Backed labels, no `text-shadow` (`container-minigame.css:839-852`). |
| m4 empty taskbar | Fixed | `container-minigame.js:994-1000`. remote-desktop at four sizes has no strip. |
| m5 8px bezel name at x2 | Fixed | `pc-monitor.css:117-121`, `nameFont 16px` in every x2 log line. |

## The builder's own calls

- **Tiles fold once an account is chosen, at x2.** Accept. It reuses the short frame's rule and Change brings them back. One loss: the chosen account line ("Sam Okafor (sokafor)") then has no headshot anywhere on screen, against the rule that an NPC identity shows its headshot (m1).
- **No on-screen PC title in any monitor.** Accept the reversal of R1 m1. The bezel always names the PC, the title repeated it, it broke inside the host name on the portrait phone, and it cost the remote sign-in 23px at x2. The rule is scoped to `.pc-monitor`, so the frame fallback in `mountMonitor` (`password-minigame.js:561`, no monitor) keeps its title. That keeps the `.signin-title` rules and the R5 m3 test live, not dead code.
- **Icon labels hug their text.** Accept. An OS desktop labels icons this way, the even width keeps the centring on whole pixels, and the stretched backing read as a plate. The uneven widths between "Mail" and "Staff handbook.txt" look right.
- **Press scale dropped from all keys.** Accept. It is what the pixel rule asks. `pc-os-btn` also forces `transform: none` on hover and press, so no shared button rule can bring it back inside the monitor.

## Findings

### M1. The remote sign-in screen has two looks for text panels and two for buttons inside one frame

`css/network-view-minigame.css:396-428` (`.signin-captured`: `background: rgba(0, 0, 0, 0.6)`, yellow title, `.signin-captured-item` with its own border colours); `js/minigames/password/password-minigame.js:1587` (the items have no `pc-os-btn`); `css/password-minigame.css:855-860` (`.signin-field-row label`: dark slab with no border) and `:1162-1165`.

In remote-signin at all four sizes, the heading strip ("Remote sign-in through ...") and the labels are solid dark slabs. The "Captured sign-ins" box below them is a 60% black see-through fill that turns olive on the meadow, with a yellow title. Its item buttons (seen once a capture exists) are flat slate with a 2px `#4b6070` border, while Sign in and the eye beside them wear the theme's thin skin. The slabs themselves differ too: the heading and the chosen-account line have a 2px `#2a3a48` border, but the labels do not. Each of these is the same concept drawn two ways inside one frame. Rating it M because this is the frame the slice set out to make one design, and the see-through fill is the most visible breach on the screen.

Fix (look and skin only; slice 2b q92 changes which tiles show):
1. Add `.pc-screen-area .signin-captured` in `password-minigame.css` with the `.pc-screen-note` look: `background: #101820; border: 2px solid #2a3a48; color: #dde6ee; padding: 4px 8px;`, and `width: 100%; max-width: 360px; box-sizing: border-box;` so it lines up with the form above it. `.pc-screen-area .signin-captured-title { color: #ffffff; }` (the label's colour, not yellow).
2. In `capturedListHtml()`, add ` pc-os-btn` to `signin-captured-item` when `this.pcMonitor` is set, as was done for Sign in and Change.
3. Give the labels the same 2px border inside the screen: `.pc-screen-area .signin-field-row label, .pc-screen-area .password-input-container label { border: 2px solid #2a3a48; color: #dde6ee; }`. Check the x2 overflow still reads 0 (adds 4 base pixels per label).
4. Test: in a remote sign-in in the monitor with one capture, the item has `pc-os-btn`; the `.pc-screen-area .signin-captured` rule has no `rgba(`. Shots at the four sizes with one captured sign-in and with none.

### M2. The text file viewer opened from a monitor desktop leaves the PC frame (follow-up slice, not a merge blocker)

`css/text-file-minigame.css` (whole file); seen in desktop-overflow-click at all four sizes.

Opening "Mail" from the PC desktop replaces the monitor with a full-window light viewer: no bezel, no PC name, macOS traffic lights, GNF at 11px to 13px (`:75`, `:98`, `:355`), synthetic weights on GNF (`font-weight: 500` at `:99`, `:174`; `bold` at `:128`, `:243`), a `translateY(1px)` press (`:203`), and see-through offset shadows (`:50`, `:94`, `:192`). It breaks "a device has one frame across all its views" and the pixel font size rule. Its stepped corners (`:40-48`) are pixel art and should stay. The borders are 2px. At 915x412 the Observations panel covers the file body.

This is a viewer the slice did not touch, and the fix is a design job of its own, so it should not hold up 2c. Fix in the next slice: when the viewer is opened from a monitor desktop, render it inside the monitor's screen area as the share window is (maximised, `pc-os-btn` on Copy, Select All and Add to Notepad, GNF at 16px, no traffic lights, the observations in the taskbar note), and keep the X in the bezel. Log it in the backlog with these line numbers now.

### m1. The chosen account line has no headshot once the tiles fold

`css/password-minigame.css:1205-1213` (the x2 fold); `js/minigames/password/password-minigame.js` (`#signin-selected`). main-02-1400x1000 and 915x412.

Fix: put a 32px headshot box before the name in `.signin-selected` through `applyHeadshotBox`, as the desktop's account bar does (`span.desktop-account-headshot`). Show it only when the tiles are folded, or always, which keeps one look per size. Test: after choosing a tile in the monitor, `#signin-selected` holds the headshot box for that key.

### m2. The field border reads as two colours on one form

`css/password-minigame.css:302-320`.

The cyan is the focus colour, not a second style, but the remote screen focuses Username on open, so every shot shows one cyan and one green field. Green at rest is the old terminal look, while the OS around it is slate. Fix, inside the screen only: `.pc-screen-area .password-field { border-color: #5a6a78; }` (the `pc-os-btn` border with no theme) and `.pc-screen-area .password-field:focus { border-color: #9ee6ff; }` (the OS accent already used for More below and the remote line). Two shades of the OS palette then read as rest and focus. Leave the old frame's green alone (q98).

### m3. The Wi-Fi join's Submit and Show Hint have no border

`css/password-minigame.css:613-624` (`.submit-btn`, `border: none`), `:406-416` (`.hint-btn`, `border: none`).

q98 keeps the plain 2px panel, but the button inside it still has to meet the 2px rule. The same rules draw the buttons on archives and safes. Fix: `.submit-btn { border: 2px solid #1e8449; padding: 10px 22px; }` and `.hint-btn { border: 2px solid #b9770e; padding: 10px 22px; }` (the padding keeps the size). The `pc-os-btn` rule sets its own border, so the monitor is unaffected. Test: neither rule has `border: none`. Take one shot of the Wi-Fi join.

### m4. Desktop icons sit on a see-through plate with a green hover

`css/container-minigame.css:251` (`background: rgba(255, 255, 255, 0.1)`), `:257-260` (green border and `rgba(0, 255, 0, 0.1)` on hover).

In desktop-overflow-1400x1000 every icon has a pale square behind it, the same see-through problem as M1, and the hover is the old terminal green. Fix: `.pc-monitor .pc-desktop .desktop-icon-image { background: transparent; }` and `.pc-monitor .pc-desktop .desktop-icon:hover .desktop-icon-image { border-color: #9ee6ff; background: transparent; }`.

### m5. Several new tests pin source text, and two behaviours have no test

`test/js/pc-monitor-frame.test.mjs`: the R2 M3 test asserts no `visualViewport` listener with a regex on `pc-monitor.js`; the R2 m2 test asserts no `Number(x.currentCSSZoom)` in two minigame sources; the R2 m3 and m5 test matches exact declarations (`padding: 0 2px;`, `align-self: center;`). `test/js/password-signin-mode.test.mjs` "2c R2 M1" slices the CSS by selector text.

The DOM checks in these tests (no badge, toggle in the row, `pc-os-btn`, the scroll cue shown and hidden, one kept height, the chin following a lower measurement, the `cssZoomOf` cases) test behaviour and are good. The source regexes break on a harmless refactor and pass on a real regression done another way. Fix:
- Replace the listener regex with a behaviour check: mount with a fake view whose `visualViewport` is an `EventTarget`, dispatch `resize` on it, and assert the monitor's style is unchanged and `update` was not re-run (count `apply` through the root's style writes).
- Drop the `currentCSSZoom` source regex. The `cssZoomOf` unit cases already cover the behaviour.
- Keep CSS checks to the invariants the rules exist for (2px border, `text-shadow: none`, 16px name at x2) and drop `padding: 0 2px` and `align-self: center`.
- Add a check for the two CSS-only calls, which only the live run proves now: the x2 fold rule and `.pc-monitor .signin-title { display: none; }`. Or better, assert them in `drive.mjs` (`tiles` empty and title hidden after choosing at 1400x1000) so they have a repeatable live proof.

### m6. Small code tidy-ups

- `js/minigames/container/container-minigame.js:231-240`: `DESKTOP_MORE_BELOW_TEXT` was inserted between `evenShareLabels`' JSDoc and the function, so the comment now documents the constant. Move the constant above the comment block.
- The words "More below" now live in two constants (`network-view-minigame.js` `MORE_BELOW_TEXT` and this one), kept in step by a test. Export one from a shared util (for example `utils/pixel-scroll.js` or `pc-monitor.js`) and import it in both, then drop the cross-file regex.
- `password-minigame.js:1135`: on a PC, `revealInFrame(this.passwordMessageEl)` runs right after `showScreenMessage('')` empties the line, so it reveals an empty box. The line is revealed again when the result is written (`:707`), so nothing breaks, but the comment should say so, or the call should be skipped on a PC.

## Other checks

- **Listeners.** The visual viewport listener and its remove are both gone. `watchDesktopScroll` registers through `this.addEventListener`, so the scene's cleanup removes the scroll and resize handlers. `fonts.ready` and the `requestAnimationFrame` re-check run once each, and `updateDesktopScrollCue` returns early if the cue is disconnected. No leak.
- **Kept heights.** The map is bounded by the number of PCs in the mission. Nothing is synced.
- **Regressions.** Every new rule is scoped to `.pc-monitor`, `.pc-screen-area`, or classes only the monitor templates render. `.keyboard-toggle-btn:active` and `.key:active` lost their scale everywhere, which is wanted. Safes, archives and Wi-Fi keep the badge and the keyboard tile, and a test covers that. `attemptsText` on a PC now comes from `gameData.attempts`, the same number the badge's span held, so playtest scripts that read it still work.
- **Pixel art in the new rules.** 2px borders, the theme skin, `border-radius: 0`, no soft shadows, GNF at 16px, a stepped arrow on the cue, whole-number icon sizes (the 8x8 eye at 16px, the 40x16 keyboard at 1:1). `filter: brightness` on hover is flat and acceptable.
- **Sync.** Display only: no `player_state` change and no new request.

## Counts and verdict

B 0, M 2, m 6.

All eight round 2 findings are fixed, and the builder's four calls stand. Ready to merge once M1 and m1 to m6 are fixed. M2 goes to the backlog for the next slice and does not hold this merge. M1 needs fresh remote sign-in shots at the four sizes, with and without a captured sign-in.
