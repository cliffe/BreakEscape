# sis01_healthcare lighting plan

Status: design, 2026-10-08. Not yet reviewed or applied. Nothing in `lighting.js` or `scenario.json.erb` has changed.

## 1. Kind of game and mood

sis01 is a Security-Informed Safety serious game: education first, often played by student teams, no spy framing, no combat (`"disableAttacks": true`, `scenario.json.erb:138`). Lighting has two jobs here: make Northgate General look like a real hospital at the hour the game is set, and never get between a student and something a decision depends on. Moderate atmosphere, no horror, no flicker.

### Time of day: 07:30 on a Tuesday, late autumn, start of the day shift

- **Brief:** "Tuesday, 07:30. You have been called in to help manage a Major Incident" (`scenario.json.erb:130`, the `scenario_brief`). The header comment says the same: "Tuesday 07:30, about nine hours in" (`:9`). The in-game clock starts at `"Tue 07:30"` (`:141`).
- **Information pack:** "By 06:00, the full scale of the enterprise compromise is apparent ... at 07:30 external incident responders arrive on Ward 7" (`information_pack.md:2157`). Season: "In late autumn 2025" (`information_pack.md:2083`); the SIEM alert set is `northgate_2025_11` (`scenario.json.erb`, siem_console comment). The ward's alarm audit is "reviewed by the ward manager during morning handover" (`information_pack.md:194`).
- **Ink:** it's a morning after a night. Ravi: "Nine hours in, I've been on my own all night" (`ink/npc_ravi.ink:70`). Mrs Kowalski: "You all look like you've been up all night with this" (`ink/npc_bed5_patient.ink:50`) and "Last night we were all on that big screen. Then it went dark" (`:67`). Sarah, Priya S. and David all say "this morning" (`ink/npc_sarah.ink:178`, `ink/npc_sharma.ink:306`, `ink/npc_david.ink:115`).
- **Windows:** the Major Incident Room has one ("The tablet by the window", `ink/npc_hartley.ink:209`, `ink/npc_helen.ink:91`; `window_blinds1` in `room_hospital_meeting`). The ward and the IT office have none.

### Mood

A hospital at the start of the day shift after a very bad night. The tiredness is in the people (cold coffee, Ravi's overnight bag, `scenario.json.erb:2095-2096`), not in the light. At 07:30 a ward has its main lights up for handover and the morning drug round, and the offices are lit because people have been working in them all night. Nothing in the text says any light is off, dim or faulty. The hospital is on mains power: unlike m02 there are no generators in the story.

So every room is plainly lit at the engine's day level, and the only "mood" comes from what the story already puts on the screens:

- the two ransomed screens glow red (the ward's central monitoring station and the IT office's infected PC);
- Bed 4's bedside monitor shows a small red alarm light;
- every other screen, bedside monitor and lamp glows as normal.

**Scenario-level ambient: none (the engine default `#c4cad8`).** It is the "Day office, default" row of the skill's mood table, and the lightest, most readable option. m02's generator amber (`#c0bdb2`) and sis02's night-shift `#b8bfce` are both wrong for 07:30 on mains power.

### Not m02's night

m02 is set at "Ten past four in the morning" on generator power with "the lights run amber" (`m02 ink/m02_npc_receptionist.ink:66`). sis01 uses the same hospital maps but is set three and a half hours later in a different hospital with the power on. None of m02's mood carries over.

## 2. Evidence

Scratch root: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4e570cac-821c-4e90-9f13-271d108bd68c/scratchpad/sis01-design/` (paths below are relative to it).

- `ruby scripts/lighting_lookup.rb scenarios/sis01_healthcare/scenario.json.erb` (run 2026-10-08): three rooms, all `[people]`; each room type is lit only in m02 (section 4).
- **Throwaway render.** The scenario file was not touched. `run.sh` makes a fresh sis01 game on :3001, unlocks every room, loads all three, shoots them with no lighting, then injects a config from the browser console (`inject.js`: sets `gameScenario.lighting` and room blocks, calls `initLighting`, registers each room) and shoots them again. It also dumps every emitter's object id, texture key, tile position and resolved colour (`v1/emitters.json`). Sessions 1812 and 1815, both stopped.
  - `v1/`: config `cfg_v1.json` (default ambient; Bed 4 red pulse; a desk-phone LED; a daylight pool at the meeting-room window). `<room>-nolight.png` and `<room>-lit.png`; crops `bed4-pair.png` and `station-pair.png` (no lighting on the left or top).
  - `v2/`: `cfg_v2.json` (Bed 4 with `floorTint` 0.3); crop `bed4-lit.png`.
- **What the render showed:**
  - All three rooms read cleanly at the default ambient, close to the no-lighting shots. Every character, bed, chart and screen stays easy to pick out (`v1/ward_7-lit.png`, `v1/it_security_office-lit.png`, `v1/major_incident_room-lit.png`).
  - The ward monitoring station's built-in ransom red is a contained red pool at the east end of the nurses' station desk (`v1/station-pair.png`). It is not dramatic.
  - The infected PC's red glow on the KVM trolley matches its text, "casts a red glow over the trolley" (`scenario.json.erb:2066`; `v1/it_security_office-lit.png`).
  - Bed 4's red pulse shows as a faint pink halo at the screen's top (`v1/bed4-pair.png`). `floorTint` 0.3 added nothing visible (`v2/bed4-lit.png`), so it is not in the plan.
  - The desk-phone LED (radius 10) and the window daylight pool (radius 90, intensity 0.35) were invisible in a lit room. Both are dropped, the same finding as m02's C5 desk lamp.
  - The IT office's ransom red crosses the IT/ward wall and tints a strip of the ward's back wall above Bed 1 (`v1/ward_7-lit.png` near 300–420, 150–195; `v1/it_security_office-lit.png` near 700–760, 735–750). This is the known "light crosses walls" limit (section 9).

## 3. Room modes

Three rooms, all `on`. No `motion`, no `dark`, no flicker, no `offAfter`, no `lighting_dip`.

| Room (line) | Type | People | Mode | Why |
| --- | --- | --- | --- | --- |
| `ward_7` (713, start) | `room_hospital_ward` | Sarah, the patrol nurse, three patients, later the pharmacist | `on` (default) | A staffed ward at the start of the day shift has its lights up. The player starts here, and most of the safety decisions are made here: the monitoring station, Bed 4's monitor, the paper MAR charts, Bed 2's pump, the EHR terminal and the desk phone. |
| `it_security_office` (1656) | `room_hospital_office_it` | Ravi | `on` (default) | Ravi has worked here all night (`ink/npc_ravi.ink:70`). The SIEM, VPN log terminal and network map are here. |
| `major_incident_room` (2101) | `room_hospital_meeting` | David, Helen, Dr Hartley, later Priya S. | `on` (default) | Incident command, staffed since the Major Incident was declared. The command board, backup console, drug library terminal and ICO tablet are here. |

**Why no `motion`.** All three rooms have people standing in them from the start, so a motion room would start lit anyway (`lighting.js:302-303`). Setting it would only add a strike if someone left, and nobody does. A dark-then-strike entrance is the spy-thriller effect m02 uses for empty corridors and stores. sis01 has no empty rooms.

**Why no flicker.** The skill keeps flicker for "a neglected store, a back corridor" and away from "rooms the player spends long in". All three sis01 rooms are rooms the player spends long in and decides things in. Nothing in the text mentions a faulty light. A student team arguing over a safety case doesn't need a tube dipping overhead.

**Why no `dark` or brownout.** Nothing in the story cuts power. The hospital's problem is encrypted systems, not electricity (the brief, `scenario.json.erb:130`; `information_pack.md:2157-2159`). A brownout would suggest a power fault the scenario doesn't have, which would mislead a student about the incident.

**Why no extra `lights`.** Panels light every room evenly. The two extra lights tried (a window pool and a phone LED) were invisible in a lit room (section 2).

## 4. Settings reused from m02, and what differs

The lookup finds each sis01 room type lit only in m02. The reuse rule is to copy where the role matches and change only for a reason you can state.

| sis01 room | m02 room, block (m02 `scenario.json.erb` line) | sis01 | Reason |
| --- | --- | --- | --- |
| `ward_7` | `hospital_ward`, the night-ward block (`:1487-1499`, quoted below) | **not copied** | Different time of day. m02's block is a 4 am ward: panels off, a dim warm `#b8b4a8` ambient, and two lamp pools at the nurses' station and Bed 2. sis01 is 07:30 at the start of the day shift, with the main lights up. Its `ehr_terminal_ward` variant also doesn't apply: sis01's EHR terminal has a different id (`ehr_terminal`) and isn't a ransom display. |
| `it_security_office` | `it_department`, no block (scenario default `on`) | **copied as is**: no block | Same role: a staffed IT office. |
| `major_incident_room` | `conference_room`, no block (scenario default `on`) | **copied as is**: no block | Same role: a staffed meeting room. |
| scenario level | `{ "enabled": true, "defaultMode": "on", "ambient": "#c0bdb2" }` (`:558`) | `enabled` and `defaultMode` copied; **`ambient` left out** | m02's amber is generator light at 4 am. sis01 is daytime on mains (section 1). |

m02's ward block, for the record (not to be applied):

```json
"lighting": {
  "panels": false,
  "ambient": "#b8b4a8",
  "lights": [
    { "x": 16.5, "y": 5, "color": "#ffd9a0", "radius": 140, "intensity": 0.75 },
    { "x": 8, "y": 3, "color": "#ffe6c0", "radius": 90, "intensity": 0.6 }
  ],
  "emitters": {
    "ward_manual_bp_cuff": [ { "intensity": 0 } ],
    "ehr_terminal_ward": [
      { "condition": "globalVars.ward_recovering", "color": "#9fd4ff", "radius": 44, "intensity": 0.65, "effect": "screen" }
    ]
  }
}
```

Its two light positions still fit sis01's ward: Sarah stands at the station (16, 4) and Bed 2's patient at (8.1, 3), `scenario.json.erb:736`, `:1166`. If a later sis-style mission set on this map needs a night ward, that block drops straight in.

What sis01 does take from m02 is engine behaviour, with no config needed:

- the built-in ransom-screen red (`RANSOM_VARIANT`, `lighting.js:72`), which m02's rounds 1–2 tuned so it reads in lit rooms;
- the vitals-monitor glow offset onto the screen (`lighting.js:136`);
- glows sitting behind characters who stand in front of them.

m02 is in its final tuning round. If `RANSOM_VARIANT`, `RANSOM_LIT_RADIUS` or the panel constants move, sis01 inherits the change. The implementer should re-run the lookup and the tour before applying anything.

## 5. Light sources and objects a decision depends on

### What glows today (from the render's emitter dump, `v1/emitters.json`)

Texture keys are what the engine matched. The scenario `sprite`, or else the Tiled object the scenario object lands on.

| Room | Object (id) | Key | Tile | Glow |
| --- | --- | --- | --- | --- |
| ward_7 | `ward_monitoring_station` | `pc` | 17.3, 3.6 | **ransom red, breathe** (built-in) |
| ward_7 | `ehr_terminal` | `pc` | 14.5, 3.6 | screen blue |
| ward_7 | `bed4_monitor` | `vitals-monitor2` | 3.7, 5.9 (beside Bed 4) | vitals green, **red in this plan** |
| ward_7 | `bed1/2/3/5/6` vitals, `bed2_pump_terminal`, bedhead panels/units | various | — | vitals green |
| ward_7 | `ward7_ecg_machine` | `monitor_stand1` | 18.3, 5.5 | screen blue (a standby screen; fine) |
| ward_7 | map lamp, X-ray lightbox, nurse-call display | — | — | warm / white / blue |
| it_security_office | `siem_console` (Ravi's laptop), `vpn_terminal` | `pc5`, `pc` | 2.9, 3.1; 4.6, 3.1 | screen blue |
| it_security_office | infected PC (no id; engine gives `it_security_office_pc_3`) | `kvm_cart1` | 5.1, 6.0 | **ransom red, breathe** (built-in) |
| it_security_office | map comms cabinet, network rack | — | — | green, LEDs |
| major_incident_room | `command_board` | `conference_screen1` | 4.3, 0.6 | screen blue |
| major_incident_room | `backup_console`, `drug_library_checker` | `laptop6` | 3.8, 4.9; 5.6, 4.9 | screen blue |
| major_incident_room | ICO tablet (no id), `ig_breach_briefing` | `tablet` | 3.1, 4.4; 6.2, 4.4 | screen blue |

The lookup flags no light-looking object outside `EMITTERS` in these three maps. **No new EMITTERS entries are needed.**

### The ransom-screen red: keep the built-in, in both rooms

The engine already makes both `ransomware_display` objects glow red while `ransomware_deployed` holds (`lighting.js:29-30`, `:72`, `:407`). sis01 sets it true at the start (`scenario.json.erb:267`) and never clears it. The brief said six objects. There are two: `ward_monitoring_station` (`:1381`) and the IT office's infected PC (`:2064`). "6 patient monitoring workstations" is text inside the ransom note.

Kept as is, because:

- **It repeats the text exactly, and says nothing new.** The station's observation: "a ransom note on a black background. Red text." (`:1388`). The infected PC "casts a red glow over the trolley" (`:2066`). The glow is constant for the whole game. It never changes with a decision, so it can't hint at anything.
- **It is the right length of the game.** The station "does NOT transition back to live ward telemetry during the scenario" (`:1383-1386`), so unlike m02's ward EHR terminal there is no recovery variant to add.
- **It points students at their first task, which is what the scenario wants.** The first ward objective is "Check the ward monitoring station" (visible in `v1/ward_7-lit.png`). A red screen at the nurses' station is where Sarah's briefing sends them anyway.
- **It isn't too dramatic.** `breathe` is a slow 4.4 s swell between 50% and 100% (`lighting.js:849`), nowhere near a flash. Under reduced motion it holds steady. In the render the red is a contained pool at one end of the station desk (`v1/station-pair.png`). The rest of the ward is plainly lit and calm. One red screen in a working ward is the incident as the scenario describes it. That is not horror.
- **A toned-down variant costs more than it gains.** Room `emitters` variants can't carry the built-in's `ransom` flag (schema `emitterVariant`, `scripts/scenario-schema.json:162-176`, `additionalProperties: false`). Any override drops to the ordinary glow path, which barely shows in a lit room (m02 round 1). So the only real choices are the built-in or nearly nothing.

Fallback, only if the reviewer or the visual round judges the ward's red too strong. It is ward only. The IT text asks for the red glow, and that object has no stable id anyway:

```json
"emitters": {
  "ward_monitoring_station": [
    { "condition": "globalVars.ransomware_deployed", "color": "#ff3b30", "radius": 40, "intensity": 0.6, "effect": "screen", "floorTint": 0.5 }
  ]
}
```

Expect a faint pink pool on the desk front in its place.

### New: Bed 4's monitor shows a red alarm light (per-room `emitters`, by object id)

- **Text.** "A red alarm indicator is flashing at the top of the screen. The alarm tone is audible from across the bay." (`scenario.json.erb:1616`). After a death: "The alarm tone is continuous and harsh." (`:1620`). Every other state's text still has the monitor alarming (`:1622-1633`).
- **Why it's worth it.** It is the teaching point of the ward made visible. The bedside alarm is local, and the central station that should relay it is dark (`information_pack.md:1635`, `:2159`). A small red light by Bed 4 against a red ransom screen at the desk shows exactly that gap, without a word.
- **The D2 condition** (glows that follow game state only repeat what the player is already told) holds. The light is red from the start, as the observation says. The only change is pulse to steady after Bed 4's death. The death itself is told in dialogue and on the monitor's own text, and the pulse-to-steady change matches "continuous".
- **Flash safety.** `pulse` is a 1.9 s sine (`lighting.js:848`) on a 30 px glow. Under reduced motion it holds steady.
- **How it looks.** Subtle: a faint red halo at the top of the screen in a lit ward (`v1/bed4-pair.png`). That is enough for a status light. `floorTint` added nothing (`v2/bed4-lit.png`), so it is left out. If the visual round wants more, raise intensity towards 0.8. Don't make it big: it is an indicator, not a beacon.
- **Placement.** The object lands on the `vitals-monitor2` beside Bed 4 (tile 3.7, 5.9; Bed 4 is tiles 2.5–3.7, y 5.6–7.8), so the light marks the right bed. `offsetY` −18 comes from the base vitals-monitor entry.

### Tried and dropped

- **Desk-phone message light** (`ward_desk_phone`, "The message light is blinking", `:1519`): an amber 10 px `blink` was invisible in the lit ward (`v1/ward_7-lit.png` at the phone, about 1185, 460).
- **Daylight at the meeting-room window** (tile 6.5, 2.4, radius 90): invisible in a lit room (`v1/major_incident_room-lit.png`). The window's blinds art already says "window".

### Objects a decision depends on: none can be hidden

All three rooms are `on` from load, so no mode hides anything. Readable content (notes, MAR charts, SIEM, VPN filter, network map, backup console, drug library terminal, pump, EHR, tablet, the dual-auth forms) opens in a minigame or text panel drawn above the game. Lighting never touches reading it. What lighting could affect is *finding* an object, so each one was checked in the lit shots:

- **ward_7:**
  - the monitoring station is red and obvious;
  - the EHR terminal glows blue;
  - Bed 2's pump and every patient are clear;
  - the MAR charts and notes at the east end of the station desk pick up a light pink from the ransom floor tint and stay plainly paper (`v1/station-pair.png`);
  - Bed 4's monitor is clear, with its small red light;
  - the desk phone is clear.
- **it_security_office:** the SIEM laptop, the VPN terminal, the network map on the whiteboard, Ravi, the infected PC and the notes are all clear (`v1/it_security_office-lit.png`).
- **major_incident_room:** the command board, both laptops, the tablets, the binder, the printed ransom note, the four NPCs and the door are all clear (`v1/major_incident_room-lit.png`).

Overlays (talk icons, markers) are lifted above the light map by `overlayDepth()` in any case.

## 6. What the player sees entering each room

No strikes and no dark doorways: every room is lit when the player arrives.

- **Ward 7 (start).**
  - A normal, bright ward at handover time, a touch cooler and softer than with lighting off.
  - At the nurses' station, one screen glows a slow, steady-swelling red: the central monitoring station with its ransom note. The EHR terminal beside it glows ordinary screen blue.
  - Bedside monitors and bedhead units give small green glows. Bed 4's monitor alone shows a small pulsing red light.
  - After Bed 4's death, that light stops pulsing and holds steady.
  - A faint red tint on the ward's back wall above Bed 1 comes through from the IT office's ransom screen (known limit, section 9).
- **IT Security office.**
  - Plainly lit. Ravi's laptop and the VPN terminal glow blue on the desks, and the comms cabinet and network rack show green with blinking LEDs.
  - In the south-east corner the quarantined PC on its KVM trolley throws a red glow over the trolley and the floor, just as its description says.
- **Major Incident Room.**
  - Plainly lit, calm. The command board on the north wall and the laptops and tablets on the table glow blue.
  - No red in this room: the printed ransom note is paper.

## 7. Exact JSON to add

Two insertions in `scenarios/sis01_healthcare/scenario.json.erb`, both using existing schema keys. The IT office and the Major Incident Room get no block. Line numbers are from the working tree on 2026-10-08. Re-check them before editing.

### L1. Scenario level: turn lighting on (insert before `"rooms": {`, line 711)

```json
  "lighting": { "enabled": true, "defaultMode": "on" },

```

No `ambient` (engine default `#c4cad8`, day), no `darkAmbient` (no dark rooms).

### L2. ward_7: Bed 4's alarm light (insert after `"ambientVolume": 0.3,`, line 723)

```json
      "lighting": {
        "emitters": {
          "bed4_monitor": [
            { "condition": "globalVars.patient_bed4_deceased", "color": "#ff5a4a", "radius": 30, "intensity": 0.6, "effect": null },
            { "color": "#ff5a4a", "radius": 30, "intensity": 0.6, "effect": "pulse" }
          ]
        }
      },
```

Notes for the implementer:

- Variants are tried in order, and the first whose condition holds wins (`lighting.js:436-446`). The deceased one must come first. The second has no condition, so it applies otherwise.
- `effect: null` is in the schema's enum (`scripts/scenario-schema.json:169`) and means steady.
- `offsetY` is left out on purpose: the base vitals-monitor entry's −18 is merged in (`lighting.js:452`).
- `patient_bed4_deceased` is set by the scenario's timers and the death path. It's the same variable the monitor's own `textVariants` use (`:1600`).

### Not to apply unless the review asks

The ward ransom fallback in section 5. It would go in the same ward `emitters` object, next to `bed4_monitor`.

## 8. Checks for the implementer

1. Re-run `ruby scripts/lighting_lookup.rb scenarios/sis01_healthcare/scenario.json.erb`. If m02's ward, IT or conference blocks have changed in its final round, check section 4's reasoning still holds. Only the ward's night block would matter, and it isn't copied.
2. Apply L1 and L2. Then run `ruby scripts/validate_scenario.rb scenarios/sis01_healthcare/scenario.json.erb --skip-ink --no-graph`.
3. `tools/playtest/lighting-tour.sh sis01_healthcare <scratch>/sis01-lighting`. All three rooms report `on`, so you get `-a.png` only. Compare with `v1/*-lit.png`: they should match, apart from the Bed 4 light's pulse phase.
4. Bed 4's steady state: in a session, `window.gameState.globalVariables.patient_bed4_deceased = true`, wait 300 ms (`RESOLVE_MS` 250), and shoot. The light should hold steady red.
5. Optionally, one player shot with `--player ward_7:17,6:up` (the start position) to see the station red over a character. The room is lit, so the "dark" shot is the room switched off by the tour and isn't how the game plays.
6. Flash safety: nothing new flashes. `pulse` (1.9 s) and `breathe` (4.4 s) are existing slow sines, and both hold steady under `prefers-reduced-motion`.
7. Record: add sis01's room modes and mood to `docs/agents/LIGHTING_LOG.md` (Pass 2 section). In the skill's mood table the "Day office, default" row gets "sis01" in its "Used in" column. The orchestrator does that, since `SKILL.md` has the user's uncommitted edits.

## 9. Open questions and noticed, not acting on

### Open questions (defaults chosen; overrule if wanted)

- **Q1. Ward ransom red: built-in or toned down?** Default: built-in (section 5). It matches the text, is constant, and isn't dramatic in the render. The fallback is ready if the reviewer disagrees.
- **Q2. Bed 4 alarm light: keep?** Default: keep, subtle. It turns the scenario's central safety point (local bedside alarm, dark central station) into something students see. If anyone thinks it gives Bed 4 away: Sarah's briefing already sends the player there, the alarm tone is "audible from across the bay" (`:1616`), and the timer HUD reads "PATIENT DETERIORATION".
- **Q3. Should the ward be a little dimmer, as the end of a long night?** Default: no. At 07:30 a ward has its lights up, and readability for student teams comes first.

### Noticed, not acting on

- **The ICO tablet isn't by the window.**
  - Two lines of ink put it "by the window" (`ink/npc_hartley.ink:209`, `ink/npc_helen.ink:91`). It lands on the map's west table tablet (tile 3.1, 4.4), while `ig_breach_briefing` takes the east one (6.2, 4.4), which is under the window blinds (x 5.9–7.1).
  - Room dressing, not lighting. Proposal P1 in `DECISIONS_PENDING.md`.
- **The ward ransom glow sits on the right-hand station PC** (17.3). `ehr_terminal` takes the left one (14.5). No problem; noted so the visual reviewer knows which red screen is which.
- **The ECG machine** (`monitor_stand1`) glows screen blue. That's believable for a machine on standby. Left alone.

### Engine round: draw order fix in progress

- **IT red crosses into the ward.**
  - The IT office's ransom glow and floor tint stamp past the IT room's south wall onto the ward's back wall above Bed 1 (`v1/ward_7-lit.png` near 300–420, 150–195).
  - This is the log's known limit "light crosses walls". Ransom screens are the worst case, because they always draw above the map and widen to 56 px in a lit room (`lighting.js:72`, `:80`, `:851-859`).
  - A lighting.js fix (clip a ransom screen's floor-tint stamp to its own room's `fillAreas`) is the engine change being made now (draw order fix in progress). Not a config matter.

## 10. Review

Reviewer verdict: approve with minors. Fixes applied: (m3) the m02 ward block in section 4 re-copied from m02 `scenario.json.erb`, now including `"ward_manual_bp_cuff": [ { "intensity": 0 } ]`; (m1) the IT-red-into-the-ward note moved out of "noticed, not acting" to the engine round.
