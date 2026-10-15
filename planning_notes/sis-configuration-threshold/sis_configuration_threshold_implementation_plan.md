# SIS Configuration Threshold Display (Scenario 2) Implementation Plan

Date: 2026-04-11
Owner: Break Escape engineering
Scope: Implement the Scenario 2 SIS configuration threshold minigame with minimal code changes and full narrative/state integration.

## 1. Source Alignment and Scope

This plan is aligned to:

- planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md
- planning_notes/sis_scenarios/case_2_energy_game_design/development_tasks.csv
- planning_notes/sis_scenarios/case_2_energy_game_design/case_2_energy_gdd.md
- planning_notes/sis_scenarios/case_2_energy_game_design/new_objects_planning.md
- planning_notes/sis_scenarios/case_2_energy_information_pack/requirements/claims.md
- scenarios/sis02_energy/scenario.json.erb
- scenarios/sis02_energy/mission.json
- scenarios/sis02_energy/ink/INK_DEVELOPMENT_SUMMARY.md

Note on path request:

- scenarios/sis02_healthcare does not exist in this repo.
- Scenario 2 implementation target is scenarios/sis02_energy.

## 2. Canonical Feature Definition

Feature name: SIS Configuration Threshold Display

Intended behavior:

- Interactive minigame opened from the Engineering Workshop SIS panel object.
- Shows a setpoint table: parameter, current value, certified baseline, deviation status, last-modified, modified-by.
- Deviation rows are highlighted and expandable for explanatory detail.
- Compare workflow is delivered in a stub-compatible way in phase 1 (no new globals), with stricter certification gating deferred to phase 2 if needed.
- Confirm action records tamper confirmation and advances narrative logic.

Core teaching moment:

- THERMAL_RUNAWAY_THRESHOLD changed from 55C certified baseline to 85C current value.

## 3. Known Naming Drift (Must Resolve Before Coding)

There is MG ID drift across docs:

- minigame_planning labels SIS display as MG-03.
- development_tasks labels SIS display as MG-02.

Implementation rule:

- Use feature/object identity, not MG number:
  - object id: sis_config_panel
  - behavior: SIS Configuration Threshold Display

There is variable naming drift across docs:

- sis_certification_seen
- sis_cert_reviewed
- current scenario uses sis_config_seen and sets sis_tamper_confirmed from document read.

Scenario 2 stub precedence rule (source of truth for implementation phase 1):

- Keep existing globals and placeholder flow already defined in scenarios/sis02_energy/scenario.json.erb.
- Do not introduce new global variable names in phase 1.
- Use current globals as implemented in scenario stub:
  - sis_config_seen
  - sis_tamper_confirmed
  - en002_claim_assessed

Variable governance rule (authoritative for implementation):

- planning_notes/sis_scenarios/case_2_energy_game_design defines intended gameplay concepts.
- scenarios/sis02_energy/scenario.json.erb defines authoritative current variable names for implementation.
- If a new global variable becomes necessary, request user approval before adding it.

Optional phase 2 cleanup:

- Add a dedicated certification-reviewed global only if needed after phase 1 is stable.

## 4. Dependency Map

Scenario objects:

- sis_config_panel (engineering workshop): launch point for minigame
- SIS certification document object (filing cabinet): enables compare workflow

Global variables read:

- sis_config_seen (existing open/read marker)
- sis_tamper_confirmed (existing progression marker; also for reopen idempotency)

Global variables written:

- sis_config_seen
- sis_tamper_confirmed
- en002_claim_assessed

Narrative and progression dependencies:

- Priya branch unlocks on sis_tamper_confirmed
- Dr Bashir debrief logic references sis_tamper_confirmed
- Alarm panel state logic references sis_tamper_confirmed (current or future engine behavior)
- Objectives/tasks tied to SIS investigation complete through existing event mappings and globals

Claims linkage:

- EN-002 is the primary claim teaching link for this minigame.

## 5. Minimal Technical Implementation Plan

### 5.1 Files to Add

1. public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js

- New minigame class extending MinigameScene.
- Render table UI in DOM/CSS (consistent with existing HTML/CSS minigame patterns).
- Read scenario params for table rows and labels.
- Emit state updates through existing global variable update pathway.

2. public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold.css (optional)

- Keep inline styles only if consistent with local minigame style patterns.
- Prefer scoped CSS class names if using style injection in JS.

### 5.2 Files to Update

1. public/break_escape/js/minigames/index.js

- Import/export/register scene name: sis-config-threshold.

2. public/break_escape/js/systems/interactions.js

- Add object type handler for sis_config_panel (or explicit id fallback).
- Start minigame via MinigameFramework.startMinigame with scenarioData payload.

3. scenarios/sis02_energy/scenario.json.erb

- Convert current readable placeholder for sis_config_panel into minigame-backed object config.
- Preserve existing stub globals and placeholder naming.
- Build minigame behavior from existing sis_config_panel stub content (same setpoints, same narrative text intent).
- Keep certification-document interaction compatible with current scenario flow in phase 1.
- Only adjust global writes when required to avoid bypassing the minigame, and keep objective/NPC behavior unchanged.

### 5.3 Data Contract (scenarioData)

Suggested shape:

- type: sis_config_panel
- title: SIS CONFIGURATION - BATTERY HALL SIS
- rows: []
  - parameter
  - currentValue
  - certifiedValue
  - status (GREEN/AMBER/RED)
  - lastModified
  - modifiedBy
  - detailText
- compare:
  - requiresGlobal: sis_tamper_confirmed (phase 1 fallback to existing globals only)
  - disabledHint
- actions:
  - confirmSets:
    - sis_tamper_confirmed: true
    - en002_claim_assessed: true
  - openSets:
    - sis_config_seen: true

## 6. UI/Visual Design Specification

Style direction:

- Industrial SIS panel UI, small-control-system feel, no rounded corners.
- Use strong table hierarchy and high-contrast status highlights.

Visual requirements:

- Header: SIS configuration title bar.
- Main: tabular setpoint grid with clear certified vs current columns.
- Deviation rows: amber/red emphasis with warning glyph.
- Expanded explanation panel/modal for clicked deviation row.
- Compare button:
  - phase 1: use existing stub-compatible behavior (no new certification-reviewed global)
  - phase 2 (optional): add strict certification-reviewed gating
- Confirm button:
  - explicit irreversible confirmation dialog
  - completion state shown before close

Animation/motion (minimal):

- subtle row highlight pulse for deviated row
- panel slide/fade for compare overlay
- no excessive animation

Accessibility/readability:

- ensure legible type size for desktop and wall-monitor use
- color is not the sole signal; include status text labels

## 7. Integration Behavior (End-to-End)

1. Player opens sis_config_panel.
2. Minigame opens and sets sis_config_seen=true.
3. Player inspects rows and can expand deviation details.
4. Compare feature follows phase 1 stub-compatible behavior (strict cert-review gating deferred unless a dedicated global is introduced later).
5. Player confirms tamper.
6. System sets sis_tamper_confirmed=true and en002_claim_assessed=true.
7. Existing event mappings/dialogue/objective logic progress without additional custom engine work.

Implementation note for phase 1:

- Since no dedicated certification-reviewed global currently exists in scenario stub, comparison gating must be implemented without adding new globals (or deferred while keeping the rest of the minigame fully functional).

## 8. Acceptance Criteria

Functional:

- Minigame launches from sis_config_panel interaction.
- Correct setpoint values are displayed, including 55C vs 85C thermal threshold mismatch.
- Compare workflow behaves consistently with phase 1 stub constraints and does not require new globals.
- Confirm action updates required globals once, idempotently.
- Existing scenario placeholder globals remain the authority for progression.

Narrative/system:

- Priya and Dr Bashir SIS branches unlock as expected after confirm.
- No regression to objective progression.
- Alarm panel/SIS status references remain coherent with sis_tamper_confirmed.

Quality/minimality:

- No new engine subsystem introduced.
- Changes limited to minigame registration, interaction routing, and scenario object/global wiring.

## 9. Implementation Order

1. Build minigame scene directly from current sis_config_panel placeholder values/content.
2. Register and wire interaction handler.
3. Update scenario object to launch minigame while preserving existing Scenario 2 globals.
4. Remove or narrow only the minimum placeholder bypass logic necessary.
5. Run targeted Scenario 2 SIS progression test (objectives + Priya/Dr Bashir branches).

## 10. Out of Scope for This Implementation

- New timer engines, alarm panel driver engines, or hardware GPIO behavior.
- Reworking unrelated MG IDs across all planning docs.
- Large UI framework introduction.

This keeps implementation minimal while fully delivering the SIS threshold discovery teaching objective for Scenario 2.
