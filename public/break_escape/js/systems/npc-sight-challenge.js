/**
 * NPC SIGHT CHALLENGE ("challengeOnSight")
 * ========================================
 *
 * Opt-in, per NPC: a guard who reacts when the player walks into his line of
 * sight, not only when a lock is picked in front of him (lockpick-catch.js).
 * Off unless the NPC's `los` config has a `challengeOnSight` entry:
 *
 *   "los": {
 *     "enabled": true, "range": 150, "angle": 120,
 *     "challengeOnSight": {
 *       "cooldown": 15000,                 // ms before he can challenge again (default 10000)
 *       "event": "player_spotted:guard",   // default player_spotted:<npcId>
 *       "rooms": ["lobby"],                // only while the player is in one of these rooms
 *       "requireGlobal": "alarm_raised",   // only while this global is truthy
 *                                          //   (or { "name": value } to match values)
 *       "skipIfGlobal": "badge_shown"      // never while this global is truthy
 *     }
 *   }
 *
 * `"challengeOnSight": true` is the same as `{}` (all defaults); `"enabled": false`
 * turns a configured one off.
 *
 * When the player is in the NPC's room and inside his cone (npc-los.js), and the
 * conditions hold, the event is emitted once with { npcId, roomId, playerPosition,
 * timestamp }. It doesn't fire again until the player has left his sight and come
 * back, and the cooldown has passed. Nothing is checked while a minigame or
 * conversation is open, or while the tutorial prompt is open (or waiting to
 * appear); a sighting that still holds when it closes fires then. The scenario decides what the event does through
 * eventMappings (a person-chat knot, setGlobal, a bark, a cutscene event).
 * Cooldown and sighting state are per session: a reload starts them fresh.
 *
 * "Near X" (optional): only challenge while the player is close to something.
 *
 *   "challengeOnSight": {
 *     "event": "player_in_view_near:guard",
 *     "near": { "door": "vault", "radius": 64 },   // a door into/out of room "vault"
 *          // or { "object": "<objectId>", "radius": 48 }
 *          // or { "x": 5, "y": 3, "room": "lobby", "radius": 48 }   (room tiles)
 *     "rooms": ["lobby", "vault"]
 *   }
 *
 * With `near` set, the player may be in any room listed in `rooms` (a door sits on
 * the boundary, so player and guard can be either side of it); without `rooms`,
 * the guard's own room only. Being in sight but further than `radius` (default 64px)
 * from the target counts as out of sight. The payload gains targetId / targetType.
 */
import { isInLineOfSight } from './npc-los.js';

export const SIGHT_CHECK_INTERVAL_MS = 150;
export const DEFAULT_CHALLENGE_COOLDOWN_MS = 10000;
export const DEFAULT_NEAR_RADIUS = 64;
// utils/constants.js TILE_SIZE; not imported, so this module keeps a single import
// (the node test swaps npc-los.js for a data URL)
const TILE = 32;

/** Normalise a `near` entry, or null when there is none / it names nothing. */
function normaliseNear(near) {
    if (!near || typeof near !== 'object') return null;
    const r = Number(near.radius);
    const radius = Number.isFinite(r) && r > 0 ? r : DEFAULT_NEAR_RADIUS;
    if (typeof near.door === 'string' && near.door) return { type: 'door', id: near.door, radius };
    if (typeof near.object === 'string' && near.object) return { type: 'object', id: near.object, radius };
    if (Number.isFinite(near.x) && Number.isFinite(near.y) && typeof near.room === 'string') {
        return { type: 'tile', id: `${near.room}:${near.x},${near.y}`, room: near.room, x: near.x, y: near.y, radius };
    }
    return null;
}

/**
 * World point of a `near` target, or null when it isn't on the map (room not loaded,
 * object gone). A door is the centre of a door sprite into or out of the named room
 * (the one nearest `from` when there are several).
 */
export function resolveNearTarget(near, from = null) {
    const rooms = (typeof window !== 'undefined' && window.rooms) || {};
    if (near.type === 'door') {
        const sprites = [];
        for (const room of Object.values(rooms)) {
            for (const d of room?.doorSprites || []) {
                if (!d || d.destroyed || d.active === false || !d.doorProperties) continue;
                sprites.push(d);
            }
        }
        let pool = sprites.filter(d => d.doorProperties.connectedRoom === near.id);
        if (!pool.length) pool = sprites.filter(d => d.doorProperties.roomId === near.id);
        if (!pool.length) return null;
        const dist = (d) => from ? Math.hypot(d.x - from.x, d.y - from.y) : 0;
        const best = pool.reduce((a, b) => (dist(b) < dist(a) ? b : a));
        return { x: best.x, y: best.y };
    }
    if (near.type === 'object') {
        for (const room of Object.values(rooms)) {
            const objs = room?.objects;
            if (!objs) continue;
            let sp = objs[near.id];
            if (!sp) sp = Object.values(objs).find(o => o?.scenarioData?.id === near.id);
            if (sp && sp.active !== false && !sp.destroyed) return { x: sp.x, y: sp.y };
        }
        return null;
    }
    if (near.type === 'tile') {
        const pos = rooms[near.room]?.position || window.roomPositions?.[near.room];
        if (!pos) return null;
        return { x: pos.x + near.x * TILE + TILE / 2, y: pos.y + near.y * TILE + TILE / 2 };
    }
    return null;
}

/**
 * The normalised challengeOnSight config of an NPC, or null when it has none
 * (or it is switched off).
 */
export function getSightChallengeConfig(npc) {
    const raw = npc?.los?.challengeOnSight;
    if (raw === undefined || raw === null || raw === false) return null;
    const cfg = raw === true ? {} : raw;
    if (typeof cfg !== 'object' || cfg.enabled === false) return null;
    const cooldown = Number(cfg.cooldown);
    return {
        cooldown: Number.isFinite(cooldown) && cooldown >= 0 ? cooldown : DEFAULT_CHALLENGE_COOLDOWN_MS,
        event: typeof cfg.event === 'string' && cfg.event ? cfg.event : `player_spotted:${npc.id}`,
        rooms: Array.isArray(cfg.rooms) ? cfg.rooms.filter(r => typeof r === 'string') : null,
        requireGlobal: cfg.requireGlobal ?? null,
        skipIfGlobal: cfg.skipIfGlobal ?? null,
        near: normaliseNear(cfg.near)
    };
}

/** requireGlobal: a name (truthy) or { name: value, ... } (all must match). */
function requiredGlobalsHold(requireGlobal, globals) {
    if (!requireGlobal) return true;
    if (typeof requireGlobal === 'string') return !!globals[requireGlobal];
    if (typeof requireGlobal === 'object') {
        return Object.entries(requireGlobal).every(([name, value]) => globals[name] === value);
    }
    return true;
}

/** skipIfGlobal: a name or a list of names; any truthy one stops the challenge. */
function skippedByGlobal(skipIfGlobal, globals) {
    if (!skipIfGlobal) return false;
    const names = Array.isArray(skipIfGlobal) ? skipIfGlobal : [skipIfGlobal];
    return names.some(name => typeof name === 'string' && !!globals[name]);
}

export class SightChallengeWatcher {
    constructor() {
        this._manager = null;
        this._state = new Map();   // npcId -> { inSight, firedThisSighting, lastFired }
        this._lastCheck = 0;
    }

    /** Forget every sighting and cooldown (a new game, or a test). */
    reset() {
        this._state.clear();
        this._lastCheck = 0;
    }

    /**
     * Called from the game loop. Throttled to SIGHT_CHECK_INTERVAL_MS.
     * @returns {Array<string>} ids of NPCs whose challenge fired on this call
     */
    update(now = Date.now(), { force = false } = {}) {
        if (!force && now - this._lastCheck < SIGHT_CHECK_INTERVAL_MS) return [];
        this._lastCheck = now;

        const manager = typeof window !== 'undefined' ? window.npcManager : null;
        if (!manager?.npcs) return [];
        if (manager !== this._manager) {
            this._manager = manager;
            this._state.clear();
        }
        // A conversation or minigame is open: the player isn't walking about
        if (window.MinigameFramework?.currentMinigame) return [];
        // Nor while the tutorial prompt (plain DOM, not a minigame) is up
        if (window.getTutorialManager?.()?.isPromptOpen?.()) return [];

        const playerRoom = window.currentPlayerRoom;
        const player = window.player;
        if (!player || typeof playerRoom !== 'string') return [];
        const playerPos = typeof player.sprite?.getCenter === 'function'
            ? player.sprite.getCenter()
            : { x: player.x ?? 0, y: player.y ?? 0 };
        const globals = window.gameState?.globalVariables || {};

        const fired = [];
        for (const npc of manager.npcs.values()) {
            const cfg = getSightChallengeConfig(npc);
            if (!cfg) continue;
            const state = this._state.get(npc.id) || { inSight: false, firedThisSighting: false, lastFired: 0 };
            this._state.set(npc.id, state);

            // With `near`, the player may be across a room boundary (a door) from him
            const roomOk = cfg.near && cfg.rooms
                ? cfg.rooms.includes(playerRoom) && cfg.rooms.includes(npc.roomId)
                : npc.roomId === playerRoom;
            let canSee = npc.npcType === 'person' &&
                roomOk &&
                npc.isVisible !== false &&
                isInLineOfSight(npc, playerPos, npc.los);
            let target = null;
            if (canSee && cfg.near) {
                // In sight but not near the target counts as out of sight
                target = resolveNearTarget(cfg.near, playerPos);
                canSee = !!target &&
                    Math.hypot(playerPos.x - target.x, playerPos.y - target.y) <= cfg.near.radius;
            }
            // Access 9.2 C (plan 8.2): an NPC on its phone is not looking
            if (canSee && window.npcNeedsSystem?.isDistracted?.(npc.id)) canSee = false;
            if (!canSee) {
                // Out of sight: the next sighting is a new one
                state.inSight = false;
                state.firedThisSighting = false;
                continue;
            }
            state.inSight = true;
            if (state.firedThisSighting) continue;
            if (cfg.rooms && !cfg.rooms.includes(playerRoom)) continue;
            if (!requiredGlobalsHold(cfg.requireGlobal, globals)) continue;
            if (skippedByGlobal(cfg.skipIfGlobal, globals)) continue;
            if (state.lastFired && now - state.lastFired < cfg.cooldown) continue;

            state.firedThisSighting = true;
            state.lastFired = now;
            fired.push(npc.id);
            console.log(`👁️ SIGHT CHALLENGE: "${npc.id}" spotted the player in "${playerRoom}" → ${cfg.event}`);
            const dispatcher = manager.eventDispatcher || window.eventDispatcher;
            const payload = {
                npcId: npc.id,
                roomId: npc.roomId,
                playerPosition: { x: playerPos.x, y: playerPos.y },
                timestamp: now
            };
            if (cfg.near) {
                payload.targetId = cfg.near.id;
                payload.targetType = cfg.near.type;
            }
            dispatcher?.emit?.(cfg.event, payload);
        }
        return fired;
    }
}

export const sightChallengeWatcher = new SightChallengeWatcher();

if (typeof window !== 'undefined') {
    window.sightChallengeWatcher = sightChallengeWatcher;
}
