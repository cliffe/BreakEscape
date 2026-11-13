# UX feedback round, slice 7: pixel pass on older minigames (build log)

Branch build/ux-pixel (from build/ux-feedback). Plan: `UX_FEEDBACK_ROUND_PLAN.md`, slice 7. Status: done.

Sync: client display only. Nothing new in player_state; no sync changes.

## Checks (built first, failing on the old tree)

- `test/js/minigame-pixel-art.test.mjs` (static, node): reads the CSS of the framework shell and the slice 7 minigames, and the minigames' own JS for inline styles (style strings, SVG attributes, Phaser text). Fails on a border or outline under 2px, a hard shadow 1px wide, border-radius without a clip-path in the same rule, a blurred box-shadow, text-shadow or drop-shadow, a smooth gradient, or a first font family that is not GNF, Press Start 2P, VT323 or a `--se-font-*` / `--ui-*font` variable. Hard-stop gradients (the CRT scanlines on framework buttons, the dashed legend lines) count as pixel art. Also pins the framework button hover to a hard ring. On the old tree: 17 of 29 tests failed (about 320 breaches; the review's count, R1 n4). Now 29 of 29 pass.
- `tools/playtest/pixel-style-sweep.mjs` (live, Playwright): opens each scene with `MinigameFramework.startMinigame` on a keyless server and checks the computed style of every visible element and its `::before` / `::after` inside the minigame window, with the same rules. `data-diegetic` on a page root limits the check inside it to fonts (no scene uses it yet). Default is the slice 7 list; `--all` reports every registered scene but still fails only on the slice 7 list. `--params file.json` takes real scenario params (used for the forensic data platform and network architecture, taken from sis03_cyber_insurance and test-network-architecture). `--shots` writes lossless webp shots per scene and size.
  - Old tree: all 14 slice 7 scenes failed. Now: "PASS: every in-scope scene meets the pixel-art rule".

## What changed

- Framework shell (`minigames-framework.css`): no soft shadow on `.minigame-container`, no inset shade on `.minigame-game-container`, solid progress bar; `code`, `kbd`, `samp` inside a minigame use VT323 (authored scenario HTML in the forensic platform used the browser monospace).
- `utilities.css`: the shared button hover glow (`0 0 10px currentColor`) is a hard 2px ring. This rule also covers modal, tutorial and person-chat buttons.
- PIN pad: solid key colours, hard 2px or 4px drop shadows, no display glow, square lamps with hard rims.
- Consoles (drug library integrity, SCADA historian, forensic data platform, NCSC brief, network architecture, infusion pump, SIEM): Courier New and plain monospace became VT323, 1px borders became 2px, radius 0, glows removed or turned into hard 2px rings. VT323 is smaller than Courier at the same pixel size, so font sizes went up: drug library and SCADA historian about 1.4x, forensic platform and NCSC brief about 1.25x. SCADA chart axis labels (SVG) and the infusion pump's Phaser text (MAR card, conflict and confirm prompts) use VT323 at larger sizes. The infusion pump's erase key reads "DEL" in Press Start 2P (the pixel fonts have no erase glyph).
- Biometrics, fingerprint reader, BLE and Bluetooth scanners: 2px borders, no glows, gradients or text glows, square status lamps; the reader's "partial" lamp is a stepped octagon (clip-path in 2px steps).
- Text file: GNF title, solid header, no soft shadows. Notes: GNF for the observation and edit box (was Pixelify Sans with a Comic Sans fallback), solid tape strip, hard shadows.

## Tests run (no full suites, per the test lock rule)

All pass: minigame-pixel-art (29), minigame-controls-layout (11), engine-fixes-pass4b (10), engine-fixes-round4 (4), engine-fixes-round6 (9), forensic-data-platform-tabs (5), scada-historian-data (8), fingerprint-compare-features (9), biometric-lock (7), pin-cracker-feedback (8), minigame-html-sweep-a/b/c (6, 12, 13), minigame-launch-routes (31), minigame-title-escape (23).

## Live proof

Keyless headless server on :3340 from this worktree, setFPS(20) with fixed steps on. Game 2401 (test_seating, made with swap-scenario-game.rb). Shots: scratchpad `ux-shots/slice7/<scene>_<WxH>_<before|after>.webp`, 14 scenes at 1400x1000 and 800x600 (56 files). Sweep reports: scratchpad `s7_before.json`, `s7_after.json`, `s7_after_all.json`.

## Left alone (outside slice 7, from the `--all` sweep after this branch)

- log-filter: 313 non-pixel fonts and 314 hairlines (not in the plan's list; the earlier sweep probably opened it empty). Worth its own pass.
- Smaller: episode-runner (radius 13, hairlines 6), dusting (hairlines 6), warranty-checklist and coverage-decision-form (fonts, hairlines), password-guesser, authenticator, engagement-report, alarm-panel (radius), esd-pushbutton, ehr-terminal, backup-recovery, title-screen (gradients), mail-client (one font), lockpicking, capture-log, flag-station, network-segmentation-map, intel-board, sis-config-threshold (one or two each).
- Container desktop bezel, password screens, rfid and network view: owned by slices 2a, 2b, 3a, 1 and 6.
- Seen, not changed: the framework close X sits over the SCADA historian's own [CLOSE] and the network architecture legend's right end (both as before). The PIN pad's HTML erase key still shows the ⌫ glyph from a fallback font. VT323 loads from the Google Fonts import in text-file-minigame.css and bond-visualiser.css, not from a local file as GNF and Press Start 2P do.

## Handover

Not needed: finished inside the budget.

## R1 fixes

Review: `UX_SLICE7_REVIEW_R1.md` (0 blockers, 3 majors, 5 minors, 5 nits). Commits 02d26249b, 645d23766, dfae28cb4, 10e87fe85, 959affc00 and the combination spacing commit after it.

Sync: client display only. Nothing new in player_state; no sync changes.

### Review findings

- M1, fixed. VT323 is self-hosted: `assets/fonts/VT323/VT323-latin.woff2` and `VT323-latin-ext.woff2` from the @fontsource/vt323 5.3.0 npm package (tarball shasum checked against the registry), unmodified, with `OFL.txt` beside them; `@font-face` with the upstream unicode ranges in `fonts.css`. The Google Fonts `@import`s in `text-file-minigame.css` and `bond-visualiser.css` and the two `<link>`s the notes minigame added at load are gone. The sweep checks the face really loaded (`document.fonts` status, `document.fonts.check('16px VT323')` and glyph widths, 156px against 231px for the monospace fallback) and lists any request to a Google font host; `--offline` blocks those hosts. Before: 2 remote font requests; after: none, VT323 loaded with the hosts blocked.
- M2, fixed. The sweep seeds each working state: pump charts global, NCSC gate global then BREAK SEAL pressed, BLE and Bluetooth devices added on the running scene (Bluetooth panel expanded), two biometric samples for the kit (panel expanded) and the reader. `--params` from `sis03_cyber_insurance` (forensic platform, NCSC brief) and `test-network-architecture`. Phaser scenes get a canvas check: game config (pixelArt or antialias off, roundPixels) and every Text object's face and size.
- M3, fixed. Pump canvas: `pixelArt: true`, `roundPixels: true`; MAR values and the sub-header VT323 16px, labels and header Press Start 2P 8px, value column moved right to fit; screen lines, both prompts and the conflict texts 16px; gate text and `.ip-modal-prompt` 16px.
- m1, fixed. Drop-shadow blur is parsed after the colour is stripped, as for box shadows.
- m2, fixed. Pump dividers, SCADA grid, ticks, axes and series, network architecture zone outlines are 2px. The static test now flags `lineStyle(1`, `setStrokeStyle(1`, SVG `stroke-width` 1, `.style.border = '1px`, blurred `.style.boxShadow` and `setShadow` blur.
- m3, fixed. The themed person-chat hover resets `box-shadow`; the three `#session-*-btn:hover` glows are hard 2px rings. The theme's `--ui-glow-filter` is left for the theme pass.
- m4, fixed. PIN erase key reads DEL (both keypads; the pump's key value is now 'DEL' too). NCSC brief: envelope `icons/mail-new.png` at 4x, badge `npc-lock.png` and `mark-tick.png` at 1x, the warning and lightning glyphs dropped. Pump "Checked", SCADA ticked rack a solid 6px square. Also plain text for other symbol glyphs in slice scenes: BLE (TARGET, PAIRED, SAVE, Clear), kit and Bluetooth expand toggles (+ and -), SIEM section marks (>), SCADA (>, !), drug library and forensic platform ticks, network architecture warnings (!), reader result marks ([+], [~], [x]). The static test flags symbol glyphs in slice JS.
- m5, fixed. VT323 is 16px or more in the drug library, SCADA and network architecture HTML; SCADA charts are drawn at the chart area's own pixel size, so axis labels are 16px on screen. The static test checks VT323 px sizes in the slice CSS. Left: the network diagram's node and line labels are SVG text in viewBox units (7 to 9); they need larger node boxes, so they are exempted in the test by name.
- n1, fixed: the dead `.ip-prescription-panel` and `.ip-rx-*` rules are removed. Most other pump CSS classes (`.ip-pump-*`, `.ip-modal-*`, `.ip-key*`) have no users either; left.
- n2, not changed (noise only).
- n3, not done (unlikely cases).
- n4, fixed above.
- n5, fixed: italics in the slice CSS and the pump prescriber are upright.

### The user's notes (Part B)

- No Cancel beside the X. The shell (`base-minigame.js`) no longer draws Cancel by default: `static keepsCancelButton = true` opts back in, used by password (slice 2a owns it; listed for that round), lockpicking (its button can reset the pins), the notes reader (Continue) and person chat (End Conversation). `showCancel: true` in a scene's params no longer draws it. The `.minigame-controls` row stays for footer buttons (Add to Notepad) and hides when empty. Esc and the X close as before. SCADA's own [CLOSE] went too. This removes Cancel from the RFID copier as a side effect of the shell default (its files are untouched; slice 3a removes its opt-in). Tests that clicked `#minigame-cancel` now click `#minigame-close`.
- X inside the frame. `static closeInsideFrame = true` places the X 4px inside the top-right of `closeAnchor()` (the game area, the pump canvas, the reader panel), on start, resize and frame resize. Opted in: the 14 slice scenes plus container, combination and cryptex. Scanner headers keep 40px clear for it. The audit script (`ui-rules-audit.mjs` from p-ux-audit) reports 0 x-on-frame on the 17 scenes at all three sizes.
- Frame wraps content. Combination, cryptex and container windows scroll inside the frame and use tighter rows under 560px high; the reader panel scrolls inside its frame; the PIN plate wraps every key; SCADA's chart gives up height. Container at 915x412 (unlock-43) now wraps.
- PIN back plate (unlock-47, unlock-56). Traced to d043ab9a1 (Cancel row into the column) and 36f0c92b0 (`min-height: 0` on the game area). The plate is full height again, `min-height: auto`, content centred with `safe center`, scrolling inside if needed; tighter keys under 700px high and the keypad beside the display and log on landscape phones. Kept pixel art.
- Combination and cryptex (unlock-54, unlock-55) are separate minigames (`js/minigames/combination/`, `js/minigames/cryptex/`), not themes on PIN or password. Digits: Press Start 2P 48px; letters: VT323 64px; no synthetic bold (orchestrator rulings). Dials sit closer under 960px wide.
- Text file (unlock-48): the X sits inside the window's title bar, top right.

Per shot (after): unlock-43 container wraps, X inside; unlock-44 and unlock-53 password unchanged (slice 2a); unlock-47 PIN at 915x412 two columns, all inside the plate; unlock-48 X inside the title bar; unlock-52 container 800x600 no Cancel; unlock-54 combination new digits, all inside; unlock-55 cryptex new letters, all inside; unlock-56 PIN at 800x600 whole pad on the plate.

### Proof

Keyless headless server on :3342 from this worktree, setFPS(20) with fixed steps on, stopped afterwards. Game 2457 (test_seating, made with swap-scenario-game.rb). Shots: scratchpad `ux-shots/slice7-r1/`, 18 scenes at 1400x1000, 800x600 and 915x412, before (public/ from 71ad39fef) and after, review ids in the names. Sweep: before 14 of 14 in-scope scenes fail; after PASS with VT323 loaded offline. Tests: minigame-pixel-art 46 of 46; 165 test files that import a changed module, all pass after five were moved from Cancel to the X.

### Left for other slices

- Slice 2a: the password Cancel (`keepsCancelButton` on PasswordMinigame) and its ⌫ key.
- Slice 3a: rfid-minigame.js still passes `showCancel: true`, now inert.
- Slice 9 remainder (folded in, not finished in this budget): drop the 35 now-inert `showCancel: true` params; remove the `.minigame-controls-overlay` rules (`minigames-framework.css`) and `static controlsOverlay` (and rewrite `minigame-controls-layout.test.mjs`); X at 16px; `gameDisplay` Close; opt the remaining scenes (lockpicking, person chat, phone chat, notes Continue, consoles outside slice 7) into `closeInsideFrame` or decide their bottom buttons; ESD, SIEM, EHR retakes.
- Audit leftovers: faux-bold and Press Start 2P off-grid sizes across the slice scenes (the audit counts 381 and 219); SIEM DISMISS is an alert action flagged as cancel-beside-x (false positive); the kit's collapsed panel overflows its frame when opened title-only.
- Network diagram SVG labels (see m5); unused pump CSS.

## Handover (R1)

Stopped at the call budget. Done: everything above, committed. Open: the slice 9 remainder and audit leftovers listed above. Files touched: see the commits. Gotchas: `bin/test-js` with a file list is the quickest way to run importers; the audit script needs its playwright import pointed at this worktree's node_modules when run from the scratchpad.

## R2 fixes

Review: `UX_SLICE7_REVIEW_R2.md` (1 blocker, 2 majors, 6 minors, 5 nits). Commits d675858f1, 7dc46d2fa, e996fd65b, 0307a4800, f406f58b1, 5417d1940, 1c420f48d, ed76b6444 and this log.

Sync: client display only. Nothing new in player_state; no sync changes.

### Findings

- B1, fixed. `minigame-html-sweep-b.test.mjs` allows exactly the NCSC brief's trusted icons: class `ncsc-envelope-icon` with src `assets/icons/mail-new.png`, class `ncsc-badge-icon` with src `npc-lock.png` or `mark-tick.png`, and no attribute beyond class, src, alt, width and height. Any other `<img>` still fails.
- M1, fixed. The MAR card places each row from its texts' measured heights (4px below the taller of label and value), and each divider sits 2px below the last row and 6px above the next, so no rule crosses text. The header, sub-header and rate box are placed the same way.
- M2, fixed. The pump canvas uses `Phaser.Scale.NONE` and `setZoom()` with the largest whole number that fits its box, at least 1 (`InfusionPumpMinigame.wholeZoom`). Below zoom 1 the canvas scrolls inside its box (auto margins centre it when it fits). The canvas is 784px wide now (pump bezel 474) so it fits an 800px window at zoom 1. The X sits on the visible part of the canvas, so it stays put while the canvas scrolls. Zoom is 1 at 1400x1000 (1.78 rounds down), 800x600 and 915x412 (scrolls 138px), 2 at 1700x1150; clicks land on the right key at zoom 1 and 2. The keypad digits and CONFIRM are Press Start 2P 16px, DEL 8px.
- m1, fixed with a different face than asked. Measured on black, white text, 13 letters each, with the faces loaded from the game server: VT323 (16 to 96px), GNF (8 to 96px) and Pixelify Sans (32 to 64px) draw grey edge pixels at every size (VT323 80px: 1951 grey against 6613 white). Press Start 2P at a multiple of 8 draws none (56px: 7; at 48px and under Chrome adds its 1px LCD colour fringe, as on the combination). So the cryptex letters are Press Start 2P 48px, in brass (#e8c070) to set them apart from the combination's white digits. Crops: `zoom/cryptex_*_after_x3.png`, 8 colours in the wheel boxes (background, glyph, border, two fringe colours).
- m2, fixed. Every `font-weight: bold` in the combination and cryptex CSS is normal, the wrappers set `font-synthesis: none`, and the worn hint lost its italic. Headings are 16px. The audit reports both scenes clean.
- m3, fixed. The BLE scanner is a column: the device list takes what height is left (`flex: 0 1 auto`, at most 220px, at least 48px) and scrolls inside the frame; the game area scrolls if even that does not fit. On screens under 560px high the scanner may use the height below its top offset.
- m4, fixed. The Bluetooth panel is a column too: every section keeps its height, the device list shrinks, the game area scrolls inside the frame, and the expanded controls have no fixed max-height. The header also clears the expand toggle, which drew over the scanner icon.
- m5, fixed. `test/js/minigame-close-shell.test.mjs` (jsdom, 9 tests): a plain scene given `showCancel: true` draws no Cancel and an empty controls row, and its X closes as the player; a `keepsCancelButton` scene draws Cancel and it calls `closeByPlayer` once; `showCancel: false` and `disableClose` still hide it; `placeCloseButton()` with stubbed rects (border, 4px gap, a frame larger than the window, a 12px scrollbar), a hidden X and an unmeasured frame; the `closeInsideFrame` watcher observes the frame, re-places on resize, and `cleanup()` disconnects it and drops the resize listener; the pump's `wholeZoom`.
- m6, fixed. Add to Notepad is a button in the text file window's own toolbar, beside Copy and Select All; the toolbar wraps on narrow windows.
- n1, fixed by removal. No caller anywhere passes `closeButtonAction` (both lockpicking starters pass only `cancelText: 'Close'`), no plan or design note mentions a reset from that button, and the branch dates from before the move to `public/` with no use since. So lockpicking no longer keeps a Cancel, and the reset option and the listener filtering (which left the base close attached) are gone; the X and Esc close through `closeByPlayer()`.
- n2, fixed. The NCSC TLP bar is at least 42px tall with 44px side padding, so the X sits on the bar above its amber rule at every size.
- n3, fixed where the slice set it: the pump gate headline 9px to 8px, DEL 12px to 16px, the X 18px to 16px; the pump keypad and CONFIRM also on the grid (above).
- n4, fixed. The example dump in `docs/test-bridge.md` is the notes reader, which keeps its Continue as `#minigame-cancel`, so it stays; a note under it says which scenes still draw one.
- n5, fixed. The comments follow the semicolon.

### Proof

Keyless headless server on :3344 from this worktree, setFPS(20) with fixed steps on, stopped afterwards. Games 2517 (before) and 2539 (after), both new, made with `swap-scenario-game.rb test_seating test_seating`. Shots in scratchpad `ux-shots/slice7-r2fix/`: sweep webp per scene and size (`*_before`, `*_after`, review ids in the names), `zoom/` 3x nearest crops of the cryptex, combination and pump card and screen at 1400x1000, 800x600 and 915x412, `fonts/` the face and size measurements, `audit/` the audit shots and JSON, `probe/` single-scene shots.

- Sweep (`pixel-style-sweep.mjs --offline` with the R2 params) on 17 scenes at three sizes: PASS, VT323 loaded with the Google font hosts blocked.
- Audit (`ui-rules-audit.mjs`) on the same: 0 x-on-frame; combination, cryptex, pump, network architecture and container clean; BLE and Bluetooth overflow gone (faux-bold only). Overflow left: PIN and SIEM full-window borders 2px past the viewport (predates the slice), SIEM at 915x412, the kit's field note when opened title-only (all listed at R1).
- Tests: the whole JS suite, `MERGE_BATCH=1 bin/test-js -j 3` under the shared lock, on 1c420f48d plus the m5 test (ed76b6444): 545 files passed, 0 failed.

### Left for slice 11

- Press Start 2P off grid outside the ruling: PIN keys 20px bold and ENTER 12px (`pin.css`), the reader sign 11px, the remaining faux bold the audit counts (342) and off-grid sizes (156) across the slice scenes.
- Two "&mdash;" strings in `ncsc-brief-minigame.js` (player-facing, unchanged lines).
- The 35 inert `showCancel: true` params and the rfid opt-in (slice 9 and 3a lists).

## R3 fixes

Review: `UX_SLICE7_REVIEW_R3.md` (0 blockers, 1 major, 4 minors, 4 nits). Commits 4db8dca94, 12eafc04b, 4b358c8df, 033e555a8 and this log.

Sync: client display only. Nothing new in player_state; no sync changes.

### Findings

- M1, fixed. The pump's Phaser config sets `input.touch.capture: false` and `input.mouse.preventDefaultWheel: false`, and the canvas has `touch-action: pan-y` (in the CSS, and set again on the element after each zoom). A swipe on the canvas, a mouse wheel over it, and a drag of the scrollbar all scroll the box. Two follow-on faults found live and fixed: with capture off, a tap was read twice (the browser's compatibility mouse events after the touch) and a swipe pressed the key it started on. So the canvas cancels `touchend`, and every pump button (keys, CONFIRM, both modals' buttons) acts on a tap: released over the button it was pressed on, moved no more than 12 canvas pixels, and with the box not scrolled in between. The box has a pixel-art scrollbar from `.ip-pixel-scroll` in `infusion-pump-minigame.css`, a local copy of the shared `.pixel-scroll` rule on build/ux-net (with the `scrollbar-color: auto; scrollbar-width: auto` reset and the `@supports not selector(::-webkit-scrollbar)` Firefox guard); a comment names `.pixel-scroll` so the merge can swap the class and drop the copy. A "MORE BELOW" cue (Press Start 2P 8px, 2px border, an 8x4 stepped arrow) sits on the box's bottom edge while part of the canvas is below it, hides at the end, and scrolls to the end on a click; its presses stop at the cue, because Phaser also listens on the window and would otherwise press the key under it.
- m1, fixed. The cryptex letters are GNF 41px with `will-change: transform` on `.cryptex-wheel-display` (grayscale text, per element only), brass on navy as before. The UI-root `will-change` rule from the review's font section is not applied: that is a policy question for the user (q105).
- m2, fixed. In the expanded Bluetooth panel the device list keeps its header and one whole card (list box at least 149px, list at least 72px content), the Instructions shrink and scroll inside their own box (`flex: 0 1 auto`, cyan square scrollbar like the list's), and fold away under 480px high. At 800x600 the list shows the first card whole and Instructions shrink to their heading line; at 915x412 Instructions are folded away and the list is 104px. The game area no longer scrolls at either size, so its default scrollbar is gone.
- m3, fixed. The pump screen's divider is at SCR_Y + 66 (was 60) and the rows below it moved down 6px (prompt rows 69 and 84, or 74; the entry row 110, or 102).
- m4, fixed. The darkening filter applies to `#copy-btn .icon-small` and the observations heading only; the notepad icon keeps its own art (a white page with a dark outline, which reads on the light button). `engine-fixes-round4.test.mjs` follows the scoped rule.
- n1, fixed. The allow-list test checks the attribute names equal alt, class, height, src and width, and rejects any attribute starting with `on`, on the icons and on every element in the scene.
- n2, fixed. The two lockpicking starters no longer pass `cancelText: 'Close'`.
- n3, fixed. DEL is Press Start 2P 16px, as the digits.
- n4, no change, for the user: most laptop windows (1366x768, 1440x900, 1536x864, 1400x1000) get zoom 1, so the pump is a 784x510 card with 8px labels in a large window; 1920x1080 gets zoom 2. Crisp and readable, but smaller than R1's smoothed fit. If wanted larger, the card labels could move to 16px. Shot: `unlock-30-infusion-pump-1400x1000-after.webp`.

### Proof

Keyless headless server on :3346 from this worktree, setFPS(20) with fixed steps on, scrollbars shown in every run, stopped afterwards. Games 2615 and 2616, both new, made with `swap-scenario-game.rb test_seating test_seating`. Shots in scratchpad `ux-shots/slice7-r3fix/`.

- Pump touch probe (`tmp/r3/fix-pump.mjs`, mobile context with touch at 915x412): tap 5 gives "5" (before the tap fix: "55"); a swipe up that starts on key 1 scrolls the box 138px to its end, hides the cue and presses nothing; DEL, 2 and 0 by tap give "20"; a tap on CONFIRM opens the dose modal and a tap on its re-enter button closes it; a swipe down returns to the top and the cue shows again. Mouse at 915x412: a wheel over the canvas scrolls 138px; a click on MORE BELOW scrolls to the end without pressing the key under it; clicks on 0 and CONFIRM work (dose confirmed). At 1400x1000 and 800x600: zoom 1, nothing to scroll, no cue, no scrollbar. Scrollbar 14px, square thumb with a 2px edge (`crop_pump915_right_cue_x3.png`, `crop_pump915_touch_bottom_x2.png`). Divider crop: `crop_pump1400_screen_x3.png`. Log: `probe/pump-probe.log`.
- Cryptex (`tmp/r3/fix-cryptex.mjs`): partial pixels counted inside the five letter boxes ("A" in each) between the box colour and the brass, at 1400x1000, 800x600 and 915x412 (the same counts at each size). Before (Press Start 2P 48px, the R2 rule put back by an injected style): 1440 partial pixels, 720 of them strong (blend between 32 and 223 of 255), all 1440 coloured LCD fringe. After (GNF 41px, grayscale): 140 partial, 0 strong, 0 coloured; the 140 are faint dark pixels under 32 of 255. Side by side for the user: `unlock-56-cryptex-letters-before-after-x6.png`; per-size crops and `cryptex-pixels.json` in `cryptex/`. The GNF letter is smaller in its box than the Press Start 2P one (about 16 by 23 pixels against 32 by 32).
- Bluetooth (`tmp/r3/fix-bt.mjs`): section geometry before and after at three sizes in `probe/bt-before/` and `probe/bt-after/`; side by side `cmp_bt_800_915_after.png`.
- Text file: `crop_text_notepad_x4.png`, the notepad icon in its own art beside "Add to Notepad".
- Sweep (`pixel-style-sweep.mjs --offline` with the R2 params, scrollbars shown) on 19 scenes at three sizes: PASS for every in-scope scene. After shots named after the review page ids: `unlock-29` to `unlock-42` at all three sizes, `unlock-43` to `unlock-51` at 915x412 and `unlock-52` to `unlock-59` at 800x600 (41 files). The sweep tool's own `REVIEW_IDS` map is one behind the page from container onwards (it calls container 915x412 `unlock-43`, the page `unlock-44`); the shots were renamed from the page's list.
- Tests, without the lock: the 60 test files that import or read a changed module or stylesheet (`minigame-close-shell` with 3 new pump tests, `minigame-html-sweep-b`, `minigame-pixel-art`, `engine-fixes-round4` among them): 690 of 690 pass.

### Noted, not changed

- Outside the slice 7 scope, the sweep still reports esd-pushbutton (2 gradients, a hairline, an off-grid size), alarm-panel (a radius), coverage-decision-form (3 non-pixel fonts, 2 hairlines) and backup-recovery (a gradient, 3 sizes).
- The UI-root grayscale text rule (q105) and the sweep's crispness check forcing grayscale (review font policy, point 5) wait on the user's decision.
