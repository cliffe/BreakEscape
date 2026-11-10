# Code review 3: opaque cap band (slice 5)

Scope: f8545bffb (behind-wall-fade.js, tests, tools/survey_wall_cap.py) and e9454439c (DESIGN.md §5, HANDOVER, proof). Read-only review, 2026-11-08. `bin/test-js -j 8`: 423 passed, 0 failed. `node --test test/js/behind-wall-fade.test.mjs`: 41 pass.

Counts: **0 blocker, 1 major, 4 minor.**

Data checks run for this review (scripts over `public/break_escape/assets/rooms/*.json`):
- Every row-1 tile in every map is 32x32 from a tileset with margin 0 and spacing 0, on a `room` or `walls` layer; no row-0/1 tile carries a flip flag.
- Every row-1 face tile (highest-depth layer per cell) has a fully opaque bottom 12 px (1533 of 1533), so the band never lets the cap through.
- 9 tileset names (texture keys) appear with more than one `firstgid` across maps (room14, room18, room6, room_hospital, ...). No row-1 `(texture, gid)` pair currently maps to two different local frames.

---

## Major

### M1. The band sits above the north side of the strip, so it hides the player's feet, NPC feet and N's props against its south wall

**Evidence.** `behind-wall-fade.js:199` sets the band to `face layer depth + 0.01` (S.y + 64.41 for the `room` layer). Everything standing in N's bottom rows draws below that: the player and NPCs at feet + 0.5 (core/player.js:969), N's floor objects at bottom + 0.5 (core/rooms.js:451). N's south-wall collision box spans S.y + 56..64 (systems/collision.js:74-82), so a player hugging N's south wall has the body bottom at about S.y + 56 and the sprite's feet (body offset 66 + 10 in an 80 px frame, core/player.js:137-138) down to about S.y + 60. All of that is inside the band rows S.y + 52..64. HANDOVER slice 5 and DESIGN §5 record this ("the opaque band covers the bottom 12 px of the player's legs and feet") as accepted.

**Failure scenario.** The player walks along the bottom of the hall in the test scenario, right up against the wall, which is the usual way into the strip. The wall fades to 50% and the body shows through it, but the shoes are cut off by a hard opaque line 12 px above the wall base. Before slice 5 they showed at 50% like the rest of the body. An NPC walking the same line, or a plant pot standing against N's south wall, loses its bottom the same way. Hiding the player is the problem this feature exists to solve, and this case comes up every time the player hugs the wall.

**Fix.** The band only needs to cover N's cap, so draw it under everything on N's side and keep it above N's tile layers. Set its depth to the top of the band rows:

```js
img.setDepth(layer.y + (face.y + 1) * TILE - WALL_CAP_PX);   // S.y + 52
```

N's layers sit at N.y + 64.4, which is at most S.y + 0.4 because rooms are at least 128 px tall. Every N-side sprite with pixels in the band rows has its bottom at or below S.y + 52, so its depth is S.y + 52.5 or more. Door sprites are at +0.45 on a bottom of S.y + 64. The draw order becomes: N's layers, then the opaque S band, then N's player, NPCs and props, then S's face at k = 0.5. Where nothing stands in front, 0.5·S + 0.5·S-band is exactly S's art, because the band uses the face tile's own pixels, so the stripe stays gone. Where the player stands, the feet show at 50%, the same as the body. S's floor tiles in rows 0-1, if a map has any, are already hidden tiles while faded (§5 step 3), so nothing of S's sits between the two. Update the unit test at test/js/behind-wall-fade.test.mjs:491 (it asserts `256.4 + 0.01`). Add a test that puts a sprite with depth S.y + 60.5 between the band and the face, and redo the s5 screenshots with the player's feet in the band rows.

---

## Minor

### m1. Frame key uses the gid, but texture keys are shared across maps with different firstgids

**Evidence.** `behind-wall-fade.js:156`: `bwf_cap_${tile.index}_${band}` is added to `ts.image` (the texture keyed by tileset name, core/rooms.js:1960 `addTilesetImage(tileset.name, tileset.name)`). Textures and their frames outlive scenes and maps. `room14` has firstgids 394, 434, 442, 448, ... across maps, so gid 500 is local frame 106 in one map and 66 in another.

**Failure scenario.** A new or edited map puts room14 gid 500 in row 1 of a south room. Another mission loaded earlier in the same page session already registered `bwf_cap_500_b` on `room14` from a map where gid 500 is a different frame. `tex.has` returns true at :157 and the band draws the wrong tile's bottom, which shows as an opaque strip of mismatched art along the wall base. None of today's maps trigger it (checked), but nothing stops a future one.

**Fix.** Key on the local frame: `const local = tile.index - ts.firstgid; const name = \`bwf_cap_${local}_${band}\`;`. The crop coordinates already come from the tileset, so nothing else changes.

### m2. The node tests cannot fail on a broken Phaser path, and the live proof is not in the suite

**Evidence.** `capScene()` in the test file fakes `tile.tileset`, `tex.has/add` and `getTileTextureCoordinates` with firstgid 1 built in. The `layer.gidMap` fallback (:151) is never exercised. The doorway test (:520) puts a door over a cell that holds a tile, which can't happen live: `removeTilesUnderDoor` empties that cell, and doors are always snapped to tile centres (systems/doors.js:129, grid units are multiples of 32). proof/s5_live.mjs logs the frame cut and image count, but it is a one-off script against :3001 and asserts nothing.

**Failure scenario.** A Phaser upgrade changes `Tile.tileset`, or a refactor passes the local index to `getTileTextureCoordinates`. Every node test still passes, and the live game shows a wrong or missing band (or `capFrame` returns null and the white stripe comes back) with no failing check.

**Fix.** Add an assertion to the playtest bridge or the s5 proof, and run it in whatever live check the team uses: for each `bwf_cap_*` image, `frame.cutY === face.tileset.getTileTextureCoordinates(face.index).y + 20`, image count equals the non-doorway row-1 cells, and depth is between N's layer depth and S.y + 52.5 (after M1). In the node test, give the fake tileset a firstgid other than 1 and a texture that is shared with a second room (that covers m1). Change the doorway test to a door cell with null tiles.

### m3. The comments describe the measured cap as S's tile

**Evidence.** `behind-wall-fade.js:24-27` says "The bottom 12 px of every room tileset's wall tile are the south-wall cap". tools/survey_wall_cap.py measures the bottom map row, which is N's south wall. The band crops S's row-1 tile, which is S's wall base, not a cap. The `states` comment at :137 still lists `{ k, target, cells, hiddenCount }` without `caps` and `room`.

**Fix.** Reword it: "the north room's bottom row ends in a 12 px cap ... so the bottom 12 px of S's row-1 face tiles are redrawn opaque over it." Add `caps` and `room` to the :137 comment.

### m4. Images are rebuilt on every fade start

**Evidence.** `buildCaps` runs from `buildCells` each time a state is created (about 9-20 `scene.add.image` calls), and `destroyCaps` throws them away at k = 1. Nothing is allocated per frame, as specified.

**Failure scenario.** A player who stands on the strip edge and steps in and out repeatedly creates and destroys around 20 Images per cycle. There's no leak, only a little garbage-collection churn and display-list re-sorts.

**Fix (optional).** Keep the images per room id and hide them when the state is dropped, then destroy them in `clear()`, `setEnabled(false)` and the replaced/removed-room paths. Only worth doing if a profile shows it.

---

## Verified correct

- **Crop maths.** `getTileTextureCoordinates(gid)` returns source-space coordinates that already include margin and spacing, and `tex.add(name, 0, x, y, w, h)` takes source-space coordinates too. The bottom crop `y + th - 12` with `w = tw` is right for the 32x32, margin-0 tilesets that all row-1 tiles use. The live proof's logged `cutY/cutHeight` match.
- **Flips and rotation.** Phaser applies a flip in local space before rotation, for tiles and Images alike, so the inverse of screen-down gives `capBand`'s table (quarter 1: `r`, or `l` with flipX; quarter 2: `t`, or `b` with flipY; and so on). Phaser never sets `flipY` from Tiled (H/V/D become rotation + flipX), and no row-0/1 tile is flipped today, so this is unused but correct.
- **Position.** Centre `(layer.x + c·32 + 16, layer.y + 64 − 6)`, origin 0.5: integer edges, exactly on the bottom 12 px of row 1. `pixelArt`, `antialias: false` and `roundPixels` (utils/constants.js:96-98) rule out bleeding from neighbouring frames.
- **Doors.** N/S door sprites (S's and N's) sit at bottom S.y + 64 + 0.45, above the band at either depth. E/W door sprites (+0.2) span S.y + 64..96 (doors.js:249, 290), below the band rows. The ±16 px skip is effectively a no-op because doorway cells are already null, but it is harmless and costs nothing. Even a door on a tile boundary would draw over the band by depth.
- **Wall-hung objects** of S: auto-elevated, so depth ≥ S.y + 64.5 (rooms.js:441-451), above the band. Table items are above it too.
- **Lifecycle.** Caps are destroyed on release at k = 1 (`dropState` → `restoreTiles`), on a NaN k (:380, :386), on a removed room (:376), on a replaced room (:390-393, also when k reaches 1 that tick), by the kill switch (`setEnabled(false)` → `restoreTiles`) and on scene shutdown (`clear`, registered with `once('shutdown')`; Phaser's display list has already destroyed them by then, and `destroy` on a destroyed object returns early). No path calls `dropState(id, false)`. The engine never unloads a room, so no case leaves a live layer-less room with caps. Frames left on textures after a restart are reused through `tex.has` (see m1 for the one way that goes wrong).
- **No per-frame allocation.** `syncCaps` is a plain loop with change-guarded setters. Frames are created at most once per (texture, gid, side).
- **Hidden rooms and reveals.** The band copies layer `visible` and `alpha` every tick, and tweens run on the scene UPDATE event before `scene.update()`, so a room that isn't revealed yet shows no band and a reveal mid-fade picks it up the same tick. The hook runs after the reveal writers (core/game.js:2508 placement, module header).
- **Lighting.** The light map is a single overlay. `stripBlendSegments` (lighting.js:362-391) covers the whole 64 px strip, band rows included, and leaves out the same open-doorway ±16 px columns. The band therefore gets the same N-blended light as the faded wall above it, with no light seam at the band's top edge. That is the right light for a patch standing in for N's cap. It stays right after the M1 depth change because the light map doesn't depend on depth.
- **No other consumer of the Images.** There is one camera and no `.ignore` lists, and no engine code walks `children.list`. The Images aren't interactive.
- **Proof screenshots** (s5_m01_*, s5_test_*): the white stripe at the base of the faded wall is gone (sampled rows S.y + 54..63 change; rows above and below are identical), the wall above stays at 50%, and the faded desk and items draw over the band.
