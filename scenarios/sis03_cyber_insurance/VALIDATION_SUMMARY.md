# Cyber Insurance Scenario Validation Summary

**Status**: PASSING (Validated 2026-04-26)

## Validation Results

- Schema validation passed
- ERB rendering successful
- JSON structure valid
- No unknown fields
- All ink files compile and validate
- Objective task wiring confirmed for all 15 tasks
- No missing recommended fields
- Dungeon graph generated successfully
- One expected AND-gate warning remains: `policy_binder` and `fdp_terminal` both unlock `meridian_evidence_archive`. This is intentional and represented with `puzzle_graph_and_with` metadata.

## Graph Summary

```
Puzzle     — Nodes: 27  Edges: 28
Story      — Nodes: 7   Edges: 5
Integrated — Nodes: 34  Edges: 44
Rooms      — Nodes: 2   Edges: 1
Critical path (5 hops): Open the Albion Claim → Confirm Coverage and Trace the Forensic Chain → Access the Evidence Archive → Assess Warranty Compliance → Review and Make Coverage Recommendation → Closing Debrief — Insurance as Safety Governance
```

## Scenario Structure

**Rooms**
- `meridian_claims_suite` — main claims assessment room and NPC/dialogue hub
- `meridian_evidence_archive` — PIN-locked secure evidence and underwriting room

**Objects**
- `policy_binder` — policy wording, warranty schedule, act-of-war exclusion, cooperation clause
- `claim_file` — Whitworth incident notification and £8.2M initial quantum
- `osei_report_envelope` — independent loss-adjustment report and proportional-coverage reasoning
- `coverage_decision_form` — final four-part recommendation form
- `warranty_checklist` — standalone warranty assessment minigame
- `fdp_terminal` — forensic causal-chain review minigame
- `evidence_packet_a` — IT forensics summary
- `evidence_packet_b` — OT/ICS forensics summary and evidence-loss tension
- `evidence_packet_c` — warranty compliance evidence summary
- `ncsc_brief_envelope` — attribution brief and disclosure recommendation
- `underwriting_cabinet` / `underwriting_file` — renewal memo and prior-knowledge evidence
- `cms_terminal` — claims-management-system review surface containing cabinet reference information

**NPCs**
- `eleanor_vance` — main person NPC with opening timedConversation, warranty/decision/debrief dialogue, and `puzzle_graph_actions` bridging the core story beats
- `james_whitworth` — phone NPC for policyholder/risk-manager perspective
- `simon_hartley` — phone NPC for loss-adjuster perspective
- `robert_ngata` — phone NPC for NCSC / cross-sector exposure perspective

**Objectives**
1. `initial_briefing`
2. `investigate_claim`
3. `access_evidence_archive`
4. `assess_warranties`
5. `make_recommendation`
6. `trent_water_assessment` (optional)
7. `closing_debrief`

## Task Completion Wiring

All 15 tasks have in-world completion triggers.

| Task | Trigger |
|------|---------|
| `talk_to_eleanor_initial` | `#complete_task` in `npc_eleanor_vance.ink` |
| `read_policy_binder` | `policy_reviewed = true` → Eleanor eventMapping |
| `read_claim_file` | `claim_file_reviewed = true` → Eleanor eventMapping |
| `submit_forensic_flag` | `forensic_chain_verified = true` → Eleanor eventMapping |
| `enter_archive` | Room entry auto-complete |
| `read_packet_a` | `it_forensics_reviewed = true` → Eleanor eventMapping |
| `read_packet_b` | `ot_forensics_reviewed = true` → Eleanor eventMapping |
| `read_packet_c` | `warranty_evidence_reviewed = true` → Eleanor eventMapping |
| `talk_to_eleanor_warranties` | `#complete_task` in `npc_eleanor_vance.ink` |
| `read_osei_report` | `loss_quantum_reviewed = true` → Eleanor eventMapping |
| `read_ncsc_brief` | `attribution_brief_reviewed = true` → Eleanor eventMapping |
| `read_underwriting_file` | `underwriting_file_reviewed = true` → Eleanor eventMapping |
| `talk_to_eleanor_decision` | `#complete_task` in `npc_eleanor_vance.ink` |
| `assess_trent_water` | `#complete_task` in `npc_robert_ngata.ink` |
| `talk_to_eleanor_debrief` | `#complete_task` in `npc_eleanor_vance.ink` |

## Aim Unlock Chain

| Aim | Unlocks when |
|-----|-------------|
| `initial_briefing` | Always active |
| `investigate_claim` | `aimCompleted: initial_briefing` |
| `access_evidence_archive` | `policy_reviewed = true` AND `forensic_chain_verified = true` |
| `assess_warranties` | `warranty_evidence_reviewed = true` |
| `make_recommendation` | Warranty discussion/checklist complete |
| `trent_water_assessment` | `attribution_brief_reviewed = true` |
| `closing_debrief` | `coverage_decision_made = true` |

## Claim-Level Learning Wiring

The scenario now surfaces the insurance-claim teaching structure more explicitly:

- `ins001_assessed` and `ins003_assessed` are set by the warranty checklist minigame
- `ins008_assessed` is set when the NCSC brief is reviewed
- `ins009_assessed` is set when the underwriting file is reviewed
- the end credits now include an SIS claim synthesis section
- Eleanor's debrief explicitly names the major Security-Informed Safety claim themes
- the coverage decision form now includes an evidence-to-decision brief mapping each section to previously reviewed artefacts

## Win Condition

- the coverage decision form writes `coverage_decision`, `war_exclusion_invoked`, `disclosure_position`, `trent_water_in_scope`, and `coverage_decision_made`
- Eleanor's eventMapping on `coverage_decision_made` unlocks the closing debrief and switches her into debrief mode
- `npc_eleanor_vance.ink` sets `debrief_complete = true` at scenario end
- the music system responds to `debrief_complete` and displays the credits / outcome summary

## Remaining Non-Blocking Notes

### Generic validator suggestions that are intentionally not adopted here
- VM launcher / flag-station patterns
- more lock-type variety
- hostile NPCs / patrol systems
- additional physical-danger mechanics

These are appropriate omissions because `sis03_cyber_insurance` is intentionally smaller and more evidence-/dialogue-driven than Cases 1 and 2.

### Placeholder assets still in use
- Eleanor sprite remains on placeholder art
- claims suite and archive rooms remain on placeholder room sets
- some object art remains placeholder

This is presentation work only and does not affect scenario logic.

### Testing status
- Validator pass confirmed
- Scenario has not been fully manually playtested end-to-end in this validation pass
