# Behind-the-wall fade: handover (2026-11-08)

Slices 1 and 2 are done and committed. Slices 3 and 4 are not started. Resume from DESIGN.md section 13, slice 3.

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
