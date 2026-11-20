Counts: blockers 0, majors 0, minors 2, nits 1

# UX feedback round, slice 3a: code review R4

Branch `build/ux-copier` at a97d68d36. Reviewed: the R3 fix commits 1e5c05f27 (CSS) and f4500d0ac (tests), the "R3 fixes" section of `UX_SLICE3A_BUILD_LOG.md`, and the slice against R1 to R3. R3: `UX_SLICE3A_CODE_REVIEW_R3.md`.

Live: keyless server on :3327 from this worktree, physics at setFPS(20) with fixed steps on (`smoothStep` off, `minFps` 1), stopped at the end. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`: 2521 (every screen at every size), 2522 (Save, Emulate, door, with real mouse input at 915x412), 2523 (Abandon by a real click at 320x568), 2516 (aspect ratio probe). Games 2514 and 2515 were not used: 2514 started a run with a wrong physics call and was stopped, and 2515 was spare. The probe on 2516 ran before the physics call was fixed; it measures layout only, so physics does not affect it. Shots in the session scratchpad, `ux-shots/slice3a-r4/`.

## Live checks

### Every screen at every size

The copier was opened fresh at each size, not resized into it. For each screen the check measured the frame, the X, and every control on the screen (`.flipper-menu-item`, `.flipper-button`, `.flipper-button-back`). Each control was scrolled into view inside the screen and had to be the element under its own centre, inside both the window and the frame.

| Size | Frame (x, y, w, h) | Screens checked | Frame in window, whole pixels | X clear of frame, X hit | Controls reachable |
|---|---|---|---|---|---|
| 1400x1000 | 480, 205, 440, 590 | all 10 | yes | yes | all |
| 800x600 | 180, 20, 440, 560 | all 10 | yes | yes | all |
| 915x412 | 238, 20, 440, 372 | all 10 | yes | yes | all |
| 390x844 | 16, 65, 358, 714 | all 10 | yes | yes | all |
| 375x667 | 16, 53, 343, 562 | all 10 | yes | yes | all |
| 320x568 | 16, 52, 288, 464 | all 10 | yes | yes | all |

The ten screens: world copy reading, world copy result, tray menu, saved list, saved card details, tray emulating, door reader, door emulating, NPC copy reading, and NPC copy result (Dana's badge). The frame holds the same rect on every screen at a given size. No `#minigame-cancel` on any screen. Corner check: in all 60 screen shots, every pixel in the frame's four 12px corner squares is one of the four palette colours or the grey backdrop, with no blends.

Screen content against the visible screen height (scroll height in client height) at the short sizes, where it overflows:

| Size | Copy result | Details | Emulating |
|---|---|---|---|
| 800x600 | 483 in 466 | fits | fits |
| 915x412 | 483 in 278 | 439 in 278 | 424 in 278 |
| 375x667 | 519 in 468 | fits | fits |
| 320x568 | 519 in 370 (NPC 535) | 439 in 370 | 424 in 370 |

See m1 for what this hides.

### Save, Emulate, open the door (game 2522, 915x412, real mouse input)

Read the visitor card. A mouse wheel over the screen brought Save to y 309..355, and a real click posted `clone_card` (`object_id: visitor_card`, 200). At the visitor room reader, a real click on the saved card showed "RFID > Reader > Emulating", then one `POST unlock` (`visitor_room`, `method: rfid`, 200) and `card_emulated` true. The copier closed and `enterRoom('visitor_room')` walked through the door. Shots: `flow-915x412-save-in-view.png`, `flow-915x412-reader.png`, `flow-915x412-emulating.png`, `flow-915x412-visitor-room.png`.

NPC path at 915x412 (game 2521): wheel, then a real click on Save posted `clone_card` with `npc_id: dana` (200). The chat came back on its hub, and the exit line closed it. Abandon at 320x568 (game 2523): wheel, then a real click on "Abandon read" at y 447 closed the copier with no request.

Listeners (`resize` listeners, live `ResizeObserver`s, counted from page start): 3 and 1 in the world, and back to 3 and 1 after every size's round of opens and closes, after Abandon, and after the NPC Save. The door emulating screen was closed by the X inside the 1.5 s hold at each of the six sizes. None of those closes gave a `card_emulated` or an unlock request.

## How `max-height: 100%` resolves, and why the frame is 372px

Short answer: `max-height: 100%` does nothing here. `min-height: 0` plus the default `flex-shrink: 1` makes the frame 372px.

The chain at 915x412, read from computed styles:

1. `.minigame-container` is `position: fixed`, 100vh (412px), a column flex container.
2. `.minigame-game-container.rfid-minigame-game-container` is its only flex item: `height: 100%` (412px) plus `margin: 20px auto`. That needs 452px in 412, so it shrinks. The framework gives it `min-height: 0` (`minigames-framework.css:56`), so it shrinks to 372px at y 20. That is the copier's area.
3. The area is itself a column flex container (`rfid-minigame.css:22`). Its main size comes from flexing in a container of definite height, so it counts as definite, and percentages inside it resolve against 372px.
4. `.flipper-zero-frame` (wide rule) is `box-sizing: content-box`, `height: 550px`, `padding: 20px`, so it wants 590px. `max-height: 100%` caps the content box at 372px, which allows a border box of 412px. That is 40px taller than the area, so the cap never binds.
5. The frame is the area's only flex item, with `flex-shrink: 1`. Before R3, its automatic minimum (`min-height: auto`) was its content (577px on the copy screen), so it could not shrink. With `min-height: 0` it shrinks to fit the area's 372px exactly. Then `.flipper-screen` (`flex: 1`, `overflow-y: auto`) takes what is left and scrolls.

Live probes with injected CSS, frame height at each window height:

| Window | As built | `max-height: none` | `flex-shrink: 0` | `min-height: auto` |
|---|---|---|---|---|
| 915x412 | 372 | 372 | 412 (off by 40) | 412 |
| 1024x500 | 460 | 460 | 500 | 500 |
| 1280x600 | 560 | 560 | 590 | 577 |
| 667x375 | 335 | 335 | 375 | 375 |
| 600x300 | 260 | 260 | 300 | 300 |

Removing `max-height` changes nothing at any size. Removing the shrink puts the frame 40px past its area, which is the padding that `max-height: 100%` does not count. `max-height` only matters when `min-height` is `auto`: then it clamps the content-based minimum, which is why that column reads 412 and not 577.

The rule holds at other aspect ratios. For any window wider than 500px and shorter than 630px, the frame is the window height minus 40, at y 20: 460 at 1024x500 and 560 at 1280x600. Odd heights stay on whole pixels (1024x501 gives 461 at y 20, and 1280x601 gives 561). At 630px and taller the frame is its full 590px, centred: 1024x768 puts it at y 89 and 1920x1080 at y 245. At 500px and narrower the phone rule takes over (500x400 gives 296 at y 52). See m2 for what this means for the code and test.

## R1 to R3: regressions

- R1 (snap, stale timer, Copy and Take details), R2 (X clear at phone width, no Cancel, bevel, ResizeObserver) and R3 (Save reachable at 915x412, 320x568 bottom edge): all hold, per the tables above.
- One visible regression from the R3 fix, at 800x600. Before R3 the copy screen's frame grew to 577px, at y 12..589, and the whole screen showed in a 600px window. Capped to the 560px area, the screen now scrolls by 17px, so the Save and Abandon row is cut through its lower edge until the player scrolls (`copy-800x600.png`). Folded into m1.

## Tests

Every `test/js` file that imports `rfid-minigame` or the rfid folder, or reads `rfid-minigame.css`, run with `bin/test-js -j 3` and no lock (test lock rule): 16 files, all passing. `rfid-door-screen` is 20/20.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. At short sizes the main action or status of a screen sits below the fold, cut or out of sight, with nothing to show it is there.** `public/break_escape/js/minigames/rfid/rfid-ui.js:1043` (the Save and Abandon row goes inside the scrolling screen), `:514` (Emulate) and `:576` (the "Emulating..." line), with `public/break_escape/css/rfid-minigame.css:259` (`.flipper-buttons`, `margin-top: auto` inside `.flipper-screen`).

What breaks:
- 915x412, copy result (`copy-915x412.png`, NPC `npc-copy-915x412.png`): the window shows the card data down to "Facility", with no Save or Abandon.
- 915x412, details (`details-915x412.png`): no "> Emulate".
- 915x412, emulating (`door-emulating-915x412.png`): no "Emulating..." line. The screen moves on after 1.5 s, so the player never sees the status.
- 800x600, copy result: the button row is cut through its lower edge (the R3 regression above).
- 375x667, copy result: the button row is cut in half, and the Save label is out of sight (`phones-copy-emulating.png`, left).
- 320x568: Save is out of sight on the copy result, and the status line is out of sight on the emulating screen (`phones-copy-emulating.png`, middle and right).

Every control can be reached by scrolling, so this is not a major. But the only cue is the scrollbar. Phones and tablets draw overlay scrollbars that stay hidden until the player scrolls, so at 915x412, the landscape phone size the user named, the copy screen looks as if it has no way to save. The user's rule names 800x600 and 915x412 as sizes where the frame wraps all its content. A cut button reads as broken. (Playwright hides scrollbars, so the shots show none at any size. On desktop Chrome the 8px bar from `rfid-minigame.css:451` would show.)

Fix: make the action row a footer of the frame, not part of the scrolling screen. Append `.flipper-buttons` to the frame after `.flipper-screen` (or wrap the screen and the row in a column whose screen part has `flex: 1; min-height: 0`). The row then always shows, and only the card data scrolls. Do the same for the details screen's Emulate and Back, and put the "Emulating..." line before the card data fields so the status shows first. As a second step, add a short-window rule (`@media (max-height: 640px) and (min-width: 501px)`) that tightens the header margin, the 5x icon and the field spacing, so most screens fit with no scroll at 800x600. Test: a live check at 915x412, 800x600 and 375x667 that Save, Abandon, Emulate and the status line are inside the visible screen with no scroll.

**m2. `max-height: 100%` on the wide frame does nothing, and the R3 test and comment credit it with the fix.** `public/break_escape/css/rfid-minigame.css:85-90` and `test/js/rfid-door-screen.test.mjs:387` and `:403-404`.

What breaks: the fix works only because of `min-height: 0` with the default `flex-shrink: 1` (see the explanation above). The CSS comment says the frame is "never taller than its area" because of the cap. The test asserts `max-height: 100%` ("and never grows past its area") and models the frame as `Math.min(550 + 40, areaH)`. On this content-box frame, though, the cap allows area + 40px. If a later change gives the frame `flex: none` or `flex-shrink: 0` (to stop it squashing, say), the frame runs 40px past its area at 915x412. The copier's header then goes under the X band and the bottom goes off the window, and both tests still pass. The test also does not pin `flex-shrink`, the property that does the work.

Fix: either drop `max-height: 100%`, or make it true: give the wide frame `box-sizing: border-box` with `height: 590px` (so 100% caps the border box), and keep `min-height: 0`. Correct the CSS comment to say what holds the frame (flex shrink once the content minimum is gone). In the test, pin the frame's `flex-shrink` as not 0, drop the `max-height` assertion or model it on the border box, and compute the wide height as `min(590, areaH)` because the frame shrinks, not because of the cap.

### Nits

**n1. At window widths of 501 to 529px and heights under about 680px, the X sits over the frame's top-right corner.** `public/break_escape/css/rfid-minigame.css:83` (wide `width: 400px` plus padding, centred) against `:571` (the phone rule starts at 500px). At 501x400 the frame runs from x 31 to 471 at y 20, and the X covers x 456..486, y 15..45, a 15px overlap on the stepped corner (probe, game 2516). Below 680px of height the frame starts at y 20, above the X's bottom at 45. From 530px wide the X clears the frame's right edge, and at 500px the phone rule starts the frame at y 52. This is the R2 m1 rule in a band of widths no device in the brief uses, so it is a nit. It is older than R3. Fix: raise the phone breakpoint to `max-width: 530px` (the phone rule caps the frame at 440px wide, so its width does not change there), or give the wide rule's area `padding-top: 32px` when `max-height: 680px`.
