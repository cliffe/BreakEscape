/**
 * DOOR SYSTEM
 * ===========
 *
 * Handles door sprites, interactions, transitions, and visibility management.
 * Separated from rooms.js for better modularity and maintainability.
 *
 * NEW: Includes comprehensive door placement with asymmetric alignment fix
 * for variable room sizes using the grid unit system.
 */

import {
    TILE_SIZE,
    GRID_UNIT_WIDTH_PX,
    GRID_UNIT_HEIGHT_PX,
    DOOR_INTERACTION_RANGE
} from '../utils/constants.js';
import { handleUnlock, notifyServerUnlock } from './unlock-system.js';

let gameRef = null;
let rooms = null;

// Global toggle for disabling locks during testing
window.DISABLE_LOCKS = false; // Set to true in console to bypass all lock checks (doors and items)

// Console helper functions for testing
window.toggleLocks = function() {
    window.DISABLE_LOCKS = !window.DISABLE_LOCKS;
    console.log(`Locks ${window.DISABLE_LOCKS ? 'DISABLED' : 'ENABLED'} for testing (affects doors and items)`);
    return window.DISABLE_LOCKS;
};

window.disableLocks = function() {
    window.DISABLE_LOCKS = true;
    console.log('Locks DISABLED for testing - all doors and items will open/unlock without minigames');
};

window.enableLocks = function() {
    window.DISABLE_LOCKS = false;
    console.log('Locks ENABLED - doors and items will require proper unlocking');
};

// Door transition cooldown system
let lastDoorTransitionTime = 0;
const DOOR_TRANSITION_COOLDOWN = 1000; // 1 second cooldown between transitions
let lastDoorTransition = null; // Track the last door transition to prevent repeats

// ============================================================================
// DOOR PLACEMENT FUNCTIONS WITH ASYMMETRIC ALIGNMENT FIX
// ============================================================================

/**
 * Helper to convert world position to grid coordinates
 */
function worldToGrid(worldX, worldY) {
    return {
        gridX: Math.floor(worldX / GRID_UNIT_WIDTH_PX),
        gridY: Math.floor(worldY / GRID_UNIT_HEIGHT_PX)
    };
}

/**
 * Place a single north door with asymmetric alignment fix
 * CRITICAL: Handles negative modulo correctly and aligns with multi-door rooms
 */
function placeNorthDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom, gameScenario, allPositions, allDimensions) {
    const roomWidthPx = roomDimensions.widthPx;

    // CRITICAL: Check if connected room has multiple connections in opposite direction
    const connectedRoomData = gameScenario.rooms[connectedRoom];
    const connectedSouthConnections = connectedRoomData?.connections?.south;

    if (Array.isArray(connectedSouthConnections) && connectedSouthConnections.length > 1) {
        // Connected room has multiple south doors - align with the correct one
        const indexInArray = connectedSouthConnections.indexOf(roomId);

        if (indexInArray >= 0) {
            // Calculate where the connected room's door is positioned
            const connectedPos = allPositions[connectedRoom];
            const connectedDim = allDimensions[connectedRoom];

            // Use same spacing logic as placeNorthDoorsMultiple
            const edgeInset = TILE_SIZE * 1.5;
            const availableWidth = connectedDim.widthPx - (edgeInset * 2);
            const doorCount = connectedSouthConnections.length;
            const spacing = availableWidth / (doorCount - 1);

            const alignedDoorX = connectedPos.x + edgeInset + (spacing * indexInArray);
            const doorY = roomPosition.y + TILE_SIZE;

            return { x: alignedDoorX, y: doorY, connectedRoom };
        }
    }

    // Default: Deterministic left/right placement based on the SHARED WALL y-coordinate.
    // For a north door the shared wall IS roomPosition.y (the room's top edge), so
    // this is already anchored correctly. The south-door counterpart uses
    // roomPosition.y + stackingHeightPx for the same reason.
    // CRITICAL FIX: Handle negative grid coordinates correctly
    // JavaScript modulo with negatives: -5 % 2 = -1 (not 1)
    const gridCoords = worldToGrid(roomPosition.x, roomPosition.y);
    const sum = gridCoords.gridX + gridCoords.gridY;
    const useRightSide = ((sum % 2) + 2) % 2 === 1;

    let doorX;
    if (useRightSide) {
        // Northeast corner
        doorX = roomPosition.x + roomWidthPx - (TILE_SIZE * 1.5);
    } else {
        // Northwest corner
        doorX = roomPosition.x + (TILE_SIZE * 1.5);
    }

    const doorY = roomPosition.y + TILE_SIZE;
    return { x: doorX, y: doorY, connectedRoom };
}

/**
 * Place multiple north doors with even spacing
 */
function placeNorthDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms) {
    const roomWidthPx = roomDimensions.widthPx;
    const doorPositions = [];

    // Available width after edge insets
    const edgeInset = TILE_SIZE * 1.5;
    const availableWidth = roomWidthPx - (edgeInset * 2);

    // Space between doors
    const doorCount = connectedRooms.length;
    const doorSpacing = availableWidth / (doorCount - 1);

    connectedRooms.forEach((connectedRoom, index) => {
        const doorX = roomPosition.x + edgeInset + (doorSpacing * index);
        const doorY = roomPosition.y + TILE_SIZE;

        doorPositions.push({
            x: doorX,
            y: doorY,
            connectedRoom
        });
    });

    return doorPositions;
}

/**
 * Place a single south door with asymmetric alignment fix
 */
function placeSouthDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom, gameScenario, allPositions, allDimensions) {
    const roomWidthPx = roomDimensions.widthPx;
    const roomHeightPx = roomDimensions.heightPx;

    // CRITICAL: Check if connected room has multiple north connections
    const connectedRoomData = gameScenario.rooms[connectedRoom];
    const connectedNorthConnections = connectedRoomData?.connections?.north;

    if (Array.isArray(connectedNorthConnections) && connectedNorthConnections.length > 1) {
        // Connected room has multiple north doors - align with the correct one
        const indexInArray = connectedNorthConnections.indexOf(roomId);

        if (indexInArray >= 0) {
            const connectedPos = allPositions[connectedRoom];
            const connectedDim = allDimensions[connectedRoom];

            const edgeInset = TILE_SIZE * 1.5;
            const availableWidth = connectedDim.widthPx - (edgeInset * 2);
            const doorCount = connectedNorthConnections.length;
            const spacing = availableWidth / (doorCount - 1);

            const alignedDoorX = connectedPos.x + edgeInset + (spacing * indexInArray);
            const doorY = roomPosition.y + roomHeightPx - TILE_SIZE;

            return { x: alignedDoorX, y: doorY, connectedRoom };
        }
    }

    // Default: Deterministic placement based on the SHARED WALL y-coordinate.
    // Using the room origin would flip parity for rooms with different stacking heights
    // (e.g. a 2-GU-tall south room + 1-GU-tall north room), so we anchor to the wall
    // that both rooms share — the bottom of this room / top of the room to the south.
    const sharedWallY = roomPosition.y + roomDimensions.stackingHeightPx;
    const gridCoords = worldToGrid(roomPosition.x, sharedWallY);
    const sum = gridCoords.gridX + gridCoords.gridY;
    const useRightSide = ((sum % 2) + 2) % 2 === 1;

    let doorX;
    if (useRightSide) {
        doorX = roomPosition.x + roomWidthPx - (TILE_SIZE * 1.5);
    } else {
        doorX = roomPosition.x + (TILE_SIZE * 1.5);
    }

    const doorY = roomPosition.y + roomHeightPx - TILE_SIZE;
    return { x: doorX, y: doorY, connectedRoom };
}

/**
 * Place multiple south doors with even spacing
 */
function placeSouthDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms) {
    const roomWidthPx = roomDimensions.widthPx;
    const roomHeightPx = roomDimensions.heightPx;
    const doorPositions = [];

    const edgeInset = TILE_SIZE * 1.5;
    const availableWidth = roomWidthPx - (edgeInset * 2);
    const doorCount = connectedRooms.length;
    const doorSpacing = availableWidth / (doorCount - 1);

    connectedRooms.forEach((connectedRoom, index) => {
        const doorX = roomPosition.x + edgeInset + (doorSpacing * index);
        const doorY = roomPosition.y + roomHeightPx - TILE_SIZE;

        doorPositions.push({
            x: doorX,
            y: doorY,
            connectedRoom
        });
    });

    return doorPositions;
}

/**
 * Place a single east door
 */
function placeEastDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom) {
    const roomWidthPx = roomDimensions.widthPx;

    // Use center-based positioning like N/S doors for consistency
    // Position 0.5 tiles from right edge + 0.5 tiles into room for visual positioning
    const doorX = roomPosition.x + roomWidthPx - (TILE_SIZE / 2); // 0.5 tiles from right edge (towards wall)
    const doorY = roomPosition.y + (TILE_SIZE * 2.5); // 2.5 tiles from top corner (center of door)

    return { x: doorX, y: doorY, connectedRoom };
}

/**
 * Place multiple east doors with vertical spacing
 */
function placeEastDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms) {
    const roomWidthPx = roomDimensions.widthPx;
    const roomHeightPx = roomDimensions.heightPx;
    const doorPositions = [];

    // Use center-based positioning like N/S doors for consistency
    // Position 0.5 tiles from right edge for visual display (slightly into room from wall)
    const doorX = roomPosition.x + roomWidthPx - (TILE_SIZE / 2); // 0.5 tiles from right edge (towards wall)

    if (connectedRooms.length === 1) {
        const doorY = roomPosition.y + (TILE_SIZE * 2.5);
        doorPositions.push({ x: doorX, y: doorY, connectedRoom: connectedRooms[0] });
    } else {
        // Multiple doors - space vertically
        const topY = roomPosition.y + (TILE_SIZE * 2.5);
        const bottomY = roomPosition.y + roomHeightPx - (TILE_SIZE * 2.5);
        const spacing = (bottomY - topY) / (connectedRooms.length - 1);

        connectedRooms.forEach((connectedRoom, index) => {
            const doorY = topY + (spacing * index);
            doorPositions.push({ x: doorX, y: doorY, connectedRoom });
        });
    }

    return doorPositions;
}

/**
 * Place a single west door
 */
function placeWestDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom) {
    // Use center-based positioning like N/S doors for consistency
    const doorX = roomPosition.x + (TILE_SIZE / 2); // 0.5 tiles from left edge (towards wall)
    const doorY = roomPosition.y + (TILE_SIZE * 2.5); // 2.5 tiles from top corner (center of door)

    return { x: doorX, y: doorY, connectedRoom };
}

/**
 * Place multiple west doors with vertical spacing
 */
function placeWestDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms) {
    const roomHeightPx = roomDimensions.heightPx;
    const doorPositions = [];

    // Use center-based positioning like N/S doors for consistency
    const doorX = roomPosition.x + (TILE_SIZE / 2); // 0.5 tiles from left edge (towards wall)

    if (connectedRooms.length === 1) {
        const doorY = roomPosition.y + (TILE_SIZE * 2.5);
        doorPositions.push({ x: doorX, y: doorY, connectedRoom: connectedRooms[0] });
    } else {
        // Multiple doors - space vertically
        const topY = roomPosition.y + (TILE_SIZE * 2.5);
        const bottomY = roomPosition.y + roomHeightPx - (TILE_SIZE * 2.5);
        const spacing = (bottomY - topY) / (connectedRooms.length - 1);

        connectedRooms.forEach((connectedRoom, index) => {
            const doorY = topY + (spacing * index);
            doorPositions.push({ x: doorX, y: doorY, connectedRoom });
        });
    }

    return doorPositions;
}

/**
 * Calculate all door positions for a room
 * This is the main entry point for door placement
 * EXPORTED for use by collision.js to ensure wall removal matches door placement
 */
export function calculateDoorPositionsForRoom(roomId, roomPosition, roomDimensions, connections, allPositions, allDimensions, gameScenario) {
    const doorPositions = [];

    ['north', 'south', 'east', 'west'].forEach(direction => {
        const connected = connections[direction];
        if (!connected) return;

        const connectedRooms = Array.isArray(connected) ? connected : [connected];

        let positions;
        if (connectedRooms.length === 1) {
            // Single connection
            const connectedRoom = connectedRooms[0];
            let doorPos;

            switch (direction) {
                case 'north':
                    doorPos = placeNorthDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom, gameScenario, allPositions, allDimensions);
                    break;
                case 'south':
                    doorPos = placeSouthDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom, gameScenario, allPositions, allDimensions);
                    break;
                case 'east':
                    doorPos = placeEastDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom);
                    break;
                case 'west':
                    doorPos = placeWestDoorSingle(roomId, roomPosition, roomDimensions, connectedRoom);
                    break;
            }

            if (doorPos) {
                doorPositions.push({ ...doorPos, direction });
            }
        } else {
            // Multiple connections
            switch (direction) {
                case 'north':
                    positions = placeNorthDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms);
                    break;
                case 'south':
                    positions = placeSouthDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms);
                    break;
                case 'east':
                    positions = placeEastDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms);
                    break;
                case 'west':
                    positions = placeWestDoorsMultiple(roomId, roomPosition, roomDimensions, connectedRooms);
                    break;
            }

            if (positions) {
                positions.forEach(pos => doorPositions.push({ ...pos, direction }));
            }
        }
    });

    return doorPositions;
}

// Initialize door system
export function initializeDoors(gameInstance, roomsRef) {
    gameRef = gameInstance;
    rooms = roomsRef;
}

// Function to create door sprites based on gameScenario connections
export function createDoorSpritesForRoom(roomId, position) {
    const gameScenario = window.gameScenario;
    const roomData = gameScenario.rooms[roomId];
    if (!roomData || !roomData.connections) {
        console.log(`No connections found for room ${roomId}`);
        return [];
    }

    const doorSprites = [];

    // Get room dimensions from global cache (set by calculateRoomPositions)
    const roomDimensions = window.roomDimensions?.[roomId];
    if (!roomDimensions) {
        console.error(`Room dimensions not found for ${roomId}. Did calculateRoomPositions run?`);
        return [];
    }

    console.log(`Creating doors for ${roomId} at (${position.x}, ${position.y}), dimensions: ${roomDimensions.widthTiles}×${roomDimensions.heightTiles} tiles`);

    // Get all positions and dimensions for door alignment
    const allPositions = window.roomPositions || {};
    const allDimensions = window.roomDimensions || {};

    // Calculate door positions using the new system
    const doorPositions = calculateDoorPositionsForRoom(
        roomId,
        position,
        roomDimensions,
        roomData.connections,
        allPositions,
        allDimensions,
        gameScenario
    );

    console.log(`Calculated ${doorPositions.length} door positions for ${roomId}`);

    // Create door sprites for each calculated position
    doorPositions.forEach(doorInfo => {
        const { x: doorX, y: doorY, direction, connectedRoom } = doorInfo;

        // Set door size and texture based on direction
        let doorWidth, doorHeight, doorTexture, flipX, isSideDoor;

        if (direction === 'north' || direction === 'south') {
            // North/South doors: 1 tile wide, 2 tiles tall
            doorWidth = TILE_SIZE;
            doorHeight = TILE_SIZE * 2;
            doorTexture = 'door_32';
            flipX = false;
            isSideDoor = false;
        } else {
            // East/West doors: 1 tile wide, 1 tile tall (single tile per room)
            doorWidth = TILE_SIZE;
            doorHeight = TILE_SIZE;
            doorTexture = 'door_side_sheet_32';
            // East-facing doors (right room) should be flipped horizontally
            // West-facing doors use the default orientation
            flipX = (direction === 'east');
            isSideDoor = true;
        }

        console.log(`Creating door sprite at (${doorX}, ${doorY}) for ${roomId} -> ${connectedRoom} (${direction})`);

        // Create door sprite with appropriate texture
        let doorSprite;
        try {
            doorSprite = gameRef.add.sprite(doorX, doorY, doorTexture);
            // Set the initial frame (frame 0 = closed)
            doorSprite.setFrame(0);
            // Apply horizontal flip for west-facing doors
            if (flipX) {
                doorSprite.setFlipX(true);
            }
        } catch (error) {
            console.warn(`Failed to create door sprite with '${doorTexture}' texture, creating colored rectangle instead:`, error);
            // Create a colored rectangle as fallback
            const graphics = gameRef.add.graphics();
            graphics.fillStyle(0xff0000, 1); // Red color
            if (direction === 'north' || direction === 'south') {
                graphics.fillRect(-TILE_SIZE/2, -TILE_SIZE, TILE_SIZE, TILE_SIZE * 2);
            } else {
                graphics.fillRect(-TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            }
            graphics.setPosition(doorX, doorY);
            doorSprite = graphics;
        }
        doorSprite.setOrigin(0.5, 0.5);
        const doorBottomY = doorY + doorHeight / 2;
        // E/W side doors sit flush in the wall and should always render behind the player,
        // so pin them to the wall-layer depth (roomWorldY + 0.2) — identical to how the
        // surrounding wall tiles are sorted.  N/S doors use their bottom-Y so the arch
        // can render in front of the player when they walk under it.
        const roomWallDepth = position.y + TILE_SIZE * 2 + 0.2;
        doorSprite.setDepth(isSideDoor ? roomWallDepth : doorBottomY + 0.45);
        doorSprite.setAlpha(1); // Visible by default
        doorSprite.setVisible(true); // Ensure visibility

        // Get lock properties from either the door object or the destination room
        // First check if this door has explicit lock properties in the scenario
        const doorDefinition = roomData.doors?.find(d =>
            d.connectedRoom === connectedRoom && d.direction === direction
        );

        // Lock properties can come from the door definition or the connected room
        const lockProps = doorDefinition || {};
        const connectedRoomData = gameScenario.rooms[connectedRoom];

        // Check for both keyPins (camelCase) and key_pins (snake_case) in the room data
        const keyPinsArray = lockProps.keyPins || lockProps.key_pins ||
                             connectedRoomData?.keyPins || connectedRoomData?.key_pins;

        // DEBUG: Log what we're finding
        if (connectedRoomData?.locked) {
            console.log(`🔍 Door keyPins lookup for ${connectedRoom}:`, {
                connectedRoomData_keyPins: connectedRoomData?.keyPins,
                connectedRoomData_key_pins: connectedRoomData?.key_pins,
                finalKeyPinsArray: keyPinsArray,
                locked: connectedRoomData?.locked,
                lockType: connectedRoomData?.lockType,
                requires: connectedRoomData?.requires
            });
        }

        // Set up door properties
        doorSprite.doorProperties = {
            roomId: roomId,
            connectedRoom: connectedRoom,
            direction: direction,
            worldX: doorX,
            worldY: doorY,
            open: false,
            locked: lockProps.locked !== undefined ? lockProps.locked : (connectedRoomData?.locked || false),
            lockType: lockProps.lockType || connectedRoomData?.lockType || null,
            requires: lockProps.requires || connectedRoomData?.requires || null,
            keyPins: keyPinsArray,  // Include keyPins from scenario (supports both cases)
            difficulty: lockProps.difficulty || connectedRoomData?.difficulty,  // Include difficulty from scenario
            isSideDoor: isSideDoor,  // Track if this is a side (E/W) door for animation purposes
            door_sign: connectedRoomData?.door_sign || null,
            biometricMatchThreshold: lockProps.biometricMatchThreshold ?? connectedRoomData?.biometricMatchThreshold ?? null
        };

        // Debug door properties
        console.log(`🚪 Door properties set for ${roomId} -> ${connectedRoom}:`, {
            locked: doorSprite.doorProperties.locked,
            lockType: doorSprite.doorProperties.lockType,
            requires: doorSprite.doorProperties.requires,
            keyPins: doorSprite.doorProperties.keyPins,
            difficulty: doorSprite.doorProperties.difficulty
        });

        // Set up door info for transition detection
        doorSprite.doorInfo = {
            roomId: roomId,
            connectedRoom: connectedRoom,
            direction: direction
        };

        // Set up collision
        gameRef.physics.add.existing(doorSprite);
        if (!isSideDoor) {
            // North/South doors: thin collision strip at bottom of sprite, matching wall profile
            doorSprite.body.setSize(doorWidth, 8);
            doorSprite.body.setOffset(0, doorHeight - 8);
        } else {
            doorSprite.body.setSize(doorWidth, doorHeight);
        }
        doorSprite.body.setImmovable(true);

        // Add collision with player
        if (window.player && window.player.body) {
            gameRef.physics.add.collider(window.player, doorSprite);
        }

        // Set up interaction zone
        const zone = gameRef.add.zone(doorX, doorY, doorWidth, doorHeight);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => handleDoorInteraction(doorSprite));

        doorSprite.interactionZone = zone;
        doorSprites.push(doorSprite);

        // If door starts unlocked, mark it as walkable in pathfinding
        if (!doorSprite.doorProperties.locked && window.pathfindingManager) {
            window.pathfindingManager.markDoorWalkable(
                roomId,
                doorSprite.doorProperties.worldX,
                doorSprite.doorProperties.worldY,
                doorSprite.doorProperties.direction
            );
        }

        console.log(`Created door sprite for ${roomId} -> ${connectedRoom} (${direction}) at (${doorX}, ${doorY})`);
    });

    console.log(`Created ${doorSprites.length} door sprites for room ${roomId}`);

    return doorSprites;
}

// Function to handle door interactions
async function handleDoorInteraction(doorSprite) {
    const player = window.player;
    if (!player) return;

    const distance = Phaser.Math.Distance.Between(
        player.x, player.y,
        doorSprite.x, doorSprite.y
    );

    if (distance > DOOR_INTERACTION_RANGE) {
        console.log('Door too far to interact');
        return;
    }

    const props = doorSprite.doorProperties;
    console.log(`Interacting with door: ${props.roomId} -> ${props.connectedRoom}`);

    // Check if locks are disabled for testing
    if (window.DISABLE_LOCKS) {
        console.log('LOCKS DISABLED FOR TESTING - Opening door directly');
        openDoor(doorSprite);
        return;
    }

    // SECURITY: Always use server-side validation
    // Client cannot be trusted to determine lock state
    // The server will check its scenario data and validate accordingly
    console.log('Checking door access with server...');
    handleUnlock(doorSprite, 'door');
}

// Function to unlock a door (called after successful unlock)
function unlockDoor(doorSprite, roomData) {
    const props = doorSprite.doorProperties;
    console.log(`Unlocking door: ${props.roomId} -> ${props.connectedRoom}`);

    // Mark door as unlocked
    props.locked = false;

    // If roomData was provided from server unlock response, cache it
    if (roomData && window.roomDataCache) {
        console.log(`📦 Caching room data for ${props.connectedRoom} from unlock response`);
        window.roomDataCache.set(props.connectedRoom, roomData);
    }

    // TODO: Implement unlock animation/effect

    // Open the door
    openDoor(doorSprite);
}

// Make unlockDoor globally available for NPC unlock handlers
window.unlockDoor = unlockDoor;

// Function to open a door
function openDoor(doorSprite) {
    const props = doorSprite.doorProperties;
    console.log(`Opening door: ${props.roomId} -> ${props.connectedRoom}`);
    
    // Wait for game scene to be ready before proceeding
    // This prevents crashes when called immediately after minigame cleanup
    const finishOpeningDoor = () => {
        // Disable the door's physics body immediately so LOS checks stop seeing it
        // right away, even before the sprite is destroyed asynchronously below.
        if (doorSprite.body) doorSprite.body.enable = false;

        // East/West (side) doors use a teleport transition and sit inside the shared
        // wall geometry.  Carve a walkable corridor through the grid right away so
        // the player can path towards the door.  The corridor is re-applied
        // automatically after every future rebuildWorldGrid call.
        if (props.isSideDoor && window.pathfindingManager) {
            window.pathfindingManager.markSideDoorCorridor(props.worldX, props.worldY, props.direction);
        }

        // Update pathfinding grid to mark door tiles as walkable
        if (window.pathfindingManager) {
            // Mark door walkable in the current room
            window.pathfindingManager.markDoorWalkable(
                props.roomId, 
                props.worldX, 
                props.worldY, 
                props.direction
            );
            
            // Also mark door walkable in the connected room (opposite direction)
            const oppositeDirections = {
                'north': 'south',
                'south': 'north',
                'east': 'west',
                'west': 'east'
            };
            window.pathfindingManager.markDoorWalkable(
                props.connectedRoom,
                props.worldX,
                props.worldY,
                oppositeDirections[props.direction]
            );
        }
        
        // Load the connected room if it doesn't exist
        // Use window.rooms to ensure we see the latest state
        const needsLoading = !window.rooms || !window.rooms[props.connectedRoom];
        if (needsLoading) {
            console.log(`Loading room: ${props.connectedRoom}`);
            if (window.loadRoom) {
                // loadRoom is now async - fire and forget for door transitions
                window.loadRoom(props.connectedRoom).catch(err => {
                    console.error(`Failed to load room ${props.connectedRoom}:`, err);
                });
            }
        }
        
        // Process door sprites after room is ready
        const processRoomDoors = () => {
            console.log('Processing room doors after load');
            
            // Remove wall tiles from the connected room under the door position
            if (window.removeWallTilesForDoorInRoom) {
                window.removeWallTilesForDoorInRoom(props.connectedRoom, props.roomId, props.direction, doorSprite.x, doorSprite.y);
            }
            
            // Remove the matching door sprite from the connected room
            removeMatchingDoorSprite(props.connectedRoom, props.roomId, props.direction, doorSprite.x, doorSprite.y);
            
            // Create animated door sprite on the opposite side
            createAnimatedDoorOnOppositeSide(props.connectedRoom, props.roomId, props.direction, doorSprite.x, doorSprite.y);
            
            // Mark door as inactive immediately to prevent interaction checks from processing it
            doorSprite.setActive(false);
            
            // Clean up interaction indicator before destroying the sprite
            if (doorSprite.interactionIndicator) {
                // Stop any animations on the indicator first
                if (doorSprite.interactionIndicator.anims && doorSprite.interactionIndicator.anims.isPlaying) {
                    doorSprite.interactionIndicator.anims.stop();
                }
                // Stop any tweens on the indicator
                if (doorSprite.scene && doorSprite.scene.tweens) {
                    doorSprite.scene.tweens.killTweensOf(doorSprite.interactionIndicator);
                }
                doorSprite.interactionIndicator.destroy();
                delete doorSprite.interactionIndicator;
            }
            
            // Clean up proximity ghost (created by interaction system when door was in range)
            if (doorSprite.proximityGhost) {
                if (doorSprite.scene && doorSprite.scene.tweens) {
                    doorSprite.scene.tweens.killTweensOf(doorSprite.proximityGhost);
                }
                doorSprite.proximityGhost.destroy();
                delete doorSprite.proximityGhost;
            }
            
            // Remove the door sprite
            doorSprite.destroy();
            if (doorSprite.interactionZone) {
                doorSprite.interactionZone.destroy();
            }

            // Rebuild the world grid now that the door body is fully gone.
            // Use a 250ms delay so any table/wall delayedCall(0,...) callbacks
            // from the newly-loaded connected room have already fired.
            if (window.pathfindingManager) {
                const pm = window.pathfindingManager;
                const scene = pm.scene;
                if (scene?.time) {
                    scene.time.delayedCall(250, () => pm.rebuildWorldGrid());
                }
            }

            props.open = true;
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('door_opened', {
                    roomId: props.roomId,
                    connectedRoom: props.connectedRoom,
                    direction: props.direction
                });
            }
        };
        
        // If we just loaded the room, wait for it to be fully created
        // before manipulating its door sprites
        if (needsLoading) {
            console.log('Room just loaded, waiting for creation to complete...');
            // Poll until the room actually exists in window.rooms
            let attempts = 0;
            const maxAttempts = 20; // Max 1 second (20 * 50ms)
            const waitForRoom = () => {
                attempts++;
                // Check if room exists AND is fully initialized (has doorSprites array)
                const room = window.rooms ? window.rooms[props.connectedRoom] : null;
                const isFullyInitialized = room && room.doorSprites !== undefined;
                
                if (isFullyInitialized) {
                    console.log(`Room ${props.connectedRoom} is now fully initialized (after ${attempts * 50}ms)`);
                    processRoomDoors();
                } else if (attempts >= maxAttempts) {
                    console.error(`Room ${props.connectedRoom} failed to fully initialize after ${attempts * 50}ms`);
                    console.error('Room state:', room);
                    // Try anyway as a last resort
                    processRoomDoors();
                } else {
                    const roomExists = room !== null;
                    const hasDoorSprites = room && room.doorSprites !== undefined;
                    console.log(`Waiting for room ${props.connectedRoom}... (attempt ${attempts}), exists: ${roomExists}, doorSprites: ${hasDoorSprites}`);
                    setTimeout(waitForRoom, 50);
                }
            };
            waitForRoom();
        } else {
            console.log('Room already exists, processing doors immediately');
            processRoomDoors();
        }
    };
    
    // Check if game scene is ready using the global window.game reference
    // This is critical because rooms.js uses its own gameRef that must also be ready
    if (window.game && window.game.scene && window.game.scene.isActive('default')) {
        console.log('Game scene ready, opening door immediately');
        finishOpeningDoor();
    } else {
        console.log('Game scene not ready, waiting...');
        const waitForGameReady = () => {
            if (window.game && window.game.scene && window.game.scene.isActive('default')) {
                console.log('Game scene now ready, opening door');
                finishOpeningDoor();
            } else {
                setTimeout(waitForGameReady, 50);
            }
        };
        waitForGameReady();
    }
}

// Function to remove the matching door sprite from the connected room
function removeMatchingDoorSprite(roomId, fromRoomId, direction, doorWorldX, doorWorldY) {
    console.log(`Removing matching door sprite in room ${roomId} for door from ${fromRoomId} (${direction}) at (${doorWorldX}, ${doorWorldY})`);

    // Use window.rooms to ensure we see the latest state
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room || !room.doorSprites) {
        console.log(`No door sprites found for room ${roomId}`);
        return;
    }

    // Calculate the opposite direction to find the matching door
    const oppositeDirection = getOppositeDirection(direction);

    // Position tolerance for matching doors (in pixels)
    const POSITION_TOLERANCE = TILE_SIZE;

    // Find the door sprite that connects to the fromRoomId
    // For multiple doors between same rooms, also check position and direction
    const matchingDoorSprite = room.doorSprites.find(doorSprite => {
        const props = doorSprite.doorProperties;
        if (!props || props.connectedRoom !== fromRoomId) {
            return false;
        }

        // Check if direction matches (opposite direction)
        if (props.direction !== oppositeDirection) {
            return false;
        }

        // For N/S doors, check X position matches (within tolerance)
        // For E/W doors, check Y position matches (within tolerance)
        if (direction === 'north' || direction === 'south') {
            const xDiff = Math.abs(props.worldX - doorWorldX);
            if (xDiff > POSITION_TOLERANCE) {
                return false;
            }
        } else if (direction === 'east' || direction === 'west') {
            const yDiff = Math.abs(props.worldY - doorWorldY);
            if (yDiff > POSITION_TOLERANCE) {
                return false;
            }
        }

        return true;
    });

    if (matchingDoorSprite) {
        console.log(`Found matching door sprite in room ${roomId} at (${matchingDoorSprite.x}, ${matchingDoorSprite.y}), removing it`);

        // Clean up lock icon indicator before destroying
        if (matchingDoorSprite.interactionIndicator) {
            if (matchingDoorSprite.interactionIndicator.anims?.isPlaying) {
                matchingDoorSprite.interactionIndicator.anims.stop();
            }
            if (matchingDoorSprite.scene?.tweens) {
                matchingDoorSprite.scene.tweens.killTweensOf(matchingDoorSprite.interactionIndicator);
            }
            matchingDoorSprite.interactionIndicator.destroy();
            delete matchingDoorSprite.interactionIndicator;
        }

        // Clean up proximity ghost if present
        if (matchingDoorSprite.proximityGhost) {
            if (matchingDoorSprite.scene?.tweens) {
                matchingDoorSprite.scene.tweens.killTweensOf(matchingDoorSprite.proximityGhost);
            }
            matchingDoorSprite.proximityGhost.destroy();
            delete matchingDoorSprite.proximityGhost;
        }

        matchingDoorSprite.destroy();
        if (matchingDoorSprite.interactionZone) {
            matchingDoorSprite.interactionZone.destroy();
        }

        // Remove from the doorSprites array
        const index = room.doorSprites.indexOf(matchingDoorSprite);
        if (index > -1) {
            room.doorSprites.splice(index, 1);
        }
    } else {
        console.log(`No matching door sprite found in room ${roomId} for direction ${oppositeDirection} at position (${doorWorldX}, ${doorWorldY})`);
    }
}

// Function to create animated door sprite on the opposite side
function createAnimatedDoorOnOppositeSide(roomId, fromRoomId, direction, doorWorldX, doorWorldY) {
    console.log(`Creating animated door on opposite side in room ${roomId} for door from ${fromRoomId} (${direction}) at world position (${doorWorldX}, ${doorWorldY})`);
    
    // Use window.rooms to ensure we see the latest state
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room) {
        console.log(`Room ${roomId} not found, cannot create animated door`);
        return;
    }
    
    // Calculate the door position in the connected room
    const oppositeDirection = getOppositeDirection(direction);
    const roomPosition = window.roomPositions[roomId];
    const roomData = window.gameScenario.rooms[roomId];
    
    if (!roomPosition || !roomData) {
        console.log(`Missing position or data for room ${roomId}`);
        return;
    }

    // Wall-layer depth for E/W doors — matches the surrounding tilemap wall tiles so
    // the door frame always renders behind the player regardless of their Y position.
    const roomWallDepth = roomPosition.y + TILE_SIZE * 2 + 0.2;
    
    // Get room dimensions from tilemap (same as door sprite creation)
    const map = gameRef.cache.tilemap.get(roomData.type);
    let roomWidth = 320, roomHeight = 288; // fallback (10x9 tiles at 32px)
    
    if (map) {
        if (map.json) {
            roomWidth = map.json.width * TILE_SIZE;
            roomHeight = map.json.height * TILE_SIZE;
        } else if (map.data) {
            roomWidth = map.data.width * TILE_SIZE;
            roomHeight = map.data.height * TILE_SIZE;
        }
    }
    
    // Calculate the animated door position and the opposite side door position
    let animatedDoorX = doorWorldX;
    let animatedDoorY = doorWorldY;
    let oppositeDoorX, oppositeDoorY, doorWidth, doorHeight;
    
    if (direction === 'east' || direction === 'west') {
        // For side doors: animated door stays at original position, opposite door goes next to it
        doorHeight = TILE_SIZE;
        doorWidth = TILE_SIZE;
        
        if (direction === 'east') {
            // Original door was on east side at 0.5 tiles from right edge
            // Animated door stays at doorWorldX, doorWorldY
            // Opposite door goes on west side of new room at 0.5 tiles from left edge
            oppositeDoorX = roomPosition.x + (TILE_SIZE / 2); // 0.5 tiles from left edge
            oppositeDoorY = doorWorldY; // Same Y as animated door
        } else {
            // Original door was on west side at 0.5 tiles from left edge
            // Animated door stays at doorWorldX, doorWorldY
            // Opposite door goes on east side of new room at 0.5 tiles from right edge
            oppositeDoorX = roomPosition.x + roomWidth - (TILE_SIZE / 2); // 0.5 tiles from right edge
            oppositeDoorY = doorWorldY; // Same Y as animated door
        }
    } else if (direction === 'north' || direction === 'south') {
        // For N/S doors: similar logic
        doorWidth = TILE_SIZE * 2;
        doorHeight = TILE_SIZE;
        
        if (direction === 'north') {
            // Original door was on north side
            // Animated door stays at original position
            // Opposite door goes on south side of new room
            oppositeDoorX = doorWorldX; // Same X as animated door
            oppositeDoorY = roomPosition.y + roomHeight - TILE_SIZE;
        } else {
            // Original door was on south side
            // Animated door stays at original position
            // Opposite door goes on north side of new room
            oppositeDoorX = doorWorldX; // Same X as animated door
            oppositeDoorY = roomPosition.y + TILE_SIZE;
        }
    } else {
        console.log(`Unknown direction: ${direction}`);
        return;
    }
    
    // Create the animated door sprite (plays opening animation)
    let animatedDoorSprite;
    let doorTopSprite;
    const isSideDoor = (direction === 'east' || direction === 'west');

    try {
        if (isSideDoor) {
            // Create side door sprite (E/W doors) - animated
            animatedDoorSprite = gameRef.add.sprite(animatedDoorX, animatedDoorY, 'door_side_sheet_32');
            animatedDoorSprite.setOrigin(0.5, 0.5);
            animatedDoorSprite.setDepth(roomWallDepth); // Wall-layer depth — always behind player sprites
            animatedDoorSprite.setVisible(true);

            // Apply flip based on the OPPOSITE direction to show the door opening away
            if (oppositeDirection === 'west') {
                animatedDoorSprite.setFlipX(true);
            }

            // Play the side door opening animation
            animatedDoorSprite.play('door_side_open');

            // Store reference to the animated door in the room
            if (!room.animatedDoors) {
                room.animatedDoors = [];
            }
            room.animatedDoors.push(animatedDoorSprite);

            console.log(`Created animated side door sprite at (${animatedDoorX}, ${animatedDoorY}) in room ${roomId}`);

            // Create static open door sprite on opposite side
            let staticDoorSprite = gameRef.add.sprite(oppositeDoorX, oppositeDoorY, 'door_side_sheet_32');
            staticDoorSprite.setOrigin(0.5, 0.5);
            staticDoorSprite.setDepth(roomWallDepth); // Wall-layer depth — always behind player sprites
            staticDoorSprite.setVisible(true);
            
            // Set to frame 5 (open state) for side doors
            staticDoorSprite.setFrame(4);
            
            // Apply opposite flip for the static door
            if (direction === 'west') {
                staticDoorSprite.setFlipX(true);
            }

            if (!room.animatedDoors) {
                room.animatedDoors = [];
            }
            room.animatedDoors.push(staticDoorSprite);

            console.log(`Created static open door sprite at (${oppositeDoorX}, ${oppositeDoorY}) in room ${roomId}`);
        } else {
            // Create main door sprite (N/S doors) - animated
            animatedDoorSprite = gameRef.add.sprite(animatedDoorX, animatedDoorY, 'door_sheet');

            // Calculate the bottom of the door (where it meets the ground)
            const doorBottomY = animatedDoorY + (TILE_SIZE * 2) / 2; // doorY is center, so add half height to get bottom

            // Set sprite properties
            animatedDoorSprite.setOrigin(0.5, 0.5);
            animatedDoorSprite.setDepth(doorBottomY + 0.45); // Bottom Y + door layer offset
            animatedDoorSprite.setVisible(true);

            // Play the opening animation
            animatedDoorSprite.play('door_open');

            // Create door top sprite (6th frame) at high z-index
            doorTopSprite = gameRef.add.sprite(animatedDoorX, animatedDoorY, 'door_sheet');
            doorTopSprite.setOrigin(0.5, 0.5);
            doorTopSprite.setDepth(doorBottomY + 0.55); // Bottom Y + door top layer offset
            doorTopSprite.setVisible(true);
            doorTopSprite.play('door_top');

            // Store references to the animated doors in the room
            if (!room.animatedDoors) {
                room.animatedDoors = [];
            }
            room.animatedDoors.push(animatedDoorSprite);
            room.animatedDoors.push(doorTopSprite);

            console.log(`Created animated door sprite at (${animatedDoorX}, ${animatedDoorY}) in room ${roomId} with door top`);

            // Create static open door sprite on opposite side
            const oppositeDoorBottomY = oppositeDoorY + (TILE_SIZE * 2) / 2;
            let staticDoorSprite = gameRef.add.sprite(oppositeDoorX, oppositeDoorY, 'door_sheet');
            staticDoorSprite.setOrigin(0.5, 0.5);
            staticDoorSprite.setDepth(oppositeDoorBottomY + 0.45);
            staticDoorSprite.setVisible(true);
            
            // Set to frame 5 (open state) for N/S doors
            staticDoorSprite.setFrame(5);

            // Create static door top sprite
            let staticDoorTopSprite = gameRef.add.sprite(oppositeDoorX, oppositeDoorY, 'door_sheet');
            staticDoorTopSprite.setOrigin(0.5, 0.5);
            staticDoorTopSprite.setDepth(oppositeDoorBottomY + 0.55);
            staticDoorTopSprite.setVisible(true);
            staticDoorTopSprite.setFrame(4);

            if (!room.animatedDoors) {
                room.animatedDoors = [];
            }
            room.animatedDoors.push(staticDoorSprite);
            room.animatedDoors.push(staticDoorTopSprite);

            console.log(`Created static open door sprite at (${oppositeDoorX}, ${oppositeDoorY}) in room ${roomId}`);
        }
        
    } catch (error) {
        console.warn(`Failed to create door sprites:`, error);
        // Fallback to colored rectangles
        const graphics = gameRef.add.graphics();
        graphics.fillStyle(0xff00ff, 1); // Magenta for animated door
        graphics.fillRect(-doorWidth/2, -doorHeight/2, doorWidth, doorHeight);
        graphics.setPosition(animatedDoorX, animatedDoorY);

        if (isSideDoor) {
            graphics.setDepth(roomWallDepth); // Wall-layer depth — always behind player sprites
        } else {
            const doorBottomY = animatedDoorY + (TILE_SIZE * 2) / 2;
            graphics.setDepth(doorBottomY + 0.45);
        }

        if (!room.animatedDoors) {
            room.animatedDoors = [];
        }
        room.animatedDoors.push(graphics);

        // Fallback for opposite door
        const graphicsOpposite = gameRef.add.graphics();
        graphicsOpposite.fillStyle(0x00ff00, 1); // Green for static open door
        graphicsOpposite.fillRect(-doorWidth/2, -doorHeight/2, doorWidth, doorHeight);
        graphicsOpposite.setPosition(oppositeDoorX, oppositeDoorY);

        if (isSideDoor) {
            graphicsOpposite.setDepth(roomWallDepth); // Wall-layer depth — always behind player sprites
        } else {
            const doorBottomY = oppositeDoorY + (TILE_SIZE * 2) / 2;
            graphicsOpposite.setDepth(doorBottomY + 0.45);
        }

        room.animatedDoors.push(graphicsOpposite);

        console.log(`Created fallback door sprites at (${animatedDoorX}, ${animatedDoorY}) and (${oppositeDoorX}, ${oppositeDoorY})`);
    }
}

// Helper function to get the opposite direction
export function getOppositeDirection(direction) {
    switch (direction) {
        case 'north': return 'south';
        case 'south': return 'north';
        case 'east': return 'west';
        case 'west': return 'east';
        default: return direction;
    }
}

// Function to check if player has crossed a door threshold
export function checkDoorTransitions(player) {
    // Check cooldown first
    const currentTime = Date.now();
    if (currentTime - lastDoorTransitionTime < DOOR_TRANSITION_COOLDOWN) {
        return null; // Still in cooldown
    }
    
    const playerBottomY = player.y + (player.height * player.scaleY) / 2;
    let closestTransition = null;
    let closestDistance = Infinity;
    
    // Only check doors in the current room
    const currentRoom = rooms[window.currentPlayerRoom];
    if (!currentRoom || !currentRoom.doorSprites) {
        return null; // No doors in current room
    }
    
    currentRoom.doorSprites.forEach(doorSprite => {
        // Get door information from the sprite's custom properties
        const doorInfo = doorSprite.doorInfo;
        if (!doorInfo) return;
        
        const { direction, connectedRoom } = doorInfo;
        
        // Skip if this would transition to the current room (shouldn't happen, but safety check)
        if (connectedRoom === window.currentPlayerRoom) {
            return;
        }
        
        // Skip if this is the same transition we just made
        if (lastDoorTransition === `${window.currentPlayerRoom}->${connectedRoom}`) {
            return;
        }
        
        // Calculate door threshold based on direction
        let doorThreshold = null;
        const roomPosition = currentRoom.position;
        const roomHeight = currentRoom.map.heightInPixels;
        
        if (direction === 'north') {
            // North door: threshold is 2 tiles down from top (bottom of door)
            doorThreshold = roomPosition.y + TILE_SIZE * 2; // 1 tile from top + 1 more tile for door height
        } else if (direction === 'south') {
            // South door: threshold is 2 tiles up from bottom (top of door)
            doorThreshold = roomPosition.y + roomHeight - TILE_SIZE * 2; // 1 tile from bottom + 1 more tile for door height
        }
        
        if (doorThreshold !== null) {
            // Check if player has crossed the threshold
            let shouldTransition = false;
            if (direction === 'north' && playerBottomY <= doorThreshold) {
                shouldTransition = true;
            } else if (direction === 'south' && playerBottomY >= doorThreshold) {
                shouldTransition = true;
            }
            
            if (shouldTransition) {
                // Calculate distance to this door threshold
                const distanceToThreshold = Math.abs(playerBottomY - doorThreshold);
                
                // Only consider this transition if it's closer than any previous one
                if (distanceToThreshold < closestDistance) {
                    closestDistance = distanceToThreshold;
                    closestTransition = connectedRoom;
                    // console.log(`Player crossed ${direction} door threshold in ${window.currentPlayerRoom} -> ${connectedRoom} (current: ${window.currentPlayerRoom}, distance: ${distanceToThreshold.toFixed(2)})`);
                }
            }
        }
    });
    
    // If a transition was detected, set the cooldown and track the transition
    if (closestTransition) {
        lastDoorTransitionTime = currentTime;
        lastDoorTransition = `${window.currentPlayerRoom}->${closestTransition}`;
    }
    
    return closestTransition;
}

// Update door sprites visibility based on which rooms are revealed
export function updateDoorSpritesVisibility() {
    const discoveredRooms = window.discoveredRooms || new Set();
    console.log(`updateDoorSpritesVisibility called. Discovered rooms:`, Array.from(discoveredRooms));
    
    Object.entries(rooms).forEach(([roomId, room]) => {
        if (!room.doorSprites) return;
        
        room.doorSprites.forEach(doorSprite => {
            // Get the door sprite's bounds (it covers 2 tiles vertically)
            const doorSpriteBounds = {
                x: doorSprite.x - TILE_SIZE/2, // Left edge of door sprite (center origin)
                y: doorSprite.y - TILE_SIZE,   // Top edge of door sprite (center origin)
                width: TILE_SIZE,              // Door sprite width
                height: TILE_SIZE * 2          // Door sprite height (2 tiles)
            };
            
            // Check if this room is revealed (doors should be visible if their room is visible)
            const thisRoomRevealed = discoveredRooms.has(roomId);
            
            // Check how many other revealed rooms this door overlaps with
            let overlappingRevealedRooms = 0;
            
            Object.entries(rooms).forEach(([otherRoomId, otherRoom]) => {
                if (!discoveredRooms.has(otherRoomId)) return; // Skip unrevealed rooms
                
                const otherRoomBounds = {
                    x: otherRoom.position.x,
                    y: otherRoom.position.y,
                    width: otherRoom.map.widthInPixels,
                    height: otherRoom.map.heightInPixels
                };
                
                // Check if door sprite bounds overlap with this revealed room
                if (boundsOverlap(doorSpriteBounds, otherRoomBounds)) {
                    overlappingRevealedRooms++;
                }
            });
            
            // Door should be visible if its room is revealed OR if it overlaps with any revealed room
            const shouldBeVisible = thisRoomRevealed || overlappingRevealedRooms > 0;
            
            console.log(`Door sprite at (${doorSprite.x}, ${doorSprite.y}) in room ${roomId}:`);
            console.log(`  This room revealed: ${thisRoomRevealed}`);
            console.log(`  Overlapping revealed rooms: ${overlappingRevealedRooms}`);
            console.log(`  Should be visible: ${shouldBeVisible}`);
            
            if (shouldBeVisible) {
                doorSprite.setVisible(true);
                doorSprite.setAlpha(1);
            } else {
                doorSprite.setVisible(false);
                doorSprite.setAlpha(0);
            }
        });
    });
}

// Helper function to check if two rectangles overlap
function boundsOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Process all door collisions
export function processAllDoorCollisions() {
    console.log('Processing door collisions');
    
    Object.entries(rooms).forEach(([roomId, room]) => {
        if (room.doorsLayer) {
            const doorTiles = room.doorsLayer.getTilesWithin()
                .filter(tile => tile.index !== -1);

            // Find all rooms that overlap with this room
            Object.entries(rooms).forEach(([otherId, otherRoom]) => {
                if (roomsOverlap(room.position, otherRoom.position)) {
                    otherRoom.wallsLayers.forEach(wallLayer => {
                        processDoorCollisions(doorTiles, wallLayer, room.doorsLayer);
                    });
                }
            });
        }
    });
}

function processDoorCollisions(doorTiles, wallLayer, doorsLayer) {
    doorTiles.forEach(doorTile => {
        // Convert door tile coordinates to world coordinates
        const worldX = doorsLayer.x + (doorTile.x * doorsLayer.tilemap.tileWidth);
        const worldY = doorsLayer.y + (doorTile.y * doorsLayer.tilemap.tileHeight);
        
        // Convert world coordinates back to the wall layer's local coordinates
        const wallX = Math.floor((worldX - wallLayer.x) / wallLayer.tilemap.tileWidth);
        const wallY = Math.floor((worldY - wallLayer.y) / wallLayer.tilemap.tileHeight);
        
        const wallTile = wallLayer.getTileAt(wallX, wallY);
        if (wallTile) {
            if (doorTile.properties?.locked) {
                wallTile.setCollision(true);
            } else {
                wallTile.setCollision(false);
            }
        }
    });
}

function roomsOverlap(pos1, pos2) {
    // Add some tolerance for overlap detection
    const OVERLAP_TOLERANCE = 48; // One tile width
    const ROOM_WIDTH = 800;
    const ROOM_HEIGHT = 600;
    
    return !(pos1.x + ROOM_WIDTH - OVERLAP_TOLERANCE < pos2.x || 
             pos1.x > pos2.x + ROOM_WIDTH - OVERLAP_TOLERANCE || 
             pos1.y + ROOM_HEIGHT - OVERLAP_TOLERANCE < pos2.y || 
             pos1.y > pos2.y + ROOM_HEIGHT - OVERLAP_TOLERANCE);
}

// Store door zones globally so we can manage them
window.doorZones = window.doorZones || new Map();

export function setupDoorOverlapChecks() {
    if (!gameRef) {
        console.error('Game reference not set in doors.js');
        return;
    }
    
    // Clear existing door zones
    if (window.doorZones) {
        window.doorZones.forEach(zone => {
            if (zone && zone.destroy) {
                zone.destroy();
            }
        });
        window.doorZones.clear();
    }
    
    Object.entries(rooms).forEach(([roomId, room]) => {
        if (!room.doorSprites) return;

        const doorSprites = room.doorSprites;
        
        // Get room data to check if this room should be locked
        const gameScenario = window.gameScenario;
        const roomData = gameScenario?.rooms?.[roomId];
        
        doorSprites.forEach(doorSprite => {
            const zone = gameRef.add.zone(doorSprite.x, doorSprite.y, TILE_SIZE, TILE_SIZE * 2);
            zone.setInteractive({ useHandCursor: true });
            
            // Store zone reference for later management
            const zoneKey = `${roomId}_${doorSprite.doorProperties.topTile.x}_${doorSprite.doorProperties.topTile.y}`;
            window.doorZones.set(zoneKey, zone);
            
            zone.on('pointerdown', () => {
                console.log('Door clicked:', { doorSprite, room });
                console.log('Door properties:', doorSprite.doorProperties);
                console.log('Door open state:', doorSprite.doorProperties?.open);
                console.log('Door sprite position:', { x: doorSprite.x, y: doorSprite.y });
                
                const player = window.player;
                if (!player) return;
                
                const distance = Phaser.Math.Distance.Between(
                    player.x, player.y,
                    doorSprite.x, doorSprite.y
                );
                
                if (distance <= DOOR_INTERACTION_RANGE) {
                    handleDoorInteraction(doorSprite);
                } else {
                    console.log('DOOR TOO FAR TO INTERACT');
                }
            });

            gameRef.physics.world.enable(zone);
        });
    });
}

// Function to update door zone visibility based on room visibility
export function updateDoorZoneVisibility() {
    if (!window.doorZones || !gameRef) return;
    
    const discoveredRooms = window.discoveredRooms || new Set();
    
    window.doorZones.forEach((zone, zoneKey) => {
        const [roomId] = zoneKey.split('_');
        
        // Show zone if this room is discovered
        if (discoveredRooms.has(roomId)) {
            zone.setVisible(true);
            zone.setInteractive({ useHandCursor: true });
        } else {
            zone.setVisible(false);
            zone.setInteractive(false);
        }
    });
}

// Update sign label visibility based on player proximity (called each frame)
// Export for global access
window.updateDoorSpritesVisibility = updateDoorSpritesVisibility;
window.checkDoorTransitions = checkDoorTransitions;
window.setupDoorOverlapChecks = setupDoorOverlapChecks;
window.updateDoorZoneVisibility = updateDoorZoneVisibility;
window.processAllDoorCollisions = processAllDoorCollisions;
window.handleDoorInteraction = handleDoorInteraction;

// Export functions for use by other modules
export { unlockDoor, handleDoorInteraction };
