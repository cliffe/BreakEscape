# TODO — Case 2: Energy (Albion Battery Hall Crisis)
**scenario**: `scenarios/sis02_energy/scenario.json.erb`  
**Last updated**: April 2026

**Status:** Full design review remediation pass complete. Scenario validates clean with placeholder compatibility sprites now in place; production art remains tracked below. Story graph has 12 nodes / 13 edges. First playable run is unblocked.

---

## Recently Completed

| ID | Item | Notes |
|----|------|-------|
| MG-01 | **ESD Pushbutton Minigame** | Digital guard-flip + confirm modal implemented (PR #59). Uses `interactionType: esd_button` on the pc object. `esd_activated` set by minigame; `press_esd_button` task completed via Helen eventMapping. Early-activation handled via `early_esd_activation` global variable. |
| MG-06 | **Network Architecture Diagram** | SVG Purdue Model diagram with 6 levels, 25 nodes, 5 attack paths, marching-ant animation on active paths, Trent Water sidebar (PR #60). `type: network_architecture` on object in scada_control_room (was `lockType: network_architecture` — converted to item type). Triggered via `interactions.js` type check → `startNetworkArchitectureMinigame`. Sets `network_architecture_reviewed = true` on first open. |
| MG-04 | **Hydrogen Gas Alarm Progression** | Timed escalation implemented (PR #63). `h2_advisory` timer: T+22m from `anomaly_detected`, sets `hydrogen_alarm=true`, cancelled by `esd_activated`. `h2_evacuation` timer: T+40m, sets `facility_evacuated=true`. Helen radio messages for both steps. H₂ GAS lamp upgraded to 3-state: NORMAL → ADVISORY (amber) → EVACUATE (red flash). |
| ENG-02 | **Timed State Escalation Engine** | `startOnGlobal` and `cancelOnGlobal` fields added to `scenario-timer-dispatcher.js` (PR #63). Used by `h2_advisory` and `h2_evacuation` timers. |
| MG-05 | **NIS 72-Hour Notification Clock** | Implemented using the scenario timer system (same pattern as ICO deadline in sis01_healthcare). `timers` entry `id: nis_deadline`, `delayMs: 2700000` (45 min game-time ≈ 72h), `condition: !ncsc_notified`. Countdown shows in HUD widget. `timerRef: "nis_deadline"` on the `nis_notification_form` object links form to clock. `nis_deadline_missed: false` global variable added. Helen bark fires on deadline expiry. No dedicated in-room smartscreen object (MG-07) — the HUD countdown + form timerRef delivers the intended mechanic. |
| MG-02 | **SIS Configuration Threshold Display** | Interactive SIS threshold panel implemented (PR #61). `type: sis_config_panel` on object in engineering_workshop. Triggered via `interactions.js` id check → `startSisConfigThresholdMinigame`. Sets `sis_config_seen = true` on init. Compare mode unlocked when `sis_certification_seen = true`. Confirm Tamper button sets `sis_tamper_confirmed = true`. |
| MG-03 | **Facility Alarm Panel State Machine** | Live SVG lamp panel implemented (PR #62). `type: alarm_panel` on object in scada_control_room. Triggered via `interactions.js` type check → `startAlarmPanelMinigame`. 7 lamps driven by: `anomaly_detected`, `esd_activated`, `sis_tamper_confirmed`, `jump_server_isolated`, `network_isolated`, `hydrogen_alarm`, `facility_safe_state`. Flash animation on SIS STATUS and H₂ GAS lamps. |
| ENG-01 | **State-Reactive Alarm Panel Driver** | Implemented as part of PR #62. AlarmPanelMinigame subscribes to global variable changes and updates lamp states in real-time. |
| INK-01 | **All 4 Ink files written and compiled** | `npc_helen_marsh.ink` (670 lines), `npc_marcus_webb.ink` (424 lines), `npc_tom_hadley.ink` (286 lines), `npc_priya_sharma.ink` (389 lines). All compiled to `.json` with inklecate — zero errors. |
| INK-02 | **Ink wiring audit passed** | All `#set_global` tags reference valid globalVariables. All `#exit_conversation` tags on own lines. Influence tag preceded by variable assignment. All hub conditional choices use correct `+ { condition } [text]` format. |
| INK-04 | **NPC task completion tags added** | Added `#complete_task:talk_to_helen` to `npc_helen_marsh.ink`, `#complete_task:call_marcus_initial` to `npc_marcus_webb.ink`, `#complete_task:contact_castletech` to `npc_tom_hadley.ink`. All three fire at the top of `=== start ===` (every conversation, idempotent). All four `.ink` files recompiled — zero errors. Validator now reports zero ink wiring errors. |
| VM-01 | **SCADA Historian Trend Analyser** | `ScadaHistorianMinigame` implemented. `historian_trend_viewer` item (type `scada_historian`) inside `hmi_ops_01` PC. SVG time-series chart, 4-rack temperature display, pre-injection noise + flat-line at 28.0°C post-injection, time range selector (1h/3h/6h/12h/24h), dZ/dt overlay, Compare Racks view. `completionActions` set `historian_flatline_found = true` + complete `review_historian` task. Stale TODO/PLACEHOLDER comments removed from scenario header and task entry. |
| VM-02 | **Jump Server Access Log Analyser** | `LogFilterMinigame` implemented. `hmi_eng_02` item (type `log_filter_terminal`) direct room object in `engineering_workshop`. 40 session log entries, c.ellison anomaly (deprovisioned contractor, active session from Tor exit node), filter builder with awk preview, threat intel overlay, account history overlay, SIS Engineering Audit tab (`requireAllTabs` gate). `completionActions` set `jump_server_confirmed = true` + complete `identify_rdp_session` task. Type fixed from `minigame` → `log_filter_terminal` to match interactions.js dispatch. |
| INK-03 | **Display name / inline prefix alignment fixed** | `Marcus Webb (OT Security)`, `Tom Hadley (CastleTech SOC)`, `Dr Priya Sharma (NCSC/HSE)` display names had job title suffixes preventing `parseDialogueLine()` from matching inline prefixes. Shortened to `Marcus Webb`, `Tom Hadley`, `Dr Priya Sharma` in `scenario.json.erb`. |
| TEST-01 | **Scenario Validator** | Passed (VALIDATION_SUMMARY.md, 2026-04-03). Schema valid, ERB renders, all cross-references validated. |
| TEST-02 | **Ink Compilation** | All 4 `.ink` files compile cleanly. `.json` outputs present in `ink/`. |
| WK-01 | **Walkthrough QA — win condition and task trigger fixes** | Added `music` section with `debrief_complete` → `disableClose: true` + `credits` (win condition wire). Credits cover 5 sections: Physical Safety, Network Containment, SIS Investigation, Regulatory Compliance, Safety Case Review — with conditional text for all key outcome globals. Added ambient music events for game load, post-briefing, ESD activation. Re-wired `check_hmi_readings` task: removed from `priya_briefed` eventMapping; added separate eventMapping on `hmi_reviewed=true` so task completes only when player reads HMI-OPS-01 SCADA Live Status, not silently at briefing. Validator clean. |
| DR-01 | **Full Design Review — all recommendations implemented** | Soft lock fixed in `npc_marcus_webb.ink`: `#set_global:marcus_webb_contacted:true` moved to top of `first_call_hub` (before choice branches), removing the path where "Nothing specific yet" left `marcus_webb_contacted` permanently false. Helen `sendTimedMessage` added to `historian_flatline_found` and `jump_server_confirmed` eventMappings (aim transition narration). `timedMessages` added to Marcus Webb and Tom Hadley phone NPCs (escalation pressure). `unlockCondition` added to all 9 locked aims (story graph now 12 nodes / 13 edges; was 0 edges). `sis_config_panel` `puzzle_graph_unlocks` inaccuracy corrected. `player` field added to scenario. `hydrogen_detector` text updated to note 60-second sensor lag. All ink recompiled — zero errors. |
| ART-PLACEHOLDER-01 | **Compatibility placeholder sprites created** | Added placeholder sprite files by copying existing assets: `scada_historian.png`, `alarm_panel.png`, `network_architecture.png`, `log_filter_terminal.png`, `sis_config_panel.png`. This removes validator invalids while keeping production art requirements in ASSET-01..ASSET-07. |
| REM-2026-04-26 | **Review remediation updates applied** | Completed alignment pass: NIS competent-authority framing + NCSC coordination wording, hydrogen threshold consistency (1.0% advisory / 2.0% evacuation), 200 MWh baseline alignment, stale non-sprite TODO cleanup, ESD authorization wording clarified (no keypad), Plant Room → Battery Hall terminology update, Learning Impact credits added, and new cross-sector evidence artefact `trent_shared_server_access_extract` with `trent_lateral_ioc_viewed` global tracking. |

---

## Outstanding — Minigames (Required for Full Play Experience)

| ID | Item | Status | Priority | Notes |
|----|------|--------|----------|-------|
| MG-04 | **Hydrogen Gas Alarm Progression** | ✅ DONE (PR #63) | Medium | `h2_advisory` timer: T+22m from `anomaly_detected`, sets `hydrogen_alarm=true`, cancelled by `esd_activated`. `h2_evacuation` timer: T+40m, sets `facility_evacuated=true` if ESD not pressed. Helen radio messages for both escalation steps. Alarm panel H₂ GAS lamp upgraded to 3-state: NORMAL → ADVISORY (amber) → EVACUATE (red flash). Physical evacuation tone is a separate PHYS task (not implemented). |
| MG-05 | **NIS 72-Hour Notification Clock** | ✅ DONE (scenario timer + HUD) | Low | Implemented via `timers` array entry. HUD countdown widget shows time to deadline. `timerRef` on NIS form. `nis_deadline_missed` global fires Helen bark. No dedicated ENG-06-dependent room display needed. |
| MG-07 _(dev_tasks ref)_ | **NIS Clock In-Room Display** | Optional enhancement | Low | Dedicated `smartscreen` object in scada_control_room showing live countdown with green→amber→red CSS transitions. Requires ENG-06. Nice-to-have only — HUD widget + timerRef on form delivers the core mechanic. |

---

## Outstanding — Engine Features

| ID | Item | Status | Priority | Notes |
|----|------|--------|----------|-------|
| ENG-02 | **Timed State Escalation Engine** | ✅ DONE (PR #63) | Medium | `startOnGlobal` and `cancelOnGlobal` fields added to `scenario-timer-dispatcher.js`. Timer stays dormant until trigger variable fires; cancelled immediately on cancelOnGlobal variable. Used by `h2_advisory` and `h2_evacuation` timers. |
| ENG-03 | **Item Conditional Visibility** | Not built | Medium | Generic engine enhancement. Extend schema with `visibleWhen: { globalVar: value }`. Object hidden until condition met; reveal animation on condition true. No longer required for the badge flow in this scenario. |
| ENG-04 | **Container Solenoid Lock Release** | Not built | Medium | Extend container schema with `lockedUntilGlobal: { var: value }`. Physical: GPIO solenoid release. Digital: visual lock icon removed. Used for jump server Ethernet cable management panel (locked until `jump_server_confirmed = true`). |
| ENG-05 | **Compound Condition Trigger** | ✅ DONE | — | Implemented via paired eventMappings that handle both ordering paths (`network_isolated` then `esd_activated`, or `esd_activated` then `network_isolated`) before setting `facility_safe_state=true`. |
| ENG-06 | **Ambient Countdown Timer Display** | Not built | Low | Required by MG-05. Config: `duration_hours`, `startOnGlobal`, `completeOnGlobal`, `colourThresholds`. |
| ENG-07 | **NPC Fade-In Reveal Animation** | Not built | Low | When `initiallyHidden` NPC becomes visible, play 0.5s fade-in. Improves Priya S. reveal moment. |

---

## Outstanding — Objects and Physical Props

| ID | Item | Status | Priority | Notes |
|----|------|--------|----------|-------|
| OBJ-02 | **Battery Hall Badge Flow** | Implemented | — | Badge is now delivered by Helen via dialogue (`itemsHeld` + `#give_item:keycard`), replacing the old always-visible room-object approach. |
| OBJ-06 | **SIS Certification Document** (already in filing cabinet) | Implemented | — | Content sourced from information pack. `sis_tamper_confirmed = true` on read. Verify content accuracy against `requirements/claims.md` for EN-001, EN-002, EN-007, EN-008. |

---

## Outstanding — Sprites and Art Assets

All sprite assets below are production-quality art requirements. The scenario runs with placeholder sprites; these are needed for the polished release version.

| ID | Item | Status | Notes |
|----|------|--------|-------|
| ASSET-01 | **Helen Marsh — engineer_female sprite** | Placeholder (`male_nerd`) | Navy coverall, hi-vis strips, hard hat, tablet. Idle/talk/walk animations. Headshot portrait. |
| ASSET-02 | **Dr Priya Sharma — inspector_female sprite** | Placeholder (`male_nerd`) | Dark jacket, NCSC/HSE lanyard, clipboard. Idle/talk/walk animations. Headshot portrait. |
| ASSET-03 | **SCADA Control Room tilemap** | Placeholder (`room_office`) | SCADA workstation desks, alarm panel position, smartscreen position, two door positions. 10×12 tiles. |
| ASSET-04 | **Battery Hall tilemap** | Placeholder (`room_servers`) | Battery rack arrays A1–A4 as wall elements, amber LEDs, industrial ceiling. ESD housing and thermometer wall mount positions. 10×16 tiles. |
| ASSET-05 | **Engineering Workshop tilemap** | Placeholder (`room_it`) | Server rack with amber LED, engineering workstation, corkboard, cable management panel, entry door. 10×10 tiles. |
| ASSET-06 | **ESD Pushbutton sprite** | Placeholder (`pc` sprite) | Three-frame animation: armed (guard down) / guard_open (guard raised) / activated (LED green). Yellow housing, large red mushroom-head. Physical prop maker needs sprite reference before fabrication. |
| ASSET-07 | **Alarm Panel object sprite** | SVG done (PR #62); room sprite pending | The digital SVG alarm panel renders in-minigame via `AlarmPanelMinigame`. A dedicated room-level sprite for the panel object (wall-mounted panel appearance) still uses the `smartscreen` placeholder. |

---
---

## Outstanding — Testing

| ID | Item | Depends On | Status | Notes |
|----|------|-----------|--------|-------|
| ~~TEST-01~~ | ~~Scenario Validator~~ | — | ✅ Done | Passed 2026-04-03. |
| ~~TEST-02~~ | ~~Ink Compilation~~ | TEST-01 | ✅ Done | All 4 files compile clean. |
| TEST-03 | **Full Play-Through — Mandatory Path** | VM-01, VM-02 | Not run | Use TESTING_WALKTHROUGH.md. Verify all global variable transitions and task completions on happy path. Both VMs now implemented — no workarounds needed. |
| TEST-04 | **Ink Dialogue Branch Coverage** | TEST-03 | Not run | All major state-dependent branches. Verify Priya S. `patch_decision` records both `active_management` and `deferral`. Verify Helen's `sis_compromise_discussion` sub-topics each set `en002_claim_assessed`. |
| TEST-05 | **Physical Prop Integration** | OBJ-01, MG-03 | Blocked | Full escape room only. GPIO relay, alarm panel lamps, RFID readers, cable contact sensor. |
| TEST-06 | **Optional Objective — Trent Water Path** | TEST-03 | Not run | Aim 9: Tom Hadley Trent Water thread → `trent_water_notified = true` → task complete → Priya S. Trent Water topic available. |
| TEST-07 | **Timed Escalation Regression** | ENG-02, MG-04 | Not run | H₂ escalation timer accuracy. Edge: ESD at exactly T+22m; anomaly then immediate ESD; resume mid-escalation. |
| TEST-08 | **NIS Deadline Edge Case** | TEST-03 | Not run | Let timer expire without reading the NIS form. Verify `nis_deadline_missed = true`, Helen bark fires. Then read form — verify `ncsc_notified` still sets despite missed deadline. |
| TEST-09 | **Early ESD Path** | TEST-03 | Not run | Press ESD before `historian_flatline_found = true`. Verify `early_esd_activation = true`, Helen radio message fires, scenario does not block ESD activation. |
| TEST-MG-06 | **Network Architecture Diagram — Content Accuracy** | — | Not run | Compare rendered nodes/connections against information_pack for EN-001, EN-002, EN-011 attack paths. |
| TEST-OBJ-06 | **SIS Certification Document — Content Verification** | — | Not run | Verify certified setpoints (55°C, 1.0% LEL, 4.25V/cell) match requirements/claims.md. |

---

## Content Accuracy Checks (Information Pack)

The following scenario content should be cross-checked against the information pack for accuracy before final release:

- `network_architecture_diagram` — verify 25 nodes and 5 attack paths match `information_pack/system_architecture/network_architecture.md`
- SIS Certification Document in filing cabinet — verify certified setpoints match `information_pack/requirements/claims.md` (EN-001, EN-002, EN-007, EN-008)
- `sis_config_panel` text — verify tampered values (85°C threshold, 2.0% LEL, 4.32V/cell, firmware 2.4.1) are consistent with the assurance cases

---

## Known Design Gaps

| Gap | Description | Impact |
|-----|-------------|--------|
| ~~Battery Hall badge always visible~~ | **Fixed** — badge moved to Helen's `itemsHeld`; transferred via `#give_item:keycard` in `npc_helen_marsh.ink:walkdown_offer`. Players receive it when Helen offers the walkdown. ENG-03 no longer required for this gap. | Resolved |
| Jump server cable always accessible | Cable should be revealed only after `jump_server_confirmed = true` (the RFID-gated panel opens). Currently always accessible, allowing players to pull the cable before identifying the attacker session. Requires ENG-04. | Low — pulling cable early just sets `jump_server_isolated` prematurely; Marcus's response message still fires correctly. |
| `workshop_key_collected` flag | Set on `onPickup` of the Engineering Workshop RFID keycard, but never read by any task, eventMapping, or condition. Tasks use `collect_items` → `workshop_key_group`. Intentionally retained for session telemetry. | None — informational only. |
| MG-06 placement | Network Architecture Diagram in `scada_control_room`. Originally considered for Engineering Workshop. Current placement gives players context earlier. No change needed unless playtesting shows confusion. | None currently. |

### Resolved gaps

| Gap | Resolution |
|-----|------------|
| `facility_safe_state` approximation | **Fixed** — replaced single `network_isolated` eventMapping with two compound-condition mappings: one fires when `network_isolated` and `esd_activated` is already true; the other fires when `esd_activated` and `network_isolated` is already true. Priya S. now only appears after both conditions are met. ENG-05 no longer required. |
| `historian_reviewed` dead variable | **Fixed** — removed from `globalVariables`. Was declared but never set; `hmi_reviewed` (set by `onRead` on SCADA Live Status) is the active variable for this purpose. |
| `hmi_reviewed` flag (informational only) | **Fixed** — `hmi_reviewed=true` now wires `completeTask: check_hmi_readings` via Helen eventMapping. No longer informational. |

---

## PIXEL LAB GENERATION PROMPTS

### Character Sprites

**Helen Marsh — Process Engineer (female)**
A female engineer in a top-down perspective wearing navy blue industrial coveralls with safety hi-visibility fluorescent strips on the shoulders and torso. She wears a yellow safety hard hat and carries a tablet or clipboard for checking technical data. She appears to be in her mid-30s with a professional, focused demeanor suited to critical infrastructure inspection. Include idle, talking, and walking animation frames showing her in full safety equipment appropriate for an industrial energy facility.

**Dr Priya Sharma — NCSC Investigator (female)**
A senior female cybersecurity professional viewed from directly above wearing a dark charcoal or navy professional jacket (business casual or blazer style). She wears an NCSC government lanyard with visible credentials and holds a clipboard or folder. She appears authoritative, composed, and in her late 40s with a serious, investigative bearing. Include animation frames for standing, dialogue, and walking appropriate for an incident scene investigation.

### Room Tilemap Sprites

**SCADA Control Room (10×12 tiles)**
An industrial control room environment featuring multiple SCADA workstation desks arranged with dual monitors, control keyboards, and safety-related wall displays showing system status. Include a wall-mounted alarm panel (critical infrastructure), a smartscreen display showing live system status and monitoring data, two access doorways positioned for game flow, industrial flooring suggesting a secure operational center, appropriate depth cues, and lighting conveying a functional, mission-critical 24/7 operations space.

**Battery Hall (10×16 tiles)**
A large industrial battery storage facility with tall battery rack arrays (labeled A1–A4) visible as major wall elements running the length of the space. Include subtle amber LED indicators on the racks suggesting operational status, industrial ceiling with ventilation ducts, a yellow emergency equipment housing (ESD button shelter positioned prominently), and a wall-mounted thermometer/sensor display. The overall aesthetic should be industrial, safety-conscious, and clearly compartmentalized for different equipment zones.

**Engineering Workshop (10×10 tiles)**
A technical maintenance workshop with a vertical server rack in one corner showing visible cable management and amber operational LEDs, an engineering workstation desk with tools and technical displays, a corkboard with technical documentation and schematics, a cable management/junction panel (secured/locked), and an entry doorway. The design should convey a working technical environment with appropriate depth, equipment positioning, and industrial finishing suitable for a small facility maintenance area.

### Interactive Device Sprites

**ESD Emergency Pushbutton (3-frame animation)**
An industrial emergency stop/activate device with a distinctive large red mushroom-head button centered in a bright yellow protective housing. Frame 1 shows the button in armed state with a clear protective guard positioned down over the mushroom head. Frame 2 shows the guard raised or lifted, exposing the red button ready for activation. Frame 3 shows the button fully activated with a bright green LED illuminated above or on the panel indicating successful activation. All frames should convey industrial safety equipment and clear state changes.

**Alarm Panel Object Sprite (wall-mounted)**
A wall-mounted industrial alarm panel showing seven distinct status lamp positions arranged in a column or grid pattern, each representing a different facility condition (physical safety, network status, system integrity, hydrogen levels, ESD activation, facility safe state, and network isolation). The panel should have a metallic or industrial enclosure finish, clear lamp positions, and appear as a critical safety monitoring device appropriate for display in a control room. Design should allow lamp indicators to change between green (normal), amber (warning), and red (critical) states during gameplay.

---

## Quick Reference: Global Variable Progression

```
INITIAL STATE (all false / empty)

  briefing_played=true         (Helen timedConversation auto-fires on load)
  helen_briefed=true           (Helen arrival_briefing knot — unlocks Aim 2)
  hmi_reviewed=true            (read SCADA Live Status on HMI-OPS-01 — completes check_hmi_readings)
  incident_folder_read=true    (read Incident Response Folder — Aim 1)
  battery_hall_badge_collected=true (pick up badge — informational only)
  anomaly_detected=true        (read analog thermometer — Aim 2 → completes check_thermometer, unlocks Aim 3)
  historian_flatline_found=true (VM-01 flag — Aim 3 → unlocks Aim 4, fires Tom timed message)
  workshop_key_collected=true  (pick up workshop RFID key — informational only)
  marcus_webb_contacted=true   (call Marcus Webb — Aim 4 → unlocks Aims 5 & 6, fires ESD authorization message)
  en001_claim_assessed=true    (Marcus CLAIM-EN-001 dialogue)
  jump_server_confirmed=true   (VM-02 flag — Aim 4 → unlocks Aim 7)
  esd_activated=true           (MG-01 ESD minigame — Aim 5 → completes press_esd_button, fires Helen radio)
  jump_server_isolated=true    (read jump_server_cable — Aim 6 → completes pull_ethernet_cable)
  castletech_contacted=true    (call Tom Hadley and confirm isolation — Aim 6)
    → network_isolated=true    (Tom Hadley eventMapping on castletech_contacted)
    → facility_safe_state=true (Helen eventMapping: fires when BOTH esd_activated AND network_isolated are true
                                 — two mappings cover both orderings; unlocks Aims 8 & 10)
    → priya_sharma_visible=true   (Helen eventMapping on facility_safe_state → Priya S. appears + debrief_intro fires)
  sis_config_seen=true         (open sis_config_panel MG-03 minigame — Aim 7, step 1 → completes read_sis_config)
  sis_certification_seen=true  (read SIS Certification Document in filing cabinet — Aim 7, step 2 →
                                 completes find_certification_doc; unlocks Compare mode on sis_config_panel)
  sis_tamper_confirmed=true    (click Confirm Tamper on sis_config_panel — Aim 7, step 3 →
                                 sets en002_claim_assessed=true via eventMapping)
  ncsc_notified=true           (read NIS Notification Form — Aim 8 → completes complete_nis_form)
  en005_claim_assessed=true    (Priya S. patch_dilemma topic)
  debrief_complete=true        (Priya S. closing_summary knot — Aim 10 → completes talk_to_priya_sharma)
    → patch_decision = "active_management" | "deferral"

Optional:
  trent_water_notified=true    (Tom Hadley Trent Water → completes call_trent_water — Aim 9)
  trent_lateral_ioc_viewed=true (read shared file server IOC artefact in engineering_workshop)
  network_architecture_reviewed=true  (open MG-06 Network Architecture Diagram)

Edge case:
  early_esd_activation=true    (ESD pressed before historian_flatline_found — fires Helen warning)
  nis_deadline_missed=true     (45-min NIS timer expires before ncsc_notified — fires Helen bark)
```
