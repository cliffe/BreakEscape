# P0-T comparison run brief

Read docs/agents/SE_BUILD_BRIEF.md first. You are packet P0-T of the social-engineering build: a comparison
browser run for one mission on the new Phase 0 engine (commit 91c1ee03), against its baseline report in
planning_notes/phishing_and_social_engineering/build_log/baselines/browser/. Read the matching baseline
fully first and replay the same steps, choices, maxTurns and reload point. Use the playtest-scenario skill
(.claude/skills/playtest-scenario/), keyless :3001 only, headless if the machine is loaded. The popup and
console hook used by the m02 baseline is build_log/baselines/browser/popup-console-hook.js; use it.

Compare every observation the baseline recorded: popups (text and counts), global and ink values,
hostile state, event chains, phone threads, reload survival, console errors (beyond the known keyless
TTS 503/400s and the known 404s). Mark each line SAME, DIFFERENT (with evidence) or NOT REACHED. Anything
DIFFERENT that is not an expected change named in your prompt is a regression: describe it precisely,
with file:line guesses if you can, but do not edit any file.

Write the report to planning_notes/phishing_and_social_engineering/build_log/p0t/<mission>.md with the
game id, verify-run.rb output and earned-secrets table. Do not commit; kill your browser by PID at the
end. Reply with counts of SAME / DIFFERENT / NOT REACHED and each DIFFERENT line.
