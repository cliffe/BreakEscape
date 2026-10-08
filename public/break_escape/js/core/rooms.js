/**
 * ROOM MANAGEMENT SYSTEM - SIMPLIFIED DEPTH LAYERING APPROACH
 * ===========================================================
 * 
 * This system implements a simplified depth-based layering approach where all elements
 * use their world Y position + layer offset for depth calculation.
 * 
 * DEPTH CALCULATION PHILOSOPHY:
 * -----------------------------
 * 1. **World Y Position**: All depth calculations are based on the world Y position
 *    of the element (bottom of sprites, room ground level).
 * 
 * 2. **Layer Offsets**: Each element type has a fixed layer offset added to its Y position
 *    to create proper layering hierarchy.
 * 
 * 3. **Room Y Offset**: Room Y position is considered to be 2 tiles south of the actual
 *    room position (where door sprites are positioned).
 * 
 * DEPTH HIERARCHY:
 * ----------------
 * Room Layers (world Y + layer offset):
 * - Floor:     roomWorldY + 0.1
 * - Collision: roomWorldY + 0.15  
 * - Walls:     roomWorldY + 0.2
 * - Props:     roomWorldY + 0.3
 * - Other:     roomWorldY + 0.4
 * 
 * Interactive Elements (world Y + layer offset):
 * - Doors:     doorY + 0.45 (between room tiles and sprites)
 * - Door Tops: doorY + 0.55 (above doors, below sprites)
 * - Animated Doors: doorBottomY + 0.45 (bottom Y + door layer offset)
 * - Animated Door Tops: doorBottomY + 0.55 (bottom Y + door top layer offset)
 * - Player:    playerBottomY + 0.5 (dynamic based on Y position)
 * - Objects:   objectBottomY + 0.5 (dynamic based on Y position)
 * 
 * OPTIONAL ELEVATION OVERRIDE FOR PRECISE LAYERING:
 * ----------------------------------------------------
 * Objects can specify an explicit elevation value in their position to override automatic calculation.
 * Depth is always: objectBottomY + 0.5 + elevation. Auto-elevation is non-zero only for back-wall
 * items (top 2 tiles of room). Use position.elevation to force items to render in front of furniture.
 * 
 * Example: 
 * ```json
 * {
 *   "type": "notes",
 *   "name": "Document on Desk",
 *   "position": { "x": 3, "y": 2, "elevation": 32 }
 * }
 * ```
 * 
 * DEPTH CALCULATION CONSISTENCY:
 * ------------------------------
 * ✅ All elements use world Y position + layer offset
 * ✅ Room Y is 2 tiles south of room position
 * ✅ Player and objects use bottom Y position
 * ✅ Simple and consistent across all elements
 */

// Room management system
import {
    TILE_SIZE,
    DOOR_ALIGN_OVERLAP,
    GRID_SIZE,
    INTERACTION_RANGE_SQ,
    INTERACTION_CHECK_INTERVAL,
    GRID_UNIT_WIDTH_TILES,
    GRID_UNIT_HEIGHT_TILES,
    VISUAL_TOP_TILES,
    GRID_UNIT_WIDTH_PX,
    GRID_UNIT_HEIGHT_PX
} from '../utils/constants.js';

// Import the new system modules
import { initializeDoors, createDoorSpritesForRoom, updateDoorSpritesVisibility } from '../systems/doors.js';
import { initializeObjectPhysics, setupChairCollisions, setupExistingChairsWithNewRoom, calculateChairSpinDirection, updateSwivelChairRotation, updateSpriteDepth } from '../systems/object-physics.js';
import { initializePlayerEffects, createPlayerBumpEffect, createPlantBumpEffect } from '../systems/player-effects.js';
import { initializeCollision, createWallCollisionBoxes, removeTilesUnderDoor, removeWallTilesForDoorInRoom, removeWallTilesAtWorldPosition } from '../systems/collision.js';
import { NPCPathfindingManager } from '../systems/npc-pathfinding.js';
import NPCSpriteManager from '../systems/npc-sprites.js';
import { resolveObjectField } from '../utils/conditional-text.js';

// Default hover text for decor: "drug_trolley1" -> "A drug trolley."
function describeDecor(name) {
    const words = String(name).replace(/\d+$/, '').replace(/[_-]+/g, ' ').trim();
    return `${/^[aeiou]/i.test(words) ? 'An' : 'A'} ${words}.`;
}

export let rooms = {};
export let currentRoom = '';
export let currentPlayerRoom = '';
// Track which rooms have been DISCOVERED by the player
// NOTE: "Discovered" means the player has ENTERED the room via door transition.
// This is separate from "revealed" (graphics visible). Rooms can be revealed
// (loaded for graphics/performance) without being discovered (player hasn't entered yet).
// This distinction is important for NPC event triggers like "room_discovered".
export let discoveredRooms = new Set();

// Pathfinding manager for NPC patrol routes
export let pathfindingManager = null;

// Helper function to check if a position overlaps with existing items
function isPositionOverlapping(x, y, roomId, itemSize = TILE_SIZE) {
    const room = rooms[roomId];
    if (!room || !room.objects) return false;
    
    // Check against all existing objects in the room
    for (const obj of Object.values(room.objects)) {
        if (!obj || !obj.active) continue;
        
        // Calculate overlap with some padding
        const padding = TILE_SIZE * 0.5; // Half tile padding
        const objLeft = obj.x - padding;
        const objRight = obj.x + obj.width + padding;
        const objTop = obj.y - padding;
        const objBottom = obj.y + obj.height + padding;
        
        const newLeft = x;
        const newRight = x + itemSize;
        const newTop = y;
        const newBottom = y + itemSize;
        
        // Check for overlap
        if (newLeft < objRight && newRight > objLeft && 
            newTop < objBottom && newBottom > objTop) {
            return true; // Overlap detected
        }
    }
    
    return false; // No overlap
}

// Make discoveredRooms available globally
window.discoveredRooms = discoveredRooms;
let gameRef = null;

// Room data cache - stores room data returned from unlock API to avoid duplicate fetches
const roomDataCache = new Map();
window.roomDataCache = roomDataCache; // Make available for unlock system

// ===== ITEM POOL MANAGEMENT (PHASE 2 IMPROVEMENTS) =====
// Moved to module level to avoid temporal dead zone errors
// and improve performance (defined once, not on every room load)

/**
 * Manages the collection of available Tiled items organized by type
 * Provides unified interface for finding, reserving, and tracking items
 * 
 * This class centralizes item pool logic to improve maintainability
 * while preserving all existing matching behavior
 */
class TiledItemPool {
    constructor(objectsByLayer, map) {
        this.itemsByType = {};              // Regular items (non-table) indexed by type
        this.tableItemsByType = {};         // Regular table items indexed by type
        this.conditionalItemsByType = {};   // Conditional items indexed by type
        this.conditionalTableItemsByType = {}; // Conditional table items indexed by type
        this.reserved = new Set();          // Track reserved items to prevent reuse
        this.map = map;                     // Store map for tileset lookups
        
        this.populateFromLayers(objectsByLayer);
    }
    
    /**
     * Get image name from Tiled object by looking up its GID in tilesets
     */
    getImageNameFromObject(obj) {
        return getImageNameFromObjectWithMap(obj, this.map);
    }
    
    /**
     * Extract base type from image name (e.g., "phone1" -> "phone")
     */
    extractBaseTypeFromImageName(imageName) {
        if (!imageName) {
            return 'unknown';
        }
        
        // Remove numbers and common suffixes to get base type
        let baseType = imageName.replace(/\d+$/, ''); // Remove trailing numbers
        baseType = baseType.replace(/\.png$/, ''); // Remove .png extension
        
        // Handle special cases where scenario uses plural but items use singular
        if (baseType === 'note') {
            const number = imageName.match(/\d+/);
            if (number) {
                baseType = 'notes' + number[0];
            } else {
                baseType = 'notes';
            }
        }
        
        return baseType;
    }
    
    /**
     * Populate pool from Tiled object layers
     * Indexes items by their base type for efficient lookup
     * 
     * Priority order for matching:
     * 1. Regular items (non-table)
     * 2. Regular table items
     * 3. Conditional items (non-table)
     * 4. Conditional table items
     */
    populateFromLayers(objectsByLayer) {
        this.itemsByType = this.indexByType(objectsByLayer.items || []);
        this.tableItemsByType = this.indexByType(objectsByLayer.table_items || []);
        this.conditionalItemsByType = this.indexByType(objectsByLayer.conditional_items || []);
        this.conditionalTableItemsByType = this.indexByType(objectsByLayer.conditional_table_items || []);
    }
    
    /**
     * Index an array of items by their base type
     * Returns object with baseType as keys and arrays of items as values
     */
    indexByType(items) {
        const indexed = {};
        items.forEach(item => {
            const imageName = this.getImageNameFromObject(item);
            if (imageName && imageName !== 'unknown') {
                const baseType = this.extractBaseTypeFromImageName(imageName);
                if (!indexed[baseType]) {
                    indexed[baseType] = [];
                }
                indexed[baseType].push(item);
            }
        });
        return indexed;
    }
    
    /**
     * Find best matching item for a scenario object
     * Searches in strict priority order:
     * 1. Regular items (items layer)
     * 2. Regular table items (table_items layer)
     * 3. Conditional items (conditional_items layer)
     * 4. Conditional table items (conditional_table_items layer)
     * 
     * This ensures unconditional items are ALWAYS used before conditional items.
     * For multiple requests of the same type, exhausts each layer before moving to next.
     * 
     * Skips reserved items to prevent reuse.
     * Returns the matched item or null if no match found
     * 
     * @param {Object} scenarioObj - The scenario object to match
     * @param {string} [overrideType] - Optional type to search for instead of scenarioObj.type
     */
    findMatchFor(scenarioObj, overrideType = null) {
        const searchType = overrideType || scenarioObj.type;
        
        // Search priority: unconditional layers first, then conditional layers
        const searchOrder = [
            this.itemsByType,              // Regular items
            this.tableItemsByType,         // Regular table items (NEW - CRITICAL FIX)
            this.conditionalItemsByType,   // Conditional items
            this.conditionalTableItemsByType // Conditional table items
        ];
        
        for (const indexedItems of searchOrder) {
            const candidates = indexedItems[searchType] || [];
            
            // Find first unreserved item of matching type
            for (const item of candidates) {
                if (!this.isReserved(item)) {
                    return item;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Reserve an item to prevent it from being used again
     * Creates unique identifier from GID and coordinates
     */
    reserve(tiledItem) {
        const itemId = this.getItemId(tiledItem);
        this.reserved.add(itemId);
    }
    
    /**
     * Check if an item has been reserved
     */
    isReserved(tiledItem) {
        const itemId = this.getItemId(tiledItem);
        return this.reserved.has(itemId);
    }
    
    /**
     * Get all unreserved items across all regular (unconditional) layers
     * Used to process background decoration items that weren't used by scenario
     * 
     * NOTE: Returns BOTH regular items AND regular table items, but NOT conditional items.
     * Conditional items should ONLY be created when explicitly requested by scenario.
     * This ensures conditional items stay hidden until the scenario needs them.
     */
    getUnreservedItems() {
        const unreserved = [];
        
        const collectUnreserved = (indexed) => {
            Object.values(indexed).forEach(items => {
                items.forEach(item => {
                    if (!this.isReserved(item)) {
                        unreserved.push(item);
                    }
                });
            });
        };
        
        // Process both regular items and regular table items
        // Exclude conditional items - they should only appear when scenario explicitly requests them
        collectUnreserved(this.itemsByType);
        collectUnreserved(this.tableItemsByType);
        
        return unreserved;
    }
    
    /**
     * Get a unique identifier for an item based on GID and position
     * @private
     */
    getItemId(tiledItem) {
        return `gid_${tiledItem.gid}_x${tiledItem.x}_y${tiledItem.y}`;
    }
}

/**
 * Helper: Apply visual/transform properties from Tiled item to sprite
 * Handles rotation, flipping, and other Tiled-specific properties
 */
function applyTiledProperties(sprite, tiledItem) {
    sprite.setOrigin(0, 0);
    
    // Apply rotation if present
    if (tiledItem.rotation) {
        sprite.setRotation(Phaser.Math.DegToRad(tiledItem.rotation));
    }
    
    // Apply flipping if present
    if (tiledItem.flipX) {
        sprite.setFlipX(true);
    }
    if (tiledItem.flipY) {
        sprite.setFlipY(true);
    }
}

/**
 * Helper: Apply game logic properties from scenario to sprite
 * Stores scenario data and makes sprite interactive
 * 
 * IMPORTANT - KeyPins Normalization:
 * ===================================
 * KeyPins are already normalized by normalizeScenarioKeyPins() in game.js during scenario load.
 * This happens BEFORE any sprites are created, converting 0-100 scale to 25-65 pixel range.
 * 
 * Do NOT normalize keyPins here - it would cause double normalization:
 * - Original: [100, 0, 100, 0]
 * - After 1st normalization (game.js): [65, 25, 65, 25] ✓
 * - After 2nd normalization (here): [51, 35, 51, 35] ✗ WRONG!
 * 
 * The sprite simply receives the already-normalized values from scenarioObj.
 */
function applyScenarioProperties(sprite, scenarioObj, roomId, index) {
    
    sprite.scenarioData = scenarioObj;
    sprite.interactable = true; // Mark scenario items as interactable
    sprite.name = scenarioObj.name;
    sprite.roomId = roomId; // Store the originating room so removal is always sent to the right room
    // Prefer the item's own id (set for server-synced dropped items) so that
    // removeItemFromRoom sends the correct id when the player picks it up.
    sprite.objectId = scenarioObj.id || `${roomId}_${scenarioObj.type}_${index}`;
    sprite.setInteractive({ useHandCursor: true });
    
    // Store all scenario properties for interaction system
    // IMPORTANT: Skip Phaser-internal / placement-reserved properties:
    //   'texture' – Phaser TextureFrame object; overwriting breaks sprite.texture.key.
    //   'x' / 'y' – Phaser world position; scenario coordinates are applied separately
    //               by the room-placement logic (room-relative or table-relative),
    //               so copying them here would overwrite the correctly computed position.
    //               The original values remain accessible via sprite.scenarioData.x/y.
    Object.keys(scenarioObj).forEach(key => {
        if (key === 'texture' || key === 'x' || key === 'y') return;
        sprite[key] = scenarioObj[key];
    });
    
    // Ensure phones are always interactable (override scenario data if needed)
    if (scenarioObj.type === 'phone') {
        sprite.interactable = true;
    }
    
    // Log applied data for debugging
    console.log(`Applied scenario data to ${scenarioObj.type}:`, {
        name: scenarioObj.name,
        type: scenarioObj.type,
        takeable: scenarioObj.takeable,
        readable: scenarioObj.readable,
        text: scenarioObj.text,
        observations: scenarioObj.observations,
        keyPins: scenarioObj.keyPins,  // Include keyPins in log
        locked: scenarioObj.locked,
        lockType: scenarioObj.lockType
    });
    
    // Verify keyPins are stored on the sprite
    if (scenarioObj.keyPins) {
        console.log(`✓ keyPins stored on ${roomId}_${scenarioObj.type}: [${sprite.keyPins.join(', ')}]`);
    }
}

/**
 * Helper: Calculate and set depth for sprite based on room position
 * Handles elevation for back-wall items and table items
 */
function setDepthAndStore(sprite, position, roomId, isTableItem = false, scenarioObj = null) {
    // Skip depth calculation for table items - already set in table grouping
    if (!isTableItem) {
        const objectBottomY = sprite.y + sprite.height;
        
        // Use explicit elevation from position object if provided, otherwise auto-calculate
        let elevation;
        if (scenarioObj?.position?.elevation !== undefined) {
            // Explicit elevation override (e.g., items placed on top of tables or furniture)
            elevation = scenarioObj.position.elevation;
        } else {
            // Auto-calculate elevation for items on the back wall (top 2 tiles of room)
            const roomTopY = position.y;
            const backWallThreshold = roomTopY + (2 * TILE_SIZE);
            const itemBottomY = objectBottomY;
            elevation = itemBottomY < backWallThreshold ? (backWallThreshold - itemBottomY) : 0;
        }
        
        // Every back-wall item lands on the same depth (bottom + elevation = threshold),
        // so break the tie by feet position: a sheet pinned over a board's lower edge
        // draws on top of it. At most 0.064, well under the 1px step between floor rows.
        const wallTieBreak = elevation > 0 ? (objectBottomY - position.y) * 0.001 : 0;
        const objectDepth = objectBottomY + 0.5 + elevation + wallTieBreak;
        sprite.setDepth(objectDepth);
        sprite.elevation = elevation;
    }
    
    // Initially hide the object
    sprite.setVisible(false);
    
    // Store the object
    rooms[roomId].objects[sprite.objectId] = sprite;
}

/**
 * Module-level helper: Get image name from Tiled object
 * Used by both TiledItemPool and other helper functions
 * Note: This function needs to be called with map in context where it's available
 */
function getImageNameFromObjectWithMap(obj, map) {
    if (!map || !map.tilesets) {
        return null;
    }
    
    // Find the tileset that contains this GID
    let tileset = null;
    let localTileId = 0;
    let bestMatch = null;
    let bestMatchIndex = -1;
    
    for (let i = 0; i < map.tilesets.length; i++) {
        const ts = map.tilesets[i];
        const maxGid = ts.tilecount ? ts.firstgid + ts.tilecount : ts.firstgid + 1;
        if (obj.gid >= ts.firstgid && obj.gid < maxGid) {
            // Prefer objects tilesets, and among those, prefer the most recent (highest index)
            if (ts.name === 'objects' || ts.name.includes('objects/') || ts.name.includes('tables/')) {
                if (bestMatchIndex < i) {
                    bestMatch = ts;
                    bestMatchIndex = i;
                    tileset = ts;
                    localTileId = obj.gid - ts.firstgid;
                }
            } else if (!bestMatch) {
                // Fallback to any matching tileset if no objects tileset found
                tileset = ts;
                localTileId = obj.gid - ts.firstgid;
            }
        }
    }
    
    if (tileset && (tileset.name === 'objects' || tileset.name.includes('objects/') || tileset.name.includes('tables/'))) {
        let imageName = null;
        
        if (tileset.images && tileset.images[localTileId]) {
            const imageData = tileset.images[localTileId];
            if (imageData && imageData.name) {
                imageName = imageData.name;
            }
        } else if (tileset.tileData && tileset.tileData[localTileId]) {
            const tileData = tileset.tileData[localTileId];
            if (tileData && tileData.image) {
                const imagePath = tileData.image;
                imageName = imagePath.split('/').pop().replace('.png', '');
            }
        } else if (tileset.name.includes('objects/') || tileset.name.includes('tables/')) {
            imageName = tileset.name.split('/').pop().replace('.png', '');
        }
        
        return imageName;
    }
    
    return null;
}

/**
 * Helper: Create sprite from a matched Tiled item and scenario object
 * Combines visual data (position, image) with game logic (properties)
 */
function createSpriteFromMatch(tiledItem, scenarioObj, position, roomId, index, map) {
    // Use the map-aware version of getImageNameFromObject
    const imageName = getImageNameFromObjectWithMap(tiledItem, map);
    // Scenario may override the texture with an explicit sprite key (e.g. "vm-launcher-kali").
    // Position still comes from the Tiled item; only the visual is swapped.
    // spriteVariants can further override the texture based on current global variable state.
    const baseKey = scenarioObj.sprite || imageName;
    const resolvedKey = resolveObjectField(scenarioObj, 'sprite', baseKey);

    // Always create with the base key (guaranteed loaded via Tiled preload).
    // If a spriteVariant resolves to a different key at load time, swap it on-demand below.
    const sprite = gameRef.add.sprite(
        Math.round(position.x + tiledItem.x),
        Math.round(position.y + tiledItem.y - tiledItem.height),
        baseKey
    );

    // Apply Tiled visual properties (rotation, flipping, etc.)
    applyTiledProperties(sprite, tiledItem);

    // Apply scenario properties (name, type, interactive data)
    applyScenarioProperties(sprite, scenarioObj, roomId, index);

    // Apply the resolved variant texture at load time if it differs from base
    if (resolvedKey !== baseKey) {
        if (!gameRef.textures.exists(resolvedKey)) {
            gameRef.load.image(resolvedKey, `objects/${resolvedKey}.png`);
            gameRef.load.once('complete', () => sprite.setTexture(resolvedKey));
            gameRef.load.start();
        } else {
            sprite.setTexture(resolvedKey);
        }
    }

    return sprite;
}

/**
 * Helper: Create sprite at random position when no matching Tiled item found
 * Ensures position doesn't overlap with existing items
 * Items are placed within room GU boundaries with proper padding:
 * - 1 tile (32px) from left and right sides
 * - 2 tiles (64px) from top
 * - 2 tiles (64px) + 16px from bottom, plus sprite height to prevent overlap with southern room walls
 */
function createSpriteAtRandomPosition(scenarioObj, position, roomId, index, map) {
    // Get actual room dimensions from the tilemap
    let roomWidth = 10 * TILE_SIZE;   // fallback
    let roomHeight = 10 * TILE_SIZE;  // fallback

    if (map) {
        let width, height;
        if (map.json) {
            width = map.json.width;
            height = map.json.height;
        } else if (map.data) {
            width = map.data.width;
            height = map.data.height;
        } else {
            width = map.width;
            height = map.height;
        }

        if (width && height) {
            roomWidth = width * TILE_SIZE;
            roomHeight = height * TILE_SIZE;
        }
    }

    // Get sprite texture dimensions to calculate proper placement
    let spriteHeight = TILE_SIZE;  // fallback to 1 tile if texture not found
    const baseKey = scenarioObj.sprite || scenarioObj.type;
    const resolvedKey = resolveObjectField(scenarioObj, 'sprite', baseKey);
    // Use resolved key for dimension lookup when it's already loaded, otherwise fall back to base
    const textureKey = gameRef?.textures?.exists(resolvedKey) ? resolvedKey : baseKey;

    if (gameRef && gameRef.textures && gameRef.textures.exists(textureKey)) {
        const texture = gameRef.textures.get(textureKey);
        if (texture) {
            // Try to get frame dimensions - Phaser 3 textures have frames
            if (texture.frames && Object.keys(texture.frames).length > 0) {
                // Get the first frame (usually '__BASE' or the texture key)
                const frameName = texture.frameNames ? texture.frameNames[0] : Object.keys(texture.frames)[0];
                const frame = texture.frames[frameName];
                if (frame && frame.height) {
                    spriteHeight = frame.height;
                }
            }
            // Fallback: try to get from source directly
            if (spriteHeight === TILE_SIZE && texture.source && texture.source.length > 0) {
                if (texture.source[0].height) {
                    spriteHeight = texture.source[0].height;
                }
            }
        }
    }
    
    // Final fallback: create temporary sprite (not added to scene) to get actual dimensions
    if (spriteHeight === TILE_SIZE && gameRef && gameRef.make) {
        try {
            const tempSprite = gameRef.make.sprite({ key: textureKey, add: false });
            if (tempSprite && tempSprite.height) {
                spriteHeight = tempSprite.height;
            }
        } catch (e) {
            // If sprite creation fails, use fallback
            console.warn(`Could not determine sprite height for ${textureKey}, using fallback ${TILE_SIZE}px`);
        }
    }

    // Apply proper padding based on requirements:
    // - 1 tile (32px) from left and right sides
    // - 2 tiles (64px) from top
    // - 2 tiles (64px) + 16px from bottom, plus sprite height to ensure bottom edge doesn't extend too far
    const paddingX = TILE_SIZE * 1;  // 32px from sides
    const paddingYTop = TILE_SIZE * 2;  // 64px from top
    const paddingYBottom = TILE_SIZE * 2 + 16;  // 64px + 16px from bottom
    
    // Calculate maximum Y position: room bottom - bottom padding - sprite height
    // This ensures the sprite's bottom edge is at least paddingYBottom from the room bottom
    const roomBottom = position.y + roomHeight;
    const maxY = roomBottom - paddingYBottom - spriteHeight;
    const minY = position.y + paddingYTop;
    const availableHeight = maxY - minY;

    // Find a valid position that doesn't overlap with existing items
    let randomX, randomY;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        randomX = position.x + paddingX + Math.random() * (roomWidth - paddingX * 2);
        // Only place within the valid Y range that accounts for sprite height
        randomY = minY + (availableHeight > 0 ? Math.random() * availableHeight : 0);
        attempts++;
    } while (attempts < maxAttempts && isPositionOverlapping(randomX, randomY, roomId, TILE_SIZE));

    // Always create with base key (guaranteed loaded); apply resolved variant on-demand below
    const sprite = gameRef.add.sprite(Math.round(randomX), Math.round(randomY), baseKey);

    console.log(`Created ${scenarioObj.type} at random position (sprite height: ${spriteHeight}px) - no matching item found (attempts: ${attempts})`);

    // Apply properties
    sprite.setOrigin(0, 0);
    applyScenarioProperties(sprite, scenarioObj, roomId, index);

    // Apply the resolved variant texture at load time if it differs from base
    if (resolvedKey !== baseKey) {
        if (!gameRef.textures.exists(resolvedKey)) {
            gameRef.load.image(resolvedKey, `objects/${resolvedKey}.png`);
            gameRef.load.once('complete', () => sprite.setTexture(resolvedKey));
            gameRef.load.start();
        } else {
            sprite.setTexture(resolvedKey);
        }
    }

    return sprite;
}

/**
 * Register global_variable_changed listeners to live-update a sprite's texture
 * when its spriteVariants conditions change. Called after sprite is stored in rooms[].
 */
function registerSpriteVariantListeners(sprite, scenarioObj, roomId) {
    if (!Array.isArray(scenarioObj.spriteVariants) || scenarioObj.spriteVariants.length === 0) return;

    // Extract all globalVar names referenced across all condition strings
    const watchedVars = new Set();
    for (const variant of scenarioObj.spriteVariants) {
        if (variant.condition) {
            for (const m of variant.condition.matchAll(/globalVars\.(\w+)/g)) {
                watchedVars.add(m[1]);
            }
        }
    }

    const baseKey = scenarioObj.sprite || scenarioObj.type;
    const objectId = sprite.objectId;

    console.log('[spriteVariant] registering listener for', objectId, [...watchedVars]);
    console.log('[spriteVariant] rooms entry at registration:', rooms[roomId]?.objects[objectId]);

    for (const varName of watchedVars) {
        window.eventDispatcher?.on(`global_variable_changed:${varName}`, () => {
            const obj = rooms[roomId]?.objects[objectId];
            const newKey = resolveObjectField(scenarioObj, 'sprite', baseKey);
            console.log('[spriteVariant] event fired for', objectId, 'new texture:', newKey);
            if (!obj || obj.texture?.key === newKey) return;
            if (!gameRef.textures.exists(newKey)) {
                gameRef.load.image(newKey, `objects/${newKey}.png`);
                gameRef.load.once('complete', () => obj.setTexture(newKey));
                gameRef.load.start();
            } else {
                obj.setTexture(newKey);
            }
        });
    }
}

// ===== END: ITEM POOL MANAGEMENT (PHASE 2 IMPROVEMENTS) =====

// Static tileset props that become 8-direction swivel props at runtime.
// base: rotation texture prefix (frames <base>1..8, ordered S, SW, W, NW, N, NE, E, SE).
// frameNumber: starting frame that matches the static image's facing.
// offsetX/offsetY: shift applied after the texture swap so the starting frame
// lands on the static image's pixels.
// body (optional): collision box {w, h, x, y} in rotation-frame pixels, used in place
// of the generic chair box (bottom third, 5px inset) when that box doesn't fit the prop.
const STATIC_SWIVEL_PROPS = {
    crash_cart1: { base: 'crash-cart-rotate', frameNumber: 1 },
    wheelchair1: { base: 'wheelchair-rotate', frameNumber: 2, offsetX: -11, offsetY: -8 },
    linen_cart1: { base: 'linen-cart-rotate', frameNumber: 1, offsetX: 2, offsetY: -2 },
    // corridor IV stand (the ward's bedside infusion_pump sprites stay static)
    iv_stand1: { base: 'iv-stand-rotate', frameNumber: 1, offsetX: 0, offsetY: -2,
        body: { w: 20, h: 10, x: 3, y: 52 } },
    // frames are 64x63; a bed-sized box round its middle that suits every facing
    bed_empty: { base: 'bed-empty-rotate', frameNumber: 1, offsetX: -13, offsetY: 0,
        body: { w: 40, h: 28, x: 12, y: 26 } },
    // ward drug trolley: 34x47 sprite, frames 48x48 with the south view bottom-centred
    drug_trolley1: { base: 'drug-trolley-rotate', frameNumber: 1, offsetX: -7, offsetY: -1,
        body: { w: 30, h: 12, x: 9, y: 35 } },
};

// Define scale factors for different object types
const OBJECT_SCALES = {
    'notes': 0.75,
    'key': 0.75,
    'phone': 1,
    'tablet': 0.75,
    'bluetooth_scanner': 0.7
};

// Function to load a room lazily via API endpoint
async function loadRoom(roomId) {
    const position = window.roomPositions[roomId];

    if (!position) {
        console.error(`Cannot load room ${roomId}: missing position`);
        return;
    }

    // Check if room is already loaded - prevent reloading
    if (window.rooms && window.rooms[roomId]) {
        console.log(`Room ${roomId} is already loaded, skipping reload`);
        return;
    }

    let roomData;

    // Check if roomData is cached (from unlock API response)
    if (roomDataCache.has(roomId)) {
        console.log(`✅ Using cached room data for ${roomId} (from unlock response)`);
        roomData = roomDataCache.get(roomId);
        roomDataCache.delete(roomId); // Clear from cache after use
    } else {
        console.log(`Lazy loading room from API: ${roomId}`);

        try {
            // Fetch room data from server endpoint
            const gameId = window.breakEscapeConfig?.gameId;
            if (!gameId) {
                console.error('Game ID not available in breakEscapeConfig');
                return;
            }

            const response = await fetch(`/break_escape/games/${gameId}/room/${roomId}`);

            if (!response.ok) {
                console.error(`Failed to load room ${roomId}: ${response.status} ${response.statusText}`);
                return;
            }

            const data = await response.json();
            roomData = data.room;

            if (!roomData) {
                console.error(`No room data returned for ${roomId}`);
                return;
            }

            console.log(`✅ Received room data from API for ${roomId}`);
        } catch (error) {
            console.error(`Error loading room ${roomId}:`, error);
            return;
        }
    }

    // Load NPCs BEFORE creating room visuals
    // This ensures NPCs are registered before room objects/sprites are created
    if (window.npcLazyLoader && roomData) {
        try {
            await window.npcLazyLoader.loadNPCsForRoom(roomId, roomData);
        } catch (error) {
            console.error(`Failed to load NPCs for room ${roomId}:`, error);
            // Continue with room creation even if NPC loading fails
        }
    }

    createRoom(roomId, roomData, position);

    // Reveal (make visible) but do NOT mark as discovered
    // The room will only be marked as "discovered" when the player
    // actually enters it via door transition
    revealRoom(roomId);
}

export function initializeRooms(gameInstance) {
    gameRef = gameInstance;
    console.log('Initializing rooms');
    rooms = {};
    window.rooms = rooms; // Ensure window.rooms references the same object
    currentRoom = '';
    currentPlayerRoom = '';
    window.currentPlayerRoom = '';
    
    // Clear discovered rooms on scenario load
    // This ensures "first visit" detection works correctly for NPC events
    discoveredRooms = new Set();
    // Update global reference
    window.discoveredRooms = discoveredRooms;
    
    // Calculate room positions for lazy loading
    window.roomPositions = calculateRoomPositions(gameInstance);
    console.log('Room positions calculated for lazy loading');
    
    // Initialize the new system modules
    initializeDoors(gameInstance, rooms);
    initializeObjectPhysics(gameInstance, rooms);
    initializePlayerEffects(gameInstance, rooms);
    initializeCollision(gameInstance, rooms);
    
    // Initialize pathfinding manager for NPC patrol routes
    pathfindingManager = new NPCPathfindingManager(gameInstance);
    window.pathfindingManager = pathfindingManager;
}

// Door validation is now handled by the sprite-based door system
export function validateDoorsByRoomOverlap() {
    console.log('Door validation is now handled by the sprite-based door system');
}

// Calculate world bounds
export function calculateWorldBounds(gameInstance) {
    console.log('Calculating world bounds');
    const gameScenario = window.gameScenario;
    if (!gameScenario || !gameScenario.rooms) {
        console.error('Game scenario not loaded properly');
        return {
            x: -1800,
            y: -1800,
            width: 3600,
            height: 3600
        };
    }

    let minX = -1800, minY = -1800, maxX = 1800, maxY = 1800;
    
    // Check all room positions to determine world bounds
    const roomPositions = calculateRoomPositions(gameInstance);
    Object.entries(gameScenario.rooms).forEach(([roomId, room]) => {
        const position = roomPositions[roomId];
        if (position) {
            // Get actual room dimensions
            const map = gameInstance.cache.tilemap.get(room.type);
            let roomWidth = 800, roomHeight = 600; // fallback
            
            if (map) {
                let width, height;
                if (map.json) {
                    width = map.json.width;
                    height = map.json.height;
                } else if (map.data) {
                    width = map.data.width;
                    height = map.data.height;
                } else {
                    width = map.width;
                    height = map.height;
                }
                
                if (width && height) {
                    roomWidth = width * TILE_SIZE;   // tile width is TILE_SIZE
                    roomHeight = height * TILE_SIZE; // tile height is TILE_SIZE
                }
            }
            
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x + roomWidth);
            maxY = Math.max(maxY, position.y + roomHeight);
        }
    });

    // Add some padding
    const padding = 200;
    return {
        x: minX - padding,
        y: minY - padding,
        width: (maxX - minX) + (padding * 2),
        height: (maxY - minY) + (padding * 2)
    };
}

// ============================================================================
// GRID UNIT CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert tile dimensions to grid units
 *
 * Grid units are the base stacking size: 5 tiles wide × 4 tiles tall
 * (excluding top 2 visual wall tiles)
 *
 * @param {number} widthTiles - Room width in tiles
 * @param {number} heightTiles - Room height in tiles (including visual wall)
 * @returns {{gridWidth: number, gridHeight: number}}
 */
function tilesToGridUnits(widthTiles, heightTiles) {
    const gridWidth = Math.floor(widthTiles / GRID_UNIT_WIDTH_TILES);

    // Subtract visual top wall tiles before calculating grid height
    const stackingHeightTiles = heightTiles - VISUAL_TOP_TILES;
    const gridHeight = Math.floor(stackingHeightTiles / GRID_UNIT_HEIGHT_TILES);

    return { gridWidth, gridHeight };
}

/**
 * Convert grid coordinates to world position
 *
 * Grid coordinates are positions in grid unit space.
 * This converts them to pixel world coordinates.
 *
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {{x: number, y: number}}
 */
function gridToWorld(gridX, gridY) {
    return {
        x: gridX * GRID_UNIT_WIDTH_PX,
        y: gridY * GRID_UNIT_HEIGHT_PX
    };
}

/**
 * Convert world position to grid coordinates
 *
 * @param {number} worldX - World X position in pixels
 * @param {number} worldY - World Y position in pixels
 * @returns {{gridX: number, gridY: number}}
 */
function worldToGrid(worldX, worldY) {
    return {
        gridX: Math.floor(worldX / GRID_UNIT_WIDTH_PX),
        gridY: Math.floor(worldY / GRID_UNIT_HEIGHT_PX)
    };
}

/**
 * Align a world position to the nearest grid boundary
 *
 * Uses Math.floor for consistent rounding of negative numbers
 * (always rounds toward negative infinity)
 *
 * @param {number} worldX - World X position
 * @param {number} worldY - World Y position
 * @returns {{x: number, y: number}}
 */
function alignToGrid(worldX, worldY) {
    // Use floor for consistent rounding of negative numbers
    const gridX = Math.floor(worldX / GRID_UNIT_WIDTH_PX);
    const gridY = Math.floor(worldY / GRID_UNIT_HEIGHT_PX);

    return {
        x: gridX * GRID_UNIT_WIDTH_PX,
        y: gridY * GRID_UNIT_HEIGHT_PX
    };
}

/**
 * Extract room dimensions from Tiled JSON data
 *
 * Reads the tilemap to get room size and calculates:
 * - Tile dimensions
 * - Pixel dimensions
 * - Grid units
 * - Stacking height (for positioning calculations)
 *
 * @param {string} roomId - Room identifier
 * @param {Object} roomData - Room data from scenario
 * @param {Phaser.Game} gameInstance - Game instance for accessing tilemaps
 * @returns {Object} Dimension data
 */
function getRoomDimensions(roomId, roomData, gameInstance) {
    const map = gameInstance.cache.tilemap.get(roomData.type);

    let widthTiles, heightTiles;

    // Try different ways to access tilemap data
    if (map && map.json) {
        widthTiles = map.json.width;
        heightTiles = map.json.height;
    } else if (map && map.data) {
        widthTiles = map.data.width;
        heightTiles = map.data.height;
    } else {
        // Fallback to standard room size
        console.warn(`Could not read dimensions for ${roomId}, using default 10×10`);
        widthTiles = 10;
        heightTiles = 10;
    }

    // Calculate grid units
    const { gridWidth, gridHeight } = tilesToGridUnits(widthTiles, heightTiles);

    // Calculate pixel dimensions
    const widthPx = widthTiles * TILE_SIZE;
    const heightPx = heightTiles * TILE_SIZE;
    const stackingHeightPx = (heightTiles - VISUAL_TOP_TILES) * TILE_SIZE;

    return {
        widthTiles,
        heightTiles,
        widthPx,
        heightPx,
        stackingHeightPx,
        gridWidth,
        gridHeight
    };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that a room's dimensions are multiples of grid units
 *
 * @param {string} roomId - Room identifier
 * @param {Object} dimensions - Room dimensions from getRoomDimensions
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateRoomSize(roomId, dimensions) {
    const errors = [];

    // Check if width is multiple of grid unit width
    const widthRemainder = dimensions.widthTiles % GRID_UNIT_WIDTH_TILES;
    if (widthRemainder !== 0) {
        errors.push(`Room ${roomId} width ${dimensions.widthTiles} tiles is not a multiple of ${GRID_UNIT_WIDTH_TILES} (grid unit width). Remainder: ${widthRemainder} tiles`);
    }

    // Check if stacking height is multiple of grid unit height
    const stackingHeightTiles = dimensions.heightTiles - VISUAL_TOP_TILES;
    const heightRemainder = stackingHeightTiles % GRID_UNIT_HEIGHT_TILES;
    if (heightRemainder !== 0) {
        errors.push(`Room ${roomId} stacking height ${stackingHeightTiles} tiles is not a multiple of ${GRID_UNIT_HEIGHT_TILES} (grid unit height). Remainder: ${heightRemainder} tiles`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate that all room positions are grid-aligned
 *
 * @param {Object} positions - Map of roomId -> {x, y}
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateGridAlignment(positions) {
    const errors = [];

    Object.entries(positions).forEach(([roomId, pos]) => {
        // Check X alignment
        const xRemainder = pos.x % GRID_UNIT_WIDTH_PX;
        if (xRemainder !== 0) {
            errors.push(`Room ${roomId} X position ${pos.x} is not grid-aligned (remainder: ${xRemainder}px, should be multiple of ${GRID_UNIT_WIDTH_PX}px)`);
        }

        // Check Y alignment
        const yRemainder = pos.y % GRID_UNIT_HEIGHT_PX;
        if (yRemainder !== 0) {
            errors.push(`Room ${roomId} Y position ${pos.y} is not grid-aligned (remainder: ${yRemainder}px, should be multiple of ${GRID_UNIT_HEIGHT_PX}px)`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if two rooms overlap
 *
 * @param {string} roomId1 - First room ID
 * @param {string} roomId2 - Second room ID
 * @param {Object} positions - Map of roomId -> {x, y}
 * @param {Object} dimensions - Map of roomId -> dimensions
 * @returns {boolean} True if rooms overlap
 */
function roomsOverlap(roomId1, roomId2, positions, dimensions) {
    const pos1 = positions[roomId1];
    const dim1 = dimensions[roomId1];
    const pos2 = positions[roomId2];
    const dim2 = dimensions[roomId2];

    // Check for overlap using AABB (Axis-Aligned Bounding Box) collision
    const overlap = !(
        pos1.x + dim1.widthPx <= pos2.x ||
        pos2.x + dim2.widthPx <= pos1.x ||
        pos1.y + dim1.stackingHeightPx <= pos2.y ||
        pos2.y + dim2.stackingHeightPx <= pos1.y
    );

    return overlap;
}

/**
 * Validate that no rooms overlap
 *
 * @param {Object} positions - Map of roomId -> {x, y}
 * @param {Object} dimensions - Map of roomId -> dimensions
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateNoOverlaps(positions, dimensions) {
    const errors = [];
    const roomIds = Object.keys(positions);

    // Check each pair of rooms
    for (let i = 0; i < roomIds.length; i++) {
        for (let j = i + 1; j < roomIds.length; j++) {
            const roomId1 = roomIds[i];
            const roomId2 = roomIds[j];

            if (roomsOverlap(roomId1, roomId2, positions, dimensions)) {
                const pos1 = positions[roomId1];
                const pos2 = positions[roomId2];
                errors.push(`Rooms ${roomId1} and ${roomId2} overlap! ${roomId1} at (${pos1.x}, ${pos1.y}), ${roomId2} at (${pos2.x}, ${pos2.y})`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate all room layout constraints
 *
 * @param {Object} dimensions - Map of roomId -> dimensions
 * @param {Object} positions - Map of roomId -> {x, y}
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateRoomLayout(dimensions, positions) {
    const errors = [];
    const warnings = [];

    console.log('\n=== Validating Room Layout ===');

    // Validate room sizes
    console.log('Validating room sizes...');
    Object.entries(dimensions).forEach(([roomId, dim]) => {
        const result = validateRoomSize(roomId, dim);
        if (!result.valid) {
            warnings.push(...result.errors); // Size issues are warnings, not errors
        }
    });

    // Validate grid alignment
    console.log('Validating grid alignment...');
    const alignmentResult = validateGridAlignment(positions);
    if (!alignmentResult.valid) {
        errors.push(...alignmentResult.errors);
    }

    // Validate no overlaps
    console.log('Validating room overlaps...');
    const overlapResult = validateNoOverlaps(positions, dimensions);
    if (!overlapResult.valid) {
        errors.push(...overlapResult.errors);
    }

    const valid = errors.length === 0;

    console.log(`Validation ${valid ? 'PASSED' : 'FAILED'}`);
    if (warnings.length > 0) {
        console.log(`${warnings.length} warnings:`);
        warnings.forEach(w => console.warn(`  ⚠️  ${w}`));
    }
    if (errors.length > 0) {
        console.log(`${errors.length} errors:`);
        errors.forEach(e => console.error(`  ❌ ${e}`));
    }

    return { valid, errors, warnings };
}

// ============================================================================
// ROOM POSITIONING FUNCTIONS
// ============================================================================

/**
 * Position a single room to the north of current room
 */
function positionNorthSingle(currentRoom, connectedRoom, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const connectedDim = dimensions[connectedRoom];

    const y = currentPos.y - connectedDim.stackingHeightPx;

    // When rooms have different widths, align edges to match door placement parity.
    // Door sprites use (gridX + gridY) % 2 of each room to pick NW (left) or NE (right) corner.
    // For both rooms to produce the same absolute door X, they must share that edge:
    //   even sum → left-align (both door sprites at roomX + 1.5 tiles)
    //   odd sum  → right-align (both door sprites at roomX + width - 1.5 tiles)
    // For equal-width rooms this is identical to centering.
    let x;
    if (currentDim.widthPx !== connectedDim.widthPx) {
        const gridCoords = worldToGrid(currentPos.x, currentPos.y);
        const sum = gridCoords.gridX + gridCoords.gridY;
        const useRightSide = ((sum % 2) + 2) % 2 === 1;
        x = useRightSide
            ? currentPos.x + currentDim.widthPx - connectedDim.widthPx
            : currentPos.x;
    } else {
        x = currentPos.x;
    }

    return alignToGrid(x, y);
}

/**
 * Position multiple rooms to the north of current room
 * CRITICAL: Ensures all connected rooms have at least 1 GU overlap with current room's edge
 */
function positionNorthMultiple(currentRoom, connectedRooms, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const positions = {};

    // Calculate total width of all connected rooms
    const totalWidth = connectedRooms.reduce((sum, roomId) => {
        return sum + dimensions[roomId].widthPx;
    }, 0);

    // Calculate starting X position to center the group over current room
    const groupStartX = currentPos.x + (currentDim.widthPx - totalWidth) / 2;

    // Align the starting position to grid
    let alignedStartX = alignToGrid(groupStartX, 0).x;

    // CRITICAL: Ensure each room has at least 1 GU overlap with parent room
    // After grid alignment, check if all rooms will have minimum overlap
    const minOverlap = GRID_UNIT_WIDTH_PX;

    // Check first room overlap
    const firstDim = dimensions[connectedRooms[0]];
    const firstRoomEnd = alignedStartX + firstDim.widthPx;
    const firstOverlap = Math.min(firstRoomEnd, currentPos.x + currentDim.widthPx) - Math.max(alignedStartX, currentPos.x);

    if (firstOverlap < minOverlap) {
        // First room doesn't have enough overlap, shift group to the right
        alignedStartX = currentPos.x - firstDim.widthPx + minOverlap;
        alignedStartX = alignToGrid(alignedStartX, 0).x;
    }

    // Check last room overlap (after potential adjustment for first room)
    const lastRoomStartX = alignedStartX + totalWidth - dimensions[connectedRooms[connectedRooms.length - 1]].widthPx;
    const lastRoomEndX = alignedStartX + totalWidth;
    const lastOverlap = Math.min(lastRoomEndX, currentPos.x + currentDim.widthPx) - Math.max(lastRoomStartX, currentPos.x);

    if (lastOverlap < minOverlap) {
        // Last room doesn't have enough overlap, shift group to the left
        const lastDim = dimensions[connectedRooms[connectedRooms.length - 1]];
        alignedStartX = currentPos.x + currentDim.widthPx - totalWidth - lastDim.widthPx + minOverlap;
        alignedStartX = alignToGrid(alignedStartX, 0).x;
    }

    // Position each room side-by-side starting from adjusted aligned position
    let currentX = alignedStartX;

    connectedRooms.forEach(roomId => {
        const connectedDim = dimensions[roomId];

        // Calculate Y position based on room's stacking height
        const roomY = currentPos.y - connectedDim.stackingHeightPx;
        const alignedY = alignToGrid(0, roomY).y;

        positions[roomId] = { x: currentX, y: alignedY };

        // Move X position for next room
        currentX += connectedDim.widthPx;
    });

    return positions;
}

/**
 * Position a single room to the south of current room
 */
function positionSouthSingle(currentRoom, connectedRoom, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const connectedDim = dimensions[connectedRoom];

    const y = currentPos.y + currentDim.stackingHeightPx;

    // Same parity-based edge alignment as positionNorthSingle — see comment there,
    // except the parity is taken at the SHARED wall (the current room's bottom
    // edge, where its south door sprite picks its side), not at the current
    // room's origin. For the north case the shared wall is the origin, so the
    // two already agree there.
    let x;
    if (currentDim.widthPx !== connectedDim.widthPx) {
        const gridCoords = worldToGrid(currentPos.x, currentPos.y + currentDim.stackingHeightPx);
        const sum = gridCoords.gridX + gridCoords.gridY;
        const useRightSide = ((sum % 2) + 2) % 2 === 1;
        x = useRightSide
            ? currentPos.x + currentDim.widthPx - connectedDim.widthPx
            : currentPos.x;
    } else {
        x = currentPos.x;
    }

    return alignToGrid(x, y);
}

/**
 * Position multiple rooms to the south of current room
 * CRITICAL: Ensures all connected rooms have at least 1 GU overlap with current room's edge
 */
function positionSouthMultiple(currentRoom, connectedRooms, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const positions = {};

    // Calculate total width of all connected rooms
    const totalWidth = connectedRooms.reduce((sum, roomId) => {
        return sum + dimensions[roomId].widthPx;
    }, 0);

    // Calculate starting X position to center the group over current room
    const groupStartX = currentPos.x + (currentDim.widthPx - totalWidth) / 2;

    // Align the starting position to grid
    let alignedStartX = alignToGrid(groupStartX, 0).x;

    // CRITICAL: Ensure each room has at least 1 GU overlap with parent room
    const minOverlap = GRID_UNIT_WIDTH_PX;

    // Check first room overlap
    const firstDim = dimensions[connectedRooms[0]];
    const firstRoomEnd = alignedStartX + firstDim.widthPx;
    const firstOverlap = Math.min(firstRoomEnd, currentPos.x + currentDim.widthPx) - Math.max(alignedStartX, currentPos.x);

    if (firstOverlap < minOverlap) {
        // First room doesn't have enough overlap, shift group to the right
        alignedStartX = currentPos.x - firstDim.widthPx + minOverlap;
        alignedStartX = alignToGrid(alignedStartX, 0).x;
    }

    // Check last room overlap
    const lastRoomStartX = alignedStartX + totalWidth - dimensions[connectedRooms[connectedRooms.length - 1]].widthPx;
    const lastRoomEndX = alignedStartX + totalWidth;
    const lastOverlap = Math.min(lastRoomEndX, currentPos.x + currentDim.widthPx) - Math.max(lastRoomStartX, currentPos.x);

    if (lastOverlap < minOverlap) {
        // Last room doesn't have enough overlap, shift group to the left
        const lastDim = dimensions[connectedRooms[connectedRooms.length - 1]];
        alignedStartX = currentPos.x + currentDim.widthPx - totalWidth - lastDim.widthPx + minOverlap;
        alignedStartX = alignToGrid(alignedStartX, 0).x;
    }

    // Position each room side-by-side
    let currentX = alignedStartX;
    const y = currentPos.y + currentDim.stackingHeightPx;
    const alignedY = alignToGrid(0, y).y;

    connectedRooms.forEach(roomId => {
        const connectedDim = dimensions[roomId];

        positions[roomId] = { x: currentX, y: alignedY };

        // Move X position for next room
        currentX += connectedDim.widthPx;
    });

    return positions;
}

/**
 * Position a single room to the east of current room
 */
function positionEastSingle(currentRoom, connectedRoom, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const connectedDim = dimensions[connectedRoom];

    // Position to the right, aligned at north edge
    const x = currentPos.x + currentDim.widthPx;
    const y = currentPos.y;

    // Align to grid
    return alignToGrid(x, y);
}

/**
 * Position multiple rooms to the east of current room
 * CRITICAL: Ensures all connected rooms have at least 1 GU overlap with current room's edge
 */
function positionEastMultiple(currentRoom, connectedRooms, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const positions = {};

    // Calculate total height of all connected rooms (using stacking height)
    const totalHeight = connectedRooms.reduce((sum, roomId) => {
        return sum + dimensions[roomId].stackingHeightPx;
    }, 0);

    // Calculate starting Y position to center the group along current room's edge
    const groupStartY = currentPos.y + (currentDim.stackingHeightPx - totalHeight) / 2;

    // Align the starting position to grid
    let alignedStartY = alignToGrid(0, groupStartY).y;

    // CRITICAL: Ensure each room has at least 1 GU overlap with parent room
    const minOverlap = GRID_UNIT_HEIGHT_PX;

    // Check first room overlap
    const firstDim = dimensions[connectedRooms[0]];
    const firstRoomEnd = alignedStartY + firstDim.stackingHeightPx;
    const firstOverlap = Math.min(firstRoomEnd, currentPos.y + currentDim.stackingHeightPx) - Math.max(alignedStartY, currentPos.y);

    if (firstOverlap < minOverlap) {
        // First room doesn't have enough overlap, shift group down
        alignedStartY = currentPos.y - firstDim.stackingHeightPx + minOverlap;
        alignedStartY = alignToGrid(0, alignedStartY).y;
    }

    // Check last room overlap
    const lastRoomStartY = alignedStartY + totalHeight - dimensions[connectedRooms[connectedRooms.length - 1]].stackingHeightPx;
    const lastRoomEndY = alignedStartY + totalHeight;
    const lastOverlap = Math.min(lastRoomEndY, currentPos.y + currentDim.stackingHeightPx) - Math.max(lastRoomStartY, currentPos.y);

    if (lastOverlap < minOverlap) {
        // Last room doesn't have enough overlap, shift group up
        const lastDim = dimensions[connectedRooms[connectedRooms.length - 1]];
        alignedStartY = currentPos.y + currentDim.stackingHeightPx - totalHeight - lastDim.stackingHeightPx + minOverlap;
        alignedStartY = alignToGrid(0, alignedStartY).y;
    }

    // Position each room stacked vertically
    const x = currentPos.x + currentDim.widthPx;
    const alignedX = alignToGrid(x, 0).x;
    let currentY = alignedStartY;

    connectedRooms.forEach(roomId => {
        const connectedDim = dimensions[roomId];

        positions[roomId] = { x: alignedX, y: currentY };

        // Move Y position for next room
        currentY += connectedDim.stackingHeightPx;
    });

    return positions;
}

/**
 * Position a single room to the west of current room
 */
function positionWestSingle(currentRoom, connectedRoom, currentPos, dimensions) {
    const connectedDim = dimensions[connectedRoom];

    // Position to the left, aligned at north edge
    const x = currentPos.x - connectedDim.widthPx;
    const y = currentPos.y;

    // Align to grid
    return alignToGrid(x, y);
}

/**
 * Position multiple rooms to the west of current room
 * CRITICAL: Ensures all connected rooms have at least 1 GU overlap with current room's edge
 */
function positionWestMultiple(currentRoom, connectedRooms, currentPos, dimensions) {
    const currentDim = dimensions[currentRoom];
    const positions = {};

    // Calculate total height of all connected rooms (using stacking height)
    const totalHeight = connectedRooms.reduce((sum, roomId) => {
        return sum + dimensions[roomId].stackingHeightPx;
    }, 0);

    // Calculate starting Y position to center the group along current room's edge
    const groupStartY = currentPos.y + (currentDim.stackingHeightPx - totalHeight) / 2;

    // Align the starting position to grid
    let alignedStartY = alignToGrid(0, groupStartY).y;

    // CRITICAL: Ensure each room has at least 1 GU overlap with parent room
    const minOverlap = GRID_UNIT_HEIGHT_PX;

    // Check first room overlap
    const firstDim = dimensions[connectedRooms[0]];
    const firstRoomEnd = alignedStartY + firstDim.stackingHeightPx;
    const firstOverlap = Math.min(firstRoomEnd, currentPos.y + currentDim.stackingHeightPx) - Math.max(alignedStartY, currentPos.y);

    if (firstOverlap < minOverlap) {
        // First room doesn't have enough overlap, shift group down
        alignedStartY = currentPos.y - firstDim.stackingHeightPx + minOverlap;
        alignedStartY = alignToGrid(0, alignedStartY).y;
    }

    // Check last room overlap
    const lastRoomStartY = alignedStartY + totalHeight - dimensions[connectedRooms[connectedRooms.length - 1]].stackingHeightPx;
    const lastRoomEndY = alignedStartY + totalHeight;
    const lastOverlap = Math.min(lastRoomEndY, currentPos.y + currentDim.stackingHeightPx) - Math.max(lastRoomStartY, currentPos.y);

    if (lastOverlap < minOverlap) {
        // Last room doesn't have enough overlap, shift group up
        const lastDim = dimensions[connectedRooms[connectedRooms.length - 1]];
        alignedStartY = currentPos.y + currentDim.stackingHeightPx - totalHeight - lastDim.stackingHeightPx + minOverlap;
        alignedStartY = alignToGrid(0, alignedStartY).y;
    }

    // Position each room stacked vertically
    let currentY = alignedStartY;

    connectedRooms.forEach(roomId => {
        const connectedDim = dimensions[roomId];

        // Position to the left
        const x = currentPos.x - connectedDim.widthPx;
        const alignedX = alignToGrid(x, 0).x;

        positions[roomId] = { x: alignedX, y: currentY };

        // Move Y position for next room
        currentY += connectedDim.stackingHeightPx;
    });

    return positions;
}

/**
 * Route single room positioning to appropriate direction function
 */
function positionSingleRoom(direction, currentRoom, connectedRoom, currentPos, dimensions) {
    switch (direction) {
        case 'north': return positionNorthSingle(currentRoom, connectedRoom, currentPos, dimensions);
        case 'south': return positionSouthSingle(currentRoom, connectedRoom, currentPos, dimensions);
        case 'east': return positionEastSingle(currentRoom, connectedRoom, currentPos, dimensions);
        case 'west': return positionWestSingle(currentRoom, connectedRoom, currentPos, dimensions);
        default:
            console.error(`Unknown direction: ${direction}`);
            return currentPos;
    }
}

/**
 * Route multiple room positioning to appropriate direction function
 */
function positionMultipleRooms(direction, currentRoom, connectedRooms, currentPos, dimensions) {
    switch (direction) {
        case 'north': return positionNorthMultiple(currentRoom, connectedRooms, currentPos, dimensions);
        case 'south': return positionSouthMultiple(currentRoom, connectedRooms, currentPos, dimensions);
        case 'east': return positionEastMultiple(currentRoom, connectedRooms, currentPos, dimensions);
        case 'west': return positionWestMultiple(currentRoom, connectedRooms, currentPos, dimensions);
        default:
            console.error(`Unknown direction: ${direction}`);
            return {};
    }
}

export function calculateRoomPositions(gameInstance) {
    const positions = {};
    const dimensions = {};
    const processed = new Set();
    const queue = [];
    const gameScenario = window.gameScenario;

    console.log('=== NEW ROOM LAYOUT SYSTEM: Starting Room Position Calculations ===');

    // Phase 1: Extract all room dimensions
    console.log('\n--- Phase 1: Extracting Room Dimensions ---');
    Object.entries(gameScenario.rooms).forEach(([roomId, roomData]) => {
        dimensions[roomId] = getRoomDimensions(roomId, roomData, gameInstance);
        console.log(`Room ${roomId} (${roomData.type}): ${dimensions[roomId].widthTiles}×${dimensions[roomId].heightTiles} tiles = ${dimensions[roomId].gridWidth}×${dimensions[roomId].gridHeight} grid units`);
    });

    // Phase 2: Place starting room at origin
    console.log('\n--- Phase 2: Placing Starting Room ---');
    const startRoomId = gameScenario.startRoom;
    positions[startRoomId] = { x: 0, y: 0 };
    processed.add(startRoomId);
    queue.push(startRoomId);
    console.log(`Starting room "${startRoomId}" positioned at (0, 0)`);

    // Phase 3: Process rooms breadth-first
    console.log('\n--- Phase 3: Processing Rooms Breadth-First ---');
    while (queue.length > 0) {
        const currentRoomId = queue.shift();
        const currentRoom = gameScenario.rooms[currentRoomId];
        const currentPos = positions[currentRoomId];

        console.log(`\nProcessing room: ${currentRoomId}`);
        console.log(`  Position: (${currentPos.x}, ${currentPos.y})`);

        // Skip rooms without connections
        if (!currentRoom.connections) {
            console.log(`  No connections for ${currentRoomId}`);
            continue;
        }

        // Process each direction
        ['north', 'south', 'east', 'west'].forEach(direction => {
            const connected = currentRoom.connections[direction];
            if (!connected) return;

            // Convert to array if single connection
            const connectedRooms = Array.isArray(connected) ? connected : [connected];

            // Filter out already processed rooms
            const unprocessed = connectedRooms.filter(roomId => !processed.has(roomId));
            if (unprocessed.length === 0) {
                console.log(`  ${direction}: all rooms already processed`);
                return;
            }

            console.log(`  ${direction}: positioning ${unprocessed.length} room(s) - ${unprocessed.join(', ')}`);

            // Position rooms based on count
            if (unprocessed.length === 1) {
                // Single room connection
                const roomId = unprocessed[0];
                const position = positionSingleRoom(direction, currentRoomId, roomId, currentPos, dimensions);
                positions[roomId] = position;
                processed.add(roomId);
                queue.push(roomId);

                const gridCoords = worldToGrid(position.x, position.y);
                console.log(`    ${roomId}: positioned at world(${position.x}, ${position.y}) = grid(${gridCoords.gridX}, ${gridCoords.gridY})`);
            } else {
                // Multiple room connections placed side-by-side by
                // positionMultipleRooms. Correctness is verified afterwards by
                // validateNoOverlaps on the final positions — we deliberately
                // do NOT pre-check with a door-span heuristic here, because that
                // heuristic does not model the actual side-by-side placement and
                // raised false alarms on valid multi-door corridors.
                const newPositions = positionMultipleRooms(direction, currentRoomId, unprocessed, currentPos, dimensions);

                unprocessed.forEach(roomId => {
                    positions[roomId] = newPositions[roomId];
                    processed.add(roomId);
                    queue.push(roomId);

                    const gridCoords = worldToGrid(newPositions[roomId].x, newPositions[roomId].y);
                    console.log(`    ${roomId}: positioned at world(${newPositions[roomId].x}, ${newPositions[roomId].y}) = grid(${gridCoords.gridX}, ${gridCoords.gridY})`);
                });
            }
        });
    }

    // Phase 4: Log final positions
    console.log('\n--- Phase 4: Final Room Positions ---');
    Object.entries(positions).forEach(([roomId, pos]) => {
        const gridCoords = worldToGrid(pos.x, pos.y);
        console.log(`${roomId}: world(${pos.x}, ${pos.y}) = grid(${gridCoords.gridX}, ${gridCoords.gridY})`);
    });

    // Phase 5: Validate room layout
    const validation = validateRoomLayout(dimensions, positions);

    // Store dimensions and positions globally for use by door placement and validation
    window.roomDimensions = dimensions;
    window.roomPositions = positions;

    console.log('\n=== Room Position Calculations Complete ===\n');

    // If validation failed, log but don't block (existing scenarios may have issues)
    if (!validation.valid) {
        console.error('⚠️  Room layout validation found errors. The game may not work correctly.');
    }

    return positions;
}

export function createRoom(roomId, roomData, position) {
    try {
        // Check if room already exists - prevent recreating
        if (rooms[roomId]) {
            console.log(`Room ${roomId} already exists, skipping recreation`);
            return;
        }

        console.log(`Creating room ${roomId} of type ${roomData.type}`);
        const gameScenario = window.gameScenario;

        // Build a set of item types that are in startItemsInInventory
        // These should NOT be created as sprites in rooms
        const startInventoryTypes = new Set();
        if (gameScenario && gameScenario.startItemsInInventory && Array.isArray(gameScenario.startItemsInInventory)) {
            gameScenario.startItemsInInventory.forEach(item => {
                startInventoryTypes.add(item.type);
                console.log(`Marking item type "${item.type}" as starting inventory (will not create sprite in rooms)`);
            });
        }
        
        // Safety check: if gameRef is null, use window.game as fallback
        if (!gameRef && window.game) {
            console.log('gameRef was null, using window.game as fallback');
            gameRef = window.game;
        }
        
        if (!gameRef) {
            throw new Error('Game reference is null - cannot create room. This should not happen if called after game initialization.');
        }
        
        const map = gameRef.make.tilemap({ key: roomData.type });
        const tilesets = [];
        
        // Add tilesets
        console.log('Available tilesets:', map.tilesets.map(t => ({
            name: t.name,
            columns: t.columns,
            firstgid: t.firstgid,
            tilecount: t.tilecount
        })));
        
        const regularTilesets = map.tilesets.filter(t => 
            !t.name.includes('Interiors_48x48') && 
            t.name !== 'objects' && // Skip the objects tileset as it's handled separately
            t.name !== 'tables' && // Skip the tables tileset as it's also an ImageCollection
            !t.name.includes('../objects/') && // Skip individual object tilesets
            !t.name.includes('../tables/') && // Skip individual table tilesets
            t.columns > 0 // Only process tilesets with columns (regular tilesets)
        );
        
        console.log('Filtered tilesets to process:', regularTilesets.map(t => t.name));
        
        regularTilesets.forEach(tileset => {
            console.log(`Attempting to add tileset: ${tileset.name}`);
            const loadedTileset = map.addTilesetImage(tileset.name, tileset.name);
            if (loadedTileset) {
                tilesets.push(loadedTileset);
                console.log(`Added regular tileset: ${tileset.name}`);
            } else {
                console.log(`Failed to add tileset: ${tileset.name}`);
            }
        });

        // Initialize room data structure first
        rooms[roomId] = {
            map,
            layers: {},
            wallsLayers: [],
            objects: {},
            position
        };
        
        // Ensure window.rooms is updated
        window.rooms = rooms;

        const layers = rooms[roomId].layers;
        const wallsLayers = rooms[roomId].wallsLayers;
        
        // IMPORTANT: This counter ensures unique layer IDs across ALL rooms and should not be removed
        if (!window.globalLayerCounter) window.globalLayerCounter = 0;

        // Calculate base depth for this room's layers
        // Use world Y position + layer offset (room Y is 2 tiles south of actual room position)
        const roomWorldY = position.y + TILE_SIZE * 2; // Room Y is 2 tiles south of room position
        
        // Create door sprites based on gameScenario connections
        const doorSprites = createDoorSpritesForRoom(roomId, position);
        rooms[roomId].doorSprites = doorSprites;
        console.log(`Stored ${doorSprites.length} door sprites in room ${roomId}`);
        
        // Store door positions for wall tile removal
        const doorPositions = doorSprites.map(doorSprite => ({
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.body ? doorSprite.body.width : TILE_SIZE,
            height: doorSprite.body ? doorSprite.body.height : TILE_SIZE * 2
        }));

        // Create other layers with appropriate depths
        map.layers.forEach((layerData, index) => {
            // Skip the doors layer since we're using sprite-based doors
            if (layerData.name.toLowerCase().includes('doors')) {
                console.log(`Skipping doors layer: ${layerData.name} in room ${roomId}`);
                return;
            }

            window.globalLayerCounter++;
            const uniqueLayerId = `${roomId}_${layerData.name}_${window.globalLayerCounter}`;
            
            const layer = map.createLayer(index, tilesets, Math.round(position.x), Math.round(position.y));
            if (layer) {
                layer.name = uniqueLayerId;
                // remove tiles under doors
                removeTilesUnderDoor(layer, roomId, position);

                
                // Set depth based on layer type and room position
                if (layerData.name.toLowerCase().includes('floor')) {
                    layer.setDepth(roomWorldY + 0.1);
                    console.log(`Floor layer depth: ${roomWorldY + 0.1}`);
                } else if (layerData.name.toLowerCase().includes('walls')) {
                    layer.setDepth(roomWorldY + 0.2);
                    console.log(`Wall layer depth: ${roomWorldY + 0.2}`);
                    
                    // Remove wall tiles under doors
                    removeTilesUnderDoor(layer, roomId, position);
                    
                    // Set up wall layer (collision disabled - using custom collision boxes instead)
                    try {
                        // Disabled: layer.setCollisionByExclusion([-1]);
                        console.log(`Wall layer ${uniqueLayerId} - using custom collision boxes instead of tile collision`);
                        
                        wallsLayers.push(layer);
                        console.log(`Added wall layer: ${uniqueLayerId}`);
                        
                        // Disabled: Old collision system between player and wall layer
                        // const player = window.player;
                        // if (player && player.body) {
                        //     gameRef.physics.add.collider(player, layer);
                        //     console.log(`Added collision between player and wall layer: ${uniqueLayerId}`);
                        // }
                        
                        // Create thin collision boxes for wall tiles
                        createWallCollisionBoxes(layer, roomId, position);
                    } catch (e) {
                        console.warn(`Error setting up collisions for ${uniqueLayerId}:`, e);
                    }
                } else if (layerData.name.toLowerCase().includes('collision')) {
                    layer.setDepth(roomWorldY + 0.15);
                    console.log(`Collision layer depth: ${roomWorldY + 0.15}`);
                    
                    // Set up collision layer (collision disabled - using custom collision boxes instead)
                    try {
                        // Disabled: layer.setCollisionByExclusion([-1]);
                        console.log(`Collision layer ${uniqueLayerId} - using custom collision boxes instead of tile collision`);
                        
                        // Disabled: Old collision system between player and collision layer
                        // const player = window.player;
                        // if (player && player.body) {
                        //     gameRef.physics.add.collider(player, layer);
                        //     console.log(`Added collision between player and collision layer: ${uniqueLayerId}`);
                        // }
                    } catch (e) {
                        console.warn(`Error setting up collision layer ${uniqueLayerId}:`, e);
                    }
                } else if (layerData.name.toLowerCase().includes('props')) {
                    layer.setDepth(roomWorldY + 0.3);
                    console.log(`Props layer depth: ${roomWorldY + 0.3}`);
                } else {
                    // Other layers (decorations, etc.)
                    layer.setDepth(roomWorldY + 0.4);
                    console.log(`Other layer depth: ${roomWorldY + 0.4}`);
                }
                
                layers[uniqueLayerId] = layer;
                layer.setVisible(false);
                layer.setAlpha(0);
            }
        });

        // Handle new Tiled object layers with grouping logic
        const objectLayers = [
            'tables', 'table_items', 'conditional_table_items', 
            'items', 'conditional_items'
        ];
        
        // First, collect all objects by layer
        const objectsByLayer = {};
        objectLayers.forEach(layerName => {
            const objectLayer = map.getObjectLayer(layerName);
            if (objectLayer && objectLayer.objects.length > 0) {
                objectsByLayer[layerName] = objectLayer.objects;
                console.log(`Collected ${layerName} layer with ${objectLayer.objects.length} objects`);
            }
        });
        
        // Process tables first to establish base positions
        const tableObjects = [];
        if (objectsByLayer.tables) {
            objectsByLayer.tables.forEach(obj => {
                const processedObj = processObject(obj, position, roomId, 'table', map);
                if (processedObj) {
                    tableObjects.push(processedObj);
                }
            });
        }
        
        // Group table items with their closest tables
        const tableGroups = [];
        tableObjects.forEach(table => {
            const group = {
                table: table,
                items: [],
                baseDepth: table.sprite.depth
            };
            tableGroups.push(group);
        });
        
        // NOTE: Table items (both regular and conditional) are now processed through the item pool
        // in processScenarioObjectsWithConditionalMatching(). They will be handled there
        // with proper priority ordering (regular table items before conditional ones).
        
        // Tiled objects already turned into sprites by the scenario pass below, so
        // the regular-items loop doesn't build a second, hidden copy of each one
        const processedTiledItems = new Set();

        // Process scenario objects with conditional item matching first
        const usedItems = processScenarioObjectsWithConditionalMatching(roomId, roomData, position, objectsByLayer, map);
        
        // Process all non-conditional items (chairs, plants, lamps, PCs, etc.)
        // These should ALWAYS be visible (not conditional)
        // They get default properties if not customized by scenario
        if (objectsByLayer.items) {
            objectsByLayer.items.forEach(obj => {
                const imageName = getImageNameFromObjectWithMap(obj, map);
                // Extract base type from image name
                let baseType = imageName ? imageName.replace(/\d+$/, '').replace(/\.png$/, '') : 'unknown';
                if (baseType === 'note') {
                    const number = imageName ? imageName.match(/\d+/) : null;
                    baseType = number ? 'notes' + number[0] : 'notes';
                }
                
                // Skip if this item type is in starting inventory
                if (startInventoryTypes.has(baseType)) {
                    console.log(`Skipping regular item ${imageName} (baseType: ${baseType}) - marked as starting inventory item`);
                    return;
                }
                
                // Already created as an unreserved item by the scenario pass
                if (processedTiledItems.has(obj)) {
                    return;
                }

                // Skip if this exact item was used by scenario objects
                // BUT: Create it anyway if we haven't used ALL items of this type
                if (imageName && usedItems.has(imageName)) {
                    console.log(`Skipping regular item ${imageName} (exact item used by scenario)`);
                    return;
                }
                
                // Process the item and store it
                const result = processObject(obj, position, roomId, 'item', map);
                if (result && result.sprite) {
                    // Store unconditional items in the objects collection so they're revealed
                    rooms[roomId].objects[result.sprite.objectId] = result.sprite;
                }
            });
        }
        
        // ===== NEW: ITEM POOL MANAGEMENT (PHASE 2 IMPROVEMENTS) =====
        
        // Helper function to process scenario objects with conditional matching
        function processScenarioObjectsWithConditionalMatching(roomId, roomData, position, objectsByLayer, map) {
            if (!roomData.objects) {
                return new Set();
            }

            // 1. Initialize item pool with all available Tiled items
            const itemPool = new TiledItemPool(objectsByLayer, map); // Pass map here
            const usedItems = new Set();

            console.log(`Processing ${roomData.objects.length} scenario objects for room ${roomId}`);

            // Track which Tiled table group to assign to next when scenario defines table objects
            let scenarioTableIndex = 0;

            // 2. Process each scenario object
            roomData.objects.forEach((scenarioObj, index) => {
                const objType = scenarioObj.type;

                // Handle table objects with explicit tableItems list.
                //
                // Two modes depending on whether the scenario specifies a custom sprite or
                // coordinates for the table:
                //
                // A) Dynamic table (sprite and/or x/y provided):
                //    A brand-new table sprite is created at the given coordinates (or at a
                //    random room position when coordinates are omitted).  Items are laid out
                //    evenly across the table surface.
                //
                // B) Tiled table (neither sprite nor x/y provided – default):
                //    The nth occurrence of type "table" in the scenario maps to the nth
                //    table already placed in the Tiled map (tableGroups[n]).  Items keep
                //    their Tiled pixel positions.
                //
                // Scenario examples:
                //   // Mode A – explicit table:
                //   { "type": "table", "sprite": "smalldesk2", "x": 80, "y": 140,
                //     "tableItems": [...] }
                //   // Mode A – random position (sprite only):
                //   { "type": "table", "sprite": "desk-ceo2", "tableItems": [...] }
                //   // Mode B – pair with Tiled table:
                //   { "type": "table", "tableItems": [...] }
                if (objType === 'table' && Array.isArray(scenarioObj.tableItems)) {
                    const hasDynamicSprite = !!scenarioObj.sprite;
                    const hasDynamicCoords = (scenarioObj.position?.x !== undefined || scenarioObj.position?.y !== undefined);
                    const isDynamic = hasDynamicSprite || hasDynamicCoords;

                    let group;

                    if (isDynamic) {
                        // --- Mode A: create a brand-new table at the specified position ---
                        const textureKey = scenarioObj.sprite || 'smalldesk2';

                        // Derive room pixel dimensions from the Tiled map
                        let roomWidth = 10 * TILE_SIZE;
                        let roomHeight = 10 * TILE_SIZE;
                        if (map) {
                            const mapSrc = map.json || map.data || map;
                            if (mapSrc.width)  roomWidth  = mapSrc.width  * TILE_SIZE;
                            if (mapSrc.height) roomHeight = mapSrc.height * TILE_SIZE;
                        }

                        // Resolve pixel coordinates (room-relative)
                        const tableX = scenarioObj.position?.x !== undefined
                            ? Math.round(position.x + scenarioObj.position.x * TILE_SIZE)
                            : Math.round(position.x + TILE_SIZE * 2 + Math.random() * (roomWidth  - TILE_SIZE * 5));
                        const tableY = scenarioObj.position?.y !== undefined
                            ? Math.round(position.y + scenarioObj.position.y * TILE_SIZE)
                            : Math.round(position.y + TILE_SIZE * 2 + Math.random() * (roomHeight - TILE_SIZE * 6));

                        const tableSprite = gameRef.add.sprite(tableX, tableY, textureKey);
                        tableSprite.setOrigin(0, 0);
                        tableSprite.name = textureKey;
                        tableSprite.objectId = `${roomId}_dynamic_table_${index}`;
                        tableSprite.setInteractive({ useHandCursor: true });
                        tableSprite.scenarioData = {
                            name: scenarioObj.name || textureKey,
                            type: 'table',
                            takeable: false,
                            readable: false,
                            observations: scenarioObj.observations || describeDecor(textureKey)
                        };

                        // Depth: same formula as regular objects (bottom-Y + 0.5)
                        const tableDepth = (tableSprite.y + tableSprite.height) + 0.5;
                        tableSprite.setDepth(tableDepth);
                        tableSprite.elevation = 0;
                        rooms[roomId].objects[tableSprite.objectId] = tableSprite;

                        group = { table: { sprite: tableSprite }, items: [], baseDepth: tableDepth, isDynamic: true };
                        tableGroups.push(group);
                        console.log(`Created dynamic table "${textureKey}" at room-relative (${tableX - position.x}, ${tableY - position.y})`);

                        // Add physics collision box – identical to the setup used for Tiled tables
                        // in processObject() so dynamic tables block the player the same way.
                        gameRef.physics.add.existing(tableSprite, true);
                        gameRef.time.delayedCall(0, () => {
                            if (tableSprite.body) {
                                tableSprite.body.immovable = true;
                                const tw = tableSprite.width;
                                const th = tableSprite.height;
                                const collisionWidth  = tw - 20;          // 10 px inset on each side
                                const collisionHeight = th / 4;           // bottom quarter
                                const offsetX = 10;
                                const offsetY = th - collisionHeight;     // position at bottom quarter
                                tableSprite.body.setSize(collisionWidth, collisionHeight);
                                tableSprite.body.setOffset(offsetX, offsetY);
                                console.log(`Set dynamic table "${textureKey}" collision box: ${collisionWidth}x${collisionHeight} at offset (${offsetX}, ${offsetY})`);
                                const player = window.player;
                                if (player && player.body) {
                                    gameRef.physics.add.collider(player, tableSprite);
                                    console.log(`Added collision between player and dynamic table: ${textureKey}`);
                                }
                            }
                        });

                    } else {
                        // --- Mode B: pair with the next available Tiled table ---
                        if (scenarioTableIndex < tableGroups.length) {
                            group = tableGroups[scenarioTableIndex];
                            scenarioTableIndex++;
                            console.log(`Assigning scenario tableItems to tableGroup[${scenarioTableIndex - 1}] (${scenarioObj.tableItems.length} items)`);
                        } else {
                            console.warn(`Scenario defines a table object but no matching Tiled table exists (scenarioTableIndex=${scenarioTableIndex}, tableGroups.length=${tableGroups.length})`);
                            return;
                        }
                    }

                    // Process each item in tableItems for the resolved group
                    scenarioObj.tableItems.forEach((tableItemObj, itemIndex) => {
                        const tiledItem = itemPool.findMatchFor(tableItemObj);
                        let sprite;
                        // True when the matched Tiled item lives in a table_items or
                        // conditional_table_items layer and therefore already has a
                        // designer-correct position relative to its table.
                        let fromTableLayer = false;

                        if (tiledItem) {
                            const imageName = itemPool.getImageNameFromObject(tiledItem);
                            const baseType = itemPool.extractBaseTypeFromImageName(imageName);
                            fromTableLayer = (
                                (itemPool.tableItemsByType[baseType]?.includes(tiledItem)) ||
                                (itemPool.conditionalTableItemsByType[baseType]?.includes(tiledItem))
                            );
                            sprite = createSpriteFromMatch(tiledItem, tableItemObj, position, roomId, index * 100 + itemIndex, map);
                            usedItems.add(imageName);
                            usedItems.add(baseType);
                            itemPool.reserve(tiledItem);
                            console.log(`Placed scenario table item: ${tableItemObj.type} using ${imageName} (fromTableLayer=${fromTableLayer})`);
                        } else {
                            // No Tiled item found – fall back to random room position;
                            // the repositioning below will move it onto the table.
                            sprite = createSpriteAtRandomPosition(tableItemObj, position, roomId, index * 100 + itemIndex, map);
                            console.warn(`No Tiled item found for scenario table item type "${tableItemObj.type}", will position on table surface`);
                        }

                        if (sprite) {
                            const tableSprite = group.table.sprite;

                            if (tableItemObj.x !== undefined || tableItemObj.y !== undefined) {
                                // Explicit table-relative coordinates: place the item at the
                                // given offset from the table's top-left corner.
                                // The scenario author is responsible for keeping the item
                                // within the table surface bounds.
                                if (tableItemObj.x !== undefined) sprite.x = Math.round(tableSprite.x + tableItemObj.x);
                                if (tableItemObj.y !== undefined) sprite.y = Math.round(tableSprite.y + tableItemObj.y);
                            } else if (group.isDynamic || !fromTableLayer) {
                                // Auto-position: reposition the item so it sits visually ON
                                // the table surface when:
                                //   • Mode A (dynamic table) – the table is at an arbitrary
                                //     position, so any Tiled item coordinates are for a
                                //     different table.
                                //   • Mode B (Tiled table) – only when the item did NOT come
                                //     from a table_items / conditional_table_items layer (i.e.
                                //     a floor item such as a bag whose Tiled Y is on the floor).
                                const itemSlot  = itemIndex + 1;
                                const slotCount = scenarioObj.tableItems.length + 1;

                                // Spread items evenly across the table width, centred on each slot.
                                sprite.x = Math.round(
                                    tableSprite.x + tableSprite.width * (itemSlot / slotCount) - sprite.width / 2
                                );

                                // Place the item so its BOTTOM sits at the bottom edge of the table
                                // sprite (which represents the front/surface in the top-down view).
                                //   target bottom Y  =  tableSprite.y + tableSprite.height
                                //   →  sprite.y       =  targetBottom - sprite.height
                                // Clamped to tableSprite.y so a tall item never floats above the table.
                                const targetBottomY = tableSprite.y + tableSprite.height;
                                sprite.y = Math.round(Math.max(tableSprite.y, targetBottomY - sprite.height));
                            }
                            // else: fromTableLayer && no explicit coords → keep Tiled position

                            // Depth will be recalculated by the final tableGroups pass
                            sprite.elevation = 0;
                            group.items.push({ sprite, type: 'scenario_table_item' });
                            rooms[roomId].objects[sprite.objectId] = sprite;
                        }
                    });

                    return; // This object is fully handled; skip the regular item-pool path
                }

                let sprite = null;
                let usedItem = null;
                let isTableItem = false;
                
                console.log(`Looking for scenario object type: ${objType}`);
                console.log(`Available regular items for ${objType}: ${itemPool.itemsByType[objType] ? itemPool.itemsByType[objType].length : 0}`);
                console.log(`Available conditional items for ${objType}: ${itemPool.conditionalItemsByType[objType] ? itemPool.conditionalItemsByType[objType].length : 0}`);
                console.log(`Available conditional table items for ${objType}: ${itemPool.conditionalTableItemsByType[objType] ? itemPool.conditionalTableItemsByType[objType].length : 0}`);
                
                // Check for as-type positioning (e.g., "as-type:pc" to use PC slots)
                let positionAsType = null;
                if (typeof scenarioObj.position === 'string' && scenarioObj.position.startsWith('as-type:')) {
                    positionAsType = scenarioObj.position.substring(8); // Extract type after "as-type:"
                    console.log(`Object will be positioned as type: ${positionAsType}`);
                }
                
                // Find matching Tiled item using centralized pool matching
                // Priority: positionAsType > sprite name > object's own type
                if (positionAsType) {
                    usedItem = itemPool.findMatchFor(scenarioObj, positionAsType);
                } else if (scenarioObj.sprite && typeof scenarioObj.sprite === 'string') {
                    usedItem = itemPool.findMatchFor(scenarioObj, scenarioObj.sprite)
                             || itemPool.findMatchFor(scenarioObj, null);
                } else {
                    usedItem = itemPool.findMatchFor(scenarioObj, null);
                }
                
                if (usedItem) {
                    // Check which layer this item came from to determine if it's a table item
                    const imageName = itemPool.getImageNameFromObject(usedItem);
                    const baseType = itemPool.extractBaseTypeFromImageName(imageName);
                    
                    // Determine source layer and log appropriately
                    let sourceLayer = 'unknown';
                    if (itemPool.itemsByType[baseType] && itemPool.itemsByType[baseType].includes(usedItem)) {
                        sourceLayer = 'items (regular)';
                        isTableItem = false;
                    } else if (itemPool.tableItemsByType[baseType] && itemPool.tableItemsByType[baseType].includes(usedItem)) {
                        sourceLayer = 'table_items (regular)';
                        isTableItem = true;
                    } else if (itemPool.conditionalItemsByType[baseType] && itemPool.conditionalItemsByType[baseType].includes(usedItem)) {
                        sourceLayer = 'conditional_items';
                        isTableItem = false;
                    } else if (itemPool.conditionalTableItemsByType[baseType] && itemPool.conditionalTableItemsByType[baseType].includes(usedItem)) {
                        sourceLayer = 'conditional_table_items';
                        isTableItem = true;
                    }
                    
                    console.log(`Using ${objType} from ${sourceLayer} layer`);
                    
                    // Create sprite from matched item
                    sprite = createSpriteFromMatch(usedItem, scenarioObj, position, roomId, index, map);

                    console.log(`Created ${objType} using ${imageName}`);

                    // Track this item as used
                    usedItems.add(imageName);
                    usedItems.add(baseType);
                    itemPool.reserve(usedItem);

                    // Override with explicit room-relative coordinates when specified.
                    // Tiled designer positions are ignored for coordinates-specified items.
                    // Coordinates are tile-based and converted to pixels (multiply by TILE_SIZE)
                    if (scenarioObj.position?.x !== undefined) sprite.x = Math.round(position.x + scenarioObj.position.x * TILE_SIZE);
                    if (scenarioObj.position?.y !== undefined) sprite.y = Math.round(position.y + scenarioObj.position.y * TILE_SIZE);

                    // If it's a table item, find the closest table and group it
                    if (isTableItem && tableObjects.length > 0) {
                        const closestTable = findClosestTable(sprite, tableObjects);
                        if (closestTable) {
                            const group = tableGroups.find(g => g.table === closestTable);
                            if (group) {
                                // Table items don't need elevation - they're grouped with the table
                                const itemDepth = group.baseDepth + (group.items.length + 1) * 0.01;
                                sprite.setDepth(itemDepth);
                                
                                // No elevation for table items
                                sprite.elevation = 0;
                                group.items.push({ sprite, type: sourceLayer });
                                
                                // Store table items in objects collection so interaction system can find them
                                rooms[roomId].objects[sprite.objectId] = sprite;
                            }
                        }
                    } else {
                        // Set depth and store for non-table items
                        setDepthAndStore(sprite, position, roomId, false, scenarioObj);
                        registerSpriteVariantListeners(sprite, scenarioObj, roomId);
                    }

                } else {
                    // No matching item found, create at random position (existing fallback behavior)
                    sprite = createSpriteAtRandomPosition(scenarioObj, position, roomId, index, map);

                    // Override with explicit room-relative coordinates when specified.
                    // Coordinates are tile-based and converted to pixels (multiply by TILE_SIZE)
                    if (scenarioObj.position?.x !== undefined) sprite.x = Math.round(position.x + scenarioObj.position.x * TILE_SIZE);
                    if (scenarioObj.position?.y !== undefined) sprite.y = Math.round(position.y + scenarioObj.position.y * TILE_SIZE);

                    // Set depth and store
                    setDepthAndStore(sprite, position, roomId, false, scenarioObj);
                    registerSpriteVariantListeners(sprite, scenarioObj, roomId);
                }
            });
            
            // 3. Process unreserved Tiled items (existing background decoration items)
            // These are unconditional items that were not used by any scenario object
            const unreservedItems = itemPool.getUnreservedItems();
            
            // Separate table items from regular items for special processing
            const unreservedTableItems = [];
            const unreservedRegularItems = [];
            
            unreservedItems.forEach(tiledItem => {
                const imageName = itemPool.getImageNameFromObject(tiledItem);
                
                // Skip if this exact item was already used by scenario objects
                if (usedItems.has(imageName)) {
                    return;
                }
                
                // Skip if this item type is in starting inventory
                const baseType = itemPool.extractBaseTypeFromImageName(imageName);
                if (startInventoryTypes.has(baseType)) {
                    console.log(`Skipping unreserved item ${imageName} (baseType: ${baseType}) - marked as starting inventory item`);
                    return;
                }
                
                // Check if this is a table item by seeing if it's in tableItemsByType
                if (itemPool.tableItemsByType[baseType] && 
                    itemPool.tableItemsByType[baseType].includes(tiledItem)) {
                    unreservedTableItems.push(tiledItem);
                } else {
                    unreservedRegularItems.push(tiledItem);
                }
            });
            
            // Process regular unreserved items (chairs, lamps, etc.)
            unreservedRegularItems.forEach(tiledItem => {
                const imageName = itemPool.getImageNameFromObject(tiledItem);
                
                // Use processObject to create sprite with all properties (collision, animation, etc.)
                const result = processObject(tiledItem, position, roomId, 'item', map);
                processedTiledItems.add(tiledItem);
                if (result && result.sprite) {
                    // Store unreserved items so they're revealed
                    rooms[roomId].objects[result.sprite.objectId] = result.sprite;
                    console.log(`Added unreserved item ${imageName} to room objects`);
                }
            });
            
            // Process unreserved table items - need to group them with tables and set depth
            unreservedTableItems.forEach(tiledItem => {
                const imageName = itemPool.getImageNameFromObject(tiledItem);
                
                // Use processObject to create sprite with all properties
                const result = processObject(tiledItem, position, roomId, 'table_item', map);
                if (result && result.sprite) {
                    // Find the closest table to group this item with
                    if (tableObjects.length > 0) {
                        const closestTable = findClosestTable(result.sprite, tableObjects);
                        if (closestTable) {
                            const group = tableGroups.find(g => g.table === closestTable);
                            if (group) {
                                group.items.push(result);
                                console.log(`Added unreserved table item ${imageName} to table group`);
                            }
                        }
                    } else {
                        // No tables, just store it as a regular item
                        rooms[roomId].objects[result.sprite.objectId] = result.sprite;
                        console.log(`Added unreserved table item ${imageName} to room objects (no tables to group with)`);
                    }
                }
            });
            
            // Final re-sort and depth assignment for all table groups 
            // (includes both scenario and unreserved table items)
            tableGroups.forEach(group => {
                // Sort items from north to south (lower Y values first)
                group.items.sort((a, b) => a.sprite.y - b.sprite.y);
                
                // Recalculate depths for all items in the group
                group.items.forEach((item, index) => {
                    // Table items don't need elevation - they're grouped with the table
                    const itemDepth = group.baseDepth + (index + 1) * 0.01;
                    item.sprite.setDepth(itemDepth);
                    
                    // No elevation for table items
                    item.sprite.elevation = 0;
                    console.log(`Final depth: table item ${item.sprite.name} to depth ${itemDepth} (position ${index + 1} of ${group.items.length})`);
                });
                
                // Store all group items in room objects
                group.items.forEach(item => {
                    rooms[roomId].objects[item.sprite.objectId] = item.sprite;
                });
            });
            
            // Log summary of item usage
            console.log(`=== Item Usage Summary ===`);
            Object.entries(itemPool.itemsByType).forEach(([baseType, items]) => {
                console.log(`Regular items for ${baseType}: ${items.length} available`);
            });
            Object.entries(itemPool.tableItemsByType).forEach(([baseType, items]) => {
                console.log(`Regular table items for ${baseType}: ${items.length} available`);
            });
            Object.entries(itemPool.conditionalItemsByType).forEach(([baseType, items]) => {
                console.log(`Conditional items for ${baseType}: ${items.length} available`);
            });
            Object.entries(itemPool.conditionalTableItemsByType).forEach(([baseType, items]) => {
                console.log(`Conditional table items for ${baseType}: ${items.length} available`);
            });
            
            return usedItems;
        }
        
        // Helper function to process individual objects
        function processObject(obj, position, roomId, type, map) {
            // Find the tileset that contains this GID
            // Handle multiple tileset instances by finding the most recent one
            let tileset = null;
            let localTileId = 0;
            let bestMatch = null;
            let bestMatchIndex = -1;
            
            for (let i = 0; i < map.tilesets.length; i++) {
                const ts = map.tilesets[i];
                // Handle tilesets with undefined tilecount (individual object tilesets)
                const maxGid = ts.tilecount ? ts.firstgid + ts.tilecount : ts.firstgid + 1;
                if (obj.gid >= ts.firstgid && obj.gid < maxGid) {
                    // Prefer objects tilesets, and among those, prefer the most recent (highest index)
                    if (ts.name === 'objects' || ts.name.includes('objects/') || ts.name.includes('tables/')) {
                        if (bestMatchIndex < i) {
                            bestMatch = ts;
                            bestMatchIndex = i;
                            tileset = ts;
                            localTileId = obj.gid - ts.firstgid;
                        }
                    } else if (!bestMatch) {
                        // Fallback to any matching tileset if no objects tileset found
                        tileset = ts;
                        localTileId = obj.gid - ts.firstgid;
                    }
                }
            }
            
            if (tileset && (tileset.name === 'objects' || tileset.name.includes('objects/') || tileset.name.includes('tables/'))) {
                // This is an ImageCollection or individual object tileset, get the image data
                let imageName = null;
                
                // Check if this is an ImageCollection with images array
                if (tileset.images && tileset.images[localTileId]) {
                    // Get image from the images array
                    const imageData = tileset.images[localTileId];
                    if (imageData && imageData.name) {
                        imageName = imageData.name;
                    }
                } else if (tileset.tileData && tileset.tileData[localTileId]) {
                    // Fallback: get from tileData
                    const tileData = tileset.tileData[localTileId];
                    if (tileData && tileData.image) {
                        const imagePath = tileData.image;
                        imageName = imagePath.split('/').pop().replace('.png', '');
                    }
                } else if (tileset.name.includes('objects/') || tileset.name.includes('tables/')) {
                    // This is an individual object or table tileset, extract name from tileset name
                    imageName = tileset.name.split('/').pop().replace('.png', '');
                }
                
                if (imageName) {
                    console.log(`Creating object from ImageCollection: ${imageName} at (${obj.x}, ${obj.y})`);
                    
                    // Create sprite at the object's position with pixel-perfect coordinates
                    const sprite = gameRef.add.sprite(
                        Math.round(position.x + obj.x),
                        Math.round(position.y + obj.y - obj.height), // Adjust for Tiled's coordinate system
                        imageName
                    );
                    
                    // Set sprite properties
                    sprite.setOrigin(0, 0);
                    sprite.name = imageName;
                    sprite.objectId = `${roomId}_${imageName}_${obj.id}`;
                    sprite.setInteractive({ useHandCursor: true });
                    
                    // Check if this is a wheeled, spinnable prop.
                    // Swivel props are named "<base>-rotate<N>" with 8 rotation frames
                    // (chairs). Some static props placed from a tileset are treated as
                    // swivel props too: they swap to an 8-direction sheet at runtime, so
                    // every existing placement rolls and spins like a chair.
                    const rotateMatch = imageName.match(/^(.*)-rotate(\d+)$/);
                    const staticSwivel = STATIC_SWIVEL_PROPS[imageName];
                    if ((imageName.startsWith('chair-') && !imageName.startsWith('chair-waiting')) || rotateMatch || staticSwivel) {
                        sprite.hasWheels = true;

                        // Check if this is a swivel prop (rotating chair, crash cart, wheelchair)
                        if (rotateMatch || staticSwivel) {
                            sprite.isSwivelChair = true;

                            // Determine the rotation base and starting frame
                            let base, frameNumber;
                            if (staticSwivel) {
                                ({ base, frameNumber } = staticSwivel);
                            } else {
                                base = `${rotateMatch[1]}-rotate`;
                                frameNumber = parseInt(rotateMatch[2]);
                            }

                            sprite.currentFrame = frameNumber - 1; // Convert to 0-based index
                            sprite.rotationSpeed = 0;
                            sprite.maxRotationSpeed = 0.15; // Slower maximum rotation speed
                            sprite.originalTexture = `${base}${frameNumber}`; // Rotation texture name
                            sprite.spinDirection = 0; // -1 for counter-clockwise, 1 for clockwise, 0 for no spin

                            // Swap the static prop to its rotation sheet so its
                            // dimensions (used for elevation + collision box below) match.
                            // The rotation frames sit on a larger canvas; the per-prop
                            // offset lines the starting frame up with the static image.
                            if (staticSwivel && gameRef.textures.exists(sprite.originalTexture)) {
                                sprite.setTexture(sprite.originalTexture);
                                sprite.x += staticSwivel.offsetX || 0;
                                sprite.y += staticSwivel.offsetY || 0;
                                sprite.swivelBody = staticSwivel.body || null;
                            }
                        }

                        // Calculate elevation for chairs (same as other objects)
                        const roomTopY = position.y;
                        const backWallThreshold = roomTopY + (2 * 32); // Back wall is top 2 tiles
                        const itemBottomY = sprite.y + sprite.height;
                        const elevation = itemBottomY < backWallThreshold ? (backWallThreshold - itemBottomY) : 0;
                        sprite.elevation = elevation;
                        
                    }
                    
                    // Check if this is an animated plant
                    if (imageName.startsWith('plant-large11-top-ani') || 
                        imageName.startsWith('plant-large12-top-ani') || 
                        imageName.startsWith('plant-large13-top-ani')) {
                        
                        sprite.isAnimatedPlant = true;
                        sprite.originalScaleX = sprite.scaleX;
                        sprite.originalScaleY = sprite.scaleY;
                        sprite.originalX = Math.round(sprite.x); // Store pixel-perfect position
                        sprite.originalY = Math.round(sprite.y); // Store pixel-perfect position
                        sprite.originalWidth = Math.round(sprite.width);
                        sprite.originalHeight = Math.round(sprite.height);
                        
                        // Determine which animation to use based on the plant type
                        if (imageName.startsWith('plant-large11-top-ani')) {
                            sprite.animationKey = 'plant-large11-bump';
                        } else if (imageName.startsWith('plant-large12-top-ani')) {
                            sprite.animationKey = 'plant-large12-bump';
                        } else if (imageName.startsWith('plant-large13-top-ani')) {
                            sprite.animationKey = 'plant-large13-bump';
                        }
                        
                        // Ensure the sprite is positioned on pixel boundaries
                        sprite.x = Math.round(sprite.x);
                        sprite.y = Math.round(sprite.y);
                        
                        console.log(`Animated plant ${imageName} ready with animation ${sprite.animationKey}`);
                    }
                    
                    // Set depth based on world Y position with elevation
                    const objectBottomY = sprite.y + sprite.height;
                    
                    // Calculate elevation for items on the back wall (top 2 tiles of room)
                    const roomTopY = position.y;
                    const backWallThreshold = roomTopY + (2 * 32); // Back wall is top 2 tiles
                    const itemBottomY = sprite.y + sprite.height;
                    const elevation = itemBottomY < backWallThreshold ? (backWallThreshold - itemBottomY) : 0;
                    
                    // Tie-break back-wall items by feet position (see setDepthAndStore)
                    const wallTieBreak = elevation > 0 ? (itemBottomY - roomTopY) * 0.001 : 0;
                    const objectDepth = objectBottomY + 0.5 + elevation + wallTieBreak;
                    sprite.setDepth(objectDepth);
                    
                    // Store elevation for debugging
                    sprite.elevation = elevation;
                    
                    // Apply rotation if specified
                    if (obj.rotation) {
                        sprite.setRotation(Phaser.Math.DegToRad(obj.rotation));
                    }
                    
                    // Initially hide the object
                    sprite.setVisible(false);
                    
                    // Set up collision for tables
                    if (type === 'table') {
                        // Add physics body to table (static body)
                        gameRef.physics.add.existing(sprite, true);
                        
                        // Wait for the next frame to ensure body is fully initialized
                        gameRef.time.delayedCall(0, () => {
                            if (sprite.body) {
                                // Use direct property assignment (fallback method)
                                sprite.body.immovable = true;
                                
                                // Set custom collision box - bottom quarter of height, inset 10px from sides
                                const tableWidth = sprite.width;
                                const tableHeight = sprite.height;
                                const collisionWidth = tableWidth - 20; // 10px inset on each side
                                const collisionHeight = tableHeight / 4; // Bottom quarter
                                const offsetX = 10; // 10px inset from left
                                const offsetY = tableHeight - collisionHeight; // Bottom quarter
                                
                                sprite.body.setSize(collisionWidth, collisionHeight);
                                sprite.body.setOffset(offsetX, offsetY);
                                
                                console.log(`Set table ${imageName} collision box: ${collisionWidth}x${collisionHeight} at offset (${offsetX}, ${offsetY})`);
                                
                                // Add collision with player
                                const player = window.player;
                                if (player && player.body) {
                                    gameRef.physics.add.collider(player, sprite);
                                    console.log(`Added collision between player and table: ${imageName}`);
                                }
                            }
                        });
                    }
                    
                    // Set up physics for chairs with wheels
                    if (sprite.hasWheels) {
                        // Add physics body to chair (dynamic body for movement)
                        gameRef.physics.add.existing(sprite, false);
                        
                        // Wait for the next frame to ensure body is fully initialized
                        gameRef.time.delayedCall(0, () => {
                            if (sprite.body) {
                                // Set chair as movable
                                sprite.body.immovable = false;
                                sprite.body.setImmovable(false);
                                
                                // Set collision box at base of chair
                                const chairWidth = sprite.width;
                                const chairHeight = sprite.height;
                                const collisionWidth = chairWidth - 10; // 5px inset on each side
                                const collisionHeight = chairHeight / 3; // Bottom third
                                const offsetX = 5; // 5px inset from left
                                const offsetY = chairHeight - collisionHeight; // Bottom third
                                
                                if (sprite.swivelBody) {
                                    const b = sprite.swivelBody;
                                    sprite.body.setSize(b.w, b.h);
                                    sprite.body.setOffset(b.x, b.y);
                                } else {
                                    sprite.body.setSize(collisionWidth, collisionHeight);
                                    sprite.body.setOffset(offsetX, offsetY);
                                }
                                
                                // Set physics properties for bouncing
                                sprite.body.setBounce(0.3, 0.3);
                                sprite.body.setDrag(100, 100);
                                sprite.body.setMaxVelocity(200, 200);
                                
                                
                                // Add collision with player
                                const player = window.player;
                                if (player && player.body) {
                                    // Create collision callback function
                                    const collisionCallback = (player, chair) => {
                                        if (chair.isSwivelChair) {
                                            calculateChairSpinDirection(player, chair);
                                        }
                                    };
                                    
                                    gameRef.physics.add.collider(player, sprite, collisionCallback);
                                }
                                
                                // Store chair reference for collision detection
                                if (!window.chairs) {
                                    window.chairs = [];
                                }
                                window.chairs.push(sprite);
                                
                                // Set up collision with other chairs and items
                                setupChairCollisions(sprite);
                            }
                        });
                    }
                    
                    // Store the object in the room
                    if (!rooms[roomId].objects) {
                        rooms[roomId].objects = {};
                    }
                    rooms[roomId].objects[sprite.objectId] = sprite;
                    
                    // Give default properties to tables (so NPC table collision detection works)
                    if (type === 'table') {
                        const cleanName = imageName.replace(/-.*$/, '').replace(/\d+$/, '');
                        sprite.scenarioData = {
                            name: cleanName,
                            type: 'table',  // Mark explicitly as table type
                            takeable: false,
                            readable: false,
                            observations: describeDecor(cleanName)
                        };
                        console.log(`Applied table properties to ${imageName}`);
                    }
                    
                    // Give default properties to regular items (non-scenario items)
                    if (type === 'item' || type === 'table_item') {
                        // Strip out suffix after first dash and any numbers for cleaner names
                        const cleanName = imageName.replace(/-.*$/, '').replace(/\d+$/, '');
                        sprite.scenarioData = {
                            name: cleanName,
                            type: cleanName,
                            takeable: false,
                            readable: false,
                            observations: describeDecor(cleanName)
                        };
                        console.log(`Applied default properties to ${type} ${imageName} -> ${cleanName}`);
                    }
                    
                    // Make swivel chairs interactable but don't highlight them
                    if (sprite.isSwivelChair) {
                        sprite.interactable = true;
                        sprite.noInteractionHighlight = true;
                        console.log(`Marked swivel chair ${sprite.objectId} as interactable (no highlight)`);
                    }
                    
                    // Note: Click handling is now done by the main scene's pointerdown handler
                    // which checks for all objects at the clicked position
                    
                    console.log(`Created Tiled object: ${sprite.objectId} at (${sprite.x}, ${sprite.y})`);
                    
                    return { sprite, type };
                } else {
                    console.log(`No image data found for GID ${obj.gid} in objects tileset`);
                }
            } else if (tileset && tileset.name !== 'objects' && !tileset.name.includes('objects/')) {
                // Handle other tilesets (like tables) normally
                console.log(`Skipping non-objects tileset: ${tileset.name}`);
            } else {
                console.log(`No tileset found for GID ${obj.gid}`);
            }
            
            return null;
        }
        
        // Helper function to find the closest table to an item
        function findClosestTable(itemSprite, tableObjects) {
            const itemLeft   = itemSprite.x;
            const itemRight  = itemSprite.x + itemSprite.width;
            const itemTop    = itemSprite.y;
            const itemBottom = itemSprite.y + itemSprite.height;

            // Collect all tables whose bounding box overlaps the item
            const overlappingTables = tableObjects.filter(table => {
                const tableLeft   = table.sprite.x;
                const tableRight  = table.sprite.x + table.sprite.width;
                const tableTop    = table.sprite.y;
                const tableBottom = table.sprite.y + table.sprite.height;

                return itemLeft < tableRight && itemRight > tableLeft &&
                       itemTop  < tableBottom && itemBottom > tableTop;
            });

            if (overlappingTables.length > 0) {
                // Among overlapping tables pick the southmost (highest Y value)
                let southmostTable = overlappingTables[0];
                for (const table of overlappingTables) {
                    if (table.sprite.y > southmostTable.sprite.y) {
                        southmostTable = table;
                    }
                }
                console.log(`Found overlapping table for item ${itemSprite.name} (${overlappingTables.length} overlap(s), using southmost)`);
                return southmostTable;
            }

            // Fallback: no overlap — return the closest table by center distance
            let closestTable = null;
            let closestDistance = Infinity;

            tableObjects.forEach(table => {
                const itemCenterX  = itemSprite.x + itemSprite.width  / 2;
                const itemCenterY  = itemSprite.y + itemSprite.height / 2;
                const tableCenterX = table.sprite.x + table.sprite.width  / 2;
                const tableCenterY = table.sprite.y + table.sprite.height / 2;

                const distance = Math.sqrt(
                    Math.pow(itemCenterX - tableCenterX, 2) +
                    Math.pow(itemCenterY - tableCenterY, 2)
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTable = table;
                }
            });

            console.log(`Found closest table for item ${itemSprite.name} at distance ${closestDistance}`);
            return closestTable;
        }

        // Declared here (not after the Object Layer 1 block) so collision rectangles can use it
        const room = rooms[roomId];

        // Handle objects layer (legacy)
        const objectsLayer = map.getObjectLayer('Object Layer 1');
        console.log(`Object layer found for room ${roomId}:`, objectsLayer ? `${objectsLayer.objects.length} objects` : 'No objects layer');
        if (objectsLayer) {
            
            // Handle collision objects
            objectsLayer.objects.forEach(obj => {
                if (obj.name.toLowerCase().includes('collision') || obj.type === 'collision') {
                    console.log(`Creating collision object: ${obj.name} at (${obj.x}, ${obj.y})`);
                    
                    // Create invisible collision body with pixel-perfect coordinates
                    const collisionBody = gameRef.add.rectangle(
                        Math.round(position.x + obj.x + obj.width/2),
                        Math.round(position.y + obj.y + obj.height/2),
                        Math.round(obj.width),
                        Math.round(obj.height)
                    );
                    
                    // Make it invisible but with collision
                    collisionBody.setVisible(false);
                    collisionBody.setAlpha(0);
                    gameRef.physics.add.existing(collisionBody, true);
                    
                    // Add collision with player
                    const player = window.player;
                    if (player && player.body) {
                        gameRef.physics.add.collider(player, collisionBody);
                        console.log(`Added collision object: ${obj.name}`);
                    }
                    
                    // Store collision body in room for cleanup
                    if (!room.collisionBodies) {
                        room.collisionBodies = [];
                    }
                    room.collisionBodies.push(collisionBody);
                }
            });
            
            // Create a map of room objects by type for easy lookup
            const roomObjectsByType = {};
            objectsLayer.objects.forEach(obj => {
                if (!roomObjectsByType[obj.name]) {
                    roomObjectsByType[obj.name] = [];
                }
                roomObjectsByType[obj.name].push(obj);
            });
            
            // Legacy scenario object processing removed - now handled by conditional matching system
        }
        
        // Set up pending wall collision boxes if player is ready
        if (room && room.pendingWallCollisionBoxes && window.player && window.player.body) {
            room.pendingWallCollisionBoxes.forEach(collisionBox => {
                gameRef.physics.add.collider(window.player, collisionBox);
            });
            console.log(`Set up ${room.pendingWallCollisionBoxes.length} pending wall collision boxes for room ${roomId}`);
            // Clear pending collision boxes
            room.pendingWallCollisionBoxes = [];
        }
        
        // Set up collisions between existing chairs and new room objects
        setupExistingChairsWithNewRoom(roomId);
        
        // Initialize pathfinding for NPC patrol routes in this room
        const pfManager = pathfindingManager || window.pathfindingManager;
        if (pfManager && rooms[roomId]) {
            console.log(`🔧 Initializing pathfinding for room ${roomId}...`);
            pfManager.initializeRoomPathfinding(roomId, rooms[roomId], position);
        } else {
            console.warn(`⚠️ Cannot initialize pathfinding: pfManager=${!!pfManager}, room=${!!rooms[roomId]}`);
        }
        
        // ===== NPC SPRITE CREATION =====
        // Create NPC sprites for person-type NPCs in this room
        createNPCSpritesForRoom(roomId, rooms[roomId]);

        window.lightingSystem?.registerRoom(roomId, roomData);
    } catch (error) {
        console.error(`Error creating room ${roomId}:`, error);
        console.error('Error details:', error.stack);
    }
}

export function revealRoom(roomId) {
    // IMPORTANT: revealRoom() makes graphics VISIBLE but does NOT mark as DISCOVERED
    // 
    // "Revealed" = graphics are loaded and visible (for rendering/performance)
    // "Discovered" = player has actually ENTERED the room (for gameplay/events)
    //
    // This separation allows us to:
    // 1. Preload/reveal rooms for performance without marking them as "visited"
    // 2. Trigger "room_discovered" events when player first ENTERS a room
    // 3. Keep "first visit" detection accurate for NPC reactions
    //
    // Rooms are marked as "discovered" in the door transition code, AFTER
    // the room_discovered event is emitted.
    
    if (rooms[roomId]) {
        const room = rooms[roomId];
        
        // Reveal all layers
        Object.values(room.layers).forEach(layer => {
            if (layer && layer.setVisible) {
                layer.setVisible(true);
                layer.setAlpha(1);
            }
        });
        
        // Show door sprites for this room
        if (room.doorSprites) {
            room.doorSprites.forEach(doorSprite => {
                doorSprite.setVisible(true);
                doorSprite.setAlpha(1);
                console.log(`Made door sprite visible for room ${roomId}`);
            });
        }
        
        // Show all objects
        if (room.objects) {
            console.log(`Revealing ${Object.keys(room.objects).length} objects in room ${roomId}`);
            Object.values(room.objects).forEach(obj => {
                if (obj && obj.setVisible && obj.active) { // Only show active objects
                    obj.setVisible(true);
                    obj.alpha = obj.active ? (obj.originalAlpha || 1) : 0.3;
                    console.log(`Made object visible: ${obj.objectId} at (${obj.x}, ${obj.y})`);
                }
            });
        } else {
            console.log(`No objects found in room ${roomId}`);
        }
        
        // NOTE: We do NOT add to discoveredRooms here!
        // Rooms are only marked as "discovered" when the player actually enters them
        // via door transition. This allows revealRoom() to be used for preloading/visibility
        // without affecting the "first visit" detection for NPC events.
    }
    currentRoom = roomId;
}

export function updatePlayerRoom() {
    const player = window.player;
    if (!player) {
        return;
    }

    const previousRoom = currentPlayerRoom;

    // Detect room by player's feet position — since each tile belongs to exactly one room,
    // the room whose floor area contains the player's feet is the current room.
    // The top 2 tile rows of each room are wall tiles, so floor starts at tile row 3.
    const playerBody = player.body;
    const playerFeetY = playerBody.y + playerBody.height;
    const playerCenterX = playerBody.x + playerBody.width / 2;
    const wallInset = TILE_SIZE * 2;

    let detectedRoom = null;
    for (const [roomId, room] of Object.entries(rooms)) {
        if (!room.map) continue;
        const floorTop = room.position.y + wallInset;
        const floorBottom = room.position.y + room.map.heightInPixels;
        const roomLeft = room.position.x;
        const roomRight = room.position.x + room.map.widthInPixels;

        if (playerFeetY >= floorTop && playerFeetY <= floorBottom &&
            playerCenterX >= roomLeft && playerCenterX <= roomRight) {
            detectedRoom = roomId;
            break;
        }
    }

    if (detectedRoom === currentPlayerRoom) {
        return;
    }

    currentPlayerRoom = detectedRoom;
    window.currentPlayerRoom = detectedRoom;

    ensureAmbientListenersRegistered();
    recalculateAmbientVolume(detectedRoom);

    if (!detectedRoom) {
        return; // Player is in a wall/gap area — keep previous for events
    }

    if (!discoveredRooms.has(detectedRoom)) {
        revealRoom(detectedRoom);
    }

    if (window.eventDispatcher) {
        const isFirstVisit = !discoveredRooms.has(detectedRoom);
        window.eventDispatcher.emit('room_entered', {
            roomId: detectedRoom,
            previousRoom: previousRoom,
            firstVisit: isFirstVisit
        });
        window.eventDispatcher.emit(`room_entered:${detectedRoom}`, {
            roomId: detectedRoom,
            previousRoom: previousRoom,
            firstVisit: isFirstVisit
        });
        if (isFirstVisit) {
            window.eventDispatcher.emit('room_discovered', {
                roomId: detectedRoom,
                previousRoom: previousRoom
            });
            discoveredRooms.add(detectedRoom);
            window.discoveredRooms = discoveredRooms;
        }
        if (previousRoom) {
            window.eventDispatcher.emit('room_exited', {
                roomId: previousRoom,
                nextRoom: detectedRoom
            });
        }
    }
}

// --- Ambient sound: event-driven zone model ---
// Zone 0 (source room): 1.0 — always, regardless of door state
// Zone 1 (directly adjacent room): 0.125 if connecting door is open, 0.01 if closed (barely audible)
// Zone 2+: 0 (silent)

let ambientListenersRegistered = false;

function ensureAmbientListenersRegistered() {
    if (ambientListenersRegistered || !window.eventDispatcher) return;
    ambientListenersRegistered = true;
    window.eventDispatcher.on('door_opened', ({ roomId, connectedRoom }) => {
        if (currentPlayerRoom === roomId || currentPlayerRoom === connectedRoom) {
            recalculateAmbientVolume(currentPlayerRoom);
        }
    });
}

function recalculateAmbientVolume(playerRoom) {
    const sm = window.soundManager;
    if (!sm || !window.gameScenario?.rooms) return;

    for (const [roomId, roomData] of Object.entries(window.gameScenario.rooms)) {
        const ambientSound = roomData.ambientSound;
        if (!ambientSound) continue;

        if (playerRoom === roomId) {
            sm.fadeAmbientTo(ambientSound, roomData.ambientVolume ?? 1.0);
            return;
        }

        // Check if playerRoom is directly adjacent via any door
        let isAdjacent = false;
        let isDoorOpen = false;
        for (const room of Object.values(rooms)) {
            if (!room.doorSprites) continue;
            for (const door of room.doorSprites) {
                const props = door.doorProperties;
                if (!props) continue;
                const connects =
                    (props.roomId === playerRoom && props.connectedRoom === roomId) ||
                    (props.roomId === roomId && props.connectedRoom === playerRoom);
                if (connects) {
                    isAdjacent = true;
                    if (props.open) isDoorOpen = true;
                }
            }
        }

        if (isAdjacent) {
            sm.fadeAmbientTo(ambientSound, isDoorOpen ? 0.125 : 0.01);
            return;
        }
    }

    // Not in or adjacent to any ambient room — stop
    if (sm.currentAmbient) sm.fadeAmbientTo(sm.currentAmbient, 0);
}


// Door collisions are now handled by sprite-based system
export function setupDoorCollisions() {
    console.log('Door collisions are now handled by sprite-based system');
}

/**
 * Create NPC sprites for all person-type NPCs in a room
 * @param {string} roomId - Room ID
 * @param {Object} roomData - Room data object
 */
function createNPCSpritesForRoom(roomId, roomData) {
    if (!window.npcManager) {
        console.warn('⚠️ NPCManager not available, skipping NPC sprite creation');
        return;
    }
    
    if (!gameRef) {
        console.warn('⚠️ Game instance not available, skipping NPC sprite creation');
        return;
    }
    
    // Get all NPCs that should appear in this room
    const npcsInRoom = getNPCsForRoom(roomId);
    
    if (npcsInRoom.length === 0) {
        return; // No NPCs for this room
    }
    
    console.log(`Creating ${npcsInRoom.length} NPC sprites for room ${roomId}`);
    
    // Initialize NPC sprites array if needed
    if (!roomData.npcSprites) {
        roomData.npcSprites = [];
    }
    
    npcsInRoom.forEach(npc => {
        // Only create sprites for person-type NPCs
        if (npc.npcType === 'person' || npc.npcType === 'both') {
            try {
                const sprite = NPCSpriteManager.createNPCSprite(gameRef, npc, roomData);
                
                if (sprite) {
                    // Store sprite reference
                    roomData.npcSprites.push(sprite);
                    
                    // Set up collision with player
                    if (window.player) {
                        NPCSpriteManager.createNPCCollision(gameRef, sprite, window.player);
                    }
                    
                    // Set up wall and chair collisions (same as player gets)
                    NPCSpriteManager.setupNPCEnvironmentCollisions(gameRef, sprite, roomId);

                    // Set up NPC-to-NPC collisions with all other NPCs in this room
                    NPCSpriteManager.setupNPCToNPCCollisions(gameRef, sprite, roomId, roomData.npcSprites);

                    // Register behavior for all sprite-based NPCs
                    // Even NPCs without explicit behavior get registered to enable
                    // home return behavior when pushed by player
                    if (window.npcBehaviorManager) {
                        window.npcBehaviorManager.registerBehavior(
                            npc.id,
                            sprite,
                            npc.behavior || {} // Use empty config if no behavior specified
                        );
                        if (npc.behavior) {
                            console.log(`🤖 Behavior registered for ${npc.id}`);
                        } else {
                            console.log(`🏠 Default behavior (home return) registered for ${npc.id}`);
                        }
                    }

                    console.log(`✅ NPC sprite created: ${npc.id} in room ${roomId}`);
                }
            } catch (error) {
                console.error(`❌ Error creating NPC sprite for ${npc.id}:`, error);
            }
        }
    });
    
    // Auto-enable LOS visualization if any NPC has los.visualize = true
    if (window.npcManager && gameRef) {
        console.log(`👁️ Checking ${npcsInRoom.length} NPCs for LOS visualization requests...`);
        npcsInRoom.forEach(npc => {
            console.log(`   NPC "${npc.id}": los=${!!npc.los}, visualize=${npc.los?.visualize}`);
        });
        
        const hasVisualNPC = npcsInRoom.some(npc => npc.los?.visualize === true);
        console.log(`👁️ hasVisualNPC: ${hasVisualNPC}`);
        
        if (hasVisualNPC) {
            console.log(`👁️ Auto-enabling LOS visualization for room ${roomId}`);
            console.log(`   npcManager: ${!!window.npcManager}`);
            console.log(`   gameRef: ${!!gameRef}`);
            
            // Get the current scene instance - need to get it from the scene manager
            // gameRef.scene is the SceneManager, we need gameRef.scene.getScene() to get the actual scene
            let currentScene = null;
            if (gameRef && gameRef.scene && typeof gameRef.scene.getScene === 'function') {
                // Get the running scene from the scene manager
                currentScene = gameRef.scene.getScene('default') || 
                               gameRef.scene.scenes?.[0];
            }
            // Same typeof guard as the branch above: window.game is not always a
            // Phaser.Game. On a Scene, .scene is a ScenePlugin, which has get()
            // and no getScene() -- calling it threw TypeError during room
            // creation. Fall back through both shapes rather than assuming.
            if (!currentScene && window.game?.scene) {
                const mgr = window.game.scene;
                if (typeof mgr.getScene === 'function') {
                    currentScene = mgr.getScene('default');
                } else if (typeof mgr.get === 'function') {
                    currentScene = mgr.get('default');
                }
                currentScene = currentScene || mgr.scenes?.[0];
            }
            
            console.log(`   currentScene: ${!!currentScene}, key: ${currentScene?.key}, isScene: ${currentScene?.add ? 'yes' : 'no'}`);
            
            if (currentScene && typeof currentScene.add?.graphics === 'function') {
                window.npcManager.setLOSVisualization(true, currentScene, false);
            } else {
                console.warn(`⚠️ Cannot get valid Phaser scene for LOS visualization`, {
                    currentScene: !!currentScene,
                    hasAddMethod: !!currentScene?.add,
                    hasGraphicsMethod: typeof currentScene?.add?.graphics
                });
            }
        } else {
            console.log(`👁️ No NPCs requesting LOS visualization in room ${roomId}`);
        }
    } else {
        console.log(`👁️ Cannot auto-enable LOS: npcManager=${!!window.npcManager}, gameRef=${!!gameRef}`);
    }
}

/**
 * Get all NPCs configured to appear in a specific room
 * @param {string} roomId - Room ID to check
 * @returns {Array} Array of NPC objects for this room
 */
function getNPCsForRoom(roomId) {
    if (!window.npcManager) {
        return [];
    }
    
    const allNPCs = Array.from(window.npcManager.npcs.values());
    return allNPCs.filter(npc => npc.roomId === roomId);
}

/**
 * Destroy NPC sprites when room is unloaded
 * @param {string} roomId - Room ID being unloaded
 */
export function unloadNPCSprites(roomId) {
    if (!rooms[roomId]) return;
    
    const roomData = rooms[roomId];
    
    if (roomData.npcSprites && Array.isArray(roomData.npcSprites)) {
        console.log(`Destroying ${roomData.npcSprites.length} NPC sprites for room ${roomId}`);
        
        roomData.npcSprites.forEach(sprite => {
            if (sprite && !sprite.destroyed) {
                NPCSpriteManager.destroyNPCSprite(sprite);
            }
        });
        
        roomData.npcSprites = [];
    }
}

// Export for global access
window.initializeRooms = initializeRooms;
window.setupDoorCollisions = setupDoorCollisions;
window.loadRoom = loadRoom;
window.unloadNPCSprites = unloadNPCSprites;
window.relocateNPCSprite = NPCSpriteManager.relocateNPCSprite;

// Export functions for module imports
export { updateDoorSpritesVisibility };
