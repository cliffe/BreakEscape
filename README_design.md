# BreakEscape Game Design Documentation

This document provides a comprehensive overview of the BreakEscape codebase architecture, file organization, and component systems. It serves as a guide for developers who want to understand, modify, or extend the game.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Layout](#file-layout)
3. [Core Components](#core-components)
4. [Recent Refactoring (2024)](#recent-refactoring-2024)
5. [Game Systems](#game-systems)
6. [Asset Organization](#asset-organization)
7. [Implementing New Mini-Games](#implementing-new-mini-games)
8. [CSS Architecture](#css-architecture)
9. [Development Workflow](#development-workflow)
10. [Architecture Notes](#architecture-notes)

## Architecture Overview

BreakEscape is built using modern web technologies with a modular architecture:

- **Game Engine**: Phaser.js 3.x for 2D game rendering and physics
- **Module System**: ES6 modules with explicit imports/exports
- **Architecture Pattern**: Component-based with clear separation of concerns
- **Asset Loading**: JSON-based scenario configuration with dynamic asset loading
- **UI Framework**: Custom HTML/CSS overlay system integrated with game canvas

### Key Design Principles

1. **Modularity**: Each system is self-contained with clear interfaces
2. **Extensibility**: New mini-games, rooms, and scenarios can be added easily
3. **Maintainability**: Clean separation between game logic, UI, and data
4. **Performance**: Efficient asset loading and memory management

### Recent Improvements (2024)

The codebase recently underwent significant refactoring:
- ✅ **Reduced code duplication** - Eliminated ~245 lines of duplicate code
- ✅ **Better organization** - Split monolithic files into focused modules
- ✅ **Fixed critical bugs** - Biometric and Bluetooth locks now work correctly
- ✅ **Single source of truth** - Unified unlock system for all lock types
- ✅ **Improved robustness** - Better handling of dynamic room loading

See [Recent Refactoring (2024)](#recent-refactoring-2024) for details.

## File Layout

```
BreakEscape/
├── index.html              # Main game entry point
├── index_new.html          # Updated main entry point with modern UI
├── scenario_select.html    # Scenario selection interface
├── 
├── css/                    # Styling and UI components
│   ├── main.css           # Core game styles
│   ├── panels.css         # Side panel layouts
│   ├── modals.css         # Modal dialog styles
│   ├── inventory.css      # Inventory system styles
│   ├── minigames.css      # Mini-game UI styles
│   ├── notifications.css  # Notification system styles
│   └── utilities.css      # Utility classes and helpers
│
├── js/                     # JavaScript source code
│   ├── main.js            # Application entry point, init, and game state variables
│   │
│   ├── core/              # Core game engine components
│   │   ├── game.js        # Main game scene (preload, create, update)
│   │   ├── player.js      # Player character logic and movement
│   │   ├── rooms.js       # Room management and layout system
│   │   └── pathfinding.js # A* pathfinding for player movement
│   │
│   ├── systems/           # Game systems and mechanics
│   │   ├── interactions.js    # Core interaction routing - refactored!
│   │   ├── unlock-system.js   # Centralized unlock logic for all lock types
│   │   ├── key-lock-system.js # Key-lock mapping and validation
│   │   ├── biometrics.js      # Fingerprint collection and dusting
│   │   ├── minigame-starters.js # Minigame initialization
│   │   ├── inventory.js       # Inventory management and item handling
│   │   ├── doors.js           # Door sprites, interactions, and transitions
│   │   ├── collision.js       # Wall collision detection and management
│   │   ├── object-physics.js  # Chair physics and object collisions
│   │   ├── player-effects.js  # Visual effects for player interactions
│   │   ├── notifications.js   # In-game notification system
│   │   └── debug.js           # Debug tools and development helpers
│   │
│   ├── ui/                # User interface components
│   │   ├── panels.js      # Side panels (biometrics, bluetooth, notes)
│   │   └── modals.js      # Modal dialogs and popup windows
│   │
│   ├── utils/             # Utility functions and helpers
│   │   ├── constants.js   # Game configuration and constants
│   │   ├── helpers.js     # General utility functions
│   │   └── crypto-workstation.js # CyberChef integration
│   │
│   └── minigames/         # Mini-game framework and implementations
│       ├── index.js       # Mini-game registry and exports
│       ├── framework/     # Mini-game framework
│       │   ├── base-minigame.js    # Base class for all mini-games
│       │   └── minigame-manager.js # Mini-game lifecycle management
│       ├── lockpicking/   # Lockpicking mini-game
│       │   └── lockpicking-game-phaser.js
│       ├── dusting/       # Fingerprint dusting mini-game
│       │   └── dusting-game.js
│       ├── biometrics/    # Biometric scanner minigame
│       │   └── biometrics-minigame.js
│       ├── bluetooth/     # Bluetooth scanner minigame
│       │   └── bluetooth-scanner-minigame.js
│       ├── notes/         # Notes viewing minigame
│       │   └── notes-minigame.js
│       └── lockpick/      # Lockpick set minigame
│           └── lockpick-set-minigame.js
│
├── assets/                 # Game assets and resources
│   ├── characters/        # Character sprites and animations
│   ├── objects/           # Interactive object sprites
│   ├── rooms/             # Room layouts and images
│   ├── scenarios/         # Scenario configuration files
│   ├── sounds/            # Audio files (sound effects)
│   └── tiles/             # Tileset graphics
│
└── scenarios/             # JSON scenario definitions
    ├── ceo_exfil.json     # CEO data exfiltration scenario
    ├── biometric_breach.json # Biometric security breach scenario
    └── scenario[1-4].json # Additional numbered scenarios
```

## Core Components

### 1. Game Engine (`js/core/`)

#### game.js
- **Purpose**: Main Phaser scene with preload, create, and update lifecycle
- **Key Functions**:
  - `preload()`: Loads all game assets (sprites, maps, scenarios)
  - `create()`: Initializes game world, player, rooms, and systems
  - `update()`: Main game loop for movement, interactions, and system updates
- **Dependencies**: All core systems and utilities

#### player.js
- **Purpose**: Player character movement, animation, and state management
- **Key Features**:
  - Click-to-move with pathfinding integration
  - Sprite animation for movement directions
  - Room transition detection
  - Position tracking and state management

#### rooms.js
- **Purpose**: Room layout calculation, creation, and management
- **Key Features**:
  - Dynamic room positioning based on JSON connections
  - Room revelation system (fog of war)
  - Door validation and collision detection
  - Multi-room layout algorithms for complex scenarios

#### pathfinding.js
- **Purpose**: A* pathfinding implementation for intelligent player movement
- **Key Features**:
  - Obstacle avoidance
  - Efficient path calculation
  - Path smoothing and optimization

### 2. Game Systems (`js/systems/`)

The game systems have been refactored into specialized, focused modules for better maintainability and code organization.

#### interactions.js (Recently Refactored!)
- **Purpose**: Core interaction routing and object handling
- **Key Features**:
  - Click detection on game objects
  - Routes interactions to appropriate systems
  - Object state management (opened, unlocked, etc.)
  - Container object support (safes, suitcases)
  - Takeable item handling
- **Architecture**: Lean routing layer that delegates to specialized systems
- **Improvement**: Reduced from 1,605 lines (81% reduction) by extracting specialized functionality

#### unlock-system.js (New!)
- **Purpose**: Centralized unlock logic for all lock types
- **Key Features**:
  - Unified unlock handling for doors and items
  - Supports 5 lock types: key, PIN, password, biometric, Bluetooth
  - Comprehensive biometric validation (fingerprint quality thresholds)
  - Bluetooth device matching with signal strength validation
  - Dynamic lockpick difficulty per object
  - Single source of truth for all unlock logic
- **Benefits**: Eliminates code duplication, consistent behavior across all locked objects

#### key-lock-system.js (New!)
- **Purpose**: Key-lock mapping and pin height generation
- **Key Features**:
  - Global key-lock mapping system
  - Predefined lock configurations
  - Key cut generation for visual representation
  - Pin height validation
  - Lock-key compatibility checking
- **Integration**: Used by lockpicking minigame for accurate pin representation

#### biometrics.js (New!)
- **Purpose**: Fingerprint collection and analysis
- **Key Features**:
  - Fingerprint collection from objects
  - Quality-based fingerprint data generation
  - Integration with dusting minigame
  - Biometric scan handling
  - Owner-specific fingerprint matching
- **Workflow**: Collect → Dust → Store → Validate against locks

#### minigame-starters.js (New!)
- **Purpose**: Minigame initialization and setup
- **Key Features**:
  - Lockpicking minigame launcher
  - Key selection minigame launcher  
  - Callback management for minigame completion
  - Timing coordination with game scene cleanup
- **Architecture**: Handles the bridge between game objects and minigame framework

#### inventory.js
- **Purpose**: Item collection, storage, and usage management
- **Key Features**:
  - Item addition and removal
  - Visual inventory display with item icons
  - Drag-and-drop item interaction
  - Item identifier creation
  - Notepad integration
- **Exports**: Now properly exports functions for use by other systems

#### doors.js
- **Purpose**: Door sprites, interactions, and room transitions
- **Key Features**:
  - Door sprite creation and management
  - Door interaction handling
  - Door opening animations
  - Room transition detection
  - Door visibility management
  - Collision processing
- **Recent Improvement**: Removed duplicate unlock logic, now uses unlock-system.js

#### collision.js
- **Purpose**: Wall collision detection and tile management
- **Key Features**:
  - Wall collision box creation
  - Tile removal under doors
  - Room-specific collision management
  - Player collision registration
- **Robustness**: Uses window.game fallback for dynamic room loading

#### object-physics.js
- **Purpose**: Chair physics and object collisions
- **Key Features**:
  - Swivel chair rotation mechanics
  - Chair-to-chair collision detection
  - Chair-to-wall collision setup
  - Collision management for newly loaded rooms
- **Robustness**: Handles collisions for dynamically loaded rooms

#### player-effects.js
- **Purpose**: Visual effects for player interactions
- **Key Features**:
  - Bump effects when colliding with objects
  - Plant sway animations
  - Sprite depth management
- **Polish**: Adds visual feedback to enhance player experience

### 3. UI Framework (`js/ui/`)

#### panels.js
- **Purpose**: Side panel management for game information
- **Key Features**:
  - Collapsible panel system
  - Dynamic content updates
  - Panel state persistence

#### modals.js
- **Purpose**: Modal dialog system for important interactions
- **Key Features**:
  - Scenario introductions
  - Item examination
  - System messages and confirmations

## Recent Refactoring (2024)

The codebase underwent a major refactoring to improve maintainability, eliminate code duplication, and fix critical bugs in the lock system.

### What Changed

#### 1. interactions.js - Massive Reduction (81% smaller!)
- **Before**: 1,605 lines of mixed responsibilities
- **After**: 289 lines of focused interaction routing
- **Extracted**:
  - Unlock logic → `unlock-system.js`
  - Key-lock mapping → `key-lock-system.js`
  - Biometric collection → `biometrics.js`
  - Minigame initialization → `minigame-starters.js`
  - Inventory functions → `inventory.js`

#### 2. doors.js - Eliminated Duplication
- **Before**: 1,004 lines with duplicate unlock logic
- **After**: 880 lines using centralized unlock system
- **Improvement**: Removed 124 lines of duplicate code, now uses `unlock-system.js`

#### 3. Unified Unlock System
- **Problem**: Door unlock logic was duplicated in two places with inconsistent behavior
- **Solution**: Created `unlock-system.js` as single source of truth
- **Impact**: 
  - Fixed broken biometric locks (now validates specific fingerprints with quality thresholds)
  - Fixed broken Bluetooth locks (now validates specific devices with signal strength)
  - Eliminated ~120 lines of duplicate code
  - Consistent behavior for all lock types

#### 4. Fixed Dynamic Room Loading
- **Problem**: Collisions and references broke when rooms loaded after minigames
- **Solution**: Updated `collision.js`, `object-physics.js`, and `doors.js` to use `window.game` and `window.rooms` fallbacks
- **Impact**: Proper collision detection in dynamically loaded rooms

### Benefits of Refactoring

1. **Better Code Organization**
   - Clear separation of concerns
   - Easier to locate specific functionality
   - Reduced cognitive load when reading code

2. **Eliminated Bugs**
   - Biometric locks now work correctly (specific fingerprint + quality validation)
   - Bluetooth locks now work correctly (device matching + signal strength)
   - Collision system robust to async room loading

3. **Improved Maintainability**
   - Single source of truth for unlock logic
   - No code duplication to keep in sync
   - Easier to add new lock types or features

4. **Better Testing**
   - Smaller, focused modules are easier to test
   - Clear interfaces between components
   - Fewer dependencies to mock

## Game Systems

### Scenario System
- **Configuration**: JSON-based scenario definitions
- **Components**: Rooms, objects, locks, and victory conditions
- **Flexibility**: Complete customization without code changes

### Lock System (Recently Improved!)
- **Types**: Key, PIN, password, biometric, Bluetooth proximity
- **Architecture**: Centralized in `unlock-system.js` for consistency
- **Features**:
  - Biometric locks validate specific fingerprints with quality thresholds
  - Bluetooth locks validate specific devices with signal strength requirements
  - Dynamic lockpick difficulty per object
  - Comprehensive error messaging
- **Integration**: Works with rooms, objects, and containers
- **Progression**: Supports complex unlocking sequences

### Asset Management
- **Loading**: Dynamic asset loading based on scenario requirements
- **Caching**: Efficient resource management with Phaser's asset cache
- **Organization**: Logical separation by asset type and purpose

## Asset Organization

### Images (`assets/`)
- **characters/**: Player character sprite sheets
- **objects/**: Interactive object sprites (organized by type)
- **rooms/**: Room background images and tiled map data
- **tiles/**: Individual tile graphics for maps

### Data (`assets/` and `scenarios/`)
- **Room Maps**: Tiled JSON format for room layouts
- **Scenarios**: JSON configuration files defining game content
- **Audio**: Sound effects for mini-games and interactions

## Implementing New Mini-Games

BreakEscape uses a flexible mini-game framework that allows developers to create new interactive challenges. Here's a comprehensive guide:

### 1. Framework Overview

The mini-game framework consists of:
- **Base Class**: `MinigameScene` provides common functionality
- **Manager**: `MinigameFramework` handles lifecycle and registration
- **Integration**: Automatic UI overlay and game state management

### 2. Creating a New Mini-Game

#### Step 1: Create the Mini-Game Class

Create a new file: `js/minigames/[minigame-name]/[minigame-name]-game.js`

```javascript
import { MinigameScene } from '../framework/base-minigame.js';

export class MyMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        
        // Initialize your game-specific state
        this.gameData = {
            score: 0,
            timeLimit: params.timeLimit || 30000, // 30 seconds default
            difficulty: params.difficulty || 'medium'
        };
    }
    
    init() {
        // Call parent init to set up basic UI structure
        super.init();
        
        // Customize the header
        this.headerElement.innerHTML = `
            <h3>${this.params.title || 'My Mini-Game'}</h3>
            <p>Game instructions go here</p>
        `;
        
        // Set up your game-specific UI
        this.setupGameInterface();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupGameInterface() {
        // Create your game's HTML structure
        this.gameContainer.innerHTML = `
            <div class="my-minigame-area">
                <div class="score">Score: <span id="score-display">0</span></div>
                <div class="game-area" id="game-area">
                    <!-- Your game content here -->
                </div>
                <div class="timer">Time: <span id="timer-display">30</span>s</div>
            </div>
        `;
        
        // Get references to important elements
        this.gameArea = document.getElementById('game-area');
        this.scoreDisplay = document.getElementById('score-display');
        this.timerDisplay = document.getElementById('timer-display');
    }
    
    setupEventListeners() {
        // Add your game-specific event listeners using this.addEventListener
        // This ensures proper cleanup when the mini-game ends
        
        this.addEventListener(this.gameArea, 'click', (event) => {
            this.handleGameClick(event);
        });
        
        this.addEventListener(document, 'keydown', (event) => {
            this.handleKeyPress(event);
        });
    }
    
    start() {
        // Call parent start
        super.start();
        
        // Start your game logic
        this.startTimer();
        this.initializeGameContent();
        
        console.log("My mini-game started");
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const remaining = Math.max(0, this.gameData.timeLimit - elapsed);
            const seconds = Math.ceil(remaining / 1000);
            
            this.timerDisplay.textContent = seconds;
            
            if (remaining <= 0) {
                this.timeUp();
            }
        }, 100);
    }
    
    handleGameClick(event) {
        if (!this.gameState.isActive) return;
        
        // Handle clicks in your game area
        // Update score, check win conditions, etc.
        
        this.updateScore(10);
        this.checkWinCondition();
    }
    
    handleKeyPress(event) {
        if (!this.gameState.isActive) return;
        
        // Handle keyboard input if needed
        switch(event.key) {
            case 'Space':
                event.preventDefault();
                // Handle space key
                break;
        }
    }
    
    updateScore(points) {
        this.gameData.score += points;
        this.scoreDisplay.textContent = this.gameData.score;
    }
    
    checkWinCondition() {
        // Check if the player has won
        if (this.gameData.score >= 100) {
            this.gameWon();
        }
    }
    
    gameWon() {
        this.cleanup();
        this.showSuccess("Congratulations! You won!", true, 3000);
        
        // Set game result for the callback
        this.gameResult = {
            success: true,
            score: this.gameData.score,
            timeRemaining: this.gameData.timeLimit - (Date.now() - this.startTime)
        };
    }
    
    timeUp() {
        this.cleanup();
        this.showFailure("Time's up! Try again.", true, 3000);
        
        this.gameResult = {
            success: false,
            score: this.gameData.score,
            reason: 'timeout'
        };
    }
    
    initializeGameContent() {
        // Set up your specific game content
        // This might involve creating DOM elements, starting animations, etc.
    }
    
    cleanup() {
        // Clean up timers and intervals
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Call parent cleanup (handles event listeners)
        super.cleanup();
    }
}
```

#### Step 2: Add Styles

Add CSS to `css/minigames.css`:

```css
/* My Mini-Game Specific Styles */
.my-minigame-area {
    display: flex;
    flex-direction: column;
    height: 400px;
    padding: 20px;
}

.my-minigame-area .score,
.my-minigame-area .timer {
    background: rgba(0, 255, 0, 0.1);
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
}

.my-minigame-area .game-area {
    flex: 1;
    background: #1a1a1a;
    border: 2px solid #00ff00;
    border-radius: 10px;
    margin: 10px 0;
    cursor: crosshair;
    position: relative;
    overflow: hidden;
}

/* Add any additional styles your mini-game needs */
```

#### Step 3: Register the Mini-Game

Add your mini-game to `js/minigames/index.js`:

```javascript
// Add this import
export { MyMinigame } from './my-minigame/my-minigame-game.js';

// Add this at the bottom with other registrations
import { MyMinigame } from './my-minigame/my-minigame-game.js';
MinigameFramework.registerScene('my-minigame', MyMinigame);
```

#### Step 4: Integrate with Game Objects

To trigger your mini-game from an object interaction, modify the object in your scenario JSON:

```json
{
    "type": "special_device",
    "name": "Puzzle Device",
    "takeable": false,
    "observations": "A strange device with buttons and lights.",
    "requiresMinigame": "my-minigame",
    "minigameParams": {
        "title": "Decode the Pattern",
        "difficulty": "hard",
        "timeLimit": 45000
    }
}
```

Or trigger it programmatically in the interactions system:

```javascript
// In interactions.js or a custom system
window.MinigameFramework.startMinigame('my-minigame', {
    title: 'My Custom Challenge',
    difficulty: 'medium',
    onComplete: (success, result) => {
        if (success) {
            console.log('Mini-game completed successfully!', result);
            // Unlock something, add item to inventory, etc.
        } else {
            console.log('Mini-game failed', result);
        }
    }
});
```

### 3. Mini-Game Best Practices

#### UI Guidelines
- Use the framework's built-in message system (`showSuccess`, `showFailure`)
- Maintain consistent styling with the game's retro-cyber theme
- Provide clear instructions in the header
- Use progress indicators when appropriate

#### Performance
- Clean up timers and intervals in the `cleanup()` method
- Use `this.addEventListener()` for proper event listener management
- Avoid creating too many DOM elements for complex animations

#### Integration
- Return meaningful results in `this.gameResult` for scenario progression
- Support different difficulty levels through parameters
- Provide visual feedback for player actions

#### Accessibility
- Include keyboard controls when possible
- Use clear visual indicators for interactive elements
- Provide audio feedback through the game's sound system

### 4. Advanced Mini-Game Features

#### Canvas-based Games
For more complex graphics, you can create a canvas within your mini-game:

```javascript
setupGameInterface() {
    this.gameContainer.innerHTML = `
        <canvas id="minigame-canvas" width="600" height="400"></canvas>
    `;
    
    this.canvas = document.getElementById('minigame-canvas');
    this.ctx = this.canvas.getContext('2d');
}
```

#### Animation Integration
Use requestAnimationFrame for smooth animations:

```javascript
start() {
    super.start();
    this.animate();
}

animate() {
    if (!this.gameState.isActive) return;
    
    // Update game state
    this.updateGame();
    
    // Render frame
    this.renderGame();
    
    requestAnimationFrame(() => this.animate());
}
```

#### Sound Integration
Add sound effects using the main game's audio system:

```javascript
// In your mini-game
playSound(soundName) {
    if (window.game && window.game.sound) {
        window.game.sound.play(soundName);
    }
}
```

## CSS Architecture

### File Organization
- **main.css**: Core game styles and layout
- **panels.css**: Side panel layouts and responsive design
- **modals.css**: Modal dialog styling
- **inventory.css**: Inventory system and item display
- **minigames.css**: Mini-game overlay and component styles
- **notifications.css**: In-game notification system
- **utilities.css**: Utility classes and responsive helpers

### Design System
- **Color Scheme**: Retro cyber theme with green (#00ff00) accents
- **Typography**: Monospace fonts for technical elements
- **Spacing**: Consistent padding and margin scale
- **Responsive**: Mobile-friendly with flexible layouts

## Development Workflow

### Adding New Features
1. Create feature branch
2. **Identify the right module**: Use the refactored structure
   - Interaction routing → `interactions.js`
   - Lock logic → `unlock-system.js`
   - Key mapping → `key-lock-system.js`
   - Biometrics → `biometrics.js`
   - Minigames → `minigame-starters.js`
   - Inventory → `inventory.js`
3. Implement in appropriate module
4. Add necessary styles to CSS files
5. Update scenario JSON if needed
6. Test with multiple scenarios
7. Document changes

### Code Organization Best Practices

Based on the recent refactoring, follow these principles:

1. **Keep files focused and small** (< 500 lines is ideal, < 1000 is acceptable)
2. **Single Responsibility Principle**: Each module should have one clear purpose
3. **Avoid duplication**: Create shared modules for common functionality
4. **Use proper imports/exports**: Make dependencies explicit
5. **Handle async operations**: Use `window.game` and `window.rooms` fallbacks for dynamic content
6. **Clean up resources**: Always implement proper cleanup in lifecycle methods

### Refactoring Guidelines

When a file grows too large or has mixed responsibilities:

1. **Identify distinct concerns**: Look for natural separation points
2. **Extract to new modules**: Create focused files for each concern
3. **Update imports**: Ensure all references are updated
4. **Test thoroughly**: Verify all functionality still works
5. **Document changes**: Update this README and create migration notes

### Common Patterns

**Global State Access:**
```javascript
// Use fallbacks for dynamic content
const game = gameRef || window.game;
const allRooms = window.rooms || {};
```

**Minigame Integration:**
```javascript
// Use minigame-starters.js for consistency
import { startLockpickingMinigame } from './minigame-starters.js';
startLockpickingMinigame(lockable, window.game, difficulty, callback);
```

**Lock Handling:**
```javascript
// Use centralized unlock system
import { handleUnlock } from './unlock-system.js';
handleUnlock(lockable, 'door'); // or 'item'
```

### Testing Mini-Games
1. Create test scenario with your mini-game object
2. Test success and failure paths
3. Verify cleanup and state management
4. Test on different screen sizes
5. Ensure integration with main game systems
6. Test minigame → room loading transition (timing)

### Performance Considerations
- Use efficient asset loading
- Implement proper cleanup in all systems
- Monitor memory usage with browser dev tools
- Optimize for mobile devices
- Use `setTimeout` delays for minigame → room transitions (100ms recommended)

### Debugging Tips

**Module Reference Issues:**
- If collisions fail in newly loaded rooms, check for `gameRef` vs `window.game`
- If rooms aren't found, use `window.rooms` instead of local `rooms` variable

**Lock System Issues:**
- All lock logic should be in `unlock-system.js` (single source of truth)
- Check `doorProperties` for doors, `scenarioData` for items

**Minigame Timing:**
- Use `setTimeout` callbacks to allow cleanup before room operations
- Default 100ms delay works well for most cases

## Architecture Notes

### Module Dependencies

Current clean architecture (no circular dependencies):

```
interactions.js → unlock-system.js → minigame-starters.js
doors.js → unlock-system.js → minigame-starters.js
unlock-system.js → doors.js (for unlockDoor callback only)
```

**Avoid creating new circular dependencies!** If two modules need each other, create an intermediary module.

### Global State Pattern

The game uses `window.*` for shared state:
- `window.game` - Phaser game instance
- `window.rooms` - Room data
- `window.player` - Player sprite
- `window.inventory` - Inventory system
- `window.gameState` - Game progress data

This pattern works well for a game of this size and simplifies debugging (accessible from console).

This documentation provides a comprehensive foundation for understanding and extending the BreakEscape codebase. For specific implementation questions, refer to the existing code examples in the repository. 