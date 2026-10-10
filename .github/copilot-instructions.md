# Break Escape: AI Coding Agent Instructions

## Project Overview
Break Escape is a Rails Engine implementing a web-based educational game framework combining escape room mechanics with cyber-physical security learning. Players navigate 2D top-down environments (powered by Phaser.js), collect items, and solve security-themed mini-games aligned to the Cyber Security Body of Knowledge (CyBOK).

### Deployment Modes
Break Escape always runs as a Rails Engine, but operates in two distinct modes:
1. **Standalone Mode**: Local Rails instance with demo user support (development/testing)
2. **Mounted Mode**: Integrated into parent Rails applications like Hacktivity for course management and secure assessment delivery

**Server-Side Validation**: Solution validation is enforced server-side. Client-side validation is for UX and gameplay only; solutions (such as passwords and pins) are verified against solutions on the backend before further game content such as rooms can be accessed.

## Architecture

### Rails Engine Integration
Break Escape is always a Rails Engine, operating in one of two modes:

**Standalone Mode** (Local Development):
- Runs as a self-contained Rails app with demo user support
- Uses `break_escape_demo_users` table for test players
- Scenarios rendered on-demand with ERB template substitution (randomized passwords/PINs)
- State persisted in `break_escape_games` JSONB column

**Mounted Mode** (Production/Hacktivity):
- Mounts into host Rails application (e.g., Hacktivity) via `config/routes.rb`
- Uses host app's `current_user` via Devise for player authentication
- Game frontend served from `app/views/` and `public/` assets
- Scenario data and player progress persisted via Rails models (`app/models/`)
- Solution validation endpoints exposed as Rails controllers (`app/controllers/`)
- Admin/instructor UI for scenario management runs in the host application
- **Server-side validation of all solutions** prevents client-side tampering and ensures assessment integrity

### Core Systems (Sequential Initialization)
1. **Game Engine** (`js/core/game.js`): Phaser.js initialization, scene management (preload → create → update)
2. **Rooms** (`js/core/rooms.js`): Dynamic room loading from JSON scenarios, depth layering by Y-position + layer offset
3. **Player** (`js/core/player.js`): Character sprite with pathfinding, keyboard/mouse controls, animation system
4. **Systems** (`js/systems/`): Modular subsystems (interactions, inventory, doors, collisions, biometrics)
5. **Mini-games** (`js/minigames/`): Framework-based educational challenges (lockpicking, password, biometrics, etc.)

### Data Flow
- **Scenarios** (JSON) → loaded into `window.gameScenario` → populate rooms/objects → create interactive environment
- **Player Actions** → interaction system checks proximity → triggers object interactions or mini-games
- **Game State** stored in `window.gameState`: `{ biometricSamples, bluetoothDevices, notes, startTime }`

### Global Window Object
Break Escape attaches critical runtime objects to `window` for cross-module access (no complex bundling):
```javascript
window.game              // Phaser game instance
window.gameScenario      // Current scenario JSON
window.player            // Player sprite
window.rooms             // Object of room data
window.gameState         // Persistent game state
window.inventory         // Player's collected items
```

## Key Patterns & Conventions

### Room System & Depth Calculation
**Every object's depth = worldY + layerOffset** (not Z-index). This ensures correct perspective in top-down view:
- Walls: `roomY + 0.2`
- Interactive Objects: `objectBottomY + 0.5`
- Player: `playerBottomY + 0.5`
- Doors: `doorY + 0.45`

See `js/core/rooms.js` (lines 1-40) for detailed depth hierarchy documentation.

### Object Interactions
1. Objects must have `interactable: true` and `active: true` in scenario JSON
2. Interaction distance: `INTERACTION_RANGE = 64px` (checked every 100ms)
3. Interaction handlers in `js/systems/interactions.js` dispatch to specialized systems:
   - Locks: `unlock-system.js` (key-based, password, PIN, biometric)
   - Doors: `doors.js` (movement triggers)
   - Inventory: `inventory.js` (item collection)
   - Biometrics: `biometrics.js` (fingerprint collection/scanning)

### Mini-game Framework
All mini-games extend `MinigameScene` (`js/minigames/framework/base-minigame.js`):
```javascript
// Registration in js/minigames/index.js
MinigameFramework.registerScene('game-name', GameClass);

// Usage
window.MinigameFramework.startMinigame('game-name', { data });
```
Mini-games handle modal display, pause/resume, and return callbacks automatically.

### Inventory System
- Items stored as objects with `id`, `name`, `texture` properties
- Item identifiers created via `createItemIdentifier()` for UI display
- Starting items defined in `startItemsInInventory` array at scenario root level
- Starting items automatically added to inventory on game initialization

### Objectives / Aims System
- `js/systems/objectives-manager.js` manages all aims and tasks client-side
- Aims have: `aimId`, `title`, `status` (active/locked/completed), `tasks[]`, optional `unlockCondition`
- Tasks have: `taskId`, `title`, `type` (collect_items/unlock_room/npc_conversation/submit_flags/custom/manual/…)
- `completeTask(taskId)` calls the server first; on `!response.success` the task is **reverted to active** and `window.gameAlert` shows the server error — the player sees the rejection immediately
- **Mission Conclusion** — mark exactly one aim with `missionConclusion: true`:
  - `concludeRequires: { "tasksCompleted": ["submit_ssh_flag", …] }` — server-side ending gate: listed tasks must be done before `mission_concluded_at` is written. A failed gate returns a `warning` alert to the player. List the **large technical work only** (the mandatory flag nodes from the dungeon graph); story tasks are scored, never gated. Omit or use `{}` to trust the client. (`requiresCompleted` was the old name and now errors in the validator.)
  - `conclusionScreen: { "type": "end_screen" | "bond_visualiser" }` — which overlay to show on conclusion and on reload
  - Score is the raw formula `(tasks/total)×70 + (aims/total)×30` — never forced to 100 % by the conclusion flag
- On page reload, `main.js` checks `window.breakEscapeConfig.missionConcludedAt` and replays the `conclusionScreen` via `objectivesManager.handleMissionConcluded(aim)` once `game_loaded` fires

### Scenario JSON Structure
```json
{
  "scenario_brief": "Mission description",
  "endGoal": "What player must accomplish",
  "startRoom": "room_id",
  "startItemsInInventory": [
    {
      "type": "object_type",
      "name": "Display name",
      "takeable": true,
      "observations": "Item description"
    }
  ],
  "rooms": {
    "room_id": {
      "type": "room_type",
      "connections": { "north": "next_room" },
      "objects": [
        {
          "type": "object_type",
          "name": "Display name",
          "takeable": false,
          "interactable": true,
          "scenarioData": { /* unlock conditions */ }
        }
      ]
    }
  }
}
```

## Essential Development Workflows

### Adding a New Security Challenge
1. Create mini-game class in `js/minigames/{challenge-name}/`
2. Extend `MinigameScene` base class (see `js/minigames/framework/base-minigame.js`)
3. Register in `js/minigames/index.js` and export
4. Trigger from interactions via `window.MinigameFramework.startMinigame()`

### Adding Scenario Content
1. Create `scenarios/{name}.json` with room/object definitions
2. Use existing room types from `assets/rooms/*.json` Tiled files
3. Objects must match registered texture names (loaded in `game.js` preload)
4. Reference scenarios from `scenario_select.html`

### Debugging Game Issues
- **Player stuck/pathfinding**: Check `STUCK_THRESHOLD` (1px) and `PATH_UPDATE_INTERVAL` (500ms) in `constants.js`
- **Object not interactive**: Verify `interactable: true`, `active: true`, and `INTERACTION_RANGE` distance in scenario JSON
- **Depth/layering wrong**: Recalculate depth = `worldY + layerOffset` in `rooms.js` hierarchy
- **Mini-game not loading**: Verify registered in `minigames/index.js` and exported from minigame class

## Project-Specific Patterns

### Tiled Map Integration
Rooms use Tiled editor JSON format (`assets/rooms/*.tmj`). Key workflow:
- Objects stored in `map.getObjectLayer()` collections
- Tiled object GID → texture lookup via tileset registry
- `TiledItemPool` class manages available objects to prevent duplicates

### External Dependencies
- **Phaser.js v3.60**: Game engine (graphics, physics, input)
- **EasyStar.js v0.4.4**: Pathfinding (A* algorithm for player movement)
- **CyberChef v10.19.4**: Embedded crypto tools (iframe-based in laptop minigame)

### URL Versioning Convention
Assets use query string versioning: `import { x } from 'file.js?v=7'` to bust browser cache during development.

### CSS Styling Conventions
Maintain pixel-art aesthetic consistency:
- **Avoid `border-radius`** - All UI elements use sharp, 90-degree corners
- **Borders must be exactly 2px** - This matches the pixel-art tile size (32px tiles = 2px scale factor)
- Examples: buttons, panels, modals, and input fields in `css/*.css`

## Quick Command Reference

### Local Development
```bash
python3 -m http.server  # Start local web server (root dir)
# Access: http://localhost:8000/scenario_select.html
```

### Scenario Testing
- Edit scenario JSON directly
- Reload browser (hard refresh if using version queries)
- Test from `scenario_select.html` dropdown

## Files to Read First When Onboarding
1. `README.md` - Project overview and feature list
2. `js/main.js` - Game initialization and global state setup
3. `js/core/game.js` - Phaser scene lifecycle and asset loading
4. `js/core/rooms.js` - Room management and depth layering documentation
5. `scenarios/biometric_breach.json` - Full example scenario structure
6. `js/minigames/framework/minigame-manager.js` - Mini-game architecture
