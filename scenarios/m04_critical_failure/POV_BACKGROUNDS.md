# m04 Critical Failure: POV chat backgrounds

Stage 6 of `docs/agents/M04_PASS_BRIEF.md`. Skill: `.claude/skills/room-pov-background/SKILL.md`. Done 2026-10-13, after room dressing (closed at cycle 7, `ROOM_DRESSING.md`) and lighting (closed at cycle 4, `LIGHTING_PLAN.md`). Worked example followed: `scenarios/m03_ghost_in_the_machine/POV_BACKGROUNDS.md`.

Working files (raw Gemini outputs, in-chat previews, inventories, helper scripts) are in `build_evidence/pov/<room>/`. Installed files are in `public/break_escape/assets/backgrounds/rooms/`: `<name>_nonpixelart.png` (concept), `<name>.png` (400x400 PixelLab) and `<name>_blended.png` (what the game uses), per the skill.

**Status: the first room (operations office) is pending the user's sign-off** (`DECISIONS_PENDING.md` P1). Per the brief, the other rooms went ahead in the same style without waiting. If the look is rejected, the set gets redone.

## 1. Who talks where

| Room (map) | Conversations that use the room's background | Position | Pins that win over `chatBackground` |
|---|---|---|---|
| operations_office (`room_aes_ops`) | Robert Vance | 50% across | none |
| main_entrance (`room_aes_reception`) | security guard | 73% across | `player_spotted:security_guard` pins `background1.png`; the opening briefing and debrief pin `hq1.png` (fine) |
| battery_hall_1 (`room_aes_hall1`, 20 tiles wide) | Cipher | 60% across | `player_spotted:operative_cipher` pins `background1.png` |
| battery_hall_2 (`room_aes_hall2`, 20 tiles wide) | Relay | 35% across | `room_entered:battery_hall_2` (her main scene) pins `background1.png` |
| plant_room (`room_aes_plant`) | Voltage, Static | 70%, 40% across | `room_entered:plant_room` (Static's main scene) pins `background1.png` |
| scada_control_room, engineering_workshop, security_office, loading_dock | none today | n/a | n/a |

The four `background1.png` pins (a generic purple circuit board) hide the new backgrounds in those scenes. Not changed: the skill leaves pins to the user/orchestrator. Recommendation in `DECISIONS_PENDING.md` P2: drop all four `"background"` lines (m03 dropped the same kind of pin on Terry).

## 2. Look

Night shift at a grid battery plant, after midnight, every room lit (a conversation means someone has walked in): cool white fluorescent light from one or two panels or battens, the rest off, pale silvery haze shafts, cool blue-grey shadows. Colours named in every prompt and relight, no warm words, per the skill. SCADA is screen-lit (glow, no shafts).

## 3. Per room

Gemini model `pro`, a fresh conversation per room (`m04-pov-<room>`), generated from the `pov_prep.py` back-wall strip; one image at a time, each looked at before the next.

### operations_office (Vance): first room, pending sign-off
- Gemini 1, generation: back wall in order (cabinet, corkboard, cabinet, planner, kitchenette with kettle, fridge and microwave, clock), desks with binders and Vance's PC, coat stand, east door at the back of the right wall. Faults accepted: the north door landed on the left side wall (behind the player's portrait; edits can't move doors), the right desk runs front to back. Light flat.
- Gemini 2, night relight: shafts onto Vance's desk and the kitchenette, walls kept pale. Added a small screen on the wall above the kettle (accepted, minor; plausible in an ops office).
- Behind Vance (50% across): the NPC crop shows the second cabinet, kettle, his PC and the kitchenette, which is what stands round him in the map. No view by x needed.
- PixelLab: s500 seed 42 greyed the red cabinets; **s600 seed 42** kept them brown-red. Cabinets still read dark grey-brown in the night light (minor).
- Review sheet: `tmp/review/m04_pov_first_room.png` (tour shot, concept, 400px, blended, game-chat preview).

### main_entrance (guard)
- Gemini 1, generation: matches the map (PPE sign, hard hats and vests, green ALBION sign, clipboards, AED cabinet, CCTV; security desk, kiosk glowing blue, water cooler, call point on the right wall, green floor logo). The speed gates are large in the near foreground (bottom of the frame, mostly cropped).
- Gemini 2, night relight: two shafts onto the desk and floor logo, colours held; the desk monitors stayed dark (minor).
- Behind the guard (73%): clipboards, AED, call point, water cooler, as in the map.
- PixelLab: s500 seed 42 had round haze blotches and a mushy sign; **s600 seed 7** cleaner, ALBION readable.

### plant_room (Voltage, Static): two views by x, two phases
- Gemini 1, generation: back wall in order (exit sign, HV sign, red EMERGENCY SHUTDOWN sign over the yellow ESD station, breaker panel), inverter, switchgear, workbench with a battery module, trestle table with the red-screen laptop, blueprints, yellow floor lines. Faults: the keep-clear hatching became a standing barrier, an extra door on the left side wall, the HV sign moved onto the corner door, haze only under the ceiling.
- Gemini 2, edit: hatching moved flat onto the floor plus the night relight in one call; both worked. **Base concept.**
- Voltage (70%): the room-wide view puts the ESD to his left and the switchgear behind him, as in the map.
- Static (40%): `pov_view.py --suggest` gave shift 0.35. Masked the extra left-wall door into the magenta strip as well (to x=500) and outpainted (Gemini 3): seamless, the left wall now plain with the extinguisher, and the door sits in the back-left corner where the map has it. **Left view.** Static's crop shows the corner door, inverter and ESD.
- Gemini 4, armed relight of the base: strong red glow round the ESD, down the yellow wall and on the hatched floor box; rest unchanged. **Armed view.**
- Armed left view: no Gemini call. A PIL composite of the armed concept shifted 0.35 with the outpainted strip from Gemini 3 (feathered seam at x≈520). Seamless by eye.
- No after-ESD view: no one talks in the plant room after `attack_prevented` (Static's mapping skips it; Voltage is dealt with by then), and the base view shows there.
- PixelLab: s500 seed 42 put a red halo round the unarmed ESD (blurring base vs armed) and blotches in the armed view; **s600 seed 7** for all four. Base keeps a faint pink halo, armed is clearly redder.

### battery_hall_1 (Cipher): span
- Wide room (20 tiles): `pov_prep.py --span 144 464` (the inventory's suggestion for Cipher).
- Gemini 1, generation from the span strip: the rack block stands out on the floor as an island with a walkway behind it (drum and PPE cabinet visible), junction box and green cabinet mid-frame, the green digital status panel and the AMBER H2 lamp on the wall, the right bank entering at the edge. Faults: an invented steel column mid-wall, no haze.
- Gemini 2, relight with "remove the column" riding along: both worked.
- Behind Cipher (60% of the room, ~75% of the view): the green panel ("the lie") and HV sign to his left, the junction box beside him, the amber H2 lamp ("the truth") behind his shoulder, as in the map.
- PixelLab: the green panel goes faint at 400px with s600 at both seeds (42, 7); the blend restores some green. Kept **s600 seed 7**. Minor.
- One view only; Cipher is the only NPC and doesn't patrol.

### battery_hall_2 (Relay): span and a vent phase
- `--span 0 320` (suggested for Relay at 35%).
- Gemini 1, generation: H2 detector, fan, ACTION poster, RACK BANK A sign, control panel, the open BMS bypass cabinet, rack bank A as an island with tape, cable drum, bank B entering at the right edge. Faults: an extra door near the camera on the left wall (behind the player's portrait; accepted), bank A only about three racks wide.
- Gemini 2, night relight. **Base.**
- Gemini 3, vent relight of the base: orange firelight and smoke from the right (bank B is just out of frame), every rack LED red, the H2 lamp red with a halo, the left side still cool. A small flame shows at the top right edge (accepted). **Vent view**, shown while `racks_vented` and not `attack_prevented`.
- No H2-only view: the H2 phase is mostly a red lamp and LEDs, and an H2 image would need its own call; the base view shows then.
- Behind Relay: bank A racks, ACTION poster and the tape; the player's half shows the open bypass cabinet.
- PixelLab: **s600 seed 42** for both.

### scada_control_room (no NPC)
- Gemini 1, generation: matched first time: alarm panel, mimic board with green/green/amber/red lamps, clock, network poster, console with blue monitors, two chairs from behind, both side doors at the back corners, filing cabinet and UPS, the near desk with papers. Screen-lit with ceiling panels off; glow, no shafts (the skill's rule for screen-lit rooms). No relight.
- PixelLab **s600 seed 42**: walls came out a little warmer than the concept (minor).

### engineering_workshop (no NPC)
- Gemini 1, generation: corner door, tool pegboard, network poster, clock, PPE sign, cable-filled network rack and server rack, desk with blue PC and the white flag terminal, yellow briefcase, taped-off workbenches, shelves, extinguisher, side desk with cables. The main desk sits against the back wall, not 1.6 m out (minor). No haze.
- Gemini 2, night relight: shafts onto the desk and the benches. PixelLab **s500 seed 42**.

### security_office (no NPC)
- Gemini 1, generation: hooks with vest, hat and radio, eight CCTV monitors in two rows, key cabinet, radio charger, rota board, desks, padlocked filing cabinet, binders desk, kettle and mugs, fridge, call point on the left wall. The door landed on the left side wall (known limit); the DVR became wall-mounted (minor).
- Gemini 2, one-panel relight: a clear beam and a pool on the carpet by the chair. PixelLab **s500 seed 42**.

### loading_dock (no NPC)
- Gemini 1, generation: exit sign, shutter control box, LOADING BAY 1 shutter with hazard stripes, beacon, clipboard, dock plate with the brown holdall and the note, pallets of modules both sides, compressor and extinguisher on the right, the west door at the back of the left wall, one batten on with a shaft. Four bollards instead of two (minor). No relight. PixelLab **s500 seed 42** (the beacon reads red).

## 4. Wiring (`scenario.json.erb`, one `chatBackground` line or block after each room's `"type"`)

| Room | `chatBackground` |
|---|---|
| main_entrance | `m04_main_entrance_blended.png` |
| operations_office | `m04_operations_office_blended.png` |
| scada_control_room | `m04_scada_control_room_blended.png` |
| engineering_workshop | `m04_engineering_workshop_blended.png` |
| security_office | `m04_security_office_blended.png` |
| battery_hall_1 | `m04_battery_hall_1_blended.png` |
| battery_hall_2 | `[ {condition: racks_vented === true && attack_prevented !== true → _vent}, {base} ]` |
| plant_room | `[ armed x 0.55–1, armed_left x 0–0.55 (condition: esd_authorized === true && attack_prevented !== true), base x 0.55–1, left x 0–0.55 ]` |
| loading_dock | `m04_loading_dock_blended.png` |

Conditions use `&&` only (the evaluator doesn't support `||`; `LIGHTING_PLAN.md` section 9).

## 5. Checks

- Validator (`--skip-ink --no-graph`): schema passed, geometry and door alignment OK, no chatBackground warnings (the condition checks pass: both globals exist). The 12 other notices are the existing set.
- Route driver `scripts/ink_runtime_check/m04_routes/route.js`: 27 of 27 routes pass.
- Browser (keyless :3001, headless, `tools/playtest/chat-background-shot.sh`, one session per room, each stopped by the script; screenshots looked at): every room resolved its own file, `(loaded)`.

| Room / NPC | Resolved |
|---|---|
| operations_office / Vance | `m04_operations_office_blended.png` |
| main_entrance / guard | `m04_main_entrance_blended.png` |
| battery_hall_1 / Cipher | `m04_battery_hall_1_blended.png` |
| battery_hall_2 / Relay | `m04_battery_hall_2_blended.png` |
| plant_room / Voltage | `m04_plant_room_blended.png` |
| plant_room / Static | `m04_plant_room_left_blended.png` (view by x) |
| scada, workshop, security, dock (NPC borrowed by the script) | each room's own file |

Phase views, with a scratch copy of the same script that sets the globals in the page before the chat opens (`build_evidence/pov/phase-shot.sh`; the resolver reads live globals). Not a reload test: m03 already proved condition views after a reload.

| Globals | NPC | Resolved |
|---|---|---|
| `esd_authorized` | Voltage | `m04_plant_room_armed_blended.png` |
| `esd_authorized` | Static | `m04_plant_room_armed_left_blended.png` |
| `racks_vented` | Relay | `m04_battery_hall_2_vent_blended.png` |
| `esd_authorized, attack_prevented` | Voltage | `m04_plant_room_blended.png` (armed view drops out) |

Screenshots: `build_evidence/pov/shots/`; sheets in `tmp/review/m04_pov_in_game_all_rooms.png`, `m04_pov_in_game_phase_views.png`, `m04_pov_all_backgrounds.png`.

## 6. Calls used

| Room | Gemini | PixelLab |
|---|---|---|
| operations_office | 2 | 2 |
| main_entrance | 2 | 2 |
| plant_room (4 views) | 4 | 8 |
| battery_hall_1 | 2 | 2 |
| battery_hall_2 (2 views) | 3 | 2 |
| scada_control_room | 1 | 1 |
| engineering_workshop | 2 | 1 |
| security_office | 2 | 1 |
| loading_dock | 1 | 1 |
| **Total** | **19** (of a 30 cap) | **20** |

## 7. Open (minor, accepted)

- Doors on side walls where the map has a corner door: operations office, security office (behind the player's portrait). An extra side door in Hall 2 (also behind the player).
- Hall 1's green status panel reads faintly at 400px.
- The unarmed plant room keeps a faint pink halo round the ESD in the 400px file.
- No H2-only view for Hall 2, and no after-ESD view for the plant room (section 3).
- Pins: `DECISIONS_PENDING.md` P2.
