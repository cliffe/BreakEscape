# New Objects and NPC Planning — Case 2: Energy (Albion Battery Hall)

Generated from: `prompts/breakescape_game_implementation.md`
Scenario: `game_design/energy/break_escape_scenaro_draft/scenario.json.erb`

---

## 1. NPC Behaviours

---

### 1.1 Priya Chandra — SCADA Engineer (Person NPC)

**Priority:** High
**Draft scenario inclusion:** Yes (stub in place; timedConversation + eventMappings functional)

**Functional spec:**

Priya is the primary guide NPC. She occupies the SCADA Control Room from scenario start. Her behaviour has four distinct states driven by global variables:

**State 1 — INITIAL (briefing_played = false):**
Priya triggers `timedConversation` with `arrival_briefing` knot immediately on game load. She explains the maintenance window and the odd shift handover. She offers to do the Battery Hall walkdown.

**State 2 — WALKDOWN READY (priya_briefed = true, anomaly_detected = false):**
Player can approach Priya for the walkdown offer. She holds the plant room RFID badge (in prototype: badge is in the room; full implementation: badge transfers to room when this state is reached via ENG-03 reveal mechanic).

**State 3 — ANOMALY CONFIRMED (anomaly_detected = true):**
Priya's dialogue tone shifts from methodical to urgent. New dialogue branches unlock: thermometer discrepancy, historian anomaly. She begins pushing players toward Marcus Webb contact.

**State 4 — CRISIS (esd_activated or facility_safe_state):**
Post-ESD: Priya provides radio updates via timedMessages. She is quieter in person, focused on monitoring cooling. When `facility_safe_state = true`, she points players to Dr Bashir.

**State machine:**
```
INITIAL → (timedConversation fires) → BRIEFING_DONE
BRIEFING_DONE → (priya_briefed = true) → WALKDOWN_READY
WALKDOWN_READY → (anomaly_detected = true) → ANOMALY_CONFIRMED
ANOMALY_CONFIRMED → (esd_activated = true) → POST_ESD
POST_ESD → (facility_safe_state = true) → DEBRIEF_READY
```

**Interaction model:** Standard person-chat dialogue. Player walks up to Priya sprite and initiates conversation. No hostile or patrol behaviour — Priya is entirely cooperative.

**TODO[ENG]: ENG-03** — Item reveal mechanic: plant room badge should appear in room only after `priya_briefed = true`. Currently badge is always visible (prototype).

**Visual design:**

Priya wears a navy blue site coverall with high-visibility yellow strips. She has a site hard hat clipped to her belt (not worn — she's in the office area). An ID badge on a lanyard. She carries a tablet in one hand with engineering drawings visible on screen.

Animation states: idle (looking at tablet), talk (looks up, gestures), walk (normal gait for any patrol movement not currently used).

Sprite dimensions: standard BreakEscape character sprite sheet format. Portrait (headshot) for dialogue box: professional photo style, ID badge visible.

**Placeholder:** `male_nerd` sprite sheet. Replace with `engineer_female` when sprite is available.

---

### 1.2 Dr Nalini Bashir — NCSC/HSE Inspector (Person NPC, initially hidden)

**Priority:** High
**Draft scenario inclusion:** Yes (initiallyHidden stub in place; reveals on facility_safe_state)

**Functional spec:**

Dr Bashir is the debrief NPC. She is invisible until `facility_safe_state = true` and `dr_bashir_visible = true`. She appears in the SCADA Control Room at position (9, 6) — standing near a wall-mounted screen that shows a post-incident summary display.

**Reveal sequence:**
1. `facility_safe_state = true` → Priya's eventMapping sets `dr_bashir_visible = true`
2. Dr Bashir's eventMapping fires on `dr_bashir_visible = true` → triggers person-chat cutscene (`debrief_intro` knot, background: `hq1.png`)
3. After cutscene, Dr Bashir is visible in room. Player can approach for full debrief dialogue.

**Interaction model:** Standard person-chat. Dr Bashir does not move. Debrief dialogue is structured around 5 topics; player must complete `patch_decision` topic before `debrief_complete` is set.

**TODO[ENG]: ENG-07** — NPC reveal with reveal animation. Currently NPC simply appears without transition. A brief fade-in or door-open animation would improve the reveal moment.

**Visual design:**

Dr Bashir wears a dark jacket with a lanyard carrying an NCSC/HSE dual-agency ID. She carries a clipboard. Her expression is attentive but neutral — not threatening.

Animation states: idle (reviewing clipboard, occasional glance up), talk (looks directly at camera, gestures with clipboard).

**Placeholder:** `male_nerd` sprite sheet. Replace with `inspector_female` when sprite is available.

---

### 1.3 Patrol Behaviour for Hydrogen Alarm (ENG-02 Extension)

**Priority:** Medium
**Draft scenario inclusion:** No (future version — requires ENG-02 timed escalation)

**Functional spec:**

When `hydrogen_alarm = true` (T+22 minutes without ESD), a new environmental NPC is triggered: a patrol-style hazard indicator that represents the escalating danger in Battery Hall 1. This is not an NPC in the traditional sense — it is an ambient event-driven state change.

Physical implementation: the Battery Hall 1 room itself changes — ambient sound increases, lighting colour changes (amber tint overlay if ambient lighting is programmable). Priya sends a radio message.

If `esd_activated = false` at T+40 minutes: a red rotating beacon light activates (physical prop). An evacuation tone plays (3 seconds). Priya's voice escalates urgency.

No sprite or person NPC required for this behaviour — it is engine-driven.

---

## 2. Object Types

---

### 2.1 ESD Pushbutton Object

**Priority:** High
**Draft scenario inclusion:** Simplified (pc lockType:pin placeholder)

**Functional spec:**

The ESD pushbutton is a custom interactive object type: `esd_button`. It is a non-container, non-takeable object that the player interacts with by clicking/tapping.

States:
- `ARMED`: Guard is down. Interaction opens a two-step confirmation minigame (MG-01).
- `ACTIVATED`: Guard is flipped up, button depressed, green confirmation light illuminated. No further interaction.
- `LOCKED` (if `marcus_webb_contacted = false`): Interaction shows observations only — "This button requires authorised activation code."

The object has no `contents` and no `lockType` in the custom implementation — the MG-01 minigame handles the confirmation step internally.

Triggers: On successful confirmation → `esd_activated = true` → flagReward or direct global set.

**Prototype mapping:** `type: pc` with `lockType: pin`. The PIN is the authorisation code given by Marcus Webb.

**Visual design:**

Object sprite: a wall-mounted yellow housing containing a large red mushroom-head button. The housing has a black-on-yellow label strip at the top: "EMERGENCY SHUTDOWN". A clear plastic flip-up guard covers the button in the ARMED state. A small green LED indicator is dark in ARMED state, illuminated in ACTIVATED state.

Sprite requires three animation frames:
1. `armed` — guard down, button covered, LED off
2. `guard_open` — guard flipped up, button visible, LED off
3. `activated` — button depressed, LED on, guard up

Physical prop: A real industrial emergency stop button (e.g., Schneider Electric or equivalent) mounted in a yellow aluminium housing. Wired via GPIO relay to game server. Physical button press triggers `esd_activated` directly.

---

### 2.2 Alarm Panel Display Object

**Priority:** High
**Draft scenario inclusion:** Simplified (smartscreen placeholder — static text)

**Functional spec:**

The alarm panel is a wall-mounted multi-lamp display object that changes state in response to global variable events. It is not directly interactable by the player — it is an ambient environmental indicator.

State table: see MG-05 functional spec.

Requires: ENG-01 state-reactive lamp display driver. The game server must push lamp state updates to either:
- **Physical version:** A custom panel with individually addressable LED lamps connected via GPIO or MQTT broker
- **Digital version:** A smartscreen rendering a dynamic SVG panel that updates via WebSocket event from the game server

The object does not need a new `type` value — it uses the existing `smartscreen` type. What is new is the engine behaviour (ENG-01) that drives its state.

**Visual design:**

Physical version: A rack-mounted or wall-panel enclosure approximately 400×300mm. 8 lamp positions arranged in 4 rows of 2. Each lamp is a standard 22mm panel-mount LED indicator with a printed label strip beneath. Colours: GREEN (safe), AMBER (advisory/isolated), RED (fault/alarm).

Lamp layout (top to bottom, left to right):
```
[BATTERY HALL 1]  [BATTERY HALL 2]
[SIS STATUS    ]  [NETWORK STATUS ]
[H₂ GAS        ]  [GRID CONNECTION]
[RACKS ISOLATED]  [SAFE STATE     ]
```

---

### 2.3 Analog Thermometer Prop

**Priority:** High
**Draft scenario inclusion:** Yes (notes object with readable text — functional)

**Functional spec:**

The analog thermometer is modelled as a `notes` object in the prototype. It is permanently fixed on the wall near Rack A2 in Battery Hall 1. Its reading cannot change during the scenario — it is a physical constant. It is not connected to any system.

`onRead: { setVariable: { anomaly_detected: true } }` — reading the thermometer triggers the anomaly detection event that drives the rest of the scenario.

The object should not be takeable. It should have `important: true` so it appears highlighted in inventory/examination interactions.

**Physical prop:** A real dial thermometer (e.g., bi-metal dial thermometer with 60mm face, temperature range -20°C to 120°C) pre-set to display 51°C. The thermometer face should be readable from approximately 1.5m. The prop is mounted on a wall bracket near the battery rack prop.

**Note:** The thermometer must be pre-set and sealed before each session — players cannot interact with the actual dial. The 51°C setting is achieved by ambient warming (heating element near the sensing bulb) or by a prop thermometer with a custom face showing 51°C permanently.

---

### 2.4 Jump Server Ethernet Cable (Physical Interaction Object)

**Priority:** High
**Draft scenario inclusion:** Simplified (notes object with onRead — functional but lacks physicality)

**Functional spec:**

In the prototype, the Ethernet cable is a `notes` object. Reading it simulates pulling the cable and sets `jump_server_isolated = true`.

In the full implementation, the cable should be a physical prop — an actual Ethernet cable with a contact sensor. When the player physically pulls the cable from the jump server rack prop, a contact sensor breaks and triggers `jump_server_isolated = true` via the game server GPIO.

TODO[ENG]: ENG-04 — The cable panel should only be accessible (the panel door should only unlock) when `jump_server_confirmed = true`. An RFID or solenoid lock on the cable management panel door, released by the game server when the condition is met.

**Physical prop:** A real Ethernet cable (Category 5e or Cat 6, with Albion Energy cable label attached) connected to a dummy switch or patch panel. The cable connector has a contact sensor on the port that registers insertion/removal. The cable management panel has a small solenoid lock that releases when `jump_server_confirmed = true`.

---

### 2.5 Battery Rack Prop (Atmosphere Object)

**Priority:** Medium
**Draft scenario inclusion:** No — atmosphere/immersion only

**Functional spec:**

The Battery Hall 1 room needs a central set piece: floor-to-ceiling battery rack props (non-interactive, atmosphere only). These are large grey/black cabinet arrays with indicator LED strips. The LEDs are addressable and change colour based on `cell_temperature_status` (normal: green; elevated: amber; critical: red). They mirror — deliberately — the falsified digital readings at first, which is part of the deception.

No new object type required — this is a room set design element. The LED arrays are driven by the same GPIO/game server system as the alarm panel.

---

### 2.6 SIS Certification Document (Readable Prop)

**Priority:** High
**Draft scenario inclusion:** Yes (can be implemented as readable text object)

**Functional spec:**

A one-page SIS certification summary document, physically located in the SCADA Control Room on a desk or wall-mounted display. The document is readable by the player and provides a concise overview of the SIS (Safety Instrumented System) configuration, certified operating parameters, and the critical claims that must be maintained for safe operation.

**Content (sourced directly from `case_2_energy/information_pack/requirements/claims.md`):**

```
ALBION ENERGY STORAGE FACILITY
Safety Instrumented System (SIS) Certification Summary
Configuration: SIL 2 — Independent Safety Layer

CERTIFIED BASELINE PARAMETERS:
• Controller: PLC-BMS (dedicated safety PLC)
• Pressure Relief Set Point: 800 kPa (certified, field-adjustable)
• High-Temperature Threshold: 62°C (alarm threshold; ESD trigger at 65°C)
• Cell Temperature Monitoring: Hardwired analog circuit (independent of SCADA)
• Emergency Shutdown: Hardwired button + relay logic (cyber-independent)

CRITICAL CLAIMS MAINTAINED BY THIS CONFIGURATION:

CLAIM-EN-001: "If the IT/OT boundary firewall rules are correctly configured 
  and maintained, then the SCADA network cannot directly command the SIS."
  ✓ Jump server isolates SCADA access; historian dual-home is monitored

CLAIM-EN-002: "If the SIS network remains isolated from the SCADA control 
  network (except for monitoring-only interfaces), then a SCADA compromise 
  cannot directly alter SIS parameters."
  ⚠ NOTE: Current SIS engineering port is on SCADA network (violation).

CLAIM-EN-007: "If the PLC firmware integrity is verified post-deployment, 
  then malware injection into the PLC is detectable."
  ✓ Last verified: [DATE]

CLAIM-EN-008: "If the Emergency Shutdown (hardwired button) remains functional 
  and cyber-independent, then the operator can always force safe shutdown."
  ✓ Daily automated test: [PASS/FAIL LOG]

SIGNATURE: Dr Priya Jayakumar, Safety Engineer
Date Certified: [DATE] | Next Review: [DATE + 12 months]
```

**Game mechanic:**

- Object type: Readable text object (uses existing `lockType: read` mechanism)
- Location: SCADA Control Room (wall or desk)
- Interaction: Player can examine the document at any time; it stays accessible throughout the game
- State tracking: `sis_cert_reviewed = true` set on first reading
- Outcome: Helps player understand the baseline SIS configuration and what claims are currently being maintained/violated

**Integration with MG-03 (SIS Config Threshold Display):**

When the player compares the SIS Config display readings against this certification document, they can identify discrepancies between certified baselines and current values. This provides a concrete way to detect the attack.

**Implementation note:**

For draft scenario: this is a simple readable text object in the game design JSON. No new minigame required. Full version: could be enhanced with an interactive modal showing the full certification document and allowing the player to compare live readings side-by-side with certified parameters.

---

## 3. Sprite Assets

---

### 3.1 Priya Chandra — Engineer Female Character Sprite

**Priority:** High
**Draft scenario inclusion:** Yes — needed for final scenario; male_nerd placeholder in prototype

**Spec:**
- Character type: female engineer, professional/industrial context
- Clothing: navy blue site coverall, high-visibility yellow strips, ID badge on lanyard, site hard hat clipped to belt (not worn)
- Hair: dark, shoulder-length, tied back
- Accessory: tablet computer in one hand

**Animation states required:**
- `idle` — standing, looking at tablet (4-frame loop, 6fps)
- `idle_talk` — looking up from tablet (2-frame transition + 4-frame loop)
- `walk_down`, `walk_up`, `walk_left`, `walk_right` — 4 frames each, 10fps
- `talk` — gesturing while speaking (4-frame loop)

**Headshot for dialogue box:** 128×128px portrait, professional style, ID badge visible.

**Sprite sheet format:** Match existing BreakEscape character sprite sheet dimensions (check `public/break_escape/assets/characters/` for dimension standard).

---

### 3.2 Dr Nalini Bashir — Inspector Female Character Sprite

**Priority:** High
**Draft scenario inclusion:** Yes — needed for debrief; male_nerd placeholder in prototype

**Spec:**
- Character type: female government inspector, professional formal
- Clothing: dark jacket, light blouse, NCSC/HSE dual-agency lanyard, clipboard
- Hair: dark, neatly styled
- Age: 40s — authoritative but approachable expression

**Animation states required:**
- `idle` — reviewing clipboard (4-frame loop, 6fps)
- `talk` — looks directly at player, gestures with clipboard (4-frame loop)
- `walk_down`, `walk_up`, `walk_left`, `walk_right` — 4 frames each

**Headshot for dialogue box:** 128×128px portrait.

---

### 3.3 SCADA Control Room — Room Tile Set

**Priority:** High
**Draft scenario inclusion:** No — room_office used as placeholder

**Spec:**
- Room type name: `room_scada_control`
- Dimensions: 2×2 GU (standard)
- Visual theme: industrial control room — dark flooring, rows of operator workstation desks, wall-mounted displays, cable management trays on ceiling
- Specific tile requirements:
  - Operator workstation desk with dual monitor setup (occupies standard desk slot)
  - Wall-mounted alarm panel (back wall, left side)
  - Large wall-mounted status board (back wall, right side)
  - Glass-panel server rack visible through a window (north wall, partially visible)
  - Lighting: overhead fluorescent strip lights

**Tiled map template:** Create `.tmj` map file with pre-placed object slots for: `pc` (operator workstation position), `smartscreen` (alarm panel position × 2), `filing_cabinet` (duty desk position), `notes` (incident folder position).

---

### 3.4 Battery Hall — Room Tile Set

**Priority:** High
**Draft scenario inclusion:** No — room_servers used as placeholder

**Spec:**
- Room type name: `room_battery_hall`
- Dimensions: 2×2 GU or 1×2 GU (tall room)
- Visual theme: industrial battery storage — grey floor, floor-to-ceiling rack arrays on side walls, inverter cabinets on far wall, ceiling-mounted fire suppression nozzles and cooling fan units, industrial lighting
- Specific tile requirements:
  - Battery rack arrays (left and right walls — decorative sprite)
  - Analog thermometer mounting (specific wall position near Rack A2)
  - ESD pushbutton housing (wall position)
  - Hydrogen detector panel (ceiling level or high wall)
  - Warning signage: "BATTERY HALL 1 — RESTRICTED — PPE REQUIRED"
  - Ambient detail: PPE station (helmets, goggles) near entrance

**Tiled map template:** Pre-placed slots for `notes` (thermometer position), `pc` (ESD position), `smartscreen` × 2 (rack status panels, hydrogen detector).

---

### 3.5 Engineering Workshop — Room Tile Set

**Priority:** Medium
**Draft scenario inclusion:** No — room_it used as placeholder

**Spec:**
- Room type name: `room_engineering_workshop`
- Dimensions: 1×1 GU or 2×2 GU small
- Visual theme: combined server rack and engineering workbench — industrial strip lighting, corkboard with engineering drawings, laptop on bench, server rack on right side with blinking amber LED
- Specific tile requirements:
  - Engineering workstation desk with single monitor
  - Jump server rack (right side wall — server rack sprite with amber LED indicator)
  - Corkboard / pinboard (back wall)
  - Filing cabinet
  - SIS configuration panel (small dedicated display)

---

## 4. Engine Behaviours

---

### ENG-01: State-Reactive Alarm Panel Driver

**Priority:** High
**Description:** The game server must push lamp state updates to the alarm panel (physical GPIO or smartscreen WebSocket) when specific global variables change. Requires a new event handler that:
1. Subscribes to `globalVariableChanged` events
2. Maps variable changes to lamp states (see MG-05 functional spec table)
3. Pushes state updates to the panel controller via GPIO relay board (physical) or WebSocket message (digital)

This is a generic mechanism that could be reused for any state-reactive physical display across scenarios.

---

### ENG-02: Timed State Escalation

**Priority:** Medium
**Description:** A timer system that starts when a specific global variable reaches a specific value, and fires state changes at elapsed-time thresholds. For this scenario: timer starts when `anomaly_detected = true`, fires H₂ escalation at T+22m and evacuation warning at T+40m if `esd_activated` is still false.

Requires: a timer object type in the game server that accepts: `startOnGlobal`, `threshold_minutes`, `setGlobal`, `cancelOnGlobal` fields.

---

### ENG-03: Item Reveal Mechanic (Conditional Visibility)

**Priority:** Medium
**Description:** An item in a room that is invisible/untakeable until a global variable condition is met. For this scenario: the plant room badge starts invisible and appears in the control room when `priya_briefed = true`.

Implementation: extend the object schema with an optional `visibleWhen: { "globalVar": value }` field. The room renderer checks this condition when rendering objects.

---

### ENG-04: Physical Cable Locker (RFID-Gated Container Release)

**Priority:** Medium
**Description:** A container (the jump server cable management panel) that starts locked and releases when a global variable condition is met (`jump_server_confirmed = true`). The release is triggered by the game server, not by player possession of a keycard. In physical implementation: a solenoid lock on the panel door.

Requires: support for `lockedUntilGlobal: { "var": true }` on container objects, and a corresponding engine handler that releases the lock when the variable is set.

---

### ENG-05: Compound Condition Trigger

**Priority:** Low
**Description:** `facility_safe_state` requires BOTH `esd_activated AND (jump_server_confirmed OR network_isolated)` to be true. The current implementation approximates this by firing on `network_isolated` alone (the last condition to be met in the expected flow). A proper compound condition trigger would evaluate multi-variable boolean expressions and fire the consequence only when all conditions are met.

Requires: an event handler that subscribes to multiple global variable changes and evaluates a boolean condition before firing.

---

### ENG-06: Ambient Timer Display

**Priority:** Low
**Description:** A room object that shows a countdown timer based on elapsed time since a specific global variable was set. For this scenario: the NIS notification 72-hour clock, starting from `anomaly_detected`. The display updates every minute. Colour changes based on time remaining.

---

### ENG-07: NPC Reveal Animation

**Priority:** Low
**Description:** When an initially-hidden NPC becomes visible, a fade-in or entrance animation plays rather than the NPC appearing instantaneously. For Dr Bashir: a brief 0.5s fade-in is sufficient.
