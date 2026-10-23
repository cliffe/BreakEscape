# P6-W: wire the engagement report and the board scope and plan modes

Done 2026-10-21. Not committed.

## Blocks added (shared files, own block only)

- `public/break_escape/js/minigames/index.js`: export, import and `registerScene('engagement-report', EngagementReportMinigame)` after the landing-page builder lines.
- `public/break_escape/js/systems/minigame-starters.js`: `startEngagementReport(sprite, options)` and `window.startEngagementReport`, after the page-builder starter. It passes only `socialOverlayParams({ title, returnTo, onComplete })`; the report reads the case records itself.
- `public/break_escape/js/systems/interactions.js`: `report-workstation` branch before the command-board branch.
- `app/views/break_escape/games/show.html.erb`: link to `engagement-report-minigame.css` after the landing-page builder link.
- `public/break_escape/js/core/game.js` `preload()`: `report-workstation` image line. The placeholder `assets/objects/report-workstation.png` (1050 bytes) was already there and was not touched.
- `scripts/minigame-data-schemas.json`: `case-file` gains `"modes": ["recon", "defender", "scope", "plan"]`; new `report-workstation` entry with no fields. The schema format has no enum, and the validator only reads `required` and `optional`, so `modes` is documentation. The case-file `mode` field is a free string at runtime and `starter` already passes `data.mode` through, so no starter change was needed for `scope` and `plan`.

## Gates

- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --strict-social --no-graph --skip-ink`: exit 0 (suggestions and two missing-avatar notes only).
- `bundle exec node --test --test-concurrency=1 test/js/*.test.mjs`: 1499 tests, 1499 pass, 0 fail.
- Browser: keyless :3001, `db/seeds.rb` re-run, fresh game 3010 (`lab_social_engineering`, headless, Node 24 from `ms-playwright-go/1.57.0`). The opening Ruth chat was closed through `MinigameFramework.endMinigame`, then `interact` on `report_workstation` opened `EngagementReportMinigame` (`waitFor minigame:engagement-report` ok, `getTestState().report` returns the two steps and the page line). Opening only; exercised, not earned.
- Screenshot: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P6-W/report.png`

## Found, not fixed

- In the lab scenario (`scenarios/lab_social_engineering/scenario.json.erb`, `social.engagement.report.findings`, about line 1108 on) the `rootCauses` and `controls` options carry `id`, `correct`, `why` but no `text`, so the report's option buttons are blank in the screenshot. P6-E data: each option needs a `text`.
- The playtest session script writes its log to `tools/playtest/session-<timestamp>.jsonl` when `--log` is not given; I deleted my two.
- The board `scope` and `plan` modes were not opened in a browser here (the packet gate is the report only).
