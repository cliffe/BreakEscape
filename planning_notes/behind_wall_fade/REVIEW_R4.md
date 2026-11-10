# Behind-the-wall fade: review round 4

Reviewer: fresh Opus, read-only. Read DESIGN.md, AGENTS.md, the engine files it cites, and Phaser 3.60.0 source from jsdelivr. I did not read the earlier REVIEW files. Judged mainly on whether a Sonnet implementer can follow §13 slice by slice without guessing.

Counts: **0 blocker, 3 major, 8 minor.**

The Phaser side of the lighting blend (§1, §8.1) holds up against the 3.60.0 source. The majors are one visual consequence the design doesn't mention and two live checks that would fail while the code is right.

## Major

### M1. A faded closed door shows a black hole: no tiles are left under the doorway in either room

Evidence:
- removeTilesUnderDoor runs on every layer of every room for each of that room's own door positions (core/rooms.js:2026, 2038; systems/collision.js:153-215). S's north door covers `S.y .. S.y+64`, and N's south door is at the same point (DESIGN §1, systems/doors.js:92, 187). So S's rows 0-1 **and** N's last two rows are null in the door column.
- `door_32.png` is fully opaque (0 of 2,048 pixels transparent), so today it hides the empty space.
- GAME_CONFIG sets no `backgroundColor` (utils/constants.js:75-100), so the camera clears to black.

Failure: with `FADE_CLOSED_DOORS = true`, step 5 (player at the closed hall/reception door) shows the wall either side at 50% over the hall's floor, but the door at 50% over black: a dark door-shaped hole with the player's legs ghosted in it. The design never says what lies under the door, and §11 doesn't list this, so the implementer will take it for a bug of their own.

Fix: add it to §11 and make it a screenshot check in step 5. Decision 9 is the user's, so put the choice to them with a screenshot:
- keep the decision, and fade the door face to 0.75 instead of k, so the hole is fainter;
- or set `FADE_CLOSED_DOORS = false`;
- or put a floor backing under a faded closed door (e.g. a 32x64 image of N's floor tile from the cell above the doorway, at the door's depth − 0.01, shown only while the door is faded). This is more work and needs its own test.

### M2. Step 4's light check can fail because the hall's door spill lights B but not A

Evidence: by step 4, enterRoom has opened the office_n/hall door from the hall, so the hall's `doorSprites` holds the opener with `open = true` (systems/doors.js:833-876). stampDoorSpill for the hall (level 1) into office_n (level 0) stamps a pool at `(48, 32 − 38.4) = (48, −6.4)` with radius `TILE_SIZE * 2.2 = 70.4` and alpha 0.55 (systems/lighting.js:1404-1415). Spill is drawn after the room loop, into `rt` only (§8.1 step 2), so it is in B but not in the strip texture used for A at w = 1.

Failure: step 4 says to pick x in 70-310, at least 60 px from `player.x` (160) and away from emitters. That allows x in 70-100. At x = 80, B (80, −20) is about 35 px from the spill centre and reads clearly brighter than A (80, 40). The check "A matches B within 6/255" fails, and the implementer goes looking for a blend bug that isn't there.

Fix: in step 4, require x at least `70.4 + 8` px from the open doorway's spill centre (48, −6), i.e. x ≥ 130 in practice. With the player at 160, that leaves 220-310. Also say that door spill is the one source in B that A must not contain.

### M3. Step 6's glow check (slice 3's done-criterion) can't be met as written

Evidence:
- §6 step 2 sets `sprite.behindWallK = factor` on every tick while S has a state, and the state lives until k is back at 1 (§7). One frame after leaving the strip, `behindWallK` is still about 0.53, not deleted.
- The pc is a `screen` emitter. Its glow alpha carries `k = 0.9 + 0.1·sin(time/90 + phase)` (systems/lighting.js:1116, 1153), so it changes from frame to frame.

Failure: "the pc's glow alpha at half the value lighting.js gives it with `behindWallK` deleted (compare against one frame after leaving)" compares 0.5 against about 0.53 times a flickering value. The ratio comes out near 0.9, not 0.5, and slice 3's "Done when … the pc glow … read at half alpha" fails on a correct build.

Fix: run the comparison with `lightingSystem.reducedMotion = true` (the flicker freezes: `still`, :1068, 1115). Read the glow alpha while faded, wait until `!debugState().rooms.reception`, then read it again; expect the ratio 0.5 ± 0.01. Or assert `e.glow.alpha ≈ Math.min(1, unclampedValue) * obj.behindWallK` within the same frame. LED alpha (`ledA`, :1103) doesn't flicker, so the rack LED check is fine as it is.

## Minor

1. **§1, the resize claim, is only true until the first crop frame exists.** `DynamicTexture.setSize` works on `this.get()` (DynamicTexture.js:232), and `Texture.get()` with no name returns `firstFrame` (Texture.js:238-244). `Texture.add` changes `firstFrame` from `__BASE` to the first frame added (Texture.js:166-169). So after `strip.add('seg0', …)`, a resize gives `seg0` the new handle and resizes `seg0` to the whole texture, while `__BASE` keeps the deleted handle. The design's per-stamp `frame.glTexture = …` and per-redraw `frame.setSize(w, h, x0, y0)` already cover the crop path. Correct the sentence, and say the §8.1 erase fallback must stamp `'__BASE'` by name and refresh its handle the same way. `stamp(STRIP_TEX, null, …)` would pick `seg0` if any crop frame was ever added.
2. **`skipBatch: true` isn't stated for the strip fill or the strip's closing ADD** (§8.1 steps 4-5). `stamp` without it calls `draw`, which calls `endDraw` (DynamicTexture.js:616-623, 477-485). That closes the strip batch after its first stamp, and the remaining skipBatch stamps then go to whatever framebuffer is bound. Say "every stamp in both new batches passes `skipBatch: true`", and add it to the strip-batch unit test.
3. **`rt.width` can be fractional.** The game size follows the window (Scale.NONE, main.js), and the light map is `(cam.width + 128) * 0.5` (systems/lighting.js:442), so an odd window width gives x.5. RenderTarget rounds its texture size (RenderTarget.js:236-237), but `DynamicTexture.width` and `RenderTexture.width` keep the x.5 (DynamicTexture.js:259-263; RenderTexture.js:127-130). Clipping x1 to `rt.width` then gives a non-integer crop width, which breaks §12's "every crop frame has integer x, y, width and height". Clip to `Math.floor(rt.width)` and `Math.floor(rt.height)`.
4. **"The ambient fills round the same way (:1088-1089)" is wrong.** fillRect rounds in world px and then multiplies by RES (:1019-1023, 1089), so fills sit on half RES pixels when `r.x − ox` is odd. The strip fill uses rounded RES rects. The difference is half a texel at segment edges and isn't visible. Delete the sentence so nobody "fixes" the main fill to match.
5. **`let target = rt` shadows the existing `const target`** at systems/lighting.js:1060 (inside `if (player)`) and :1256 (stampNpcTorches). It is legal JS but easy to misread when editing those lines. Name it `drawTarget`.
6. **Strip-blend unit rig: `this.flashes` is missing from the stub list** (§12). `update()` reads `this.flashes.size` at :1186, so `Object.create(LightingSystem.prototype)` throws without `flashes = new Map()`. Add it, along with `state.panelAdd`, `panelColor` and `glowLitFade`, which the panel and emitter lines read.
7. **"`debugState()` / `stripBlendDebug()` returns JSON"** could be read as a string, but every live step dereferences it (`debugState().rooms.hall.k`). Say "a plain, JSON-serialisable object". Also give the waitUntil predicates as arrow-function source (`'() => window.behindWallFade.debugState().rooms.hall?.k === 0.5'`). `__test.waitUntil` evaluates `return (<src>)` and expects a function back (systems/test-bridge/index.js:1564-1570).
8. **Step 10's point A' = (200, 300) has no emitter-clearance rule.** Step 4 and step 7 have one. If a hall screen or rack near the hall's bottom rows reaches it, its flicker moves A' by more than 6/255 between the two reads. Apply the same "farther than `def.radius + 8` from every emitter" rule, or set `reducedMotion = true` for that step.

## Claims verified correct

- The second-batch blend in Phaser 3.60.0:
  - `beginDraw` → `beginCapture` → `renderTarget.bind(true, w, h)`, with autoClear to (0, 0, 0, 0) (DynamicTexture.js:898-920; WebGLRenderer.js:843, 1107-1115; RenderTarget.js:274-304).
  - `endDraw` → `blitFrame(capture, target, 1, false, false, erase, isSpriteTexture)` with no blend change unless erasing (DynamicTexture.js:1128-1157; UtilityPipeline.js:344-409).
  - NORMAL is `[ONE, ONE_MINUS_SRC_ALPHA]` (WebGLRenderer.js:705-713).
  - Result: a NORMAL-only batch of `(L_N, 1)` texels at alpha w composites to `w·L_N + (1 − w)·L_S` and leaves pixels outside the stamps alone.
- The strip texture and the light map are both DynamicTextures with `isSpriteTexture = true` (DynamicTexture.js:157; RenderTexture.js:211). So the probe texture made with `addDynamicTexture` has the same orientation as the strip texture, and a crop frame's `cutY` maps to display rows. `texture.flipY = true` set in setSize (:254) suppresses the sprite auto-flip (MultiPipeline.js:315).
- `Frame` copies `source.glTexture` once (Frame.js:79), the batch draws with `frame.glTexture` (MultiPipeline.js:258), and `RenderTarget.resize` deletes and recreates the texture (RenderTarget.js:221-251). The per-stamp handle swap is needed and enough. `Frame.setSize(w, h, x, y)` recomputes UVs from the current `source.width` (Frame.js:357-401, 659-685).
- `stamp` defaults come from `GetFastValue`, so a key copied as `undefined` falls back to its default, as in STAMP_OPT_KEYS (DynamicTexture.js:437-493). Every lighting opts object carries `skipBatch: true` (lighting.js:1018, 1047-1048, 1221, 1321, 1367).
- `addDynamicTexture` returns null for an existing key, and `remove` takes a key (TextureManager.js:738-765, 261-290).
- `snapshotPixel` reads synchronously (WebGLRenderer.js:2811-2848; WebGLSnapshot reads framebuffer row y directly).
- The eight in-loop stamp sites are complete: the fillRect and stamp closures, the inline MULTIPLY stamps at :1160 and :1183, drawFlashes (:1186 → :1490), stampTorch (:1187 → :1226), stampNpcTorches → stampBeam (:1188 → :1269 → :1327), and stampNpcGlows via `stamp` (:1189). Spill (:1192) and the closing ADD (:1196-1200) sit outside the loop.
- The four §8.2 alpha writes (:1110, :1152-1153, :1172, :1484). GLOW_BOOST is 1.3 (:98). Panel layout puts a 10-row room's last row at `N.y + 256` with radius 102 (:556-575).
- The hook placement in core/game.js:2469-2505. The call `npcBehaviorManager.update(this.time.now, this.time.delta)` (:2484). `installSeating(this)` (:1833). door-gaps.js is imported only by game.js (:10). No test harness copies door-gaps.js or game.js as a module.
- Player body 18x10 at offset (31, 66) (core/player.js:137-138, 231-232). Feet detection in updatePlayerRoom (core/rooms.js:3122-3150). Wall boxes at `worldY + 24 .. +32` (collision.js:59-84). N/S door bodies are an 8 px strip at the bottom (doors.js:573-577), so feet reach `S.y + 56` at a closed door and step 5 works.
- Door clicks go through a separate Zone (doors.js:587-591), so a door sprite at factor 0 is still clickable. I checked this because Phaser drops alpha-0 objects from input (InputManager.js:846; GameObject.js:621-626).
- makeCosmetic and removeCosmetic (npc-needs.js:3327-3344, 3776-3780) and the seating overlay chain (seating.js:836-842, `postupdate` at :1520).
- The test scenario's layout:
  - map sizes: genhall 20x10, office/reception/hq_servers 10x10;
  - positions: office_n at (0, −256), left-aligned; doors at x 48 / 48 / 592, the last from the multi-south spacing path (doors.js:85-94);
  - hall cells (19, 0) in `room` and (10, 1) in `walls`/`room` are non-null;
  - the hall's strip objects;
  - `male_office_worker_v2` exists;
  - `swap-scenario-game.rb` usage;
  - `window.loadRoom` (core/rooms.js:921, 3436) and the `__test` methods enterRoom, moveTo, walk, interact and waitUntil, with door ids `door:<roomId>-><connectedRoom>`.
