R1: 0/0/5

# Lighting flicker options, code review R1

Scope: 8deaf1ee1 (engine, schema, tests) and 8502ec02e (test_needs_sims scenario and README) on build/ol-polish, with a short look at f2cc3267f and 317acaa97 (upkeep icon) and 56b918be2 (re-voice). The user's decision was "D6 flicker: a. Deeper, longer dips: 3 dips of 150 to 250 ms every few seconds". The change delivers it.

## What checks out

- **`flicker: true` is unchanged.** Every existing use is `flicker: true`: m01 (1689), m02 (2739, 3486), m04 (2776), m07 (2366), m09 (1632), lab_physical_pentest (2378). m08's two `spriteStyle.flicker` entries are the NPC sprite style and go through npc-sprite-style.js, not lighting.js. `resolveFlicker(true)` returns `{ stock: true }`. The stock branch of `planFlickerBurst` draws random numbers in the same order as the old code (first dip, then the one-or-two coin, then the second offset), with the same 90 ms length, level 0.55 and `nextBurst`. Nothing else reads `p.dips`, so moving from numbers to `{ at, len }` is safe. Panels without a plan fall back to `{ stock: true }`.
- **Clamps on well-formed input hold.** Inverted ranges are swapped after clamping (`[250, 150]` gives `[150, 250]`; `gapMs: [1e12, -5]` gives `[2000, 60000]`). Strings, `null`, `Infinity`, `{}` and `[]` for `dips`, `depth` and as the whole `dipMs` value fall back to defaults. `dips` lands in 1 to 3 and depth in 0.1 to 0.9. The one gap is a range whose first element is not a number (m1).
- **Rate.** Within a burst, `gap = max(100, 550 - len, 150 + r*200)`, so starts are at least 550 ms apart and dips at least 100 ms apart. For the staff room (150 to 250 ms) the period is 550 to 600 ms. Over any one-second window there are at most four luminance transitions (two dips down and up), so at most two flashes. The next burst is planned only once `now > end`, at `now + gapMs[0]` or later, so the last dip of one burst and the first of the next are at least 2 s apart. Reduced motion skips the faulty branch, so the panel holds at level 1.
- **Depth 0.7 against WCAG 2.3.1.** A drop to level 0.3 cuts the pool's added light (`panelAdd * p.level`, lighting.js:1366) by 70%. That is well over a 10% change in relative luminance, and a pool about 200 px across at 1x (larger at game zoom) may exceed the small-area exemption, so each dip should count as a general flash. Compliance comes from the rate: at most 2 flashes in any second, under the limit of 3. That also passes the stricter 2.3.2 (AAA) count. The panel colour is warm white, so the red-flash rule does not apply.
- **Timers and state.** There are no `setTimeout`s. The burst lives on the panel object and is driven by the frame time, so nothing outlives the room. Room states are kept for the session and cleared in `destroy()`. When `job_cleared` becomes true, `resolveRoomVariant` (lighting.js:782 to 799) calls `configureRoom`, which runs `layoutPanels` again. The new panels have no `faulty` flag and no stale dips, and their level is set to 1, so the light steadies within the 1 s re-check, mid-burst or not. Each flickering room has its own faulty panel and plan, so rooms do not share state.
- **Schema placement.** The engine reads `cfg.flicker` only in `configureRoom` (lighting.js:770), and `cfg` is the room block merged with its matching variant. The schema allows the object form at both of those places (room `lighting.flicker`, scenario-schema.json:4085, and room `lighting.variants[].flicker`, 4123) and nowhere else. The scenario-level `lighting` block and `spriteStyle.flicker` (4261) stay boolean, and neither one reads an object. test_needs_sims passes schema validation (0 errors).
- **Icon (f2cc3267f, 317acaa97).** `npc-upkeep.png` is 16 x 16 RGBA and reads as a small red toolbox. `actionIcons.upkeep` changes from `icon:npc-work` to `icon:npc-upkeep`. The README sentence ("a red toolbox, `assets/icons/npc-upkeep.png` ... maps the `upkeep` need to `icon:npc-upkeep`") matches.
- **Re-voice (56b918be2).** The ERB renders and parses. Neil is Umbriel, Keith is Algenib and Jodie is Zephyr; the styles and `language` are unchanged. The commit has 153 added mp3s, 153 removed mp3s and 153 renamed json sidecars. The sidecars name 43 Umbriel, 56 Algenib and 54 Zephyr clips (153 in all), each with the new voice. The cache holds 399 mp3s and 399 json sidecars. The Charon, Orus and Leda clips left in the cache belong only to tom, marek and rosa, so no orphans remain. The README makes no claim about voices.
- **README (8502ec02e).** The light-job paragraph matches the scenario and the engine clamps (three dips, 100 ms floors, 0.55 s starts, 2 s between bursts, steady under reduced motion). The scenario `_comment` agrees with it.

## Findings

### m1. A range whose first element is not a number makes the flicker stop for good

public/break_escape/js/systems/lighting.js:346

`numberOr(a[1], a[0] ?? fallback[1])` uses `a[0]` as the fallback for the max, even when `a[0]` is itself not a number. `??` only catches null and undefined, so for `dipMs: [NaN, NaN]` or `["a", "b"]` the max comes out as NaN (checked: `dipMs` becomes `[100, NaN]`; `gapMs: ["x", "y"]` becomes `[2500, NaN]`).

Failure: an author writes `"dipMs": ["150", "250"]`, or an ERB helper emits a non-number, and skips the validator. `planFlickerBurst` returns NaN dip lengths or start times and `end: NaN`. In `updatePanels`, `now > NaN` is always false, so the panel never plans another burst and never dips. The light is silently steady for the whole session. It fails safe (no flashing), but the author gets no warning, and the schema is the only guard.

Fix: `let max = ...numberOr(a[1], numberOr(a[0], fallback[1]))`. Add a test for `[NaN, NaN]`, two strings, and one bad element.

### m2. A burst planned before the lights go off can resume straight after the strike

public/break_escape/js/systems/lighting.js:1041 to 1061 (`switchOn` / `switchOff`)

`switchOff` and `switchOn` reset `level` and `strikeAt` but leave `p.dips` and `p.nextBurst` in place. In a motion room with `flicker`, suppose the player leaves, the lights go off during a burst (or just before one), and the player walks back in before `nextBurst`. After the strike, the panel plays the rest of the old plan. The strike sequence is itself two flashes in about 460 ms, so a dip that starts within the following second can push the window to three or four flashes. The stock panel already does this, with up to two 90 ms dips. The object form widens the window, because a burst can run for about 1.9 s. No room uses motion together with the object form today (the staff room is `on`), so nothing ships with this.

Fix: in `switchOn` and `switchOff`, clear `p.dips = null` so the next burst is planned fresh at least `gapMs[0]` (or 2.5 s for stock) after the strike. A test should switch off mid-burst, switch on, and check that no dip starts within 1 s of the strike's end.

### m3. Omitted fields in the object form do not default to the stock panel

public/break_escape/js/systems/lighting.js:360 to 361

When `dips` is left out it defaults to 3 (the maximum), and when `dipMs` is left out it defaults to `[100, 100]`. The stock panel has one or two dips of 90 ms. So `flicker: { "depth": 0.7 }`, which reads as "the stock flicker but deeper", gives three dips a burst, every burst. `gapMs` and `depth` do default to the stock values, so the object is only partly consistent with them.

Failure: a lighting pass on another mission copies the depth idea, writes `{ "depth": 0.7 }`, and gets a busier light than intended. Nothing documents the defaults: the header comment at lighting.js:17 to 19 and the schema descriptions do not list them.

Fix: either default `dips` to 2 (or keep the stock one-or-two coin when `dips` is missing) and `dipMs` to `[100, 100]`, the nearest value the clamp allows to the stock 90 ms, or keep the current defaults and list them in the header comment and the schema's `dips` and `dipMs` descriptions.

### m4. The schema has no upper bounds for dipMs and gapMs items

scripts/scenario-schema.json:4085 and 4123

Items have `minimum` 100 and 2000 but no `maximum`, while the engine clamps them to 600 and 60000. `"dipMs": [800, 1200]` passes validation and is silently played as `[600, 600]`. The two copies are also duplicated in full, so a later fix to one can miss the other.

Fix: add `"maximum": 600` to the `dipMs` items and `"maximum": 60000` to the `gapMs` items, and say so in the descriptions. Optionally move the object to a `definitions` entry and `$ref` it from both places.

### m5. The tests miss malformed input and the live room path, and the header names the wrong file

test/js/lighting-flicker-options.test.mjs:1 to 3, and the test list as a whole

- No case covers NaN, strings, a single element, or an empty or inverted range. Inverted ranges work but are not asserted, and the NaN case in m1 would have been caught.
- `updatePanels` is tested on a hand-built panel. No test runs `configureRoom` to check that `flickerPlan` is set on the faulty panel, or checks that a `variants` entry with `flicker: false` (the `job_cleared` path) leaves no faulty panel and level 1 mid-burst. That path is what the staff-room light job depends on.
- The stock test checks ranges, not the claim "byte-for-byte the old behaviour". A test that seeds the same `rand` into a copy of the old inline code and into `planFlickerBurst({ stock: true })` and compares the outputs would back that claim directly.
- Lines 2 and 3 give two run commands. The second names `lighting-flicker-effect.test.mjs`, which is a different file. The file runs under both `node` and `node --test`, and bin/test-js picks it up through `test/js/*.test.mjs`.

Fix: add the cases above and keep one correct run line.

## Note (not scored)

Each flickering room runs its own schedule. If two flickering rooms are on screen at once, their panels can dip in the same second. m02 already has two stock `flicker: true` rooms (2739, 3486). Under WCAG, separate small areas flashing out of step are usually judged one area at a time, so this is probably fine. If a mission ever puts two object-form rooms side by side, a shared "next dip allowed" time across rooms would keep the whole screen at 2 flashes a second or fewer.

The README's "a burst every 2.5 to 8.5 s" is the gap between bursts, not the start-to-start period (the period adds the burst's own 1.2 to 1.5 s). The stock comment used the same wording, so this is left as is.
