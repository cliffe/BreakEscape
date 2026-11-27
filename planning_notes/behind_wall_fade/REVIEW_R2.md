# Behind-the-wall fade: review round 2

Reviewed 2026-11-08 against the working tree and phaser@3.60.0 (jsdelivr sources). REVIEW.md was not read. Paths are relative to `public/break_escape/js/` unless they start with `scenarios/`, `test/` or `assets/`.

Counts: 0 blockers, 4 major, 10 minor.

## Major

### M1. Closed N/S door sprites stay solid over the player: check this against decision 4

Evidence: S's north door is centred at `S.y + 32` and is 32x64 (systems/doors.js:117 sets `doorY = roomPosition.y + TILE_SIZE`; the fallback graphic at :475 confirms the 32x64 size), so it covers rows 0-1 of its column. N/S door depth is `doorBottomY + 0.45 = S.y + 64.45` (systems/doors.js:481-487). The player's depth is `feetY + 0.5`, at most about `S.y + 56.5` (core/player.js:958-969). N's south door sprite sits on the same spot at the same depth (systems/doors.js:209-232).

Failure: the player walks up to a closed door from N to open it, which the design itself calls "the commonest way into the strip" (§2). The wall either side drops to 50%, but two solid door sprites still hide the player's legs. The design reads decision 4 ("the doorway doesn't fade") as "door sprites never fade, open or closed" (§3 table). The user's wording covers the doorway, and that is already handled by the null tiles and the suppression rule. It doesn't clearly cover a closed door leaf.

Fix: put it to the user as a fifth open question. Option A, keep it as designed and say so in §14. Option B, a closed N/S door sprite of S (and N's matching sprite) at the player's x fades with S's k; open doors, `animatedDoors` and gate sprites with `open = true` stay solid. Doors aren't in `objects`, so B needs an explicit pass over `rooms[S].doorSprites` and `rooms[N].doorSprites` filtered on `direction` north/south, `active !== false` and `!doorProperties.open`, with the same base/applied record. Whichever is chosen, add a live check: stand at the closed reception door from the hall and screenshot.

### M2. Ownership by `roomId` first gets NPC-placed items wrong

Evidence: the design says "NPC placement updates [roomId] (systems/npc-needs.js:3658)". Line 3658 is `dropHeld`. `placeHeld` (systems/npc-needs.js:3665-3690) does the opposite on purpose. Its header (3660-3664) says "The sprite is registered under the room it now sits in … sp.roomId stays the declared room". It writes `room.objects[...] = sp` for `target.roomId` and never touches `sp.roomId`. `stowSprite` can also leave the two out of step after a `dropHeld` (home is recorded once, 3290-3293; the listing moves to `home.roomId`, 3307-3310).

Failure: a print or delivery slot is declared in room X and an NPC places it on a desk in S's back row. It is listed in `rooms[S].objects`, and its depth is the desk's + 1 (3684), so it draws above the desk and above the player. §4's rule ("a sprite with a `roomId` naming a loaded room belongs to that room") assigns it to X, so it stays solid on top of a faded desk, covering the player. That breaks decision 1. The unit test "an item in S's `objects` with `roomId` of another loaded room is untouched" locks the wrong answer in.

Fix: for the fade, the owner is the room whose `objects` map lists the sprite, which is where it is drawn and what rooms.js, item-drop.js, npc-hostile.js:593 and placeHeld all maintain. Use `roomId` only to break a tie when two maps list the same sprite. Flip that unit test (it should fade), and add one for a placeHeld-style sprite (listed in S, `roomId = N`, depth above a faded table): it fades.

### M3. The test scenario's slot cases don't land where §12 says

Evidence: slots are indexed in Tiled object order (core/rooms.js:229-241), and `findMatchFor` returns the first unreserved match (core/rooms.js:261-283). room_reception's `conditional_items` order is `bin2, safe2, safe3, key` (assets/rooms/room_reception.json). safe2 is at x 220, top 68, h 30. safe3 is the one at top 62.

Failures:
- A single scenario object of type `safe` takes **safe2**, which is wholly below the strip (68 > 64). Live step 4 expects "the safe at half its base alpha" and fails even though the engine is correct.
- The elevation item (`"y": 1.4, "elevation": 32`) and the `"y": 2` item have no type. If the implementer picks a type that has a table slot in reception (`notes`, `phone`, `laptop`, `pc`, `lamp`, `plant`, `box` are all in `table_items` or `conditional_table_items`), the match goes through `placeMatchedScenarioItem`. At x 4 (128) it overlaps reception_table1 (x 76-250, y 43-90), joins the table group, and has its elevation forced to 0 (core/rooms.js:2531-2537). The "explicit elevation" case is then never exercised.

Fix: declare two `safe` objects and assert on the second (safe3), or give the safe an explicit position whose top is at 1.9375 tiles. Give the elevation item and the `y: 2` item a type with no slot in room_reception (for example `lockpick` or `bag`), so they take `createSpriteAtRandomPosition`, then the explicit x/y, then `setDepthAndStore` with `position.elevation` (core/rooms.js:2450-2460, 436-438). Have live step 4 also read back `sprite.elevation === 32` so the case is proven.

### M4. The live doorway check (step 6) will fail on correct code

Evidence: the hall's bottom two rows (y 256-320) are hall floor and are also reception's strip. The hall's south-wall collision boxes sit at y 312-320 (systems/collision.js:73-83), so the player can walk anywhere along y 260-312. `moveTo` routes by pathfinding (systems/test-bridge/index.js:538), not straight down the door column. The suppression window is ±25 px of x = 48.

Failure: "moveTo a reception floor point straight below it (48, 400)" from the hall's middle can enter the strip at x ≈ 80-150 and run along it towards the door. Reception then fades, which is the specified behaviour, and "Reception's k must stay 1 throughout" fails.

Fix: `moveTo(48, 200)` first, outside the strip and lined up with the door. Then `walk('down')` through the doorway, and assert k = 1 only for frames where `|feet.x - 48| <= 7` and the feet are in the strip. Add the opposite case: stand at the hall's bottom wall at x = 48 + 40 next to the open door and expect reception to fade.

## Minor

1. **The hook runs before other alpha writers in the same frame.** §1 and §6 say nothing after `updatePlayerRoom()` writes object alpha. `npcNeedsSystem.update()` (core/game.js:2487) reaches `revealOutput` → `showRevealedObject` (systems/npc-needs.js:3719 → core/rooms.js:3050, `alpha = 1`). `scenarioTimerDispatcher.update` (core/game.js:2499-2501) fires actions and globals that end in `showRevealedObject` (revealOnGlobal) or a `tint_objects` tween start. Both run after the hook, so a faded object shows at full alpha for one frame. NPC moves (placeHeld, dropHeld) also land after the hook, so the candidate set is a frame stale. Fix: call `window.behindWallFade?.update(this.time.now)` directly before `window.lightingSystem.update` (core/game.js:2503). That is still before lighting reads `behindWallK`. Update the static test to match.
2. **Release requires `sprite.active`.** Inventory pickup and consumables set `active = false` without destroying the sprite (systems/inventory.js:411, 426; systems/consumables.js:254). A sprite deactivated while faded keeps `base * k`, and revealRoom skips inactive objects (core/rooms.js:3094). Fix: release when the sprite isn't destroyed (`sprite.scene` is set; Phaser 3.60 GameObject.destroy clears it, src/gameobjects/GameObject.js:835-898), whatever `active` says. Keep `!active` as a reason to drop a candidate.
3. **Sprites drawn for S objects but not held in `objects` don't fade.** npc-needs cosmetic copies are kept in a private Map (systems/npc-needs.js:3325-3344), and the player's seat overlays are separate images (systems/seating.js:479-480). A faded printer keeps a solid paper on it. A chair whose top reaches row 1 (room_office's chair at top 60) fades while its armrest overlay doesn't. Fix: list these as known gaps in §3, or tag cosmetics with their producer's room and include them.
4. **Body-centre x.** The player sprite is wider than the 18 px body (core/player.js:231). With the centre just past `strip.right`, up to half the sprite sits behind S's corner column and nothing fades. Fix: test the body's x-range overlap (`x ± 9`), or the sprite's (`x ± 12`), against the strip, or list it in §11.
5. **Lock flashes are a fourth per-object alpha write** in lighting.js (`setAlpha(shape.alpha)` at systems/lighting.js:1484, drawn at `LIGHT_DEPTH + 2`). Decision 6 ("glows and LEDs fade") doesn't settle it. Say in §8 whether a faded screen's lock flash is scaled, and test whichever is chosen.
6. **The office_n test item is on the walk line.** Item at `x: 6` spans x ≈ 192-212 at world y 0, and step 3 walks down at x ≈ 200. If its texture has a body or catches the click, the walk stalls short of the strip. Fix: put it at `x: 8` or walk at x ≈ 160 (both clear of room_office's chairs and desks).
7. **The scenario load command is incomplete.** `swap-scenario-game.rb <host_mission>` doesn't name a host mission, and the per-room motion setting is given only as `"mode": "motion"`. Fix: name the host, and write the room block exactly: `"lighting": { "mode": "motion" }` on `server` (read as `roomData.lighting`, systems/lighting.js:460-461).
8. **Shutdown restore is wasted work.** The display list may have destroyed the layers before `reset` runs (the design notes this). Nothing is persisted and `rooms` is rebuilt (core/rooms.js:1013). Fix: on `shutdown`, clear records and state without touching tiles or sprites; keep the restore for `setEnabled(false)` only.
9. **Wrong citations** (the claims mostly hold):
   - Systems.js `sceneUpdate.call` is at :364, not :363.
   - TimeStep.js:656-659 is `stepLimitFPS`, which runs only with an fps limit. The default path is `step()` at :699-710 (same `this.time += this.rawDelta`).
   - Origin 0.5 on drops is set at item-drop.js:136 and 214, not table-drop.js:124-126 (that is a comment).
   - npc-needs.js:3658 is `dropHeld` (see M2).
10. **The kill switch is URL-only.** Lighting also honours `localStorage.breakEscapeLighting = 'off'` (systems/lighting.js:349-355). Optional: honour `breakEscapeBehindWallFade = 'off'` for players who want it off for good. Without it, a tester's switch is lost on the next navigation.

## Elevation (the user's note on decision 2)

I checked every creation and move path. Elevation only feeds depth and never moves a sprite:

- setDepthAndStore (core/rooms.js:432-453), Tiled objects and chairs (2681-2686, 2722-2737) and table groups (736, 2531-2537) write `setDepth` and `sprite.elevation` only.
- `createSpriteFromMatch` and the explicit-position override set x/y from Tiled or `position.x/y` alone (core/rooms.js:538-541, 2441-2442, 2455-2456).
- item-drop.js:147-165 and `settleOnTable` (item-drop.js:207-219) keep the drawn rect. settleOnTable converts to origin 0.5 at the same centre. table-drop.js `placedDepth` is depth only (143-147).
- `updateSpriteDepth` (systems/object-physics.js:344-351) and seating's calls are depth only.
- npc-needs `setCentre`, `stowSprite`, `dropHeld` and `placeHeld` move by centre or saved home, never by elevation.
- npc-hostile loot is placed by position, with depth = bottom + 0.5 (systems/npc-hostile.js:577-593).

North and south items of the same shape at the same place differ only by owner: a Tiled N object or an N scenario item has no S listing, and auto-elevation is computed against its own room's top (core/rooms.js:441-444), so it gets no wall elevation from S. Using the drawn rect and ignoring elevation is therefore right. The one ownership hole is M2. Pre-existing and out of scope: an N item with a large explicit `position.elevation` in N's bottom rows can reach depth above `S.y + 64.4` and already draws in front of S's wall.

## Verified correct

- Geometry: `stackingHeightPx` (core/rooms.js:1222), layers created at `position.y` (2022), strip `[S.y, S.y + 64)`, layer depths +0.2 `walls` / +0.4 `room` (2032, 2080-2083), `doors` layer skipped (2013-2016), layers start hidden at alpha 0 (2086-2089).
- Tile survey re-run over all 147 maps: 1,471 `walls` cells in rows 0-1, every one over a `room` tile, 190 with the same gid, only the closet map with `room` gaps (4 cells), and only room_closet adds `props`. (Row 0 of `walls` holds 27 non-empty cells across the maps.)
- Doorway cells are null in every layer at creation: `removeTilesUnderDoor` runs per layer before the depth branch (core/rooms.js:2025), with bounds `doorY ± 32`, rows 0-1 (systems/collision.js:204-208). Door-open removal touches only `wallsLayers` (collision.js:412) and cells that are already null. No other engine code writes tiles (`removeTileAt` appears only in collision.js). Each room parses its own Tilemap (core/rooms.js:1936; ParseToTilemap.js:55-63), so Tile objects aren't shared between rooms. Rooms are never re-created (core/rooms.js:921-947).
- Phaser 3.60: tile alpha in the WebGL tint (TilemapLayerWebGLRenderer.js:27, 84) and Canvas `globalAlpha` (TilemapLayerCanvasRenderer.js:32, 121); RunCull skips `!visible || alpha === 0` (RunCull.js:47, 66, 85, 104) and runs every render (CullTiles.js); Tile mixes in Alpha and Visible (Tile.js:44-46); Clamp passes NaN through (Clamp.js), and the WebGL packer turns NaN into alpha 0 (Utils.js:52); GetTileAt returns null for null and -1 cells; Clock has `now` but no `delta` (Clock.js:57, 142, 355); tweens and the clock run on `UPDATE` before `sceneUpdate` (TweenManager.js:237; Systems.js:362-364). No room objects are Containers (the only Containers are UI at depth 5000+).
- `update()` takes no parameters and `this.time.delta` is undefined (core/game.js:2469, 2484). The install point (1833) and the lighting call (2503-2505) are as cited.
- updatePlayerRoom uses body bottom and centre x (core/rooms.js:3135-3150), and the strip belongs to N's floor. `playerFeet` (interaction-walls.js:211-219) gives the same numbers. The player body is 18x10.
- The doorway rule: the opener is set inactive, destroyed, and marked `open = true` while it stays in `doorSprites` (doors.js:833, 858, 876); the far sprite is spliced out (1001-1009); gates flip `props.open` (door-gates.js:200); `doorProperties.worldX` exists (doors.js:522); the provider is in door-gaps.js:8-17; `doorClosed` is at interaction-walls.js:153-161. door-gaps.js is imported only by core/game.js:10, no test copies it, and no import uses `?v=`.
- Lighting: LED write :1110, glow :1152-1153, flame :1171, LED depth :743-746, stamp :1134, fillAreas :1335-1355, sort :1069-1080, motion :550, startOn :476, kill switch :349-355. Emitters are built from `room.objects` (refreshEmitters :582-597), so `obj.behindWallK` is reachable. lighting.js gains no import.
- Test layout: hall (0,0) as start (core/rooms.js:1798); office_n (0,-256), left-aligned (1412-1437); reception (0,256) and server (320,256), since the group width equals the hall's (1537-1590). Doors: office_n/hall x = 48 (doors.js parity at the shared wall, both sides); hall/reception x = 48 and hall/server x = 592 at y = 288 (placeSouthDoorsMultiple + snapToTileCentre, aligned north doors). Map sizes are 10x10, 20x10, 10x10, 10x10. Hall `walls` (10,1) and `room` (19,0) are non-null. Layer names `hall_room_N` and `hall_walls_N` match the `_room_` / `_walls_` probes. pc10 joins the reception table group with its top at 36. `key` takes the wall slot at top 24.
- Bridge methods `moveTo`, `enterRoom`, `interact`, `walk` and `waitUntil` exist (systems/test-bridge/index.js:538, 782, 910, 1166, 1564). `bin/test-js` accepts file arguments and runs plain `node`. Loading the module from a data URL works for a module with no imports (as test/js/interaction-walls.test.mjs:17-25 does).
- No engine code writes `tile.alpha` or `tile.visible`. npc-sight-occlusion reads tiles by index only (:294).
