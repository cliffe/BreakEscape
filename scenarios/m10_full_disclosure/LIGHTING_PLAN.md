# m10 Full Disclosure: lighting plan and log

Lighting stage after room dressing round 4 (2026-10-22; R4 review "ready for lighting"). Skill: `.claude/skills/mission-room-lighting/`. Brief: `docs/agents/LIGHTING_PASS_BRIEF.md`. Model: `scenarios/m09_digital_archaeology/LIGHTING_PLAN.md` and the m09 entry in `docs/agents/LIGHTING_LOG.md`. Rooms: `ROOM_DRESSING.md` (rounds 1–4). Only the `lighting` blocks in `scenario.json.erb` change: no ink, tags, NPC fields or layout, and no engine change in round 1.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, the Season 1 finale. One night: the raid on Tomb Gamma, a 1962 civil-defence bunker under a Montana ridge, from 01:45 to the 06:00 release. The lighting tells the hour and the place. It carries no clue: every object the player reads is in a room that is lit on arrival or strikes on entry, and nothing depends on lighting (players can turn it off).

- **Night throughout.** The clock objects read "NOW 01:45" at the start and 06:00 at the close (`scenario.json.erb`, `clock_forward_post`); the briefing is at the forward post at night (stage 5 `room_layout.md` §2.1, "Mood. Night, cold, wind on the fence. The vans' interior lights the only warm thing ... the gate end is the gate, its terminal and one sodium lamp"). The 06:00 scene is a cutscene with its own background, not a lit room, so there is no day variant.
- **Each room's own line** (stage 5 §2.2–2.8, "Mood"): the tunnel "Long, damp, caged bulbs; sound carries"; the security office "Fluorescent, low, a wall of monitors"; the workshop "Benches, solder fumes, racks of half-built crackers"; the power room "The oldest room: Bakelite switches, needle dials, a battery room behind mesh"; the server hall "The old command room ... the plotting board along the back wall, racks where the map tables were"; the gallery "A walkway over the core's roof; steel underfoot; slit windows down into it ... silence"; the core "Plain concrete ... The quietest room in the game".
- **Scenario ambient `#b8bfce`**, the night-shift tone m02 set and m09 used. Rooms with their own character set their own lit ambient, all at or above the readability floor (about `#a8b0c0`).
- **One state change worth showing:** the gallery shutter cut in the power room (`gallery_shutter_cut`). The isolator's status lamp follows it. The gate hut's window is dark on `m06_assets_seized` (its sprite already swaps on that global). No power cut or alarm in the story, so no room-wide variants.

## 2. Room modes

People who stand in each room by default (the lookup's `[people]`): the forward post (Netherton, HaX, the team), the security office (the duty guards), the workshop (the workshop guard), the server hall (the two hall guards), the gallery (the lock, monitor and Farah guards), the core (Tesseract). Imran, Asante and Mercer, the tunnel's guard and the power room's people are `initiallyHidden` and revealed by mappings as the player enters (review m9). Every room with standing people is `on`, so the modes don't depend on it.

| Room | Mode | Lit ambient | Dark ambient | Why |
|---|---|---|---|---|
| forward_post (start) | on, `panels: false`, three pools | `#aab2c4` cold | — | An exterior at night: no ceiling, a cold blue yard; the sodium lamp at the gate, the work lamp over the table and the vans' open doors the only warm light |
| blast_tunnel | on, `panels: false` | `#aaaeb8` | — | "Caged bulbs": three of them carry the corridor; a guard post, so lit, but no strip light |
| security_office | on | scenario | — | "Fluorescent, low": the panel grid; the monitor wall glows |
| workshop_floor | on | `#b4b8c4` | — | Strip lights over benches; the bench lamp warm, the cracker rack's LEDs |
| power_room | motion | `#b0b4bc` | `#141a24` | The oldest room, empty at night on a sensor: dark through the door with the load board's lamps, the batteries' LEDs and the bypass box glowing, then the tubes strike. A revealed NPC lights it as the player walks in, which is the look we want |
| server_hall | on | `#a8b0c4` | — | The command room kept low: the console row, the rack LEDs and the backlit plotting board show against it |
| gallery | on, `panels: false` | `#a8aebc` | — | A walkway lit by two caged bulbs and the cold light coming up through the slit windows from the core |
| core | on, `panels: false` | `#b0b2b8` cold grey | — | Bare concrete under two caged bulbs; the key console and the host terminal's screens. The quietest room |

No `dark` rooms and no flicker (the engine's flicker is a ceiling panel, and the one candidate, the tunnel, has none; the player also spends time there with the guard). No NPC torches: the only dim room with a patrol is lit before the player sees it.

## 3. Light sources

No `EMITTERS` change. m10's own props glow through per-room `emitters`. The engine's `/(lamp)/` rule already matches `m10_caged_lamp`, `m10_work_lamp` and `outdoor-lamp` (r 80, 0.9 by default: too strong for a caged bulb, so each room sets it).

| Room | Key | Glow | Why |
|---|---|---|---|
| forward post | room `lights` | sodium `#ffc070`, r 110, 0.75 at tile (16.6, 2.6) | The one lamp at the gate, its pool on the apron and the terminal trestle |
| forward post | room `lights` | `#fff0d0`, r 90, 0.7 at tile (10.0, 6.4) | The work lamp over the folding table |
| forward post | room `lights` | `#ffb060`, r 40, 0.6 at (3.1, 2.9) and (3.6, 6.9) | The vans' open side doors, lit inside |
| forward post | `outdoor-lamp` | `#ffc070`, r 16, 0.8, `above`, offsetY −20 | The sodium head itself |
| forward post | `m10_work_lamp` | `#fff0d0`, r 14, 0.8, `above`, offsetY −20 | The work lamp's head |
| forward post | `m10_field_screen_dark` | intensity 0 | The projection desk is a dark screen |
| forward post | `m10_field_screen` | `#9fd4ff`, r 18, 0.45, screen, `above` | The table screen's countdown |
| forward post | `safetynet_flag_terminal`, `vm-launcher` | `#9fd4ff`, r 18, 0.4, screen, `above` | The gate kit |
| forward post | `m10_gate_post` | variants: `m06_assets_seized` → intensity 0; else `#ffd090`, r 22, 0.6, `above`, offsetX 10, offsetY −10 | The hut's lit window; dark when the post is empty |
| tunnel | `m10_caged_lamp` | `#ffd9a0`, r 56, 0.75 | Three caged bulbs |
| tunnel | `m10_door_panel` | `#ffb040`, r 8, 0.5, `above` | The blast door panel's amber display |
| tunnel | `kettle` | `#ff8a3a`, r 8, 0.5, `above` | The guard post's kettle |
| security | `cctv_monitors` | engine screen | The monitor wall |
| security | `m10_readout_side` | `#ffb040`, r 10, 0.5, `above` | The duty screen |
| security, workshop, power, hall | `fire_alarm_point` | intensity 0 | As m03–m09: a lone red pulse reads as a clue |
| workshop | `office-misc-lamp` | `#ffcf8a`, r 50, 0.7, `above` | The bench lamp |
| workshop | `m10_cracker_rack` | `#6dffb0`, r 20, 0.3, `leds` 0.5 | Half-built crackers with status lights |
| power | `m10_load_board` | `#ffb347`, r 30, 0.45, `leds` 0.3, `ledColor` `#ffb347` | The load board's lamps |
| power | `m10_bypass_panel` | `#7dffa0`, r 8, 0.45, `above` | The refit box's green lamp |
| power | `m10_key_isolator` | variants: `gallery_shutter_cut` → `#ff5040`; else `#7dffa0`; r 8, 0.45, `above` | The isolator's status lamp, by the same global the cut sets |
| power | `aes_battery_rack`, `pnw_batteries` | `#7dffa8`, r 26, 0.3, `leds` 0.5 | The battery room's LEDs behind the mesh |
| power | `m10_caged_lamp` | `#ffd9a0`, r 50, 0.6 | Two bulbs |
| hall | `hq_rack` | `#6dffb0`, r 34, 0.4, blink, `leds` 0.7 | The racks |
| hall | `m10_plotting_board` | `#9fc8ff`, r 60, 0.35, `above` | The perspex board, backlit |
| hall | `m10_readout`, `m10_console_controls` | `#ffb040`, r 10, 0.5, `above` | The console's amber readout and controls |
| hall | `m10_hatch` | `#7dffa0`, r 6, 0.45, `above`, offsetX 6, offsetY 4 | The field kit's link on the hatch |
| hall | `m10_caged_lamp` | `#ffd9a0`, r 50, 0.55 | Four bulbs along the wall |
| gallery | `m10_slit_window` | `#dfe6ee`, r 40, 0.5, `above` | Cold light up through the slits from the core |
| gallery | `m10_door_panel` | `#ffb040`, r 8, 0.5, `above` | The lock panel |
| gallery | `m10_caged_lamp` | `#ffd9a0`, r 50, 0.6 | Two bulbs |
| core | `m10_caged_lamp` | `#ffd9a0`, r 60, 0.7 | The two bulbs |
| core | `m10_key_console` | `#8fb0d0`, r 26, 0.4, screen | His console's screen |
| core | `m10_wall_screen` | `#a0c0e0`, r 24, 0.4, screen, `above` | The file index |
| core | `m10_readout` | `#ffb040`, r 10, 0.5, `above` | The key console's readout |

## 4. Reuse

`ruby scripts/lighting_lookup.rb`: every `room_m10_*` type is new, so no block is copied. Reuse is by role, with no tile coordinates copied: night ambient `#b8bfce` (m02, m09); an exterior with `panels: false` and sodium pools (m09 dock); motion for an empty plant room (m01–m09); dark ambient high enough that doors are findable (m09 open stacks); call points off (m03–m09); `above` for small indicators and desk lamps in lit rooms (m06, m09 lessons); `leds` and `ledColor` on a mission's own rack art (m09).

## 5. What the player sees entering each room

- **Forward post:** a cold blue yard under the rock; warm light spilling from the vans' open doors, the work lamp over the table, and the one sodium lamp over the gate and the blast door; the hut's window lit.
- **Tunnel:** three caged bulbs down a damp corridor, pools between them; the blast door panel's amber and the kettle's light at the post.
- **Security office:** low fluorescent light and a wall of monitors.
- **Workshop:** strip-lit benches, a warm bench lamp, the cracker rack's small lights.
- **Power room:** dark through the door; amber lamps on the load board, green LEDs in the battery bay and on the bypass box; then the tubes strike.
- **Server hall:** a low-lit command room; the plotting board glowing pale blue, rack LEDs down both walls, the console's amber readouts.
- **Gallery:** a dim steel walkway under two bulbs, cold light coming up through the slit windows.
- **Core:** bare concrete under two bulbs; his console's screen, the file index, the amber readout.

## 6. Rounds

### Round 1 (2026-10-22): design review, implement, tour

**Design review:** `LIGHTING_REVIEW_R1.md` (0 blockers, 5 majors, 11 minors, 2 notes; "approve once the five majors are fixed"). All accepted with its values (orchestrator's rulings):

| id | fix as implemented |
|---|---|
| M1 tunnel | ambient `#aeb2bc`; bulbs as small `above` glows (`#ffd9a0`, r 16, 0.8); floor pools as room `lights` at (2.0, 2.6), (5.3, 2.6), (8.1, 2.6), r 56, 0.65 |
| M2 gallery | ambient `#aeb4c2`; the same bulb glow; pools at (3.6, 2.6) and (5.5, 2.6), r 64, 0.55; slit-window glow kept |
| M3 power | the two bulbs at intensity 0 (an emitter doesn't follow a motion room's on/off state; an engine flag is left for later). The load board, batteries and bypass box carry the dark room |
| M4 workshop | its bulb configured: r 18, 0.6, `above` |
| M5 forward | the vans carry their own warm light: emitters on `m10_van1` / `m10_van2`, `#ffb060`, r 30, 0.75, `above`, `floorTint` 0.3, offsets to the doors |
| m1 | van spill on the gravel below each door: (3.1, 3.3) and (2.75, 7.2), r 44, 0.55 |
| m2 | work lamp pool at (9.0, 6.2), r 100; a faint cold light (6.0, 8.8), r 50, 0.3 over the incident file's crate |
| m3 | isolator amber while live, green once cut (`globalVars.gallery_shutter_cut === true`, the condition the cut task uses) |
| m4 | `fire_alarm_point` off in the security office only (the only room that has one) |
| m5 | field kit screens in the hall and core as at the gate (r 18, 0.4, `above`); the hall's schedule terminal green r 16, 0.35 |
| m6 | core bulbs neutral `#ece8dc` (glow r 16, 0.7; pools at (2.3, 2.6) and (6.9, 2.6), r 80, 0.5); core ambient `#aeb2bc` (neutral grey) |
| m7 | plotting board `hueKeep: false`, so its red tape isn't darkened |
| m8 | scenario block `{ "enabled": true, "defaultMode": "on", "ambient": "#b8bfce" }` after `startRoom`; the gate hut list is `[ {condition: "globalVars.m06_assets_seized === true", intensity 0}, {lit window} ]`, the same condition as its `spriteVariants` |
| m9 | people list corrected (§2) |
| m10 | security ambient `#b2b8c8` ("fluorescent, low") |
| m11 | `alarm_panel` stays at the engine's soft cream (no red); the Bakelite panel is switches, not a light; the round terminal is handled under m5 |
| m12 (dressing) | the projection desk now has a lit face, `m10_field_screen_curve1` (the curve in red on the field screen), as a `spriteVariants` entry on `globalVars.m07_debrief_stance === 'hardened'` with a base `sprite` (`m10_field_screen_dark1`, the skill's lesson); emitter `m10_field_screen_curve` `#ffb0a0`, r 18, 0.45, screen, `above`; the dark face stays at 0 |
| m13 | the clocks are UTC (06:00 UTC is about 23:00 in Montana), another reason there is no day variant |

**Implemented:** the scenario block and the eight room blocks in `scenario.json.erb` (after each room's `type`; re-read first, only lighting and the projection desk's sprite fields touched). Validator (`--skip-ink --no-graph`): exit 0, 0 errors, schema passes.

**Tour** (game 3297, `--close-intro --restore-off --check`): `lighting_r1/<room>-a.png`, the power room also `-b` (lit); contact sheet `lighting_r1/sheet.png`; log `lighting_r1/tour.log`. Every room reports the mode and lit ambient planned; the power room is off until entered.


### Round 2 (2026-10-22): the R2 visual review

Review: `LIGHTING_REVIEW_R2.md` (0 blockers, 3 majors, 5 minors, 2 notes; "approve after three majors"). Shots: `lighting_r2/` (game 3301, `--close-intro --restore-off --check`), contact sheet `lighting_r2/sheet.png`.

| id | fix | result |
|---|---|---|
| Forward post (major) | ambient `#a4b0d0` (the review's `#9eaacc` is below the readability floor, luma 170; `#a4b0d0` is 176 and still cold); sodium pool moved off the fence to (16.4, 3.4), r 120, 0.85; work lamp 0.6 | a cold blue yard; the vans' doors, the gate's sodium pool and the work lamp's pool read as the warm things (`forward_post-a.png`) |
| Gallery (major) | ambient `#a8b0c0`; slit-window glow `#c8d8f0`, r 56, 0.4, `above`, `floorTint` 0.5, offsetY 20; a cold room light (3.7, 2.4), r 60, 0.35; bulb pools warmer and smaller, `#ffd090`, r 52, 0.5 at y 3.0 | cold light falls on the walkway below the slits; warm pools under the bulbs (`gallery-a.png`) |
| Tunnel (major) | pools at y 3.1, r 60, 0.75. Ambient kept at `#aeb2bc` (the review's `#a6aab4` is below the floor, luma 170); the pools give the contrast | three warm pools along the floor, darker between; rota and panel readable (`blast_tunnel-a.png`) |
| Forward crate fill (minor) | (6.0, 8.4), r 40 | no smear on the south wall |
| Plotting board (minor) | r 44, 0.3 | lighter wash; the red tape reads |
| Core console (minor) | `m10_key_console` r 18, 0.45, `above`, offset (−10, −10) | the glow sits on the screen |
| Power batteries (minor) | `ledColor` `#7dffa8` on both battery keys | green LEDs once lit |
| Caged bulbs (minor) | every room's bulb glow r 12, offsetY 4 | no bloom on the rim above |

Validator (`--skip-ink --no-graph`): exit 0, 0 errors. Every room reports its planned mode and ambient in the tour log.

**Open:** a browser check (the power room's strike on entry, one reload); `docs/agents/LIGHTING_LOG.md` m10 entry (added below this round); the engine's emitter-follows-room-state flag (review R1 M3) if the power room's wall bulbs should light with the tubes.

## Browser check (round 2)

Headless Chromium on the keyless :3001 server, fresh games (3307 for the walk and room shots, 3310 for the reload test), all rooms unlocked server-side. Shots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_light_check/` (`r2-*` from game 3307, `g2-*` from game 3310). Doors the walk could not open (blast tunnel to security office, server hall to gallery, gallery to core: story locks) were opened with `window.unlockDoor`, so the walk is not a real route.

1. **Power room strike on entry: passes.** From the workshop with the door open the room is dark: the load board's amber lamps, green battery LEDs and the bypass box glow show, the rest is near black (`02-power-before-door-open.png`, `g2-reload-power-before-entry.png`; `motion:false`). Walking in, the tubes strike over about a second (`03-power-after-enter-0s.png` is mid-fade, `03-power-after-enter-2s.png` fully lit, `motion:true`) and the worker appears.
2. **Reload.** Always-lit rooms come back lit (`on:true` for the forward post, and each room as loaded). The power room comes back dark and lights again on entry when it has not been entered before the reload (game 3310: `g2-reload-power-before-entry.png`, `g2-reload-power-after-2s.png`). **Finding:** if the player has already been in the power room (global `power_room_entered` true, its occupant revealed), then after a reload the room is lit as soon as it loads, before the player enters (game 3307: `r2-power-before-door-open.png`). The cause is the engine's NPC motion trigger (`npcInRoom`): the worker is visible from load, so the sensor sees him. Not a bug in the lighting block; it only means the dark-through-the-door look happens once per game, not after a reload that follows a first visit. Reload was done by stopping and restarting the browser session on the same game (a page reload through the harness hung its bootstrap).
3. **Each room with the player inside** (`r2-<room>.png`, the player stands at the entry doorway so the neighbour shows too). Nothing too dark to read.
   - forward post: lit, three pools; vans' side doors warm, table and field desk legible (`g2-reload-forward_post.png`).
   - blast tunnel: three floor pools, darker between; guard post, rota and wall panel readable.
   - security office: even grey, monitor wall glowing, readable. A board bark ("BLAST DOOR 1: OPEN...") covers the lower middle of the shot, not a lighting issue.
   - workshop floor: strip-lit, bench lamp warm, PC screen blue, benches and rack readable. The south edge sits under the inventory bar.
   - power room: lit after strike; red floor, plant-room sign and batteries readable. Wall bulbs read as lit although the room was dark (known open item, emitter does not follow the room's state).
   - server hall: low blue-grey, plotting-board desk, rack LEDs and the console row visible; the dimmest lit room but readable.
   - gallery: cool pool under the slit windows, mesh floor readable, guards' torch cone green.
   - core: grey concrete, two caged bulbs, key console and screens readable. The entry cutscene (Tesseract) opens on arrival; shot taken after closing it.
