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

Updated after pass 2 (2026-10-08).

- Light from a lit room's panels can still cross a side wall into a lit neighbour. Into a darker neighbour it is covered, because darker rooms draw later. The torch is drawn with the player's room, so a darker neighbour covers its leak.
- Fixed in pass 2: LEDs over characters (they hide behind a figure in front), glows over characters in lit rooms (they sit at the object's depth), a north room's ransom tint on the south room's back wall (lit rooms draw north to south).
- In a dark room, glows still draw above the map and only fade when a figure covers their centre (racks: when a figure overlaps their inner circle). A player right in front of a lit rack picks up a little green from the rack's light on the map; accepted as realistic.
- Emitters match on texture key; a scenario can override or add one per room by object id or texture prefix (`emitters`). Map-generated ids (e.g. `main_office_area_office-misc-lamp3_90`) change if the map's object order changes.
- Glows can't colour a near-white lit room by adding light. Use `floorTint` (a multiply stamp) or `above` (draw above the map) for colour that must show in a lit room.
- After a reload, motion rooms the player had lit start dark again and strike on re-entry; lighting state isn't saved.

## Pass 2: m02 review, sis02, sis01, m01 (2026-10-08)

Brief: `docs/agents/LIGHTING_PASS_BRIEF.md`. Plans in each mission's `LIGHTING_PLAN.md`.

### sis02_energy (2026-10-08)

- Mood: end of a night shift, 06:28 Saturday (`scenario.json.erb:63`, `information_pack.md:755`); reuses m02's night ambient `#b8bfce`, which stays above the readability floor.
- Lighting must not hint that anything is wrong: the scenario's point is that every display looks normal (`scenario.json.erb:13`).
- User approved (D1): `emitters` added to the room lighting block in `scripts/scenario-schema.json`, so a room can override an object's glow without changing other missions.
- User approved (D2, this pass): glows that follow game state (e.g. the alarm panel after the hydrogen advisory). Condition: it only repeats what the player is already told, never carries information on its own.
- Review M1 accepted: thermometer, alarm panel and ESD glows fixed globally in EMITTERS (the old pulses don't match the art in m02 either); the per-room schema key carries D2 only.
- Review M2 folded into D2: batrack LEDs and glow follow the H₂ advisory tint (`scenario.json.erb:420-428`), so green LEDs don't work against the red.
- Review m4 accepted: under reduced motion, emitter shimmer and LEDs hold steady.
- `network_architecture` glows as a screen: the scenario calls it "a wall-mounted display" (`scenario.json.erb:1117`) and its art is a backlit panel (review m3).
- Alarm panel's default variant is green, not the new warm-neutral global, because sis02's text says "mostly green" (`:1036`).
- D3 (rack tint lost after a reload mid-advisory, `ui/scenario-timer-dispatcher.js:71-78`): outside lighting; accepted for this pass, filed in the backlog.

- Visual round 1 (2 majors): the lit control room matched its lighting-off baseline because ceiling panels saturate the map; control room gets `panels: false` and the video wall as its main light (radius 120, intensity 0.7). Alarm amber/red variants raised so they show; they only repeat the radio calls.
- No amber LEDs on battery racks in the normal state: a student team could read them as rack warnings in a mission whose clue is one rack's temperature.
- Panel saturation passed to the m02 engine round as a general fix (it would also explain why m02's colour change barely showed).
- H₂ tint's alpha pulse (racks look see-through, hard-coded at `apply-actions.js:126`) kept: it is the scenario's own warning cue, not lighting, and the effect is minor.
- Visual round 2: nothing above minor. Round 2 applied anyway (the brief asks for two): video wall `floorTint` 0.35 and a longer throw so it reads as the room's light; control room ambient `#aeb6c8`; `floorTint` 0.5 on the amber/red alarm states; smoother light texture to remove the ceiling-pool rim (engine).
- Noticed, not lighting: a solid black open doorway in the control room's north wall; Helen's NPC id is still `priya_chandra` (the rename-ids rule). Reported to the user.
- Visual round 3: nothing above minor, so sis02's rounds stop (two improvement rounds run). Applied two one-line minors: workshop rack LEDs green only (the amber-lit rack is the attacker's jump server, seen before the logs say anything; same rule as the hall), and the evacuation/tamper pulse radius 40 → 32 so the halo stays on the panel.
- Tour follow-camera option: backlog, not this pass (manual shots cover it).

### m02_ransomed_trust (2026-10-08)

- User approved (P1, this pass): generator brownout, a scenario action that dims every lit room once and recovers, fired by an ink tag at the guard's "a generator changes note" line (tag only, no spoken-line change).
- User approved (P3, this pass): `--player` option on `tools/playtest/lighting-tour.sh` so tours show the torch and glows over a character.
- Mood: 4 am on generator power, "the lights run amber" (`ink/m02_npc_receptionist.ink:66`); lit ambient moves from cool `#b8bfce` to amber `#c6beac` (fallback `#c0bdb2` if teal art turns olive).
- Review M1: ransom screens glow red while `ransomware_deployed`; the EHR terminal goes back to blue on `ward_recovering` through an `emitters` variant. P4 withdrawn: `ransomware_display` never unlocks (`unlock-system.js:296-329`), so a lock-based check could never fire.
- Review M2: a faulty panel's dip no longer dims the whole room (both m02 flicker rooms have one panel); flicker stays in storage and the vestibule.
- Review M3: glows try the object's own depth so characters in front cover them; partial fade as fallback. LEDs hide where a figure covers them.
- Review M4: glow alpha also scales with how dark a lit room's ambient is (C2's colour change alone did almost nothing).
- Review M6: WebGL scissor dropped (3.60 disables it during capture); torch leak fixed by redrawing neighbours, lowest priority.
- E8 dropped: the tour leaves rooms on, which explained the bright neighbour.
- P2 merged into the `emitters` key with object-id matching, rather than a new object key. Bed 4's dark monitor stays out (shared map sprite, would need new art).
- Corridor `offAfter` 75 s rather than 45, as the player crosses them often and each relight replays the strike.
- Left alone: Val's vision cone drawing over the lighting (outside lighting).
- Round 0 (engine + config) done: emitter data model with per-room variants (object id, then texture prefix), ransom-screen red breathe, glows at object depth behind characters, LEDs hidden behind figures, faulty dip limited to its panel, panel colour from the ambient, strike sound by distance, `offAfter` waits for NPCs, torch drawn with the player's room so a darker neighbour covers its leak, `lighting_dip` action and ink tag (`m02_npc_security_guard.ink:216`, tag only). C5 (Dr Kim's lamp) dropped: invisible in a lit room. Screens and racks hold steady during the brownout, as if on UPS.
- Visual round 1 (3 majors): glows under the light map lost the dark server room's bloom; ransom red invisible in lit rooms; lit server room still office-like. Sent back with the sepia, kiosk-offset and khaki-ward minors. Skipped door pools in dark rooms (motion rooms light on entry).
- Round 1 done: glows above the map again in dark rooms (fade only when a figure covers the centre); racks exempt from de-clustering; ransom screens stamp a red multiply tint so they read in lit rooms; panel add capped by the ambient's headroom (`PANEL_HEADROOM` 0.8) so a lit room's mood colour shows; lit ambient now `#c0bdb2` (less sepia than `#c6beac`), panel light 60% towards white; ward `#b8b4a8`; server room `#a0b0c0` with green `floorTint` in front of the racks.
- `floorTint` accepted as a field of the user-approved `emitters` key (schema `emitterVariant`).
- Rack glow tinting a player standing in front of it in the dark: racks (emitters with LEDs) will fade on figure overlap; screens keep the centre test so desk screens stay bright.
- Visual round 2 (1 major): ransom red invisible on IT's infected terminal, weak at Dr Kim's PC (lamps probably counted in screen de-clustering). Minors sent: warmth moved into the panel light (`PANEL_WHITE_MIX` 0.6 → ~0.35, global), vitals-monitor glow offset onto the screen, Bed 2 pool stronger, one small light in the dark vestibule. Skipped a darker lit server room: the dark state carries it.
- Round 2 done: ransom screens never damped and grow to radius 56 in lit rooms (IT red-pixel count 387 → 1,627); racks fade on figure overlap; `PANEL_WHITE_MIX` 0.35; vitals-monitor glow on the screen; Bed 2 pool 0.6; exit-sign light in the vestibule; smooth light texture ((1−t²)^2.7, same total light).
- Accepted: a player standing right in front of a lit rack picks up a little green from the rack's light on the map. It's realistic, and the LEDs and glow sprite no longer draw over the figure.
- sis02 battery-hall "pool rim" is in the floor art, not the lighting (shown with the light map hidden); left alone.
- Visual round 3: nothing above minor, so m02's rounds stop (two improvement rounds run). Applied two one-line minors: the manual BP cuff (an aneroid cuff, "doesn't need the network", `scenario.json.erb:1890`) no longer glows, and the vestibule's light is a neutral door pool rather than a green light with no sign above it. Left: reception kiosks louder than Bernie's PC (fits the thriller), IT's red slightly below the screen (an id variant would have to restate the built-in ransom glow), amber mostly showing in reception (the blue-grey carpet art keeps other rooms neutral; they're 7–25% darker than before, which is the moodier part).

### sis01_healthcare (2026-10-08)

- Mood: 07:30 Tuesday, day shift after a bad night, mains power (`scenario.json.erb:9`, `:130`, `:141`; `information_pack.md:2157`). Engine default ambient; all three rooms `on` (people in each, and students spend long in each). Doesn't copy m02's 4 am night ward: different hour.
- Built-in ransom red kept (two screens; the text says "red text" and "casts a red glow", `:1388`, `:2066`). Bed 4's monitor gets a red alarm glow that repeats its text (`:1616`, `:1620`).
- User decision (P1, not lighting): the two ink lines that put the ICO tablet "by the window" now say "the ICO tablet on the conference table" (`npc_hartley.ink:209`, `npc_helen.ink:91`). tagdiff: structure unchanged. Two spoken lines need new audio (Hartley, Helen Carver).
- Browser checks: sis02 8/8 pass (game 1814, `tools/playtest/sis02-lighting-check-session.jsonl`); H2 exercised by winding the timer. m02 7/9 (game 1813, `tools/playtest/m02-lighting-check-session.jsonl` + `-part2`): talk icons in the dark not exercised; the brownout not reached through the conversation, so a targeted run follows. After a reload, motion rooms the player had lit start dark again and strike on re-entry: accepted, lighting state isn't saved.
- Committed: engine 273d6261, sis02 dfac2abc.
- sis01 review m1: the IT office's ransom tint reaches the ward's back wall because the player's room draws first among lit rooms; fix: north before south among fully lit rooms (engine, separate commit before sis01).
- m02 brownout checked from the real conversation (game 1816, `tools/playtest/m02-brownout-check-session.jsonl`; `cover_burned` and `staff_lanyard_obtained` set by console): the tag queues the dip, it waits for the chat to close, then one dip to 0.5 and back over ~1.6 s. Following lines and choices unaffected. m02 committed eda5423a.
- Engine 5c8efcfc: fully lit rooms draw north to south, so a north room's ransom tint no longer lands on the south room's back-wall strip (sis01's IT office over the ward). Torch unaffected (it only draws below level 1). m02 and sis02 re-rendered within 2 per channel.
- sis01 visual round 1 (1 major): Bed 4's alarm glow invisible in the lit ward (glows under the map can't show red there). Engine: `above` flag on emitter variants for small indicators that must show in a lit room; Bed 4 uses it. A field of the user-approved `emitters` key, like `floorTint`.
- Kept: infected PC's red sits on the trolley, matching "casts a red glow over the trolley" (`:2066`).
- Taken: a slightly warmer ambient (`#cccbd2`) in the IT office and incident room for the morning; the ward stays at the default.
- Noticed, not lighting: Bed 4's monitor sprite still shows a green trace after the patient dies (art or text variants); and `bed2_vitals` always reads "STABLE" though Bed 2 can go critical (review m6). Reported to the user.
- Engine 352c106b: `above` variants. sis01 improvement round 1: Bed 4 alarm `above`, intensity 1.0 (pulses before, steady red after the death); IT office and incident room ambient `#cccbd2`. m02 and sis02 unchanged (within 1 per channel).
- sis01 visual round 2: nothing above minor. Improvement round 2 (the brief asks for two): IT office and incident room ambient `#d2cdc8` (`#cccbd2` moved the floor only ~4 per channel); Bed 4's glow radius 20, offsetY −26, a small indicator at the top of the screen as its text says. Accepted: ransom red tints the MAR charts beside the station PC (still clear, repeats the text); soft pools round the bedhead units.

### m01_first_contact (2026-10-08, added by the user mid-pass)

- No ink or spoken-line changes (cached audio), not even tags.
- Mood (designer): end of a working day on mains power; engine default ambient (`ink/m01_derek_confrontation.ink:39` "Working late"; nothing gives an hour or a power problem). Under review.
- L1 decided: no brownout in m01. Nothing in its story explains one, so it would read as a hint that leads nowhere.
- sis01 visual round 3: nothing above minor, so rounds stop (two improvement rounds run). Polish applied: Bed 4's indicator deeper red (`#ff2414`; `#ff5a4a` clipped to pink-white on the pale floor) and offsetY −20 so it sits on the bezel.
- Review: approve with minors. Mood kept at the engine default: no hour is given and the cues conflict (morning voicemail, "T-72 hours", "working late"), and m01's tension comes from its nine motion rooms.
- Reception phone's blinking message light kept as a gentle signpost to a critical-path clue: the phone's own text says its light is blinking (`scenario.json.erb:1130`). Tuned in the visual round so it shows in a lit room.
- Engine E1: an NPC counts as in a room by its feet inside that room's fill area, so Sarah at reception no longer lights the main office.
- sis01 browser check 7/7 (game 1835, `tools/playtest/sis01-lighting-check-session.jsonl`; Bed 4's steady state set by console). sis01 committed ac923d31.
- Engine c0092c83 (E1): NPCs trip a sensor by their feet on the room's own floor. m02, sis01, sis02 re-rendered: same on/off states, within 3 per channel. m01 config applied (motion in nine rooms, west-hallway flicker, phone message lights); visual round 1 next.
- m01 visual round 1 (1 major): phone message lights don't read as blinking in a lit room (blink swings only 0.7–1.0; pale keys turn the red pink; glow off the key). Engine: `above` variants blink on/off (~1 Hz), new `offsetX`. Config: deeper red, small radius on the key. Minors taken: main-office lamps at 0.6 (blown-out desks in the dark), hallway `darkAmbient` `#161c30` so doors are findable. Left: dark storage closet (nothing in the art to glow), Derek's plant (dressing). West-hallway flicker reads (~13–15% dip) despite its panel sitting on the strip.
- m01 improvement round 1 done; engine a4ec046e (on/off blink for `above` variants, `offsetX`). Phones blink on the red message key (two different sprites, so different offsets); main-office east lamp tamed by object id (`main_office_area_office-misc-lamp3_90`, a map-generated id: update it if the map's object order changes). Rack blink in m02/sis02 unchanged.
- m01 visual round 2: nothing above minor. Improvement round 2: conference-room lamps at 0.6 (table washed out in the dark), Patricia's phone light radius 7, intensity 0.8 (it turned her pale keypad pink when lit). Storage closet left dark (lights on entry).
- m01 visual round 3: nothing above minor, so rounds stop (two improvement rounds run). Polish: Patricia's phone light radius 5, intensity 1.0 (a point on the key rather than a pink tint when lit).
- m01 browser check 7/8 (game 1852, `tools/playtest/m01-lighting-check-session.jsonl`): motion rooms dark until entered (main office dark with Sarah at reception), people rooms lit, torch, icons, both phone lights blink, flicker under the flash limit, reload clean. Partial: the IT room, Maya's office, Derek's office, storage and server room weren't reached in 10 minutes; all were covered by three tours. m01 committed b105f391.

### lab_tesseract_trials (2026-10-08, user request after the pass)

- Kind of game from `docs/agents/TESSERACT_TRIALS_BRIEF.md`: lab with spy framing, first-year students, CyberChef puzzles. Lighting adds atmosphere but must not make reading harder or touch a puzzle.
- Other files in the folder have someone else's uncommitted edits; this work touches only `scenario.json.erb` and `LIGHTING_PLAN.md`, committed by explicit path.
- Plan: freshers' week afternoon into evening, engine default (`ink/opening_briefing.ink` "bunting on the portico"; `closing_debrief.ink:36-37` "eleven minutes past six"). People rooms lit (lecture theatre at `#b8bfce`, house lights half down for Tom's slides); lab, library, Special Collections, corridor (`offAfter` 75) and Dr Selvarajan's office (one faulty tube) on motion. New projector-screen emitter; lab PCs at 0.4 so the puzzle PCs don't stand out; fire-alarm call points off in the dark corridor and office (a lone red pulse would read as a clue). The Byte Wall stays a fixed prop, not tied to lighting. Under review.
- Review: approve with minors, all taken: no flicker in Dr Selvarajan's office (students would chase the only moving anomaly, and its panel sits on the common room's back-wall strip); projector emitter at the rendered lab values (72/0.5/24); lab lamp 0.6 as in m01; lecture theatre described as slightly dimmer. Call points switched off per room, not globally: the only other lit motion room with one is m02's server room, which wants its red.
- Engine 2f228f81: projector screens glow (only the uni lab and lecture maps place them). Config applied (7 lines) by the orchestrator; visual round 1 next.
- Tesseract visual round 1: nothing above minor. Improvement round 1: projector pool onto the wall (offsetY 8) so the front PC row isn't lifted in the dark; lab laptop at 0.4 like the PCs (it was the brightest spot, on a decoration desk); scenario ambient `#d2cdc8` (warm daytime, as sis01), because cream walls went neutral grey. Accepted: puzzle papers sitting in a desk's glow in two dark rooms (natural, and only before the lights strike); call-point halo in lit rooms.
- Tesseract visual round 2: nothing above minor (front lab row now 67 vs 62–63). Improvement round 2: lecture theatre ambient `#c0bab4` (`#b8bfce` read as a cold grey room beside the warm ones; same brightness, warm hue); the decoration laptop beside Tom at 0.4, because the first objective is "get a lab laptop from Dr Shaw" and a glowing laptop beside him invites the wrong click. Skipped: staff-office PC brighter than its neighbours (lit room, not a puzzle object).
- Tesseract visual round 3: nothing above minor, so rounds stop (two improvement rounds run). Polish: no glow on the decoration laptop beside Tom, lab decoration lamp 0.4 (the first lit-looking thing through the lab door was a desk where nothing happens).
- Tesseract browser check: no failures (game 1867, `tools/playtest/tess-lighting-check-session.jsonl`); staff office, common room, workshop and the Byte Wall's contents weren't reached in 10 minutes (covered by three tours). Committed 96fd31ec.

### User feedback (2026-10-08)

- "Main area rooms a little more brightly lit": Tesseract foyer ambient `#eeebe4` (mean 165 → 176 against 183 with lighting off); m01 main office lit ambient `#e4e8ee` (105 → 109, lighting off 108).
- Tesseract staff room has windows along the top wall: ambient `#e8e4dc` plus daylight pools under the three windows (tiles x 5.3, 9.5, 13.8). The room now matches its lighting-off brightness (103), so the pools can't show as patches: a lit room can't go brighter than its art. Visible window pools would need the rest of the room darker.
- Rule of thumb for the skill: a room's busiest public space (a foyer, an open-plan office) sits near full brightness; moodier settings belong in side rooms and corridors.

### m03_ghost_in_the_machine (2026-10-12, m03 pass 2, lighting cycle 1)

- Plan `scenarios/m03_ghost_in_the_machine/LIGHTING_PLAN.md`. Afternoon visit then eleven at night in the same building; night keyed on `clone_call_done`. All `room_zds_*` types new; reuse by role (m02/m01 server block, m01 `#e4e8ee` lobby, m02 corridor `offAfter` 75).
- First `dark` room in a lit mission: Danny's office ("sitting in the dark"), lamp glow only at night via an emitter condition.
- m03-only props glow through per-room emitter variants (counter strip, threat map, marketplace board, CEO desk lamp painted on the desk sprite, cabinets); no `EMITTERS` change.
- Found: a `floorTint` stamp as the frame's last draw blanks the whole light map (rooms render unlit). Proposed fix in m03 `DECISIONS_PENDING.md` L2; may affect m01/m02/sis01/sis02.
- Limit hit: room mode and ambient can't follow game state. Proposal (room `variants` with a condition) in m03 `DECISIONS_PENDING.md` L1.
- The stock tour stalls on missions whose opening briefing and tutorial prompt stay up (scene paused, map not drawn); m03's scratch tour (`build_evidence/lighting_c1/tour.py`) handles both.
- Cycle 2 (engine, at the coordinator's instruction): **L2** the light map now ends each frame on a no-op additive stamp, so a `floorTint` stamp drawn last no longer blanks it; m01, m02, sis01, sis02 and Tesseract re-toured before/after: same on/off states, pixel differences only from blinking LEDs, pulses and walking NPCs. **L1** room lighting `variants` with a condition (schema, node test `test/js/lighting-room-variants.test.mjs`); missions without variants re-toured: unchanged. **L3** NPC torch via `behavior.torch` (schema, node test `test/js/lighting-npc-torch.test.mjs`); strength from the room's current ambient, so it never shows in a lit office. Tour flags `--close-intro`, `--globals`, `--show-npc`, `--restore-off`, `--check` (skill Step 5).
- Not yet exercised: a page reload at night with variants (blocked in the agent session; needs a tester).
- Cycle 4: **E4** vision cones above the light map (`npc-los.js`, overlayDepth rule against the light map's depth). m03 closed: final tours with final maps and sprites, nothing above minor.

### m06_follow_the_money (2026-10-13, m06 pass 5, lighting cycles 1-4)

Plan and log: `scenarios/m06_follow_the_money/LIGHTING_PLAN.md`. Night (`#b8bfce`). Rooms: lobby on, warm `#c4b8a6`; checkpoint on; trading floor on `#b2b8c8` (market wall `above`, r 80); Irina's office motion `#bcb6aa` (banker's lamp); lab on `#b0b8c6`; server room and data centre motion, cyan `#a8c2ce` / `#a2bac8`, darks `#0a0f1c`; executive wing on `#bcb6b0`, `panels: false` (gallery sconces); Satoshi's office on `#b6aea6`. All `hce_*` props glow through per-room emitters (no `EMITTERS` change). Phase glows: the custody console by id (cyan, amber pulse on `console_warned`, steady red on `console_tripped`, green on `found_architects_fund`); `assets_seized` turns the ticker, the market wall and Satoshi's block screen red. No room variants, no torches, call points off.

Lessons:
- `blink` with `above` is a hard 1 Hz on/off, m01's signpost for an interactable; on props it reads as "interact here". Use `breathe` or steady.
- An additive glow on a near-white sprite adds nothing; light the darker parts round it (the cage panels, not the white mesh door).
- Wall-strip signs and screens are short: the glow centres on the sprite, so anything over about r 24 blooms over the rim into the room to the north. Use offsetY 4-6 and small radii.
- Additive glows don't show on bright screens or pale floors in a lit room; a story change on a screen wall needs `above` plus `floorTint`, or a dark surface to land on.
- Proposal: rack-style LEDs for `hce_*` props (m06 `DECISIONS_PENDING.md` D9).

### m05_insider_trading (2026-10-13/14, m05 pass 5, lighting cycles 1-5)

Plan and log: `scenarios/m05_insider_trading/LIGHTING_PLAN.md`. Evening, about 16:30 to 20:15 (scenario ambient `#c6c4c8`). On: lobby `#d2d0d0`, corridor, break room `#ccc4b8`, open office, lab `#ccd2dc`, Patricia `#c4bec4`. Motion: server hallway (dark `#121828`), server room `#b2b2c8` and vault `#b0b2c2` (darks `#0a0f1c`), Torres' office `#c4bcb0` with his desk lamp left on. Room `variants` (as m03, here keyed on a story beat): at `torres_identified` (about 20:00, past the badge log's 19:00 after-hours line) the lobby goes to `#b0b8ca` with `panels: false`, the corridor to motion with `offAfter` 75 and dark `#161c30`, and the server hallway, server room and vault to `on` (Patricia: "His badge just went through the hallway and the vault's logged him in"). The upload terminal (texture prefix `pc` in the vault, the only PC there): engine screen glow, then amber breathe while it runs, steady red once `final_choice` is set. All `qdc_*` props through per-room emitters; no `EMITTERS` change. Call points off; suppression panels steady.

Lessons:
- A good switch for a lit-room variant is a global set inside a conversation whose own words explain the change ("his badge just went through the hallway"). The chat covers the screen while the variant lands, so the missing strike isn't seen, and the player has been told why.
- `motion` as a variant for a corridor works as "after hours": the corridor goes dark at once if the player isn't in it, and strikes the next time they walk through. A small ambient step on a lit room (the lobby, `#b8bfce` against `#d2d0d0`) barely shows; `panels: false` plus about 25 per channel does.
- Emitter `offsetX`/`offsetY` are world pixels. At the tour's 2x zoom they move the glow twice as far on screen, so halve what you measure on a shot.
- Glows on props in a room that is always lit only show if the prop is dark (sign faces, rack fronts). Cool glows on pale lab kit, a TV on a sage wall and a glass case did nothing or made a flare; drop them rather than keep no-op config.
- A glow on one item of a set (one locker in a bank of key safes) reads as "this one matters". Light the whole set or none of it.
- The resume overlay still makes the harness's `bootstrap` loop after a reload (playtest skill note). For a reload check, click the overlay's "Resume" button by its exact text in an `eval`, then poll for `window.lightingSystem`.
- Proposal: LEDs for `qdc_*` racks and HSMs (m05 `DECISIONS_PENDING.md` D16, the same limit as m06 D9).

### m07_architects_gambit (2026-10-14, m07 pass 5, lighting cycles 1-5)

Plan and log: `scenarios/m07_architects_gambit/LIGHTING_PLAN.md`. A grid control facility at night in winter, mid-evacuation, on mains all night (scenario ambient `#b8bfce`). Checkpoint on `#bcc2ce`; ops floor on `#aab0c2`, `panels: false`, the amber video wall as its light (emitter r 60 plus two room `lights` under the wall's ends); server hall motion `#a0b0c0` / `#0a0f1c` (Elena keeps it lit); SCADA on `#aaa4b6`, `panels: false`, lit by the countdown display; generator hall motion `#bcc0b8` / dark `#121828`; cable vault on `#a8b4b0` with one faulty fitting. Phases on saved globals: `cascade_armed` (wall breathes orange, end lights step orange through a room variant, countdown breathes red), `countdown_expired` (countdown steady bright red, mimic dims grey; the wall stays orange because its art and text stay amber, L1 pending), `grid_saved` (countdown dim and steady, cascade screen green). ATS-1's lamp blinks amber on the same condition as its text variant. Countdown faces per state through `spriteVariants`. All `pnw_*` glows through per-room emitters; no `EMITTERS` change. Call points off; suppression panel steady. Reviews by a fresh Opus agent each cycle.

Lessons:
- A room `light` draws into the MULTIPLY light map, so it can only bring the art back up to its unlit colour. On a blue lit ambient it reads warm only by holding blue and green down; pick a variant's colour by what it does to G and B, not by its hue. To brighten past the art, use an emitter with `above` and `floorTint`.
- A light on a wall of screens needs room lights under its ends, or it lights the floor as one spot.
- A screen's light can only follow the story if its face does: draw a sprite per state and wire it as `spriteVariants` in the `textVariants` order. Otherwise a red glow round a face saying AWAITING HOST claims something the prop doesn't show.
- A glow on a lit room's wall item needs a small radius and offsetY of 12-30, or it blooms over the north rim and reads as light outside the building.
- One object carries one glow: a fault lamp replacing a status lamp is fine when the text says the status changed.

### m08_the_mole (2026-10-14, m08 pass 5, lighting cycles 1-5)

Plan and log: `scenarios/m08_the_mole/LIGHTING_PLAN.md`. SAFETYNET HQ at night on Level Red (scenario ambient `#b8bfce`). On: lobby `#bcc2ce` (LEVEL RED screen breathes red `above`, memorial stars a small warm `above` glow), Director `#bab0a4` with `panels: false` and one warm desk pool, ops `#b2b8c8`, intel `#b0b8c6`, crypto lab `#b4bcca`, staff room `#ccc4b8`. Motion: server room `#a0b0c0` / `#0a0f1c`, archives `#bcc0b8` / `#121828`, interrogation suite `#c0c4cc`. The suite follows the story through room `variants`: during the confrontation (`all_flags_submitted && mole_identified && !fate_decided`) on, `panels: false`, `#8c929e`, one white pool over the table and the subject, RECORDING lamp plus recorder and camera tally lights red; after `fate_decided`, house lights up and recording off. Evidence wall and disposition screen faces per state through `spriteVariants`. Red-LED badge readers by the doors (`above`, r 6, steady). No light singles out a suspect: every crypto screen keeps the built-in glow, no locker glows, nothing changes in the lab or staff room at the naming. All `hq_*` glows through per-room emitters; no `EMITTERS` change. Call points off. Reviews by a fresh Opus agent each cycle; browser check with two reloads (game 2508) and a re-check of the face swaps in the order a player meets them (game 2509).

Lessons:
- A map decoration can't change its face: `spriteVariants` only work on scenario objects. A sign that must switch on with the story (a RECORDING lamp) has to be a scenario object; a round `above` glow on a 48×11 box lights its middle only. Pale letters on a dark box at least turn pink-white under red light. Tally lights (r 5, `above`) on small kit nearby carry "recording" well.
- A glow centred on a screen of three anonymous cards lands on the middle card and reads as one suspect singled out. In a mole hunt, check where every glow lands on any set of people, lockers or desks, not only on the culprit's.
- For a confrontation, put the pool on the person, not the table: the subject stands behind the table, so offset the light a tile north of it.
- An object with `spriteVariants` needs a base `sprite` too, even when the map gives it the right texture: on a global change with no matching variant `rooms.js` falls back to `sprite || type` (m07 7bf88a4c, m08 B1). Test the face swap in the order a player meets it: load the room first, then set the global.
- Set globals in a browser check through `applyActions` `set_global` so `global_variable_changed` fires and `spriteVariants` swap; a plain assignment to `globalVariables` only reaches lighting (it polls).

### m09_digital_archaeology (2026-10-22, finale, lighting rounds 1-2)

Plan and log: `scenarios/m09_digital_archaeology/LIGHTING_PLAN.md`. A records warehouse in Helena at night (scenario ambient `#b8bfce`); each room's light from stage 5's "Lighting" lines.
- **On:** dock `#bab09c`, no panels, two sodium pools `#ffc070`; front desk `#b0b6c4` with Noor's lamp warm `above`; closet `#a8b0c4`, no panels; reading room `#c8bca4`, no panels, two green lamps; hub and cage `#a8b0c0`, no panels, a hard white pool on the hatch counter / the shredder line.
- **Motion:** staff passage (flicker, dark `#161c30`); open stacks (`startOn: false`, dark `#141a2a`); office `#c4b8a6`, dark `#14121c`, desk lamp and kettle light; tape room `#a4b0c8`, dark `#0a0f1c`, blue standby LEDs on the m09 reel shelves (`leds`, `ledColor`); salvage cage `#b4b2b8`, dark `#0a0f1c`, Tomb Beta's rack the one amber light (`ledColor` `#ffb060`), screens dimmed.
- Call points off. No engine change.

Lessons:
- `startOn: false` doesn't hold a dark entry while a patrolling NPC is in the room: about 300 ms after the room loads, `checkNpcMotion` strikes the lights, and `offAfter` never fires while the NPC stays in the room. The strike happens as the door opens. There is no player-only sensor.
- A "warm light in the dark" needs everything else in the room turned down: the screens and a neighbour's lamp outshone an amber rack at r 40 and 0.55. Give the rack `ledColor` too, or its LEDs read stock green once lit.
- A desk lamp's colour needs `above` in a lit room, or the pool reads white-cream.
- A status lamp that says a story state (a wipe running or halted) should use the same condition as the task that records that state, not a looser one.
