# Behind-the-wall fade: handover (2026-11-08)

Slices 1-4 are implemented and committed (slices 3-4 added 2026-11-08, see the end of this file). Suites after slice 4: bin/test-js 423 files pass; bin/rails test 953 runs, 0 failures; reopencheck prints Total problems: 4 (same as before, ink dialogue, untouched).

## Commits
- 7b70feb85 design plan and review rounds
- 72adb6a2b slice 1: detection (behind-wall-fade.js, door-gaps.js, test/js/behind-wall-fade.test.mjs)
- 9e09a2768 slice 2: controller, tile and sprite fade, engine hooks (game.js, rooms.js, npc-needs.js, seating.js, tests)
- 650cd35b7 seating test: overlay stub gains setAlpha (follow-up fix)
- 197fe9f11 test scenario scenarios/test_behind_wall_fade
- d08e4c813 slice 2 live proof scripts and screenshots (planning_notes/behind_wall_fade/proof/)

## State
- bin/test-js: 422 files pass. bin/rails test: 953 runs, 0 failures. reopencheck prints "Total problems: 4" (ink dialogue; nothing in this work touches ink, not investigated).
- Live proof (slice 2) passes: steps 2, 4-6, 8, 9, 11 and 12 (kill switch), plus m01 reception_area and m04 engineering_workshop walks. Scripts: proof/s2_live.mjs (`... s2_live.mjs <gid>` and `<gid> off`), proof/s2_missions.mjs, proof/s2_step2.mjs, proof/lib.mjs. Run with `~/.cache/ms-playwright-go/1.57.0/node` from the repo root.
- Test game: swap with `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_seating test_behind_wall_fade --unlock-all` (prints GAME_ID; the last one was 1133).
- Server :3001 was already running; nothing else was started.

## Deviations from the plan
1. Headless physics fix: the plan's `world.fixedStep = false` lets the player tunnel through the 8 px wall boxes (verified: with it the player walked straight through the hall's top wall; without it the wall stops them at feet y 56 or body top 64). proof/lib.mjs uses `g.loop.smoothStep = false; g.loop.minFps = 1; world.setFPS(20)` instead (headless runs about 20 fps), which keeps collisions and real-time speed.
2. The swap script needs `--unlock-all` or `loadRoom` gets 403 for the other rooms (the plan's "all rooms unlocked" is not enough server side).
3. Popups: the game opens a title screen and a Mission Brief notes minigame; lib.mjs closes them with Enter, Escape and dismissBlockingUi before the fix is used.
4. Step 6 uses x = 96, not 160: a prop in the hall blocks walking down at x 128-250 (player stops at y about 215). x = 96, 280 and 300 reach the wall (feet y 312).
5. Step 9 walk lasts 4.5 s (2.5 s was occasionally too short at 20 fps).
6. m01 and m04 walks used `unlock-all-rooms.rb` on throwaway games; for m04 the player was placed in battery_hall_1 with `player.setPosition` (the route there is locked), not walked in. m04 needed dx = 60 from the workshop's left edge (other x are blocked by racks).
7. The module caches nothing about strips (section 2 says cache rebuilt on room count change); `roomsBehindWallAt` recomputes rects each frame from `room.position` and `map.widthInPixels`, which is a few arithmetic operations per loaded room. Add the cache only if profiling asks for it.
8. `_forceK(id, k)` is exported on the controller for the NaN test; it is not on `window.behindWallFade`.
9. When k goes non-finite the state is dropped and released (restored) rather than snapped to 1 in place; if the player is still behind the wall a fresh state starts at k = 1.

## Known visible issue for slice 4
In m04 the workshop strip (dark room, nothing in it) is almost black while faded, so the player is hard to see. That is exactly what the strip light blend (slice 4) fixes; re-take proof/s2_m04_engineering_workshop with lighting on after slice 4 (the script already takes `tag` as its third argument).

## Next
- Slice 3: four `* (obj.behindWallK ?? 1)` multipliers in systems/lighting.js (LED :1110, glow :1153 outside Math.min, flame :1172 outside Math.min, lock flash :1484), tests in test/js/lighting-emitter-leds.test.mjs and lighting-workstation-indicators.test.mjs, live glow/LED ratio checks (steps 6 and 7 glow parts). Commit before running tests.
- Slice 4: the probe first (no engine edit), then the strip blend in lighting.js and test/js/lighting-strip-blend.test.mjs; then slice 4 live steps 3, 4 (lighting), 7, 8, 9, 10, 12, 13 and the m04 walk with lighting on; reopencheck and `bin/rails test` after.

## Slices 3 and 4 (2026-11-08)

Commits: 9c6d0a014 (slice 3 multipliers and tests), 105a12a8e (slice 3 live proof), 78a6e897f (slice 4 blend, test, probe), b0164ec93 (emitter test rig and live script), then the slice 4 proof commit (screenshots s4_*, s4_state.json).

Probe (proof/s4_probe.mjs, readings in proof/s4_probe_result.json): PASS with no frame offset. The crop is not upside down: red at row 11 and blue at row 16 land on the same rows; a NORMAL stamp at alpha 0.5 onto white gave (255,128,128) and (128,128,255); onto grey 0x404040 gave (159,32,32) and (32,32,159); points outside the stamp were unchanged. One trap found: a batch that ends on ADD copies back as ADD, so the second batch must end on a NORMAL stamp (the code says so in a comment).

Slice 3: four multipliers in lighting.js. Tests are in lighting-emitter-leds.test.mjs (a new `updateRig` that runs `update()` over one emitter object: LED, glow, clamped glow exactly 0.5, flame) and lighting-workstation-indicators.test.mjs (lock flash). Live: pc glow ratio 0.5000, rack glow 0.5000, rack LED 0.475 = 0.5 * 0.95 (proof/s3_live.mjs).

Slice 4: `stripBlendSegments`, `STRIP_TEX`, `STAMP_OPT_KEYS`, `drawTarget`, `teeFor`, `getStripTexture`, `drawStripBlend`, `stripBlendDebug`, `destroy` removal. Any test rig that builds a LightingSystem with `Object.create` and calls `update()` needs `stripCmds`, `stripCmdCount`, `stripNorth`, `stripSegments` and `stripDebug` set (the constructor sets them); `lighting-emitter-leds.test.mjs`'s rig does.

Deviations in slices 3-4:
1. The glTexture handle swap is done by reading `strip.getWebGLTexture()` before every crop stamp (as planned). Proven only against the fake in the unit test plus the live resize check (step 10), not against a Phaser internals read.
2. Step 7's final move into the server uses `player.setPosition` (feet on the server floor): with the hall/server door open the player stops at feet y 320 and never crosses, with `?behindWallFade=off` too, so it is not the fade. Cause not investigated (the server room has no door sprite of its own). Same for `enterRoom('hall')` from the server; s4_live.mjs has a `goRoom` helper that falls back to `setPosition`.
3. Camera: after a teleport the camera can lag, so s4_live.mjs calls `cameras.main.centerOn(player)` and waits 400 ms before the 4, 8, 9 and 10 readings, and `lightAt` throws if a point is outside the light map.
4. Step 10: no x in 100-310 had a positive margin from every emitter (best -8.4 at x = 310), so the farthest was used. The read was identical before and after the resize anyway.
5. proof/lib.mjs gained an optional `reducedMotion` argument (media emulation, step 13). proof/s2_missions.mjs got a longer x list for m04 (the player stops short of the wall at some x, and which x works varied between runs).

Unverified:
- The spill replay through the strip (step 4's "no edge at the strip top") was not exercised: after `enterRoom('office_n')` there is no hall/office_n door sprite and no spill pool at (48,-6), so the two reads are both the dark ambient. The unit test covers recording and replaying spill commands only.
- Step 7 screenshot 1 is `s4_7_1_unfaded.png`; screenshots 2 and 3 are `s4_7_2_faded.png` and `s4_7_3_in_server.png`; step 12's is `s4_12_killswitch.png` (same spot as 7_2).
- m04 screenshot: the strip is lit with battery_hall_1's light, but the player at dx 60 stands behind a solid blue locker prop (not faded: its base is below the strip), so only the head shows. The lighting is right, the shot is not a good picture of the player.

## Slice 5: opaque cap band (2026-11-08)

Commit f8545bffb (module, unit tests, tools/survey_wall_cap.py) plus the proof commit. DESIGN.md section 5 describes it. Survey: the cap is 12 px on all 1075 bottom-row frames (148 maps, 107 tilesets), so `WALL_CAP_PX = 12` is a constant. bin/test-js 423 files pass. Live proof on :3001 (proof/s5_live.mjs before/after, s5_cleanup.mjs): s5_test_*.png and s5_m01_*.png; the white stripe is gone, the wall above stays at 0.5, the player still shows; caps 0 idle, 9 faded, 0 after release and after the kill switch. What remains at the bottom of the strip is S's own wall-face colour at full opacity, lighter than the faded wall above it. The player's feet are covered by the band while behind the wall (the player draws under the layers there).
