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
 * conversation is open. The scenario decides what the event does through
 * eventMappings (a person-chat knot, setGlobal, a bark, a cutscene event).
 * Cooldown and sighting state are per session: a reload starts them fresh.
 */
import { isInLineOfSight } from './npc-los.js';

export const SIGHT_CHECK_INTERVAL_MS = 150;
export const DEFAULT_CHALLENGE_COOLDOWN_MS = 10000;

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
        skipIfGlobal: cfg.skipIfGlobal ?? null
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

            const canSee = npc.npcType === 'person' &&
                npc.roomId === playerRoom &&
                npc.isVisible !== false &&
                isInLineOfSight(npc, playerPos, npc.los);
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
            dispatcher?.emit?.(cfg.event, {
                npcId: npc.id,
                roomId: npc.roomId,
                playerPosition: { x: playerPos.x, y: playerPos.y },
                timestamp: now
            });
        }
        return fired;
    }
}

export const sightChallengeWatcher = new SightChallengeWatcher();

if (typeof window !== 'undefined') {
    window.sightChallengeWatcher = sightChallengeWatcher;
}
