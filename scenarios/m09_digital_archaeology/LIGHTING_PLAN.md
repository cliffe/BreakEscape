# m09 Digital Archaeology: lighting plan and log

Lighting stage after room dressing round 4 (2026-10-22). Skill: `.claude/skills/mission-room-lighting/`. Brief: `docs/agents/LIGHTING_PASS_BRIEF.md`. Model: `scenarios/m05_insider_trading/LIGHTING_PLAN.md`. Rooms: `ROOM_DRESSING.md` (rounds 1–4; R4 review "ready for lighting"). Only the `lighting` blocks in `scenario.json.erb` change: no ink, tags, NPC fields or layout, and no engine change in round 1.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, the Season 1 finale's first half. One night in a records warehouse on the edge of Helena while the director shreds the restricted series. The lighting tells the hour and the place. It carries no clue: every object the player reads is in a room that is lit on arrival or strikes on entry, and nothing depends on lighting (players can turn it off).

- **Night, after hours, the whole mission.** "Night, after hours, a small staff: a guard on his round, a clerk loading trolleys, an IT contractor in the server closet, the director behind the cage mesh" (stage 5 `room_layout.md` §1, l. 15). The briefing places the courier "last night" and HaX promises "By morning you won't need to" (`ink/m09_briefing.ink:34, 71`). No phase changes the lights: no power cut or alarm is in the story, so there are no `variants`.
- **Scenario ambient `#b8bfce`**, the night-shift tone m02 set. Rooms with their own character set their own lit ambient (below), all at or above the readability floor (about `#a8b0c0`).
- **Stage 5 gives each room's light** (§3.1–3.10, the "Lighting" line of each): the dock "Night exterior; sodium light, cold"; the front desk "Fluorescent over the counter, the rest dim; Noor's desk lamp"; the open stacks "Motion-sensor strips"; the closet "Rack LEDs, a monitor's glow"; the reading room "The only warm room: green-shaded lamps"; the hub "The cage front lit hard white like a shop counter; the aisle dark until the strips catch it"; the cage "Hard white over the shredder line; the cabinet's corner darker"; the office "A desk lamp and the kettle's light; warm, small"; the tape room "Blue standby LEDs; cold"; the salvage cage "Tomb Beta's server fans and status lights, the only warm thing; crates in the dark". The staff passage has no line; I treat it as a back corridor.

## 2. Room modes

People (from the scenario): Noor (front desk), Old Coyote (open stacks), Tran (closet), `sorensen_hatch` (hub, static), Sorensen (cage, shown on entry). Rooms with people start lit even in `motion` mode.

| Room | People | Mode | Lit ambient | Dark ambient | Why |
|---|---|---|---|---|---|
| loading_dock (start) | none standing (phone and cutscene NPCs only) | on, `panels: false`, two sodium pools | `#aca08c` | — | An exterior at night: no ceiling panels, the yard lit by two sodium lamps on the warehouse wall. The incident log's desk sits in a pool |
| front_desk | Noor | on | scenario | — | A clerk at work; "fluorescent over the counter" is the panel grid, her lamp adds a warm patch |
| staff_passage | none | motion, `offAfter` 60, **flicker** | scenario | `#161c30` | A back corridor at night on a sensor, with one tired tube. Two floor rows only, and nothing to read |
| open_stacks | Old Coyote | motion, `startOn: false`, `offAfter` 90 | `#b0b6c4` | `#141a2a` | "Motion-sensor strips": dark through the door, the strips strike as you walk in. `startOn: false` so the guard on his round doesn't keep it lit from the start. Dark ambient high enough that the shelves and doors read |
| server_closet | Tran | on, `panels: false` | `#a8b0c4` | — | A small machine room: the rack's LEDs, the terminal and the degausser carry it; no ceiling pool |
| reading_room | none | on, `panels: false` | `#c8bca4` warm | — | "The only warm room": the green-shaded lamps light it (the engine's lamp glow). The VM work happens here, so it is always lit |
| restricted_stacks (hub) | `sorensen_hatch` | on, `panels: false`, a hard white light over the counter | `#a8b0c0` | — | The aisle dim, the cage front "lit hard white like a shop counter" |
| restricted_cage | Sorensen | on, `panels: false`, a hard white light over the shredder line | `#a8b0c0` | — | Work light over the shredder; the plan chest's corner falls off darker |
| sorensen_office | none | motion | `#c4b8a6` warm | `#14121c` | Broken into at night: dark through the door with her desk lamp left on, then the ceiling strikes |
| tape_room | none | motion | `#a4b0c8` cold blue | `#0a0f1c` | Empty plant room: blue standby LEDs carry it in the dark, cold white once lit |
| salvage_cage | none | motion, `panels: false` | `#acaab0` | `#0a0f1c` | Crates in the dark; Tomb Beta's rack the one warm light. Lit level kept at the floor because seven objects are read here |

No `dark` rooms. Flicker in one room only (the staff passage), where nothing is read. No NPC torches: Old Coyote's room is dark only until the player walks in, and a torch shows only in a dim room.

## 3. Light sources

No `EMITTERS` change. m09's own props glow through per-room `emitters`.

| Room | Key | Glow | Why |
|---|---|---|---|
| dock | room `lights` | sodium `#ffb25a`, r 110, 0.75 at tile (2.5, 3) and (8, 3.2) | Two wall lamps: one over the open shutter, one over the hut desk |
| dock | `aes_shutter_ctrl` | `#7dffa0`, r 8, 0.45, above | Copied from m04's dock: the shutter control's green lamp |
| dock | `cctv_camera` | `#ff4040`, r 6, 0.4, above | A small red recording light on the camera over the hut |
| front desk, open stacks, hub | `fire_alarm_point` | intensity 0 | As m03–m06: a lone red pulse reads as a clue |
| front desk | `office-misc-lamp` | engine lamp, r 60 | Noor's desk lamp, a little smaller than the default 80 |
| closet | `m09_degausser` | `#ff4a3a`, r 10, 0.5, above, blink | The wipe running: its red ON lamp |
| closet | `comms_cabinet`, `server_rack` | engine rack glow with `leds` 0.5 | Rack LEDs |
| reading room | `bankers_lamp` | engine lamp `#ffd9a0` (default) | The green-shaded lamps |
| reading room | `m09_drop_screen` | `#6fb8ff`, r 30, 0.55, screen, above | The drop terminal's wall screen |
| reading room | `safetynet_flag_terminal` | `#6fb8ff`, r 24, 0.5, screen, above | The drop terminal itself |
| reading room | `m09_microfiche` | `#e8f0d0`, r 20, 0.35, above | The reader's lit screen |
| hub | room `lights` | white `#f2f6ff`, r 72, 0.85 at tile (7.6, 5.6) | The hatch lit like a shop counter |
| cage | room `lights` | white `#f2f6ff`, r 90, 0.8 at tile (5.5, 4.6) | Work light over the shredder line |
| office | `bankers_lamp` | engine lamp, r 70 | Her desk lamp, left on |
| office | `kettle` | `#ff8a3a`, r 8, 0.5, above | The kettle's on light |
| tape room | `m09_reel_shelf`, `m09_tape_cabinet` | `#5cb8ff`, r 26, 0.3, `leds` 0.35, `ledColor` `#4da6ff` | Blue standby LEDs on every rack |
| tape room | `office-misc-lamp` | engine lamp, r 50 | The bench lamp beside the reel deck |
| salvage | `server_rack` | `#ffb060`, r 40, 0.55, blink, `leds` 0.6 | Tomb Beta's rack: fans and status lights, the warm one |
| salvage | `safetynet_flag_terminal`, `laptop` | screen glow (engine for laptop; `#6fb8ff` for the terminal) | The field kit and the drop link |

## 4. Reuse

`ruby scripts/lighting_lookup.rb`: every `room_m09_*` type is new, so no block is copied. Reuse is by role, with no tile coordinates copied:

- night ambient `#b8bfce` (m02);
- motion for empty plant rooms and broken-into offices (m01–m05);
- server dark `#0a0f1c` (m02, m04, m06);
- corridor dark `#161c30` so doors are findable (m01, m05);
- call points off (m03–m06);
- the shutter control's green lamp (m04 `loading_dock`);
- the `above` flag for small indicators in lit rooms (m06 lesson).

## 5. What the player sees entering each room

- **Dock:** a dim amber yard, the open shutter and the hut desk under sodium pools, the fence falling off into the dark at the bottom of the screen; the camera's red light and the shutter control's green.
- **Front desk:** a cool, working office at night; Noor's lamp warms her desk.
- **Staff passage:** dark through the door, then the strip strikes; one tube in it never quite settles.
- **Open stacks:** dark through the shutter, the doors still findable, then the strips strike along the shelving as the player walks in; Old Coyote is already on his round.
- **Server closet:** a dim box lit by the rack's LEDs, the terminal and the degausser's red lamp.
- **Reading room:** the one warm room; green lamps over the desk, the drop terminal's blue screens.
- **Restricted stacks:** a dim aisle of binders; the hatch counter in a hard white pool with Sorensen behind it.
- **Restricted cage:** a white work light over the shredder and Sorensen; the plan chest in the darker corner.
- **Sorensen's office:** dark through the door, her desk lamp still on and the kettle's light, then the ceiling strikes.
- **Tape room:** dark blue with rows of standby LEDs, then cold white.
- **Salvage cage:** dark, the crates in shadow, Tomb Beta's rack blinking amber; then a low lit level.

## 6. Rounds

## 6. Rounds

### Round 1 (2026-10-22): design, review, implement, tour

**Design review** (a fresh reviewer, read-only; no blockers, 2 majors, 8 minors; verdict "approve once the two majors are fixed"). Folded in:

| id | sev | finding | outcome |
|---|---|---|---|
| R1 | major | Dock `#aca08c` and salvage `#acaab0` lit ambients below the readability floor | Dock `#bab09c`, salvage `#b4b2b8` |
| R2 | major | Open stacks: `startOn: false` is overridden by Old Coyote's own movement about 300 ms after the room loads, so the strips strike as the shutter opens, not as the player walks in; `offAfter` never fires while he is in the room | `offAfter` dropped. The strike as the shutter opens is the intended look now (the guard's own movement trips the strips) |
| r1 | minor | Salvage with `panels: false` snaps on with no strike | Panels kept |
| r2 | minor | The degausser keeps blinking "running" after the wipe halts | Variant list: a steady amber on `tran_outcome !== 'left'`, else the red blink |
| r3 | minor | The first dock lamp was over the shutter control, not the shutter | Moved to tile (5, 3) |
| r4 | minor | Sodium pools read pale (an added light lifts the art to its own colour) | `#ffc070` at 0.6; the amber shows in the surround, and the pools are where the art reads true |
| r5 | minor | The tape room's warm bench lamp outshines the blue standby LEDs | Lamp intensity 0.4, r 50 |
| r6 | minor | Scenario-level block not written out | `"lighting": { "enabled": true, "defaultMode": "on", "ambient": "#b8bfce" }` after `startRoom` |
| r7 | minor | The lookup's false positives (`m09_hatch_screen1`, `hce_cage_panel1`) not recorded | Noted here: mesh, not lights; left alone |
| r8 | minor | The dock's west lamp could leak into the front desk | Moot after r3 (the lamp moved east) |

**Implemented:** the eleven room blocks and the scenario block in `scenario.json.erb` (after each room's `type`; the scenario block after `startRoom`). Validator (`--skip-ink --no-graph`): schema passes; the only error is the character agent's `halina_kowalczyk` spriteSheet, which is not lighting.

**Tour** (game 3116, `--close-intro --restore-off --check`): `lighting_r1/<room>-a.png` and, for the motion rooms, `-b.png` (lit); contact sheet `lighting_r1/sheet.png`; `--check` log `lighting_r1/tour.log`.

**Visual review (self, round 1).**

| id | sev | finding | outcome |
|---|---|---|---|
| V1 | minor | Closet: the comms cabinet's teal glow is a hot spot on the wall | r 20, 0.25 (re-shot `lighting_r1/r1b/`) |
| V2 | minor | Cage: the work light over the shredder barely reads | r 96, 0.95 (re-shot `lighting_r1/r1b/`) |
| V3 | note | Open stacks shows dim in the tour shot although `--check` reports it on: the camera-only tour catches the strike in progress. With the player inside (game 3117) it is fully lit (level 1, `#b0b6c4`) | no change |

Reads as planned: the dock is an amber yard with the hut desk in a pool; the reading room is the one warm room; the hub counter sits in a white pool with Sorensen behind it; the office is dark with her lamp on, then strikes; the tape room shows blue standby LEDs in the dark; the salvage cage is dark with Tomb Beta's rack blinking amber and the field kit's screens; the passage is dark through the door with one tired tube.

**Open for round 2:** a fresh visual reviewer over all shots; a browser check (strike on entry, a reload, the flicker); `docs/agents/LIGHTING_LOG.md` entry once the config settles.

### Round 2 (2026-10-22): the R2 visual review

Review: `LIGHTING_REVIEW_R2.md` (0 blockers, 1 major, 9 minors). All are fixed with its proposed values; m9 needed a dressing change. Shots: `lighting_r2/` (game 3144, `--close-intro --restore-off --check`). Motion rooms are shot dark (`-a`), lit (`-b`) and with the player inside after the strike (`-player-lit`, `-player-dark`). Contact sheet: `lighting_r2/sheet.png`.

| id | sev | fix | result |
|---|---|---|---|
| M1 | major | Salvage: `server_rack` r 56, 0.8, `ledColor` `#ffb060` (blink, `leds` 0.6 kept); `laptop` r 18, 0.3; `safetynet_flag_terminal` r 18, 0.35 | Dark: the amber rack is now the brightest thing in the room, with the screens second. Lit: amber LEDs (`salvage_cage-a.png`, `-player-lit.png`) |
| m1 | minor | Tape room bench lamp r 36, 0.25, cool `#cfe0ff` | The blue standby LEDs carry the dark room; the lamp is a small task light (`tape_room-a.png`) |
| m2 | minor | Noor's lamp `#ffcf8a`, r 60, 0.7, `above`; room ambient `#b0b6c4` | The lamp reads warm on her desk and the rest of the room sits a shade lower (`front_desk-a.png`) |
| m3 | minor | Hub hatch light r 80, 1.0 | The counter is a clear white pool; the aisle is unchanged (`restricted_stacks-a.png`) |
| m4 | minor | Cage work light moved to tile (5.0, 5.0) | The NE plan-chest corner is a shade lower and still readable (`restricted_cage-a.png`) |
| m5 | minor | Dock: east lamp at x 7.6, r 80; both lamps at 0.75 | No smear on the east wall; the pools separate from the amber yard (`loading_dock-a.png`) |
| m6 | minor | Closet: `pc6` emitter r 22, 0.35 | No cyan wash on the east wall (`server_closet-a.png`) |
| m7 | minor | Degausser "halted" variant condition is now `globalVars.tran_outcome !== 'left' && globalVars.flag1_submitted`, the same as `stop_the_tape_wipe` (erb:214–215) | Matches the task. Not lighting, for the orchestrator: the console's own `textVariants` (erb ~1363) still say "WIPE HALTED" on `tran_outcome` alone |
| m8 | minor | Office `bankers_lamp` offsetX −8, offsetY 6 | The pool centres on the lamp, not the chair (`sorensen_office-a.png`) |
| m9 | minor (dressing) | A second green lamp on the reading room's notebook desk (`m09_rooms.py`). SILENCE PLEASE moved over the microfiche so the lamp doesn't cover it. Slot spacing unchanged | Two green lamps (`reading_room-a.png`) |

Validator (`--skip-ink --no-graph`): schema passes; the only error is the character agent's `halina_kowalczyk` spriteSheet. `docs/agents/LIGHTING_LOG.md` now has the m09 entry.

**Open:** a browser check (strike on entry, one reload, the passage flicker) if the orchestrator wants one before sign-off. Nothing above minor remains in my view.
