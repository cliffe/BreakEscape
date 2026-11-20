# Behind-the-wall fade: code review 2 (slices 3 and 4)

Reviewed 2026-11-08 against DESIGN.md §8 and §12-13. Commits: 9c6d0a014, 105a12a8e, 78a6e897f, b0164ec93, ac7d4d331. Paths are relative to `public/break_escape/js/` unless they start with `test/`, `planning_notes/`, `scenarios/` or `public/`. Line numbers are from the working tree; `systems/lighting.js` is unchanged since 78a6e897f. Phaser references are to phaser@3.60.0 from jsdelivr (`src/...`), read for this review. Findings already in CODE_REVIEW_1.md are not repeated.

`bin/test-js`: 423 files pass (run during this review). No browser was driven.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 9 |

I found nothing that breaks the feature, regresses existing behaviour or leaves a spec decision unmet. The code follows §8.1 step by step, and the Phaser internals it leans on behave as the design says (checked in the 3.60.0 source, list at the end). What is weak is the live proof: several checks pass without exercising the path they name. That is listed under "Still unproven" with a way to prove each item.

## Blockers

None.

## Majors

None.

## Minors

### 1. An odd camera width gives the strip a fractional source width; crop UVs can be half a texel off

- **Evidence.** The light map is `(cam.width + 128) * 0.5` wide (systems/lighting.js:419, :491), so an odd camera width gives a width ending in .5. `getStripTexture` creates and resizes the strip at that width (:1300-1301). `DynamicTexture.setSize` stores `source.width = width` unrounded (src/textures/DynamicTexture.js:257-258), while `RenderTarget.resize` builds the GL texture at `Math.round(width)` (src/renderer/webgl/RenderTarget.js:237-238). `Frame.updateUVs` divides by `source.width` (src/textures/Frame.js:675-676), so a crop's UVs are scaled by `W / (W + 0.5)` against the real texture. The texture is NEAREST-filtered (`pixelArt: true`, antialias off: src/renderer/webgl/WebGLRenderer.js:1884-1902). The game size flexes to the window (utils/constants.js:84-90), so odd widths happen.
- **Failure scenario.** Near the right or bottom of the light map, a crop samples one texel to the side of its own rect. At the segment's last column or row that texel can lie outside the segment (transparent, or N's stamps on a transparent background), giving a 2 px dark or wrong-coloured line on the strip's edge at weight 1. The probe ran at 564 x 414 (proof/s4_probe_result.json) and step 10 resized by +64, so only even widths have been seen.
- **Fix.** Prove it first: rerun proof/s4_probe.mjs after `game.scale.resize(width + 1, height)` and read the crop's last column and row. If they are off, size the strip at the GL texture's real size (`Math.round(rt.width)`, `Math.round(rt.height)`) in both the create and the resize check, so `source.width` matches the texture. Segment rects are already clipped to `Math.floor(rt.width)` (:1313-1318), which stays inside either size.

### 2. The step 4 spill check passes without any spill

- **Evidence.** proof/s4_live.mjs:136-138 checks that the light at (100, 3) and (100, -3) agree within 6/255 and records PASS. HANDOVER.md "Unverified" says there was no hall/office_n door sprite and no spill pool, so both reads were office_n's dark ambient. The check would pass with the spill replay deleted.
- **Failure scenario.** A regression in the `'__spill'` replay (:1260-1262, :1340) or in its ordering after the north rooms would still pass the live suite. The only cover is the unit test, which stubs `stampDoorSpill` (test/js/lighting-strip-blend.test.mjs:115).
- **Fix.** Replace the check with the reception doorway test under "Still unproven" (item A), and make the check assert that a pool exists before comparing (luma at the doorway at least 0.1 above the dark ambient).

### 3. The tee test stubs the helpers that take `drawTarget`, so a bypassing stamp in them would not be caught

- **Evidence.** DESIGN.md §11 risk 4 relies on "the unit test that compares the main map's calls on the idle and blended paths". The rig replaces `stampNpcTorches` and `stampNpcGlows` with no-ops, sets `window.player = null` so `stampTorch` returns at once, and has no flashes (test/js/lighting-strip-blend.test.mjs:112-117). So `stampTorch` (:1370-1389), `stampBeam` (:1474-1490) and `drawFlashes` (:1631-1654) never run under the tee. The slice 3 flash test covers only the indicator path; the `f.at.sprite` path (desk phone, :1634) is not tested with `behindWallK`.
- **Failure scenario.** A later edit that makes `stampTorch` stamp its cone with `this.lightMap.stamp` instead of its `rt` argument puts the torch in the main map but not in `L_N`. At w = 1 the torch beam vanishes from the strip (the dark N row of the §8.1 table), and every unit test still passes.
- **Fix.** Add a case to the tee test with `window.player` set, the hall dark (level 0, so the torch draws), one NPC torch (or a stub that calls the real `stampBeam`) and one live flash, and assert that `stripCmds` holds a `be_light_cone` command and a MULTIPLY flash command for `hall`. Add one `drawFlashes` assertion for an `at: { sprite, roomId }` flash with `behindWallK = 0.5`.

### 4. Rigs built with `Object.create` crash in `update()` without the five strip fields

- **Evidence.** `update()` calls `this.stripNorth.clear()` and `segments.length = 0` on fields only the constructor sets (:410-415, :1100-1103). lighting-emitter-leds.test.mjs had to add them (b0164ec93). Four test files build the system with `Object.create(LightingSystem.prototype)`; two call `update()`.
- **Failure scenario.** The next test that runs `update()` on such a rig fails with `TypeError: Cannot read properties of undefined (reading 'clear')`, far from the cause. The kind of coupling isn't new (the rigs already set `flashes`, `tmpCentre` and `reducedMotion` by hand), but these five fields exist only for one feature.
- **Fix.** Lazy-initialise at the top of the strip block in `update()`: `this.stripCmds ??= []; this.stripNorth ??= new Set(); this.stripSegments ??= []; this.stripDebug ??= { at: 0, segments: [] };` (`stripCmdCount` is assigned there already). It costs four nullish checks per redraw and allocates nothing after the first. Keep the constructor lines for readability, and drop the hand-set fields from the emitter rig so the test proves the lazy path. Grouping them under one `this.strip` object would also do, but touches more lines.

### 5. Per-redraw allocation while a strip is faded

- **Evidence.** Each redraw with segments allocates the `stripBlendSegments` output, its `pieces` and `next` arrays and segment objects (:363-389), two closures per segment for `visible.some` (:1108), the `rects` array (:1314), a `g.rect` array per segment (:1319), a `'seg' + i` string per stamp (:1348) and a full debug copy through `segments.map` (:1273).
- **Failure scenario.** None visible: a few dozen small objects at 30 Hz, only while the player stands in a strip. DESIGN.md §10 promises no allocation after the first redraw only for the recorded commands, which holds; the idle path allocates nothing (verified below). Listed because the debug copy is pure overhead on every faded redraw.
- **Fix.** Store a reference and build the debug object only in `stripBlendDebug()`; precompute the frame names (`SEG_NAMES[i]`); replace `visible.some` with a reused Set of visible ids filled in the `visible` loop. Leave `stripBlendSegments` as it is (it is the pure, tested function).

### 6. Destroying the strip texture leaks its framebuffer in Phaser 3.60.0

- **Evidence.** `destroy()` calls `tm.remove(STRIP_TEX)` (:1661), which calls `Texture.destroy` (src/textures/TextureManager.js:283). `Texture.destroy` (src/textures/Texture.js:482-521) destroys sources and frames but never calls `DynamicTexture.preDestroy` (src/textures/DynamicTexture.js:1553-1569), which is where the RenderTarget is destroyed. `TextureSource.destroy` deletes the GL texture only (src/textures/TextureSource.js:339-356). The framebuffer and its depth-stencil renderbuffer (src/renderer/webgl/WebGLRenderer.js:2068-2072) stay allocated.
- **Failure scenario.** Every scenario restart in a lit mission after the strip was used leaks one light-map-sized framebuffer and depth buffer. Small, but it accumulates over a long session that restarts often (playtests, the Hacktivity desktop shell).
- **Fix.** Before the remove: `const t = this.stripTex || (tm.exists(STRIP_TEX) && tm.get(STRIP_TEX)); t?.renderTarget?.destroy?.();` and keep the `tm.remove`. A second `deleteTexture` on the already deleted texture is harmless in WebGL.

### 7. The m04 screenshot note in HANDOVER.md names the wrong sprite and gives a reason that would be a bug

- **Evidence.** HANDOVER.md:57 says the player "stands behind a solid blue locker prop (not faded: its base is below the strip)". The sprite is the closed workshop/battery_hall_1 door (answer at the end). A south-room prop whose drawn rect reaches the strip must fade whatever its base (decision 8), so "base below the strip" is not a reason a prop could stay solid.
- **Failure scenario.** A later reviewer or fixer reads this as a sprite-pass bug, or as permission for south-room props with low bases to stay solid.
- **Fix.** Correct the note: it is the closed N/S door, highlighted blue by the door proximity tint, kept solid by decision 9 (the CODE_REVIEW_1 item 1 case). Retake the shot at dx 100 or more so the player is clear of the door column (S.x + 32 to S.x + 64).

### 8. The step 7 doorway crossing was replaced with `setPosition`; the cause is the test map, not the engine

- **Evidence.** proof/s4_live.mjs:92-97. The server is `room_hq_servers` (scenarios/test_behind_wall_fade/scenario.json.erb:67-68). Its north door is the hall's second south door, at x 592, so server-local x 256-288. In `public/break_escape/assets/rooms/room_hq_servers.json` a rack sprite (items, gid 905, x 258-288, y 39-98) and a collision box (Object Layer 1, x 260-286, y 64-98) sit directly under that column. World y of the box top is 256 + 64 = 320, exactly where the player's feet stop, with the fade on or off.
- **Failure scenario.** The walk through an open N/S doorway while a strip is faded (fade suppression in the doorway, k returning, segments dropping as `currentPlayerRoom` changes, the spill at the crossing) has not been seen live. The same map puts a rack under any NE-corner north door in a shipped mission.
- **Fix.** In the test scenario, give the server a room type whose NE doorway column is clear, or move the rack in the test copy, then put the real walk back in step 7. Separately, check shipped missions for `room_hq_servers` rooms with a north door at the NE corner (noticed, not in scope; file in docs/IDEAS_BACKLOG.md if it shows up).

### 9. Steps 8, 9 and 10 check geometry or "not black", not the light they are named for

- **Evidence.** Step 8 (proof/s4_live.mjs:111-113) and step 9 (:153-155) assert only `stripBlendDebug()` segment rects; no light is read at the seam or in the doorway column. Step 10 (:158-174) reads one point whose emitter margin is -8.4 (HANDOVER.md:51) and asserts "within 6/255 and not black".
- **Failure scenario.** A wrong crop orientation after a resize, a seam step between two south rooms' strips, or a doorway column that lost S's light would all pass. (By source reading the resize path keeps the orientation: `setSize` sets `flipY = true` on the new texture exactly as at creation, src/textures/DynamicTexture.js:247-254, and the pipeline reads that flag, src/renderer/webgl/pipelines/MultiPipeline.js:315. So this is a proof gap, not a suspected bug.)
- **Fix.** See "Still unproven" items B to D.

## Still unproven, and how to prove it

Run each on a throwaway game with the keyless server the orchestrator assigns (not on :3001 while another agent is using it), with lighting on.

- **A. Spill through the strip (decision 5, §8.1 "Door spill").** In test_behind_wall_fade the hall/reception doorway works (step 9 opens it, gap x 32-64). Switch the hall off (`lightingSystem.switchOff('hall')`), keep reception lit, open `door:hall->reception` from the hall, then walk down at x 88 into reception's strip until `k === 0.5`. The hall holds the open door and is darker, so the spill pool is drawn from reception back into the hall (systems/lighting.js:1566-1575). Assert: (1) a pool exists, luma at (48, 250) at least 0.1 above the hall's dark ambient read at (200, 150); (2) at x 70, 80 and 90, the reads at y 254 and y 258 (across the strip's top edge) agree within 6/255; (3) the doorway column (48, 300) reads the same, within 6/255, as it did before the walk-in.
- **B. The seam (step 8).** With reception and server both faded under the hall, read y 300 at x 316 and x 324 and assert they agree within 6/255 when the two south rooms differ in light (one lit, one off), since both strips take the hall's light at w = 1.
- **C. The doorway column (step 9).** Beside the open reception door, read (48, 300) and (40, 300) with the fade on and with `?behindWallFade=off`; they must match within 6/255 (the column keeps S's light), while (80, 300) differs when the hall and reception differ.
- **D. Resize and odd sizes (step 10, minor 1).** Pick a point inside a segment with a positive emitter margin, or switch the nearby emitters off. Read a vertical line of five points through the strip before and after `scale.resize(width + 64)` and after `scale.resize(width + 1)`; all must match within 6/255. Also read the segment's last column and last row after the +1 resize.
- **E. The real crossing (step 7).** After minor 8's map fix, walk the player from the hall through the open server door with no `setPosition`, sampling `debugState()` and `stripBlendDebug()` every 30 ms: the server's k returns to 1 while the feet are within the doorway's suppression width, the segments empty, and no light frame shows a black strip.
- **F. Restart and key reuse.** Load a lit scenario, fade a strip, restart into an unlit scenario, then a lit one, and fade again. Assert no console error, that `textures.exists('be_light_strip')` is true only while a strip has been used in the current lit run, and that the strip reads lit. This covers the `exists` guard (:1300) and `destroy` (:1661) live.
- **G. One south room under two north rooms.** No live step has a strip spanning two north rooms; the unit test covers the geometry only (lighting-strip-blend.test.mjs:47-53). m04's workshop is narrower than battery_hall_1, so it doesn't cover it either. A two-room north side in the test scenario, or a unit test of the strip batch with `twoNorth` that checks each fill sits under its own segment, would close it (the latter half exists at :172-195).

## The blue sprite in proof/s4_m04_engineering_workshop.png

It is the closed N/S door between engineering_workshop (S) and battery_hall_1 (N), not a prop and not a locker.

- The workshop has one north connection (scenarios/m04_critical_failure/scenario.json.erb:1738-1740), so its north door takes the default corner slot, centred at `S.x + 48` (systems/doors.js:102-117) and drawn as `door_32`, 32 x 64, centred at `S.y + 32` (:437-441). That is world x S.x + 32 to S.x + 64, y S.y to S.y + 64: the shape and place of the blue sprite (about 31-61 px from the workshop's left wall, filling the strip's height).
- `door_32.png` is grey. The blue is the door proximity highlight, `door.setTint(0x4da6ff)` (systems/interactions.js:331), on because the player at dx 60 is within interaction range. In proof/s2_m04_engineering_workshop.png, taken from further away, the same door is dark and untinted.
- No map object matches. room_aes_workshop's only locker (aes_lockers_grey1) is at local y 241-300, on the floor far below the strip, and room_aes_hall1 has nothing at its bottom left (checked in both map JSONs).
- Owner: the workshop's `doorSprites` hold it as its north door; per DESIGN.md §1 battery_hall_1 creates a matching south-door sprite at the same place once both rooms are loaded.

Staying solid matches the spec. Decision 9 says door sprites never fade, open or closed, and the user's ruling (door sprites never fade; south-room props reaching the strip do) applies the door half here. The prop half isn't involved, since nothing in the shot is a workshop prop in the strip at that x. The door's depth, `S.y + 64.45` (systems/doors.js:481-487), is above a player in the strip, which is why it hides the player: the case CODE_REVIEW_1 item 1 raised for the user.

## Verified correct

- **The four multipliers** (9c6d0a014): LED `ledA * k` (:1179), glow outside the clamp on both the `obj.depth + 0.01` and `LIGHT_DEPTH + 1` paths (:1221-1222), flame tongues outside the clamp (:1241), and lock flash on both the indicator and `at.sprite` paths (:1646). No other per-object image alpha write exists in lighting.js (grep for `setAlpha`), and outside lighting.js the only images drawn over objects are overlays the spec excludes (lock glyphs, interaction indicators, proximity ghosts). The light-map stamps under faded objects (:1121, :1229, :1252, :1652) stay at full strength, as decision 6 says. `behindWallK` is only ever finite (behind-wall-fade.js:256; non-finite k drops the state).
- **The `drawTarget` tee at every stamp site in the room loop and the spill loop**: `fillRect` (:1075), `stamp` (:1121), the hue-keep and floorTint MULTIPLY stamps (:1229, :1252), `drawFlashes` (:1255 → :1652), `stampTorch` (:1256 → :1388), `stampNpcTorches` → `stampBeam` (:1257 → :1431 → :1489), `stampNpcGlows` through the closure (:1258), and `stampDoorSpill`'s closure stamps and its direct closed-door leak (:1262 → :1563). The base white fill (:1077) is drawn before any tee is set, and the closing black ADD (:1267-1270) goes to `rt` after `drawTarget = rt` (:1263). The only `this.lightMap.stamp` outside `update()` is the tee itself (:1283).
- **Option copy**: all twelve keys copied at call time into pooled objects (:1285-1288), so a pooled cone command doesn't keep `angle` or `originX`. Phaser's `GetFastValue` treats an own key holding `undefined` as absent (src/utils/object/GetFastValue.js:25), so copied `undefined` means "default", as the design assumed. Every recorded options object sets `skipBatch: true` (:1067, :1114-1115, :1383, :1484, :1529).
- **Strip batch**: cleared, then per north room in `visible` order an opaque NORMAL fill of `drawAmbient` over each of its segments, its commands, then the spill once, then a black ADD with `skipBatch` (:1327-1342). N's own fills can't cover its segments because `fillAreas` gives S's whole rect to S (:1498-1517).
- **Blend batch**: no clear, NORMAL stamps only, so it ends on NORMAL; one stamp per segment at alpha w with origin 0 (:1344-1357). Empty rect lists return before either batch (:1322).
- **Segment rounding and clipping**: one `Math.round` per edge in RES pixels, clipped to `[0, floor(width)] x [0, floor(height)]`, used identically for the fill, the frame and the stamp (:1313-1320); adjacent segments share rounded edges, so no overlap or gap appears between them.
- **Open-doorway gaps**: `[gx - 16, gx + 16)` cut from every piece (:374-383), with gx the snapped tile centre from the same doorway provider and open rule the fade's suppression uses (behind-wall-fade.js:60-65, 316-331).
- **glTexture swap after `setSize`**: `setSize` replaces the RenderTarget's texture (src/renderer/webgl/RenderTarget.js:230-251) and updates only the first frame, which is `seg0` once it exists (src/textures/DynamicTexture.js:233, src/textures/Texture.js:170-173). The code reassigns `frame.glTexture` from `getWebGLTexture()` before every stamp (:1353) and resets each crop's rect with `frame.setSize`, which recomputes UVs from the new source size (src/textures/Frame.js:357-401). The batch reads `frame.glTexture` (src/renderer/webgl/pipelines/MultiPipeline.js:258). `__BASE` keeps a stale handle and size but is never stamped. The RenderTarget is made with `autoResize` true but never registers a renderer-resize listener (src/renderer/webgl/RenderTarget.js:139, 165-193), so only the lazy `setSize` resizes it.
- **Texture lifecycle**: made on first use only (:1300), `exists` guard before `addDynamicTexture` (which returns null on a taken key, src/textures/TextureManager.js:738-764), resized lazily, removed in `destroy` (:1661). `initLighting` destroys the old system before building the new one (:1683-1684), so a restart never removes a texture the new system holds.
- **Canvas renderer**: lighting refuses to start without WebGL (:1675-1681), so `getWebGLTexture()` returning undefined on Canvas cannot be reached.
- **Idle cost**: with no weights, `update()` adds one `lightWeights()` call (returning a reused empty array, behind-wall-fade.js:317-318), a counter reset, an empty Set clear, a Set lookup per room and one ternary; nothing is recorded, no texture is made, the debug object is not rebuilt after the first idle redraw (:1273), and the main batch's stamps are identical to the blended path's (unit test at lighting-strip-blend.test.mjs:125-138). While faded, the tee and command pool allocate nothing after the first redraw.
- **Second-batch composition and crop orientation**: settled by the probe (proof/s4_probe_result.json: NORMAL at 0.5 over white and over 0x404040 gives the expected mixes, points outside unchanged, rows not flipped), and consistent with the source (`flipY` set on the render texture at creation and after every resize).
- **Slice 3 live ratios** (proof/s3_live.mjs, HANDOVER.md:43): pc and rack glows at 0.5000, rack LED 0.475 = 0.5 x 0.95.
