# INK Development Summary — Case 2: Energy (Albion Battery Hall)

**Date**: April 4, 2026  
**Focus**: Comprehensive expansion of NPC dialogue trees for deeper technical education and SIS teaching moments

---

## Overview

The four NPC scripts for the Albion Battery Hall scenario have been substantially enhanced with additional branching dialogue, deeper technical explanations, and more thorough engagement with the SIS teaching concepts from the Game Design Document. The scripts now provide richer decision-making pathways and more detailed exploration of the key safety engineering concepts.

---

## Changes by NPC

### 1. Helen Marsh (`npc_helen_marsh.ink`)

#### New dialogue branches:

**Initial walkdown discussion** (`what_to_look_for`):
- Added branch: `why_analog_comparison` — explains the principle of independent instrumentation as a safety-critical mechanism; contrasts digital vs. analog; introduces the concept that compromised digital systems require independent analog cross-reference
- Added branch: `expected_temperature_range` — educates on normal operating parameters; introduces thermal runaway threshold concept; sets up the physics of the hazard
- Added branch: `priya_intuition` — explores why Helen's gut instinct is valuable; talks about "too clean" data patterns; builds trust in operator expertise

**ESD explanation** (extensively expanded):
- Split into multiple sub-branches: `esd_technical_detail`, `esd_consequence`, `esd_reset`
- `esd_technical_detail`: Deep dive into relay circuits, why hardwired is superior to software
- `esd_consequence`: Physical consequences of pressing ESD; discusses contract penalties vs. safety
- `esd_reset`: Manual reset requirement; deliberate design choice to force consideration
- New branch: `why_independent_esd` — directly teaches defence in depth; explains why SIS cannot be the only safety layer

**SIS compromise discussion** (extensively expanded):
- Split original single response into multiple branches:
  - `sis_engineering_port`: Architecture explanation; commissioning root cause
  - `engineering_port_history`: How "temporary" became "permanent"; risk acceptance story
  - `sis_isolation_design`: Proper air-gapped architecture per IEC 61511
  - `sis_compromise_consequences`: Detailed impact analysis
  - `attacker_intent`: Hypothesis about why threshold was raised
  - `alarm_theory`: Why digital alarms cannot be trusted when digital system is compromised
  - `sis_audit_trail`: How the compromise is recorded in logs

**SIS patch situation** (extensively expanded):
- Replaced single response with multiple educational branches:
  - `patch_defensibility`: Explores why deferral failed; introduces concept of non-existent compensating controls
  - `patch_technical_detail`: What the patch does; why recertification is necessary
  - `recertification_explained`: Cost and process explanation for SIL 2 recertification
  - `priya_patch_recommendation`: Helen's professional judgment on the correct path forward; highlights the business decision that created the safety gap

#### SIS concepts reinforced:
- Independent instrumentation as last-resort safety detection (CLAIM-EN-007)
- Hardwired ESD as cyber-independent safety boundary (CLAIM-EN-008)
- SIS independence violation through network reachability (CLAIM-EN-002)
- Patching constraints and compensating control effectiveness (CLAIM-EN-005, CLAIM-EN-006)
- Physical vs. digital system trust; operator expertise value

---

### 2. Marcus Webb (`npc_marcus_webb.ink`)

#### New dialogue branches:

**Isolation trade-off discussion** (expanded from single response):
- Split into branches: `isolation_surgical_approach`, `isolation_secondary_concern`, `isolation_timing`, `isolation_worst_case`
- `isolation_surgical_approach`: Surgical phased approach; pull jump server first, then enterprise isolation
- `isolation_secondary_concern`: Secondary pathway (historian Modbus); belt-and-braces approach
- `isolation_timing`: Critical sequencing insight — ESD before network isolation; explains why
- `isolation_worst_case`: Detailed consequence analysis if isolation happens before ESD

**CLAIM-EN-001 — IT/OT Boundary** (extensively expanded):
- Added branches: `why_not_fixed`, `proper_boundary_design`, `prevention_discussion`
- `why_not_fixed`: Honest explanation of cost/disruption trade-offs; introduces normalisation of deviance
- `proper_boundary_design`: Comprehensive architecture guidance; one-way data diodes; air-gapped terminals
- `prevention_discussion`: Counterfactual analysis — how this attack would have been prevented with proper architecture

**SIS patch view** (significantly expanded):
- Added branches: `patch_assessment_reflection`, `patch_technical_detail`, `marcus_patch_rec`, `patch_prevention`
- `patch_assessment_reflection`: Marcus's self-reflection on risk communication; introduces "incomplete information" concept
- `patch_technical_detail`: Technical breakdown of the vulnerability; default credential explanation
- `marcus_patch_rec`: Professional recommendation; introduces "risk pretence" concept
- `patch_prevention`: Counterfactual — patch would have prevented ESD need

#### SIS concepts reinforced:
- IT/OT boundary architecture (CLAIM-EN-001)
- Risk assessment communication gaps; normalisation of deviance
- Compensating control verification requirement
- Network isolation as complex incident response decision
- Patch deferral decision framework

---

### 3. Tom Hadley (`npc_tom_hadley.ink`)

#### New dialogue branches:

**OT scope clarification** (expanded):
- Added branches: `soc_scope_debate`, `ot_monitoring_detection`
- `soc_scope_debate`: Context on business decisions; threat propagation between zones; monitoring blind spot consequence
- `ot_monitoring_detection`: Specific explanation of what OT-inclusive monitoring would have caught; five-hour blind spot quantification

**Trent Water cross-sector dependency** (significantly expanded):
- Original single branch split into: `trent_water_lateral_movement`, `trent_water_details`, `trent_water_ot_risk`
- `trent_water_lateral_movement`: Lateral movement mechanism; cascade risk implications; government OES perspective
- `trent_water_details`: Specific technical indicators (TW-SCADA-ENG-02 workstation; GridIntegration folder; timing correlation)
- `trent_water_ot_risk`: Analysis of OT propagation; network isolation assessment; critical infrastructure impact

#### SIS concepts reinforced:
- SOC monitoring scope as governance and safety decision (CLAIM-EN-010)
- Detection blind spots and their consequences
- Cross-sector dependencies and cascade risk (CLAIM-EN-011)
- Essential services interdependencies

---

### 4. Dr Priya Sharma / Priya S. (`npc_priya_sharma.ink`)

#### New dialogue branches:

**Root cause analysis** (expanded):
- Added branches: `attack_detection_timing`, `jump_server_criticality`, `regulatory_next_steps`
- `attack_detection_timing`: Two detection points; why each was missed; monitoring scope vs. outcome
- `jump_server_criticality`: Configuration management failure; commissioning-to-permanent transition; dormant account exploitation
- `regulatory_next_steps`: NIS investigation timeline; remediation plan requirements; sector-wide learning

**SIS independence discussion** (significantly expanded):
- Original single branch split into: `sis_port_vulnerability`, `sis_proper_architecture`, `eis_independence`
- `sis_port_vulnerability`: Three-failure model — architecture, risk assessment, compensating controls
- `sis_proper_architecture`: IEC 61511 principles; hardwired signal-only specification; operational convenience vs. safety trade-off
- `eis_independence`: Why hardwired works; firmware vs. circuit; penultimate safety layer concept

#### SIS concepts reinforced:
- Three-layer failure model (architecture, risk assessment, compensating controls)
- IEC 61511 independence principles
- Hardwired vs. software safety boundaries
- Normalisation of deviance (existing knowledge, not acted upon)
- Living safety case vs. compliance artefact

---

## Educational Depth Enhancements

### Key SIS Concepts Now Directly Taught:

1. **Independent Instrumentation** (CLAIM-EN-007)
   - Helen: analog thermometer reliability; why it's the "only reading that cannot be compromised"
   - Taught through contrast with digital falsification

2. **Hardwired Safety Boundaries** (CLAIM-EN-008)
   - Helen: ESD mechanics; relay circuits; no firmware vulnerability
   - Marcus: emphasises it works "regardless of what the attacker does next"
   - Priya S.: "penultimate safety layer"; why it's the last line

3. **IT/OT Boundary Design** (CLAIM-EN-001)
   - Marcus: temporary settings that became permanent; bidirectional RDP as vulnerability
   - Tom: SOC contract scope limitations; monitoring blind spots
   - Priya S.: counterfactual — prevention requires proper boundary segmentation

4. **SIS Network Independence** (CLAIM-EN-002)
   - Helen: "SIS isn't independent. It's connected."
   - Detailed explanation of engineering port reachability
   - Three-failure model in debrief

5. **Patching Constraints** (CLAIM-EN-005 vs CLAIM-EN-006)
   - Helen: recertification process; £180,000 cost; eight weeks offline
   - Marcus: deferral decision framework; compensating control effectiveness
   - Priya S.: "risk pretence" when controls don't exist

6. **SOC Monitoring Scope** (CLAIM-EN-010)
   - Tom: contract scope limitations; "watching the wrong thing" when zones are connected
   - Detection blind spot quantification (5 hours)
   - Why OT-inclusive monitoring is safety-critical

7. **Cross-Sector Dependency** (CLAIM-EN-011)
   - Tom & Priya S.: shared file server; lateral movement paths
   - Trent Water case; water treatment cascade risk
   - Government OES perspective

8. **Normalisation of Deviance**
   - Consistent theme across all NPCs
   - "Known risks documented but not acted upon"
   - Safety case as living document vs. compliance filing

---

## Dialogue Structure Patterns

The expanded scripts follow consistent educational patterns:

1. **Technical Detail Branches**: When a player asks "how does this work?", provide concrete technical explanation
2. **Why/Consequence Branches**: Questions like "what's the consequence?" get detailed impact analysis
3. **Decision Principle Branches**: "Why not fix this?" questions reveal the business/governance decisions
4. **Counterfactual Branches**: "Could this have been prevented?" allows players to explore alternative scenarios
5. **Cross-NPC Reinforcement**: Key concepts are explained from multiple perspectives (architect, engineer, operator, inspector)

---

## Scene Moments Enhanced

### Helen's Initial Walkdown
- More detailed teaching about analog as cross-reference
- Better scaffolding of the physical vs. digital trust decision

### ESD Explanation
- Now covers mechanics, consequences, reset procedure, and design philosophy
- Introduces defence-in-depth concept explicitly

### SIS Compromise Discussion
- Traces full path from commissioning to exploit
- Explains why patch deferral was chosen; why it failed

### Marcus's Isolation Decision
- Detailed sequencing guidance (ESD before network isolation)
- Explains worst-case scenarios
- Introduces "belt and braces" approach

### Tom's SOC Scope Discussion
- Quantifies detection blind spot (5 hours)
- Explains why cost savings created safety gap

### Priya S.'s Debrief
- Three-failure model makes architecture/governance/compensating-control failures explicit
- Counterfactual analysis (proper boundary = prevention)
- Normalisation of deviance theme ties everything together

---

## Integration with Game Mechanics

The expanded dialogue supports the existing game state variables and triggers:

- **`anomaly_detected`**: Unlocks more detailed Helen discussion of thermometer significance
- **`sis_tamper_confirmed`**: Enables full SIS compromise conversation; sets `en002_claim_assessed`
- **`jump_server_confirmed`**: Triggers Marcus RDP discussion; reveals five-hour blind spot
- **`esd_activated`**: Helen confirms cooling; discussion shifts to recovery mode
- **`facility_safe_state`**: Priya S. debrief becomes available; synthesises all learning

No changes to game state management; only dialogue content enhanced.

---

## Recommendations for Further Development

### Phase 2 (VM/Minigame Content):
1. The historian trend viewer (MG-02) VM should include a tooltip explaining why flat-line readings are implausible
2. The access log viewer (MG-04) VM should display the c.ellison account status and contractor termination date
3. The SIS configuration panel (MG-03) should show the audit trail timestamp with c.ellison ownership attribution

### Phase 3 (Environmental/Ambient):
1. Network architecture diagram (MG-06) should highlight the jump server and historian as critical weaknesses
2. Alarm panel progression (MG-05) should include SIS-specific alerts when threshold manipulation is discovered
3. Hydrogen detector progression (MG-06) should include real-time percentage updates tied to scenario timeline

### Phase 4 (Storyline Extensions):
1. Consider adding a post-debrief "30-day plan" dialogue with Marcus where he outlines remediation priorities
2. Optional branch: CEO accountability conversation about board-level decisions on risk acceptance
3. Optional branch: Contractor exit interviews/credential audit with IT security team

---

## Testing Recommendations

1. **Playtest dialogue flow**: Ensure branching makes sense; no orphaned conversations
2. **Verify global variable setting**: Check that all `#set_global` tags fire correctly
3. **Cross-NPC consistency**: Verify that all NPCs tell consistent versions of the story
4. **Learning outcome validation**: For each SIS teaching moment, confirm the dialogue delivers the intended concept
5. **Timing validation**: Run through Objectives 1–10; confirm dialogue doesn't exceed scenario time budget

---

## Files Modified

- `/scenarios/sis02_energy/ink/npc_helen_marsh.ink` — +150 lines (from ~360 to ~510)
- `/scenarios/sis02_energy/ink/npc_marcus_webb.ink` — +120 lines (from ~268 to ~388)
- `/scenarios/sis02_energy/ink/npc_tom_hadley.ink` — +100 lines (from ~215 to ~315)
- `/scenarios/sis02_energy/ink/npc_priya_sharma.ink` — +90 lines (from ~312 to ~402)

**Total additions**: ~460 lines of dialogue across all four scripts

---

## Learning Outcome Summary

By the end of the expanded dialogue experience, a player should understand:

1. **Why independent physical systems matter**: Analog thermometer can't be hacked; hardwired ESD can't be compromised
2. **How temporary settings become permanent vulnerabilities**: Jump server commissioning configuration never reverted
3. **Why SIS independence is structural, not just logical**: Engineering port reachability violates the safety principle
4. **What proper compensation controls look like**: OT-inclusive monitoring must actually exist and work
5. **How business decisions create safety gaps**: SOC contract excluding OT; patch deferral with non-existent compensating controls
6. **Why cross-sector dependencies matter**: Shared file server creates Trent Water exposure; both OES critical services
7. **What normalisation of deviance means**: Known risks documented, accepted, then forgotten; safety case as living doc

The dialogue now provides a comprehensive education in OT security-informed safety through the lens of a realistic incident, taught by NPCs who represent different perspectives (operator, security, provider, regulator).
