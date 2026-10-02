# Fingerprint minigame redesign

Status: plan, 2026-10-01. Replaces the 30x30 "dusting grid" (`minigames/dusting/dusting-game.js`) and the kit's instant "Search room" collection. Closes the engine gaps listed under E1 in `scenarios/PASS3_APPROVAL_LOG.md`.

## 1. What is wrong today

The minigame itself:

- **It doesn't look like a fingerprint.** The "print" is 60–90 cells of a 30x30 DOM grid laid out as an oval, a spiral or three ray bursts (`dusting-game.js:577-685`), plus random filler cells. Revealed cells turn bright green. Nothing resembles ridges.
- **It isn't a decision.** There is one action (drag) and three brush sizes that only change radius. The player rubs until a counter reaches 30% and the game ends on its own. There is no powder, no lift, no comparison.
- **It doesn't make sense.** "Over-dusted: 12/40 max" is a fail counter with no visible cause; the third pass on any cell counts as over-dusting, and over-dusting ends the attempt.
- **Quality can't pass a strict lock.** Quality is `0.7 + 0.25 x coverage - 0.15 x overdust`, and the game stops at 30% coverage, so every lift scores about 0.78. `biometric_breach`'s 0.9 locks can't open (E1).
- **It is slow to render.** 900 divs, a `querySelector` per brushed cell, and one DOM particle per speck.

The wiring around it (E1 and what I found reading the code):

| # | Gap | Where |
|---|-----|-------|
| W1 | Prints are client-only; a reload empties `gameState.biometricSamples`. `Game#add_biometric_sample!` is never called and `sync_state` ignores samples. | `game.rb:211`, `state-sync.js`, `games_controller.rb#sync_state` |
| W2 | A print surface hides its own text: with no kit the player gets "Missing Equipment" and nothing else; with the kit the dusting game always opens. | `interactions.js` fingerprint branch (~1226-1241) |
| W3 | The only collection event is the generic `minigame_completed {minigameName:"DustingMinigame"}`. | `base-minigame.js` `complete()` |
| W4 | A door's `biometricMatchThreshold` is ignored: the check reads `lockable.biometricMatchThreshold`, but for a door the lockable is the door sprite and `doorProperties` never copies the field. Doors always use 0.4. | `unlock-system.js` biometric case, `doors.js:503-517` |
| W5 | Failure messages show the raw owner string and can't tell a wrong print from a missing one. | `unlock-system.js` biometric case |
| W6 | A biometric door shows the keyway (lockpick) icon. | `interactions.js` door icon switch (~438) |
| W7 | The kit's "Search room" mode collects a print with a random quality and no minigame, doesn't clear `hasFingerprint`, and fires no event. | `biometrics-minigame.js:217-333, 557-576` |
| W8 | Two dusting entry points: `biometrics.js#startDustingMinigame` (used) and a stale copy at the bottom of `dusting-game.js` (unused, wrong `startMinigame` signature). | both files |

m04 and m05 have both had to write around these (comments at m04 erb ~1420 and ~659, m05 erb ~1310 and ~903).

## 2. The player's goal and the five steps

**Goal, in the player's words:** "Get a clean enough copy of this person's print to fool their reader, and be sure it's theirs."

That gives the minigame two outputs that matter to the mission: a **quality** (can it open the reader?) and an **identity** (do I know whose it is?). Each step feeds one of them. A full run takes 45–90 seconds; a careful one, a little longer.

The overlay keeps the house style: a dark panel, `Press Start 2P` for headings and `VT323` for body text, square corners, the green-phosphor accent the PIN pad uses (`#00ff41`), and a single canvas for the work surface drawn at low resolution and scaled up with `image-rendering: pixelated`, so the print sits with the game's pixel art. A step strip across the top (`1 Find · 2 Powder · 3 Dust · 4 Lift · 5 Compare`) shows where the player is.

### Step 0. Examine (the panel the player first sees)

Opening a print-bearing object with the kit shows the object's name, its `observations`, and its `text` if it has any, with three buttons: **Dust for prints**, **Use normally** (runs the object's ordinary interaction once, so a print never hides a note, a PC's files or a container) and **Close**. If this surface has been lifted before, the panel says so and shows the best quality ("Lifted before: 64%. Dust again for a cleaner lift?"). This fixes W2.

### Step 1. Find the latent print (oblique light)

The canvas shows the surface close-up: glazed ceramic, a dark terminal bezel, a textured keypad. The print is invisible. The cursor is a torch held low; inside its circle the surface shows a faint sheen where the residue is, the way an examiner sweeps a light at a shallow angle. The player clicks (or presses Space) on the sheen to mark it. A click on bare surface says "Nothing there. Keep the light low and look for a sheen." After 15 seconds a **Hint** button pulses the area. Easy prints show a faint smudge even without the torch.

Feel: a short search, a small "found it" moment. The print's position is randomised per surface, so it is a real look.

### Step 2. Choose powder and brush

Three jars, each with a one-line label on the kit:

| Powder | Label | Best on |
|---|---|---|
| Black granular | "Pale, smooth surfaces" | `glossy_light` (white mug, paper-white panel) |
| Silver (aluminium) | "Dark or shiny surfaces" | `glossy_dark` (screen, black bezel, phone) |
| Magnetic black | "Textured plastics. Gentle: no bristles touch the print." | `textured` (keypad, grip, moulded case) |

and two brushes for the granular powders: **Fine** (fibreglass, small and controlled) and **Broad** (feather, quick but clogs sooner). Magnetic powder uses the wand, which has one size and half the clogging rate.

The surface description from step 0 ("Glazed white ceramic: pale, smooth") is the clue. A wrong powder still works, but the ridges show with poor contrast and the lift's quality is capped lower (section 4). The player sees this at once, and **Change powder** wipes the surface and lets them pick again, so the choice teaches rather than punishes.

### Step 3. Dust and reveal the ridges

The player drags the brush over the surface (or moves a reticle with the arrow keys and holds Space). Powder builds up where they brush. It clings to the ridges far more than to the bare surface, so ridges appear stroke by stroke: first a grey haze, then crisp lines, with ridge endings and forks showing. Keep brushing the same spot and the powder starts to fill the furrows between ridges: the area goes blotchy and the lines blur. That is visible and local, and it lowers the quality of that patch only. There is no fail state and no counter that ends the game.

Two meters, both with numbers as well as bars: **Coverage** (how much of the print is developed) and **Clarity** (how clean what is developed is). **Lift** unlocks once coverage passes the difficulty's minimum (section 4); the player chooses when to stop.

### Step 4. Lift with tape

A strip of lifting tape lays over the print with air bubbles under it. The player rubs over the tape (same drag or keys) to press it down; each rubbed patch flattens. Bubbles left in place leave holes in the lift. **Peel and mount** is available at any time; the lift is shown on a backing card: a white card for black powders, a black card for silver, as examiners do, so the print reads with strong contrast.

### Step 5. Compare and identify

The lift card sits on the left. First the player classifies the pattern: **Loop**, **Whorl** or **Arch**, each button with a small diagram and a one-line description ("Loop: ridges enter and leave on the same side; one delta"). A wrong answer gives a reason ("A whorl has two deltas. Count the triangles where ridges meet.") and a retry; a right one marks the core and delta(s) on the card.

Then two or three reference cards appear on the right, labelled with names (section 4 says where they come from). The player picks the one that matches. On a correct pick, lines join four or five matching minutiae on both cards and the text reads "Match: ridge detail agrees at the core and both deltas." A wrong pick says where it disagrees ("The ridges split above the core on the reference; on your lift they end.") and allows another try. **Log as unidentified** skips the step.

The sample is saved either way. An identified sample is listed under the person's name; an unidentified one is listed by where it came from ("Print from Mug, loop, 88%"). This matters at the reader (section 7), where the player chooses which lift to present.

## 3. A print that reads as a fingerprint

No new art. The only fingerprint art in `assets/objects` is `fingerprint.png` (about 20 px) and `fingerprint_small.png`, used for the in-world overlay icon; both stay as they are. Every print, reference card and thumbnail is drawn procedurally by one pure module, `minigames/dusting/fingerprint-generator.js`, which runs in the browser and in node tests.

### Method: orientation field plus Gabor ridge growth

This is the standard way synthetic prints are made (it is the idea behind SFinGe), cut down to what a 128 px canvas needs.

1. **Singular points by pattern.** A *loop* has one core and one delta below and to one side; the side (left or right slant) comes from the seed. A *whorl* has two cores close together (or one core with a near-circular field) and two deltas, one either side. An *arch* has none.
2. **Orientation field** with the zero-pole model: at each pixel `theta = theta0 + 1/2 * (sum of arg(z - delta) - sum of arg(z - core))` (flip the sign if the result rotates the wrong way; check by eye). For an arch use a smooth field such as `theta = atan(k * (x - cx)/w * exp(-((y - cy)/h)^2))`, so ridges rise into a hump and run out at both sides.
3. **Ridges.** Start from seeded white noise and run 6–8 passes of a Gabor filter aligned with the local orientation (ridge period about 5 px at 128 px, 7x7 kernel), normalising after each pass. The ridges organise themselves along the field and produce real-looking endings and forks where they meet. Finish with a soft threshold (`0.5 + 0.5 * tanh(4v)`), so `ridges[i]` is 0..1.
4. **Print mask.** A slightly egg-shaped ellipse (about 0.6 x 0.8 of the canvas, wider at the top), with a soft 4 px edge and low-frequency "pressure" noise so the print fades unevenly as a real touch does. A *variant* may cut the mask with a straight line (a partial print) and rotate and offset the whole print.
5. **Minutiae.** Binarise the ridges inside the mask, thin them (Zhang-Suen), and take the crossing number: 1 is a ridge ending, 3 a bifurcation. Drop points within 6 px of the mask edge. These are the dots the compare step joins up.

Cost at 128x128 is a few million multiply-adds: well under 100 ms. The minigame caches each generated print by `(owner, pattern, variant)`.

### Identity

- The seed is a 32-bit FNV-1a hash of the owner string, so **the same person has the same print everywhere**: on Vance's panel in m04, on his record card, and in any later mission.
- The pattern comes from the same hash, in roughly real proportions (about 60% loops, 32% whorls, 8% arches), unless the scenario sets `fingerprintPattern`.
- The *variant* (rotation within ±20°, offset, partial cut) comes from the object id, so two surfaces carrying the same person's print look like two different touches of the same finger.

### API (contract for the tasks in section 10)

```js
// minigames/dusting/fingerprint-generator.js  (pure; no DOM except drawPrint)
export const PATTERNS = ['loop', 'whorl', 'arch'];
export function hashString(str)                     // -> uint32 (FNV-1a)
export function mulberry32(seed)                    // -> () => float in [0,1)
export function patternForOwner(owner)              // -> 'loop' | 'whorl' | 'arch'
export function generatePrint({ owner, pattern, size = 128, variant = null, partial = false })
//   -> { size, owner, pattern, ridges: Float32Array(size*size) 0..1,
//        mask: Float32Array(size*size) 0..1, cores: [{x,y}], deltas: [{x,y}],
//        minutiae: [{x, y, type: 'ending' | 'bifurcation'}], bounds: {x, y, w, h} }
export function drawPrint(ctx, print, { x = 0, y = 0, scale = 1, ink = '#1b1b1b',
                                        background = null, alpha = null })
//   draws ridges*mask as pixels (alpha may be a Float32Array to show partial development)
```

### Art slots (optional PixelLab art, procedural fallback)

The user approved PixelLab art, to be generated one image at a time with the user. The minigame must work fully without any of it: each slot has a procedural fallback, and a missing file is normal, not an error. The prints themselves always stay procedural.

All slots live in `public/break_escape/assets/mini-games/fingerprint/` and are listed in one manifest, `minigames/dusting/art-slots.js`. That module exports `ART_SLOTS` (id, file, size, fallback name) and `loadArt()`, which starts every image load in parallel, resolves to `{ [id]: HTMLImageElement | null }`, and never waits longer than 1.5 s. Every draw call checks the slot and falls back if it is null. Images draw with smoothing off at an integer scale.

| Slot id | File | Size (px) | Intended look | Fallback |
|---|---|---|---|---|
| `surface_glossy_light` | `surface_glossy_light.png` | 128x128 | Close-up of white glazed ceramic (a mug's side): faint curved highlight, tiny glaze speckle. No print, no text. | flat off-white with a soft gradient highlight and seeded speckle |
| `surface_glossy_dark` | `surface_glossy_dark.png` | 128x128 | Close-up of a black terminal bezel or screen glass: a diagonal reflection streak, a hint of bevel at one edge. | near-black with a diagonal lighter band |
| `surface_textured` | `surface_textured.png` | 128x128 | Close-up of moulded dark-grey plastic (keypad housing): fine stipple texture, one key edge. | mid-grey with seeded 1 px stipple |
| `powder_black` | `powder_black.png` | 32x32 | Small screw-top jar of black powder, label band. | CSS swatch button with text |
| `powder_silver` | `powder_silver.png` | 32x32 | Same jar, silver-grey powder. | CSS swatch |
| `powder_magnetic` | `powder_magnetic.png` | 32x32 | Same jar, dark powder, a small magnet icon on the label. | CSS swatch |
| `brush_fine` | `brush_fine.png` | 32x32 | Slim fibreglass brush, diagonal. Also used as the cursor while dusting. | drawn circle reticle |
| `brush_broad` | `brush_broad.png` | 32x32 | Feather duster brush, diagonal. | drawn circle reticle |
| `wand_magnetic` | `wand_magnetic.png` | 32x32 | Magnetic wand (pen-like, ball of powder at the tip). | drawn circle reticle |
| `tape_roll` | `tape_roll.png` | 32x32 | Roll of clear lifting tape with a pull tab. | text button |
| `card_white` | `card_white.png` | 144x176 | White lift backing card: a thin printed border, two ruled label lines at the bottom ("CASE / DATE"). | drawn white card with grey border and lines |
| `card_black` | `card_black.png` | 144x176 | Same card in matt black with light lines (for silver lifts). | drawn black card |

The tape strip over the print stays procedural (its bubbles are game state).

## 4. Fun and educational, not hard

**Direction from the user (2026-10-01), which overrides earlier drafts:** the minigame should be fun and educational, not difficult. Where it asks for skill, the skill must be enjoyable in itself, never a grind or a test of a steady hand. Concretely:

- Careful, ordinary play reliably gives a good lift on the first or second go.
- A wrong powder teaches rather than punishes: the print shows faint, a line says why, and the lift is still usable.
- Over-brushing is gentle and recoverable: fog builds slowly, and **Puff off excess** clears it.
- Lift quality is generous enough that no mission lock feels like a wall.
- The "aha" moments stay: the print appearing ridge by ridge, the peel, the pattern match.

Rules that hold at every difficulty:

- **Nothing ends the attempt.** No fail state, no timer, no lockout. A surface can always be dusted again until it yields an excellent lift (85% or better), after which it behaves as an ordinary object.
- **Every loss is visible and fixable before it is locked in.** Fog shows on the canvas and in the Clarity meter, and Puff removes it; bubbles show on the tape before peeling; a wrong powder shows as a faint print with an explanation, and Change powder is one click.
- **The best lift of a person is kept.** A worse second attempt never replaces a better first one.

### Dusting model (`minigames/dusting/dusting-model.js`, pure)

The canvas is a 128x128 logical grid. A `DustField` holds `P[i]`, the powder passes each pixel has received, and `FP[i]`, fog passes (powder weighted by the tool's fog rate).

- A brush tick at `(cx, cy)` adds `strength * (1 - (d/r)^2)` to every pixel within radius `r`. Pointer moves are interpolated so a fast stroke leaves no gaps, and ticks are capped at 30 per second.
- **Reveal:** `v = 1 - exp(-P)`.
- **Fog (gentle):** `f = clamp((FP - Pfog) / 16, 0, 0.35)`, with `Pfog` 6 by default. Fog appears only after about twice the passes a clean reveal needs, grows slowly, and is capped.
- **Puff off excess** (button, or `X`): within radius 18 of the reticle or pointer, `P` and `FP` above 2.5 are halved towards 2.5. Real examiners tap or gently blow off loose powder; here it undoes over-brushing without losing developed ridges.
- **Drawn powder density** at a pixel: `ridge * mask * v * 0.95 * residue + f * 0.85 + (1 - ridge * mask) * v * 0.08`, tinted with the powder colour over the surface. Ridges emerge first, then furrows haze as fog rises.
- **Coverage** = share of mask pixels (`mask > 0.5`) with `v > 0.7`.
- **Clarity** = `min(1, raw / 0.8)`, where `raw` is the mean, over ridge pixels in the mask, of `clamp(v - f, 0, 1)`. Developing 80% of the ridges cleanly counts as full clarity: nobody has to chase the last corner.

| Tool | Radius | Strength per tick | Fog rate |
|---|---|---|---|
| Fine brush | 5 | 0.35 | 1x |
| Broad brush | 11 | 0.5 | 1.2x |
| Magnetic wand | 8 | 0.4 | 0.5x |

**Lift quality:**

```
contrast  = 1.0 if powder suits the surface, 0.95 magnetic on a smooth surface, else 0.85
tape      = 0.85 + 0.15 * tapeCoverage              (tapeCoverage = flattened share of an 8x8 bubble grid)
quality   = clamp(0.25 + 0.75 * clarity * contrast * tape, 0, 0.99), rounded to 2 dp
```

Targets the tests pin down:

| Play | Quality |
|---|---|
| Even careful dusting (`P = 3` over the mask), right powder, full tape | ≥ 0.95 |
| "Ordinary" play: a simulated player brushing random strokes over 85% of the print, `P` between 1.5 and 6, right powder, tape 80% pressed | ≥ 0.88 |
| Over-brushed (`P = 12` everywhere), no puff | 0.75–0.9 |
| Over-brushed, then one puff pass over the print | ≥ 0.9 |
| Careful, wrong powder, full tape | ≥ 0.8 |
| Minimum lift (coverage just at the threshold, clean, right powder, full tape) at every difficulty | ≥ 0.6 |

So a default (0.4) reader always opens on the first lift, a 0.75 reader opens for any ordinary attempt, and even a 0.9 reader opens for careful play without special steadiness. Mission authors should treat **0.8 as the strictest sensible threshold**; `biometric_breach`'s 0.9 doors are lowered to 0.8 as part of this work. The rating labels stay as the biometrics panel already uses them (Perfect ≥ 95, Excellent ≥ 85, Good ≥ 75, Fair ≥ 60, Acceptable ≥ 40, Poor).

### Wrong powder: teach, don't punish

When the chosen powder doesn't suit the surface, the ridges develop at lower contrast (silver on white ceramic looks pale grey on pale), and once the player has brushed a little the foot line changes to a specific reason: "Silver on white ceramic: low contrast. Black powder would show these ridges better." Change powder stays one click, wipes the surface, and the step keeps no record of the mistake. Carrying on still gives a usable lift (≥ 0.8 when careful).

### Difficulty (`fingerprintDifficulty`, kept)

Difficulty changes how much there is to look at, not how punishing it is.

| | easy | medium (default) | hard |
|---|---|---|---|
| Find step | faint smudge visible without the torch | torch only | torch only, smaller sheen |
| Print | full, residue strong | may be partial | partial, residue a little weaker (0.9) |
| `Pfog` | 7 | 6 | 5 |
| Coverage needed to lift | 40% | 45% | 55% |
| References in compare step | 2, the decoy of a different pattern | 3, one decoy shares the pattern | 3, all share the pattern |

### Where reference prints come from

The kit "pulls enrolment records" for people on site. Candidates are, in order: the scenario's `fingerprintCandidates` on the object if set; otherwise NPC display names from the scenario (`window.npcManager.npcs`), excluding the owner; otherwise "Reference B" and "Reference C". Each decoy's print is generated from its own name, then its pattern is forced to suit the difficulty table. Decoys are drawn full and upright; the lift is the rotated, maybe partial touch, which is what makes the comparison a small piece of looking rather than a spot-the-identical-image.

### Why this is better than the counter

The player now makes four small, satisfying choices: where to look, which powder, when the print is developed enough, and whose print it is. Each has visible feedback and an explanation, and none of them can strand the player or punish a shaky hand. Ordinary play lands in the Good-to-Excellent band; care lifts it to Excellent or Perfect.

## 5. Accessibility

- **Keyboard throughout.** Every button is a real `<button>` in tab order. On the canvas, the arrow keys move a visible reticle (4 logical px per press, 12 with Shift) and Space or Enter acts: mark the print, brush, press the tape. Holding Space repeats at the brush tick rate. `1`/`2`/`3` pick powders, `F`/`B` pick brushes, `L` lifts, `P` peels when those are enabled.
- **Pointer events**, not mouse events, so mouse, touch and pen all work, with pointer capture so a stroke that leaves the canvas doesn't stick.
- **Colour is never the only signal.** Meters show numbers and a word ("Clarity 82%: good"); the powder choice is labelled in text; the lift card's pattern markers have shapes (circle for a core, triangle for a delta), matching examiner notation.
- **High-contrast toggle** (remembered in `localStorage`, wrapped in try/catch): draws developed ridges in pure black or white and outlines the mask, for players who struggle to see grey on grey.
- **Steady-hand assist toggle**: no fog at all. With the gentler model it is rarely needed, but it is there for players who find dragging hard.
- **Screen readers.** The canvas has `role="img"` and an `aria-label` that updates with the step ("Print about 60% developed; the lower half is still faint"). An `aria-live="polite"` line announces step changes, meter bands (every 25%), and compare results. Pattern buttons carry their full description in text.
- **Reduced motion.** With `prefers-reduced-motion`, no dust particles and no scan animation; the result appears at once.
- **Sizing.** The canvas scales to fit the overlay (integer scale factor where possible, so pixels stay square) and works at a 360 px wide viewport; buttons are at least 40 px tall.
- **Test bridge.** `getTestState()` returns the step, meters, reticle position, enabled controls, and the compare candidates, so the playtest skill can drive it by keys and clicks alone. A `debug` field carries the expected pattern and candidate index for automated runs.

## 6. Samples: shape, persistence and the reload fix

### Sample shape

```js
{
  id: 'fp_robert_vance',          // stable per owner: one sample per person
  type: 'fingerprint',
  owner: 'Robert Vance',          // the scenario's fingerprintOwner, unchanged; locks match on this
  ownerId: 'robert_vance',        // slug: lowercase, non-alphanumerics to '_' (used in event names)
  ownerName: 'Robert Vance',      // display: fingerprintOwnerName, else NPC displayName, else humanised owner
  quality: 0.91, rating: 'Excellent',
  pattern: 'loop',
  identified: true,               // player matched it in the compare step
  sourceObjectId: 'hall1_round_panel', sourceRoomId: 'battery_hall_1',
  sourceName: 'Duty Round Panel', surface: 'glossy_dark',
  collectedAt: '2026-10-01T12:00:00Z'
}
```

Old samples (`{owner, quality, rating, data, timestamp}`) are normalised on read, so nothing that already holds one breaks.

### One module owns them: `systems/biometric-samples.js`

- `ownerSlug(owner)`, `displayNameForOwner(owner, scenarioData)`, `normaliseSample(raw)`.
- `addBiometricSample(sample)` merges by `owner`: keep the higher quality, OR the `identified` flags, keep the earliest `collectedAt`. Updates the panel and count, then calls `window.stateSync?.sync()` at once, so a reload straight after a lift keeps it.
- `restoreBiometricSamples(saved)` merges saved samples into `window.gameState.biometricSamples` on load.
- `bestLiftFromObject(objectId)` returns the best sample lifted from that surface, if any. A surface stops intercepting interactions once its best lift is 0.85 or better.
- Emits `fingerprint_collected:<ownerId>` with `{owner, ownerId, ownerName, objectId, roomId, quality, identified}` on every lift, and `fingerprint_identified:<ownerId>` the first time a person's print is identified (W3). The base class still fires `minigame_completed {minigameName: 'DustingMinigame'}`, so m04's and m05's existing mappings keep working.
- Exposed on `window` (`addBiometricSample`, `restoreBiometricSamples`, `getBiometricSamples`) for the panel and the reader.

### Server

- `sync_state` accepts `biometricSamples` (an array). `Game#merge_biometric_samples!` keeps only the known keys above, clamps `quality` to 0..1, merges by `owner` with the same rules as the client, caps the list at 50, and **drops any sample whose `owner` is not a `fingerprintOwner` somewhere in `scenario_data`**, so a hand-crafted request can't invent a print the mission doesn't contain. `add_biometric_sample!` is reimplemented on top of it.
- The scenario payload returns `savedBiometricSamples` next to `savedNotes`.
- `StateSync#buildPayload` sends the samples' plain fields. `core/game.js` calls `window.restoreBiometricSamples(gameScenario.savedBiometricSamples)` beside the notes restore.

This closes W1: after a reload the samples, their qualities and their identified state come back, and the reader opens with them. `vance_print_collected` and `torres_print_collected` become safe to read, although m04 and m05 don't need to change.

## 7. How biometric locks consume samples

### The reader overlay (`minigames/biometrics/fingerprint-reader-minigame.js`)

A real reader doesn't care what the player calls a print; it checks the finger. So the lock decision stays the same (`sample.owner === requires` and `quality >= threshold`), and the player's job at the door is **choosing which lift to present**:

1. **No fingerprint samples:** no overlay. One alert: "This reader needs a fingerprint. You haven't lifted any prints yet." (Fires once per attempt; see W5.)
2. **Otherwise** a small overlay shows the door sign (or the object's name), then one card per lift: a thumbnail drawn by the generator, the label (`ownerName` if identified, else "Print from Mug, loop"), and quality. The player picks one. A short scan-line animation runs over the thumbnail (skipped under reduced motion), then:
   - **Match, quality enough:** "Accepted." The overlay closes and the caller unlocks as now (`notifyServerUnlock(..., 'biometric')` then `unlockTarget`).
   - **Match, quality too low:** "Partial read. This reader needs 85%; this lift is 64%. A cleaner lift of the same print will do." The overlay stays open.
   - **Wrong person:** "No match. This reader is enrolled to someone else." The overlay stays open.

No lockout, no penalty. Identification earns its keep here: with three lifts in hand, the player who matched them knows which to present, and the one who skipped can still reason from where each lift came from and the door sign ("Cryptography Lead Only" plus Torres' mug).

Events: `biometric_scan` with `{targetType, targetId, result: 'accepted' | 'low_quality' | 'no_match' | 'no_samples', owner}`. (A door-specific failure event belongs to E6 and is not part of this work.)

### Threshold resolution (W4)

`systems/biometric-lock.js` exports a pure `resolveBiometricThreshold(lockable, type)`: `lockable.doorProperties.biometricMatchThreshold` for doors (added in `doors.js` from the room data), then `lockable.scenarioData.biometricMatchThreshold`, then the legacy `lockable.biometricMatchThreshold`, then **0.4**. Values above 1 are treated as percentages. And a pure `evaluateBiometricLock({ requires, threshold, samples, chosenSampleId })` that returns `{ result, sample }`, which the reader and the tests both use.

### Changes to the shared lock code

The `case 'biometric':` block in `unlock-system.js` shrinks to one call, `startFingerprintReader(lockable, type, lockRequirements, onAccepted)`, which owns everything above. That keeps this work's footprint in a file other agents are editing to a single small hunk. `doors.js` gains one field. `interactions.js` gains:

- `if (lockType === 'biometric') return 'fingerprint';` in the door icon switch (W6);
- in the print branch: with no kit, fall through to the normal interaction and show a one-off hint ("There are prints on this. A fingerprint kit could lift them."); with the kit, call `collectFingerprint(sprite)`, which returns `null` (and so falls through) when the surface has already given an excellent lift; skip the branch once when `sprite._bypassFingerprintOnce` is set by the **Use normally** button (W2).

The kit's own panel (`biometrics-minigame.js`) keeps **Search room**, which still highlights print-bearing surfaces, but clicking one now closes the panel and opens the dusting minigame instead of granting a random-quality sample (W7). Its list shows each sample's thumbnail, label, pattern and quality. The dead `startDustingMinigame` copy in `dusting-game.js` is removed (W8).

## 8. Scenario fields

Every existing field keeps its meaning, so m04, m05, `biometric_breach`, `ceo_exfil` and `crypto1_captain_meow` need no edits.

| Field | On | Status | Meaning |
|---|---|---|---|
| `hasFingerprint` | object | kept | The surface carries a latent print. |
| `fingerprintOwner` | object | kept | Whose print. Locks match on this exact string; also seeds the print. |
| `fingerprintDifficulty` | object | kept | `easy` / `medium` / `hard` (section 4). Default `medium`. |
| `fingerprintQuality` | object | **ignored** | Only the removed instant-collection path read it. The validator warns. |
| `lockType: "biometric"` + `requires` | room or object | kept | Reader enrolled to that owner. |
| `biometricMatchThreshold` | room or object | kept, **now honoured on doors** | 0..1 minimum quality. Default 0.4. |
| `fingerprintOwnerName` | object | new, optional | Display name if `fingerprintOwner` is an id ("receptionist"). |
| `fingerprintPattern` | object | new, optional | Force `loop` / `whorl` / `arch` (for a story that names the pattern). |
| `fingerprintSurface` | object | new, optional | `glossy_light` / `glossy_dark` / `textured`. Default from the object type: `pc`, screens, terminals and phones are `glossy_dark`; cups and mugs `glossy_light`; keyboards and keypads `textured`; anything else `glossy_light`. |
| `fingerprintCandidates` | object | new, optional | Array of names to use as compare references in place of NPC names. |

What this means for the two live missions, with no scenario edits:

- **m04, Duty Round Panel** (`type: pc`, easy): a dark terminal bezel, so silver powder is the right call. Vance's pattern comes from his name. Two references in the compare step: Vance and one other m04 NPC of a different pattern. The plant-room door has no threshold, so 0.4 applies.
- **m05, Torres' mug** (`office-misc-cup`, easy): white glazed ceramic, black powder. The vault has no threshold, so 0.4 applies.

The schema (`scripts/scenario-schema.json`) and the validator's known-field list (`scripts/validate_scenario.rb:336`) gain the four new fields and `biometricMatchThreshold` on rooms. Optional follow-ups for the mission owners, not part of this work: key m04/m05's "that's his print" texts on `fingerprint_collected:robert_vance` / `fingerprint_collected:david_torres` and drop the "prints are not saved" comments.

## 9. Forensic tie-in

Light touch: one line at the foot of the overlay per step, never a modal, never required reading. Each is true as stated.

| Step | Line |
|---|---|
| Find | "Latent prints are left by sweat and skin oils. A light held low across the surface makes the residue catch the light." |
| Powder | "Powder sticks to that residue. Examiners pick a powder that contrasts with the surface: dark on pale, light on dark, magnetic on textured plastic." |
| Dust | "Over-brushing fills the furrows between ridges and destroys the detail. Less is more." |
| Lift | "Lifting tape moves the powdered print onto a backing card, so it can be kept as evidence." |
| Compare | "About 60–65% of prints are loops, 30–35% whorls and around 5% arches. Examiners compare minutiae: where ridges end or split." Then, on a match: "England and Wales dropped the fixed 16-point standard in 2001; examiners now judge the whole comparison." |
| Reader | "Many fingerprint readers can be fooled by a lifted print. In 2013 the Chaos Computer Club unlocked an iPhone 5s Touch ID with a fingerprint photographed from a glass surface." |

The kit's panel gets a short "Field notes" fold with the three pattern diagrams, so a player can look them up. No HacktivityLabSheets page is needed; E1's "no field guide" item stays optional.

## 10. Implementation tasks

Four build tasks and a playtest. T1 and T2 touch disjoint files and run in parallel; T3 and T4 follow T1 (and T4 also T2) and run in parallel with each other. Other agents are editing `npc-manager.js`, the phone-chat code, `interactions.js`, the RFID and dual-auth minigames, `unlock-system.js` and `app/` at the same time: re-read a shared file immediately before each edit, keep hunks small, never reformat. Nobody commits. Nobody touches `.claude/skills`.

### Contract between T3 and T2: the dusting result

`DustingMinigame` completes with `complete(true, result)` only on a peel-and-mount, where `result` is
`{ quality, rating, pattern, identified, surface, powder, objectId, roomId }`. Closing early completes with `success = false` and `result = { cancelled: true }`; **Use normally** completes with `success = false` and `result = { cancelled: true, useNormally: true }`. The caller (`biometrics.js`, T2) builds and stores the sample, emits the events and shows the toast; on `useNormally` it sets `sprite._bypassFingerprintOnce = true` and calls `window.handleObjectInteraction(sprite)` on the next tick. No toast on a cancel.

### T1. Generator and dusting model (pure modules)

Files (new): `public/break_escape/js/minigames/dusting/fingerprint-generator.js`, `public/break_escape/js/minigames/dusting/dusting-model.js`, `test/js/fingerprint-generator.test.mjs`, `test/js/dusting-model.test.mjs`. Also a throwaway preview page `public/break_escape/test-fingerprint-preview.html` (served by the existing `test-*` route) that draws one print of each pattern at 4x with two variants, plus a dusted-and-fogged example.

`dusting-model.js` exports `SURFACES`, `POWDERS`, `TOOLS`, `DIFFICULTY`, `surfaceForObject(scenarioData)`, `class DustField { constructor(size, {pfog, fogRate}); brush(cx, cy, tool); brushLine(x0, y0, x1, y1, tool); reveal(i); fog(i); metrics(print) -> {coverage, clarity} }`, `class TapeGrid { constructor(n = 8); press(cx, cy, radius, bounds); coverage() }`, `contrastFactor(powder, surface)`, `liftQuality({clarity, contrast, tapeCoverage})`, `ratingFor(quality)`.

Acceptance:
- `node test/js/fingerprint-generator.test.mjs` passes: same inputs give identical `ridges`; different owners differ (pixel correlation below 0.5 inside the mask); a loop has 1 core and 1 delta, a whorl 2 and 2 (or 1 core and 2 deltas), an arch 0 and 0; ridge share inside the mask is 0.35–0.65; at least 8 minutiae inside the mask; `patternForOwner` over 2,000 random names lands within ±8 points of 60/32/8; `generatePrint` at 128 runs in under 150 ms in node.
- `node test/js/dusting-model.test.mjs` passes every row of the section 4 targets table (including the simulated ordinary player and the puff recovery), plus: `puff(cx, cy)` lowers fog without dropping coverage; `brushLine` leaves no gaps on a 40 px stroke; `contrastFactor` table; `surfaceForObject` maps `pc` to `glossy_dark`, `office-misc-cup` to `glossy_light`, `keyboard` to `textured`, and honours `fingerprintSurface`.
- A screenshot of the preview page (Playwright, saved under the scratchpad) shows three clearly different, fingerprint-looking patterns. The reviewer looks at it before T3 starts.

### T2. Samples, persistence, threshold and lock logic

Files: new `public/break_escape/js/systems/biometric-samples.js`, new `public/break_escape/js/systems/biometric-lock.js`, rewrite `public/break_escape/js/systems/biometrics.js` (keep its exports and `window` globals); small hunks in `public/break_escape/js/state-sync.js`, `public/break_escape/js/core/game.js` (restore beside `savedNotes`), `public/break_escape/js/systems/doors.js` (one `biometricMatchThreshold` field in `doorProperties`), `app/models/break_escape/game.rb` (`merge_biometric_samples!`), `app/controllers/break_escape/games_controller.rb` (`sync_state` param; `savedBiometricSamples` in the scenario payload); `scripts/scenario-schema.json` and `scripts/validate_scenario.rb` (new fields; warn on `fingerprintQuality`). Tests: new `test/js/biometric-samples.test.mjs`, new `test/js/biometric-lock.test.mjs`, a new Rails test in `test/controllers/break_escape/` (or added to `reload_persistence_test.rb`).

Acceptance:
- Node tests: slug and display name rules; merge keeps the best quality and ORs `identified`; legacy samples normalise; `resolveBiometricThreshold` prefers door props, then scenarioData, then legacy, then 0.4, and handles percentages; `evaluateBiometricLock` returns `accepted` / `low_quality` / `no_match` / `no_samples` correctly.
- Rails: `sync_state` with two samples for the same owner stores one with the higher quality; an owner not in the scenario is dropped; unknown keys are stripped; `GET scenario` returns `savedBiometricSamples`.
- `biometrics.js` builds the sample from the T3 result contract, calls `addBiometricSample`, emits `fingerprint_collected:<ownerId>` and (first time) `fingerprint_identified:<ownerId>`, and handles `useNormally`. `collectFingerprint(sprite)` returns `null` without an alert when `bestLiftFromObject` is 0.85 or better.
- `ruby scripts/validate_scenario.rb` on m04 and m05 reports no new errors or warnings.
- Full node and Rails suites still pass.

### T3. The dusting minigame

Files: new `public/break_escape/js/minigames/dusting/art-slots.js` (section 3, art slots); rewrite `public/break_escape/js/minigames/dusting/dusting-game.js` (keep the class name `DustingMinigame` and its registration as `'dusting'`; delete the stale `startDustingMinigame` at the bottom), rewrite `public/break_escape/css/dusting.css`. Add a generic `drag(selector, points, {stepMs})` action to `public/break_escape/js/systems/test-bridge/minigames.js` that dispatches real pointer events, and document it, with a short "Fingerprint dusting" note, in `docs/test-bridge.md`.

Acceptance:
- All six screens of section 2 (examine, find, powder, dust, lift, compare) work by mouse **and** by keyboard alone; each step's forensic line shows; Puff off excess works; the wrong-powder line appears.
- With no files in `assets/mini-games/fingerprint/`, every screen draws its procedural fallback with no console errors beyond the 404s; dropping a test PNG into one slot makes it appear.
- One canvas, 128 logical px, scaled by an integer with `image-rendering: pixelated`; no per-cell DOM. Brushing stays smooth (no frame over 16 ms from the model on a mid laptop).
- `getTestState()` returns `{ step, coverage, clarity, tapeCoverage, qualityEstimate, reticle, powder, tool, candidates: [{index, label}], debug: { pattern, correctCandidate, printCentre } }` on top of the base fields.
- Completes with exactly the T2 result contract.
- High-contrast, steady-hand and reduced-motion behave as section 5 says; an `aria-live` region announces steps.
- Visual check: a Playwright screenshot of each step, saved to the scratchpad, reviewed before sign-off.

### T4. Reader overlay, kit panel, and the shared-file hunks

Files: new `public/break_escape/js/minigames/biometrics/fingerprint-reader-minigame.js` (registered as `'fingerprint-reader'` in `minigames/index.js`, exported `startFingerprintReader`), CSS appended to `public/break_escape/css/biometrics-minigame.css`; rework `public/break_escape/js/minigames/biometrics/biometrics-minigame.js` (Search room opens dusting; sample list with thumbnails; Field notes fold; remove the random-quality collection and its local lockout code). Shared hunks: `unlock-system.js` biometric case becomes the `startFingerprintReader` call; `interactions.js` door icon line and the print-branch change of section 7.

Acceptance:
- The four reader outcomes of section 7 occur as described, each alert once per attempt, with display names, never raw ids.
- A door with `biometricMatchThreshold: 0.9` rejects a 0.85 lift and accepts a 0.92 one (check with `biometric_breach` or a test fixture).
- With no kit, a print-bearing object runs its normal interaction and shows the hint once. With the kit, **Use normally** runs the normal interaction.
- A biometric door shows the fingerprint icon.
- `git diff` of `unlock-system.js` and `interactions.js` shows only the intended hunks.

### T5. Playtest (Sonnet, browser, keyless :3001)

Follow `.claude/skills/playtest-scenario/SKILL.md`, creating games with `PLAYTEST_PORT=3001`.

- **m04:** pick up the kit from the OptiGrid case, find and dust the Duty Round Panel by keyboard (silver powder), lift, identify Vance, **reload the page**, confirm the sample is still in the kit panel, then open the plant-room door through the reader. Also check: the door shows the fingerprint icon; trying the door before the lift gives the "no prints" line once.
- **m05:** dust Torres' mug (black powder), choose the wrong reference once, then the right one, reload, open the data-centre vault. Also check the wrong-powder path gives a lower but usable lift, and that the m05 HaX "That's Torres' print" text still arrives.
- Report session log paths, the verifier output, screenshots of each dusting step, and anything that read as confusing.

## 11. Decisions for the user

- **Art.** Everything above is procedural. Optional extras that would need image generation (and so the user's go-ahead): surface close-ups for the find step (ceramic, bezel, keypad), and pixel-art jars, brushes and tape for the kit tray. Pixellab at 128x128 would fit. The procedural version stands on its own without them.
- **Lockout.** The old panel had a three-strikes reader lockout that nothing used. This plan has none. A mission that wants pressure could add it per lock later.
- **m04/m05 follow-ups.** Re-key "that's his print" texts on `fingerprint_collected:<ownerId>` and remove the "prints are not saved" comments. Not required for them to keep working.
- **`biometric_breach`'s 0.9 locks** become passable with careful dusting. If that scenario is meant to be hard, that is now real difficulty rather than a wall.
