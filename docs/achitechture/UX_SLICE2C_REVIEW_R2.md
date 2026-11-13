# UX slice 2c: review round 2

Branch `build/ux-slice2c`, diff `a8f74b3b8..HEAD`, focused on `f0fb34dd4..HEAD` (the round 1 fixes: `9f6d521c1`, `9139111bd`, `59461b604`, `e60135807` and the build log). This was a read-only review of the code, the tests, the build log and the shots in the scratchpad's `ux-shots/slice2c-r1fix/`. Engine paths are under `public/break_escape/`. `pc-monitor-frame.test.mjs` (24) and `password-signin-mode.test.mjs` (54) pass when run alone. I took no live run in a browser.

Labels: B blocker, M major, m minor.

## Round 1 findings

| R1 | Status | Evidence |
|---|---|---|
| M1 post-it hangs below the compact monitor | Fixed | The chin grows to `4 + note + 2` (`js/utils/pc-monitor.js:83-84`). In the shots the note's bottom is inside the frame at 390x844, 915x412, 800x600 and 1400x1000, for Kevin's three-line note, Derek's one word and the hot desk note. There is a bottom-edge test. |
| M2 content does not scale | Fixed, with a follow-on | `uiScale` is 2 at 1400x1000, and `zoom` is on the scroll area. At x2 the PC password screen no longer fits its 350px base height (new M1 below). |
| M3 description cut with an ellipsis | Fixed | Both rules wrap, cap at three lines and scroll with `pixel-scroll`. Kevin's description wraps in two lines at 390x844. |
| M4 no live proof on a mission computer | Partly fixed | m01 Kevin and Derek were shown at four sizes, and the Wi-Fi join was shown in the old frame. A desktop that overflows its icon area was not shown, and in code that case draws a non-pixel scrollbar (new M2). |
| m1 compact flag split into narrow and short | Fixed | `data-narrow` and `data-short` are set. The portrait phone keeps its title, usernames and 64px headshots (main-02 at 390x844). The short frame hides the title. |
| m2 GNF at 12px and 14px | Fixed | No GNF under 16px remains in the slice's rules. The remaining 8px is the bezel name in Press Start 2P, plus the pre-existing initials fallback. |
| m3 lines on the wallpaper | Fixed | `.signin-selected:not(:empty)` and `.signin-remote` have the dark backing ("Sam Okafor (sokafor)" at 390x844). |
| m4 resize listener leak | Fixed | Listeners go through `scene.addEventListener`, and a test covers `cleanup()` alone. |
| m5 sized from `100vh` | Fixed, with a follow-on | It now reads `visualViewport`, but the pinch zoom and the keyboard's pan are wrong (new M3). |
| m6 tap marks the note as dragged | Fixed | `watchPostitDrag` compares the release position with the placed one. The press handler is registered before `makeDraggable`'s, so it reads the placed position first. |
| m7 tablets and servers in a desktop monitor | Logged | Backlog entry. |
| m8 headshot fallback and log | Fixed | The bar and the tiles share `applyHeadshotBox` and its crop, and every key is logged. The missing art is in the backlog, and no art was generated. |
| m9 tests | Fixed | Bottom-edge test, non-computer copies of R2 m3 and R4 n1, and the regex is split. |
| m10 10:16 portrait cap | Fixed | 342x546 at 390x844. |
| m11 bezel name on a phone | Fixed | In the narrow frame the webcam is hidden and the name runs to the X. |

## What the builder left open

- **At x2 a wrong-password line makes the password screen scroll by 53 to 64px.** Do not accept this. At 1400x1000 the "Attempts: 1/3" badge sits below the fold, and no "More below" cue shows it is there. The cause is the password screen's layout (badge, a separate keyboard tile, a prompt that repeats the PC name), not the scale. Fixing new M1 removes about 100 base pixels, and the screen then fits 350.
- **The 28px scrollbar at x2.** Accept. It is the same pixel art at the screen's own scale (4px edges, square), so it stays one look with the content it scrolls. Moving the zoom onto an inner wrapper would only make sense if minigames stopped rewriting `gameContainer.innerHTML`.
- **Desktop scrolling with many icons not shown live.** Do not accept. At x2 the icon area is about 560 by 250 base pixels, so a fifth icon starts a second row and overflows. In code the scroller has no `pixel-scroll` class (new M2).
- **Icons opened with a DOM click.** Accept the reasoning. Hit testing under `zoom` is the browser's job, and real clicks on the tiles at x2 were proved. The scrolled-desktop proof for M2 is the cheap place to add one real mouse click on an icon in the second row.

## The orchestrator's note

Yes, these should be one look per concept. Taken together, they are new M1.

## Findings

### M1. A PC's password screen is a second design next to its sign-in screen, with the attempts shown twice, and it overflows at x2

`js/minigames/password/password-minigame.js:804-895` (the template: `hint-controls`, `password-controls`, `attempts-counter`), `:1128` (`revealInFrame` on the badge); `css/password-minigame.css:369-395` (`.keyboard-toggle-btn`), `:614-640` (`.submit-btn`).

On the same PC OS, the sign-in screen (main-02) has a "Password:" label, a field, a Sign in button and one message line. The password screen (m01-kevin-wrong at all four sizes) has a prompt that repeats the PC name already on the bezel, a field, a borderless flat green Submit, a red message, a free-floating 60x50 grey keyboard tile and an amber "Attempts: 1/3" badge. That is five boxes in five styles. "Incorrect password. 2 attempts remaining." and "Attempts: 1/3" say the same thing. `.submit-btn` has `border: none`, which breaks the 2px border rule, and the keyboard tile's `:active` uses `transform: scale(0.95)`, which smears pixel art. At x2 the screen scrolls, and the badge is hidden below with no cue.

Fix, inside the PC frame only (the `inMonitor` path; Wi-Fi keys, archives and case locks keep their frame):
1. Drop `.attempts-counter`. The message line already carries the count. Point the R4 n1 reveal at `#password-message` instead of the badge. If the limit should be known before the first try, put it in the prompt ("Password (3 attempts):").
2. Make the prompt "Password:" in the sign-in form's label style, without the PC name.
3. Move the keyboard toggle into the field row beside the eye toggle, as an icon button with the eye's look (2px border, same height). Drop the `scale(0.95)`.
4. Give every button on the PC's OS one look: Submit, Sign in, Change, Switch user and Sign out. The thin theme skin already used for Switch user and Sign out is the closest. The alternative is to keep the green fill and add a 2px darker-green border on both Submit and Sign in.
5. Test: in the PC frame, after one wrong password at 1400x1000 (x2) and 800x600, the area's `scrollHeight <= clientHeight` and no `.attempts-counter` is rendered. Take live shots at the four sizes.

### M2. A desktop whose icons overflow draws a browser scrollbar, and nobody has seen it

`js/minigames/container/container-minigame.js:985` (`<div class="desktop-background">` in `createMonitorDesktopUI`); `css/container-minigame.css:861-868` (`overflow: auto` on the monitor's `.desktop-background`).

The icon area scrolls inside the screen, but it lacks the `pixel-scroll` class, so Chromium draws its default scrollbar. That breaks the pixel-art rule and the "pixel scrollbar plus a More below cue" rule. Five icons already overflow at x2 (rows of four 112px icons, about 130 base pixels per row, about 250 base pixels of room), and so does a portrait phone with seven or more.

Fix: add `pixel-scroll` to that `.desktop-background`. Add a "More below" strip using the same text and behaviour as `network-view-minigame.js:261` (`MORE_BELOW_TEXT`), shown while the icons run past the bottom. Proof: a desktop with eight or more icons (a focused test scenario or a mission PC) at the four sizes, scrolled and unscrolled, with one real mouse click on a second-row icon after scrolling. Unit test: the class is on the scroller.

### M3. The visual viewport rule shrinks the frame on pinch zoom and ignores the keyboard's pan

`js/utils/pc-monitor.js:127-137` (`pcViewSpace`), `:328` (the `visualViewport` `resize` listener).

The game page allows pinch zoom (`maximum-scale=5.0, user-scalable=yes` in `app/views/break_escape/games/show.html.erb:11`). On pinch, `visualViewport.width` and `height` fall to `inner / scale`. The frame is then rebuilt at the smaller size, so pinching never makes the PC bigger, which is the reason a player pinches. It is also placed from the layout viewport's top-left (`left` and `top` within the fixed container), not where the player has panned to. A `resize` also fires every frame of the gesture, re-laying the frame and re-running the snap.

On iOS the keyboard pans the visual viewport (`offsetTop > 0`). The frame is sized to the smaller height but still drawn from the container's top, so its top strip and X can sit above the visible area while the bottom of the view is empty. It also resizes the monitor between "before typing" and "typing", which works against the one-size rule.

Fix: take `vv.width * vv.scale` and `vv.height * vv.scale`, which undoes the pinch but keeps the address bar and the keyboard. Add `vv.offsetTop` and `offsetLeft` to the frame's `top` and `left`, and listen to `visualViewport` `scroll` as well. Alternatively, size `.minigame-container.pc-view` with `height: 100dvh` (fallback `100vh`) for the address bar, and do not shrink for the keyboard at all, since `scrollIntoView` already keeps the field in view. I prefer the second option: fewer moving parts and no jump when the field takes focus. Tests: a fake `visualViewport` with `scale: 2` gives the same metrics as `scale: 1`, and one with `offsetTop: 120` either moves the frame by 120 or (second option) leaves it unchanged.

### m1. The kept note heights grow with every window size and never shrink

`js/utils/pc-monitor.js:141-158` (`postitHeights`, `keepPostitHeight`), `:291-307` (`update`).

The cache is keyed `pcId -> 'WxH' -> height`. Dragging a desktop window edge or a pinch gesture (M3) adds one entry per size it passes through, without limit for the session. It is small, but it is unbounded. "The larger stays" also means a height measured before GNF loads (the `monospace` fallback can wrap to an extra line) is kept for that size. The `document.fonts.ready` re-measure cannot lower it, because both `update` (`Math.max(noteH, offsetHeight)`) and `keepPostitHeight` only grow, so the chin stays a line too tall.

The key is otherwise right. The password screen uses `scenarioData.id || objectId` and the container uses `loginPcId || scenarioData.id`, which match for m01's PCs. A share keys on its parent desktop, which is what makes the chin match in shares-1400x1000. Where an object has no `scenarioData.id`, the container passes `null`, so a share or remote view of that PC falls back to the base chin.

Fix: keep one entry per PC, `{ sizeKey, height }`, replaced when the size changes, since only the current size matters for the frame staying put between views. When the note itself is mounted, store the measured height and do not take the maximum with the kept one. The 3-step loop can still use the maximum within one `update` to avoid oscillation. Test: two sizes, then the first again, so the map holds one entry. A smaller measurement after `fonts.ready` lowers the chin.

### m2. The zoom maths depend on `currentCSSZoom`, which older Safari may not have

`js/minigames/password/password-minigame.js:290` (`snapInnerBoxes`), `js/minigames/container/container-minigame.js:243` (`evenShareLabels`).

Both fall back to `1` when `currentCSSZoom` is missing. Chrome 128+ and Firefox 126+ have it. In older Safari I could not confirm it, and older WebKit also had its own `getBoundingClientRect` rules inside `zoom`. If WebKit zooms the area but has no `currentCSSZoom`, `evenShareLabels` sets each file name to twice its width, and the snap moves boxes by twice the needed fraction (a half-pixel stays a half-pixel). Firefox before 126 ignores `zoom`, and with no `currentCSSZoom` the code stays at x1 consistently, so that case degrades gracefully. Pointer handling is safe in every engine. The only clientX maths is `makeDraggable` on the post-it, which sits outside the zoomed area, and the other two `makeDraggable` calls in these minigames run only without a monitor. Clicks and `scrollIntoView` use the browser's own hit testing.

Fix: one helper in `utils/pc-monitor.js`, `cssZoomOf(el)`, that returns `currentCSSZoom` when present and otherwise the measured ratio of the screen area, `area.getBoundingClientRect().width / area.offsetWidth` (the area's width is a whole number), for an element inside `.pc-monitor-area`. Use it in both places. Unit test with a fake element that has no `currentCSSZoom` and a 2:1 rect-to-offset ratio. Run one WebKit check once the user agrees to the Playwright WebKit download (not installed here).

### m3. Desktop icon labels at x2: the 2px outline becomes 4px and fills the letters

`css/container-minigame.css:262-271` (`.desktop-icon-label` four-way `text-shadow`), `:836-840`.

In m01-derek-desktop-1400x1000, "IT Security Anomaly Report" and "CONTINGENCY - IT Audit Response" have the counters of the letters filled in by the doubled outline. R1 m3 settled that text on the wallpaper gets a dark backing, which makes the outline a second look for the same concept.

Fix: inside `.pc-monitor`, drop the label's `text-shadow` and give it the `.pc-screen-note` backing (dark fill, 2px border, 0 6px padding).

### m4. An empty taskbar strip under a desktop with no description

`js/minigames/container/container-minigame.js:990-996`.

remote-desktop-390x844 shows an empty 10px dark band at the bottom of the screen: the taskbar renders with an empty note and no Take button.

Fix: render `.desktop-taskbar` only when the note is not empty or the container is takeable.

### m5. The bezel's PC name stays 8px when the screen is drawn at x2

`css/pc-monitor.css:95-108`.

At 1400x1000 the screen text is 32px and the name on the strip is 8px Press Start 2P in grey, which is hard to read and out of proportion. The device-frame rule asks for the PC name to be visible.

Fix: `.pc-monitor[data-ui-scale="2"] .pc-monitor-name { font-size: 16px; line-height: 16px; }`. The 38px strip holds it, and `top` already centres from `--pc-bezel-top`.

## Other checks

- **Listeners.** The `resize` listeners on the window and the visual viewport are removed by the scene's `cleanup()`, and also by `destroy()`. A second remove is harmless. `watchPostitDrag` adds its document `mouseup` and `touchend` only during a press and removes them on release. If the minigame ends mid-press without `destroy()` (the password screen through the manager), they stay until the next release, then remove themselves. `fonts.ready.then` is one-shot and checks `isConnected`. Each scene mounts the monitor once (`container-minigame.js:704`, `password-minigame.js:486`), so the listeners do not pile up. No leak found.
- **Snap and drag under zoom.** `snapInnerBoxes` measures in screen pixels and writes `rec.x / z`, and child inheritance stays in screen pixels, so this is correct in Chromium (the builder's 0-off-grid runs at x1 and x2). The post-it, the X and the chin are outside the zoom. The base `placeCloseButton` does not run in the monitor.
- **Regressions in other minigames.** Nothing in this round touches shared code outside the two minigames and the two utils. The CSS is scoped to `.pc-monitor`, `.pc-screen-area` or classes rendered only in monitor templates (`desktop-taskbar-note`, `share-folder-status`, the `span.desktop-account-headshot`). The crop helpers are re-exported from `password-minigame.js`, so old importers still resolve them. `applyTilePortrait`'s `onMissing` now gets an array, and its only callers are internal. For non-PC password frames, `snapInnerBoxes` sees `z = 1` and behaves as before. The other users of `pixel-scroll` (network view, RFID, infusion pump) are unchanged.
- **Pixel art.** The new rules use 2px borders, flat fills and GNF at 16px or more. The account headshot's `box-shadow: 0 0 0 2px` has no blur, so it acts as a 2px border. The breaches are the ones in M1 (borderless Submit, `scale(0.95)`) and M2 (default scrollbar).
- **Sync.** The changes are display only: no `player_state` change and no new request. The headshot box adds at most one image request per key it tries, as before.

## Counts

B 0, M 3, m 5.
