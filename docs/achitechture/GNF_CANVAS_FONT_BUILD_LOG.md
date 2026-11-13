# GNF canvas font build log (q105)

Branch `build/gnf-canvas-font`, from batch 27 (a8f74b3b8).

The user's ruling (q105): text outside the Phaser canvas renders fine; text inside the pixelated canvas looks poor because the font does not match the pixels. GNF can be pixel accurate, so draw it from a sprite sheet.

## GNF's native size

Read from the font file (`public/break_escape/assets/fonts/gnf.ttf`):

- 2048 units per em. Every outline point is on a 200 unit grid, with x on odd multiples of 100 (a half-pixel left side bearing).
- So one font pixel is 200 units, and the native size is 2048 / 200 = **10.24 px per em**. The DOM looked crisp at 41 px and 82 px because those round 4 x 10.24 and 8 x 10.24.
- Capitals are 7 px tall, descenders 2 px, accents reach 9 px above the baseline. Most advances are 6 px (i, l, the full stop and similar are 2 px).
- A few accent contours overlap the base letter's cells by 4 to 12 units (at most 6% of a pixel). The check treats those slivers as empty.
- To land on whole pixels, the pen has to start half a pixel to the left. The build script does this.

## The build

`tools/fonts/build_gnf_bitmap.py` (needs only Pillow):

1. Draws each wanted character at 10.24 px with anti-aliasing off (Pillow fontmode "1"), pen at x - 0.5.
2. Checks every glyph by drawing it again at 50 times that size. Each native pixel has to be at least 93% or at most 7% covered (R1: was 10%; the build prints the largest sliver it accepted, 6.0% on Ê), and the native drawing has to match the coverage at every pixel. The advance has to be a whole number of pixels. Any failure stops the build. The large drawing is used only for the check; nothing is resized into the output.
3. Packs the glyphs into `public/break_escape/assets/fonts/gnf-bitmap/gnf.png` (white on clear) and writes the matching AngelCode BMFont XML that `load.bitmapFont` reads. `gnf-shadow.png/.xml` holds each glyph grown by 1 px (8 neighbours) in solid black, offsets one pixel up and left, for outlined text (R1: replaced the first build's gnf-outline sheet).
4. Lists the wanted characters the font lacks in `MISSING.txt`.

`--check` builds into a temporary folder and compares the result with the committed files. Line height 12, base 9, 197 glyphs: printable ASCII, Latin-1 including the pound sign and accented letters, Ś Š š Ž ž, the dashes, curly quotes, ellipsis, bullet, euro, arrows and the tick.

Missing from gnf.ttf: ¤ Å å Æ æ Ð ð Ý ý Þ þ Ł ł ś Œ œ ✗. The helper draws these as the plain letter (ś as s, Å as A) or a stand-in (ł as l, æ as ae, ✗ as x), and anything else, emoji included, as "?". The scenarios use ś 14 times.

## The helper

`public/break_escape/js/utils/pixel-text.js`:

- `preloadPixelFont(scene)` queues both sheets. `core/game.js` preload calls it.
- `pixelText(scene, x, y, text, { scale, color, origin, wrap, outline, depth })` makes a BitmapText with fontSize = 12 x a whole-number scale and origin 0, tinted for colour. `origin` anchors the drawn box the way setOrigin would, but the box's top left is rounded to a whole pixel, so a centred odd-width word never lands on half a pixel. The box runs from the ink's left edge to its right edge, and from the top of the line box to its bottom (9 rows above the baseline, 2 below), so lower-case text does not jump. `wrap` is a width in screen pixels and breaks at spaces.
- `setPixelText`, `placePixelText`, `setPixelScale` (whole steps only) and `pixelTextBox` keep the anchor.
- If the sheet is not in the cache yet, or the scene has no bitmapText (node tests), it falls back to a canvas Text in the GNF web font at 10.24 x scale px, flagged `pixelFallback`.
- Multi-line text is left-aligned. Phaser's own centre alignment can put a line on half a pixel, so centre one line at a time with origin.

## Inventory of canvas text (batch 27)

| Where | What | Font, size | Status |
|---|---|---|---|
| systems/npc-world-bubbles.js:528 | NPC speech bubbles (barks, chatter): canvas, not DOM | VT323 16 px, thresholded by crispText | converted, GNF x1 |
| systems/damage-numbers.js:17 | floating damage, heal and blocked numbers | Arial bold 20 px, stroke 4 | converted, GNF outline x2 |
| systems/attack-telegraph.js:27 | red "!" over an NPC about to attack | Arial bold 24 px, stroke 3, 1.3 scale tween | converted, GNF outline x3 with a stepped x3/x4 pulse |
| systems/npc-office-visuals.js:410 | padlock glyph text stand-in (L/U) | monospace bold 12 px | converted, GNF x1 |
| systems/npc-office-visuals.js:478 | phone ring text stand-in "Ph" | monospace bold 12 px | converted, GNF x1 |
| systems/npc-action-icons.js:364 | action icon text stand-ins | VT323 16 px | left: scenario icons can be emoji (the lab's coffee entry), which GNF lacks |
| systems/npc-action-icons.js:397 | thought bubble text stand-ins | VT323 12 px | left, same reason |
| systems/npc-needs-debug.js:150, 174 | needs debug labels | VT323 10 px and 7 px, stroke 2 | left: debug only |
| systems/npc-behavior.js:2680 | patrol "Target" label | default 10 px | left: debug only |
| core/player.js:693 | path waypoint numbers | default 10 px, stroke 2 | left: debug only |
| minigames/lockpicking/*.js (lock-graphics 67, 283; pin-management 154, 165, 176, 227, 326; key-selection 233, 298, 357, 386, 397) | lockpicking labels, key names, paging | VT323 12 to 24 px | left: a separate Phaser game; needs its own preload and a look pass |
| minigames/infusion-pump/infusion-pump-minigame.js (389 to 914, about 35 texts) | pump screen, MAR, buttons, dialogs | Press Start 2P 8/16 px, VT323 16 to 52 px | left: separate game, designed round Press Start 2P and VT323 at whole zooms |

Room names, item labels and the network view are DOM, not canvas (no add.text in those files).

## Look changes

- Bubbles: GNF x1 is smaller than VT323 16 px (7 px capitals against about 10), so bubbles are narrower and shorter for the same text. Wrapping still uses 24 characters a line. On a phone (390 x 844, game scale 1) the text is small; a user call on x1 against a larger bubble is open.
- Damage numbers: same height as before (14 px), now outlined by 2 px blocks.
- Telegraph "!": the 1 px outline fills the gap between the bar and the dot, so the mark reads as a red "!" on a black tag. The pulse now steps x3 to x4 every 250 ms in place of a smooth 1.3 scale.
- Lock and phone stand-ins: smaller letters inside the same backing.

## Tests

- `test/js/pixel-text.test.mjs` (15 tests): the sheet metrics read from the real XML, the Python build check (`--check`, skipped without python3 and Pillow), colour and scale parsing, glyph substitution, measuring, wrapping, whole-pixel placement for centred odd widths, wrap and substitution in pixelText, the stepped scale, the fallback, preload, and the converted damage numbers, telegraph and bubble against a fake scene with the real font data.
- `test/js/ux-bark-bubbles.test.mjs`: the pixel-art test now expects GNF (its rig has no bitmapText, so it checks the fallback).
- No test harness copy list includes the changed modules, so no copy list needed the new import.

## Live proof

Keyless server on :3067, setFPS(20) with fixed steps on, a new game (2949, swap-scenario-game.rb, test_bark_bubbles on the m01 host). "Before" shots used the same game with `/break_escape/js/**` served from the a8f74b3b8 copy through Playwright routing. Shots at 1400 x 1000 and 390 x 844, with crops at 4x, in the scratchpad's `ux-shots/gnf-font/` (bubble, damage, telegraph, standins; before and after). Every glyph in the after shots sits on the game's pixel grid with no grey edges.

## Review R1 fixes (2026-11-13)

Review: `docs/achitechture/GNF_CANVAS_FONT_REVIEW_R1.md` (M 3, m 9).

- **M1 damage numbers.** Outlined text is now a container of two BitmapTexts at the same pen position: `gnf-shadow` (black, drawn first) and plain `gnf` tinted on top. The union of the shadows is one outline round the whole string. The fade is stepped (`damageFadeStep`): full colour to 70% of the time, half brightness to 85%, then hidden. Half brightness is the fill colour halved at full alpha, not alpha 0.5: shadow quads of neighbouring glyphs overlap by one column, so any partial alpha would darken that column again and let the sprite show through. `blocked` lifted to 0xd8d8d8. The old outline sheet is retired (moved to the main tree's tmp/delete).
- **M2 bubble scale.** `bubbleTextScale({ scale, dpr, hudStep })` in npc-world-bubbles.js is the review's rule (capitals at least 7 CSS px, plus the HUD step, clamped 1 to 3). main.js `applyPixelPerfectScale` stores `window.pixelDisplay` and calls `npcWorldBubbles.setDisplayScale`, which re-scales live bubbles with `setPixelScale` and clears `bb.line` so they are measured again; install reads the stored value. The wrap is now a drawn width: `bubbleWrapPx` gives `min(144, floor(0.45 * viewWidth / s))` font px, `wrapBubbleLines` measures each candidate line as drawn (after pixelSafe), and `pageLine` takes the same `wrap`, so a page is at most PAGE_LINES of what the bubble draws. Before the sheet is cached the old 24 character wrap stays. Bark pages are cut at say() time; a scale change mid-bark re-measures the bubble but keeps those pages.
- **M3.** Not converted here, as instructed: backlog entry (lockpicking VT323, the pump's VT323 sizes, an emoji to pixel icon rule for action icons and thoughts).
- **m1, m2.** `SLIVER = 0.07`, largest accepted sliver printed (also under `--check`); Pillow 10.1 guard at start; MISSING.txt says pixel-text.js draws these as the plain letter, a stand-in or ?.
- **m3.** Telegraph stays x3 and steps its fill 0xff0000 / 0xffd000 every 250 ms (`telegraphColour`); no size change, no re-centring.
- **m4.** `standInBacking(box)` sizes the backing from the text box (3 px each side, 2 px above and below), centred on the anchor; the icon branch keeps the icon sizes.
- **m5.** `_render` swaps a fallback canvas Text for a bitmap text once the sheet is cached (same container slot). The fallback style passes `wordWrap: { width: wrap }`.
- **m6.** `setPixelText(t, text, anchor)` takes an optional anchor; callers no longer write `pixelAnchor`. `setPixelColour(t, colour)` changes the fill on any kind of pixel text.
- **m7.** `test/js/gnf-scenario-glyphs.test.mjs` walks every scenario's `bark` fields, `chatter` pools and the ink knots named as exchanges or phone calls, and fails on any character pixelSafe turns into "?". None found.
- **m8.** Sheet URLs carry `?v=<assetsVersion>` (read from `window.breakEscapeConfig` at call time, so node tests need no window).
- **m9.** pixel-text tests now assert the drawn box, ink widths, whole pixels, colours and draw order (shadow behind, ringed by one font pixel); the bubble test file has a BitmapText rig with the real gnf.xml (frame size, scale rule, pixel wrap, rescale, fallback upgrade).

Tests: pixel-text 19, ux-bark-bubbles 42 (5 new), gnf-scenario-glyphs 2; the 18 files that import a changed module pass.

Live proof: keyless server on :3067, setFPS(20) with fixed steps on, new games 2991 (phone 390x844 at dpr 3), 2992 (1400x1000 dpr 1), 2993 (1400x1000 dpr 2), each test_bark_bubbles on the m01 host. The rule picked x2 on the phone (game scale 2) and x1 on both desktops (scale 2 at dpr 1, scale 4 at dpr 2). Each run also forced the other scale. Shots at native device pixels in the scratchpad's `ux-shots/gnf-font-r1fix/` (bubble, damage full and half step, telegraph red and amber, stand-ins), with the comparison sheets `gnf-bubble-scale-choice-{phone390-dpr3,desktop1400-dpr1,desktop1400-dpr2}.png`. The scene was paused for each shot so the slow device-pixel screenshot did not race the fade or pulse. Every glyph on the grid; the damage outline is one even ring; stand-in backings fit the letters, centred.

Open: the user's call on bubble scale (the rule gives x2 on a dpr 3 phone, x1 on desktop).

## Handover

Done: native size found, build script with grid check, sheets, helper, five call sites, tests, live proof.
Open: action icon text stand-ins (need an emoji rule first), debug labels, the lockpicking and infusion pump minigames (each needs `preloadPixelFont` in its own scene), and the user's call on bubble size at x1.
