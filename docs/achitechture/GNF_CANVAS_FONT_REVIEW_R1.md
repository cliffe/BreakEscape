# GNF canvas font: review round 1

Branch `build/gnf-canvas-font`, diff a8f74b3b8..0255ebeb1. Read only. Inputs: the build log, the diff, the before/after shots and comparison sheets, the pixel-art UI rule, the no-downscaling rule and the UI design language notes.

Checked here: `python3 -I tools/fonts/build_gnf_bitmap.py --check` passes; `bin/test-js test/js/pixel-text.test.mjs test/js/ux-bark-bubbles.test.mjs` passes (2 files).

Verdict: the approach is right and meets the user's ruling. Every glyph in the after shots sits on the game grid, the sheet is built at GNF's native size with nothing resized, and the bubble text is the crispest canvas text the game has had. Nothing blocks a merge. Two M findings (damage number fade, bubble scale on small and high-density screens) should be fixed on this branch before merge; the lockpicking follow-up should be scheduled.

## Answers to the orchestrator's four points

1. **Damage numbers.** Measured from the sheet: no glyph's ink fills its advance (every digit is 5 px of ink on a 6 px advance), so one glyph's outline never covers another glyph's fill. What the shot shows is the fade. Each glyph is its own quad, the outlines of neighbouring glyphs share the 1 px gap column, and with `setAlpha(1 - progress)` that column is blended twice and goes darker than the rest of the outline, while the NPC sprite shows through both fill and outline. The grey "3" was caught mid fade over the green floor; at alpha 1, 0xbbbbbb on black is high contrast. So: yes, draw the outline once behind the whole string, and stop fading smoothly (M1).
2. **Telegraph "!".** Any outline one font pixel wide closes GNF's 1 px gap between bar and dot, with 4 or 8 neighbours alike, so "outline following the glyph with a gap" is not possible at font-pixel size. An outline one game pixel wide would keep the gap but mixes pixel sizes (2 or 3 px glyph pixels with a 1 px edge), which pixel art avoids. Recommendation: accept the tag. Red on a black slab reads as a warning sign, which suits the job. Change the pulse instead (m3).
3. **Bubbles.** x1 is right for desktop and wrong for phones. Rule and layout knock-on in M2.
4. **Lock and phone stand-ins.** The backing is still sized for the 16 px icon art, so the x1 letter floats in it, and for the open lock it is off centre. Size the backing from the text box (m4).

## Findings

### M1 Damage numbers: smooth alpha fade doubles the shared outline column and lets sprites show through
`public/break_escape/js/systems/damage-numbers.js:91` (`setAlpha(1 - progress)`), `:24` (one outlined BitmapText).
Fix, both parts:
- Draw the outline once behind the string. Add a third sheet to `tools/fonts/build_gnf_bitmap.py` (`gnf-shadow`: the `outlined()` grid with fill and outline both black, same offsets as gnf-outline), and in `pixelText` with `outline: true` make a two-part container: the shadow BitmapText, then the plain `gnf` BitmapText tinted on top at the same pen position. The union of the shadows is the outline of the whole string, drawn once, so overlaps cannot darken. Keep the outline in font pixels (2 px at x2), matching the glyph pixels.
- Replace the smooth fade with a stepped one: alpha 1 until 70% of the duration, then 0.5 for the next 15%, then hidden. Rising in whole pixels already works.
- Optional: lift `blocked` from 0xbbbbbb to 0xd8d8d8 so it stays clear of the floor's mid greens at the 0.5 step.
Test: a behaviour test that at 50% of the duration the number is fully opaque, and that the outline sits behind the fill (draw order), not the internal keys.

### M2 Bubble text scale: x1 is about 4.7 CSS px capitals on a real phone
`public/break_escape/js/systems/npc-world-bubbles.js:58` (`SPEECH_FONT_SCALE = 1`), sizing from `public/break_escape/js/main.js:262-293`.
The 390x844 shot ran at devicePixelRatio 1. A real 390-wide phone at dpr 3 gets `scale = 2` (1170 / 640 rounds to 2), so one game pixel is 0.67 CSS px and GNF capitals (7 px) are 4.7 CSS px; VT323 16 px gave about 6.7. That is a readability regression on the devices most likely to be small.
Rule (pure function, tested, re-run from `applyPixelPerfectScale`):
`bubbleTextScale({ scale, dpr, hudStep }) = clamp(ceil(MIN_CAP_CSS * dpr / (7 * scale)) + max(0, hudStep), 1, 3)` with `MIN_CAP_CSS = 7`.
Worked: 1400x1000 dpr 1 (scale 2) gives x1; 390x844 dpr 1 (scale 1) gives x1; phone dpr 3 (scale 2) gives x2; phone dpr 2 (scale 1) gives x2. Tying it to `hudStep` lets the Display page's HUD size setting enlarge bubbles too, which players will expect.
Layout knock-on: at x2 a 24-character line is up to 288 game px, half of a 585 px phone view, and MAX_BUBBLES 4 would hit "no-room" far more often. So the wrap width must be a pixel width, not a character count: wrap at `min(144, floor(0.45 * viewWidth / s))` font px with `wrapPixelText`, and use the same wrap in `pageLine` (`npc-world-bubbles.js:334-367`) so pages are still at most PAGE_LINES of what is drawn. Page timing already follows audio, so more pages only means shorter pages. On a scale change, set the new scale on live bubbles with `setPixelScale` and clear `bb.line` so `_render` re-measures. This is a user-visible size call: show the user x1 and x2 bubble shots at dpr 3 before merging.

### M3 Follow-up: lockpicking minigame text (separate Phaser game) still uses VT323 on the canvas
`public/break_escape/js/minigames/lockpicking/lock-graphics.js:67, 283`, `pin-management.js:154-326`, `key-selection.js:233-397`.
This is the same canvas problem the user ruled on, in a minigame every mission uses. Not for this branch (it needs its own `preloadPixelFont` in that game's scene and a look pass), but schedule it as the next slice. The infusion pump can wait: its Press Start 2P text at 8 and 16 px is already on the grid; only its VT323 sizes need converting, and it is one mission's minigame.

### m1 Build: the 10% sliver tolerance is wider than any real sliver
`tools/fonts/build_gnf_bitmap.py:43`. The largest overlap found is 6% of a pixel. At 10% a future font edit that puts a contour 8% off the grid passes silently. Fix: `SLIVER = 0.07`, and have the build print the largest sliver it accepted so a creep shows in review.

### m2 Build: float font size needs Pillow 10.1 or later; MISSING.txt wording is wrong
`tools/fonts/build_gnf_bitmap.py:249` passes 10.24 to `ImageFont.truetype`; Pillow before 10.1 does not take a float size (this machine has 10.2.0). Fix: check `PIL.__version__` at start and exit with a clear message. `--check` itself is reproducible: PNGs are compared by pixels (so zlib or optimiser differences do not matter), XML by bytes from a deterministic writer, and a FreeType change that moved a pixel would fail the grid check before the compare. `:285` says BitmapText "draws nothing" for missing characters, but the helper swaps them; say "pixel-text.js draws these as the plain letter, a stand-in or ?".

### m3 Telegraph: the x3/x4 size pulse makes the tag jump 7 px each way
`public/break_escape/js/systems/attack-telegraph.js:111`. A 21 px to 28 px tag, re-centred every 250 ms, reads as a jitter rather than a pulse. Fix: keep x3 and pulse the fill tint (0xff0000 and 0xffd000, stepped every 250 ms); keep the black tag as the warning sign.

### m4 Lock and phone stand-ins: backing sized for the icon art, text off centre for the open lock
`public/break_escape/js/systems/npc-office-visuals.js:424` and `:477-480`. For the open lock the backing runs from -18 to 11 while the letter is centred on 0. Fix: in the text branch only, size and place `bg` from `pixelTextBox(text)` plus 3 px each side and 2 px top and bottom, centred on the anchor; the image branch keeps the icon sizes. These only show when the icon PNGs fail to load, so x1 is fine.

### m5 Helper: a fallback text never becomes a bitmap text, and ignores `wrap`
`public/break_escape/js/utils/pixel-text.js:179-183, 206-209`; `npc-world-bubbles.js:957` makes a bubble's text once. In normal play the sheet is loaded in preload, so this only bites if the sheet request fails or is slow after a scene restart, but then that bubble stays on the blurred path for the session. Fix: in `_render`, if `bb.text.pixelFallback && pixelFontReady(scene)`, destroy and remake the text before setting it. In `fallbackStyle`, pass `wordWrap: { width: wrap }` so the `wrap` option means the same thing on both paths.

### m6 Helper: callers write `t.pixelAnchor` directly
`damage-numbers.js:48`, `npc-office-visuals.js:421`. This reaches into the helper's state. Fix: give `setPixelText(t, text, anchor)` an optional anchor, or call `placePixelText` first, and keep `pixelAnchor` private to pixel-text.js.

### m7 Glyph coverage: no scenario text found that reaches a bubble with a missing glyph; add a guard
All 23 uses of ś (more than the log's 14) are in `scenarios/ca11_misdirected_data*/ink/*.ink`, as the speaker prefix "Wiśniewski:" or in comments. Speaker names are drawn in the DOM conversation, not on the canvas, and pixelSafe would draw "s" anyway. The other uncovered characters in scenario files are box-drawing rules in documents and comments, Cyrillic homoglyphs in the tesseract lab's documents, subscript two, and emoji in phone messages (m01's lizard), all DOM. Fix: a JS test that walks every scenario's bark, chatter and exchange fields (the ones `say()` receives) and fails on any character that pixelSafe would turn into "?", so a future emoji in a bark is caught at commit time, not seen as "?" in play.

### m8 Cache busting: rebuilt sheets can pair a new XML with a cached PNG
`public/break_escape/js/utils/pixel-text.js:153`. The loader URLs carry no version, so after a rebuild a browser can hold the old PNG with the new XML and draw the wrong glyph rectangles. Other Phaser assets share this, so it is not new, but a font sheet garbles every glyph rather than one sprite. Fix: append `?v=${window.breakEscapeConfig?.assetsVersion}` (or the engine's ASSETS_VERSION if exposed) to both URLs.

### m9 Tests: some assertions pin internals; the bubble test only covers the fallback
`test/js/pixel-text.test.mjs:138, 171, 176, 217` assert `fontSize === 12 * scale` and `pixelOpts.scale`; these restate the implementation. Replace with what the player sees: `pixelTextBox(t).height === 11 * scale`, ink width for a known string, whole-pixel `x` and `y`. `test/js/ux-bark-bubbles.test.mjs:268-277` now checks only the fallback path (its rig has no bitmapText); add a rig variant with a fake `add.bitmapText` and the real `gnf.xml` so the bubble's frame size from the GNF box is pinned there too (the file that owns bubble behaviour). The build check test (`:84`) is good: it pins the real property, glyphs on the grid.

## Checked and fine

- Whole-pixel placement: camera zoom is always 1 (the device scale is applied to the canvas by `applyPixelPerfectScale`, `main.js:292`), `roundPixels` is on (`utils/constants.js:98`), glyph offsets and advances are whole numbers, and `placePixelText` rounds the box's top left. Odd-width centring is handled. Scroll does not matter under these settings.
- Performance: `_render` returns early when the line is unchanged (`npc-world-bubbles.js:619`), so measuring and substitution run once per line, not per frame; the telegraph only refits on a scale step; at most four bubbles. Cheaper than the old `crispText` path, which read canvas pixels.
- Tint: white glyphs tint to the colour and the black outline stays black.
- Preload and serving: four files, 51 KB in all, on the existing preload; the engine serves `public/` through `ActionDispatch::Static` (`lib/break_escape/engine.rb:42`), so Hacktivity serves them with no change. No precache or asset list in Hacktivity, the desktop app or the Android app names engine fonts.
- Left out: action icons and thoughts (emoji need a pixel-icon rule first, a separate slice), debug labels (leave; debug only), infusion pump (see M3). The judgement in the build log is sound.
- No-downscaling rule: met. The 50x drawing is only a coverage check; nothing is resized into the sheets.

## Counts

B 0, M 3 (M3 is a follow-up slice, not this branch), m 9.
