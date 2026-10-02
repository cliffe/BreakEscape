# INK Story Development — Northgate Hospital Healthcare Scenario

## Summary

Successfully developed and deployed complete narrative layer for the `scenarios/sis01_healthcare` (Northgate General Hospital: Code Black) scenario. All 9 NPCs now have fully-implemented INK dialogue trees with context-aware branching, global variable integration, and task completion hooks.

**Status: ✅ Complete and Compiled**

---

## Development Completion

### NPCs Implemented

| NPC | File | Type | Status | Lines | Knots | Key Features |
|---|---|---|---|---|---|---|
| Sarah Mitchell | `npc_sarah.ink` | Charge Nurse | ✅ Finalized | 215 | 8 | Bed 4 escalation gating; post-isolation reactions; drug tamper discovery notification |
| Patrol Nurse | `npc_patrol_nurse.ink` | Staff Nurse | ✅ Finalized | 101 | 5 | Background colour; Bed 4 concern reinforcement; drug safety awareness |
| Ravi Anand | `npc_ravi.ink` | IT Security | ✅ Finalized | 196 | 7 | SIEM triage briefing; VPN anomaly investigation; IT security PIN issuance |
| David Osei | `npc_david.ink` | Clinical Safety Engineer | ✅ Finalized | 215 | 8 | CLAIM-HC-001 & HC-003 assessment; dual-auth clinical PIN; drug library verification |
| Helen Carver | `npc_helen.ink` | Information Governance | ✅ Finalized | 223 | 8 | ICO 72-hour notification advisory; backup recovery guidance; CLAIM-HC-007 explanation |
| Dr Fiona Hartley | `npc_hartley.ink` | Clinical Director | ✅ Finalized | 225 | 9 | Patient data accountability; legal disclosure obligations; Major Incident declaration |
| Dr Priya Sharma | `npc_sharma.ink` | NCSC Investigator | ✅ Finalized | 293 | 10 | Post-incident debrief; safety case review; root cause synthesis; closing learning |
| **On-Call Pharmacist** | `npc_pharmacist.ink` | **NEW** ✅ Created | 218 | 7 | Drug library verification protocols; pump suspension decision-making; manual dosing oversight; resumption verification |
| **Mrs Kowalski** | `npc_chair_patient.ink` | **NEW** ✅ Created | 223 | 8 | Patient advocacy perspective; pump safety concern escalation; observational monitoring insights; human continuity |

**Total:** 1,909 lines of INK narrative across 9 NPCs

---

## New Contributions: Pharmacist & Patient Stories

### 1. On-Call Pharmacist (`npc_pharmacist.ink`)

**Purpose:** Embody clinical safety decision-making under pressure; verify drug library integrity; guide nurses through pump safety protocols.

**Key Knots:**
- `start` — Arrival on ward; assessment of tamper severity
- `arrival_assessment` — Triage response; determine threat level
- `library_verification` — Present morphine DOSE_MAX tampering (4mg → 40mg)
- `pump_suspension` — Clinical decision: suspend all pump medication; justify manual dosing
- `pump_safety_protocols` — Three-point safety checklist for resumption
- `post_drug_restored` — Verify restoration; resume with spot-check protocol
- `hub` — Repeatable conversation anchors

**Global Variables Read:**
- `drug_library_compromised` — Triggers detailed concern dialogue
- `drug_library_restored` — Enables resumption pathway
- `clinical_staff_notified` — Marks successful escalation

**Narrative Arc:**
The pharmacist transforms from a peripheral "call the pharmacy" instruction into a character who embodies the tension between safety and speed. When players discover the drug library was tampered with, the pharmacist provides the clinical voice that explains why manual dosing is actually safer than automated administration from a corrupted library. This mirrors real-world pharmacy responses to IT incidents and teaches players that "slower" can mean "safer."

**Influence Points:**
- Respects players who take drug safety seriously
- Appreciates when isolation decision happens before pump medication resumes
- Critical of shortcuts that bypass verification

---

### 2. Mrs Kowalski — Chair Patient (`npc_chair_patient.ink`)

**Purpose:** Provide non-clinical perspective on patient safety implications; escalate bedside observations; humanise the incident's consequences.

**Key Knots:**
- `start` — Opening recognition; patient acknowledgement of staff effort
- `first_words` — Normalising conversation; appreciation for nursing staff
- `pump_concern` — Alert about new infusion rate; encourage player attention to detail
- `monitoring_discussed` — Post-op cardiac patient perspective on lost continuous monitoring
- `drug_safety_concern` — Patient anxiety about manual dosing; education about verification
- `patient_advocacy` — Reflects on good nursing practice; affirms importance of escalation
- `hub` — Repeatable anchors

**Global Variables Read:**
- `bed4_escalated` — Contextualises ward-wide safety culture
- `drug_library_compromised` — Triggers patient anxiety pathway
- `drug_library_restored` — Reduces patient concern; validates clinical action

**Narrative Arc:**
Mrs Kowalski sits in a chair beside Bed 2, watching the ward and her own infusion pump. She is not a protagonist or a problem-solver — she is a witness. Her value is observational: she notices when the pump beeps differently, when the nursing station staff seem stressed, when medication administration procedures change. She validates that patients *know* when something is wrong, even without technical expertise. Her dialogue teaches players to listen to patient feedback, to involve patient perspective in safety decisions, and to recognise that incident response can inadvertently deprioritise individual patient experience.

**Influence Points:**
- Appreciates players who check on pump concerns immediately
- Grateful for staff who communicate what's happening
- Notices and validates good nursing practice (Sarah)
- Willing to tolerate inconvenience if explained and justified

---

## Compilation & Deployment

### INK to JSON Compilation

All 9 `.ink` source files successfully compiled using **inklecate** (`bin/inklecate -o output.json source.ink`):

```bash
✓ npc_sarah.ink              → npc_sarah.json (7.5KB)
✓ npc_patrol_nurse.ink       → npc_patrol_nurse.json (3.3KB)
✓ npc_ravi.ink               → npc_ravi.json (7.6KB)
✓ npc_david.ink              → npc_david.json (9.6KB)
✓ npc_helen.ink              → npc_helen.json (9.1KB)
✓ npc_hartley.ink            → npc_hartley.json (8.9KB)
✓ npc_sharma.ink             → npc_sharma.json (13KB)
✓ npc_pharmacist.ink         → npc_pharmacist.json (9.1KB) [NEW]
✓ npc_chair_patient.ink      → npc_chair_patient.json (9.1KB) [NEW]
```

**Compilation Issues Resolved:**
1. ❌ `npc_chair_patient.ink` line 122: Syntax error (double closing bracket `]]` → `]`)
2. ❌ `npc_chair_patient.ink` line 18: Variable name conflict (`monitoring_discussed` used for both VAR and knot → renamed VAR to `monitoring_addressed`)
3. ✅ All files now compile cleanly with zero errors

### Scenario.json.erb Updates

Updated story path references for new NPCs to use pre-compiled `.json` files:
- Line 505: `"storyPath": "scenarios/sis01_healthcare/ink/npc_chair_patient.json"` [was `.ink`]
- Line 537: `"storyPath": "scenarios/sis01_healthcare/ink/npc_pharmacist.json"` [was `.ink`]

---

## Validation Results

✅ **Scenario validation passed** (`ruby scripts/validate_scenario.rb`)

```
Validating scenario: scenarios/sis01_healthcare/scenario.json.erb
✓ ERB rendered successfully
✓ JSON structure is valid
✓ All ink files valid
✓ Schema validation passed!
```

**Findings:**
- All 9 INK files now present and valid
- No missing story paths
- Dungeon graph generated successfully (14 nodes, 13 edges)
- Critical path identified: Assess Ward 7 → Investigate → Authorise Isolation → Restore → Debrief

---

## Global Variable Integration

### Pharmacist NPC

**Reads from:**
- `drug_library_compromised` (set by VM challenge)
- `drug_library_restored` (set by verification task)
- `network_isolated` (gate for library verification urgency)
- `clinical_staff_notified` (output tracking)

**Writes to:**
- (None — pharmacist is observational/advisory)

**Complete_task Tags:**
- ✅ No task completion tags (pharmacist is informational; tasks are driven by players/VM challenges)

### Chair Patient NPC

**Reads from:**
- `bed4_escalated` (contextualises ward safety culture)
- `drug_library_compromised` (triggers patient anxiety)
- `drug_library_restored` (calms patient; validates action)
- `pump_dose_error` (potential near-miss escalation)

**Writes to:**
- (None — patient is perspective/witness)

**Complete_task Tags:**
- `#complete_task:check_bedside_pump` (if player agrees to check pump immediately)

---

## Design Principles Applied

### 1. **Safety Case Integration**
- Pharmacist dialogue explains CLAIM-HC-003 (drug library integrity) from clinical perspective
- Reinforces consequence of failure (40mg morphine = lethal dose)
- Validates player decision to suspend pumps pending verification

### 2. **Human-Centred Perspective**
- Mrs Kowalski represents patient voice absent in purely technical/administrative dialogue
- Post-op cardiac patient provides authenticity to clinical context
- Patient observations (pump beeping, medication changes) escalate credibility of player concerns

### 3. **Procedural Transparency**
- Pharmacist explains the "why" behind manual dosing protocol
- Clarifies that human oversight can be more reliable than corrupted automation
- Documents spot-check verification procedure for post-incident audit trail

### 4. **Narrative Continuity**
- Pharmacist exists in causal chain: Sarah escalates → Pharmacist arrives → Verification → Resumption
- Mrs Kowalski observes and reflects entire incident arc from patient perspective
- Both NPCs reinforce theme that cyber-physical safety depends on people, not just systems

---

## Testing Checklist

**Before Scenario Playtest:**

- [ ] Run full scenario validation: `ruby scripts/validate_scenario.rb scenarios/sis01_healthcare/scenario.json.erb`
- [ ] Test pharmacist dialogue in game engine:
  - [ ] Trigger `drug_library_compromised = true` and verify pharmacist concern escalates
  - [ ] Verify `pump_suspension_confirmed` is set correctly
  - [ ] Test `post_drug_restored` pathway with `drug_library_restored = true`
- [ ] Test Mrs Kowalski dialogue in game engine:
  - [ ] Verify pump_concern knot triggers when player approaches
  - [ ] Verify `#complete_task:check_bedside_pump` fires when player agrees
  - [ ] Test medication concern pathway with `drug_library_compromised = true`
- [ ] Verify all global variable reads/writes are defined in `scenario.json.erb`
- [ ] Check NPC sprite assignments (pharmacist currently uses `female_scientist` placeholder; Mrs Kowalski invisible/chair-seated)
- [ ] Test narrative flow across all 6 branching paths to ensure pharmacist & patient reactions vary by branch

**Post-Playtest:**

- [ ] Gather feedback on pharmacist characterisation (tone, expertise level, empathy)
- [ ] Gather feedback on Mrs Kowalski's role (too intrusive? too quiet? appropriately patient voice?)
- [ ] Verify all influence_increased/influence_decreased tags work as intended
- [ ] Collect dialogue timing data (average conversation length, number of revisits)

---

## Outstanding Tasks

### High Priority
- [ ] **Sprite Assignment** — Assign appropriate sprites for:
  - Pharmacist (currently placeholder `female_scientist` or similar)
  - Mrs Kowalski (patient in chair — custom sprite or static dialogue interface)
- [ ] **NPC Phone Numbers** — If implementing phone NPC variant for pharmacist callback
- [ ] **Sound Integration** — `hospital_ambient` soundscape for ward scenes where pharmacist/patient speak

### Medium Priority
- [ ] **Dialogue Voice Recording** — TTS generation for pharmacist and patient lines
- [ ] **Influence Parameter Tuning** — Adjust `+10` / `+5` / `-1` values based on playtests
- [ ] **Edge Case Testing** — Verify behaviour if player encounters pharmacist before drug tamper discovery

### Low Priority
- [ ] **Extended Dialogue Variants** — Additional hospital safety topics Mrs Kowalski could discuss
- [ ] **Post-Debrief Epilogue** — Optional reflective dialogue with pharmacist & patient after NCSC closes

---

## File Structure

```
scenarios/sis01_healthcare/
├── ink/
│   ├── npc_sarah.ink                 [215 lines | Charge Nurse]
│   ├── npc_sarah.json                [Compiled]
│   ├── npc_patrol_nurse.ink          [101 lines | Staff Nurse]
│   ├── npc_patrol_nurse.json         [Compiled]
│   ├── npc_ravi.ink                  [196 lines | IT Security]
│   ├── npc_ravi.json                 [Compiled]
│   ├── npc_david.ink                 [215 lines | Clinical Safety]
│   ├── npc_david.json                [Compiled]
│   ├── npc_helen.ink                 [223 lines | Information Governance]
│   ├── npc_helen.json                [Compiled]
│   ├── npc_hartley.ink               [225 lines | Clinical Director]
│   ├── npc_hartley.json              [Compiled]
│   ├── npc_sharma.ink                [293 lines | NCSC Investigator]
│   ├── npc_sharma.json               [Compiled]
│   ├── npc_pharmacist.ink            [218 lines | NEW ✅]
│   ├── npc_pharmacist.json           [Compiled ✅]
│   ├── npc_chair_patient.ink         [223 lines | NEW ✅]
│   └── npc_chair_patient.json        [Compiled ✅]
├── mission.json                      [Metadata]
├── scenario.json.erb                 [Updated story paths]
└── dungeon_graph.html                [Generated]
```

---

## References

- **Scenario Planning:** `/planning_notes/sis_scenarios/case_1_healthcare_game_design/gdd_walkthrough.md`
- **Implementation Notes:** `/planning_notes/sis_scenarios/case_1_healthcare_game_design/scenario_implementation_notes.md`
- **INK Documentation:** `story_design/story_dev_prompts/07_ink_scripting.md`
- **Scenario Format Guide:** `SCENARIO_JSON_FORMAT_GUIDE.md`
- **Validation Script:** `scripts/validate_scenario.rb`
