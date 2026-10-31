# Review: sis03_cyber_insurance Final Scenario

Date: 2026-04-26

Reviewed artefacts:
- scenarios/sis03_cyber_insurance/scenario.json.erb
- scenarios/sis03_cyber_insurance/ink/*.ink
- scenarios/sis03_cyber_insurance/VALIDATION_SUMMARY.md
- planning_notes/sis_scenarios/case_3_cyber_insurance_information_pack/
- /home/cliffe/Files/Projects/Code/CyBOK_Phase_7_SIS/project_spec.md

## Executive Summary

The scenario is structurally sound, validator-clean apart from one expected AND-gate warning, and it aligns well with the intended pedagogic shift for Case 3: a smaller-scope, lower-mechanical-overhead scenario centred on evidence review, warranty reasoning, and coverage determination rather than additional complex minigames.

The core learning design is strong. The scenario successfully translates the information-pack material into a compact insurance investigation where players move from coverage confirmation, to forensic chain verification, to warranty assessment, to final recommendation, and then into an explicit debrief on insurance as a safety-governance mechanism.

The most important scaffolding issues identified in the first review pass have now been addressed:
- claim-level Security-Informed Safety synthesis is surfaced in the debrief and credits;
- the bridge from reviewed evidence to the final coverage recommendation form is clearer in both Eleanor's dialogue and the form UI;
- the dungeon graph better represents the scenario's key Eleanor-driven story bridges;
- the validation summary has been brought back into sync with the current scenario state.

Overall judgement: release-candidate quality for scenario structure, educational direction, and scaffolding, with remaining work now largely limited to presentation polish and full manual QA.

## Validator Review (Current)

Validator command run:

`ruby scripts/validate_scenario.rb scenarios/sis03_cyber_insurance/scenario.json.erb`

### Validation status

- ERB rendering: pass
- JSON structure: pass
- Unknown field checks: pass
- Ink checks: pass
- Objective task wiring: pass
- Schema validation: pass
- Dungeon graph generated: yes

### Validator findings grouped

#### ⚠️ WARNING

1. Two items point to the same unlock target `meridian_evidence_archive`: `policy_binder` and `fdp_terminal`.
- Assessment: acceptable and intentional.
- Reason: this is an AND-gate pattern, not an accidental bypass. The pair is annotated with `puzzle_graph_and_with`, so this should be treated as the known false positive rather than a design flaw.

#### ✅ GOOD PRACTICE

- The opening briefing uses `timedConversation.skipIfGlobal`, so the cutscene does not replay on resume.
- The scenario uses dynamic music and a proper credits/debrief end-state.
- Puzzle graph metadata is present and meaningful.
- Objective task wiring is complete.

#### 💡 SUGGESTION

Most validator suggestions are generic patterns from larger scenarios and should not be treated as requirements here.

Specifically, the following should be treated as non-issues for this scenario's intended scale:
- adding VM launchers;
- adding flag stations;
- adding more lock variety purely for its own sake;
- adding hostile NPCs or patrol systems;
- adding more physical danger mechanics.

This scenario is appropriately narrower and more document- and dialogue-driven than Cases 1 and 2. The right question is not “does it contain as many mechanics as the earlier scenarios?” but “does it teach the intended insurance and Security-Informed Safety reasoning effectively with a compact interaction set?” On that question, the answer is broadly yes.

### Dungeon graph summary

- Puzzle graph: 27 nodes / 28 edges
- Story graph: 7 nodes / 5 edges
- Integrated graph: 34 nodes / 44 edges
- Rooms graph: 2 nodes / 1 edge
- Critical path: 5 hops

Critical path:
- Open the Albion Claim
- Confirm Coverage and Trace the Forensic Chain
- Access the Evidence Archive
- Assess Warranty Compliance
- Review and Make Coverage Recommendation
- Closing Debrief — Insurance as Safety Governance

This is an appropriate graph shape for a compact claims-assessment scenario.

## Design Review

### 1. Solvability Trace

Status: OK

The core progression is coherent and appears free of circular dependencies:
- Eleanor's opening briefing activates the first concrete task.
- `policy_binder` and `fdp_terminal` together gate archive access.
- the archive provides the evidence packets and downstream decision artefacts.
- warranty assessment unlocks the recommendation phase.
- the coverage form unlocks the closing debrief.

The archive unlock is especially important: both the policy review and the forensic chain review are required before Eleanor gives the access code. That matches the intended pedagogic sequence and prevents the player from jumping straight to warranty assessment without first establishing coverage scope and causality.

I did not identify a true soft lock in the implemented progression.

### 2. Clue Distribution Quality

Status: OK with one concern

Strengths:
- clue material is logically grouped by task rather than scattered arbitrarily;
- the claims suite contains the opening policy and forensic materials;
- the evidence archive then concentrates the detailed forensic and underwriting evidence in a way that fits the narrative of a controlled evidence room.

Concern:
- because the scenario is intentionally compact and room count is low, several high-value interpretive clues are clustered in a small number of readables and Eleanor conversations. That is acceptable for scope, but it increases the importance of explicit synthesis. Where a player reads the evidence but does not fully infer its significance, the scenario can feel slightly more like document retrieval than guided reasoning.

Recommendation:
- strengthen one or two existing in-world synthesis beats rather than adding more artefacts. Eleanor's timed follow-up messages and the final recommendation form are the best places to do this.

Update:
- this recommendation has now been implemented in the live scenario content.

### 3. Educational Coverage Against Information Pack and Project Aims

Status: Strong

What is already working well:
- the scenario clearly represents insurance as an indirect safety-governance mechanism, which is the distinctive contribution of Case 3;
- the warranty schedule maps well onto the information-pack claims about segmentation, patch deferral with safety constraints, third-party risk, and attribution ambiguity;
- the scenario directly supports the project aim of showing “cyber attack -> loss of functional safety -> emergent physical hazard”, but through the insurer's evidential and contractual perspective rather than through direct operational control;
- organisational tension is strong: Albion, Meridian, NCSC, legal, underwriting, and loss adjustment perspectives are all present.

Previous gap:
- the scenario included claim-level framing in metadata and checklist configuration, but the strongest learning outcomes were more implicit than explicit at the point where the player made the final recommendation.

This has now been materially improved:
- the end credits include explicit SIS claim synthesis entries;
- Eleanor's debrief now names the major claim themes directly;
- `ins008_assessed` and `ins009_assessed` are now surfaced through the NCSC brief and underwriting file path rather than remaining invisible teaching signals.

Recommendation:
- do not add more minigames.
- instead, add concise synthesis text in existing surfaces: the checklist confirmation state, Eleanor's debrief, or the credits panel.
- the goal is to make the learning model more visible without expanding scope.

Status after update:
- achieved in the intended low-overhead way, without expanding the scenario's mechanical scope.

### 4. Narrative Structure

Status: OK

Opening cutscene:
- present and appropriate;
- clearly frames player role, task, and stakes;
- correctly uses `skipIfGlobal` so it does not replay on resume.

Closing debrief:
- present and substantially stronger than the validator's generic suggestion implies;
- the debrief explicitly reframes the scenario from claim-handling into governance and incentive structure, which is exactly the right thematic endpoint for this case.

Critical dialogue/event flow observations:
- Eleanor's timed messages do useful work in narrating aim transitions.
- The attribution brief correctly opens the Trent Water optional branch.
- The debrief covers warranty reasoning, act-of-war implications, and underwriting knowledge in a coherent way.

This is a good example of a scenario that remains compact while still feeling narratively complete.

### 5. Dungeon Graph Metadata Completeness

Status: OK

The graph is meaningful rather than decorative:
- major puzzle/action nodes are represented;
- the policy binder and FDP terminal are correctly linked as a paired gate;
- the final recommendation form is properly treated as the action that unlocks the closing debrief.

Update:
- a light `puzzle_graph_actions` pass has now been added to Eleanor Vance, and the integrated graph is correspondingly richer.
- this remains documentation-facing polish rather than gameplay-critical logic, but it is now in better alignment with the actual scenario structure.

### 6. Room Layout and Dead Ends

Status: OK

For a two-room scenario, the physical layout is appropriate:
- claims suite for opening analysis and phone-based stakeholder contact;
- evidence archive for secure forensic and underwriting material.

There are no obvious dead rooms. The scenario is spatially simple by design, which is appropriate for a case where the complexity is legal, evidential, and organisational rather than navigational.

### 7. Objectives Scaffolding

Status: Strong

The scenario avoids the most common failure mode of document-heavy cases: silent aim transitions with no in-world handoff. Eleanor's timed messages do a good job of bridging phases.

Previous concern:
- the final recommendation phase depended on the player synthesising several strands of evidence, but the last handoff was slightly weaker than the earlier ones.

This has now been improved in the right way:
- Eleanor's pre-form dialogue maps evidence categories to form sections;
- the form itself now includes a decision brief tying sections back to reviewed artefacts.

#### Aim table

| Aim | # required tasks | # with in-world pointer | Dead zone risk? | Bark/conversation at transition? |
|-----|------------------|-------------------------|-----------------|----------------------------------|
| Open the Albion Claim | 1 | 1 | No | Yes |
| Confirm Coverage and Trace the Forensic Chain | 3 | 3 | Low | Yes |
| Access the Evidence Archive | 4 | 4 | Low | Yes |
| Assess Warranty Compliance | 1 | 1 | No | Yes |
| Review and Make Coverage Recommendation | 4 | 4 | Low | Yes |
| Assess Trent Water Exposure (optional) | 1 | 1 | No | Yes |
| Closing Debrief — Insurance as Safety Governance | 1 | 1 | No | Yes |

Why this aim no longer stands out as the weak link:
- the player is now pointed to the relevant artefacts;
- the evidence-to-decision mapping is explicit enough to support the intended compact design.

## Alignment With Information Pack

### Strong alignment points

1. The scenario faithfully reflects the information pack's core storyline:
- insurer perspective rather than operator perspective;
- tension between evidence preservation and restoration;
- warranty breach analysis under Insurance Act 2015 logic;
- cautious handling of the act-of-war exclusion;
- underwriting knowledge as both legal and reputational problem.

2. The W-03 treatment is especially good:
- the scenario does not collapse into a simplistic “patch late = breach” narrative;
- it preserves the intended teaching point that safety-certified systems create legitimate patching constraints, but that compensating controls still matter.

3. The debrief meaningfully captures the information pack's strongest idea:
- insurance is not merely a payment mechanism but a governance mechanism shaping safety-relevant cyber behaviour.

### Previously weaker area - now improved

The information pack is very explicit about the structured claims logic around CLAIM-INS-001 onward. That structure is now more visible in the player-facing scenario through the debrief, credits, and decision scaffolding, while still keeping the scenario compact.

## Recommendations

## Must Fix Before Final Release

None identified at schema/playability level.

## Implemented Since First Pass

1. **Claim-level learning synthesis surfaced in live content.**
- Implemented through Eleanor's debrief, end credits, and claim-wiring updates.

2. **Evidence-to-decision bridge strengthened.**
- Implemented in Eleanor's pre-form dialogue and the coverage recommendation form itself.

3. **`VALIDATION_SUMMARY.md` refreshed.**
- The file now matches the current scenario structure and validator output.

4. **Light graph-metadata pass completed.**
- Eleanor now contributes explicit `puzzle_graph_actions`, improving the integrated graph as a documentation artefact.

5. **Extra W-03 synthesis line added.**
- The debrief now makes the safety-vs-security trade-off more explicit without adding extra mechanics.

## Worth Considering

1. **Replace placeholder art tracked in scenario comments/TODOs.**
- This remains important for release quality, but it is presentation work rather than design correction.

2. **Run a full end-to-end manual playtest.**
- The scenario is validator-clean and the scaffolding is now stronger, but a live QA pass remains the right way to confirm pacing, clarity, and final dialogue cadence.

## Final Assessment

This scenario is doing the right thing by being smaller than Cases 1 and 2. It does not need additional minigames or more mechanical variety to justify itself. Its value lies in disciplined scope: a compact, evidence-led insurance investigation that makes learners reason about coverage, warranties, causality, attribution, and governance.

The scenario already succeeds on those terms.

The remaining work is now mainly polish-track rather than design-correction work:
- placeholder art replacement when desired;
- end-to-end manual QA;
- any final wording refinements discovered during playtest.

With those refinements, `sis03_cyber_insurance` should stand as a strong final case study that complements the first two scenarios rather than trying to imitate their scale.