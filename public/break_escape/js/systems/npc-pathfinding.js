/**
 * NPC PATHFINDING SYSTEM - EasyStar.js Integration
 * ================================================
 *
 * Manages pathfinding for all NPCs using EasyStar.js.
 * Each room has its own pathfinder grid based on wall collision data.
 *
 * Key Concepts:
 * - One pathfinder per room (created when room is loaded)
 * - Patrol bounds: 2 tiles from room edges (walls are on edges)
 * - Paths converted from tile coordinates to world coordinates
 * - Random patrol targets selected from valid positions within bounds
 *
 * @module npc-pathfinding
 */

import { TILE_SIZE, GRID_SIZE, PATHFINDING_STEP } from '../utils/constants.js';

const PATROL_EDGE_OFFSET = 2; // Distance from room edge (2 tiles)

/**
 * Set window.pathfindingDebug = true in the browser console to enable
 * verbose per-check logging for player pathfinding.
 * Automatically respects the existing visualDebugMode toggle (backtick key).
 */
function isDebug() {
    return !!window.pathfindingDebug;
}

/**
 * NPCPathfindingManager - Manages pathfinding for all NPCs across all rooms
 */
export class NPCPathfindingManager {
    constructor(scene) {
        this.scene = scene;
        this.pathfinders = new Map();  // Map<roomId, pathfinder>
        this.grids = new Map();         // Map<roomId, grid>
        this.roomBounds = new Map();   // Map<roomId, {x, y, width, height, mapWidth, mapHeight}>

        // Unified world-level pathfinding grid (finer resolution, spans all rooms)
        this.worldGrid       = null;
        this.worldPathfinder = null;
        this.worldGridBounds = null; // {minX, minY, cols, rows, step}
        this._worldGridDebugGraphics = null;

        // East/West doors use a teleport mechanism and sit inside the wall geometry,
        // so they are blocked by wall physics bodies even when open.  We track each
        // opened side-door corridor here and re-carve it after every grid rebuild.
        this.openSideDoorCorridors = []; // [{worldX, worldY}]

        // North/South doors: track opened positions so we can re-apply the south-edge
        // corner blocks after every rebuildWorldGrid() call.
        this.openNSDoors = []; // [{worldX, worldY}]

        console.log('✅ NPCPathfindingManager initialized');
    }

    /**
     * Initialize pathfinder for a room
     * Called when room is loaded (from rooms.js)
     *
     * @param {string} roomId - Room identifier
     * @param {Object} roomData - Room data from window.rooms[roomId]
     * @param {Object} roomPosition - {x, y} world position of room
     */
    initializeRoomPathfinding(roomId, roomData, roomPosition) {
        try {
            console.log(`📍 initializeRoomPathfinding called for room: ${roomId}`);
            
            if (!roomData) {
                console.warn(`⚠️ Room data is null/undefined for ${roomId}`);
                return;
            }
            
            if (!roomData.map) {
                console.warn(`⚠️ Room ${roomId} has no tilemap, skipping pathfinding init`);
                console.warn(`   roomData keys: ${Object.keys(roomData).join(', ')}`);
                return;
            }

            const mapWidth = roomData.map.width;
            const mapHeight = roomData.map.height;

            console.log(`🔧 Initializing pathfinding for room ${roomId}...`);
            console.log(`   Map dimensions: ${mapWidth}x${mapHeight}`);
            console.log(`   WallsLayers count: ${roomData.wallsLayers ? roomData.wallsLayers.length : 0}`);

            // Build grid from wall collision data
            const grid = this.buildGridFromWalls(roomId, roomData, mapWidth, mapHeight);

            // Create and configure pathfinder
            const pathfinder = new EasyStar.js();
            pathfinder.setGrid(grid);
            pathfinder.setAcceptableTiles([0]);  // 0 = walkable, 1 = wall
            pathfinder.enableDiagonals();

            // Store pathfinder and grid for this room
            this.pathfinders.set(roomId, pathfinder);
            this.grids.set(roomId, grid);

            // Calculate patrol bounds (2 tiles from edges)
            const bounds = {
                x: PATROL_EDGE_OFFSET,
                y: PATROL_EDGE_OFFSET,
                width: Math.max(1, mapWidth - PATROL_EDGE_OFFSET * 2),
                height: Math.max(1, mapHeight - PATROL_EDGE_OFFSET * 2),
                mapWidth: mapWidth,
                mapHeight: mapHeight,
                worldX: roomPosition.x,
                worldY: roomPosition.y
            };

            this.roomBounds.set(roomId, bounds);

            console.log(`✅ Pathfinding initialized for room ${roomId}`);
            console.log(`   Grid: ${mapWidth}x${mapHeight} tiles | Patrol bounds: (${bounds.x}, ${bounds.y}) to (${bounds.x + bounds.width}, ${bounds.y + bounds.height})`);

            // NOTE: refreshGridFromPhysicsBodies() is intentionally NOT called here.
            // buildGridFromWalls() already marks wall tiles + table objects correctly.
            // The physics wall-strip bodies are thin 8px edges that straddle tile
            // boundaries; converting them to tile ranges produces false positives that
            // block walkable tiles.  hasPhysicsLineOfSight() handles exact geometry
            // for LOS checks where it really matters.
            // Call window.refreshPathfindingGrid() from the console if you want to
            // overlay physics bodies onto the grid manually for debugging.

            // Rebuild the unified world grid AFTER a short delay so that all
            // delayedCall(0, ...) callbacks (table setSize/setOffset, wall immovable
            // assignment, etc.) have had a chance to fire first.  Without the delay
            // the grid sees full sprite bounds instead of the trimmed collision strips.
            this.scene.time.delayedCall(200, () => this.rebuildWorldGrid());

        } catch (error) {
            console.error(`❌ Failed to initialize pathfinding for room ${roomId}:`, error);
            console.error('Error stack:', error.stack);
        }
    }

    /**
     * Build collision grid from wall layer data AND table objects
     * 0 = walkable, 1 = wall/obstacle
     *
     * IMPORTANT: Walls are created as collision boxes based on wall tiles by createWallCollisionBoxes().
     * This method marks the same tiles as obstacles in the pathfinding grid so NPCs avoid them.
     * Table objects are also marked from the Tiled map.
     *
     * @private
     */
    buildGridFromWalls(roomId, roomData, mapWidth, mapHeight) {
        const grid = Array(mapHeight).fill().map(() => Array(mapWidth).fill(0));

        // PASS 1: Mark all wall tiles as impassable
        // (Wall collision boxes are created from these same tiles in collision.js)
        if (!roomData.wallsLayers || roomData.wallsLayers.length === 0) {
            console.warn(`⚠️ No wall layers found for room ${roomId}, creating open grid`);
        } else {
            let wallTilesMarked = 0;
            
            // Mark all wall tiles from the tilemap
            roomData.wallsLayers.forEach(wallLayer => {
                try {
                    // Get all non-empty tiles from the wall layer
                    const allWallTiles = wallLayer.getTilesWithin(0, 0, mapWidth, mapHeight, { isNotEmpty: true });

                    allWallTiles.forEach(tile => {
                        // Mark ALL wall tiles as impassable (not just ones with collision properties)
                        // because collision.js creates collision boxes for all wall tiles
                        const tileX = tile.x;
                        const tileY = tile.y;

                        if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
                            grid[tileY][tileX] = 1; // Mark as impassable
                            wallTilesMarked++;
                        }
                    });

                    console.log(`✅ Processed wall layer with ${allWallTiles.length} tiles, marked ${wallTilesMarked} as impassable`);
                } catch (error) {
                    console.error(`❌ Error processing wall layer for room ${roomId}:`, error);
                }
            });
            
            if (wallTilesMarked > 0) {
                console.log(`✅ Total wall tiles marked as obstacles: ${wallTilesMarked}`);
            }
        }

        // NEW: Mark table objects as obstacles in pathfinding grid
        if (roomData.map) {
            // Get the tables object layer from the Phaser tilemap
            const tablesLayer = roomData.map.getObjectLayer('tables');
            
            console.log(`🔍 Looking for tables object layer: ${tablesLayer ? 'Found' : 'Not found'}`);
            
            if (tablesLayer && tablesLayer.objects && tablesLayer.objects.length > 0) {
                let tablesMarked = 0;
                console.log(`📦 Processing ${tablesLayer.objects.length} table objects...`);
                
                tablesLayer.objects.forEach((tableObj, idx) => {
                    try {
                        // Convert world coordinates to tile coordinates
                        const tableWorldX = tableObj.x;
                        const tableWorldY = tableObj.y;
                        const tableWidth = tableObj.width;
                        const tableHeight = tableObj.height;

                        console.log(`  Table ${idx}: (${tableWorldX}, ${tableWorldY}) size ${tableWidth}x${tableHeight}`);

                        // Convert to tile coordinates
                        const startTileX = Math.floor(tableWorldX / TILE_SIZE);
                        const startTileY = Math.floor(tableWorldY / TILE_SIZE);
                        const endTileX = Math.ceil((tableWorldX + tableWidth) / TILE_SIZE);
                        const endTileY = Math.ceil((tableWorldY + tableHeight) / TILE_SIZE);

                        console.log(`  -> Tiles: (${startTileX}, ${startTileY}) to (${endTileX}, ${endTileY})`);

                        // Mark all tiles covered by table as impassable
                        let tilesInTable = 0;
                        for (let tileY = startTileY; tileY < endTileY; tileY++) {
                            for (let tileX = startTileX; tileX < endTileX; tileX++) {
                                if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
                                    grid[tileY][tileX] = 1; // Mark as impassable
                                    tablesMarked++;
                                    tilesInTable++;
                                }
                            }
                        }
                        console.log(`  -> Marked ${tilesInTable} grid cells`);
                    } catch (error) {
                        console.error(`❌ Error processing table object ${idx}:`, error);
                    }
                });

                console.log(`✅ Marked ${tablesMarked} total grid cells as obstacles from ${tablesLayer.objects.length} tables`);
            } else {
                console.warn(`⚠️ Tables object layer not found or empty`);
            }
        } else {
            console.warn(`⚠️ Room map not available for table processing`);
        }

        return grid;
    }

    /**
     * Find a path from start to end position
     * Positions should be world coordinates
     *
     * @param {string} roomId - Room identifier
     * @param {number} startX - Start world X
     * @param {number} startY - Start world Y
     * @param {number} endX - End world X
     * @param {number} endY - End world Y
     * @param {Function} callback - Callback(path) where path is array of world {x, y} or null
     */
    findPath(roomId, startX, startY, endX, endY, callback) {
        const pathfinder = this.pathfinders.get(roomId);
        const bounds = this.roomBounds.get(roomId);

        if (!pathfinder || !bounds) {
            console.warn(`⚠️ No pathfinder for room ${roomId} - room may not be loaded`);
            callback(null);
            return;
        }

        // Validate that start and end positions are within reasonable range of room bounds
        const roomWorldMinX = bounds.worldX;
        const roomWorldMinY = bounds.worldY;
        const roomWorldMaxX = bounds.worldX + (bounds.mapWidth * TILE_SIZE);
        const roomWorldMaxY = bounds.worldY + (bounds.mapHeight * TILE_SIZE);

        // Check if start position is in this room
        if (startX < roomWorldMinX - TILE_SIZE || startX > roomWorldMaxX + TILE_SIZE ||
            startY < roomWorldMinY - TILE_SIZE || startY > roomWorldMaxY + TILE_SIZE) {
            console.warn(`⚠️ Start position (${startX}, ${startY}) is outside room ${roomId} bounds`);
            callback(null);
            return;
        }

        // Check if end position is in this room
        if (endX < roomWorldMinX - TILE_SIZE || endX > roomWorldMaxX + TILE_SIZE ||
            endY < roomWorldMinY - TILE_SIZE || endY > roomWorldMaxY + TILE_SIZE) {
            console.warn(`⚠️ End position (${endX}, ${endY}) is outside room ${roomId} bounds`);
            callback(null);
            return;
        }

        // Convert world coordinates to tile coordinates
        const startTileX = Math.floor((startX - bounds.worldX) / TILE_SIZE);
        const startTileY = Math.floor((startY - bounds.worldY) / TILE_SIZE);
        const endTileX = Math.floor((endX - bounds.worldX) / TILE_SIZE);
        const endTileY = Math.floor((endY - bounds.worldY) / TILE_SIZE);

        // Clamp to valid tile ranges (should already be valid but safety check)
        const clampedStartX = Math.max(0, Math.min(bounds.mapWidth - 1, startTileX));
        const clampedStartY = Math.max(0, Math.min(bounds.mapHeight - 1, startTileY));
        const clampedEndX = Math.max(0, Math.min(bounds.mapWidth - 1, endTileX));
        const clampedEndY = Math.max(0, Math.min(bounds.mapHeight - 1, endTileY));

        // Warn if coordinates were clamped (indicates out of bounds request)
        if (startTileX !== clampedStartX || startTileY !== clampedStartY) {
            console.warn(`⚠️ Start position was clamped from (${startTileX}, ${startTileY}) to (${clampedStartX}, ${clampedStartY})`);
        }
        if (endTileX !== clampedEndX || endTileY !== clampedEndY) {
            console.warn(`⚠️ End position was clamped from (${endTileX}, ${endTileY}) to (${clampedEndX}, ${clampedEndY})`);
        }

        // Find path
        pathfinder.findPath(clampedStartX, clampedStartY, clampedEndX, clampedEndY, (tilePath) => {
            if (tilePath && tilePath.length > 0) {
                // Convert tile path to world path, ensuring all waypoints are within room bounds
                const worldPath = tilePath.map(point => ({
                    x: bounds.worldX + point.x * TILE_SIZE + TILE_SIZE / 2,
                    y: bounds.worldY + point.y * TILE_SIZE + TILE_SIZE / 2
                }));

                // Validate all waypoints are within the room
                const validPath = worldPath.every(wp => 
                    wp.x >= roomWorldMinX && wp.x <= roomWorldMaxX &&
                    wp.y >= roomWorldMinY && wp.y <= roomWorldMaxY
                );

                if (!validPath) {
                    console.warn(`⚠️ Generated path contains waypoints outside room ${roomId} bounds`);
                    callback(null);
                    return;
                }

                callback(worldPath);
            } else {
                callback(null);
            }
        });

        pathfinder.calculate();
    }

    /**
     * Check if there's a clear line of sight between two points
     * Uses Bresenham's line algorithm to check all tiles along the path
     * Also checks adjacent tiles to account for NPC body width (20px ~= 0.6 tiles)
     *
     * @param {string} roomId - Room identifier
     * @param {number} startX - Start world X
     * @param {number} startY - Start world Y
     * @param {number} endX - End world X
     * @param {number} endY - End world Y
     * @returns {boolean} - True if path is clear (all tiles walkable)
     */
    hasLineOfSight(roomId, startX, startY, endX, endY) {
        const grid = this.grids.get(roomId);
        const bounds = this.roomBounds.get(roomId);

        if (!grid || !bounds) {
            return false;
        }

        // Bounds check: ensure both points are within room (with tolerance)
        const roomMinX = bounds.worldX;
        const roomMinY = bounds.worldY;
        const roomMaxX = bounds.worldX + (bounds.mapWidth * TILE_SIZE);
        const roomMaxY = bounds.worldY + (bounds.mapHeight * TILE_SIZE);

        if (startX < roomMinX || startX > roomMaxX || startY < roomMinY || startY > roomMaxY) {
            return false; // Start position outside room
        }
        if (endX < roomMinX || endX > roomMaxX || endY < roomMinY || endY > roomMaxY) {
            return false; // End position outside room
        }

        // Convert world coordinates to tile coordinates.
        // Use Math.floor (consistent with buildGridFromWalls and findPath) so that
        // positions near tile boundaries map to the same tile the grid uses.
        const startTileX = Math.floor((startX - bounds.worldX) / TILE_SIZE);
        const startTileY = Math.floor((startY - bounds.worldY) / TILE_SIZE);
        const endTileX = Math.floor((endX - bounds.worldX) / TILE_SIZE);
        const endTileY = Math.floor((endY - bounds.worldY) / TILE_SIZE);

        // Helper function to check if a tile is walkable
        const isTileWalkable = (tx, ty) => {
            if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) {
                return false; // Out of bounds
            }
            return grid[ty][tx] === 0; // 0 = walkable
        };

        // Bresenham's line algorithm to check all tiles along the line
        const dx = Math.abs(endTileX - startTileX);
        const dy = Math.abs(endTileY - startTileY);
        const sx = startTileX < endTileX ? 1 : -1;
        const sy = startTileY < endTileY ? 1 : -1;
        let err = dx - dy;

        let x = startTileX;
        let y = startTileY;

        while (true) {
            // Check if current tile and adjacent tiles are walkable
            // NPCs are ~20px wide (0.6 tiles), so check the main tile plus one adjacent
            if (!isTileWalkable(x, y)) {
                return false; // Center tile blocked
            }

            // For diagonal movement, check that adjacent tiles are also clear
            // This prevents NPCs from trying to squeeze through diagonal gaps
            if (dx > 0 && dy > 0) { // Moving diagonally
                // Check the perpendicular tiles to ensure enough clearance
                if (!isTileWalkable(x + sx, y) || !isTileWalkable(x, y + sy)) {
                    return false; // Diagonal squeeze - not enough clearance
                }
            }

            // Reached end point
            if (x === endTileX && y === endTileY) {
                break;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return true; // Clear path
    }

    /**
     * Get random valid position within patrol bounds
     * Ensures position is walkable (not on a wall)
     *
     * @param {string} roomId - Room identifier
     * @returns {Object|null} - {x, y} world position or null if no valid position found
     */
    getRandomPatrolTarget(roomId) {
        const bounds = this.roomBounds.get(roomId);
        const grid = this.grids.get(roomId);

        if (!bounds || !grid) {
            console.warn(`⚠️ No bounds/grid for room ${roomId}`);
            console.warn(`   Bounds: ${bounds ? 'exists' : 'MISSING'} | Grid: ${grid ? `exists (${grid.length}x${grid[0]?.length})` : 'MISSING'}`);
            console.warn(`   Available rooms with pathfinding: ${Array.from(this.roomBounds.keys()).join(', ')}`);
            return null;
        }

        // Try up to 20 random positions
        const maxAttempts = 20;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const randTileX = bounds.x + Math.floor(Math.random() * bounds.width);
            const randTileY = bounds.y + Math.floor(Math.random() * bounds.height);

            // Validate indices
            if (randTileY < 0 || randTileY >= grid.length || randTileX < 0 || randTileX >= grid[0].length) {
                continue;
            }

            // Check if this tile is walkable
            if (grid[randTileY] && grid[randTileY][randTileX] === 0) {
                // Convert to world coordinates (center of tile)
                const worldX = bounds.worldX + randTileX * TILE_SIZE + TILE_SIZE / 2;
                const worldY = bounds.worldY + randTileY * TILE_SIZE + TILE_SIZE / 2;

                console.log(`✅ Random patrol target for ${roomId}: (${randTileX}, ${randTileY}) → (${worldX}, ${worldY})`);
                return { x: worldX, y: worldY };
            }
        }

        console.warn(`⚠️ Could not find valid random position in ${roomId} after ${maxAttempts} attempts`);
        console.warn(`   Bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`);
        console.warn(`   Grid size: ${grid.length}x${grid[0]?.length}`);
        return null;
    }

    /**
     * Get pathfinder for a room (for debugging)
     */
    getPathfinder(roomId) {
        return this.pathfinders.get(roomId);
    }

    /**
     * Get grid for a room (for debugging)
     */
    getGrid(roomId) {
        return this.grids.get(roomId);
    }

    /**
     * Get bounds for a room (for debugging)
     */
    getBounds(roomId) {
        return this.roomBounds.get(roomId);
    }

    /**
     * Mark door tiles as walkable in the pathfinding grid
     * Called when a door is unlocked/opened
     * 
     * @param {string} roomId - Room containing the door
     * @param {number} worldX - World X position of door
     * @param {number} worldY - World Y position of door
     * @param {string} direction - Door direction (north/south/east/west)
     */
    markDoorWalkable(roomId, worldX, worldY, direction) {
        const grid = this.grids.get(roomId);
        const pathfinder = this.pathfinders.get(roomId);
        const bounds = this.roomBounds.get(roomId);

        if (!grid || !pathfinder || !bounds) {
            console.warn(`⚠️ Cannot update door pathfinding - room ${roomId} not initialized`);
            return;
        }

        // Convert world coordinates to tile coordinates
        const tileX = Math.floor((worldX - bounds.worldX) / TILE_SIZE);
        const tileY = Math.floor((worldY - bounds.worldY) / TILE_SIZE);

        // Mark door tiles as walkable (typically 2 tiles for a door)
        const tilesToMark = [];
        
        switch (direction) {
            case 'north':
            case 'south':
                // Horizontal door - 2 tiles wide
                tilesToMark.push({ x: tileX, y: tileY });
                tilesToMark.push({ x: tileX + 1, y: tileY });
                break;
            case 'east':
            case 'west':
                // Vertical door - 2 tiles high
                tilesToMark.push({ x: tileX, y: tileY });
                tilesToMark.push({ x: tileX, y: tileY + 1 });
                break;
        }

        let markedCount = 0;
        tilesToMark.forEach(tile => {
            if (tile.y >= 0 && tile.y < grid.length && 
                tile.x >= 0 && tile.x < grid[0].length) {
                if (grid[tile.y][tile.x] === 1) {
                    grid[tile.y][tile.x] = 0; // Mark as walkable
                    markedCount++;
                }
            }
        });

        // Update the pathfinder with the new grid
        pathfinder.setGrid(grid);

        console.log(`✅ Marked ${markedCount} door tiles as walkable in ${roomId} at (${tileX}, ${tileY}) direction: ${direction}`);

        // Unblock the corresponding cells in the world grid too
        const doorWorldX = bounds.worldX + tileX * TILE_SIZE;
        const doorWorldY = bounds.worldY + tileY * TILE_SIZE;
        const doorW = (direction === 'north' || direction === 'south') ? TILE_SIZE * 2 : TILE_SIZE;
        const doorH = (direction === 'east'  || direction === 'west')  ? TILE_SIZE * 2 : TILE_SIZE;
        this.markWorldCellsWalkable(doorWorldX, doorWorldY, doorW, doorH);

        // For N/S doors, keep one extra grid cell blocked on each outer corner of the
        // south (bottom) edge of the opening.  This prevents the player from clipping
        // through at high approach angles.  Store the position so the blocks survive
        // a later rebuildWorldGrid() call.
        if (direction === 'north' || direction === 'south') {
            if (!this.openNSDoors.some(d => d.worldX === doorWorldX && d.worldY === doorWorldY)) {
                this.openNSDoors.push({ worldX: doorWorldX, worldY: doorWorldY });
            }
            this._applyNSDoorCornerBlocks(doorWorldX, doorWorldY);
        }
    }

    // =========================================================================
    // UNIFIED WORLD GRID
    // One EasyStar grid at PATHFINDING_STEP (16px) resolution covering all rooms.
    // Built from every immovable/static physics body in the scene, so walls,
    // furniture and locked doors are all blocked automatically.
    // Rebuilt each time a new room is initialised and when a door is opened.
    // =========================================================================

    /**
     * (Re)build the unified world-level EasyStar grid from all physics bodies.
     * Called automatically at the end of initializeRoomPathfinding().
     */
    rebuildWorldGrid() {
        const scene = this.scene;
        if (!scene?.physics?.world) return;

        const wb = scene.physics.world.bounds;
        if (!wb || wb.width === 0 || wb.height === 0) {
            console.warn('⚠️ rebuildWorldGrid: physics world bounds not set yet');
            return;
        }

        const step = PATHFINDING_STEP;
        const minX = wb.x;
        const minY = wb.y;
        const cols = Math.ceil(wb.width  / step) + 2; // +2 safety margin
        const rows = Math.ceil(wb.height / step) + 2;

        const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

        // Mark every grid cell that substantially overlaps an immovable physics body.
        // Subtracting 1 before flooring the right/bottom edge prevents a body whose
        // edge sits exactly on a boundary from blocking the adjacent walkable cell.
        const markBlocked = (left, top, right, bottom) => {
            // Expand by 1 extra cell horizontally — the player body is wider than
            // tall, so a gap that fits vertically may not fit the collision box.
            const cx1 = Math.max(0, Math.floor((left   - minX) / step) - 1);
            const cy1 = Math.max(0, Math.floor((top    - minY) / step));
            const cx2 = Math.min(cols - 1, Math.floor((right  - minX - 1) / step) + 1);
            const cy2 = Math.min(rows - 1, Math.floor((bottom - minY - 1) / step));
            for (let cy = cy1; cy <= cy2; cy++) {
                for (let cx = cx1; cx <= cx2; cx++) grid[cy][cx] = 1;
            }
        };

        // Phaser static bodies (StaticGroups etc.)
        scene.physics.world.staticBodies.iterate(body => {
            if (body.enable) markBlocked(body.left, body.top, body.right, body.bottom);
        });

        // Dynamic-but-immovable bodies: wall strips, locked doors, furniture
        scene.physics.world.bodies.iterate(body => {
            if (body.enable && body.immovable) {
                markBlocked(body.left, body.top, body.right, body.bottom);
            }
        });

        this.worldGridBounds = { minX, minY, cols, rows, step };
        this.worldGrid = grid;

        const pf = new EasyStar.js();
        pf.setGrid(grid);
        pf.setAcceptableTiles([0]);
        pf.enableDiagonals();
        this.worldPathfinder = pf;

        const blocked = grid.reduce((n, row) => n + row.filter(v => v === 1).length, 0);
        console.log(`✅ World grid rebuilt: ${cols}×${rows} @${step}px — ${blocked} blocked`);

        // Re-carve any east/west door corridors that were opened before this rebuild.
        for (const corridor of this.openSideDoorCorridors) {
            this._carveSideDoorCorridor(corridor.worldX, corridor.worldY, corridor.direction);
        }

        // Re-apply south-edge corner blocks for any opened N/S doors.
        for (const door of this.openNSDoors) {
            this._applyNSDoorCornerBlocks(door.worldX, door.worldY);
        }
    }

    /**
     * Temporarily mark grid cells occupied by active (movable) NPCs as avoided
     * on the world pathfinder, so the player routes around them.
     * skipCX/skipCY: grid cell to never avoid (the player's start cell).
     */
    _avoidNPCPositions(skipCX, skipCY) {
        if (!this.worldPathfinder || !this.worldGridBounds || !window.rooms) return;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        for (const roomId in window.rooms) {
            const room = window.rooms[roomId];
            if (!room.npcSprites) continue;
            for (const sprite of room.npcSprites) {
                const body = sprite.body;
                if (!body || !body.enable || body.immovable) continue;
                // Expand by 2 cells horizontally (1 for player width + 1 extra padding)
                // and 1 cell vertically so the player gives NPCs a clear berth.
                const cx1 = clamp(Math.floor((body.left   - minX) / step) - 2, 0, cols - 1);
                const cy1 = clamp(Math.floor((body.top    - minY) / step) - 1, 0, rows - 1);
                const cx2 = clamp(Math.floor((body.right  - minX - 1) / step) + 2, 0, cols - 1);
                const cy2 = clamp(Math.floor((body.bottom - minY - 1) / step) + 1, 0, rows - 1);
                for (let cy = cy1; cy <= cy2; cy++) {
                    for (let cx = cx1; cx <= cx2; cx++) {
                        if (cx === skipCX && cy === skipCY) continue; // never block start cell
                        if (this.worldGrid[cy]?.[cx] === 0) {         // only avoid walkable cells
                            this.worldPathfinder.avoidAdditionalPoint(cx, cy);
                        }
                    }
                }
            }
        }
    }

    /**
     * Find a path via the unified world grid (works across any rooms).
     * Callback receives an array of world {x,y} waypoints, or null on failure.
     * Pass avoidNPCs=true (player only) to route around active NPC bodies.
     */
    findWorldPath(startX, startY, endX, endY, callback, avoidNPCs = false) {
        if (!this.worldPathfinder || !this.worldGridBounds) {
            console.warn('⚠️ findWorldPath: world grid not ready');
            callback(null);
            return;
        }
        const { minX, minY, cols, rows, step } = this.worldGridBounds;
        const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const toCX   = wx => clamp(Math.floor((wx - minX) / step), 0, cols - 1);
        const toCY   = wy => clamp(Math.floor((wy - minY) / step), 0, rows - 1);
        const toWorld = (cx, cy) => ({
            x: minX + cx * step + step / 2,
            y: minY + cy * step + step / 2
        });

        // Temporarily avoid cells occupied by active NPCs so the player routes
        // around them. Cleared inside the callback once calculate() has run.
        if (avoidNPCs) this._avoidNPCPositions(toCX(startX), toCY(startY));

        this.worldPathfinder.findPath(toCX(startX), toCY(startY), toCX(endX), toCY(endY), (tilePath) => {
            if (avoidNPCs) this.worldPathfinder.stopAvoidingAllAdditionalPoints();
            callback(tilePath?.length > 0 ? tilePath.map(p => toWorld(p.x, p.y)) : null);
        });
        this.worldPathfinder.calculate();
    }

    /**
     * Find the nearest walkable cell in the world grid to a world position.
     * Returns the Euclidean-closest walkable cell, or null if none within maxRadius.
     */
    findNearestWalkableWorldCell(worldX, worldY, maxRadius = 8) {
        if (!this.worldGrid || !this.worldGridBounds) return null;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;

        const centerCX = Math.floor((worldX - minX) / step);
        const centerCY = Math.floor((worldY - minY) / step);

        if (centerCY >= 0 && centerCY < rows && centerCX >= 0 && centerCX < cols &&
            this.worldGrid[centerCY][centerCX] === 0) {
            return { x: minX + centerCX * step + step / 2, y: minY + centerCY * step + step / 2 };
        }

        let best = null, bestDistSq = Infinity;
        for (let r = 1; r <= maxRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    const cx = centerCX + dx, cy = centerCY + dy;
                    if (cy < 0 || cy >= rows || cx < 0 || cx >= cols) continue;
                    if (this.worldGrid[cy][cx] !== 0) continue;
                    const wx = minX + cx * step + step / 2;
                    const wy = minY + cy * step + step / 2;
                    const distSq = (wx - worldX) ** 2 + (wy - worldY) ** 2;
                    if (distSq < bestDistSq) { bestDistSq = distSq; best = { x: wx, y: wy }; }
                }
            }
            if (best !== null) break;
        }
        return best;
    }

    /**
     * Find the walkable cell that is (a) actually reachable from a start position
     * and (b) Euclidean-closest to a desired target world position.
     *
     * Unlike findNearestWalkableWorldCell (which only checks walkability and may
     * return a cell in a disconnected region the player can never path to), this
     * flood-fills the connected component containing the start cell, then picks the
     * reachable cell nearest the target. Used when an exact click target is
     * unreachable so the player walks as close as possible instead of bee-lining.
     *
     * Returns a world {x, y}, or null if no walkable start cell can be found.
     */
    findNearestReachableWorldCell(startX, startY, targetX, targetY) {
        if (!this.worldGrid || !this.worldGridBounds) return null;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;

        let startCX = Math.floor((startX - minX) / step);
        let startCY = Math.floor((startY - minY) / step);
        if (startCX < 0 || startCX >= cols || startCY < 0 || startCY >= rows) return null;

        // The player's feet often sit in a blocked cell (right against a wall or in
        // a doorway). Snap the flood-fill origin to the nearest walkable cell so we
        // still find a reachable component instead of bailing out (which would let
        // the caller fall back to bee-lining straight at the unreachable target).
        if (this.worldGrid[startCY][startCX] !== 0) {
            const snapped = this.findNearestWalkableWorldCell(startX, startY);
            if (!snapped) return null;
            startCX = Math.floor((snapped.x - minX) / step);
            startCY = Math.floor((snapped.y - minY) / step);
            if (this.worldGrid[startCY][startCX] !== 0) return null;
        }

        const targetCX = (targetX - minX) / step;
        const targetCY = (targetY - minY) / step;

        const visited = new Uint8Array(cols * rows);
        const idx = (cx, cy) => cy * cols + cx;
        const queue = [[startCX, startCY]];
        visited[idx(startCX, startCY)] = 1;

        let best = null, bestDistSq = Infinity;
        // 8-connected flood (grid pathfinder uses diagonals).
        const neighbours = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        for (let head = 0; head < queue.length; head++) {
            const [cx, cy] = queue[head];
            const distSq = (cx - targetCX) ** 2 + (cy - targetCY) ** 2;
            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                best = { x: minX + cx * step + step / 2, y: minY + cy * step + step / 2 };
            }
            for (const [dx, dy] of neighbours) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                const ni = idx(nx, ny);
                if (visited[ni] || this.worldGrid[ny][nx] !== 0) continue;
                visited[ni] = 1;
                queue.push([nx, ny]);
            }
        }
        return best;
    }

    /**
     * Mark a rectangular area as walkable in the world grid.
     * Used when a door is unlocked (removes the door body's blocked cells).
     */
    /**
     * Register and immediately carve a walkable corridor for an opened east/west
     * (side) door.  East/West doors sit inside the shared wall geometry so the
     * grid would otherwise block the path even when the door is open.
     *
     * Spans both the door tile in the current room and the adjacent door tile in
     * the connected room (one TILE_SIZE away in the door direction).
     * The top and bottom rows of the combined span stay blocked to prevent corner clipping.
     */
    markSideDoorCorridor(worldX, worldY, direction) {
        // Store so rebuildWorldGrid() can reapply after future rebuilds.
        if (!this.openSideDoorCorridors.some(c => c.worldX === worldX && c.worldY === worldY)) {
            this.openSideDoorCorridors.push({ worldX, worldY, direction });
        }
        this._carveSideDoorCorridor(worldX, worldY, direction);
    }

    /** Internal: carve the corridor cells without storing (used by rebuild too).
     *
     * Each side of the doorway has a 1×1 tile (32×32 px = 4×4 grid cells at 8 px
     * step). We span BOTH tiles (current room + adjacent room, one TILE_SIZE apart
     * in the door direction) and clear only the middle 2 rows, leaving the top and
     * bottom rows blocked to prevent corner clipping.
     *
     *   BBBBBBBB   ← top row stays blocked  (both tiles)
     *   ........   ← cleared (walkable)
     *   ........   ← cleared (walkable)
     *   BBBBBBBB   ← bottom row stays blocked (both tiles)
     */
    _carveSideDoorCorridor(worldX, worldY, direction) {
        if (!this.worldGrid || !this.worldGridBounds) return;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;

        const halfTile = TILE_SIZE / 2;
        const top = worldY - halfTile;

        // The adjacent room's tile is one TILE_SIZE away in the door direction.
        // Extend the horizontal span to cover both tiles.
        let spanLeft, spanWidth;
        if (direction === 'east') {
            // This tile is left of the wall; adjacent tile is to the right.
            spanLeft  = worldX - halfTile;
            spanWidth = TILE_SIZE * 2;
        } else {
            // west — this tile is right of the wall; adjacent tile is to the left.
            spanLeft  = worldX - halfTile - TILE_SIZE;
            spanWidth = TILE_SIZE * 2;
        }

        // Grid cell range covering both tiles (8 columns × 4 rows at 8 px step).
        const cx1 = Math.max(0,        Math.floor((spanLeft               - minX) / step));
        const cy1 = Math.max(0,        Math.floor((top                    - minY) / step));
        const cx2 = Math.min(cols - 1, Math.floor((spanLeft + spanWidth - 1 - minX) / step));
        const cy2 = Math.min(rows - 1, Math.floor((top  + TILE_SIZE    - 1 - minY) / step));

        // Clear the middle rows (skip first and last row of the tile height).
        for (let cy = cy1 + 1; cy <= cy2 - 1; cy++) {
            for (let cx = cx1; cx <= cx2; cx++) this.worldGrid[cy][cx] = 0;
        }
        // Ensure top and bottom rows stay blocked across both tiles.
        for (let cx = cx1; cx <= cx2; cx++) this.worldGrid[cy1][cx] = 1;
        for (let cx = cx1; cx <= cx2; cx++) this.worldGrid[cy2][cx] = 1;

        this.worldPathfinder?.setGrid(this.worldGrid);
        console.log(`🚪 Side-door corridor carved at (${worldX.toFixed(0)},${worldY.toFixed(0)}) dir=${direction} — cells (${cx1},${cy1})→(${cx2},${cy2}), cleared rows ${cy1+1}–${cy2-1}`);
    }

    /**
     * Re-block the single outermost grid cell on each side of the south (bottom)
     * edge of an opened N/S door opening.  The two interior cells remain walkable;
     * only the very first and very last column of the bottom row are blocked.
     *
     * Door opening layout (8 px step, 2×TILE_SIZE wide, 1×TILE_SIZE tall):
     *
     *   . . . . . . . .   ← fully walkable (upper rows)
     *   B . . . . . . B   ← south edge: outer corners blocked, centre open
     *
     * This prevents the player from catching on the door frame when approaching
     * at a steep angle, without narrowing the usable passage width significantly.
     */
    _applyNSDoorCornerBlocks(doorWorldX, doorWorldY) {
        if (!this.worldGrid || !this.worldGridBounds) return;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;

        const doorW = TILE_SIZE * 2;
        const doorH = TILE_SIZE;

        const cx1 = Math.max(0,        Math.floor((doorWorldX          - minX) / step));
        const cx2 = Math.min(cols - 1, Math.ceil( (doorWorldX + doorW  - minX) / step));
        const cy2 = Math.min(rows - 1, Math.ceil( (doorWorldY + doorH  - minY) / step));

        if (this.worldGrid[cy2]) {
            this.worldGrid[cy2][cx1] = 1;
            this.worldGrid[cy2][cx2] = 1;
        }
        this.worldPathfinder?.setGrid(this.worldGrid);
        console.log(`🚪 N/S door corner blocks applied at (${doorWorldX.toFixed(0)},${doorWorldY.toFixed(0)}) — blocked (${cx1},${cy2}) and (${cx2},${cy2})`);
    }

    markWorldCellsWalkable(worldX, worldY, width, height) {
        if (!this.worldGrid || !this.worldGridBounds) return;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;
        const cx1 = Math.max(0, Math.floor((worldX         - minX) / step));
        const cy1 = Math.max(0, Math.floor((worldY         - minY) / step));
        const cx2 = Math.min(cols - 1, Math.ceil((worldX + width  - minX) / step));
        const cy2 = Math.min(rows - 1, Math.ceil((worldY + height - minY) / step));
        for (let cy = cy1; cy <= cy2; cy++) {
            for (let cx = cx1; cx <= cx2; cx++) this.worldGrid[cy][cx] = 0;
        }
        this.worldPathfinder?.setGrid(this.worldGrid);
    }

    /**
     * Physics LOS check that works across ALL loaded rooms.
     * Uses the same immovable-body sources as rebuildWorldGrid(), so walls AND
     * furniture are both tested. Uses the same fat 3-ray sweep as hasPhysicsLineOfSight().
     */
    hasWorldPhysicsLineOfSight(x1, y1, x2, y2, bodyMargin = 2, bodyHalfWidth = 9) {
        const scene = this.scene;
        if (!scene?.physics?.world) return true;

        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const px = len > 0.001 ? -dy / len : 1;
        const py = len > 0.001 ?  dx / len : 0;

        const rays = [
            { ax: x1,                      ay: y1,                      bx: x2,                      by: y2 },
            { ax: x1 + px * bodyHalfWidth, ay: y1 + py * bodyHalfWidth, bx: x2 + px * bodyHalfWidth, by: y2 + py * bodyHalfWidth },
            { ax: x1 - px * bodyHalfWidth, ay: y1 - py * bodyHalfWidth, bx: x2 - px * bodyHalfWidth, by: y2 - py * bodyHalfWidth },
        ];

        const testBody = (body) => {
            if (!body.enable) return false;
            const left   = body.left   - bodyMargin;
            const right  = body.right  + bodyMargin;
            const top    = body.top    - bodyMargin;
            const bottom = body.bottom + bodyMargin;
            for (const ray of rays) {
                if (_segmentIntersectsAABB(ray.ax, ray.ay, ray.bx, ray.by, left, top, right, bottom)) {
                    if (isDebug()) console.log(`🧱 worldLOS BLOCKED (${left.toFixed(0)},${top.toFixed(0)})→(${right.toFixed(0)},${bottom.toFixed(0)})`);
                    return true;
                }
            }
            return false;
        };

        // Static bodies (Phaser StaticGroups etc.)
        let blocked = false;
        scene.physics.world.staticBodies.iterate(body => {
            if (!blocked && testBody(body)) blocked = true;
        });
        if (blocked) return false;

        // Dynamic-but-immovable bodies: wall strips, furniture, locked doors
        scene.physics.world.bodies.iterate(body => {
            if (!blocked && body.immovable && testBody(body)) blocked = true;
        });

        return !blocked;
    }

    /**
     * Greedy string-pull using hasWorldPhysicsLineOfSight — no roomId needed.
     * Should be used for all player path smoothing.
     */
    smoothWorldPathForPlayer(startX, startY, path) {
        if (!path || path.length <= 1) return path;
        const debug = isDebug();
        const smoothed = [];
        let cx = startX, cy = startY, i = 0;

        while (i < path.length) {
            let farthest = i;
            for (let j = path.length - 1; j > i; j--) {
                if (this.hasWorldPhysicsLineOfSight(cx, cy, path[j].x, path[j].y)) {
                    farthest = j; break;
                }
            }
            if (debug) {
                const p = path[farthest];
                console.log(`  smooth: (${cx.toFixed(0)},${cy.toFixed(0)}) → [${farthest}](${p.x.toFixed(0)},${p.y.toFixed(0)})`);
            }
            smoothed.push(path[farthest]);
            cx = path[farthest].x; cy = path[farthest].y;
            i = farthest + 1;
        }
        return smoothed.length > 0 ? smoothed : path;
    }

    /**
     * Draw a colour-coded overlay of the unified world grid.
     * Red = blocked, faint green = walkable.
     */
    drawWorldGridDebug(scene) {
        this.clearWorldGridDebug();
        if (!this.worldGrid || !this.worldGridBounds || !scene) {
            console.warn('drawWorldGridDebug: world grid not ready — try window.refreshPathfindingGrid() first');
            return null;
        }
        const { minX, minY, cols, rows, step } = this.worldGridBounds;
        const g = scene.add.graphics();
        g.setDepth(851);
        this._worldGridDebugGraphics = g;

        for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
                const wx = minX + cx * step;
                const wy = minY + cy * step;
                if (this.worldGrid[cy][cx] === 1) {
                    g.fillStyle(0xff2222, 0.45);
                } else {
                    g.fillStyle(0x22ff44, 0.08);
                }
                g.fillRect(wx + 1, wy + 1, step - 2, step - 2);
            }
        }
        console.log(`🗺️ World grid debug: ${cols}×${rows} @${step}px`);
        return g;
    }

    clearWorldGridDebug() {
        if (this._worldGridDebugGraphics) {
            this._worldGridDebugGraphics.destroy();
            this._worldGridDebugGraphics = null;
        }
    }

    /**
     * Optional: bake actual physics bodies onto the per-room EasyStar tile grid.
     * Not called automatically (see comment in initializeRoomPathfinding).
     * Available for debugging via window.refreshPathfindingGrid().
     *
     * @param {string} roomId
     * @returns {number} Number of newly-blocked tiles (0 if nothing to do)
     */
    refreshGridFromPhysicsBodies(roomId) {
        const grid = this.grids.get(roomId);
        const pathfinder = this.pathfinders.get(roomId);
        const bounds = this.roomBounds.get(roomId);
        const room = window.rooms?.[roomId];

        if (!grid || !pathfinder || !bounds || !room?.wallCollisionBoxes?.length) {
            return 0;
        }

        let marked = 0;
        for (const box of room.wallCollisionBoxes) {
            if (!box?.body) continue;

            // Convert the physics AABB to tile ranges (any tile the body overlaps)
            const tileX1 = Math.floor((box.body.left   - bounds.worldX) / TILE_SIZE);
            const tileY1 = Math.floor((box.body.top    - bounds.worldY) / TILE_SIZE);
            const tileX2 = Math.floor((box.body.right  - bounds.worldX) / TILE_SIZE);
            const tileY2 = Math.floor((box.body.bottom - bounds.worldY) / TILE_SIZE);

            for (let ty = tileY1; ty <= tileY2; ty++) {
                for (let tx = tileX1; tx <= tileX2; tx++) {
                    if (ty >= 0 && ty < grid.length && tx >= 0 && tx < grid[0].length) {
                        if (grid[ty][tx] === 0) {
                            grid[ty][tx] = 1; // block
                            marked++;
                        }
                    }
                }
            }
        }

        if (marked > 0) {
            pathfinder.setGrid(grid);
            console.log(`✅ refreshGridFromPhysicsBodies [${roomId}]: marked ${marked} additional tiles from ${room.wallCollisionBoxes.length} physics bodies`);
        }
        return marked;
    }

    /**
     * Draw a colour-coded tile overlay for the pathfinding grid.
     *
     * Red   = impassable (value 1)
     * Green = walkable   (value 0, faint)
     *
     * @param {string}       roomId - Room to visualise
     * @param {Phaser.Scene} scene  - Active Phaser scene (for graphics factory)
     * @returns {Phaser.GameObjects.Graphics|null}
     */
    drawGridDebug(roomId, scene) {
        const grid   = this.grids.get(roomId);
        const bounds = this.roomBounds.get(roomId);
        if (!grid || !bounds || !scene) {
            console.warn(`⚠️ drawGridDebug: missing grid/bounds/scene for room "${roomId}"`);
            return null;
        }

        this.clearGridDebug();

        const g = scene.add.graphics();
        g.setDepth(850); // Above game objects, below path overlay
        this._gridDebugGraphics = g;

        const rows = grid.length;
        const cols = grid[0].length;

        for (let ty = 0; ty < rows; ty++) {
            for (let tx = 0; tx < cols; tx++) {
                const wx = bounds.worldX + tx * TILE_SIZE;
                const wy = bounds.worldY + ty * TILE_SIZE;
                if (grid[ty][tx] === 1) {
                    // Impassable — semi-transparent red
                    g.fillStyle(0xff2222, 0.40);
                    g.fillRect(wx + 1, wy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                } else {
                    // Walkable — very faint green
                    g.fillStyle(0x22ff44, 0.10);
                    g.fillRect(wx + 1, wy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                }
            }
        }

        console.log(`🗺️ Grid debug drawn for room "${roomId}": ${cols}×${rows} tiles`);
        return g;
    }

    /**
     * Remove the grid debug overlay created by drawGridDebug().
     */
    clearGridDebug() {
        if (this._gridDebugGraphics) {
            this._gridDebugGraphics.destroy();
            this._gridDebugGraphics = null;
        }
    }

    /**
     * Smooth a raw EasyStar path using greedy string-pulling.
     *
     * Scans from the end of the remaining path to find the furthest waypoint
     * reachable by clear line-of-sight from the current position, then jumps
     * there.  This collapses redundant tile-by-tile steps into direct segments,
     * eliminating zigzagging and ensuring every kept waypoint is actually
     * unobstructed from the previous one.
     *
     * @param {string} roomId  - Room identifier
     * @param {number} startX  - World X of the starting position (usually current player pos)
     * @param {number} startY  - World Y of the starting position
     * @param {Array}  path    - Raw world-coordinate waypoint array from findPath()
     * @returns {Array} Smoothed waypoint array (may equal path if already optimal)
     */
    smoothPath(roomId, startX, startY, path) {
        if (!path || path.length <= 1) return path;

        const smoothed = [];
        let cx = startX;
        let cy = startY;
        let i = 0;

        while (i < path.length) {
            // Scan backwards from the end to find the farthest directly-visible waypoint
            let farthest = i; // default: just step to the very next waypoint
            for (let j = path.length - 1; j > i; j--) {
                if (this.hasLineOfSight(roomId, cx, cy, path[j].x, path[j].y)) {
                    farthest = j;
                    break;
                }
            }

            smoothed.push(path[farthest]);
            cx = path[farthest].x;
            cy = path[farthest].y;
            i = farthest + 1;
        }

        return smoothed.length > 0 ? smoothed : path;
    }

    /**
     * Find the nearest walkable tile to a world position using a spiral search.
     * Useful when a click target lands inside an obstacle tile.
     *
     * @param {string} roomId - Room identifier
     * @param {number} worldX - Desired world X
     * @param {number} worldY - Desired world Y
     * @param {number} [maxRadius=4] - Maximum tile radius to search
     * @returns {{x: number, y: number}|null} - World coords of nearest walkable tile centre, or null
     */
    findNearestWalkableTile(roomId, worldX, worldY, maxRadius = 4) {
        const grid = this.grids.get(roomId);
        const bounds = this.roomBounds.get(roomId);
        if (!grid || !bounds) return null;

        const centerTileX = Math.floor((worldX - bounds.worldX) / TILE_SIZE);
        const centerTileY = Math.floor((worldY - bounds.worldY) / TILE_SIZE);

        // Already walkable — return center of that tile
        if (centerTileY >= 0 && centerTileY < grid.length &&
            centerTileX >= 0 && centerTileX < grid[0].length &&
            grid[centerTileY][centerTileX] === 0) {
            return {
                x: bounds.worldX + centerTileX * TILE_SIZE + TILE_SIZE / 2,
                y: bounds.worldY + centerTileY * TILE_SIZE + TILE_SIZE / 2
            };
        }

        // Spiral outward, collecting ALL candidates within maxRadius, then return
        // the one closest by Euclidean distance to the original world position.
        // (The old code returned the first found in scan order, which could be a
        // tile diagonally opposite to the actual nearest walkable tile.)
        let best = null;
        let bestDistSq = Infinity;

        for (let r = 1; r <= maxRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    // Only check the ring at radius r (not inner tiles already checked)
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;

                    const tx = centerTileX + dx;
                    const ty = centerTileY + dy;

                    if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) continue;
                    if (grid[ty][tx] !== 0) continue;

                    const cx = bounds.worldX + tx * TILE_SIZE + TILE_SIZE / 2;
                    const cy = bounds.worldY + ty * TILE_SIZE + TILE_SIZE / 2;
                    const ddx = cx - worldX;
                    const ddy = cy - worldY;
                    const distSq = ddx * ddx + ddy * ddy;
                    if (distSq < bestDistSq) {
                        bestDistSq = distSq;
                        best = { x: cx, y: cy };
                    }
                }
            }
            // Early exit: once we've scanned the whole ring at r and found a candidate,
            // any tile at r+1 will be farther away, so stop.
            if (best !== null) break;
        }

        return best;
    }

    /**
     * Check LOS against the actual Phaser physics bodies in room.wallCollisionBoxes.
     *
     * Performs a "fat segment" sweep: three parallel rays are tested — the centre
     * line plus two offset by ±bodyHalfWidth perpendicular to the travel direction.
     * This accurately represents whether the full width of the player's collision
     * box can travel the segment without touching a wall body.
     *
     * Falls back to tile-grid LOS when no collision boxes are loaded yet.
     *
     * @param {string} roomId
     * @param {number} x1           - start world X (player body centre)
     * @param {number} y1           - start world Y
     * @param {number} x2           - end world X
     * @param {number} y2           - end world Y
     * @param {number} [bodyMargin=2]      - extra clearance in px around each AABB (small — body width handles the rest)
     * @param {number} [bodyHalfWidth=9]   - half the player collision box width (atlas body = 18px → 9px)
     * @returns {boolean}
     */
    hasPhysicsLineOfSight(roomId, x1, y1, x2, y2, bodyMargin = 2, bodyHalfWidth = 9) {
        const room = window.rooms?.[roomId];
        if (!room || !room.wallCollisionBoxes || room.wallCollisionBoxes.length === 0) {
            if (isDebug()) {
                const reason = !room ? 'no room data' : 'no wallCollisionBoxes';
                console.log(`🔍 physLOS (${x1.toFixed(0)},${y1.toFixed(0)})→(${x2.toFixed(0)},${y2.toFixed(0)}): falling back to tile grid (${reason})`);
            }
            return this.hasLineOfSight(roomId, x1, y1, x2, y2);
        }

        // Compute perpendicular unit vector to the travel direction.
        // Used to offset the two side rays by ±bodyHalfWidth.
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        // perpendicular is (-dy, dx) normalised; if segment is zero-length use (1,0)
        const px = len > 0.001 ? -dy / len : 1;
        const py = len > 0.001 ?  dx / len : 0;

        // Three parallel rays: centre, left edge, right edge
        const rays = [
            { ax: x1,                     ay: y1,                     bx: x2,                     by: y2 },
            { ax: x1 + px * bodyHalfWidth, ay: y1 + py * bodyHalfWidth, bx: x2 + px * bodyHalfWidth, by: y2 + py * bodyHalfWidth },
            { ax: x1 - px * bodyHalfWidth, ay: y1 - py * bodyHalfWidth, bx: x2 - px * bodyHalfWidth, by: y2 - py * bodyHalfWidth },
        ];

        const boxes = room.wallCollisionBoxes;
        for (const box of boxes) {
            if (!box?.body) continue;
            const left   = box.body.left   - bodyMargin;
            const right  = box.body.right  + bodyMargin;
            const top    = box.body.top    - bodyMargin;
            const bottom = box.body.bottom + bodyMargin;

            for (const ray of rays) {
                if (_segmentIntersectsAABB(ray.ax, ray.ay, ray.bx, ray.by, left, top, right, bottom)) {
                    if (isDebug()) {
                        console.log(`🧱 physLOS BLOCKED: box(${left.toFixed(0)},${top.toFixed(0)})→(${right.toFixed(0)},${bottom.toFixed(0)}) hit by ray (${ray.ax.toFixed(0)},${ray.ay.toFixed(0)})→(${ray.bx.toFixed(0)},${ray.by.toFixed(0)})`);
                    }
                    return false;
                }
            }
        }

        if (isDebug()) {
            console.log(`✅ physLOS CLEAR (3-ray fat sweep, halfWidth=${bodyHalfWidth})`);
        }

        // Physics bodies are the authoritative source for what blocks the player.
        // EasyStar still uses the tile grid for routing so paths avoid wall-face tiles
        // and table objects correctly.
        return true;
    }

    /**
     * Like smoothPath but uses hasPhysicsLineOfSight for each segment test.
     * Should be used for player movement where exact wall geometry matters.
     *
     * @param {string} roomId
     * @param {number} startX - current player world X
     * @param {number} startY - current player world Y
     * @param {Array}  path   - raw world-coordinate waypoint array
     * @returns {Array} smoothed waypoints
     */
    smoothPathForPlayer(roomId, startX, startY, path) {
        if (!path || path.length <= 1) return path;

        const debug = isDebug();
        if (debug) {
            console.group(`🗺️ smoothPathForPlayer: ${path.length} raw waypoints from (${startX.toFixed(0)},${startY.toFixed(0)})`);
            console.log('Raw waypoints:', path.map((p, i) => `[${i}](${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(' → '));
        }

        const smoothed = [];
        let cx = startX;
        let cy = startY;
        let i = 0;
        let step = 0;

        while (i < path.length) {
            let farthest = i;
            for (let j = path.length - 1; j > i; j--) {
                // Use world-aware LOS so cross-room segments are checked correctly
                if (this.hasWorldPhysicsLineOfSight(cx, cy, path[j].x, path[j].y)) {
                    farthest = j;
                    break;
                }
            }
            if (debug) {
                const skipped = farthest - i;
                const kept = path[farthest];
                console.log(`  step ${step}: from (${cx.toFixed(0)},${cy.toFixed(0)}) → waypoint[${farthest}] (${kept.x.toFixed(0)},${kept.y.toFixed(0)})${skipped > 0 ? ` [skipped ${skipped}]` : ' [no skip]'}`);
            }
            smoothed.push(path[farthest]);
            cx = path[farthest].x;
            cy = path[farthest].y;
            i = farthest + 1;
            step++;
        }

        if (debug) {
            console.log(`✅ Smoothed: ${path.length} → ${smoothed.length} waypoints`);
            console.log('Smoothed waypoints:', smoothed.map((p, i) => `[${i}](${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(' → '));
            console.groupEnd();
        }

        return smoothed.length > 0 ? smoothed : path;
    }
}

/**
 * Segment vs AABB intersection test (slab method).
 * Returns true if the segment from (x1,y1)→(x2,y2) passes through the
 * rectangle defined by [left,right] × [top,bottom].
 *
 * @private
 */
function _segmentIntersectsAABB(x1, y1, x2, y2, left, top, right, bottom) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let tmin = 0;
    let tmax = 1;

    // X slab
    if (Math.abs(dx) < 1e-9) {
        if (x1 < left || x1 > right) return false;
    } else {
        const tx1 = (left  - x1) / dx;
        const tx2 = (right - x1) / dx;
        tmin = Math.max(tmin, Math.min(tx1, tx2));
        tmax = Math.min(tmax, Math.max(tx1, tx2));
        if (tmin > tmax) return false;
    }

    // Y slab
    if (Math.abs(dy) < 1e-9) {
        if (y1 < top || y1 > bottom) return false;
    } else {
        const ty1 = (top    - y1) / dy;
        const ty2 = (bottom - y1) / dy;
        tmin = Math.max(tmin, Math.min(ty1, ty2));
        tmax = Math.min(tmax, Math.max(ty1, ty2));
        if (tmin > tmax) return false;
    }

    return true;
}

// Export as global for easy access
window.NPCPathfindingManager = NPCPathfindingManager;

/**
 * Console helpers for visualising/debugging the unified world pathfinding grid.
 *
 * Usage:
 *   window.showPathfindingGrid()     // draw world grid overlay (red=blocked, green=walkable)
 *   window.hidePathfindingGrid()     // remove overlay
 *   window.refreshPathfindingGrid()  // rebuild from current physics bodies then redraw
 */
window.showPathfindingGrid = () => {
    const pm    = window.pathfindingManager;
    const scene = pm?.scene;
    if (!pm || !scene) { console.warn('showPathfindingGrid: not ready', { pm: !!pm, scene: !!scene }); return; }
    pm.drawWorldGridDebug(scene);
    console.log('🗺️ World grid overlay shown — red=blocked, green=walkable');
};

window.hidePathfindingGrid = () => {
    const pm = window.pathfindingManager;
    pm?.clearGridDebug();
    pm?.clearWorldGridDebug();
};

window.refreshPathfindingGrid = () => {
    const pm = window.pathfindingManager;
    if (!pm) { console.warn('refreshPathfindingGrid: not ready'); return; }
    pm.rebuildWorldGrid();
    window.showPathfindingGrid();
};
