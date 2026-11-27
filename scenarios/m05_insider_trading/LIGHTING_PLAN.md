# m05 Insider Trading: lighting plan and log

Lighting stage of pass 5, 2026-10-13/14. Skill: `.claude/skills/mission-room-lighting/`. Brief: `docs/agents/M05_PASS_BRIEF.md` (stage 4). Worked example: `scenarios/m06_follow_the_money/LIGHTING_PLAN.md`. Rooms are final (`ROOM_DRESSING.md`, closed after cycle 5, commit 8fc75e86). Only the lighting blocks in `scenario.json.erb` changed: no ink, tags, NPC fields or layout, and no engine change.

Reviews: every cycle's review was done by the lighting agent itself from the tour shots (no separate reviewer agent was spawned), so treat the counts below as self-review.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, an insider hunt in a quantum-crypto firm. The lighting tells the time and follows the case. It carries no clue: every document the player reads sits in a room that is lit on arrival or strikes on entry.

- **An evening, about 16:30 to 20:15.** HaX: "The final upload goes tonight. You have four hours." (`ink/m05_insider_trading_opening.ink:347`); the window is "half past eight tonight" (`ink/m05_phone_agent_0x99.ink:136`); the confrontation opens "20:14. The data centre." or "20:02" (`ink/m05_torres_confrontation.ink:78-84`). Staff are still in (Patricia, Owen, Halloran, Lisa), so every room with someone in it is on. Scenario ambient `#c6c4c8`, a neutral early-evening tone a touch below the engine's day default.
- **The after-hours line.** The badge log counts after-hours from 19:00 (`door_log_text`, erb:86). The naming (`torres_identified`) lands at about 20:00 on every route, so it is the switch for after-hours lighting.
- **Torres' route.** Patricia, at the naming: "His badge just went through the hallway and the vault's logged him in. He's at the upload terminal." (`ink/m05_npc_patricia_morgan.ink:526`). The server hallway, server room and vault light up at that moment.
- **The upload.** "A transfer window is open" (vault terminal); the narrator gives a running bar, then "The transfer window stalls, then throws an error" or "He ... cancels the transfer" (`ink/m05_torres_confrontation.ink:514-531`); HaX: "Upload's dead." (erb, the sweep mapping).

## 2. Phases and the globals that mark them

Both are saved globals, so a reload keeps them (browser check, section 6).

| Phase | Global | Shows as |
|---|---|---|
| After hours, Torres at the terminal | `torres_identified === true` | lobby drops to night light (`#b0b8ca`, no ceiling pools); the main corridor goes on its sensor (`motion`, `offAfter` 75, dark `#161c30`); server hallway, server room and vault switch on; the upload terminal breathes amber |
| Upload stopped | `final_choice !== ''` | the upload terminal goes steady red |

Nothing changes for `halloran_accused` or `patricia_ko`: neither has a cause in the building's lights, and a light change would claim one.

## 3. Room modes (final)

| Room | People | Mode | Lit ambient | Why |
|---|---|---|---|---|
| reception_lobby | none standing (briefing NPCs are cutscene characters) | on; named: `#b0b8ca`, `panels: false` | `#d2d0d0` | Busiest public space, near full brightness; after hours, front-of-house night lighting |
| main_corridor | none | on; named: motion, `offAfter` 75 | scenario | Busy in the afternoon; on a sensor after hours, so it strikes as you pass |
| break_room | Lisa | on | `#ccc4b8` warm | Kitchen in the evening |
| open_office_area | Owen | on | scenario | Working office |
| server_hallway | none | motion, dark `#121828`; named: on | `#b4b6c6` | Restricted corridor; dark enough to feel off-limits, doors still findable |
| server_room | none | motion, dark `#0a0f1c`; named: on | `#b2b2c8` violet-graphite | Empty plant room; LEDs carry it in the dark |
| torres_office | none | motion | `#c4bcb0` warm | Broken into; dark through the door with his desk lamp left on (he's still in the building) |
| research_lab | Halloran | on | `#ccd2dc` cool white | Clean room |
| patricia_office | Patricia | on | `#c4bec4` | Security office |
| data_center | Torres (hidden until named) | motion, dark `#0a0f1c`; named: on | `#b0b2c2` | Empty vault before the naming; lit once he is there |

No `dark` rooms, no flicker (a crypto lab's building would fix a faulty tube, and nothing in the story cuts power), no NPC torches. Fire-alarm call points off (lobby, open office, Torres) as in m03, m04 and m06: a lone red pulse reads as a clue.

## 4. Light sources (final)

No `EMITTERS` change. The `qdc_*` props glow through per-room `emitters` entries.

| Room | Key | Glow |
|---|---|---|
| lobby | `qdc_logo_sign` | violet `#a98cff`, r 24, 0.3, offsetY 2, above |
| lobby | `qdc_dispatch_screen` | green `#6dffa0`, r 30, 0.5, screen, offsetY 4, above |
| lobby | `reception_counter` | cyan trim `#6fe0ff`, r 40, 0.3, above |
| lobby | `display_case` | case light `#fff2d8`, r 20, 0.2, offsetY −10, above |
| server room, vault | `qdc_rack_black` | green `#6dffb0`, r 40, 0.45, blink (no `above`, so the soft rack flicker, not the 1 Hz signpost) |
| server room | `qdc_server_sign` | violet `#b090ff`, r 12, 0.35, offsetY 8, above |
| server room, vault | `suppression_panel` | steady amber, r 18, 0.45 (no pulse: a pulse reads as an alarm) |
| server room | `aircon_unit` | `#9fe8ff`, r 18, 0.2, offsetY −20, above |
| Torres | `exec_desk_mahogany` | the lamp painted on the desk, `#ffd08a`, r 48, 0.7, offsetX 14, offsetY −8 |
| lab | `qdc_laser_warning` | illuminated LASER sign, red `#ff4040`, r 14, 0.6, offsetY 5, above, steady |
| Patricia | `qdc_cctv_desk` | `#9fd4ff`, r 36, 0.55, screen, offsetY −8, above |
| vault | `pc` (the upload terminal, `pc10`) | stopped: steady red `#ff4a3a`, r 40, 0.9, above, floorTint 0.45; running (named): amber `#ff8a1a` breathe, r 44, 1.0, above, floorTint 0.65; before: the engine's screen glow |
| vault | `qdc_hsm` | steady green `#5cff8a`, r 22, 0.35, above |
| vault | `qdc_vault_sign`, `qdc_two_person_sign` | backlit red, r 18 / 14, 0.35 / 0.3, offsetY 6, above |
| lobby, open office, Torres | `fire_alarm_point` | intensity 0 |

Dropped during the cycles (each did nothing visible in an always-lit room, or pointed at nothing): the cryostat's cool spot and floor tint, the instrument rack and fume hood glows, the break-room TV glow, the key-locker amber (it lit one locker, which read as "this one"). The cryostat, LASER sign, CCTV desk, the vault's red line, the HSM lights and the TV were the dressing log's asks; the LASER sign, CCTV desk, vault signs and HSMs carry them, and the TV and cryostat art carries itself in a lit room.

Not reachable without an engine change: scattered LEDs on the `qdc_*` racks and HSMs (D16 in `DECISIONS_PENDING.md`, same limit as m06 D9).

Flash safety: every effect is the engine's blink or breathe (well under three a second); variants apply without a strike.

## 5. Reuse

`ruby scripts/lighting_lookup.rb`: every `room_qdc_*` type is new. Reuse by role, no tile coordinates copied: motion for empty corridors, plant rooms and broken-into offices (m01-m04); server darks `#0a0f1c` (m02, m04, m06); hallway dark `#161c30` so doors are findable (m01); corridor `offAfter` 75 (m02); call points off and steady suppression panels (m03, m04, m06); phase glows in base `emitters` keyed on their own cause (m04, m06); `above` + `floorTint` for a story change on a screen in a lit room (m06 lesson).

## 6. Cycles

Evidence: `build_evidence/lighting_c<N>/{base,named,after}/` (base = afternoon; named = `torres_identified`; after = `final_choice` set), each with `tours.log`. Baseline without lighting: `build_evidence/dressing_c5/`.

### Cycle 1 (design, implement, tour): games 2384 base, 2385 named, 2386 after

| id | sev | finding | outcome |
|---|---|---|---|
| L1 | major | Upload terminal's amber (running) and red (stopped) don't show in the lit vault: an additive glow on a bright blue screen adds nothing | **Fixed (c2):** both `floorTint` 0.45, larger radius |
| L2 | minor | Torres' lamp glow centred on the desk's middle, white-hot | **Fixed (c2/c3):** offset onto the lamp, 0.7 |
| L3 | minor | Server, vault and two-person signs bloom over the wall rim | **Fixed (c2/c4):** smaller radius, offsetY 6-8 |
| L4 | minor | Key-locker amber lit one locker, which reads as a hint | **Fixed:** removed |
| L5 | minor | LASER sign glow above the rim | **Fixed:** r 14, offsetY 5 |
| L6 | minor | TV glow a hot spot on the break-room wall | **Fixed (c2), then removed (c4)** |
| L7 | minor | Lobby display-case glow a flare on the glass | **Fixed:** 0.3, then 0.2 |
| L8 | minor | Lobby after-hours step (`#b8bfce`) too small to see | **Fixed:** `#b0b8ca`, still above the readability floor |
| L9 | minor | Cryostat, instrument-rack and fume-hood glows invisible in the lit lab | **Fixed (c3):** removed (the lab is never dark) |

### Cycle 2: games 2387, 2388, 2390. 0 blockers, 1 major, 4 minors

| id | sev | finding | outcome |
|---|---|---|---|
| M1 | major | Red "stopped" now reads; amber "running" still faint (glow centred above the screen) | **Fixed (c3):** deeper orange `#ff8a1a`, floorTint 0.65, offsetY 0 |
| M2 | minor | Lamp pool too high: offsets are world px, half the on-screen distance | **Fixed:** offsetX 14, offsetY −8, r 48 |
| M3 | minor | Lab glows (L9) still do nothing | **Fixed:** removed |
| M4 | minor | Logo glow blooms below the sign | **Fixed:** r 24, 0.3, offsetY 2 |
| M5 | minor | Display case still flares | **Fixed:** r 20, 0.2 |

### Cycle 3: games 2393, 2394, 2398. 0 blockers, 0 majors, 3 minors

| id | sev | finding | outcome |
|---|---|---|---|
| N1 | minor | Server sign still a small violet bloom over the rim in the dark | **Fixed (c4):** r 12, offsetY 8 |
| N2 | minor | TV glow invisible in the lit break room | **Fixed (c4):** removed |
| N3 | minor | Amber "running" is subtle in a still (the breathe's low point); red is clear | **Accepted**, as m06's warned console: clear in the vault's dark state, the narrator gives the bar, and it is seen live in the browser check |

### Cycle 4: N1-N2 applied. Checks only.

### Cycle 5 (final tour and browser check): games 2399 base, 2400 named, 2401 after; live 2403; reload 2405. 0 blockers, 0 majors, 0 new minors

The whole set judged afresh from the shots: every room meets its brief, every clue reads (the IT notice, the incident log, the suspects board, the Lab Rules, the Mug and briefcase once the office strikes, the vault papers), the vault's three states differ, and nothing bleeds far through a wall.

Browser check (headless, keyless :3001, my own games, both sessions stopped):
- Game 2403, live: start state as designed (server side and vault dark, motion). `torres_identified` set while standing in Patricia's office: the lobby took its night variant, the corridor went dark (motion), the server hallway, server room and vault came on, and the terminal took its amber variant. Walking into the corridor struck its lights. `final_choice` set: the terminal went red. Shots: `build_evidence/lighting_c5/live/`.
- Game 2405, reload: both globals set and synced, page reloaded, resumed: same variants on every room and the terminal after the reload (`build_evidence/lighting_c5/reload/`).

Not exercised: the real naming conversation and the confrontation (globals set by console, "exercised, not earned"); the corridor's 75 s switch-off; the amber breathe watched over a full cycle.

## Checks

Validator (`--skip-ink --no-graph`): schema pass, no lighting warnings. `check_door_alignment.py`: 9/9. Routes (`scripts/ink_runtime_check/m05_routes/`): 38/38. No ink, so no tagdiff and no spoken-line changes.

## Phase art: lighting CLOSED (2026-10-14)

| Cycle | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 1 | 8 |
| 2 | 0 | 1 | 4 |
| 3 | 0 | 0 | 3 |
| 4 | fixes only | | |
| 5 | 0 | 0 | 0 |

Open: D16 (engine, rack LEDs for `qdc_*`). Next in the art order: POV chat backgrounds (`room-pov-background`); lighting is final for them.
