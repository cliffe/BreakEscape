# SIS Configuration Threshold Review (2026-04-12)

## Scope

Review current SIS configuration threshold implementation against planning sources under `planning_notes/sis_scenarios`.

## Planning Sources Reviewed

- `planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md`
- `planning_notes/sis_scenarios/case_2_energy_game_design/development_tasks.csv`
- Supplemental implementation alignment notes:
  - `planning_notes/sis-configuration-threshold/sis_configuration_threshold_implementation_plan.md`

## Implementation Files Reviewed

- `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js`
- `public/break_escape/css/sis-config-threshold-minigame.css`
- `public/break_escape/js/minigames/index.js`
- `public/break_escape/js/systems/interactions.js`
- `scenarios/sis02_energy/scenario.json.erb`

## Executive Summary

Implementation is mostly in place and wired end-to-end (scene registration, object routing, UI, row-detail modal, compare overlay, and confirm flow). The prior certification-document bypass has been removed, and the progression now follows an explicit two-step model: review certification evidence, then confirm tamper.

## Matches

1. Minigame implemented as HTML/CSS interactive panel (planned MG-03/MG-02 equivalent).
   - Evidence: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js`
   - Evidence: `public/break_escape/css/sis-config-threshold-minigame.css`
   - Planning: `planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md:87-99`

2. Panel interaction is wired from `sis_config_panel` object and launches the SIS minigame.
   - Evidence: `public/break_escape/js/systems/interactions.js:969-975`
   - Evidence: `public/break_escape/js/minigames/index.js:137,155`
   - Planning: `planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md:90`

3. Scenario object carries minigame data contract (title, rows, compareTitle, confirmLabel).
   - Evidence: `scenarios/sis02_energy/scenario.json.erb:1021-1029`
   - Planning: `planning_notes/sis-configuration-threshold/sis_configuration_threshold_implementation_plan.md:146-166`

4. Row-level detail expansion for non-GREEN rows is implemented.
   - Evidence: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:68-85,112-119,152-170`
   - Planning: `planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md:102`

5. Compare overlay exists and is disabled when certification evidence is missing.
   - Evidence: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:65,99,124-128,171-201`
   - Planning: `planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md:103,116`

6. Confirm action exists and sets `sis_tamper_confirmed = true`.
   - Evidence: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:229-231`
   - Planning: `planning_notes/sis_scenarios/case_2_energy_game_design/minigame_planning.md:104`

7. `sis_config_seen` is set when panel opens; objective task completion wiring is present.
   - Evidence: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:56`
   - Evidence: `scenarios/sis02_energy/scenario.json.erb:517-521`
   - Planning: `planning_notes/sis-configuration-threshold/sis_configuration_threshold_implementation_plan.md:88,93,177-179`

## Mismatches

No active functional mismatches identified for the implemented SIS minigame flow after the latest changes.

### Resolved During Review

1. Certification document read no longer bypasses tamper confirmation.
   - Current behavior: cert document now sets `sis_certification_seen`, not `sis_tamper_confirmed`.
   - Evidence: `scenarios/sis02_energy/scenario.json.erb:93,526,1098`
   - Confirm remains explicit in minigame action: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:234`

2. Comparison gate now supports global-variable gating via `sis_certification_seen`.
   - Evidence: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:139`
   - Compare gating now uses the global-variable check directly.

3. `en002_claim_assessed` is intentionally mapped from confirmed tamper (`sis_tamper_confirmed`) via scenario event wiring.
   - Evidence: `scenarios/sis02_energy/scenario.json.erb:533-536`
   - Decision: accepted implementation approach.

## Accepted Design Deviation

1. Main table intentionally omits a visible "certified baseline" column so the certification document and compare action retain investigative value.
   - Current behavior: certified values are shown in compare overlay, not in the default table.
   - Evidence (current columns): `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:89-91`
   - Evidence (certified values in compare overlay): `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:181`
   - Status: accepted by design decision; no change required unless design intent changes.

## Recommended Next Changes (Priority Order)

1. Run end-to-end in-game validation of the intended sequence.
   - Sequence to verify: `sis_config_seen` (panel read) -> `sis_certification_seen` (cert doc read) -> compare enabled -> `sis_tamper_confirmed` (confirm action) -> `en002_claim_assessed` event mapping.
   - Evidence wiring: `scenarios/sis02_energy/scenario.json.erb:519,526,533-536`; `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:56,138,234`.

## Follow-up Q&A Verification (2026-04-12)

1. Is the cert-doc bypass still in place?
   - No. Cert doc read now sets `sis_certification_seen` and no longer sets `sis_tamper_confirmed`: `scenarios/sis02_energy/scenario.json.erb:1098`.

2. Why not show certified values in the base table?
   - Accepted design rationale: keeping certified values in compare mode preserves the purpose of retrieving the certification document.

3. Does `en002_claim_assessed` get set at all?
   - Yes, indirectly. Event mapping on `global_variable_changed:sis_tamper_confirmed` sets `en002_claim_assessed = true`: `scenarios/sis02_energy/scenario.json.erb:533-536`.
   - It is not set directly in `applyConfirm()`: `public/break_escape/js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:234`.

4. Is there a `sis_certification_seen` or `sis_cert_reviewed` global set on cert-doc view?
   - Yes. `sis_certification_seen` now exists in scenario globals and is set on cert-doc read.
   - Evidence: `scenarios/sis02_energy/scenario.json.erb:93,1098`.

## Current Assessment

- Functional readiness: Good
- Design/spec conformance: Good
- Progression integrity risk: Low (pending final in-game validation)

## Validation Status

- End-to-end playthrough verification: Pending user run
