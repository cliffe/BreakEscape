# Plan: load only the character atlases a scenario uses

Background: [README.md](README.md) in this folder lists broader RAM options. Its music-buffer item (§1.1) has already been fixed. This plan covers the character atlases from §2.1.

## The problem

`preload()` in `public/break_escape/js/core/game.js` loads all 40 character atlases (`this.load.atlas(...)`, roughly lines 527–819) for every mission. On disk that is 12.9 MB, but each atlas is about 1394×1312 px (256 frames of 80×80), so once decoded it costs about 7.3 MB of texture memory. The total is **~286 MB of decoded textures**, enough to risk mobile Safari killing the tab. Phaser also keeps the source images, so the real figure may be higher.

A mission uses only a handful: m01_first_contact uses 6 atlases (~44 MB) and m02_ransomed_trust uses 11 (~80 MB), plus the player sprite in each case.

Objects, tiles and tilemaps are **out of scope**. They add up to about 7 MB decoded, which isn't worth the effort.

## The approach

Send the list of sprite keys the scenario uses to the client in the bootstrap scenario payload. Queue those atlases in the same Phaser loader pass as the scenario JSON, so they load behind the existing loading screen. Keep an on-demand fallback for when a room loads, in case a key was missed. Loading at boot was chosen over loading per room because uploading an atlas to the GPU during play can cause a visible stutter on phones.

## Facts the design relies on (all checked against the code)

- `GET /games/:id/scenario` (`games_controller.rb#scenario`, ~line 255) returns `Game#filtered_scenario_for_bootstrap` (`app/models/break_escape/game.rb:590`). That method strips each room to `type connections locked lockType requires difficulty door_sign keyPins ambientSound ambientVolume`, so **NPCs are not in the bootstrap payload**. The comment in `config/routes.rb:22` saying it "Returns full scenario_data JSON" is wrong.
- NPCs are defined in `scenario_data['rooms'][roomId]['npcs']`. No scenario uses a top-level `npcs` array.
- Only NPCs with `npcType` `person` or `both` get a world sprite (`rooms.js` `createNPCSpritesForRoom`, ~line 3060). `npc.spriteSheet` defaults to `'hacker'` (`npc-sprites.js:27`).
- Room NPC data arrives per room. `loadRoom` (`rooms.js:748`, called from `doors.js:684` and `npc-behavior.js:560`) and the starting-room path (`game.js` ~line 1164) both `await window.npcLazyLoader.loadNPCsForRoom(roomId, roomData)` (`npc-lazy-loader.js:23`) **before** `createRoom()`. This is where the fallback goes.
- The player sprite resolves as `breakEscapeConfig.playerSprite || gameScenario.player.spriteSheet || 'male_hacker_hood_v2'` (`player.js:221`, `game.js:1015`). Rails always sets `playerSprite` (`app/views/break_escape/games/show.html.erb:187`). Standalone `?scenario=` mode has no `breakEscapeConfig`.
- The loader `baseURL` is set globally (`js/utils/constants.js:75`), so relative paths like `characters/<key>.png` work. Use the `ASSETS_VERSION` query string from `js/config.js`, as preload does.
- `update()` returns early until `window.player` exists, and `create()` is already `async`.
- m02 uses bed spritesheets (`bed2`, `bed_mr_pryce`, `bed_ms_chen`) as NPC `spriteSheet`s. These are `this.load.spritesheet` objects with fixed frame sizes and **must stay preloaded**, as must the legacy `hacker` / `hacker-red` spritesheets.
- The character picker (`js/ui/sprite-grid.js`) runs its own `Phaser.Game` and loader, so it isn't affected.
- Phaser is 3.60.0, loaded from the CDN (`show.html.erb:255`).

## Changes

### 1. Server: add `characterSprites` to the bootstrap payload

In `Game#filtered_scenario_for_bootstrap`, build the list from the **unfiltered** `scenario_data` before the rooms are stripped (or from `scenario_data` directly, as long as it doesn't depend on the filtered copy):

```ruby
filtered['characterSprites'] = (scenario_data['rooms'] || {}).values
  .select { |r| r.is_a?(Hash) }
  .flat_map { |r| r['npcs'] || [] }
  .select { |n| %w[person both].include?(n['npcType']) }
  .map { |n| n['spriteSheet'] || 'hacker' }
  .push(scenario_data.dig('player', 'spriteSheet'))
  .compact.uniq
```

Send only the sprite keys, never any other NPC fields.

Add tests to `test/models/break_escape/filtered_scenario_test.rb` checking that:

- `characterSprites` lists the person and both NPC sheets and the player sheet, with no duplicates
- phone NPCs are excluded
- no NPC data appears in the room entries (the existing behaviour still holds)

Fix the comment in `config/routes.rb:22`.

### 2. New module `public/break_escape/js/systems/character-textures.js`

It exports three functions.

- `collectCharacterSprites(scenario)`: returns `scenario.characterSprites` if present. Otherwise it walks `scenario.rooms[*].npcs`, applying the same person/both filter and the `'hacker'` default, and adds `scenario.player?.spriteSheet`. The walk is the fallback for standalone mode, where the full scenario file is loaded.
- `queueCharacterAtlases(scene, keys)`: for each unique key that is not already in `scene.textures`, call `scene.load.atlas(key, \`characters/${key}.png?v=${ASSETS_VERSION}\`, \`characters/${key}.json?v=${ASSETS_VERSION}\`)`. It doesn't call `start()\` and is used during preload.
- `ensureCharacterTexture(scene, key)` / `ensureCharacterTextures(scene, keys)`: return Promises and are used at runtime as the fallback. Keep a `Map` of pending promises per key so concurrent callers share one load. **Resolve on that file's own completion event, not `load.once('complete')`**, because the loader is shared and `'complete'` fires for whatever batch ends first. Also listen for `loaderror`, filtered by `file.key === key`, and resolve `false` with a `console.warn` on failure. Call `scene.load.start()` only if `!scene.load.isLoading()`. Log at warn level whenever this path actually loads something (`character atlas "<key>" was not preloaded; loading on demand`), because that means the boot list missed it.

**Check before relying on them:** the exact event name Phaser 3.60 emits when an atlas finishes. I expect `filecomplete-atlasjson-<key>`, because `load.atlas` creates an `AtlasJSONFile` MultiFile of type `atlasjson`. Read the 3.60.0 source (`npm pack phaser@3.60.0`, or the CDN build) to confirm. If it's wrong, `scene.textures.once('addtexture-' + key, ...)` (TextureManager `ADD_KEY` event) is the alternative. Check which one exists in 3.60.

### 3. `game.js` preload

- Delete all 40 `this.load.atlas('<character>', ...)` calls, including the block under the `// PixelLab API imports (tools/pixellab_pipeline.py import --register)` marker. **Keep** the `hacker` / `hacker-red` spritesheets, the bed spritesheets and everything else.
- Queue the player sprite straight away if it's known: `if (window.breakEscapeConfig?.playerSprite) queueCharacterAtlases(this, [window.breakEscapeConfig.playerSprite])`.
- Hook the scenario JSON so the rest are queued in the same loader pass:

```js
this.load.once('filecomplete-json-gameScenarioJSON', (key, type, scenario) => {
    queueCharacterAtlases(this, collectCharacterSprites(scenario));
});
```

This must be registered **before** the `this.load.json('gameScenarioJSON', ...)` calls (~lines 869–894). **Check** that in Phaser 3.60 (a) the `filecomplete-json-<key>` handler receives the parsed data as its third argument, and (b) files added while the loader is running are processed in the same pass, so `create()` waits for them. If (a) is false, read `this.cache.json.get('gameScenarioJSON')` inside the handler. If (b) is false, add `await ensureCharacterTextures(this, collectCharacterSprites(gameScenario))` near the start of `create()`, before `createPlayer(this)` (~line 1005), and move the `document.getElementById('loading').style.display = 'none'` line to after it.

### 4. `create()`: make sure the player sprite is loaded

Just before `createPlayer(this)`, add `await ensureCharacterTexture(this, playerKey)`, where `playerKey` uses the same resolution chain as `player.js:221`. This returns immediately in Rails mode, and in standalone mode it loads the sprite.

### 5. Fallback in `NPCLazyLoader.loadNPCsForRoom`

Run `ensureCharacterTextures(scene, <person/both spriteSheets in roomData.npcs>)` in parallel with the existing `storyPromises` (`Promise.all`) and wait for both before the register loop. It needs a scene reference. The constructor currently takes only `npcManager` (created in `js/main.js` ~line 131). Either pass the scene in after the game exists, or use the module-level `gameRef` pattern from `rooms.js`. Pick whichever matches how `main.js` wires things.

### 6. `player.js` in-game sprite switch

`updatePlayerSprite` (~line 120) loads atlases itself using `load.once('complete')` and an absolute path without `ASSETS_VERSION`. Switch it to `ensureCharacterTexture`.

### 7. Validator: `scripts/validate_scenario.rb`

Next to the existing talk-image check (~line 2413–2421), add an **error** for each person/both NPC whose `spriteSheet` (default `hacker`) has neither:

- both `public/break_escape/assets/characters/<key>.png` and `<key>.json`, nor
- a matching `this.load.spritesheet('<key>'` entry parsed from `game.js`. Parse game.js so this check never needs its own hard-coded list.

Check the player's `spriteSheet` the same way if the scenario sets one.

### 8. Tooling and docs

- `tools/pixellab_pipeline.py`: `register_atlas` (~line 1270) and `--register` (~line 1653) edit game.js. Make `--register` a no-op that prints "atlases are now loaded on demand by key; no registration needed". Keep the flag so existing commands still work.
- `.claude/skills/pixellab-character-pipeline/SKILL.md:150`: update the `--register` line to say that adding the files and setting `"spriteSheet"` is now enough.
- `docs/SPRITE_SYSTEM.md`: update any text that says atlases must be added to preload.

## Out of scope (don't change)

- The object-swap lazy loads in `rooms.js` (~lines 539, 662, 703) use the same fragile `load.once('complete')` pattern. Leave them alone; mention them in the PR description as a follow-up.
- Tilemaps, object PNGs and audio. Music buffers are already fixed.
- Any `tools/playtest/*.xml` files.

## Verification

Run each of these and report the results:

1. `bin/rails test test/models/break_escape/filtered_scenario_test.rb`, then the full `bin/rails test`.
2. `ruby scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb`, and the same for `m02_ransomed_trust`. There should be no new errors. Then break one `spriteSheet` key on purpose and confirm the new check catches it (revert afterwards).
3. Run the validator over every `scenarios/*/scenario.json.erb`. List any scenario whose NPC sprite keys don't resolve. These are existing bugs: report them, don't fix them.
4. Run the existing JS tests (`node test/js/<name>.test.mjs` for each file in `test/js/`) and confirm nothing has regressed. Add `test/js/character-textures.test.mjs` for `collectCharacterSprites` (person/both filter, `'hacker'` default, player key, dedupe, preference for `characterSprites`), following the style of the existing tests.
5. If a browser is available, load m01 and m02 through the Rails app and confirm that every NPC renders, the player renders, no `was not preloaded` warnings appear, and `Object.keys(game.textures.list)` contains only the scenario's character atlases. If no browser is available, say so. The maintainer will playtest locally.

