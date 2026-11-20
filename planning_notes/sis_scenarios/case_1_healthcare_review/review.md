# Review: sis01_healthcare Final Scenario

Date: 2026-04-25

Reviewed artefacts:
- `scenarios/sis01_healthcare/mission.json`
- `scenarios/sis01_healthcare/scenario.json.erb`
- `scenarios/sis01_healthcare/ink/*.ink`
- `planning_notes/sis_scenarios/case_1_healthcare_information_pack/`
- `/home/cliffe/Files/Projects/Code/CyBOK_Phase_7_SIS/project_spec.md`

## Executive Summary

The scenario is strong in concept and already captures the core Security-Informed Safety teaching move that the project needs: a cyber incident is translated into patient-safety consequences, and the player is made to balance containment, continuity of care, governance, and regulatory action rather than simply "solve the hack". The overall structure is coherent, the critical path is readable, and the scenario aligns well with the Northgate information pack's central storyline around ransomware, incomplete segmentation, dual-homed workstations, loss of monitoring, drug-library risk, and integrated IT/clinical decision-making.

However, I would not treat this as fully review-complete or release-ready yet. The blocking validator-invalid asset issues and the earlier Ink/task and role/regulatory drift findings have now been remediated, but one core design issue remains: the authorisation-vs-execution model for network isolation is not yet explicit enough in gameplay, and can still read as a bypass rather than delegated governance. That still matters for playability and pedagogic credibility.

Overall judgement: **strong and well targeted, but not yet final-final**.

## Implementation Update (2026-04-25)

The requested remediation pass has been applied to the scenario files:

Completed in code:
- Reconciled Ink task tags to objective ids, including Helen's `notify_ico` mismatch.
- Removed stale `#complete_task` tags that pointed to non-existent tasks (`escalate_bed4`, `check_bedside_pump`, `declare_major_incident`).
- Aligned Helen as CIO-led incident coordination and clarified Hartley as Caldicott/governance advisor, with responsibilities kept distinct.
- Reconciled ICO timing references to a single awareness point (Mon 22:38) and clarified the compressed 45-minute training timer in the in-room tablet.
- Softened NCSC wording to avoid overstating legal mandate while preserving strong operational guidance for early notification.
- Added two explicit in-world evidence artefacts in the Major Incident Room:
	- Vendor remote access exception register.
	- Internal audit follow-up note on governance and backup/immutability gaps.

Verification rerun:
- Ink recompilation: successful for edited Ink files.
- Scenario validator rerun: passes schema and wiring checks with no blocking invalid errors (the previous `vpn_log_terminal` / `drug_library_terminal` asset blockers were cleared using tracked placeholders).

## Validator Review

Validator command run:

`ruby scripts/validate_scenario.rb scenarios/sis01_healthcare/scenario.json.erb`

### ❌ INVALID

No current blocking invalid items after the April 2026 remediation pass.

### ✅ GOOD PRACTICE

The scenario is doing a number of important things well already:
- It uses timed opening briefing with `skipIfGlobal`, so the opening does not replay on resume.
- It has strong event-driven NPC reactions and consequence handling.
- It uses collection/objective wiring properly for the paper chart task.
- It includes puzzle graph metadata and produces a meaningful integrated graph.
- It uses music/state transitions to reinforce incident pressure and debrief tone.

### 💡 SUGGESTIONS

Most validator suggestions were generic patterns from other scenario types and are not especially relevant here. This healthcare scenario is already feature-rich and should not be pushed toward unnecessary VM/hostile-NPC/CTF complexity just to satisfy a generic pattern.

### Dungeon Graph Summary

- Puzzle graph: 33 nodes, 40 edges
- Story graph: 5 nodes, 4 edges
- Integrated graph: 38 nodes, 56 edges
- Rooms graph: 3 nodes, 2 edges
- Critical path: `Assess Ward 7 -> Investigate the Attack -> Authorise Network Isolation -> Restore Safe Clinical Operations -> NCSC Debrief`

The graph summary is appropriate for the intended teaching arc. It shows a scenario that is compact in physical space but fairly rich in puzzle/story linkage.

## Review Against Information Pack and SIS Aims

## What Aligns Well

### 1. Strong alignment to the Northgate storyline

The implemented scenario reflects the information pack's core attack sequence well:
- ransomware on the enterprise side;
- incomplete segmentation and dual-homed crossings into clinical impact;
- Ward 7 monitoring loss creating a direct patient-safety hazard;
- infusion pump drug-library integrity as a second safety-critical risk;
- containment versus continuity trade-off around network isolation;
- recovery under degraded paper/manual procedures;
- governance and reporting duties layered into the response.

This is a good translation of the pack into playable form rather than a superficial retelling.

### 2. Good fit to the Phase 7 SIS project aims

The project spec emphasises scenarios where cyber actions have direct functional safety implications and where learners coordinate across organisational boundaries. This scenario does that clearly. The player is not just investigating malware; they are being forced to reason about:
- security-to-safety propagation;
- requirements reconciliation;
- integrated incident response;
- organisational and regulatory duties;
- visible consequences of delay or poor judgement.

That is exactly the right direction for a CyBOK SIS case study.

### 3. Good use of NPCs to carry interdisciplinary reasoning

The cast is well chosen for SIS teaching:
- Sarah grounds the scenario in immediate bedside safety.
- Ravi grounds technical containment and attack-path analysis.
- David ties actions back to explicit assurance claims.
- Helen and Hartley bring regulatory and governance framing.
- Priya Sharma closes the loop through post-incident learning.

This is much better than a purely technical incident-response scenario. It supports the stated aim of language/concept alignment across security, safety, and governance.

### 4. Consequences are visible enough to support the teaching model

The Bed 4 timer chain, Bed 2 double-jeopardy path, dynamic command board, NPC reactions, and debrief outcomes all help make the security-safety trade-off tangible. That is a good match for the project aim that decisions should trigger visible consequences rather than remaining abstract.

## Design Findings

### CONCERN 1: The network-isolation flow does not yet clearly enforce the intended authorisation-vs-execution distinction

The most important design issue is in how the network change is represented in mechanics. If the intended model is realistic dual authorisation with a single technical implementer executing the change, that model needs to be explicit and technically enforced. At present, the `network-segmentation-map` SEVER action can still be interpreted as bypassing governance rather than implementing an already-authorised change.

This is not a minor detail. It cuts across the scenario's main learning point:
- CLAIM-HC-007 is about integrated IT/clinical decision-making.
- if execution is delegated to the incident responder, both authorisations still need to be validated at execution time.
- without clear gating/audit signalling, players may experience the flow as an unauthorised shortcut even when the narrative intends authorised delegation.

The scenario does narratively recover by having Ravi, David, and Priya respond critically. That is useful as a branch. But for the primary path, the mechanics should unambiguously convey either:
- authorised delegation (single implementer, dual approvals required), or
- a true hard lock (cannot execute without both PIN approvals).

### CONCERN 2: The scenario strongly covers three assurance claims, but the wider pack is represented more by dialogue than interaction

The strongest directly-played content is around:
- CLAIM-HC-001 (segmentation / dual-homed compromise)
- CLAIM-HC-003 (drug library integrity)
- CLAIM-HC-007 (integrated incident response)

That focus is sensible and probably correct for a single scenario. But compared with the richness of the information pack, some adjacent concepts are present mostly as exposition rather than as learner action:
- backup immutability and recovery architecture;
- PACS and imaging integrity;
- vendor remote access as an alternative pathway;
- longer-horizon governance failures such as joint committee/risk-register weakness.

This is acceptable as scope control, but it means the scenario is best read as a focused slice of the Northgate case rather than a broad enactment of the whole pack.

### OK: Solvability and critical-path logic are sound overall

The critical path is logically structured and appears solvable:
- Sarah's opening briefing, the RFID card, and the Ward 7 checks establish stakes before technical investigation.
- Ravi gates SIEM/VPN understanding before IT sign-off.
- David gates clinical sign-off through assurance reasoning rather than arbitrary lock puzzles.
- Helen and the recovery/debrief phase give a clear onward path after isolation.

I did not identify a hard circular dependency in the intended route.

### OK: Clue distribution is compact but coherent

Clues are spread sensibly across the three rooms rather than dumped into one location. The scenario uses:
- Ward 7 for stakes and clinical context;
- IT office for attack-path evidence;
- major incident room for governance, recovery, and debrief.

That is a good three-room teaching layout.

### OK: Room layout matches the scenario's dramatic needs

The physical map is compact and linear, but that is appropriate here. A sprawling map would likely dilute urgency. The chosen structure supports rapid cycling between bedside risk, technical triage, and strategic decision-making.

### OK: Objectives scaffolding is generally clear

The objective sequence is readable and mostly well handed off through dialogue and event reactions.

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Transition support |
|---|---:|---:|---|---|
| Assess Ward 7 | 3 | 3 | Low | Strong: Sarah briefing and Bed 4 escalation |
| Investigate the Attack | 4 | 4 | Low | Strong: Ravi unlocks both technical tasks and calls player back |
| Authorise Network Isolation | 3 | 3 | Medium | Good in narrative; needs clearer gating to reflect delegated authorisation model |
| Restore Safe Clinical Operations | 3 required + 3 optional | 3 required | Low-Medium | Good: Helen and David point forward, but optional tasks create some sprawl |
| NCSC Debrief | 1 | 1 | Low | Strong: Priya bark / appearance is clear |

The main scaffolding weakness is not a missing pointer; it is that the bypass route can let players skip the intended governance mechanism while still progressing.

## Recommendations

## Must Fix

1. Implement one explicit delegated authorisation model and enforce it in UI/state checks: single implementer executes only after both approvals are present and logged.

2. Or, if preferred, implement a hard-lock model: the SEVER path requires both authorisation PINs before execution.

## Should Fix

1. Add one more visible environmental consequence after isolation or restore, so the player's action changes not only dialogue and debrief text but also the state of a ward or board display in a more immediately legible way.

## Worth Considering

1. Keep the scenario focused on HC-001, HC-003, and HC-007 rather than broadening it too much, but consider a small optional branch or debrief prompt that explicitly references PACS or vendor remote access so the scenario better signals that it is a slice of a larger systems problem.

2. Update the internal scenario notes in `VALIDATION_SUMMARY.md` and similar support files if they are still carrying stale assumptions from earlier iterations. Some of those support documents no longer fully match the final implementation.

3. Consider a short review pass specifically on wording precision for legal/regulatory claims, because this scenario will likely be read by people who care about exactly where security duties end and formal legal obligations begin.

## Final Assessment

This is a good Phase 7 SIS scenario. It has the right subject matter, the right teaching posture, and a strong enough narrative/mechanical spine to support serious learning rather than superficial gamification. The scenario's best quality is that it makes assurance claims playable: the player is not just told that governance, segmentation, and fallback matter; they are asked to act inside those constraints.

The remaining work is mostly about tightening fidelity and removing contradictions:
- remove the dual-auth bypass or formalise it properly.

Once those are addressed, this should stand as a strong healthcare case study for the project's stated SIS aims.