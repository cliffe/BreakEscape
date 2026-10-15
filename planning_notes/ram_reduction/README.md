# RAM reduction options for Break Escape

This note lists **concrete, codebase-grounded** ways to lower memory use. **First clarify what “~1GB” measures**: a single browser tab (Chrome Task Manager), the whole browser process, or a Rails/Puma worker on the server. The options below are grouped by layer; many apply to the **Phaser + Web Audio** client, which is the most likely source of large resident set size during play.

---

## 0. Establish a baseline (do this before optimising)

- **Browser**: Record URL, scenario, and duration. Use Chrome Task Manager / Performance memory snapshots; note **JS heap vs GPU memory** (textures live largely outside the JS heap).
- **Compare**: Fresh load vs after 30–60 minutes (detect leaks: music cache, room cache, logs).
- **Rails**: If the 1GB is server-side, profile with `derailed_benchmarks` or heap dumps; Break Escape’s static assets and JSON responses are usually small compared to a multi-worker Puma setup.

---

## 1. Client: audio (high impact)

### 1.1 Unbounded `AudioBuffer` cache (`music-controller.js`)

`MusicController` stores every decoded track in `_bufferCache` keyed by URL (`_loadBuffer`). Decoded PCM is **orders of magnitude larger** than MP3 on disk. The music library under `public/break_escape/assets/music` is on the order of **~138MB on disk**; fully decoded buffers for many tracks can **dominate RAM** in long sessions where playlists rotate.

**Options:**

- **LRU / size cap**: Evict least-recently-used buffers (keep current + next track for crossfade).
- **Streaming playback**: Use `HTMLAudioElement` or `MediaElementAudioSourceNode` for background music so full decode is not held forever (trade-off: different sync/CSP behaviour).
- **Shorter playlists per scenario**: Ship fewer tracks or lower-quality/bitrate sources where acceptable.
- **Lazy playlist loading**: Do not prefetch all playlists; only decode tracks from the active playlist.

### 1.2 Crossfade holds two buffers briefly

Crossfade starts a new `AudioBufferSourceNode` while fading out the old one; both buffers must exist. This is short-lived but spikes memory during transitions.

**Options:** Shorten fade duration; avoid crossfade in low-memory environments (feature flag).

### 1.3 Phaser SFX (`sound-manager.js`)

`preloadSounds` registers many MP3/OGG files; `initializeSounds` creates a **Phaser sound object per clip**. Phaser keeps decoded audio in its cache in addition to Web Audio paths.

**Options:**

- Load **only** sounds needed for the current scenario or minigame.
- Use **shared** generic UI sounds with fewer distinct files.
- Prefer **on-demand** `scene.load.audio` + single-use playback for rare effects.

### 1.4 Analyser node (`music-controller.js`)

`fftSize = 2048` allocates internal buffers for frequency data. This is small compared to music buffers but non-zero.

**Options:** Lower `fftSize` when the Bond visualiser is inactive, or disconnect the analyser until the visualiser opens.

---

## 2. Client: graphics / Phaser (high impact)

### 2.1 Eager preload of maps and images (`game.js` `preload()`)

The main scene preloads **16+ tilemaps** and **100+ images**, plus multiple character **atlases** and **spritesheets**. Everything ends up in Phaser’s texture manager (GPU + backing store).

**Options:**

- **Per-room asset manifests**: Load only tilemaps/textures referenced by the current scenario or the current room’s Tiled file.
- **Texture atlasing for world objects**: Many small PNGs mean many WebGL textures and metadata; packing into atlases reduces texture count and driver overhead (at the cost of art pipeline work).
- **Drop unused rotations/variants**: Chair rotation images and similar multiply entries; load only what scenarios reference.

### 2.2 Multiple `Phaser.Game` instances

Separate Phaser runtimes exist for:

- Main game (`main.js`)
- HUD hand animation (`hud.js` — `Phaser.Game` on a small canvas)
- Lockpicking minigame (`lockpicking-game-phaser.js`)
- Infusion pump minigame (`infusion-pump-minigame.js`)
- Sprite preview (`sprite-grid.js` — destroys previous instance when re-init’d)

Each instance carries **renderer state, caches, and scene graph** overhead.

**Options:**

- Prefer **one** Phaser game where possible (e.g. hand HUD as a Scene overlay or DOM/CSS).
- **Destroy** minigame instances aggressively when closed (verify `destroy(true)` clears textures from the *minigame’s* cache, not the main game’s).
- Use **CANVAS** renderer for tiny auxiliary games (already done for HUD hand) to reduce GPU memory vs WebGL where acceptable.

### 2.3 Render resolution (`constants.js` `GAME_CONFIG.scale.max`)

Max scale allows very large canvas/backbuffer sizes (up to 2560×1920), which increases **framebuffer and compositor** memory on high-DPI displays.

**Options:** Lower `max` width/height for “low memory” mode or player setting.

### 2.4 Pixel art textures

`pixelArt: true` avoids linear filtering but does not reduce stored texture size. Large atlases (80×80 NPC frames × many directions) are still large in VRAM.

**Options:** Reduce frame counts, lower export resolution where art allows, or use fewer NPC archetypes per scenario.

---

## 3. Client: pathfinding and simulation (medium impact)

### 3.1 Legacy player pathfinder grid (`pathfinding.js`)

`initializePathfinder` builds a **full-world** EasyStar grid at **32px** (`GRID_SIZE`) from **all** `rooms` wall tiles. A repository search shows **no imports of `findPath` from `pathfinding.js`** outside that file; **player movement** in `player.js` uses `window.pathfindingManager.findWorldPath` (NPC pathfinding manager) instead.

**Options:**

- **Remove** `initializePathfinder` / `pathfinding.js` if confirmed dead, **or** gate it behind a flag — this eliminates one full-world grid and one `EasyStar.js` instance.

### 3.2 NPC pathfinding (`npc-pathfinding.js`)

For each room: a grid + `EasyStar` instance. Additionally, `rebuildWorldGrid()` builds a **unified world grid** at **`PATHFINDING_STEP` (8px)** — **16× more cells per unit area** than a 32px grid — plus a second `EasyStar` for the world.

**Options:**

- **Coarser world grid** (e.g. 16px) for player pathing only, if gameplay tolerates slightly rougher paths near narrow gaps (needs careful testing with door geometry).
- **Destroy per-room grids** when rooms are fully unloaded (if the engine ever drops room physics/maps); today maps may remain resident.
- **Share one EasyStar** instance with `setGrid` swaps if API usage allows (less overhead than `new EasyStar.js()` per rebuild — verify thread-safety and internal allocations).

### 3.3 `pathfindingManager` maps

`pathfinders`, `grids`, `roomBounds` Maps grow with every initialised room. If rooms are never torn down, this is a **leak-shaped** growth pattern.

**Options:** On room unload, `delete` entries and null grids to allow GC (coordinate with Phaser object destruction).

---

## 4. Client: data and scripting (medium impact)

### 4.1 Full scenario JSON (`game.js`, `window.gameScenario`)

The entire filtered scenario lives in memory for the session, including NPC metadata, objectives, and room references.

**Options:** (Aligns with existing migration notes.) **Room-sliced scenario API** — fetch room payload on demand; trim `gameScenario` to globals + current room + graph of ids. Reduces JSON parse cost and long-lived object graph size.

### 4.2 `roomDataCache` (`rooms.js`)

`Map` caching API room data avoids duplicate fetches but retains **duplicate object graphs** until cleared.

**Options:** Cap cache size; evict far rooms in large hub scenarios.

### 4.3 Ink stories (`npc-lazy-loader.js`, `NPCLazyLoader.storyCache`)

Stories are fetched and cached per `storyPath` for the session. Large Ink JSON graphs stay alive after NPCs are left behind.

**Options:** Evict stories for NPCs in rooms that are **unloaded** and not needed for global state; or cap number of cached stories.

### 4.4 `ink-engine.js` stringification

`loadStory` uses `JSON.stringify` on object input before `new inkjs.Story(...)`, doubling peak memory briefly for large JSON.

**Options:** Pass string directly from `fetch().text()` where possible; avoid duplicate representation.

### 4.5 Vendor `ink.js`

Loaded as a global script; parsed/compiled JS adds to baseline memory (modest vs textures/audio).

**Options:** Dynamic `import()` of ink only when opening chat; ensure tree-shaking / no duplicate bundles.

---

## 5. Client: UI and logging (lower impact, easy wins)

### 5.1 Bond visualiser (`bond-visualiser.js`)

Large module (~1.6k lines); if bundled/loaded eagerly, it increases **parse/compile** memory.

**Options:** Dynamic import when switching to the `victory` playlist (or first open).

### 5.2 Verbose `console.log`

Many systems log heavily (e.g. NPC sprite setup, Ink, pathfinding). With DevTools open, consoles retain references and strings.

**Options:** Strip or gate logs in production builds; use a debug flag (several subsystems already use `window.*Debug` patterns).

### 5.3 Title screen / minigames

Extra DOM, canvases, and listeners if not fully torn down after `create()`.

**Options:** Audit title-screen teardown; ensure timers and listeners are removed.

---

## 6. Server / Rails (if 1GB is Puma)

- **Worker count**: Each worker loads the full Rails app; reducing `WEB_CONCURRENCY` lowers total RAM at the cost of throughput.
- **Memory leaks**: Scenario generation, large JSON parsing, or caching in controllers/models — audit `GamesController` and game/session code paths if heap grows over time.
- **Bootsnap / Zeitwerk**: Usually help rather than hurt; focus on **per-request allocations** and **long-lived caches**.

---

## 7. Suggested priority order (pragmatic)

1. **Profile** to confirm browser vs server and whether heap or GPU dominates.
2. **Music buffer cache LRU** + avoid decoding entire library over time.
3. **Remove or disable legacy `pathfinding.js`** after confirming no callers.
4. **Reduce eager Phaser preload** (scenario-driven manifests).
5. **Consolidate auxiliary Phaser games** or ensure aggressive `destroy(true)`.
6. **Tune world pathfinding resolution** only after measuring grid build cost and RAM.
7. **Scenario/room streaming** for large missions (larger engineering effort, aligns with existing planning docs under `planning_notes/rails-engine-migration*`).

---

## 8. References in this repo

| Area | Location |
|------|----------|
| Main preload | `public/break_escape/js/core/game.js` (`preload`) |
| Legacy pathfinding | `public/break_escape/js/core/pathfinding.js` |
| World / NPC pathfinding | `public/break_escape/js/systems/npc-pathfinding.js` |
| Player path usage | `public/break_escape/js/core/player.js` (`findWorldPath`) |
| Music cache | `public/break_escape/js/music/music-controller.js` (`_bufferCache`, `_loadBuffer`) |
| SFX | `public/break_escape/js/systems/sound-manager.js` |
| Path step | `public/break_escape/js/utils/constants.js` (`PATHFINDING_STEP`, `GAME_CONFIG`) |
| Room / cache | `public/break_escape/js/core/rooms.js` (`roomDataCache`) |
| Ink lazy load | `public/break_escape/js/systems/npc-lazy-loader.js` |
| Extra Phaser games | `hud.js`, `lockpicking-game-phaser.js`, `infusion-pump-minigame.js`, `sprite-grid.js` |
| Prior art (bandwidth/memory narrative) | `planning_notes/rails-engine-migration/ARCHITECTURE_COMPARISON.md` |

---

*Generated from codebase review (2026-04-10). Sizes measured locally: `public/break_escape/assets/music` ≈ 138MB on disk; objects/rooms/sounds smaller on disk but expand in GPU/decoded audio.*
