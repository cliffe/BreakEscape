# m07 The Architect's Gambit: lighting plan and log

Lighting stage of pass 5, 2026-10-14. Skill: `.claude/skills/mission-room-lighting/`. Brief: `docs/agents/M07_PASS_BRIEF.md` (stage 4). Worked example: `scenarios/m05_insider_trading/LIGHTING_PLAN.md`. Rooms are the six `room_pnw_*` maps from the dressing stage (`ROOM_DRESSING.md`, closed after cycle 5). In `scenario.json.erb` only the lighting blocks changed (no ink, tags, NPC or dialogue fields). No engine change.

Reviews: each cycle's review was done by a fresh Opus agent, read-only, from the tour shots and the config. The lighting agent did not review its own work.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, the season's climax set-piece. The lighting tells the time and follows the cascade. It carries no clue: every document the player reads sits in a room that is lit on arrival or strikes on entry, and every state change on a light repeats something the player has already been told.

- **Night, in winter, mid-evacuation.** The brief says "three states in winter" (`scenario.json.erb:69`); the situation board reads "OUTSIDE TEMPERATURE: 28 F"; the closing narrator: "people are asleep with the lights on" (`ink/m07_closing_debrief.ink:751-753`). The muster board is crossed off halfway, chairs are pushed back, coffee is still warm. Scenario ambient `#b8bfce` (night shift, m02/m06).
- **Mains power holds all night.** "SITE BACKUP GENERATION ... ONLINE, 72 HOUR RATING" (situation board) and "Three generators ... all reading ready. For the moment." (genset panel): the gensets stand ready, they are not running. No brownout: nothing in the story cuts this building's power (the m01 L1 rule).

## 2. Phases and the globals that mark them

All are saved globals, so a reload keeps them.

| Phase | Global | Shows as |
|---|---|---|
| The sequence waits on the host | (start) | video wall amber, steady; countdown a dull red ("AWAITING HOST") |
| The clock runs | `cascade_armed` (flag 3, the login) | video wall amber breathes; countdown red breathes, brighter, tints the floor |
| The clock expired: step one ran | `countdown_expired` | video wall deepest orange, strongest breathe (it stays amber-orange because the board's art and text still say amber and PENDING; L1 would turn it red); countdown steady bright red; the mimic dims grey ("one region of the map has gone grey") |
| The abort | `grid_saved` | video wall back to steady amber (the remote-session incident is still on the board); countdown dim and steady (its text: "The display has stopped. Nobody has thought to switch it off."); the cascade control screen goes green |
| Park at work below | `vault_entered && !park_ko && park_resolved !== 'talked'` | ATS-1's lamp blinks amber, the same condition as its text variant ("the fault lamp on the control run is blinking amber") |

## 3. Room modes

| Room | People | Mode | Lit ambient | Why |
|---|---|---|---|---|
| security_checkpoint | Hollis | on | `#bcc2ce` | Start room, front of house at night; a little brighter than the rest |
| operations_floor | none (evacuated) | on, `panels: false` | `#aab0c2` | A control room at night: the ceiling pools are off and the video wall is the room's light |
| server_room | Elena | motion, dark `#0a0f1c` | `#a0b0c0` | m02's server block; lit while Elena is there |
| scada_control | Mercer | on, `panels: false` | `#aaa4b6` | Restricted room lit by the countdown display |
| generator_room | none | motion, dark `#121828` | `#bcc0b8` | Empty plant hall: dark through the door, strikes on entry |
| cable_vault | Park | on, flicker | `#a8b4b0` | Underground, cool and damp, temporary fittings; one faulty |

## 4. Light sources

No `EMITTERS` change. The `pnw_*` props glow through per-room `emitters` entries (see the cycle log for the values each cycle settled on).

## 5. Reuse

`ruby scripts/lighting_lookup.rb`: every `room_pnw_*` type is new. Reuse by role: night ambient `#b8bfce` (m02, m06); `panels: false` with the video wall as the control room's light (sis02); server block `#a0b0c0` / `#0a0f1c` (m02); plant-room dark `#121828` (m05 hallway); call points off and suppression panels steady (m03-m06); phase glows in base `emitters` keyed on their own cause, `above` + `floorTint` for a story change on a screen (m05, m06).

## 6. Dressing minors picked up in this stage

| id | fix |
|---|---|
| c5 m-1 | Ops back-row chair F removed (it sat half behind the binder shelves) |
| c5 m-2 | ATS-1 cover feet 100 → 90, propped on the skirting |
| c5 m-3 | Open trench redrawn: north shadow band, 2 px lit lip, cables that sag and stop short, a thicker orange HV run cut through with copper on both faces (`make_pnw_tileset.py` `paint_open_trench`) |
| c5 m-4 | Builder docstrings: servers slot `pnw_backup_server1`; genhall plates on the skids, cover propped against the wall |
| walk F1 | SCADA mimic board up 8 px (feet 52 → 44), so the historian's monitor no longer hides its lamps |

## 7. Cycles

Evidence: `build_evidence/lighting_c<N>/{base,armed,expired,saved}/` with each tour's log, and the cycle's review as `review_c<N>.md`. base = start state, every room; armed = `cascade_armed`; expired = plus `countdown_expired`; saved = plus `grid_saved` and `vault_entered` (the ATS-1 fault lamp). Baseline without lighting: `build_evidence/dressing_c4/`.

### Cycle 1: design, implement, tour (games 2446 base, 2447 armed, 2448 expired, 2449 saved). Review: fresh Opus agent. 0 blockers, 2 majors, 7 minors

| id | sev | finding | outcome |
|---|---|---|---|
| M1 | major | Red and amber phase glows bloom over the north wall rim in both control rooms (reads as light outside the building) | **Fixed (c2):** video wall r 96 → 72, offsetY 18 → 30; countdown armed/expired r 60 → 46, offsetY 14; the other two offsetY 12 |
| M2 | major | The countdown sprite read SEQUENCE LOADED / AWAITING HOST in every state, so its light claimed states the face didn't show | **Fixed (c2):** three faces drawn in `make_pnw_props.py` (`pnw_countdown_armed1` SEQUENCE ARMED / PENDING / CLOCK RUNNING, `pnw_countdown_running1` SEQUENCE RUNNING / STEP 01 / 01 EXECUTED with Seattle's lamp grey, `pnw_countdown_aborted1` dim, SEQUENCE ABORTED / STOPPED), wired as the object's `spriteVariants` in the textVariants' order. Loaded on demand by `rooms.js` (not registered in the shared catalog, which m08 is editing) |
| m1 | minor | Armed barely differs from the start state on the ops floor | **Fixed (c2):** armed `#ff7a1a`, 0.8, floorTint 0.45 |
| m2 | minor | The expired red on the near-white mimic makes a pink smudge; the text says "gone grey", and red means closed in North American mimic colours | **Fixed (c2):** expired variant `#c8ccd4` at 0.12 |
| m3 | minor | Mimic and historian glows wash out mimic lamps 4-7; the post-abort green blends into the mimic glow | **Fixed (c2):** historian r 26, offsetY 2; mimic r 24, 0.2 |
| m4 | minor | ATS-1's amber fault blink not caught in a still; its green lamp goes out during the fault (one glow per object) | **Accepted in part:** the fault replaces the ARMED lamp, which matches the text ("ARMED / AUTO -- CONTROL RUN FAULT"); blink to be confirmed live in the browser check |
| m5 | minor | Backup server blink reads as "interact here" and doesn't show in the lit room | **Fixed (c2):** entry removed |
| m6 | minor | Checkpoint barely differs from the unlit baseline | **Fixed (c2):** ambient `#c4c8d2` → `#bcc2ce` |
| m7 | minor | Cycles section empty | **Fixed:** this log |

Dressing fixes in section 6 confirmed by the reviewer.

### Cycle 2: cycle 1 fixes, tour (games 2451 base, 2452 armed, 2454 expired, 2456 saved). Review: fresh Opus agent. 0 blockers, 0 majors, 2 minors

All nine cycle 1 findings confirmed closed (measured: rim red 203-207 → 151 against 146 unlit on SCADA, 192 → 141 on ops; every mimic lamp reads; four countdown faces in textVariants order). m4's blink is left for the browser check.

| id | sev | finding | outcome |
|---|---|---|---|
| m1 | minor | The video wall lights the floor as one spot (about 40% of its width; the ends give nothing) | **Fixed (c3):** two room `lights` under the wall's ends (tiles 4.2/7.9, 2.2, r 40, amber 0.35), a room variant turning them orange (0.4) while the clock runs; `situation_board` r 72 → 60 |
| m2 | minor | After step one ran, the wall's light went red while its art and text still say amber and PENDING | **Fixed (c3), lighting side:** the expired light stays amber-orange (`#ff7a1a`, 0.95, the strongest breathe) so the light never claims what the board doesn't show; the countdown room carries the red. The reviewer's preferred option (a `textVariants` entry and a red-panel sprite on the board) changes object text, outside this stage: proposed as L1 in `DECISIONS_PENDING.md` |

### Cycle 3: cycle 2 fixes, tour (games 2457 base, 2459 armed, 2461 expired, 2462 saved). Review: fresh Opus agent. 0 blockers, 0 majors, 2 minors

Cycle 2: m1 closed in part (the end lights show, floor under the ends red 60 → 81-85, rim unchanged, but faint and neutral, three humps rather than a band); m2 closed on the lighting side (expired pool (140, 115, 99), no red; L1 open). Cycle 1 m4 now confirmed from stills: the c2 and c3 dark "saved" shots caught ATS-1's lamp in opposite phases, so it blinks.

| id | sev | finding | outcome |
|---|---|---|---|
| m1 | minor | Wall-end lights too weak and neutral against the centre pool (110-140) | **Fixed (c4):** `#ff9020`, r 52, 0.55, y 2.25 |
| m2 | minor | While the clock runs the ends barely change (room lights can't breathe) | **Fixed (c4):** armed variant `#ff6a10`, r 52, 0.65 (an expired red variant waits on L1) |

### Cycle 4: cycle 3 fixes, tour (games 2464-2467). Review: fresh Opus agent. 0 blockers, 0 majors, 2 minors

Cycle 3: m1 closed (the three lobes became one band: floor under the wall a flat 89-91 across x 600-940, rim 138 in every state, monitor tops within 2); m2 closed in part (the variant resolves, but the ends moved only G −4, B −3). The reviewer's note: room `lights` draw into the multiply map, so they can only bring the floor back up to its unlit colour (90, 104, 133); red can't rise above the art, and warmth comes from holding blue and green down. Only `above` emitters with `floorTint` go brighter than the art.

| id | sev | finding | outcome |
|---|---|---|---|
| m1 | minor | While the clock runs, the wall's ends barely change | **Fixed (c5):** armed end lights `#ff4a10`, 0.7. Re-shot (game 2470): ends (89, 96, 105) → (89, 90, 106) against base (89, 100, 109); with red at its ceiling the step reads as a cooler, violet-grey drop rather than orange (c5 m1, accepted: nothing on that floor, and no red claim) |
| m2 | minor | Step 6 records not written (plan cycle 4 entry, LIGHTING_LOG m07 section and its lessons) | **Fixed:** this entry and the m07 section in `docs/agents/LIGHTING_LOG.md` |

### Cycle 5: closing tour and browser check (reshoot game 2470; live game 2469). Review: fresh Opus agent. 0 blockers, 0 majors, 3 minors

Cycle 4: m1 closed (ends G −10 while the clock runs; rim 137.7 in all five shots, monitor tops within 1, no red); m2 closed (records written; stale lines fixed under m3 below).

| id | sev | finding | outcome |
|---|---|---|---|
| m1 | minor | The armed ends read violet-grey, not orange (red can't rise; `#ff4a10` takes out green faster than blue) | **Accepted:** hides nothing, not red; plan wording corrected |
| m2 | minor | The browser check ran on the cycle 4 config (game 2469 created before the c5 edit) and doesn't say so | **Fixed:** noted in `browser_check.md`. The persistence evidence holds either way (the change is one colour in a room variant whose resolution the check confirms) |
| m3 | minor | Plan housekeeping: checkpoint ambient, expired row, cycle 4 game ids, no cycle 5 entry | **Fixed:** sections 2 and 3, cycle 4 heading, this entry |

Browser check (`build_evidence/lighting_c5/browser_check.md`, game 2469, keyless :3001, headless, doors unlocked by script, globals set by console: exercised, not earned): A start modes as planned; B the generator hall off before entry, on after; HUD and talk markers readable; C armed face and ops variant 0; D running face; E after a reload the running face, ops variant and room modes hold (the generator hall starts dark again and strikes on re-entry: known); F aborted face, ops variant −1, cascade screen green, held after a second reload; G ATS-1's amber lamp blinks (alternating frames). Session stopped.

Not exercised: the real login, expiry and abort (console), the vault flicker watched live, the 1 Hz blink watched at speed.

## Checks

Validator (`--skip-ink --no-graph`): schema pass, 0 errors. `check_door_alignment.py`: every pair OK. `generate_rooms.py --check` on the four rebuilt pnw maps: OK. Routes (`scripts/ink_runtime_check/m07_routes/`): 31/31. No ink, tags or dialogue fields touched, so no tagdiff and no spoken-line changes. No engine change.

## Lighting: CLOSED (2026-10-14)

| Cycle | Reviewer | Blockers | Majors | Minors |
|---|---|---|---|---|
| 1 | fresh Opus | 0 | 2 | 7 |
| 2 | fresh Opus | 0 | 0 | 2 |
| 3 | fresh Opus | 0 | 0 | 2 |
| 4 | fresh Opus | 0 | 0 | 2 |
| 5 | fresh Opus | 0 | 0 | 3 |

Open: L1 (situation board text and art after step one; `DECISIONS_PENDING.md`). New art: three countdown faces (`pnw_countdown_{armed,running,aborted}1.png`, loaded on demand, not in the shared catalog). Next in the art order: POV chat backgrounds; lighting is final for them.
