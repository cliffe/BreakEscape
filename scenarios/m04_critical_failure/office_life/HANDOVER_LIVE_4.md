# Handover: live proof 4

Done: check 1 PASS, check 2a recorded (seated attack registers). Stuck: 2b (walking attack returns false after moveToNear, games 7903, 7908, 7916). Not run: 2c, 4. Not met: 3 (Joanne hostile but never KO'd after six punches, game 7923).
Open:
- 2b: find why `attack()` returns false after `moveToNear` on a walking newcomer. Direct `attack()` calls work on the same state.
- 3: find the KO threshold for a seated newcomer (six punches did not KO Joanne), then rerun KO-then-phone and check for any Joanne bark.
- 2c, 4: after 2b and 3 are solved.
Scripts: scratchpad lp4_*.mjs (lp4_lib, lp4_reach, lp4_ally, lp4_c1, lp4_c3, lp4_attack, lp4_gate*). Use lp3_ng.sh with no extra args only for a deliberate new game; give it the game id.
Stray: game 7885 (accidental no-argument run).
