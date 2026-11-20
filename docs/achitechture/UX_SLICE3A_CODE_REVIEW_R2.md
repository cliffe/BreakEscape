Counts: blockers 0, majors 0, minors 2, nits 4

# UX feedback round, slice 3a: code review R2

Branch `build/ux-copier` at f0f16edb6, reviewed as the R1 fix commits 207e0b6af and f0f16edb6 on top of the R1 review (18c31b1f3), plus the slice as a whole against `build/ux-feedback`. Plan: `UX_FEEDBACK_ROUND_PLAN.md` slice 3a. Build log: `UX_SLICE3A_BUILD_LOG.md` ("R1 fixes"). R1: `UX_SLICE3A_REVIEW_R1.md`.

## R1 findings, checked live

Keyless server on :3323 from this worktree, physics at setFPS(20) with fixed steps on, stopped at the end. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`: 2447 (menu at three sizes, copy, save, reader, resize sweep, emulate), 2448 (stale-timer race), 2458 (no saved card, unused), 2463 (frame at short and phone sizes). Shots in the session scratchpad, `ux-shots/slice3a-r2/`.

- **M1, Copy detail cut off: fixed.** At 1400x1000, 800x600 and 390x844 the Copy detail is 3 lines (72 px) and Take's 2 (48 px), `scrollHeight` equals `clientHeight` on both, and the menu does not scroll. The full sentence "...The card stays where it is." shows (`menu-zoom-1400x1000.png`).
- **m1, blurred steps at 1400x1000: fixed.** The frame gets `top: 0.5px` and lands at (480, 165). A resize to 1401x1001 moves the snap to `left: 0.5px`, and 1400x999 clears it. I checked every corner crop at 1400x1000, 800x600 and 390x844 pixel by pixel: the edges hold only the four palette colours (#1a0d00, #ffb366, #FF8200, #b35a00), with no blends. The only off-palette pixels are the anti-aliased logo text inside the frame. The frame also sits on whole pixels at 800x601, 1024x700, 1366x768, 915x412, 1280x721 and 375x667. At the short sizes, flex shrinks its height (480, 579, 291) and the bottom edge still lands on a whole pixel.
- **m2, stale emulation timer: fixed.** At the visitor room reader I pressed Emulate, closed with the X 0.3 s into the hold and reopened the same reader. The new copier stayed on "RFID > Reader" for 2.6 s, with no `card_emulated` event and no unlock request. I got the same result with the Cancel button and with Escape. A normal Emulate afterwards still works: one `card_emulated` with `success: true`, and one `POST unlock` for `visitor_room` with `method: rfid`. The details screen held for about 1.59 s from the press. The trail reads "RFID > Reader > Emulating" (n5).
- **m3, frame past the edges at 390 px: fixed.** At 390x844 the frame is `border-box`, 358 x 714 at x 16, and both outlines are on screen. `round(down, ..., 2px)` takes effect (714 from 715.2), so the `calc` fallback line is only for browsers without `round()`. Dropping the declaration there is valid CSS behaviour. See m1 below for the close button.
- **n1:** not done (logged as needing a fourth layer). Carried as nit n1 below.
- **n2, n3, n4, n5:** done. `EMULATION_HOLD_MS` sits above the cloner-name JSDoc. `game.js` imports the icons from `ui/interaction-menu.js` and the page loads with no errors. Take's icon is `hand_frames.png` at `256px auto`, frame 0, via `window.menuIcons`. The `::after` offsets are pinned, and the trail is one string.

## New code

- **`snapFrameToPixels`, listener leaks: none.** I wrapped `window.addEventListener` and `removeEventListener` from page start and counted live `resize` listeners. The count was 3 in the world and 4 with the copier open (clone or reader). It went back to 3 after Save, after a successful Emulate, and after closing by X, by Cancel and by Escape during the hold. It stayed at 3 after five open and close cycles, so nothing accumulates. A second `create*Interface` on the same renderer removes the old listener first. The pending `requestAnimationFrame` is not cancelled on cleanup, but `snap` returns early once the frame is detached, so that is harmless.
- **Hold timer guard: sound.** `showEmulationScreen` clears any earlier timer before setting its own. `cleanup()` (called from `RFIDMinigame.cleanup`, which every `endMinigame` path runs) clears both the hold and the 3 s fallback. `isLive()` also checks `MinigameFramework.currentMinigame === this.minigame` and `gameState.isActive`, so a timer that escapes cleanup still cannot act on another copier's `#rfid-screen`.
- **`window.menuIcons`:** set when `ui/interaction-menu.js` evaluates. `game.js` imports that module statically, and `action-menu.js` reads it at call time, not at load, so load order does not matter in the game. See n3.
- **CSS `round()` fallback:** correct order (fallback first, `round()` second), and it applies only inside the phone rule. Wider screens keep content-box at 400 + 2 x 20, as 5f65b70a5 set.
- **Regressions:** none found. The unclamped `.be-im-detail` affects every interaction menu (tap disambiguation, inventory item menus). Long details now wrap instead of clipping, and `max-height` already makes a tall menu scroll. The snap touches only `.flipper-zero-frame`. No other minigame changes.
- **Sync:** display only. No player_state change and no new request.
- **Pixel-art rule:** no radius, blur or hairlines. The stepped clip-path corners are kept.

## Tests

Every `test/js` file that imports or reads a changed module: 179 files, 2319 tests passed, run one file at a time without the lock (test lock rule). The key files: `rfid-door-screen` 13/13, `action-menu` 15/15, `inventory-menu` 20/20, `tap-pick-handler` 30/30. One file, `toast-once-across-panel-handover.test.mjs`, failed once under `node --test` and passed on five reruns (four under `node --test`, one with plain `node`, as `bin/test-js` runs it). It uses `minigame-manager.js` and the notifications module, neither of which this branch changes. It is a timing flake.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. At phone width the close X sits on top of the copier's top-right stepped corner.** `public/break_escape/css/rfid-minigame.css:549` (phone rule). At 390x844 the frame's top-right corner is at (374, 25), and the X button covers (345..375, 15..45). At 375x667 the X covers (330..360, 15..45) and the frame's corner is at (359, 20). In both cases the corner steps and the outline that main2-17 and main2-22 asked for are hidden under the button. The user's rule is that the X sits inside the frame and never overlaps its border (`x-over-frame-390x844-x8.png`, `sizes-390x844.png`). This was already the case before R1, since the old frame ran past the edge. The R1 fix brought the frame on screen but left it under the X. Fix: in the phone rule, start the frame below the X with `margin-top: 40px` (the X ends at y 45) and take that out of the height (`round(down, calc(80vh + 40px - 40px), 2px)`), or inset the frame's right side by the X's width. Add a live or layout test that the close button's rect does not meet the frame's rect at 390x844.

**m2. The copier still shows a Cancel button below the frame, beside the X, and it is labelled "Cancel", not "Close".** `public/break_escape/js/minigames/rfid/rfid-minigame.js:40` passes `showCancel: true`. The user's rule: minigames close with the X, and a Cancel button beside it is unwanted. The button costs the frame about 80 px of height on short screens (915x412: frame 291 px high). The `cancelText: 'Close'` on line 41 is dead: line 46 (`this.params = params;`) replaces the merged params with the caller's own before `init()` builds the controls, so the label falls back to "Cancel". Both are older than this slice. Fix: pass `showCancel: false` (and drop `cancelText`). The X and Escape already close the copier, and the m2 race fix covers both paths (checked live). If any flow relies on `this.params.showCancel` or `cancelText`, set them on the merged object instead of overwriting `this.params`. Update any test that expects `#minigame-cancel` in the copier.

### Nits

**n1. (Carried from R1 n1.)** `public/break_escape/css/rfid-minigame.css`, `.flipper-zero-frame::after`: the dark bevel still stops where the bottom-right, top-right and bottom-left steps start, and the body meets the outline directly there. The build log says this needs a fourth layer. A plain child `<div class="flipper-bevel">` added in `createFlipperFrame` (`rfid-ui.js:253`), clipped to `var(--copier-steps)`, would give it one. This is optional.

**n2.** `public/break_escape/js/minigames/rfid/rfid-ui.js:631`: the snap runs only on window `resize`. A layout change inside the overlay without a window resize would leave the frame on a half pixel until the next resize: a message shown in `.minigame-message-container`, or the controls row appearing or going. I did not see it happen, because the copier's messages render inside its own screen. A `ResizeObserver` on `this.container` (disconnected in `cleanup`) would cover it.

**n3.** `public/break_escape/js/systems/action-menu.js:34`: `takeIcon()` uses `window` without the `typeof window !== 'undefined'` guard its neighbours use (lines 31, 41, 49), so calling it outside a browser throws instead of returning no icon. If `ui/interaction-menu.js` has not loaded, Take quietly has no icon. A fallback to the old literal (`{ src: \`${assetsBase()}/icons/hand_frames.png\`, frame: 0, cols: 4, cell: 32 }`) would bring back the duplicate that n3 of R1 removed, so the guard alone is enough.

**n4.** `public/break_escape/js/minigames/rfid/rfid-ui.js:612`: the comment says the frame "is already `position: relative`", but nothing tests that. If the frame's `position` changes, the snap silently does nothing. One assertion in `rfid-door-screen.test.mjs` that `.flipper-zero-frame` keeps `position: relative` would pin it.
