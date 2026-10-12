# m03 Ghost in the Machine: lighting plan

Lighting cycle 1, 2026-10-12. Skill: `.claude/skills/mission-room-lighting/`. Brief: `docs/agents/M03_PASS2_BRIEF.md` (stage 4) and `docs/agents/LIGHTING_PASS_BRIEF.md`. No ink, tags or spoken lines change.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller. The lighting tells the two halves of the mission apart and gives the night half its stealth feel. It never carries information a puzzle needs, and every room the player must search can be lit (by its sensor, or by the objects in it opening their own displays).

**Two times of day, one building.**

- **Afternoon, as a recruit.** HaX: "Entry is a conference-room meeting this afternoon" (`ink/m03_opening_briefing.ink:194`). Ffion greets the player with "Afternoon! You'll be the three o'clock" (`ink/m03_npc_ffion_rees.ink:39`); Terry: "Afternoon. Executive wing's staff only" (`ink/m03_npc_terry_mott.ink:83`). The front is WHITEHAT, a slick security consultancy: cool white walls, a cyan brand line, a black counter with a cyan light strip (`ROOM_DRESSING.md`, cycles 1-4). So the day is a bright, cool, expensive office, near full brightness in the lobby.
- **Eleven at night, breaking in.** "Eleven o'clock that night, you're back... The main hallway is on its night lights. Somewhere off to the east, a guard's footsteps go round, and round again." (`ink/m03_night_transition.ink:28-29`). Terry carries a torch at night (`ink/m03_npc_terry_mott.ink:477-478`). Danny "is sitting in the dark with his coat on" (`ink/m03_danny_choice.ink:24`). Sterling stays on in the conference room: "Sterling hasn't left. The light's still on in the conference room." (`ink/m03_npc_victoria.ink:724`). Ffion is still at the desk, surprised: "Is Ms. Sterling expecting you this late?" (`ink/m03_npc_ffion_rees.ink:287`).

**What that means for lighting.** By day the rooms people work in are lit and the brand reads (cool white, cyan). At night the same rooms go dark or dim and the things the room-dressing agent placed as light sources take over: the corridor threat map, the server racks and the exploit marketplace board, the counter's cyan strip, Danny's desk lamp, the CEO's desk lamp and display cabinets. Two rooms stay lit at night because the story says so: the conference room (Sterling's light is on) and reception (Ffion is still at the desk), and the reception lights drop to a night level.

Mains power throughout; no brownout. Nothing in the story makes the lights falter, so a dip would read as a hint that leads nowhere (the m01 L1 reasoning). No flicker: m03 has no neglected back room, and both corridors are where the guard beat happens, where a dipping tube would compete with his vision cone.

## 2. How day and night are marked, and what the engine can switch

**The scenario's markers.**

- `mission_phase` goes from `act1_meeting` (initial, `scenario.json.erb` globalVariables) to `act2_infiltration` the moment Sterling's card is saved (`objective_task_completed:clone_rfid_card` mapping, `scenario.json.erb:807-812`). The player is still in the conference room in the afternoon at that point, so it is the wrong switch for light.
- `clone_call_done` is set when the `night_transition` scene closes (`scenario.json.erb:1214-1219`), which plays on the first main-hallway entry after the clone. The scene is the time skip to eleven at night. **Lighting keys night on `globalVars.clone_call_done === true`.** It is saved with game state, so a reload at night still reads night.

**What `systems/lighting.js` can do today.**

- A room's `mode`, `ambient`, `darkAmbient`, `panels` and `lights` are read once, when the room is first created (`registerRoom`, `lighting.js:297-353`), and never again. Rooms are lazy-loaded, so a room first loaded at night registers at night, but reception, the main hallway and the conference room are always loaded by day. Nothing re-reads them when a global changes. **So a room's mode and brightness cannot follow day and night.**
- Emitter variants can (`resolveEmitters`, `lighting.js:436-466`, re-checked every 250 ms): each per-room `emitters` entry is a list of variants with `condition`s, first match wins. An object with no `EMITTERS` match can still glow through a variant that gives `color` and `radius` (`lighting.js:417-419`). So glows can switch with `clone_call_done`, and m03-only props (the counter, the boards, the cabinets) can glow without touching `EMITTERS`.
- "People in the room" is decided from scenario data at registration (`lighting.js:304`), not from who is visible; NPCs walking in trip motion sensors (`checkNpcMotion`).
- The only scenario action for lighting is `lighting_dip` (`apply-actions.js:141`).

**Smallest approach.** Cycle 1 ships a config that works on today's engine (section 8): one state per room, chosen per room so the day is right where the player spends the day and the night is right in the rooms only reached at night, with the glows switching by condition. Section 7 proposes one engine change, room-level `variants` with a `condition` (the emitter-variant pattern applied to the whole room block), which would let reception, the main hallway, the executive wing and Danny's office change at the night turn. It needs approval; nothing in `lighting.js` has been changed.

## 3. Room modes, day and night

Who is where, from `scenario.json.erb`: Ffion at reception both halves (no hide); Victoria in the conference room both halves (hidden only once her fate is decided, `:1301-1315`); Terry patrols the executive wing both halves (`:1476`); Danny is `initiallyHidden` and appears only at night in his office (`:1696-1703`). The server room is RFID-locked to Sterling's card, so in practice it is reached only at night. The CEO's office is key-locked and can be picked in the afternoon (`ink/m03_npc_terry_mott.ink:475`). Danny's office has no lock.

"Today" is what cycle 1 ships on the current engine. "With E1" is the design once room variants exist (section 7).

| Room | Day (design) | Night (design) | Today (cycle 1) | Why |
|---|---|---|---|---|
| reception_lobby | on, bright cool `#e4e8ee` | on, night level `#808aa0`, no ceiling grid, one pool over the counter, counter strip glows | day | The first impression and the busiest public space (near full brightness, LIGHTING_LOG user rule). At night Ffion is still at the desk, so it stays lit but drops. |
| main_hallway | motion, `offAfter` 75 | on, "night lights": `#4a5268`, no ceiling grid, two dim pools, threat map glowing | motion both | The narration says "on its night lights" (`m03_night_transition.ink:29`). Today the hall is dark until walked into, with the threat map as its only light, which suits the night and is the m01 day-office pattern by day. |
| conference_room_01 | on | on | on | Victoria is there both halves, and "the light's still on in the conference room" (`m03_npc_victoria.ink:724`). One state is right. |
| server_room | (not reached by day) | motion, server darks, racks and the marketplace board carry it | night | Only reachable with Sterling's card. m01/m02 server block. |
| executive_wing_hallway | on, warm and quieter `#bcb6ae` | on, dim `#40465c`, one low pool by the console, no ceiling grid | day | Terry is in it both halves, so it is lit whatever the mode. By day the warm ambient marks the "quieter end of the building" (ROOM_DRESSING cycle 3, H2). At night it should be the darkest place the player has to cross, with the guard's vision cone the brightest thing in it. |
| executive_office | motion | motion: dark through the door, her desk lamp, PC and the two cabinets glowing; tubes strike on entry | motion both | She is in the conference room, so it is empty in both halves. Four things to search (safe, filing cabinet, PC, drawer), so it lights on entry rather than staying dark. The lamp and cabinets are what you see through the door, which is the brief's "lit by her desk lamp and cabinets". |
| danny_office | on (or motion), lamp off: he's out at client sites (`m03_npc_ffion_rees.ink:207`) | **dark**: only his desk lamp, his PC and the lab rack's LEDs; Danny stands in the dark | dark both, lamp night-only | "A man is sitting in the dark" (`m03_danny_choice.ink:24`). The sensor must not strike the lights on when the player walks in, so `dark`. Nothing here needs fine reading on the map: the PC, photo and review open their own displays. Cost today: by day the empty office is dark too (PC glow only). |

No flicker and no `offAfter` outside the main hallway (section 1). Fire-alarm call points do not glow anywhere in m03: the call point art has no lamp, and a lone red pulse in a dark corridor reads as a clue (the Tesseract rule).

## 4. What the player sees entering each room

"Strike" is the fluorescent start (two flashes per tube, staggered, click and hum).

**Afternoon**

- **Reception** (start): a bright, cool white lobby. The counter's cyan strip and the WHITEHAT slat wall read as the brand. Through the north door the corridor is dark, with the threat map's blue glow on the back wall.
- **Main hallway**: dark, the threat map glowing; the tubes strike as you step in. After 75 s away it goes dark again and restrikes on return.
- **Conference room**: lit; Victoria by the whiteboard, the wall screen blue.
- **Executive wing**: lit, warmer and quieter than the public side; Terry on his loop over the burgundy runner, his vision cone drawn on the floor.
- **CEO's office** (if picked by day): dark through the door except her desk lamp, the blue of her PC, the trophy cabinet's display light and a warm glint on the drinks cabinet's bottles; strikes on as you step in, warm walnut once lit.
- **Danny's office**: dark, his PC glowing on the desk and green LEDs on the lab rack. Today it stays dark (with E1: lit and empty).

**Eleven at night**

- **Main hallway** (where the night scene plays): with E1, on its night lights, a dim blue-grey corridor with the threat map the brightest thing in it. Today it is whatever the sensor left it: lit from the scene's entry, then dark after 75 s away, with the threat map glowing.
- **Server room**: badge in to near black: rack LEDs blinking, a green wash off the two rack rows, the marketplace board's red, yellow and green prices glowing on the back wall, the operator desk's and ops bench's screens blue, the suppression panel's amber. The tubes strike as you step in, but the lit room stays cool and dimmer than the offices so the racks remain the room's light.
- **Executive wing**: with E1, dark and blue, Terry's cone the brightest thing on the floor. Today: as by day.
- **CEO's office**: as by day; the lamp, the cabinets and the PC are what you see through the door.
- **Danny's office**: dark. His desk lamp throws a warm pool over the desk, PC and family photo; Danny stands beyond it in the dark with his coat on. The lights never strike.
- **Conference room**: lit, Sterling waiting.
- **Reception**: with E1, the lobby on its night level: a single pool over the counter, the cyan strip glowing, Ffion at the desk. Today: as by day.

## 5. Settings reused from other missions

`ruby scripts/lighting_lookup.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb`: every m03 room type (`room_zds_*`) is new, so nothing is lit before. Reuse is by role, with no tile coordinates copied.

| m03 room | Copied from | What | Changed? |
|---|---|---|---|
| scenario | m01, sis01 | `{ "enabled": true, "defaultMode": "on" }`, engine default ambient | No. The afternoon is a day office; m02's amber `#c0bdb2` is a 4 am generator night. |
| reception_lobby | m01 main office (user feedback, LIGHTING_LOG) | lit ambient `#e4e8ee` | No. Busiest public space near full brightness. |
| main_hallway | m02 `ward_hall`/`ward_approach`, m01 `hallway_east` | `{ "mode": "motion", "offAfter": 75 }` | Adds the threat-map glow and call point off. |
| server_room | m02 `server_room` (`m02 scenario.json.erb:2252-2260`), m01 `server_room` | `mode: motion`, `darkAmbient: #0a0f1c`, `ambient: #a0b0c0`, rack `floorTint: 0.6` | `tape_library` dropped (none in this map); `market_board` glow added. Same role: empty server room behind an RFID door, with the VM desk. |
| executive_office | m02 `security_office`/`staff_room`, m01 offices | `mode: motion` | Adds the lamp and cabinet glows, and sis01's warm `#d2cdc8` for the walnut room. |
| executive_wing_hallway | sis01 IT office / Tesseract (warm ambients) | warm lit ambient | `#bcb6ae`, a step dimmer than sis01's `#d2cdc8`. |
| danny_office | m01 hallway darks | `darkAmbient: #161c30` (doors and furniture findable in the dark) | `mode: dark`: the only `dark` room in the lit missions so far; reason in section 3. |

## 6. Light sources

All m03-only props glow through per-room `emitters` variants keyed by texture prefix (an object with no `EMITTERS` match glows when its variant gives `color` and `radius`, `lighting.js:417-419`). No `EMITTERS` change, so no other mission is affected.

| Source (room) | Texture | Glow | Notes |
|---|---|---|---|
| Counter's cyan strip (reception) | `reception_counter1` | `#4de8ff`, r 56, 0.6, offsetY +8 (the strip sits 8 px below the sprite's centre) | No `floorTint`: see the engine bug in section 7 (E2). Shows at night (E1) and through the door; invisible in the bright day lobby, where the painted strip carries it. |
| Threat map (main hallway) | `threat_map1` | `#6ab4ff`, r 60, 0.65, `screen` | The hallway's only light when dark. |
| Exploit marketplace board (server) | `market_board1` | `#a8f0c8`, r 56, 1.0, `screen` | Raised from 0.7 after the first tour: it was lost beside the racks. |
| Racks (server) | `server_rack`, `network_rack`, `storage_array` | engine rack glow, r 56, 0.7, `floorTint` 0.6 | As m02. |
| AV control panel (conference) | `power_panel1` | steady `#7dffa0`, r 14, 0.4 | The global `power_panel` entry is an amber pulse, which reads as an alarm in a boardroom. |
| Laptop on the table (conference) | `exec_laptop1` | screen blue, r 28, 0.45 | The lookup flagged it (prefix not `laptop`). Only shows if the room is ever dark. |
| CEO's desk lamp | `exec_desk_mahogany1` | `#ffc880`, r 64, 0.8, offset (+19, −6) onto the lamp head painted on the desk sprite | Placed from the sprite (lamp at about x 49, y 21 of 60×53); it lands on the lamp in the tour. |
| Drinks cabinet (CEO) | `drinks_cabinet1` | `#ffcf8a`, r 26, 0.45, offsetY −12 (the bottles on top) | A warm glint, not a light. |
| Trophy cabinet (CEO) | `trophy_cabinet1` | `#fff1d0`, r 30, 0.5 | A lit display case. |
| Danny's desk lamp | `office-misc-lamp4` | night only (`clone_call_done`): `#ffc880`, r 64, 0.7, offsetX +10; by day intensity 0 | offsetX keeps the pool off the west wall beside the desk. |
| Fire-alarm call points (reception, hallways, conference, Danny) | `fire_alarm_point1` | intensity 0 | Section 3. |

Left alone: `brochure_rack1` and `mini_fridge1` (lookup false positives; neither gives light); the reception threat map moved to the corridor in dressing cycle 2, so reception has no screen of its own besides the counter monitor, which isn't an emitter.

**Physical sources wanted from the room-dressing agent: none required.** Optional, for cycle 2: a narrow downlight or uplighter on the WHITEHAT slat wall would give the night lobby a brand-coloured accent (today the pool over the counter is a config light with no fixture). The trophy cabinet in reception could take the same display glow as the CEO's if the dressing agent confirms it is meant to be a lit case.

## 7. Engine proposals (need approval; nothing changed)

### E1. Room lighting variants with a condition (the day/night switch)

The smallest change that gives m03 its night. It reuses the emitter-variant pattern users of the config already know.

```json
"lighting": {
  "ambient": "#e4e8ee",
  "variants": [
    { "condition": "globalVars.clone_call_done === true",
      "ambient": "#808aa0", "panels": false,
      "lights": [ { "x": 5.2, "y": 3.6, "color": "#e8f0ff", "radius": 110, "intensity": 0.4 } ] }
  ]
}
```

- **Schema:** `variants` on the room lighting block: a list of partial room blocks (`mode`, `ambient`, `darkAmbient`, `panels`, `lights`, `emitters`, `flicker`, `offAfter`), each with an optional `condition`. First match wins, merged over the base block; none: the base.
- **Engine (`lighting.js`):** resolve at `registerRoom` (so a reload or a room first loaded at night is right at once), and re-check on the existing 250 ms resolve tick (`RESOLVE_MS`). When the resolved variant changes: rebuild the room's derived state (lit/dark ambient, panel colour and add, panels, extra lights, emitter config), then apply the new mode without a strike: `on` lit at once; `motion` or `dark` off unless the player is in a `motion` room. The change happens behind the night scene's fade (a time skip), so an instant change is right.
- **Scope:** about 40 lines in `registerRoom`/`refreshEmitters`, a schema entry, and the comment block. No other system touched; scenarios without `variants` behave exactly as now.
- **What m03 would use it for:** reception (night level), the main hallway (`on` with night lights), the executive wing (dim), Danny's office (`on` by day, `dark` at night; the lamp variant already switches). The night blocks are in `build_evidence/lighting_c1/night_cfg.json`, and the night shots were rendered with them by re-registering rooms from the console (`tour.py`), so the screenshots show what E1 would give.
- **Check:** node tests for the variant resolution, the m03 tours day and night, and one other lit mission's tour unchanged.

Alternative considered: a `set_lighting` scenario action fired from the `conversation_closed:night_transition` mapping. Rejected as the recommendation: a reload at night would need the action replayed (lighting state isn't saved, LIGHTING_LOG known limits), and rooms loaded later wouldn't get it. A condition read from saved globals has neither problem.

### E2. Bug: a `floorTint` stamp as the last draw blanks the light map

Found in this cycle (game 2120, reproduced from the console). When the last thing stamped into the light map in a frame is an emitter's `floorTint` (a MULTIPLY stamp), the whole map comes out white: every visible room renders at full art brightness, dark rooms included. Any ADD stamp after it (another emitter, the torch, door spill) avoids it. In m03 the reception counter (`floorTint` 0.35) was the only emitter left after the call point was set to 0, so reception, and Danny's dark office next to it, rendered unlit in the first tour. Measured: reception mean 156 with the counter's tint as the last stamp, 26-28 with it removed or followed by an ADD stamp, at the same ambient.

- **Likely cause:** a blend-mode change inside the `beginDraw`/`endDraw` batch (`skipBatch` stamps, Phaser 3.60) that isn't flushed before `endDraw` when the batch ends on the MULTIPLY stamp.
- **Fix to try:** one no-op ADD stamp (the white block tinted `0x000000`) just before `rt.endDraw()` in `update()`, or draw the floor tints in their own pass followed by an ADD flush. Not tested yet.
- **Other missions:** m01, m02 and sis02 use rack `floorTint` in server rooms and m02/sis01 ransom screens use it; they would show the same white map whenever such an emitter is the last stamp of a frame (e.g. a lit server room drawn last, no open door, torch off). Not seen in their tours, which may be luck of object order.
- **m03 workaround today:** no `floorTint` on the counter. The server racks keep m02's block; their room has screens after the racks.

### E3 (optional, later). A visible torch on the night guard

Terry "puts a torch beam on your hands" at night (`m03_npc_terry_mott.ink:477`), and the vision cone already shows where he looks. A warm beam drawn from an NPC with a `torch: true` behaviour flag (the player's torch code, `stampTorch`, applied to an NPC) would make the executive wing at night read as a guard with a torch. Only worth it once E1 makes that corridor dark. The user approved E-D (guards react to the player in their torch beam, opt-in per NPC) on 2026-10-05; this would be its visible half.

## 8. Config as implemented (cycle 1)

In `scenario.json.erb`, one `lighting` block per room on the line after its `"type"`, and the scenario block before `"rooms"`. No ink, tags, NPC fields or layout changed. `git diff --stat`: 52 lines added.

- scenario: `{ "enabled": true, "defaultMode": "on" }`
- reception_lobby: `ambient #e4e8ee`; emitters `reception_counter`, `fire_alarm_point` off
- main_hallway: `motion`, `offAfter` 75; emitters `threat_map`, `fire_alarm_point` off
- conference_room_01: (on); emitters `power_panel` steady green, `exec_laptop`, `fire_alarm_point` off
- server_room: `motion`, `darkAmbient #0a0f1c`, `ambient #a0b0c0`; racks as m02, `market_board`
- executive_wing_hallway: `ambient #bcb6ae`; `fire_alarm_point` off
- executive_office: `motion`, `ambient #d2cdc8`; desk lamp, drinks cabinet, trophy cabinet
- danny_office: `dark`, `darkAmbient #161c30`; desk lamp night only, `fire_alarm_point` off

## 9. Checks and screenshots

- `ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb --skip-ink --no-graph`: schema passes; no lighting warnings (the remaining warnings are the existing dialogue/NPC ones).
- The stock `tools/playtest/lighting-tour.sh` can't be used on m03 as it stands: the opening briefing and then the tutorial prompt stay open, the scene pauses, and the light map stops drawing (first attempt, game 2111: every shot is the briefing). A scratch tour (`build_evidence/lighting_c1/tour.py`) closes both, checks the light map is drawing before each shot, switches a motion room back off after its lit shot so neighbours aren't left lit, and has a night mode that sets `clone_call_done` and `mission_phase`, re-registers rooms with `night_cfg.json`, and shows Danny.
- Screenshots (all looked at): `build_evidence/lighting_c1/day/<room>-a.png` (as loaded) and `-b.png` (motion/dark rooms switched on); `night/` the same with the night globals and the E1 probe. Day game 2121, night game 2122 (Danny's office re-shot in 2123 after the lamp tweak).
- Light-map sanity per shot: `draw+` (ms since last redraw, ~300) and the room's resolved ambient are printed by the tour; all drawing.

## 10. Cycle 2 (2026-10-12): the night switch in place

Engine L1 (room `variants`), L2 (the white-map fix) and L3 (NPC torch) were implemented at the coordinator's instruction, as separate change sets; the tour flags are in `tools/playtest/lighting-tour.sh`. The "With E1" column of section 3 is now what ships. All variants key on `globalVars.clone_call_done === true`.

| Room | Day | Night | Changed in cycle 2 |
|---|---|---|---|
| reception_lobby | on, `#e4e8ee` | on, `#545c70`, no ceiling grid; a cool pool over the counter (r 96, 0.3), a warm cove wash on the WHITEHAT slat wall (r 70, 0.35, no fixture: a concealed strip); counter strip glow 0.8 | variant added; darker than the cycle-1 probe (`#808aa0` read as still lit) |
| main_hallway | motion, `offAfter` 75, threat map | on, "night lights": `#323a50`, two dim pools (r 64, 0.3), threat map | variant added |
| conference_room_01 | on | on | none |
| server_room | motion, server darks | same | none |
| executive_wing_hallway | on, `#bcb6ae` | on, `#343a50`, one low warm pool by the console; Terry's torch beam | variant added; `behavior.torch` on `terry_mott` (night only) |
| executive_office | motion | motion | none |
| danny_office | **on**, lit and empty, lamp off | **dark**, lamp on | base mode `dark` → `on`, variant `mode: dark` |

What the tours show:

- **Live switch:** the night tour registers reception by day (it is the start room) and it moves to its night variant once the globals are set (`--check`: `variant=0 lit=#545c70`). The rooms first loaded after the switch register straight into night.
- **Terry's beam:** a short warm beam the way he faces, over the runner; his vision cone still shows. By day the beam doesn't draw (the room's ambient is too bright).
- **Player torch:** in Danny's dark office the beam reaches Danny from the desk; in the server room it's faint against the racks.
- **Strikes:** server room and CEO office captured frame by frame (`strike/`): dark, two staggered flashes per tube by about 270 ms, lit by about 900 ms.

Not yet proven in a browser: a page reload at night staying night (and by day staying day). The engine resolves variants from the saved globals at load (`registerRoom` → `resolveRoomLighting`), and the node test covers the resolution, but my reload run (sync my game's state to :3001, reload) was blocked by the session's permission classifier. It needs a run by the coordinator or a Sonnet tester.

Screenshots: `build_evidence/lighting_c2/day/`, `night/` (tour flags `--close-intro --restore-off --check`, night adds `--globals clone_call_done=true,mission_phase=act2_infiltration --show-npc danny_foster`), `night/*-player-dark.png` and `-player-lit.png`, `strike/`. Day game 2143, night games 2144 and 2146 (reception, hallways re-shot after tuning), strikes 2145.
