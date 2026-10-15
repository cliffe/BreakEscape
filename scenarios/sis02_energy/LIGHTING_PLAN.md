# sis02_energy lighting plan

Status: design, 2026-10-08. Not yet reviewed or applied.

## 1. Kind of game and mood

sis02 is a Security-Informed Safety serious game: education first, often played by student teams, no spy framing, no combat (`"disableAttacks": true`, `scenario.json.erb:65`). Lighting here has two jobs: make a battery energy storage site feel like a real place, and never get between the player and a reading they have to make. Moderate atmosphere, no horror, no flicker.

### Time of day

- **06:28 on a Saturday morning, at the very end of the night shift.**
  - Brief: "06:28 — Helen Marsh called you in early … something doesn't feel right about this morning handover" (`scenario.json.erb:63`).
  - Information pack: the attack runs "during the early hours of a Saturday morning, when the facility operates with a single control room operator … and no engineering staff on site" (`information_pack.md:755`); Helen "arrives at the facility for a scheduled maintenance window" at 06:15 and walks down Battery Hall 1 (`information_pack.md:769`); she calls Webb at 06:28 (`information_pack.md:773`).
  - Ink: "The overnight shift left no incident reports" and the night technician's handover note says "uneventful" (`ink/npc_helen_marsh.ink:54`, `:58`, `:85`).
- **No season is given anywhere**, so whether it is light outside at 06:28 is unknown. It doesn't matter: none of the three maps has a window, and a control room and a battery hall are windowless in practice. The light the player sees is the site's own artificial lighting in its night-shift state.

### Mood

The site at the tail of a quiet night, before the day staff arrive: a staffed control room running on its night lighting with the video wall doing most of the work, and two unstaffed rooms (the hall and the workshop) sitting dark until someone walks in. That's how a real BESS site looks at that hour, and it tells the story without saying anything: the displays all glow calm and green, and nobody has been in the other rooms yet this morning. In the game Helen has not done her walkdown when the player arrives ("We should do a walkdown of Battery Hall 1 before the maintenance window opens", `ink/npc_helen_marsh.ink:62`; she "haven't been here long", `:52`), so a dark hall fits. The information pack has her walk the hall at 06:15 (`information_pack.md:769`); the game's version wins here.

Scenario-level ambient: **`#b8bfce`**, m02's night-shift colour, reused (see section 3). It is above the readability floor (`#a8b0c0`). No new mood colour is needed.

One thing the lighting must **not** do: hint that something is wrong before the player finds it. The scenario's whole teaching point is that "nothing on the SCADA displays looks wrong" (`scenario.json.erb:13`) and an old mechanical dial is the only honest instrument. A red pulsing alarm glow in the control room or an amber pulsing glow on the thermometer would give that away and contradict the text (`alarm_panel` observations: "Currently showing mostly green", `scenario.json.erb:1036`). Section 4 deals with this.

## 2. Room modes

Three rooms. No flicker anywhere: each room holds a puzzle or a decision, the control room is where the player spends most of the game, and a faulty tube adds unease the brief doesn't ask for.

Readable text (notes, the NIS form, the SIS panel, the historian, the log filter) opens in a minigame or text panel drawn above the game, so lighting never affects reading it. What lighting can affect is **finding** an object in the world. Motion rooms light fully the moment the player steps through the door, so nothing is ever hidden while the player is in the room; they are dark only as seen from the doorway.

| Room | Type (map) | Size | Mode | Ambient (lit / dark) | Why |
| --- | --- | --- | --- | --- | --- |
| `scada_control_room` (start) | `room_control_1x2gu` | 10×6 | `on` | scenario `#b8bfce` / default | Staffed round the clock (Helen stands here, `scenario.json.erb:555`; a junior technician covers nights, `information_pack.md:755`). Most reading happens here: incident folder, duty desk, NIS form, HMI-OPS-01, status board, network diagram. |
| `battery_hall_1` | `room_battery_hall` | 20×10 | `motion` | `#c4cad8` / `#0a0f1c` | Unstaffed plant room. Occupancy-sensor lighting is normal in unmanned BESS halls. Lit brighter than the control room on entry (industrial LED high-bays, and the room's two key objects are 16×16 sprites in a 20-tile hall). |
| `engineering_workshop` | `room_IT` | 10×10 | `motion` | scenario `#b8bfce` / default | No engineering staff on site on a Saturday night (`information_pack.md:755`). Dark through the door with HMI-ENG-02's screen and the jump server's LEDs glowing: the workstation the attacker used, left on with nobody there (`information_pack.md:1270`). |

### scada_control_room: `on`

- Has a person in it, so it would start lit in any mode; `on` states the intent.
- Real control rooms run lower, glare-free lighting so the screens read well (the idea behind ISO 11064's control room guidance). The night ambient plus the video wall glow gives exactly that look while staying above the readability floor.
- Per-room state-following glow (section 4B a): the alarm panel starts steady green, matching its text, and follows the worst lamp on the panel as the story moves.

### battery_hall_1: `motion`

- What a decision depends on here: the analogue thermometer (the key clue, `scenario.json.erb:1240`), the ESD pushbutton (an irreversible, gated decision, `:1281`, `authVar` at `:1292`), the digital rack status panels (`:1313`) and the H₂ detector panel (`:1325`). All are fine to read once the room is lit, which happens on the first step inside. That rules out `dark`, and is why the hall is lit at the engine's day level (next point).
- Lit ambient `#c4cad8` (the engine default, brighter than the night mood): the thermometer and the ESD button are 16×16 sprites in a 640×320 hall, and the thermometer is the most important object in the mission. Battery halls are lit by bright, even high-bays in practice, so this is also the realistic choice.
- `darkAmbient` `#0a0f1c`, the server-room value from the skill: with 36 battery racks, their status LEDs carry the room seen from the doorway.
- No `offAfter`. The player goes back and forth between the hall and the control room (phone Webb, return to press the ESD), and replaying the strike every time would get in the way.
- Global fixes (section 4A item 4): the thermometer no longer glows (it is a mechanical dial); the ESD button gets a small steady red glow, no pulse, so the lighting doesn't beckon the player to press it.
- Per-room state-following glow (section 4B b): during the H₂ advisory the rack glow and LEDs turn red-orange to match the `tint_objects` red on the racks.

### engineering_workshop: `motion`

- What a decision depends on here: HMI-ENG-02's log filter (`scenario.json.erb:1383`), the jump server rack and its Ethernet cable (the isolation decision, `:1542`), the SIS configuration panel (`:1585`), the locked filing cabinet and its key on the wall, the laptop, two wall notices. All lit on the first step inside.
- No `offAfter`, same reason as the hall.
- No override needed. Emitters match on the texture key, which is the scenario `sprite` if set, otherwise the Tiled image the object lands on (`core/rooms.js:514`, `baseKey = scenarioObj.sprite || imageName`). So HMI-ENG-02 (no sprite, `as-type:pc`) shows as one of `pc3`/`pc5`/`pc12`, the laptop as `laptop6`, the racks as `servers3`/`servers4`: all already in EMITTERS. The SIS panel (`sprite: "siem_dashboard"`, `scenario.json.erb:1589`) is not, and is added in section 4.

## 3. Settings reused from other missions

`ruby scripts/lighting_lookup.rb scenarios/sis02_energy/scenario.json.erb` (run 2026-10-08): all three room types, `room_control_1x2gu`, `room_battery_hall` and `room_IT`, are "not lit in any other scenario yet". m02 is the only lit scenario. So no room block is copied; these three become the reference blocks for their room types.

Reused values:

- Scenario `ambient` `#b8bfce`: m02's night-shift colour (`docs/agents/LIGHTING_LOG.md`, Decisions; skill mood table). The situation matches (the end of a night shift under artificial light).
- Battery hall `darkAmbient` `#0a0f1c`: the skill's server-room value, "where the LEDs carry the room".
- Battery hall lit `ambient` `#c4cad8`: the engine default (`DEFAULT_LIT_AMBIENT`, `lighting.js:47`).

Notes for missions that reuse these blocks later:

- `room_IT` is also used by m01, m04, m05 and lockpick_gauntlet (none lit yet). The workshop block here has no `lights` and no tile coordinates, so it drops into those missions unchanged; whether it should be `motion` there depends on whether people are in it.
- `room_battery_hall` is not used elsewhere, but `batrack` is (m04, m07). The batrack emitter change in section 4 will apply there when they are lit.

## 4. Light sources (EMITTERS and per-room overrides)

### What each room's objects are, and whether they give off light

Texture keys come from the room maps (`public/break_escape/assets/rooms/<type>.json`) and the scenario `sprite` overrides. Sprites checked by eye (`public/break_escape/assets/objects/`).

| Room | Texture key | Object | Gives off light? | Today |
| --- | --- | --- | --- | --- |
| control | `screens` (184×37) | Facility Status Board, a wall of ten monitors | Yes, the main light in the room | **not matched** (lookup flag) |
| control | `pc` | HMI-OPS-01 | Yes | screen emitter |
| control | `alarm_panel` | Facility Alarm Panel, "mostly green" | Yes, lamps | red **pulse** (wrong for the art) |
| control | `network_architecture` (48×34) | "A wall-mounted display" (`scenario.json.erb:1117`) | Yes, a display | not matched |
| control | `filing_cabinet`, `notes*`, desks, chairs, keyboards | | No | — |
| hall | `batrack` ×36 | Battery racks | Status LEDs | rack emitter: green glow, **blink**, 1.0 LEDs |
| hall | `tablet` ×2 | Rack status display; H₂ detector panel | Yes, digital panels | not matched |
| hall | `thermometer` (→ `thermometer_high`/`_low` via `spriteVariants`) | Analogue mechanical dial | **No** | amber **pulse** (wrong for the art) |
| hall | `emergency-button` | ESD mushroom pushbutton | At most a status ring | red **pulse** |
| workshop | `pc3`/`pc5`/`pc12` | HMI-ENG-02 | Yes | screen emitter |
| workshop | `laptop6` | Engineering laptop | Yes | screen emitter |
| workshop | `servers3`, `servers4` | Jump server rack and neighbours | LEDs | rack emitter |
| workshop | `siem_dashboard` (sprite override of `sis_config_panel`, placed `as-type:smartscreen`) | SIS Configuration Panel | Yes | **not matched** |
| workshop | `smartscreen` | Map placeholder TV; taken by the SIS panel's `as-type`, so not drawn in sis02 | Yes (a TV) | not matched (lookup flag) |
| workshop | `cable`, `key`, `filing_cabinet`, `chalkboard2`, bins, plant, office-misc | | No | — |
| all three | `vm-launcher-kali`, `vm-launcher-desktop`, `lab-workstation`, `workstation` | Conditional map items (VM launchers and lab workstation, all of them screens in EMITTERS) | Yes if drawn | **Not drawn** in sis02: the scenario has no VM launcher or lab workstation objects, so these map slots are not filled (reviewer note the designer missed; no action) |

Lookup flags resolved: `screens` yes (own entry), `smartscreen` yes (screen list; it is a TV in m07/m08), `sis_config_panel` yes (screen list, in case the sprite override is ever dropped; today the key is `siem_dashboard`).

### A. EMITTERS changes (`public/break_escape/js/systems/lighting.js:66-78`)

All global. Items 1–3 touch keys m02 doesn't place (`screens`, `siem_dashboard`, `sis_config_panel`, `smartscreen`, `network_architecture`, `tablet`, `batrack`; lookup on m02). Item 4 does change m02 (review M1, accepted by the orchestrator): its tour of `server_room` and `ward_hall` is rerun and the m02 designer told.

**sis01:** only its wall `tablet` ("ICO Notification Deadline", `sis01_healthcare/scenario.json.erb:2806`) is newly lit. Its SIEM console is `type: "siem_dashboard"` but has no sprite and sits `as-type:pc` (`sis01_healthcare/scenario.json.erb:1799-1802`), so its texture key is a `pc*` image that already glows. Tell the sis01 designer about the tablet.

1. Extend the existing screen entry (line 67) with five keys. Replace its regex with:

```js
  { re: /^(pc\d*|laptop\d*|monitor|security_monitor|workstation|vm-launcher|ehr-terminal|cctv_monitors|info_screen|conference_screen|nurse_call_display|drug_library_terminal|lab-workstation|checkin_kiosk|kvm_cart|log_filter_terminal|forensic_data_platform|flag-station|backup_recovery|dual_auth|siem_dashboard|sis_config_panel|smartscreen|network_architecture|tablet)/,
    color: 0x9fd4ff, radius: 44, intensity: 0.65, offsetY: 6, effect: 'screen' },
```

2. New entry for the video wall, straight after the screen entry. One radial glow on a 184 px sprite needs a wider radius than a desk monitor, and the offset pushes the pool down off the wall onto the operator desks. Start modest (review m5); the visual review decides whether it goes up:

```js
  { re: /^screens/, color: 0x9fd4ff, radius: 72, intensity: 0.45, offsetY: 16, effect: 'screen' },
```

3. Battery racks get their own entry, and `batrack` comes out of the rack regex (line 70 becomes `/^(server|network_rack|comms_cabinet|pi_cluster|rack|storage_array|tape_library)/`). Reason: 36 racks with the server-rack settings means 36 blinking 40 px glows and about 320 LED sprites (`createLeds`, `lighting.js:301`: ~9 per 32×72 rack). That reads as a busy server room. A BESS rack's BMS shows a few mostly steady status lights. Steady glow, half the LEDs (about 144):

```js
  { re: /^batrack/, color: 0x7dffa8, radius: 30, intensity: 0.35, effect: null, leds: 0.5 },
```

4. Static glows that don't suit the art, fixed for every mission (review M1, accepted):
   - `thermometer` comes out of the pulse entry (line 72 becomes `/^(power_panel|suppression_panel)/`). It is a mechanical dial and gives off no light. In sis02 an amber pulse on it would also point straight at the answer: the lesson is that a quiet, unremarkable gauge disagreed with the glowing screens.
   - `alarm_panel` and `emergency-button` come out of the red pulse entry (line 77 becomes `/^(fire_alarm_point)/`, unchanged otherwise), and each gets its own steady entry:

```js
  { re: /^alarm_panel/, color: 0xffe2a0, radius: 22, intensity: 0.35, effect: null },
  { re: /^emergency-button/, color: 0xff5050, radius: 18, intensity: 0.35, effect: null },
```

   The alarm panel sprite shows a mix of lamps, so a warm-neutral steady glow reads as "a lit lamp panel", not "alarm". An illuminated E-stop ring is plausible, so a faint steady red helps the player spot the ESD button on the far wall; a pulse would beckon, and pressing the ESD is a scored, irreversible decision (`early_esd_activation`).

### B. Per-room glows that follow game state (D2, approved for this pass)

**Rule (user, 2026-10-08):** a state-following glow may only repeat what the player is already told (on-screen text, a radio call, a tint), never carry information on its own. Every condition below is checked against that in the tables.

**Config shape.** A new optional key in a room's `lighting` block, keyed by the start of a texture key. The value is a list of variants; the first whose `condition` holds wins, a variant without `condition` always holds, and if none holds the EMITTERS entry applies unchanged:

```json
"emitters": {
  "<texture-key prefix>": [
    { "condition": "globalVars.some_flag", "color": "#rrggbb", "radius": 22, "intensity": 0.4, "effect": "pulse", "ledColor": "#rrggbb", "ledAlpha": 0.5 },
    { "color": "#rrggbb" }
  ]
}
```

- `condition` uses the same syntax as `spriteVariants` and `observationVariants` (e.g. `scenario.json.erb:1260-1269`): `globalVars.x`, `!globalVars.x`, comparisons, `&&`. Evaluate it with `evaluateGlobalCondition(condition, window.gameState.globalVariables)` from `utils/conditional-text.js:72`; that is how `resolveObjectField` reads globals (`utils/conditional-text.js:107-108`), and the game state lives in `window.gameState.globalVariables` (written by e.g. `systems/objectives-manager.js:756-757`).
- Fields a variant may set: `color`, `radius`, `intensity`, `effect` (`null` | `"screen"` | `"blink"` | `"pulse"`), `offsetY`, plus two for LEDs: `ledColor` (tint every LED this colour; omit to keep the mixed colours) and `ledAlpha` (0–1 multiplier on LED alpha; 0 hides them). The LED count stays as created from the EMITTERS entry.
- A variant is shallow-merged over the EMITTERS match; colours go through `parseColor`. If nothing in EMITTERS matched the key, a variant counts only if it gives `color` and `radius`.
- Prefix match: the longest override key that equals the texture key or is its start.
- A single object instead of a list is accepted as a one-variant list (handy for a static per-room tweak).

**Implementation notes for `lighting.js`:**

- In `refreshEmitters` (`lighting.js:278`), keep the EMITTERS match at line 289 as `e.base`, and store the room's variant list for that object as `e.variants`.
- Resolve variants on a timer inside the redraw, not every frame: at most every 250 ms, evaluate each emitter's variants, and if the winning index changed, set `e.def = { ...e.base, ...variant }` and retint the glow sprite and LEDs (`ledColor`, `ledAlpha`). A handful of string checks four times a second is cheap. (Listening to `global_variable_changed:<name>` events would need the variable names parsed out of each condition; not worth it.)
- LED drawing (`lighting.js:533-536`): multiply the LED alpha by `e.def.ledAlpha ?? 1`.
- Document the key in the header comment beside `lights`.

**sis02 variants.**

(a) Control room alarm panel: the glow follows the worst lamp on the panel. Lamp definitions are at `scenario.json.erb:1041-1092`; the panel is something the player opens and reads, and each flag is either set by the player's own action or announced.

| Order | Condition | Glow | Lamp it repeats | How the player is told |
| --- | --- | --- | --- | --- |
| 1 | `globalVars.facility_evacuated` | `#ff5050`, r24, i0.5, `pulse` | H₂ GAS red "EVACUATE", flashing (`:1081`) | Helen radio call (`:660-663`) |
| 2 | `globalVars.sis_tamper_confirmed` | `#ff5050`, r24, i0.5, `pulse` | SIS STATUS red "SETPOINT DEVIATION", flashing (`:1057-1061`) | The player's own confirm in the SIS panel |
| 3 | `globalVars.network_isolated` | `#ff5050`, r22, i0.45, steady | NETWORK STATUS red "SCADA MANUAL MODE" (`:1071-1075`) | Marcus's message (`:854-857`) |
| 4 | `globalVars.hydrogen_alarm` | `#ffb347`, r22, i0.4, steady | H₂ GAS amber "ADVISORY" (`:1082`) | Helen radio call (`:653-656`) |
| 5 | `globalVars.historian_flatline_found` | `#ffb347`, r22, i0.4, steady | BATTERY HALL 1 amber "ANOMALY DETECTED" (`:1043-1047`) | The player's own historian finding |
| 6 | `globalVars.jump_server_isolated` | `#ffb347`, r22, i0.4, steady | JUMP SERVER amber "ISOLATED" (`:1064-1068`) | The player pulled the cable |
| 7 | (none) | `#7dffa0`, r22, i0.35, steady | Start state, "mostly green" (`:1036`) | Observation text |

`esd_activated` and `facility_safe_state` only turn lamps green (`:1050`, `:1088`), so they never change the worst lamp and need no variant. The pulse is `0.4 + 0.6·sin` at `time/300` (`lighting.js:542`), about 0.5 Hz, well under the three-flash limit.

(b) Battery hall racks during the H₂ advisory (review M2). The `h2_advisory` timer sets `hydrogen_alarm` and runs `tint_objects` on `batrack` in `battery_hall_1` with colour `16729122` (`#ff4422`) and an alpha pulse (`scenario.json.erb:414-428`; the action is `systems/apply-actions.js:110-133`, a 900 ms yoyo from alpha 1 to 0.65). The green glow and green LEDs drawn above the light map would work against that red. While `hydrogen_alarm` is set:

| Condition | Glow | LEDs | How the player is told |
| --- | --- | --- | --- |
| `globalVars.hydrogen_alarm` | `#ff5a3c`, r30, i0.3, steady (the sprite's own tint already pulses) | `ledColor` `#ff7a3c`, `ledAlpha` 0.5 | Helen radio call (`:653-656`) and the rack tint itself |
| (none) | EMITTERS `batrack` entry | as created | — |

`hydrogen_alarm` is never cleared, and nothing clears the tint either, so the two stay in step after the ESD.

One mismatch the lighting can't fix: after a reload with `hydrogen_alarm` already true, the timer is skipped (`ui/scenario-timer-dispatcher.js:71-78`), so the `tint_objects` action doesn't run again and the racks come back untinted while the glow is red. The player was already told by radio before the reload, so the glow still only repeats known information, but the racks and their glow disagree. That's an engine issue outside lighting (`DECISIONS_PENDING.md`, D3).

### Schema (D1, approved)

`scripts/scenario-schema.json`, inside the **room** `lighting.properties` object (the one opening at line 378, under `"lighting"` at 375), as a new property after `"lights"` (whose block closes at line 400) and before the `properties` object closes at line 401. Add a comma after the `lights` block's closing brace. Not the scenario-level `lighting` at line 50.

```json
            "emitters": {
              "type": "object",
              "description": "Per-room changes to object glows, keyed by texture-key prefix. A list of variants; the first whose condition (globalVars syntax) holds wins. A single object is one variant.",
              "additionalProperties": {
                "anyOf": [
                  { "$ref": "#/definitions/emitterVariant" },
                  { "type": "array", "items": { "$ref": "#/definitions/emitterVariant" } }
                ]
              }
            }
```

and in the top-level `definitions` object:

```json
    "emitterVariant": {
      "type": "object",
      "properties": {
        "condition": { "type": "string" },
        "color": { "type": "string" },
        "radius": { "type": "number", "minimum": 0 },
        "intensity": { "type": "number", "minimum": 0, "maximum": 1 },
        "effect": { "enum": [null, "screen", "blink", "pulse"] },
        "offsetY": { "type": "number" },
        "ledColor": { "type": "string" },
        "ledAlpha": { "type": "number", "minimum": 0, "maximum": 1 }
      },
      "additionalProperties": false
    }
```

The validator's `json-schema` gem works to draft-04 (`scripts/validate_scenario.rb:21`, `:196`), so no `const`; `anyOf` and `enum` with `null` work there. The implementer should check that `#/definitions` exists in the schema (the item schema is referenced as `#/definitions/item`, `scenario-schema.json:84`) and run the validator on sis02 and m02 afterwards.

### C. Extra `lights`

None. Every light source in the three rooms is an object the map already places. No window, lamp or exit sign is missing that the scenario mentions.


## 5. What the player sees entering each room

Positions from the maps and the unlit layout shots in the design scratch folder (`baseline/*.png`, game 1767, lighting not enabled).

**SCADA control room (start, lit).** A small, slightly dim room in the cool night colour. The video wall along the north wall is the brightest thing on screen: a band of soft blue light falling across the long operator desk and HMI-OPS-01 beneath it. The alarm panel by the north door shows a small steady green glow, the network diagram on the right a faint screen glow. Helen, the duty desk, the filing cabinet in the south-west corner and the floor are all clearly readable. Through the north door, the hall is dark with rows of small green rack lights; through the east door, the workshop is dark apart from a desk screen and rack LEDs. The impression: a quiet room where every display says all is well.

**Battery Hall 1 (motion).** From the control room doorway: a large dark space (`#0a0f1c`) with three blocks of racks marked out by faint steady green glows and scattered status LEDs, two pale blue glows from the panels on the north wall, a faint red point on the west wall (the ESD button), and the control room's light spilling in through the door. No glow at the thermometer. On the first step in, the ceiling panels strike in a staggered sequence (or fade in under reduced motion) and the hall settles at the brighter industrial level (`#c4cad8`), noticeably brighter and more neutral than the control room. Then the thermometer (north wall, top left, near Rack A2), the ESD button (west wall, lower left) and the two wall panels are as plain to see as in an unlit game. The lights stay on for the rest of the session.

**Engineering workshop (motion).** From the control room doorway: a dark office, HMI-ENG-02's screen and the laptop glowing blue on the upper desk, the SIS panel glowing on the north-west wall, the racks on the north wall marked by green glow and LEDs. It looks like a room left with its machines running and nobody in it, which is the point (`information_pack.md:1270`). On the first step in, the panels strike and the room settles at the night colour, the same as the control room. The key on the wall, the cable under the jump server and the filing cabinet in the south-west corner are all visible once lit.

**After the H₂ advisory (`hydrogen_alarm` set, T+22 min if the ESD hasn't been pressed).** In the hall, the racks pulse red from `tint_objects`, and their glow and LEDs have gone red-orange and dimmer to match, so nothing green is left fighting the red. The thermometer and ESD button look as before. In the control room, the alarm panel's glow turns from green to steady amber (or red if a red lamp is already lit), repeating Helen's radio call. If the facility is evacuated (T+40 min), the panel glow pulses red slowly.

Things to check in the visual review:

- The video-wall pool does not wash out Helen or the desk.
- The 36 rack glows read as a calm hall, not a disco.
- **The thermometer is easy to spot once the hall is lit, with the camera on the player standing near Rack A2** (north wall, top left, around tile (2.5, 1.8)). The tour centres the camera on the middle of the 20×10 hall, where the objectives panel can cover the top-left corner (it did in `baseline/battery_hall_1-a.png`), so a tour shot alone can't settle this (review m6).
- The ESD glow is faint enough not to draw the eye first.
- After the advisory: no green LEDs left on red racks; the alarm panel colour matches the panel's worst lamp.

## 6. JSON to add

Line numbers are against the scenario file as of 2026-10-08 (HEAD plus nothing; the file is clean in git). Re-check them before editing.

**Scenario level**, after `"disableAttacks": true,` (`scenario.json.erb:65`):

```json
  "lighting": { "enabled": true, "defaultMode": "on", "ambient": "#b8bfce" },
```

**`scada_control_room`**, after `"door_sign": "SCADA Control Room",` (`scenario.json.erb:544`). Variants are in order of severity; the first that holds wins (section 4B a):

```json
      "lighting": {
        "mode": "on",
        "emitters": {
          "alarm_panel": [
            { "condition": "globalVars.facility_evacuated",       "color": "#ff5050", "radius": 24, "intensity": 0.5,  "effect": "pulse" },
            { "condition": "globalVars.sis_tamper_confirmed",     "color": "#ff5050", "radius": 24, "intensity": 0.5,  "effect": "pulse" },
            { "condition": "globalVars.network_isolated",         "color": "#ff5050", "radius": 22, "intensity": 0.45, "effect": null },
            { "condition": "globalVars.hydrogen_alarm",           "color": "#ffb347", "radius": 22, "intensity": 0.4,  "effect": null },
            { "condition": "globalVars.historian_flatline_found", "color": "#ffb347", "radius": 22, "intensity": 0.4,  "effect": null },
            { "condition": "globalVars.jump_server_isolated",     "color": "#ffb347", "radius": 22, "intensity": 0.4,  "effect": null },
            {                                                     "color": "#7dffa0", "radius": 22, "intensity": 0.35, "effect": null }
          ]
        }
      },
```

**`battery_hall_1`**, after `"ambientVolume": 0.7,` (`scenario.json.erb:1229`). The thermometer and ESD button need nothing here now; the global entries handle them (section 4A item 4):

```json
      "lighting": {
        "mode": "motion",
        "ambient": "#c4cad8",
        "darkAmbient": "#0a0f1c",
        "emitters": {
          "batrack": [
            { "condition": "globalVars.hydrogen_alarm", "color": "#ff5a3c", "radius": 30, "intensity": 0.3, "effect": null, "ledColor": "#ff7a3c", "ledAlpha": 0.5 }
          ]
        }
      },
```

**`engineering_workshop`**, after `"ambientVolume": 0.4,` (`scenario.json.erb:1373`):

```json
      "lighting": { "mode": "motion" },
```

The schema change (D1) is in section 4, "Schema (D1, approved)".

## 7. Work list and checks

### lighting.js work list (one engine agent; m02's engine work goes first, re-read the file before editing)

1. **Screen list** (line 67): add `siem_dashboard|sis_config_panel|smartscreen|network_architecture|tablet` to the regex (4A item 1).
2. **Video wall**: new entry `{ re: /^screens/, color: 0x9fd4ff, radius: 72, intensity: 0.45, offsetY: 16, effect: 'screen' }` after the screen entry (4A item 2).
3. **Battery racks**: remove `batrack` from the rack regex (line 70); new entry `{ re: /^batrack/, color: 0x7dffa8, radius: 30, intensity: 0.35, effect: null, leds: 0.5 }` (4A item 3).
4. **Static glow fixes (changes m02)**: line 72 regex becomes `/^(power_panel|suppression_panel)/` (no thermometer); line 77 regex becomes `/^(fire_alarm_point)/`; new entries `{ re: /^alarm_panel/, color: 0xffe2a0, radius: 22, intensity: 0.35, effect: null }` and `{ re: /^emergency-button/, color: 0xff5050, radius: 18, intensity: 0.35, effect: null }` (4A item 4).
5. **Per-room `emitters` variants** (4B): import `evaluateGlobalCondition` from `../utils/conditional-text.js`; in `refreshEmitters` keep the EMITTERS match as `e.base` and attach the room's variant list by longest texture-key prefix (single object = one variant); a variant only creates an emitter for an unmatched key if it has `color` and `radius`; re-resolve at most every 250 ms in the redraw against `window.gameState.globalVariables`, and on a change set `e.def = { ...e.base, ...variant }` (colours via `parseColor`), retint the glow sprite, retint LEDs with `ledColor` if given, and multiply LED alpha by `ledAlpha ?? 1` (lines 533-536). Header comment: document `emitters` beside `lights`.
6. **Reduced motion** (review m4): when `this.reducedMotion` is true, the emitter effect factor `k` stays 1 for `screen`, `blink` and `pulse` (lines 540-542), and LEDs stay steady (draw every LED lit, no `period`/`duty` toggling, lines 533-535). Today only the strike and the faulty panel respect it.

Schema (D1): section 4, "Schema (D1, approved)", in `scripts/scenario-schema.json`.

### Checks

1. `ruby scripts/lighting_lookup.rb scenarios/sis02_energy/scenario.json.erb`: no "light-looking but not in EMITTERS" lines left for sis02.
2. Scenario blocks (section 6), then `ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb --skip-ink --no-graph`: schema passes, no lighting warnings. Run it on m02 too after the schema edit.
3. `tools/playtest/lighting-tour.sh sis02_energy <scratch>/sis02-lit`: expect `scada_control_room-a.png` (lit), `battery_hall_1-a/-b.png` and `engineering_workshop-a/-b.png` (dark, then lit). Look at every image against section 5.
4. **Thermometer close-up** (review m6): the tour centres on the middle of the hall, and the objectives panel covered the top-left corner in the baseline shot. In the same session, put the camera on the thermometer and shoot again: `tools/playtest/cmd.sh <gid> '{"cmd":"eval","fn":"() => { const r = window.rooms.battery_hall_1; const cam = window.lightingSystem.scene.cameras.main; cam.stopFollow(); cam.centerOn(r.position.x + 2.5*32, r.position.y + 3*32); return true; }"}'`, then a `screenshot` command. Better still, walk the player to Rack A2 in a short session and shoot with the normal follow camera.
5. **After the H₂ advisory** (new tour step). The timer needs 22 minutes, so set the state from the console in the tour's session. Set the global through the dispatcher (as `set_global` does, `systems/apply-actions.js:32-38`), then do what `tint_objects` does (`apply-actions.js:110-133`) directly, since `applyActions` isn't on `window`:

   ```js
   () => {
     const gv = window.gameState.globalVariables;
     gv.hydrogen_alarm = true;
     window.eventDispatcher?.emit('global_variable_changed:hydrogen_alarm', { name: 'hydrogen_alarm', value: true });
     let n = 0;
     for (const s of Object.values(window.rooms.battery_hall_1.objects)) {
       if (s?.active && s.texture?.key === 'batrack') {
         s.setTint(16729122);
         s.scene.tweens.add({ targets: s, alpha: { from: 1, to: 0.65 }, duration: 900, yoyo: true, repeat: -1 });
         n++;
       }
     }
     return n;
   }
   ```

   Expect 36. The emit also fires Helen's radio message, which is harmless in a throwaway game. Wait at least 300 ms (the variant re-check), then centre on `battery_hall_1` and `scada_control_room` as the tour does and shoot `battery_hall_1-h2.png` and `scada_control_room-h2.png`. Then set `facility_evacuated` the same way (no tint) and shoot `scada_control_room-evac.png` to see the red pulse.
6. Live check: `window.lightingSystem.rooms.get('battery_hall_1').emitters.map(e => e.obj.texture.key)` has no `thermometer*`; the control room's alarm panel emitter has a green `def.color` before step 5 and amber after.
7. m02: rerun its tour for `server_room` and `ward_hall` (item 4 changes the thermometer, alarm panel and emergency button glows there) and tell the m02 designer.
8. Tell the sis01 designer that its wall `tablet` now glows as a screen.

## Round 1 (2026-10-08)

Changes to `scenario.json.erb` after the r0 render and review:

1. `scada_control_room` lighting: `"panels": false`; new emitter override `"screens": { "radius": 120, "intensity": 0.7, "offsetY": 28 }` so the video wall is the room's main light.
2. Alarm panel amber and red variants: radius 40, intensity 0.8 (green default unchanged: r22, i0.35). In the r1 render the red evacuation halo is now visible in the lit room.
3. `batrack`: second, unconditional variant `{ "ledColor": "#4dff7a" }` after the H2 one, so the normal state has no amber or blue LEDs a student team could read as rack warnings.
4. H2 tint alpha pulse (1 to 0.65): hard-coded in `systems/apply-actions.js` (`tint_objects`, the tween at the `alpha: { from: 1.0, to: 0.65 }` line); the scenario can only turn the pulse off (`pulse: false`) or change `color`. Left alone, as the brief said. Open question for the coordinator: set `pulse: false` on the timer's action, or add an engine parameter.

r1 renders: `scratchpad/sis02-impl/r1/` (NOTES.md there). The lit control room still shows no blue pool from the video wall; this depends on the panel-brightness work in `lighting.js` and needs re-checking once that lands.

## Round 2 (2026-10-08)

Changes to `scenario.json.erb`, scada_control_room lighting block (not yet rendered; the engine round changes the light texture, so the tour waits):

1. `screens` override is now `{ "radius": 140, "intensity": 0.7, "offsetY": 40, "floorTint": 0.35 }`, so the video wall tints the floor in front of it.
2. Room-level `"ambient": "#aeb6c8"` (slightly below the scenario's `#b8bfce`, still above the readability floor of about `#a8b0c0`), so the wall's pool shows against the lit room.
3. The six amber and red `alarm_panel` variants gain `"floorTint": 0.5`. The green default has none.

`floorTint` is allowed by `emitterVariant` in `scripts/scenario-schema.json` (added by the engine agent, line 173); sis02 validates.
