Counts: blockers 1, majors 0, minors 3, nits 3

# UX feedback round, slice 7: code review, round 4

Branch build/ux-pixel at 69ca22c0e, reviewed against round 3 (`UX_SLICE7_REVIEW_R3.md`) and the "R3 fixes" section of `UX_SLICE7_BUILD_LOG.md` (commits 4db8dca94, 12eafc04b, 4b358c8df, 033e555a8, 69ca22c0e). Rules: `ui-design-language`, `pixelart-ui-rule`.

## What I checked

- Keyless headless server on :3347 from this worktree (setFPS(20), fixed steps on), stopped afterwards. Games 2641, 2642 and 2643, all new, made with `swap-scenario-game.rb test_seating test_seating`.
- Every browser run had scrollbars shown (`ignoreDefaultArgs: ['--hide-scrollbars']`). Touch runs used a mobile context (`hasTouch`, `isMobile`) and a touch-laptop context (`hasTouch`, not mobile), with real touch input through CDP `Input.dispatchTouchEvent`.
- The pump's input: fast taps, a long press, a press dragged onto another key, a small wobble, mixed mouse and touch, a mouse press dragged off the canvas, a press released on MORE BELOW, the wheel, the main game's Phaser touch pointers before and after, a world tap after the pump closed, and window and document listener counts (CDP `DOMDebugger.getEventListeners`) across three opens and closes.
- Phaser 3.60.0 source (the version the game loads) for the touch and mouse managers.
- Cryptex at 41px and 82px at three sizes, with ink boxes and partial-pixel counts; the opened state with `will-change`.
- Bluetooth expanded panel at 1400x1000, 1366x768, 1024x560, 800x600, 915x481, 915x480, 915x412 and 844x390.
- Pump divider, text file toolbar icons, the test changes, the sweep tool's `REVIEW_IDS`.
- Tests, without the lock: the 40 test files that import a changed module or read a changed stylesheet (`minigame-close-shell`, `minigame-html-sweep-b`, `engine-fixes-round4`, `minigame-pixel-art`, `lockpick-close-toast` among them): 40 of 40 pass.
- Shots and logs: scratchpad `ux-shots/slice7-r4/` (`probe/` with `pump-input.log`, `cryptex/` with `cryptex-size.json` and the `pair_cryptex_*_41_vs_82.png` crops, `followup/` with `followup.log`). Probe scripts: `tmp/r4/` in the worktree (not committed).

## Pump input, checked live

What works, at 915x412 on a touch phone unless noted:
- Five taps on 5 with 30ms presses and 40ms gaps give "55555": each tap reads once.
- A 900ms long press on 1 gives "1", once, on release.
- A press on 1 dragged sideways onto 2 presses nothing; a press with an 8px wobble still counts.
- Touch laptop (mouse and touch on the same page) at 915x412 and 1400x1000: click 1, tap 2, click 3, tap 4, tap 5, click 6 gives "123456". A mouse press dragged off the canvas presses nothing.
- The wheel over the canvas scrolls the box to its end (138px).
- No pump listener is left on the window or document after close: resize, scroll, touchend and the ResizeObserver all go. One document `visibilitychange` listener per open stays (n3, Phaser's, not this slice's).
- The pump has no keyboard entry for digits (it had none before this slice); Esc closes it.

What breaks: B1.

## Findings

### Blockers

**B1. After two taps on the pump, the world no longer answers touch: the main game's touch pointers are left held down.**
`infusion-pump-minigame.js:191-193` cancels `touchend` on the pump canvas, and `:294` turns the pump's touch capture off. In Phaser 3.60 every game listens on the window too: `onTouchStartWindow` takes a touchstart from any other element unless it was cancelled, and `onTouchEndWindow` drops a touchend that was cancelled (`!event.defaultPrevented`). The main game disables only its mouse while a minigame is open (`minigame-manager.js:128-129`), so its touch manager now sees every pump tap start (capture used to cancel the touchstart, which kept it out) and never sees it end. The main game has two touch pointers (`game.js:2233`); after two pump taps both are `active` and `isDown`, and Phaser's `onTouchStart` finds no free pointer for any later touch.

Live, same game and sequence (taps 5, 1, 5, 3, close by the X, a world tap 70px right of the player):
- As built: main pointers `[active, active, free]` after close, the world tap fires no `pointerdown` and the player stays at (160, 144). It stays that way until a reload. Seen on the phone context and on the touch laptop at both sizes (`probe/pump-input.log`). HUD buttons still work, since they are DOM; walking, doors and objects by touch do not.
- With the fix below injected into the page: input "5153" (each tap once), main pointers all free, and the world tap walks the player to (268, 157).

Fix:
1. Remove the canvas `touchend` cancel (`:186-193` and its clean-up at `:206-208`).
2. Drop the compatibility mouse events instead. On `#ip-phaser-container`, add capture-phase listeners: a passive `touchstart` and `touchend` that record `performance.now()`, and `mousedown`, `mouseup` and `mousemove` listeners that call `e.stopPropagation()` within 800ms of the last touch. Capture on the box stops them before Phaser's canvas listener. Remove all five in `_unwatchZoom()`.
3. As a guard for any other scene that cancels touches, have `minigame-manager.js` release main-game touch pointers still active when a minigame closes, or disable the main game's touch manager while a minigame is open (as its mouse is) and reset its pointers when it is re-enabled.
4. Tests: `minigame-close-shell.test.mjs:246-253` asserts the cancel (`end.defaultPrevented === true`), so it pins the fault in place. Replace it with: a canvas touchend is not cancelled; a mouse event inside 800ms of a touch is stopped at the box; one after 800ms gets through; the listeners go on close. Then repeat the live proof: a world tap after closing the pump by touch.

### Minors

**m1. Cryptex letters at 41px fill a sixth of the wheel's width; 82px fits at all three sizes, is as crisp, and reads better.**
`cryptex-minigame.css:118-141` (`font-size: 41px; line-height: 48px`). Measured ink, the same for W, M, Q, G and A:

| Window | Box inside border | 41px ink, margins (top/bottom) | 82px ink, margins (top/bottom) |
| --- | --- | --- | --- |
| 1400x1000 | 120x100 | 20x28 (37/35) | 40x56 (24/20) |
| 800x600 | 120x100 | 20x28 (37/35) | 40x56 (24/20) |
| 915x412 | 112x76 | 20x28 (25/23) | 40x56 (12/8) |

Both sizes have 0 strong partial pixels and 0 coloured fringe (the only partial pixels are faint ones under 32 of 255: 752 across five boxes at 82px, 160 at 41px). Neither makes the window scroll. At 41px the letter is a small mark in a large box (`cryptex/cryptex_1400x1000_41px.png`); at 82px it fills the wheel as a cryptex letter should, and the face still differs from the combination lock's Press Start 2P. The only flaw at 82px is that the 48px line box puts the glyph 4px low, most visible at 915x412 (12px above, 8px below).
Fix: `font-size: 82px; line-height: 56px;` (the glyph's height, so flex centres the ink), and check the margins come out equal at the three sizes. Crop pairs for the user: `cryptex/pair_cryptex_1400x1000_41_vs_82.png`, `pair_cryptex_800x600_41_vs_82.png`, `pair_cryptex_915x412_41_vs_82.png` (top row 41px, bottom row 82px, 3x).

`will-change: transform` on `.cryptex-wheel-display`: the element holds only a text node, so there is no fixed-position descendant for it to capture. The opened state's 2px outline (offset 2px, outside the box) still draws whole at 800x600 and 915x412 (`followup/crop_cryptex_opened_*`). No side effect found.

**m2. At 844x390 the expanded Bluetooth panel scrolls by 8px with Chrome's default scrollbar.**
`bluetooth-scanner.css:85-88` (`min-height: 149px` on the list box) and `:112-116` (Instructions folded under 480px high). At 844x390, a common phone landscape size, Instructions are folded away, but the game area is 331px of content in a 323px box, so it shows a 15px default scrollbar with rounded thumb and arrows (`followup/bluetooth_844x390.png`). At 915x412 and above it fits. The R3 build log says the game area's default scrollbar is gone; that holds only down to 412px high.
Fix: under `max-height: 400px`, trim 8px or more from the stack (the header or controls padding, or the list box minimum to 141px), or give the game area the pixel-art scrollbar (`.pixel-scroll` once slice 1 lands, or a local copy as the pump has). Retake at 844x390 and 800x360.

**m3. From 561px to about 720px high, Instructions shrink to their heading while the panel leaves the bottom of the window empty.**
`bluetooth-scanner.css:58-61` caps the expanded panel at `70vh`; the `95vh` rule at `:122-126` starts only at 560px high. At 800x600 the frame ends at y 458, 142px above the window's bottom, while Instructions show only "Instructions:" with a 35px box over 196px of text, and no cue that more is below (`followup/bluetooth_800x600.png`). At 1366x768 and 1024x560 the split is fair.
Fix: widen the tall-panel rule to `@media (max-height: 720px)`, so the list and Instructions get the height first; Instructions then shrink only when the window is really short.

### Nits

**n1. A press on a key released on MORE BELOW leaves the pump's pointer held down.**
`infusion-pump-minigame.js:181-184` stops `mouseup`, `touchend` and `pointerup` on the cue as well as the presses. A mouse press on 4 released on the cue leaves the pump's Phaser pointer `isDown: true` (`followup/followup.log`). On a mouse-only page the next click on a key still counts; on the touch-laptop run, after a drag off the canvas first, one later click was lost (`probe/pump-input.log`; not reproduced on its own).
Fix: stop only `mousedown`, `touchstart` and `pointerdown` on the cue. A release must reach the window so Phaser ends the press; the tap check already ignores a release that is not over the key that was pressed.

**n2. The R3 shot names and build log, not `REVIEW_IDS`, are one off the review page.**
The brief for this round says the sweep tool's `REVIEW_IDS` (`tools/playtest/pixel-style-sweep.mjs:44-48`) is one behind the page from container on. The review page's card ids, which the user's notes use, match the map: in `review-page/cards.json` card unlock-43 is "Container 915x412", unlock-47 "Pin 915x412", unlock-55 "Cryptex 800x600", unlock-56 "Pin 800x600"; the slice 7 audit cites unlock-47 and unlock-56 for the PIN plate. The page's image files are named one ahead (`branch-after-unlock-44-container-915x412-*.webp` under card unlock-43), and the R3 shots were renamed after those file names. So `unlock-56-cryptex-letters-before-after-x6.png` carries the PIN card's id, and `UX_SLICE7_BUILD_LOG.md:153` states the offset the wrong way round.
Fix: keep the map. Add a comment above it: "card ids from the review page, not its image file names, which run one ahead from container on". Rename the R3 after-shots `unlock-43` to `unlock-59` down by one (container 915x412 to unlock-43, cryptex 800x600 to unlock-55; the notes shots become unlock-42 and unlock-51), and correct the log line.

**n3. One `visibilitychange` listener stays on the document per pump open.**
Three opens and closes leave three more (`probe/pump-input.log`). Phaser 3.60's `VisibilityHandler` adds it at boot and has no removal, so every Phaser minigame does this, and each one holds its destroyed game in memory. It predates this slice. Fix (later, engine-wide): upgrade Phaser, or wrap `document.addEventListener` while a minigame's game boots and remove that listener after `destroy(true)`.

## Other R3 changes

- Pump divider (R3 m3): at 1400x1000 the rule sits clear below "VOL REMAINING" and above the prompt (`followup/crop_pump1400_screen_x3.png`). Fixed.
- Scoped filter (R3 m4): computed filters are `brightness(0) opacity(0.75)` on the copy icon and `none` on the notepad icon; the notepad page keeps its outline and lines on the light button (`followup/crop_text_toolbar_x4.png`). Fixed.
- Bluetooth Instructions collapse (R3 m2): the first device card is whole at every size tried; Instructions fold away at 480px high and below (915x480 hidden, 915x481 shown at 68px). Their scrollbar is a flat cyan 8px bar like the list's (`scrollbar-color` is `auto` there, so the WebKit rules apply). Fixed down to 412px high; m2 and m3 above.
- Tests: `engine-fixes-round4.test.mjs:91-94` follows the scoped rule and adds a check that no rule filters every toolbar icon; sound. `minigame-html-sweep-b.test.mjs:68-76` checks the icon attribute names exactly and rejects any `on` attribute on every element; this closes R3 n1. The new pump tests in `minigame-close-shell.test.mjs` cover the tap model and the cue well, but one of them asserts the touchend cancel (B1). They also add three window listeners that are never removed; harmless in a one-file process.
- R3 n2 and n3 (dead `cancelText`, DEL at 16px): fixed.

## Out of scope, for slice 12

The sweep still reports, outside slice 7's scope (not findings here):
- esd-pushbutton: 2 gradients, a hairline, an off-grid font size.
- alarm-panel: a border radius.
- coverage-decision-form: 3 non-pixel fonts, 2 hairlines.
- backup-recovery: a gradient, 3 off-grid font sizes.
