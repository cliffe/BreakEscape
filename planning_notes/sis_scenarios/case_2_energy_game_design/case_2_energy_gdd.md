# Game Design Document — Case 2: Energy
## "Albion Battery Hall: Code Red"

Based on: Albion Energy Storage Ltd — IT-to-OT Pivot scenario
Scenario prerequisite: `game_design/story_selection_report.md`

---

## Section 1: Physical Room Layout

---

### Room: SCADA Control Room

**Setting**: The Albion Energy Storage Facility's primary operations hub. This is the brain of the battery storage system — rows of operator workstations, a large wall-mounted status board showing facility-wide battery health, and a jump server rack visible behind a glass panel. The room is clean and professional, more IT office than industrial plant. Operators spend most of their shift here.

**Atmosphere**: Rows of LCD monitors displaying the SCADA HMI — battery rack status indicators (all showing green/normal), grid frequency traces, and charge/discharge curves. A wall-mounted facility schematic with status lamps. Ambient hum of server fans. A whiteboard with shift notes. A wall clock. A phone and radio on the duty officer desk.

**Key systems present**:
- HMI-OPS-01 operator workstation (PC terminal, fully interactive) — shows SCADA data including falsified cell temperatures (28°C) and state-of-charge (72%)
- Alarm panel (physical) — currently showing all-green with one amber advisory for grid load
- Facility status board (large wall display) — mirrors HMI status
- Jump server rack (visible behind glass panel, not directly interactive without RFID key to IT cabinet)
- Phone (NPC: Tom Hadley at CastleTech SOC)
- Incident response folder in a wall-mounted holder (physical prop: contains NIS Regulations reporting requirements, NCSC contact details)

**Initial state**: Players enter to find Priya Chandra (SCADA Engineer NPC) reviewing the workstation. The HMI shows entirely normal readings. A junior shift technician has just handed over at end of night shift. Nothing appears wrong.

**Connections**: North → Battery Hall 1 (requires plant room RFID badge); East → Engineering Workshop (requires engineering workstation RFID key)

---

### Room: Battery Hall 1

**Setting**: The first of two battery storage halls. Floor-to-ceiling racks of lithium-ion cells — grey cabinet arrays with amber indicator LEDs, inverter cabinets on the end wall humming quietly. Cooling fans mounted at ceiling level. A fire suppression nozzle array visible overhead. The room is warmer than the control room — noticeably so.

**Atmosphere**: Industrial lighting, slight vibration from cooling equipment. A large sign above the entrance: **BATTERY HALL 1 — RESTRICTED ACCESS — PPE REQUIRED**. Cell rack panels have digital indicators (currently showing normal values — falsified). A hardwired red emergency shutdown pushbutton in a yellow housing is mounted on the wall near Rack A2. A wall-mounted analog thermometer (old, mechanical, not networked) hangs near Rack A2. Hydrogen gas detector panel mounted near the ventilation outlet.

**Key systems present**:
- Analog thermometer (physical prop) — reads 51°C; this is the scenario's critical clue
- Battery rack status panels (physical displays, falsified — show 28°C, 72% SoC)
- Hardwired ESD pushbutton — red button in yellow housing, flip-up guard, labelled "EMERGENCY SHUTDOWN — RACKS A1–A4"
- Hydrogen gas detector panel (physical display) — initially reading 0.6% (elevated; actual sensor reads correctly because it is not connected to the SCADA system)
- Cooling fan status panel — fans running at low speed despite heat (because SCADA is commanding low speed based on falsified sensor data)

**Initial state**: Players can enter from the control room with the plant room RFID badge (held by Priya). Ambient temperature is visibly elevated. The analog thermometer reads 51°C. Cell rack digital indicators show 28°C.

**Connections**: South → SCADA Control Room

---

### Room: Engineering Workshop / IT Room

**Setting**: A smaller room adjacent to the SCADA control room — part workbench, part server rack. The engineering workstation (HMI-ENG-02) sits here, along with the jump server rack (accessible from this side), network patch panels, and a filing cabinet containing ICS documentation.

**Atmosphere**: Fluorescent strip lighting. Engineering drawings pinned to a corkboard. An opened laptop with PLC vendor software on screen. The jump server rack has an amber LED blinking — an active RDP session indicator. Post-it notes with configuration reminders. A printed "IT/OT Boundary Rules" document on the desk (out of date — from commissioning period).

**Key systems present**:
- HMI-ENG-02 engineering workstation (PC terminal / VM) — jump server access log analysis challenge; contractor RDP session visible; also used for SIS configuration audit
- Jump server rack (physical prop) — has a blinking amber LED indicating active session; players can physically disconnect the Ethernet cable (an RFID-gated pull-tab reveals the correct cable)
- SIS configuration panel (physical display or terminal) — shows SIS alarm setpoint configuration; THERMAL_RUNAWAY_THRESHOLD currently reads 85°C (should be 55°C)
- Filing cabinet (locked — key found on engineering workstation desk) — contains SIS certification documents, IEC 61511 compliance records, and the deferred patch risk assessment (physical props)

**Initial state**: Locked — requires engineering workshop RFID key (held in a drawer in the control room, discovered through NPC dialogue with Priya or by searching the duty desk).

**Connections**: West → SCADA Control Room

---

## Section 2: Interactive Elements Catalogue

---

### Element: SCADA Operator Workstation (HMI-OPS-01)

**Type**: PC terminal (VM or simulated SCADA interface)
**Location**: SCADA Control Room
**Initial state**: Showing normal SCADA readings — cell temperatures at 28°C, SoC at 72%, charge rate at moderate level, all alarms green
**How players interact**: Review battery status data, compare readings across racks, check historian trend data for the past 24 hours
**State changes**:
- When `anomaly_detected = true`: historian trend view reveals the flat-line temperature reading anomaly (3 hours of exactly 28.0°C with zero variance)
- When `network_isolated = true`: display shows "SCADA SERVER DISCONNECTED — LOSS OF CONTROL" in red
**Teaching purpose**: Demonstrates sensor data falsification — the digital system is confidently wrong; illustrates the value of historian trend analysis as a detection method
**Physical implementation note**: Standard PC terminal with simulated SCADA HMI running in a browser or VM. Historian view is a key interaction — trend graph clearly shows the implausible flat line vs. normal fluctuation pattern.

---

### Element: Alarm Panel (SCADA Control Room)

**Type**: Physical alarm panel (multi-lamp, physical hardware)
**Location**: SCADA Control Room — wall-mounted above HMI-OPS-01
**Initial state**: All green; one amber lamp: "GRID LOAD — ADVISORY"
**How players interact**: Observe; changes state based on game events — not directly interactable
**State changes**:
- When `sis_tamper_confirmed = true`: Red lamp illuminates — "SIS SETPOINT DEVIATION"
- When `esd_activated = true`: All rack lamps go amber — "RACKS A1–A4 ISOLATED"; cooling fan status changes to "RUNNING — MAX"
- When `network_isolated = true`: Multiple lamps go amber — "SCADA CONTROL LOSS — MANUAL MODE"
- When `hydrogen_alarm = true` (time trigger if ESD not pressed by minute 45): Red lamp — "H₂ GAS ALARM — EVACUATE"
**Teaching purpose**: Physical environmental feedback to player decisions; makes the trade-off between ESD/isolation and continued control visible as alarm state changes
**Physical implementation note**: Custom alarm panel with individually controllable LED lamps. State driven by game server via GPIO or web API.

---

### Element: Analog Thermometer (Battery Hall 1)

**Type**: Physical prop — analog thermometer
**Location**: Battery Hall 1, wall near Rack A2
**Initial state**: Reading 51°C (physically set; not networked; cannot be falsified by attacker)
**How players interact**: Players walk to Battery Hall 1 and read the thermometer. NPC (Priya) draws attention to it during walkdown dialogue.
**State changes**: None — the thermometer is independent of all digital systems and cannot be changed by game events. This is deliberate — it is the one trustworthy reading in the scenario.
**Teaching purpose**: The central teaching moment — independent analog instrumentation as a last-resort safety detection mechanism. The contrast between HMI (28°C) and analog gauge (51°C) is the detection event. Illustrates CLAIM-EN-007 (independent sensor validation).
**Physical implementation note**: A real analog dial thermometer in a battery-hall-appropriate housing, pre-set to show 51°C. Must be clearly legible from ~1.5m distance.

---

### Element: Hardwired ESD Pushbutton

**Type**: Physical interactive — hardwired control
**Location**: Battery Hall 1, wall-mounted near Rack A2
**Initial state**: Armed (guard down over button)
**How players interact**: Flip up guard, then press the red button. Requires physical presence in Battery Hall 1 — cannot be done remotely from the control room.
**State changes**:
- On press: `esd_activated = true`; alarm panel updates (racks isolated); cooling fan sound effect increases; battery rack status panels change to "ISOLATED — COOLING ACTIVE"; a green confirmation light illuminates on the ESD panel
- If pressed before `anomaly_detected = true`: premature shutdown — NPC Priya expresses concern about acting without confirmation
**Teaching purpose**: The ultimate independent safety boundary — a hardwired electrical interlock completely independent of all programmable and networked systems. Even if SCADA, SIS, and PLC-BMS are simultaneously compromised, this physical control works. Illustrates CLAIM-EN-008 (hardwired ESD as cyber-independent safety boundary) and the concept of defence in depth through independent protection layers.
**Physical implementation note**: Real emergency stop button (large mushroom-head format) in yellow housing with flip-up guard. Connects to game server via GPIO/relay to trigger `esd_activated` global variable.

---

### Element: Engineering Workstation (HMI-ENG-02)

**Type**: PC terminal (VM challenge)
**Location**: Engineering Workshop
**Initial state**: Locked (engineering workshop RFID required to enter room). When unlocked: shows active RDP session from `c.ellison` contractor account (dormant account, connected since 01:47)
**How players interact**:
- Review jump server access logs — identify dormant contractor account RDP session (IoC)
- Review PLC programming audit trail — identify off-schedule PLC write events (IoC)
- Access SIS engineering interface — view current SIS threshold configuration (THERMAL_RUNAWAY_THRESHOLD = 85°C, normally 55°C)
**State changes**:
- When `jump_server_confirmed = true` (player identifies contractor RDP session): `vpn_anomaly_identified = true` (using HC terminology equivalent); NPC Marcus Webb can be called
- When `sis_tamper_confirmed = true` (player reads SIS threshold): alarm panel SIS lamp illuminates; Priya dialogue branch unlocks
**Teaching purpose**: Incident investigation skills — reading access logs, correlating anomalies with physical process changes. Illustrates how SIS independence (CLAIM-EN-002) was violated by network architecture fault — SIS engineering port reachable from SCADA network.
**Physical implementation note**: Standard PC terminal running a VM with simulated access log viewer and SIS configuration viewer. CTF-style — player must identify the specific IoCs from a log display. Flag on successful identification.

---

### Element: Jump Server Ethernet Cable

**Type**: Physical interactive — tangible action
**Location**: Engineering Workshop, jump server rack
**Initial state**: Cable connected; amber LED blinking on rack (active session indicator)
**How players interact**: After identifying the active attacker RDP session on HMI-ENG-02, players must physically locate and remove the Ethernet cable that connects the jump server to the SCADA network. The cable is behind a labelled panel (revealed when `jump_server_confirmed = true` — an RFID-gated pull-tab unlocks the panel).
**State changes**:
- On cable removal: `jump_server_isolated = true`; amber LED goes out; alarm panel "JUMP SERVER ISOLATED" indicator illuminates; Marcus Webb confirms attacker ejected via phone
**Teaching purpose**: Network isolation as a tangible, physical, irreversible action — not just a checkbox in a UI. Illustrates that the attacker still had a secondary pathway (historian Modbus proxy) even after jump server isolation — next objective reveals this.
**Physical implementation note**: Actual Ethernet cable with RFID-gated cable locker. Removing the cable triggers `jump_server_isolated` via a contact sensor.

---

### Element: SIS Configuration Panel

**Type**: Physical display (or terminal view)
**Location**: Engineering Workshop — wall-mounted panel or dedicated monitor
**Initial state**: Shows current SIS setpoints — `THERMAL_RUNAWAY_THRESHOLD: 85°C` in amber (should be 55°C, deviation highlighted)
**How players interact**: Read the configuration display; compare against the certified baseline printed on the SIS certification document (physical prop in filing cabinet)
**State changes**:
- When `sis_tamper_confirmed = true`: Alarm panel SIS lamp illuminates; NPC Priya provides dialogue about IEC 61511 implications; SIS patch dilemma objective unlocks
**Teaching purpose**: Makes the SIS threshold manipulation directly visible — the automated safety layer has been silently disabled by the attacker. Core illustration of CLAIM-EN-002 failure and the consequence of leaving the SIS engineering port reachable from the SCADA network.
**Physical implementation note**: Small dedicated display screen (Raspberry Pi with static HTML) showing SIS setpoint table. The threshold deviation is highlighted in amber. Physical prop: printed SIS certification document in filing cabinet showing the certified baseline values.

---

### Element: Phone — Tom Hadley (CastleTech SOC)

**Type**: NPC — phone (non-visual, audio-only)
**Location**: SCADA Control Room duty desk
**Initial state**: Available to call at any time
**How players interact**: Players pick up the phone and select "Call CastleTech SOC" — activates Ink dialogue with Tom Hadley
**State changes**: Tom's information evolves based on game state — he has no OT visibility and can only confirm enterprise IT status; he becomes more alarmed as players share findings
**Teaching purpose**: Detection blind spot — SOC monitoring scope excluded OT systems. Illustrates the consequence of `CLAIM-EN-010`'s dependency on OT monitoring coverage.
**Physical implementation note**: Physical desk phone. Call connects to a voice/text NPC dialogue via the platform's phone NPC type.

---

### Element: RFID Plant Room Access Panel

**Type**: RFID lock
**Location**: SCADA Control Room → Battery Hall 1 door
**Initial state**: Locked; Priya holds the plant room RFID badge
**How players interact**: Priya accompanies players to Battery Hall 1 during the walkdown — she taps the badge to unlock. Badge can be carried by any player after this point.
**State changes**: Unlocks permanently once Priya opens it during the walkdown objective
**Teaching purpose**: Physical access control — the battery halls are restricted; the RFID badge progression represents the zoning between IT-side and physical plant
**Physical implementation note**: Standard RFID reader with physical badge prop (Albion site badge visual). Priya NPC holds the prop badge as an inventory item that transfers to players.

---

### Element: Engineering Workshop RFID Lock

**Type**: RFID lock
**Location**: SCADA Control Room → Engineering Workshop door
**Initial state**: Locked; RFID key in the duty officer desk drawer (discovered during scene-setting)
**How players interact**: Find the engineering workstation RFID key in the desk drawer (triggered by searching the duty officer desk object). Use it on the workshop door.
**State changes**: Unlocks engineering workshop room
**Teaching purpose**: Layered access control — the engineering workstation that has live OT access is behind a second access control layer
**Physical implementation note**: Standard RFID reader. Key prop in locked desk drawer (combination revealed in Priya's dialogue or on a note in the Incident Response folder).

---

### Element: NIS Notification Form (Physical Prop)

**Type**: Physical document prop
**Location**: Incident Response Folder — SCADA Control Room
**Initial state**: Blank form — players must decide whether and when to complete it
**How players interact**: Review the form; trigger NPC Marcus Webb dialogue about NIS Regulations obligations; complete as part of NCSC notification objective
**State changes**: When `ncsc_notified = true`: Form submitted; closing debrief NPC acknowledges timely notification
**Teaching purpose**: NIS Regulations 2018 — 72-hour notification obligation for network and information systems incidents affecting essential services. Cross-sector dependency — does the Trent Water compromise trigger a separate notification?
**Physical implementation note**: Printed A4 form (Albion incident report template). Players fill in key fields and submit to a designated in-game "submission" point (inbox tray or sealed envelope slot).

---

### Element: Post-Incident Debrief Terminal

**Type**: NPC station
**Location**: SCADA Control Room (or separate Debrief Room if space allows)
**Initial state**: Inactive until `facility_safe_state = true` (ESD pressed, jump server isolated, NCSC notification made)
**How players interact**: Access the debrief NPC (Dr Nalini Bashir, NCSC / HSE Senior Inspector) to conduct a structured post-incident review
**State changes**: Triggers closing debrief sequence; reviews player decisions against safety claims
**Teaching purpose**: Closing synthesis — Dr Bashir reviews CLAIM-EN-001 through CLAIM-EN-008 against player decisions, surfacing which claims held, which were invalidated, and what the SIS patch decision means for future safety case validity
**Physical implementation note**: Dedicated workstation with NPC dialogue interface. Could alternatively be a facilitated NPC with a physical printed report form that players complete.

---

## Section 3: State Machine

### Global Variables

```
network_isolated: boolean
Initial: false
Represents: Whether the enterprise-to-SCADA network connections have been physically severed (jump server cable removed and CastleTech firewall rules applied)

esd_activated: boolean
Initial: false
Represents: Whether the hardwired ESD pushbutton for Racks A1–A4 has been physically pressed

jump_server_confirmed: boolean
Initial: false
Represents: Whether the player has identified the active contractor RDP session (c.ellison) on the jump server access logs

sis_tamper_confirmed: boolean
Initial: false
Represents: Whether the player has discovered that the SIS thermal runaway threshold has been raised from 55°C to 85°C

anomaly_detected: boolean
Initial: false
Represents: Whether the player has recognised the HMI vs. analog gauge discrepancy (triggered by entering Battery Hall 1 after Priya's walkdown dialogue)

historian_reviewed: boolean
Initial: false
Represents: Whether the player has reviewed historian trend data and identified the flat-line temperature anomaly

marcus_webb_contacted: boolean
Initial: false
Represents: Whether the player has called Marcus Webb to report the anomaly and received his instruction to initiate ESD

ncsc_notified: boolean
Initial: false
Represents: Whether the NIS Regulations notification has been made (72-hour clock)

trent_water_notified: boolean
Initial: false
Represents: Whether Trent Water Services has been notified of the shared file server compromise (optional objective)

facility_safe_state: boolean
Initial: false
Represents: Whether the immediate safety emergency has been resolved — requires esd_activated AND (jump_server_confirmed OR network_isolated)

en001_claim_assessed: boolean
Initial: false
Represents: Whether the player has reviewed CLAIM-EN-001 (IT/OT boundary) with Marcus Webb NPC before making the network isolation decision

en002_claim_assessed: boolean
Initial: false
Represents: Whether the player has reviewed CLAIM-EN-002 (SIS network isolation) with Priya Chandra NPC after discovering the SIS tamper

en005_claim_assessed: boolean
Initial: false
Represents: Whether the player has engaged with the SIS patch dilemma (CLAIM-EN-005 vs. CLAIM-EN-006) during the debrief

patch_decision: enum {null, active_management, deferral}
Initial: null
Represents: Whether the player has chosen to recommend active patch management (CLAIM-EN-005) or ongoing deferral with compensating controls (CLAIM-EN-006) during the debrief

debrief_complete: boolean
Initial: false
Represents: Whether the post-incident debrief with Dr Nalini Bashir has been completed

cell_temperature_status: enum {ELEVATED, CRITICAL, STABILISING}
Initial: ELEVATED
Represents: Actual (not falsified) cell temperature state — drives time pressure

historian_flatline_found: boolean
Initial: false
Represents: Whether the player identified the zero-variance historian trend as an IoC
```

---

### Event Triggers

```
TRIGGER: Player completes Battery Hall 1 walkdown (enters room after Priya's walkdown prompt)
CAUSES: anomaly_detected = true
PHYSICAL: Analog thermometer visible (51°C). Battery hall ambient audio changes (cooling fans audibly strained). Priya dialogue activates — she notices the discrepancy.
NPC: Priya says "That thermometer reads fifty-one degrees. The HMI says twenty-eight. Those cannot both be correct."
TEACHES: Independent instrumentation as safety-critical cross-reference; digital falsification vs. physical truth

TRIGGER: Player reads SIS configuration panel / completes HMI-ENG-02 SIS audit task
CAUSES: sis_tamper_confirmed = true
PHYSICAL: Alarm panel SIS SETPOINT DEVIATION lamp illuminates (red)
NPC: Priya says "Someone raised the thermal runaway threshold to eighty-five. The SIS won't trigger until the cells are in irreversible failure."
TEACHES: SIS compromise via network-reachable engineering port; CLAIM-EN-002 failure mode

TRIGGER: Player identifies c.ellison RDP session on HMI-ENG-02 access logs
CAUSES: jump_server_confirmed = true
PHYSICAL: Amber LED blinking rate increases on jump server rack; Marcus Webb can now be called for confirmed attacker guidance
NPC: Marcus Webb (when called): "c.ellison? That account belongs to a contractor who left eight months ago. Someone is in the SCADA network right now."
TEACHES: Dormant account exploitation; inadequate deprovisioning; jump server as IT/OT boundary weakness

TRIGGER: Player presses hardwired ESD pushbutton in Battery Hall 1
CAUSES: esd_activated = true
PHYSICAL: Alarm panel RACKS A1–A4 ISOLATED lamps illuminate (amber); cooling fan audio increases to maximum; battery rack status panels show ISOLATED — COOLING ACTIVE; green confirmation light on ESD panel illuminates
NPC: Priya (radio): "ESD activated. Racks A1 through A4 are offline. Temperatures should stabilise over the next twenty minutes."
TEACHES: Hardwired ESD as cyber-independent safety boundary; CLAIM-EN-008; the ultimate layer of defence in depth

TRIGGER: Player physically removes jump server Ethernet cable
CAUSES: jump_server_isolated = true; if network_isolated not yet true, this partially satisfies the isolation objective
PHYSICAL: Jump server rack amber LED extinguishes; control room display shows JUMP SERVER — DISCONNECTED
NPC: Marcus Webb (phone): "Good. That kills the RDP pathway. But they may have a secondary channel — I saw Modbus traffic from the historian server last week."
TEACHES: Network isolation as an active decision; secondary attacker pathways; defence must be comprehensive

TRIGGER: Both esd_activated AND jump_server_confirmed are true
CAUSES: facility_safe_state = true
PHYSICAL: Overall alarm panel transitions from red/amber to amber/green. A "SAFE STATE ACHIEVED" banner appears on the facility status board.
NPC: Dr Nalini Bashir NPC station becomes active; debrief sequence unlocks
TEACHES: Recovery milestone; what constitutes a "safe state" in an OT incident vs. full resolution

TRIGGER: Time elapsed > 22 minutes without anomaly_detected = true
CAUSES: cell_temperature_status = CRITICAL
PHYSICAL: Battery Hall 1 hydrogen gas detector panel alarm illuminates; control room alarm panel gains new red lamp "H₂ GAS ADVISORY"
NPC: Priya (alarmed): "That hydrogen detector in Hall 1 just tripped. We're at 0.9% and rising."
TEACHES: Consequence of delayed detection; cascading safety effects when cyber attack goes undetected

TRIGGER: Time elapsed > 40 minutes without esd_activated = true
CAUSES: cell_temperature_status transitions to degraded state; thermal runaway imminent
PHYSICAL: Red rotating beacon light activates in Battery Hall 1; evacuation tone
NPC: Priya (urgent): "We have to evacuate. The cells are approaching runaway. Press the ESD — now."
TEACHES: Physical safety consequence is not infinitely deferred; the scenario has a hard failure state
```

### Losing/Degraded States

- **Thermal runaway onset** (if ESD not pressed within ~45 minutes): Scenario transitions to a "partial failure" outcome — the NCSC debrief confirms cell damage and facility evacuation. Players are not prevented from completing the debrief, but the consequences review reflects the delayed action. The specific teaching point: the hardwired ESD was always available; the cost was grid contract penalties (financial), not lives — but it was a near miss.
- **Network isolation too late** (if jump server not isolated and `cell_temperature_status = CRITICAL` before isolation): The historian Modbus proxy was used as a secondary channel; the attacker attempted to override the ESD signal (though the hardwired circuit held). Additional consequence in debrief.

### Winning/Completing States

Optimal outcome (all objectives met, all claims assessed):
- ESD pressed before `cell_temperature_status = CRITICAL`
- Jump server isolated within 5 minutes of `marcus_webb_contacted`
- NCSC notified within the play session (before facilitator declares time)
- Trent Water notified (optional)
- All three SIS claims (EN-001, EN-002, EN-005 or EN-006) reviewed with NPCs
- Debrief completed with Dr Nalini Bashir

Players see: Debrief NPC delivers a "strong response" closing statement. Alarm panel all-green. Cell temperature trends show stabilisation on HMI.

---

## Section 4: NPC Design

---

### NPC: Priya Chandra (SCADA Engineer)

**Appearance location**: SCADA Control Room on entry; accompanies players to Battery Hall 1 for walkdown; returns to control room; available for consultation throughout
**Background**: Senior control systems engineer, responsible for PLC programming and HMI configuration. She holds the plant room RFID badge. She is one of two people authorised to make PLC changes. She arrived early for a scheduled maintenance window — her presence is the reason the anomaly is detected before catastrophe.
**Initial stance**: Focused on her scheduled maintenance task (PLC-GRID firmware review). Willing to brief players but initially not alarmed — she assumes the readings are fine.
**Key information she holds**:
- Location of the plant room RFID badge (she carries it)
- Knowledge of normal battery temperature behaviour (knows the historian trend is implausible)
- Understanding of the hardwired ESD (she knows where it is and how to use it)
- SIS operating principles — she can explain what the tampered threshold means
**Dialogue branches**:
1. **Initial brief** (always): Explains the facility, introduces the scheduled maintenance window, offers to do the walkdown of Battery Hall 1 — triggers the anomaly detection sequence
2. **Anomaly confronted** (after entering Battery Hall 1): Compares HMI reading (28°C) vs. analog thermometer (51°C); expresses concern; tells players to contact Marcus Webb
3. **SIS tamper discovered** (after `sis_tamper_confirmed`): Explains IEC 61511 implications — "The SIS is supposed to be independent. But if someone can reach its engineering port from the SCADA network, independence is a fiction."
4. **ESD discussion** (if player asks about emergency shutdown): "The hardwired ESD is independent of everything. It doesn't care what the SCADA server says. That's the one system in this building that cannot be hacked."
5. **Post-ESD** (if ESD pressed): Monitors cooling; provides temperature stabilisation updates; transitions to debrief mode
**How she reacts to state changes**:
- `sis_tamper_confirmed`: Priya's dialogue tone shifts — she becomes more urgent, focusses on what the SIS failure means for the thermal hazard
- `esd_activated`: Relief mixed with exhaustion. Begins thinking about what comes next — SIS recertification, PLC logic verification.
**SIS teaching purpose**: The practitioner who understands the system intimately — she represents the safety engineer perspective. Her conflict is between trusting a digital system she built and acting on an analog gauge reading that contradicts it.

---

### NPC: Marcus Webb (OT Security Manager)

**Appearance location**: Phone NPC (SCADA Control Room duty desk); can also appear in Engineering Workshop if players are there when they call
**Background**: OT Security Manager. He has flagged the IT/OT boundary weakness twice in quarterly risk reports. He is at home when Priya calls at 06:28; he remotely reviews the jump server logs and directs Priya to initiate the ESD. He is technically sharp but frustrated — he knows what the vulnerabilities were, and he knows they were ignored.
**Initial stance**: Trusts the players to gather evidence; becomes more direct and authoritative as the picture clarifies
**Key information he holds**:
- How to interpret jump server access logs; what the contractor RDP session means
- The decision framework for network isolation — and why it's not straightforward (secondary SCADA control implications)
- CLAIM-EN-001 (IT/OT boundary) — he can explain why the claim is currently invalidated
- NIS Regulations notification obligation — he knows the 72-hour clock is running
**Dialogue branches**:
1. **Initial call** (before any discovery): "What have you got? Tell me what the HMI is showing." — gathers player's current information
2. **On RDP session identified** (`jump_server_confirmed`): Confirms attacker identity; instructs players to check the SIS configuration; emphasises the need for ESD before isolation
3. **Network isolation decision**: "Here's the problem. If I kill the SCADA connection now, we lose automated control of Racks B1 through C4 as well. If any of those racks develop an issue, the control system can't respond. Do you want me to hold while you check the status?" — presents the core isolation trade-off
4. **On CLAIM-EN-001** (if player asks): "I've written this up twice. The jump server shouldn't permit bidirectional RDP. The historian shouldn't be dual-homed. These were 'temporary' measures from the commissioning period. Nothing is more permanent than a temporary fix."
5. **Post-isolation**: Contacts CastleTech (Tom Hadley) to initiate major incident protocol; guides NCSC notification process
**How he reacts to state changes**:
- `esd_activated`: "Good. That's the right call. The hardwired system can't be reached over the network. Now let's isolate the rest."
- `network_isolated` before `esd_activated`: "Wait — you isolated before pressing the ESD? If the SCADA can't reach those racks any more, and the SIS is compromised, the only safety function left is the hardwired ESD. Someone needs to be in Battery Hall 1."
**SIS teaching purpose**: Security-response perspective; the IT/OT boundary architect who understands the attack surface he was unable to get budget to fix. Represents the operational security trade-off — he wanted to fix this, but the organisation accepted the risk (and paid the consequence).

---

### NPC: Tom Hadley (CastleTech SOC Analyst — Phone)

**Appearance location**: Phone-only NPC (SCADA Control Room)
**Background**: SOC Analyst at CastleTech Solutions, the managed IT service provider. He monitors the enterprise IT environment for both Albion and Trent Water from a remote SOC. His contract explicitly excludes OT systems — he has never seen the jump server logs, never monitored SCADA traffic. He is competent but operating blind in this incident.
**Initial stance**: Helpful but limited — he can confirm enterprise IT status but has no view into the OT network
**Key information he holds**:
- Enterprise IT network status (can confirm the domain controller shows no active alerts — the attacker's implant blends in)
- Shared file server status (can flag that Trent Water workstations have accessed it recently — potential lateral movement)
- The SOC monitoring scope limitation — he must acknowledge this directly if players push
**Dialogue branches**:
1. **First call** (any time): "CastleTech SOC, Tom speaking. Everything looks quiet from our end — no alerts in the last twelve hours." — represents the IT-side blind spot
2. **On OT question**: "I don't have visibility into the SCADA zone. Our contract covers enterprise IT only. I can see the jump server on the edge, but I'm not monitoring its session logs."
3. **On Trent Water**: "Actually — I can see both Albion and Trent Water share the file server. There's been some unusual access from a Trent Water workstation this week. I'll pull the logs."
4. **Major incident activation** (after `network_isolated`): Initiates CastleTech major incident protocol; coordinates enterprise-side isolation
**SIS teaching purpose**: The detection blind spot. SOC monitoring scope is a governance decision with direct safety consequences. Illustrates why `CLAIM-EN-010` depends on OT-inclusive monitoring.

---

### NPC: Dr Nalini Bashir (NCSC / HSE Senior Inspector — Debrief)

**Appearance location**: SCADA Control Room debrief station (active when `facility_safe_state = true`)
**Background**: Senior Inspector, joint NCSC/HSE ICS Security team. She is conducting the post-incident review under the NIS Regulations 2018 framework and in coordination with the HSE's COMAH inspection team (Control of Major Accident Hazards — relevant to battery hall thermal runaway risk).
**Initial stance**: Methodical, non-judgmental, focused on systemic learning. She is not here to assign blame — but she will not shy away from identifying where the system failed.
**Key information she holds**:
- The structured review of each safety claim (EN-001 through EN-008)
- The SIS patch dilemma framing — she will present both CLAIM-EN-005 and CLAIM-EN-006 and ask the player to choose
- The root cause synthesis — she names "normalisation of deviance" (known risks accepted without remediation until a failure occurred)
**Dialogue branches**:
1. **Root cause** (always): Reviews the initial access vector (printer supply chain) and pivot pathway (jump server, historian)
2. **SIS independence** (`en002_claim_assessed` weighted): Asks how the SIS was compromised — expecting the player to identify that the SIS engineering port was reachable from the SCADA network
3. **Patch dilemma** (`en005_claim_assessed`): Presents the active management vs. deferral options; requires player to articulate compensating controls for their chosen path; sets `patch_decision`
4. **NIS notification**: Confirms or notes the absence of timely NCSC notification
5. **Closing**: Synthesises the session's key lesson — "The hardwired ESD worked because it was designed to be independent. Every other safety layer was compromised because it wasn't. That's the lesson of this incident."
**SIS teaching purpose**: Closing synthesis and regulatory/compliance perspective. Forces players to engage with the structured safety claim framework, not just the immediate crisis response.

---

## Section 5: Objectives and Task Flow

---

### Objective 1: Understand the Facility State (Scene-Setting)
**Unlocks when**: Scenario start
**Player task**: Review the SCADA control room — talk to Priya Chandra, review the HMI-OPS-01 status display, locate the Incident Response folder
**Location**: SCADA Control Room
**Interactions required**: Priya NPC (initial briefing), HMI-OPS-01 terminal (review readings), Incident Response folder (read NIS notification requirements)
**Completion condition**: `priya_briefed = true` AND `hmi_reviewed = true`
**Consequence on completion**: Priya offers to do the Battery Hall 1 walkdown; plant room RFID badge available; Engineering Workshop RFID key location hinted
**Time pressure?**: None — this is orientation
**SIS concept illustrated**: The control room operator sees a normal-looking system state. This primes the contrast that follows — the digital system looks healthy but something is wrong.

---

### Objective 2: Conduct Battery Hall Walkdown (MANDATORY)
**Unlocks when**: Priya briefing complete
**Player task**: Accompany Priya to Battery Hall 1. Read the analog thermometer. Compare with HMI reading. Recognise the discrepancy.
**Location**: Battery Hall 1
**Interactions required**: Plant room RFID badge (Priya unlocks), analog thermometer (read), Priya NPC (walkdown dialogue)
**Completion condition**: `anomaly_detected = true`
**Consequence on completion**: Priya tells players to contact Marcus Webb; historian trend objective unlocks; Engineering Workshop objective unlocks
**Time pressure?**: Soft — cell temperature is rising; 22-minute mark triggers hydrogen advisory
**SIS concept illustrated**: Independent analog instrumentation as last-resort detection (CLAIM-EN-007). Digital sensor falsification vs. physical reality.

---

### Objective 3: Verify the Anomaly — Historian Trend (MANDATORY)
**Unlocks when**: `anomaly_detected = true`
**Player task**: Return to HMI-OPS-01 and review historian trend data for Battery Rack A1 temperature over the past 3 hours. Identify the implausible flat-line reading.
**Location**: SCADA Control Room
**Interactions required**: HMI-OPS-01 terminal (historian trend view)
**Completion condition**: `historian_flatline_found = true`
**Consequence on completion**: Priya confirms data corruption; Marcus Webb call becomes actionable with full evidence picture
**Time pressure?**: Same as Objective 2 — soft time pressure
**SIS concept illustrated**: Historian data as anomaly detection tool — rate-of-change analysis; flat sensor readings as IoC.

---

### Objective 4: Contact Marcus Webb and Confirm Intrusion (MANDATORY)
**Unlocks when**: `historian_flatline_found = true` OR `anomaly_detected = true` (player can call Marcus early)
**Player task**: Call Marcus Webb on the duty phone. Report findings. Follow his guidance to investigate the jump server logs on HMI-ENG-02.
**Location**: SCADA Control Room (phone) → Engineering Workshop (access log investigation)
**Interactions required**: Duty phone (Marcus Webb NPC), Engineering Workshop RFID key (find in desk drawer), HMI-ENG-02 terminal (access log analysis — identify `c.ellison` contractor RDP session)
**Completion condition**: `jump_server_confirmed = true` AND `marcus_webb_contacted = true`
**Consequence on completion**: Marcus instructs ESD initiation; network isolation decision presented; SIS tamper investigation objective unlocks
**Time pressure?**: Moderate — Marcus reinforces urgency; 22-minute time trigger pending
**SIS concept illustrated**: Jump server as IT/OT boundary weakness; dormant contractor account exploitation; CLAIM-EN-001 failure mode.

---

### Objective 5: Initiate Emergency Shutdown — ESD (MANDATORY, TIME-CRITICAL)
**Unlocks when**: `marcus_webb_contacted = true`
**Player task**: Return to Battery Hall 1. Locate the hardwired ESD pushbutton on the wall near Rack A2. Flip the guard and press the button.
**Location**: Battery Hall 1 (physical)
**Interactions required**: Plant room RFID badge (to re-enter), hardwired ESD pushbutton (physical press)
**Completion condition**: `esd_activated = true`
**Consequence on completion**: Rack A1–A4 isolated; alarm panel updates; thermal runaway risk recedes; network isolation decision unlocks
**Time pressure?**: HIGH — this is the primary time-critical action; cell temperature escalates if delayed
**SIS concept illustrated**: Hardwired ESD as cyber-independent safety boundary (CLAIM-EN-008). The pushbutton that cannot be hacked. Defence in depth — last resort physical safety barrier.

---

### Objective 6: Isolate the Network (MANDATORY)
**Unlocks when**: `marcus_webb_contacted = true` (can run in parallel with ESD, but Marcus emphasises ESD first)
**Player task**: Return to Engineering Workshop. Physically remove the jump server Ethernet cable. Then call Tom Hadley at CastleTech to isolate enterprise network connections.
**Location**: Engineering Workshop
**Interactions required**: Engineering Workshop RFID key, jump server rack Ethernet cable (physical removal), duty phone (Tom Hadley NPC)
**Completion condition**: `jump_server_isolated = true` AND `castletech_contacted = true`
**Consequence on completion**: `network_isolated = true`; attacker ejected from primary pathway; Marcus warns of historian secondary channel; facility_safe_state evaluation begins
**Time pressure?**: Moderate — should happen promptly after ESD, but less critical than the ESD itself
**SIS concept illustrated**: Network isolation as incident containment decision; the trade-off between stopping the attacker and losing automated control (CLAIM-EN-010). The secondary pathway (historian proxy) illustrates the need for comprehensive isolation, not just point isolation.

---

### Objective 7: Investigate the SIS Compromise (MANDATORY)
**Unlocks when**: `jump_server_confirmed = true`
**Player task**: Access the SIS configuration panel in the Engineering Workshop. Identify that the thermal runaway threshold has been raised. Compare against the certified baseline document in the filing cabinet.
**Location**: Engineering Workshop
**Interactions required**: SIS configuration panel (read threshold — 85°C), filing cabinet (find SIS certification document showing certified baseline 55°C)
**Completion condition**: `sis_tamper_confirmed = true` AND `en002_claim_assessed = true`
**Consequence on completion**: Priya explains IEC 61511 implications; alarm panel SIS lamp illuminates; patch dilemma objective unlocks for debrief; `cell_temperature_status` consequence highlighted
**Time pressure?**: None — important but not time-critical once ESD is pressed
**SIS concept illustrated**: SIS engineering port reachable from SCADA network — CLAIM-EN-002 failure mode. The SIS was supposed to be independent; network architecture violated that independence. Unpatched vulnerability enabled threshold manipulation without authentication or logging.

---

### Objective 8: Make the NCSC Notification (MANDATORY)
**Unlocks when**: `facility_safe_state = true`
**Player task**: Complete the NIS Regulations incident notification form from the Incident Response folder. Marcus Webb confirms the notification obligation and timing. Submit the form.
**Location**: SCADA Control Room
**Interactions required**: NIS Notification Form (physical prop), Marcus Webb NPC (confirms obligation and timing)
**Completion condition**: `ncsc_notified = true`
**Consequence on completion**: Dr Nalini Bashir acknowledges timely notification in debrief; failure to notify before end of session results in negative debrief consequence
**Time pressure?**: Soft — facilitator clock; no hard in-game timer, but debrief NPC notes lateness if delayed
**SIS concept illustrated**: NIS Regulations 2018 — 72-hour notification for essential service operators. Governance obligation alongside the operational response.

---

### Objective 9: Notify Trent Water Services (OPTIONAL)
**Unlocks when**: `historian_flatline_found = true` (Tom Hadley mentions Trent Water file server access)
**Player task**: Contact Trent Water Services via a phone in the control room to warn them of the potential shared file server compromise.
**Location**: SCADA Control Room
**Interactions required**: Second phone (Trent Water contact in Incident Response folder), Tom Hadley NPC (confirms cross-sector dependency)
**Completion condition**: `trent_water_notified = true`
**Consequence on completion**: Positive note in debrief — cross-sector dependency management; Dr Bashir references CLAIM-EN-011
**Time pressure?**: None
**SIS concept illustrated**: Cross-sector dependency and cascading safety failure risk (CLAIM-EN-011). Shared infrastructure with Trent Water (water pumping SCADA) creates a cross-sector pathway that was never formally risk-assessed.

---

### Objective 10: Complete Post-Incident Debrief (MANDATORY)
**Unlocks when**: `facility_safe_state = true`
**Player task**: Engage with Dr Nalini Bashir (NCSC/HSE debrief NPC). Cover: root cause analysis, SIS claim review (EN-001, EN-002), the SIS patch dilemma (EN-005 or EN-006), and any outstanding governance decisions.
**Location**: SCADA Control Room debrief station
**Interactions required**: Dr Nalini Bashir NPC — all four debrief topics
**Completion condition**: `debrief_complete = true` AND `patch_decision ≠ null`
**Consequence on completion**: Scenario closes with differentiated outcome summary based on player decisions
**Time pressure?**: None — the debrief is reflective, not time-pressured
**SIS concept illustrated**: Structured safety case review; normalisation of deviance; patching constraint tension; the difference between a living safety case and a compliance artefact.

---

## Section 6: SIS Teaching Moment Mapping

| Game Event | SIS Concept | CyBOK SIS TG Topic | Learning Outcome |
|------------|-------------|---------------------|------------------|
| HMI shows 28°C; analog thermometer shows 51°C — player must decide which to trust | Cyber-induced sensor falsification creates a physical safety hazard invisible to digital monitoring | Language & Concepts | Players understand that a compromised digital sensor system can conceal a dangerous physical condition; independent instrumentation is a safety-critical last resort |
| Historian trend shows flat-line temperature reading for 3 hours with zero variance | Anomaly detection using process model cross-validation; behavioural IoC identification | Incident Response / Monitoring | Players can identify implausible sensor behaviour as a cyber attack indicator even without direct network evidence |
| SIS threshold discovered raised from 55°C to 85°C — safety automation silently disabled | SIS independence violated by network-reachable engineering port; CLAIM-EN-002 failure | Architecture | Players understand why IEC 61511 requires SIS to be physically and logically separate from the control system — and what happens when that separation is violated |
| Hardwired ESD pushbutton — the one control that cannot be hacked | Defence in depth; independent physical safety layer; CLAIM-EN-008 | Architecture | Players experience that hardwired electrical interlocks provide a cyber-independent ultimate safety boundary; network attacks cannot disable a circuit-breaker |
| Network isolation decision — stop attacker vs. lose automated control of unaffected racks | Containment actions can create new safety hazards; OT-specific incident response planning; CLAIM-EN-010 | Incident Response | Players feel the genuine tension between stopping a cyber attack and maintaining safety-critical automated control; understand why OT incident response cannot simply copy IT playbooks |
| SIS patch available for 18 months, deferred due to IEC 61511 recertification cost | Patching constraint in safety-certified systems; risk of indefinite deferral vs. managed transition; CLAIM-EN-005 vs. CLAIM-EN-006 | Patching and Security Updates | Players engage with the specific dilemma: applying the SIS firmware patch requires 8 weeks offline + £180,000 recertification, but indefinite deferral left the vulnerability open — and was exploited |
| Jump server identified as entry path — IT/OT boundary misconfigured | IT/OT boundary architecture; defence in depth; CLAIM-EN-001 | Architecture | Players understand how a "temporary" commissioning configuration (bidirectional RDP on DMZ jump server) became a permanent attack pathway; configuration management in ICS environments |
| Tom Hadley (CastleTech SOC) has no visibility into OT — a detection blind spot | Security monitoring scope as a governance decision with safety implications; CLAIM-EN-010 dependency | Organisational Culture | Players understand that a SOC contract that excludes OT is not just a security gap — it is a safety governance gap when IT and OT are connected |
| Trent Water cross-sector dependency — shared file server lateral movement | Cross-sector cascade risk; CLAIM-EN-011 | Requirements Reconciliation | Players recognise that shared infrastructure between critical sectors (energy, water) creates unassessed safety-relevant cross-dependencies |
| Dr Bashir's debrief: "Someone raised the SIS threshold. This was in the risk register as a known vulnerability. Why wasn't it fixed?" | Normalisation of deviance — risk accepted without remediation until failure | Organisational Culture | Players confront the organisational failure mode where known risks are documented but not acted upon; safety case as a living document vs. compliance artefact |

### Learning Journey — Narrative Summary

A player completing the Albion Battery Hall scenario begins as a responder arriving at what appears to be a normally operating facility. Within fifteen minutes they discover that everything they can see on the digital displays is false — a cyber attack has constructed a reassuring fiction that masks an imminent physical catastrophe. The central lesson the scenario delivers is that security-informed safety is not about adding a cyber risk register to a safety manual. It is about understanding that when security controls fail, they can directly undermine the functional safety systems that prevent physical harm.

The analog thermometer in Battery Hall 1 is the most important object in the scenario — not because it is sophisticated, but because it is simple. It reads 51°C because it cannot be hacked. Players who find that thermometer and act on it demonstrate the most fundamental SIS insight: independent physical instrumentation provides safety assurance precisely because it is independent. The more sophisticated the digital system, the more important the analog backstop.

By the end of the scenario, a player should understand three things they likely did not at the start. First, that a cyber attack on a safety system is not the same as a cyber attack on a business system — the consequence is not data loss or downtime, it is thermal runaway and toxic gas release. Second, that network architecture decisions made during a commissioning project (a dual-homed historian, a bidirectional jump server) become permanent safety vulnerabilities if they are never revisited. Third, that the decision to defer a safety system firmware patch is a risk management choice with a definite cost — and when that cost is eventually paid, it is paid in a battery hall at six in the morning.

---

## Output Checklist Verification

- [x] At least one RFID/physical lock mechanic: plant room RFID badge; engineering workshop RFID key
- [x] At least one PC/VM terminal challenge: HMI-OPS-01 (historian trend), HMI-ENG-02 (access log analysis, SIS configuration audit)
- [x] At least one physical alarm or gauge that changes state: multi-lamp alarm panel (control room), analog thermometer (battery hall), SIS configuration panel
- [x] At least one NPC dialogue tree with genuine branching based on player choice: all four NPCs have branching dialogue based on global variable state
- [x] At least two distinct SIS trade-off decisions: (1) trust HMI vs. analog gauge / initiate ESD; (2) SIS patch active management vs. deferral (debrief decision)
- [x] Patching constraint tension explicitly represented: SIS firmware patch dilemma is a primary debrief topic (CLAIM-EN-005 vs. CLAIM-EN-006)
- [x] Scenario completable in 45-75 minutes: core mandatory path (Objectives 1–8, 10) estimated at 55–65 minutes; Objective 9 (Trent Water) adds ~10 minutes optional
- [x] SIS teaching moment map covers at least 8 distinct learning outcomes: 10 rows mapped
