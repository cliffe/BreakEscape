# P0-L: Source Sans 3 bundle and spike F6

Run 2026-10-21. Packet P0-L (plan item 0.8). Files copied unmodified from the download folder; the
SHA-256 of each committed file equals the SHA-256 of the download.

## Files

All under `public/break_escape/assets/fonts/SourceSans3/`.

| Committed file | Source URL | SHA-256 | `name` table |
|---|---|---|---|
| `SourceSans3-latin.woff2` (28,872 bytes) | https://fonts.gstatic.com/s/sourcesans3/v20/nwpStKy2OAdR1K-IwhWudF-R3w8aZQ.woff2 | `19143dca075972bc84e3fd9eab7416dd40cc565dccb2435a044bdfabe060c7d5` | Version 3.052;hotconv 1.1.0;makeotfexe 2.6.0 (nameID 5); PS name SourceSans3-Roman; fvar wght 200 to 900 |
| `SourceSans3-cyrillic.woff2` (18,496 bytes) | https://fonts.gstatic.com/s/sourcesans3/v20/nwpStKy2OAdR1K-IwhWudF-R3wsaZfrc.woff2 | `b6b721e08d0324b9e743858e8260463085d4c5e1e684f036f9d4a8ca6c62996f` | same as above |
| `OFL.txt` (4,579 bytes) | https://raw.githubusercontent.com/google/fonts/main/ofl/sourcesans3/OFL.txt | `09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392` | n/a |

- Version read with fontTools (installed under the scratch folder with `pip install --target`, not into the repo).
- OFL.txt commit: google/fonts `4013637d2e1a67ceb8b0a50957bbbff41a27d0f6` (2021-09-17), the last commit that touched
  `ofl/sourcesans3/OFL.txt`. Downloaded from `main` at google/fonts HEAD `47d54ca1ebb14fd864695f1d39dc734f39017c33`
  (2026-10-16). Copyright line: "Copyright 2010-2020 Adobe ... Reserved Font Name 'Source'".
- CSS API request: `https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700` with a Chrome 130 Linux
  User-Agent; response SHA-256 `09da5b604c537fbb8d6f1ec0c4b0c83367cfb2df084d2c0fb839b2761d9d0716` (14 blocks; the
  `latin` and `cyrillic` blocks used).

## One file per subset, not one per weight

The API serves Source Sans 3 as a variable font. The 400 and 700 `@font-face` blocks for a subset point at the
same gstatic URL. So the bundle is two font files (Latin, Cyrillic) plus the licence, not four. `css/fonts.css`
keeps the API's four blocks (400 and 700, each Latin and Cyrillic), all pointing at the two files. The plan,
ASSETS FONT1 to FONT5 and `00` §6 say "Regular and Bold, Latin and Cyrillic files"; they should say two variable files.

## Subset coverage

The Cyrillic file has 100 code points in U+0400 to U+04FF. All 21 letters of the `00` §6 confusable map
(а е о р с у х і ј ѕ, А В Е К М Н О Р С Т Х) are present (fontTools cmap check, none missing). The full
upstream TTF has 156 in that block; the other 56 (mostly U+0460 to U+04AF and U+04B2 on) sit in the API's
`cyrillic-ext` subset, which is not bundled.

## Gate: test page

Scratch pages in `.../scratchpad/se-P0-L/site/` (`dom.html`, `canvas.html`, `latin.html`) served by
`python3 -m http.server` on 127.0.0.1:8765, driven by headless Chromium 131 through playwright-core
(`run.js`). Results:

- `раураl.com` (Cyrillic р а у р а + Latin l) in `font: 400 32px var(--se-font-readable)`: computed
  `font-family` is `"Source Sans 3", "Segoe UI", Arial, sans-serif`.
- `document.fonts`: all four Source Sans 3 faces report `loaded` after `document.fonts.ready` on that page.
  `document.fonts.check('32px "Source Sans 3"', 'рау')` true; same for `l` and for weight 700 with `раул`.
- No fallback glyphs: canvas `measureText` widths in the bundled face for а, р, у, l are 16, 18, 15, 8 px at 32px;
  a nonexistent face falling to monospace gives 19.27 for every one. Screenshot: `.../se-P0-L/dom.png`.
- Latin-only page (`latin.html`) fetched only `SourceSans3-latin.woff2`: `unicode-range` splitting works.
- `rn`, `m`, `vv`, `w`, `Il1` are distinct by eye in `dom.png` (tailed `l`, `I` and `1` differ).

## Spike F6: canvas text with the bundled face

Answer: yes, `fillText` draws the bundled face once the face has loaded, and not before. The browser does not
load a `@font-face` file until something asks for it, and canvas text does not reliably trigger that and never
redraws afterwards.

Evidence (Chromium 131, `canvas.html`, Phaser 3.60.0 from the CDN version `show.html.erb:273` uses):

1. Fresh page, nothing yet drawn in the face: all four Source Sans 3 faces `unloaded`; `document.fonts.check(...)`
   false. A canvas `fillText` with `32px "Source Sans 3", monospace` produced pixels and width identical to
   plain monospace (1798 opaque pixels, same hash, width 250.45). It drew the fallback.
2. `await document.fonts.load('32px "Source Sans 3"', text)` resolves with the Regular Latin face `loaded`;
   `check` becomes true; the same `fillText` now gives width 164.00 and different pixels.
3. Weight and script are separate faces. Bold and the Cyrillic file stay `unloaded` after step 2
   (`check('700 32px ...', 'ра')` false). They load only when asked: `document.fonts.load('700 32px "Source Sans 3"',
   'рау')` then `check` true. Cyrillic bold canvas text before that would draw a fallback; after it, width 96.00 against
   115.59 for monospace.
4. Phaser Text: a `Phaser.GameObjects.Text` created before the load took width 251 (fallback). After `document.fonts.load`
   resolved it was still 251 (stale: Phaser does not redraw). Calling `setText` again redrew it at 164. A Text created
   after the load measured 164 straight away, equal to the reference canvas width.

What must wait:

- Any canvas or Phaser text in the face must be created (or re-rendered with `setText`) after
  `await document.fonts.load(<weight> 32px "Source Sans 3", <the text that will be drawn>)`. Pass the real string
  (or at least one Cyrillic character) so the subset the text needs is the one that loads. Load Regular and Bold
  separately if both are used.
- `document.fonts.ready` alone is not enough: it resolves with nothing loaded if no DOM text has asked for the
  face yet (step 1). It is fine for DOM overlays, which request the faces themselves.
- Any text drawn before the load needs a `setText`/`setStyle` redraw after it.

## Not done / notes

- Nothing existing uses the new font. `--se-font-readable` was added in a new `:root` block at the end of
  `css/fonts.css`; the token's stack is `'Source Sans 3', 'Segoe UI', Arial, sans-serif`. No existing rule changed.
- `fonts.css` has no preload of the files; add one only if the first mail open shows a visible swap.
