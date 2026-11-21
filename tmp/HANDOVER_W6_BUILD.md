# W6 build handover (session ended at the context guard)

Worktree: .claude/worktrees/b-ca-w6-build. Branch feat/ca-w6-build. Sheet: p-ca-living-office worktree, planning_notes/security_awareness_course/living_office/WAVE6_BUILD.md (v6).

## Commits on feat/ca-w6-build (off main 95ce3137b)
- 3c2b234af episode-runner-minigame.js:30 header comment (Finish shows "Episode finished", kiosk X closes). Comment only.
- bf37a1242 step 1b: s1c ca07 kiosk text + its two string assertions (test "wave 6: ca07 kiosk text...").
- 7b7974767 Wave 5 Fc: rows 5/6 4500 -> 5500 in ca13/ca14/ca05/ca02 kit data, regenerated 4 shells, W5 map requestDelay 5500, request-pairing case reads w.requestDelay ?? 4500. Kit units 143 pass, proof5 exit 0, drift 0, validators 0 errors on the 4 shells.
Not yet done for Fc: live proof criteria in the sheet (request by 8 s) are for step 8; W6 map entries should carry requestDelay 5500 (not 4500) now that Fc has run; sheet s10 says 4500 default for W6, change to 5500.

## Step 0 probe: PARTIAL, no live check run
Scratch branch scratch/ca-w6-probe (commit 7f30c8dcd, off bf37a1242; NOT for merge). Built by /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/w6/probe_edit.py: copies the ca05/ca13/ca14 set pieces under new ids (ca10_paste_check, ca07_call_on_hold with Gwen rows 2/2b/13 walking to (3,3), ca18_reset_password with Delphine position/needsHome and walk (4.5,4.5)), sets rows to tier E, stepAway true, setPiece named. --kit regen changed only the 3 shells (others, twins "(unchanged)"). Validator 0 errors on all three.
Server on :3420 was started and then killed (pid file tmp/w6_3420.pid). No game created, no live probe yet. Remaining: new-game.sh for each shell, headless playwright (see tools/playtest/needs-arrival-proof.mjs for loader/throttle), then checks in sheet step 0 (seats: Darren/Graham (100,~187) chair x92, Lorna (101,184) chair x85 home (116,204); PC and moved item placement; Gwen/Anjali/Delphine stand within 32 px of target after writeGlobal kit_<ep>_out; Delphine vs Ama 39 px apart). Write results to WAVE6_BUILD_NOTES.md.
NOTE: the probe's moved items need the probe branch; switch with git switch scratch/ca-w6-probe, then back to feat/ca-w6-build.

## Findings against the sheet
- Step 0 says stepAway may stay false: with tier E and stepAway false the validator errors ("kit_<ep>_out not declared") on the colleague/bystander rows. The probe needs stepAway true.
- s1c: ca07_voice_ceo_defend and e7/defend.json still hold the old "It came from Ravinder's mobile..." sentence; twins are untouched per s14. Decide whether the twin should follow.
- Wave 5 sheet 4500 values live in kit data, not only tests (done in 7b7974767).

## Waiting on owner (Q1-Q4)
Not started: steps 1 (lines/dialog review), 2 (tests with empty W6 map is answer-independent and could be done next), 3 (ca10 is independent of Q1-Q3, needs Q4 only for voicing), 4 (ca07, Q1), 5 (ca18, Q2/Q3), 9 TTS (Q4).
Remaining for the end: bin/test-js once, merge main if moved (main was 95ce3137b at start; check).
