# Locked screens: code and art review, round 1 (2026-11-12)

Branch `build/locked-screens` against `main` (commits dac131dad, 8eba1b0a9). Read with the build log
(`LOCKED_SCREENS_BUILD_LOG.md`).

Counts: 0 blocker, 0 major, 1 minor, 4 nit.

## What was checked

- **Pixels.** Each of the twelve locked pictures (`pc1`, `pc3` to `pc12`, and the existing
  `pc_desktop`) was diffed against its base with Pillow. All are the same size as the base, all are
  8-bit RGBA, and every changed pixel lies inside that base's `RECTS` rectangle (0 outside in every
  case). The bounding box of the changes equals the rectangle. Rebuilding candidate a from the base
  with the script gives the committed picture pixel for pixel, so nothing was resized or hand
  touched afterwards. A ring check of the pixel just outside each rectangle found no glass colour
  left unpainted (the only hits, on `pc4`, are its white frame).
- **Art.** The contact sheet, plus my own 8x nearest-neighbour crops of base beside locked. The
  bezel, frame, corner screws (`pc6`), rounded glass corners (`pc7`), power lights (`pc5`, `pc9`,
  `pc10`) and keyboards are untouched. The padlock reads as a padlock at 1x on every base,
  including the four short screens that take the 7x6 lock (`pc1`, `pc3`, `pc4`, `pc8`).
- **Key mapping.** A Tiled object's texture key is its tile image basename (`core/rooms.js`
  `getImageNameFromObjectWithMap`), so a tile drawn from `pc.png` becomes the key `pc`, which
  `core/game.js` loads from `pc1.png`; `pc_locked` loading `pc1_locked.png` therefore matches the
  art on screen. The `.json` room maps place 109 PC tiles: `pc12` 24, `pc8` 19, `pc5` 17, `pc6` 15,
  `pc11` 14, `pc10` 11, `pc1` 9, `pc` 4, `pc7` 3, `pc3` 3, `pc9` 1. Every one has a `_locked` twin.
  Scenario `sprite` overrides use `pc_desktop` (has one), `pc` (has one) and the ransomware keys
  (no twin, so they keep their look and still get the sounds, as the module documents). No `pc13`
  tile is placed, and none of the PC placements is flipped (no gid flip bits) or rotated. Even if
  one were, `screen-states.js` swaps with `setTexture`, which keeps a sprite's flip and rotation,
  and the locked picture is the base's size, so nothing would shift.
- **Test.** The new test, run against `main`'s engine, objects and `game.js` (a `git archive`
  copy in the scratchpad), fails with `pc_locked is preloaded`. On the branch the file passes 23 of 23.
  Pointing `pc_locked` at the wrong picture (for example `pc_desktop_locked.png`) would also
  fail, on the size check and the final assertion.
- **Load cost.** Twelve more `load.image` calls among about 1,360 loader calls in `preload()`,
  roughly 6.5 KB in all (the largest file is 740 bytes). No measurable effect on load time.

## Findings

### Minor

1. **The test's title claims more than it checks.** It is named "... changed only inside the
   screen", but it only checks that no pixel's alpha changes and that more than 40 pixels change.
   A locked picture that recoloured the keyboard or bezel (opaque to opaque) would pass. Either
   check the changed pixels against each base's screen rectangle (copy the rectangles from
   `RECTS` into the test, or have the script write them to a small JSON file that the test reads), or
   rename the test to say what it checks ("keeps the outline and repaints at least 40 px").

### Nit

2. **`pc1_locked.png` is fetched twice.** `pc_locked` and `pc1_locked` each load the same URL,
   so the loader issues two requests (both start in the same parallel batch, so the browser cache
   rarely saves the second). This copies the existing `pc`/`pc1` pair and costs 558 bytes, so it
   can stay. If it is changed, alias the texture once in `create()`
   (`this.textures.addImage('pc_locked', this.textures.get('pc1_locked').getSourceImage())`)
   and update the test, which reads the key map from the `load.image` lines.
3. **Off-centre by one pixel on some screens.** A 7-wide padlock on an even-width screen cannot be
   centred, so it sits 1 px left on `pc3`, `pc4`, `pc5`, `pc6`, `pc7`, `pc9`, `pc11` and
   `pc_desktop` (one more column on the right than the left).
   `centre_y` floors, so where the spare rows are odd the lock sits 1 px high: `pc4` and `pc8`
   (1 above, 2 below), `pc5`, `pc10`, `pc12`, `pc_desktop` (one more below than above). At 1x this
   is not noticeable, and a slightly high lock balances the narrow shackle. No change needed.
4. **Two bases look switched off and light up when locked.** `pc8` (dark grey glass) and `pc12`
   (dark slate glass) look off in their base art, so locking brightens them to the navy lock
   screen. That is how a real lock screen behaves and it makes the change visible from across a
   room, so it is a matter of taste. Worth a glance from the user only if the "off" look was meant to
   say the PC is off.
5. **`SKIP_CORNERS` is a module global set in `main()`.** `fill()` reads it, so calling
   `build()` from another script (as I did for the regeneration check) needs the caller to set it
   first or `pc7`'s corners are painted. Passing the corner rule into `build()`/`fill()` as an
   argument would remove the trap. It does not affect the committed pictures.

## Not checked

- No live run. The build log's live proof (`pc6`, `pc8`, `pc11` in `test_needs_sims`) covers the
  runtime swap, and nothing in this branch changes `screen-states.js` beyond its header comment.
