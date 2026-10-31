# P6-G: lab-level lints and scope/plan step and pick checks

Done 2026-10-21. Not committed.

## What landed

- `scripts/validate_social/board.rb`: `engagement_step_checks` for `social.engagement.scope`, `plan` and `report` (03 N6).
  - An item's `step` must be declared in its block's `steps[]`; with steps declared, an item with no step is an error; with none declared, a named step is an error.
  - A declared step with no items is an error. A `confirm` item counts and needs a `text`.
  - Each `question` card and each `plan` pick list (`objectives`, `measures`, `picks[].options`) has exactly one `correct: true` option. A pick list that names two steps is an error. A sort card needs a boolean `inScope`.
  - Report `findings[]` and `items[]` take part in step binding.
- `scripts/validate_social/lab.rb` (was a stub), 10 N7:
  - Any object under scope, plan or report with a boolean `correct` or `good` needs a non-blank `why` (defender options keep their own check in `board.rb`).
  - Block and step `onCompleteGlobal` values must exist and be declared (not imported).
  - Every `global_variable_changed:<name>` event mapping names a declared global, and each `completeTask` names a real `taskId` in `objectives`.
- `test/js/validator-social-lab.test.mjs`: 13 tests on inline scenarios.
- `scripts/ink_runtime_check/missions.json`: added a `lab_social_engineering` block (globals and 5 NPCs with a storyPath, rendered from the scenario). Only that block was added (111 lines, nothing else changed).

All checks run only when the scenario has a `social` key, so shipped scenarios (none of which has one) take the same path as before.

## Results

- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --strict-social --no-graph --skip-ink`: exit 0, no `SOCIAL` issues.
- Same for `scenarios/test_social_slice`: exit 0, no `SOCIAL` issues.
- Same flags on m01_first_contact, m05_insider_trading, lab_tesseract_trials: exit 0.
- `bundle exec node --test test/js/validator-*.test.mjs`: 122 pass, 0 fail (13 new).
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json lab_social_engineering`: ruth_phone 1800 reopens, dev_service_desk 308 reopens, total problems 0.

## Notes

- The lab's own scope, plan and report blocks pass the new checks unchanged; no scenario edit was needed.
- Report `rootCauses` and `controls` get the `why` check but no one-correct count; 03 N6 does not ask for one there.
- Not covered: Ruth's ink `#complete_task` tags are not checked against `objectives` (ink check, not a data lint).
