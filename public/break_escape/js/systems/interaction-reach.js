/**
 * INTERACTION REACH
 * =================
 *
 * Reach is measured from the player to the object's position, which for a
 * scenario object is the sprite's top-left corner. That is fine for a 32px
 * prop, but a wide one (the 42px sis_config_panel, a 100px desk) was out of
 * reach for anyone standing under its right half: the measure ran to the left
 * edge, not to the part in front of them.
 *
 * reachX() gives the x to measure to: the player's own x clamped into the
 * object's horizontal span, so standing below any part of it counts as being at
 * that part. The vertical measure is unchanged (the sprite's y), which keeps
 * every existing stand point valid; this only ever shortens a reach.
 *
 * Doors and NPCs keep their own measures (DOOR_INTERACTION_RANGE_SQ,
 * npc-reach.js). No imports, so the node tests can load this file on its own.
 */

/** The x to measure reach to for `sprite`, seen from player x `fromX`. */
export function reachX(sprite, fromX) {
    if (!sprite || !Number.isFinite(sprite.x)) return sprite ? sprite.x : 0;
    if (sprite._isNPC || sprite.doorProperties || !sprite.scenarioData) return sprite.x;
    if (!Number.isFinite(fromX)) return sprite.x;
    // A rotated prop (Tiled rotation, rooms.js) spans its rotated bounds, not
    // width from the origin. Only those pay for getBounds().
    if (sprite.rotation && typeof sprite.getBounds === 'function') {
        try {
            const b = sprite.getBounds();
            if (b && b.width > 0) return Math.max(b.left, Math.min(fromX, b.right));
        } catch (e) { /* fall through to the unrotated span */ }
    }
    const w = sprite.displayWidth ?? sprite.width ?? 0;
    if (!(w > 0)) return sprite.x;
    const left = sprite.x - (sprite.originX ?? 0.5) * w;
    return Math.max(left, Math.min(fromX, left + w));
}

/**
 * The x to aim the facing angle at: the horizontal centre of the object. E-key
 * scoring is mostly angle, and reachX alone would read 0 degrees for any wide
 * object the player stands under, beating a small item beside them. Doors, NPCs
 * and sprites without scenario data keep sprite.x.
 */
export function aimX(sprite) {
    if (!sprite || !Number.isFinite(sprite.x)) return sprite ? sprite.x : 0;
    if (sprite._isNPC || sprite.doorProperties || !sprite.scenarioData) return sprite.x;
    if (sprite.rotation && typeof sprite.getBounds === 'function') {
        try {
            const b = sprite.getBounds();
            if (b && b.width > 0) return b.centerX ?? (b.left + b.width / 2);
        } catch (e) { /* fall through */ }
    }
    const w = sprite.displayWidth ?? sprite.width ?? 0;
    if (!(w > 0)) return sprite.x;
    return sprite.x - (sprite.originX ?? 0.5) * w + w / 2;
}

/**
 * Drop swivel chairs from a tap's pick list when anything else was gathered with
 * them: a chair pushed under a desk shouldn't turn "the keyboard" into a
 * "Mail Workstation / chair" menu. Chairs on their own are left as they are.
 *
 * @param {Array<{isChair?:boolean}>} candidates
 * @returns {Array} candidates without chairs, or all of them if only chairs
 */
export function withoutChairsIfOthers(candidates) {
    const others = candidates.filter(c => !c.isChair);
    return others.length ? others : candidates;
}

// "Walking away" (q55 d): an owner who has just left the PC is still beside it for a
// moment, and a tap on the PC used to open a conversation with them instead (access
// model step 9 playtests). A velocity at the moment of the tap was not enough: seen
// from behind, every walking NPC is walking away, so a player following an NPC to
// talk to them lost the click to whatever the NPC crossed, and a hostile NPC knocked
// back by a hit looked like one leaving (code review R1 M3). So it takes a sustained
// walk: over the last WALK_AWAY_WINDOW_MS the NPC kept moving away, the gap between
// them grew, and the player did not move towards them. Never a hostile NPC, nor one
// in knockback.
const WALK_AWAY_WINDOW_MS = 600;
const WALK_AWAY_MIN_SPAN_MS = 300;   // samples must cover at least this much of the window
const WALK_AWAY_SAMPLE_MS = 80;      // how often positions are sampled (game.js update)
const WALK_AWAY_MIN_TRAVEL_PX = 10;  // the NPC moved at least this far in the window
const WALK_AWAY_MIN_GAIN_PX = 8;     // and the gap between them grew by at least this
const PLAYER_CLOSING_PX = 4;         // the player moved at most this far towards them

function W() { return typeof window !== 'undefined' ? window : {}; }

/** Recent positions of the player and the NPCs, sampled from game.js update(). */
export class WalkAwayTracker {
    constructor() {
        this.tracks = new WeakMap();
        this.lastSampleAt = -Infinity;
    }

    _push(obj, now) {
        if (!obj || !Number.isFinite(obj.x) || !Number.isFinite(obj.y)) return;
        let track = this.tracks.get(obj);
        if (!track) { track = []; this.tracks.set(obj, track); }
        track.push({ t: now, x: obj.x, y: obj.y });
        while (track.length > 1 && now - track[0].t > WALK_AWAY_WINDOW_MS * 2) track.shift();
    }

    /**
     * Note where the player and each NPC are (throttled to WALK_AWAY_SAMPLE_MS).
     * @param {object} player
     * @param {Iterable<object>|function(): Iterable<object>} sprites - the NPC sprites, or a function giving them
     * @param {number} now - ms
     */
    sample(player, sprites, now) {
        if (now - this.lastSampleAt < WALK_AWAY_SAMPLE_MS) return false;
        this.lastSampleAt = now;
        this._push(player, now);
        const list = typeof sprites === 'function' ? sprites() : sprites;
        for (const s of (list || [])) this._push(s, now);
        return true;
    }

    /** The oldest sample within the window, or null when the samples cover too little of it. */
    _oldest(obj, now) {
        const track = this.tracks.get(obj);
        if (!track) return null;
        const first = track.find(p => now - p.t <= WALK_AWAY_WINDOW_MS);
        if (!first || now - first.t < WALK_AWAY_MIN_SPAN_MS) return null;
        return first;
    }

    /** The player's sample nearest to time t. */
    _near(obj, t) {
        const track = this.tracks.get(obj);
        if (!track || !track.length) return null;
        return track.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best), track[0]);
    }

    walkingAway(player, sprite, now) {
        if (!player || !sprite) return false;
        if (sprite.knockbackTimer) return false;
        const hostile = W().npcHostileSystem?.isNPCHostile;
        if (sprite.npcId && typeof hostile === 'function') {
            try { if (hostile(sprite.npcId)) return false; } catch (e) { /* treat as not hostile */ }
        }
        // Still walking now, away from the player
        const v = sprite.body?.velocity;
        if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || Math.hypot(v.x, v.y) < 10) return false;
        const gx = sprite.x - player.x;
        const gy = sprite.y - player.y;
        const gap = Math.hypot(gx, gy);
        if (!(gap > 0) || v.x * gx + v.y * gy <= 0) return false;
        // ...and over the window
        const n0 = this._oldest(sprite, now);
        const p0 = n0 && this._near(player, n0.t);
        if (!n0 || !p0) return false;
        const mx = sprite.x - n0.x;
        const my = sprite.y - n0.y;
        if (Math.hypot(mx, my) < WALK_AWAY_MIN_TRAVEL_PX || mx * gx + my * gy <= 0) return false;
        if (gap - Math.hypot(n0.x - p0.x, n0.y - p0.y) < WALK_AWAY_MIN_GAIN_PX) return false;
        // The player not following: no move towards them over the window, nor now
        const closing = ((player.x - p0.x) * gx + (player.y - p0.y) * gy) / gap;
        if (closing > PLAYER_CLOSING_PX) return false;
        const pv = player.body?.velocity;
        if (pv && Number.isFinite(pv.x) && Number.isFinite(pv.y) && (pv.x * gx + pv.y * gy) / gap > 10) return false;
        return true;
    }
}

export const walkAwayTracker = new WalkAwayTracker();
if (typeof window !== 'undefined') window.walkAwayTracker = walkAwayTracker;

/**
 * An NPC walking away from the player, on the tracker's samples (see WalkAwayTracker).
 * @param {object} player
 * @param {object} sprite - the NPC sprite
 * @param {number} [now]
 * @param {WalkAwayTracker} [tracker]
 */
export function npcWalkingAway(player, sprite, now = Date.now(), tracker = walkAwayTracker) {
    return tracker.walkingAway(player, sprite, now);
}

/**
 * An NPC on the move who has left one of `objectIds` (their own workstation, or a hot desk
 * they left signed in), by the workstation state's away record, which the needs system's
 * npc_left_post sets as they get up. The tracker alone misses the commonest case (lab UX
 * review R2 m1): a player who has just walked up to the desk reads as following an owner who
 * leaves the same way, and she is gone before the window clears. This does not loosen the
 * follower rule for anyone else: it needs her own PC in the tap. Never a hostile NPC, nor
 * one in knockback, nor one standing still.
 *
 * @param {object} sprite - the NPC sprite
 * @param {Iterable<string>} objectIds - ids of the objects under the tap (or in reach)
 * @param {{leftBy: function(string, string): boolean}} [ws] - window.workstationState
 */
export function npcLeftObject(sprite, objectIds, ws = W().workstationState) {
    if (!sprite?.npcId || !ws || typeof ws.leftBy !== 'function') return false;
    if (sprite.knockbackTimer) return false;
    const hostile = W().npcHostileSystem?.isNPCHostile;
    if (typeof hostile === 'function') {
        try { if (hostile(sprite.npcId)) return false; } catch (e) { /* treat as not hostile */ }
    }
    const v = sprite.body?.velocity;
    if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || Math.hypot(v.x, v.y) < 10) return false;
    for (const id of (objectIds || [])) {
        if (!id) continue;
        try { if (ws.leftBy(id, sprite.npcId)) return true; } catch (e) { /* no answer: not left */ }
    }
    return false;
}

/** The id an object sprite is known by (scenario id first). */
export function objectIdOf(obj) {
    return obj?.scenarioData?.id ?? obj?.objectId ?? null;
}

/**
 * Whether an NPC gives way to an object near the player: walking away (the tracker), or
 * on the move from one of `objectIds` they have just left (npcLeftObject).
 */
export function npcGivesWay(player, sprite, objectIds = [], now = Date.now(), tracker = walkAwayTracker) {
    return npcWalkingAway(player, sprite, now, tracker) || npcLeftObject(sprite, objectIds);
}

/**
 * Drop NPCs who are walking away from a tap's pick list when an object (not a chair)
 * was gathered with them: the player tapped the thing, not the person leaving it.
 * The NPC stays when nothing else is there.
 *
 * @param {Array<{isObject?:boolean, isChair?:boolean, leavingNpc?:boolean}>} candidates
 */
export function withoutLeavingNpcsIfObjects(candidates) {
    if (!candidates.some(c => c.isObject && !c.isChair)) return candidates;
    return candidates.filter(c => !c.leavingNpc);
}
