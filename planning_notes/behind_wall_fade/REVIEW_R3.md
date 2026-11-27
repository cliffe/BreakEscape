# Behind-the-wall fade: review round 3

Reviewer: fresh Opus agent, read-only, 2026-11-08. Scope: DESIGN.md only (earlier reviews not read), checked against the working tree and Phaser 3.60.0 source from `https://cdn.jsdelivr.net/npm/phaser@3.60.0/src/...`. Most of the effort went on §8.1.

Counts: blocker 0, major 3, minor 10.

Verdict: the §8.1 blend would work as written, apart from one resize bug. A smaller version does the same job and drops the full-redraw replay. The live proof can't run past step 2 as written, because three of its four rooms are never loaded.

## Major

### M1. Cropped frames keep a deleted WebGL texture after a resize

**Evidence.** `Frame` copies the texture handle once, when it is made: `this.glTexture = this.source.glTexture` (src/textures/Frame.js:79). `DynamicTexture.setSize` → `RenderTarget.resize` deletes the old texture and makes a new one (src/renderer/webgl/RenderTarget.js:221-247, `renderer.deleteTexture(this.texture)` at :232). setSize then updates only the base frame and the source (src/textures/DynamicTexture.js:243-254). The sprite batch reads the frame's own handle: `var texture = frame.glTexture` (src/renderer/webgl/pipelines/MultiPipeline.js:258). The game size follows the window (utils/constants.js:84-92, `game.scale.resize` at main.js:272). So `resizeLightMap` really does resize the light map, and the strip texture with it if §8.1 is followed.

**Failure.** The player resizes the browser window or goes full screen once, then walks behind a dark room's wall. The `seg<i>` frames made before the resize still point at the deleted texture. The NORMAL stamp at alpha w samples an incomplete texture (black on most drivers), so the strip turns black at w = 1 and stays that way every time it fades, for the rest of the session. A probe run at one window size won't catch it.

**Fix.** In §8.1 step 3: after every `stripTex.setSize`, remove the segment frames (`stripTex.remove('seg<i>')`, src/textures/Texture.js:193) and let them be re-added. A simpler option is to set `frame.glTexture = stripTex.getWebGLTexture()` (src/textures/DynamicTexture.js:1502) before each crop stamp. Either way, add it to the unit test (a fake setSize that swaps the texture object) and to the live proof: resize the window once (`game.scale.resize(w+64, h)`) and run step 7's A check again.

### M2. A smaller blend: draw the main map as today, then a NORMAL-only second batch

**Evidence.** The design records the whole redraw and replays it. It says one batch can't be "split in two without losing ADD and MULTIPLY composition" (§8.1, "Why a second texture"). That is half right. `endDraw` blits the capture onto the texture with `blitFrame(capture, target, 1, clear = false, …)` (src/textures/DynamicTexture.js:1144; src/renderer/webgl/pipelines/UtilityPipeline.js:344-391). Nothing resets the blend mode first, so the blit composites with the batch's last blend mode. That is the bug lighting.js:1193-1196 already works round with its closing black ADD stamp. `beginDraw` binds the renderer's capture target, which clears itself on bind (`new RenderTarget(..., autoClear = true)`, WebGLRenderer.js:843; RenderTarget.bind). The Multi shader outputs premultiplied colour (`texel = vec4(outTint.bgr * outTint.a, outTint.a)`, src/renderer/webgl/shaders/Multi-frag.js), and NORMAL is `[ONE, ONE_MINUS_SRC_ALPHA]` (WebGLRenderer.js:704-707).

So a second batch on the light map, with no `clear`, holding only NORMAL stamps of the strip crop at alpha w, works out like this. The capture holds `(w·L_N, w)`. The NORMAL blit gives `w·L_N + (1 − w)·L_S`, which is exactly the blend the design wants. Only MULTIPLY in a later batch is lost, and this batch has none.

**Failure.** Not a crash. The design sends a Sonnet implementer down the larger path. It has to restructure `update()` into two orders: `clear`/`beginDraw` before the loop on the idle path, after it on the blended path (§8.1 doesn't spell this out). It needs a pool and replay for every room's commands. It brings its own drift risk (§11 risk 4), which needs a "same calls" test to guard it. Every blended redraw then sends all of its commands through the copy.

**Fix (outline).**
1. Compute `segments` from `lightWeights()` and `visible` before the room loop (both are known by then, lighting.js:1030-1045).
2. Run the room loop exactly as today, into `rt`, with door spill and the black ADD, then `rt.endDraw()`. The only change: while the loop is on a north room named in `segments`, the target variable is a tee. It forwards each `stamp` to `rt` and also appends a copy (M2 still needs the target variable threaded through `fillRect`, `stamp`, the two inline MULTIPLY stamps, `stampTorch`, `stampBeam` and `drawFlashes`, as §8.1 says).
3. Strip batch, as §8.1 step 2: `stripTex.clear()`, `beginDraw`, then for each north room fill its segments with `drawAmbient` and replay its recorded non-fill commands, then a black ADD and `endDraw`.
4. `rt.beginDraw()` with no clear, one NORMAL crop stamp per segment at alpha w, `rt.endDraw()`. The last stamp must be NORMAL; add a comment saying the blit depends on it.

What goes: replaying the main map, two orderings of the draw, §11 risk 4, the "same calls" test, and pooling commands for rooms that aren't north of a segment. The idle and blended paths draw the main map with the same code. One cost: door spill now sits under the blend, so inside the strip it is weighted by (1 − w). Spill only runs from a brighter room to a darker one. When N is the brighter room, the strip already shows N's light. When S is, the strip shows N's darker light, which is decision 5. Say so in §8.1. A third ADD-only batch for spill is possible, but ADD over a transparent capture doesn't sum overlapping stamps the way the main batch does (`[ONE, DST_ALPHA]` with destination alpha below 1), so leave spill where it is.

Keep the probe. It now checks two things: the crop's orientation, and that a NORMAL-only second batch leaves pixels outside the segments unchanged (snapshot one before and after).

Other simpler options I considered and rejected:
- A scissor (`renderer.pushScissor`) inside the main batch, replaying N's stamps scaled by w. That uses internal renderer state that `endDraw` resets (`resetScissor`, DynamicTexture.js:1146), and it is exact only for ADD without clamping. More fragile than a crop.
- A flat fill of N's ambient. It cuts N's last row of panel pools with a hard line along the strip top. In a 10-row room that row is centred on `S.y`, with radius 102 (lighting.js:556-575), so the line would be visible.
- An overlay sprite. It can't replace a MULTIPLY map's value, only multiply it again.

### M3. The live proof uses rooms that are never loaded

**Evidence.** At start only the start room is created and revealed (core/game.js:2099-2100). Other rooms load when a door is opened (systems/doors.js:693-695, 810-812) or when an NPC route needs one (systems/npc-behavior.js:729), through `loadRoom`, which creates and reveals the room (core/rooms.js:921, 1002-1007). The fade only sees `window.rooms` (§2), and lighting only lights registered rooms.

**Failure.**
- Step 2 reads `window.rooms[id].position` for all four rooms and says "stop and report if they differ": reception, server and office_n don't exist yet, so the run stops there.
- Step 3 calibrates on "the dark server floor". With the server unloaded, that point is the white base fill (luma about 1). The design's own fallback then tells the tester the read is flipped in y, which is wrong.
- Steps 5, 6 and 8 need reception and server loaded while their doors are still closed. Reception has only the one door to the hall, so loading it by opening that door makes step 5's closed-door case impossible.

**Fix.** In step 2, before reading positions: `await window.loadRoom('reception'); await window.loadRoom('server'); await window.loadRoom('office_n')` (exposed at core/rooms.js:3436; it reveals each room). Then check that each room's door sprites are present and `!doorProperties.open`, and that `lightingSystem.rooms.get('server').on === false`. Only then run step 3's calibration.

## Minor

1. **Pooled opts must reset every key** (§8.1 step 1). `rt.stamp` reads opts through `GetFastValue`, which falls back to the default only when a key is absent or `undefined` (src/utils/object/GetFastValue.js:20-35; DynamicTexture.stamp reads `angle`, `rotation`, `scale`, `scaleX`, `scaleY`, `originX`, `originY`, `alpha`, `tint`, `blendMode`, `erase`, :441-453). The shared sources set different keys: `stampOpts` has no `scaleX`, `originX` or `angle`, while `blockOpts` and `coneOpts` do. Failure: a pooled command last used for a cone keeps `angle` and `originX = 0`, so a reused LIGHT_TEX pool is drawn rotated and off centre. Fix: copy a fixed list of those eleven keys, writing `undefined` for any the source lacks, and test it (copy blockOpts into a pooled object, then stampOpts, and check `scaleX`, `originX` and `angle` are undefined).

2. **The test mock has no `BlendModes.NORMAL`.** The lighting harness defines `BlendModes: { ADD: 1, MULTIPLY: 2 }` (test/js/lighting-emitter-leds.test.mjs:28). `fillRect`'s `blockOpts` has no `blendMode` at all (lighting.js:1018). Failure: the new strip-blend test tags fills by `blendMode === Phaser.BlendModes.NORMAL`, which is `undefined === undefined` in the mock but `undefined !== 0` in the real game, or the reverse, depending on how it is written. Fix: add `NORMAL: 0` to the new file's mock, and define a fill as "key is BLOCK_TEX and blendMode is absent or NORMAL".

3. **"At least 60 px from every emitter" is too close** (steps 4 and 7). Lamps have radius 80 and `screens` 72 (lighting.js:256-258). room_office has four lamps among its table items (room_office.json: `office-misc-lamp3` at room (246, 158) and elsewhere), and a dark room stamps emitter glows at full strength (lighting.js:1133). Failure: B picked 60 px from a lamp's centre picks up its pool, and A ≠ B by more than 6/255. Fix: pick points farther from each emitter's centre than its `def.radius`, using `lightingSystem.rooms.get(id).emitters[i].def.radius`.

4. **Step 9 starts polling while reception is still faded.** At the closed door the player stands in reception's strip, so reception is at k = 0.5 (step 5's case). Opening the door suppresses the fade, and k climbs back over 200 ms. "k must be exactly 1 on every frame" then fails on the first frames for a reason that isn't a bug. Fix: after `interact`, `waitUntil(k === 1 || !rooms.reception)`, then start polling and walking.

5. **Half-pixel segment edges.** `(seg.x - ox) * RES` is x.5 whenever `ox` is odd (`ox = floor(view.x) - 64`, lighting.js:1011). That puts the crop's quad edge mid-pixel. Fix: round the segment rect to whole RES pixels (`Math.round`) for both the frame and the stamp position. The ambient fills already do this (lighting.js:1088-1089).

6. **The strip texture key can outlive its system.** `initLighting` sets `window.lightingSystem = null` without calling `destroy` when the next scenario has lighting off (lighting.js:1515-1517), and textures are global to the game. `addDynamicTexture` with an existing key goes down the else branch, reads `texture.key` from the string, and returns `null` (src/textures/TextureManager.js:738-760). Failure: lit scenario, then unlit scenario, then lit scenario in one page: `null.add` throws on the first blend. Fix: `textures.exists(KEY) ? textures.get(KEY) : textures.addDynamicTexture(KEY, w, h)`, then `setSize`.

7. **Where the glow multiplier goes** (§8.2). The glow alpha is `Math.min(1, … * GLOW_BOOST)`, with `GLOW_BOOST = 1.3` (lighting.js:98, 1153). A multiplier inside the `min` doesn't halve a value that was clamped at 1. Fix: say `Math.min(1, …) * (obj.behindWallK ?? 1)`, and the same for flames at :1172.

8. **The brownout check is ambiguous** (step 7). "A's lowest luma over its start is within 0.15 of B's" can be read as a ratio or as a difference. Fix: `|minA/startA − minB/startB| <= 0.15`.

9. **An NPC in S's strip keeps S's light.** `stampNpcTorches` and `stampNpcGlows` place an NPC by `fillAreas`, which gives the strip to S (lighting.js:1253, 1299, 1330-1356). So an NPC with a torch, standing in the strip, is drawn in S's pass and blended out at w = 1, and its beam is cut at S's top wall. Rare; one line in §8.1 is enough.

10. **The probe must read in the same tick.** The light map is cleared and redrawn every 33 ms (lighting.js:1005-1028). Fix: stamp and read with `snapshotPixel` in one synchronous block (the read is synchronous, src/renderer/snapshot/WebGLSnapshot.js:40-48), or set `lightingSystem.lastDraw = Infinity` for the duration and restore it afterwards.

## Sonnet followability

§§2-7 can be followed as written. §8.1 can't without guessing:
- where `clear`/`beginDraw` go on each path;
- that the recorder is active only for the room loop, not the base fill;
- the opts key list (minor 1);
- the frame refresh (M1).

With M2's version the main draw doesn't move, and step 4 of the outline is the only new batch. Name `rt` → `target` as the variable that changes, and list the eight call sites that must use it (lighting.js:1023, 1054, 1160, 1183, 1226 via `stampTorch`, 1327 via `stampBeam`, 1490 via `drawFlashes`, and the `stamp` closure at :1054 used by `stampNpcGlows` and `stampDoorSpill`).

## Claims checked and correct

- `beginDraw` captures into the renderer's shared target and `endDraw` blits it, so batches can't nest (src/textures/DynamicTexture.js:898-920, 1128-1157).
- The strip texture's source has `flipY = true` (DynamicTexture.js:254). The sprite batch then applies no flip (MultiPipeline.js:315), and `endDraw` flips on copy for a sprite texture (DynamicTexture.js:1144, `isSpriteTexture` defaults to true, :157). Cropped frames should sample the rows as given. The probe is still worth running.
- `snapshotPixel` exists (DynamicTexture.js:1489). On a framebuffer it reads row `y` as given (WebGLSnapshot.js:44), which with the copy flip is top-down. The `map.height - 1 - y` fallback is the right one if it isn't.
- `addDynamicTexture` (TextureManager.js:738), `Texture.add` (Texture.js:155) and `Frame.setSize(w, h, x, y)` exist. `setSize` recomputes UVs from the current source size (Frame.js:357-401, `updateUVs`).
- The NORMAL stamp at alpha w gives exactly `(1 − w)·L_S + w·L_N`. The shader output is premultiplied, NORMAL is `[ONE, ONE_MINUS_SRC_ALPHA]`, and the strip texture's alpha is 1 inside a segment.
- Doubled pools: stamping N's lights again into the main map would add them twice on N's floor. Correct, so a separate texture (or M2's version) is needed.
- A 10-row room's last panel row sits at `N.y + 256 = S.y`, with radius 102 (lighting.js:556-575), so a flat fill would show a hard line.
- `fillAreas` gives the strip to S (lighting.js:1330-1356). Sort order and fills are as described (:1069-1090).
- Torch: drawn only in the pass for `here = currentPlayerRoom` and only below level 1 (lighting.js:1187, 1208-1227). Feet in S's strip count as N (core/rooms.js:3133-3149). Torch, NPC torches, flicker (`updatePanels`), brownout (`dip` through `lv` and `ambient`) and variants all reach `L_N` through N's own pass.
- Image alpha writes are at lighting.js:1110, 1153, 1172 and 1484, and they happen only during the loop.
- Lighting runs on WebGL only (lighting.js:1507-1521), so there is no Canvas path for the blend. Tile alpha works on both renderers as §1 says.
- Hook: `lightingSystem.update` is at core/game.js:2503 and `installSeating` at :1833. Seating `place()` runs on `postupdate` (seating.js:1520), and the overlay chain is at :840-841.
- Doors: a N/S door's body is an 8 px strip at its bottom (doors.js:574-577), so a player at a closed door from the north stands in the strip (step 5 can pass). Door input goes through a separate zone (doors.js:590-591), so alpha 0 on the hidden sprite doesn't block clicks. The proximity tint goes on every room's door sprites (interactions.js:285-330), so the S-side face still shows the highlight. The one-face rule holds.
- `doorClosed` (interaction-walls.js:152-161), `makeCosmetic` and `removeCosmetic` (npc-needs.js:3327-3344, 3776-3780) match their citations.
- Test plumbing: no test copies door-gaps.js. Tests read game.js only as text (desk-footprints.test.mjs:92, social-game-gating.test.mjs:17). interaction-walls.test.mjs loads its module from a data URL (:17-25). The lighting harness copy list is :13-26, and lighting.js gains no import. `bin/test-js` runs each file with plain `node`.
- The scenario scaffolding exists: `test_vertical_layout/mission.json` has `"collection": "testing"`, plus `tools/playtest/swap-scenario-game.rb`, `tools/playtest/start-keyless-server.sh` and the four room maps. In room_hq_servers the rack centres run from about world x 428 to 593 with radius 40, so step 7's x_s window of 330-368 has valid points.
