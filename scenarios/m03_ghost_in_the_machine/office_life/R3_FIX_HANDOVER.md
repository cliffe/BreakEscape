# m03 office life R3 fix: handover

Worktree .claude/worktrees/p-ol-m03-build, branch build/ol-m03. Scratch: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/r3fix (p3b.mjs a|b|c send-home, p2c.mjs punch and night turn, p1.mjs coffee/cooler/reload; lib.mjs fixed shotWorld). Server 3091 stopped, node_modules symlink removed (recreate with ln -s <main checkout>/node_modules node_modules). Each live run needs a fresh new-game.rb game.

## Done
- Commits: review R3 added; 1bba40ead scenario fix (patrolOverride mappings removed, company text delay 6000); fix log in M03_SLICES3_5_REVIEW_R3.md.
- Live PASS: send-home a/b/c (games 6632, 6641, 6642), p2c (6653), p1 A1 A2 B1 C1 (6654).

## Left to do
1. Merge main (now 8661f473c, train 125) into build/ol-m03, no rebase, stop on conflict.
2. Static checks on the merged tip: lock_key_diff.rb against office_life/baseline_locks.json (expect empty), dialoguelint, ink compile (m03 only), validate_scenario, validate_office_life, door alignment.
3. Rerun p1.mjs on a fresh game for C2 and C3 (reload), server on 3091 only.
4. Suites one after the other on the final tip: bin/test-js (timeout 600000), then env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bin/rails test. LabPhysicalPentestSecretsTest "Chris's password" is a known flake: rerun that file alone if it is the only failure.
5. Append results to the fix log, commit, report the tip.

Untracked tools/playtest/*-flags-game*.xml: leave them.
