# TODO — sis01_healthcare: Northgate Hospital
## Remaining work to reach a complete, playable scenario

**Last reviewed:** April 2026

**P1 status:** Both P1 blockers resolved. MG-06 and MG-09 minigames merged — scenario is now first-playable. Remaining work is P2/P3.

| Blocker | Plan doc | Status |
|---------|----------|--------|
| ~~MG-06 VPN Log Filter~~ | `planning_notes/sis_scenarios/case_1_healthcare_game_design/new_minigames/mg06_vpn_log_filter_builder.md` | ✅ merged |
| ~~MG-09 Drug Library Integrity Checker~~ | `planning_notes/sis_scenarios/case_1_healthcare_game_design/new_minigames/mg09_drug_library_integrity.md` | ✅ merged |

Priority key: **[P1]** blocking for first playable run · **[P2]** needed for full learning objectives · **[P3]** polish / post-draft

---

## DONE — previously listed as TODO

- ✅ All 11 Ink files written and compiled to `.json`
  - Duplicate `rushing_bed4` knot in `npc_patrol_nurse.ink` found and removed; recompiled clean
- ✅ `ravi_rfid_card` keycard added to Ravi's `itemsHeld`; given to player in `npc_ravi.ink:start`
- ✅ `dual_auth` minigame wired (`type:dual_auth`, pins from ERB `scenarioData`; not a lock — interacted directly)
- ✅ `backup-recovery` minigame wired (`type:backup_recovery`, sources in `scenarioData`; not a lock)
- ✅ `ehr-terminal` minigame wired (`type:ehr-terminal`, patient data in `scenarioData`)
- ✅ `network-segmentation-map` minigame wired; `network_rules_reviewed` set on first rule interaction
- ✅ `command_board` wired and listening to all major global vars
- ✅ NSM SEVER governance bypass documented; `requiresGlobal` engine TODO filed
- ✅ MG-08 infusion pump wired (`type:infusion_pump`; `drug_name`/`correct_dose` in `scenarioData`; `paper_charts_collected` gate built into minigame)
- ✅ `backup_reinfected` now wired via `backup-recovery` minigame (fires 30 s after restore if `network_isolated` was false at confirm time)
- ✅ `completeTask` eventMappings added to all NPCs so aim-completion chain works end-to-end
- ✅ Placeholder sprite PNGs created for all new minigame types (`infusion_pump`, `backup_recovery`, `dual_auth`, `ehr-terminal`, `network-segmentation-map`, `command_board`)
- ✅ `alertConfig` support added to `siem-dashboard-minigame.js`; `northgate_2025_11` alert set registered (4 critical alerts + 20 noise; covers FINWKS-047, DC01, FILESERVER-02, FIREWALL-CORE)

---

## ~~1. VPN ANOMALY ANALYSIS (MG-06)~~ — **DONE ✅**

MG-06 merged. `vpn_terminal` wired with `type:vpn_log_terminal`; 50-entry filterable log table; token-based filter builder; threat intel lookup; impossible travel detection. `completionActions` set `vpn_anomaly_identified=true` and complete `vpn_anomaly` task. Progress globals `vpn_threat_intel_checked` and `vpn_impossible_travel_identified` set via `progressActions`. VM path (Option A) still available for Hacktivity bash-skills cohorts — see plan doc.

Two implementation paths remain available for context:

### Option A: Hacktivity VM — `northgate_vpn_logs` (bash skills focus)

Best for: cybersecurity cohorts where grep/awk proficiency is an explicit learning objective.

Note: the VPN log printout on the IT office desk already circles `m.blake` and points to `contractor_accounts.txt`. Redact the annotation to `"Check the VPN terminal"` before deploying with the VM, or the paper props give the answer away.

| Path | Content |
|------|---------|
| `/var/log/vpn/auth.log` | ~50 entries: `[TIMESTAMP] USER=<u> IP=<ip> COUNTRY=<c> MFA=<YES\|NO> RESULT=<ACCEPT\|REJECT>`. Anomalous entry at ~line 31: `2025-11-04 08:52 USER=m.blake IP=185.220.101.47 COUNTRY=Romania MFA=NO RESULT=ACCEPT` |
| `/home/analyst/contractor_accounts.txt` | List of contractor accounts; `m.blake` noted as no-MFA |
| `/home/analyst/check_anomaly.sh` | Accepts IP address arg; validates against known-bad range; emits flag `vpn_flag_1` on correct submission |

Player workflow: `grep` through `auth.log` → spot Romanian IP → `./check_anomaly.sh 185.220.101.47` → submit flag.

### Option B: Log Analyser minigame (recommended default)

Best for: mixed audiences, time-constrained sessions, or scenarios where bash skills are not an objective.

A purpose-built HTML/JS minigame: a filterable table of 50 VPN auth log entries. Player applies a country/MFA filter, selects the anomalous row (`m.blake`, Romania, no MFA), and the flag submits on confirmation. No VM infrastructure required. Paper props work *with* the minigame (they point to the terminal; the terminal is the investigation tool).

**Same flag station wiring as Option A** — `vpn_flag_1` → `vpn_anomaly_identified=true`. No scenario changes needed to switch between options.

> **Current state:** Flag station wired, `vpn_flag_station` workaround available for testing. **Minigame plan written** — see `planning_notes/sis_scenarios/case_1_healthcare_game_design/new_minigames/mg06_vpn_log_filter_builder.md`. Implements Option B as the default deployment (filterable log table, no VM). Option A VM spec remains accurate for Hacktivity bash-skills cohorts.

---

## ~~2. DRUG LIBRARY INTEGRITY (MG-09)~~ — **DONE ✅**

MG-09 merged. `drug_library_checker` wired with `type:drug_library_terminal`; 5-step integrity checker (SHA-256 scan → hash detail → diff view → multi-source verification → fleet report); MORPHINE DOSE_MAX tamper (4→40 mg/hr) detected; fleet impact analysis cross-links with MG-08 pump outcome. `scanActions` set `drug_library_compromised=true`; `completionActions` set `drug_library_verified=true` + `drug_library_restored=true`. VM path (Option A) still available for Hacktivity forensics cohorts — see plan doc.

Two implementation paths remain available for context:

### Option A: Hacktivity VM — `northgate_pump_mgmt` (file integrity / forensics focus)

Best for: cybersecurity cohorts where `sha256sum`, `diff`, and shell scripting are explicit objectives.

| Path | Content |
|------|---------|
| `/opt/pump-management/drug_library.csv` | 23 entries; `MORPHINE,DOSE_MAX` tampered from `4` to `40` |
| `/opt/pump-management/drug_library.sha256` | SHA-256 of known-good library (fails for tampered csv) |
| `/opt/pump-management/drug_library.bak` | Known-good backup (matches hash) |
| `/home/analyst/verify_library.sh` | Accepts `DRUG_NAME DOSE_MAX`; emits `drug_flag_1` on `morphine 4` |

Player workflow: `sha256sum -c drug_library.sha256` → FAILED → `diff drug_library.csv drug_library.bak` → find tampered MORPHINE row → `./verify_library.sh morphine 4`.

### Option B: Drug Library Checker minigame (recommended default)

Best for: mixed audiences, and scenarios emphasising the *clinical safety* connection over bash proficiency.

A purpose-built HTML/JS minigame showing the pump management console drug library table. One row (Morphine) shows a checksum mismatch indicator. Player cross-references the paper MAR charts or backup report, selects the correct max dose (`4`), and restores the entry. This makes the Morphine/pump connection from MG-08 visually explicit — the tampered value the pump was loading is the same one the player just corrected at Bed 2.

Additional benefit: completing the minigame can set `drug_library_restored=true` directly (currently an unwired consequence variable), which unlocks Sharma's restoration branch in the debrief. Note: `drug_library_restored` is also set by the existing `drug_library_flag_station` flagRewards — the MG-09 `completionActions` will additionally set it. This is intentionally idempotent; confirm the MG-09 plan's `completionActions` list matches the flag station's `flagRewards` before removing the flag station.

**Same flag station wiring as Option A** — `drug_flag_1` → `drug_library_verified=true` + `drug_library_compromised=true`. No scenario changes needed to switch between options.

> **Current state:** Flag station wired, `drug_library_flag_station` workaround available for testing. **Minigame plan written** — see `planning_notes/sis_scenarios/case_1_healthcare_game_design/new_minigames/mg09_drug_library_integrity.md`.

---

## ~~2. MINIGAME — Infusion Pump Terminal (MG-08)~~ — **DONE ✅**

MG-08 merged. `bed2_pump_terminal` wired with `lockType:infusion_pump`; `drug_name`/`correct_dose` in `scenarioData`. All mechanics implemented: paper_charts gate, decimal-ambiguity prescription panel, double-check modal, `pump_dose_correct`/`pump_dose_error`, silent drug-library-compromised path.

---

## 3. SIEM ALERT DATA — Northgate customisation — **[P2]**

The SIEM minigame ignores `alertConfig` in `scenarioData` and uses `createSeededAlerts()`. The existing hardcoded alerts already include the Northgate-relevant entries, so **the scenario is testable now**. For a polished run:

Add `alertConfig` support to `siem-dashboard-minigame.js` to load scenario-specific alert sets. The Northgate set needs:

**Critical (must escalate):**
- `CRIT` / `FINWKS-047` — "Encoded PowerShell execution — base64 encoded command"
- `CRIT` / `DC01` — "LSASS memory access by non-system process"
- `HIGH` / `FILESERVER-02` — "Anomalous SMB write volume — 847 files in 3 min"
- `HIGH` / `FIREWALL-CORE` — "RDP session: ENTPWKS-012 → CLINWKS-003 (cross-zone)"

**Noise (~20 benign):** VLAN migration traffic, backup jobs, routine auth events, printer spools, spanning-tree recalculations.

---

## 4. SPRITES / VISUAL ASSETS — **[P2/P3]**

### Character sprites **[P2]**

| NPC | Current (placeholder) | Needed |
|-----|----------------------|--------|
| `sarah_mitchell` | `female_scientist` | NHS nurse: dark blue scrubs, lanyard, clipboard |
| `patrol_nurse` | `female_security_guard` | Same as Sarah or variant |
| `david_osei` | `male_hacker_hood_down` | Clinical engineer: smart casual, NHS lanyard |
| `dr_sharma` | `female_spy` | NCSC investigator: dark suit, government lanyard |

Minimum viable: nurse + clinical engineer. Sharma and patients can remain placeholders for the draft.

### Object sprites **[P3]**

Placeholder copies of `pc.png` created for all new minigame types — validator errors resolved. Commission proper assets when ready:
- ~~`ehr-terminal.png`~~ ✅ placeholder in place
- ~~`network-segmentation-map.png`~~ ✅ placeholder in place
- ~~`command_board.png`~~ ✅ placeholder in place
- `vpn_log_terminal.png` ✅ quick placeholder copied from `pc.png` (MUST replace with bespoke VPN terminal art)
- `drug_library_terminal.png` ✅ quick placeholder copied from `pc.png` (MUST replace with bespoke drug-library console art)
- `infusion_pump.png` ✅ placeholder in place
- `backup_recovery.png` ✅ placeholder in place
- `dual_auth.png` ✅ placeholder in place

Placeholder debt note:
- `vpn_log_terminal.png` and `drug_library_terminal.png` were added to clear validator-invalid missing assets during April 2026 remediation.
- These are intentionally temporary and should be replaced before final scenario release.

---

## 5. ENGINE GAPS — **[P2/P3]**

### NSM SEVER governance bypass **[P2]**

The network segmentation map's SEVER button writes `network_isolated=true` directly after reviewing one rule, bypassing the `dual_auth_panel` governance flow. A player can isolate the network without obtaining both PINs.

**Fix:** add a `requiresGlobal` param to the NSM minigame that disables SEVER until the named var is true:
```json
"scenarioData": { "requiresGlobal": "network_isolation_authorised" }
```
Until implemented, document in facilitator notes: players who use NSM SEVER skip the dual-auth learning objective (`network_isolation_authorised` remains `false` as a detectable signal).

**Narrative consequence (implemented):** Ravi and David now bark on `network_isolated=true && !network_isolation_authorised` — expressing that they were not consulted. Their `post_isolation` Ink knots are gated behind `network_isolation_authorised=true` so they only fire on the authorized path. Sarah and Helen's `post_isolation` reactions (clinical consequences) still fire regardless of path.

**Authorisation model clarification:**
- Intended realistic model can be dual authorisation + single implementer (incident responder/techie executes change).
- If this model is retained, the SEVER action must clearly validate both authorisations before execution and log who authorised vs who executed.

**Alternative hard-lock option (consider re-implementation):**
- On clicking SEVER, open a simple PIN lock requiring both authorisation PINs before applying `network_isolated=true`.
- Reuse current NPC handover flow: Ravi and David already provide authorisation notes; include an `itsec_pin` and a `clinical_pin` in those notes.
- On success, set `network_isolation_authorised=true` and execute isolation.
- On failure/cancel, keep SEVER unexecuted and surface governance warning text.

### Consolidate vpn_log_terminal → log_filter_terminal **[P3]**

`vpn-log-viewer` (`vpn_log_terminal`) and `log-filter` (`log_filter_terminal`) are redundant minigames. The log-filter was explicitly designed as the successor and already documents `logType: "vpn"` for the sis01 use case.

**Blocker:** the two minigames use different data formats. vpn-log-viewer generates log entries synthetically from compact config (`entryCount`, `anomaly`, `noise`). log-filter requires explicit `logEntries[]` in the scenario JSON.

**Migration path:**
1. Add synthetic log generation to log-filter (port the build logic from vpn-log-viewer), keyed on `logType: "vpn"` with the same `entryCount`/`anomaly`/`noise` config shape.
2. Change the sis01 `vpn_terminal` object type from `vpn_log_terminal` → `log_filter_terminal`.
3. Rename its nested `"scenarioData"` key to `"minigameData"` (consistent with sis02/sis03).
4. Remove the `vpn-log-terminal` handler from `interactions.js`, the `startVpnLogViewerMinigame` starter, and the `vpn-log-viewer` minigame directory.

### Pharmacist patrol while hidden **[P3]**

Verify `pharmacist_npc` (has both `initiallyHidden:true` and `patrol.enabled:true`) does not pathfind while hidden. Expected: patrol only activates when `setVisible:true` fires from the `pharmacist_on_ward` eventMapping.

### Unresolvable consequence variables **[P3]**

These globals have no setter yet — they represent failure paths and double-jeopardy conditions:

| Variable | What's needed |
|----------|--------------|
| ~~`drug_library_restored`~~ | ✅ Set via DrugLibraryIntegrityMinigame restore confirm (MG-09) `completionActions` |
| ~~`patient_bed2_deceased`~~ | ✅ `bed2_double_jeopardy` timer: `startOnGlobal:pump_dose_error`, 2 s delay, condition `drug_library_compromised`; sets `patient_bed2_state:"critical"` + `patient_bed2_deceased:true`; `state_deceased` knots added to `npc_bed2_patient.ink` and `npc_chair_patient.ink`; Sharma debrief updated |
| ~~`ncsc_notified`~~ | ✅ Set in `npc_hartley.ink:ncsc_advisory` + major incident declaration branch |
| ~~`debrief_complete`~~ | ✅ Set in `npc_sharma.ink:closing` — confirmed at `#set_global:debrief_complete:true` |

---

## 6. AUDIO — **[P3]**

`hospital_ambient` is referenced as `ambientSound` on `ward_7`. Check `assets/audio/` for a suitable existing loop, or create one.

Suggested elements: rhythmic monitor beeping, soft footsteps on vinyl, occasional distant PA announcement. Low-volume, no music.

---

## 7. POSITION TUNING — **[P3]**

All object and NPC positions are first-pass estimates. The room tilemap (`room_hospital_ward`, 20×10 tiles) exists. Verify positions after first render:

- Ward 7: nursing station cluster y:2–3; Bed row 1 y:5 (x:2,4,6,8); Bed row 2 y:8 (x:2,4)
- Check NPC and adjacent object co-location (e.g. `bed4_patient` x:8,y:5 vs `bed4_monitor` x:9,y:5)
- IT office and major incident room: desks y:4–5; wall-mounted objects y:2

---

## SUMMARY — by priority

### P1 (blocking for first playable run)
- ✅ **MG-06 (VPN anomaly):** VPN Log Viewer minigame merged
- ✅ **MG-09 (drug library):** Drug Library Integrity Checker minigame merged

### P2 (needed for full learning objectives)
- ~~[ ] Build MG-08 infusion pump minigame~~ ✅ done
- ✅ Add `alertConfig` support to SIEM minigame; create `northgate_2025_11` alert set
- [ ] Commission NHS nurse and clinical engineer sprite sheets
- [ ] Implement NSM `requiresGlobal` engine param to gate SEVER behind dual-auth

### P3 (polish, post-draft)
- [ ] Commission patient sprites (bed4, bed2) and NCSC investigator sprite
- [ ] Commission proper sprite assets for minigame terminals (placeholders in place), including replacement of `vpn_log_terminal.png` and `drug_library_terminal.png`
- [ ] Source or create `hospital_ambient` audio loop
- ~~[ ] Wire `patient_bed2_deceased`~~ ✅ (~~`drug_library_restored`~~ still pending; ~~`ncsc_notified` ✅~~ ~~`backup_reinfected` ✅~~ ~~`debrief_complete` ✅~~)
- [ ] Verify pharmacist patrol does not run while NPC is hidden
- [ ] Tune all NPC and object positions after first room render

---

## PIXEL LAB GENERATION PROMPTS

### Character Sprites

**Sarah Mitchell — NHS Nurse (female)**
A clinical nurse in a top-down perspective wearing dark navy blue hospital scrubs with short sleeves. She has a hospital ID lanyard around her neck with a visible badge, and carries a clipboard tucked under one arm. She should have a professional, approachable expression and appear to be in her mid-40s with dark hair. Include idle, talking, and walking animation frames showing her standing upright in ward uniform.

**David Osei — Clinical Engineer (male)**
A clinical engineer in smart casual attire from a top-down view: dark trousers and a polo shirt or light shirt, with an NHS-branded lanyard worn at the neck. He appears younger (late 20s/early 30s) and should carry a confident, technical demeanor. Include multiple animation frames for idle, dialogue, and walking poses suitable for a technical staff member moving through a hospital environment.

**Dr. Naveen Sharma — NCSC Investigator (female)**
A professional investigator in a dark navy or charcoal suit jacket viewed from directly above. She wears a government lanyard (NCSC) with a credential badge and holds a tablet or folder in her hands. She should appear authoritative, composed, and in her late 40s. Include animation frames for standing, talking, and movement suitable for a cybersecurity incident investigation scenario.

### Terminal/Device Sprites

**VPN Log Terminal**
A desktop computer terminal interface designed for network security analysis. The sprite should show a monitor displaying security log data with a dark theme interface, visible status indicators (red/yellow/green lights for alert states), and a keyboard at the base. Include details suggesting it's specialized network monitoring equipment used in an IT security context, with the overall appearance befitting a hospital's IT security office.

**Drug Library Management Terminal**
A clinical pharmacy management system interface shown as a desktop computer. The monitor should display pharmaceutical database information with medical symbols, dosage data grids, and status indicators. The design should convey clinical/pharmaceutical software—include subtle medical branding elements, clear read-outs of drug information, and professional healthcare IT aesthetics without being overwhelming.

**Infusion Pump Device**
A tall medical infusion pump apparatus viewed from the side, approximately 1.5 meters high. Show the pump head at the top with a drip chamber, IV line routing, control interface panel in the middle with buttons and a small display screen, and a sturdy wheeled base at the bottom. Include subtle details like an alarm indicator light and medication bag connection point at the top.

**Backup Recovery Server Interface**
A rack-mount server system interface displayed as a desktop console or terminal. The visual should show a control panel with status lights (green for operational, amber for processing), cooling vents suggesting industrial server equipment, and a display screen showing database or system recovery progress. The design should suggest enterprise-grade backup infrastructure in a healthcare data center.

**Dual Authentication Panel**
A wall-mounted access control interface showing two distinct authentication zones side-by-side: one with a biometric reader pad, the other with a numeric PIN entry keypad. Include indicator lights (green for authorized, red for denied) above each input method and a small display showing authorization status. The design should convey security and dual-factor verification requirements.

---

## PIXEL LAB GENERATION PROMPTS (SIS02 — Energy)

### Character Sprites

**Priya Chandra — Process Engineer (female)**
A female engineer in a top-down perspective wearing navy blue industrial coveralls with safety hi-visibility fluorescent strips on the shoulders and torso. She wears a yellow safety hard hat and carries a tablet or clipboard for checking technical data. She appears to be in her mid-30s with a professional, focused demeanor suited to critical infrastructure inspection. Include idle, talking, and walking animation frames.

**Dr. Nalini Bashir — NCSC Investigator (female)**
A senior female cybersecurity professional viewed from directly above wearing a dark charcoal or navy professional jacket (business casual or blazer style). She wears an NCSC government lanyard with visible credentials and holds a clipboard or folder. She appears authoritative, composed, and in her late 40s. Include animation frames for standing, dialogue, and walking appropriate for an incident scene investigation.

### Room Tilemap Sprites

**SCADA Control Room (10×12 tiles)**
An industrial control room environment featuring multiple SCADA workstation desks arranged with dual monitors, control keyboards, and safety-related wall displays. Include a wall-mounted alarm panel (critical infrastructure), a smartscreen display showing live system status, two access doorways positioned for game flow, industrial flooring suggesting a secure operational center, and appropriate shadowing/depth to convey a functional, mission-critical atmosphere.

**Battery Hall (10×16 tiles)**
A large industrial battery storage facility with tall battery rack arrays (labeled A1–A4) visible as major wall elements running the length of the space. Include subtle amber LED indicators on the racks suggesting operational status, industrial ceiling with ventilation, a yellow emergency equipment housing (ESD button shelter), and a wall-mounted thermometer display. The overall aesthetic should be industrial and safety-conscious with distinct equipment placement areas.

**Engineering Workshop (10×10 tiles)**
A technical maintenance workshop with a vertical server rack in one corner showing visible cable management and amber operational LEDs, an engineering workstation desk with tools and displays, a corkboard with technical documentation, a cable management/junction panel (secured), and an entry doorway. The design should convey a working technical environment with appropriate depth and equipment positioning for a small industrial maintenance space.

### Interactive Device Sprites

**ESD Emergency Pushbutton (3-frame animation)**
An industrial emergency stop/activate device with a distinctive large red mushroom-head button centered in a yellow protective housing. Frame 1 shows the button in armed state with a clear guard positioned down over the mushroom head. Frame 2 shows the guard raised/lifted, exposing the red button. Frame 3 shows the button activated with a bright green LED illuminated above it indicating successful activation. All frames should convey industrial safety equipment.

**Alarm Panel Object Sprite (wall-mounted)**
A wall-mounted industrial alarm panel showing seven distinct status lamps arranged in a column or grid pattern, each lamp representing a different facility condition (physical safety, network status, system integrity, hydrogen levels, etc.). The panel should have a metallic or industrial finish, clear lamp positions, and appear as a critical safety monitoring device appropriate for display in a control room. Include indicator light colors that can change state (green/amber/red) during gameplay.

---

## PIXEL LAB GENERATION PROMPTS (SIS03 — Cyber Insurance)

### Document Sprites

**Coverage Decision Form**
A professional single-page insurance document in portrait orientation featuring the Meridian Insurance letterhead at the top with company logo and name, formal letter formatting with date and reference fields, and structured decision fields showing coverage determination sections (e.g., "Coverage Status:", "Claim Amount:", "Conditions"). The design should convey official business correspondence with professional typography, appropriate margins, and the visual weight of a formal insurance decision document.

**Warranty Compliance Checklist**
A professional checklist document displaying four clear tick-box rows, each representing compliance criteria (insurance claim review elements). Each row should have a checkbox on the left, a descriptive label, and space indicating completion status. The document should have subtle corporate branding from the insurance context, clean grid-based layout, and appear as a practical assessment checklist used in claim evaluation workflows.

### Character Sprite

**Eleanor Vance — Senior Insurance Professional (female)**
A professional female insurance investigator viewed from above wearing formal corporate business clothing: a tailored dark jacket over a light blouse or dress, styled for a Lime Street London insurance firm environment. She appears in her late 50s with a composed, authoritative demeanor. She carries a document folder or briefcase. Include animation frames for idle standing, dialogue, and walking suitable for an office-based corporate setting.

### Room Tilemap Sprites

**Meridian Claims Suite (Lime Street London office, 10×12 tiles)**
An upscale insurance office environment with a large glass-topped conference table as the primary focal point, professional wall-mounted display screens showing claim data, corporate office furniture (chairs, side tables), Lime Street/London corporate atmosphere suggested through refined design elements and professional color palette. Include two access points (meeting room entry and connection to other office spaces), subtle window details suggesting London streetside location, and appropriately lit office ambiance.

**Meridian Evidence Archive (secure storage, 10×12 tiles)**
A professional secure filing and records management facility with tall secure filing cabinets lining the walls, fluorescent overhead lighting, a small research/review workstation table, and a pinboard or wall display showing the Albion network architecture diagram for reference. The space should convey professional data security and archival storage standards, with appropriate depth and organization to appear as a dedicated evidence management area within the insurance firm.

---
