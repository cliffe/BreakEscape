// ─────────────────────────────────────────────────────────────────────────────
// DEBUG FLAG — flip this single constant to true to enable all debug visuals:
//   • Phaser physics collision-box overlay
//   • Player path-finding line with waypoint circles and index labels
//   • NPC hostile chase-path overlay
//   • Console pathfinding spam (window.pathfindingDebug)
// You can also toggle at runtime with the backtick key (visual) or
// Shift+backtick (console), or set window.breakEscapeDebug = true in DevTools.
// ─────────────────────────────────────────────────────────────────────────────
export const BREAK_ESCAPE_DEBUG = false;

// Game constants
export const TILE_SIZE = 32;
export const DOOR_ALIGN_OVERLAP = 32 * 3;
export const GRID_SIZE = 32;

// Grid unit system constants for room layout
// Grid units are the base stacking size for rooms
export const GRID_UNIT_WIDTH_TILES = 5;    // 5 tiles wide
export const GRID_UNIT_HEIGHT_TILES = 4;   // 4 tiles tall (stacking area)
export const VISUAL_TOP_TILES = 2;         // Top 2 rows are visual wall overlay

// Calculated grid unit sizes in pixels
export const GRID_UNIT_WIDTH_PX = GRID_UNIT_WIDTH_TILES * TILE_SIZE;    // 160px
export const GRID_UNIT_HEIGHT_PX = GRID_UNIT_HEIGHT_TILES * TILE_SIZE;  // 128px

// Pathfinding grid resolution (px per cell). Smaller than TILE_SIZE so the
// player can navigate gaps narrower than a full 32px tile.
export const PATHFINDING_STEP = 8;

export const MOVEMENT_SPEED = 150;
export const RUN_SPEED_MULTIPLIER = 1.5; // Speed multiplier when holding shift
export const RUN_ANIMATION_MULTIPLIER = 1.5; // Animation speed multiplier when holding shift
export const ARRIVAL_THRESHOLD = 8;
export const PATH_UPDATE_INTERVAL = 500;
export const STUCK_THRESHOLD = 1;
export const STUCK_TIME = 500;
export const INVENTORY_X_OFFSET = 50;
export const INVENTORY_Y_OFFSET = 50;
export const CLICK_INDICATOR_DURATION = 800; // milliseconds
export const CLICK_INDICATOR_SIZE = 20; // pixels
export const PLAYER_FEET_OFFSET_Y = 30; // Adjust based on your sprite's feet position (64px sprite)

// Sprite dimensions and padding
export const SPRITE_SIZE_ATLAS = 80; // Atlas sprites (PixelLab) are 80x80px
export const SPRITE_SIZE_LEGACY = 64; // Legacy sprites are 64x64px
export const SPRITE_PADDING_BOTTOM_ATLAS = 6; // Atlas sprites have 16px padding at bottom
export const SPRITE_PADDING_BOTTOM_LEGACY = 4; // Legacy sprites have minimal bottom padding

// Room visibility settings
export const HIDE_ROOMS_INITIALLY = true;
export const HIDE_ROOMS_ON_EXIT = false;
export const HIDE_NON_ADJACENT_ROOMS = false;

// Interaction constants
export const INTERACTION_CHECK_INTERVAL = 100; // Only check interactions every 100ms
export const INTERACTION_RANGE = 1 * TILE_SIZE; // Half of previous range (32px)
export const INTERACTION_RANGE_SQ = INTERACTION_RANGE * INTERACTION_RANGE;
export const DOOR_INTERACTION_RANGE = 2 * TILE_SIZE; // 64px — range at which players can interact with doors
export const DOOR_INTERACTION_RANGE_SQ = DOOR_INTERACTION_RANGE * DOOR_INTERACTION_RANGE;
export const ROOM_CHECK_THRESHOLD = 32; // Only check for room changes when player moves this many pixels

// Bluetooth constants
export const BLUETOOTH_SCAN_RANGE = TILE_SIZE * 2; // 2 tiles range for Bluetooth scanning
export const BLUETOOTH_SCAN_INTERVAL = 200; // Scan every 200ms for more responsive updates

// Game configuration (only available when Phaser is loaded)
export const GAME_CONFIG = typeof Phaser !== 'undefined' ? {
    type: Phaser.AUTO,
    width: 640,  // Classic pixel art base resolution (scales cleanly: 1x=320, 2x=640, 3x=960, 4x=1280)
    height: 480, // Classic pixel art base resolution (scales cleanly: 1x=240, 2x=480, 3x=720, 4x=960)
    parent: 'game-container',
    pixelArt: true,
    loader: {
        baseURL: (window.breakEscapeConfig?.assetsPath || '/break_escape/assets') + '/'
    },
    scale: {
        mode: Phaser.Scale.ENVELOP,  // Fill entire container while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 480,
        // Minimum size to ensure playability
        min: {
            width: 320,
            height: 240
        },
        // Maximum size to prevent excessive scaling
        max: {
            width: 2560,
            height: 1920
        },
    },
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: BREAK_ESCAPE_DEBUG // Toggle via BREAK_ESCAPE_DEBUG constant above
        }
    }
} : null; 