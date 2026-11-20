# Behind-the-wall fade: design

Status: design only, nothing implemented. Written 2026-11-08 against the working tree.

**Request.** The view fakes depth. A room's top two tile rows (its back wall) overlap the bottom two rows of the room to its north, and the player can walk into that strip, ending up "behind" the south room's wall. That stays: never seal it. While the player stands in the strip, the south room's things in those two rows drop to 50% opacity so the player can see their character and what is behind the wall. Leaving the strip restores them.

Decisions:

1. What fades: all of the south room's tile layers in its two back-wall rows, and every south-room object sprite whose drawn sprite reaches into the strip (items, conditional items, tables, tall floor props, wall-hung objects). NPCs never fade, and nor does the player.
2. Things owned by the north room never fade, even when they sit inside the strip. Ownership is the room whose `objects` map lists the sprite, not its position (§4). Elevation counts only through where the sprite is drawn (§4).
3. The whole width of the south room's two rows fades, not just a window near the player.
4. The doorway doesn't fade: the doorway cells stay as they are, and the fade is suppressed while the player stands in an open N/S doorway. Walking along the strip past an open doorway drops the fade for the doorway's width and brings it back (about 0.3 s); there is no hold.
5. While the strip is faded it takes the light of the room north of it (the player's room), blended in with the fade factor k: at k = 1 the strip has the south room's light, as now, and at k = 0.5 it has the north room's light in full. A dark room's back wall therefore looks lit while it is faded, and a lit room's back wall takes a dark north room's light (§8).
6. Screen glows, LEDs, flames and lock flashes of faded objects fade with them. The light they cast on the floor (the light-map stamps) stays at full strength (§8).
7. 50% opacity, 150 ms out, 200 ms back, instant under reduced motion.
8. An object counts as in the strip when its drawn rect, transparent frame edge included, reaches the strip. There is no minimum overlap. An item in a table's group fades whenever its table fades, even if its own rect stays below the strip, so nothing solid is left standing on a faded table (§4).
9. Door sprites never fade, open or closed (§4).

Paths are relative to `public/break_escape/js/` unless they start with `scenarios/`, `test/`, `tools/`, `app/` or `assets/`. Phaser paths are in phaser@3.60.0 (`https://cdn.jsdelivr.net/npm/phaser@3.60.0/<path>`), the version the game loads (app/views/break_escape/games/show.html.erb:313).

## 1. What the code does today

**Geometry.**
- A north room N sits `stackingHeightPx` above its south neighbour S, with `stackingHeightPx = (heightTiles - VISUAL_TOP_TILES) * 32` (core/rooms.js:1222, 1416; utils/constants.js:29). N's last two rows share world Y with S's rows 0-1, so S's strip is `y ∈ [S.y, S.y + 64)`.
- A single N/S neighbour of a different width is aligned to the left or right edge by grid parity (core/rooms.js:1418-1434, 1513-1528). A group of N/S neighbours is centred on the parent and snapped to the 160 px grid (core/rooms.js:1452-1456, 1546-1550). Either way the strip can cover only part of N's bottom, or run past N's edge.
- Wall collision: every `walls` tile in rows 0-1 gets an 8 px box on its south edge (`worldY + 28 ± 4`), and every tile in the last row the same (systems/collision.js:59-84). Feet coming from N stop at about `S.y + 56` (or `S.y + 24` where row 0 of `walls` is filled). Feet coming from S can't get into the strip except through a doorway.

**Which room the player is in.** updatePlayerRoom takes the body's bottom edge and the body-centre x, and picks the first room whose floor (`pos.y + 64` to `pos.y + height`) holds them (core/rooms.js:3122-3150). Feet in S's strip therefore count as N, or as no room in a gap. interaction-walls.js mirrors this with `BACK_WALL_ROWS = 2` in `roomIdAtFeet` (systems/interaction-walls.js:40-41, 88-99). The player's physics body is 18x10 at offset (31, 66) in an 80x80 frame (core/player.js:231-232, set again on a sprite swap at :137-138).

**What draws the strip.** All 148 maps in `public/break_escape/assets/rooms/*.json` have tile layers `walls`, `room` and `doors`; one map adds `props`. A script over all of them found:
- `room` is the whole room picture. Its rows 0-1 are the back-wall art, and only one map (small_room_closet_east_connections_only_1x1gu) has gaps there. Its name matches none of the named cases, so its depth is `roomWorldY + 0.4` (core/rooms.js:2081-2084).
- `walls` has 1,478 non-empty cells in rows 0-1. Every one of them has a `room` tile in the same cell, and only 190 have the same gid. Bespoke rooms put the generic office wall strip in `walls` and their own art in `room` (e.g. room_aes_control: `walls` row 1 is `0,12..19,0`, `room` row 1 is `711..720`). Row 0 of `walls` holds 29 non-empty cells across 14 maps (e.g. hall4x10, room_hospital_cto_office). Depth is `roomWorldY + 0.2` (core/rooms.js:2033-2034). The opaque `room` tile hides the `walls` tile beneath it: cropping every one of those 1,478 `room` tiles from its tileset image finds no pixel with alpha below 250.
- No other layer draws rows 0-1. `doors` is never created (core/rooms.js:2013-2016); doors are sprites.
- `roomWorldY = position.y + 64` (core/rooms.js:1995). Layers are created at `position.y` (core/rooms.js:2022), keyed by a unique id `${roomId}_${layerName}_${n}` in `rooms[id].layers` (core/rooms.js:2020, 2087), and start hidden with `setVisible(false)` and `setAlpha(0)` (core/rooms.js:2088-2089).
- Tiles under each door are removed with `removeTileAt(..., replaceWithNull = true)` in every layer when the layer is created (core/rooms.js:2026, and again for `walls` at 2038; systems/collision.js:154, 204-208, 265-270), so the doorway cells in S's rows 0-1 are null in every layer. N removes the tiles under its own south door the same way, and that door covers the same cells (below), so under an N/S doorway neither room draws any tile: only the door sprite covers it, and the camera clears to black (GAME_CONFIG sets no `backgroundColor`, utils/constants.js:76-107). Opening a door removes cells that are already null (systems/collision.js:412, 483-488, 564-570). `getTileAt` can return null in the strip. No other engine code removes or adds tiles, and each room parses its own Tilemap, so Tile objects aren't shared between rooms.

**Phaser 3.60 tile alpha and visibility.**
- WebGL draws each culled tile with `getTint(tile.tint, camera.alpha * layer.alpha * tile.alpha)` (src/tilemaps/TilemapLayerWebGLRenderer.js:27, 84). Canvas uses `ctx.globalAlpha = alpha * tile.alpha` (src/tilemaps/TilemapLayerCanvasRenderer.js:32, 121). The renderer is `Phaser.AUTO` (utils/constants.js:77), so either path can run.
- RunCull skips a tile when `!tile.visible || tile.alpha === 0` (src/tilemaps/components/RunCull.js:47, 66, 85, 104). `Tile` mixes in `Components.Alpha` and `Components.Visible` (src/tilemaps/Tile.js:44-46), and the alpha setter clamps with `Clamp(value, 0, 1)` (src/gameobjects/components/Alpha.js:145-147). `Clamp(NaN)` is NaN, and the WebGL packer turns NaN into alpha 0 (`((a * 255) | 0) & 0xff`, src/renderer/webgl/Utils.js:52), so a NaN alpha makes a tile vanish on WebGL. The fade must never write a non-finite value.
- No engine code writes `tile.alpha` or `tile.visible` (grep over core/ and systems/). npc-sight-occlusion.js reads tiles by index only (systems/npc-sight-occlusion.js:294). Tile alpha and tile visibility are free for the fade to own, and revealRoom's layer alpha multiplies with them.

**Time.** `update()` in core/game.js:2469 takes no parameters, although Phaser calls it as `sceneUpdate.call(this.scene, time, delta)` (src/scene/Systems.js:364). `scene.time` is a Clock with `now`, `startTime`, `timeScale` and `paused`, and **no `delta`** (src/time/Clock.js:57, 142, 353-355). The existing call `npcBehaviorManager.update(this.time.now, this.time.delta)` (core/game.js:2484) passes `undefined` for delta. `this.time.now` is the game loop's time, which advances by the raw frame gap (`this.time += this.rawDelta`, src/core/TimeStep.js:710 in `step()`). The fade reads `this.time.now` and keeps its own previous value (§6).

**Object sprites.**
- Every Tiled object, table, chair and scenario item is stored in `rooms[id].objects` (core/rooms.js:453-459, 736-739, 2271, 2542-2544, 2838). NPC sprites live in `rooms[id].npcSprites` and carry `_isNPC = true` (core/rooms.js:3292-3304; systems/npc-sprites.js:82). Door sprites live in `rooms[id].doorSprites` and `rooms[id].animatedDoors` (core/rooms.js:1999; systems/doors.js:1123-1225).
- `sprite.roomId` is set on scenario items (core/rooms.js:383), on items the player drops (systems/item-drop.js:161) and by the needs system's `dropHeld` (systems/npc-needs.js:3658). Tiled decor has none. The needs system's `placeHeld` lists a delivered slot under the room it is set down in and keeps `roomId` as the declared room on purpose (systems/npc-needs.js:3660-3690, header at 3660-3664). `stowSprite` lists a sprite under its recorded home room without touching `roomId` (systems/npc-needs.js:3295-3310). So `roomId` can name a room other than the one that lists and draws the sprite. The listing is what rooms.js, item-drop.js, npc-hostile.js:593 and placeHeld all keep current.
- When an NPC picks an item up it is deleted from its room's `objects` and marked `_npcCarried` (systems/npc-needs.js:3613-3625). npc-office-visuals moves carried items to the carrier's hands on `postupdate` (systems/npc-office-visuals.js:264-283, 558).
- Pickup by the player and consumables hide a sprite and set `active = false` without destroying it, and it can stay listed (systems/inventory.js:404-426; systems/consumables.js:250-255). revealRoom skips inactive objects (core/rooms.js:3094). Phaser's `destroy()` sets `active = false`, `visible = false` and `scene = undefined` (src/gameobjects/GameObject.js:835, 897-900), so `sprite.scene` tells a destroyed sprite from a merely inactive one.

**Sprites drawn for an object but not listed in `objects`.**
- Cosmetic copies: when a producer (a printer or copier) has no free output slot, the needs system adds a sprite on the producer, never takeable, kept in a private Map and destroyed by `removeCosmetic` (systems/npc-needs.js:3323-3344, 3776-3780). Its depth is the producer's + 1, so it draws over the producer.
- Seat overlays: while the player sits on a swivel chair, seating draws up to two crops of the chair's texture (armrests) above the seated proxy sprite (systems/seating.js:480, 836-842). They are positioned each frame by `place()` on `postupdate` (systems/seating.js:801-843, 1519-1522) and never copy the chair's alpha. The seated proxy itself is the player.

**Elevation is a depth bias only.** setDepthAndStore sets `elevation` from an explicit `position.elevation`, or for back-wall items `threshold - bottom`, so `bottom + elevation = S.y + 64` for every auto-elevated wall item; depth is `bottom + 0.5 + elevation + tiebreak` (core/rooms.js:429-453). Tiled objects and chairs do the same (core/rooms.js:2681-2686, 2722-2737). Table-group members get `elevation = 0` and depth `baseDepth + n * 0.01` (core/rooms.js:2531-2537). An item dropped on a table gets an elevation that lifts its depth to the table's (systems/item-drop.js:205-219; systems/table-drop.js:143-147). Every creation and move path (createSpriteFromMatch and the explicit-position override, core/rooms.js:538-541, 2441-2442, 2455-2456; item drops; needs `setCentre`, `stowSprite`, `dropHeld`, `placeHeld`; `updateSpriteDepth`, systems/object-physics.js:344-351; hostile loot, systems/npc-hostile.js:577-593) sets position from x/y alone. The sprite is drawn where its `x`, `y`, origin and display size put it. Elevation never moves it.

**Doors.**
- S's north door is centred at `S.y + 32`, 32 px wide and 64 px tall, so it lies wholly in the strip (systems/doors.js:92, 117, 440-441). N's south door is at `N.y + N.height - 32`, the same point (systems/doors.js:187, 209). Both rooms create a sprite for the same doorway once both are loaded: two identical `door_32` frames at the same place. N/S door depth is `doorBottomY + 0.45`, so S's north door sits at `S.y + 64.45` (systems/doors.js:481-487), above S's `walls` (+0.2) and `room` (+0.4) layers and above a player in the strip (player depth is about the feet + 0.5, core/player.js:958-969).
- Each door sprite carries `doorProperties` with `roomId`, `connectedRoom`, `direction`, `worldX`, `worldY`, `open` and `isSideDoor` (systems/doors.js:518-530).
- Opening a door sets the opener's sprite inactive, destroys it, and leaves it in its room's `doorSprites` with `open = true` (systems/doors.js:833, 860, 876). The far room's sprite is destroyed and spliced out (systems/doors.js:1001-1009). Open-door art goes into `animatedDoors` (systems/doors.js:1017-1240). Gate doors keep their sprite and flip `doorProperties.open` (systems/door-gates.js:200).
- door-gaps.js registers a doorway provider built on `calculateDoorPositionsForRoom` (systems/door-gaps.js:8-17), and interaction-walls.js treats a doorway as open unless an active, not-open door sprite for that pair exists in either room (systems/interaction-walls.js:152-161).

**Lighting.**
- The light map is a RenderTexture at `LIGHT_DEPTH` with MULTIPLY blend, so it darkens everything drawn below it, the player included (systems/lighting.js:368-375; utils/constants.js:18). It is half resolution (`RES = 0.5`), world-anchored with a 64 px margin round the camera view, and redrawn from scratch at most every 33 ms, or every frame while the view outruns the margin (systems/lighting.js:84-92, 1005-1014). Lighting runs only on WebGL: `initLighting` returns null on the Canvas renderer (systems/lighting.js:1507-1521). The game size follows the window (`game.scale.resize`, main.js:271-273), and `resizeLightMap` resizes the light map to match (systems/lighting.js:375, 440-446). When the next scenario has lighting off, `initLighting` sets `window.lightingSystem = null` without calling `destroy` (:1515-1517); textures belong to the game, not the scene, so a texture key the system added outlives it.
- One redraw (systems/lighting.js:1002-1200) is one batch between `beginDraw` and `endDraw`: clear, a white base fill (:1026-1028), then each room on screen in turn (:1030-1045, 1082-1190):
  - its ambient fill over `fillAreas(room)`, the colour `lerpColor(darkAmbient, litAmbient, level * dip)` (:1085-1090), where `level` is the mean of its ceiling panels' levels (`roomLevel`, :863-869), panels strike on and the faulty one dips (`updatePanels`, :871-894), and `dip` is the brownout factor (:984-1000);
  - ADD light stamps: ceiling panels (:1091), extra lights (:1092), emitter glows (:1133); MULTIPLY stamps: hue-keep patches (:1156-1161) and floor tints (:1178-1184); lock-flash hue patches (`drawFlashes`, :1186, 1486-1490);
  - for the player's room only, the phone torch: a pool and a beam, drawn only while that room's level is below 1 and cut at the room's edge (:1187, 1208-1227); NPC torches and glowing NPCs standing in the room's `fillAreas` (:1188-1189, 1234-1306).
  After every room: door spill (:1192, 1364-1420), then a black ADD stamp, because a 3.60 batch whose last stamp is MULTIPLY is lost at `endDraw` (:1193-1200). Every draw is an `rt.stamp` call (:1023, 1054, 1160, 1183, 1199, 1226, 1327, 1401, 1490).
- `fillAreas` gives the overlap strip to the room further south: the north room's fill leaves it out (systems/lighting.js:1330-1356). The fills are NORMAL-blend stamps, so a room drawn later overwrites anything an earlier room stamped onto its area. Rooms are drawn brightest first, then north before south among fully lit rooms, then the player's room first among equally dim ones (systems/lighting.js:1069-1080). That order is the only clipping the map has: a darker room's fill covers light that an earlier, brighter room stamped across the wall.
- How a batch reaches the texture in Phaser 3.60.0:
  - `beginDraw` calls `renderer.beginCapture`, which binds the renderer's one shared capture target (src/textures/DynamicTexture.js:898-920; src/renderer/webgl/WebGLRenderer.js:1107-1115). That target is made with `autoClear` (WebGLRenderer.js:843), so binding clears it to (0, 0, 0, 0) (src/renderer/webgl/RenderTarget.js:274-304). One texture's batch therefore can't be nested inside another's, and stamps in a batch compose only with what that batch drew.
  - `endDraw` copies the capture onto the texture with `blitFrame(capture, target, 1, clear = false, clearAlpha = false, erase, flipY = isSpriteTexture)` (DynamicTexture.js:1128-1157, call at :1144). `blitFrame` sets no blend mode unless erasing (src/renderer/webgl/pipelines/UtilityPipeline.js:344-409), and the copy shader passes texels through (`texture2D(...) * uBrightness`, src/renderer/webgl/shaders/Copy-frag.js). So the copy composites onto the texture with **the last blend mode the batch used**.
  - The Multi shader writes premultiplied colour (`texel = vec4(outTint.bgr * outTint.a, outTint.a)`, src/renderer/webgl/shaders/Multi-frag.js). The blend functions are NORMAL `[ONE, ONE_MINUS_SRC_ALPHA]`, ADD `[ONE, DST_ALPHA]`, MULTIPLY `[DST_COLOR, ONE_MINUS_SRC_ALPHA]` (WebGLRenderer.js:706-713).
  - That explains the closing black ADD stamp in lighting.js: after `rt.clear()`, a MULTIPLY copy onto the cleared texture gives (0, 0, 0, 0) and the map comes out transparent (no darkening), while an ADD copy onto it gives the capture unchanged.
  - `stamp` reads its options with `GetFastValue`, which falls back to the default only for an absent or `undefined` key: `alpha` 1, `tint` 0xffffff, `angle` 0, `rotation` 0, `scale` 1, `scaleX`/`scaleY` = scale, `originX`/`originY` 0.5, `blendMode` 0 (NORMAL), `erase` false, `skipBatch` false (DynamicTexture.js:437-493; src/utils/object/GetFastValue.js).
  - A `Frame` copies its source's WebGL texture handle once, when it is made (src/textures/Frame.js:79), and the sprite batch draws with the frame's own handle (src/renderer/webgl/pipelines/MultiPipeline.js:258). `DynamicTexture.setSize` deletes the old WebGL texture and makes a new one (RenderTarget.js:221-251), then gives the new handle and the new size to the source and to one frame only, `this.get()` (DynamicTexture.js:228-268, :232, :249-254). `Texture.get()` with no name returns `firstFrame` (src/textures/Texture.js:238-252), which is `'__BASE'` until the first `add`, and from then on the first frame added (Texture.js:114, 166-173). So after any crop frame exists, a resize updates that crop frame and leaves `'__BASE'` (and every other frame) with the deleted handle and the old size.
  - `DynamicTexture.width` and `RenderTexture.width` keep the size as passed, fractions included (DynamicTexture.js:264-265; src/gameobjects/rendertexture/RenderTexture.js:127-128); only the GL texture is rounded (RenderTarget.js:236-237). The light map is `(cam.width + 128) * 0.5` wide (systems/lighting.js:442), so an odd window width makes `rt.width` end in .5.
  - `snapshotPixel` reads synchronously (DynamicTexture.js:1489; WebGLRenderer.js:2841-2845; src/renderer/snapshot/WebGLSnapshot.js:40-48).
- A room's mode comes from its scenario block, `roomData.lighting.mode`, else the scenario's `defaultMode` (systems/lighting.js:460, 502). A motion room is lit only while `currentPlayerRoom` is that room or an NPC is in it (systems/lighting.js:549-550, 764-769, 897-930). A player in the strip counts as N, so a motion S with nobody in it stays dark.
- Emitter glows, LEDs, flames and lock flashes are separate images whose alpha lighting.js rewrites every frame. Emitters are built from `room.objects` (systems/lighting.js:582-597), so the object is reachable as `e.obj`. The per-object image alpha writes are:
  - LEDs, `setAlpha(ledA)` (systems/lighting.js:1110), always at `LIGHT_DEPTH + 2` (:743-746);
  - the glow, `setAlpha(...)` (:1152-1153), at `obj.depth + 0.01` in a lit room, `LIGHT_DEPTH + 1` in a dark one or for `above` variants;
  - flame tongues (:1166-1173);
  - lock flashes, `setAlpha(shape.alpha)` in `drawFlashes` (:1484), at `LIGHT_DEPTH + 2`, for an indicator record's object or a flash's `at.sprite` (:1469-1477).
- The light-map stamps are light, not art: the emitter stamp (:1133), hue-keep stamps (:1156-1161, :1486-1490) and floor tints (:1178-1184).
- `?lighting=off` or `localStorage.breakEscapeLighting = 'off'` turns lighting off (systems/lighting.js:349-355). Reduced motion is read at :247-249 and :365.

**Alpha writers on room objects.** revealRoom sets every layer to alpha 1, door sprites to 1, and active objects to `originalAlpha || 1` (core/rooms.js:3056-3106, writes at 3077, 3085, 3106). showRevealedObject does the same for one object (core/rooms.js:3047-3051). The `tint_objects` action can run a looping alpha tween on room objects (systems/apply-actions.js:318-325). Tweens and timers run on the scene `UPDATE` event, before `scene.update()` (src/scene/Systems.js:362-364). Inside `update()` (core/game.js:2469-2545):
- `updatePlayerRoom()` (:2480) can call revealRoom;
- `npcNeedsSystem.update()` (:2487) can reach `revealOutput` → `showRevealedObject` (systems/npc-needs.js:3712-3729), and moves items through pickUp, placeHeld and dropHeld;
- `doorGates.update` (:2496) flips gate `open` flags;
- `scenarioTimerDispatcher.update` (:2499-2501) fires actions that can end in `showRevealedObject` or start a `tint_objects` tween;
- `lightingSystem.update` (:2503-2505) writes only its own images;
- what follows (`checkObjectInteractions`, combat UI, bump effects, swivel rotation, the info label, :2512-2545) writes no room-object alpha; player-effects.js writes only the player's and its overlay's alpha.
- On `postupdate`: seating `place()` (overlays, above), npc-office-visuals `followHeld` (carried items) and npc-world-bubbles (UI) (systems/seating.js:1520; systems/npc-office-visuals.js:558; systems/npc-world-bubbles.js:188).
- Proximity ghosts are separate images at depth 9000 (systems/interactions.js:496-528). The lock glyphs of npc-office-visuals are containers at depth 5000 (systems/npc-office-visuals.js:402-410, 466-478). game.js `hideRoom` (core/game.js:2809) and doors.js `updateDoorSpritesVisibility` (systems/doors.js:1338) have no callers.

**Install.** Systems install from create the way seating does (`installSeating(this)`, core/game.js:1833; systems/seating.js:1519-1522). `rooms` is replaced at scene start (core/rooms.js:1010-1014). Rooms are loaded lazily and never unloaded.

## 2. Detection

New module **`systems/behind-wall-fade.js`**. Like interaction-walls.js it has **no imports**, so node tests can load it from a data URL. It repeats `TILE = 32` and `BACK_WALL_ROWS = 2` with a comment pointing at utils/constants.js `VISUAL_TOP_TILES`.

```js
export const FADE_ALPHA = 0.5;           // the faded k (§6) and the full-blend point of the strip light (§8)

// World rect of a room's back-wall rows, or null if the room has no map yet.
export function backWallStrip(room)
//   { left: pos.x, right: pos.x + map.widthInPixels, top: pos.y, bottom: pos.y + BACK_WALL_ROWS * TILE }

// Ids of the rooms whose back wall the player's body is behind.
//   body: { left, right, feetY } with left = player.body.x, right = left + player.body.width,
//         feetY = player.body.y + player.body.height (the bottom edge updatePlayerRoom uses)
export function roomsBehindWallAt(body, rooms, { margin = 4, doorways = () => [] } = {})
```

- Room S is included when the body's x-range overlaps the strip (`body.right > strip.left && body.left < strip.right`) and `strip.top + margin < feetY < strip.bottom`. Using the body's range, not its centre, means a player whose centre is just past S's side edge, with half the sprite behind S's corner column, still fades S. The 4 px margin stops a sliver of shoe on row 0 from firing it. The strip is open at the bottom, so feet on S's own floor (`feetY >= S.y + 64`) never count.
- The result is an array: a body over the seam of two side-by-side south rooms is behind both walls.
- No north room is needed. Outside S's x-range the player isn't behind S's wall, so width mismatches need no special case.
- **Open doorway suppression.** With `cx = (body.left + body.right) / 2` and `half = (body.right - body.left) / 2`, S is dropped when `|cx - d.x| <= 16 + half` for an **open** doorway `d` on S's north wall (16 is the door's half-width). Doorways come from a provider registered by door-gaps.js (below): entries `{ to, direction, x }` for S, of which only `direction === 'north'` count. A doorway is open unless S's or `d.to`'s `doorSprites` holds a sprite with `doorProperties.connectedRoom` naming the other room, `|doorProperties.worldX - d.x| <= 1`, `active !== false` and `!doorProperties.open`. That is interaction-walls.js's `doorClosed` rule (systems/interaction-walls.js:152-161) with an added x match for rooms joined by more than one door. It covers a door opened from either side (the opener is inactive, the far sprite is gone) and a gate door (sprite active, `open` toggles). A closed door doesn't suppress the fade: walking up to one from the north is the commonest way into the strip.
- **Player only.** NPCs walking behind walls never trigger it.
- Strip rects are cached and rebuilt when `Object.keys(window.rooms).length` changes, as lighting caches fill areas (systems/lighting.js:1337-1342).

Wiring: behind-wall-fade.js exports `setFadeDoorways(fn)`. door-gaps.js imports it and registers the same provider closure it gives interaction-walls.js (build the closure once, pass it to both). No test harness copies door-gaps.js (grep `test/js` for `door-gaps`: no hits), so the new import breaks no copy list.

## 3. What fades

| Thing | Fades? | Rule |
|---|---|---|
| S's tiles in rows 0-1, every column, every layer in `rooms[S].layers` | yes | One visible tile per cell, faded to k (§5). |
| S's tiles in rows ≥ 2 | no | S's floor, in front of the player. |
| Sprites listed in `rooms[S].objects` (items, conditional items, table items, tables, chairs, floor props, wall-hung objects) whose drawn rect reaches into S's strip | yes | §4. |
| Items in a faded table's group, whatever their own rect | yes | Followers, §4. |
| Cosmetic copies on a faded producer | yes | Companions, §4. |
| Seat overlays of a faded chair | yes | They copy the chair's alpha (§4). |
| Door sprites of any kind: closed N/S doors (S's and N's), destroyed openers, `animatedDoors`, gate sprites, E/W doors | no | Decision 9. No room draws a tile under an N/S doorway (§1), so a faded door would show black. §4. |
| Open doorways | no | Decision 4. The doorway cells hold no tiles (§1). |
| Sprites listed in any other room's `objects`, inside S's strip | no | Ownership, §4. They draw under S's wall; the fade reveals them. |
| NPCs (`_isNPC`, anything in `npcSprites`), NPC-carried items (`_npcCarried`), the player, the seated proxy | no | Decision 1. |
| Glows, LEDs, flame tongues and lock flashes of faded objects | yes | §8. |
| The light map and every stamp on it | no alpha fade | They are light, not art. The strip's light blends towards the north room's instead (§8). |
| Proximity ghosts, interaction indicators, lock glyphs, speech bubbles, combat UI | no | Overlays above the world. |

## 4. Candidates, ownership and the drawn rect

**Ownership.** S owns a sprite when `rooms[S].objects` lists it (by value: iterate `Object.values(rooms[S].objects)`). `roomId` is used only to break a tie: if `sprite.roomId` names another loaded room `R` and `Object.values(rooms[R].objects)` also lists the same sprite, R owns it and S skips it. So:
- N's items in N's bottom rows are listed in `rooms[N].objects` and never fade.
- A delivered slot that an NPC set down on a desk in S's back row is listed in S, keeps `roomId` = its declared room (placeHeld), draws above the desk, and fades with it.
- A carried item has left every `objects` map (systems/npc-needs.js:3625) and is also skipped by its `_npcCarried` mark.

The module doesn't use interaction-walls.js `roomOfTarget`, which trusts `roomId` first.

**Object candidates.** For S with a state, each tick, a sprite from `Object.values(rooms[S].objects)` is a candidate when all of these hold:
- it is truthy and `sprite.scene` is set (not destroyed);
- `sprite.active !== false` and `sprite.visible`;
- not `sprite._isNPC`, not `sprite._npcCarried`, no `sprite.doorProperties`, not `window.player`;
- S owns it (above);
- its drawn rect meets S's strip (below).

**Drawn rect.** The test uses the sprite as drawn, never its logical floor position:

```
if (!sprite.rotation):
    left   = sprite.x - sprite.displayWidth  * sprite.originX
    top    = sprite.y - sprite.displayHeight * sprite.originY
    right  = left + sprite.displayWidth
    bottom = top  + sprite.displayHeight
else:
    { left, top, right, bottom } = sprite.getBounds()   // axis-aligned box of the rotated sprite
inStrip = top < strip.bottom - 0.5 && bottom > strip.top && right > strip.left && left < strip.right
```

The 0.5 px keeps float noise from fading an item whose top sits exactly on `S.y + 64`. Origins differ between sprites (Tiled and scenario objects use origin 0; player drops and table-settled items use 0.5, systems/item-drop.js:136, 214), so the engine's `sprite.y + sprite.height` shortcut (core/rooms.js:432, 2723) is not used.

**Why elevation doesn't enter the test.** Elevation only raises depth; it never moves the sprite (§1). An object's logical floor position is `drawnBottom + elevation`. For every auto-elevated wall item that is exactly `S.y + 64` (core/rooms.js:441-451), and for an item on a desk it is the desk's front edge. Judged by that, no wall item and no desk item would ever be "in" the strip, which is wrong: their pixels are there and they cover the player. So the rule reads the drawn rect and ignores `sprite.elevation` and `position.elevation`. North and south objects of the same shape at the same place differ only by owner. Worked cases, all from the test scenario (§12) in room_reception:

| Object | Drawn rect (room-relative y) | Elevation | Logical floor | Fades? |
|---|---|---|---|---|
| Wall picture (picture9) | 17-34 | 30 (auto) | 64 | yes |
| PC on the reception desk (pc10, table group) | 36-64 | 0 | 64 | yes |
| Lockpick with `position: { y: 0.8, elevation: 32 }` | 26-56 | 32 | 88 | yes |
| Safe on the floor (safe3) | 62-95 | 0 | 95 | yes (2 px into the strip) |
| Reception desk (reception_table1) | 42-89 | 0 | 89 | yes |
| Safe (safe2) | 67-97 | 0 | 97 | no |
| Keycard with `position: { y: 2 }` | 64-74 | 0 | 74 | no |
| Note on the desk's front half (fade_desk_note, desk group) | 67-78 | 0 | 78 | yes, with its desk (table groups, below) |

The `elevation > 0` "hung on the wall" shortcut used elsewhere (systems/npc-sight-occlusion.js:230, systems/path-avoid.js:50) is not used either.

**Table groups (followers).** A deep desk whose top edge reaches the strip fades, and an item standing on its front half can have its whole rect below the strip. By the rect test alone that item would stay solid on a half-faded desk. So an item in a table's group fades whenever its table does (decision 8).
- *Finding the group.* Groups are built while a room is created, in a list local to that call (core/rooms.js:2121-2129, 2273-2274), and nothing keeps them afterwards. rooms.js gains one line in the final group pass (core/rooms.js:2524-2545), the one point where every member, scenario and unreserved, is in `group.items`: `group.table.sprite._tableItems = new Set(group.items.map(item => item.sprite));`. `group.table.sprite` is the table sprite for Tiled tables and for scenario-made ones alike (:2273).
- *Followers.* For each candidate object that carries `_tableItems` (a table reaching the strip), each member in the Set is a follower, with the table's factor k, when it passes the candidate filter above (scene set, active, visible, not an NPC, a carried item, a door or the player), S owns it, and it is still on the table: its drawn rect overlaps the table's drawn rect, or its bottom is on or up to 4 px above the table's top edge across the table's width (the back-edge allowance the grouping itself uses, `TABLE_BACK_EDGE_PX`, core/rooms.js:743, 778-795). A sprite goes into the tick's list once, whether it qualifies by its own rect, as a follower, or both.
- *Release.* The Set is never updated after load, so membership is checked every tick, never trusted. A member stops following when its table stops being a candidate (the player leaves the strip, or the table is pushed out of it), or when the member fails a test: picked up by the player (inactive), carried by an NPC (unlisted, `_npcCarried`), pushed or set down off the table, unlisted from S, hidden or destroyed. It then drops out of the tick's list and is released (§6 step 3, §7), unless its own rect still reaches the strip. A member set back down on the same table and listed in S again follows again on the next tick.
- Items put on a table after load (player drops, needs placements) are not in the Set; they fade by their own rect only (see "Noticed, not in scope").
- A follower's companions (a printer standing on a desk) are added like any candidate's.

**Companions (cosmetic copies).** An object sprite may carry `_fadeCompanions`, a Set of sprites drawn as part of it. Each candidate adds its companions that pass `scene` set, `active !== false` and `visible`, with the same factor, whatever their own rect. Two small changes in systems/npc-needs.js:
- `makeCosmetic` (3327-3344): after creating `sp`, `(prod.sp._fadeCompanions ||= new Set()).add(sp); sp._fadeOwner = prod.sp;`
- `removeCosmetic` (3776-3780): before destroying, `sp?._fadeOwner?._fadeCompanions?.delete(sp);`

A companion stops being a candidate when its producer does, or when it is removed or destroyed, and is then released like any other sprite.

**Seat overlays.** In systems/seating.js `place()`, the overlay chain at 840-841 gains `.setAlpha(chair.alpha)`. `place()` runs on `postupdate`, after the fade has written the chair's alpha that frame, so the armrests always match the chair, faded or not, and nothing else needs to know about them. (A seated player's feet sit at the chair's foot, which is on S's floor for any S chair, so in practice this shows only if a chair stands wholly inside a strip. The line costs nothing and keeps the rule simple.)

**Doors never fade.** The module reads `doorSprites` only for §2's open rule and never writes a door sprite's alpha. Door sprites live in `doorSprites` and `animatedDoors`, not `objects`, and the `doorProperties` test in the candidate filter keeps out any that turns up in `objects`. Next to a closed N/S door the fade still fires (a closed door doesn't suppress it), the wall tiles either side fade while the doorway cells have no tiles to fade, the door sprite stays solid over the black under it at `S.y + 64.45` (above both faded layers) and hides the player's legs, and in the light map its column is not a `gap`, so it blends to N's light with the wall beside it (§8.1).

## 5. Tile fade and the doubled row 1

`walls` (depth +0.2) and `room` (+0.4) both draw row 1, and in 13 maps row 0 too (§1). Fading both to 0.5 composites to `1 - 0.5² = 75%` and lets the generic `walls` art show through the bespoke `room` art. So the fade shows **one tile per cell**:

1. When S's fade starts, list S's layers in descending depth order (`layer.depth`), and for each cell `(c, r)` with `r ∈ {0, 1}` and `c ∈ [0, map.width)` find the first layer with a non-null tile. That tile is the cell's **face**. Every non-null tile below it is a **hidden** tile. In practice the face is the `room` tile and the hidden one is `walls`. In the closet map's gaps, `walls` is the face.
2. Each tick while k moves: `face.alpha = k`.
3. On the first tick of a fade, set `hidden.visible = false` (RunCull skips it, src/tilemaps/components/RunCull.js:47). The face is opaque art over it, so nothing changes on screen at k = 1.
4. When k reaches 1: `face.alpha = 1`, `hidden.visible = true`, then forget the cell list.

**Opaque cap band.** The north room N's bottom row sits under S's row 1, and its bottom 12 px are N's south-wall cap (2 px grey, 8 px white, 2 px grey). Seen through a 50% face tile that reads as a stray white stripe. So while S is faded, every row-1 cell that has a face tile gets a second display object: an Image of that tile's tileset frame cropped to its bottom `WALL_CAP_PX` (12) px, at alpha 1, centred on the bottom 12 px of the tile and drawn at the top of the band rows (`S.y + 52`). Everything above the band keeps fading with the tile.

- `WALL_CAP_PX` is a constant. `tools/survey_wall_cap.py` measures the cap on every bottom-row tile of every map in `assets/rooms/*.json` (148 maps, 107 tilesets, 1075 distinct frames) and finds 12 px for all of them, so nothing is computed per map. Re-run the script after adding a tileset.
- The crop is a sub-frame added once to the tileset texture (`bwf_cap_<local frame>_<side>`, keyed on `gid - firstgid` because tileset textures are shared across maps with different firstgids), so no per-frame allocation. The images are made with the cell list when the fade starts, and destroyed with it (release at k = 1, kill switch, `clear()` at shutdown, a replaced or removed room object).
- Flips and quarter turns: the side of the frame that ends up at the bottom of the screen is chosen from `tile.rotation`, `flipX` and `flipY` (`capBand`), and the image takes the same rotation and flips.
- Doorway cells are skipped: they have no tile, and any cell whose centre is within 16 px of a north doorway x from the provider (open or closed) is skipped as well, so a door sprite is never covered.
- Depth: the band is drawn at `S.y + 52`, the top of the band rows. That is above N's tile layers (at most `S.y + 0.4`, as rooms are at least 128 px tall) and N's south-wall cap, and below everything of N's that stands in the band rows: the player and NPCs at feet + 0.5 (a player hugging N's south wall has feet at about `S.y + 56..60`), N's floor objects at bottom + 0.5, and door sprites at `S.y + 64.45`. So the band covers only N's cap, and the feet show at 50% with the body. S's face at k sits above the band, and S's floor tiles in rows 0-1 are hidden tiles while faded, so nothing of S's lies between them. Where nothing stands, 0.5 of S's face over 0.5 of the band is exactly S's art.
- Each tick the image copies the face layer's `visible` and `alpha`, so a room that is not yet revealed shows no band.

Doorway cells are null in every layer (§1) and are skipped by the null test, so the doorway itself never fades. The cell list is built once per fade from the live layers. Tiles are never added after creation, and a tile removed later is orphaned: writes to it are harmless. Layer alpha (revealRoom's 1, the starting 0) multiplies with tile alpha, so a reveal mid-fade keeps the fade.

## 6. Fade factor and sprite fade

**Factor.** One `k ∈ [0.5, 1]` per south room, with target 0.5 while S is in `roomsBehindWallAt`, else 1.
- Time: `update(now)` is called with `this.time.now` (§1). The module keeps `lastNow`; `dt = now - lastNow`, clamped to `[0, 250]` ms (0 on the first call or if `now` goes backwards). Down: `k = max(0.5, k - 0.5 * dt / 150)`. Up: `k = min(1, k + 0.5 * dt / 200)`. Because the step is by elapsed time, a 2 fps headless run reaches the same values in the same game time as 60 fps.
- Reduced motion: if `matchMedia('(prefers-reduced-motion: reduce)')` matches (read the way systems/npc-sprite-style.js:100-102 does), k jumps to the target.
- Guard: if `!Number.isFinite(k)`, set k = 1 and run the release path (§7).
- No Phaser tweens: one controller owns k, and nothing is left to kill when a room or the scene goes.

**Sprites.** Records live in a `Map<sprite, { base, applied, roomId }>`, separate from any candidate list, following npc-sprite-style's base/applied scheme (systems/npc-sprite-style.js:133-151). Each tick, for each south room S with a state (k < 1, or k moving):
1. Build S's candidate list of `(sprite, factor)`: objects, the table-group followers of faded tables, and the companions of both, all with factor k (§4). A sprite already taken by another room this tick is skipped.
2. For each `(sprite, factor)`: if it has no record, or `|sprite.alpha - record.applied| > 1e-4` (someone else wrote alpha: revealRoom, showRevealedObject, a `tint_objects` tween), set `base = sprite.alpha`. Then `sprite.setAlpha(base * factor)`, `applied = sprite.alpha`, and `sprite.behindWallK = factor`.
3. Release every record of S whose sprite is not in this tick's list (§7).

**Hook placement.** The pass runs in `update()` directly before `lightingSystem.update` (§9): after updatePlayerRoom's reveals, the needs system's reveals and moves, door gates and scenario timers, and before lighting reads `behindWallK`. Nothing later in the frame writes room-object alpha (§1) except seating's overlays, which copy the chair. Every frame therefore ends with the faded value. A writer added later in the frame would win for one frame and be re-based on the next tick; say so in the module header.

## 7. Lifecycle and release

**Release of one record:**

```js
function release(sprite, rec) {
  try {
    if (sprite.scene && Math.abs(sprite.alpha - rec.applied) <= 1e-4) sprite.setAlpha(rec.base);
  } catch (e) { /* never break a frame */ }
  delete sprite.behindWallK;
  records.delete(sprite);
}
```

The only liveness test is `sprite.scene` (not destroyed). `active` and `visible` don't matter: a sprite the player picks up (inactive, hidden, maybe still listed) or a slot the needs system stows (hidden) gets its base alpha back, so it reappears at the right alpha if it is ever shown again. If another writer changed the alpha since the fade's last write, release leaves that value alone. Releasing is idempotent.

| Case | What happens |
|---|---|
| Player leaves the strip | k steps to 1 over 200 ms. At 1: every record of S released, faces at 1, hidden tiles visible, S's state deleted. |
| Sprite stops being a candidate mid-fade (pushed out of the strip, picked up by the player or an NPC, consumed, stowed, removed by room-state-sync, unlisted from S, hidden, moved off its faded table, or its table stops fading) | Released on that tick, so it never keeps `base * 0.5` elsewhere. |
| Sprite destroyed mid-fade | `sprite.scene` is unset; the record is dropped without a write. |
| A cosmetic copy is removed, or its producer stops being a candidate | The copy drops out of the list and is released (or dropped, if destroyed). |
| A closed door opens mid-fade | No sprite record changes: doors were never faded. If the player stands in the doorway, §2 suppresses the fade and S restores over 200 ms; either way `gaps` gains the doorway's x, so the light blend drops that column on the next redraw. |
| New object appears in the strip mid-fade (drop, NPC placement, reveal) | It becomes a candidate on the next tick and fades from its current alpha. |
| revealRoom or showRevealedObject mid-fade | Writes 1 (or `originalAlpha`) before the hook in the same frame; the hook takes it as the new base and fades it before render. Layer alpha 1 doesn't touch tile alpha. |
| S loads while the player is in its strip | S appears in `window.rooms`, the strip cache rebuilds, S gets a state at k = 1 and steps down. |
| S not yet revealed | Layers are invisible at layer alpha 0 and objects are hidden. Tile writes are harmless and hidden objects aren't candidates. |
| Player over the seam of two strips | Two states, each with its own k and records. |
| Doorway suppression switches on | S's target becomes 1 and it restores over 200 ms. |
| Reload or resume | Nothing is persisted. If the player spawns in the strip, k steps from 1 to 0.5. |
| `setEnabled(false)` | Releases every record, restores every face and hidden tile it can reach (each room in its own try/catch), clears all state and stops updating. |
| `?behindWallFade=off` or `localStorage.breakEscapeBehindWallFade = 'off'` | The controller starts disabled and never writes anything. |
| Scene shutdown | Clears records and state **without touching any display object**: the scene is destroying them anyway, and `rooms` is rebuilt on the next start (core/rooms.js:1013). |
| Non-finite k | Snaps to 1 and releases (§6). |

State is keyed by room id and re-read from `window.rooms` each tick, so replacing `rooms` leaves no stale room references. Records hold sprite references and are cleared at shutdown.

## 8. Lighting

### 8.1 The strip takes the north room's light

Today the strip is lit as S's: when S is a motion room with nobody in it, or a `dark` room, and N is lit, the player behind the faded wall would be a dark silhouette on a dark floor. Instead, while S is faded, each part of S's strip that lies over a north room N shows a blend of the two rooms' light:

```
light = (1 - w) * L_S + w * L_N,    w = clamp((1 - k) / (1 - FADE_ALPHA), 0, 1),  FADE_ALPHA = 0.5
```

`L_S` is what the map holds there today (S's fill and every stamp drawn after it). `L_N` is what it would hold if N owned that part: N's ambient fill plus N's own stamps (ceiling panels, extra lights, emitters, tints, the torch when N is the player's room, NPC torches and glows), plus door spill, which the main map draws over every room's fill whoever owns the floor. At k = 1, w = 0 and nothing changes; at k = 0.5, w = 1 and the strip is lit exactly as N's floor. N is in practice the player's room, since a player in the strip counts as N (§1). Where S's strip runs past N's edge over another loaded north room, that part takes that room's light with the same w, so a wide south wall has no light seam over a second north room. A part of the strip with no room north of it (a gap) keeps S's light.

**The weights.** The fade module computes w (it owns k and `FADE_ALPHA`) and exposes `window.behindWallFade.lightWeights()`: a reused array of `{ roomId, weight, gaps }` for rooms with weight > 0, empty when disabled or idle. `gaps` is a reused array of the x centres of S's **open** north doorways, by the same open rule as §2's suppression. A non-finite k gives no entry. lighting.js reads it through `window`, so it gains no import.

**The segments.** lighting.js exports a pure function:

```js
// For each { roomId: S, weight, gaps }: S's strip { x: S.x, y: S.y, w: S.width, h: 64 }
// intersected with the rect of every other room N that has a map and N.position.y < S.position.y,
// minus [gx - 16, gx + 16) for each gx in gaps (an open doorway keeps S's light, see below).
// Returns [{ south, north, x, y, w, h, weight }] in world pixels, non-empty pieces only.
export function stripBlendSegments(weights, rooms)
```

`update()` keeps a segment only if both S and N have a lighting state and are in this redraw's `visible` list (both passes were drawn).

**Why the open doorway is cut out.** An open N/S doorway lies wholly in S's strip (§1). Door spill lights it and the wall beside it (systems/lighting.js:1414-1418, the second stamp at `door.y + 8` with radius 45). Where S is brighter than N, blending the column would swap S's bright ambient under that spill for N's dark one at w = 1, leaving a dark band across the doorway between two lit floors. Leaving the doorway's 32 px column out of the segments keeps it as it is today, which matches decision 4 (the doorway doesn't fade). The wall either side still blends. Spill is in both `L_S` and `L_N` (the strip batch replays it, step 4 below), so its shoulders there keep their strength and only the ambient under them changes, which also softens the column's edges.

**Why a second texture.** `L_N` is not flat. N's last row of ceiling panels sits on the strip's top edge (panels are centred `(r + 0.5) * floorH / rows` below the floor top, systems/lighting.js:556-575; in a 10-row room the last row is at `N.y + 256`, which is `S.y`, radius 102), and the torch falls there too. A flat fill of N's ambient would cut N's pools with a hard line along the top of the strip. Stamping N's lights again into the main map would add them twice on N's floor. So `L_N` is drawn into a texture of its own, from a copy of the stamps N's pass makes.

**Why the blend is a second batch on the light map.** From §1: the main batch ends with ADD after `rt.clear()`, so the light map holds exactly the capture, `L_S`, at alpha 1 (the white base fill makes it opaque). A second batch on the light map, **without** `clear`, holding only NORMAL stamps of a frame whose texels are `(L_N, 1)` at alpha w, captures `(w·L_N, w)` inside each stamp and (0, 0, 0, 0) elsewhere. Its copy back uses NORMAL, the batch's last blend mode, giving `w·L_N + (1 − w)·L_S` inside and leaving every other pixel as it was. That is the blend wanted, and the main draw is untouched.

**The redraw.** `update()` changes in five places. Nothing changes on the idle path (no segments) except that the room loop draws through a variable that is always `rt`.

1. **Segments first.** After the `visible` loop (systems/lighting.js:1030-1045) and before the room loop, read `window.behindWallFade?.lightWeights?.()` (guard with try/catch; treat anything not an array as empty), call `stripBlendSegments`, keep the segments whose S and N are both in `visible`, and build `this.stripNorth`, a reused Set of the north room ids that have a segment. Store the segments for `stripBlendDebug`.
2. **One draw-target variable.** Introduce `let drawTarget = rt;` before the `fillRect` closure. The name must not be `target`: `update()` already declares `const target` inside `if (player)` (:1060) and `stampNpcTorches` does too (:1256). `fillRect` (:1019-1024) and `stamp` (:1049-1055) call `drawTarget.stamp`, and so do the two inline MULTIPLY stamps (:1160, :1183). Pass `drawTarget` instead of `rt` to `drawFlashes` (:1186), `stampTorch` (:1187) and `stampNpcTorches` (:1188, which hands it to `stampBeam`, :1269). `stampNpcGlows` (:1189) uses the `stamp` closure. At the top of each room's pass set `drawTarget = this.stripNorth.has(state.roomId) ? this.teeFor(state.roomId) : rt;` and after the loop set `drawTarget = rt` again. Door spill (:1192) is recorded too: when there are segments, set `drawTarget = this.teeFor('__spill')` for the spill loop and pass `drawTarget` instead of `rt` to `stampDoorSpill`, which covers both its stamps through the `stamp` closure (:1414-1418) and its direct `rt.stamp` for the closed-door leak (:1401, through its `rt` parameter). Then set `drawTarget = rt` before the closing black ADD (:1196-1199), which draws into `rt` only. With no segments, `drawTarget` stays `rt` and nothing is recorded. Also set `state.drawAmbient = ambient` beside `state.drawLevel` (:1086-1087). Image writes (glows, LEDs, flames) are unchanged: they happen once, during the loop.
3. **The tee.** `teeFor(roomId)` returns a small reused object with `stamp(key, frame, x, y, opts)` that calls `rt.stamp(key, frame, x, y, opts)` and then appends a command to `this.stripCmds` (a pooled array of plain objects, reused across redraws, with a live count reset to 0 at the start of each redraw). A command holds `roomId` (`'__spill'` for door spill), `key`, `frame`, `x`, `y` and a copy of the options. The copy writes **every** key of a fixed list, `STAMP_OPT_KEYS = ['alpha', 'tint', 'angle', 'rotation', 'scale', 'scaleX', 'scaleY', 'originX', 'originY', 'blendMode', 'erase', 'skipBatch']`, as `opts[key]` (so `undefined` where the source lacks it). A pooled object last used for a cone (`angle`, `originX: 0`) must not keep those keys when it is reused for a light stamp, and `stamp` treats only `undefined` as "use the default" (§1). The source objects (`stampOpts`, `multOpts`, `blockOpts`, `coneOpts`, the beam's options) are shared and mutated between calls, which is why the copy is taken at call time. The tee returns `rt`, like `rt.stamp`.
4. **Strip batch** (only when there are segments, after `rt.endDraw()`). Get the strip texture (below), then `strip.clear()`, `strip.beginDraw()`. For each north room in `this.stripNorth`, in `visible` order: fill each of its segments with its `drawAmbient` (a NORMAL `BLOCK_TEX` stamp over the segment's rounded RES rect, below, with `originX: 0, originY: 0, skipBatch: true`), then replay that room's commands in order (`strip.stamp(cmd.key, cmd.frame, cmd.x, cmd.y, cmd.opts)`). N's own fills never touch its segments, because `fillAreas` gives the whole of S's rect to S (systems/lighting.js:1336-1356), so replaying them is harmless. N's stamps land outside its segments too, which doesn't matter because only the segments are read. Two north rooms' segments never overlap; where one room's stamps reach the other's segment, the later room's fill covers them, the rule the main map follows. After every north room, replay the `'__spill'` commands once, in order, as the main map draws spill after every fill. They are ADD stamps; inside the segments the batch is an opaque fill, so ADD composes with `[ONE, DST_ALPHA]` at destination alpha 1, exactly as in the main batch. End with a black ADD stamp (as :1196-1199, with `skipBatch: true`, since a replayed MULTIPLY may be last) and `strip.endDraw()`.
5. **Blend batch.** `rt.beginDraw()` with **no** `rt.clear()`. For each segment, one stamp of a frame of the strip texture cropped to the segment: `rt.stamp(STRIP_TEX, frameName, sx, sy, cropOpts)` with `cropOpts = { originX: 0, originY: 0, alpha: weight, tint: 0xffffff, blendMode: Phaser.BlendModes.NORMAL, skipBatch: true }`. Then `rt.endDraw()`. This batch must hold NORMAL stamps only and must not end on ADD or MULTIPLY: put a comment on it saying the copy back depends on its last blend mode being NORMAL (§1).

**Every stamp in both new batches passes `skipBatch: true`.** Without it `stamp` calls `draw`, which runs its own `beginDraw`/`endDraw` (DynamicTexture.js:478-485, 616-623), closing the open batch after that stamp and sending the rest to whatever framebuffer is bound. The replayed commands already carry it (every lighting opts object sets it, :1018, 1047-1048, 1221, 1321, 1367); the strip fill, the strip's closing ADD and the crop stamps must set it themselves.

**Segment rects in RES pixels.** `ox = floor(view.x) - 64` (:1012), so `(seg.x - ox) * RES` is a half pixel whenever `ox` is odd. Convert each segment once: `x0 = Math.round((seg.x - ox) * RES)`, `x1 = Math.round((seg.x + seg.w - ox) * RES)`, the same for y, then clip to `[0, Math.floor(rt.width)] × [0, Math.floor(rt.height)]` (the width can end in .5, §1) and drop the segment if empty. The strip fill, the crop frame and the crop stamp all use this integer rect (`sx = x0`, `sy = y0`, size `x1 - x0` by `y1 - y0`).

**The strip texture.** `STRIP_TEX = 'be_light_strip'`. `getStripTexture()`:
- `const tm = this.scene.textures; this.stripTex = tm.exists(STRIP_TEX) ? tm.get(STRIP_TEX) : tm.addDynamicTexture(STRIP_TEX, rt.width, rt.height);` (src/textures/TextureManager.js:730-760, 1179, 1202). The `exists` check matters: a lit scenario, then an unlit one, then a lit one in the same page leaves the key behind (§1), and `addDynamicTexture` with a key that exists returns `null`.
- If `this.stripTex.width !== rt.width || this.stripTex.height !== rt.height`, call `this.stripTex.setSize(rt.width, rt.height)`. It is resized here, lazily, not in `resizeLightMap`.
- It is a texture only, never on the display list. `destroy()` (:1495-1504) removes it: `if (tm.exists(STRIP_TEX)) tm.remove(STRIP_TEX)` (TextureManager.js:261).

**Crop frames.** Frame names `seg0`, `seg1`, … in a reused list. For segment i: if `!strip.has(name)`, `strip.add(name, 0, x0, y0, w, h)` (src/textures/Texture.js:155-191, 219); else `frame.setSize(w, h, x0, y0)` (src/textures/Frame.js:357-401, which recomputes UVs from the current source size). Then, **every time, before the stamp**, `frame.glTexture = strip.getWebGLTexture()` (DynamicTexture.js:1502-1507). Without it a frame made before a window resize keeps the deleted WebGL texture (§1) and the strip draws black at w = 1 for the rest of the session. A resize also stretches `seg0`, the texture's `firstFrame` once it exists, to the whole texture (§1); the per-redraw `setSize(w, h, x0, y0)` puts it back before its stamp, so nothing else is needed. Always stamp a crop frame by name, never with a `null` frame.

**The probe.** The crop of a framebuffer texture (`flipY` set, DynamicTexture.js:254) and the second batch's composition are checked live before anything builds on them (slice 4, §13). If the crop samples the wrong rows, the frame's y becomes `strip.height - y0 - h`. If cropped frames can't be made to work, the fallback is to erase the strip texture outside the segments (`erase: true` block stamps over the `subtractRect` complements, systems/lighting.js:337-347) and stamp the whole texture once at the largest weight. That stamp names the frame `'__BASE'` explicitly (`stamp(STRIP_TEX, null, …)` would pick `seg0` if any crop frame was ever added), and before it, like a crop frame, gets `base.glTexture = strip.getWebGLTexture()` and `base.setSize(Math.floor(strip.width), Math.floor(strip.height), 0, 0)`, since a resize after a crop frame exists leaves `'__BASE'` with the old handle and size (§1). If the second batch does not composite as `(1 − w)·L_S + w·L_N`, stop and report: the design's blend rests on it.

**What it looks like, case by case.**

| N (player's room) | S | Strip at w = 1 |
|---|---|---|
| lit | motion with nobody in it, or `dark` | N's lit ambient and panel pools: the player, N's floor and the half-faded wall all read lit. S's floor in front of the wall stays dark. |
| dark (or motion, off) | lit | N's dark ambient with the player's torch pool and beam (drawn in N's pass while N's level is below 1, :1187, 1208-1227). The faded wall darkens with it. |
| dark | dark | N's dark ambient and the torch. Today S's later fill covers the torch in the strip (:1079-1080); now it shows. |
| lit | lit | N's ambient and pools; visible only where the two rooms' ambients differ. |

- **Motion and strike.** The blend never changes either room's state. S stays as its sensor leaves it: a player in the strip counts as N, so a motion S with nobody in it stays off, and if an NPC walks into S its lights strike as now and the S share of the blend follows. N's strike, faulty-panel dips (:871-894), brownout dip (:984-1000) and variants (:536-553) all come through N's teed stamps and `drawAmbient`, so the strip follows N's floor frame by frame.
- **More than one south room.** Over the seam of two strips each S has its own k, weight and segments; both crop from the same strip texture, which holds N's light once.
- **S wider than N.** Beyond N's edge the strip keeps S's light (or takes a second north room's). Where nothing lies north, the faded wall shows a step in light at N's corner. That is correct: nothing is behind it.
- **S's own light in the strip** (its panels' upper edge, the glow stamps of faded wall screens and racks, their floor tints and hue patches) is blended out by w there. On S's floor in front of the wall those stamps stay at full strength (decision 6); a screen faces into S, so its light belongs on S's floor, not on N's floor behind the wall.
- **NPCs standing in S's strip.** `stampNpcTorches` and `stampNpcGlows` place an NPC by `fillAreas`, which gives the strip to S (:1253, 1299). An NPC with a torch or a glow standing in the strip is drawn in S's pass, so inside a segment its light is weighted by (1 − w), and its beam stops at S's top wall. This is rare and accepted.
- **Door spill and the closed-door leak** are drawn after the room loop into the main batch, and recorded and replayed last in the strip batch, so they are in both `L_S` and `L_N` and the blend keeps them at full strength. Where S's open door throws a pool onto N's floor (S brighter than N), the pool runs on into the faded strip with no edge at the strip's top. Where S is brighter, the strip otherwise shows N's darker light (decision 5), except in the open doorway's column, which is not in any segment. Spill isn't drawn as a separate ADD-only batch on the light map because ADD over a transparent capture is `[ONE, DST_ALPHA]` with destination alpha below 1, so overlapping stamps wouldn't sum as they do in the main batch; replayed over the strip batch's opaque fill they do.
- **S's glows on N's floor.** When S is drawn after N (S dimmer, both equally dim with the player in N, or both fully lit, :1078-1080), S's light-map stamps that reach past the strip's top, chiefly its back-wall emitters' glows, land on N's floor. At w = 1 they are gone from the strip but stay on N's floor, so they end in a straight line along the strip's top edge. This is accepted (§11, risk 2).
- **Glow images under the map.** In a lit S, a faded object's glow image sits under the light map (:1152), so in the strip it is multiplied by the blended light. In a dark S it draws above the map and is unaffected.
- **Transition.** w follows k at lighting's redraw cadence (33 ms, :92, 1010), so the 150 ms fade-out reaches the light in about five steps. The redraw is not forced more often.

**Debug.** `lightingSystem.stripBlendDebug()` returns a plain, JSON-serialisable object (not a string) describing the last redraw: `{ at, segments: [{ south, north, x, y, w, h, weight, rect: [x0, y0, x1, y1] }] }` (world rect plus the rounded, clipped RES rect), an empty list when there were none.

### 8.2 Glows, LEDs, flames and lock flashes

The sprite pass sets `sprite.behindWallK` on each faded sprite and deletes it on release (§6-7). lighting.js multiplies by `(obj.behindWallK ?? 1)` at its four per-object image alpha writes:
- LEDs: `setAlpha(ledA * (obj.behindWallK ?? 1))` (systems/lighting.js:1110). LEDs sit at `LIGHT_DEPTH + 2` in every room (:743-746), so this applies lit or dark.
- Glow (:1152-1153), on both the `obj.depth + 0.01` and the `LIGHT_DEPTH + 1` paths. The multiplier goes **outside** the clamp: `setAlpha(Math.min(1, def.intensity * k * e.glowK * fade * (above ? e.fade : GLOW_BOOST)) * (obj.behindWallK ?? 1))`. Inside it, a value that `GLOW_BOOST = 1.3` (:98) pushed past 1 would be clamped back to 1 and not halved.
- Flame tongues (:1172), the same way: `Math.min(1, …) * (obj.behindWallK ?? 1)`.
- Lock flashes: `setAlpha(shape.alpha * (obj.behindWallK ?? 1))` in `drawFlashes` (:1484), where `obj` is the indicator record's object or the flash's `at.sprite`.

The light-map stamps (:1133, :1160, :1183, :1490) are not scaled by k: they are light falling on the room (decision 6). Lighting runs after the fade in the same frame, so it reads the current k and weights. lighting.js gains no import, so the lighting test harness copy lists (e.g. test/js/lighting-emitter-leds.test.mjs:13-26) don't change.

## 9. Hook and install

- The module exports `createBehindWallFade(env)` for tests, where `env` supplies `rooms()`, `player()`, `reducedMotion()` and `doorways(roomId)`, and returns `{ update, debugState, setEnabled, clear, lightWeights }`. `installBehindWallFade(scene)` builds one with `window` getters and the doorway provider from `setFadeDoorways`.
- `lightWeights()` returns the reused array of `{ roomId, weight, gaps }` described in §8.1, `weight = clamp((1 - k) / (1 - FADE_ALPHA), 0, 1)`, only for rooms with a state and weight > 0. `gaps` lists the x of each open north doorway of that room (§2's provider and open rule; reuse the entry's array). It allocates nothing when idle.
- `installBehindWallFade(this)` is called in create directly after `installSeating(this)` (core/game.js:1833). It reads `?behindWallFade=off` (or `0`) and `localStorage.breakEscapeBehindWallFade === 'off'` inside a try/catch (the pattern of systems/lighting.js:349-355), sets `window.behindWallFade = { update, debugState, setEnabled, lightWeights }`, and registers `scene.events.once('shutdown', clear)`.
- In `update()`, directly before the `if (window.lightingSystem) {` block (core/game.js:2503):
  ```js
  window.behindWallFade?.update(this.time.now);
  ```
  It must not read `this.time.delta` (§1).
- `update(now)`: if disabled, return. Detection (§2) with the player's body; step every room's k (§6); the tile pass for rooms whose k changed (§5); the sprite pass for rooms with a state (§6); delete the state of any room back at k = 1 with nothing left to restore.
- `debugState()` returns a plain, JSON-serialisable object (not a string), built fresh on each call: `{ enabled, rooms: { [id]: { k, target, weight, records, hiddenTiles } } }`, where `records` and `hiddenTiles` are counts. A room is present only while it has a state. Live steps read it directly, e.g. `debugState().rooms.hall?.k`.
- core/game.js gains one static import and the two calls; door-gaps.js one import and one call; npc-needs.js two lines; seating.js one chained call; core/rooms.js one line in the final table-group pass (§4); lighting.js four multipliers (§8.2) and the strip blend (§8.1: `stripBlendSegments`, `STRIP_TEX`, `STAMP_OPT_KEYS`, the `drawTarget` variable and `teeFor` (room loop and spill loop), `getStripTexture`, the strip and blend batches after `rt.endDraw()`, `stripBlendDebug`, and the texture's removal in `destroy`). No harness copies game.js or door-gaps.js as a module: tests read game.js as text (e.g. test/js/player-regen.test.mjs:72), and none mention door-gaps.js. npc-needs.js, seating.js and rooms.js gain no import. Grep `test/js` for all six names again before committing.

## 10. Performance

- Detection: a rect test per loaded room on cached rects, every frame.
- Tile pass: only while k moves (about 10 frames per transition at 60 fps). A 20-wide room is 40 face writes. The hidden-tile visibility toggles happen once at the start and once at the end.
- Sprite pass: only while a south room has a state. It covers that room's `objects` (tens of sprites), with arithmetic bounds except for rotated sprites (1-2 per room at most), and an ownership tie check only for strip sprites whose `roomId` names another room.
- Render: none extra. Tile alpha goes into the per-tile tint the batch already carries, and hidden tiles are culled.
- Idle (player in no strip, every k at 1): the detection loop and an empty map check.
- Lighting, idle: one `lightWeights()` call per redraw, returning an empty array, and the draw as today. The light map is already rebuilt from scratch on each redraw (systems/lighting.js:1005-1028); the blend adds no redraws and never shortens the 33 ms cadence.
- Lighting, while a strip is faded: the main draw is unchanged. The north room's stamps and the door spill (tens) are also copied into pooled command objects, so nothing is allocated per redraw after the first. Two extra batches: one on the strip texture (a clear, one fill per segment, the north room's stamps, the spill), and one on the light map with one or two cropped stamps; each costs one full-size copy at `endDraw`. GPU memory: one more texture the size of the light map, made on first use.

## 11. Risks

1. **N's bottom-row art shows through.** N's `room` rows under S's rows 0-1 (N's floor edge and south wall line) become half visible and may read as a doubled wall line. Check in the screenshots.
2. **S's glows end at the strip's top on N's floor.** When S is drawn after N, S's emitter stamps that reach onto N's floor stay there while the faded strip drops them (§8.1), so a glow from S's back wall is cut by a straight line along the strip's top edge. It is most visible when both rooms are dark, where the glows are the main light. Accepted: dropping those stamps from N's floor would change today's map when nothing is faded, and replaying them into the strip would put S's light back on the faded wall. It is not a bug for the implementer or the reviewer to report.
3. **Cropped frame of the strip texture and the second batch.** Neither is used elsewhere in this engine (§8.1). The probe settles the crop's orientation and the blend batch's composition before anything builds on them; §8.1 gives the fallback for the crop.
4. **A stamp that bypasses `drawTarget`.** A later edit that stamps onto `rt` directly inside the room loop still draws into the light map, but misses the strip texture, so that light is missing from `L_N` in the strip. A comment at `let drawTarget = rt;` says every stamp in the room loop and the spill loop goes through `drawTarget`, and the unit test that compares the main map's calls on the idle and blended paths (§12) catches a stamp issued only to one of them.
5. **The blend batch's last blend mode.** The copy back composites with the last blend mode of the batch (§1). Adding an ADD or MULTIPLY stamp to the blend batch would break it silently; the comment and the unit test that checks every stamp in that batch is NORMAL guard it.
6. **Light step at a north room's corner.** Where S's strip runs past N's edge with nothing to the north, the faded wall shows S's light beyond the corner and N's within it. It is correct, and only visible when the two rooms' light differs.
7. **A future alpha writer after the hook** (later in `update()`, or on `postupdate`) would win for one frame each time it writes. The base/applied scheme absorbs it on the next tick.

## 12. Test plan

Commit your own files (explicit paths, check `git diff --cached --stat`) before running anything: the tree is shared. Fixes go in follow-up commits.

### Unit tests (node)

`test/js/behind-wall-fade.test.mjs`, loading the module from a data URL as test/js/interaction-walls.test.mjs:17-25 does, and driving `createBehindWallFade` with an env. Plain objects stand in for rooms (`position`, `map`, `layers`, `objects`, `doorSprites`), layers (`depth`, `getTileAt`), tiles (`alpha`, `visible`, `index`) and sprites (`x`, `y`, `originX/Y`, `displayWidth/Height`, `rotation`, `getBounds`, `alpha`, `setAlpha`, `active`, `visible`, `scene`, `roomId`, `doorProperties`). Time is a number the test advances.

Detection:
- body inside the strip (in); feet on S's floor (out); within the 4 px margin (out);
- body centre 5 px past `strip.right` with the body overlapping it (in); body wholly past it (out);
- S wider than N, S narrower than N, left- and right-aligned (in only over S's x-range);
- body over the seam of two south rooms (both);
- feet in a gap with no room (still in);
- an open doorway: opener destroyed but listed, far sprite spliced out, gate door with `open = true` (all suppress); a closed door (doesn't suppress); body centre 26 px from an open door's x (in).

Factor:
- k reaches 0.5 after 150 ms and 1 after 200 ms of fake time, stepped at 16 ms and at 500 ms;
- a `now` that goes backwards, or a first call, gives dt 0;
- reduced motion jumps;
- a forced NaN snaps to 1 and releases everything;
- `lightWeights()`: weight 0 (no entry) at k = 1, 0.5 at k = 0.75, 1 at k = 0.5; empty when disabled, idle, or after a forced NaN; the same array object on every call; `gaps` holds the x of an open north doorway (opener destroyed, gate `open = true`) and not of a closed one.

Tiles:
- a cell with `room` and `walls`: the `room` tile goes to 0.5, the `walls` tile is hidden, the composite is 50%;
- a `walls`-only cell (closet gap) fades;
- a null doorway cell is skipped;
- row 2 is untouched;
- at k = 1 every face is 1 and every hidden tile is visible again.

Sprites:
- the eight worked cases in §4, including the explicit-elevation item, the 64 px boundary and the desk-group note;
- table followers: a deep table reaching the strip, with `_tableItems` holding a member whose rect is wholly below the strip, a back-edge member (bottom 3 px above the table's top) and a member that has been moved off the table: the first two fade with the table, the third doesn't; a member deleted from S's `objects`, one set inactive and one marked `_npcCarried` are released that tick; when the table leaves the strip every member is released, and a member whose own rect reaches the strip stays at k; a member listed in N (ownership) is untouched; a member that is also in the strip by its own rect has one record;
- a rotated prop uses `getBounds()`;
- an N-owned item in S's strip (listed in N's `objects`) is untouched;
- a placeHeld-style sprite (listed in S, `roomId = N`, depth above a faded table) fades;
- a sprite listed in both S and N with `roomId = N` is untouched by S;
- an NPC, a carried item and the player are untouched;
- a sprite carrying `doorProperties` listed in S's `objects` is untouched, and no sprite in any `doorSprites` list is ever written;
- a producer with a cosmetic companion: both fade; removing the companion from the Set releases it; a destroyed companion's record is dropped;
- a revealRoom-style `alpha = 1` mid-fade is re-based and faded the same tick;
- a pulsing writer (alpha changes every tick) ends each tick at `its value * k`;
- restore leaves a third party's alpha alone;
- a sprite deleted from `objects` mid-fade, one pushed out of the strip, and one set `active = false, visible = false` (player pickup) all end at their base alpha;
- a destroyed sprite (`scene` unset) is dropped without a write;
- `clear()` touches no sprite or tile; `setEnabled(false)` restores everything even when one room's `getTileAt` throws.

Other modules:
- test/js/npc-needs-slots.test.mjs (it drives `createEngineWorld` with a fake window): give the fake `game.add.sprite` a stub, exhaust the pool, and check the cosmetic is in `producer._fadeCompanions` with `_fadeOwner` set; `removeCosmetic` takes it out.
- Static checks: core/game.js calls `behindWallFade?.update(this.time.now)` inside `update()` after `scenarioTimerDispatcher.update` and before `lightingSystem.update`, and that call doesn't contain `time.delta`; door-gaps.js registers the fade's doorway provider; seating.js's overlay chain in `place()` contains `.setAlpha(chair.alpha)`; core/rooms.js's final table-group pass sets `group.table.sprite._tableItems` from `group.items`.
- Lighting multipliers: in test/js/lighting-emitter-leds.test.mjs (or a new file on the same harness), an emitter object with `behindWallK = 0.5` gets half its LED, glow and flame alpha, and one without it is unchanged; a glow whose unclamped alpha is above 1 (a lit room, `GLOW_BOOST`) comes out at exactly 0.5 with `behindWallK = 0.5`; in test/js/lighting-workstation-indicators.test.mjs's flash rig (:193), a flash on an object with `behindWallK = 0.5` draws at half `shape.alpha`.
- Strip blend, `test/js/lighting-strip-blend.test.mjs`, a new file with the copy list of test/js/lighting-emitter-leds.test.mjs:13-26 and its `Phaser` mock (:28), with **`NORMAL: 0` added to `BlendModes`** (the existing mock has only `ADD: 1, MULTIPLY: 2`). Fake textures log `clear`, `beginDraw`, `endDraw`, `stamp` (with a snapshot of its opts), `add`, `has`, `get`, `setSize` and `getWebGLTexture` (the pattern of test/js/lighting-workstation-indicators.test.mjs:205); a fake texture manager provides `exists`, `get`, `addDynamicTexture` and `remove`. To run `update(time)` itself, build the system with `Object.create(LightingSystem.prototype)` as the flash rig does (:193-204), give it a fake scene (`cameras.main.worldView` with `x, y, right, bottom`, `textures`), a fake `lightMap` (`x, y, width, height, displayWidth, displayHeight, setPosition, clear, beginDraw, endDraw, stamp`), `flashes = new Map()` (`update()` reads `this.flashes.size`, :1186), `config = {}`, `reducedMotion = true`, `tmpCentre = { x: 0, y: 0 }` (else :1081 calls `Phaser.Math.Vector2`, which the mock lacks) and `rooms`, a Map of room states. Build each state with `sys.configureRoom(state, room, { panels: false })` as the flash rig does (:200), which sets `litAmbient`, `darkAmbient`, `panelAdd`, `panelColor` and `glowLitFade`, then give it `roomId`, `level`, `on`, `panels`, `extraLights: []` and `emitters: []`; stub the per-room and per-frame helpers that aren't under test on the instance (`subscribe`, `checkNpcMotion`, `resolveRoomVariant`, `updatePanels`, `refreshEmitters`, `roomLevel`, `collectFigures`, `stampNpcTorches`, `stampNpcGlows`; `roomLevel` returns `state.level`), replace `stampDoorSpill` with a stub that makes one stamp through the `stamp` closure it is given and one through its `rt` argument (the closed-door leak path), so the test can see both reach the light map and the spill commands, and give at least one north room a panel so its pass issues a light stamp. `window.rooms` holds the matching `{ position, map }` objects and `window.behindWallFade.lightWeights` returns the weights under test.
  - `stripBlendSegments`: one S under one N gives the strip ∩ N with the weight passed in; S wider than N gives a segment over N's x-range only; two north rooms over one S give two segments; two south rooms under one N (the seam) give one each; a room level with or south of S, or without a map, gives none; no weights give `[]`; a gap at x = 48 splits `[0, 320)` into `[0, 32)` and `[64, 320)`; a gap at the strip's edge leaves one piece.
  - Option copy: copy `blockOpts`-shaped options (`originX: 0, scaleX, scaleY`) into a pooled command, then reuse the same command for `stampOpts`-shaped options (`blendMode: ADD, alpha, tint, scale`): `scaleX`, `originX` and `angle` are `undefined` afterwards; changing the source object after the call leaves the command unchanged.
  - Tee: on a redraw with one segment, the light map's stamp calls in the main batch are the same, in the same order and with the same options, as on the same scene with `lightWeights()` empty (the main map doesn't depend on the blend). Only the north room's pass and the spill are recorded: S's stamps are in no command, and every spill stamp (the stub runs once per visible room) is recorded once, under `'__spill'` only.
  - Strip batch: after the light map's first `endDraw`, the strip texture gets `clear`, `beginDraw`, a NORMAL fill of each segment's rounded RES rect in N's `drawAmbient`, N's commands in order, then the spill commands in order (after every north room's fill and commands, and only once with two north rooms), a final ADD stamp, `endDraw`. Every stamp in the strip batch and the blend batch has `skipBatch === true`.
  - Blend batch: then the light map gets `beginDraw` with **no** `clear` between the first `endDraw` and it, one stamp per segment with `alpha === weight`, `blendMode === Phaser.BlendModes.NORMAL`, origin 0 and the segment's frame at its rounded position, and `endDraw`. Every stamp in that batch is NORMAL.
  - Rounding: with an odd `ox` (camera `worldView.x` such that `floor(view.x) - 64` is odd) and a light map whose `width` ends in .5, every strip fill, crop frame and crop stamp has integer x, y, width and height, and a segment partly outside the map is clipped to `Math.floor(width)`.
  - Resize: a fake `setSize` that swaps the object `getWebGLTexture()` returns; after it, the next blended redraw's crop frames carry the new handle at stamp time. A second redraw at the same size calls `setSize` no more.
  - Key reuse: with `exists(STRIP_TEX)` already true, the system calls `get`, not `addDynamicTexture`; `destroy()` calls `remove(STRIP_TEX)`.
  - Idle: with `lightWeights()` empty (or `window.behindWallFade` absent, or `lightWeights` throwing), no strip texture is made, `stampDoorSpill` is handed `rt` itself and nothing is recorded, there is one `beginDraw`/`endDraw` pair on the light map, and `stripBlendDebug().segments` is empty.

After committing (§13), run `bin/test-js test/js/behind-wall-fade.test.mjs`, then the full `bin/test-js`, then, after the slice 2 and slice 4 commits, `bin/rails test` and `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` (AGENTS.md:181).

### Scenario: `scenarios/test_behind_wall_fade/`

`scenario.json.erb` plus `mission.json` (copy scenarios/test_vertical_layout/mission.json's shape, `"collection": "testing"`). All rooms unlocked, no locks, `"disableAttacks": true`. Start room `hall`. Top-level `"lighting": { "enabled": true, "defaultMode": "on" }` (as scenarios/test_clone_left_card/scenario.json.erb:12).

```
              x=0         320         640
   y=-256  +-----------+
           |  office_n |  room_office 10x10
   y=0     +===========+===========+          <- hall's strip y 0..64 (office_n covers x 0..320 only)
           |          hall         |  room_pnw_genhall 20x10 (start)
   y=256   +===========+===========+          <- strips of reception and server, y 256..320
           | reception |  server   |  room_reception 10x10, room_hq_servers 10x10
   y=576   +-----------+-----------+
```

Connections: `hall.north = "office_n"`, `hall.south = ["reception", "server"]`, and the reverse on each. Positions this produces (expect them; confirm live from `window.rooms[id].position`):
- `hall` (0, 0): the start room is placed at the origin (core/rooms.js:1798-1799).
- `office_n` (0, -256): a single north neighbour of a different width, even parity at (0, 0), so left-aligned (core/rooms.js:1412-1437).
- `reception` (0, 256) and `server` (320, 256): the group's total width equals the hall's, so it starts at the hall's x (core/rooms.js:1537-1590).
- Doors: office_n/hall at x = 48, y = 32; hall/reception at x = 48, y = 288; hall/server at x = 592, y = 288 (systems/doors.js:75-117, 180-232). All clear of the seam at x = 320.

Slots are matched by image base type (trailing digits stripped, core/rooms.js:186-206, 229-241), searching the `items`, `table_items`, `conditional_items` and `conditional_table_items` layers in that order and taking the first unreserved match in Tiled order (core/rooms.js:261-283). A type with no slot in the room goes to a random spot and then to its explicit `position` (core/rooms.js:2450-2460), with depth from setDepthAndStore, which honours `position.elevation` (core/rooms.js:436-438). Object order in the scenario matters.

**`office_n`** (room_office). One object:
- `{ "type": "keycard", "id": "north_card", "name": "North card", "position": { "x": 8, "y": 8 } }`. room_office has no keycard slot. Drawn at world x 256-272, y 0-10: inside the hall's strip, listed in office_n, depth 10.5, so it draws under the hall's wall and must stay at alpha 1.

Room block `"lighting": { "mode": "dark" }`: the dark north room over a lit south room, so the hall's strip takes office_n's dark light and the player's torch while faded.

**`hall`** (room_pnw_genhall). No scenario objects. Its own map objects in rows 0-1 (the sign at x 96-163, the ATS and batteries, the hose reel at x 566-602, top 17) cover "S wider than N": the whole width fades, including x > 320 where office_n doesn't reach.

**`reception`** (room_reception). Its unreserved map objects are drawn without any scenario entry: wall pictures (picture9 top 17, picture11 top 24, picture10 top 23, picture1 top 21), reception_table1 (top 42) and its lamps, plants and phone1. Scenario objects, in this order:
1. `{ "type": "pc", "id": "fade_pc", "name": "Reception PC" }` → conditional_table_items pc10 (top 36), joins the desk's table group. It is a `screen` emitter, so its glow halves.
2. `{ "type": "safe", "id": "fade_safe_low", "name": "Low safe", "locked": false }` → safe2 (x 219-243, top 67): wholly below the strip, must stay at 1.
3. `{ "type": "safe", "id": "fade_safe_edge", "name": "Edge safe", "locked": false }` → safe3 (x 85-109, top 62): 2 px into the strip, fades.
4. `{ "type": "key", "id": "fade_key", "name": "Wall key" }` → conditional `key` slot on the wall (x 125, top 23), fades.
5. `{ "type": "lockpick", "id": "fade_elevated", "name": "Shelf lockpick", "position": { "x": 8.6, "y": 0.8, "elevation": 32 } }`. room_reception has no lockpick slot. Drawn at room-relative x 275-301, y 26-56 with `sprite.elevation === 32`: the explicit-elevation case, fades.
6. `{ "type": "keycard", "id": "fade_floor_edge", "name": "Floor card", "position": { "x": 8.6, "y": 2 } }`. Drawn at y 64-74: top exactly on the strip's bottom edge, must stay at 1.
7. `{ "type": "notes", "id": "fade_desk_note", "name": "Desk note", "text": "Back in five.", "position": { "x": 6.3, "y": 2.1 } }` → the first `notes` slot, conditional_table_items notes3 (14x11; `notes` has no slot in any other layer), moved by its explicit position to room-relative x 202-216, y 67-78. That rect overlaps the reception desk (x 76-250, y 43-90), so it joins the desk's group (core/rooms.js:834-848), clear of the NPC (x 120-200) and safe2 (from x 219). Its own rect is below the strip: it must fade only because the desk does (§4, table groups).

Do not use `bag`, `notes`, `phone`, `laptop`, `lamp`, `plant` or `box` for 5 and 6: room_reception has slots for all of them. NPC (format as scenarios/test_clone_left_card/scenario.json.erb:56-62): `{ "id": "fade_npc", "displayName": "Receptionist", "npcType": "person", "position": { "x": 5, "y": 2.6 }, "spriteSheet": "male_office_worker_v2" }`. NPC positions are the sprite centre (systems/npc-sprites.js:314-321), so its 80 px frame reaches up to about room y 43, inside the strip, while its feet stand on the floor in front of the desk. It must not fade. If the engine nudges it so its drawn top is at or below room y 64, move it up until it reaches the strip.

**`server`** (room_hq_servers). No scenario objects. hq_server_sign1 (top 13), suppression_panel1 (`pulse` emitter, top 21), ups_cabinet1 (`screen` with LEDs, top 42) and the racks (`blink` with LEDs, tops 38-43) are in rows 0-1. Room block `"lighting": { "mode": "motion" }` (read as `roomData.lighting`, systems/lighting.js:460, 502). It has no NPC, so it stays dark until the player walks in: the main lighting check, where the strip must take the lit hall's light while the server's floor stays dark.

Run the validator (`validate-scenario` skill). To load the scenario without `db:seed`: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_seating test_behind_wall_fade` (tools/playtest/swap-scenario-game.rb:3-15; `test_seating` is the host mission its header names, and any seeded test mission works). It prints `GAME_ID=<id>`.

### Live browser proof on :3001

Keyless server: `tools/playtest/start-keyless-server.sh`. Never touch :3000. Drive with the playtest-scenario skill's bridge, headless.

1. After the popups close, apply the headless loop fix once: `g=window.game.sys.game; g.loop.smoothStep=false; g.loop.minFps=1; window.game.physics.world.setFPS(20);` (NOT `fixedStep=false`: it tunnels through 8 px wall boxes, see docs/achitechture/HANDOVER_NPC_AVOIDANCE.md). Without it physics runs about 60x slower than game time and walks look stuck. Every `__test.waitUntil` below takes the predicate as arrow-function source, e.g. `__test.waitUntil('() => window.behindWallFade.debugState().rooms.hall?.k === 0.5')`: the bridge evaluates `return (<source>)` and calls what comes back (systems/test-bridge/index.js:1564-1570), so a bare expression fails. `debugState()` and `stripBlendDebug()` return plain objects, read directly.
2. **Load the other rooms.** At start only `hall` exists; other rooms are created when a door is opened or an NPC route needs them (core/game.js:2099-2100; systems/doors.js:693-695, 810-812), and the fade and lighting see only loaded rooms. Load them without opening any door: `await window.loadRoom('reception'); await window.loadRoom('server'); await window.loadRoom('office_n');` (`async function loadRoom(roomId)`, core/rooms.js:921, exposed at :3436; it fetches the room, loads its NPCs, creates it and reveals it, and returns nothing). Then check, and stop and report if any check fails:
   - `window.rooms[id].position` for all four rooms matches the expected values above;
   - every door sprite of the three doorways is present, `active`, and `!doorProperties.open` (ids as the bridge names them: `door:hall->office_n`, `door:hall->reception`, `door:hall->server` and their reverses);
   - `lightingSystem.rooms.get('server').on === false`;
   - the reception objects' drawn tops, `fade_elevated.elevation === 32`, and the NPC's drawn top match §12's scenario notes;
   - `fade_desk_note`'s drawn top is room y 67 and the reception desk's `_tableItems` holds it.
3. **Light sampling and calibration.** Define `lightAt(wx, wy)` in the page: it returns `[r, g, b]` read synchronously by `lightingSystem.lightMap.texture.snapshotPixel(Math.floor((wx - map.x) * 0.5), Math.floor((wy - map.y) * 0.5), cb)` (§1: the read is synchronous, so a sample is never split across a redraw). Sample points must lie inside the light map (the camera view plus 64 px), so take them near the player. Calibrate at step 7's start position: `moveTo(440, 200)`, choose step 7's x_s, and read B (x_s, 240) on the lit hall floor and C (x_s, 400) on the dark server floor. B must read bright (luma above 0.6) and C dark (luma below 0.2). If they come out swapped, the read is flipped in y: use `map.height - 1 - y` and record that in the report. If both are bright, the server is lit: check step 2's `on === false` again before anything else.
4. **Hall from office_n (dark north room, lit south room).** `__test.enterRoom('office_n')` (it opens the office_n/hall door and walks through), `__test.moveTo(160, -100)` (office_n floor, clear of its desks and chairs and 112 px from the door), then `__test.walk('down', …)` until the wall stops the player. Use `walk` for the last leg, not `moveTo`: moveTo synthesises a click, and a click on a wall object interacts instead of walking (systems/test-bridge/index.js:60-67, 113-117, 1166). Then:
   - `__test.waitUntil('() => window.behindWallFade.debugState().rooms.hall?.k === 0.5')`;
   - tile check: the hall layer whose name contains `_room_` has `getTileAt(19, 0).alpha === 0.5` (beyond office_n's x-range, so the full width fades), and the `_walls_` layer has `getTileAt(10, 1).visible === false`;
   - the hose reel at 0.5, and `north_card` at 1;
   - lighting, after 50 ms: `stripBlendDebug().segments` holds two entries for `{ south: 'hall', north: 'office_n', weight: 1 }`, at x 0, w 32 and x 64, w 256 (the open doorway's column, x 32-64, keeps the hall's light). Pick an x in 220-310. That range keeps x at least 60 px from `player.x` (160; the torch pool has radius 40 and a downward beam here is about 24 px either side) and at least 130, clear of the hall's door spill: the hall's open door throws a pool onto office_n's floor at (48, −6) with radius 70.4 (systems/lighting.js:1414-1415), and `48 + 70.4 + 8 ≈ 127`. Spill is in both A's and B's light (§8.1), but A and B lie at different distances from the pool's centre, so inside its reach they differ by its falloff, not by any fault. Within 220-310, also keep x farther from every office_n emitter's centre (the object's centre plus `def.offsetX/offsetY`) than that emitter's `def.radius` + 8 (`lightingSystem.rooms.get('office_n').emitters`; lamps reach 80 px, screens 44-72). If no x qualifies, report it and use the x in 220-310 farthest from every emitter. Take A (x, 40) in the strip and B (x, -20) on office_n's floor: A matches B within 6/255 per channel (the strip is office_n's dark light). A point at (480, 40), beyond office_n, matches its value from step 12 (fade off) within 6/255 (skip it, and say so, if it lies outside the light map at this camera position): the strip keeps the hall's light where nothing lies north. The spill pool runs into the strip without an edge: `lightAt(100, 3)`, just inside the strip, matches `lightAt(100, -3)`, just above it, within 6/255 per channel (both lie in the pool, about 52 px from its centre; without the spill replay they differ by the pool's light, roughly 15/255). A point at the torch pool's centre (`player.x`, `player.y + 6`, systems/lighting.js:1212, 1220) is brighter than A;
   - screenshot.
5. **Reception from the hall, closed door.** `moveTo(48, 200)` (hall floor, outside every strip, lined up with the door), then `walk('down')` until the closed door stops the player. Expect:
   - `debugState().rooms` holds only `reception`, at 0.5;
   - reception's `_room_` layer at 0.5 in cells (0, 1) and (2, 1), either side of the door, and null at (1, 1), the doorway;
   - both door sprites of the doorway (`door:reception->hall` and `door:hall->reception`) at alpha 1 with no `behindWallK`;
   - screenshot: the wall either side half-faded, the door solid, the player's legs hidden behind it.
6. **Reception objects.** `moveTo(160, 200)`, then `walk('down')` to the hall's bottom wall. Expect reception at 0.5 with:
   - picture9, the desk, `fade_pc`, `fade_safe_edge`, `fade_key`, `fade_elevated` and `fade_desk_note` (a follower of the desk) at half their base alpha;
   - `fade_safe_low`, `fade_floor_edge` and `fade_npc` unchanged;
   - a screenshot.
   Glow check (slice 3 on): before walking down, set `lightingSystem.reducedMotion = true`, which freezes the screen flicker (`still`, systems/lighting.js:1068, 1115). Take the emitter whose `obj` is `fade_pc`'s sprite from `lightingSystem.rooms.get('reception').emitters`. Once reception is at 0.5, wait 50 ms and read `glowFaded = e.glow.alpha`. Walk back north to the hall's middle, `waitUntil('() => !window.behindWallFade.debugState().rooms.reception')` (k is back at 1 and `behindWallK` is gone; one frame after leaving it is still about 0.53), wait 50 ms and read `glowFull`. Expect `glowFaded / glowFull` within 0.5 ± 0.01. Set `reducedMotion` back to its old value.
7. **Server strip in the hall's light (main lighting check).** `moveTo(440, 200)` (hall floor above the server, 152 px from the hall/server door at x 592). x 413-469 is clear of the hall's bottom props (the cable trolley ends at x 412 and the transformer starts at 470, room_pnw_genhall), so walking down from here stops at the hall's bottom wall with the feet at about y 312. Use x_s from step 3: in 330-550 (clear of the closed door's light leak at 576-608), at least 60 px from 440, and farther from every server emitter's centre than its `def.radius` + 8 (`lightingSystem.rooms.get('server').emitters`). The UPS and racks span x 413-608, so few x qualify; if none does, use the x in that range farthest from every emitter and say so. Take three points: A (x_s, 300) in the server's strip, B (x_s, 240) on the hall floor just above it, C (x_s, 400) on the server floor. Record all three and take screenshot 1 (unfaded). Then `walk('down')` to the bottom wall, `waitUntil('() => window.behindWallFade.debugState().rooms.server?.k === 0.5')`, and wait 50 ms more. Expect:
   - `lightingSystem.rooms.get('server').on === false` throughout (the motion sensor still sees nobody);
   - a segment `{ south: 'server', north: 'hall', x: 320, w: 320, weight: 1 }`;
   - A now at least 3 times its unfaded luma, and at least 0.6 times B's luma (the hall's ambient and the tail of its last panel row);
   - C unchanged from its unfaded value within 6/255 (no light leaks onto the server floor);
   - the server rack LEDs and glows at half alpha (slice 3 on). Rack glows flicker (`blink`, systems/lighting.js:1119-1121), so use step 6's ratio method: set `lightingSystem.reducedMotion = true` before the unfaded reads, take the emitter of one rack (the one farthest from x 440) and read `glowFull = e.glow.alpha` and an LED's `l.img.alpha`; at k = 0.5, after 50 ms, read `glowFaded` and the LED again. Expect `glowFaded / glowFull` within 0.5 ± 0.01, with `e.fade` above 0.99 at both reads (the figure fade multiplies a dark room's glow, :1148), and the LED at `0.5 * 0.95 * (def.ledAlpha ?? 1)` within 1e-3 (`ledLevel` at level 0, :1094). Set `reducedMotion` back before the `dip` check below, which does nothing under reduced motion (:974);
   - while walking down, A sampled every 30 ms rises without falling back;
   - screenshot 2: the half-faded wall over a lit floor, the player lit, the server floor dark.
   Then `lightingSystem.dip({ level: 0.5, ms: 1600 })` and sample A and B every 50 ms for 2 s. With `startA`, `startB` the first samples' lumas and `minA`, `minB` the lowest: `|minA / startA - minB / startB| <= 0.15` (the strip follows the hall's brownout). Skip this check under reduced motion, where `dip` does nothing.
   Then open the hall/server door (`__test.interact('door:hall->server')`) and walk into the server: its lights strike (`on === true`), `rooms.server` goes and the segment list empties once the player's feet are on the server floor. Screenshot 3.
8. **Seam.** Back in the hall, `moveTo(320, 200)` and `walk('down')` to the bottom wall. Expect `reception` and `server` both at 0.5 and their segments, each with weight 1: hall over reception at x 0, w 320, and hall over server at x 320, w 256 and x 608, w 32 (the hall/server door is open since step 7, so its column 576-608 is cut out). If the server's lights are still on from step 7, `lightingSystem.switchOff('server')` first. Screenshot.
9. **Doorway.** `moveTo(48, 200)`, `walk('down')` to the closed door (reception fades, as in step 5), then `__test.interact('door:hall->reception')` to open it. Opening suppresses the fade, and k climbs back over 200 ms, so first `waitUntil('() => (window.behindWallFade.debugState().rooms.reception?.k ?? 1) === 1')`. Only then start polling `debugState()` and the player's body every frame and `walk('down')` through the doorway into reception. Reception's k must be exactly 1 on every polled frame; if the body centre ever leaves `48 ± 25` the run is invalid (report it, don't count it as a pass). The player must end in reception. Then walk back north into the hall, `moveTo(88, 200)` and `walk('down')` to the bottom wall beside the open door: reception must fade to 0.5 (body centre 40 px from the door), and its segments exclude x 32-64.
10. **Resize.** Still faded beside the open door, with `stripBlendDebug()` showing reception's segments, set `lightingSystem.reducedMotion = true` (it freezes emitter flicker and panel faults, so nothing moves the light between the two reads). Choose A' in reception's strip: y 300, x in 100-310, farther than `def.radius + 8` from the centre of every hall and reception emitter (`lightingSystem.rooms.get(id).emitters`, centre as in step 4) and at least 60 px from `player.x`; if none qualifies, use the x farthest from every emitter and say so. Read A' = `lightAt(x, 300)`. Then `game.scale.resize(game.scale.width + 64, game.scale.height)`, wait 100 ms (at least two redraws), check that `lightingSystem.lightMap.width` changed, and read A' again: it must be within 6/255 per channel of its value before the resize, and in particular not black. This catches crop frames left on a deleted texture (§8.1). Resize back and restore `reducedMotion`.
11. **Restore.** Walk back north into the hall's middle. Expect `debugState().rooms` empty, every touched object back at its base alpha, every door sprite still at 1, every face at 1, every hidden tile visible and no segments. Screenshot.
12. **Kill switch.** Reload with `?behindWallFade=off` and repeat step 2's loads. Repeat step 4's walk: `debugState().enabled === false`, no state, no segments, wall opaque; record the point at (480, 40) for step 4's comparison. Repeat step 7's first walk to the wall (switch the server off first if needed): A stays at its unfaded value. Screenshot at the same spot as step 7's screenshot 2, for a side-by-side.
13. **Reduced motion** (if the driver can emulate the media query): the k change, and the segment weight at the next redraw, land within one frame.
14. In the report, say which checks were static and which live, and put screenshots 1-3 of step 7 next to step 12's.

## 13. Implementation slices

Rules for every slice: one slice at a time, in order. Don't start a slice until the previous one is committed and its done-criteria are met. The tree is shared: stage your own files by explicit path (`git add <path> <path>`, which also takes the new files; never globs, `git add -A` or `git add .`), check `git diff --cached --stat` shows only them, then `git commit -m "..." -- <path> <path>` and check `git show --stat HEAD`. Never `git stash`, `git checkout -- <file>` or `git reset`. No attribution lines in commit messages. Commit the slice's files, then run the full `bin/test-js` (plus `bin/rails test` and `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` for slices 2 and 4, AGENTS.md:181); fix in follow-up commits. A slice is done when they pass. Grep `test/js` for every engine file you touch (`behind-wall-fade`, `door-gaps`, `game.js`, `npc-needs`, `seating`, `rooms.js`, `lighting`) to find harnesses that copy it. If a slice runs long (about 150k tokens or 80 tool calls), write a handover note at the top of this file, commit what is done, and stop.

### Slice 1: detection

- **Files.** New `public/break_escape/js/systems/behind-wall-fade.js`; `public/break_escape/js/systems/door-gaps.js`; new `test/js/behind-wall-fade.test.mjs`.
- **Functions.** In behind-wall-fade.js (no imports): `TILE`, `BACK_WALL_ROWS`, `FADE_ALPHA`, `backWallStrip(room)`, `roomsBehindWallAt(body, rooms, { margin, doorways })`, an internal `doorwayOpen(rooms, S, d)` implementing §2's open rule, and `setFadeDoorways(fn)` storing the provider. In door-gaps.js: build the provider closure once, pass it to interaction-walls.js as now and to `setFadeDoorways`.
- **Tests.** §12 "Detection", all cases.
- **Done when** `bin/test-js test/js/behind-wall-fade.test.mjs` and the full `bin/test-js` pass, and the commit holds only these three files.

### Slice 2: controller, tiles, sprites, hook

- **Files.** `systems/behind-wall-fade.js`; `core/game.js` (one import, the install call after `installSeating(this)` at :1833, the update call before the `if (window.lightingSystem) {` block at :2503); `systems/npc-needs.js` (`makeCosmetic` and `removeCosmetic` lines, §4); `systems/seating.js` (`.setAlpha(chair.alpha)` in `place()`, :840-841); `core/rooms.js` (the `_tableItems` line in the final table-group pass, :2524-2545, §4); `test/js/behind-wall-fade.test.mjs`; `test/js/npc-needs-slots.test.mjs`; the static-check test (add to an existing text-reading test of game.js, or a new `test/js/behind-wall-fade-wiring.test.mjs`); then, in a separate commit, `scenarios/test_behind_wall_fade/scenario.json.erb` and `mission.json`.
- **Functions.** `createBehindWallFade(env)` returning `{ update, debugState, setEnabled, clear, lightWeights }`; inside it the factor step (§6), the tile pass with faces and hidden tiles (§5), the candidate builder with ownership, drawn rect, table followers and companions (§4), records and `release` (§6-7); `lightWeights()` with `gaps` (§8.1, §9); `installBehindWallFade(scene)` with the kill switches and the shutdown hook (§9).
- **Tests.** §12 "Factor", "Tiles", "Sprites", the npc-needs companion test and the static checks. Validator clean on the new scenario (`validate-scenario` skill).
- **Live proof.** Steps 1-2, 4-6, 8-9 and 11-12, skipping every lighting check (segments, `lightAt`, glows). Step 2 must pass before anything else counts. Then one walk along a back wall in each of two shipped missions, with a screenshot of each, since N's bottom-row art (risk 1) varies with the map:
  - m04_critical_failure, engineering_workshop (room_aes_workshop: bespoke back-wall art, its `room` rows 0-1 differ from `walls` in 10 cells) from battery_hall_1 to its north;
  - m01_first_contact, reception_area (room_reception) from main_office_area to its north.
  Start a fresh game on :3001 (`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>`, tools/playtest/new-game.rb:3), load the two rooms with `window.loadRoom`, `__test.enterRoom(N)`, then `walk('down')` to the wall away from the doorway, and check `debugState().rooms[S].k === 0.5` and that the player shows through the half-faded wall. If a lock bars the route, say so and use another N/S pair of the same mission, or m02's staff_room under dr_kim_office; don't set progress from the console.
- **Done when** the unit, static and Rails suites and the reopen check pass, the live steps pass with screenshots looked at (risk 1 in §11 checked by eye), and `debugState()` shows no state after step 11.

### Slice 3: glow multipliers

- **Files.** `systems/lighting.js` (four writes, §8.2); `test/js/lighting-emitter-leds.test.mjs` (or a new file on its harness); `test/js/lighting-workstation-indicators.test.mjs`.
- **Change.** `* (obj.behindWallK ?? 1)` at :1110 (LEDs), :1153 (glow, outside `Math.min`), :1172 (flames, outside `Math.min`), :1484 (lock flashes). No other lighting change.
- **Tests.** §12 "Lighting multipliers", including the clamped-glow case.
- **Live proof.** The glow and LED parts of steps 6 and 7.
- **Done when** the tests pass and the pc glow and rack LEDs read at half alpha in the live run.

### Slice 4: strip light blend

**First, the probe** (no engine edit). In the live game on :3001, in one synchronous `page.evaluate` block with lighting on:
1. `const ls = window.lightingSystem, rt = ls.lightMap, tm = ls.scene.textures;` make a probe texture `tm.addDynamicTexture('be_light_probe', rt.width, rt.height)`.
2. In one batch on it (`clear`, `beginDraw`, stamps with `skipBatch: true`, a black ADD stamp, `endDraw`): fill all of it black, then R = (20, 10, 16, 8) in two halves, (20, 10, 16, 4) red and (20, 14, 16, 4) blue, and the rect just below R, (20, 18, 16, 8), green, all with NORMAL `BLOCK_TEX` stamps (as `fillRect` does).
3. Read the probe at (24, 11), (24, 16) and (24, 20) with `snapshotPixel`: red, blue and green settle how a read maps to rows.
4. Read the light map at (24, 11), (24, 16), (60, 12) and (24, 22): `before`.
5. `probe.add('crop', 0, 20, 10, 16, 8)`; `rt.beginDraw()` with no clear; `rt.stamp('be_light_probe', 'crop', 20, 10, { originX: 0, originY: 0, alpha: 0.5, tint: 0xffffff, blendMode: Phaser.BlendModes.NORMAL, skipBatch: true })`; `rt.endDraw()`.
6. Read the light map again. Pass: (24, 11) is `0.5 * red + 0.5 * before` and (24, 16) is `0.5 * blue + 0.5 * before`, each within 2/255 per channel, and (60, 12) and (24, 22) equal `before` exactly. If black or green is mixed in instead, the crop samples the wrong rows: retry step 5 with the frame at y = `height - 10 - 8` and record the rule. If red and blue are swapped, the crop is drawn upside down: stop and report, since neither a frame offset nor the fallback (which stamps the same texture) fixes that.
7. `tm.remove('be_light_probe')`. The next redraw repaints the light map.

Record the readings in the slice's commit message or a note beside this file. If the crop can't be made to sample R, use the erase fallback (§8.1). If the second batch changes pixels outside the stamp, or does not give the 50/50 mix, stop and report: the blend depends on it.

- **Files.** `systems/lighting.js`; new `test/js/lighting-strip-blend.test.mjs`.
- **Functions and changes** (all §8.1): `export function stripBlendSegments(weights, rooms)` (pure, with the gap cut); constants `STRIP_TEX` and `STAMP_OPT_KEYS`; in `update()`, the segment step after the `visible` loop, `let drawTarget = rt` with the eight call sites switched to it (the `fillRect` and `stamp` closures, the two inline MULTIPLY stamps, `drawFlashes`, `stampTorch`, `stampNpcTorches` and through it `stampBeam`; `stampNpcGlows` via `stamp`), `state.drawAmbient`, the per-room tee switch, `drawTarget = rt` after the loop; methods `teeFor(roomId)`, `getStripTexture()`, `drawStripBlend(segments, visible, ox, oy)` holding the strip batch and the blend batch after `rt.endDraw()`, and `stripBlendDebug()`; `destroy()` removes `STRIP_TEX`.
- **Tests.** §12 "Strip blend", all cases.
- **Live proof.** Steps 3, 4 (lighting), 7, 8 (segments), 9 (segments beside the open door), 10 (resize), 12 and 13, and slice 2's m04 walk again with lighting on: the workshop's strip (a motion room with nobody in it) takes battery_hall_1's light; screenshot.
- **Done when** the probe passed (or the fallback is in and recorded), the unit, Rails and reopen checks pass, steps 3-13's lighting checks pass, and screenshots 1-3 of step 7 and step 12's are in the report side by side.

## 14. Settled edge cases

1. **Strip beyond the player's room.** Where a south room's strip runs past the player's room over a second north room, §8.1 lights that part with the second room's light (same weight). Each part of the strip takes the light of the room it lies over.
2. **Open doorway column.** §8.1 leaves the 32 px column of an open N/S doorway out of the blend (`gaps`), so a doorway into a brighter south room stays lit by its spill and doesn't turn dark between two lit floors.

No open questions remain.

## Noticed, not in scope

- `npcBehaviorManager.update(this.time.now, this.time.delta)` passes `undefined` as delta (core/game.js:2484). It is threaded through to patrol and hostile movement (systems/npc-behavior.js:158, 189, 949-989); worth checking separately whether any of them reads it.
- `stowSprite` lists a sprite under its home room without updating `sprite.roomId` (systems/npc-needs.js:3307-3310), and `placeHeld` keeps the declared `roomId` on purpose. interaction-walls.js `roomOfTarget` trusts `roomId` first (systems/interaction-walls.js:54-62), so it can attribute such a sprite to a room it isn't drawn in. The fade uses the listing and is unaffected.
- An N item with a large explicit `position.elevation` in N's bottom rows can reach a depth above `S.y + 64.4` and draw in front of S's wall.
- `updateDoorSpritesVisibility` (systems/doors.js:1338) and game.js `hideRoom` (core/game.js:2809) have no callers.
- Items put on a table after load (a player's drop snapped to a table, systems/item-drop.js:139-147; a needs placement settled by `settleOnTable`, systems/item-drop.js:205) never join a table group, so on a faded desk they fade only if their own rect reaches the strip. One drop on a deep desk's front half can still look stranded. The fade could follow them too by testing `tableUnder` (systems/table-drop.js:91) against each faded table; a question for the user.
