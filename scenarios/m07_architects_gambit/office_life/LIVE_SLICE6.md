# Slice 6: ops floor cooler corner lighting (L7)

Verdict: pass, no change. Both operators read clearly against the amber video wall mood at the cooler and at post. No emitter was added to `ops_cooler`; scenario.json.erb is untouched (so no validator or lock/key rerun was needed).

## Method
Keyless server from this worktree on :3098 (stopped by PID, port closed). Headless, setFPS(20), fixed steps on. Fresh game per run, player parked at (520,248) clear of the lanes, popups dismissed with `__test.dismissBlockingUi()`, HUD overlays hidden by CSS for the screenshot only, camera zoom 2 centred on the corner. Probe: `tools/playtest/m07-ol-light.mjs <gid> 3098 <cooler|post> <png>` (env Z, CX, CY set the camera).

## Renders
- `renders/ops-cooler-both-using.png`: game 8162. Natural trip, both `using` 90 s after entry (Adaeze first, Gwen about 4 s later). Adaeze at (400,212) drinking, Gwen at (434,210) turned at the cooler. Both faces, hair and clothes are distinct from the desks and floor; the coffee station and cooler jug are visible; the evacuation blue-amber mood is intact. Earlier unlit-HUD shots of the same moment on game 8119 looked the same.
- `renders/ops-both-seated-post.png`: game 8142. Both seated at posts 1 and 2 (world 383,134 and 446,134), faces and lanyards readable under the monitor glow.

## Notes
- The cooler is the jug-and-coffee-station corner at the south-west of the floor, at (380,253). The pair stand north of it (useFrom dy -1) beside desks 4 and 5, not on the key or the PIN sheet desk; both are clear of the empty chair at the west end of desk 4.
- Games used (do not reuse): 8119, 8128, 8131, 8135, 8138, 8139, 8142, 8145, 8151, 8159, 8162. Several early runs were framing and popup fixes in the probe; 8119 and 8162 are the natural-trip renders.
