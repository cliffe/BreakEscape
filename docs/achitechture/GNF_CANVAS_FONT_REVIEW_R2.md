# GNF canvas font: review round 2

Branch `build/gnf-canvas-font`, diff a8f74b3b8..64e699701, read with attention on 1f8f8135a..64e699701 (the R1 fixes). Read only. Inputs: R1, the build log's R1 section, the diff, the r1fix shots and scale-choice sheets, the pixel-art UI rule and the no-downscaling rule.

Checked here: `python3 -I tools/fonts/build_gnf_bitmap.py --check` passes in 1.8 s and prints "largest sliver accepted: 6.0% ... limit 7%"; `bin/test-js test/js/gnf-scenario-glyphs.test.mjs test/js/pixel-text.test.mjs test/js/ux-bark-bubbles.test.mjs` passes (3 files).

Verdict: every R1 finding is fixed in code and backed by a behaviour test, and the shots show what the fixes claim. Nothing blocks a merge. Three small findings; the third should land before merge because CI runs the whole JS suite on ubuntu-22.04. The user's call on bubble size (x2 on a dpr 3 phone, x1 on desktop) is still open in the build log; that is a merge gate of its own, not a code finding.

## 1. R1 fixes, one by one

| R1 | Fixed? | Evidence |
|---|---|---|
| M1 damage outline and fade | Yes | `pixel-text.js` outlined text is a container `[shadow, fill]` at one pen position (`pixelText`, shadow first). `damage-numbers.js` `damageFadeStep`: full to 70%, half colour at full alpha to 85%, hidden after; no `setAlpha` left. `blocked` is 0xd8d8d8. Tests: draw order and the one-pixel ring (`pixel-text.test.mjs` 225-250), fade steps (317-319). Shot `damage_full_*`: one even ring round "12", no dark seam. |
| M2 bubble scale and wrap | Yes, with m1 below | `bubbleTextScale`, `bubbleWrapPx`, `wrapBubbleLines`, `pageLine({ wrap })`, `setDisplayScale`, read on install. Tests in `ux-bark-bubbles.test.mjs` (worked examples, wrap by drawn width, live rescale, fallback upgrade). |
| M3 lockpicking and pump | Scheduled | `docs/IDEAS_BACKLOG.md:258`, with the emoji to pixel icon rule. |
| m1 sliver | Yes | `SLIVER = 0.07`, largest printed, and the test asserts it is under 7%. |
| m2 Pillow, MISSING.txt | Yes, but see m3 | Guard at import; MISSING.txt reworded and tested. |
| m3 telegraph pulse | Yes | Fixed x3, fill steps 0xff0000 / 0xffd000 via `setPixelColour`; tag stays black. Shot `telegraph_amber_phone390_dpr3`: the gap between bar and dot is filled by the tag, as accepted in R1. |
| m4 stand-in backing | Yes | `standInBacking(box)`, 3 px each side, 2 px top and bottom, origin bottom left at anchor y + 2; the letter's bottom sits at -2, so the margins match. Icon branch unchanged. |
| m5 fallback upgrade and wrap | Yes | `_render` swaps the canvas Text at the same container index and clears the layout; `fallbackStyle` passes `wordWrap`. |
| m6 `pixelAnchor` | Yes | `git grep pixelAnchor public` finds it only in `utils/pixel-text.js`. |
| m7 glyph guard | Partly | Test exists and is fast; misses some lines that reach a bubble (m2 below). |
| m8 versioned URLs | Yes | `pixelFontUrls`, tested with and without a version. |
| m9 tests | Yes | No `fontSize === 12 * scale` or `pixelOpts` assertions remain; the bubble file has a BitmapText rig on the real `gnf.xml`. |

## 2. Display scale: when it runs, live bubbles, slice 5 rules

**When it runs.** `main.js:304-305` sets `window.pixelDisplay` and calls `setDisplayScale` at the end of `applyPixelPerfectScale`. That function runs on `resize`, `orientationchange`, `fullscreenchange`, `be:display-settings-changed` (the Display page, so the HUD size step and zoom step), a devicePixelRatio media query change, and twice at start (0 and 100 ms). `installNpcWorldBubbles` reads the stored value, so a bubble system made after the first scale call still starts at the right scale. Live proof shows x2 picked on the dpr 3 phone without a resize. Covered.

`viewWidth` is `gameWidth`, which equals the camera's view width because camera zoom is always 1. `setDisplayScale` re-measures when the text scale or the view width changes, so a phone rotated at the same scale re-wraps chatter at the new width.

**Live bubbles mid-bark.** Page boundaries hold: `setDisplayScale` touches only `bb.text` and `bb.line`; `st.pages`, `st.page`, `st.times` and `linePages` are untouched, so the voice timing and the follow-up timing carry on as they were. `_render` clears `bb.layout`, so the next pass places the resized frame again. What does not follow the new scale is the wrap of a page that already has line breaks (m1).

**Slice 5 rules.**
- Paging: still at most PAGE_LINES as drawn, because `say()` and `pageLine` use the same `_wrap`. At x2 on a phone a line is about 22 characters in place of 24, so slightly more pages.
- Room checks: `_inView`, `speechShown`, `viewFacts` unchanged.
- Toast fallback: unchanged. A bigger bubble that finds no place still goes through `_leave(id, 'no-room')` from the page on screen, and chatter is skipped, not deferred. x2 bubbles will hit this somewhat more often on phones; that is the intended fallback.
- Voice sync: `pageTimes` splits the audio by words over the line's pages; more, shorter pages change nothing about the total, and `_retime` still re-times only pages to come.
- Minimum display time: PAGE_MIN_MS per page unchanged. At x3 (a dpr 3 phone plus a HUD step) a line is about 14 characters, so a long bark has more pages; the 1200 ms floor only makes the bubble outlast the voice when pages times 1200 ms exceeds the audio, which needs a page of four or five words or fewer. Same behaviour as before, reached a little sooner.

## 3. Damage numbers

**Opaque half step.** Correct. The shadow quads of neighbouring glyphs overlap by one column; any alpha below 1 would draw that column twice and let the sprite through. Halving the fill's colour at full alpha keeps the ring one even black and the sprite hidden. `setPixelColour` changes only the fill's tint, so the shadow stays black at both steps.

**Readability.** `blocked` 0xd8d8d8 reads clearly at full colour (shot `damage_full_desktop1400_dpr1`: the "3" is the brightest of the three). At the half step it is 0x6c6c6c on the black ring, about 4:1, still legible. The red half step 0x7f2222 is about 2:1 against the ring and looks dim in `damage_halfstep_*`, but it shows for 150 ms as the number leaves; that is what a fade step should look like. No change needed.

## 4. gnf-outline removal

`git grep -n "gnf-outline\|PIXEL_FONT_OUTLINE"` finds only the build log's history line. The preload queues `[PIXEL_FONT, PIXEL_FONT_SHADOW]`; the build's `SHEETS` and `--check` file list are both derived from `("gnf", "gnf-shadow")`; the tests import `PIXEL_FONT_SHADOW` and compare each shadow glyph with its plain glyph (width and height + 2, offsets - 1, same advance). The asset folder holds only gnf, gnf-shadow and MISSING.txt; the old files are in the main tree's `tmp/delete/gnf-outline-r1`. Clean.

## 5. Scenario glyph scan

Fast: 77 ms under `node --test`, reading files synchronously with no timers, so it cannot be flaky on large scenarios; its only fragile part is the floor on line counts (bark > 50, chatter > 20, ink > 5), which is the right guard against the walk silently finding nothing. Coverage has gaps (m2).

## 6. Versioned URLs in Hacktivity's mount

`pixelFontUrls` reads `window.breakEscapeConfig.assetsVersion`, set by the engine's own `app/views/break_escape/games/show.html.erb:231` from `BreakEscape::ASSETS_VERSION`. Hacktivity has no view of its own that sets `breakEscapeConfig` (no match in Hacktivity's `app/`), so the mounted game gets the same value as standalone. `character-textures.js` already loads Phaser assets with `?v=` the same way, so the loader's base path and query string are proven in both. The query does not touch the cache key. Note: `ASSETS_VERSION` follows the gem version unless `BREAK_ESCAPE_ASSETS_VERSION` is set, so a rebuilt sheet is only re-fetched after a version bump; that is how every other versioned asset behaves.

## 7. Pillow guard and --check

The guard parses `PIL.__version__` safely (dev suffixes too) and exits with a clear message before any drawing. `--check` stays reproducible: PNGs compared by pixel, XML and MISSING.txt by bytes from a deterministic writer, and a FreeType change that moved a pixel would fail the grid check first. The sliver line prints under `--check` as well, which the test reads. The gap is in the test that runs it (m3).

## Findings

### m1 A rescale mid-bark keeps the old wrap on pages that already have line breaks
`public/break_escape/js/systems/npc-world-bubbles.js:724`: `shown.includes('\n') ? shown : bubbleLines(...)`. A bark page cut at x1 (lines up to 144 font px) and shown after a step to x2 keeps its x1 line breaks, so on a 585 px phone view a three-line page is about 300 game px wide, over the 45% share the wrap rule sets, and more likely to fall to the toast. A one-line page is re-wrapped, so the two cases behave differently.
Fix: for bark pages, re-wrap the page's own words at the current rule: `bubbleLines(shown.replace(/\n/g, ' '), this._wrap(scene)).join('\n')`. The words on the page stay the same, so page boundaries, `st.times` and the voice are untouched; the page may run to PAGE_LINES + 1 lines until the next page. Test: a two-page bark, `setDisplayScale` from x1 to x2 during page 0; assert `st.page`, `st.pages` and `st.times` unchanged, and every drawn line of the current page at most `bubbleWrapPx({ viewWidth, textScale: 2 })` font px wide.

### m2 The glyph scan misses some lines that reach a bubble
`test/js/gnf-scenario-glyphs.test.mjs:61, 66`.
- Knots are picked by name prefix (`exchange_` or `call_`), so `coffee_exchange` (`scenarios/lab_physical_pentest/scenario.json.erb:1303`, an exchange) is not scanned.
- Event-mapping barks: `npc-manager.js:1933-1934` shows `config.bark || config.message`, and `:1981` shows a mapping's `knot` from ink (`_showBarkFromKnot`); both go to `showBark`, which routes to a bubble for a person NPC in view. The scan reads only `"bark"`.
- Gate follow-ups: a `lockedHint` is shown in the guard's bubble (`npc-barks.js:316-328`) and is not scanned.
Fix: take knots from the `knot` field of entries inside `exchanges`, `phoneCalls` and `eventMappings` (whatever the name), scan event-mapping `message` strings outside `sendTimedMessage`, and scan every `lockedHint`. None of these hold an uncovered character today (checked by eye for `coffee_exchange`; the non-ASCII `lockedHint`s use only the em dash, which the sheet has), so this is a guard for later edits.

### m3 The build check test fails, not skips, on Pillow older than 10.1
`test/js/pixel-text.test.mjs:114-115` skips only when `import PIL` fails. With Pillow 9 (Ubuntu 22.04's packaged version; `.github/workflows/ci.yml` runs `bin/test-js -j 4` on ubuntu-22.04) the probe passes, the script exits with the guard message, and the test fails. Whether the runner has Pillow at all is not checked here.
Fix: probe the version: `python3 -I -c "import PIL,sys; v=tuple(int(''.join(c for c in p if c.isdigit()) or 0) for p in PIL.__version__.split('.')[:2]); sys.exit(0 if v >= (10,1) else 3)"`, and `t.skip('Pillow 10.1 or later not available')` on a non-zero status.

## Checked and fine

- Pixel-art rule: bubble frame 2 px with stepped corners and tail; text on whole pixels at x1, x2 and x3 (scale-choice sheets); the damage ring is one font pixel (2 px at x2); stand-in backings are plain rectangles fitted to the letter.
- No-downscaling rule: met. Sheets are drawn at GNF's native size and only scaled up by whole numbers; the 50x drawing is a check only.
- `setPixelScale` and `setPixelText` drive both parts of an outlined container; `placePixelText` measures from the shadow sheet's box, so the ring is inside the placed box.
- Startup: `window.game` is the Phaser.Game from `main.js:118` before the first scale call, and the 100 ms retry covers a late canvas.
- HUD step: negative steps never shrink bubbles (`max(0, hudStep)`); a zoom step that lowers the game scale raises the bubble scale to keep capitals at 7 CSS px, which is the rule doing its job.
- Sync size: nothing here touches player state.

## Counts

B 0, M 0, m 3. Ready to merge once m3 is in (a two-line test change) and the user has made the bubble size call; m1 and m2 can land with it or as a follow-up.
