# m06 Follow the Money: dialogue review, pass 5 cycle 3 (confirmation)

Reviewer: a fresh Opus agent, read-only apart from this file, 2026-10-13. Skill: `npc-dialog-review`. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M06_PASS_BRIEF.md`). Read beforehand: `AGENTS.md`, the skill, `DIALOGUE_REVIEW_P5_C2.md` and the log section "Phase 4 dialogue, cycle 2". I did not open the SecGen XML, the four listed field guides, or the exploit detail in `VM_INTEGRATION.md`.

What this tests: the ink as committed in 0356e009 (the ink folder has no uncommitted changes), and the erb's `minder_vouched` lines in the working tree. New finding ids continue from D6-67.

## Step 1: compile, routes, lint, reopencheck

- **Compile.** All nine files compiled with `bin/inklecate` into the scratchpad (`m06-dialogue-c3-review/json/`): no errors, no warnings. Each compiled file is byte-identical to the committed JSON.
- **Routes.** I ran a scratch copy of `route.js` with `DIR` pointed at the scratch compile (the driver hard-codes the repo's ink folder). **29 of 29 pass**, each ending `[result] all expectations met`, with no FAIL line anywhere. Every route asserts `maxRun` 9. The longest run is 9 (the debrief, on four routes). Satoshi peaks at 8 and the briefing at 8.
- **dialoguelint.** `Totals by rule: none`. Longest line: 30 words (an erb text). Longest ink line: 25 words (phone).
- **reopencheck** (all missions in `missions.json`): m06 HaX phone, 1800 reopens, 1366 re-runs, 0 problems. 0 walks replayed the opening. Every other mission is at 0 problems too.
- **Validator** (`--skip-ink --no-graph`): schema passed. The usual 20 duplicate-mapping notes on HaX, plus 14 issues and suggestions and 2 missing recommended fields, all as in cycle 2. No dialogue-facing errors.
- **`minder_vouched` wiring.** Declared in the erb `globalVariables` (:688) and in m06's block of `missions.json` (:913). `VAR`-declared in the minder, Satoshi and debrief inks. Set in `irina_vouches` (`minder:136-137`, after `minder_passed`), and read by the debrief (`:348`), Satoshi (`:76`) and both credits lines (erb `:212-213`). All three legs are present.

