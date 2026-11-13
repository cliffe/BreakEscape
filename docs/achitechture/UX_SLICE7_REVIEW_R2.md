Counts: blockers 1, majors 2, minors 6, nits 5

# UX feedback round, slice 7: code review, round 2

Branch build/ux-pixel at a8ea9ee6b, reviewed against round 1 (`UX_SLICE7_REVIEW_R1.md`) and the R1 fixes in `UX_SLICE7_BUILD_LOG.md` (commits 02d26249b, 645d23766, dfae28cb4, 10e87fe85, 959affc00, d1144c2c5, a8ea9ee6b). Rules: `ui-design-language`, `pixelart-ui-rule`, audit section b (`UX_GENERAL_RULES_AUDIT.md` on build/ux-audit).

## What I checked

- Keyless headless server on :3343 from this worktree (setFPS(20), fixed steps on), stopped afterwards. Game 2490, new, made with `swap-scenario-game.rb test_seating test_seating`.
- `pixel-style-sweep.mjs --offline` on the 17 `closeInsideFrame` scenes at 1400x1000, 800x600 and 915x412: PASS, VT323 loaded with the Google font hosts blocked, no remote font request. The NCSC brief was swept again with its sis03 object as params (the shared params file has none, so the first pass drew an empty brief).
- `ui-rules-audit.mjs` (from p-ux-audit) on the same 17 scenes at the same three sizes.
- A live probe: each scene opened with an `onComplete` spy and closed by the X, by Esc and by Cancel where one exists; PNG shots of the combination, cryptex and PIN pads with the text boxes measured; every font request logged; VT323 rendered at 16 to 80px to test its grid.
- Before and after pairs (R1 "before" from 71ad39fef against my shots) for PIN, combination, cryptex, container, text file, BLE, Bluetooth, NCSC brief, pump, fingerprint reader, SCADA, biometrics, network architecture and SIEM.
- Tests, without the lock: `minigame-pixel-art` 46 of 46; 141 test files that import a changed module or read a changed stylesheet: 140 pass, 1 fails (B1).
- Shots: scratchpad `ux-shots/slice7-r2/` (sweep webp per scene and size, `audit/` PNGs and JSON, `probe/` PNGs, `cmp/` crops and pairs).

## R1 findings, checked live

- M1 VT323 self-hosted: fixed. `fonts.css` declares both subsets from `assets/fonts/VT323/`; the only font requests are `PressStart2P-Regular.woff2`, `gnf.woff2` and `VT323-latin.woff2`, all 200 from the game server. No `fonts.googleapis.com` or `fonts.gstatic.com` reference is left in `css/`, `js/` or `app/views` (only `public/break_escape/index.html.reference`, which the game does not load). `OFL.txt` carries the upstream VT323 copyright line ("Copyright 2011, The VT323 Project Authors") and the full SIL OFL 1.1 text (preamble, definitions, five conditions, termination, disclaimer). Both woff2 files are valid WOFF2 (TrueType). I could not check the npm tarball hash offline.
- M2 working states: fixed. Pump main screen, BLE and Bluetooth with two devices, kit with two samples, reader with two lifts and the NCSC brief open all draw in the sweep.
- M3 readable sizes: the sizes are fixed (VT323 16px and over in the DOM, pump values 16px), but the canvas card now has two new problems (M1, M2 below).
- Canvas `pixelArt` and `roundPixels`: set (`infusion-pump-minigame.js:144-145`); see M2 for what that does at a fractional FIT scale.
- DEL label: both keypads read DEL; the pump key value is 'DEL' and the backspace handler still fires.
- m1 to m5 of R1: the sweep reports none of them; spot checks agree.

## The framework Cancel change

Before this change every framework Cancel called `closeByPlayer()`, exactly as the X and Esc do (`base-minigame.js:68-87`, `:141-150`). No scene rebinds the X or Cancel to a different result except lockpicking (keeps its button) and the password lock-out screen (keeps its button, and rebinds X, Cancel and Esc to the same `closeByPlayer`). So no minigame lost a reset, give-up or different callback, and no flow can break from the removal. Scenes override `complete()`, not the button, so the X still runs their extra work (RFID's return to the conversation, the PIN's `cancelled: true` result).

Probe results, each closed by X, Esc and Cancel in turn:

| Scene | keepsCancel | Cancel shown | X | Esc | Cancel |
|---|---|---|---|---|---|
| container, combination, cryptex, text file, BLE, pump, SCADA | no | none | onComplete(false) | the same | - |
| PIN | no | none | onComplete(false, {cancelled: true}) | the same | - |
| SIEM | no | none | onComplete(false, {aborted: true}) | the same | - |
| RFID copier | no | none (its `showCancel: true` at `rfid-minigame.js:40` is inert) | complete(false), returns to a pending conversation | the same | - |
| password (slice 2a) | yes | "Cancel" | onComplete(false) | the same | the same |
| notes | yes | "Continue" | onComplete(false) | the same | the same |

Lockpicking and person chat keep their buttons, as asked (person chat is q100). See n1 for lockpicking.

The five test edits that click `#minigame-close` instead of `#minigame-cancel` (access-remote-signin, capture-log, container-shares four times, network-view three times) are sound: both buttons ran the same `closeByPlayer()`, so each test asserts the same path as before. The title-escape test now uses a `keepsCancelButton` subclass, which still covers the hostile `cancelText`. `password-signin-mode.test.mjs:146` still clicks `#minigame-cancel`, which is right because the password screen keeps it.

## The X inside the frame

The audit reports 0 `x-on-frame` on all 17 scenes at all three sizes (its container start failed on the audit's own params; the sweep shots show the container X inside its frame at all three sizes). The probe found the X visible on every scene.

## PIN plate (unlock-47, unlock-56)

Restored. At 800x600 the grey plate now fills the window behind the title, display, every key and the attempts log, with nothing spilling past it; at 915x412 the keypad stands beside the display and log, all on the plate. Against the R1 "before" (plate ending at the screen edge, display cut at the top, Cancel over the log) this matches the user's notes. Pair: `cmp/unlock-56_pin_800x600_pair.png`, `cmp/unlock-47_pin_915x412_pair.png`.

## Combination and cryptex

- Combination digits, Press Start 2P 48px weight 400: on grid. Each glyph box holds 6 colours at all three sizes (white, the background and the 1px LCD fringe of headless Chrome), the blocks are 6px, and both digits fit the 120px box. Text sits at x 153.5 at 915x412 but still renders on whole pixels. The frame wraps the header, dials, status and Reset/Unlock at all three sizes.
- Cryptex letters, VT323 64px weight 400: fit at all three sizes, but not on a pixel grid (m1).

## Findings

### Blockers

**B1. The NCSC brief's new pixel icons fail the hostile-input sweep test, so the JS suite is red.**
`test/js/minigame-html-sweep-b.test.mjs:56` (`assertClean`) asserts the brief root holds no `<img>`, to prove scenario text never became an element. R1 m4 added three trusted icons as `<img>` (`ncsc-brief-minigame.js:96`, `:99`, `:111`, `:114`), so the test fails: "sealed: no img injected". Rerun alone, it fails the same way. The build log's "165 test files ... all pass" missed it; merging this would turn main's suite red.
Fix: in `assertClean`, ignore the known icons (`root.querySelector('img:not(.ncsc-envelope-icon):not(.ncsc-badge-icon)')`) and add an assertion that each kept `img` has one of the three fixed `src` values; or draw the icons as CSS backgrounds on spans so the brief keeps no `<img>`.

### Majors

**M1. The pump's MAR card rows run into its divider lines.**
`infusion-pump-minigame.js:200-210` places PATIENT, WARD and CONSULTANT at y 63, 79 and 95 with 16px VT323 values, and draws the divider at y 108; `:237-246` puts DURATION at 214 and the divider at 228. A 16px VT323 line is about 18px tall, so the divider runs through the CONSULTANT and DURATION rows. At 1400x1000 it touches the baseline of "Dr. J. Patel" and "4 hours"; at 800x600 and 915x412 it strikes through "CONSULTANT" and "DURATION". The rows are also packed at 16px pitch, so WARD and CONSULTANT touch. Shots: `cmp/pump1400_mar.png`, `cmp/pump800_mar.png`, `infusion-pump_915x412_r2.webp`.
Fix: re-space the card for the new sizes (rows at 20px pitch, each divider 4px below the last row's box), or measure each text's height and place the divider from it.

**M2. At 915x412 the pump card's pixel text is mangled by nearest-neighbour downscaling.**
`pixelArt: true` (`infusion-pump-minigame.js:144`) with `Phaser.Scale.FIT` (`:151`) scales the 820x510 canvas by about 0.78 on a landscape phone. Nearest-neighbour then drops whole rows and columns of the 8px Press Start 2P labels and the 16px VT323 values: the top row of "PATIENT" goes, "M" reads as "N" ("NORPHINE", "RENAINING", "ng/hr"), and the header is unreadable. R1's smoothed canvas was blurry but readable at this size. 800x600 (scale about 0.93) loses single rows too ("14/D3/1962"). Compare `cmp/p915_pair2.png`.
Fix: scale the canvas only by whole numbers when it fits (zoom 1 or 2), and when it must shrink below 1, either render the card at a smaller base size that fits 412px high at zoom 1, or switch the canvas to smooth scaling below zoom 1 (`image-rendering: auto` on the canvas) so the text stays legible. Retake 915x412 and 800x600.

### Minors

**m1. Cryptex letters in VT323 at 64px are not on a pixel grid.**
`cryptex-minigame.css:119`. The ruling took 64px as "4x" a 16px grid, but VT323 has no whole-pixel size in Chrome: across 16 to 80px every size draws grey edge columns (64px: 187 colours in a 5-letter sample; the fewest, 58, at 24px). In the wheel the "A" has uneven stroke widths and grey edges (82 colours in its box, against 6 for the combination digits). Shots: `cmp/cryp800.png`, `cmp/vt_sizes_2x.png`.
Fix: show the user the retake with this note (the ruling was to retake for them). If crisp matters more than the face, Press Start 2P at 48px or GNF at a whole multiple of its native size draw on grid.

**m2. Synthetic bold remains on both themed locks.**
The ruling said no synthetic bold, and the glyphs lost it, but the audit still finds weight 700 on a pixel face in combination (dial labels, direction line, heading: `combination-minigame.css:34`, `:43`, `:82`) and cryptex (wheel labels and heading: `cryptex-minigame.css:34`, `:71`). VT323 and GNF ship no bold, so the browser smears these.
Fix: `font-weight: normal` on those rules; use colour or size for emphasis.

**m3. BLE scanner at 915x412: the device list runs past the frame.**
`ble-scanner.css:217-222`: `.ble-device-list` has a fixed `max-height: 220px`, so on a 412px screen the list ends 16px below the scanner frame and the frame cuts the last card (audit overflow 3; `cmp/ble915_pair.png`). R3: the frame wraps its content at every size.
Fix: make the list take the remaining height (`flex: 1; min-height: 0; max-height: none` inside a column flex game area) so it scrolls inside the frame.

**m4. The expanded Bluetooth panel overlaps its own rows on short screens.**
At 800x600 the "Search devices" field sits half under the "Detected Devices" header; at 915x412 the header and the "Instructions:" heading draw over each other (`bluetooth-scanner_800x600_r2.webp`, `bluetooth-scanner_915x412_r2.webp`, `cmp/bt800_triple.png`). The R1 "after" shows the same at 800x600, so the R1 fix to expand the panel exposed it rather than caused it. `bluetooth-scanner.css:173-183` (fixed `max-height` values on the collapsible sections).
Fix: let the expanded panel's sections stack in a flex column that scrolls inside the frame, with no fixed max-heights.

**m5. The two new framework statics have no behavioural tests.**
`keepsCancelButton` is checked only by regexes on the source (`minigame-pixel-art.test.mjs:244-250`), and `closeInsideFrame` / `placeCloseButton()` / the ResizeObserver clean-up (`base-minigame.js:98-132`, `:325`) have no test at all. The standing rule asks for unit tests plus live proof for each engine feature; only the live audit covers placement.
Fix: a jsdom test that (a) a plain scene given `showCancel: true` draws no `#minigame-cancel` and an empty, hidden controls row, (b) a `keepsCancelButton` scene draws it and it calls `closeByPlayer`, (c) `placeCloseButton()` sets `top`/`right` from stubbed rects with the border and 4px gap, and (d) `cleanup()` disconnects the observer.

**m6. The text file's "Add to Notepad" button floats below the window, over the HUD.**
At 800x600 and 915x412 the button sits in `.minigame-controls` under the white window frame, outside it and over the hearts (`unlock-48_text-file_915x412_r2.webp`, `text-file_800x600_r2.webp`). With Close gone from beside it, it now reads as a stray button. `text-file-minigame.js:59-64` appends it to the framework controls row.
Fix: put Add to Notepad in the window's own toolbar beside Copy and Select All, or inside the frame's bottom edge.

### Nits

**n1.** Lockpicking keeps a "Close" beside the X for a reason that never runs. `lockpicking-game-phaser.js:26` says its button "can reset the pins", but no starter passes `closeButtonAction` (both pass `cancelText: 'Close'`), so it is a second close. And the reset branch would not work: `:325-327` and `:349-351` drop the base listener from `_eventListeners` without `removeEventListener`, so the base `closeByPlayer` still fires and the X or button would both reset and close. When the person-chat question settles, drop `keepsCancelButton` here, or detach the base listener properly if reset is wanted.

**n2.** NCSC brief: at 800x600 and 915x412 the X box crosses the TLP banner's 2px amber bottom rule (`ncsc-brief-minigame.css:33`, `cmp/ncsc_x.png`). Give the banner `padding-right` for the X and anchor the X inside the banner, or below it.

**n3.** Press Start 2P off its 8px grid in slice scenes, including one size set this round: the DEL key at 12px (`pin.css:219`), the pump gate headline at 9px (`infusion-pump-minigame.css:307`), the PIN keys at 20px bold (`pin.css:180`), the reader sign at 11px, and the X itself at 18px (audit F2). The build log hands these to slice 11; record DEL here so it is not missed.

**n4.** `docs/test-bridge.md:981` still shows `minigame-cancel` in an example state dump. Update or mark it as from before slice 7.

**n5.** The test edits put the comment between `.click()` and the semicolon with three spaces (`... .click()   /* the X ... */;`). Move the comment to the end of the line.

## Follow-ups, not rated (outside this round)

- SIEM at 915x412: the panel runs 120px past the screen bottom and the result banner sits above the top (audit overflow 4); the audit's DISMISS "cancel beside X" is a false positive (an alert action).
- The PIN, SIEM and other full-window containers draw their 2px border 2px outside the viewport (audit overflow 1 at every size); this predates the slice.
- `ncsc-brief-minigame.js:99` and `:116` keep "&mdash;" in two player-facing strings (unchanged lines that this round touched).
- The shared sweep params file has no NCSC entry, so a sweep run without it shows an empty brief; the sweep could fall back to a built-in brief.
