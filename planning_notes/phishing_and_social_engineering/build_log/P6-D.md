# P6-D: `lab_games` label and Tesseract docs (`10` N6)

Date: 2026-10-21. Not committed.

## Changes

| File:line | Old | New |
|---|---|---|
| `scenarios/lab_tesseract_trials/mission.json:6` | `"collection": "escape_room",` | `"collection": "lab_games",` |
| `scenarios/lab_tesseract_trials/DESIGN.md:879` (Q10 decision) | `**\`escape_room\`** (accepted)` | `**\`lab_games\`** (accepted; changed from \`escape_room\` by \`10\` N6)` |
| `scenarios/lab_tesseract_trials/SOLUTION_GUIDE.md:474` | `collection \`escape_room\`, difficulty 1` | `collection \`lab_games\`, difficulty 1` |
| `scenarios/lab_tesseract_trials/ALIGNMENT_PLAN.md:37` | `(collection \`escape_room\`, \`mission.json:6\`)` | `(collection \`lab_games\`, \`mission.json:6\`)` |
| `scenarios/lab_tesseract_trials/ALIGNMENT_PLAN.md:125` | `**Already isolated:** collection \`escape_room\`` | `**Already isolated:** collection \`lab_games\`` |

## Checks

- `mission.json` parses as JSON; `collection` reads `lab_games`.
- `git diff --stat -- scenarios/lab_tesseract_trials`: 4 files, 5 insertions, 5 deletions.
- Remaining `escape_room` references under `scenarios/lab_tesseract_trials/`: `DECISIONS_LOG.md:20` (dated log entry, left as history) and `DESIGN.md:879` (the Q10 options column, which lists the rejected-or-prior options).
- Not run: the missions index check (`app/views/break_escape/missions/index.html.erb`) and the Rails test. The label change is data only; `Mission.collections` picks it up on re-seed.

## Not done (needs the user)

- `db:seed` on deployed instances, so the stored label changes (`IMPLEMENTATION_PLAN.md` "Needs the user"). The dev database was not reseeded here.
