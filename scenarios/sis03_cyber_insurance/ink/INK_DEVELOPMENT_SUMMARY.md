# SIS03 Cyber Insurance — INK Development Summary

**Status**: Core NPC dialogue trees completed (April 4, 2026)

**Scenario**: Meridian Claims Team coverage determination for Albion Energy Storage £8.2M cyber insurance claim

---

## Completed Work

### 1. Eleanor Vance — Claims Manager
**File**: `npc_eleanor_vance.ink` (34 KB)

**Scope**: Full dialogue tree guiding the scenario from initial briefing through coverage decision and debrief.

**Key Features**:
- Welcome/Initial Briefing → policy_reviewed tracking
- Forensic Chain Briefing → forensic_chain_verified tracking  
- Evidence Archive Access Grant → evidence_archive_unlocked
- Warranty Discussion Hub (W-03, W-07, W-09, W-12) with nuanced branches
- Underwriting File Discussion → underwriting_challenge_discussed
- Act-of-War Exclusion (complexity & decision paths)
- Coverage Decision Form Presentation
- Debrief Phase with three synthesis branches:
  - Warranty Synthesis (W-07 enforcement vs. W-03 safety constraint trade-off)
  - War Exclusion Synthesis (systemic risk of state-attack exclusions)
  - Underwriting Synthesis (Meridian's prior knowledge and moral position — CLAIM-INS-009)

**Teaching Integration**:
- CLAIM-INS-001 (IT/OT segmentation as coverage condition)
- CLAIM-INS-002 (SIS independence requirement)
- CLAIM-INS-003 (SIS patch management with safety exception)
- CLAIM-INS-008 (act-of-war exclusion and infrastructure incentives)
- CLAIM-INS-009 (insurer knowledge of deficiencies and underwriting decision)

**State Variables Tracked**:
- `claim_opened`, `policy_reviewed`, `claim_file_reviewed`, `forensic_chain_verified`
- `evidence_archive_unlocked`, `warranty_checklist_complete`, `underwriting_file_reviewed`
- `loss_quantum_reviewed`, `attribution_brief_reviewed`, `coverage_form_reviewed`
- `trent_water_assessed`, `coverage_decision_made`, `coverage_decision`, `war_exclusion_invoked`
- `disclosure_position`, `eleanor_debrief_mode`, `debrief_started`, `debrief_complete`

---

### 2. James Whitworth — Albion Risk Manager (Phone NPC)
**File**: `npc_james_whitworth.ink` (13 KB)

**Scope**: Policyholder perspective on warranty breaches and claim justification.

**Key Features**:
- Welcome & Initial Call
- W-07 Remediation Discussion: vendor delays, extension request history
- W-03 SIS Patch Discussion: IEC 61511 safety constraint, £180K recertification cost, board-level decision
- Compensating Controls Discussion: SOC scope expansion, implementation status
- Business Interruption Discussion: £4.8M revenue claim, contested pre-existing maintenance argument
- Shared Infrastructure (Trent Water) Discussion: cross-sector risk, investigation status

**Teaching Integration**:
- Humanizes the warranty breaches through operational context
- Illustrates genuine safety-security trade-offs (IEC 61511 recertification constraint)
- Shows "compensating controls" failure pattern (commitment without execution)
- Bridges Case 2 (Albion Battery Hall) with Case 3 insurance perspective

**Dialogue Branches**:
- 4 optional topics (W-07, W-03, business interruption, Trent Water)
- Conditional branches based on player evidence review (`ot_forensics_reviewed`, `loss_quantum_reviewed`)

---

### 3. Simon Hartley — Loss Adjuster (Phone NPC)
**File**: `simon_hartley.ink` (15 KB)

**Scope**: Independent loss quantification and forensic evidence gaps.

**Key Features**:
- Welcome & Initial Call
- Incident Response Costs (£1.4M): breakdown and verification
- Business Interruption (£4.8M): contested calculation, pre-existing maintenance debate, baseline methodology
- Physical Damage (£1.6M): thermal degradation assessment, replacement quotes
- Evidence Gaps: PLC register overwrite by ESD, historian reliability, forensic circularity
- Trent Water Exposure: provisional £400K investigation cost, lateral movement uncertainty

**Teaching Integration**:
- CLAIM-INS-006 (evidence preservation vs. safety restoration): ESD prevented thermal runaway but destroyed forensic evidence
- Loss quantification methodology for cyber-physical claims
- Cross-sector risk propagation (water utility implications)

**Dialogue Branches**:
- 5 optional topics (incident response, BI, physical damage, evidence gaps, Trent Water)
- Professional judgment transparency (contested business interruption)
- Conditional context based on forensic evidence review

---

### 4. Robert Ngata — NCSC Incident Liaison (Phone NPC)
**File**: `npc_robert_ngata.ink` (14 KB)

**Scope**: NCSC perspective on attribution, disclosure, and systemic infrastructure risk.

**Key Features**:
- Welcome & Initial Call
- Attribution Discussion: GREYMANTLE confidence (70-80%), intelligence vs. legal thresholds
- War Exclusion Context: difference between intelligence confidence and legal "act of war" standard
- Disclosure Discussion: IOCs, timeline pressure, regulatory authority
- Trent Water Exposure: suspicious artefacts, cross-sector design flaw
- Critical Infrastructure Incentives: systemic effect of insurance exclusions on security investment

**Teaching Integration**:
- CLAIM-INS-008 (act-of-war exclusion as governance mechanism): invoking exclusion undermines security incentives
- Attribution complexity (Ferryman Collective + GREYMANTLE two-actor model)
- Regulatory disclosure tension
- Cross-sector risk propagation

**Dialogue Branches**:
- 5 optional topics (attribution, war exclusion, disclosure, Trent Water, infrastructure incentives)
- Strong systemic perspective on insurance as governance

---

## Integration Status

### Scenario.json.erb References
All four NPC files are designed to integrate with the existing `scenario.json.erb` structure:

- **Eleanor Vance** (person NPC, present throughout)
  - Dialogue tree controls scenario flow through globalVariables
  - Multiple interactive conversations with hub system
  
- **James Whitworth** (phone NPC, optional)
  - Triggered via phone object in inventory
  - Conditional branches based on game state
  
- **Simon Hartley** (phone NPC, optional)
  - Triggered via phone object after `loss_quantum_reviewed = true`
  - Conditional context based on forensic evidence availability
  
- **Robert Ngata** (phone NPC, optional)
  - Triggered via phone object after `attribution_brief_reviewed = true`
  - Strong thematic integration with war exclusion decision

### Global Variable Integration
All INK files use consistent variable names and read/write patterns:
- `warranty_checklist_complete` → signals readiness for Evidence Archive access
- `underwriting_file_reviewed` → unlocks CLAIM-INS-009 synthesis
- `attribution_brief_reviewed` → enables act-of-war discussion
- `coverage_decision_made` → triggers debrief phase
- `war_exclusion_invoked` → branches debrief synthesis

### Teaching Moments Covered
All 10 SIS teaching moments from GDD Section 6 are embedded:

| Teaching Moment | NPC | INK Coverage |
|---|---|---|
| Insuring clause / cyber-physical loss | Eleanor | Policy Review → claim_briefing |
| W-07 (IT/OT segmentation) as coverage condition | Eleanor, James | warranty_hub → w07_discussion; James policy defence |
| W-03 (SIS patch with safety constraint) | Eleanor, James | w03_discussion; James compensating_controls_discussion |
| Underwriting file / Meridian prior knowledge | Eleanor | underwriting_context → Evidence Archive access |
| Evidence lost during ESD reset | Hartley | evidence_gaps_discussion → forensic_circularity |
| NCSC Attribution Brief / legal threshold | Eleanor, Robert | act_of_war_intro → war_exclusion_context |
| Act-of-war exclusion systemic effect | Eleanor, Robert | debrief_war_exclusion_synthesis; infrastructure_incentives_discussion |
| Trent Water third-party exposure | James, Hartley, Robert | shared_infrastructure_discussion; trent_water_discussed (all NPCs) |
| Contested BI calculation (SIS recertification) | James, Hartley | business_interruption_discussion (both, convergent perspectives) |
| Insurance as safety governance synthesis | Eleanor | debrief_start → warranty_synthesis → final hub |

---

## Remaining Work (For Scenario.json.erb Integration)

### Required Before Scenario Launch
1. **Compile INK to JSON**: Generate `.ink.json` files from `.ink` source files (Inky compiler)
2. **Update scenario.json.erb**: Add NPC definitions referencing compiled `.ink.json` files
3. **Sprite Assets**: Eleanor Vance portrait/sprite (placeholder: inspector_female.png)
4. **Phone Object**: Verify phone object is in scenario inventory; check dialogue trigger mechanics

### Testing Checklist
- [ ] Eleanor Vance dialogue tree compiles and flows correctly
- [ ] James Whitworth phone dialogue triggers after first call
- [ ] Simon Hartley available after `loss_quantum_reviewed = true`
- [ ] Robert Ngata available after `attribution_brief_reviewed = true`
- [ ] All global variable reads/writes execute correctly
- [ ] Warranty hub branching (W-03, W-07, W-09, W-12) fully accessible
- [ ] Debrief synthesis branches trigger based on player decisions
- [ ] Optional NPC conversations don't block main scenario flow

### Physical Props (Already Planned in GDD)
- Policy Binder (40-page printed document)
- Warranty Compliance Checklist (interactive form)
- Coverage Decision Form (final decision form)
- NCSC Attribution Brief (sealed envelope)
- Evidence Packets A, B, C (sealed padded envelopes)
- Renewal Decision Memo (archive prop)
- Network Architecture Diagram (annotated pinboard prop)

---

## INK Quality Notes

### Strengths
- Comprehensive warranty discussion with genuine nuance (W-03 safety constraint vs. breach)
- Strong integration of insurance claims framework (CLAIM-INS-001 through CLAIM-INS-009)
- Realistic NPC perspectives (policyholder defence, loss adjuster impartiality, NCSC systemic concern)
- Conditional branching based on game state (prevents players from discussing evidence they haven't reviewed)
- Repeatable hub conversations allow players to control dialogue pacing

### Dialogue Tone
- **Eleanor**: Professional, methodical, acknowledges discomfort with underwriting position
- **James**: Defensive but reasonable, emphasizes operational trade-offs and good-faith effort
- **Hartley**: Impartial expert, transparent about methodology and evidence limitations
- **Robert**: Firm on systemic policy implications, collegial but direct

### Teaching Effectiveness
The four NPCs collectively present:
1. The insurer's duty (coverage determination based on policy wording)
2. The policyholder's position (operational constraints, documented risk decisions)
3. The adjuster's analysis (financial quantification, evidence limitations)
4. The regulator's concern (systemic incentive effects, critical infrastructure resilience)

This multi-perspective approach aligns with CyBOK SIS theme: security-informed safety requires understanding all stakeholder positions, not just technical factors.

---

## File Manifest

```
scenarios/sis03_cyber_insurance/ink/
├── npc_eleanor_vance.ink      [34 KB] ✓ COMPLETE
├── npc_james_whitworth.ink     [13 KB] ✓ COMPLETE
├── simon_hartley.ink          [15 KB] ✓ COMPLETE
└── npc_robert_ngata.ink        [14 KB] ✓ COMPLETE

Total: 76 KB of INK dialogue
Estimated dialogue interactions: 200+ unique dialogue paths
Estimated play-through coverage: 60 minutes (full path with all NPCs)
```

---

## Next Steps

1. Compile INK files to `.ink.json` format using Inky compiler
2. Generate `.ink.json` files and place in same directory
3. Update `scenario.json.erb` to reference compiled NPC files
4. Create sprite/portrait assets for Eleanor Vance
5. Implement phone object trigger mechanics
6. Test scenario flow end-to-end
7. Verify cross-case continuity with Case 2 (if FDP terminal reflects Case 2 decisions)

---

**Date Completed**: April 4, 2026
**Developer Notes**: All dialogue is designed to be read aloud by facilitator or rendered via dialogue display system. No placeholder text; all dialogue is substantive and teaching-focused.
