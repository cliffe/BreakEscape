# Minigame Planning — Case 2: Energy (Albion Battery Hall)

Generated from: `prompts/breakescape_game_implementation.md`
Scenario: `game_design/energy/break_escape_scenaro_draft/scenario.json.erb`

---

## 1. ESD Pushbutton Interaction (MG-01)

**Category:** Minigame (Phaser.js) — physical hardware integration
**Scenario moment:** Objective 5 — after Marcus Webb confirms the attacker session and gives authorisation code; player must return to Battery Hall 1 and physically press the button
**Core concept:** Hardwired ESD as cyber-independent ultimate safety boundary (CLAIM-EN-008); defence in depth through independent protection layers
**Priority:** High
**Draft scenario:** Simplified (PIN placeholder — `lockType: pin` — functional but lacks physicality)

### Functional Spec

**Entry state:** Player enters Battery Hall 1 with `marcus_webb_contacted = true`. The ESD object is visible with an `observations` noting the flip-up guard. Player must interact with the object.

**Prototype behaviour (current):** `lockType: pin` — player enters the 4-digit PIN code (delivered by Marcus Webb via timedMessage). On correct entry, task `press_esd_button` completes and the contents text_file is readable, which sets `esd_activated = true`.

**Custom minigame behaviour (MG-01):** A two-step physical interaction screen. Step 1: a rendered close-up of the ESD housing shows a hinged guard in the down position. Player must click/tap the guard to flip it up. Step 2: the red mushroom-head button is now exposed. A confirmation prompt appears: "INITIATE EMERGENCY SHUTDOWN — RACKS A1–A4? This action is irreversible without manual reset." Player confirms → `esd_activated = true` → flagReward fires.

**Physical hardware integration:** In the physical escape room, the ESD object is a real emergency stop button connected to the game server via GPIO relay. Button press triggers `esd_activated = true` directly, bypassing the minigame screen entirely. The minigame screen is used only when the physical prop is unavailable (e.g., digital-only play mode).

**Global variables read on entry:** `marcus_webb_contacted` (must be true for the ESD to be interactable; locked if false)
**Global variables written on completion:** `esd_activated = true`
**Task completed:** `press_esd_button`

**Failure path:** Player attempts ESD before `marcus_webb_contacted = true` → object shows observations: "The ESD requires authorised activation. Contact the OT Security Manager first." Pressing not permitted.

**Premature ESD path:** If player presses ESD before `historian_flatline_found = true`, Priya's radio dialogue expresses concern: "We haven't confirmed the anomaly yet — are you sure?" No in-game penalty (pressing early is a valid — if suboptimal — choice), but recorded in outcome variables for debrief.

### Visual Design

A close-up rendered view of an industrial emergency stop panel. Yellow housing with safety stripe border. The mushroom-head button is red with a white base. A black flip-up guard is positioned over the button in the initial state. The label "EMERGENCY SHUTDOWN — RACKS A1–A4" is printed in black on a yellow background above the button.

Step 1 animation: The guard hinges upward with a satisfying click sound and a brief haptic pulse (if physical prop). The button is now exposed — it glows slightly to draw attention.

Step 2: A confirmation modal overlays the view. Black background with amber text: "CONFIRM EMERGENCY SHUTDOWN?" Two buttons: [CONFIRM — INITIATE SHUTDOWN] in red, and [CANCEL] in grey. The confirm action triggers a white flash, followed by a battery rack status display showing "ISOLATED — COOLING ACTIVE" in green.

Audio: Industrial relay click sound on activation. Cooling fan audio track increases from ambient to full speed.

---

## 2. SCADA Historian Trend Viewer (MG-02)

**Category:** VM (Hacktivity VM — browser-based simulated SCADA interface)
**Scenario moment:** Objective 3 — player reviews historian trend data for Battery Rack A1 temperature after the analog thermometer discrepancy is identified
**Core concept:** Historian trend analysis as anomaly detection method; flat-line sensor reading as behavioural IoC; rate-of-change analysis
**Priority:** High
**Draft scenario:** No (VM content not yet built; PIN placeholder not applicable — this is a VM-launcher challenge)

### Functional Spec

**VM name:** `albion_scada_historian`
**Access:** Via vm-launcher inside HMI-OPS-01 (password-locked PC in SCADA Control Room)

**Challenge flow:**
1. Player accesses the historian trend viewer. The interface shows a graph selection panel with all four Battery Hall 1 racks (A1–A4) and a time range selector.
2. Player selects Rack A1 temperature trend and sets time range to "Last 6 hours."
3. The rendered graph shows: normal fluctuating temperature trace from 18:00–23:12 (±2°C around 31°C ambient), then an abrupt transition at 23:12 to a perfectly flat line at exactly 28.0°C, which continues to the present time.
4. The flag is embedded in the timestamp of the first flat-line data point: player must identify `23:12:07` as the time the sensor data was falsified and enter this as the flag value, OR identify the description "zero-variance data injection" from a tooltip.

**Global variables read on entry:** None required
**Global variables written on flag submission:** `historian_flatline_found = true` (via flagReward on flag-station)
**Task completed:** `review_historian` (auto-completes on flag submission via `submit_flags` task type)
**Flag:** `albion_scada_historian:historian_flag`

**Supporting evidence in VM:**
- Rack A2, A3, A4 show similar flat-line transitions (all at 23:12), confirming systematic falsification
- A "Compare Racks" view shows all four flat-lines coinciding exactly — impossible in natural operation
- An "Export to Analysis" button produces a synthetic CSV that players can examine for the timestamp

**Failure path:** Player does not identify the flat-line or submits wrong timestamp → no global variable set; Priya's dialogue prompts them to "look at the variance, not just the average."

### Visual Design

A simulated SCADA historian interface styled as a professional industrial HMI — dark background (#1a1a2e), grid lines in dark blue, data traces in amber/gold. The interface has a left panel for rack/variable selection and a main chart area with zoom and pan controls.

Normal data appears as a slightly noisy sine-like trace — natural thermal fluctuation. The flat-line section is visually stark — a perfectly horizontal line in a different shade (bright amber vs. dim amber) to make the contrast obvious but not comically obvious. The timestamp axis shows the 23:12 transition point.

An "Anomaly Detection" tooltip appears after 30 seconds if the player hasn't zoomed into the flat-line section: "Hint: real sensor data has variance. Look for implausibly consistent readings."

---

## 3. SIS Configuration Threshold Display (MG-03)

**Category:** Minigame (HTML/CSS — interactive display panel)
**Scenario moment:** Objective 7 — player accesses Engineering Workshop SIS configuration panel to compare current setpoints against certified baseline
**Core concept:** SIS setpoint manipulation as cyber-safety attack; IEC 61511 certified values vs. tampered values; SIS independence violation consequences
**Priority:** Medium
**Draft scenario:** Simplified (readable smartscreen text — functional but non-interactive)

### Functional Spec

**Entry state:** Player is in Engineering Workshop. SIS configuration panel object is readable. Current prototype: static text showing tampered values with amber highlights.

**Custom minigame behaviour (MG-03):** An interactive tabular display showing the SIS configuration table. Each row has: parameter name, current value, certified baseline, deviation status (GREEN/AMBER/RED), last-modified timestamp, and modified-by field.

Player interactions:
- Click any AMBER row to expand it — shows: "This value deviates from the IEC 61511 certified baseline. Possible causes: (1) authorised maintenance change — requires recertification, (2) unauthorised modification."
- A "Compare with Certification Document" button is available only when the SIS certification document has been retrieved from the filing cabinet (`sis_certification_seen = true`). Clicking it overlays the certified baseline values against the current values, highlighting deviations in red.
- Final step: player must click "Confirm SIS Tamper — Report to Security" button → sets `sis_tamper_confirmed = true`.

**Global variables read on entry:** `sis_certification_seen` (comparison feature enabled when true)
**Global variables written on completion:** `sis_tamper_confirmed = true`, `en002_claim_assessed = true`
**Tasks completed:** `read_sis_config`, `find_certification_doc` (via Priya eventMapping on `sis_tamper_confirmed`)

**Failure path:** Player reads config without reading certification doc → can still confirm tamper, but Dr Bashir notes in debrief that the comparison wasn't formally documented.

### Visual Design

A Raspberry Pi display emulator — small dark-bordered panel with industrial aesthetic. Header: "SIS CONFIGURATION — BATTERY HALL SIS" in white on dark blue. Table rows alternate dark grey and darker grey. Deviation values highlighted with amber background and an amber warning triangle icon. The timestamp "03:22 — engineering_access" on the tampered rows is highlighted in red.

The "Compare with Certification Document" button is gold-coloured when `sis_certification_seen = true`, grey otherwise. Clicking it slides in a side-by-side panel comparing certified vs. current values with clear red/green diff highlighting.

---

## 4. Jump Server Access Log Analysis (MG-04)

**Category:** VM (Hacktivity VM — simulated ICS access log viewer)
**Scenario moment:** Objective 4 — player accesses HMI-ENG-02 engineering workstation to review jump server session logs and identify the dormant contractor RDP session
**Core concept:** Dormant account exploitation; jump server as IT/OT boundary weakness; IoC identification in ICS access logs
**Priority:** High
**Draft scenario:** No (VM content not yet built; vm-launcher + flag-station infrastructure in place)

### Functional Spec

**VM name:** `albion_eng_workstation`
**Access:** Via vm-launcher in Engineering Workshop (accessible after workshop RFID unlock)

**Challenge flow:**
1. Player opens the VM. Desktop shows: active RDP session notification banner (c.ellison, connected since 01:47), and two applications: "Jump Server Session Log Viewer" and "SIS Engineering Interface."
2. In the Session Log Viewer: a table of RDP sessions for the past 7 days. Most are from known internal accounts with regular patterns. One entry stands out: `c.ellison | 185.220.101.45 | 01:47 – ACTIVE | Duration: 4h+`.
3. Player must right-click the c.ellison entry → "Investigate Account" → a popup shows: "c.ellison — contract status: TERMINATED 8 months ago. Account should be disabled. This session is ACTIVE."
4. Player clicks "Flag for Security" on the account popup → flag is generated → submit to flag-station.

**Bonus content in SIS Engineering Interface:**
- Player can open the SIS Engineering Interface from the same VM
- Shows the SIS configuration in editable form (with a warning: "Unauthorised modification is a criminal offence under the Computer Misuse Act 1990")
- The audit log shows: `03:22 — c.ellison — SETPOINT MODIFIED — THERMAL_RUNAWAY_THRESHOLD: 55 → 85`
- Reading this sets `sis_config_seen = true` and supports the SIS investigation objective

**Global variables read on entry:** None required
**Global variables written on flag submission:** `jump_server_confirmed = true` (via flagReward)
**Task completed:** `identify_rdp_session` (auto-completes on flag submission)
**Flag:** `albion_eng_workstation:jump_server_flag`

**Failure path:** Player submits wrong flag (identifies a different anomalous session) → immediate re-prompt to look for the dormant account.

### Visual Design

A Windows-style desktop environment with an industrial theme. Dark task bar, high-contrast text. The active RDP session notification appears as an amber banner across the top of the screen. The session log viewer is a spreadsheet-style table with sortable columns. Normal sessions have grey rows; the c.ellison session row has an amber background and a blinking amber indicator.

The account investigation popup is styled as a security alert modal with a red border and warning icon. The "Flag for Security" button is red with white text.

---

## 5. Facility Alarm Panel (MG-05)

**Category:** Engine behaviour (GPIO-driven physical hardware / smartscreen state machine)
**Scenario moment:** Ambient — the alarm panel in the SCADA Control Room updates throughout the scenario as global variables change
**Core concept:** Physical environmental feedback to player decisions; makes the consequence of cyber attacks and player actions visible in the environment
**Priority:** High
**Draft scenario:** Simplified (static smartscreen readable text — state changes not currently reactive)

### Functional Spec

This is not a traditional minigame — it is an ambient interactive element that changes state based on global variable events. In the physical escape room, this is a custom multi-lamp panel with individually controllable LED lamps driven by the game server's GPIO or web API.

**Lamp states and triggers:**

| Lamp Label | Initial State | Trigger | New State |
|---|---|---|---|
| BATTERY HALL 1 | GREEN | `anomaly_detected = true` | AMBER |
| BATTERY HALL 1 | AMBER | `esd_activated = true` | AMBER (steady) with label change to ISOLATED |
| SIS STATUS | GREEN | `sis_tamper_confirmed = true` | RED (flashing) with label SIS SETPOINT DEVIATION |
| NETWORK CONNECTIVITY | GREEN | `jump_server_isolated = true` | AMBER — JUMP SERVER ISOLATED |
| NETWORK CONNECTIVITY | AMBER | `network_isolated = true` | RED — SCADA MANUAL MODE |
| H₂ GAS | GREEN | `hydrogen_alarm = true` (timed) | RED — EVACUATE |
| SAFE STATE | (off) | `facility_safe_state = true` | GREEN — SAFE STATE ACHIEVED |

**Global variables read:** `anomaly_detected`, `sis_tamper_confirmed`, `esd_activated`, `jump_server_isolated`, `network_isolated`, `hydrogen_alarm`, `facility_safe_state`
**Global variables written:** None

**TODO[ENG]: ENG-01** — Implement state-reactive alarm panel driver. The panel state must be pushed from the game server to the GPIO controller (or smartscreen renderer) when global variables change. This requires a new engine event handler that watches globalVariables and pushes lamp state updates.

### Visual Design

Physical escape room version: custom fabricated panel with 8–10 individually addressable LED lamps in standard traffic-light colours. Each lamp has a printed label beneath it. The panel is mounted at eye height on the SCADA Control Room wall above HMI-OPS-01.

Digital fallback (smartscreen version): A rendered alarm panel image that updates dynamically. Lamps are SVG circles that change colour and add a CSS flash animation. Panel dimensions: approximately 400×600px at 1:1 scale on a wall-mounted monitor.

Audio feedback on state changes: a brief alarm tone (1 second) when any lamp changes state, distinguishing between advisory (single beep) and critical (triple beep).

---

## 6. Hydrogen Gas Alarm Progression (MG-06)

**Category:** Engine behaviour (timed state escalation)
**Scenario moment:** Timed escalation — H₂ reading increases if ESD is not pressed within 22 minutes of scenario start; alarm triggers at minute 40 if ESD still not pressed
**Core concept:** Consequence of delayed detection and response; cascading safety effects; time pressure without hard cutoff
**Priority:** Medium
**Draft scenario:** No (timed escalation logic not yet implemented; static smartscreen placeholder)

### Functional Spec

**Trigger conditions:**
- At T+22 minutes (measured from `anomaly_detected = true`): H₂ reading updates from 0.6% to 0.9% LEL. Priya's radio: "That hydrogen detector in Hall 1 just tripped. We're at 0.9% and rising." `hydrogen_alarm = true` flag set. Alarm panel H₂ lamp changes to AMBER.
- At T+40 minutes (measured from `anomaly_detected = true`) if `esd_activated = false`: H₂ reading updates to 1.1% LEL (above alarm threshold). Red rotating beacon light activates in Battery Hall 1 (physical prop). Evacuation tone plays. Alarm panel H₂ lamp changes to RED — EVACUATE. Priya (urgent): "We have to evacuate. The cells are approaching runaway. Press the ESD — now."

**On ESD pressed:** H₂ progression pauses. Priya confirms cooling is active. H₂ reading slowly decreases (shown in Battery Hall 1 hydrogen detector smartscreen on next read).

**Global variables read:** `anomaly_detected`, `esd_activated`
**Global variables written:** `hydrogen_alarm = true` at T+22

**TODO[ENG]: ENG-02** — Implement timed state escalation engine. Requires a timer that starts when `anomaly_detected = true` and drives state changes at elapsed-time thresholds. The game server must track elapsed time per global variable state.

### Visual Design

The Battery Hall 1 hydrogen detector smartscreen displays a simple numerical readout. The reading changes from static text to a pulsing value at T+22 (amber background, blinking). At T+40, the screen background turns red and an alarm icon flashes.

Physical escape room: A wall-mounted LED display in Battery Hall 1 showing the H₂ % reading. Updates via game server API. A physical amber rotating beacon light activates at T+40 (fog horn optional — facilitator discretion).

---

## 6. Network Architecture Diagram — Purdue Model Visualization (MG-06)

**Category:** Interactive game object (SVG minigame or readable HMI display)
**Scenario moment:** Objective 2 (after briefing) — player reviews facility network to understand IT/OT boundary and attack surface
**Core concept:** IT/OT boundary visualization; architectural vulnerabilities that enable pivot attacks; independent safety systems
**Priority:** High
**Draft scenario:** Yes (can be implemented as readable smartscreen or interactive SVG; uses existing game object infrastructure)

### Functional Spec

Renders the Albion facility's OT architecture organized by Purdue Model levels with labelled systems, connection types, and vulnerability annotations. Content is directly sourced from `case_2_energy/information_pack/system_architecture/network_architecture.md`.

**Zones and Systems (by Purdue Level):**
- **Level 4–5 (Enterprise IT):** Internet Gateway, Corporate IT Network (CORP VLAN), ERP, Email, Active Directory, Shared Multi-Function Printers ⚠️, Shared File Server (with Trent Water), Building Management System, CastleTech SOC
- **DMZ / IT-OT Boundary:** Jump Server ⚠️ (bidirectional RDP)
- **Level 3 (Operations/SCADA):** Historian Server ⚠️ (dual-homed interface), HMI-OPS-01, HMI-ENG-02, SCADA Server
- **Level 1–2 (Control):** PLC-BMS (Battery Management), PLC-GRID (Grid Interface), RTUs (Ancillary Systems), Safety Instrumented System (SIL 2) ⚠️
- **Level 0 (Field Devices):** Temperature Sensors, Voltage/Current Sensors, Hydrogen Detectors, DC Contactors, AC Breakers, Cooling Fans, Ventilation Dampers, Bidirectional Inverters
- **Independent Safety Layer (Green — Cyber-Independent):** Hardwired ESD Pushbutton System, Analog Thermometers (wall-mounted)
- **Cross-Sector:** Trent Water Services SCADA, Trent Water Workstations

**Attack Paths to Highlight (when clicked):**
1. VPN entry → AD compromise → Jump Server (bidirectional RDP) → HMI-ENG-02 → SCADA → PLCs
2. VPN entry → AD compromise → Historian (dual-homed interface) → SCADA
3. VPN entry → AD compromise → Legacy Modbus/TCP firewall rules → SCADA Server
4. SCADA network → SIS engineering port (not isolated from SCADA network)
5. Shared File Server / Printers → Trent Water Services (cross-sector compromise)

### Visual Design

**Layout:** Full-panel or wall-mounted display. Five horizontal layers representing Purdue Model levels (top to bottom). Each layer is a zone box with colour coding:
- Red shading: Enterprise IT / DMZ / vulnerability-prone components
- Amber shading: Operations/SCADA with known weaknesses
- Green shading: Independent safety systems (cyber-immune)

**Systems:** Icons or text labels grouped by level. Key weaknesses (jump server, historian, SIS, shared infrastructure) are highlighted with warning badges (⚠️).

**Connection Lines:** 
- Solid white lines: Intended communication (enterprise backbone)
- Solid amber lines: IT/OT boundary (firewall)
- Dashed orange lines: Legacy exceptions / rules that shouldn't exist
- Red animated arrows: Attack paths when a system is clicked

**Interactive Elements (Optional):** Click on any system to expand details or highlight attack paths. Hover tooltips explain vulnerabilities.

### Game Mechanic

- **Object type:** Readable smartscreen prop or interactive SVG minigame (uses existing game object system)
- **Location:** Engineering Workshop — wall-mounted display or tablet on desk
- **Interaction:** Player examines architecture to understand vulnerabilities and IT/OT boundary
- **State tracking:** `network_architecture_reviewed = true` set on first viewing
- **Outcome:** Helps player understand why IT/OT boundary matters, how attack propagates, and why SIS isolation is critical

### Integration with Claims

- **CLAIM-EN-001 (IT/OT Boundary):** Visualization shows why jump server and historian are critical weaknesses
- **CLAIM-EN-002 (SIS Network Isolation):** Diagram shows SIS connected to SCADA network (violation of isolation principle)
- **CLAIM-EN-011 (Cross-Sector Dependency):** Shows shared infrastructure with Trent Water Services

### Implementation Notes

**Approach 1 (Faster):** Render as a readable smartscreen showing formatted text description of zones and connections
**Approach 2 (Better Immersion):** Create interactive SVG diagram with clickable elements and attack path animation

For draft scenario, Approach 1 is sufficient. Approach 2 can be implemented post-draft.

---

## 7. NIS Notification Clock (MG-07)

**Category:** Engine behaviour (ambient display / timer)
**Scenario moment:** Ambient — a countdown timer display in the SCADA Control Room shows the 72-hour NIS notification clock running from the moment the incident is detected
**Core concept:** NIS Regulations 2018 notification obligation; regulatory time pressure running alongside operational response
**Priority:** Low
**Draft scenario:** No (timer display not yet implemented; NIS obligation documented in incident folder text)

### Functional Spec

A wall-mounted display or smartscreen in the SCADA Control Room showing a countdown timer:

```
NIS REGULATIONS 2018
72-HOUR NOTIFICATION CLOCK
Time remaining: 71:34:22
```

The clock starts from `anomaly_detected = true`. At 48 hours remaining (T+24h), the display turns amber. At 24 hours remaining, it turns red. If `ncsc_notified = true` is set, the clock stops and displays: "NOTIFICATION SUBMITTED — [timestamp]" in green.

**Global variables read:** `anomaly_detected`, `ncsc_notified`
**Global variables written:** None

Note: For an in-person 70-minute session, the clock is purely ambient — it will show approximately 71 hours remaining throughout the session. Its teaching purpose is to make the regulatory obligation visible as a constant presence, not as a live timer that threatens the session.

**TODO[ENG]: ENG-06** — Implement ambient timer display. Simple epoch-based countdown driven from `anomaly_detected` timestamp.

### Visual Design

A small dedicated screen (or sub-panel on the facility status board) showing the countdown in digital clock format. The Albion Energy logo at top, NIS reference text below. Colour-coded: green → amber → red as deadline approaches. Stops with a green "submitted" banner when `ncsc_notified = true`.

---

## Summary Table

| ID | Name | Type | Priority | Draft Scenario | Status |
|----|------|------|----------|----------------|--------|
| MG-01 | ESD Pushbutton | Phaser.js + GPIO | High | Simplified (PIN placeholder) | Custom needed |
| MG-02 | SCADA Historian Trend Viewer | VM | High | No (vm-launcher ready) | VM content needed |
| MG-03 | SIS Config Threshold Display | HTML/CSS interactive | Medium | Simplified (readable text) | Custom needed; enhanced for comparison |
| MG-04 | Jump Server Access Log Analysis | VM | High | No (vm-launcher ready) | VM content needed |
| MG-05 | Facility Alarm Panel | GPIO / smartscreen state machine | High | Simplified (static text) | Engine + hardware needed |
| MG-06 | Network Architecture Diagram | SVG minigame or readable smartscreen | High | Yes | Interactive or text display; info pack sourced |
| MG-07 | Hydrogen Gas Alarm Progression | Engine timed escalation | Medium | No | Engine needed |
| MG-08 | NIS Notification Clock | Engine ambient display | Low | No | Engine needed |
