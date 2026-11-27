# ca15 r6 takes handover (27 Nov, stopped on CA0's hold)

Done: nothing recorded, no take script written. Read the video-takes skill, r5 script sections 5 and 6, t11/t06/t09b/t03c/ca17 t06 models.
Environment: :3456 keyless server and display :147 were started by me and are now stopped. Port 3001 was already listening (not mine, untouched).
Findings so far: the kiosk opens on the Brief panel (strip 1 Brief to 5 Debrief, button "Start", close X). Bezel 760x660 at (580,210), screen 590,272 740x588, .epr-panel 736x512 at (592,322). Heights are not yet measured per the spec (t17 must record the Brief panel height, frame included, against the 540 px rule).
Dry-run harness: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca15r6/dry/run.sh <take.mjs> [new-game flags] (copy of the ca15caps one; needs :3456 up via env -u GEMINI_API_KEY tools/playtest/start-keyless-server.sh 3456). Probe p1.mjs is in the same folder.
Next, in order: t17_brief, t16_shortcuts, t06b_inbox_list, t09c_nilesh_tell_it, t19_kettle_hook, t11b_drop (t19 and t11b are the hard ones: stop and report if their spec asserts cannot be met). Run with BE_DISPLAY=147 BE_PORT=3456 FOOTAGE_ROOT=/home/cliffe/video-takes-local BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca15_shadow_it <id> "" "--hide-hud --zoom-step 1".
