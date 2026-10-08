---
name: mission-room-lighting
description: Light a Break Escape mission's rooms with the room lighting system (systems/lighting.js) — which rooms start lit, which are dark until someone walks in (motion sensor), which have a faulty flickering fluorescent, the mission's mood (night shift, day office), extra light sources — then render every room dark and lit and review the screenshots. Starts by looking up whether each room type has already been lit in another mission and reuses that config. Trigger when the user asks to "light this mission", "add lighting", "make the rooms dark", "add motion-sensor lights", "add flicker", "make the server room glow", "the lighting looks wrong", or names a mission and asks about its lights, darkness or atmosphere.
---

# Room lighting

The lighting system is opt-in per scenario. Each room gets an ambient level (dark → lit) on a light map, plus light from ceiling panels, glowing objects (screens, lamps, racks, exit signs, monitors), light spilling through open doors, and the player's phone torch in a dark room. How it works and why: `docs/agents/LIGHTING_LOG.md`. The config reference is the comment at the top of `public/break_escape/js/systems/lighting.js` and the `lighting` entries in `scripts/scenario-schema.json`.

Room config is per scenario room, but the reusable unit is the room **type** (the Tiled map, e.g. `room_hospital_servers`). Size, panel grid, objects and tile coordinates are the same in every mission that uses it. So a lighting block written for one mission usually drops straight into another. Always look first.

## Step 1 — look up what's been lit before

```bash
ruby scripts/lighting_lookup.rb scenarios/<mission>/scenario.json.erb
```

For every room it prints:
- the room type and whether people stand in it (`[people]`);
- the room's own lighting block, if any;
- every other scenario that lights the same room type, and with what;
- the light sources the map places, and objects that look like lights but don't match `EMITTERS`.

`ruby scripts/lighting_lookup.rb <room_type>` looks up one type; `--all` lists every lit room type.

**Reuse rule.** Where another mission lit the same room type in the same role, copy its block as it stands. That includes `lights` tile coordinates, which only make sense for that map. Change it only for a reason you can state, such as a different role (a server room used as a store), people now in it, or a deliberate story beat. Mood (night or day) belongs in the scenario-level `ambient`, not in each room. Then a copied room block stays correct.

## Step 2 — settle the mood

Read the scenario brief and opening (time of day, setting). Pick the scenario-level block:

```json
"lighting": { "enabled": true, "defaultMode": "on", "ambient": "#b8bfce" }
```

| Mood | `ambient` | Used in |
| ---- | --------- | ------- |
| Day office, default | omit (engine default `#c4cad8`) | — |
| Night shift | `#b8bfce` | m02 |

Keep lit rooms readable: below about `#a8b0c0`, the art starts to look muddy. `darkAmbient` defaults to `#101424`; `#0a0f1c` suits server rooms, where the LEDs carry the room.

## Step 3 — choose each room's mode

Rooms with people in them start lit automatically, even in `motion` mode. Phone contacts and `initiallyHidden` cutscene characters don't count as people. NPCs walking in also trip the motion sensor.

- **`on`** (the default; no block needed): anywhere people work, and anywhere the player reads small clues on arrival.
- **`motion`**: empty corridors, stores, plant and server rooms, staff rooms at night, and offices the player breaks into. These play best: dark through the door, then the tubes strike as you walk in.
- **`dark`**: never switches on. Only use it with a reason the player understands (power cut, broken lights), and never for a room whose puzzle needs reading fine detail. The torch is small.
- **`flicker: true`**: one faulty panel. Use it in one or two rooms per mission, for atmosphere (a neglected store, a back corridor). Avoid it in rooms the player spends long in.
- **`offAfter`** (seconds): only when relighting on return is part of the feel. It replays the strike every time.
- **`lights`**: extra light in tile coordinates within the room, e.g. a window or a lamp the map lacks. `{ "x": 5, "y": 4, "color": "#ffd9a0", "radius": 80, "intensity": 0.8 }`.

## Step 4 — light sources the engine doesn't know

If the lookup lists a "light-looking" object that really gives off light, add it to `EMITTERS` in `systems/lighting.js`. Match on texture key: screens are cool blue, lamps warm, racks green with `leds`, alarms red `pulse`. This changes every lit mission, so log it and check one other lit mission still looks right. Leave false positives (magazine racks, cylinder racks) alone.

## Step 5 — validate and render

```bash
ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb --skip-ink --no-graph
tools/playtest/lighting-tour.sh <mission> <scratch>/<mission>-lighting
```

The tour makes a fresh game on the keyless :3001 server and unlocks every room in that game. It writes `<room>-a.png` for every room, plus `<room>-b.png` with the lights on for rooms that start dark. It moves the camera from the console, so it's a visual check, not a playtest. Pass room ids after the out dir to shoot only those.

**Look at every image yourself.** Check:
- **Dark rooms:** the glows read as screens, lamps and LEDs, the doorways are findable, and nothing the player must find is lost in the dark.
- **Lit rooms:** they look like the room, a little moodier, not grey.
- **Faulty-flicker rooms:** they aren't where the main puzzle happens.
- **Neighbours:** a lit room next to a dark one doesn't bleed far through the wall.

To see the strike or the torch, drive a session yourself (`tools/playtest/session-start.sh`, then `enter` a motion room). Take screenshots in quick succession, or call `window.lightingSystem.switchOff('<room>')` then `switchOn('<room>')`.

## Step 6 — record

- Add the mission's room modes and anything new (emitters, a new mood colour) to `docs/agents/LIGHTING_LOG.md`, and the mood to the table above.
- Lighting doesn't touch ink or audio, so no spoken lines change.
- Commit the mission's config on its own. Commit engine edits (`EMITTERS`) separately, first.

## Rules that aren't negotiable

- **Flash safety.** Strikes and flicker are capped at three flashes a second (WCAG 2.3.1) and turn off under `prefers-reduced-motion`. Don't add effects that flash a large area faster, and don't make the faulty dip deeper than `DIP_LEVEL`.
- **Overlays stay above the light map.** Any new marker drawn in the world that must stay readable in the dark (icons, bars, labels) sets its depth through `overlayDepth()` from `utils/constants.js`.
- **WebGL only.** Lighting turns itself off on the Canvas renderer, and players can turn it off with `?lighting=off`. Never make a puzzle need the lighting.

## Known limits

- Light crosses side walls into the next room.
- Glows and LEDs draw over an NPC standing in front of them.
- Emitters match on texture key only, so an object with a scenario `sprite` override is matched on the override.
