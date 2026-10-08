# Room lighting: design and round log

Started 2026-10-08. Request: lighting effects, a dark-room setting where lights come on when you walk in (motion sensor), optional fluorescent flicker, and rooms with NPCs lit when they load. Five rounds of design, implement, review. Example scenario: m02 (Tesseract had someone else's uncommitted edits).

## How it works

- `public/break_escape/js/systems/lighting.js`. A RenderTexture light map with MULTIPLY blend sits at `LIGHT_DEPTH` (100000, in `utils/constants.js`), anchored in world space with a 64 px margin so it never lags the camera.
- Each frame: fill white, fill each visible room with its ambient colour (dark → lit by the room's light level), then add lights with ADD blend: ceiling panels on a 4-tile grid, light spilling through open doors from a brighter room, glows from objects matched by texture key (`EMITTERS`), extra lights from the room config, and the player's phone torch in a dark room.
- A second layer of ADD sprites above the light map gives emitters a glow, plus blinking status LEDs on racks.
- Overlays that must stay readable (talk icons, bark icons, interaction markers, health bars, damage numbers, the screen flash) use `overlayDepth()` from `utils/constants.js`, which lifts them above the light map only when lighting is on.
- Opt-in per scenario (`"lighting": { "enabled": true }`); per-room config documented at the top of `lighting.js`. Players can turn it off with `?lighting=off` or `localStorage.breakEscapeLighting = 'off'`.

## Decisions (overrule any of these)

- Light map rather than Phaser's Light2D pipeline: no pipeline change on every sprite, works with the Canvas renderer, picks up NPCs and late-added objects for free. Light2D only pays off with normal maps, which we don't have.
- Stayed on Phaser 3.60. Worked round 3.60's `DynamicTexture.fill()` bug (clips rects when the texture is larger than the canvas) by stamping a white block instead.
- Motion rooms stay lit once triggered unless the room sets `offAfter`.
- "Room has NPCs" counts only people standing in the room: not phone contacts, not `initiallyHidden` cutscene characters (m02's reception holds three of those).
- NPCs trip motion sensors too.
- m02 is a night shift, so its lit rooms use a dimmer night ambient (`#b8bfce`); the engine default (`#c4cad8`) is lighter.
- The strike sound is synthesised with WebAudio (a filtered click per tube, a short hum when it settles), at the effects volume; no new asset.

## m02 room modes

On (people in them, or default): reception, ward, IT, Dr Kim's office, conference room, office corridor. Motion: server room (darker night ambient), emergency storage (faulty panel), security office, staff room, ward hall, ward vestibule (faulty panel), ward approach.

## Round log

- **Round 1**: system, m02 config. Dark rooms looked right first time; lit rooms indistinguishable from no lighting. Found and fixed the 3.60 fill clip.
- **Round 2**: lit-room contrast, door spill, strike sound, rack LEDs, more emitters (storage array, tape library, UPS, power/suppression panels). Strike captured frame by frame: staggered tubes with dropouts, as intended.
- **Round 3**: phone-torch beam that follows facing, NPC motion trigger, NPC filter, vitals monitors and X-ray lightboxes, night ambient for m02, overlays lifted above the light map.
- **Round 4**: rooms drawn brightest first, so a dark room's fill covers bleed from a lit neighbour; torch beam cut short at the wall it faces. Performance: the first build cost 12 ms a frame in headless Chromium (software WebGL, load ~13); batching every draw into one `beginDraw`/`endDraw`, a half-resolution map and a 30 Hz redraw brought the CPU side to 0.5 ms. Headless frame rate was still 38 with lighting against 60 without, but that is CPU-emulated WebGL on a loaded machine; not yet measured on a real GPU. Validator and schema accept `lighting`.
- **Round 5**: flash safety and fallbacks. The strike is now two flashes per tube and the faulty panel one or two short dips to 55% every few seconds (was rapid random toggling to 15%, which broke WCAG's three-flashes-a-second limit). `prefers-reduced-motion` gives a 400 ms fade and no flicker. Lighting turns itself off on the Canvas renderer, which can't tint. Final tour of all 13 m02 rooms, dark and lit; talk icons stay bright in a dark room.

- **Fix (after round 5, user report)**: a room's map overlaps the room to its south by two tiles, the south room's back wall. A dark room to the north was drawn over that strip, so opening a door north into a dark room darkened the wall of the lit room the player stood in. Each room's fill now leaves out any part of a room further south (`fillAreas`, rectangle subtraction, cached until a room loads). In m02 every north–south pair overlaps by exactly 64 px.

## Checks run

- node `test/js/`: 363 pass, 1 fail (`engine-fixes-pass3`), which fails identically at HEAD in a clean worktree and passes when run alone. `examine-minigame` needed `overlayDepth` added to its constants stub.
- `bin/rails test`: 510 runs, 0 failures.
- `validate_scenario.rb` on m02: schema passes, no lighting warnings.
- Browser: headless screenshots on :3001 each round (games 1753–1760, all rooms unlocked in the database for the tours). No full m02 playtest was run; lighting doesn't touch ink, locks or tasks.

## Reuse across missions

- Skill: `.claude/skills/mission-room-lighting/SKILL.md`. Lookup: `ruby scripts/lighting_lookup.rb <scenario.json.erb | room_type | --all>` lists every other scenario that lit the same room type, and the map's light sources (and light-looking objects missing from `EMITTERS`). Visual tour: `tools/playtest/lighting-tour.sh <mission> <out_dir>` (uses `tools/playtest/unlock-all-rooms.rb` on its throwaway game).
- 2026-10-08: `security_monitor` added to the screen emitters (the lookup's first real find).

## Known limits

- Light passes through walls into the neighbouring room (torch, panels near a wall). Spill into the void is invisible.
- Emitter glows and LEDs draw above everything, so an NPC walking in front of a rack shows its LEDs on top.
- Torch light still crosses a side wall when the beam points along it; only the wall it faces is respected.
- Emitters are matched on texture key; a new screen or lamp sprite needs adding to `EMITTERS`.
