# Locked screens for every workstation PC: build log (2026-11-12)

User decision q54 (docs/handover/2026-11-11_USER_DECISIONS.md): locked-screen pictures for the
other PC sprites. Before this only `pc_desktop` had a `<key>_locked` picture, so any other
workstation PC got the lock sounds and dots but kept its desktop on screen.

## What changed

- Art: `public/break_escape/assets/objects/pc1_locked.png` and `pc3_locked.png` to
  `pc12_locked.png` (eleven files). Each is its base with only the screen glass repainted:
  the navy screen and white padlock of `pc_desktop_locked.png` (candidate a). Same size as the
  base, every pixel outside the screen rectangle unchanged.
- `scripts/room_gen/make_locked_screen.py`: a hand-placed screen rectangle for every base in
  `RECTS` (placed on a 20x grid of each sprite and checked by the colours on each side of every
  edge); `ROUNDED` leaves pc7's four corner pixels alone (its glass has rounded corners); a
  screen under 12 rows takes the 7x6 padlock instead of the 7x8 one; the 17x12 minimum now only
  applies to candidates b and c, which are skipped on smaller screens.
- `core/game.js`: preloads `pc1_locked` and `pc3_locked` to `pc12_locked`; `pc_locked` is an alias
  of `pc1_locked` made at the start of `create()` (the texture key `pc` loads pc1.png, not pc.png).
- `systems/screen-states.js`: header comment no longer says only `pc_desktop` has the art.
- `test/js/screen-states.test.mjs`: one test that every workstation base key (`pc`, `pc1`,
  `pc3` to `pc12`, `pc_desktop`) has a `<key>_locked` preload, of the same size as its base,
  that keeps the outline (alpha) and repaints the screen. It decodes the PNGs with node's zlib
  (no new package).

Which bases matter: the room maps place `pc` (archive, control, hospital ward), `pc1`, `pc3`,
`pc5` to `pc12`; `room_office.json` hands out one each of `pc6`, `pc8` and `pc11`. `pc4` is
placed by no map but is loaded and can be named by a scenario `sprite`, so it has one too.
`pc13` appears in the room tilesets but has no image file and is not loaded.

## Screens that are small

No screen is too angled for a clean padlock: every one is square to the sprite.
Four are short, so they take the 7x6 padlock: `pc1` (15x10), `pc3` (16x10), `pc4` (14x9) and
`pc8` (13x9). On `pc4` and `pc8` the margin is 1 row above and 2 below, and `pc4` (even width)
sits 1 px left of centre, as `pc_desktop_locked` does. They read clearly at 1x.

## Tests

- `bin/test-js test/js/screen-states.test.mjs`: 23 pass (one new).
- Full `bin/test-js -j 3` under the shared lock: 507 files passed, 0 failed.

## Live proof (keyless server on :3042, `test_needs_sims`, room_office)

The three owned PCs get `pc8` (amara_pc), `pc6` (tom_pc) and `pc11` (sanjay_pc) from the room map.

- pc6, game 1368: needs seed 2 (`needs.setSeed`, chosen with the engine's own `roll` so Tom's
  0.5 `lockChance` locks on his first leave), Tom's caffeine set to 0. He walked to the coffee,
  the sprite became `pc6_locked` at 32x30 (the base's size), and went back to `pc6` on his return.
- pc11 and pc8, games 1378 and 1392 (repeated): Sanjay sent for coffee and held away with the
  needs `suspend` command (what a scenario eventMapping uses); his PC's 20 s `autoLockSeconds`
  locked it (`pc11_locked`), and `resume` brought him back and unlocked it. Amara, heading for the
  coffee while he was at it, left on a trip estimated over her 20 s habit threshold and locked
  hers (`pc8_locked`, 34x22). The scenario's own "Hear a screen lock as its owner walks off"
  task completed. `screenTransitions()` recorded each change; the module's own sound was null
  because the scenario's office-life lock cues play the chime.
- Screenshots: kept in the build session's scratchpad (not committed).

## Left open

- Amara's lock depends on her trip estimate, so a plain coffee run in a fresh game leaves her
  screen open (16 s); the lock above needed the coffee station busy. Not a bug.

## Review R1 fixes (LOCKED_SCREENS_CODE_REVIEW_R1.md)

- Minor 1: the screen rectangles moved to `scripts/room_gen/locked_screen_rects.json`, read by
  the script and by the test. The art test now fails any changed pixel outside the base's
  rectangle (or on a rounded corner). A second test recolours a keyboard key, a bezel pixel and
  pc7's corner and checks each is reported. Proof: a pc7_locked.png with one keyboard pixel
  repainted failed both tests; the file was then restored from git.
- Nit 2: `pc_locked` is an alias of `pc1_locked` made in `create()` (`textures.addImage`), so
  pc1_locked.png is fetched once.
- Nit 3: every lock whose spare space is even is already exactly centred. The rest cannot be,
  with a 7-wide, even-height padlock (x on pc3, pc4, pc5, pc6, pc7, pc9, pc11, pc_desktop; y on
  pc4, pc5, pc8, pc10, pc12, pc_desktop). No picture changed.
- Nit 4: left as it is (the user accepts a locked screen lighting up).
- Nit 5: the corner rule is a `rounded` argument to `build()`, the candidates and `fill()`; no
  module global. Rebuilding every base gives the committed pictures byte for byte.
