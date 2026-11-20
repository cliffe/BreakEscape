# UX feedback round, slice 3a: build log

Branch `build/ux-copier` (from `build/ux-feedback`). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md`, slice 3a (cards main2-16, main2-17, main2-21, main2-22; retake main2-19).

## What changed

### Stepped corners back on the card copier (main2-17, main2-22)

`public/break_escape/css/rfid-minigame.css`, `.flipper-zero-frame`. The clip-path polygon from 6990989ac^ is back, held in a custom property `--copier-steps` so three layers share it. A border or inset box-shadow on a clipped box is cut away at the corners, so the 2px outline and the bevel from 6990989ac are now layers:

- the frame's own background is the dark outline (#1a0d00);
- `::before`, inset 2px, is the light bevel (#ffb366);
- `::after`, offset 2px further down and right, is the orange body with the dark bevel (#b35a00) as a hard inset shadow on its right and bottom edges.

A staircase of 2px steps inset by 2px is the same staircase, so the outline and the light bevel follow every step. The dark bevel follows the straight edges and stops where the bottom-right steps start; the steps there meet the outline directly. The soft drop shadow from before 6990989ac stays out (pixel-art rule; the clip would cut it anyway). Padding is 20px, so the content sits where it did.

### Emulation screen held (main2-21)

`public/break_escape/js/minigames/rfid/rfid-ui.js`, `showEmulationScreen`: the screen (signal icon, protocol, card name, three data fields, "Emulating...") now stays up for `EMULATION_HOLD_MS` = 1500 ms before `handleEmulate` (was 500 ms). Opened at a reader its breadcrumb reads "At the reader > Emulating"; from the inventory it stays "RFID > Saved > Emulating". Measured live: about 1.5 s from the Emulate press to the result.

### Menu icons on Copy and Take (main2-16)

- `public/break_escape/js/systems/action-menu.js`: Take carries the open hand (`hand_frames.png` frame 0, 32px cells, x2 fills the 64px box). Copy carries `assets/objects/rfid_cloner.png` (11x22) at x2, 22x44, as the placeholder until the copier menu icon is drawn (slice 8).
- `public/break_escape/js/ui/interaction-menu.js`: a plain image icon may give `width` and `height`; it is then drawn at exactly that size, centred, so it is never scaled by a fraction. Icons without them keep `contain`.

## Tests

Run without the lock (test lock rule), every file touching the changed modules:

- `rfid-door-screen.test.mjs` 10/10. New: the frame's stepped polygon (36 points, every offset a whole 0/2/4/6/10px), the frame clipped to it, no border or shadow on the clipped frame, both layers clipped to the same steps, no blurred shadow; the emulation screen held at least 1.5 s with the reader breadcrumb at a door and the device's own trail from the inventory. The old check that banned `clip-path` now bans only `border-radius` and 1px borders.
- `action-menu.test.mjs` 13/13. New: both entries carry icons; the Copy placeholder is the same whole multiple of 11 and 22 and fits the box; default assets path.
- `inventory-menu.test.mjs` 19/19. New: an exact-size icon is centred at that size, a sheet frame scales to the box, a plain image keeps `contain`.
- Also green: engine-fixes-pass3 6, engine-fixes-pass4b 10, rfid-clone-card 12, minigame-html-sweep-c 13, rfid-no-keycards-hint 3, rfid-dictionary-attack 3, rfid-denial-hold 10, rfid-crypto-contrast 12, rfid-flipper-back 3, escaping-shared-helpers 20.

No new static imports, so no harness copy lists change. No Rails code changed.

## Live proof

Keyless server on :3320 from this worktree, physics at setFPS(20) with fixed steps. Game 2405: `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`. Path: pick up the copier, interact with the visitor card, Copy, Save, go to the IT lobby, use the visitor-room reader, Emulate.

Shots (webp) in the session scratchpad, `ux-shots/slice3a/`:

- `after-main2-16-left-card-clone-or-take-menu.webp`, `after-main2-16-menu-zoom.webp`: both entries with icons (computed sizes 22px 44px centred, and 256px auto for the hand sheet).
- `after-main2-17-left-card-cloner-reading.webp`, `after-main2-17-corner-zoom.webp`, `after-main2-17-corner-br-zoom.webp`: stepped corners with outline and bevel.
- `after-main2-19-cloned-card-at-reader.webp`: the door screen in the stepped frame.
- `after-main2-21-flipper-emulating-clone.webp`: the details screen, 0.7 s after the press, breadcrumb "At the reader > Emulating".
- `after-main2-22-flipper-emulate-result.webp`: Access Granted in the stepped frame.

## Sync

Client display only. No player_state change, no new request.

## Art needed

- Copier menu icon (already in the plan's art list): 32x32, shown x2 in the 64px menu box, copier palette (body #FF8200, light #ffb366, dark #b35a00, black screen with orange text). Replaces the `rfid_cloner.png` placeholder in slice 8 (pass `frame`/`cell` or `width: 64, height: 64`).

## Notes

- The copier overlay is centred in a space of odd height, so at 1400x1000 the frame sits at y = 160.5 and the stepped edge pixels blend slightly. This is general to the minigame overlay, not to this slice; snapping the overlay to whole pixels would fix it.
- The edits to `rfid-ui.js` and `rfid-minigame.js` on `merge/m03-improvement-loop` (Back to the read, Abandon read, dictionary attack) are already on this branch; nothing to merge.

## R1 fixes

Review: `UX_SLICE3A_REVIEW_R1.md` (0 blockers, 1 major, 3 minors, 5 nits). All fixed except n1, which is logged below.

- **M1, menu detail cut off.** `ui/interaction-menu.js`: the two-line clamp on `.be-im-detail` is gone. The detail wraps to as many lines as it needs (`overflow-wrap: anywhere` for long words), and a menu taller than the window already scrolls. Live, reopened at each size: the Copy detail is 3 lines and Take's 2 at 1400x1000, 800x600 and 390x844, nothing clipped, the menu never scrolls. Tests: no clamp, `text-overflow`, `overflow: hidden`, `nowrap` or ellipsis in the menu styles, and the whole sentence in the entry (`inventory-menu`); Copy's detail keeps "stays where it is" and Take's "owner will notice" (`action-menu`).
- **m1, blurred steps at 1400x1000.** Chrome snaps the box's own paint to whole pixels but draws the clip-path at the layout position, so at y 164.5 the outline was crisp and every stepped edge blended (confirmed in the reviewer's shot). `rfid-ui.js` `snapFrameToPixels`: after the frame is added, and on every resize, it measures the frame and moves it onto whole device pixels with `top`/`left` (the frame is already `position: relative`). A first try with `translate` swapped the blur onto the box paint, so the fix is a layout offset. Only this frame is snapped: the overlay's centring is each minigame's own nested flex layout (`.minigame-container` > `.minigame-game-container` > `.rfid-minigame-game-container`), so a shared snap would move every minigame; other minigames are untouched. The resize listener goes in the copier's cleanup. Live: frame at (480, 165) at 1400x1000, (180, 20) at 800x600 with no offset, (16, 25) at 390x844; 1401x1001 and a resize to 1400x999 re-snap. Pixel rows across each edge show only the outline, bevel and body colours, no blends. Tests: `wholePixelOffset` (including 2x device pixels), the offset set and cleared on resize, the listener removed on cleanup, both interfaces snap.
- **m2, stale emulation timer.** `showEmulationScreen` keeps its timer; `cleanup()` (called from `RFIDMinigame.cleanup`) clears it and the 3 s fallback, and both check that this copier is still `MinigameFramework.currentMinigame` and active before acting. Live: Emulate, close within the hold, open a reader wanting another card, and, again, with the real Cancel button: the new copier stays on its reader screen, no `card_emulated` event, no extra unlock request. Unit test: a superseded copier's timer does nothing, cleanup clears the timer and a late fire does nothing, the live copier still emulates, the fallback is guarded.
- **m3, frame past the edges at 390px.** The phone rule is `box-sizing: border-box`, `width: calc(100% - 32px)` (max 440), and a height of the old 80vh of content plus padding, rounded down to whole 2px (`round()`, with a `calc` fallback line). Wider screens keep content-box. Live at 390x844: 358 wide at x 16, both outlines on screen, top snapped. Test pins the phone rule and the wide rule.
- **n1, dark bevel along the steps: not done.** The body (`::after`) would need its own polygon offset 2px up and left over a dark layer, which is a fourth layer and needs an extra DOM element (both pseudo-elements are used; a hard-stop background trick still clips to the same rectangle-relative steps). Left as is: the bottom-right steps meet the outline directly.
- **n2.** `EMULATION_HOLD_MS` moved above the cloner-name JSDoc.
- **n3.** One definition of the menu icons: `ui/interaction-menu.js` exports `openHandIcon`, `jabHandIcon`, `talkIcon` and sets `window.menuIcons`. `core/game.js` imports them from that module (already statically imported, so no harness copy list changes); `action-menu.js` (no static imports) reads `window.menuIcons.openHand()`. `tap-pick-handler.test.mjs` now takes the icons from the module instead of cutting them from `game.js`; `action-menu.test.mjs` checks Take uses the shared icon and that neither file keeps a copy.
- **n4.** The no-op loop is one assertion, and the `::after` offsets (top/left 4px, right/bottom 2px) and its hard 2px dark bevel are pinned.
- **n5.** At a door the emulation trail is "RFID > Reader > Emulating", carrying on from the reader screen.

Tests (no lock, test lock rule): every file that imports a changed module, 47 files, 705 tests, all green, including `rfid-door-screen` 13, `action-menu` 15, `inventory-menu` 20, `tap-pick-handler` 30.

Live proof: keyless server on :3322 from this worktree, physics at setFPS(20) with fixed steps; games 2443 (copy, save, reader, emulate, race, frame sweep) and 2441 (menu at three sizes), each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`. One `POST unlock` for `visitor_room` (`method: rfid`) about 3.2 s after Emulate, as before. Server stopped.

Shots retaken (webp, `ux-shots/slice3a/`): all eight `after-main2-*` files, plus `after-r1-m1-menu-800x600.webp`, `after-r1-m1-menu-390x844.webp`, `after-r1-m3-frame-390x844.webp`, `after-r1-frame-800x600.webp`, `after-r1-m2-reopened-after-cancel.webp`. The corner zooms are x8 crops of the 1400x1000 frame.

## R2 fixes

Review: `UX_SLICE3A_CODE_REVIEW_R2.md` (0 blockers, 0 majors, 2 minors, 4 nits). All six fixed. Commits 5aea57749 and d50e85e53.

- **m1, X over the stepped corner at phone width: fixed.** `rfid-minigame.css` phone rule: the copier's game container gets 32px of padding top and bottom (`box-sizing: border-box`) and `justify-content: safe center`. With the framework's own `margin: 20px auto` on `.minigame-game-container`, the copier's area runs from 52px down to 52px up, and the X ends at y 45. The frame height is `round(down, min(calc(80vh + 40px), calc(100vh - 104px)), 2px)`, so it fits that area exactly; "safe" centring starts a frame that is still too tall at the top of the area, never under the X. Live: the X never meets the frame at 1400x1000, 800x600, 390x844 (frame at y 65, 714 high), 375x667 (y 53 after the snap, 562 high), 915x412 or 1401x1001. At 320x568 (not a brief size) the 540px `min-height` wins and the frame runs 24px past the bottom of the window instead of under the X. Test: the padding, the 20px margin it adds to, the height formula and the X's position are pinned.
- **m2, Cancel button beside the X: fixed.** `rfid-minigame.js` passes `showCancel: false` and no `cancelText`, and no longer replaces the merged params with the caller's (`this.params = params` was what made the label dead, and would have undone `showCancel: false` too). The base scene keeps the merged object, which still holds every caller param (`mode`, `cardToClone`, `onRefused`). The base-minigame stubs in five rfid test files now keep `params` as the real base does. Live: no `#minigame-cancel` in the copier at any size; Emulate then close by the X, and by Escape, 0.3 s into the hold, then reopen: the reader screen stays ("RFID > Reader"), no `card_emulated`, no unlock request; a normal Emulate afterwards sends one `card_emulated` (success) and one `POST unlock` for `visitor_room` (`method: rfid`). Test: showCancel false reaches the base, no Close label, caller params kept, the base still wires the X and Esc.
- **n1, dark bevel along the steps: fixed.** `createFlipperFrame` adds a first child, `div.flipper-bevel` (`aria-hidden`), in the dark bevel colour at the old body position (4px top and left, 2px right and bottom), clipped to the same steps. The body (`::after`) moves 2px further in on the right and bottom and loses its inset shadow. Positioned z-index -1 layers paint in tree order, so it is light bevel, dark bevel, body. Live pixel check of all four corners at 1400x1000, 800x600, 390x844, 375x667, 915x412 and 1401x1001: every pixel inside the steps is one of the four palette colours, no blends, and the dark bevel now steps round the bottom-right corner (`corner-br-1400x1000-x8.png`).
- **n2, layout change without a window resize: fixed.** `snapFrameToPixels` also sets a `ResizeObserver` on the copier's container and the frame; the snap changes only `top`/`left`, never a size, so it cannot retrigger itself. A second snap replaces the old observer; `cleanup()` disconnects it. Live: a 1px padding change inside the overlay moved the frame to y 205.5 and it re-snapped to 206 with no resize event. Test: what it observes, a callback re-snaps, replaced on a second snap, disconnected on cleanup.
- **n3, `takeIcon` window guard: fixed.** `typeof window !== 'undefined'` like its neighbours; no window or no menu icons gives no icon, no throw. Test in `action-menu`.
- **n4, `position: relative` pinned:** one assertion on the wide frame rule.

Listeners, live (`resize` listeners and live `ResizeObserver`s, counted from page start): 3 and 1 in the world, 4 and 2 with the copier open (clone or reader), back to 3 and 1 after Save, a successful Emulate, the X, Escape during the hold, and five open and close cycles.

Tests (no lock, test lock rule): every `test/js` file that imports a changed module or the base scene, 123 files, 1576 tests, all green, including `rfid-door-screen` 18 and `action-menu` 16.

Live proof: keyless server on :3324 from this worktree, physics at setFPS(20) with fixed steps, stopped afterwards. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`: 2468 (sizes, corners, layout nudge, listeners) and 2469 (close paths, race, cycles, emulate). Shots in the session scratchpad, `ux-shots/slice3a-r2fix/`: `door-<size>.png` at each size, `corner-<tl|tr|bl|br>-<size>.png`, `phones-side-by-side.png`, `corner-tr-390x844-x8.png`, `corner-br-1400x1000-x8.png`, `race-reopened-x.png`, `race-reopened-escape.png`, `emulating-1400x1000.png`.

## R3 fixes

Review: `UX_SLICE3A_CODE_REVIEW_R3.md` (0 blockers, 1 major, 0 minors, 2 nits). M1 and n2 fixed; n1 left as it is, as directed. Commits 1e5c05f27 (CSS) and f4500d0ac (tests).

- **M1, copy screen off the window at 915x412, Save unreachable: fixed** with the reviewer's tested fix. `rfid-minigame.css`: `justify-content: safe center` moves from the phone rule to the base `.rfid-minigame-game-container` rule, so a frame taller than its area starts at the top at every width. The wide `.flipper-zero-frame` gets `min-height: 0; max-height: 100%`: the frame no longer grows to its content (577px on the copy screen after a read), it stays inside its area and `.flipper-screen` (`flex: 1`, `overflow-y: auto`) scrolls. Save and Abandon stay inside the scrolling screen; moving them out of it was the reviewer's optional extra and is not done.
- **n2, bottom 24px of the frame below a 320x568 window: fixed.** The phone `min-height` is now `min(540px, calc(100vh - 104px))`, so the minimum never passes the area. At 320x568 the frame is 464px high, y 52 to 516.
- **n1, light and dark bevels side by side at the top-right and bottom-left corners: left as it is.**

Live, copy screen after reading the visitor card, then the door reader screen, at each size (frame x, y, width, height; the X ends at y 45 at every size and never meets the frame):

| Size | Copy screen frame | Screen scroll (content in view) | Save after scrolling | Reader frame |
|---|---|---|---|---|
| 1400x1000 | 480, 205, 440, 590 | 496 in 496 | y 712..758 | same |
| 800x600 | 180, 20, 440, 560 | 483 in 466 | y 497..543 | same |
| 915x412 | 238, 20, 440, 372 | 483 in 278 | y 309..355 | same |
| 390x844 | 16, 65, 358, 714 | 620 in 620 | y 696..742 | same |
| 375x667 | 16, 53, 343, 562 | 519 in 468 | y 514..578 | same |
| 320x568 | 16, 52, 288, 464 | 519 in 370 | y 415..479 | same |

At every size the frame is inside the window, its edges are on whole pixels (snap check), and `elementFromPoint` at the centre of Save, scrolled into view, is Save. A real click on Save at 915x412 posted `clone_card` (`object_id: visitor_card`). Corner check: every pixel in the four 12px corner squares of the frame, on both screens at all six sizes, is a palette colour or the dark backdrop, no blends. Opening the copier fresh at 915x412 and at 320x568 (rather than resizing to them) gives the same frames.

Tests: `rfid-door-screen` pins `safe center` on the base rule (and not on the phone rule), `min-height: 0` and `max-height: 100%` on the wide frame, `flex: 1` and `overflow-y: auto` on the screen, and the phone minimum. A new test checks, by the arithmetic of those rules (node cannot measure layout), that the copy screen's frame fits a 412px-high window, wide and phone, and that the 320x568 frame is 464px. Every `test/js` file that reads the changed CSS or imports `rfid-minigame` (no lock, test lock rule): 10 files, 90 tests, all green, `rfid-door-screen` 20/20.

Live proof: keyless server on :3326 from this worktree, physics at setFPS(20) with fixed steps on, stopped afterwards. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`: 2504 (all six sizes, both screens, Save at 915x412) and 2505 (copier opened fresh at 915x412 and 320x568). Shots in the session scratchpad, `ux-shots/slice3a-r3fix/`: `copy-<size>.png` (top of the screen), `copy-<size>-scrolled.png` (Save in view), `reader-<size>.png`, and `fresh-copy-*` and `fresh-reader-*` for game 2505.

## R4 fixes

Review: `UX_SLICE3A_CODE_REVIEW_R4.md` (0 blockers, 0 majors, 2 minors, 1 nit). All three fixed in commit 42ddbc91a (CSS, `rfid-ui.js`, tests).

- **m1, main action or status below the fold at short sizes: fixed.** The copier now uses the network view's layout (slice 1): a fixed header, a scrolling body, a fixed footer. `createFlipperFrame` builds the header, then `.flipper-display` (the grey screen: the scrolling body `#rfid-screen` over a "More below" strip), then `.flipper-footer`. Every view clears both through `freshScreen()`, and the main controls go in the footer through `addToFooter()`: Save (or Save UID, or Crack keys first) and Abandon read on the copy screen, "> Emulate" and Back on the details screen, Back on the saved and tap lists, and Back and Abandon read on the protocol screen. The footer is hidden when empty (`:empty`), so the menu, the reader and the emulating screens look as before. "Emulating..." now comes straight after the breadcrumb, the read status and its progress bar come first on the reading screen, and the keyless crack hint sits above the card data. The body has a pixel-art scrollbar: a local copy of slice 1's `.pixel-scroll` shape (14px, 2px borders, flat colours, no arrow buttons) scoped to `.flipper-zero-frame` in `rfid-minigame.css`, with a comment naming `.pixel-scroll` in `css/utilities.css` on build/ux-net so the two can be merged; the old translucent 8px bars are gone. The saved-card list no longer has its own inner scroller, so each screen has one scroll area and one cue. "More below" (stepped orange arrow) shows while the body runs past the display's bottom edge and hides at the end; a scroll listener, the existing ResizeObserver and one MutationObserver on the body keep it current, and cleanup disconnects the MutationObserver. The stepped corners, bevel layers and frame sizes are unchanged. The reviewer's optional short-window tightening was not needed and is not done.
- **m2, `max-height: 100%` credited with the shrink fix: fixed.** `max-height` is removed from the wide frame, `flex-shrink: 1` is written out, and the comment now says that flex shrink with `min-height: 0` holds the frame to its area, and why a 100% cap on this content-box frame never bound. The test pins `flex-shrink` as present and not 0, refuses a `flex: none` shorthand and any `max-height`, and models the wide height as `min(590, area)` because the frame shrinks.
- **n1, X over the frame at 501 to 529px wide: fixed.** The phone breakpoint is `max-width: 530px`.

Live, every screen opened fresh at each size, no scrolling (frame x, y, width, height; the frame is the same on every screen at a size):

| Size | Frame | Footer controls visible, no scroll | Status line in view | "More below" shown on |
|---|---|---|---|---|
| 1400x1000 | 480, 205, 440, 590 | all | yes | none (all fit) |
| 800x600 | 180, 20, 440, 560 | all | yes | copy, NPC copy |
| 915x412 | 238, 20, 440, 372 | all | yes | copy, NPC copy, details, both emulating |
| 390x844 | 16, 65, 358, 714 | all | yes | none |
| 375x667 | 16, 53, 343, 562 | all | yes | copy, NPC copy |
| 320x568 | 16, 52, 288, 464 | all | yes | copy, NPC copy, details, both emulating |

All ten screens at all six sizes: frame inside the window on whole pixels, X clear of the frame and hit by `elementFromPoint`, no `#minigame-cancel`, every control in the body and the footer hit at its own centre without scrolling, "More below" shown exactly where the body overflows and hidden once scrolled to the end. The scrollbar shows (14px) wherever the body overflows. Corner check: 60 screens, 0 off-palette pixels in the four 12px corner squares. Listeners: 3 `resize` and 1 ResizeObserver in the world, and the same after every size's opens and closes.

n1, each screen opened at 1400x1000 and resized into the band (at 501x400 the objectives panel blocks the test bridge's interact, so the screens cannot be opened there): copy and reader screens at 501x400 (frame 31, 52, 440, 296), 529x600 and 530x600 (45, 52, 440, 496), and 531x400 (wide rule, 46, 20, 440, 360), plus the door emulating screen at 501x400. The X is clear of the frame at every one, footers in view, corners clean (9 screens).

Flow at 915x412, real mouse, no scrolling: Save at y 326..372 in the footer; a click posted `clone_card` (200). At the visitor room reader a click on the saved card showed "RFID > Reader > Emulating" with "Emulating..." in view, then `POST unlock` (`visitor_room`, `method: rfid`, 200), `card_emulated` true, and `enterRoom('visitor_room')` went through. NPC path at 915x412: a real click on Save (no scrolling) posted `clone_card` for Dana and the chat came back on its hub. Abandon at 320x568: a real click at y 464, no scrolling, closed the copier with no request.

Tests: `rfid-door-screen` gains seven tests (frame structure; footer contents on the copy, details, saved and protocol screens; status first on emulating and reading; the cue's show and hide; the body watcher's cleanup; footer, display and scrollbar CSS) and has the m2 and n1 changes: 28/28. Every `test/js` file that imports `rfid-minigame` or the rfid folder or reads `rfid-minigame.css`, run without the lock (test lock rule): 16 files, all passing.

Live proof: keyless server on :3328 from this worktree, physics at setFPS(20) with fixed steps on, scrollbars shown (Playwright's `--hide-scrollbars` default dropped), stopped afterwards. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`: 2550 (all ten screens at six sizes), 2551 (Save, Emulate, door at 915x412), 2552 (n1 band), 2582 (Abandon at 320x568). Game 2551's Abandon step did not run (the objectives panel stayed blocking after the door), so 2582 was made for it. Shots in the session scratchpad, `ux-shots/slice3a-r4fix/` (`<screen>-<size>.png`, `copy-<size>-scrolled.png`, `flow-915x412-*.png`, `flow-320x568-abandon-in-view.png`, `phones-r4fix.png`, and `n1/`).

## Final fixes

Review: `UX_SLICE3A_CODE_REVIEW_R5.md` (0 blockers, 0 majors, 1 minor, 3 nits), plus the tray Read item it listed outside the slice. All fixed in commits 27eea511e and e32a3d98e (`rfid-ui.js`, `rfid-minigame.js`, `interactions.js`, `rfid-minigame.css`, tests).

- **m1, protocol action below the fold: fixed.** The protocol screen's action (Dictionary Attack, Darkside and the dim Dictionary, Nested, Read & Clone, Save UID Only) is now a footer button, above a row holding Back and Abandon read. Live, the action is hit at its centre with no scroll at all four sizes (body 422 in 384 at 1400x1000, 354 at 800x600, 166 at 915x412, fits at 390x844).
- **n1, Enter and focus: fixed.** Every copier control is a real `button` (menu entries, saved, held and reader entries, Back, Abandon read, Emulate, the protocol actions), with `role="button"` kept for the test bridge. Each screen focuses its main control when it opens: "> Read" on the menu, the first card on a list (or Back when it is empty), the first entry at a reader, "> Emulate" on details, Save (or Save UID, or Crack keys first) on the copy result, the first action on the protocol screen. A keydown handler on the frame presses the focused control on Enter or Space (not left to the browser, so a key the game captures cannot swallow it) and moves between controls on the arrow keys, clamped at the ends; neither reaches the world. Esc still bubbles to the minigame's close handler. A refusal takes the focus while it shows, and Enter or Space continues from it as a tap does. The focus ring is a square 2px white outline (`:focus-visible`), so a mouse player does not see it.
- **n2, footer controls on the orange body: fixed.** Footer buttons have a dark fill (#2a2a2a) with orange text, a 2px #4d4d4d top-left and #111 bottom-right inset bevel and the 2px dark outline; Abandon read keeps its grey with the same bevel. "> Emulate" is now one of these buttons. No radius anywhere.
- **n3, lists reset to the top: fixed.** Leaving the saved list, the tap list or a reader's list records its scroll position and the entry chosen; showing the same list again restores both, with the focus on that entry (no scroll jump). The copier's menu forgets them, so opening Saved from the menu starts at the top. Live, Back from card 12's details returned to scroll 142, 172, 360 and 18 at the four sizes, and the reader list came back at 399 (915x412) and 57 (390x844) after a refused card.
- **Tray Read: fixed.** `interactions.js` opens the tray copier with the held keycards as `availableCards`. Picking one there reads it for copying (`startHeldCardRead`: clone mode, `cloneFrom: 'inventory'`, the normal read and result screens), as clicking the card in the inventory does; the old "Card Read" result closed the copier and did nothing. At a reader a held card is still a tap.

Tests: `rfid-door-screen` gains five tests (main control focused on each screen; Enter, Space, arrows and Esc; list scroll and entry kept after details and after a refusal; the tray Read lists and reads a held card, a door tap unchanged; Enter continues a refusal) and its footer tests now expect the protocol action and Emulate as buttons: 33/33. `rfid-cloner-click-guard` gains one (the tray opens with the held keycards, and an empty list with no inventory). Every `test/js` file that imports the rfid code or `interactions.js` (37 files), run without the lock: 415 tests, 415 passing.

Live proof: keyless server on :3330 from this worktree, physics at setFPS(20) with fixed steps on, scrollbars shown, stopped afterwards. New games, each `test_access_doors` swapped onto a `test_access_social` host: 2628, 2629, 2630, 2631 (main2-16 to main2-23 at 1400x1000, 800x600, 915x412 and 390x844), 2632 (held copy, tray menu, tap list, 12 saved cards, protocol screen at four sizes, DESFire, Abandon), 2633 (reader with 12 cards, refusal, right card), 2634 (keyboard pass), 2635 (Dana's badge at 915x412: Esc, Abandon and Save each back to the chat hub). Every Save posted `clone_card` (200) and every emulation `unlock` (200); frames as in R5; listeners 3 `resize` and 1 ResizeObserver after every run.

Keyboard pass (game 2634, 1400x1000), Tab, Enter and Esc only inside the copier: the copy result opened with Save focused; Tab went to Abandon read and on round to Save in four stops; Enter saved (`clone_card` 200). From the tray, "> Read" was focused; Tab to Saved, Enter opened the list on the card, Enter opened its details on "> Emulate", Esc closed. At the visitor room reader the saved card was focused; Enter emulated, Access Granted, `unlock` 200, and `enterRoom('visitor_room')` went through. A keyless MIFARE read: Enter on Crack keys first, Enter on the focused Dictionary Attack, then Save focused on the cracked read; Esc closed.

Shots: session scratchpad, `ux-shots/slice3a-final/` (the R5 names overwritten, plus `kbd-*-1400x1000.png` and `protocol-screen-800x600.png`, `protocol-screen-390x844.png`); scripts in `slice3a-final-tools/`.

## Handover

Slice 3a and its R1 to R5 fixes are done. Nothing in progress. Open: the copier menu icon art is still slice 8. R3 n1 (bevel jogs at two corners) left as it is unless the user asks.
