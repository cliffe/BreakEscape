# Handover: ca18 takes (Cyber Aware), 26 Nov

## Done
- Dry runs (headed Chromium on Xvfb :147, keyless server :3456, no ffmpeg, scratch runner outside the repo):
  - t02b_attack_run_narrow: pass (game 13510, 44 marks, no page errors).
  - t05b_lorna_reset_narrow: pass (game 13511, 30 marks, POST /tts 200 audio/mpeg, bubble hidden).
  - t06_delphine_sofa: FAIL after 2 tries (games 13512, 13513). The take's return check is the open problem (below).
- Script fix (1 of 2 allowed): t06 return wait. settle() resolved on a 1 s pause partway back, so the take now waits until she is within 24 px of her post, then settles there.
- Results recorded in docs/video/takes_ca18.md under "Recorded marks".
- Stopped and cleaned up: env 147 down, keyless server on :3456 stopped (both started by this run).

## Open
1. **t06 return check (decision needed).** Her post (144,113) is the point she settles at when the take starts (she is on patrol there). After the rest trip she settles at (164,133) in both runs, 28 px from the post, so the 24 px check fails. Her scenario needsHome is tile (4.5,4.5), which is (144,144) in px, and that does not match either point. Options: (a) take POST from the first settle after the trip, or set it to (164,133); (b) widen the check to about 40 px and log the distance. Pick one, then re-run.
2. Not dry-run in this pass: t01, t03, t04, t04b, t05. The 23 Nov dry runs predate the current code and ran on :3452.
3. Nothing captured. `~/video-takes-local/ca18/takes` does not exist yet, and `video_out/ca18/takes` has no symlink.

## Next steps
- Fix t06 (Open 1), re-run: `bash <scratchpad>/dry_ca18.sh t06_delphine_sofa "--set kit_quiet=true"`. Start the server and display first (see below).
- Dry-run t01, t03, t04, t04b, t05 with the same runner (their seeds are in _ca18.mjs SEEDS).
- Create `~/video-takes-local/ca18/takes`, then the `video_out/ca18/takes` symlink (ca13 pattern).
- Capture one take at a time with `FOOTAGE_ROOT=/home/cliffe/video-takes-local BE_PORT=3456 BE_DISPLAY=147 BE_SPRITE=female_office_worker_v2 VIDEO_STATE_DIR=<scratchpad>/video-takes-ca18 tools/video/takes/run-take.sh ca18 <take> "<flags>" "--hide-hud --zoom-step 1"`. The FOOTAGE_ROOT path is inferred from the ca13 layout and has not been run yet, so check where the .mkv lands on the first take.

## Gotchas
- run-take.sh defaults to port 3001 and display 97. Set BE_PORT and BE_DISPLAY every time.
- Pass `--set` JSON through bash with `set -f`, because the brackets glob.
- camlib-style `settle()` returns after any 1 s pause, so do not use it for a return trip.
- env-up.sh calls `pactl set-default-sink` when pactl exists. On this machine pactl is absent, so it takes the PipeWire branch. Check before running it elsewhere.
- Start the server with `tools/playtest/start-keyless-server.sh 3456` and stop it by the PID in `test/dummy/tmp/pids/server-3456.pid`. Stop env 147 with `env-down.sh 147` and the same VIDEO_STATE_DIR.

## Files touched
- tools/video/takes/ca18/t06_delphine_sofa.mjs (committed)
- docs/video/takes_ca18.md (committed)
- tmp/handover/ca0/HANDOVER_capture_ca18.md (tmp/* is gitignored, force-added)
