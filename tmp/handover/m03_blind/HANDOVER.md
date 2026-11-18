# m03 blind findings: handover

Worktree .claude/worktrees/p-m03-blind, branch fix/m03-blind-findings. Fixes commit f3f67b51c; proof scripts committed after it.

Done (code + unit tests + live proof on :3109, game 8305):
- m4/m7: CyberChef decodeWatch (utils/crypto-workstation.js) sets whiteboard_decoded / roster_decoded when the output shows the plaintext; scenario mappings tick decode_whiteboard / decode_client_roster on those. Live: opening only = still active; wrong recipe = active; From Hex = completed.
- m5: vm-launcher flagNote param (scenario "flagNote" on vm_launcher_zero_day), shown "in this room" under the VM steps. Live proven.
- m9: creditsOverlay added to m03 (ticker lines, operation GHOST IN THE MACHINE). "OPERTN" is the visualiser's shared label (m05 uses it); "GHOST IN THE WIRE" was the music track name in the ticker. Loaded scenario carries it; the visualiser render itself not screenshotted (its files are on fix/m03-victory-screen).
- m10: copy_staff_badge description now says stand close, arm's length, lean in by the lanyard. Engine "No keycards" hint left generic on purpose (rfid-no-keycards-hint test).
Open:
- m8: engine already warns (closing_debrief mapping has endingCheck:true; ink on_my_way has #ending_check). It lists only visible optional tasks. In the blind run copy_staff_badge stayed locked (unlocks only if the reader is tried BEFORE cloning), so nothing was listed. Script tools/playtest/m03-ending-warning-proof.mjs written, game 8319 created (conference_room_01, victoria_fate=arrested, danny task active) but NOT run. Run: start :3109 (BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle), SHOT_DIR=<scratch> node tools/playtest/m03-ending-warning-proof.mjs 8319 3109.
- Full JS suite (bin/test-js) and ink compile not run (no ink changed).

## Update (commit 1af9756e2)
m8/m10: copy_staff_badge now also unlocks on global_variable_changed:cloner_explained (sets staff_badge_task_shown; completion mapping keys on that global, since '||' conditions are unsupported). Live proof on :3109 with tools/playtest/m03-ending-warning-proof.mjs (OPEN_OPTIONAL=1): warning lists the task; Keep going returns; nothing open goes straight to debrief. m9: tools/playtest/m03-credits-overlay-proof.mjs shows OPERTN: GHOST IN THE MACHINE. Validator 0 errors/12 warnings (same as main). bin/test-js 765/765.

## Update (learning hints #3/#4)
#3: rfid-ui.js showProtocolInfo: first-crack screens (weak and custom MIFARE, no keys) show a one-line choice note ("Dictionary tries factory-default keys ... Darkside works on any card") in place of the security note, and the weak card now offers "Darkside Attack (~10 sec)" beside "Dictionary Attack (instant)". Test in rfid-door-screen.test.mjs. #4: whiteboard, Sterling's email and CyberChef laptop observations plus the training-lab runbook now say a letter shift has twenty-five keys / ROT13 Brute Force. No ink, no voiced lines. Proof: tools/playtest/m03-learning-hints-proof.mjs.
