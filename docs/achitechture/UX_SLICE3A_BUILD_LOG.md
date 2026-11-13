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

## Handover

Slice 3a, its R1 fixes and its R2 fixes are done. Nothing in progress. Open: the copier menu icon art is still slice 8. At 320x568 (below the sizes checked) the frame's 540px minimum runs 24px past the bottom of the window.
