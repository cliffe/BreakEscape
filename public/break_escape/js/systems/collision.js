/**
 * COLLISION MANAGEMENT SYSTEM
 * ===========================
 *
 * Handles static collision geometry, tile-based collision, and wall management.
 * Separated from rooms.js for better modularity and maintainability.
 */

import { TILE_SIZE } from '../utils/constants.js';
import { getOppositeDirection, calculateDoorPositionsForRoom } from './doors.js';

let gameRef = null;
let rooms = null;

// Initialize collision system
export function initializeCollision(gameInstance, roomsRef) {
    gameRef = gameInstance;
    rooms = roomsRef;
}

// Function to create thin collision boxes for wall tiles
export function createWallCollisionBoxes(wallLayer, roomId, position) {
    console.log(`Creating wall collision boxes for room ${roomId}`);
    
    // Use window.rooms to ensure we see the latest state
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room) {
        console.error(`Room ${roomId} not found in window.rooms, cannot create collision boxes`);
        return;
    }
    
    // Ensure we have a valid game reference
    const game = gameRef || window.game;
    if (!game) {
        console.error('No game reference available, cannot create collision boxes');
        return;
    }
    
    // Get room dimensions from the map
    const map = room.map;
    const roomWidth = map.widthInPixels;
    const roomHeight = map.heightInPixels;
    
    console.log(`Room ${roomId} dimensions: ${roomWidth}x${roomHeight} at position (${position.x}, ${position.y})`);
    
    const collisionBoxes = [];
    
    // Get all wall tiles from the layer
    const wallTiles = wallLayer.getTilesWithin(0, 0, map.width, map.height, { isNotEmpty: true });
    
    wallTiles.forEach(tile => {
        const tileX = tile.x;
        const tileY = tile.y;
        const worldX = position.x + (tileX * TILE_SIZE);
        const worldY = position.y + (tileY * TILE_SIZE);
        
        // Create collision boxes for all applicable edges (not just one)
        const tileCollisionBoxes = [];
        
        // North wall (top 2 rows) - collision on south edge
        if (tileY < 2) {
            const collisionBox = game.add.rectangle(
                worldX + TILE_SIZE / 2,
                worldY + TILE_SIZE - 4, // 4px from south edge
                TILE_SIZE,
                8, // Thicker collision box
                0x000000,
                0 // Invisible
            );
            tileCollisionBoxes.push(collisionBox);
        }
        
        // South wall (bottom row) - collision on south edge
        if (tileY === map.height - 1) {
            const collisionBox = game.add.rectangle(
                worldX + TILE_SIZE / 2,
                worldY + TILE_SIZE - 4, // 4px from south edge
                TILE_SIZE,
                8, // Thicker collision box
                0x000000,
                0 // Invisible
            );
            tileCollisionBoxes.push(collisionBox);
        }
        
        // West wall (left column) - collision on east edge
        if (tileX === 0) {
            const collisionBox = game.add.rectangle(
                worldX + TILE_SIZE - 4, // 4px from east edge
                worldY + TILE_SIZE / 2,
                8, // Thicker collision box
                TILE_SIZE,
                0x000000,
                0 // Invisible
            );
            tileCollisionBoxes.push(collisionBox);
        }
        
        // East wall (right column) - collision on west edge
        if (tileX === map.width - 1) {
            const collisionBox = game.add.rectangle(
                worldX + 4, // 4px from west edge
                worldY + TILE_SIZE / 2,
                8, // Thicker collision box
                TILE_SIZE,
                0x000000,
                0 // Invisible
            );
            tileCollisionBoxes.push(collisionBox);
        }
        
        // Set up all collision boxes for this tile
        tileCollisionBoxes.forEach(collisionBox => {
            collisionBox.setVisible(false);
            game.physics.add.existing(collisionBox, true);
            
            // Wait for the next frame to ensure body is fully initialized
            game.time.delayedCall(0, () => {
                if (collisionBox.body) {
                    // Use direct property assignment (fallback method)
                    collisionBox.body.immovable = true;
                }
            });
            
            collisionBoxes.push(collisionBox);
        });
    });
    
    console.log(`Created ${collisionBoxes.length} wall collision boxes for room ${roomId}`);
    
    // Add collision with player for all collision boxes
    const player = window.player;
    if (player && player.body) {
        collisionBoxes.forEach(collisionBox => {
            game.physics.add.collider(player, collisionBox);
        });
        console.log(`Added ${collisionBoxes.length} wall collision boxes for room ${roomId} with player collision`);
    } else {
        console.warn(`Player not ready for room ${roomId}, storing ${collisionBoxes.length} collision boxes for later`);
        if (!room.pendingWallCollisionBoxes) {
            room.pendingWallCollisionBoxes = [];
        }
        room.pendingWallCollisionBoxes.push(...collisionBoxes);
    }
    
    // Store collision boxes in room for cleanup
    if (!room.wallCollisionBoxes) {
        room.wallCollisionBoxes = [];
    }
    room.wallCollisionBoxes.push(...collisionBoxes);
}

// Function to remove wall tiles under doors
export function removeTilesUnderDoor(wallLayer, roomId, position) {
    console.log(`Removing wall tiles under doors in room ${roomId}`);

    const gameScenario = window.gameScenario;
    const roomData = gameScenario.rooms[roomId];
    if (!roomData || !roomData.connections) {
        console.log(`No connections found for room ${roomId}, skipping wall tile removal`);
        return;
    }

    // Get room dimensions from global cache (set by calculateRoomPositions)
    const roomDimensions = window.roomDimensions?.[roomId];
    if (!roomDimensions) {
        console.error(`Room dimensions not found for ${roomId}. Cannot remove wall tiles.`);
        return;
    }

    // Get all positions and dimensions for door alignment
    const allPositions = window.roomPositions || {};
    const allDimensions = window.roomDimensions || {};

    // Calculate door positions using the SAME function as door sprite creation
    // This ensures perfect alignment between door sprites and removed wall tiles
    const doorPositions = calculateDoorPositionsForRoom(
        roomId,
        position,
        roomDimensions,
        roomData.connections,
        allPositions,
        allDimensions,
        gameScenario
    );

    console.log(`Removing wall tiles for ${doorPositions.length} doors in ${roomId}`);

    // Remove wall tiles for each calculated door position
    doorPositions.forEach(doorInfo => {
        const { x: doorX, y: doorY, direction, connectedRoom } = doorInfo;

        // Set door size based on direction
        let doorWidth = TILE_SIZE;
        let doorHeight = TILE_SIZE * 2;

        if (direction === 'east' || direction === 'west') {
            // Side doors: 1 tile wide (horizontally) x 1 tile tall (vertically)
            doorWidth = TILE_SIZE;
            doorHeight = TILE_SIZE;
        }

        // Use Phaser's getTilesWithin to get tiles that overlap with the door area
        const doorBounds = {
            x: doorX - (doorWidth / 2), // Door sprite origin is center, so adjust bounds
            y: doorY - (doorHeight / 2),
            width: doorWidth,
            height: doorHeight
        };

        // Convert door bounds to tilemap coordinates (relative to the layer)
        const doorBoundsInTilemap = {
            x: doorBounds.x - wallLayer.x,
            y: doorBounds.y - wallLayer.y,
            width: doorBounds.width,
            height: doorBounds.height
        };

        console.log(`Removing wall tiles for ${roomId} -> ${connectedRoom} (${direction}): door at (${doorX}, ${doorY}), world bounds:`, doorBounds, `tilemap bounds:`, doorBoundsInTilemap);
        console.log(`Wall layer info: x=${wallLayer.x}, y=${wallLayer.y}, width=${wallLayer.width}, height=${wallLayer.height}`);

        // Try a different approach - convert to tile coordinates first
        const doorTileX = Math.floor(doorBoundsInTilemap.x / TILE_SIZE);
        const doorTileY = Math.floor(doorBoundsInTilemap.y / TILE_SIZE);
        const doorTilesWide = Math.ceil(doorBoundsInTilemap.width / TILE_SIZE);
        const doorTilesHigh = Math.ceil(doorBoundsInTilemap.height / TILE_SIZE);

        console.log(`Door tile coordinates: (${doorTileX}, ${doorTileY}) covering ${doorTilesWide}x${doorTilesHigh} tiles`);

        // Check what tiles exist in the door area manually
        let foundTiles = [];
        for (let x = 0; x < doorTilesWide; x++) {
            for (let y = 0; y < doorTilesHigh; y++) {
                const tileX = doorTileX + x;
                const tileY = doorTileY + y;
                const tile = wallLayer.getTileAt(tileX, tileY);
                if (tile && tile.index !== -1) {
                    foundTiles.push({x: tileX, y: tileY, tile: tile});
                    console.log(`Found wall tile at (${tileX}, ${tileY}) with index ${tile.index}`);
                }
            }
        }

        console.log(`Manually found ${foundTiles.length} wall tiles in door area`);

        // Get all tiles within the door bounds (using tilemap coordinates)
        const overlappingTiles = wallLayer.getTilesWithin(
            doorBoundsInTilemap.x,
            doorBoundsInTilemap.y,
            doorBoundsInTilemap.width,
            doorBoundsInTilemap.height
        );

        console.log(`getTilesWithin found ${overlappingTiles.length} tiles overlapping with door area`);

        // Use the manually found tiles if getTilesWithin didn't work
        const tilesToRemove = foundTiles.length > 0 ? foundTiles : overlappingTiles;

        // Remove wall tiles that overlap with the door
        tilesToRemove.forEach(tileData => {
            const tileX = tileData.x;
            const tileY = tileData.y;

            // Remove the wall tile
            const removedTile = wallLayer.tilemap.removeTileAt(
                tileX,
                tileY,
                true,  // replaceWithNull
                true,  // recalculateFaces
                wallLayer  // layer
            );

            if (removedTile) {
                console.log(`Removed wall tile at (${tileX}, ${tileY}) under door ${roomId} -> ${connectedRoom}`);
            }
        });

        // Recalculate collision after removing tiles
        if (tilesToRemove.length > 0) {
            console.log(`Recalculating collision for wall layer in ${roomId} after removing ${tilesToRemove.length} tiles`);
            wallLayer.setCollisionByExclusion([-1]);
        }
        
        // For side doors (E/W) in the CURRENT room, add thin collision bars on N/S edges
        // (8px, matching wall collision box thickness) to prevent corner clipping.
        if (direction === 'east' || direction === 'west') {
            const room = window.rooms ? window.rooms[roomId] : null;
            if (room) {
                // Thin bar at the top edge of the door opening.
                const northCollisionBox = gameRef.add.rectangle(
                    doorX,
                    doorY - TILE_SIZE / 2, // Inner face of tile above
                    TILE_SIZE,
                    8,
                    0x0000ff,
                    0
                );
                northCollisionBox.setVisible(false);
                gameRef.physics.add.existing(northCollisionBox, true);
                northCollisionBox.body.immovable = true;

                // Thin bar at the bottom edge of the door opening.
                const southCollisionBox = gameRef.add.rectangle(
                    doorX,
                    doorY + TILE_SIZE / 2, // Inner face of tile below
                    TILE_SIZE,
                    8,
                    0x0000ff,
                    0
                );
                southCollisionBox.setVisible(false);
                gameRef.physics.add.existing(southCollisionBox, true);
                southCollisionBox.body.immovable = true;

                const player = window.player;
                if (player && player.body) {
                    gameRef.physics.add.collider(player, northCollisionBox);
                    gameRef.physics.add.collider(player, southCollisionBox);
                }

                if (!room.wallCollisionBoxes) room.wallCollisionBoxes = [];
                room.wallCollisionBoxes.push(northCollisionBox, southCollisionBox);
            }
        }
    });
}

// Function to remove wall tiles from a specific room for a door connection
export function removeWallTilesForDoorInRoom(roomId, fromRoomId, direction, doorWorldX, doorWorldY) {
    console.log(`Removing wall tiles in room ${roomId} for door from ${fromRoomId} (${direction}) at world position (${doorWorldX}, ${doorWorldY})`);
    
    // Use window.rooms to ensure we see the latest state
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room || !room.wallsLayers || room.wallsLayers.length === 0) {
        console.log(`No wall layers found for room ${roomId}`);
        return;
    }
    
    // Calculate the door position in the connected room
    // The door should be on the opposite side of the connection
    const oppositeDirection = getOppositeDirection(direction);
    const roomPosition = window.roomPositions[roomId];
    const roomData = window.gameScenario.rooms[roomId];
    
    if (!roomPosition || !roomData) {
        console.log(`Missing position or data for room ${roomId}`);
        return;
    }
    
    // Get room dimensions
    const roomWidth = roomData.width || 320;
    const roomHeight = roomData.height || 288;
    
    // Calculate door position in the connected room based on the opposite direction
    let doorX, doorY, doorWidth, doorHeight;
    
    // Calculate door position based on the room's door configuration
    if (direction === 'north' || direction === 'south') {
        // For north/south connections, calculate X position based on room configuration
        const oppositeDirection = getOppositeDirection(direction);
        const connections = roomData.connections?.[oppositeDirection];
        
        if (Array.isArray(connections)) {
            // Multiple doors - find the one that connects to fromRoomId
            const doorIndex = connections.indexOf(fromRoomId);
            if (doorIndex >= 0) {
                const totalDoors = connections.length;
                const availableWidth = roomWidth - (TILE_SIZE * 3); // 1.5 tiles from each edge
                const doorSpacing = totalDoors > 1 ? availableWidth / (totalDoors - 1) : 0;
                doorX = roomPosition.x + TILE_SIZE * 1.5 + (doorIndex * doorSpacing);
            } else {
                doorX = roomPosition.x + roomWidth / 2; // Default to center
            }
        } else {
            // Single door - check if the connecting room has multiple doors
            const connectingRoomConnections = window.gameScenario.rooms[fromRoomId]?.connections?.[direction];
            if (Array.isArray(connectingRoomConnections) && connectingRoomConnections.length > 1) {
                // The connecting room has multiple doors, find which one connects to this room
                const doorIndex = connectingRoomConnections.indexOf(roomId);
                if (doorIndex >= 0) {
                    // When the connecting room has multiple doors, position this door to match
                    // If this room is at index 0 (left), position door on the right (southeast)
                    // If this room is at index 1 (right), position door on the left (southwest)
                    if (doorIndex === 0) {
                        // This room is on the left, so door should be on the right
                        doorX = roomPosition.x + roomWidth - TILE_SIZE * 1.5;
                        console.log(`Wall tile removal door positioning for ${roomId}: left room (index 0), door on right (southeast), calculated doorX=${doorX}`);
                    } else {
                        // This room is on the right, so door should be on the left
                        doorX = roomPosition.x + TILE_SIZE * 1.5;
                        console.log(`Wall tile removal door positioning for ${roomId}: right room (index ${doorIndex}), door on left (southwest), calculated doorX=${doorX}`);
                    }
                } else {
                    // Fallback to left positioning
                    doorX = roomPosition.x + TILE_SIZE * 1.5;
                    console.log(`Wall tile removal door positioning for ${roomId}: fallback to left, calculated doorX=${doorX}`);
                }
            } else {
                // Single door - use left positioning
                doorX = roomPosition.x + TILE_SIZE * 1.5;
                console.log(`Wall tile removal door positioning for ${roomId}: single connection to ${fromRoomId}, calculated doorX=${doorX}`);
            }
        }
        
        if (direction === 'north') {
            // Original door is north, so new door should be south
            doorY = roomPosition.y + roomHeight - TILE_SIZE;
        } else {
            // Original door is south, so new door should be north
            doorY = roomPosition.y + TILE_SIZE;
        }
        doorWidth = TILE_SIZE * 2;
        doorHeight = TILE_SIZE;
    } else if (direction === 'east' || direction === 'west') {
        // For east/west connections: positioned at Y center
        // Side door is 1 tile wide (horizontally) and 1 tile tall (vertically)
        doorY = roomPosition.y + (TILE_SIZE * 2.5); // Center of the door

        if (direction === 'east') {
            // Original door is east, so new door should be west
            doorX = roomPosition.x + (TILE_SIZE / 2);
        } else {
            // Original door is west, so new door should be east
            doorX = roomPosition.x + roomWidth - (TILE_SIZE / 2);
        }
        // Side doors: 1 tile wide (horizontally) x 1 tile tall (vertically)
        doorWidth = TILE_SIZE;
        doorHeight = TILE_SIZE;
    } else {
        console.log(`Unknown direction: ${direction}`);
        return;
    }
    
    // For debugging: Calculate what the door position should be based on room dimensions
    const expectedSouthDoorY = roomPosition.y + roomHeight - TILE_SIZE;
    const expectedNorthDoorY = roomPosition.y + TILE_SIZE;
    console.log(`Expected door positions for ${roomId}: north=${expectedNorthDoorY}, south=${expectedSouthDoorY}`);
    
    // Debug: Log the room position and calculated door position
    console.log(`Room ${roomId} position: (${roomPosition.x}, ${roomPosition.y}), dimensions: ${roomWidth}x${roomHeight}`);
    console.log(`Original door at (${doorWorldX}, ${doorWorldY}), calculated door at (${doorX}, ${doorY})`);
    console.log(`Direction: ${direction}, oppositeDirection: ${getOppositeDirection(direction)}`);
    console.log(`Room connections:`, roomData.connections);
    

    
    console.log(`Calculated door position in ${roomId}: (${doorX}, ${doorY}) for ${oppositeDirection} connection`);
    
    // Remove wall tiles from all wall layers in this room
    room.wallsLayers.forEach(wallLayer => {
        // Calculate door bounds
        // For north/south doors, the door sprite origin is at the center, but we need to adjust for the actual door position
        let doorBounds;
        if (oppositeDirection === 'north' || oppositeDirection === 'south') {
            // For north/south doors, the door should cover the full width and be positioned at the edge
            doorBounds = {
                x: doorX - (doorWidth / 2),
                y: doorY, // Don't subtract half height - the door is positioned at the edge
                width: doorWidth,
                height: doorHeight
            };
        } else {
            // For east/west doors, use center positioning
            doorBounds = {
                x: doorX - (doorWidth / 2),
                y: doorY - (doorHeight / 2),
                width: doorWidth,
                height: doorHeight
            };
        }
        
        // For debugging: Show the door sprite dimensions and bounds
        console.log(`Door sprite at (${doorX}, ${doorY}) with dimensions ${doorWidth}x${doorHeight}`);
        console.log(`Door bounds: x=${doorBounds.x}, y=${doorBounds.y}, width=${doorBounds.width}, height=${doorBounds.height}`);
        
        // Convert door bounds to tilemap coordinates
        const doorBoundsInTilemap = {
            x: doorBounds.x - wallLayer.x,
            y: doorBounds.y - wallLayer.y,
            width: doorBounds.width,
            height: doorBounds.height
        };
        
        console.log(`Removing wall tiles in ${roomId} for ${oppositeDirection} door: world bounds:`, doorBounds, `tilemap bounds:`, doorBoundsInTilemap);
        console.log(`Wall layer position: (${wallLayer.x}, ${wallLayer.y}), size: ${wallLayer.width}x${wallLayer.height}`);
        console.log(`Room position: (${roomPosition.x}, ${roomPosition.y}), door position: (${doorX}, ${doorY})`);
        
        // Convert to tile coordinates
        const doorTileX = Math.floor(doorBoundsInTilemap.x / TILE_SIZE);
        const doorTileY = Math.floor(doorBoundsInTilemap.y / TILE_SIZE);
        const doorTilesWide = Math.ceil(doorBoundsInTilemap.width / TILE_SIZE);
        const doorTilesHigh = Math.ceil(doorBoundsInTilemap.height / TILE_SIZE);
        
        console.log(`Expected tile Y: ${Math.floor((doorY - roomPosition.y) / TILE_SIZE)}, actual tile Y: ${doorTileY}`);
        
        console.log(`Door tile coordinates in ${roomId}: (${doorTileX}, ${doorTileY}) covering ${doorTilesWide}x${doorTilesHigh} tiles`);
        
        // Check what tiles exist in the door area manually
        let foundTiles = [];
        for (let x = 0; x < doorTilesWide; x++) {
            for (let y = 0; y < doorTilesHigh; y++) {
                const tileX = doorTileX + x;
                const tileY = doorTileY + y;
                const tile = wallLayer.getTileAt(tileX, tileY);
                if (tile && tile.index !== -1) {
                    foundTiles.push({x: tileX, y: tileY, tile: tile});
                    console.log(`Found wall tile at (${tileX}, ${tileY}) with index ${tile.index} in ${roomId}`);
                }
            }
        }
        
        console.log(`Manually found ${foundTiles.length} wall tiles in door area in ${roomId}`);
        
        // Remove wall tiles that overlap with the door
        foundTiles.forEach(tileData => {
            const tileX = tileData.x;
            const tileY = tileData.y;
            
            // Remove the wall tile
            const removedTile = wallLayer.tilemap.removeTileAt(
                tileX,
                tileY,
                true,  // replaceWithNull
                true,  // recalculateFaces
                wallLayer  // layer
            );
            
            if (removedTile) {
                console.log(`Removed wall tile at (${tileX}, ${tileY}) under door in ${roomId}`);
            }
        });
        
        // Recalculate collision after removing tiles
        if (foundTiles.length > 0) {
            console.log(`Recalculating collision for wall layer in ${roomId} after removing ${foundTiles.length} tiles`);
            wallLayer.setCollisionByExclusion([-1]);
        }
        
        // For side doors (E/W), add thin collision bars on N/S edges of the cut-out
        // (8px, matching wall collision box thickness) to prevent corner clipping.
        if (oppositeDirection === 'east' || oppositeDirection === 'west') {
            const room = window.rooms ? window.rooms[roomId] : null;
            if (room) {
                // Thin bar at the top edge of the door opening.
                const northCollisionBox = gameRef.add.rectangle(
                    doorX,
                    doorY - TILE_SIZE / 2, // Inner face of tile above
                    TILE_SIZE,
                    8,
                    0x0000ff,
                    0
                );
                northCollisionBox.setVisible(false);
                gameRef.physics.add.existing(northCollisionBox, true);
                northCollisionBox.body.immovable = true;

                // Thin bar at the bottom edge of the door opening.
                const southCollisionBox = gameRef.add.rectangle(
                    doorX,
                    doorY + TILE_SIZE / 2, // Inner face of tile below
                    TILE_SIZE,
                    8,
                    0x0000ff,
                    0
                );
                southCollisionBox.setVisible(false);
                gameRef.physics.add.existing(southCollisionBox, true);
                southCollisionBox.body.immovable = true;

                const player = window.player;
                if (player && player.body) {
                    gameRef.physics.add.collider(player, northCollisionBox);
                    gameRef.physics.add.collider(player, southCollisionBox);
                }

                if (!room.wallCollisionBoxes) room.wallCollisionBoxes = [];
                room.wallCollisionBoxes.push(northCollisionBox, southCollisionBox);
            }
        }
    });
}

// Function to remove wall tiles from all overlapping room layers at a world position
export function removeWallTilesAtWorldPosition(worldX, worldY, debugInfo = '') {
    console.log(`Removing wall tiles at world position (${worldX}, ${worldY}) - ${debugInfo}`);
    
    // Find all rooms and their wall layers that could contain this world position
    Object.entries(rooms).forEach(([roomId, room]) => {
        if (!room.wallsLayers || room.wallsLayers.length === 0) return;
        
        room.wallsLayers.forEach(wallLayer => {
            try {
                // Convert world coordinates to tile coordinates for this layer
                const tileX = Math.floor((worldX - room.position.x) / TILE_SIZE);
                const tileY = Math.floor((worldY - room.position.y) / TILE_SIZE);
                
                // Check if the tile coordinates are within the layer bounds
                const wallTile = wallLayer.getTileAt(tileX, tileY);
                if (wallTile && wallTile.index !== -1) {
                    // Remove the wall tile using the map's removeTileAt method
                    const removedTile = room.map.removeTileAt(
                        tileX,
                        tileY,
                        true,  // replaceWithNull
                        true,  // recalculateFaces
                        wallLayer  // layer
                    );
                    
                    if (removedTile) {
                        console.log(`  Removed wall tile at (${tileX},${tileY}) from room ${roomId} layer ${wallLayer.name}`);
                    }
                } else {
                    console.log(`  No wall tile found at (${tileX},${tileY}) in room ${roomId} layer ${wallLayer.name || 'unnamed'}`);
                }
            } catch (error) {
                console.warn(`Error removing wall tile from room ${roomId}:`, error);
            }
        });
    });
}


// Export for global access
window.createWallCollisionBoxes = createWallCollisionBoxes;
window.removeTilesUnderDoor = removeTilesUnderDoor;
window.removeWallTilesForDoorInRoom = removeWallTilesForDoorInRoom;
window.removeWallTilesAtWorldPosition = removeWallTilesAtWorldPosition;
