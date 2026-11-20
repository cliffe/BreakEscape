Counts: blockers 0, majors 1, minors 4, nits 4

# UX feedback round, slice 7: code review, round 3

Branch build/ux-pixel at 8e24c455e, reviewed against round 2 (`UX_SLICE7_REVIEW_R2.md`) and the "R2 fixes" section of `UX_SLICE7_BUILD_LOG.md` (commits d675858f1, 7dc46d2fa, e996fd65b, 0307a4800, f406f58b1, 5417d1940, 1c420f48d, ed76b6444, 8e24c455e). Rules: `ui-design-language`, `pixelart-ui-rule`.

## What I checked

- Keyless headless server on :3345 from this worktree (setFPS(20), fixed steps on), stopped afterwards. Game 2567, new, made with `swap-scenario-game.rb test_seating test_seating`.
- Every browser run had scrollbars shown: the sweep and the audit were run from copies whose only change is `ignoreDefaultArgs: ['--hide-scrollbars']`.
- `pixel-style-sweep.mjs --offline` with the R2 params on the 17 `closeInsideFrame` scenes at 1400x1000, 800x600 and 915x412: PASS, VT323 loaded with the Google font hosts blocked.
- `ui-rules-audit.mjs` (from p-ux-audit) on the same scenes and sizes: 0 x-on-frame, 0 cancel-beside-x outside SIEM (an alert action, as at R2); combination, cryptex, pump and network architecture clean. Overflow left: PIN and SIEM full-window borders, SIEM at 915x412, the biometrics kit opened title-only (all listed at R1 and R2).
- A live probe: the pump at 1400x1000, 800x600, 915x412 and 1700x1150 (zoom, canvas and box geometry, the X, real mouse clicks on 5, 1, DEL and 0 at canvas coordinates, scroll to the bottom); a touch probe at 915x412 with a mobile context (touch swipes on the canvas and beside it, with a plain scrolling div as a control); lockpicking closed by the X and by Esc, a key unlock end to end, and pick-mode key input.
- A font probe (section below): VT323, GNF, Press Start 2P and Pixelify Sans, white on black at whole-pixel positions, at DPR 1 and 2, under seven CSS conditions, plus a size scan from 8 to 120px.
- Before and after pairs against the R2-fix "before" shots for the pump, text file, Bluetooth and NCSC brief.
- Tests, without the lock: the 122 test files that import a changed module or read a changed stylesheet, `minigame-pixel-art`, `minigame-close-shell` and `minigame-html-sweep-b` among them: 122 of 122 pass.
- Shots: scratchpad `ux-shots/slice7-r3/` (sweep webp per scene and size, `audit/` PNGs and JSON, `probe/` pump, touch and lockpicking shots with `probe.log`, `fonts/` samples, `fontprobe.json` and zoom crops, `cmp_*` pairs, `crop_*` zooms).

## R2 findings, checked live

- B1: fixed. The sweep test passes, and the allow-list cannot slip an image into the game: the brief's scenario text goes through `authorHtml`, which escapes every tag except `strong`, `em`, `b`, `i` and `br`, so no scenario string can produce an `<img>` at all. The test's own check is looser than it reads (n1).
- M1 (MAR card rows over dividers): fixed. Every row clears its divider at all four sizes (`crop_pump1400_mar_x2.png`). The same fault is still on the pump's screen (m3).
- M2 (fractional scale mangles the pixel text): fixed. `Phaser.Scale.NONE` with a whole zoom: 1 at 1400x1000, 800x600 and 915x412, 2 at 1700x1150 (canvas 1568x1020 CSS, 784x510 backing, `image-rendering: pixelated`). Input maps correctly at both zooms: clicks on 5 and 1 gave "51", then DEL and 0 gave "50", at every size, including after scrolling 138px at 915x412. The header strip holds 2 colours at 915x412 on desktop and with the canvas at x 65.5 on a mobile context, so the text stays crisp. The scroll itself is the new major (M1).
- The 784px canvas cuts nothing at 800x600: canvas 8 to 792 inside an 800px box, no horizontal scroll (scrollWidth 800), all four bezel screws and the right bezel edge drawn. The longest screen line ("! DRUG LIB MIN: 25 mg/hr  [LIBRARY OVERRIDE]", about 360px in VT323 16px) fits the 434px text width, and both modals (420 and 380 wide) fit the 784px canvas.
- At 1400x1000 the pump shows at zoom 1: a 784x510 card in the middle of the window, crisp, 8px Press Start 2P labels and 16px VT323 values. Acceptable, but small (n4).
- m1 (cryptex face): changed to Press Start 2P 48px in brass. On grid, but see m1 below.
- m2 (synthetic bold): fixed; the audit finds no faux bold on combination or cryptex.
- m3 (BLE list past the frame): fixed. At 915x412 the list scrolls inside the frame with its thin cyan bar.
- m4 (Bluetooth rows overlapping): fixed, nothing overlaps; the list is now squeezed instead (m2 below).
- m5 (tests): fixed. `minigame-close-shell.test.mjs` covers the Cancel opt-in, `placeCloseButton()` with border, gap, window clamp and scrollbar, the watcher clean-up and `wholeZoom`.
- m6 (Add to Notepad): fixed in place (in the toolbar beside Copy and Select All), with an icon regression (m4 below).
- n1 to n5: fixed. The NCSC TLP bar holds the X above its amber rule at 800x600 and 915x412 (`cmp_ncsc.png`).

## Lockpicking: Cancel and reset removal

- Nothing used it. No file in `public/`, `test/`, `app/`, `lib/`, `scenarios/` or `docs/` (outside the slice 7 logs) names `closeButtonAction` or `closeButtonText`; both lockpicking starters pass only `cancelText: 'Close'` (now read by nothing, n2). No test clicks a lockpicking `#minigame-cancel`.
- The X and Esc give the same result as before. Before, the X fired the base `closeByPlayer()` and then the scene's own `complete(false)`; the second call was dropped by the stale-instance guard in `complete()` once `endMinigame` had cleared `currentMinigame`. Now only `closeByPlayer()` runs. Live: X and Esc each close the scene and call the starter's callback once with `(false, { cancelled: true })`, with no toast (`lockpick-close-toast.test.mjs` passes). No `#minigame-cancel` is drawn and the empty controls row is hidden (`probe/lockpicking_open.png`).
- End to end: a key lock through `startKeySelectionMinigame` (select the key, click the key target) unlocked with method "key" and the "Successfully unlocked with the correct key!" toast. In pick mode, space and 1 still drive tension and pin selection, and Esc closes as above.

## Findings

### Majors

**M1. At 915x412 the pump's bottom row and CONFIRM sit below the fold, and a touch player cannot scroll to them by swiping the pump.**
`infusion-pump-minigame.css:323-334` makes `#ip-phaser-container` scroll, but:
- The scrollbar is Chrome's default (rounded thumb, white track; `scrollbar-color` and `scrollbar-width` are `auto`), and nothing says there is more below (`crop_pump915_right_x2.png`). The rule asks for the shared pixel-art scrollbar and a "More below" cue.
- A touch swipe on the canvas does not scroll the box: Phaser's touch capture takes the gesture (`probe-touch`: swipe on the keypad, scrollTop 0; the same swipe in the 65px margin beside the canvas, scrollTop 138; a plain scrolling div as control, 105). The ".", "0" and DEL keys and CONFIRM (canvas y 348 to 474) and the range-conflict modal's buttons (canvas y 374 to 412) are all below the 372px box. On a 915px-wide phone the player can only scroll from the side margins, which nothing points to; at 844x390 the margins are 30px, and under 784px wide there are none.
Fix: let touch pan the box (Phaser `input: { touch: { capture: false } }` in the game config, `touch-action: pan-y` on the canvas; taps still reach Phaser), give `#ip-phaser-container` the shared `.pixel-scroll` class and a "More below" cue that hides once scrolled to the end. `.pixel-scroll` is on build/ux-net (slice 1, `css/utilities.css`), not yet on main or this branch, so either wait for that merge or carry the same rule here and drop it when slice 1 lands. Alternatively, below zoom 1 lay the canvas out without the MAR card beside the pump (MAR behind a tab), so the pump fits 412px high. Retake 915x412 with a touch proof.

### Minors

**m1. The cryptex and the combination lock still share one face; brass alone is not enough difference.**
`cryptex-minigame.css:118-139`. Side by side at 800x600 (`cmp_combination_cryptex_800x600.png`) the two locks have the same frame, header, box style and face; only the glyph colour differs, so the cryptex reads as the combination lock re-tinted. The user asked for a different pixel font for each. The builder ruled the other faces out because they "draw grey edges at every size", but GNF has crisp sizes (font section): at 40.96px (41px renders the same pixels) with grayscale text it draws no strong edge pixel at all.
Fix: `.cryptex-wheel-display { font-family: 'GNF', monospace; font-size: 41px; line-height: 48px; will-change: transform; }` (keep the brass), retake at the three sizes with zoom crops, and show the user both versions, since the face was their call.

**m2. On short screens the expanded Bluetooth panel squeezes the device list to a sliver.**
`bluetooth-scanner.css:81-84` (`min-height: 96px` on the list container, which includes its "Detected Devices" header) with every other section kept at full height. At 800x600 and 915x412 the list shows the top 20px of the first card ("Phone" cut through), while Instructions keep all four bullets (`cmp_bt800_text800.png`, `cmp_ble_bt_915.png`). The game area also scrolls with a default Chrome scrollbar beside the list's own cyan one.
Fix: give `.bluetooth-device-list` itself a minimum of one full card (about 72px) and let the Instructions block be the part that shrinks and scrolls (`flex: 0 1 auto; min-height: 0; overflow-y: auto`), or fold Instructions away under 560px high; put the game area's scrollbar on `.pixel-scroll` once it lands.

**m3. The pump screen's divider runs along the bottom of "VOL REMAINING".**
`infusion-pump-minigame.js:366` draws the line in VT323 16px at SCR_Y + 44 (its box ends near SCR_Y + 62) and `:371` draws the divider at SCR_Y + 60, so the rule touches the glyph bottoms at every size (`crop_pump1400_screen_x3.png`). This is R2 M1 on the screen instead of the card; R1's move to 16px text caused it.
Fix: place the screen rows from measured heights as the card now does, or move the divider to SCR_Y + 66 and the prompt and entry rows down 6px.

**m4. The "Add to Notepad" icon is now a black block.**
`text-file-minigame.css:256-261` darkens every `.action-btn .icon-small` with `filter: brightness(0) opacity(0.75)`, written for the white `copy-sm.png`. Moving the button into the toolbar put `notes.png` under the same rule, so the page icon with its lines became a solid dark square (`crop_text_notepad_x4.png`; before: a white page, `textfile_800_before_r2fix.png`).
Fix: scope the filter to the copy icon (`#copy-btn .icon-small`) or exclude `.notepad-btn-icon`, and give the notepad icon a version that reads on the light button (for example the dark scheme's treatment), at whole scale.

### Nits

**n1.** The B1 allow-list checks class, `src` and the attribute count, but not the attribute names, and it applies to every test in the file. `<img class="ncsc-badge-icon" src="/break_escape/assets/icons/npc-lock.png" onload="..." alt width>` has five attributes and would pass, because the handler check at `minigame-html-sweep-b.test.mjs:70` names only `onerror` and `onmouseover`. No runtime path can produce it (see B1 above); this is the test's strength only. Assert the names equal `class, src, alt, width, height` (`:68`), and reject any attribute starting with `on`.

**n2.** Both lockpicking starters still pass `cancelText: 'Close'` (`minigame-starters.js:143`, `:423`), which nothing reads now. Drop them with the inert `showCancel` list.

**n3.** The pump's DEL label stays at 8px while the digits are 16px (`infusion-pump-minigame.js:443`). On grid, but it is the smallest text on the keypad; "DEL" at 16px is 48px wide and the key is 146px. Use 16px, as on the PIN pad.

**n4.** Most laptop windows get zoom 1 (1366x768, 1440x900, 1536x864 and 1400x1000 all floor to 1; 1920x1080 gets 2), so the pump shows as a 784x510 card with 8px labels in a large window. Crisp and readable, but a step down in size from R1's smoothed FIT. Worth showing the user the 1400x1000 shot (`audit/mg-infusion-pump_1400x1000.png`); if they want it larger, the card labels could move to 16px, which also helps n3.

## Font crispness finding

Short answer: the grey edges on VT323 and GNF at 16px and 32px are real anti-aliasing from the fonts' outlines, not a measurement artefact. No positioning or `text-rendering` setting removes them. The builder's other observation, the "1px LCD colour fringe" on Press Start 2P at 48px and under, is a different thing: subpixel (LCD) text rendering, which one CSS property turns off.

What I measured (`fonts/fontprobe.json`, `fonts/cmp_small_x6.png`, `fonts/zoom_*`): white text, 13 capitals, on black at whole-pixel positions, no transforms, at DPR 1 and 2.

- **Position and transforms are not the cause.** Moving the text by 0.5px, or `transform: translateX(0.3px)`, gives the same pixels to the count as the whole-pixel case for every face: Chrome snaps glyph origins to whole pixels. `text-rendering: optimizeSpeed`, `font-kerning: none`, `-webkit-font-smoothing: none` and `font-smooth: never` change nothing on Linux (the last two work on macOS only). `geometricPrecision` makes it slightly worse.
- **The fonts' own grids decide it.** From the font files: Press Start 2P has 1000 units per em and every outline point on a 125-unit grid, so one font pixel is exactly 1px at 8px, 2px at 16px, and so on. GNF has 2048 units per em with its points on a 100-unit grid, so a font pixel is size/20.48: never a whole number at a whole-number CSS size. VT323 has 1000 units per em and a 400-unit advance, but its outlines are not on any grid (the half-step "dot stretch" of the DEC terminal font it copies), so a size scan from 10 to 120px never gets below 14% partial pixels with grey anti-aliasing. At 16px VT323 and GNF are smaller than their own pixel grid (85% and 70% of the ink is partial); at 32px they are between grid steps (51% and 48%). That is anti-aliasing a player sees, not a counting error. DPR 2 halves it but does not remove it (GNF 32px at DPR 2: 28% partial).
- **What is an artefact, and the fix for it.** With default text rendering, headless Chrome on this machine draws subpixel (LCD) text: Press Start 2P at 16px has 54% coloured edge pixels even though its outlines sit exactly on the pixel grid; at 56px and over Chrome switches to grayscale and the fringe goes. Forcing grayscale text removes it completely: `will-change: transform` on the text or on any ancestor (tested on a parent with an opaque background) gives Press Start 2P 0 partial pixels at 16, 32 and 48px. `transform: translateZ(0)` and `opacity: 0.999` did not switch it off in this build. Players on Windows (ClearType) and on Linux with subpixel rendering on see the fringe today; Mac and DPR 2 screens do not.
- **GNF does have crisp sizes.** With grayscale text, GNF at 40.96px (and 41px, which renders the same pixels) and 81.92px has 0% strong partial pixels (only a few near-black ones under 32 of 255). 20.48px and 61.44px are not crisp in this build.

Font policy this supports:
1. Press Start 2P at multiples of 8px, plus `will-change: transform` on the UI root that holds pixel text (one rule on the minigame container or the UI layer, not per element), is crisp everywhere. Check before adding it that nothing under that root is `position: fixed` relative to the viewport, since `will-change: transform` makes the element the containing block for fixed descendants.
2. GNF is crisp only at 41px (and 82px) with the same grayscale rule; at body sizes (16px, 20px) it always anti-aliases. Use it for large display text where a second face is wanted (the cryptex letters, m1), not as a crisp body face.
3. VT323 is never fully crisp at DPR 1. Keep it where its CRT look is the point (the pump screen, terminals) and accept soft edges, or move that text to Press Start 2P.
4. Pixelify Sans behaves like VT323 at 16 and 32px (75% and 51% partial with grayscale text).
5. The sweep's crispness check should force grayscale text (or ignore coloured fringes) when it counts edge pixels, or every Press Start 2P size under 56px will read as failing.

## Before and after

- Pump at 915x412 (`cmp_pump915_before_after.png`): R2's "before" had dropped rows ("NORPHINE", broken labels); now every label and value is whole and readable, with the card wider spaced. Better, apart from M1 and m3.
- Pump at 1400x1000: smaller than R1's smoothed FIT, crisp (n4).
- Text file at 800x600: Add to Notepad in the window's toolbar instead of floating over the HUD (better), but its icon lost its art (m4).
- Bluetooth at 800x600 (`cmp_bt1400_bt800before.png` holds the "before"): no more overlapping rows, but the device list is a sliver (m2). At 1400x1000 the panel is unchanged and shows both devices.
- NCSC brief: the X sits on the TLP bar above the amber rule; the bar text keeps clear of it. No change to the brief's art.
- Combination and cryptex: the frames and controls are unchanged; the cryptex letters changed face and colour (m1).
- PIN plate: unchanged from R2 (the restored plate stays).
