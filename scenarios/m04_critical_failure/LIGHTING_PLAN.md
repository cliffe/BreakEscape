# m04 Critical Failure: lighting plan

Lighting cycle 1, 2026-10-13. Skill: `.claude/skills/mission-room-lighting/`. Briefs: `docs/agents/M04_PASS_BRIEF.md` (stage 5), `docs/agents/LIGHTING_PASS_BRIEF.md`. Worked example: `scenarios/m03_ghost_in_the_machine/LIGHTING_PLAN.md`. Rooms are final (`ROOM_DRESSING.md`, closed after cycle 7). No ink, tags or spoken lines change. No engine change.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller. The lighting sets a night shift at a grid battery plant and tightens as the crisis builds. It never carries information a puzzle needs, and nothing the player reads (the dial, the displays, the papers, the ESD) sits in the dark.

- **Night.** "It's tonight, and it's this hall" (`ink/m04_opening_briefing.ink:232`); the night crew in Hall 2 "till six" (`ink/m04_npc_robert_vance.ink:448`); "Nobody's in the halls at night" (`ink/m04_npc_operative_cipher.ink:104`). The trigger is 0800. So: a night shift, every working area on its fluorescent tubes.
- **The alarm.** Vance: "Klaxon and strobes in every hall" (`m04_npc_robert_vance.ink:449`), then "a klaxon starts, and the strobes in the corridor go white" (`:471`). Relay: "The strobes are still going" (`m04_npc_operative_relay.ink:40`). So after the evacuation, white strobes in the halls.
- **The truth on the wall.** The digital rack panel reads all green, "Readings look normal" (`scenario.json.erb`, `rack_status_panel`); the hardwired H2 panel beside it shows "An amber indicator is lit" (`hydrogen_detector`), and Cipher: "That panel's amber. That panel is not supposed to be amber" (`m04_npc_operative_cipher.ink:56`). The lighting shows the lie and the truth side by side: a steady green panel, an amber H2 lamp.
- **The plant room.** HV room, the hardwired ESD under the EMERGENCY SHUTDOWN plate in a red-hatched keep-clear box (`ROOM_DRESSING.md` c3). The ESD reports "NOT ARMED" until grid control's permissive (`esd_authorized`), then "ISOLATED - COOLING ACTIVE" (`completionActions`, `attack_prevented`).
- **The vent.** "Bank B has gone. The hall is burning and the feed has dropped" (`racks_vent` timer hint). The engine already tints Hall 2's racks red and pulsing on the H2 advisory and the trigger (`tint_objects` actions).

## 2. Story phases and the globals that mark them

From the erb (timers at the end, HaX's `crew_warned` / `map_the_attack` mappings, the ESD's `completionActions`). Every one is a saved global, so a reload keeps the phase (room `variants` resolve from saved globals at load).

| Phase | Global | Set by |
|---|---|---|
| Before the dial | `anomaly_detected` false | start |
| Dial read | `anomaly_detected` | the Hall 1 thermometer |
| Clock running | `clock_started` | attack mapped (`attack_mechanism_known`) or the alarm, first wins |
| Alarm sounded (evacuation) | `crew_warned` | Vance's desk or phone |
| ESD armed | `esd_authorized` | HaX's three-way gate |
| H2 advisory | `hydrogen_alarm` | `h2_advisory` / `h2_advisory_alarm` timers |
| Vent | `racks_vented` | `racks_vent*` timers, the trigger race |
| After the ESD | `attack_prevented` | the ESD |

The dial itself changes nothing in the lights: reading it is a deduction the player makes, and a light change would announce it. The lighting tightens from `clock_started` on.

Ordering rule for every variant list (first match wins): after the ESD, vent, H2, alarm, clock, base. After the ESD the alarms stop and the plant goes calm; status lamps go green where the story says so.

## 3. Room modes

| Room | People | Mode | Lit ambient | Why |
|---|---|---|---|---|
| main_entrance | gate guard | on | scenario night | A manned gatehouse; papers on the desks. |
| operations_office | Vance | on | scenario night | The duty engineer's office; Vance works here all night. |
| security_office | none | motion | scenario night | The guard's office, empty while he's on the gate; the player breaks in. Dark through the door with the camera wall glowing; strikes on entry. |
| scada_control_room | none | on, dim, no ceiling grid | `#929cb2` | Control rooms run dim so the screens read. The HMI wall carries it (sis02's SCADA screens block). A cool pool over the south desk keeps its two papers findable. |
| engineering_workshop | none | motion | `#aab4c6` | "Cold blue screen glow": dark through the door, racks blinking, PCs blue; tubes strike as you walk in, cool once lit. The VM work happens in its own overlay. |
| battery_hall_1 | Cipher | on | `#b0b8c8` | High-bay tubes, a shade cooler and dimmer than the offices; racks' LEDs show. |
| battery_hall_2 | Relay | on | `#b0b8c8` | As Hall 1, then it changes with the crisis (section 4). |
| plant_room | Voltage, Static | on | `#b2b4be` | HV room, lit (Voltage works at his laptop); a red-amber hazard pool round the ESD. |
| loading_dock | none | motion, flicker | scenario night | The neglected back of the site; one faulty tube. The player spends seconds here (go-bag, escape plan). |

Scenario block: `{ "enabled": true, "defaultMode": "on", "ambient": "#b8bfce" }`, the night-shift mood m02 and sis02 (the same kind of battery site) use.

**No NPC torches.** The guard, Cipher and Relay all stand in lit rooms. A torch shows only in a dim room (`npcTorchStrength`: zero above a luma of about 0.62), so at these ambients it would never draw, and a lit plant on its night shift has no reason for one. Sight cones draw above the light map (m03 E4), so they stay readable at every ambient here.

**No `dark` rooms, no `offAfter`.** Nothing in the story cuts power, and every room holds something the player returns to.

## 4. How the lighting tightens

| Room | Clock running | Alarm | H2 advisory | Vent | After the ESD |
|---|---|---|---|---|---|
| main_entrance | – | call point pulses red | (as alarm) | (as alarm) | call point off |
| security_office | – | call point pulses red | (as alarm) | (as alarm) | off |
| scada_control_room | alarm panel amber pulse | (as clock) | alarm panel red pulse | red pulse | alarm panel steady green |
| battery_hall_1 | ambient `#a8b0c0`, beacon amber pulse | beacon white strobe (slow pulse) | (as alarm) | (as alarm) | beacon off, ambient back |
| battery_hall_2 | ambient `#a8b0c0` | white strobe on the west wall | ambient `#b0a8b0` (faint red), gas detector red pulse, racks' LEDs red (sis02) | ambient `#b49084`, flicker, orange fire pools over bank B | calm, detector amber steady, racks green |
| plant_room | ambient `#a8aab4`, hazard pool stronger | (as clock) | (as clock) | (as clock) | ambient `#bcc2ce`, ESD green |
| loading_dock | – | shutter beacon amber pulse | (as alarm) | (as alarm) | off |

ESD (`esd_pushbutton`, by id): steady dim red while not armed; a red pulse with a red floor tint on the keep-clear box once `esd_authorized`; steady green after `attack_prevented`. The armed pulse is the beckon at the moment the player can press it.

**Flash safety.** Every "strobe" or "pulse" is the engine's `pulse` effect: a sine about 1.9 s per cycle (`lighting.js:943`), well under three flashes a second, and it doesn't depend on the light switching (no strike). The H2 and vent changes apply at once without a strike (room variants).

## 5. Light sources

No `EMITTERS` change; m04's props glow through per-room `emitters` entries (an object with no `EMITTERS` match glows when its variant gives `color` and `radius`, `lighting.js:497-498`). `above: true` keeps a small indicator visible in a lit room.

| Source (room) | Key | Glow |
|---|---|---|
| ESD station (plant) | id `esd_pushbutton` (texture `aes_esd_station1`, no `EMITTERS` match: the old `emergency-button` entry doesn't reach it) | see section 4 |
| ENTROPY laptop (plant) | `laptop` | red screen `#ff6a5c` while armed; base screen after the ESD or once Voltage is dealt with |
| Breaker panel (plant) | `aes_breaker_panel` | small amber steady |
| Digital rack status (Hall 1) | id `rack_status_panel` | steady green `#5dff8a`, r 18, above (the lie) |
| H2 detector (Hall 1) | id `hydrogen_detector` | amber breathe, r 16, above (the truth); amber steady after the ESD |
| H2 detector (Hall 2) | `aes_gas_detector` | amber breathe; red pulse on H2 / vent; amber steady after |
| Duty round terminal (Hall 1) | `aes_round_terminal` | small screen blue |
| Beacon (Hall 1, dock) | `aes_beacon` | off; amber pulse (clock, Hall 1); white strobe (alarm) |
| Hall 2 strobe | `fire_extinguisher` (west wall; offset up to the wall above it) | white strobe on alarm, otherwise none. No fixture: a wall strobe |
| Power panel (Hall 2) | `power_panel` | steady green small (the global amber pulse reads as an alarm before there is one) |
| Battery racks (halls) | `batrack` | engine glow; Hall 2 red on H2 (sis02), orange on vent |
| SCADA screens | `screens` | sis02: r 140, 0.7, offsetY 40, floorTint 0.35 |
| Mimic board (SCADA) | `aes_mimic_board` | soft cool r 48, 0.4 |
| Alarm panel (SCADA) | `alarm_panel` | section 4 |
| UPS (SCADA) | `aes_ups` | small green |
| CCTV recorder (security) | `aes_dvr` | small green |
| Fire-alarm call points (reception, security) | `fire_alarm_point` | off until the alarm (the m03 rule: a lone red pulse before then reads as a clue) |

Left alone: `aes_ppe_rack1`, `undercounter_fridge1`, `cylinder_rack1` (lookup false positives). The exit signs (plant, dock), PCs, CCTV monitors, kiosk, racks in the workshop keep their engine glows.

## 6. What the player sees entering each room (night, before the clock)

- **Reception** (start): a lit night gatehouse, the kiosk's screen, the guard at the desk.
- **Operations office:** lit, Vance's PC.
- **SCADA:** dim and cool; the HMI wall floods the console blue, the mimic board's soft glow, a pool over the south desk.
- **Security office:** dark through the door, the camera wall's blue and the recorder's green; strikes as you step in.
- **Hall 1:** lit high-bay, racks' LEDs; on the back wall a steady green digital panel and, a few metres along, an amber H2 lamp.
- **Workshop:** dark, racks blinking, PCs and the flag station blue; strikes on entry.
- **Hall 2:** as Hall 1; its H2 lamp amber.
- **Plant room:** lit, a red-amber pool round the ESD station, the ESD's own dull red; Voltage's laptop screen red.
- **Loading dock:** dark through the door, exit sign green; strikes on entry, one tube faulty.

## 7. Reuse

`ruby scripts/lighting_lookup.rb`: every m04 room type (`room_aes_*`) is new, so nothing is lit before. Reuse by role, no tile coordinates copied: scenario night ambient (m02, sis02); SCADA `screens` block and the Hall 2 rack H2 variant (sis02, the same battery-site story); call points off until the alarm (m03); motion for empty offices and back rooms (m01/m02/m03); server darks `#0a0f1c` for the workshop (m02 server room).

## 8. Design review (fresh Opus, read-only): 0 blockers, 6 majors, 9 minors

All accepted. Sections 3-5 above are the plan as reviewed; this table is what changed.

| id | sev | finding | outcome |
|---|---|---|---|
| M1 | major | One exclusive variant per phase column drops glows on some routes and fires them on others (H2 starts on the mapping without an alarm; the trigger race vents with neither) | **Fixed:** every glow carries its whole phase list in the base `emitters`, keyed on its own cause; room `variants` change ambient only and never repeat an emitter key |
| M2 | major | A room variant switches off a motion room the player has lit (`resolveRoomVariant`) | **Fixed:** no variants on the security office, workshop or dock |
| M3 | major | SCADA's alarm panel going amber on the clock contradicts the deception ("All alarm setpoints: SATISFIED"; the H2 panel isn't on SCADA); Hall 1's clock beacon had no cause in the world | **Fixed:** the alarm panel is the hardwired fire/evacuation panel: red pulse on `crew_warned`, steady red on `racks_vented`, green after the ESD. No clock beacon; the clock changes ambient only |
| M4 | major | Hall 2 after the vent is on the critical path (the only way to the plant room) and `#b49084` plus flicker was the least readable room | **Fixed:** `#bca89c`, no flicker; the fire is carried by colour on bank B, not darkness |
| M5 | major | "Calm, racks green" after the ESD contradicts COSTLY SUCCESS (bank B lost; `tint_objects` is never cleared) | **Fixed:** after the ESD with a vent: amber LEDs at low alpha, embers on bank B, ambient `#b8b4b4`; with H2 only: amber LEDs; otherwise green |
| M6 | major | SCADA `#929cb2` below the readability floor, darker than sis02's `#aeb6c8` | **Fixed:** `#aeb6c8`, plus a cool pool over the south desk (tile 7.2, 3.6, r 80, 0.5) |
| m1-m3 | minor | Glows without an `EMITTERS` entry need colour, radius and intensity; "off" is `intensity: 0`; alarm glows need `above` in lit rooms | **Fixed** throughout |
| m4 | minor | A `lights` hazard pool barely shows in a lit room; plant clock ambient `#a8aab4` under the floor | **Fixed:** the ESD's own `floorTint` paints the keep-clear box; clock ambient `#aab0bc` |
| m5 | minor | Laptop "armed" needs its own condition; the trigger race is unlit | **Fixed:** red screen while `voltage_neutralised` and `attack_prevented` are false; red pulse during the race (`voltage_fight_started`) |
| m6 | minor | Orange on every Hall 2 batrack burns bank A too | **Fixed:** racks keep sis02's red; the fire sits on bank B only |
| m7 | minor | Hall 1's clock dim applies at once and can be seen through the workshop door | Accepted; `#a8b0c0`, no lower |
| m8 | minor | Light sources missed (inverters, switchgear, PCS, BMS tower, shutter control) | **Fixed:** small steady green status lamps; bypass cabinet and module left dark (a clue) |
| m9 | minor | Line refs; the Hall 2 strobe offset; Vance's "corridor" strobes | Strobe placed on the wall above the extinguisher (offsetY −22) and checked in the shots; the rest noted |

## 9. Cycle 1 (2026-10-13): as implemented

`scenario.json.erb`: the scenario block before `"rooms"` (with a short ERB comment) and one `lighting` block per room on the line after its `"type"`, except the operations office (no block: default `on`). No ink, tags, NPC fields or layout changed.

Phase conditions: `attack_prevented`, `racks_vented`, `hydrogen_alarm`, `crew_warned`, `clock_started`, `esd_authorized`, `voltage_fight_started`, `voltage_neutralised`, all `=== true` / `!== true`, combined with `&&` only.

Found while implementing:

- **`||` isn't supported** by `evaluateGlobalCondition` (`utils/conditional-text.js:72-80`: `&&` only; `a === true || b === true` splits into three parts on `===` and returns false). The first vent tour showed Hall 2's detector amber and the racks green. Each `||` entry is now two entries. Worth a validator check (a proposal, not done).
- **`lights` pools vanish in a lit room** (ADD on a map the tubes already take near white). The bank B fire moved to an emitter on Hall 2's only HV sign (`aes_hv_danger1@360,52`, over bank B): orange `breathe`, offsetY 90, `above`, `floorTint` 0.6. In the vent shot the upper rows of bank B glow orange and bank A doesn't.
- **`aes_inverter` matched the `aes_inverter_sign1` plate** (prefix): a stray green dot on the wall. Keys are now `aes_inverter1` and `aes_inverter2`.

Tours (keyless :3001, `--close-intro --restore-off --check`; globals set directly, so timer actions such as the Hall 2 `tint_objects` pulse aren't in the shots). Every room drew (redraw 300-367 ms) and every variant resolved as designed:

| Tour | Games | Globals |
|---|---|---|
| base | 2249, 2261 (Hall 2 and plant re-shot) | none |
| clock | 2250 | `anomaly_detected, attack_mechanism_known, clock_started` |
| alarm | 2251 | clock + `crew_warned, esd_authorized` |
| h2 / vent / after_vent | 2258 / 2259 / 2260 | alarm + `hydrogen_alarm` / + `racks_vented` / + `attack_prevented, voltage_neutralised` |
| after | 2254 | alarm + `attack_prevented, voltage_neutralised` |

Checks: validator (schema, geometry, door alignment) pass; `check_door_alignment.py` 8/8; route driver 27/27.

Evidence: `build_evidence/lighting_c1/<phase>/`, `tours.log`.

## 10. Cycle 1 visual review (fresh Opus): 0 blockers, 4 majors, 6 minors

| id | sev | finding | outcome |
|---|---|---|---|
| V1 | major | The armed ESD didn't differ from the unarmed one (the pulse's low point was below the steady glow); the unarmed glow turned the yellow housing orange | **Fixed:** unarmed r 16, 0.3, no tint; armed r 44, 1.0, `floorTint` 0.7 |
| V2 | major | The clock phase was invisible (8/255 ambient steps) | **Fixed in part:** halls `#a2aabc`, plant `#a4a8b4` (just under the skill's muddy line; racks and LEDs carry it) |
| V3 | major | The alarm was weak outside the halls (SCADA panel a faint smudge, reception call point, a small Hall 1 strobe) | **Fixed:** SCADA panel r 34, 1.0, plus an ambient step to `#b4aebc` on `crew_warned` (`attack_prevented` first); call points r 32; Hall 1 beacon r 56, 1.0 |
| V4 | major | The Hall 2 strobe sat below the extinguisher in the alarm shots, above it in the h2/vent shots | **Withdrawn:** the alarm tour was shot before the offsetY fix (+24 → −22); the h2 and vent shots were re-shot after it. Radius cut to 26 to stop the bloom on the shared wall strip |
| V5 | minor | The vent read sepia, not fire | **Fixed:** fire glow r 110, 0.8; racks r 36, 0.45; ambient `#c4a290` |
| V6 | minor | The red laptop read as a white wash | **Fixed:** `above`, r 20 |
| V7 | minor | COSTLY SUCCESS looked like base | **Fixed:** LEDs `ledAlpha` 0.8, embers 0.4 |
| V8 | minor | A stray green dot above the INVERTERS sign (clock shot) | **Withdrawn:** that tour predated the `aes_inverter` → `aes_inverter1/2` key fix |
| V9 | minor | Exit-sign bloom crosses the north wall | Left: engine limit (LIGHTING_LOG known limits) |
| V10 | minor | The green panel's glow didn't show | **Fixed:** r 20, 0.8 |

## 11. Cycle 2 (2026-10-13)

The fixes above, in `scenario.json.erb` lighting blocks only. Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; route driver 27/27. Tours on :3001 (`--close-intro --restore-off --check`), every shot drew: base 2262, clock 2264, alarm 2265, h2 2266, vent 2267, race (`voltage_fight_started`) 2268, after 2269, after_vent 2270. Evidence: `build_evidence/lighting_c2/<phase>/`, `tours.log`. Before/after pairs: `tmp/review/m04_lighting_c2_*.png`.

### Cycle 2 visual review (fresh Opus): 0 blockers, 1 major, 6 minors

Cycle-1 findings: ESD, SCADA alarm, call points, Hall 1 beacon, Hall 2 strobe, COSTLY SUCCESS and the green panel are closed. The clock step and the vent are closed in part; the race pulse doesn't read.

| id | sev | finding | outcome |
|---|---|---|---|
| W1 | major | The vent reads as warm fog, not fire: the glow centres in the gap above bank B, and the rack glows warm bank A too (bank B only ~17/255 redder) | For cycle 3: offsetY 90 → ~200, r 85, 1.0, `floorTint` 0.4; rack glow 0.3; ambient `#bca8a0`. A `fire` effect is an engine proposal |
| W2 | minor | The armed ESD's floor tint doesn't reach the keep-clear box | For cycle 3: offsetY ~20, r 52 |
| W3 | minor | The laptop's race pulse doesn't read | For cycle 3: `#ff3b30`, r 28, 1.0 |
| W4 | minor | The amber H2 lamp (the truth) reads weaker than the green panel (the lie) | For cycle 3: `#ff9a2e`, r 16, 0.9 in both halls |
| W5 | minor | The ESD's green after state reads yellow-lime over the orange housing | For cycle 3: `#3dff7a`, 0.45 |
| W6 | minor | Red `above` glows wash pink/white in lit rooms; the reception halo spills past the east wall | For cycle 3: call points r 26. Hue-preserving blend for `above` glows is an engine proposal |
| W7 | minor | The H2 phase is a little grey and flat | Optional for cycle 3: `#b8a8ac` |
| — | — | Clock step still barely shows (~3-4% darker) | Accepted (design review m7: no lower than the muddy line) |

Engine proposals (not done; would go to `DECISIONS_PENDING.md` if wanted): a `fire` emitter effect (irregular breathe under 3 Hz); hue-preserving blending for `above` glows in lit rooms; a validator check that flags `||` in lighting conditions.

## 12. Cycle 3 (2026-10-13)

W1-W7 from section 11, applied as listed, with one change: the fire glow's offsetY is 130, not the suggested ~200. Bank B's rack bodies run from about y 94 to 202 in the room, and the sign's centre is about y 37, so 130 puts the glow on the racks rather than at their feet. COSTLY SUCCESS embers moved with it.

Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; route driver 27/27. Tours on :3001 for the rooms the changes touch, every shot drew: base 2275, alarm 2276, h2 2277, vent 2278, race 2279, after 2280, after_vent 2281. Evidence: `build_evidence/lighting_c3/<phase>/`; untouched rooms are as in `lighting_c2/`.

First look: the vent's orange now sits on bank B, with bank A cooler; the armed ESD's red reaches the keep-clear box.

### Cycle 3 visual review (fresh Opus): 0 blockers, 0 majors, 5 minors

W1 (vent fire), W2 (armed ESD tint), W6 (call points) and W7 (H2 ambient, barely visible) are closed. W3 (race laptop) is partly closed; W4 (the amber H2 lamp still weaker than the green panel) and W5 (the ESD's after-state still yellow over the orange housing) are not closed.

| id | sev | finding | outcome |
|---|---|---|---|
| X1 | minor | H2 lamp still weaker than the lie (the breathe dips it; r 16 under the panel's r 20) | **Fixed (cycle 4):** steady `#ff9a2e`, r 22, 1.0 in both halls ("An amber indicator is lit") |
| X2 | minor | The fire is one round spot on bank B's third rack | **Fixed:** offsetX −12, offsetY 115, r 105 |
| X3 | minor | The race laptop doesn't stand out from the ESD | **Fixed:** r 34, `floorTint` 0.5 |
| X4 | minor | The ESD's after-state is yellow: green added over orange | **Fixed:** green moved to the floor (no `above`, offsetY 22, r 40, 0.5, `floorTint` 0.5) |
| X5 | minor | COSTLY SUCCESS racks keep the engine's green halo under amber LEDs | **Fixed:** an amber glow (r 30, 0.15) on both after-ESD amber entries |
| — | optional | SCADA could dim its screens on the vent | Not done: "the feed has dropped" is the grid feed, not the HMI's |

## 13. Cycle 4 (2026-10-13)

X1-X5 applied. Checks: validator (schema, geometry, door alignment) pass; door alignment 8/8; route driver 27/27. Full tours on :3001, 37 shots, every one drew: base 2283, clock 2284, alarm 2285 (all rooms), h2 2286, vent 2287, race 2288, after 2290 (all rooms), after_h2 2291, after_vent 2292. Evidence: `build_evidence/lighting_c4/<phase>/`.

### Cycle 4 visual review (fresh Opus): 0 blockers, 0 majors, 2 minors (both optional)

X1-X5 closed (X1 for brightness, X3 just; the vent still reads as a glow, not flames, which needs the proposed engine `fire` effect). The whole set judged afresh: mood, escalation, readability of every clue and the route to the plant door, sight cones, flash safety all pass; no new stray glows or bleed beyond the known engine limits (the plant exit sign into Hall 2; Hall 2's strobe faintly at Hall 1's east edge).

| id | sev | finding | outcome |
|---|---|---|---|
| n1 | minor | The Hall 2 H2 lamp got softer and pinker when the alarm came on (salmon r 18 against a cream r 22 base); the amber base clipped to cream over the white housing | **Fixed:** alarm entries `#ff2a1a`, r 26, 1.0, pulse; base in both halls `#ff7a10`, 0.75. Re-shot (games 2293, 2295; `build_evidence/lighting_c4/n1/`) and checked by eye: the base lamp reads amber and still outshines the green panel, the alarm reads as a red step up |
| n2 | minor | Red/amber `above` glows over pale housings wash towards white in lit rooms | Engine proposal (hue-preserving `above` blending), not done |

Checks after n1: validator pass, door alignment 8/8, routes 27/27.

## Phase art: lighting CLOSED (2026-10-13)

| Cycle | Blockers | Majors | Minors |
|---|---|---|---|
| Design review | 0 | 6 | 9 |
| 1 (visual) | 0 | 4 | 6 |
| 2 (visual) | 0 | 1 | 6 |
| 3 (visual) | 0 | 0 | 5 |
| 4 (visual) | 0 | 0 | 2 |

Closed after cycle 4: two rounds in a row found nothing above minor. No engine change was made; the ESD's glow comes from a per-room emitter keyed on its id, so `DECISIONS_PENDING.md` wasn't needed.

Open, as engine proposals only: a `fire` emitter effect; hue-preserving blending for `above` glows in lit rooms; a validator check flagging `||` in lighting (and other global) conditions, which `evaluateGlobalCondition` doesn't support. Accepted: the clock step is subtle (kept above the readability floor); exit-sign and strobe bloom cross shared wall strips (engine limit).

Not yet done: a browser check with a page reload mid-phase (the variants resolve from saved globals at load, as m03 proved), and seeing the Hall 2 `tint_objects` pulse together with the H2 lighting in play. Both fit the stage-8 playtests.

Next in the art order: POV chat backgrounds (`room-pov-background`); lighting is final for them.
