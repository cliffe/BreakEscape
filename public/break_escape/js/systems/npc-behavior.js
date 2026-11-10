/**
 * NPC Behavior System - Core Behavior Management
 *
 * Manages all NPC behaviors including:
 * - Face Player: Turn to face player when nearby
 * - Patrol: Random movement within area (using EasyStar.js pathfinding)
 * - Personal Space: Back away if player too close
 * - Hostile: Red tint, future chase/flee behaviors
 *
 * Architecture:
 * - NPCBehaviorManager: Singleton manager for all NPC behaviors
 * - NPCBehavior: Individual behavior instance per NPC
 * - NPCPathfindingManager: Manages EasyStar pathfinding per room
 *
 * Lifecycle:
 * - Manager initialized once in game.js create()
 * - Behaviors registered per-room when sprites created
 * - Updated every frame (throttled to 50ms)
 * - Rooms never unload, so no cleanup needed
 *
 * @module npc-behavior
 */

import { TILE_SIZE } from '../utils/constants.js';
import { NPCPathfindingManager } from './npc-pathfinding.js';
import { COMBAT_CONFIG } from '../config/combat-config.js';
import { hostileMayChase, resolveChaseRange, shouldCloseInDirectly, CLOSE_IN_MARGIN } from './npc-chase-leash.js';
import { resolveFightStyle, pickFleeHeading } from './fight-styles.js';

// How long an NPC's "can I see the player to turn to them" answer is reused (canSeePlayerToFace)
const FACE_SIGHT_MS = 150;

// Stuck watch (_checkPathStuck): an NPC walking a path that neither moves
// NPC_STUCK_MOVE_PX nor reaches a path node for NPC_STUCK_MS is wedged and
// recovers. A gap of more than NPC_STUCK_GAP_MS between checks (it paused for the
// player, dwelt, talked, settled) re-arms the watch. Times on clockNow().
export const NPC_STUCK_MS = 4000;
export const NPC_STUCK_MOVE_PX = TILE_SIZE / 2;
const NPC_STUCK_GAP_MS = 500;
const NPC_STUCK_NUDGE_MAX_PX = TILE_SIZE;   // never nudge further than one tile
const NPC_STUCK_PLAYER_PX = TILE_SIZE * 1.5; // the player this close: not wedged, held up

/**
 * NPCBehaviorManager - Manages all NPC behaviors
 *
 * Initialized once in game.js create() phase
 * Updated every frame in game.js update() phase
 *
 * IMPORTANT: Rooms never unload, so no lifecycle management needed.
 * Behaviors persist for entire game session once registered.
 */
export class NPCBehaviorManager {
    constructor(scene, npcManager) {
        this.scene = scene;              // Phaser scene reference
        this.npcManager = npcManager;    // NPC Manager reference
        this.behaviors = new Map();      // Map<npcId, NPCBehavior>
        this.updateInterval = 50;        // Update behaviors every 50ms
        this.lastUpdate = 0;
        
        // Use the pathfinding manager created by initializeRooms()
        // It's already been initialized in rooms.js and should be available on window
        this.pathfindingManager = window.pathfindingManager;
        
        if (!this.pathfindingManager) {
            console.warn(`⚠️ Pathfinding manager not yet available, will use window.pathfindingManager when needed`);
        }

        console.log('✅ NPCBehaviorManager initialized');
    }
    
    /**
     * Get pathfinding manager (used by NPCBehavior instances)
     * Retrieves from window.pathfindingManager to ensure latest reference
     */
    getPathfindingManager() {
        return window.pathfindingManager || this.pathfindingManager;
    }

    /**
     * Register a behavior instance for an NPC sprite
     * Called when NPC sprite is created in createNPCSpritesForRoom()
     *
     * No unregister needed - rooms never unload, sprites persist
     */
    registerBehavior(npcId, sprite, config) {
        try {
            // Get latest pathfinding manager reference
            const pathfindingManager = window.pathfindingManager || this.pathfindingManager;
            const behavior = new NPCBehavior(npcId, sprite, config, this.scene, pathfindingManager);
            this.behaviors.set(npcId, behavior);
            console.log(`🤖 Behavior registered for ${npcId}`);
        } catch (error) {
            console.error(`❌ Failed to register behavior for ${npcId}:`, error);
        }
    }

    /**
     * Main update loop (called from game.js update())
     */
    update(time, delta) {
        // R13: while the player is on the VM (vm-context-pause.js), NPCs hold still.
        // Read through window so this file keeps no extra import.
        if (typeof window !== 'undefined' && window.isVmContextActive?.()) {
            if (!this._vmPaused) {
                this._vmPaused = true;
                this.freezeAll();
            }
            return;
        }
        this._vmPaused = false;

        // Throttle updates to every 50ms for performance
        if (time - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = time;

        // Get player position once for all behaviors.
        // Use body.center (feet collider) — same reference point that pathfinding and
        // distance calculations use — rather than the sprite visual centre.
        const player = window.player;
        if (!player) {
            return; // No player yet
        }
        const playerPos = {
            x: player.body?.center.x ?? player.x,
            y: player.body?.center.y ?? player.y
        };

        for (const [npcId, behavior] of this.behaviors) {
            behavior.update(time, delta, playerPos);
        }
    }

    /**
     * Stand every NPC still: velocity 0 and the idle animation. Skipping behaviour
     * updates alone leaves each NPC with its last velocity, and it slides on.
     * @returns {number} how many NPCs were stopped
     */
    freezeAll() {
        let n = 0;
        for (const behavior of this.behaviors.values()) {
            const sprite = behavior?.sprite;
            if (!sprite?.body || sprite.destroyed) continue;
            try {
                sprite.body.setVelocity(0, 0);
                behavior.isMoving = false;
                const ko = window.npcHostileSystem?.isNPCKO?.(behavior.npcId);
                if (!ko && behavior.direction) behavior.playAnimation('idle', behavior.direction);
                n++;
            } catch (err) {
                // one bad sprite must not stop the rest
            }
        }
        return n;
    }

    /**
     * Update behavior config (called from Ink tag handlers)
     */
    setBehaviorState(npcId, property, value) {
        const behavior = this.behaviors.get(npcId);
        if (behavior) {
            behavior.setState(property, value);
        }
    }

    /**
     * Get behavior instance for an NPC
     */
    getBehavior(npcId) {
        return this.behaviors.get(npcId) || null;
    }

    /**
     * Command an NPC to walk to a world position and stop there.
     * Used for event-driven interrupts (bed escalations, emergency responses).
     * 
     * @param {string} npcId - The NPC ID
     * @param {number} worldX - Target world X coordinate
     * @param {number} worldY - Target world Y coordinate
     * @param {number} [speed] - Override patrol speed for this move (optional)
     */
    goToAndStay(npcId, worldX, worldY, speed, opts) {
        const behavior = this.behaviors.get(npcId);
        if (behavior) {
            behavior.goToAndStay(worldX, worldY, speed, opts);
        } else {
            console.warn(`⚠️ goToAndStay: no behavior for ${npcId}`);
        }
    }

    /** Stop an in-flight goToAndStay without an arrival (npc-needs.js aborts). */
    cancelMove(npcId) {
        this.behaviors.get(npcId)?.cancelMove();
    }

    /**
     * Set an NPC's visibility (for initially hidden NPCs).
     * Makes the sprite visible and enables physics body, or vice versa.
     * Syncs state to server for persistence across sessions.
     * 
     * @param {string} npcId - The NPC ID
     * @param {boolean} visible - True to show, false to hide
     */
    setNPCVisible(npcId, visible) {
        // Always record the desired visibility on the NPC data so sprite creation
        // (room not yet loaded) honours it instead of behavior.initiallyHidden.
        const npcData = window.npcManager?.getNPC(npcId);
        if (npcData) {
            npcData.isVisible = visible;
        }
        // Saved with the state sync and re-applied when the NPC registers after a reload,
        // whether or not its sprite exists yet; a onceOnly reveal doesn't replay (N2)
        window.npcManager?.recordNpcVisibility?.(npcId, visible);

        const behavior = this.behaviors.get(npcId);
        const sprite = behavior?.sprite;
        if (!behavior || !sprite) {
            console.warn(`⚠️ setNPCVisible: no ${behavior ? 'sprite' : 'behavior'} for ${npcId} yet, recorded isVisible=${visible} for when it is created`);
            if (npcData && window.RoomStateSync && npcData.roomId) {
                window.RoomStateSync.updateNpcState(npcData.roomId, npcId, {
                    isVisible: visible
                }).catch(err => {
                    console.error('Failed to sync NPC visibility state to server:', err);
                });
            }
            return;
        }
        sprite.setVisible(visible);
        sprite.setAlpha(visible ? 1 : 0);
        if (sprite.body) {
            sprite.body.enable = visible;
        }
        // If revealing and patrol is configured, enable it
        if (visible && behavior.config.patrol.waypoints?.length > 0) {
            behavior.config.patrol.enabled = true;
        }
        
        // Sync NPC visibility state to server for persistence (like KO state)
        const npc = window.npcManager?.getNPC(npcId);
        if (npc && window.RoomStateSync && npc.roomId) {
            window.RoomStateSync.updateNpcState(npc.roomId, npcId, {
                isVisible: visible
            }).catch(err => {
                console.error('Failed to sync NPC visibility state to server:', err);
            });
        }
        
        console.log(`👁️ [${npcId}] Visibility set to ${visible}`);
    }
}

/**
 * NPCBehavior - Individual NPC behavior instance
 */
class NPCBehavior {
    constructor(npcId, sprite, config, scene, pathfindingManager) {
        this.npcId = npcId;
        this.sprite = sprite;
        this.scene = scene;
        // Store pathfinding manager, but prefer window.pathfindingManager if available
        this.pathfindingManager = pathfindingManager || window.pathfindingManager;

        // Validate sprite reference
        if (!this.sprite || !this.sprite.body) {
            throw new Error(`❌ Invalid sprite provided for NPC ${npcId}`);
        }

        // Get NPC data and validate room ID
        const npcData = window.npcManager?.npcs?.get(npcId);
        if (!npcData || !npcData.roomId) {
            console.warn(`⚠️ NPC ${npcId} has no room assignment, using default`);
            this.roomId = 'unknown';
        } else {
            this.roomId = npcData.roomId;
        }
        // The room the NPC belongs to: a stationary NPC's chase leash is tied to it (7.1a)
        this.homeRoomId = this.roomId;

        // Verify sprite reference matches stored sprite
        if (npcData && npcData._sprite && npcData._sprite !== this.sprite) {
            console.warn(`⚠️ Sprite reference mismatch for ${npcId}`);
        }

        this.config = this.parseConfig(config || {});

        // State
        this.currentState = 'idle';
        this.direction = 'down';          // Current facing direction
        this.hostile = false;             // Will be set via setHostile() if startHostile is true
        this.influence = 0;

        // Patrol state
        this.patrolTarget = null;
        this.currentPath = [];           // Current path from EasyStar pathfinding
        this.pathIndex = 0;              // Current position in path
        this.lastPatrolChange = 0;
        this.lastPosition = { x: this.sprite.x, y: this.sprite.y }; // sprite pos OK here — body not yet offset at construction
        this.collisionRotationAngle = 0;  // Clockwise rotation angle when blocked (0-360)
        this.wasBlockedLastFrame = false; // Track block state for smooth transitions
        this.pathFollowingActive = false; // Track whether we're currently following a path to target
        this._pathfindingInProgress = false; // True while an async findWorldPath call is in flight (prevents flood, mirrors chasePathPending)
        this._pathRetryAfter = 0;            // Timestamp after which a failed path may be retried
        this._routeWait = null;              // Multi-room route: waiting on a waypoint action (unlock + load a room)
        this._pendingRouteAction = null;     // The action of the route waypoint just reached
        this._routeWallRooms = new Set();    // Route rooms whose wall boxes this NPC already collides with

        // Chase state (for hostile NPCs)
        this.chasePath = [];             // Path to player when chasing
        this.chasePathIndex = 0;         // Current position in chase path
        this.lastChasePathRequest = 0;   // Timestamp of last pathfinding request
        this.chasePathUpdateInterval = 500; // Recalculate path every 500ms
        this.lastPlayerPosition = null;  // Track player position for path recalculation
        this.chasePathPending = false;   // True while EasyStar is computing a path (prevents flood)
        this.chaseDebugGraphics = null;  // Graphics overlay showing current chase path
        this._chaseAnchor = null;        // The post the chase leash is measured from (7.1a)
        this._lastChaseAt = 0;           // When the NPC last chased (ms)
        this._gaveUpChase = false;       // Past the leash: logged once per give-up

        // Patrol debug visualization
        this.patrolDebugGraphics = null; // Graphics overlay showing patrol path and waypoints

        // Personal space state
        this.backingAway = false;

        // Animation tracking
        this.lastAnimationKey = null;
        this.isMoving = false;

        // Collision settling state
        // After being pushed/collided, NPCs pause briefly before resuming patrol
        this.isSettling = false;
        this.settleEndTime = 0;
        this.settleDuration = 300; // ms to settle after collision

        // Home position tracking for stationary NPCs
        // When stationary NPCs are pushed away from their starting position,
        // they will automatically return home
        //
        // IMPORTANT: body.center is NOT yet correct at construction time.
        // createNPCSprite calls setSize() (which updates halfWidth/Height + center),
        // then setOffset(), then repositions the sprite — but body.center is only
        // re-synced with the adjusted sprite position on the first physics preUpdate().
        // Using npcBodyPos() / body.center here therefore yields a stale value that
        // is offset from the NPC's true spawn position, causing an immediate false
        // "pushed from home" trigger on the first frame.
        //
        // Instead, compute the correct body centre from first principles, mirroring
        // the bodyXOffset/bodyYOffset formula used in createNPCSprite:
        //   body.center = sprite.topLeft + offset + halfSize
        {
            const b = this.sprite.body;
            const homeX = this.sprite.x
                          - this.sprite.displayWidth  * this.sprite.originX
                          + b.offset.x + b.halfWidth;
            const homeY = this.sprite.y
                          - this.sprite.displayHeight * this.sprite.originY
                          + b.offset.y + b.halfHeight;
            this.homePosition = { x: homeX, y: homeY };
        }
        this.homeReturnThreshold = 32; // Distance in pixels before returning home
        this.returningHome = false;

        // Wall collision escape tracking
        // When NPCs get pushed through walls, they can get unstuck
        this.stuckInWall = false;
        this.unstuckAttempts = 0;
        this.lastUnstuckCheck = 0;
        this.unstuckCheckInterval = 200; // Check for stuck every 200ms
        this.escapeWallBox = null; // Reference to the wall we're escaping from

        // Hostility saved before a reload (E-B) wins over startHostile: an NPC
        // that turned stays hostile, one that was calmed stays calm, a KO'd one
        // stays down without a health bar. Otherwise apply the configured state.
        const restored = window.npcHostileSystem?.takeRestoredHostility?.(npcId);
        if (restored) {
            if (restored.hostile) {
                this.hostile = true;
                if (!restored.ko) {
                    this.sprite?.setTint?.(0xff6666);
                    window.npcHostileSystem.announceRestoredHostile?.(npcId, this.config.hostile);
                }
            }
        } else if (this.config.hostile.startHostile) {
            this.setHostile(true);
        }

        console.log(`✅ Behavior initialized for ${npcId} in room ${this.roomId}`);
    }

    parseConfig(config) {
        // Parse and apply defaults to config
        const merged = {
            facePlayer: config.facePlayer !== undefined ? config.facePlayer : true,
            facePlayerDistance: config.facePlayerDistance || 96,
            patrol: {
                enabled: config.patrol?.enabled || false,
                speed: config.patrol?.speed || 100,
                changeDirectionInterval: config.patrol?.changeDirectionInterval || 3000,
                bounds: config.patrol?.bounds || null,
                waypoints: config.patrol?.waypoints || null,        // List of waypoints
                waypointMode: config.patrol?.waypointMode || 'sequential',  // sequential or random
                waypointIndex: 0,  // Current waypoint index for sequential mode
                // Stop patrol when player nearby. A multi-room route walker defaults to false:
                // stopping for a player who follows him through a doorway jams the route.
                pauseForPlayer: config.patrol?.pauseForPlayer !== undefined ? config.patrol.pauseForPlayer
                    : !(config.patrol?.multiRoom && config.patrol?.route?.length > 0),
                // Multi-room route support
                multiRoom: config.patrol?.multiRoom || false,        // Enable multi-room patrolling
                route: config.patrol?.route || null,                 // Array of {room, waypoints} segments
                currentSegmentIndex: 0                               // Current segment in route
            },
            personalSpace: {
                enabled: config.personalSpace?.enabled || false,
                distance: config.personalSpace?.distance || 48,
                backAwaySpeed: config.personalSpace?.backAwaySpeed || 30,
                backAwayDistance: config.personalSpace?.backAwayDistance || 5
            },
            hostile: {
                startHostile: config.hostile?.startHostile || false,
                influenceThreshold: config.hostile?.influenceThreshold || -50,
                chaseSpeed: config.hostile?.chaseSpeed || 145,
                fleeSpeed: config.hostile?.fleeSpeed || 180,
                aggroDistance: config.hostile?.aggroDistance || 160,
                attackDamage: config.hostile?.attackDamage || 10,
                // Optional per-NPC combat numbers (7.1e); undefined falls back to
                // combat-config.js in npc-hostile.js createHostileState
                maxHP: config.hostile?.maxHP,
                attackCooldown: config.hostile?.attackCooldown,
                attackRange: config.hostile?.attackRange,
                // Chase leash (7.1a), opt-in with leash: true: px from the
                // NPC's post, and whether it still follows the player out of
                // its room (npc-chase-leash.js). Unleashed NPCs ignore both.
                leash: config.hostile?.leash === true,
                chaseRange: resolveChaseRange(config.hostile?.chaseRange, COMBAT_CONFIG.npc.chaseRange),
                chaseAcrossRooms: config.hostile?.chaseAcrossRooms === true,
                pauseToAttack: config.hostile?.pauseToAttack !== undefined ? config.hostile.pauseToAttack : true,
                // How it fights (fight-styles.js): brawler (default), guarded,
                // slugger or cower
                fightStyle: typeof config.hostile?.fightStyle === 'string' ? config.hostile.fightStyle : undefined
            }
        };

        // Auto-enable patrol if waypoints or bounds are provided but enabled not explicitly set
        if (!config.patrol?.enabled && (config.patrol?.waypoints?.length > 0 || config.patrol?.bounds)) {
            merged.patrol.enabled = true;
            console.log(`🤖 Auto-enabled patrol for ${this.npcId} (waypoints/bounds detected)`);
        }

        // Pre-calculate squared distances for performance
        merged.facePlayerDistanceSq = merged.facePlayerDistance ** 2;
        merged.personalSpace.distanceSq = merged.personalSpace.distance ** 2;
        merged.hostile.aggroDistanceSq = merged.hostile.aggroDistance ** 2;

        // Validate multi-room route if provided
        if (merged.patrol.enabled && merged.patrol.multiRoom && merged.patrol.route && merged.patrol.route.length > 0) {
            this.validateMultiRoomRoute(merged);
        }

        // Validate and process waypoints if provided (single-room or first room of multi-room)
        if (merged.patrol.enabled && merged.patrol.waypoints && merged.patrol.waypoints.length > 0) {
            this.validateWaypoints(merged);
        }

        // Validate patrol bounds include starting position (only if no waypoints)
        if (merged.patrol.enabled && merged.patrol.bounds && (!merged.patrol.waypoints || merged.patrol.waypoints.length === 0)) {
            const bounds = merged.patrol.bounds;
            const spriteX = this.sprite.x;
            const spriteY = this.sprite.y;

            // Get room offset for bounds calculation
            const roomData = window.rooms ? window.rooms[this.roomId] : null;
            const roomWorldX = roomData?.worldX || 0;
            const roomWorldY = roomData?.worldY || 0;

            // Convert bounds to world coordinates
            const worldBounds = {
                x: roomWorldX + bounds.x,
                y: roomWorldY + bounds.y,
                width: bounds.width,
                height: bounds.height
            };

            const inBoundsX = spriteX >= worldBounds.x && spriteX <= (worldBounds.x + worldBounds.width);
            const inBoundsY = spriteY >= worldBounds.y && spriteY <= (worldBounds.y + worldBounds.height);

            if (!inBoundsX || !inBoundsY) {
                console.warn(`⚠️ NPC ${this.npcId} starting position (${spriteX}, ${spriteY}) is outside patrol bounds. Expanding bounds...`);

                // Auto-expand bounds to include starting position
                const newX = Math.min(worldBounds.x, spriteX);
                const newY = Math.min(worldBounds.y, spriteY);
                const newMaxX = Math.max(worldBounds.x + worldBounds.width, spriteX);
                const newMaxY = Math.max(worldBounds.y + worldBounds.height, spriteY);

                // Store bounds in world coordinates for easier calculation
                merged.patrol.worldBounds = {
                    x: newX,
                    y: newY,
                    width: newMaxX - newX,
                    height: newMaxY - newY
                };

                console.log(`✅ Patrol bounds expanded to include starting position`);
            } else {
                // Store bounds in world coordinates
                merged.patrol.worldBounds = worldBounds;
            }
        }

        return merged;
    }

    /**
     * Validate and process waypoints from scenario config
     * Converts tile coordinates to world coordinates
     * Validates waypoints are walkable
     */
    validateWaypoints(merged) {
        try {
            const roomData = window.rooms ? window.rooms[this.roomId] : null;
            if (!roomData) {
                console.warn(`⚠️ Cannot validate waypoints: room ${this.roomId} not found`);
                merged.patrol.waypoints = null;
                return;
            }

            const roomWorldX = roomData.position?.x ?? roomData.worldX ?? 0;
            const roomWorldY = roomData.position?.y ?? roomData.worldY ?? 0;

            const validWaypoints = [];

            for (const wp of merged.patrol.waypoints) {
                // Validate waypoint has x, y
                if (wp.x === undefined || wp.y === undefined) {
                    console.warn(`⚠️ Waypoint missing x or y coordinate`);
                    continue;
                }

                // Convert tile coordinates to world coordinates
                const worldX = roomWorldX + (wp.x * TILE_SIZE);
                const worldY = roomWorldY + (wp.y * TILE_SIZE);

                // Basic bounds check
                const roomBounds = window.pathfindingManager?.getBounds(this.roomId);
                if (roomBounds) {
                    // Convert tile bounds to world coordinates for comparison
                    const minWorldX = roomWorldX + (roomBounds.x * TILE_SIZE);
                    const minWorldY = roomWorldY + (roomBounds.y * TILE_SIZE);
                    const maxWorldX = minWorldX + (roomBounds.width * TILE_SIZE);
                    const maxWorldY = minWorldY + (roomBounds.height * TILE_SIZE);

                    if (worldX < minWorldX || worldX > maxWorldX || worldY < minWorldY || worldY > maxWorldY) {
                        console.warn(`⚠️ Waypoint (${wp.x}, ${wp.y}) at world (${worldX}, ${worldY}) outside patrol bounds`);
                        continue;
                    }
                }

                // Store validated waypoint with world coordinates
                validWaypoints.push({
                    tileX: wp.x,
                    tileY: wp.y,
                    worldX: worldX,
                    worldY: worldY,
                    dwellTime: wp.dwellTime || 0
                });
            }

            if (validWaypoints.length > 0) {
                merged.patrol.waypoints = validWaypoints;
                merged.patrol.waypointIndex = 0;
                console.log(`✅ Validated ${validWaypoints.length} waypoints for ${this.npcId}`);
            } else {
                console.warn(`⚠️ No valid waypoints for ${this.npcId}, using random patrol`);
                merged.patrol.waypoints = null;
            }
        } catch (error) {
            console.error(`❌ Error validating waypoints for ${this.npcId}:`, error);
            merged.patrol.waypoints = null;
        }
    }

    /**
     * Validate multi-room route configuration
     * Checks that all rooms exist and are properly connected
     * Pre-loads all route rooms for immediate access
     */
    validateMultiRoomRoute(merged) {
        try {
            const gameScenario = window.gameScenario;
            if (!gameScenario || !gameScenario.rooms) {
                console.warn(`⚠️ No scenario rooms available, disabling multi-room route for ${this.npcId}`);
                merged.patrol.multiRoom = false;
                return;
            }

            const route = merged.patrol.route;
            if (!Array.isArray(route) || route.length === 0) {
                console.warn(`⚠️ Invalid route for ${this.npcId}, disabling multi-room`);
                merged.patrol.multiRoom = false;
                return;
            }

            // Validate all rooms in route exist
            for (let i = 0; i < route.length; i++) {
                const segment = route[i];
                if (!segment.room) {
                    console.warn(`⚠️ Route segment ${i} missing room ID for ${this.npcId}`);
                    merged.patrol.multiRoom = false;
                    return;
                }

                if (!gameScenario.rooms[segment.room]) {
                    console.warn(`⚠️ Route room "${segment.room}" not found in scenario for ${this.npcId}`);
                    merged.patrol.multiRoom = false;
                    return;
                }

                // Validate waypoints in this segment
                if (segment.waypoints && Array.isArray(segment.waypoints)) {
                    for (const wp of segment.waypoints) {
                        if (wp.x === undefined || wp.y === undefined) {
                            console.warn(`⚠️ Route segment ${i} (room: ${segment.room}) has invalid waypoint`);
                            merged.patrol.multiRoom = false;
                            return;
                        }
                    }
                }
            }

            // Validate connections between consecutive rooms
            for (let i = 0; i < route.length; i++) {
                const currentRoom = route[i].room;
                const nextRoomIndex = (i + 1) % route.length; // Loop back to first room
                const nextRoom = route[nextRoomIndex].room;

                const currentRoomData = gameScenario.rooms[currentRoom];
                const connections = currentRoomData.connections || {};

                // Check if there's a door connecting current room to next room
                let isConnected = false;
                for (const [direction, connectedRooms] of Object.entries(connections)) {
                    const roomList = Array.isArray(connectedRooms) ? connectedRooms : [connectedRooms];
                    if (roomList.includes(nextRoom)) {
                        isConnected = true;
                        break;
                    }
                }

                if (!isConnected) {
                    console.warn(`⚠️ Route rooms not connected: ${currentRoom} ↔ ${nextRoom} for ${this.npcId}`);
                    merged.patrol.multiRoom = false;
                    return;
                }
            }

            // Pre-load all route rooms
            console.log(`🚪 Pre-loading ${route.length} rooms for multi-room route: ${route.map(r => r.room).join(' → ')}`);
            for (const segment of route) {
                const roomId = segment.room;
                if (window.rooms && !window.rooms[roomId]) {
                    // A locked room would be refused by the server (403): its route
                    // action (a waypoint "action": { "unlockRoom": ... }) unlocks and
                    // loads it when the NPC gets there.
                    if (gameScenario.rooms[roomId]?.locked) {
                        console.log(`🔒 Not pre-loading locked route room ${roomId} (its route action loads it)`);
                        continue;
                    }
                    // Pre-load the room if not already loaded
                    window.loadRoom(roomId).catch(err => {
                        console.warn(`⚠️ Failed to pre-load room ${roomId}:`, err);
                    });
                }
            }

            console.log(`✅ Multi-room route validated for ${this.npcId} with ${route.length} segments`);
        } catch (error) {
            console.error(`❌ Error validating multi-room route for ${this.npcId}:`, error);
            merged.patrol.multiRoom = false;
        }
    }

    update(time, delta, playerPos) {
        try {
            // Validate sprite
            if (!this.sprite || !this.sprite.body || this.sprite.destroyed) {
                console.warn(`⚠️ Invalid sprite for ${this.npcId}, skipping update`);
                return;
            }

            // Skip all behaviour for hidden NPCs (body.enable = false is set by
            // initiallyHidden and isVisible:false handling in npc-sprites.js).
            // When the body is disabled, Phaser's physics preUpdate() is skipped,
            // so body.center is never synced from the sprite — causing stale
            // position reads that trigger false home-push returns and spam logs.
            if (!this.sprite.body.enable) {
                return;
            }

            // A seated NPC (scenario "seated", seating.js) holds its chair until a move,
            // hostility or a KO gets it up
            if (window.seating?.updateSeatedNPC?.(this, playerPos)) {
                return;
            }

            // Needs NPCs (npc-needs.js) hold still while the player talks to them,
            // even mid-walk: a goToAndStay move never pauses on its own. Scoped to
            // needs NPCs so every other NPC behaves as before.
            if (window.npcNeedsSystem?.has?.(this.npcId) && window.npcNeedsSystem.world?.inChatWith?.(this.npcId)) {
                this.sprite.body.setVelocity(0, 0);
                if (this.isMoving) {
                    this.isMoving = false;
                    this.playAnimation('idle', this.direction);
                }
                this.updateDepth();
                return;
            }

            // Update NPC's current room if they've moved to a different room
            // This allows hostile NPCs to chase across rooms with correct pathfinding
            this.updateCurrentRoom();

            // A route walker collides with the walls of every route room once loaded
            // (npc-sprites.js only adds the spawn room's)
            if (this.config?.patrol?.multiRoom && this.config.patrol.route?.length > 0) {
                this._ensureRouteWallColliders();
            }

            // Check if NPC is stuck in a wall and needs to escape
            this.checkAndEscapeWall(time);

            // Check if NPC has been pushed from home position (for stationary NPCs)
            this.checkAndHandleHomePush();

            // Main behavior update logic
            // 1. Determine highest priority state
            const state = this.determineState(playerPos);

            // 2. Execute state behavior
            this.executeState(state, time, delta, playerPos);

            // 3. CRITICAL: Update depth after any movement
            // This ensures correct Y-sorting with player and other NPCs
            this.updateDepth();

        } catch (error) {
            console.error(`❌ Behavior update error for ${this.npcId}:`, error);
        }
    }

    /**
     * Update NPC's current room based on their position
     * This allows NPCs to chase across rooms and use correct pathfinding data
     */
    updateCurrentRoom() {
        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        if (!pathfindingManager) return;

        const { x: npcX, y: npcY } = this.npcBodyPos();

        // Check all loaded rooms to see which one contains the NPC
        const roomBounds = pathfindingManager.roomBounds;
        for (const [roomId, bounds] of roomBounds) {
            const roomMinX = bounds.worldX;
            const roomMinY = bounds.worldY;
            const roomMaxX = bounds.worldX + (bounds.mapWidth * 32);
            const roomMaxY = bounds.worldY + (bounds.mapHeight * 32);

            // Check if NPC is within this room's bounds
            if (npcX >= roomMinX && npcX <= roomMaxX && npcY >= roomMinY && npcY <= roomMaxY) {
                if (this.roomId !== roomId) {
                    console.log(`🚪 [${this.npcId}] Moved from ${this.roomId} to ${roomId}`);
                    this.roomId = roomId;
                    // A route walker's room is where he is (sight checks, LOS read npc.roomId)
                    if (this.config?.patrol?.multiRoom && this.config.patrol.route?.length > 0) {
                        const npcData = window.npcManager?.npcs?.get(this.npcId);
                        if (npcData) npcData.roomId = roomId;
                    }
                    
                    // Clear chase path since we're in a new room
                    this.chasePath = [];
                    this.chasePathIndex = 0;
                }
                return; // Found the room, stop checking
            }
        }
    }

    determineState(playerPos) {
        if (!playerPos) {
            return 'idle';
        }

        // Calculate distance to player (both measured at feet/body-centre)
        const { x: nx, y: ny } = this.npcBodyPos();
        const dx = playerPos.x - nx;
        const dy = playerPos.y - ny;
        const distanceSq = dx * dx + dy * dy;

        // Check hostile state from hostile system (overrides config)
        const isHostile = window.npcHostileSystem && window.npcHostileSystem.isNPCHostile(this.npcId);
        const isKO = window.npcHostileSystem && window.npcHostileSystem.isNPCKO(this.npcId);

        // If KO, always idle
        if (isKO) {
            return 'idle';
        }

        // Priority 5: Chase (hostile + in range). A leashed NPC (7.1a,
        // behavior.hostile.leash) gives up past chaseRange from its post, or
        // once the player leaves its room, and falls through to going home or
        // its patrol; an unleashed one follows the player anywhere
        if (isHostile && distanceSq < this.config.hostile.aggroDistanceSq) {
            if (!this._chaseAnchor) this._chaseAnchor = this._chasePost();
            if (!this.config.hostile.leash || hostileMayChase({
                playerPos,
                playerRoomId: window.currentPlayerRoom || null,
                anchor: this._chaseAnchor,
                chaseRange: this.config.hostile.chaseRange,
                acrossRooms: this.config.hostile.chaseAcrossRooms
            })) {
                this._lastChaseAt = Date.now();
                this._gaveUpChase = false;
                return 'chase';
            }
            if (!this._gaveUpChase) {
                this._gaveUpChase = true;
                this.chasePath = [];
                this.chasePathIndex = 0;
                console.log(`🪢 [${this.npcId}] Gave up the chase (past its leash), returning to its post`);
            }
        } else {
            this._releaseChaseAnchor(isHostile);
        }

        // A hostile that gave up walks back (home or patrol) rather than
        // stopping to stare at the player across the door
        if (isHostile && this._gaveUpChase && this.config.patrol.enabled) {
            return 'patrol';
        }

        // Priority 3: Maintain Personal Space
        // (none of the turn-to-player states fire through a wall: canSeePlayerToFace)
        if (this.config.personalSpace.enabled && distanceSq < this.config.personalSpace.distanceSq && this.canSeePlayerToFace(playerPos)) {
            return 'maintain_space';
        }

        // Priority 2: Patrol
        if (this.config.patrol.enabled) {
            // Check if player is in interaction range - if so, face player instead (configurable).
            // A scripted goToAndStay move (patrolOverride) never pauses: a nurse answering
            // an alarm must reach the bed even when the player is standing beside it.
            if (this.config.patrol.pauseForPlayer && (!this._stopOnArrival || this._moveYieldsToPlayer) && distanceSq < this.config.facePlayerDistanceSq && this.config.facePlayer && this.canSeePlayerToFace(playerPos)) {
                return 'face_player';
            }
            return 'patrol';
        }

        // Priority 1: Face Player
        if (this.config.facePlayer && distanceSq < this.config.facePlayerDistanceSq && this.canSeePlayerToFace(playerPos)) {
            return 'face_player';
        }

        // Priority 0: Idle
        return 'idle';
    }

    /**
     * Where the chase leash is measured from (7.1a): a stationary NPC's home
     * spot in its own room; for a patroller, where it was when the chase began.
     */
    _chasePost() {
        const stationary = !this.config.patrol.enabled || this.returningHome;
        if (stationary && this.homePosition) {
            return { x: this.homePosition.x, y: this.homePosition.y, roomId: this.homeRoomId };
        }
        const { x, y } = this.npcBodyPos();
        return { x, y, roomId: this.roomId };
    }

    /** Forget the leash post once the NPC is calm, or has stopped chasing for a while. */
    _releaseChaseAnchor(isHostile) {
        if (!this._chaseAnchor) return;
        if (!isHostile || Date.now() - this._lastChaseAt > 8000) {
            this._chaseAnchor = null;
            this._gaveUpChase = false;
        }
    }

    executeState(state, time, delta, playerPos) {
        this.currentState = state;

        // Check if NPC is KO - if so, don't override death animation
        const isKO = window.npcHostileSystem && window.npcHostileSystem.isNPCKO(this.npcId);
        if (isKO) {
            // NPC is knocked out - stop movement but don't change animation (death anim is playing)
            this.sprite.body.setVelocity(0, 0);
            this.isMoving = false;
            return;
        }

        switch (state) {
            case 'idle':
                this.sprite.body.setVelocity(0, 0);
                this.playAnimation('idle', this.direction);
                this.isMoving = false;
                break;

            case 'face_player':
                this.facePlayer(playerPos);
                this.sprite.body.setVelocity(0, 0);
                this.isMoving = false;
                break;

            case 'patrol':
                this.updatePatrol(time, delta);
                break;

            case 'maintain_space':
                this.maintainPersonalSpace(playerPos, delta);
                break;

            case 'chase':
                // Stub for future implementation
                this.updateHostileBehavior(playerPos, delta);
                break;

            case 'flee':
                // Stub for future implementation
                this.updateHostileBehavior(playerPos, delta);
                break;
        }
    }

    /**
     * The one clock for this NPC's patrol timers (lastPatrolChange, dwell, settling,
     * path retry back-off, route waits, stuck watch): Phaser scene time, which
     * update(time) also receives. In Phaser 3.60 that is the rAF timestamp, on the
     * performance.now() timeline (ms since page load), so performance.now() is the
     * fallback before the scene clock has started. Never Date.now(): epoch ms is
     * ~1.8e12 and stamped into lastPatrolChange it made `time - lastPatrolChange`
     * hugely negative, so the stall re-target never fired again for that NPC.
     */
    clockNow() {
        const t = this.scene?.time?.now;
        if (Number.isFinite(t) && t > 0) return t;
        return typeof performance !== 'undefined' ? performance.now() : 0;
    }

    /**
     * Returns the world position of this NPC's physics body centre (feet collider).
     * Use this for all pathfinding, LOS and distance checks — mirrors playerBodyPos()
     * in player.js.
     */
    npcBodyPos() {
        if (this.sprite?.body) {
            return { x: this.sprite.body.center.x, y: this.sprite.body.center.y };
        }
        return { x: this.sprite.x, y: this.sprite.y };
    }

    /**
     * May this NPC turn towards the player? Not through a wall. An NPC with an
     * los block uses its sight occlusion (walls, closed doors and tall props;
     * los.occlusion: false sees through all of it); any other NPC only the
     * walls-and-closed-doors test. Both from npc-sight-occlusion.js, feet to
     * feet. Cached for FACE_SIGHT_MS.
     */
    canSeePlayerToFace(playerPos) {
        const occ = window.npcSightOcclusion;
        if (!occ || !playerPos) return true;
        const now = Date.now();
        if (this._faceSightAt !== undefined && now - this._faceSightAt < FACE_SIGHT_MS) return this._faceSightClear;
        const los = window.npcManager?.getNPC?.(this.npcId)?.los;
        const from = this.npcBodyPos();
        let clear = true;
        if (los && typeof los === 'object') {
            if (los.occlusion !== false && typeof occ.isClearBetween === 'function') clear = occ.isClearBetween(from, playerPos);
        } else if (typeof occ.isWallClearBetween === 'function') {
            clear = occ.isWallClearBetween(from, playerPos);
        }
        this._faceSightAt = now;
        this._faceSightClear = clear;
        return clear;
    }

    facePlayer(playerPos) {
        if (!this.config.facePlayer || !playerPos) return;
        if (!this.canSeePlayerToFace(playerPos)) return; // wall between

        const { x: nx, y: ny } = this.npcBodyPos();
        const dx = playerPos.x - nx;
        const dy = playerPos.y - ny;

        // Calculate direction (8-way)
        this.direction = this.calculateDirection(dx, dy);

        // Play idle animation facing player
        this.playAnimation('idle', this.direction);
    }
    updatePatrol(time, delta) {
        if (!this.config.patrol.enabled) return;

        // Belt and braces for clockNow(): a stamp from another clock lies far in
        // this clock's future and would never expire (a frozen NPC). Pull it back.
        if (this.lastPatrolChange > time) this.lastPatrolChange = time;
        if (this.isSettling && this.settleEndTime - time > this.settleDuration) {
            this.settleEndTime = time + this.settleDuration;
        }

        // If settling after collision, pause patrol briefly to let physics settle
        if (this.isSettling) {
            if (time >= this.settleEndTime) {
                // Settling complete, resume patrol
                this.isSettling = false;
                console.log(`✅ [${this.npcId}] Finished settling, resuming patrol`);
            } else {
                // Still settling - don't move, just idle
                this.sprite.body.setVelocity(0, 0);
                this.playAnimation('idle', this.direction);
                this.isMoving = false;
                return;
            }
        }

        // If we just finished returning home, don't continue patrol
        if (this.returningHome && !this.config.patrol.enabled) {
            return;
        }

        // Update debug visualization
        if (this.pathFollowingActive && this.currentPath.length > 0) {
            this._drawPatrolPathDebug(this.currentPath);
        } else {
            this._clearPatrolPathDebug();
        }

        // Check if path needs recalculation (e.g., after NPC-to-NPC collision avoidance)
        if (this._needsPathRecalc && this.patrolTarget) {
            this._needsPathRecalc = false;
            console.log(`🔄 [${this.npcId}] Recalculating path to waypoint after collision avoidance`);
            
            // Clear current path and recalculate
            this.currentPath = [];
            this.pathIndex = 0;
            
            const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
            if (pathfindingManager) {
                const { x: rnx, y: rny } = this.npcBodyPos();
                const rSnapped = pathfindingManager.findNearestWalkableStartCell(rnx, rny)
                                 || { x: rnx, y: rny };
                this._planMovePath(pathfindingManager,
                    rSnapped.x,
                    rSnapped.y,
                    this.patrolTarget.x,
                    this.patrolTarget.y,
                    (path) => {
                        if (path && path.length > 0) {
                            this.currentPath = path;
                            this.pathIndex = 0;
                            console.log(`✅ [${this.npcId}] Recalculated path with ${path.length} waypoints after collision`);
                        } else {
                            console.warn(`⚠️ [${this.npcId}] Path recalculation failed after collision`);
                        }
                    }
                );
            }
            return;
        }

        // Handle dwell time at waypoint
        // Only start dwelling if:
        // 1. We have a target waypoint with dwell time
        // 2. We've finished following the path to that waypoint (pathFollowingActive is false)
        if (this.patrolTarget && this.patrolTarget.dwellTime && this.patrolTarget.dwellTime > 0 && !this.pathFollowingActive) {
            if (this.patrolReachedTime === 0) {
                // Just reached waypoint, start dwell timer
                this.patrolReachedTime = time;
                this.sprite.body.setVelocity(0, 0);
                this.playAnimation('idle', this.direction);
                this.isMoving = false;
                console.log(`⏸️ [${this.npcId}] Dwelling at waypoint (${this.patrolTarget.x}, ${this.patrolTarget.y}) for ${this.patrolTarget.dwellTime}ms`);
                return;
            }

            // Check if dwell time expired
            const dwellElapsed = time - this.patrolReachedTime;
            if (dwellElapsed < this.patrolTarget.dwellTime) {
                // Still dwelling - face player only if pauseForPlayer is enabled
                if (this.config.patrol.pauseForPlayer) {
                    const dwellPlayer = window.player;
                    const playerPos = dwellPlayer ? {
                        x: dwellPlayer.body?.center.x ?? dwellPlayer.x,
                        y: dwellPlayer.body?.center.y ?? dwellPlayer.y
                    } : null;
                    if (playerPos) {
                        const { x: dnx, y: dny } = this.npcBodyPos();
                        const distSq = (dnx - playerPos.x) ** 2 + (dny - playerPos.y) ** 2;
                        if (distSq < this.config.facePlayerDistanceSq && this.config.facePlayer) {
                            this.facePlayer(playerPos);
                        }
                    }
                }
                return;
            }

            // Dwell time expired, reset and choose next target
            console.log(`✅ [${this.npcId}] Dwell time expired (${dwellElapsed}ms >= ${this.patrolTarget.dwellTime}ms), choosing next target`);
            this.patrolReachedTime = 0;
            // Don't clear path/target yet - let chooseNewPatrolTarget do that
            this.chooseNewPatrolTarget(time);
            return;
        }

        // Time to choose a new patrol target? Random wandering re-targets every
        // changeDirectionInterval. A waypoint patrol keeps walking to its waypoint
        // (a leg longer than the interval used to be cut short, so the NPC never
        // arrived or dwelt: m02 Val, 3.6 s legs against the 3 s default) and only
        // re-targets if it has stopped making progress for that long.
        const intervalElapsed = time - this.lastPatrolChange > this.config.patrol.changeDirectionInterval;
        if (!this.patrolTarget ||
            this.currentPath.length === 0 ||
            (intervalElapsed && (!this._isWaypointPatrol() || this._patrolStalled(time)))) {
            // Don't fire another findWorldPath while one is already in flight, and
            // respect the retry backoff set after a failed path request.
            if (this._pathfindingInProgress) return;
            if (this._pathRetryAfter > 0 && time < this._pathRetryAfter) return;
            this.chooseNewPatrolTarget(time);
            return;
        }

        // Arrival-tolerance guard: when doing a goToAndStay move, stop as soon as
        // we're within 1 tile of the destination even if the exact final cell is
        // blocked (e.g. occupied by another NPC).  This prevents endless
        // collision-avoidance oscillation near the target.
        // NOTE: was 2 tiles, reduced to 1 tile — the 2-tile radius caused the nurse
        // to stop ~2 tiles short of the target when approaching from the bed 5 side,
        // making her appear to be near bed 5 instead of the bed 4 monitor.
        if (this._stopOnArrival && this._goToStayDest) {
            const { x: gnx, y: gny } = this.npcBodyPos();
            const gdx = this._goToStayDest.x - gnx;
            const gdy = this._goToStayDest.y - gny;
            if (gdx * gdx + gdy * gdy < TILE_SIZE * TILE_SIZE) {
                this._triggerGoToStayArrival();
                return;
            }
        }

        // Follow current path
        if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
            const nextWaypoint = this.currentPath[this.pathIndex];
            const { x: pnx, y: pny } = this.npcBodyPos();
            const dx = nextWaypoint.x - pnx;
            const dy = nextWaypoint.y - pny;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Reached waypoint? Move to next
            if (distance < 8) {
                this.pathIndex++;

                // Reached end of path? Choose new target
                if (this.pathIndex >= this.currentPath.length) {
                    if (this._stopOnArrival) {
                        // NPC has arrived at its emergency destination — stop permanently
                        this._triggerGoToStayArrival();
                        return;
                    }
                    // Path complete, mark reached time and stop following path
                    this.patrolReachedTime = time;
                    // A route waypoint with an action runs it before the next leg
                    if (this.patrolTarget?.routeAction) this._pendingRouteAction = this.patrolTarget.routeAction;
                    this.pathFollowingActive = false; // Path is done, dwell will start next frame
                    this.sprite.body.setVelocity(0, 0); // Stop movement immediately
                    this.isMoving = false;
                    this.playAnimation('idle', this.direction); // Play idle instead of walk
                    console.log(`🎯 [${this.npcId}] Reached waypoint at (${this.patrolTarget.x}, ${this.patrolTarget.y}), path complete`);
                    return;
                }
                return; // Let next frame handle the new waypoint
            }

            // Wedged on the way (a corner, a prop, another NPC)? Recover rather
            // than push at it for ever.
            if (this._checkPathStuck(time)) return;

            // Move toward current waypoint
            const velocityX = (dx / distance) * this.config.patrol.speed;
            const velocityY = (dy / distance) * this.config.patrol.speed;
            this.sprite.body.setVelocity(velocityX, velocityY);

            // Update direction and animation
            this.direction = this.calculateDirection(dx, dy);
            this.playAnimation('walk', this.direction);
            this.isMoving = true;

            // console.log(`🚶 [${this.npcId}] Patrol waypoint ${this.pathIndex + 1}/${this.currentPath.length} - velocity: (${velocityX.toFixed(0)}, ${velocityY.toFixed(0)})`);
        } else {
            // No path found, choose new target
            this.chooseNewPatrolTarget(time);
        }
    }

    /**
     * Stuck watch. Called only from updatePatrol's path-following branch, so it
     * never runs while the NPC dwells, settles, has arrived (goToAndStay), sits,
     * talks, is KO or hidden, waits on a route action or has no path. It also
     * re-arms while a path request is in flight and while the player stands
     * beside the NPC (the player holding it up is play, not a wedge).
     * Progress is NPC_STUCK_MOVE_PX of movement or reaching a path node. After
     * NPC_STUCK_MS without progress it recovers, escalating while the NPC stays
     * put: 1) re-path to the same target; 2) nudge onto the nearest walkable
     * cell (at most a tile) and re-path; 3) drop the target, so the patrol
     * chooses again next frame. Real progress resets the escalation.
     * @returns {boolean} true when it acted this frame (the caller stops there)
     */
    _checkPathStuck(time) {
        const { x, y } = this.npcBodyPos();
        const w = this._stuckWatch;
        const moved = w && (x - w.x) ** 2 + (y - w.y) ** 2 > NPC_STUCK_MOVE_PX ** 2;
        const advanced = w && w.path === this.currentPath && this.pathIndex > w.pathIndex;
        if (!w || moved || advanced) {
            this._stuckWatch = { x, y, since: time, lastSeen: time,
                path: this.currentPath, pathIndex: this.pathIndex, attempts: 0 };
            return false;
        }
        const rearm = !(time >= w.lastSeen) || time - w.lastSeen > NPC_STUCK_GAP_MS ||
            this._pathfindingInProgress || !(this.config.patrol.speed > 0) || this._playerBeside(x, y);
        w.lastSeen = time;
        w.path = this.currentPath;
        w.pathIndex = this.pathIndex;
        if (rearm) {
            w.x = x; w.y = y; w.since = time;
            return false;
        }
        if (time - w.since < NPC_STUCK_MS) return false;

        w.attempts++;
        w.since = time;
        const anchor = this._recoverFromStuck(w.attempts, x, y);
        w.x = anchor.x; w.y = anchor.y;
        if (w.attempts >= 3) w.attempts = 0;
        return true;
    }

    /** Is the player's body within NPC_STUCK_PLAYER_PX of (x, y)? */
    _playerBeside(x, y) {
        const p = window.player;
        if (!p) return false;
        const px = p.body?.center?.x ?? p.x;
        const py = p.body?.center?.y ?? p.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
        return (px - x) ** 2 + (py - y) ** 2 < NPC_STUCK_PLAYER_PX ** 2;
    }

    /**
     * One recovery step for _checkPathStuck. Returns where the NPC now stands
     * (the stuck watch's new anchor, so a nudge doesn't count as progress).
     */
    _recoverFromStuck(attempt, x, y) {
        const pfm = this.pathfindingManager || window.pathfindingManager;
        const target = this.patrolTarget;
        this.sprite.body.setVelocity(0, 0);
        this.isMoving = false;
        this._patrolProgress = null;
        this._needsPathRecalc = false;
        console.warn(`🧱 [${this.npcId}] No progress for ${NPC_STUCK_MS}ms at (${x.toFixed(0)}, ${y.toFixed(0)}), recovery step ${Math.min(attempt, 3)}`);

        if (attempt >= 3 || !target || typeof pfm?.findWorldPath !== 'function') {
            this.currentPath = [];
            this.pathIndex = 0;
            this.patrolTarget = null;
            this.pathFollowingActive = false;
            this._pathRetryAfter = 0;
            return { x, y };
        }

        let at = { x, y };
        if (attempt >= 2) at = this._nudgeToWalkable(pfm, x, y);
        const from = pfm.findNearestWalkableStartCell?.(at.x, at.y) || at;
        this._pathfindingInProgress = true;
        this._planMovePath(pfm, from.x, from.y, target.x, target.y, (path) => {
            this._pathfindingInProgress = false;
            if (this.patrolTarget !== target) return; // re-targeted meanwhile
            if (path && path.length > 0) {
                this.currentPath = path;
                this.pathIndex = 0;
                this.pathFollowingActive = true;
            } else {
                this.currentPath = [];
                this.patrolTarget = null;
                this.pathFollowingActive = false;
                this._pathRetryAfter = this.clockNow() + 2000;
            }
        });
        return at;
    }

    /**
     * Move the NPC's feet onto the centre of the nearest walkable grid cell, if
     * that is within NPC_STUCK_NUDGE_MAX_PX (an NPC clipping a corner or a
     * prop's clearance). Returns the new feet position.
     */
    _nudgeToWalkable(pfm, x, y) {
        const cell = pfm.findNearestWalkableStartCell?.(x, y);
        if (!cell) return { x, y };
        const dx = cell.x - x, dy = cell.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 4 || d2 > NPC_STUCK_NUDGE_MAX_PX ** 2) return { x, y };
        const sx = this.sprite.x + dx, sy = this.sprite.y + dy;
        if (typeof this.sprite.body.reset === 'function') this.sprite.body.reset(sx, sy);
        else if (typeof this.sprite.setPosition === 'function') this.sprite.setPosition(sx, sy);
        else { this.sprite.x = sx; this.sprite.y = sy; }
        console.log(`↔️ [${this.npcId}] Nudged ${Math.sqrt(d2).toFixed(0)}px onto a walkable cell`);
        return { x: cell.x, y: cell.y };
    }

    /**
     * findWorldPath for the walk's own planning points (chooseWaypointTarget, the multi-room
     * route, the collision repath, the stuck recovery). During a needs move it carries the move's
     * room leash (OFFICE_LIFE_PLAN 7.2), so the walk takes the same permitted route the needs
     * system's reachability check approved. Any other move or patrol plans unconstrained.
     */
    _planMovePath(pfm, sx, sy, ex, ey, callback) {
        const rooms = this._moveOwner === 'needs' ? this._moveAvoidRooms : null;
        if (rooms?.length) return pfm.findWorldPath(sx, sy, ex, ey, callback, false, { avoidRooms: rooms });
        return pfm.findWorldPath(sx, sy, ex, ey, callback);
    }

    /** Does this patrol follow waypoints (single-room or a multi-room route)? */
    _isWaypointPatrol() {
        const patrol = this.config.patrol;
        return (patrol.waypoints?.length > 0) ||
            !!(patrol.multiRoom && patrol.route?.length > 0);
    }

    /**
     * True once the NPC has moved less than 4 px for a whole changeDirectionInterval
     * since its current target was chosen (blocked by another NPC or furniture).
     */
    _patrolStalled(time) {
        const { x, y } = this.npcBodyPos();
        const mark = this._patrolProgress;
        if (!mark || mark.target !== this.patrolTarget ||
            (x - mark.x) ** 2 + (y - mark.y) ** 2 > 16) {
            this._patrolProgress = { x, y, time, target: this.patrolTarget };
            return false;
        }
        return time - mark.time > this.config.patrol.changeDirectionInterval;
    }

    chooseNewPatrolTarget(time) {
        // Don't choose new targets if we just disabled patrol (e.g., finished returning home)
        if (!this.config.patrol.enabled) {
            return;
        }

        // Check if using waypoint patrol (a multi-room route needs no top-level waypoints)
        if (this._isWaypointPatrol()) {
            this.chooseWaypointTarget(time);
        } else {
            // Fall back to random patrol
            this.chooseRandomPatrolTarget(time);
        }
    }

    /**
     * Choose target from waypoint list (single-room or multi-room)
     */
    chooseWaypointTarget(time) {
        // Handle multi-room routes
        if (this.config.patrol.multiRoom && this.config.patrol.route && this.config.patrol.route.length > 0) {
            this.chooseWaypointTargetMultiRoom(time);
            return;
        }

        // Single-room waypoint patrol
        let nextWaypoint;

        if (this.config.patrol.waypointMode === 'sequential') {
            // Sequential: follow waypoints in order
            nextWaypoint = this.config.patrol.waypoints[this.config.patrol.waypointIndex];
            console.log(`🎯 [${this.npcId}] Waypoint mode: sequential, index ${this.config.patrol.waypointIndex} of ${this.config.patrol.waypoints.length}`);
            this.config.patrol.waypointIndex = (this.config.patrol.waypointIndex + 1) % this.config.patrol.waypoints.length;
        } else {
            // Random: pick random waypoint
            const randomIndex = Math.floor(Math.random() * this.config.patrol.waypoints.length);
            nextWaypoint = this.config.patrol.waypoints[randomIndex];
            console.log(`🎯 [${this.npcId}] Waypoint mode: random, picked index ${randomIndex}`);
        }

        if (!nextWaypoint) {
            console.warn(`⚠️ [${this.npcId}] No valid waypoint, falling back to random patrol`);
            this.chooseRandomPatrolTarget(time);
            return;
        }

        // Request pathfinding to waypoint
        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        if (!pathfindingManager) {
            console.warn(`⚠️ No pathfinding manager for ${this.npcId}`);
            return;
        }

        // Snap the destination to the nearest walkable cell so that a blocked target tile
        // (e.g. an NPC or interactable object sitting on it) doesn't permanently prevent
        // pathfinding — the NPC will navigate as close as possible instead.
        const wpDest = pathfindingManager.findNearestWalkableWorldCell(nextWaypoint.worldX, nextWaypoint.worldY)
                       || { x: nextWaypoint.worldX, y: nextWaypoint.worldY };

        this.patrolTarget = {
            x: wpDest.x,
            y: wpDest.y,
            dwellTime: nextWaypoint.dwellTime || 0
        };

        this.lastPatrolChange = time;
        this.pathIndex = 0;
        this.currentPath = [];
        this.patrolReachedTime = 0;
        this.pathFollowingActive = false; // Reset flag when choosing new target

        console.log(`🗺️ [${this.npcId}] New waypoint target at (${wpDest.x}, ${wpDest.y}), dwell: ${nextWaypoint.dwellTime}ms`);

        const { x: wpnx, y: wpny } = this.npcBodyPos();
        const wpSnapped = pathfindingManager.findNearestWalkableStartCell(wpnx, wpny)
                          || { x: wpnx, y: wpny };
        this._pathfindingInProgress = true;
        this._planMovePath(pathfindingManager,
            wpSnapped.x,
            wpSnapped.y,
            wpDest.x,
            wpDest.y,
            (path) => {
                this._pathfindingInProgress = false;
                if (path && path.length > 0) {
                    this._pathRetryAfter = 0; // Clear any backoff on success
                    this.currentPath = path;
                    this.pathIndex = 0;
                    this.pathFollowingActive = true; // Path is ready, start following
                    console.log(`✅ [${this.npcId}] Path calculated: ${path.length} waypoints to target`);
                } else {
                    // Waypoint is unreachable — back off before retrying so we don't flood
                    // the pathfinding queue every 50ms. 2 s gives the scene time to settle
                    // (e.g. an NPC or object that was blocking a tile may have moved).
                    this._pathRetryAfter = this.clockNow() + 2000;
                    console.warn(`⚠️ [${this.npcId}] No path found to waypoint, will retry in 2s`);
                    this.currentPath = [];
                    this.patrolTarget = null;
                    this.pathFollowingActive = false;
                }
            }
        );
    }

    /**
     * Choose waypoint target for multi-room route
     * Handles transitioning between rooms when waypoints in current room are exhausted
     */
    chooseWaypointTargetMultiRoom(time) {
        const now = this.clockNow();
        // Waiting on a route action (unlock + load the next room): stand still, retry
        // after the back-off, time out after 15 s. Never advance into an unloaded room.
        if (this._routeWait) {
            const w = this._routeWait;
            if (w.inFlight && now > w.until) {
                console.warn(`⏱️ [${this.npcId}] Route action for ${w.roomId} timed out, retrying in 5s`);
                this._routeWait = { roomId: w.roomId, retryAt: now + 5000 };
            } else if (!w.inFlight && now >= w.retryAt) {
                this._runRouteAction(this._pendingRouteAction, time);
            }
            return;
        }
        if (this._pendingRouteAction) {
            this._runRouteAction(this._pendingRouteAction, time);
            return;
        }

        const route = this.config.patrol.route;
        const currentSegmentIndex = this.config.patrol.currentSegmentIndex;
        const currentSegment = route[currentSegmentIndex];

        // Get current room's waypoints
        let currentRoomWaypoints = currentSegment.waypoints;
        if (!currentRoomWaypoints || !Array.isArray(currentRoomWaypoints) || currentRoomWaypoints.length === 0) {
            // No waypoints in this segment, move to next room
            console.log(`⏭️ [${this.npcId}] No waypoints in current segment, moving to next room`);
            this.transitionToNextRoom(time);
            return;
        }

        // Get next waypoint in current room
        let nextWaypoint;
        if (this.config.patrol.waypointMode === 'sequential') {
            // All of this room's waypoints visited (the last one included): next room
            if (this.config.patrol.waypointIndex >= currentRoomWaypoints.length) {
                console.log(`🔄 [${this.npcId}] Completed all waypoints in room ${currentSegment.room}, transitioning...`);
                this.transitionToNextRoom(time);
                return;
            }
            nextWaypoint = currentRoomWaypoints[this.config.patrol.waypointIndex];
        } else {
            // Random: pick random waypoint
            const randomIndex = Math.floor(Math.random() * currentRoomWaypoints.length);
            nextWaypoint = currentRoomWaypoints[randomIndex];
        }

        if (!nextWaypoint) {
            console.warn(`⚠️ [${this.npcId}] No valid waypoint in multi-room route`);
            this.chooseRandomPatrolTarget(time);
            return;
        }

        // Convert tile coordinates to world coordinates for current room. A room that
        // isn't loaded (locked, its route action not run yet): wait, don't wander.
        const roomData = window.rooms?.[currentSegment.room];
        if (!roomData) {
            console.warn(`⚠️ [${this.npcId}] Route room ${currentSegment.room} not loaded, retrying in 2s`);
            this._pathRetryAfter = now + 2000;
            this.patrolTarget = null;
            this.currentPath = [];
            this.pathFollowingActive = false;
            this._haltForRoute();
            return;
        }

        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        if (!pathfindingManager) {
            console.warn(`⚠️ No pathfinding manager for ${this.npcId}`);
            return;
        }

        const roomWorldX = roomData.position?.x || 0;
        const roomWorldY = roomData.position?.y || 0;
        const rawX = roomWorldX + (nextWaypoint.x * TILE_SIZE);
        const rawY = roomWorldY + (nextWaypoint.y * TILE_SIZE);
        // Snap to a walkable cell, as single-room waypoints do
        const dest = pathfindingManager.findNearestWalkableWorldCell?.(rawX, rawY) || { x: rawX, y: rawY };

        this.patrolTarget = {
            x: dest.x,
            y: dest.y,
            dwellTime: nextWaypoint.dwellTime || 0,
            routeAction: nextWaypoint.action || null
        };

        this.lastPatrolChange = time;
        this.pathIndex = 0;
        this.currentPath = [];
        this.patrolReachedTime = 0;
        this.pathFollowingActive = false;

        const segmentAtRequest = currentSegmentIndex;
        const { x: mrnx, y: mrny } = this.npcBodyPos();
        const mrSnapped = pathfindingManager.findNearestWalkableStartCell(mrnx, mrny)
                          || { x: mrnx, y: mrny };
        this._pathfindingInProgress = true;
        this._planMovePath(pathfindingManager,
            mrSnapped.x,
            mrSnapped.y,
            dest.x,
            dest.y,
            (path) => {
                this._pathfindingInProgress = false;
                if (path && path.length > 0) {
                    this._pathRetryAfter = 0;
                    this.currentPath = path;
                    this.pathIndex = 0;
                    this.pathFollowingActive = true;   // so a dwell runs on arrival, not before the leg
                    // This waypoint is taken: the next choice is the one after it
                    if (this.config.patrol.waypointMode === 'sequential' &&
                        this.config.patrol.currentSegmentIndex === segmentAtRequest) {
                        this.config.patrol.waypointIndex++;
                    }
                    console.log(`✅ [${this.npcId}] Route path with ${path.length} waypoints to (${nextWaypoint.x}, ${nextWaypoint.y}) in ${currentSegment.room}`);
                } else {
                    // Unreachable (a shut door, a body in the way): stay on this
                    // waypoint and retry after a back-off; never skip a room.
                    // If a shut gate of his own is what stands in the way and he is
                    // out of its reach, he walks back to it first (it opens as he
                    // nears), or he would retry from where he stands for ever.
                    if (this._approachRouteGate(pathfindingManager, [currentSegment.room])) return;
                    console.warn(`⚠️ [${this.npcId}] Waypoint (${nextWaypoint.x}, ${nextWaypoint.y}) in ${currentSegment.room} unreachable, retrying in 2s`);
                    this._pathRetryAfter = this.clockNow() + 2000;
                    this.currentPath = [];
                    this.patrolTarget = null;
                    this.pathFollowingActive = false;
                }
            }
        );
    }

    /** A gate this NPC opens has just opened (door-gates.js): retry a failed route leg now. */
    gateOpened() {
        this._pathRetryAfter = 0;
    }

    /**
     * A route leg was unreachable. If this NPC has a shut gate door of his own into
     * one of `roomIds` and stands outside its reach, head for the spot in front of
     * it (door-gates.js approachPoint) without taking the waypoint: the gate opens
     * as he nears and the next choice finds the leg. This is what brings a guard
     * back after the player has pushed him along a wall, away from his door, or
     * when a leg ends just out of the gate's radius. Before this he retried the
     * same unreachable path from where he stood, for good.
     * @returns {boolean} true when he is now heading for (or planning a path to) the gate
     */
    _approachRouteGate(pfm, roomIds) {
        const gates = window.doorGates;
        if (typeof gates?.approachPoint !== 'function' || typeof pfm?.findWorldPath !== 'function') return false;
        const { x, y } = this.npcBodyPos();
        const spot = gates.approachPoint(this.npcId, { x, y }, roomIds);
        if (!spot) return false;
        const dest = pfm.findNearestWalkableWorldCell?.(spot.x, spot.y) || { x: spot.x, y: spot.y };
        // Already as close as the floor allows: nothing to walk, so back off as before
        if ((dest.x - x) ** 2 + (dest.y - y) ** 2 < 8 * 8) return false;
        const from = pfm.findNearestWalkableStartCell?.(x, y) || { x, y };
        const target = { x: dest.x, y: dest.y, dwellTime: 0, routeAction: null, gateApproach: true };
        this.patrolTarget = target;
        this.currentPath = [];
        this.pathIndex = 0;
        this.patrolReachedTime = 0;
        this.pathFollowingActive = false;
        this._pathfindingInProgress = true;
        console.log(`🚪 [${this.npcId}] Route leg blocked by a shut gate out of reach: walking back to it at (${dest.x.toFixed(0)}, ${dest.y.toFixed(0)})`);
        this._planMovePath(pfm, from.x, from.y, dest.x, dest.y, (path) => {
            this._pathfindingInProgress = false;
            if (this.patrolTarget !== target) return;   // re-targeted meanwhile
            if (path && path.length > 0) {
                this._pathRetryAfter = 0;
                this.currentPath = path;
                this.pathIndex = 0;
                this.pathFollowingActive = true;
            } else {
                this._pathRetryAfter = this.clockNow() + 2000;
                this.currentPath = [];
                this.patrolTarget = null;
                this.pathFollowingActive = false;
            }
        });
        return true;
    }

    _ensureRouteWallColliders() {
        if (!this._routeWallRooms.size) this._routeWallRooms.add(this.homeRoomId || this.roomId);   // spawn room: rooms.js added it
        const physics = this.scene?.physics || window.game?.scene?.scenes?.[0]?.physics;
        if (!physics?.add?.collider) return;
        for (const seg of this.config.patrol.route) {
            const roomId = seg?.room;
            if (!roomId || this._routeWallRooms.has(roomId)) continue;
            const room = window.rooms?.[roomId];
            if (!room?.wallCollisionBoxes) continue;
            room.wallCollisionBoxes.forEach(box => { if (box.body) physics.add.collider(this.sprite, box); });
            this._routeWallRooms.add(roomId);
            console.log(`🧱 [${this.npcId}] Wall collisions added for route room ${roomId}`);
        }
    }

    /** Stop walking and idle (waiting on a route action or an unloaded room). */
    _haltForRoute() {
        if (this.sprite?.body) this.sprite.body.setVelocity(0, 0);
        if (this.isMoving) {
            this.isMoving = false;
            this.playAnimation('idle', this.direction);
        }
    }

    /**
     * Run a route waypoint's action, e.g. { "unlockRoom": "vault", "useObject": "reader" }.
     * unlockRoom: unlock the room on the server as this NPC (the NPC needs an
     * eventMapping with unlockDoor naming the room: game.rb npc_mapping_unlocks_door?),
     * load it, wait for the world grid to include it, then carry on. On failure, back
     * off 5 s and retry; the route never moves on into an unloaded room. Once the room
     * is loaded the action is only a pause (no network call).
     */
    _runRouteAction(action, time) {
        const roomId = action?.unlockRoom;
        if (action?.useObject) this._faceRouteObject(action.useObject);
        if (!roomId || window.rooms?.[roomId]) {
            this._pendingRouteAction = null;
            this._routeWait = null;
            return;
        }
        const token = {};
        this._routeWait = { roomId, inFlight: true, until: this.clockNow() + 15000, token };
        this.patrolTarget = null;
        this.currentPath = [];
        this.pathFollowingActive = false;
        this._haltForRoute();
        console.log(`🔑 [${this.npcId}] Route action: unlock and load ${roomId}`);
        (async () => {
            const locked = !!window.gameScenario?.rooms?.[roomId]?.locked;
            if (locked) {
                const res = await window.NPCGameBridge?.unlockDoor?.(roomId, this.npcId);
                if (!res?.success) {
                    this._warnUnlockRefusedOnce(roomId);
                    throw new Error(res?.error || 'unlock refused');
                }
            }
            await window.loadRoom?.(roomId);
            if (!window.rooms?.[roomId]) throw new Error('room did not load');
            // initializeRoomPathfinding rebuilds the world grid 200 ms after the room is made
            await new Promise(r => setTimeout(r, 300));
        })().then(() => {
            if (this._routeWait?.token !== token) return;
            console.log(`✅ [${this.npcId}] Route action done: ${roomId} unlocked and loaded`);
            this._routeWait = null;
            this._pendingRouteAction = null;
        }).catch(err => {
            if (this._routeWait?.token !== token) return;
            console.warn(`⚠️ [${this.npcId}] Route action for ${roomId} failed (${err?.message || err}), retrying in 5s`);
            this._routeWait = { roomId, retryAt: this.clockNow() + 5000 };
        });
    }

    /** One console.warn per NPC+room when the server refuses a route unlockRoom (retries stay quiet). */
    _warnUnlockRefusedOnce(roomId) {
        if (!this._unlockRefusalWarned) this._unlockRefusalWarned = new Set();
        if (this._unlockRefusalWarned.has(roomId)) return;
        this._unlockRefusalWarned.add(roomId);
        console.warn(`⚠️ [${this.npcId}] The server refused this NPC's route unlockRoom for '${roomId}'. ` +
            `Fix: add an eventMapping with unlockDoor: "${roomId}" to this NPC (see README_scenario_design.md); ` +
            `without one the NPC retries at the door forever.`);
    }

    _faceRouteObject(objectId) {
        for (const room of Object.values(window.rooms || {})) {
            const objs = room?.objects;
            if (!objs) continue;
            const sp = objs[objectId] || Object.values(objs).find(o => o?.scenarioData?.id === objectId);
            if (sp && typeof this.faceWorldPoint === 'function') { this.faceWorldPoint(sp.x, sp.y); return; }
        }
    }

    /**
     * Move on to the next room in the multi-room route. The sprite is never moved:
     * the NPC walks to the next room's first waypoint through the doorway, on the
     * world grid, and its room follows its position (updateCurrentRoom).
     */
    transitionToNextRoom(time) {
        const route = this.config.patrol.route;
        if (!route || route.length === 0) {
            console.warn(`⚠️ [${this.npcId}] No route available for room transition`);
            return;
        }

        const nextSegmentIndex = (this.config.patrol.currentSegmentIndex + 1) % route.length;
        const currentSegment = route[this.config.patrol.currentSegmentIndex];
        const nextSegment = route[nextSegmentIndex];

        // Never head into a room that isn't loaded (locked, no route action run yet)
        if (!window.rooms?.[nextSegment.room]) {
            console.warn(`⚠️ [${this.npcId}] Next route room ${nextSegment.room} not loaded, retrying in 2s`);
            this._pathRetryAfter = this.clockNow() + 2000;
            this.patrolTarget = null;
            this.currentPath = [];
            this.pathFollowingActive = false;
            this._haltForRoute();
            return;
        }

        console.log(`🚪 [${this.npcId}] Route: ${currentSegment.room} → ${nextSegment.room} (walking)`);
        this.config.patrol.currentSegmentIndex = nextSegmentIndex;
        this.config.patrol.waypointIndex = 0;

        // Choose waypoint in new room
        this.chooseNewPatrolTarget(time);
    }

    /**
     * Choose random patrol target (original behavior)
     */
    chooseRandomPatrolTarget(time) {
        // Ensure we have the latest pathfinding manager reference
        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        
        if (!pathfindingManager) {
            console.warn(`⚠️ No pathfinding manager for ${this.npcId}`);
            return;
        }

        // Get random target position using pathfinding manager
        const targetPos = pathfindingManager.getRandomPatrolTarget(this.roomId);
        if (!targetPos) {
            console.warn(`⚠️ Could not find random patrol target for ${this.npcId}`);
            // Fall back to idle if can't find a target
            this.sprite.body.setVelocity(0, 0);
            this.playAnimation('idle', this.direction);
            this.isMoving = false;
            return;
        }

        this.patrolTarget = targetPos;
        this.lastPatrolChange = time;
        this.pathIndex = 0;
        this.currentPath = [];

        // Request pathfinding from current position to target
        const { x: rndnx, y: rndny } = this.npcBodyPos();
        const rndSnapped = pathfindingManager.findNearestWalkableStartCell(rndnx, rndny)
                           || { x: rndnx, y: rndny };
        pathfindingManager.findWorldPath(
            rndSnapped.x,
            rndSnapped.y,
            targetPos.x,
            targetPos.y,
            (path) => {
                if (path && path.length > 0) {
                    this.currentPath = path;
                    this.pathIndex = 0;
                    console.log(`✅ [${this.npcId}] New patrol path with ${path.length} waypoints`);
                } else {
                    console.warn(`⚠️ [${this.npcId}] Pathfinding failed, target unreachable`);
                    this.currentPath = [];
                    this.patrolTarget = null;
                }
            }
        );
    }

    maintainPersonalSpace(playerPos, delta) {
        if (!this.config.personalSpace.enabled || !playerPos) {
            return false;
        }

        const { x: psnx, y: psny } = this.npcBodyPos();
        const dx = psnx - playerPos.x;  // Away from player
        const dy = psny - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return false; // Avoid division by zero

        // Back away using velocity (physics-safe movement)
        // Normalize direction and apply velocity push
        const backAwaySpeed = this.config.personalSpace.backAwaySpeed || 30;
        const velocityX = (dx / distance) * backAwaySpeed;
        const velocityY = (dy / distance) * backAwaySpeed;
        
        if (this.sprite.body) {
            this.sprite.body.setVelocity(velocityX, velocityY);
        }

        // Face player while backing away
        this.direction = this.calculateDirection(-dx, -dy);  // Negative = face player
        this.playAnimation('idle', this.direction);  // Use idle, not walk

        this.isMoving = false;  // Not "walking", just adjusting position
        this.backingAway = true;

        return true; // Personal space behavior active
    }

    updateHostileBehavior(playerPos, delta) {
        if (!playerPos) return false;

        // Don't move if currently attacking (punch animation playing) - only if pauseToAttack is enabled
        if (this.config.hostile.pauseToAttack && window.npcCombat && window.npcCombat.npcAttacking && window.npcCombat.npcAttacking.has(this.npcId)) {
            this.sprite.body.setVelocity(0, 0);
            this.isMoving = false;
            return true;
        }

        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        const chaseSpeed = this.config.hostile.chaseSpeed || 145;

        // Calculate distance to player (both at feet/body-centre)
        const { x: hnx, y: hny } = this.npcBodyPos();
        const dx = playerPos.x - hnx;
        const dy = playerPos.y - hny;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Get attack range from hostile system
        const attackRange = window.npcHostileSystem ?
            window.npcHostileSystem.getState(this.npcId)?.attackRange || 32 : 32;

        const style = resolveFightStyle(this.config.hostile.fightStyle);

        // In range by distance, but a wall (or the strip behind a back wall) stands between: keep
        // chasing, so the path takes it round to the player instead of freezing it in place
        const reachable = window.npcCombat?.canReachPlayer ? window.npcCombat.canReachPlayer(this.sprite) : true;

        // If in attack range, try to attack
        if (distance <= attackRange && reachable) {
            // Stop moving and clear chase path
            this.sprite.body.setVelocity(0, 0);
            this.isMoving = false;
            this.chasePath = [];
            this.chasePathIndex = 0;

            // Face player: in guard if its style guards and it isn't swinging
            this.direction = this.calculateDirection(dx, dy);
            if (window.npcCombat?.isGuarding?.(this.npcId)) {
                this.showGuardPose();
            } else {
                this.playAnimation('idle', this.direction);
            }

            // Attempt attack
            if (window.npcCombat) {
                window.npcCombat.attemptAttack(this.npcId, this.sprite);
            }

            return true;
        }

        // A cowering fighter keeps its distance and only jabs when caught
        if (style.flees) {
            return this.updateCowerBehavior(dx, dy, distance, style, pathfindingManager);
        }

        // Just out of reach (a knockback, a step back) with a clear line: walk
        // straight in, since a path over a cell or two can come back empty or
        // already reached, and the NPC then stood off (m04 confirmation N2)
        if (pathfindingManager && distance <= attackRange + CLOSE_IN_MARGIN &&
            shouldCloseInDirectly({
                distance,
                attackRange,
                lineOfSight: pathfindingManager.hasWorldPhysicsLineOfSight(hnx, hny, playerPos.x, playerPos.y)
            })) {
            this.chasePath = [];
            this.chasePathIndex = 0;
            this.sprite.body.setVelocity((dx / distance) * chaseSpeed, (dy / distance) * chaseSpeed);
            this.direction = this.calculateDirection(dx, dy);
            this.playAnimation('walk', this.direction);
            this.isMoving = true;
            return true;
        }

        // Otherwise pathfind to chase the player — never walk directly (avoids wall-walking).
        // LOS only tunes how often we refresh the path.
        const currentTime = Date.now();

        const playerMovedFar = this.lastPlayerPosition &&
            (Math.abs(playerPos.x - this.lastPlayerPosition.x) > 64 ||
             Math.abs(playerPos.y - this.lastPlayerPosition.y) > 64);

        // Determine refresh interval: tighter when we can see the player.
        let refreshInterval = this.chasePathUpdateInterval; // 500ms default
        if (pathfindingManager && !this.chasePathPending) {
            const { x: losnx, y: losny } = this.npcBodyPos();
            const los = pathfindingManager.hasWorldPhysicsLineOfSight(
                losnx, losny, playerPos.x, playerPos.y
            );
            if (los) refreshInterval = 250;
        }

        // Only request a new path when none is in flight AND conditions warrant it.
        const needsNewPath = !this.chasePathPending && (
            (this.chasePath.length === 0) ||
            (this.chasePathIndex >= this.chasePath.length) ||
            (currentTime - this.lastChasePathRequest > refreshInterval) ||
            playerMovedFar
        );

        if (needsNewPath) {
            this.requestChasePath(playerPos, currentTime);
        }

        // Follow the current chase path
        if (this.chasePath.length > 0 && this.chasePathIndex < this.chasePath.length) {
            const nextWaypoint = this.chasePath[this.chasePathIndex];
            const { x: cwnx, y: cwny } = this.npcBodyPos();
            const waypointDx = nextWaypoint.x - cwnx;
            const waypointDy = nextWaypoint.y - cwny;
            const waypointDistance = Math.sqrt(waypointDx * waypointDx + waypointDy * waypointDy);

            // Reached current waypoint — advance to next
            if (waypointDistance < 12) {
                this.chasePathIndex++;
                if (this.chasePathIndex >= this.chasePath.length) {
                    this.chasePath = [];
                    this.chasePathIndex = 0;
                }
                return true;
            }

            // Don't move if attacking (only if pauseToAttack is enabled)
            if (this.config.hostile.pauseToAttack && window.npcCombat &&
                window.npcCombat.npcAttacking && window.npcCombat.npcAttacking.has(this.npcId)) {
                this.sprite.body.setVelocity(0, 0);
                this.isMoving = false;
                return true;
            }

            const velocityX = (waypointDx / waypointDistance) * chaseSpeed;
            const velocityY = (waypointDy / waypointDistance) * chaseSpeed;
            this.sprite.body.setVelocity(velocityX, velocityY);

            this.direction = this.calculateDirection(waypointDx, waypointDy);
            this.playAnimation('walk', this.direction);
            this.isMoving = true;

            return true;
        }

        // No path available yet (waiting for first EasyStar result) — hold position
        this.sprite.body.setVelocity(0, 0);
        this.playAnimation('idle', this.direction);
        this.isMoving = false;

        return true;
    }

    /**
     * A cowering hostile (fightStyle "cower"): runs from the player while the
     * player is within its flee distance, along the open heading that points
     * most directly away and stays in its room. Cornered, or once far enough,
     * it stops and watches the player. It jabs only when the player is in
     * reach (the in-range branch of updateHostileBehavior).
     * @param {number} dx - player x minus NPC x (body centres)
     * @param {number} dy - player y minus NPC y
     */
    updateCowerBehavior(dx, dy, distance, style, pathfindingManager) {
        this.chasePath = [];
        this.chasePathIndex = 0;
        const fleeDistance = style.fleeDistance || 112;
        const speed = this.config.hostile.fleeSpeed || 180;

        let heading = null;
        if (distance < fleeDistance) {
            const { x: nx, y: ny } = this.npcBodyPos();
            const room = window.rooms?.[this.roomId];
            const bounds = room?.position && room?.map ? {
                left: room.position.x + 32, right: room.position.x + room.map.widthInPixels - 32,
                top: room.position.y + 64, bottom: room.position.y + room.map.heightInPixels - 32
            } : null;
            const look = 40;
            heading = pickFleeHeading(-dx, -dy, (ux, uy) => {
                const tx = nx + ux * look;
                const ty = ny + uy * look;
                if (bounds && (tx < bounds.left || tx > bounds.right || ty < bounds.top || ty > bounds.bottom)) return false;
                return pathfindingManager?.hasWorldPhysicsLineOfSight
                    ? pathfindingManager.hasWorldPhysicsLineOfSight(nx, ny, tx, ty)
                    : true;
            });
        }

        if (heading) {
            this.sprite.body.setVelocity(heading.x * speed, heading.y * speed);
            this.direction = this.calculateDirection(heading.x, heading.y);
            this.playAnimation('walk', this.direction);
            this.isMoving = true;
            return true;
        }

        // Far enough, or cornered: stand and watch the player
        this.sprite.body.setVelocity(0, 0);
        this.isMoving = false;
        this.direction = this.calculateDirection(dx, dy);
        this.playAnimation('idle', this.direction);
        return true;
    }

    /**
     * Hold the guard pose: the first frame of the NPC's lead-jab in the way it
     * faces (fists up, knees bent). Sprites without a jab keep their idle.
     */
    showGuardPose() {
        const jab = this.scene?.anims?.get(`npc-${this.npcId}-jab-${this.direction}`);
        const frame = jab?.frames?.[0];
        if (!frame) {
            this.playAnimation('idle', this.direction);
            return;
        }
        if (this.sprite.anims.isPlaying) this.sprite.anims.stop();
        if (this.sprite.frame?.name !== frame.textureFrame || this.sprite.texture?.key !== frame.textureKey) {
            this.sprite.setTexture(frame.textureKey, frame.textureFrame);
        }
        this.sprite.setFlipX(false);
        // Next playAnimation call always restarts its animation
        this.lastAnimationKey = null;
    }

    /**
     * Request a new pathfinding calculation to chase the player.
     * Uses the unified world EasyStar grid — mirrors what the player's click-to-move does.
     * A chasePathPending flag prevents flooding EasyStar while a result is in-flight.
     */
    requestChasePath(playerPos, currentTime) {
        if (this.chasePathPending) return; // already waiting

        this.chasePathPending = true;
        this.lastChasePathRequest = currentTime;
        this.lastPlayerPosition = { x: playerPos.x, y: playerPos.y };

        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        if (!pathfindingManager) {
            console.warn(`⚠️ No pathfinding manager for hostile ${this.npcId}`);
            this.chasePathPending = false;
            return;
        }

        // Snap both positions to walkable cells — EasyStar cannot path from/to blocked cells.
        // This is the same strategy player.js uses in movePlayerToPoint.
        const { x: csnx, y: csny } = this.npcBodyPos();
        const npcSnapped  = pathfindingManager.findNearestWalkableStartCell(csnx, csny)
                            || { x: csnx, y: csny };
        const destSnapped = pathfindingManager.findNearestWalkableWorldCell(playerPos.x, playerPos.y)
                            || { x: playerPos.x, y: playerPos.y };

        pathfindingManager.findWorldPath(
            npcSnapped.x, npcSnapped.y,
            destSnapped.x, destSnapped.y,
            (path) => {
                this.chasePathPending = false;
                if (path && path.length > 0) {
                    // Apply the same greedy string-pull smoothing that the player uses
                    const smoothed = pathfindingManager.smoothWorldPathForPlayer(
                        npcSnapped.x, npcSnapped.y, path
                    );
                    this.chasePath = smoothed;
                    this.chasePathIndex = 0;
                    if (window.breakEscapeDebug) this._drawChasePathDebug(smoothed);
                    else this._clearChasePathDebug();
                } else {
                    // No path found (unreachable or grid not ready)
                    this.chasePath = [];
                    this.chasePathIndex = 0;
                    this._clearChasePathDebug();
                }
            }
        );
    }

    /** Draw the current chase path as a red overlay for debugging (debug mode only). */
    _drawChasePathDebug(path) {
        this._clearChasePathDebug();
        if (!window.breakEscapeDebug || !path || path.length === 0) return;

        const scene = this.scene || window.game?.scene?.scenes[0];
        if (!scene) return;

        const g = scene.add.graphics();
        g.setDepth(851); // between world objects (800) and player path debug (900)
        this.chaseDebugGraphics = g;

        const { x: dbnx, y: dbny } = this.npcBodyPos();
        const origin = { x: dbnx, y: dbny };
        const allPoints = [origin, ...path];

        // Red dashed line connecting waypoints
        g.lineStyle(2, 0xff2222, 0.75);
        g.beginPath();
        g.moveTo(allPoints[0].x, allPoints[0].y);
        for (let i = 1; i < allPoints.length; i++) g.lineTo(allPoints[i].x, allPoints[i].y);
        g.strokePath();

        // Waypoint circles (orange = next target, red = future)
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            const isCurrent = (i === this.chasePathIndex);
            g.fillStyle(isCurrent ? 0xff8800 : 0xff2222, 0.85);
            g.fillCircle(p.x, p.y, isCurrent ? 6 : 4);
            g.lineStyle(1.5, 0xff0000, 1);
            g.strokeCircle(p.x, p.y, isCurrent ? 6 : 4);
        }
    }

    /** Remove the chase path overlay. */
    _clearChasePathDebug() {
        if (this.chaseDebugGraphics) {
            this.chaseDebugGraphics.destroy();
            this.chaseDebugGraphics = null;
        }
    }

    /** Draw the current patrol path and waypoints as a blue overlay for debugging (debug mode only). */
    _drawPatrolPathDebug(path) {
        this._clearPatrolPathDebug();
        if (!window.breakEscapeDebug || !path || path.length === 0) return;

        const scene = this.scene || window.game?.scene?.scenes[0];
        if (!scene) return;

        const g = scene.add.graphics();
        g.setDepth(851); // between world objects (800) and player path debug (900)
        this.patrolDebugGraphics = g;

        const { x: pnx, y: pny } = this.npcBodyPos();
        const origin = { x: pnx, y: pny };
        const allPoints = [origin, ...path];

        // Blue line connecting waypoints along the patrol path
        g.lineStyle(2.5, 0x2222ff, 0.75);
        g.beginPath();
        g.moveTo(allPoints[0].x, allPoints[0].y);
        for (let i = 1; i < allPoints.length; i++) g.lineTo(allPoints[i].x, allPoints[i].y);
        g.strokePath();

        // Start point (green circle at NPC current position)
        g.fillStyle(0x22ff22, 0.85);
        g.fillCircle(origin.x, origin.y, 5);
        g.lineStyle(1.5, 0x00cc00, 1);
        g.strokeCircle(origin.x, origin.y, 5);

        // Path waypoints (blue circles, brighter for current target)
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            const isCurrent = (i === this.pathIndex);
            g.fillStyle(isCurrent ? 0x4488ff : 0x2255dd, 0.85);
            g.fillCircle(p.x, p.y, isCurrent ? 6 : 4);
            g.lineStyle(1.5, 0x0000ff, 1);
            g.strokeCircle(p.x, p.y, isCurrent ? 6 : 4);
        }

        // Draw the target waypoint as a purple marker if we have one
        if (this.patrolTarget) {
            g.fillStyle(0xff00ff, 0.6);
            g.fillCircle(this.patrolTarget.x, this.patrolTarget.y, 8);
            g.lineStyle(2, 0xff00ff, 0.9);
            g.strokeCircle(this.patrolTarget.x, this.patrolTarget.y, 8);
            
            // Label: "Target"
            if (scene.add.text) {
                const text = scene.add.text(this.patrolTarget.x + 10, this.patrolTarget.y - 15, 'Target', {
                    fontSize: '10px',
                    color: '#ff00ff',
                    backgroundColor: '#000',
                    padding: { x: 3, y: 2 }
                });
                text.setDepth(852);
            }
        }
    }

    /** Remove the patrol path overlay. */
    _clearPatrolPathDebug() {
        if (this.patrolDebugGraphics) {
            this.patrolDebugGraphics.destroy();
            this.patrolDebugGraphics = null;
        }
    }

    calculateDirection(dx, dy) {
        const absVX = Math.abs(dx);
        const absVY = Math.abs(dy);

        // Threshold: if one axis is > 2x the other, consider it pure cardinal
        if (absVX > absVY * 2) {
            return dx > 0 ? 'right' : 'left';
        }

        if (absVY > absVX * 2) {
            return dy > 0 ? 'down' : 'up';
        }

        // Diagonal
        if (dy > 0) {
            return dx > 0 ? 'down-right' : 'down-left';
        } else {
            return dx > 0 ? 'up-right' : 'up-left';
        }
    }

    playAnimation(state, direction) {
        if (this._seat) return; // seated (seating.js): the sit frame stays
        // Don't interrupt attack animations (red tint placeholder)
        const currentAnim = this.sprite.anims?.currentAnim?.key || '';
        if ((currentAnim.includes('attack') || currentAnim.includes('punch') || currentAnim.includes('-jab-')) &&
            this.sprite.anims.isPlaying) {
            return;
        }
        
        // Check if this NPC uses atlas-based animations (8 native directions)
        // by checking if the direct left-facing animation exists
        const directAnimKey = `npc-${this.npcId}-${state}-${direction}`;
        // (an animation with no frames throws when played, so it doesn't count)
        const hasNativeLeftAnimations = (this.scene?.anims?.get(directAnimKey)?.frames?.length || 0) > 0;

        let animDirection = direction;
        let flipX = false;

        // For legacy sprites (5 directions), map left to right with flipX
        // For atlas sprites (8 directions), use native directions
        if (!hasNativeLeftAnimations && direction.includes('left')) {
            animDirection = direction.replace('left', 'right');
            flipX = true;
        }

        const animKey = hasNativeLeftAnimations ? directAnimKey : `npc-${this.npcId}-${state}-${animDirection}`;

        // Only change animation if different (also check flipX to ensure proper updates)
        if (this.lastAnimationKey !== animKey || this.sprite.flipX !== flipX) {
            // Use scene.anims to check if animation exists in the global animation manager
            if (this.scene?.anims?.exists(animKey)) {
                this.sprite.play(animKey, true);
                this.lastAnimationKey = animKey;
            } else {
                // Fallback: use idle animation if walk doesn't exist
                if (state === 'walk') {
                    const idleKey = `npc-${this.npcId}-idle-${animDirection}`;
                    if (this.scene?.anims?.exists(idleKey)) {
                        this.sprite.play(idleKey, true);
                        this.lastAnimationKey = idleKey;
                        console.warn(`⚠️ [${this.npcId}] Walk animation missing, using idle: ${idleKey}`);
                    } else {
                        console.error(`❌ [${this.npcId}] BOTH animations missing! Walk: ${animKey}, Idle: ${idleKey}`);
                    }
                }
            }
        }

        // Set flipX for left-facing directions (only for legacy sprites)
        this.sprite.setFlipX(flipX);
    }

    updateDepth() {
        if (!this.sprite || !this.sprite.body) return;

        // Calculate depth based on bottom Y position (same as player)
        const spriteBottomY = this.sprite.y + (this.sprite.displayHeight / 2);
        const depth = spriteBottomY + 0.5; // World Y + sprite layer offset

        // Always update depth - no caching
        // Depth determines Y-sorting, must update every frame for moving NPCs
        this.sprite.setDepth(depth);
    }

    /**
     * Check if NPC is stuck in a wall and attempt to escape
     * When an NPC gets pushed through a wall collision box, this detects it
     * and gradually pushes the NPC back out to freedom
     */
    checkAndEscapeWall(time) {
        // Only check periodically to avoid performance issues
        if (time - this.lastUnstuckCheck < this.unstuckCheckInterval) {
            if (!this.stuckInWall) {
                return; // Not stuck, no need to escape
            }
            // Continue trying to escape if already stuck
        } else {
            this.lastUnstuckCheck = time;
        }

        const room = window.rooms ? window.rooms[this.roomId] : null;
        if (!room) {
            return; // No room reference
        }

        // Check if NPC is overlapping with any wall collision box or table
        let isOverlappingWall = false;
        let overlappingWall = null;

        // Check walls
        if (room.wallCollisionBoxes) {
            for (const wallBox of room.wallCollisionBoxes) {
                if (!wallBox.body) continue;

                // Check if NPC body overlaps with wall using scene physics
                if (this.scene.physics.overlap(this.sprite, wallBox)) {
                    isOverlappingWall = true;
                    overlappingWall = wallBox;
                    break;
                }
            }
        }

        // Check tables (if not already stuck in a wall)
        if (!isOverlappingWall && room.objects) {
            for (const obj of Object.values(room.objects)) {
                if (!obj || !obj.body) continue;

                // Check if this is a table (has scenarioData.type === 'table' or name includes 'desk')
                const isTable = (obj.scenarioData && obj.scenarioData.type === 'table') || 
                               (obj.name && obj.name.toLowerCase().includes('desk'));

                if (isTable && this.scene.physics.overlap(this.sprite, obj)) {
                    isOverlappingWall = true;
                    overlappingWall = obj;
                    break;
                }
            }
        }

        if (isOverlappingWall && overlappingWall) {
            // NPC is stuck! Try to escape
            if (!this.stuckInWall) {
                console.log(`🚨 [${this.npcId}] Detected stuck in wall at (${this.sprite.x.toFixed(0)}, ${this.sprite.y.toFixed(0)})`);
                this.stuckInWall = true;
                this.unstuckAttempts = 0;
                this.escapeWallBox = overlappingWall; // Remember which wall we're escaping from
            }

            this.unstuckAttempts++;

            // Push NPC away from wall center
            const wallCenterX = overlappingWall.body.center.x;
            const wallCenterY = overlappingWall.body.center.y;
            
            const dx = this.sprite.x - wallCenterX;
            const dy = this.sprite.y - wallCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.1) {
                // Normalize and apply escape velocity - very forceful to break free quickly
                const escapeSpeed = 300; // Pixels per second (increased from 200)
                const escapeX = (dx / distance) * escapeSpeed;
                const escapeY = (dy / distance) * escapeSpeed;
                
                this.sprite.body.setVelocity(escapeX, escapeY);
            }

            // Stop trying after 50 attempts (~10 seconds at 200ms intervals)
            if (this.unstuckAttempts > 50) {
                console.warn(`⚠️ [${this.npcId}] Failed to escape wall after ${this.unstuckAttempts} attempts, giving up`);
                this.stuckInWall = false;
                this.unstuckAttempts = 0;
                this.escapeWallBox = null;
                this.sprite.body.setVelocity(0, 0);
            }
        } else {
            // Check if we've actually escaped
            if (this.stuckInWall && this.escapeWallBox) {
                // If overlap has cleared, consider it escaped
                if (this.scene.physics.overlap(this.sprite, this.escapeWallBox)) {
                    // Still stuck in the wall, keep trying
                    return;
                }
                
                // Not overlapping anymore - escaped!
                console.log(`✅ [${this.npcId}] Escaped from wall after ${this.unstuckAttempts} attempts`);
                this.stuckInWall = false;
                this.unstuckAttempts = 0;
                this.escapeWallBox = null;
                this.sprite.body.setVelocity(0, 0);
            }
        }
    }

    /**
     * Check if NPC has been pushed away from home and trigger return if needed
     * For stationary NPCs (no patrol configured), automatically return home if pushed
     * Returns true if NPC should be in return-home mode
     */
    checkAndHandleHomePush() {
        // Only apply to stationary NPCs (no patrol configured originally)
        if (this.config.patrol.enabled && !this.returningHome) {
            return false; // Already has patrol behavior
        }

        const { x: hmnx, y: hmny } = this.npcBodyPos();
        const distanceFromHome = Math.sqrt(
            Math.pow(hmnx - this.homePosition.x, 2) +
            Math.pow(hmny - this.homePosition.y, 2)
        );

        // If we're already returning home, check if we've arrived
        if (this.returningHome) {
            if (distanceFromHome < 12) {
                // Arrived home! Disable patrol and return to normal behavior
                console.log(`🏠 [${this.npcId}] Arrived home, resuming normal behavior`);
                this.returningHome = false;
                this.config.patrol.enabled = false;
                this.patrolTarget = null;
                this.currentPath = [];
                this.pathIndex = 0;
                // IMPORTANT: Set velocity to 0 to stop movement
                this.sprite.body.setVelocity(0, 0);
                return false;
            }
            return true; // Still returning
        }

        // Check if pushed beyond threshold
        if (distanceFromHome > this.homeReturnThreshold) {
            // NPC has been pushed away! Enable temporary patrol mode to return home
            console.log(`🔄 [${this.npcId}] Pushed ${distanceFromHome.toFixed(0)}px from home, returning...`);
            this.returningHome = true;
            this.config.patrol.enabled = true;
            
            // Set home as a single waypoint
            this.config.patrol.waypoints = [{
                tileX: Math.floor(this.homePosition.x / TILE_SIZE),
                tileY: Math.floor(this.homePosition.y / TILE_SIZE),
                worldX: this.homePosition.x,
                worldY: this.homePosition.y,
                dwellTime: 0
            }];
            this.config.patrol.waypointMode = 'sequential';
            this.config.patrol.waypointIndex = 0;
            
            // Clear any existing patrol state to force re-pathing
            this.patrolTarget = null;
            this.currentPath = [];
            this.pathIndex = 0;
            this.lastPatrolChange = 0;
            
            return true;
        }

        return false;
    }

    /**
     * Trigger settling state after collision/push
     * Pauses patrol for a brief moment to allow physics to settle
     */
    triggerSettling(time) {
        if (!this.isSettling) {
            this.isSettling = true;
            this.settleEndTime = time + this.settleDuration;
            console.log(`⏸️ [${this.npcId}] Settling after collision for ${this.settleDuration}ms`);
        }
    }

    /**
     * Override current patrol with a single destination.
     * NPC walks to the target at the given speed, then stops permanently.
     * Used for event-driven interrupts (e.g., nurse rushing to an emergency bed).
     *
     * @param {number} worldX - Target world X coordinate
     * @param {number} worldY - Target world Y coordinate
     * @param {number} [speed] - Override patrol speed for this move (optional)
     */
    goToAndStay(worldX, worldY, speed, opts = {}) {
        window.seating?.unseatNPC?.(this); // a seated NPC gets up first
        if (!opts?.fromSeating) window.seating?.cancelFetch?.(this); // and drops a chair it was fetching
        // Who asked for the move (npc-needs.js passes owner 'needs'); a move by
        // anyone else suspends the NPC's needs, so scripts always win.
        this._moveOwner = opts?.owner;
        // Room leash for a needs move: rooms the walk must not enter. A needs move without
        // avoidRooms (seating's chair fetch, in the NPC's own room) keeps the current value;
        // any other move drops it (scripts ignore the leash).
        if (opts?.owner !== 'needs') this._moveAvoidRooms = undefined;
        else if (Array.isArray(opts.avoidRooms)) this._moveAvoidRooms = opts.avoidRooms.slice();
        // Walk-home moves pause for a nearby player like a patrol does.
        this._moveYieldsToPlayer = !!opts?.yieldToPlayer;
        if (opts?.owner !== 'needs') window.npcNeedsSystem?.onExternalMove?.(this.npcId, opts?.owner);
        // Stop current movement
        this.currentPath = [];
        this.patrolTarget = null;
        this.pathIndex = 0;
        this.lastPatrolChange = 0;
        this.patrolReachedTime = 0;
        this.pathFollowingActive = false;

        // worldX/worldY are feet-centre (body.center) world coordinates — tile * TILE_SIZE.
        // NPC spawns are now adjusted so body.center = tile * TILE_SIZE, so no further
        // offset compensation is needed here.

        // Set a single non-looping waypoint
        const tileX = Math.round(worldX / TILE_SIZE);
        const tileY = Math.round(worldY / TILE_SIZE);
        this.config.patrol.waypoints = [{
            tileX, tileY,
            worldX, worldY,
            dwellTime: 0
        }];
        this.config.patrol.waypointMode = 'sequential';
        this.config.patrol.waypointIndex = 0;
        this.config.patrol.enabled = true;
        this._stopOnArrival = true; // New flag: disable patrol after reaching this waypoint
        this._goToStayDest = { x: worldX, y: worldY }; // Original destination for arrival-tolerance guard

        // Optionally override speed
        if (speed !== undefined) {
            this._tempSpeed = this.config.patrol.speed;
            this.config.patrol.speed = speed;
        }

        console.log(`🏥 [${this.npcId}] goToAndStay: heading to (${worldX}, ${worldY}) at speed ${speed || this.config.patrol.speed}`);
    }

    /**
     * Shared arrival logic for goToAndStay — stops the NPC and resets all
     * emergency-move state.  Called both when the path is fully consumed and
     * when the arrival-tolerance proximity check fires early (e.g. the final
     * tile is blocked by another NPC).
     */
    /** Stop an in-flight goToAndStay with no arrival event. */
    cancelMove() {
        this._stopOnArrival = false;
        this._goToStayDest = null;
        this._moveOwner = undefined;
        this._moveAvoidRooms = undefined;
        this._moveYieldsToPlayer = false;
        this.config.patrol.enabled = false;
        this.pathFollowingActive = false;
        this.currentPath = [];
        this.pathIndex = 0;
        if (this._tempSpeed !== undefined) {
            this.config.patrol.speed = this._tempSpeed;
            this._tempSpeed = undefined;
        }
        if (this.sprite?.body) this.sprite.body.setVelocity(0, 0);
        this.isMoving = false;
        this.playAnimation('idle', this.direction);
    }

    /** Turn to face a world point (idle animation), e.g. the object being used. */
    faceWorldPoint(x, y) {
        const p = this.npcBodyPos();
        this.direction = this.calculateDirection(x - p.x, y - p.y);
        this.playAnimation('idle', this.direction);
    }

    _triggerGoToStayArrival() {
        const owner = this._moveOwner;
        this._moveOwner = undefined;
        this._moveAvoidRooms = undefined;
        this._moveYieldsToPlayer = false;
        this._stopOnArrival = false;
        this._goToStayDest = null;
        this.config.patrol.enabled = false;
        this.pathFollowingActive = false;
        this.currentPath = [];
        this.pathIndex = 0;
        this._clearPatrolPathDebug();
        if (this._tempSpeed !== undefined) {
            this.config.patrol.speed = this._tempSpeed;
            this._tempSpeed = undefined;
        }
        if (this.sprite.body) {
            this.sprite.body.setVelocity(0, 0);
        }
        this.isMoving = false;
        this.playAnimation('idle', this.direction);
        const arrivedPos = this.npcBodyPos();
        this.homePosition = { x: arrivedPos.x, y: arrivedPos.y };
        console.log(`🏥 [${this.npcId}] Arrived at emergency target (within tolerance), stopping patrol`);

        // Arrival hook: fire a per-NPC event the moment a scripted goToAndStay move
        // completes, so a scenario can react when the NPC actually reaches the target
        // (e.g. a staff member sitting down at a PC), not when it was told to walk.
        // The guard above (_stopOnArrival cleared at the top of this method) means this
        // fires exactly once per move. Scenario NPCs subscribe with an exact-match
        // eventMapping `"eventPattern": "npc_arrived:<npcId>"` (npc-manager.js registers
        // one dispatcher listener per mapping pattern), so no manager change is needed.
        if (window.eventDispatcher) {
            window.eventDispatcher.emit(`npc_arrived:${this.npcId}`, {
                npcId: this.npcId,
                x: arrivedPos.x,
                y: arrivedPos.y,
                owner
            });
        }
    }

    /**
     * Set NPC behavior state (used by game engine and event handlers)
     * Properties: hostile, influence, patrol, personalSpaceDistance, patrolSpeed, dwellMultiplier
     */
    setState(property, value) {
        switch (property) {
            case 'hostile':
                this.setHostile(value);
                break;

            case 'influence':
                this.setInfluence(value);
                break;

            case 'patrol':
                this.config.patrol.enabled = value;
                console.log(`🚶 ${this.npcId} patrol ${value ? 'enabled' : 'disabled'}`);
                break;

            case 'personalSpaceDistance':
                this.config.personalSpace.distance = value;
                this.config.personalSpace.distanceSq = value ** 2;
                console.log(`↔️ ${this.npcId} personal space: ${value}px`);
                break;

            case 'patrolSpeed':
                this.config.patrol.speed = value;
                console.log(`🏃 ${this.npcId} patrol speed set to ${value}`);
                break;

            case 'dwellMultiplier':
                // Scale all waypoint dwell times
                if (this.config.patrol.waypoints) {
                    this.config.patrol.waypoints.forEach(wp => {
                        // Persist the original value so repeated calls don't compound the multiplier
                        wp._baseDwellTime = wp._baseDwellTime || wp.dwellTime || 0;
                        wp.dwellTime = Math.round(wp._baseDwellTime * value);
                    });
                }
                console.log(`⏱️ ${this.npcId} dwell multiplier set to ${value}`);
                break;

            default:
                console.warn(`⚠️ Unknown behavior property: ${property}`);
        }
    }

    setHostile(hostile) {
        if (this.hostile === hostile) return; // No change
        if (hostile) window.seating?.unseatNPC?.(this);

        this.hostile = hostile;

        // Register with hostile system to enable combat mechanics
        if (window.npcHostileSystem) {
            window.npcHostileSystem.setNPCHostile(this.npcId, hostile, this.config.hostile);
            console.log(`⚔️ ${this.npcId} registered with hostile system: ${hostile}`);
        }

        // Emit event for other systems to react
        if (window.eventDispatcher) {
            window.eventDispatcher.emit('npc_hostile_changed', {
                npcId: this.npcId,
                hostile: hostile
            });
        }

        if (hostile) {
            // Red tint (0xff0000 with 50% strength)
            this.sprite.setTint(0xff6666);
            console.log(`🔴 ${this.npcId} is now hostile`);
        } else {
            // Clear tint
            this.sprite.clearTint();
            console.log(`✅ ${this.npcId} is no longer hostile`);
        }
    }

    setInfluence(influence) {
        this.influence = influence;

        // Check if influence change should trigger hostile state
        const threshold = this.config.hostile.influenceThreshold;

        // Auto-trigger hostile if influence drops below threshold
        if (influence < threshold && !this.hostile) {
            this.setHostile(true);
            console.log(`⚠️ ${this.npcId} became hostile due to low influence (${influence} < ${threshold})`);
        }
        // Auto-disable hostile if influence recovers
        else if (influence >= threshold && this.hostile) {
            this.setHostile(false);
            console.log(`✅ ${this.npcId} no longer hostile (influence: ${influence})`);
        }

        console.log(`💯 ${this.npcId} influence: ${influence}`);
    }
}

// Export for module imports
export default {
    NPCBehaviorManager,
    NPCBehavior
};
