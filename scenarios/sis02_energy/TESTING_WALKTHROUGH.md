# Testing Walkthrough — Case 2: Albion Battery Hall Crisis
**Scenario**: `scenarios/sis02_energy/scenario.json.erb`  
**Last updated**: April 2026

This document describes what a player does to complete the scenario from start to finish, step by step. It is a combined player guide and tester's checklist. Each step notes what global variable changes to expect and which tasks/aims should complete.

For known gaps, placeholder substitutions, and development status, see [TODO.md](./TODO.md).

---

## Before You Start

### Prerequisites
- Scenario validator passes: `ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb`
- All four ink files compiled: `npc_helen_marsh.json`, `npc_marcus_webb.json`, `npc_tom_hadley.json`, `npc_priya_sharma.json` present in `ink/`
- ✅ MG-VM01 ScadaHistorianMinigame — `historian_trend_viewer` sub-object inside `hmi_ops_01` (`type: scada_historian`, `minigameId: scada-historian`); `completionActions` fire directly; **no flag station**
- ✅ MG-VM02 LogFilterMinigame — `hmi_eng_02` (`type: log_filter_terminal`, `minigameId: log-filter`); `completionActions` fire directly; **no flag station**; `requireAllTabs: true` (player must view SIS audit tab)

### Start Room
`scada_control_room` — Helen Marsh and the SCADA workstations. No objectives are active except Aim 1.

### The Phone
The player has a **Albion Site Phone** in their inventory from scenario start. It connects to Marcus Webb and Tom Hadley. The phone is the main mechanism for both phone NPCs.

---

## Aim 1 — Understand the Facility State

**Objective**: Get a briefing from Helen, review HMI-OPS-01, read the Incident Response folder.

### Step 1 — Receive Helen's Arrival Briefing (automatic)

On scenario load, a `timedConversation` fires immediately for `priya_chandra` (delay: 0, waitForEvent: `game_loaded`). Helen gives an automatic four-line briefing describing the uneventful handover notes and her unease.

**Verify:**
- Cutscene triggers automatically on room load — no player action needed
- `briefing_played` = `true` (set at start of `arrival_briefing` knot, prevents replay on resume)
- `helen_briefed` = `true` (set at end of `arrival_briefing` knot)
- Aim 1 (`assess_control_room`) unlocks: `conduct_walkdown` aim becomes `active` via Helen's `helen_briefed` eventMapping
- Task `check_hmi_readings` marked complete (same eventMapping)

> **If the cutscene does not fire:** Check `timedConversation.waitForEvent: "game_loaded"` in scenario JSON and confirm the engine fires `game_loaded` event. Check `skipIfGlobal: briefing_played` — if this is a resumed session, briefing is correctly skipped.

### Step 2 — Talk to Helen Marsh (optional depth)

Walk up to Helen and interact. She offers four topics in the briefing hub:
- **Tell me about the facility** — explains 220 MWh, SCADA, SIS
- **What does the HMI show?** — notes the suspiciously flat 28°C readings
- **How do we get into the battery halls?** — tells player about the badge and workshop key
- **Let's do the Battery Hall walkdown now** — fast-paths to the walkdown offer

**Verify**: All choices return to hub. No global variables change here. Exit via "Nothing right now" → `#exit_conversation`.

### Step 3 — Read HMI-OPS-01 Workstation

Interact with the `hmi_ops_01` PC. It is password-locked.

**Password**: Randomised per session via ERB (`@random_password`). Read the sticky note on the desk (`showPostit: true`) to find the current session's password.

Inside the PC:
- **SCADA Live Status** text file: shows Battery Hall 1 at 28°C, all alarms green. Read it.
  - Sets `hmi_reviewed = true` (informational; not used in task logic)
- **Historian Trend Viewer** VM launcher: launches `albion_scada_historian` VM — *see Aim 3*.

**Verify**: `hmi_reviewed` = `true` after reading the Live Status file.

### Step 4 — Read the Incident Response Folder

Find the `incident_response_folder` (notes object, wall-mounted). Read it.

Contents: NIS Regulations 72-hour notification obligation, HSE COMAH requirements, Trent Water shared infrastructure contact.

**Verify**: `incident_folder_read` = `true` → eventMapping fires → task `read_incident_folder` marked complete.

### Step 5 — View the Facility Alarm Panel (optional but recommended)

Interact with the `alarm_panel` object in the SCADA Control Room. Opens the MG-03 AlarmPanelMinigame: a live SVG panel with 7 indicator lamps.

**Initial lamp state** (all globals false at start):
| Lamp | Initial state |
|------|--------------|
| BATTERY HALL 1 | GREEN — NORMAL |
| RACKS ISOLATED | OFF (—) |
| SIS STATUS | GREEN — WITHIN SETPOINTS |
| JUMP SERVER | GREEN — CONNECTED |
| NETWORK STATUS | GREEN — NORMAL |
| H₂ GAS | GREEN — NORMAL (3-state: NORMAL → ADVISORY → EVACUATE) |
| SAFE STATE | OFF (—) |

The alarm panel can be opened at any time to check the current facility state. As the scenario progresses, lamps change state in real-time as globals update.

**No global variable changes on interaction** — the alarm panel is a read-only status display.

### Step 5b — View the Network Architecture Diagram (optional)

Interact with `network_architecture_diagram` (`type: network_architecture`). Opens the MG-06 Purdue Model SVG minigame.

Shows: 6 Purdue levels, 25 nodes, 5 attack paths with marching-ant animation. IT/OT boundary weaknesses (EN-001, EN-002, EN-011) are highlighted.

**Verify**: `network_architecture_reviewed` = `true` on first open. (Informational — not tied to any task or aim unlock.)

> **Aim 1 does not auto-complete** — it has no single-variable completion trigger. The three tasks (`talk_to_helen`, `check_hmi_readings`, `read_incident_folder`) are each individually completable; the aim becomes satisfied when all are done.

---

## Aim 2 — Conduct Battery Hall Walkdown

**Objective**: Enter Battery Hall 1. Read the analog thermometer. Compare with HMI reading.

### Step 6 — Receive the Battery Hall Access Badge from Helen

Helen holds the `Battery Hall Access Badge` keycard in her `itemsHeld` list. It is transferred to the player's inventory via `#give_item:keycard` in the Ink dialogue:

- **Happy path**: Given automatically during the `arrival_briefing` timed cutscene (if `battery_hall_badge_collected` is still `false` at that point).
- **Fallback path**: If the player triggered the manual `start` knot before the cutscene completed, the badge is given in the `walkdown_offer` knot when Helen offers the Battery Hall walkdown.

**Verify**: `battery_hall_badge_collected` = `true` (set by `onPickup` on the badge item). Badge labelled *"Battery Hall Access Badge — Albion Energy — Restricted Area"* appears in inventory.

### Step 7 — Enter Battery Hall 1

Use the plant room badge on the north door RFID reader. Door unlocks.

**Verify**: `battery_hall_1` room is now accessible.

Task `enter_battery_hall` complete (type: `enter_room` — fires on room entry).

### Step 8 — Read the Analog Thermometer ⭐ (critical moment)

Find the `analog_thermometer` on the wall near Rack A2. Interact with it. Read the displayed text.

The thermometer reads **51°C**. The SCADA HMI shows 28°C. The text explicitly flags this as a physically independent, non-networkable reading.

Also present in the battery hall — read for atmosphere and teaching content:
- **Battery Rack Status Panels (Digital)**: all showing 28°C, all green — the falsified data
- **H₂ Gas Detector Panel**: reading 0.6% LEL (elevated advisory) — not connected to SCADA; reads truthfully

**Verify**:
- `anomaly_detected` = `true` (set by `onRead` on the thermometer)
- Helen's eventMapping fires 3 seconds later — **radio message**: *"That thermometer reads fifty-one degrees. The HMI says twenty-eight. Those cannot both be correct. Come back to the control room — I need to show you something on the historian."*
- Task `check_thermometer` complete (via same eventMapping: `completeTask: check_thermometer`)
- Aim 3 (`verify_anomaly`) unlocks
- **Alarm panel**: BATTERY HALL 1 lamp changes to AMBER — ANOMALY DETECTED

---

## Aim 3 — Verify the Anomaly — Historian Trend

**Objective**: Return to HMI-OPS-01. Review historian temperature trend. Submit the flat-line anomaly flag.

### Step 9 — Return to SCADA Control Room

Go south back to the control room.

### Step 10 — Open the Historian Trend Viewer Minigame ⭐

On HMI-OPS-01, open the **Historian Trend Viewer** (sub-object inside the PC, `type: scada_historian`, `minigameId: scada-historian`). This is a Phaser.js minigame — no external VM.

**What the minigame shows**: A 12-hour temperature trend graph for Battery Hall 1 Racks A1–A4. Normal racks show natural sinusoidal noise (±0.3–0.5°C around a ~30°C base). From injection timestamp `2025-01-16T23:12:07` onwards, **all four racks show a perfectly flat line at 28.0°C** — zero variance. Before that point, Rack A2 was climbing at ~0.18°C/min from 22:30 (reaching ~36°C at injection).

**Analysis tools in the minigame**:
- **Rate-of-change overlay** — enables temperature delta analysis; sets `rate_of_change_viewed` = `true` (`progressActions: overlay_enabled`)
- **Compare racks panel** — side-by-side rack comparison; sets `compare_racks_viewed` = `true` (`progressActions: compare_racks_opened`)

**Completion**: Progress through the analysis tools to identify and confirm the flat-line IoC. The minigame fires `completionActions` directly — **no flag station**.

**Verify**:
- `historian_flatline_found` = `true` (set by `completionActions: set_global`)
- Task `review_historian` complete (set by `completionActions: complete_task:review_historian`)
- Aim 4 (`contact_marcus_investigate`) unlocks (via Helen's eventMapping on `historian_flatline_found`)
- Helen sends radio message (2.5s delay): *"That flat-line is not a sensor fault — the data has been replaced. Call Marcus Webb now. He needs to know about the jump server access logs before we do anything else."*
- Tom Hadley eventMapping fires 6 seconds later — **timed message**: *"Everything is quiet from our end — no alerts in twelve hours. Actually — is the Albion shared file server normally accessed by Trent Water workstations? I'm seeing unusual access patterns in this week's logs."*
- Aim 9 (`trent_water_notification`) unlocks (optional objective revealed)

### Step 11 — Talk to Helen About the Historian (optional)

Return to Helen. New hub option available: **"Ask about the historian flat-line reading"**.

She explains: real sensor data has noise; a perfectly flat line for three hours means the data is synthetic; flat-line starts at 23:12 — seven hours without real monitoring.

---

## Aim 4 — Contact Marcus Webb and Investigate

**Objective**: Call Marcus Webb. Find the Engineering Workshop RFID key. Unlock the workshop. Identify the attacker RDP session on the jump server.

### Step 12 — Call Marcus Webb

Open the **Albion Site Phone** inventory item. Select **Marcus Webb**. This opens the `npc_marcus_webb` phone dialogue.

In `first_call_hub`, choose one of:
- *"The HMI readings look normal but the analog thermometer reads 51°C"* — triggers `initial_assessment`
- *"The historian trend for Rack A1 shows a flat line for three hours"* — also triggers `initial_assessment`

Marcus says to get into the Engineering Workshop and pull the jump server logs.

**Verify**:
- `marcus_webb_contacted` = `true` (set at end of `initial_assessment` knot)
- Marcus's eventMapping fires — **timed message** (2 second delay): *"You are authorised to initiate ESD now. There is no keypad on that unit — it is a hardwired safety pushbutton. Go to Battery Hall 1 and press it. Do NOT wait for SCADA confirmation — it cannot be trusted."*
- Aim 5 (`initiate_esd`) unlocks
- Aim 6 (`isolate_network`) unlocks
- Marcus's eventMapping fires — **timed message** (4.5 second delay): *"Two tracks in parallel. One: get to Battery Hall 1 and press the ESD. Two: physically pull the jump server Ethernet cable, then call Tom Hadley at CastleTech — he is the SOC contact for enterprise isolation. Do not wait for one to complete before starting the other."*

Task `call_marcus_initial` complete (type: `npc_conversation`).

### Step 13 — Find the Engineering Workshop RFID Key

Search the **Duty Officer Desk** (filing cabinet object, in scada_control_room). It is unlocked. Inside: the `Engineering Workshop RFID Key` keycard.

**Verify**: `workshop_key_collected` = `true`. Key in inventory.

Task `find_workshop_key` complete (type: `collect_items`, `workshop_key_group`).

### Step 14 — Unlock the Engineering Workshop

Use the Engineering Workshop RFID Key on the east door RFID reader.

**Verify**: `engineering_workshop` room accessible. Task `unlock_workshop` complete (type: `unlock_room`).

### Step 15 — Investigate the Jump Server

Enter the Engineering Workshop. Objects in this room:

**Read the Jump Server Rack** (servers object). Shows:
- Active RDP session: `c.ellison`, started 01:47, source IP `185.220.101.45` (Tor exit node)
- Account was deprovisioned 8 months ago

**Open HMI-ENG-02 Engineering Workstation** (`type: log_filter_terminal`, `minigameId: log-filter`). This is a Phaser.js minigame — no external VM.

**Main tab — Jump Server Access Log** (37 entries, 2025-01-10 to 2025-01-16): Normal sessions use internal IPs (10.4.22.x), all `CLOSED`. The anomalous entry:

| Field | Value |
|-------|-------|
| Timestamp | 2025-01-16 01:47 |
| Account | `c.ellison` |
| Source IP | `185.220.101.45` (Tor exit node — Frankfurt) |
| Duration | 04:46+ |
| Status | **ACTIVE** |
| Access Level | CONTRACTOR |

Threat intel lookup on the IP confirms: AS60729 Tor exit node, last flagged 2025-01-14 for credential stuffing. Account history shows `c.ellison` was **deprovisioned 2024-05-09** — dormant for 8 months.

**Second tab — SIS Engineering Audit** (`sis_audit`): Shows SIS engineering port commands during the c.ellison session (03:22): `WRITE_CONFIG THERMAL_RUNAWAY_T` 55°C → 85°C, and `WRITE_CONFIG SIS_HEARTBEAT_INTERVAL` 5s → 30s. Operator recorded as `c.ellison`, session `SID-7816-P`, no change approval recorded.

> **`requireAllTabs: true`**: The player must view **both** the main log tab and the SIS Engineering Audit tab before the completion action fires.

**Verify**:
- `sis_audit_reviewed` = `true` (set by `progressActions: tab_viewed:sis_audit`)
- `jump_server_threat_intel_viewed` = `true` (set by `progressActions: threat_intel_opened`)
- `jump_server_confirmed` = `true` (set by `completionActions: set_global` — **no flag station**)
- Task `identify_rdp_session` complete (set by `completionActions: complete_task:identify_rdp_session`)
- Aim 7 (`investigate_sis`) unlocks (via Helen's eventMapping on `jump_server_confirmed`)
- Helen sends radio message (2s delay): *"C. Ellison — that account was deprovisioned eight months ago. They used it to get into the SIS configuration port. While you are still in the workshop, open the SIS configuration panel and check the setpoints against the certification document in the filing cabinet."*

### Step 16 — Call Marcus Again (optional — important depth)

Phone Marcus. Hub options now include:
- **"I've identified a contractor RDP session — c.ellison — connected since 01:47"** — Marcus explains deprovisioning failure, gives ESD and cable instructions
- **"Tell me about the network isolation decision"** — Marcus explains surgical vs. full isolation, sequencing (ESD first, then cable, then CastleTech)
- **"Ask about CLAIM-EN-001 — the IT/OT boundary"** — Marcus explains the jump server history; sets `en001_claim_assessed = true`
- **"What should we do about the SIS patch?"** — available once `sis_tamper_confirmed` (Aim 7)

---

## Aim 5 — Initiate Emergency Shutdown — ESD

**Objective**: Return to Battery Hall 1. Press the hardwired ESD pushbutton.

### Step 17 — Return to Battery Hall 1

Go north from the control room.

### Step 18 — Press the ESD Pushbutton ⭐

Find the `esd_pushbutton` object (`interactionType: esd_button`). The interaction flows:
1. Player interacts with the object
2. Flip-up guard animation plays (flip the yellow guard)
3. Confirmation modal: *"EMERGENCY SHUTDOWN — RACKS A1–A4. This action is irreversible. Confirm?"*
4. Player confirms — ESD activates

**Verify**:
- `esd_activated` = `true` (set by the ESD minigame on confirm)
- Helen's eventMapping fires — **timed message** (2 second delay): *"ESD activated. Racks A1 through A4 are offline. Hardwired cooling is running at maximum. Temperatures should stabilise over the next twenty minutes."*
- Task `press_esd_button` complete (via Helen's `esd_activated` eventMapping: `completeTask: press_esd_button`)
- **Alarm panel**: RACKS ISOLATED lamp changes to GREEN — ESD ACTIVATED

> **Early ESD path**: If the player presses ESD *before* `historian_flatline_found = true`, `early_esd_activation` = `true` fires. Helen sends a radio message questioning the timing. ESD still activates — the scenario does not block it.

---

## Aim 6 — Isolate the Attacker

**Objective**: Pull the jump server Ethernet cable. Call Tom Hadley at CastleTech SOC to isolate enterprise connections.

These two tasks can be done in any order. Marcus's dialogue recommends cable first, then CastleTech.

### Step 19 — Pull the Jump Server Ethernet Cable

Return to the Engineering Workshop. Find the `jump_server_cable` (notes object). Read/interact with it — this represents physically disconnecting the cable.

The text describes the amber LED going dark and the RDP session terminating.

**Verify**:
- `jump_server_isolated` = `true` (set by `onRead`)
- Marcus eventMapping fires — **timed message** (1.5 second delay): *"Good — that kills the RDP pathway. But they may have a secondary channel via the historian Modbus proxy. Call Tom at CastleTech and get the enterprise side locked down."*
- Task `pull_ethernet_cable` complete (via Helen's eventMapping on `jump_server_isolated`)
- **Alarm panel**: JUMP SERVER lamp changes to AMBER — ISOLATED

> **Design note**: In the full implementation, the cable is behind a solenoid-locked panel revealed only when `jump_server_confirmed = true` (ENG-04). Currently the cable object is always accessible.

### Step 20 — Call Tom Hadley (CastleTech SOC)

Open the phone. Select **Tom Hadley**. First call hub:
- *"We think we have a serious incident — possible ICS compromise"* → Tom describes clean enterprise view, nothing in logs
- *"Can you check the jump server access logs?"* → Tom confirms c.ellison session (on edge of his scope); explains OT is out of contract
- *"I need you to lock down enterprise connections"* → goes to isolation request

**Isolation request** — Tom asks for authorisation. Choose:
- *"Marcus Webb — OT Security Manager — has authorised it"*, or
- *"I'm the incident commander — authorising on behalf of the site"*

Tom confirms: *"Firewall rules updating. Jump server VPN endpoint disabled. Enterprise-to-SCADA connectivity severed."*

Sets `castletech_contacted = true`.

**Verify**:
- `castletech_contacted` = `true` (set by `#set_global:castletech_contacted:true` in ink)
- Tom's eventMapping fires: `network_isolated` = `true` (set by `setGlobal` in Tom's eventMapping on `castletech_contacted`)
- Marcus eventMapping fires — **timed message** (1 second delay): *"Network isolation confirmed. CastleTech are on it. Now we need to understand what they actually changed in the SIS config."*
- Helen's `network_isolated` eventMapping fires: `facility_safe_state` = `true`, `priya_sharma_visible` = `true`
- Aim 8 (`ncsc_notification`) unlocks (via Helen's `network_isolated` eventMapping: `unlockAim: ncsc_notification`)
- Aim 10 (`post_incident_debrief`) unlocks (via Helen's `facility_safe_state` eventMapping: `unlockAim: post_incident_debrief`)
- Helen's `facility_safe_state` eventMapping fires — **timed message** (5 second delay): *"The facility is in safe state — ESD activated and enterprise isolation confirmed. Now the NIS notification. We are inside the 72-hour window but we need to file it now. The notification form is on the wall in the control room."*
- **Dr Priya Sharma NPC appears** in the SCADA Control Room (was `initiallyHidden`)
- Priya S. `debrief_intro` timedConversation fires automatically (via Priya S.'s `priya_sharma_visible` eventMapping)
- **Alarm panel**: NETWORK STATUS lamp changes to RED — SCADA MANUAL MODE; SAFE STATE lamp changes to GREEN — SAFE STATE ACHIEVED

Task `contact_castletech` complete (type: `npc_conversation`).

> **Tom Hadley's post-isolation sequence**: After confirming isolation, Tom automatically continues into the Trent Water topic (→ `trent_water_topic` knot). He tells the player about the shared file server access anomaly and offers to contact Trent Water's security team. This unlocks the optional Aim 9 path.

---

## Aim 7 — Investigate the SIS Compromise

**Objective**: Read the SIS configuration panel. Locate and read the SIS certification document.

This aim can be completed in parallel with Aims 5 and 6 — the Engineering Workshop is accessible from Aim 4 onwards.

### Step 21 — Open the SIS Configuration Panel (Step 1 of 3) ⭐

In the Engineering Workshop, find the `sis_config_panel` object (`type: sis_config_panel`). Interact with it. This opens the **MG-03 SIS Configuration Threshold** minigame.

The minigame shows a table of SIS setpoints with deviation status:

| Parameter | Current Value | Status |
|-----------|--------------|--------|
| THERMAL_RUNAWAY_THRESHOLD | 85°C | AMBER |
| H2_ALARM_THRESHOLD | 1.2% LEL | AMBER |
| MAX_CHARGE_VOLTAGE | 4.32 V/cell | AMBER |

Clicking an AMBER row shows the detail text and certified vs. current values.

The **Compare with Certification Document** button is disabled at this stage — it requires `sis_certification_seen = true`.

**Verify**:
- `sis_config_seen` = `true` (set by minigame `init()` via `setScenarioGlobal`)
- Helen's eventMapping fires: task `read_sis_config` complete

### Step 22 — Get the Filing Cabinet Key

The `filing_cabinet_key` (key object) is on the engineering workstation desk. Pick it up. Key appears in inventory.

### Step 23 — Open the Filing Cabinet

Interact with `engineering_filing_cabinet`. It is key-locked with a 4-pin tumbler (`keyPins: [35, 55, 45, 25]`). Use the filing cabinet key to open it.

Inside: two documents.

### Step 24 — Read the SIS Certification Document ⭐ (Step 2 of 3)

Read the **SIS Certification Document (IEC 61511)**.

Shows certified setpoints: `THERMAL_RUNAWAY_THRESHOLD: 55°C`. Confirms the patch deferral decision and the £180,000 recertification cost. Note: *"A modified but uncertified SIS is not a SIS — it is an unvalidated control system."*

**Verify**:
- `sis_certification_seen` = `true` (set by `onRead` on the certification document)
- Helen's eventMapping fires: task `find_certification_doc` complete

### Step 24b — Confirm SIS Tamper on Config Panel ⭐ (Step 3 of 3)

Return to the `sis_config_panel` and interact with it again. The **Compare with Certification Document** button is now **enabled** (because `sis_certification_seen = true`).

- Click **"Compare with Certification Document"** to see a side-by-side comparison of tampered vs. certified values
- Click **"Confirm SIS Tamper - Report to Security"** to lock in the finding

**Verify**:
- `sis_tamper_confirmed` = `true` (set by the minigame's Confirm Tamper button)
- Helen's eventMapping fires: `en002_claim_assessed` = `true` (via `sis_tamper_confirmed` eventMapping)
- Marcus Webb hub now shows: **"What should we do about the SIS patch?"** option
- Priya S. hub (once she appears) now shows: SIS independence and SIS patch dilemma topics
- **Alarm panel**: SIS STATUS lamp changes to RED — SETPOINT DEVIATION (flashing)

### Step 25 — Read the Deferred Patch Risk Assessment (optional)

Read the second document in the cabinet: **Deferred Patch Risk Assessment** (authored by Marcus Webb).

Shows: vulnerability documented 18 months ago, compensating control (network monitoring) never actually implemented for OT zone. Post-incident note confirms the compensating control was ineffective.

No variable changes — this is context/teaching content for the debrief.

### Step 26 — Talk to Helen About the SIS Compromise (optional depth)

Return to Helen. New hub options:
- **"Ask about the SIS configuration"** — Helen explains the 85°C threshold, how the SIS was reached via the engineering port
  - Sub-options: engineering port history (sets `en002_claim_assessed = true`), proper SIS architecture, consequences, attacker intent, audit trail
- **"Ask about the SIS patch situation"** — Helen explains the deferral, recertification cost, and her recommendation
  - Sub-options: patch defensibility, technical detail, recertification cost, recommendation

---

## Aim 8 — Make the NCSC Notification

**Objective**: Complete and submit the NIS Notification form before the 72-hour clock expires.

### Step 27 — Read the NIS Notification Form ⭐

Find the `nis_notification_form` (notes2 object) in the SCADA Control Room. Read it.

The form is pre-filled with key findings. Reading it represents completing and submitting the NIS notification.

**Verify**:
- `ncsc_notified` = `true` (set by `onRead`)
- Helen's eventMapping fires: task `complete_nis_form` complete

**NIS Deadline**: A 45-minute game timer (`nis_deadline`, representing 72 hours) is running from scenario start. If `ncsc_notified` is not set before the timer expires, `nis_deadline_missed` = `true` and Helen fires a radio bark about breach of OES obligation.

---

## Aim 9 — (Optional) Notify Trent Water Services

**Objective**: Contact Trent Water to warn them of the potential shared file server compromise.

This aim unlocks when `historian_flatline_found = true` (Tom Hadley's eventMapping reveals it). Tom proactively messages the player about the Trent Water access anomaly.

### Step 28 — Complete the Trent Water Thread via Tom Hadley

Call Tom Hadley. Either follow the `post_isolation` → `trent_water_topic` path (happens automatically after isolation), or select **"Ask about the Trent Water shared file server"** from his hub.

Tom explains:
- Shared file server FS-ALBION-01 accessed by Trent Water workstations
- Unusual access from workstation `TW-SCADA-ENG-02` at 23:47 Tuesday — same time as the Albion attack
- Both Albion and Trent Water are CastleTech clients

Tom offers: *"I can send an advisory to Trent Water's security team right now. Do you want me to?"*

Choose **"Yes — send the advisory immediately"**.

**Verify**:
- `trent_water_notified` = `true` (set by `#set_global:trent_water_notified:true`)
- Task `call_trent_water` complete (set by `#complete_task:call_trent_water`)
- Priya S.'s debrief now includes the **Trent Water cross-sector dependency** topic

---

## Aim 10 — Post-Incident Debrief

**Objective**: Complete the post-incident debrief with Dr Priya Sharma.

Priya S. appears in the SCADA Control Room after `facility_safe_state = true`. Her arrival `debrief_intro` fires automatically as a timedConversation.

### Step 29 — Priya S.'s Arrival Briefing (automatic)

The `debrief_intro` timedConversation fires when Priya S. becomes visible. She introduces herself as representing NCSC and HSE jointly (NIS breach + COMAH near-miss).

### Step 30 — Work Through the Debrief Topics

Talk to Priya S.. Four main topics, each unlocking once in the hub:

**1. Root cause and attack pathway** (always available)
- Priya S. explains: supply chain compromise → domain controller → jump server → SIS setpoint modification
- Sub-options: was it detectable? (yes — c.ellison session and Modbus traffic); jump server criticality; regulatory next steps
- Sets `topic_root_cause_done = true`

**2. SIS independence** (available when `sis_tamper_confirmed = true`)
- Priya S. explains IEC 61511 isolation requirements; how the SIS engineering port was reachable from SCADA
- Sub-options: port vulnerability (sets `en002_claim_assessed = true`), correct architecture, why the ESD still worked
- Sets `topic_sis_independence_done = true`

**3. SIS patch dilemma** (available when `sis_tamper_confirmed = true`)
- Priya S. presents the two options; player must choose:
  - **"Apply the patch — accept the recertification cost"** → sets `patch_decision = "active_management"`
  - **"Deferral with effective compensating controls"** → dialogue acknowledges this is defensible in principle, but Albion's compensating controls were ineffective → sets `patch_decision = "deferral"`
- Sets `en005_claim_assessed = true`, `topic_patch_done = true`

**4. Review the NCSC notification** (always available)
- If `ncsc_notified = true`: Priya S. acknowledges timely notification
- If `ncsc_notified = false`: Priya S. reminds player the 72-hour clock is running
- Sets `topic_nis_reviewed = true`

**Optional 5. Trent Water cross-sector dependency** (available when `trent_water_notified = true`)
- Priya S. confirms Trent Water found a suspicious file but no active intrusion
- Notes the gap in sector-level cross-dependency risk assessment

### Step 31 — Closing Summary

Once `topic_root_cause_done`, `topic_sis_independence_done`, and `topic_patch_done` are all true, the hub shows **"Closing summary — what have we learned?"**

Priya S. delivers the scenario's closing synthesis: the hardwired ESD worked because it was designed to be independent; normalisation of deviance led to each documented risk being accepted and forgotten; a safety case is a living document.

Player chooses a closing question:
- *"What happens next — from a regulatory standpoint?"* → 3-month NIS investigation, de-identified findings, Albion remediation plan required
- *"Any final advice for the team?"* → tribute to Helen; invest in people who understand physical systems

**Verify**:
- `debrief_complete` = `true` (set by `#set_global:debrief_complete:true` at start of `closing_summary`)
- Task `talk_to_priya_sharma` complete (set by `#complete_task:talk_to_priya_sharma` in `closing_summary`)
- `patch_decision` = `"active_management"` or `"deferral"` (set during patch dilemma)

---

## Complete Global Variable State (Happy Path)

```
START
  briefing_played = true           (Helen timedConversation auto-fires)
  helen_briefed = true             (Helen arrival_briefing knot)
  incident_folder_read = true      (read Incident Response Folder)
  hmi_reviewed = true              (read SCADA Live Status on HMI-OPS-01)
  battery_hall_badge_collected = true (badge given by Helen in arrival_briefing or walkdown_offer)
  anomaly_detected = true          (read analog thermometer — Aim 2 trigger)
  historian_flatline_found = true  (scada-historian minigame completionActions — Aim 3 trigger)
  workshop_key_collected = true    (pick up workshop RFID key)
  marcus_webb_contacted = true     (call Marcus Webb)
  en001_claim_assessed = true      (Marcus CLAIM-EN-001 dialogue)
  jump_server_confirmed = true     (log-filter minigame completionActions — Aim 4 trigger)
  esd_activated = true             (ESD pushbutton MG-01 — Aim 5 trigger)
  jump_server_isolated = true      (read jump server cable — Aim 6 step 1)
  castletech_contacted = true      (call Tom Hadley and confirm isolation)
  network_isolated = true          (set by Tom Hadley eventMapping)
  facility_safe_state = true       (set by Helen's eventMapping on network_isolated)
  priya_sharma_visible = true       (set by Helen's eventMapping on facility_safe_state)
  sis_config_seen = true           (open SIS config panel MG-03 — Aim 7 step 1)
  sis_certification_seen = true    (read SIS Certification Document — Aim 7 step 2)
  sis_tamper_confirmed = true      (click Confirm Tamper on sis_config_panel — Aim 7 step 3)
  en002_claim_assessed = true      (set by Helen's eventMapping on sis_tamper_confirmed)
  ncsc_notified = true             (read NIS Notification Form — Aim 8 trigger)
  trent_water_notified = true      (optional — Tom Hadley Trent Water thread)
  en005_claim_assessed = true      (Priya S. patch dilemma topic)
  patch_decision = "active_management" | "deferral"
  debrief_complete = true          (Priya S. closing summary)

ALSO SET DURING DEBRIEF (optional additional claim coverage):
  en002_claim_assessed = true      (Priya S. sis_port_vulnerability sub-topic)
```

---

## Development Status — All Minigames Implemented

All P1 minigames are implemented. The scenario can be played end-to-end without workarounds.

| Minigame | Object ID | Type / minigameId | Status |
|----------|-----------|-------------------|--------|
| ScadaHistorianMinigame | `historian_trend_viewer` (inside `hmi_ops_01`) | `scada_historian` / `scada-historian` | ✅ Implemented |
| LogFilterMinigame | `hmi_eng_02` | `log_filter_terminal` / `log-filter` | ✅ Implemented |
| ESD pushbutton | `esd_pushbutton` | `interactionType: esd_button` | ✅ Implemented |
| AlarmPanelMinigame | `alarm_panel` | `alarm_panel` | ✅ Implemented (MG-04) |
| SisConfigThresholdMinigame | `sis_config_panel` | `sis_config_panel` | ✅ Implemented (MG-03) |
| NetworkArchitectureMinigame | `network_architecture_diagram` | `network_architecture` | ✅ Implemented (MG-06) |

**To manually trigger key completions from the browser console** (for development/testing without playing through minigames):

```js
// Skip historian minigame — unblock Aim 4:
window.gameState.globalVariables.historian_flatline_found = true;
document.dispatchEvent(new CustomEvent('global_variable_changed:historian_flatline_found', { detail: { value: true } }));

// Skip log-filter minigame — unblock Aims 5/6/7:
window.gameState.globalVariables.jump_server_confirmed = true;
document.dispatchEvent(new CustomEvent('global_variable_changed:jump_server_confirmed', { detail: { value: true } }));

// Fast-forward to debrief (skip to facility safe state):
window.gameState.globalVariables.esd_activated = true;
window.gameState.globalVariables.network_isolated = true;
// Then trigger both eventMappings that set facility_safe_state:
```

> Adjust the event dispatch to match whatever event bus the engine exposes. If using a different API, set the variable and then call any helper that re-evaluates eventMappings.

---

## Testing Checklist

### Core Path
- [ ] Helen's arrival briefing fires automatically on load
- [ ] `helen_briefed` set; `conduct_walkdown` aim unlocks; `check_hmi_readings` task completes
- [ ] HMI-OPS-01 password lock opens with the randomised session password (read sticky note on desk)
- [ ] Incident Response Folder read → `incident_folder_read` = true → task complete
- [ ] Battery Hall Access Badge in inventory (given by Helen in arrival briefing or walkdown offer); `battery_hall_badge_collected` = true; Battery Hall 1 unlocks with badge
- [ ] Analog thermometer read → `anomaly_detected` = true → Helen radio message fires → `check_thermometer` task complete
- [ ] Historian Trend Viewer minigame (scada-historian) completed → `historian_flatline_found` = true → `review_historian` task complete → Aim 4 unlocks → Helen radio message fires (2.5s) → Tom Hadley timed message fires (6s)
- [ ] Marcus Webb call → `marcus_webb_contacted` = true → ESD authorisation message fires → Aims 5 and 6 unlock
- [ ] Engineering Workshop RFID key found in duty desk; workshop unlocks
- [ ] HMI-ENG-02 log-filter minigame: both tabs viewed (`sis_audit_reviewed` = true); completion fires → `jump_server_confirmed` = true → `identify_rdp_session` task complete → Aim 7 unlocks
- [ ] ESD pushbutton interaction: guard flip → confirm modal → `esd_activated` = true → Helen radio message fires → task complete
- [ ] Jump server cable read → `jump_server_isolated` = true → Marcus timed message fires → task complete
- [ ] Tom Hadley isolation confirmed → `castletech_contacted` = true → `network_isolated` = true → `facility_safe_state` = true → `priya_sharma_visible` = true → Priya S. debrief_intro fires → Aims 8 and 10 unlock
- [ ] SIS config panel MG-03 opens → `sis_config_seen` = true → task `read_sis_config` complete; Compare button disabled
- [ ] SIS Certification Document read → `sis_certification_seen` = true → task `find_certification_doc` complete; Compare button now enabled
- [ ] SIS config panel reopened → Compare mode works; Confirm Tamper button clicked → `sis_tamper_confirmed` = true → `en002_claim_assessed` = true; alarm panel SIS STATUS lamp → RED (flashing)
- [ ] NIS Notification Form read → `ncsc_notified` = true → task complete
- [ ] Priya S.: all four debrief topics covered; `patch_decision` set; `closing_summary` reached
- [ ] `debrief_complete` = true; `talk_to_priya_sharma` task complete

### Optional Path
- [ ] Tom Hadley Trent Water thread: `trent_water_notified` = true → task complete → Priya S. Trent Water topic available

### Edge Cases
- [ ] Early ESD (before historian flag): `early_esd_activation` = true fires; Helen radio message fires; scenario does not block
- [ ] NIS deadline missed (45 min without `ncsc_notified`): `nis_deadline_missed` = true; Helen bark fires
- [ ] H₂ advisory (T+22m after `anomaly_detected`, ESD not pressed): `hydrogen_alarm` = true; H₂ GAS lamp → AMBER (ADVISORY); Helen radio fires
- [ ] H₂ evacuation (T+40m after `anomaly_detected`, ESD still not pressed): `facility_evacuated` = true; H₂ GAS lamp → RED flashing (EVACUATE); Helen urgent radio fires
- [ ] ESD pressed before T+22m: `h2_advisory` and `h2_evacuation` timers cancel; H₂ GAS remains NORMAL throughout
- [ ] Resume from save: `briefing_played` = true suppresses arrival briefing replay
- [ ] Priya S. patch dilemma — deferral path: `patch_decision` = `"deferral"` correctly set; dialogue branch challenges the player's reasoning

### Alarm Panel Lamp State Progression
- [ ] At scenario start: all 7 lamps in initial state (BATTERY HALL 1 green, RACKS ISOLATED off, SIS STATUS green, JUMP SERVER green, NETWORK STATUS green, H₂ GAS green, SAFE STATE off)
- [ ] After `anomaly_detected`: BATTERY HALL 1 → AMBER (ANOMALY DETECTED)
- [ ] After `sis_tamper_confirmed`: SIS STATUS → RED flashing (SETPOINT DEVIATION)
- [ ] After `esd_activated`: RACKS ISOLATED → GREEN (ESD ACTIVATED)
- [ ] After `jump_server_isolated`: JUMP SERVER → AMBER (ISOLATED)
- [ ] After `network_isolated`: NETWORK STATUS → RED (SCADA MANUAL MODE)
- [ ] After `facility_safe_state`: SAFE STATE → GREEN (SAFE STATE ACHIEVED)
- [ ] If `hydrogen_alarm` triggers (T+22m from `anomaly_detected`, ESD not pressed): H₂ GAS → AMBER (ADVISORY); Helen radio message fires
- [ ] If `facility_evacuated` triggers (T+40m, ESD still not pressed): H₂ GAS → RED flashing (EVACUATE); Helen urgent radio message fires
- [ ] If `esd_activated` fires before T+22m: both `h2_advisory` and `h2_evacuation` timers cancel; H₂ GAS stays NORMAL

### Dialogue Coverage
- [ ] Helen: all hub branches reachable (`thermometer_discrepancy`, `historian_anomaly`, `esd_explanation`, `sis_compromise_discussion`, `patch_situation`, `next_steps`)
- [ ] Marcus: `rdp_session_confirmed`, `isolation_trade_off`, `claim_en001`, `sis_patch_view`, `nis_obligation` all reachable
- [ ] Tom: `ot_scope_clarification`, `trent_water_topic`, `isolation_request` all reachable
- [ ] Priya S.: both `recommend_patch` and `recommend_deferral` paths tested; `compensating_controls_explained` sub-option tested
