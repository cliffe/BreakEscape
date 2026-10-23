# BreakEscape Scenario Walkthrough — Northgate General Hospital
## Healthcare Case Study: Ransomware Incident Response

**Scenario Name:** Northgate General Hospital — The Ransomware Incident  
**Duration:** 50–70 minutes  
**Player Role:** Incident responder (IT/security background), arriving on-site as the attack's scope becomes clear  
**Scenario Start Time:** 07:30 (Wednesday, 9 hours after the incident was declared)

---

## Overview: The Security-Informed Safety Arc

This walkthrough describes the actual game experience as players navigate three physical locations (Ward 7, IT Security Office, Major Incident Room) and make decisions that cascade through a safety-critical healthcare system under cyber attack. The scenario has four phases:

1. **Phase 1 — Scene-Setting (10–15 min):** Ward 7; establishing the clinical consequence of IT failure
2. **Phase 2 — Discovery (15–20 min):** IT Security Office; understanding the attack and network topology
3. **Phase 3 — Crisis Decisions (20–25 min):** Major Incident Room; making high-consequence trade-off decisions
4. **Phase 4 — Resolution/Debrief (8–12 min):** NCSC debrief; structured reflection on what happened and why

**Global Variable Tracking:** Throughout, the scenario maintains state through global variables (`ward_monitor_status`, `network_isolated`, `drug_library_compromised`, patient states, etc.) that drive both visible environmental changes and NPC dialogue branches.

---

## Phase 1: Ward 7 — "Something's Not Right"

### Room: Ward 7 Clinical Bay (Room Type: `room_reception` or custom NHS ward bay, 2×3 GU / 10×14 tiles)

**Setting:** An open-plan inpatient ward bay with six beds arranged in a row. Each bed has a bedside monitor, IV pole, and infusion pump. A nursing station sits at one end with workstations and a large wall-mounted **Patient Monitoring Central Station** (a 50-inch screen above the desk). Ward alarm panel on the wall near the exit. The room smells faintly of antiseptic and has the slightly worn look of an active NHS ward — printed shift notes on a whiteboard, visitor notices on the walls.

**Atmosphere on Entry:**
- The **Patient Monitoring Central Station** (wall screen) displays a ransom note with a countdown timer (71 hours remaining). Dark background, red text: `SYSTEM ENCRYPTED — SEE README_RESTORE.TXT — £1.2M`.
- A **bedside alarm** (Bed 4) is audible — a soft, insistent beeping from a cardiac monitor. Nobody at the nursing station is responding.
- **Charge Nurse Sarah Mitchell** is visible doing manual rounds with a clipboard, moving slowly between beds.
- A patient in a chair beside Bed 2 watches the player approach.
- **Bed 4** has a monitored patient lying still but slightly restless. The bedside monitor shows a cardiac trace with an active alarm indicator.
- **Bed 2** has a post-surgical patient, stable, resting. An infusion pump on a pole beside the bed. The pump display shows the last programmed rate.

### Player Interaction Sequence — Phase 1

#### Interaction 1: Approach and Observe
The player enters the ward. The sound design becomes apparent — the ambient beeping from Bed 4 is continuous but nobody is addressing it. The nursing station workstation displays the ransom overlay, same as the wall screen. The ward **alarm panel** (wall-mounted) shows a single amber light: `MONITORING FAULT`.

**Teaching moment:** The IT attack and the patient safety consequence are visually co-located. The player doesn't yet understand the connection, but they see it.

#### Interaction 2: Dialogue with Charge Nurse Sarah Mitchell
The player approaches Sarah. She is calm but visibly stretched.

**Sarah's initial dialogue branch:** *"What's happening with the computers?"*

Sarah explains:
- The monitoring central station went offline around 22:30 last night (nearly 9 hours ago).
- Since then, the ward has been doing everything manually — hand-checking each patient one by one.
- Two nurses, six beds, no central view, no electronic prescribing access (EHR still online but the ward workstations showing the ransomware).
- "I can't be everywhere. We've been prioritising the acute patients, but I haven't been to Bed 4 in the last ten minutes."

**Critical choice moment: Escalate Bed 4 or Proceed to the Alarm**

If the player chooses the dialogue option **"Get help to Bed 4 now":**
- Sarah immediately breaks off and calls to a second nurse. The second nurse moves quickly to Bed 4 and stays there.
- The bedside alarm continues but is now attended.
- `patient_bed4_state` → `ATTENDED`
- Sarah: "Good. Now, can you tell me what's happening with the systems?"
- The Command Board updates: `[07:35] BED 4 PATIENT ESCALATED — Clinical team responding`.
- The 22-minute timer for patient deterioration resets — players have bought time.

If the player does NOT escalate and instead moves on to investigate the systems:
- The game clock continues to run.
- At 8 minutes: `patient_bed4_state` → `DISTRESSED`. The bedside alarm shifts to a higher frequency. The patient animation changes to show restlessness. Sarah (if nearby): "Something's not right with Bed 4. I can't see it from here."
- At 15 minutes: `patient_bed4_state` → `CRITICAL`. The bedside alarm flattens to a single tone. The ward **alarm panel** shifts — the amber `MONITORING FAULT` is replaced by a red `PATIENT ALARM — WARD 7 BED 4`. A second nurse rushes to the bed and stays.
- At 22 minutes: If not escalated, `patient_bed4_state` → `DECEASED`. The bedside alarm stops. The ward alarm panel shows a steady red indicator `PATIENT DECEASED`. Sarah will later acknowledge this with grief and exhaustion in her tone.
- The **Command Board** (when the player reaches the Major Incident Room) will show the entry: `[07:52] PATIENT DEATH — Ward 7, Bed 4. Cardiac arrhythmia. Central monitoring offline at time of deterioration. Clinical team response delayed 22 minutes.`

**SIS Teaching Moment:** Monitoring as a patient safety function; the visible consequence of IT system loss is not abstract data loss — it is an unattended alarm and a patient in cardiac distress. This sets the emotional and conceptual tone for everything that follows.

#### Interaction 3: Collect Paper Medication Administration Records (MAR)
Before leaving the ward, the player notices the **nursing station desk**. A drawer is labelled `MAR CHARTS — PAPER BACKUP`.

The player opens the drawer and finds a stack of printed medication administration records (realistic NHS forms) with patient names and doses written by hand. A note inside reads: *"Paper MAR charts — USE IF EHR DOWN."*

Taking the charts sets `paper_charts_collected = true`.

**Teaching moment:** The fallback procedure is physical and must be actively discovered. The paper charts are not just a prop — they will be essential later when the electronic fleet management console is no longer available.

#### Interaction 4: Observe Bed 2 (Optional but Priming)
The player may observe the post-surgical patient in Bed 2, the infusion pump on the IV pole beside the bed, and the ambulatory patient in the nearby chair watching carefully. No interaction is required here, but observant players notice:
- The pump display shows a programmed rate (e.g., "10.0 mg/hr").
- The bedside monitor shows stable vital signs.
- The pump props are realistic — there is a button or NFC tag on the pump casing.

**Priming:** This sets up the Bed 2 infusion pump minigame that will occur later in Phase 2.

#### Interaction 5: RFID-Locked Door — Ward to Corridor
To leave the ward and proceed to the IT Security Office, the player must pass through a staff-only door that has an **RFID lock**. The door is at the ward exit, labelled `STAFF AREA — RFID ACCESS REQUIRED`.

The player can either:
- **Ask Sarah for access:** She provides an RFID card (or tells the player to take one from the desk drawer, same place as the paper charts).
- **Find the card in the desk drawer:** Same drawer as the charts.
- **Locate Ravi Anand in the next room and he provides it after the SIEM briefing.**

Tapping the card to the lock unlocks the door and allows passage to the corridor and the IT Security Office.

**Consequence:** `ward_access_card_obtained = true`.

---

## Phase 2: IT Security Office — "The Alerts Were There"

### Room: IT Security Office (Room Type: `room_office`, 2×2 GU / 10×10 tiles)

**Setting:** A small open-plan office with three or four desks. Two workstations show the ransomware splash. One desk has **Ravi Anand's laptop** — the only operational machine, powered by battery, not domain-joined. A **wall-mounted touch-screen network diagram** displays the hospital's network architecture with three zones and several orange-dashed exception rules. A **physical patch panel rack** is visible in the corner with labelled ports (WARD 7 LEGACY SEGMENT, CLINICAL VLAN, ENTERPRISE). **VPN logs** are printed and stacked on the desk, covered in red pen circles. An **RFID-locked server cabinet** sits near the rack. Post-it notes with crossed-out passwords are visible on the wall.

**Atmosphere:** Signs of a sleepless night — coffee cups, a jacket draped over a chair, exhaustion visible on Ravi's face as he works his laptop while on a phone call.

### Player Interaction Sequence — Phase 2

#### Interaction 1: Dialogue with Ravi Anand — Attack Timeline

The player approaches Ravi at his desk. He is tired but focused. He explains the attack chain:

- **Monday 08:47** — A finance officer opens a phishing email and enables macros.
- **Monday 08:52** — Simultaneously, an attacker authenticates to the VPN gateway using contractor credentials (`m.blake`, no MFA).
- **Tuesday afternoon** — Attacker has domain admin access.
- **Tuesday 22:15** — Ransomware deployed across the enterprise network.
- **Tuesday 23:30** — Ransomware reaches the clinical zone (because three wards were never fully migrated to the separate VLAN).

Ravi: "The SIEM had it. Multiple alerts. Low-severity. They got queued. Dismissed as migration noise." Sets `siem_ready = true`.

#### Interaction 2: SIEM Alert Dashboard Minigame (Minigame 1)

The player sits at Ravi's laptop and opens the **SIEM Alert Dashboard**.

**Minigame 1: SIEM Alert Dashboard Triage**

The screen shows a scrolling log of 20–30 alerts from the last 48 hours. Most are benign: network migration events, scheduled backups, routine maintenance. The player's task is to review each alert and mark it as DISMISS or ESCALATE.

**Alert types present:**
- Benign: Scheduled job completions, backup activities, VPN geo-diversity notifications (expected contractor rotations).
- Critical (buried in the noise):
  1. `Encoded PowerShell execution on FINANCE-WS-07` (Tuesday 10:15)
  2. `LSASS credential dumping on FINANCE-WS-07` (Tuesday 10:22)
  3. `Unusual SMB write volume to DC01` (Tuesday 10:45)
  4. `RDP session: ENTERPRISE-VPN → WARD-MONITOR-01` (Tuesday 11:00)

**Player's task:** Identify and escalate the four critical indicators. Dismiss the benign ones.

**Outcome:**
- **Correct completion** (`siem_escalated = true`): Ravi nods. "Those four are the attack chain. If someone had caught them Tuesday morning, we'd have had sixteen hours before the ransomware fired." He unlocks deeper dialogue about containment options and hands over his **RFID card for the server cabinet** (containing his half of the isolation authorisation code).
- **Incorrect completion** (`siem_missed_alerts = true`): Ravi shows frustration. "The alerts were there. We just didn't act." His dialogue becomes more pointed about the risk of repeating the same monitoring failure.

**Command Board update (auto):** `[t] SIEM ALERTS [ESCALATED / DISMISSED]`

**SIS Teaching Moment:** Alert fatigue as an enabling condition for attack progression. The information that could have stopped the attack was visible but treated as noise. This illustrates the monitoring and detection gap that is part of the Security-Informed Safety arc.

#### Interaction 3: VPN Log Terminal Challenge (Minigame 6 — VM)

On a separate terminal in the room, the player can access the **VPN Log Terminal**. This opens a Linux shell environment with access to `/var/log/vpn/auth.log` and related files.

**Minigame 6: VPN Anomaly Identification (VM Challenge)**

**Scenario:** The player must identify the anomalous VPN session that gave the attacker initial access.

**Files accessible:**
- `/var/log/vpn/auth.log` — 50 VPN authentication entries
- `/home/analyst/contractor_accounts.txt` — list of contractor accounts with geographic zones
- `/home/analyst/check_anomaly.sh` — a helper script that validates submissions

**The anomaly:** One entry stands out:
```
Monday 08:52 | USER: m.blake | IP: 203.0.113.77 (Romania) | MFA: NO | STATUS: SUCCESS
```

The contractor, M. Blake, is normally authenticated from London (08:47 entry) but appears authenticating from Romania at 08:52 with no MFA. This is the attacker's foothold.

**Player's interaction:**
- The player can visually scan the logs or use `grep` to search by IP, time, or username.
- A physical prop (printed VPN logs on the desk) provides the anomaly location as an optional pre-challenge hint.
- Once the player identifies the entry, they run a validation command (e.g., `./check_anomaly.sh 203.0.113.77`) or answer a prompt in the terminal.
- Correct identification emits a flag: `vpn_flag_1`.

**Outcome:** `vpn_anomaly_identified = true`.

Ravi: "That's how they got in. Blake's credentials, no second factor, no geo-block. It's all in the logs — and it happened right while the phishing attack was in motion. Two vectors at once. That's not coincidence."

**Command Board update (auto):** `[t] VPN ANOMALY CONFIRMED — Contractor credentials from Romania, no MFA`

**SIS Teaching Moment:** Credential reuse and absence of MFA as the initial access vulnerability. The evidence was in the logs but went unmonitored.

#### Interaction 4: Network Segmentation Map — Interactive Display (Minigame 4)

The player approaches the **wall-mounted touch-screen network diagram**. This is an interactive SVG diagram of the hospital's network architecture, **directly visualizing the network architecture from the information pack** (`case_1_healthcare/information_pack/system_architecture/network_architecture.md`).

**Minigame 4: Network Segmentation Map**

The screen shows the hospital's network with **four zones** (matching the information pack):
- **EXTERNAL** (red border): Internet, NHS HSCN, vendor VPN
- **ENTERPRISE** (blue border): AD, Email, EHR, File Servers, Admin Workstations (~1,800), Backup (NAS + Tape), SIEM
- **CLINICAL** (green border): Fleet Management Console, Infusion Pumps (480), Patient Monitor Central Stations, Bedside Monitors (320), Ventilators (60), PACS, Imaging Modalities
- **LEGACY** (amber border): Patient Monitors, Ward Workstations, Infusion Pumps (three wards, flat segment, not yet migrated)

**Connection lines** (match the information pack):
- Perimeter firewall (external → enterprise): solid white line, padlock icon
- VPN gateway (external → enterprise, no MFA): dashed line with warning label
- Internal firewall (enterprise → clinical): solid amber line, padlock icon
- **Dual-homed workstations** (enterprise ↔ clinical): dashed orange lines — **these are the primary attack vectors**
- **Legacy flat segment** (enterprise-level flat L2): thick dashed orange line, "NO SEGMENTATION" label

**Toggle and attack path visualization:**

**Player's interaction:** Toggle the legacy exception rules on and off. Each toggle updates a consequence panel and **highlights the attack path in red on the diagram** showing how an attacker would traverse that exception rule.

**Example toggles:**
1. "WARD 7 dual-homed workstation: Clinical + Enterprise access"
   - **Consequence:** `EHR access lost on Ward 7 — medication prescribing reverts to paper`
   - **Attack path visualization:** Red arrow shows: `VPN gateway (Romania) → Enterprise (AD domain admin) → [dual-homed workstation bridge] → FLEET MANAGER`
   - Teaching: This workstation allowed the attacker to pivot from the enterprise ransomware to the clinical network.

2. "IT ROOM → PUMP MANAGEMENT CONSOLE (legacy rule)"
   - **Consequence:** `Fleet management console reachable from encrypted enterprise network`
   - **Attack path visualization:** Red arrow shows direct path from compromised enterprise zone to pump management
   - Teaching: The pump management system, which controls drug library and guardrails, is accessible from the compromised IT infrastructure.

3. "LEGACY FLAT SEGMENT (three wards, no firewall)"
   - **Consequence:** `Clinical devices on legacy wards exposed to enterprise-zone compromise`
   - **Attack path visualization:** Red shading shows the flat L2 network segment with multiple entry points
   - Teaching: The legacy segment has no internal firewall — any compromised workstation on the network can reach devices.

**Game mechanic:** After toggling at least one rule, a large **SEVER** button becomes available on the screen. Pressing SEVER initiates the network isolation — but only after the player has understood the consequence and visualized the attack vectors.

**Outcome (if SEVER is pressed here):**
- `network_isolated = true`
- `ehr_status` → `OFFLINE` (EHR access lost on affected wards)
- `fleet_console_status` → `OFFLINE` (pump management console unreachable)
- The **Command Board** updates: `[t] NETWORK ISOLATED — Clinical zone severed from enterprise`
- The **corridor warning light** (between Room 2 and Room 3) activates (flashing amber).
- NPC reactions fire (not in this room but in the Major Incident Room when the player arrives).

**Alternative path:** Players may NOT press SEVER in Room 2. They can proceed to the Major Incident Room and choose to isolate via the **Dual-Authorisation Panel** instead (which requires both Ravi's and David's codes and adds a governance layer to the decision).

**SIS Teaching Moment:** Network segmentation as both a security necessity and a clinical convenience compromise. The legacy exception rules represent the real-world tension between security and operational efficiency. Severing the network stops the attacker but removes EHR access, creating a different patient safety risk.

#### Interaction 5: RFID-Locked Server Cabinet

After completing the SIEM challenge, Ravi provides the player with an **RFID card** for the server cabinet in the corner (or directs them to take one). Inside the cabinet is a **laminated card with Ravi's four-digit authorisation code** and a USB drive (flavour item — offline backup tooling).

The player does not enter the code yet — it is recorded for later use at the **Dual-Authorisation Panel** in the Major Incident Room.

**Consequence:** `itsec_code_obtained = true`; code stored in inventory for later use.

#### Interaction 6: Transition to Major Incident Room

The player exits the IT Security Office and moves to a corridor (or can be guided by Sarah or Ravi). They encounter a door marked `MAJOR INCIDENT COMMAND CENTRE — AUTHORISED PERSONNEL ONLY`. This door may be unlocked or may require the player to use the RFID card they obtained earlier.

Entering leads to Room 3.

---

## Phase 3: Major Incident Room — Crisis Decisions

### Room: Major Incident Room (Room Type: `room_meeting`, 2×2 GU / 10×10 tiles)

**Setting:** A mid-sized meeting room repurposed as an incident command centre. The atmosphere is pressured and slightly overheated — this is where high-consequence decisions are made. A **large wall-mounted display** shows the **Major Incident Command Board** (initially showing: `[22:38] MAJOR INCIDENT DECLARED — Enterprise IT systems encrypted`). A **whiteboard** has been scrawled with handwritten notes, timelines, and questions. A **physical dual-authorisation keypad** is mounted on an adjacent wall (two separate entry panels, IT Security and Clinical Engineering). A **Backup Recovery Console** (tablet or laptop) sits on one of the desks. A **Drug Library Integrity Checker VM terminal** is set up in a corner. A **printed ransom note** (the full text from the ransomware attack) is visible on the table.

**NPCs present:**
- **Helen Carver** (CIO) — at the head of the table, working her laptop, phone in hand
- **David Osei** (Clinical Engineering Manager) — standing at the whiteboard, reviewing notes
- **Dr Fiona Hartley** (Caldicott Guardian) — in a corner chair, on a phone call initially, but becomes available after ~5 minutes

### Player Interaction Sequence — Phase 3

#### Interaction 1: Dialogue with Helen Carver — Situation Assessment

The player enters the Major Incident Room and immediately sees the **Command Board** on the large wall display. If the player did not escalate Bed 4 in Phase 1, the board will show: `[07:52] PATIENT DEATH — Ward 7, Bed 4. Cardiac arrhythmia. Central monitoring offline at time of deterioration.` This entry is visible before Helen speaks. The player reads it immediately.

Helen outlines the situation:
- Enterprise backups (NAS and tape library) are both encrypted and destroyed.
- The EHR vendor has a cloud copy — restoring it will take **18 hours**.
- The ransom demand is £1.2M.
- Trust Board policy: **"We are not paying. That's not a choice here."**
- Network isolation must be considered to prevent the attacker from reinfecting the cloud restore during the 18-hour window.

#### Interaction 2: Backup Recovery Console Minigame (Minigame 7)

The player sits at the **Backup Recovery Console** (a tablet or laptop on the Major Incident Room table).

**Minigame 7: Backup Recovery Decision**

The console displays three tile options:

1. **NAS — Encrypted (Red X)**
   - "Source: Network-attached storage, primary backup location"
   - "Status: ENCRYPTED — Ransomware reached this device"
   - Consequence: "If restored, malware reactivated into EHR"
   - **SIS teaching:** Air-gapped backups are a design failure — the NAS was on the same network segment.

2. **Tape Library — Wiped (Red X)**
   - "Source: Physical tape archive, secondary backup"
   - "Status: WIPED — Ransomware erasure routine destroyed the catalogue"
   - Consequence: "Restore not possible"

3. **Cloud — Available (Amber)**
   - "Source: Cloud-hosted copy maintained by EHR vendor"
   - "Status: AVAILABLE — Offsite, not reached by local ransomware"
   - "Recovery ETA: 18 hours"

**Player's interaction:** Tap a tile to select it. A consequence panel appears. Confirm the choice.

**Outcomes:**

- **Select NAS:** Helen says, "I'd strongly advise against that. If the malware is in that backup, we're putting it straight back into the system." Ravi (if present): "We'll have to rebuild again from scratch. That's at least five more days of manual operations."
  - `backup_recovery_source = NAS`
  - Later (30 seconds after confirmation): `backup_reinfected = true`
  - **Command Board updates:** `[t] RECOVERY ATTEMPTED FROM NAS — WARNING: Source may be compromised` (immediately), then `[t] EHR RESTORE FAILED — Ransomware reactivated from backup. Second rebuild required.`

- **Select Tape:** Helen: "The tape catalogue is destroyed. We can't restore from a device we can't read."
  - Recovery not possible; effectively same as NAS.

- **Select Cloud:** Helen confirms. "Eighteen hours. We can do this. I need every available pharmacist on the wards to double-check all manual prescriptions."
  - `backup_recovery_source = CLOUD`
  - `recovery_eta_hours = 18`
  - **Command Board updates:** `[t] CLOUD RESTORE INITIATED — EHR recovery ETA 18 hours`

**SIS Teaching Moment:** Backup architecture as a recovery dependency. The destroyed NAS and wiped tape represent a design failure (on-network storage). The 18-hour cloud recovery is the consequence of not having immutable local backups.

#### Interaction 3: Dialogue with David Osei — Device Integrity and Safety Cases

The player turns to David Osei at the whiteboard. David is standing with a **printed folder — the Trust's "Safety Case for Clinical Device Network"** document.

David's dialogue: "I won't give you my authorisation code until we've talked about this."

He points to the document on the table (or opens it). The document shows:
- **Title:** "Northgate General Hospital — Safety Case for Clinical Device Network"
- **Three sub-goals:** Medical Device Integrity, Clinical Data Integrity, Enterprise Isolation
- **Seven key claims** including: **CLAIM-HC-001: Network segmentation maintains separation between the enterprise and clinical zones such that compromise of the enterprise zone cannot propagate to safety-critical devices.**

David: "This is our safety case. This claim — HC-001 — it says the segmentation will protect the clinical zone from enterprise compromise. But look at what we found on the network architecture. The dual-homed workstations. The legacy flat segments. The segmentation isn't complete. This claim is already broken. It's been broken for eighteen months. I flagged it six months ago. Nobody funded the fix."

He continues: "If I sign off on the isolation now, I need you to be honest with me. Is isolating the right call even though we've lost the assurance we were supposed to have?" **[Points to CLAIM-HC-001 on the document]**

**Optional player action:** The player can pick up or examine the safety case document during this conversation to read it in full. The document becomes a readable prop that can be referenced in dialogue.

This is a **critical player choice moment**. The player is not just being asked to isolate the network — they are being asked to make a safety engineering judgment call. David is not being difficult; he is doing his job as the clinical engineering manager who is accountable for device safety.

**Player response options (simplified dialogue branches):**
- "Yes, isolation is the right call. We contain the attacker risk now, and deal with the backup and device verification afterward."
- "I'm not sure. What's your recommendation?"

**David's response:**
- If the player commits: David accepts the reasoning. "Okay. I'll give you my code. But we're going to need to verify every device on that VLAN before we trust it again." He provides his four-digit clinical engineering authorisation code. `clinical_eng_authorized_pending = true`.
- If the player hesitates: David waits. The clock continues to run. Bed 4's outcome (if not already resolved) progresses. Later, he may accept the player's decision anyway, but his tone becomes more anxious about the pending isolation decision.

**SIS Teaching Moment:** Safety cases as living documents. A claim about network segmentation is invalid if the underlying segmentation is incomplete. The player learns that cyber attacks don't just break systems — they break the arguments (safety cases) on which safety is founded. David's insistence on the conversation forces the player to engage with this explicitly.

#### Interaction 4: Dialogue with Dr Fiona Hartley — EHR Loss Consequences

Dr Hartley finishes her phone call and becomes available. She approaches the player.

Dr Hartley explains her concern with network isolation:
- Isolating the network removes EHR access to the affected wards.
- Without the EHR, clinicians cannot verify allergies or check drug interactions before prescribing.
- For a post-operative patient who is drowsy, missing an allergy check could be fatal.

She proposes compensating controls:
- Pharmacy at every medication round.
- Paper MAR charts at every bed (already collected in Phase 1).
- Verbal allergy check protocol activated.

**SIS Teaching Moment:** The standard security response (network isolation) directly creates a different patient safety risk (loss of allergy checking). The trade-off must be conscious and mitigated, not treated as a secondary issue. This is the core Security-Informed Safety decision of the scenario.

#### Interaction 5: Dual-Authorisation Panel Minigame (Minigame 11)

The player approaches the **wall-mounted dual-authorisation keypad**. This is a physical or simulated two-panel system. One panel is labelled `IT SECURITY`, the other `CLINICAL ENGINEERING`. A large button between them reads `AUTHORISE NETWORK ISOLATION` (initially greyed out).

**Minigame 11: Dual-Authorisation Panel**

**Player's task:**
1. Enter Ravi's four-digit code in the IT SECURITY panel.
2. Enter David's four-digit code in the CLINICAL ENGINEERING panel.
3. Press the central AUTHORISE button to sever the enterprise-clinical network link.

**Game mechanics:**
- Entering a correct code in either panel causes that panel to flash green and show `AUTHORISED`.
- Entering an incorrect code causes a red flash and resets.
- Both codes must be entered for the AUTHORISE button to activate.
- The act of entering both codes (and requiring both to be present) embodies the governance principle: high-consequence network changes must be jointly authorised by IT security and clinical engineering.

**Outcome:**
- `itsec_authorised = true`
- `clinical_eng_authorised = true`
- `network_isolated = true` (if not already set via Room 2 Network Map)
- The **Command Board** updates: `[t] NETWORK ISOLATED — Clinical zone severed from enterprise`
- The **corridor warning light** (between rooms) activates (flashing amber).
- All NPCs react:
  - Helen Carver: "It's done. But we've just lost the EHR on those wards. Clinical staff have no electronic records."
  - David Osei: "At least the devices are protected now. The pumps will run on their last settings, but we need to verify the drug library before anyone prescribes new doses."
  - Dr Hartley: "Without EHR, the ward teams are working blind on allergies. We need pharmacy at every bedside."

**SIS Teaching Moment:** Dual-authorisation as a governance control for security-safety trade-off decisions. The requirement to have both IT and clinical engineering sign off before isolation forces integration of perspectives and full visibility of consequences.

#### Interaction 6: Drug Library Integrity Checker VM Terminal (Minigame 9)

In the corner of the Major Incident Room, David points the player to the **Drug Library Integrity Checker VM terminal**.

David: "If the attacker was in the clinical zone, I don't know what they touched. The pump management console could have been accessed. Run a diff on the drug library — if it's been tampered with, that claim is invalidated too."

**Minigame 9: Drug Library Integrity Verification (VM Challenge)**

The terminal opens a Linux shell environment with access to:
- `/opt/pump-management/drug_library.csv` — 23 drug entries (morphine, fentanyl, methotrexate, etc.)
- `/opt/pump-management/drug_library.bak` — untampered backup from a known-good snapshot
- `/opt/pump-management/drug_library.sha256` — reference hash of the untampered library
- `/home/analyst/verify_library.sh` — validation script

**The tampering:** One entry has been modified:
```
Morphine: DOSE_MAX = 4 (original) → 40 (tampered)
```

This removes the smart pump's high-dose guardrail. A keystroke error that would normally be caught by the system (e.g., 40 mg instead of 4 mg) will now be accepted as valid.

**Player's task:**
- Compare the current library to the backup using `diff` or similar tools.
- Identify the modified entry (morphine dose maximum).
- Run the verification script to confirm: `./verify_library.sh morphine 4`
- Correct identification emits a flag: `drug_flag_1`.

**Outcome:** `drug_library_verified = true` and `drug_library_compromised = true`.

**Command Board update (auto):** `[t] DRUG LIBRARY TAMPERED — Morphine dose max altered. Pump verification required.`

**NPCs' reactions:**
- David Osei: "This changes everything. The pump guardrails were disabled. Any pump on that network could have pushed a toxic dose — and the system wouldn't have stopped it. We need to pull every pump on the affected VLAN for firmware verification. That's a massive nursing workload."
- Helen Carver: "How long does that take?"
- David: "We'll need to do it manually. Each pump needs a firmware audit. That could be a week of work for the clinical engineering team, but it's necessary."

A **Pharmacist NPC** now appears on the ward (Room 1), moving slowly between beds, performing manual medication verification as a compensating control.

**SIS Teaching Moment:** Integrity attacks as the insidious dimension of cyber-physical attacks. The drug library tampering is silent — the pump continues operating, but the safety function (guardrail) has been removed. This illustrates the integrity-to-safety pathway: when a safety barrier is compromised, a routine clinical error becomes lethal.

#### Interaction 7: Assessment of Safety Claim HC-003 (Optional but High-Value)

After the drug library is verified, David offers an optional dialogue branch:

David: "CLAIM-HC-003 says the drug library is trustworthy because changes require pharmacy governance approval. Did this change go through pharmacy approval?"

The answer is obviously no — the attacker made the change without authorization. This dialogue branch allows David to teach the player explicitly:

**CLAIM-HC-003:** *Drug library change control ensures that dose limits loaded into infusion pump fleet are authorised, version-controlled, and audited.*

David: "The claim is invalidated. The safety barrier the pumps depended on was removed without authorisation or detection. That's the integrity-to-safety pathway in practice."

Sets `safety_claim_hc003_assessed = true`.

**SIS Teaching Moment:** Safety claims that depend on change-control processes are only as strong as those processes. An attacker who bypasses change control silently invalidates the claim. The debrief will return to this when discussing what went wrong.

#### Interaction 8: Dialogue with Helen Carver — ICO Notification

Helen Carver has a 72-hour clock running on her phone — it started when the incident was declared at 22:38 last night. She has 72 hours from that moment to notify the Information Commissioner's Office (GDPR requirement for data breaches).

Helen: "I need to know: does this incident constitute a reportable breach? Did patient data get exfiltrated, or just encrypted in place?"

The player's answer: In a ransomware incident affecting clinical records, the safest assumption is that data may have been exfiltrated. Notification is mandatory.

Helen files the ICO notification: `ico_notified = true`.

**Command Board update (auto):** `[t] ICO NOTIFIED — 72-hour statutory notification submitted`

Dr Hartley (if listening): "That's the right call. The fine alone could be millions, but missing the window is worse."

**Alternative outcome:** If the player does NOT prompt the ICO notification and the 72-hour clock runs out (in-game timer), the game will auto-set `ico_deadline_missed = true`, and the **Command Board** will show: `[DEADLINE MISSED] ICO NOTIFICATION OVERDUE — potential fine: £17.5 million. NHS England investigation initiated.` This consequence will be presented in the debrief as a regulatory failure with serious financial and reputational consequences.

**SIS Teaching Moment:** Regulatory obligations as parallel obligations, not afterthoughts. The ICO notification deadline is running at the same time as the technical response. This forces the player to manage compound priorities and understand that Security-Informed Safety decisions include regulatory obligations.

#### Interaction 9: Assessment of Safety Claim HC-007 (Optional, High Educational Value)

Helen Carver offers a final optional dialogue branch. She finds the incident response plan on the table and points to:

**CLAIM-HC-007:** *The integrated incident response plan provides clear guidance on when to isolate clinical systems, and the isolation procedure is rehearsed at least annually so that response time does not itself create patient safety risk.*

Helen: "The plan says isolate. We've isolated. But the ward was running blind for nine hours before we got here. If that claim ever held, does it still hold now?"

This dialogue invites the player to assess whether the response process honoured the safety case's conditions. The conditions include:
- Isolation is done promptly (9-hour delay is not prompt).
- The process is rehearsed (unclear if it was).
- Isolation itself does not create patient safety risk (network isolation removed EHR access, creating a different risk — but it was mitigated with pharmacy presence and paper MAR charts).

The player's response (yes/no/partial) informs `safety_claim_hc007_assessed = true` and influences the debrief's framing.

**SIS Teaching Moment:** CLAIM-HC-007 is the only claim the response team can actively honour — by using the dual-authorisation process (which forces joint IT/clinical decision-making) and by engaging pharmacy in compensating controls. This claim explicitly ties to the game's design: the dual-auth panel and Dr Hartley's input are the mechanisms by which CLAIM-HC-007 is upheld.

---

## Phase 2b (Interleaved): Back to Ward 7 — Bedside Pump Programming

**Timing:** This interaction can occur in Phase 2 or early Phase 3, after the player has collected the paper MAR charts and before the network is isolated. It is presented here as a separate sequence for clarity, but in the actual game, it would be triggered by the player returning to Ward 7.

### Room: Ward 7, Bed 2

The player returns to Ward 7 and approaches the **infusion pump** at Bed 2. The patient is resting, stable. The pump display shows the previous programmed rate.

**Trigger:** The pump prop (a physical button or NFC tag) is interactive. Tapping it or pressing the button opens the **Bedside Infusion Pump Terminal** minigame.

**Precondition:** `paper_charts_collected = true`. If the player attempts to use the pump without the paper charts, the minigame displays: *"No prescription available — locate paper charts first."*

**Minigame 8: Bedside Infusion Pump Terminal**

The minigame simulates a real infusion pump interface. The player's task:
1. Refer to the paper MAR chart (which is displayed on-screen alongside the pump interface).
2. Transcribe the dose from the chart into the pump keypad.
3. Apply a double-check protocol: after entering the dose, the pump displays a confirmation screen. The player must verify that the entered value matches the chart value.

**The scenario:** The paper chart shows: `Morphine 10.0 mg/hr`.

**The hazard:** The decimal point is small on the printed form. A transcription error is easy: the player might enter `100` instead of `10.0`.

**Game mechanics:**
1. Player enters a dose (via keypad on the pump interface).
2. Display shows the entered value (e.g., "100").
3. Confirmation modal appears: "CONFIRM RATE: 100 mg/hr. Press OK to proceed."
4. Player sees a discrepancy and has two options:
   - **Cancel and re-enter:** Correct the error. When they re-enter the correct dose (10.0) and confirm, the pump accepts it.
     - `pump_dose_correct = true`
     - Infusion pump runs normally.
     - Pharmacist (if present): "Good catch on the double-check. That's why we do it."
   - **Confirm despite discrepancy:** Player confirms the erroneous dose (100 mg/hr) despite the confirmation screen showing a mismatch.
     - `pump_dose_error = true`
     - Patient Bed 2 will transition to `sedated` state after a 5-minute delay (in-game).

**Compound hazard (if drug_library_compromised = true):**
If the player enters an incorrect dose AND the drug library has already been found to be tampered with (guardrails removed):
- The pump accepts the erroneous dose immediately (because the guardrail that would catch a 10x over-dose is gone).
- `patient_bed2_state` → `CRITICAL` (not delayed).
- Patient deterioration is immediate and severe.
- A Doctor NPC spawns and rushes to Bed 2.
- The Pharmacist, if present, looks alarmed: "The pump shouldn't have accepted that rate. Where are the guardrails?"

**SIS Teaching Moment:** This is the concrete manifestation of the integrity-to-safety pathway:
- The smart pump has a guardrail: it rejects doses above a threshold.
- That guardrail depends on the drug library being trustworthy.
- When the attacker tampered with the drug library, the guardrail was silently disabled.
- A routine clinical error (decimal point transcription) that would normally be caught by the system now becomes a patient safety event.
- The fallback (paper-based prescribing with manual double-check) is itself error-prone and time-consuming.

**Command Board updates (auto):**
- If `pump_dose_correct = true`: `[t] BEDSIDE PUMP PROGRAMMED — Dose verified correct`
- If `pump_dose_error = true` and `drug_library_compromised = false`: `[t] BEDSIDE PUMP PROGRAMMED — Double-check error caught` (patient sedated after delay but recoverable)
- If `pump_dose_error = true` and `drug_library_compromised = true`: `[t] PATIENT DETERIORATION — Ward 7 Bed 2. Opioid toxicity suspected. Smart pump guardrails failed.` (immediate critical state)

---

## Phase 4: Resolution and Debrief

### Room: Major Incident Room (continued)

**Trigger:** The debrief begins when the following conditions are met:
- `backup_recovery_source` is set (player chose cloud, NAS, or tape)
- `network_isolated = true` (network has been severed)
- `drug_library_verified = true` (or a decision about device withdrawal has been made)

At this point, the game transitions to Phase 4. The Major Incident Room continues to be the setting, but the tone shifts from active decision-making to reflection and accountability.

### Dialogue: Dr Priya Sharma — NCSC Lead Investigator Debrief

A new NPC, **Dr Priya Sharma** (NCSC Lead Investigator), arrives at the Major Incident Room. She is calm, professional, and carrying a tablet and a folder already prepared with the trust's name on it.

Dr Sharma has reviewed the **Command Board** before speaking. She knows the outcome (patient states, regulatory status, decisions made) before the players tell her.

**Debrief Structure — Five Topics**

Dr Sharma delivers the debrief as a structured dialogue sequence. She addresses five topics in order:

#### Topic 1: Patient Outcomes

Dr Sharma reads the Command Board entries aloud, matter-of-factly:

*"Bed 4: cardiac arrhythmia. The alarm ran for [X] minutes before a nurse reached the patient. The central monitoring station was offline. [If the patient died: She did not survive. [If attended in time: The response came in time.]"*

*"Bed 2: [If stable: The patient remained stable. [If sedated: The patient experienced sedation due to a dose error. The guardrails that would have prevented that dose were disabled by the attacker. [If deceased: The patient did not survive. Morphine toxicity. The pump accepted a lethal dose because the drug library said it was safe."*

She then asks: "What made those outcomes possible? Not the attack — the attack is the cause. But the conditions."

She systematically identifies design failures:
- The monitoring station on the same network as the finance workstations.
- The pump guardrails loaded from a library accessible from the enterprise zone.
- The ward running blind (manual rounds only) for nine hours.
- The drug library change control procedure not catching the tampering.

**SIS Teaching Moment:** Each patient outcome is traced back to a design decision made long before the attack. This reinforces the scenario's core teaching: cyber security failures and patient safety failures are not separate — they are faces of the same design gap.

#### Topic 2: Safety Claims Assessment

Dr Sharma opens a folder. Three printed pages — the three safety claims that break.

**CLAIM-HC-001:** *Network segmentation maintains separation between the enterprise and clinical zones...*

Dr Sharma: "This claim was invalid before the attack. The dual-homed workstations and legacy flat segments had breached the claim's conditions for eighteen months. Did anyone assess this claim when the VLAN migration project stalled six months ago?"

David Osei, if present: "I flagged it. It didn't get funded."

**CLAIM-HC-003:** *Drug library change control ensures dose limits are authorised, version-controlled, and audited.*

Dr Sharma: "The drug library was tampered with. Did the attacker's change go through the pharmacy approval process?"

Answer: No.

Dr Sharma: "Then the claim is invalidated. The safety barrier the pumps depended on was removed without authorisation or detection."

**CLAIM-HC-007:** *The integrated incident response plan provides clear guidance on when to isolate clinical systems, and isolation does not itself create patient safety risk.*

Dr Sharma: "The plan says isolate. You isolated. But you also lost EHR access for nine hours before isolation. The claim says isolation shouldn't create patient safety risk. How did you mitigate that?"

Player response (summarized): "We deployed pharmacy to every bedside. Paper MAR charts. Verbal allergy checks."

Dr Sharma: "That's the only claim you can actively honour — by integrating IT and clinical decision-making from the start. The dual-authorisation process you used embodies that claim's requirements."

**SIS Teaching Moment:** The debrief makes explicit what the scenario demonstrated implicitly: safety cases are documents claiming that certain controls are sufficient for certain risks. When the controls fail or are removed, the case is invalidated. This is not a failure of the document — it is a failure of the conditions the document assumes.

#### Topic 3: Regulatory Consequences

Dr Sharma acknowledges the ICO notification status:

**If `ico_notified = true` (on time):**
Dr Sharma: "You filed the notification within the 72-hour window. That demonstrates good faith and will count as a mitigating factor. The Information Commissioner may still open an investigation, but you acted responsibly under difficult conditions."

**If `ico_deadline_missed = true` (overdue):**
Dr Sharma: "You missed the 72-hour GDPR notification deadline. The Information Commissioner will open an enforcement investigation. On a breach of this scale — 350,000 patients, clinical records, two patient safety events — the fine could reach £17.5 million under UK GDPR. NHS England will also conduct a formal Serious Incident review. This is now a regulatory failure on top of everything else."

She states this without melodrama — just as a fact.

**SIS Teaching Moment:** Regulatory obligations are time-critical and run in parallel with technical response. Missing the window is itself a consequential decision with massive financial and reputational implications.

#### Topic 4: Root Causes

Dr Sharma pulls up a slide showing a simple causal chain:

*Incomplete segmentation → Attacker pivot → Clinical system compromise → Safety-critical device exposure → Patient safety event*

Dr Sharma: "The attacker didn't cause the patient safety events. The attack revealed that the safety measures depended on IT infrastructure that was never treated as safety-critical. That's the design gap."

She names the five structural vulnerabilities:
1. **No MFA on VPN:** Contractor credentials reused without second factor.
2. **Incomplete segmentation:** Dual-homed workstations and legacy flat segments allow pivot from enterprise to clinical.
3. **Alert fatigue:** Critical SIEM alerts dismissed as migration noise.
4. **No immutable backups:** NAS and tape backups on the same network; both compromised.
5. **No joint IT/clinical governance:** Device safety decisions made without coordinating with clinical engineering or nursing.

Dr Sharma: "Three of these were on the IT audit register. One was flagged by your Clinical Engineering Manager six months ago. This incident was not unforeseeable — it was unfunded."

**SIS Teaching Moment:** The root causes are systemic, not the result of a single mistake. The attack was a trigger, not the underlying vulnerability.

#### Topic 5: Closing SIS Lesson

Dr Sharma closes the folder and looks directly at the player.

Dr Sharma: "Every safety function that failed today — the monitoring station, the drug library guardrails, the electronic prescribing — depended on IT infrastructure that was not treated as safety-critical. The moment the enterprise network was compromised, the clinical safety case started collapsing. Security and safety were never designed to be separate here. They just ended up that way."

She pauses.

Dr Sharma: "You've managed the acute phase well — or as well as anyone could given what you walked into. The next phase is harder. Every safety case in this trust that touches networked infrastructure needs to be re-examined. The question isn't 'were we hacked' — it's 'what were we assuming that we shouldn't have been?' Start there."

**SIS Teaching Moment:** The closing question reframes the entire scenario. The attack is the catalyst, but the vulnerability is architectural. Security-Informed Safety requires treating security controls as part of the safety argument, not as a separate domain.

### Scenario Completion

The **Command Board** remains on the wall, showing the full timeline of what happened, what was decided, and what those decisions cost. 

Sets `debrief_complete = true`.

The scenario ends. In a physical/embodied installation, a printed summary card (a one-page incident summary) would be distributed to players — a take-away record of the incident they managed.

---

## Optional Outcomes and Variations

### Best-Case Scenario (Informed Decision-Making)
- **Bed 4:** Escalated in time; patient attended.
- **Bed 2:** Correct dose entered; patient remains stable.
- **Network isolation:** Decided via dual-authorisation panel; both Ravi and David authorised.
- **Drug library:** Verified and found compromised; devices withdrawn for firmware audit.
- **ICO notification:** Filed within 72-hour window.
- **Safety claims:** All three assessed (HC-001 invalid, HC-003 invalid, HC-007 honoured).
- **Debrief:** Dr Sharma acknowledges good decision-making within systemic constraints. *"You followed the process that existed. That process was the only thing that worked."*

### Worst-Case Scenario (Multiple Failures)
- **Bed 4:** Not escalated; patient dies. The Command Board shows the death at 07:52.
- **Bed 2:** Incorrect dose entered with drug library already compromised; patient critical/dead.
- **Network isolation:** Ordered unilaterally without dual-auth process or clinical consultation.
- **Drug library:** Never verified; devices remain in service with disabled guardrails.
- **Backup restoration:** Chose NAS despite warning; reinfection detected 30 seconds later.
- **ICO notification:** Not filed; deadline missed at 72 hours.
- **Safety claims:** Not assessed; debrief explicitly names the gaps.
- **Debrief:** Dr Sharma's assessment is clear but not punitive. She names each failure by its cause and consequence. The final number — £17.5M fine + NHS investigation + institutional trust loss — sits in the air.

### Partial Success Scenarios
Between best and worst are many outcomes reflecting realistic decision-making under pressure:
- One patient saved, one lost; network isolated via dual-auth; cloud backup chosen; ICO notified in time.
- Both patients saved; network isolated unilaterally (without dual-auth); drug library never verified; ICO deadline missed.
- Both patients saved; dual-auth process followed; drug library verified; backup reinfected from NAS choice; two safety claims assessed.

Each outcome is presented honestly in the debrief without softening or melodrama.

---

## SIS Concepts Embedded in Game Interactions

| Game Moment | SIS Concept | How It's Taught |
|---|---|---|
| Ransomware splash on monitoring station + Bed 4 alarm unattended | Cyber-physical chain: attack → loss of safety function → patient harm | The player sees the IT failure and the patient consequence in the same frame. No explanation needed. |
| Bed 4 escalation decision with time pressure | Incident response must account for safety consequences from the start | The 22-minute timer forces the player to understand that IT response speed is itself a patient safety factor. |
| SIEM challenge: escalating critical alerts buried in noise | Alert fatigue as an enabling condition for attack escalation | The player must identify the attack chain in a realistic alert stream. Learning that the alerts existed but were dismissed lands hard. |
| Network Segmentation Map: toggling exception rules | Architecture as a security-safety trade-off | Each exception rule shows a clinical convenience that is also an attack surface. Players see the real-world tension visually. |
| David Osei insisting on safety case assessment before giving his code | Safety cases as living documents requiring continuous assessment | The player must commit to a position on whether a safety claim still holds. David's refusal to sign off without this conversation teaches that cyber-informed safety decisions require explicit claim assessment. |
| Dual-Authorisation Panel: both codes required | Organisational culture: joint IT/clinical decision-making is a safety requirement | The physical requirement for two codes from two domains embodies the governance principle. Security and clinical decisions cannot be unilateral. |
| Drug library tampering: morphine 4 → 40 mg | Integrity attacks as silent safety-function removal | The pump continues operating but the guardrail is gone. This illustrates how cyber attacks remove safety barriers invisibly. |
| Bedside pump: transcription error + drug library tampering = dose error | Integrity-to-safety pathway: when guardrails are removed, routine errors become lethal | A keystroke error that would normally be caught now kills the patient. The scenario shows the direct cost of losing an electronic safety function. |
| ICO notification clock running in parallel with technical response | Regulatory obligations as parallel, time-critical decisions | The 72-hour window is not a secondary concern — missing it is a consequential failure with £17.5M consequences. |
| CLAIM-HC-007 assessment: dual-auth and compensating controls | The one claim the response team can actively honour | CLAIM-HC-007 requires joint decision-making and compensating controls. The dual-auth panel and pharmacy presence are the mechanisms by which this claim is upheld. |
| Dr Sharma debrief: patient outcomes traced to design decisions | Root causes are systemic, not individual mistakes | Each patient outcome is mapped back to architectural decisions made long before the attack. The attack is the trigger; the design is the vulnerability. |

---

## Key Design Patterns for Physical Implementation

### Room Transitions
- **Ward 7 → IT Security Office:** RFID-locked staff-access door (requires card from Sarah, nursing station desk, or Ravi).
- **IT Security Office → Major Incident Room:** Unlocked or requires same RFID card.
- **Major Incident Room → Back to Ward 7 (optional):** Players can loop back to interact with the bedside pump after collecting charts and understanding network context.

### Environmental State Indicators
- **Patient Monitoring Central Station screen:** Ransomware display → offline (never restores in this scenario).
- **Ward Alarm Panel:** Amber `MONITORING FAULT` → red `PATIENT ALARM — BED 4` (if distressed) → red `PATIENT DECEASED` (if not attended).
- **Corridor Warning Light:** Off at start → flashing amber when network is isolated.
- **Patient States (Bed 4):** `RESTING_UNMONITORED` → `DISTRESSED` (8 min) → `CRITICAL` (15 min) → `DECEASED` (22 min) or `ATTENDED` (if escalated).
- **Patient States (Bed 2):** `STABLE` → `SEDATED` (5 min delay if dose error) → `CRITICAL` (immediate if dose error + guardrail disabled) or remains `STABLE` (if correct dose).

### NPC Behaviour Triggers
- **Sarah Mitchell:** Patrol between monitoring station and beds; reacts to Bed 4 escalation; voice line when patient reaches each state.
- **Ravi Anand:** At laptop; becomes more engaged after SIEM challenge; provides codes and cabinet access.
- **David Osei:** At whiteboard; becomes central to dual-auth and safety case assessment.
- **Helen Carver:** At table head; coordinates backup decision and ICO notification.
- **Dr Hartley:** Initially on phone; becomes available after ~5 min; focuses on EHR loss and compensating controls.
- **Pharmacist (appears late):** Spawns on ward after drug library compromise or network isolation; patrols between beds doing manual medication verification.
- **Dr Sharma (debrief):** Arrives at end; delivers structured five-part debrief.

### Minigame Sequence
1. **Minigame 1 (SIEM Dashboard):** Phase 2, Room 2
2. **Minigame 4 (Network Map):** Phase 2, Room 2
3. **Minigame 6 (VPN Log VM):** Phase 2, Room 2
4. **Minigame 7 (Backup Console):** Phase 3, Room 3
5. **Minigame 8 (Bedside Pump):** Phase 2b, Room 1 (can be interleaved)
6. **Minigame 9 (Drug Library VM):** Phase 3, Room 3
7. **Minigame 11 (Dual-Auth Panel):** Phase 3, Room 3

### Global Variable State Machine
**Key variables that drive visible changes:**
- `ward_monitor_status` (OFFLINE from start)
- `patient_bed4_state` (RESTING_UNMONITORED → ATTENDED or CRITICAL or DECEASED)
- `patient_bed2_state` (STABLE or SEDATED or CRITICAL)
- `network_isolated` (false → true; triggers EHR and fleet console offline)
- `drug_library_compromised` (false → true)
- `backup_recovery_source` (NONE → CLOUD or NAS or TAPE)
- `ico_notified` (false → true)
- `ico_deadline_missed` (false → true if deadline expires)
- `pump_dose_error` / `pump_dose_correct` (drive Bed 2 patient state)
- `safety_claim_*_assessed` (HC-001, HC-003, HC-007; inform debrief)

---

## Conclusion: Learning Outcomes

A player who completes this scenario should understand:

1. **Cyber-Physical Chain:** Security failures and safety failures are not separate. An attack on IT infrastructure is an attack on the safety functions that depend on that infrastructure.

2. **Safety Cases as Living Documents:** Safety claims can become invalid when their underlying conditions are breached. A claim about network segmentation is no longer valid if the segmentation is incomplete.

3. **Integrity as a Safety Property:** Integrity attacks (like drug library tampering) are silent — the system continues operating while a safety function is removed. This is more dangerous than availability attacks, which are obvious.

4. **Security-Safety Trade-Offs Require Joint Decision-Making:** The standard security response (network isolation) creates a patient safety risk (loss of EHR access). These trade-offs must be made consciously, with both IT and clinical perspectives represented.

5. **Regulatory Obligations Are Parallel Decisions:** The ICO notification deadline is not a secondary concern — it is a time-critical obligation running at the same time as the technical response. Missing it has massive consequences (£17.5M fine).

6. **Design Gaps Are the Real Vulnerability:** The attack is the trigger, not the cause. The real vulnerability is architectural — safety-critical functions built on IT infrastructure without treating that infrastructure as safety-critical.

7. **Root Causes Are Systemic:** The five gaps (no MFA, incomplete segmentation, alert fatigue, no immutable backups, no joint governance) were not unknown. Three were on audit registers. One was flagged months ago. This incident was unfunded, not unforeseeable.

---

## Appendix: Dialogue Decision Trees (Summary)

### Sarah Mitchell (Room 1)
1. "What's happening with the computers?" → Explains ransomware, EHR status, monitoring loss
2. "Can you tell me about Bed 4?" → Describes patient, emphasises missed alarm risk
3. **[CRITICAL CHOICE]** "Get help to Bed 4 now" → Escalation; nurse moves to bed; patient attended
4. "What do you need from us?" → Pharmacy at every round; honest ETA on manual operations

### Ravi Anand (Room 2)
1. "Walk me through what happened" → Full attack timeline (phishing, VPN, pivot, ransomware)
2. "Why didn't the alerts fire?" → Alert fatigue; migration noise classification
3. "Should we isolate the clinical network?" → Strongly favours isolation; explains risk of delay
4. "What about the drug library?" → Raises concern about device verification
5. "What's the code for the panel?" → Provides code after SIEM escalation; emphasis on joint sign-off

### David Osei (Room 3)
1. "What's the situation with the devices?" → Explains fleet; notes that management console encrypted
2. "Is it safe to keep using the pumps?" → Honest answer: "I don't know. That's the problem."
3. **[CRITICAL CHOICE]** "Give me your code for the isolation panel" → Requires player to commit to isolation as correct (forces safety case assessment)
4. "We found evidence the drug library was tampered with" → Concern about device integrity; need for firmware verification
5. **[OPTIONAL — SIS TEACHING]** "Is CLAIM-HC-001 still valid?" → Assessment dialogue; explains segmentation claim invalidation
6. **[OPTIONAL — SIS TEACHING]** "Is CLAIM-HC-003 still valid?" → Assessment dialogue; explains drug library change control claim invalidation

### Helen Carver (Room 3)
1. "What are our options for the network?" → Dilemma: isolate (clinical consequence) vs. don't isolate (security risk)
2. "What about the ransom?" → Trust Board policy: not paying
3. "Have you notified NCSC?" → They're in the loop; need clinical picture
4. "Should we isolate the network now?" → Authorises only after dual-auth panel completion
5. "What about the ICO notification?" → 72-hour GDPR window; need assessment of reportability
6. **[OPTIONAL — SIS TEACHING]** "Is CLAIM-HC-007 being followed?" → Assessment dialogue; explains incident response integration requirement

### Dr Fiona Hartley (Room 3)
1. "What's your concern with isolating the network?" → Allergy risk; EHR loss consequences
2. "What compensating controls do we need?" → Pharmacy at every round; paper MAR; verbal allergy check
3. "What are our notification obligations?" → GDPR 72-hour window; NHS reporting; duty of candour
4. "The drug library was tampered with — does that change things?" → Yes; patient safety incident; duty of candour applies

---

## Appendix: Command Board Timeline (Example)

Below is an example Command Board timeline for a scenario where:
- Bed 4 was escalated in time (patient attended)
- Bed 2: correct dose entered
- SIEM alerts escalated correctly
- Network isolated via dual-auth panel
- Drug library verified as compromised
- Cloud backup chosen
- ICO notified on time
- All three safety claims assessed

```
[22:38] MAJOR INCIDENT DECLARED — Enterprise IT systems encrypted
[22:38] Initial contact with NCSC
[07:30] PLAYERS ARRIVE on site
[07:35] BED 4 PATIENT ESCALATED — Clinical team responding
[07:45] SIEM ALERTS ESCALATED — Critical indicators identified
[07:48] VPN ANOMALY CONFIRMED — Contractor credentials from Romania, no MFA
[07:54] CLOUD RESTORE INITIATED — EHR recovery ETA 18 hours
[08:12] NETWORK ISOLATED — Clinical zone severed from enterprise
[08:19] DRUG LIBRARY TAMPERED — Morphine dose max modified. Pump verification required.
[08:20] PHARMACIST DEPLOYED — Manual medication verification initiated on Ward 7
[08:25] BEDSIDE PUMP PROGRAMMED — Dose verified correct. Patient stable.
[08:31] ICO NOTIFIED — 72-hour statutory notification submitted
[08:35] SAFETY CLAIM HC-001 ASSESSED — Network segmentation invalid (breached 18 months)
[08:40] SAFETY CLAIM HC-003 ASSESSED — Drug library integrity control bypassed
[08:45] SAFETY CLAIM HC-007 ASSESSED — Incident response integrated (dual-auth process followed)
[09:00] MAJOR INCIDENT RESPONSE PHASE COMPLETE — Awaiting NCSC debrief
```

---

## Appendix: NPC Voices and Character Voice Directions

These voice descriptions are for TTS implementation:

- **Sarah Mitchell:** Calm, professional, warm; northern English accent; slightly tired; compassionate toward patients
- **Ravi Anand:** Urgent, technical, slightly frustrated; South Asian accent; meticulous about detail
- **David Osei:** Measured, cautious, safety-conscious; West African accent; emphasises process
- **Helen Carver:** Commanding, composed under pressure; middle-class English accent; clear about hard decisions
- **Dr Fiona Hartley:** Cultured, focused; professional; intellectual; emphasises patient rights and duty of candour
- **Dr Priya Sharma (NCSC):** Calm, direct, experienced; South Asian accent; unflinching in presenting hard truths

---

This walkthrough provides the complete game experience from the player's perspective, showing how each room, minigame, NPC dialogue, and global variable state drives the narrative and teaches Security-Informed Safety concepts through tangible game interactions rather than exposition.
