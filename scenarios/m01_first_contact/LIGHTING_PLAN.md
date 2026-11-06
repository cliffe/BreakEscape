# m01 First Contact: lighting plan

Design step, 2026-10-08. Nothing in `lighting.js` or `scenario.json.erb` has changed yet. m01's audio is cached, so this plan touches no ink, no tags and no spoken lines.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, and the first mission players see. The lighting adds tension (dark rooms that strike on as you walk in, screens and lamps left on in empty offices, a server room that glows) and it also teaches the system. So it stays readable: every room the player has to search lights up when they step in, and nothing they must find depends on the light.

**Time of day: not given, and the cues conflict. Lighting keeps the engine's day-office default because nothing points elsewhere.** The building is on mains power; this is not m02's 4 am generator night.

- Morning? Kevin's voicemail is from "Yesterday, 6:47 PM", still unheard, and asks Sarah to call "when you're back" (`scenario.json.erb:1121`, `:1129`). That reads as the next morning.
- Days before the launch: Derek's device shows "T-72 HOURS TO LAUNCH WINDOW" (`:1350`), with the launch "This Sunday, 6:00 AM" (`:1937`). Taken literally, that's around 6 am on Thursday, which fits nothing else.
- Late? Derek's "Working late on the security audit?" (`ink/m01_derek_confrontation.ink:39`) suggests evening by the end.

What is consistent is that it's a working day with only a few people in:

- It's office hours when the player arrives. Sarah is on reception checking in "the IT contractor" (`ink/m01_npc_sarah.ink:22`) and sends you to Kevin, who "should be in the IT room" (`:58`). Kevin's workstation: "He's been in the IT room all day." (`scenario.json.erb:1700`). Maya is at her desk.
- Most of the building is empty. The open-plan office, Kevin's office, the conference room and the storage closet have nobody in them (scenario rooms at `scenario.json.erb:1151`, `:1426`, `:1681`, `:1238`). Patricia's office is empty since she was fired: "Her office has been empty since. It's kind of creepy." (`ink/m01_npc_sarah.ink:176`); the break-room gossip note says the same (`scenario.json.erb:1376`).
- Two desk phones have a blinking message light: reception, "The message light is blinking — one unheard voicemail" (`scenario.json.erb:1130`), and Patricia's, "message light still blinking. Someone called after she was fired." (`:1668`).
- Nothing in the brief (`scenario.json.erb:49`), the opening briefing (`ink/m01_opening_briefing.ink`) or the design docs in the folder gives an hour, a power problem or a colour of light. The 11:47 PM entries in the logs (`:1145`, `:1548`) are Derek's past visits, not today.

**What that means for lighting:**

1. Lit rooms use the engine's day-office ambient (`#c4cad8`, by omitting `ambient`), as sis01 does for its day shift. It's the most readable setting for a first mission, and it leaves m02's amber night as a step change the player notices in the next mission.
2. Rooms where someone is still working (reception, IT, Maya's office, the break room where Derek lingers) are lit.
3. Empty rooms are on motion sensors, as a modern office's are whatever the hour. They're dark through the door, with only what was left on glowing: screens, desk lamps, rack LEDs, and the two message lights.
4. No brownout. The building is on mains power and nothing in the story makes the lights falter (see `DECISIONS_PENDING.md`, L1).

## 2. Evidence

Scratch root: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4e570cac-821c-4e90-9f13-271d108bd68c/scratchpad/m01-design/` (paths below are relative to it). The config was injected from the console into a running game (`inject.js`, `run.sh`, adapted from the sis01 designer's); the scenario file was not edited.

- `v1/` (game 1825): first draft config (`cfg_v1.json`). For every room: `<room>-nolight.png` (lighting off), `<room>-a.png` (as loaded), `<room>-b.png` (every room switched on). `emitters.json` lists each room's emitters with tile positions; `geometry.json` lists each room's objects with tile positions.
- `v2/` (game 1831): the plan's config (`cfg_v2.json`) plus the engine fix E1 patched in from the console (`inject_v2.js`). Crops: `v2/crop-reception-phone.png`, `v2/crop-manager.png`.
- Probe (game 1828, `probe-1828.jsonl`): NPC sprite positions at load.
- `ruby scripts/lighting_lookup.rb scenarios/m01_first_contact/scenario.json.erb`: m01 has no lighting. Only `room_it` has been lit before (sis02's `engineering_workshop`). No light-looking object is missing from `EMITTERS`.

**Finding that shapes the plan.** In `v1/main_office_area-a.png` the open-plan office is lit before anyone has unlocked it. The probe shows why: Sarah's sprite is at world y 41 (`probe-1828.jsonl`), on reception's back-wall strip (reception y 0–64), which is also the bottom of the main office (the room spans y −256 to 64; its sensor area starts below its own back wall, at −192). `npcInRoom` (`lighting.js:659-672`) tests the full room rectangle below the back wall, so Sarah trips the main office's motion sensor. That's engine fix E1 (section 6). With it patched in, the main office starts dark (`v2/main_office_area-a.png`, `v2/emitters.json`: `main_office_area` off).

## 3. Room modes

Layout (world px, from `v1/geometry.json`): reception (start) at the south; main office north of it, with the break room west and the IT room east; the conference room south of the break room, the server room south of IT; two short hallways north of the main office; four small offices north of the hallways (manager, Kevin, Maya, Derek, west to east) and the storage closet east of `hallway_east`.

| Room (line) | Mode | Why | Must find or read here | Readable? |
| --- | --- | --- | --- | --- |
| reception_area (509) | on (default; Sarah) | Sarah works here and the player starts here. First room, first impression: a normal lit office. | Sarah, desk phone (voicemail, IT PIN), Building Directory, Visitor Sign-In Log, all on the desk | Lit throughout |
| main_office_area (1151) | **motion** | Empty open-plan office behind the first locked door. The player unlocks it with Sarah's key and steps into the dark, the desk lamps and screens left on, then the tubes strike. This is where the mission teaches the motion sensor. Needs E1, or Sarah lights it from reception. | Filing cabinet (PIN safe), two chalkboards, recycling bin | Lit on entry; the room is locked, so the player can only reach these by walking in |
| break_room (1290) | on (default; Derek) | Derek is here all mission. The confrontation happens here, so it must be lit. | Derek, Office Gossip, calendar, recycling bin | Lit throughout |
| conference_room (1426) | **motion** | Empty meeting room reached only through the break room. Two desk lamps and the wall screen glow on the table in the dark (`v1/conference_room-a.png`). | Meeting Calendar, Paper Bin, both on the table | Lit on entry |
| it_room (1470) | on (default; Kevin) | Kevin "in the IT room all day". sis02's block for this room type is not reused (section 5). | Kevin, IT Monitoring Station, IT Security Concerns | Lit throughout |
| hallway_west (1564) | **motion**, **flicker**, `offAfter: 75` | Empty corridor; the one faulty tube in the mission. It's outside Patricia's vacated office, the room Sarah and the gossip note call creepy. No objects to find (three pictures). | Nothing | Doors outlined in the dark (`v1/hallway_east-a.png` shows the pair) |
| hallway_east (1575) | **motion**, `offAfter: 75` | Empty corridor to Derek's office, Maya and the storage closet. Steady tubes; the faulty one is in the west hallway only. | Nothing | As above |
| manager_office (1587) | **motion** | Patricia's office, cleared since she was fired. Nothing left on but her phone's message light (section 6). | Briefcase, desk phone (voicemail), Termination Letter | Lit on entry |
| kevin_office (1681) | **motion** | Kevin isn't here (he's in IT). His workstation was left on and glows. | Kevin's Workstation, Out of Office Note, IT Incident Log | Lit on entry |
| maya_office (1744) | on (default; Maya) | Maya works here. | Maya, Disinformation Research, SAFETYNET Contact | Lit throughout |
| derek_office (1794) | **motion** | The office the player breaks into (key or lockpick). Derek's PC is the only light inside (`v1/hallway_east-a.png`, top right). | Derek's Computer, two encoded notes, personal safe, filing cabinet, calendar | Lit on entry |
| storage_closet (1238) | **motion** (no flicker) | A store nobody uses at this hour. **Not** the flicker room, even though m02 put its flicker in a store: Derek's PIN safe is a puzzle here, and the brief keeps flicker away from puzzles. | Derek's Safe, Maintenance Log (Backup) | Lit on entry |
| server_room (1953) | **motion**, dark server-room ambient, cool lit ambient, rack glow | RFID-locked; the room that glows. Racks and the VM terminals carry it in the dark (`v1/server_room-a.png`). | VM Access Terminal, Drop-Site Terminal, ENTROPY Encrypted Archive (safe at tile 1.1, 6.3) | Lit on entry; all three open minigames that draw above the lighting |

No room uses `dark`: nothing in the story cuts a room's power.

Flicker: one room only (hallway_west), within the skill's "one or two per mission". It has nothing to read or solve.

- Caveat (review m5): the hallway's single row of ceiling panels sits on the two-tile strip shared with the main office's back wall. The south room owns that strip's light (`fillAreas`), so the faulty panel's dip may show on only half its pool.
- The visual round checks that the flicker still reads. If it doesn't, move it to hallway_east, or drop it rather than add a light.

`offAfter: 75` only on the two hallways, copied from m02's corridors (section 5). Both are transit rooms the player crosses many times. Coming back after a long spell in Derek's office or the server room, they find the corridor dark again and the tubes strike, which shows that the lights really are on sensors. Offices keep their lights on once lit (no `offAfter`), so a room the player is searching never goes dark around them.

People and sensors:

- Phone contacts (`agent_0x99`) and the hidden debrief character don't count as people (`lighting.js:303`).
- The briefing character `briefing_cutscene` stands at world (16000, 15969), outside every room (`probe-1828.jsonl`), so it lights nothing.
- If Derek, Kevin or Sarah turns hostile and chases the player into a dark room, they trip its sensor (`lighting.js:647-656`). That's intended.

## 4. What the player sees entering each room

"Strike" means the fluorescent start: two flashes per tube, staggered, with the click and hum.

- **Reception** (start): an ordinary lit office, the engine's day ambient. Two desk lamps on the reception counter; the desk phone's message light blinks a small red next to Sarah. Through the north door, the main office is dark.
- **Main office**: unlock the door and it's dark except for four desk lamps and seven screens left on across the two desk clusters (`v2/main_office_area-a.png`). Step in and the tubes strike. Lit, it's the normal office (`v1/main_office_area-b.png`). The first lesson: empty rooms are dark until you walk in, and they light themselves.
- **Break room**: lit; Derek by the sofas. Lamps on the tables.
- **Conference room**: through the break room's south door, a dark room with two warm lamp pools on the table and the wall screen's blue glow. Strikes on as you enter.
- **IT room**: lit; Kevin at his desk, the racks along the north wall showing LEDs, the wall screen blue.
- **Hallways**: dark corridors with the doors just visible. The tubes strike as you enter. In the west hallway one tube dips now and then. After 75 seconds away, each goes dark again.
- **Patricia's office (manager_office)**: black but for one small red light blinking on the desk, her phone's message light (`v2/crop-manager.png`). Strikes on as you enter.
- **Kevin's office**: dark, his workstation glowing blue on the desk. Strikes on.
- **Maya's office**: lit; Maya at her desk.
- **Derek's office**: through the locked door, dark with his PC glowing on the desk. Strikes on once you're in.
- **Storage closet**: dark, filing cabinets and the safe faintly outlined. Strikes on.
- **Server room**: badge in and it's near black: rack LEDs blink, the racks give off green, the VM terminal and drop-site terminal glow blue, the wall screen glows. Step in and the tubes strike, but the room stays cooler and dimmer than the offices so the racks still read as the room's light.

## 5. Settings reused from other missions

The lookup finds only one m01 room type lit elsewhere (`room_it`). Every other m01 room type is new to lighting, so for those the reuse is by role: blocks with no tile coordinates, copied from a room doing the same job in another mission.

| m01 room | Copied from | What | Changed? |
| --- | --- | --- | --- |
| scenario level | sis01 (day shift) | engine default ambient (no `ambient` key) | No. m02's `#c0bdb2` is a 4 am generator night, the wrong hour and power for m01. |
| server_room (`room_servers`) | m02 `server_room` (`room_hospital_servers`, `m02 scenario.json.erb:2151-2159`) | `mode: motion`, `darkAmbient: #0a0f1c`, `ambient: #a0b0c0`, rack `emitters` with `floorTint: 0.6` | Only the emitter keys. m02 lists four prefixes (`server`, `network_rack`, `storage_array`, `tape_library`); m01's room has only `servers` and `servers3` objects, both matched by the `server` prefix, so the other three are dropped as dead keys. Same role (empty server room with the VM desk, behind an RFID door). `#a0b0c0` is below the readability floor, which m02 accepted for its server room; here too the puzzles all open minigames, and the archive safe stays clear when lit (`v1/server_room-b.png`). |
| hallway_east | m02 `ward_hall` / `ward_approach` (`m02 scenario.json.erb:3284`, `:3329`) | `{ "mode": "motion", "offAfter": 75 }` | No. Same role: an empty transit corridor crossed many times. |
| hallway_west | m02 corridors, as above | `mode: motion`, `offAfter: 75` | Adds `flicker: true` (m01's one faulty tube, reason in section 3). m02's flicker rooms are a store and a vestibule; the vestibule's extra light uses that map's tile coordinates, so it isn't copied. |
| storage_closet | m02 `emergency_equipment_storage` (`:2561`) | `mode: motion` | Drops `flicker`: m01's closet holds Derek's PIN safe, and the brief keeps flicker away from puzzles. |
| manager_office, kevin_office, derek_office, conference_room, main_office_area | m02 `security_office` (`:2967`), `staff_room` (`:3206`) | `{ "mode": "motion" }` | No. Same role: an empty office or meeting room the player enters to search. |

**Not reused: sis02's `room_it` block** (`engineering_workshop`: `{"mode":"motion","emitters":{"servers":[{"ledColor":"#4dff7a"}]}}`).

- Different role. sis02's workshop is empty at 06:28; m01's IT room has Kevin in it all mission, so it starts lit whatever the mode (`lighting.js:304`). The default `on` says that plainly.
- The green-only LEDs are a sis02 clue rule: an amber-lit rack there is the attacker's jump server, seen before the logs say anything (LIGHTING_LOG, sis02 visual round 3). m01 has no such clue, and the default mix of green, amber and blue LEDs reads as busy kit.

## 6. Light sources and EMITTERS

**What the maps already give** (`v1/emitters.json`), all matched by existing `EMITTERS` entries:

- Screens (blue): main office `pc6`, `pc8`, `pc11`, `laptop1/5/6`; IT `pc3` (the monitoring station) and `smartscreen`; conference and server-room `smartscreen`; Kevin's and Derek's `pc5`; server room `vm-launcher-kali` and `flag-station`.
- Desk lamps (warm): reception ×2 (`office-misc-lamp4`), main office ×4 (`lamp2`, `lamp3`), break room ×2, conference room ×2.
- Racks (green, LEDs): IT `servers3` ×2 and `servers4`; server room `servers` ×2 and `servers3` ×2.

**Flagged by the lookup as light-looking but not in `EMITTERS`:** none.

**Not a light source, left alone:** Patricia's desk lamp is part of the `desk-ceo2` art, not a separate object (`v2/crop-manager.png`), so `EMITTERS` can't match it. It's right that it's off: she's gone.

**New light: the two message lights (scenario config, no EMITTERS change).** Both phones' text says the message light is blinking (`scenario.json.erb:1130`, `:1668`), and the art has no light on it. A room `emitters` variant keyed by object id gives each phone a small red blink:

```json
"reception_desk_phone": [ { "color": "#ff5a3c", "radius": 18, "intensity": 1.0, "offsetY": 2, "effect": "blink", "above": true } ]
```

(and the same keyed `patricia_desk_phone` in `manager_office`).

- `above: true` keeps it visible in lit reception, where a plain glow would vanish into the ambient. It's a small indicator, the case the flag exists for (schema `emitterVariant.above`; sis01 uses it for Bed 4's alarm).
- Keyed by id, so the other `phone4` objects (main office, server room) stay dark.
- **The reception light is a signpost to a critical-path clue.** The voicemail on that phone is where the player learns the IT room PIN (`scenario.json.erb:1118-1120`: `puzzle_graph_unlocks: it_room`, `puzzle_graph_reveals: it_room_pin`). The red blink draws a first-time player's eye to it. That's a gentle hint, and it's justified because the phone's own text says its message light is blinking (`:1130`), so the light repeats what the game already says (rule D2). Orchestrator decision: keep it.
- The phone doesn't depend on the light. It sits on the desk beside Sarah, and with lighting off the clue is found the same way. Patricia's phone is on her desk in a room with only two other objects.
- Nothing in the game marks a voicemail as heard, so the lights blink all mission, as real ones do until someone deletes the message.
- **Values** (review m2: radius 14 and intensity 0.9 were invisible in lit reception): radius 18, intensity 1.0, `offsetY: 2`.
  - The sprites: `phone1` (reception) is 20×17 px with its red message key at about (17, 11); `phone4` (Patricia) is 14×16 px with its red keys at about x 8–12, y 8–13 (`assets/objects/phone1.png`, `phone4.png`; enlarged copies in scratch, `phone1-x8.png`, `phone4-x8.png`).
  - The glow is placed at the sprite's centre plus `offsetY` (`lighting.js:850-851`); there's no x offset. `offsetY: 2` moves it from the centres (y 8.5 and 8) down onto the keypad rows with the red keys. At radius 18 it covers the whole phone, centred on the keypad rather than the handset.
- Keep `blink`. If it doesn't read in the visual round, try `pulse`.
- Flash safety: `blink` swings the glow between 70% and 100% about once a second (`lighting.js:855`, period 2π × 140 ms ≈ 0.9 s), over an 18 px radius. Well under three flashes a second, and steady under `prefers-reduced-motion`.
- Seen at the old values (radius 14, intensity 0.9): in the dark office the red reads as a light on the desk (`v2/crop-manager.png`); in lit reception it's a barely visible tint (`v2/crop-reception-phone.png`). The new values haven't been rendered; the visual round checks them.

**Proposed EMITTERS additions: none.**

### E1. Engine fix: an NPC on a back-wall strip trips the room to the north (lighting.js)

- **Problem.** Rooms overlap north–south by two tiles: the strip is the south room's back wall (`fillAreas`, `lighting.js:929-949`). `npcInRoom` (`:659-672`) tests the full rectangle of the room below its own back wall, which includes that strip. Sarah's sprite centre (world y 41, `probe-1828.jsonl`) is on reception's back wall, so the main office's sensor sees her and it switches on at load (`v1/main_office_area-a.png`). Any NPC standing against the north wall of a lit room does the same to a motion room above it.
- **Fix (review m4; the engine owner is implementing it now).** `npcInRoom` tests the NPC's feet, not the sprite's centre: the physics body's centre (`sprite.body.center`), which must fall inside one of `this.fillAreas(state.roomId)`. That is the rule the light map already uses for which room owns the strip, so an NPC standing at reception's desk counts as in reception, not in the main office.
- **Probe.** My console patch was an earlier version (the sprite centre plus `fillAreas`; `inject_v2.js`). With it, the main office starts dark and switches on only when the player walks in (`v2/main_office_area-a.png`). The feet-point version should behave the same for Sarah, whose feet are lower on reception's floor.
- **KO'd hostiles.** A knocked-out NPC whose body stays in a dark room keeps that room's sensor on. Harmless: the player is usually in that room anyway.
- **Checks.** There are no unit tests for lighting, so E1 is checked by tours. Run the m01 tour (`main_office_area` reports `off` at load). Re-run the m02 tour (`tools/playtest/lighting-tour.sh m02_ransomed_trust`) and check that every room's on/off state matches its committed config, then spot-check sis02. Only NPCs on a back-wall strip should change.
- **Without E1**, m01's main office is lit before the player opens it, and the mission's best teaching moment is lost. Don't ship the m01 config without it.

## 7. Exact JSON to add

All in `scenarios/m01_first_contact/scenario.json.erb`. Line numbers are from the working tree on 2026-10-08. Room blocks go on the line after the room's `"type"` line, as in m02. Rooms not listed (break_room, it_room, maya_office) get no block: they default to `on`. No ink, no tags, no spoken lines.

**C0. Scenario level**, a new line before `"rooms": {` (line 508):

```json
  "lighting": { "enabled": true, "defaultMode": "on" },
```

**C1. reception_area** (after line 510, `"type": "room_reception",`):

```json
      "lighting": {
        "emitters": {
          "reception_desk_phone": [ { "color": "#ff5a3c", "radius": 18, "intensity": 1.0, "offsetY": 2, "effect": "blink", "above": true } ]
        }
      },
```

**C2. main_office_area** (after line 1152), **storage_closet** (after 1239), **conference_room** (after 1427), **kevin_office** (after 1682), **derek_office** (after 1795):

```json
      "lighting": { "mode": "motion" },
```

**C3. hallway_west** (after line 1565):

```json
      "lighting": { "mode": "motion", "flicker": true, "offAfter": 75 },
```

**C4. hallway_east** (after line 1576):

```json
      "lighting": { "mode": "motion", "offAfter": 75 },
```

**C5. manager_office** (after line 1588):

```json
      "lighting": {
        "mode": "motion",
        "emitters": {
          "patricia_desk_phone": [ { "color": "#ff5a3c", "radius": 18, "intensity": 1.0, "offsetY": 2, "effect": "blink", "above": true } ]
        }
      },
```

**C6. server_room** (after line 1954):

```json
      "lighting": {
        "mode": "motion", "darkAmbient": "#0a0f1c", "ambient": "#a0b0c0",
        "emitters": {
          "server": { "radius": 56, "intensity": 0.7, "floorTint": 0.6 }
        }
      },
```

These match `v2/` (`cfg_v2.json`), except that the two phone variants now use the review-m2 values (radius 18, intensity 1.0, `offsetY: 2`), which haven't been rendered yet. Colours and radii are starting values; the tour decides the final ones, and each change is logged with its reason.

## 8. Work order and checks

1. **Engine (Opus, the one agent on `lighting.js`): E1.** Then:
   - `node --test test/js/` and `bin/rails test`, as a general regression check (there are no lighting unit tests, so E1 itself is checked by the tours below);
   - the m02 tour, comparing each room's on/off state and frame with the last committed tour (only rooms with an NPC on a back-wall strip may change);
   - a sis02 spot check.
   - Commit separately, before m01.
2. **Config (Sonnet): C0–C6** as written.
   - `ruby scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb --skip-ink --no-graph`: schema passes, no lighting warnings.
   - Confirm no file under `scenarios/m01_first_contact/ink/` changed (`git status`).
3. **Tour:** `tools/playtest/lighting-tour.sh m01_first_contact <scratch>/m01-after`.
   - `main_office_area` reports `off` (E1 working).
   - Every motion room has an `-a` (dark) and `-b` (lit) shot.
   - Add `--player server_room:4,6:up` to see the torch and the rack glow over the player at the VM desk, and `--player derek_office:2,3:up` for a small office.
4. **What to check in the shots:**
   - Dark rooms: the doors are findable; the main office's lamps and screens don't white out the desks. The right-hand cluster (lamps at tiles 6.6, 3.3; 7.7, 4.9; 8.8, 4.1 with three screens) is the brightest spot in `v2/main_office_area-a.png`. If the review finds it blown out, add a main-office `emitters` override for `office-misc-lamp` (e.g. intensity 0.6) rather than changing the global lamp entry.
   - Lit rooms: they look like the room, not grey.
   - hallway_west: the faulty tube's dip is visible even though half its pool falls on the main office's back-wall strip (section 3), and there's nothing to read there. Drive one session and call `switchOn('hallway_west')`, because a still shot can't show the dip.
   - Message lights (radius 18, intensity 1.0, `offsetY: 2`): visible in lit reception, and sitting on the keypad, not floating above the phone. If `blink` doesn't read, try `pulse`.
5. **Flash safety:**
   - The only new effect is `blink` on two 18 px lights, about 1 Hz.
   - The flicker in hallway_west uses the existing faulty-panel dip (`DIP_LEVEL` 0.55, at most two dips per burst).
   - `STRIKE_SEQUENCE`, `DIP_MS` and `DIP_LEVEL` are unchanged.
6. **Record:** m01's room modes, the day mood and E1 in `docs/agents/LIGHTING_LOG.md`. The orchestrator adds the "working day, hour not given = engine default" row to the skill's mood table (the user has uncommitted edits to `SKILL.md`).

## 9. Noticed, not acting on

- The lookup's light-looking pattern (`scripts/lighting_lookup.rb:26`, `LIGHTISH`) doesn't include `phone`, so phones with a message light are never flagged. Tooling, not this pass.
- The NPC id `sarah_martinez` has the display name Sarah O'Brien (`scenario.json.erb`, reception NPCs). Under the rename-ids rule it would change, but m01 is exempt because its audio is cached (AGENTS.md, "Standing user rules"). Not lighting.
- Only four rack objects in the server room register as emitters (`servers` at tiles 2.2, 2.8 and 2.2, 3.8; `servers3` at 2.3, 0.5 and 6.1, 0.6; `v1/emitters.json`), so the two long rack rows carry fewer LEDs than their art suggests. The room still reads as glowing in `v1/server_room-a.png`, so nothing is needed.
- Kevin's and Derek's offices share a map (`small_office_room1_1x1gu`), so their PCs glow in the same place. They're on different sides of the corridor, so it doesn't read as a copy.
