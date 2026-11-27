# Game Design Document — Case 1: Healthcare
## Northgate General Hospital — The Ransomware Incident

**Scenario duration:** 50–70 minutes
**Player role:** Incident responder (IT/security background), arriving on Wednesday morning as the scale of the attack is becoming clear. Players are not clinicians — they are the cyber security and systems team responding to a Major Incident that has crossed into patient care.

---

## Scenario Premise

It is 07:30 on Wednesday. The on-call IT manager declared a Major Incident at 22:38 last night when ransomware hit the enterprise network. The CIO has called everyone in early. Players arrive at the hospital to find the enterprise network encrypted, the EHR going dark, and reports coming in that something is wrong on the wards. The clinical team doesn't fully understand what the IT failure means for patient safety. The IT team doesn't understand what the clinical team needs. Players must bridge both worlds under time pressure.

The attack is already in progress. Players are not preventing it — they are managing its consequences and making decisions that determine how bad it gets.

---

## Section 1: Physical Room Layout

---

### Room: Ward 7 — Clinical Bay and Nursing Station

**Setting:** An NHS inpatient ward bay. Four to six hospital beds arranged in an open bay, each with a bedside monitor, IV pole, and infusion pump. A nursing station desk sits at the entrance to the bay, with a large wall-mounted patient monitoring central station screen above it. The ward has the slightly worn, functional look of an NHS environment — printed notices on walls, equipment clustered around beds, a whiteboard with patient names and handover notes.

**Atmosphere:** On entry, the monitoring central station screen is dark — it shows the ransomware splash rather than patient data. One bedside alarm is audible (a soft repeating beep from Bed 4) but nobody at the nursing station is responding to it because there is no central view. A nurse is doing manual rounds, moving slowly between beds with a clipboard. A patient in a chair beside Bed 2 looks concerned. The ward feels understaffed and tense.

**Key systems present:**
- Patient Monitoring Central Station (wall-mounted screen above nursing station) — encrypted/offline, showing ransomware overlay
- Bedside patient monitors on each bed — still functioning locally, Bed 4 showing active alarm
- Infusion pump props at each bed — Bed 2's pump is the interactive one (opens Bedside Pump Terminal minigame)
- Clinical workstation at the nursing station — encrypted (ransomware display)
- Ward alarm panel (wall-mounted near exit) — showing amber MONITORING FAULT
- Call bell on Bed 4 rail — interactable, patient pressing it
- Nurse NPC (Charge Nurse, named Sarah) — patrol between monitoring station and beds
- Two bed-bound patient objects: Bed 4 (cardiac patient, progressing to `distressed`), Bed 2 (post-surgical, pump patient)
- Ambulatory patient NPC (Type C) — in chair beside Bed 2
- Paper medication charts — stacked on the nursing station desk (interactable, collectible)

**Initial state:** Monitoring central station offline (ransomware). Bed 4 patient in `resting_unmonitored` state, transitioning to `distressed` during Phase 1. Nurse Sarah on manual rounds. Fleet console not yet accessible from this room.

**Connections:** Players move to the IT Security Office (Room 2) after talking to the Charge Nurse and interacting with the central station. An RFID-locked door (staff access only) connects the ward to the corridor leading to Room 2. The RFID card is held by Ravi Anand — players must speak to him first, or find a spare card in the nursing station desk drawer.

---

### Room: IT Security Office

**Setting:** A small open-plan office, three or four desks, a wall-mounted display showing the network architecture diagram. Most workstations are showing the ransomware splash. One terminal — Ravi Anand's laptop, on battery power, not domain-joined — is still operational. A printed network diagram is pinned to the wall. A physical patch panel rack sits in the corner, with labelled ports and cable runs visible.

**Atmosphere:** Signs of a long night — coffee cups, a jacket thrown over a chair. Some workstations show the ransomware note. Ravi Anand is at his laptop, on the phone, looking exhausted. Post-it notes on the wall with passwords crossed out and rewritten. A printer in the corner has spat out a stack of paper — VPN authentication logs printed overnight.

**Key systems present:**
- Ravi Anand's operational laptop — opens SIEM Alert Dashboard minigame
- Network Segmentation Map — wall-mounted display (interactive, touch screen or tablet interface on a stand)
- VPN Log Terminal — a separate VM terminal (vm category, auth.log challenge)
- Physical patch panel rack — prop, labelled ports including "WARD 7 LEGACY SEGMENT", "CLINICAL VLAN", "ENTERPRISE"
- Ravi Anand NPC — seated at laptop
- Printed VPN logs — physical prop (paper, can be picked up and read — contains the Romanian IP anomaly as a physical document before the VM challenge)
- Encrypted workstations (×3) — ransomware overlay display
- RFID-locked server cabinet — contains the dual-authorisation codes needed for Room 3 (Ravi's code only; David's code is in Room 3)

**Initial state:** Ransomware displayed on most terminals. Ravi available for dialogue. SIEM dashboard accessible. Network map visible. VPN log VM unlocked.

**Connections:** Players move to the Major Incident Room (Room 3) after completing the SIEM review and understanding the network picture. Access to Room 3 requires a physical key (held by Helen Carver or found in Ravi's desk drawer after completing the SIEM challenge).

---

### Room: Major Incident Room

**Setting:** A mid-sized meeting room repurposed as an incident command centre. A large wall display shows the Major Incident Command Board. A whiteboard has been scrawled with handwritten notes — timelines, question marks, names circled. Helen Carver is at the head of a table with a laptop. David Osei is standing at the whiteboard. Dr Fiona Hartley is on a chair in the corner, on the phone.

**Atmosphere:** This is where the hard decisions happen. The room feels pressured and slightly too warm. The command board is partially populated — it shows the ransomware event and some early response entries, but large gaps. A physical dual-authorisation keypad is mounted on the wall beside a schematic showing the network isolation point. A backup recovery console terminal sits on one of the desks. A printed ransom note — the full text from the ransomware attack — is on the table.

**Key systems present:**
- Major Incident Command Board (wall display) — auto-updating, player can add entries
- Dual-Authorisation Panel (wall-mounted keypad) — requires both Ravi's code (Room 2) and David's code (obtainable from David Osei NPC here)
- Backup Recovery Console (laptop/tablet on desk) — three-option recovery decision
- Drug Library Integrity Checker (VM terminal in corner) — verifies pump drug library integrity
- Disclosure & Regulatory Notification Console (tablet on table) — ICO/NHS England notifications
- Helen Carver NPC — CIO, at table head
- David Osei NPC — Clinical Engineering Manager, at whiteboard
- Dr Fiona Hartley NPC — Caldicott Guardian, in corner
- Printed ransom note — physical prop on table

**Initial state:** Command board shows: `[22:38] MAJOR INCIDENT DECLARED — IT systems down`. All other NPCs available for dialogue immediately. Dual-auth panel locked. Drug library terminal accessible. Backup console accessible.

---

## Section 2: Interactive Elements Catalogue

---

### Element: Patient Monitoring Central Station

**Type:** State-reactive display (minigame 2)
**Location:** Room 1 — Ward 7, above nursing station
**Initial state:** Offline — ransomware overlay (`SYSTEM ENCRYPTED — SEE README_RESTORE.TXT`)
**How players interact:** Approach and click/tap the screen to open the minigame. They observe the display state. When the minigame is open, it shows the ransomware overlay with tile grid darkened beneath. If `ward_monitor_status` is later restored (which it is not in this scenario — it stays offline), tiles would reactivate.
**State changes:** Does not change during the scenario. Stays offline. Purpose is to show players what the nurses have lost. Bed 4's tile is faintly visible through the overlay, its alarm indicator still trying to flash.
**Teaching purpose:** Loss of centralised monitoring is the direct physical consequence of ransomware reaching the clinical zone. Makes abstract network failure tangible.
**Physical implementation:** Large wall-mounted monitor (40–55 inch), displaying the minigame via the BreakEscape screen output system. Pixel-art clinical software aesthetic on top, ransomware overlay rendering over it.

---

### Element: Bed 4 — Cardiac Patient (Object + Alarm)

**Type:** Patient object with state machine; call bell prop
**Location:** Room 1 — Ward 7, Bed 4
**Initial state:** `resting_unmonitored` — patient lying in bed, bedside monitor showing cardiac trace and active alarm indicator, but the nursing station can't see it
**How players interact:** Observe the patient and the alarm. The call bell button on the bed rail is interactable — pressing it triggers an audio clip (patient voice: *"Hello? Is anyone there? My machine is beeping."*). Players can also speak to the patient (ambulatory NPC nearby provides witness line).
**State changes:**
- After ~8 minutes of `ward_monitor_status = offline` with no player escalation: patient transitions to `distressed` (restless animation, louder call bell animation)
- After ~15 minutes without escalation: patient transitions to `critical` (flat, still, alarm flashing)
- When player triggers correct escalation via Charge Nurse Sarah NPC: transitions to `attended`
**Teaching purpose:** The visible, unattended alarm is the human consequence of monitoring loss. Players see the gap between the flashing bedside alarm and the empty, blind nursing station.
**Physical implementation:** Dressed hospital bed prop with a mannequin or fabric figure. Pixel-art bedside monitor prop displaying the local alarm state. Practical call bell button wired to trigger the audio clip.

---

### Element: Bed 2 — Infusion Pump Patient (Object + Pump Prop)

**Type:** Patient object; infusion pump prop (interactive)
**Location:** Room 1 — Ward 7, Bed 2
**Initial state:** `stable` — patient resting, pump running on last programmed settings
**How players interact:** The infusion pump prop is interactable — clicking it (or pressing a button on the physical prop) opens the Bedside Infusion Pump Terminal minigame. Players must collect paper medication charts from the nursing station desk first; without them, the minigame prompts: *"No prescription available — locate paper charts."*
**State changes:**
- If `pump_dose_error = true`: patient transitions to `sedated` after 5-minute delay
- If `pump_dose_correct = true`: patient remains `stable`
- Ambulatory patient NPC in nearby chair delivers witness line when patient enters `sedated` state
**Teaching purpose:** Manual pump programming as a high-risk fallback; the paper chart collection step makes the fallback workflow physical; the dose-entry challenge illustrates the transcription error pathway.
**Physical implementation:** Infusion pump prop (a decommissioned or replica medical pump mounted on an IV pole). A large button or NFC tag on the prop triggers the minigame launch.

---

### Element: Nursing Station Clinical Workstation

**Type:** PC terminal (encrypted state)
**Location:** Room 1 — Ward 7
**Initial state:** Ransomware display (Ransomware Impact Display minigame, minigame 5)
**How players interact:** Approach — sees ransomware note. Three action buttons: [CONTACT ATTACKERS], [REPORT TO NCSC], [BEGIN RECOVERY]. Pressing [REPORT TO NCSC] sets `ncsc_notified = true` and is noted by Charge Nurse Sarah as a good first step. Other buttons lead to NPC comments.
**State changes:** Does not restore during the scenario. Buttons remain available.
**Teaching purpose:** The infected clinical workstation — not just an IT machine — is what controls the monitoring and pump fleet. The ransomware splash on a nursing station terminal is the visual link between IT attack and clinical consequence.
**Physical implementation:** Standard workstation. Screen managed by BreakEscape display system.

---

### Element: Paper Medication Charts

**Type:** Physical prop (collectible item)
**Location:** Room 1 — Ward 7 nursing station desk drawer
**Initial state:** Present, accessible
**How players interact:** Open the desk drawer and take the stack of charts. Sets `paper_charts_collected = true`. Required to unlock the Bedside Infusion Pump Terminal (minigame 8) interaction.
**State changes:** Removed from desk when collected. A note in the drawer reads: *"Paper MAR charts — USE IF EHR DOWN."*
**Teaching purpose:** The fallback procedure exists but must be actively sought and used. The physical act of fetching paper charts before programming the pump mirrors the real workflow and makes the extra cognitive load of fallback operations tangible.
**Physical implementation:** A small stack of printed paper medication administration records (MAR), realistically formatted, in a labelled desk drawer.

---

### Element: Ward Alarm Panel

**Type:** Physical alarm panel (state-reactive)
**Location:** Room 1 — wall near ward exit
**Initial state:** Amber indicator illuminated: `MONITORING FAULT`
**How players interact:** Observe only — not directly interactive. Changes state based on global variables.
**State changes:**
- When patient Bed 4 reaches `critical`: red indicator illuminates `PATIENT ALARM — WARD 7 BED 4`
- When `major_incident_declared = true`: additional amber lamp `MAJOR INCIDENT ACTIVE`
**Teaching purpose:** Ambient consequence indicator. The amber fault lamp is visible from the moment players enter the ward — before they understand what it means.
**Physical implementation:** Physical alarm panel prop with coloured indicator lamps wired to the BreakEscape physical output system.

---

### Element: RFID Door — Ward to Corridor

**Type:** RFID lock
**Location:** Room 1 exit
**Initial state:** Locked — staff RFID access only
**How players interact:** Tap RFID card to unlock. Card is obtained from Ravi Anand NPC (he hands it over after introductory dialogue) or found in the nursing station desk (same drawer as paper charts).
**State changes:** Unlocks permanently once card used.
**Teaching purpose:** Physical access control to clinical areas — minor mechanic; primarily serves to ensure players speak to the Charge Nurse and/or Ravi before progressing.
**Physical implementation:** Standard BreakEscape RFID lock mechanism on the door between Room 1 and the corridor.

---

### Element: SIEM Alert Dashboard

**Type:** PC terminal (minigame 1)
**Location:** Room 2 — IT Security Office, Ravi Anand's laptop
**Initial state:** Open, showing scrolling alert log with a mix of real IoCs and migration noise
**How players interact:** Review alerts, classify each as DISMISS or ESCALATE. Goal is to identify and escalate the critical indicators: encoded PowerShell execution, LSASS access, unusual SMB volumes, and the cross-zone RDP session.
**State changes:** Completing correctly (escalating the right alerts) sets `siem_escalated = true`, unlocking a key piece of Ravi Anand's dialogue about the attack timeline. Completing incorrectly (dismissing critical alerts) sets `siem_missed_alerts = true` — Ravi notes that the alerts were there and were missed overnight.
**Teaching purpose:** Alert fatigue as an enabling condition; the SIEM contained the information needed to stop the attack before it reached the clinical zone — it was dismissed as migration noise.
**Physical implementation:** Ravi's laptop (standard workstation), the SIEM minigame displayed on screen.

---

### Element: VPN Log Terminal

**Type:** VM terminal (vm category, minigame 6)
**Location:** Room 2 — IT Security Office, separate terminal
**Initial state:** Operational, `auth.log` accessible
**How players interact:** Use grep/awk to identify the anomalous Romanian IP authentication using contractor credentials. A physical prop — the printed VPN logs — is also on the desk; players can find the anomaly visually before using the terminal. The terminal challenge formalises the finding and emits the flag.
**State changes:** Correct identification sets `vpn_anomaly_identified = true`. This is required for Ravi to fully explain the initial access vector.
**Teaching purpose:** Credential reuse; absence of MFA for contractor accounts; geographic anomaly as an IoC. The fact that the evidence was in the logs and went unnoticed illustrates the monitoring gap.
**Physical implementation:** Terminal in the Room 2 space. Physical printed log on the desk as a pre-challenge orientation aid.

---

### Element: Network Segmentation Map

**Type:** Interactive display (minigame 4)
**Location:** Room 2 — wall-mounted screen or tablet on stand
**Initial state:** Showing full network diagram with legacy exception rules highlighted in amber
**How players interact:** Toggle legacy exception rules on/off. Consequence panel updates. The SEVER button becomes available after at least one toggle interaction.
**State changes:** Toggling exception rules does not change global state (it is informational). Pressing SEVER and confirming calls `network_isolated = true`, which triggers:
- `ehr_status → OFFLINE`
- `fleet_console_status → OFFLINE`
- NPC reactions from Carver, Osei, and Hartley
- Corridor warning light activates
**Teaching purpose:** Incomplete segmentation as the structural vulnerability; the isolation decision's dual consequences (stops attacker, removes EHR access) are the core SIS trade-off of the scenario.
**Physical implementation:** Touch-screen display or tablet on a stand in Room 2. The physical patch panel rack in the corner provides physical reinforcement of the network topology concept.

---

### Element: RFID-Locked Server Cabinet

**Type:** RFID lock
**Location:** Room 2 — corner rack cabinet
**Initial state:** Locked
**How players interact:** Ravi Anand gives players the RFID card for this cabinet after `siem_escalated = true` is set. Inside: a laminated card with Ravi's dual-authorisation code for the isolation panel in Room 3, plus a USB drive containing offline backup tooling (flavour item).
**State changes:** Unlocks when correct RFID card presented.
**Teaching purpose:** Procedural access control over sensitive network configuration; dual-authorisation codes should not be in the same location.
**Physical implementation:** Standard BreakEscape RFID lock on a rack cabinet or filing cabinet prop.

---

### Element: Dual-Authorisation Panel

**Type:** Physical keypad (minigame 11)
**Location:** Room 3 — Major Incident Room, wall-mounted
**Initial state:** Both entry panels showing `PENDING`
**How players interact:** Enter Ravi's code (from Room 2 cabinet) in the IT Security panel; obtain David Osei's code through dialogue with him and enter it in the Clinical Engineering panel. Both codes must be entered. The central AUTHORISE button then activates.
**State changes:** On authorisation, `network_isolated = true` is set (if not already set via the Network Map in Room 2). If set here rather than Room 2, the physical keypad is the primary trigger.
**Teaching purpose:** Dual-authorisation as a safety control for high-consequence network changes; the need to get David Osei's buy-in forces players to engage with the clinical engineering perspective before isolating the network.
**Physical implementation:** Physical keypad prop with two entry panels and a central illuminated AUTHORISE button, wired to the BreakEscape physical output system.

---

### Element: Drug Library Integrity Checker

**Type:** VM terminal (vm category, minigame 9)
**Location:** Room 3 — corner terminal
**Initial state:** Accessible; `drug_library.csv` and reference files present
**How players interact:** Use diff and sha256sum to identify the tampered morphine dose entry. Report via script.
**State changes:** Correct identification sets `drug_library_compromised = true` and `drug_library_verified = true`. This triggers David Osei's dialogue about the integrity attack (Scenario 02 thread) and the pump withdrawal decision.
**Teaching purpose:** Drug library as a silent safety barrier; integrity attacks are harder to detect than availability attacks; the tampered library is what enabled the dose error in Bed 2.
**Physical implementation:** Standard terminal in Room 3.

---

### Element: Backup Recovery Console

**Type:** Interactive display (minigame 7)
**Location:** Room 3 — laptop/tablet on desk
**Initial state:** Three source tiles shown: NAS (encrypted), Tape (wiped), Cloud (18-hour ETA)
**How players interact:** Select a recovery source, read consequences, confirm.
**State changes:** Sets `backup_recovery_source` to the chosen option. Helen Carver NPC reacts based on choice. Cloud selection sets `recovery_eta_hours = 18` and updates the Command Board.
**Teaching purpose:** Backup architecture (air-gap, immutability) as a recovery dependency; the destroyed NAS and tape represent a design failure; the 18-hour cloud wait is the consequence of not having immutable local backups.
**Physical implementation:** Laptop or tablet on the Room 3 desk.

---

### Element: Major Incident Command Board

**Type:** State-reactive display (minigame 12)
**Location:** Room 3 — large wall display
**Initial state:** Shows: `[22:38] MAJOR INCIDENT DECLARED — Enterprise IT systems encrypted.`
**How players interact:** Auto-populates as global state changes. Players can add manual entries via the text field at the bottom.
**State changes:** New entries append automatically on: `siem_escalated`, `network_isolated`, `drug_library_verified`, `backup_recovery_source` set, `ncsc_notified`, patient state changes. System status panel on right reflects current state of EHR, monitoring, fleet console, and backups.
**Teaching purpose:** Cascading consequences of security decisions on clinical systems, made legible in one view.
**Physical implementation:** Large wall-mounted screen (55+ inch) in Room 3, managed by BreakEscape display output.

---

### Element: Corridor Warning Light

**Type:** Physical prop (state-reactive)
**Location:** Room 2 / corridor between rooms
**Initial state:** Off
**State changes:** Activates (flashing amber) when `major_incident_declared = true`.
**Teaching purpose:** Ambient atmosphere; signals escalation without requiring player interaction.
**Physical implementation:** A standard amber warning beacon (mirror ball type or simple flashing light) wired to the BreakEscape physical output system.

---

## Section 3: State Machine

### Global Variables

```
ward_monitor_status: enum {ONLINE, STALE, OFFLINE}
Initial: OFFLINE
Represents: Whether the Ward 7 patient monitoring central station is operational. OFFLINE from scenario start (ransomware). Cannot be restored during this scenario.

fleet_console_status: enum {ONLINE, OFFLINE}
Initial: ONLINE
Represents: Whether the infusion pump fleet management console is operational. Starts online (not yet affected). Goes OFFLINE if network_isolated = true.

ehr_status: enum {ONLINE, OFFLINE}
Initial: ONLINE
Represents: Whether the EHR prescribing system is accessible. Starts online (degraded but accessible). Goes OFFLINE when network_isolated = true.

network_isolated: boolean
Initial: false
Represents: Whether the enterprise-to-clinical network link has been severed. Set by either the Network Segmentation Map (Room 2) or the Dual-Authorisation Panel (Room 3).

ransomware_deployed: boolean
Initial: true
Represents: The ransomware event. True from scenario start — it happened last night.

major_incident_declared: boolean
Initial: true
Represents: Major Incident status. True from scenario start.

siem_escalated: boolean
Initial: false
Represents: Whether players have correctly identified and escalated the critical SIEM alerts.

siem_missed_alerts: boolean
Initial: false
Represents: Whether players dismissed critical alerts during the SIEM challenge.

vpn_anomaly_identified: boolean
Initial: false
Represents: Whether players identified the anomalous Romanian VPN session.

alarm_tamper_discovered: boolean
Initial: false
Represents: Whether players discovered that the alarm thresholds on Ward 7 monitors were also manipulated (Scenario 02 thread). Revealed by the Drug Library Integrity Checker terminal if players look at the broader config files.

drug_library_compromised: boolean
Initial: false
Represents: Whether players found evidence of the tampered drug library.

drug_library_verified: boolean
Initial: false
Represents: Whether the drug library has been formally verified and the tampered entry identified.

pump_dose_error: boolean
Initial: false
Represents: Whether the player entered an incorrect dose into the bedside pump minigame without self-correcting.

pump_dose_correct: boolean
Initial: false
Represents: Whether the player correctly programmed the bedside pump (with or without catching their own error via double-check).

paper_charts_collected: boolean
Initial: false
Represents: Whether players collected the paper MAR charts from the nursing station desk.

backup_recovery_source: enum {NONE, NAS, TAPE, CLOUD}
Initial: NONE
Represents: Which backup recovery path players selected.

itsec_authorised: boolean
Initial: false
Represents: Ravi's code entered correctly on the dual-auth panel.

clinical_eng_authorised: boolean
Initial: false
Represents: David Osei's code entered correctly on the dual-auth panel.

ncsc_notified: boolean
Initial: false
Represents: Whether players used the ransomware display to report to NCSC.

patient_bed4_state: enum {STABLE, RESTING_UNMONITORED, DISTRESSED, CRITICAL, ATTENDED, DECEASED}
Initial: RESTING_UNMONITORED
Represents: The cardiac patient on Ward 7, Bed 4.

patient_bed2_state: enum {STABLE, SEDATED, CRITICAL, ATTENDED, DECEASED}
Initial: STABLE
Represents: The post-surgical patient on Ward 7, Bed 2.

ico_notified: boolean
Initial: false
Represents: Whether the ICO has been notified of the data breach.

ico_deadline_missed: boolean
Initial: false
Represents: Whether the 72-hour GDPR notification window expired without ICO notification. Set by a background timer; triggers regulatory fine consequence in debrief.

backup_reinfected: boolean
Initial: false
Represents: Whether EHR was restored from a compromised backup source, reintroducing malware and requiring a second rebuild.

safety_claim_hc001_assessed: boolean
Initial: false
Represents: Whether the player has formally assessed CLAIM-HC-001 (network segmentation protects device integrity) as no longer valid given current conditions.

safety_claim_hc003_assessed: boolean
Initial: false
Represents: Whether the player has formally assessed CLAIM-HC-003 (drug library change control preserves dose safety) as no longer valid.

safety_claim_hc007_assessed: boolean
Initial: false
Represents: Whether the player has formally assessed CLAIM-HC-007 (integrated incident response prevents containment-induced safety hazards) as applicable and has engaged both IT and clinical stakeholders accordingly.

debrief_complete: boolean
Initial: false
Represents: Whether the NCSC debrief NPC has delivered the closing summary.
```

---

### Event Triggers

```
TRIGGER: Scenario start (t=0)
CAUSES: ward_monitor_status = OFFLINE; ransomware_deployed = true; major_incident_declared = true
PHYSICAL: Central station shows ransomware overlay; ward alarm panel lit amber; corridor warning light off (major incident was declared before players arrive)
NPC: Charge Nurse Sarah says "The monitoring system went down overnight — we've been doing everything by hand."

TRIGGER: Timer (8 minutes) — if patient_bed4_state = RESTING_UNMONITORED and ward_monitor_status = OFFLINE
CAUSES: patient_bed4_state → DISTRESSED
PHYSICAL: Bed 4 patient animation changes (restless); call bell button begins pulsing; audible repeating alarm from bedside monitor increases in frequency
NPC: Charge Nurse Sarah (if nearby): "Something's not right with Bed 4 — I can't see from the station."

TRIGGER: Timer (15 minutes) — if patient_bed4_state = DISTRESSED and no escalation action taken
CAUSES: patient_bed4_state → CRITICAL; ward alarm panel red indicator activates
PHYSICAL: Patient flat in bed; alarm flashing; ward panel red lamp "PATIENT ALARM — BED 4"; nurse rushes to bed and stays
NPC: Nurse NPC breaks routine, walks quickly to Bed 4. Charge Nurse Sarah: "We need a crash team — and someone needs to fix these systems."

TRIGGER: Timer (22 minutes) — if patient_bed4_state = CRITICAL and patient_bed4_state ≠ ATTENDED
CAUSES: patient_bed4_state → DECEASED
PHYSICAL: Bed 4 patient sprite goes still; bedside alarm stops; ward alarm panel red lamp extinguishes and is replaced by a steady red "PATIENT DECEASED" indicator; nurses step back from the bed. Command Board: "[t] PATIENT DEATH — Ward 7 Bed 4. Cardiac arrhythmia. No central monitoring response. Clinical team response delayed 22 minutes."
NPC: Charge Nurse Sarah, if approached: "She's gone. The alarm was going for twenty minutes. We couldn't see it from the station." All subsequent Sarah dialogue reflects grief and exhaustion. The scenario continues — the debrief will return to this.
TEACHES: The consequence of monitoring loss is not abstract. A patient died because the central station was encrypted and the bedside alarm was not heard.

TRIGGER: Player escalates Bed 4 via dialogue with Charge Nurse Sarah (option: "Get help to Bed 4 now")
CAUSES: patient_bed4_state → ATTENDED
PHYSICAL: Second nurse NPC moves to Bed 4 and stays; alarm continues but is attended
NPC: Sarah: "I've called the doctor. Now — can you tell me what is happening with the computer systems?"

TRIGGER: Player completes SIEM Alert Dashboard (siem_escalated = true)
CAUSES: siem_escalated = true
PHYSICAL: Command Board appends entry: "[t] SIEM ALERTS ESCALATED — Critical indicators identified"
NPC: Ravi Anand: "These alerts were generated during the night. They were dismissed as migration noise. That's how the attacker stayed hidden." Unlocks deeper dialogue about network topology and hands over RFID card for cabinet.

TRIGGER: Player identifies VPN anomaly (vpn_anomaly_identified = true)
CAUSES: vpn_anomaly_identified = true
PHYSICAL: Command Board: "[t] VPN ANOMALY CONFIRMED — Contractor credentials used from Romanian IP, no MFA"
NPC: Ravi Anand: "That's how they got in. Blake's credentials, no second factor, no geo-block. It's all in the logs."

TRIGGER: Player presses SEVER on Network Segmentation Map OR completes Dual-Authorisation Panel
CAUSES: network_isolated = true; ehr_status → OFFLINE; fleet_console_status → OFFLINE
PHYSICAL: Network map shows severed link (red X on enterprise-clinical connection); EHR workstation in Room 1 transitions to offline state; fleet console (if open) transitions to offline; Command Board: "[t] NETWORK ISOLATED — Clinical zone severed from enterprise"
NPC: Helen Carver: "It's done. But we've just lost the EHR on those wards — clinical staff have no electronic records." David Osei: "At least the devices are protected. The pumps run on last settings." Dr Hartley (phone): "Without EHR, the ward teams are working blind on allergies. We need pharmacy at every bedside."

TRIGGER: Player completes Drug Library Integrity Checker (drug_library_verified = true)
CAUSES: drug_library_compromised = true; drug_library_verified = true
PHYSICAL: Command Board: "[t] DRUG LIBRARY TAMPERED — Morphine dose max altered. Pump verification required."
NPC: David Osei: "This changes everything. The pump guardrails were disabled. Any pump on that network could have pushed a toxic dose — and the system wouldn't have stopped it." Unlocks decision about withdrawing pumps from service for firmware verification.

TRIGGER: Player selects backup_recovery_source = CLOUD
CAUSES: backup_recovery_source = CLOUD; recovery_eta_hours = 18
PHYSICAL: Command Board: "[t] CLOUD RESTORE INITIATED — EHR recovery ETA 18 hours"
NPC: Helen Carver: "Eighteen hours of paper-based clinical operations. I need every available pharmacist on the wards."

TRIGGER: Player selects backup_recovery_source = NAS or TAPE
CAUSES: backup_recovery_source = NAS or TAPE
PHYSICAL: Command Board: "[t] RECOVERY ATTEMPTED FROM [SOURCE] — WARNING: Source may be compromised"
NPC: Ravi Anand: "I'd strongly advise against that. If the malware is still in that backup, we're putting it straight back into the system." Helen Carver: "How long if we wait for the cloud restore?"

TRIGGER: pump_dose_error = true (player entered wrong dose and confirmed without correcting)
CAUSES: patient_bed2_state → SEDATED (after 5 minutes)
PHYSICAL: Bed 2 patient enters sedated animation; ambulatory patient NPC in chair says witness line
NPC: Pharmacist NPC (if present): rushes to Bed 2. Charge Nurse Sarah: "The patient in Bed 2 isn't right — call a doctor."

TRIGGER: pump_dose_error = true AND drug_library_compromised = true (double jeopardy — guardrails already disabled)
CAUSES: patient_bed2_state → CRITICAL (immediately, no delay — the guardrail that would have soft-limited the rate is gone)
PHYSICAL: Bed 2 patient enters critical animation rapidly; bedside monitor alarms; pharmacist runs; a doctor NPC spawns and moves to the bed urgently.
NPC: Doctor NPC: "Respiratory arrest. Get naloxone now." Charge Nurse Sarah: "The pump accepted forty milligrams. It should have refused that. The guardrails failed."

TRIGGER: patient_bed2_state = CRITICAL and no clinical response within 5 minutes (doctor NPC present but drug_library_compromised = true and no player escalation)
CAUSES: patient_bed2_state → DECEASED
PHYSICAL: Command Board: "[t] PATIENT DEATH — Ward 5 Bed 2. Morphine overdose. Smart pump guardrails disabled by drug library tampering. Dose error unchallenged."
NPC: Doctor NPC, quietly: "We gave naloxone but it was too late. The pump should never have accepted that rate." The debrief will return to this.
TEACHES: The drug library is a safety barrier. When it is tampered with, the pump becomes a weapon that accepts lethal doses without warning.

TRIGGER: pump_dose_correct = true
CAUSES: patient_bed2_state remains STABLE
PHYSICAL: No visible change — pump runs normally
NPC: Pharmacist NPC: "Good catch on the double-check. That's why we do it."

TRIGGER: backup_recovery_source = NAS or TAPE (confirmed despite warning)
CAUSES: backup_reinfected = true
PHYSICAL: Command Board (auto-appended 30 seconds after restore confirmation): "[t] EHR RESTORE FAILED — Ransomware reactivated from backup. Second rebuild required. Clinical operations extended by 5 days."
NPC: Ravi Anand: "I told them. The malware was still in that backup. We're starting again from scratch." Helen Carver: "Five more days on paper. This is on us."
TEACHES: Backup immutability is a safety requirement, not a best practice. Restoring from a compromised backup reintroduces the threat.

TRIGGER: ico_notified = false AND 72-hour in-game timer expires
CAUSES: ico_deadline_missed = true
PHYSICAL: Command Board: "[t] ICO NOTIFICATION DEADLINE MISSED — 72-hour GDPR window expired." Dr Hartley's NPC portrait shows a negative indicator.
NPC: Dr Hartley: "We've missed the ICO window. That's a regulatory breach on top of everything else. The fine alone could be millions." (Consequence presented in debrief.)
TEACHES: Regulatory notification obligations are time-critical and run in parallel with the technical response. Failing to notify is itself a consequential decision.

TRIGGER: Player asks David Osei "Is CLAIM-HC-001 still valid?" (dialogue branch 6, unlocked after network map interaction)
CAUSES: safety_claim_hc001_assessed = true
PHYSICAL: Command Board: "[t] SAFETY CLAIM ASSESSED — CLAIM-HC-001 (Network Segmentation) INVALIDATED. Dual-homed workstations and legacy flat segments breach the claim conditions."
NPC: David Osei: "CLAIM-HC-001 says the safety case holds provided the clinical zone is fully segmented. It isn't. It never was. That claim has been invalid for eighteen months and nobody caught it."
TEACHES: Safety cases are living documents. A claim about security controls underpinning safety properties can silently become invalid when the underlying control degrades.

TRIGGER: Player asks David Osei "Is CLAIM-HC-003 still valid?" (dialogue branch 7, unlocked after drug_library_verified = true)
CAUSES: safety_claim_hc003_assessed = true
PHYSICAL: Command Board: "[t] SAFETY CLAIM ASSESSED — CLAIM-HC-003 (Drug Library Integrity) INVALIDATED. Library tampered; change control bypassed; pharmacy approval not obtained."
NPC: David Osei: "CLAIM-HC-003 says the drug library is trustworthy because changes require pharmacy governance approval. That didn't happen here. The attacker changed the library without going through any approval process. The claim is gone."
TEACHES: Safety claims that depend on change-control processes are only as strong as those processes. An attacker who bypasses change control silently invalidates the claim.

TRIGGER: Player asks Helen Carver "Is CLAIM-HC-007 being followed?" (dialogue branch 6, unlocked after dual-auth panel interaction)
CAUSES: safety_claim_hc007_assessed = true
PHYSICAL: Command Board: "[t] SAFETY CLAIM ASSESSED — CLAIM-HC-007 (Integrated Incident Response). Dual-authorisation process engaged. Clinical impact assessed before isolation."
NPC: Helen Carver: "CLAIM-HC-007 says our incident response won't create new safety hazards, provided we integrate IT and clinical decision-making. By getting Ravi and David to both sign off before isolating — by talking to Sarah about what the ward needs — we followed that claim. It's the one thing that worked."
TEACHES: CLAIM-HC-007 is the only claim being actively honoured. Its requirements — joint IT/clinical authorisation — are exactly what the dual-auth panel enforces. Players who follow the process satisfy the claim.
```

---

### Degraded / Losing States

No hard "fail" state — the scenario always reaches the debrief. However, degraded outcomes accumulate and are presented honestly in the debrief. Players should feel the weight of every failure.

**Patient deaths:** Both Bed 4 and Bed 2 patients can die. Deaths are recorded permanently on the Command Board, change NPC dialogue throughout the remaining scenario, and are the centrepiece of the debrief's patient outcome section. The scenario does not end — players carry the consequences forward.

**Regulatory fine:** If `ico_deadline_missed = true`, the debrief presents an ICO enforcement notice. Based on the scale of the breach (patient data, clinical records, over 350,000 patients served), the fine could reach £17.5 million under UK GDPR. NHS England also opens a formal Serious Incident investigation. These are presented as inevitable debrief consequences, not player-resolvable during the scenario.

**Backup reinfection:** If `backup_reinfected = true`, the debrief notes five additional days of manual clinical operations, a second ransomware cleanup, and a board-level inquiry into why a compromised backup was used against explicit technical advice.

**Worst-case scenario (all failures):** Both patients deceased, ICO fine issued, backup reinfected, safety claims never assessed. The debrief presents this as a systemic failure with individual consequences — not as player punishment, but as the honest answer to "what does a poorly-managed cyber-physical incident cost?"

---

### Completing / Winning States

The scenario transitions to Phase 4 (debrief) when:
- `backup_recovery_source` is set (any choice made)
- `network_isolated = true` (by either route)
- `drug_library_verified = true` OR a decision about pump withdrawal has been made via David Osei dialogue

Dr Sharma's debrief then runs as a closing dialogue sequence. It reflects every decision made — good, bad, or not made at all — without softening. The scenario is complete when `debrief_complete = true`.

**The "best achievable" outcome** is not zero harm — it is informed, joint decision-making with honest assessment of the safety cases. A player can do everything right and still have one patient outcome that reflects the structural failures that existed before they arrived. The debrief acknowledges this: *"You couldn't fix eighteen months of decisions in two hours. But you followed the process that existed."*

**Outcome spectrum:**
- Both patients alive, ICO notified, cloud backup, all three claims assessed, dual-auth used → debrief acknowledges good decision-making; structural root causes still named
- One or both patients deceased, ICO deadline missed, compromised backup → debrief names each failure by its cause and consequence, without melodrama
- All failures → debrief is a full accounting of what the incident cost: lives, regulatory sanctions, public trust, and the collapse of every safety claim the Trust had on paper

---

## Section 4: NPC Design

---

### NPC: Charge Nurse Sarah Mitchell

**Appearance location:** Room 1 — Ward 7, on patrol between monitoring station and patient beds
**Background:** A senior charge nurse with fifteen years on the ward, Sarah is calm under clinical pressure but out of her depth with the IT failure. She knows how to run the ward without computers — she's done it before during planned downtime — but this feels different, and she's worried about Bed 4.
**Initial stance:** Focused on clinical operations. Wants someone to explain what is happening with the computers so she can plan. Not hostile — just stretched.
**Key information she holds:** The monitoring station went offline at approximately 22:30. She's been doing manual rounds ever since. She noticed something unusual about the pump console earlier. She does not know about the drug library compromise.

**Dialogue branches:**
1. *"What's happening with the computers?"* — explains ransomware in plain terms, describes what she's lost: central monitoring, fleet console, electronic prescribing. Sets scene for players.
2. *"Can you tell me about Bed 4?"* — describes the patient, the missed alarm risk, prompts players to escalate. Triggers `ATTENDED` state if players choose "Get help to Bed 4 now."
3. *"What do you need from us?"* — requests: restore monitoring if possible; tell her if it's safe to keep using the pumps; give her an honest estimate of how long they'll be on paper.
4. *"We're going to isolate the clinical network"* — concern: "That means no EHR at all. I need pharmacy at every med round. Will the pumps still run?" (They will, on last settings, but no remote adjustments possible.)
5. *"The drug library has been tampered with"* (requires `drug_library_compromised = true`) — alarmed: "Every pump on this ward? We need to stop every infusion and recheck every dose manually." Triggers pharmacist NPC to appear on ward.

**How she reacts to state changes:**
- `network_isolated = true`: "So it's paper everything now. Right." Begins issuing instructions to nursing staff (brief animation of her at whiteboard).
- `patient_bed2_state = SEDATED`: breaks dialogue to rush to Bed 2.
- `major_incident_declared` (already true): dialogue reflects this — "I know it's a Major Incident, I just need to know what it means for my patients."

**SIS teaching purpose:** The practical/clinical operational perspective. She understands the safety consequences viscerally but not the IT context. Her concerns are the ones IT teams often don't hear.

---

### NPC: Ravi Anand — Information Security Manager

**Appearance location:** Room 2 — IT Security Office, at his laptop
**Background:** Ravi has been awake since 22:30. He's been through this kind of incident before at a previous trust but not here, and not this severe. He knows exactly what happened and is frustrated that the SIEM alerts were missed overnight. His team is two analysts, both currently on other tasks.
**Initial stance:** Urgently focused on containment. Wants to isolate the clinical network now. Understands this has clinical consequences but believes the security risk is more pressing. Has been arguing with Carver about it.
**Key information he holds:** The full attack timeline (reconstructed from logs). The VPN anomaly. The network topology and the dual-homed workstation problem. His dual-authorisation code.

**Dialogue branches:**
1. *"Walk me through what happened"* — full attack chain from VPN credential use through to ransomware deployment. Explains the dual-homed workstation as the pivot point.
2. *"Why didn't the alerts fire?"* — explains alert fatigue, migration noise, low-severity classification. Requires `siem_escalated = true` to unlock the full retrospective.
3. *"Should we isolate the clinical network?"* — strongly in favour. "The attacker may still have access. Every minute we leave that link open, we're at risk." Sets up the tension with Carver/Hartley.
4. *"What about the drug library?"* (requires `vpn_anomaly_identified = true`) — "If they got into the clinical zone, I don't know what they touched. We need to verify every configuration before we trust those devices."
5. *"What's the code for the panel?"* — gives dual-auth code after `siem_escalated = true`. "Don't use it without David Osei's code. This has to be a joint call."

**How he reacts to state changes:**
- `siem_missed_alerts = true`: more frustrated tone — "The alerts were there. We just didn't act on them."
- `network_isolated = true` (via panel): visible relief. "Good. Now we need to inventory every device that was on that segment."
- `drug_library_verified = true`: "This was not just ransomware. Someone was in the clinical zone specifically. This is a targeted attack, not just opportunistic encryption."

**SIS teaching purpose:** Security-response perspective. His instinct — isolate immediately — is correct from a security standpoint but incomplete from a safety standpoint. Represents the governance gap between IT security and clinical operations.

---

### NPC: David Osei — Clinical Engineering Manager

**Appearance location:** Room 3 — Major Incident Room
**Background:** David manages the clinical engineering team responsible for medical device procurement, commissioning, and maintenance. He has been called in overnight and is deeply worried — not about the IT systems, but about the devices. He's been asking for a formal governance structure linking his team to IT security for six months; this incident is exactly what he warned about.
**Initial stance:** Supports network isolation (unlike Carver's hesitation) but insists on device verification before pumps go back to full operation. Holds his dual-authorisation code but won't give it without assurance that the clinical consequences have been considered.
**Key information he holds:** Device inventory and firmware versions. His dual-authorisation code. The knowledge that the pump firmware update mechanism is unsigned — meaning a compromised console could have pushed malicious firmware.

**Dialogue branches:**
1. *"What's the situation with the devices?"* — explains the fleet: 480 pumps, 320 monitors, 60 vents. Most on last programmed settings. The management console is encrypted. Devices are running but unmanageable.
2. *"Is it safe to keep using the pumps?"* — "I don't know. That's the problem. If someone accessed the management console, they could have changed the drug library. Without verifying it, I can't tell you the guardrails are working."
3. *"Give me your code for the isolation panel"* — "I need to know the clinical impact has been assessed. Have you spoken to Nurse Sarah? To Hartley? I won't approve this blind." Requires players to have spoken to at least one clinical NPC first.
4. *"We found evidence the drug library was tampered with"* (requires `drug_library_verified = true`) — "Then those pumps are unsafe. I need to pull every pump that was on the affected VLAN for firmware verification. That means manual IV administration on the entire ward. That's a massive nursing workload — Sarah needs to know."
5. *"What should we have done differently?"* — the governance reflection: "IT should have been talking to my team months ago. We knew the segmentation was incomplete. I flagged it. But there was no structure for us to sit in the same room and make decisions together."
6. *"Is CLAIM-HC-001 still valid?"* (unlocked after player has interacted with the network map) — **Safety case advisory moment.** David explains what the claim says — network segmentation protects device integrity — and asks the player: *"Based on what you've seen on that map, do you think that claim holds?"* Player responds yes or no. David: "It doesn't. It hasn't for eighteen months. The dual-homed workstations and the legacy wards are explicitly excluded from the claim's conditions. We've been operating with a safety case that doesn't reflect reality." Sets `safety_claim_hc001_assessed = true`.
7. *"Is CLAIM-HC-003 still valid?"* (unlocked after `drug_library_verified = true`) — **Safety case advisory moment.** David shows the player the claim text: drug library changes require pharmacy governance approval. He asks: *"Did this change go through pharmacy approval?"* Player: no. David: "Then the claim is invalidated. The safety barrier the pumps depended on was removed without authorisation or detection. That's the integrity-to-safety pathway in practice." Sets `safety_claim_hc003_assessed = true`.

**How he reacts to state changes:**
- `network_isolated = true`: "Right. Now I need a device inventory — everything that was on the legacy segment before isolation."
- `pump_dose_error = true`: deeply concerned — "This is what I was afraid of. Without the guardrails, a simple keystroke error becomes a patient safety event."
- `patient_bed2_state = DECEASED`: quietly: "The pump accepted a lethal dose because the drug library said it was fine. That's a safety case failure. CLAIM-HC-003 was the promise that this couldn't happen."

**SIS teaching purpose:** Safety-first perspective and explicit safety case custodian. David is the person in the organisation who understands that safety cases are only valid when their conditions are met — and who recognises when an attack has silently invalidated them. Players who engage his safety case dialogue branches understand that cyber attacks do not just break systems: they break the arguments on which safety is founded.

---

### NPC: Helen Carver — Chief Information Officer

**Appearance location:** Room 3 — Major Incident Room
**Background:** Helen has been running IT for this trust for four years. She has managed outages before but nothing like this. She is under pressure from the Trust Board, NHS England, and the media (a journalist has already called). She is trying to balance speed of response with avoiding additional harm — and she's very aware that isolating the clinical network will remove EHR access for clinical staff.
**Initial stance:** Wants to isolate but is being cautious about the clinical consequence. Has been in dialogue with the ward sister (not Sarah, but the overall ward manager) who is worried about the EHR loss. Needs the players to give her a clear picture before she authorises anything.
**Key information she holds:** The trust board's risk appetite. The ransom demand (£1.2M). The vendor contact details. The existence of the cloud backup (EHR vendor).

**Dialogue branches:**
1. *"What are our options for the network?"* — sets out the dilemma clearly: isolate (clinical consequence) or don't isolate (continued security risk). Wants players' recommendation.
2. *"What about the ransom?"* — "We are not paying. That's Trust Board policy, and it's the right call. I need to know we have a recovery path that doesn't involve paying a criminal." Points players to backup recovery console.
3. *"Have you notified NCSC?"* — "We've called them. They're sending incident responders. But I need to know the clinical picture before I brief them fully."
4. *"Should we isolate the network now?"* — will authorise only if players have engaged with the dual-authorisation panel process. "I need Ravi's and David's authorisation on record. This is too big a decision for one person."
5. *"What about the ICO notification?"* — "72-hour GDPR window. We're in it now. I need the notification console in this room — can you help draft the submission?" Emphasises that this runs in parallel, not after everything else is resolved.
6. *"Is CLAIM-HC-007 being followed?"* (unlocked after dual-auth panel is engaged) — **Safety case advisory moment.** Helen finds the relevant claim in a printed incident response plan on the table: *"Provided that IT security containment decisions are integrated with clinical safety impact assessments, network isolation will not create patient safety hazards."* She asks the player: *"Have we done that? Have we actually integrated the two?"* If `itsec_authorised = true` AND `clinical_eng_authorised = true` AND at least one clinical NPC has been consulted: player can answer yes, and Helen agrees. Sets `safety_claim_hc007_assessed = true`. If players have isolated the network without the dual-auth process, Helen notes: "We made a containment decision without David's sign-off and without a clinical impact assessment. That claim isn't being honoured. And now we're seeing why it matters."

**How she reacts to state changes:**
- `network_isolated = true`: "We're committed now. Get pharmacy to every ward. What's the EHR recovery timeline?"
- `backup_recovery_source = CLOUD`: "Eighteen hours. We can do this."
- `backup_recovery_source = NAS or TAPE`: "Ravi's advised against that. Are we sure?" (If players confirm NAS/Tape despite warning, she signs off but with doubt.)
- `patient_bed4_state = DECEASED` or `patient_bed2_state = DECEASED`: her tone shifts entirely — quieter, more careful. "I have to call the Trust Board. And the families. And the ICO." She becomes focused on consequence management rather than incident response.
- `ico_deadline_missed = true`: "We've missed the window. That's a fine. How much? Under UK GDPR, potentially up to £17.5 million. And an NHS England investigation on top." She is not angry — just exhausted and clear-eyed about what comes next.

**SIS teaching purpose:** Organisational leadership under compound pressure: security, safety, regulation, and reputation simultaneously. The safety case advisory branch positions her as the person who must formally account for whether the incident response plan — and the safety claims it is built on — is being followed. She is not just managing an IT incident; she is accountable for whether the organisation's safety argument remains valid.

---

### NPC: Dr Fiona Hartley — Caldicott Guardian

**Appearance location:** Room 3 — corner, on phone initially; becomes available for dialogue after ~5 minutes
**Background:** A consultant anaesthetist who also holds the Caldicott Guardian role — responsible for information governance, particularly patient confidentiality. She is primarily concerned about the loss of EHR access: without it, clinicians cannot verify allergies or drug interactions, creating a different category of safety risk.
**Initial stance:** Opposed to hasty network isolation without compensating controls in place. Not opposed to isolation in principle — but wants pharmacy and senior clinical review at every bedside before it happens.
**Key information she holds:** The clinical risk of EHR loss. The duty of candour obligations. The ICO notification requirements.

**Dialogue branches:**
1. *"What's your concern with isolating the network?"* — explains allergy risk: "If a patient has a penicillin allergy and the prescribing clinician can't check the EHR, we're relying on the patient to tell us. In a post-operative patient who is drowsy, that could be fatal."
2. *"What compensating controls do we need?"* — pharmacy at every drug round; paper MAR charts at every bed; verbal allergy check protocol activated.
3. *"What are our notification obligations?"* — explains GDPR 72-hour window, NHS DSP Toolkit serious incident reporting, and patient duty of candour. Points to notification console.
4. *"The drug library was tampered with — does that change things?"* — "Yes. We now have a patient safety incident caused by a cyber attack. That changes our duty of candour — we may have an obligation to inform patients who were on those pumps."
5. (Post-isolation) *"Now what?"* — "We need a record of every clinical decision made while the EHR was down. Every manual drug administration. This will be scrutinised."

**SIS teaching purpose:** Regulatory/compliance and patient-rights perspective. Represents the dimension of patient safety that is about information governance, not just device function. Illustrates that isolating systems has information safety consequences, not just operational ones.

---

### NPC: Pharmacist (unnamed, appears on ward)

**Appearance location:** Room 1 — appears on ward after `drug_library_compromised = true` is set or after `network_isolated = true` (dispatched by Carver)
**Background:** A senior ward pharmacist, redeployed to provide manual medication verification as a compensating control.
**Patrol behaviour:** Moves between the nursing station and each bed in sequence, pausing at each — performing the manual verification role that the electronic system normally automates.
**Dialogue (single line, context-sensitive):**
- Normal (after network isolation): *"Without the console I have to check every dose manually. It's slower but it's the only way to be sure."*
- After `drug_library_verified = true`: *"If the library was tampered with, we need to go back through every infusion in the last 24 hours. That's a lot of charts."*
- After `pump_dose_error = true`: *"I'll check this now. This is exactly why the double-check exists."*

**SIS teaching purpose:** The compensating control in action. Illustrates that human verification can substitute for automated safety functions — but at significant cost in time, workload, and error risk.

---

### NPC: NCSC Lead Investigator — Dr Priya Sharma

**Appearance location:** Room 3 — Major Incident Room, arrives at scenario end (Phase 4)
**Background:** Dr Sharma is an NCSC incident responder with a specialism in healthcare cyber-physical incidents. She has seen this kind of attack before. She is not there to judge — she is there to help the Trust understand what happened, why, and what it means going forward. She delivers the debrief.
**Initial stance:** Calm, professional, thorough. She has reviewed the Command Board before speaking to players. She knows the outcome before they tell her.
**Key information she holds:** The full picture — patient outcomes, regulatory status, safety claim validity, root causes. She presents this back to players clearly and without softening it.

**Debrief structure (delivered as a closing dialogue sequence, one topic at a time):**

1. **Patient outcomes** — reads from the Command Board. Names the patients by bed number. States clearly what happened and why: *"Bed 4: cardiac arrhythmia. The alarm ran for [X] minutes before a nurse reached the patient. The central monitoring station was offline. [If deceased: She did not survive.] [If attended in time: The response came in time.] The monitoring loss was a direct consequence of ransomware reaching the clinical zone via an incompletely segmented network."*

2. **Safety claims** — names each claim assessed or not assessed, and its status: *"CLAIM-HC-001 was invalid before this attack began. The dual-homed workstations and legacy flat segments had breached the claim's conditions for eighteen months. Nobody checked. CLAIM-HC-003 was invalidated by the attacker in under four hours. CLAIM-HC-007 — the one claim about incident response — [was / was not] honoured, depending on whether your team used the dual-authorisation process."*

3. **Regulatory consequences** — states the ICO position: *"You [notified / failed to notify] the ICO within the 72-hour window. [If missed: The Information Commissioner's Office will open an enforcement investigation. On a breach of this scale — 350,000 patients, clinical records, two patient safety events — the fine could reach £17.5 million under UK GDPR. NHS England will also conduct a formal Serious Incident review.] [If notified: Your ICO notification was timely and substantive. That doesn't prevent an investigation, but it demonstrates good faith and will matter."*

4. **Root causes** — the five gaps from the post-incident review: no MFA on VPN; incomplete segmentation; alert fatigue; no immutable backups; no joint IT/clinical engineering governance. *"None of these were unknown. Three were on the IT audit register. The governance gap had been flagged by David Osei six months ago. This incident was not unforeseeable — it was unfunded."*

5. **Closing SIS lesson** — one clear statement: *"Every safety function that failed today — the monitoring station, the drug library guardrails, the electronic prescribing — depended on IT infrastructure that was not treated as safety-critical. The moment the enterprise network was compromised, the clinical safety case started collapsing. Security and safety were never designed to be separate here. They just ended up that way."*

**How outcome varies by player decisions:**
- Every death is named and attributed to a specific chain of decisions
- Every safety claim correctly assessed is acknowledged: "You identified that CLAIM-HC-003 was invalidated. That's the right analysis."
- Every good decision is noted without being effusive — the debrief is informative, not a medal ceremony
- If all three claims were assessed and the dual-auth process was followed: *"You did what the safety case required. That doesn't make the outcome painless. But it means the framework worked — where it existed."*

**SIS teaching purpose:** The debrief is the explicit SIS teaching moment. Everything the player experienced is reframed in terms of safety cases, security-safety dependencies, and organisational governance. Dr Sharma names the concepts directly. Players leave with a clear articulation of what Security-Informed Safety means in practice — not as a theory, but as the thing that was missing when people died.

---

## Section 5: Objectives and Task Flow

---

### Phase 1 — Scene-Setting (10–15 minutes)

**Objective 1: Understand the situation on the ward** *(mandatory)*

**Unlocks when:** Scenario start
**Player task:** Enter Ward 7. Observe the environment. Speak to Charge Nurse Sarah. Interact with the monitoring central station. Observe Bed 4.
**Location:** Room 1
**Interactions required:** Sarah NPC (dialogue branches 1 and 2); Patient Monitoring Central Station (observe); Ward Alarm Panel (observe); call bell on Bed 4 (optional)
**Completion condition:** `ehr_status` noted as online-but-degraded; `ward_monitor_status = OFFLINE` confirmed; Sarah's situation briefed; players have identified Bed 4 as a concern
**Consequence on completion:** Bed 4 escalation dialogue option becomes available. Sarah gives players the RFID card for the corridor door (or tells them to find Ravi). Command Board: `[t] WARD 7 SITUATION ASSESSED`.
**Time pressure:** Soft — Bed 4 patient clock is running from scenario start.
**SIS concept illustrated:** Clinical consequence of IT system loss; the first direct encounter with the cyber-physical chain.

---

**Objective 2: Escalate Bed 4** *(mandatory, time-sensitive)*

**Unlocks when:** Objective 1 complete
**Player task:** Use the escalation dialogue option with Sarah to get help to the cardiac patient in Bed 4.
**Location:** Room 1
**Interactions required:** Sarah NPC (dialogue branch 2, escalation choice)
**Completion condition:** `patient_bed4_state = ATTENDED`
**Consequence on completion:** Second nurse rushes to Bed 4. Ward alarm shifts from DISTRESSED to ATTENDED state. Sarah becomes available for further dialogue. Command Board: `[t] BED 4 PATIENT ESCALATED — Clinical team responding`.
**Time pressure:** Yes — if not completed before the 15-minute timer, patient reaches `CRITICAL` state automatically (scenario continues but with worse outcome noted on Command Board).
**SIS concept illustrated:** Monitoring availability as a patient safety function; incident response must account for clinical as well as IT consequences from the start.

---

### Phase 2 — Discovery (15–20 minutes)

**Objective 3: Collect paper medication charts** *(mandatory)*

**Unlocks when:** Objective 1 complete
**Player task:** Find and collect the paper MAR charts from the nursing station desk drawer.
**Location:** Room 1
**Interactions required:** Nursing station desk prop
**Completion condition:** `paper_charts_collected = true`
**Consequence on completion:** Bedside Infusion Pump Terminal (Bed 2) becomes fully interactive. Command Board: `[t] PAPER MAR CHARTS RETRIEVED`.
**Time pressure:** No
**SIS concept illustrated:** Fallback procedures as physical artefacts that must be actively located and used.

---

**Objective 4: Review the SIEM and VPN logs** *(mandatory)*

**Unlocks when:** Players enter Room 2 (after RFID door)
**Player task:** Complete the SIEM Alert Dashboard challenge (escalate correct alerts). Identify the VPN anomaly on the VPN log terminal.
**Location:** Room 2
**Interactions required:** Ravi Anand NPC (dialogue branch 1 to orient); SIEM Alert Dashboard terminal; VPN Log Terminal (vm)
**Completion condition:** `siem_escalated = true` AND `vpn_anomaly_identified = true`
**Consequence on completion:** Ravi provides full attack timeline briefing and hands over RFID card for server cabinet. Command Board auto-updates with both findings.
**Time pressure:** No
**SIS concept illustrated:** Alert fatigue; monitoring gap; credential abuse as initial access; the retrospective visibility of an attack that could have been stopped earlier.

---

**Objective 5: Programme the infusion pump** *(mandatory)*

**Unlocks when:** `paper_charts_collected = true`
**Player task:** Interact with the Bed 2 pump prop to open the Bedside Pump Terminal minigame. Transcribe the dose from the paper chart. Apply the double-check protocol.
**Location:** Room 1 — Bed 2
**Interactions required:** Infusion pump prop; paper MAR charts (in inventory)
**Completion condition:** `pump_dose_correct = true` OR `pump_dose_error = true` (both complete the objective; outcome differs)
**Consequence on completion:** Patient Bed 2 state update (stable or sedated). Command Board: `[t] BEDSIDE PUMP PROGRAMMED — [CORRECT / ERROR DETECTED LATE]`. Pharmacist NPC reacts.
**Time pressure:** No hard timer, but `fleet_console_status` remains ONLINE at this point — if players isolate the network before doing this, the fleet console goes offline and the pump can only be programmed manually.
**SIS concept illustrated:** Paper fallback as a high-risk procedure; the smart pump's dose-checking guardrail as a safety function; transcription error as the hazard that electronic prescribing eliminated.

---

### Phase 3 — Crisis Decisions (20–25 minutes)

**Objective 6: Understand the network isolation decision** *(mandatory)*

**Unlocks when:** Room 2 entered and Ravi has briefed players
**Player task:** Review the Network Segmentation Map. Understand the legacy exception rules and their role in the attack. Engage with David Osei and Dr Hartley about consequences. Obtain both dual-authorisation codes.
**Location:** Room 2 (network map); Room 3 (Osei, Hartley)
**Interactions required:** Network Segmentation Map (minigame 4, toggle at least one rule); Ravi dialogue (code from cabinet); David Osei dialogue (code + clinical consent); Dr Hartley dialogue (compensating controls)
**Completion condition:** `itsec_authorised = true` AND `clinical_eng_authorised = true` (both codes entered on panel)
**Consequence on completion:** `network_isolated = true`. EHR goes offline. Fleet console goes offline. Corridor warning light activates. All NPC reactions fire.
**Time pressure:** No hard timer, but Bed 4 clinical clock is still running if not already resolved.
**SIS concept illustrated:** Network isolation as a security-safety trade-off; dual-authorisation as a governance control; the requirement to engage both IT security and clinical engineering before acting.

---

**Objective 7: Verify the drug library** *(mandatory)*

**Unlocks when:** Room 3 entered; David Osei has raised the device integrity concern
**Player task:** Complete the Drug Library Integrity Checker VM challenge. Identify the tampered morphine entry.
**Location:** Room 3 — VM terminal
**Interactions required:** Drug Library Integrity Checker (vm, minigame 9)
**Completion condition:** `drug_library_verified = true`
**Consequence on completion:** Command Board: `[t] DRUG LIBRARY TAMPERED — MORPHINE DOSE MAX MODIFIED`. David Osei triggers pump withdrawal discussion. Pharmacist NPC appears on ward.
**Time pressure:** No
**SIS concept illustrated:** Integrity attacks as the insidious dimension of cyber-physical attacks; the drug library as a silent safety barrier; the integrity-to-safety claim (CLAIM-HC-003).

---

**Objective 8: Choose a recovery path** *(mandatory)*

**Unlocks when:** Room 3 entered; Carver has briefed players on the ransom demand and backup situation
**Player task:** Use the Backup Recovery Console to select a recovery source. Read consequences. Confirm.
**Location:** Room 3 — Backup Recovery Console
**Interactions required:** Backup Recovery Console (minigame 7); Helen Carver dialogue (context)
**Completion condition:** `backup_recovery_source` set to any value
**Consequence on completion:** Command Board updates with recovery source and ETA. NPC reactions based on choice.
**Time pressure:** No
**SIS concept illustrated:** Backup architecture (air-gap, immutability) as a recovery dependency; the destroyed backups as a consequence of flat network architecture; recovery time as a clinical safety factor.

---

**Objective 9: Assess safety case validity** *(optional, high educational value)*

**Unlocks when:** Room 3 entered; drug_library_verified = true (for CLAIM-HC-003); network map interacted with (for CLAIM-HC-001); dual-auth panel engaged (for CLAIM-HC-007)
**Player task:** Engage David Osei's safety case advisory dialogue for CLAIM-HC-001 and CLAIM-HC-003. Engage Helen Carver's advisory dialogue for CLAIM-HC-007.
**Location:** Room 3
**Interactions required:** David Osei (dialogue branches 6 and 7); Helen Carver (dialogue branch 6)
**Completion condition:** At least two of the three `safety_claim_*_assessed` variables set to true
**Consequence on completion:** Command Board logs each assessed claim. Dr Sharma's debrief explicitly references the claims the player engaged with.
**Time pressure:** No
**SIS concept illustrated:** Safety cases as living documents; cyber attacks can silently invalidate safety claims; the security team's role in assessing whether safety case conditions still hold.

---

**Objective 10 (optional): Notify NCSC and submit ICO notification**

**Unlocks when:** Room 3 entered
**Player task:** Use the Ransomware Impact Display action button to formally report to NCSC. Submit the ICO notification before the 72-hour countdown expires.
**Location:** Rooms 1 and 3
**Interactions required:** Ransomware Impact Display (REPORT TO NCSC button); ICO notification (simplified decision via Dr Hartley dialogue or Disclosure Console if implemented)
**Completion condition:** `ncsc_notified = true` AND `ico_notified = true` before deadline
**Consequence on completion:** Command Board: `[t] NCSC NOTIFIED` and `[t] ICO NOTIFIED`. Dr Hartley: "Good. That's one thing done right."
**Failure consequence:** `ico_deadline_missed = true` — fine and investigation presented in debrief
**Time pressure:** Yes — ICO 72-hour window; the in-game timer runs from scenario start
**SIS concept illustrated:** Regulatory obligations as parallel obligations, not afterthoughts; disclosure timing as a governance decision with legal and reputational consequences.

---

### Phase 4 — Resolution and Debrief (8–12 minutes)

**Objective 11: NCSC debrief** *(mandatory)*

**Unlocks when:** Objectives 6, 7, and 8 complete
**Player task:** Dr Priya Sharma (NCSC Lead Investigator) arrives and delivers the structured debrief. Players listen and can ask follow-up questions using a simplified dialogue menu. The debrief covers patient outcomes, safety case status, regulatory consequences, and root causes.
**Location:** Room 3
**Interactions required:** Dr Sharma NPC (debrief dialogue sequence); Major Incident Command Board (players should review it before Sharma speaks)
**Completion condition:** `debrief_complete = true` (set when all five debrief topics have been delivered)
**Consequence on completion:** Scenario ends. The Command Board remains on screen showing the full timeline. A printed summary card (physical prop) is distributed to players — a one-page incident summary they can take away.
**Time pressure:** No
**SIS concept illustrated:** Full arc — the debrief makes explicit what the scenario demonstrated implicitly: that security and safety were never designed to be separate; that safety cases depend on security controls remaining valid; and that the cost of getting this wrong is measured in lives, fines, and institutional trust.

---

## Section 6: SIS Teaching Moment Mapping

| Game Event | SIS Concept | CyBOK SIS TG Topic | Learning Outcome |
|---|---|---|---|
| Ransomware reaches clinical zone via dual-homed workstations | Architecture — IT/OT boundaries and their failure modes | Architecture | Players understand that incomplete network segmentation directly enables cyber attacks to propagate into safety-critical clinical systems |
| Monitoring central station offline; Bed 4 alarm undetected (and potentially fatal) | Cyber attack → loss of functional safety → emergent physical hazard | Language and Concept Alignment | Players experience the cyber-physical chain firsthand, with real stakes: IT failure produces a patient safety event that can result in death |
| SIEM alerts dismissed as migration noise overnight | Incident Response and Resilience — detection and triage failure | Incident Response and Resilience | Alert fatigue is an enabling condition for attack escalation; monitoring effectiveness is itself a security-safety dependency |
| Network isolation decision: sever link to stop attacker vs. lose EHR access | Requirements Reconciliation — security controls with safety side-effects | Requirements Reconciliation | The standard security response (isolation) directly compromises a clinical safety function (medication verification); the trade-off must be made consciously |
| Dual-authorisation panel requires both IT Security and Clinical Engineering sign-off | Organisational Culture — governance integration across IT and clinical domains | Organisational Culture | Safety-critical security decisions require joint authority; unilateral IT action can create safety hazards that joint decision-making would prevent |
| Drug library integrity check: morphine dose max 4 → 40; smart pump guardrails disabled | Architecture — integrity as a safety property; silent failure modes | Architecture / Language and Concept Alignment | Integrity attacks are invisible until harm occurs; the device continues operating while the safety function it provides has been silently removed |
| Patient death from pump overdose when drug library tampered and dose error combined | Language and Concept Alignment — the integrity-to-safety pathway at its most direct | Language and Concept Alignment | When a safety barrier (drug library guardrail) is removed by an attacker, a routine clinical error (keystroke transcription) becomes lethal |
| Bedside pump programming: transcription error, double-check protocol | Incident Response and Resilience — fallback procedures and their inherent risks | Incident Response and Resilience | Paper-based fallback is itself a hazard — it removes the electronic safety guardrails that the system was designed to provide |
| CLAIM-HC-001 assessed as invalid — segmentation conditions breached for 18 months | Patching of Systems with Safety Cases — safety cases as living documents | Patching of Systems with Safety Cases | A safety case can become invalid without anyone noticing; security degradation silently undermines the safety argument |
| CLAIM-HC-003 assessed as invalid — drug library change control bypassed by attacker | Patching of Systems with Safety Cases — attacker-induced claim invalidation | Patching of Systems with Safety Cases | An attacker who bypasses change-control processes invalidates the safety claims that depend on those processes; integrity of process is a safety requirement |
| CLAIM-HC-007 assessment: did the incident response integrate IT and clinical decision-making? | Organisational Culture — the safety case for joint governance | Organisational Culture | CLAIM-HC-007 is the only claim the response team can actively honour; its requirements map directly to the dual-authorisation process |
| ICO deadline missed; £17.5M fine and NHS England investigation in debrief | Tools and Standards — regulatory obligations running in parallel with technical response | Tools and Standards | Regulatory notification obligations are time-critical and cannot be deferred until the technical response is complete; missing the window is itself a consequential decision |
| Dr Sharma debrief: patient outcomes, claims, fines, root causes named explicitly | All TG topics — integrated closing reflection | All | Players receive a structured, honest account of what happened, why, and what it means — naming the SIS concepts that explain each failure and each success |

---

### Narrative Learning Summary

A player who completes this scenario should leave understanding something that is not obvious before they play it: **the hospital's cyber security failures and its patient safety failures are not two separate events — they are one event with two faces.**

The ransomware attack did not "cause" an IT outage that "separately" caused patient harm. The attack reached the patient because the network was never properly segmented. The monitoring station went dark because it ran on the same infrastructure as the finance workstation that got phished. The dose error became possible because the electronic guardrails that stopped it were locked to the same encrypted console. These are not coincidences or bad luck — they are the predictable consequence of building clinical safety functions on top of IT infrastructure without treating that infrastructure as a safety-critical dependency.

The scenario also delivers a second, subtler insight: **the standard security response can itself be a safety hazard.** Isolating the network is correct from a security standpoint. But isolation removes the EHR, which removes allergy checking, which creates a different patient safety risk. The player who isolates the network without coordinating with clinical engineering has solved one problem and created another. The player who engages both Ravi Anand and David Osei before acting has learned something real about how security-informed safety decisions must be made: jointly, with full visibility of both the security and the clinical consequence.

---

## Output Checklist

- [x] At least one RFID/physical lock mechanic — RFID corridor door (Room 1→2); RFID server cabinet (Room 2)
- [x] At least one PC/VM terminal challenge — VPN log terminal; drug library integrity checker
- [x] At least one physical alarm or gauge that changes state — Ward alarm panel; corridor warning light; Bed 4 bedside monitor alarm
- [x] At least one NPC dialogue tree with genuine branching based on player choice — All five major NPCs have branching based on global state
- [x] At least two distinct SIS trade-off decisions — Network isolation (security vs. EHR access); device withdrawal for firmware verification (safety vs. clinical availability)
- [x] Patching constraint tension explicitly represented — Drug library integrity/firmware verification challenge; David Osei's dialogue about returning devices to service
- [x] Scenario completable in 45–75 minutes — Phased design: ~12 min Phase 1, ~18 min Phase 2, ~22 min Phase 3, ~8 min Phase 4 = ~60 min nominal
- [x] SIS teaching moment map covers at least 8 distinct learning outcomes — 11 rows covering full arc
