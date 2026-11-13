# UX feedback round, slice 3a: code review R1

Branch `build/ux-copier` at 7a495ddd0, reviewed as `git diff build/ux-feedback...HEAD`. Plan: `UX_FEEDBACK_ROUND_PLAN.md` slice 3a. Build log: `UX_SLICE3A_BUILD_LOG.md`. User notes main2-16, -17, -19, -21, -22.

## What was checked

- User asks. Stepped corners are back: the clip-path polygon from 6990989ac^ is restored point for point. Everything else since 6990989ac is kept: content-box sizing from 5f65b70a5 (frame still 440 px wide, 400 + 2 x 20 padding against 400 + 2 x 18 + 2 x 2 border before), the 2px header and screen borders, the pixel icons, the named card, the door-reader screen (main2-19). The soft drop shadow stays out. The emulation details screen now holds for 1.5 s, with the breadcrumb "At the reader > Emulating" at a door. Take shows the open hand and Copy shows a placeholder copier icon. The user asked for a new copier-style icon, and the plan's art list already carries it to slice 8.
- Live, keyless server on :3321 from this worktree. Game 2422 is `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`, with physics at setFPS(20) and fixed steps on. The path: pick up the copier, open the visitor card's Copy/Take menu, Copy, Save, go to the IT lobby, use the visitor room reader, Emulate. Then I reopened the reader at 800x600, 1400x1000 and 390x844 and tried a cancel-and-reopen race. The server has been stopped.
- Emulation hold and unlock. The details screen was up with the card, protocol and three data fields. The result showed about 1.5 s after the press. Exactly one `POST unlock` went for `visitor_room` (`method: rfid`), about 3.2 s after the press: after the 1.5 s hold and the existing 2 s success screen. So the unlock happens once, after the hold. The hold does not change who decides. This door has no access list, so `Game#rfid_lock_passes?` trusts the client's rfid claim, as it did before this slice. Access-list doors are still checked against the held card ids on the server (slice 3b owns the copy rule there). Input is not blocked during the hold: Cancel stays live, and the screen has no other buttons to press twice. See m2 for the one race this opens up.
- Layered clip. 800x600: the frame sits at whole pixels (x 180, y 20), and the outline and light bevel follow every step crisply. 1400x1000: the frame sits at y 164.5, so every horizontal edge, steps included, blends across two rows (m1). 390x844: x -0.5, width 391 (m3). The pseudo-element layers rely on the clip-path making a stacking context. That holds, and content paints above them.
- Whole-number scales. Hand: 32 px cells at x2 (256px auto sheet). Copier placeholder: 11x22 at x2, giving 22x44 centred. Emulation signal icon: `pixelIcon('signal', 5)`.
- Interaction menu. The new `width`/`height` branch applies only when both are integers. No other caller passes them: `game.js` candidates pass `{src, frame, cols, cell}` or a bare `{src}` (talk), so those keep the sheet rule or `contain`. The test covers all three branches.
- Tests. `rfid-door-screen` 10/10, `action-menu` 13/13, `inventory-menu` 19/19. I reverted each source file in turn to `build/ux-feedback`. The CSS made test 9 of rfid-door-screen fail, `rfid-ui.js` made test 10 fail, `action-menu.js` made tests 12 and 13 of action-menu fail, and `interaction-menu.js` made test 19 of inventory-menu fail. Each new test fails without its change.
- Sync: display only. No player_state change and no new request.
- Pixel-art rule: no radius, no blur, no hairlines. The stepped corners are allowed (user, 2026-11-12).

## Findings

### Blockers

None.

### Majors

**M1. The Copy entry's detail is cut off, and the cut part is the deciding fact.** Since the icons went in, the 64 px icon and the 10 px gap come out of the menu's fixed width (`max-width: min(80vw, 340px)` in `interaction-menu.js`). The two-line clamp on `.be-im-detail` now cuts "Read the card and save a copy on the card copier. The card stays where it is." to "...on the card copier. The card...". The hidden sentence is what separates Copy from Take ("The owner will notice it gone"). The user's before shot shows the full text. The builder's own after shot (`after-main2-16-menu-zoom.webp`) shows the cut, and so does the live run at 1400x1000 (`scrollHeight > clientHeight` on the Copy detail). At phone width (80vw, about 312 px) the text column is narrower still. Fix one of these ways: let a menu with icons grow (for example `max-width: min(80vw, 420px)` when any entry has an icon), allow three lines, or shorten the Copy detail so it fits two lines with the icon ("Save a copy on the card copier. The card stays where it is."). Add a test that pins the chosen rule. A copy-only test should check that the detail string still contains "stays where it is".

### Minors

**m1. At 1400x1000 the stepped corners are blurred by a half-pixel offset.** The overlay centres the 590 px frame in an odd-height space, so the frame's top is at y 164.5. Every horizontal edge (the 2px outline, the light bevel, every step) renders as two blended rows. My corner crops of the live frame show it, and so does the builder's `after-main2-17-corner-zoom.webp`. The build log calls this general to the overlay, which is true. Still, 1400x1000 is the size the user reviews at, and crisp stepped corners are exactly what main2-17 and main2-22 asked for. Fix it in this slice, or give it its own slice before the retake: snap the overlay's centring to whole pixels (round the offset, or make the centred box an even size). Without that, the retake will show soft corners.

**m2. A stale emulation timer can write into a newly opened copier (reproduced).** `showEmulationScreen` checks only `document.getElementById('rfid-screen')`, and that id is global. If the player presses Emulate, cancels within the hold, and opens the copier again (at the same or another reader), the old timer finds the new screen. It runs the old minigame's `handleEmulate`. In the live run, a reader requiring a different card showed "Access Granted" and was left on that screen, the success sound played, and a `card_emulated` event fired with `success: true`. No unlock went out, because `complete()` ignores superseded instances. The window was 0.5 s before this slice and is 1.5 s now. Fix: in the timer, return unless `window.MinigameFramework?.currentMinigame === this.minigame && this.minigame.gameState?.isActive`. Do the same in the 3 s `showSavedCards` fallback in the catch. Add a unit test in which a superseded minigame's timer does not call `handleEmulate`.

**m3. At 390 px wide the frame overflows, and the side outline is lost.** Under `@media (max-width: 500px)` the frame is `width: 90%` plus 40 px of content-box padding, which comes to 391 px wide at x -0.5. The left 2px outline is half off screen, the right outline is off screen, and the corner steps blend (fractional x and y). This was already there before the slice: the old frame had the same 40 px of padding and border. It matters more now because the outline is the restored stepped edge. Fix: `width: calc(100% - 56px)` or `max-width: calc(100vw - 32px)` with `box-sizing: border-box` in the phone rule only. That rule must keep content-box elsewhere for 5f65b70a5. Whole-pixel centring as in m1 also applies here.

### Nits

**n1.** The dark bevel does not follow the steps. The light bevel (`::before` showing past `::after`) follows the top-left staircase. The dark bevel is an inset box-shadow on `::after`, so the clip cuts it away at the bottom-right, top-right and bottom-left steps, and there the orange body meets the outline directly. The build log says so. A fourth layer (a `#b35a00` layer under `::after`, offset up and left by 2px) would make the bevel symmetric. This is optional.

**n2.** `rfid-ui.js`: `EMULATION_HOLD_MS` was inserted between the `clonerName` JSDoc ("What the device is called on screen...") and `DEFAULT_CLONER_NAME`. The cloner-name comment now sits above the hold constant's own comment. Move the constant above that JSDoc.

**n3.** `action-menu.js` `takeIcon()` and `assetsBase()` duplicate `game.js` `openHandIcon()` and `interactionIconsBase()`. `game.js` does not export them, so the copy is understandable. A small shared `ui/menu-icons.js` would keep one hand-sheet definition (and remember the JS test harness copy lists if it is added).

**n4.** `rfid-door-screen.test.mjs`: the `for (const layer of ['::before', '::after'])` loop asserts the same regex twice and never uses `layer`. The test also does not pin the `::after` offsets (top/left 4px, right/bottom 2px), which are what make the bevel 2px. One assertion on the `::after` rule would cover it.

**n5.** The trail at a door changes wording between screens: the reader screen says "RFID > Reader", and the emulation screen then says "At the reader > Emulating". The plan specified the second string, so this is a note for the retake. "RFID > Reader > Emulating" would read as one trail.

Counts: 0 blockers, 1 major, 3 minors, 5 nits.
