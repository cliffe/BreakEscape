# Scenario Implementation Notes — Northgate Hospital

This document summarises the implementation status of `scenario.json.erb` and lists what needs to be built before the scenario can run.

---

## Deployment

Copy the scenario directory to the BreakEscape project:

```
CyBOK_Phase_7_SIS/game_design/healthcare_draft/scenario.json.erb
  → BreakEscape/scenarios/northgate_hospital/scenario.json.erb
```

Create a companion `mission.json` in that directory (display name, CyBOK topic tags, difficulty, etc.).

---

## Already Implemented in BreakEscape

| Feature | How it is used in this scenario |
|---|---|
| `siem_dashboard` object type | SIEM Console in IT Security Office (MG-01) |
| `ransomware_display` lockType | Ward monitoring station + infected workstations (MG-05) |
| `vm-launcher-desktop` object | VPN log terminal + drug library terminal |
| `flag-station` object | VPN flag station + drug library flag station |
| `pin` lockType | Dual-auth panel placeholder, backup console placeholder |
| NPC patrol behaviour | Patrol nurse waypoint loop |
| NPC eventMappings | All six NPCs react to global state changes |
| `timedConversation` | Opening briefing cutscene with Sarah Mitchell |
| `collect_items` objective task | MAR charts collection |
| `submit_flags` objective task | VPN anomaly + drug library verification |

---

## Placeholder Stubs (functional but reduced)

These items are in the scenario now using simpler mechanics. Each needs a custom minigame to replace the placeholder.

| Object | Current placeholder | Target minigame | Notes |
|---|---|---|---|
| `dual_auth_panel` | `lockType: pin` (David's code only) | MG-11 dual_auth | Both itsec_pin and clinical_pin should be required on separate keypads |
| `backup_console` | `lockType: pin` (random PIN) | MG-07 backup_recovery | Three tile selection with consequence panel; cloud restore → 18hr timer |
| `bed2_pump_terminal` | `lockType: pin` (random PIN) | MG-08 infusion_pump | Decimal-point ambiguity; double-check modal; drug library state affects guardrail |
| `network_map_screen` | Readable `smartscreen` | MG-04 network segmentation map | Interactive SVG zone diagram with toggleable legacy exception rules |
| `command_board` | Readable `smartscreen` | MG-12 major incident command board | Auto-appending timeline driven by global variables |

For the draft session, players can be told the placeholder PINs verbally by the facilitator, or they can be embedded in NPC dialogue (Ravi gives the backup PIN, David gives his auth code after the safety case assessment).

---

## Content Needed Before Running

### VM Challenges (Hacktivity)

**VM: `northgate_vpn_logs`** (MG-06)
- `/var/log/vpn/auth.log` — 50 VPN auth entries; anomalous entry at ~line 31 (`m.blake`, Romania, no MFA)
- `/home/analyst/contractor_accounts.txt` — contractor account list; m.blake flagged
- `/home/analyst/check_anomaly.sh` — accepts IP arg; emits `vpn_flag_1` on correct submission

**VM: `northgate_pump_mgmt`** (MG-09)
- `/opt/pump-management/drug_library.csv` — 23 entries; morphine DOSE_MAX tampered from 4 to 40
- `/opt/pump-management/drug_library.sha256` — reference hash of untampered library
- `/opt/pump-management/drug_library.bak` — untampered backup
- `/home/analyst/verify_library.sh` — accepts drug name + correct dose; emits `drug_flag_1`

### Ink Story Files

All Ink files go in `scenarios/northgate_hospital/ink/`. Compile to `.json` before use.

| File | NPC | Key knots | Priority |
|---|---|---|---|
| `npc_sarah.ink` | Charge Nurse Sarah Mitchell | `arrival_briefing`, `start`, `bed4_concern`, `escalate_bed4`, `post_isolation`, `post_drug_tamper` | High |
| `npc_patrol_nurse.ink` | Patrol Nurse | `patrol_idle`, `rushing_bed4`, `post_drug` | High |
| `npc_ravi.ink` | Ravi Anand | `start`, `siem_briefing`, `vpn_briefing`, `give_itsec_code`, `post_isolation` | High |
| `npc_david.ink` | David Osei | `start`, `safety_case_hc001`, `give_clinical_code`, `safety_case_hc003`, `post_isolation` | High |
| `npc_helen.ink` | Helen Carver | `start`, `backup_advisory`, `safety_case_hc007`, `ico_advisory`, `post_isolation`, `post_backup` | High |
| `npc_hartley.ink` | Dr Fiona Hartley | `start`, `patient_data`, `disclosure_law`, `post_ico`, `deadline_missed` | Medium |
| `npc_sharma.ink` | Dr Priya Sharma | `start`, `patient_outcomes`, `safety_claims`, `regulatory`, `root_cause`, `closing` | High |

Global variable reads and writes for each NPC are documented in the `TODO[INK]` ERB comments in `scenario.json.erb`.

---

## Sprites Needed

All sprite comments in the ERB use `TODO[SPRITE]` tags.

| What | Current stand-in | What to commission |
|---|---|---|
| NHS nurse (2 variants) | `female_scientist` / `female_security_guard` | Dark blue scrubs, lanyard/badge, clipboard. Two versions: charge nurse (coloured stripe on badge) and staff nurse. |
| Clinical engineer | `male_hacker_hood_down` | Smart casual (chinos/shirt), NHS lanyard, tablet or clipboard. Not scrubs. |
| NCSC investigator | `female_spy` | Dark suit, NCSC lanyard, neutral professional expression. |
| Ward room type | `room_office` | Open Nightingale bay: 6 beds with curtain rails, nursing station alcove at south end, wall-mounted monitor screen. Suggested 10×14 tiles (2×3 GU). |

---

## Sounds Needed

| Key | Description |
|---|---|
| `hospital_ambient` | Quiet rhythmic beeping, soft footsteps on vinyl floor, occasional muffled PA announcement. No music. Low volume. |

---

## Known Limitations / Engine Issues

### Patrol nurse interrupt-to-waypoint
When `bed4_escalated = true`, the patrol nurse should abandon her current patrol and walk directly to Bed 4. The BreakEscape patrol system supports waypoint loops but not conditional rerouting mid-loop. Options:
- Engine support: add a `forceWaypoint` event action that overrides the current patrol destination
- Workaround: define a second patrol NPC variant with a single-point waypoint `[{x:8, y:5}]` that starts `initiallyHidden: true` and is revealed when `bed4_escalated` fires, while the original patrol NPC is hidden

### Dr Sharma hidden-then-revealed
`behavior.initiallyHidden: true` hides the NPC on load, but there is no matching "show NPC" event action. Options:
- Set `initiallyHidden: false` and use `skipIfGlobal: "debrief_started"` on a timedConversation that starts immediately — when `debrief_started` is false on load, the conversation plays and Sharma is visible but stands quietly until addressed
- Use a phone NPC for early "I'm on my way" message and only place the person NPC in a locked room that opens when `restore_operations` aim completes

### SIEM alert configuration
The `siem_dashboard` minigame needs to support a custom `alertConfig` value (`northgate_2025_11`) that seeds the healthcare-specific alert mix. This requires either:
- A JSON alert config file at a known path the minigame reads by name
- Or the alert array inlined in `scenarioData` once the minigame supports it

---

## Scenario Validator

Once the file is in the BreakEscape project, validate with:

```bash
ruby scripts/validate_scenario.rb scenarios/northgate_hospital/scenario.json.erb --verbose
```

Expected warnings on first run:
- Missing Ink story files (all 7 NPCs)
- VM fallback hashes used (until Hacktivity VMs are created)
- `dual_auth` and `backup_recovery` lockTypes not yet registered (placeholder `pin` is used)
