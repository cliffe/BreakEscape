# Minigame Planning — Case 1: Healthcare (Northgate Incident)

Each entry specifies the implementation category, functional behaviour, and visual design.

**Category key:**
- `vm` — implemented as files and commands on a Linux VM; players interact via the existing BreakEscape terminal
- `minigame` — implemented as a JavaScript interactive component extending `MinigameScene`, using HTML/CSS or Phaser.js

---

## 1. SIEM Alert Dashboard

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 1 — alert triage decision point
**Core concept:** Alert fatigue; distinguishing real attack IoCs from migration-project noise; escalation trade-offs
**Priority:** High
**Draft scenario:** Yes

### Functional Spec

Displays a scrollable, auto-updating security event log containing a seeded mix of realistic IoC entries (encoded PowerShell execution, LSASS access, anomalous SMB write volumes, cross-zone RDP sessions) and benign migration-related noise events (expected VLAN reconfiguration traffic, scheduled backup jobs). Players review each alert and click **[DISMISS]** or **[ESCALATE]**. Escalating the correct critical alerts before a configurable timer expires writes `siem_escalated = true` to global state and advances the scenario; dismissing critical alerts without escalation writes `siem_missed_alerts = true`, which later triggers the ransomware deployment consequence. The minigame can be left open and returns to its state on re-entry; new alerts can be injected by game events using `window.eventDispatcher.emit('siem_new_alert', { severity, source, description })`.

### Visual Design

**Layout:** Full-panel overlay. Dark charcoal background (`#1a1a2e`) with a pixel-art border frame. Header bar across the top reads `NORTHGATE TRUST // SIEM CONSOLE` in pixel font with a live system clock ticking in the top-right corner.

**Alert log pane** (left ~70% of panel): Vertically scrolling list. Each row is a fixed-height tile with:
- A severity badge on the left — pixel-art coloured block: `LOW` (grey), `MED` (amber), `HIGH` (orange), `CRIT` (red, flashing at 1 Hz)
- Timestamp in monospace pixel font
- Source system label (e.g., `FINWKS-047`, `DC01`, `FIREWALL-CORE`)
- One-line event description
- Two small pixel-art buttons on the right of each row: `[DISMISS]` (dark grey) and `[ESCALATE]` (amber). Dismissed rows fade to 30% opacity and slide slightly left; escalated rows highlight with a green-left-border and move to the escalation queue.

**Escalation queue pane** (right ~30%): Header `ESCALATED FOR REVIEW`. Lists escalated alerts in order. A counter at the top shows `X alerts queued`.

**Status bar** at the bottom: `ALERTS PENDING: X | TIME REMAINING: MM:SS`. When the timer expires or all critical alerts are processed, a result banner slides down from the top — green (`INCIDENT TEAM NOTIFIED`) or red (`CRITICAL ALERTS MISSED — INCIDENT ESCALATED`).

**State-driven behaviour:** On `global_variable_changed:ransomware_deployed` event, a flood of CRITICAL alerts appears simultaneously and the panel border pulses red.

---

## 2. Patient Monitoring Central Station

**Category:** minigame (Phaser.js)
**Scenario moment:** Day 2 — post-encryption; missed alarm consequence
**Core concept:** Monitoring availability loss degrades patient safety; the gap between central-station alarming and individual bedside alarms
**Priority:** High
**Draft scenario:** Simplified — for the draft, the station starts in the offline/ransomware state and never comes online; live animated waveforms per tile are an enhancement for later

### Functional Spec

Renders a ward-level grid of patient monitor tiles, each displaying simulated vital-sign values (heart rate, SpO2, blood pressure) with live-updating numbers and a scrolling waveform. Each tile has a colour-coded alarm state: normal (green), warning (amber), critical (red with flashing border). Global state controls the console mode: `ward_monitor_status` can be `online`, `stale`, or `offline`. When `stale`, values freeze and alarm indicators stop firing. When `offline`, tiles go dark and display a pixel-art static/noise pattern before showing the ransomware splash. Players cannot restore the console themselves — the state is set externally. The minigame's purpose is to make the consequence of the attack legible: players observe a critical alarm tile that is flashing but receiving no response, prompting them to initiate manual escalation via an NPC dialogue.

### Visual Design

**Layout:** Landscape panel styled as a clinical workstation application. Pixel-art window chrome with a title bar reading `WARD 7 — CENTRAL MONITORING STATION`.

**Patient tile grid:** 3×2 grid (six beds). Each tile is a self-contained pixel-art panel with:
- Bed number and patient ID in the top-left corner (pixel font, small)
- A scrolling single-lead ECG waveform (green pixel line on black background, simple sine-wave approximation with occasional added noise)
- Three numeric readouts below the waveform: `HR` (beats/min), `SpO2` (%), `BP` (mmHg) — in pixel font
- A coloured border that changes based on alarm state: **green** (2px solid), **amber** (2px solid), **red** (2px, flashing at 1 Hz)
- A small pixel-art alarm bell icon in the top-right corner of the tile that animates when the alarm is active

**State transitions:**
- `online`: all tiles animate normally
- `stale`: waveforms freeze mid-scroll; values stop updating; alarm bells stop animating — a `SIGNAL LOST` pixel-art badge appears on each tile
- `offline`: tiles fade to black over 2 seconds, replaced by a pixel-art static noise texture; after 1 second a full-panel overlay appears: skull/lock pixel icon centred, text `SYSTEM ENCRYPTED — SEE README_RESTORE.TXT` in red pixel font

**Bottom status bar:** `CENTRAL STATION: [ONLINE / STALE / OFFLINE]` with corresponding colour indicator. While offline, the bar reads `WARNING: BEDSIDE ALARMS ONLY`.

---

## 3. Infusion Pump Fleet Console

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2 — loss of centralised dose management
**Core concept:** Drug library as a safety barrier; electronic prescribing eliminates transcription errors that manual bedside entry reintroduces
**Priority:** Medium
**Draft scenario:** No — in the draft scenario the fleet console is offline from the start and the key interaction is the bedside pump terminal (minigame 8); the fleet console view is an enhancement for a subsequent version showing the "before" state

### Functional Spec

Displays a paginated fleet grid showing connectivity status, current drug, infusion rate, and volume remaining for each simulated pump. A Drug Library tab allows players to inspect dose limits and concentration parameters for each drug in the library. Global state variable `fleet_console_status` drives the display: `online` shows live data; `offline` transitions the entire interface to an encrypted/error state. While online, players can open the drug library and inspect entries — this is preparatory for the Drug Library Integrity Checker (minigame 9). A `drug_library_viewed` global variable is set when the player opens the drug library tab, enabling NPC dialogue about the library's safety function.

### Visual Design

**Layout:** Two-tab interface. Pixel-art tab bar at the top: `[FLEET STATUS]` and `[DRUG LIBRARY]`. Dark clinical-software aesthetic — dark navy background, white pixel text, coloured status indicators.

**Fleet Status tab:** Grid of pump cards (8 per page, paginated). Each card:
- Pump serial number (top-left, monospace pixel font)
- Ward/bed label
- A connectivity dot: green (connected), amber (intermittent), grey (no signal)
- Drug name in bold pixel font
- Rate in `mL/hr` and volume remaining as a pixel-art progress bar (blue fill, depleting left to right)
- A small pixel-art syringe icon

**Drug Library tab:** Scrollable table with columns: `DRUG NAME | CONCENTRATION | DOSE MIN | DOSE MAX | UNIT`. Pixel-art table with alternating row colours. Each row is selectable (highlights on click) to view extended notes. A header warning badge reads `LIBRARY VERSION: 2025-11-03 — VERIFY BEFORE USE`.

**State transition (offline):** All connectivity dots flip to grey simultaneously. A red banner slides down: `FLEET MANAGEMENT CONSOLE UNAVAILABLE`. The pump card values freeze and grey out. A footer message appears: `ALL DOSE ADJUSTMENTS MUST BE MADE MANUALLY AT BEDSIDE`.

---

## 4. Network Segmentation Map

**Category:** minigame (HTML/CSS + inline SVG)
**Scenario moment:** Day 1 firewall rule review; Day 2 network isolation decision
**Core concept:** Incomplete segmentation as attack surface; security-safety trade-off of severing network links; visual understanding of network architecture from information pack
**Priority:** High
**Draft scenario:** Simplified — diagram based on information pack architecture; legacy exception rules highlighted with attack path annotation; per-rule toggles are an enhancement

### Functional Spec

Renders an interactive diagram of the hospital's three network zones with labelled connection lines representing firewall rules and legacy exception rules. The diagram is **directly sourced from `case_1_healthcare/information_pack/system_architecture/network_architecture.md`** and visualises the same zones, devices, and connections. Each rule line has a toggle switch; toggling a rule updates a consequence panel in real time listing which clinical workflows are broken by that change. **Draft enhancement:** When toggling a rule, the diagram highlights the attack path in red (showing how an attacker would traverse that exception rule). The critical action — severing the enterprise-to-clinical link entirely — is a dedicated large button that only activates after the player has toggled at least one exception rule (enforcing engagement with the diagram). Confirming the sever action calls `window.npcManager.setGlobalVariable('network_isolated', true)`, triggering NPC dialogue from both the IT Security Manager and Clinical Engineering Manager. A `network_rules_reviewed` variable is set when any toggle is interacted with.

### Visual Design

**Layout:** Full-panel. Three large pixel-art bordered zone boxes arranged left to right: `EXTERNAL ZONE` (red border), `ENTERPRISE IT ZONE` (blue border), `CLINICAL / DEVICE ZONE` (green border). Each zone box contains a small icon grid of its key systems (pixel-art icons derived from information pack architecture: VPN gateway, domain controllers, EHR server, file servers, backup / infusion pump console, patient monitors, ventilators, PACS, imaging modalities).

**Zone labels and contents** (match information pack exactly):
- **EXTERNAL:** Internet, NHS HSCN, vendor VPN
- **ENTERPRISE:** AD, Email, EHR, File Servers, Admin Workstations, Backup (NAS + Tape), SIEM
- **CLINICAL:** Fleet Manager, Pumps, Monitor Central Stations, Bedside Monitors, Vents, PACS
- **LEGACY:** Patient Monitors, Ward Workstations, Infusion Pumps (three wards, flat segment)

**Connection lines:** Pixel-art SVG paths (straight horizontal segments with pixel step corners). Connection types (match information pack):
- **Perimeter firewall** (external → enterprise): solid white line, padlock icon at midpoint
- **VPN Gateway** (external → enterprise): dashed line with "No MFA for contractors" label, warning icon
- **Internal firewall** (enterprise → clinical): solid amber line, padlock icon
- **Dual-homed workstation bridges** (enterprise ↔ clinical): dashed orange lines (multiple), warning triangle icon — these are the primary attack vectors
- **Legacy flat segment** (enterprise-level flat L2 connection): thick dashed orange line with "NO SEGMENTATION" label

**Toggle switches:** Each toggleable connection has a small pixel-art toggle widget at the midpoint: left position = `OPEN` (green), right = `CLOSED` (red). Clicking animates the toggle.

**Attack path highlighting (draft enhancement):** When a rule is toggled, draw a red animated arrow showing the attacker's traversal path. Example: toggling the dual-homed workstation link shows: `VPN entry → AD compromise → [dual-homed workstation bridge] → Fleet Manager`.

**Consequence panel** (right sidebar, ~30% width): Header `CONSEQUENCE ASSESSMENT`. When a rule is toggled, a bullet list updates showing affected systems and the clinical workflow impact (e.g., toggling exception rule 1: `EHR access lost on Ward 7 — medication prescribing reverts to paper`). Items appear with a brief slide-in animation.

**Sever button:** A large red pixel-art button at the bottom, initially disabled and greyed out. Label: `SEVER ENTERPRISE → CLINICAL LINK`. Activates after first toggle interaction. On click: confirmation modal — `This will disconnect all clinical zone systems from the enterprise network. Clinical staff will lose EHR access. Confirm?` — YES / NO in pixel-art button style.

### Integration with Information Pack

**Source file:** `case_1_healthcare/information_pack/system_architecture/network_architecture.md`

The Mermaid diagram in that file defines the exact zones, devices, and connections to be rendered. Extract the zone structure, device names, and connection topology directly from that diagram. This ensures consistency between the information pack and the game experience, and makes the architecture visible and learnable to players.

---

## 5. Ransomware Impact Display

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2 — post-encryption; the attack becomes visible
**Core concept:** Ransomware as a patient-safety event, not just an IT disruption; visual blast radius
**Priority:** High
**Draft scenario:** Yes — low implementation cost; can be a static overlay on any workstation object with three action buttons; no state complexity required

### Functional Spec

Replaces the normal workstation interface with a styled attacker ransom note when the global variable `ransomware_deployed` is true. The display is non-interactive for normal workstation functions — players cannot dismiss it to use the machine. Three action buttons at the bottom present the response decision: **[CONTACT ATTACKERS]**, **[REPORT TO NCSC]**, and **[BEGIN RECOVERY PROCESS]**. Each button writes to a corresponding global variable and closes the minigame. This minigame is triggered as an overlay on an existing workstation object via a `lockType: "ransomware_display"` entry in `scenario.json.erb`, activated by the `ransomware_deployed` global state change.

### Visual Design

**Background:** Full black. A faint repeating pixel-art pattern of small padlock icons tiles the background at 10% opacity.

**Central panel:** Dark red (`#3d0000`) pixel-art bordered box, centred. Contents:
- Top: pixel-art skull overlaid on a padlock icon (~64×64 px, limited 4-colour palette)
- Title text: `YOUR FILES HAVE BEEN ENCRYPTED` in large pixel font, red
- Body text in smaller white pixel font (monospace):
  - Organisation name (`NORTHGATE GENERAL HOSPITAL NHS TRUST`)
  - File count encrypted (`312 workstations | 4 file servers | EHR database`)
  - Payment demand (`1.2 BITCOIN — £1,200,000 GBP`)
  - Wallet address in monospace
  - `DO NOT attempt recovery — encrypted files will be destroyed`
- Countdown timer below the body: `TIME REMAINING: HH:MM:SS` in large amber pixel digits, ticking down from 72 hours
- Ransom note footer: `DarkVault Ransomware Group — Support portal: [onion address]`

**Action buttons:** Three equal-width pixel-art buttons along the bottom of the panel, styled in dark grey with pixel-art icons: skull (contact attackers), shield (report to NCSC), wrench (begin recovery).

---

## 6. VPN & Geo-Anomaly Log Viewer

**Category:** vm (Linux terminal)
**Scenario moment:** Day 0 — credential abuse detection opportunity
**Core concept:** Credential stuffing; absence of MFA; geographic anomaly detection; impossible travel
**Priority:** High
**Draft scenario:** Yes — VM content only; uses existing terminal infrastructure; minimal new code

### Functional Spec

A structured VPN authentication log file (`/var/log/vpn/auth.log`) on the scenario VM containing approximately fifty log entries in a consistent line format: `[TIMESTAMP] USER=<username> IP=<ip_address> COUNTRY=<country> MFA=<YES|NO> RESULT=<ACCEPT|REJECT>`. Forty-nine entries are normal UK-based authentications. One entry — mid-file — is an `ACCEPT` from a Romanian residential IP using the username `m.blake`, with `MFA=NO`, outside normal working hours. Players use `grep`, `awk`, or `jq` to identify the anomalous entry. A companion script (`/home/analyst/check_anomaly.sh`) accepts the IP address as an argument; submitting the correct IP writes a flag and emits a `minigame_completed` event. A second file, `/home/analyst/contractor_accounts.txt`, lists contractor usernames to help players know which accounts lack MFA.

### Visual Design

Standard BreakEscape pixel-art terminal. No additional visual design beyond file content formatting. Log entries should be consistently spaced for readability in a terminal at 80 columns. The anomalous entry should not be trivially obvious on first scroll — position it at roughly line 31 of 50.

---

## 7. Backup Recovery Console

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2–3 — recovery strategy decision
**Core concept:** Backup architecture (air-gap, immutability, offsite); recovery time versus malware-reintroduction risk
**Priority:** Medium
**Draft scenario:** Yes — three static tiles with consequence text and a confirm button; straightforward to implement

### Functional Spec

Presents three recovery source tiles. Players click a tile to select it, which expands a consequence information panel below describing the risks and timeline of that recovery path. After reading the consequence, a **[CONFIRM RESTORE FROM THIS SOURCE]** button becomes active. The selection is written to `backup_recovery_source` global state (`nas_encrypted`, `tape_wiped`, or `cloud_vendor`), which triggers different NPC responses and downstream scenario states. Selecting the cloud vendor source also sets a `recovery_eta_hours` variable (18) that is used by the Major Incident Command Board (minigame 12) to display recovery progress.

### Visual Design

**Layout:** Three equal-width tiles arranged horizontally across the panel centre. Below the tiles: a consequence panel. At the bottom: confirm button.

**Tile — NAS appliance:** Pixel-art rack-mounted drive array icon. Status badge overlay: `ENCRYPTED` in red pixel font. A red X icon in the top-right corner. Tile background: dark red tint.

**Tile — Tape Library:** Pixel-art tape reel icon. Status badge: `CATALOGUE WIPED` in red. Red X overlay. Dark red background.

**Tile — Vendor Cloud Backup:** Pixel-art cloud icon with an upward arrow (restore). Status badge: `AVAILABLE` in green. Sub-label: `ETA: 18 HOURS`. Amber warning icon (not a red X — available but with caveats). Slightly green-tinted background.

**Consequence panel** (expands below tiles on selection): Header `CONSEQUENCE ASSESSMENT — [SOURCE NAME]`. Bullet-point list in pixel font describing: data integrity risk, estimated restore time, whether malware may be reintroduced, operational impact during the wait. NAS and tape selections show a red warning banner: `WARNING: THIS SOURCE IS COMPROMISED`. Cloud selection shows an amber banner: `CAUTION: 18-HOUR RESTORATION WINDOW — MANUAL CLINICAL OPERATIONS REQUIRED`.

**Confirm button:** Disabled and grey until a source is selected. Activates to amber pixel-art button labelled `CONFIRM RESTORE FROM [SOURCE]`.

---

## 8. Bedside Infusion Pump Terminal

**Category:** minigame (Phaser.js)
**Scenario moment:** Day 2 — manual dose entry after fleet console loss
**Core concept:** Paper fallback hazards; transcription error as a patient safety event; the double-check protocol as a safety barrier
**Priority:** High
**Draft scenario:** Yes — the single most important player-interaction safety moment in the scenario; the pixel-art pump keypad and ambiguous prescription are central to the experience

### Functional Spec

Simulates the physical interface of a smart infusion pump. Players are presented with a scanned paper prescription and must transcribe the dose value into the pump keypad. The prescription value is deliberately formatted to be prone to misreading — for example, `10.0 mg` rendered in a pixel-art handwriting-style font where the decimal point is small and the trailing zero is ambiguous. If the player enters a correct value and confirms, `pump_dose_correct = true` is set. If the player enters an incorrect value (e.g., 100 instead of 10), an on-screen double-check prompt appears: `You have entered [X] mg. Verify against prescription. Confirm?`. If the player confirms the wrong dose, `pump_dose_error = true` is written to global state, triggering a patient safety consequence and an NPC reaction. If they cancel and correct the entry, `pump_dose_correct = true` is set instead. This models the double-check protocol as a safety control.

### Visual Design

**Outer frame:** A pixel-art medical pump device body — grey/cream plastic bezel with rounded corners, pixel-art screws at the corners. Styled to evoke a real infusion pump (Alaris/BD aesthetic, simplified). The pump occupies roughly 60% of the panel width, centred.

**Pump display screen** (top portion of device): Dark background with green pixel text. Shows:
- `DRUG: [DRUG NAME]`
- `CURRENT RATE: [X] mL/hr`
- `VOL REMAINING: [X] mL`
- `ENTER NEW RATE:` with a blinking cursor and the digits typed so far

**Paper prescription panel** (left of device, ~35% panel width): A pixel-art rendering of a printed/handwritten prescription — off-white background, lined paper texture (subtle), text in a slightly irregular pixel font simulating handwriting. Shows: patient name, drug, dose, rate, prescriber signature line. The critical value is rendered in a way that invites misreading.

**Keypad** (bottom portion of device): 3×4 grid of pixel-art keycap buttons: digits 0–9, decimal point, and a backspace key. Below: a large `[CONFIRM]` key in green pixel-art style.

**Double-check modal** (appears after CONFIRM if value is entered): Centred modal overlay on the panel. Dark background, amber border. Text: `VERIFY DOSE BEFORE ADMINISTRATION` in amber, then the entered value and drug prominently displayed. Two buttons: `[CORRECT — ADMINISTER]` (green) and `[INCORRECT — RE-ENTER]` (red).

---

## 9. Drug Library Integrity Checker

**Category:** vm (Linux terminal)
**Scenario moment:** Day 3 — verification of clinical device safety data before return to service
**Core concept:** Drug library tampering as a silent patient safety threat; integrity verification with checksums and diff
**Priority:** High
**Draft scenario:** Yes — VM content only; uses existing terminal infrastructure; delivers the integrity-attack discovery moment central to the scenario

### Functional Spec

A CSV drug library file (`/opt/pump-management/drug_library.csv`) on the scenario VM containing approximately twenty entries with fields: `DRUG_NAME, CONCENTRATION_MG_PER_ML, DOSE_MIN, DOSE_MAX, DOSE_UNIT, RATE_MAX_ML_HR`. A reference integrity manifest (`/opt/pump-management/drug_library.sha256`) contains the expected SHA-256 hash of the known-good library, plus a known-good backup copy at `/opt/pump-management/drug_library.bak`. One entry has been silently modified — the `DOSE_MAX` for a high-risk drug (e.g., morphine) inflated by a factor of ten. Players use `sha256sum -c drug_library.sha256` to detect file-level tampering, then `diff drug_library.csv drug_library.bak` to identify the specific changed line. A verification script (`/home/analyst/verify_library.sh [DRUG_NAME] [CORRECT_DOSE_MAX]`) accepts the correct values and emits a flag on correct submission, writing `drug_library_verified = true` to global state.

### Visual Design

Standard BreakEscape pixel-art terminal. CSV file should be formatted with consistent column widths (pipe-delimited or fixed-width) for readability. The diff output should clearly highlight the one changed field.

---

## 10. Firmware Verification Console

**Category:** vm (Linux terminal)
**Scenario moment:** Day 3 — infusion pump return to service following network compromise
**Core concept:** Firmware integrity; the safety case implication of deploying unverified device firmware
**Priority:** Low
**Draft scenario:** No — secondary depth; David Osei's dialogue covers the firmware integrity concept adequately in the draft; add in a subsequent version alongside the device withdrawal decision

### Functional Spec

A directory (`/opt/pump-firmware/`) on the scenario VM containing firmware image files for five pump models, each named by serial number (e.g., `PUMP-A04-v2.3.1.bin`). A manufacturer reference hash file (`/opt/pump-firmware/manufacturer_hashes.sha256`) lists the expected SHA-256 for each. Running `sha256sum -c manufacturer_hashes.sha256` in that directory produces four `OK` results and one `FAILED` — the mismatched pump's serial number is the answer. A reporting script (`/home/analyst/flag_pump.sh [SERIAL]`) accepts the serial number, emits a flag on correct input, and writes `compromised_pump_identified = true` to global state. A companion file (`/home/analyst/pump_register.txt`) maps serial numbers to ward and bed locations, giving the finding clinical context.

### Visual Design

Standard BreakEscape pixel-art terminal. The `sha256sum -c` output format is self-explanatory; no additional visual design is needed beyond ensuring the pump register file is clearly formatted.

---

## 11. Governance & Dual-Authorisation Panel

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2 — network isolation requires sign-off from two separate organisational stakeholders
**Core concept:** Dual-authorisation as a safety control; the governance gap between IT Security and Clinical Engineering as a structural risk
**Priority:** High
**Draft scenario:** Yes — extends existing PIN minigame framework with two-panel logic; the physical mechanic of requiring two codes from two rooms is a core puzzle and governance teaching moment

### Functional Spec

Extends the existing PIN minigame framework. Presents two separate four-digit PIN entry panels, one for each authorising stakeholder. The IT Security Manager's code is obtainable by completing NPC dialogue with Ravi Anand; the Clinical Engineering Manager's code is obtainable from David Osei's NPC. Both codes must be entered within a configurable time window (default: 5 minutes). Each panel writes to its own global variable (`itsec_authorised`, `clinical_eng_authorised`) when the correct code is entered. The central authorise button activates and becomes clickable only when both variables are true. On activation, `network_isolation_authorised = true` is written, triggering downstream scenario events. If the time window expires with only one code entered, `dual_auth_failed = true` is set and an NPC reacts.

### Visual Design

**Layout:** Full-panel, split vertically into two equal halves with a central status display between them.

**Left panel — IT Security Manager:** Header `IT SECURITY MANAGER AUTHORISATION` in pixel font. Below: a 4-digit pixel-art display (dark screen with amber digit segments, like a physical PIN pad display). Below the display: pixel-art numeric keypad (3×3 grid plus 0 and backspace). Footer badge: `RAVI ANAND — INFORMATION SECURITY` in small pixel text. Status badge below keypad: `[PENDING]` in grey, transitions to `[AUTHORISED]` in green with a tick icon when correct code entered.

**Right panel — Clinical Engineering Manager:** Mirror layout. Header `CLINICAL ENGINEERING AUTHORISATION`. Footer: `DAVID OSEI — CLINICAL ENGINEERING`. Same status badge behaviour.

**Central strip:** Vertical divider with a pixel-art chain/link icon at the midpoint. Below the icon: `BOTH AUTHORISATIONS REQUIRED`. Timer bar below that: a pixel-art countdown bar depleting left to right. Colour transitions amber → red as time runs low.

**Authorise button** (bottom centre): Large pixel-art button, initially greyed out and labelled `AWAITING DUAL AUTHORISATION`. When both panels show `[AUTHORISED]`, button activates to green: `AUTHORISE NETWORK ISOLATION`. On click: brief pixel-art animation (chain breaking, or lock opening), then minigame completes.

---

## 12. Major Incident Command Board

**Category:** minigame (HTML/CSS)
**Scenario moment:** Persistent throughout the scenario — ambient consequence tracker
**Core concept:** Incident response coordination; cascading consequences of security decisions on clinical operations
**Priority:** Medium
**Draft scenario:** Simplified — for the draft, pre-seed the timeline with the overnight events and auto-append entries on global state changes; the manual entry field and animated slide-ins are enhancements

### Functional Spec

A persistent, always-visible display (typically rendered on a large wall-mounted prop screen in the incident response room) that auto-populates as global state changes. The minigame listens for `global_variable_changed:*` events and maps specific variable names to pre-authored timeline entries. For example, `ransomware_deployed = true` appends `[22:15] RANSOMWARE DEPLOYED — Enterprise zone encrypted`. Players can add manual entries using a text field at the bottom. The board also maintains a live system status panel driven by global variables: each key system (`ehr_status`, `central_station_ward7_status`, `fleet_console_status`, etc.) maps to a row with a status label. This minigame does not have a completion state — it runs continuously and is opened/closed like a notice board.

### Visual Design

**Overall aesthetic:** Landscape format (16:9 if possible). Pixel-art whiteboard or projector-screen border frame. Header bar: `NORTHGATE GENERAL HOSPITAL — MAJOR INCIDENT RESPONSE` in red pixel font with a flashing red dot indicator.

**Left column (~60% width) — Incident Timeline:** Scrollable list. Each entry is a pixel-art "sticky note" tile: timestamp on the left in amber, event description in white, and a small icon indicating event type (skull = security event, cross = clinical event, wrench = response action, person = decision made). New entries slide in from the left with a short animation. Auto-generated entries are labelled with a pixel `[AUTO]` badge; player-entered entries have a `[MANUAL]` badge.

**Right column (~40% width) — System Status Panel:** Header `SYSTEM STATUS`. Table of key systems, each row showing: system name (left) and current status badge (right). Status badge colours: green `OPERATIONAL`, amber `DEGRADED`, red `OFFLINE`, grey `UNKNOWN`. Updates in real time as global variables change.

**Bottom bar — Manual Entry:** A pixel-art text input field spanning the full width, labelled `LOG DECISION OR ACTION`. A `[POST]` button to the right. Submitted entries appear in the timeline immediately.

---

## 13. PACS Image Integrity Challenge

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2 — PACS compromise; diagnostic data integrity risk
**Core concept:** DICOM metadata tampering; clinical impact of incorrect patient-image association; integrity of diagnostic information as a safety requirement
**Priority:** Low
**Draft scenario:** No — Scenario 02 content; not part of the primary ransomware narrative; add in a version that incorporates the device integrity attack storyline

### Functional Spec

Displays a grid of pixel-art stylised medical image thumbnails, each accompanied by a metadata panel showing patient ID, patient name, scan type, and date. One image has been given the wrong patient metadata — the image belongs to a different patient than the displayed ID indicates. A patient register sidebar lists the correct patient-to-scan associations. Players click thumbnails to expand them and compare their metadata against the register. Selecting the mismatched image and clicking **[REPORT INTEGRITY FAILURE]** writes `pacs_mismatch_reported = true` to global state and emits `minigame_completed`. Selecting a wrong image shows a brief `MISMATCH NOT CONFIRMED — REVIEW AGAIN` message without penalty. A `pacs_reviewed` variable is set after the player has clicked at least three thumbnails, enabling NPC dialogue about DICOM security.

### Visual Design

**Layout:** Full-panel. Left ~70%: image grid. Right ~30%: patient register + expanded view.

**Image thumbnails:** 3×3 grid of pixel-art medical image representations — not photorealistic, but clearly medical in character: stylised greyscale chest X-ray silhouettes, CT cross-section circles with pixel internal structure, simple bone outlines for plain X-rays. Each thumbnail sits in a pixel-art panel with a metadata label strip below it: `ID: [PATID] | [SURNAME, INITIAL] | [SCAN TYPE] | [DATE]`. All thumbnail borders are neutral (dark grey). The mismatched thumbnail has no visible border indicator — the mismatch is only apparent when cross-referenced with the patient register.

**Patient register sidebar:** Header `PATIENT REGISTER`. A scrollable list of patient entries: `[PATIENT ID] — [NAME] — EXPECTED SCAN: [TYPE]`. One entry's expected scan type will not match the image displayed under their ID in the grid.

**Expanded view** (replaces register when a thumbnail is clicked): Shows the selected image at larger size (~200×200 px), full metadata fields listed below, and a `[REPORT INTEGRITY FAILURE]` button in red. A `[BACK TO REGISTER]` button returns to the patient list.

---

## 14. EHR Prescribing Terminal

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2 — EHR offline; loss of drug-interaction and allergy checking
**Core concept:** EHR availability as a patient safety dependency; paper fallback reintroduces hazards that electronic prescribing eliminated
**Priority:** Medium
**Draft scenario:** Simplified — for the draft, the EHR terminal only needs the offline error state (triggered by network isolation); the full patient records and drug-interaction view are enhancements that deepen the pre-isolation scene

### Functional Spec

A simplified clinical information system UI showing a patient list and individual patient records with medications, allergy flags, and active prescriptions. When global variable `ehr_status` is `online`, the terminal is fully functional and players can browse records, viewing allergy warnings and dose-range checks. When `ehr_status` transitions to `offline`, the terminal shows a connection error state and all record data becomes inaccessible. A `ehr_terminal_viewed_online` variable is set when a player browses at least one patient record while online; `ehr_terminal_viewed_offline` is set when they attempt access while offline. These variables enable NPC dialogue about the specific clinical safety functions that are lost — allergy checking, drug interaction warnings, electronic dose verification — and prompt players to locate the physical paper fallback record in the room.

### Visual Design

**Online state — Layout:** Pixel-art clinical software aesthetic. Dark navy background. Header bar: `NORTHGATE TRUST EHR — PRESCRIBING MODULE` with a green `[ONLINE]` status badge.

**Patient list** (left ~30%): Scrollable list of patient entries. Each row: patient name, ward/bed number, a small coloured dot indicating allergy status (red = known allergy on record, grey = none). Clicking a row selects the patient.

**Patient record panel** (right ~70%): Shows selected patient. Sections:
- Demographics block (name, DOB, ward, consultant) in a pixel-art box
- **Allergy alert box** — red-bordered pixel panel if allergies are present, listing allergens in bold red pixel font; grey/empty if no allergies
- Current medications table: drug name, dose, frequency, route — with amber warning icons where drug interactions exist
- Active prescriptions with dose-range indicators: a small pixel-art bar showing prescribed dose position within the safe range (green zone), with red zones at extremes

**Offline state:** The entire panel dims. A pixel-art warning icon (amber triangle, exclamation mark) appears centred. Text below: `CONNECTION TO EHR SERVER LOST`. Subtext: `Electronic prescribing unavailable. Revert to paper medication charts. Contact pharmacy for manual verification.` The header badge changes to red `[OFFLINE]`. Patient list and record panel are greyed out and non-interactive.

---

## 15. Alarm Threshold Tamper Challenge

**Category:** vm (Linux terminal)
**Scenario moment:** Scenario 02 — silent alarm manipulation by an attacker with clinical zone access
**Core concept:** Attackers can suppress alarms without triggering alerts; alarm configuration integrity as a patient safety control
**Priority:** Low
**Draft scenario:** No — Scenario 02 content; not part of the primary ransomware narrative

### Functional Spec

A configuration file (`/etc/monitors/ward7_thresholds.conf`) on the scenario VM containing alarm threshold parameters for the ward patient monitoring system: `HR_HIGH`, `HR_LOW`, `SPO2_LOW`, `BP_SYSTOLIC_HIGH`, `BP_SYSTOLIC_LOW`, `RR_HIGH`, and others. Clinically correct reference ranges are documented in a companion file (`/home/analyst/safe_threshold_ranges.txt`). One parameter has been silently tampered with: `SPO2_LOW` is set to `50` instead of the clinically correct `90` (per cent), meaning a patient in serious desaturation would not trigger an alarm. Players compare the configuration against the reference ranges to identify the out-of-range value. A reporting script (`/home/analyst/report_tamper.sh [PARAMETER] [CORRECT_VALUE]`) accepts the finding, emits a flag on correct input, and writes `alarm_tamper_identified = true` to global state.

### Visual Design

Standard BreakEscape pixel-art terminal. The configuration file should use a clear `KEY = VALUE` format, one parameter per line, with inline comments showing the parameter description (but not the expected range — that information is in the separate reference file, requiring players to read both).

---

## 16. Trust Safety Case Document (Interactive Readable Object)

**Category:** interactive game object (readable)
**Scenario moment:** Phase 3 — Major Incident Room; David Osei consults it before giving authorization code
**Core concept:** Safety cases as living documents; the three SIS pathways (device integrity, clinical data, enterprise isolation) grounded in written claims; visual understanding of how security claims support patient safety
**Priority:** High (draft scenario)
**Draft scenario:** Yes — one-page document placed as a readable prop on the Major Incident Room table; players can examine it; David references it in dialogue

### Functional Spec

A one-page (or 2-page) "Safety Case Summary" document that players can pick up and read in-game. The document is sourced directly from `case_1_healthcare/information_pack/requirements/claims.md` and `case_1_healthcare/information_pack/assurance_cases/assurance_case_overview.md`. 

**Content to include:**
1. **Title:** "Northgate General Hospital — Safety Case for Clinical Device Network"
2. **Goal statement:** "Patient safety is maintained through three interconnected safety strategies"
3. **Three sub-goals (the SIS pathways):**
   - Medical Device Integrity (supported by claims HC-002, HC-003, HC-004)
   - Clinical Data Integrity & Availability (supported by claims HC-006, HC-008, HC-010)
   - Enterprise Isolation (supported by claims HC-001, HC-005, HC-007)
4. **Seven key claims** (all claim statements, one-line each):
   - CLAIM-HC-001: Network Segmentation Protects Device Integrity
   - CLAIM-HC-003: Drug Library Change Control Preserves Dose Safety
   - CLAIM-HC-005: Vendor Access Controls Prevent Supply-Chain Attack
   - CLAIM-HC-006: Immutable Backups Enable Safety-Preserving Recovery
   - CLAIM-HC-007: Integrated Incident Response Prevents Containment-Induced Hazards
   - (Optional additional claims for depth: HC-002, HC-004)
5. **Simple visual:** Optional simplified Mermaid diagram or text box showing the three sub-goals and their supporting claims (simplified version of the GSN structure from the information pack)
6. **Annotation fields:** Spaces for annotations or notes (could be pre-annotated by David to show his thinking)

**Game mechanic:**
- Object: readable prop on Major Incident Room table
- Interaction: player can pick up or tap to view full document as a modal/overlay
- NPC integration: David Osei pulls out or points to the document during his dialogue branches; text on screen reads: `[David points to the safety case document on the table]`
- Dialogue triggers: Players can examine the document before, during, or after David's safety case advisory dialogue (HC-001 and HC-003 branches)
- Consequence: Examining the document sets a global variable `safety_case_document_reviewed = true` (optional, for tracking player engagement)

### Implementation Notes

This is a **direct integration** of information pack content into the game. No new minigame code needed — uses existing "readable object" / modal display system. The document text is extracted from the claims and assurance case overview files and formatted for in-game display. Can be implemented as:
1. A rendered image (screenshot of a Word doc formatted as a one-page summary)
2. HTML text displayed in a styled modal
3. Combination of both (image for fidelity, text for accessibility)

### Visual Design

**Physical prop appearance:**
- Printed document: 1-2 pages, dog-eared, worn, on white/cream paper
- Font: Legible pixel font or similar (matching game aesthetic)
- Layout: Title at top, three sub-goal sections, bulleted claims, optional simplified diagram at bottom
- Optional: Handwritten margin notes by David (adds immersion)
- Optional: Yellow highlighter marks on key claims (HC-001, HC-003, HC-007)

**Modal display (when player opens):**
- Full document text and diagram rendered in a scrollable modal
- Dark overlay background
- `[CLOSE]` button at bottom

---

## 17. Disclosure & Regulatory Notification Console

**Category:** minigame (HTML/CSS)
**Scenario moment:** Day 2 onwards — ICO, NHS England, and patient disclosure decisions
**Core concept:** Regulatory obligations under GDPR and DSPT; disclosure timing as a governance decision with safety and legal consequences
**Priority:** Low
**Draft scenario:** No — the regulatory/disclosure dimension is handled adequately through Dr Hartley NPC dialogue in the draft; this minigame adds depth but is not on the critical path

### Functional Spec

Presents three notification recipient panels, each with a countdown to its reporting deadline, a draft notification template (editable text area), and a **[SEND NOTIFICATION]** button. Deadlines: ICO (72-hour GDPR window from discovery), NHS England/DSPT (immediate serious incident notification), patients/public (no fixed deadline — a judgement call). Sending a notification early writes `notified_[recipient]_early = true`; sending late (after deadline) writes `notified_[recipient]_late = true`; not sending at all leaves the variable unset, which the scenario uses to apply a regulatory sanction consequence in later NPC dialogue. A consequence panel on the right updates as each notification is sent, describing the outcome (compliance, reputational effect, NPC reaction). The Caldicott Guardian NPC reacts specifically to patient disclosure timing; the CIO reacts to ICO notification timing.

### Visual Design

**Layout:** Full-panel. Three equal-width recipient panels arranged horizontally across the top two-thirds. Consequence panel below.

**Each recipient panel:**
- Header with recipient name and icon: ICO (pixel-art scales of justice), NHS England (pixel-art cross/shield), Patients/Public (pixel-art people silhouettes)
- Countdown timer: `DEADLINE: HH:MM:SS` in large amber pixel digits, transitioning to red when under 30 minutes, then to a flashing `DEADLINE PASSED` badge in red if expired
- Draft notification text area: pixel-art bordered text box with the pre-authored draft (short, editable). Pixel-art cursor blinks in the text area.
- Status badge below the text area: `[NOT YET NOTIFIED]` (grey) → `[NOTIFIED — [time sent]]` (green) or `[DEADLINE MISSED]` (red)
- `[SEND NOTIFICATION]` button: amber pixel-art button; disabled/grey after sending

**Consequence panel** (bottom, full width): Header `CONSEQUENCE LOG`. As each notification decision is made, a bullet entry appears describing the outcome: regulatory status, estimated fine risk, stakeholder reaction summary. Each entry has a small coloured icon: green (good outcome), amber (partial), red (negative consequence).

**NPC reaction indicators** (bottom-right corner): Two small pixel-art NPC portrait badges — Caldicott Guardian and CIO — each with a mood indicator (neutral, positive, negative) that updates as disclosure decisions are made.
