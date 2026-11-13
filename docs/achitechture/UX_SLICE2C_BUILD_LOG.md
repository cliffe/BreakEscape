# UX feedback round, slice 2c: build log

Branch `build/ux-slice2c` (from batch 27, a8f74b3b8). Engine paths below are under `public/break_escape/`.

The user's notes on main-01, main-02 and main-03: the post-it was not stuck to the bezel, the tile headshots were crops of the talk image, the PC opened at different sizes in different views, and the desktop's bezel did not match the sign-in screen's.

## What changed

| Part | Change | Files |
|---|---|---|
| A. One frame | `utils/pc-monitor.js` holds the one PC monitor frame. `mountPcMonitor(scene)` puts a minigame's game area on the monitor's screen, moves the X into the bezel's top strip, makes the chin the host for footer buttons (Add to Notepad) and sticks the post-it on the chin. `css/pc-monitor.css` holds the one bezel look: a flat grey case, 2px outline, 2px inner edge, stepped corners, a webcam, a power light, the desktop wallpaper behind every view. Linked in `games/show.html.erb` after the password CSS. | `js/utils/pc-monitor.js`, `css/pc-monitor.css`, `app/views/break_escape/games/show.html.erb` |
| A. Views | Every PC view uses it: the sign-in screen (local and remote), a computer's own password screen (the 'screen' kind; Wi-Fi keys, archives and case locks keep the password frame), the desktop (local and remote) and a share's folder window. The desktop's account bar (headshot, name, Switch user, Sign out) is the screen's top bar; its description is in a taskbar along the screen's foot. The share window is maximised on the screen, so no wallpaper shows (slice 2a's main3-08 rule holds). The old desktop header box, the PC picture, the second bezel and the desktop's Close button are gone in these views: the X closes. | `js/minigames/password/password-minigame.js`, `js/minigames/container/container-minigame.js`, `css/password-minigame.css`, `css/container-minigame.css` |
| A. Sizing | `pcMonitorMetrics(w, h)` is the one sizing rule: the screen grows to fill the window less the gutters, the bezel and the room for the hanging post-it, up to 1120x700. A landscape window gets a 16:10 screen; a portrait window (a phone held upright) gets a portrait monitor that follows the space, no taller than 3:4. Below 560px in either direction the compact bezel is used (thinner sides, the existing short-window sign-in rules, now keyed to the frame's `data-compact` flag instead of a media query). Minimum screen 280x200 where the window has room; the frame never overflows. Sizes and the place are whole pixels, set inline from the metrics, so the frame depends only on the window: the sign-in screen and the desktop of a PC are at the same size and place (checked live and in unit tests). | `js/utils/pc-monitor.js` |
| B. Post-it | The note is a child of the frame, absolutely placed from the metrics: its top 4px under the screen's bottom edge, its left 24px (12px compact) past the side bezel, max width 45% of the monitor (up to 340px). It overlaps the chin, and the frame keeps 24px (16px compact) under the monitor for its overhang. Still draggable; a dragged note keeps its place on a resize. | `js/utils/pc-monitor.js`, `css/pc-monitor.css` |
| PC name | The PC's name is on the bezel's top strip, left, in the 8px pixel face, where the post-it never covers it. | `css/pc-monitor.css` |
| C. Headshots | `utils/npc-headshot.js`: the 32x32 `<key>_headshot.png`. Keys in order: an avatar that is already a headshot, the NPC record's world sprite (`spriteSheet`, after any lookalike swap; found by npcId or the account's username through the NPC manager), then the talk portrait's stem with `_v2` first (the v2 headshots match the talk art), then without. A sign-in tile shows the headshot at x2 (x1 in the compact window). The talk crop is used only when no headshot file loads, and the key is logged once (`[headshot] no <key>_headshot.png ...`). The desktop's top bar shows the signed-in NPC's headshot at x1. | `js/utils/npc-headshot.js`, `password-minigame.js` (`applyTilePortrait`), `container-minigame.js` |
| Chin buttons | Chin buttons and Switch user / Sign out use the theme's thin button skin (`--ui-small-button-*`), so they fit the chin and the top bar. | `css/pc-monitor.css`, `css/container-minigame.css` |

Pixel art: 2px borders, stepped corners, flat fills, pixel fonts, headshots at whole scales. No radius, gradients or soft shadows.

## Sync

Client display only. No player_state field, no new request.

## Headshot keys with no file

From every scenario's `spriteSheet` and `spriteTalk` (ERB-built keys in m09 and m10 not resolved): these fall back to the talk crop and are logged once.

- `mr_ahmed`, `mrs_kowalski`, `ms_okafor` (sis01_healthcare)
- `mr_pryce`, `mrs_hargreaves`, `ms_chen` (m02_ransomed_trust)
- `leila_nassar` (ca03_helpdesk_reset)
- `david_torres_ko` (m05_insider_trading, the knocked-out talk variant; `david_torres_headshot.png` exists)
- `hacker`, `hacker-red` (the lab scenarios' legacy player sprites)
- `bed2`, `bed_*` are bed sprites, not people.

None of these is an account holder in the sign-in test scenarios. No art was generated.

## Tests

New `test/js/pc-monitor-frame.test.mjs` (14 tests): the frame fits at 1400x1000, 800x600, 915x412 and 390x844 with the post-it's room; it fills the space (1120x700 at 1400x1000); 16:10 in landscape, portrait on a phone; compact flag and minimums; the post-it's place on the frame at each size; headshot keys and URLs; the scenario NPCs' files exist; a missing key is logged once; a tile shows the headshot at x2, uses the NPC record's sprite, and falls back to the crop; the sign-in screen and the desktop have the same frame (inline size and place, post-it place, compact flag) at all four sizes; the desktop bar shows the headshot; the bezel rule lives only in `pc-monitor.css`.

Updated to the new layout: `password-signin-mode` (the row in the chin; the frame-snap test uses a non-computer lock; the message line in the monitor screen; the tile shows the headshot; the post-it is always in view so only the line is revealed), `container-transfer-dialog` (top bar and taskbar), `container-shares` (folder window on the monitor, title-bar icon, status bar names the host), `minigame-title-escape` (hostile names on the bezel and in the screen note; the old device panel checked with a non-computer lock).

Harness copy lists: `utils/pc-monitor.js` and `utils/npc-headshot.js` added to access-remote-signin, container-transfer-dialog, container-shares, password-join-mode, password-signin-mode, lock-scope-refusal, password-minigame-submit and password-case-hint.

Suites, under the shared lock: `bin/rails test` 2386 runs, 42523 assertions, 0 failures, 0 errors, 1 skip; `MERGE_BATCH=1 bin/test-js -j 3` 599 files passed, 0 failed. Validator (`--no-graph`): 0 ❌ on test_access_signin and test_access_networks.

## Live proof

Keyless server on :3062, setFPS(20) with fixed steps, scrollbars shown. New games: 2888 (test_access_signin), 2890 to 2893 (test_access_networks). Shots (webp) in the scratchpad's `ux-shots/slice2c/`: `main-01`, `main-02`, `main-03`, `remote-signin`, `remote-desktop`, `shares`, each at 1400x1000, 800x600, 915x412 and 390x844, and `pair-*.webp` before/after pairs at 1400x1000 against `slice2a-final`. Driver: `ux-shots/slice2c/drive.mjs`.

At every size: the monitor's box is identical for sign-in, wrong password and desktop, and for remote sign-in, remote desktop and the share; the X is inside the bezel and off the screen; the frame is inside the viewport; the post-it's top is 4px under the screen and it is inside the viewport; the screen's scroll area has no overflow; tiles show `male_office_worker_v2`, `male_nerd_v2`, `female_blowse_v2` headshots; the desktop bar shows the signed-in NPC's headshot.

## Not done, or left as is

- The 8px sign-in title in the compact window is the existing short-window rule, kept; it is small on a phone.
- On a phone held upright the compact rules still apply (smaller tiles), although there is vertical room.
- The remote sign-in's Captured sign-ins list shows usernames only, no headshots.
- In a compact window the post-it wraps to two lines and hangs about 18px under the monitor (inside the reserved room).
- The classic password screen of a computer (not a sign-in PC) is covered by unit tests; it was not retaken live (the test scenarios have no such PC).

These five are fixed in round 1 below (M1, m1, m10, M4).

## Review round 1 fixes

Review: `UX_SLICE2C_REVIEW_R1.md` (M1 to M4, m1 to m11). Code commit `9f6d521c1`.

### M1. The post-it sits on the bezel at every size

`pcMonitorMetrics(w, h, { postitHeight })` grows the chin to `max(chin, 4 + noteHeight + 2)`, so the note's bottom is 4px above the frame's bottom edge (2px inside the outline). `mountPcMonitor` measures the note once it is in the DOM and settles in up to three steps (the note's width follows the frame, the frame its height). The measured height is kept per PC id and window size (`keepPostitHeight`, the larger one stays), so a view of the same PC without the note (a share window, a desktop without `showPostit`) gets the same frame. `hang` dropped from 24/16px to 4px (the note's offset shadow). It also re-measures when the fonts finish loading. Tests: the note's bottom edge for one and two lines at all four sizes; the mounted frame with a 52px note, and the same PC's desktop without the note at the same size and place.

### M2. Screen content in whole-number steps

`pcMonitorMetrics` returns `uiScale = max(1, floor(min(screenW / 560, screenH / 350)))`: 2 at 1400x1000 (1120x700 screen), 1 at the other three sizes. The frame writes it as `--pc-ui-scale` and `data-ui-scale`, and `.pc-monitor-screen > .minigame-game-container` gets `zoom: var(--pc-ui-scale, 1)`. The zoom sits on the screen's scroll area itself, not an inner wrapper, because the minigames rewrite `gameContainer.innerHTML`; the scrollbar scales with it (a 28px pixel scrollbar at x2). `snapInnerBoxes` divides each move by the box's `currentCSSZoom`, since a length on a box drawn at x2 moves it twice as far. The bezel, the chin, the X and the post-it stay at x1 (they are outside the zoomed area), so the post-it drag is unaffected.

Kept the zoom for the desktop and the share too: at x2 they are a 560x350 layout, which reads well (shots below). At x2 the password screen's content is taller than 350 base pixels once a wrong-password line shows, so the screen scrolls (the line is revealed as before).

### M3. Descriptions wrap, never an ellipsis

`.desktop-taskbar-note` and `.share-folder-status`: `white-space: normal`, up to three lines (54px and 62px with the status bar's padding and border), then `overflow-y: auto` with the `pixel-scroll` class. Test: a long description is whole in the DOM; the CSS rules have no `nowrap` or ellipsis.

### M4. Live proof on a mission computer

See "Round 1 live proof" below: m01_first_contact, Kevin's Workstation (password lock, a three-line post-it, Add to Notepad, then its desktop) and Derek's Computer (password lock, a one-word note, then a desktop with more icons), plus the Wi-Fi key join in test_access_networks for the old password frame.

### Minors

- m1: the compact flag is split. `narrow` (width under 560) and `short` (height under 560) are set as `data-narrow` and `data-short`; `data-compact` (either) keeps the thin bezel, the 84px tiles and the smaller paddings. The fold-away tiles, the 32px headshots and the hidden usernames are keyed to `data-short`, so a portrait phone keeps 64px headshots and usernames. In the short frame the on-screen title is hidden (the bezel names the PC).
- m2: GNF at 16px wherever it was 12px or 14px: chin buttons, Switch user and Sign out, the compact screen note. The height comes back from padding.
- m3: `.pc-screen-area .signin-selected` (when it has text) and `.signin-remote` get the dark backing and 2px border of `.pc-screen-note`.
- m4: the frame's `resize` listeners go through `scene.addEventListener`, so the base `cleanup()` removes them even when the manager ends the minigame without `complete()`. `destroy()` still removes them and the `pc-view` class. Test: `cleanup()` alone removes the listener.
- m5: `pcViewSpace` takes no more than `window.visualViewport`'s size, and the frame also listens to `visualViewport` `resize`. Test with a smaller visual viewport.
- m6: a press on the note marks it dragged only if its left or top changed by the release; a tap re-applies the frame's place. Test: a tap leaves it unmarked, a move marks it. Live: a tap then a 40,-30 drag.
- m7: logged in `docs/IDEAS_BACKLOG.md` (Engine and UI: device variants of the PC monitor frame).
- m8: the crop helpers (`isTalkSheetSize`, the crop overrides, `headCropOffset`, `frameAlphaReader`, the portrait box sizes) moved from the password screen to `utils/npc-headshot.js` and are re-exported from `password-minigame.js`. The desktop bar's picture is now a box (`applyHeadshotBox`): the headshot at x1, else the same 32x32 head crop of the talk sheet as a tile, else hidden. Both log `[headshot] none of a_headshot.png, b_headshot.png, ...` with every key tried, once per list. The missing art is listed in the backlog (Art and audio); no art was generated.
- m9: the post-it's bottom edge is tested (M1). Non-computer copies of R2 m3 (a safe: the row inside the password frame, after the game area) and R4 n1 (an archive: an empty Submit reveals the post-it, then the line) are in `password-signin-mode.test.mjs`. The bezel CSS regex is split into two matches on the rule's text.
- m10: the portrait cap is 10:16 (`PC_PORTRAIT_ASPECT`): 342x546 at 390x844, was 342x456.
- m11: in the narrow frame the webcam is hidden and the PC name may run to the X (`max-width: calc(100% - 2 * side - 38px)`).

### Found in the live check and fixed

- In the short frame (915x412) Kevin's long note wrapped to three lines at 45% of the monitor's width, and the grown chin took screen height. The note may now run to the chin button (`PC_CHIN_BUTTON_ROOM`, 190px kept for Add to Notepad, the light and padding), up to 340px. Commit `9139111bd`.
- On the desktop the account name sat at y 7.5 beside the 32px headshot, and odd-width icon labels at a half pixel: whole-pixel line boxes (`line-height: 18px`, labels stretched to the icon's width). Commit `59461b604`.
- In a share's folder window the file names (as wide as their text, centred by -50%) sat at a half pixel at x1: `evenShareLabels` rounds each name's width up to an even number once it is laid out and when the fonts arrive. Commit `e60135807`, with a unit test.

### Tests

Run without the lock, every file that touches a changed module (23 files): all pass. `pc-monitor-frame.test.mjs` 24 tests, `password-signin-mode.test.mjs` 54.

Full suites under the shared lock, on `e60135807` (the last code commit): `bin/rails test` 2386 runs, 42523 assertions, 0 failures, 0 errors, 1 skip; `MERGE_BATCH=1 bin/test-js -j 3` 599 files passed, 0 failed.

## Round 1 live proof

Keyless server on :3062 (stopped afterwards), setFPS(20) with fixed steps, scrollbars shown, new games only, made with `tools/playtest/new-game.rb`: m01_first_contact 2903 and 2908 to 2910 (`--start-room kevin_office`), 2904 to 2907 (`--start-room derek_office`); test_access_signin 2898; test_access_networks 2911, 2915, 2916, 2917. Driver: the scratchpad's `ux-shots/slice2c-r1fix/drive.mjs`; shots (png and webp) and one log per run in the same folder.

Shots, each at 1400x1000, 800x600, 915x412 and 390x844: `m01-kevin-lock`, `m01-kevin-wrong`, `m01-kevin-notepad`, `m01-kevin-desktop`, `m01-kevin-desktop-scrolled`, `m01-derek-lock`, `m01-derek-desktop`, `m01-derek-desktop-scrolled`, `main-01`, `main-02`, `main-03`, `main-03-dragged`, `remote-signin`, `remote-desktop`, `shares`, `wifi-join`.

Checked in every run and looked at in the shots:

- The post-it's bottom edge is 4px above the frame's bottom at every size, for Kevin's long note (several lines), Derek's one word and the hot desk note. It never hangs below the monitor.
- The frame is the same box for lock, wrong password and desktop (Kevin, Derek, the hot desk), and for remote sign-in, remote desktop and the share, at every size.
- `uiScale` is 2 at 1400x1000 and 1 elsewhere; the area's `currentCSSZoom` matches. Every visible box with its own text or a border inside the screen starts on a whole pixel (0 off the grid in the final runs, at x1 and x2).
- Dragging: a tap on the note leaves it unmarked; a 40,-30 mouse drag moves it exactly 40,-30 and marks it, at every size (sign-in desktop and Kevin's desktop). Real mouse clicks inside the x2 screen land on their targets (a tile, then typing into the field and Enter); the desktop and share icons were opened with a DOM click.
- The X is inside the bezel and off the screen; the frame is inside the viewport; the PC name is not cut at any size.
- Kevin's desktop: the description wraps (two lines at 390x844), no ellipsis. Add to Notepad from the chin opens the notepad. The desktops have 2 (Kevin) and 4 (Derek) icons; neither overflows its screen, so the scroll case is the scroll area with no overflow.
- With a wrong-password line the x2 password screen (1400x1000) and the 915x412 screen scroll by 34 to 64px, with the pixel scrollbar; the line is in view.
- Tiles show the `male_office_worker_v2`, `male_nerd_v2` and `female_blowse_v2` headshots (64px at 390x844, 32px only in the short frame); the desktop bar shows Sam's headshot.
- The Wi-Fi key join (test_access_networks, `guest_ap`, and `guest_ap2` at 390x844 where the receptionist stands in front of the first) opens in the old password frame: no `.pc-monitor`, no `pc-view`, the `.password-frame` as before.

## Review round 2 fixes

Review: `docs/achitechture/UX_SLICE2C_REVIEW_R2.md` (B 0, M 3, m 5). All eight fixed.

### M1. The PC's password screen is the sign-in form's twin

Inside the PC monitor only (Wi-Fi keys, archives, safes and case locks keep the old frame, badge and keyboard tile):

- No `.attempts-counter`. The message line carries the count ("Incorrect password. 2 attempts remaining."). The submit reveal falls back to `#password-message`; `getTestState().attemptsText` reads the count from the game data on a PC.
- The label is the plain "Password:" in the sign-in label's look (white on the dark backing), without the PC name.
- The keyboard toggle is in the field row beside the eye (`.password-field-wrapper`), and there is no separate `.password-controls` tile.
- One button look for the PC's OS: `.pc-os-btn` (css/pc-monitor.css) puts the theme's thin skin on Submit, Show Hint, Sign in, Change, the eye and the keyboard toggle, the skin Switch user, Sign out and the chin buttons already had. Take Container on the taskbar gets it too. With no theme it is a flat fill with a 2px border. The eye and keyboard are icon buttons as tall as the field (40px, 32px compact) with whole-number icons (the 8x8 eye at x2, the 40x16 keyboard at x1). The `scale(0.95)` press is gone from the keyboard tile and the on-screen keys everywhere.
- Nothing scrolls at x2 after a wrong password. The PC password screen fits once the badge and tile go. The sign-in screen at x2 also ran 47px past the bottom after a wrong password, so at x2 the tile row folds away once an account is chosen (Change brings it back), as the short frame already did. The remote sign-in at x2 ran 23px over because of its on-screen title; see the note below.
- On-screen title: every PC monitor now hides `.signin-title`. The bezel names the PC, and the title repeated it (the same point as M1's prompt). On the portrait phone it also broke inside the host name ("HB-FIN-" / "02)") and sat white on the wallpaper's clouds. This reverses R1 m1's "the portrait phone keeps its title"; the narrow frame's bezel name already runs to the X (R1 m11).

Tests: `password-signin-mode.test.mjs` "2c R2 M1" (no badge, the label, the toggle beside the eye, `pc-os-btn` on every screen button on both screens, a safe keeps its badge and tile, the thin skin and no `scale(0.95)` in CSS). jsdom has no layout, so the `scrollHeight <= clientHeight` check is in the live proof.

### M2. The desktop's icon area

`.desktop-background` in the monitor desktop has `pixel-scroll`. A `.desktop-more` strip ("More below", the network view's words, strip and stepped arrow) sits under the icon area while the icons run past it, updated on scroll, on resize, when the fonts arrive and after the icons are drawn. Its text is rounded to an even width so the centring lands on a whole pixel. Unit test: the class, the cue shown and hidden by the scroll position.

### M3. Sized from 100dvh

`.minigame-container.pc-view` is `height: 100vh; height: 100dvh`. `pcViewSpace` reads only the container's box (else the window), not `visualViewport`, and the visual viewport listener is gone. A pinch zoom or the keyboard's pan no longer rebuilds or moves the frame, and the field stays in view through `scrollIntoView`. Test: a visual viewport at `scale: 2`, and one with `offsetTop: 120`, give the same space and metrics as none.

### Minors

- m1: one kept note height per PC, `{ sizeKey, height }`, replaced on a resize. The mounted note's own measurement replaces the kept one, so a height taken before GNF arrived is lowered; within one update the larger measurement stays. Tests: two sizes then the first leaves one entry; a kept 72 is lowered to the measured 52 and the chin follows.
- m2: `cssZoomOf(el)` in `utils/pc-monitor.js` (`currentCSSZoom`, else the screen area's drawn width over its layout width, else 1) is used by `snapInnerBoxes` and `evenShareLabels`. Unit test with a fake element. No WebKit run: Playwright WebKit is not installed and needs the user's yes.
- m3: on the monitor a desktop icon label has the dark backing and 2px border of `.pc-screen-note` and no outline. It is as wide as its text (up to 112px) and rounded to an even width by `evenShareLabels(grid, '.desktop-icon-label')`. Stretched to the icon's width, the backing read as a heavy plate and its padding broke "handbook.txt".
- m4: `.desktop-taskbar` renders only with a description or a Take button (remote desktop shots: no empty strip). Test.
- m5: at x2 the bezel name is 16px Press Start 2P, centred in the 38px strip. Test.

## Round 2 live proof

Keyless server on :3062 (stopped afterwards), setFPS(20) with fixed steps, scrollbars shown, new games only (`tools/playtest/new-game.rb`): m01_first_contact 2938, 2920, 2921, 2922 (`--start-room kevin_office`); test_access_signin 2966 to 2969; test_access_networks 2970 to 2973. Driver and logs: the scratchpad's `ux-shots/slice2c-r2fix/` (`drive.mjs`, `run-all.sh`, one log per run). Shots in the same folder as PNG at 1400x1000, 800x600, 915x412 and 390x844: `main-01`, `main-02`, `main-03`, `m01-kevin-lock`, `m01-kevin-wrong`, `m01-kevin-desktop`, `desktop-overflow`, `desktop-overflow-scrolled`, `desktop-overflow-click`, `remote-signin`, `remote-desktop`, `shares`, `wifi-join`.

Overflowing desktop: a temporary fixture in the page only (no file changed). The hot desk's own two icons are repeated to ten (the same item records, so a click does what the original does) and redrawn with `populateDesktopIcons`. Then a mouse wheel over the icon area and a real mouse click on the last icon (row 3 at 1400x1000, row 4 at 390x844, row 3 at 915x412), which opened the text file viewer each time. At 800x600 the ten icons fit the screen, so it shows no cue and nothing to scroll (the click there was on row 1).

Checked in every run:

- After a wrong password the screen area's `scrollHeight - clientHeight` is 0 at every size, for Kevin's PC and the hot desk sign-in. No `.attempts-counter`, the label is "Password:", and the keyboard toggle is in the field row. Every visible screen button has the thin skin.
- Remote sign-in, remote desktop and share: no scroll at any size; the remote desktop has no taskbar strip.
- Overflowing desktop: `pixel-scroll` on the scroller, the cue shown at the top (overflow 164 at x2, 254 at 915x412, 166 at 390x844) and hidden once scrolled to the end.
- The frame is the same box for lock, wrong password and desktop, sign-in and desktop, remote sign-in, remote desktop and the share. Every visible box with text or a border in the screen is on a whole pixel (0 off the grid).
- The bezel name is 16px at x2. The Wi-Fi key join still opens in the old password frame (`guest_ap2`, by the lift).

## Handover

Round 2 done. Commits: `ef0239c30` (the fixes and tests), `f1eae17e4` (icon labels as wide as their text), `fe2745e44` (x2 sign-in folds its tiles), `159748439` (x2 title hidden, More below text even), `a97c789d1` (no on-screen title in any PC monitor), and the docs commit with this section.

Full suites under the shared lock: `bin/rails test` on `159748439`: 2386 runs, 42523 assertions, 0 failures, 0 errors, 1 skip (`a97c789d1` after it changes one CSS rule only). `MERGE_BATCH=1 bin/test-js -j 3` on `07f63a6f9`: 599 files passed, 0 failed.

Open: a WebKit check of `cssZoomOf` (needs the Playwright WebKit download, the user's call). The remote sign-in's "Captured sign-ins" box has a see-through olive fill and sits on the wallpaper; it predates this slice and was not in the review.

Round 1 done. Commits on `build/ux-slice2c`: `9f6d521c1` (the fixes and tests), `9139111bd` (note width), `59461b604` (desktop line boxes), `e60135807` (share labels), and the docs commit with this log and the backlog entries.
