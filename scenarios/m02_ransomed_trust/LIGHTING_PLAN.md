# m02 Ransomed Trust: lighting plan (review and improve)

Design step, 2026-10-08. Nothing in `lighting.js` or `scenario.json.erb` has changed yet.

## 1. Mood and where it comes from

A hospital in the small hours, running on backup generators after a ransomware attack. Kind of game: SAFETYNET spy thriller, so the lighting is there for tension. Dark corridors strike on as you walk in, the server room glows, and the screens tell the story of the attack.

Sources:

- **Time and power.** The brief: "St. Catherine's Regional went dark at 02:47 ... forty-seven patients are running on backup generators" (`scenario.json.erb:107`). The night visitor log runs 22:40 to 03:20 (`scenario.json.erb:1392`). HaX's opening gives "twelve hours of power, less if anything trips" (`ink/m02_opening_briefing.ink:41`).
- **Colour of the light.** Reception, on arrival: "Ten past four in the morning. Every screen behind the desk is black, and the lights run amber off the generators." (`ink/m02_npc_receptionist.ink:66`). This is the only line that says what colour the light is, and the player reads it in the first room.
- **Screens.** The kiosks show "the same red Ransomware Incorporated lock as every other screen in the building" (`scenario.json.erb:1463`). The front-desk PC is "black with a Ransomware Incorporated demand" (`scenario.json.erb:1433`). Seven objects use `lockType: ransomware_display` (reception ×3, ward, IT, Dr Kim's office, security office).
- **Dead monitoring.** "The monitor above him ... is dark" (`ink/m02_npc_patient_bed4.ink:40`). "With the central monitoring dark" (`scenario.json.erb:1509`).
- **Generator unease.** "Somewhere behind you a generator changes note." (`ink/m02_npc_security_guard.ink:216`).

What that means for lighting:

1. Lit rooms should look warm and slightly tired, not cool office white. The current night ambient `#b8bfce` (`scenario.json.erb:558`) is a cool blue-grey, the opposite of "amber". Keep the same brightness, shift the hue warm (section 7, C1).
2. Rooms with the lights off stay the cool `#101424` night blue. Warm lit rooms against cool dark ones is the contrast this mission is missing.
3. Ransom screens glow red, not the blue the engine gives every screen today (section 6, E1).
4. The server room stays the room that glows, even with its lights on (C2).

## 2. Evidence

Scratch root: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4e570cac-821c-4e90-9f13-271d108bd68c/scratchpad/m02-design/` (below, `before/` and `probe/` are relative to it).

- `before/`: `tools/playtest/lighting-tour.sh` on the committed config (game 1766). `<room>-a.png` as loaded, `<room>-b.png` lights on for the six motion rooms.
- `probe/`: one session (game 1769) with the player placed by hand, since the tour never shows the player or the torch.
  - `leds-over-player2.png`, crop `leds-crop2.png`: rack LEDs and the green rack glow drawn over the player's hood and face.
  - `desk-hotspot-crop.png` (from `leds-over-player.png`): the VM desk in the dark server room blown out to white.
  - `torch-side-wall.png`, crop `torch-crop.png`: torch pointed up along the server room's east wall. The beam's edge reaches about 20 px into the security office's west wall (sampled brightness 29–38 against 17 for the unlit wall). It's visible, but small.
- `ruby scripts/lighting_lookup.rb scenarios/m02_ransomed_trust/scenario.json.erb`: m02 is the only lit scenario, so no other mission's config can be reused. Light-looking objects outside `EMITTERS`: `magazine_rack1/2`, `cylinder_rack1` (both false positives) and `undercounter_fridge1` (section 5).

## 3. Room modes

Modes stay as committed except for timers in two corridors. The split is already right: rooms where people work start lit, empty rooms start dark. Most of the change is in how lit rooms look (sections 6 and 7).

| Room (line) | Now | Plan | Why |
| --- | --- | --- | --- |
| reception_lobby (560) | on, people | **keep** on | Bernie works here and the player starts here. Gets the amber mood (C1) and red kiosks (E1). |
| hospital_ward (1482) | on, people | **keep** on, **night ward** (C3) | Nurses and patients. A ward at four in the morning has its main lights down and the nurses' station lit, so it gets pools instead of a flat grid. |
| it_department (1878) | on, people | **keep** | Gary has been at his desk "since half ten" (`scenario.json.erb:1912`). |
| server_room (2132) | motion, `darkAmbient #0a0f1c` | **keep** motion, **add** a cool lit ambient (C2) | Best room in the mission when dark. Once lit it looks like a day office (`before/server_room-b.png`). |
| emergency_equipment_storage (2534) | motion, flicker | **keep** | A neglected store suits the faulty tube. It holds the PIN safe (`scenario.json.erb:2544-2552`), but the player only needs to walk in and open the PIN pad, which draws on top of the lighting. The dip (55%, two at most every few seconds) never hides the safe. |
| dr_kim_office (2606) | on, people | **keep**, optional desk lamp (C5) | Kim is here. Clues are read on arrival. |
| conference_room (2770) | on, people | **keep** | Reeves is here. |
| security_office (2940) | motion | **keep** | Empty once Val is in the corridor. The CCTV wall glowing in the dark is one of the best shots in the tour (`before/security_office-a.png`). |
| office_corridor (3038) | on, people | **keep** on | The patrolling guard starts here. Motion mode wouldn't help: NPCs trip the sensor (`lighting.js:442-459`), so it would switch on at once. |
| staff_room (3179) | motion | **keep** | Empty at night. The ward clerk's laptop glows on the desk. |
| ward_hall (3257) | motion | **keep** motion, **add** `offAfter: 45` (C4) | Dark corridor that strikes on. The player crosses it several times. If it goes dark again behind them, the motion sensor is believable. |
| ward_vestibule (3273) | motion, flicker | **keep** | Tiny transit room with one flavour card. It's the second flicker room, which is within the skill's "one or two per mission". |
| ward_approach (3299) | motion | **keep** motion, **add** `offAfter: 45` (C4) | Same as ward_hall. |

No room uses `dark`. Nothing in the story says a room has no power, and the skill keeps `dark` for that case.

## 4. What the player sees entering each room

After the plan is in. "Strike" means the fluorescent start: two flashes per tube, staggered, with the click and hum.

- **Reception** (start): warm, slightly dim lobby. The desk lamps make two warm pools, the exit sign glows green, and the two check-in kiosks and Bernie's PC glow a slow, steady red. The first thing the player sees matches what Bernie's scene says ("lights run amber off the generators").
- **Ward hall, ward approach** (dark corridors): through the door, a blue-black corridor. In the hall the alarm panel glows a steady warm white, the emergency button a faint steady red, and the crash cart green. These are sis02's shared EMITTERS changes; nothing pulses here now. In the approach the info screen glows blue. Step in and the tubes strike. Come back after 75 seconds away and they're dark again.
- **Ward vestibule**: dark, then strikes on with one bad tube that dips now and then.
- **Hospital ward**: a night ward. Light is pooled at the nurses' station and at Bed 2, where Sister Doyle keeps watch. The rest is dim but readable, and the bedside monitors glow green. Bed 4 sits between the pools, under the monitor the ink calls dark.
- **Emergency storage**: dark store with the crash cart's glow by the door. Strikes on with a faulty tube.
- **Office corridor**: lit (the guard is there), warm, vending machines glowing.
- **Security office**: dark. The CCTV wall throws blue light across the desks and Val's PC glows red. Strikes on as you enter.
- **Server room**: dark through the door. Rack LEDs blink, the racks give off green, the VM desk glows blue without whiting out (E3), and the fire-alarm point and power panel glow red and orange on the walls (the thermometer no longer glows: it's a mechanical dial). Step in and the tubes strike, but the room stays cooler and dimmer than the offices, so the racks still read as lit (C2).
- **IT department**: lit, warm. Gary's own workstation is blue, the infected terminal red.
- **Dr Kim's office**: lit, warm. Her PC is red. With C5, a desk-lamp pool over her desk.
- **Conference room**: lit, warm, the wall screen blue.
- **Staff room**: dark with one blue laptop glow, then strikes on.

When the player stands in front of a rack or a screen, LEDs and glow no longer draw over them (E2). When the torch points along a side wall, it stays in the room (E7).

## 5. Light sources

**Flagged by the lookup as light-looking but not in `EMITTERS`:**

- `magazine_rack1/2` (reception) and `cylinder_rack1` (storage): false positives (`(?<!c)rack` in the lookup's `LIGHTISH`). Leave alone.
- `undercounter_fridge1` (staff room): a domestic fridge with no display. Leave alone. The staff room microwave would have a clock LED, but it's part of the kitchenette art, not a separate object, so `EMITTERS` can't match it.

**Emitters giving the wrong light:**

- **The seven ransom screens** (`reception_terminal`, `reception_kiosk_1/2`, `ehr_terminal_ward`, `infected_terminal`, `kim_office_terminal`, `security_desk_terminal`) glow screen blue (`0x9fd4ff`, `lighting.js:67-68`). The story says red. Fixed in the engine from `lockType` (E1), so no scenario change and no new key.
- **The VM desk in the server room** (`cyberchef_workstation`, `flag_station_dropsite`, `vm_launcher_rooting_for_a_win`, `hospital_recovery_console`, plus the map's `kvm_cart1`): several screen emitters within about a tile of each other. Their ADD glows sum to white and wash out the desk art (`probe/desk-hotspot-crop.png`, `before/server_room-a.png` around 715,505). Fixed in E3.
- **Bedside vitals monitors** (ward, six of them) glow green. The ink makes Bed 4's monitor dark (`ink/m02_npc_patient_bed4.ink:40`). The sprite art itself shows a live trace, so a dark glow over it would look wrong. Left alone (section 9, and the pending per-object proposal in `DECISIONS_PENDING.md`, P2).

**Missing light:**

- **Nurses' station and Bed 2** in the ward: needed once the ward loses its even panel grid (C3). Added as `lights` in the room block.
- **Dr Kim's desk lamp** (`office-misc-lamp3` at tile 3.8,3.5 in `room_hospital_office_cto`) already matches the lamp emitter, but in a lit room its pool barely shows (`before/dr_kim_office-a.png`). Optional `lights` entry (C5).

No new `EMITTERS` entries are needed for m02.

## 6. Engine improvements (lighting.js), by value

> Round 1 review (2026-10-08) changed this section; **section 6R below supersedes it** wherever they differ. The text here is kept as the reasoning record.

All of these are **lighting.js only**. None adds a config key, so `scripts/scenario-schema.json` is untouched. m02 is the only lit scenario in HEAD, so the "check one other lit mission" rule can't apply yet. Check sis01/sis02 instead if their lighting has landed by then. Line numbers are from HEAD `lighting.js`.

### E1. Ransom screens glow red (high value, low cost)

- **Problem.** Every screen gets the same blue glow (`lighting.js:67-68`). m02's story says every screen shows a red ransom lock (section 1). Seven `ransomware_display` objects glow blue (`before/reception_lobby-a.png` desk PC and kiosks, `before/security_office-a.png` desk PC).
- **Approach.** In `refreshEmitters` (`:286-297`), when `obj.scenarioData?.lockType === 'ransomware_display'`, use a `RANSOM_EMITTER` def whatever the texture: colour `0xff3b30`, radius 44, intensity 0.6, offsetY 6, and a new effect `'breathe'` (k = 0.75 + 0.25·sin(t/700), a 4.4 s cycle, nowhere near a flash). Apply it even when the texture matches no emitter, since a ransom display is a screen by definition. If `scenarioData.locked` goes false when the systems are restored, use the normal screen def from then on, so the screens turn blue as the hospital recovers. Check whether the unlock system really sets that flag. If it doesn't, leave this out rather than add a hook elsewhere.
- **Cost and risk.** About 10 lines. Every mission with `ransomware_display` objects changes. That's the intent: the minigame shows the same red lock everywhere.
- **Check.** Tour reception, IT, Kim's office and security office (dark and lit). Red glow on exactly those seven objects, blue on `gary_workstation` and the CCTV.

### E2. Glows and LEDs stop drawing over characters (high value, medium cost)

- **Problem.** Glow sprites sit at `LIGHT_DEPTH + 1` (`:293`) and LEDs at `LIGHT_DEPTH + 2` (`:309`), above every sprite. A player standing in front of a rack wears its LEDs on their hood and a green cast on their face (`probe/leds-crop2.png`). The same happens at the VM desk, where the player stands just below the screens for most of the server-room work.
- **Approach.** Keep both layers above the light map: they have to bloom in a dark room. Hide them where a character stands in front.
  1. Once per redraw, collect character rectangles: `window.player` and every active, visible `npcManager.npcs` sprite in a visible room. Narrow each to the figure (middle 60% of the frame width, from 10% down to the bottom), since frames carry transparent padding. Keep each sprite's `depth`.
  2. LEDs (`:533-536`): an LED is hidden when its point falls in the rectangle of a character whose depth is greater than the rack's.
  3. Glows (`:537-544`): when a character in front overlaps the glow's circle (radius `def.radius * 0.6`), ease that glow's alpha towards 0 over about 150 ms, and back when they leave. Easing avoids a pop. The map stamp (light on the floor) stays, so the character is still lit by the screen.
- **Rejected.** Moving glows and LEDs down to the object's own depth. They'd then sit under the MULTIPLY map, which in a dark room is about 0.1–0.5 at an LED, so amber and blue LEDs would almost vanish. Punching bright dots into the map to compensate would put those dots on anyone standing in front.
- **Cost and risk.** About 30 lines. At most about 80 LEDs × 8 characters per redraw (≤30 Hz), which is negligible. Risk: a character partly overlapping a glow loses all of it. The easing keeps that soft.
- **Check.** Repeat the `probe/leds-over-player2.png` placement (player at tile 2.75, 3.85 in the server room, lights off) and crop: no LED pixels on the player, no green face. Then stand the player at the VM desk.

### E3. Clustered screens don't blow out (medium value, low cost)

- **Problem.** Four or five screen emitters on the server-room VM desk each add their own glow sprite. The sum goes white and hides the screens (`probe/desk-hotspot-crop.png`).
- **Approach.** In `refreshEmitters`, after building the list, count for each emitter how many emitters have centres within 24 px (itself included). Scale its glow sprite alpha by `1/n` and its map stamp intensity by `1/sqrt(n)`. The desk then glows about as much as one bright screen, and the floor pool stays a little bigger than a single screen's.
- **Cost and risk.** About 10 lines, at refresh time only. It dims clustered screens in any mission, which is the intent.
- **Check.** Server room dark: the desk art (laptop, keyboard, the pink screen) is readable in a crop at the same place as `desk-hotspot-crop.png`.

### E4. Ceiling light takes the room's colour (medium value, low cost; needed for C1)

- **Problem.** Panels and door spill use fixed cool whites (`PANEL_COLOR 0xf6f9ff`, `SPILL_COLOR 0xeef2ff`, `:49-50`, used at `:525` and `:621`). With a warm ambient (C1), the pools would come out bluer than the room around them, the opposite of "lights run amber off the generators".
- **Approach.** In `registerRoom` (`:230-248`), set `state.panelColor` to the lit ambient normalised to full brightness (scale so the largest channel is 255) then blended 60% towards it from white. Do the same for `state.spillColor`, and stamp with them. The engine default ambient `#c4cad8` gives `#f1f5ff`, almost exactly today's `#f6f9ff`, so missions on the default barely change.
- **Cost and risk.** About 8 lines. No new key.
- **Check.** Tour reception and the corridor with C1 applied: the pools are warm white, not blue.

### E5. Strike sounds only from rooms the player could hear (medium value, low cost)

- **Problem.** `updatePanels` runs for every registered room before the visibility test (`:495` against `:498`), and `playStrikeClick` (`:363-407`) has no position. When the patrolling guard walks into a dark ward corridor on the far side of the map, the player hears tubes striking at full volume. With C4 the corridors relight more often, so this happens more.
- **Approach.** Pass the room to `playStrikeClick`. Full volume for the player's room, 40% for a room that shares a door with it, nothing otherwise. Neighbours come from the room's `doorSprites[].doorProperties.connectedRoom`, which is already used at `:612-615`.
- **Cost and risk.** About 8 lines. A distant click can be a nice cue (the guard is coming), so keep the neighbour level rather than muting everything.
- **Check.** In a session, with the player in reception, call `switchOn('server_room')`: silent. Call `switchOn('ward_vestibule')`: quiet. Use a console counter on `playStrikeClick`, since headless runs have no audio to listen to.

### E6. `offAfter` waits for NPCs to leave (low value, low cost; needed for C4)

- **Problem.** The `offAfter` timer (`:331-338`) only checks the player. If the patrol is standing in the corridor when it fires, the lights go off, then `checkNpcMotion` (`:442-459`) switches them straight back on with a fresh strike in front of the guard.
- **Approach.** Move the rectangle test out of `checkNpcMotion` into `npcInRoom(state)`. In the timer callback, if an NPC is in the room, re-arm the timer instead of switching off.
- **Cost and risk.** About 10 lines, no risk to rooms without `offAfter`.
- **Check.** Session: enter ward_hall, leave, park an NPC sprite in it with `setPosition`, wait `offAfter`. The room stays lit.

### E7. Each room's light stays inside it (low visible value, medium-high risk)

- **Problem.** The known limit "light crosses side walls". Panels near a wall, wall-mounted emitters and the torch stamp past the room's edge. Rooms are drawn brightest first, so a lit room's bleed into a dark one is already covered by the dark room's fill (`:515-517`). What's left: a darker room's light falls on a brighter neighbour (invisible), and the torch, drawn after every fill (`:560-577`), crosses a side wall it runs along. Measured, it's small: about 20 px of faint light on the security office's west wall (`probe/torch-crop.png`). The side-wall cut at `:566-570` only clamps the beam's length, not its width.
- **Approach.** Clip with the WebGL scissor while drawing into the light map. For each visible room, and for each of its `fillAreas` rectangles converted to light-map pixels (`(x - ox) * RES`, rounded outward), call `renderer.pushScissor(x, y, w, h, rt.height)`, stamp that room's panels, extra lights and emitter pools, then `popScissor()`. Door spill is clipped to the room it falls into. The torch is clipped to the player's room. In Phaser 3.60, `setScissor` flushes the batch before changing the scissor, and `DynamicTexture.endDraw` calls `resetScissor`, so every push must be popped before `endDraw` (phaser.js 3.60, `WebGLRenderer.setScissor` and `DynamicTexture.endDraw`).
- **Cost and risk.** About 40 lines and one flush per rectangle (a handful a frame). The risk is in Phaser internals. Whether the scissor's y runs up or down inside a render-texture capture isn't verified, so the first step is a probe: stamp a solid rectangle clipped to a known room corner and screenshot it. If the scissor can't be made to behave, fall back to clipping the torch only, by narrowing the cone's `scaleY` near a side wall. Don't ship a half-working scissor.
- **Check.** Repeat `probe/torch-side-wall.png` (player at tile 9.0, 8.6 in the server room, facing up, security office dark). Security-office wall pixels at x 704–720 sample the same as unlit wall (about 17). Then re-run the whole tour to confirm no room lost its panels, since a wrong scissor would black out whole rooms.

### E8. Investigate: a neighbour drawn with no lighting during the tour (unknown value, probe only)

- **Seen.** `before/ward_vestibule-a.png`: ward_approach on the right is drawn bright, brighter than lit rooms. Yet in its own shot, `before/ward_approach-a.png`, it's dark and reports `off`. The vestibule in `before/reception_lobby-a.png` is mid-grey rather than dark.
- **Not reproduced.** A probe session (game 1768) loaded the same rooms one at a time. Every loaded room was registered and drew correctly (`probe/vestibule-probe.png`). `createRoom` registers the room synchronously at the end (`core/rooms.js:2855`).
- **Next.** Run the tour twice more and look again at those two frames. If it recurs, dump `Object.keys(window.rooms)` against `lightingSystem.rooms` at that moment. Rooms loaded by a patrol's pathing (`systems/npc-behavior.js:573`) are the first suspect. Don't change code until it's reproduced.

## 6R. Engine work after review round 1 (supersedes section 6)

The review found six majors and ten minors. The orchestrator accepted all of them. The user approved P1 (the brownout) for this pass. sis02's lighting.js list (`scenarios/sis02_energy/LIGHTING_PLAN.md` 4A/4B, items 1–6) goes in the same pass, because it touches the same functions (review M5). Dispositions:

| Finding | Disposition |
| --- | --- |
| M1: E1's "screens turn blue when unlocked" can't fire. `ransomware_display` never unlocks (`unlock-system.js:296-329`), and the ward EHR text drops the ransom note on `ward_recovering` (`scenario.json.erb:1762-1766`) | The `locked` clause is dropped and P4 withdrawn. The red glow is a built-in variant gated on `globalVars.ransomware_deployed`, the same gate the minigame uses (`minigame-starters.js:618`). `ehr_terminal_ward` gets a `ward_recovering` variant (blue) through the room's `emitters` key, matched by object id. |
| M2: in a one-panel room a faulty dip dims the whole room ~40% (`roomLevel` averages panels) | `roomLevel` counts a faulty panel that isn't striking as 1. Only its own pool dips. Flicker stays in storage and the vestibule. |
| M3: fading glows when a figure overlaps would dim every screen the player uses | Glow sprites move to the object's depth (+0.01) with alpha ×1.3. A character in front then hides them naturally. LEDs stay above the map and hide when a character in front covers the point. The figure box is trimmed by `SPRITE_PADDING_BOTTOM_ATLAS` (`npc-sprites.js:620-626`). Fallback if it looks wrong: fade to 0.35 only when the figure covers the glow's centre. |
| M4: C2 misread the glow formula. Glow alpha follows panel level, not ambient (`lighting.js:544`) | Option (b): the lit-room glow factor also scales with how dark the lit ambient is. C2's colour stays modest. |
| M5: E1, E3 and sis02's variants all touch `refreshEmitters` and the draw loop | One data model: `base` def, variant list (room key by object id, then longest texture prefix, then built-in ransom), `clusterK` applied at draw time, LED alpha = base × `ledAlpha` × not hidden × blink (steady under reduced motion). |
| M6: the scissor does nothing in 3.60 (`adjustViewport` disables `SCISSOR_TEST` during capture) | E7 dropped. Replaced by a torch-only fix, done last: after the torch is stamped, redraw any other visible room's fill and lights where the torch's box meets it. |
| m7: E8 is the tour leaving rooms on | E8 dropped. |
| m8: no NPC walks ward_hall or ward_approach | C4 doesn't depend on E6. E5 and E6 stay as general fixes, after the visible items. `offAfter` is 75 s. |
| m9: the ward with no panels reads darker than its colour suggests; the station lamp already lights the desk | C3 is judged by mean frame brightness against `before/hospital_ward-a.png`. The station pool is reduced if it doubles up. |
| m10: amber may push the teal art olive | C1 is judged by mean frame brightness and by eye. Fallback `#c0bdb2`, not `#ccbea0`. |
| m11: E4's tint is very faint at a 60% blend | Blend 100% (the full normalised ambient). |
| m12: cluster radius | 32 px. `clusterK` is kept separate and applied at draw time. |
| m13: section 4 stale after sis02's EMITTERS changes | Section 4 updated (thermometer gives no glow, alarm panel warm and steady, emergency button steady red). |
| m14: emitters are re-matched only when the object count changes; `spriteVariants` texture swaps never re-match | Each emitter stores its texture key. A key change triggers a re-match. |
| m15: E1 changes sis01 (six ransom displays) | Noted for the sis01 designer. |
| m16: `breathe` is missing from the schema's `emitterVariant.effect` | Added, along with id matching (the `emitters` key's description). |

**Merged work order (all lighting.js unless marked):**

1. **sis02 EMITTERS entries** (their 4A items 1–4): the screen list grows, a video-wall entry, battery racks, thermometer out, alarm panel and emergency button steady.
2. **Emitter data model** (M5, m14, sis02 item 5): base, variants, and a built-in ransom variant (E1). A room `emitters` key matches by object id first, then by longest texture prefix. Variants are re-resolved every 250 ms. A texture key change triggers a re-match. Header comment documented. Schema: `breathe` added, id matching described.
3. **Reduced motion** (sis02 item 6): effects hold `k = 1` and LEDs stay steady.
4. **Cluster damping** (E3) at draw time, radius 32 px.
5. **Glows at object depth, LEDs hidden behind characters** (E2 per M3).
6. **Faulty panel** in `roomLevel` (M2).
7. **Ceiling light takes the room's colour** (E4, 100% blend).
8. **Glow factor follows lit-ambient darkness** (M4b).
9. **Strike sounds by room** (E5); **`offAfter` waits for NPCs** (E6).
9b. **Brownout (P1):**
   - public `lightingSystem.dip({ level, ms })`;
   - scenario action `lighting_dip` (`apply-actions.js` plus the schema's action enum);
   - ink tag `#lighting_dip` (`chat-helpers.js`), added to the guard's narrator line (`ink/m02_npc_security_guard.ink:216`; the line's text is unchanged);
   - a single smooth dip, skipped under reduced motion;
   - if a conversation or minigame covers the screen, the dip waits until it closes, then plays after a short pause, so the player sees it.
10. **Torch kept out of neighbouring rooms** (M6 replacement), last.

## 7. Scenario config changes

> Round 1 changes:
> - C2 stays modest (the glow factor now does the work, M4).
> - C3 is judged by mean frame brightness (m9).
> - C4 is `offAfter: 75` and doesn't depend on E6 (m8).
> - New C6: `ehr_terminal_ward` variant on `ward_recovering` (M1).
> - C1's fallback is `#c0bdb2` (m10).
All of these go in `scenario.json.erb` `lighting` blocks and use existing keys. Colours are starting values. The tour decides the final ones, and each change is logged with its reason.

### C1. Generator amber (scenario level, line 558)

```json
"lighting": { "enabled": true, "defaultMode": "on", "ambient": "#c6beac" }
```

`#c6beac` has the same luminance as today's `#b8bfce` (Rec. 709 luma about 190 for both), so lit rooms get no darker, only warmer. If the tour shows it too faint, try `#ccbea0`. If it looks like a sepia filter, back off to `#c0bdb2`. Apply with E4 so the panels warm up too. Without E4 the pools stay blue-white. Add the result to the skill's mood table as "Night, emergency (generator) power".

### C2. Server room keeps its glow when lit (line 2134)

```json
"lighting": { "mode": "motion", "darkAmbient": "#0a0f1c", "ambient": "#a8b8c6" }
```

Cooler and a little dimmer than the rest of the building (luma about 182, above the skill's "muddy" floor of `#a8b0c0`, about 176). With the lights on, racks, LEDs and the VM desk should still read as the light in the room, unlike `before/server_room-b.png`. Glow alpha already falls with room level (`lighting.js:544`), so a dimmer room keeps more glow.

### C3. Night ward (hospital_ward, line 1482; add a block)

```json
"lighting": {
  "panels": false,
  "ambient": "#bcb3a0",
  "lights": [
    { "x": 16.5, "y": 5,  "color": "#ffd9a0", "radius": 140, "intensity": 0.6 },
    { "x": 8,    "y": 3,  "color": "#ffe6c0", "radius": 90,  "intensity": 0.45 }
  ]
}
```

- The first light is the nurses' station: `reception_table1` covers tiles x 13.8–19.2, y about 3.7–5.2 in `room_hospital_ward`. The second is Bed 2, where Doyle keeps her vigil (`bed2` at tiles 7.5–8.6, y 1.5–3.7).
- Bed 4 (tiles 2.5–3.7, y 5.6–7.8) is left between the pools on purpose: the patient alone under a dead screen.
- With `panels: false`, `#bcb3a0` (luma about 180) is the whole base light, just above the readability floor.
- Checks:
  - Doyle, the roaming nurse and every patient must be readable in `before/`-style shots.
  - Paper charts and the Bed 4 interactions must be clear.
  - Both ward doors must be findable. If a doorway reads poorly, add one small pool inside it (radius 60, intensity 0.3) rather than raising the ambient.
- If the room reads muddy, raise the ambient to `#c6beac` (the C1 value) and keep the two pools.

### C4. Motion-sensor timeouts on the ward corridors (lines 3259, 3301)

```json
"lighting": { "mode": "motion", "offAfter": 45 }
```

Apply to ward_hall and ward_approach only, and only with E6 (and ideally E5) in place. Without E6 the patrol replays the strike in front of itself. Forty-five seconds is long enough that walking through and back doesn't replay it, and short enough that a return trip after the ward finds the corridor dark again.

### C5. Dr Kim's desk lamp (optional; dr_kim_office, line 2606)

```json
"lighting": { "lights": [ { "x": 4.2, "y": 3.8, "color": "#ffd9a0", "radius": 80, "intensity": 0.45 } ] }
```

A warm pool on her desk (lamp at tile 3.8, 3.5; desk at tiles 3.8–6.3, y 3.3–4.7). Only keep it if the tour shows the pool. In a lit room an ADD pool can vanish into the ambient, and C1 already warms the room. If it doesn't show, drop it rather than darken a room where clues are read.

### C6. The ward EHR terminal recovers (hospital_ward block, M1)

```json
"emitters": {
  "ehr_terminal_ward": [
    { "condition": "globalVars.ward_recovering", "color": "#9fd4ff", "radius": 44, "intensity": 0.65, "effect": "screen" }
  ]
}
```

It matches by object id. Room variants win over the built-in ransom glow, so the terminal turns from red to screen blue when its text says it has "dropped the ransom note" (`scenario.json.erb:1762-1766`).

### Not changed

All other room blocks stay as committed: the `motion`/`flicker` choices in section 3 and the server room's `darkAmbient`.

## 8. Work order and checks

1. **Engine first (Opus, one agent on `lighting.js`).** Order: E1, E4, E3, E2, E5, E6, then E7 last and alone, so a scissor problem can be reverted without losing the rest. E8 is a probe and runs alongside.
2. **Engine checks:**
   - `node --test test/js/` (the log's known `engine-fixes-pass3` flake fails at HEAD too);
   - `bin/rails test`;
   - the tour on m02 with **no config change**, compared frame by frame with `before/`: only the red screens, the desk and the warmer-or-equal pools should differ;
   - one other lit mission if one exists by then.
3. **Config (Sonnet):**
   - C1 + C2, then C3, then C4 (after E6), then C5;
   - `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb --skip-ink --no-graph`;
   - the tour into a new `after/` folder.
4. **Player shots:** repeat the three probe placements (section 2) into `after/`.
5. **Flash safety:**
   - E1's `breathe` is a 4.4 s sine;
   - nothing else adds or changes a flashing effect;
   - `STRIKE_SEQUENCE`, `DIP_MS` and `DIP_LEVEL` stay unchanged;
   - reduced motion: `breathe` should hold steady (k = 1) under `prefers-reduced-motion`, like the faulty panel does (`lighting.js:429`).
6. **Record:**
   - room modes and the new mood in `docs/agents/LIGHTING_LOG.md`;
   - the mood row in the skill's table (the orchestrator does this, since the user has uncommitted edits to `SKILL.md`);
   - drop "LEDs over NPCs" and "side walls" from the log's Known limits once E2 and E7 are confirmed.

## 9. Noticed, not acting on

- The guard's green vision cone (`before/office_corridor-a.png`, `before/security_office-a.png`) is drawn across walls into neighbouring rooms. That's the LOS system, not lighting.
- The bedside vitals monitor sprites show a live trace, while the ink says the monitoring is dark. That's art or a per-object override, see `DECISIONS_PENDING.md` P2.
- A white strip above the south door in the staff room and corridor (`before/staff_room-b.png` near 455,742) shows lit and dark alike. Probably door-frame art. Not lighting.
- IT's two desk PCs show a blue wallpaper in their art, while Gary's scene says "dead terminals" (`ink/m02_npc_gary_whitlock.ink:78`). E1 makes the infected one glow red. The sprite stays as drawn.
- The `pulse` effect on power and suppression panels (`lighting.js:72`) breathes on a 1.9 s cycle. It reads well in `before/server_room-a.png`. Leave it.

## 10. Implementation, round 0 (2026-10-08)

Done: work-order items 1–10 and 9b, plus config C1, C2, C3, C4 and C6. **C5 dropped**: the desk-lamp pool doesn't show in a lit room (`after-r0/dr_kim_office-a.png`), so the room stays as committed.

Evidence is in the scratch folder: `after-r0/` (same room order as `before/`), `after-r0-rack/`, `brownout/` and `sis02-check/`.

Seen:
- **Ransom red:**
  - It reads clearly in dark rooms (security office) and at the brownout's trough (`brownout/side-by-side.png`).
  - In lit rooms it's faint, because an ADD glow on a bright floor saturates. Left as is: lit rooms still read as lit.
- **Server room:**
  - The desk no longer whites out, and the thermometer gives no glow.
  - With the lights on it still looks close to an office. C2 is modest, as decided, and this goes to the visual review.
- **Ward:** mean frame brightness fell from 160/177/184 to 138/144/131 (RGB), with patients and nurses all readable.
- **C1 amber:** the teal chairs and walls stay teal, not olive, so `#c6beac` is kept.

## 11. Improvement round 1 (2026-10-08)

The visual review's items 1–6, plus the sis02 reviewer's panel-saturation finding:

1. **Glows in dark rooms.** In dark rooms (level < 0.5) glows draw above the light map again. A glow fades to 0.3 only when a figure in front covers its centre. In lit rooms glows stay at the object's depth. Racks (emitters with LEDs) are no longer de-clustered; screens still are. The dark server room's rack bloom is back.
2. **Ransom red.**
   - The ransom variant now has intensity 0.8, its own lit factor, and always draws above the map.
   - In lit rooms it also multiplies a red tint (`#ffa69c`) into the light map. ADD can't redden a near-white map.
   - Visible in reception, IT, Kim's office and the ward.
3. **Lit server room.**
   - Ambient `#a0b0c0`.
   - `emitters` overrides for the rack prefixes: radius 56, intensity 0.7, and a new `floorTint` 0.6 that tints the floor in front of each rack green in a lit room. `floorTint` is a new schema field in `emitterVariant`.
4. **Kiosks.** Ransom variants inherit `offsetY`; the kiosk has its own entry with `offsetY -14`.
5. **Amber.** Ambient `#c0bdb2`. Panel light is the ambient hue blended 60% towards white.
6. **Ward.** Ambient `#b8b4a8`, station pool 0.75.
7. **Panel saturation.** A panel adds `min(0.5, 0.8 × (1 − ambient luma))`, so pools reach about white at their centres and the ambient shows elsewhere. I also tried 1.25, which barely changed anything because overlapping pools still saturate.

## 12. Improvement round 2 (2026-10-08)

1. **Ransom red.**
   - A probe confirmed that Kim's PC was clustered with her desk lamp (glowK 0.5). IT had no cluster and no duplicate emitter. Its problem was a bright blue sprite on a white desk under a near-white map.
   - Fixes: clustering now applies only between plain screens, never to ransom screens, lamps or racks. Ransom glows widen to 56 px in lit rooms. The floor tint is deeper (`#ff6a5c`) and depends less on the breathe.
   - IT's infected PC and Kim's PC now read red, and the reception kiosks strongly so.
2. **Rack glow over a figure.** Rack glows fade when a figure overlaps the glow's inner circle. Screens keep the centre test. A green cast on the face remains: it comes from the rack's light on the light map, which lights anything near it, not from the glow sprite.
3. **Amber in the light.** `PANEL_WHITE_MIX` 0.35.
4. **Vitals monitors.** They have their own EMITTERS entry, with `offsetY -18`.
5. **Bed 2 pool.** Intensity 0.6.
6. **Vestibule.** A small green exit-sign light over the east door.
7. **Smooth light texture.** The falloff is now (1−t²)^2.7 at 21 stops, the same total light as before. The sis02 battery-hall "rim" is in that room's floor art: it stays with the light map hidden (`probe-rim/hall-nolighting-small.png`).
