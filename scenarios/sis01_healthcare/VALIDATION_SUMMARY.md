# Healthcare Scenario Validation Summary

**Status**: ✅ PASSING (Validated 2026-04-03)

## Schema Updates Required
- Updated `/scripts/scenario-schema.json` to include new lockTypes:
  - `ransomware_display` — infected workstation overlay (MG-05)
  - `siem_dashboard` — SIEM alert triage minigame (MG-01)

## Fixes Applied to Scenario

### 1. Event Mapping Configuration
- **Fixed**: Added missing `conversationMode` and `background` to event mappings
  - patrol_nurse: `bed4_escalated` event mapping now has `conversationMode: "person-chat"` + background
  - patrol_nurse: `drug_library_compromised` event mapping now has full cutscene config
  - chair_patient_witness: `pump_dose_error` event mapping now has full cutscene config

### 2. Opening Cutscene Timing
- **Fixed**: Changed `timedConversation.delay` from 1200ms to 0ms for immediate opening briefing
  - Sarah Mitchell's arrival_briefing now plays immediately (recommended pattern)

### 3. Missing Assets
- **Fixed**: Created placeholder `siem_dashboard.png` sprite (copied from pc.png)
  - This is a temporary asset pending custom dashboard design
  - Note: The minigame MG-01 renders its own UI overlay; the sprite is fallback display

### 4. Object Type Changes
- **Changed**: Ward Alarm Panel from `type: "alarm_panel"` to `type: "smartscreen"`
  - `alarm_panel` sprite did not exist; smartscreen is a valid fallback
  - Note: Custom `alarm_panel.png` sprite still needed for final deployment (OBJ-08)

## Remaining TODOs (Documented in Scenario)

### Sprites Needed
- `room_ward`: Custom 10×14 tile hospital ward room (OBJ-01)
- `nurse`: NHS nurse character sprite (female + male variants)
- `clinical_engineer`: Professional clinical engineer sprite
- `alarm_panel`: Wall-mounted indicator lamp panel (OBJ-08)
- `siem_dashboard`: Custom SIEM dashboard overlay (MG-01) — minigame UI preferred over sprite

### Ink Story Files Required (7 files)
- `ink/npc_sarah.ink` — Charge Nurse Sarah Mitchell
- `ink/npc_ravi.ink` — IT Security Manager Ravi Anand
- `ink/npc_david.ink` — Clinical Engineer David Osei
- `ink/npc_helen.ink` — NHS CIO Helen Carver
- `ink/npc_hartley.ink` — Caldicott Guardian Dr Fiona Hartley
- `ink/npc_sharma.ink` — NCSC Investigator Dr Priya Sharma
- `ink/npc_patrol_nurse.ink` — Patrol Nurse (context-sensitive lines)

### Hacktivity VMs Required (2 VMs)
- `northgate_vpn_logs` — VPN credential anomaly analysis (MG-06)
- `northgate_pump_mgmt` — Drug library integrity verification (MG-09)

### Minigames Needed (6 custom minigames)
- MG-01: SIEM Alert Dashboard
- MG-04: Network Segmentation Map (interactive SVG)
- MG-07: Backup Recovery Console
- MG-08: Infusion Pump Terminal
- MG-11: Dual Authorisation Panel
- MG-12: Major Incident Command Board

All placeholders use functional stubs (readable text, PIN locks) that allow scenario progression.

## Validation Report Details

### Passed Validation
- ✅ Schema validation (JSON schema conformance)
- ✅ ERB rendering (all template helpers resolved)
- ✅ Cross-references (NPCs, rooms, objects, global variables)
- ✅ Lock type definitions
- ✅ Objective structure and task linking

### Good Practices Detected
- ✅ Event-driven cutscene architecture (12 person-chat events)
- ✅ Opening briefing with skip-on-resume (timedConversation.skipIfGlobal)
- ✅ Collection-tracked inventory (MAR charts with targetGroup/collection_group)
- ✅ Dynamic music system (6 music events triggered by game events)
- ✅ Dungeon graph metadata ready for visualization

### Recommendations (Non-Blocking)
1. Add `player` configuration for hero sprite setup
2. Add `showProgress: true` to collect_items tasks for visual progress tracking
3. Consider adding door locks to VM launcher rooms (physical access barrier)
4. Consider adding hostile NPCs for tension (optional for healthcare context)

## Dungeon Graph Analysis

Generated at: `/scenarios/sis01_sis_healthcare/dungeon_graph.html`

**Critical Path** (4 hops):
1. Assess Ward 7 (3 tasks)
2. Investigate the Attack (3 tasks)
3. Authorise Network Isolation (2 tasks)
4. Restore Safe Clinical Operations (4 tasks)
5. NCSC Debrief (1 task)

**Graph Nodes**: 14 (9 puzzle, 5 story)
**Graph Edges**: 13

---

**Status**: Scenario is **runnable** with functional stubs in place for all minigames.
**Next Phase**: Complete Ink story files and commission sprite assets.
