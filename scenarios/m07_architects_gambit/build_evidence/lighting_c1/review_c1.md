# m07 lighting, cycle 1 review

Reviewer: fresh Opus agent, read-only. Sources: `LIGHTING_PLAN.md`, the lighting blocks in `scenario.json.erb` (744, 752, 1632, 1723, 1903, 2040, 2113), `systems/lighting.js` (header, `variantsFor`, `resolveEmitters`, `EMITTERS`), every still in `lighting_c1/{base,armed,expired,saved}/` set against `dressing_c4/`, and the four tour logs. Screen positions are pixels on the 1400x1000 stills (2x zoom, so 1 world px = 2 screen px).

## Summary

The plan suits the story. It keeps night, holds mains power, puts the video wall and countdown in charge of the two control rooms, has the plant hall strike on entry, and uses the vault's temporary fittings for the one faulty panel. Each phase is keyed on a global that the player has just been told about. Nothing on the critical path is lost. The ops key and handover sheet sit in the supervisor laptop's pool (ops base 620-770, 720-760). The badge printer and visitor log are clear on the checkpoint counter. The ATS-1 plate and plant log are lit once the hall strikes, and the ATS green lamp and genset panel mark the dark hall from the door. The signed projection reads on the master desk in every SCADA state. Emitter keys all resolve: `situation_board`, `cascade_countdown_display`, `crisis_control_system` (texture `scada_historian`, no `EMITTERS` match, so the variant's colour and radius carry it), `backup_transfer_switch` (texture is the map's `pnw_ats1`, so the `batrack` LEDs do not attach) and the `pnw_*`/`aes_*` prefixes. The amber and green lamp offsets on ATS-1 land on the drawn lamps (checked at 3x).

Two problems need fixing before close. The red phase glows bloom over the outer wall rims in both control rooms. The countdown sprite says "AWAITING HOST" in every state, which the armed, expired and abort lighting then contradict.

## Findings

### Major

**M1. The red and amber phase glows bloom over the north rim of both control rooms.**
Evidence: `expired/operations_floor-a.png` shows a pink smear on the outer frame above the video wall, around x 700-790, y 200-222. A fainter warm patch sits in the same place in `base` and `saved`. `armed/scada_control-a.png` and `expired/scada_control-a.png` show a pink patch on the frame above the countdown, around x 470-570, y 330-350. The wall strip is short, as the m06 lesson notes. `situation_board` is r 96 at offsetY 18, and `cascade_countdown_display` armed/expired is r 60 at offsetY 8, so each glow centre sits close enough to the rim to spill past it. The neighbour to the north is void, so the leak shows as light outside the building at the climax moment, and it reads as a glitch.
Fix (scenario.json.erb):
- `situation_board` (1636-1638): radius 96 → 72 and offsetY 18 → 30 on all three variants. Keep floorTint, which carries the colour on the floor. If the floor pool then looks too small, add a room `lights` entry on the floor in front of the wall (tile about x 5, y 3, colour per phase is not possible there, so keep it white-warm `#ffd9a0`, r 70, intensity 0.3) and let the emitter carry the colour.
- `cascade_countdown_display` (1907-1909): armed/expired radius 60 → 46 and offsetY 8 → 14; grid_saved and base offsetY 8 → 12. Re-shoot armed and expired and check the frame above the display is clean.

**M2. The countdown display's face is the same in every state and contradicts the lighting.**
Evidence: the strip of the four `scada_control-a.png` stills (x 440-590, y 355-420) shows "SEQUENCE LOADED / --:-- / AWAITING HOST" in base, armed, expired and saved. The object's `textVariants` (2008-2012) say ARMED, then STEP 01 EXECUTED, then ABORTED, "The display has stopped". The light breathes bright red for armed and burns steady for expired while the face still says it is waiting for the host. A light change may only repeat what the player has been told, and here the display itself is telling them something different. The countdown is on the critical-path list for this review. Its text reads correctly on interaction, which is why this is not a blocker.
Fix: this belongs to the dressing and art owner. Add three faces to `make_pnw_props.py`: `pnw_countdown_armed1` (ARMED / EXECUTION PENDING, lit step lamps), `pnw_countdown_expired1` (STEP 01 EXECUTED, first lamp solid, the rest pending) and `pnw_countdown_aborted1` (ABORTED, lamps dark). Put them on the object as `spriteVariants`, using the same conditions in the same order as its `textVariants`: grid_saved, then countdown_expired, then cascade_armed. `rooms.js:676` already swaps textures on a global change, and `lighting.js:447` re-resolves emitters when a texture swaps. Check that the per-room emitter still matches by id (`cascade_countdown_display`), which it will, because ids win over texture prefixes.

### Minor

**m1. On the ops floor, the armed state looks almost the same as the start.**
Evidence: in the ops strip (`base` against `armed`, video wall x 610-925, y 230-330), armed came out a little dimmer than base because the still caught the low point of the breathe. Start is amber 0.55 steady and armed is the same amber at 0.65 breathing. In motion the slow breathe is the only cue, at the opening of the mission's fifteen-minute clock.
Fix: armed variant (1637) to colour `#ff7a1a`, intensity 0.8 and floorTint 0.45, so it is warmer and its peak clearly passes the start state. Leave the start and saved states as they are.

**m2. The expired mimic glow reads as a pink smudge, not as lamps changing.**
Evidence: on `expired/scada_control-a.png`, the mimic board (x 600-790, y 360-410) gets a pink-red flare over its near-white face around x 640-720, and the drawn lamps stay green and red. An additive glow cannot recolour a near-white surface (LIGHTING_LOG, known limits). The display's own text says "One region of the map has gone grey". Under the North American convention, red on a mimic usually means a closed breaker, so red lamps would also say the opposite of "breakers open".
Fix: change the expired `pnw_mimic` variant (1912) to match the text: colour `#c8ccd4`, intensity 0.12, no effect. The lamp glow then drops back, a quiet "gone grey". The other option is to drop the variant and leave the change to the countdown and the video wall.

**m3. The mimic and historian glows wash out the middle mimic lamps, and the abort's green screen does not read as the screen.**
Evidence: on `base`, `armed` and `saved` SCADA, a white-green flare centred about x 690, y 400 covers lamps 4-7 of the mimic. That undoes part of the walk F1 fix, which raised the board so those lamps would show. The `crisis_control_system` glow sits at offsetY -8, on the monitor's top edge, which is the mimic's lamp row. In `saved`, its green merges with the mimic's green, so "the cascade control screen goes green" looks like a slightly bigger mimic flare.
Fix: `crisis_control_system` (1916-1917) offsetY -8 → 2 and radius 36 → 26 on both variants, so the glow sits on the screen face. `pnw_mimic` base (1913) radius 32 → 24 and intensity 0.3 → 0.2.

**m4. The ATS-1 fault blink is not shown clearly, and the green lamp goes out while it runs.**
Evidence: `saved/generator_room-b.png` (lit; ATS x 260-330, y 300-410) shows the amber lamp with no glow, probably the off phase. `saved/generator_room-a.png` shows only a faint orange. Because one emitter shows one variant, the steady green ARMED lamp also goes dark while the fault variant holds. The object text still says "STATUS: ARMED / AUTO -- CONTROL RUN FAULT".
Fix: shoot two stills about 500 ms apart in the saved state, lit, to confirm the blink. Consider radius 10 → 12. Accept the green lamp going dark (the fault takes over), or record it as an engine limit, since one object cannot carry two glows. Not worth an engine change for this.

**m5. The backup server blinks.**
Evidence: `scada_backup_server` (1728) uses `effect: "blink"`. A 1 Hz on-off glow on a prop reads as "interact here" (m06 lesson), but the object's text says "You reach it from the VM terminal, not from here". No glow is visible on the BKP rack in `base/server_room-a.png` (x 895-950, y 430-540), so the entry is also close to a no-op in the lit room.
Fix: `effect: null` and intensity 0.3, or remove the entry (m05 lesson: drop no-op config).

**m6. The checkpoint is barely moodier than the unlit baseline.**
Evidence: `base/security_checkpoint-a.png` against `dressing_c4/security_checkpoint-a.png` are almost the same. `#c4c8d2` sits next to the engine's day default `#c4cad8`. The plan wants this room a little brighter than the rest, and it is, but it shows no sign of night.
Fix (optional): ambient `#bec2ce`, still brighter than the scenario's `#b8bfce`. Keep the counter glow.

**m7. The plan's record is incomplete.**
Evidence: `LIGHTING_PLAN.md` section 7 "Cycles" is empty, and section 4 points to "the cycle log for the values each cycle settled on".
Fix: add the cycle 1 entry: tours 2446-2449, what this review found, and what changed.

## Checked and fine

- Operations floor at start, as found: darker than baseline, desks and consoles readable, the video wall is the room's light, supervisor's desk in its laptop pool. Back-row chair F is gone, with no chair half behind the binder shelves (x 840, y 660).
- Generator hall, dark: the ATS green lamp and genset panel read as indicators, the north-west door and the vault-side doorway can be found, the plant log clipboard is faintly visible, and the server room above and vault below don't bleed into it. Lit: the room looks like itself, a little warmer and dimmer. The ATS cover now stands on the skirting line (x 375-400, feet about y 378, was about 400).
- Server room: cool and readable with Elena present, the cabling note on rack 4 readable, sign and suppression panel steady with no rim bloom.
- Cable vault: cool green-grey, splice lamp and gas detector screen read, Tomb Gamma printout visible beside the splice. The redrawn trench reads as an open slot with a cut orange HV run (checked at 3x: shadow band, lit lip, copper faces). The flicker suits temporary fittings. Reading and the Park conversation happen in overlays, so the dip never sits over something being read.
- SCADA at start and after the abort: the room is moody purple, Mercer, the master desk and the projection read, the historian monitor no longer covers the mimic lamps, and the abort calms the countdown glow as its text says.
- Every phase variant is keyed on the global its text or HaX explains, and the order of the variants is right (grid_saved before countdown_expired before cascade_armed).

## Evidence notes

- The `--check` lines report redraw ages of 300-383 ms, about ten times `REDRAW_MS`. The phase glows did render, so the map drew after the globals were set. This is probably headless load, but a second `--check` sample on the re-shoot would rule out a paused scene.
- Breathe and blink stills catch a random phase, so for m1 and m4 take two frames.

## Counts and verdict

Blockers 0, majors 2, minors 7.

Verdict: not closed. Fix M1 (config only) and pass M2 to the dressing and art owner, or log it as a decision if the faces will not be drawn this pass. Take m1-m5 with the M1 re-shoot, since they are small config edits in the same blocks. Then re-tour base, armed, expired and saved, with the saved ATS shot as two frames.
