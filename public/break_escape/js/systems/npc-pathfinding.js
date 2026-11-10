/**
 * NPC PATHFINDING SYSTEM - EasyStar.js Integration
 * ================================================
 *
 * Pathfinding for the player and every NPC using EasyStar.js.
 *
 * Key Concepts:
 * - One unified world grid (PATHFINDING_STEP px cells) spanning every loaded
 *   room, built from all immovable/static physics bodies (rebuildWorldGrid)
 * - Per-room data is only the patrol bounds (2 tiles in from the room edges)
 * - Random patrol targets are walkable world-grid cells inside those bounds
 *
 * @module npc-pathfinding
 */

import { TILE_SIZE, PATHFINDING_STEP } from '../utils/constants.js';
import { addDoorway } from './path-doorways.js';
import { AVOID_CELL_COST, collectAvoidRects, avoidCells, crossesAvoidRect, roomFloorRect, onFloor, floorRingCells } from './path-avoid.js';

const PATROL_EDGE_OFFSET = 2; // Distance from room edge (2 tiles)

/**
 * Carve an opened east/west door's corridor into `grid` (bounds { minX, minY, cols, rows, step }).
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
 *
 * The range is clamped to the grid (a full world grid always contains it). Returns the cell range.
 */
export function carveSideDoorCorridor(grid, bounds, worldX, worldY, direction) {
    const { minX, minY, cols, rows, step } = bounds;

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
        for (let cx = cx1; cx <= cx2; cx++) grid[cy][cx] = 0;
    }
    // Ensure top and bottom rows stay blocked across both tiles.
    for (let cx = cx1; cx <= cx2; cx++) grid[cy1][cx] = 1;
    for (let cx = cx1; cx <= cx2; cx++) grid[cy2][cx] = 1;
    return { cx1, cy1, cx2, cy2 };
}

/**
 * Re-block the outermost cell on each side of the south edge of an opened N/S door in `grid`
 * (see NPCPathfindingManager._applyNSDoorCornerBlocks). Returns the cells blocked.
 */
export function applyNSDoorCornerBlocks(grid, bounds, doorWorldX, doorWorldY) {
    const { minX, minY, cols, rows, step } = bounds;

    const doorW = TILE_SIZE * 2;
    const doorH = TILE_SIZE;

    const cx1 = Math.max(0,        Math.floor((doorWorldX          - minX) / step));
    const cx2 = Math.min(cols - 1, Math.ceil( (doorWorldX + doorW  - minX) / step));
    const cy2 = Math.min(rows - 1, Math.ceil( (doorWorldY + doorH  - minY) / step));

    if (grid[cy2]) {
        grid[cy2][cx1] = 1;
        grid[cy2][cx2] = 1;
    }
    return { cx1, cx2, cy2 };
}

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

        // Every opened doorway, one entry per opening (both rooms' doors share
        // it). The player's paths pin waypoints on its centre line so the feet
        // collider enters and leaves square (path-doorways.js).
        this.openDoorways = []; // [{axis, cx, cy}]

        console.log('✅ NPCPathfindingManager initialized');
    }

    /**
     * Register a room's patrol bounds and schedule a world-grid rebuild.
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
     * Random patrol target inside the room's patrol bounds (2 tiles in from
     * each edge), on the unified world grid so the target is a cell every
     * other route can reach. A random tile centre that lands on a blocked
     * cell is moved to the nearest walkable cell within 2 cells (16px);
     * otherwise another tile is tried.
     *
     * @param {string} roomId - Room identifier
     * @returns {Object|null} - {x, y} world position (a walkable world-grid cell centre), or null
     */
    getRandomPatrolTarget(roomId) {
        const bounds = this.roomBounds.get(roomId);

        if (!bounds || !this.worldGrid) {
            console.warn(`⚠️ No bounds/world grid for room ${roomId} (bounds: ${bounds ? 'ok' : 'MISSING'}, world grid: ${this.worldGrid ? 'ok' : 'not built yet'})`);
            return null;
        }

        const maxAttempts = 20;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const randTileX = bounds.x + Math.floor(Math.random() * bounds.width);
            const randTileY = bounds.y + Math.floor(Math.random() * bounds.height);
            if (randTileX < 0 || randTileX >= bounds.mapWidth || randTileY < 0 || randTileY >= bounds.mapHeight) {
                continue;
            }

            const worldX = bounds.worldX + randTileX * TILE_SIZE + TILE_SIZE / 2;
            const worldY = bounds.worldY + randTileY * TILE_SIZE + TILE_SIZE / 2;
            const cell = this.findNearestWalkableWorldCell(worldX, worldY, 2);
            if (cell) {
                console.log(`✅ Random patrol target for ${roomId}: tile (${randTileX}, ${randTileY}) → (${cell.x}, ${cell.y})`);
                return cell;
            }
        }

        console.warn(`⚠️ Could not find valid random position in ${roomId} after ${maxAttempts} attempts`);
        console.warn(`   Bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`);
        return null;
    }

    /**
     * Get bounds for a room (for debugging)
     */
    getBounds(roomId) {
        return this.roomBounds.get(roomId);
    }

    /**
     * Mark an opened door walkable on the world grid (and record the doorway)
     * Called when a door is unlocked/opened
     * 
     * @param {string} roomId - Room containing the door
     * @param {number} worldX - World X position of door
     * @param {number} worldY - World Y position of door
     * @param {string} direction - Door direction (north/south/east/west)
     */
    markDoorWalkable(roomId, worldX, worldY, direction) {
        // Record an N/S opening before the room-bounds check below: the far
        // room is often not loaded yet, but the doorway is open either way.
        // (openDoor also calls this for the far room with the direction
        // flipped but the same sprite position, which is the same N/S doorway.
        // Side doors are recorded in markSideDoorCorridor, which gets the
        // door's own direction; a flipped one would put the opening 32px off.)
        if (direction === 'north' || direction === 'south') {
            addDoorway(this.openDoorways, { x: worldX, y: worldY, direction });
        }

        const bounds = this.roomBounds.get(roomId);

        if (!bounds) {
            console.warn(`⚠️ Cannot update door pathfinding - room ${roomId} not initialized`);
            return;
        }

        // Convert world coordinates to tile coordinates
        const tileX = Math.floor((worldX - bounds.worldX) / TILE_SIZE);
        const tileY = Math.floor((worldY - bounds.worldY) / TILE_SIZE);

        // Unblock the door's cells in the world grid
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
     * Build a world grid from the live physics bodies without touching the live one.
     * Marks every enabled static body and every enabled immovable dynamic body (padded one
     * cell sideways and 2 px up and down), skipping any body whose gameObject is in
     * `exclude`, then applies the open side-door corridors and the N/S door corner blocks.
     * Always the full world rectangle. Returns { grid, bounds } or null when the physics
     * world has no bounds yet. Used by rebuildWorldGrid (no options), the walk audit and
     * the seat stand-up grid (SEAT_BOX_PLAN.md slice 0).
     *
     * @param {{ exclude?: Iterable<object> }} [opts] game objects whose bodies are left out
     */
    buildWorldGrid({ exclude = null } = {}) {
        const scene = this.scene;
        if (!scene?.physics?.world) return null;

        const wb = scene.physics.world.bounds;
        if (!wb || wb.width === 0 || wb.height === 0) {
            console.warn('⚠️ buildWorldGrid: physics world bounds not set yet');
            return null;
        }

        const step = PATHFINDING_STEP;
        const minX = wb.x;
        const minY = wb.y;
        const cols = Math.ceil(wb.width  / step) + 2; // +2 safety margin
        const rows = Math.ceil(wb.height / step) + 2;
        const bounds = { minX, minY, cols, rows, step };

        const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
        const skip = exclude ? new Set(exclude) : null;
        const left = body => !!skip && !!body.gameObject && skip.has(body.gameObject);

        // Mark every grid cell that substantially overlaps an immovable physics body.
        // Subtracting 1 before flooring the right/bottom edge prevents a body whose
        // edge sits exactly on a boundary from blocking the adjacent walkable cell.
        const markBlocked = (left, top, right, bottom) => {
            // Expand by 1 extra cell horizontally — the player body is wider than
            // tall, so a gap that fits vertically may not fit the collision box.
            const cx1 = Math.max(0, Math.floor((left   - minX) / step) - 1);
            // The feet collider is 10px tall and a cell is 8px, so a cell
            // whose centre is 4px from an obstacle's top or bottom edge would
            // put the body 1px into it. Pad 2px vertically: a free cell's centre
            // is then at least 6px clear, more than half the body.
            const padY = 2;
            const cy1 = Math.max(0, Math.floor((top - padY - minY) / step));
            const cx2 = Math.min(cols - 1, Math.floor((right  - minX - 1) / step) + 1);
            const cy2 = Math.min(rows - 1, Math.floor((bottom + padY - minY - 1) / step));
            for (let cy = cy1; cy <= cy2; cy++) {
                for (let cx = cx1; cx <= cx2; cx++) grid[cy][cx] = 1;
            }
        };

        // Phaser static bodies (StaticGroups etc.)
        scene.physics.world.staticBodies.iterate(body => {
            if (body.enable && !left(body)) markBlocked(body.left, body.top, body.right, body.bottom);
        });

        // Dynamic-but-immovable bodies: wall strips, locked doors, furniture
        scene.physics.world.bodies.iterate(body => {
            if (body.enable && body.immovable && !left(body)) {
                markBlocked(body.left, body.top, body.right, body.bottom);
            }
        });

        // Re-carve any east/west door corridors that were opened before this build.
        for (const corridor of this.openSideDoorCorridors) {
            carveSideDoorCorridor(grid, bounds, corridor.worldX, corridor.worldY, corridor.direction);
        }

        // Re-apply south-edge corner blocks for any opened N/S doors.
        for (const door of this.openNSDoors) {
            applyNSDoorCornerBlocks(grid, bounds, door.worldX, door.worldY);
        }

        return { grid, bounds };
    }

    /**
     * (Re)build the unified world-level EasyStar grid from all physics bodies.
     * Called automatically at the end of initializeRoomPathfinding().
     */
    rebuildWorldGrid() {
        const built = this.buildWorldGrid();
        if (!built) return;
        const { grid, bounds } = built;

        this.worldGridBounds = bounds;
        this.worldGrid = grid;

        const pf = new EasyStar.js();
        pf.setGrid(grid);
        pf.setAcceptableTiles([0]);
        pf.enableDiagonals();
        // No diagonal step past a blocked cell: by default EasyStar takes a
        // diagonal when only one of the two orthogonal neighbours is free, and
        // that step clips the corner of whatever the blocked cell holds (a desk,
        // a stall, a door frame) with the 18x10 feet collider.
        pf.disableCornerCutting();
        this.worldPathfinder = pf;

        const blocked = grid.reduce((n, row) => n + row.filter(v => v === 1).length, 0);
        console.log(`✅ World grid rebuilt: ${bounds.cols}×${bounds.rows} @${bounds.step}px — ${blocked} blocked, ${this.openSideDoorCorridors.length} side-door corridors, ${this.openNSDoors.length} N/S door corner blocks`);
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
     * Temporarily mark grid cells occupied by the player and every active NPC
     * body EXCEPT `exceptSprite` as avoided, so a walking NPC can re-plan a
     * detour round whoever is in its way (npc-behavior.js local avoidance).
     * Unlike _avoidNPCPositions (player routing) this also avoids the player's
     * body and skips the walker's own sprite. skipCX/skipCY: never avoid the
     * walker's own start cell.
     */
    _avoidDynamicPositions(exceptSprite, skipCX, skipCY) {
        if (!this.worldPathfinder || !this.worldGridBounds) return;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const avoidBody = (body) => {
            if (!body || !body.enable || body.immovable) return;
            // One cell of clearance either side, as _avoidNPCPositions uses.
            const cx1 = clamp(Math.floor((body.left   - minX) / step) - 1, 0, cols - 1);
            const cy1 = clamp(Math.floor((body.top    - minY) / step) - 1, 0, rows - 1);
            const cx2 = clamp(Math.floor((body.right  - minX - 1) / step) + 1, 0, cols - 1);
            const cy2 = clamp(Math.floor((body.bottom - minY - 1) / step) + 1, 0, rows - 1);
            for (let cy = cy1; cy <= cy2; cy++) {
                for (let cx = cx1; cx <= cx2; cx++) {
                    if (cx === skipCX && cy === skipCY) continue;
                    if (this.worldGrid[cy]?.[cx] === 0) this.worldPathfinder.avoidAdditionalPoint(cx, cy);
                }
            }
        };
        // The player is a blocker too (a needs NPC routes round them).
        const pb = window.player?.body;
        if (pb && exceptSprite !== window.player) avoidBody(pb);
        for (const roomId in (window.rooms || {})) {
            const sprites = window.rooms[roomId]?.npcSprites;
            if (!sprites) continue;
            for (const sprite of sprites) {
                if (sprite === exceptSprite) continue;
                avoidBody(sprite.body);
            }
        }
    }

    /**
     * Find a path via the unified world grid (works across any rooms).
     * Callback receives an array of world {x,y} waypoints, or null on failure.
     * Pass avoidNPCs=true (player only) to route around active NPC bodies.
     * opts.avoidRooms: room ids the path must not enter (the needs room leash, OFFICE_LIFE_PLAN
     * 7.2). Each loaded one except the room whose floor holds the start gets its floor's inner
     * ring avoided for this search only.
     * opts.avoidDynamic = { exceptSprite }: route round the player and every other active NPC
     * body (npc-behavior.js local detour); exceptSprite is the walking NPC's own sprite.
     */
    findWorldPath(startX, startY, endX, endY, callback, avoidNPCs = false, opts = null) {
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
        // The grid keeps a body's clearance round every obstacle, so a body
        // can be standing (legally, a few px from a wall or desk) in a cell the
        // grid calls blocked, and EasyStar finds nothing from a blocked start.
        // Start from the nearest walkable cell the body can walk straight to.
        let sx = toCX(startX), sy = toCY(startY);
        if (this.worldGrid[sy]?.[sx] !== 0) {
            const near = this.findNearestWalkableStartCell(startX, startY);
            if (near) { sx = toCX(near.x); sy = toCY(near.y); }
        }

        if (avoidNPCs) this._avoidNPCPositions(sx, sy);
        const avoidDyn = opts?.avoidDynamic || null;
        if (avoidDyn) this._avoidDynamicPositions(avoidDyn.exceptSprite, sx, sy);
        // Player paths also pay extra to cross "prefer to route around" objects
        // (path-avoid.js). calculate() runs every queued search to the end
        // before it returns, so the costs are cleared straight after it.
        const costed = avoidNPCs ? this._applyPreferAvoidCosts() : 0;

        // Room leash: calculate() runs every queued search to the end before it returns, so the
        // rings are removed in the finally straight after it (never in the callback, which runs a
        // tick later in async mode), cell by cell so the player's NPC-avoid set is kept.
        const ringed = opts?.avoidRooms?.length ? this._avoidRoomRings(opts.avoidRooms, startX, startY) : null;
        try {
            this.worldPathfinder.findPath(sx, sy, toCX(endX), toCY(endY), (tilePath) => {
                if (avoidNPCs || avoidDyn) this.worldPathfinder.stopAvoidingAllAdditionalPoints();
                callback(tilePath?.length > 0 ? tilePath.map(p => toWorld(p.x, p.y)) : null);
            });
            this.worldPathfinder.calculate();
        } finally {
            if (ringed) for (const { cx, cy } of ringed) this.worldPathfinder.stopAvoidingAdditionalPoint(cx, cy);
            if (costed) this.worldPathfinder.removeAllAdditionalPointCosts();
        }
    }

    /**
     * Avoid the inner floor ring of each loaded room in roomIds, except the room whose floor holds
     * (x, y): an NPC left inside a forbidden room can walk out. Returns the cells avoided. No
     * walkability filter and no cache: doors.js edits the grid in place when a door opens, and an
     * avoid point on a blocked cell does nothing.
     */
    _avoidRoomRings(roomIds, x, y) {
        const rooms = (typeof window !== 'undefined' && window.rooms) || {};
        const out = [];
        for (const id of roomIds) {
            const rect = roomFloorRect(rooms[id], TILE_SIZE);
            if (!rect || onFloor(rect, x, y)) continue;
            for (const c of floorRingCells(rect, this.worldGridBounds)) {
                this.worldPathfinder.avoidAdditionalPoint(c.cx, c.cy);
                out.push(c);
            }
        }
        return out;
    }

    /** Footprints of every "prefer to route around" object in the loaded rooms. */
    getPreferAvoidRects() {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (this._avoidRectCache && now - this._avoidRectCache.at < 100) return this._avoidRectCache.rects;
        const sprites = [];
        for (const roomId in (window.rooms || {})) {
            const objs = window.rooms[roomId]?.objects;
            if (objs) for (const k in objs) sprites.push(objs[k]);
        }
        if (Array.isArray(window.chairs)) sprites.push(...window.chairs);
        const rects = collectAvoidRects(sprites);
        this._avoidRectCache = { at: now, rects };
        return rects;
    }

    /** Put AVOID_CELL_COST on the world pathfinder for every avoided cell; returns the count. */
    _applyPreferAvoidCosts() {
        if (!this.worldPathfinder?.setAdditionalPointCost || !this.worldGrid) return 0;
        const cells = avoidCells(this.getPreferAvoidRects(), this.worldGridBounds, this.worldGrid);
        for (const { cx, cy } of cells) this.worldPathfinder.setAdditionalPointCost(cx, cy, AVOID_CELL_COST);
        return cells.length;
    }

    /**
     * Player LOS: hasWorldPhysicsLineOfSight, and the line doesn't cross a
     * "prefer to route around" object (path-avoid.js). `via`: raw route points
     * between the two ends; an object the route goes through anyway is allowed.
     */
    hasPlayerLineOfSight(x1, y1, x2, y2, via = null) {
        if (!this.hasWorldPhysicsLineOfSight(x1, y1, x2, y2)) return false;
        return !crossesAvoidRect(x1, y1, x2, y2, this.getPreferAvoidRects(), { via });
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
     * Where a body standing at (worldX, worldY) should start a path from: the
     * nearest walkable cell it can walk to in a straight line. The grid keeps a
     * body's clearance round every obstacle, so a narrow open gap (behind m01's
     * reception desk, against the back wall) is all blocked cells; the nearest
     * walkable cell there is often on the far side of the desk, and an NPC sent
     * to it walks into the desk and stays (m01: Sarah punched behind her desk).
     * Only the centre line is tested: the gap is narrower than the body-width
     * sweep, and the physics slides the body along an edge it grazes.
     * Falls back to the plain nearest cell when nothing in range has a line.
     */
    findNearestWalkableStartCell(worldX, worldY, maxRadius = 10) {
        if (!this.worldGrid || !this.worldGridBounds) return null;
        const { minX, minY, cols, rows, step } = this.worldGridBounds;
        const centerCX = Math.floor((worldX - minX) / step);
        const centerCY = Math.floor((worldY - minY) / step);
        if (this.worldGrid[centerCY]?.[centerCX] === 0) {
            return { x: minX + centerCX * step + step / 2, y: minY + centerCY * step + step / 2 };
        }

        const candidates = [];
        for (let dy = -maxRadius; dy <= maxRadius; dy++) {
            for (let dx = -maxRadius; dx <= maxRadius; dx++) {
                const cx = centerCX + dx, cy = centerCY + dy;
                if (cy < 0 || cy >= rows || cx < 0 || cx >= cols) continue;
                if (this.worldGrid[cy][cx] !== 0) continue;
                const x = minX + cx * step + step / 2;
                const y = minY + cy * step + step / 2;
                candidates.push({ x, y, d: (x - worldX) ** 2 + (y - worldY) ** 2 });
            }
        }
        candidates.sort((a, b) => a.d - b.d);
        for (const c of candidates) {
            if (this.hasWorldPhysicsLineOfSight(worldX, worldY, c.x, c.y, 0, 0)) {
                return { x: c.x, y: c.y };
            }
        }
        return this.findNearestWalkableWorldCell(worldX, worldY, maxRadius);
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
    /**
     * Forget an opened doorway (a gate door shutting again, door-gates.js): drop it
     * from openDoorways, openNSDoors and openSideDoorCorridors so the next
     * rebuildWorldGrid() bakes the re-enabled door body back in and stops carving
     * the gap. The caller rebuilds the grid.
     *
     * @param {number} worldX - Door sprite centre X (as given to markDoorWalkable)
     * @param {number} worldY - Door sprite centre Y
     * @param {string} direction - Door direction (either room's; N/S and E/W are matched by axis)
     */
    unmarkDoor(worldX, worldY, direction) {
        const ns = direction === 'north' || direction === 'south';
        // openDoorways holds canonical centres: for N/S the sprite centre; for E/W ±16px
        this.openDoorways = this.openDoorways.filter(d => {
            if (ns) return !(d.axis === 'y' && Math.abs(d.cx - worldX) < 2 && Math.abs(d.cy - worldY) < 2);
            return !(d.axis === 'x' && Math.abs(d.cx - worldX) <= 18 && Math.abs(d.cy - worldY) < 2);
        });
        if (ns) {
            // markDoorWalkable stored the top-left of the tile holding the centre, per room
            this.openNSDoors = this.openNSDoors.filter(d =>
                !(worldX - d.worldX >= 0 && worldX - d.worldX < TILE_SIZE &&
                  worldY - d.worldY >= 0 && worldY - d.worldY < TILE_SIZE));
        } else {
            this.openSideDoorCorridors = this.openSideDoorCorridors.filter(c =>
                !(Math.abs(c.worldX - worldX) < 2 && Math.abs(c.worldY - worldY) < 2));
        }
    }

    markSideDoorCorridor(worldX, worldY, direction) {
        addDoorway(this.openDoorways, { x: worldX, y: worldY, direction });
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
        const c = carveSideDoorCorridor(this.worldGrid, this.worldGridBounds, worldX, worldY, direction);
        this.worldPathfinder?.setGrid(this.worldGrid);
        console.log(`🚪 Side-door corridor carved at (${worldX.toFixed(0)},${worldY.toFixed(0)}) dir=${direction} — cells (${c.cx1},${c.cy1})→(${c.cx2},${c.cy2}), cleared rows ${c.cy1+1}–${c.cy2-1}`);
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
        const c = applyNSDoorCornerBlocks(this.worldGrid, this.worldGridBounds, doorWorldX, doorWorldY);
        this.worldPathfinder?.setGrid(this.worldGrid);
        console.log(`🚪 N/S door corner blocks applied at (${doorWorldX.toFixed(0)},${doorWorldY.toFixed(0)}) — blocked (${c.cx1},${c.cy2}) and (${c.cx2},${c.cy2})`);
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
     * furniture are both tested, with a fat 3-ray sweep (centre line plus ±bodyHalfWidth).
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
     * avoidProps (player click-to-move): also keep shortcuts off "prefer to
     * route around" objects the raw route went round (path-avoid.js).
     */
    smoothWorldPathForPlayer(startX, startY, path, avoidProps = false) {
        if (!path || path.length <= 1) return path;
        const debug = isDebug();
        const smoothed = [];
        let cx = startX, cy = startY, i = 0;

        while (i < path.length) {
            let farthest = i;
            // A pinned waypoint (a doorway's centre line, path-doorways.js) must
            // be visited, so never look past the next one.
            let limit = path.length - 1;
            for (let k = i; k < path.length; k++) if (path[k].pinned) { limit = k; break; }
            for (let j = limit; j > i; j--) {
                const clear = avoidProps
                    ? this.hasPlayerLineOfSight(cx, cy, path[j].x, path[j].y, path.slice(i, j))
                    : this.hasWorldPhysicsLineOfSight(cx, cy, path[j].x, path[j].y);
                if (clear) {
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
     * Remove the legacy per-room grid overlay, if one is still on screen
     * (window.hidePathfindingGrid calls this alongside clearWorldGridDebug).
     */
    clearGridDebug() {
        if (this._gridDebugGraphics) {
            this._gridDebugGraphics.destroy();
            this._gridDebugGraphics = null;
        }
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
