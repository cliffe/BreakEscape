# m03 office life R2 fix: handover

Worktree .claude/worktrees/p-ol-m03-build, branch build/ol-m03. Scratch: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/r2fix (lib.mjs set to port 3091 and this worktree; p1.mjs coffee/cooler/reload/exchanges, p2.mjs punch + threat music + hostile hidden at turn + HaX attacked text, p3.mjs send-home positions + screenshot + "company" text, arg2 'neg' for the both-KO negative; calib*.mjs). Each live run needs a fresh new-game.rb game after any scenario edit. Server 3091 stopped (PID 1334453), node_modules symlink removed (recreate: ln -s <main checkout>/node_modules node_modules).

## Done and committed
- aad9dd0b0, 552e38571 (scenario.json.erb), main merged (01d172150, TTS clips only). Static checks passed at 552e38571: ink compile, validate_scenario 0 errors (14 warnings, all as before), validate_office_life, door alignment, lock_key_diff empty, dialoguelint no new findings.
- Fix log started in M03_SLICES3_5_REVIEW_R2.md.

## Left to do
1. Run p3.mjs <new game> (send-home feet within 3 px, screenshot ./sendhome-6.png in the scratch dir, "company" text) and p3.mjs <new game> neg; p2.mjs <new game> (HaX attacked text, music threat then not threat); rerun p1.mjs <new game> for clean A1/B1 PASS (script bug fixed, wait lengthened). Record game ids and PASS/FAIL in the review fix log.
2. Run suites on the final tip, one after the other: bin/test-js (timeout 600000), then env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bin/rails test.
3. Commit review log and this note; merge main if it moved.

Gotchas: send-home "20 px" was a seated-sprite offset, not a wrong target (see log). Games made this run: 6606 (calibration), 6610 (p1). tools/playtest/*-flags-game66*.xml are untracked; leave them.
