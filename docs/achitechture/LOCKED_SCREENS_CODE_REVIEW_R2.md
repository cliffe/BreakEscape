# Locked screens: code and art review, round 2 (2026-11-12)

Branch `build/locked-screens` against `main`, up to 1226ba2d7 (the round 1 fixes). Read with the
build log (`LOCKED_SCREENS_BUILD_LOG.md`) and round 1 (`LOCKED_SCREENS_CODE_REVIEW_R1.md`).

Counts: 0 blocker, 0 major, 0 minor, 2 nit.

## What was checked

### The `pc_locked` alias made in `create()`

- **Order in the code.** The alias is the second statement of `create()`, after
  `setGameInstance(this)` and before the first `await`. Phaser only calls `create()` once every
  file queued in `preload()` has loaded, so `pc1_locked` is always in the texture manager when it
  runs. Everything that can swap a PC to a locked texture comes later in the same `create()`:
  the start room is built after several awaits (`createRoom`, then
  `window.screenStates?.syncRoom(roomId)` in `core/rooms.js`), and `screen-states.js` itself is
  installed later still, through the dynamic import chain after `installWorkstationState()`.
  Its `install()` pass syncs every loaded room, so a PC already locked when its room is built
  gets the look then, after the alias exists. Rooms loaded later (lazy room loading) run after
  `create()` has finished.
- **Nothing earlier than `create()` uses it.** `preload()` only queues files and the scenario
  JSON's `filecomplete` handler (character atlases). No other scene exists (`main.js` imports
  the one `preload`/`create`/`update` from `core/game.js`), no code listens for the texture
  manager's add events, nothing removes textures, and no JS test runs `create()`. A scene restart
  would hit the `!exists('pc_locked')` guard and leave the alias as it is.
- **Lighting.** `lighting.js` builds a PC's glow from `_screenBaseKey` (the base key), never the
  `_locked` key, so the alias never reaches it.
- **Live proof**, keyless server on :3048, `test_needs_sims` (games 1457 and 1459). No scenario
  has an owned workstation on the plain `pc` key (the four `"sprite": "pc"` objects in
  `test-network-architecture`, `test-siem`, `test-network-segmentation-plan` and
  `sis01_healthcare` have no owner and no workstation fields), so the browser script rewrote the
  `room/office` response to give `sanjay_pc` `"sprite": "pc"`. Phaser's `addImage` and
  `Sprite.setTexture` were wrapped from an init script to log the order:
  - `addImage('pc_locked')` at 7886 ms, then the start room's `window.rooms` and its PC sprites
    (`pc8`, `pc6`, `pc`) from 7895 ms on. The alias was there before any PC sprite existed.
  - Before: `sanjay_pc` texture `pc`, 28x23. `pc_locked` exists, is 28x23 and shares its
    source image with `pc1_locked` (one fetch).
  - Sanjay sent for coffee (`caffeine` 0), then held away with the needs `suspend` command; the
    20 s auto lock fired and `setTexture('pc_locked')` ran with `exists: true`. The sprite became
    `pc_locked` at 28x23, display size unchanged, no flip. A second `syncRoom('office')` kept it.
  - `resume` brought him back and the sprite returned to `pc`. `screenTransitions()` recorded
    the lock and the unlock.
  - A run without the rewrite (game 1457) did the same on `pc11` / `pc11_locked` at 31x21.

### The pixel test fails on a bad picture

Each case was made in the worktree, the file test run, then the file restored with `cp` from a
saved copy (`git status` clean afterwards, file test green, 24 tests):

| Bad picture | Result |
| --- | --- |
| `pc5_locked.png` with one keyboard pixel (0, 26) recoloured | fails: "pc5_locked.png changes nothing outside pc5's screen [1,1,26,15]" |
| `pc1_locked.png` replaced by `pc1.png` (nothing repainted) | fails: "pc1_locked.png repaints the screen (0 px)" |
| `pc5_locked.png` replaced by `pc6_locked.png` (wrong size) | fails: "pc5_locked is the size of pc5.png" |
| `pc5_locked.png` with one screen pixel at half alpha | fails: "pc5_locked.png keeps the outline" |

The second art test also proves the check on in-memory recolours (keyboard key, bezel, pc7's
rounded corner).

### Art and the script

- Rebuilding candidate a for all twelve bases with `make_locked_screen.py --out` gives the
  committed `_locked` files byte for byte, so the `rounded` argument change kept pc7's corners and
  nothing was edited by hand.
- A 6x sheet of base beside locked for all twelve: the bezels, pc1's coral frame, pc5's chin and
  power light, pc6's screws, pc7's rounded glass, pc9 and pc10's tower and lights, and every
  keyboard and mouse are untouched; the padlock reads on all of them, the four short screens
  included. I agree with round 1 on the art.

## Round 1 items

- Minor 1 (test title claimed more than it checked): fixed. The rectangles live in
  `scripts/room_gen/locked_screen_rects.json`, read by both the script and the test, and the
  test now fails any changed pixel outside the rectangle or on a rounded corner (shown above).
- Nit 2 (`pc1_locked.png` fetched twice): fixed with the alias; one `addImage`, shared source.
- Nit 3 (one pixel off centre): left, correctly. Only spare space of odd size is off, which a
  7-wide, even-height padlock cannot avoid.
- Nit 4 (`pc8`, `pc12` light up when locked): left, as the user accepted.
- Nit 5 (`SKIP_CORNERS` global): fixed; `rounded` is an argument through `build()`, the
  candidates and `fill()`.

## Findings

### Nit

1. **The script's docstring describes the old double load.** `make_locked_screen.py` still says
   "core/game.js loads that file as both `pc_locked` and `pc1_locked`". It now loads it once as
   `pc1_locked` and makes `pc_locked` an alias in `create()`. Suggested wording: "core/game.js
   loads it as `pc1_locked` and makes `pc_locked` an alias of it in create()". The build log's
   "What changed" bullet for `core/game.js` has the same old wording, corrected only further down
   in its R1 section, so a reader who stops at the top gets the old story.
2. **The test pins the alias by its exact source text.** The regex
   `this\.textures\.addImage\('pc_locked', this\.textures\.get\('pc1_locked'\)\.getSourceImage\(\)\)`
   fails on a harmless rewrite (a local variable for `this.textures`, double quotes). That is the
   house style for `game.js` wiring tests (item-drop does the same), so it can stay; if it ever
   trips, loosen it to `addImage\(\s*['"]pc_locked['"]` plus a `pc1_locked` match on the same line.

## Not checked

- An in-game screenshot of the `pc_locked` sprite: my crop missed the PC (the camera was not on
  it), so the live proof above is by texture key, size and source image, and the art by the file
  sheet.
- A PC locked at the moment its room is first built in a fresh game (no scenario starts an owner
  away). The code order above covers it: the alias is made before any room is built.
